const mongoose = require('mongoose');

const querySchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: String,
      enum: ['urdu', 'english'],
      default: 'urdu',
    },
    answerText: {
      type: String,
      default: '',
    },
    // Whether the question arrived as typed text or transcribed voice.
    source: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text',
    },
    // Optional: set when an authenticated user asks the question.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // True when the answer came from the NLP service; false for graceful fallback text.
    fromNlp: {
      type: Boolean,
      default: null,
    },
  },
  // Only need createdAt for monitoring/analytics.
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('Query', querySchema);
