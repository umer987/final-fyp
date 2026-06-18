const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const Query = require('../models/Query');
const { askNlp } = require('../services/nlp');
const { recommendLawyers } = require('../services/lawyerRecommendation');

/**
 * Generate a legal answer via the NLP microservice, with a short fallback if unreachable.
 *
 * @param {string} question  The user's question.
 * @param {string} language  'urdu' | 'english'.
 * @returns {Promise<{ answer: string, fromNlp: boolean, recommendedLawyers: object[], detectedTopic: string|null }>}
 */
async function generateAnswer(question, language) {
  const { answer, fromNlp, sources } = await askNlp(question, language);

  if (!fromNlp) {
    return { answer, fromNlp, recommendedLawyers: [], detectedTopic: null };
  }

  const { lawyers, detectedTopic } = await recommendLawyers(question, sources);
  return { answer, fromNlp, recommendedLawyers: lawyers, detectedTopic };
}

/**
 * Try to read an authenticated user's id from the Authorization header
 * WITHOUT requiring it. /api/ask works for both guests and logged-in users.
 */
function optionalUserId(req) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || null;
  } catch (err) {
    return null;
  }
}

/**
 * POST /api/ask (public)
 * Body: { question, language }
 * Saves the query and returns an NLP-generated answer (or fallback if NLP is down).
 */
async function ask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { question, language = 'urdu' } = req.body;
    const { answer: answerText, fromNlp, recommendedLawyers, detectedTopic } =
      await generateAnswer(question, language);

    const query = await Query.create({
      questionText: question,
      language,
      answerText,
      source: 'text',
      fromNlp,
      userId: optionalUserId(req),
    });

    res.json({
      id: query._id,
      question: query.questionText,
      language: query.language,
      answer: query.answerText,
      fromNlp,
      source: query.source,
      recommendedLawyers,
      detectedTopic,
      createdAt: query.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/queries/me (authenticated user)
 * Returns the current user's saved questions and answers.
 */
async function listMyQueries(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const queries = await Query.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(queries);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/queries (admin only)
 * Returns recent queries for monitoring/feedback in the admin dashboard.
 */
async function listQueries(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const queries = await Query.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email');
    res.json(queries);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/queries/stats (admin only)
 * Basic AI-monitoring stats for the dashboard.
 */
async function queryStats(req, res, next) {
  try {
    const [total, byLanguage, bySource, recent] = await Promise.all([
      Query.countDocuments(),
      Query.aggregate([{ $group: { _id: '$language', count: { $sum: 1 } } }]),
      Query.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
      Query.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    res.json({
      total,
      last24h: recent,
      byLanguage,
      bySource,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  ask,
  listMyQueries,
  listQueries,
  queryStats,
  generateAnswer,
  optionalUserId,
};
