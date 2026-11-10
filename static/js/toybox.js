/* ---------- Hero toybox: the tools we work with, as pieces you can throw around, with real physics ----------
   Under the hero text a handful of app logos on small tiles drop to the floor: Figma, VS Code, Claude, Claude Code, Antigravity,
   Pinterest, Dribbble, GitHub and more (the logo paths are in toybox-logos.js). You can pick any of them up, drag
   them around and throw them. They are heavy and damped (soft landings, little bounce), they pile up, they bump into each
   other, and they collide with the hero's own text and buttons, the walls and the nav, so a thrown logo can rest on the
   headline or hit the button.

   The physics is a small engine written for this file (rigid bodies: circles and convex polygons, impulse
   solving with friction), so there is nothing to download. It runs only while something is moving and the hero is on
   screen. Mouse and touch both work; on a touch screen a drag that starts on a tile moves it, anywhere else it scrolls.
   With reduced motion the tiles simply rest in a still pile and cannot be moved.

   Everything is drawn on one canvas that lies over the first screen (.page). It never blocks clicks:
   the canvas ignores the pointer, and tiles are picked up by testing the pointer against them. */
(function () {
  var page = document.querySelector('.page');
  var canvas = document.querySelector('.toybox');
  var stage = document.querySelector('.hero__stage');
  if (!page || !canvas || !stage || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var INK = '#141414', SURF = '#fafafa', G1 = '#d9d9d7', G2 = '#bdbdbb', G3 = '#8f8f8d';
  var GRAVITY = 1700, STEP = 1 / 120, SUBSTEPS = 2, ITER = 8;
  var PI = Math.PI, TAU = PI * 2;

  /* ================= a small physics engine ================= */
  var bodies = [], statics = [];

  function dot(ax, ay, bx, by) { return ax * bx + ay * by; }
  function cross(ax, ay, bx, by) { return ax * by - ay * bx; }

  function roundRectPoly(w, h, r, seg) {                    // a rounded rectangle as a convex polygon
    var pts = [], cs = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 1], [-w / 2 + r, -h / 2 + r, 2], [w / 2 - r, -h / 2 + r, 3]];
    cs.forEach(function (c) {
      for (var i = 0; i <= seg; i++) {
        var a = (c[2] * 0.5 + i / seg * 0.5) * PI;
        pts.push({ x: c[0] + Math.cos(a) * r, y: c[1] + Math.sin(a) * r });
      }
    });
    return pts;
  }
  function boxPoly(w, h) { return [{ x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }]; }

  function makeBody(o) {
    var b = {
      x: o.x || 0, y: o.y || 0, a: o.a || 0, vx: 0, vy: 0, w: 0,
      circle: !!o.r, r: o.r || 0, local: o.verts || null, kind: o.kind || '', isStatic: !!o.isStatic,
      e: o.e == null ? 0.22 : o.e, f: o.f == null ? 0.55 : o.f, ghost: false, tag: o.tag || '', world: [], norms: [], hover: 0
    };
    var area = o.r ? PI * o.r * o.r : o.w * o.h, mass = b.isStatic ? 0 : area * 0.002;
    b.invM = mass ? 1 / mass : 0;
    var inertia = o.r ? 0.5 * mass * o.r * o.r : mass * (o.w * o.w + o.h * o.h) / 12;
    b.invI = inertia ? 1 / inertia : 0;
    b.hw = o.w || o.r * 2; b.hh = o.h || o.r * 2;
    if (!b.circle) {                                       // outward normals of the local polygon
      b.local = b.local.filter(function (p, k, arr) { var q = arr[(k + arr.length - 1) % arr.length]; return Math.abs(p.x - q.x) + Math.abs(p.y - q.y) > 0.01; });   // a pill has doubled corner points: drop them
      var n = b.local.length, cx = 0, cy = 0, i;
      for (i = 0; i < n; i++) { cx += b.local[i].x; cy += b.local[i].y; }
      cx /= n; cy /= n;
      b.ln = [];
      for (i = 0; i < n; i++) {
        var p = b.local[i], q = b.local[(i + 1) % n], ex = q.x - p.x, ey = q.y - p.y, l = Math.sqrt(ex * ex + ey * ey) || 1, nx = ey / l, ny = -ex / l;
        if (nx * (p.x - cx) + ny * (p.y - cy) < 0) { nx = -nx; ny = -ny; }
        b.ln.push({ x: nx, y: ny });
      }
    }
    update(b);
    return b;
  }
  function update(b) {                                      // world-space vertices, normals and bounds
    var c = Math.cos(b.a), s = Math.sin(b.a);
    if (b.circle) { b.minX = b.x - b.r; b.maxX = b.x + b.r; b.minY = b.y - b.r; b.maxY = b.y + b.r; return; }
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (var i = 0; i < b.local.length; i++) {
      var l = b.local[i], wx = b.x + l.x * c - l.y * s, wy = b.y + l.x * s + l.y * c;
      b.world[i] = { x: wx, y: wy };
      var ln = b.ln[i]; b.norms[i] = { x: ln.x * c - ln.y * s, y: ln.x * s + ln.y * c };
      if (wx < minX) minX = wx; if (wx > maxX) maxX = wx; if (wy < minY) minY = wy; if (wy > maxY) maxY = wy;
    }
    b.minX = minX; b.maxX = maxX; b.minY = minY; b.maxY = maxY;
  }

  /* ---- contact generation: each returns { nx, ny, pts: [{x, y, d}] } with the normal pointing from A to B ---- */
  function circleCircle(A, B) {
    var dx = B.x - A.x, dy = B.y - A.y, d2 = dx * dx + dy * dy, rr = A.r + B.r;
    if (d2 >= rr * rr) return null;
    var d = Math.sqrt(d2) || 0.0001, nx = dx / d, ny = dy / d;
    return { nx: nx, ny: ny, pts: [{ x: A.x + nx * (A.r - (rr - d) / 2), y: A.y + ny * (A.r - (rr - d) / 2), d: rr - d }] };
  }
  function circlePoly(C, P) {                                // normal from C to P
    var n = P.world.length, best = -1e9, bi = 0, i;
    for (i = 0; i < n; i++) {
      var s = dot(C.x - P.world[i].x, C.y - P.world[i].y, P.norms[i].x, P.norms[i].y);
      if (s > best) { best = s; bi = i; }
    }
    if (best > C.r) return null;
    var v1 = P.world[bi], v2 = P.world[(bi + 1) % n], ex = v2.x - v1.x, ey = v2.y - v1.y, l2 = ex * ex + ey * ey || 1;
    var t = dot(C.x - v1.x, C.y - v1.y, ex, ey) / l2, qx, qy;
    if (t < 0) { qx = v1.x; qy = v1.y; } else if (t > 1) { qx = v2.x; qy = v2.y; } else { qx = v1.x + ex * t; qy = v1.y + ey * t; }
    var dx = C.x - qx, dy = C.y - qy, dist = Math.sqrt(dx * dx + dy * dy), nx, ny, depth;
    if (best < 0) { nx = -P.norms[bi].x; ny = -P.norms[bi].y; depth = C.r - best; }          // the centre is inside the polygon
    else { if (dist > C.r) return null; nx = -dx / (dist || 1); ny = -dy / (dist || 1); depth = C.r - dist; }
    return { nx: nx, ny: ny, pts: [{ x: C.x + nx * (C.r - depth / 2), y: C.y + ny * (C.r - depth / 2), d: depth }] };
  }
  function maxSeparation(A, B) {                             // the face of A that B is furthest outside (or least inside)
    var best = -1e9, idx = 0;
    for (var i = 0; i < A.world.length; i++) {
      var minS = 1e9, nx = A.norms[i].x, ny = A.norms[i].y, vx = A.world[i].x, vy = A.world[i].y;
      for (var j = 0; j < B.world.length; j++) {
        var s = dot(B.world[j].x - vx, B.world[j].y - vy, nx, ny);
        if (s < minS) minS = s;
      }
      if (minS > best) { best = minS; idx = i; }
    }
    return { sep: best, idx: idx };
  }
  function clip(p1, p2, nx, ny, c) {
    var d1 = dot(nx, ny, p1.x, p1.y) - c, d2 = dot(nx, ny, p2.x, p2.y) - c, out = [];
    if (d1 >= 0) out.push(p1);
    if (d2 >= 0) out.push(p2);
    if (d1 * d2 < 0) { var t = d1 / (d1 - d2); out.push({ x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t }); }
    return out;
  }
  function polyPoly(A, B) {
    var sa = maxSeparation(A, B); if (sa.sep > 0) return null;
    var sb = maxSeparation(B, A); if (sb.sep > 0) return null;
    var flip = sb.sep > sa.sep + 0.5, R = flip ? B : A, I = flip ? A : B, ri = flip ? sb.idx : sa.idx;
    var rn = R.norms[ri], rv1 = R.world[ri], rv2 = R.world[(ri + 1) % R.world.length];
    var ii = 0, md = 1e9, k;                                  // the incident face: the one of I that faces the reference face most directly
    for (k = 0; k < I.world.length; k++) { var d = dot(rn.x, rn.y, I.norms[k].x, I.norms[k].y); if (d < md) { md = d; ii = k; } }
    var i1 = I.world[ii], i2 = I.world[(ii + 1) % I.world.length];
    var tx = rv2.x - rv1.x, ty = rv2.y - rv1.y, tl = Math.sqrt(tx * tx + ty * ty) || 1; tx /= tl; ty /= tl;
    var c1 = clip(i1, i2, tx, ty, dot(tx, ty, rv1.x, rv1.y)); if (c1.length < 2) return null;
    var c2 = clip(c1[0], c1[1], -tx, -ty, -dot(tx, ty, rv2.x, rv2.y)); if (c2.length < 2) return null;
    var pts = [];
    for (k = 0; k < 2; k++) {
      var sep = dot(c2[k].x - rv1.x, c2[k].y - rv1.y, rn.x, rn.y);
      if (sep <= 0) pts.push({ x: c2[k].x, y: c2[k].y, d: -sep });
    }
    if (!pts.length) return null;
    return { nx: flip ? -rn.x : rn.x, ny: flip ? -rn.y : rn.y, pts: pts };
  }
  function collide(A, B) {
    if (A.maxX < B.minX || B.maxX < A.minX || A.maxY < B.minY || B.maxY < A.minY) return null;
    if (A.circle && B.circle) return circleCircle(A, B);
    if (A.circle) return circlePoly(A, B);
    if (B.circle) { var m = circlePoly(B, A); if (!m) return null; m.nx = -m.nx; m.ny = -m.ny; return m; }
    return polyPoly(A, B);
  }

  /* ---- one step of the world ---- */
  var grab = null;                                           // { body, lx, ly, tx, ty } while a piece is held
  function applyImpulse(b, jx, jy, px, py) {
    b.vx += jx * b.invM; b.vy += jy * b.invM;
    b.w += b.invI * cross(px - b.x, py - b.y, jx, jy);
  }
  function stepWorld(dt) {
    var i, j, all = bodies.length;
    for (i = 0; i < all; i++) {                              // forces and damping
      var b = bodies[i];
      b.vy += GRAVITY * dt;
      b.vx /= 1 + dt * 0.12; b.vy /= 1 + dt * 0.12; b.w /= 1 + dt * 1.6;
    }
    if (grab) {                                              // a spring from the pointer to the point that was picked up
      var g = grab.body, c = Math.cos(g.a), s = Math.sin(g.a);
      var px = g.x + grab.lx * c - grab.ly * s, py = g.y + grab.lx * s + grab.ly * c;
      var pvx = g.vx - g.w * (py - g.y), pvy = g.vy + g.w * (px - g.x);
      var fx = (grab.tx - px) * 260 - pvx * 22, fy = (grab.ty - py) * 260 - pvy * 22;
      var fm = Math.sqrt(fx * fx + fy * fy), cap = 5200; if (fm > cap) { fx *= cap / fm; fy *= cap / fm; }
      applyImpulse(g, fx * dt / g.invM, fy * dt / g.invM, px, py);          // the force is per unit of mass, so a heavy piece follows like a light one
    }
    var man = [];
    for (i = 0; i < all; i++) {                              // find contacts
      var A = bodies[i];
      for (j = i + 1; j < all; j++) { var m = collide(A, bodies[j]); if (m) { m.A = A; m.B = bodies[j]; man.push(m); } }
      for (j = 0; j < statics.length; j++) {
        var S = statics[j];
        if (A.ghost && S.tag === 'dom') continue;
        var m2 = collide(A, S); if (m2) { m2.A = A; m2.B = S; man.push(m2); }
      }
    }
    var k, p;
    for (k = 0; k < man.length; k++) {                       // set up the solver
      var mm = man[k];
      mm.e = Math.min(mm.A.e, mm.B.e); mm.mu = Math.sqrt(mm.A.f * mm.B.f);
      for (p = 0; p < mm.pts.length; p++) {
        var cp = mm.pts[p];
        cp.ra = [cp.x - mm.A.x, cp.y - mm.A.y]; cp.rb = [cp.x - mm.B.x, cp.y - mm.B.y];
        var rna = cross(cp.ra[0], cp.ra[1], mm.nx, mm.ny), rnb = cross(cp.rb[0], cp.rb[1], mm.nx, mm.ny);
        cp.nm = 1 / (mm.A.invM + mm.B.invM + rna * rna * mm.A.invI + rnb * rnb * mm.B.invI);
        var tx = -mm.ny, ty = mm.nx, rta = cross(cp.ra[0], cp.ra[1], tx, ty), rtb = cross(cp.rb[0], cp.rb[1], tx, ty);
        cp.tm = 1 / (mm.A.invM + mm.B.invM + rta * rta * mm.A.invI + rtb * rtb * mm.B.invI);
        var rvx = mm.B.vx - mm.B.w * cp.rb[1] - mm.A.vx + mm.A.w * cp.ra[1], rvy = mm.B.vy + mm.B.w * cp.rb[0] - mm.A.vy - mm.A.w * cp.ra[0];
        var vn0 = dot(rvx, rvy, mm.nx, mm.ny);
        cp.bias = vn0 < -90 ? -mm.e * vn0 : 0;               // only a real impact bounces; resting contact does not
        cp.jn = 0; cp.jt = 0;
      }
    }
    for (var it = 0; it < ITER; it++) {
      for (k = 0; k < man.length; k++) {
        var q = man[k], A2 = q.A, B2 = q.B;
        for (p = 0; p < q.pts.length; p++) {
          var c2 = q.pts[p];
          var rx = B2.vx - B2.w * c2.rb[1] - A2.vx + A2.w * c2.ra[1], ry = B2.vy + B2.w * c2.rb[0] - A2.vy - A2.w * c2.ra[0];
          var vn = dot(rx, ry, q.nx, q.ny), lam = c2.nm * (-vn + c2.bias), old = c2.jn;
          c2.jn = Math.max(0, old + lam); lam = c2.jn - old;
          var jx = q.nx * lam, jy = q.ny * lam;
          A2.vx -= jx * A2.invM; A2.vy -= jy * A2.invM; A2.w -= A2.invI * cross(c2.ra[0], c2.ra[1], jx, jy);
          B2.vx += jx * B2.invM; B2.vy += jy * B2.invM; B2.w += B2.invI * cross(c2.rb[0], c2.rb[1], jx, jy);
          rx = B2.vx - B2.w * c2.rb[1] - A2.vx + A2.w * c2.ra[1]; ry = B2.vy + B2.w * c2.rb[0] - A2.vy - A2.w * c2.ra[0];
          var tx2 = -q.ny, ty2 = q.nx, vt = dot(rx, ry, tx2, ty2), lt = -vt * c2.tm, mx = q.mu * c2.jn, oldt = c2.jt;
          c2.jt = Math.max(-mx, Math.min(mx, oldt + lt)); lt = c2.jt - oldt;
          jx = tx2 * lt; jy = ty2 * lt;
          A2.vx -= jx * A2.invM; A2.vy -= jy * A2.invM; A2.w -= A2.invI * cross(c2.ra[0], c2.ra[1], jx, jy);
          B2.vx += jx * B2.invM; B2.vy += jy * B2.invM; B2.w += B2.invI * cross(c2.rb[0], c2.rb[1], jx, jy);
        }
      }
    }
    for (i = 0; i < all; i++) {                              // move
      var bd = bodies[i], sp = Math.sqrt(bd.vx * bd.vx + bd.vy * bd.vy);
      if (sp > 3200) { bd.vx *= 3200 / sp; bd.vy *= 3200 / sp; }
      if (bd.w > 14) bd.w = 14; else if (bd.w < -14) bd.w = -14;
      bd.x += bd.vx * dt; bd.y += bd.vy * dt; bd.a += bd.w * dt;
    }
    for (k = 0; k < man.length; k++) {                       // push overlapping pieces apart a little, so piles do not sink
      var u = man[k], depth = 0;
      for (p = 0; p < u.pts.length; p++) if (u.pts[p].d > depth) depth = u.pts[p].d;
      var corr = Math.max(depth - 0.5, 0) * 0.35 / ((u.A.invM + u.B.invM) || 1);
      u.A.x -= u.nx * corr * u.A.invM; u.A.y -= u.ny * corr * u.A.invM;
      u.B.x += u.nx * corr * u.B.invM; u.B.y += u.ny * corr * u.B.invM;
    }
    for (i = 0; i < all; i++) update(bodies[i]);
  }

  /* ================= the scene ================= */
  var pending = [], busyUntil = 0, W = 0, H = 0, dpr = 1, basket = { x: 0, y: 0, w: 0, h: 0 }, line = { x: 0, w: 0 }, zone = { x: 0, w: 0 }, floorY = 0, scale = 1, built = false;

  var TILE = { size: 54, r: 14, glyph: 29 };                  // each logo sits on a rounded tile
  var LOGOS = (window.TOYBOX_LOGOS || []).map(function (l, i) {
    return { k: l.k, vb: l.vb, path: new Path2D(l.d), eo: l.eo };
  });

  function wall(x, y, w, h, tag) { var s = makeBody({ x: x + w / 2, y: y + h / 2, w: w, h: h, verts: boxPoly(w, h), isStatic: true, tag: tag, f: 0.6, e: 0.15 }); statics.push(s); }

  function rectOf(el, text) {                               // an element's box in page coordinates (the text itself, if asked)
    var pr = page.getBoundingClientRect(), r;
    if (text) { var rg = document.createRange(); rg.selectNodeContents(el); r = rg.getBoundingClientRect(); }
    else r = el.getBoundingClientRect();
    return { x: r.left - pr.left, y: r.top - pr.top, w: r.width, h: r.height };
  }

  function layout() {                                       // everything that depends on the page size
    var pr = page.getBoundingClientRect(); W = pr.width; H = pr.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    scale = Math.max(0.8, Math.min(1, W / 1100));
    var sr = rectOf(stage), pad = parseFloat(getComputedStyle(page).paddingLeft) || 20;
    floorY = H - 2;                                           // the floor is the bottom edge of the hero
    line.x = 0; line.w = W;                                   // and the line under the logos runs the full width, so nothing looks like it floats
    zone.w = Math.min(960, W - 2 * pad); zone.x = (W - zone.w) / 2;
    if (W < 520) scale = Math.max(0.62, Math.min(scale, (zone.w - 16) / (Math.ceil(LOGOS.length / 2) * 1.06 * TILE.size)));   // on a phone the tiles shrink a little, so all of them fit in two rows
    basket.w = Math.max(200, zone.w - (W < 520 ? 16 : 96)); basket.x = (W - basket.w) / 2; basket.h = 60; basket.y = floorY - 60;    // the pieces land inside the content width, away from its ends

    statics.length = 0;
    wall(-400, -400, 400, H + 800, 'wall'); wall(W, -400, 400, H + 800, 'wall');   // left and right edges of the screen
    wall(-400, -400, W + 800, 400, 'wall');                                       // the top of the hero
    wall(-400, floorY, W + 800, 400, 'floor');                                    // the floor

    wall(zone.x - 14, floorY - 700, 14, 720, 'lid'); wall(zone.x + zone.w, floorY - 700, 14, 720, 'lid');   // for the first moments, soft walls at the ends of the line keep the landing pieces inside it

    var items = [[document.querySelector('.hero__title'), true], [document.querySelector('.lead'), true]];
    [].forEach.call(document.querySelectorAll('.hero__actions .btn'), function (el) { items.push([el, false]); });
    if (window.innerWidth >= 1000) {                        // the bar is part of the page on desktop, so its logo and button are solid too
      [].forEach.call(document.querySelectorAll('.topbar__bar .brand, .topbar__cta'), function (el) { if (el.offsetWidth) items.push([el, false]); });
    }
    items.forEach(function (it) {
      if (!it[0]) return;
      var r = rectOf(it[0], it[1]); if (r.w < 2 || r.h < 2) return;
      wall(r.x - 2, r.y + 2, r.w + 4, r.h - 4, 'dom');
    });
  }

  function dropLids() { for (var i = statics.length - 1; i >= 0; i--) if (statics[i].tag === 'lid') statics.splice(i, 1); }

  function addPiece(t, x, y, tilt) {
    var sz = TILE.size * scale, o = { x: x, y: y, a: tilt || 0, kind: t.k, w: sz, h: sz, e: 0.1, f: 0.6 };
    o.verts = roundRectPoly(sz, sz, TILE.r * scale, 3);
    var b = makeBody(o); b.ghost = true; b.logo = t; b.size = scale; b.born = elapsed; b.fade = 1; bodies.push(b); return b;
  }

  /* The logos arrive one after another: each fades in a little above its own spot, in the lowest column, and settles
     straight down onto it, so they sit side by side and stack evenly instead of tumbling over each other. */
  function spawn(settled) {
    bodies.length = 0; pending.length = 0; grab = null; elapsed = 0;
    var sz = TILE.size * scale, binW = sz * 1.06, nb = Math.max(2, Math.floor(basket.w / binW)), layers = [], x0 = basket.x + (basket.w - nb * binW) / 2, k;
    var list = LOGOS.slice();                                                       // every logo, on every screen
    for (var i = list.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = list[i]; list[i] = list[j]; list[j] = tmp; }
    if (nb >= list.length) {                                                         // room for all of them in one row: space them out evenly
      nb = list.length; binW = Math.min(sz * 1.3, basket.w / nb); x0 = basket.x + (basket.w - nb * binW) / 2;
    }
    for (k = 0; k < nb; k++) layers.push(0);
    list.forEach(function (t, n) {
      var low = Math.min.apply(null, layers), cand = [];
      layers.forEach(function (l, c) { if (l === low) cand.push(c); });
      var col = cand[Math.floor(Math.random() * cand.length)], x = x0 + (col + 0.5) * binW + (Math.random() - 0.5) * 3;
      var rest = floorY - sz / 2 - layers[col] * sz;
      layers[col]++;
      if (settled) addPiece(t, x, rest, (Math.random() - 0.5) * 0.1);
      else pending.push({ t: t, x: x, y: rest - 100, at: 0.45 + n * 0.11 });          // each one appears just above its own spot and settles straight down onto it
    });
    busyUntil = 0.45 + list.length * 0.11 + 2.4;
    if (settled) { for (var s = 0; s < 150; s++) stepWorld(STEP); bodies.forEach(function (b) { b.ghost = false; b.vx = b.vy = b.w = 0; }); dropLids(); }
  }

  /* ================= drawing ================= */
  function rr(c, x, y, w, h, r) {                            // rounded rectangle path; r is a number or [tl, tr, br, bl]
    var a = typeof r === 'number' ? [r, r, r, r] : r;
    c.beginPath(); c.moveTo(x + a[0], y); c.lineTo(x + w - a[1], y); c.arcTo(x + w, y, x + w, y + a[1], a[1]);
    c.lineTo(x + w, y + h - a[2]); c.arcTo(x + w, y + h, x + w - a[2], y + h, a[2]); c.lineTo(x + a[3], y + h); c.arcTo(x, y + h, x, y + h - a[3], a[3]);
    c.lineTo(x, y + a[0]); c.arcTo(x, y, x + a[0], y, a[0]); c.closePath();
  }
  function fillStroke(c, fill, stroke, lw) { if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = lw || 2; c.strokeStyle = stroke; c.stroke(); } }

  function drawLogo(c, t) {                                  // one tile with its logo, centred on (0, 0)
    var h = TILE.size / 2;
    rr(c, -h, -h, TILE.size, TILE.size, TILE.r); c.fillStyle = INK; c.fill();
    var k = TILE.glyph / t.vb;
    c.save(); c.scale(k, k); c.translate(-t.vb / 2, -t.vb / 2);
    c.fillStyle = SURF; c.fill(t.path, t.eo ? 'evenodd' : 'nonzero'); c.restore();
  }

  function drawFloor() {                                     // just a hairline where the pieces rest
    ctx.beginPath(); ctx.moveTo(line.x, floorY + 0.5); ctx.lineTo(line.x + line.w, floorY + 0.5);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(20,20,20,.1)'; ctx.stroke();
  }
  function drawBody(b) {
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
    var sc = b.size * (1 + 0.06 * b.hover); ctx.scale(sc, sc);
    ctx.globalAlpha = b.fade;
    drawLogo(ctx, b.logo);
    ctx.restore();
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    drawFloor();
    var held = grab && grab.body;
    for (var i = 0; i < bodies.length; i++) if (bodies[i] !== held) drawBody(bodies[i]);
    if (held) drawBody(held);
  }

  /* ================= running, and the pointer ================= */
  var raf = 0, last = 0, acc = 0, visible = true, elapsed = 0, calm = 0, ptr = { cx: 0, cy: 0, on: false }, hovered = null, root = document.documentElement;

  function moving() {
    for (var i = 0; i < bodies.length; i++) { var b = bodies[i]; if (Math.abs(b.vx) + Math.abs(b.vy) > 34 || Math.abs(b.w) > 0.6) return true; }
    return false;
  }
  function frame(now) {
    raf = 0;
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; acc += dt; elapsed += dt;
    while (pending.length && elapsed >= pending[0].at) {                          // the next logo arrives
      var q = pending.shift(), nb = addPiece(q.t, q.x, q.y, 0); nb.fade = 0; nb.vy = 120; nb.spin = nb.invI; nb.invI = 0;   // it cannot turn while it lands, so it always sits upright
    }
    bodies.forEach(function (b) {
      if (b.ghost && elapsed - b.born > 1.5) { b.ghost = false; if (b.spin) { b.invI = b.spin; b.spin = 0; b.w = 0; } }   // once landed, it can turn again and bump into the page's text
      if (b.fade < 1) b.fade = Math.min(1, b.fade + dt / 0.28);
    });
    if (!pending.length && bodies.every(function (b) { return !b.ghost; })) dropLids();
    bodies.forEach(function (b) { if (!(b.y < H + 120 && b.y > -300 && b.x > -120 && b.x < W + 120)) { b.x = basket.x + basket.w / 2; b.y = floorY - 60; b.vx = b.vy = b.w = 0; } });   // safety net: a piece that left the world drops back in         // after they have landed in the basket they can hit the page
    if (grab) { var pr = page.getBoundingClientRect(); grab.tx = ptr.cx - pr.left; grab.ty = ptr.cy - pr.top; }
    while (acc >= STEP) { for (var s = 0; s < 1; s++) stepWorld(STEP); acc -= STEP; }
    var target = hovered || (grab && grab.body);
    bodies.forEach(function (b) { b.hover += ((b === target ? 1 : 0) - b.hover) * 0.25; });
    draw();
    calm = (moving() || grab || elapsed < busyUntil) ? 0 : calm + dt;
    if (calm >= 1) bodies.forEach(function (b) { b.vx = b.vy = b.w = 0; });          // at rest: stop the tiny residual jitter and the loop
    if (visible && calm < 1) raf = requestAnimationFrame(frame);
  }
  function wake() { calm = 0; if (!raf && visible && !reduced) { last = 0; raf = requestAnimationFrame(frame); } }

  function pagePoint(cx, cy) { var pr = page.getBoundingClientRect(); return { x: cx - pr.left, y: cy - pr.top }; }
  function inside(b, x, y) {
    if (b.circle) { var dx = x - b.x, dy = y - b.y; return dx * dx + dy * dy <= b.r * b.r; }
    for (var i = 0; i < b.world.length; i++) if (dot(x - b.world[i].x, y - b.world[i].y, b.norms[i].x, b.norms[i].y) > 2) return false;
    return true;
  }
  function pick(cx, cy) {
    var p = pagePoint(cx, cy);
    if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) return null;
    for (var i = bodies.length - 1; i >= 0; i--) if (inside(bodies[i], p.x, p.y)) return bodies[i];
    return null;
  }
  function setHover(b) {
    if (b === hovered) return;
    hovered = b; root.classList.toggle('piece-hover', !!b); wake();
  }
  function onLink(el) { return !!(el && el.closest && el.closest('a, button, input, textarea, select, label')); }

  function down(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    ptr.cx = e.clientX; ptr.cy = e.clientY;
    if (onLink(e.target)) return;
    var b = pick(e.clientX, e.clientY); if (!b) return;
    var p = pagePoint(e.clientX, e.clientY), c = Math.cos(-b.a), s = Math.sin(-b.a), dx = p.x - b.x, dy = p.y - b.y;
    grab = { body: b, lx: dx * c - dy * s, ly: dx * s + dy * c, tx: p.x, ty: p.y };
    b.ghost = false; root.classList.add('piece-drag'); wake();
  }
  function move(e) {
    ptr.cx = e.clientX; ptr.cy = e.clientY; ptr.on = true;
    if (grab) { wake(); return; }
    if (e.pointerType === 'mouse') setHover(onLink(e.target) ? null : pick(e.clientX, e.clientY));
  }
  function release() {
    if (!grab) return;
    var b = grab.body; b.vx *= 1.12; b.vy *= 1.12;                                   // a little extra, so a flick carries
    grab = null; root.classList.remove('piece-drag'); setHover(null); wake();
  }

  function build(settled) { layout(); spawn(settled); draw(); }

  /* ---- start ---- */
  function init() {
    build(reduced);
    if (reduced) return;
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('blur', release);
    document.addEventListener('mouseleave', function () { setHover(null); });
    // On a touch screen, a drag that starts on a piece moves the piece instead of scrolling the page
    window.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; if (!t || onLink(e.target)) return;
      if (pick(t.clientX, t.clientY)) e.preventDefault();
    }, { passive: false });
    window.addEventListener('touchmove', function (e) { if (grab) e.preventDefault(); }, { passive: false });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) wake(); else if (raf) { cancelAnimationFrame(raf); raf = 0; } }).observe(page);
    }
    var timer = 0, lastW = W;
    function relayout() {                                   // the text or the window changed size: rebuild what depends on it
      var oldFloor = floorY; layout();
      if (Math.abs(W - lastW) > 2) { lastW = W; spawn(true); }
      else { bodies.forEach(function (b) { if (b.y > floorY - 4) { b.y = floorY - 30; } if (b.y < 0) b.y = 40; }); }
      draw(); wake();
    }
    function later() { clearTimeout(timer); timer = setTimeout(relayout, 140); }
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(later); ro.observe(page);
      [document.querySelector('.hero__title'), document.querySelector('.lead')].forEach(function (el) { if (el) ro.observe(el); });
    } else window.addEventListener('resize', later);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) wake(); });
    wake();
  }

  canvas._debug = { bodies: bodies, statics: statics, basket: basket, get floor() { return floorY; }, wake: wake, pick: pick };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
