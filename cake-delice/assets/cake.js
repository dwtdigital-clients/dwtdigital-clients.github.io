/* ====== CAKE DÉLICE — comportements partagés ====== */
(function () {
  "use strict";
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu-mobile');
  var bar = document.querySelector('.appbar');
  if (burger && menu) {
    var place = function () { if (bar) menu.style.top = bar.getBoundingClientRect().bottom + 'px'; };
    var close = function () { burger.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); };
    place();
    burger.addEventListener('click', function () {
      var o = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!o)); place();
      menu.classList.toggle('open', !o);
    });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () { place(); if (window.innerWidth > 860) close(); });
    window.addEventListener('scroll', function () { if (menu.classList.contains('open')) place(); });
  }
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();
