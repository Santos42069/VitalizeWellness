# Vitalize Wellness — Static Website

<p align="center">
  <img src="https://img.shields.io/badge/status-active-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/license-proprietary-lightgrey" alt="License" />
  <img src="https://img.shields.io/badge/built%20with-HTML%20%7C%20CSS%20%7C%20Vanilla%20JS-blueviolet" alt="Built With" />
  <img src="https://img.shields.io/badge/deploy-Netlify-00C7B7" alt="Netlify" />
  <img src="https://img.shields.io/badge/email-EmailJS-orange" alt="EmailJS" />
</p>

> **Premium IV wellness clinic website** — fully static, zero dependencies, production-hardened, and ready to deploy on Netlify in one click.

---

## Table of Contents

- [Overview](#overview)
- [Live Pages](#live-pages)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Security Architecture](#security-architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

Vitalize Wellness is a **luxury IV therapy and wellness clinic** based in Weston, Florida. This repository contains the complete frontend website — a multi-page static site built with semantic HTML5, modular CSS custom properties, and vanilla JavaScript. No frameworks. No build tools required.

The site is fully production-hardened with a layered client-side security architecture (rate limiting, input validation, XSS prevention, honeypot bot detection) and deploys to Netlify with a strict Content Security Policy delivered as HTTP response headers.

---

## Live Pages

| Page | File | Description |
|---|---|---|
| Home | `index.html` | Hero, IV therapies, ingredients, longevity & aesthetics, stats |
| IV Therapies | `therapies.html` | Full treatment menu with pricing, add-ons, FAQ |
| Weight Loss | `weightloss.html` | 3-session sculpting program breakdown |
| About Us | `about.html` | Story, team, values, space, certifications |
| Contact / Book | `contact.html` | Full intake form with EmailJS submission |

---

## Project Structure

```
vitalize-wellness/
├── index.html              # Home page
├── therapies.html          # IV Therapies menu
├── weightloss.html         # Weight Loss program
├── about.html              # About Us
├── contact.html            # Contact & Booking form
│
├── index.css               # Home page styles
├── therapies.css           # Therapies page styles
├── weightloss.css          # Weight Loss page styles
├── about.css               # About page styles
├── contact.css             # Contact page styles
│
├── config.js               # ⚙️  Centralised config (image paths, EmailJS keys)
├── security.js             # 🔒  Client-side security layer
├── index.js                # Home page JS (images, nav, animations)
├── therapies.js            # Therapies page JS
├── weightloss.js           # Weight Loss page JS
├── about.js                # About page JS
├── contact.js              # Contact form JS (validation + EmailJS send)
│
├── images/                 # All local image assets
│   ├── zbtok.jpg
│   ├── BZLE3.jpg
│   ├── fat.jpg
│   ├── gtgFT.jpg
│   ├── myers.jpg
│   └── ...
│
├── netlify.toml            # Netlify config: HTTP headers, CSP, functions dir
├── package.json            # Node metadata and engine spec
│
├── .gitignore              # Excludes .env, node_modules, secrets
├── .env.example            # Template for local environment variables
│
└── docs/
    ├── SECURITY.md         # Security policy and vulnerability reporting
    ├── DEPLOYMENT.md       # Step-by-step deployment guide
    └── CONFIGURATION.md    # Full config reference
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | Semantic HTML5 |
| Styles | CSS3 with Custom Properties (no preprocessor) |
| Scripts | Vanilla ES6+ JavaScript (strict mode) |
| Fonts | Google Fonts — Cormorant Garamond + Inter |
| Email | [EmailJS](https://www.emailjs.com/) (client-side, no backend required) |
| Hosting | [Netlify](https://netlify.com) (static CDN + HTTP headers) |
| Security | Custom client-side layer (`security.js`) |

---

## Features

### Pages & UI
- **Fully responsive** — mobile, tablet, and desktop breakpoints on every page
- **Scroll-triggered animations** — `IntersectionObserver`-based fade-ins throughout
- **Sticky navigation** — transparent with blur, shadow on scroll
- **Promotional strip** — dismissible promo banner across all pages
- **Image configuration system** — all image paths managed centrally in `config.js`; CSS gradient fallbacks for missing images

### Contact Form (`contact.html`)
- Full patient intake form: name, DOB, biological sex, location, health history, treatment selection, appointment preferences
- Multi-select treatment add-ons via checkboxes
- Real-time per-field error clearing as the user types
- Consent checkbox with inline error
- EmailJS integration — form sends a structured plain-text email to the clinic inbox
- Success / error toast notifications built with safe DOM methods (no `innerHTML` with user data)

### Security (see [Security Architecture](#security-architecture) below)
- Rate limiting (token-bucket), honeypot, input sanitization, schema validation, field allowlisting

---

## Security Architecture

`security.js` provides a five-layer client-side defence-in-depth stack. Client-side controls do not replace server-side validation — if a serverless function is added later, replicate the schema there.

### 1. Rate Limiter
Token-bucket algorithm stored in `localStorage` + a hard per-session cap in `sessionStorage`.
- Max 3 consecutive submissions; 1 token refills every 10 minutes
- Hard cap of 5 submissions per browser session
- Tamper-resistant: malformed `localStorage` values reset silently

### 2. Input Validation
Schema-driven, typed validation in `Validator.validate()`:
- `string` — length-capped, control-char stripped
- `email` — RFC 5322-compliant regex
- `phone` — digit count ≥ 10
- `date` — ISO 8601, range-checked (DOB not future; appointment not past)
- `enum` — value must be in the declared allowlist
- `enum_array` — each item validated against the allowlist

### 3. Input Sanitisation
`Sanitizer` strips null bytes, ASCII control characters, collapses whitespace, and HTML-encodes special characters before any value touches the DOM.

### 4. Field Allowlisting
`ALLOWED_KEYS` — any field not explicitly declared in `SCHEMA` is silently dropped before processing. Unexpected keys are logged to the console only (no info leakage to the user).

### 5. Honeypot Bot Detection
A visually hidden `<input>` field (`opacity:0; pointer-events:none; tab-index:-1`) is injected into the form. Bots that blindly populate all inputs trigger it. On detection, the form silently appears to succeed — the bot receives no signal that it was caught.

### HTTP Security Headers (via `netlify.toml`)
```
Content-Security-Policy     — strict allowlist; no inline scripts
X-Frame-Options             — DENY
X-Content-Type-Options      — nosniff
Referrer-Policy             — strict-origin-when-cross-origin
Permissions-Policy          — camera, mic, geolocation, payment all disabled
```

---

## Getting Started

### Prerequisites
- Any modern web browser
- A code editor (VS Code recommended)
- [Node.js](https://nodejs.org/) ≥ 18 (only needed if you use the `npm run check` script)
- A free [EmailJS](https://www.emailjs.com/) account (for the contact form)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/vitalize-wellness.git
cd vitalize-wellness

# 2. Copy the environment template
cp .env.example .env
# Fill in your EmailJS credentials in .env

# 3. Open locally — no build step required
# Option A: VS Code Live Server extension (recommended)
# Option B: Python one-liner
python3 -m http.server 3000
# Option C: Node
npx serve .
```

> **Important:** Open via `http://localhost:3000` — not `file://`. The Content Security Policy blocks `file://` URLs and EmailJS will not initialise on a `file://` origin.

---

## Configuration

All site-wide configuration lives in **`config.js`**.

### EmailJS Credentials

```js
// config.js
const VWConfig = {
  emailjs: {
    publicKey:      'YOUR_EMAILJS_PUBLIC_KEY',   // Account → General → Public Key
    serviceId:      'YOUR_EMAILJS_SERVICE_ID',   // Email Services
    templateId:     'YOUR_EMAILJS_TEMPLATE_ID',  // Email Templates
    recipientEmail: 'care@vitalizewellness.health',
  },
  // ...
};
```

### Image Paths

```js
images: {
  'hero-main': 'images/hero.jpg',       // relative path from project root
  'why':       'https://cdn.example.com/why.jpg', // or full CDN URL
  'facial':    '',                       // leave empty for gradient fallback
  // ...
}
```

All image paths are validated at runtime — `file://`, `javascript:`, `data:`, and `vbscript:` schemes are rejected silently.

---

## Deployment

### Netlify (Recommended — One Click)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. Push this repository to GitHub
2. Log in to [Netlify](https://netlify.com) → **Add new site → Import from Git**
3. Select your repository — no build command or publish directory needed (leave both blank)
4. Go to **Site settings → Environment variables** and add:

| Variable | Value |
|---|---|
| `EMAILJS_PUBLIC_KEY` | Your EmailJS public key |
| `EMAILJS_SERVICE_ID` | Your EmailJS service ID |
| `EMAILJS_TEMPLATE_ID` | Your EmailJS template ID |

5. Update `config.js` to read from these variables (or set the values directly in `config.js` and add it to `.gitignore` if not using CI/CD)
6. Deploy — all HTTP security headers are applied automatically via `netlify.toml`

### Manual / Other Hosts

Upload all files to your host's public directory. Ensure your server sets the security headers defined in `netlify.toml`. For Apache, use `.htaccess`; for Nginx, add to your server block.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `EMAILJS_PUBLIC_KEY` | Yes | EmailJS account public key |
| `EMAILJS_SERVICE_ID` | Yes | EmailJS connected email service ID |
| `EMAILJS_TEMPLATE_ID` | Yes | EmailJS email template ID |

> EmailJS public keys are **safe to ship client-side** — they can only send emails through your pre-configured templates. They cannot read emails or access private account data.

---

## Roadmap

- [ ] **Booking system integration** — connect `book.html` to a scheduling API (Calendly, Acuity, Jane App)
- [ ] **Netlify serverless function** — move EmailJS logic server-side for stricter rate limiting
- [ ] **Cookie consent banner** — GDPR/CCPA compliant
- [ ] **Analytics** — privacy-respecting analytics (Plausible or Fathom)
- [ ] **Testimonials section** — review carousel on homepage
- [ ] **Blog / Resources** — SEO-driven content for IV therapy topics
- [ ] **Multilingual support** — Spanish language version (South Florida market)
- [ ] **PWA** — add `manifest.json` and service worker for offline support
- [ ] **Automated accessibility audit** — integrate `axe-core` in CI
- [ ] **Dark mode** — CSS custom property swap

---

## Contributing

This is a private business website. External contributions are not accepted. For internal team members:

1. Create a branch: `git checkout -b fix/your-description`
2. Make your changes
3. Test locally on `http://localhost`
4. Open a pull request against `main` with a clear description of the change

Please read [SECURITY.md](docs/SECURITY.md) before making any changes to `security.js`, `contact.js`, or `netlify.toml`.

---

## License

**Proprietary — All Rights Reserved.**

© 2026 Vitalize Wellness. This codebase and all associated assets are the exclusive property of Vitalize Wellness. Unauthorised reproduction, distribution, or modification is prohibited.

---

<p align="center">Built with care for Vitalize Wellness · Weston, Florida</p>
