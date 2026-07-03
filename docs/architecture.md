# Jankendra-AI — System Architecture

> **Status:** Planning / Pre-Development  
> **Version:** 1.0  
> **Last updated:** July 2026

This document defines the long-term, scalable architecture for Jankendra-AI, divided into three independent layers: **Frontend**, **Backend**, and **AI Modules**.

## Project Roles

| Person | Ownership |
|--------|-----------|
| Anshul | Backend |
| Bharath | AI Modules |
| Saurabh | Front End and Architectures |

Related documents:

- [Software Requirements Specification](srs.html) — functional and non-functional requirements
- [Implementation Plan](plan.md) — phased delivery roadmap
- [Backend & Database Guide](backend-database.md) — DB stack, ORM, and data access patterns

---

## 1. Guiding Principles

| Principle | Rationale |
|-----------|-----------|
| **Clear module boundaries** | Frontend, Backend, and AI can evolve and scale independently |
| **Contract-first APIs** | OpenAPI between Frontend ↔ Backend; typed DTOs between Backend ↔ AI |
| **Provider abstraction** | Swap Gemini → Ollama, SQLite → PostgreSQL without rewriting business logic |
| **Async by default for AI work** | Clustering, transcript parsing, and RAG stay off the request hot path |
| **Local-first, cloud-ready** | v1 runs on one machine; architecture supports multi-constituency SaaS later |
| **Explicit orchestration** | No LangChain — readable, testable pipelines |
| **Immutable audit trails** | Complaints and commitment history are never deleted (SRS FR-CM-05) |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
│              React + TypeScript + Tailwind CSS                  │
│   Dashboard │ To-Do │ Commitments │ Chat │ Log Issue │ Digest   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST + SSE (chat streaming)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                            │
│                    FastAPI + SQLAlchemy 2.0                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Auth/RBAC│  │ Orchestrator │  │ Job Queue│  │ Repositories│ │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────┘ │
│                             │                                   │
│  ┌──────────────────────────┴──────────────────────────────┐  │
│  │              DATA ACCESS LAYER (4 logical stores)         │  │
│  │  DB1 Static │ DB2 RAG Facts │ DB3 Commitments │ DB4 Raw  │  │
│  │              + Vector Store (sqlite-vec / pgvector)      │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Python package calls (typed DTOs)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI MODULES LAYER                          │
│  Ingestion │ Issue Engine │ Commitment Engine │ Prioritization  │
│  RAG Engine │ Digest Engine                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Provider Adapters: LLM │ Embedder │ VectorStore         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Three-Part Architecture

### 3.1 Frontend

**Purpose:** Single interface for Leaders and Staff across all workflows.

| Aspect | Choice |
|--------|--------|
| Framework | React 18+ with TypeScript |
| Styling | Tailwind CSS |
| Build | Vite |
| Server state | TanStack Query (React Query) |
| Client state | Zustand (lightweight) |
| API client | Generated from OpenAPI spec |

**Directory structure:**

```
frontend/
├── src/
│   ├── pages/           # Route-level views (Dashboard, Todo, Chat, etc.)
│   ├── components/      # Reusable UI components
│   ├── api/             # Typed API client
│   ├── hooks/
│   ├── types/           # Shared DTOs
│   └── i18n/            # Hindi + English (v2)
```

**Key design decisions:**

- Role-based UI driven by JWT claims (`leader` vs `staff`)
- Optimistic updates on to-do complete/extend actions
- Streaming chat via Server-Sent Events (SSE) or WebSocket
- Feature flags for gradual rollout of new capabilities
- Mobile-responsive (320px – 1440px, NFR-05)

**Pages (SRS Section 8.1):** Home Dashboard, To-Do List, Commitment Tracker, Development Plan, Log Issue, Upload Meeting, Digest, Chat, Profile, Context Injection.

---

### 3.2 Backend

**Purpose:** System of record, security boundary, and orchestrator between UI and AI.

| Aspect | Choice |
|--------|--------|
| Framework | **FastAPI** (Python 3.11) |
| ASGI server | Uvicorn |
| ORM | **SQLAlchemy 2.0** |
| Migrations | **Alembic** |
| Validation | Pydantic v2 |
| Background jobs | APScheduler (v1) → Celery + Redis (scale) |
| Auth | JWT with RBAC |

See [backend-database.md](backend-database.md) for full database and data-access details.

**Directory structure:**

```
backend/
├── app/
│   ├── api/v1/          # REST endpoints (dashboard, complaints, chat, etc.)
│   ├── core/            # Config, security, lifecycle events
│   ├── models/          # SQLAlchemy ORM models
│   ├── schemas/         # Pydantic request/response DTOs
│   ├── services/        # Business logic orchestration
│   ├── repositories/    # Data access abstraction
│   └── jobs/            # Scheduled tasks (escalation, digest)
├── alembic/             # Database migrations
└── tests/
```

**Responsibilities:**

- Authentication and authorization (Leader / Staff roles)
- Input validation and API versioning (`/api/v1/...`)
- Orchestrating AI module calls with typed inputs/outputs
- Persisting results to the four logical data stores
- Running background jobs (hourly weight escalation, weekly digest)
- Serving OpenAPI spec for frontend code generation

**What Backend does NOT do:**

- ML model inference or embedding computation
- LLM prompt construction or RAG retrieval logic
- Direct exposure of database to the frontend

---

### 3.3 AI Modules

**Purpose:** All intelligence — embeddings, clustering, extraction, scoring, RAG — isolated and independently testable.

| Aspect | Choice |
|--------|--------|
| Language | Python 3.11 (shared with backend) |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) |
| LLM (dev) | Google Gemini API |
| LLM (prod) | Ollama + Sarvam (Hindi, v2) |
| Orchestration | Explicit Python pipelines (no LangChain) |

**Directory structure:**

```
ai_modules/
├── core/
│   ├── interfaces.py        # LLMProvider, Embedder, VectorStore protocols
│   └── providers/           # gemini_llm, ollama_llm, sentence_transformer
├── ingestion/               # Transcript parsing, document segmentation
├── issue_engine/            # Ward-scoped complaint clustering
├── commitment_engine/       # Extraction + weight escalation
├── prioritization/          # Multi-factor development scoring
├── rag/                     # 4-layer context assembly + retrieval
├── digest/                  # Pure SQL aggregation (no LLM)
└── tests/
```

**Engines and SRS mapping:**

| Engine | SRS Requirements |
|--------|------------------|
| Ingestion | FR-CT-01 (transcript processing) |
| Issue Engine | FR-CM-02, FR-CM-03, FR-CM-04, FR-CM-06 |
| Commitment Engine | FR-CT-01 – FR-CT-05 |
| Prioritization | FR-DP-01 – FR-DP-05 |
| RAG Engine | FR-RA-01 – FR-RA-04 |
| Digest Engine | FR-DD-03, FR-DD-04 |

**Provider abstraction (swap via config, not code changes):**

```
LLMProvider     →  Gemini (dev)  |  Ollama + Sarvam (prod)
Embedder        →  sentence-transformers (all environments)
VectorStore     →  sqlite-vec (dev)  |  pgvector (prod)
```

---

## 4. Data Architecture

Four logical stores (SRS Section 7), implemented as **PostgreSQL schemas** (or table namespaces) within one physical database:

| Store | Purpose | Write Access | Key Tables |
|-------|---------|--------------|------------|
| **DB1 — Static Constituency** | Ward demographics, infrastructure, schemes | Staff only | `wards`, `demographics`, `infrastructure`, `schemes` |
| **DB2 — RAG Historical Facts** | Meeting summaries, resolved commitments, cluster snapshots | System + staff | `meeting_summaries`, `resolved_commitments`, `cluster_snapshots` |
| **DB3 — Timely Commitments** | Active deadlines with escalating weights | System (ingestion) + staff actions | `commitments`, `commitment_history` |
| **DB4 — Immutable Complaints** | Raw complaint audit trail | Append-only (system) | `complaints`, `complaint_clusters` |

**Vector storage** (embeddings for clustering and RAG) lives alongside the relational data:

- **Development:** sqlite-vec extension on SQLite
- **Production:** pgvector extension on PostgreSQL

> **Design principle:** No single store answers a complex governance question. All four stores together provide complete constituency intelligence.

---

## 5. Database Choice

| Environment | Database | Vector Extension | Why |
|-------------|----------|------------------|-----|
| **Development** | **SQLite** | sqlite-vec | Zero setup, portable, fast iteration |
| **Production** | **PostgreSQL 16+** | pgvector | ACID, concurrent writes, proven at scale, single config switch |

Migration between environments requires **one config change** (`DATABASE_URL`) — no application code changes (NFR-07).

Full details: [backend-database.md](backend-database.md)

---

## 6. API Surface

Base path: `/api/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Aggregated live dashboard data |
| GET / POST | `/complaints` | List / create complaints |
| POST | `/meetings/upload` | Upload transcript → async processing job |
| GET | `/jobs/{id}` | Async job status |
| GET / PATCH | `/todo` | Weighted to-do list; complete or extend |
| GET | `/priorities` | Development prioritization rankings |
| POST | `/chat` | RAG assistant query (streaming) |
| GET | `/digest` | Weekly digest data |
| POST | `/context/inject` | Upload `.txt` for RAG knowledge base |
| CRUD | `/constituency/*` | Staff-only static constituency data |

OpenAPI spec auto-generated by FastAPI at `/docs`.

---

## 7. Background Jobs

| Job | Schedule | Module | SRS |
|-----|----------|--------|-----|
| Weight escalation | Every hour | `commitment_engine.weight_escalator` | NFR-04 |
| Weekly digest prep | Sunday 00:00 | `digest.sql_aggregator` | FR-DD-03 |
| Cluster recompute | On new complaint (async) | `issue_engine.clusterer` | FR-CM-02 |

---

## 8. Security & Privacy

```
Audio recordings      →  never leave the device
Meeting transcripts   →  never leave the laptop
Constituency data     →  never leave the laptop
Complaint details     →  never leave the laptop
Commitments           →  never leave the laptop
AI responses          →  generated locally in production
```

- Privacy enforced by architecture, not policy (NFR-01)
- DB1 (static constituency) is staff-write-only — AI never modifies it
- DB4 (complaints) is immutable — no deletion
- External Gemini API is development-only; production uses local Ollama

---

## 9. Repository Layout (Monorepo)

```
Jankendra-AI/
├── frontend/            # React + TypeScript app
├── backend/             # FastAPI application
├── ai_modules/          # Python package (pip install -e)
├── shared/
│   └── openapi/         # Generated API spec
├── docs/
│   ├── srs.html
│   ├── architecture.md  # This document
│   ├── plan.md
│   └── backend-database.md
├── scripts/             # Seed data, migration helpers
├── pyproject.toml       # Root workspace config
└── README.md
```

---

## 10. Deployment Topology

### v1 — Single machine (local-first)

```
[Laptop / On-prem Server]
  ├── Frontend (static build, served by FastAPI or nginx)
  ├── Backend (FastAPI + Uvicorn)
  ├── AI Modules (in-process Python package)
  ├── SQLite + sqlite-vec
  └── Ollama (local LLM)
```

### Future — Multi-constituency SaaS

```
[Load Balancer]
  ├── Frontend (CDN)
  ├── Backend instances (stateless, horizontal scale)
  ├── Redis (job queue + session cache)
  ├── PostgreSQL + pgvector (multi-tenant via constituency_id)
  └── AI Workers (optional separate containers)
```

---

## 11. Scalability Roadmap

| Stage | Trigger | Architecture change |
|-------|---------|---------------------|
| **v1** | Single constituency | Monolith, SQLite, in-process AI |
| **v1.5** | Second constituency pilot | Add `constituency_id` tenant column; migrate to PostgreSQL |
| **v2** | 10+ constituencies | Redis job queue; AI workers as separate processes |
| **v3** | SaaS product | Multi-tenant auth, API rate limits, per-tenant vector indexes |
| **v4** | Real-time integrations | WhatsApp/email ingestion adapters (currently out of scope) |

The provider interfaces, repository pattern, and async job architecture support this progression without a rewrite.

---

## 12. Technology Stack Summary

| Layer | Development | Production |
|-------|-------------|------------|
| Language | Python 3.11 | Python 3.11 |
| Backend framework | FastAPI + Uvicorn | FastAPI + Uvicorn |
| ORM / migrations | SQLAlchemy 2.0 + Alembic | SQLAlchemy 2.0 + Alembic |
| Database | **SQLite** | **PostgreSQL 16+** |
| Vector search | sqlite-vec | pgvector |
| Embeddings | sentence-transformers | sentence-transformers |
| LLM | Gemini API | Ollama + Sarvam |
| Frontend | HTML/CSS/JS (Phase 1) | React + Tailwind |
| Testing | pytest + Playwright E2E | pytest + Playwright E2E |
| Background jobs | APScheduler | Celery + Redis |
