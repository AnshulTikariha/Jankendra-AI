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

Use **GCP Cloud Build** — credentials stay in GCP Secret Manager (safe for a public GitHub repo).

See `deploy/CICD-SETUP.md` and `deploy/gcp/setup-cloud-build.sh`.

```bash
gcloud builds triggers create github \
  --name=jankendra-release-deploy \
  --repo-name=Jankendra-AI \
  --repo-owner=AnshulTikariha \
  --branch-pattern=^release$ \
  --build-config=deploy/gcp/cloudbuild.yaml \
  --substitutions=_VM_NAME=jankendra-app,_ZONE=asia-south1-a
```

Or connect the repo once in [Cloud Build → Triggers](https://console.cloud.google.com/cloud-build/triggers?project=project-d9125421-6cdc-4628-9f5).

Manual deploy from Windows: `.\deploy\gcp\submit-build.ps1`

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
