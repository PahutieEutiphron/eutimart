/**
 * Authentication middleware for EutiMart.
 */

const db = require('../db/ds');

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    const user = db.findUserById(req.session.user.id);
    if (user) {
      req.user = user;
      return next();
    }
  }

  const wantsJson =
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes('application/json')) ||
    req.is('application/json');

  if (wantsJson) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  return res.redirect('/account/login');
}

function optionalAuth(req, res, next) {
  if (req.session && req.session.user) {
    const user = db.findUserById(req.session.user.id);
    if (user) {
      req.user = user;
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
