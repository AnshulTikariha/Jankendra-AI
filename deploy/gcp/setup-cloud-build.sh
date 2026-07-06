#!/usr/bin/env bash
# One-time setup: GCP Cloud Build CI/CD for Jankendra-AI.
# Credentials live in GCP Secret Manager — not GitHub.
#
# Usage:
#   export GCP_PROJECT_ID=project-d9125421-6cdc-4628-9f5
#   export GCP_ZONE=asia-south1-a
#   export GOOGLE_CREDENTIAL_FILE=ai_modules/credentials/google-credential.json
#   bash deploy/gcp/setup-cloud-build.sh
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
ZONE="${GCP_ZONE:-asia-south1-a}"
VM_NAME="${INSTANCE_NAME:-jankendra-app}"
SECRET_NAME="${SECRET_NAME:-jankendra-google-credential}"
SSH_SECRET="${SSH_SECRET:-jankendra-deploy-ssh-key}"
DEPLOY_USER="${DEPLOY_USER:-jankendra-deploy}"
REPO_OWNER="${GITHUB_REPO_OWNER:-AnshulTikariha}"
REPO_NAME="${GITHUB_REPO_NAME:-Jankendra-AI}"
BRANCH_PATTERN="${BRANCH_PATTERN:-^release$}"
CRED_FILE="${GOOGLE_CREDENTIAL_FILE:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SSH_DIR="${TMPDIR:-/tmp}/jankendra-deploy-ssh"

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "==> Enabling APIs"
gcloud services enable cloudbuild.googleapis.com compute.googleapis.com \
  secretmanager.googleapis.com iam.googleapis.com --project="${PROJECT_ID}"

echo "==> IAM for Cloud Build"
for SA in "${CLOUD_BUILD_SA}" "${COMPUTE_SA}"; do
  for ROLE in roles/secretmanager.secretAccessor roles/storage.objectViewer; do
    gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
      --member="serviceAccount:${SA}" --role="${ROLE}" --quiet >/dev/null
  done
done
for ROLE in roles/compute.instanceAdmin.v1 roles/compute.viewer \
  roles/storage.admin roles/logging.logWriter; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${CLOUD_BUILD_SA}" --role="${ROLE}" --quiet >/dev/null
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${COMPUTE_SA}" --role="${ROLE}" --quiet >/dev/null
done

echo "==> Deploy SSH key"
mkdir -p "${SSH_DIR}"
if [[ ! -f "${SSH_DIR}/id_rsa" ]]; then
  ssh-keygen -t rsa -b 4096 -f "${SSH_DIR}/id_rsa" -N "" -q
fi
PUB_KEY="$(cat "${SSH_DIR}/id_rsa.pub")"

gcloud compute instances add-metadata "${VM_NAME}" \
  --zone="${ZONE}" --project="${PROJECT_ID}" \
  --metadata=enable-oslogin=FALSE

# Append deploy key (preserve existing keys if any)
gcloud compute ssh "${VM_NAME}" --zone="${ZONE}" --project="${PROJECT_ID}" --command="
  id ${DEPLOY_USER} 2>/dev/null || sudo useradd -m -s /bin/bash ${DEPLOY_USER}
  echo '${DEPLOY_USER} ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/${DEPLOY_USER}
  sudo chmod 440 /etc/sudoers.d/${DEPLOY_USER}
" --quiet

gcloud compute instances add-metadata "${VM_NAME}" \
  --zone="${ZONE}" --project="${PROJECT_ID}" \
  --metadata="ssh-keys=${DEPLOY_USER}:${PUB_KEY}"

for SECRET in "${SECRET_NAME}" "${SSH_SECRET}"; do
  gcloud secrets describe "${SECRET}" --project="${PROJECT_ID}" >/dev/null 2>&1 || \
    gcloud secrets create "${SECRET}" --project="${PROJECT_ID}" --replication-policy=automatic
  for SA in "${CLOUD_BUILD_SA}" "${COMPUTE_SA}"; do
    gcloud secrets add-iam-policy-binding "${SECRET}" --project="${PROJECT_ID}" \
      --member="serviceAccount:${SA}" --role=roles/secretmanager.secretAccessor --quiet >/dev/null
  done
done

[[ -z "${CRED_FILE}" && -f "${REPO_ROOT}/ai_modules/credentials/google-credential.json" ]] && \
  CRED_FILE="${REPO_ROOT}/ai_modules/credentials/google-credential.json"
[[ -n "${CRED_FILE}" && -f "${CRED_FILE}" ]] && \
  gcloud secrets versions add "${SECRET_NAME}" --project="${PROJECT_ID}" --data-file="${CRED_FILE}"
gcloud secrets versions add "${SSH_SECRET}" --project="${PROJECT_ID}" --data-file="${SSH_DIR}/id_rsa"

echo "==> Cloud Build trigger (GitHub)"
if gcloud builds triggers describe jankendra-release-deploy --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud builds triggers delete jankendra-release-deploy --project="${PROJECT_ID}" --quiet
fi
if gcloud builds triggers create github \
  --project="${PROJECT_ID}" \
  --name="jankendra-release-deploy" \
  --repo-name="${REPO_NAME}" \
  --repo-owner="${REPO_OWNER}" \
  --branch-pattern="${BRANCH_PATTERN}" \
  --build-config="deploy/gcp/cloudbuild.yaml" 2>/dev/null; then
  echo "GitHub trigger created."
else
  cat <<EOF
Connect GitHub once: https://console.cloud.google.com/cloud-build/triggers?project=${PROJECT_ID}
Then re-run this script or: gcloud builds triggers run jankendra-release-deploy --branch=release
EOF
fi

echo "Done. Test: gcloud builds submit . --config=deploy/gcp/cloudbuild.yaml --project=${PROJECT_ID}"
