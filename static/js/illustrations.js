/* ---------- Services: run each card's animation only while it's on screen ---------- */
(function () {
  var illos = Array.prototype.slice.call(document.querySelectorAll('.illo'));
  if (!illos.length) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setPlaying(svg, playing) {
    svg.classList.toggle('is-paused', !playing);
    if (typeof svg.pauseAnimations === 'function') {
      playing ? svg.unpauseAnimations() : svg.pauseAnimations();
    }
  }

  if (reduced) {
    // Freeze on a representative frame (packets mid-flight, finished states shown by CSS)
    illos.forEach(function (svg) {
      if (typeof svg.setCurrentTime === 'function') svg.setCurrentTime(2.2);
      setPlaying(svg, false);
    });
    return;
  }

  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { setPlaying(entry.target, entry.isIntersecting); });
  }, { threshold: 0.2 });
  illos.forEach(function (svg) { setPlaying(svg, false); io.observe(svg); });
})();
