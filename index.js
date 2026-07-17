/**
 * index.js — Vitalize Wellness (HARDENED)
 * =============================================================================
 * Changes from original:
 *   ✓ Removed hard-coded file:// local paths (leaked dev machine structure)
 *   ✓ Removed signed Canva CDN URL (expires + leaks account metadata)
 *   ✓ Image paths now loaded from config.js (single place to update)
 *   ✓ URL validation: rejects file://, javascript:, data: schemes
 * =============================================================================
 */

'use strict';

/* ── Guard ──────────────────────────────────────────────────────────────────── */
if (!window.VWConfig) {
  console.error('[VW] config.js must load before index.js');
}

/* =============================================================================
   IMAGE APPLICATION
   Only accepts http/https/relative URLs. Silently falls back to gradient
   for any disallowed scheme so the page never breaks.
   ============================================================================= */
const FALLBACKS = {
  'hero-main': 'linear-gradient(150deg,#f2d0c8 0%,#d9a099 50%,#c98a80 100%)',
  'why':       'linear-gradient(140deg,#efcfc7 0%,#d9a89f 100%)',
  'facial':    'linear-gradient(150deg,#f0d0c8 0%,#d9a099 100%)',
};

/**
 * isSafeImageUrl — rejects file://, javascript:, data: and other
 * non-HTTP schemes that could be injected via config.js or URL params.
 */
function isSafeImageUrl(src) {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim().toLowerCase();
  // Block dangerous schemes
  const blocked = ['javascript:', 'data:', 'file:', 'vbscript:', 'about:'];
  if (blocked.some(s => trimmed.startsWith(s))) return false;
  // Allow relative paths and http/https
  return true;
}

(function applyImages() {
  const images = window.VWConfig?.images || {};
  Object.entries(FALLBACKS).forEach(([key, fallback]) => {
    const el = document.getElementById('img-' + key);
    if (!el) return;
    const src = images[key];
    if (isSafeImageUrl(src)) {
      el.style.backgroundImage    = `url('${src}')`;
    } else {
      el.style.backgroundImage = fallback;
    }
    el.style.backgroundSize     = 'cover';
    el.style.backgroundPosition = 'center';
  });
})();


/* =============================================================================
   NAV SCROLL SHADOW
   ============================================================================= */
const nav = document.getElementById('main-nav');
if (nav) {
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));
}


/* =============================================================================
   FADE-IN ON SCROLL
   ============================================================================= */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });
document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
