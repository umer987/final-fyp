const Query = require('../models/Query');
const { generateAnswer, optionalUserId } = require('./queryController');
const { getSttEngine, transcribeUploadedAudio } = require('../services/stt');

/**
 * Transcribe an uploaded audio file using the configured STT engine.
 *
 * @param {Express.Multer.File} file  The uploaded audio file.
 * @param {string} language           'urdu' | 'english'.
 * @returns {Promise<string>} The transcribed text.
 */
async function transcribeAudio(file, language) {
  return transcribeUploadedAudio(file, language);
}

/**
 * POST /api/voice (public)
 * Multipart form field "audio" (optional when "transcript" is sent for webspeech).
 * Returns transcript + answer and stores the query.
 */
async function handleVoice(req, res, next) {
  try {
    const language = req.body.language === 'english' ? 'english' : 'urdu';
    const clientTranscript =
      typeof req.body.transcript === 'string' ? req.body.transcript.trim() : '';

    let transcript = clientTranscript;

    if (!transcript) {
      if (!req.file) {
        const engine = getSttEngine();
        const hint =
          engine === 'webspeech'
            ? 'Use Chrome/Edge and send field "transcript" from browser speech, or record audio with STT_ENGINE=whisper.'
            : 'Upload an audio file (form field "audio") or send a "transcript" from browser speech.';
        return res.status(400).json({ message: hint });
      }
      transcript = await transcribeAudio(req.file, language);
    }

    if (!transcript) {
      return res.status(400).json({
        message: 'No speech was detected. Please speak clearly and try again.',
      });
    }

    const { answer: answerText, fromNlp, recommendedLawyers, detectedTopic } =
      await generateAnswer(transcript, language);

    const query = await Query.create({
      questionText: transcript,
      language,
      answerText,
      source: 'voice',
      fromNlp,
      userId: optionalUserId(req),
    });

    const payload = {
      id: query._id,
      transcript,
      language,
      answer: answerText,
      fromNlp,
      source: 'voice',
      recommendedLawyers,
      detectedTopic,
      sttEngine: clientTranscript ? 'webspeech' : getSttEngine(),
      createdAt: query.createdAt,
    };

    if (req.file) {
      payload.file = {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
      };
    }

    res.json(payload);
  } catch (err) {
    next(err);
  }
}

module.exports = { handleVoice, transcribeAudio };
