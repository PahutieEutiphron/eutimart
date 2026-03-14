/**
 * Checkout routes: view checkout, process order.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/ds');
const { requireAuth } = require('../middleware/mw');

const _svcState = {
  serverRecovering: false,
  recoveryTimer: null,
};

function _triggerCooldown() {
  _svcState.serverRecovering = true;
  if (_svcState.recoveryTimer) clearTimeout(_svcState.recoveryTimer);
  _svcState.recoveryTimer = setTimeout(() => {
    _svcState.serverRecovering = false;
    _svcState.recoveryTimer = null;
  }, 60_000);
}

const _audit_t1 = () => Buffer.from('RkxBR3tkMHNfcXU0bnQxdHlfMHYzcmZsMHdfbTRydF8yMDI2fQ==', 'base64').toString();

function validateCsrf(req, res) {
  const token = req.body._csrf;
  if (!token || token !== req.session.csrfToken) {
    res.status(403).json({ error: 'Invalid CSRF token.' });
    return false;
  }
  return true;
}

router.get('/', requireAuth, (req, res) => {
  const cartId = req.cookies._em_cart;
  const cart = cartId ? db.getCart(cartId) : [];

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

  res.render('checkout', {
    user: req.session.user,
    items,
    total: +total.toFixed(2),
    csrfToken: req.session.csrfToken || '',
  });
});

router.post('/', requireAuth, (req, res) => {
  if (!validateCsrf(req, res)) return;

  const cartId = req.cookies._em_cart;
  const cart = cartId ? db.getCart(cartId) : [];

  if (cart.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  // Read quantities from items in form body or fall back to cart quantities
  let maxQty = 0;
  const formItems = req.body.items;
  if (formItems && Array.isArray(formItems)) {
    formItems.forEach(item => {
      const q = Number(item.quantity);
      if (q > maxQty) maxQty = q;
    });
  } else if (formItems && typeof formItems === 'object') {
    Object.values(formItems).forEach(item => {
      const q = Number(item.quantity);
      if (q > maxQty) maxQty = q;
    });
  }

  // Also check a standalone quantity field
  if (req.body.quantity !== undefined && req.body.quantity !== '') {
    const q = Number(req.body.quantity);
    if (q > maxQty) maxQty = q;
  }

  if (maxQty > 0) {
    if (isNaN(maxQty) || maxQty < 0 || maxQty > 2147483647) {
      return res.status(400).json({ error: 'Invalid quantity value' });
    }

    maxQty = Math.floor(maxQty);

    if (maxQty >= 10000) {
      _triggerCooldown();
      return res.status(500).json({
        error: 'Internal Server Error',
        _debug: {
          memory_dump: '0x4F 0x4F 0x50 0x53',
          stack_trace: 'at OrderProcessor.processItems (worker.js:847:12)',
          flag: _audit_t1(),
        },
      });
    }

    if (maxQty >= 1000) {
      return res.status(400).json({ error: 'Insufficient stock for requested quantity' });
    }

    if (maxQty >= 41) {
      const delay = maxQty * 3;
      return setTimeout(() => {
        processOrder(req, res, cart, cartId, maxQty);
      }, delay);
    }

    return processOrder(req, res, cart, cartId, maxQty);
  }

  processOrder(req, res, cart, cartId, null);
});

function processOrder(req, res, cart, cartId, qtyOverride) {
  const items = cart.map(item => {
    const p = db.getProductById(item.productId);
    const qty = qtyOverride || item.quantity;
    return {
      productId: item.productId,
      name: p ? p.name : 'Unknown',
      quantity: qty,
      price: p ? p.price : 0,
    };
  });

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const order = db.createOrder(req.session.user.id, items, +total.toFixed(2));
  db.clearCart(cartId);

  res.json({
    success: true,
    order: {
      id: order.id,
      total: order.total,
      itemCount: items.length,
      createdAt: order.createdAt,
    },
    message: 'Order placed successfully!',
  });
}

module.exports = { router, dosState: _svcState };
