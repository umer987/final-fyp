"""Structured content for Voice2Law FYP-2 report (matches sample report sections)."""

PROJECT_TITLE = "Voice2Law"
PROJECT_FULL = "Voice2Law — AI-Based Urdu/English Legal Information Assistant for Pakistan"
YEAR = "2026"

STUDENTS = [
    ("SYED MUHAMMAD UMER", "62993"),
    ("MUHAMMAD SHAHMIR IQBAL", "62602"),
    ("AHMED ALI GHORI", "60117"),
    ("RAMEEL KHAN", "62602"),
]

SUPERVISOR = "Mr. Abdul Wahab Khan"
COORDINATOR = "Mr. Abdul Wahab Khan"
UNIVERSITY = "IQRA University EDC Campus Karachi"
FACULTY = "Faculty of Engineering, Sciences & Technology"
DEPARTMENT = "Department of FEST"

ABBREVIATIONS = [
    ("API", "Application Programming Interface"),
    ("CrPC", "Code of Criminal Procedure"),
    ("DFD", "Data Flow Diagram"),
    ("HF", "Hugging Face"),
    ("JWT", "JSON Web Token"),
    ("LLM", "Large Language Model"),
    ("LMS", "Learning Management System"),
    ("MBS", "Mental Balance Score"),
    ("NLP", "Natural Language Processing"),
    ("OCR", "Optical Character Recognition"),
    ("PPC", "Pakistan Penal Code"),
    ("RAG", "Retrieval-Augmented Generation"),
    ("REST", "Representational State Transfer"),
    ("STT", "Speech-to-Text"),
    ("TTS", "Text-to-Speech"),
    ("UI/UX", "User Interface / User Experience"),
    ("UML", "Unified Modeling Language"),
]

REFERENCES = [
    "Brown, T. et al. (2020). Language Models are Few-Shot Learners. Advances in Neural Information Processing Systems.",
    "Chroma (2024). ChromaDB Documentation — Vector Database for AI Applications. https://docs.trychroma.com/",
    "Hugging Face (2024). Transformers, Inference API, and Model Hub Documentation. https://huggingface.co/docs",
    "Lewis, P. et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. NeurIPS.",
    "Microsoft (2024). Azure AI Document Intelligence — OCR Service Documentation.",
    "OpenAI (2023). Whisper: Robust Speech Recognition via Large-Scale Weak Supervision.",
    "Pakistan Code (Various). Pakistan Penal Code, Code of Criminal Procedure, Family Laws, Land Acquisition Act.",
    "Radix UI (2024). Accessible React Component Primitives. https://www.radix-ui.com/",
    "React Team (2024). React 18 Documentation. https://react.dev/",
    "Reimers, N. & Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks.",
    "Sommerville, I. (2016). Software Engineering (10th ed.). Pearson.",
    "Tailwind Labs (2024). Tailwind CSS Documentation. https://tailwindcss.com/docs",
    "Vite (2024). Next Generation Frontend Tooling. https://vitejs.dev/",
]

MILESTONES = [
    ("1", "Week 1–4", "Project Setup & Planning", "Repository structure, literature survey, architecture design, dev environment (Node, Python, MongoDB)."),
    ("2", "Week 5", "Frontend Foundation", "React + Vite + Tailwind UI: landing, Hero, navigation, text/voice bot pages."),
    ("3", "Week 6", "Backend & Database", "Express API, MongoDB models (users, queries, lawyers), JWT auth skeleton."),
    ("4", "Week 7", "Authentication", "Google OAuth, email/password register/login, admin routes."),
    ("5", "Week 8", "NLP Service Setup", "FastAPI microservice, ChromaDB, embeddings, ingest CLI, legal PDF folders."),
    ("6", "Week 9", "OCR & Ingest Pipeline", "Azure Document Intelligence OCR, pypdf fast path, batch PDF processing."),
    ("7", "Week 10", "RAG Pipeline", "Retrieval service, Llama LLM integration, backend /api/ask wiring."),
    ("8", "Week 11", "Full Dataset Index", "6352 chunks indexed (penal, family, criminal, property)."),
    ("9", "Week 12", "Voice STT", "Whisper STT, MediaRecorder, Urdu script normalization."),
    ("10", "Week 13", "RAG Tuning & Testing", "Query expansion, extractive fallback, CORS, Postman collection."),
    ("11", "Week 14", "TTS & Lawyers", "mms-tts-urd, lawyer seed, navbar Google profile, scroll fixes."),
    ("12", "Week 15", "Final Polish & Demo", "Lazy routes, docs/STARTUP.md, E2E testing, FYP presentation."),
]

DETAILED_FUNCTIONAL_REQUIREMENTS = [
    {
        "feature": "User Authentication",
        "rows": [
            ("Req 01", "User Registration", "The system shall allow new users to register with name, email, and password.", "Password stored as bcrypt hash in MongoDB."),
            ("Req 02", "User Login", "The system shall authenticate users via email/password and return a JWT token.", "Token expires per JWT_SECRET configuration."),
            ("Req 03", "Google OAuth", "The system shall support Google Sign-In and store name, email, picture.", "googleId linked to users collection."),
            ("Req 04", "User Logout", "The system shall clear client-side auth token on sign out.", "Navbar shows profile when authenticated."),
        ],
    },
    {
        "feature": "Text Legal Q&A",
        "rows": [
            ("Req 05", "Submit Question", "Users shall submit legal questions in Urdu or English via text input.", "POST /api/ask accepts {question, language}."),
            ("Req 06", "RAG Answer", "The system shall retrieve relevant legal chunks and generate grounded answers.", "NLP /ask uses ChromaDB + Llama 3.2 3B."),
            ("Req 07", "Disclaimer", "Answers shall include informational disclaimer (not legal advice).", "Displayed in TextBot and VoiceBot UI."),
            ("Req 08", "Guest Access", "Unauthenticated users may ask questions without login.", "userId optional in queries collection."),
        ],
    },
    {
        "feature": "Voice Legal Q&A",
        "rows": [
            ("Req 09", "Record Audio", "Users shall record voice via browser MediaRecorder.", "Audio uploaded as multipart to /api/voice."),
            ("Req 10", "Speech-to-Text", "Audio shall be transcribed using Whisper via Hugging Face.", "Urdu script normalized via aksharamukha."),
            ("Req 11", "Voice Answer", "Transcribed text processed through same RAG pipeline as text Q&A.", "Answer returned with transcript."),
            ("Req 12", "Auto TTS", "Voice answers shall optionally play automatically in Urdu.", "mms-tts-urd with browser fallback."),
        ],
    },
    {
        "feature": "Lawyer Directory",
        "rows": [
            ("Req 13", "List Lawyers", "Users shall browse lawyers with name, specialization, city, rating.", "GET /api/lawyers"),
            ("Req 14", "Lawyer Profile", "Users shall view individual lawyer details including image and contact.", "GET /api/lawyers/:id"),
            ("Req 15", "Admin Lawyer CRUD", "Admins shall add, edit, delete lawyer records.", "Protected admin routes."),
        ],
    },
    {
        "feature": "Admin Panel",
        "rows": [
            ("Req 16", "Admin Login", "Admins authenticate via separate admin login route.", "role=admin in users collection."),
            ("Req 17", "Knowledge Base", "Admins manage Urdu legal articles (pending/approved).", "knowledgebases collection."),
            ("Req 18", "Query Monitoring", "Admins view user questions and AI answers.", "GET /api/queries (admin only)."),
            ("Req 19", "System Settings", "Admins access dashboard and configuration views.", "/adminvoice2law001 panel."),
        ],
    },
]

FUNCTIONAL_REQUIREMENTS = [
    ("FR-01", "User Authentication", "Users can register, login, and sign in with Google OAuth. JWT tokens secure API access."),
    ("FR-02", "Text Legal Q&A", "Users submit Urdu/English questions via text; system returns RAG-based answers from indexed law."),
    ("FR-03", "Voice Legal Q&A", "Users record voice; audio is transcribed (Whisper), answered via RAG, and optionally spoken back (TTS)."),
    ("FR-04", "Lawyer Directory", "Users browse verified lawyers by city/specialization with contact details and profile images."),
    ("FR-05", "Legal Topics", "Users explore categorized legal topics and educational content on the platform."),
    ("FR-06", "Query History", "Logged-in users' questions are stored in MongoDB with userId linkage."),
    ("FR-07", "Admin Panel", "Admins manage knowledge base, lawyers, user queries, and system settings."),
    ("FR-08", "Knowledge Base CRUD", "Admins create, approve, and manage Urdu legal articles."),
    ("FR-09", "TTS Playback", "Users can hear answers in Urdu via server TTS or browser fallback."),
    ("FR-10", "Health Monitoring", "Backend and NLP expose /health endpoints for service status."),
]

NFR_CATEGORIES = {
    "Usability (USA)": [
        "USA-1: Bilingual Urdu/English UI with RTL support for Urdu text.",
        "USA-2: Voice interface for users with limited typing literacy.",
        "USA-3: Clear error messages when NLP/backend unavailable.",
        "USA-4: Responsive design for mobile and desktop viewports.",
    ],
    "Performance (PER)": [
        "PER-1: Frontend main bundle ~118 KB with code-splitting.",
        "PER-2: NLP health check timeout 15 seconds.",
        "PER-3: LLM timeout 90 seconds with extractive fallback.",
        "PER-4: Retrieval top-k=4 chunks for balanced speed/quality.",
    ],
    "Reliability (REL)": [
        "REL-1: Extractive RAG fallback when LLM fails.",
        "REL-2: MongoDB persistence for users, queries, lawyers.",
        "REL-3: ChromaDB index survives service restarts (filesystem).",
    ],
    "Security (SEC)": [
        "SEC-1: JWT authentication for protected routes.",
        "SEC-2: bcrypt password hashing.",
        "SEC-3: Admin-only routes for sensitive operations.",
        "SEC-4: Google OAuth token verification server-side.",
    ],
}

NON_FUNCTIONAL_REQUIREMENTS = [
    ("NFR-01", "Performance", "Frontend main bundle ~118 KB with code-splitting; NLP answers within 90s (HF tier)."),
    ("NFR-02", "Security", "Password hashing (bcrypt), JWT, admin-only routes, Google OAuth verification."),
    ("NFR-03", "Usability", "Bilingual UI (Urdu + English), responsive design, accessible Radix components."),
    ("NFR-04", "Scalability", "Microservice architecture allows independent scaling of NLP service."),
    ("NFR-05", "Maintainability", "Three-tier separation: React frontend, Express backend, FastAPI NLP."),
    ("NFR-06", "Reliability", "Extractive RAG fallback when LLM unavailable; graceful error messages."),
    ("NFR-07", "Portability", "Runs on Windows dev environment; MongoDB + Python venv + Node.js."),
]

USE_CASES = [
    ("UC-01", "User Login", "Guest/User", "Authenticate via email/password or Google OAuth."),
    ("UC-02", "Ask Text Question", "Guest/User", "Submit legal question in Urdu or English and receive answer."),
    ("UC-03", "Ask Voice Question", "Guest/User", "Record audio, get transcription + legal answer + optional TTS."),
    ("UC-04", "Find Lawyer", "Guest/User", "Search and view lawyer profiles by specialization and city."),
    ("UC-05", "Browse Legal Topics", "Guest/User", "View categorized legal information pages."),
    ("UC-06", "Admin Login", "Admin", "Access protected admin panel at /adminvoice2law001."),
    ("UC-07", "Manage Lawyers", "Admin", "Add, edit, delete lawyer records."),
    ("UC-08", "Manage Knowledge Base", "Admin", "Create and approve Urdu legal articles."),
    ("UC-09", "Review Queries", "Admin", "View user questions and AI answers for monitoring."),
    ("UC-10", "User Logout", "User", "Sign out and clear session token."),
]

TEST_CASES = [
    ("TC-01", "FR-01", "User Registration", "POST /api/auth/register with valid data", "201, JWT returned", "Pass"),
    ("TC-02", "FR-01", "User Login", "POST /api/auth/login with valid credentials", "200, JWT returned", "Pass"),
    ("TC-03", "FR-01", "Google OAuth", "POST /api/auth/google with valid ID token", "200, user profile saved", "Pass"),
    ("TC-04", "FR-01", "Invalid Login", "Wrong password", "401 Unauthorized", "Pass"),
    ("TC-05", "FR-02", "Urdu Text Q&A", "چوری کی سزا کیا ہے؟", "Answer from PPC indexed text", "Pass"),
    ("TC-06", "FR-02", "English Text Q&A", "What is bail?", "Answer from CrPC chunks", "Pass"),
    ("TC-07", "FR-02", "Empty Question", "Empty string body", "400 validation error", "Pass"),
    ("TC-08", "FR-03", "Voice Upload", "POST /api/voice with audio file", "Transcript + answer returned", "Pass"),
    ("TC-09", "FR-03", "Urdu Script Fix", "Whisper Hindi output", "Converted to Urdu Arabic script", "Pass"),
    ("TC-10", "FR-09", "TTS Request", "POST /api/tts with Urdu text", "Audio URL or base64 returned", "Pass"),
    ("TC-11", "FR-04", "List Lawyers", "GET /api/lawyers", "Array of lawyer objects", "Pass"),
    ("TC-12", "FR-04", "Lawyer Detail", "GET /api/lawyers/:id", "Single lawyer profile", "Pass"),
    ("TC-13", "FR-06", "Query userId Link", "Voice query while logged in", "userId saved in queries collection", "Pass"),
    ("TC-14", "FR-07", "Admin Route Protection", "Access /admin without token", "Redirect to login", "Pass"),
    ("TC-15", "FR-08", "Create Knowledge Entry", "Admin POST knowledge", "Entry created with pending status", "Pass"),
    ("TC-16", "FR-10", "Backend Health", "GET /api/health", "200 OK", "Pass"),
    ("TC-17", "FR-10", "NLP Health", "GET :8001/health", "embeddings + chroma status", "Pass"),
    ("TC-18", "NFR-01", "Frontend Bundle Size", "Vite build output", "Main chunk ~118 KB", "Pass"),
    ("TC-19", "NFR-02", "JWT Expiry", "Expired token on protected route", "401 Unauthorized", "Pass"),
    ("TC-20", "NFR-06", "NLP Down Fallback", "Stop NLP service, ask question", "Fallback message returned", "Pass"),
    ("TC-21", "FR-02", "Family Law Query", "نکاح کی شرائط کیا ہیں؟", "Answer from family law chunks", "Pass"),
    ("TC-22", "FR-02", "Property Query", "Land acquisition compensation", "Answer from property chunks", "Pass"),
    ("TC-23", "FR-03", "Auto TTS After Voice", "Complete voice flow", "Answer spoken automatically", "Pass"),
    ("TC-24", "NFR-03", "Responsive Navbar", "Mobile viewport 375px", "Menu and layout adapt", "Pass"),
    ("TC-25", "FR-04", "Seed Lawyers", "npm run seed:lawyers", "MongoDB populated", "Pass"),
    ("TC-26", "FR-02", "RAG Retrieval", "NLP /ask direct", "Sources from ChromaDB", "Pass"),
    ("TC-27", "NFR-06", "Extractive Fallback", "LLM timeout", "Top chunk text returned", "Pass"),
    ("TC-28", "FR-01", "Get Current User", "GET /api/auth/me with token", "User profile returned", "Pass"),
    ("TC-29", "FR-07", "Admin Query Stats", "GET /api/queries/stats", "Statistics JSON", "Pass"),
    ("TC-30", "Integration", "Full Stack E2E", "MongoDB+NLP+Backend+Frontend", "All services communicate", "Pass"),
    ("TC-31", "FR-02", "CORS Preflight", "OPTIONS from localhost:5173", "CORS headers present", "Pass"),
    ("TC-32", "FR-03", "Large Audio File", "Upload >1MB audio", "Transcription or size error", "Pass"),
    ("TC-33", "FR-04", "Filter by City", "Lawyers in Karachi", "Filtered results", "Pass"),
    ("TC-34", "FR-07", "Delete Lawyer", "Admin DELETE /lawyers/:id", "204 or 200 success", "Pass"),
    ("TC-35", "FR-08", "Approve Article", "Admin update status approved", "Visible in public list", "Pass"),
    ("TC-36", "NFR-03", "Scroll Voice Modal", "Long Urdu answer", "Full text scrollable", "Pass"),
    ("TC-37", "FR-02", "Query Expansion", "Urdu چوری question", "PPC chunks retrieved", "Pass"),
    ("TC-38", "FR-01", "Duplicate Email", "Register existing email", "409 or 400 error", "Pass"),
    ("TC-39", "FR-10", "NLP Chroma Count", "/health chunk_count", "6352", "Pass"),
    ("TC-40", "FR-03", "WebSpeech Transcript", "Send transcript field", "Skips STT upload", "Pass"),
    ("TC-41", "FR-02", "Language English", "language=english", "English answer", "Pass"),
    ("TC-42", "FR-02", "Language Urdu", "language=urdu", "Urdu answer", "Pass"),
    ("TC-43", "NFR-02", "Admin Without Token", "GET /queries no auth", "401", "Pass"),
    ("TC-44", "FR-07", "Non-Admin Access", "User token on admin route", "403 Forbidden", "Pass"),
    ("TC-45", "FR-04", "Lawyer Image URL", "Seed data images", "Images load in UI", "Pass"),
    ("TC-46", "FR-09", "TTS Empty Text", "Empty string", "400 validation", "Pass"),
    ("TC-47", "FR-02", "Special Characters", "Question with symbols", "Handled gracefully", "Pass"),
    ("TC-48", "NFR-01", "Lazy Route Load", "Navigate to /ask", "Chunk loads on demand", "Pass"),
    ("TC-49", "FR-03", "Mic Permission Denied", "Block microphone", "User-friendly error", "Pass"),
    ("TC-50", "Integration", "Postman Collection", "Run all requests", "Collection passes", "Pass"),
    ("TC-51", "FR-02", "Bail Question Urdu", "ضمانت کب ملتی ہے؟", "CrPC answer", "Pass"),
    ("TC-52", "FR-02", "Marriage Question", "نکاح کی شرائط", "Family law answer", "Pass"),
    ("TC-53", "FR-02", "Property Question", "Land registration", "Property chunks used", "Pass"),
    ("TC-54", "NFR-06", "Chroma Telemetry Patch", "Start NLP twice", "No capture() crash", "Pass"),
    ("TC-55", "FR-01", "Google Picture in Navbar", "Login via Google", "Photo + name shown", "Pass"),
    ("TC-56", "FR-07", "Admin Dashboard Stats", "Load dashboard", "Stats cards render", "Pass"),
    ("TC-57", "FR-05", "Legal Topics Page", "Navigate /legal-topics", "Page loads", "Pass"),
    ("TC-58", "FR-05", "How It Works", "Navigate /how-it-works", "Content displays", "Pass"),
    ("TC-59", "NFR-07", "Startup Script", "start_nlp.ps1", "Single process guard", "Pass"),
    ("TC-60", "Integration", "Demo Rehearsal", "Full demo script", "All features work", "Pass"),
]

CODE_SNIPPETS = [
    (
        "queryController.js — optional userId for guest and logged-in ask",
        """function optionalUserId(req) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || null;
  } catch (err) {
    return null;
  }
}""",
    ),
    (
        "retrieval.py — Urdu to English query expansion",
        """_URDU_TO_ENGLISH = {
    "چوری": "theft stealing larceny Pakistan Penal Code section 379",
    "ضمانت": "bail bailable non-bailable offence",
    "نکاح": "marriage nikah family law",
}""",
    ),
    (
        "VoiceBot — auto TTS after voice answer",
        """// After receiving voice response, speak answer in Urdu
if (data.answer) {
  await speakText(data.answer, 'urdu');
}""",
    ),
]

FIGURES = [
    "Block Diagram for Voice2Law",
    "Voice2Law FYDP2 Project Schedule / Milestone Chart",
    "Screenshot of Pakistan Code (Legal Reference)",
    "Screenshot of ROSS Intelligence (Legal AI)",
    "Screenshot of DoNotPay",
    "Screenshot of ChatGPT Legal Use",
    "Screenshot of Pakistani Lawyer Directory Sites",
    "Use Case Diagram Voice2Law",
    "Voice2Law Three-Tier Architecture Diagram",
    "Voice2Law Activity Diagram (Voice Q&A Flow)",
    "Voice2Law Class Diagram",
    "User State Transition Diagram",
    "Admin State Transition Diagram",
    "Voice2Law Context Level DFD (Level 0)",
    "User Level 0 DFD",
    "Admin Level 0 DFD",
    "System Level 0 DFD",
    "Voice2Law Level 1 DFD",
    "Voice2Law Sequence Diagram (Text Q&A)",
    "Voice2Law Sequence Diagram (Voice Q&A)",
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
    "Postman API Test Collection",
    "NLP Health Endpoint Output",
    "Chroma Index Statistics (6352 chunks)",
]
