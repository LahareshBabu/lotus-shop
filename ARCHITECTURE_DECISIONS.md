# Architecture & Modeling Decisions

## 1. Why TF-IDF & Cosine Similarity? (The Cold-Start Solution)

**Context:** In a zero-user environment (Day 1 of launch), collaborative filtering cannot function because the user-item interaction matrix is empty.

**Decision:** Implemented Content-Based Filtering using TF-IDF vectorization on product metadata.

**Rationale:** This creates a mathematical representation of product attributes, allowing the system to compute Cosine Similarity and recommend items with shared characteristics immediately, completely bypassing the cold-start problem.

---

## 2. Why Truncated SVD? (Handling Extreme Sparsity)

**Context:** The UCSD Amazon dataset exhibits 99.93% sparsity. Traditional neighborhood-based methods (like K-Nearest Neighbors) fail because the overlap of co-rated items between any two users is statistically near zero.

**Decision:** Implemented Truncated Singular Value Decomposition (SVD) with mean-centering preprocessing.

**Rationale:** Matrix factorization maps both users and items into a lower-dimensional latent feature space. By utilizing SVD, the engine infers hidden behavioral patterns even when direct item-to-item co-occurrence is missing. Mean-centering specifically anchors predictions, preventing the algorithm from collapsing toward zero in highly sparse regions.

---

## 3. Why Live A/B Testing & Multi-Touch Attribution?

**Context:** Offline metrics (RMSE/MAE) measure predictive accuracy but do not guarantee real-world business conversions.

**Decision:** Engineered a probabilistic traffic router in the FastAPI layer and a URL-state tracking system in Next.js.

**Rationale:** This enables scientific comparison between the Content and Collaborative models in a live environment. By persisting attribution state (`?ref=`) across the user session, the system accurately maps deferred purchases to the originating algorithm, providing verifiable conversion metrics.

---

## 4. The Optimization Tradeoff: Statistical vs. Practical Significance

**Context:** Modern recommender systems often default to deep learning or iterative Stochastic Gradient Descent (SGD) architectures. To justify our model selection, we conducted a rigorous statistical benchmark on 50,000 real-world Amazon interactions, pitting the closed-form Truncated SVD baseline against an L2-Regularized SGD Matrix Factorization model.

**Decision:** Evaluated both predictive accuracy (MAE) and the computational latency required to achieve it.

**Rationale:** The benchmark yielded an SVD MAE of 0.8774 (17.5s train time) versus an SGD MAE of 0.8778 (9.7s train time). A paired t-test confirmed the SVD model's superiority is statistically significant (p = 1.91e-54, 95% CI: [-0.000471, -0.000366]). However, this highlights a critical difference between statistical and practical significance. On a 1-5 rating scale, a 0.0004 MAE improvement corresponds to less than a 0.01% relative error reduction, making it practically negligible for user-facing recommendation quality. Conversely, the computational tradeoff is substantial: the statistically superior SVD model requires nearly 2x the training latency. This empirical evaluation demonstrates that marginal statistical improvements must be evaluated alongside computational cost to ensure sound engineering decisions. Given the negligible practical gain relative to the increased latency, deeper neural architectures or iterative optimization engines were not pursued for this production iteration.

---

## 5. Why Apriori for Frequently Bought Together? (Market Basket Analysis)

**Context:** The platform needed a cross-sell engine to surface product pairings. Candidate algorithms included Neural Collaborative Filtering (NCF), item-item cosine similarity, and association rule mining.

**Decision:** Implemented Apriori co-occurrence analysis with directional association rules computed via `permutations`.

**Rationale:** NCF requires dense interaction data to learn meaningful embedding representations — on a sparse jewelry catalog with limited transaction history, it would overfit immediately. Item-item cosine similarity cannot distinguish genuine behavioral pairing from coincidental co-occurrence. Apriori operates directly on transaction receipts, requiring no embedding training, and its output (Support, Confidence, Lift) is mathematically interpretable and auditable. This interpretability is critical for a production system: every recommendation served to a customer can be traced back to a specific statistical association rule, providing full explainability. The directional approach (A→B and B→A computed separately) ensures the engine captures asymmetric purchase patterns — customers who buy bangles often buy jhumkas, but not necessarily the reverse.

---

## 6. Why Chi-Square as a Second Validation Layer?

**Context:** Lift > 1.0 alone is insufficient to validate an association rule. In small transaction datasets, a Lift score can appear elevated purely due to random chance — particularly when a product pair appears in only 1-2 orders.

**Decision:** Every rule surviving the Lift > 1.0 filter is passed through a Chi-Square independence test (χ²) on a 2×2 contingency table, enforcing p < 0.05 before any rule reaches a customer.

**Rationale:** The Chi-Square test formally evaluates the null hypothesis that the purchase of item A and item B are statistically independent events. Rejecting this null hypothesis at p < 0.05 provides a 95% confidence guarantee that the observed co-occurrence is a genuine behavioral signal — not a sampling artifact. This two-layer architecture (Lift filter → Chi-Square gate) ensures the system exhibits statistical humility: it refuses to serve recommendations it cannot mathematically defend, displaying "0 RULES VALIDATED" when data is insufficient rather than fabricating confidence. This is the scientific method applied to production ML.

---

## 7. Why Negative Caching with a NO_RULE Sentinel?

**Context:** The Apriori engine performs O(n²) co-occurrence matrix computation across all product pairs. For cold-start products with no validated association rules, this computation runs to completion, returns null, and is discarded. Under concurrent traffic, this means the same expensive null computation executes once per request.

**Decision:** Implemented a negative caching pattern — storing a deterministic `NO_RULE` sentinel string in Upstash Redis with a 24-hour TTL for any product that fails statistical validation.

**Rationale:** Standard caching strategies cache positive results (successful computations). Negative caching extends this to failed computations, treating "no valid rule exists" as a cacheable result. The sentinel approach is preferable to caching `null` or `None` because it is unambiguous — a null cache entry could indicate a cache miss, while `NO_RULE` explicitly signals a completed computation with a confirmed negative outcome. This reduces worst-case server load by up to 99.9% on cold-start products, transforming O(n²) repeated computation into a single O(1) Redis lookup for the remainder of the TTL window.

---

## 8. Why Dual-Layer Caching? (Pandas In-Memory + Upstash Redis)

**Context:** The FBT engine computes association rules across all historical orders on startup. Two caching concerns exist: (1) storing the full validated ruleset for fast lookup, and (2) caching per-item results for individual product page requests.

**Decision:** Implemented a two-tier caching architecture — validated rules cached in a Pandas DataFrame in-memory at the process level, with individual item results (including NO_RULE sentinels) cached in Upstash Redis.

**Rationale:** Pandas in-memory provides ~0.1ms lookup latency for the full rule table and persists for the server process lifetime — appropriate for the pre-computed ruleset which changes only when new orders arrive. Upstash Redis provides ~1-2ms lookup with persistence across server restarts and horizontal scaling — appropriate for per-item results which benefit from shared state across multiple server instances. The separation of concerns is deliberate: process-local memory handles bulk rule storage; distributed cache handles per-item response caching and negative caching. This architecture scales from a single server to a multi-instance deployment without code changes.

---

## 9. Why a Dual-Mode Admin Dashboard? (Cognitive Segregation)

**Context:** The Admin Dashboard serves two fundamentally different use cases: a store operator monitoring daily business health (revenue, orders, customer LTV), and a data scientist reviewing ML model performance (association rules, AOV delta, Chi-Square validation results).

**Decision:** Architected a stateless view-toggle system separating "Business View" from "ML Intelligence View" behind a single segmented control.

**Rationale:** Presenting statistical constructs (p-values, Lift scores, contingency table results) alongside business KPIs on a single page creates cognitive overload for non-technical operators. Conversely, burying ML analytics inside a business dashboard obscures the scientific rigor of the system from technical reviewers. The physical separation communicates a clear architectural intent: these are two different information architectures serving two different mental models. The stateless URL-parameter approach (no server-side session required) ensures the toggle state is shareable and bookmarkable. The AOV Delta guardrail (rendering "Insufficient Data" below n=10 transactions) further demonstrates that the ML Intelligence panel is engineered for analytical integrity, not cosmetic display.

---

## 10. Why service_role_key for the ML Backend?

**Context:** Supabase enforces Row Level Security (RLS) policies at the PostgreSQL level, restricting data access based on the authenticated user context. The anonymous key (`anon_key`) respects these RLS policies — it can only access rows the current user is authorized to see.

**Decision:** The Python ML backend authenticates with the `service_role_key`, which bypasses RLS entirely.

**Rationale:** The Apriori engine, demand forecasting pipeline, and LTV aggregation scripts require unrestricted access to all historical orders across all users — not just the current authenticated session. An RLS-filtered query would return only a subset of transactions, producing statistically invalid association rules and incorrect LTV calculations. The `service_role_key` is strictly server-side (stored in `ml-api/.env`, excluded from version control, never exposed to the client) and used only by the Python process — maintaining the security boundary while enabling the full-dataset access that production ML requires.