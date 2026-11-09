/* ---------- Smooth scrolling (Lenis) ---------- */
(function () {
  if (typeof Lenis === 'undefined') return;                                   // CDN blocked: fall back to native scroll
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;  // respect reduced motion

  var lenis = new Lenis({
    lerp: 0.1,       // lower = smoother / slower to catch up
    anchors: true    // in-page links (#services, #contact) scroll smoothly too
  });
  window.lenis = lenis;  // used by scroll-rail.js

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
})();
