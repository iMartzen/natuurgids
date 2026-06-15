(function () {
  'use strict';

  var burger = document.getElementById('nav-burger');
  var menu   = document.getElementById('nav-mobile');
  if (!burger || !menu) return;

  function openMenu() {
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Menu sluiten');
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Menu openen');
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
  }

  burger.addEventListener('click', function () {
    burger.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
  });

  // Sluit bij klik buiten het menu
  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && !burger.contains(e.target)) closeMenu();
  });

  // Sluit bij escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
})();
