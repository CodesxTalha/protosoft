/* ---------- Hero art: a small team of cursors building a website, for real ----------
   One SVG in the hero (.hero__art). Everything in it is a function of time, so any moment can be drawn
   (window.__heroArtAt(t) draws one, for checking). Nothing appears on its own: every piece is made by a cursor,
   with the tool a person would use (text tool, rectangle tool, pen, gradient, paste, inspector, code and save).

   The intro (first visit in a session, or a reload; ~14.5 s; shown larger in the middle of the hero):
      0.0  an empty page, an empty editor and a deploy panel; one cursor, "You"
      0.9  You types a centred serif headline, pastes grey square buttons, draws a box and pastes a clip-art chart,
           pastes cards of every size, writes the code, and presses Deploy
      5.6  the build fails, messages pile up, the page slips apart; You rushes around, asks "Why is this broken?",
           slows down and falls over
      8.8  the team comes in:
             Launch  clears the messages, later deploys (the log runs step by step) and the site goes live
             Code    picks You up and sets it down to rest, fixes the two errors, writes the button and badge CSS
                     and saves: the page reloads with round buttons and a badge
             Design  sets the headline in the brand font and aligns it left in the inspector, moves and resizes the
                     chart box on guides, fills it dark, deletes the clip-art, pastes the header, draws the line
                     with the pen point by point, drags in the gradient, selects the cards and tidies them up
     13.6  You gives a thumbs up, the headline rises, the scene moves into its place in the hero

   Then (and straight away on later visits) a 24 s loop in three rounds. In each one Code selects the data array and
   types new numbers (each point of the chart moves as its number is typed), saves, Launch deploys, the log runs, the
   page reloads and the revenue counts to the new total. Design checks spacing, hover states and sizes; the client
   hovers the chart, reads the values and says what it thinks. The cards show live data the whole time.
   With reduced motion it is one still frame of the finished page. Skip, Escape or scrolling ends the intro. */
(function () {
  var art = document.querySelector('.hero__art');
  if (!art) return;
  var root = document.documentElement, col = art.parentNode;
  var title = col.querySelector('.hero__title'), actions = col.querySelector('.hero__actions');
  var intro = root.classList.contains('hero-intro') && !!title && !!actions;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!intro) root.classList.remove('hero-intro');

  /* ================= helpers ================= */
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
  function set(e, attrs) { for (var k in attrs) e.setAttribute(k, typeof attrs[k] === 'number' ? (+attrs[k]).toFixed(2) : attrs[k]); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function smooth(x) { return x * x * (3 - 2 * x); }
  function inOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function mix(a, b, k) { return a + (b - a) * k; }
  function pulse(t, a, b) { return Math.sin(seg(t, a, b) * Math.PI); }
  function box(a, b, k) { return { x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), w: mix(a.w, b.w, k), h: mix(a.h, b.h, k), r: mix(a.r || 0, b.r || 0, k) }; }
  function grey(a, b, k) { var v = Math.round(mix(a, b, k)); return 'rgb(' + v + ',' + v + ',' + v + ')'; }
  function width(e) { try { return e.getComputedTextLength(); } catch (err) { return 0; } }
  function tf(e, x, y, s, r) {
    e.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ')' + (r ? ' rotate(' + r.toFixed(2) + ')' : '') + (s != null && s !== 1 ? ' scale(' + s.toFixed(3) + ')' : ''));
  }
  function op(e, v) { e.setAttribute('opacity', (+v).toFixed(3)); }
  function money(v) { return '$' + Math.round(v).toLocaleString('en-US'); }

  /* A hand's path through [time, x, y] points. Between two points it speeds up and slows down, bends a little
     (people move along arcs, not rulers), and on long moves runs slightly past the target and settles back.
     Two equal points in a row mean the hand is still. */
  function track(keys) {
    return function (t) {
      if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
      for (var i = 1; i < keys.length; i++) {
        if (t <= keys[i][0]) {
          var a = keys[i - 1], b = keys[i], p = (t - a[0]) / (b[0] - a[0]);
          var dx = b[1] - a[1], dy = b[2] - a[2], dist = Math.sqrt(dx * dx + dy * dy);
          var k = inOut(p);
          if (dist > 110) k += Math.sin(Math.PI * clamp((p - 0.55) / 0.45, 0, 1)) * 0.045;
          var bend = (dist > 24 ? 0.09 : 0) * (i % 2 ? 1 : -1) * Math.sin(Math.PI * clamp(k, 0, 1));
          return [a[1] + dx * k - dy * bend, a[2] + dy * k + dx * bend];
        }
      }
      var e = keys[keys.length - 1];
      return [e[1], e[2]];
    };
  }

  var INK = '#141414', MUTED = '#6a6a6a', SOFT = '#e3e3e1', DIM = '#d4d4d2', PAPER = '#fafafa', CARD = '#f4f4f2', NIGHT = '#161616';
  var LINE = 'rgba(20,20,20,.12)', ERR = '#b3261e';
  var SANS = 'Inter Tight, system-ui, sans-serif', SERIF = 'Georgia, "Times New Roman", serif', MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  /* ================= data ================= */
  var DATA = [[42, 48, 45, 60, 58, 72, 80], [30, 44, 52, 49, 66, 70, 88], [50, 46, 58, 55, 64, 78, 74]];
  var VALUE = [48210, 52940, 50375], DELTA = ['+12.4%', '+18.1%', '+9.6%'];
  var SPARK = [9, 12, 10, 14, 13, 16, 11, 15, 17, 14, 18, 16, 12, 15, 17, 19];   // uptime bars, one every 1.5 s, 24 s around
  var ACTIVE = [1284, 1291, 1288, 1302, 1297, 1310, 1306, 1299, 1315, 1321, 1318, 1309, 1296, 1290, 1287, 1283];
  function arr(d) { return '[' + d.join(', ') + ']'; }

  var CH = { x: 224, y: 116, w: 152, h: 62 };              // chart area inside the dark card
  function px(i) { return CH.x + i * CH.w / 6; }
  function py(v) { return CH.y + CH.h - (v - 20) / 80 * CH.h; }
  function smoothPath(pts) {                               // a smooth curve through the points (Catmull-Rom as cubic Béziers)
    if (pts.length < 2) return '';
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
        (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  /* ================= the scene ================= */
  var defs = el('defs', {});
  var grad = el('linearGradient', { id: 'ha-fill', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#fafafa', 'stop-opacity': 0.22 }, grad);
  el('stop', { offset: 1, 'stop-color': '#fafafa', 'stop-opacity': 0 }, grad);
  var dots = el('pattern', { id: 'ha-dots', width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, defs);
  el('circle', { cx: 1, cy: 1, r: 0.55, fill: '#dcdcda' }, dots);
  var fade = el('linearGradient', { id: 'ha-fade', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 1 }, fade);
  el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': 0 }, fade);
  var mask = el('mask', { id: 'ha-mask' }, defs);
  el('rect', { x: 20, y: 44, width: 380, height: 150, fill: 'url(#ha-fade)' }, mask);
  var sparkClip = el('clipPath', { id: 'ha-spark' }, defs);
  el('rect', { x: 8, y: 30, width: 92, height: 30 }, sparkClip);

  /* ---------- the browser ---------- */
  var browser = el('g', {});
  el('rect', { x: 20, y: 20, width: 380, height: 260, rx: 12, fill: PAPER, stroke: LINE, 'stroke-width': 1.2 }, browser);
  var siteDots = el('rect', { x: 20, y: 44, width: 380, height: 150, fill: 'url(#ha-dots)', mask: 'url(#ha-mask)' }, browser);
  [34, 44, 54].forEach(function (x) { el('circle', { cx: x, cy: 32, r: 2.5, fill: DIM }, browser); });
  el('rect', { x: 140, y: 26, width: 140, height: 12, rx: 6, fill: '#ececea' }, browser);
  el('path', { d: 'M187 31.2v-1.3a2 2 0 0 1 4 0v1.3M186.2 31.2h5.6v3.6h-5.6z', fill: 'none', stroke: MUTED, 'stroke-width': 0.8, 'stroke-linejoin': 'round' }, browser);
  txt('yourbrand.com', { x: 194, y: 34.4, 'font-size': 6.5, fill: MUTED, 'font-family': SANS }, browser);
  el('path', { d: 'M20 44h380', stroke: LINE, 'stroke-width': 1.2 }, browser);
  var loadBar = el('rect', { x: 20, y: 43.2, height: 1.6, fill: INK }, browser);

  // the site's own navigation, part of the template from the start
  el('rect', { x: 34, y: 54, width: 10, height: 10, rx: 3, fill: INK }, browser);
  el('path', { d: 'M37 61.5l4-5', stroke: PAPER, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, browser);
  txt('Lumen', { x: 48.5, y: 62, 'font-size': 8, 'font-weight': 600, 'letter-spacing': -0.2, fill: INK, 'font-family': SANS }, browser);
  [['Product', 226], ['Pricing', 256], ['Docs', 285]].forEach(function (n) { txt(n[0], { x: n[1], y: 62, 'font-size': 6.3, fill: MUTED, 'font-family': SANS }, browser); });
  txt('Sign in', { x: 312, y: 62, 'font-size': 6.3, fill: INK, 'font-family': SANS }, browser);
  el('rect', { x: 340, y: 53.5, width: 46, height: 13, rx: 6.5, fill: INK }, browser);
  txt('Get started', { x: 363, y: 62, 'font-size': 5.9, 'font-weight': 500, 'text-anchor': 'middle', fill: PAPER, 'font-family': SANS }, browser);

  /* ---------- hero text ---------- */
  var H1U = 'Know your numbers in real time';
  var SUBU = 'Live dashboards your whole team understands, set up in minutes.';
  var h1u = txt('', { x: 210, y: 100, 'font-size': 13, 'letter-spacing': 0.6, 'text-anchor': 'middle', fill: '#333', 'font-family': SERIF }, browser);
  var subu = txt('', { x: 210, y: 112, 'font-size': 6.2, 'text-anchor': 'middle', fill: '#555', 'font-family': SERIF }, browser);
  var caretT = el('rect', { width: 1.1, height: 12, fill: INK }, browser);
  var h1g = el('g', {}, browser);
  var h1a = txt('Know your numbers.', { x: 34, y: 108, 'font-size': 18, 'font-weight': 600, 'letter-spacing': -0.65, fill: INK, 'font-family': SANS }, h1g);
  var h1b = txt('In real time.', { x: 34, y: 128, 'font-size': 18, 'font-weight': 600, 'letter-spacing': -0.65, fill: MUTED, 'font-family': SANS }, h1g);
  var subg = el('g', {}, browser);
  var sub1 = txt('Live dashboards your whole team understands,', { x: 34, y: 145, 'font-size': 6.6, fill: MUTED, 'font-family': SANS }, subg);
  var sub2 = txt('set up in minutes, not weeks.', { x: 34, y: 154, 'font-size': 6.6, fill: MUTED, 'font-family': SANS }, subg);

  var badge = el('g', {}, browser);                        // added by Code's CSS
  el('rect', { x: 0, y: 0, width: 88, height: 13, rx: 6.5, fill: '#ececea', stroke: LINE, 'stroke-width': 0.8 }, badge);
  el('rect', { x: 2, y: 2, width: 20, height: 9, rx: 4.5, fill: INK }, badge);
  txt('New', { x: 12, y: 8.6, 'font-size': 5.4, 'font-weight': 600, 'text-anchor': 'middle', fill: PAPER, 'font-family': SANS }, badge);
  txt('Live analytics', { x: 26, y: 8.9, 'font-size': 6, 'font-weight': 500, fill: INK, 'font-family': SANS }, badge);
  el('path', { d: 'M79 4.5l2.2 2-2.2 2', fill: 'none', stroke: MUTED, 'stroke-width': 0.9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, badge);

  /* ---------- buttons ---------- */
  var UB = [{ x: 158, y: 121, w: 46, h: 14, r: 0 }, { x: 210, y: 121, w: 54, h: 14, r: 0 }];
  var CB = [{ x: 34, y: 165, w: 60, h: 18, r: 9 }, { x: 100, y: 165, w: 66, h: 18, r: 9 }];
  var BTXT = ['Start free', 'Book a demo'];
  var btns = [0, 1].map(function (i) {
    var g = el('g', {}, browser), b = { g: g };
    b.rect = el('rect', { x: 0, y: 0 }, g);
    b.u = txt(BTXT[i], { 'font-size': 6, 'text-anchor': 'middle', fill: '#222', 'font-family': SERIF }, g);
    b.c = txt(BTXT[i], { 'font-size': 6.4, 'font-weight': 500, 'text-anchor': 'middle', fill: i ? INK : PAPER, 'font-family': SANS }, g);
    return b;
  });

  /* ---------- the chart card: a clip-art box first, then the team's dark card ---------- */
  var UBOX = { x: 40, y: 140, w: 130, h: 56, r: 0 }, CBOX = { x: 214, y: 74, w: 172, h: 116, r: 10 };
  var chart = el('g', {}, browser);
  var chartRect = el('rect', {}, chart);
  var chartU = el('g', {}, chart);                         // the clip-art
  var chartUTitle = txt('Revenue chart', { x: 0, y: 0, 'font-size': 6.5, fill: '#333', 'font-family': SERIF }, chartU);
  var ubars = [[0.55, '#bbb'], [0.8, '#999'], [0.4, '#ccc'], [0.95, '#777'], [0.7, '#aaa']].map(function (b) {
    return { h: b[0], el: el('rect', { fill: b[1], stroke: '#555', 'stroke-width': 0.8 }, chartU) };
  });
  var grid = el('g', {}, chart);
  [128, 148, 168].forEach(function (y) { el('path', { d: 'M' + CH.x + ' ' + y + 'H' + (CH.x + CH.w), stroke: '#2c2c2c', 'stroke-width': 0.6, 'stroke-dasharray': '1.5 2.5' }, grid); });
  var head = [];                                           // header pieces, pasted in by Design
  head.push(txt('Revenue', { x: 224, y: 89, 'font-size': 6, fill: '#8a8a88', 'font-family': SANS }, chart));
  var valueText = txt(money(VALUE[0]), { x: 224, y: 103, 'font-size': 11.5, 'font-weight': 600, 'letter-spacing': -0.3, fill: PAPER, 'font-family': SANS }, chart);
  head.push(valueText);
  var deltaG = el('g', {}, chart);
  el('rect', { x: 0, y: 0, width: 30, height: 10, rx: 5, fill: '#2a2a2a' }, deltaG);
  var deltaText = txt(DELTA[0], { x: 15, y: 6.9, 'font-size': 5.4, 'font-weight': 500, 'text-anchor': 'middle', fill: '#cfcfcd', 'font-family': SANS }, deltaG);
  head.push(deltaG);
  var tabs = el('g', {}, chart);
  el('rect', { x: 330, y: 82, width: 48, height: 11, rx: 4, fill: '#222' }, tabs);
  el('rect', { x: 331.5, y: 83.5, width: 14, height: 8, rx: 3, fill: '#3a3a3a' }, tabs);
  [['7D', 338.5], ['30D', 354], ['90D', 370]].forEach(function (n, i) { txt(n[0], { x: n[1], y: 89.6, 'font-size': 4.8, 'font-weight': 500, 'text-anchor': 'middle', fill: i ? '#7d7d7b' : PAPER, 'font-family': SANS }, tabs); });
  head.push(tabs);
  var area = el('path', { fill: 'url(#ha-fill)' }, chart);
  var lineP = el('path', { fill: 'none', stroke: PAPER, 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, chart);
  var rubber = el('path', { fill: 'none', stroke: '#9a9a98', 'stroke-width': 0.8 }, chart);
  var anchors = [0, 1, 2, 3, 4, 5, 6].map(function () { return el('rect', { width: 3.6, height: 3.6, fill: NIGHT, stroke: PAPER, 'stroke-width': 0.8 }, chart); });
  var handleG = el('g', {}, chart);
  var handleL = el('path', { stroke: '#9a9a98', 'stroke-width': 0.7 }, handleG);
  var handleA = el('circle', { r: 1.6, fill: PAPER }, handleG), handleB = el('circle', { r: 1.6, fill: PAPER }, handleG);
  var tipG = el('g', {}, chart);                           // the hover readout
  var tipLine = el('path', { stroke: '#3a3a3a', 'stroke-width': 0.8 }, tipG);
  var tipDot = el('circle', { r: 2.4, fill: PAPER, stroke: NIGHT, 'stroke-width': 1.2 }, tipG);
  var tipPill = el('rect', { height: 11, rx: 5.5, fill: PAPER }, tipG);
  var tipTxt = txt('', { 'font-size': 5.6, 'font-weight': 600, 'text-anchor': 'middle', fill: INK, 'font-family': SANS }, tipG);

  /* ---------- the three cards ---------- */
  var UC = [{ x: 30, y: 206, w: 96, h: 50, r: 0 }, { x: 140, y: 214, w: 120, h: 44, r: 0 }, { x: 276, y: 200, w: 100, h: 62, r: 0 }];
  function CC(i) { var w = (352 - 24) / 3; return { x: 34 + i * (w + 12), y: 204, w: w, h: 64, r: 10 }; }
  var cards = [0, 1, 2].map(function (i) {
    var g = el('g', {}, browser), c = { g: g };
    c.hard = el('rect', { x: 3, y: 3, fill: '#cfcfcd' }, g);
    c.lift = el('rect', { x: 1, y: 3, rx: 10, fill: 'rgba(20,20,20,.07)' }, g);
    c.rect = el('rect', { x: 0, y: 0, fill: CARD }, g);
    c.u = el('g', {}, g);
    txt(['UPTIME', 'USERS', 'SPEED'][i], { x: 8, y: 14, 'font-size': 6, 'letter-spacing': 1, fill: '#444', 'font-family': SERIF }, c.u);
    el('rect', { x: 8, y: 22, width: [60, 80, 50][i], height: 8, fill: '#bbb', stroke: '#777', 'stroke-width': 0.7 }, c.u);
    c.c = el('g', {}, g);
    txt(['Uptime', 'Active now', 'Latency'][i], { x: 10, y: 15, 'font-size': 5.8, fill: MUTED, 'font-family': SANS }, c.c);
    c.val = txt('', { x: 10, y: 30, 'font-size': 10, 'font-weight': 600, 'letter-spacing': -0.25, fill: INK, 'font-family': SANS }, c.c);
    return c;
  });
  cards[0].val.textContent = '99.98%';
  var sparkG = el('g', { 'clip-path': 'url(#ha-spark)' }, cards[0].c);
  var sparks = []; for (var s = 0; s < 16; s++) sparks.push(el('rect', { width: 3.8, rx: 1, fill: INK }, sparkG));
  var liveRing = el('circle', { cx: 46, cy: 13, r: 2, fill: 'none', stroke: INK, 'stroke-width': 0.7 }, cards[1].c);
  el('circle', { cx: 46, cy: 13, r: 1.6, fill: INK }, cards[1].c);
  [0, 1, 2, 3].forEach(function (i) { el('circle', { cx: 15 + i * 8, cy: 47, r: 5, fill: ['#bdbdbb', '#9a9a98', '#d4d4d2', '#6a6a6a'][i], stroke: CARD, 'stroke-width': 1.4 }, cards[1].c); });
  txt('+12', { x: 50, y: 49.2, 'font-size': 5.6, fill: MUTED, 'font-family': SANS }, cards[1].c);
  el('path', { d: 'M70 46a14 14 0 0 1 28 0', fill: 'none', stroke: SOFT, 'stroke-width': 4, 'stroke-linecap': 'round' }, cards[2].c);
  var gauge = el('path', { fill: 'none', stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round' }, cards[2].c);

  /* ---------- the code editor ---------- */
  var editor = el('g', {});
  el('rect', { x: 420, y: 20, width: 260, height: 150, rx: 12, fill: '#1c1c1c' }, editor);
  [434, 444, 454].forEach(function (x) { el('circle', { cx: x, cy: 32, r: 2.5, fill: '#3a3a3a' }, editor); });
  el('rect', { x: 470, y: 25, width: 52, height: 14, rx: 4, fill: '#262626' }, editor);
  txt('index.html', { x: 496, y: 34.5, 'font-size': 6.2, fill: '#d2d2d0', 'text-anchor': 'middle', 'font-family': SANS }, editor);
  txt('chart.js', { x: 546, y: 34.5, 'font-size': 6.2, fill: '#6d6d6b', 'text-anchor': 'middle', 'font-family': SANS }, editor);
  var saved = el('circle', { cx: 517, cy: 32, r: 1.8, fill: '#8a8a88' }, editor);   // unsaved changes
  var CX = 446;
  var hl = el('rect', { height: 9.5, rx: 2, fill: '#3d3d3b' }, editor);
  var C = { w: '#fafafa', g: '#7d7d7b', m: '#a9a9a7', s: '#d2d2d0' };
  var CODE = [
    [['<', 'g'], ['section', 'w'], [' class', 'm'], ['=', 'g'], ['"hero"', 's'], ['>', 'g']],
    [['  <', 'g'], ['span', 'w'], [' class', 'm'], ['=', 'g'], ['"badge"', 's'], ['>', 'g'], ['New', 's'], ['</', 'g'], ['span', 'w'], ['>', 'g']],
    [['  <', 'g'], ['h1', 'w'], ['>', 'g'], ['Know your numbers.', 's'], ['</', 'g'], ['h1', 'w'], ['>', 'g']],
    [['  <', 'g'], ['a', 'w'], [' class', 'm'], ['=', 'g'], ['"btn"', 's'], ['>', 'g'], ['Start free', 's'], ['</', 'g'], ['a', 'w'], ['>', 'g']],
    [['</', 'g'], ['section', 'w'], ['>', 'g']],
    [['const', 'm'], [' data', 'w'], [' = ', 'g'], [arr(DATA[0]), 's'], [';', 'g']],
    [['.hero', 'w'], [' { ', 'g'], ['display', 'm'], [': ', 'g'], ['grid', 's'], ['; }', 'g']],
    [['.btn', 'w'], [' { ', 'g'], ['border-radius', 'm'], [': ', 'g'], ['99px', 's'], ['; }', 'g']],
    [['.badge', 'w'], [' { ', 'g'], ['display', 'm'], [': ', 'g'], ['flex', 's'], ['; }', 'g']]
  ];
  var lines = CODE.map(function (parts, i) {
    txt(String(i + 1), { x: 438, y: 54 + i * 13, 'font-size': 6.3, 'font-family': MONO, fill: '#4a4a48', 'text-anchor': 'end' }, editor);
    var t = el('text', { x: CX, y: 54 + i * 13, 'font-size': 7.2, 'font-family': MONO, style: 'white-space:pre' }, editor);
    var len = 0;
    var spans = parts.map(function (p) { var s = el('tspan', { fill: C[p[1]] }, t); len += p[0].length; return { el: s, str: p[0] }; });
    return { el: t, spans: spans, len: len };
  });
  function setChars(line, n) {
    var left = Math.round(n);
    line.spans.forEach(function (s) { var k = clamp(left, 0, s.str.length); s.el.textContent = s.str.slice(0, k); left -= k; });
  }
  function setToken(line, i, str) { var s = lines[line].spans[i]; lines[line].len += str.length - s.str.length; s.str = str; }
  var CHW = 0;
  function chw() {
    if (CHW) return CHW;
    var w = width(lines[0].el);
    if (w > 0 && lines[0].el.textContent.length === lines[0].len) CHW = w / lines[0].len;
    return CHW || 4.32;
  }
  var YOU_CODE = lines.slice(0, 7).reduce(function (a, l) { return a + l.len; }, 0);
  var squig = [3, 6].map(function (i) {
    var y = 57 + i * 13, d = 'M' + CX + ' ' + y;
    for (var x = CX; x < CX + 110; x += 4) d += ' q1 -2 2 0 t2 0';
    return el('path', { d: d, fill: 'none', stroke: ERR, 'stroke-width': 0.8 }, editor);
  });
  var caretC = el('rect', { width: 1.1, height: 9, fill: PAPER }, editor);

  /* ---------- the deploy panel ---------- */
  var deploy = el('g', {});
  el('rect', { x: 420, y: 184, width: 260, height: 96, rx: 12, fill: PAPER, stroke: LINE, 'stroke-width': 1.2 }, deploy);
  txt('Deploy', { x: 434, y: 202, 'font-size': 7.6, 'font-weight': 600, fill: INK, 'font-family': SANS }, deploy);
  el('rect', { x: 466, y: 194.5, width: 26, height: 11, rx: 5.5, fill: '#ececea' }, deploy);
  el('path', { d: 'M471 197.5v5M471 199.5a2.4 2.4 0 0 0 4.8 0', fill: 'none', stroke: MUTED, 'stroke-width': 0.7 }, deploy);
  txt('main', { x: 478.5, y: 202.1, 'font-size': 5.4, fill: MUTED, 'font-family': MONO }, deploy);
  var stDot = el('circle', { cx: 503, cy: 200, r: 2.4 }, deploy);
  var stTxt = txt('', { x: 508, y: 202.2, 'font-size': 6.2, 'font-family': SANS }, deploy);
  var depBtn = el('rect', { x: 624, y: 192, width: 44, height: 15, rx: 7.5, fill: INK }, deploy);
  txt('Deploy', { x: 646, y: 201.8, 'font-size': 6.2, 'font-weight': 500, 'text-anchor': 'middle', fill: PAPER, 'font-family': SANS }, deploy);
  var STEPS = ['Installing dependencies', 'Building pages', 'Optimizing images', 'Deploying to the edge'], STEP_T = ['0.6s', '1.1s', '0.4s', '0.3s'];
  var steps = STEPS.map(function (name, i) {
    var y = 219 + i * 10, g = el('g', {}, deploy);
    var spin = el('path', { d: 'M0 -2.6a2.6 2.6 0 1 1 -2.6 2.6', fill: 'none', stroke: MUTED, 'stroke-width': 0.9, 'stroke-linecap': 'round' }, g);
    var ok = el('path', { d: 'M-2.2 0.2l1.5 1.5 3-3.2', fill: 'none', stroke: INK, 'stroke-width': 1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    var no = el('path', { d: 'M-2 -2l4 4M2 -2l-4 4', fill: 'none', stroke: ERR, 'stroke-width': 1, 'stroke-linecap': 'round' }, g);
    var label = txt(name, { x: 444, y: y + 2.1, 'font-size': 6, 'font-family': MONO }, deploy);
    var time = txt('', { x: 666, y: y + 2.1, 'font-size': 5.8, 'text-anchor': 'end', fill: MUTED, 'font-family': MONO }, deploy);
    tf(g, 437, y);
    return { g: g, spin: spin, ok: ok, no: no, label: label, time: time };
  });
  el('rect', { x: 434, y: 258, width: 232, height: 2, rx: 1, fill: '#e6e6e4' }, deploy);
  var prog = el('rect', { x: 434, y: 258, height: 2, rx: 1 }, deploy);
  var readyL = txt('', { x: 434, y: 271, 'font-size': 6, 'font-family': MONO, fill: INK }, deploy);
  var readyR = txt('', { x: 666, y: 271, 'font-size': 6, 'text-anchor': 'end', 'font-family': MONO, fill: MUTED }, deploy);

  /* ---------- the tools: selection, size label, guides, measurements, marquee, toolbar, inspector, key presses ---------- */
  var tools = el('g', {});
  var sel = el('g', {}, tools);
  var selRect = el('rect', { fill: 'none', stroke: INK, 'stroke-width': 0.9 }, sel);
  var handles = [0, 1, 2, 3].map(function () { return el('rect', { width: 4.4, height: 4.4, fill: PAPER, stroke: INK, 'stroke-width': 0.9 }, sel); });
  var size = el('g', {}, tools);
  var sizeRect = el('rect', { height: 11, rx: 3.5, fill: INK }, size);
  var sizeTxt = txt('', { y: 7.7, 'font-size': 5.8, 'font-weight': 500, 'text-anchor': 'middle', fill: PAPER, 'font-family': SANS }, size);
  var guides = [0, 1, 2].map(function () { return el('path', { stroke: INK, 'stroke-width': 0.7, 'stroke-dasharray': '2.5 2.5' }, tools); });
  var reds = [0, 1, 2, 3].map(function () {
    var g = el('g', {}, tools);
    return { g: g, line: el('path', { stroke: INK, 'stroke-width': 0.8 }, g), pill: el('rect', { height: 9, rx: 3, fill: INK }, g), t: txt('', { 'font-size': 5.4, 'font-weight': 600, 'text-anchor': 'middle', fill: PAPER, 'font-family': SANS }, g) };
  });
  var marquee = el('rect', { fill: 'rgba(20,20,20,.04)', stroke: INK, 'stroke-width': 0.7 }, tools);
  var toolbar = el('g', {}, tools);
  var tbRect = el('rect', { x: 0, y: 0, width: 58, height: 14, rx: 7, fill: INK }, toolbar);
  el('path', { d: 'M8 4.5h2.4v2.4H8zM11.6 4.5H14v2.4h-2.4zM8 8.1h2.4v2.4H8zM11.6 8.1H14v2.4h-2.4z', fill: PAPER }, toolbar);
  txt('Tidy up', { x: 18, y: 9.3, 'font-size': 6, 'font-weight': 500, fill: PAPER, 'font-family': SANS }, toolbar);

  var insp = el('g', {}, tools);                           // the inspector: text settings, or fill
  el('rect', { x: 0, y: 0, width: 92, height: 60, rx: 8, fill: PAPER, stroke: 'rgba(20,20,20,.16)', 'stroke-width': 1 }, insp);
  txt('Text', { x: 8, y: 12, 'font-size': 6.2, 'font-weight': 600, fill: INK, 'font-family': SANS }, insp);
  txt('Font', { x: 8, y: 27, 'font-size': 5.6, fill: MUTED, 'font-family': SANS }, insp);
  el('rect', { x: 28, y: 19.5, width: 58, height: 11, rx: 3, fill: '#efefed' }, insp);
  var fontName = txt('', { x: 32, y: 27, 'font-size': 5.6, fill: INK, 'font-family': SANS }, insp);
  el('path', { d: 'M80 24l2 2 2-2', fill: 'none', stroke: MUTED, 'stroke-width': 0.8, 'stroke-linecap': 'round' }, insp);
  txt('Align', { x: 8, y: 47, 'font-size': 5.6, fill: MUTED, 'font-family': SANS }, insp);
  var alignBg = el('rect', { y: 40, width: 12, height: 10, rx: 2.5, fill: '#e3e3e1' }, insp);
  [[30, 'M3 3h6M3 5h4M3 7h6'], [44, 'M3 3h6M4 5h4M3 7h6'], [58, 'M3 3h6M5 5h4M3 7h6']].forEach(function (a) { el('path', { d: a[1], transform: 'translate(' + a[0] + ' 40)', stroke: INK, 'stroke-width': 0.8, 'stroke-linecap': 'round' }, insp); });
  var drop = el('g', {}, insp);                            // the font list
  el('rect', { x: 28, y: 31.5, width: 58, height: 24, rx: 3, fill: PAPER, stroke: 'rgba(20,20,20,.16)', 'stroke-width': 0.8 }, drop);
  var dropHi = el('rect', { x: 30, y: 44.5, width: 54, height: 9, rx: 2, fill: '#ececea' }, drop);
  txt('Times New Roman', { x: 32, y: 40.6, 'font-size': 5.4, fill: INK, 'font-family': SERIF }, drop);
  txt('Inter Tight', { x: 32, y: 51, 'font-size': 5.4, fill: INK, 'font-family': SANS }, drop);
  var fillP = el('g', {}, tools);
  el('rect', { x: 0, y: 0, width: 84, height: 30, rx: 8, fill: PAPER, stroke: 'rgba(20,20,20,.16)', 'stroke-width': 1 }, fillP);
  txt('Fill', { x: 8, y: 11, 'font-size': 6.2, 'font-weight': 600, fill: INK, 'font-family': SANS }, fillP);
  var FILLS = [NIGHT, '#6a6a6a', '#bdbdbb', '#e3e3e1', '#ffffff'];
  FILLS.forEach(function (f, i) { el('circle', { cx: 12 + i * 15, cy: 20, r: 4.5, fill: f, stroke: i > 2 ? DIM : 'none', 'stroke-width': 0.8 }, fillP); });
  var fillRing = el('circle', { cx: 12, cy: 20, r: 6.3, fill: 'none', stroke: INK, 'stroke-width': 0.8 }, fillP);
  var key = el('g', {}, tools);
  var keyRect = el('rect', { x: 0, y: 0, height: 12, rx: 3, fill: PAPER, stroke: 'rgba(20,20,20,.3)', 'stroke-width': 0.8 }, key);
  var keyTxt = txt('', { y: 8.2, 'font-size': 6, 'font-weight': 600, 'text-anchor': 'middle', fill: INK, 'font-family': SANS }, key);

  /* ---------- messages, reactions, click rings ---------- */
  var TOASTS = ['Build failed: 2 errors', 'Client: can the logo be bigger?', 'Mobile layout is broken', 'Deadline is today'];
  var toasts = TOASTS.map(function (m) {
    var g = el('g', {});
    el('rect', { x: 0, y: 0, width: 150, height: 20, rx: 6, fill: PAPER, stroke: 'rgba(20,20,20,.16)', 'stroke-width': 1 }, g);
    el('circle', { cx: 10, cy: 10, r: 2.6, fill: ERR }, g);
    txt(m, { x: 18, y: 12.6, 'font-size': 6.8, fill: INK, 'font-family': SANS }, g);
    el('path', { d: 'M139 7l6 6M145 7l-6 6', stroke: MUTED, 'stroke-width': 1, 'stroke-linecap': 'round' }, g);
    return g;
  });
  var THUMB = 'M1.5 5.5h2v5.5h-2zM3.5 10.5h4.9c.55 0 1-.38 1.1-.92l.6-3.1c.12-.62-.35-1.18-.98-1.18H6.6l.35-1.9c.1-.55-.32-1.06-.88-1.06L3.5 5.6';
  var react = el('g', {});
  el('circle', { cx: 0, cy: 0, r: 10, fill: PAPER, stroke: 'rgba(20,20,20,.16)', 'stroke-width': 1 }, react);
  var reactThumb = el('path', { d: THUMB, transform: 'translate(-6.6 -6.4) scale(1.1)', fill: 'none', stroke: INK, 'stroke-width': 1.1, 'stroke-linejoin': 'round' }, react);
  var reactCheck = el('path', { d: 'M-4.5 0.3l3 3 6-6.5', fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, react);
  var rings = [0, 1, 2, 3, 4, 5].map(function () { return el('circle', { r: 0, fill: 'none', stroke: INK, 'stroke-width': 1 }); });

  /* ---------- cursors: their name tags open into chat bubbles ---------- */
  function cursor(label, fill, color) {
    var g = el('g', {});
    var tag = el('g', { transform: 'translate(10 15)' }, g);
    var r = el('rect', { x: 0, y: 0, height: 13, rx: 4, fill: fill, stroke: fill === PAPER ? 'rgba(20,20,20,.2)' : 'none', 'stroke-width': 1 }, tag);
    var t = txt(label, { x: 6, y: 9.2, 'font-size': 7.2, 'font-weight': 600, fill: color, 'font-family': SANS }, tag);
    var m = txt('', { x: 7, y: 11.2, 'font-size': 7.4, 'font-weight': 500, fill: color, 'font-family': SANS }, tag);
    var arrow = el('g', {}, g);
    el('path', { d: 'M0 0V15.5L4.1 11.7 6.9 18.1 9.7 16.9 7 10.6H12z', fill: fill === PAPER ? INK : fill, stroke: PAPER, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, arrow);
    return { g: g, arrow: arrow, rect: r, text: t, msg: m, label: label, lw: label.length * 4.4 };
  }
  var CUR = { you: cursor('You', PAPER, INK), design: cursor('Design', INK, PAPER), code: cursor('Code', '#4a4a48', PAPER), launch: cursor('Launch', '#7a7a78', PAPER) };
  function sizeTags() { Object.keys(CUR).forEach(function (k) { var w = width(CUR[k].text); if (w) CUR[k].lw = w; }); }
  sizeTags();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { sizeTags(); CHW = 0; draw(clock); });

  /* ================= the state of one moment ================= */
  var REST = { you: [648, 292], design: [192, 140], code: [620, 140], launch: [598, 212] };
  function base() {                                        // the finished site, everyone at rest
    return {
      h1u: 0, subu: 0, caretT: null, kFont: 1, kAlign: 1, slip: 0, kBadge: 1,
      btnU: 1, kBtn: 1, btnSlip: 0, btnHover: [0, 0],
      chartBox: CBOX, chartO: 1, chartTilt: 0, barsO: 0, kDark: 1, headO: [1, 1, 1, 1], gridO: 1,
      data: DATA[0].slice(), pen: 7, rubber: null, handle: null, anchorsO: 0, gradK: 1, value: VALUE[0], delta: DELTA[0], tip: null,
      cardsO: [1, 1, 1], kTidy: 1, jumble: [0, 0, 0], lift: [0, 0, 0], live: 0,
      code: 1e4, line7: 1e4, line8: 1e4, dataText: arr(DATA[0]), hl: null, caret: null, squig: [0, 0], unsaved: 0,
      status: 'ready', steps: [2, 2, 2, 2], prog: 1, ready: 1, pressed: false, load: 0,
      sel: null, size: null, guides: [], reds: [], marquee: null, toolbar: null, insp: null, fillP: null, key: null,
      toasts: [], clicks: [], react: null, chat: {},
      cur: { you: { p: REST.you, r: -12, o: 1 }, design: { p: REST.design, o: 1 }, code: { p: REST.code, o: 1 }, launch: { p: REST.launch, o: 1 } },
      pageO: 1
    };
  }
  function chat(text, t, a, b) {
    if (t <= a || t >= b) return null;
    return { text: text, n: Math.round(text.length * seg(t, a + 0.1, a + 0.1 + text.length * 0.035)), k: smooth(seg(t, a, a + 0.2)) * (1 - smooth(seg(t, b - 0.25, b))) };
  }
  function keyAt(S, label, t, at, p) { if (t > at && t < at + 0.55) S.key = { text: label, x: p[0] + 14, y: p[1] - 14, o: pulse(t, at, at + 0.55) }; }
  function clicksOf(S, list, t) { list.forEach(function (c) { if (t > c[0] && t < c[0] + 0.45) { var p = c[1](c[0]); S.clicks.push([p[0], p[1], t - c[0]]); } }); }
  function pressOf(list, t) { return list.some(function (c) { return t > c[0] && t < c[0] + 0.12; }); }
  // a deploy that starts at a: the four steps in turn, the bar, and done
  var DEP = [0.6, 1.1, 0.4, 0.3];
  function runDeploy(S, t, a, fail) {
    if (t < a) return;
    var at = a;
    S.status = 'building'; S.ready = 0;
    for (var i = 0; i < 4; i++) {
      var d = fail && i === 1 ? 0.35 : DEP[i] * (fail ? 0.6 : 1);
      if (t < at) S.steps[i] = 0; else if (t < at + d) S.steps[i] = 1; else S.steps[i] = 2;
      if (fail && i === 1 && t >= at + d) { S.steps[i] = 3; S.steps[2] = 0; S.steps[3] = 0; S.status = 'failed'; S.prog = 0.45; return; }
      at += d;
    }
    S.prog = seg(t, a, at);
    if (t >= at) { S.status = 'ready'; S.ready = smooth(seg(t, at, at + 0.2)); }
    return at;
  }

  /* ---------------- the intro ---------------- */
  var INTRO_END = 14.5;
  var PEN = DATA[0].map(function (v, i) { return [px(i), py(v)]; });
  var YOU = track([
    [0, 730, 330], [0.5, 730, 330], [0.85, 210, 93], [0.9, 210, 93], [1.8, 250, 104], [1.9, 210, 110], [2.45, 236, 118],
    [2.6, 210, 128], [2.75, 210, 128], [2.85, 40, 140], [3.3, 170, 196], [3.45, 105, 168], [3.6, 210, 232], [3.75, 210, 232],
    [3.95, 446, 56], [4.2, 520, 80], [4.5, 560, 100], [4.8, 520, 120], [5.1, 590, 132], [5.35, 560, 138],
    [5.55, 646, 199], [5.65, 646, 199], [6.25, 378, 62], [6.45, 100, 232], [6.65, 560, 110], [6.85, 646, 199], [7.0, 378, 86],
    [7.15, 96, 168], [7.3, 470, 95], [8.0, 300, 215], [8.2, 300, 215]
  ]);
  var YOU_CLK = [[0.88, YOU], [1.88, YOU], [2.85, YOU], [3.3, YOU], [3.95, YOU], [5.6, YOU], [6.25, YOU], [6.45, YOU], [6.65, YOU], [6.85, YOU], [7.0, YOU], [7.15, YOU], [7.3, YOU]];
  var LAUNCH_I = track([[8.8, 760, 330], [9.25, 378, 62], [9.3, 378, 62], [9.5, 380, 61], [9.7, 378, 62], [9.9, 379, 63], [10.4, 598, 212], [12.1, 598, 212], [12.35, 646, 199], [12.42, 646, 199], [12.9, 598, 212]]);
  var CODE_I = track([[8.8, 760, 90], [9.2, 306, 283], [9.27, 306, 283], [9.85, 644, 290], [10.05, 486, 96], [10.4, 486, 96], [10.5, 500, 135], [10.8, 500, 135],
    [10.88, 446, 148], [11.55, 560, 152], [11.6, 560, 152], [11.92, 446, 161], [12.45, 540, 164], [12.5, 540, 164], [12.95, 620, 140]]);
  var DESIGN_I = track([
    [8.8, 330, -40], [9.05, 210, 96], [9.12, 210, 96], [9.3, 322, 96], [9.35, 322, 96], [9.5, 322, 117], [9.58, 322, 117],
    [9.8, 312, 115], [9.85, 312, 115], [10.3, 46, 146], [10.35, 46, 146], [10.7, 220, 80], [10.78, 344, 130], [10.82, 344, 130], [11.1, 386, 190],
    [11.2, 128, 152], [11.27, 128, 152], [11.42, 300, 160], [11.5, 228, 88], [11.62, PEN[0][0], PEN[0][1]],
    [11.72, PEN[1][0], PEN[1][1]], [11.82, PEN[2][0], PEN[2][1]], [11.92, PEN[3][0], PEN[3][1]], [12.02, PEN[4][0], PEN[4][1]],
    [12.12, PEN[5][0], PEN[5][1]], [12.22, PEN[6][0], PEN[6][1]], [12.3, 300, 117], [12.33, 300, 117], [12.48, 300, 178],
    [12.55, 26, 199], [12.58, 26, 199], [12.78, 394, 274], [12.88, 214, 192], [12.93, 214, 192], [13.4, 192, 140]
  ]);
  var PEN_T = [11.62, 11.72, 11.82, 11.92, 12.02, 12.12, 12.22];
  var TEAM_CLK = [[9.3, LAUNCH_I], [9.5, LAUNCH_I], [9.7, LAUNCH_I], [9.9, LAUNCH_I], [12.4, LAUNCH_I],
    [9.27, CODE_I], [10.1, CODE_I], [10.16, CODE_I], [10.55, CODE_I], [10.61, CODE_I], [10.9, CODE_I], [11.94, CODE_I],
    [9.12, DESIGN_I], [9.35, DESIGN_I], [9.58, DESIGN_I], [9.85, DESIGN_I], [10.35, DESIGN_I], [10.82, DESIGN_I], [11.27, DESIGN_I], [12.33, DESIGN_I], [12.58, DESIGN_I], [12.93, DESIGN_I]]
    .concat(PEN_T.map(function (t) { return [t, DESIGN_I]; }));
  var T_IN = [6.15, 6.4, 6.65, 6.9], T_OUT = [9.3, 9.5, 9.7, 9.9];

  function introState(t) {
    var S = base();
    var y = YOU(t), dz = DESIGN_I(t), cz = CODE_I(t), lz = LAUNCH_I(t);

    /* --- You builds it --- */
    S.h1u = Math.round(H1U.length * seg(t, 0.95, 1.75));
    S.subu = Math.round(SUBU.length * seg(t, 1.95, 2.45));
    if (t > 0.88 && t < 1.85) S.caretT = { line: 'h1', o: Math.floor(t * 5) % 2 ? 0.25 : 1 };
    else if (t > 1.88 && t < 2.55) S.caretT = { line: 'sub', o: Math.floor(t * 5) % 2 ? 0.25 : 1 };
    keyAt(S, '⌘V', t, 2.62, [210, 128]);
    S.btnU = t > 2.7 ? smooth(seg(t, 2.7, 2.82)) : 0;
    // the box: drawn with the rectangle tool, then the clip-art pasted into it
    if (t < 2.85) S.chartO = 0;
    else if (t < 3.3) { S.chartBox = { x: 40, y: 140, w: Math.max(1, y[0] - 40), h: Math.max(1, y[1] - 140), r: 0 }; S.size = { x: y[0], y: y[1] + 20, text: Math.round(y[0] - 40) + ' × ' + Math.round(y[1] - 140) }; }
    else S.chartBox = UBOX;
    if (t > 2.85 && t < 3.45) S.sel = { b: S.chartBox, o: 1 - seg(t, 3.3, 3.45) };
    keyAt(S, '⌘V', t, 3.42, [105, 168]);
    S.barsO = t > 3.48 ? smooth(seg(t, 3.48, 3.6)) : 0;
    keyAt(S, '⌘V', t, 3.7, [210, 232]);
    S.cardsO = [0, 1, 2].map(function (i) { return smooth(seg(t, 3.76 + i * 0.05, 3.88 + i * 0.05)); });
    S.code = Math.round(YOU_CODE * seg(t, 4.0, 5.4));
    S.line7 = 0; S.line8 = 0;
    if (t > 3.98 && t < 5.45) S.caret = { auto: true, o: Math.floor(t * 5) % 2 ? 0.3 : 1 };
    S.unsaved = t > 4.0 && t < 5.6 ? 1 : 0;
    S.kFont = 0; S.kAlign = 0; S.kBadge = 0; S.kBtn = 0; S.kDark = 0; S.headO = [0, 0, 0, 0]; S.gridO = 0; S.pen = 0; S.gradK = 0; S.kTidy = 0; S.live = 0;
    S.status = 'idle'; S.steps = [0, 0, 0, 0]; S.prog = 0; S.ready = 0;

    /* --- it fails and slips apart --- */
    runDeploy(S, t, 5.6, true);
    S.squig = [t > 6.15 && t < 10.18 ? 1 : 0, t > 6.15 && t < 10.63 ? 1 : 0];
    var slip = smooth(seg(t, 6.3, 6.6));
    S.slip = slip * (1 - seg(t, 9.12, 9.3));
    S.chartTilt = slip * (1 - seg(t, 10.35, 10.5));
    S.btnSlip = slip * (1 - smooth(seg(t, 11.62, 11.9)));
    S.toasts = T_IN.map(function (a, i) {
      var shake = (i === 0 && t > 6.25 && t < 6.55) || (i === 1 && t > 7.0 && t < 7.3) ? Math.sin(t * 60) * 2 : 0;
      return { o: smooth(seg(t, a, a + 0.2)), out: smooth(seg(t, T_OUT[i], T_OUT[i] + 0.25)), shake: shake };
    });

    /* --- Design: headline in the inspector --- */
    if (t > 9.12 && t < 10.3) S.sel = { b: { x: 110, y: 88, w: 200, h: 16 }, o: seg(t, 9.12, 9.2) * (1 - seg(t, 10.1, 10.3)) };
    if (t > 9.15 && t < 10.3) S.insp = { x: 318, y: 74, o: seg(t, 9.15, 9.28) * (1 - seg(t, 10.12, 10.3)), open: t > 9.37 && t < 9.62, hi: t > 9.45, font: t > 9.58 ? 'Inter Tight' : 'Times New Roman', align: t > 9.85 ? 0 : 1 };
    S.kFont = smooth(seg(t, 9.6, 9.85));
    S.kAlign = inOut(seg(t, 9.88, 10.2));
    /* --- the chart box: moved, resized, filled, cleared, header pasted, line drawn with the pen, gradient --- */
    if (t > 10.35 && t < 10.7) S.chartBox = { x: dz[0] - 6, y: dz[1] - 6, w: 130, h: 56, r: 0 };
    else if (t >= 10.7 && t < 10.82) S.chartBox = { x: 214, y: 74, w: 130, h: 56, r: 0 };
    else if (t >= 10.82 && t < 11.1) S.chartBox = { x: 214, y: 74, w: dz[0] - 214, h: dz[1] - 74, r: mix(0, 10, seg(t, 10.82, 11.1)) };
    else if (t >= 11.1) S.chartBox = CBOX;
    if (t > 10.35 && t < 11.3) S.sel = { b: S.chartBox, o: 1 - seg(t, 11.15, 11.3) };
    if (t > 10.82 && t < 11.15) S.size = { x: dz[0], y: dz[1] + 20, text: Math.round(S.chartBox.w) + ' × ' + Math.round(S.chartBox.h) };
    if (t > 10.55 && t < 11.0) S.guides = [['M214 50V276', pulse(t, 10.55, 11.0)], ['M24 74H396', pulse(t, 10.55, 11.0)]];
    if (t > 11.12 && t < 11.45) S.fillP = { x: 116, y: 136, o: seg(t, 11.12, 11.2) * (1 - seg(t, 11.36, 11.45)), picked: t > 11.27 };
    S.kDark = smooth(seg(t, 11.27, 11.4));
    keyAt(S, 'Del', t, 11.38, [300, 160]);
    S.barsO *= 1 - seg(t, 11.42, 11.48);
    keyAt(S, '⌘V', t, 11.46, [228, 88]);
    S.headO = [0, 1, 2, 3].map(function (i) { return smooth(seg(t, 11.5 + i * 0.04, 11.6 + i * 0.04)); });
    S.gridO = S.kDark;
    keyAt(S, 'P', t, 11.55, [228, 100]);
    S.pen = PEN_T.filter(function (p) { return t >= p; }).length;
    if (t > 11.62 && t < 12.26 && S.pen < 7) S.rubber = [PEN[S.pen - 1], dz];
    if (t > 11.62 && t < 12.3) S.anchorsO = 1 - seg(t, 12.24, 12.3);
    [2, 4].forEach(function (i) { if (t > PEN_T[i] && t < PEN_T[i] + 0.1) S.handle = { p: PEN[i], k: smooth(seg(t, PEN_T[i], PEN_T[i] + 0.07)) }; });
    S.gradK = t > 12.33 ? clamp((dz[1] - 117) / 61, 0, 1) : 0;
    if (t > 12.33 && t < 12.55) S.guides = [['M300 117V' + dz[1].toFixed(1), 1]];
    /* --- the cards: marquee, Tidy up --- */
    if (t > 12.58 && t < 12.95) S.marquee = { x: 26, y: 199, w: dz[0] - 26, h: dz[1] - 199, o: 1 - seg(t, 12.88, 12.95) };
    if (t > 12.8 && t < 13.15) S.toolbar = { x: 185, y: 186, o: seg(t, 12.8, 12.86) * (1 - seg(t, 13.05, 13.15)), pressed: t > 12.93 && t < 13.03 };
    S.kTidy = inOut(seg(t, 12.95, 13.2));
    S.jumble = [0, 1, 2].map(function (i) { return smooth(seg(t, 6.35 + i * 0.05, 6.5 + i * 0.05)) * (1 - S.kTidy); });
    S.live = S.kTidy;
    if (t > 13.0 && t < 13.55) S.reds = [0, 1].map(function (i) { var a = CC(i), b = CC(i + 1), m = pulse(t, 13.0, 13.55); return { x1: a.x + a.w, y1: 236, x2: b.x, y2: 236, label: '12', o: m }; });

    /* --- Code: fixes, CSS, save --- */
    if (t > 10.1 && t < 10.36) S.hl = { line: 3, from: 9, to: 14 };
    if (t > 10.55 && t < 10.8) S.hl = { line: 6, from: 2, to: 9 };
    S.line7 = Math.round(lines[7].len * seg(t, 10.95, 11.5));
    S.line8 = Math.round(lines[8].len * seg(t, 11.98, 12.4));
    if (t > 10.9 && t < 11.56) S.caret = { line: 7, o: Math.floor(t * 5) % 2 ? 0.3 : 1 };
    if (t > 11.94 && t < 12.46) S.caret = { line: 8, o: Math.floor(t * 5) % 2 ? 0.3 : 1 };
    S.unsaved = (t > 10.1 && t < 11.58) || (t > 11.95 && t < 12.48) ? 1 : S.unsaved;
    keyAt(S, '⌘S', t, 11.56, cz);
    keyAt(S, '⌘S', t, 12.47, cz);
    S.kBtn = smooth(seg(t, 11.62, 11.9));
    S.kBadge = smooth(seg(t, 12.52, 12.75));
    S.load = Math.max(t > 11.56 && t < 11.95 ? seg(t, 11.56, 11.9) : 0, t > 12.47 && t < 12.85 ? seg(t, 12.47, 12.8) : 0);

    /* --- Launch: deploy for real --- */
    var end = t > 12.4 ? runDeploy(S, t, 12.4, false) : 0;
    if (t > 9.9 && t < 12.4) { S.status = 'failed'; S.steps = [2, 3, 0, 0]; S.prog = 0.45; }
    if (end && t > end) { S.load = Math.max(S.load, seg(t, end, end + 0.4) * (t < end + 0.45 ? 1 : 0)); S.value = mix(0, VALUE[0], inOut(seg(t, end + 0.05, end + 0.7))); }
    else S.value = 0;
    S.pressed = pressOf([[5.6], [6.85], [12.4]], t);

    /* --- "You": tired, falls, picked up by Code, rests, thumbs up --- */
    var yx = y[0], yy = y[1], yr = 0;
    var tired = seg(t, 7.35, 8.2);
    if (tired > 0 && t < 8.2) { yx += Math.sin(t * 9) * 2.5 * tired; yy += Math.sin(t * 6.3) * 1.8 * tired; }
    var sag = smooth(seg(t, 7.95, 8.2)); yr = 14 * sag; yy += 4 * sag;
    if (t > 8.2) {
      var f = seg(t, 8.2, 8.6);
      yy += f * f * 66; yx += f * 10; yr = 14 + 76 * smooth(f);
      if (t > 8.6) yy -= Math.sin(seg(t, 8.6, 8.8) * Math.PI) * 6;
    }
    if (t > 9.27) {
      var cc = CODE_I(Math.min(t, 9.85)), lift = smooth(seg(t, 9.27, 9.6));
      yx = mix(yx, cc[0] + 4, lift); yy = mix(yy, cc[1] + 2, lift); yr = mix(90, -12, lift);
    }
    S.cur.you = { p: [yx, yy], r: yr, o: smooth(seg(t, 0.45, 0.6)) };
    S.chat.you = chat('Why is this broken?', t, 7.15, 8.05);
    var teamO = smooth(seg(t, 8.8, 9.05));
    S.cur.design = { p: dz, o: teamO };
    S.cur.code = { p: cz, o: teamO };
    S.cur.launch = { p: lz, o: teamO };
    S.chat.design = chat('We’ve got it', t, 8.85, 9.65);
    if (t > 13.6) S.react = { x: 666, y: 280 - 16 * seg(t, 13.6, 14.4), o: pulse(t, 13.6, 14.4), kind: 'thumb', s: 0.7 + 0.3 * smooth(seg(t, 13.6, 13.85)) };

    clicksOf(S, YOU_CLK, t); clicksOf(S, TEAM_CLK, t);
    S.press = { you: pressOf(YOU_CLK, t), design: pressOf(TEAM_CLK.filter(function (c) { return c[1] === DESIGN_I; }), t), code: pressOf(TEAM_CLK.filter(function (c) { return c[1] === CODE_I; }), t), launch: pressOf(TEAM_CLK.filter(function (c) { return c[1] === LAUNCH_I; }), t) };
    S.pageO = smooth(seg(t, 0, 0.5));
    return S;
  }

  /* ---------------- the loop: three rounds of real changes ---------------- */
  var ROUND = 8, LOOP = 3 * ROUND;
  var ARR_COL = 13;                                        // where "[" starts on the data line
  function loopKeys(fn) {                                  // a track for all three rounds from per-round points
    var keys = [];
    for (var c = 0; c < 3; c++) fn(c).forEach(function (k) { keys.push([k[0] + c * ROUND, k[1], k[2]]); });
    return track(keys);
  }
  var DESIGN_L = loopKeys(function (c) {
    var r = REST.design;
    if (c === 0) return [[0, r[0], r[1]], [0.7, 118, 117], [2.2, 118, 117], [2.6, 200, 236], [3.4, 200, 236], [3.9, r[0], r[1]], [8, r[0], r[1]]];
    if (c === 1) return [[0, r[0], r[1]], [0.7, 66, 174], [1.5, 66, 174], [1.9, 300, 140], [3.3, 300, 140], [3.7, r[0], r[1]], [8, r[0], r[1]]];
    return [[0, r[0], r[1]], [0.7, 90, 238], [1.3, 90, 238], [1.6, 210, 238], [1.95, 210, 238], [2.1, 330, 238], [2.4, 330, 238], [2.9, r[0], r[1]], [8, r[0], r[1]]];
  });
  var CODE_L = loopKeys(function () {
    var r = REST.code, a = [CX + (ARR_COL + 1) * 4.32, 119];
    return [[0, r[0], r[1]], [1.6, r[0], r[1]], [1.9, a[0], a[1]], [3.75, a[0] + 110, a[1]], [3.8, a[0] + 110, a[1]], [4.3, r[0], r[1]], [8, r[0], r[1]]];
  });
  var LAUNCH_L = loopKeys(function () {
    var r = REST.launch;
    return [[0, r[0], r[1]], [3.6, r[0], r[1]], [3.95, 646, 199], [4.0, 646, 199], [4.5, r[0], r[1]], [8, r[0], r[1]]];
  });
  var YOU_L = loopKeys(function (c) {
    var r = REST.you;
    if (c === 0) return [[0, r[0], r[1]], [0.9, 262, 150], [1.5, 300, 138], [2.1, 351, 128], [2.6, 351, 128], [3.3, r[0], r[1]], [8, r[0], r[1]]];
    if (c === 1) return [[0, r[0], r[1]], [1.0, 76, 90], [2.9, 76, 90], [3.6, r[0], r[1]], [8, r[0], r[1]]];
    return [[0, r[0], r[1]], [8, r[0], r[1]]];
  });
  var LOOP_CLK = [];
  for (var lc = 0; lc < 3; lc++) {
    LOOP_CLK.push([lc * ROUND + 1.95, CODE_L], [lc * ROUND + 2.02, CODE_L], [lc * ROUND + 4.0, LAUNCH_L]);
    if (lc === 1) LOOP_CLK.push([lc * ROUND + 2.0, DESIGN_L]);
  }

  function loopState(u) {
    var S = base(), c = Math.floor(u / ROUND) % 3, v = u - c * ROUND;
    var from = DATA[c], to = DATA[(c + 1) % 3];
    S.cur.design = { p: DESIGN_L(u), o: 1 }; S.cur.code = { p: CODE_L(u), o: 1 }; S.cur.launch = { p: LAUNCH_L(u), o: 1 };
    var y = YOU_L(u), rest = clamp(1 - Math.hypot(y[0] - REST.you[0], y[1] - REST.you[1]) / 40, 0, 1);
    S.cur.you = { p: y, r: -12 * rest, o: 1 };

    // Code: select the array, type the new numbers (each point follows its number), save
    var typed = arr(to), a = 2.2, b = 3.6, start = 1.95;
    var n = Math.round(typed.length * seg(v, a, b));
    S.dataText = v < a ? arr(from) : typed.slice(0, n);
    if (v > start && v < a) S.hl = { line: 5, from: ARR_COL, to: ARR_COL + arr(from).length };
    if (v >= a && v < 3.85) S.caret = { line: 5, o: Math.floor(v * 5) % 2 ? 0.3 : 1 };
    S.unsaved = v > a && v < 3.82 ? 1 : 0;
    keyAt(S, '⌘S', v, 3.8, S.cur.code.p);
    S.data = from.map(function (fv, i) {
      var pos = 1;                                         // where this number ends in the typed text for (var k = 0; k < i; k++) pos += String(to[k]).length + 2;
      var tc = a + (pos + String(to[i]).length) / typed.length * (b - a);
      return mix(fv, to[i], smooth(seg(v, tc, tc + 0.3)));
    });

    // Launch: deploy; the page reloads and the total counts to the new number
    var end = runDeploy(S, v, 4.0, false) || 0;
    if (v < 4.0) { S.status = 'ready'; S.steps = [2, 2, 2, 2]; S.prog = 1; S.ready = 1; }
    S.pressed = v > 4.0 && v < 4.12;
    if (end && v > end) S.load = v < end + 0.45 ? seg(v, end, end + 0.4) : 0;
    S.value = end && v > end ? mix(VALUE[c], VALUE[(c + 1) % 3], inOut(seg(v, end + 0.05, end + 0.8))) : VALUE[c];
    S.delta = end && v > end + 0.05 ? DELTA[(c + 1) % 3] : DELTA[c];

    // Design: spacing, hover states, sizes
    var d = S.cur.design.p;
    if (c === 0) {
      keyAt(S, 'Alt', v, 0.75, d);
      var m1 = seg(v, 0.8, 0.95) * (1 - seg(v, 2.05, 2.2));
      if (m1 > 0) S.reds = [{ x1: 60, y1: 89, x2: 60, y2: 95, label: '6', o: m1 }, { x1: 60, y1: 130, x2: 60, y2: 139, label: '9', o: m1 }, { x1: 60, y1: 156, x2: 60, y2: 165, label: '9', o: m1 }];
      var m2 = seg(v, 2.6, 2.75) * (1 - seg(v, 3.25, 3.4));
      if (m2 > 0) S.reds = [0, 1].map(function (i) { var A = CC(i), B = CC(i + 1); return { x1: A.x + A.w, y1: 236, x2: B.x, y2: 236, label: '12', o: m2 }; });
      if (v > 0.7 && v < 2.2) S.sel = { b: { x: 34, y: 94, w: 150, h: 38 }, o: seg(v, 0.7, 0.8) * (1 - seg(v, 2.05, 2.2)), thin: true };
    } else if (c === 1) {
      S.btnHover[0] = smooth(seg(v, 0.7, 0.85)) * (1 - smooth(seg(v, 1.5, 1.7)));
      if (v > 2.0 && v < 3.3) {
        S.sel = { b: CBOX, o: seg(v, 2.0, 2.1) * (1 - seg(v, 3.15, 3.3)) };
        S.size = { x: CBOX.x + CBOX.w / 2, y: CBOX.y + CBOX.h + 9, text: '172 × 116', o: seg(v, 2.0, 2.1) * (1 - seg(v, 3.15, 3.3)) };
        var m3 = seg(v, 2.2, 2.35) * (1 - seg(v, 3.1, 3.25));
        S.reds = [{ x1: 214, y1: 96, x2: 224, y2: 96, label: '10', o: m3 }, { x1: 376, y1: 150, x2: 386, y2: 150, label: '10', o: m3 }];
      }
    } else {
      S.lift = [smooth(seg(v, 0.7, 0.85)) * (1 - smooth(seg(v, 1.3, 1.45))), smooth(seg(v, 1.6, 1.75)) * (1 - smooth(seg(v, 1.95, 2.1))), smooth(seg(v, 2.05, 2.2)) * (1 - smooth(seg(v, 2.35, 2.55)))];
    }

    // the client
    if (c === 0) {
      if (v > 0.9 && v < 2.7) S.tip = { x: y[0], o: seg(v, 0.9, 1.0) * (1 - seg(v, 2.6, 2.7)) };
      S.chat.you = chat('Can we see this week?', v, 1.5, 3.2);
      if (v > 6.9 && v < 8.0) S.react = { x: REST.you[0] + 18, y: REST.you[1] - 12 - 14 * seg(v, 6.9, 8.0), o: pulse(v, 6.9, 8.0), kind: 'thumb', s: 0.7 + 0.3 * smooth(seg(v, 6.9, 7.15)) };
    } else if (c === 1) {
      S.chat.you = chat('The badge is a nice touch', v, 1.2, 3.0);
      S.chat.design = chat('Thanks!', v, 2.3, 3.2);
    } else {
      if (v > 6.9 && v < 8.0) S.react = { x: REST.you[0] + 18, y: REST.you[1] - 12 - 14 * seg(v, 6.9, 8.0), o: pulse(v, 6.9, 8.0), kind: 'check', s: 0.7 + 0.3 * smooth(seg(v, 6.9, 7.15)) };
    }

    S.live = 1;
    clicksOf(S, LOOP_CLK, u);
    S.press = { code: pressOf(LOOP_CLK.filter(function (k) { return k[1] === CODE_L; }), u), launch: pressOf(LOOP_CLK.filter(function (k) { return k[1] === LAUNCH_L; }), u), design: pressOf(LOOP_CLK.filter(function (k) { return k[1] === DESIGN_L; }), u) };
    return S;
  }

  /* ================= drawing one state ================= */
  function render(S, liveT) {
    op(browser, S.pageO); op(editor, S.pageO); op(deploy, S.pageO);

    /* hero text: serif centred while You types it; the brand font, then aligned left once Design sets it */
    h1u.textContent = H1U.slice(0, S.h1u); subu.textContent = SUBU.slice(0, S.subu);
    var fu = 1 - S.kFont;
    tf(h1u, 0, S.slip * 9, 1, S.slip * 2.5); op(h1u, fu);
    tf(subu, 0, S.slip * 11, 1, S.slip * 2); op(subu, fu);
    var wa = width(h1a), wb = width(h1b), ws1 = width(sub1), ws2 = width(sub2), ca = 1 - S.kAlign;
    tf(h1a, ca * (210 - 34 - wa / 2), -6 * ca); tf(h1b, ca * (210 - 34 - wb / 2), -6 * ca);
    tf(sub1, ca * (210 - 34 - ws1 / 2), -8 * ca); tf(sub2, ca * (210 - 34 - ws2 / 2), -8 * ca);
    op(h1g, S.kFont); op(subg, S.kFont);
    if (S.caretT) {
      var ct = S.caretT.line === 'h1' ? h1u : subu;
      set(caretT, { x: 210 + width(ct) / 2 + 1.5, y: S.caretT.line === 'h1' ? 90 : 106.5, height: S.caretT.line === 'h1' ? 12 : 7 }); op(caretT, S.caretT.o);
    } else op(caretT, 0);
    tf(badge, 34 + (1 - S.kBadge) * -6, 77); op(badge, S.kBadge);

    /* buttons */
    btns.forEach(function (b, i) {
      var k = inOut(S.kBtn), g = box(UB[i], CB[i], k), hov = S.btnHover[i];
      tf(b.g, g.x, g.y + S.btnSlip * 12 - hov * 1, 1, S.btnSlip * (i ? 3 : -3));
      op(b.g, S.btnU);
      set(b.rect, { width: g.w, height: g.h, rx: g.r, fill: i ? grey(184, 250, k) : (hov ? '#2e2e2e' : grey(184, 20, k)) });
      b.rect.setAttribute('stroke', i ? 'rgba(20,20,20,' + mix(0.45, 0.16, k).toFixed(2) + ')' : 'rgba(20,20,20,' + (0.45 * (1 - k)).toFixed(2) + ')');
      set(b.u, { x: g.w / 2, y: g.h / 2 + 2.2 }); op(b.u, 1 - k);
      set(b.c, { x: g.w / 2, y: g.h / 2 + 2.3 }); op(b.c, k);
    });

    /* the chart card */
    var cb = S.chartBox, kd = S.kDark;
    tf(chart, S.chartTilt * 6, S.chartTilt * 4, 1, 0);
    chart.setAttribute('transform', 'translate(' + (S.chartTilt * 6).toFixed(2) + ' ' + (S.chartTilt * 4).toFixed(2) + ') rotate(' + (S.chartTilt * 4).toFixed(2) + ' ' + (cb.x + cb.w / 2).toFixed(1) + ' ' + (cb.y + cb.h / 2).toFixed(1) + ')');
    op(chart, S.chartO);
    set(chartRect, { x: cb.x, y: cb.y, width: Math.max(0, cb.w), height: Math.max(0, cb.h), rx: cb.r, fill: grey(255, 22, kd) });
    chartRect.setAttribute('stroke', 'rgba(20,20,20,' + (0.4 * (1 - kd)).toFixed(2) + ')');
    op(chartU, S.barsO);
    set(chartUTitle, { x: cb.x + 6, y: cb.y + 10 });
    ubars.forEach(function (b, i) { var bw = (cb.w - 24) / 5 - 4, bh = (cb.h - 20) * b.h; set(b.el, { x: cb.x + 12 + i * (bw + 4), y: cb.y + cb.h - 5 - bh, width: Math.max(0, bw), height: Math.max(0, bh) }); });
    op(grid, S.gridO);
    head.forEach(function (h, i) { op(h, S.headO[i]); });
    tf(deltaG, 268 + 0, 95.5);
    valueText.textContent = money(S.value);
    deltaText.textContent = S.delta;
    var pts = S.data.map(function (v, i) { return [px(i), py(v)]; });
    var shown = S.pen >= 7 ? pts : PEN.slice(0, S.pen);
    var dLine = smoothPath(shown);
    lineP.setAttribute('d', dLine || 'M0 0');
    op(lineP, shown.length > 1 ? 1 : 0);
    area.setAttribute('d', S.pen >= 7 ? dLine + ' L' + px(6) + ' ' + (CH.y + CH.h) + ' L' + px(0) + ' ' + (CH.y + CH.h) + 'Z' : 'M0 0');
    op(area, S.gradK);
    if (S.rubber) { rubber.setAttribute('d', 'M' + S.rubber[0][0].toFixed(1) + ' ' + S.rubber[0][1].toFixed(1) + 'L' + S.rubber[1][0].toFixed(1) + ' ' + S.rubber[1][1].toFixed(1)); op(rubber, 1); } else op(rubber, 0);
    anchors.forEach(function (a, i) { set(a, { x: PEN[i][0] - 1.8, y: PEN[i][1] - 1.8 }); op(a, i < S.pen ? S.anchorsO : 0); });
    if (S.handle) {
      var hp = S.handle.p, hk = S.handle.k * 9;
      handleL.setAttribute('d', 'M' + (hp[0] - hk).toFixed(1) + ' ' + (hp[1] + hk * 0.35).toFixed(1) + 'L' + (hp[0] + hk).toFixed(1) + ' ' + (hp[1] - hk * 0.35).toFixed(1));
      set(handleA, { cx: hp[0] - hk, cy: hp[1] + hk * 0.35 }); set(handleB, { cx: hp[0] + hk, cy: hp[1] - hk * 0.35 }); op(handleG, 1);
    } else op(handleG, 0);
    if (S.tip && S.tip.o > 0) {                            // the client's hover: the nearest point, read out
      var ti = clamp(Math.round((S.tip.x - CH.x) / (CH.w / 6)), 0, 6), tp = pts[ti], label = '$' + (S.data[ti] * 0.6).toFixed(1) + 'k';
      tipLine.setAttribute('d', 'M' + tp[0].toFixed(1) + ' ' + CH.y + 'V' + (CH.y + CH.h));
      set(tipDot, { cx: tp[0], cy: tp[1] });
      var tw = label.length * 3.4 + 8;
      set(tipPill, { x: tp[0] - tw / 2, y: tp[1] - 17, width: tw }); set(tipTxt, { x: tp[0], y: tp[1] - 9.8 }); tipTxt.textContent = label;
      op(tipG, S.tip.o);
    } else op(tipG, 0);

    /* the cards */
    cards.forEach(function (c, i) {
      var k = S.kTidy, g = box(UC[i], CC(i), k), j = [[6, -5, -5], [-4, 9, 4], [9, 3, 6]][i], jm = S.jumble[i], lift = S.lift[i];
      set(c.rect, { width: g.w, height: g.h, rx: g.r });
      c.rect.setAttribute('stroke', 'rgba(20,20,20,' + mix(0.45, 0.1, k).toFixed(2) + ')');
      c.rect.setAttribute('stroke-width', mix(1.6, 1, k).toFixed(2));
      set(c.hard, { width: g.w, height: g.h }); op(c.hard, 1 - k);
      set(c.lift, { width: g.w, height: g.h }); op(c.lift, lift);
      op(c.u, 1 - k); op(c.c, k);
      var sc = 0.94 + 0.06 * S.cardsO[i];
      c.g.setAttribute('transform', 'translate(' + (g.x + j[0] * jm + g.w / 2 * (1 - sc)).toFixed(2) + ' ' + (g.y + j[1] * jm + g.h / 2 * (1 - sc) - 2.5 * lift).toFixed(2) + ') rotate(' + (j[2] * jm).toFixed(2) + ' ' + (g.w / 2).toFixed(1) + ' ' + (g.h / 2).toFixed(1) + ') scale(' + sc.toFixed(3) + ')');
      op(c.g, S.cardsO[i]);
    });
    // live data: a new uptime bar every 1.5 s, the active count ticking, latency moving a little
    var lt = ((liveT % LOOP) + LOOP) % LOOP, off = lt / 1.5, base0 = Math.floor(off), frac = off - base0;
    sparks.forEach(function (r, i) {
      var h = SPARK[(base0 + i) % 16];
      set(r, { x: 10 + (i - frac) * 6, y: 56 - h, height: h });
      op(r, i === 15 ? frac : (i === 0 ? 1 - frac : 1));
    });
    cards[1].val.textContent = ACTIVE[base0 % 16].toLocaleString('en-US');
    set(liveRing, { r: 2 + (lt * 1.2 % 1) * 4 }); op(liveRing, 0.7 * (1 - (lt * 1.2 % 1)));
    var lat = Math.round(84 + 6 * Math.sin(lt / LOOP * Math.PI * 4)), ang = Math.PI * (1 - clamp(lat / 140, 0, 1));
    cards[2].val.textContent = lat + ' ms';
    gauge.setAttribute('d', 'M70 46A14 14 0 0 1 ' + (84 + 14 * Math.cos(ang)).toFixed(2) + ' ' + (46 - 14 * Math.sin(ang)).toFixed(2));

    /* the code */
    setToken(5, 3, S.dataText);
    var left = S.code;
    for (var i = 0; i < 7; i++) { var n = clamp(left, 0, lines[i].len); setChars(lines[i], n); left -= n; }
    setChars(lines[7], S.line7); setChars(lines[8], S.line8);
    var w1 = chw();
    if (S.hl) { set(hl, { x: CX + S.hl.from * w1 - 0.8, y: 47 + S.hl.line * 13, width: (S.hl.to - S.hl.from) * w1 + 1.6 }); op(hl, 1); } else op(hl, 0);
    op(squig[0], S.squig[0]); op(squig[1], S.squig[1]);
    if (S.caret) {
      var li = S.caret.line;
      if (S.caret.auto) { var acc = 0; for (li = 0; li < 6; li++) { acc += lines[li].len; if (S.code < acc) break; } }
      set(caretC, { x: CX + width(lines[li].el) + 0.8, y: 47 + li * 13 }); op(caretC, S.caret.o);
    } else op(caretC, 0);
    op(saved, S.unsaved);

    /* the deploy panel */
    var st = { idle: ['Idle', DIM, MUTED], building: ['Building', MUTED, MUTED], failed: ['Failed', ERR, ERR], ready: ['Ready', INK, INK] }[S.status];
    stTxt.textContent = st[0]; stDot.setAttribute('fill', st[1]); stTxt.setAttribute('fill', st[2]);
    if (S.status === 'building') op(stDot, Math.floor(liveT * 4) % 2 ? 0.35 : 1); else op(stDot, 1);
    depBtn.setAttribute('fill', S.pressed ? '#3a3a3a' : INK);
    steps.forEach(function (s, i) {
      var k = S.steps[i];
      op(s.spin, k === 1 ? 1 : 0); op(s.ok, k === 2 ? 1 : 0); op(s.no, k === 3 ? 1 : 0);
      if (k === 1) s.spin.setAttribute('transform', 'rotate(' + ((liveT * 540) % 360).toFixed(1) + ')');
      s.label.setAttribute('fill', k === 0 ? '#b5b5b3' : k === 3 ? ERR : INK);
      s.time.textContent = k === 2 ? STEP_T[i] : k === 3 ? 'error' : '';
      s.time.setAttribute('fill', k === 3 ? ERR : MUTED);
    });
    set(prog, { width: 232 * S.prog, fill: S.status === 'failed' ? ERR : INK });
    readyL.textContent = S.ready ? '● yourbrand.com' : (S.status === 'failed' ? '2 errors in index.html' : '');
    readyL.setAttribute('fill', S.status === 'failed' ? ERR : INK);
    readyR.textContent = S.ready ? 'Ready in 2.4s' : '';
    op(readyL, S.ready || (S.status === 'failed' ? 1 : 0)); op(readyR, S.ready);
    set(loadBar, { width: 380 * S.load }); op(loadBar, S.load > 0 && S.load < 1 ? 1 : 0);

    /* tools */
    if (S.sel && S.sel.o > 0) {
      var b = S.sel.b; op(sel, S.sel.o);
      set(selRect, { x: b.x, y: b.y, width: Math.max(0, b.w), height: Math.max(0, b.h) });
      [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (q, i) { set(handles[i], { x: b.x + q[0] * b.w - 2.2, y: b.y + q[1] * b.h - 2.2 }); op(handles[i], S.sel.thin ? 0 : 1); });
    } else op(sel, 0);
    if (S.size) {
      sizeTxt.textContent = S.size.text; var sw = S.size.text.length * 3.3 + 8;
      set(sizeRect, { x: -sw / 2, width: sw }); tf(size, S.size.x, S.size.y); op(size, S.size.o == null ? 1 : S.size.o);
    } else op(size, 0);
    guides.forEach(function (g, i) { var q = S.guides[i]; if (q) { g.setAttribute('d', q[0]); op(g, q[1] * 0.7); } else op(g, 0); });
    reds.forEach(function (r, i) {
      var q = S.reds[i];
      if (!q) { op(r.g, 0); return; }
      var vert = q.x1 === q.x2;
      r.line.setAttribute('d', vert ? 'M' + (q.x1 - 2) + ' ' + q.y1 + 'h4M' + q.x1 + ' ' + q.y1 + 'V' + q.y2 + 'M' + (q.x1 - 2) + ' ' + q.y2 + 'h4'
        : 'M' + q.x1 + ' ' + (q.y1 - 2) + 'v4M' + q.x1 + ' ' + q.y1 + 'H' + q.x2 + 'M' + q.x2 + ' ' + (q.y1 - 2) + 'v4');
      var mx = vert ? q.x1 + 9 : (q.x1 + q.x2) / 2, my = vert ? (q.y1 + q.y2) / 2 : q.y1 - 8;
      r.t.textContent = q.label; var pw = q.label.length * 3.4 + 6;
      set(r.pill, { x: mx - pw / 2, y: my - 4.5, width: pw }); set(r.t, { x: mx, y: my + 2 });
      op(r.g, q.o);
    });
    if (S.marquee) { set(marquee, { x: S.marquee.x, y: S.marquee.y, width: Math.max(0, S.marquee.w), height: Math.max(0, S.marquee.h) }); op(marquee, S.marquee.o); } else op(marquee, 0);
    if (S.toolbar) { tf(toolbar, S.toolbar.x, S.toolbar.y); op(toolbar, S.toolbar.o); tbRect.setAttribute('fill', S.toolbar.pressed ? '#3a3a3a' : INK); } else op(toolbar, 0);
    if (S.insp) {
      tf(insp, S.insp.x, S.insp.y); op(insp, S.insp.o);
      fontName.textContent = S.insp.font; fontName.setAttribute('font-family', S.insp.font === 'Inter Tight' ? SANS : SERIF);
      op(drop, S.insp.open ? 1 : 0); op(dropHi, S.insp.hi ? 1 : 0);
      alignBg.setAttribute('x', S.insp.align ? 42 : 28);
    } else op(insp, 0);
    if (S.fillP) { tf(fillP, S.fillP.x, S.fillP.y); op(fillP, S.fillP.o); op(fillRing, S.fillP.picked ? 1 : 0); } else op(fillP, 0);
    if (S.key) {
      keyTxt.textContent = S.key.text; var kw = Math.max(12, S.key.text.length * 4.4 + 6);
      set(keyRect, { width: kw }); set(keyTxt, { x: kw / 2 }); tf(key, S.key.x, S.key.y - 3 * (1 - S.key.o)); op(key, S.key.o);
    } else op(key, 0);

    /* messages */
    var stack = 0;
    toasts.forEach(function (g, i) {
      var m = S.toasts[i];
      if (!m || m.o === 0) { op(g, 0); return; }
      tf(g, 236 + m.out * 40 + (m.shake || 0), 52 + stack * 24 - 6 * (1 - m.o));
      op(g, m.o * (1 - m.out)); stack += 1 - m.out;
    });
    if (S.react) { tf(react, S.react.x, S.react.y, S.react.s); op(react, S.react.o); op(reactThumb, S.react.kind === 'thumb' ? 1 : 0); op(reactCheck, S.react.kind === 'check' ? 1 : 0); }
    else op(react, 0);
    rings.forEach(function (r, i) {
      var c = S.clicks[i];
      if (!c) { op(r, 0); return; }
      set(r, { cx: c[0], cy: c[1], r: 2.5 + c[2] * 26 }); op(r, 0.45 * (1 - c[2] / 0.45));
    });

    /* cursors */
    ['you', 'design', 'code', 'launch'].forEach(function (k) {
      var c = CUR[k], s = S.cur[k], m = S.chat[k], pr = S.press && S.press[k];
      tf(c.g, s.p[0], s.p[1], 1, s.r || 0); op(c.g, s.o);
      c.arrow.setAttribute('transform', pr ? 'scale(.86)' : '');
      var kk = m ? m.k : 0;
      c.msg.textContent = m ? m.text.slice(0, m.n) : '';
      var mw = m ? width(c.msg) : 0;
      set(c.rect, { width: mix(c.lw + 12, Math.max(mw, 10) + 14, kk), height: mix(13, 16, kk), rx: mix(4, 8, kk) });
      op(c.text, 1 - kk); op(c.msg, kk);
    });
  }

  // drawing order: the browser and panels, tools over them, messages, then cursors on top
  [browser, editor, deploy, tools].forEach(function (g) { svg.appendChild(g); });
  toasts.forEach(function (g) { svg.appendChild(g); });
  svg.appendChild(react); rings.forEach(function (r) { svg.appendChild(r); });
  ['design', 'code', 'launch', 'you'].forEach(function (k) { svg.appendChild(CUR[k].g); });

  var loopMode = false, clock = 0;
  function draw(t) {
    clock = t;
    loopMode = t >= INTRO_END;
    render(loopMode ? loopState((t - INTRO_END) % LOOP) : introState(t), t - INTRO_END);
  }
  window.__heroArtAt = draw;

  /* ================= the intro: shown large in the middle of the hero, then moved into place ================= */
  var REVEAL = [[13.65, 'hi-title'], [14.1, 'hi-lead'], [14.3, 'hi-actions'], [14.5, 'hi-rest']];
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
    REVEAL.forEach(function (s) { root.classList.add(s[1]); });
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
    elapsedBase = INTRO_END; start = performance.now();
    draw(INTRO_END);
    reveal(true); endIntro();
  }
  function onInput(e) {
    if (e.type === 'keydown' && !/^(Escape|Enter| |ArrowDown|PageDown|End|Spacebar)$/.test(e.key)) return;
    skipIntro();
  }
  if (intro) {
    var wi = 0;
    (function wrap(node) {
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

  /* ================= the clock ================= */
  var start = 0, elapsedBase = intro ? 0 : INTRO_END, raf = 0, visible = true;
  draw(elapsedBase);
  if (reduced) return;
  function frame(now) {
    var t = elapsedBase + (now - start) / 1000;
    draw(t);
    if (intro && !revealed) {
      REVEAL.forEach(function (s) { if (t >= s[0]) root.classList.add(s[1]); });
      if (t >= 13.75) reveal(false);
    }
    if (intro && t >= 14.6) endIntro();
    raf = requestAnimationFrame(frame);
  }
  function run() { if (raf || !visible || document.hidden) return; start = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { if (!raf) return; cancelAnimationFrame(raf); raf = 0; elapsedBase = clock; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; if (visible) run(); else stop(); }).observe(art);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (intro && clock < INTRO_END) skipIntro(); stop(); } else run();
  });
  run();
})();
