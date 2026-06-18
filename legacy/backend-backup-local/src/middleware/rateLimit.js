const rateLimit = require('express-rate-limit');

/** Shared limiter for public AI endpoints (POST /api/ask, POST /api/voice). */
const askVoiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again in a few minutes.' },
});

module.exports = { askVoiceLimiter };
