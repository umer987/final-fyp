# Voice2Law — Startup & Data Guide

## Run order (every session)

Use **4 separate PowerShell terminals**. Start in this order:

```powershell
# 1. MongoDB (skip if already running as a Windows service)
Get-Service MongoDB -ErrorAction SilentlyContinue | Start-Service

# 2. NLP service (port 8001) — only ONE instance!
cd C:\Users\user\Desktop\final-fyp-main\nlp-service
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001

# 3. Backend API (port 5000)
cd C:\Users\user\Desktop\final-fyp-main\backend
npm run dev

# 4. Frontend (port 5173)
cd C:\Users\user\Desktop\final-fyp-main
npm run dev
```

**Open:** http://localhost:5173

### One-click startup (Windows)

From project root:

```powershell
.\scripts\start_voice2law.ps1
```

Then verify (after NLP shows startup complete):

```powershell
.\scripts\verify_services.ps1
```

### Verify

```powershell
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod http://127.0.0.1:8001/health
netstat -ano | findstr ":8001"   # should show ONE listener
```

Or run `.\scripts\verify_services.ps1` for a combined check plus a sample `/ask` test.

### Faster page navigation (demo)

Dev mode (`npm run dev`) is slower than a production build. For presentations:

```powershell
cd C:\Users\user\Desktop\final-fyp-main
npm run build
npm run preview
```

Navbar links prefetch lazy route chunks on hover for quicker first visits to `/ask`, `/find-lawyers`, etc.

### Seed lawyers (once)

```powershell
cd C:\Users\user\Desktop\final-fyp-main\backend
npm run seed:lawyers
```

### Index legal PDFs (when adding/updating data)

```powershell
cd C:\Users\user\Desktop\final-fyp-main\nlp-service
.\venv\Scripts\Activate.ps1
python ingest.py --input .\legal_data --save-text
```

---

## MongoDB data types

Database: `mongodb://127.0.0.1:27017/voice2law`

| Collection | Model | Fields | Written by |
|------------|-------|--------|------------|
| `users` | User | `name` String, `email` String (unique), `passwordHash` String?, `googleId` String?, `picture` String?, `role` `user`\|`admin` | register, login, Google OAuth |
| `lawyers` | Lawyer | `name`, `specialization`, `city`, `phone` String; `email`, `image`, `nameUrdu`, `courtLocation` String?; `rating` Number; `reviewCount` Number; `verified` Boolean; `languages` [String] | admin CRUD, `npm run seed:lawyers` |
| `queries` | Query | `questionText` String, `answerText` String, `language` `urdu`\|`english`, `source` `text`\|`voice`, `userId` ObjectId? (links to User), `createdAt` Date | `POST /api/ask`, `POST /api/voice` |
| `knowledgebases` | KnowledgeBase | `titleUrdu`, `contentUrdu` String, `category` enum, `status` `pending`\|`approved` | admin only |

**Filesystem (not MongoDB):**

| Path | Content |
|------|---------|
| `backend/uploads/` | Voice audio uploads (optional; can delete after STT) |
| `nlp-service/data/chroma/` | RAG vector index (ChromaDB embeddings) |

---

## What to store (recommended)

| Data | Store? | Where |
|------|--------|-------|
| Google user profile | Yes | `users` |
| Questions + answers | Yes | `queries` (with `userId` when logged in) |
| Lawyer directory | Yes | `lawyers` |
| Admin legal articles | Yes | `knowledgebases` |
| NLP embeddings | Yes | `nlp-service/data/chroma/` |
| Voice audio files | Optional | `backend/uploads/` |

---

## Common issues

| Problem | Fix |
|---------|-----|
| `ERR_CONNECTION_REFUSED` on 5173 | Start frontend: `npm run dev` in project root |
| Cannot reach API on 5000 | Start backend: `npm run dev` in `backend/` |
| STT / NLP fallback answers | Start NLP on 8001; run `.\scripts\verify_services.ps1`; ensure only **one** uvicorn process |
| `ECONNRESET` on /ask | Kill duplicate NLP processes: `nlp-service\scripts\start_nlp.ps1` |
| Empty Find Lawyers | Run `npm run seed:lawyers` |
| Slow first answer (minutes) | Set `LLM_EXTRACTIVE_ONLY=true` in `nlp-service/.env` (fast Chroma excerpts, ~2–10s) |
| Polished Urdu + fast LLM | Optional Groq: see **NLP speed** below |

---

## NLP speed (demo)

**Default (recommended for FYP demo):** `LLM_EXTRACTIVE_ONLY=true` in [`nlp-service/.env`](../nlp-service/.env) — skips remote LLM; answers quote indexed law text in ~2–10 seconds. Works without a Gemini API key.

To switch back to polished Urdu via Google Gemini:
```
LLM_PROVIDER=openai
LLM_API_KEY=your_google_ai_studio_key
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_MODEL=gemini-2.0-flash
LLM_EXTRACTIVE_ONLY=false
NLP_TIMEOUT_MS=90000   # in backend/.env
```
Get a key at https://aistudio.google.com/apikey. Then restart NLP and backend.

**Optional — Groq (polished Urdu, ~1–3s):** In `nlp-service/.env`:

```
LLM_PROVIDER=openai
LLM_API_KEY=gsk_your_groq_key
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.1-8b-instant
LLM_EXTRACTIVE_ONLY=false
```

Then set `NLP_TIMEOUT_MS=240000` in `backend/.env` if using remote LLM.

**Voice STT:** For FYP demo / fast voice, use `VITE_STT_ENGINE=webspeech` in root `.env` and `STT_ENGINE=webspeech` in `backend/.env` (browser mic, instant). For server-side Urdu transcription, use `whisper` (calls NLP `/transcribe`; slow on cold start).
