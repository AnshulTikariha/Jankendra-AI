# Jankendra-AI

AI-powered constituency intelligence platform for elected representatives — development prioritization, complaint clustering, commitment tracking, and RAG-based governance insights.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/srs.html](docs/srs.html) | Software Requirements Specification (open in browser) |
| [docs/architecture.md](docs/architecture.md) | System architecture — Frontend, Backend, AI Modules |
| [docs/plan.md](docs/plan.md) | 8-week implementation plan (Phases 0–6) |
| [docs/backend-database.md](docs/backend-database.md) | Backend framework, ORM, and database choices |

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
```

## Repository

https://github.com/AnshulTikariha/Jankendra-AI
