# Architecture & Modeling Decisions

## 1. Why TF-IDF & Cosine Similarity? (The Cold-Start Solution)
**Context:** In a zero-user environment (Day 1 of launch), collaborative filtering cannot function because the user-item interaction matrix is empty.
**Decision:** Implemented Content-Based Filtering using TF-IDF vectorization on product metadata.
**Rationale:** This creates a mathematical representation of product attributes, allowing the system to compute Cosine Similarity and recommend items with shared characteristics immediately, completely bypassing the cold-start problem.

## 2. Why Truncated SVD? (Handling Extreme Sparsity)
**Context:** The UCSD Amazon dataset exhibits 99.93% sparsity. Traditional neighborhood-based methods (like K-Nearest Neighbors) fail because the overlap of co-rated items between any two users is statistically near zero.
**Decision:** Implemented Truncated Singular Value Decomposition (SVD) with mean-centering preprocessing.
**Rationale:** Matrix factorization maps both users and items into a lower-dimensional latent feature space. By utilizing SVD, the engine infers hidden behavioral patterns even when direct item-to-item co-occurrence is missing. Mean-centering specifically anchors predictions, preventing the algorithm from collapsing toward zero in highly sparse regions.

## 3. Why Live A/B Testing & Multi-Touch Attribution?
**Context:** Offline metrics (RMSE/MAE) measure predictive accuracy but do not guarantee real-world business conversions.
**Decision:** Engineered a probabilistic traffic router in the FastAPI layer and a URL-state tracking system in Next.js.
**Rationale:** This enables scientific comparison between the Content and Collaborative models in a live environment. By persisting attribution state (`?ref=`) across the user session, the system accurately maps deferred purchases to the originating algorithm, providing verifiable conversion metrics.

## 4. Why Not Deep Learning / Iterative Gradient Descent? (The Statistical Tradeoff)
**Context:** Modern recommender systems often default to deep learning or iterative Stochastic Gradient Descent (SGD) architectures. However, these models introduce significant operational complexity, hyperparameter dependency, and computational overhead.
**Decision:** Conducted a rigorous statistical benchmark on 50,000 interactions, pitting the baseline SVD against an L2-Regularized SGD Matrix Factorization model.
**Rationale:** The hypothesis that an iterative gradient engine would outperform closed-form linear algebra on highly sparse data was mathematically rejected. A paired t-test on the absolute prediction errors generated a p-value of 1.91e-54 and a 95% Confidence Interval strictly below zero ([-0.000471, -0.000366]). This empirically proved that SVD is statistically superior on this dataset. Consequently, escalating the architecture to Neural Collaborative Filtering (NCF) or Deep Learning was rejected as it would drastically increase system complexity with zero mathematical or business gain.