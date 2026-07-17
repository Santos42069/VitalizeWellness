'use strict';

(function () {

/* ── Guard: ensure dependencies loaded ─────────────────────────────────────── */
if (!window.VWSecurity) {
  console.error('[VW] security.js must load before contact.js');
}

const { RateLimiter, Validator, Honeypot } = window.VWSecurity;

/* ── Where the real send happens. EmailJS credentials never reach the
   browser — they live as Netlify environment variables read by this
   function. See netlify/functions/contact.js and SECURITY.md. ── */
const CONTACT_ENDPOINT = '/.netlify/functions/contact';


/* =============================================================================
   NAV + FADE-IN (unchanged from original)
   ============================================================================= */
const nav = document.getElementById('main-nav');
if (nav) {
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));
}

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.fade-in').forEach(el => io.observe(el));


/* =============================================================================
   DATE BOUNDS (unchanged from original)
   ============================================================================= */
const today = new Date().toISOString().split('T')[0];
const preferredDateEl = document.getElementById('preferred-date');
const dobEl           = document.getElementById('dob');
if (preferredDateEl) preferredDateEl.min = today;
if (dobEl)           dobEl.max           = today;


/* =============================================================================
   DOM FIELD MAP
   Maps schema field names → DOM element IDs so the validator can drive
   per-field error display without being coupled to ID strings throughout.
   ============================================================================= */
const FIELD_MAP = {
  first_name:        { inputId: 'first-name',        groupId: 'group-first-name'        },
  last_name:         { inputId: 'last-name',          groupId: 'group-last-name'         },
  email:             { inputId: 'email',              groupId: 'group-email'             },
  phone:             { inputId: 'phone',              groupId: 'group-phone'             },
  dob:               { inputId: 'dob',                groupId: 'group-dob'               },
  sex:               { inputId: 'sex',                groupId: 'group-sex'               },
  patient_type:      { inputId: 'patient-type',       groupId: 'group-patient-type'      },
  city:              { inputId: 'city',               groupId: 'group-city'              },
  state:             { inputId: 'state',              groupId: 'group-state'             },
  primary_treatment: { inputId: 'primary-treatment',  groupId: 'group-primary-treatment' },
  preferred_date:    { inputId: 'preferred-date',     groupId: 'group-preferred-date'    },
};

/** Collect the full raw form payload as a plain object. */
function collectFormData() {
  const addOns = Array.from(
    document.querySelectorAll('input[name="add_on"]:checked')
  ).map(cb => cb.value);

  return {
    first_name:        document.getElementById('first-name')?.value        ?? '',
    last_name:         document.getElementById('last-name')?.value         ?? '',
    email:             document.getElementById('email')?.value             ?? '',
    phone:             document.getElementById('phone')?.value             ?? '',
    dob:               document.getElementById('dob')?.value               ?? '',
    sex:               document.getElementById('sex')?.value               ?? '',
    patient_type:      document.getElementById('patient-type')?.value      ?? '',
    city:              document.getElementById('city')?.value              ?? '',
    state:             document.getElementById('state')?.value             ?? '',
    allergies:         document.getElementById('allergies')?.value         ?? '',
    medications:       document.getElementById('medications')?.value       ?? '',
    conditions:        document.getElementById('conditions')?.value        ?? '',
    pregnant:          document.getElementById('pregnant')?.value          ?? '',
    primary_treatment: document.getElementById('primary-treatment')?.value ?? '',
    add_ons:           addOns,
    preferred_date:    document.getElementById('preferred-date')?.value    ?? '',
    preferred_time:    document.getElementById('preferred-time')?.value    ?? '',
    referral:          document.getElementById('referral')?.value          ?? '',
    notes:             document.getElementById('notes')?.value             ?? '',
  };
}


/* =============================================================================
   PER-FIELD ERROR DISPLAY
   Reads the errors map returned by Validator.validate() and updates the DOM.
   ============================================================================= */

/** Show or clear error state on a single field. */
function setFieldError(schemaKey, message) {
  const map = FIELD_MAP[schemaKey];
  if (!map) return;
  const input = document.getElementById(map.inputId);
  const group = document.getElementById(map.groupId);
  if (!input || !group) return;

  if (message) {
    group.classList.add('has-error');
    input.classList.add('error');
    const span = group.querySelector('.field-error');
    if (span) span.textContent = message; // textContent = safe, no XSS
  } else {
    group.classList.remove('has-error');
    input.classList.remove('error');
  }
}

/** Apply the full errors map to the DOM at once. */
function applyErrors(errors) {
  for (const key of Object.keys(FIELD_MAP)) setFieldError(key, null);
  for (const [key, msg] of Object.entries(errors)) setFieldError(key, msg);
}

/** Show/hide the top-of-form error banner. */
function setBanner(visible, message) {
  const banner     = document.getElementById('error-banner');
  const bannerText = document.getElementById('error-banner-text');
  if (!banner) return;
  if (visible) {
    banner.classList.add('visible');
    if (bannerText) bannerText.textContent = message; // safe: textContent
  } else {
    banner.classList.remove('visible');
  }
}

/** Show/hide the consent error. */
function setConsentError(visible) {
  const el = document.getElementById('consent-error');
  if (el) el.style.display = visible ? 'block' : 'none';
}


/* =============================================================================
   LIVE ERROR CLEARING
   ============================================================================= */
for (const [schemaKey, map] of Object.entries(FIELD_MAP)) {
  const el = document.getElementById(map.inputId);
  if (el) {
    el.addEventListener('input', () => setFieldError(schemaKey, null));
  }
}
document.getElementById('consent')?.addEventListener('change', () => setConsentError(false));


/* =============================================================================
   TOAST HELPER
   Uses DOM methods instead of innerHTML to avoid XSS when displaying
   any data that originated from user input.
   ============================================================================= */
function showToast(type, strongText, bodyText) {
  // type = 'success' | 'error-msg'
  const id    = type === 'success' ? 'toast-success' : 'toast-error';
  const toast = document.getElementById(id);
  if (!toast) return;

  toast.className = `toast ${type}`;

  toast.textContent = '';
  const strong = document.createElement('strong');
  strong.textContent = strongText;
  const br   = document.createElement('br');
  const text = document.createTextNode(bodyText);
  toast.appendChild(strong);
  toast.appendChild(br);
  toast.appendChild(text);

  toast.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


/* =============================================================================
   SUBMIT HANDLER
   Order of checks:
     1. Honeypot (silent bot rejection — no network call needed)
     2. Client-side rate limit (fast UX feedback; server enforces its own
        authoritative limit regardless of what happens here)
     3. Consent checkbox
     4. Schema validation + sanitisation (client-side, for UX only — the
        Netlify function re-validates everything server-side and is the
        source of truth)
     5. POST the sanitised payload to /.netlify/functions/contact
   ============================================================================= */
document.getElementById('contact-form')?.addEventListener('submit', async function (e) {
  e.preventDefault();

  const btn = document.getElementById('submit-btn');

  // ── 1. Honeypot check ──────────────────────────────────────────────────────
  if (!Honeypot.isClear()) {
    // Bot detected — silently pretend to succeed (don't reveal the trap)
    showToast(
      'success',
      'Your information has been sent successfully.',
      'A member of our team will reach out within 24 hours.'
    );
    return;
  }

  // ── 2. Rate limit check ────────────────────────────────────────────────────
  const rl = RateLimiter.check();
  if (!rl.allowed) {
    setBanner(true, rl.message);
    document.getElementById('error-banner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // ── 3. Consent ─────────────────────────────────────────────────────────────
  const consent = document.getElementById('consent');
  if (!consent?.checked) {
    setConsentError(true);
    setBanner(true, 'You must agree to the terms before submitting.');
    document.getElementById('error-banner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  setConsentError(false);

  // ── 4. Schema validation + sanitisation ────────────────────────────────────
  const raw    = collectFormData();
  const result = Validator.validate(raw);

  applyErrors(result.errors);

  if (!result.ok) {
    setBanner(true, 'Please fill in all required fields marked with * before submitting.');
    document.getElementById('error-banner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  setBanner(false);

  // ── 5. Send to the Netlify function ────────────────────────────────────────
  btn.disabled = true;
  // Safe innerHTML here: no user data, only static SVG + literal text
  btn.innerHTML = '<svg viewBox="0 0 24 24" style="animation:spin 1s linear infinite;width:15px;height:15px;stroke:#fff;fill:none;stroke-width:2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Sending\u2026';

  const d = result.sanitised; // use sanitised data only from here on

  const payload = {
    ...d,
    consent: true,
    website: '', // honeypot already verified empty above
  };

  try {
    const res = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const seconds = body.retryAfterSeconds;
      const minutes = seconds ? Math.ceil(seconds / 60) : null;
      setBanner(
        true,
        minutes
          ? `Too many submissions. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`
          : 'Too many submissions. Please try again shortly.'
      );
      document.getElementById('error-banner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      btn.disabled = false;
      btn.innerHTML = '<svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:#fff;fill:none;stroke-width:2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send My Information';
      return;
    }

    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}`);
    }

    // Success
    showToast(
      'success',
      'Your information has been sent successfully.',
      'A member of our team will reach out within 24\u00A0hours to confirm your appointment. We look forward to seeing you at Vitalize.'
    );
    this.reset();
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:#fff;fill:none;stroke-width:2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send My Information';

  } catch (err) {
    // Generic error — do not expose err.message to the UI (info leakage)
    console.error('[VW] Contact submission error:', err);
    showToast(
      'error-msg',
      'Something went wrong.',
      'Your message could not be sent. Please try again or contact us directly at care@vitalizewellness.health.'
    );
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:#fff;fill:none;stroke-width:2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Try Again';
  }
});


/* =============================================================================
   SPINNER KEYFRAME (injected once)
   ============================================================================= */
const _spinStyle = document.createElement('style');
_spinStyle.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(_spinStyle);

})();