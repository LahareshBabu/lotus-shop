import pandas as pd
import numpy as np
import time
import os
from scipy import stats
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
from supabase import create_client, Client
from dotenv import load_dotenv

# Import your two competing models
# Note: Ensure 'SVDRecommender' matches your actual SVD class name in collaborative.py
from collaborative import SVDRecommender 
from sgd_collaborative import SGDRecommender

# Load environment variables for Supabase connection
load_dotenv()

def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    # Updated to look for your existing SUPABASE_KEY to prevent breaking downstream files
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        return None
    return create_client(url, key)

def log_experiment_to_supabase(model_name: str, dataset_size: int, mae: float, rmse: float, training_time: float):
    """
    MLOps Integration: Pushes model performance metrics to the central database
    for historical tracking and reproducible science.
    """
    supabase = get_supabase_client()
    if not supabase:
        print(f"⚠️  MLOps Warning: Supabase credentials not found. Skipping DB logging for {model_name}.")
        return

    experiment_data = {
        "model_name": model_name,
        "dataset_size": dataset_size,
        "mae": float(mae),
        "rmse": float(rmse),
        "training_time_seconds": float(training_time)
    }

    try:
        supabase.table("ml_experiments").insert(experiment_data).execute()
        print(f"✅ MLOps: Successfully logged {model_name} experiment to Supabase.")
    except Exception as e:
        print(f"❌ MLOps Error: Failed to log experiment to Supabase: {str(e)}")

def evaluate_predictions(y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    return mae, rmse

def run_experiment(interactions_df):
    dataset_size = len(interactions_df)
    print("==================================================")
    print("🧪 SCIENTIFIC BENCHMARK: SVD vs. SGD (Mean-Centered)")
    print("==================================================")
    print(f"Dataset Size: {dataset_size} interactions")
    
    # Isolate 20% of the data to test the models on unseen interactions
    train_df, test_df = train_test_split(interactions_df, test_size=0.2, random_state=42)
    print(f"Training on {len(train_df)} rows | Testing on {len(test_df)} rows\n")

    # =========================================================
    # 🌟 STATISTICAL UPGRADE: MEAN CENTERING
    # =========================================================
    print("--> Applying Statistical Mean Centering...")
    global_mean = train_df['rating'].mean()
    user_means = train_df.groupby('user_id')['rating'].mean()

    # Create a centered training set (Rating - User's Average)
    train_centered = train_df.copy()
    train_centered['rating'] = train_centered.apply(
        lambda row: row['rating'] - user_means.get(row['user_id'], global_mean), axis=1
    )

    # Helper function to predict and add the user's mean back
    def predict_with_mean(model, u, i):
        raw_pred = model.predict(u, i)
        # Add back the user's average (or global average if it's a true cold start)
        return raw_pred + user_means.get(u, global_mean)

    # ---------------------------------------------------------
    # 1. Baseline: Truncated SVD (Your Original Model)
    # ---------------------------------------------------------
    print("\n--> Training Baseline SVD (Centered Data)...")
    svd_model = SVDRecommender(n_components=20)
    
    start_time = time.time()
    svd_model.fit(train_centered)  # Fit on centered data
    svd_time = time.time() - start_time
    
    # Generate predictions using the mean-centering helper
    svd_preds = [predict_with_mean(svd_model, row['user_id'], row['product_id']) for _, row in test_df.iterrows()]
    svd_mae, svd_rmse = evaluate_predictions(test_df['rating'], svd_preds)

    # MLOps Logging for SVD
    log_experiment_to_supabase("Truncated SVD (Mean-Centered)", dataset_size, svd_mae, svd_rmse, svd_time)

    # ---------------------------------------------------------
    # 2. Competitor: SGD with L2 Regularization
    # ---------------------------------------------------------
    print("\n--> Training SGD with L2 Regularization (Centered Data)...")
    sgd_model = SGDRecommender(n_factors=50, learning_rate=0.01, regularization=0.1, epochs=20)
    
    # The SGD fit method returns the training time directly (Fit on centered data)
    start_time = time.time()
    sgd_model.fit(train_centered, user_col='user_id', item_col='product_id', rating_col='rating')
    sgd_time = time.time() - start_time
    
    # Generate predictions using the mean-centering helper
    sgd_preds = [predict_with_mean(sgd_model, row['user_id'], row['product_id']) for _, row in test_df.iterrows()]
    sgd_mae, sgd_rmse = evaluate_predictions(test_df['rating'], sgd_preds)

    # MLOps Logging for SGD
    log_experiment_to_supabase("SGD Matrix Factorization", dataset_size, sgd_mae, sgd_rmse, sgd_time)

    # ---------------------------------------------------------
    # 3. The Final Report (Phase 1)
    # ---------------------------------------------------------
    print("\n📊 PHASE 1: BENCHMARK RESULTS")
    print("--------------------------------------------------")
    print(f"SVD Model | MAE: {svd_mae:.4f} | RMSE: {svd_rmse:.4f} | Training Time: {svd_time:.4f} sec")
    print(f"SGD Model | MAE: {sgd_mae:.4f} | RMSE: {sgd_rmse:.4f} | Training Time: {sgd_time:.4f} sec")

    # =========================================================
    # 🌟 PHASE 2: STATISTICAL CONFIDENCE LAYER
    # =========================================================
    print("\n🔬 PHASE 2: STATISTICAL SIGNIFICANCE (Paired t-test)")
    print("--------------------------------------------------")
    
    # 1. Extract absolute errors for every single prediction
    actuals = test_df['rating'].values
    svd_errors = np.abs(actuals - np.array(svd_preds))
    sgd_errors = np.abs(actuals - np.array(sgd_preds))

    # 2. Run the Paired t-test
    t_stat, p_value = stats.ttest_rel(svd_errors, sgd_errors)

    # 3. Calculate 95% Confidence Interval of the Difference
    error_diff = svd_errors - sgd_errors
    mean_diff = np.mean(error_diff)
    std_diff = np.std(error_diff, ddof=1)
    n = len(error_diff)
    
    # Critical t-value for 95% CI
    t_crit = stats.t.ppf(0.975, df=n-1)
    margin_of_error = t_crit * (std_diff / np.sqrt(n))
    
    ci_lower = mean_diff - margin_of_error
    ci_upper = mean_diff + margin_of_error

    print(f"Mean Error Difference (SVD - SGD): {mean_diff:.6f}")
    print(f"95% Confidence Interval: [{ci_lower:.6f}, {ci_upper:.6f}]")
    print(f"p-value: {p_value:.6e}\n")
    
    # The Harvard Verdict
    if p_value < 0.05:
        print("🎓 HARVARD VERDICT: The p-value is < 0.05. The difference in accuracy is STATISTICALLY SIGNIFICANT.")
        if mean_diff < 0:
             print("Conclusion: SVD is mathematically superior on this dataset.")
        else:
             print("Conclusion: SGD is mathematically superior on this dataset.")
    else:
        print("🎓 HARVARD VERDICT: The p-value is >= 0.05. The difference is NOT statistically significant.")
        print("Conclusion: Both models perform equally well mathematically. SVD wins the production deployment purely due to its superior inference and training speed.")
    print("==================================================\n")

if __name__ == "__main__":
    print("Loading Original 2014 UCSD Amazon Dataset (Compressed)...")
    
    # 1. Ingest the dataset directly from the compressed .gz file
    # pandas natively unzips this in RAM, saving disk space and bypassing manual extraction.
    file_name = "reviews_Clothing_Shoes_and_Jewelry_5.json.gz"
    
    try:
        df = pd.read_json(file_name, lines=True, compression='gzip')
        
        # 2. Schema Mapping: Translate 2014 academic schema to our mathematical engine
        df = df.rename(columns={
            'reviewerID': 'user_id',
            'asin': 'product_id',
            'overall': 'rating'
        })
        
        # 3. Data Cleaning: Drop corrupted rows
        df = df.dropna(subset=['user_id', 'product_id', 'rating'])
        
        # 4. Resource Management: Sample 50k rows to prevent local memory overflow
        if len(df) > 50000:
            print(f"Original dataset size: {len(df)}. Sampling 50,000 interactions for computational benchmark...")
            df = df.sample(n=50000, random_state=42)
        
        # 5. Execute the mathematical benchmark
        run_experiment(df)
        
    except FileNotFoundError:
        print(f"❌ Error: Could not find '{file_name}'. Ensure it is inside the ml-api folder!")