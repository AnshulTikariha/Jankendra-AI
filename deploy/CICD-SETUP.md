# CI/CD — GCP Cloud Build (recommended)

Auto-deploy runs in **GCP Cloud Build** when code is merged to `release`.  
Google credentials are stored in **GCP Secret Manager** — not in GitHub.

GitHub Actions deploy is **disabled** (manual fallback only).

---

## Architecture

```
merge to release (GitHub)
        ↓
GCP Cloud Build trigger
        ↓
1. Package code
2. Load google-credential from Secret Manager
3. SCP code + credential → VM
4. deploy.sh → restart services
        ↓
http://34.180.31.35
```

---

## One-time setup

### 1. Run the setup script

**Git Bash or WSL** (from repo root):

```bash
export GCP_PROJECT_ID=project-d9125421-6cdc-4628-9f5
export GCP_ZONE=asia-south1-a
export GOOGLE_CREDENTIAL_FILE=ai_modules/credentials/google-credential.json
bash deploy/gcp/setup-cloud-build.sh
```

**Or PowerShell** (uses gcloud from Windows):

```powershell
$env:GCP_PROJECT_ID = "project-d9125421-6cdc-4628-9f5"
$env:GCP_ZONE = "asia-south1-a"
$env:GOOGLE_CREDENTIAL_FILE = "C:\Users\bharath.g\Desktop\Janakendra\Jankendra-AI\ai_modules\credentials\google-credential.json"
bash deploy/gcp/setup-cloud-build.sh
```

The script will:
- Enable Cloud Build, Compute, Secret Manager APIs
- Grant Cloud Build SA permission to SSH to the VM
- Upload your service account JSON to **Secret Manager** (`jankendra-google-credential`)
- Create Cloud Build trigger on `release` branch

### 2. Connect GitHub (if script prompts)

If the trigger fails, connect the repo once in GCP Console:

1. https://console.cloud.google.com/cloud-build/triggers?project=project-d9125421-6cdc-4628-9f5
2. **Connect repository** → GitHub → authorize → select `AnshulTikariha/Jankendra-AI`
3. Re-run `setup-cloud-build.sh`

---

## Day-to-day deploy

```bash
git checkout release
git merge your-feature-branch
git push origin release
```

Watch builds: https://console.cloud.google.com/cloud-build/builds?project=project-d9125421-6cdc-4628-9f5

Manual trigger:

```bash
gcloud builds triggers run jankendra-release-deploy \
  --branch=release \
  --project=project-d9125421-6cdc-4628-9f5
```

---

## Where credentials live

| Secret | Location |
|--------|----------|
| Google service account (Vertex AI) | Secret Manager: `jankendra-google-credential` |
| On VM at runtime | `/etc/jankendra/google-credential.json` (refreshed each deploy) |
| JWT, Maps key, CORS | `/etc/jankendra/*.env` on VM (never in git) |

**Do not** commit `ai_modules/credentials/google-credential.json` to git.

---

## GitHub Actions (disabled)

`.github/workflows/deploy-release.yml` no longer auto-deploys on push.  
Use GCP Cloud Build instead so SSH keys and credentials stay in GCP.

You may delete GitHub secrets `VM_HOST`, `VM_USER`, `VM_SSH_PRIVATE_KEY` if no longer needed.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Cloud Build SSH permission denied | Re-run `setup-cloud-build.sh` (grants `compute.osAdminLogin`) |
| Secret not found | `gcloud secrets versions add jankendra-google-credential --data-file=google-credential.json` |
| Trigger not firing | Confirm push was to `release`, not `main` |
| Build logs | Cloud Console → Cloud Build → History |
