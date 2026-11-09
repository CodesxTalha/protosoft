/* ---------- Pricing: pick a service, set its options, see the price ----------
   Edit prices in PLANS below: price is [PKR, USD]. A plan without a price shows its `custom` text.
   Currency follows the visitor's IP country on every page load: only a confirmed Pakistani IP sees PKR,
   everyone else sees USD, and there is no switch. A static site has no server, so the country comes from
   a free public lookup (Cloudflare's trace, then country.is, then ipwho.is). Nothing is saved between loads,
   and the browser's timezone is deliberately ignored: a VPN changes the IP but not the timezone. */
(function () {
  var sec = document.querySelector('.pricing');
  if (!sec) return;

  var PLANS = {
    package: {
      name: 'Launch Package',
      badge: 'Best for new businesses',
      blurb: 'Your brand and your website, designed and built together so everything matches from day one.',
      price: function () { return [150000, 1000]; },
      note: 'Starting price, one-time',
      list: function () { return [['gem', 'Premium, timeless brand identity'], ['devices', 'Responsive website on every device'], ['layers', 'Editable source files for everything'], ['rocket', 'Done for you, start to finish'], ['users', 'One team, one timeline']]; }
    },
    website: {
      name: 'Website',
      blurb: 'Fast, responsive and built from scratch.',
      price: function (o) { return o.type === 'dynamic' ? [50000, 500] : [20000, 200]; },
      note: 'Starting price, one-time',
      list: function (o) { return [['devices', 'Responsive on every device'], ['zap', 'Fast loading, clean build'], o.type === 'dynamic' ? ['edit', 'Content you can manage yourself'] : ['layers', 'Simple, fixed content pages'], ['code', 'Full source code handed over']]; }
    },
    branding: {
      name: 'Branding',
      blurb: 'A logo and a clear brand identity for your business.',
      price: function () { return [20000, 200]; },
      note: 'Starting price, one-time',
      list: function () { return [['pen', 'A memorable, timeless logo'], ['type', 'Brand colours and typography'], ['layers', 'Editable source files'], ['download', 'Logo files in every format']]; }
    },
    design: {
      name: 'Web design',
      blurb: 'UI and UX design for your website.',
      price: function (o) { return o.dev ? [70000, 700] : [30000, 400]; },
      extra: [40000, 300],                                   // added when "Add development" is on
      note: 'Starting price, one-time',
      list: function (o) { return [['devices', 'Responsive on every device'], ['gem', 'Premium, timeless design'], ['layers', 'Editable design files'], o.dev ? ['code', 'Built and launched, in one project'] : ['rocket', 'Ready for development']]; }
    },
    automation: {
      name: 'Automation',
      blurb: 'AI agents and workflows built around how you work.',
      custom: 'Custom quote',
      note: 'Scoped around your workflow',
      list: function () { return [['bot', 'AI agents and workflows'], ['sliders', 'Built around how you work'], ['clock', 'Less manual work, more time back'], ['rocket', 'Set up, tested and handed over']]; }
    },
    marketing: {
      name: 'Marketing',
      blurb: 'Social media content, campaigns and community.',
      custom: 'Let\u2019s talk',
      note: 'Planned monthly, scoped to your goals',
      list: function () { return [['megaphone', 'Consistent, on-brand content'], ['trend', 'Campaigns that grow your audience'], ['calendar', 'Planned and managed monthly'], ['users', 'Community management']]; }
    }
  };

  var nf = new Intl.NumberFormat('en-US');
  var $ = function (s) { return sec.querySelector(s); }, $$ = function (s) { return [].slice.call(sec.querySelectorAll(s)); };
  var card = $('.builder__card'), nameEl = $('.plan__name'), blurbEl = $('.plan__blurb'), eyebrow = $('.plan__eyebrow');
  var amountEl = $('.plan__amount'), noteEl = $('.plan__note'), listEl = $('.plan__list');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Clean line icons (24x24, stroke). A plan's `list` returns [icon, text] pairs.
  var ICONS = {
    devices: '<path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8"/><path d="M10 19v-4"/><path d="M7 19h5"/><rect width="6" height="10" x="16" y="12" rx="2"/>',
    gem: '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    pen: '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    type: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    sliders: '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M2 14h4"/><path d="M10 8h4"/><path d="M18 16h4"/>'
  };
  function ico(name) { return '<span class="plan__ico"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg></span>'; }

  var state = { service: 'package', type: 'static', dev: false, cur: 'PKR' };
  var shown = null, raf = 0;                                 // number currently shown in the big price

  // Country lookup: try each source with a short timeout, first answer wins
  var SOURCES = [
    { url: 'https://www.cloudflare.com/cdn-cgi/trace', parse: function (t) { return (t.match(/^loc=([A-Z]{2})/m) || [])[1]; } },
    { url: 'https://api.country.is', parse: function (t) { return JSON.parse(t).country; } },
    { url: 'https://ipwho.is/?fields=country_code', parse: function (t) { return JSON.parse(t).country_code; } }
  ];
  function fetchText(url) {
    var ctl = window.AbortController ? new AbortController() : null, timer = setTimeout(function () { if (ctl) ctl.abort(); }, 1000);
    return fetch(url, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('bad status'); return r.text(); })
      .then(function (t) { clearTimeout(timer); return t; }, function (e) { clearTimeout(timer); throw e; });
  }
  function lookup(i) {
    if (i >= SOURCES.length) return Promise.resolve(null);
    return fetchText(SOURCES[i].url).then(SOURCES[i].parse).then(function (c) { return /^[A-Z]{2}$/.test(c || '') ? c : lookup(i + 1); }, function () { return lookup(i + 1); });
  }

  function money(pair, cur) { return cur === 'USD' ? '$' + nf.format(pair[1]) : 'PKR ' + nf.format(pair[0]); }
  function idx() { return state.cur === 'USD' ? 1 : 0; }

  // Count the big price from the old value to the new one
  function setAmount(target) {
    cancelAnimationFrame(raf);
    var prefix = state.cur === 'USD' ? '$' : 'PKR ';
    if (reduced || shown == null) { amountEl.textContent = prefix + nf.format(target); shown = target; return; }
    var from = shown, t0 = performance.now(), D = 420;
    (function step(now) {
      var k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      amountEl.textContent = prefix + nf.format(Math.round(from + (target - from) * e));
      if (k < 1) raf = requestAnimationFrame(step); else shown = target;
    })(t0);
    shown = target;
  }

  function render() {
    var plan = PLANS[state.service], price = plan.price ? plan.price(state) : null;

    nameEl.textContent = plan.name;
    blurbEl.textContent = plan.blurb;
    noteEl.textContent = plan.note;
    eyebrow.textContent = plan.badge || (plan.price ? 'Starting price' : 'Pricing');
    eyebrow.classList.toggle('plan__eyebrow--badge', !!plan.badge);
    listEl.innerHTML = plan.list(state).map(function (t) { return '<li>' + ico(t[0]) + t[1] + '</li>'; }).join('');

    // options belong to one service each
    $$('.opt').forEach(function (o) { o.hidden = o.dataset.opt !== state.service; });
    var extra = $('[data-extra]');
    if (plan.extra) extra.textContent = '+' + money(plan.extra, state.cur);

    if (price) { setAmount(price[idx()]); }
    else { cancelAnimationFrame(raf); amountEl.textContent = plan.custom; shown = null; }
    document.documentElement.dataset.currency = state.cur;

    // hints on the service rows
    $$('[data-hint]').forEach(function (h) {
      var p = PLANS[h.dataset.hint], base = p.price ? p.price({ type: 'static', dev: false }) : null;
      h.textContent = base ? (h.dataset.hint === 'website' || h.dataset.hint === 'design' ? 'from ' : '') + money(base, state.cur) : p.custom;
    });
  }

  // events
  // On phones the services are a scrolling row of chips. After a tap, slide the row so the chosen chip
  // AND the next one are fully in view; the first chip slides back to the start, the last one stops at the end.
  function revealChip(label) {
    var row = $('.builder__services');
    if (row.scrollWidth <= row.clientWidth + 1) return;                       // desktop: a plain list, nothing to scroll
    var chips = $$('.svc'), i = chips.indexOf(label), next = chips[i + 1] || label;
    var rowLeft = row.getBoundingClientRect().left, pad = parseFloat(getComputedStyle(row).paddingLeft) || 0;
    var left = label.getBoundingClientRect().left - rowLeft + row.scrollLeft;   // positions in scroll coordinates
    var right = next.getBoundingClientRect().right - rowLeft + row.scrollLeft;
    var max = row.scrollWidth - row.clientWidth;
    var seen = left >= row.scrollLeft + pad - 1 && right <= row.scrollLeft + row.clientWidth - pad + 1;
    if (i > 0 && seen) return;                                                // both already comfortably visible
    row.scrollTo({ left: i === 0 ? 0 : Math.max(0, Math.min(max, left - pad)), behavior: reduced ? 'auto' : 'smooth' });
  }

  $$('input[name="service"]').forEach(function (r) {
    r.addEventListener('change', function () {
      state.service = r.value; render();
      revealChip(r.parentNode);
    });
  });
  $$('input[name="wtype"]').forEach(function (r) { r.addEventListener('change', function () { state.type = r.value; render(); }); });
  $('input[name="dev"]').addEventListener('change', function (e) { state.dev = e.target.checked; render(); });
  // start from whatever the form currently shows (browsers restore form choices on reload)
  state.service = ($('input[name="service"]:checked') || {}).value || 'package';
  state.type = ($('input[name="wtype"]:checked') || {}).value || 'static';
  state.dev = $('input[name="dev"]').checked;
  state.cur = 'USD';
  render();                                                  // build the card now; the prices stay hidden (data-pending)
  lookup(0).then(function (country) {
    // only a confirmed Pakistani IP gets PKR; an unknown country counts as "not Pakistan"
    state.cur = country === 'PK' ? 'PKR' : 'USD';
    shown = null;
    render();
    sec.dataset.country = country || 'unknown';              // visible in DevTools: handy for checking a VPN
    sec.removeAttribute('data-pending');
  });
})();
