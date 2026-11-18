/* ---------- Hero art: AI builds a store fast, our team makes it right ----------
   One SVG (.hero__art): a browser window with an online store, and a sales card next to it (under it on phones).
   Everything is a function of time, so any moment can be drawn (window.__heroArtAt(t), used for checking).
   The numbers on the sales card are an illustration, not results.

   Two Protosofts cursors work in it, and each only does things that make sense for its job:
     UI team (dark) edits the store: it drags the picture and the button into place, clicks the headline to change it,
       and checks its work with alignment guides and spacing labels.
     Sales team (light) reads: it scrubs the chart (a tooltip compares today with yesterday), looks at each new order,
       and watches the order count. It never clicks.
   Everything is in the site's own ink and greys. They talk in Figma-style cursor chat: the name tag grows into a message.
   They move like hands: a smooth start, a small overshoot and settle, a lean into fast moves, a trailing tag, and a slow
   wander while they wait.

   The intro (first visit in a session, or a reload, about 20 s):
      0.3  You ask an AI for a store. It builds a generic one in seconds: centred serif text, a grey square button,
           placeholder pictures, uneven cards. One small order arrives; today is far below yesterday.
      8.2  Sales reads the chart and says so. UI fixes the page piece by piece: picture, headline, button, cards.
           Orders start to come in, and today passes yesterday.
     18.9  The real headline: AI builds it fast. We make it right.
   Captions sit where the headline will be and rise in word by word.

   Then a calm loop of 18 s. UI drags a guide onto each margin and checks the spacing, then tries a new headline. Sales
   watches the orders slow down and says so, UI switches back, and orders pick up again.
   Revenue only changes when an order arrives: the row slides in, the total counts up, the chart steps up.
   With reduced motion it is one still frame. Skip, Escape or scrolling ends the intro. */
(function () {
  var art = document.querySelector('.hero__art');
  if (!art) return;
  var root = document.documentElement, col = art.parentNode;
  var title = col.querySelector('.hero__title'), actions = col.querySelector('.hero__actions');
  var intro = root.classList.contains('hero-intro') && !!title && !!actions;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!intro) root.classList.remove('hero-intro');
  clearTimeout(window.__introFallback);                         // this script runs the intro now (see the page's <head>)

  var INTRO_END = 20.2, LOOP = 18;

  /* ================= helpers ================= */
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  art.appendChild(svg);
  var narrow = window.matchMedia('(max-width: 640px)');

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  }
  function txt(str, attrs, parent) { var e = el('text', attrs, parent); e.textContent = str; return e; }
  function set(e, attrs) { for (var k in attrs) e.setAttribute(k, typeof attrs[k] === 'number' ? (+attrs[k]).toFixed(2) : attrs[k]); }
  function put(e, s) { if (e._s !== s) { e.textContent = s; e._s = s; } }          // set text only when it changes
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function smooth(x) { return x * x * (3 - 2 * x); }
  function inOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function mj(x) { return x * x * x * (10 + x * (6 * x - 15)); }                    // minimum-jerk: how a hand moves a mouse
  function sine(x) { return 0.5 - 0.5 * Math.cos(Math.PI * x); }
  function mix(a, b, k) { return a + (b - a) * k; }
  function tf(e, x, y, s) { e.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ')' + (s != null && s !== 1 ? ' scale(' + s.toFixed(3) + ')' : '')); }
  function op(e, v) { v = v <= 0.001 ? 0 : v >= 0.999 ? 1 : v; if (e._o !== v) { e.setAttribute('opacity', v.toFixed(3)); e._o = v; } }
  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  function blend(a, b, k) { var x = hex(a), y = hex(b); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(mix(x[i], y[i], k)); }).join(',') + ')'; }
  function ramp(t, a, b, c, d) { return smooth(seg(t, a, b)) * (1 - smooth(seg(t, c, d))); }   // in over a..b, out over c..d
  function textW(e, fallback) { var w = 0; try { w = e.getComputedTextLength(); } catch (err) { w = 0; } return w || fallback; }
  function windows(list, t) { var v = 0; for (var i = 0; i < list.length; i++) v = Math.max(v, ramp(t, list[i][0], list[i][0] + 0.25, list[i][1] - 0.25, list[i][1])); return v; }

  var SOFT = '#ececea', INK = '#141414', MUTED = '#6a6a6a', FAINT = '#9a9a98', EDGE = '#d9d9d7', FILL = '#efefed', HAIR = '#ececea', DASH = '#a9a9a7';
  var SANS = 'Inter Tight, system-ui, sans-serif', SERIF = 'Georgia, "Times New Roman", serif';
  var SPARK = 'M0 -5C.6 -1.6 1.6 -.6 5 0C1.6 .6 .6 1.6 0 5C-.6 1.6 -1.6 .6 -5 0C-1.6 -.6 -.6 -1.6 0 -5Z';

  /* ================= defs ================= */
  var defs = el('defs', {});
  function shadowFilter(id, a, b) {
    var f = el('filter', { id: id, x: '-30%', y: '-30%', width: '160%', height: '170%' }, defs);
    el('feDropShadow', { dx: 0, dy: a[0], stdDeviation: a[1], 'flood-color': '#000', 'flood-opacity': a[2] }, f);
    el('feDropShadow', { dx: 0, dy: b[0], stdDeviation: b[1], 'flood-color': '#000', 'flood-opacity': b[2] }, f);
  }
  shadowFilter('ha-sh', [8, 10, 0.07], [1, 1, 0.04]);          // window and card
  shadowFilter('ha-sm', [2, 3, 0.08], [0.5, 0.5, 0.06]);       // tooltips and the prompt
  shadowFilter('ha-cur', [1.2, 1.2, 0.22], [0, 0.3, 0.2]);     // cursors
  var winClip = el('clipPath', { id: 'ha-win' }, defs); el('rect', { x: 0.5, y: 0.5, width: 429, height: 279, rx: 14 }, winClip);
  var grad = el('linearGradient', { id: 'ha-fill', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': INK, 'stop-opacity': 0.08 }, grad);
  el('stop', { offset: 1, 'stop-color': INK, 'stop-opacity': 0 }, grad);
  var wipes = [0, 1, 2, 3].map(function (i) {                 // wipe-in clips: 0 is the hero picture, 1 to 3 the product pictures
    var c = el('clipPath', { id: 'ha-wipe' + i }, defs);
    return el('rect', { x: 0, y: -2, width: 0, height: 120 }, c);
  });
  var nClip = 0;
  function clipRect(attrs) { var id = 'ha-c' + (nClip++), c = el('clipPath', { id: id }, defs); return { r: el('rect', attrs, c), url: 'url(#' + id + ')' }; }
  function softFocus(e) {                                       // a soft-focus filter for one line of text; returns the blur node
    var n = defs.querySelectorAll('filter.hf').length, f = el('filter', { id: 'ha-bl' + n, class: 'hf', x: '-10%', y: '-40%', width: '120%', height: '180%' }, defs);
    var g = el('feGaussianBlur', { stdDeviation: 0 }, f); e._f = 'url(#ha-bl' + n + ')'; return g;
  }

  /* ================= the window ================= */
  var win = el('g', {});
  el('rect', { x: 0.5, y: 0.5, width: 429, height: 279, rx: 14, fill: '#fff', filter: 'url(#ha-sh)' }, win);
  var inner = el('g', { 'clip-path': 'url(#ha-win)' }, win);
  el('rect', { x: 0.5, y: 0.5, width: 429, height: 279, rx: 14, fill: '#fff' }, inner);
  el('path', { d: 'M0 28.5H430', stroke: HAIR, 'stroke-width': 1 }, inner);
  [14, 23, 32].forEach(function (x) { el('circle', { cx: x, cy: 14.5, r: 2.7, fill: '#e6e6e4' }, inner); });
  el('rect', { x: 152.5, y: 7.5, width: 125, height: 14, rx: 7, fill: '#f4f4f2' }, inner);
  el('path', { d: 'M180.4 13.2v-1a1.6 1.6 0 013.2 0v1M179.2 13.2h5.6v3.6h-5.6z', fill: 'none', stroke: MUTED, 'stroke-width': 0.8, 'stroke-linejoin': 'round' }, inner);
  txt('haven.shop', { x: 190, y: 17.2, 'font-size': 7, fill: MUTED, 'font-family': SANS }, inner);
  el('rect', { x: 0.5, y: 0.5, width: 429, height: 279, rx: 14, fill: 'none', stroke: EDGE }, win);

  /* The store, in its own coordinates (430 x 252, drawn 28 below the title bar). Side margins are 28, and every gap
     between blocks is 16: picture to cards, card to card. Left edges sit on x 28, right edges on x 402. */
  var page = el('g', { transform: 'translate(0 28)' }, inner);
  var PAGE_Y = 28;

  /* nav: the same in both versions. The bag's right edge is on 402, like the picture and the cards. */
  var navG = el('g', {}, page);
  txt('haven', { x: 28, y: 23, 'font-size': 10.5, 'font-weight': 700, 'letter-spacing': -0.3, fill: INK, 'font-family': SANS }, navG);
  txt('Shop', { x: 342, y: 22.4, 'text-anchor': 'end', 'font-size': 7.3, fill: MUTED, 'font-family': SANS }, navG);
  txt('About', { x: 377, y: 22.4, 'text-anchor': 'end', 'font-size': 7.3, fill: MUTED, 'font-family': SANS }, navG);
  el('path', { d: 'M391 14.5h11v9.5a2 2 0 01-2 2h-7a2 2 0 01-2-2zM393.5 14.5v-1.4a3 3 0 016 0v1.4', fill: 'none', stroke: INK, 'stroke-width': 1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, navG);

  /* hero picture: a placeholder strip that becomes a framed picture, in the style of the services illustrations */
  var IMG_BAD = { x: 28, y: 42, w: 374, h: 48, r: 6 }, IMG_GOOD = { x: 270, y: 44, w: 132, h: 104, r: 10 };
  var imgRect = el('rect', { 'stroke-width': 1 }, page);
  var imgX = el('path', { fill: 'none', stroke: '#d4d3d0', 'stroke-width': 1 }, page);
  var imgArt = el('g', { 'clip-path': 'url(#ha-wipe0)' }, page);
  var heroClip = el('clipPath', { id: 'ha-herobox' }, defs), heroClipR = el('rect', { x: 0, y: 0, width: IMG_GOOD.w, height: IMG_GOOD.h, rx: IMG_GOOD.r }, heroClip);
  var imgDraw = el('g', { transform: 'translate(' + IMG_GOOD.x + ' ' + IMG_GOOD.y + ')' }, imgArt);
  var imgIn = el('g', { 'clip-path': 'url(#ha-herobox)' }, imgDraw);
  el('circle', { cx: 112, cy: 28, r: 9.5, fill: '#fff' }, imgIn);
  el('path', { d: 'M0 104V74C16 60 30 60 44 68C56 75 68 76 80 68C94 58 112 60 132 72V104Z', fill: '#dcdcda' }, imgIn);
  el('path', { d: 'M0 104V86C20 78 38 81 56 86C74 91 98 82 132 80V104Z', fill: '#cbcbc9' }, imgIn);
  el('ellipse', { cx: 70, cy: 92, rx: 40, ry: 3, fill: '#000', opacity: 0.07 }, imgIn);
  el('path', { d: 'M34 68H72C72 82 64 92 53 92S34 82 34 68Z', fill: '#a9a9a7' }, imgIn);
  el('ellipse', { cx: 53, cy: 68, rx: 19, ry: 3.4, fill: '#c4c4c2' }, imgIn);
  el('path', { d: 'M82 36H94V47C94 53 104 57 104 71C104 83 99 92 95 92H81C77 92 72 83 72 71C72 57 82 53 82 47Z', fill: INK }, imgIn);
  el('ellipse', { cx: 88, cy: 36, rx: 6, ry: 1.7, fill: '#3a3a3a' }, imgIn);
  el('rect', { x: 77, y: 62, width: 3, height: 17, rx: 1.5, fill: '#fff', opacity: 0.16 }, imgIn);
  el('path', { d: 'M88 36V19', fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round' }, imgIn);
  el('path', { d: 'M88 27C94 26 98 22 99 17C93 18 88 22 88 27Z', fill: INK }, imgIn);

  /* headline: the generic one (centred serif), and ours in two versions (left, sans). Our headline block is centred on
     the picture: the cap height of line 1 down to the bottom of the button spans 54 to 138, the picture 44 to 148. */
  var HEAD = {
    bad: [txt('Welcome to Haven', { x: 215, y: 114, 'font-size': 14, 'font-weight': 500, 'text-anchor': 'middle', fill: '#333', 'font-family': SERIF }, page),
          txt('Handmade ceramics.', { x: 215, y: 129, 'font-size': 7.4, 'text-anchor': 'middle', fill: '#8a8a88', 'font-family': SERIF }, page)]
  };
  function ours(a, b, c) {
    var big = { x: 28, 'font-size': 19, 'font-weight': 600, 'letter-spacing': -0.6, fill: INK, 'font-family': SANS };
    var l0 = txt(a, big, page), l1 = txt(b, big, page), l2 = txt(c, { x: 28, 'font-size': 7.6, fill: MUTED, 'font-family': SANS }, page);
    l0.setAttribute('y', 68); l1.setAttribute('y', 90); l2.setAttribute('y', 108);
    return [l0, l1, l2];
  }
  HEAD.A = ours('Made by hand,', 'made to be used.', 'Small-batch ceramics for everyday life.');
  HEAD.B = ours('Made slowly,', 'made to last.', 'Glazed in small batches, shipped with care.');
  var HEAD_BLUR = {};
  ['bad', 'A', 'B'].forEach(function (k) { HEAD_BLUR[k] = HEAD[k].map(softFocus); });

  /* button: grey square, then a black pill */
  var BTN_BAD = { x: 175, y: 138, w: 80, h: 16, r: 0 }, BTN_GOOD = { x: 28, y: 117, w: 68, h: 21, r: 10.5 };
  var btnRect = el('rect', {}, page);
  var btnBad = txt('Shop Now', { x: 215, y: 148.6, 'font-size': 7.2, 'text-anchor': 'middle', fill: '#6a6a68', 'font-family': SERIF }, page);
  var btnGood = txt('Shop now', { x: BTN_GOOD.x + BTN_GOOD.w / 2, y: BTN_GOOD.y + 13.4, 'font-size': 7.7, 'font-weight': 600, 'text-anchor': 'middle', fill: '#fff', 'font-family': SANS }, page);

  /* three products: uneven placeholder cards, then an even grid with flat soft pictures */
  var CARD_BAD = [{ x: 28, y: 168, w: 100, h: 46 }, { x: 140, y: 162, w: 128, h: 58 }, { x: 282, y: 172, w: 104, h: 42 }];
  var CARD_GOOD = [{ x: 28, y: 164, w: 114, h: 58 }, { x: 158, y: 164, w: 114, h: 58 }, { x: 288, y: 164, w: 114, h: 58 }];
  var PRODUCTS = [['Mug', '$24'], ['Bowl', '$38'], ['Vase', '$46']];
  function drawProduct(i, g) {
    el('ellipse', { cx: 57, cy: 51, rx: 22, ry: 2.4, fill: '#000', opacity: 0.07 }, g);
    if (i === 0) {
      el('path', { d: 'M68 22H71.5A5 5 0 0 1 71.5 34H68', fill: 'none', stroke: '#b4b4b2', 'stroke-width': 3.4 }, g);
      el('path', { d: 'M42 17H68V43A6 6 0 0 1 62 49H48A6 6 0 0 1 42 43Z', fill: '#b4b4b2' }, g);
      el('ellipse', { cx: 55, cy: 17, rx: 13, ry: 2.6, fill: '#c9c9c7' }, g);
      el('rect', { x: 46, y: 23, width: 3, height: 19, rx: 1.5, fill: '#fff', opacity: 0.5 }, g);
    } else if (i === 1) {
      el('path', { d: 'M30 24H84C84 38 73 48 57 48S30 38 30 24Z', fill: '#a9a9a7' }, g);
      el('ellipse', { cx: 57, cy: 24, rx: 27, ry: 4, fill: '#c4c4c2' }, g);
      el('path', { d: 'M38 31C40 36 44 39 48 40', fill: 'none', stroke: '#fff', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.45 }, g);
    } else {
      el('path', { d: 'M51 9H63V18C63 24 72 27 72 38C72 46 68 49 65 49H49C46 49 42 46 42 38C42 27 51 24 51 18Z', fill: INK }, g);
      el('ellipse', { cx: 57, cy: 9, rx: 6, ry: 1.6, fill: '#3a3a3a' }, g);
      el('rect', { x: 46, y: 28, width: 3, height: 14, rx: 1.5, fill: '#fff', opacity: 0.16 }, g);
    }
  }
  var cards = PRODUCTS.map(function (p, i) {
    var g = el('g', {}, page);
    var box = el('rect', {}, g);
    var x = el('path', { fill: 'none', stroke: '#d4d3d0', 'stroke-width': 1 }, g);
    var artG = el('g', { 'clip-path': 'url(#ha-wipe' + (i + 1) + ')' }, g);
    drawProduct(i, artG);
    var oldPrice = txt(p[1] + '.00', { 'font-size': 6, 'text-anchor': 'middle', fill: '#8a8a88', 'font-family': SERIF }, g);
    var name = txt(p[0], { 'font-size': 7.8, 'font-weight': 600, fill: INK, 'font-family': SANS }, g);
    var price = txt(p[1], { 'font-size': 7.8, 'font-weight': 600, 'text-anchor': 'end', fill: INK, 'font-family': SANS }, g);
    var plus = el('g', {}, g);
    var plusC = el('circle', { r: 8, fill: '#fff', stroke: EDGE }, plus);
    var plusP = el('path', { d: 'M-2.8 0H2.8M0 -2.8V2.8', fill: 'none', stroke: INK, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, plus);
    return { g: g, box: box, x: x, art: artG, oldPrice: oldPrice, name: name, price: price, plus: plus, plusC: plusC, plusP: plusP };
  });

  /* UI team's checks: alignment guides (with ticks in the margin at each element they line up) and spacing labels */
  var guideG = el('g', {}, page);
  function makeGuide(x, ticks, side) {
    var g = el('g', {}, guideG);
    var line = el('path', { stroke: INK, 'stroke-width': 0.8, 'stroke-dasharray': '2 2', opacity: 0.55 }, g);
    var marks = ticks.map(function (y) { return el('path', { d: 'M' + x + ' ' + y + 'h' + (5 * side), stroke: INK, 'stroke-width': 0.9, 'stroke-linecap': 'round' }, g); });
    return { g: g, line: line, marks: marks, x: x, ticks: ticks };
  }
  var GUIDE_L = makeGuide(28, [19, 61, 83, 105, 127.5, 193, 233], -1);   // logo, headline, sub, button, card, name
  var GUIDE_R = makeGuide(402, [19, 96, 193, 233], 1);                  // bag, picture, card, price
  function makeGap(x1, y1, x2, y2) {
    var g = el('g', {}, guideG), hz = y1 === y2;
    el('path', { d: 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + (hz ? 'M' + x1 + ' ' + (y1 - 3) + 'v6M' + x2 + ' ' + (y2 - 3) + 'v6' : 'M' + (x1 - 3) + ' ' + y1 + 'h6M' + (x2 - 3) + ' ' + y2 + 'h6'), stroke: INK, 'stroke-width': 0.8, fill: 'none' }, g);
    var bx = hz ? (x1 + x2) / 2 - 7 : x1 + 5, by = hz ? y1 - 12.5 : (y1 + y2) / 2 - 4.5;
    el('rect', { x: bx, y: by, width: 14, height: 9, rx: 4.5, fill: INK }, g);
    txt('16', { x: bx + 7, y: by + 6.5, 'font-size': 5.8, 'font-weight': 600, 'text-anchor': 'middle', fill: '#fff', 'font-family': SANS }, g);
    return g;
  }
  var GAPS = [makeGap(142, 193, 158, 193), makeGap(272, 193, 288, 193), makeGap(336, 148, 336, 164)];

  /* the AI prompt, before there is a page */
  var pill = el('g', {}, inner);
  el('rect', { x: 105.5, y: 120.5, width: 219, height: 30, rx: 15, fill: '#fff', stroke: EDGE, filter: 'url(#ha-sm)' }, pill);
  el('path', { d: SPARK, transform: 'translate(124 135.5)', fill: INK }, pill);
  var pillClip = clipRect({ x: 136, y: 124, width: 150, height: 22 });
  var pillTxt = txt('', { x: 138, y: 138.4, 'font-size': 7.9, fill: INK, 'font-family': SANS }, el('g', { 'clip-path': pillClip.url }, pill));
  var pillCaret = el('rect', { y: 130.5, width: 0.9, height: 10, fill: INK }, pill);
  var sendG = el('g', {}, pill);
  var sendC = el('circle', { cx: 307, cy: 135.5, r: 10, fill: INK }, sendG);
  el('path', { d: 'M303.2 135.5H310M307 132L310.2 135.5L307 139', fill: 'none', stroke: '#fff', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sendG);
  var thinkDots = [0, 1, 2].map(function (i) { return el('circle', { cx: 301 + i * 6, cy: 135.5, r: 1.7, fill: INK }, pill); });

  /* ================= the sales card ================= */
  /* Two layouts. Wide: a tall card next to the window, as tall as it, its header band in line with the title bar, and the
     bottom order on the same baseline as the product names. Phones: a wide card under the window, revenue on the left
     and orders on the right, so the store and its sales are seen together at a readable size. */
  var LAY = {
    d: { vb: [660, 280], x: 458.5, y: 0.5, w: 201, h: 279, band: 28.5, div: 'M458.5 197.5H659.5',
         LX: 476.5, RX: 641.5, labY: 17.2, numY: 66, PL: { x: 504.5, y: 90, w: 137, h: 82 }, grid: [0, 200, 400, 600],
         ordY: 212, oLX: 476.5, oRX: 641.5, ROWY: 219.4, ROWH: 17, N: 3, prodX: 61 },
    m: { vb: [430, 456], x: 0.5, y: 295.5, w: 429, h: 160, band: 323.5, div: 'M250.5 323.5V455.5',
         LX: 18.5, RX: 232.5, labY: 312.2, numY: 361, PL: { x: 46.5, y: 375.5, w: 186, h: 50 }, grid: [0, 300, 600],
         ordY: 312.2, oLX: 268.5, oRX: 411.5, ROWY: 334.5, ROWH: 22, N: 5, prodX: 58 }
  };
  var YMAX = 600, DAY = 12;

  function buildCard(L) {
    var C = { L: L }, PL = L.PL;
    L.box = [L.x, L.y, L.x + L.w, L.y + L.h];
    var g = C.g = el('g', {});
    el('rect', { x: L.x, y: L.y, width: L.w, height: L.h, rx: 14, fill: '#fff', filter: 'url(#ha-sh)' }, g);
    var inn = C.inn = el('g', {}, g);                           // everything that resets when the loop starts over
    el('rect', { x: L.x, y: L.y, width: L.w, height: L.h, rx: 14, fill: 'none', stroke: EDGE }, g);
    el('path', { d: 'M' + L.x + ' ' + L.band + 'H' + (L.x + L.w), stroke: HAIR }, g);
    el('path', { d: L.div, stroke: HAIR }, g);

    // header: Revenue, and a legend set flush right (placed once the font has loaded)
    txt('Revenue', { x: L.LX, y: L.labY, 'font-size': 7.8, 'font-weight': 500, fill: MUTED, 'font-family': SANS }, g);
    C.lgDot = el('circle', { cy: L.labY - 2.8, r: 2.3, fill: INK }, g);
    C.lgToday = txt('Today', { y: L.labY - 0.4, 'font-size': 6.6, fill: MUTED, 'font-family': SANS }, g);
    C.lgDash = el('path', { stroke: DASH, 'stroke-width': 1.2, 'stroke-dasharray': '2 1.6', 'stroke-linecap': 'round' }, g);
    C.lgYest = txt('Yesterday', { x: L.RX, y: L.labY - 0.4, 'text-anchor': 'end', 'font-size': 6.6, fill: MUTED, 'font-family': SANS }, g);

    // the total, and its change against yesterday at the same hour
    C.big = txt('', { x: L.LX - 1, y: L.numY, 'font-size': 30, 'font-weight': 600, 'letter-spacing': -1.2, fill: INK, 'font-family': SANS }, inn);
    C.chip = el('g', {}, inn);
    C.chipBg = el('rect', { y: L.numY - 18, height: 16, rx: 8, fill: FILL }, C.chip);
    C.chipTri = el('path', { fill: INK }, C.chip);                // up or down is told by the arrow, in the site's ink
    C.chipTxt = txt('', { y: L.numY - 6.8, 'font-size': 7.6, 'font-weight': 600, fill: INK, 'font-family': SANS }, C.chip);
    C.chipTip = el('g', {}, inn);                               // "vs yesterday", when Sales points at the chip
    C.chipTipBg = el('rect', { height: 12, width: 50, rx: 6, fill: INK }, C.chipTip);
    C.chipTipTxt = txt('vs yesterday', { x: 25, y: 8.3, 'font-size': 6, 'font-weight': 500, 'text-anchor': 'middle', fill: '#fff', 'font-family': SANS }, C.chipTip);

    // the plot
    L.grid.forEach(function (v) {
      var y = PL.y + PL.h - v / YMAX * PL.h;
      el('path', { d: 'M' + PL.x + ' ' + y.toFixed(1) + 'H' + (PL.x + PL.w), stroke: v ? '#e8e8e6' : '#dcdcda', 'stroke-width': v ? 0.8 : 1, 'stroke-dasharray': v ? '1.5 3' : 'none' }, inn);
      txt('$' + v, { x: PL.x - 7, y: y + 2.2, 'font-size': 6.2, 'text-anchor': 'end', fill: FAINT, 'font-family': SANS }, inn);
    });
    [['9am', 0, 'start'], ['12pm', 0.25, 'middle'], ['3pm', 0.5, 'middle'], ['6pm', 0.75, 'middle'], ['9pm', 1, 'end']].forEach(function (a) {
      txt(a[0], { x: PL.x + PL.w * a[1], y: PL.y + PL.h + 13, 'font-size': 6.2, 'text-anchor': a[2], fill: FAINT, 'font-family': SANS }, inn);
    });
    var pc = clipRect({ x: PL.x - 4, y: PL.y - 14, width: PL.w + 8, height: PL.h + 18 });
    var plotG = el('g', { 'clip-path': pc.url }, inn);
    C.yest = el('path', { fill: 'none', stroke: DASH, 'stroke-width': 1.2, 'stroke-dasharray': '2.4 2.4', 'stroke-linecap': 'round' }, plotG);
    C.area = el('path', { fill: 'url(#ha-fill)' }, plotG);
    C.line = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, plotG);
    C.ring = el('circle', { fill: 'none', stroke: INK, 'stroke-width': 0.8 }, inn);
    C.dot = el('circle', { r: 2.8, fill: INK, stroke: '#fff', 'stroke-width': 1.3 }, inn);

    // Sales' hover on the chart: a guide, a point on each line, and a tooltip
    C.xh = el('g', {}, inn);
    C.xhLine = el('path', { stroke: INK, 'stroke-width': 0.8, opacity: 0.2 }, C.xh);
    C.xhY = el('circle', { r: 2.2, fill: '#fff', stroke: DASH, 'stroke-width': 1.2 }, C.xh);
    C.xhT = el('circle', { r: 2.8, fill: INK, stroke: '#fff', 'stroke-width': 1.3 }, C.xh);
    C.tt = el('g', {}, inn);
    C.ttBg = el('rect', { height: 35, rx: 7, fill: '#fff', stroke: EDGE, 'stroke-width': 0.8, filter: 'url(#ha-sm)' }, C.tt);
    C.ttTime = txt('', { x: 7.5, y: 10.6, 'font-size': 5.8, fill: MUTED, 'font-family': SANS }, C.tt);
    el('circle', { cx: 9.6, cy: 18.3, r: 2, fill: INK }, C.tt);
    C.ttT = txt('', { x: 15, y: 20.6, 'font-size': 6.8, 'font-weight': 600, fill: INK, 'font-family': SANS }, C.tt);
    el('path', { d: 'M7.4 27.3h4.4', stroke: DASH, 'stroke-width': 1.2, 'stroke-dasharray': '1.6 1.2', 'stroke-linecap': 'round' }, C.tt);
    C.ttY = txt('', { x: 15, y: 29.6, 'font-size': 6.8, fill: MUTED, 'font-family': SANS }, C.tt);

    // orders: a count, a live light, and the newest orders
    C.ordLab = txt('Orders', { x: L.oLX, y: L.ordY, 'font-size': 7.8, 'font-weight': 500, fill: MUTED, 'font-family': SANS }, g);
    C.cnt = el('g', {}, inn);
    C.cntBg = el('rect', { y: L.ordY - 8.4, height: 11, width: 14, rx: 5.5, fill: FILL }, C.cnt);
    var cc = clipRect({ y: L.ordY - 8.4, height: 11, width: 14 }); C.cntClip = cc.r;
    var cg = el('g', { 'clip-path': cc.url }, C.cnt);
    C.cntA = txt('', { y: L.ordY - 0.6, 'font-size': 6.4, 'font-weight': 600, 'text-anchor': 'middle', fill: INK, 'font-family': SANS }, cg);
    C.cntB = txt('', { y: L.ordY - 0.6, 'font-size': 6.4, 'font-weight': 600, 'text-anchor': 'middle', fill: INK, 'font-family': SANS }, cg);
    C.liveTxt = txt('Live', { x: L.oRX, y: L.ordY - 0.4, 'text-anchor': 'end', 'font-size': 6.6, fill: MUTED, 'font-family': SANS }, g);
    C.liveRing = el('circle', { cy: L.ordY - 2.8, r: 3, fill: 'none', 'stroke-width': 0.8, stroke: INK }, g);
    C.liveDot = el('circle', { cy: L.ordY - 2.8, r: 2.3, fill: INK }, g);
    var rc = clipRect({ x: L.oLX - 10, y: L.ROWY - 2, width: L.oRX - L.oLX + 20, height: (L.N - 1) * L.ROWH + 19 });
    var rowsG = el('g', { 'clip-path': rc.url }, inn);
    C.empty = txt('No orders yet', { x: L.oLX, y: L.ROWY + 10.4, 'font-size': 7.4, fill: FAINT, 'font-family': SANS }, rowsG);
    C.rows = [];
    for (var i = 0; i <= L.N; i++) {
      var rg = el('g', {}, rowsG);
      var bg = el('rect', { x: L.oLX - 6, y: -1, width: L.oRX - L.oLX + 12, height: 17, rx: 6, fill: '#f2f2f0' }, rg);
      el('circle', { cx: L.oLX + 6, cy: 7.5, r: 6, fill: SOFT }, rg);
      C.rows.push({ g: rg, bg: bg,
        ini: txt('', { x: L.oLX + 6, y: 9.6, 'font-size': 5.8, 'font-weight': 600, 'text-anchor': 'middle', fill: INK, 'font-family': SANS }, rg),
        nm: txt('', { x: L.oLX + 17, y: 10.4, 'font-size': 7.2, 'font-weight': 500, fill: INK, 'font-family': SANS }, rg),
        pr: txt('', { x: L.oLX + L.prodX, y: 10.4, 'font-size': 6.8, fill: MUTED, 'font-family': SANS }, rg),
        am: txt('', { x: L.oRX - 2, y: 10.4, 'font-size': 7.4, 'font-weight': 600, 'text-anchor': 'end', fill: INK, 'font-family': SANS }, rg) });
    }
    return C;
  }
  var CARD = { d: buildCard(LAY.d), m: buildCard(LAY.m) };
  function placeLabels(C) {                                     // things set by text width, once the font is in
    var L = C.L, wy = textW(C.lgYest, 29), wt = textW(C.lgToday, 17);
    var dEnd = L.RX - wy - 3.5, dStart = dEnd - 8, tEnd = dStart - 7, tStart = tEnd - wt;
    C.lgDash.setAttribute('d', 'M' + dStart.toFixed(1) + ' ' + (L.labY - 2.8) + 'H' + dEnd.toFixed(1));
    C.lgToday.setAttribute('x', tStart.toFixed(1)); C.lgDot.setAttribute('cx', (tStart - 5.2).toFixed(1));
    var lx = L.oRX - textW(C.liveTxt, 12) - 5.6;
    C.liveRing.setAttribute('cx', lx.toFixed(1)); C.liveDot.setAttribute('cx', lx.toFixed(1));
    C.cntX = L.oLX + textW(C.ordLab, 24) + 5;
    set(C.cntBg, { x: C.cntX }); set(C.cntClip, { x: C.cntX });
    C.cntA.setAttribute('x', (C.cntX + 7).toFixed(1)); C.cntB.setAttribute('x', (C.cntX + 7).toFixed(1));
    C.placed = true;
  }

  /* ================= the team's cursors ================= */
  var rings = [0, 1].map(function () { return el('circle', { fill: 'none', 'stroke-width': 0.9, 'clip-path': 'url(#ha-win)' }, svg); });   // UI's clicks, kept inside the window
  /* The two cursors are the site's two buttons: UI team dark (like "Services"), Sales team light (like "Book a call"). */
  function makeCursor(name, dark) {
    var fg = dark ? '#fff' : INK, g = el('g', {});
    var tag = el('g', {}, g);
    var bg = el('rect', dark ? { height: 14, rx: 7, fill: INK } : { height: 14, rx: 7, fill: '#fff', stroke: EDGE, 'stroke-width': 0.8, filter: 'url(#ha-sm)' }, tag);
    var cl = clipRect({ x: 0, y: 0, height: 14 });
    var tin = el('g', { 'clip-path': cl.url }, tag);
    var nm = txt(name, { x: 7, y: 9.7, 'font-size': 7, 'font-weight': 500, fill: fg, 'font-family': SANS }, tin);
    var msg = txt('', { x: 7, y: 21.3, 'font-size': 7.4, 'font-weight': 500, fill: fg, 'font-family': SANS }, tin);
    var arrow = el('path', { d: 'M0 0V14L3.9 10.7L6.6 16.6L9 15.5L6.3 9.7H11.3Z', fill: dark ? INK : '#fff', stroke: dark ? '#fff' : INK, 'stroke-width': dark ? 1.1 : 1, 'stroke-linejoin': 'round', filter: 'url(#ha-cur)' }, g);
    return { g: g, tag: tag, bg: bg, clip: cl.r, nm: nm, msg: msg, arrow: arrow, name: name, last: '', mw: 0 };
  }
  var SALESC = makeCursor('Sales team', false), UIC = makeCursor('UI team', true);

  /* Where a cursor's name tag sits, relative to the tip. sx: 1 right, -1 left, 0 whichever side has room.
     up: the tag grows upward when it becomes a message (its bottom stays put). Each move in the timelines names one. */
  var PLACE = {
    b:  { sx: 0, ox: 10, oy: 15 },
    br: { sx: 1, ox: 10, oy: 15 },
    bl: { sx: -1, ox: 3, oy: 15 },
    r:  { sx: 1, ox: 13, oy: -7 },
    ru: { sx: 1, ox: 13, oy: 7, up: 1 },
    l:  { sx: -1, ox: 4, oy: -7 },
    lu: { sx: -1, ox: 4, oy: 7, up: 1 },
    tr: { sx: 1, ox: 9, oy: -4, up: 1 },
    tl: { sx: -1, ox: 3, oy: -4, up: 1 }
  };

  /* ================= the story ================= */
  /* Positions are in the SVG's coordinates (the store's y plus 28). UI keys: [time, where, how, tag].
     where: [x, y], or 'img' / 'btn' for the picture or button being dragged. how: 0 a move, 'glide' an even slide
     (checking along a guide), 'follow' a drag that moves with the thing it holds. */
  var P0 = [259.5, 237.5];                                     // resting on the Bowl card's add button (it shows its hover state)
  var UI_INTRO = [[8.9, [176, 236], 0, 'b'], [9.9, 'strip', 0, 'tl'], [10.55, 'strip', 0, 'tl'], [12.0, 'img', 'follow', 'tl'],
                  [12.6, [240, 137], 0, 'b'], [13.6, [240, 137], 0, 'b'], [14.35, [215, 174], 0, 'b'], [14.55, [215, 174], 0, 'b'],
                  [15.4, 'btn', 'follow', 'b'], [16.0, [200, 206], 0, 'tr'], [18.6, [200, 206], 0, 'tr'], [19.3, P0, 0, 'r'], [20.2, P0, 0, 'r']];
  var HL = [133, 93];                                           // on the end of the headline's first line, in both versions
  /* In the loop UI drags a guide in from each side of the window until it snaps to the margin (in the empty band between
     the button and the cards, so its tag covers nothing), then checks the gaps, then tries the headline. */
  var UI_LOOP = [[0, P0, 0, 'r'], [0.9, P0, 0, 'r'], [1.65, [9, 181], 0, 'r'], [1.8, [9, 181], 0, 'r'], [2.7, [29.5, 181], 'drag', 'r'], [3.3, [29.5, 181], 0, 'r'],
                 [4.0, [150, 221], 0, 'tr'], [4.7, [150, 221], 0, 'tr'], [5.2, [280, 221], 'glide', 'tr'], [5.7, [280, 221], 0, 'tr'],
                 [6.5, HL, 0, 'tr'], [8.5, HL, 0, 'tr'], [9.25, [421, 183], 0, 'l'], [9.4, [421, 183], 0, 'l'], [10.3, [403.5, 183], 'drag', 'l'], [11.0, [403.5, 183], 0, 'l'],
                 [11.8, HL, 0, 'tr'], [15.3, HL, 0, 'tr'], [16.3, P0, 0, 'r'], [18, P0, 0, 'r']];
  var CLICK_UI_INTRO = [10.5, 12.65, 14.5, 16.1], CLICK_UI_LOOP = [1.8, 7.0, 9.4, 14.0];
  /* Sales keys: [time, where, how, tag]. where: 'in' (entering), 'cnt' (the order count), 'row' (the newest order),
     'chip' (the change against yesterday), or ['h', hour, height in the plot]; hour 'now', or below 0 for hours before now.
     A tag can differ per layout: [wide, phone]. */
  var SALES_INTRO = [[8.2, 'in', 0, 'b'], [9.0, ['h', 0.9, 0.36], 0, ['b', 'ru']], [10.6, ['h', 'now', 0.36], 'glide', ['b', 'ru']], [11.7, ['h', 'now', 0.36], 0, ['b', 'ru']],
                     [12.4, 'row', 0, 'bl'], [13.3, 'row', 0, 'bl'], [14.0, 'cnt', 0, 'ru'], [16.6, 'cnt', 0, 'ru'],
                     [17.3, ['h', 4.0, 0.8], 0, ['bl', 'lu']], [19.0, ['h', 'now', 0.8], 'glide', ['bl', 'lu']], [19.3, ['h', 'now', 0.8], 0, ['bl', 'lu']], [20.0, 'cnt', 0, 'ru']];
  var SALES_LOOP = [[0, 'cnt', 0, 'ru'], [2.15, 'cnt', 0, 'ru'], [2.75, 'row', 0, 'bl'], [3.5, 'row', 0, 'bl'],
                    [4.2, ['h', 6.8, 0.85], 0, 'b'], [6.0, ['h', 'now', 0.85], 'glide', 'b'], [6.5, ['h', 'now', 0.85], 0, 'b'],
                    [7.2, 'chip', 0, ['bl', 'br']], [9.5, 'chip', 0, ['bl', 'br']],
                    [10.1, ['h', -1.4, 0.55], 0, ['b', 'lu']], [11.2, ['h', 'now', 0.55], 'glide', ['b', 'lu']], [11.75, ['h', 'now', 0.55], 0, ['b', 'lu']],
                    [12.3, 'row', 0, 'bl'], [12.8, 'row', 0, 'bl'], [13.4, 'chip', 0, ['bl', 'br']], [14.6, 'chip', 0, ['bl', 'br']], [15.2, 'cnt', 0, 'ru'],
                    [16.0, 'cnt', 0, 'ru'], [16.55, 'row', 0, 'bl'], [17.0, 'row', 0, 'bl'], [17.6, 'cnt', 0, 'ru'], [18, 'cnt', 0, 'ru']];
  var XHAIR = { intro: [[8.95, 11.75], [17.25, 19.35]], loop: [[4.1, 6.6], [9.95, 11.85]] };   // when Sales' chart hover shows
  var BUBBLES = {
    intro: { ui: [[10.0, 11.5, 'Fixing the page']], sales: [[9.3, 10.9, 'Below yesterday'], [15.2, 16.75, 'Orders picking up'], [18.0, 19.6, 'Above yesterday']] },
    loop: { ui: [[6.4, 7.95, 'Trying a new headline'], [13.4, 14.9, 'Switching back']],
            sales: [[7.75, 9.3, 'Watching the numbers'], [12.75, 14.3, 'Orders slowed down'], [16.85, 17.95, 'Picking up again']] }
  };
  var MORPH = { img: [10.6, 12.0], head: 12.75, btn: [14.6, 15.4], cards: 16.2 };
  /* orders: [time, amount, who, what]. Intro times are scene seconds; loop times are seconds into the loop. The last
     intro order lands early enough to settle before the loop begins, so the two join without a jump. */
  var ORD_INTRO = [[7.9, 24, 'Omar R.', 'Mug'], [11.9, 24, 'Lina M.', 'Mug'], [14.6, 38, 'Sara K.', 'Bowl'], [15.5, 46, 'Noah P.', 'Vase'],
                   [16.3, 48, 'Ana T.', 'Mug ×2'], [17.0, 76, 'Maya L.', 'Bowl ×2'], [17.6, 46, 'Ravi S.', 'Vase'], [18.1, 76, 'Elena V.', 'Bowl ×2']];
  var ORD_LOOP = [[2.0, 38, 'Jon B.', 'Bowl'], [5.0, 48, 'Aisha N.', 'Mug ×2'], [11.6, 24, 'Leo F.', 'Mug'], [15.9, 46, 'Mia C.', 'Vase']];

  var CAPS = [[0.3, 5.2, 'AI builds a website in seconds.'], [5.6, 8.7, "But a generic site doesn't sell."], [8.9, 12.0, 'So our team steps in.'],
              [12.1, 15.7, 'We fix every detail by hand.'], [15.8, 18.7, 'And now it sells.']];

  /* ================= motion ================= */
  function arc(a, b, k) {                                       // a slight bow, so it moves like a hand
    var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1, bow = Math.sin(Math.PI * k) * Math.min(d * 0.06, 9);
    return [mix(a[0], b[0], k) - dy / d * bow, mix(a[1], b[1], k) + dx / d * bow];
  }
  function placeOf(key) { var p = key[3]; return PLACE[typeof p === 'string' ? p : p[M ? 1 : 0]]; }
  /* A move leaves smoothly, travels fast, overshoots a little and settles, like a hand on a mouse. Longer moves
     overshoot more (up to about 2%); short ones barely. */
  function arrive(k, d) {
    var s = 0.75 * clamp(d / 260, 0.12, 1), x = smooth(k) - 1;
    return 1 + (s + 1) * x * x * x + s * x * x;
  }
  /* where a cursor is at time t: {x, y, press, rest, pa, pb, pk}. pa/pb are the tag placements it is moving between;
     rest (0..1) is how settled it is, so it can idle while it waits. */
  function track(keys, t, resolve) {
    var a = keys[0], b = keys[0], k = 0, how = 0, i;
    if (t > keys[0][0]) {
      for (i = 0; i < keys.length - 1; i++) { a = keys[i]; b = keys[i + 1]; if (t <= b[0]) break; }
      if (t > b[0]) a = b;
      k = a === b ? 0 : seg(t, a[0], b[0]); how = b[2];
    }
    var pa = resolve(a[1]), pb = resolve(b[1]), pos, d = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]), rest = 0;
    if (how === 'follow') pos = pb;
    else if (how === 'glide' || how === 'drag') { var e = sine(k); pos = [mix(pa[0], pb[0], e), mix(pa[1], pb[1], e)]; }
    else {
      pos = arc(pa, pb, arrive(k, d));
      if (d < 0.5) rest = smooth(seg(t - a[0], 0.15, 0.8)) * (a === b ? 1 : smooth(seg(b[0] - t, 0.1, 0.6)));
    }
    return { x: pos[0], y: pos[1], press: how === 'follow' || how === 'drag' ? 1 : 0, rest: rest, pa: placeOf(a), pb: placeOf(b), pk: smooth(k) };
  }
  function motion(keys, t, resolve, resolvePrev) {             // the position plus its velocity (units a second)
    var p = track(keys, t, resolve), q = track(keys, t - 0.04, resolvePrev || resolve);
    p.vx = (p.x - q.x) / 0.04; p.vy = (p.y - q.y) / 0.04;
    return p;
  }
  function pressOf(list, t) { for (var i = 0; i < list.length; i++) { var d = t - list[i]; if (d > 0 && d < 0.24) return Math.sin(Math.PI * d / 0.24); } return 0; }
  function prog(t, a, b) { return inOut(seg(t, a, b)); }
  function cardProg(t, j) { return inOut(seg(t, MORPH.cards + j * 0.28, MORPH.cards + 1.3 + j * 0.28)); }

  /* headline changes: the old lines lift and soften away, the new ones rise in from below, line by line.
     Each entry is [visibility 0..1, +1 if the line is arriving (comes up from below) or -1 if leaving (goes up)]. */
  function swap(from, to, t, t0, out) {
    for (var i = 0; i < 3; i++) {
      out[from][i] = [1 - seg(t, t0 + i * 0.07, t0 + 0.6 + i * 0.07), -1];
      out[to][i] = [seg(t, t0 + 0.35 + i * 0.09, t0 + 1.05 + i * 0.09), 1];
    }
  }
  function headVis(loop, t) {
    var o = { bad: [[0, -1], [0, -1], [0, -1]], A: [[0, 1], [0, 1], [0, 1]], B: [[0, 1], [0, 1], [0, 1]] };
    if (!loop) swap('bad', 'A', t, MORPH.head, o);
    else if (t < 14.1) swap('A', 'B', t, 7.15, o);
    else swap('B', 'A', t, 14.15, o);
    return o;
  }

  function introState(t) {
    var S = { loop: false, t: t, now: t };
    S.build = []; for (var i = 0; i < 6; i++) S.build.push(smooth(seg(t, 4.1 + i * 0.2, 4.7 + i * 0.2)));
    S.p = { img: prog(t, MORPH.img[0], MORPH.img[1]), btn: prog(t, MORPH.btn[0], MORPH.btn[1]) };
    S.cp = [0, 1, 2].map(function (j) { return cardProg(t, j); });
    S.f = smooth(seg(t, 4.9, 5.7));
    S.card = smooth(seg(t, 4.6, 5.4));
    var typedN = Math.round(29 * seg(t, 0.9, 2.5));
    S.pill = { o: ramp(t, 0.2, 0.7, 3.9, 4.3), text: 'A store for handmade ceramics'.slice(0, typedN), typing: t < 2.7, press: t > 2.75 && t < 2.9, think: t >= 2.95, y: 8 * smooth(seg(t, 3.9, 4.3)) };
    S.uiO = smooth(seg(t, 8.9, 9.3)); S.salesO = smooth(seg(t, 8.2, 8.6));
    S.uiKeys = UI_INTRO; S.salesKeys = SALES_INTRO; S.uiClicks = CLICK_UI_INTRO; S.xhair = XHAIR.intro; S.bubbles = BUBBLES.intro;
    S.head = headVis(false, t);
    S.guide = { L: ramp(t, 13.45, 13.6, 14.15, 14.6), Ly: 10 + 102 * smooth(seg(t, 13.5, 13.95)), Ld: false, R: 0, Ry: 0, Rd: false,
                gaps: [ramp(t, 18.0, 18.3, 18.75, 19.1), ramp(t, 18.1, 18.4, 18.75, 19.1), ramp(t, 18.2, 18.5, 18.75, 19.1)] };
    return S;
  }
  function loopState(u, t) {
    var S = { loop: true, t: t, u: u, now: u };
    S.build = [1, 1, 1, 1, 1, 1]; S.p = { img: 1, btn: 1 }; S.cp = [1, 1, 1]; S.f = 1; S.card = 1;
    S.pill = { o: 0, text: '', typing: false, press: false, think: false, y: 0 };
    S.uiO = 1; S.salesO = 1;
    S.uiKeys = UI_LOOP; S.salesKeys = SALES_LOOP; S.uiClicks = CLICK_UI_LOOP; S.xhair = XHAIR.loop; S.bubbles = BUBBLES.loop;
    S.head = headVis(true, u);
    S.guide = { L: ramp(u, 1.76, 1.9, 3.5, 4.0), Ly: 240, Ld: u < 2.75, R: ramp(u, 9.36, 9.5, 11.1, 11.6), Ry: 240, Rd: u < 10.35,
                gaps: [ramp(u, 4.05, 4.35, 5.8, 6.2), ramp(u, 5.15, 5.45, 5.8, 6.2), ramp(u, 4.5, 4.8, 5.8, 6.2)] };
    return S;
  }

  /* ================= drawing one moment ================= */
  function lerpBox(a, b, k) { return { x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), w: mix(a.w, b.w, k), h: mix(a.h, b.h, k) }; }
  function imgBox(p) { var a = inOut(seg(p, 0, 0.5)), b = inOut(seg(p, 0.45, 1)); return { x: mix(IMG_BAD.x, IMG_GOOD.x, a), w: mix(IMG_BAD.w, IMG_GOOD.w, a), y: mix(IMG_BAD.y, IMG_GOOD.y, b), h: mix(IMG_BAD.h, IMG_GOOD.h, b) }; }
  function uiAnchor(S, tt) {                                    // tt: the moment to read the dragged picture or button at
    var pImg = S.loop ? 1 : prog(tt, MORPH.img[0], MORPH.img[1]), pBtn = S.loop ? 1 : prog(tt, MORPH.btn[0], MORPH.btn[1]);
    return function (w) {
      if (w === 'strip' || w === 'img') { var b = imgBox(w === 'strip' ? 0 : pImg); return [b.x + b.w / 2, b.y + b.h / 2 + PAGE_Y]; }
      if (w === 'btn') { var c = lerpBox(BTN_BAD, BTN_GOOD, pBtn); return [c.x + c.w / 2, c.y + c.h / 2 + PAGE_Y]; }
      return w;
    };
  }

  function drawHead(S) {
    ['bad', 'A', 'B'].forEach(function (k) {
      HEAD[k].forEach(function (e, i) {
        if (!e) return;
        var v = S.head[k][i], vis = smooth(v[0]), soft = (1 - vis) * 2.2, rise = (1 - vis) * (v[1] > 0 ? 7 : -6);
        op(e, vis * S.build[2]);
        tf(e, 0, rise);
        HEAD_BLUR[k][i].setAttribute('stdDeviation', soft.toFixed(2));
        if (soft > 0.05 && vis > 0) e.setAttribute('filter', e._f); else e.removeAttribute('filter');
      });
    });
  }

  function drawStore(S, ui) {
    var B = S.build;
    var pi = S.p.img, ib = imgBox(pi), ir = mix(IMG_BAD.r, IMG_GOOD.r, pi);
    set(imgRect, { x: ib.x, y: ib.y, width: ib.w, height: ib.h, rx: ir, fill: blend('#efefed', '#ececea', pi), stroke: pi > 0.5 ? 'none' : EDGE });
    imgX.setAttribute('d', 'M' + ib.x + ' ' + ib.y + 'L' + (ib.x + ib.w) + ' ' + (ib.y + ib.h) + 'M' + (ib.x + ib.w) + ' ' + ib.y + 'L' + ib.x + ' ' + (ib.y + ib.h));
    op(imgRect, B[1]); op(imgX, B[1] * (1 - smooth(seg(pi, 0, 0.3))));
    set(wipes[0], { x: IMG_GOOD.x - 4, y: 0, height: 260, width: 170 * smooth(seg(pi, 0.6, 1)) });
    set(heroClipR, { x: ib.x - IMG_GOOD.x, y: ib.y - IMG_GOOD.y, width: ib.w, height: ib.h, rx: ir });   // the picture is cropped by its frame as it grows
    op(imgArt, pi > 0.6 ? 1 : 0);
    drawHead(S);
    var pb = S.p.btn, bb = lerpBox(BTN_BAD, BTN_GOOD, pb);
    set(btnRect, { x: bb.x, y: bb.y, width: bb.w, height: bb.h, rx: mix(BTN_BAD.r, BTN_GOOD.r, pb), fill: blend('#d8d8d6', INK, pb) });
    op(btnRect, B[3]); op(btnBad, B[3] * (1 - smooth(seg(pb, 0, 0.4)))); op(btnGood, smooth(seg(pb, 0.5, 1)));
    cards.forEach(function (c, j) {
      var cp = S.cp[j], bx = lerpBox(CARD_BAD[j], CARD_GOOD[j], cp), G = CARD_GOOD[j];
      op(c.g, B[4 + (j === 2 ? 1 : 0)]);
      set(c.box, { x: bx.x, y: bx.y, width: bx.w, height: bx.h, rx: mix(5, 9, cp), fill: blend('#efefed', '#ececea', cp), stroke: cp > 0.5 ? 'none' : EDGE });
      c.x.setAttribute('d', 'M' + bx.x + ' ' + bx.y + 'L' + (bx.x + bx.w) + ' ' + (bx.y + bx.h) + 'M' + (bx.x + bx.w) + ' ' + bx.y + 'L' + bx.x + ' ' + (bx.y + bx.h));
      op(c.x, 1 - smooth(seg(cp, 0, 0.3)));
      c.art.setAttribute('transform', 'translate(' + G.x + ' ' + G.y + ')');
      wipes[j + 1].setAttribute('width', (118 * smooth(seg(cp, 0.35, 1))).toFixed(1));
      op(c.art, cp > 0.35 ? 1 : 0);
      set(c.oldPrice, { x: bx.x + bx.w / 2, y: bx.y + bx.h + 11 }); op(c.oldPrice, 1 - smooth(seg(cp, 0, 0.3)));
      var gt = smooth(seg(cp, 0.6, 1));
      set(c.name, { x: G.x, y: G.y + G.h + 14 }); op(c.name, gt);
      set(c.price, { x: G.x + G.w, y: G.y + G.h + 14 }); op(c.price, gt);
      // the add button, and its hover state when the UI cursor is on it
      var px = G.x + G.w - 14, py = G.y + G.h - 14, d = ui ? Math.hypot(ui.x - px, ui.y - PAGE_Y - py) : 99, hv = smooth(seg(9.5 - d, 0, 2.5)) * (ui ? ui.o : 0);
      tf(c.plus, px, py); op(c.plus, gt);
      c.plusC.setAttribute('fill', blend('#ffffff', INK, hv)); c.plusC.setAttribute('stroke', blend(EDGE, INK, hv)); c.plusP.setAttribute('stroke', blend(INK, '#ffffff', hv));
    });
    op(navG, B[0]);
  }

  /* In the intro the left guide draws itself down as the new headline lands on the margin. In the loop a guide is dragged
     in from the window's edge with the cursor; its ticks pop in when it snaps onto the margin. */
  function drawGuides(S, ui) {
    var G = S.guide;
    [[GUIDE_L, G.L, G.Ly, G.Ld, -1], [GUIDE_R, G.R, G.Ry, G.Rd, 1]].forEach(function (a) {
      var g = a[0], o = a[1];
      op(g.g, o); if (o <= 0) return;
      var dx = a[3] ? (a[4] < 0 ? Math.min(ui.x - 1.5 - g.x, 0) : Math.max(ui.x - 1.5 - g.x, 0)) : 0, snap = smooth(seg(1.2 - Math.abs(dx), 0, 1.2));
      tf(g.g, dx, 0);
      g.line.setAttribute('d', 'M' + g.x + ' 10V' + a[2].toFixed(1));
      g.marks.forEach(function (m, i) { op(m, a[2] >= 240 ? snap : smooth(seg(a[2] - g.ticks[i], -2, 6))); });
    });
    GAPS.forEach(function (g, i) { op(g, G.gaps[i]); tf(g, 0, 1.5 * (1 - G.gaps[i])); });
  }

  /* ---- sales: the day runs 9am to 9pm; revenue changes only when an order arrives ----
     The intro runs through the day quickly (to about 5:30pm, as the last order lands), then the clock slows to 0.1 hour a
     second. Against yesterday: -77% for the generic store, level just after the fixes, +22% when the intro ends; in the
     loop +25% and +35%, flat while the new headline runs, +44% once it is switched back. */
  function hoursIntro(t) { return t <= 18.6 ? 8.4 * Math.pow(seg(t, 4.8, 18.6), 0.8) : 8.4 + 0.1 * (t - 18.6); }
  var H_INTRO = hoursIntro(INTRO_END), H_RATE = 0.1;
  function yest(h) { return 36 * h + 18 * Math.sin(h * 0.9); }
  function tween(now, t0) { return smooth(seg(now - t0, 0.25, 1.15)); }
  var RISE = 0.18;                                              // hours an order's step takes on the chart (a soft step, not a cliff)

  function salesData(S, clock) {
    var loop = S.loop, u = S.u || 0, loopIdx = loop ? Math.floor((clock - INTRO_END) / LOOP) : 0;
    var D = { fade: S.f * (loop ? (1 - smooth(seg(u, 17.3, 17.9))) * (loopIdx > 0 ? smooth(seg(u, 0.05, 0.6)) : 1) : 1) };
    var now = D.now = loop ? u : clock, evs = D.evs = [];
    D.hnow = loop ? H_INTRO + H_RATE * u : hoursIntro(clock);
    ORD_INTRO.forEach(function (o) { if (loop || o[0] <= clock) evs.push({ t: o[0], h: hoursIntro(o[0]), a: o[1], who: o[2], what: o[3], done: loop }); });
    if (loop) ORD_LOOP.forEach(function (o) { if (o[0] <= u) evs.push({ t: o[0], h: H_INTRO + H_RATE * o[0], a: o[1], who: o[2], what: o[3], done: false }); });
    var full = 0, R = 0;
    evs.forEach(function (e) { e.tw = e.done ? 1 : tween(now, e.t); full += e.a; e.full = full; R += e.a * e.tw; });
    D.R = R;
    D.last = evs[evs.length - 1]; D.prev = evs[evs.length - 2];
    D.since = D.last ? now - D.last.t : 99;
    D.enter = D.last && !D.last.done ? smooth(seg(D.since, 0, 0.9)) : 1;
    var pctNew = D.last ? (D.last.full / yest(D.last.h) - 1) * 100 : 0, pctOld = D.prev ? (D.prev.full / yest(D.prev.h) - 1) * 100 : pctNew;
    D.pct = D.last ? mix(pctOld, pctNew, D.last.tw) : 0;
    D.revAt = function (h) {                                     // today's total at hour h, on the drawn line
      var v = 0; evs.forEach(function (e) { v += e.a * e.tw * smooth(seg(h, e.h, e.h + RISE)); }); return v;
    };
    return D;
  }

  function drawCard(C, D, clock) {
    var L = C.L, PL = L.PL;
    if (!C.placed) placeLabels(C);
    op(C.inn, D.fade);
    var X = function (h) { return PL.x + PL.w * h / DAY; }, Y = function (v) { return PL.y + PL.h - Math.min(v, YMAX) / YMAX * PL.h; };
    C.X = X; C.Y = Y;
    // the line: flat between orders, a soft step at each one
    var before = 0, d = 'M' + X(0).toFixed(1) + ' ' + Y(0).toFixed(1), endX = X(0);
    D.evs.forEach(function (e) {
      var x0 = X(e.h), x1 = X(e.h + RISE), xm = (x0 + x1) / 2, y0 = Y(before), y1 = Y(before + e.a * e.tw);
      d += 'L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + 'C' + xm.toFixed(1) + ' ' + y0.toFixed(1) + ' ' + xm.toFixed(1) + ' ' + y1.toFixed(1) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1);
      before += e.a * e.tw; endX = x1;
    });
    var lx = Math.max(X(D.hnow), endX), ly = Y(D.R);
    d += 'L' + lx.toFixed(1) + ' ' + ly.toFixed(1);
    C.line.setAttribute('d', d);
    C.area.setAttribute('d', d + 'L' + lx.toFixed(1) + ' ' + (PL.y + PL.h) + 'L' + X(0).toFixed(1) + ' ' + (PL.y + PL.h) + 'Z');
    var yd = ''; for (var h = 0; h <= DAY + 0.001; h += 1) yd += (h ? 'L' : 'M') + X(h).toFixed(1) + ' ' + Y(yest(h)).toFixed(1);
    C.yest.setAttribute('d', yd);
    var rk = (clock * 0.38) % 1;
    set(C.dot, { cx: lx, cy: ly }); set(C.ring, { cx: lx, cy: ly, r: 3 + rk * 6 }); op(C.ring, 0.4 * (1 - rk));
    C.endPt = [lx, ly];
    // the total counts to the new number; the change against yesterday counts with it
    var money = '$' + Math.round(D.R);
    put(C.big, money);
    var up = D.pct >= 0, nw = textW(C.big, money.length * 17), cx0 = L.LX + nw + 6, ptxt = Math.round(Math.abs(D.pct)) + '%';
    put(C.chipTxt, ptxt);
    var cw = 20 + ptxt.length * 4.6;
    set(C.chipBg, { x: cx0, width: cw }); set(C.chipTxt, { x: cx0 + 14 });
    C.chipTri.setAttribute('d', up ? 'M' + (cx0 + 5).toFixed(1) + ' ' + (L.numY - 8.6) + 'l3.1-5 3.1 5z' : 'M' + (cx0 + 5).toFixed(1) + ' ' + (L.numY - 13.4) + 'l3.1 5 3.1-5z');
    op(C.chip, D.last ? (D.evs.length === 1 && !D.last.done ? smooth(seg(D.since, 0.2, 0.8)) : 1) : 0);
    C.chipBox = [cx0, L.numY - 18, cw];
    // the order count rolls to the new number as the row slides in
    var n = D.evs.length, k = D.enter, first = n === 1 && !D.last.done;
    put(C.cntA, String(Math.max(n - 1, 0))); put(C.cntB, String(n));
    op(C.cnt, n ? (first ? smooth(k) : 1) : 0);                 // no count until there is an order ("No orders yet" says it)
    tf(C.cntA, 0, -9 * smooth(k)); op(C.cntA, first ? 0 : 1 - smooth(k));
    tf(C.cntB, 0, first ? 0 : 9 * (1 - smooth(k))); op(C.cntB, first ? 1 : smooth(k));
    var lk = (clock * 0.45) % 1; set(C.liveRing, { r: 2.6 + lk * 4.5 }); op(C.liveRing, 0.55 * (1 - lk));
    // the newest orders: a new one slides in at the top, the oldest slides out under the bottom edge
    op(C.empty, n ? 0 : 1);
    var Lx = n - 1;
    C.rows.forEach(function (r, s) {
      var o = D.evs[Lx - s];
      if (!o) { op(r.g, 0); return; }
      tf(r.g, 0, L.ROWY + (s - (1 - k)) * L.ROWH);
      put(r.ini, o.who.charAt(0)); put(r.nm, o.who); put(r.pr, o.what); put(r.am, '$' + o.a);
      op(r.g, s === 0 ? k : s === L.N ? 1 - smooth(seg(k, 0, 0.5)) : 1);
      r.flash = s === 0 && !o.done ? 1 - smooth(seg(D.since, 0.6, 2.0)) : 0;
    });
  }

  function salesAnchor(C, D) {
    var L = C.L;
    return function (w) {
      if (w === 'in') return [L.x + L.w - 26, L.y + L.h - 34];
      if (w === 'cnt') return [(C.cntX || L.oLX + 30) + 15, L.ordY - 4.5];   // at the count's right end, clear of the first row
      if (w === 'row') return [L.oRX + 1, L.ROWY + 6];
      if (w === 'chip') return [C.chipBox[0] + C.chipBox[2] - 3, C.chipBox[1] + 13];
      var hh = w[1] === 'now' ? D.hnow : w[1] < 0 ? D.hnow + w[1] : w[1];
      return [C.X(Math.min(hh, D.hnow)), L.PL.y + w[2] * L.PL.h];
    };
  }

  /* Sales' hover: the chart guide and tooltip, the newest row, and the chip */
  function drawHover(C, D, st, S, tag) {
    var L = C.L, PL = L.PL, X = C.X, Y = C.Y;
    var inPlot = st.x >= PL.x - 2 && st.x <= PL.x + PL.w + 2 && st.y >= PL.y - 4 && st.y <= PL.y + PL.h + 4;
    var v = windows(S.xhair, S.now) * (inPlot ? 1 : 0) * st.o;
    op(C.xh, v); op(C.tt, v);
    if (v > 0) {
      var hs = clamp((st.x - PL.x) / PL.w * DAY, 0, D.hnow), gx = X(hs), tv = D.revAt(hs), yv = yest(hs);
      C.xhLine.setAttribute('d', 'M' + gx.toFixed(1) + ' ' + PL.y + 'V' + (PL.y + PL.h));
      set(C.xhT, { cx: gx, cy: Y(tv) }); set(C.xhY, { cx: gx, cy: Y(yv) });
      var m = Math.round((9 + hs) * 6) * 10, hh = Math.floor(m / 60), mm = m % 60;
      put(C.ttTime, ((hh % 12) || 12) + ':' + (mm < 10 ? '0' : '') + mm + (hh >= 12 ? ' pm' : ' am'));
      put(C.ttT, '$' + Math.round(tv)); put(C.ttY, '$' + Math.round(yv));
      var w = Math.max(textW(C.ttT, 18), textW(C.ttY, 18), textW(C.ttTime, 24) - 7.5) + 22, ty = PL.y - 7;
      C.ttBg.setAttribute('width', w.toFixed(1));
      // Left of the guide when it fits; but if Sales' tag is level with the tooltip, the side away from the tag.
      var byRoom = smooth(seg(gx - PL.x - w - 8, -6, 6));
      var level = smooth(seg(Math.min(tag.y1, ty + 35) - Math.max(tag.y0, ty), 0, 6)), away = smooth(seg((tag.x0 + tag.x1) / 2 - gx, -8, 8));
      var tx = mix(gx + 7, gx - 7 - w, mix(byRoom, away, level));
      tf(C.tt, clamp(tx, L.x + 6, L.x + L.w - 6 - w), ty);
    }
    // the newest row lights up when it arrives, and again while Sales looks at it
    var hit = st.x > L.oLX - 8 && st.x < L.oRX + 16 && st.y > L.ROWY - 4 && st.y < L.ROWY + 20 ? st.o : 0;
    C.rows.forEach(function (r, s) { op(r.bg, s === 0 ? Math.max(r.flash || 0, hit * 0.9) : 0); });
    // the chip explains itself when Sales points at it
    var cb = C.chipBox, ch = st.x > cb[0] - 2 && st.x < cb[0] + cb[2] + 4 && st.y > cb[1] - 2 && st.y < cb[1] + 20 ? st.o : 0;
    var tipW = textW(C.chipTipTxt, 40) + 12;
    C.chipTipBg.setAttribute('width', tipW.toFixed(1)); C.chipTipTxt.setAttribute('x', (tipW / 2).toFixed(1));
    tf(C.chipTip, cb[0] + cb[2] / 2 - tipW / 2, cb[1] - 15 + 2 * (1 - ch)); op(C.chipTip, ch * (D.last ? 1 : 0));
  }

  function drawPrompt(S, t) {
    var P = S.pill;
    op(pill, P.o); tf(pill, 0, P.y);
    if (P.o <= 0) return;
    var think = P.think;
    put(pillTxt, think ? 'Building your store' : (P.text || 'Describe your store'));
    pillTxt.setAttribute('fill', think || P.text ? INK : FAINT);
    var tw = textW(pillTxt, 0);
    set(pillCaret, { x: 138 + tw + 1.4 }); op(pillCaret, P.typing && !think ? (Math.floor(t * 2.6) % 2 ? 0.2 : 1) : 0);
    op(sendG, think ? 0 : 1); set(sendC, { r: P.press ? 8.6 : 10 });
    thinkDots.forEach(function (c, i) { op(c, think ? 0.25 + 0.75 * Math.max(0, Math.sin(t * 7 - i * 0.9)) : 0); });
  }

  /* a cursor: the arrow, and its name tag, which grows into a message when it talks */
  var CS = 1;                                                   // cursor scale: tags stay about 8px tall-text on any screen
  function tagRect(p, x, w, h, box, wFull) {
    var s = CS, side = p.sx;
    if (!side) side = mix(-1, 1, smooth(seg(box[2] - 5 - (x + (p.ox + wFull) * s), -10, 10)));
    var right = p.ox, left = -p.ox - w;
    return [mix(left, right, (side + 1) / 2), p.up ? p.oy - h : p.oy];
  }
  function drawCursor(C, st, list, now, box, clock, seed) {
    // While it waits it is never frozen: a slow wander, as if reading what it points at, plus a hand's slight tremor.
    var r = st.rest, c = clock;
    var x = st.x + r * (2.4 * Math.sin(c * 1.3 + seed) + 1.0 * Math.sin(c * 3.1 + seed * 1.7)) + 0.3 * Math.sin(c * 5.3 + seed);
    var y = st.y + r * (1.6 * Math.sin(c * 1.7 + seed * 2.3) + 0.7 * Math.sin(c * 3.7 + seed)) + 0.3 * Math.sin(c * 4.7 + seed * 3);
    op(C.g, st.o); tf(C.g, x, y, CS);
    // it leans into fast moves, and squeezes a little when it presses
    var lean = 9 * Math.tanh(st.vx / 650);                    // soft limit, so the lean eases in and out
    C.arrow.setAttribute('transform', 'rotate(' + lean.toFixed(2) + ')' + (st.p > 0.01 ? ' scale(' + (1 - 0.12 * st.p).toFixed(3) + ')' : ''));
    var b = null, k = 0, i;
    for (i = 0; i < list.length; i++) { var kk = ramp(now, list[i][0], list[i][0] + 0.32, list[i][1] - 0.3, list[i][1]); if (kk > k) { k = kk; b = list[i]; } }
    if (!C.nw) C.nw = textW(C.nm, C.name.length * 3.6);
    if (b && C.last !== b[2]) { C.last = b[2]; put(C.msg, b[2]); C.mw = textW(C.msg, b[2].length * 3.8); }
    var tagW = C.nw + 14, bubW = Math.max(C.nw, C.mw) + 14, kk2 = smooth(k);
    var w = mix(tagW, bubW, kk2), h = mix(14, 27.5, kk2), wFull = b ? bubW : tagW;
    var ra = tagRect(st.pa, x, w, h, box, wFull), rb = tagRect(st.pb, x, w, h, box, wFull);
    var left = mix(ra[0], rb[0], st.pk), top = mix(ra[1], rb[1], st.pk);
    // the tag trails behind a fast move and swings back as the cursor settles
    left -= 9 * Math.tanh(st.vx / 320) / CS; top -= 6 * Math.tanh(st.vy / 300) / CS;
    // a tag changing sides swings under the arrow, never through it
    var vOv = Math.min(top + h, 17) - Math.max(top, 0), hOv = Math.min(left + w, 12) - Math.max(left, -1);
    if (vOv > 0 && hOv > 0) top = mix(top, 17, smooth(clamp(Math.min(vOv, hOv) / 5, 0, 1)));
    left = clamp(left, (box[0] + 3 - x) / CS, (box[2] - 3 - x) / CS - w);   // never past the edge of its window or card
    top = clamp(top, (box[1] + 3 - y) / CS, (box[3] - 3 - y) / CS - h);
    tf(C.tag, left, top);
    set(C.bg, { width: w, height: h, rx: mix(7, 8, kk2) }); set(C.clip, { width: w, height: h });
    op(C.nm, mix(1, 0.72, kk2)); op(C.msg, smooth(seg(k, 0.45, 1))); tf(C.msg, 0, 2 * (1 - kk2));
    return { x0: x + left * CS, y0: y + top * CS, x1: x + (left + w) * CS, y1: y + (top + h) * CS, o: st.o };
  }

  /* ================= one frame ================= */
  var M = false, CA = CARD.d, clock = 0;
  function render(S, t) {
    var now = S.now;
    var ui = motion(S.uiKeys, now, uiAnchor(S, now), uiAnchor(S, now - 0.04));
    ui.o = S.uiO; ui.p = Math.max(ui.press, pressOf(S.uiClicks, now));
    drawStore(S, ui);
    drawPrompt(S, t);
    tf(CA.g, 0, 6 * (1 - S.card)); op(CA.g, S.card);
    var D = salesData(S, t);
    drawCard(CA, D, t);
    var sa = motion(S.salesKeys, now, salesAnchor(CA, D));
    sa.o = S.salesO; sa.p = 0;
    var stag = drawCursor(SALESC, sa, S.bubbles.sales, now, CA.L.box, t, 2);
    drawHover(CA, D, sa, S, stag);
    drawGuides(S, ui);
    drawCursor(UIC, ui, S.bubbles.ui, now, [0.5, 0.5, 429.5, 279.5], t, 0);
    // a soft ring where UI clicks or picks something up
    var used = 0;
    rings.forEach(function (r) { op(r, 0); });
    S.uiClicks.forEach(function (ct) {
      var dd = now - ct; if (dd < 0 || dd > 0.55 || used > 1) return;
      var at = track(S.uiKeys, ct, uiAnchor(S, ct)), r = rings[used++];
      set(r, { cx: at.x, cy: at.y, r: 2.5 + (dd / 0.55) * 15, stroke: INK }); op(r, 0.28 * (1 - dd / 0.55) * S.uiO);
    });
  }

  /* ================= captions (the page's headline area, intro only) ================= */
  var capBox = null, capEls = [];
  function buildCaps() {
    capBox = document.createElement('div'); capBox.className = 'hi-caps'; capBox.setAttribute('aria-hidden', 'true');
    CAPS.forEach(function (c) {
      var d = document.createElement('div'); d.className = 'hero__title hi-cap';
      var parts = c[2].split(' ');
      var words = parts.map(function (w, i) {
        var s = document.createElement('span'); s.className = 'cw'; s.textContent = w; d.appendChild(s);
        if (i < parts.length - 1) d.appendChild(document.createTextNode(' '));
        return s;
      });
      capBox.appendChild(d); capEls.push({ a: c[0], b: c[1], words: words });
    });
    col.insertBefore(capBox, title);
    placeCaps();
  }
  function placeCaps() {
    if (!capBox) return;
    capBox.style.cssText = 'position:absolute;left:' + title.offsetLeft + 'px;top:' + title.offsetTop + 'px;width:' + title.offsetWidth + 'px;pointer-events:none';
  }
  function setCaps(t) {
    capEls.forEach(function (c) {
      var out = 1 - smooth(seg(t, c.b - 0.35, c.b));
      c.words.forEach(function (w, i) {
        var k = smooth(seg(t, c.a + i * 0.09, c.a + i * 0.09 + 0.45)) * out;
        w.style.opacity = k.toFixed(3); w.style.transform = 'translateY(' + (0.4 * (1 - smooth(seg(t, c.a + i * 0.09, c.a + i * 0.09 + 0.55)))).toFixed(3) + 'em)';
      });
    });
  }

  /* ================= layout: wide or phone ================= */
  function setLayout() {
    M = narrow.matches; CA = M ? CARD.m : CARD.d;
    CARD.d.g.style.display = M ? 'none' : ''; CARD.m.g.style.display = M ? '' : 'none';
    svg.setAttribute('viewBox', '0 0 ' + CA.L.vb[0] + ' ' + CA.L.vb[1]);
    var ppu = (art.clientWidth || 600) / CA.L.vb[0];            // screen pixels per SVG unit
    CS = clamp(7.8 / (7 * ppu), 1, 1.6);
  }
  setLayout();

  function draw(t) {
    t = Math.max(0, t);
    clock = t;
    var loopMode = t >= INTRO_END, u = loopMode ? (((t - INTRO_END) % LOOP) + LOOP) % LOOP : t;
    render(loopMode ? loopState(u, t) : introState(t), t);
    if (capBox) setCaps(t);
  }
  window.__heroArtAt = draw;
  function relayout() { setLayout(); placeCaps(); draw(clock); }
  if (narrow.addEventListener) narrow.addEventListener('change', relayout);
  window.addEventListener('resize', function () { setLayout(); placeCaps(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
    CARD.d.placed = CARD.m.placed = false; UIC.nw = SALESC.nw = 0; UIC.last = SALESC.last = ''; draw(clock);
  });

  /* ================= the intro: plays in place, then the real headline arrives ================= */
  var REVEAL = [[18.9, 'hi-title'], [19.4, 'hi-lead'], [19.6, 'hi-actions'], [19.8, 'hi-rest']];
  var skip = null;
  function endIntro() {
    if (endIntro.done) return; endIntro.done = true;
    REVEAL.forEach(function (s) { root.classList.add(s[1]); });
    if (skip) skip.classList.add('is-gone');
    setTimeout(function () {
      root.classList.remove('hero-intro', 'hi-ready', 'hi-title', 'hi-lead', 'hi-actions', 'hi-rest');
      if (capBox && capBox.parentNode) capBox.parentNode.removeChild(capBox);
      capBox = null;
      if (skip && skip.parentNode) skip.parentNode.removeChild(skip);
    }, 1300);
    ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { window.removeEventListener(ev, onInput); });
  }
  function skipIntro() {
    if (!intro || clock >= INTRO_END) return;
    elapsedBase = INTRO_END; start = performance.now();
    draw(INTRO_END);
    endIntro();
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
    buildCaps();
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
    // If anything else has shown the page, the intro must not play captions over the real headline: end it now.
    if (intro && !endIntro.done && !root.classList.contains('hero-intro')) { skipIntro(); raf = requestAnimationFrame(frame); return; }
    var t = elapsedBase + (now - start) / 1000;
    draw(t);
    if (intro && !endIntro.done) REVEAL.forEach(function (s) { if (t >= s[0]) root.classList.add(s[1]); });
    if (intro && t >= INTRO_END + 0.1) endIntro();
    raf = requestAnimationFrame(frame);
  }
  function run() { if (raf || !visible || document.hidden) return; start = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { if (!raf) return; cancelAnimationFrame(raf); raf = 0; elapsedBase = clock; }
  if ('IntersectionObserver' in window) {
    // The scene only runs while it is on screen. If it is not (say a reload put you further down the page), skip the
    // intro rather than keep the page hidden while it waits.
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) run(); else { if (intro && clock < INTRO_END) skipIntro(); stop(); }
    }).observe(art);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (intro && clock < INTRO_END) skipIntro(); stop(); } else run();
  });
  run();
})();
