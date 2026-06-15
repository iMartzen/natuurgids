(function () {
  'use strict';

  var grid = document.getElementById('post-grid');
  if (!grid) return;

  var activeType = '';
  var activeThema = '';

  function applyFilters() {
    var cards = grid.querySelectorAll('.post-card');
    var visible = 0;

    cards.forEach(function (card) {
      var type = card.dataset.type || '';
      var themas = [];
      try { themas = JSON.parse(card.dataset.themas || '[]'); } catch (_) {}

      var typeMatch  = !activeType  || type === activeType;
      var themaMatch = !activeThema || themas.indexOf(activeThema) !== -1;
      var show = typeMatch && themaMatch;

      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    var noResults = document.getElementById('no-results');
    if (noResults) noResults.style.display = visible === 0 ? '' : 'none';
  }

  function clearGroup(attr) {
    document.querySelectorAll('[data-' + attr + ']').forEach(function (b) {
      b.classList.remove('active');
    });
  }

  // Type-filters
  document.querySelectorAll('[data-filter-type]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var val = btn.dataset.filterType;
      if (activeType === val) {
        activeType = '';
        clearGroup('filter-type');
        var allBtn = document.querySelector('[data-filter-type=""]');
        if (allBtn) allBtn.classList.add('active');
      } else {
        activeType = val;
        clearGroup('filter-type');
        btn.classList.add('active');
      }
      applyFilters();
    });
  });

  // Thema-filters
  document.querySelectorAll('[data-filter-thema]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var val = btn.dataset.filterThema;
      if (activeThema === val) {
        activeThema = '';
        clearGroup('filter-thema');
      } else {
        activeThema = val;
        clearGroup('filter-thema');
        btn.classList.add('active');
      }
      applyFilters();
    });
  });

  // URL-parameter bij laden (vanuit sidebar-links)
  var params = new URLSearchParams(window.location.search);
  var themaParam = params.get('thema');
  if (themaParam) {
    var btn = document.querySelector('[data-filter-thema="' + themaParam + '"]');
    if (btn) {
      activeThema = themaParam;
      clearGroup('filter-thema');
      btn.classList.add('active');
      applyFilters();
    }
  }
})();
