(function () {
  'use strict';

  var userId = (document.querySelector('meta[name="waarneming-user-id"]') || {}).content;
  var profileUrl = (document.querySelector('meta[name="waarneming-profile"]') || {}).content;

  if (!userId) return;

  var API_BASE = 'https://waarneming.nl/api/v1';
  var widgets = document.querySelectorAll('#waarnemingen-widget, #waarnemingen-full');
  if (!widgets.length) return;

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  }

  function showFallback(container) {
    container.innerHTML = profileUrl
      ? '<p class="waarnemingen-fallback"><a href="' + profileUrl + '" target="_blank" rel="noopener">Bekijk mijn waarnemingen op waarneming.nl →</a></p>'
      : '';
  }

  function renderObservations(observations, container, maxItems) {
    if (!observations || !observations.length) {
      showFallback(container);
      return;
    }

    var items = observations.slice(0, maxItems).map(function (obs) {
      var name = (obs.species_detail && (obs.species_detail.name_nl || obs.species_detail.name))
        || obs.species || 'Onbekend';
      var photoRaw = obs.photos && obs.photos[0];
      var photoUrl = photoRaw && (typeof photoRaw === 'string' ? photoRaw : photoRaw.image_url);
      var location = obs.location_detail && obs.location_detail.name || '';
      return '<li class="waarneming-item">'
        + (photoUrl ? '<img src="' + esc(photoUrl) + '" alt="' + esc(name) + '" loading="lazy" width="44" height="44">' : '')
        + '<div class="waarneming-info">'
        + '<strong>' + esc(name) + '</strong>'
        + '<span>' + esc(formatDate(obs.date)) + (location ? ' · ' + esc(location) : '') + '</span>'
        + '</div></li>';
    }).join('');

    container.innerHTML = '<ul class="waarnemingen-list">' + items + '</ul>'
      + (profileUrl ? '<a href="' + profileUrl + '" target="_blank" rel="noopener" class="waarnemingen-link">Alle waarnemingen →</a>' : '');
  }

  function loadWaarnemingen() {
    var url = API_BASE + '/observations/?user=' + encodeURIComponent(userId) + '&page_size=10&format=json';

    fetch(url, { headers: { 'Accept': 'application/json' } }, { signal: AbortSignal.timeout(8000) })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var observations = data.results || [];
        widgets.forEach(function (w) {
          var max = w.id === 'waarnemingen-full' ? 10 : 6;
          renderObservations(observations, w, max);
        });
      })
      .catch(function () {
        widgets.forEach(function (w) { showFallback(w); });
      });
  }

  loadWaarnemingen();
})();
