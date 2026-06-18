"""
Generate Voice2Law FYP-2 Report (DOCX + PDF) matching IQRA University sample structure.
Run: python scripts/generate_fyp_report.py
"""

from __future__ import annotations

import os
import subprocess
import sys

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

# Allow running from project root or scripts/
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fyp_report_content import (  # noqa: E402
    ABBREVIATIONS,
    CODE_SNIPPETS,
    COORDINATOR,
    DEPARTMENT,
    DETAILED_FUNCTIONAL_REQUIREMENTS,
    FACULTY,
    FIGURES,
    FUNCTIONAL_REQUIREMENTS,
    MILESTONES,
    NFR_CATEGORIES,
    NON_FUNCTIONAL_REQUIREMENTS,
    PROJECT_FULL,
    PROJECT_TITLE,
    REFERENCES,
    STUDENTS,
    SUPERVISOR,
    TEST_CASES,
    UNIVERSITY,
    USE_CASES,
    YEAR,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCX_PATH = os.path.join(ROOT, "Voice2Law_FYP2_Report.docx")
PDF_PATH = os.path.join(ROOT, "Voice2Law_FYP2_Report.pdf")


def set_cell_shading(cell, color_hex: str):
    shading = OxmlElement("w:shd")
    shading.set(qn("w:fill"), color_hex)
    cell._tc.get_or_add_tcPr().append(shading)


def add_para(doc, text: str, *, bold=False, italic=False, size=11, align=None, space_after=6):
    p = doc.add_paragraph()
    if align:
        p.alignment = align
    run = p.add_run(text)
    run.bold = bold
    run.italic = italic
    run.font.size = Pt(size)
    p.paragraph_format.space_after = Pt(space_after)
    return p


def add_heading(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)
    return h


def add_body(doc, text: str):
    p = doc.add_paragraph(text)
    for run in p.runs:
        run.font.size = Pt(11)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    return p


def add_bullets(doc, items: list[str]):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        run = p.add_run(item)
        run.font.size = Pt(11)


def add_table(doc, headers: list[str], rows: list[list[str]], header_color="1A365D"):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr[i].text = h
        set_cell_shading(hdr[i], header_color)
        for p in hdr[i].paragraphs:
            for run in p.runs:
                run.font.bold = True
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                run.font.size = Pt(10)
    for ri, row in enumerate(rows, start=1):
        for ci, val in enumerate(row):
            table.rows[ri].cells[ci].text = val
            for p in table.rows[ri].cells[ci].paragraphs:
                for run in p.runs:
                    run.font.size = Pt(10)
    doc.add_paragraph()
    return table


def add_figure_placeholder(doc, caption: str, fig_num: int):
    add_para(doc, f"[Insert Figure {fig_num} here]", italic=True, size=10, align=WD_ALIGN_PARAGRAPH.CENTER)
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = cap.add_run(f"Figure {fig_num}. {caption}")
    run.italic = True
    run.font.size = Pt(10)
    doc.add_paragraph()


def student_names_line() -> str:
    return ", ".join(f"{n} ({r})" for n, r in STUDENTS)


def student_names_multiline() -> str:
    return "\n".join(n for n, _ in STUDENTS)


def student_certs_line() -> str:
    parts = []
    for name, reg in STUDENTS:
        parts.append(f"{name.upper()} (Reg-{reg})")
    return ", ".join(parts)


def build_cover(doc):
    for _ in range(3):
        doc.add_paragraph()
    add_para(doc, "Final Year Design Project Report", bold=True, size=16, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_para(doc, "BS (COMPUTER SCIENCE)", bold=True, size=14, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_para(doc, "for", size=12, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_para(doc, f'"{PROJECT_TITLE}"', bold=True, size=18, align=WD_ALIGN_PARAGRAPH.CENTER)
    doc.add_paragraph()
    add_para(doc, "Submitted By", bold=True, size=12, align=WD_ALIGN_PARAGRAPH.CENTER)
    for name, reg in STUDENTS:
        add_para(doc, f"{name} ({reg})", size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
    doc.add_paragraph()
    add_para(doc, "Supervisor", bold=True, size=12, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_para(doc, SUPERVISOR, size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_para(doc, "FYDP Coordinator", bold=True, size=12, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_para(doc, COORDINATOR, size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
    doc.add_paragraph()
    add_para(doc, FACULTY, size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_para(doc, UNIVERSITY, size=11, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_para(doc, YEAR, bold=True, size=12, align=WD_ALIGN_PARAGRAPH.CENTER)
    doc.add_page_break()


def build_certification(doc):
    add_heading(doc, "Certification of Approval", level=1)
    add_body(
        doc,
        f'It is to certify that the Final Year Design Project of BS (COMPUTER SCIENCE) "{PROJECT_TITLE}" '
        f"was developed by {student_certs_line()} under the supervision of \"{SUPERVISOR.upper()}\" "
        "and that in his opinion; it is fully adequate, in scope and quality for the degree of "
        "Bachelors of Science in Computer Sciences.",
    )
    doc.add_paragraph()
    add_para(doc, "Supervisor", size=11)
    doc.add_paragraph()
    doc.add_paragraph()
    add_para(doc, "Coordinator", size=11)
    doc.add_paragraph()
    doc.add_paragraph()
    add_para(doc, "Head of Department", size=11)
    add_para(doc, f"({DEPARTMENT})", size=11)
    doc.add_page_break()


def build_declaration(doc):
    add_heading(doc, "Declaration", level=1)
    add_body(
        doc,
        "We officially assert that the project submitted for this Final Year Design Project (FYDP) is "
        "completely original and has not been replicated or sourced from any material. The concepts, "
        "ideas, and related reports have been crafted from our research and efforts. This project has not "
        "been completely executed, and all upcoming efforts will rely on additional development and "
        "enhancement. If any section of this project is determined to be copied or duplicated, we will "
        "take complete responsibility and accept all consequences. No part of this work has been "
        "presented in support of an application for any other degree or qualification at this or any other "
        "university or educational institution.",
    )
    doc.add_paragraph()
    names = [n for n, _ in STUDENTS]
    add_para(doc, f"{names[0]}                    {names[1]}", size=11)
    add_para(doc, f"{names[2]}                    {names[3]}", size=11)
    doc.add_paragraph()
    add_para(doc, "Supervisor", size=11)
    doc.add_page_break()


def build_acknowledgement(doc):
    add_heading(doc, "Acknowledgement", level=1)
    add_body(
        doc,
        "All honor belongs to Almighty Allah, who has given us a share of His infinite knowledge and "
        "provided us with the strength and direction to complete this difficult task.",
    )
    add_body(
        doc,
        f"We extend our heartfelt thanks to everyone who provided support and guidance during the "
        f"successful completion of this Final Year Design Project. We sincerely thank our Supervisor "
        f"and FYDP Coordinator, {SUPERVISOR}, for his unwavering support, motivation, and insightful "
        f"feedback throughout all stages of this project. His knowledge, guidance, and helpful advice were "
        f"essential in influencing the course, caliber, and successful conclusion of our efforts. We express "
        f"our gratitude to {UNIVERSITY} for facilitating a nurturing academic setting, essential resources, "
        f"and the chance to engage in this project, which greatly enhanced our learning and research journey.",
    )
    add_body(
        doc,
        "In conclusion, we recognize the joint efforts, collaboration, and enthusiasm of all who played "
        "a direct or indirect role in bringing this project to fruition. This work would not have been "
        "achievable without their support and encouragement.",
    )
    doc.add_page_break()


def build_abstract(doc):
    add_heading(doc, "Abstract", level=1)
    add_body(
        doc,
        "Limited access to affordable legal information remains a significant challenge for Pakistani citizens, "
        "particularly those with low literacy or limited English proficiency. Voice2Law addresses this gap by "
        "providing an integrated web-based solution that combines bilingual (Urdu/English) text and voice "
        "interfaces with Retrieval-Augmented Generation (RAG) over Pakistani legal statutes. The primary "
        "objective is to deliver accessible legal information—not legal advice—through natural language "
        "questions answered from indexed sources including the Pakistan Penal Code, family law, criminal "
        "procedure, and property legislation (6,352 vector chunks). The application was developed using "
        "React 18 with TypeScript (frontend), Node.js/Express with MongoDB (backend), and Python FastAPI "
        "with ChromaDB, Whisper STT, Llama 3.2 3B, and Urdu TTS (NLP microservice), following an iterative "
        "Waterfall-aligned development methodology across fifteen weeks. System evaluation was conducted "
        "through unit, functional, integration, and API testing comprising 60 test cases mapped to defined "
        "functional requirements. Results demonstrate that Voice2Law successfully meets its objectives by "
        "offering a unified, reliable platform for bilingual legal information retrieval, lawyer discovery, "
        "and admin content management.",
    )
    doc.add_page_break()


def build_executive_summary(doc):
    add_heading(doc, "Executive Summary", level=1)
    paragraphs = [
        (
            "Voice2Law is a web-based legal information assistant aimed at tackling limited access to "
            "Pakistani law for citizens who prefer Urdu or have difficulty navigating complex legal text. "
            "Traditional legal consultation is costly and geographically constrained; public legal documents "
            "are often published in English and scattered across multiple statutes. Voice2Law offers a "
            "comprehensive digital platform that combines text and voice input with AI-powered retrieval "
            "and generation to deliver understandable answers grounded in indexed legal sources."
        ),
        (
            "The application is built as a responsive web app using React 18 with Vite and Tailwind CSS for "
            "the presentation layer, Node.js/Express with MongoDB for authentication, query logging, and "
            "lawyer directory management, and a Python FastAPI NLP microservice for speech-to-text "
            "(Whisper), vector retrieval (ChromaDB + sentence-transformers), large language model answering "
            "(Llama 3.2 3B via Hugging Face), and Urdu text-to-speech (facebook/mms-tts-urd). The platform "
            "delivers role-oriented access with interfaces for general users, authenticated users, and "
            "administrators."
        ),
        (
            "Users can ask legal questions in Urdu or English via text or voice. Voice queries are "
            "transcribed server-side, processed through RAG, and optionally spoken back in Urdu. The system "
            "indexes six legal PDFs into 6,352 chunks across penal, family, criminal, and property categories. "
            "Urdu query expansion bridges the gap between Urdu questions and English-indexed statute text. "
            "An extractive fallback ensures partial service when the LLM is slow or unavailable."
        ),
        (
            "Voice2Law was developed over fifteen weeks using an iterative development approach aligned with "
            "academic milestone reporting: requirements analysis, system design, implementation, testing, and "
            "documentation. The three-tier architecture separates presentation, business logic, and data/NLP "
            "persistence layers to improve maintainability and allow independent scaling of the NLP service."
        ),
        (
            "By combining bilingual interfaces, RAG-based legal Q&A, lawyer directory, and admin knowledge "
            "management, Voice2Law offers a practical method for democratizing access to legal information in "
            "Pakistan. The project demonstrates real-world application of software engineering and AI/NLP "
            "principles to address civic technology challenges."
        ),
    ]
    for p in paragraphs:
        add_body(doc, p)
    doc.add_page_break()


def build_toc(doc):
    add_heading(doc, "Table of Contents", level=1)
    toc_entries = [
        "Certification of Approval",
        "Declaration",
        "Acknowledgement",
        "Abstract",
        "Executive Summary",
        "List of Figures",
        "List of Tables",
        "List of Abbreviations",
        "Chapter 1: Introduction",
        "Chapter 2: Literature Review",
        "Chapter 3: System Analysis & Requirements",
        "Chapter 4: System Design",
        "Chapter 5: Implementation",
        "Chapter 6: Testing & Evaluation",
        "Chapter 7: Results & Discussions",
        "Chapter 8: Conclusion and Future Work",
        "References",
        "APPENDIX A: Screenshots",
        "APPENDIX B: User Manual",
    ]
    for entry in toc_entries:
        add_para(doc, entry, size=11)
    doc.add_page_break()


def build_list_of_figures(doc):
    add_heading(doc, "List of Figures", level=1)
    for i, cap in enumerate(FIGURES, start=1):
        add_para(doc, f"Figure {i}. {cap}", size=10)
    doc.add_page_break()


def build_list_of_tables(doc):
    add_heading(doc, "List of Tables", level=1)
    tables = [
        "Key Milestones of the Project / Project Management",
        "Final Deliverable of The Project Voice2Law",
        "Equipment Required with Estimated Cost",
        "Comparative Analysis of Related Systems",
        "Functional Requirements Summary",
        "Non-Functional Requirements Summary",
        "Use Case Summary",
        "Feasibility Study Summary",
        "Team Members Individual Tasks",
        "Technologies Used",
        "Test Cases & Results Summary",
    ]
    for i, t in enumerate(tables, start=1):
        add_para(doc, f"Table {i}. {t}", size=10)
    doc.add_page_break()


def build_abbreviations(doc):
    add_heading(doc, "List of Abbreviations", level=1)
    add_table(doc, ["Abbreviation", "Full Form"], ABBREVIATIONS)
    doc.add_page_break()


def build_chapter1(doc):
    add_heading(doc, "Chapter 1: Introduction", level=1)
    add_heading(doc, "1. Introduction", level=2)
    add_body(
        doc,
        "Access to legal information is a fundamental civic need, yet millions of Pakistani citizens "
        "face barriers including language (Urdu vs. English statutes), literacy, cost of consultation, "
        "and geographic distance from courts and lawyers. Voice2Law is a Final Year Design Project that "
        "addresses these challenges through an AI-assisted web platform enabling users to ask legal "
        "questions in Urdu or English—by typing or speaking—and receive answers grounded in indexed "
        "Pakistani law. This chapter introduces the project scope, objectives, methodology, schedule, "
        "and deliverables.",
    )

    add_heading(doc, "1.1. Project Summary", level=2)
    add_body(
        doc,
        f"{PROJECT_FULL} is a three-tier web application comprising a React frontend (port 5173), "
        "Node.js/Express backend API (port 5000), and Python FastAPI NLP microservice (port 8001). "
        "Users interact through a modern bilingual interface featuring a landing page, text-based legal "
        "Q&A bot, voice assistant with speech-to-text and text-to-speech, lawyer directory, legal topics "
        "browser, and authenticated Google OAuth sign-in. Administrators manage lawyers, knowledge base "
        "articles, and user query logs through a protected admin panel. The NLP pipeline ingests legal "
        "PDFs via OCR and text extraction, indexes 6,352 chunks in ChromaDB, retrieves relevant passages "
        "for each question, and generates answers using Llama 3.2 3B with extractive fallback.",
    )

    add_heading(doc, "1.2. Objective, Benefits and Deliverables", level=2)
    add_heading(doc, "1.2.1. Objectives", level=3)
    add_bullets(
        doc,
        [
            "Provide bilingual (Urdu/English) legal information retrieval via text and voice.",
            "Index Pakistani legal statutes (PPC, family, criminal procedure, property) into a searchable vector database.",
            "Implement RAG-based Q&A with source grounding and ethical disclaimers (information, not advice).",
            "Offer a lawyer directory to connect users with legal professionals.",
            "Deliver an admin panel for content and user query management.",
            "Ensure accessibility for low-literacy users through voice input and Urdu TTS output.",
        ],
    )
    add_heading(doc, "1.2.2. Benefits", level=3)
    add_bullets(
        doc,
        [
            "Reduces cost and time barrier to basic legal information.",
            "Supports Urdu speakers who cannot read English statutes directly.",
            "Voice interface assists users with limited typing literacy.",
            "Centralizes multiple legal domains in one searchable platform.",
            "Provides foundation for future expansion (mobile app, more statutes, chat history).",
        ],
    )
    add_heading(doc, "1.2.3. Deliverables", level=3)
    add_bullets(
        doc,
        [
            "Fully functional Voice2Law web application (frontend + backend + NLP).",
            "MongoDB database with users, queries, lawyers, and knowledge base collections.",
            "ChromaDB vector index with 6,352 legal text chunks.",
            "Postman API collection for testing all endpoints.",
            "Documentation: docs/STARTUP.md, FYP-2 report, and meeting logbook.",
            "FYP demonstration with sample Urdu/English legal questions.",
        ],
    )

    add_heading(doc, "1.3. Development / Research Methodology", level=2)
    add_heading(doc, "1.3.1. Introduction", level=3)
    add_body(
        doc,
        "Software development methodology provides a structured framework for planning, executing, and "
        "documenting the project. For Voice2Law, an iterative approach aligned with the Waterfall model's "
        "phased documentation was adopted to satisfy academic milestone reporting while allowing incremental "
        "integration of NLP components.",
    )
    add_heading(doc, "1.3.2. Waterfall Methodology Overview", level=3)
    add_body(
        doc,
        "The Waterfall model divides development into sequential phases: requirements analysis, system design, "
        "implementation, testing, deployment, and maintenance. Each phase produces documented deliverables "
        "before the next phase begins. While pure Waterfall is rigid for AI projects, its structure maps "
        "well to FYP milestone reporting.",
    )
    add_heading(doc, "1.3.3. Applicability To \"Project Voice2Law\"", level=3)
    add_body(
        doc,
        "Voice2Law requirements were defined early (bilingual Q&A, voice, lawyer directory, admin panel). "
        "Design artifacts (architecture, use cases, DFDs) were produced before full NLP integration. "
        "Implementation proceeded in weekly sprints with testing at each milestone. This hybrid approach "
        "combines Waterfall documentation discipline with iterative NLP experimentation.",
    )
    add_heading(doc, "1.3.4. Key Features (developed using this methodology)", level=3)
    add_bullets(
        doc,
        [
            "Urdu/English text and voice legal Q&A with RAG.",
            "Google OAuth and JWT authentication.",
            "Lawyer directory with search and profile cards.",
            "Admin panel for knowledge base and lawyer CRUD.",
            "Urdu TTS for spoken answers.",
            "Postman-tested REST API layer.",
        ],
    )
    add_heading(doc, "1.3.5. Key Principles/Phases of the Waterfall Model", level=3)
    add_bullets(
        doc,
        [
            "Requirements: Functional and non-functional requirements documented in Chapter 3.",
            "Design: Architecture, UML, DFDs in Chapter 4.",
            "Implementation: React, Express, FastAPI modules in Chapter 5.",
            "Testing: 30 test cases in Chapter 6.",
            "Deployment: Local Windows dev stack documented in docs/STARTUP.md.",
        ],
    )
    add_heading(doc, "1.3.6. High-Level Process Flow", level=3)
    add_body(
        doc,
        "User question (text or voice) → Frontend → Backend API → NLP service (STT if voice) → "
        "ChromaDB retrieval → LLM generation → Response → TTS (optional) → User display.",
    )
    add_heading(doc, "1.3.7. Justification (for choosing Waterfall Model)", level=3)
    add_body(
        doc,
        "Waterfall (with iterative implementation) was chosen because FYP evaluation requires phased "
        "documentation, clear requirement traceability, and milestone-based progress reporting across "
        "fifteen weeks. The NLP components were prototyped iteratively within the implementation phase.",
    )
    add_heading(doc, "1.3.8. Conclusion", level=3)
    add_body(doc, "The selected methodology ensured organized development and comprehensive FYP documentation.")
    add_heading(doc, "1.3.9. Block Diagram", level=3)
    add_figure_placeholder(doc, "Block Diagram for Voice2Law", 1)

    add_heading(doc, "1.4. Project Schedule / Milestone Chart", level=2)
    add_figure_placeholder(doc, "Voice2Law FYDP2 Project Schedule / Milestone Chart", 2)

    add_heading(doc, "1.5. Key Milestones of the Project / Project Management", level=2)
    add_table(
        doc,
        ["No.", "Elapsed Time", "Milestone", "Deliverables"],
        [[a, b, c, d] for a, b, c, d in MILESTONES],
    )
    add_para(doc, "Table 1. Key Milestones of the Project / Project Management", italic=True, size=10)

    add_heading(doc, "1.6. Final Deliverable of The Project", level=2)
    add_body(doc, "A. Final deliverable of the project:")
    add_bullets(
        doc,
        [
            "□ Hardware system    ☑ Software system    □ HW/SW integrated system",
            "□ Software simulation results    □ Comparative study",
            "□ Mobile App    ☑ Web App    □ Other",
        ],
    )
    add_para(doc, "Table 2. Final Deliverable of The Project Voice2Law", italic=True, size=10)

    add_heading(doc, "1.7. Equipment required for the project with Estimated Cost", level=2)
    add_bullets(
        doc,
        [
            "1. Development Computer (Existing)",
            "2. Visual Studio Code / Cursor IDE (Free)",
            "3. Node.js, Python 3.11, MongoDB Community (Free)",
            "4. Hugging Face Account (Free tier for STT/LLM/TTS)",
            "5. Azure Document Intelligence (OCR — development tier)",
            "6. Google Cloud Console (OAuth client — Free)",
            "Estimated Cost: Minimal (existing hardware and free/open-source software tiers).",
        ],
    )
    add_para(doc, "Table 3. Equipment Required with Estimated Cost", italic=True, size=10)
    doc.add_page_break()


def build_chapter2(doc):
    add_heading(doc, "Chapter 2: Literature Review", level=1)
    add_heading(doc, "2. Introduction", level=2)
    add_body(
        doc,
        "This chapter examines the challenge of limited legal literacy and access to justice in Pakistan, "
        "reviews existing legal technology solutions globally and locally, and positions Voice2Law as a "
        "bilingual, voice-enabled RAG-based contribution to civic legal information systems.",
    )
    add_heading(doc, "2.1. Review of Existing Systems / Solutions", level=2)
    add_heading(doc, "2.1.1. The Problem: Legal Information Gap in Pakistan", level=3)
    add_body(
        doc,
        "Pakistani citizens frequently lack awareness of their rights and obligations under statutes such "
        "as the Pakistan Penal Code, family laws, and land acquisition regulations. Legal text is predominantly "
        "in English, court procedures are complex, and professional consultation is expensive. Low-literacy "
        "and Urdu-primary users are especially disadvantaged when seeking basic legal information.",
    )
    add_heading(doc, "2.1.2. The Solution: Voice2Law", level=3)
    add_body(
        doc,
        "Voice2Law integrates web technologies with modern NLP: vector retrieval over ingested statutes, "
        "LLM answer generation, Whisper speech recognition, and Urdu TTS. Users ask questions naturally; "
        "the system retrieves relevant legal passages and synthesizes understandable responses with "
        "disclaimers that output is informational, not professional legal advice.",
    )
    add_heading(doc, "2.1.3. Literature Review: Legal Tech and RAG", level=3)
    add_body(
        doc,
        "Retrieval-Augmented Generation (Lewis et al., 2020) combines dense retrieval with generative models "
        "to ground answers in source documents—critical for legal domains where hallucination is unacceptable. "
        "Sentence embeddings (Reimers & Gurevych, 2019) enable semantic search across English statute text. "
        "Cross-lingual retrieval via query expansion allows Urdu questions against English-indexed corpora.",
    )
    add_heading(doc, "2.2. Related System Analysis", level=2)
    systems = [
        (
            "2.2.1. Pakistan Code (Legal Reference)",
            "Official repository of Pakistani statutes. Comprehensive but not searchable by natural language "
            "or Urdu voice. No Q&A interface.",
        ),
        (
            "2.2.2. ROSS Intelligence (Legal AI)",
            "AI-powered legal research for professionals. Subscription-based, English-only, not designed "
            "for Pakistani law or public citizens.",
        ),
        (
            "2.2.3. DoNotPay",
            "Consumer legal chatbot for Western jurisdictions. Demonstrates chat-based legal assistance "
            "but does not cover Pakistani statutes or Urdu.",
        ),
        (
            "2.2.4. ChatGPT / General LLMs",
            "General-purpose LLMs can answer legal questions but lack grounding in specific Pakistani "
            "statutes and may hallucinate. Voice2Law uses RAG to reduce this risk.",
        ),
        (
            "2.2.5. Pakistani Lawyer Directories",
            "Websites listing lawyers by city. Provide contact information but no legal Q&A or voice interface.",
        ),
    ]
    for title, desc in systems:
        add_heading(doc, title, level=3)
        add_body(doc, desc)
        fig_idx = int(title.split(".")[1].split(".")[0]) + 1
        if fig_idx <= 7:
            add_figure_placeholder(doc, title.split(". ", 1)[1], fig_idx)

    add_heading(doc, "2.3. Comparative Analysis", level=2)
    add_table(
        doc,
        ["System", "Urdu Support", "Voice Input", "PK Law", "RAG Grounded", "Public Free"],
        [
            ["Voice2Law", "Yes", "Yes", "Yes", "Yes", "Yes"],
            ["Pakistan Code", "No", "No", "Yes", "N/A", "Yes"],
            ["ROSS", "No", "No", "No", "Yes", "No"],
            ["DoNotPay", "No", "No", "No", "Partial", "Partial"],
            ["ChatGPT", "Partial", "Partial", "Partial", "No", "Partial"],
            ["Lawyer Directories", "Partial", "No", "N/A", "No", "Yes"],
        ],
    )
    add_para(doc, "Table 4. Comparative Analysis of Related Systems", italic=True, size=10)

    add_heading(doc, "2.4. Working Models for Voice2Law", level=2)
    add_heading(doc, "2.4.1. Advantages of Voice2Law", level=3)
    add_bullets(
        doc,
        [
            "Bilingual Urdu/English interface with voice and text.",
            "RAG grounding in 6,352 indexed legal chunks.",
            "Integrated lawyer directory.",
            "Open-source stack suitable for FYP budget.",
            "Admin panel for content governance.",
        ],
    )
    add_heading(doc, "2.4.2. Potential Challenges and Limitations", level=3)
    add_bullets(
        doc,
        [
            "Indexed corpus covers four domains—not exhaustive of all Pakistani law.",
            "English OCR text with Urdu questions requires query expansion.",
            "HF free tier causes cold-start latency (1–3 minutes first answer).",
            "Output is information, not licensed legal advice.",
        ],
    )
    add_heading(doc, "2.5. Concluding Summary", level=2)
    add_body(
        doc,
        "Voice2Law fills a gap between static statute repositories and generic chatbots by offering "
        "grounded, bilingual, voice-enabled legal information for Pakistani citizens.",
    )
    doc.add_page_break()


def build_chapter3(doc):
    add_heading(doc, "Chapter 3: System Analysis & Requirements", level=1)
    add_heading(doc, "3. Introduction", level=2)
    add_body(doc, "This chapter defines functional and non-functional requirements, use cases, and feasibility analysis.")
    add_heading(doc, "3.1. Requirement Identifying Techniques", level=2)
    add_bullets(doc, ["Literature review", "Competitive analysis", "Supervisor meetings", "Prototype feedback", "Test-driven refinement"])
    add_heading(doc, "3.2. Functional Requirements", level=2)
    for idx, block in enumerate(DETAILED_FUNCTIONAL_REQUIREMENTS, start=1):
        add_heading(doc, f"3.2.{idx}. Feature: {block['feature']}", level=3)
        add_table(
            doc,
            ["Identifier", "Title", "Requirement", "Business Rule"],
            [[a, b, c, d] for a, b, c, d in block["rows"]],
        )
        add_para(doc, f"Table 3.2.{idx}. {block['feature']} Functional Requirement", italic=True, size=10)
    add_heading(doc, "3.3. Non-Functional Requirements", level=2)
    for cat, items in NFR_CATEGORIES.items():
        add_heading(doc, cat, level=3)
        add_bullets(doc, items)
    add_table(doc, ["ID", "Category", "Description"], [[a, b, c] for a, b, c in NON_FUNCTIONAL_REQUIREMENTS])
    add_para(doc, "Table 5. Non-Functional Requirements Summary", italic=True, size=10)
    add_heading(doc, "3.4. Use Case Diagram & Description", level=2)
    add_figure_placeholder(doc, "Use Case Diagram Voice2Law", 8)
    add_heading(doc, "3.4.1. Actors", level=3)
    add_bullets(doc, ["Guest User", "Registered User", "Administrator", "NLP Microservice (external)"])
    add_heading(doc, "3.5. Use Case Tables", level=2)
    for i, (uc_id, name, actor, desc) in enumerate(USE_CASES, start=1):
        add_heading(doc, f"3.5.{i}. Use Case Table {i}: {name}", level=3)
        add_table(
            doc,
            ["Field", "Description"],
            [
                ["Use Case ID", uc_id],
                ["Use Case Name", name],
                ["Actor", actor],
                ["Description", desc],
                ["Precondition", "User has network access; services running for Q&A flows."],
                ["Postcondition", "Result displayed or error message shown."],
            ],
        )
    add_table(doc, ["ID", "Use Case", "Actor", "Description"], USE_CASES)
    add_para(doc, "Table 7. Use Case Summary", italic=True, size=10)
    add_heading(doc, "3.6. Feasibility Study", level=2)
    add_heading(doc, "3.6.1. Technical Feasibility", level=3)
    add_body(doc, "React, Node.js, Python FastAPI, MongoDB, and ChromaDB are mature open-source technologies. Team has expertise in full-stack and NLP.")
    add_heading(doc, "3.6.2. Economic Feasibility", level=3)
    add_body(doc, "Development uses free tiers: Hugging Face Inference, MongoDB Community, Azure OCR dev tier. Estimated cost: minimal.")
    add_heading(doc, "3.6.3. Operational Feasibility", level=3)
    add_body(doc, "Web app accessible via browser; voice requires microphone. Admin panel supports content updates without code changes.")
    add_heading(doc, "3.6.4. Time Feasibility", level=3)
    add_body(doc, "Fifteen-week schedule with milestones from setup through final presentation (see Table 1).")
    add_heading(doc, "3.6.5. Risk Analysis", level=3)
    add_bullets(doc, ["NLP service downtime → extractive fallback", "OCR quality on scanned PDFs → pypdf for text-layer PDFs", "Urdu STT script mismatch → aksharamukha normalization"])
    add_heading(doc, "3.7. Team Members Individual Tasks", level=2)
    add_table(
        doc,
        ["Member", "Reg ID", "Role", "Responsibilities"],
        [
            ["Syed Muhammad Umer", "62993", "Backend + Team Lead", "Express API, MongoDB, auth, deployment"],
            ["Muhammad Shahmir Iqbal", "62602", "Frontend Developer", "React UI, routing, responsive design"],
            ["Ahmed Ali Ghori", "60117", "Frontend + NLP", "VoiceBot, NLP integration, RAG tuning"],
            ["Rameel Khan", "62602", "Database + UI/UX", "MongoDB schemas, lawyer seed, UI polish"],
        ],
    )
    add_para(doc, "Table 9. Team Members Individual Tasks", italic=True, size=10)
    doc.add_page_break()


def build_chapter4(doc):
    add_heading(doc, "Chapter 4: System Design", level=1)
    add_heading(doc, "4. Introduction", level=2)
    add_body(doc, "This chapter presents the three-tier architecture, UML diagrams, DFDs, and UI design for Voice2Law.")
    add_heading(doc, "4.1. System Architecture", level=2)
    add_heading(doc, "4.1.1. Presentation Layer", level=3)
    add_body(doc, "React 18 SPA with Vite, Tailwind CSS, Radix UI. Pages: Home, Ask, Find Lawyers, Legal Topics, Auth, Admin.")
    add_heading(doc, "4.1.2. Service Layer", level=3)
    add_body(doc, "Express.js REST API: auth, queries, voice upload, TTS proxy, lawyers, knowledge base. JWT middleware.")
    add_heading(doc, "4.1.3. Data Persistence Layer", level=3)
    add_body(doc, "MongoDB (users, queries, lawyers, knowledgebases). ChromaDB filesystem index (nlp-service/data/chroma/).")
    add_heading(doc, "4.1.4. Architecture Diagram", level=3)
    add_figure_placeholder(doc, "Voice2Law Three-Tier Architecture Diagram", 9)
    add_heading(doc, "4.1.5. Process Flow Description", level=3)
    add_body(doc, "Text flow: User → /api/ask → NLP /ask → Chroma retrieve → LLM → answer. Voice flow: audio → /api/voice → STT → /ask → TTS.")
    add_heading(doc, "4.1.6. Activity Diagram", level=3)
    add_figure_placeholder(doc, "Voice2Law Activity Diagram (Voice Q&A Flow)", 10)
    add_heading(doc, "4.2. UML Diagrams", level=2)
    add_heading(doc, "4.3. Class Diagram", level=2)
    add_figure_placeholder(doc, "Voice2Law Class Diagram", 11)
    add_heading(doc, "4.4. State Transition Diagram", level=2)
    add_figure_placeholder(doc, "User State Transition Diagram", 12)
    add_figure_placeholder(doc, "Admin State Transition Diagram", 13)
    add_heading(doc, "4.5. Data Flow Diagrams", level=2)
    for i, cap in enumerate(
        ["Voice2Law Context Level DFD (Level 0)", "User Level 0 DFD", "Admin Level 0 DFD", "System Level 0 DFD", "Voice2Law Level 1 DFD"],
        start=14,
    ):
        add_figure_placeholder(doc, cap, i)
    add_heading(doc, "4.6. Sequence Diagram", level=2)
    add_figure_placeholder(doc, "Voice2Law Sequence Diagram (Text Q&A)", 19)
    add_figure_placeholder(doc, "Voice2Law Sequence Diagram (Voice Q&A)", 20)
    add_heading(doc, "4.7. User Interface Design", level=2)
    ui_screens = [
        "Home Page Screen",
        "Ask Question (Text Bot) Screen",
        "Voice Assistant Modal Screen",
        "Find Lawyers Screen",
        "Sign In Screen",
        "Google OAuth Sign In Screen",
        "Admin Dashboard Screen",
        "Admin Knowledge Base Screen",
        "Admin Add Lawyer Screen",
        "Legal Topics Screen",
        "How It Works Screen",
        "About Page Screen",
    ]
    for i, screen in enumerate(ui_screens, start=21):
        add_heading(doc, f"4.7.{i-20}. {screen}", level=3)
        add_figure_placeholder(doc, screen, i)
    doc.add_page_break()


def build_chapter5(doc):
    add_heading(doc, "Chapter 5: Implementation", level=1)
    add_heading(doc, "5. Introduction", level=2)
    add_body(doc, "This chapter describes the development environment, technologies, modules, and key algorithms.")
    add_heading(doc, "5.1. Development Environment & Tools", level=2)
    add_bullets(
        doc,
        [
            "OS: Windows 10/11",
            "IDE: Visual Studio Code / Cursor",
            "Version Control: Git",
            "API Testing: Postman",
            "Database GUI: MongoDB Compass (optional)",
        ],
    )
    add_heading(doc, "5.2. Technologies Used", level=2)
    add_table(
        doc,
        ["Layer", "Technology", "Purpose"],
        [
            ["Frontend", "React 18, TypeScript, Vite, Tailwind", "User interface"],
            ["Backend", "Node.js, Express, MongoDB, JWT", "API and persistence"],
            ["NLP", "FastAPI, ChromaDB, sentence-transformers", "RAG pipeline"],
            ["STT", "Hugging Face Whisper", "Speech-to-text"],
            ["LLM", "Llama 3.2 3B Instruct", "Answer generation"],
            ["TTS", "facebook/mms-tts-urd", "Urdu speech synthesis"],
            ["OCR", "Azure Document Intelligence, pypdf", "PDF text extraction"],
        ],
    )
    add_para(doc, "Table 10. Technologies Used", italic=True, size=10)
    add_heading(doc, "5.3. Module Description", level=2)
    modules = [
        ("Frontend (src/)", "Pages, components (Hero, VoiceBot, TextBot, Navbar), auth context, API client."),
        ("Backend (backend/src/)", "Routes: auth, ask, voice, tts, lawyers, knowledge. Controllers and MongoDB models."),
        ("NLP (nlp-service/app/)", "main.py endpoints; services: vectorstore, retrieval, llm, stt, tts, urdu_script."),
        ("Ingest (nlp-service/ingest.py)", "CLI to process PDFs from legal_data/ into ChromaDB."),
    ]
    for name, desc in modules:
        add_heading(doc, name, level=3)
        add_body(doc, desc)
    add_heading(doc, "5.4. Algorithm / Logic Explanation", level=2)
    add_heading(doc, "5.4.1. RAG Retrieval Logic", level=3)
    add_body(
        doc,
        "User question is optionally expanded (Urdu→English hints in retrieval.py). Sentence-transformer "
        "embedding retrieves top-k chunks from ChromaDB. Chunks form LLM context (max 1200 chars). "
        "If LLM fails, extractive fallback returns top chunk text.",
    )
    add_heading(doc, "5.4.2. Urdu Query Expansion", level=3)
    add_body(doc, "Dictionary maps Urdu legal terms (چوری, ضمانت, نکاح) to English retrieval hints for cross-lingual search.")
    add_heading(doc, "5.4.3. Voice Pipeline Logic", level=3)
    add_body(doc, "MediaRecorder captures audio → POST /api/voice → Whisper STT → urdu_script normalization → RAG → auto TTS playback.")
    add_heading(doc, "5.5. Code Snippets", level=2)
    for title, code in CODE_SNIPPETS:
        add_heading(doc, title, level=3)
        p = doc.add_paragraph()
        run = p.add_run(code)
        run.font.name = "Consolas"
        run.font.size = Pt(9)
        doc.add_paragraph()
    add_para(doc, "(See APPENDIX A for additional code screenshots.)", italic=True, size=10)
    doc.add_page_break()


def build_chapter6(doc):
    add_heading(doc, "Chapter 6: Testing & Evaluation", level=1)
    add_heading(doc, "6. Introduction", level=2)
    add_body(doc, "Testing validates that Voice2Law meets functional and non-functional requirements.")
    add_heading(doc, "6.1. Testing Methodologies", level=2)
    add_bullets(doc, ["Unit testing (NLP scripts, API validators)", "Functional testing (Postman)", "Integration testing (full stack)", "User acceptance (demo scenarios)"])
    add_heading(doc, "6.2. Requirement Codes", level=2)
    add_body(doc, "Test cases map to FR-xx and NFR-xx requirement identifiers.")
    add_heading(doc, "6.3. Test Cases & Results", level=2)
    for i, (tc, req, name, steps, expected, result) in enumerate(TEST_CASES, start=1):
        add_heading(doc, f"6.3.{i}. Test Case {i}: {name}", level=3)
        add_table(
            doc,
            ["Field", "Value"],
            [
                ["Test Case ID", tc],
                ["Requirement", req],
                ["Steps", steps],
                ["Expected", expected],
                ["Result", result],
            ],
        )
    add_para(doc, "Table 11. Test Cases & Results Summary", italic=True, size=10)
    doc.add_page_break()


def build_chapter7(doc):
    add_heading(doc, "Chapter 7: Results & Discussions", level=1)
    add_heading(doc, "7. Introduction", level=2)
    add_body(doc, "This chapter presents system outputs, achieved objectives, screenshots, comparisons, and limitations.")
    add_heading(doc, "7.1. System Outputs", level=2)
    add_bullets(
        doc,
        [
            "Bilingual text Q&A with answers from indexed PPC, family, criminal, and property law.",
            "Voice Q&A with Urdu transcription, answer generation, and TTS playback.",
            "Lawyer directory with profile images and contact details.",
            "Admin panel for knowledge base and query monitoring.",
        ],
    )
    add_heading(doc, "7.2. Achieved Objectives", level=2)
    add_bullets(
        doc,
        [
            "6,352 legal chunks indexed and searchable via RAG.",
            "Urdu voice input with script normalization.",
            "60/60 test cases passed.",
            "Postman collection for all API endpoints.",
            "Documented startup guide (docs/STARTUP.md).",
        ],
    )
    add_heading(doc, "7.3. System Output Screenshots", level=2)
    for i, cap in enumerate(FIGURES[32:], start=33):
        add_heading(doc, f"7.3.{i-32}. {cap}", level=3)
        add_figure_placeholder(doc, cap, i)
    add_heading(doc, "7.4. Comparison with Existing Systems", level=2)
    add_body(doc, "Voice2Law uniquely combines Urdu voice, RAG over Pakistani statutes, and lawyer directory in one free web platform.")
    add_heading(doc, "7.5. Limitations", level=2)
    add_bullets(
        doc,
        [
            "Corpus limited to six PDFs—not all Pakistani law.",
            "HF free tier latency on first LLM call.",
            "Requires internet for NLP/LLM services.",
            "Information only—not substitute for licensed lawyer.",
        ],
    )
    doc.add_page_break()


def build_chapter8(doc):
    add_heading(doc, "Chapter 8: Conclusion and Future Work", level=1)
    add_heading(doc, "8. Introduction", level=2)
    add_body(doc, "This chapter summarizes the project, acknowledges limitations, and outlines future enhancements.")
    add_heading(doc, "8.1. Conclusion", level=2)
    add_body(
        doc,
        "Voice2Law successfully delivers a bilingual legal information assistant for Pakistan using modern "
        "web and NLP technologies. The three-tier architecture, RAG pipeline over 6,352 chunks, voice "
        "interface, and admin tools meet the defined FYP objectives. Testing confirms functional reliability "
        "across auth, Q&A, voice, TTS, and lawyer modules.",
    )
    add_heading(doc, "8.2. System Limitations and Challenges", level=2)
    add_bullets(
        doc,
        [
            "Incomplete statute coverage.",
            "Dependency on external Hugging Face APIs.",
            "English-indexed text with Urdu queries requires expansion heuristics.",
            "Single-machine deployment for FYP demo.",
        ],
    )
    add_heading(doc, "8.3. Future Work", level=2)
    add_bullets(
        doc,
        [
            "Expand corpus (more statutes, case law).",
            "Native Urdu statute ingestion.",
            "Mobile app (React Native / Flutter).",
            "Local LLM deployment to reduce latency.",
            "User question history page (/my-questions).",
            "Live lawyer scrape integration where APIs permit.",
        ],
    )
    doc.add_page_break()


def build_references(doc):
    add_heading(doc, "References", level=1)
    for ref in REFERENCES:
        p = doc.add_paragraph(ref, style="List Number")
        for run in p.runs:
            run.font.size = Pt(10)
    doc.add_page_break()


def build_appendix_a(doc):
    add_heading(doc, "APPENDIX A: Screenshots", level=1)
    add_body(doc, "Insert application screenshots and code screenshots below. Run the app and capture:")
    screens = [
        "Home page", "Text Q&A", "Voice assistant", "Find Lawyers", "Sign in with Google",
        "Admin dashboard", "Postman collection", "NLP /health output", "MongoDB queries collection",
    ]
    for s in screens:
        add_para(doc, f"[Screenshot: {s}]", italic=True, size=10)
        doc.add_paragraph()
    code_files = [
        "queryController.js", "voiceController.js", "retrieval.py", "llm.py", "VoiceBot.tsx", "App.tsx",
    ]
    add_heading(doc, "Code Screenshots", level=2)
    for cf in code_files:
        add_para(doc, f"[Code Screenshot: {cf}]", italic=True, size=10)
        doc.add_paragraph()
    doc.add_page_break()


def build_appendix_b(doc):
    add_heading(doc, "APPENDIX B: User Manual", level=1)
    add_heading(doc, "Voice2Law User Manual", level=2)
    sections = [
        ("B.1 Introduction", "Voice2Law is a web legal information assistant for Pakistani citizens. It answers legal questions in Urdu or English using AI grounded in indexed statutes."),
        ("B.2 Intended Users", "General public, low-literacy users (voice), law students, administrators."),
        ("B.3 System Requirements", "Modern browser (Chrome/Edge), microphone for voice, internet connection. Backend requires MongoDB, Node.js, Python 3.11."),
        ("B.4 Installation", "See docs/STARTUP.md: start MongoDB → NLP (8001) → backend (5000) → frontend (5173)."),
        ("B.5 Registration and Login", "Sign up with email/password or Google OAuth at /signin. JWT stored for authenticated requests."),
        ("B.6 Asking Questions (Text)", "Navigate to Ask page, type question in Urdu or English, submit, read answer."),
        ("B.7 Asking Questions (Voice)", "Open Voice Assistant, press microphone, speak question, wait for transcription and answer. Answer plays automatically in Urdu."),
        ("B.8 Find Lawyers", "Browse lawyer cards by city and specialization. Contact via phone/email."),
        ("B.9 Admin Panel", "Login at /admin-login. Manage knowledge base, lawyers, and view user queries."),
        ("B.10 Troubleshooting", "If answers show fallback message, ensure NLP service is running on port 8001. Only one uvicorn instance allowed."),
        ("B.11 Logout", "Click Sign out in navbar when logged in."),
        ("B.12 Conclusion", "This manual covers standard Voice2Law usage for FYP demonstration."),
    ]
    for title, text in sections:
        add_heading(doc, title, level=2)
        add_body(doc, text)


def convert_to_pdf(docx_path: str, pdf_path: str) -> bool:
    """Try docx2pdf (Word) then LibreOffice."""
    try:
        from docx2pdf import convert

        convert(docx_path, pdf_path)
        return os.path.isfile(pdf_path)
    except Exception:
        pass
    for cmd in [
        ["soffice", "--headless", "--convert-to", "pdf", "--outdir", os.path.dirname(pdf_path), docx_path],
        [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            os.path.dirname(pdf_path),
            docx_path,
        ],
    ]:
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=120)
            default = os.path.join(
                os.path.dirname(pdf_path),
                os.path.splitext(os.path.basename(docx_path))[0] + ".pdf",
            )
            if os.path.isfile(default) and default != pdf_path:
                os.replace(default, pdf_path)
            if os.path.isfile(pdf_path):
                return True
        except Exception:
            continue
    return False


def build_document():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1.25)
        section.right_margin = Inches(1)

    build_cover(doc)
    build_certification(doc)
    build_declaration(doc)
    build_acknowledgement(doc)
    build_abstract(doc)
    build_executive_summary(doc)
    build_toc(doc)
    build_list_of_figures(doc)
    build_list_of_tables(doc)
    build_abbreviations(doc)
    build_chapter1(doc)
    build_chapter2(doc)
    build_chapter3(doc)
    build_chapter4(doc)
    build_chapter5(doc)
    build_chapter6(doc)
    build_chapter7(doc)
    build_chapter8(doc)
    build_references(doc)
    build_appendix_a(doc)
    build_appendix_b(doc)

    doc.save(DOCX_PATH)
    print(f"Created: {DOCX_PATH}")

    if convert_to_pdf(DOCX_PATH, PDF_PATH):
        print(f"Created: {PDF_PATH}")
    else:
        print("PDF: Open the DOCX in Microsoft Word and Save As PDF, or install docx2pdf/LibreOffice.")


if __name__ == "__main__":
    build_document()
