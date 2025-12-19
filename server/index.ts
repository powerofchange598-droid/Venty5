import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Auth Handlers
import googleAuthHandler from '../api/auth/google';
import meHandler from '../api/auth/me';
import logoutHandler from '../api/auth/logout';
import facebookHandler from '../api/auth/facebook';
import appleHandler from '../api/auth/apple';
import emailLoginHandler from '../api/auth/email/login';
import emailSignupHandler from '../api/auth/email/signup';
import paypalCreateOrderHandler from '../api/paypal/create-order';
import paypalCaptureOrderHandler from '../api/paypal/capture-order';

dotenv.config();

const app = express();
app.use(express.json()); // Use express.json() for PayPal/Promo routes. _utils.ts handles this for Auth.

const PORT = process.env.PORT || 8080;
const PAYPAL_ENV = process.env.PAYPAL_ENV || 'sandbox';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || 'http://localhost:3000';
const DEFAULT_CURRENCY = (process.env.DEFAULT_CURRENCY || 'USD').toUpperCase();
const ALLOWED_CURRENCIES = (process.env.ALLOWED_CURRENCIES || 'USD,EUR,GBP,AUD,CAD').split(',').map(s => s.trim().toUpperCase());
const BASE_URL = PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

const HAS_CREDENTIALS = !!(PAYPAL_CLIENT_ID && PAYPAL_SECRET);

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

const PROMO_CODES_FILE = path.join(DATA_DIR, 'promo-codes.json');
const PROMO_USAGE_FILE = path.join(DATA_DIR, 'promo-usage.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json'); // Note: _utils.ts also uses this path logic
const WEBVIEW_CLICKS_FILE = path.join(DATA_DIR, 'webview-clicks.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json'); // Legacy sessions, maybe unused now

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  CLIENT_BASE_URL
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// --- Helpers ---
function loadJson(file: string, fallback: any) {
  try {
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, 'utf-8') || '';
      return text ? JSON.parse(text) : fallback;
    }
  } catch {}
  return fallback;
}

function saveJson(file: string, data: any) {
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save json', file, err);
  }
}

function storeTransaction(record: any) {
    try {
      const file = path.join(DATA_DIR, 'transactions.json');
      const dir = path.dirname(file);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      let existing: any[] = [];
      if (fs.existsSync(file)) {
        existing = JSON.parse(fs.readFileSync(file, 'utf-8') || '[]');
      }
      existing.unshift({ savedAt: new Date().toISOString(), ...record });
      fs.writeFileSync(file, JSON.stringify(existing, null, 2));
    } catch (err) {
  console.error('Failed to store transaction:', err);
}

// --- Basic User Profile Persistence ---
app.post('/api/users/:userId/profile', async (req, res) => {
  try {
    const userId = req.params.userId;
    const profile = req.body || {};
    const file = path.join(DATA_DIR, 'profiles', `${userId}.json`);
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ ...profile, savedAt: new Date().toISOString() }, null, 2));
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'save_failed' });
  }
});

app.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const userId = req.params.userId;
    const file = path.join(DATA_DIR, 'profiles', `${userId}.json`);
    if (!fs.existsSync(file)) return res.status(404).json({ ok: false, error: 'not_found' });
    const text = fs.readFileSync(file, 'utf-8') || '{}';
    const json = JSON.parse(text || '{}');
    return res.json({ ok: true, profile: json });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'load_failed' });
  }
});

// --- User Data (Budget, Fixed Expenses, Goals) ---
function userDataFile(userId: string, name: string) {
  return path.join(DATA_DIR, 'user-data', userId, `${name}.json`);
}
function ensureDirFor(file: string) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function readArray(file: string) {
  try {
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, 'utf-8') || '[]';
      const json = JSON.parse(text || '[]');
      return Array.isArray(json) ? json : [];
    }
  } catch {}
  return [];
}
function writeArray(file: string, arr: any[]) {
  try {
    ensureDirFor(file);
    fs.writeFileSync(file, JSON.stringify(arr, null, 2));
    return true;
  } catch {
    return false;
  }
}

// Aggregate user data
app.get('/api/users/:userId', (req, res) => {
  const userId = req.params.userId;
  const budget = readArray(userDataFile(userId, 'budget'));
  const fixedExpenses = readArray(userDataFile(userId, 'fixed-expenses'));
  const goals = readArray(userDataFile(userId, 'goals'));
  return res.json({ ok: true, data: { budget, fixedExpenses, goals } });
});

// Budget categories
app.get('/api/users/:userId/budget/categories', (req, res) => {
  const userId = req.params.userId;
  const items = readArray(userDataFile(userId, 'budget'));
  return res.json({ ok: true, items });
});
app.post('/api/users/:userId/budget/categories', (req, res) => {
  const userId = req.params.userId;
  const file = userDataFile(userId, 'budget');
  const items = readArray(file);
  const payload = req.body || {};
  const id = `cat_${Date.now().toString(36)}`;
  const newItem = { id, name: payload.name || 'Category', allocated: Number(payload.allocated) || 0, spent: 0, notes: payload.notes || '' };
  items.push(newItem);
  if (!writeArray(file, items)) return res.status(500).json({ ok: false });
  return res.json({ ok: true, item: newItem });
});
app.put('/api/users/:userId/budget/categories/:id', (req, res) => {
  const userId = req.params.userId;
  const id = req.params.id;
  const file = userDataFile(userId, 'budget');
  const items = readArray(file);
  const idx = items.findIndex((i: any) => i.id === id);
  if (idx < 0) return res.status(404).json({ ok: false, error: 'not_found' });
  const payload = req.body || {};
  items[idx] = { ...items[idx], ...payload };
  if (!writeArray(file, items)) return res.status(500).json({ ok: false });
  return res.json({ ok: true, item: items[idx] });
});
app.delete('/api/users/:userId/budget/categories/:id', (req, res) => {
  const userId = req.params.userId;
  const id = req.params.id;
  const file = userDataFile(userId, 'budget');
  const items = readArray(file);
  const next = items.filter((i: any) => i.id !== id);
  if (!writeArray(file, next)) return res.status(500).json({ ok: false });
  return res.json({ ok: true });
});

// Fixed expenses
app.get('/api/users/:userId/fixed-expenses', (req, res) => {
  const userId = req.params.userId;
  const items = readArray(userDataFile(userId, 'fixed-expenses'));
  return res.json({ ok: true, items });
});
app.post('/api/users/:userId/fixed-expenses', (req, res) => {
  const userId = req.params.userId;
  const file = userDataFile(userId, 'fixed-expenses');
  const items = readArray(file);
  const payload = req.body || {};
  const id = `fx_${Date.now().toString(36)}`;
  const newItem = { id, name: payload.name || 'Expense', amount: Number(payload.amount) || 0, frequency: 'monthly', notes: payload.notes || '' };
  items.push(newItem);
  if (!writeArray(file, items)) return res.status(500).json({ ok: false });
  return res.json({ ok: true, item: newItem });
});
app.put('/api/users/:userId/fixed-expenses/:id', (req, res) => {
  const userId = req.params.userId;
  const id = req.params.id;
  const file = userDataFile(userId, 'fixed-expenses');
  const items = readArray(file);
  const idx = items.findIndex((i: any) => i.id === id);
  if (idx < 0) return res.status(404).json({ ok: false, error: 'not_found' });
  const payload = req.body || {};
  items[idx] = { ...items[idx], ...payload };
  if (!writeArray(file, items)) return res.status(500).json({ ok: false });
  return res.json({ ok: true, item: items[idx] });
});
app.delete('/api/users/:userId/fixed-expenses/:id', (req, res) => {
  const userId = req.params.userId;
  const id = req.params.id;
  const file = userDataFile(userId, 'fixed-expenses');
  const items = readArray(file);
  const next = items.filter((i: any) => i.id !== id);
  if (!writeArray(file, next)) return res.status(500).json({ ok: false });
  return res.json({ ok: true });
});

// Goals
app.get('/api/users/:userId/goals', (req, res) => {
  const userId = req.params.userId;
  const items = readArray(userDataFile(userId, 'goals'));
  return res.json({ ok: true, items });
});
app.post('/api/users/:userId/goals', (req, res) => {
  const userId = req.params.userId;
  const file = userDataFile(userId, 'goals');
  const items = readArray(file);
  const payload = req.body || {};
  const id = `goal_${Date.now().toString(36)}`;
  const newItem = { id, name: payload.name || 'Goal', targetAmount: Number(payload.monthlyContribution) || 0, currentAmount: 0, monthlyContribution: Number(payload.monthlyContribution) || 0, notes: payload.notes || '' };
  items.push(newItem);
  if (!writeArray(file, items)) return res.status(500).json({ ok: false });
  return res.json({ ok: true, item: newItem });
});
app.put('/api/users/:userId/goals/:id', (req, res) => {
  const userId = req.params.userId;
  const id = req.params.id;
  const file = userDataFile(userId, 'goals');
  const items = readArray(file);
  const idx = items.findIndex((i: any) => i.id === id);
  if (idx < 0) return res.status(404).json({ ok: false, error: 'not_found' });
  const payload = req.body || {};
  items[idx] = { ...items[idx], ...payload };
  if (!writeArray(file, items)) return res.status(500).json({ ok: false });
  return res.json({ ok: true, item: items[idx] });
});
app.delete('/api/users/:userId/goals/:id', (req, res) => {
  const userId = req.params.userId;
  const id = req.params.id;
  const file = userDataFile(userId, 'goals');
  const items = readArray(file);
  const next = items.filter((i: any) => i.id !== id);
  if (!writeArray(file, next)) return res.status(500).json({ ok: false });
  return res.json({ ok: true });
});
}

// --- Auth Routes (Delegate to Vercel Handlers) ---
const handle = (handler: any) => async (req: any, res: any) => {
    try {
        await handler(req, res);
    } catch (e: any) {
        console.error("Auth Handler Error:", e);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: e.message });
        }
    }
};

app.all('/api/auth/google', handle(googleAuthHandler));
app.all('/api/auth/facebook', handle(facebookHandler));
app.all('/api/auth/apple', handle(appleHandler));
app.all('/api/auth/me', handle(meHandler));
app.all('/api/auth/logout', handle(logoutHandler));
app.post('/api/auth/email/login', handle(emailLoginHandler));
app.post('/api/auth/email/signup', handle(emailSignupHandler));

// PayPal Routes
app.post('/api/paypal/create-order', handle(paypalCreateOrderHandler));
app.post('/api/paypal/capture-order', handle(paypalCaptureOrderHandler));

// --- User Profile (Legacy/Hybrid) ---
app.post('/api/users/:userId/profile', (req, res) => {
    const { userId } = req.params;
    const { country, countryCode, currency } = req.body || {};
    if (!userId || !countryCode || !currency) {
      return res.status(400).json({ ok: false, error: 'missing_fields' });
    }
    const users = loadJson(USERS_FILE, []);
    const idx = users.findIndex((u: any) => u.userId === userId);
    const profile = { userId, country, countryCode, currency, updatedAt: new Date().toISOString() };
    if (idx >= 0) users[idx] = { ...users[idx], ...profile };
    else users.push(profile);
    saveJson(USERS_FILE, users);
    res.json({ ok: true, profile });
});

// --- Promo Codes ---
app.get('/api/promo-codes', (_req, res) => {
    const codes = loadJson(PROMO_CODES_FILE, []);
    res.json({ ok: true, codes });
});
  
app.post('/api/promo-codes', (req, res) => {
    const { code, type = 'percent', percent = 0, permanent = false, validityDaysAfterActivation } = req.body || {};
    if (!code || (type === 'percent' && (percent <= 0 || percent > 100))) {
      return res.status(400).json({ ok: false, error: 'invalid_code_params' });
    }
    const codes = loadJson(PROMO_CODES_FILE, []);
    if (codes.some((c: any) => c.code.toLowerCase() === String(code).toLowerCase())) {
      return res.status(409).json({ ok: false, error: 'code_exists' });
    }
    const newCode = { code, type, percent, permanent: !!permanent, validityDaysAfterActivation, createdAt: new Date().toISOString() };
    codes.push(newCode);
    saveJson(PROMO_CODES_FILE, codes);
    res.json({ ok: true, code: newCode });
});

app.put('/api/promo-codes/:code', (req, res) => {
    const codeParam = req.params.code;
    const codes = loadJson(PROMO_CODES_FILE, []);
    const idx = codes.findIndex((c: any) => c.code.toLowerCase() === codeParam.toLowerCase());
    if (idx < 0) return res.status(404).json({ ok: false, error: 'not_found' });
    const curr = codes[idx];
    const updated = { ...curr, ...req.body, code: curr.code };
    codes[idx] = updated;
    saveJson(PROMO_CODES_FILE, codes);
    res.json({ ok: true, code: updated });
});

app.delete('/api/promo-codes/:code', (req, res) => {
    const codeParam = req.params.code;
    const codes = loadJson(PROMO_CODES_FILE, []);
    const filtered = codes.filter((c: any) => c.code.toLowerCase() !== codeParam.toLowerCase());
    saveJson(PROMO_CODES_FILE, filtered);
    res.json({ ok: true });
});

function findPromo(code: any) {
    const codes = loadJson(PROMO_CODES_FILE, []);
    return codes.find((c: any) => c.code.toLowerCase() === String(code).toLowerCase());
}
  
function recordPromoUsage(code: any, userId: any, status: any, meta?: any) {
    const usage = loadJson(PROMO_USAGE_FILE, []);
    usage.unshift({ code, userId, status, meta, at: new Date().toISOString() });
    saveJson(PROMO_USAGE_FILE, usage);
}

app.post('/api/promo-codes/apply', (req, res) => {
    const { code, userId } = req.body || {};
    if (!code || !userId) return res.status(400).json({ ok: false, error: 'code_and_user_required' });
    const promo = findPromo(code);
    if (!promo) {
      recordPromoUsage(code, userId, 'invalid');
      return res.status(404).json({ ok: false, status: 'invalid' });
    }
    const usage = loadJson(PROMO_USAGE_FILE, []);
    const userRecords = usage.filter((u: any) => u.code.toLowerCase() === String(code).toLowerCase() && u.userId === userId);
    const activation = userRecords.find((u: any) => u.status === 'activated');
    if (promo.permanent) {
      if (!activation) recordPromoUsage(promo.code, userId, 'activated');
      return res.json({ ok: true, status: 'active', discountPercent: promo.percent });
    }
    const validityDays = Number(promo.validityDaysAfterActivation || 0);
    if (!activation) {
      const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();
      recordPromoUsage(promo.code, userId, 'activated', { expiresAt });
      return res.json({ ok: true, status: 'active', discountPercent: promo.percent, expiresAt });
    } else {
      const expiresAt = activation.meta?.expiresAt;
      if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
        recordPromoUsage(promo.code, userId, 'expired');
        return res.status(410).json({ ok: false, status: 'expired' });
      }
      return res.json({ ok: true, status: 'active', discountPercent: promo.percent, expiresAt });
    }
});

app.get('/api/promo-codes/active/:userId', (req, res) => {
    const { userId } = req.params;
    const codes = loadJson(PROMO_CODES_FILE, []);
    const usage = loadJson(PROMO_USAGE_FILE, []);
    const active: any[] = [];
    for (const code of codes) {
      const records = usage.filter((u: any) => u.code.toLowerCase() === code.code.toLowerCase() && u.userId === userId);
      const act = records.find((r: any) => r.status === 'activated');
      if (code.permanent) {
        if (act || records.length === 0) active.push({ code: code.code, percent: code.percent, permanent: true });
        continue;
      }
      if (act) {
        const expiresAt = act.meta?.expiresAt;
        if (!expiresAt || new Date(expiresAt).getTime() > Date.now()) {
          active.push({ code: code.code, percent: code.percent, expiresAt });
        }
      }
    }
    const bestPercent = active.reduce((p, c) => Math.max(p, Number(c.percent || 0)), 0);
    res.json({ ok: true, active, bestPercent });
});

// --- PayPal ---
async function getAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal token error: ${res.status} ${text}`);
    }
    const data: any = await res.json();
    return data.access_token;
}

app.post('/api/paypal/order', async (req, res) => {
    try {
      const { amount, currency, description = 'Payment' } = req.body || {};
      if (!amount) return res.status(400).json({ ok: false, error: 'amount is required' });
      if (!HAS_CREDENTIALS) return res.status(500).json({ ok: false, error: 'missing_paypal_credentials' });
      const cc = (currency || DEFAULT_CURRENCY).toUpperCase();
      if (!ALLOWED_CURRENCIES.includes(cc)) return res.status(400).json({ ok: false, error: `unsupported_currency:${cc}` });
      
      const returnUrl = `${CLIENT_BASE_URL.replace(/\/$/, '')}/#/payment?paypalReturn=1`;
      const cancelUrl = `${CLIENT_BASE_URL.replace(/\/$/, '')}/#/payment?paypalCancel=1`;
      
      const token = await getAccessToken();
      const orderRes = await fetch(`${BASE_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{ amount: { currency_code: cc, value: Number(amount).toFixed(2) }, description }],
          application_context: { return_url: returnUrl, cancel_url: cancelUrl, user_action: 'PAY_NOW' },
        }),
      });
      const orderData: any = await orderRes.json();
      if (!orderRes.ok) {
        storeTransaction({ type: 'order_error', status: orderRes.status, error: orderData });
        return res.status(orderRes.status).json({ ok: false, error: orderData });
      }
      const approveLink = (orderData.links || []).find((l: any) => l.rel === 'approve')?.href;
      return res.json({ ok: true, id: orderData.id, approveLink });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: 'server_error' });
    }
});

app.post('/api/paypal/order/:orderId/capture', async (req, res) => {
    try {
      const { orderId } = req.params;
      const token = await getAccessToken();
      const captureRes = await fetch(`${BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const captureData = await captureRes.json();
      if (!captureRes.ok) {
        storeTransaction({ type: 'capture_error', orderId, status: captureRes.status, error: captureData });
        return res.status(captureRes.status).json({ ok: false, error: captureData });
      }
      storeTransaction({ type: 'order', orderId, capture: captureData });
      return res.json({ ok: true, data: captureData });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: 'server_error' });
    }
});

app.post('/api/paypal/subscription', async (req, res) => {
    try {
      const { planId, subscriber = {}, returnUrl, cancelUrl } = req.body || {};
      if (!planId || !returnUrl || !cancelUrl) return res.status(400).json({ ok: false, error: 'planId, returnUrl, cancelUrl required' });
      const token = await getAccessToken();
      const subRes = await fetch(`${BASE_URL}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          plan_id: planId,
          application_context: {
            return_url: returnUrl,
            cancel_url: cancelUrl,
            brand_name: 'Venty',
            locale: 'en-US',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
          },
          subscriber,
        }),
      });
      const subData: any = await subRes.json();
      if (!subRes.ok) return res.status(subRes.status).json({ ok: false, error: subData });
      const approveLink = (subData.links || []).find((l: any) => l.rel === 'approve')?.href;
      storeTransaction({ type: 'subscription_init', subscriptionId: subData.id, raw: subData });
      return res.json({ ok: true, id: subData.id, approveLink });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: 'server_error' });
    }
});

app.post('/api/paypal/webhook', async (req, res) => {
    try {
      const webhookId = process.env.PAYPAL_WEBHOOK_ID;
      if (!webhookId) return res.status(500).json({ ok: false, error: 'webhook_id_missing' });
      const transmissionId = req.headers['paypal-transmission-id'];
      const transmissionSig = req.headers['paypal-transmission-sig'];
      const certUrl = req.headers['paypal-cert-url'];
      const authAlgo = req.headers['paypal-auth-algo'];
      const transmissionTime = req.headers['paypal-transmission-time'];
      if (!transmissionId || !transmissionSig || !certUrl || !authAlgo || !transmissionTime) {
        return res.status(400).json({ ok: false, error: 'missing_webhook_headers' });
      }
      const token = await getAccessToken();
      const verifyRes = await fetch(`${BASE_URL}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          transmission_id: transmissionId,
          transmission_time: transmissionTime,
          cert_url: certUrl,
          auth_algo: authAlgo,
          transmission_sig: transmissionSig,
          webhook_id: webhookId,
          webhook_event: req.body,
        }),
      });
      const verifyData: any = await verifyRes.json();
      if (!verifyRes.ok || verifyData.verification_status !== 'SUCCESS') {
        return res.status(400).json({ ok: false, error: 'verification_failed', data: verifyData });
      }
      storeTransaction({ type: 'webhook', event: req.body, verification: verifyData });
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ ok: false });
    }
});

app.post('/api/webviewClick', (req, res) => {
    try {
      const { path: clickedPath, meta } = req.body || {};
      const clicks = loadJson(WEBVIEW_CLICKS_FILE, []);
      clicks.unshift({
        path: clickedPath || '/',
        meta: meta || {},
        ua: req.headers['user-agent'],
        at: new Date().toISOString(),
      });
      saveJson(WEBVIEW_CLICKS_FILE, clicks.slice(0, 500));
      res.json({ ok: true });
    } catch (err) {
      console.error('webviewClick error', err);
      res.status(500).json({ ok: false });
    }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, env: PAYPAL_ENV, hasCredentials: HAS_CREDENTIALS }));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (TSX)`);
});
