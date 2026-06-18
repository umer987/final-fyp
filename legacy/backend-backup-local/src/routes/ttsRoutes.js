const express = require('express');

const { handleTts } = require('../controllers/ttsController');

const router = express.Router();

// POST /api/tts — JSON: { text, language } -> audio (audio/mpeg) or 502 JSON
router.post('/', handleTts);

module.exports = router;
