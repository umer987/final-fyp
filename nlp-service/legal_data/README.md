# Legal data — folder layout & download guide

Place Pakistan legal documents here before running `ingest.py`. Supported formats:

- **`.pdf`** — text-layer PDFs (Pakistan Code, FMU, etc.) use fast pypdf extraction; scanned PDFs fall back to OCR
- **`.txt`** — plain UTF-8 text (no OCR)

## Folder layout

```
legal_data/
  penal/       Pakistan Penal Code (PPC) — theft, murder, fraud, bail, etc.
  family/      Family Law 1 & 3 — marriage, nikah, divorce, khula, dower
  criminal/    Criminal procedure & related materials (existing dataset)
  property/    Land, rent, acquisition (optional)
```

The **subfolder name** becomes the `category` metadata used during retrieval.

## Your 3 new documents

| Document | Folder | Notes |
|----------|--------|-------|
| Penal Code (PPC) | `penal/` | Text PDF from pakistancode.gov.pk or FMU |
| Family Law 1 | `family/` | Usually Muslim Family Laws Ordinance 1961 |
| Family Law 3 | `family/` | Usually Dissolution of Muslim Marriages Act 1939 |

Copy your PDFs into the matching folders. See `penal/README.md` and `family/README.md` for direct download links.

## Option A — download yourself (recommended)

1. Open [pakistancode.gov.pk](https://pakistancode.gov.pk/)
2. Search for **Pakistan Penal Code**, **Muslim Family Laws Ordinance**, **Dissolution of Muslim Marriages Act**
3. Click **Print/Download PDF** on each law page
4. Save into `legal_data/penal/` and `legal_data/family/`

Direct PDF links (public / government):

- PPC: https://www.fmu.gov.pk/docs/laws/Pakistan%20Penal%20Code.pdf
- MFLO 1961: https://www.mora.gov.pk/SiteImage/Misc/files/MFLO%2C%201961.pdf
- Dissolution 1939: https://pakistancode.gov.pk/pdffiles/administratorfb32d6015ae887e6d6b85018961842ea.pdf

## Option B — auto-download script

```powershell
cd C:\Users\user\Desktop\final-fyp-main\nlp-service
python scripts/download_legal_data.py
```

Downloads known public PDFs into `penal/` and `family/`. Re-run is safe (skips existing files).

## Ingest — fast path (no Azure OCR)

Text-layer PDFs are detected automatically. Console shows `[text-pdf] Using embedded text … — skipping OCR.`

```powershell
# All categories:
python ingest.py --input .\legal_data --save-text

# One category:
python ingest.py --input .\legal_data\penal --save-text
python ingest.py --input .\legal_data\family --save-text

# Rebuild index from scratch:
python ingest.py --input .\legal_data --reset --save-text
```

You do **not** need `OCR_ENGINE=azure` or Azure credentials for text-based PDFs.

### Text PDF detection

- pypdf extracts embedded text from every page
- If total chars ≥ **500 per 10 pages** (min 200 chars), the file is treated as text-based
- Otherwise ingest falls back to Tesseract or Azure OCR (for scanned CamScanner PDFs)

### Cached text

`--save-text` writes `data/ocr_preview/{filename-stem}.txt`. Re-running ingest reuses these files unless you pass `--force-ocr`.

## Plain `.txt` files

Drop `.txt` copies of statutes directly in `penal/` or `family/`. Ingest reads them with no OCR step.
