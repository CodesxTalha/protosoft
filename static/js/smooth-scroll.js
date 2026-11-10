/* ---------- Smooth scrolling (Lenis) ---------- */
(function () {
  if (typeof Lenis === 'undefined') return;                                   // CDN blocked: fall back to native scroll
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;  // respect reduced motion

  var lenis = new Lenis({
    lerp: 0.1,       // lower = smoother / slower to catch up
    anchors: { offset: -80 }   // in-page links scroll smoothly too, stopping just below the top bar
  });
  window.lenis = lenis;  // used by scroll-rail.js

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
})();
