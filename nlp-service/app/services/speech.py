"""Speech wrappers: STT + TTS (Hugging Face Inference API by default).

Providers are selected via STT_PROVIDER / TTS_PROVIDER in .env:
  - "huggingface" (default, FREE): huggingface_hub.InferenceClient
        STT -> automatic_speech_recognition (HF_STT_MODEL, e.g. whisper-large-v3)
        TTS -> text_to_speech (HF_TTS_MODEL, e.g. facebook/mms-tts-urd for Urdu)
  - "elevenlabs"  (paid): ElevenLabs Scribe STT + multilingual TTS

All functions degrade gracefully (raise SpeechError) when credentials/SDKs are
missing so the API endpoints stay testable without setup.
"""
from __future__ import annotations

import hashlib
import io
import logging
import shutil
import ssl
import subprocess
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)

try:
    from huggingface_hub import InferenceClient
except Exception:  # pragma: no cover - missing until deps installed
    InferenceClient = None  # type: ignore[assignment]

try:
    from elevenlabs.client import ElevenLabs
except Exception:  # pragma: no cover - missing until deps installed
    ElevenLabs = None  # type: ignore[assignment]


class SpeechError(RuntimeError):
    """Raised when a speech operation is requested but cannot be fulfilled."""


@dataclass(frozen=True)
class SttResult:
    text: str
    provider: str


def _is_transient_network_error(exc: BaseException) -> bool:
    """True for SSL blips, connection drops, and timeouts worth retrying."""
    if isinstance(exc, (TimeoutError, ssl.SSLError, ConnectionError, BrokenPipeError)):
        return True
    msg = str(exc).lower()
    needles = (
        "unexpected_eof",
        "eof occurred",
        "connection reset",
        "connection aborted",
        "timed out",
        "timeout",
        "temporarily unavailable",
        "502",
        "503",
        "504",
        "gateway",
        "network",
    )
    return any(n in msg for n in needles)


def user_facing_stt_error(exc: BaseException) -> str:
    """Strip low-level SSL/stack traces from errors shown to end users."""
    raw = str(exc).strip()
    lower = raw.lower()
    if _is_transient_network_error(exc) or "ssl" in lower or "unexpected_eof" in lower:
        return (
            "Speech recognition is temporarily unavailable due to a network issue. "
            "Please try again in a moment."
        )
    if "elevenlabs" in lower and ("permission" in lower or "speech_to_text" in lower):
        return (
            "ElevenLabs speech-to-text is not enabled on your API key. "
            "Try again or switch STT_PROVIDER in nlp-service/.env."
        )
    if "hf_token" in lower or "huggingface" in lower and "401" in lower:
        return "Server speech recognition is not configured. Check HF_TOKEN in nlp-service/.env."
    if "empty transcript" in lower or "no speech" in lower:
        return "No speech detected. Speak clearly and try again."
    # Drop Python exception class prefixes like "SpeechError: ..."
    if raw.startswith("SpeechError:"):
        raw = raw.split(":", 1)[1].strip()
    if len(raw) > 180:
        return raw[:177] + "..."
    return raw or "Speech recognition failed. Please try again."


def _retry_stt_call(fn, *, label: str):
    """Retry transient STT provider calls with exponential backoff."""
    attempts = max(1, settings.stt_retry_attempts)
    backoff = max(0.25, settings.stt_retry_backoff_seconds)
    last_exc: BaseException | None = None
    for attempt in range(1, attempts + 1):
        try:
            return fn()
        except SpeechError:
            raise
        except Exception as exc:
            last_exc = exc
            if attempt >= attempts or not _is_transient_network_error(exc):
                break
            wait = backoff * (2 ** (attempt - 1))
            logger.warning(
                "%s transient error (attempt %d/%d): %s — retrying in %.1fs",
                label,
                attempt,
                attempts,
                exc,
                wait,
            )
            time.sleep(wait)
    raise SpeechError(f"{label} failed after {attempts} attempt(s): {last_exc}") from last_exc


def _hf_client() -> "InferenceClient":
    if InferenceClient is None:
        raise SpeechError("huggingface_hub is not installed. Run: pip install -r requirements.txt")
    if not settings.hf_token:
        raise SpeechError(
            "HF_TOKEN is not set in .env. Get a free token at "
            "https://huggingface.co/settings/tokens"
        )
    # hf-inference routes via router.huggingface.co (api-inference.huggingface.co is deprecated).
    return InferenceClient(token=settings.hf_token, provider="hf-inference")


def _elevenlabs_client() -> "ElevenLabs":
    if ElevenLabs is None:
        raise SpeechError("elevenlabs is not installed. Run: pip install -r requirements.txt")
    if not settings.elevenlabs_api_key:
        raise SpeechError("ELEVENLABS_API_KEY is not set in .env")
    return ElevenLabs(api_key=settings.elevenlabs_api_key)


def is_stt_configured() -> bool:
    """True when at least one STT provider in the chain is configured."""
    return any(_is_stt_provider_available(p) for p in _stt_provider_chain())


def is_tts_configured() -> bool:
    """True when the active TTS provider has credentials and SDK."""
    hf_ok = bool(settings.hf_token) and InferenceClient is not None
    el_ok = (
        bool(settings.elevenlabs_api_key)
        and bool(settings.elevenlabs_tts_voice_id)
        and ElevenLabs is not None
    )
    return hf_ok if settings.tts_provider.lower() == "huggingface" else el_ok


def is_configured() -> bool:
    """True when both active STT and TTS providers are configured."""
    return is_stt_configured() and is_tts_configured()


_CONTENT_TYPE_TO_EXT = {
    "audio/webm": ".webm",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/wave": ".wav",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/mp4": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/flac": ".flac",
    "audio/x-flac": ".flac",
    "audio/ogg": ".ogg",
    "audio/opus": ".opus",
}


def _hf_audio_suffix(
    audio_bytes: bytes, *, content_type: str | None, filename: str | None
) -> str:
    """Pick a file suffix so HF inference can infer audio MIME from a temp path."""
    if filename:
        suffix = Path(filename).suffix
        if suffix:
            return suffix
    if content_type:
        mime = content_type.split(";")[0].strip().lower()
        if mime in _CONTENT_TYPE_TO_EXT:
            return _CONTENT_TYPE_TO_EXT[mime]
    if len(audio_bytes) >= 4:
        if audio_bytes[:4] == b"fLaC":
            return ".flac"
        if audio_bytes[:4] == b"RIFF":
            return ".wav"
        if audio_bytes[:4] == b"\x1aE\xdf\xa3":
            return ".webm"
        if audio_bytes[:3] == b"ID3" or audio_bytes[:2] == b"\xff\xfb":
            return ".mp3"
    # Browser MediaRecorder defaults to webm when codec is unspecified.
    return ".webm"


def _ffmpeg_path() -> str | None:
    """Return ffmpeg executable if available (winget install Gyan.FFmpeg)."""
    return shutil.which("ffmpeg")


def _convert_audio_to_wav(src: Path) -> Path:
    """Decode browser webm/opus (etc.) to 16 kHz mono WAV for HF Whisper."""
    ffmpeg = _ffmpeg_path()
    if not ffmpeg:
        return src

    dst = Path(tempfile.mktemp(suffix=".wav"))
    cmd = [
        ffmpeg,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(src),
        "-ar",
        "16000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        str(dst),
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=120)
    except subprocess.CalledProcessError as exc:
        stderr = (exc.stderr or b"").decode("utf-8", errors="replace").strip()
        raise SpeechError(
            f"Could not decode audio ({src.suffix}). Install FFmpeg "
            f"(winget install Gyan.FFmpeg) or set STT_ENGINE=webspeech. {stderr}"
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise SpeechError("Audio conversion timed out — recording may be too long.") from exc

    if not dst.is_file() or dst.stat().st_size < 44:
        raise SpeechError("Decoded audio is empty. Speak longer and try again.")
    return dst


def _hf_audio_input(
    audio_bytes: bytes, *, content_type: str | None, filename: str | None
) -> Path:
    """Prepare audio for huggingface_hub ASR (local WAV path — not BytesIO)."""
    if not audio_bytes:
        raise SpeechError("Audio payload is empty.")
    if len(audio_bytes) < 200:
        raise SpeechError(
            "Recording is too short. Hold the mic button, speak clearly, then stop."
        )

    suffix = _hf_audio_suffix(audio_bytes, content_type=content_type, filename=filename)
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    try:
        tmp.write(audio_bytes)
        tmp.flush()
        src = Path(tmp.name)
    finally:
        tmp.close()

    # HF Whisper router often rejects raw browser webm/opus; decode to WAV when possible.
    if suffix.lower() in {".webm", ".ogg", ".opus", ".m4a", ".mp4", ".mp3", ".mpeg"}:
        wav_path = _convert_audio_to_wav(src)
        if wav_path != src:
            src.unlink(missing_ok=True)
            return wav_path
    return src


_ELEVENLABS_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text"


def _elevenlabs_stt_text_rest(
    audio_bytes: bytes,
    language: str | None = None,
    *,
    content_type: str | None = None,
    filename: str | None = None,
) -> str:
    """Call ElevenLabs Scribe REST API (works with elevenlabs SDK 1.x)."""
    import httpx

    if not settings.elevenlabs_api_key:
        raise SpeechError("ELEVENLABS_API_KEY is not set in .env")

    upload_name = filename or "recording.webm"
    mime = content_type or "audio/webm"
    data: dict[str, str] = {
        "model_id": settings.elevenlabs_stt_model,
        "tag_audio_events": "false",
    }
    if language:
        data["language_code"] = language

    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(
                _ELEVENLABS_STT_URL,
                headers={"xi-api-key": settings.elevenlabs_api_key},
                data=data,
                files={"file": (upload_name, audio_bytes, mime)},
            )
    except Exception as exc:
        if _is_transient_network_error(exc):
            raise
        raise SpeechError(f"ElevenLabs speech-to-text request failed: {exc}") from exc

    try:
        body = response.json() if response.content else {}
    except ValueError:
        body = {}

    if not response.is_success:
        detail = body.get("detail") if isinstance(body, dict) else None
        if isinstance(detail, dict):
            message = detail.get("message") or str(detail)
        elif isinstance(detail, str):
            message = detail
        else:
            message = (
                body.get("message") if isinstance(body, dict) else None
            ) or response.text or response.reason_phrase
        lower = str(message).lower()
        if "speech_to_text" in lower or "permission" in lower:
            raise SpeechError(
                "ElevenLabs speech-to-text is not enabled on your API key. "
                "Set STT_PROVIDER=huggingface in nlp-service/.env or STT_ENGINE=webspeech in backend/.env."
            )
        raise SpeechError(f"ElevenLabs speech-to-text failed ({response.status_code}): {message}")

    text = (body.get("text") if isinstance(body, dict) else "") or ""
    text = str(text).strip()
    if not text:
        raise SpeechError("ElevenLabs returned an empty transcript.")
    return text


def _elevenlabs_stt_text(
    audio_bytes: bytes,
    language: str | None = None,
    *,
    content_type: str | None = None,
    filename: str | None = None,
) -> str:
    def _call() -> str:
        client = _elevenlabs_client()
        stt = getattr(client, "speech_to_text", None)
        if stt is not None:
            try:
                result = stt.convert(
                    file=io.BytesIO(audio_bytes),
                    model_id=settings.elevenlabs_stt_model,
                    language_code=language,
                )
            except Exception as exc:
                if _is_transient_network_error(exc):
                    raise
                raise SpeechError(f"ElevenLabs speech-to-text failed: {exc}") from exc
            text = (
                getattr(result, "text", None)
                or getattr(result, "transcript", None)
                or (result.get("text") if isinstance(result, dict) else str(result))
                or ""
            ).strip()
            if not text:
                raise SpeechError("ElevenLabs returned an empty transcript.")
            return text

        return _elevenlabs_stt_text_rest(
            audio_bytes,
            language,
            content_type=content_type,
            filename=filename,
        )

    return _retry_stt_call(_call, label="ElevenLabs STT")


def _hf_stt_text(
    audio_bytes: bytes,
    language: str | None = None,
    *,
    content_type: str | None = None,
    filename: str | None = None,
) -> str:
    """Hugging Face Inference Whisper (can be slow / 504 on cold start)."""
    client = _hf_client()
    audio_input = _hf_audio_input(
        audio_bytes, content_type=content_type, filename=filename
    )
    extra_body: dict | None = None
    if language and str(language).lower() in {"urd", "ur", "urdu"}:
        extra_body = {
            "language": "ur",
            "initial_prompt": "یہ اردو میں ہے۔ چوری، سزا، طلاق، وراثت",
        }

    try:
        result = client.automatic_speech_recognition(
            audio_input,
            model=settings.hf_stt_model,
            extra_body=extra_body,
        )
    except Exception as exc:
        err = str(exc).strip()
        logger.warning("HF ASR failed (%s): %s", settings.hf_stt_model, err)
        hint = "Model may be cold or rate-limited — wait 20s and retry."
        lower = err.lower()
        if "504" in err or "timeout" in lower or "gateway" in lower:
            hint = "HF Whisper timed out — set STT_PROVIDER=elevenlabs or retry."
        elif "ffmpeg" in lower or "decode" in lower or "invalid" in lower:
            hint = "Install FFmpeg (winget install Gyan.FFmpeg) or use STT_ENGINE=webspeech."
        elif "401" in err or "403" in err or "unauthorized" in lower:
            hint = "Check HF_TOKEN in nlp-service/.env (free read token)."
        raise SpeechError(
            f"HF speech-to-text failed ({settings.hf_stt_model}): {err}. {hint}"
        ) from exc
    finally:
        audio_input.unlink(missing_ok=True)

    text = (
        getattr(result, "text", None)
        or (result.get("text") if isinstance(result, dict) else str(result))
        or ""
    ).strip()
    if not text:
        raise SpeechError(
            "Whisper returned an empty transcript. Speak louder/closer to the mic and retry."
        )
    return text


def _groq_stt_api_key() -> str:
    return (settings.groq_stt_api_key or settings.llm_fallback_api_key or "").strip()


def _groq_stt_text(
    audio_bytes: bytes,
    language: str | None = None,
    *,
    content_type: str | None = None,
    filename: str | None = None,
) -> str:
    """Groq Whisper via OpenAI-compatible transcription API."""
    import httpx

    api_key = _groq_stt_api_key()
    if not api_key:
        raise SpeechError("GROQ_STT_API_KEY / LLM_FALLBACK_API_KEY is not set in .env")

    upload_name = filename or "recording.webm"
    mime = content_type or "audio/webm"
    data: dict[str, str] = {"model": settings.groq_stt_model}
    if language and str(language).lower() in {"urd", "ur", "urdu"}:
        data["language"] = "ur"

    def _call() -> str:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {api_key}"},
                data=data,
                files={"file": (upload_name, audio_bytes, mime)},
            )
        try:
            body = response.json() if response.content else {}
        except ValueError:
            body = {}
        if not response.is_success:
            message = (
                body.get("error", {}).get("message")
                if isinstance(body.get("error"), dict)
                else body.get("message") if isinstance(body, dict) else None
            ) or response.text or response.reason_phrase
            raise SpeechError(f"Groq Whisper failed ({response.status_code}): {message}")
        text = str((body.get("text") if isinstance(body, dict) else "") or "").strip()
        if not text:
            raise SpeechError("Groq Whisper returned an empty transcript.")
        return text

    return _retry_stt_call(_call, label="Groq Whisper")


def _is_stt_provider_available(provider: str) -> bool:
    p = provider.lower().strip()
    if p == "huggingface":
        return bool(settings.hf_token) and InferenceClient is not None
    if p == "elevenlabs":
        return bool(settings.elevenlabs_api_key) and ElevenLabs is not None
    if p == "groq":
        return bool(_groq_stt_api_key())
    return False


def _stt_provider_chain() -> list[str]:
    """Ordered STT providers: primary first, then configured fallbacks."""
    primary = settings.stt_provider.lower().strip() or "huggingface"
    if settings.stt_fallback_order.strip():
        configured = [
            p.strip().lower()
            for p in settings.stt_fallback_order.split(",")
            if p.strip()
        ]
    else:
        # Sensible defaults: when ElevenLabs is primary, prefer HF then Groq before giving up.
        if primary == "elevenlabs":
            configured = ["elevenlabs", "huggingface", "groq"]
        elif primary == "huggingface":
            configured = ["huggingface", "groq", "elevenlabs"]
        else:
            configured = [primary, "huggingface", "groq", "elevenlabs"]

    chain: list[str] = []
    for provider in [primary, *configured]:
        if provider and provider not in chain and _is_stt_provider_available(provider):
            chain.append(provider)
    if not chain and _is_stt_provider_available(primary):
        chain = [primary]
    return chain


def _stt_with_provider(
    provider: str,
    audio_bytes: bytes,
    language: str | None = None,
    *,
    content_type: str | None = None,
    filename: str | None = None,
) -> str:
    p = provider.lower().strip()
    if p == "elevenlabs":
        return _elevenlabs_stt_text(
            audio_bytes, language, content_type=content_type, filename=filename
        )
    if p == "groq":
        return _groq_stt_text(
            audio_bytes, language, content_type=content_type, filename=filename
        )
    if p == "huggingface":
        return _hf_stt_text(
            audio_bytes, language, content_type=content_type, filename=filename
        )
    raise SpeechError(f"Unknown STT provider: {provider}")


def speech_to_text(
    audio_bytes: bytes,
    language: str | None = None,
    *,
    content_type: str | None = None,
    filename: str | None = None,
) -> str:
    """Transcribe audio to text using the configured STT provider chain."""
    return speech_to_text_with_meta(
        audio_bytes,
        language,
        content_type=content_type,
        filename=filename,
    ).text


def speech_to_text_with_meta(
    audio_bytes: bytes,
    language: str | None = None,
    *,
    content_type: str | None = None,
    filename: str | None = None,
) -> SttResult:
    """Transcribe audio; tries primary STT provider then configured fallbacks."""
    from app.services.urdu_script import normalize_stt_transcript

    chain = _stt_provider_chain()
    if not chain:
        raise SpeechError(
            "No speech-to-text provider is configured. Set HF_TOKEN, ELEVENLABS_API_KEY, "
            "or GROQ_STT_API_KEY in nlp-service/.env."
        )

    errors: list[str] = []
    for idx, provider in enumerate(chain):
        if idx > 0:
            logger.warning(
                "STT fallback: trying %s after %s failed",
                provider,
                chain[idx - 1],
            )
        try:
            text = _stt_with_provider(
                provider,
                audio_bytes,
                language,
                content_type=content_type,
                filename=filename,
            )
            normalized = normalize_stt_transcript(text, language)
            return SttResult(text=normalized, provider=provider)
        except SpeechError as exc:
            errors.append(f"{provider}: {exc}")
            logger.warning("STT provider %s failed: %s", provider, exc)

    raise SpeechError(
        "All speech-to-text providers failed. "
        + " | ".join(errors[-3:])
    )


# Cap length for TTS providers; configurable via TTS_MAX_CHARS in .env.
_MAX_TTS_CHARS = settings.tts_max_chars


def _truncate_tts_text(text: str, max_chars: int | None = None) -> str:
    limit = max_chars if max_chars is not None else _MAX_TTS_CHARS
    trimmed = text.strip()
    if len(trimmed) <= limit:
        return trimmed
    slice_ = trimmed[:limit]
    for sep in ("۔", ".", "!", "?"):
        idx = slice_.rfind(sep)
        if idx > limit * 0.4:
            return slice_[: idx + 1].strip()
    space = slice_.rfind(" ")
    if space > limit * 0.5:
        return slice_[:space].strip()
    return slice_.strip()


def _elevenlabs_language_code(language: str | None) -> str | None:
    """Map app language to ElevenLabs ISO 639-1 code (multilingual v2)."""
    if not language:
        return None
    lang = language.lower().strip()
    if lang in {"urdu", "ur", "urd"}:
        return "ur"
    if lang in {"english", "en", "eng"}:
        return "en"
    return None


# Disk cache for synthesized audio — repeated answers (demo cache hits, replays)
# skip the remote TTS provider entirely after the first synthesis.
_TTS_CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "tts_cache"


def _tts_cache_path(text: str, language: str | None) -> Path:
    provider = settings.tts_provider.lower()
    if provider == "elevenlabs":
        model = settings.elevenlabs_tts_model
        voice = settings.elevenlabs_tts_voice_id
    else:
        model = settings.hf_tts_model
        voice = ""
    key = f"{provider}|{model}|{voice}|{(language or '').lower()}|{text}"
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return _TTS_CACHE_DIR / f"{digest}.bin"


def text_to_speech(text: str, language: str | None = None) -> bytes:
    """Synthesize speech from ``text`` using the configured TTS provider.

    Returns raw audio bytes. ``language`` is accepted for API symmetry; the HF
    Urdu model (facebook/mms-tts-urd) is language-specific, and ElevenLabs'
    multilingual model uses ``language_code`` when provided.

    Successful results are cached on disk so the same answer text never hits
    the remote provider twice.
    """
    text = _truncate_tts_text(text)
    cache_path = _tts_cache_path(text, language)
    try:
        if cache_path.is_file():
            audio = cache_path.read_bytes()
            if audio:
                logger.info("TTS cache HIT (%s, %d bytes)", cache_path.name[:12], len(audio))
                return audio
    except OSError:
        pass

    audio = _synthesize_speech(text, language)
    try:
        _TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_path.write_bytes(audio)
    except OSError as exc:
        logger.warning("TTS cache write failed: %s", exc)
    return audio


def _synthesize_speech(text: str, language: str | None = None) -> bytes:
    if settings.tts_provider.lower() == "elevenlabs":
        client = _elevenlabs_client()
        if not settings.elevenlabs_tts_voice_id:
            raise SpeechError("ELEVENLABS_TTS_VOICE_ID is not set in .env")
        lang_code = _elevenlabs_language_code(language)
        convert_kwargs: dict = {
            "voice_id": settings.elevenlabs_tts_voice_id,
            "model_id": settings.elevenlabs_tts_model,
            "text": text,
            "output_format": "mp3_44100_128",
        }
        # eleven_multilingual_v2 auto-detects script; explicit language_code is rejected for Urdu.
        if lang_code and settings.elevenlabs_tts_model not in {
            "eleven_multilingual_v2",
            "eleven_multilingual_v1",
        }:
            convert_kwargs["language_code"] = lang_code
        logger.info(
            "ElevenLabs TTS voice=%s model=%s lang=%s chars=%d",
            settings.elevenlabs_tts_voice_id,
            settings.elevenlabs_tts_model,
            lang_code if "language_code" in convert_kwargs else "auto-detect",
            len(text),
        )
        try:
            audio_stream = client.text_to_speech.convert(**convert_kwargs)
            audio = b"".join(audio_stream)
        except Exception as exc:
            raise SpeechError(f"ElevenLabs text-to-speech failed: {exc}") from exc
        if not audio:
            raise SpeechError("ElevenLabs returned empty audio.")
        return audio

    # Default: Hugging Face Inference API.
    client = _hf_client()
    try:
        audio = client.text_to_speech(text, model=settings.hf_tts_model)
    except Exception as exc:
        raise SpeechError(
            f"HF text-to-speech failed ({settings.hf_tts_model}): {exc}. "
            "Model may be cold or rate-limited — retry shortly."
        ) from exc
    # InferenceClient.text_to_speech returns audio bytes.
    return bytes(audio)
