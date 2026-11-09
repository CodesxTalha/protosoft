/* ---------- Scroll rail: desktop only, appears when the cursor moves toward the right edge ---------- */
(function () {
  var rail = document.querySelector('.rail');
  if (!rail) return;
  var track = rail.querySelector('.rail__track');
  var thumb = rail.querySelector('.rail__thumb');
  var label = rail.querySelector('.rail__label');
  var root = document.documentElement;
  var desktop = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');

  var REVEAL = 360;                    // px from the right edge where the rail appears
  var THUMB = 30;                      // handle height
  var sections = [];
  var travel = 0, maxScroll = 0;
  var hideTimer = null, dragging = false, ticking = false;

  function sectionTop(i) { return i === 0 ? 0 : sections[i].offsetTop; }
  function currentSection() {
    var idx = 0, line = window.scrollY + window.innerHeight * 0.4;
    sections.forEach(function (sec, i) { if (sectionTop(i) <= line) idx = i; });
    if (window.scrollY >= maxScroll - 2) idx = sections.length - 1;
    return idx;
  }

  function measure() {
    sections = Array.prototype.slice.call(document.querySelectorAll('[data-rail-label]'));
    maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
    travel = Math.max(0, track.clientHeight - THUMB);
    update();
  }

  function update() {
    ticking = false;
    var y = (maxScroll ? window.scrollY / maxScroll : 0) * travel;
    thumb.style.transform = 'translateY(' + y + 'px)';
  }

  // Section at a scroll position
  function sectionAtScroll(top) {
    var idx = 0, line = top + window.innerHeight * 0.4;
    sections.forEach(function (sec, i) { if (sectionTop(i) <= line) idx = i; });
    if (top >= maxScroll - 2) idx = sections.length - 1;
    return idx;
  }

  // Cursor y on the rail → the scroll position it stands for
  function scrollForY(clientY) {
    var y = clientY - track.getBoundingClientRect().top - THUMB / 2;
    return Math.max(0, Math.min(1, travel ? y / travel : 0)) * maxScroll;
  }

  function placeLabel(clientY) {
    var h = track.clientHeight;
    var y = Math.max(0, Math.min(h, clientY - track.getBoundingClientRect().top));
    var sec = sections[dragging ? currentSection() : sectionAtScroll(scrollForY(clientY))];
    if (sec && label.textContent !== sec.dataset.railLabel) label.textContent = sec.dataset.railLabel;
    label.style.top = y + 'px';
  }

  function show() {
    clearTimeout(hideTimer);
    if (maxScroll > 0) rail.classList.add('is-visible');
  }
  // Hide as soon as the cursor leaves the zone (the CSS opacity transition does the fade)
  function hideSoon() {
    clearTimeout(hideTimer);
    if (!dragging && !rail.matches(':hover')) rail.classList.remove('is-visible');
  }

  function onMove(e) {
    if (e.clientX >= window.innerWidth - REVEAL || rail.matches(':hover')) show();
    else hideSoon();
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  rail.addEventListener('mousemove', function (e) { placeLabel(e.clientY); });

  // Drag the handle
  var startY = 0, startScroll = 0;
  thumb.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    startY = e.clientY;
    startScroll = window.scrollY;
    rail.classList.add('is-dragging');
    thumb.setPointerCapture(e.pointerId);
  });
  thumb.addEventListener('pointermove', function (e) {
    if (!dragging || !travel) return;
    var top = startScroll + (e.clientY - startY) * (maxScroll / travel);
    if (window.lenis) window.lenis.scrollTo(top, { immediate: true });
    else window.scrollTo({ top: top, behavior: 'instant' });
    placeLabel(e.clientY);
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    rail.classList.remove('is-dragging');
    if (thumb.hasPointerCapture(e.pointerId)) thumb.releasePointerCapture(e.pointerId);
    hideSoon();
  }
  thumb.addEventListener('pointerup', endDrag);
  thumb.addEventListener('pointercancel', endDrag);

  // Click the track to jump there
  track.addEventListener('click', function (e) {
    if (e.target === thumb || !travel) return;
    if (window.lenis) window.lenis.scrollTo(scrollForY(e.clientY));
    else window.scrollTo({ top: scrollForY(e.clientY), behavior: 'smooth' });
  });

  function enable() {
    root.classList.add('has-rail');
    measure();
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', hideSoon);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }
  function disable() {
    root.classList.remove('has-rail');
    rail.classList.remove('is-visible');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseleave', hideSoon);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', measure);
  }

  function sync() { desktop.matches ? enable() : disable(); }
  if (desktop.addEventListener) desktop.addEventListener('change', sync);
  sync();
})();
