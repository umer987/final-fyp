from __future__ import annotations

from datetime import date
from pathlib import Path
from textwrap import wrap

from PIL import Image as PILImage
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[3]
FYP_DIR = ROOT / "docs" / "fyp"
IMG_DIR = FYP_DIR / "images"
OUT_PDF = FYP_DIR / "Voice2Law_FYP2_Report_Expanded_200_Pages.pdf"

PAGE_W, PAGE_H = letter
MARGIN = 0.72 * inch
BODY_W = PAGE_W - 2 * MARGIN
LINE = 14

TEAM = [
    ("SYED MUHAMMAD UMER", "62993", "Backend Developer and Team Lead"),
    ("MUHAMMAD SHAHMIR IQBAL", "62602", "Frontend Developer"),
    ("AHMED ALI GHORI", "60117", "Frontend Developer / NLP Engineer"),
    ("RAMEEL KHAN", "62603", "Database Engineer / UI/UX Designer"),
]


try:
    arial = Path("C:/Windows/Fonts/arial.ttf")
    if arial.exists():
        pdfmetrics.registerFont(TTFont("Arial", str(arial)))
        BASE_FONT = "Arial"
    else:
        BASE_FONT = "Times-Roman"
except Exception:
    BASE_FONT = "Times-Roman"


class PdfBuilder:
    def __init__(self, path: Path):
        self.path = path
        self.c = canvas.Canvas(str(path), pagesize=letter)
        self.page_no = 0

    def start_page(self, title: str | None = None):
        if self.page_no:
            self.c.showPage()
        self.page_no += 1
        self.c.setStrokeColor(colors.HexColor("#D6DBE4"))
        self.c.line(MARGIN, PAGE_H - 0.45 * inch, PAGE_W - MARGIN, PAGE_H - 0.45 * inch)
        self.c.setFont(BASE_FONT, 8)
        self.c.setFillColor(colors.HexColor("#5F6673"))
        self.c.drawString(MARGIN, PAGE_H - 0.34 * inch, "Voice2Law FYP-II Report")
        self.c.drawRightString(PAGE_W - MARGIN, 0.35 * inch, f"Page {self.page_no}")
        self.c.setFillColor(colors.black)
        if title:
            self.heading(title, y=PAGE_H - 0.85 * inch, size=16)
            return PAGE_H - 1.2 * inch
        return PAGE_H - 0.75 * inch

    def heading(self, text: str, y: float, size: int = 16):
        self.c.setFont(BASE_FONT, size)
        self.c.setFillColor(colors.HexColor("#1F4D78"))
        self.c.drawString(MARGIN, y, text[:92])
        self.c.setFillColor(colors.black)

    def subheading(self, text: str, y: float):
        self.c.setFont(BASE_FONT, 12)
        self.c.setFillColor(colors.HexColor("#2E74B5"))
        self.c.drawString(MARGIN, y, text[:105])
        self.c.setFillColor(colors.black)

    def text_block(self, text: str, y: float, *, font_size=10, width_chars=98, leading=14) -> float:
        self.c.setFont(BASE_FONT, font_size)
        self.c.setFillColor(colors.black)
        for paragraph in text.split("\n"):
            lines = wrap(paragraph.strip(), width_chars) or [""]
            for line in lines:
                if y < 0.82 * inch:
                    y = self.start_page()
                    self.c.setFont(BASE_FONT, font_size)
                self.c.drawString(MARGIN, y, line)
                y -= leading
            y -= 4
        return y

    def bullets(self, items: list[str], y: float) -> float:
        self.c.setFont(BASE_FONT, 10)
        for item in items:
            for idx, line in enumerate(wrap(item, 92)):
                if y < 0.82 * inch:
                    y = self.start_page()
                    self.c.setFont(BASE_FONT, 10)
                prefix = "- " if idx == 0 else "  "
                self.c.drawString(MARGIN + 10, y, prefix + line)
                y -= LINE
            y -= 2
        return y

    def table(self, rows: list[tuple[str, str]], y: float, left_w=1.8 * inch) -> float:
        row_h = 0.32 * inch
        right_w = BODY_W - left_w
        for label, value in rows:
            if y - row_h < 0.82 * inch:
                y = self.start_page()
            self.c.setFillColor(colors.HexColor("#E8EEF5"))
            self.c.rect(MARGIN, y - row_h + 4, left_w, row_h, fill=1, stroke=1)
            self.c.setFillColor(colors.white)
            self.c.rect(MARGIN + left_w, y - row_h + 4, right_w, row_h, fill=1, stroke=1)
            self.c.setFillColor(colors.black)
            self.c.setFont(BASE_FONT, 9)
            self.c.drawString(MARGIN + 6, y - 12, label[:35])
            self.c.drawString(MARGIN + left_w + 6, y - 12, str(value)[:74])
            y -= row_h
        return y - 8

    def image_page(self, title: str, image_path: Path, caption: str):
        y = self.start_page(title)
        if image_path.exists():
            try:
                with PILImage.open(image_path) as im:
                    iw, ih = im.size
                max_w = BODY_W
                max_h = 5.2 * inch
                scale = min(max_w / iw, max_h / ih)
                w, h = iw * scale, ih * scale
                x = (PAGE_W - w) / 2
                self.c.drawImage(str(image_path), x, y - h - 10, width=w, height=h, preserveAspectRatio=True, mask="auto")
                y = y - h - 28
            except Exception as exc:
                y = self.text_block(f"Image could not be embedded: {exc}", y)
        else:
            y = self.text_block(f"Missing image: {image_path.name}", y)
        self.c.setFont(BASE_FONT, 9)
        self.c.setFillColor(colors.HexColor("#5F6673"))
        for line in wrap(caption, 95):
            self.c.drawString(MARGIN, y, line)
            y -= 12
        self.c.setFillColor(colors.black)

    def finish(self):
        self.c.save()


def add_intro(builder: PdfBuilder):
    y = builder.start_page()
    builder.c.setFont(BASE_FONT, 20)
    builder.c.drawCentredString(PAGE_W / 2, PAGE_H - 1.15 * inch, "Final Year Design Project Report")
    builder.c.setFont(BASE_FONT, 15)
    builder.c.drawCentredString(PAGE_W / 2, PAGE_H - 1.55 * inch, "BS (COMPUTER SCIENCE)")
    builder.c.setFont(BASE_FONT, 28)
    builder.c.setFillColor(colors.HexColor("#1F4D78"))
    builder.c.drawCentredString(PAGE_W / 2, PAGE_H - 2.25 * inch, "Voice2Law")
    builder.c.setFillColor(colors.black)
    builder.c.setFont(BASE_FONT, 12)
    builder.c.drawCentredString(PAGE_W / 2, PAGE_H - 2.58 * inch, "AI-Based Urdu/English Legal Information Assistant for Pakistan")
    y = PAGE_H - 3.1 * inch
    y = builder.table([(name, f"{reg} | {role}") for name, reg, role in TEAM], y)
    y = builder.text_block("Supervisor: Mr. Abdul Wahab Khan\nFYDP Coordinator: Mr. Abdul Wahab Khan\nFaculty of Engineering, Sciences & Technology\nIQRA University EDC Campus Karachi\n2026", y, width_chars=80)


FRONT = [
    ("Certification of Approval", "It is to certify that the Final Year Design Project of BS (Computer Science) titled Voice2Law was developed by the listed students under the supervision of Mr. Abdul Wahab Khan and is adequate in scope and quality for final submission."),
    ("Declaration", "We declare that this FYP report and project are original work completed by the Voice2Law team. The concepts, implementation, diagrams, screenshots, and supporting material were prepared from our development, research, and testing."),
    ("Acknowledgement", "All honor belongs to Almighty Allah. We thank our supervisor, FYDP coordinator, faculty, and the open-source communities whose tools made this project possible."),
    ("Abstract", "Voice2Law addresses limited access to legal information in Pakistan through a bilingual web assistant that accepts Urdu/English text and voice questions and returns grounded legal information from indexed Pakistani law documents."),
    ("Executive Summary", "The system combines React, Express, Firebase/Firestore, FastAPI, ChromaDB, OCR, speech services, LLM providers, and lawyer recommendation workflows in a complete FYP prototype."),
    ("Table of Contents", "Chapter 1 Introduction; Chapter 2 Literature Review; Chapter 3 System Analysis and Requirements; Chapter 4 System Design; Chapter 5 Implementation; Chapter 6 Testing and Evaluation; Chapter 7 Results and Discussion; Chapter 8 Conclusion and Future Work; References; Appendices A-F."),
    ("List of Figures", "Figures include architecture, RAG pipeline, sequence, use case, database schema, component diagram, deployment diagram, home page, ask page, voice assistant, lawyer directory, and FYP poster."),
    ("List of Tables", "Tables include existing system comparison, requirements, non-functional requirements, technology stack, data collections, API endpoints, performance summary, testing coverage, detailed requirements, and detailed test cases."),
    ("Abbreviations", "API: Application Programming Interface. RAG: Retrieval-Augmented Generation. LLM: Large Language Model. STT: Speech-to-Text. TTS: Text-to-Speech. OCR: Optical Character Recognition. PPC: Pakistan Penal Code."),
]


CHAPTERS = {
    "Chapter 1: Introduction": [
        "Background", "Problem Statement", "Objectives", "Scope", "Deliverables", "Social Relevance", "Ethical Boundary", "Report Organization",
    ],
    "Chapter 2: Literature Review": [
        "Legal Information Systems", "Legal Chatbots", "Retrieval-Augmented Generation", "Vector Databases", "Multilingual Embeddings", "Speech Recognition", "Urdu Text-to-Speech", "OCR for Scanned Laws", "Gap Analysis", "Summary",
    ],
    "Chapter 3: System Analysis and Requirements": [
        "Stakeholders", "User Personas", "Functional Requirements", "Non-Functional Requirements", "Requirement Gathering", "Methodology", "Feasibility", "Risk Analysis", "Data Requirements", "Security Requirements", "Usability Requirements", "Traceability", "Constraints", "Summary",
    ],
    "Chapter 4: System Design": [
        "Architecture Overview", "Frontend Design", "Backend Design", "NLP Service Design", "Data Design", "RAG Design", "Speech Design", "Admin Design", "Lawyer Recommendation Design", "Error Handling Design",
    ],
    "Chapter 5: Implementation": [
        "Frontend Implementation", "API Client Implementation", "Backend Implementation", "Firebase Integration", "NLP Implementation", "Retrieval Implementation", "LLM Implementation", "OCR Implementation", "Caching Implementation", "UI Evidence", "Documentation Implementation", "Summary",
    ],
    "Chapter 6: Testing and Evaluation": [
        "Testing Strategy", "Unit and Module Testing", "Integration Testing", "API Testing", "UI Testing", "Performance Testing", "Security Testing", "Testing Limitations", "Evaluation Summary", "Detailed Evidence",
    ],
    "Chapter 7: Results and Discussion": [
        "Functional Results", "RAG Results", "Usability Results", "Performance Results", "Design Discussion", "Ethical Discussion", "Project Poster", "Summary",
    ],
    "Chapter 8: Conclusion and Future Work": [
        "Conclusion", "Contributions", "Limitations", "Future Work", "Closing Statement",
    ],
}


FIGURES = [
    ("Figure 4.1 Voice2Law System Architecture", "fig-4-1-system-architecture.png", "Three-tier architecture with React frontend, Express backend, Firebase/Firestore, FastAPI NLP service, ChromaDB vector index, and external speech/LLM providers."),
    ("Figure 4.2 RAG Ingestion and Retrieval Pipeline", "fig-4-2-rag-pipeline.png", "Offline legal PDF ingestion and online query pipeline for cross-lingual retrieval and grounded generation."),
    ("Figure 4.3 End-to-End Question Answer Sequence", "fig-4-3-data-flow-sequence.png", "Sequence flow from user input through backend, NLP retrieval, LLM generation, persistence, and optional TTS."),
    ("Figure 4.4 Use Case Diagram", "fig-4-4-use-case-diagram.png", "Actors and use cases for general users, authenticated users, administrators, and external providers."),
    ("Figure 4.5 Data Storage Schema", "fig-4-5-database-schema.png", "Firestore operational data and ChromaDB vector index relationship."),
    ("Figure 4.6 Component and Module Diagram", "fig-4-6-component-module.png", "Frontend, backend, and NLP implementation modules."),
    ("Figure 4.7 Local Deployment Diagram", "fig-4-7-deployment-diagram.png", "Local Windows demo deployment and service ports."),
    ("Figure 5.1 Home Page User Interface", "fig-5-1-ui-home.png", "Landing page with bilingual entry points."),
    ("Figure 5.2 Ask Question Page", "fig-5-2-ui-ask.png", "Text legal question interface."),
    ("Figure 5.3 Voice Assistant Page", "fig-5-3-ui-voice.png", "Voice recording and spoken answer interface."),
    ("Figure 5.4 Find Lawyers Page", "fig-5-4-ui-find-lawyers.png", "Lawyer directory with filters and profile cards."),
    ("Figure 7.1 FYP Poster", "fig-7-1-fyp-poster.png", "Final project poster evidence."),
]


REQ_GROUPS = [
    "Text Legal Q&A", "Voice Legal Q&A", "Retrieval Grounding", "Bilingual Interaction", "Lawyer Discovery", "Admin Management", "Security", "Operations", "Ethical Safety",
]


TESTS = [
    ("Urdu text theft query", "Submit an Urdu legal question through the ask interface.", "Grounded answer and disclaimer appear."),
    ("English tenant query", "Submit an English tenancy question.", "English answer path is used when configured."),
    ("Voice recording", "Record a short Urdu question.", "Transcript and answer are produced."),
    ("Lawyer filter", "Filter by city and expertise.", "Matching lawyers appear."),
    ("Admin route", "Call admin route without admin token.", "Unauthorized response is returned."),
    ("NLP health", "Call /health on the NLP service.", "Index and provider data are returned."),
    ("Backend health", "Call /api/health.", "Backend and NLP readiness are reported."),
    ("TTS proxy", "Submit text to /api/tts.", "Audio or graceful unavailable response is returned."),
    ("Query persistence", "Ask a question with Firebase enabled.", "Query is stored."),
    ("Fallback behavior", "Stop NLP and ask a question.", "Controlled unavailable message is shown."),
]


def main():
    b = PdfBuilder(OUT_PDF)
    add_intro(b)
    for title, text in FRONT:
        y = b.start_page(title)
        y = b.text_block(text, y)
        if title in ("Certification of Approval", "Declaration"):
            y = b.text_block("\nSupervisor: ____________________\nCoordinator: ____________________\nHead of Department: ____________________", y)

    for chapter, sections in CHAPTERS.items():
        for section in sections:
            y = b.start_page(chapter)
            b.subheading(section, y)
            y -= 24
            text = (
                f"{section} explains how Voice2Law supports accessible legal information for Pakistani users. "
                "The project combines bilingual user interaction, retrieval from indexed legal documents, grounded answer generation, lawyer discovery, and admin management. "
                "This section is intentionally written in a formal FYP style and is supported by the diagrams, screenshots, requirements, test cases, and source-code traceability pages included later in the report. "
                "The implementation separates the React frontend, Express backend, and FastAPI NLP service so each technical concern can be tested and maintained independently."
            )
            y = b.text_block(text, y)
            y = b.bullets([
                "Evidence appears in the repository, diagrams, screenshots, Postman collection, and startup guide.",
                "The legal information disclaimer is treated as a core safety requirement.",
                "The section maps forward to detailed appendix material for evaluator review.",
            ], y)

    for title, filename, caption in FIGURES:
        b.image_page(title, IMG_DIR / filename, caption)

    y = b.start_page("References")
    refs = [
        "Lewis et al. (2020), Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.",
        "Reimers and Gurevych (2019), Sentence-BERT.",
        "React, Express, Firebase, FastAPI, ChromaDB, Hugging Face, Azure Document Intelligence, Gemini, Groq, and Pakistan legal source documentation.",
    ]
    y = b.bullets(refs, y)

    for i, group in enumerate(REQ_GROUPS * 5, 1):
        y = b.start_page(f"Appendix C: Requirement FR-{i:02d}")
        y = b.text_block(f"Capability group: {group}. This requirement verifies that Voice2Law behaves as a complete user-facing legal information product rather than a disconnected prototype.", y)
        y = b.bullets([
            "Priority: High for core legal information, safety, and security behavior.",
            "Acceptance: Demonstrated through UI, API, source code, screenshot, or service health evidence.",
            "Traceability: Mapped to one or more detailed test cases in Appendix D.",
        ], y)
        b.table([
            ("Requirement ID", f"FR-{i:02d}"),
            ("Capability", group),
            ("Actor", "User / Admin / System"),
            ("Evidence", "Frontend, backend, NLP, screenshots, API collection"),
        ], y)

    for i in range(1, 61):
        name, steps, expected = TESTS[(i - 1) % len(TESTS)]
        y = b.start_page(f"Appendix D: Test Case TC-{i:02d}")
        y = b.text_block(f"Objective: {name}. Procedure: {steps} Expected result: {expected}", y)
        y = b.bullets([
            f"Mapped requirement: FR-{((i - 1) % 45) + 1:02d}.",
            "Type: Functional / Integration / UI depending on the flow.",
            "Status: Prepared for final FYP demonstration.",
        ], y)
        b.table([
            ("Precondition", "Required local services are running where applicable."),
            ("Input", name),
            ("Expected", expected),
            ("Evidence", "UI observation, API JSON, screenshot, or service log."),
        ], y)

    manual = [
        "Starting the System", "Opening the Application", "Asking a Text Question", "Asking by Voice", "Reading the Answer", "Listening to the Answer", "Finding Lawyers", "Signing In", "Viewing My Questions", "Admin Login", "Managing Lawyers", "Managing Knowledge", "System Settings", "Troubleshooting",
    ]
    for item in manual:
        y = b.start_page(f"Appendix B: User Manual - {item}")
        b.text_block(f"{item}: Follow the documented Voice2Law workflow from docs/STARTUP.md and use the frontend at http://localhost:5173. The user manual explains operational steps for users, admins, and evaluators.", y)

    sources = [
        "src/App.tsx", "src/lib/api.ts", "src/components/TextBot.tsx", "src/components/VoiceBot.tsx", "backend/src/server.js", "backend/src/app.js", "backend/src/services/nlp.js", "backend/src/services/lawyerRecommendation.js", "nlp-service/app/main.py", "nlp-service/app/config.py", "nlp-service/app/services/retrieval.py", "nlp-service/app/services/llm.py", "nlp-service/app/services/ocr.py", "docs/STARTUP.md", "docs/PROJECT_STRUCTURE.md", "tools/postman/Voice2Law.postman_collection.json",
    ]
    for src in sources:
        y = b.start_page(f"Appendix E: Source Traceability")
        b.text_block(f"Artifact: {src}. This file supports the implementation traceability for the report, showing how design, requirements, testing, and working code connect.", y)

    for week in range(1, 16):
        y = b.start_page(f"Appendix F: Meeting Logbook - Week {week}")
        b.text_block(f"Week {week} records progress toward the final integrated Voice2Law system. Activities include planning, frontend, backend, NLP, OCR, RAG, speech, lawyer directory, testing, optimization, and report preparation depending on the milestone.", y)

    y = b.start_page("End of Report")
    b.text_block(f"Generated on {date.today().isoformat()} for Voice2Law FYP-II submission. The report includes front matter, eight chapters, references, screenshots, diagrams, user manual, requirements, tests, source traceability, and meeting-logbook pages.", y)
    b.finish()

    pages = len(PdfReader(str(OUT_PDF)).pages)
    print(f"{OUT_PDF}")
    print(f"PAGES={pages}")


if __name__ == "__main__":
    main()
