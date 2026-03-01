import csv
import random
import uuid
from datetime import datetime, timedelta, timezone
import requests
import os
from dotenv import load_dotenv

# 1. YOUR SUPABASE CONFIGURATION
load_dotenv() # This tells Python to read the .env file
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def fetch_products():
    print("📡 Fetching real product catalog from Supabase...")
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    response = requests.get(f"{SUPABASE_URL}/rest/v1/products?select=id,category", headers=headers)
    if response.status_code != 200:
        print("❌ Failed to fetch products!")
        return []
    return response.json()

def generate_synthetic_data(num_users=1000):
    products = fetch_products()
    if not products:
        return

    # Group products by category so we can simulate "Personas"
    categories = {}
    for p in products:
        cat = p['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(p['id'])

    category_names = list(categories.keys())
    
    file_path = "interactions.csv"
    file_exists = os.path.isfile(file_path)

    print(f"🧬 Simulating {num_users} shoppers...")
    
    total_interactions = 0
    
    with open(file_path, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Write headers if it's a brand new file
        if not file_exists:
            writer.writerow(["timestamp", "user_id", "product_id", "event_type", "recommendation_model"])

        # Generate Fake Users
        for _ in range(num_users):
            user_id = f"sim_{uuid.uuid4().hex[:10]}"
            
            # 1. Assign a Persona (e.g., This user REALLY loves 'Bangles')
            favorite_category = random.choice(category_names)
            
            # 2. Decide how active they are (between 3 to 10 clicks)
            num_clicks = random.randint(3, 10)
            
            # Generate a random date within the last 30 days (FUTURE-PROOFED)
            base_time = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))

            for _ in range(num_clicks):
                # 80% chance they click something in their favorite category (Realistic behavior)
                if random.random() < 0.80 and categories[favorite_category]:
                    product_id = random.choice(categories[favorite_category])
                else:
                    # 20% chance they wander off and look at random stuff
                    random_cat = random.choice(category_names)
                    product_id = random.choice(categories[random_cat])

                # Determine the event type (Most people just view, some wishlist, few add to cart)
                event_roll = random.random()
                if event_roll < 0.70:
                    event_type = 'view'
                elif event_roll < 0.90:
                    event_type = 'wishlist'
                else:
                    event_type = 'add_to_cart'

                # Add a few seconds/minutes between their clicks
                base_time += timedelta(seconds=random.randint(10, 300))

                # Log it to the CSV!
                writer.writerow([
                    base_time.isoformat(),
                    user_id,
                    product_id,
                    event_type,
                    "simulated_baseline"
                ])
                total_interactions += 1

    print(f"✅ BOOM! Successfully injected {total_interactions} synthetic interactions into your Data Lake!")

if __name__ == "__main__":
    generate_synthetic_data(1000)