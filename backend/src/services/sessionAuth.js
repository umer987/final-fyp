const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

function getGoogleClientId() {
  return (process.env.GOOGLE_CLIENT_ID || '').trim();
}

function getJwtSecret() {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (!secret) {
    const err = new Error('JWT_SECRET is not configured in backend/.env');
    err.statusCode = 503;
    throw err;
  }
  return secret;
}

function isGoogleAuthConfigured() {
  return Boolean(getGoogleClientId() && (process.env.JWT_SECRET || '').trim());
}

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  return getAdminEmails().includes(String(email || '').toLowerCase());
}

async function verifyGoogleCredential(credential) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    const err = new Error('Google sign-in is not configured. Set GOOGLE_CLIENT_ID in backend/.env.');
    err.statusCode = 503;
    throw err;
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) {
    const err = new Error('Google account did not provide an email address');
    err.statusCode = 400;
    throw err;
  }
  return payload;
}

function resolveGoogleDisplayName(payload) {
  const fullName = (payload.name || '').trim();
  if (fullName) return fullName;
  const combined = [payload.given_name, payload.family_name].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  return null;
}

function buildUserFromGoogle(payload) {
  const email = payload.email.toLowerCase();
  const isAdmin = isAdminEmail(email);
  const displayName = resolveGoogleDisplayName(payload) || email.split('@')[0];
  const picture = payload.picture || null;
  return {
    id: payload.sub,
    uid: payload.sub,
    email,
    name: displayName,
    displayName,
    picture,
    photoURL: picture,
    role: isAdmin ? 'admin' : 'user',
    admin: isAdmin,
  };
}

function signSessionToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      uid: user.id,
      email: user.email,
      name: user.name,
      displayName: user.displayName || user.name,
      picture: user.picture || null,
      role: user.role,
      admin: user.admin === true,
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

function verifySessionToken(token) {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret);
    const isAdmin = decoded.admin === true || decoded.role === 'admin';
    const email = decoded.email || '';
    const displayName =
      (decoded.displayName || decoded.name || '').trim() ||
      email.split('@')[0] ||
      (isAdmin ? 'Voice2Law Admin' : 'User');
    return {
      uid: decoded.sub || decoded.uid,
      email,
      name: displayName,
      displayName,
      picture: decoded.picture || null,
      admin: isAdmin,
      role: isAdmin ? 'admin' : 'user',
    };
  } catch {
    return null;
  }
}

module.exports = {
  isGoogleAuthConfigured,
  verifyGoogleCredential,
  buildUserFromGoogle,
  signSessionToken,
  verifySessionToken,
};
