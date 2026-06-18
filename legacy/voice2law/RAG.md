# LegalRAG - Question Answering Pipeline

Complete guide for the RAG (Retrieval-Augmented Generation) question answering system.

## Overview

LegalRAG answers legal questions in Urdu using two approaches:

1. **Extractive QA** (Default, No Cost)
   - Retrieves top 3 relevant chunks from vectorstore
   - Returns the most relevant chunk as the answer
   - Fast, no API costs, suitable for FYP testing
   - Confidence score shows how relevant the answer is

2. **Claude API** (Optional, Better Quality)
   - Sends retrieved context to Claude 3.5 Sonnet
   - Claude generates a natural answer based on context
   - Better quality but requires API key and costs money
   - Falls back to extractive if API unavailable

## Quick Usage

### Python (Extractive)

```python
from src.nlp.rag_pipeline import LegalRAG

rag = LegalRAG()
result = rag.answer("طلاق کے بارے میں کیا جاننا چاہیے؟")

print(result['answer'])
print(f"Confidence: {result['confidence']:.4f}")
print(f"Pages: {result['source_pages']}")
```

### With Claude API

Set ANTHROPIC_API_KEY in .env first:
```python
result = rag.answer("طلاق کے بارے میں کیا جاننا چاہیے؟", use_llm=True)
print(result['answer'])
```

### CLI Demo

```bash
python demo_rag.py
```

Tests multiple queries with both approaches.

### Test Suite

```bash
python tests/test_rag.py
```

## API Reference

### LegalRAG Class

```python
from src.nlp.rag_pipeline import LegalRAG
from src.nlp.embedder import UrduEmbedder
from src.nlp.vectorstore import VectorStore

# Initialize (auto-loads vectorstore)
rag = LegalRAG()

# Or with custom components
embedder = UrduEmbedder()
vectorstore = VectorStore()
vectorstore.get_or_create_collection()
rag = LegalRAG(vectorstore=vectorstore, embedder=embedder)
```

### Methods

#### `answer(question, use_llm=False, n_results=3) -> dict`

Main method for answering questions.

**Args:**
- `question` (str): Question in Urdu
- `use_llm` (bool): Use Claude API if available (default: False)
- `n_results` (int): Number of chunks to retrieve (default: 3)

**Returns:**
```python
{
    'question': 'طلاق کے بارے میں کیا ہے؟',
    'answer': 'طلاق مسلم فیملی لاء آرڈیننس 1961 کے تحت...',
    'source_pages': [10, 15, 20],
    'confidence': 0.8234,
    'category': 'criminal_law',
    'approach': 'extractive',
    'retrieved_chunks': 3
}
```

**Example:**
```python
result = rag.answer("طلاق کے بارے میں کیا جاننا چاہیے؟")
print(f"Answer: {result['answer']}")
print(f"Score: {result['confidence']:.4f}")
print(f"From pages: {result['source_pages']}")
```

#### `retrieve(question, n_results=3) -> list`

Retrieve relevant chunks without generating answer.

**Returns:** List of chunk dicts with text, page_number, score, category

**Example:**
```python
chunks = rag.retrieve("مہر کیا ہے؟", n_results=2)
for chunk in chunks:
    print(f"Page {chunk['page_number']}: {chunk['text']}")
```

#### `format_context(chunks) -> str`

Format retrieved chunks as readable context.

**Args:**
- `chunks` (list): List of chunk dicts or text strings

**Returns:** Formatted string with "قانونی معلومات:" header

**Example:**
```python
chunks = rag.retrieve("طلاق", n_results=3)
context = rag.format_context([c['text'] for c in chunks])
print(context)
```

#### `answer_extractive(question, n_results=3) -> dict`

Direct extractive QA (used internally by `answer()` with `use_llm=False`).

#### `answer_with_claude(question, context) -> dict`

Generate answer using Claude API (requires ANTHROPIC_API_KEY).

**Requires:** `pip install anthropic`

## Response Structure

### Extractive Response

```python
{
    'question': 'User query in Urdu',
    'answer': 'The most relevant chunk text',
    'source_pages': [10, 15, 20],
    'confidence': 0.8234,  # Similarity score 0-1
    'category': 'criminal_law',
    'approach': 'extractive',
    'method': 'top_chunk',
    'retrieved_chunks': 3,
    'context_used': 'Full formatted context'
}
```

### Claude API Response

```python
{
    'question': 'User query in Urdu',
    'answer': 'Claude generated answer in Urdu',
    'approach': 'claude_api',
    'model': 'claude-3-5-sonnet-20241022',
    'tokens_used': 345,
    'source_pages': [10, 15],
    'confidence': 0.82,
    'category': 'criminal_law'
}
```

## Workflow Example

### Step 1: Setup

```python
from src.nlp.rag_pipeline import LegalRAG
from src.nlp.embedder import UrduEmbedder
from src.nlp.vectorstore import VectorStore

# Initialize components
embedder = UrduEmbedder()
vectorstore = VectorStore()
vectorstore.get_or_create_collection()

# Ingest chunks (from Step 2)
vectorstore.ingest_chunks('data/processed/criminal_law_chunks.json')

# Create RAG
rag = LegalRAG(vectorstore=vectorstore, embedder=embedder)
```

### Step 2: Answer Questions

```python
# Multiple queries
queries = [
    "طلاق کے بارے میں کیا ہے؟",
    "مہر کی تعریف کریں۔",
    "بچوں کی کسٹڈی کا کیا قانون ہے؟"
]

for query in queries:
    result = rag.answer(query)
    print(f"Q: {query}")
    print(f"A: {result['answer'][:200]}...")
    print(f"Confidence: {result['confidence']:.4f}\n")
```

### Step 3: With Claude API (Optional)

```python
# Set ANTHROPIC_API_KEY in .env first
result = rag.answer(query, use_llm=True)  # Uses Claude
print(f"Claude Answer: {result['answer']}")
print(f"Tokens Used: {result['tokens_used']}")
```

## Configuration

### Environment Variables

```bash
# .env file
ANTHROPIC_API_KEY=sk-...  # Optional, for Claude API
```

### Performance Tuning

```python
# Retrieve more chunks for better context
result = rag.answer(query, n_results=5)

# Retrieve fewer for speed
result = rag.answer(query, n_results=2)

# Direct extractive (always)
result = rag.answer_extractive(query, n_results=3)
```

## Testing & Demo

### Run Tests

```bash
python tests/test_rag.py
```

Tests:
- Context formatting
- Extractive QA
- Retrieval
- Multiple queries
- Edge cases (empty vectorstore)

### Run Demo

```bash
python demo_rag.py
```

Interactive demo with:
- 5 sample questions
- Extractive results
- Claude API results (if configured)
- Vector store statistics
- Context formatting example

## Troubleshooting

### "Collection not found"
- Make sure you've run Step 2: `ingest_chunks.py`
- Check `data/vectorstore/` exists

### "No results"
- Try different query phrasing
- Increase `n_results` parameter
- Check if chunks were ingested successfully

### Claude API errors
- Verify ANTHROPIC_API_KEY is set
- Check API quota and rate limits
- Falls back to extractive automatically

### Poor answer quality
- Extractive uses only top chunk
- Try Claude API for better quality
- Improve source PDF quality
- Add more relevant chunks

## Next Steps

- [ ] Integration with speech (Whisper + ElevenLabs)
- [ ] Fine-tune embeddings for legal domain
- [ ] Add user feedback mechanism
- [ ] Expand to more legal domains
- [ ] Cache frequent queries
- [ ] Add multi-turn conversation support
