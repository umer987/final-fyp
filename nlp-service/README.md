# Voice2Law — NLP Microservice (Phase 3)

A Python **FastAPI** microservice that powers the language brain of **Voice2Law**, a
bilingual Pakistani legal assistant. Users ask questions (typed or spoken) in
**Urdu**; the underlying law is **English** scanned documents. This service:

1. **Extracts** text from law books — direct pypdf for text PDFs, OCR for scans.
2. **Indexes** that text into a vector store for retrieval (RAG).
3. **Answers** user questions in **simple Urdu**, grounded in the retrieved law,
   using a configurable LLM.
4. Handles **voice** (Speech-to-Text *and* Urdu Text-to-Speech).

### FREE by default (Hugging Face Inference API)

The default stack costs **$0**: the LLM, speech-to-text, and Urdu text-to-speech
all run on the **Hugging Face Inference API** (free tier, one read token), while
**OCR and embeddings run locally** for free. Every piece is switchable to a paid
provider via `.env` if you want higher quality later.

| Task            | Default (free)                         | Where it runs        |
|-----------------|----------------------------------------|----------------------|
| LLM answers     | `meta-llama/Llama-3.1-8B-Instruct`     | HF Inference Providers (auto router) |
| Speech-to-Text  | `openai/whisper-large-v3`              | HF Inference API     |
| Urdu Text-to-Speech | `facebook/mms-tts-urd`             | HF Inference API     |
| Embeddings      | `paraphrase-multilingual-MiniLM-L12-v2`| **Local** (CPU)      |
| OCR             | Tesseract + OpenCV (default) or Azure   | **Local** or **cloud** |

The existing **Node/Express backend** (`http://localhost:5000`) calls this
service over HTTP. This service runs separately on `http://localhost:8000`.

---

## Architecture (text diagram)

```
                         ┌─────────────────────────────────────────┐
   User (Urdu)           │        Node/Express backend :5000        │
   typed / voice  ─────► │  queryController.generateAnswer  (TODO)  │
                         │  voiceController.transcribeAudio (TODO)  │
                         └───────────────────┬─────────────────────┘
                                             │ HTTP (JSON / multipart)
                                             ▼
                         ┌─────────────────────────────────────────┐
                         │     This FastAPI NLP service :8000        │
                         │                                           │
                         │  POST /ask    question ─► answer (Urdu)   │
                         │  POST /voice  audio ─► transcript+answer  │
                         │  POST /tts    text ─► audio               │
                         └───────────────────┬─────────────────────┘
                                             │
        ┌────────────────────┬───────────────┼────────────────────┬───────────────┐
        ▼                    ▼               ▼                    ▼               ▼
   HF Inference         OCR pipeline     Embeddings          ChromaDB        HF Inference
   STT + Urdu TTS       (Tesseract +     (sentence-          (vector store,  LLM (Llama 3.2 3B,
   (whisper / mms)      OpenCV prep)     transformers,       persistent)     free tier)
                         LOCAL & free     LOCAL & free)

   OFFLINE (one-time): ingest.py  ─► OCR ─► chunk ─► embed ─► store in ChromaDB
```

**Division of labour:** speech (STT + Urdu TTS) and the LLM run on the **free
Hugging Face Inference API**; OCR and embeddings run **locally** for free. These
are independent pieces, each switchable to a paid provider via `.env`.

---

## Project layout

```
nlp-service/
├── app/
│   ├── config.py            # pydantic-settings, reads .env
│   ├── main.py              # FastAPI app + endpoints
│   └── services/
│       ├── ocr.py           # Tesseract (local) or Azure Document Intelligence OCR
│       ├── embeddings.py    # sentence-transformers embeddings
│       ├── vectorstore.py   # ChromaDB add/query
│       ├── llm.py           # HF Inference answer generation (OpenAI optional)
│       ├── speech.py        # HF Inference STT + Urdu TTS (ElevenLabs optional)
│       └── chunking.py      # text splitter
├── ingest.py                # CLI: OCR + index PDFs (run when data is ready)
├── requirements.txt
├── .env.example
└── README.md
```

---

## Setup (Windows)

### 1. System installs (NOT pip)

Run in **PowerShell** (some may need an Administrator terminal):

```powershell
# Python 3.12
winget install Python.Python.3.12

# Tesseract OCR engine (UB Mannheim build)
winget install UB-Mannheim.TesseractOCR
# If winget can't find it, download the installer from:
#   https://github.com/UB-Mannheim/tesseract/wiki
# After install, note the path (default: C:\Program Files\Tesseract-OCR\tesseract.exe)
# and set TESSERACT_CMD in .env if it is NOT on your PATH.

# FFmpeg (audio handling)
winget install Gyan.FFmpeg
```

**Poppler** (required by `pdf2image` to rasterize PDFs) is not reliably on winget:

```powershell
# Option A (recommended): download Poppler for Windows, then add its bin to PATH:
#   https://github.com/oschwartz10612/poppler-windows/releases
#   e.g. extract to C:\poppler  and add  C:\poppler\Library\bin  to your PATH.

# Option B (if you use Chocolatey):
choco install poppler
```

> After installing, **open a new terminal** so PATH changes take effect, then verify:
> ```powershell
> tesseract --version
> pdftoppm -h        # comes from Poppler
> ffmpeg -version
> ```

### 2. Python environment

```powershell
cd C:\Users\user\Desktop\final-fyp-main\nlp-service

python -m venv venv
.\venv\Scripts\Activate.ps1      # if blocked: Set-ExecutionPolicy -Scope Process RemoteSigned

pip install --upgrade pip
pip install -r requirements.txt
```

> `huggingface_hub` is now included. The first run also downloads the **local**
> embedding model (~hundreds of MB) automatically — that is the only model that
> lives on your machine; the LLM/STT/TTS models run remotely on HF's servers.

### 3. Get a FREE Hugging Face token (the only thing you must obtain)

1. Sign in (or sign up — free) at <https://huggingface.co>.
2. Go to **Settings → Access Tokens** (<https://huggingface.co/settings/tokens>).
3. Click **Create new token**, choose type **Read**, copy the value.

Then configure `.env`:

```powershell
Copy-Item .env.example .env
notepad .env
```

Paste the token as `HF_TOKEN` — that single value powers the LLM, STT, and TTS:

```
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Optional:
- `TESSERACT_CMD` only if Tesseract is not on PATH (needed when `OCR_ENGINE=tesseract`).
- **Fast OCR (Azure):** set `OCR_ENGINE=azure` and add your Document Intelligence endpoint
  and key from the Azure portal (Keys and Endpoint). Create the resource under
  **Document intelligence** / **Form Recognizer** in Azure AI services. Keys stay in
  `.env` only — never commit them.
- To use the **paid** path instead, set `LLM_PROVIDER=openai` (+ `LLM_API_KEY`)
  and/or `STT_PROVIDER=elevenlabs` / `TTS_PROVIDER=elevenlabs`
  (+ `ELEVENLABS_API_KEY`, `ELEVENLABS_TTS_VOICE_ID`).

---

## Ingesting the legal data (when available)

Organize **PDFs or .txt** files in `legal_data/` subfolders (`penal/`, `family/`, etc.).
Text-layer PDFs from [pakistancode.gov.pk](https://pakistancode.gov.pk/) are extracted
with pypdf — **no Azure OCR needed**. See `legal_data/README.md` for download links.

```powershell
# Optional: fetch PPC + family statutes from public URLs
python scripts/download_legal_data.py

# Whole tree (category inferred from subfolder names):
python ingest.py --input .\legal_data --save-text

# A single folder forced to one category:
python ingest.py --input .\legal_data\family --category family

# Rebuild the index from scratch:
python ingest.py --input .\legal_data --reset
```

`--save-text` writes extracted text to `data/ocr_preview/*.txt`. Console shows
`[text-pdf]` when OCR is skipped. Scanned PDFs still use Tesseract or Azure OCR.

---

## Running the API

```powershell
uvicorn app.main:app --reload --port 8000
```

Then open the interactive docs at `http://localhost:8000/docs`.

Quick checks:

```powershell
# Health
curl http://localhost:8000/health

# Ask (works even before data/keys — returns a clear placeholder message)
curl -X POST http://localhost:8000/ask `
  -H "Content-Type: application/json" `
  -d '{"question":"kiraye ka qanoon kya kehta hai?","language":"urdu"}'
```

---

## How the Node backend calls this service

> **Do not modify the backend as part of this task** — this section just documents
> how the hand-off works.

The Node/Express backend has TODO hooks that should call this service:

- `backend/src/controllers/queryController.js` → `generateAnswer`
  should `POST` to **`http://localhost:8000/ask`** with
  `{ "question": "...", "language": "urdu" }` and return the JSON `answer` + `sources`.

- `backend/src/controllers/voiceController.js` → `transcribeAudio`
  should `POST` the uploaded audio (multipart, field name `audio`) to
  **`http://localhost:8000/voice`** and return `{ transcript, answer, language }`.

- Read-aloud (TTS) should `POST` to **`http://localhost:8000/tts`** with
  `{ "text": "...", "language": "urdu" }` and stream back the MP3
  (or use `/tts/base64` to get base64 JSON for the frontend).

Add this to the **backend's** `.env` so the URL isn't hard-coded:

```
NLP_SERVICE_URL=http://localhost:8000
```

…and point the controller TODO hooks at `${NLP_SERVICE_URL}/ask`, `/voice`, `/tts`.

---

## API reference

| Method | Path          | Body                                      | Returns                                  |
|--------|---------------|-------------------------------------------|------------------------------------------|
| GET    | `/health`     | —                                         | status + config snapshot                 |
| POST   | `/ask`        | `{ question, language? }`                 | `{ answer, sources, language }`          |
| POST   | `/voice`      | multipart: `audio` file, `language?`      | `{ transcript, answer, language }`       |
| POST   | `/tts`        | `{ text, language? }`                     | `audio/mpeg` stream                      |
| POST   | `/tts/base64` | `{ text, language? }`                     | `{ audio_base64, mime }`                 |

All endpoints **degrade gracefully**: with no data indexed or no API keys set,
they return a clear informative message instead of crashing.

---

## Blurry scans — tips

CamScanner pages can be noisy, skewed, and low-contrast. `app/services/ocr.py`
already preprocesses each page (grayscale → denoise → deskew → sharpen →
adaptive threshold) to help Tesseract.

If accuracy is still poor on the worst pages:

1. **Raise DPI**: `python ingest.py --input ... --dpi 400` (slower, sharper).
2. **Inspect previews**: run with `--save-text` and read `data/ocr_preview/`.
3. **Switch to Azure OCR**: set `OCR_ENGINE=azure` in `.env` with
   `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` and `AZURE_DOCUMENT_INTELLIGENCE_KEY`.
   Azure `prebuilt-read` is usually faster and more accurate than local Tesseract
   on blurry scans. **Very large PDFs** (e.g. 150–250 MB law books) are automatically
   split into page batches (~75 pages per request) with retries — watch for
   `[azure-ocr] Batch X/Y` progress lines during `ingest.py`. If Azure still fails,
   the pipeline falls back to local Tesseract with a warning.
4. Re-scan the worst source pages at higher quality if you can.

---

## Free tier limits & tips

The default pipeline can run at **$0**, but the free Hugging Face Inference API
has honest trade-offs to be aware of:

- **Rate limits / monthly credits:** free accounts get limited monthly inference
  credits and per-minute rate limits. Heavy use can return `429` / quota errors
  — the service surfaces these as a clear message instead of crashing, so just
  retry after a short wait.
- **Cold starts / availability:** large models can be "cold" or temporarily
  unavailable on the serverless API, returning a 503-style error on first hit.
  Retry, or switch to a smaller model.
- **Switching the LLM model** — edit `HF_LLM_MODEL` in `.env`. Keep
  `HF_LLM_INFERENCE_PROVIDER=auto` for instruct models (the `hf-inference` provider
  is for smaller CPU models and Whisper/TTS, not 7B-class chat models). Fallbacks:
  - `HuggingFaceH4/zephyr-7b-beta`
  - `meta-llama/Llama-3.2-3B-Instruct`
- **TTS format:** `facebook/mms-tts-urd` returns WAV audio bytes; the `/tts`
  endpoint streams them as-is (clients should not assume MP3 specifically).
- **Want higher quality later?** Flip the provider switches in `.env` back to the
  paid path without code changes:
  - `LLM_PROVIDER=openai` (+ `LLM_API_KEY`, `LLM_MODEL`)
  - `STT_PROVIDER=elevenlabs`, `TTS_PROVIDER=elevenlabs`
    (+ `ELEVENLABS_API_KEY`, `ELEVENLABS_TTS_VOICE_ID`)

Configured free defaults: **LLM** = `meta-llama/Llama-3.1-8B-Instruct` (router `auto`),
**STT** = `openai/whisper-large-v3`, **TTS** = `facebook/mms-tts-urd`,
**embeddings** = local `paraphrase-multilingual-MiniLM-L12-v2`.

---

## Honest scope note

- **Speech** (STT + Urdu TTS) and the **LLM answer** run on the free Hugging Face
  Inference API; **OCR, retrieval, and embeddings** run locally. Each is an
  independent, switchable piece.
- The quality of answers depends on OCR accuracy, the embedding model, and the
  chosen LLM — tune each independently.
- This is a **scaffold**: real behaviour activates once you (a) provide the PDF
  data and run `ingest.py`, and (b) set `HF_TOKEN` in `.env` (or switch to a paid
  provider). Until then, endpoints return clear placeholder messages.
