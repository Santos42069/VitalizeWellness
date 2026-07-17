/**
 * therapies.js — Vitalize Wellness (HARDENED)
 * =============================================================================
 * Changes from original:
 *   ✓ Removed hard-coded file:// local paths from the inline <script> block
 *     in therapies.html (they are now moved to config.js)
 *   ✓ URL scheme validation before applying background images
 *   ✓ Filter button click handler is unchanged (no security impact)
 * =============================================================================
 */

'use strict';

/* ── Guard ──────────────────────────────────────────────────────────────────── */
if (!window.VWConfig) {
  console.error('[VW] config.js must load before therapies.js');
}

/* =============================================================================
   IMAGE APPLICATION
   Reads card image paths from VWConfig.images (config.js).
   Rejects file://, javascript:, data: schemes.
   ============================================================================= */
const FALLBACKS = {
  'card-myers':      'linear-gradient(135deg,#efcfc7 0%,#ddb5af 100%)',
  'card-immunity':   'linear-gradient(135deg,#f0d8d3 0%,#c9948a 100%)',
  'card-getupandgo': 'linear-gradient(135deg,#e8d5d0 0%,#d4a8a0 100%)',
  'card-beauty':     'linear-gradient(135deg,#e2c5bf 0%,#c08078 100%)',
  'card-alleviate':  'linear-gradient(135deg,#efcfc7 0%,#ddb5af 100%)',
  'card-nad':        'linear-gradient(135deg,#e8d5d0 0%,#d4a8a0 100%)',
  'card-blean':      'linear-gradient(135deg,#f0d8d3 0%,#c9948a 100%)',
  'card-brainstorm': 'linear-gradient(135deg,#e2c5bf 0%,#c08078 100%)',
  'card-recoperf':   'linear-gradient(135deg,#efcfc7 0%,#ddb5af 100%)',
  'card-quench':     'linear-gradient(135deg,#e8d5d0 0%,#d4a8a0 100%)',
  'card-reboot':     'linear-gradient(135deg,#f0d8d3 0%,#c9948a 100%)',
  'card-nadNuero':   'linear-gradient(135deg,#e2c5bf 0%,#c08078 100%)',
};

function isSafeImageUrl(src) {
  if (!src || typeof src !== 'string') return false;
  const t = src.trim().toLowerCase();
  return !['javascript:', 'data:', 'file:', 'vbscript:'].some(s => t.startsWith(s));
}

(function applyImages() {
  const images = window.VWConfig?.images || {};
  Object.entries(FALLBACKS).forEach(([key, fallback]) => {
    const el = document.getElementById('img-' + key);
    if (!el) return;
    const src = images[key];
    el.style.backgroundImage    = isSafeImageUrl(src) ? `url('${src}')` : fallback;
    el.style.backgroundSize     = 'cover';
    el.style.backgroundPosition = 'center';
  });
})();


/* =============================================================================
   NAV + FADE-IN + FILTER BUTTONS (unchanged from original)
   ============================================================================= */
const nav = document.getElementById('main-nav');
if (nav) {
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
