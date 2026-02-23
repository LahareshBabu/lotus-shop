import os
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# 1. Load keys securely directly from your Next.js environment file
load_dotenv("../.env.local")
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# 2. Connect to the live Supabase database
supabase: Client = create_client(url, key)

def get_recommendations(target_item_id: int):
    # 3. Fetch real jewelry data from the cloud (we don't even ask for 'gallery'!)
    response = supabase.table("products").select("id, name, category, description").execute()
    
    # 4. The Filing Clerk (Pandas) organizes the data into a spreadsheet
    df = pd.DataFrame(response.data)
    
    # Safety Check: If database is empty or the item ID doesn't exist
    if df.empty or target_item_id not in df['id'].values:
        return []

    # 5. BULLETPROOF DATA ENGINEERING: 
    # Fill NULLs with blank spaces (protects the server if you forget a description in the future)
    df['description'] = df['description'].fillna('')
    df['category'] = df['category'].fillna('')
    
    # LEAD ENGINEER TWEAK: Multiply the category by 5 so it dominates the math!
    df['combined_text'] = df['name'] + " " + (df['category'] + " ") * 50 + df['description']

    # 6. The Math Tool (TF-IDF) converts the combined text into algebraic numbers
    vectorizer = TfidfVectorizer(stop_words='english')
    matrix = vectorizer.fit_transform(df['combined_text'])
    
    # 7. The Genius (Cosine Similarity) calculates the angle between the numbers
    similarity_scores = cosine_similarity(matrix)
    
    # 8. Find the exact item the customer is looking at
    target_index = df[df['id'] == target_item_id].index[0]
    
    # 9. Find the highest matching scores (excluding the item itself)
    item_scores = list(enumerate(similarity_scores[target_index]))
    item_scores = sorted(item_scores, key=lambda x: x[1], reverse=True)
    
    # Grab the top 2 mathematical matches
    top_matches = item_scores[1:31] 
    
    # Return the clean results
    recommended_items = [
        {
            "id": int(df.iloc[i[0]]['id']), 
            "name": str(df.iloc[i[0]]['name']), 
            "match_score": round(float(i[1]) * 100, 2)
        } for i in top_matches
    ]
    return recommended_items

# --- TEST THE ENGINE ---
if __name__ == "__main__":
    # We test ID 5 because we just gave it that massive, rich-text description!
    print("Customer is looking at: Item #5 (Master Key Necklace)")
    print("Genius AI Recommends:")
    print(get_recommendations(5))