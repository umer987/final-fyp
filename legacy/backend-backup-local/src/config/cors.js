/**
 * CORS origin check for the React frontend.
 *
 * Development: allow any http://localhost:<port> or http://127.0.0.1:<port>
 * (Vite may use 5173, 5174, etc. when the default port is busy).
 *
 * Production: only CLIENT_URL (comma-separated list supported).
 */

const LOCALHOST_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function parseAllowedOrigins() {
  const raw = process.env.CLIENT_URL || 'http://localhost:5173';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isDev() {
  return process.env.NODE_ENV !== 'production';
}

/**
 * @param {string | undefined} origin  Request Origin header (absent for same-origin / curl).
 * @param {(err: Error | null, allow?: boolean) => void} callback
 */
function corsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  const allowed = parseAllowedOrigins();
  if (allowed.includes(origin)) {
    callback(null, true);
    return;
  }

  if (isDev() && LOCALHOST_ORIGIN.test(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked origin: ${origin}`));
}

module.exports = { corsOrigin, parseAllowedOrigins, LOCALHOST_ORIGIN };
