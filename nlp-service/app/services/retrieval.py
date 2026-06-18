"""Query expansion for cross-lingual RAG (Urdu questions -> English law text)."""
from __future__ import annotations

import re

# Urdu legal terms -> English retrieval hints (indexed law is English OCR).
_URDU_TO_ENGLISH: dict[str, str] = {
    "چوری": "theft stealing larceny Pakistan Penal Code section 379 380 381",
    "ڈکیتی": "robbery dacoity Pakistan Penal Code section 392 395",
    "قتل": "murder homicide Pakistan Penal Code section 302 304",
    "زیادتی": "rape sexual assault Pakistan Penal Code section 375 376",
    "فراڈ": "fraud cheating Pakistan Penal Code section 420",
    "سزا": "punishment penalty sentence imprisonment fine",
    "جرم": "offence crime criminal liability Pakistan Penal Code",
    "ضمانت": "bail bailable non-bailable offence",
    "فوجداری": "criminal procedure Code of Criminal Procedure CrPC",
    "تفتیش": "investigation police inquiry criminal procedure",
    "گرفتاری": "arrest warrant custody criminal procedure",
    "جائیداد": "property land acquisition compensation",
    "کرایہ": "rent tenancy landlord tenant",
    "طلاق": "divorce khula talaq dissolution of marriage family law",
    "خلع": "khula judicial divorce wife-initiated dissolution family law",
    "مہر": "dower mahr mehr bridal gift family law marriage",
    "گھرانہ": "household family domestic relations guardianship",
    "ازدواجی": "matrimonial marital conjugal family law marriage",
    "وراثت": "inheritance succession family law",
    "نکاح": "marriage nikah nikah ceremony family law",
    "شادی": "marriage wedding nikah family law",
    "عقد": "marriage contract nikah family law",
}

# English keywords -> extra retrieval terms (helps narrow criminal vs property).
_TOPIC_HINTS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\b(theft|steal|stolen|larceny|چوری)\b", re.I), "theft Pakistan Penal Code criminal"),
    (re.compile(r"\b(murder|homicide|قتل)\b", re.I), "murder Pakistan Penal Code criminal"),
    (re.compile(r"\b(bail|ضمانت)\b", re.I), "bail bailable non-bailable criminal procedure"),
    (re.compile(r"\b(punishment|penalty|sentence|سزا)\b", re.I), "punishment sentence imprisonment criminal"),
    (re.compile(r"\b(rent|tenancy|landlord|کرایہ)\b", re.I), "rent tenancy landlord tenant"),
    (re.compile(r"\b(property|land|acquisition|جائیداد)\b", re.I), "land acquisition property compensation"),
    (
        re.compile(
            r"\b(family\s*law|marriage|divorce|dower|khula|nikah|mahr|matrimonial|"
            r"نکاح|طلاق|خلع|مہر|گھرانہ|ازدواجی|شادی|عقد)\b",
            re.I,
        ),
        "family law marriage divorce khula dower nikah guardianship",
    ),
]


def _has_urdu(text: str) -> bool:
    return bool(re.search(r"[\u0600-\u06FF]", text))


def expand_queries(text: str, *, max_queries: int = 2) -> list[str]:
    """Return up to ``max_queries`` search strings: original plus English expansions."""
    cleaned = (text or "").strip()
    if not cleaned:
        return []

    queries: list[str] = [cleaned]
    english_parts: list[str] = []

    for urdu_term, english_hint in _URDU_TO_ENGLISH.items():
        if urdu_term in cleaned:
            english_parts.append(english_hint)

    for pattern, hint in _TOPIC_HINTS:
        if pattern.search(cleaned):
            english_parts.append(hint)

    if english_parts:
        expanded = " ".join(dict.fromkeys(english_parts))  # dedupe, preserve order
        queries.append(expanded)
    elif _has_urdu(cleaned) and any(k in cleaned for k in ("چوری", "ڈکیتی", "قتل", "جرم", "سزا")):
        queries.append(
            "Pakistan Penal Code criminal offence punishment theft robbery murder"
        )
    elif _has_urdu(cleaned) and any(
        k in cleaned for k in ("نکاح", "طلاق", "خلع", "مہر", "گھرانہ", "ازدواجی", "شادی", "عقد", "وراثت")
    ):
        queries.append(
            "family law marriage divorce khula dower nikah guardianship inheritance"
        )

    cap = max(1, max_queries)
    return list(dict.fromkeys(queries))[:cap]
