# Firebase Hosting — https://jankendra-ai.web.app

The React app is served from **Firebase Hosting**. API calls (`/api/**`, `/ai/**`) are proxied through a **Cloud Function** to your GCP VM at `34.180.31.35`, so the browser stays on HTTPS (no mixed-content errors).

## One-time setup

1. **Firebase Blaze plan** (pay-as-you-go) — required for Cloud Functions that call your VM.
2. **Login** (run in your terminal — browser opens):

```powershell
cd Jankendra-AI
npx firebase login
```

3. **Google Maps key** (for map UI):

```powershell
$env:VITE_GOOGLE_MAPS_API_KEY = "your-maps-api-key"
```

## Deploy

```powershell
cd Jankendra-AI
npm run firebase:deploy
```

Or step by step:

```powershell
npm install -g firebase-tools   # optional; repo includes local firebase-tools
firebase login
cd frontend
npm ci
$env:VITE_API_BASE_URL = "/api/v1"
$env:VITE_GOOGLE_MAPS_API_KEY = "your-maps-api-key"
npm run build
cd ..
cd functions && npm install && cd ..
firebase deploy --project jankendra-ai --only hosting,functions
```

## After deploy

- Site: https://jankendra-ai.web.app
- API (via proxy): https://jankendra-ai.web.app/api/v1/...
- VM direct (HTTP): http://34.180.31.35

## Files

| File | Purpose |
|------|---------|
| `firebase.json` | Hosting + rewrites to `vmProxy` |
| `.firebaserc` | Project `jankendra-ai` |
| `functions/index.js` | Proxies to VM `34.180.31.35:80` |
| `frontend/.env.production` | `VITE_API_BASE_URL=/api/v1` |
| `deploy/firebase/deploy.ps1` | Build + deploy script |

## CI token (optional)

```powershell
firebase login:ci
# set FIREBASE_TOKEN in CI, then:
$env:FIREBASE_TOKEN = "..."
npm run firebase:deploy
```
