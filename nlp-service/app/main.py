"""Voice2Law NLP microservice (FastAPI).

Endpoints:
  GET  /health  — liveness + config snapshot
  POST /ask     — text question -> retrieve -> LLM answer (Urdu by default)
  POST /transcribe — audio -> text only (for Node backend STT_ENGINE=whisper)
  POST /voice   — audio -> STT -> ask pipeline
  POST /tts      — text -> TTS -> audio

Speech (STT/TTS) and the LLM default to the free Hugging Face Inference API;
each is switchable to the paid OpenAI/ElevenLabs path via .env. The Node/Express
backend (http://localhost:5000) calls this service; see README.
"""
from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv

# Load .env before any app imports that read settings (belt-and-suspenders).
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

import base64
import time

from fastapi import FastAPI, File, Form, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from app.config import settings
from app.services import llm, speech, vectorstore
from app.services.embeddings import embeddings_available, embeddings_import_error

app = FastAPI(title="Voice2Law NLP Service", version="0.1.0")


@app.on_event("startup")
def _startup_warmup() -> None:
    """Log LLM target, fix Windows Chroma index if needed, preload embeddings."""
    llm.log_ask_runtime_target()
    try:
        migrated = vectorstore.ensure_windows_safe_index()
        if migrated:
            vectorstore._clear_collection_cache()
    except Exception as exc:  # pragma: no cover - never block startup
        print(f"[Voice2Law NLP] Windows index check skipped: {exc}", flush=True)
    if embeddings_available():
        try:
            from app.services.embeddings import _get_model

            _get_model()
            print("[Voice2Law NLP] Embedding model preloaded.", flush=True)
        except Exception as exc:  # pragma: no cover - never block startup
            print(f"[Voice2Law NLP] Embedding preload skipped: {exc}", flush=True)

# CORS — allow the Node backend and local Vite dev origins (override via CORS_ORIGINS).
def _parse_cors_origins() -> list[str]:
    raw = (settings.cors_origins or "").strip()
    if not raw or raw == "*":
        return [
            "http://localhost:5000",
            "http://localhost:5173",
            "http://localhost:5174",
        ]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# Schemas
# --------------------------------------------------------------------------- #
class AskRequest(BaseModel):
    question: str
    language: str = settings.answer_language


class AskResponse(BaseModel):
    answer: str
    sources: list[dict]
    language: str


class TTSRequest(BaseModel):
    text: str
    language: str = settings.answer_language


# --------------------------------------------------------------------------- #
# Core pipeline (shared by /ask and /voice)
# --------------------------------------------------------------------------- #
def _run_ask(question: str, language: str) -> AskResponse:
    """Retrieve relevant law, then ask the LLM for a grounded answer."""
    from app.services import answer_cache
    from app.services.log_util import safe_log

    # Cache hit skips BOTH Chroma retrieval and the LLM — near-instant response.
    # Lawyer recommendation in the Node backend scores the question text itself,
    # so empty sources on a cache hit do not break topic detection.
    t0 = time.perf_counter()
    cached = answer_cache.get_cached_answer(question, language)
    if cached:
        safe_log(
            f"[Voice2Law NLP] /ask cache={time.perf_counter() - t0:.3f}s (retrieval skipped)"
        )
        return AskResponse(answer=cached, sources=[], language=language)

    if not embeddings_available():
        detail = embeddings_import_error() or "Embeddings are unavailable."
        raise RuntimeError(detail)
    chunks = vectorstore.query(question)
    t1 = time.perf_counter()
    answer = llm.generate_answer(question, chunks, language)
    answer_cache.store_answer(question, language, answer)
    llm_label = "extractive" if settings.llm_extractive_only else "llm"
    t2 = time.perf_counter()
    safe_log(
        f"[Voice2Law NLP] /ask retrieve={t1 - t0:.2f}s {llm_label}={t2 - t1:.2f}s "
        f"total={t2 - t0:.2f}s chunks={len(chunks)}"
    )
    sources = [
        {"text": c["text"][:300], "metadata": c.get("metadata", {})}
        for c in chunks
    ]
    return AskResponse(answer=answer, sources=sources, language=language)


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #
def _index_category_counts() -> dict[str, int]:
    """Summarize indexed categories for /health (helps spot missing criminal law)."""
    try:
        from collections import Counter

        collection = vectorstore._get_collection()
        total = collection.count()
        if total == 0:
            return {}
        sample = collection.get(limit=min(total, 5000), include=["metadatas"])
        return dict(
            Counter((m or {}).get("category", "uncategorized") for m in (sample.get("metadatas") or []))
        )
    except Exception:
        return {}


@app.get("/health")
def health(details: bool = Query(False, description="Include category breakdown (slower)")) -> dict:
    llm_configured = (
        bool(settings.llm_api_key)
        if settings.llm_provider.lower() == "openai"
        else bool(settings.hf_token)
    )
    payload = {
        "status": "ok",
        "indexed_chunks": vectorstore.count(),
        "llm_provider": settings.llm_provider,
        "stt_provider": settings.stt_provider,
        "tts_provider": settings.tts_provider,
        "llm_configured": llm_configured,
        "llm_model": settings.llm_model if settings.llm_provider.lower() == "openai" else settings.hf_llm_model,
        "llm_base_url": settings.llm_base_url if settings.llm_provider.lower() == "openai" else None,
        "hf_llm_model": settings.hf_llm_model,
        "hf_llm_inference_provider": settings.hf_llm_inference_provider,
        "speech_configured": speech.is_configured(),
        "stt_configured": speech.is_stt_configured(),
        "tts_configured": speech.is_tts_configured(),
        "tts_model": (
            settings.elevenlabs_tts_model
            if settings.tts_provider.lower() == "elevenlabs"
            else settings.hf_tts_model
        ),
        "tts_voice_id": (
            settings.elevenlabs_tts_voice_id
            if settings.tts_provider.lower() == "elevenlabs"
            else None
        ),
        "embeddings_ready": embeddings_available(),
        "embeddings_error": embeddings_import_error(),
        "ocr_engine": settings.ocr_engine,
        "answer_language": settings.answer_language,
        "retrieval_k": settings.retrieval_k,
        "llm_extractive_only": settings.llm_extractive_only,
    }
    if details:
        payload["indexed_categories"] = _index_category_counts()
    return payload


@app.post("/ask")
def ask(req: AskRequest):
    try:
        return _run_ask(req.question, req.language)
    except Exception as exc:
        # Surface a JSON error (not a bare 500) so the Node backend can log it.
        return JSONResponse(
            status_code=503,
            content={"detail": str(exc), "error": "ask_pipeline_failed"},
        )


def _stt_language_hint(language: str) -> str | None:
    lang = language.lower().strip()
    if lang == "urdu":
        return "urd"
    if lang == "english":
        return "eng"
    return None


def _normalize_upload_audio(audio: UploadFile, audio_bytes: bytes) -> tuple[str | None, str | None]:
    """Return (content_type, filename) with sensible defaults for browser MediaRecorder."""
    content_type = (audio.content_type or "").split(";")[0].strip().lower() or None
    filename = audio.filename or None

    if not content_type or content_type == "application/octet-stream":
        name = (filename or "").lower()
        if name.endswith(".webm"):
            content_type = "audio/webm"
        elif name.endswith(".wav"):
            content_type = "audio/wav"
        elif name.endswith((".mp3", ".mpeg")):
            content_type = "audio/mpeg"
        elif name.endswith((".m4a", ".mp4")):
            content_type = "audio/mp4"
        elif name.endswith(".ogg"):
            content_type = "audio/ogg"
        elif name.endswith(".flac"):
            content_type = "audio/flac"
        elif len(audio_bytes) >= 4 and audio_bytes[:4] == b"\x1aE\xdf\xa3":
            content_type = "audio/webm"
        elif len(audio_bytes) >= 4 and audio_bytes[:4] == b"RIFF":
            content_type = "audio/wav"
        else:
            content_type = "audio/webm"

    if not filename:
        ext = {
            "audio/webm": "recording.webm",
            "audio/wav": "recording.wav",
            "audio/x-wav": "recording.wav",
            "audio/mpeg": "recording.mp3",
            "audio/mp4": "recording.m4a",
            "audio/ogg": "recording.ogg",
            "audio/flac": "recording.flac",
        }.get(content_type, "recording.webm")
        filename = ext

    return content_type, filename


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form(settings.answer_language),
) -> JSONResponse:
    """Audio -> text only (Whisper via configured STT provider). Used by the Node backend."""
    audio_bytes = await audio.read()
    if not audio_bytes:
        return JSONResponse(
            status_code=400,
            content={"text": "", "success": False, "error": "Empty audio upload."},
        )

    content_type, filename = _normalize_upload_audio(audio, audio_bytes)
    lang_hint = _stt_language_hint(language)

    try:
        result = speech.speech_to_text_with_meta(
            audio_bytes,
            lang_hint,
            content_type=content_type,
            filename=filename,
        )
        text = result.text
        stt_source = result.provider
    except speech.SpeechError as exc:
        return JSONResponse(
            status_code=503,
            content={
                "text": "",
                "success": False,
                "error": speech.user_facing_stt_error(exc),
            },
        )
    except Exception as exc:
        return JSONResponse(
            status_code=503,
            content={
                "text": "",
                "success": False,
                "error": speech.user_facing_stt_error(exc),
            },
        )

    from app.services.urdu_script import normalize_stt_transcript

    text = normalize_stt_transcript(text, language)
    return JSONResponse({"text": text, "success": True, "stt_source": stt_source})


@app.post("/voice")
async def voice(
    audio: UploadFile = File(...),
    language: str = Form(settings.answer_language),
) -> JSONResponse:
    """Audio question -> transcript (configured STT provider) -> ask pipeline."""
    audio_bytes = await audio.read()
    content_type, filename = _normalize_upload_audio(audio, audio_bytes)
    lang_hint = _stt_language_hint(language)

    try:
        transcript = speech.speech_to_text_with_meta(
            audio_bytes,
            lang_hint,
            content_type=content_type,
            filename=filename,
        ).text
    except speech.SpeechError as exc:
        # Graceful placeholder when the STT provider key/SDK is absent.
        return JSONResponse(
            {
                "transcript": "",
                "answer": f"[Speech-to-text unavailable: {speech.user_facing_stt_error(exc)}]",
                "language": language,
            }
        )

    result = _run_ask(transcript, language)
    return JSONResponse(
        {
            "transcript": transcript,
            "answer": result.answer,
            "language": result.language,
        }
    )


@app.post("/tts")
def tts(req: TTSRequest):
    """Text -> configured TTS provider. Streams audio, or JSON message if unavailable."""
    try:
        audio_bytes = speech.text_to_speech(req.text, req.language)
    except speech.SpeechError as exc:
        return JSONResponse(
            status_code=200,
            content={
                "error": f"[Text-to-speech unavailable: {exc}]",
                "audio_base64": None,
                "language": req.language,
            },
        )

    # Stream the audio back; clients can also request base64 by decoding if needed.
    return StreamingResponse(
        iter([audio_bytes]),
        media_type="audio/mpeg",
        headers={"Content-Disposition": 'inline; filename="speech.mp3"'},
    )


# Optional helper if a caller prefers base64 (e.g. embedding in JSON for the UI).
@app.post("/tts/base64")
def tts_base64(req: TTSRequest) -> JSONResponse:
    try:
        audio_bytes = speech.text_to_speech(req.text, req.language)
    except speech.SpeechError as exc:
        return JSONResponse(
            {"error": f"[Text-to-speech unavailable: {exc}]", "audio_base64": None}
        )
    return JSONResponse(
        {"audio_base64": base64.b64encode(audio_bytes).decode("ascii"), "mime": "audio/mpeg"}
    )
