'use strict';

if (!window.VWConfig) {
  console.error('[VW] config.js must load before about.js');
}

/* ── Image application (same pattern as index.js / therapies.js) ── */
const FALLBACKS = {
  'about-hero':    'linear-gradient(145deg,#efcfc7 0%,#dbb0a8 40%,#c98e85 100%)',
  'about-story':   'linear-gradient(150deg,#f0d0c8 0%,#d9a89f 100%)',
  'about-team-1':  'linear-gradient(150deg,#f2d0c8 0%,#d9a8a0 100%)',
  'about-team-2':  'linear-gradient(150deg,#ead0c8 0%,#cfa098 100%)',
  'about-team-3':  'linear-gradient(150deg,#f5d8d0 0%,#e0b0a8 100%)',
  'about-space-1': 'linear-gradient(150deg,#f0cec8 0%,#d9a099 100%)',
  'about-space-2': 'linear-gradient(150deg,#e8c8c0 0%,#cfa098 100%)',
  'about-space-3': 'linear-gradient(150deg,#f5d8d0 0%,#d9b0a8 100%)',
};

function isSafeImageUrl(src) {
  if (!src || typeof src !== 'string') return false;
  const t = src.trim().toLowerCase();
  return !['javascript:', 'data:', 'file:', 'vbscript:', 'about:'].some(s => t.startsWith(s));
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

/* ── Nav + fade-in (unchanged) ── */
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