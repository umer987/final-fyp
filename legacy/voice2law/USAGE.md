# Voice2Law - Usage Guide

Complete guide for using the Voice2Law backend system.

## Prerequisites

1. **Python 3.9+**
2. **Poppler** (for PDF conversion):
   - **Windows**: https://github.com/oschwartz10612/poppler-windows/releases/
   - **Mac**: `brew install poppler`
   - **Linux**: `sudo apt-get install poppler-utils`

3. **Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Full Workflow

### 1. Extract Text from PDF

Extract text from your Criminal Law PDF with blur detection and OCR:

```bash
python process_pdf.py data/raw/criminal_law.pdf data/processed
```

**What happens:**
- Converts each PDF page to image
- Detects blurry pages (skips them)
- Runs EasyOCR (Urdu + English) on clear pages
- Cleans text (removes page numbers, headers, footers)
- Splits into 300-500 word chunks with 50-word overlap
- Saves `data/processed/criminal_law_chunks.json`
- Saves `data/processed/extraction_report.json`

**Output files:**
```
data/processed/
├── criminal_law_chunks.json      # Chunks with metadata for vectorization
└── extraction_report.json         # Statistics and page-by-page details
```

### 2. Create Embeddings & Index

Ingest chunks into ChromaDB vector database:

```bash
python ingest_chunks.py data/processed/criminal_law_chunks.json data/vectorstore
```

**What happens:**
- Loads chunks from JSON
- Creates embeddings using multilingual sentence-transformer
- Stores in ChromaDB with metadata
- Shows progress bar
- Tests search functionality

**Output:**
- `data/vectorstore/` — Persistent ChromaDB database

### 3. Query the System

#### Option A: Python (Local Queries)

```python
from src.nlp.embedder import UrduEmbedder
from src.nlp.vectorstore import VectorStore
from src.nlp.rag_pipeline import RAGPipeline

# Initialize
embedder = UrduEmbedder()
vectorstore = VectorStore()
vectorstore.get_or_create_collection()

rag = RAGPipeline(vectorstore=vectorstore, embedder=embedder)

# Query
query = "طلاق کے بارے میں کیا جاننا چاہیے؟"
result = rag.answer(query, n_docs=5)

print(f"Query: {query}")
print(f"Retrieved: {len(result['retrieved_documents'])} documents")
print(f"Answer: {result['answer']}")
```

#### Option B: API Server

Start the FastAPI server:

```bash
python -m src.api.main
# Server runs at http://localhost:8000
```

**Test endpoints:**

```bash
# Health check
curl http://localhost:8000/health

# Text query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"text": "طلاق کے بارے میں کیا جاننا چاہیے؟"}'

# Stats
curl http://localhost:8000/vectorstore/stats
```

## Testing

### Run All Tests

```bash
# OCR tests
python tests/test_ocr.py

# Embedding & Vector Store tests
python tests/test_embeddings.py

# End-to-End test
python test_e2e.py
```

### End-to-End Demo

Complete pipeline demo with mock data:

```bash
python test_e2e.py
```

This shows:
- Creating chunks
- Embedding
- Ingesting into vectorstore
- Running multiple queries
- Retrieving relevant documents

## Python API Examples

### 1. Direct PDF Processing

```python
from src.ocr.pdf_extractor import PDFExtractor

# Extract text from PDF
extractor = PDFExtractor('data/raw/criminal_law.pdf')
pages = extractor.extract_text()  # Extracts with blur detection

# Create chunks
chunks = extractor.create_chunks(
    chunk_size=400,      # 300-500 words
    overlap=50,          # 50 word overlap
    category='criminal_law'
)

# Save
extractor.save_chunks('data/processed/criminal_law_chunks.json')
report = extractor.save_extraction_report('data/processed/extraction_report.json')
```

### 2. Manual Vectorization

```python
from src.nlp.embedder import UrduEmbedder
from src.nlp.vectorstore import VectorStore
import json

# Load chunks
with open('data/processed/criminal_law_chunks.json') as f:
    data = json.load(f)

# Create embeddings
embedder = UrduEmbedder()
vectorstore = VectorStore()
vectorstore.get_or_create_collection()

# Ingest
stats = vectorstore.ingest_chunks('data/processed/criminal_law_chunks.json')
print(f"Ingested {stats['total_ingested']} chunks")

# Search
results = vectorstore.search("طلاق کے بارے میں", n_results=3)
for result in results:
    print(f"Score: {result['score']:.4f}, Page: {result['page_number']}")
    print(f"Text: {result['text'][:100]}...")
```

### 3. RAG Pipeline

```python
from src.nlp.rag_pipeline import RAGPipeline
from src.nlp.embedder import UrduEmbedder
from src.nlp.vectorstore import VectorStore

# Initialize
embedder = UrduEmbedder()
vectorstore = VectorStore()
vectorstore.get_or_create_collection()

rag = RAGPipeline(vectorstore=vectorstore, embedder=embedder)

# Single query
result = rag.answer(
    "شاہ رہے عدالت میں کیا کریں؟",
    n_docs=5
)

print("Query:", result['query'])
print("Retrieved:", len(result['retrieved_documents']), "documents")
print("Scores:", result['scores'])
print("Context:", result['context'])
print("Answer:", result['answer'])
```

### 4. Embedding Examples

```python
from src.nlp.embedder import UrduEmbedder

embedder = UrduEmbedder()

# Single text
text1 = "طلاق کے بارے میں"
embedding = embedder.embed_text(text1)
print(f"Embedding dimension: {len(embedding)}")

# Batch processing
texts = [
    "طلاق کے بارے میں",
    "عدالت میں شکایت",
    "قانونی حقوق"
]
embeddings = embedder.embed_batch(texts)
print(f"Batch: {len(texts)} texts -> {len(embeddings)} embeddings")

# Similarity
sim = embedder.similarity(
    "طلاق کے بارے میں",
    "نکاح کے بعد طلاق"
)
print(f"Similarity: {sim:.4f}")
```

## Output Examples

### Chunks JSON Format

```json
{
  "source_file": "criminal_law.pdf",
  "total_pages": 300,
  "pages_extracted": 298,
  "pages_skipped": 2,
  "total_chunks": 75,
  "chunks": [
    {
      "text": "مسلم فیملی لاء آرڈیننس 1961 میں طلاق کی تعریف: طلاق ایک قانونی عمل ہے...",
      "metadata": {
        "page_number": 10,
        "chunk_index": 0,
        "global_chunk_index": 0,
        "source_file": "criminal_law.pdf",
        "category": "criminal_law",
        "word_count": 45
      }
    }
  ],
  "statistics": {
    "avg_chunk_words": 420,
    "total_words": 31500,
    "skipped_pages": [105, 250]
  }
}
```

### Search Result Example

```python
{
  'text': 'مسلم فیملی لاء میں طلاق کی تعریف...',
  'page_number': 10,
  'chunk_index': 0,
  'global_chunk_index': 0,
  'category': 'criminal_law',
  'score': 0.8234,
  'source': 'criminal_law.pdf'
}
```

### RAG Answer Example

```python
{
  'query': 'طلاق کے بارے میں کیا جاننا چاہیے؟',
  'retrieved_documents': [
    'مسلم فیملی لاء میں طلاق...',
    'طلاق کے بعد حقوق...',
    'طلاق کے قانونی اثرات...'
  ],
  'scores': [0.82, 0.79, 0.75],
  'context': '[دستاویز 1]\n...\n\n---\n\n[دستاویز 2]\n...',
  'answer': 'دستاویزات سے حاصل کی گئی معلومات:\n\n[دستاویز 1]...'
}
```

## File Structure

```
voice2law/
├── data/
│   ├── raw/
│   │   └── criminal_law.pdf      # Input PDF
│   ├── processed/
│   │   ├── criminal_law_chunks.json
│   │   └── extraction_report.json
│   └── vectorstore/
│       ├── chroma.sqlite3
│       └── ... (ChromaDB files)
├── src/
│   ├── ocr/
│   │   ├── pdf_extractor.py
│   │   └── blur_detector.py
│   ├── nlp/
│   │   ├── embedder.py
│   │   ├── vectorstore.py
│   │   └── rag_pipeline.py
│   ├── speech/
│   │   ├── stt.py
│   │   └── tts.py
│   └── api/
│       └── main.py
├── tests/
│   ├── test_ocr.py
│   ├── test_embeddings.py
│   └── test_pipeline.py
├── process_pdf.py
├── ingest_chunks.py
├── test_e2e.py
└── requirements.txt
```

## Troubleshooting

### PDF Processing

**Issue: "Poppler not found"**
- Install Poppler: https://github.com/oschwartz10612/poppler-windows/releases/
- Add to PATH (Windows)

**Issue: "EasyOCR: No module named"**
- `pip install easyocr`
- First run downloads language models (~100MB)

**Issue: "No text extracted"**
- Check PDF quality
- Verify Urdu fonts installed
- Test with different PDF

### Vector Store

**Issue: "Collection not found"**
- Make sure you've run `ingest_chunks.py` first
- Check `data/vectorstore/` exists

**Issue: "Poor search results"**
- Increase `n_results` in search
- Check embedding quality
- Verify chunks are meaningful

### API

**Issue: "Connection refused"**
- Start server: `python -m src.api.main`
- Check port 8000 is not in use
- Use `curl localhost:8000/health` to test

## Next Steps

- [ ] Test with actual Criminal Law PDF
- [ ] Fine-tune embeddings for legal domain
- [ ] Add LLM integration (GPT-4 or local model)
- [ ] Integrate with React frontend
- [ ] Add voice input/output (Whisper + ElevenLabs)
- [ ] Expand to Marriage Law + Property Law PDFs
