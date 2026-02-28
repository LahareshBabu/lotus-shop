import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Securely load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Global cache for in-memory speed optimization
_cached_products_df = None

def get_recommendations(target_item_id: int):
    global _cached_products_df

    # Load data from Supabase once and cache it in RAM
    if _cached_products_df is None:
        response = supabase.table("products").select("id, name, category, description").execute()
        if not response.data:
            return []
        _cached_products_df = pd.DataFrame(response.data)
    
    df = _cached_products_df
    
    if df.empty or target_item_id not in df['id'].values:
        return []

    df['description'] = df['description'].fillna('')
    df['category'] = df['category'].fillna('')
    
    df['combined_text'] = df['name'] + " " + (df['category'] + " ") * 50 + df['description']

    vectorizer = TfidfVectorizer(stop_words='english')
    matrix = vectorizer.fit_transform(df['combined_text'])
    
    similarity_scores = cosine_similarity(matrix)
    
    target_index = df[df['id'] == target_item_id].index[0]
    
    item_scores = list(enumerate(similarity_scores[target_index]))
    item_scores = sorted(item_scores, key=lambda x: x[1], reverse=True)
    
    top_matches = item_scores[1:31] 
    
    recommended_items = [
        {
            "id": int(df.iloc[i[0]]['id']), 
            "name": str(df.iloc[i[0]]['name']), 
            "match_score": round(float(i[1]) * 100, 2)
        } for i in top_matches
    ]
    return recommended_items

if __name__ == "__main__":
    print("Customer is looking at: Item #5 (Master Key Necklace)")
    print("AI Recommends:")
    print(get_recommendations(5))