/* ---------- Call calendar: a month on the left, the times for the chosen day on the right ----------
   Front end only. Where the free times come from is up to you:

   1. Your own backend: put a URL in `data-availability` on <form id="booking"> in book.html. It is fetched with GET and
      must answer JSON like { "slots": ["2026-11-12T06:00:00Z", "2026-11-12T06:30:00Z", ...] }: the start of every free slot,
      as ISO times in UTC. Only these slots are offered, so booked times simply stay out of the list.
   2. No URL: slots come from the working hours in RULES below. Nothing stops two people choosing the same time then.

   The time can be picked from a list, or on a sliding ruler (the "List / Slide" switch): drag, scroll or tap the ruler
   and it snaps to the free times, or jump to Morning / Afternoon / Evening. Slots are shown in the visitor's own time
   zone. The picked slot is read with ProtosoftCalendar.value(), which gives
   { start: ISO time in UTC, timezone: the visitor's zone, label: a readable text } or null. */
(function () {
  var RULES = {                      // edit your working hours here (used when there is no data-availability URL)
    zoneOffsetHours: 5,              // the hours below are in this fixed UTC offset: 5 is Pakistan time (no daylight saving)
    // working hours per day, 0 = Sunday ... 6 = Saturday, in the same zone: [first slot starts, last slot ends] (24-hour clock)
    // a day that is missing is closed (Saturday here)
    hours: { 0: [17, 22], 1: [11, 22], 2: [11, 22], 3: [11, 22], 4: [11, 22], 5: [11, 22] },
    minutes: 30,                     // length of one slot
    noticeHours: 12,                 // the soonest bookable time, from now
    horizonDays: 45                  // how far ahead people can book
  };

  var form = document.getElementById('booking'), root = document.getElementById('cal');
  if (!form || !root) return;

  var $ = function (id) { return document.getElementById(id); };
  var el = { month: $('cal-month'), prev: $('cal-prev'), next: $('cal-next'), grid: $('cal-grid'), hint: $('cal-hint'), head: $('cal-head'),
             when: $('cal-when'), slots: $('cal-slots'), ruler: $('cal-ruler'), status: $('cal-status'), tz: $('cal-tz') };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var zone = 'UTC';
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) {}
  var fmtTime = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  var fmtHour = new Intl.DateTimeFormat(undefined, { hour: 'numeric' });
  var fmtMonth = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
  var fmtLong = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  var fmtShort = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  var zoneName = '';
  try { zoneName = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(new Date()).filter(function (p) { return p.type === 'timeZoneName'; })[0].value; } catch (e) {}
  el.tz.textContent = 'Times are shown in ' + zone.replace(/_/g, ' ') + (zoneName ? ' (' + zoneName + ')' : '') + '.';

  var state = { slots: [], byDay: {}, view: null, day: null, slot: null, ready: false, failed: false, mode: 'list' };
  var listeners = [];
  var ruler = null;                  // the sliding ruler currently on screen: { day, sc, free: [{t, node}], ... }

  function key(d) { return d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate(); }
  function monthIndex(d) { return d.getFullYear() * 12 + d.getMonth(); }

  /* ----- where the slots come from ----- */
  function ruleSlots() {
    var out = [], now = Date.now(), earliest = now + RULES.noticeHours * 3600e3, off = RULES.zoneOffsetHours * 3600e3;
    var t = new Date(now + off);                                      // "today" in the working-hours zone
    for (var i = 0; i <= RULES.horizonDays; i++) {
      var day = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + i));
      var open = RULES.hours[day.getUTCDay()];
      if (!open) continue;
      for (var m = open[0] * 60; m + RULES.minutes <= open[1] * 60; m += RULES.minutes) {
        var start = day.getTime() + m * 60e3 - off;
        if (start >= earliest) out.push(start);
      }
    }
    return out;
  }

  function load() {
    var url = form.dataset.availability;
    state.ready = false; state.failed = false; paintStatus();
    if (!url) { setSlots(ruleSlots()); return; }
    fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then(function (j) {
        var now = Date.now();
        setSlots((j.slots || []).map(function (s) { return new Date(s).getTime(); }).filter(function (t) { return t > now; }));
      })
      .catch(function () { state.failed = true; state.ready = true; setSlots([]); });
  }

  function setSlots(list) {
    list.sort(function (a, b) { return a - b; });
    state.slots = list; state.byDay = {};
    list.forEach(function (t) { var k = key(new Date(t)); (state.byDay[k] = state.byDay[k] || []).push(t); });
    state.ready = true;
    if (state.slot && list.indexOf(state.slot) < 0) { state.slot = null; state.day = null; changed(); }   // the picked time is gone
    if (!state.view) {                                                // open on the month of the first free day
      var first = list.length ? new Date(list[0]) : new Date();
      state.view = new Date(first.getFullYear(), first.getMonth(), 1);
    }
    ruler = null;
    paint();
  }

  /* ----- drawing ----- */
  function paintStatus() {
    var msg = !state.ready ? 'Loading available times…' :
      state.failed ? 'We couldn’t load the available times. Please try again in a moment.' :
      !state.slots.length ? 'There are no free times right now. Please check back soon.' : '';
    el.status.textContent = msg; el.status.hidden = !msg;
  }

  function paint() {
    paintStatus();
    var v = state.view, first = new Date(v.getFullYear(), v.getMonth(), 1), today = key(new Date());
    el.month.textContent = fmtMonth.format(first);
    var lead = (first.getDay() + 6) % 7, days = new Date(v.getFullYear(), v.getMonth() + 1, 0).getDate(), html = '';
    for (var i = 0; i < lead; i++) html += '<span class="cal__pad"></span>';
    for (var d = 1; d <= days; d++) {
      var date = new Date(v.getFullYear(), v.getMonth(), d), k = key(date), free = !!state.byDay[k];
      html += '<button type="button" class="cal__day' + (k === today ? ' is-today' : '') + (k === state.day ? ' is-selected' : '') + '" data-day="' + k + '"' +
        (free ? '' : ' disabled') + ' aria-label="' + fmtLong.format(date) + (free ? '' : ', no times') + '"' + (k === state.day ? ' aria-pressed="true"' : '') + '>' + d + '</button>';
    }
    el.grid.innerHTML = html;

    var nowM = monthIndex(new Date()), lastM = state.slots.length ? monthIndex(new Date(state.slots[state.slots.length - 1])) : nowM;
    el.prev.disabled = monthIndex(v) <= nowM;
    el.next.disabled = monthIndex(v) >= lastM;
    paintTimes();
  }

  function paintTimes() {
    var list = state.day ? state.byDay[state.day] : null;
    el.hint.hidden = !!list; el.head.hidden = !list;
    el.slots.hidden = !list || state.mode !== 'list'; el.ruler.hidden = !list || state.mode !== 'slide';
    if (!list) { ruler = null; return; }
    var p = state.day.split('-');
    el.when.textContent = fmtShort.format(new Date(+p[0], +p[1] - 1, +p[2]));
    [].forEach.call(el.head.querySelectorAll('.cal__modebtn'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)); });
    if (state.mode === 'list') {
      ruler = null;
      el.slots.innerHTML = list.map(function (t) {
        return '<button type="button" class="cal__slot' + (t === state.slot ? ' is-selected' : '') + '" data-t="' + t + '"' + (t === state.slot ? ' aria-pressed="true"' : '') + '>' + fmtTime.format(new Date(t)) + '</button>';
      }).join('');
    } else if (!ruler || ruler.day !== state.day) buildRuler(list);
    else syncRuler();
  }

  /* ----- the sliding ruler: a tick for every slot under a fixed needle; whatever is under the needle is the time ----- */
  var PARTS = [['Morning', 0, 12], ['Afternoon', 12, 17], ['Evening', 17, 24]];

  function buildRuler(list) {
    var step = 0, free = {}, i;
    function gcd(a, b) { return b ? gcd(b, a % b) : a; }
    for (i = 1; i < list.length; i++) step = gcd(step, list[i] - list[i - 1]);   // the slot length: every free time sits on this grid
    if (!step) step = 30 * 60e3;
    list.forEach(function (t) { free[t] = true; });

    var ticks = '';
    for (var t = list[0]; t <= list[list.length - 1]; t += step) {
      var d = new Date(t), hour = d.getMinutes() === 0, on = !!free[t];
      ticks += (on ? '<button type="button" tabindex="-1" data-t="' + t + '" aria-label="' + fmtTime.format(d) + '"' : '<span aria-hidden="true"') +
        ' class="cal__tick' + (hour ? ' cal__tick--hour' : '') + (on ? '' : ' is-off') + '">' + (hour ? '<i>' + fmtHour.format(d) + '</i>' : '') + (on ? '</button>' : '</span>');
    }
    var parts = PARTS.map(function (p, k) {
      var has = list.some(function (t) { var h = new Date(t).getHours(); return h >= p[1] && h < p[2]; });
      return '<button type="button" class="cal__part" data-part="' + k + '"' + (has ? '' : ' disabled') + '>' + p[0] + '</button>';
    }).join('');

    el.ruler.innerHTML =
      '<div class="cal__readout"><span class="cal__big" id="cal-big"></span><span class="cal__small">Drag, scroll or tap to change</span></div>' +
      '<div class="cal__track"><div class="cal__scroll" id="cal-scroll" tabindex="0" role="slider" aria-label="Time of the call" aria-valuemin="0"><div class="cal__ticks">' + ticks + '</div></div>' +
      '<span class="cal__needle" aria-hidden="true"></span></div>' +
      '<div class="cal__parts" role="group" aria-label="Part of the day">' + parts + '</div>';

    var sc = $('cal-scroll');
    ruler = { day: state.day, sc: sc, prog: true, timer: 0, progTimer: 0, near: null, all: [].slice.call(sc.querySelectorAll('.cal__tick')), free: [].map.call(sc.querySelectorAll('button.cal__tick'), function (n) { return { t: +n.dataset.t, node: n }; }) };
    sc.setAttribute('aria-valuemax', String(ruler.free.length - 1));
    bindRuler();
    // start on the picked time, otherwise on the first free one (nothing is chosen until the visitor moves it)
    var start = state.slot ? ruler.free.filter(function (f) { return f.t === state.slot; })[0] : ruler.free[0];
    center(start || ruler.free[0], false);
    magnify();
    syncRuler();
  }

  function center(f, smooth) {
    var sc = ruler.sc;
    ruler.prog = true; clearTimeout(ruler.progTimer); ruler.progTimer = setTimeout(function () { if (ruler) ruler.prog = false; }, smooth && !reduce ? 650 : 250);
    sc.scrollTo({ left: f.node.offsetLeft + f.node.offsetWidth / 2 - sc.clientWidth / 2, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  }

  function nearest() {                                                // the free tick closest to the needle
    var sc = ruler.sc, mid = sc.scrollLeft + sc.clientWidth / 2, best = ruler.free[0], bd = Infinity;
    ruler.free.forEach(function (f) { var d = Math.abs(f.node.offsetLeft + f.node.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = f; } });
    return best;
  }

  // only the tick under the pointer grows: --k is 1 right under it and eases to 0 one tick away
  function magnify() {
    if (!ruler) return;
    var sc = ruler.sc, mid = sc.scrollLeft + sc.clientWidth / 2, reach = 28;
    ruler.all.forEach(function (n) {
      var d = Math.abs(n.offsetLeft + n.offsetWidth / 2 - mid), k = Math.max(0, 1 - d / reach);
      n.style.setProperty('--k', (k * k * (3 - 2 * k)).toFixed(3));   // eased, so the swell feels soft
    });
  }

  function syncRuler() {                                              // readout, highlighted tick and part-of-day buttons follow the selection
    if (!ruler) return;
    var near = ruler.near || (state.slot && ruler.free.filter(function (f) { return f.t === state.slot; })[0]) || null;
    var picked = state.slot ? new Date(state.slot) : null, shown = near ? new Date(near.t) : null;
    var big = $('cal-big'), live = ruler.touched ? shown : picked;
    big.textContent = live ? fmtTime.format(live) : 'Choose a time';
    big.classList.toggle('is-empty', !live);
    ruler.free.forEach(function (f) { f.node.classList.toggle('is-active', !!live && f.t === +live); });
    ruler.sc.setAttribute('aria-valuenow', String(near ? ruler.free.indexOf(near) : 0));
    ruler.sc.setAttribute('aria-valuetext', live ? fmtTime.format(live) : 'No time chosen');
    [].forEach.call(el.ruler.querySelectorAll('.cal__part'), function (b) {
      var p = PARTS[+b.dataset.part], on = !!picked && picked.getHours() >= p[1] && picked.getHours() < p[2];
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function commit(f) {
    ruler.near = f; ruler.touched = true;
    if (state.slot !== f.t) { state.slot = f.t; changed(); }
    syncRuler();
  }

  function stepBy(dir) {                                              // nothing chosen yet: the first press chooses the time under the needle
    var f = nearest(), cur = state.slot ? ruler.free.filter(function (x) { return x.t === state.slot; })[0] : null;
    if (cur) f = ruler.free[Math.max(0, Math.min(ruler.free.length - 1, ruler.free.indexOf(cur) + dir))];
    center(f, true); commit(f);
  }

  function bindRuler() {
    var sc = ruler.sc, r = ruler, drag = null, moved = false;
    function user() { r.prog = false; clearTimeout(r.progTimer); }

    var raf = 0;
    sc.addEventListener('scroll', function () {
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; magnify(); });
      if (r.prog) return;
      var f = nearest(); r.near = f; r.touched = true; syncRuler();
      clearTimeout(r.timer); r.timer = setTimeout(function () { commit(f); }, 140);   // the time is chosen once the sliding settles
    }, { passive: true });

    sc.addEventListener('click', function (e) {
      var b = e.target.closest('button.cal__tick');
      if (!b || moved) return;
      var f = r.free.filter(function (x) { return x.node === b; })[0];
      user(); center(f, true); commit(f);
    });

    // a mouse cannot swipe, so dragging with it scrolls the ruler (touch screens scroll it natively)
    sc.addEventListener('pointerdown', function (e) {
      user(); if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: sc.scrollLeft }; moved = false; sc.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x; if (Math.abs(dx) > 4) moved = true;
      if (moved) sc.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!drag) return; drag = null; sc.classList.remove('is-dragging');
      if (moved) { var f = nearest(); center(f, true); r.prog = false; setTimeout(function () { moved = false; }, 0); }
    });
    sc.addEventListener('wheel', function (e) {                       // a normal mouse wheel slides it too
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { user(); sc.scrollLeft += e.deltaY; e.preventDefault(); }
    }, { passive: false });
    sc.addEventListener('touchstart', user, { passive: true });
    sc.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (dir) { e.preventDefault(); user(); stepBy(dir); }
      else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); user(); var f = r.free[e.key === 'Home' ? 0 : r.free.length - 1]; center(f, true); commit(f); }
    });
    el.ruler.addEventListener('click', function (e) {
      var p = e.target.closest('.cal__part');
      if (p && !p.disabled) {
        var part = PARTS[+p.dataset.part];
        var f = r.free.filter(function (x) { var h = new Date(x.t).getHours(); return h >= part[1] && h < part[2]; })[0];
        if (f) { user(); center(f, true); commit(f); }
      }
    });
  }

  /* ----- events ----- */
  function changed() { listeners.forEach(function (f) { f(); }); }

  el.grid.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.cal__day');
    if (!b || b.disabled) return;
    if (b.dataset.day !== state.day) { state.day = b.dataset.day; state.slot = null; ruler = null; changed(); }
    paint();
    if (window.matchMedia('(max-width: 800px)').matches) el.head.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  el.slots.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.cal__slot');
    if (!b) return;
    state.slot = +b.dataset.t; changed(); paintTimes();
  });
  el.head.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.cal__modebtn');
    if (!b || b.dataset.mode === state.mode) return;
    state.mode = b.dataset.mode; ruler = null; paintTimes();
  });
  el.prev.addEventListener('click', function () { state.view = new Date(state.view.getFullYear(), state.view.getMonth() - 1, 1); paint(); });
  el.next.addEventListener('click', function () { state.view = new Date(state.view.getFullYear(), state.view.getMonth() + 1, 1); paint(); });

  window.ProtosoftCalendar = {
    // 0 = nothing picked, 0.5 = a day, 1 = a day and a time
    progress: function () { return state.slot ? 1 : state.day ? 0.5 : 0; },
    value: function () {
      if (!state.slot) return null;
      var d = new Date(state.slot);
      return { start: d.toISOString(), timezone: zone, label: fmtShort.format(d) + ', ' + fmtTime.format(d) };
    },
    onChange: function (f) { listeners.push(f); },
    reload: load
  };

  load();
})();
