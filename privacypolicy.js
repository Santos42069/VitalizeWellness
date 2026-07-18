'use strict';

/* Nav scroll shadow — same pattern as other pages */
const nav = document.getElementById('main-nav');
if (nav) {
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));
}

/* Fade-in on scroll — same pattern as other pages */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.fade-in').forEach(el => io.observe(el));

/* =============================================================================
   MOBILE HAMBURGER MENU
   ============================================================================= */
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

