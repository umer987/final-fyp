# Legacy code

This folder holds older or superseded project code. **Nothing here is used by the live app**
(`src/` + `backend/` + `nlp-service/`).

## Contents

- **`voice2law/`** — earlier standalone Python RAG prototype (OCR + Chroma + speech demo).
- **`backend-backup-local/`** — the ORIGINAL backend (Express + MongoDB + JWT + Google OAuth +
  NLP proxy). Replaced by the current Firebase (Firestore) + OpenAI backend in `backend/`.
  Keep for reference — `src/services/nlp.js` shows the original `nlp-service` integration.
- **`old-chroma-data/`** — stale root Chroma copy. The active index is `nlp-service/data/chroma/`.

## Restoring

These were moved here (not deleted). To restore any of them, move the folder back to the repo
root, e.g. `Move-Item .\legacy\backend-backup-local ..\backend-backup-local`.
