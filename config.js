/**
 * config.js — Vitalize Wellness
 * =============================================================================
 * Centralised configuration loader.
 *
 * HOW TO USE:
 *   1. Copy .env.example → .env  (never commit .env)
 *   2. If deploying on Netlify / Vercel / Cloudflare Pages, set each variable
 *      as a "Build environment variable" in the dashboard.
 *   3. For a purely static site (no build step), fill in the PRODUCTION VALUES
 *      section below with your real values — but keep this file out of any
 *      public GitHub repo by adding it to .gitignore.
 *
 * SECURITY NOTES:
 *   • EmailJS public keys are safe to ship in client-side JS — they identify
 *     your account but cannot be used to read emails or access private data.
 *   • Service ID and Template ID are similarly low-risk, but limit what your
 *     EmailJS template accepts (use EmailJS template variables to whitelist
 *     which fields get inserted).
 *   • NEVER put SMTP passwords, private API keys, or database credentials here.
 *
 * OWASP reference: Secrets Management Cheat Sheet
 * =============================================================================
 */

'use strict';

/**
 * VWConfig — single object consumed by contact.js.
 *
 * Replace the placeholder strings with your real values.
 * For CI/CD pipelines, inject via __EMAILJS_PUBLIC_KEY__ etc. at build time.
 */
const VWConfig = {
  emailjs: {
    /**
     * publicKey — from EmailJS dashboard → Account → General → Public Key
     * Safe to expose client-side; it only lets you SEND emails via YOUR templates.
     */
    publicKey:  'YOUR_EMAILJS_PUBLIC_KEY',   // ← replace this

    /**
     * serviceId — from EmailJS dashboard → Email Services
     * Example: 'service_abc123'
     */
    serviceId:  'YOUR_EMAILJS_SERVICE_ID',   // ← replace this

    /**
     * templateId — from EmailJS dashboard → Email Templates
     * Example: 'template_xyz789'
     */
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID',  // ← replace this

    /**
     * recipientEmail — the inbox that receives patient inquiries.
     * Do NOT use a personal address; use a role address (info@, care@).
     */
    recipientEmail: 'care@vitalizewellness.health', // ← confirm this
  },

  /**
   * Image paths — use relative paths from the project root,
   * or full HTTPS URLs to your CDN / hosted images.
   * NEVER use file:// paths (those are your local machine only).
   *
   * Leave a value as '' to show the CSS gradient placeholder instead.
   */
  images: {
    // index.html
    'hero-main': 'images/hero1.jpg', // e.g. 'images/hero.jpg' or 'https://cdn.example.com/hero.jpg'
    'why':       'images/zbtok.jpg',
    'facial':    'images/BZLE3.jpg',

    // weightloss.html
    'hero':      'images/fat.jpg',
    'overview':  'images/gtgFT.jpg',
    'how':       'images/VwThh.jpg',

    // about.html
    'about-hero':    '',  // hero-image-strip (full-width banner)
    'about-story':   'images/consutl2.jpg',  // founder story image
    'about-team-1':  'images/albertooo.jpg',  // Dr. Alberto Cortes
    'about-team-2':  'images/marol.jpg',  // Marol, PA-C
    'about-team-3':  'images/alex.jpg',  // Alex, RN
    'about-space-1': 'images/consutl.jpg',  // space gallery — large image
    'about-space-2': 'images/consutl2.jpg',  // space gallery — top right
    'about-space-3': 'images/consult1.jpg',  // space gallery — bottom right

    // therapies.html card images
    'card-myers':     'images/myers.jpg',
    'card-immunity':  'images/inmunity.jpg',
    'card-getupandgo':'images/getup.jpg',
    'card-beauty':    'images/innerbeau.jpg',
    'card-alleviate': 'images/pms.jpg',
    'card-nad':       'images/nad2.png',
    'card-blean':     'images/blean.jpg',
    'card-brainstorm':'images/brains.jpg',
    'card-recoperf':  'images/recovperf.jpg',
    'card-quench':    'images/quench.jpg',
    'card-reboot':    'images/reboo.jpg',
    'card-nadNuero':  'images/neuero.png',
  },
};

// Freeze so nothing can mutate config at runtime
Object.freeze(VWConfig.emailjs);
Object.freeze(VWConfig.images);
Object.freeze(VWConfig);

window.VWConfig = VWConfig;
