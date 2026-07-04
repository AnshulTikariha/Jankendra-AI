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

## Completed (ward geo — Option A)

### B-002 · Allow citizens to list wards (raise-complaint form)

- [x] **Status:** Done (2026-07-04)
- **Resolution:** `GET /api/v1/constituency/wards` now allows `citizen`, `staff`, and `leader`. Returns centroids and boundary flags.
- **Also added:** `GET /constituency/wards/resolve?latitude=&longitude=`, `GET /constituency/ward-boundaries`, migration `004_ward_geo`, `scripts/sync_bhopal_ward_boundaries.py`.

### B-013 · Ward boundaries sync from Bharatlas

- [x] **Status:** Done (2026-07-04)
- **Script:** `python scripts/sync_bhopal_ward_boundaries.py` — matches demo wards W42–W47 to BMC polygons via Bharatlas OpenCity GeoJSON.
- **Re-run after:** fresh seed or Bharatlas layer update.

---

## Open — required for current frontend

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

### B-010 · Update citizen profile

- [ ] **Priority:** Medium (citizen profile edit)
- **Issue:** No `PATCH /auth/me` (or equivalent) to update display name, email, ward preference, or notification settings.
- **Requested change:** Implement e.g. `PATCH /auth/me` with citizen-safe fields. Document in `docs/api.md`.
- **Frontend workaround:** Citizen profile saves editable fields in **localStorage** until this API exists.

---

### B-011 · Complaint photo attachments

- [ ] **Priority:** Medium (raise complaint Phase D)
- **Issue:** No API to upload or retrieve complaint photos. Citizens can attach up to 3 images in the wizard; files are stored in **localStorage** keyed by complaint id.
- **Requested change:** Implement e.g. `POST /complaints/{id}/attachments` (multipart) and `GET /complaints/{id}/attachments` (or include `attachments[]` in complaint detail). Document size limits and mime types in `docs/api.md`.
- **Frontend workaround:** `useComplaintAttachmentsStore` persists base64 data URLs locally until this API exists.

---

### B-012 · Extended complaint metadata (geo, sub-category, priority)

- [ ] **Priority:** Medium (raise complaint Phase E)
- **Issue:** Sub-category, official priority/urgency, and GPS coordinates are embedded in `description` and `location_detail` text fields rather than structured API fields.
- **Requested change:** Extend `POST /complaints` (and complaint detail response) with optional fields e.g. `sub_category`, `priority` (`low` | `medium` | `high` | `critical`), `latitude`, `longitude`. Document in `docs/api.md`.
- **Frontend workaround:** Metadata appended to description via `buildComplaintDescription()`; GPS appended to `location_detail` via `buildLocationDetail()`.

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
