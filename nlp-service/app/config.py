"""Application settings loaded from environment / .env (pydantic-settings)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# --------------------------------------------------------------------------- #
# Purge stale / deprecated Hugging Face env vars BEFORE anything reads them.
#
# Root cause of the recurring "api-inference.huggingface.co .../Qwen..." error:
# a stale process or a Windows User/Machine env var pointing the client at the
# DEPRECATED api-inference host (and/or letting the model fall back to the
# huggingface_hub default of Qwen/Qwen2.5-7B-Instruct). We scrub those here so
# the .env values below always win, regardless of what the shell inherited.
# --------------------------------------------------------------------------- #
def _purge_deprecated_hf_env() -> None:
    ep = os.environ.get("HF_INFERENCE_ENDPOINT", "")
    if "api-inference.huggingface.co" in ep:
        # Deprecated host — drop it so the router default takes over.
        os.environ.pop("HF_INFERENCE_ENDPOINT", None)
    # A stale shell var that pins the old Qwen default must never override .env.
    model_override = os.environ.get("HF_LLM_MODEL", "")
    if "qwen" in model_override.lower():
        os.environ.pop("HF_LLM_MODEL", None)
    # Chroma/posthog telemetry mismatch spams logs and slows queries on Windows.
    os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")


_purge_deprecated_hf_env()

# Always load nlp-service/.env, even when uvicorn is started from another cwd.
# override=True so stale shell vars (e.g. old HF_LLM_MODEL=Qwen) cannot win over .env.
_SERVICE_ROOT = Path(__file__).resolve().parent.parent
_ENV_FILE = _SERVICE_ROOT / ".env"
load_dotenv(_ENV_FILE, override=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Service
    nlp_port: int = 8001
    # Comma-separated CORS origins; empty or "*" uses localhost defaults (see main.py).
    cors_origins: str = ""

    # Hugging Face Inference API (free default for LLM + STT + TTS)
    hf_token: str = ""
    # Router base URL (api-inference.huggingface.co is deprecated).
    hf_inference_endpoint: str = "https://router.huggingface.co/hf-inference"

    # Provider switches (huggingface = free default; openai/elevenlabs = paid)
    llm_provider: str = "huggingface"
    stt_provider: str = "huggingface"
    tts_provider: str = "huggingface"
    # Comma-separated STT fallback chain after primary (e.g. "huggingface,groq,elevenlabs").
    # Empty = auto: try other configured providers after primary fails.
    stt_fallback_order: str = ""
    stt_retry_attempts: int = 3
    stt_retry_backoff_seconds: float = 1.0
    # Groq Whisper (OpenAI-compatible); defaults to LLM_FALLBACK_API_KEY when unset.
    groq_stt_api_key: str = ""
    groq_stt_model: str = "whisper-large-v3"

    # Hugging Face models
    # Multilingual instruct via Inference Providers auto router (not hf-inference CPU catalog).
    hf_llm_model: str = "meta-llama/Llama-3.1-8B-Instruct"
    # LLM router: "auto" (default) picks a provider that hosts the model; use "hf-inference" only for small/legacy LLMs.
    hf_llm_inference_provider: str = "auto"
    hf_stt_model: str = "openai/whisper-large-v3"
    hf_tts_model: str = "facebook/mms-tts-urd"

    # LLM (OpenAI-compatible: Google Gemini, Groq, Ollama, OpenAI)
    llm_api_key: str = ""
    llm_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    llm_model: str = "gemini-2.0-flash"
    # Groq / secondary OpenAI-compatible fallback when primary (e.g. Gemini) fails.
    llm_fallback_api_key: str = ""
    llm_fallback_base_url: str = "https://api.groq.com/openai/v1"
    llm_fallback_model: str = "llama-3.1-8b-instant"
    llm_openai_fallback: bool = True

    # ElevenLabs (STT + TTS, optional paid path)
    elevenlabs_api_key: str = ""
    elevenlabs_stt_model: str = "scribe_v1"
    elevenlabs_tts_voice_id: str = ""
    elevenlabs_tts_model: str = "eleven_multilingual_v2"

    # Embeddings
    embedding_model: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    # RAG retrieval — fewer chunks + fewer query variants = faster /ask without hurting quality.
    retrieval_k: int = 5
    retrieval_max_queries: int = 2
    max_context_chars: int = 1600

    # LLM generation bounds (HF router latency scales with max_tokens).
    llm_max_tokens_urdu: int = 750
    llm_max_tokens_default: int = 512
    llm_timeout_seconds: float = 90.0
    # 0 = most consistent wording; higher = more variation between runs.
    llm_temperature: float = 0.0
    # When false and LLM_PROVIDER=openai (Gemini), never fall back to Hugging Face LLM.
    llm_hf_fallback: bool = False
    # Skip remote LLM — return formatted excerpts from retrieved Chroma chunks only.
    # Urdu + openai/Gemini still uses the LLM when API key is set (see llm.generate_answer).
    llm_extractive_only: bool = False
    # Demo/FYP: return identical answers for frequent questions (see data/answer_cache.json).
    answer_cache_enabled: bool = True
    answer_cache_learn: bool = True
    # Cached answers shorter than this are ignored (RAG + LLM runs instead).
    answer_cache_min_chars: int = 550

    # TTS input cap — longer answers need a higher limit for full voice playback.
    tts_max_chars: int = 1500

    # Vector store
    chroma_dir: str = "./data/chroma"

    # OCR — "tesseract" (local, free) or "azure" (Document Intelligence, cloud)
    ocr_engine: str = "tesseract"
    tesseract_cmd: str = ""
    azure_document_intelligence_endpoint: str = ""
    azure_document_intelligence_key: str = ""

    # Answers
    answer_language: str = "urdu"


_ROUTER_ENDPOINT = "https://router.huggingface.co/hf-inference"


def _apply_hf_inference_env(cfg: Settings) -> None:
    """Ensure huggingface_hub uses the router, not deprecated api-inference."""
    endpoint = cfg.hf_inference_endpoint or _ROUTER_ENDPOINT
    if "api-inference.huggingface.co" in endpoint:
        # Never let the deprecated host through, even if .env still has it.
        endpoint = _ROUTER_ENDPOINT
    os.environ["HF_INFERENCE_ENDPOINT"] = endpoint
    # Re-assert the resolved model so any tooling reading os.environ agrees with us.
    if cfg.hf_llm_model:
        os.environ["HF_LLM_MODEL"] = cfg.hf_llm_model


def _log_startup_config(cfg: Settings) -> None:
    """Print the RESOLVED HF config once at import so stale setups are obvious."""
    try:
        import huggingface_hub

        hub_version = getattr(huggingface_hub, "__version__", "unknown")
    except Exception:  # pragma: no cover - hub not installed yet
        hub_version = "not-installed"

    endpoint = os.environ.get("HF_INFERENCE_ENDPOINT", "(unset)")
    tts_detail = (
        f"{cfg.elevenlabs_tts_model} (voice {cfg.elevenlabs_tts_voice_id or 'unset'})"
        if cfg.tts_provider.lower() == "elevenlabs"
        else cfg.hf_tts_model
    )
    print(
        "[Voice2Law NLP] Resolved config:\n"
        f"    LLM provider              : {cfg.llm_provider}\n"
        f"    LLM model                 : {cfg.llm_model if cfg.llm_provider.lower() == 'openai' else cfg.hf_llm_model}\n"
        f"    LLM_TEMPERATURE           : {cfg.llm_temperature}\n"
        f"    LLM_HF_FALLBACK           : {cfg.llm_hf_fallback}\n"
        f"    LLM_OPENAI_FALLBACK       : {cfg.llm_openai_fallback}\n"
        f"    LLM_FALLBACK_MODEL        : {cfg.llm_fallback_model if cfg.llm_fallback_api_key else '(unset)'}\n"
        f"    LLM_EXTRACTIVE_ONLY       : {cfg.llm_extractive_only}\n"
        f"    ANSWER_CACHE_ENABLED      : {cfg.answer_cache_enabled}\n"
        f"    STT provider              : {cfg.stt_provider}\n"
        f"    STT fallback order        : {cfg.stt_fallback_order or '(auto)'}\n"
        f"    TTS provider              : {cfg.tts_provider} -> {tts_detail}\n"
        f"    HF_LLM_MODEL              : {cfg.hf_llm_model}\n"
        f"    HF_LLM_INFERENCE_PROVIDER : {cfg.hf_llm_inference_provider}\n"
        f"    HF_INFERENCE_ENDPOINT     : {endpoint}\n"
        f"    huggingface_hub version   : {hub_version}",
        flush=True,
    )

    warnings: list[str] = []
    if "qwen" in cfg.hf_llm_model.lower():
        warnings.append("HF_LLM_MODEL resolved to a Qwen model — check .env / shell env vars.")
    if "api-inference.huggingface.co" in endpoint:
        warnings.append("Endpoint still points at the DEPRECATED api-inference host.")
    if hub_version not in ("unknown", "not-installed"):
        try:
            major, minor, *_ = (int(p) for p in hub_version.split(".")[:2])
            if (major, minor) < (0, 28):
                warnings.append(
                    f"huggingface_hub {hub_version} is too old for Inference Providers / "
                    "the router (needs >= 0.28; requirements pin >= 0.36). "
                    "Run: pip install -U -r requirements.txt"
                )
        except ValueError:
            pass
    for w in warnings:
        print(f"[Voice2Law NLP] WARNING: {w}", flush=True)


@lru_cache
def get_settings() -> Settings:
    """Cached singleton so the .env is parsed once per process."""
    cfg = Settings()
    _apply_hf_inference_env(cfg)
    _log_startup_config(cfg)
    return cfg


settings = get_settings()
