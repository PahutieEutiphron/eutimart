/**
 * Login rate-limiting middleware.
 *
 * 5 attempts per IP per 15-minute sliding window.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of attempts) {
    if (now - record.firstAttempt > WINDOW_MS) {
      attempts.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

function loginRateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  let record = attempts.get(ip);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    record = { count: 1, firstAttempt: now };
    attempts.set(ip, record);
    return next();
  }

  record.count++;

  if (record.count > MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 1000);

    const wantsJson =
      req.xhr ||
      (req.headers.accept && req.headers.accept.includes('application/json'));

    if (wantsJson) {
      return res.status(429).json({
        error: 'Too many login attempts. Please try again later.',
        retryAfter: retryAfterSec,
      });
    }

    return res.status(429).render('login', {
      error: 'Too many login attempts. Please try again later.',
      csrfToken: req.session.csrfToken || '',
    });
  }

  next();
}

module.exports = { loginRateLimit };
