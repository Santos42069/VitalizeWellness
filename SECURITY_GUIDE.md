# Vitalize Wellness — Security Hardening Guide
## Complete Step-by-Step Implementation

---

## What Was Wrong (Audit Summary)

| # | Issue | Severity | File(s) |
|---|-------|----------|---------|
| 1 | `file:///C:/Users/juanp/Downloads/...` paths in source code | **High** | `index.js`, `therapies.html` |
| 2 | Signed Canva CDN URL exposed in source (expires + leaks account) | **High** | `index.js` |
| 3 | EmailJS public key hardcoded inline in HTML | **Medium** | `contact.html` |
| 4 | No rate limiting — form can be submitted unlimited times | **High** | `contact.js` |
| 5 | Weak validation — only checks presence, no type/length/enum checks | **High** | `contact.js` |
| 6 | No input sanitization — XSS possible if values ever rendered to DOM | **High** | `contact.js` |
| 7 | Unexpected form fields silently accepted | **Medium** | `contact.js` |
| 8 | No honeypot — zero bot friction | **Medium** | `contact.html` |
| 9 | No Content Security Policy — any script could be injected | **High** | all HTML |
| 10 | No HTTP security headers (X-Frame-Options, HSTS, etc.) | **Medium** | server config |
| 11 | `innerHTML` used for toast messages (XSS vector) | **Medium** | `contact.js` |
| 12 | EmailJS `init()` call exposed in HTML (should be in JS module) | **Low** | `contact.html` |

---

## Files You Received

```
vitalize-security/
├── security.js              ← NEW: rate limiter + validator + sanitizer + honeypot
├── config.js                ← NEW: all keys and image paths (DO NOT COMMIT)
├── config.example.js        ← NEW: safe template to commit to git
├── contact.js               ← REPLACED: hardened form handler
├── contact.html             ← REPLACED: CSP headers + honeypot + correct script order
├── index.js                 ← REPLACED: no file:// paths, reads from config.js
├── therapies.js             ← REPLACED: no file:// paths, reads from config.js
├── weightloss.js            ← REPLACED: reads from config.js
├── about.js                 ← REPLACED: minor hardening (use strict, null guards)
├── therapies-script-patch.html  ← Snippet: paste at bottom of therapies.html
├── index-script-patch.html      ← Snippet: paste at bottom of index.html
├── other-script-patches.html    ← Snippets: for weightloss.html + about.html
├── _headers                 ← NEW: Netlify HTTP security headers
├── .gitignore               ← NEW: prevents config.js from being committed
└── SECURITY_GUIDE.md        ← This file
```

---

## Step-by-Step Implementation

### STEP 1 — Set up the file structure

Place all files in your project root (same folder as `index.html`):

```
your-project/
├── index.html
├── index.css
├── index.js           ← replace with new version
├── contact.html       ← replace with new version
├── contact.css        ← unchanged
├── contact.js         ← replace with new version
├── therapies.html     ← modify (see Step 4)
├── therapies.css      ← unchanged
├── therapies.js       ← replace with new version
├── weightloss.html    ← modify (see Step 4)
├── weightloss.css     ← unchanged
├── weightloss.js      ← replace with new version
├── about.html         ← modify (see Step 4)
├── about.css          ← unchanged
├── about.js           ← replace with new version
├── config.js          ← NEW — fill in your keys (do not commit)
├── config.example.js  ← NEW — commit this instead
├── security.js        ← NEW — commit this (no secrets inside)
├── _headers           ← NEW — for Netlify
└── .gitignore         ← NEW — prevents config.js from being committed
```

---

### STEP 2 — Create your `config.js`

This is the most important step. Your keys and image paths live here only.

```bash
# In your terminal / file manager:
cp config.example.js config.js
```

Then open `config.js` and fill in your values:

```js
const VWConfig = {
  emailjs: {
    publicKey:      'YOUR_REAL_KEY_HERE',      // from emailjs.com → Account
    serviceId:      'service_xxxxxxx',          // from emailjs.com → Email Services
    templateId:     'template_xxxxxxx',         // from emailjs.com → Email Templates
    recipientEmail: 'care@vitalizewellness.health',
  },
  images: {
    'hero-main': 'images/hero.jpg',            // relative path or https:// URL
    'why':       'images/why.jpg',
    // ... fill in the rest
  },
};
```

**Image path rules:**
- ✅ `'images/hero.jpg'` — relative path, good
- ✅ `'https://yourcdn.com/hero.jpg'` — HTTPS URL, good
- ❌ `'file:///C:/Users/...'` — never, breaks for everyone but you
- ❌ Signed CDN URLs with `?exp=` — they expire

---

### STEP 3 — Add `.gitignore`

If you use Git, make sure `config.js` is never committed:

```
# .gitignore already contains this, but verify it's present:
config.js
```

To check what's staged:
```bash
git status
```

If `config.js` was ever committed previously, remove it from history:
```bash
git rm --cached config.js
git commit -m "Remove config.js from tracking"
```

---

### STEP 4 — Update HTML script tags

Each HTML file loads scripts at the bottom of `<body>`. Replace the old single `<script src="...js">` tag with the three-tag sequence. **Order matters.**

#### `index.html`
Find (near end of file):
```html
<script src="index.js">
</script>
```
Replace with:
```html
<script src="config.js"></script>
<script src="security.js"></script>
<script src="index.js"></script>
```

#### `therapies.html`
Find the entire block at the bottom (the old inline `<script>` with IMAGES object containing `file:///` paths, plus `<script src="therapies.js">`):
```html
<script src="therapies.js">
</script>
<!-- ... big inline script block with file:// paths ... -->
<script> const IMAGES = { "card-myers": "file:///..." ... } ... </script>
```
Replace the entire section with:
```html
<script src="config.js"></script>
<script src="security.js"></script>
<script src="therapies.js"></script>
```

#### `weightloss.html`
Find:
```html
<script src="weightloss.js">
</script>
```
Replace with:
```html
<script src="config.js"></script>
<script src="security.js"></script>
<script src="weightloss.js"></script>
```

#### `about.html`
Find:
```html
<script src="about.js">
</script>
```
Replace with:
```html
<script src="config.js"></script>
<script src="security.js"></script>
<script src="about.js"></script>
```

#### `contact.html`
The new `contact.html` is a complete replacement — just use the file provided.
It already has the correct script order at the bottom:
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
<script src="config.js"></script>
<script src="security.js"></script>
<script src="contact.js"></script>
```

---

### STEP 5 — Deploy the `_headers` file (Netlify)

If you host on Netlify, place the `_headers` file in your project root.
Netlify reads it automatically and applies HTTP security headers to every response.

To verify after deployment:
1. Open your live site in Chrome
2. Open DevTools → Network tab
3. Click any request → Headers tab
4. Look for `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`

**For other hosts:**

| Host | How to set headers |
|------|--------------------|
| Vercel | Add `"headers"` array to `vercel.json` |
| Cloudflare Pages | Add `_headers` file (same format) |
| Apache | Add to `.htaccess` with `Header set ...` |
| Nginx | Add `add_header` directives in `server {}` block |

---

### STEP 6 — Rotate your EmailJS keys

Since the old keys were in source code (and possibly in git history), rotate them:

1. Log into [emailjs.com](https://www.emailjs.com)
2. **Account → General** → regenerate your Public Key
3. **Email Services** → delete and recreate your service (new Service ID)
4. **Email Templates** → your Template ID is safe (no private data), but recreate if you're cautious
5. Update the new values in your local `config.js`

---

### STEP 7 — Test the form

Open `contact.html` in your browser and verify:

**Rate limiting:**
- Submit the form 3 times — on the 4th attempt you should see the "Too many submissions" message
- Wait 10 minutes — the counter resets automatically

**Validation:**
- Try submitting with an invalid email (`test@`) — should show per-field error
- Try submitting with a future date of birth — should block
- Try submitting with a past appointment date — should block
- Try submitting empty required fields — should show error banner

**Honeypot:**
- Open DevTools → Console
- Run: `document.getElementById('vw_hp_website').value = 'spam'`
- Submit the form — it should appear to succeed (silent bot rejection) but not send the email

**Sanitization:**
- Try entering `<script>alert(1)</script>` in the Name field
- It should be stripped/escaped before any use

---

### STEP 8 — EmailJS template lockdown

In your EmailJS template, restrict which variables are accepted:

1. Go to emailjs.com → Email Templates → your template
2. Make sure the template body only uses: `{{to_email}}`, `{{from_name}}`, `{{from_email}}`, `{{subject}}`, `{{message}}`, `{{reply_to}}`
3. In **Settings → Allowed Variables**, if available, enable strict mode
4. Set a **daily send limit** (emailjs.com → Account → Limits) to cap at e.g. 50/day

---

## What Each Security Layer Does

### `security.js` — Three mechanisms

**Rate Limiter (token bucket)**
- Each visitor gets 3 "tokens" (submissions)
- Tokens refill at 1 per 10 minutes
- A session cap of 5 prevents token farming by refresh
- Shows a friendly "please wait X minutes" message — not an error code
- Stored in `localStorage` (survives page reload) + `sessionStorage` (per tab)

**Validator**
- Every field checked against its declared schema before the email sends
- Types enforced: `email`, `phone`, `date`, `string`, `enum`, `enum_array`
- Length caps: names 60 chars, notes 2000 chars, etc.
- Enum values: if a select field receives a value not in its allowed list, it's rejected (prevents form tampering via DevTools)
- Unexpected fields silently dropped (allowlist pattern)

**Sanitizer**
- Strips null bytes and ASCII control characters
- Collapses repeated whitespace
- Normalises email (lowercase + trim)
- Strips non-phone characters from phone field
- `escapeHtml()` available for any values rendered back to the DOM

**Honeypot**
- Hidden field `vw_hp_website` — invisible to humans, visible to bots
- If populated → silent fake-success response (bot doesn't know it was blocked)

### `config.js` — Key management
- Single place for all credentials
- `.gitignore`d — never reaches your repo
- `Object.freeze()` prevents runtime mutation
- URL scheme validation in JS files blocks `file://` and `javascript:` injection

### `contact.html` — Browser-level defences
- **Content Security Policy** — blocks inline scripts, restricts script sources to `jsdelivr.net` + `self`
- **X-Frame-Options: DENY** — prevents clickjacking
- **X-Content-Type-Options: nosniff** — prevents MIME confusion attacks
- **Referrer-Policy** — doesn't leak your URL to third parties
- **`maxlength` attributes** — HTML-level length cap (backed up by JS validation)
- **`autocomplete` attributes** — correct per field (helps password managers not auto-fill medical fields)

### `_headers` — Server-level defences
- Canonical source for HTTP headers (preferred over `<meta>` tags)
- **HSTS** — forces HTTPS for 1 year, including subdomains
- **Permissions-Policy** — disables camera, microphone, geolocation, payment APIs

---

## What This Does NOT Cover

| Gap | Recommendation |
|-----|----------------|
| Server-side validation | If you add a backend/serverless function, replicate `SCHEMA` validation in Node/Python |
| CAPTCHA | Consider adding hCaptcha or Cloudflare Turnstile if spam volume grows |
| EmailJS quota abuse | Set a daily limit in the EmailJS dashboard |
| HIPAA compliance | Patient health data collected here may require a Business Associate Agreement. Consult a compliance professional before storing or processing patient records |
| Database / auth | Not applicable for this static site, but relevant if you add a booking backend |

---

## Quick Reference — OWASP Controls Applied

| OWASP Category | Control Applied |
|----------------|----------------|
| A03 Injection | Input sanitization, HTML encoding, allowlist validation |
| A04 Insecure Design | Honeypot, rate limiting, schema-based validation |
| A05 Security Misconfiguration | CSP, security headers, no debug info in errors |
| A06 Vulnerable Components | EmailJS loaded from versioned CDN URL |
| A07 Auth Failures | Rate limiting, session caps |
| A08 Software/Data Integrity | `Object.freeze()` on config, URL scheme validation |
| A09 Logging Failures | Console warnings for dropped fields, rate limit events |
| A10 SSRF | Not applicable (static site, no server-side requests) |
