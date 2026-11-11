/* ---------- Intro (preloader) ----------
   Plays static/video/intro.webm over the page-coloured screen (see static/css/intro.css), then fades the screen out.
   It only runs when the page's <head> switched it on (html.intro-on): first open of the home page in a visit, motion not reduced.
   The video is loaded only then, so returning pages do not download it.
   It never holds the visitor up for long: tapping the screen skips it, and if the video cannot play, loads slowly or fails,
   the screen goes away at once. */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('intro-on')) return;
  var box = document.getElementById('intro'), video = box && box.querySelector('video');
  if (!box || !video) { root.classList.remove('intro-on'); return; }

  var finished = false, started = false;
  function finish() {
    if (finished) return; finished = true;
    box.classList.add('is-leaving');
    root.classList.remove('intro-lock');
    setTimeout(function () { root.classList.remove('intro-on'); if (box.parentNode) box.parentNode.removeChild(box); }, 560);
  }
  function start() {
    if (started || finished) return; started = true;
    video.classList.add('is-ready');
    var p = video.play(); if (p && p.catch) p.catch(finish);               // blocked or unsupported: do not wait
  }

  root.classList.add('intro-lock');
  video.muted = true;
  video.addEventListener('canplay', start);
  video.addEventListener('ended', function () { setTimeout(finish, 220); });  // a short hold on the last frame
  video.addEventListener('error', finish);
  box.addEventListener('click', finish);
  setTimeout(function () { if (!started) finish(); }, 1800);                 // slow to load: skip it
  setTimeout(finish, 5000);                                                  // whatever happens, never longer than this
  video.src = video.getAttribute('data-src');
})();
