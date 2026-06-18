const express = require('express');
const { body } = require('express-validator');

const { register, login, googleAuth, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post(
  '/google',
  [
    body('credential').optional().isString().withMessage('credential must be a string'),
    body('idToken').optional().isString().withMessage('idToken must be a string'),
  ],
  googleAuth
);

router.get('/me', protect, me);

module.exports = router;
