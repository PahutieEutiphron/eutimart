/**
 * EutiMart — Premium Tech Gadgets Store
 *
 * Node.js + Express + EJS, session-based auth.
 *
 * Port: 4000
 */

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 4000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.set('trust proxy', false);

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Session configuration
const SESSION_SECRET = crypto.randomBytes(64).toString('hex');

app.use(session({
  name: '_em_sid',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// Import checkout route (needed for service state reference)
const { router: checkoutRouter, dosState } = require('./routes/co');

// Service recovery middleware
app.use((req, res, next) => {
  if (dosState.serverRecovering) {
    res.set('Retry-After', '60');
    return res.status(503).json({
      error: 'Service temporarily unavailable. Please try again later.',
    });
  }
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Response headers
app.use((req, res, next) => {
  res.set('X-Powered-By', 'EutiMart/1.0.3');
  res.set('X-Request-Id', crypto.randomUUID());
  res.set('X-Frame-Options', 'DENY');
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});

// Cookie middleware
app.use((req, res, next) => {
  const cookieOpts = { sameSite: 'lax' };
  const longLived = { ...cookieOpts, maxAge: 365 * 24 * 60 * 60 * 1000 };
  const sessionLife = { ...cookieOpts, maxAge: 24 * 60 * 60 * 1000 };

  if (!req.cookies._em_tracking) {
    const r1 = Math.floor(Math.random() * 1e9);
    const r2 = Math.floor(Date.now() / 1000);
    res.cookie('_em_tracking', `GA1.2.${r1}.${r2}`, longLived);
  }

  if (!req.cookies._em_consent) {
    res.cookie('_em_consent', 'all_accepted', longLived);
  }

  if (!req.cookies._em_ab) {
    res.cookie('_em_ab', 'group_b', longLived);
  }

  if (!req.cookies._em_cart) {
    res.cookie('_em_cart', crypto.randomUUID(), {
      ...cookieOpts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  if (!req.cookies._em_fpid) {
    res.cookie('_em_fpid', crypto.randomBytes(16).toString('hex'), longLived);
  }

  if (!req.cookies._em_prefs) {
    const prefs = Buffer.from(JSON.stringify({
      theme: 'dark',
      lang: 'en',
      currency: 'USD',
    })).toString('base64');
    res.cookie('_em_prefs', prefs, longLived);
  }

  if (!req.cookies._em_ref) {
    res.cookie('_em_ref', 'direct', sessionLife);
  }

  if (!req.cookies._em_loc) {
    res.cookie('_em_loc', 'en-US', longLived);
  }

  if (req.session) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    res.cookie('_em_csrf', req.session.csrfToken, {
      ...cookieOpts,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  next();
});

// Routes
const authRouter = require('./routes/acc');
const shopRouter = require('./routes/catalog');
const cartRouter = require('./routes/bag');
const profileRouter = require('./routes/usr');

// Landing page
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/shop');
  }
  res.render('index', { user: null, csrfToken: req.session.csrfToken || '' });
});

app.use('/account', authRouter);
app.use('/shop', shopRouter);
app.use('/cart', cartRouter);
app.use('/checkout', checkoutRouter);
app.use('/profile', profileRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    user: req.session ? req.session.user || null : null,
    error: 'Page not found',
    csrfToken: req.session ? req.session.csrfToken || '' : '',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[EutiMart Error]', err.stack || err.message || err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║  EutiMart v1.0.3 — Premium Tech Store    ║`);
  console.log(`  ║  Listening on http://localhost:${PORT}       ║`);
  console.log(`  ╚══════════════════════════════════════════╝\n`);
});
