import os
import json
import pandas as pd
from scipy.stats import chi2_contingency
from dotenv import load_dotenv
from supabase import create_client, Client
from collections import defaultdict
from itertools import permutations
import redis

# Securely load environment variables
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
UPSTASH_REDIS_URL = os.getenv("UPSTASH_REDIS_URL") 

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 🌟 REDIS CACHE INITIALIZATION (Production Resiliency) 🌟
redis_client = None
if UPSTASH_REDIS_URL:
    try:
        redis_client = redis.from_url(UPSTASH_REDIS_URL)
        redis_client.ping() # Verify connection on startup
        print("[INFO] Upstash Redis Cache: ONLINE")
    except Exception as e:
        print(f"[WARNING] Upstash Redis Cache: OFFLINE (Fallback to memory). Error: {e}")
        redis_client = None

# 🌟 MEMORY CACHE (Fallback) 🌟
_fbt_rules_cache = None

def build_fbt_rules():
    """
    The Core Apriori Engine. 
    1. Extracts carts from historical receipts.
    2. Calculates Support, Confidence, and Lift.
    3. Executes a Chi-Square test to eliminate statistically insignificant rules.
    """
    global _fbt_rules_cache
    
    # 1. Fetch all historical orders from Supabase
    response = supabase.table("orders").select("items").execute()
    if not response.data:
        _fbt_rules_cache = pd.DataFrame()
        return _fbt_rules_cache

    # 2. Parse the JSON receipts into mathematical 'baskets'
    baskets = []
    for order in response.data:
        items = order.get("items", [])
        
        # Handle variations in JSON structure
        if isinstance(items, dict) and "products" in items:
            products = items["products"]
        elif isinstance(items, list):
            products = items
        else:
            continue
        
        basket = []
        for p in products:
            if isinstance(p, dict) and "id" in p:
                basket.append(p["id"])
        
        # Remove duplicates within the same cart
        basket = list(set(basket))
        
        # We only care about carts that have at least 2 items
        if len(basket) > 1:
            baskets.append(basket)

    if not baskets:
        _fbt_rules_cache = pd.DataFrame()
        return _fbt_rules_cache

    # 3. Build Co-occurrence Matrix (Apriori Primitives)
    item_counts = defaultdict(int)
    pair_counts = defaultdict(int)
    total_baskets = len(baskets)

    for basket in baskets:
        for item in basket:
            item_counts[item] += 1
        for pair in permutations(basket, 2):
            pair_counts[pair] += 1

    rules = []
    for (item_A, item_B), count_AB in pair_counts.items():
        support_A = item_counts[item_A] / total_baskets
        support_B = item_counts[item_B] / total_baskets
        support_AB = count_AB / total_baskets

        confidence = support_AB / support_A
        lift = confidence / support_B

        # 🌟 STRICT ENTERPRISE FILTER 1: Lift must be > 1.0
        if lift > 1.0:
            
            # 🌟 STRICT ENTERPRISE FILTER 2: Chi-Square Significance Test
            O_11 = count_AB                                                      # Bought A & B
            O_12 = item_counts[item_A] - count_AB                                # Bought A, Not B
            O_21 = item_counts[item_B] - count_AB                                # Bought B, Not A
            O_22 = total_baskets - item_counts[item_A] - item_counts[item_B] + count_AB  # Bought Neither
            
            # Prevent edge-case negatives
            O_12 = max(0, O_12)
            O_21 = max(0, O_21)
            O_22 = max(0, O_22)

            table = [[O_11, O_12], [O_21, O_22]]
            
            try:
                # Execute the statistical test
                chi2, p_val, dof, expected = chi2_contingency(table, correction=False)
            except ValueError:
                p_val = 1.0 # Fail the test if the math breaks on zero-variance arrays

            # Final hurdle: p-value must be < 0.05
            if p_val < 0.05: 
                rules.append({
                    "target_item_id": item_A,
                    "recommended_item_id": item_B,
                    "support": round(support_AB, 4),
                    "confidence": round(confidence, 4),
                    "lift": round(lift, 4),
                    "p_value": round(p_val, 5)
                })

    _fbt_rules_cache = pd.DataFrame(rules)
    
    # Sort the dataframe so the highest-lift, most significant rules are at the top
    if not _fbt_rules_cache.empty:
        _fbt_rules_cache = _fbt_rules_cache.sort_values(by=["target_item_id", "lift"], ascending=[True, False])
        
    return _fbt_rules_cache

def get_fbt_recommendation(target_item_id: int):
    """
    Exposed endpoint router. Pulls from the ultra-fast Redis cache first.
    If a cache miss occurs, it computes the math, stores it in Redis for 24h, and returns.
    Implements Negative Caching for cold-start products to prevent redundant compute.
    """
    # 🌟 1. ATTEMPT ULTRA-FAST REDIS FETCH 🌟
    if redis_client:
        try:
            cached_result = redis_client.get(f"fbt_target:{target_item_id}")
            if cached_result:
                print(f"[CACHE HIT] Retrieved FBT for Item {target_item_id} from Redis")
                data = json.loads(cached_result)
                # If we negatively cached "NO_RULE", return None instantly
                return None if data == "NO_RULE" else data
        except Exception as e:
            print(f"[WARNING] Redis fetch error: {e}")
            
    # 🌟 2. CACHE MISS (Fallback to Compute) 🌟
    global _fbt_rules_cache
    if _fbt_rules_cache is None:
        build_fbt_rules()
        
    df = _fbt_rules_cache
    result = None
    
    # Only try to find a rule if the dataframe isn't completely empty
    if not df.empty:
        item_rules = df[df["target_item_id"] == target_item_id]
        if not item_rules.empty:
            best_rule = item_rules.iloc[0]
            result = {
                "recommended_item_id": int(best_rule["recommended_item_id"]),
                "support": float(best_rule["support"]),
                "confidence": float(best_rule["confidence"]),
                "lift": float(best_rule["lift"]),
                "p_value": float(best_rule["p_value"])
            }

    # 🌟 3. STORE IN REDIS WITH 24H TTL (Including Negative Caching) 🌟
    if redis_client:
        try:
            # If we found a rule, cache it. If not, cache "NO_RULE" to save server load!
            cache_payload = json.dumps(result) if result else json.dumps("NO_RULE")
            redis_client.setex(f"fbt_target:{target_item_id}", 86400, cache_payload)
            print(f"[CACHE SAVED] Stored FBT for Item {target_item_id} in Redis (24h TTL)")
        except Exception as e:
            print(f"[WARNING] Redis save error: {e}")

    return result