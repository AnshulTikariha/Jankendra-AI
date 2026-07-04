# Frontend to-do

Integration progress for branch `development/7` (GitLab **#7**).  
Mark `[x]` when done; add **Completed:** date + commit hash when closing an item.

API contract: [`docs/api.md`](../docs/api.md)

---

## Completed

### Phase 0 — API foundation

- [x] **Completed:** 2026-07-04 · commit `ec6a8b3`
- [x] `api/httpClient.ts` — Bearer token, typed errors
- [x] `api/errors.ts`, `api/auth.ts`, `api/types/auth.ts`
- [x] `types/auth.ts` — `accessToken`, `userId`
- [x] `stores/useAuthStore.ts` — JWT persistence, `setSession`, `getAccessToken`
- [x] `components/AuthBootstrap.tsx` — session restore via `GET /auth/me`
- [x] `lib/authMappers.ts`

### Phase 1 — Live login

- [x] **Completed:** 2026-07-04 · commit `ec6a8b3`
- [x] `LoginPage.tsx` — `POST /auth/otp/request`, `POST /auth/otp/verify`
- [x] API error handling (404 phone, 403 role, 401 OTP)
- [x] Dev OTP hint from `dev_otp` in development
- [x] i18n updates (`en` / `hi` auth + common errors)

### Phase 2 — Staff / leader dashboard

- [x] **Completed:** 2026-07-04 · commit `56eb550`
- [x] `GET /dashboard` — `api/dashboard.ts`, `hooks/useDashboard.ts`
- [x] `types/dashboard.ts`, `lib/dashboardMappers.ts`
- [x] `DashboardPage.tsx` — live KPIs, priorities, ward comparison, activity
- [x] Loading and error states with retry

### Phase 3 — Citizen complaints

- [x] **Completed:** 2026-07-04 · commit `f18a2e9`
- [x] `POST /complaints` — `RaiseComplaintPage.tsx`
- [x] `GET /complaints` — `MyComplaintsPage.tsx`, citizen dashboard stats
- [x] `GET /complaints/{id}` — `ComplaintConfirmationPage.tsx`
- [x] `hooks/useComplaints.ts` (list, detail, create mutation)
- [x] Removed `useComplaintStore.ts` (localStorage)
- [x] Temporary static `wardOptions` in `data/wards.ts` (see **Backend B-002**)
- [x] **Raise complaint wizard (Phase A+B)** — 4-step flow, category cards, guided description, review, draft autosave, similar-report banner, i18n (`complaints` namespace), profile ward prefill, confirmation copy/share
- [x] **Raise complaint wizard (Phase D+E)** — GPS pin, photo attachments (localStorage), sub-categories, urgency/priority picker, attachment gallery on detail view (mock until **Backend B-011** / **B-012**)

### Phase 5 — Staff / leader app pages

- [x] **Completed:** 2026-07-04
- [x] `todo` — `GET /todo`, `PATCH /todo/{id}` → `pages/staff/TodoPage.tsx`
- [x] `commitments` — `GET/POST /commitments` → `pages/staff/CommitmentsPage.tsx`
- [x] `development-plan` — `GET /priorities` → `pages/staff/DevelopmentPlanPage.tsx`
- [x] `log-issue` — `POST /complaints` + `GET /constituency/wards` → `pages/staff/LogIssuePage.tsx`
- [x] `digest` — `GET /digest` → `pages/staff/DigestPage.tsx`
- [x] `profile` — session details → `pages/staff/ProfilePage.tsx`
- [x] `api/staff.ts`, `hooks/useStaffApi.ts`, `types/staff.ts`
- [x] `AppShell.tsx` routing + `navigation.ts` availability flags
- [x] `QuickActions` shortcuts navigate to live pages
- [x] **Complaint queue** — `GET /complaints` + localStorage overrides → `pages/staff/ComplaintsQueuePage.tsx` (status/notes mock until **Backend B-009**)

### Phase 6 — Platform polish (partial)

- [x] **Completed:** 2026-07-04
- [x] Global **401 → logout** in `httpClient.ts` when Bearer token sent
- [x] **IssueHeatMap** — live ward data from dashboard `ward_comparison` (`lib/wardMapMappers.ts`)
- [x] **CommunityImpactCard** — uses live complaint count from API
- [ ] **TrustStrip** — still static trust copy (acceptable for now)
- [ ] **i18n** — citizen portal strings (deferred)
- [ ] Remove unused `data/demoDashboard.ts` (still unused exports only)

---

## Upcoming — planned phases

### Phase 4 — Ward list from API (citizen)

- [ ] **Blocked by:** [Backend B-002](./backend.md#b-002--allow-citizens-to-list-wards-raise-complaint-form)
- [ ] Replace static `wardOptions` in `RaiseComplaintPage.tsx` (staff log-issue already uses live wards)

### Phase 5 — Remaining staff pages

| Page id | API(s) | Status |
|---------|--------|--------|
| `upload-meeting` | Planned backend B-006 | [ ] Blocked |
| `chat` | Planned backend B-007 | [ ] Blocked |
| `context-injection` | TBD | [ ] Blocked |

### Phase 6 — Remaining polish

- [ ] **i18n** — citizen portal strings
- [ ] **TrustStrip** — optional live metrics or static help content page
- [ ] Remove dead `demoDashboard.ts` demo exports if unreferenced

### Phase 7 — Citizen portal expansion (partial)

- [x] **Citizen profile** — `GET /auth/me` + localStorage → `pages/portal/CitizenProfilePage.tsx` (edit until **Backend B-010**)

Pages in `types/citizenNavigation.ts` still `available: false`:

| Page id | Depends on | Status |
|---------|------------|--------|
| `ward-updates` | Backend B-004 | [ ] Blocked |
| `help` | Static content OK | [ ] Not started |

---

## Environment

- [x] `frontend/.env` — `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1` (local, gitignored)
- [x] `frontend/.env.example` — document base URL for other devs (verify exists / update if missing)

---

## Testing checklist (manual)

| Flow | Account | Verified |
|------|---------|----------|
| OTP login | 9876543210 / 3211 / 3212 | [x] User confirmed |
| Leader/staff dashboard | 9876543210 / 3211 | [x] Phase 2 |
| Raise complaint | 9876543212 | [x] User confirmed |
| My complaints list | 9876543212 | [x] Phase 3 |
| Staff to-do / commitments / digest | 9876543211 / 3210 | [ ] Manual QA |
| Staff complaint queue + status actions | 9876543211 / 3210 | [ ] Manual QA (local save) |
| Raise complaint (wizard) | 9876543212 | [ ] Manual QA |
| Raise complaint (GPS + photos + sub-category) | 9876543212 | [ ] Manual QA |
| Citizen profile edit | 9876543212 | [ ] Manual QA (local save) |
| Ward dropdown matches DB ids | All citizens | [ ] Until B-002 |

---

## Changelog (frontend to-do file)

| Date | Change |
|------|--------|
| 2026-07-04 | Initial file: Phases 0–3 marked complete; Phases 4–7 planned |
| 2026-07-04 | Phases 5–6 marked complete (staff pages, 401 logout, live heat map) |
| 2026-07-04 | Complaint queue page wired (filters, local status/notes until B-009) |
