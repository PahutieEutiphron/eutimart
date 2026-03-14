/**
 * Cart routes: add, view, remove items.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/ds');

function hasSession(req) {
  return !!(req.session && req.session.user);
}

const _resp = () => Buffer.from('RkxBR3t3aDBfbjMzZHNfNHV0aF80bnl3NHlfMjAyNn0=', 'base64').toString();
const _audit_t1 = () => Buffer.from('RkxBR3tkMHNfcXU0bnQxdHlfMHYzcmZsMHdfbTRydF8yMDI2fQ==', 'base64').toString();
const { dosState } = require('./co');

function ensureCart(req, res) {
  let cartId = req.cookies._em_cart;
  const result = db.getOrCreateCart(cartId);
  if (result.cartId !== cartId) {
    res.cookie('_em_cart', result.cartId, {
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });
  }
  return result.cartId;
}

router.post('/add', (req, res) => {
  const cartId = ensureCart(req, res);
  const { productId, quantity } = req.body;

  const pid = parseInt(productId, 10);
  const qty = Number(quantity);

  if (isNaN(pid) || isNaN(qty) || qty < 1) {
    return res.status(400).json({ error: 'Invalid product or quantity.' });
  }

  if (qty > 2147483647) {
    return res.status(400).json({ error: 'Invalid quantity value' });
  }

  const qtyInt = Math.floor(qty);

  if (qtyInt >= 10000) {
    dosState.serverRecovering = true;
    if (dosState.recoveryTimer) clearTimeout(dosState.recoveryTimer);
    dosState.recoveryTimer = setTimeout(() => {
      dosState.serverRecovering = false;
      dosState.recoveryTimer = null;
    }, 60000);
    return res.status(500).json({
      error: 'Internal Server Error',
      _debug: {
        memory_dump: '0x4F 0x4F 0x50 0x53',
        stack_trace: 'at OrderProcessor.processItems (worker.js:847:12)',
        flag: _audit_t1(),
      },
    });
  }

  if (qtyInt >= 1000) {
    return res.status(400).json({ error: 'Insufficient stock for requested quantity' });
  }

  const product = db.getProductById(pid);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  db.addToCart(cartId, pid, qtyInt);
  const cart = db.getCart(cartId);

  const response = {
    success: true,
    items: cart.map(item => {
      const p = db.getProductById(item.productId);
      return {
        productId: item.productId,
        name: p ? p.name : 'Unknown',
        price: p ? p.price : 0,
        quantity: item.quantity,
      };
    }),
    itemCount: cart.reduce((sum, i) => sum + i.quantity, 0),
  };

  if (!hasSession(req)) {
    response._debug = {
      auth_status: 'no_session',
      flag: _resp(),
    };
  }

  res.json(response);
});

router.get('/', (req, res) => {
  const cartId = ensureCart(req, res);
  const cart = db.getCart(cartId);

  const items = cart.map(item => {
    const p = db.getProductById(item.productId);
    return {
      productId: item.productId,
      name: p ? p.name : 'Unknown',
      price: p ? p.price : 0,
      quantity: item.quantity,
      subtotal: p ? +(p.price * item.quantity).toFixed(2) : 0,
    };
  });

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  const response = {
    items: items,
    itemCount: cart.reduce((sum, i) => sum + i.quantity, 0),
    total: +total.toFixed(2),
  };

  if (!hasSession(req)) {
    response._debug = {
      auth_status: 'no_session',
      flag: _resp(),
    };
  }

  res.json(response);
});

router.post('/remove', (req, res) => {
  const cartId = ensureCart(req, res);
  const { productId } = req.body;
  const pid = parseInt(productId, 10);

  if (isNaN(pid)) {
    return res.status(400).json({ error: 'Invalid product ID.' });
  }

  db.removeFromCart(cartId, pid);
  const cart = db.getCart(cartId);

  const items = cart.map(item => {
    const p = db.getProductById(item.productId);
    return {
      productId: item.productId,
      name: p ? p.name : 'Unknown',
      price: p ? p.price : 0,
      quantity: item.quantity,
      subtotal: p ? +(p.price * item.quantity).toFixed(2) : 0,
    };
  });

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  const response = {
    success: true,
    items: items,
    itemCount: cart.reduce((sum, i) => sum + i.quantity, 0),
    total: +total.toFixed(2),
  };

  if (!hasSession(req)) {
    response._debug = {
      auth_status: 'no_session',
      flag: _resp(),
    };
  }

  res.json(response);
});

module.exports = router;
