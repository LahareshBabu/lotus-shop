from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from recommender import get_recommendations
from collaborative import get_collaborative_recommendations # 🧠 IMPORT THE NEW BEHAVIOR BRAIN
from datetime import datetime, timezone
import csv
import os
import random # 🎲 IMPORT RANDOM FOR THE COIN FLIP

# 1. Initialize the Walkie-Talkie
app = FastAPI()

# SECURITY (CORS): Tell the bouncer to let Next.js (port 3000) inside!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Open the basic communication channel
@app.get("/")
def read_root():
    return {
        "status": "Online",
        "message": "Lotus Machine Learning Engine is ready."
    }

# 3. Create a special radio channel just for recommendations (NOW WITH A/B TESTING!)
@app.get("/api/recommend/{item_id}")
def get_product_recommendations(item_id: int):
    # Ask the Genius Brains to do the math!
    try:
        # 🎲 THE COIN FLIP: 50% chance for True, 50% chance for False
        if random.choice([True, False]):
            # HEADS: Try the new Collaborative Filtering Brain (Behavior)
            recommendations = get_collaborative_recommendations(item_id)
            model_used = "collaborative"
            
            # 🛡️ COLD START FALLBACK: If item has no history, catch it and use Content instead!
            if not recommendations:
                recommendations = get_recommendations(item_id)
                model_used = "content_fallback"
        else:
            # TAILS: Use the original Content-Based Brain (Words)
            recommendations = get_recommendations(item_id)
            model_used = "content"

        # Return the item, the recommendations, AND the secret label of which brain was used
        return {
            "target_item_id": item_id, 
            "model_used": model_used,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------
# 🚀 4. THE NEW TELEMETRY ENDPOINT (Data Science Pipeline)
# ---------------------------------------------------------

# Define what a "breadcrumb" looks like
class Interaction(BaseModel):
    user_id: str
    product_id: int
    event_type: str # e.g., 'view', 'click', 'add_to_cart'
    recommendation_model: str = "none" # e.g., 'content_based', 'collaborative', or 'none'

@app.post("/api/track")
async def track_interaction(interaction: Interaction):
    # This acts as our mini "Data Lake" for future Machine Learning
    file_path = "interactions.csv"
    file_exists = os.path.isfile(file_path)
    
    # Open the CSV file and append the new breadcrumb
    with open(file_path, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # If the file was just created, write the column headers first
        if not file_exists:
            writer.writerow(["timestamp", "user_id", "product_id", "event_type", "recommendation_model"])
        
        # Write the actual data row (FUTURE-PROOFED)
        writer.writerow([
            datetime.now(timezone.utc).isoformat(),
            interaction.user_id,
            interaction.product_id,
            interaction.event_type,
            interaction.recommendation_model
        ])
        
    return {"status": "success", "message": f"{interaction.event_type} logged to Data Lake"}