/* ---------- Hero art: a small team of cursors building a website ----------
   One SVG in the hero (.hero__art). Everything in it is a function of time, so any moment can be drawn
   (window.__heroArtAt(t) draws one, for checking).

   The intro (first visit in a session, or a reload; ~13 s; the scene is shown larger, in the middle of the hero):
      0.0  an empty page, an empty code editor and a publish panel; one cursor, "You"
      0.9  it builds a generic website: a small image in the corner, a centred serif headline, a grey button,
           cards of every size; then writes the code and presses Publish
      6.0  the build fails, messages pile up, the page breaks apart; it rushes around, asks "Why is this broken?",
           slows down, and falls over
      8.9  the team comes in: Code picks "You" up and sets it down to rest, then fixes the errors; Launch clears the
           messages; Design rebuilds the page on a grid, one piece at a time, with guides; Launch publishes: Live
     11.9  "You" gives a thumbs up, the headline rises, the scene moves into its place in the hero, the page comes in

   Then (and straight away on later visits) a calm 20 s loop in two rounds: Design adjusts the image, Code changes the
   card gap, the client comes over and says what it thinks in cursor chat, the team answers and publishes, and the
   client reacts. With reduced motion it is one still frame of the finished page. Skip, Escape or scrolling ends the intro. */
(function () {
  var art = document.querySelector('.hero__art');
  if (!art) return;
  var root = document.documentElement, col = art.parentNode;
  var title = col.querySelector('.hero__title'), actions = col.querySelector('.hero__actions');
  var intro = root.classList.contains('hero-intro') && !!title && !!actions;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!intro) root.classList.remove('hero-intro');

  /* ---------------- helpers ---------------- */
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '20 20 660 280');          // the page's left edge and the panels' right edge line up with the text column
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  art.appendChild(svg);
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  }
  function txt(str, attrs, parent) { var e = el('text', attrs, parent); e.textContent = str; return e; }
  function set(e, attrs) { for (var k in attrs) e.setAttribute(k, typeof attrs[k] === 'number' ? attrs[k].toFixed(2) : attrs[k]); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function smooth(x) { return x * x * (3 - 2 * x); }
  function inOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function mix(a, b, k) { return a + (b - a) * k; }
  function pulse(t, a, b) { return Math.sin(seg(t, a, b) * Math.PI); }            // 0, up to 1, back to 0
  function box(a, b, k) { return { x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), w: mix(a.w, b.w, k), h: mix(a.h, b.h, k), r: mix(a.r || 0, b.r || 0, k) }; }
  function grey(a, b, k) { var v = Math.round(mix(a, b, k)); return 'rgb(' + v + ',' + v + ',' + v + ')'; }
  function width(e) { try { return e.getComputedTextLength(); } catch (err) { return 0; } }
  function tf(e, x, y, s, r) {
    e.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ')' + (r ? ' rotate(' + r.toFixed(2) + ')' : '') + (s != null && s !== 1 ? ' scale(' + s.toFixed(3) + ')' : ''));
  }
  function op(e, v) { e.setAttribute('opacity', (+v).toFixed(3)); }
  // a path through [time, x, y] points, easing between them and waiting where two points repeat
  function track(keys) {
    return function (t) {
      if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
      for (var i = 1; i < keys.length; i++) {
        if (t <= keys[i][0]) {
          var a = keys[i - 1], b = keys[i], k = inOut((t - a[0]) / (b[0] - a[0]));
          return [mix(a[1], b[1], k), mix(a[2], b[2], k)];
        }
      }
      var e = keys[keys.length - 1];
      return [e[1], e[2]];
    };
  }

  var INK = '#141414', MUTED = '#6a6a6a', SOFT = '#e3e3e1', DIM = '#d4d4d2', PAPER = '#fafafa', CARD = '#f4f4f2';
  var LINE = 'rgba(20,20,20,.12)', ERR = '#b3261e';
  var SANS = 'Inter Tight, system-ui, sans-serif', SERIF = 'Georgia, "Times New Roman", serif', MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  /* ---------------- the two versions of the page: the one "You" makes, and the one the team makes ---------------- */
  var UG = {
    img: { x: 40, y: 118, w: 118, h: 66, r: 0 },
    btn: { x: 180, y: 128, w: 58, h: 16, r: 0 },
    sub: [{ x: 135, y: 109, w: 150, h: 4 }, { x: 165, y: 117, w: 90, h: 4 }],
    cards: [{ x: 30, y: 200, w: 100, h: 60, r: 0 }, { x: 146, y: 212, w: 124, h: 50, r: 0 }, { x: 286, y: 194, w: 96, h: 74, r: 0 }]
  };
  var CL = {
    img: { x: 214, y: 70, w: 170, h: 108, r: 8 },
    btn: { x: 34, y: 152, w: 64, h: 20, r: 6 },
    sub: [{ x: 34, y: 127, w: 120, h: 5 }, { x: 34, y: 137, w: 96, h: 5 }]
  };
  function cleanCard(i, gap) { var w = (352 - 2 * gap) / 3; return { x: 34 + i * (w + gap), y: 192, w: w, h: 72, r: 8 }; }

  /* ---------------- the website (page at 20,20, 380 x 260) ---------------- */
  var scene = el('g', {});
  var page = el('g', {}, scene);
  el('rect', { x: 20, y: 20, width: 380, height: 260, rx: 12, fill: PAPER, stroke: LINE, 'stroke-width': 1.2 }, page);
  [34, 44, 54].forEach(function (x) { el('circle', { cx: x, cy: 32, r: 2.5, fill: DIM }, page); });
  el('rect', { x: 150, y: 26, width: 120, height: 12, rx: 6, fill: '#ececea' }, page);
  txt('yourbrand.com', { x: 210, y: 34.4, 'font-size': 6.5, 'text-anchor': 'middle', fill: MUTED, 'font-family': SANS }, page);
  el('path', { d: 'M20 44h380', stroke: LINE, 'stroke-width': 1.2 }, page);
  el('rect', { x: 34, y: 53, width: 10, height: 10, rx: 3, fill: INK }, page);
  txt('Studio', { x: 49, y: 61, 'font-size': 8, 'font-weight': 600, fill: INK, 'font-family': SANS }, page);
  [['Work', 300], ['About', 324], ['Contact', 352]].forEach(function (n) { txt(n[0], { x: n[1], y: 61, 'font-size': 6.5, fill: MUTED, 'font-family': SANS }, page); });

  var H1 = 'Made to be noticed.';
  var h1u = txt('', { x: 210, y: 99, 'font-size': 14, 'letter-spacing': 0.8, 'text-anchor': 'middle', fill: '#3a3a3a', 'font-family': SERIF }, page);
  var h1a = txt('Made to be', { x: 34, y: 96, 'font-size': 17, 'font-weight': 600, 'letter-spacing': -0.5, fill: INK, 'font-family': SANS }, page);
  var h1b = txt('noticed.', { x: 34, y: 116, 'font-size': 17, 'font-weight': 600, 'letter-spacing': -0.5, fill: INK, 'font-family': SANS }, page);
  var caretH = el('rect', { width: 1.2, height: 13, fill: INK }, page);
  var subs = [0, 1].map(function () { return el('rect', { fill: DIM }, page); });

  var imgRect = el('rect', { fill: SOFT, stroke: 'rgba(20,20,20,.25)' }, page);
  var imgIcon = el('g', {}, page);
  el('circle', { cx: 0, cy: -14, r: 7, fill: '#cfcfcd' }, imgIcon);
  el('path', { d: 'M-34 26 -10 0 4 14 14 6 34 26z', fill: '#cfcfcd' }, imgIcon);
  var imgBroken = el('g', {}, page);                       // the image fails to load
  el('rect', { x: -9, y: -8, width: 18, height: 15, rx: 2, fill: 'none', stroke: MUTED, 'stroke-width': 1.1 }, imgBroken);
  el('path', { d: 'M-9 4 -3 -1 1 3M2 -8 -1 -2 3 2 0 7', fill: 'none', stroke: MUTED, 'stroke-width': 1.1, 'stroke-linejoin': 'round' }, imgBroken);

  var cards = [0, 1, 2].map(function () {
    var g = el('g', {}, page), c = { g: g };
    c.shadow = el('rect', { x: 2, y: 4, height: 72, rx: 8, fill: 'rgba(20,20,20,.08)', opacity: 0 }, g);
    c.rect = el('rect', { x: 0, y: 0, fill: CARD }, g);
    c.icon = el('rect', { x: 10, y: 10, width: 14, height: 14, fill: INK }, g);
    c.bars = [[33, 60, 5, INK], [44, 84, 4, DIM], [53, 64, 4, DIM]].map(function (b) { return el('rect', { x: 10, y: b[0], width: b[1], height: b[2], rx: b[2] / 2, fill: b[3] }, g); });
    return c;
  });
  var JUMBLE = [[6, -5, -5], [-4, 9, 4], [9, 3, 6]];

  var btn = el('g', {}, scene);
  var btnRect = el('rect', { x: 0, y: 0 }, btn);
  var btnU = txt('Get started', { 'font-size': 7, 'text-anchor': 'middle', fill: '#222', 'font-family': SERIF }, btn);
  var btnC = txt('Get started', { 'font-size': 7, 'font-weight': 500, 'text-anchor': 'middle', fill: PAPER, 'font-family': SANS }, btn);

  /* selection, size label, guides */
  var sel = el('g', {}, scene);
  var selRect = el('rect', { fill: 'none', stroke: INK, 'stroke-width': 1 }, sel);
  var handles = [0, 1, 2, 3, 4, 5].map(function () { return el('rect', { width: 5, height: 5, fill: PAPER, stroke: INK, 'stroke-width': 1 }, sel); });
  var tip = el('g', {}, scene);
  var tipRect = el('rect', { x: 0, y: 0, height: 13, rx: 4, fill: INK }, tip);
  var tipText = txt('', { x: 0, y: 9, 'font-size': 7, 'font-weight': 500, fill: PAPER, 'font-family': SANS, 'text-anchor': 'middle' }, tip);
  var guideV = el('path', { d: 'M34 50V276', stroke: INK, 'stroke-width': 0.8, 'stroke-dasharray': '3 3' }, scene);
  var guideV2 = el('path', { d: 'M214 50V276', stroke: INK, 'stroke-width': 0.8, 'stroke-dasharray': '3 3' }, scene);
  var guideH = el('path', { d: 'M24 192H396', stroke: INK, 'stroke-width': 0.8, 'stroke-dasharray': '3 3' }, scene);

  /* ---------------- the code editor (420,20, 260 x 150) ---------------- */
  var editor = el('g', {}, scene);
  el('rect', { x: 420, y: 20, width: 260, height: 150, rx: 12, fill: '#1f1f1f' }, editor);
  [434, 444, 454].forEach(function (x) { el('circle', { cx: x, cy: 32, r: 2.5, fill: '#3a3a3a' }, editor); });
  txt('index.html', { x: 550, y: 34.5, 'font-size': 6.5, fill: '#8a8a88', 'text-anchor': 'middle', 'font-family': SANS }, editor);
  var CX = 446;                                            // where the code starts, after the line numbers
  var hl = el('rect', { y: 125, height: 9.5, rx: 2, fill: '#3d3d3b' }, editor);   // selected text
  var C = { w: '#fafafa', g: '#7d7d7b', m: '#a9a9a7', s: '#d2d2d0' };
  var CODE = [
    [['<', 'g'], ['section', 'w'], [' class', 'm'], ['=', 'g'], ['"hero"', 's'], ['>', 'g']],
    [['  <', 'g'], ['h1', 'w'], ['>', 'g'], ['Made to be noticed.', 's'], ['</', 'g'], ['h1', 'w'], ['>', 'g']],
    [['  <', 'g'], ['a', 'w'], [' class', 'm'], ['=', 'g'], ['"btn"', 's'], ['>', 'g'], ['Get started', 's'], ['</', 'g'], ['a', 'w'], ['>', 'g']],
    [['</', 'g'], ['section', 'w'], ['>', 'g']],
    [['.hero', 'w'], [' { ', 'g'], ['display', 'm'], [': ', 'g'], ['grid', 's'], ['; }', 'g']],
    [['.btn', 'w'], [' { ', 'g'], ['background', 'm'], [': ', 'g'], ['#141414', 's'], ['; }', 'g']],
    [['.cards', 'w'], [' { ', 'g'], ['gap', 'm'], [': ', 'g'], ['14px', 's'], ['; }', 'g']]
  ];
  var lines = CODE.map(function (parts, i) {
    txt(String(i + 1), { x: 438, y: 54 + i * 13, 'font-size': 6.5, 'font-family': MONO, fill: '#4a4a48', 'text-anchor': 'end' }, editor);
    var t = el('text', { x: CX, y: 54 + i * 13, 'font-size': 7.5, 'font-family': MONO, style: 'white-space:pre' }, editor);
    var len = 0;
    var spans = parts.map(function (p) { var s = el('tspan', { fill: C[p[1]] }, t); len += p[0].length; return { el: s, str: p[0] }; });
    return { el: t, spans: spans, len: len };
  });
  function setChars(line, n) {
    var left = Math.round(n);
    line.spans.forEach(function (s) { var k = clamp(left, 0, s.str.length); s.el.textContent = s.str.slice(0, k); left -= k; });
  }
  var CHW = 0;
  function charWidth() {                                  // one character of the code font, measured once it is drawn
    if (CHW) return CHW;
    var w = width(lines[0].el);
    if (w > 0 && lines[0].el.textContent.length === lines[0].len) CHW = w / lines[0].len;
    return CHW || 4.5;
  }
  var ALL_CODE = lines.reduce(function (a, l) { return a + l.len; }, 0);
  var squig = [2, 5].map(function (i) {
    var y = 57 + i * 13, d = 'M' + CX + ' ' + y;
    for (var x = CX; x < CX + 126; x += 4) d += ' q1 -2 2 0 t2 0';
    return el('path', { d: d, fill: 'none', stroke: ERR, 'stroke-width': 0.8 }, editor);
  });
  var caretC = el('rect', { x: CX, y: 47, width: 1.2, height: 9, fill: PAPER }, editor);

  /* ---------------- the publish panel (420,184, 260 x 96) ---------------- */
  var panel = el('g', {}, scene);
  el('rect', { x: 420, y: 184, width: 260, height: 96, rx: 12, fill: PAPER, stroke: LINE, 'stroke-width': 1.2 }, panel);
  txt('Publish', { x: 434, y: 203, 'font-size': 8, 'font-weight': 600, fill: INK, 'font-family': SANS }, panel);
  var statusRing = el('circle', { cx: 627, cy: 200.5, r: 3, fill: 'none', stroke: INK, 'stroke-width': 0.8 }, panel);
  var statusDot = el('circle', { cx: 627, cy: 200.5, r: 3, fill: DIM }, panel);
  var statusText = txt('Draft', { x: 634, y: 203, 'font-size': 7, fill: MUTED, 'font-family': SANS }, panel);
  [[440, INK], [460, MUTED], [480, '#bdbdbb'], [500, SOFT]].forEach(function (s) { el('circle', { cx: s[0], cy: 224, r: 7, fill: s[1], stroke: s[1] === SOFT ? DIM : 'none' }, panel); });
  txt('Colours', { x: 514, y: 226.5, 'font-size': 7, fill: MUTED, 'font-family': SANS }, panel);
  txt('yourbrand.com', { x: 434, y: 257, 'font-size': 7, fill: MUTED, 'font-family': SANS }, panel);
  var pubBtn = el('rect', { x: 560, y: 240, width: 106, height: 26, rx: 7, fill: INK }, panel);
  txt('Publish', { x: 613, y: 255.6, 'font-size': 8, 'font-weight': 500, 'text-anchor': 'middle', fill: PAPER, 'font-family': SANS }, panel);
  var colourDot = el('circle', { r: 6, fill: INK, stroke: PAPER, 'stroke-width': 1.2 }, scene);

  /* ---------------- messages ---------------- */
  var TOASTS = ['Build failed: 2 errors', 'Client: can the logo be bigger?', 'Mobile layout is broken', 'Deadline is today'];
  var toasts = TOASTS.map(function (m) {
    var g = el('g', {}, scene);
    el('rect', { x: 0, y: 0, width: 150, height: 20, rx: 6, fill: PAPER, stroke: 'rgba(20,20,20,.16)', 'stroke-width': 1 }, g);
    el('circle', { cx: 10, cy: 10, r: 2.6, fill: ERR }, g);
    txt(m, { x: 18, y: 12.6, 'font-size': 6.8, fill: INK, 'font-family': SANS }, g);
    el('path', { d: 'M139 7l6 6M145 7l-6 6', stroke: MUTED, 'stroke-width': 1, 'stroke-linecap': 'round' }, g);
    return g;
  });

  /* ---------------- reactions ---------------- */
  var THUMB = 'M1.5 5.5h2v5.5h-2zM3.5 10.5h4.9c.55 0 1-.38 1.1-.92l.6-3.1c.12-.62-.35-1.18-.98-1.18H6.6l.35-1.9c.1-.55-.32-1.06-.88-1.06L3.5 5.6';
  var react = el('g', {}, scene);
  el('circle', { cx: 0, cy: 0, r: 10, fill: PAPER, stroke: 'rgba(20,20,20,.16)', 'stroke-width': 1 }, react);
  var reactThumb = el('path', { d: THUMB, transform: 'translate(-6.6 -6.4) scale(1.1)', fill: 'none', stroke: INK, 'stroke-width': 1.1, 'stroke-linejoin': 'round' }, react);
  var reactCheck = el('path', { d: 'M-4.5 0.3l3 3 6-6.5', fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, react);

  /* ---------------- click rings and cursors (each cursor's name tag opens into a chat bubble) ---------------- */
  var rings = [0, 1, 2, 3, 4, 5].map(function () { return el('circle', { r: 0, fill: 'none', stroke: INK, 'stroke-width': 1.1 }, scene); });
  function cursor(label, fill, color) {
    var g = el('g', {});
    var tag = el('g', { transform: 'translate(10 15)' }, g);
    var r = el('rect', { x: 0, y: 0, height: 13, rx: 4, fill: fill, stroke: fill === PAPER ? 'rgba(20,20,20,.2)' : 'none', 'stroke-width': 1 }, tag);
    var t = txt(label, { x: 6, y: 9.2, 'font-size': 7.2, 'font-weight': 600, fill: color, 'font-family': SANS }, tag);
    var m = txt('', { x: 7, y: 11.2, 'font-size': 7.4, 'font-weight': 500, fill: color, 'font-family': SANS }, tag);
    el('path', { d: 'M0 0V15.5L4.1 11.7 6.9 18.1 9.7 16.9 7 10.6H12z', fill: fill === PAPER ? INK : fill, stroke: PAPER, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, g);
    return { g: g, rect: r, text: t, msg: m, label: label, lw: label.length * 4.4 };
  }
  var you = cursor('You', PAPER, INK), design = cursor('Design', INK, PAPER), code = cursor('Code', '#4a4a48', PAPER), launch = cursor('Launch', '#7a7a78', PAPER);
  var CURSORS = { you: you, design: design, code: code, launch: launch };
  function sizeTags() { Object.keys(CURSORS).forEach(function (k) { var c = CURSORS[k], w = width(c.text); if (w) c.lw = w; }); }
  sizeTags();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { sizeTags(); CHW = 0; draw(clock); });

  /* ---------------- the state of one moment ---------------- */
  function finished() {                                   // the team's page, finished, everyone at rest
    return {
      kImg: 1, kH1: 1, kBtn: 1, kCards: 1, ugImg: UG.img, imgX: 214, imgW: 170, iconO: 1, broken: 0,
      h1: H1.length, caretH: 0, sub: 1, btnPos: null, btnS: 1, cardsO: [1, 1, 1], cardPop: [1, 1, 1], jumble: [0, 0, 0], drop: 0,
      gap: 14, gapText: '14px', hl: 0, lift: [0, 0, 0], card2: INK,
      sel: null, tip: null, gV: 0, gV2: 0, gH: 0, code: ALL_CODE, caretC: null, squig: [0, 0],
      status: 'Live', statusFill: INK, ring: 0, pressed: false, colour: null, toasts: [], clicks: [], react: null, chat: {},
      you: { x: 636, y: 292, r: -12, o: 1 }, design: { x: 334, y: 210, o: 1 }, code_: { x: 560, y: 110, o: 1 }, launch: { x: 613, y: 253, o: 1 },
      pageO: 1
    };
  }
  function chat(text, t, a, b) {                           // a message typed into the cursor's tag between a and b
    if (t <= a || t >= b) return null;
    return { text: text, n: Math.round(text.length * seg(t, a + 0.1, a + 0.1 + text.length * 0.035)), k: smooth(seg(t, a, a + 0.2)) * (1 - smooth(seg(t, b - 0.25, b))) };
  }

  /* ---- the intro ---- */
  var INTRO_END = 12.8;
  var YOU = track([
    [0, 730, 330], [0.5, 730, 330], [0.85, 40, 118], [1.45, 158, 184], [1.7, 210, 94], [1.85, 250, 110], [2.55, 250, 110],
    [2.85, -54, 154], [3.25, 186, 132], [3.5, 212, 236], [3.65, 212, 236], [3.9, 446, 58],
    [4.15, 520, 95], [4.5, 560, 110], [4.8, 500, 125], [5.1, 584, 135], [5.3, 560, 140],
    [5.6, 613, 253], [5.7, 613, 253], [5.95, 378, 62], [6.2, 100, 232], [6.4, 560, 110], [6.6, 613, 253], [6.75, 378, 86],
    [6.9, 96, 232], [7.05, 470, 95], [7.8, 300, 215], [8.05, 300, 215]
  ]);
  var YOU_CLICKS = [0.85, 1.7, 2.85, 3.25, 3.55, 3.95, 5.65, 6.0, 6.2, 6.4, 6.6, 6.78, 6.9, 7.05];
  var CODE_I = track([[8.9, 760, 90], [9.4, 306, 279], [9.5, 306, 279], [10.2, 640, 289], [10.5, 526, 80], [10.8, 506, 119], [11.3, 560, 110]]);
  var LAUNCH_I = track([[8.9, 760, 330], [9.4, 378, 62], [9.5, 378, 62], [9.7, 380, 61], [9.9, 378, 62], [10.1, 379, 63], [10.6, 613, 253]]);
  var DESIGN_I = track([[8.9, 330, -40], [9.45, 99, 151], [9.5, 99, 151], [10.0, 299, 124], [10.25, 210, 96], [10.3, 210, 96],
    [10.7, 209, 136], [10.72, 209, 136], [11.0, 66, 162], [11.15, 210, 228], [11.2, 210, 228], [11.6, 334, 210]]);
  var TEAM_CLICKS = [[9.5, CODE_I], [10.52, CODE_I], [10.82, CODE_I], [9.5, LAUNCH_I], [9.7, LAUNCH_I], [9.9, LAUNCH_I], [10.1, LAUNCH_I], [11.3, LAUNCH_I],
    [9.5, DESIGN_I], [10.27, DESIGN_I], [10.72, DESIGN_I], [11.0, DESIGN_I], [11.17, DESIGN_I]];
  var T_IN = [6.0, 6.3, 6.6, 6.9], T_OUT = [9.5, 9.7, 9.9, 10.1];

  function introState(t) {
    var S = finished();
    var y = YOU(t);

    // the image: drawn small in the corner, breaks, then Design moves it onto the grid
    if (t < 0.85) S.ugImg = { x: 40, y: 118, w: 0, h: 0, r: 0 };
    else if (t < 1.45) S.ugImg = { x: 40, y: 118, w: Math.max(0, y[0] - 40), h: Math.max(0, y[1] - 118), r: 0 };
    S.kImg = seg(t, 9.5, 10.0);
    S.iconO = smooth(seg(t, 1.45, 1.7));
    S.broken = t > 6.0 && t < 9.5 ? 1 : 0;
    if (t > 0.85 && t < 1.7) {
      S.sel = { x: 40, y: 118, w: S.ugImg.w, h: S.ugImg.h, o: 1 - seg(t, 1.5, 1.7) };
      S.tip = { x: y[0] + 4, y: y[1] + 24, text: Math.round(S.ugImg.w) + ' × ' + Math.round(S.ugImg.h), o: 1 - seg(t, 1.45, 1.6) };
    }
    if (t > 9.5 && t < 10.15) {
      var bi = box(UG.img, CL.img, inOut(S.kImg));
      S.sel = { x: bi.x, y: bi.y, w: bi.w, h: bi.h, o: seg(t, 9.5, 9.6) * (1 - seg(t, 10.0, 10.15)) };
    }
    S.gV2 = pulse(t, 9.8, 10.2);

    // the headline: typed centred in a serif, slips when it breaks, then Design sets it in the brand type
    S.h1 = Math.round(H1.length * seg(t, 1.75, 2.45));
    S.caretH = t > 1.7 && t < 2.6 ? (Math.floor(t * 5) % 2 ? 0.25 : 1) : 0;
    S.kH1 = smooth(seg(t, 10.27, 10.6));
    S.sub = seg(t, 2.45, 2.65);
    S.drop = smooth(seg(t, 6.15, 6.45)) * (1 - S.kH1);

    // the button: dragged in, grey and square; later moved onto the grid and restyled
    if (t < 2.85) { S.btnPos = [-60, 150 + Math.sin(t * 2.4) * 2.5]; S.btnS = 0.9; S.kBtn = 0; }
    else if (t < 3.25) { S.btnPos = [y[0] - 6, y[1] - 4]; S.btnS = mix(0.9, 1, seg(t, 2.85, 3.25)); S.kBtn = 0; }
    else S.kBtn = seg(t, 10.72, 11.0);
    S.gV = pulse(t, 10.8, 11.2);

    // the cards: pasted in, every one a different size, thrown about, then lined up on the grid
    S.cardsO = [0, 1, 2].map(function (i) { return smooth(seg(t, 3.58 + i * 0.08, 3.75 + i * 0.08)); });
    S.cardPop = S.cardsO.map(function (o) { return 0.94 + 0.06 * o; });
    S.kCards = smooth(seg(t, 11.17, 11.45));
    S.jumble = [0, 1, 2].map(function (i) { return smooth(seg(t, 6.35 + i * 0.05, 6.5 + i * 0.05)) * (1 - S.kCards); });
    S.gH = pulse(t, 11.15, 11.6);

    // code written, then the build fails and two lines get underlined; Code fixes them later
    S.code = Math.round(ALL_CODE * seg(t, 4.0, 5.3));
    if (t > 3.98 && t < 5.4) S.caretC = Math.floor(t * 5) % 2 ? 0.3 : 1;
    S.squig = [t > 6.0 && t < 10.52 ? 1 : 0, t > 6.0 && t < 10.82 ? 1 : 0];

    // status
    if (t < 5.65) { S.status = 'Draft'; S.statusFill = DIM; }
    else if (t < 6.0 || (t > 11.3 && t < 11.7)) { S.status = 'Publishing…'; S.statusFill = Math.floor(t * 6) % 2 ? DIM : MUTED; }
    else if (t < 11.3) { S.status = 'Failed'; S.statusFill = ERR; }
    S.ring = t > 11.7 ? pulse(t, 11.7, 12.5) : 0;
    S.pressed = [5.65, 6.6, 11.3].some(function (c) { return t > c && t < c + 0.15; });

    // messages pile up, and later get cleared one by one
    S.toasts = T_IN.map(function (a, i) {
      var shake = (i === 0 && t > 6.0 && t < 6.3) || (i === 1 && t > 6.78 && t < 7.1) ? Math.sin(t * 60) * 2 : 0;
      return { o: smooth(seg(t, a, a + 0.2)), out: smooth(seg(t, T_OUT[i], T_OUT[i] + 0.25)), shake: shake };
    });

    // "You": tired, falls, gets picked up by Code and set down to rest
    var yx = y[0], yy = y[1], yr = 0;
    var tired = seg(t, 7.15, 8.05);
    if (tired > 0 && t < 8.05) { yx += Math.sin(t * 9) * 2.5 * tired; yy += Math.sin(t * 6.3) * 1.8 * tired; }
    var sag = smooth(seg(t, 7.8, 8.05)); yr = 14 * sag; yy += 4 * sag;
    if (t > 8.05) {
      var f = seg(t, 8.05, 8.5);
      yy += f * f * 70; yx += f * 10; yr = 14 + 76 * smooth(f);
      if (t > 8.5) yy -= Math.sin(seg(t, 8.5, 8.7) * Math.PI) * 6;
    }
    if (t > 9.5) {
      var cz0 = CODE_I(Math.min(t, 10.2)), lift = smooth(seg(t, 9.5, 9.9));
      yx = mix(yx, cz0[0] - 4, lift); yy = mix(yy, cz0[1] + 3, lift); yr = mix(90, -12, lift);
    }
    S.you = { x: yx, y: yy, r: yr, o: smooth(seg(t, 0.45, 0.6)) };
    S.chat.you = chat('Why is this broken?', t, 7.0, 7.95);

    // the team
    var teamO = smooth(seg(t, 8.9, 9.15));
    var dz = DESIGN_I(t), cz = CODE_I(t), lz = LAUNCH_I(t);
    S.design = { x: dz[0], y: dz[1], o: teamO };
    S.code_ = { x: cz[0], y: cz[1], o: teamO };
    S.launch = { x: lz[0], y: lz[1], o: teamO };
    S.chat.design = chat('We’ve got it', t, 9.0, 9.9);

    S.clicks = [];
    YOU_CLICKS.forEach(function (c) { if (t > c && t < c + 0.45) { var p = YOU(c); S.clicks.push([p[0], p[1], t - c]); } });
    TEAM_CLICKS.forEach(function (c) { if (t > c[0] && t < c[0] + 0.45) { var p = c[1](c[0]); S.clicks.push([p[0], p[1], t - c[0]]); } });

    if (t > 11.9) S.react = { x: 654, y: 280 - 16 * seg(t, 11.9, 12.7), o: pulse(t, 11.9, 12.7), kind: 'thumb', s: 0.7 + 0.3 * smooth(seg(t, 11.9, 12.15)) };
    S.pageO = smooth(seg(t, 0, 0.5));
    return S;
  }

  /* ---- the loop: two rounds, each with a change, a word from the client, an answer from the team and a publish ---- */
  var LOOP = 20;
  var VAL = [509, 126];                                    // the "14px" in the code
  var DESIGN_L = track([
    [0, 334, 210], [0.9, 214, 124], [1.0, 214, 124], [1.8, 196, 124], [2.2, 196, 124], [2.9, 300, 240], [4.0, 300, 240],
    [4.5, 262, 128], [5.4, 300, 240], [8, 250, 214], [10, 270, 200],
    [10.9, 196, 124], [11.0, 196, 124], [11.8, 214, 124], [12.3, 214, 124], [13.0, 460, 224], [13.1, 460, 224], [13.7, 172, 214],
    [14.4, 300, 250], [15.2, 440, 224], [15.3, 440, 224], [15.9, 172, 214], [16.0, 172, 214], [17.5, 300, 240], [20, 334, 210]]);
  var CODE_L = track([
    [0, 560, 110], [0.8, VAL[0], VAL[1]], [1.9, VAL[0], VAL[1]], [2.6, 560, 110], [5, 600, 140], [8, 560, 110],
    [10.8, VAL[0], VAL[1]], [11.9, VAL[0], VAL[1]], [12.8, 560, 110], [16, 610, 145], [20, 560, 110]]);
  var LAUNCH_L = track([
    [0, 613, 253], [2, 560, 205], [4.8, 613, 253], [5.0, 613, 253], [7.5, 480, 205], [9.5, 613, 253],
    [12, 540, 210], [16.8, 613, 253], [17.0, 613, 253], [19, 600, 262], [20, 613, 253]]);
  var YOU_L = track([
    [0, 636, 292], [2.6, 636, 292], [3.4, 150, 100], [3.6, 150, 100], [4.6, 210, 228], [5.5, 210, 228], [5.9, 520, 236], [7.0, 520, 236], [8.2, 636, 292],
    [13.8, 636, 292], [14.6, 180, 214], [14.8, 180, 214], [17.4, 520, 236], [19.0, 520, 236], [20, 636, 292]]);
  var LOOP_CLICKS = [[1.0, DESIGN_L], [11.0, DESIGN_L], [13.05, DESIGN_L], [13.7, DESIGN_L], [15.25, DESIGN_L], [15.9, DESIGN_L],
    [0.95, CODE_L], [1.05, CODE_L], [10.95, CODE_L], [11.05, CODE_L], [5.0, LAUNCH_L], [17.0, LAUNCH_L]];

  function loopState(u) {
    var S = finished(), d = DESIGN_L(u), c = CODE_L(u), l = LAUNCH_L(u), y = YOU_L(u);
    S.design = { x: d[0], y: d[1], o: 1 }; S.code_ = { x: c[0], y: c[1], o: 1 }; S.launch = { x: l[0], y: l[1], o: 1 };

    // Design widens the image by its left side (the right edge stays put), and later brings it back
    var x = (u > 1.0 && u < 1.8) || (u > 11.0 && u < 11.8) ? d[0] : (u >= 1.8 && u <= 11.0 ? 196 : 214);
    S.imgX = x; S.imgW = 384 - x;
    var selO = u < 6 ? seg(u, 0.8, 1.0) * (1 - seg(u, 2.2, 2.5)) : seg(u, 10.8, 11.0) * (1 - seg(u, 12.2, 12.5));
    if (selO > 0) S.sel = { x: S.imgX, y: 70, w: S.imgW, h: 108, o: selO };
    if ((u > 1.0 && u < 2.1) || (u > 11.0 && u < 12.1)) S.tip = { x: d[0], y: d[1] + 26, text: Math.round(S.imgW) + ' × 108', o: 1 };

    // Code changes the gap between the cards: 14px to 20px, and back
    function edit(a, from, to) {                          // double-click the value at a, then type the new one
      if (u < a) return from;
      S.hl = u < a + 0.4 ? 1 : 0;
      if (u < a + 0.4) return from;
      if (u < a + 1.0) S.caretC = Math.floor(u * 5) % 2 ? 0.3 : 1;
      return to.slice(0, Math.round(to.length * seg(u, a + 0.45, a + 0.9)));
    }
    S.gapText = u < 6 ? edit(1.0, '14px', '20px') : edit(11.0, '20px', '14px');
    S.gap = u < 6 ? mix(14, 20, smooth(seg(u, 1.95, 2.45))) : mix(20, 14, smooth(seg(u, 11.95, 12.45)));

    // the client looks around and says what it thinks; the team answers
    S.chat.you = chat('Love the new headline', u, 3.5, 5.6) || chat('Black looked better', u, 14.7, 16.6);
    S.chat.design = chat('Thanks!', u, 4.5, 5.6) || chat('On it', u, 14.9, 15.9);
    S.lift[1] = smooth(seg(u, 4.7, 4.95)) * (1 - smooth(seg(u, 5.4, 5.65)));

    // Design tries grey on the middle card, the client asks for black, Design puts it back
    if (u > 13.05 && u < 13.7) S.colour = { x: d[0] + 3, y: d[1] + 3, fill: MUTED };
    if (u > 15.25 && u < 15.9) S.colour = { x: d[0] + 3, y: d[1] + 3, fill: INK };
    S.card2 = u > 13.7 && u < 15.9 ? MUTED : INK;

    // Launch publishes each round; the client reacts
    [5.0, 17.0].forEach(function (p) {
      if (u > p && u < p + 0.8) { S.status = 'Publishing…'; S.statusFill = Math.floor(u * 6) % 2 ? DIM : MUTED; }
      if (u > p + 0.8) S.ring = Math.max(S.ring, pulse(u, p + 0.8, p + 1.6));
      if (u > p && u < p + 0.15) S.pressed = true;
    });
    if (u > 6.0 && u < 7.2) S.react = { x: y[0] + 18, y: y[1] - 12 - 14 * seg(u, 6.0, 7.2), o: pulse(u, 6.0, 7.2), kind: 'thumb', s: 0.7 + 0.3 * smooth(seg(u, 6.0, 6.25)) };
    if (u > 18.0 && u < 19.2) S.react = { x: y[0] + 18, y: y[1] - 12 - 14 * seg(u, 18.0, 19.2), o: pulse(u, 18.0, 19.2), kind: 'check', s: 0.7 + 0.3 * smooth(seg(u, 18.0, 18.25)) };

    // the client rests between visits
    var rest = clamp(1 - Math.hypot(y[0] - 636, y[1] - 292) / 40, 0, 1);
    S.you = { x: y[0] + Math.sin(u * 0.9) * 1.5 * rest, y: y[1] + Math.sin(u * 1.4) * rest, r: -12 * rest + Math.sin(u * 0.9) * 3 * rest, o: 1 };

    S.clicks = [];
    LOOP_CLICKS.forEach(function (k) { if (u > k[0] && u < k[0] + 0.45) { var p = k[1](k[0]); S.clicks.push([p[0], p[1], u - k[0]]); } });
    return S;
  }

  /* ---------------- drawing one state ---------------- */
  function render(S) {
    op(page, S.pageO); op(editor, S.pageO); op(panel, S.pageO); op(btn, S.pageO);

    // image
    var ki = inOut(S.kImg), ib = box(S.ugImg, { x: S.imgX, y: 70, w: S.imgW, h: 108, r: 8 }, ki);
    set(imgRect, { x: ib.x, y: ib.y, width: Math.max(0, ib.w), height: Math.max(0, ib.h), rx: ib.r });
    imgRect.setAttribute('stroke-width', (1 - ki).toFixed(2));
    var iconScale = mix(0.62, 1, ki);
    tf(imgIcon, ib.x + ib.w / 2, ib.y + ib.h / 2 + 4 * iconScale, iconScale);
    op(imgIcon, S.iconO * (1 - S.broken) * clamp(Math.min(ib.w, ib.h) / 40, 0, 1));
    tf(imgBroken, ib.x + ib.w / 2, ib.y + ib.h / 2); op(imgBroken, S.broken);

    // headline
    var kh = S.kH1;
    h1u.textContent = H1.slice(0, S.h1);
    tf(h1u, 0, S.drop * 9, 1, S.drop * 3); op(h1u, 1 - kh);
    op(h1a, kh); op(h1b, kh); tf(h1a, 0, 4 * (1 - kh)); tf(h1b, 0, 4 * (1 - kh));
    op(caretH, S.caretH);
    if (S.caretH) set(caretH, { x: 210 + width(h1u) / 2 + 1.5, y: 88 });
    UG.sub.forEach(function (u, i) {
      var b = box(u, CL.sub[i], kh), w = b.w * S.sub;
      set(subs[i], { x: b.x + (1 - kh) * (b.w - w) / 2, y: b.y + S.drop * 9, width: w, height: b.h, rx: b.h / 2 });
    });

    // button
    var kb = inOut(S.kBtn), bb = box(UG.btn, CL.btn, kb);
    if (S.btnPos) { bb.x = S.btnPos[0]; bb.y = S.btnPos[1]; }
    tf(btn, bb.x, bb.y + S.drop * 12, S.btnS, S.drop * -4);
    set(btnRect, { width: bb.w, height: bb.h, rx: bb.r, fill: grey(163, 20, kb) });
    btnRect.setAttribute('stroke', 'rgba(20,20,20,' + (0.35 * (1 - kb)).toFixed(2) + ')');
    set(btnU, { x: bb.w / 2, y: bb.h / 2 + 2.4 }); op(btnU, 1 - kb);
    set(btnC, { x: bb.w / 2, y: bb.h / 2 + 2.6 }); op(btnC, kb);

    // cards
    var kc = inOut(S.kCards);
    cards.forEach(function (c, i) {
      var b = box(UG.cards[i], cleanCard(i, S.gap), kc), j = JUMBLE[i], k = S.jumble[i], s = S.cardPop[i], lift = S.lift[i];
      set(c.rect, { width: b.w, height: b.h, rx: b.r });
      c.rect.setAttribute('stroke', 'rgba(20,20,20,' + mix(0.3, 0.1, kc).toFixed(2) + ')');
      set(c.shadow, { width: b.w, height: b.h }); op(c.shadow, lift);
      c.icon.setAttribute('rx', mix(0, 4, kc).toFixed(2));
      c.bars.forEach(function (bar, n) { bar.setAttribute('x', mix(n === 0 ? 10 : 10 + (b.w - 20 - +bar.getAttribute('width')) / 2, 10, kc).toFixed(2)); });
      c.g.setAttribute('transform', 'translate(' + (b.x + j[0] * k + b.w / 2 * (1 - s)).toFixed(2) + ' ' + (b.y + j[1] * k + b.h / 2 * (1 - s) - 3 * lift).toFixed(2) + ') rotate(' + (j[2] * k).toFixed(2) + ' ' + (b.w / 2).toFixed(1) + ' ' + (b.h / 2).toFixed(1) + ') scale(' + s.toFixed(3) + ')');
      op(c.g, S.cardsO[i]);
    });
    cards[1].icon.setAttribute('fill', S.card2);

    // selection, size label, guides
    if (S.sel && S.sel.o > 0) {
      op(sel, S.sel.o);
      set(selRect, { x: S.sel.x, y: S.sel.y, width: Math.max(0, S.sel.w), height: Math.max(0, S.sel.h) });
      [[0, 0], [1, 0], [0, 1], [1, 1], [0, 0.5], [1, 0.5]].forEach(function (q, i) { set(handles[i], { x: S.sel.x + q[0] * S.sel.w - 2.5, y: S.sel.y + q[1] * S.sel.h - 2.5 }); });
    } else op(sel, 0);
    if (S.tip && S.tip.o > 0) {
      op(tip, S.tip.o); tipText.textContent = S.tip.text;
      var tw = S.tip.text.length * 3.8 + 10;
      set(tipRect, { width: tw, x: -tw / 2 }); tf(tip, S.tip.x, S.tip.y);
    } else op(tip, 0);
    op(guideV, S.gV * 0.6); op(guideV2, S.gV2 * 0.6); op(guideH, S.gH * 0.6);

    // code
    var gapSpan = lines[6].spans[4];
    lines[6].len += S.gapText.length - gapSpan.str.length; gapSpan.str = S.gapText;
    var left = S.code;
    for (var i = 0; i < 7; i++) { var n = clamp(left, 0, lines[i].len); setChars(lines[i], n); left -= n; }
    var chw = charWidth();
    set(hl, { x: CX + 14 * chw - 1, width: 4 * chw + 2 }); op(hl, S.hl);
    op(squig[0], S.squig[0]); op(squig[1], S.squig[1]);
    if (S.caretC != null) {
      var li = 6;
      if (!loopMode) { var acc = 0; for (li = 0; li < 6; li++) { acc += lines[li].len; if (S.code < acc) break; } }
      set(caretC, { x: CX + width(lines[li].el) + 1, y: 47 + li * 13 }); op(caretC, S.caretC);
    } else op(caretC, 0);

    // panel
    statusText.textContent = S.status; statusDot.setAttribute('fill', S.statusFill);
    statusText.setAttribute('fill', S.status === 'Failed' ? ERR : S.status === 'Live' ? INK : MUTED);
    statusRing.setAttribute('r', (3 + S.ring * 6).toFixed(2)); op(statusRing, S.ring > 0 ? (1 - S.ring) * 0.8 + 0.001 : 0);
    pubBtn.setAttribute('fill', S.pressed ? '#3a3a3a' : INK);
    if (S.colour) { op(colourDot, 1); set(colourDot, { cx: S.colour.x, cy: S.colour.y }); colourDot.setAttribute('fill', S.colour.fill); }
    else op(colourDot, 0);

    // messages stack from the top; when one is cleared the rest slide up
    var stack = 0;
    toasts.forEach(function (g, i) {
      var m = S.toasts[i];
      if (!m || m.o === 0) { op(g, 0); return; }
      tf(g, 236 + m.out * 40 + (m.shake || 0), 52 + stack * 24 - 6 * (1 - m.o));
      op(g, m.o * (1 - m.out));
      stack += 1 - m.out;
    });

    if (S.react) { tf(react, S.react.x, S.react.y, S.react.s); op(react, S.react.o); op(reactThumb, S.react.kind === 'thumb' ? 1 : 0); op(reactCheck, S.react.kind === 'check' ? 1 : 0); }
    else op(react, 0);

    rings.forEach(function (r, i) {
      var c = S.clicks[i];
      if (!c) { op(r, 0); return; }
      set(r, { cx: c[0], cy: c[1], r: 3 + c[2] * 30 });
      op(r, 0.5 * (1 - c[2] / 0.45));
    });

    // cursors, with their tags opening into chat bubbles
    [['you', S.you], ['design', S.design], ['code', S.code_], ['launch', S.launch]].forEach(function (p) {
      var c = CURSORS[p[0]], s = p[1], m = S.chat[p[0]];
      tf(c.g, s.x, s.y, 1, s.r || 0); op(c.g, s.o);
      var k = m ? m.k : 0;
      c.msg.textContent = m ? m.text.slice(0, m.n) : '';
      var mw = m ? width(c.msg) : 0;
      set(c.rect, { width: mix(c.lw + 12, Math.max(mw, 10) + 14, k), height: mix(13, 16, k), rx: mix(4, 8, k) });
      op(c.text, 1 - k); op(c.msg, k);
    });
  }

  var loopMode = false, clock = 0;
  function draw(t) {
    clock = t;
    loopMode = t >= INTRO_END;
    render(loopMode ? loopState((t - INTRO_END) % LOOP) : introState(t));
  }
  window.__heroArtAt = draw;

  /* ---------------- the intro: the scene shown large in the middle of the hero, then moved into place ---------------- */
  var STEPS = [[11.85, 'hi-title'], [12.4, 'hi-lead'], [12.6, 'hi-actions'], [12.8, 'hi-rest']];
  var skip = null, revealed = false;

  function bigTransform() {
    var w = art.offsetWidth, h = art.offsetHeight, cw = col.offsetWidth;
    var top = title.offsetTop, bottom = actions.offsetTop + actions.offsetHeight;
    var s = Math.max(1, Math.min((window.innerWidth - 32) / w, (bottom - top) / h, 1.45));
    var tx = cw / 2 - (art.offsetLeft + w * s / 2), ty = (top + bottom) / 2 - (art.offsetTop + h * s / 2);
    return 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
  }
  function reveal(quick) {
    if (revealed) return; revealed = true;
    art.style.transition = 'transform ' + (quick ? '.5s' : '.9s') + ' cubic-bezier(.2,.7,.2,1)';
    art.style.transform = '';
    window.removeEventListener('resize', fit);
  }
  function fit() { if (!revealed) art.style.transform = bigTransform(); }
  function endIntro() {
    if (endIntro.done) return; endIntro.done = true;
    STEPS.forEach(function (s) { root.classList.add(s[1]); });
    if (skip) skip.classList.add('is-gone');
    setTimeout(function () {
      root.classList.remove('hero-intro', 'hi-ready', 'hi-title', 'hi-lead', 'hi-actions', 'hi-rest');
      art.style.transition = ''; art.style.transform = '';
      if (skip && skip.parentNode) skip.parentNode.removeChild(skip);
    }, 1300);
    ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { window.removeEventListener(ev, onInput); });
  }
  function skipIntro() {
    if (!intro || clock >= INTRO_END) return;
    elapsedBase = INTRO_END; start = performance.now();       // carry on from the start of the loop
    draw(INTRO_END);
    reveal(true); endIntro();
  }
  function onInput(e) {
    if (e.type === 'keydown' && !/^(Escape|Enter| |ArrowDown|PageDown|End|Spacebar)$/.test(e.key)) return;
    skipIntro();
  }

  if (intro) {
    var wi = 0;
    (function wrap(node) {                                 // the headline, word by word
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'hw'; s.style.setProperty('--i', wi++); s.textContent = part;
            frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') wrap(n);
      });
    })(title);
    root.classList.add('hi-ready');
    fit();
    window.addEventListener('resize', fit);
    skip = document.createElement('button');
    skip.type = 'button'; skip.className = 'hi-skip';
    skip.innerHTML = 'Skip intro <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3.5 8.5 8 4 12.5M9 3.5 13.5 8 9 12.5"/></svg>';
    document.body.appendChild(skip);
    skip.addEventListener('click', skipIntro);
    ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { window.addEventListener(ev, onInput, { passive: true }); });
  }

  /* ---------------- the clock ---------------- */
  var start = 0, elapsedBase = intro ? 0 : INTRO_END, raf = 0, visible = true;
  draw(elapsedBase);
  if (reduced) return;                                     // one still frame of the finished page

  function frame(now) {
    var t = elapsedBase + (now - start) / 1000;
    draw(t);
    if (intro && !revealed) {
      STEPS.forEach(function (s) { if (t >= s[0]) root.classList.add(s[1]); });
      if (t >= 11.95) reveal(false);
    }
    if (intro && t >= 12.9) endIntro();
    raf = requestAnimationFrame(frame);
  }
  function run() {
    if (raf || !visible || document.hidden) return;
    start = performance.now(); raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf); raf = 0;
    elapsedBase = clock;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; if (visible) run(); else stop(); }).observe(art);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (intro && clock < INTRO_END) skipIntro(); stop(); } else run();
  });
  run();
})();
