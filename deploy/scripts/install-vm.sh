#!/usr/bin/env bash
# One-time VM bootstrap for Jankendra-AI on Ubuntu 22.04/24.04.
# Run as root: sudo bash deploy/scripts/install-vm.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/AnshulTikariha/Jankendra-AI.git}"
BRANCH="${BRANCH:-release}"
APP_DIR="/opt/jankendra"
APP_USER="jankendra"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

echo "==> Installing system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y \
  ca-certificates \
  curl \
  git \
  nginx \
  rsync \
  software-properties-common

echo "==> Installing Python 3.11"
add-apt-repository -y ppa:deadsnakes/ppa
apt-get update -y
apt-get install -y python3.11 python3.11-venv python3.11-dev

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Creating application user"
if ! id "${APP_USER}" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "${APP_DIR}" --shell /bin/bash "${APP_USER}"
fi

mkdir -p "${APP_DIR}"
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

echo "==> Syncing application code"
if [[ -f "${APP_DIR}/deploy/scripts/deploy.sh" ]]; then
  echo "Using application files already on disk (local/tarball deploy)."
elif [[ ! -d "${APP_DIR}/.git" ]]; then
  sudo -u "${APP_USER}" git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
else
  sudo -u "${APP_USER}" git -C "${APP_DIR}" fetch origin "${BRANCH}"
  sudo -u "${APP_USER}" git -C "${APP_DIR}" checkout "${BRANCH}"
  sudo -u "${APP_USER}" git -C "${APP_DIR}" pull --ff-only origin "${BRANCH}"
fi

chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

echo "==> Creating environment directory"
mkdir -p /etc/jankendra
chmod 750 /etc/jankendra

if [[ ! -f /etc/jankendra/backend.env ]]; then
  cp "${APP_DIR}/deploy/env/backend.env.example" /etc/jankendra/backend.env
  echo "Created /etc/jankendra/backend.env — edit JWT_SECRET_KEY and CORS_ORIGINS"
fi

if [[ ! -f /etc/jankendra/ai.env ]]; then
  cp "${APP_DIR}/deploy/env/ai.env.example" /etc/jankendra/ai.env
  echo "Created /etc/jankendra/ai.env — set GOOGLE_CLOUD_PROJECT"
fi

if [[ -n "${GOOGLE_CLOUD_PROJECT:-}" ]]; then
  sed -i "s|^GOOGLE_CLOUD_PROJECT=.*|GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}|" /etc/jankendra/ai.env
fi

if [[ -f /etc/jankendra/google-credential.json ]]; then
  chmod 640 /etc/jankendra/google-credential.json
  chown root:jankendra /etc/jankendra/google-credential.json 2>/dev/null || chown root:root /etc/jankendra/google-credential.json
  if ! grep -q '^GOOGLE_APPLICATION_CREDENTIALS=' /etc/jankendra/ai.env; then
    echo "GOOGLE_APPLICATION_CREDENTIALS=/etc/jankendra/google-credential.json" >> /etc/jankendra/ai.env
  fi
fi

if [[ ! -f /etc/jankendra/frontend.env ]]; then
  cp "${APP_DIR}/deploy/env/frontend.env.example" /etc/jankendra/frontend.env
  echo "Created /etc/jankendra/frontend.env — set VITE_GOOGLE_MAPS_API_KEY"
fi

chmod 640 /etc/jankendra/*.env
chown root:jankendra /etc/jankendra/*.env

echo "==> Installing nginx site"
cp "${APP_DIR}/deploy/nginx/jankendra.conf" /etc/nginx/sites-available/jankendra
ln -sf /etc/nginx/sites-available/jankendra /etc/nginx/sites-enabled/jankendra
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "==> Installing systemd units"
cp "${APP_DIR}/deploy/systemd/jankendra-backend.service" /etc/systemd/system/
cp "${APP_DIR}/deploy/systemd/jankendra-ai.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable jankendra-backend jankendra-ai

echo "==> Running first deploy"
bash "${APP_DIR}/deploy/scripts/deploy.sh"

echo "==> Done. Edit /etc/jankendra/*.env then: sudo systemctl restart jankendra-backend jankendra-ai"
