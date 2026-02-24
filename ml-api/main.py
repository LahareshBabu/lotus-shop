from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from recommender import get_recommendations
from datetime import datetime
import csv
import os

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

# 3. Create a special radio channel just for recommendations
@app.get("/api/recommend/{item_id}")
def get_product_recommendations(item_id: int):
    # Ask the Genius Brain to do the math (it already cleans the data perfectly!)
    try:
        recommendations = get_recommendations(item_id)
        return {
            "target_item_id": item_id, 
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
        
        # Write the actual data row
        writer.writerow([
            datetime.utcnow().isoformat(),
            interaction.user_id,
            interaction.product_id,
            interaction.event_type,
            interaction.recommendation_model
        ])
        
    return {"status": "success", "message": f"{interaction.event_type} logged to Data Lake"}