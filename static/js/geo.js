/* ---------- Visitor country, from the visitor's IP ----------
   Shared by the pricing section and the booking page, so both always agree on the currency:
   a confirmed Pakistani IP sees PKR, everyone else sees USD. A static site has no server, so the country
   comes from a free public lookup (Cloudflare's trace, then country.is, then ipwho.is), tried in turn with a
   short timeout each. Nothing is saved between page loads, and the browser's timezone is deliberately
   ignored: a VPN changes the IP but not the timezone.

   ProtosoftGeo.country()  -> Promise of a country code like "PK", or null if every lookup failed
   ProtosoftGeo.currency() -> Promise of "PKR" (confirmed Pakistan) or "USD" (anything else, including unknown) */
(function () {
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
    return fetchText(SOURCES[i].url).then(SOURCES[i].parse).then(function (c) {
      return /^[A-Z]{2}$/.test(c || '') ? c : lookup(i + 1);
    }, function () { return lookup(i + 1); });
  }

  var pending = null;                                        // one lookup per page load, shared by everything on it
  window.ProtosoftGeo = {
    country: function () { return pending || (pending = lookup(0)); },
    currency: function () { return this.country().then(function (c) { return c === 'PK' ? 'PKR' : 'USD'; }); }
  };
})();
