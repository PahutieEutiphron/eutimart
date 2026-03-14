/**
 * Account routes: login, signup, logout.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/ds');
const { loginRateLimit } = require('../middleware/rl');

function ensureCsrf(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

function validateCsrf(req, res) {
  const token = req.body._csrf;
  if (!token || token !== req.session.csrfToken) {
    const wantsJson =
      req.xhr ||
      (req.headers.accept && req.headers.accept.includes('application/json'));
    if (wantsJson) {
      res.status(403).json({ error: 'Invalid CSRF token.' });
    } else {
      res.status(403).send('Forbidden — invalid CSRF token.');
    }
    return false;
  }
  return true;
}

router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/shop');
  }
  const csrfToken = ensureCsrf(req);
  res.render('login', { error: null, csrfToken });
});

router.post('/login', loginRateLimit, async (req, res) => {
  const csrfToken = ensureCsrf(req);
  if (!validateCsrf(req, res)) return;

  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Invalid email or password.', csrfToken });
  }

  const user = db.findUserByEmail(email);

  if (!user) {
    await db.verifyPassword(password, '$2a$12$000000000000000000000uGEFnLEVELDUMMYHASHFORtiming000');
    return res.render('login', { error: 'Invalid email or password.', csrfToken });
  }

  const valid = await db.verifyPassword(password, user.password);
  if (!valid) {
    return res.render('login', { error: 'Invalid email or password.', csrfToken });
  }

  req.session.regenerate((err) => {
    if (err) {
      return res.render('login', { error: 'Server error. Please try again.', csrfToken });
    }

    req.session.user = { id: user.id, email: user.email, name: user.name };
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');

    res.redirect('/shop');
  });
});

router.get('/signup', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/shop');
  }
  const csrfToken = ensureCsrf(req);
  res.render('signup', { error: null, csrfToken });
});

router.post('/signup', async (req, res) => {
  const csrfToken = ensureCsrf(req);
  if (!validateCsrf(req, res)) return;

  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.render('signup', { error: 'All fields are required.', csrfToken });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.render('signup', { error: 'Please enter a valid email address.', csrfToken });
  }

  if (password.length < 8) {
    return res.render('signup', { error: 'Password must be at least 8 characters.', csrfToken });
  }

  if (name.trim().length < 2) {
    return res.render('signup', { error: 'Name must be at least 2 characters.', csrfToken });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.render('signup', { error: 'An account with this email already exists.', csrfToken });
  }

  try {
    const user = await db.createUser(email, password, name);

    req.session.regenerate((err) => {
      if (err) {
        return res.render('signup', { error: 'Server error. Please try again.', csrfToken });
      }

      req.session.user = { id: user.id, email: user.email, name: user.name };
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');

      res.redirect('/shop');
    });
  } catch (e) {
    return res.render('signup', { error: 'Server error. Please try again.', csrfToken });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie('_em_sid');
    res.redirect('/');
  });
});

module.exports = router;
