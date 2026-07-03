# Jankendra-AI — Implementation Plan

> **Status:** Planning / Pre-Development  
> **Timeline:** 8 weeks (aligned with SRS Section 10)  
> **Last updated:** July 2026

Related: [architecture.md](architecture.md) | [backend-database.md](backend-database.md) | [srs.html](srs.html)

---

## Overview

Jankendra-AI is built in three layers — **Frontend**, **Backend**, and **AI Modules** — delivered across six phases. Each phase has clear exit criteria before the next begins.

```
Phase 0 (Scaffold)
    ↓
Phase 1 (Schema + Auth + Dashboard)
    ↓
Phase 2 (Complaints + Clustering) ──→ Phase 4 (Prioritization needs clusters)
    ↓
Phase 3 (Commitments + Escalation)
    ↓
Phase 4 (Prioritization + Digest)
    ↓
Phase 5 (RAG Assistant)
    ↓
Phase 6 (Production Hardening)
```

Phases 2 and 3 can overlap once Phase 1 is complete (different workstreams on Frontend vs AI).

---

## Phase 0 — Foundation (Week 0, ~3–5 days)

**Goal:** Repository structure, contracts, and dev environment before feature work.

| # | Task | Layer | Deliverable |
|---|------|-------|-------------|
| 0.1 | Monorepo scaffold (`frontend/`, `backend/`, `ai_modules/`) | All | Runnable empty shell |
| 0.2 | `pyproject.toml` + editable `ai_modules` install | Backend + AI | `pip install -e .` works |
| 0.3 | FastAPI skeleton + OpenAPI at `/docs` | Backend | Health endpoint live |
| 0.4 | React + Vite + Tailwind scaffold | Frontend | Blank app loads |
| 0.5 | Config system (`.env.example`, pydantic-settings) | Backend | Dev/prod config pattern |
| 0.6 | Provider interfaces (`LLMProvider`, `Embedder`, `VectorStore`) | AI | Stubs with mock implementations |
| 0.7 | Alembic init + base schema (users, wards) | Backend | First migration runs |
| 0.8 | Documentation (architecture.md, plan.md, backend-database.md) | Docs | This document set |

**Exit criteria:** Documented steps start all three layers locally; health check returns 200.

---

## Phase 1 — Data & Core Backend (Weeks 1–2)

**Goal:** Four-store schema, authentication, constituency CRUD — no AI yet.

| # | Task | Layer | SRS Reference |
|---|------|-------|---------------|
| 1.1 | Full DB schema (DB1–DB4 tables + Alembic migration) | Backend | Section 7 |
| 1.2 | Seed script — demo constituency (Ward 42, 6 wards) | Backend | Appendix 11.1 |
| 1.3 | JWT auth + Leader/Staff RBAC | Backend | Section 3 |
| 1.4 | Constituency API (wards, demographics, infrastructure) | Backend | FR-CI-01–05 |
| 1.5 | Dashboard API (static aggregates first) | Backend | FR-DD-01 |
| 1.6 | Frontend: auth flow, app layout, sidebar navigation | Frontend | Section 8.1 |
| 1.7 | Frontend: Profile + Constituency views | Frontend | FR-CI-04 |
| 1.8 | Frontend: Dashboard wired to live API | Frontend | FR-DD-01 |

**Exit criteria:** Staff can log in, view ward data, and see a dashboard populated with seed data.

---

## Phase 2 — Complaint & Issue Engine (Weeks 2–3)

**Goal:** Complaint intake, ward-scoped clustering, weighted to-do list.

| # | Task | Layer | SRS Reference |
|---|------|-------|---------------|
| 2.1 | Sentence-transformers embedder implementation | AI | FR-CM-02 |
| 2.2 | sqlite-vec vector store adapter | AI + Backend | NFR-07 |
| 2.3 | Issue Engine: ward-scoped cosine clustering | AI | FR-CM-02, FR-CM-04 |
| 2.4 | Cluster weight = citizen count | AI + Backend | FR-CM-03 |
| 2.5 | Complaints API (POST append-only, GET list) | Backend | FR-CM-01, FR-CM-05 |
| 2.6 | Department routing suggestion (PWD, WMD, Health) | AI | FR-CM-06 |
| 2.7 | To-do API (weighted, ranked, complete/extend) | Backend | FR-DD-02 |
| 2.8 | Frontend: Log Issue form | Frontend | Section 8.1 |
| 2.9 | Frontend: To-Do List with complete/extend actions | Frontend | FR-CT-05, FR-DD-02 |

**Exit criteria:** Staff logs complaints; similar issues in the same ward cluster together; to-do list reflects live weights.

---

## Phase 3 — Commitment & Ingestion (Weeks 3–4)

**Goal:** Meeting transcript upload → commitment extraction → automatic escalation.

| # | Task | Layer | SRS Reference |
|---|------|-------|---------------|
| 3.1 | Transcript parser + document segmenter | AI | FR-CT-01 |
| 3.2 | Commitment extractor (LLM + structured output) | AI | FR-CT-01 |
| 3.3 | Meeting upload API + async job with status polling | Backend | Section 8.2 |
| 3.4 | Commitment persistence in DB3 | Backend | FR-CT-01 |
| 3.5 | Weight escalation background job (hourly) | AI + Backend | FR-CT-02, FR-CT-03, NFR-04 |
| 3.6 | Archive completed commitments to DB2 | Backend | FR-CT-04 |
| 3.7 | Frontend: Upload Meeting + job progress indicator | Frontend | Section 8.1 |
| 3.8 | Frontend: Commitment Tracker (active + resolved) | Frontend | Section 8.1 |

**Exit criteria:** Upload a transcript → commitments appear in tracker → overdue items escalate on schedule.

---

## Phase 4 — Prioritization & Digest (Weeks 4–5)

**Goal:** AI-ranked development actions and weekly SQL-only digest.

| # | Task | Layer | SRS Reference |
|---|------|-------|---------------|
| 4.1 | Prioritization scorer (multi-factor criteria) | AI | FR-DP-01 |
| 4.2 | Ranker + reasoning trace output | AI | FR-DP-02, FR-DP-05 |
| 4.3 | Factor open complaint clusters into scores | AI | FR-DP-04 |
| 4.4 | Ward-to-ward comparison support | AI | FR-DP-03 |
| 4.5 | Priorities API | Backend | Section 8.2 |
| 4.6 | Digest SQL aggregator (no LLM) | AI | FR-DD-03, FR-DD-04 |
| 4.7 | Digest API + weekly scheduled job | Backend | FR-DD-03 |
| 4.8 | Frontend: Development Plan page | Frontend | Section 8.1 |
| 4.9 | Frontend: Digest page with drilldown overlays | Frontend | Section 8.1 |

**Exit criteria:** Ward comparison rankings display with reasoning traces; weekly digest shows numbers only.

---

## Phase 5 — RAG Assistant (Weeks 5–6)

**Goal:** 4-layer context chat grounded in constituency data.

| # | Task | Layer | SRS Reference |
|---|------|-------|---------------|
| 5.1 | Context assembler (profile+digest, vector facts, live SQL, chat history) | AI | FR-RA-02 |
| 5.2 | Hybrid retriever (vector + SQL) | AI | FR-RA-01 |
| 5.3 | Meeting-prep query handler | AI | FR-RA-03 |
| 5.4 | Strategic suggestions with thinking trace | AI | FR-RA-04 |
| 5.5 | Chat API with SSE streaming | Backend | Section 8.2 |
| 5.6 | Context injection API (`.txt` upload to RAG knowledge base) | Backend | Section 8.1 |
| 5.7 | Frontend: Chat interface with streaming responses | Frontend | Section 8.1 |
| 5.8 | Frontend: Context Injection page | Frontend | Section 8.1 |

**Exit criteria:** Leader asks "What should I focus on in Ward 42?" and receives a grounded, cited answer.

---

## Phase 6 — Production Hardening (Weeks 7–8)

**Goal:** Privacy compliance, performance targets, tests, Hindi support — demo-ready.

| # | Task | Layer | SRS Reference |
|---|------|-------|---------------|
| 6.1 | Ollama LLM provider (local, no external API) | AI | NFR-01, Section 9 |
| 6.2 | PostgreSQL + pgvector migration path | Backend + AI | NFR-07 |
| 6.3 | Playwright E2E test suite (all dashboard pages) | All | NFR-09 |
| 6.4 | Mobile responsive pass (320px – 1440px) | Frontend | NFR-05 |
| 6.5 | Hindi i18n foundation | Frontend + AI | NFR-06 |
| 6.6 | Performance: embedding load <3s, dashboard <2s | AI + Backend | NFR-02, NFR-03 |
| 6.7 | Accessibility audit (reduced motion, line-height) | Frontend | NFR-10 |
| 6.8 | Demo data polish + pitch deck materials | All | Appendix 11.1 |

**Exit criteria:** Local-only production mode works; E2E tests pass; hackathon demo path is end-to-end functional.

---

## Workstream Parallelization

Once Phase 1 is complete, work can split across three parallel tracks:

| Track | Phases | Team focus |
|-------|--------|------------|
| **Backend + Data** | 1 → 2 → 3 → 4 → 5 | API, schema, jobs, repositories |
| **AI Modules** | 2 → 3 → 4 → 5 | Engines, providers, unit tests |
| **Frontend** | 1 → 2 → 3 → 4 → 5 → 6 | Pages, API integration, UX polish |

All tracks converge in Phase 6 for integration testing and hardening.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI modules become a monolith | Hard to test and scale | Strict DTO boundaries; one engine per folder |
| Local LLM quality below Gemini | Poor RAG answers in prod | Benchmark Ollama early in Phase 6; keep Gemini for dev |
| Four-store schema complexity | Confusing data access | Single physical DB with schema separation; repository pattern |
| RAG hallucination | Misleading governance advice | 4-layer grounding; cite sources in chat UI |
| Scope creep (WhatsApp, citizen app) | Timeline slip | SRS out-of-scope list enforced; feature flags for post-v1 |
| SQLite → PostgreSQL dialect gaps | Migration failures | Test Alembic migrations against both in CI |

---

## Success Metrics

| Metric | Target | Phase |
|--------|--------|-------|
| API endpoints implemented | 8+ core endpoints | Phase 5 |
| Functional requirements covered | 24/24 FRs | Phase 5 |
| Non-functional requirements met | 10/10 NFRs | Phase 6 |
| E2E test coverage | All 10 dashboard pages | Phase 6 |
| Dashboard load time | <2 seconds | Phase 6 |
| Embedding model load time | <3 seconds on CPU | Phase 6 |
| Demo constituency seeded | 6 wards, anchor issue | Phase 1 |

---

## Next Steps

1. Review and approve this plan and [architecture.md](architecture.md)
2. Execute **Phase 0** — monorepo scaffold and provider interfaces
3. Begin **Phase 1** — database schema and authentication
4. Resolve hosting platform (GitHub vs GitLab) before CI setup in Phase 6
