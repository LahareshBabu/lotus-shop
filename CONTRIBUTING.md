# Contributing to LOTUS

Thank you for your interest in the LOTUS project. This document provides complete instructions for setting up the local development environment.

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Next.js frontend runtime |
| Python | 3.11+ | FastAPI ML backend |
| Git | Any | Version control |
| Supabase account | — | PostgreSQL database + Auth |
| Upstash account | — | Redis caching layer |

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/lotus-shop
cd lotus-shop
```

### 2. Install Dependencies

```bash
# Frontend dependencies
npm install

# ML Backend dependencies
cd ml-api
pip install -r requirements.txt
cd ..
```

### 3. Configure Environment Variables

The project requires two separate environment files — one for the Next.js frontend and one for the Python ML backend.

**Frontend (`/.env.local`):**
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

**ML Backend (`/ml-api/.env`):**
```bash
cp ml-api/.env.example ml-api/.env
```

Open `ml-api/.env` and fill in:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
UPSTASH_REDIS_URL=rediss://your_upstash_redis_url
```

> **Important:** The ML backend uses the `service_role_key` (not the public `anon_key`) because the Python Data Science engine requires direct access to all historical orders for Apriori computation, bypassing Row Level Security. Never expose this key on the client side.

> **Note:** Never commit `.env.local` or `ml-api/.env` to version control. Both files are excluded via `.gitignore`.

---

### 4. Run Development Servers

Both servers must run simultaneously in separate terminals.

**Terminal 1 — Next.js Frontend:**
```bash
npm run dev
```
Frontend available at: `http://localhost:3000`

**Terminal 2 — FastAPI ML Backend:**
```bash
cd ml-api
uvicorn main:app --reload
```
ML API available at: `http://localhost:8000`

Swagger UI available at: `http://localhost:8000/docs`

---

### 5. Verify Setup

Once both servers are running, verify the following:

| Check | URL / Location | Expected Output |
|---|---|---|
| Frontend loads | `http://localhost:3000` | Lotus storefront |
| ML API health | `http://localhost:8000` | `{"status": "Online"}` |
| Swagger UI | `http://localhost:8000/docs` | Interactive API docs |
| Redis connection | Terminal 2 output | `[INFO] Upstash Redis Cache: ONLINE` |

---

## Running Tests

**Frontend (Jest):**
```bash
npm test
```

**ML Backend (pytest):**
```bash
cd ml-api
pytest tests/ -v
```

**Full CI simulation (both pipelines):**
```bash
# Frontend
npm audit
npm test
npm run build

# Backend
cd ml-api
flake8 . --max-line-length=120
safety check
pytest tests/ -v
```

---

## Project Architecture

For a full technical breakdown of all ML systems, security architecture, and design decisions, see:

- [`README.md`](./README.md) — Project overview and ML documentation
- [`ARCHITECTURE_DECISIONS.md`](./ARCHITECTURE_DECISIONS.md) — Detailed engineering decision log

---

## Environment Variable Reference

| Variable | Location | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Supabase anonymous key (client-safe) |
| `UPSTASH_REDIS_REST_URL` | `.env.local` | Upstash REST URL for Next.js |
| `UPSTASH_REDIS_REST_TOKEN` | `.env.local` | Upstash REST token for Next.js |
| `SUPABASE_URL` | `ml-api/.env` | Supabase URL for Python backend |
| `SUPABASE_KEY` | `ml-api/.env` | Supabase **service_role_key** — bypasses RLS for ML data access |
| `UPSTASH_REDIS_URL` | `ml-api/.env` | Redis `rediss://` URL for Python |

---

## License

MIT License — see [LICENSE](./LICENSE) file for details.