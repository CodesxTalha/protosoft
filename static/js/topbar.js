/* ---------- Top bar: background after the first scroll, hides going down, returns going up ---------- */
(function () {
  var bar = document.querySelector('.topbar');
  if (!bar) return;
  var last = window.scrollY, ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY, dy = y - last;
    bar.classList.toggle('is-scrolled', y > 8);
    if (y < 120) bar.classList.remove('is-hidden');
    else if (dy > 6) bar.classList.add('is-hidden');
    else if (dy < -6) bar.classList.remove('is-hidden');
    if (Math.abs(dy) > 6 || y < 120) last = y;
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();
