# Applyant frontend

React + TypeScript client for the Applyant API.

## Scripts

```bash
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and talks to the backend at `VITE_API_BASE_URL` (default `http://localhost:4000`).

## Auth flow

- `/login` is public
- `/dashboard` requires a stored access token from `POST /api/auth/login`
- Session is persisted in `localStorage` via Zustand
