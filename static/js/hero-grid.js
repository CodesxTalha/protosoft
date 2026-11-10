/* ---------- Hero: a grid of plus shapes with a calm, changing light across it, drawn on one canvas ----------
   Three slow moves play one after another and melt into each other (about 14 seconds, then it loops). The pluses never
   rotate or jump; each one only gets darker and slightly larger as the light reaches it.
     1. Spotlight   two soft pools of light drift across the grid on smooth, looping paths
     2. Landscape   the grid fills from the bottom up to a rolling line, like a chart that keeps finding new highs
     3. Lattice     two crossing diagonal waves interfere and form a slowly drifting diamond pattern
   Each move only decides how strong each plus is (0 to 1); the drawing turns that into a gray-to-black tone and a
   small change of size. One canvas paint per frame, 140 pluses, nothing heavy.

   The cursor (or a finger) reacts with the pluses themselves, not only their colour: the ones near it swell, thicken and
   are drawn gently towards it, like a magnet moving over the grid, and a click or tap sends one soft ring outwards.
   It is smoothed, so it follows with a little weight and fades out when the cursor leaves.
   Tune with data-cols / data-rows / data-speed on the canvas. */
(function () {
  var canvas = document.querySelector('.hero__grid');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var COLS = parseInt(canvas.dataset.cols, 10) || 20;
  var ROWS = parseInt(canvas.dataset.rows, 10) || 7;
  if (window.innerHeight < 800 && window.innerWidth > 560 && ROWS > 5) {            // a short screen: a shorter grid, so the basket below it stays on the first screen
    ROWS = 5; canvas.style.aspectRatio = COLS + ' / ' + ROWS;
  }
  var SPEED = Math.max(0.2, parseFloat(canvas.dataset.speed) || 1);
  var MAX_PLUS = 18;                                    // px
  var FADE = 1.4;                                       // seconds that one move melts into the next
  var TAU = Math.PI * 2;

  var BASE = [196, 196, 194], INK = [22, 22, 22];       // resting gray, and the strongest tone

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  /* ---- the cells ---- */
  var cells = [];
  for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) cells.push({ r: r, c: c });

  /* ---- the moves: each returns how strong one plus is (0 to 1) at local time u (seconds) ---- */
  var mx = (COLS - 1) / 2, my = (ROWS - 1) / 2;

  function spot(cx, cy, p, sigma) {                      // a soft pool of light centred on (cx, cy), in grid cells
    var dx = p.c - cx, dy = (p.r - cy) * 1.25;
    return Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
  }
  function spotlight(u, p) {
    var a = spot(mx + mx * 0.82 * Math.sin(u * 0.34), my + my * 0.78 * Math.sin(u * 0.51 + 1.0), p, 2.7);
    var b = spot(mx + mx * 0.78 * Math.sin(u * 0.27 + 2.4), my + my * 0.74 * Math.sin(u * 0.43 + 0.3), p, 2.1) * 0.8;
    return Math.min(1, a + b);
  }
  function landscape(u, p) {
    var x = p.c / (COLS - 1);
    var level = 0.5 + 0.26 * Math.sin(TAU * (x * 0.85 - u * 0.075)) + 0.15 * Math.sin(TAU * (x * 1.9 + u * 0.06) + 1.3);
    var top = ROWS * (1 - level);                        // where the line sits, measured in rows from the top
    var d = p.r + 0.5 - top;                             // below the line: positive
    return ease((d + 0.7) / 1.4) * (1 - 0.55 * clamp((d - 0.7) / 3.2, 0, 1));   // brightest at the line, softer below it
  }
  function lattice(u, p) {
    var a = Math.sin(TAU * ((p.c * 0.105 + p.r * 0.2) - u * 0.15));
    var b = Math.sin(TAU * ((p.c * 0.105 - p.r * 0.2) - u * 0.12));
    return ease(((a + b) * 0.25 + 0.5 - 0.42) / 0.5);
  }

  var MOVES = [{ fn: spotlight, dur: 6 }, { fn: landscape, dur: 6 }, { fn: lattice, dur: 6 }];
  var total = 0;
  MOVES.forEach(function (m) { m.start = total; total += m.dur - FADE; });   // each move starts while the last is still fading out
  var LOOP = total;
  var STILL_AT = MOVES[1].start + 3;                                          // the frame shown when motion is reduced

  function evaluate(t, p) {
    var v = 0;
    for (var m = 0; m < MOVES.length; m++) {
      var mv = MOVES[m];
      for (var lap = 0; lap < 2; lap++) {                // the second lap lets the last move fade into the first at the loop point
        var u = t + lap * LOOP - mv.start;
        if (u <= 0 || u >= mv.dur) continue;
        v += mv.fn(u, p) * ease(Math.min(1, u / FADE, (mv.dur - u) / FADE));
      }
    }
    return v > 1 ? 1 : v;
  }

  /* ---- the cursor ---- */
  var REACH = 3.4;                                       // radius of its influence, in cells
  var ptr = { x: 0, y: 0, sx: 0, sy: 0, on: false, k: 0 };   // raw position (screen px), smoothed position (canvas px), strength 0 to 1
  var pulses = [];                                       // click rings: { x, y, t } in canvas px and ms
  var interactive = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && canvas.dataset.cursor !== 'off';   // off: the toybox pieces answer the cursor instead
  var lastNow = 0;

  function track(e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; }
  function leave() { ptr.on = false; }
  if (interactive) {
    window.addEventListener('pointermove', track, { passive: true });
    window.addEventListener('pointerdown', function (e) {
      track(e);
      var rect = canvas.getBoundingClientRect();
      if (e.clientX > rect.left - 20 && e.clientX < rect.right + 20 && e.clientY > rect.top - 20 && e.clientY < rect.bottom + 20) {
        pulses.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t: performance.now() });
        if (pulses.length > 4) pulses.shift();
      }
    }, { passive: true });
    window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') leave(); }, { passive: true });
    window.addEventListener('pointercancel', leave, { passive: true });
    document.addEventListener('mouseleave', leave);
  }

  // Called once per frame: follows the cursor with a little weight, and fades the effect in and out
  function step(now) {
    var dt = Math.min(0.05, (now - (lastNow || now)) / 1000); lastNow = now;
    var rect = canvas.getBoundingClientRect(), m = cellSize() * 1.5;
    var near = ptr.on && ptr.x > rect.left - m && ptr.x < rect.right + m && ptr.y > rect.top - m && ptr.y < rect.bottom + m;
    var tx = ptr.x - rect.left, ty = ptr.y - rect.top;
    if (near && ptr.k < 0.02) { ptr.sx = tx; ptr.sy = ty; }      // it appears where the cursor is, it does not fly in from elsewhere
    var f = 1 - Math.exp(-dt * 6);
    if (near) { ptr.sx += (tx - ptr.sx) * f; ptr.sy += (ty - ptr.sy) * f; }
    ptr.k += ((near ? 1 : 0) - ptr.k) * (1 - Math.exp(-dt * (near ? 4.5 : 2.8)));
    if (ptr.k < 0.003) ptr.k = 0;
    while (pulses.length && now - pulses[0].t > 1300) pulses.shift();
  }
  function cellSize() { return w / COLS; }

  var w = 0, h = 0, dpr = 1, current = 0;
  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    draw(current, performance.now());
  }

  function draw(t, now) {
    current = t;
    var cell = w / COLS, size = Math.min(MAX_PLUS, cell * 0.62), k = size / 24;
    var sigma = cell * REACH, push = cell * 0.16 * ptr.k, active = ptr.k > 0, ringW = cell * 1.8, ring = [];
    for (var q = 0; q < pulses.length; q++) { var age = (now - pulses[q].t) / 1000; ring.push([pulses[q].x, pulses[q].y, age * cell * 9, Math.max(0, 1 - age / 1.3)]); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    for (var n = 0; n < cells.length; n++) {
      var p = cells[n], v = evaluate(t, p);
      var cx = (p.c + 0.5) * cell, cy = (p.r + 0.5) * cell, bump = 0, ox = 0, oy = 0;
      if (active) {
        var dx = cx - ptr.sx, dy = cy - ptr.sy, d2 = dx * dx + dy * dy, g = Math.exp(-d2 / (2 * sigma * sigma)) * ptr.k;
        if (g > 0.002) {
          var d = Math.sqrt(d2) || 1;
          var pull = Math.min(g * push / ptr.k, d * 0.3);       // drawn towards the cursor, never past it
          bump = g; ox = -dx / d * pull; oy = -dy / d * pull;
        }
      }
      for (var z = 0; z < ring.length; z++) {                 // a click: one soft ring travelling outwards
        var rx = cx - ring[z][0], ry = cy - ring[z][1], rd = Math.sqrt(rx * rx + ry * ry), e = (rd - ring[z][2]) / ringW;
        bump += Math.exp(-e * e) * 0.55 * ring[z][3];
      }
      if (bump > 1) bump = 1;
      v = Math.min(1, v + bump * 0.5);
      var l = 9.5 * k * (0.94 + 0.18 * v + 0.22 * bump);
      ctx.lineWidth = 5 * k * (1 + 0.12 * bump);
      ctx.strokeStyle = 'rgb(' + Math.round(BASE[0] + (INK[0] - BASE[0]) * v) + ',' + Math.round(BASE[1] + (INK[1] - BASE[1]) * v) + ',' + Math.round(BASE[2] + (INK[2] - BASE[2]) * v) + ')';
      ctx.globalAlpha = 0.75 + 0.25 * v;
      ctx.beginPath();
      ctx.moveTo(cx + ox, cy + oy - l); ctx.lineTo(cx + ox, cy + oy + l);
      ctx.moveTo(cx + ox - l, cy + oy); ctx.lineTo(cx + ox + l, cy + oy);
      ctx.stroke();
    }
  }
  canvas._drawAt = function (t) { draw(t % LOOP, performance.now()); };       // for checking single frames

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true, raf = 0, t0 = 0;
  function frame(now) {
    step(now);
    draw(((now - t0) / 1000 * SPEED) % LOOP, now);
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  function start() {
    if (raf || !visible || reduced || document.hidden) return;
    t0 = performance.now() - current / SPEED * 1000;         // carry on from where it stopped
    raf = requestAnimationFrame(frame);
  }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  current = reduced ? STILL_AT : 0;
  resize();

  if (reduced) return;                                       // one calm still frame

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
