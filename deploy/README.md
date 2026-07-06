# GCP single-VM deployment

All three apps run on **one Compute Engine VM** behind **nginx**:

| Component | Process | Internal port | Public URL |
|-----------|---------|---------------|------------|
| Frontend | static files (Vite build) | — | `http://VM_IP/` |
| Backend | uvicorn | 8000 | `http://VM_IP/api/v1/*` |
| AI modules | uvicorn | 8001 | `http://VM_IP/api/v1/analyze-text` |

## 1. One-time: create VM

```bash
export GCP_PROJECT_ID=your-project-id
export GCP_ZONE=asia-south1-a
bash deploy/gcp/create-vm.sh
```

This creates:

- VM `jankendra-app` (Ubuntu 22.04, `e2-standard-2`)
- Service account `jankendra-runtime` with **Vertex AI User**
- Firewall for ports 80/443

## 2. One-time: install app on VM

```bash
gcloud compute ssh jankendra-app --zone=asia-south1-a --project=YOUR_PROJECT

# on the VM
sudo git clone -b release https://github.com/AnshulTikariha/Jankendra-AI.git /opt/jankendra
sudo bash /opt/jankendra/deploy/scripts/install-vm.sh
```

Edit secrets:

```bash
sudo nano /etc/jankendra/backend.env   # JWT_SECRET_KEY, CORS_ORIGINS
sudo nano /etc/jankendra/ai.env        # GOOGLE_CLOUD_PROJECT (VM SA uses ADC)
sudo nano /etc/jankendra/frontend.env  # VITE_GOOGLE_MAPS_API_KEY

sudo systemctl restart jankendra-backend jankendra-ai
cd /opt/jankendra/frontend && sudo -u jankendra npm run build
sudo systemctl reload nginx
```

On GCP VM, **do not** commit `google-credential.json`. The attached service account is used automatically.

## 3. Auto-deploy on `release` branch

### Option A — GitHub Actions (recommended for this repo)

Add repository secrets:

| Secret | Value |
|--------|--------|
| `VM_HOST` | VM external IP |
| `VM_USER` | SSH user (e.g. your OS Login user) |
| `VM_SSH_PRIVATE_KEY` | Private key for SSH |

Workflow: `.github/workflows/deploy-release.yml`  
Runs `deploy/scripts/deploy.sh` on every push/merge to **`release`**.

### Option B — Google Cloud Build

```bash
gcloud builds triggers create github \
  --name=jankendra-release-deploy \
  --repo-name=Jankendra-AI \
  --repo-owner=AnshulTikariha \
  --branch-pattern=^release$ \
  --build-config=deploy/gcp/cloudbuild.yaml \
  --substitutions=_VM_NAME=jankendra-app,_ZONE=asia-south1-a
```

Grant Cloud Build permission to SSH to the VM (OS Login or `roles/compute.instanceAdmin.v1`).

## 4. Manual redeploy

```bash
sudo bash /opt/jankendra/deploy/scripts/deploy.sh
```

## Architecture

```
Internet :80
    │
    ▼
  nginx
    ├── /              → frontend/dist (React)
    ├── /api/v1/analyze-text → AI :8001
    └── /api/*         → Backend :8000
```

## Troubleshooting

```bash
sudo systemctl status jankendra-backend jankendra-ai nginx
sudo journalctl -u jankendra-backend -f
sudo journalctl -u jankendra-ai -f
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8001/health
```
