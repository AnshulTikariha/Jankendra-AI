# CI/CD Setup — Auto-deploy on `release` branch

When complete, every **push or merge to `release`** triggers GitHub Actions to deploy to the GCP VM at `http://34.180.31.35`.

## How it works

```
merge to release → GitHub Actions
    → tar codebase
    → SCP to VM /tmp/jankendra-deploy.tgz
    → extract to /opt/jankendra
    → run deploy/scripts/deploy.sh
    → restart backend + AI + nginx
```

Workflow file: `.github/workflows/deploy-release.yml`

---

## Step 1 — Push the workflow to GitHub

From your machine (on `release` branch):

```powershell
cd C:\Users\bharath.g\Desktop\Janakendra\Jankendra-AI
git add .github/workflows/deploy-release.yml deploy/scripts/deploy.sh
git commit -m "Enable auto-deploy on release branch"
git push origin release
```

---

## Step 2 — Get your SSH private key

`gcloud compute ssh` uses a key pair on your PC. The **private** key must go into GitHub secrets.

**Windows — typical path:**

```
C:\Users\bharath.g\.ssh\google_compute_engine
```

Open that file in Notepad and copy the **entire** contents, including:

```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

If the file does not exist, run once:

```powershell
gcloud compute config-ssh --project=project-d9125421-6cdc-4628-9f5
gcloud compute ssh jankendra-app --zone=asia-south1-a --project=project-d9125421-6cdc-4628-9f5
```

---

## Step 3 — Add GitHub repository secrets

1. Open: **https://github.com/AnshulTikariha/Jankendra-AI/settings/secrets/actions**
2. Click **New repository secret** for each:

| Secret name | Value |
|-------------|--------|
| `VM_HOST` | `34.180.31.35` |
| `VM_USER` | `bharath.g` |
| `VM_SSH_PRIVATE_KEY` | Full contents of `google_compute_engine` private key |
| `VM_SSH_PORT` | `22` (optional) |

> **VM_USER** is your Linux username on the VM (run `whoami` after SSH to confirm).

---

## Step 4 — Allow GitHub to SSH to the VM

Your public key must be on the VM. If `gcloud compute ssh` already works from your PC, the public key is usually in project metadata.

Verify from your machine:

```powershell
gcloud compute ssh jankendra-app --zone=asia-south1-a --project=project-d9125421-6cdc-4628-9f5 --command="echo ssh_ok"
```

GitHub Actions uses the **same private key** you added as `VM_SSH_PRIVATE_KEY`. The matching public key must be authorized on the VM (via GCP project SSH metadata).

If GitHub deploy fails with "permission denied", add your public key to instance metadata:

```powershell
# Show your public key
type $env:USERPROFILE\.ssh\google_compute_engine.pub

# Or re-run
gcloud compute config-ssh --project=project-d9125421-6cdc-4628-9f5
```

---

## Step 5 — Test the pipeline

**Option A — merge to release:**

```powershell
git checkout release
git merge main
git push origin release
```

**Option B — manual trigger:**

GitHub → **Actions** → **Deploy release to GCP VM** → **Run workflow**

Watch the run at: **https://github.com/AnshulTikariha/Jankendra-AI/actions**

Success = green check + `http://34.180.31.35/health` returns OK.

---

## What is preserved on deploy

| Item | Location | Preserved? |
|------|----------|------------|
| SQLite database | `/opt/jankendra/backend/data/jankendra.db` | Yes (excluded from tar overwrite of data dir) |
| Secrets / env | `/etc/jankendra/*.env` | Yes (not in git) |
| Google credentials | `/etc/jankendra/google-credential.json` | Yes (not in git) |
| Municipal ward sync | In database | Yes |

After deploy, `deploy.sh` runs migrations + idempotent seed (skips if data exists).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `permission denied (publickey)` | Check `VM_USER`, `VM_SSH_PRIVATE_KEY`, and GCP SSH metadata |
| `secret VM_HOST not found` | Add all secrets in Step 3 |
| Frontend Maps broken after deploy | Ensure `VITE_GOOGLE_MAPS_API_KEY` is in `/etc/jankendra/frontend.env` on VM |
| Workflow not triggering | Confirm push was to `release` branch, not `main` |

---

## Manual deploy (fallback)

```powershell
.\deploy\scripts\deploy-from-windows.ps1
```

Or see `deploy/deployment-guide.html` Section 14.
