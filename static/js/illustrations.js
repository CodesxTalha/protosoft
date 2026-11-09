/* ---------- Service illustrations, drawn on <canvas> ----------
   Each <canvas data-scene="…"> plays one looping scene. Scenes live in a 280x160 design space.
   The static artwork is drawn once and cached; only moving parts are redrawn each frame,
   and only while the card is on screen. Reference SVGs: static/source/illustrations/. */
(function () {
  var TAU = Math.PI * 2, FONT = '"Inter Tight",system-ui,sans-serif';

  /* ---- easing + keyframes (CSS-style) ---- */
  function bez(x1, y1, x2, y2) {
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var lo = 0, hi = 1, t = x, i;
      for (i = 0; i < 18; i++) {
        t = (lo + hi) / 2;
        if (3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t < x) lo = t; else hi = t;
      }
      return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
    };
  }
  var EASE = bez(.25, .1, .25, 1), IO = bez(.42, 0, .58, 1), POP = bez(.3, 0, .2, 1);

  // stops: [[percent, v1, v2…], …]; returns the interpolated values for percent p
  function kf(p, s, ease) {
    var i = 1, a, b, k, out = [], j;
    if (p <= s[0][0]) return s[0].slice(1);
    for (; i < s.length; i++) if (p <= s[i][0]) break;
    if (i === s.length) return s[s.length - 1].slice(1);
    a = s[i - 1]; b = s[i]; k = (ease || EASE)((p - a[0]) / (b[0] - a[0]));
    for (j = 1; j < a.length; j++) out.push(a[j] + (b[j] - a[j]) * k);
    return out;
  }

  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function mix(a, b, k) {
    a = rgb(a); b = rgb(b);
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')';
  }

  /* ---- drawing helpers ---- */
  function rr(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function box(g, x, y, w, h, r, fill, line) {
    rr(g, x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (line) { g.strokeStyle = line; g.lineWidth = 1; g.stroke(); }
  }
  function dot(g, x, y, r, fill, line, lw) {
    g.beginPath(); g.arc(x, y, r, 0, TAU);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (line) { g.strokeStyle = line; g.lineWidth = lw || 1; g.stroke(); }
  }
  function seg(g, x1, y1, x2, y2, col, dash) {
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2);
    g.strokeStyle = col; g.lineWidth = 1; g.setLineDash(dash || []); g.stroke(); g.setLineDash([]);
  }
  function txt(g, s, x, y, size, fill, align, ls) {
    g.font = '500 ' + size + 'px ' + FONT; g.fillStyle = fill; g.textAlign = align || 'left';
    if ('letterSpacing' in g) g.letterSpacing = ls || '0px';
    g.fillText(s, x, y);
  }
  function lbl(g, s, x, y, align) { txt(g, s, x, y, 7, '#8a8a88', align, '.63px'); }
  function path(g, d, fill) { g.fillStyle = fill; g.fill(new Path2D(d)); }

  // 24x24 icon paths (stroke icons, scaled to `size`; `sw` is the stroke width in 24-units)
  var P = {
    heart: new Path2D('M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'),
    comment: new Path2D('M7.9 20A9 9 0 1 0 4 16.1L2 22Z'),
    send: new Path2D('m22 2-7 20-4-9-9-4ZM22 2 11 13'),
    bookmark: new Path2D('m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z'),
    check: new Path2D('M20 6 9 17l-5-5'),
    up: new Path2D('m5 12 7-7 7 7M12 19V5'),
    plus: new Path2D('M12 2.5v19M2.5 12h19')
  };
  function icon(g, name, x, y, size, col, sw, solid, scale) {
    g.save(); g.translate(x + size / 2, y + size / 2);
    g.scale(size / 24 * (scale == null ? 1 : scale), size / 24 * (scale == null ? 1 : scale)); g.translate(-12, -12);
    g.lineWidth = sw || 2; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = col;
    if (solid) { g.fillStyle = col; g.fill(P[name]); }
    g.stroke(P[name]); g.restore();
  }

  var INK = '#1f1f1f', TX = '#141414', MID = '#d6d6d4', SOFT = '#ececea', LINE = '#dcdcda', W = '#fff', BG = '#fafafa';

  /* ================= 1. Design (7s) ================= */
  function designStatic(g) {
    g.translate(6, 0);
    seg(g, 16, 68.5, 58, 68.5, LINE, [2, 2]); seg(g, 16, 88.5, 58, 88.5, LINE, [2, 2]);
    txt(g, 'Aa', 20, 88, 26, TX, 'left', '-.6px');
    lbl(g, 'TYPE', 20, 104); lbl(g, 'FRAME · 1440', 76, 16);
    box(g, 76.5, 22.5, 128, 112, 6, W, TX);
    dot(g, 92, 40, 6, MID); box(g, 104, 35, 52, 4, 2, MID); box(g, 104, 43, 32, 3, 1.5, SOFT);
    g.save(); rr(g, 86, 56, 108, 40, 4); g.clip();
    g.fillStyle = SOFT; g.fillRect(86, 56, 108, 40); dot(g, 176, 68, 5.5, W);
    path(g, 'M86 96V84C98 72 108 72 118 79C126 84 134 85 142 79C152 71 164 72 194 84V96Z', LINE);
    path(g, 'M86 96V88C100 82 112 85 124 88C140 92 156 85 168 83C178 82 187 85 194 88V96Z', '#cbcbc9');
    g.restore();
    box(g, 140, 113.5, 32, 3, 1.5, MID);
    dot(g, 240, 56, 8, INK); dot(g, 240, 78, 8, '#8f8f8d'); dot(g, 240, 100, 7.5, W, '#c4c4c2');
    lbl(g, 'COLOR', 240, 128, 'center');
  }
  var CUR = new Path2D('M0 0L0 13L3.6 9.9L6.1 15.2L8.3 14.2L5.9 9.1L10.4 9Z'), CE = bez(.45, 0, .25, 1);
  function designDraw(g, t) {
    var p = t / 70, k = kf(p, [[0, 0], [59, 0], [63, 1], [88, 1], [94, 0], [100, 0]])[0], o, s;
    g.translate(6, 0);
    box(g, 86, 108, 46, 14, 4, mix('#cfcfcd', INK, k)); box(g, 97, 114, 24, 2, 1, BG);
    o = kf(p, [[0, 0], [32, 0], [35, 1], [86, 1], [90, 0], [100, 0]])[0];
    if (o > 0) {
      g.save(); g.globalAlpha = o;
      g.strokeStyle = TX; g.lineWidth = 1; g.strokeRect(83.5, 105.5, 52, 20);
      [[81.5, 103.5], [133.5, 103.5], [81.5, 123.5], [133.5, 123.5]].forEach(function (c) { box(g, c[0], c[1], 4, 4, 0, W, TX); });
      box(g, 92, 131, 35, 11, 2.5, INK); txt(g, '46 × 14', 109.5, 138.8, 7, BG, 'center');
      g.restore();
    }
    o = kf(p, [[0, 0, .75], [58, 0, .75], [62, 1, 1], [88, 1, 1], [94, 0, 1], [100, 0, 1]]);
    if (o[0] > 0) { g.save(); g.globalAlpha = o[0]; dot(g, 240, 56, 11.5 * o[1], null, TX); g.restore(); }
    o = kf(p, [[0, 0], [6, 0], [10, 1], [54, 1], [80, 0], [100, 0]], CE)[0];
    if (o > 0) {
      var x = kf(p, [[0, 262], [6, 262], [28, 126], [36, 126], [54, 239], [64, 239], [80, 292], [100, 292]], CE)[0],
          y = kf(p, [[0, 150], [6, 150], [28, 119], [36, 119], [54, 57], [64, 57], [80, 57], [100, 57]], CE)[0];
      s = kf(p, [[0, 1], [30, 1], [32, .82], [34, 1], [57, 1], [59, .82], [61, 1], [100, 1]])[0];
      g.save(); g.globalAlpha = o; g.translate(x, y); g.scale(s, s);
      g.fillStyle = INK; g.fill(CUR); g.strokeStyle = BG; g.lineWidth = .8; g.lineJoin = 'round'; g.stroke(CUR); g.restore();
    }
  }

  /* ================= 2. Websites & apps (6s) ================= */
  var PTS = [[72, 124], [84, 117], [96, 120], [108, 108], [120, 111], [132, 99], [144, 102], [157, 92]];
  var ROWS = [[MID, 28, 18], [INK, 22, 14], [MID, 30, 20], [MID, 18, 12], [MID, 28, 18]];
  function appsStatic(g) {
    g.translate(11, 0);
    box(g, 18.5, 16.5, 186, 122, 6, W, TX); seg(g, 19, 32.5, 204, 32.5, LINE);
    dot(g, 29, 24.5, 2.2, MID); dot(g, 37, 24.5, 2.2, MID); dot(g, 45, 24.5, 2.2, MID);
    box(g, 62, 20.5, 96, 8, 4, SOFT); seg(g, 58.5, 33, 58.5, 138, LINE);
    box(g, 26, 44, 22, 3, 1.5, INK); box(g, 26, 54, 18, 3, 1.5, MID); box(g, 26, 64, 20, 3, 1.5, MID); box(g, 26, 74, 14, 3, 1.5, MID);
    box(g, 66, 42, 44, 4, 2, MID);
    box(g, 66.5, 52.5, 46, 26, 4, W, LINE); box(g, 72, 58, 18, 2.5, 1.25, MID); box(g, 72, 66, 26, 6, 2, INK);
    box(g, 118.5, 52.5, 46, 26, 4, W, LINE); box(g, 124, 58, 18, 2.5, 1.25, MID); box(g, 124, 66, 22, 6, 2, MID);
    box(g, 66.5, 84.5, 98, 46, 4, W, LINE);
    seg(g, 67, 100.5, 164, 100.5, '#e6e6e4', [2, 3]); seg(g, 67, 115.5, 164, 115.5, '#e6e6e4', [2, 3]);
    box(g, 176.5, 42.5, 64, 106, 10, W, TX); box(g, 200, 47, 17, 4, 2, MID); box(g, 200, 143, 17, 2, 1, MID);
    lbl(g, 'WEB APP', 18, 158); lbl(g, 'MOBILE', 208.5, 158, 'center');
  }
  function appsDraw(g, t) {
    var p = t / 60, i, j, a, d, o, grad, len = 0, run, dy;
    g.translate(11, 0);
    // chart: gradient hill revealed in step with the line
    o = kf(p, [[0, 1], [84, 1], [94, 0], [100, 0]], IO)[0];
    a = kf(p, [[0, 0], [45, 1], [100, 1]], IO)[0];
    if (o > 0 && a > 0) {
      g.save(); g.globalAlpha = o; g.beginPath(); g.rect(67, 85, 97 * a, 45); g.clip();
      grad = g.createLinearGradient(0, 92, 0, 130); grad.addColorStop(0, 'rgba(20,20,20,.16)'); grad.addColorStop(1, 'rgba(20,20,20,0)');
      g.beginPath(); g.moveTo(PTS[0][0], PTS[0][1]); for (i = 1; i < PTS.length; i++) g.lineTo(PTS[i][0], PTS[i][1]);
      g.lineTo(157, 130); g.lineTo(72, 130); g.closePath(); g.fillStyle = grad; g.fill(); g.restore();
    }
    // line draw (dash offset 100 -> 0), then fade
    d = 1 - kf(p, [[0, 100], [45, 0], [84, 0], [94, 0], [100, 100]], IO)[0] / 100;
    o = kf(p, [[0, 1], [84, 1], [94, 0], [100, 0]], IO)[0];
    if (d > 0 && o > 0) {
      for (i = 1; i < PTS.length; i++) len += Math.hypot(PTS[i][0] - PTS[i - 1][0], PTS[i][1] - PTS[i - 1][1]);
      run = len * d; g.save(); g.globalAlpha = o; g.beginPath(); g.moveTo(PTS[0][0], PTS[0][1]);
      for (i = 1; i < PTS.length && run > 0; i++) {
        j = Math.hypot(PTS[i][0] - PTS[i - 1][0], PTS[i][1] - PTS[i - 1][1]);
        if (run >= j) { g.lineTo(PTS[i][0], PTS[i][1]); run -= j; }
        else { g.lineTo(PTS[i - 1][0] + (PTS[i][0] - PTS[i - 1][0]) * run / j, PTS[i - 1][1] + (PTS[i][1] - PTS[i - 1][1]) * run / j); run = 0; }
      }
      g.strokeStyle = TX; g.lineWidth = 1; g.lineJoin = g.lineCap = 'round'; g.stroke(); g.restore();
    }
    o = kf(p, [[0, 0], [42, 0], [48, 1], [84, 1], [94, 0], [100, 0]], IO)[0];
    if (o > 0) {
      g.save(); g.globalAlpha = o; seg(g, 157, 92, 157, 130, MID, [2, 2]);
      dot(g, 157, 92, 5.6, 'rgba(20,20,20,.1)'); dot(g, 157, 92, 2.8, W, TX, 1.1); g.restore();
    }
    // phone list steps up one row at a time (5 rows repeat, so the loop is seamless)
    dy = kf(p, [[0, 0], [14, 0], [20, -20], [34, -20], [40, -40], [54, -40], [60, -60], [74, -60], [80, -80], [94, -80], [100, -100]], bez(.6, 0, .2, 1))[0];
    g.save(); rr(g, 182, 57, 52, 84, 2); g.clip(); g.translate(0, dy);
    for (i = 0; i < 10; i++) {
      var r = ROWS[i % 5], cy = 66 + 20 * i;
      dot(g, 190, cy, 4, r[0]); box(g, 198, cy - 3.5, r[1], 3, 1.5, MID); box(g, 198, cy + 1.5, r[2], 2.5, 1.25, SOFT);
      seg(g, 184, cy + 10, 232, cy + 10, '#f0f0ee');
    }
    g.restore();
  }

  /* ================= 3. Automation (6s) ================= */
  function chip(g, y, label, p, from) {
    var s = kf(p, [[0, 0, -6], [from, 0, -6], [from + 6, 1, 0], [88, 1, 0], [94, 0, 0], [100, 0, 0]], POP);
    if (s[0] <= 0) return;
    g.save(); g.globalAlpha = s[0]; g.translate(s[1], 0);
    box(g, 208.5, y, 54, 18, 9, W, LINE); dot(g, 218.5, y + 9, 4, INK); icon(g, 'check', 215.5, y + 6, 6, BG, 4);
    txt(g, label, 227, y + 12, 8.5, TX); g.restore();
  }
  function bubble(g, p, stops, fn) {
    var s = kf(p, stops, POP);
    if (s[0] <= 0) return;
    g.save(); g.globalAlpha = s[0]; g.translate(0, s[1]); fn(); g.restore();
  }
  function autoStatic(g) {
    [[51.5, 26, 0], [71.5, 20, 1], [91.5, 24, 2]].forEach(function (r) {
      box(g, 18.5, r[0], 58, 16, 5, W, LINE); dot(g, 27.5, r[0] + 8, 3.5, MID); box(g, 35, r[0] + 6.75, r[1], 2.5, 1.25, MID);
      if (r[2] === 1) dot(g, 69, r[0] + 8, 2, INK); if (r[2] === 2) dot(g, 69, r[0] + 8, 2, MID);
    });
    lbl(g, 'INBOX', 18, 126); lbl(g, 'DONE', 208, 126);
    box(g, 88.5, 12.5, 103, 135, 10, W, TX); box(g, 96, 19, 11, 11, 3.5, INK); icon(g, 'plus', 99, 22, 5, BG, 5);
    txt(g, 'AI agent', 112, 27.3, 8, TX); seg(g, 89, 36.5, 191, 36.5, LINE);
    box(g, 96.5, 128.5, 88, 12, 6, W, LINE); box(g, 102, 133.25, 30, 2.5, 1.25, SOFT);
    dot(g, 178.5, 134.5, 4.2, INK); icon(g, 'up', 175.5, 131.5, 6, BG, 4);
  }
  function autoDraw(g, t) {
    var p = t / 60, i, o;
    dot(g, 69, 59.5, 2, mix(INK, MID, kf(p, [[0, 0], [6, 0], [10, 1], [88, 1], [94, 0], [100, 0]])[0]));
    bubble(g, p, [[0, 0, 6], [3, 0, 6], [9, 1, 0], [88, 1, 0], [94, 0, 0], [100, 0, 0]], function () {
      box(g, 122, 44, 62, 20, 7, INK); box(g, 128, 50, 46, 2.5, 1.25, BG); box(g, 128, 56, 30, 2.5, 1.25, '#8f8f8d');
    });
    o = kf(p, [[0, 0], [12, 0], [15, 1], [30, 1], [32, 0], [100, 0]])[0];
    if (o > 0) {
      g.save(); g.globalAlpha = o; box(g, 96, 70, 26, 14, 7, SOFT);
      for (i = 0; i < 3; i++) {
        g.save(); g.globalAlpha = o * kf(((t - i * 150) % 1000 + 1000) % 1000 / 10, [[0, .35], [50, 1], [100, .35]], IO)[0];
        dot(g, 103 + i * 6, 77, 1.4, '#8f8f8d'); g.restore();
      }
      g.restore();
    }
    bubble(g, p, [[0, 0, 6], [31, 0, 6], [36, 1, 0], [88, 1, 0], [94, 0, 0], [100, 0, 0]], function () {
      box(g, 96, 70, 62, 26, 7, SOFT); box(g, 102, 76, 46, 2.5, 1.25, MID); box(g, 102, 82, 38, 2.5, 1.25, MID); box(g, 102, 88, 24, 2.5, 1.25, '#e0e0de');
    });
    bubble(g, p, [[0, 0, 6], [70, 0, 6], [75, 1, 0], [88, 1, 0], [94, 0, 0], [100, 0, 0]], function () {
      box(g, 146, 102, 38, 14, 7, INK); box(g, 152, 107.75, 24, 2.5, 1.25, BG);
    });
    chip(g, 51.5, 'Replied', p, 38); chip(g, 73.5, 'In CRM', p, 48); chip(g, 95.5, 'Booked', p, 58);
  }

  /* ================= 4. Marketing (6s) ================= */
  var CAL_DARK = [2, 6, 10, 17, 20, 27], CAL_MID = [4, 8, 13, 19, 25, 31];
  function mktStatic(g) {
    var n, c, r;
    for (n = 0; n < 35; n++) {
      if (n === 24) continue;
      c = n % 7; r = (n / 7) | 0;
      box(g, 10 + c * 10, 52 + r * 11.5, 8, 8, 2.5, CAL_DARK.indexOf(n) > -1 ? INK : CAL_MID.indexOf(n) > -1 ? MID : SOFT);
    }
    lbl(g, 'CALENDAR', 10, 126); lbl(g, 'ENGAGEMENT', 208, 126);
    box(g, 88.5, 12.5, 103, 135, 10, W, TX);
    dot(g, 101, 26, 6, '#e4e4e2');
    g.save(); g.beginPath(); g.arc(101, 26, 6, 0, TAU); g.clip(); dot(g, 101, 24.2, 2.4, '#a9a9a7');
    g.beginPath(); g.ellipse(101, 32.2, 4.8, 4, 0, 0, TAU); g.fillStyle = '#a9a9a7'; g.fill(); g.restore();
    dot(g, 101, 26, 6.5, null, LINE);
    box(g, 112, 21.5, 36, 3.5, 1.75, MID); box(g, 112, 28, 22, 2.5, 1.25, SOFT);
    dot(g, 174, 26, 1.1, '#b4b4b2'); dot(g, 178, 26, 1.1, '#b4b4b2'); dot(g, 182, 26, 1.1, '#b4b4b2');
    icon(g, 'heart', 96, 112, 12, TX); icon(g, 'comment', 112, 112, 12, TX); icon(g, 'send', 128, 112, 12, TX); icon(g, 'bookmark', 171.5, 112, 12, TX);
  }
  function mktDraw(g, t) {
    var p = t / 60, f = t / 6000, n, x, s, o;
    // calendar slot gets scheduled
    s = kf(p, [[0, 0, 1], [60, 0, 1], [64, 1, 1.2], [68, 1, 1], [88, 1, 1], [94, 0, 1], [100, 0, 1]]);
    g.save(); g.translate(44, 90.5); g.scale(s[1], s[1]); box(g, -4, -4, 8, 8, 2.5, mix(SOFT, INK, s[0])); g.restore();
    // two-slide carousel
    x = kf(p, [[0, 0], [48, 0], [56, -88], [86, -88], [94, 0], [100, 0]], bez(.65, 0, .25, 1))[0];
    g.save(); rr(g, 96, 38, 88, 66, 5); g.clip(); g.translate(x, 0);
    g.fillStyle = SOFT; g.fillRect(96, 38, 88, 66); dot(g, 119, 56, 6.5, W);
    path(g, 'M96 104V80C108 68 120 69 130 77C138 83 148 83 156 76C166 68 176 70 184 77V104Z', LINE);
    path(g, 'M96 104V90C110 83 122 86 134 90C148 95 162 88 172 86C177 85 181 86 184 88V104Z', '#cbcbc9');
    g.fillStyle = '#e8e8e6'; g.fillRect(184, 38, 88, 66); dot(g, 206, 58, 8, W);
    g.fillStyle = '#d8d8d6'; g.fillRect(184, 94, 88, 10);
    path(g, 'M222 104V76a13 13 0 0 1 26 0V104Z', '#cbcbc9'); path(g, 'M252 104V88a8 8 0 0 1 16 0V104Z', LINE); path(g, 'M186 104V92a6 6 0 0 1 12 0V104Z', '#b9b9b7');
    g.restore();
    box(g, 159, 43, 19, 9.5, 4.75, 'rgba(31,31,31,.78)');
    o = kf(p, [[0, 1], [50, 1], [54, 0], [88, 0], [92, 1], [100, 1]])[0];
    g.save(); g.globalAlpha = o; txt(g, '1/2', 168.5, 49.9, 5.6, BG, 'center'); g.globalAlpha = 1 - o; txt(g, '2/2', 168.5, 49.9, 5.6, BG, 'center'); g.restore();
    // page dots
    o = kf(p, [[0, 0], [48, 0], [56, 1], [86, 1], [94, 0], [100, 0]])[0];
    dot(g, 152.5, 118, 1.6, mix(INK, '#cfcfcd', o)); dot(g, 159, 118, 1.6, mix('#cfcfcd', INK, o));
    // heart pops, likes count up fast, then the chip shows the same total
    s = kf(p, [[0, 0], [12, 0], [17, 1.25], [21, 1], [88, 1], [94, 0], [100, 0]])[0];
    if (s > 0) icon(g, 'heart', 96, 112, 12, TX, 2, true, s);
    n = f < .12 || f >= .94 ? 0 : f < .28 ? Math.round(1284 * (1 - Math.pow(1 - (f - .12) / .16, 3))) : 1284;
    if (n) txt(g, n.toLocaleString('en-US') + (n === 1 ? ' like' : ' likes'), 96, 137, 8, TX);
    [[51.5, 29, 'heart', '1,284'], [73.5, 39, 'comment', '54'], [95.5, 49, 'send', '90']].forEach(function (c) {
      var a = kf(p, [[0, 0, -6], [c[1], 0, -6], [c[1] + 6, 1, 0], [88, 1, 0], [94, 0, 0], [100, 0, 0]], POP);
      if (a[0] <= 0) return;
      g.save(); g.globalAlpha = a[0]; g.translate(a[1], 0);
      box(g, 208.5, c[0], 54, 18, 9, W, LINE);
      icon(g, c[2], 214, c[0] + 4, 10, TX, c[2] === 'heart' ? 2 : 2.2, c[2] === 'heart');
      txt(g, c[3], 228, c[0] + 12, 8.5, TX); g.restore();
    });
  }

  /* ---- engine ---- */
  var SCENES = {
    design: { T: 7000, still: 4800, s: designStatic, d: designDraw },
    apps: { T: 6000, still: 4500, s: appsStatic, d: appsDraw },
    automation: { T: 6000, still: 5000, s: autoStatic, d: autoDraw },
    marketing: { T: 6000, still: 5000, s: mktStatic, d: mktDraw }
  };
  var live = [], raf = 0, reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render(o, t) {
    var g = o.g, k = o.k;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, o.c.width, o.c.height);
    g.drawImage(o.cache, 0, 0);
    g.setTransform(k, 0, 0, k, 0, 0); o.sc.d(g, t);
  }
  function resize(o) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(o.c.clientWidth * dpr);
    if (!w || w === o.c.width) return;
    o.c.width = w; o.c.height = Math.round(w * 160 / 280); o.k = w / 280;
    o.cache.width = o.c.width; o.cache.height = o.c.height;
    var cg = o.cache.getContext('2d'); cg.setTransform(o.k, 0, 0, o.k, 0, 0); o.sc.s(cg);
    render(o, reduced ? o.sc.still : (o.t || 0));
  }
  function tick(now) {
    var i, o;
    for (i = 0; i < live.length; i++) {
      o = live[i]; if (o.t0 == null) o.t0 = now;
      o.t = (now - o.t0) % o.sc.T; render(o, o.t);
    }
    raf = live.length ? requestAnimationFrame(tick) : 0;
  }
  function setLive(o, on) {
    var i = live.indexOf(o);
    if (on && i < 0) { o.t0 = null; live.push(o); } else if (!on && i > -1) live.splice(i, 1);
    if (live.length && !raf && !document.hidden) raf = requestAnimationFrame(tick);
  }

  function init() {
    var items = [].slice.call(document.querySelectorAll('canvas[data-scene]')).map(function (c) {
      return { c: c, g: c.getContext('2d'), cache: document.createElement('canvas'), sc: SCENES[c.dataset.scene], k: 1, t: 0 };
    }).filter(function (o) { return o.sc; });
    if (!items.length) return;
    var ro = 'ResizeObserver' in window ? new ResizeObserver(function (es) {
      es.forEach(function (e) { items.forEach(function (o) { if (o.c === e.target) resize(o); }); });
    }) : null;
    items.forEach(function (o) { resize(o); if (ro) ro.observe(o.c); });
    if (reduced || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { items.forEach(function (o) { if (o.c === e.target) setLive(o, e.isIntersecting); }); });
    }, { rootMargin: '80px' });
    items.forEach(function (o) { io.observe(o.c); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (live.length && !raf) raf = requestAnimationFrame(tick);
    });
    window.__illo = { items: items, render: render };   // handy for debugging / screenshots
  }

  // wait for the page font so text is measured and drawn correctly
  (document.fonts && document.fonts.load ? document.fonts.load('500 8px "Inter Tight"') : Promise.resolve()).then(init, init);
})();
