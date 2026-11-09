/* ---------- Shared: one plus icon from the #plus symbol ---------- */
var SVG_NS = 'http://www.w3.org/2000/svg';
function makePlus() {
  var svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'plus');
  svg.setAttribute('aria-hidden', 'true');
  var use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', '#plus');
  svg.appendChild(use);
  return svg;
}

/* ---------- Shared: build a grid of plus cells ---------- */
function buildPlusGrid(grid, cols, rows, decorate) {
  grid.style.setProperty('--cols', cols);
  var frag = document.createDocumentFragment();
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var cell = document.createElement('div');
      cell.className = 'plus-grid__cell';
      var plus = makePlus();
      decorate(plus, r, c);
      cell.appendChild(plus);
      frag.appendChild(cell);
    }
  }
  grid.replaceChildren(frag);
}

// Same seed → same pattern on every load
function jitter(r, c) {
  var x = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/* ---------- Hero: gray tone travels as a diagonal wave (motion lives in CSS) ---------- */
(function () {
  var grid = document.querySelector('.plus-grid--hero');
  if (!grid) return;
  var cols = parseInt(grid.dataset.cols, 10) || 20;
  var rows = parseInt(grid.dataset.rows, 10) || 7;
  var speed = parseFloat(grid.dataset.speed) || 1;
  document.documentElement.style.setProperty('--speed', Math.max(0.2, speed));

  buildPlusGrid(grid, cols, rows, function (plus, r, c) {
    var j = jitter(r, c);
    plus.style.setProperty('--t', (-(c * 0.2 + r * 0.32 + j * 1.2)).toFixed(2) + 's');
    plus.style.setProperty('--f', (-(j * 13)).toFixed(2) + 's');
  });
})();
