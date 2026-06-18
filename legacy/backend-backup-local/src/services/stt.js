const { transcribeAudioFile } = require('./elevenlabs');
const { transcribeViaWhisperService } = require('./whisperStt');
const { friendlySttMessage } = require('./sttErrors');

const VALID_ENGINES = new Set(['whisper', 'elevenlabs', 'webspeech']);

/**
 * Active STT engine from STT_ENGINE (default: whisper — free via NLP/voice2law).
 */
function getSttEngine() {
  const raw = (process.env.STT_ENGINE || 'whisper').toLowerCase().trim();
  return VALID_ENGINES.has(raw) ? raw : 'whisper';
}

/**
 * Transcribe an uploaded audio file using the configured engine.
 *
 * @param {Express.Multer.File} file
 * @param {'urdu'|'english'} language
 * @returns {Promise<string>}
 */
async function transcribeUploadedAudio(file, language) {
  const engine = getSttEngine();

  if (engine === 'webspeech') {
    // Browser speech sends transcript; when audio is uploaded (Windows network fallback), use Whisper.
    return transcribeViaWhisperService(file.path, {
      language,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });
  }

  try {
    if (engine === 'elevenlabs') {
      return await transcribeAudioFile(file.path, {
        language,
        mimeType: file.mimetype,
        originalName: file.originalname,
      });
    }

    return await transcribeViaWhisperService(file.path, {
      language,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });
  } catch (err) {
    const friendly = friendlySttMessage(err.message, engine);
    const wrapped = new Error(friendly);
    wrapped.statusCode = err.statusCode || 502;
    wrapped.cause = err;
    throw wrapped;
  }
}

module.exports = { getSttEngine, transcribeUploadedAudio, VALID_ENGINES };
