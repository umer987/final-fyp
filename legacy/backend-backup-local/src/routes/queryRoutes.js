const express = require('express');
const { body } = require('express-validator');

const { ask, listMyQueries, listQueries, queryStats } = require('../controllers/queryController');
const { protect, adminOnly } = require('../middleware/auth');
const { askVoiceLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// ---- Public: ask a text question ----
router.post(
  '/ask',
  askVoiceLimiter,
  [
    body('question').trim().notEmpty().withMessage('Question is required'),
    body('language')
      .optional()
      .isIn(['urdu', 'english'])
      .withMessage('Language must be "urdu" or "english"'),
  ],
  ask
);

// ---- Authenticated user: own query history ----
router.get('/queries/me', protect, listMyQueries);

// ---- Admin: monitoring ----
router.get('/queries', protect, adminOnly, listQueries);
router.get('/queries/stats', protect, adminOnly, queryStats);

module.exports = router;
