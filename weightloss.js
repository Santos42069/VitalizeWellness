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

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });
document.querySelectorAll('.fade-in').forEach(el => io.observe(el));