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

/* ── Mobile hamburger menu ── */
const hamburger  = document.getElementById('nav-hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const overlay    = document.getElementById('mobile-menu-overlay');

function openMenu() {
  hamburger?.classList.add('open');
  mobileMenu?.classList.add('open');
  overlay?.classList.add('open');
  document.body.classList.add('menu-open');
  hamburger?.setAttribute('aria-expanded', 'true');
}

function closeMenu() {
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
  overlay?.classList.remove('open');
  document.body.classList.remove('menu-open');
  hamburger?.setAttribute('aria-expanded', 'false');
}

hamburger?.addEventListener('click', () => {
  mobileMenu?.classList.contains('open') ? closeMenu() : openMenu();
});
overlay?.addEventListener('click', closeMenu);
mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); });

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