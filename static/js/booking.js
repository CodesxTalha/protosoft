/* ---------- Booking: four steps (details, services, budget, confirm), then send ----------
   Progress is a ring per step: it fills as the step is filled in. A step you have passed gets a check only if it was
   filled in completely; otherwise its ring stays as full as it really is. Steps you have reached can be clicked to go back.
   Name and email are required; phone and profession are optional. Budget ranges are shown in PKR for a
   confirmed Pakistani IP and in USD for everyone else (see geo.js). No prices are shown on this page.

   Sending: a static site has no server, so a booking is POSTed as JSON to the URL in `data-endpoint` on
   <form id="booking"> in book.html (a form service such as Formspree or Web3Forms). For Web3Forms also set
   `data-access-key`. If no endpoint is set, nothing is sent and the visitor is told so: it never pretends. */
(function () {
  var form = document.getElementById('booking');
  if (!form) return;

  var STEPS = ['details', 'services', 'budget', 'time', 'confirm'], LAST = 4;
  var BUDGETS = {                                           // edit the ranges here
    PKR: ['Under PKR 50,000', 'PKR 50,000 – 150,000', 'PKR 150,000 – 300,000', 'PKR 300,000 and above'],
    USD: ['Under $500', '$500 – $1,000', '$1,000 – $2,500', '$2,500 and above']
  };
  var SYMBOL = { PKR: 'PKR ', USD: '$' };
  var CHECK = '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function phoneValid(p) { var d = p.replace(/\D/g, ''); return !p || (/^[+()\d\s.\-]+$/.test(p) && d.length >= 7 && d.length <= 15); }

  var $ = function (s) { return form.querySelector(s); }, $$ = function (s) { return [].slice.call(form.querySelectorAll(s)); };
  var panels = $$('[data-panel]'), rail = [].slice.call(document.querySelectorAll('.rail__step'));
  var state = { step: 0, furthest: 0, finished: false, cur: 'USD' };

  function val(name) { return (form.elements[name].value || '').trim(); }
  function services() { return $$('input[name="service"]:checked').map(function (i) { return i.value; }); }
  function customChosen() { var b = $('input[name="budget"]:checked'); return !!b && b.value === 'custom'; }
  function customAmount() { return val('customBudget').replace(/[\s,]/g, ''); }
  function customValid() { var a = customAmount(); return /^\d{1,12}$/.test(a) && +a > 0; }
  function budgetLabel() {
    var b = $('input[name="budget"]:checked');
    if (!b) return '';
    return b.value === 'custom' ? SYMBOL[state.cur] + (+customAmount()).toLocaleString('en-US') : BUDGETS[state.cur][b.value];
  }
  function syncCustom() { $('#custom-budget').hidden = !customChosen(); $('#money-cur').textContent = SYMBOL[state.cur].trim(); }

  /* ----- budget options, in the visitor's currency ----- */
  function renderBudget() {
    var chosen = $('input[name="budget"]:checked'), keep = chosen ? chosen.value : null;
    var labels = BUDGETS[state.cur].concat(['Custom amount']);
    $('#budget-opts').innerHTML = labels.map(function (label, i) {
      var v = i === labels.length - 1 ? 'custom' : i;
      return '<label class="opt"><input type="radio" name="budget" value="' + v + '"' + (String(keep) === String(v) ? ' checked' : '') +
        '><span class="opt__box" aria-hidden="true">' + CHECK + '</span><span class="opt__text">' + label + '</span></label>';
    }).join('');
    syncCustom();
  }
  renderBudget();
  if (window.ProtosoftGeo) ProtosoftGeo.currency().then(function (c) { state.cur = c; renderBudget(); });

  /* ----- errors ----- */
  function setError(input, id, msg) {
    var err = document.getElementById(id);
    if (!err) return;
    err.textContent = msg || ''; err.hidden = !msg;
    if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  }

  function validateDetails() {
    var name = form.elements.name, email = form.elements.email, phone = form.elements.phone, bad = null;
    var n = name.value.trim(), e = email.value.trim(), p = phone.value.trim();
    setError(name, 'e-name', n ? '' : 'Please enter your name.');
    if (!n) bad = bad || name;
    var emailOk = EMAIL_RE.test(e);
    setError(email, 'e-email', emailOk ? '' : (e ? 'Please enter a valid email address.' : 'Please enter your email.'));
    if (!emailOk) bad = bad || email;
    var phoneOk = phoneValid(p);
    setError(phone, 'e-phone', phoneOk ? '' : 'Please check this number, or leave it empty.');
    if (!phoneOk) bad = bad || phone;
    var agree = form.elements.agree;
    setError(agree, 'e-agree', agree.checked ? '' : 'Please read and agree to continue.');
    if (!agree.checked) bad = bad || agree;
    return bad;
  }

  function validateServices() {
    var any = services().length > 0;
    setError(null, 'e-services', any ? '' : 'Please pick at least one service.');
    return any ? null : $('input[name="service"]');
  }

  function validateBudget() {
    var budget = $('input[name="budget"]:checked'), custom = form.elements.customBudget, bad = null;
    setError(null, 'e-budget', budget ? '' : 'Please choose a budget range, or enter your own.');
    if (!budget) bad = $('input[name="budget"]');
    else if (budget.value === 'custom') {
      var ok = customValid();
      setError(custom, 'e-custom', ok ? '' : (customAmount() ? 'Please enter the amount as a number.' : 'Please enter your budget.'));
      if (!ok) bad = custom;
    }
    return bad;
  }
  function validateTime() {
    var ok = !!(window.ProtosoftCalendar && ProtosoftCalendar.value());
    setError(null, 'e-time', ok ? '' : 'Please pick a day and a time for the call.');
    return ok ? null : form.querySelector('.cal__day:not([disabled]), #cal-next');
  }
  var VALIDATE = [validateDetails, validateServices, validateBudget, validateTime];
  if (window.ProtosoftCalendar) ProtosoftCalendar.onChange(function () { setError(null, 'e-time', ''); paintRail(); });

  // errors clear as soon as the visitor fixes the field
  form.addEventListener('input', function (e) {
    var t = e.target, id = t.getAttribute && t.getAttribute('aria-describedby');
    if (id && t.hasAttribute('aria-invalid')) setError(t, id, '');
    paintRail();
  });
  form.addEventListener('focusout', function (e) {            // tidy the custom amount: 200000 becomes 200,000
    if (e.target.name === 'customBudget' && customValid()) e.target.value = (+customAmount()).toLocaleString('en-US');
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'service') setError(null, 'e-services', '');
    if (e.target.name === 'budget') { setError(null, 'e-budget', ''); syncCustom(); if (customChosen() && !customAmount()) form.elements.customBudget.focus(); }
    paintRail();
  });

  /* ----- progress rings ----- */
  // How far along a step is (0 to 1), from what has been filled in so far
  function progress(k) {
    if (k === 0) {
      var filled = [!!val('name'), EMAIL_RE.test(val('email')), !!val('phone') && phoneValid(val('phone')), !!val('profession')];
      return filled.filter(Boolean).length / filled.length;
    }
    if (k === 1) return services().length ? 1 : 0;
    if (k === 2) return !$('input[name="budget"]:checked') ? 0 : customChosen() ? (customValid() ? 1 : 0.5) : 1;
    if (k === 3) return window.ProtosoftCalendar ? ProtosoftCalendar.progress() : 0;
    return state.finished ? 1 : 0.5 + (val('note') ? 0.5 : 0);   // confirm: reading the summary is half, adding a note the rest
  }

  // A passed step shows a check only when it was filled in completely, otherwise its ring stays as full as it really is.
  // The current one fills as you go, the rest wait gray and dotted. Steps you have reached are buttons.
  function paintRail() {
    rail.forEach(function (li, k) {
      var cur = !state.finished && k === state.step, passed = !cur && (state.finished || k < state.furthest), p = progress(k);
      var cls = cur ? 'is-current' : passed ? (p >= 1 ? 'is-done' : 'is-partial') : (k === state.furthest ? 'is-next' : 'is-later');
      var btn = li.querySelector('.rail__btn');
      li.className = 'rail__step ' + cls;
      li.querySelector('.ring').style.setProperty('--p', cur || passed ? p : 0);
      btn.disabled = state.finished || k > state.furthest;
      if (cur) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
    });
  }

  /* ----- showing a panel ----- */
  function showPanel(key) {
    var shown = null;
    panels.forEach(function (p) { var on = p.dataset.panel === String(key); p.hidden = !on; if (on) shown = p; });
    paintRail();
    window.scrollTo(0, 0);
    var h = shown && shown.querySelector('.book__h');
    if (h) h.focus({ preventScroll: true });
  }

  function show(i) { state.step = i; if (i === LAST) renderSummary(); showPanel(i); }
  function go(i) { history.pushState({ step: i }, '', '#' + STEPS[i]); show(i); }

  function next() {
    var bad = VALIDATE[state.step]();
    if (bad) { bad.focus(); return; }
    state.furthest = Math.max(state.furthest, state.step + 1);
    go(state.step + 1);
  }

  // browser Back / forward move between steps; you cannot jump past a step you have not completed
  window.addEventListener('popstate', function () {
    if (state.finished) { history.replaceState(null, '', '#done'); return; }
    var i = STEPS.indexOf((location.hash || '').slice(1));
    show(i < 0 || i > state.furthest ? 0 : i);
  });
  $$('[data-back]').forEach(function (b) { b.addEventListener('click', function () { if (state.step > 0) go(state.step - 1); }); });
  // the rings: click a step you have reached to go back to it, everything you entered is kept
  [].slice.call(document.querySelectorAll('.rail__btn')).forEach(function (b) {
    b.addEventListener('click', function () { var k = +b.dataset.goto; if (!state.finished && k !== state.step && k <= state.furthest) go(k); });
  });

  /* ----- confirm step ----- */
  function renderSummary() {
    var rows = [['Name', val('name')], ['Email', val('email')]];
    if (val('phone')) rows.push(['Phone', val('phone')]);
    if (val('profession')) rows.push(['Profession', val('profession')]);
    rows.push(['Services', services().join(', ')], ['Budget', budgetLabel()]);
    var call = window.ProtosoftCalendar && ProtosoftCalendar.value();
    if (call) rows.push(['Call', call.label]);
    var dl = $('#summary'); dl.textContent = '';
    rows.forEach(function (r) {
      var row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = r[0]; dd.textContent = r[1]; row.appendChild(dt); row.appendChild(dd); dl.appendChild(row);
    });
  }

  function payload() {
    var data = {
      name: val('name'), email: val('email'), phone: val('phone'), profession: val('profession'),
      services: services(), budget: budgetLabel(), currency: state.cur, note: val('note'),
      call: window.ProtosoftCalendar ? ProtosoftCalendar.value() : null,
      source: 'book page', sentAt: new Date().toISOString()
    };
    if (form.dataset.accessKey) { data.access_key = form.dataset.accessKey; data.subject = 'New booking from ' + data.name; }
    return data;
  }

  /* ----- the finish: the five rings fly in from the left and land as one tile with a check ----- */
  function flyRings(done) {
    var mark = $('.mark'), t = mark.getBoundingClientRect(), tx = t.left + t.width / 2, ty = t.top + t.height / 2, flights = [];
    rail.forEach(function (li, i) {
      var ring = li.querySelector('.ring'), r = ring.getBoundingClientRect();
      if (!r.width) return;
      var fly = document.createElement('div');
      fly.className = li.className.replace('rail__step', '').trim() + ' fly';
      fly.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
      fly.appendChild(ring.cloneNode(true));
      document.body.appendChild(fly);
      var dx = tx - (r.left + r.width / 2), dy = ty - (r.top + r.height / 2), fan = (i - (rail.length - 1) / 2) * 16;
      flights.push(fly.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: 'translate(' + dx * 0.5 + 'px, ' + (dy * 0.5 + fan) + 'px) scale(1.08)', opacity: 1, offset: 0.5 },
        { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(.4)', opacity: 0 }
      ], { duration: 780, delay: i * 90, easing: 'cubic-bezier(.6, 0, .25, 1)', fill: 'both' }).finished.then(function () { /* stays until all have landed */ }));
      fly.dataset.fly = '1';
    });
    document.body.classList.add('is-booked');                         // the real rail hides; the copies are what you see leave
    var cleanup = function () { [].slice.call(document.querySelectorAll('.fly')).forEach(function (f) { f.remove(); }); done(); };
    if (!flights.length) { cleanup(); return; }
    Promise.all(flights).then(cleanup, cleanup);
  }

  function finish() {
    state.finished = true;
    var first = val('name').split(/\s+/)[0], call = window.ProtosoftCalendar && ProtosoftCalendar.value(), when = call && new Date(call.start);
    $('#h-done').textContent = 'You’re booked, ' + first + '.';
    $('#done-text').textContent = 'We’ve sent a confirmation to ' + val('email') + '.';
    $('.done__card').hidden = !when;
    if (when) {
      var zone = '';
      try { zone = new Intl.DateTimeFormat('en-US', { timeZone: call.timezone, timeZoneName: 'short' }).formatToParts(when).filter(function (p) { return p.type === 'timeZoneName'; })[0].value; } catch (e) {}
      $('#done-zone').textContent = zone; $('#done-zone').hidden = !zone;
      $('#done-time').textContent = when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      var sameYear = when.getFullYear() === new Date().getFullYear();
      $('#done-day').textContent = when.toLocaleDateString(undefined, sameYear ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    $('#done-meta').textContent = [services().join(', '), budgetLabel()].filter(Boolean).join('  ·  ');
    history.replaceState(null, '', location.pathname + '#done');
    showPanel('done');
    var landed = function () { document.body.classList.add('is-booked', 'is-landed'); };
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { landed(); return; }
    requestAnimationFrame(function () { flyRings(landed); });
  }

  function submit() {
    var btn = $('#submit'), err = $('#e-submit'), endpoint = form.dataset.endpoint;
    err.hidden = true;
    if (form.elements.website.value) { finish(); return; }   // the hidden field is filled only by bots: act as if it worked, send nothing
    if (!endpoint) {
      err.textContent = 'Booking is not connected yet, so nothing was sent. Please try again later.'; err.hidden = false;
      console.error('booking: set data-endpoint on <form id="booking"> in book.html');
      return;
    }
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…';
    // sent as text/plain (the body is still JSON): that avoids a browser preflight request, which Google Apps Script cannot answer
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload()) })
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then(function (j) {
        if (j && j.ok) { finish(); return; }
        if (j && j.error === 'slot_taken') {                   // someone else took the time, or it just closed: back to the calendar
          btn.disabled = false; btn.textContent = label;
          go(3);
          (window.ProtosoftCalendar ? ProtosoftCalendar.reload() : Promise.resolve()).then(function () {   // fresh times first, then the message
            setError(null, 'e-time', 'That time was just taken. Please pick another one.');
          });
          return;
        }
        throw new Error((j && j.error) || 'failed');
      })
      .catch(function () {
        err.textContent = 'Something went wrong, so nothing was sent. Please try again.'; err.hidden = false;
        btn.disabled = false; btn.textContent = label;
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.finished) return;
    if (state.step < LAST) next(); else submit();
  });

  // arriving from the pricing card: tick the services chosen there (?services=Website,Web design)
  try {
    (new URLSearchParams(location.search).get('services') || '').split(',').forEach(function (v) {
      var box = $$('input[name="service"]').filter(function (i) { return i.value === v.trim(); })[0];
      if (box) box.checked = true;
    });
  } catch (e) {}

  history.replaceState({ step: 0 }, '', location.pathname + '#details');
  show(0);
})();
