import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
from supabase import create_client, Client

SUPABASE_URL = "https://fwyliqsazdyprlkemavu.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Global cache for in-memory speed optimization
_cached_interactions_df = None
_cached_product_dict = None

def fetch_product_names():
    global _cached_product_dict
    if _cached_product_dict is not None:
        return _cached_product_dict

    response = supabase.table("products").select("id, name").execute()
    if not response.data:
        return {}
    
    _cached_product_dict = {p['id']: p['name'] for p in response.data}
    return _cached_product_dict

def get_collaborative_recommendations(target_item_id, top_n=5):
    global _cached_interactions_df

    # Load data from Supabase once and cache it in RAM
    if _cached_interactions_df is None:
        response = supabase.table("interactions").select("user_id, product_id, event_type").limit(10000).execute()
        if not response.data:
            return []
        _cached_interactions_df = pd.DataFrame(response.data)

    df = _cached_interactions_df

    event_weights = {
        'view': 1.0,
        'wishlist': 2.0,
        'add_to_cart': 3.0
    }
    df['score'] = df['event_type'].map(event_weights)

    interaction_matrix = df.groupby(['user_id', 'product_id'])['score'].sum().unstack(fill_value=0)

    if target_item_id not in interaction_matrix.columns:
        return []

    item_user_matrix = interaction_matrix.T
    
    n_components = min(20, item_user_matrix.shape[1] - 1, item_user_matrix.shape[0] - 1)
    
    if n_components < 1:
        similarity_matrix = cosine_similarity(item_user_matrix)
    else:
        svd = TruncatedSVD(n_components=n_components, random_state=42)
        item_factors = svd.fit_transform(item_user_matrix)
        similarity_matrix = cosine_similarity(item_factors)

    item_indices = list(item_user_matrix.index)
    target_index = item_indices.index(target_item_id)

    similarity_scores = list(enumerate(similarity_matrix[target_index]))
    similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)

    product_dict = fetch_product_names()

    recommendations = []
    for i, score in similarity_scores[1:top_n+1]:
        recommended_item_id = int(item_indices[i])
        item_name = product_dict.get(recommended_item_id, "Unknown Product")
        
        recommendations.append({
            "id": recommended_item_id,
            "name": item_name,
            "match_score": round(float(score) * 100, 2)
        })

    return recommendations

if __name__ == "__main__":
    import json
    test_id = 14 
    print(f"Collaborative Recommendations for Item {test_id}:")
    print(json.dumps(get_collaborative_recommendations(test_id), indent=2))