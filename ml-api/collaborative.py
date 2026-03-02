import os
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
from supabase import create_client, Client

# =====================================================================
# 1. THE MATH ENGINE (Separation of Concerns)
# =====================================================================
class SVDRecommender:
    def __init__(self, n_components=20):
        self.n_components = n_components
        self.svd = TruncatedSVD(random_state=42)
        self.user_indices = []
        self.item_indices = []
        self.user_factors = None
        self.item_factors = None
        self.similarity_matrix = None

    def fit(self, df):
        """Trains the SVD model using your exact original matrix logic."""
        # Check if we need to apply weights (for production event data)
        if 'score' not in df.columns and 'event_type' in df.columns:
            event_weights = {'view': 1.0, 'wishlist': 2.0, 'add_to_cart': 3.0}
            df['score'] = df['event_type'].map(event_weights)
        # Or if we are running the benchmark with explicit ratings
        elif 'rating' in df.columns and 'score' not in df.columns:
            df['score'] = df['rating']

        # Your exact original logic for building the matrix
        interaction_matrix = df.groupby(['user_id', 'product_id'])['score'].sum().unstack(fill_value=0)
        item_user_matrix = interaction_matrix.T
        
        self.user_indices = list(interaction_matrix.index)
        self.item_indices = list(item_user_matrix.index)

        n_comps = min(self.n_components, item_user_matrix.shape[1] - 1, item_user_matrix.shape[0] - 1)
        
        if n_comps < 1:
            self.similarity_matrix = cosine_similarity(item_user_matrix)
            self.item_factors = item_user_matrix.values
            self.user_factors = interaction_matrix.values
        else:
            self.svd.n_components = max(1, n_comps)
            self.item_factors = self.svd.fit_transform(item_user_matrix)
            self.user_factors = self.svd.components_.T
            self.similarity_matrix = cosine_similarity(self.item_factors)
            
        return self

    def predict(self, user_id, product_id):
        """Predicts exact interaction score (Used by Scientific Benchmarks)."""
        if user_id not in self.user_indices or product_id not in self.item_indices:
            return 0.0 # Cold start fallback
            
        u_idx = self.user_indices.index(user_id)
        i_idx = self.item_indices.index(product_id)
        return np.dot(self.user_factors[u_idx, :], self.item_factors[i_idx, :].T)

    def get_similar_items(self, target_item_id, top_n=5):
        """Returns similar items (Used by the Live Production API)."""
        if target_item_id not in self.item_indices or self.similarity_matrix is None:
            return []
            
        target_index = self.item_indices.index(target_item_id)
        similarity_scores = list(enumerate(self.similarity_matrix[target_index]))
        similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)
        
        return [(self.item_indices[i], float(score)) for i, score in similarity_scores[1:top_n+1]]


# =====================================================================
# 2. THE INFRASTRUCTURE & API LOGIC
# =====================================================================
# Securely load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Global caches for in-memory speed optimization
_cached_interactions_df = None
_cached_product_dict = None
_cached_svd_model = None

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
    global _cached_interactions_df, _cached_svd_model

    # Load data from Supabase once and cache it in RAM
    if _cached_interactions_df is None:
        response = supabase.table("interactions").select("user_id, product_id, event_type").limit(10000).execute()
        if not response.data:
            return []
        _cached_interactions_df = pd.DataFrame(response.data)

    # Train the SVD model once and cache the brain in RAM (Massive speed boost!)
    if _cached_svd_model is None:
        _cached_svd_model = SVDRecommender(n_components=20)
        _cached_svd_model.fit(_cached_interactions_df)

    similar_items = _cached_svd_model.get_similar_items(target_item_id, top_n)
    
    if not similar_items:
        return []

    product_dict = fetch_product_names()

    recommendations = []
    for recommended_item_id, score in similar_items:
        item_name = product_dict.get(recommended_item_id, "Unknown Product")
        
        recommendations.append({
            "id": recommended_item_id,
            "name": item_name,
            "match_score": round(score * 100, 2)
        })

    return recommendations

if __name__ == "__main__":
    import json
    test_id = 14 
    print(f"Collaborative Recommendations for Item {test_id}:")
    print(json.dumps(get_collaborative_recommendations(test_id), indent=2))