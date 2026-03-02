import numpy as np
import time

class SGDRecommender:
    def __init__(self, n_factors=50, learning_rate=0.01, regularization=0.1, epochs=20):
        """
        Matrix Factorization using Stochastic Gradient Descent with L2 Regularization.
        This allows us to prevent overfitting on highly sparse matrices (99.93% sparsity).
        """
        self.n_factors = n_factors
        self.learning_rate = learning_rate
        self.regularization = regularization
        self.epochs = epochs
        
        # Latent feature matrices for Users (P) and Items (Q)
        self.user_factors = None
        self.item_factors = None
        self.user_mapping = {}
        self.item_mapping = {}
        
    def fit(self, interactions_df, user_col='user_id', item_col='product_id', rating_col='rating'):
        """Trains the model and tracks computational time."""
        start_time = time.time()
        
        # Create mappings to continuous integer IDs
        unique_users = interactions_df[user_col].unique()
        unique_items = interactions_df[item_col].unique()
        
        self.user_mapping = {u: i for i, u in enumerate(unique_users)}
        self.item_mapping = {i: j for j, i in enumerate(unique_items)}
        
        n_users = len(unique_users)
        n_items = len(unique_items)
        
        # Initialize latent matrices with small random values
        self.user_factors = np.random.normal(scale=1./self.n_factors, size=(n_users, self.n_factors))
        self.item_factors = np.random.normal(scale=1./self.n_factors, size=(n_items, self.n_factors))
        
        # Convert df to list of tuples for fast iteration
        samples = [
            (self.user_mapping[row[user_col]], self.item_mapping[row[item_col]], row[rating_col])
            for _, row in interactions_df.iterrows()
        ]
        
        # Stochastic Gradient Descent Loop
        for epoch in range(self.epochs):
            np.random.shuffle(samples) # Shuffle to prevent cyclical learning
            for u, i, r in samples:
                # Predict current rating
                prediction = np.dot(self.user_factors[u, :], self.item_factors[i, :].T)
                error = r - prediction
                
                # Update latent factors using gradients + L2 penalty
                self.user_factors[u, :] += self.learning_rate * (error * self.item_factors[i, :] - self.regularization * self.user_factors[u, :])
                self.item_factors[i, :] += self.learning_rate * (error * self.user_factors[u, :] - self.regularization * self.item_factors[i, :])
                
        training_time = time.time() - start_time
        return training_time

    def predict(self, user_id, product_id):
        """Predicts the rating for a given user and product."""
        if user_id not in self.user_mapping or product_id not in self.item_mapping:
            return 0.0 # Cold start fallback
            
        u_idx = self.user_mapping[user_id]
        i_idx = self.item_mapping[product_id]
        
        return np.dot(self.user_factors[u_idx, :], self.item_factors[i_idx, :].T)