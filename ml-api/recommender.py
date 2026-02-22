import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# 1. We create a tiny fake database just to test the math
mock_db = [
    {"id": 1, "name": "Premium White Stone Jhumka", "description": "Elegant white crystal cubic zirconia bridal jhumka"},
    {"id": 2, "name": "Majestic Chevron Jhumka", "description": "Premium white cubic zirconia floral dome jhumka"},
    {"id": 3, "name": "Simple Gold Chain", "description": "Everyday wear plain 24k gold chain necklace"},
    {"id": 4, "name": "Royal Peacock Kemp", "description": "Traditional red green ruby peacock design jhumka"}
]

def get_recommendations(target_item_id: int):
    # 2. The Filing Clerk (Pandas) organizes the data into a spreadsheet
    df = pd.DataFrame(mock_db)
    
    # 3. The Math Tool (TF-IDF) converts English words into algebraic numbers
    vectorizer = TfidfVectorizer()
    matrix = vectorizer.fit_transform(df['description'])
    
    # 4. The Genius (Cosine Similarity) calculates the angle between the numbers
    similarity_scores = cosine_similarity(matrix)
    
    # 5. Find the exact item the customer is looking at
    target_index = df[df['id'] == target_item_id].index[0]
    
    # 6. Find the highest matching scores (excluding the item itself)
    item_scores = list(enumerate(similarity_scores[target_index]))
    item_scores = sorted(item_scores, key=lambda x: x[1], reverse=True)
    
    # Grab the top 2 mathematical matches
    top_matches = item_scores[1:3] 
    
    # Return the results
    recommended_items = [{"id": df.iloc[i[0]]['id'], "name": df.iloc[i[0]]['name'], "match_score": round(i[1] * 100, 2)} for i in top_matches]
    return recommended_items

# --- TEST THE ENGINE ---
if __name__ == "__main__":
    print("Customer is looking at: Item #1 (Premium White Stone Jhumka)")
    print("Genius AI Recommends:")
    print(get_recommendations(1))