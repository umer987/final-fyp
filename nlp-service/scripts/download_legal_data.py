"""Download official/public-domain Pakistan legal PDFs into legal_data/.

Run from nlp-service/ (PowerShell):

    python scripts/download_legal_data.py
    python scripts/download_legal_data.py --only penal
    python scripts/download_legal_data.py --only family

These PDFs are text-layer (selectable text). Ingest will use pypdf directly —
no Azure OCR or Tesseract needed.

If a URL fails, download manually from the links in legal_data/README.md and
place files in the folders shown below.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
LEGAL_DATA = ROOT / "legal_data"

# Direct PDF URLs (government / public legal archives).
DOWNLOADS: dict[str, list[tuple[str, str]]] = {
    "penal": [
        (
            "Pakistan Penal Code 1860.pdf",
            "https://www.fmu.gov.pk/docs/laws/Pakistan%20Penal%20Code.pdf",
        ),
        (
            "Pakistan Penal Code 1860 (UNODC amendments 2017).pdf",
            "https://www.unodc.org/cld/uploads/res/document/pak/1860/"
            "pakistan_penal_code_1860_html/"
            "Pakistan_Penal_Code_1860_incorporating_amendments_to_16_February_2017.pdf",
        ),
    ],
    "family": [
        (
            "Muslim Family Laws Ordinance 1961.pdf",
            "https://www.mora.gov.pk/SiteImage/Misc/files/MFLO%2C%201961.pdf",
        ),
        (
            "Dissolution of Muslim Marriages Act 1939.pdf",
            "https://pakistancode.gov.pk/pdffiles/"
            "administratorfb32d6015ae887e6d6b85018961842ea.pdf",
        ),
    ],
}


def _download(url: str, dest: Path, timeout: int = 120) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.is_file() and dest.stat().st_size > 10_000:
        print(f"  skip (exists): {dest.name}")
        return

    print(f"  fetching: {url}")
    response = requests.get(url, timeout=timeout, stream=True)
    response.raise_for_status()
    dest.write_bytes(response.content)
    print(f"  saved: {dest} ({dest.stat().st_size:,} bytes)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Download Pakistan legal PDFs into legal_data/")
    parser.add_argument(
        "--only",
        choices=sorted(DOWNLOADS),
        help="Download only penal or family category",
    )
    parser.add_argument("--force", action="store_true", help="Re-download even if file exists")
    args = parser.parse_args()

    categories = [args.only] if args.only else sorted(DOWNLOADS)
    errors: list[str] = []

    for category in categories:
        out_dir = LEGAL_DATA / category
        print(f"\n[{category}] -> {out_dir}")
        for filename, url in DOWNLOADS[category]:
            dest = out_dir / filename
            if args.force and dest.is_file():
                dest.unlink()
            try:
                _download(url, dest)
            except Exception as exc:
                msg = f"{category}/{filename}: {exc}"
                errors.append(msg)
                print(f"  FAILED: {msg}")

    if errors:
        print("\nSome downloads failed. Manual options:")
        print("  - Pakistan Code: https://pakistancode.gov.pk/ (Print/Download PDF on each act)")
        print("  - See legal_data/README.md for folder placement and ingest commands")
        sys.exit(1)

    print("\nDone. Next step (no Azure OCR needed for text PDFs):")
    print(f"  cd {ROOT}")
    print("  python ingest.py --input .\\legal_data --save-text")


if __name__ == "__main__":
    main()
