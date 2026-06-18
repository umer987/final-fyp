"""Normalize STT output for Urdu: Devanagari (Hindi script) -> Urdu Arabic script."""
from __future__ import annotations

import re

# Whisper often transcribes spoken Urdu as Hindi Devanagari; detect and convert.
_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
_ARABIC_DIACRITICS_RE = re.compile(r"[\u064B-\u065F\u0670\u0640]")

# Common legal / everyday Hindi (Devanagari) -> Urdu (Arabic) word fixes after transliteration.
_LEGAL_WORD_FIXES: dict[str, str] = {
    "چورِی": "چوری",
    "چوری": "چوری",
    "سَجَا": "سزا",
    "سزا": "سزا",
    "کْیَا": "کیا",
    "کیا": "کیا",
    "ہَے": "ہے",
    "طلاق": "طلاق",
    "وراثت": "وراثت",
    "کرایہ": "کرایہ",
    "نکاح": "نکاح",
}


def _has_devanagari(text: str) -> bool:
    return bool(_DEVANAGARI_RE.search(text))


def _strip_arabic_diacritics(text: str) -> str:
    return _ARABIC_DIACRITICS_RE.sub("", text)


def _devanagari_to_urdu_script(text: str) -> str:
    """Transliterate Devanagari to Urdu Arabic script (best-effort)."""
    try:
        from aksharamukha.transliterate import process

        converted = process("Devanagari", "Urdu", text)
    except Exception:
        converted = _simple_devanagari_word_map(text)

    converted = _strip_arabic_diacritics(converted)
    for src, dst in _LEGAL_WORD_FIXES.items():
        converted = converted.replace(src, dst)
    return converted.strip()


def _simple_devanagari_word_map(text: str) -> str:
    """Fallback when aksharamukha is unavailable — common legal phrases only."""
    words = {
        "चोरी": "چوری",
        "की": "کی",
        "सजा": "سزا",
        "क्या": "کیا",
        "है": "ہے",
        "तलाक": "طلاق",
        "विरासत": "وراثت",
        "वारिस": "وارث",
        "किराया": "کرایہ",
        "निकाह": "نکاح",
    }
    out = text
    for hindi, urdu in words.items():
        out = out.replace(hindi, urdu)
    if _has_devanagari(out):
        return text
    return out


def normalize_stt_transcript(text: str, language: str | None) -> str:
    """When the user chose Urdu, ensure the transcript uses Arabic script."""
    trimmed = (text or "").strip()
    if not trimmed:
        return trimmed

    lang = (language or "").lower().strip()
    if lang not in {"urdu", "urd", "ur"}:
        return trimmed

    if not _has_devanagari(trimmed):
        return trimmed

    return _devanagari_to_urdu_script(trimmed)
