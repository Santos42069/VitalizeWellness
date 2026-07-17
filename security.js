/**
 * security.js — Vitalize Wellness
 * =============================================================================
 * Client-side security layer. Provides:
 *
 *   1. Rate Limiting     — Token-bucket in localStorage (IP-proxy for static sites)
 *                          + per-session cap in sessionStorage
 *   2. Input Validation  — Schema-driven, typed, length-capped, enum-checked
 *   3. Input Sanitization— Strips XSS vectors, null bytes, control chars
 *   4. Field Allowlisting— Rejects every key not in the schema
 *   5. Honeypot          — Silent bot detection via hidden field
 *
 * OWASP references:
 *   - Input Validation Cheat Sheet
 *   - XSS Prevention Cheat Sheet
 *   - Transport Layer Security Cheat Sheet
 *   - Content Security Policy Cheat Sheet
 *
 * ⚠️  Client-side controls are defence-in-depth ONLY.
 *     If you ever add a backend / serverless function, replicate this
 *     schema server-side (Node, Python, etc.) as well.
 * =============================================================================
 */

'use strict';

/* =============================================================================
   1. RATE LIMITER
   Token-bucket algorithm. Each submission costs 1 token. Tokens refill at
   1 per REFILL_INTERVAL. A separate session cap provides a hard stop
   regardless of localStorage state.
   ============================================================================= */
const RateLimiter = (() => {

  const CFG = {
    BUCKET_KEY:       'vw_rl_bucket',   // localStorage key
    SESSION_KEY:      'vw_rl_session',  // sessionStorage key
    MAX_TOKENS:       3,                 // max consecutive submissions
    REFILL_INTERVAL:  10 * 60 * 1000,   // 10 min between token refills (ms)
    REFILL_AMOUNT:    1,                 // tokens added per interval
    SESSION_MAX:      5,                 // hard cap per browser session
  };

  function readBucket() {
    try {
      const raw = localStorage.getItem(CFG.BUCKET_KEY);
      if (!raw) return { tokens: CFG.MAX_TOKENS, lastRefill: Date.now() };
      const b = JSON.parse(raw);
      // Validate shape — reject tampered values silently
      if (typeof b.tokens !== 'number' || typeof b.lastRefill !== 'number'
          || b.tokens < 0 || b.tokens > CFG.MAX_TOKENS * 10) {
        return { tokens: CFG.MAX_TOKENS, lastRefill: Date.now() };
      }
      return b;
    } catch {
      return { tokens: CFG.MAX_TOKENS, lastRefill: Date.now() };
    }
  }

  function saveBucket(b) {
    try { localStorage.setItem(CFG.BUCKET_KEY, JSON.stringify(b)); }
    catch { /* localStorage unavailable (private mode / quota) — fail open */ }
  }

  function refill(b) {
    const elapsed = Date.now() - b.lastRefill;
    const gained  = Math.floor(elapsed / CFG.REFILL_INTERVAL) * CFG.REFILL_AMOUNT;
    if (gained > 0) {
      b.tokens    = Math.min(CFG.MAX_TOKENS, b.tokens + gained);
      b.lastRefill = Date.now();
    }
    return b;
  }

  function sessionCount() {
    try { return parseInt(sessionStorage.getItem(CFG.SESSION_KEY) || '0', 10); }
    catch { return 0; }
  }

  function bumpSession() {
    try { sessionStorage.setItem(CFG.SESSION_KEY, String(sessionCount() + 1)); }
    catch { /* ignore */ }
  }

  /**
   * check() — call before processing any submission.
   * Returns { allowed: true } or { allowed: false, message: string, retryAfterMs: number }
   */
  function check() {
    // Hard session cap
    if (sessionCount() >= CFG.SESSION_MAX) {
      return {
        allowed:      false,
        retryAfterMs: 0,
        message:      'Too many attempts this session. Please refresh or contact us directly.',
      };
    }

    const b = refill(readBucket());

    if (b.tokens < 1) {
      const msLeft      = CFG.REFILL_INTERVAL - (Date.now() - b.lastRefill);
      const minutesLeft = Math.ceil(msLeft / 60000);
      return {
        allowed:      false,
        retryAfterMs: msLeft,
        message:      `Too many submissions. Please wait ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''} before trying again.`,
      };
    }

    b.tokens -= 1;
    saveBucket(b);
    bumpSession();
    return { allowed: true };
  }

  return { check };
})();


/* =============================================================================
   2. INPUT SCHEMA + ALLOWED ENUMS
   Single source of truth. Every field consumed by the contact form is declared
   here with its type, required flag, and maximum length.
   Enum fields list every value the server will accept.
   ============================================================================= */

const ENUMS = {
  sex:               ['Female', 'Male', 'Prefer not to say'],
  patient_type:      ['New Patient', 'Returning Patient'],
  pregnant:          ['', 'No', 'Yes \u2013 Pregnant', 'Yes \u2013 Breastfeeding', 'Prefer not to say'],
  primary_treatment: [
    'Myers Cocktail', 'Immunity IV', 'Get-Up-And-Go', 'Weight Loss IV',
    'NAD+ Therapy', 'Hangover Relief', 'Athletic Recovery', 'Beauty Drip',
    'Starter Weight Loss Program', 'Core Weight Loss Program',
    'Elite Weight Loss Program', 'Facial Rejuvenation', 'Hair Restoration',
    'Peptide Therapy', 'Exosome Therapy', 'Free Consultation',
  ],
  add_on: [
  'Glutathione Push', 'B12 Injection', 'Biotin Boost', 'Vitamin D Infusion',
  'Myers Cocktail', 'Immunity IV', 'Beauty Drip', 'Weight Loss IV',
  'Facial Rejuvenation', 'Hair Restoration', 'Peptide Therapy', 'Exosome Therapy',
],
  preferred_time: [
    '', 'Morning (9 AM \u2013 12 PM)', 'Afternoon (12 PM \u2013 4 PM)', 'Evening (4 PM \u2013 7 PM)',
  ],
  referral: [
    '', 'Instagram', 'TikTok', 'Facebook', 'Google Search',
    'Friend or Family', 'Doctor Referral', 'Other',
  ],
  state: [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
    'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
    'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
    'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
    'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
    'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
    'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
    'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
  ],
};

/**
 * SCHEMA — declare every field the form may submit.
 * type:       'string' | 'email' | 'phone' | 'date' | 'enum' | 'enum_array'
 * required:   boolean
 * maxLength:  hard character cap applied after sanitisation
 * enum:       key into ENUMS object (for enum / enum_array types)
 */
const SCHEMA = {
  first_name:        { type: 'string',     required: true,  maxLength: 60   },
  last_name:         { type: 'string',     required: true,  maxLength: 60   },
  email:             { type: 'email',      required: true,  maxLength: 254  }, // RFC 5321
  phone:             { type: 'phone',      required: true,  maxLength: 20   },
  dob:               { type: 'date',       required: true                    },
  sex:               { type: 'enum',       required: true,  enum: 'sex'     },
  patient_type:      { type: 'enum',       required: true,  enum: 'patient_type' },
  city:              { type: 'string',     required: true,  maxLength: 100  },
  state:             { type: 'enum',       required: true,  enum: 'state'   },
  allergies:         { type: 'string',     required: false, maxLength: 500  },
  medications:       { type: 'string',     required: false, maxLength: 500  },
  conditions:        { type: 'string',     required: false, maxLength: 500  },
  pregnant:          { type: 'enum',       required: false, enum: 'pregnant' },
  primary_treatment: { type: 'enum',       required: true,  enum: 'primary_treatment' },
  add_ons:           { type: 'enum_array', required: false, enum: 'add_on'  },
  preferred_date:    { type: 'date',       required: true                    },
  preferred_time:    { type: 'enum',       required: false, enum: 'preferred_time' },
  referral:          { type: 'enum',       required: false, enum: 'referral' },
  notes:             { type: 'string',     required: false, maxLength: 2000 },
};

// Build the allowlist Set once
const ALLOWED_KEYS = new Set(Object.keys(SCHEMA));


/* =============================================================================
   3. SANITIZER
   All text passes through here before validation or use.
   OWASP XSS Prevention: encode on output, clean on input.
   ============================================================================= */
const Sanitizer = {
  /** HTML-encode special chars — use when reflecting values into the DOM. */
  escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /** Strip null bytes, ASCII control chars (except \t \n \r), collapse whitespace. */
  cleanText(s) {
    if (typeof s !== 'string') return '';
    return s
      .replace(/\0/g, '')                               // null bytes
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
      .replace(/[ \t]+/g, ' ')                          // collapse spaces/tabs
      .trim();
  },

  /** Keep only valid phone characters: digits, spaces, hyphens, parens, + */
  cleanPhone(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/[^\d\s\-()+.]/g, '').trim();
  },

  /** Lowercase + trim for email addresses. */
  cleanEmail(s) {
    if (typeof s !== 'string') return '';
    return s.toLowerCase().trim();
  },
};


/* =============================================================================
   4. VALIDATOR
   Schema-driven. Returns { ok, sanitised, errors } so calling code
   can display per-field messages without coupling to specific DOM IDs.
   ============================================================================= */
const Validator = {
  // Simplified RFC 5322: rejects obvious bad patterns, two-letter+ TLD required
  _EMAIL_RE: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
  // ISO 8601 date
  _DATE_RE:  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,

  /**
   * validate(rawData) — validates and sanitises a plain object.
   * @returns {{ ok: boolean, sanitised: Object, errors: Object<string,string> }}
   */
  validate(rawData) {
    const errors    = {};
    const sanitised = {};
    const today     = new Date().toISOString().split('T')[0];

    // Step 1: Drop any key not in the allowlist (silent — no info leak)
    const data = {};
    for (const key of ALLOWED_KEYS) {
      if (Object.prototype.hasOwnProperty.call(rawData, key)) {
        data[key] = rawData[key];
      }
    }
    const dropped = Object.keys(rawData).filter(k => !ALLOWED_KEYS.has(k));
    if (dropped.length) {
      console.warn('[VW Security] Unexpected fields dropped:', dropped);
    }

    // Step 2: Validate each schema field
    for (const [field, rules] of Object.entries(SCHEMA)) {

      // ── enum_array ────────────────────────────────────────────────────────
      if (rules.type === 'enum_array') {
        const arr     = Array.isArray(data[field]) ? data[field] : [];
        const allowed = ENUMS[rules.enum] || [];
        sanitised[field] = arr
          .map(v => Sanitizer.cleanText(String(v)))
          .filter(v => {
            if (!allowed.includes(v)) {
              console.warn(`[VW Security] enum_array value rejected for "${field}": "${v}"`);
              return false;
            }
            return true;
          });
        continue;
      }

      const raw = data[field] !== undefined && data[field] !== null
        ? String(data[field]) : '';

      // ── Required check ────────────────────────────────────────────────────
      if (rules.required && raw.trim() === '') {
        errors[field] = `${field.replace(/_/g, ' ')} is required.`;
        sanitised[field] = '';
        continue;
      }

      if (raw.trim() === '') { sanitised[field] = ''; continue; }

      // ── Type-specific sanitise + validate ─────────────────────────────────
      let cleaned = '';

      switch (rules.type) {

        case 'email':
          cleaned = Sanitizer.cleanEmail(raw);
          if (!this._EMAIL_RE.test(cleaned)) errors[field] = 'Please enter a valid email address.';
          break;

        case 'phone':
          cleaned = Sanitizer.cleanPhone(raw);
          if (cleaned.replace(/\D/g, '').length < 10)
            errors[field] = 'Please enter a valid phone number (at least 10 digits).';
          break;

        case 'date':
          cleaned = Sanitizer.cleanText(raw);
          if (!this._DATE_RE.test(cleaned)) {
            errors[field] = 'Please enter a valid date.';
          } else if (field === 'dob' && cleaned > today) {
            errors[field] = 'Date of birth cannot be in the future.';
          } else if (field === 'preferred_date' && cleaned < today) {
            errors[field] = 'Preferred date cannot be in the past.';
          }
          break;

        case 'enum': {
          cleaned = Sanitizer.cleanText(raw);
          const allowed = ENUMS[rules.enum] || [];
          if (!allowed.includes(cleaned)) {
            console.warn(`[VW Security] Enum rejected for "${field}": "${cleaned}"`);
            errors[field] = `Invalid selection for ${field.replace(/_/g, ' ')}.`;
            cleaned = '';
          }
          break;
        }

        default: // 'string'
          cleaned = Sanitizer.cleanText(raw);
          break;
      }

      // ── Length cap (truncate silently — don't block form) ─────────────────
      if (rules.maxLength && cleaned.length > rules.maxLength) {
        cleaned = cleaned.slice(0, rules.maxLength);
        console.warn(`[VW Security] Field "${field}" truncated to ${rules.maxLength} chars.`);
      }

      sanitised[field] = cleaned;
    }

    return { ok: Object.keys(errors).length === 0, sanitised, errors };
  },
};


/* =============================================================================
   5. HONEYPOT
   A visually hidden field that human users never fill in.
   Bots that blindly populate all inputs will trigger this.
   The matching <input> must exist in the HTML (see contact.html).
   ============================================================================= */
const Honeypot = {
  FIELD_ID: 'vw_hp_website',
  isClear() {
    try {
      const el = document.getElementById(this.FIELD_ID);
      return !el || el.value === '';
    } catch { return true; }
  },
};


/* =============================================================================
   6. EXPORT — attached to window so no bundler is required.
   ============================================================================= */
window.VWSecurity = { RateLimiter, Validator, Sanitizer, Honeypot };
