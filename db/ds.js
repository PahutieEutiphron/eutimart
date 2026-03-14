/**
 * EutiMart Data Store
 *
 * In-memory storage for users, products, carts, and orders.
 * Products are pre-seeded on startup.
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const products = [
  {
    id: 1,
    name: 'Wireless Noise-Cancelling Headphones',
    price: 149.99,
    stock: 45,
    category: 'audio',
    image: 'headphones.svg',
    description:
      'Premium active noise-cancelling headphones with 30-hour battery life and ultra-soft memory-foam ear cushions. Features adaptive sound control that automatically adjusts ambient sound based on your environment. Bluetooth 5.3 with multipoint connection lets you switch seamlessly between devices.',
  },
  {
    id: 2,
    name: 'Smart Watch Pro',
    price: 299.99,
    stock: 23,
    category: 'wearables',
    image: 'smartwatch.svg',
    description:
      'Advanced smartwatch featuring a titanium case, always-on AMOLED display, and comprehensive health monitoring including ECG and SpO2 sensors. Water-resistant to 100 meters with built-in GPS, barometric altimeter, and compass. Lasts up to 5 days on a single charge with typical use.',
  },
  {
    id: 3,
    name: 'Mechanical Keyboard RGB',
    price: 89.99,
    stock: 67,
    category: 'peripherals',
    image: 'keyboard.svg',
    description:
      'Hot-swappable mechanical keyboard with per-key RGB backlighting and a solid aluminum frame. Comes with pre-lubed linear switches for a smooth, quiet typing experience. Programmable macro keys and on-board memory store up to 5 custom profiles.',
  },
  {
    id: 4,
    name: 'Portable Bluetooth Speaker',
    price: 59.99,
    stock: 82,
    category: 'audio',
    image: 'speaker.svg',
    description:
      'Rugged, IP67-rated Bluetooth speaker delivering 360-degree sound with deep bass and crystal-clear highs. Its 20-hour battery life and built-in power bank make it the perfect companion for outdoor adventures. Pair two speakers together for true stereo sound.',
  },
  {
    id: 5,
    name: 'USB-C Hub Multiport',
    price: 39.99,
    stock: 120,
    category: 'accessories',
    image: 'usbhub.svg',
    description:
      '7-in-1 USB-C hub featuring HDMI 4K@60Hz output, 100W Power Delivery passthrough, SD/microSD card readers, and three USB 3.0 ports. The slim, machined-aluminum body dissipates heat efficiently. Compatible with all modern laptops, tablets, and USB-C devices.',
  },
  {
    id: 6,
    name: 'Gaming Mouse Wireless',
    price: 69.99,
    stock: 55,
    category: 'peripherals',
    image: 'mouse.svg',
    description:
      'Ultra-lightweight wireless gaming mouse with a 25K DPI optical sensor and less than 1 ms click latency. Features on-board memory for DPI profiles and customizable side buttons. The ambidextrous design and 70-hour battery life keep you gaming without compromise.',
  },
  {
    id: 7,
    name: '4K Webcam HD',
    price: 129.99,
    stock: 34,
    category: 'peripherals',
    image: 'webcam.svg',
    description:
      'Professional 4K webcam with an AI-powered auto-framing sensor that keeps you centered during video calls. Built-in dual stereo microphones with noise cancellation ensure your voice is always clear. Adjustable field of view from 65 to 90 degrees suits any room layout.',
  },
  {
    id: 8,
    name: 'Laptop Stand Aluminum',
    price: 49.99,
    stock: 78,
    category: 'accessories',
    image: 'stand.svg',
    description:
      'Ergonomic aluminum laptop stand with adjustable height and angle, elevating your screen to eye level to reduce neck strain. Hollow-center ventilation design allows optimal airflow to keep your laptop cool. Folds flat for easy travel and supports laptops up to 17 inches.',
  },
  {
    id: 9,
    name: 'Wireless Charging Pad',
    price: 29.99,
    stock: 95,
    category: 'accessories',
    image: 'charger.svg',
    description:
      'Slim Qi-certified wireless charging pad supporting up to 15W fast charge for compatible devices. The anti-slip silicone surface and foreign-object detection keep your phone safe and secure. LED status ring provides at-a-glance charging feedback without distracting bedroom use.',
  },
  {
    id: 10,
    name: 'Smart LED Desk Lamp',
    price: 79.99,
    stock: 41,
    category: 'accessories',
    image: 'lamp.svg',
    description:
      'App-controlled LED desk lamp with 16 million color options and tunable white from 2700K to 6500K. Built-in ambient light sensor auto-adjusts brightness to match your surroundings. Integrated USB-A and USB-C charging ports on the base keep your workspace tidy.',
  },
  {
    id: 11,
    name: 'Noise-Cancelling Earbuds',
    price: 119.99,
    stock: 38,
    category: 'audio',
    image: 'earbuds.svg',
    description:
      'True wireless earbuds with hybrid active noise cancellation and transparency mode for awareness of your surroundings. Custom-tuned 11 mm drivers deliver rich, detailed sound across all genres. IPX5 sweat resistance and 8-hour battery (28 hours with case) make them ideal for workouts.',
  },
  {
    id: 12,
    name: 'Portable SSD 1TB',
    price: 109.99,
    stock: 52,
    category: 'storage',
    image: 'ssd.svg',
    description:
      'Compact external SSD with sequential read speeds up to 2,000 MB/s over USB 3.2 Gen 2x2 interface. The shock-resistant aluminum enclosure withstands drops from up to 2 meters. Hardware AES-256 encryption keeps your data secure without sacrificing transfer speed.',
  },
];

const users = [];
const carts = new Map();
const orders = [];

let nextUserId = 1;
let nextOrderId = 1;

function getAllProducts() {
  return products;
}

function getProductById(id) {
  return products.find(p => p.id === id) || null;
}

function searchProducts(query) {
  if (!query || typeof query !== 'string') return products;
  const q = query.toLowerCase().trim();
  if (q === '') return products;
  return products.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q),
  );
}

async function createUser(email, password, name) {
  const hash = await bcrypt.hash(password, 12);
  const user = {
    id: nextUserId++,
    email: email.toLowerCase().trim(),
    password: hash,
    name: name.trim(),
    bio: '',
    avatar: null,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

function findUserByEmail(email) {
  return users.find(u => u.email === email.toLowerCase().trim()) || null;
}

function findUserById(id) {
  return users.find(u => u.id === id) || null;
}

function updateUser(id, fields) {
  const user = findUserById(id);
  if (!user) return null;
  for (const [key, value] of Object.entries(fields)) {
    if (key !== 'id' && key !== 'password') {
      user[key] = value;
    }
  }
  return user;
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

function getOrCreateCart(cartId) {
  if (!cartId || !carts.has(cartId)) {
    const newId = cartId || crypto.randomUUID();
    carts.set(newId, []);
    return { cartId: newId, items: [] };
  }
  return { cartId, items: carts.get(cartId) };
}

function addToCart(cartId, productId, quantity) {
  const cart = carts.get(cartId);
  if (!cart) return null;
  const existing = cart.find(i => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  return cart;
}

function removeFromCart(cartId, productId) {
  const cart = carts.get(cartId);
  if (!cart) return null;
  const idx = cart.findIndex(i => i.productId === productId);
  if (idx !== -1) cart.splice(idx, 1);
  return cart;
}

function getCart(cartId) {
  return carts.get(cartId) || [];
}

function clearCart(cartId) {
  if (carts.has(cartId)) carts.set(cartId, []);
}

function createOrder(userId, items, total) {
  const order = {
    id: nextOrderId++,
    userId,
    items,
    total,
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  return order;
}

function getOrdersByUser(userId) {
  return orders.filter(o => o.userId === userId);
}

module.exports = {
  getAllProducts,
  getProductById,
  searchProducts,
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  verifyPassword,
  getOrCreateCart,
  addToCart,
  removeFromCart,
  getCart,
  clearCart,
  createOrder,
  getOrdersByUser,
};
