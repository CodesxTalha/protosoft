/* ---------- Closing call to action: the text eases in once, when the card scrolls into view ----------
   Without JavaScript, or with reduced motion, the text is simply there. */
(function () {
  var sec = document.querySelector('.cta');
  var card = sec && sec.querySelector('.cta__card');
  if (!card) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  sec.classList.add('is-ready');
  var io = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { sec.classList.add('is-in'); io.disconnect(); }
  }, { threshold: 0.25 });
  io.observe(card);
})();
