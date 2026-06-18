# Voice2Law Backend (GitHub)

Adapted from [umer987/final-fyp](https://github.com/umer987/final-fyp) `functions/index.js` — Firebase Cloud Functions API running as local Express.

## Stack

- **Express** on port 5000
- **Firebase Admin** + **Firestore** (not MongoDB)
- **Firebase Auth** ID tokens for admin routes (not JWT email/password)
- **OpenAI** for `/api/ai/text-query` and `/api/ai/voice-query`

The previous MongoDB + NLP microservice backend is preserved in `../backend-backup-local/`.

## Setup

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

1. Create a Firebase project and download a service account JSON key.
2. Set `FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json` in `.env`.
3. Set `OPENAI_API_KEY` for AI answers (optional — without it, queries are saved with a placeholder response).

## Run

```powershell
npm run dev
# Health: http://localhost:5000/api/health
```

## Seed data

After Firebase is configured and an admin user exists with custom claim `admin: true`:

```http
POST /api/admin/seed
Authorization: Bearer <firebase-admin-id-token>
```

## Deploy to Firebase (optional)

The original single-file export lives in the GitHub repo at `functions/index.js`. This folder is structured for local dev with the same route handlers in `src/app.js`.
