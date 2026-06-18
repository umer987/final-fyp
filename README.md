# Voice2Law

Bilingual Urdu / English legal information assistant for Pakistan with voice and text Q&A.

## Stack

| Layer | Tech | Port |
|-------|------|------|
| Frontend | React + Vite | 5173 |
| Backend | Node + Express + Firebase/Firestore + optional OpenAI | 5000 |
| NLP | Python FastAPI + ChromaDB + Hugging Face / ElevenLabs | 8001 |

## Quick start

```powershell
# From project root
.\scripts\start_voice2law.ps1
# Wait about 60 seconds, then:
.\scripts\verify_services.ps1
```

Open `http://localhost:5173`

See [docs/STARTUP.md](docs/STARTUP.md) for manual startup and troubleshooting.

## Deployment

For a beginner-friendly AWS deployment path, see [docs/AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md).

## Project layout

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## Environment

- Root `.env` - `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_NLP_SERVICE_URL`, `VITE_STT_ENGINE`
- `backend/.env` - Firebase/Firestore, JWT, NLP URL, Google OAuth, optional OpenAI fallback
- `nlp-service/.env` - Hugging Face or OpenAI-compatible LLM, speech, Chroma, OCR

Copy from each folder's `.env.example` if needed.

## FYP documents

Reports and meeting logbooks live in `docs/fyp/`.
