# CareerCircle

A full-stack job/resume assistant app (frontend: Vite + React + TypeScript; backend: Python API).

This repository contains two main folders:

- `backend/` — Python API and resume parsing utilities.
- `frontend/` — Vite + React + TypeScript web application.

## Quick start

Prerequisites

- macOS / Linux / Windows WSL
- Python 3.10+ (for backend)
- Node 18+ / npm or `pnpm` (for frontend)

1) Backend (local development)

```bash
cd backend
# create a virtual environment (only once)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# run the API (adjust host/port as needed)
# from inside the `backend` directory
uvicorn main:app --reload --port 8002
```

The backend exposes REST endpoints under `/api/v1/` (for example, resumes endpoints).

2) Frontend (local development)

```bash
cd frontend
# install deps (npm or pnpm)
npm install

# run dev server (Vite)
npm run dev
```

Open the URL shown by Vite (typically `http://localhost:5173`). The frontend expects the backend API to be available — configure any API base URL in `frontend/src/lib/api.ts` or via environment variables if present.

3) Example API request

From repo root (adjust token and URL/port as needed):

```bash
curl -X POST "http://localhost:8002/api/v1/resumes/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"name":"Test Master Resume","content":{"name":"Test User","email":"test@example.com","phone":"1234567890","experience":[],"education":[],"skills":[]},"type":"master"}'
```

## Project structure

- `backend/`
  - `main.py` — FastAPI app entrypoint
  - `routes/` — API route modules
  - `requirements.txt` — Python dependencies

- `frontend/`
  - React + TypeScript app scaffolded with Vite
  - `src/` — components, pages, context providers

## Contributing

- Create an issue describing the change or improvement.
- Open a pull request with a clear description and tests where appropriate.

## Notes

- Add any necessary `.env` files for secrets and environment-specific configuration.
- `backend/venv` and `node_modules/` are ignored via `.gitignore`.