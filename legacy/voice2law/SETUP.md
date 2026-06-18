# Voice2Law - Complete Setup Guide

End-to-end setup instructions for Voice2Law NLP backend.

## System Requirements

- **Python**: 3.10 or higher
- **OS**: Windows, Mac, Linux
- **RAM**: 8GB minimum (16GB recommended)
- **Disk**: 5GB free space (for models and data)
- **Internet**: For downloading models on first run

## Pre-Installation

### 1. Install System Dependencies

#### Windows
```powershell
# Install Poppler (required for PDF to image conversion)
# Option A: Using Chocolatey
choco install poppler

# Option B: Manual download
# https://github.com/oschwartz10612/poppler-windows/releases/
# Add to PATH
```

#### Mac
```bash
brew install poppler
```

#### Linux
```bash
sudo apt-get update
sudo apt-get install -y poppler-utils
```

### 2. Verify Python Version
```bash
python --version  # Should be 3.10+
pip --version
```

## Installation Steps

### Step 1: Install Python Dependencies

```bash
cd voice2law

# Install all required packages
pip install -r requirements.txt
```

This will install:
- **EasyOCR** — PDF text extraction (Urdu support)
- **Sentence-Transformers** — Multilingual embeddings
- **ChromaDB** — Vector database
- **Whisper** — Speech-to-text
- **FastAPI** — Web API framework
- **And more...**

⏱️ **First install takes 5-10 minutes** (downloading models from HuggingFace)

### Step 2: Configure Environment

```bash
# Copy .env template
cp .env .env.local

# Edit .env.local and add your API keys
nano .env  # or use your editor
```

**Minimal .env** (for testing):
```env
# Optional - only needed if you want speech output
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here

# Optional - only for Claude API integration
ANTHROPIC_API_KEY=your_key_here
```

### Step 3: Prepare Data

Place your Criminal Law PDF at:
```
voice2law/data/raw/criminal_law.pdf
```

## Execution Steps

### Run Order

Execute these steps in sequence:

#### Step 1️⃣ : Extract PDF and Create Chunks

```bash
python process_pdf.py data/raw/criminal_law.pdf data/processed
```

**What happens:**
- Converts PDF pages to images
- Detects and skips blurry pages
- Runs EasyOCR on clear pages (Urdu + English)
- Cleans text (removes noise)
- Splits into 300-500 word chunks with 50-word overlap
- Saves to `data/processed/criminal_law_chunks.json`
- Saves report to `data/processed/extraction_report.json`

**Expected output:**
```
Processing PDF: data/raw/criminal_law.pdf
Converting PDF to images: data/raw/criminal_law.pdf
Processing 300 pages...
  Page 1: Running OCR (blur_score=120.45)...
    ✓ Extracted 450 characters
  ...
Extraction complete: 298 pages extracted, 2 skipped

Created 150 chunks from 298 pages
✓ Chunks saved to: data/processed/criminal_law_chunks.json
✓ Report saved to: data/processed/extraction_report.json
```

**Time estimate:** 30-60 minutes (depends on PDF quality and your CPU)

#### Step 2️⃣ : Ingest Chunks into Vector Database

```bash
python ingest_chunks.py data/processed/criminal_law_chunks.json data/vectorstore
```

**What happens:**
- Loads chunks from JSON
- Creates embeddings using multilingual sentence-transformer
- Stores in ChromaDB (persistent at `data/vectorstore/`)
- Shows progress bar
- Tests search functionality

**Expected output:**
```
Loading Whisper model: base
✓ Whisper base loaded

Loading embedder model: sentence-transformers/paraphrase-multilingual-mpnet-base-v2
✓ Model loaded. Embedding dimension: 384

Loading chunks from: data/processed/criminal_law_chunks.json
Found 150 chunks to ingest

Creating embeddings...
Embedding chunks: 100%|████████| 5/5 [00:45<00:00, 9.00s/batch]

Adding to ChromaDB...

✓ Ingestion complete!
  Total chunks: 150
  Ingested: 150
  Embedding dimension: 384

Test query: طلاق کے بارے میں
Found 3 results:
  - Score: 0.8234, Page: 10
  - Score: 0.7891, Page: 15
  - Score: 0.7456, Page: 20
```

**Time estimate:** 2-5 minutes

#### Step 3️⃣ : Start FastAPI Server

```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

Or using Python:
```bash
python -m src.api.main
```

**Expected output:**
```
======================================================================
VOICE2LAW API - STARTUP
======================================================================
Loading Whisper STT model...
✓ STT loaded

Loading embedder...
✓ Embedder loaded

Loading vectorstore...
✓ Vectorstore loaded (150 chunks)

Initializing RAG pipeline...
✓ RAG pipeline ready

Initializing TTS...
✓ TTS loaded (ElevenLabs)

======================================================================
✓ Server startup complete - ready to accept requests
======================================================================

INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

**Server is now running!** 🚀

### Testing

#### Option A: Web Browser

Open: http://localhost:8000/docs

Interactive API documentation with "Try it out" buttons.

#### Option B: cURL

```bash
# Health check
curl http://localhost:8000/health

# Simple query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"text":"چوری کی سزا کیا ہے","category":"criminal_law"}'

# Expected response:
# {
#   "answer": "چوری کی سزا... (answer from knowledge base)",
#   "source_pages": [10, 15],
#   "confidence": 0.87,
#   "category": "criminal_law",
#   "success": true
# }
```

#### Option C: Python Client

```python
import requests

client = requests.Session()

# Query
response = client.post(
    "http://localhost:8000/query",
    json={"text": "چوری کی سزا کیا ہے"}
)
result = response.json()
print(f"Answer: {result['answer']}")
print(f"Confidence: {result['confidence']}")
```

#### Option D: Run Demo

```bash
python demo_rag.py      # RAG pipeline demo
python demo_voice.py    # Voice pipeline demo
python test_e2e.py      # End-to-end test
```

## Project Structure

```
voice2law/
├── data/
│   ├── raw/
│   │   └── criminal_law.pdf          # Input PDF
│   ├── processed/
│   │   ├── criminal_law_chunks.json   # Chunks with metadata
│   │   └── extraction_report.json     # Extraction statistics
│   └── vectorstore/
│       ├── chroma.sqlite3
│       └── ... (ChromaDB files)
├── src/
│   ├── __init__.py
│   ├── ocr/
│   │   ├── __init__.py
│   │   ├── pdf_extractor.py          # PDF → chunks
│   │   └── blur_detector.py          # Blur detection
│   ├── nlp/
│   │   ├── __init__.py
│   │   ├── embedder.py               # Text → embeddings
│   │   ├── vectorstore.py            # ChromaDB wrapper
│   │   └── rag_pipeline.py           # RAG logic
│   ├── speech/
│   │   ├── __init__.py
│   │   ├── stt.py                    # Audio → text (Whisper)
│   │   └── tts.py                    # Text → audio (ElevenLabs)
│   └── api/
│       ├── __init__.py
│       └── main.py                   # FastAPI endpoints
├── tests/
│   ├── test_ocr.py
│   ├── test_embeddings.py
│   ├── test_rag.py
│   └── test_speech.py
├── process_pdf.py
├── ingest_chunks.py
├── demo_rag.py
├── demo_voice.py
├── test_e2e.py
├── requirements.txt
├── .env
├── README.md
├── USAGE.md
├── SPEECH.md
├── RAG.md
└── API.md
```

## Important Notes

### ✅ Free & Local (No Paid APIs Required)

- ✅ **Whisper STT** — Local model, completely free
- ✅ **Sentence-Transformers** — Local model, completely free
- ✅ **ChromaDB** — Local database, completely free
- ✅ **EasyOCR** — Local model, completely free

### ⚠️ Optional (Paid API)

- **ElevenLabs TTS** — Optional (free tier available)
- **Claude API** — Optional (for better answer generation)

### 🔧 Technical Details

- **Models auto-download** on first run from HuggingFace
- **No internet needed** after first run (except TTS/API calls)
- **All data stored locally** (no cloud required)
- **Models cached** in `~/.cache/huggingface/`

### 📊 Performance Tips

1. **First run slow?** Models are downloading (5-10GB total)
2. **PDF extraction slow?** Try smaller PDF or use smaller model
3. **Embedding slow?** Normal for 300+ pages (2-5 minutes)
4. **Want faster?** Use GPU: `pip install torch torchvision torchaudio`

### 🐛 Troubleshooting

**"ModuleNotFoundError"**
```bash
# Reinstall all dependencies
pip install --upgrade -r requirements.txt
```

**"Poppler not found"**
- Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases/
- Mac: `brew install poppler`
- Linux: `sudo apt-get install poppler-utils`

**"CUDA not found" (when using GPU)**
- This is fine, will use CPU (slower but works)
- GPU is optional

**"Port 8000 already in use"**
```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8001  # Use different port
```

## Quick Reference

```bash
# Complete setup from scratch
pip install -r requirements.txt
python process_pdf.py data/raw/criminal_law.pdf data/processed
python ingest_chunks.py data/processed/criminal_law_chunks.json
uvicorn src.api.main:app --host 0.0.0.0 --port 8000

# Test API
curl http://localhost:8000/health
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"text":"چوری کی سزا کیا ہے"}'

# View API docs
open http://localhost:8000/docs
```

## Documentation Files

- **README.md** — Project overview
- **USAGE.md** — End-to-end usage guide
- **SPEECH.md** — Speech pipeline (STT/TTS)
- **RAG.md** — RAG pipeline and question answering
- **API.md** — API reference and client examples

## Environment Variables

```env
# Optional - for speech synthesis
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=your_voice_id

# Optional - for Claude API fallback
ANTHROPIC_API_KEY=sk-ant-...
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Extract PDF
3. ✅ Ingest chunks
4. ✅ Start API server
5. ✅ Test endpoints
6. → **Integrate with React frontend**
7. → Deploy to production

## Support

All documentation is in the `.md` files:
- Questions about usage? → `USAGE.md`
- Questions about speech? → `SPEECH.md`
- Questions about RAG? → `RAG.md`
- Questions about API? → `API.md`

## Version Info

- Python: 3.10+
- Whisper: Latest (local model)
- Sentence-Transformers: 2.2.2
- ChromaDB: 0.4.21
- FastAPI: 0.104.1

---

**Ready to start?** Follow the "Execution Steps" section above! 🚀
