const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const admin = require('firebase-admin');
const cors = require('cors');
const express = require('express');
const createApiApp = require('./app');
const nlp = require('./services/nlp');
const sessionAuth = require('./services/sessionAuth');

/**
 * Initialize Firebase Admin from a service account or project id.
 * Wrapped so a missing/invalid credential can NEVER crash the process — we simply
 * report Firebase as disabled and the Firestore-backed routes degrade gracefully.
 * @returns {boolean} true when real credentials were applied.
 */
function initializeFirebaseAdmin() {
  if (admin.apps.length) return true;

  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (saPath) {
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const serviceAccount = require(path.resolve(saPath));
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      return true;
    } catch (err) {
      console.error(`[firebase] Failed to load service account at "${saPath}": ${err.message}`);
      console.error('[firebase] Continuing WITHOUT Firebase — RAG answers still work; Firestore routes are disabled.');
      return false;
    }
  }

  if (process.env.FIREBASE_PROJECT_ID) {
    try {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
      return true;
    } catch (err) {
      console.error(`[firebase] initializeApp with projectId failed: ${err.message}`);
      return false;
    }
  }

  console.warn(
    '[firebase] No FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID set — Firestore routes disabled. ' +
      'RAG answer routes (/api/ai/*) still work via the NLP service.',
  );
  return false;
}

let firebaseEnabled = false;
try {
  firebaseEnabled = initializeFirebaseAdmin();
} catch (err) {
  console.error('[firebase] Unexpected init error:', err.message);
  firebaseEnabled = false;
}

const app = express();
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientUrls.includes(origin)) return callback(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      return callback(null, clientUrls[0] || true);
    },
    credentials: true,
  }),
);

app.get('/api/health', async (req, res) => {
  // Probe the RAG/NLP service (cached) so the frontend banner reflects the real answer engine.
  const nlpHealth = await nlp.checkNlpHealth().catch(() => ({ ok: false }));
  res.json({
    status: 'ok',
    service: 'voice2law-backend',
    time: new Date().toISOString(),
    // RAG (nlp-service) is the primary answer engine.
    nlpServiceUrl: nlp.getNlpBaseUrl(),
    nlpReady: Boolean(nlpHealth.ok),
    ragReady: Boolean(nlpHealth.ok),
    indexedChunks: nlpHealth.indexedChunks,
    llmProvider: nlpHealth.llmProvider,
    firebaseConfigured: firebaseEnabled,
    googleAuthConfigured: sessionAuth.isGoogleAuthConfigured(),
    openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
  });
});

app.use('/api', createApiApp({ firebaseEnabled }));

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// Last-resort guards so a stray async error can never take the server down.
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception (server stays up):', err);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('==============================================');
    console.log(' Voice2Law backend (RAG via NLP service)');
    console.log(` Local:    http://localhost:${PORT}`);
    console.log(` Health:   http://localhost:${PORT}/api/health`);
    console.log(` NLP/RAG:  ${nlp.getNlpBaseUrl()}`);
    console.log(` Firebase: ${firebaseEnabled ? 'enabled' : 'disabled (Firestore routes degraded)'}`);
    console.log(` Google auth: ${sessionAuth.isGoogleAuthConfigured() ? 'enabled' : 'disabled (set GOOGLE_CLIENT_ID + JWT_SECRET)'}`);
    console.log('==============================================');
  });
}

module.exports = app;
