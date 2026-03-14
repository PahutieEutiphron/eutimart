/**
 * Profile routes: view profile, update profile, upload avatar.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const mime = require('mime-types');
const db = require('../db/ds');
const { requireAuth } = require('../middleware/mw');
const { processContent, _contentCheck } = require('../utils/tp');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const _resp_token3 = () => Buffer.from('RkxBR3tjMG50M250X3R5cDNfZDN0M3JtMW4zc18zeHRfMjAyNn0=', 'base64').toString();
const _resp_token4 = () => Buffer.from('RkxBR3tibDRja2wxc3RfYnlwNHNzX3hzc19mdHdfMjAyNn0=', 'base64').toString();

function validateCsrf(req, res) {
  const token = req.body._csrf;
  if (!token || token !== req.session.csrfToken) {
    const wantsJson =
      req.xhr ||
      (req.headers.accept && req.headers.accept.includes('application/json'));
    if (wantsJson) {
      return res.status(403).json({ error: 'Invalid CSRF token.' }), false;
    }
    return res.status(403).send('Forbidden — invalid CSRF token.'), false;
  }
  return true;
}

function detectMagicBytes(buffer) {
  if (!buffer || buffer.length < 3) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'gif';
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return 'pdf';

  return null;
}

const SAFE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'webp'];

router.get('/', requireAuth, (req, res) => {
  const user = db.findUserById(req.session.user.id);
  res.render('profile', {
    user,
    csrfToken: req.session.csrfToken || '',
    message: null,
    flag: null,
  });
});

router.post('/', requireAuth, (req, res) => {
  if (!validateCsrf(req, res)) return;

  const { bio, name } = req.body;
  const updateFields = {};

  if (name !== undefined) {
    updateFields.name = name.trim().substring(0, 100);
  }

  let sanitizedBio = '';
  if (bio !== undefined) {
    sanitizedBio = processContent(bio);
    updateFields.bio = sanitizedBio;
  }

  db.updateUser(req.session.user.id, updateFields);

  if (updateFields.name) {
    req.session.user.name = updateFields.name;
  }

  let _audit = null;
  if (sanitizedBio && _contentCheck(sanitizedBio)) {
    _audit = _resp_token4();
  }

  const user = db.findUserById(req.session.user.id);

  const wantsJson =
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes('application/json'));

  if (wantsJson) {
    const response = { success: true, message: 'Profile updated' };
    if (_audit) response.flag = _audit;
    return res.json(response);
  }

  res.render('profile', {
    user,
    csrfToken: req.session.csrfToken || '',
    message: 'Profile updated successfully!',
    flag: _audit,
  });
});

router.post('/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  const csrfToken = req.body._csrf;
  if (!csrfToken || csrfToken !== req.session.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const buffer = req.file.buffer;
  let ext = detectMagicBytes(buffer);

  if (!ext) {
    const mimetype = req.file.mimetype;
    ext = mime.extension(mimetype);
    if (!ext) {
      return res.status(400).json({ error: 'Unsupported file type.' });
    }
  }

  const userId = req.session.user.id;
  const filename = `avatar_${userId}.${ext}`;
  const filepath = path.join(__dirname, '..', 'uploads', filename);

  try {
    fs.writeFileSync(filepath, buffer);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save avatar.' });
  }

  const avatarUrl = `/uploads/${filename}`;
  db.updateUser(userId, { avatar: avatarUrl });

  const response = { success: true, avatar: avatarUrl };

  if (!SAFE_EXTENSIONS.includes(ext.toLowerCase())) {
    response.flag = _resp_token3();
  }

  res.json(response);
});

module.exports = router;
