# Voice2Law - API Documentation

Complete guide for the Voice2Law FastAPI backend.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env .env.local
# Edit .env and add API keys (optional)
```

### 3. Start Server
```bash
python -m src.api.main
# or
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

Server runs at: `http://localhost:8000`
- API: http://localhost:8000
- Docs: http://localhost:8000/docs (Swagger UI)
- ReDoc: http://localhost:8000/redoc

## Endpoints

### GET /health
Health check - verify server and models are loaded.

**Response:**
```json
{
  "status": "ok",
  "model": "loaded",
  "chunks_indexed": 245,
  "components": {
    "stt": "ready",
    "rag": "ready",
    "tts": "ready",
    "vectorstore": "ready"
  }
}
```

### GET /stats
Get detailed system statistics.

**Response:**
```json
{
  "vectorstore": {
    "collection_name": "criminal_law_chunks",
    "total_documents": 245,
    "embedding_dim": 384,
    "persist_path": "data/vectorstore",
    "model": "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
  },
  "chunks_indexed": 245,
  "models": {
    "stt": "Whisper (base)",
    "rag": "LegalRAG",
    "tts": "ElevenLabs"
  }
}
```

### POST /transcribe
Convert audio file to Urdu text.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `audio` (UploadFile)
- Formats: wav, mp3, m4a, webm, flac

**Example:**
```bash
curl -X POST http://localhost:8000/transcribe \
  -F "audio=@question.webm"
```

**Response:**
```json
{
  "text": "طلاق کے بارے میں کیا ہے؟",
  "success": true
}
```

**Error:**
```json
{
  "error": "transcription failed",
  "success": false
}
```

### POST /query
Query legal knowledge base and get answer.

**Request:**
- Content-Type: `application/json`
- Body: `{"text": "سوال اردو میں", "category": "criminal_law"}`

**Example:**
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"text": "طلاق کے بارے میں کیا ہے؟"}'
```

**Response:**
```json
{
  "answer": "طلاق مسلم فیملی لاء آرڈیننس 1961 کے تحت دی جا سکتی ہے...",
  "source_pages": [10, 15, 20],
  "confidence": 0.8234,
  "category": "criminal_law",
  "success": true
}
```

### POST /speak
Convert Urdu text to speech (audio file).

**Request:**
- Content-Type: `application/json`
- Body: `{"text": "متن"}`

**Example:**
```bash
curl -X POST http://localhost:8000/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "جواب"}' \
  --output answer.mp3
```

**Response:**
- Content-Type: `audio/mpeg`
- Body: Binary MP3 audio file

**Error (if TTS not configured):**
```json
{
  "detail": "TTS not available (no API key configured)"
}
```

### POST /voice-query ⭐ (MAIN ENDPOINT)
Complete voice interaction pipeline:
1. Transcribe audio (STT)
2. Query knowledge base (RAG)
3. Generate speech (TTS)

**Request:**
- Content-Type: `multipart/form-data`
- Field: `audio` (UploadFile)

**Example:**
```bash
curl -X POST http://localhost:8000/voice-query \
  -F "audio=@question.webm"
```

**Response:**
```json
{
  "question_text": "سوال اردو میں",
  "answer_text": "جواب اردو میں",
  "audio_base64": "SUQzBAAAAAAAI1...",
  "source_pages": [12, 45],
  "confidence": 0.87,
  "success": true
}
```

**Notes:**
- `audio_base64`: Base64-encoded MP3 audio (if TTS available)
- If TTS not configured: `audio_base64` will be empty string
- Frontend can decode and play: `const audio = new Audio('data:audio/mp3;base64,' + audio_base64)`

### POST /process-pdf (Admin)
Process and ingest a new PDF into vectorstore.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (UploadFile)

**Example:**
```bash
curl -X POST http://localhost:8000/process-pdf \
  -F "file=@marriage_law.pdf"
```

**Response:**
```json
{
  "status": "success",
  "filename": "marriage_law.pdf",
  "pages_processed": 250,
  "chunks_created": 125,
  "chunks_ingested": 125,
  "total_chunks_in_store": 370
}
```

## Client Examples

### Python Client

```python
import requests
import base64

BASE_URL = "http://localhost:8000"

class Voice2LawClient:
    def __init__(self, base_url=BASE_URL):
        self.base_url = base_url

    def health(self):
        """Check server status."""
        response = requests.get(f"{self.base_url}/health")
        return response.json()

    def transcribe(self, audio_file_path):
        """Transcribe audio to text."""
        with open(audio_file_path, "rb") as f:
            files = {"audio": f}
            response = requests.post(f"{self.base_url}/transcribe", files=files)
        return response.json()

    def query(self, text, category="criminal_law"):
        """Query knowledge base."""
        data = {"text": text, "category": category}
        response = requests.post(
            f"{self.base_url}/query",
            json=data
        )
        return response.json()

    def speak(self, text, output_file=None):
        """Convert text to speech."""
        data = {"text": text}
        response = requests.post(
            f"{self.base_url}/speak",
            json=data
        )

        if response.status_code == 200:
            if output_file:
                with open(output_file, "wb") as f:
                    f.write(response.content)
            return response.content
        else:
            return None

    def voice_query(self, audio_file_path):
        """Complete voice interaction."""
        with open(audio_file_path, "rb") as f:
            files = {"audio": f}
            response = requests.post(f"{self.base_url}/voice-query", files=files)
        return response.json()

# Usage
client = Voice2LawClient()

# Check health
health = client.health()
print(f"Server status: {health['status']}")

# Query
result = client.query("طلاق کے بارے میں کیا ہے؟")
print(f"Answer: {result['answer']}")

# Voice query (full pipeline)
voice_result = client.voice_query("question.webm")
print(f"Question: {voice_result['question_text']}")
print(f"Answer: {voice_result['answer_text']}")

# Play audio
import base64
audio_bytes = base64.b64decode(voice_result['audio_base64'])
with open("answer.mp3", "wb") as f:
    f.write(audio_bytes)
```

### JavaScript/React Client

```javascript
const API_BASE = "http://localhost:8000";

class Voice2LawClient {
  async health() {
    const response = await fetch(`${API_BASE}/health`);
    return await response.json();
  }

  async query(text, category = "criminal_law") {
    const response = await fetch(`${API_BASE}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, category })
    });
    return await response.json();
  }

  async transcribe(audioBlob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");

    const response = await fetch(`${API_BASE}/transcribe`, {
      method: "POST",
      body: formData
    });
    return await response.json();
  }

  async speak(text) {
    const response = await fetch(`${API_BASE}/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    return await response.arrayBuffer();
  }

  async voiceQuery(audioBlob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");

    const response = await fetch(`${API_BASE}/voice-query`, {
      method: "POST",
      body: formData
    });
    return await response.json();
  }
}

// React Hook Usage
import { useState } from "react";

function VoiceAssistant() {
  const [isRecording, setIsRecording] = useState(false);
  const [response, setResponse] = useState(null);
  const client = new Voice2LawClient();

  async function handleVoiceQuery(audioBlob) {
    try {
      setIsRecording(true);
      const result = await client.voiceQuery(audioBlob);

      setResponse(result);

      if (result.audio_base64) {
        // Play audio response
        const audio = new Audio(
          `data:audio/mp3;base64,${result.audio_base64}`
        );
        audio.play();
      }
    } catch (error) {
      console.error("Voice query failed:", error);
    } finally {
      setIsRecording(false);
    }
  }

  return (
    <div>
      <h1>Voice2Law Assistant</h1>
      {response && (
        <div>
          <p>Q: {response.question_text}</p>
          <p>A: {response.answer_text}</p>
          <p>Confidence: {response.confidence.toFixed(4)}</p>
        </div>
      )}
      <button onClick={() => recordAndQuery()}>
        🎤 Ask a Question
      </button>
    </div>
  );
}
```

### cURL Examples

```bash
# Health check
curl http://localhost:8000/health

# Stats
curl http://localhost:8000/stats

# Query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "text": "طلاق کے بارے میں کیا جاننا چاہیے؟",
    "category": "criminal_law"
  }'

# Transcribe
curl -X POST http://localhost:8000/transcribe \
  -F "audio=@test_audio.webm"

# Speak
curl -X POST http://localhost:8000/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "السلام علیکم"}' \
  --output answer.mp3

# Voice Query (full pipeline)
curl -X POST http://localhost:8000/voice-query \
  -F "audio=@question.webm" \
  | jq .
```

## Error Handling

### Common Errors

**503 Service Unavailable**
```json
{
  "detail": "STT not available"
}
```
- Whisper model not loaded
- Check startup logs

**503 TTS Not Configured**
```json
{
  "detail": "TTS not available (no API key configured)"
}
```
- Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env

**500 Internal Server Error**
```json
{
  "detail": "Error message details..."
}
```
- Check server logs for detailed error

### Logging

Server logs all requests with timestamps:
```
2024-05-30 10:15:23 - INFO - [2024-05-30T10:15:23.123456] POST /query - Text: طلاق کے...
2024-05-30 10:15:24 - INFO -   ✓ Found answer with confidence: 0.8234
```

## Performance

### Response Times (Typical)

- **GET /health**: < 10ms
- **POST /transcribe**: 2-5 seconds (Whisper processing)
- **POST /query**: 100-200ms (embedding + retrieval)
- **POST /speak**: 1-3 seconds (ElevenLabs API)
- **POST /voice-query**: 4-10 seconds (total pipeline)

### Optimization Tips

1. **Caching**: Vectorstore loads on startup (not per request)
2. **Batch processing**: Reuse components across requests
3. **Audio quality**: Better audio = faster, more accurate transcription
4. **Model size**: "base" is recommended for balance

## Deployment

### Production Checklist

- [ ] Set appropriate CORS origins (not `*`)
- [ ] Add authentication/API keys
- [ ] Use HTTPS/SSL
- [ ] Configure logging
- [ ] Set proper resource limits
- [ ] Use process manager (gunicorn, systemd)
- [ ] Monitor GPU memory (if using CUDA)

### Docker Deployment

```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t voice2law .
docker run -p 8000:8000 voice2law
```

## Troubleshooting

### Server won't start
- Check if port 8000 is in use
- Check Python path and imports
- Review startup logs

### Poor response quality
- Ensure vectorstore is properly indexed
- Check audio quality
- Try different query phrasing

### Memory issues
- Use smaller Whisper model (tiny)
- Reduce chunk retrieval number
- Monitor process memory usage

## Next Steps

- [ ] Integrate with React frontend
- [ ] Add authentication
- [ ] Deploy to production
- [ ] Monitor performance
- [ ] Add more legal domains (Marriage Law, Property Law)
