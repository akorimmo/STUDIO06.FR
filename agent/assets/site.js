/* Interactions : menu mobile, filtres et carte des biens, galerie photo. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Pages ouvertes directement depuis l'ordinateur (file://) : « dossier/ » → « dossier/index.html »
  var local = location.protocol === 'file:';
  function lienLocal(h) { return local && h && !/^[a-z]+:|^#/i.test(h) ? h.replace(/\/(\?|#|$)/, '/index.html$1') : h; }
  if (local) $$('a[href]').forEach(function (a) { var h = a.getAttribute('href'); if (/\/(\?|#|$)/.test(h)) a.setAttribute('href', lienLocal(h)); });

  // Vitrine de l'accueil : 3 biens qui changent toutes les 5 secondes, en décalé
  var fen = $('#fenetre'), dn = $('#vitrine-donnees');
  if (fen && dn) {
    var vit = []; try { vit = JSON.parse(dn.textContent); } catch (e) {}
    var fentes = $$('.fente', fen), suivant = fentes.length, calme = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function remplir(f, d) {
      var a = f.querySelector('.fente-lien'), img = f.querySelector('img');
      a.setAttribute('href', lienLocal(d.u)); img.src = d.i; img.alt = d.t;
      f.querySelector('.fente-prix').textContent = d.p;
      f.querySelector('.fente-titre').textContent = d.t;
      f.querySelector('.fente-ville').textContent = d.v + (d.s ? ' · ' + d.s : '');
      f.querySelector('.fente-info').setAttribute('href', d.m);
    }
    function changer(f) {
      if (f.matches(':hover')) return;
      var d = vit[suivant++ % vit.length];
      var pre = new Image(); pre.referrerPolicy = 'no-referrer'; pre.src = d.i;
      if (calme) { remplir(f, d); return; }
      f.classList.add('sortie');
      setTimeout(function () { remplir(f, d); f.classList.remove('sortie'); f.classList.add('entree'); setTimeout(function () { f.classList.remove('entree'); }, 600); }, 500);
    }
    if (vit.length > fentes.length) fentes.forEach(function (f, k) {
      setTimeout(function () { changer(f); setInterval(function () { changer(f); }, 5000); }, 5000 + k * 1667);
    });
  }

  // Menu mobile
  var burger = $('.burger'), menu = $('#menu');
  if (burger && menu) burger.addEventListener('click', function () {
    var o = menu.classList.toggle('ouvert');
    burger.setAttribute('aria-expanded', o ? 'true' : 'false');
  });

  var TUILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  var ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';
  function quandLeaflet(fn) { if (window.L) return fn(); var n = 0, t = setInterval(function () { if (window.L || ++n > 100) { clearInterval(t); if (window.L) fn(); } }, 80); }
  var accent = '#e2002e';
  function icone() { return window.L.divIcon({ className: '', html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:' + accent + ';border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>', iconSize: [18, 18], iconAnchor: [9, 9] }); }

  // Menus déroulants « villes » à cases à cocher
  $$('[data-multi]').forEach(function (m) {
    var bouton = $('.multi-bouton', m), liste = $('.multi-liste', m), valeur = bouton.querySelector('span');
    var cases = $$('input[type=checkbox]', liste);
    function resume() {
      var choix = cases.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
      valeur.textContent = !choix.length ? 'Toutes les villes' : choix.length <= 2 ? choix.join(', ') : choix.length + ' villes sélectionnées';
    }
    function ouvrir(o) { liste.hidden = !o; bouton.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    bouton.addEventListener('click', function () { ouvrir(liste.hidden); });
    cases.forEach(function (c) { c.addEventListener('change', resume); });
    var tout = $('[data-tout]', liste), fermer = $('[data-fermer]', liste);
    if (tout) tout.addEventListener('click', function () { cases.forEach(function (c) { c.checked = false; }); resume(); m.dispatchEvent(new Event('change', { bubbles: true })); });
    if (fermer) fermer.addEventListener('click', function () { ouvrir(false); bouton.focus(); });
    document.addEventListener('click', function (e) { if (!m.contains(e.target)) ouvrir(false); });
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape') { ouvrir(false); bouton.focus(); } });
    var cherche = $('.multi-recherche', liste);
    if (cherche) {
      var sans = function (t) { return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); };
      cherche.addEventListener('input', function () {
        var q = sans(cherche.value.trim());
        cases.forEach(function (c) { c.parentNode.hidden = q && sans(c.value).indexOf(q) < 0; });
      });
      cherche.addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
      bouton.addEventListener('click', function () { if (!liste.hidden) setTimeout(function () { cherche.focus(); }, 0); });
    }
    m._resume = resume; resume();
  });

  // Recherche de la page d'accueil → page « Nos biens » (?ville=…&ville=…&budget=…)
  var formAccueil = $('#recherche-accueil');
  if (formAccueil) formAccueil.addEventListener('submit', function (e) {
    var f = new FormData(formAccueil), q = new URLSearchParams();
    f.getAll('ville').forEach(function (v) { q.append('ville', v); });
    if (f.get('budget')) q.set('budget', f.get('budget'));
    e.preventDefault(); location.href = lienLocal(formAccueil.getAttribute('action') || 'biens/') + (q.toString() ? '?' + q.toString() : '');
  });

  // Filtres + tri + carte de la liste
  var form = $('#filtres');
  if (form) {
    var grille = $('.grille-biens'), cartes = $$('.carte-bien', grille), compteur = $('#compteur'), aucun = $('#aucun'), tri = $('#tri');
    var carteEl = $('#carte'), btn = $('#voir-carte'), map = null, couche = null;
    var num = function (el, k) { var v = el.dataset[k]; return v === '' || v == null ? null : parseFloat(v); };
    function visibles() { return cartes.filter(function (c) { return !c.hidden; }); }
    function majCarte() {
      if (!map) return;
      couche.clearLayers(); var pts = [];
      visibles().forEach(function (c) {
        var lat = num(c, 'lat'), lng = num(c, 'lng'); if (lat == null || lng == null) return;
        var a = c.querySelector('a'), img = c.querySelector('img'), prix = c.querySelector('.carte-prix'), titre = c.querySelector('h3');
        var html = '<a class="popup-bien" href="' + a.getAttribute('href') + '">' + (img ? '<img src="' + img.getAttribute('src') + '" alt="" referrerpolicy="no-referrer">' : '') + '<strong>' + prix.textContent + '</strong>' + titre.textContent + '</a>';
        window.L.marker([lat, lng], { icon: icone() }).bindPopup(html).addTo(couche); pts.push([lat, lng]);
      });
      if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 14 });
    }
    function appliquer() {
      var f = new FormData(form), villes = f.getAll('ville'), budget = f.get('budget') || '';
      var plus = budget === '1000000+', max = plus ? NaN : parseFloat(budget);
      var n = 0;
      cartes.forEach(function (c) {
        var p = num(c, 'prix');
        var ok = (!villes.length || villes.indexOf(c.dataset.ville) >= 0) &&
          (plus ? (p != null && p >= 1000000) : (isNaN(max) || (p != null && p <= max)));
        c.hidden = !ok; if (ok) n++;
      });
      var cle = { 'prix-asc': function (a, b) { return (num(a, 'prix') || 9e12) - (num(b, 'prix') || 9e12); }, 'prix-desc': function (a, b) { return (num(b, 'prix') || 0) - (num(a, 'prix') || 0); }, 'surface-desc': function (a, b) { return (num(b, 'surface') || 0) - (num(a, 'surface') || 0); } }[tri ? tri.value : 'date'] ||
        function (a, b) { return (b.dataset.date || '').localeCompare(a.dataset.date || ''); };
      cartes.slice().sort(cle).forEach(function (c) { grille.appendChild(c); });
      compteur.textContent = n + ' bien' + (n > 1 ? 's' : '');
      if (aucun) aucun.hidden = n > 0;
      majCarte();
    }
    // Critères reçus de la page d'accueil
    var q = new URLSearchParams(location.search), qv = q.getAll('ville');
    if (qv.length) $$('input[name=ville]', form).forEach(function (c) { c.checked = qv.indexOf(c.value) >= 0; });
    if (q.get('budget')) form.elements.budget.value = q.get('budget');
    var multi = $('[data-multi]', form); if (multi && multi._resume) multi._resume();
    form.addEventListener('change', appliquer);
    if (tri) tri.addEventListener('change', appliquer);
    form.addEventListener('submit', function (e) { e.preventDefault(); appliquer(); var m = $('.multi-liste', form); if (m) m.hidden = true; grille.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    appliquer();
    if (btn && carteEl) btn.addEventListener('click', function () {
      var montrer = carteEl.hidden; carteEl.hidden = !montrer;
      btn.setAttribute('aria-pressed', montrer ? 'true' : 'false'); btn.textContent = montrer ? 'Masquer la carte' : 'Afficher la carte';
      if (montrer) quandLeaflet(function () {
        if (!map) { map = window.L.map(carteEl, { scrollWheelZoom: false }).setView([43.7, 7.26], 10); window.L.tileLayer(TUILES, { attribution: ATTR, subdomains: 'abcd', maxZoom: 19 }).addTo(map); couche = window.L.layerGroup().addTo(map); }
        setTimeout(function () { map.invalidateSize(); majCarte(); }, 50);
      });
    });
  }

  // Carte de la fiche
  var cf = $('#carte-fiche');
  if (cf) quandLeaflet(function () {
    var p = [parseFloat(cf.dataset.lat), parseFloat(cf.dataset.lng)];
    var m = window.L.map(cf, { scrollWheelZoom: false }).setView(p, 14);
    window.L.tileLayer(TUILES, { attribution: ATTR, subdomains: 'abcd', maxZoom: 19 }).addTo(m);
    window.L.circle(p, { radius: 250, color: accent, fillColor: accent, fillOpacity: .18, weight: 2 }).addTo(m);
  });

  // Galerie + visionneuse
  var gal = $('[data-galerie]');
  if (gal) {
    var princ = $('.galerie-principale', gal), vign = $$('.galerie-vignettes button', gal);
    var srcs = vign.map(function (b) { return b.dataset.src; }); var courant = 0;
    function choisir(i) { courant = (i + srcs.length) % srcs.length; var img = princ.querySelector('img'); img.src = srcs[courant]; princ.dataset.index = courant; vign.forEach(function (b, k) { b.classList.toggle('actif', k === courant); }); }
    vign.forEach(function (b, i) { b.addEventListener('click', function () { choisir(i); }); });
    if (vign[0]) vign[0].classList.add('actif');
    if (princ && srcs.length) princ.addEventListener('click', function () {
      var v = document.createElement('div'); v.className = 'visionneuse'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', 'Photos du bien');
      v.innerHTML = '<img alt="" referrerpolicy="no-referrer"><button class="fermer" aria-label="Fermer">×</button><button class="prec" aria-label="Photo précédente">‹</button><button class="suiv" aria-label="Photo suivante">›</button><span class="num"></span>';
      var im = v.querySelector('img'), nb = v.querySelector('.num');
      function montrer() { im.src = srcs[courant]; nb.textContent = (courant + 1) + ' / ' + srcs.length; }
      function fermer() { document.removeEventListener('keydown', clav); v.remove(); choisir(courant); princ.focus(); }
      function clav(e) { if (e.key === 'Escape') fermer(); if (e.key === 'ArrowRight') { courant = (courant + 1) % srcs.length; montrer(); } if (e.key === 'ArrowLeft') { courant = (courant - 1 + srcs.length) % srcs.length; montrer(); } }
      v.querySelector('.fermer').onclick = fermer;
      v.querySelector('.prec').onclick = function () { courant = (courant - 1 + srcs.length) % srcs.length; montrer(); };
      v.querySelector('.suiv').onclick = function () { courant = (courant + 1) % srcs.length; montrer(); };
      v.addEventListener('click', function (e) { if (e.target === v) fermer(); });
      document.addEventListener('keydown', clav); document.body.appendChild(v); montrer(); v.querySelector('.fermer').focus();
    });
  }
})();
