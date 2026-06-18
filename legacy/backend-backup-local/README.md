# Voice2Law — Backend API

Backend for **Voice2Law**, a bilingual (Urdu/English) Pakistani legal information assistant.
Built with **Node.js + Express + MongoDB (Mongoose)**.

This API powers the existing React frontend (in the parent folder) and replaces the
mocked/localStorage data and the hardcoded admin login.

---

## Features

- **JWT authentication** — user signup/signin, **Google sign-in** (SPA ID token), and admin login.
- **Lawyer directory** — public listing + admin CRUD, with auto-generated WhatsApp (`wa.me`) links.
- **Legal knowledge base** — Family / Rent / Criminal law entries in simplified Urdu, with an admin approval workflow.
- **User queries & feedback** — every question is stored; admin dashboard stats included.
- **`/api/ask`** — text question → answer (placeholder now, NLP-ready later).
- **`/api/voice`** — upload an audio file (via multer) → transcript + answer (Whisper-ready later).

---

## 1. Prerequisites

You need these installed on your machine:

| Tool | Why | Notes |
|------|-----|-------|
| **Node.js LTS** (v18 or v20) | Runs the server | Includes `npm` |
| **MongoDB** | Database | Local server **or** a free MongoDB Atlas cloud cluster |
| **Git** | Version control | Optional but recommended |
| **Postman** | Test the API | Optional |

### Windows install commands (PowerShell)

Run these one at a time. `winget` ships with modern Windows 10/11.

```powershell
# Node.js LTS (includes npm)
winget install OpenJS.NodeJS.LTS

# Git
winget install Git.Git

# MongoDB Community Server (local database)
winget install MongoDB.Server

# Postman (optional — for testing the API)
winget install Postman.Postman
```

> **Prefer the cloud?** Instead of installing MongoDB locally, create a free
> cluster at <https://www.mongodb.com/atlas>, click **Connect → Drivers**, copy
> the connection string, and put it in `MONGODB_URI` in your `.env` (see below).
> If you go this route you can skip `winget install MongoDB.Server`.

After installing, **close and reopen your terminal** so the new commands are on your PATH.
Verify:

```powershell
node -v
npm -v
```

---

## 2. Setup & run

From inside this `backend/` folder:

```powershell
# 1. Create your environment file from the template
Copy-Item .env.example .env

# 2. Install dependencies
npm install

# 3. (Optional) create the default admin account in the database
#    Requires MongoDB to be running. Default login: admin@voice2law.com / Voice2Law@Admin2024!
npm run seed:admin

# 4. Start the server in development (auto-restarts on changes)
npm run dev
```

For production-style start (no auto-restart): `npm start`

When it works you'll see:

```
MongoDB connected: 127.0.0.1/voice2law
==============================================
 Voice2Law backend is running
 Local:   http://localhost:5000
 Health:  http://localhost:5000/api/health
==============================================
```

> **Is MongoDB running?** If you installed MongoDB Server locally, it usually
> runs as a Windows service automatically. You can check with
> `Get-Service MongoDB`. If it isn't running, start it from the Services app or
> run `mongod` manually.

---

## 3. Environment variables (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Port the API listens on |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/voice2law` | MongoDB connection string |
| `JWT_SECRET` | `change_this_secret` | Secret for signing JWTs — **change this!** |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin (for CORS) |
| `GOOGLE_CLIENT_ID` | *(unset)* | Google OAuth Web client ID (verify SPA ID tokens) |
| `GOOGLE_CLIENT_SECRET` | *(unset)* | Optional for ID-token flow; keep in `.env` only |
| `NLP_SERVICE_URL` | *(unset)* | Phase 3: URL of the NLP answer service |
| `STT_SERVICE_URL` | *(unset)* | Phase 3: URL of the speech-to-text service |

### Google sign-in (Option A — SPA + backend)

The React app uses **Google Identity Services** (`@react-oauth/google`) to obtain an ID token, then
`POST /api/auth/google` with `{ credential }`. The backend verifies the token with `google-auth-library`
and returns the same `{ token, user }` payload as email/password login.

**Google Cloud Console** (APIs & Services → Credentials → OAuth 2.0 Client ID → Web application):

| Setting | Value |
|---------|--------|
| Authorized JavaScript origins | `http://localhost:5173`, `http://localhost:5174` (add every port you use) |
| Authorized redirect URIs | Not required for this flow (no server redirect callback) |

Frontend `.env`: `VITE_GOOGLE_CLIENT_ID` — same client ID as `GOOGLE_CLIENT_ID` on the backend.

**Troubleshooting — blank white page at `accounts.google.com/gsi/select`**

This usually means the browser was sent to Google’s account picker in **redirect** mode instead of a **popup** credential flow:

| Check | Action |
|-------|--------|
| Frontend implementation | Use `@react-oauth/google` `<GoogleLogin onSuccess={...}>` with `ux_mode="popup"` and `useOneTap={false}` — not `useGoogleLogin` with redirect in the same tab. |
| Client ID | `VITE_GOOGLE_CLIENT_ID` (frontend) must equal `GOOGLE_CLIENT_ID` (backend). |
| OAuth consent screen | Configure app name/scopes; if **Testing**, add your Google account under **Test users**. |
| JavaScript origins | `http://localhost:5173` (and production URL) under the Web client. |
| Popups / cookies | Allow popups for localhost; third-party cookie blocking can break GIS — try another browser or disable strict blocking for development. |

After fixing, click **Sign in with Google** on `/signin` — you should stay on `localhost:5173` (popup or inline picker), then see a success toast.

---

## 4. API endpoints

Base URL: `http://localhost:5000`

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | Public | Service status check |

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register a user `{ name, email, password }` |
| POST | `/api/auth/login` | Public | Login (user or admin) `{ email, password }` → `{ token, user }` |
| POST | `/api/auth/google` | Public | Google sign-in `{ credential }` or `{ idToken }` → `{ token, user }` |
| GET | `/api/auth/me` | Bearer token | Current user profile |

### Lawyers
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/lawyers` | Public | List lawyers (filters: `?city=&specialization=&verified=`). Each includes a `whatsappLink`. |
| GET | `/api/lawyers/:id` | Public | Get one lawyer |
| POST | `/api/lawyers` | Admin | Create `{ name, specialization, city, phone, email?, verified? }` |
| PUT | `/api/lawyers/:id` | Admin | Update a lawyer |
| DELETE | `/api/lawyers/:id` | Admin | Delete a lawyer |

### Knowledge base
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/knowledge` | Public | List **approved** entries (`?category=family\|rent\|criminal\|other`) |
| GET | `/api/knowledge/:id` | Public | Get one approved entry |
| GET | `/api/knowledge/all` | Admin | List all entries (any status) |
| POST | `/api/knowledge` | Admin | Create entry `{ titleUrdu, titleEnglish, category, contentUrdu, summaryUrdu? }` |
| PUT | `/api/knowledge/:id` | Admin | Update entry |
| PATCH | `/api/knowledge/:id/approve` | Admin | Approve a pending entry |
| DELETE | `/api/knowledge/:id` | Admin | Delete entry |

### Queries (Ask / monitoring)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ask` | Public | Ask a text question `{ question, language }` → saved + placeholder answer |
| GET | `/api/queries` | Admin | Recent queries (`?limit=`) |
| GET | `/api/queries/stats` | Admin | Aggregate stats (total, last 24h, by language, by source) |

### Voice
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/voice` | Public | `multipart/form-data`, field **`audio`** (+ optional `language`) → transcript + placeholder answer |

### Using a token
Admin endpoints expect an `Authorization` header:

```
Authorization: Bearer <token-from-login>
```

---

## 5. Project structure

```
backend/
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── uploads/              # uploaded audio (git-ignored, .gitkeep tracked)
└── src/
    ├── server.js         # Express app + startup
    ├── config/
    │   └── db.js         # Mongoose connection helper
    ├── models/
    │   ├── User.js
    │   ├── Lawyer.js
    │   ├── KnowledgeBase.js
    │   └── Query.js
    ├── middleware/
    │   └── auth.js       # protect + adminOnly
    ├── controllers/
    │   ├── authController.js
    │   ├── lawyerController.js
    │   ├── knowledgeController.js
    │   ├── queryController.js
    │   └── voiceController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── lawyerRoutes.js
    │   ├── knowledgeRoutes.js
    │   ├── queryRoutes.js
    │   └── voiceRoutes.js
    └── scripts/
        └── seedAdmin.js  # creates the default admin user
```

---

## 6. Connecting the frontend

The React app currently uses mocked data / localStorage and a hardcoded admin login.
To switch it to this backend:

1. Add `VITE_API_URL=http://localhost:5000/api` to the frontend's `.env`.
2. Replace the hardcoded check in `src/contexts/AuthContext.tsx` with a call to
   `POST /api/auth/login`, and store the returned `token`.
3. Send the token as `Authorization: Bearer <token>` on admin requests.
4. Replace localStorage reads (lawyers, knowledge base) with `fetch`/axios calls
   to the endpoints above.

The default admin (after `npm run seed:admin`) matches the frontend's existing
credentials: **admin@voice2law.com / Voice2Law@Admin2024!** — change the password
for production.

---

## 7. Adding NLP later (Phase 3) — optional, separate service

Right now `/api/ask` and `/api/voice` return **placeholder** text so the whole
app works end-to-end. The real AI lives in a **separate Python microservice** that
this backend will call over HTTP. You do **not** need any of this to run the app today.

### What it will do
- **Speech-to-text (STT):** transcribe uploaded Urdu/English audio using **Whisper**
  (`openai-whisper` or `faster-whisper`).
- **Answering:** retrieve relevant law from a **vector database** and generate a
  simplified answer using **transformers** (RAG-style).

### Suggested stack
- **FastAPI** (Python web framework for the microservice)
- **openai-whisper** / **faster-whisper** (transcription)
- **transformers** + **sentence-transformers** (embeddings + generation)
- A vector DB: **ChromaDB** (simplest) or **FAISS**

### Windows install commands for Phase 3

```powershell
# Python (LTS)
winget install Python.Python.3.12

# (Recommended) create and activate a virtual environment in the python service folder
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Core packages
pip install fastapi uvicorn[standard] python-multipart
pip install openai-whisper faster-whisper
pip install transformers sentence-transformers torch
pip install chromadb        # or: pip install faiss-cpu

# ffmpeg is required by Whisper for decoding audio
winget install Gyan.FFmpeg
```

### How it plugs in
Two clearly-marked `TODO` comments already mark the integration points:

- `src/controllers/queryController.js` → `generateAnswer()` — POST the question to
  `process.env.NLP_SERVICE_URL` and return the real answer.
- `src/controllers/voiceController.js` → `transcribeAudio()` — POST the uploaded
  audio file to `process.env.STT_SERVICE_URL` and return the real transcript.

Set `NLP_SERVICE_URL` and `STT_SERVICE_URL` in `.env`, swap the placeholder return
for the `fetch(...)` calls shown in those comments, and the rest of the app keeps
working unchanged.

---

## License

MIT
