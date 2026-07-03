# Backend Framework & Database Guide

> **Status:** Planning / Pre-Development  
> **Last updated:** July 2026

This document answers: **which backend framework handles database services**, **which database we use**, and **how data access is structured**.

Related: [architecture.md](architecture.md) | [plan.md](plan.md) | [srs.html](srs.html)

---

## 1. Backend Framework Overview

| Component | Technology | Role |
|-----------|------------|------|
| **Web framework** | FastAPI | HTTP API, routing, dependency injection, OpenAPI generation |
| **ASGI server** | Uvicorn | Production-grade async server |
| **ORM** | SQLAlchemy 2.0 | Object-relational mapping, query building, connection pooling |
| **Migrations** | Alembic | Version-controlled schema changes |
| **Validation** | Pydantic v2 | Request/response schemas, settings management |
| **Auth** | python-jose + passlib | JWT tokens, password hashing |
| **Background jobs** | APScheduler (v1) | Hourly escalation, weekly digest |
| **Language** | Python 3.11 | Shared runtime with AI Modules |

### Why FastAPI + SQLAlchemy?

- **Async-native:** FastAPI handles concurrent requests; SQLAlchemy 2.0 supports async sessions
- **Type-safe:** Pydantic + SQLAlchemy 2.0 typed mappings catch errors at development time
- **Auto-documented:** OpenAPI spec generated from route definitions — frontend can codegen its API client
- **Ecosystem fit:** Same Python runtime as AI Modules — no cross-language boundary in v1
- **Migration path:** SQLAlchemy abstracts SQLite ↔ PostgreSQL — swap `DATABASE_URL`, not queries

---

## 2. Database Choice

### Primary databases

| Environment | Database | Version | Vector Extension |
|-------------|----------|---------|------------------|
| **Development** | **SQLite** | 3.x (bundled) | **sqlite-vec** |
| **Production** | **PostgreSQL** | 16+ | **pgvector** |

### Why SQLite for development?

- Zero installation — file-based, ships with Python
- Instant setup for new developers (`DATABASE_URL=sqlite:///./jankendra.db`)
- Full SQLAlchemy compatibility — same models, same migrations
- Portable — entire DB is one file, easy to reset and seed

### Why PostgreSQL for production?

- **ACID compliance** with concurrent read/write (multiple staff users)
- **pgvector** — mature, production-proven vector similarity search for clustering and RAG
- **JSONB, full-text search, partitioning** — available when needed at scale
- **Multi-tenant ready** — row-level security and schema isolation for future SaaS
- **Managed hosting** — available on AWS RDS, GCP Cloud SQL, Supabase, etc.

### Environment switch

One environment variable controls the entire stack:

```bash
# Development
DATABASE_URL=sqlite:///./data/jankendra.db

# Production
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/jankendra
VECTOR_STORE=pgvector
```

SQLAlchemy dialect handles the rest. Alembic migrations run against either backend.

---

## 3. Vector Storage

Embeddings (complaint clustering, RAG retrieval) require vector similarity search alongside relational data.

| Environment | Solution | Integration |
|-------------|----------|---------------|
| Development | **sqlite-vec** | SQLite extension loaded at connection time |
| Production | **pgvector** | PostgreSQL extension, `CREATE EXTENSION vector` |

**Embedding model:** `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions, CPU-friendly, loads in <3s per NFR-02)

The vector store is accessed through a **provider interface** in `ai_modules/core/interfaces.py`, with separate adapters:

- `ai_modules/core/providers/sqlite_vec.py`
- `ai_modules/core/providers/pgvector.py`

Backend repositories never touch vectors directly — they delegate to the AI module's VectorStore adapter.

---

## 4. Data Access Architecture

Backend database services follow a **three-layer pattern**:

```
API Route (FastAPI)
    ↓ validates request
Service Layer (business logic)
    ↓ orchestrates
Repository Layer (data access)
    ↓ SQLAlchemy queries
Database (SQLite / PostgreSQL)
```

### 4.1 Models (`backend/app/models/`)

SQLAlchemy 2.0 declarative models with typed mappings:

```python
# Conceptual example — not yet implemented
class Complaint(Base):
    __tablename__ = "complaints"
    __table_args__ = {"schema": "db4_complaints"}  # logical store separation

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ward_id: Mapped[int] = mapped_column(ForeignKey("db1_constituency.wards.id"))
    description: Mapped[str]
    category: Mapped[str]
    citizen_contact: Mapped[str | None]
    cluster_id: Mapped[uuid.UUID | None]
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    # No updated_at — immutable (FR-CM-05)
    # No delete method — append-only
```

### 4.2 Repositories (`backend/app/repositories/`)

Encapsulate all SQL — services never write raw queries:

```python
# Conceptual example
class ComplaintRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: ComplaintCreate) -> Complaint:
        complaint = Complaint(**data.model_dump())
        self.session.add(complaint)
        await self.session.flush()
        return complaint

    async def list_by_ward(self, ward_id: int) -> list[Complaint]:
        result = await self.session.execute(
            select(Complaint).where(Complaint.ward_id == ward_id)
        )
        return list(result.scalars().all())
```

### 4.3 Services (`backend/app/services/`)

Business logic and AI orchestration:

```python
# Conceptual example
class ComplaintService:
    def __init__(self, repo: ComplaintRepository, issue_engine: IssueEngine):
        self.repo = repo
        self.issue_engine = issue_engine

    async def create_complaint(self, data: ComplaintCreate) -> ComplaintResponse:
        complaint = await self.repo.create(data)
        cluster_result = await self.issue_engine.cluster(
            text=data.description,
            ward_id=data.ward_id,
        )
        complaint.cluster_id = cluster_result.cluster_id
        return ComplaintResponse.from_orm(complaint)
```

### 4.4 Dependency injection (FastAPI)

```python
# Conceptual example
async def get_complaint_service(
    session: AsyncSession = Depends(get_db_session),
) -> ComplaintService:
    repo = ComplaintRepository(session)
    issue_engine = IssueEngine(get_vector_store())
    return ComplaintService(repo, issue_engine)
```

---

## 5. Four Logical Stores → Physical Schema

All four stores live in **one physical database**, separated by PostgreSQL schemas (or table prefixes on SQLite):

| Schema / Prefix | Store | Write Policy | ORM Package |
|-----------------|-------|--------------|-------------|
| `db1_constituency` | Static ward data | Staff only | `models/constituency.py` |
| `db2_rag_facts` | Historical facts for RAG | System + staff | `models/rag_facts.py` |
| `db3_commitments` | Active deadlines | System + staff | `models/commitments.py` |
| `db4_complaints` | Immutable complaint log | Append-only | `models/complaints.py` |

### Access control enforcement

| Store | Who can write | Enforcement |
|-------|---------------|-------------|
| DB1 | Staff role only | Service-layer check + API dependency |
| DB2 | System jobs + staff | Service-layer; AI writes via orchestrator |
| DB3 | System (ingestion) + staff (complete/extend) | Service-layer |
| DB4 | System (complaint intake) | Append-only repository — no update/delete methods |

AI modules **never** receive a raw database session. They receive typed DTOs and return typed results. The backend service layer persists AI outputs.

---

## 6. Migrations (Alembic)

```
backend/
├── alembic/
│   ├── versions/          # One file per schema change
│   │   ├── 001_initial_schema.py
│   │   ├── 002_add_commitments.py
│   │   └── ...
│   └── env.py             # Async engine config
└── alembic.ini
```

**Workflow:**

```bash
# Generate migration after model change
alembic revision --autogenerate -m "add complaint clusters table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

Migrations are tested against both SQLite (dev) and PostgreSQL (CI/prod) to catch dialect differences early.

---

## 7. Connection & Session Management

```python
# Conceptual config (backend/app/core/config.py)
class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/jankendra.db"
    db_echo: bool = False          # SQL logging (dev only)
    db_pool_size: int = 5          # PostgreSQL connection pool
    db_max_overflow: int = 10

# Async session factory
async_engine = create_async_engine(settings.database_url, ...)
async_session = async_sessionmaker(async_engine, expire_on_commit=False)
```

**SQLite note:** Uses `aiosqlite` driver for async compatibility with FastAPI.

**PostgreSQL note:** Uses `asyncpg` driver for native async performance.

---

## 8. Seed Data

Demo constituency from SRS Appendix 11.1:

- **MLA:** Shri Rajendra Kumar Verma, Ward 42 South Delhi
- **6 wards**, 2,70,000 population, 1,82,400 registered voters
- **Anchor issue:** Recurring drainage canal overflow in Ward 42

Seed script: `scripts/seed_demo_data.py` — populates DB1 with ward profiles, sample infrastructure status, and scheme penetration rates.

---

## 9. Testing Strategy

| Level | Tool | Database |
|-------|------|----------|
| Unit tests | pytest | In-memory SQLite (`:memory:`) |
| Integration tests | pytest + httpx | File-based SQLite with migrations |
| E2E tests | Playwright | Seeded SQLite or test PostgreSQL |
| CI | GitHub/GitLab Actions | PostgreSQL service container |

Each test run creates a fresh database, runs migrations, seeds minimal data, and tears down.

---

## 10. Quick Reference

| Question | Answer |
|----------|--------|
| Backend framework? | **FastAPI** |
| ORM? | **SQLAlchemy 2.0** |
| Migrations? | **Alembic** |
| Dev database? | **SQLite** + sqlite-vec |
| Prod database? | **PostgreSQL 16+** + pgvector |
| How to switch? | Change `DATABASE_URL` env var |
| Vector embeddings? | sentence-transformers (`all-MiniLM-L6-v2`) |
| Who touches the DB? | Backend repositories only — AI modules use DTOs |
| Complaint deletion? | Never — append-only (FR-CM-05) |
| Static data writes? | Staff only — AI cannot modify DB1 (FR-CI-05) |
