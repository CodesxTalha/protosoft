/* ---------- Process: the ring follows whichever step is at the middle of the screen ---------- */
(function () {
  var sec = document.querySelector('.process');
  var panel = sec && sec.querySelector('.process__ring');
  var steps = sec ? [].slice.call(sec.querySelectorAll('.step')) : [];
  if (!panel || !steps.length) return;

  var NS = 'http://www.w3.org/2000/svg', N = steps.length, C = 110, R = 92, LEN = 2 * Math.PI * R;
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // Build the ring: dotted track, solid progress arc, a numbered dot per step, centre readout
  var svg = el('svg', { 'class': 'ring', viewBox: '0 0 220 220' }, panel);
  el('circle', { 'class': 'ring__track', cx: C, cy: C, r: R }, svg);
  var arc = el('circle', { 'class': 'ring__arc', cx: C, cy: C, r: R, transform: 'rotate(-90 ' + C + ' ' + C + ')', 'stroke-dasharray': '0 ' + LEN }, svg);
  el('circle', { 'class': 'ring__core', cx: C, cy: C, r: 62 }, svg);
  var dots = steps.map(function (s, i) {
    var a = -Math.PI / 2 + i * 2 * Math.PI / N, g = el('g', { 'class': 'rdot' }, svg);
    el('circle', { cx: (C + R * Math.cos(a)).toFixed(2), cy: (C + R * Math.sin(a)).toFixed(2), r: 9 }, g);
    var t = el('text', { x: (C + R * Math.cos(a)).toFixed(2), y: (C + R * Math.sin(a) + 3).toFixed(2) }, g);
    t.textContent = i + 1;
    return g;
  });
  var num = el('text', { 'class': 'ring__num', x: 98, y: 118, 'text-anchor': 'middle' }, svg);
  var total = el('text', { 'class': 'ring__total', x: 128, y: 118 }, svg);
  total.textContent = '/ ' + pad(N);
  var name = el('text', { 'class': 'ring__name', x: C, y: 140, 'text-anchor': 'middle' }, svg);

  var timeline = sec.querySelector('.timeline'), rail = timeline.querySelector('.tl-rail');
  var fill = rail.querySelector('.tl-rail__fill'), thumb = rail.querySelector('.tl-rail__dot');
  var nodeY = [], railH = 0, current = -1, ticking = false;

  function setActive(i) {
    if (i === current) return;
    current = i;
    steps.forEach(function (s, k) {
      s.classList.toggle('is-active', k === i);
      s.classList.toggle('is-done', k < i);
      s.classList.toggle('is-todo', k > i);
      dots[k].setAttribute('class', 'rdot' + (k === i ? ' is-active' : k < i ? ' is-done' : ''));
    });
    num.textContent = pad(i + 1);
    name.textContent = steps[i].dataset.name;
  }

  // Where each card's dot sits, so the rail runs exactly from the first dot to the last
  function measure() {
    var t = timeline.getBoundingClientRect().top;
    nodeY = steps.map(function (s) {
      var r = s.querySelector('.step__node').getBoundingClientRect();
      return r.top - t + r.height / 2;
    });
    railH = nodeY[N - 1] - nodeY[0];
    rail.style.top = nodeY[0] + 'px';
    rail.style.height = railH + 'px';
    update();
  }

  // The dot is tied to a reading line (a bit above the middle of the screen, where eyes rest).
  // A card's dot reaches that line exactly when the card is at eye level, so the highlight lands
  // where the user is already reading. The range is capped at the bottom of the page so the last
  // step is still reachable when the page stops scrolling.
  var READ = 0.42;
  function update() {
    ticking = false;
    if (!railH) return;
    var vh = window.innerHeight, y = window.scrollY, top = timeline.getBoundingClientRect().top + y;
    var max = document.documentElement.scrollHeight - vh, line = vh * READ;
    var start = top + nodeY[0] - line, end = Math.min(top + nodeY[N - 1] - line, max);
    var q = end > start ? Math.max(0, Math.min(1, (y - start) / (end - start))) : 0;
    var py = q * railH;
    thumb.style.transform = 'translateY(' + py.toFixed(1) + 'px)';
    fill.style.transform = 'scaleY(' + q.toFixed(4) + ')';
    arc.setAttribute('stroke-dasharray', (LEN * q * (N - 1) / N).toFixed(1) + ' ' + LEN);
    // a card becomes active when the travelling dot reaches its own dot (10px early so it never feels late)
    var best = 0, k;
    for (k = 0; k < N; k++) if (nodeY[k] - nodeY[0] <= py + 10) best = k;
    setActive(best);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  window.addEventListener('scroll', onScroll, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(timeline);
  else window.addEventListener('resize', measure);
  measure();
})();
