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

## Database setup

```bash
alembic upgrade head
python scripts/seed_demo_data.py
```

Check seeded wards:

```bash
sqlite3 data/jankendra.db "SELECT id, code, name, population, registered_voters FROM db1_wards;"
```

## Auth (phone + OTP)

Demo OTP for all users: `246810`

| Role | Phone |
|------|-------|
| Leader | `9876543210` |
| Staff | `9876543211` |
| Citizen | `9876543212` |

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'

curl -X POST http://127.0.0.1:8000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"246810","role":"leader"}'

curl http://127.0.0.1:8000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

Frontend integration guide: [docs/api.md](../docs/api.md)  
OpenAPI docs: `http://127.0.0.1:8000/docs`



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
