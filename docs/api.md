# Jankendra-AI — Frontend API Guide

> **Audience:** Frontend (Saurabh)  
> **Base URL (local):** `http://127.0.0.1:8000/api/v1`  
> **OpenAPI (Swagger):** `http://127.0.0.1:8000/docs`  
> **Last updated:** 4 July 2026

This file is the contract between backend and frontend.  
**Backend will update this document whenever an API is created or changed.**

Related: [architecture.md](architecture.md) | [plan.md](plan.md) | [backend-database.md](backend-database.md)

---

## How to use this document

| Column | Meaning |
|--------|---------|
| **Frontend page / file** | Where Saurabh should call the API |
| **When to call** | User action that triggers the request |
| **Auth** | Whether `Authorization: Bearer <token>` is required |

Store the token after login (for example in `useAuthStore` / `localStorage`) and send it on every protected request:

```http
Authorization: Bearer <access_token>
```

Set frontend env:

```bash
# frontend/.env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

---

## Auth flow (matches LoginPage mobile OTP UI)

```
1. User selects role (citizen | staff | leader)
2. User enters 10-digit phone
3. Frontend → POST /auth/otp/request
4. User enters OTP (demo OTP is always 246810)
5. Frontend → POST /auth/otp/verify  { phone, otp, role }
6. Save access_token + user in auth store
7. Route by user.role:
     citizen → CitizenPortal
     staff / leader → AppShell (staff/leader dashboard)
```

### Demo accounts

| Role | Phone | OTP |
|------|-------|-----|
| Leader | `9876543210` | `246810` |
| Staff | `9876543211` | `246810` |
| Citizen | `9876543212` | `246810` |

Phone and role must match. Example: phone `9876543210` with role `staff` returns `403`.

---

## API index

| Method | Endpoint | Auth | Frontend page |
|--------|----------|------|---------------|
| `POST` | `/auth/otp/request` | No | `LoginPage.tsx` — after valid phone, on “Get OTP” |
| `POST` | `/auth/otp/verify` | No | `LoginPage.tsx` — on “Verify OTP” |
| `GET` | `/auth/me` | Bearer | App load / session restore (`useAuthStore`) |
| `GET` | `/constituency/wards` | Bearer (leader, staff) | Profile / constituency views, ward selectors |
| `GET` | `/constituency/wards/{ward_id}` | Bearer (leader, staff) | Ward detail / profile drill-down |
| `GET` | `/dashboard` | Bearer (leader, staff) | `DashboardPage.tsx` |
| `POST` | `/complaints` | Bearer (citizen, staff, leader) | `RaiseComplaintPage.tsx`, staff log-issue form |
| `GET` | `/complaints` | Bearer (citizen, staff, leader) | `MyComplaintsPage.tsx`, staff complaint list |
| `GET` | `/complaints/{complaint_id}` | Bearer (citizen, staff, leader) | Complaint detail / confirmation |
| `GET` | `/health` | No | Optional health check |

Citizen tokens receive `403` on constituency and dashboard routes.  
Citizens only see **their own** complaints (`reporter_phone` = logged-in phone).

---

## Auth APIs

### 1. Request OTP

| | |
|--|--|
| **Method / URL** | `POST /api/v1/auth/otp/request` |
| **Frontend page** | `frontend/src/pages/LoginPage.tsx` |
| **When to call** | User enters a valid 10-digit phone and taps request OTP |
| **Auth** | None |

**Request body**

```json
{
  "phone": "9876543210"
}
```

Phone may include spaces or `+91`; backend normalizes to 10 digits.

**Success `200`**

```json
{
  "message": "OTP sent successfully",
  "phone": "9876543210",
  "expires_in_seconds": 600,
  "dev_otp": "246810"
}
```

`dev_otp` is only present when backend `ENVIRONMENT=development`. Do not rely on it in production UI; for local demo you may use it or hardcode `246810` (same as current UI).

**Errors**

| Status | When |
|--------|------|
| `422` | Phone is not a valid 10-digit number |
| `404` | Phone is not registered |

**Frontend integration notes**

- Replace local-only `requestOtp()` success path with this API call.
- Keep showing OTP inputs after `200`.
- On `404`, show “Phone number is not registered”.

---

### 2. Verify OTP (login)

| | |
|--|--|
| **Method / URL** | `POST /api/v1/auth/otp/verify` |
| **Frontend page** | `frontend/src/pages/LoginPage.tsx` |
| **When to call** | User submits the 6-digit OTP |
| **Auth** | None |

**Request body**

```json
{
  "phone": "9876543210",
  "otp": "246810",
  "role": "leader"
}
```

`role` must be one of: `citizen`, `staff`, `leader`.

**Success `200`**

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "phone": "9876543210",
    "full_name": "Shri Rajendra Kumar Verma",
    "role": "leader",
    "is_active": true,
    "constituency_name": "South Delhi"
  }
}
```

**Errors**

| Status | When |
|--------|------|
| `401` | Invalid or expired OTP (must call request OTP first) |
| `403` | Phone is registered under a different role |
| `404` | Phone is not registered |
| `422` | Invalid phone or role |

**Frontend integration notes**

- Replace hardcoded `previewOtp` check and `buildSession(...)` with this response.
- Suggested `AuthSession` mapping:

```ts
{
  role: user.role,
  phone: user.phone,
  name: user.full_name,
  constituencyName: user.constituency_name,
  accessToken: access_token,
  userId: user.id,
}
```

- Use `user.role` from API (source of truth), not only the UI role picker.
- Persist `accessToken` for later API calls.

---

### 3. Current user

| | |
|--|--|
| **Method / URL** | `GET /api/v1/auth/me` |
| **Frontend page** | App bootstrap / `useAuthStore` session restore |
| **When to call** | On app load if a token exists in storage |
| **Auth** | Bearer token required |

**Success `200`**

```json
{
  "id": "uuid",
  "phone": "9876543211",
  "full_name": "Constituency Staff",
  "role": "staff",
  "is_active": true,
  "constituency_name": "South Delhi"
}
```

**Errors**

| Status | When |
|--------|------|
| `401` | Missing, invalid, or expired token |

**Frontend integration notes**

- If `401`, clear session and show `LoginPage`.
- Use this to refresh name/role after reload.

---

## Health (optional)

### 4. Health check

| | |
|--|--|
| **Method / URL** | `GET /api/v1/health` or `GET /health` |
| **Frontend page** | Optional (dev tools / status) |
| **Auth** | None |

**Success `200`**

```json
{
  "status": "ok",
  "service": "Jankendra-AI Backend",
  "version": "0.1.0"
}
```

---

## Constituency APIs

Staff and leader only. Use for profile / ward views (replace static ward lists).

### 5. List wards

| | |
|--|--|
| **Method / URL** | `GET /api/v1/constituency/wards` |
| **Frontend page** | Profile, constituency overview, any ward dropdown |
| **When to call** | After staff/leader login, when loading constituency data |
| **Auth** | Bearer (`leader` or `staff`) |

**Success `200`**

```json
{
  "constituency_name": "South Delhi",
  "total_population": 270000,
  "total_registered_voters": 182400,
  "wards": [
    {
      "id": 1,
      "name": "Ward 42",
      "code": "W42",
      "population": 50000,
      "registered_voters": 33800
    }
  ]
}
```

**Errors**

| Status | When |
|--------|------|
| `401` | Missing or invalid token |
| `403` | Citizen (or other non-staff/leader role) |

**Frontend integration notes**

- Map `wards` into ward selectors and profile summary cards.
- Totals can replace hardcoded constituency population figures.

---

### 6. Ward detail

| | |
|--|--|
| **Method / URL** | `GET /api/v1/constituency/wards/{ward_id}` |
| **Frontend page** | Ward detail / profile drill-down |
| **When to call** | User opens a specific ward |
| **Auth** | Bearer (`leader` or `staff`) |

**Success `200`**

```json
{
  "id": 1,
  "name": "Ward 42",
  "code": "W42",
  "constituency_name": "South Delhi",
  "population": 50000,
  "registered_voters": 33800,
  "demographics": [
    {
      "id": "uuid",
      "ward_id": 1,
      "population": 50000,
      "registered_voters": 33800,
      "literacy_rate": 82.4,
      "key_indicators": "MLA: Shri Rajendra Kumar Verma. Anchor issue: ..."
    }
  ],
  "infrastructure": [
    {
      "id": "uuid",
      "ward_id": 1,
      "category": "drainage",
      "status": "critical",
      "description": "Recurring drainage canal overflow during monsoon for 3 years."
    }
  ],
  "schemes": [
    {
      "id": "uuid",
      "ward_id": 1,
      "name": "PM Awas Yojana",
      "penetration_rate": 0.62,
      "beneficiaries": 1840,
      "status": "active"
    }
  ]
}
```

**Errors**

| Status | When |
|--------|------|
| `401` | Missing or invalid token |
| `403` | Citizen role |
| `404` | Ward id does not exist |

---

## Dashboard API

### 7. Live dashboard aggregates

| | |
|--|--|
| **Method / URL** | `GET /api/v1/dashboard` |
| **Frontend page** | `frontend/src/pages/DashboardPage.tsx` |
| **When to call** | When staff/leader dashboard mounts |
| **Auth** | Bearer (`leader` or `staff`) |

**Success `200`**

```json
{
  "constituency_name": "South Delhi",
  "kpis": {
    "open_complaints": 5,
    "open_complaints_trend": 0,
    "active_commitments": 0,
    "overdue_commitments": 0,
    "resolved_this_week": 0,
    "on_time_rate_pct": 100,
    "citizen_complaints_week": 0,
    "hot_ward": { "id": "1", "name": "Ward 42" }
  },
  "priorities": [
    {
      "id": "uuid",
      "type": "complaint",
      "title": "Recurring drainage canal overflow during monsoon for 3 years.",
      "ward_name": "Ward 42",
      "weight": 10,
      "source": "staff"
    }
  ],
  "commitments_at_risk": [],
  "ward_comparison": [
    {
      "ward_id": "1",
      "ward_name": "Ward 42",
      "open_clusters": 0,
      "overdue_commitments": 0,
      "infra_alerts": ["drainage:critical"]
    }
  ],
  "recent_activity": [
    {
      "id": "uuid",
      "timestamp": "2026-07-04T09:00:00+00:00",
      "type": "staff_complaint",
      "summary": "Recurring drainage canal overflow during monsoon for 3 years.",
      "ward_name": "Ward 42"
    }
  ]
}
```

**Field mapping for current demo types** (`demoDashboard.ts`)

| API field (snake_case) | Frontend type field (camelCase) |
|------------------------|----------------------------------|
| `kpis.open_complaints` | `openComplaints` |
| `kpis.open_complaints_trend` | `openComplaintsTrend` |
| `kpis.active_commitments` | `activeCommitments` |
| `kpis.overdue_commitments` | `overdueCommitments` |
| `kpis.resolved_this_week` | `resolvedThisWeek` |
| `kpis.on_time_rate_pct` | `onTimeRatePct` |
| `kpis.citizen_complaints_week` | `citizenComplaintsWeek` |
| `kpis.hot_ward` | `hotWard` |
| `priorities[].ward_name` | `wardName` |
| `commitments_at_risk` | commitments at risk list |
| `ward_comparison` | ward comparison rows |
| `recent_activity` | recent activity list |

**Phase 1 behaviour**

- Built from seeded wards + infrastructure (and commitments/complaints when present).
- Until complaints exist, `open_complaints` uses infrastructure alerts (`critical` / `poor`) as a proxy.
- `commitments_at_risk` is empty until commitments are seeded or created.
- Leader-only UI sections (`CommitmentsAtRisk`, `WardComparisonTable`) can still consume this payload; hide by role on the client.

**Errors**

| Status | When |
|--------|------|
| `401` | Missing or invalid token |
| `403` | Citizen role |

**Frontend integration notes**

- Replace imports from `demoDashboard.ts` with `GET /dashboard`.
- Keep role-based layout (`isLeader` / `isStaff`) on the client.
- Show loading and error states while the request runs.

---

## Complaints APIs

Append-only complaint intake (never deleted). Simple ward + category clustering (AI semantic clustering comes later).

### 8. Create complaint

| | |
|--|--|
| **Method / URL** | `POST /api/v1/complaints` |
| **Frontend page** | `frontend/src/pages/portal/RaiseComplaintPage.tsx` (citizen), staff log-issue form |
| **When to call** | User submits the raise-complaint form |
| **Auth** | Bearer (`citizen`, `staff`, or `leader`) |

**Request body**

```json
{
  "ward_id": 1,
  "category": "drainage",
  "description": "Standing water after rain near the main market entrance.",
  "location_detail": "Main market entrance"
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `ward_id` | Yes | Integer ward id from `GET /constituency/wards` |
| `category` | Yes | `water`, `roads`, `drainage`, `electricity`, `health`, `sanitation`, `other` |
| `description` | Yes | Complaint text |
| `location_detail` | No | Optional landmark / address note |
| `citizen_contact` | No | Staff/leader only; citizen phone is taken from the logged-in user |

**Success `201`**

```json
{
  "id": "uuid",
  "public_reference": "JK-2026-0004",
  "ward_id": 1,
  "ward_name": "Ward 42",
  "category": "drainage",
  "description": "Standing water after rain near the main market entrance.",
  "location_detail": "Main market entrance",
  "status": "submitted",
  "cluster_count": 3,
  "source": "citizen",
  "submitted_at": "2026-07-04T11:00:00+00:00",
  "reporter_phone": "9876543212",
  "department_suggestion": "PWD"
}
```

**Frontend field mapping** (`types/complaint.ts`)

| API field | Frontend field |
|-----------|----------------|
| `public_reference` | `publicReference` |
| `ward_id` | `wardId` (string on UI — convert with `String(ward_id)`) |
| `ward_name` | `wardName` |
| `location_detail` | `locationDetail` |
| `cluster_count` | `clusterCount` |
| `submitted_at` | `submittedAt` |
| `reporter_phone` | `reporterPhone` |

**Errors**

| Status | When |
|--------|------|
| `401` | Missing or invalid token |
| `404` | Ward not found |
| `422` | Invalid category or phone |

**Frontend integration notes**

- Replace `useComplaintStore.addComplaint` localStorage write with this API.
- Show `public_reference` on `ComplaintConfirmationPage`.
- Use ward `id` from constituency API (not hardcoded `"42"` string codes alone).

---

### 9. List complaints

| | |
|--|--|
| **Method / URL** | `GET /api/v1/complaints` |
| **Frontend page** | `MyComplaintsPage.tsx`, staff complaint queue |
| **When to call** | Page load for my-complaints / staff list |
| **Auth** | Bearer (`citizen`, `staff`, or `leader`) |

**Query params**

| Param | Who | Notes |
|-------|-----|--------|
| `ward_id` | staff / leader | Optional filter, e.g. `?ward_id=1` |

Citizens always get only their own complaints (filter by phone). `ward_id` is ignored for citizens.

**Success `200`**

```json
{
  "total": 2,
  "complaints": [
    {
      "id": "uuid",
      "public_reference": "JK-2026-0001",
      "ward_id": 1,
      "ward_name": "Ward 42",
      "category": "drainage",
      "description": "Standing water after rain near the main market entrance.",
      "location_detail": "Main market entrance",
      "status": "under_review",
      "cluster_count": 2,
      "source": "citizen",
      "submitted_at": "2026-06-28T14:20:00",
      "reporter_phone": "9876543212",
      "department_suggestion": "PWD"
    }
  ]
}
```

**Frontend integration notes**

- Replace `getByPhone(session.phone)` with `GET /complaints` using the citizen token.
- Staff/leader use the same endpoint for the full queue.

---

### 10. Get complaint by id

| | |
|--|--|
| **Method / URL** | `GET /api/v1/complaints/{complaint_id}` |
| **Frontend page** | Confirmation / detail view |
| **When to call** | After create, or opening one complaint |
| **Auth** | Bearer (`citizen`, `staff`, or `leader`) |

Citizens may only fetch their own complaint (`403` otherwise).

---

## Planned APIs (not built yet)

| Area | Frontend page(s) | Planned endpoints |
|------|------------------|-------------------|
| Commitments | Commitment tracker | `GET /todo`, commitments |
| Chat / RAG | Chat page | `POST /chat` |
| AI clustering | Background | Semantic cluster recompute (Bharath) |

---

## RBAC rules (for future protected pages)

| Role | Access |
|------|--------|
| `leader` | Leader dashboard, commitments, prioritization, chat |
| `staff` | Staff dashboard, complaints intake, constituency updates |
| `citizen` | Citizen portal only (raise complaint, my complaints) |

Backend enforces roles with JWT claims. Frontend should still hide menus by role for UX.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-04 | Complaints APIs: `POST /complaints`, `GET /complaints`, `GET /complaints/{id}` with ward+category clustering. Dashboard uses live complaints when present. |
| 2026-07-04 | Constituency APIs: `GET /constituency/wards`, `GET /constituency/wards/{ward_id}` (leader/staff). |
| 2026-07-04 | Dashboard API: `GET /dashboard` with KPIs, priorities, ward comparison, recent activity (leader/staff). |
| 2026-07-04 | Phone + OTP auth: `POST /auth/otp/request`, `POST /auth/otp/verify`, `GET /auth/me`. Email/password login removed. |
| 2026-07-04 | Initial health endpoints documented. |
