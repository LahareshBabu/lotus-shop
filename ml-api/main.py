from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from recommender import get_recommendations

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
    recommendations = get_recommendations(item_id)
    
    return {
        "target_item_id": item_id, 
        "recommendations": recommendations
    }