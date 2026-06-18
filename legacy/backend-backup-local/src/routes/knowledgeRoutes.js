const express = require('express');
const { body } = require('express-validator');

const {
  listApproved,
  listAll,
  getEntry,
  createEntry,
  updateEntry,
  approveEntry,
  deleteEntry,
} = require('../controllers/knowledgeController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ---- Admin listing (must be declared before "/:id" to avoid clashing) ----
router.get('/all', protect, adminOnly, listAll);

// ---- Public read endpoints (approved entries only) ----
router.get('/', listApproved);
router.get('/:id', getEntry);

// ---- Admin-only write endpoints ----
router.post(
  '/',
  protect,
  adminOnly,
  [
    body('titleUrdu').trim().notEmpty().withMessage('Urdu title is required'),
    body('titleEnglish').trim().notEmpty().withMessage('English title is required'),
    body('contentUrdu').trim().notEmpty().withMessage('Urdu content is required'),
    body('category')
      .optional()
      .isIn(['family', 'rent', 'criminal', 'other'])
      .withMessage('Invalid category'),
  ],
  createEntry
);

router.put('/:id', protect, adminOnly, updateEntry);
router.patch('/:id/approve', protect, adminOnly, approveEntry);
router.delete('/:id', protect, adminOnly, deleteEntry);

module.exports = router;
