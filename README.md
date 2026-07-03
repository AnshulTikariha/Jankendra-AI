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

## Quick Start

```bash
# View SRS in browser
open docs/srs.html

# Read architecture and plan
cat docs/architecture.md
cat docs/plan.md

# Start the frontend blank app
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
uvicorn app.main:app --reload
```

Health checks are available at `/health` and `/api/v1/health`. OpenAPI is available at `/docs`.

## Repository

https://github.com/AnshulTikariha/Jankendra-AI
