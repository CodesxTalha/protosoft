/* ---------- Section rings: which section you are in, how far through it, and a way to jump ---------- */
(function () {
  var nav = document.querySelector('.secnav');
  if (!nav) return;
  var items = [].slice.call(nav.querySelectorAll('.secnav__item')), root = document.documentElement;
  var secs = items.map(function (li) { return document.getElementById(li.querySelector('a').getAttribute('href').slice(1)); });
  var ticking = false, last = [];

  function update() {
    ticking = false;
    var line = innerHeight * 0.4, cur = -1, p = [];
    secs.forEach(function (s, i) {
      if (!s) { p.push(0); return; }
      var r = s.getBoundingClientRect();
      if (r.top <= line) cur = i;
      p.push(Math.max(0, Math.min(1, (line - r.top) / Math.max(1, r.height))));
    });
    // in the hero nothing shows (until the cursor goes to the left edge); once you scroll down it stays; the last ring fills as you reach the end
    nav.classList.toggle('is-visible', cur >= 0);
    items.forEach(function (li, i) {
      var done = cur > i, now = cur === i, v = done ? 1 : now ? p[i] : 0;
      li.classList.toggle('is-done', done); li.classList.toggle('is-current', now);
      var a = li.querySelector('a');
      if (now) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      if (last[i] !== v) { li.style.setProperty('--p', v.toFixed(3)); last[i] = v; }
    });
  }
  /* In the hero, moving the cursor to the left edge shows the whole column (mouse screens only) */
  var mouse = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1000px)'), ZONE = 170;
  addEventListener('mousemove', function (e) {
    if (!mouse.matches) return;
    nav.classList.toggle('is-peek', e.clientX < ZONE || nav.matches(':hover'));
  });
  document.addEventListener('mouseleave', function () { nav.classList.remove('is-peek'); });
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); update();
})();
