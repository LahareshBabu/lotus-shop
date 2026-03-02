import pandas as pd
import numpy as np
import time
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split

# Import your two competing models
# Note: Ensure 'CollaborativeRecommender' matches your actual SVD class name in collaborative.py
from collaborative import SVDRecommender 
from sgd_collaborative import SGDRecommender

def evaluate_predictions(y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    return mae, rmse

def run_experiment(interactions_df):
    print("==================================================")
    print("🧪 SCIENTIFIC BENCHMARK: SVD vs. SGD (L2 Reg)")
    print("==================================================")
    print(f"Dataset Size: {len(interactions_df)} interactions")
    
    # Isolate 20% of the data to test the models on unseen interactions
    train_df, test_df = train_test_split(interactions_df, test_size=0.2, random_state=42)
    print(f"Training on {len(train_df)} rows | Testing on {len(test_df)} rows\n")

    # ---------------------------------------------------------
    # 1. Baseline: Truncated SVD (Your Original Model)
    # ---------------------------------------------------------
    print("--> Training Baseline SVD...")
    svd_model = CollaborativeRecommender() 
    
    start_time = time.time()
    svd_model.fit(train_df)  # Ensure this matches your SVD's fit method signature
    svd_time = time.time() - start_time
    
    # Generate predictions for SVD
    svd_preds = [svd_model.predict(row['user_id'], row['product_id']) for _, row in test_df.iterrows()]
    svd_mae, svd_rmse = evaluate_predictions(test_df['rating'], svd_preds)

    # ---------------------------------------------------------
    # 2. Competitor: SGD with L2 Regularization
    # ---------------------------------------------------------
    print("--> Training SGD with L2 Regularization...")
    sgd_model = SGDRecommender(n_factors=50, learning_rate=0.01, regularization=0.1, epochs=20)
    
    # The SGD fit method returns the training time directly
    sgd_time = sgd_model.fit(train_df, user_col='user_id', item_col='product_id', rating_col='rating')
    
    # Generate predictions for SGD
    sgd_preds = [sgd_model.predict(row['user_id'], row['product_id']) for _, row in test_df.iterrows()]
    sgd_mae, sgd_rmse = evaluate_predictions(test_df['rating'], sgd_preds)

    # ---------------------------------------------------------
    # 3. The Final Report
    # ---------------------------------------------------------
    print("\n📊 BENCHMARK RESULTS")
    print("--------------------------------------------------")
    print(f"SVD Model | MAE: {svd_mae:.4f} | RMSE: {svd_rmse:.4f} | Training Time: {svd_time:.4f} sec")
    print(f"SGD Model | MAE: {sgd_mae:.4f} | RMSE: {sgd_rmse:.4f} | Training Time: {sgd_time:.4f} sec")
    print("==================================================\n")

if __name__ == "__main__":
    # TODO: Load your actual Amazon or Synthetic dataset here!
    # Example: df = pd.read_csv("data/amazon_reviews.csv")
    
    # For now, we will generate a quick dummy dataset to ensure the plumbing works
    print("Initializing Data Pipeline...")
    dummy_data = pd.DataFrame({
        'user_id': np.random.randint(1, 100, 5000),
        'product_id': np.random.randint(1, 50, 5000),
        'rating': np.random.uniform(1.0, 5.0, 5000)
    })
    
    # Run the arena
    run_experiment(dummy_data)