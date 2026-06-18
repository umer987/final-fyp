# Voice2Law Project Structure

```text
final-fyp-main/
|-- src/                     # React frontend (Vite 6)
|-- backend/                 # Express API on port 5000
|-- nlp-service/             # FastAPI RAG / STT / TTS service on port 8001
|   |-- app/                 # FastAPI app and services
|   |-- legal_data/          # Source PDFs for ingest
|   `-- data/chroma/         # Generated Chroma index
|-- scripts/                 # Local startup and utility scripts
|-- docs/                    # Documentation
|   |-- fyp/                 # Reports and logbooks
|   |-- guides/              # Extra guides
|   |-- STARTUP.md
|   |-- NLP_STATUS.md
|   `-- AWS_DEPLOYMENT.md
|-- deploy/                  # AWS deployment files
|   `-- aws/
|       |-- nginx/
|       `-- systemd/
|-- build/                   # Vite production output
|-- index.html
|-- package.json
|-- vite.config.ts
`-- README.md
```

## Current architecture

- The frontend talks to the backend at `/api`.
- The backend talks to the NLP service over HTTP at `NLP_SERVICE_URL`.
- The NLP service does the legal answer work with Chroma retrieval and whichever LLM/STT/TTS providers are configured in `nlp-service/.env`.
- Firestore is used for the backend admin / persistence features when Firebase credentials are present.

## Service ports

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:5000/api |
| NLP (FastAPI) | http://localhost:8001 |

## What goes where

| Item | Location |
|------|----------|
| Legal PDFs for RAG | `nlp-service/legal_data/` |
| Chroma index | `nlp-service/data/chroma/` |
| Frontend env | root `.env` |
| Backend env | `backend/.env` |
| NLP env | `nlp-service/.env` |

## Run locally

```powershell
# Backend
cd backend
npm run dev

# Frontend
cd ..
npm run dev

# NLP service
cd nlp-service
.\venv\Scripts\activate
uvicorn app.main:app --port 8001
```
