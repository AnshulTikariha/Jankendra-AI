# Jankendra-AI integration to-do

This folder tracks **frontend–backend integration** work for branch `development/7` (GitLab issue **#7**).

| File | Owner | Purpose |
|------|--------|---------|
| [backend.md](./backend.md) | Backend team | API gaps, access rules, and fixes the frontend depends on |
| [frontend.md](./frontend.md) | Frontend team | Completed work and upcoming UI integration tasks |

## How to use

1. Pull latest `development/7` into your environment.
2. Open the relevant file and pick an open item (`[ ]`).
3. Implement the change; verify against `docs/api.md` and Swagger (`http://127.0.0.1:8000/docs`).
4. Mark the checkbox `[x]` and add a **Completed** date + short note in the same section.
5. Commit the markdown update with your code (or in a follow-up docs commit).

## Demo accounts (integration testing)

| Role | Phone | OTP |
|------|-------|-----|
| Leader | `9876543210` | `246810` |
| Staff | `9876543211` | `246810` |
| Citizen | `9876543212` | `246810` |

Constituency: **South Delhi**

## API reference

- Contract: [`docs/api.md`](../docs/api.md)
- OpenAPI: `http://127.0.0.1:8000/docs`
