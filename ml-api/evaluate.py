import pandas as pd
import numpy as np
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
import os

def evaluate_model(top_n=5):
    print("📊 Starting Scientific Offline Evaluation...")
    
    file_path = "interactions.csv"
    if not os.path.exists(file_path):
        print("❌ Data Lake not found!")
        return

    # 1. LOAD THE DATA
    df = pd.read_csv(file_path)
    if df.empty:
        print("❌ Data Lake is empty!")
        return
        
    # 2. IMPLICIT FEEDBACK WEIGHTING
    event_weights = {'view': 1.0, 'wishlist': 2.0, 'add_to_cart': 3.0}
    df['score'] = df['event_type'].map(event_weights)
    
    # 3. CREATE TRAIN/TEST SPLIT (Leave-One-Out)
    # Sort chronologically so we can hide the most recent action
    df = df.sort_values('timestamp')
    
    # Extract the very last interaction for every user as the "Test Set"
    test_data = df.groupby('user_id').tail(1)
    # Everything else belongs to the "Training Set"
    train_data = df.drop(test_data.index)
    
    print(f"📈 Training on {len(train_data)} interactions. Testing on {len(test_data)} interactions.")
    
    # 4. BUILD THE MATRICES FROM TRAINING DATA ONLY
    interaction_matrix = train_data.groupby(['user_id', 'product_id'])['score'].sum().unstack(fill_value=0)
    item_user_matrix = interaction_matrix.T
    
    n_components = min(20, item_user_matrix.shape[1] - 1, item_user_matrix.shape[0] - 1)
    if n_components < 1:
        print("❌ Matrix too small for evaluation.")
        return

    # Train the SVD Engine
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    item_factors = svd.fit_transform(item_user_matrix)
    similarity_matrix = cosine_similarity(item_factors)
    
    item_indices = list(item_user_matrix.index)
    
    # 5. THE EXAM: CALCULATE HIT RATE @ K
    hits = 0
    total_evaluations = 0
    
    # Grade the AI for every single user
    for _, row in test_data.iterrows():
        user = row['user_id']
        target_hidden_item = row['product_id']
        
        # If the user has no training history, skip them (Cold Start condition)
        if user not in interaction_matrix.index:
            continue
            
        # Get the item the user looked at right before the hidden item
        user_history = train_data[train_data['user_id'] == user]
        if user_history.empty:
            continue
            
        last_viewed_item = user_history.iloc[-1]['product_id']
        
        if last_viewed_item not in item_indices:
            continue
            
        target_index = item_indices.index(last_viewed_item)
        
        # Ask the AI to predict the next 5 items
        similarity_scores = list(enumerate(similarity_matrix[target_index]))
        similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)
        
        recommendations = []
        for i, score in similarity_scores[1:top_n+1]:
            recommendations.append(item_indices[i])
            
        # 🎯 DID THE AI GUESS CORRECTLY?
        if target_hidden_item in recommendations:
            hits += 1
            
        total_evaluations += 1
        
    # Calculate Final Score
    hit_rate = (hits / total_evaluations) * 100 if total_evaluations > 0 else 0
    
    print("\n🏆 --- EVALUATION RESULTS --- 🏆")
    print(f"Total Users Evaluated: {total_evaluations}")
    print(f"Successful Hits: {hits}")
    print(f"Hit Rate @ {top_n}: {hit_rate:.2f}%")
    print("---------------------------------")
    print("Note: In Amazon-style E-commerce, a Hit Rate between 5% and 15% is considered phenomenal because human behavior is highly unpredictable!")

if __name__ == "__main__":
    evaluate_model(top_n=5)