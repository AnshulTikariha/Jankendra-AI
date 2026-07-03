# Jankendra-AI Backend

FastAPI backend scaffold for the Jankendra-AI architecture.

## Local setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
cp .env.example .env
uvicorn app.main:app --reload
```

OpenAPI is available at `http://127.0.0.1:8000/docs`.

## Health check

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/v1/health
```

## Project layout

```text
app/
  api/v1/          Versioned REST endpoints
  core/            Settings, database session, lifecycle hooks
  models/          SQLAlchemy ORM models
  schemas/         Pydantic request/response DTOs
  services/        Business logic orchestration
  repositories/    Data access abstraction
  jobs/            Scheduled task entrypoints
alembic/           Database migrations
tests/             Backend tests
```
