const { validationResult } = require('express-validator');
const KnowledgeBase = require('../models/KnowledgeBase');

/**
 * GET /api/knowledge (public)
 * Returns ONLY approved entries. Optional filter: ?category=family
 */
async function listApproved(req, res, next) {
  try {
    const filter = { status: 'approved' };
    if (req.query.category) filter.category = req.query.category;

    const entries = await KnowledgeBase.find(filter).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/knowledge/all (admin only)
 * Returns every entry regardless of status, for the admin dashboard.
 */
async function listAll(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    const entries = await KnowledgeBase.find(filter).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/knowledge/:id (public — approved only)
 */
async function getEntry(req, res, next) {
  try {
    const entry = await KnowledgeBase.findById(req.params.id);
    if (!entry || entry.status !== 'approved') {
      return res.status(404).json({ message: 'Knowledge base entry not found' });
    }
    res.json(entry);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/knowledge (admin only)
 * New entries default to status "pending" unless explicitly approved.
 */
async function createEntry(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const entry = await KnowledgeBase.create(req.body);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/knowledge/:id (admin only)
 */
async function updateEntry(req, res, next) {
  try {
    const entry = await KnowledgeBase.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!entry) {
      return res.status(404).json({ message: 'Knowledge base entry not found' });
    }
    res.json(entry);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/knowledge/:id/approve (admin only)
 * Approval workflow: flip status from "pending" to "approved".
 */
async function approveEntry(req, res, next) {
  try {
    const entry = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!entry) {
      return res.status(404).json({ message: 'Knowledge base entry not found' });
    }
    res.json(entry);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/knowledge/:id (admin only)
 */
async function deleteEntry(req, res, next) {
  try {
    const entry = await KnowledgeBase.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Knowledge base entry not found' });
    }
    res.json({ message: 'Knowledge base entry deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listApproved,
  listAll,
  getEntry,
  createEntry,
  updateEntry,
  approveEntry,
  deleteEntry,
};
