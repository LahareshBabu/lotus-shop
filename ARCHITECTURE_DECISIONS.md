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

## 4. The Optimization Tradeoff: Statistical vs. Practical Significance
**Context:** Modern recommender systems often default to deep learning or iterative Stochastic Gradient Descent (SGD) architectures. To justify our model selection, we conducted a rigorous statistical benchmark on 50,000 real-world Amazon interactions, pitting the closed-form Truncated SVD baseline against an L2-Regularized SGD Matrix Factorization model.
**Decision:** Evaluated both predictive accuracy (MAE) and the computational latency required to achieve it.
**Rationale:** The benchmark yielded an SVD MAE of 0.8774 (17.5s train time) versus an SGD MAE of 0.8778 (9.7s train time). A paired t-test confirmed the SVD model's superiority is statistically significant (p = 1.91e-54, 95% CI: [-0.000471, -0.000366]). However, this highlights a critical difference between statistical and practical significance. In a 5-star rating ecosystem, an absolute MAE improvement of 0.0004 is invisible to the end-user. Conversely, the computational tradeoff is substantial: the statistically superior SVD model requires nearly 2x the training latency. This empirical evaluation proves that blindly pursuing marginal, statistically significant accuracy gains without analyzing computational cost leads to flawed engineering. It informs a pragmatic, latency-aware approach to production deployment rather than escalating to highly complex deep learning (NCF) frameworks.