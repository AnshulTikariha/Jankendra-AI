#!/usr/bin/env bash
# Pull latest release branch code, build frontend, install Python deps, restart services.
# Safe to run on every deploy (manual or Cloud Build).
set -euo pipefail

APP_DIR="/opt/jankendra"
BRANCH="${BRANCH:-release}"
VENV="${APP_DIR}/.venv"
PYTHON="${PYTHON:-python3.11}"
if ! command -v "${PYTHON}" >/dev/null 2>&1; then
  PYTHON=python3
fi

cd "${APP_DIR}"

if [[ -d "${APP_DIR}/.git" ]]; then
  echo "==> Fetching ${BRANCH}"
  sudo -u jankendra git fetch origin "${BRANCH}"
  sudo -u jankendra git checkout "${BRANCH}"
  sudo -u jankendra git reset --hard "origin/${BRANCH}"
else
  echo "==> Local deploy — using files on disk (no git)"
fi

echo "==> Python virtualenv + dependencies"
if [[ ! -d "${VENV}" ]]; then
  sudo -u jankendra "${PYTHON}" -m venv "${VENV}"
fi

sudo -u jankendra "${VENV}/bin/pip" install --upgrade pip wheel
sudo -u jankendra "${VENV}/bin/pip" install -e "${APP_DIR}/.[test]"
sudo -u jankendra "${VENV}/bin/pip" install -e "${APP_DIR}/backend/.[test]"

echo "==> Database migrations + seed (idempotent)"
mkdir -p "${APP_DIR}/backend/data"
chown -R jankendra:jankendra "${APP_DIR}/backend/data"
sudo -u jankendra bash -c "cd ${APP_DIR}/backend && ${VENV}/bin/alembic upgrade head"
sudo -u jankendra bash -c "cd ${APP_DIR}/backend && ${VENV}/bin/python scripts/seed_demo_data.py"

echo "==> Frontend build"
if [[ -f /etc/jankendra/frontend.env ]]; then
  # root reads env (jankendra user cannot); pass vars into the build
  # shellcheck disable=SC2046
  sudo -u jankendra env $(grep -v '^#' /etc/jankendra/frontend.env | grep -v '^$' | xargs) \
    bash -c "cd ${APP_DIR}/frontend && npm ci && npm run build"
else
  sudo -u jankendra bash -c "cd ${APP_DIR}/frontend && npm ci && npm run build"
fi

echo "==> Restart application services"
systemctl restart jankendra-backend
systemctl restart jankendra-ai
systemctl reload nginx

DEPLOY_LABEL="$(sudo -u jankendra git -C "${APP_DIR}" rev-parse --short HEAD 2>/dev/null || echo local)"
echo "==> Deploy complete (${DEPLOY_LABEL})"
