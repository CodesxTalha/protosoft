/* ---------- Case study video: loads when near the screen, plays only while visible ----------
   Mark a <video data-lazy> with <source data-src="…"> children (and a poster) and this does the rest. */
(function () {
  var videos = [].slice.call(document.querySelectorAll('video[data-lazy]'));
  if (!videos.length) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function load(v) {
    if (v.dataset.loaded) return;
    v.dataset.loaded = '1';
    [].forEach.call(v.querySelectorAll('source[data-src]'), function (src) { src.src = src.dataset.src; });
    v.load();
  }

  if (reduced) {                      // no autoplay: show the first frame with controls instead
    videos.forEach(function (v) { v.controls = true; v.preload = 'metadata'; load(v); });
    return;
  }
  if (!('IntersectionObserver' in window)) { videos.forEach(function (v) { load(v); v.play(); }); return; }

  // Watch the video's frame (the empty <video> itself is hidden, so it can never report being visible)
  var frames = videos.map(function (v) { return v.closest('.video-frame') || v.parentNode; });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = videos[frames.indexOf(e.target)];
      if (e.isIntersecting) { load(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { rootMargin: '300px 0px', threshold: 0.2 });
  frames.forEach(function (f) { io.observe(f); });
})();
