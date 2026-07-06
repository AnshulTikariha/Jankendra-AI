# Trigger GCP Cloud Build deploy manually (no GitHub connection required).
# Usage from repo root:
#   .\deploy\gcp\submit-build.ps1

$ErrorActionPreference = "Stop"

$Gcloud = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$ProjectId = if ($env:GCP_PROJECT_ID) { $env:GCP_PROJECT_ID } else { "project-d9125421-6cdc-4628-9f5" }
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

if (-not (Test-Path $Gcloud)) { throw "gcloud not found" }

Push-Location $RepoRoot
try {
    & $Gcloud builds submit . `
        --project=$ProjectId `
        --config=deploy/gcp/cloudbuild.yaml `
        --substitutions="_VM_NAME=jankendra-app,_ZONE=asia-south1-a,_SECRET_NAME=jankendra-google-credential"
} finally {
    Pop-Location
}
