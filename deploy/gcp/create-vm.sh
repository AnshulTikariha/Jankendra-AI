#!/usr/bin/env bash
# Create a single Compute Engine VM for Jankendra-AI (asia-south1).
# Usage:
#   export GCP_PROJECT_ID=your-project
#   export GCP_ZONE=asia-south1-a
#   bash deploy/gcp/create-vm.sh
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
ZONE="${GCP_ZONE:-asia-south1-a}"
INSTANCE_NAME="${INSTANCE_NAME:-jankendra-app}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-standard-2}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-jankendra-runtime@${PROJECT_ID}.iam.gserviceaccount.com}"

echo "==> Enabling required APIs"
gcloud services enable compute.googleapis.com cloudbuild.googleapis.com \
  --project="${PROJECT_ID}"

echo "==> Creating runtime service account (if missing)"
if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud iam service-accounts create jankendra-runtime \
    --project="${PROJECT_ID}" \
    --display-name="Jankendra runtime"
  SERVICE_ACCOUNT="jankendra-runtime@${PROJECT_ID}.iam.gserviceaccount.com"
fi

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user" \
  --quiet >/dev/null

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/logging.logWriter" \
  --quiet >/dev/null

echo "==> Creating firewall rules (if missing)"
if ! gcloud compute firewall-rules describe jankendra-allow-http --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud compute firewall-rules create jankendra-allow-http \
    --project="${PROJECT_ID}" \
    --allow=tcp:80,tcp:443 \
    --target-tags=jankendra-app \
    --description="HTTP/HTTPS for Jankendra app"
fi

echo "==> Creating VM ${INSTANCE_NAME}"
if gcloud compute instances describe "${INSTANCE_NAME}" --zone="${ZONE}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "Instance already exists."
else
  gcloud compute instances create "${INSTANCE_NAME}" \
    --project="${PROJECT_ID}" \
    --zone="${ZONE}" \
    --machine-type="${MACHINE_TYPE}" \
    --tags=jankendra-app \
    --service-account="${SERVICE_ACCOUNT}" \
    --scopes=cloud-platform \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=30GB \
    --metadata=enable-oslogin=TRUE
fi

EXTERNAL_IP="$(gcloud compute instances describe "${INSTANCE_NAME}" \
  --zone="${ZONE}" \
  --project="${PROJECT_ID}" \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')"

cat <<EOF

VM created: ${INSTANCE_NAME}
External IP: ${EXTERNAL_IP}

Next steps:
1. SSH:  gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE} --project=${PROJECT_ID}
2. Clone + install:
       git clone -b release https://github.com/AnshulTikariha/Jankendra-AI.git /opt/jankendra
       sudo bash /opt/jankendra/deploy/scripts/install-vm.sh
3. Edit /etc/jankendra/*.env (JWT secret, maps key, CORS with http://${EXTERNAL_IP})
4. Open http://${EXTERNAL_IP}

EOF
