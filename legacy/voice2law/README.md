# Voice2Law - Urdu Legal Assistant Backend

NLP backend for Voice2Law, a voice-based legal assistant system in Urdu language.

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Install System Dependencies

**Poppler** (for PDF to image conversion):
- **Windows**: Download from https://github.com/oschwartz10612/poppler-windows/releases/
- **Mac**: `brew install poppler`
- **Linux**: `sudo apt-get install poppler-utils`

### 3. Set Environment Variables
```bash
cp .env .env.local
# Edit .env.local and add your API keys
export ELEVENLABS_API_KEY=your_key
```

### 4. Place PDF Data
Copy your Criminal Law PDF to:
```
data/raw/criminal_law.pdf
```

## Quick Start

### Extract Text from PDF
```bash
python process_pdf.py data/raw/criminal_law.pdf data/processed
```

This will:
1. Convert PDF pages to images
2. Detect and skip blurry pages
3. Run EasyOCR (Urdu + English) on clear pages
4. Clean extracted text (remove page numbers, headers, footers)
5. Split into 300-500 word chunks with 50-word overlap
6. Save chunks to `data/processed/criminal_law_chunks.json`
7. Save extraction report to `data/processed/extraction_report.json`

### Run Tests
```bash
# Test OCR pipeline
python tests/test_ocr.py

# Test full NLP pipeline
python tests/test_pipeline.py
```

## Project Structure

```
voice2law/
├── data/
│   ├── raw/              # Input PDFs
│   ├── processed/        # Extracted text & chunks
│   └── vectorstore/      # ChromaDB files
├── src/
│   ├── ocr/              # PDF extraction & blur detection
│   │   ├── pdf_extractor.py
│   │   └── blur_detector.py
│   ├── nlp/              # Embeddings, vector store, RAG
│   │   ├── embedder.py
│   │   ├── vectorstore.py
│   │   └── rag_pipeline.py
│   ├── speech/           # STT & TTS
│   │   ├── stt.py
│   │   └── tts.py
│   └── api/              # FastAPI endpoints
│       └── main.py
├── tests/
│   ├── test_ocr.py
│   └── test_pipeline.py
├── process_pdf.py
└── requirements.txt
```

## Usage Examples

### 1. Extract PDF Text
```python
from src.ocr.pdf_extractor import PDFExtractor

extractor = PDFExtractor('data/raw/criminal_law.pdf')
pages = extractor.extract_text()
chunks = extractor.create_chunks(chunk_size=400, overlap=50)
extractor.save_chunks('data/processed/criminal_law_chunks.json')
```

### 2. Create Embeddings & Store
```python
from src.nlp.embedder import Embedder
from src.nlp.vectorstore import VectorStore
import json

with open('data/processed/criminal_law_chunks.json') as f:
    data = json.load(f)

vectorstore = VectorStore()
vectorstore.get_or_create_collection()

for chunk in data['chunks']:
    vectorstore.add_documents(
        texts=[chunk['text']],
        ids=[f"chunk_{chunk['metadata']['global_chunk_index']}"],
        metadatas=[chunk['metadata']]
    )
```

### 3. Query Legal Documents
```python
from src.nlp.embedder import Embedder
from src.nlp.vectorstore import VectorStore
from src.nlp.rag_pipeline import RAGPipeline

vectorstore = VectorStore()
vectorstore.get_or_create_collection()
embedder = Embedder()
rag = RAGPipeline(vectorstore, embedder)

result = rag.answer("طلاق کے بارے میں کیا جاننا چاہیے؟", n_docs=5)
print(result['answer'])
```

## API Endpoints

Start server: `python -m src.api.main`

- `GET /health` - Health check
- `POST /query` - Text-based legal query
- `POST /voice-query` - Audio query (returns text answer)
- `POST /voice-query-with-audio` - Audio query (returns audio answer)
- `GET /vectorstore/stats` - Vectorstore statistics
- `POST /process-pdf` - Ingest PDF into vectorstore

## OCR Pipeline Details

### Features:
- **Blur Detection**: Skips blurry pages using Laplacian variance (threshold: 80)
- **Multi-language OCR**: EasyOCR with Urdu + English support
- **Text Cleaning**: Removes page numbers, headers, footers, extra whitespace
- **Smart Chunking**: 300-500 word chunks with 50-word overlap
- **Metadata Tracking**: Page number, chunk index, source file, category

### Output Files:
- `criminal_law_chunks.json`: Chunks with metadata for vectorization
- `extraction_report.json`: Detailed extraction statistics

## Language Support

- **Input**: Urdu (اردو) - spoken and written
- **OCR**: Urdu + English (EasyOCR)
- **Embeddings**: Multilingual (sentence-transformers)
- **Output**: Urdu text and speech

## Architecture

### OCR → NLP → Speech Flow
1. **OCR**: PDF → Images → EasyOCR → Text
2. **Cleaning**: Remove noise, normalize text
3. **Chunking**: Split into overlapping chunks
4. **Embeddings**: Convert text to vectors
5. **Retrieval**: Find relevant documents
6. **Generation**: LLM generates answer from context
7. **Speech**: Convert answer to Urdu audio

## Troubleshooting

### PDF Processing Issues
- Install Poppler for PDF conversion
- Check PDF file is readable
- Verify Urdu fonts are installed

### EasyOCR Issues
- First run downloads language models (~100MB per language)
- Requires CUDA for GPU acceleration
- CPU mode is slower but works fine for testing

## Next Steps

- [ ] Test with 300-page Criminal Law PDF
- [ ] Fine-tune embeddings for legal domain
- [ ] Add GPT-4 or local LLM for answer generation
- [ ] Expand to Marriage Law + Property Law PDFs
- [ ] Deploy API with React frontend
