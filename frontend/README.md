# Jankendra-AI Frontend

React + TypeScript + Tailwind frontend scaffold for Jankendra-AI.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Zustand

## Getting Started

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The development server runs at <http://localhost:5173>.

## Scripts

```bash
npm run dev      # Start Vite dev server
npm run build    # Type-check and create production build
npm run lint     # Run Oxlint
npm run preview  # Preview production build
```

## Project Structure

```text
src/
├── api/         # Typed API helpers and future OpenAPI client
├── components/  # Reusable UI components
├── hooks/       # React hooks
├── i18n/        # Locale scaffolding
├── pages/       # Route-level views
├── stores/      # Zustand client state
└── types/       # Shared frontend types
```

Set `VITE_API_BASE_URL` in `.env` when the backend API is not served from
`/api/v1`.
