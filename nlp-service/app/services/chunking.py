"""Simple character-based text splitter with overlap for RAG ingestion."""
from __future__ import annotations


def split_text(
    text: str,
    chunk_size: int = 1000,
    overlap: int = 150,
) -> list[str]:
    """Split ``text`` into overlapping chunks of ~``chunk_size`` characters.

    Overlap keeps sentences that straddle a boundary retrievable from both
    neighbouring chunks. Splitting prefers a nearby whitespace so we don't cut
    mid-word.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    text = text.strip()
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    length = len(text)

    while start < length:
        end = min(start + chunk_size, length)

        # Try to end on a whitespace boundary (look back up to 100 chars).
        if end < length:
            window = text.rfind(" ", start + chunk_size - 100, end)
            if window != -1 and window > start:
                end = window

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= length:
            break
        start = end - overlap

    return chunks
