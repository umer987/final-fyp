"""Stable demo/FYP answers for frequent legal questions (skips LLM on cache hit)."""
from __future__ import annotations

import json
import re
from pathlib import Path

from app.config import settings

_CACHE_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "answer_cache.json"

# Map variant phrasings to a canonical cache key (language::question).
_ALIASES: dict[str, str] = {
    "urdu::چوری کی سزا": "urdu::چوری کی سزا کیا ہے؟",
    "urdu::چوری کی سزا کیا ہے": "urdu::چوری کی سزا کیا ہے؟",
    "urdu::چوری": "urdu::چوری کی سزا کیا ہے؟",
    "english::what is the punishment for theft": "english::what is the punishment for theft in pakistan?",
    "english::punishment for theft": "english::what is the punishment for theft in pakistan?",
    "urdu::طلاق کا طریقہ": "urdu::طلاق کا طریقہ کار کیا ہے؟",
    "urdu::کرایہ دار کے حقوق": "urdu::کرایہ دار کے کیا حقوق ہیں؟",
}


def _normalize_question(text: str) -> str:
    q = (text or "").strip()
    return re.sub(r"\s+", " ", q)


def cache_key(question: str, language: str) -> str:
    lang = (language or "urdu").lower().strip()
    return f"{lang}::{_normalize_question(question)}"


def _resolve_key(key: str) -> str:
    return _ALIASES.get(key, key)


def _load_disk() -> dict[str, str]:
    if not _CACHE_PATH.is_file():
        return {}
    try:
        data = json.loads(_CACHE_PATH.read_text(encoding="utf-8"))
        entries = data.get("entries") or {}
        return {str(k): str(v) for k, v in entries.items()}
    except Exception as exc:
        print(f"[Voice2Law NLP] answer_cache: could not read {_CACHE_PATH}: {exc}", flush=True)
        return {}


def _save_disk(entries: dict[str, str]) -> None:
    try:
        _CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        payload = {"entries": entries}
        _CACHE_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception as exc:
        print(f"[Voice2Law NLP] answer_cache: could not write {_CACHE_PATH}: {exc}", flush=True)


# In-memory copy (loaded once, updated on learn).
_entries: dict[str, str] | None = None


def _is_brief_cached_answer(answer: str) -> bool:
    """Skip stale demo cache entries that are too short for substantive legal detail."""
    text = (answer or "").strip()
    if len(text) < settings.answer_cache_min_chars:
        return True
    if text.startswith("سوال:") and "انڈیکس شدہ قانونی دستاویزات" in text:
        return True
    if text.startswith("Question:") and "Relevant excerpts from indexed" in text:
        return True
    detail_markers = ("تفصیل:", "Details:")
    for marker in detail_markers:
        if marker not in text:
            continue
        detail = text.split(marker, 1)[1]
        for end in ("ماخذ:", "Source:", "نوٹ:", "Note:"):
            if end in detail:
                detail = detail.split(end, 1)[0]
        sentences = detail.count("۔") + detail.count(".")
        if sentences < 5:
            return True
        if len(detail.strip()) < 280:
            return True
        return False
    return len(text) < settings.answer_cache_min_chars + 150


def _entries_map() -> dict[str, str]:
    global _entries
    if _entries is None:
        _entries = _load_disk()
    return _entries


def get_cached_answer(question: str, language: str) -> str | None:
    """Return a cached answer if enabled and a key matches."""
    if not settings.answer_cache_enabled:
        return None
    key = _resolve_key(cache_key(question, language))
    answer = _entries_map().get(key)
    if answer and _is_brief_cached_answer(answer):
        from app.services.log_util import safe_log

        safe_log(
            f"[Voice2Law NLP] answer_cache SKIP brief entry (len={len(answer)}, key_len={len(key)})"
        )
        return None
    if answer:
        from app.services.log_util import safe_log

        safe_log(f"[Voice2Law NLP] answer_cache HIT (key_len={len(key)})")
    return answer


def store_answer(question: str, language: str, answer: str) -> None:
    """Persist a successful answer for repeat questions (demo stability)."""
    if not settings.answer_cache_enabled or not settings.answer_cache_learn:
        return
    text = (answer or "").strip()
    if not text or text.startswith("["):
        return
    if _is_brief_cached_answer(text):
        return
    key = _resolve_key(cache_key(question, language))
    entries = _entries_map()
    if entries.get(key) == text:
        return
    entries[key] = text
    _save_disk(entries)
    print(f"[Voice2Law NLP] answer_cache STORE (key_len={len(key)})", flush=True)
