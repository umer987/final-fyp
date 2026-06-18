import logging
import base64
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ocr.pdf_extractor import PDFExtractor
from nlp.embedder import UrduEmbedder
from nlp.vectorstore import VectorStore
from nlp.rag_pipeline import LegalRAG
from speech.stt import UrduSTT
from speech.tts import UrduTTS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Request/Response models
class QueryRequest(BaseModel):
    text: str
    category: str = "criminal_law"

class SpeakRequest(BaseModel):
    text: str

class VoiceQueryResponse(BaseModel):
    question_text: str
    answer_text: str
    audio_base64: str
    source_pages: list
    confidence: float
    success: bool

# Global state
app_state = {
    'stt': None,
    'rag': None,
    'tts': None,
    'vectorstore': None,
    'chunks_indexed': 0
}

# Create FastAPI app
app = FastAPI(
    title="Voice2Law API",
    description="Urdu voice-based legal assistant backend",
    version="1.0.0"
)

# Enable CORS for all origins (development mode)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Load models and vectorstore on server startup."""
    logger.info("=" * 70)
    logger.info("VOICE2LAW API - STARTUP")
    logger.info("=" * 70)

    try:
        # 1. Initialize STT
        logger.info("Loading Whisper STT model...")
        app_state['stt'] = UrduSTT(model_size="base")
        logger.info("✓ STT loaded")

        # 2. Initialize embedder and vectorstore
        logger.info("Loading embedder...")
        embedder = UrduEmbedder()
        logger.info("✓ Embedder loaded")

        logger.info("Loading vectorstore...")
        vectorstore = VectorStore()
        vectorstore.get_or_create_collection()
        app_state['vectorstore'] = vectorstore
        stats = vectorstore.get_stats()
        app_state['chunks_indexed'] = stats.get('total_documents', 0)
        logger.info(f"✓ Vectorstore loaded ({app_state['chunks_indexed']} chunks)")

        # 3. Initialize RAG
        logger.info("Initializing RAG pipeline...")
        app_state['rag'] = LegalRAG(vectorstore=vectorstore, embedder=embedder)
        logger.info("✓ RAG pipeline ready")

        # 4. Initialize TTS (optional)
        logger.info("Initializing TTS...")
        try:
            app_state['tts'] = UrduTTS()
            logger.info("✓ TTS loaded (ElevenLabs)")
        except Exception as e:
            logger.warning(f"TTS not available: {e}")
            logger.warning("Speech output will not be available without ElevenLabs API key")
            app_state['tts'] = None

        logger.info("=" * 70)
        logger.info("✓ Server startup complete - ready to accept requests")
        logger.info("=" * 70)

    except Exception as e:
        logger.error(f"Startup failed: {e}")
        import traceback
        traceback.print_exc()
        raise

# Health check
@app.get("/health")
async def health():
    """Health check endpoint."""
    logger.info(f"[{datetime.now().isoformat()}] GET /health")

    return {
        "status": "ok",
        "model": "loaded",
        "chunks_indexed": app_state['chunks_indexed'],
        "components": {
            "stt": "ready" if app_state['stt'] else "not_loaded",
            "rag": "ready" if app_state['rag'] else "not_loaded",
            "tts": "ready" if app_state['tts'] else "not_configured",
            "vectorstore": "ready" if app_state['vectorstore'] else "not_loaded"
        }
    }

# Endpoint 1: Transcribe audio to text
@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Transcribe audio file to Urdu text using Whisper.

    Args:
        audio: Audio file from microphone (webm, wav, mp3, etc.)

    Returns:
        {"text": "سوال اردو میں", "success": true}
    """
    logger.info(f"[{datetime.now().isoformat()}] POST /transcribe - File: {audio.filename}")

    if not app_state['stt']:
        logger.error("STT not initialized")
        raise HTTPException(status_code=503, detail="STT not available")

    try:
        # Read audio bytes
        audio_bytes = await audio.read()
        logger.info(f"  Received {len(audio_bytes)} bytes of audio")

        # Transcribe
        text = app_state['stt'].transcribe_bytes(audio_bytes, format="webm")
        logger.info(f"  ✓ Transcribed: {text[:80]}")

        return {
            "text": text,
            "success": True
        }

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        return {
            "error": str(e),
            "success": False
        }, 500

# Endpoint 2: Query legal knowledge base
@app.post("/query")
async def query(request: QueryRequest):
    """
    Query legal knowledge base and get answer.

    Args:
        request: {"text": "سوال اردو میں", "category": "criminal_law"}

    Returns:
        {"answer": "جواب", "source_pages": [...], "confidence": 0.87, ...}
    """
    logger.info(f"[{datetime.now().isoformat()}] POST /query - Text: {request.text[:50]}")

    if not app_state['rag']:
        logger.error("RAG not initialized")
        raise HTTPException(status_code=503, detail="RAG not available")

    try:
        # Get answer
        result = app_state['rag'].answer(request.text, use_llm=False)
        logger.info(f"  ✓ Found answer with confidence: {result['confidence']:.4f}")

        return {
            "answer": result['answer'],
            "source_pages": result['source_pages'],
            "confidence": result['confidence'],
            "category": result.get('category', 'unknown'),
            "success": True
        }

    except Exception as e:
        logger.error(f"Query failed: {e}")
        return {
            "error": str(e),
            "success": False
        }, 500

# Endpoint 3: Text to Speech
@app.post("/speak")
async def speak(request: SpeakRequest):
    """
    Convert Urdu text to speech.

    Args:
        request: {"text": "متن"}

    Returns:
        Audio stream (MP3)
    """
    logger.info(f"[{datetime.now().isoformat()}] POST /speak - Text: {request.text[:50]}")

    if not app_state['tts']:
        logger.error("TTS not configured")
        raise HTTPException(status_code=503, detail="TTS not available (no API key configured)")

    try:
        # Generate audio
        audio_bytes = app_state['tts'].speak(request.text)
        logger.info(f"  ✓ Generated {len(audio_bytes)} bytes of audio")

        # Stream as MP3
        return StreamingResponse(
            iter([audio_bytes]),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=answer.mp3"}
        )

    except Exception as e:
        logger.error(f"Speech generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint 4: Combined voice query (MAIN ENDPOINT)
@app.post("/voice-query")
async def voice_query(audio: UploadFile = File(...)):
    """
    Complete voice interaction pipeline:
    1. Transcribe audio to question text (STT)
    2. Query legal knowledge base (RAG)
    3. Convert answer to speech (TTS)

    Args:
        audio: Audio file from microphone

    Returns:
        {
            "question_text": "سوال اردو میں",
            "answer_text": "جواب اردو میں",
            "audio_base64": "...",
            "source_pages": [12, 45],
            "confidence": 0.87,
            "success": true
        }
    """
    logger.info(f"[{datetime.now().isoformat()}] POST /voice-query - File: {audio.filename}")

    if not app_state['stt'] or not app_state['rag']:
        logger.error("Required components not initialized")
        raise HTTPException(status_code=503, detail="Required components not available")

    try:
        # Step 1: Transcribe audio
        logger.info("  [Step 1] Transcribing audio...")
        audio_bytes = await audio.read()
        question_text = app_state['stt'].transcribe_bytes(audio_bytes, format="webm")
        logger.info(f"    ✓ Question: {question_text[:80]}")

        # Step 2: Get answer from RAG
        logger.info("  [Step 2] Querying knowledge base...")
        rag_result = app_state['rag'].answer(question_text, use_llm=False)
        answer_text = rag_result['answer']
        source_pages = rag_result['source_pages']
        confidence = rag_result['confidence']
        logger.info(f"    ✓ Answer found (confidence: {confidence:.4f})")

        # Step 3: Convert answer to speech (if TTS available)
        audio_base64 = ""
        if app_state['tts']:
            logger.info("  [Step 3] Generating speech...")
            try:
                answer_audio_bytes = app_state['tts'].speak(answer_text)
                audio_base64 = base64.b64encode(answer_audio_bytes).decode('utf-8')
                logger.info(f"    ✓ Generated audio ({len(answer_audio_bytes)} bytes)")
            except Exception as tts_error:
                logger.warning(f"    ⚠ TTS failed: {tts_error}")
                audio_base64 = ""
        else:
            logger.info("  [Step 3] TTS not available (skipped)")

        logger.info("  ✓ Voice query completed successfully")

        return {
            "question_text": question_text,
            "answer_text": answer_text,
            "audio_base64": audio_base64,
            "source_pages": source_pages,
            "confidence": float(confidence),
            "success": True
        }

    except Exception as e:
        logger.error(f"Voice query failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "success": False
        }, 500

# Endpoint 5: PDF Processing (admin)
@app.post("/process-pdf")
async def process_pdf(file: UploadFile = File(...)):
    """
    Process and ingest a PDF into the vectorstore.
    Admin endpoint for uploading new legal documents.
    """
    logger.info(f"[{datetime.now().isoformat()}] POST /process-pdf - File: {file.filename}")

    if not app_state['vectorstore']:
        logger.error("Vectorstore not initialized")
        raise HTTPException(status_code=503, detail="Vectorstore not available")

    try:
        # Save PDF
        pdf_dir = Path("data/raw")
        pdf_dir.mkdir(parents=True, exist_ok=True)
        pdf_path = pdf_dir / file.filename

        with open(pdf_path, "wb") as f:
            content = await file.read()
            f.write(content)

        logger.info(f"  ✓ Saved PDF to {pdf_path}")

        # Extract text
        logger.info("  Extracting text from PDF...")
        extractor = PDFExtractor(str(pdf_path))
        pages = extractor.extract_text()
        logger.info(f"    Extracted {len(pages)} pages")

        # Create chunks
        chunks = extractor.create_chunks(chunk_size=400, overlap=50)
        logger.info(f"    Created {len(chunks)} chunks")

        # Ingest into vectorstore
        processed_dir = Path("data/processed")
        chunks_file = processed_dir / f"{file.filename.replace('.pdf', '_chunks.json')}"
        extractor.save_chunks(str(chunks_file))

        stats = app_state['vectorstore'].ingest_chunks(str(chunks_file))
        app_state['chunks_indexed'] = stats.get('total_ingested', 0)
        logger.info(f"  ✓ Ingested {stats.get('total_ingested')} chunks")

        return {
            "status": "success",
            "filename": file.filename,
            "pages_processed": len(pages),
            "chunks_created": len(chunks),
            "chunks_ingested": stats.get('total_ingested'),
            "total_chunks_in_store": app_state['chunks_indexed']
        }

    except Exception as e:
        logger.error(f"PDF processing failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint 6: Vectorstore stats
@app.get("/stats")
async def stats():
    """Get vectorstore and system statistics."""
    logger.info(f"[{datetime.now().isoformat()}] GET /stats")

    if not app_state['vectorstore']:
        return {"error": "Vectorstore not available"}, 503

    return {
        "vectorstore": app_state['vectorstore'].get_stats(),
        "chunks_indexed": app_state['chunks_indexed'],
        "models": {
            "stt": "Whisper (base)" if app_state['stt'] else "not loaded",
            "rag": "LegalRAG" if app_state['rag'] else "not loaded",
            "tts": "ElevenLabs" if app_state['tts'] else "not configured"
        }
    }

# Root endpoint
@app.get("/")
async def root():
    """API root - documentation."""
    return {
        "name": "Voice2Law API",
        "version": "1.0.0",
        "description": "Urdu voice-based legal assistant",
        "endpoints": {
            "GET /health": "Health check",
            "GET /stats": "System statistics",
            "POST /transcribe": "Convert audio to text (Whisper STT)",
            "POST /query": "Query legal knowledge base (RAG)",
            "POST /speak": "Convert text to speech (ElevenLabs TTS)",
            "POST /voice-query": "Complete voice interaction pipeline",
            "POST /process-pdf": "Admin: Process and ingest PDF"
        },
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True
    )

