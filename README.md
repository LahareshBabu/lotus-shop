# LOTUS: Full-Stack E-Commerce Platform & ML Recommendation System
Full-stack e-commerce platform featuring a custom dual-model recommendation engine and parallel CI/CD deployment pipelines.

## 🔗 Links
**Live Demo:** [Insert Vercel URL] | **GitHub:** [Insert GitHub URL]

## 🛠️ Tech Stack
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white) ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)

## System Architecture

```mermaid
graph TD
    Client[Next.js Client UI] -->|UI Events & Carts| Router(FastAPI A/B Router)
    
    subgraph ML Engine
        Router -->|Cold Start| Content[TF-IDF Engine]
        Router -->|Behavioral| Collab[Truncated SVD]
    end
    
    subgraph Infrastructure
        Client <-->|Sub-30ms Fetch| Redis[(Upstash Redis)]
        Content & Collab <-->|Telemetry & Vector Storage| DB[(Supabase PostgreSQL)]
        Content & Collab <-->|Matrix Cache| Pandas[(In-Memory Pandas)]
    end
```

### Frontend & Infrastructure
- **UI:** Next.js 14, React Server Components, Tailwind CSS
- **Database:** Supabase PostgreSQL
- **Caching:** Upstash Redis (frontend), Pandas in-memory (ML backend)
- **DevOps:** Parallel GitHub Actions CI/CD (Frontend & ML Backend), automated testing (pytest), linting, and security auditing.

### ML Backend (Python FastAPI)
- **Collaborative Filtering:** Mean-centered Truncated SVD
- **Content-Based Filtering:** TF-IDF + Cosine Similarity (cold-start fallback)
- **A/B Router:** Probabilistic model selection and experimentation infrastructure
- **Data Pipeline:** Stateful event tracking (views, wishlists, cart additions)

## Technical Challenge: Sparse Matrix Problem
**Problem:** Standard collaborative filtering fails on highly sparse data.
- Dataset: 50,000 interactions (25,127 users × 3,262 products)
- Matrix sparsity: 99.93%
- Initial baseline: MAE 4.02 (naive SVD predictions collapsed toward zero)

**Solution:** Mean-centering preprocessing before matrix factorization.
1. Center ratings around each user's average
2. Train SVD on centered values
3. Add user means back to predictions

**Result:** MAE 0.3681

```text
📊 EVALUATION METRICS
==================================================
Dataset: UCSD Amazon Reviews (Clothing, Shoes & Jewelry)
Sample Size: 50,000 interactions
Matrix Sparsity: 99.93%
--------------------------------------------------
Popularity Baseline MAE: 0.5536
Collaborative SVD MAE: 0.3681
Collaborative SVD RMSE: 0.6547
==================================================
```