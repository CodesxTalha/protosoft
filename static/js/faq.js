/* ---------- FAQ accordion: one answer open at a time, the first one open to start ---------- */
(function () {
  var sec = document.querySelector('.faq');
  if (!sec) return;
  var items = [].slice.call(sec.querySelectorAll('.faq__item'));

  function set(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.faq__q').setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  items.forEach(function (item, i) {
    set(item, i === 0);
    item.querySelector('.faq__q').addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      items.forEach(function (other) { if (other !== item) set(other, false); });
      set(item, open);
    });
  });

  sec.classList.add('is-ready');
})();
