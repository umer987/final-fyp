const path = require('path');

// Always load backend/.env (not cwd), so ELEVENLABS_API_KEY works when started from repo root.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { corsOrigin } = require('./config/cors');

const authRoutes = require('./routes/authRoutes');
const lawyerRoutes = require('./routes/lawyerRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const queryRoutes = require('./routes/queryRoutes');
const voiceRoutes = require('./routes/voiceRoutes');
const ttsRoutes = require('./routes/ttsRoutes');

const app = express();

// ---- Security & infrastructure middleware ----
app.use(helmet());

// Allow requests from the React frontend (any localhost Vite port in dev).
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded audio files statically (handy for debugging the /api/voice flow).
// Set SERVE_UPLOADS=false in production if you do not want public file access.
if (process.env.SERVE_UPLOADS !== 'false') {
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
}

// ---- Health check ----
const { getSttEngine } = require('./services/stt');
const { checkNlpHealth, getNlpAskUrl } = require('./services/nlp');

app.get('/api/health', async (req, res) => {
  const nlp = await checkNlpHealth();
  res.json({
    status: 'ok',
    service: 'voice2law-backend',
    sttEngine: getSttEngine(),
    nlpServiceUrl: getNlpAskUrl(),
    nlpReachable: nlp.ok,
    nlpIndexedChunks: nlp.indexedChunks,
    nlpEmbeddingsReady: nlp.embeddingsReady,
    nlpEmbeddingsError: nlp.embeddingsError,
    nlpTtsProvider: nlp.ttsProvider,
    nlpTtsConfigured: nlp.ttsConfigured,
    nlpTtsModel: nlp.ttsModel,
    nlpTtsVoiceId: nlp.ttsVoiceId,
    nlpLlmProvider: nlp.llmProvider,
    nlpLlmExtractiveOnly: nlp.llmExtractiveOnly,
    time: new Date().toISOString(),
  });
});

// ---- Feature routers ----
app.use('/api/auth', authRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/knowledge', knowledgeRoutes);
// Query routes register both /api/ask and /api/queries (see queryRoutes.js).
app.use('/api', queryRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/tts', ttsRoutes);

// ---- Production: serve Vite build (single-server demo) ----
const isProduction = process.env.NODE_ENV === 'production';
const frontendBuildPath = path.join(__dirname, '..', '..', 'build');

if (isProduction) {
  app.use(express.static(frontendBuildPath));
  app.get(/^\/(?!api\/).*/, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

// ---- 404 handler for unknown API routes ----
app.use((req, res) => {
  if (isProduction && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(frontendBuildPath, 'index.html'));
  }
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ---- Central error handler ----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
});

// ---- Start the server after the DB connection is ready ----
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log('==============================================');
      console.log(' Voice2Law backend is running');
      console.log(` Local:   http://localhost:${PORT}`);
      console.log(` Health:  http://localhost:${PORT}/api/health`);
      console.log('==============================================');
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });

module.exports = app;
