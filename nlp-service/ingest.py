"""Ingest legal documents into the vector store (run when data is available).

Pipeline per file:  extract text -> split into chunks -> embed -> store in Chroma.

Supported inputs:
  - .pdf  — text-layer PDFs use pypdf (fast, no OCR); scanned PDFs use OCR
  - .txt  — plain UTF-8 text (no OCR)

Expected input layout — one subfolder per legal category, e.g.:

    legal_data/
        penal/       <- Pakistan Penal Code (PPC) — theft, murder, fraud, etc.
        family/      <- Family Law 1.pdf, Family Law 3.pdf (marriage, divorce, khula)
        criminal/    <- criminal-law / procedure PDFs
        property/    <- land, rent, acquisition PDFs (optional)

The subfolder name is recorded as the `category` metadata on every chunk.
You can also ingest a single flat folder and tag it with --category.

Example invocations (PowerShell):

    # Whole tree, category inferred from subfolder names:
    python ingest.py --input .\legal_data

    # A single folder, force one category:
    python ingest.py --input .\legal_data\family --category family

    # Wipe and rebuild the index from scratch:
    python ingest.py --input .\legal_data --reset

    # Save extracted text for review / faster re-ingest:
    python ingest.py --input .\legal_data --save-text

    # Retry after a Chroma crash without re-extracting (uses data/ocr_preview/*.txt):
    python ingest.py --input .\legal_data --save-text

Text-layer PDFs from pakistancode.gov.pk and similar sources are detected
automatically — no Azure OCR needed. See legal_data/README.md for download links.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from tqdm import tqdm

from app.services.chunking import split_text
from app.services.ocr import pdf_to_text
from app.services.vectorstore import add_documents

SUPPORTED_SUFFIXES = {".pdf", ".txt"}
PREVIEW_DIR = Path("data/ocr_preview")


def _preview_path(doc_path: Path) -> Path:
    return PREVIEW_DIR / f"{doc_path.stem}.txt"


def _save_text_preview(doc_path: Path, text: str) -> None:
    """Persist extracted text so a later ingest can skip extraction/OCR."""
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    _preview_path(doc_path).write_text(text, encoding="utf-8")


def _load_txt_text(txt_path: Path) -> str:
    return txt_path.read_text(encoding="utf-8")


def _load_pdf_text(pdf_path: Path, *, force_ocr: bool, save_text: bool) -> str | None:
    """Return text for a PDF, using a cached preview when available."""
    preview = _preview_path(pdf_path)
    if not force_ocr and preview.is_file():
        cached = preview.read_text(encoding="utf-8").strip()
        if cached:
            tqdm.write(f"Using cached text preview for {pdf_path.name}")
            return cached

    text = pdf_to_text(str(pdf_path))
    if not text or not text.strip():
        return text
    _save_text_preview(pdf_path, text)
    if save_text:
        tqdm.write(f"Saved text preview for {pdf_path.name} -> {preview}")
    return text


def _load_document_text(
    doc_path: Path,
    *,
    force_ocr: bool,
    save_text: bool,
) -> str | None:
    """Load text from a .txt or .pdf file."""
    suffix = doc_path.suffix.lower()
    if suffix == ".txt":
        preview = _preview_path(doc_path)
        if not force_ocr and preview.is_file():
            cached = preview.read_text(encoding="utf-8").strip()
            if cached:
                tqdm.write(f"Using cached text preview for {doc_path.name}")
                return cached
        text = _load_txt_text(doc_path)
        if text and text.strip():
            _save_text_preview(doc_path, text)
            if save_text:
                tqdm.write(f"Saved text preview for {doc_path.name} -> {preview}")
        return text

    if suffix == ".pdf":
        return _load_pdf_text(doc_path, force_ocr=force_ocr, save_text=save_text)

    return None


def _find_documents(input_dir: Path) -> list[tuple[Path, str]]:
    """Return (document_path, category) pairs for .pdf and .txt files.

    Category = immediate subfolder name relative to input_dir, or 'uncategorized'
    for files sitting directly in input_dir.
    """
    pairs: list[tuple[Path, str]] = []
    for path in sorted(input_dir.rglob("*")):
        if path.suffix.lower() not in SUPPORTED_SUFFIXES:
            continue
        rel = path.relative_to(input_dir)
        if len(rel.parts) > 1:
            category = rel.parts[0]
        else:
            category = (
                input_dir.name
                if input_dir.name.lower() not in {"legal_data", "data", "pdfs", "."}
                else "uncategorized"
            )
        pairs.append((path, category))
    return pairs


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Ingest legal PDFs and .txt files into ChromaDB."
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Folder containing PDFs or .txt files (optionally in category subfolders).",
    )
    parser.add_argument("--category", default=None, help="Force a single category for all files found.")
    parser.add_argument("--chunk-size", type=int, default=1000, help="Chunk size in characters.")
    parser.add_argument("--overlap", type=int, default=150, help="Chunk overlap in characters.")
    parser.add_argument("--dpi", type=int, default=300, help="Rasterization DPI for scanned PDF OCR.")
    parser.add_argument(
        "--save-text",
        action="store_true",
        help="Save extracted text to data/ocr_preview/ for review.",
    )
    parser.add_argument(
        "--force-ocr",
        action="store_true",
        help="Re-extract text even when data/ocr_preview/{stem}.txt already exists.",
    )
    parser.add_argument("--reset", action="store_true", help="Delete the existing Chroma index before ingesting.")
    args = parser.parse_args()

    input_dir = Path(args.input)
    if not input_dir.is_dir():
        raise SystemExit(f"Input folder not found: {input_dir}")

    if args.reset:
        from app.config import settings
        from app.services.vectorstore import reset_index

        try:
            reset_index()
            print(f"Reset Chroma index at {settings.chroma_dir}")
        except RuntimeError as exc:
            raise SystemExit(str(exc)) from exc

    documents = _find_documents(input_dir)
    if not documents:
        raise SystemExit(
            f"No .pdf or .txt files found under {input_dir}\n"
            "Place files in legal_data/penal/, legal_data/family/, etc. — see legal_data/README.md"
        )

    if args.save_text:
        PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

    total_chunks = 0
    for doc_path, inferred_category in tqdm(documents, desc="Documents", unit="file"):
        category = args.category or inferred_category
        try:
            text = _load_document_text(
                doc_path,
                force_ocr=args.force_ocr,
                save_text=args.save_text,
            )
        except Exception as exc:
            tqdm.write(f"!! Text extraction failed for {doc_path.name}: {exc}")
            continue

        if not text or not text.strip():
            tqdm.write(
                f"!! No text extracted from {doc_path.name} "
                "(empty file, or scanned PDF — try OCR_ENGINE=azure)"
            )
            continue

        chunks = split_text(text, chunk_size=args.chunk_size, overlap=args.overlap)
        if not chunks:
            tqdm.write(f"!! No chunks produced from {doc_path.name}")
            continue

        metadatas = [
            {"category": category, "source": doc_path.name, "chunk_index": i}
            for i in range(len(chunks))
        ]
        try:
            added = add_documents(chunks, metadatas)
        except Exception as exc:
            tqdm.write(
                f"!! Indexing failed for {doc_path.name}: {exc}\n"
                f"   Text is in {_preview_path(doc_path)} — re-run ingest without --force-ocr."
            )
            continue
        total_chunks += added
        tqdm.write(f"Indexed {added} chunks from {doc_path.name} ({category})")

    print(f"\nDone. Indexed {total_chunks} chunks from {len(documents)} file(s).")
    if args.save_text:
        print(f"Text previews saved to {PREVIEW_DIR} — review quality before trusting answers.")
    elif any(_preview_path(p).is_file() for p, _ in documents):
        print(f"Re-used cached text previews from {PREVIEW_DIR} where available.")


if __name__ == "__main__":
    main()
