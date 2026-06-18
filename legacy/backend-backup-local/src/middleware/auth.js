const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify the Bearer JWT from the Authorization header and attach the
 * matching user document to req.user. Responds 401 if the token is
 * missing or invalid.
 */
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized: missing token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized: user no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized: invalid or expired token' });
  }
}

/**
 * Guard that allows only admins through. Must run AFTER `protect`.
 */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin access required' });
  }
  next();
}

module.exports = { protect, adminOnly };
