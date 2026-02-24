import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os
import requests # 🚀 ADDED: To fetch names from Supabase

# 1. YOUR SUPABASE CONFIGURATION
SUPABASE_URL = "https://fwyliqsazdyprlkemavu.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"

def fetch_product_names():
    """Fetches the ID and Name of all products from Supabase to translate math back into English."""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    response = requests.get(f"{SUPABASE_URL}/rest/v1/products?select=id,name", headers=headers)
    if response.status_code != 200:
        print("❌ Failed to fetch products from Supabase!")
        return {}
    
    # Create a quick lookup dictionary: {14: "Majestic Chevron...", 7: "Royal Peacock..."}
    return {p['id']: p['name'] for p in response.json()}

def get_collaborative_recommendations(target_item_id, top_n=5):
    """
    Ivy League Data Science Pipeline: Item-Item Collaborative Filtering via SVD
    """
    file_path = "interactions.csv"
    if not os.path.exists(file_path):
        return []

    # 1. LOAD THE DATA LAKE
    # We use Pandas to instantly read the 6,700+ rows you generated
    df = pd.read_csv(file_path)
    if df.empty:
        return []

    # 2. IMPLICIT FEEDBACK WEIGHTING
    # Users didn't leave 5-star reviews, so we infer their preference mathematically.
    event_weights = {
        'view': 1.0,
        'wishlist': 2.0,
        'add_to_cart': 3.0
    }
    df['score'] = df['event_type'].map(event_weights)

    # 3. CREATE THE USER-ITEM MATRIX
    # Rows = Users, Columns = Product IDs. We sum the scores if they clicked multiple times.
    interaction_matrix = df.groupby(['user_id', 'product_id'])['score'].sum().unstack(fill_value=0)

    # If the target item hasn't been clicked by anyone yet (Cold Start!), return empty
    if target_item_id not in interaction_matrix.columns:
        return []

    # 4. MATRIX FACTORIZATION (SVD)
    # We transpose so items are rows and users are columns
    item_user_matrix = interaction_matrix.T
    
    # We smash the data down to find "hidden latent features". 
    # Max 20 dimensions, but scales down safely if the database is small.
    n_components = min(20, item_user_matrix.shape[1] - 1, item_user_matrix.shape[0] - 1)
    
    if n_components < 1:
        # Fallback if the matrix is too tiny
        similarity_matrix = cosine_similarity(item_user_matrix)
    else:
        # The true Machine Learning magic
        svd = TruncatedSVD(n_components=n_components, random_state=42)
        item_factors = svd.fit_transform(item_user_matrix)
        # Calculate the geometric distance between the compressed behavioral data
        similarity_matrix = cosine_similarity(item_factors)

    # 5. EXTRACT THE NEAREST NEIGHBORS
    item_indices = list(item_user_matrix.index)
    target_index = item_indices.index(target_item_id)

    # Pair each item index with its similarity score, then sort them highest to lowest
    similarity_scores = list(enumerate(similarity_matrix[target_index]))
    similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)

    # 🚀 NEW: Grab the dictionary of names from Supabase
    product_dict = fetch_product_names()

    recommendations = []
    # Skip the very first result (it will always be the item itself comparing to itself)
    for i, score in similarity_scores[1:top_n+1]:
        recommended_item_id = int(item_indices[i])
        item_name = product_dict.get(recommended_item_id, "Unknown Product")
        
        # 🚀 NEW: Standardize the output so it exactly matches the Content-Based brain!
        recommendations.append({
            "id": recommended_item_id,
            "name": item_name,
            "match_score": round(float(score) * 100, 2) # Convert decimal math to a clean percentage
        })

    return recommendations

# --- Quick Local Test ---
if __name__ == "__main__":
    import json
    # Test the math locally. Pick an ID from your database that you know exists!
    test_id = 14 
    print(f"Collaborative Recommendations for Item {test_id}:")
    print(json.dumps(get_collaborative_recommendations(test_id), indent=2))