/* ---------- Hero art: AI builds a store fast, our team makes it right ----------
   One SVG (.hero__art) with two things in it: a browser window with an online store, and a small sales card.
   Everything is a function of time, so any moment can be drawn (window.__heroArtAt(t), used for checking).
   The numbers on the sales card are an illustration, not results.

   The intro (first visit in a session, or a reload, about 20 s):
      0.3  You ask an AI for a store. It builds a generic one in seconds: centred text, a grey square button,
           broken pictures, uneven cards. Sales are low.
      9.0  Our team's cursor comes in and fixes it one piece at a time: the picture, the headline, the button, the cards.
           Each piece is selected first, then reshaped. Sales climb.
     18.9  The real headline: AI builds it fast. We make it right.
   Captions sit where the headline will be and rise in word by word.

   Then, and straight away on later visits, a calm loop of 18 s: the team browses its own store, adds things to the cart,
   orders come in. With reduced motion it is one still frame. Skip, Escape or scrolling ends the intro. */
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
  var gTop = el('stop', { offset: 0, 'stop-color': INK, 'stop-opacity': 0.09 }, grad);
  el('stop', { offset: 1, 'stop-color': UP, 'stop-opacity': 0 }, grad);
  var wipes = [0, 1, 2, 3].map(function (i) {                 // wipe-in clips: 0 is the hero picture, 1 to 3 are the product pictures
    var c = el('clipPath', { id: 'ha-wipe' + i }, defs);
    return el('rect', { x: 0, y: -2, width: 0, height: 120 }, c);
  });

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

  var page = el('g', { transform: 'translate(0 28)' }, inner);   // the store, in its own coordinates (430 x 252)

  /* nav: the same in both versions */
  var navG = el('g', {}, page);
  txt('haven', { x: 28, y: 23, 'font-size': 10.5, 'font-weight': 700, 'letter-spacing': -0.3, fill: INK, 'font-family': SANS }, navG);
  txt('Shop', { x: 318, y: 22.4, 'font-size': 7.3, fill: MUTED, 'font-family': SANS }, navG);
  txt('About', { x: 349, y: 22.4, 'font-size': 7.3, fill: MUTED, 'font-family': SANS }, navG);
  el('path', { d: 'M384.5 14.5h11v9.5a2 2 0 01-2 2h-7a2 2 0 01-2-2zM387 14.5v-1.4a3 3 0 016 0v1.4', fill: 'none', stroke: INK, 'stroke-width': 1, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, navG);
  var badge = el('g', {}, navG);
  var badgeC = el('circle', { cx: 396, cy: 14, r: 4.4, fill: INK, stroke: '#fff', 'stroke-width': 1.2 }, badge);
  var badgeT = txt('1', { x: 396, y: 16, 'font-size': 5.4, 'font-weight': 600, 'text-anchor': 'middle', fill: '#fff', 'font-family': SANS }, badge);

  /* hero picture: a broken strip that becomes a framed picture */
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

  /* headline and sub line: generic (centred serif) and ours (left, sans) */
  var hBad = el('g', {}, page);
  txt('Welcome to Haven', { x: 215, y: 114, 'font-size': 14, 'font-weight': 500, 'text-anchor': 'middle', fill: '#333', 'font-family': SERIF }, hBad);
  txt('Handmade ceramics.', { x: 215, y: 129, 'font-size': 7.4, 'text-anchor': 'middle', fill: '#8a8a88', 'font-family': SERIF }, hBad);
  var hGood = el('g', {}, page);
  txt('Made by hand,', { x: 28, y: 76, 'font-size': 19, 'font-weight': 600, 'letter-spacing': -0.6, fill: INK, 'font-family': SANS }, hGood);
  txt('made to be used.', { x: 28, y: 98, 'font-size': 19, 'font-weight': 600, 'letter-spacing': -0.6, fill: INK, 'font-family': SANS }, hGood);
  txt('Small-batch ceramics for everyday life.', { x: 28, y: 115, 'font-size': 7.6, fill: MUTED, 'font-family': SANS }, hGood);

  /* button: grey square, then a black pill */
  var BTN_BAD = { x: 175, y: 138, w: 80, h: 16, r: 0 }, BTN_GOOD = { x: 28, y: 128, w: 68, h: 21, r: 10.5 };
  var btnRect = el('rect', {}, page);
  var btnBad = txt('Shop Now', { x: 215, y: 148.6, 'font-size': 7.2, 'text-anchor': 'middle', fill: '#6a6a68', 'font-family': SERIF }, page);
  var btnGood = txt('Shop now', { x: 62, y: 141.4, 'font-size': 7.7, 'font-weight': 600, 'text-anchor': 'middle', fill: '#fff', 'font-family': SANS }, page);

  /* three products: uneven broken cards, then an even grid with real pictures */
  var CARD_BAD = [{ x: 28, y: 168, w: 100, h: 46 }, { x: 140, y: 162, w: 128, h: 58 }, { x: 282, y: 172, w: 104, h: 42 }];
  var CARD_GOOD = [{ x: 28, y: 160, w: 114, h: 58 }, { x: 158, y: 160, w: 114, h: 58 }, { x: 288, y: 160, w: 114, h: 58 }];
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
    var plusG = el('path', { d: 'M-2.8 0H2.8M0 -2.8V2.8', fill: 'none', stroke: INK, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, plus);
    return { g: g, box: box, x: x, art: artG, oldPrice: oldPrice, name: name, price: price, plus: plus, plusC: plusC, plusG: plusG };
  });

  /* selection: an outline with corner handles and a small label, the way design tools show what is being edited */
  var selG = el('g', {}, page);
  var selR = el('rect', { fill: 'none', stroke: INK, 'stroke-width': 1 }, selG);
  var handles = [0, 1, 2, 3].map(function () { return el('rect', { width: 4.4, height: 4.4, rx: 1.2, fill: '#fff', stroke: INK, 'stroke-width': 0.9 }, selG); });
  var selLabBg = el('rect', { height: 12, rx: 4, fill: INK }, selG);
  var selLab = txt('', { 'font-size': 6.6, 'font-weight': 500, fill: '#fff', 'font-family': SANS }, selG);

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

  /* ================= the sales card: revenue today against yesterday, and the orders coming in ================= */
  var CX = 458.5, CY = 0.5, CW = 201, CH = 279, LX = CX + 18, RX = CX + CW - 18;
  var card = el('g', {});
  el('rect', { x: CX, y: CY, width: CW, height: CH, rx: 14, fill: '#fff', filter: 'url(#ha-sh)' }, card);
  var cardIn = el('g', {}, card);
  el('rect', { x: CX, y: CY, width: CW, height: CH, rx: 14, fill: 'none', stroke: EDGE }, card);
  txt('Revenue', { x: LX, y: 27, 'font-size': 7.8, 'font-weight': 500, fill: MUTED, 'font-family': SANS }, cardIn);
  el('circle', { cx: RX - 62, cy: 24.6, r: 2.3, fill: INK }, cardIn);
  txt('Today', { x: RX - 56, y: 27, 'font-size': 6.6, fill: MUTED, 'font-family': SANS }, cardIn);
  el('path', { d: 'M' + (RX - 31) + ' 24.6H' + (RX - 23), stroke: '#a9a9a7', 'stroke-width': 1.2, 'stroke-dasharray': '2 1.6', 'stroke-linecap': 'round' }, cardIn);
  txt('Yesterday', { x: RX - 19, y: 27, 'font-size': 6.6, fill: MUTED, 'font-family': SANS, 'text-anchor': 'start' }, cardIn);
  var bigTxt = txt('', { x: LX - 1, y: 62, 'font-size': 30, 'font-weight': 600, 'letter-spacing': -1.2, fill: INK, 'font-family': SANS }, cardIn);
  var chip = el('g', {}, cardIn);
  var chipBg = el('rect', { y: 44, height: 16, width: 44, rx: 8, fill: FILL }, chip);
  var chipTri = el('path', { fill: UP }, chip);
  var chipTxt = txt('', { y: 55.2, 'font-size': 7.6, 'font-weight': 600, fill: UP, 'font-family': SANS }, chip);
  var PL = { x: LX + 28, y: 84, w: RX - LX - 28, h: 86 }, YMAX = 900;
  [0, 300, 600, 900].forEach(function (v) {
    var y = PL.y + PL.h - v / YMAX * PL.h;
    el('path', { d: 'M' + PL.x + ' ' + y.toFixed(1) + 'H' + RX, stroke: v ? '#e8e8e6' : '#dcdcda', 'stroke-width': v ? 0.8 : 1, 'stroke-dasharray': v ? '1.5 3' : 'none' }, cardIn);
    txt(v ? '$' + v : '$0', { x: PL.x - 7, y: y + 2.2, 'font-size': 6.2, 'text-anchor': 'end', fill: '#9a9a98', 'font-family': SANS }, cardIn);
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

  el('path', { d: 'M' + LX + ' 197.5H' + RX, stroke: HAIR }, cardIn);
  txt('Orders', { x: LX, y: 213, 'font-size': 7.8, 'font-weight': 500, fill: MUTED, 'font-family': SANS }, cardIn);
  var liveRing = el('circle', { cx: RX - 2, cy: 210.2, r: 3, fill: 'none', 'stroke-width': 0.8, stroke: UP }, cardIn);
  el('circle', { cx: RX - 2, cy: 210.2, r: 2.5, fill: UP }, cardIn);
  var ROWY = 221, ROWH = 17;
  var rowClip = el('clipPath', { id: 'ha-rows' }, defs); el('rect', { x: CX + 4, y: ROWY - 2, width: CW - 8, height: ROWH * 3 + 4 }, rowClip);
  var rowsG = el('g', { 'clip-path': 'url(#ha-rows)' }, cardIn);
  var emptyT = txt('No orders yet', { x: LX, y: ROWY + 12, 'font-size': 7.4, fill: '#9a9a98', 'font-family': SANS }, rowsG);
  var ORD = [['Sara K.', 'Bowl', '$38'], ['Omar R.', 'Mug', '$24'], ['Lina M.', 'Vase', '$46']];
  var rowEls = [0, 1, 2, 3].map(function () {
    var g = el('g', {}, rowsG);
    var bg = el('rect', { x: LX - 6, y: 0, width: RX - LX + 12, height: 16, rx: 6, fill: '#f2f2f0' }, g);
    el('circle', { cx: LX + 6, cy: 8, r: 6, fill: SOFT }, g);
    var ini = txt('', { x: LX + 6, y: 10.2, 'font-size': 5.8, 'font-weight': 600, 'text-anchor': 'middle', fill: INK, 'font-family': SANS }, g);
    var nm = txt('', { x: LX + 17, y: 10.6, 'font-size': 7.2, 'font-weight': 500, fill: INK, 'font-family': SANS }, g);
    var pr = txt('', { x: LX + 61, y: 10.6, 'font-size': 6.8, fill: MUTED, 'font-family': SANS }, g);
    var am = txt('', { x: RX - 2, y: 10.6, 'font-size': 7.4, 'font-weight': 600, 'text-anchor': 'end', fill: INK, 'font-family': SANS }, g);
    return { g: g, bg: bg, ini: ini, nm: nm, pr: pr, am: am };
  });

  /* clicks and the team's cursor */
  var rings = [0, 1].map(function () { return el('circle', { fill: 'none', stroke: INK, 'stroke-width': 0.9 }, svg); });
  var cur = el('g', {});
  var curTag = el('g', {}, cur);
  el('rect', { x: 11, y: 13, width: 52, height: 14, rx: 7, fill: INK }, curTag);
  txt('Protosofts', { x: 37, y: 22.6, 'font-size': 6.9, 'font-weight': 500, 'text-anchor': 'middle', fill: '#fff', 'font-family': SANS }, curTag);
  var curArrow = el('path', { d: 'M0 0V14L3.9 10.7L6.6 16.6L9 15.5L6.3 9.7H11.3Z', fill: INK, stroke: '#fff', 'stroke-width': 1.1, 'stroke-linejoin': 'round' }, cur);

  /* ================= time to state ================= */
  function pathAt(keys, t) {                                   // keys [[time, x, y], ...]; eased, with a slight arc so it moves like a hand
    if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (var i = 0; i < keys.length - 1; i++) {
      var a = keys[i], b = keys[i + 1];
      if (t <= b[0]) {
        var k = smooth(seg(t, a[0], b[0])), dx = b[1] - a[1], dy = b[2] - a[2], d = Math.sqrt(dx * dx + dy * dy) || 1, arc = Math.sin(Math.PI * k) * d * 0.07;
        return [mix(a[1], b[1], k) - dy / d * arc, mix(a[2], b[2], k) + dx / d * arc];
      }
    }
    var l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  var REST = [190, 172];
  var CUR_INTRO = [[8.8, 480, 296], [9.9, 332, 96], [11.45, 332, 96], [12.1, 222, 140], [13.55, 222, 140], [14.1, 222, 176], [15.2, 222, 176], [15.9, 204, 222], [18.3, 204, 222], [19.3, REST[0], REST[1]]];
  var CUR_LOOP = [[0, REST[0], REST[1]], [0.8, REST[0], REST[1]], [2.0, 205, 214], [2.85, 242, 232], [4.4, 242, 232], [5.7, 112, 102], [8.7, 112, 102], [9.5, 62, 168], [10.5, 62, 168], [11.6, 313, 214], [12.3, 356, 232], [13.9, 356, 232], [15.6, 250, 252], [17.2, REST[0], REST[1]], [18, REST[0], REST[1]]];
  var CLICKS_INTRO = [10.05, 12.25, 14.25, 16.05], CLICKS_LOOP = [2.95, 12.4];
  var SELS = [   // what the team selects in the intro: name, click time, morph start and end
    { k: 'img', lab: 'Picture', c: 10.05, a: 10.4, b: 11.7 }, { k: 'head', lab: 'Headline', c: 12.25, a: 12.6, b: 13.8 },
    { k: 'btn', lab: 'Button', c: 14.25, a: 14.6, b: 15.4 }, { k: 'cards', lab: 'Products', c: 16.05, a: 16.4, b: 18.3 }];

  var CAPS = [[0.3, 5.2, 'AI builds a website in seconds.'], [5.6, 8.7, "But fast isn't the same as selling."], [8.9, 12.0, 'So our team steps in.'],
              [12.1, 15.7, 'We shape every detail by hand.'], [15.8, 18.7, 'And the site starts to sell.']];

  function prog(t, s) { return inOut(seg(t, s.a, s.b)); }
  function cardProg(t, j) { return inOut(seg(t, 16.4 + j * 0.28, 17.7 + j * 0.28)); }

  function introState(t) {
    var S = { loop: false, t: t };
    S.build = []; for (var i = 0; i < 6; i++) S.build.push(smooth(seg(t, 4.1 + i * 0.2, 4.7 + i * 0.2)));
    S.p = { img: prog(t, SELS[0]), head: prog(t, SELS[1]), btn: prog(t, SELS[2]) };
    S.cp = [0, 1, 2].map(function (j) { return cardProg(t, j); });
    S.cardsP = (S.cp[0] + S.cp[1] + S.cp[2]) / 3;
    S.q = 0.2 * S.p.img + 0.25 * S.p.head + 0.15 * S.p.btn + 0.4 * S.cardsP;
    S.f = smooth(seg(t, 4.9, 5.7));
    S.card = smooth(seg(t, 4.6, 5.4));
    // the prompt
    var typedN = Math.round(29 * seg(t, 0.9, 2.5));
    S.pill = { o: ramp(t, 0.2, 0.7, 3.9, 4.3), text: 'A store for handmade ceramics'.slice(0, typedN), typing: t < 2.7, press: t > 2.75 && t < 2.9, think: t >= 2.95, y: 8 * smooth(seg(t, 3.9, 4.3)) };
    S.cur = { o: smooth(seg(t, 8.8, 9.3)), p: pathAt(CUR_INTRO, t), press: pressOf(CLICKS_INTRO, t) };
    S.clicks = CLICKS_INTRO.map(function (c) { return [c, t - c]; });
    S.sel = selFor(t);
    S.hover = [0, 0, 0]; S.plusPress = [0, 0, 0]; S.badge = { v: 1, o: S.build[0] };
    S.pan = clamp(ramp(t, 5.4, 6.2, 8.2, 9.0) + ramp(t, 16.4, 17.2, 18.6, 19.4), 0, 1);
    return S;
  }
  function pressOf(list, t) { for (var i = 0; i < list.length; i++) { var d = t - list[i]; if (d > 0 && d < 0.22) return Math.sin(Math.PI * d / 0.22); } return 0; }
  function selFor(t) {
    for (var i = 0; i < SELS.length; i++) {
      var s = SELS[i];
      if (t >= s.c + 0.04 && t < s.b + 0.45) return { k: s.k, lab: s.lab, o: smooth(seg(t, s.c + 0.04, s.c + 0.2)) * (1 - smooth(seg(t, s.b + 0.05, s.b + 0.45))), p: prog(t, s) };
    }
    return null;
  }

  function loopState(u, t) {
    var S = { loop: true, t: t, u: u };
    S.build = [1, 1, 1, 1, 1, 1]; S.p = { img: 1, head: 1, btn: 1 }; S.cp = [1, 1, 1]; S.q = 1; S.f = 1; S.card = 1;
    S.pill = { o: 0, text: '', typing: false, press: false, think: false, y: 0 };
    S.cur = { o: 1, p: pathAt(CUR_LOOP, u), press: pressOf(CLICKS_LOOP, u) };
    S.clicks = CLICKS_LOOP.map(function (c) { return [c, u - c]; });
    S.hover = [0, ramp(u, 1.6, 2.2, 4.2, 4.8), ramp(u, 11.4, 12.0, 13.8, 14.4)];
    S.plusPress = [0, pressOf([2.95], u), pressOf([12.4], u)];
    var bo = 1 - smooth(seg(u, 16.8, 17.2)) + smooth(seg(u, 17.4, 17.8)) * (u > 17.3 ? 1 : 0);
    S.badge = { v: u < 3.0 ? 1 : u < 12.4 ? 2 : u < 17.3 ? 3 : 1, o: u < 16.8 ? 1 : (u < 17.3 ? 1 - smooth(seg(u, 16.8, 17.2)) : smooth(seg(u, 17.4, 17.8))) };
    S.sel = null;
    if (u > 5.9 && u < 8.9) S.sel = { k: 'head', lab: 'Headline', o: ramp(u, 5.9, 6.2, 8.4, 8.8), p: 1, plain: true };
    if (u > 9.6 && u < 10.6) S.btnHover = ramp(u, 9.6, 9.9, 10.2, 10.5);
    S.pan = clamp(ramp(u, 2.8, 3.6, 5.6, 6.4) + ramp(u, 12.6, 13.4, 15.2, 16.0), 0, 1);
    return S;
  }

  /* ================= selection geometry ================= */
  function imgBox(p) { var a = inOut(seg(p, 0, 0.5)), b = inOut(seg(p, 0.45, 1)); return { x: mix(IMG_BAD.x, IMG_GOOD.x, a), w: mix(IMG_BAD.w, IMG_GOOD.w, a), y: mix(IMG_BAD.y, IMG_GOOD.y, b), h: mix(IMG_BAD.h, IMG_GOOD.h, b) }; }
  function lerpBox(a, b, k) { return { x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), w: mix(a.w, b.w, k), h: mix(a.h, b.h, k) }; }
  var HEAD_BAD = { x: 150, y: 100, w: 130, h: 33 }, HEAD_GOOD = { x: 24, y: 59, w: 176, h: 62 };
  function selBox(k, p) {
    if (k === 'img') return imgBox(p);
    if (k === 'head') return lerpBox(HEAD_BAD, HEAD_GOOD, p);
    if (k === 'btn') return lerpBox(BTN_BAD, BTN_GOOD, p);
    return lerpBox({ x: 28, y: 158, w: 374, h: 66 }, { x: 28, y: 160, w: 374, h: 58 }, p);
  }

  /* ================= drawing one state ================= */
  function drawStore(S, t) {
    var B = S.build;
    // picture
    var pi = S.p.img, ib = imgBox(pi), ir = mix(IMG_BAD.r, IMG_GOOD.r, pi);
    set(imgRect, { x: ib.x, y: ib.y, width: ib.w, height: ib.h, rx: ir, fill: blend('#efefed', '#ececea', pi), stroke: pi > 0.5 ? 'none' : EDGE });
    imgRect.setAttribute('stroke-width', 1);
    imgX.setAttribute('d', 'M' + ib.x + ' ' + ib.y + 'L' + (ib.x + ib.w) + ' ' + (ib.y + ib.h) + 'M' + (ib.x + ib.w) + ' ' + ib.y + 'L' + ib.x + ' ' + (ib.y + ib.h));
    var heroO = B[1];
    op(imgRect, heroO); op(imgX, heroO * (1 - smooth(seg(pi, 0, 0.3))));
    wipes[0].setAttribute('width', (170 * smooth(seg(pi, 0.6, 1))).toFixed(1)); set(wipes[0], { x: IMG_GOOD.x - 4, y: 0, height: 260 });
    op(imgArt, pi > 0.6 ? 1 : 0);
    // headline
    var ph = S.p.head;
    op(hBad, B[2] * (1 - smooth(seg(ph, 0, 0.45))));
    tf(hBad, -18 * smooth(seg(ph, 0, 0.45)), 0);
    op(hGood, smooth(seg(ph, 0.4, 1)));
    tf(hGood, 14 * (1 - smooth(seg(ph, 0.4, 1))), 0);
    // button
    var pb = S.p.btn, bb = lerpBox(BTN_BAD, BTN_GOOD, pb), hov = S.btnHover || 0;
    set(btnRect, { x: bb.x, y: bb.y, width: bb.w, height: bb.h, rx: mix(BTN_BAD.r, BTN_GOOD.r, pb), fill: blend('#d8d8d6', INK, pb) });
    if (hov > 0) btnRect.setAttribute('fill', blend(INK, '#3a3a3a', hov));
    op(btnRect, B[3]); op(btnBad, B[3] * (1 - smooth(seg(pb, 0, 0.4)))); op(btnGood, smooth(seg(pb, 0.5, 1)));
    // cards
    cards.forEach(function (c, j) {
      var cp = S.cp[j], k = cp, bx = lerpBox(CARD_BAD[j], CARD_GOOD[j], k), lift = (S.hover[j] || 0) * 3;
      var o = B[4 + (j === 2 ? 1 : 0)] * (j === 0 ? 1 : 1);
      tf(c.g, 0, -lift); op(c.g, o);
      set(c.box, { x: bx.x, y: bx.y, width: bx.w, height: bx.h, rx: mix(5, 9, k), fill: blend('#efefed', '#ececea', k), stroke: cp > 0.5 ? 'none' : EDGE });
      c.x.setAttribute('d', 'M' + bx.x + ' ' + bx.y + 'L' + (bx.x + bx.w) + ' ' + (bx.y + bx.h) + 'M' + (bx.x + bx.w) + ' ' + bx.y + 'L' + bx.x + ' ' + (bx.y + bx.h));
      op(c.x, 1 - smooth(seg(cp, 0, 0.3)));
      c.art.setAttribute('transform', 'translate(' + CARD_GOOD[j].x + ' ' + CARD_GOOD[j].y + ')');
      wipes[j + 1].setAttribute('width', (118 * smooth(seg(cp, 0.35, 1))).toFixed(1));
      op(c.art, cp > 0.35 ? 1 : 0);
      set(c.oldPrice, { x: bx.x + bx.w / 2, y: bx.y + bx.h + 11 }); op(c.oldPrice, 1 - smooth(seg(cp, 0, 0.3)));
      var gt = smooth(seg(cp, 0.6, 1));
      set(c.name, { x: CARD_GOOD[j].x, y: CARD_GOOD[j].y + 74 }); op(c.name, gt);
      set(c.price, { x: CARD_GOOD[j].x + CARD_GOOD[j].w, y: CARD_GOOD[j].y + 74 }); op(c.price, gt);
      var pp = S.plusPress[j] || 0;
      tf(c.plus, CARD_GOOD[j].x + CARD_GOOD[j].w - 14, CARD_GOOD[j].y + CARD_GOOD[j].h - 14, 1 + 0.12 * (S.hover[j] || 0) - 0.14 * pp);
      c.plusC.setAttribute('fill', blend('#ffffff', INK, pp)); c.plusG.setAttribute('stroke', pp > 0.4 ? '#fff' : INK);
      op(c.plus, gt * (j === 0 ? 0 : 1));
    });
    op(navG, B[0]);
    badgeT.textContent = String(S.badge.v); op(badge, S.badge.o);
    // selection
    if (S.sel && S.sel.o > 0.01) {
      var bx2 = selBox(S.sel.k, S.sel.p), pad = 4;
      var x0 = bx2.x - pad, y0 = bx2.y - pad, w0 = bx2.w + pad * 2, h0 = bx2.h + pad * 2;
      set(selR, { x: x0 + 0.5, y: y0 + 0.5, width: w0, height: h0, rx: 2 });
      var cs = [[x0, y0], [x0 + w0, y0], [x0, y0 + h0], [x0 + w0, y0 + h0]];
      handles.forEach(function (h, i) { set(h, { x: cs[i][0] - 1.7, y: cs[i][1] - 1.7 }); op(h, S.sel.plain ? 0 : 1); });
      var lw = S.sel.lab.length * 3.9 + 12;
      var ly = S.sel.k === 'cards' || S.sel.k === 'img' ? y0 + h0 + 4 : y0 - 16;
      set(selLabBg, { x: x0 - 0.5, y: ly, width: lw }); set(selLab, { x: x0 + 5.5, y: ly + 8.4 }); selLab.textContent = S.sel.lab;
      op(selG, S.sel.o);
    } else op(selG, 0);
  }

  /* the day: 9am to 9pm. Today's revenue is a running total built from a rate that depends on how good the store is. */
  var DAY = 12, H_INTRO = 8.4, RATE_BAD = 10, RATE_GOOD = 135, TA = 4.8, TABLE = [];
  function qOf(t) { return 0.2 * prog(t, SELS[0]) + 0.25 * prog(t, SELS[1]) + 0.15 * prog(t, SELS[2]) + 0.4 * (cardProg(t, 0) + cardProg(t, 1) + cardProg(t, 2)) / 3; }
  function hoursIntro(t) { return H_INTRO * Math.pow(seg(t, TA, INTRO_END), 0.8); }
  function yest(h) { return 41 * h + 20 * Math.sin(h * 0.85) + 12 * Math.sin(h * 2.3 + 1) * h / DAY; }
  function bump(h) { return 1 + 0.32 * Math.sin(h * 3.3 + 0.6) + 0.18 * Math.sin(h * 7.1); }
  (function () {
    var T = 0, hp = 0, dt = 0.1;
    for (var t = 0; t <= INTRO_END + 0.001; t += dt) {
      var h = hoursIntro(t), q = qOf(t);
      T += (RATE_BAD + (RATE_GOOD - RATE_BAD) * q) * bump(h) * (h - hp); hp = h;
      TABLE.push([h, T]);
    }
  })();
  function todayPts(clock, loop, u) {                          // [hours, total] points up to now
    var pts = [], n = clamp(Math.floor(Math.min(clock, INTRO_END) / 0.1), 0, TABLE.length - 1), i;
    for (i = 0; i <= n; i += 2) pts.push(TABLE[i]);
    var last = TABLE[n];
    if (loop) {
      var T = TABLE[TABLE.length - 1][1], hp = TABLE[TABLE.length - 1][0];
      for (var a = 0.3; a <= u + 0.001; a += 0.3) { var h = H_INTRO + 0.2 * a; T += RATE_GOOD * bump(h) * (h - hp); hp = h; pts.push([h, T]); }
      var hn = H_INTRO + 0.2 * u; if (u > 0) { T += RATE_GOOD * bump(hn) * (hn - hp); pts.push([hn, T]); last = [hn, T]; } else last = TABLE[TABLE.length - 1];
    } else pts.push(last);
    return { pts: pts, now: last };
  }
  function smoothPath(P) {                                      // Catmull-Rom to Bezier
    var d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
    for (var i = 0; i < P.length - 1; i++) {
      var a = P[i - 1] || P[i], b = P[i], c = P[i + 1], e = P[i + 2] || c, k = 6;
      d += 'C' + (b[0] + (c[0] - a[0]) / k).toFixed(1) + ' ' + (b[1] + (c[1] - a[1]) / k).toFixed(1) + ' ' + (c[0] - (e[0] - b[0]) / k).toFixed(1) + ' ' + (c[1] - (e[1] - b[1]) / k).toFixed(1) + ' ' + c[0].toFixed(1) + ' ' + c[1].toFixed(1);
    }
    return d;
  }
  var ORD_INTRO = [16.6, 17.9, 19.1], ORD_LOOP = [3.4, 9.4, 13.0];
  function drawSales(S, t, clock) {
    tf(card, 0, 6 * (1 - S.card)); op(card, S.card);
    var loop = S.loop, u = S.u || 0, loopIdx = loop ? Math.floor((clock - INTRO_END) / LOOP) : 0;
    var fade = S.f * (loop ? (1 - smooth(seg(u, 17.3, 17.9))) * (loopIdx > 0 ? smooth(seg(u, 0.05, 0.6)) : 1) : 1);
    op(cardIn, S.card > 0 ? 1 : 0);
    var td = todayPts(clock, loop, u), now = td.now;
    var X = function (h) { return PL.x + PL.w * h / DAY; }, Y = function (v) { return PL.y + PL.h - Math.min(v, YMAX) / YMAX * PL.h; };
    var hnow = now[0], T = now[1];
    // yesterday: the whole day, dashed
    var yp = [], h;
    for (h = 0; h <= DAY + 0.001; h += 1) yp.push([X(h), Y(yest(h))]);
    yestP.setAttribute('d', smoothPath(yp)); op(yestP, S.f);
    // today
    var P = td.pts.map(function (p) { return [X(p[0]), Y(p[1])]; });
    if (P.length < 2) P = [[X(0), Y(0)], [X(0.01), Y(0)]];
    var d = smoothPath(P), lp = P[P.length - 1];
    lineP.setAttribute('d', d); op(lineP, S.f);
    areaP.setAttribute('d', d + 'L' + lp[0].toFixed(1) + ' ' + (PL.y + PL.h) + 'L' + P[0][0].toFixed(1) + ' ' + (PL.y + PL.h) + 'Z'); op(areaP, S.f);
    var rk = (clock * 0.38) % 1;
    set(dotP, { cx: lp[0], cy: lp[1] }); op(dotP, S.f);
    set(ringP, { cx: lp[0], cy: lp[1], r: 3 + rk * 6 }); op(ringP, 0.4 * (1 - rk) * S.f);
    // the value bubble over the last point
    var money = '$' + Math.round(T), bw = money.length * 4.2 + 11, bx = clamp(lp[0] - bw / 2, PL.x - 4, RX - bw + 4), by = Math.max(PL.y - 16, lp[1] - 22);
    set(bubBg, { x: bx, y: by, width: bw }); set(bubTxt, { x: bx + bw / 2, y: by + 9.8 }); bubTxt.textContent = money; op(bub, S.f * smooth(seg(hnow, 0.6, 1.2)));
    // headline number and the comparison with yesterday at the same hour
    bigTxt.textContent = money;
    var ref = yest(hnow), pct = ref > 20 ? (T / ref - 1) * 100 : 0, up = pct >= 0, col = up ? UP : ERR;
    var nw = 0; try { nw = bigTxt.getComputedTextLength(); } catch (e) { nw = 0; } nw = nw || money.length * 17;
    var cx0 = LX + nw + 6;
    chipTxt.textContent = Math.round(Math.abs(pct)) + '%'; chipTxt.setAttribute('fill', col); chipTri.setAttribute('fill', col);
    set(chipBg, { x: cx0, width: 18 + chipTxt.textContent.length * 4.6 }); set(chipTxt, { x: cx0 + 14 });
    chipTri.setAttribute('d', up ? 'M' + (cx0 + 5) + ' 53.4l3.1-5 3.1 5z' : 'M' + (cx0 + 5) + ' 48.6l3.1 5 3.1-5z');
    op(chip, smooth(seg(hnow, 0.9, 1.5)) * S.f);
    // orders
    var evs = loop ? ORD_LOOP : ORD_INTRO, base = loop ? 2 : -1, tt = loop ? u : clock, j = base, enter = 1, since = 99, i;
    for (i = 0; i < evs.length; i++) if (tt >= evs[i]) { j = base + i + 1; enter = smooth(seg(tt - evs[i], 0, 0.9)); since = tt - evs[i]; }
    op(emptyT, j < 0 ? S.f : 0);
    rowEls.forEach(function (r, s) {
      var k = j - s;
      if (k < 0) { op(r.g, 0); return; }
      var o = ORD[k % 3], pos = s - (1 - enter), y = ROWY + pos * ROWH;
      tf(r.g, 0, y);
      r.ini.textContent = o[0].charAt(0); r.nm.textContent = o[0]; r.pr.textContent = o[1]; r.am.textContent = o[2];
      op(r.g, (s === 0 ? enter : s === 3 ? 1 - smooth(seg(enter, 0.3, 1)) : 1));
      op(r.bg, s === 0 ? 1 - smooth(seg(since, 0.9, 2.8)) : 0);
    });
    var lk = (clock * 0.45) % 1; set(liveRing, { r: 3 + lk * 5 }); op(liveRing, 0.55 * (1 - lk));
    op(cardIn, fade);
  }

  function drawPrompt(S, t) {
    var P = S.pill;
    op(pill, P.o); tf(pill, 0, P.y);
    if (P.o <= 0) return;
    var think = P.think;
    pillTxt.textContent = think ? 'Building your store' : (P.text || 'Describe your store');
    pillTxt.setAttribute('fill', think || P.text ? INK : '#9a9a98');
    var tw = 0; try { tw = pillTxt.getComputedTextLength(); } catch (e) { tw = 0; }
    set(pillCaret, { x: 138 + tw + 1.4 }); op(pillCaret, P.typing && !think ? (Math.floor(t * 2.6) % 2 ? 0.2 : 1) : 0);
    op(sendG, think ? 0 : 1); set(sendC, { r: P.press ? 8.6 : 10 });
    thinkDots.forEach(function (c, i) { op(c, think ? 0.25 + 0.75 * Math.max(0, Math.sin(t * 7 - i * 0.9)) : 0); });
  }

  function drawCursor(S) {
    var c = S.cur;
    op(cur, c.o); tf(cur, c.p[0], c.p[1]);
    curArrow.setAttribute('transform', c.press ? 'scale(.86)' : '');
    var shown = 0;
    rings.forEach(function (r) { op(r, 0); });
    S.clicks.forEach(function (k) {
      var d = k[1]; if (d < 0 || d > 0.55 || shown > 1) return;
      var r = rings[shown++], pos = S.loop ? CUR_LOOP : CUR_INTRO;
      var at = pathAt(pos, S.loop ? S.u - d : S.t - d);
      set(r, { cx: at[0], cy: at[1], r: 2.5 + (d / 0.55) * 16 }); op(r, 0.28 * (1 - d / 0.55));
    });
  }

  function render(S, clock) {
    drawStore(S, clock);
    drawPrompt(S, clock);
    drawSales(S, clock, clock);
    drawCursor(S);
  }

  /* ================= captions (the page's headline area, intro only) ================= */
  var capBox = null, capEls = [];
  function buildCaps() {
    capBox = document.createElement('div'); capBox.className = 'hi-caps'; capBox.setAttribute('aria-hidden', 'true');
    CAPS.forEach(function (c) {
      var d = document.createElement('div'); d.className = 'hero__title hi-cap';
      var words = c[2].split(' ').map(function (w, i) {
        var s = document.createElement('span'); s.className = 'cw'; s.textContent = w; d.appendChild(s);
        if (i < c[2].split(' ').length - 1) d.appendChild(document.createTextNode(' '));
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
