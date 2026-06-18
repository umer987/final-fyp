const express = require('express');
const { body } = require('express-validator');

const {
  listLawyers,
  getLawyer,
  createLawyer,
  updateLawyer,
  deleteLawyer,
} = require('../controllers/lawyerController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ---- Public read endpoints ----
router.get('/', listLawyers);
router.get('/:id', getLawyer);

// ---- Admin-only write endpoints ----
router.post(
  '/',
  protect,
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('specialization').trim().notEmpty().withMessage('Specialization is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
  ],
  createLawyer
);

router.put('/:id', protect, adminOnly, updateLawyer);
router.delete('/:id', protect, adminOnly, deleteLawyer);

module.exports = router;
