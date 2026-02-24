import pandas as pd
import os

def calculate_ab_test_metrics():
    print("📊 Running A/B Test Conversion Metrics...")
    
    file_path = "interactions.csv"
    if not os.path.exists(file_path):
        print("❌ Data Lake not found!")
        return

    # 1. Load the Data
    df = pd.read_csv(file_path)
    if df.empty:
        print("❌ Data Lake is empty!")
        return
        
    # 2. Group by the Recommendation Model
    # We want to see how 'content', 'collaborative', and 'simulated_baseline' performed.
    models = df['recommendation_model'].unique()
    
    print("\n🏆 --- A/B TEST RESULTS (CTR & CONVERSION) --- 🏆")
    
    for model in models:
        # Filter data for just this specific AI brain
        model_data = df[df['recommendation_model'] == model]
        
        # Count the events
        total_interactions = len(model_data)
        views = len(model_data[model_data['event_type'] == 'view'])
        
        # 🚀 THE FIX: Accept old legacy 'wishlist' tags AND new 'add_to_wishlist' tags, ignoring 'remove_from_wishlist'
        wishlists = len(model_data[model_data['event_type'].isin(['wishlist', 'add_to_wishlist'])])
        carts = len(model_data[model_data['event_type'] == 'add_to_cart'])
        
        # Calculate Conversion Rate (Positive Actions / Total Views)
        # We consider a wishlist or an add_to_cart as a "Conversion"
        positive_actions = wishlists + carts
        
        conversion_rate = (positive_actions / views) * 100 if views > 0 else 0
        
        print(f"\n🧠 Model: [{model.upper()}]")
        print(f"   Total Interactions: {total_interactions}")
        print(f"   Views: {views} | Wishlists: {wishlists} | Add to Cart: {carts}")
        print(f"   Conversion Rate: {conversion_rate:.2f}%")
        
    print("\n-------------------------------------------------")
    print("Note: This tracks how effectively each AI brain turns a 'View' into a 'Purchase Intent' (Now with Stateful Wishlists!).")

if __name__ == "__main__":
    calculate_ab_test_metrics()