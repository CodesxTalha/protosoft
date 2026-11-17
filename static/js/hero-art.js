/* ---------- Hero art: AI builds a store fast, our team makes it right ----------
   One SVG (.hero__art) with two things in it: a browser window with an online store, and a sales card.
   Everything is a function of time, so any moment can be drawn (window.__heroArtAt(t), used for checking).
   The numbers on the sales card are an illustration, not results.

   Two Protosofts cursors work in it. "UI" changes the store. "Sales" watches the numbers and the orders, and the two
   talk in small chat bubbles.

   The intro (first visit in a session, or a reload, about 20 s):
      0.3  You ask an AI for a store. It builds a generic one in seconds: centred text, a grey square button, broken
           pictures, uneven cards. Sales are slow.
      8.2  Sales checks the numbers and says so. UI answers and fixes the page piece by piece: picture, headline, button,
           cards. Orders start to arrive more often.
     18.9  The real headline: AI builds it fast. We make it right.
   Captions sit where the headline will be and rise in word by word.

   Revenue only changes when an order arrives: the new order slides into the list, the total counts up to the new number,
   and the chart steps up. Then a calm loop of 18 s: UI tests a new headline, Sales watches how it does, UI reverts.
   With reduced motion it is one still frame. Skip, Escape or scrolling ends the intro. */
(function () {
  var art = document.querySelector('.hero__art');
  if (!art) return;
  var root = document.documentElement, col = art.parentNode;
  var title = col.querySelector('.hero__title'), actions = col.querySelector('.hero__actions');
  var intro = root.classList.contains('hero-intro') && !!title && !!actions;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!intro) root.classList.remove('hero-intro');

  var INTRO_END = 20.2, LOOP = 18;

  /* ================= helpers ================= */
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 660 280');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  art.appendChild(svg);
  var narrow = window.matchMedia('(max-width: 640px)'), VIEW_W = 430, PAN_TO = 660 - VIEW_W, lastView = '';

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
  function tf(e, x, y, s) { e.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ')' + (s != null && s !== 1 ? ' scale(' + s.toFixed(3) + ')' : '')); }
  function op(e, v) { e.setAttribute('opacity', (+v).toFixed(3)); }
  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  function blend(a, b, k) { var x = hex(a), y = hex(b); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(mix(x[i], y[i], k)); }).join(',') + ')'; }
  function ramp(t, a, b, c, d) { return smooth(seg(t, a, b)) * (1 - smooth(seg(t, c, d))); }   // fades in a..b, out c..d
  function textW(e, fallback) { var w = 0; try { w = e.getComputedTextLength(); } catch (err) { w = 0; } return w || fallback; }

  var SOFT = '#ececea', INK = '#141414', MUTED = '#6a6a6a', EDGE = '#d9d9d7', FILL = '#efefed', HAIR = '#ececea', ERR = '#b3261e', UP = '#1e7a46';
  var SANS = 'Inter Tight, system-ui, sans-serif', SERIF = 'Georgia, "Times New Roman", serif';
  var SPARK = 'M0 -5C.6 -1.6 1.6 -.6 5 0C1.6 .6 .6 1.6 0 5C-.6 1.6 -1.6 .6 -5 0C-1.6 -.6 -.6 -1.6 0 -5Z';

  /* ================= defs ================= */
  var defs = el('defs', {});
  var shadow = el('filter', { id: 'ha-sh', x: '-20%', y: '-20%', width: '140%', height: '150%' }, defs);
  el('feDropShadow', { dx: 0, dy: 8, stdDeviation: 10, 'flood-color': '#000', 'flood-opacity': 0.07 }, shadow);
  el('feDropShadow', { dx: 0, dy: 1, stdDeviation: 1, 'flood-color': '#000', 'flood-opacity': 0.04 }, shadow);
  var winClip = el('clipPath', { id: 'ha-win' }, defs); el('rect', { x: 0.5, y: 0.5, width: 429, height: 279, rx: 14 }, winClip);
  var grad = el('linearGradient', { id: 'ha-fill', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': INK, 'stop-opacity': 0.08 }, grad);
  el('stop', { offset: 1, 'stop-color': INK, 'stop-opacity': 0 }, grad);
  var wipes = [0, 1, 2, 3].map(function (i) {                 // wipe-in clips: 0 is the hero picture, 1 to 3 are the product pictures
    var c = el('clipPath', { id: 'ha-wipe' + i }, defs);
    return el('rect', { x: 0, y: -2, width: 0, height: 120 }, c);
  });
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

  var page = el('g', { transform: 'translate(0 28)' }, inner);   // the store, in its own coordinates (430 x 252). Side margins are 28.

  /* nav: the same in both versions */
  var navG = el('g', {}, page);
  txt('haven', { x: 28, y: 23, 'font-size': 10.5, 'font-weight': 700, 'letter-spacing': -0.3, fill: INK, 'font-family': SANS }, navG);
  txt('Shop', { x: 318, y: 22.4, 'font-size': 7.3, fill: MUTED, 'font-family': SANS }, navG);
  txt('About', { x: 349, y: 22.4, 'font-size': 7.3, fill: MUTED, 'font-family': SANS }, navG);
  el('path', { d: 'M384.5 14.5h11v9.5a2 2 0 01-2 2h-7a2 2 0 01-2-2zM387 14.5v-1.4a3 3 0 016 0v1.4', fill: 'none', stroke: INK, 'stroke-width': 1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, navG);
  el('circle', { cx: 396, cy: 14, r: 4.4, fill: INK, stroke: '#fff', 'stroke-width': 1.2 }, navG);
  txt('1', { x: 396, y: 16, 'font-size': 5.4, 'font-weight': 600, 'text-anchor': 'middle', fill: '#fff', 'font-family': SANS }, navG);

  /* hero picture: a broken strip that becomes a framed picture, in the style of the design illustration */
  var IMG_BAD = { x: 28, y: 42, w: 374, h: 48, r: 6 }, IMG_GOOD = { x: 270, y: 44, w: 132, h: 104, r: 10 };
  var imgRect = el('rect', {}, page);
  var imgX = el('path', { fill: 'none', stroke: '#d4d3d0', 'stroke-width': 1 }, page);
  var imgArt = el('g', { 'clip-path': 'url(#ha-wipe0)' }, page);
  var heroClip = el('clipPath', { id: 'ha-herobox' }, defs); el('rect', { x: 0, y: 0, width: IMG_GOOD.w, height: IMG_GOOD.h, rx: IMG_GOOD.r }, heroClip);
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

  /* headline: the generic one (centred serif), and ours in two versions (left, sans). The headline block is centred on the
     picture: the cap height of line 1 down to the bottom of the button spans 54 to 138, the picture 44 to 148. */
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

  /* three products: uneven broken cards, then an even grid with flat soft pictures. Gaps are 16 both ways. */
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
    el('circle', { r: 8, fill: '#fff', stroke: EDGE }, plus);
    el('path', { d: 'M-2.8 0H2.8M0 -2.8V2.8', fill: 'none', stroke: INK, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, plus);
    return { g: g, box: box, x: x, art: artG, oldPrice: oldPrice, name: name, price: price, plus: plus };
  });

  /* the AI prompt, before there is a page */
  var pill = el('g', {}, inner);
  el('rect', { x: 105.5, y: 120.5, width: 219, height: 30, rx: 15, fill: '#fff', stroke: EDGE, filter: 'url(#ha-sh)' }, pill);
  el('path', { d: SPARK, transform: 'translate(124 135.5)', fill: INK }, pill);
  var pillClipR = el('clipPath', { id: 'ha-pillclip' }, defs); el('rect', { x: 136, y: 124, width: 150, height: 22 }, pillClipR);
  var pillTxt = txt('', { x: 138, y: 138.4, 'font-size': 7.9, fill: INK, 'font-family': SANS }, el('g', { 'clip-path': 'url(#ha-pillclip)' }, pill));
  var pillCaret = el('rect', { y: 130.5, width: 0.9, height: 10, fill: INK }, pill);
  var sendG = el('g', {}, pill);
  var sendC = el('circle', { cx: 307, cy: 135.5, r: 10, fill: INK }, sendG);
  el('path', { d: 'M303.2 135.5H310M307 132L310.2 135.5L307 139', fill: 'none', stroke: '#fff', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sendG);
  var thinkDots = [0, 1, 2].map(function (i) { return el('circle', { cx: 301 + i * 6, cy: 135.5, r: 1.7, fill: INK }, pill); });

  /* ================= the sales card ================= */
  /* Same height as the window, and its header band lines up with the window's title bar. The new order, the total and the
     chart step all move together; the bottom row of the orders list sits on the same baseline as the product names. */
  var CX = 458.5, CY = 0.5, CW = 201, CH = 279, LX = CX + 18, RX = CX + CW - 18;
  var card = el('g', {});
  el('rect', { x: CX, y: CY, width: CW, height: CH, rx: 14, fill: '#fff', filter: 'url(#ha-sh)' }, card);
  var cardIn = el('g', {}, card);
  el('rect', { x: CX, y: CY, width: CW, height: CH, rx: 14, fill: 'none', stroke: EDGE }, card);
  el('path', { d: 'M' + CX + ' 28.5H' + (CX + CW), stroke: HAIR }, card);
  txt('Revenue', { x: LX, y: 17.2, 'font-size': 7.8, 'font-weight': 500, fill: MUTED, 'font-family': SANS }, card);
  el('circle', { cx: RX - 62, cy: 14.4, r: 2.3, fill: INK }, card);
  txt('Today', { x: RX - 56, y: 16.8, 'font-size': 6.6, fill: MUTED, 'font-family': SANS }, card);
  el('path', { d: 'M' + (RX - 31) + ' 14.4H' + (RX - 23), stroke: '#a9a9a7', 'stroke-width': 1.2, 'stroke-dasharray': '2 1.6', 'stroke-linecap': 'round' }, card);
  txt('Yesterday', { x: RX - 19, y: 16.8, 'font-size': 6.6, fill: MUTED, 'font-family': SANS }, card);
  var bigTxt = txt('', { x: LX - 1, y: 66, 'font-size': 30, 'font-weight': 600, 'letter-spacing': -1.2, fill: INK, 'font-family': SANS }, cardIn);
  var chip = el('g', {}, cardIn);
  var chipBg = el('rect', { y: 48, height: 16, width: 44, rx: 8, fill: FILL }, chip);
  var chipTri = el('path', { fill: UP }, chip);
  var chipTxt = txt('', { y: 59.2, 'font-size': 7.6, 'font-weight': 600, fill: UP, 'font-family': SANS }, chip);
  var plusAmt = txt('', { x: RX, y: 66, 'font-size': 8, 'font-weight': 600, 'text-anchor': 'end', fill: UP, 'font-family': SANS }, cardIn);
  var PL = { x: LX + 28, y: 90, w: RX - LX - 28, h: 82 }, YMAX = 600;
  [0, 200, 400, 600].forEach(function (v) {
    var y = PL.y + PL.h - v / YMAX * PL.h;
    el('path', { d: 'M' + PL.x + ' ' + y.toFixed(1) + 'H' + RX, stroke: v ? '#e8e8e6' : '#dcdcda', 'stroke-width': v ? 0.8 : 1, 'stroke-dasharray': v ? '1.5 3' : 'none' }, cardIn);
    txt('$' + v, { x: PL.x - 7, y: y + 2.2, 'font-size': 6.2, 'text-anchor': 'end', fill: '#9a9a98', 'font-family': SANS }, cardIn);
  });
  [['9am', 0, 'start'], ['12pm', 0.25, 'middle'], ['3pm', 0.5, 'middle'], ['6pm', 0.75, 'middle'], ['9pm', 1, 'end']].forEach(function (a) {
    txt(a[0], { x: PL.x + PL.w * a[1], y: PL.y + PL.h + 13, 'font-size': 6.2, 'text-anchor': a[2], fill: '#9a9a98', 'font-family': SANS }, cardIn);
  });
  var plotClip = el('clipPath', { id: 'ha-plot' }, defs); el('rect', { x: PL.x - 4, y: PL.y - 14, width: PL.w + 12, height: PL.h + 18 }, plotClip);
  var plotG = el('g', { 'clip-path': 'url(#ha-plot)' }, cardIn);
  var yestP = el('path', { fill: 'none', stroke: '#a9a9a7', 'stroke-width': 1.2, 'stroke-dasharray': '2.4 2.4', 'stroke-linecap': 'round' }, plotG);
  var areaP = el('path', { fill: 'url(#ha-fill)' }, plotG);
  var lineP = el('path', { fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, plotG);
  var ringP = el('circle', { fill: 'none', stroke: INK, 'stroke-width': 0.8 }, cardIn);
  var dotP = el('circle', { r: 2.8, fill: INK, stroke: '#fff', 'stroke-width': 1.3 }, cardIn);
  var bub = el('g', {}, cardIn);
  var bubBg = el('rect', { height: 14, rx: 5, fill: INK }, bub);
  var bubTxt = txt('', { 'font-size': 6.9, 'font-weight': 600, 'text-anchor': 'middle', fill: '#fff', 'font-family': SANS }, bub);

  el('path', { d: 'M' + CX + ' 197.5H' + (CX + CW), stroke: HAIR }, card);
  txt('Orders', { x: LX, y: 212, 'font-size': 7.8, 'font-weight': 500, fill: MUTED, 'font-family': SANS }, cardIn);
  var liveRing = el('circle', { cx: RX - 2, cy: 209.2, r: 3, fill: 'none', 'stroke-width': 0.8, stroke: UP }, cardIn);
  el('circle', { cx: RX - 2, cy: 209.2, r: 2.5, fill: UP }, cardIn);
  var ROWY = 219.4, ROWH = 17;
  var rowClip = el('clipPath', { id: 'ha-rows' }, defs); el('rect', { x: CX + 4, y: ROWY - 2, width: CW - 8, height: ROWH * 3 + 4 }, rowClip);
  var rowsG = el('g', { 'clip-path': 'url(#ha-rows)' }, cardIn);
  var emptyT = txt('No orders yet', { x: LX, y: ROWY + 10.6, 'font-size': 7.4, fill: '#9a9a98', 'font-family': SANS }, rowsG);
  var rowEls = [0, 1, 2, 3].map(function () {
    var g = el('g', {}, rowsG);
    var bg = el('rect', { x: LX - 6, y: -1, width: RX - LX + 12, height: 17, rx: 6, fill: '#f2f2f0' }, g);
    el('circle', { cx: LX + 6, cy: 8, r: 6, fill: SOFT }, g);
    var ini = txt('', { x: LX + 6, y: 10.2, 'font-size': 5.8, 'font-weight': 600, 'text-anchor': 'middle', fill: INK, 'font-family': SANS }, g);
    var nm = txt('', { x: LX + 17, y: 10.6, 'font-size': 7.2, 'font-weight': 500, fill: INK, 'font-family': SANS }, g);
    var pr = txt('', { x: LX + 61, y: 10.6, 'font-size': 6.8, fill: MUTED, 'font-family': SANS }, g);
    var am = txt('', { x: RX - 2, y: 10.6, 'font-size': 7.4, 'font-weight': 600, 'text-anchor': 'end', fill: INK, 'font-family': SANS }, g);
    return { g: g, bg: bg, ini: ini, nm: nm, pr: pr, am: am };
  });

  /* ================= the team's cursors, click rings and chat bubbles ================= */
  var rings = [0, 1, 2, 3].map(function () { return el('circle', { fill: 'none', 'stroke-width': 0.9 }, svg); });
  function makeCursor(label, color) {
    var g = el('g', {});
    var tagW = label.length * 3.7 + 14;
    var tag = el('g', {}, g);
    el('rect', { x: 0, y: 0, width: tagW, height: 14, rx: 7, fill: color }, tag);
    txt(label, { x: tagW / 2, y: 9.6, 'font-size': 6.9, 'font-weight': 500, 'text-anchor': 'middle', fill: '#fff', 'font-family': SANS }, tag);
    var bubble = el('g', {}, g);
    var bbg = el('rect', { height: 17, rx: 8.5, fill: '#fff', stroke: EDGE, filter: 'url(#ha-sh)' }, bubble);
    el('circle', { cx: 9, cy: 8.5, r: 2.4, fill: color }, bubble);
    var btx = txt('', { x: 16, y: 11.4, 'font-size': 7.1, 'font-weight': 500, fill: INK, 'font-family': SANS }, bubble);
    var arrow = el('path', { d: 'M0 0V14L3.9 10.7L6.6 16.6L9 15.5L6.3 9.7H11.3Z', fill: color, stroke: '#fff', 'stroke-width': 1.1, 'stroke-linejoin': 'round' }, g);
    return { g: g, tag: tag, tagW: tagW, bubble: bubble, bbg: bbg, btx: btx, arrow: arrow, color: color, last: '', bw: 60 };
  }
  var UIC = makeCursor('UI team', INK), SALESC = makeCursor('Sales team', UP);

  /* ================= timing ================= */
  var REST_UI = [190, 172];
  var UI_INTRO = [[8.9, 480, 296], [9.9, 332, 96], [11.45, 332, 96], [12.1, 222, 140], [13.55, 222, 140], [14.1, 222, 176], [15.2, 222, 176], [15.9, 204, 222], [18.3, 204, 222], [19.3, REST_UI[0], REST_UI[1]]];
  var UI_LOOP = [[0, REST_UI[0], REST_UI[1]], [5.5, REST_UI[0], REST_UI[1]], [6.6, 110, 112], [7.4, 110, 112], [8.7, REST_UI[0], REST_UI[1]], [14.0, REST_UI[0], REST_UI[1]], [14.6, 110, 112], [15.4, 110, 112], [16.8, REST_UI[0], REST_UI[1]], [18, REST_UI[0], REST_UI[1]]];
  var SALES_INTRO = [[8.2, 'in'], [9.3, 'dot'], [12.2, 'dot'], [13.0, 'num'], [14.0, 'num'], [14.8, 'rows'], [16.0, 'rows'], [16.8, 'dot'], [18.0, 'dot'], [18.7, 'num'], [19.3, 'dot'], [20.2, 'dot']];
  var SALES_LOOP = [[0, 'dot'], [3.0, 'dot'], [3.9, 'rows'], [5.2, 'rows'], [5.9, 'num'], [6.9, 'num'], [7.7, 'dot'], [9.0, 'dot'], [9.5, 'rows'], [10.4, 'rows'], [11.1, 'dot'], [12.6, 'dot'], [13.5, 'num'], [14.6, 'num'], [15.6, 'dot'], [18, 'dot']];
  var CLICK_UI_INTRO = [10.05, 12.25, 14.25, 16.05], CLICK_SALES_INTRO = [9.55, 13.2, 14.95, 17.0];
  var CLICK_UI_LOOP = [7.35, 15.0], CLICK_SALES_LOOP = [4.0, 6.1, 9.7, 13.7];
  var MORPH = { img: [10.35, 11.7], head: 12.6, btn: [14.55, 15.4], cards: 16.4 };
  var BUBBLES = {
    intro: { ui: [[10.2, 11.8, 'On it'], [18.5, 19.7, 'All set']], sales: [[9.45, 11.4, 'Sales are low'], [14.9, 16.7, 'First orders are in'], [18.0, 19.6, 'Above yesterday']] },
    loop: { ui: [[5.5, 7.1, 'Testing a new headline'], [14.3, 15.6, 'Reverting']], sales: [[4.2, 6.3, 'Bowl is selling'], [9.5, 11.4, 'Watching the new headline'], [13.6, 15.5, 'No change. Keep the first']] }
  };
  /* orders: [time, amount, who, what]. Intro times are scene seconds; loop times are seconds into the loop. */
  var ORD_INTRO = [[7.9, 24, 'Omar R.', 'Mug'], [11.9, 24, 'Lina M.', 'Mug'], [14.6, 38, 'Sara K.', 'Bowl'], [15.7, 46, 'Noah P.', 'Vase'],
                   [16.6, 48, 'Ana T.', 'Mug x2'], [17.5, 76, 'Sara K.', 'Bowl x2'], [18.4, 46, 'Omar R.', 'Vase'], [19.3, 76, 'Lina M.', 'Bowl x2']];
  var ORD_LOOP = [[3.5, 38, 'Noah P.', 'Bowl'], [8.2, 48, 'Ana T.', 'Mug x2'], [13.0, 46, 'Sara K.', 'Vase']];

  var CAPS = [[0.3, 5.2, 'AI builds a website in seconds.'], [5.6, 8.7, "But fast isn't the same as selling."], [8.9, 12.0, 'So our team steps in.'],
              [12.1, 15.7, 'We shape every detail by hand.'], [15.8, 18.7, 'And the site starts to sell.']];

  function arc(a, b, k) {                                       // a slight bow, so it moves like a hand
    var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1, bow = Math.sin(Math.PI * k) * d * 0.07;
    return [mix(a[0], b[0], k) - dy / d * bow, mix(a[1], b[1], k) + dx / d * bow];
  }
  function pathAt(keys, t) {                                   // keys [[time, x, y], ...]
    if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (var i = 0; i < keys.length - 1; i++) {
      var a = keys[i], b = keys[i + 1];
      if (t <= b[0]) return arc([a[1], a[2]], [b[1], b[2]], smooth(seg(t, a[0], b[0])));
    }
    var l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  var DOT = [0, 0];                                            // where the chart's latest point is this frame (set by drawSales)
  function anchor(name) {
    if (name === 'dot') return [DOT[0] + 8, DOT[1] + 6];
    if (name === 'rows') return [RX - 26, ROWY + 9];
    if (name === 'num') return [LX + 40, 73];
    return [684, 262];
  }
  function salesAt(keys, t) {                                  // the Sales cursor points at things that move, so its keys are anchors
    if (t <= keys[0][0]) return anchor(keys[0][1]);
    for (var i = 0; i < keys.length - 1; i++) {
      var a = keys[i], b = keys[i + 1];
      if (t <= b[0]) return arc(anchor(a[1]), anchor(b[1]), smooth(seg(t, a[0], b[0])));
    }
    return anchor(keys[keys.length - 1][1]);
  }
  function pressOf(list, t) { for (var i = 0; i < list.length; i++) { var d = t - list[i]; if (d > 0 && d < 0.22) return Math.sin(Math.PI * d / 0.22); } return 0; }
  function prog(t, a, b) { return inOut(seg(t, a, b)); }
  function cardProg(t, j) { return inOut(seg(t, MORPH.cards + j * 0.28, MORPH.cards + 1.3 + j * 0.28)); }

  /* headline changes: the old lines lift and soften away, the new ones rise in from below, line by line.
     Each entry is [visibility 0..1, +1 if the line is arriving (comes up from below) or -1 if leaving (goes up)]. */
  function headVis(loop, t) {
    var bad = [], A = [], B = [], i;
    for (i = 0; i < 3; i++) {
      if (!loop) {
        var o = seg(t, MORPH.head + i * 0.07, MORPH.head + 0.6 + i * 0.07), n = seg(t, MORPH.head + 0.35 + i * 0.09, MORPH.head + 1.05 + i * 0.09);
        bad.push([1 - o, -1]); A.push([n, 1]); B.push([0, 1]);
      } else if (t < 15.05) {
        A.push([1 - seg(t, 7.5 + i * 0.07, 8.1 + i * 0.07), -1]); B.push([seg(t, 7.85 + i * 0.09, 8.55 + i * 0.09), 1]); bad.push([0, -1]);
      } else {
        B.push([1 - seg(t, 15.1 + i * 0.07, 15.7 + i * 0.07), -1]); A.push([seg(t, 15.45 + i * 0.09, 16.15 + i * 0.09), 1]); bad.push([0, -1]);
      }
    }
    bad.length = 2;
    return { bad: bad, A: A, B: B };
  }

  function introState(t) {
    var S = { loop: false, t: t };
    S.build = []; for (var i = 0; i < 6; i++) S.build.push(smooth(seg(t, 4.1 + i * 0.2, 4.7 + i * 0.2)));
    S.p = { img: prog(t, MORPH.img[0], MORPH.img[1]), btn: prog(t, MORPH.btn[0], MORPH.btn[1]) };
    S.cp = [0, 1, 2].map(function (j) { return cardProg(t, j); });
    S.f = smooth(seg(t, 4.9, 5.7));
    S.card = smooth(seg(t, 4.6, 5.4));
    var typedN = Math.round(29 * seg(t, 0.9, 2.5));
    S.pill = { o: ramp(t, 0.2, 0.7, 3.9, 4.3), text: 'A store for handmade ceramics'.slice(0, typedN), typing: t < 2.7, press: t > 2.75 && t < 2.9, think: t >= 2.95, y: 8 * smooth(seg(t, 3.9, 4.3)) };
    S.ui = { o: smooth(seg(t, 8.9, 9.4)), p: pathAt(UI_INTRO, t), press: pressOf(CLICK_UI_INTRO, t) };
    S.sales = { o: smooth(seg(t, 8.2, 8.7)), keys: SALES_INTRO, at: t, press: pressOf(CLICK_SALES_INTRO, t) };
    S.clicks = [[CLICK_UI_INTRO, 'ui', UI_INTRO], [CLICK_SALES_INTRO, 'sales', SALES_INTRO]];
    S.bubbles = BUBBLES.intro;
    S.head = headVis(false, t);
    S.pan = clamp(ramp(t, 5.4, 6.2, 8.2, 9.0) + ramp(t, 16.4, 17.2, 18.6, 19.4), 0, 1);
    return S;
  }
  function loopState(u, t) {
    var S = { loop: true, t: t, u: u };
    S.build = [1, 1, 1, 1, 1, 1]; S.p = { img: 1, btn: 1 }; S.cp = [1, 1, 1]; S.f = 1; S.card = 1;
    S.pill = { o: 0, text: '', typing: false, press: false, think: false, y: 0 };
    S.ui = { o: 1, p: pathAt(UI_LOOP, u), press: pressOf(CLICK_UI_LOOP, u) };
    S.sales = { o: 1, keys: SALES_LOOP, at: u, press: pressOf(CLICK_SALES_LOOP, u) };
    S.clicks = [[CLICK_UI_LOOP, 'ui', UI_LOOP], [CLICK_SALES_LOOP, 'sales', SALES_LOOP]];
    S.bubbles = BUBBLES.loop;
    S.head = headVis(true, u);
    S.pan = clamp(ramp(u, 2.8, 3.6, 7.0, 7.8) + ramp(u, 12.8, 13.5, 15.0, 15.8), 0, 1);
    return S;
  }

  /* ================= drawing one state ================= */
  function lerpBox(a, b, k) { return { x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), w: mix(a.w, b.w, k), h: mix(a.h, b.h, k) }; }
  function imgBox(p) { var a = inOut(seg(p, 0, 0.5)), b = inOut(seg(p, 0.45, 1)); return { x: mix(IMG_BAD.x, IMG_GOOD.x, a), w: mix(IMG_BAD.w, IMG_GOOD.w, a), y: mix(IMG_BAD.y, IMG_GOOD.y, b), h: mix(IMG_BAD.h, IMG_GOOD.h, b) }; }

  function drawHead(S) {
    ['bad', 'A', 'B'].forEach(function (k) {
      HEAD[k].forEach(function (e, i) {
        var v = S.head[k][i], vis = smooth(v[0]), soft = (1 - vis) * 2.2, rise = (1 - vis) * (v[1] > 0 ? 7 : -6);
        op(e, vis * S.build[2]);
        tf(e, 0, rise);
        HEAD_BLUR[k][i].setAttribute('stdDeviation', soft.toFixed(2));
        if (soft > 0.05 && vis > 0) e.setAttribute('filter', e._f); else e.removeAttribute('filter');
      });
    });
  }

  function drawStore(S, t) {
    var B = S.build;
    // picture
    var pi = S.p.img, ib = imgBox(pi), ir = mix(IMG_BAD.r, IMG_GOOD.r, pi);
    set(imgRect, { x: ib.x, y: ib.y, width: ib.w, height: ib.h, rx: ir, fill: blend('#efefed', '#ececea', pi), stroke: pi > 0.5 ? 'none' : EDGE });
    imgRect.setAttribute('stroke-width', 1);
    imgX.setAttribute('d', 'M' + ib.x + ' ' + ib.y + 'L' + (ib.x + ib.w) + ' ' + (ib.y + ib.h) + 'M' + (ib.x + ib.w) + ' ' + ib.y + 'L' + ib.x + ' ' + (ib.y + ib.h));
    op(imgRect, B[1]); op(imgX, B[1] * (1 - smooth(seg(pi, 0, 0.3))));
    wipes[0].setAttribute('width', (170 * smooth(seg(pi, 0.6, 1))).toFixed(1)); set(wipes[0], { x: IMG_GOOD.x - 4, y: 0, height: 260 });
    op(imgArt, pi > 0.6 ? 1 : 0);
    drawHead(S);
    // button
    var pb = S.p.btn, bb = lerpBox(BTN_BAD, BTN_GOOD, pb);
    set(btnRect, { x: bb.x, y: bb.y, width: bb.w, height: bb.h, rx: mix(BTN_BAD.r, BTN_GOOD.r, pb), fill: blend('#d8d8d6', INK, pb) });
    op(btnRect, B[3]); op(btnBad, B[3] * (1 - smooth(seg(pb, 0, 0.4)))); op(btnGood, smooth(seg(pb, 0.5, 1)));
    // cards
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
      tf(c.plus, G.x + G.w - 14, G.y + G.h - 14); op(c.plus, gt * (j === 0 ? 0 : 1));
    });
    op(navG, B[0]);
  }

  /* ---- sales: the day runs 9am to 9pm; revenue changes only when an order arrives ---- */
  var DAY = 12, H_INTRO = 8.4;
  function hoursIntro(t) { return H_INTRO * Math.pow(seg(t, 4.8, INTRO_END), 0.8); }
  function yest(h) { return 27 * h + 14 * Math.sin(h * 0.9); }
  function tween(now, t0) { return smooth(seg(now - t0, 0.25, 1.15)); }

  function drawSales(S, t, clock) {
    tf(card, 0, 6 * (1 - S.card)); op(card, S.card);
    var loop = S.loop, u = S.u || 0, loopIdx = loop ? Math.floor((clock - INTRO_END) / LOOP) : 0;
    var fade = S.f * (loop ? (1 - smooth(seg(u, 17.3, 17.9))) * (loopIdx > 0 ? smooth(seg(u, 0.05, 0.6)) : 1) : 1);
    S.fadeAll = fade;
    var now = loop ? u : clock, hnow = loop ? H_INTRO + 0.2 * u : hoursIntro(clock), evs = [], i, e;
    ORD_INTRO.forEach(function (o) { if (loop || o[0] <= clock) evs.push({ t: o[0], h: hoursIntro(o[0]), a: o[1], who: o[2], what: o[3], done: loop }); });
    if (loop) ORD_LOOP.forEach(function (o) { if (o[0] <= u) evs.push({ t: o[0], h: H_INTRO + 0.2 * o[0], a: o[1], who: o[2], what: o[3], done: false }); });
    var X = function (h) { return PL.x + PL.w * h / DAY; }, Y = function (v) { return PL.y + PL.h - Math.min(v, YMAX) / YMAX * PL.h; };
    // totals: each order steps the line and counts the number up, a moment after its row appears
    var before = 0, full = 0, pts = [[X(0), Y(0)]], tw;
    for (i = 0; i < evs.length; i++) {
      e = evs[i]; tw = e.done ? 1 : tween(now, e.t); e.tw = tw;
      pts.push([X(e.h), Y(before)]);
      var nx = Math.max(X(e.h + 0.28 * tw), pts[pts.length - 1][0]);
      before += e.a * tw; full += e.a; e.full = full;
      pts.push([nx, Y(before)]);
    }
    var R = before;
    pts.push([Math.max(X(hnow), pts[pts.length - 1][0]), Y(R)]);
    // yesterday: the whole day, dashed
    var yd = '';
    for (var h = 0; h <= DAY + 0.001; h += 1) yd += (h ? 'L' : 'M') + X(h).toFixed(1) + ' ' + Y(yest(h)).toFixed(1);
    yestP.setAttribute('d', yd);
    var d = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L'), lp = pts[pts.length - 1];
    lineP.setAttribute('d', d);
    areaP.setAttribute('d', d + 'L' + lp[0].toFixed(1) + ' ' + (PL.y + PL.h) + 'L' + pts[0][0].toFixed(1) + ' ' + (PL.y + PL.h) + 'Z');
    DOT = [lp[0], lp[1]];
    var rk = (clock * 0.38) % 1;
    set(dotP, { cx: lp[0], cy: lp[1] }); set(ringP, { cx: lp[0], cy: lp[1], r: 3 + rk * 6 });
    op(plotG, fade); op(dotP, fade); op(ringP, 0.4 * (1 - rk) * fade);
    // the value bubble over the latest point
    var money = '$' + Math.round(R), bw = money.length * 4.2 + 11, bx = clamp(lp[0] - bw / 2, PL.x - 4, RX - bw + 4), by = Math.max(PL.y - 16, lp[1] - 22);
    set(bubBg, { x: bx, y: by, width: bw }); set(bubTxt, { x: bx + bw / 2, y: by + 9.8 }); bubTxt.textContent = money; op(bub, fade * (evs.length ? 1 : 0));
    // the headline number counts to the new total; the change against yesterday counts with it
    bigTxt.textContent = money; op(bigTxt, fade);
    var L = evs.length - 1, last = evs[L], prev = evs[L - 1], since = last ? now - last.t : 99;
    var pctNew = last ? (last.full / yest(last.h) - 1) * 100 : 0, pctOld = prev ? (prev.full / yest(prev.h) - 1) * 100 : pctNew;
    var pct = last ? mix(pctOld, pctNew, last.tw) : 0, up = pct >= 0, col = up ? UP : ERR;
    var nw = textW(bigTxt, money.length * 17), cx0 = LX + nw + 6, ptxt = Math.round(Math.abs(pct)) + '%';
    chipTxt.textContent = ptxt; chipTxt.setAttribute('fill', col); chipTri.setAttribute('fill', col);
    set(chipBg, { x: cx0, width: 20 + ptxt.length * 4.6 }); set(chipTxt, { x: cx0 + 14 });
    chipTri.setAttribute('d', up ? 'M' + (cx0 + 5) + ' 57.4l3.1-5 3.1 5z' : 'M' + (cx0 + 5) + ' 52.6l3.1 5 3.1-5z');
    op(chip, last ? fade * (L === 0 && !last.done ? smooth(seg(since, 0.2, 0.8)) : 1) : 0);
    // the amount that just came in
    if (last && !last.done && since > 0.15 && since < 2.3) {
      plusAmt.textContent = '+$' + last.a; op(plusAmt, fade * smooth(seg(since, 0.15, 0.55)) * (1 - smooth(seg(since, 1.6, 2.3)))); tf(plusAmt, 0, -3 * smooth(seg(since, 0.15, 2.3)));
    } else op(plusAmt, 0);
    // the orders list: a new order slides in at the top
    op(emptyT, evs.length ? 0 : fade);
    var enter = last && !last.done ? smooth(seg(since, 0, 0.9)) : 1;
    rowEls.forEach(function (r, s) {
      var o = evs[L - s];
      if (!o) { op(r.g, 0); return; }
      tf(r.g, 0, ROWY + (s - (1 - enter)) * ROWH - 0.4);
      r.ini.textContent = o.who.charAt(0); r.nm.textContent = o.who; r.pr.textContent = o.what; r.am.textContent = '$' + o.a;
      op(r.g, fade * (s === 0 ? enter : s === 3 ? 1 - smooth(seg(enter, 0.3, 1)) : 1));
      op(r.bg, s === 0 && !o.done ? 1 - smooth(seg(since, 0.9, 2.8)) : 0);
    });
    var lk = (clock * 0.45) % 1; set(liveRing, { r: 3 + lk * 5 }); op(liveRing, 0.55 * (1 - lk) * fade);
  }

  function drawPrompt(S, t) {
    var P = S.pill;
    op(pill, P.o); tf(pill, 0, P.y);
    if (P.o <= 0) return;
    var think = P.think;
    pillTxt.textContent = think ? 'Building your store' : (P.text || 'Describe your store');
    pillTxt.setAttribute('fill', think || P.text ? INK : '#9a9a98');
    var tw = textW(pillTxt, 0);
    set(pillCaret, { x: 138 + tw + 1.4 }); op(pillCaret, P.typing && !think ? (Math.floor(t * 2.6) % 2 ? 0.2 : 1) : 0);
    op(sendG, think ? 0 : 1); set(sendC, { r: P.press ? 8.6 : 10 });
    thinkDots.forEach(function (c, i) { op(c, think ? 0.25 + 0.75 * Math.max(0, Math.sin(t * 7 - i * 0.9)) : 0); });
  }

  function drawCursor(C, S, st, pos, clock) {
    var isUI = C === UIC;
    var x = pos[0] + 1.3 * Math.sin(clock * 1.3 + (isUI ? 0 : 2)), y = pos[1] + 1.0 * Math.sin(clock * 1.7 + (isUI ? 1 : 3));
    op(C.g, st.o * (isUI ? 1 : Math.min(1, 0.15 + (S.fadeAll == null ? 1 : S.fadeAll)))); tf(C.g, x, y);
    C.arrow.setAttribute('transform', st.press ? 'scale(.86)' : '');
    var flip = x > 556;
    var up = y > 150;                                            // low in the picture: tag and bubble go above the cursor
    tf(C.tag, flip ? -C.tagW - 3 : 11, up ? -3 : 13);
    var now = S.loop ? S.u : S.t, list = isUI ? S.bubbles.ui : S.bubbles.sales, b = null, k = 0, i;   // the chat bubble under the tag
    for (i = 0; i < list.length; i++) { var kk = ramp(now, list[i][0], list[i][0] + 0.3, list[i][1] - 0.3, list[i][1]); if (kk > k) { k = kk; b = list[i]; } }
    if (b && k > 0.01) {
      if (C.last !== b[2]) { C.last = b[2]; C.btx.textContent = b[2]; C.bw = textW(C.btx, b[2].length * 3.7) + 24; C.bbg.setAttribute('width', C.bw.toFixed(1)); }
      tf(C.bubble, flip ? -C.bw - 3 : 11, (up ? -25 : 33) + 4 * (1 - k)); op(C.bubble, k);
    } else op(C.bubble, 0);
  }
  function drawCursors(S, clock) {
    var now = S.loop ? S.u : S.t;
    drawCursor(SALESC, S, S.sales, salesAt(S.sales.keys, S.sales.at), clock);
    drawCursor(UIC, S, S.ui, S.ui.p, clock);
    rings.forEach(function (r) { op(r, 0); });
    var used = 0;
    S.clicks.forEach(function (c) {
      c[0].forEach(function (ct) {
        var d = now - ct; if (d < 0 || d > 0.55 || used > 3) return;
        var r = rings[used++], ui = c[1] === 'ui', at = ui ? pathAt(c[2], ct) : salesAt(c[2], ct);
        set(r, { cx: at[0], cy: at[1], r: 2.5 + (d / 0.55) * 16, stroke: ui ? INK : UP }); op(r, 0.28 * (1 - d / 0.55) * (ui ? S.ui.o : S.sales.o));
      });
    });
  }

  function render(S, clock) {
    drawStore(S, clock);
    drawPrompt(S, clock);
    drawSales(S, clock, clock);
    drawCursors(S, clock);
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
  window.addEventListener('resize', placeCaps);

  var clock = 0;
  function setView(p) {
    var v = narrow.matches ? (PAN_TO * p).toFixed(1) + ' 0 ' + VIEW_W + ' 280' : '0 0 660 280';
    if (v !== lastView) { svg.setAttribute('viewBox', v); lastView = v; }
  }
  function draw(t) {
    t = Math.max(0, t);
    clock = t;
    var loopMode = t >= INTRO_END, u = loopMode ? (((t - INTRO_END) % LOOP) + LOOP) % LOOP : t;
    var S = loopMode ? loopState(u, t) : introState(t);
    render(S, t);
    setView(S.pan);
    if (capBox) setCaps(t);
  }
  window.__heroArtAt = draw;
  if (narrow.addEventListener) narrow.addEventListener('change', function () { draw(clock); });

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
    var t = elapsedBase + (now - start) / 1000;
    draw(t);
    if (intro && !endIntro.done) REVEAL.forEach(function (s) { if (t >= s[0]) root.classList.add(s[1]); });
    if (intro && t >= INTRO_END + 0.1) endIntro();
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
