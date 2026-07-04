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

---

## Upcoming — planned phases

### Phase 4 — Ward list from API

- [ ] **Blocked by:** [Backend B-002](./backend.md#b-002--allow-citizens-to-list-wards-raise-complaint-form)
- [ ] `api/constituency.ts` + `hooks/useWards.ts`
- [ ] Replace static `wardOptions` in `RaiseComplaintPage.tsx`
- [ ] Optional: staff/leader constituency ward picker on log-issue (future page)

### Phase 5 — Staff / leader app pages

Wire navigation items in `types/navigation.ts` that are still `available: false`:

| Page id | API(s) | Status |
|---------|--------|--------|
| `todo` | `GET /todo`, `PATCH /todo/{id}` | [ ] Not started |
| `commitments` | `GET /commitments`, `POST /commitments` | [ ] Not started |
| `development-plan` | `GET /priorities` | [ ] Not started |
| `log-issue` | `POST /complaints` (+ wards) | [ ] Not started |
| `digest` | `GET /digest` | [ ] Not started |
| `upload-meeting` | Planned backend B-006 | [ ] Blocked |
| `chat` | Planned backend B-007 | [ ] Blocked |
| `context-injection` | TBD | [ ] Blocked |
| `profile` | `GET /auth/me` (partial) | [ ] Not started |

### Phase 6 — Platform polish (frontend-only)

- [ ] Global **401 → logout** in `httpClient.ts` (expired token)
- [ ] **IssueHeatMap** — use live ward/complaint data (partially static today)
- [ ] Replace **citizen demo data**:
  - [ ] `CommunityImpactCard.tsx` (`demoCitizenTransparency`)
  - [ ] `TrustStrip.tsx` (`citizenTrustPoints`)
  - [ ] Derive stats from `GET /complaints` or new backend metrics
- [ ] **i18n** — citizen portal strings (login/dashboard partially done)
- [ ] Remove unused `data/demoDashboard.ts` exports if nothing references them

### Phase 7 — Citizen portal expansion

Pages in `types/citizenNavigation.ts` still `available: false`:

| Page id | Depends on | Status |
|---------|------------|--------|
| `ward-updates` | Backend B-004 | [ ] Blocked |
| `help` | Static content OK | [ ] Not started |
| `profile` | `GET /auth/me` | [ ] Not started |

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
| Ward dropdown matches DB ids | All citizens | [ ] Until B-002 |

---

## Changelog (frontend to-do file)

| Date | Change |
|------|--------|
| 2026-07-04 | Initial file: Phases 0–3 marked complete; Phases 4–7 planned |
