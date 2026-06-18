Voice2Law — Legal document placement guide
==========================================

See README.md in this folder for download links, text-PDF fast path, and ingest steps.

Place each PDF or .txt file in the subfolder that matches its legal domain.
The subfolder name becomes the "category" metadata used during retrieval.
Text-layer PDFs (Pakistan Code, FMU) skip Azure OCR automatically.

Folder layout
-------------

  legal_data/
    penal/       Pakistan Penal Code (PPC) — theft, robbery, murder, fraud, etc.
    family/      Family / marriage law statutes
    criminal/    Criminal procedure & related criminal-law materials
    property/    Land, rent, acquisition, tenancy (add when available)

Where to put your PDFs
----------------------

  penal/
    -> Pakistan Penal Code (PPC) PDF or .txt
       Download: see penal/README.md or run scripts/download_legal_data.py --only penal

  family/
    -> Family Law 1.pdf, Family Law 3.pdf, or individual statute PDFs/.txt
       Download: see family/README.md or run scripts/download_legal_data.py --only family

  criminal/
    -> Criminal law DataSet.pdf   (already present)

  property/
    -> LAND PROPERTY .pdf   (already present)
       Add other rent / land-acquisition PDFs here as needed

After copying PDFs — ingest commands (PowerShell, from nlp-service/)
--------------------------------------------------------------------

  cd C:\Users\user\Desktop\final-fyp-main\nlp-service

  # Ingest everything (recommended first run):
  python ingest.py --input .\legal_data --save-text

  # Or ingest one category at a time:
  python ingest.py --input .\legal_data\penal --save-text
  python ingest.py --input .\legal_data\family --save-text
  python ingest.py --input .\legal_data\criminal --save-text
  python ingest.py --input .\legal_data\property --save-text

  # Wipe the vector index and rebuild from scratch:
  python ingest.py --input .\legal_data --reset --save-text

  # Retry after a crash without re-running OCR (uses cached text):
  python ingest.py --input .\legal_data --save-text

Notes
-----

  - Text-layer PDFs: ingest prints [text-pdf] and skips OCR (no Azure needed).
  - Scanned PDFs only: set OCR_ENGINE=azure in .env (batches print as [azure-ocr]).
  - Text previews saved to data/ocr_preview/{stem}.txt with --save-text.
  - Spot-check data/ocr_preview/ before trusting answers in production.
