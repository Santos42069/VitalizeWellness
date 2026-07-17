'use strict';

/**
 * netlify/functions/contact.js — Vitalize Wellness
 * =============================================================================
 * Receives the sanitised form payload from the browser, re-validates
 * everything server-side, then POSTs to a Google Apps Script Web App
 * which writes the submission to Google Sheets and sends a notification email.
 *
 * Environment variables required (set in Netlify dashboard):
 *   GOOGLE_SHEET_WEBHOOK_URL   — the Web App URL from Apps Script deploy
 *
 * OWASP references:
 *   - Input Validation Cheat Sheet
 *   - Transport Layer Security Cheat Sheet
 * =============================================================================
 */

const crypto = require('crypto');

// ── Rate limiting store (persists across warm function invocations) ───────────
const WINDOW_MS   = 15 * 60 * 1000;  // 15-minute window
const LIMITS      = { ip: 10, user: 3 };
const MAX_BODY_BYTES = 16 * 1024;     // 16 KB hard cap
const store = globalThis.__contactRateLimitStore || new Map();
globalThis.__contactRateLimitStore = store;

// ── Allowed values ─────────────────────────────────────────────────────────────
const STATES = new Set([
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming',
]);

// ── Validation schema ──────────────────────────────────────────────────────────
const schema = {
  first_name:        { required: true,  min: 1, max: 60,  pattern: /^[A-Za-z .'-]+$/ },
  last_name:         { required: true,  min: 1, max: 60,  pattern: /^[A-Za-z .'-]+$/ },
  email:             { required: true,  max: 254, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone:             { required: true,  max: 25,  custom: v => v.replace(/\D/g, '').length >= 10 },
  dob:               { required: true,  custom: v => isIsoDate(v) && v <= todayIso() },
  sex:               { required: true,  options: ['Female', 'Male', 'Prefer not to say'] },
  patient_type:      { required: true,  options: ['New Patient', 'Returning Patient'] },
  city:              { required: true,  min: 2, max: 80, pattern: /^[A-Za-z .'-]+$/ },
  state:             { required: true,  options: Array.from(STATES) },
  allergies:         { max: 160 },
  medications:       { max: 160 },
  conditions:        { max: 160 },
  pregnant:          { max: 40,  options: ['', 'No', 'Yes – Pregnant', 'Yes – Breastfeeding', 'Prefer not to say'] },
  primary_treatment: {
    required: true,
    options: [
      'Myers Cocktail','Immunity IV','Get-Up-And-Go','Weight Loss IV','NAD+ Therapy',
      'Hangover Relief','Athletic Recovery','Beauty Drip','Starter Weight Loss Program',
      'Core Weight Loss Program','Elite Weight Loss Program','Facial Rejuvenation',
      'Hair Restoration','Peptide Therapy','Exosome Therapy','Free Consultation',
    ],
  },
  add_ons: {
    array: true, maxItems: 8,
    options: [
      'Glutathione Push','B12 Injection','Biotin Boost','Vitamin D Infusion',
      'Myers Cocktail','Immunity IV','Beauty Drip','Weight Loss IV',
    ],
  },
  preferred_date: { required: true, custom: v => isIsoDate(v) && v >= todayIso() },
  preferred_time: {
    max: 30,
    options: ['', 'Morning (9 AM – 12 PM)', 'Afternoon (12 PM – 4 PM)', 'Evening (4 PM – 7 PM)'],
  },
  referral: {
    max: 30,
    options: ['', 'Instagram','TikTok','Facebook','Google Search','Friend or Family','Doctor Referral','Other'],
  },
  notes:   { max: 1000 },
  consent: { boolean: true, requiredTrue: true },
  website: { max: 120 },  // honeypot
};


// ── Main handler ───────────────────────────────────────────────────────────────
exports.handler = async event => {
  if (event.httpMethod === 'OPTIONS') return reply(204, '');
  if (event.httpMethod !== 'POST')    return reply(405, { error: 'Method not allowed.' });

  // Body size guard
  const rawBody = event.body || '';
  if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
    return reply(413, { error: 'Request is too large.' });
  }

  // Parse JSON
  let payload;
  try { payload = JSON.parse(rawBody); }
  catch { return reply(400, { error: 'Invalid JSON body.' }); }

  // Server-side validation
  const validation = validatePayload(payload);
  if (!validation.ok) return reply(400, { error: validation.error });

  // Honeypot — silent accept so bots don't learn the trap
  if (validation.value.website) return reply(202, { ok: true });

  // Rate limiting
  const ipKey   = `ip:${hash(getClientIp(event))}`;
  const userKey = `user:${hash(validation.value.email.toLowerCase())}`;
  const limited = checkRateLimit([ipKey, userKey]);
  if (limited) {
    return reply(429, {
      error: 'Too many requests. Please try again later.',
      retryAfterSeconds: limited.retryAfterSeconds,
    }, { 'Retry-After': String(limited.retryAfterSeconds) });
  }

  // Verify webhook URL is configured
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('[VW] GOOGLE_SHEET_WEBHOOK_URL env var is not set.');
    return reply(500, { error: 'Contact form is not configured.' });
  }

  // Forward to Google Apps Script
  try {
    const gsRes = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(validation.value),
    });

    if (!gsRes.ok) {
      const text = await gsRes.text().catch(() => '');
      console.error('[VW] Google Sheets webhook error:', gsRes.status, text);
      return reply(502, { error: 'Unable to save submission. Please try again.' });
    }

    return reply(200, { ok: true });

  } catch (err) {
    console.error('[VW] Fetch to Google Sheets failed:', err.message);
    return reply(502, { error: 'Unable to save submission. Please try again.' });
  }
};


// ── Validation helpers ─────────────────────────────────────────────────────────

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'Request body must be an object.' };
  }

  const expected = new Set(Object.keys(schema));
  for (const key of Object.keys(payload)) {
    if (!expected.has(key)) return { ok: false, error: `Unexpected field: ${key}` };
  }

  const value = {};

  for (const [key, rules] of Object.entries(schema)) {
    const raw = payload[key];

    // Boolean fields (consent)
    if (rules.boolean) {
      if (typeof raw !== 'boolean') return { ok: false, error: `${key} must be a boolean.` };
      if (rules.requiredTrue && raw !== true) return { ok: false, error: `${key} must be accepted.` };
      value[key] = raw;
      continue;
    }

    // Array fields (add_ons)
    if (rules.array) {
      if (!Array.isArray(raw)) return { ok: false, error: `${key} must be an array.` };
      if (raw.length > rules.maxItems) return { ok: false, error: `${key} has too many items.` };
      value[key] = raw.map(item => sanitizeText(item, 80));
      if (value[key].some(item => !rules.options.includes(item))) {
        return { ok: false, error: `${key} contains an invalid option.` };
      }
      continue;
    }

    // Scalar fields
    const cleaned = sanitizeText(raw || '', rules.max || 254);
    if (rules.required && cleaned.length === 0) return { ok: false, error: `${key} is required.` };
    if (!rules.required && cleaned.length === 0) { value[key] = ''; continue; }
    if (rules.min     && cleaned.length < rules.min)  return { ok: false, error: `${key} is too short.` };
    if (rules.max     && cleaned.length > rules.max)  return { ok: false, error: `${key} is too long.` };
    if (rules.pattern && !rules.pattern.test(cleaned)) return { ok: false, error: `${key} is invalid.` };
    if (rules.options && !rules.options.includes(cleaned)) return { ok: false, error: `${key} is invalid.` };
    if (rules.custom  && !rules.custom(cleaned))       return { ok: false, error: `${key} is invalid.` };
    value[key] = cleaned;
  }

  return { ok: true, value };
}

function sanitizeText(input, maxLength) {
  if (typeof input !== 'string') return '';
  return input
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, maxLength);
}


// ── Rate limiting ──────────────────────────────────────────────────────────────

function checkRateLimit(keys) {
  cleanupStore();
  const now = Date.now();
  for (const key of keys) {
    const bucket = store.get(key) || { count: 0, resetAt: now + WINDOW_MS };
    if (bucket.resetAt <= now) { bucket.count = 0; bucket.resetAt = now + WINDOW_MS; }
    const limit = key.startsWith('ip:') ? LIMITS.ip : LIMITS.user;
    if (bucket.count >= limit) {
      return { retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
    }
  }
  keys.forEach(key => {
    const b = store.get(key) || { count: 0, resetAt: now + WINDOW_MS };
    b.count += 1;
    store.set(key, b);
  });
  return null;
}

function cleanupStore() {
  const now = Date.now();
  for (const [key, b] of store.entries()) {
    if (b.resetAt <= now) store.delete(key);
  }
}


// ── Utilities ──────────────────────────────────────────────────────────────────

function getClientIp(event) {
  const fwd = event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'] || '';
  return fwd.split(',')[0].trim()
    || event.headers['client-ip']
    || event.headers['x-nf-client-connection-ip']
    || 'unknown';
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function reply(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': typeof body === 'string'
        ? 'text/plain; charset=utf-8'
        : 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}