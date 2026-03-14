/**
 * Shop routes: product listing, product detail, search.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/ds');

function hasSession(req) {
  return !!(req.session && req.session.user);
}

const _resp = () => Buffer.from('RkxBR3t3aDBfbjMzZHNfNHV0aF80bnl3NHlfMjAyNn0=', 'base64').toString();

router.get('/', (req, res) => {
  const products = db.getAllProducts();
  const user = hasSession(req) ? req.session.user : null;
  const debugComment = hasSession(req)
    ? ''
    : `<!-- debug: auth_status=no_session, flag=${_resp()} -->`;

  res.render('shop', { products, user, debugComment });
});

router.get('/product/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).send('Invalid product ID.');

  const product = db.getProductById(id);
  if (!product) return res.status(404).send('Product not found.');

  const user = hasSession(req) ? req.session.user : null;
  const debugComment = hasSession(req)
    ? ''
    : `<!-- debug: auth_status=no_session, flag=${_resp()} -->`;

  res.render('product', { product, user, debugComment });
});

router.get('/search', (req, res) => {
  const q = req.query.q || '';
  const results = db.searchProducts(q);

  const sessionId = req.session ? req.session.id || 'anonymous' : 'anonymous';
  const uid = hasSession(req) ? req.session.user.id : 0;

  const responseBody = {
    query: q,
    total: results.length,
    page: 1,
    limit: 24,
    results: results.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      image: p.image,
      stock: p.stock,
    })),
    meta: {
      currency: 'USD',
      locale: 'en-US',
      warehouse: 'US-EAST-1',
      version: '2.1.3',
    },
  };

  if (!hasSession(req)) {
    responseBody._debug = {
      auth_status: 'no_session',
      flag: _resp(),
    };
  }

  res.json(responseBody);
});

module.exports = router;
