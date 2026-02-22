from fastapi import FastAPI
from recommender import get_recommendations

# 1. Initialize the Walkie-Talkie
app = FastAPI()

# 2. Open the basic communication channel
@app.get("/")
def read_root():
    return {
        "status": "Online",
        "message": "Lotus Machine Learning Engine is ready."
    }

# 3. Create a special radio channel just for recommendations
@app.get("/api/recommend/{item_id}")
def get_product_recommendations(item_id: int):
    # Ask the Genius Brain to do the math
    recommendations = get_recommendations(item_id)
    
    # Clean up the NumPy math tags so Next.js can read it easily
    clean_recommendations = [
        {
            "id": int(rec["id"]), 
            "name": str(rec["name"]), 
            "match_score": float(rec["match_score"])
        } 
        for rec in recommendations
    ]
    
    return {
        "target_item_id": item_id, 
        "recommendations": clean_recommendations
    }