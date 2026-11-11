/* ---------- The navbar, written once ----------
   Every page puts this one line where the navbar belongs:

     <script src="static/js/navbar.js" data-variant="page"></script>        (on the pages inside the projects/ folder the path starts with ../)

   and this script writes the navbar there, at that exact spot, while the page is being read, so nothing jumps afterwards.
   The paths to the logo and the links are worked out from where this file is loaded from, so the same code works on every page.
   Its looks and behaviour live in static/css/topbar.css and static/js/topbar.js.

   data-variant:
     home  the home page: the logo scrolls to the top, the links are on the same page, the button is "Book a call"
     page  booking, privacy, refunds, standards: the button on the right is "Back to site"
     case  a project page: "All work" and "Book a call"
     lost  the 404 page: only the logo with the name and a "Book a call" button, no menu on any screen

   To change a link, a label or the logo for the whole site, change it here, once. */
/* Clean addresses: show /privacy instead of /privacy.html, and / instead of /index.html.
   GitHub Pages serves both forms, so this only tidies what the address bar shows (and what people copy and share).
   It does nothing when the files are opened straight from disk. The links in the pages still point at the .html files,
   so everything also works on a plain local server. */
(function () {
  try {
    if (!/^https?:$/.test(location.protocol)) return;
    var p = location.pathname, clean = p.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    if (clean !== p && !/\/404$/.test(clean)) history.replaceState(null, '', clean + location.search + location.hash);
  } catch (e) {}
})();

(function () {
  var s = document.currentScript;
  if (!s) return;
  var root = (s.getAttribute('src') || '').replace('static/js/navbar.js', '');          // "" on the main pages, "../" inside projects/
  var variant = s.getAttribute('data-variant') || 'page', home = variant === 'home';

  var LINKS = [['services', 'Services'], ['work', 'Work'], ['process', 'Process'], ['pricing', 'Pricing'], ['faq', 'FAQ']];
  var BACK = '<svg class="btn__arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M12.5 8h-9M7 4 3 8l4 4"/></svg>';
  var CHEVRON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5"/></svg>';

  var homeUrl = root + 'index.html', bookUrl = root + 'book.html';
  var right = '', menuButton = '';
  if (variant === 'home') {
    right = '<a class="btn btn--dark btn--sm topbar__cta" href="' + bookUrl + '">Book a call</a>';
    menuButton = '<a class="btn btn--dark btn--lg" href="' + bookUrl + '">Book a call</a>';
  } else if (variant === 'lost') {                                    // the 404 page: the logo goes home, the button is Book a call
    right = '<a class="btn btn--dark btn--sm topbar__cta" href="' + bookUrl + '">Book a call</a>';
    menuButton = '<a class="btn btn--dark btn--lg" href="' + bookUrl + '">Book a call</a>';
  } else if (variant === 'case') {
    right = '<a class="btn btn--light btn--sm topbar__work" href="' + homeUrl + '#work">' + BACK + ' All work</a>' +
            '<a class="btn btn--dark btn--sm topbar__cta" href="' + bookUrl + '">Book a call</a>';
    menuButton = '<a class="btn btn--dark btn--lg" href="' + bookUrl + '">Book a call</a>';
  } else {
    right = '<a class="btn btn--light btn--sm topbar__work" href="' + homeUrl + '">' + BACK + ' Back to site</a>';
    menuButton = '<a class="btn btn--dark btn--lg" href="' + homeUrl + '">Back to site</a>';
  }

  if (variant === 'lost') {                                          // the 404 page: only the logo with the name, and the button. No menu, no toggle, on any screen
    s.insertAdjacentHTML('beforebegin',
      '<header class="topbar topbar--simple" id="topbar"><div class="topbar__bar">' +
        '<a class="brand" href="' + homeUrl + '" aria-label="Protosofts home"><img class="brand__mark" src="' + root + 'static/img/logo.svg" alt="" width="24" height="24">Protosofts</a>' +
        '<div class="topbar__actions">' + right + '</div>' +
      '</div></header>');
    s.parentNode.removeChild(s);
    return;
  }

  var items = LINKS.map(function (l) {
    return '<li><a href="' + (home ? '#' : homeUrl + '#') + l[0] + '">' + l[1] + CHEVRON + '</a></li>';
  }).join('');

  var html =
    '<header class="topbar" id="topbar">' +
      '<div class="topbar__scrim" aria-hidden="true"></div>' +
      '<div class="topbar__bar">' +
        '<a class="brand" href="' + (home ? '#top' : homeUrl) + '" aria-label="' + (home ? 'Protosofts, back to the top' : 'Protosofts home') + '">' +
          '<img class="brand__mark" src="' + root + 'static/img/logo.svg" alt="" width="24" height="24">Protosofts' +
        '</a>' +
        '<div class="topbar__actions">' + right +
          '<button class="topbar__menu" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><span class="topbar__bars" aria-hidden="true"><i></i><i></i></span></button>' +
        '</div>' +
      '</div>' +
      '<div class="menu" id="menu"><nav aria-label="Menu"><ul>' + items + '</ul></nav>' + menuButton + '</div>' +
    '</header>';

  s.insertAdjacentHTML('beforebegin', html);
  s.parentNode.removeChild(s);
})();
