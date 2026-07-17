/**
 * weightloss.js — Vitalize Wellness (HARDENED)
 * =============================================================================
 * Changes from original:
 *   ✓ Image paths moved from inline IMAGES object to config.js
 *   ✓ URL scheme validation rejects file://, javascript:, data:
 * =============================================================================
 */

'use strict';

if (!window.VWConfig) {
  console.error('[VW] config.js must load before weightloss.js');
}

const FALLBACKS = {
  'hero':     'linear-gradient(150deg,#f2d0c8 0%,#d9a099 50%,#c88a80 100%)',
  'overview': 'linear-gradient(145deg,#efcfc7 0%,#d9a89f 100%)',
  'how':      'linear-gradient(145deg,#f5d5cc 0%,#e0b0a8 100%)',
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

const nav = document.getElementById('main-nav');
if (nav) {
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));
}

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });
document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
