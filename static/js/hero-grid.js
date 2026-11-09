/* ---------- Hero: grid of plus shapes, drawn on one canvas ----------
   A gray tone travels across the grid as a diagonal wave and each plus slowly fades.
   One canvas paint per frame replaces 140 separately animated SVG elements, which
   is what made scrolling lag. Tune with data-cols / data-rows / data-speed on the canvas. */
(function () {
  var canvas = document.querySelector('.hero__grid');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var COLS = parseInt(canvas.dataset.cols, 10) || 20;
  var ROWS = parseInt(canvas.dataset.rows, 10) || 7;
  var SPEED = Math.max(0.2, parseFloat(canvas.dataset.speed) || 1);
  var TONE_DUR = 9 / SPEED, FADE_DUR = 13 / SPEED;      // seconds per cycle
  var MAX_PLUS = 18;                                     // px, same cap as before

  // Tone stops: [position in cycle, r, g, b]
  var TONES = [[0, 247, 247, 246], [0.30, 201, 201, 200], [0.55, 58, 58, 58], [0.78, 163, 163, 163], [1, 247, 247, 246]];

  // Same seed -> same pattern on every load
  function jitter(r, c) {
    var x = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }
  function ease(t) { return t * t * (3 - 2 * t); }       // ease-in-out

  function tone(p) {
    for (var i = 1; i < TONES.length; i++) {
      if (p <= TONES[i][0]) {
        var a = TONES[i - 1], b = TONES[i], k = ease((p - a[0]) / (b[0] - a[0]));
        return 'rgb(' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ',' + Math.round(a[3] + (b[3] - a[3]) * k) + ')';
      }
    }
    return 'rgb(247,247,246)';
  }

  // Per-plus phase offsets in seconds (matches the old negative animation delays)
  var cells = [];
  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      var j = jitter(r, c);
      cells.push({ r: r, c: c, toneOff: c * 0.2 + r * 0.32 + j * 1.2, fadeOff: j * 13 });
    }
  }

  var w = 0, h = 0, dpr = 1;
  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    draw(performance.now());
  }

  function draw(now, still) {
    var t = now / 1000;
    var cell = w / COLS, size = Math.min(MAX_PLUS, cell * 0.62), k = size / 24;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineWidth = 5 * k;
    for (var i = 0; i < cells.length; i++) {
      var p = cells[i], cx = (p.c + 0.5) * cell, cy = (p.r + 0.5) * cell;
      if (still) {
        ctx.globalAlpha = 1; ctx.strokeStyle = '#bcbcbc';
      } else {
        var tp = ((t + p.toneOff) / TONE_DUR) % 1;
        var fp = ((t + p.fadeOff) / FADE_DUR) % 1;
        ctx.strokeStyle = tone(tp);
        ctx.globalAlpha = 0.55 + 0.45 * ease(fp < 0.5 ? fp * 2 : (1 - fp) * 2);
      }
      var x0 = cx - 12 * k, y0 = cy - 12 * k;           // 24x24 icon box, top-left
      ctx.beginPath();
      ctx.moveTo(x0 + 12 * k, y0 + 2.5 * k); ctx.lineTo(x0 + 12 * k, y0 + 21.5 * k);
      ctx.moveTo(x0 + 2.5 * k, y0 + 12 * k); ctx.lineTo(x0 + 21.5 * k, y0 + 12 * k);
      ctx.stroke();
    }
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true, raf = 0;
  function frame(now) { draw(now); raf = visible ? requestAnimationFrame(frame) : 0; }
  function start() { if (!raf && visible && !reduced && !document.hidden) raf = requestAnimationFrame(frame); }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  resize();

  if (reduced) { draw(0, true); return; }

  // Only animate while the hero is on screen and the tab is visible
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else start();
  });
  start();
})();
