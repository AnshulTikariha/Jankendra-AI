# Deploy Jankendra-AI from Windows to a single GCP VM (local code + credentials).
# Usage (PowerShell, from repo root):
#   .\deploy\scripts\deploy-from-windows.ps1
#
# Optional env vars:
#   $env:GCP_PROJECT_ID = "project-d9125421-6cdc-4628-9f5"
#   $env:GCP_ZONE = "asia-south1-a"
#   $env:INSTANCE_NAME = "jankendra-app"

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Gcloud = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$ProjectId = if ($env:GCP_PROJECT_ID) { $env:GCP_PROJECT_ID } else { "project-d9125421-6cdc-4628-9f5" }
$Zone = if ($env:GCP_ZONE) { $env:GCP_ZONE } else { "asia-south1-a" }
$Instance = if ($env:INSTANCE_NAME) { $env:INSTANCE_NAME } else { "jankendra-app" }
$CredFile = Join-Path $RepoRoot "ai_modules\credentials\google-credential.json"
$Archive = Join-Path $env:TEMP "jankendra-deploy.tgz"

if (-not (Test-Path $Gcloud)) {
    throw "gcloud not found. Install Google Cloud SDK first."
}
if (-not (Test-Path $CredFile)) {
    throw "Credentials not found at $CredFile"
}

Write-Host "==> Authenticating gcloud with service account key"
& $Gcloud auth activate-service-account --key-file="$CredFile" --project="$ProjectId" | Out-Null
& $Gcloud config set project $ProjectId | Out-Null

Write-Host "==> Creating VM if needed (gcloud)"
& $Gcloud services enable compute.googleapis.com --project=$ProjectId | Out-Null
$null = & $Gcloud compute instances describe $Instance --zone=$Zone --project=$ProjectId 2>&1
if ($LASTEXITCODE -ne 0) {
    & $Gcloud compute instances create $Instance `
        --project=$ProjectId `
        --zone=$Zone `
        --machine-type=e2-standard-2 `
        --tags=jankendra-app `
        --scopes=cloud-platform `
        --image-family=ubuntu-2204-lts `
        --image-project=ubuntu-os-cloud `
        --boot-disk-size=30GB `
        --metadata=enable-oslogin=FALSE
}
$null = & $Gcloud compute firewall-rules describe jankendra-allow-http --project=$ProjectId 2>&1
if ($LASTEXITCODE -ne 0) {
    & $Gcloud compute firewall-rules create jankendra-allow-http `
        --project=$ProjectId `
        --allow=tcp:80,tcp:443 `
        --target-tags=jankendra-app | Out-Null
}

$ExternalIp = & $Gcloud compute instances describe $Instance `
    --zone=$Zone --project=$ProjectId `
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
Write-Host "VM external IP: $ExternalIp"

Write-Host "==> Packaging local repository"
if (Test-Path $Archive) { Remove-Item $Archive -Force }
$tar = Get-Command tar -ErrorAction SilentlyContinue
if (-not $tar) {
    throw "tar not found (Windows 10+). Cannot package repo."
}
Push-Location $RepoRoot
tar -czf $Archive `
    --exclude=.git `
    --exclude=node_modules `
    --exclude=frontend/node_modules `
    --exclude=backend/.venv `
    --exclude=.venv `
    --exclude=backend/data/*.db `
    --exclude=ai_modules/credentials `
    .
Pop-Location

Write-Host "==> Uploading code archive to VM"
& $Gcloud compute scp $Archive "${Instance}:/tmp/jankendra-deploy.tgz" --zone=$Zone --project=$ProjectId

Write-Host '==> Uploading Google credentials to VM'
& $Gcloud compute scp $CredFile "${Instance}:google-credential.json" --zone=$Zone --project=$ProjectId
if ($LASTEXITCODE -ne 0) { throw "Failed to upload credentials" }

Write-Host "==> Installing on VM"
$RemoteScript = @'
set -euo pipefail
export GOOGLE_CLOUD_PROJECT=__PROJECT_ID__
sudo mkdir -p /opt/jankendra /etc/jankendra
sudo tar -xzf /tmp/jankendra-deploy.tgz -C /opt/jankendra
sudo find /opt/jankendra/deploy -type f \( -name '*.sh' -o -name '*.service' -o -name '*.conf' \) -exec sed -i 's/\r$//' {} +
sudo mv ~/google-credential.json /etc/jankendra/google-credential.json
sudo bash /opt/jankendra/deploy/scripts/install-vm.sh
if [ -f /etc/jankendra/backend.env ]; then
  sudo sed -i 's|http://YOUR_VM_EXTERNAL_IP|http://__EXTERNAL_IP__|g' /etc/jankendra/backend.env
  sudo sed -i 's|http://YOUR_VM_EXTERNAL_IP|http://__EXTERNAL_IP__|g' /etc/jankendra/ai.env
fi
sudo systemctl restart jankendra-backend jankendra-ai
'@ -replace '__PROJECT_ID__', $ProjectId -replace '__EXTERNAL_IP__', $ExternalIp

$RemoteScript | & $Gcloud compute ssh $Instance --zone=$Zone --project=$ProjectId --command="bash -s"
if ($LASTEXITCODE -ne 0) { throw "Remote install failed (exit $LASTEXITCODE)" }

Write-Host ""
Write-Host "=========================================="
Write-Host "Deploy complete!"
Write-Host "App URL:  http://$ExternalIp"
Write-Host "API docs: http://$ExternalIp/docs"
Write-Host "AI docs:  http://$ExternalIp/ai/docs"
Write-Host ""
Write-Host "Edit secrets on VM if needed:"
Write-Host "  gcloud compute ssh $Instance --zone=$Zone --project=$ProjectId"
Write-Host "  sudo nano /etc/jankendra/backend.env"
Write-Host "  sudo nano /etc/jankendra/frontend.env"
Write-Host "=========================================="
