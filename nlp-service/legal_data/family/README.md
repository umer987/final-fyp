# Family — marriage, divorce, khula, dower

Place **Family Law 1.pdf**, **Family Law 3.pdf**, or individual statute PDFs / `.txt` files here.

Typical contents:

- **Family Law 1** — Muslim Family Laws Ordinance 1961 (nikah registration, polygamy, talaq)
- **Family Law 3** — Dissolution of Muslim Marriages Act 1939 (khula, judicial dissolution grounds)

## Recommended downloads

| File | Source |
|------|--------|
| `Muslim Family Laws Ordinance 1961.pdf` | [Ministry of Religious Affairs](https://www.mora.gov.pk/SiteImage/Misc/files/MFLO%2C%201961.pdf) |
| `Dissolution of Muslim Marriages Act 1939.pdf` | [Pakistan Code PDF](https://pakistancode.gov.pk/pdffiles/administratorfb32d6015ae887e6d6b85018961842ea.pdf) |
| MFLO official page | [pakistancode.gov.pk — MFLO 1961](https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5po-sg-jjjjjjjjjjjjj) |
| Dissolution official page | [pakistancode.gov.pk — Dissolution 1939](https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-cJaW-sg-jjjjjjjjjjjjj) |

If your course packs are named `Family Law 1.pdf` and `Family Law 3.pdf`, copy those files here directly.

## Auto-download (optional)

```powershell
cd C:\Users\user\Desktop\final-fyp-main\nlp-service
python scripts/download_legal_data.py --only family
```

## Ingest (fast — no Azure OCR)

```powershell
python ingest.py --input .\legal_data\family --save-text
```
