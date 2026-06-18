const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { validationResult } = require('express-validator');

const User = require('../models/User');

function getGoogleClient() {
  if (!process.env.GOOGLE_CLIENT_ID) return null;
  return new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
}

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * POST /api/auth/register
 * Create a new standard user account.
 */
async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: 'user' });

    return res.status(201).json({
      token: signToken(user),
      user: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticate any user (standard or admin) and return a JWT.
 */
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        message: 'This account uses Google sign-in. Please continue with Google.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      token: signToken(user),
      user: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/google
 * Verify a Google ID token from the SPA and return the same JWT session as login.
 */
async function googleAuth(req, res, next) {
  try {
    const idToken = req.body.credential || req.body.idToken;
    if (!idToken) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const googleClient = getGoogleClient();
    if (!googleClient) {
      return res.status(503).json({ message: 'Google sign-in is not configured on the server' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ message: 'Google account did not provide an email address' });
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const name = payload.name || payload.given_name || email.split('@')[0];
    const picture = payload.picture || null;

    let user = await User.findOne({ email });
    if (user) {
      let dirty = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        dirty = true;
      }
      if (picture && user.picture !== picture) {
        user.picture = picture;
        dirty = true;
      }
      if (name && user.name !== name) {
        user.name = name;
        dirty = true;
      }
      if (dirty) await user.save();
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        picture,
        role: 'user',
      });
    }

    return res.json({
      token: signToken(user),
      user: user.toSafeJSON(),
    });
  } catch (err) {
    if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token')) {
      return res.status(401).json({ message: 'Invalid or expired Google sign-in. Please try again.' });
    }
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Return the currently authenticated user's profile.
 */
async function me(req, res) {
  return res.json({ user: req.user.toSafeJSON ? req.user.toSafeJSON() : req.user });
}

module.exports = { register, login, googleAuth, me };
