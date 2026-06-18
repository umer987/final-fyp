# Penal — Pakistan Penal Code (PPC)

Place **text-based** Pakistan Penal Code PDFs or plain `.txt` files here.

## Recommended files

| File | Source |
|------|--------|
| `Pakistan Penal Code 1860.pdf` | [Federal Ministry of Human Rights (FMU)](https://www.fmu.gov.pk/docs/laws/Pakistan%20Penal%20Code.pdf) |
| `Pakistan Penal Code 1860 (UNODC amendments 2017).pdf` | [UNODC legal database](https://www.unodc.org/cld/uploads/res/document/pak/1860/pakistan_penal_code_1860_html/Pakistan_Penal_Code_1860_incorporating_amendments_to_16_February_2017.pdf) |
| Official PPC page (Print/Download PDF) | [pakistancode.gov.pk — PPC 1860](https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Npa5lo-sg-jjjjjjjjjjjjj) |

You only need **one** good text PDF. If you already have a course PDF named e.g. `Penal Code.pdf`, copy it here as-is.

## Auto-download (optional)

```powershell
cd C:\Users\user\Desktop\final-fyp-main\nlp-service
python scripts/download_legal_data.py --only penal
```

## Ingest (fast — no Azure OCR)

Text-layer PDFs are detected automatically (`[text-pdf]` in console output).

```powershell
python ingest.py --input .\legal_data\penal --save-text
```
