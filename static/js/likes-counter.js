/* ---------- Marketing card: likes count up fast, then the heart chip shows the same total ---------- */
(function () {
  var likes = document.querySelector('.s-likes');
  var heart = document.querySelector('.s-heart');
  if (!likes || !heart) return;

  var TOTAL = 1284;             // keep in sync with the heart chip (.s-num)
  var CYCLE = 6000;             // same length as the social animations (6s)
  var START = 0.12, END = 0.28; // count runs from the heart pop until the chip slides in
  var RESET = 0.94;

  function label(n) { return n.toLocaleString('en-US') + ' likes'; }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof heart.getAnimations !== 'function') { likes.textContent = label(TOTAL); return; }

  var last = -1;
  function tick() {
    var anim = heart.getAnimations()[0];
    if (anim) {
      var t = ((anim.currentTime || 0) % CYCLE) / CYCLE;
      var n;
      if (t < START || t >= RESET) n = 0;
      else if (t < END) {
        var p = (t - START) / (END - START);
        n = Math.round(TOTAL * (1 - Math.pow(1 - p, 3)));   // fast, easing out as it lands
      } else n = TOTAL;
      if (n !== last) { likes.textContent = label(n); last = n; }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
