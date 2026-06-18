const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');

const { handleVoice } = require('../controllers/voiceController');
const { askVoiceLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Ensure the uploads directory exists at startup.
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Store uploaded audio on disk in the uploads/ folder with a unique name.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.audio';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `voice-${unique}${ext}`);
  },
});

// Accept common audio formats only, max 15 MB.
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

// POST /api/voice — multipart: optional "audio", optional "transcript" (browser STT), "language"
router.post('/', askVoiceLimiter, upload.single('audio'), handleVoice);

module.exports = router;
