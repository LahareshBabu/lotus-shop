from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from recommender import get_recommendations, get_bestseller
from collaborative import get_collaborative_recommendations
from market_basket import get_fbt_recommendation
from datetime import datetime, timezone, timedelta
import os
import random
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# Securely load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# =========================================================
# 🌟 ENTERPRISE API METADATA
# =========================================================
app = FastAPI(
    title="Lotus Engine: Machine Learning & Demand Forecasting API",
    description="""Enterprise-grade microservice powering the Lotus luxury e-commerce platform.

**Core Capabilities:**
* **Recommendation Engine:** A/B tests between Collaborative Filtering (SVD) and Content-Based (TF-IDF/SGD) algorithms.
* **Market Basket Analysis (FBT):** Apriori algorithm with Chi-Square significance testing for 'Frequently Bought Together' upsells.
* **Telemetry Tracking:** Captures real-time user interactions (views, purchases) to feed the ML models.
* **Demand Forecasting:** Utilizes Weighted Time-Series Algorithms anchored to real-time purchase data to predict inventory requirements.
""",
    version="1.0.0",
    contact={
        "name": "Lotus Development Team",
        "url": "http://localhost:3000",
    },
    docs_url=None,  # Disable default docs to inject the slider toggle below
    redoc_url=None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# 🌟 CUSTOM SWAGGER WITH ANDROID-STYLE TOGGLE 🌟
# =========================================================
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    html_response = get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI"
    )
    
    # Comprehensive CSS to fix every single text color inversion for Dark Mode
    custom_html = """
    <style>
        /* Android-Style Toggle Switch */
        .theme-switch-wrapper {
            position: absolute;
            top: 15px;
            right: 120px;
            display: flex;
            align-items: center;
            z-index: 9999;
        }
        .theme-switch {
            display: inline-block;
            height: 24px;
            position: relative;
            width: 44px;
            margin-right: 10px;
        }
        .theme-switch input {
            display: none;
        }
        .slider {
            background-color: #ccc;
            bottom: 0;
            cursor: pointer;
            left: 0;
            position: absolute;
            right: 0;
            top: 0;
            transition: .4s;
            border-radius: 24px;
        }
        .slider:before {
            background-color: #fff;
            bottom: 3px;
            content: "";
            height: 18px;
            left: 3px;
            position: absolute;
            transition: .4s;
            width: 18px;
            border-radius: 50%;
        }
        input:checked + .slider {
            background-color: #4CAF50;
        }
        input:checked + .slider:before {
            transform: translateX(20px);
        }
        #theme-label {
            font-family: sans-serif;
            font-size: 13px;
            font-weight: bold;
            color: #333;
        }

        /* ========================================= */
        /* STANDARD DARK MODE OVERRIDES (The Fixes)  */
        /* ========================================= */
        body.dark-theme { background-color: #121212; color: #e0e0e0; }
        body.dark-theme #theme-label { color: #e0e0e0; }
        body.dark-theme .swagger-ui { color: #e0e0e0; }
        
        /* Main Headers & Info Text */
        body.dark-theme .swagger-ui .info .title, 
        body.dark-theme .swagger-ui .info h1, 
        body.dark-theme .swagger-ui .info h2, 
        body.dark-theme .swagger-ui .info h3, 
        body.dark-theme .swagger-ui .info h4, 
        body.dark-theme .swagger-ui .info h5, 
        body.dark-theme .swagger-ui .info p,
        body.dark-theme .swagger-ui .info li,
        body.dark-theme .swagger-ui .info a { color: #e0e0e0; }

        /* Fix: Endpoint Description Text & Bullet Points (Markdown) */
        body.dark-theme .swagger-ui .markdown p,
        body.dark-theme .swagger-ui .markdown li,
        body.dark-theme .swagger-ui .markdown strong { color: #e0e0e0 !important; }

        /* Fix: The main Route Tags (System, Recommendations, Telemetry) */
        body.dark-theme .swagger-ui .opblock-tag { color: #e0e0e0 !important; border-bottom-color: #333; }
        body.dark-theme .swagger-ui .opblock-tag small { color: #aaa; }

        /* Opblocks / Containers */
        body.dark-theme .swagger-ui .scheme-container { background-color: #1e1e1e; box-shadow: none; border-bottom: 1px solid #333; }
        body.dark-theme .swagger-ui .opblock { background-color: #1e1e1e; border-color: #333; }
        body.dark-theme .swagger-ui .opblock .opblock-summary { border-color: #333; }
        body.dark-theme .swagger-ui .opblock .opblock-summary-path { color: #e0e0e0; }
        body.dark-theme .swagger-ui .opblock .opblock-summary-description { color: #aaa; }
        body.dark-theme .swagger-ui .opblock-description-wrapper p { color: #e0e0e0; }
        
        /* Fix: Table Headers (Code, Description) */
        body.dark-theme .swagger-ui table thead tr th { color: #e0e0e0 !important; border-bottom-color: #333; }
        body.dark-theme .swagger-ui table tbody tr td { border-bottom-color: #333; color: #e0e0e0; }
        
        /* Fix: Tabs (Example Value, Schema) */
        body.dark-theme .swagger-ui .tab li { color: #aaa; }
        body.dark-theme .swagger-ui .tab li.active { color: #e0e0e0 !important; border-bottom-color: #e0e0e0; }
        
        /* Parameters Text */
        body.dark-theme .swagger-ui .parameter__name { color: #e0e0e0; }
        body.dark-theme .swagger-ui .parameter__type { color: #aaa; }
        
        /* ========================================= */
        /* SCHEMAS FORMATTING FIX                    */
        /* ========================================= */
        body.dark-theme .swagger-ui section.models { background-color: #1e1e1e; border-color: #333; }
        body.dark-theme .swagger-ui section.models h4 { color: #e0e0e0; border-bottom-color: #333; }
        body.dark-theme .swagger-ui section.models h4:hover { background-color: #2a2a2a; }
        
        /* Fix: Destroys the white background highlight over Schema titles */
        body.dark-theme .swagger-ui .model-title,
        body.dark-theme .swagger-ui .model-title__text { 
            color: #e0e0e0 !important; 
            background-color: transparent !important; 
        }
        
        body.dark-theme .swagger-ui .model { color: #e0e0e0; }
        body.dark-theme .swagger-ui .model-box { background-color: #1a1a1a; border-color: #333; }
        body.dark-theme .swagger-ui .prop-type { color: #88aaff; }
        body.dark-theme .swagger-ui .property.required { color: #e0e0e0; }
        
        /* Inputs & Misc */
        body.dark-theme .swagger-ui select, 
        body.dark-theme .swagger-ui input, 
        body.dark-theme .swagger-ui textarea { background-color: #333; color: #fff; border: 1px solid #555; }
        body.dark-theme .swagger-ui .responses-inner h4, 
        body.dark-theme .swagger-ui .responses-inner h5 { color: #e0e0e0; }
        body.dark-theme .swagger-ui .topbar { background-color: #1e1e1e; border-bottom: 1px solid #333; }
        body.dark-theme .swagger-ui svg { fill: #e0e0e0; }
        body.dark-theme .swagger-ui .model-toggle:after { filter: invert(1); }
    </style>

    <script>
        document.addEventListener("DOMContentLoaded", function() {
            // Build the Android style toggle
            const wrapper = document.createElement("div");
            wrapper.className = "theme-switch-wrapper";
            
            const label = document.createElement("label");
            label.className = "theme-switch";
            label.htmlFor = "checkbox";
            
            const input = document.createElement("input");
            input.type = "checkbox";
            input.id = "checkbox";
            
            const slider = document.createElement("div");
            slider.className = "slider round";
            
            const textLabel = document.createElement("span");
            textLabel.id = "theme-label";
            textLabel.innerText = "Light Mode";
            
            label.appendChild(input);
            label.appendChild(slider);
            wrapper.appendChild(label);
            wrapper.appendChild(textLabel);
            
            document.body.appendChild(wrapper);
            
            // Listen for clicks
            input.addEventListener("change", function() {
                if(this.checked) {
                    document.body.classList.add("dark-theme");
                    textLabel.innerText = "Dark Mode";
                } else {
                    document.body.classList.remove("dark-theme");
                    textLabel.innerText = "Light Mode";
                }
            });
        });
    </script>
    """
    html_str = html_response.body.decode("utf-8")
    html_str = html_str.replace("</body>", f"{custom_html}</body>")
    return HTMLResponse(html_str)

# =========================================================
# 🌟 PYDANTIC SCHEMAS (Strict Typing for Swagger UI)
# =========================================================
class RootResponse(BaseModel):
    status: str = Field(..., example="Online")
    message: str = Field(..., example="Lotus Machine Learning Engine is ready.")

class RecommendationResponse(BaseModel):
    target_item_id: int = Field(..., example=12)
    model_used: str = Field(..., example="collaborative")
    recommendations: List[Any] = Field(...) # 🌟 THE FIX: Allows dictionaries or integers safely

# 🌟 NEW FBT SCHEMAS 🌟
class FBTMetrics(BaseModel):
    support: Optional[float] = Field(None, example=0.043)
    confidence: Optional[float] = Field(None, example=0.847)
    lift: Optional[float] = Field(None, example=2.31)
    chi_square_p_value: Optional[float] = Field(None, example=0.003)

class FBTResponse(BaseModel):
    target_item_id: int = Field(..., example=12)
    recommended_item_id: int = Field(..., example=15)
    recommendation_type: str = Field(..., example="fbt_apriori")
    metrics: Optional[FBTMetrics] = None

class Interaction(BaseModel):
    user_id: str = Field(..., example="jade_jolts_01")
    product_id: int = Field(..., example=12)
    event_type: str = Field(..., example="purchase")
    recommendation_model: str = Field("none", example="collaborative")

class TrackResponse(BaseModel):
    status: str = Field(..., example="success")
    message: str = Field(..., example="purchase logged to Supabase")

class ForecastItem(BaseModel):
    product_id: int = Field(..., example=12)
    weekly_sales: int = Field(..., example=5)
    growth_rate: float = Field(..., example=0.25)
    forecast_next_week: int = Field(..., example=6)
    trend: str = Field(..., example="accelerating")

class ForecastResponse(BaseModel):
    status: str = Field(..., example="success")
    anchor_date: Optional[str] = Field(None, example="2026-03-12T15:30:00+00:00")
    data: List[ForecastItem]
    message: Optional[str] = Field(None, example="Forecast generated successfully.")

# =========================================================
# 🌟 API ROUTES
# =========================================================

@app.get("/", tags=["System"], response_model=RootResponse, summary="Check Engine Status")
def read_root():
    """
    Ping this endpoint to verify that the FastAPI backend is running and accessible.
    """
    return {
        "status": "Online",
        "message": "Lotus Machine Learning Engine is ready."
    }

@app.get("/api/recommend/{item_id}", tags=["Recommendations"], response_model=RecommendationResponse, summary="Get Product Recommendations")
def get_product_recommendations(item_id: int, model: Optional[str] = None):
    """
    Fetches 5 highly relevant product recommendations for a given item.
    
    **Algorithm Logic:**
    * If a specific model is requested via query params, it executes that model.
    * If no model is specified, it acts as an **A/B Testing Router**, randomly flipping a coin between `Collaborative Filtering (SVD)` and `Content-Based (TF-IDF)`.
    * Implements a strict fallback mechanism if collaborative data is missing.
    """
    try:
        if model == "collaborative":
            recommendations = get_collaborative_recommendations(item_id)
            model_used = "collaborative"
            if not recommendations:
                recommendations = get_recommendations(item_id)
                model_used = "content_fallback"
                
        elif model == "content" or model == "content_fallback":
            recommendations = get_recommendations(item_id)
            model_used = model

        else:
            if random.choice([True, False]):
                recommendations = get_collaborative_recommendations(item_id)
                model_used = "collaborative"
                
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

# 🌟 NEW FBT ENDPOINT 🌟
@app.get("/api/fbt/{item_id}", tags=["Recommendations"], response_model=FBTResponse, summary="Get Frequently Bought Together (FBT) Item")
def get_frequently_bought_together(item_id: int):
    """
    Retrieves the single mathematically strongest companion product for a given item using Market Basket Analysis.

    **Enterprise Fallback Chain:**
    1. **Apriori (FBT):** Queries the pre-computed association rules. Requires Lift > 1.0 and Chi-Square p-value < 0.05.
    2. **Content-Based:** If no statistically significant pair exists, falls back to TF-IDF attribute similarity.
    3. **Bestseller:** If the item is brand new, falls back to the most popular global item.
    """
    try:
        # 1. Try Apriori Market Basket Analysis
        fbt_result = get_fbt_recommendation(item_id)
        
        if fbt_result:
            return {
                "target_item_id": item_id,
                "recommended_item_id": fbt_result["recommended_item_id"],
                "recommendation_type": "fbt_apriori",
                "metrics": {
                    "support": fbt_result["support"],
                    "confidence": fbt_result["confidence"],
                    "lift": fbt_result["lift"],
                    "chi_square_p_value": fbt_result["p_value"]
                }
            }
        
        # 2. Fallback to Content-Based (TF-IDF)
        content_recs = get_recommendations(item_id)
        if content_recs and len(content_recs) > 0:
            return {
                "target_item_id": item_id,
                # 🌟 THE FIX: Strictly extract the integer ID from the dictionary
                "recommended_item_id": int(content_recs[0]["id"]), 
                "recommendation_type": "content_fallback",
                "metrics": None
            }
        
        # 3. Fallback to Bestseller (Safe default for absolute cold-start)
        bestseller_id = get_bestseller()
        
        return {
            "target_item_id": item_id,
            "recommended_item_id": bestseller_id,
            "recommendation_type": "bestseller_fallback",
            "metrics": None
        }

    except Exception as e:
        print(f"FBT Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch FBT recommendation.")


@app.post("/api/track", tags=["Telemetry"], response_model=TrackResponse, summary="Track User Interactions")
async def track_interaction(interaction: Interaction):
    """
    Ingests real-time user behavior data (views, clicks, purchases) directly into the Supabase data warehouse.
    This data continuously trains and refines the recommendation and forecasting models.
    """
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

@app.get("/api/forecast-demand", tags=["Forecasting"], response_model=ForecastResponse, summary="Generate Inventory Demand Forecast")
def get_demand_forecast():
    """
    Generates a predictive model for future product demand to assist with inventory restocking.
    
    **Mathematical Approach (Historical Anchor Method):**
    1. Locates the most recent `purchase` event in the database to establish `T=0` (Anchor Date).
    2. Fetches 30 days of historical sales data relative to the anchor.
    3. Calculates short-term (7-day) and long-term (30-day) volume.
    4. Applies a weighted time-series formula: `(0.7 * Weekly Demand) + (0.3 * Monthly Demand)`.
    5. Categorizes product momentum into `accelerating`, `stable`, or `declining` based on WoW (Week-over-Week) growth rates.
    """
    try:
        # 1. Find the historical anchor (most recent purchase date)
        latest_interaction = supabase.table('interactions') \
            .select('timestamp') \
            .eq('event_type', 'purchase') \
            .order('timestamp', desc=True) \
            .limit(1) \
            .execute()
            
        if not latest_interaction.data:
            return {"status": "success", "data": [], "message": "No purchase history found in the database to generate a forecast."}
            
        anchor_date_str = latest_interaction.data[0]['timestamp']
        anchor_date = pd.to_datetime(anchor_date_str)
        
        if anchor_date.tzinfo is None:
            anchor_date = anchor_date.tz_localize('UTC')
            
        # 2. Define the exact historical time windows relative to the anchor
        thirty_days_ago = anchor_date - timedelta(days=30)
        fourteen_days_ago = anchor_date - timedelta(days=14)
        seven_days_ago = anchor_date - timedelta(days=7)
        
        # 3. Fetch the 30-day window leading up to the anchor date
        response = supabase.table('interactions') \
            .select('product_id, timestamp') \
            .eq('event_type', 'purchase') \
            .gte('timestamp', thirty_days_ago.isoformat()) \
            .lte('timestamp', anchor_date.isoformat()) \
            .execute()
            
        data = response.data
        
        if not data:
            return {"status": "success", "data": [], "message": "Not enough purchase data within the historical window to generate forecast."}
            
        # 4. Convert to pandas DataFrame for rapid aggregation
        df = pd.DataFrame(data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        if df['timestamp'].dt.tz is None:
            df['timestamp'] = df['timestamp'].dt.tz_localize('UTC')
        
        forecast_results = []
        grouped = df.groupby('product_id')
        
        # 5. Calculate metrics per product
        for product_id, group in grouped:
            monthly_demand = len(group)
            weekly_demand = len(group[group['timestamp'] >= seven_days_ago])
            previous_weekly_demand = len(group[(group['timestamp'] >= fourteen_days_ago) & (group['timestamp'] < seven_days_ago)])
            
            # Forecast Formula: 70% weight to recent week, 30% weight to monthly trend
            forecast_next_week = int(round((0.7 * weekly_demand) + (0.3 * monthly_demand)))
            
            # Trend Classification
            if previous_weekly_demand == 0:
                growth_rate = 1.0 if weekly_demand > 0 else 0.0
            else:
                growth_rate = (weekly_demand - previous_weekly_demand) / previous_weekly_demand
                
            if growth_rate > 0.5:
                trend = "accelerating"
            elif growth_rate >= 0:
                trend = "stable"
            else:
                trend = "declining"
                
            forecast_results.append({
                "product_id": int(product_id),
                "weekly_sales": weekly_demand,
                "growth_rate": round(growth_rate, 2),
                "forecast_next_week": forecast_next_week,
                "trend": trend
            })
            
        # 6. Sort by highest forecasted demand first
        forecast_results = sorted(forecast_results, key=lambda x: x['forecast_next_week'], reverse=True)
        
        return {
            "status": "success",
            "anchor_date": anchor_date.isoformat(),
            "data": forecast_results
        }
        
    except Exception as e:
        print(f"Forecasting Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate demand forecast.")