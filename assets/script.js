// Kymenlaakson Taksi — jaetut toiminnot: mobiilivalikko, haitarit, välilehdet

document.addEventListener('DOMContentLoaded', function () {

  initSeasonalHero();

  // Mobiilivalikko
  var menuToggle = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.mobile-nav');
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
      var expanded = mobileNav.classList.contains('open');
      menuToggle.setAttribute('aria-expanded', expanded);
    });
  }

  // Haitarit (accordion) — WCAG: aria-expanded tilan mukana
  document.querySelectorAll('.acc-trigger').forEach(function (trigger, i) {
    var item = trigger.closest('.acc-item');
    var panel = item.querySelector('.acc-panel');
    var panelId = panel.id || ('acc-panel-' + Math.random().toString(36).slice(2) + i);
    panel.id = panelId;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', panelId);

    trigger.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // sulje saman ryhmän muut (valinnainen, per accordion-container)
      var group = item.closest('.accordion');
      if (group && group.dataset.exclusive === 'true') {
        group.querySelectorAll('.acc-item.open').forEach(function (openItem) {
          if (openItem !== item) {
            openItem.classList.remove('open');
            openItem.querySelector('.acc-panel').style.maxHeight = null;
            openItem.querySelector('.acc-trigger').setAttribute('aria-expanded', 'false');
          }
        });
      }

      if (isOpen) {
        item.classList.remove('open');
        panel.style.maxHeight = null;
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Välilehdet (tabs) — ARIA tablist-malli nuolinäppäimillä
  document.querySelectorAll('.tabs').forEach(function (tabGroup) {
    var targetSelector = tabGroup.dataset.target;
    var panelContainer = targetSelector ? document.querySelector(targetSelector) : null;
    var panels = panelContainer ? panelContainer.querySelectorAll('.tab-panel') : [];
    var btns = Array.prototype.slice.call(tabGroup.querySelectorAll('.tab-btn'));

    tabGroup.setAttribute('role', 'tablist');
    if (panelContainer) panelContainer.querySelectorAll('.tab-panel').forEach(function (p) {
      p.setAttribute('role', 'tabpanel');
    });

    function activate(btn, moveFocus) {
      btns.forEach(function (b) {
        var selected = b === btn;
        b.classList.toggle('active', selected);
        b.setAttribute('aria-selected', selected ? 'true' : 'false');
        b.tabIndex = selected ? 0 : -1;
      });
      var targetId = btn.dataset.tab;
      panels.forEach(function (p) {
        p.classList.toggle('active', p.id === targetId);
      });
      if (moveFocus) btn.focus();
    }

    btns.forEach(function (btn, idx) {
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
      btn.setAttribute('aria-controls', btn.dataset.tab);
      btn.tabIndex = btn.classList.contains('active') ? 0 : -1;

      btn.addEventListener('click', function () { activate(btn, false); });

      btn.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = btns[(idx + 1) % btns.length];
        else if (e.key === 'ArrowLeft') next = btns[(idx - 1 + btns.length) % btns.length];
        else if (e.key === 'Home') next = btns[0];
        else if (e.key === 'End') next = btns[btns.length - 1];
        if (next) {
          e.preventDefault();
          activate(next, true);
        }
      });
    });
  });

  // Palvelut-pudotusvalikko (desktop)
  document.querySelectorAll('.nav-dropdown').forEach(function (dropdown) {
    var toggle = dropdown.querySelector('.nav-dropdown-toggle');
    var menu = dropdown.querySelector('.nav-dropdown-menu');
    if (!toggle || !menu) return;

    function close() {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    function open() {
      menu.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', function () {
      if (menu.classList.contains('open')) close(); else open();
    });
    dropdown.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target)) close();
    });
    document.addEventListener('focusin', function (e) {
      if (!dropdown.contains(e.target)) close();
    });
  });

  // Takaisin ylös -painike
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
    backToTop.addEventListener('click', function () {
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  initHintalaskuri();
  initAvoimetTyopaikat();
});


/* =======================================================================
   Hintalaskuri — osoitehaku ja reititys OpenStreetMapin (Nominatim + OSRM)
   avoimilla rajapinnoilla. Haku on rajattu Kymenlaakson alueelle
   (viewbox), mikä auttaa tunnistamaan paikallisia osoitteita ja
   paikannimiä paremmin kuin rajaamaton haku.

   Huom. tuotannossa suurella kävijämäärällä: Nominatimin ja OSRM:n
   julkiset demopalvelimet on tarkoitettu kevyeen käyttöön. Jos liikenne
   kasvaa, harkitse oman Nominatim/OSRM-instanssin pystyttämistä tai
   kaupallista geokoodaus-/reititysrajapintaa.
   ======================================================================= */


/* =======================================================================
   Vuodenajan mukaan vaihtuva herokuva. Toistaiseksi käytössä on vain
   talvi- ja kesäkuvasto (kuvapankista löytyi laadukkaat kuvaukset näistä
   kahdesta vuodenajasta, ei vielä omia kevät-/syksykuvauksia). Kevät ja
   syksy käyttävät toistaiseksi lähintä sopivaa kuvasarjaa alla olevan
   SEASON_FALLBACK-kartan mukaan — kun kevät-/syksykuvat joskus kuvataan,
   lisää ne kuvan data-kevat/data-syksy-attribuutteihin ja poista vastaava
   rivi SEASON_FALLBACK-kartasta, niin ne otetaan automaattisesti käyttöön.
   ======================================================================= */
var SEASON_MONTHS = {
  talvi: [11, 12, 1, 2, 3],
  kevat: [4, 5],
  kesa: [6, 7, 8, 9],
  syksy: [10]
};
// Vuodenaika -> mitä data-attribuuttia kuvasta oikeasti haetaan juuri nyt.
var SEASON_FALLBACK = { talvi: 'talvi', kevat: 'talvi', kesa: 'kesa', syksy: 'kesa' };

function currentSeason(month) {
  month = month || (new Date().getMonth() + 1);
  for (var season in SEASON_MONTHS) {
    if (SEASON_MONTHS[season].indexOf(month) !== -1) return season;
  }
  return 'kesa';
}

function initSeasonalHero() {
  var img = document.getElementById('seasonal-hero');
  if (!img) return;
  var season = currentSeason();
  var key = SEASON_FALLBACK[season] || season;
  var src = img.getAttribute('data-' + key);
  if (src) img.src = src;
}

function initHintalaskuri() {
  var submitBtn = document.getElementById('calc-submit');
  if (!submitBtn) return;

  var KYMENLAAKSO_VIEWBOX = '26.0,61.3,28.3,60.2'; // lon_left,lat_top,lon_right,lat_bottom

  var methodRadios = document.querySelectorAll('input[name="calc-method"]');
  var panels = document.querySelectorAll('.calc-panel');

  methodRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      panels.forEach(function (p) {
        p.classList.toggle('active', p.dataset.panel === radio.value);
      });
    });
  });

  // ---- Osoitehaku (autocomplete) Nominatimilla ----
  function setupAutocomplete(inputId, listId) {
    var input = document.getElementById(inputId);
    var list = document.getElementById(listId);
    if (!input || !list) return;

    var liveRegion = document.getElementById(inputId + '-live');

    // ARIA combobox-malli (WAI-ARIA Authoring Practices)
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', listId);
    list.setAttribute('role', 'listbox');

    var debounceTimer = null;
    var controller = null;
    var focusedIndex = -1;

    function clearCoords() {
      delete input.dataset.lat;
      delete input.dataset.lon;
    }

    function closeList() {
      list.hidden = true;
      list.innerHTML = '';
      focusedIndex = -1;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }

    function setFocused(items, index) {
      focusedIndex = index;
      items.forEach(function (it, i) {
        var isFocused = i === index;
        it.classList.toggle('focused', isFocused);
        it.setAttribute('aria-selected', isFocused ? 'true' : 'false');
      });
      if (index >= 0) {
        input.setAttribute('aria-activedescendant', items[index].id);
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }

    function renderResults(results) {
      list.innerHTML = '';
      if (!results.length) {
        closeList();
        if (liveRegion) liveRegion.textContent = 'Ei osoite-ehdotuksia.';
        return;
      }
      results.forEach(function (r, i) {
        var item = document.createElement('div');
        item.className = 'ac-item';
        item.id = listId + '-opt-' + i;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.dataset.index = i;
        var main = (r.display_name || '').split(',')[0];
        item.innerHTML = '<div class="ac-main"></div><div class="ac-sub"></div>';
        item.querySelector('.ac-main').textContent = main;
        item.querySelector('.ac-sub').textContent = r.display_name;
        item.addEventListener('click', function () {
          input.value = r.display_name;
          input.dataset.lat = r.lat;
          input.dataset.lon = r.lon;
          closeList();
        });
        list.appendChild(item);
      });
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      if (liveRegion) {
        liveRegion.textContent = results.length + (results.length === 1 ? ' osoite-ehdotus löytyi.' : ' osoite-ehdotusta löytyi.');
      }
    }

    input.addEventListener('input', function () {
      clearCoords();
      var query = input.value.trim();
      if (debounceTimer) clearTimeout(debounceTimer);
      if (query.length < 3) {
        closeList();
        return;
      }
      debounceTimer = setTimeout(function () {
        if (controller) controller.abort();
        controller = new AbortController();
        var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6'
          + '&countrycodes=fi&accept-language=fi'
          + '&viewbox=' + KYMENLAAKSO_VIEWBOX + '&bounded=0'
          + '&q=' + encodeURIComponent(query);
        fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } })
          .then(function (res) { return res.json(); })
          .then(function (data) { renderResults(data || []); })
          .catch(function (err) { if (err.name !== 'AbortError') closeList(); });
      }, 350);
    });

    input.addEventListener('keydown', function (e) {
      var items = list.querySelectorAll('.ac-item');
      if (!items.length || list.hidden) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocused(items, Math.min(focusedIndex + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocused(items, Math.max(focusedIndex - 1, 0));
      } else if (e.key === 'Enter') {
        if (focusedIndex >= 0) {
          e.preventDefault();
          items[focusedIndex].click();
        }
        return;
      } else if (e.key === 'Escape') {
        closeList();
        return;
      } else {
        return;
      }
    });

    document.addEventListener('click', function (e) {
      if (!input.contains(e.target) && !list.contains(e.target)) closeList();
    });
  }

  setupAutocomplete('calc-from', 'calc-from-list');
  setupAutocomplete('calc-to', 'calc-to-list');

  // Yksittäisen osoitteen geokoodaus (varalla, jos käyttäjä ei valinnut listasta)
  function geocode(query) {
    var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1'
      + '&countrycodes=fi&accept-language=fi'
      + '&viewbox=' + KYMENLAAKSO_VIEWBOX + '&bounded=0'
      + '&q=' + encodeURIComponent(query);
    return fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.length) return null;
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      });
  }

  function resolvePoint(inputId) {
    var input = document.getElementById(inputId);
    if (input.dataset.lat && input.dataset.lon) {
      return Promise.resolve({ lat: parseFloat(input.dataset.lat), lon: parseFloat(input.dataset.lon) });
    }
    var query = input.value.trim();
    if (!query) return Promise.resolve(null);
    return geocode(query);
  }

  // ---- Reititys OSRM:llä ----
  var routeBtn = document.getElementById('calc-route-btn');
  var routeStatus = document.getElementById('calc-route-status');
  var routeData = { km: null, min: null };

  if (routeBtn) {
    routeBtn.addEventListener('click', function () {
      routeStatus.textContent = 'Haetaan reittiä…';
      routeData.km = null;
      routeData.min = null;

      Promise.all([resolvePoint('calc-from'), resolvePoint('calc-to')])
        .then(function (points) {
          var from = points[0], to = points[1];
          if (!from || !to) {
            routeStatus.textContent = 'Osoitetta ei löytynyt. Tarkista lähtöpaikka ja määränpää.';
            return;
          }
          var url = 'https://router.project-osrm.org/route/v1/driving/'
            + from.lon + ',' + from.lat + ';' + to.lon + ',' + to.lat
            + '?overview=false';
          return fetch(url).then(function (res) { return res.json(); }).then(function (data) {
            if (!data.routes || !data.routes.length) {
              routeStatus.textContent = 'Reittiä ei löytynyt näiden osoitteiden välille.';
              return;
            }
            var route = data.routes[0];
            routeData.km = route.distance / 1000;
            routeData.min = route.duration / 60;
            routeStatus.textContent = 'Matka noin ' + routeData.km.toFixed(1).replace('.', ',') + ' km · ' + Math.round(routeData.min) + ' min ajoaikaa.';
          });
        })
        .catch(function () {
          routeStatus.textContent = 'Reitin haku epäonnistui. Yritä hetken kuluttua uudelleen.';
        });
    });
  }

  // ---- Hinnan laskenta ----
  var resultBox = document.getElementById('calc-result');
  var amountEl = document.getElementById('calc-amount');
  var breakdownEl = document.getElementById('calc-breakdown');

  submitBtn.addEventListener('click', function () {
    var time = document.querySelector('input[name="calc-time"]:checked').value;
    var pax = document.querySelector('input[name="calc-pax"]:checked').value;
    var method = document.querySelector('input[name="calc-method"]:checked').value;

    var lahtomaksu = time === 'day' ? 5.60 : 8.60;
    var kmRate = pax === '1-4' ? 1.66 : 2.55;
    var waitMin = parseFloat(document.getElementById('calc-wait').value) || 0;

    var km, min;
    if (method === 'manual') {
      km = parseFloat(document.getElementById('calc-km').value) || 0;
      min = parseFloat(document.getElementById('calc-min').value) || 0;
      laske(km, min);
    } else {
      if (routeData.km === null) {
        if (routeStatus) routeStatus.textContent = 'Hae ensin reitti "Hae reitti" -painikkeesta.';
        if (routeBtn) routeBtn.click();
        return;
      }
      laske(routeData.km, routeData.min);
    }

    function laske(km, min) {
      var ajomaksu = km * kmRate;
      var aikaveloitus = min * 0.65;
      var odotusmaksu = waitMin * (65 / 60);
      var hintaRaaka = lahtomaksu + ajomaksu + aikaveloitus + odotusmaksu;
      var hinta = Math.max(hintaRaaka, 10);

      amountEl.textContent = hinta.toFixed(2).replace('.', ',') + ' €';
      breakdownEl.innerHTML =
        'Lähtömaksu ' + lahtomaksu.toFixed(2).replace('.', ',') + ' € · ' +
        'Matka ' + km.toFixed(1).replace('.', ',') + ' km (' + ajomaksu.toFixed(2).replace('.', ',') + ' €) · ' +
        'Aika ' + Math.round(min) + ' min (' + aikaveloitus.toFixed(2).replace('.', ',') + ' €)' +
        (waitMin > 0 ? ' · Odotus ' + Math.round(waitMin) + ' min (' + odotusmaksu.toFixed(2).replace('.', ',') + ' €)' : '') +
        (hintaRaaka < 10 ? ' · Minimihinta 10 €' : '');
      resultBox.classList.add('show');
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}


/* =======================================================================
   Rekry — avoimet työpaikat ladataan data/tyopaikat.json-tiedostosta.
   Tämä tekee listasta helposti päivitettävän: uuden hakemuksen/paikan
   lisääminen tai poistaminen ei vaadi HTML-koodin muokkaamista, vain
   JSON-tiedoston päivittämisen (myös automaation/botin toimesta, esim.
   commitilla tai tiedosto-API:lla).
   ======================================================================= */
// Yhteistyökumppanin ilmoituslomake: kun tämä on asetettu (Google Sheetin
// "Julkaise verkkoon" -CSV-linkki), avoimet työpaikat luetaan sieltä eikä
// paikallisesta data/tyopaikat.json-tiedostosta. Katso data/README.md,
// miten lomake ja taulukko perustetaan. Tyhjänä sivu käyttää
// data/tyopaikat.json-tiedostoa.
var JOBS_SHEET_CSV_URL = '';

function initAvoimetTyopaikat() {
  var container = document.getElementById('avoimet-tyopaikat');
  if (!container) return;

  function fetchLocalJobs() {
    return fetch('data/tyopaikat.json').then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function fetchSheetJobs() {
    return fetch(JOBS_SHEET_CSV_URL, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(parseJobsCsv);
  }

  var source = JOBS_SHEET_CSV_URL ? fetchSheetJobs() : fetchLocalJobs();

  source
    .then(function (jobs) {
      renderJobs(Array.isArray(jobs) ? jobs : []);
    })
    .catch(function () {
      // Jos Google Sheet ei vastaa, yritetään vielä paikallista varmuuskopiota.
      if (JOBS_SHEET_CSV_URL) {
        fetchLocalJobs()
          .then(function (jobs) { renderJobs(Array.isArray(jobs) ? jobs : []); })
          .catch(function () { showError(); });
      } else {
        showError();
      }
    });

  function showError() {
    container.innerHTML = '<p class="job-empty">Avoimia paikkoja ei juuri nyt voitu ladata. Katso hakuvaihtoehdot alta tai lähetä avoin hakemus.</p>';
  }

  // Yksinkertainen CSV-jäsennin, joka ymmärtää lainausmerkeillä suojatut
  // kentät (esim. kuvaukset, joissa on pilkkuja tai rivinvaihtoja).
  function parseCsvRows(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field); field = '';
      } else if (c === '\n') {
        row.push(field); field = ''; rows.push(row); row = [];
      } else if (c === '\r') {
        // ohitetaan, \n hoitaa rivinvaihdon
      } else {
        field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (v) { return v.trim() !== ''; }); });
  }

  // Google Formsin sarakeotsikot (suomeksi) kartoitetaan sisäisiin kenttiin.
  var HEADER_MAP = {
    'otsikko': 'title',
    'tyopaikan otsikko': 'title',
    'paikkakunta': 'location',
    'tyyppi': 'type',
    'tyosuhteen tyyppi': 'type',
    'hakuaika': 'deadline',
    'haku paattyy': 'deadline',
    'kuvaus': 'description',
    'hakulinkki': 'applyUrl',
    'hakemuslinkki': 'applyUrl',
    'linkki hakulomakkeeseen': 'applyUrl',
    'nayta sivulla': 'active',
    'julkaistaanko': 'active',
    'aikaleima': 'timestamp'
  };

  function normalizeHeader(h) {
    return h.trim().toLowerCase()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/å/g, 'a')
      .replace(/[?:.]/g, '').trim();
  }

  function parseJobsCsv(text) {
    var rows = parseCsvRows(text);
    if (rows.length < 2) return [];
    var headers = rows[0].map(normalizeHeader);
    var jobs = rows.slice(1).map(function (r) {
      var job = {};
      headers.forEach(function (h, i) {
        var key = HEADER_MAP[h];
        if (key) job[key] = (r[i] || '').trim();
      });
      if (job.active !== undefined) {
        job.active = !/^(ei|no|false|0)$/i.test(job.active);
      }
      return job;
    }).filter(function (j) { return j.title; });

    // Uusimmat vastaukset (Aikaleima) ensin, jos aikaleimat löytyvät.
    jobs.sort(function (a, b) {
      var ta = Date.parse(a.timestamp || '') || 0;
      var tb = Date.parse(b.timestamp || '') || 0;
      return tb - ta;
    });
    return jobs;
  }

  function renderJobs(jobs) {
    var open = jobs.filter(function (j) { return j && j.active !== false; });
    if (!open.length) {
      container.innerHTML = '<p class="job-empty">Ei tällä hetkellä avoimia haettavia paikkoja — voit silti jättää avoimen hakemuksen alta.</p>';
      return;
    }
    container.innerHTML = '';
    var list = document.createElement('div');
    list.className = 'job-list';
    open.forEach(function (job) {
      var card = document.createElement('div');
      card.className = 'job-card';

      var info = document.createElement('div');
      var title = document.createElement('div');
      title.className = 'job-title';
      title.textContent = job.title || 'Avoin paikka';
      info.appendChild(title);

      var meta = document.createElement('div');
      meta.className = 'job-meta';
      if (job.location) meta.appendChild(makeSpan(job.location));
      if (job.type) meta.appendChild(makeSpan(job.type));
      if (job.deadline) meta.appendChild(makeSpan('Haku päättyy ' + job.deadline));
      info.appendChild(meta);

      if (job.description) {
        var desc = document.createElement('p');
        desc.className = 'job-desc';
        desc.textContent = job.description;
        info.appendChild(desc);
      }

      card.appendChild(info);

      if (job.applyUrl) {
        var link = document.createElement('a');
        link.href = job.applyUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        link.className = 'btn btn-primary';
        link.textContent = 'Hae paikkaa';
        card.appendChild(link);
      }

      list.appendChild(card);
    });
    container.appendChild(list);
  }

  function makeSpan(text) {
    var span = document.createElement('span');
    span.textContent = text;
    return span;
  }
}
