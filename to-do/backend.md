# Backend to-do (for backend team)

Items the **frontend needs from the backend** to finish integration.  
Mark `[x]` when done and add **Completed:** date + PR/commit reference.

Related: GitLab **#7** · API docs: [`docs/api.md`](../docs/api.md)

---

## Completed

### B-001 · CORS for Vite dev server

- [x] **Status:** Done (2026-07-04)
- **Issue:** Browser blocked requests from `http://localhost:5173` to `http://127.0.0.1:8000` (CORS).
- **Resolution:** `CORSMiddleware` in `backend/app/main.py`; `CORS_ORIGINS` in config / `.env.example`.
- **Commit:** `4f4be96` — `feat(backend): enable CORS for Vite frontend dev server`

---

## Open — required for current frontend

### B-002 · Allow citizens to list wards (raise-complaint form)

- [ ] **Priority:** High
- **Issue:** `GET /api/v1/constituency/wards` returns **403** for `citizen` role. The raise-complaint form needs a ward dropdown with **real integer `ward_id`** values from the database.
- **Current frontend workaround:** Static `wardOptions` in `frontend/src/data/wards.ts` (ids 1–6 assumed from seed insertion order). This breaks if the DB is re-seeded or ward ids change.
- **Requested change (pick one):**
  - **Option A (preferred):** Allow `citizen` on `GET /constituency/wards` — read-only ward list (`id`, `name`, `code`); no demographics/infrastructure required.
  - **Option B:** New endpoint e.g. `GET /constituency/wards/public` — no auth or citizen auth, summary fields only.
- **Acceptance criteria:**
  - Citizen token (`9876543212`) can fetch ward list successfully.
  - Response includes stable integer `id` matching `POST /complaints` `ward_id`.
  - Document in `docs/api.md`.
- **Frontend blocked until:** This is done (Phase 4).

---

### B-003 · Document ward id mapping for demo / seed data

- [ ] **Priority:** Medium
- **Issue:** Frontend and testers need to know which `ward_id` values exist after `scripts/seed_demo_data.py` runs (auto-increment ids vs ward names like “Ward 42”).
- **Requested change:**
  - Add a short **“Demo ward ids”** table to `docs/api.md` or `backend/README.md` (e.g. `1 → Ward 42`, `2 → Ward 43`, …).
  - Optional: expose `code` (e.g. `W42`) in ward list response if not already documented for clients.
- **Acceptance criteria:** A frontend dev can pick a valid `ward_id` without reading Python seed code.

---

## Open — nice to have / upcoming UI

### B-004 · Citizen-facing ward updates feed

- [ ] **Priority:** Low (future citizen page: Ward updates)
- **Issue:** No API for “resolved issues and public updates in your ward” (`citizenNavigation` → `ward-updates`).
- **Requested change:** Define and implement e.g. `GET /complaints/updates?ward_id=` or `GET /constituency/wards/{id}/updates` (read-only, citizen-safe).
- **Frontend blocked until:** API designed and documented.

---

### B-005 · Staff “log issue” parity

- [ ] **Priority:** Medium
- **Issue:** `POST /complaints` supports staff with optional `citizen_contact`; confirm validation rules and error messages for staff-submitted complaints are documented.
- **Note:** Frontend calls existing `POST /complaints` — verify staff flow in Swagger.

---

### B-009 · Update complaint status

- [ ] **Priority:** High (complaint queue status actions)
- **Issue:** No `PATCH /complaints/{id}` (or equivalent) to update status, assign department, or add staff notes.
- **Requested change:** Implement e.g. `PATCH /complaints/{id}` with fields: `status`, `assigned_department`, `staff_note` (or separate endpoints). Document in `docs/api.md`.
- **Frontend workaround:** Complaint queue saves status/department/notes in **localStorage** until this API exists.

---

## Planned APIs (not built — track separately)

From [`docs/api.md`](../docs/api.md) § Planned APIs:

| ID | Area | Endpoints | Frontend page |
|----|------|-----------|---------------|
| B-006 | Meeting upload | `POST /meetings/upload`, `GET /jobs/{id}` | Upload meeting |
| B-007 | Chat / RAG | `POST /chat` | Assistant |
| B-008 | AI clustering | Background job | Semantic complaint clustering (Bharath) |

---

## Already implemented (reference — no action)

These are **live** and used by the frontend today:

| Endpoint | Roles |
|----------|--------|
| `POST /auth/otp/request`, `POST /auth/otp/verify`, `GET /auth/me` | All |
| `GET /dashboard` | leader, staff |
| `POST /complaints`, `GET /complaints`, `GET /complaints/{id}` | citizen, staff, leader |
| `GET /constituency/wards`, `GET /constituency/wards/{id}` | leader, staff only |
| `GET /commitments`, `POST /commitments`, `GET /todo`, `PATCH /todo/{id}` | staff, leader |
| `GET /priorities`, `GET /digest` | staff, leader |

---

## Changelog (backend to-do file)

| Date | Change |
|------|--------|
| 2026-07-04 | Initial file: B-001 done; B-002–B-008 tracked |
