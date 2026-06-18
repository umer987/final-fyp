"""Generate Meeting-logbook-COMPLETED.docx from structured logbook content."""

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

OUTPUT_PATH = r"C:\Users\user\Desktop\final-fyp-main\Meeting-logbook-COMPLETED.docx"


def set_cell_shading(cell, color_hex: str):
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), color_hex)
    cell._tc.get_or_add_tcPr().append(shading)


def add_heading(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)
    return h


def add_label_value_table(doc, rows: list[tuple[str, str]]):
    table = doc.add_table(rows=len(rows), cols=2)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    for i, (label, value) in enumerate(rows):
        table.rows[i].cells[0].text = label
        table.rows[i].cells[1].text = value
        set_cell_shading(table.rows[i].cells[0], "E8EEF4")
        for cell in table.rows[i].cells:
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(10)
    return table


def add_two_col_table(doc, headers: tuple[str, str], rows: list[tuple[str, str]]):
    table = doc.add_table(rows=1 + len(rows), cols=2)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    hdr = table.rows[0].cells
    hdr[0].text = headers[0]
    hdr[1].text = headers[1]
    for cell in hdr:
        set_cell_shading(cell, "1A365D")
        for p in cell.paragraphs:
            for run in p.runs:
                run.font.bold = True
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                run.font.size = Pt(10)
    for i, (col1, col2) in enumerate(rows, start=1):
        table.rows[i].cells[0].text = col1
        table.rows[i].cells[1].text = col2
        for cell in table.rows[i].cells:
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(10)
    return table


def add_section_c(doc, items: list[str]):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.add_run(item)


def add_week_block(
    doc,
    title: str,
    meeting_details: list[tuple[str, str]] | None,
    activities: list[tuple[str, str]],
    agreed_tasks: list[tuple[str, str]],
    challenges: list[str],
    summary: str,
):
    add_heading(doc, title, level=1)
    doc.add_paragraph()

    if meeting_details:
        add_heading(doc, "MEETING DETAILS", level=2)
        add_label_value_table(doc, meeting_details)
        doc.add_paragraph()

    add_heading(doc, "A. Brief description of work done since last meeting", level=2)
    add_two_col_table(doc, ("Date", "Activities"), activities)
    doc.add_paragraph()

    add_heading(doc, "B. Agreed tasks for next meeting", level=2)
    add_two_col_table(doc, ("Proposed Date", "Activities"), agreed_tasks)
    doc.add_paragraph()

    add_heading(doc, "C. Problems / Challenges encountered", level=2)
    add_section_c(doc, challenges)
    doc.add_paragraph()

    add_heading(doc, "SUMMARY OF WEEKLY ACTIVITIES", level=2)
    p = doc.add_paragraph(summary)
    for run in p.runs:
        run.font.size = Pt(10)
    doc.add_paragraph()
    doc.add_page_break()


def build_document():
    doc = Document()

    # Page margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Cover page
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("FYP-2 STUDENT LOGBOOK")
    run.bold = True
    run.font.size = Pt(22)
    run.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)

    doc.add_paragraph()
    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = subtitle.add_run("Meeting Logbook — Weeks 1–15 (Updated)")
    run.font.size = Pt(14)
    run.italic = True

    doc.add_paragraph()
    doc.add_paragraph()

    cover_table = doc.add_table(rows=4, cols=2)
    cover_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cover_data = [
        ("Project Title:", "Voice2Law — AI-Based Urdu/English Legal Information Assistant for Pakistan"),
        ("Student Name:", "Ahmed Ali Ghori"),
        ("Student ID:", "(fill your ID)"),
        ("Supervisor / Co-Supervisor:", "(fill names)"),
    ]
    for i, (label, value) in enumerate(cover_data):
        cover_table.rows[i].cells[0].text = label
        cover_table.rows[i].cells[1].text = value
        set_cell_shading(cover_table.rows[i].cells[0], "E8EEF4")
        for cell in cover_table.rows[i].cells:
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.size = Pt(11)
                    if cell == cover_table.rows[i].cells[0]:
                        run.font.bold = True

    doc.add_paragraph()
    note = doc.add_paragraph(
        "Note: Adjust dates and times to match your actual supervisor meetings before submission."
    )
    note.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in note.runs:
        run.font.size = Pt(9)
        run.font.italic = True
        run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    doc.add_page_break()

    # WEEK 1-4
    add_week_block(
        doc,
        "WEEK 1–4",
        meeting_details=[
            ("Date", "(e.g. Feb 2026)"),
            ("Time", "(e.g. 10:00 AM)"),
            ("Meeting No", "1"),
            ("Next Meeting", "As Scheduled: Yes"),
            ("Mode", "Face-to-face / Virtual (select one)"),
        ],
        activities=[
            ("Week 1", "Finalized FYP topic: bilingual legal assistant for Pakistani citizens. Reviewed problem statement, target users (general public, low literacy), and scope (information only, not legal advice)."),
            ("Week 2", "Literature survey on legal chatbots, RAG systems, speech interfaces, and Urdu NLP. Compared Tesseract vs cloud OCR, Whisper vs commercial STT, and open-source LLMs (Llama, Qwen)."),
            ("Week 3", "Defined system architecture: React frontend, Node.js/Express backend, Python FastAPI NLP microservice, MongoDB, ChromaDB vector store. Drew data-flow diagram (voice/text → STT → RAG → LLM → TTS)."),
            ("Week 4", "Set up development environment (Node.js, Python venv, MongoDB, Git). Created repository structure: src/ (frontend), backend/, nlp-service/. Prepared initial project timeline for Weeks 5–15."),
        ],
        agreed_tasks=[
            ("Week 5", "Implement basic frontend UI (landing, text bot, voice bot pages) and backend skeleton with MongoDB connection."),
        ],
        challenges=[
            "Selecting a free/low-cost stack suitable for FYP budget (avoided paid APIs where possible).",
            "Urdu legal datasets are scarce; decided to use scanned English legal PDFs with Urdu query support via translation/expansion at retrieval time.",
            "Scope control: distinguishing legal information from legal advice for ethical disclaimers in UI.",
        ],
        summary="Completed project initiation and planning for Voice2Law. Conducted literature review on RAG-based legal assistants, Urdu speech interfaces, and microservice architecture. Finalized three-tier design (frontend, backend API, NLP service) and established the Git repository and dev environment. Documented requirements for bilingual (Urdu/English) input/output, lawyer directory, and admin panel.",
    )

    weeks = [
        (
            "WEEK 5",
            [("Week 5", "Built React 18 + TypeScript + Vite frontend with Tailwind/Radix UI. Implemented pages: Home, Text Assistant, Voice Assistant, Find Lawyers, Sign-in/Sign-up, Admin dashboard. Connected frontend to backend via VITE_API_URL.")],
            [("Week 6", "Complete backend REST API: auth (JWT), user roles, query endpoints, MongoDB models.")],
            ["Aligning Urdu RTL layout with English LTR in the same chat interface.", "Mock data had to be removed gradually as real API endpoints were added."],
            "Developed the main frontend UI for Voice2Law including text and voice assistant interfaces, authentication screens, and admin views. Integrated API client layer and environment configuration for local development on port 5173.",
        ),
        (
            "WEEK 6",
            [("Week 6", "Implemented Node.js/Express backend: MongoDB models (User, Query, Lawyer), JWT authentication, bcrypt password hashing, CORS, rate limiting. Created routes: /api/auth, /api/ask, /api/voice, /api/lawyers, admin routes.")],
            [("Week 7", "Add Google OAuth; wire frontend AuthContext to real backend; test end-to-end login.")],
            ["Port 5000 sometimes already in use (EADDRINUSE) when restarting backend during development.", "MongoDB must be running locally before backend starts."],
            "Built the Voice2Law backend API with Express, MongoDB, and JWT-based authentication. Implemented placeholder endpoints for legal Q&A and voice until NLP service integration in later weeks.",
        ),
        (
            "WEEK 7",
            [("Week 7", "Integrated Google OAuth (GoogleSignInButton, POST /api/auth/google). Stored user name, email, and picture in MongoDB. Fixed origin_mismatch by using localhost consistently. Removed mock data from AuthContext, TextBot, VoiceBot, FindLawyersPage, and admin pages.")],
            [("Week 8", "Start NLP microservice (FastAPI): embeddings, ChromaDB, ingest pipeline for legal PDFs.")],
            ["Google OAuth origin_mismatch when using 127.0.0.1 instead of localhost — resolved by standardizing URLs in Google Console and frontend."],
            "Connected frontend authentication to the live backend. Implemented Google Sign-In and replaced mock components with real API calls. Verified user session persistence via /api/auth/me.",
        ),
        (
            "WEEK 8 (Progress evaluation — Introduction + Literature)",
            [("Week 8", "Created Python FastAPI NLP service (nlp-service/). Implemented config, health endpoint, ChromaDB vector store, sentence-transformers embeddings, text chunking, and ingest.py CLI. Prepared legal PDF folders: criminal/, property/, penal/, family/.")],
            [("Week 9", "OCR pipeline for scanned PDFs; system design documentation update.")],
            ["Scanned legal PDFs are large (278 and 586 pages); Tesseract OCR was too slow for practical ingest.", "ChromaDB on Windows occasionally throws PermissionError when resetting index — added retry logic."],
            "Initiated Phase 3 NLP microservice with FastAPI, ChromaDB, and local embeddings. Designed ingest workflow for legal PDFs. Prepared for OCR integration and RAG-based question answering.",
        ),
        (
            "WEEK 9 (Progress evaluation — System Design + Prototyping)",
            [("Week 9", "Documented system design: API contracts between backend and NLP (POST /ask, /transcribe, /tts). Prototyped Azure Document Intelligence OCR with batch processing. Added pypdf fast path for text-layer PDFs (PPC, family law).")],
            [("Week 10", "Run full ingest on criminal and property PDFs; index chunks in ChromaDB.")],
            ["Initial Azure OCR attempts failed with ConnectionResetError on full PDF upload — fixed by batching pages.", "Deprecated Hugging Face api-inference endpoint caused later LLM/STT failures — migrated to router.huggingface.co."],
            "Completed system design for NLP integration and prototyped Azure OCR for scanned legal documents. Defined batch OCR strategy and backend–NLP service URLs and payload formats.",
        ),
        (
            "WEEK 10",
            [("Week 10", "Ran Azure OCR on Criminal law DataSet.pdf (278 pages, 12 batches) and LAND PROPERTY.pdf (586 pages, 24 batches). Saved OCR previews to data/ocr_preview/. Indexed 1893 property chunks; criminal indexing initially failed at ChromaDB step.")],
            [("Week 11", "Fix ChromaDB corruption; complete criminal indexing; ingest PPC and family law PDFs.")],
            ["ChromaDB KeyError _type on corrupted data/chroma from failed prior runs — resolved by deleting folder and auto-recovery in vectorstore.py.", "InvalidCollectionException when indexing second PDF — fixed with batched adds (150 chunks) and collection refresh.", "OCR preview caching added so retries skip expensive Azure re-OCR."],
            "Processed two large legal PDFs via Azure Document Intelligence OCR with batching and caching. Built vector index for property law (1893 chunks). Debugged ChromaDB indexing failures on Windows and implemented recovery and batch insert logic.",
        ),
        (
            "WEEK 11",
            [("Week 11", "Completed criminal ingest (765 chunks). Ingested Pakistan Penal Code and Family law PDFs via pypdf (487 + 59 chunks). Final index: 6352 chunks across penal, family, criminal, property. Patched Chroma telemetry. Added tf-keras to requirements.txt.")],
            [("Week 12", "Integrate STT (Whisper) and connect backend /api/voice to NLP service.")],
            ["Partial ingest until all four PDF categories processed.", "Chroma telemetry warnings — patched in vectorstore.py.", "sentence-transformers required tf-keras on Windows."],
            "Successfully indexed all four legal datasets into ChromaDB (6352 total chunks). Implemented OCR caching, pypdf fast ingest, and index verification.",
        ),
        (
            "WEEK 12",
            [("Week 12", "Integrated Whisper STT via Hugging Face. Implemented POST /transcribe and STT_ENGINE=whisper. Wired MediaRecorder in VoiceBot. Added Urdu script normalization (urdu_script.py, aksharamukha) for Hindi Devanagari to Urdu Arabic conversion.")],
            [("Week 13", "Connect /api/ask to NLP RAG+LLM; fix CORS and port alignment.")],
            ["ElevenLabs lacked speech_to_text permission — used free Whisper.", "Whisper output Hindi Devanagari for Urdu speech — fixed with urdu_script.py.", "Port 8000 blocked — standardized NLP on 8001."],
            "Implemented voice input with Whisper STT and Urdu script correction. Resolved STT integration issues.",
        ),
        (
            "WEEK 13 (Progress evaluation — Implementation + Testing)",
            [("Week 13", "Connected backend /api/ask and voice to NLP RAG + Llama 3.2 3B. Fixed CORS and port 8001 alignment. Urdu query expansion in retrieval.py. Extractive RAG fallback when LLM slow. Fixed embeddings with tf-keras. Tuned RAG (RETRIEVAL_K=4, max_context_chars=1200).")],
            [("Week 14", "Add TTS, Postman testing, lawyer directory, Voice UI scroll, Google profile in navbar.")],
            ["LLM errors on deprecated api-inference host — fixed with HF router.", "Duplicate NLP on 8001 caused ECONNRESET.", "Embeddings failed without tf-keras."],
            "Achieved functional text and voice Q&A using RAG over 6352 chunks and Llama 3.2 3B. Resolved connectivity, CORS, LLM routing, and cross-lingual retrieval.",
        ),
        (
            "WEEK 14",
            [("Week 14", "TTS via mms-tts-urd with browser fallback. Auto TTS after voice answers. Fixed VoiceBot scroll CSS. Postman collection for all APIs. Lawyer seed data (npm run seed:lawyers). Navbar: Google photo + name + Sign out.")],
            [("Week 15", "Final integration testing, performance optimization, FYP demo rehearsal.")],
            ["Urdu answers clipped in modal — fixed scroll.", "Find Lawyers cards restored with seed data.", "First LLM/TTS call slow on HF cold start."],
            "Completed TTS and auto voice playback. Postman API tests and lawyer directory. Google profile in navbar. Fixed Voice Assistant scrolling.",
        ),
        (
            "WEEK 15",
            [("Week 15", "Final polish: reverted Hero to original layout. React.lazy code-splitting (~118 KB bundle). Google OAuth deferred to sign-in pages. Voice queries save userId. docs/STARTUP.md and start_nlp.ps1. Full E2E testing with 6352 chunks.")],
            [("—", "FYP final presentation / report submission (as per department schedule).")],
            ["Services start order: MongoDB → NLP → backend → frontend.", "Only one uvicorn on port 8001.", "Accept Llama license on Hugging Face."],
            "Completed final testing and polish. All features operational: bilingual Q&A from 6352 chunks, Urdu TTS, Google auth, lawyer directory, Postman tests. Documented in docs/STARTUP.md.",
        ),
    ]

    for title, activities, agreed, challenges, summary in weeks:
        add_week_block(doc, title, None, activities, agreed, challenges, summary)

    # Appendix: Technical stack reference
    add_heading(doc, "APPENDIX — Technical Stack Reference", level=1)
    add_two_col_table(
        doc,
        ("Layer", "Technology"),
        [
            ("Frontend", "React 18, TypeScript, Vite (lazy routes), Tailwind, Radix UI"),
            ("Backend", "Node.js, Express, MongoDB, JWT, Google OAuth"),
            ("NLP", "FastAPI, ChromaDB, sentence-transformers, Azure OCR, Whisper STT, Llama 3.2 3B, mms-tts-urd"),
            ("Data", "6 legal PDFs → 6352 vector chunks (penal, family, criminal, property)"),
            ("Testing", "Postman collection + local environment"),
        ],
    )
    doc.add_paragraph()
    add_heading(doc, "Commands to Run System (Demo)", level=2)
    add_heading(doc, "Sample Demo Questions (Text + Voice)", level=2)
    demo_qs = [
        "چوری کی سزا کیا ہے؟ — Theft punishment (PPC)",
        "نکاح کی شرائط کیا ہیں؟ — Marriage conditions (family law)",
        "ضمانت کب ملتی ہے؟ — Bail (criminal procedure)",
    ]
    for q in demo_qs:
        p = doc.add_paragraph(q, style="List Bullet")
        for run in p.runs:
            run.font.size = Pt(10)
    doc.add_paragraph()

    commands = [
        "Terminal 1 — MongoDB: Get-Service MongoDB | Start-Service",
        "Terminal 2 — NLP: cd nlp-service; .\\venv\\Scripts\\Activate.ps1; uvicorn app.main:app --reload --port 8001",
        "Terminal 3 — Backend: cd backend; npm run dev",
        "Terminal 4 — Frontend: npm run dev",
        "Seed lawyers: cd backend; npm run seed:lawyers",
    ]
    for cmd in commands:
        p = doc.add_paragraph(cmd, style="List Bullet")
        for run in p.runs:
            run.font.size = Pt(9)
            run.font.name = "Consolas"

    doc.save(OUTPUT_PATH)
    return OUTPUT_PATH


if __name__ == "__main__":
    path = build_document()
    print(f"Created: {path}")
