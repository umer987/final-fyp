# NLP & Data Verification Notes

**Checked:** 2026-06-10 (Voice2Law FYP)

## Service ports

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:5173 | Vite dev server |
| Backend | http://localhost:5000/api | Proxies ask/voice/tts to NLP |
| NLP | http://localhost:8001 | FastAPI (`NLP_SERVICE_URL` in backend `.env`) |

## Health checks

```powershell
# Backend (includes NLP reachability + chunk count)
Invoke-RestMethod http://localhost:5000/api/health

# NLP direct
Invoke-RestMethod http://localhost:8001/health
```

Expected NLP `/health` fields: `status: "ok"`, `indexed_chunks` (ChromaDB count).

## Verification status (this session)

- **Backend (5000):** Not running during automated check.
- **NLP (8001):** Not running during automated check.
- **Urdu sample questions:** Not executed live (services down). Use Postman collection or:

```json
POST http://localhost:5000/api/ask
{ "question": "طلاق کا طریقہ کار کیا ہے؟", "language": "urdu" }
```

## Chroma / indexed data

- Ingest lives under `nlp-service/` — run ingest scripts per `nlp-service/README.md`.
- Chunk count is exposed on `GET /health` as `indexed_chunks`.
- Backend `/api/health` mirrors this as `nlpIndexedChunks` when NLP is up.

## Lawyer data

- Sample seed: `backend/data/lawyers-sample.json`
- Scraper: `npm run scrape:lawyers` or `npm run seed:lawyers` (from `backend/`)
- **wakeelonline.com blocker:** Site currently serves a "Legal Eagles" marketing site; `/lawyers` returns 404. Scraper falls back to sample JSON.

## How to start for full test

```powershell
# Terminal 1 — NLP (from nlp-service, port 8001)
cd nlp-service
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8001

# Terminal 2 — Backend
cd backend
npm run dev

# Terminal 3 — Frontend
npm run dev
```
