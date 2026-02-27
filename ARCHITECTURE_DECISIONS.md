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