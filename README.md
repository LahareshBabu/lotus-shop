# LOTUS: E-Commerce Recommendation System
Full-stack ML system with production deployment and MLOps practices.

## 🔗 Links
**Live Demo:** [Insert Vercel URL] | **GitHub:** [Insert GitHub URL]

## 🛠️ Tech Stack
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white) ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)

## System Architecture

### Frontend & Infrastructure
- **UI:** Next.js 14, React Server Components, Tailwind CSS
- **Database:** Supabase PostgreSQL
- **Caching:** Upstash Redis (frontend), Pandas in-memory (ML backend)
- **DevOps:** Docker, GitHub Actions CI/CD with automated testing

### ML Backend (Python FastAPI)
- **Collaborative Filtering:** Mean-centered Truncated SVD
- **Content-Based Filtering:** TF-IDF + Cosine Similarity (cold-start fallback)
- **A/B Router:** Model experimentation infrastructure
- **Data Pipeline:** Event tracking (views, wishlists, cart additions)

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
RMSE: 0.6547
MAE: 0.3681
==================================================