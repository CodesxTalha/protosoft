/* ---------- Top bar ----------
   Desktop: the bar is part of the page and scrolls away with it, so there is nothing to do here.
   Under 1000px: the bar is fixed, slides away as you scroll down and back as you scroll up, and the toggle opens the links. */
(function () {
  var bar = document.querySelector('.topbar');
  if (!bar) return;
  var small = window.matchMedia('(max-width: 999px)'), root = document.documentElement;
  var btn = bar.querySelector('.topbar__menu'), menu = bar.querySelector('.menu');
  var last = window.scrollY, ticking = false;

  /* Under 1000px: scrolling down slides the bar up out of view, scrolling up slides it back. The slide itself is a CSS animation. */
  function update() {
    ticking = false;
    var y = window.scrollY, dy = y - last;
    if (!small.matches || bar.classList.contains('is-open') || y < 80) bar.classList.remove('is-hidden');
    else if (dy > 8) bar.classList.add('is-hidden');
    else if (dy < -8) bar.classList.remove('is-hidden');
    if (Math.abs(dy) > 8 || y < 80) last = y;
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();

  function setOpen(open) {
    bar.classList.toggle('is-open', open); root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open)); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (window.lenis) { if (open) window.lenis.stop(); else window.lenis.start(); }
  }
  btn.addEventListener('click', function () { setOpen(!bar.classList.contains('is-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  bar.querySelector('.topbar__scrim').addEventListener('click', function () { setOpen(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && bar.classList.contains('is-open')) { setOpen(false); btn.focus(); } });
  small.addEventListener('change', function () { if (!small.matches && bar.classList.contains('is-open')) setOpen(false); });
})();
