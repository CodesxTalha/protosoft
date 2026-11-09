/* ---------- Closing call to action: a soft wave of light across a background of plus marks ----------
   Drawn on one canvas, only while the card is on screen. The grid fills the card: its first column starts
   exactly where the text starts (the card padding) and its first row where the heading starts, and the last
   column and row mirror that, so every margin equals the padding. Reduced motion gets a still frame and no
   entrance animation. */
(function () {
  var sec = document.querySelector('.cta');
  var canvas = sec && sec.querySelector('.cta__grid');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var card = sec.querySelector('.cta__card');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PERIOD = 7;            // seconds for the wave to cross the grid
  var w = 0, h = 0, dpr = 1, size = 11, cols = 0, rows = 0, x0 = 0, y0 = 0, stepX = 32, stepY = 32;

  var off = false;           // true when the stylesheet hides the grid (phones): then nothing is drawn at all

  function layout() {
    off = getComputedStyle(canvas).display === 'none';
    if (off) return;
    var pad = parseFloat(getComputedStyle(card).paddingLeft) || 36;      // the computed padding, so clamp() has already been resolved
    var target = parseFloat(getComputedStyle(canvas).getPropertyValue('--cell')) || 32;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = card.clientWidth; h = card.clientHeight;
    size = target * 0.36;
    var spanX = w - pad * 2 - size, spanY = h - pad * 2 - size;
    cols = Math.max(2, Math.round(spanX / target) + 1);
    rows = Math.max(2, Math.round(spanY / target) + 1);
    stepX = spanX / (cols - 1); stepY = spanY / (rows - 1);
    x0 = pad + size / 2; y0 = pad + size / 2;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  }

  function draw(now, still) {
    if (off) return;
    var t = now / 1000, a = size / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round'; ctx.lineWidth = 1.7; ctx.strokeStyle = '#fafafa';
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        // a diagonal wave: a soft bright band travelling from the top left to the bottom right
        var phase = (t / PERIOD) - (c * 0.035 + r * 0.08);
        var wave = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
        ctx.globalAlpha = still ? 0.16 : 0.07 + 0.30 * wave * wave;
        var cx = x0 + c * stepX, cy = y0 + r * stepY;
        ctx.beginPath();
        ctx.moveTo(cx, cy - a); ctx.lineTo(cx, cy + a);
        ctx.moveTo(cx - a, cy); ctx.lineTo(cx + a, cy);
        ctx.stroke();
      }
    }
  }

  var raf = 0, visible = false;
  function frame(now) { draw(now); raf = visible && !off ? requestAnimationFrame(frame) : 0; }
  function start() { if (!raf && visible && !off && !reduced && !document.hidden) raf = requestAnimationFrame(frame); }
  function relayout() { layout(); draw(performance.now(), reduced); start(); }

  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(card);
  else window.addEventListener('resize', relayout);
  layout(); draw(0, true);

  if (reduced || !('IntersectionObserver' in window)) { sec.classList.add('is-ready', 'is-in'); draw(0, true); return; }

  sec.classList.add('is-ready');
  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) { sec.classList.add('is-in'); start(); }
  }, { threshold: 0.25 }).observe(card);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else start();
  });
})();
