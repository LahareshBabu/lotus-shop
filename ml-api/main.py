from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from recommender import get_recommendations
from collaborative import get_collaborative_recommendations
from datetime import datetime, timezone
import os
import random
from supabase import create_client, Client

# Initialize Supabase client
SUPABASE_URL = "https://fwyliqsazdyprlkemavu.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "Online",
        "message": "Lotus Machine Learning Engine is ready."
    }

@app.get("/api/recommend/{item_id}")
def get_product_recommendations(item_id: int):
    try:
        # 50/50 routing split
        if random.choice([True, False]):
            recommendations = get_collaborative_recommendations(item_id)
            model_used = "collaborative"
            
            # Fallback if no history exists for the item
            if not recommendations:
                recommendations = get_recommendations(item_id)
                model_used = "content_fallback"
        else:
            recommendations = get_recommendations(item_id)
            model_used = "content"

        return {
            "target_item_id": item_id, 
            "model_used": model_used,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class Interaction(BaseModel):
    user_id: str
    product_id: int
    event_type: str
    recommendation_model: str = "none"

@app.post("/api/track")
async def track_interaction(interaction: Interaction):
    # Insert interaction data directly into the Supabase database
    try:
        data, count = supabase.table('interactions').insert({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": interaction.user_id,
            "product_id": interaction.product_id,
            "event_type": interaction.event_type,
            "recommendation_model": interaction.recommendation_model
        }).execute()
        
        return {"status": "success", "message": f"{interaction.event_type} logged to Supabase"}
    except Exception as e:
        print(f"Error logging to Supabase: {e}")
        return {"status": "error", "message": "Failed to log interaction"}