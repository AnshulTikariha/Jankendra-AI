# Build frontend and deploy to Firebase Hosting (API via Cloud Run HTTPS proxy).
param(
    [string]$ProjectId = "jankendra-ai",
    [string]$ApiBaseUrl = "https://jankendra-api-proxy-450369521420.asia-south1.run.app/api/v1",
    [string]$MapsKey = $env:VITE_GOOGLE_MAPS_API_KEY
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Firebase = Join-Path $RepoRoot "node_modules\.bin\firebase.cmd"

if (-not (Test-Path $Firebase)) {
    Write-Host "==> Installing firebase-tools"
    Push-Location $RepoRoot
    npm install
    Pop-Location
}

if (-not $MapsKey) {
    Write-Warning "VITE_GOOGLE_MAPS_API_KEY not set - maps UI disabled until you redeploy with a key."
    $MapsKey = ""
}

Write-Host "==> Building frontend for Firebase Hosting"
Push-Location (Join-Path $RepoRoot "frontend")
if (-not (Test-Path "node_modules")) {
    npm ci
}
$env:VITE_API_BASE_URL = $ApiBaseUrl
$env:VITE_GOOGLE_MAPS_API_KEY = $MapsKey
npm run build
Pop-Location

Write-Host "==> Deploying to Firebase project $ProjectId (hosting only)"
Push-Location $RepoRoot
& $Firebase deploy --project $ProjectId --only hosting
Pop-Location

Write-Host "Done: https://jankendra-ai.web.app"
Write-Host "API: $ApiBaseUrl"
