# Jankendra-AI

AI-powered constituency intelligence platform for elected representatives — development prioritization, complaint clustering, commitment tracking, and RAG-based governance insights.

## Documentation

| Document | Description |
|----------|-------------|
| [README.html](README.html) | Modern HTML project overview |
| [docs/srs.html](docs/srs.html) | Software Requirements Specification (open in browser) |
| [docs/architecture.md](docs/architecture.md) | System architecture — Frontend, Backend, AI Modules |
| [docs/plan.md](docs/plan.md) | 8-week implementation plan (Phases 0–6) |
| [docs/backend-database.md](docs/backend-database.md) | Backend framework, ORM, and database choices |
| [docs/api.md](docs/api.md) | Frontend API guide — endpoints, payloads, page mapping (Saurabh) |

## Team Roles

| Person | Role |
|--------|------|
| Anshul | Backend |
| Bharath | AI Modules |
| Saurabh | Front End and Architectures |

## Tech Stack

| Layer | Development | Production |
|-------|-------------|------------|
| Backend | FastAPI + SQLAlchemy 2.0 + Alembic | Same |
| Database | SQLite + sqlite-vec | PostgreSQL 16+ + pgvector |
| AI / LLM | Gemini API | Ollama (local) |
| Frontend | React + TypeScript + Tailwind | Same |

## Local Development — Ports & URLs

The monorepo runs as **three separate services** in development. Use the ports below so the frontend proxy and backend AI integration line up.

| Service | Default port | Base URL | Purpose |
|---------|-------------|----------|---------|
| **Frontend** (Vite + React) | `5173` | http://localhost:5173 | Citizen / staff UI |
| **Backend** (FastAPI) | `8011` | http://127.0.0.1:8011 | Auth, complaints, wards, voice upload |
| **AI Modules** (FastAPI) | `8012` | http://127.0.0.1:8012 | Text analysis (`/analyze-text`), future AI routes |

> **Note:** Port `8000` is the default in `uvicorn --reload` examples, but on many machines another app already uses it. This project uses **8011** for the Jankendra backend in local dev to avoid conflicts.

### How they connect

```
Browser  →  http://localhost:5173
              └─ /api/*  (Vite proxy)  →  Backend :8011
                                              └─ analyze-text  →  AI Modules :8012
```

- The **browser** only talks to the frontend origin (`5173`). API calls go to `/api/v1/...` and Vite forwards them to the backend.
- The **backend** calls the AI Modules service over HTTP for complaint text analysis (`AI_MODULES_API_URL`).
- Voice transcription and GCP credentials are handled by the **backend** only — never put service account keys in the frontend.

### URLs by service

#### Frontend (`frontend/`)

| What | URL |
|------|-----|
| App | http://localhost:5173 |
| API (proxied) | http://localhost:5173/api/v1/... |
| Dev proxy target | Set in `frontend/.env` → `VITE_DEV_BACKEND_URL` (default `http://127.0.0.1:8011`) |

#### Backend (`backend/`)

| What | URL |
|------|-----|
| Root health | http://127.0.0.1:8011/health |
| API health | http://127.0.0.1:8011/api/v1/health |
| OpenAPI / Swagger | http://127.0.0.1:8011/docs |
| Auth OTP request | `POST` http://127.0.0.1:8011/api/v1/auth/otp/request |
| Complaints analyze | `POST` http://127.0.0.1:8011/api/v1/complaints/analyze-text |
| Voice transcribe | `POST` http://127.0.0.1:8011/api/v1/voice/transcribe |

Configure in `backend/.env`:

- `AI_MODULES_API_URL=http://127.0.0.1:8012` — where the backend proxies text analysis
- `GCP_PROJECT_ID`, `GCP_SERVICE_ACCOUNT_JSON_PATH` — voice + cloud features

#### AI Modules (`ai_modules/`)

| What | URL |
|------|-----|
| Root health | http://127.0.0.1:8012/health |
| API health | http://127.0.0.1:8012/api/v1/health |
| OpenAPI / Swagger | http://127.0.0.1:8012/docs |
| Text analysis | `POST` http://127.0.0.1:8012/api/v1/analyze-text |

Configure in `ai_modules/.env`:

- `PORT=8012`
- `GOOGLE_APPLICATION_CREDENTIALS` — path to GCP service account JSON
- `GOOGLE_CLOUD_PROJECT`, `VERTEX_GEMINI_MODEL=gemini-2.5-flash`

### Run all three (three terminals)

```bash
# Terminal 1 — AI Modules (port 8012)
cd /path/to/Jankendra-AI
cp ai_modules/.env.example ai_modules/.env   # edit GCP credentials
backend/.venv/bin/pip install -e .           # if not already installed
backend/.venv/bin/uvicorn ai_modules.api.main:app --host 127.0.0.1 --port 8012

# Terminal 2 — Backend (port 8011)
cd backend
source .venv/bin/activate
cp .env.example .env                         # edit GCP + AI_MODULES_API_URL
uvicorn app.main:app --host 127.0.0.1 --port 8011 --reload

# Terminal 3 — Frontend (port 5173)
cd frontend
cp .env.example .env                         # set VITE_DEV_BACKEND_URL=http://127.0.0.1:8011
npm install
npm run dev
```

Verify:

```bash
curl http://127.0.0.1:8012/health          # AI Modules
curl http://127.0.0.1:8011/api/v1/health   # Backend
curl http://localhost:5173/api/v1/health   # Frontend proxy → Backend
```

## Quick Start

```bash
# View SRS in browser
open docs/srs.html

# Read architecture and plan
cat docs/architecture.md
cat docs/plan.md
```

See **Local Development — Ports & URLs** above for the full three-service setup. Minimal frontend-only start:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
cp .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8011 --reload
```

Health checks: `/health` and `/api/v1/health`. OpenAPI: http://127.0.0.1:8011/docs

### AI Modules

```bash
# From repo root (uses same venv as backend)
pip install -e .
uvicorn ai_modules.api.main:app --host 127.0.0.1 --port 8012
```

OpenAPI: http://127.0.0.1:8012/docs

## Repository

https://github.com/AnshulTikariha/Jankendra-AI
