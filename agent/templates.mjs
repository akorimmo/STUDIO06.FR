// Gabarits HTML communs aux quatre sites.
import { esc, markdown, texte } from './markdown.mjs';

export const AGENCE = {
  nom: 'Akorimmo',
  adresse: '63 boulevard de Cessole – 06100 Nice',
  tel1: '04 93 72 94 11', mail1: 'contact@akorimmo.com',
  tel2: '04 93 79 47 68', mail2: 'contact2@akorimmo.com',
  // Les deux agences, affichées en bas de chaque page, sur la page Contact, etc.
  agences: [
    { nom: 'Agence Cessole', rue: '63 boulevard de Cessole', cp: '06100', ville: 'Nice', tel: '04 93 72 94 11', mail: 'contact@akorimmo.com' },
    { nom: 'Agence Notre-Dame', rue: '9 avenue Notre-Dame', cp: '06000', ville: 'Nice', tel: '04 93 79 47 68', mail: 'contact2@akorimmo.com' },
  ],
  site: 'https://www.akorimmo.com',
  mentions: 'https://akorimmo.com/fr/mentions-legales',
  honoraires: 'https://akorimmo.com/fr/mentions-legales/honoraires',
};

export const GROUPE = [
  { id: 'maison06', nom: 'Maison06.com', url: 'https://www.maison06.com', texte: 'Maisons et villas dans les Alpes-Maritimes' },
  { id: 'appartement06', nom: 'Appartement06.com', url: 'https://www.appartement06.com', texte: 'Appartements dans les Alpes-Maritimes' },
  { id: 'studio06', nom: 'Studio06.fr', url: 'https://www.studio06.fr', texte: 'Studios et petites surfaces à Nice' },
  { id: 'commerce06', nom: 'Commerce06.com', url: 'https://www.commerce06.com', texte: 'Commerces, murs et bureaux' },
];

const tel = (t) => `tel:+33${t.replace(/[^\d]/g, '').replace(/^0/, '')}`;
export const euros = (n) => (n == null ? 'Prix sur demande' : `${Math.round(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')} €`);
const m2 = (n) => (n == null ? '' : `${String(Math.round(n * 100) / 100).replace('.', ',')} m²`);
export const photo = (u) => u;

export function slugify(s = '') {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70).replace(/-$/, '');
}
export const urlBien = (b) => `/biens/${slugify(b.titre || b.entete || b.type) || 'bien'}-${b.id}/`;

const ICON = {
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
  surf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z M4 9h5 M15 4v5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
  door: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V3h12v18 M3 21h18 M14 12h.01" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18V6 M3 14h18v4 M21 14v-2a3 3 0 0 0-3-3h-7v5 M7 11.5h.01" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3z M3 6l9 7 9-7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
};

// ------------------------------------------------------------------- layout
export function layout(site, { titre, description = '', chemin = '/', corps, image, jsonld, carte = false, actif = '', accueil = false }) {
  const c = site.couleurs;
  const canon = `https://${site.domaine}${chemin}`;
  const nav = [
    ['/', 'Accueil', 'accueil'],
    ['/biens/', 'Nos biens', 'biens'],
    ...(site.secteursActifs.length ? [['/secteurs/', 'Secteurs', 'secteurs']] : []),
    ['/estimation/', 'Estimation', 'estimation'],
    ['/a-propos/', 'À propos', 'a-propos'],
    ['/contact/', 'Contact', 'contact'],
  ];
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(description.slice(0, 300))}">
<link rel="canonical" href="${canon}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.nom)}">
<meta property="og:title" content="${esc(titre)}">
<meta property="og:description" content="${esc(description.slice(0, 300))}">
<meta property="og:url" content="${canon}">
${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="theme-color" content="#000000">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
${carte ? '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">' : ''}
<style>html,body{background:#000;color:#f2f2f2;margin:0}.entete-logo img{max-width:min(560px,92vw);height:auto;margin:0 auto}</style>
<link rel="stylesheet" href="/assets/style.css?v=${site.version}">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\u003c')}</script>` : ''}
</head>
<body${accueil ? ' class="page-accueil"' : ''}>
<a class="sauter" href="#contenu">Aller au contenu</a>
<header class="entete">
  <div class="entete-logo"><a href="/" aria-label="${esc(site.nom)} – accueil"><img src="/assets/logo.png" alt="${esc(site.domaine.replace('www.', '').toUpperCase())}" width="1025" height="167"></a></div>
</header>
<div class="entete-nav">
  <div class="conteneur entete-in">
    <span class="burger-texte">Menu</span>
    <button class="burger" aria-expanded="false" aria-controls="menu" aria-label="Menu"><span></span><span></span><span></span></button>
    <nav id="menu" class="menu" aria-label="Navigation principale">
      ${nav.map(([h, t, k]) => `<a href="${h}"${k === actif ? ' aria-current="page"' : ''}>${t}</a>`).join('\n      ')}
      <a class="bouton bouton-petit" href="/alerte/">Alerte e-mail</a>
    </nav>
  </div>
</div>
<main id="contenu">
${corps}
</main>
${pied(site, accueil)}
${carte ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" defer></script>' : ''}
<script src="/assets/site.js?v=${site.version}" defer></script>
</body>
</html>`;
}

// Logos cliquables des autres sites du groupe, en bas de chaque page.
const ORDRE_LOGOS = ['maison06', 'appartement06', 'commerce06', 'studio06'];
function autresSites(site) {
  const sites = ORDRE_LOGOS.filter((id) => id !== site.id).map((id) => GROUPE.find((g) => g.id === id));
  return `<div class="autres-sites">
    <h2>Voir nos autres sites</h2>
    <ul>${sites.map((g) => `<li><a href="${g.url}" title="${esc(g.texte)}"><img src="/assets/logos/${g.id}.png" alt="${esc(g.nom)}" width="512" height="83" loading="lazy"></a></li>`).join('')}</ul>
  </div>`;
}

function pied(site, compact = false) {
  if (compact) {
    return `<footer class="pied pied-compact"><div class="conteneur">${autresSites(site)}</div><div class="conteneur pied-bas">
    <span class="pied-agences">${AGENCE.agences.map((a) => `<span>${AGENCE.nom} ${esc(a.nom.replace('Agence ', ''))} · ${esc(a.rue)} – ${a.cp} ${a.ville} · <a href="${tel(a.tel)}">${a.tel}</a> · <a href="mailto:${a.mail}">${a.mail}</a></span>`).join('')}</span>
    <span><a href="${AGENCE.mentions}" rel="noopener">Mentions légales</a> · <a href="${AGENCE.honoraires}" rel="noopener">Barème d’honoraires</a></span>
  </div></footer>`;
  }
  return `<footer class="pied">
  <div class="conteneur pied-grille">
    <div>
      <a class="pied-logo" href="/"><img src="/assets/logo.png" alt="${esc(site.nom)}" width="1025" height="167" loading="lazy"></a>
      <p>${esc(site.slogan)}.</p>
    </div>
    <div>
      <h2>Nos agences</h2>
      ${AGENCE.agences.map((a) => `<p><strong>${AGENCE.nom} – ${esc(a.nom.replace('Agence ', ''))}</strong><br><span class="pied-agence">${esc(a.rue)} – ${a.cp} ${a.ville}</span><br><a href="${tel(a.tel)}">${a.tel}</a> · <a href="mailto:${a.mail}">${a.mail}</a></p>`).join('')}
    </div>
    <div>
      <h2>Akorimmo</h2>
      <ul class="liste-simple"><li><a href="${AGENCE.site}">Akorimmo.com</a></li><li><a href="/contact/">Nous contacter</a></li><li><a href="/alerte/">Alerte e-mail</a></li></ul>
    </div>
  </div>
  <div class="conteneur">${autresSites(site)}</div>
  <div class="conteneur pied-bas">
    <span>© ${new Date().getFullYear()} ${esc(site.nom)} · Akorimmo</span>
    <span><a href="${AGENCE.mentions}" rel="noopener">Mentions légales</a> · <a href="${AGENCE.honoraires}" rel="noopener">Barème d’honoraires</a> · Annonces mises à jour le ${esc(site.maj)}</span>
  </div>
</footer>`;
}

// ------------------------------------------------------------------ éléments
export function carteBien(b, site) {
  const p = b.photos[0];
  const faits = [
    b.surface ? `<li>${ICON.surf}${m2(b.surface)}</li>` : '',
    b.pieces ? `<li>${ICON.door}${b.pieces} pièce${b.pieces > 1 ? 's' : ''}</li>` : '',
    b.chambres ? `<li>${ICON.bed}${b.chambres} ch.</li>` : '',
  ].join('');
  return `<article class="carte-bien" data-ville="${esc(b.ville)}" data-prix="${b.prix ?? ''}" data-surface="${b.surface ?? ''}" data-pieces="${b.pieces ?? ''}" data-chambres="${b.chambres ?? ''}">
  <a href="${urlBien(b)}" class="carte-lien">
    <div class="carte-photo">${p ? `<img src="${esc(p)}" alt="${esc(b.titre)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : '<div class="sans-photo">Photo à venir</div>'}
      ${b.nouveau ? '<span class="pastille">Nouveau</span>' : ''}</div>
    <div class="carte-texte">
      <p class="carte-prix">${euros(b.prix)}</p>
      <h3>${esc(b.titre)}</h3>
      <p class="carte-ville">${ICON.pin}${esc(b.ville)}${b.cp ? ` <span>(${esc(b.cp)})</span>` : ''}</p>
      <ul class="faits">${faits}</ul>
    </div>
  </a>
  <a class="carte-info" href="${mailInfo(b, site)}">${ICON.mail}Demander plus d’informations</a>
</article>`;
}

/** Lien mailto « Demander plus d'informations » vers contact@akorimmo.com */
export function mailInfo(b, site) {
  const ref = b.reference || b.id;
  const sujet = `Demande d'informations – ${b.titre} (réf. ${ref})`;
  const corps = `Bonjour,\n\nJe souhaite recevoir plus d'informations sur ce bien :\n${b.titre}\nRéférence : ${ref}\nPrix : ${euros(b.prix)}\nVille : ${b.ville}\nAnnonce : https://${site.domaine}${urlBien(b)}`;
  return `mailto:${AGENCE.mail1}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
}

/** Budgets maximum proposés (de 150 000 € en 150 000 € jusqu'à 1 000 000 €, puis « 1 000 000 € et plus ») */
export const BUDGETS = [150000, 300000, 450000, 600000, 750000, 900000, 1000000];

/** Les 2 menus déroulants des anciens sites : villes (cases à cocher) + budget max */
export function recherche(villes, { action = '/biens/', id = 'recherche', bouton = 'Rechercher', compteurs = {} } = {}) {
  return `<form class="recherche" id="${id}" action="${action}" method="get" role="search" aria-label="Rechercher un bien">
  <div class="multi" data-multi>
    <span class="champ-titre" id="${id}-villes-titre">Villes ou villages</span>
    <button type="button" class="multi-bouton" aria-haspopup="true" aria-expanded="false" aria-labelledby="${id}-villes-titre ${id}-villes-valeur"><span id="${id}-villes-valeur">Toutes les villes</span></button>
    <div class="multi-liste" hidden>
      ${villes.length > 12 ? `<input type="search" class="multi-recherche" placeholder="Taper le nom d’une ville…" aria-label="Rechercher une ville" autocomplete="off">` : ''}
      ${villes.map((v) => `<label><input type="checkbox" name="ville" value="${esc(v)}"> ${esc(v)}${compteurs[v] ? `<span class="nb">${compteurs[v]}</span>` : ''}</label>`).join('\n      ')}
      <div class="multi-actions"><button type="button" data-tout>Tout effacer</button><button type="button" data-fermer>Valider</button></div>
    </div>
  </div>
  <label><span>Budget maximum</span><select name="budget"><option value="">Indifférent</option>${BUDGETS.map((n) => `<option value="${n}">${euros(n)}</option>`).join('')}<option value="1000000+">1 000 000 € et plus</option></select></label>
  <button class="bouton" type="submit">${esc(bouton)}</button>
</form>`;
}

export const grille = (biens, site) => `<div class="grille-biens">${biens.map((b) => carteBien(b, site)).join('\n')}</div>`;

export function bandeauSites(site) {
  const autres = GROUPE.filter((g) => g.id !== site.id);
  return `<section class="section section-sites">
  <div class="conteneur">
    <h2 class="titre-section">Nos sites spécialisés</h2>
    <p class="intro-section">Des portails dédiés à chaque type de bien, avec des annonces en grande partie exclusives sur la Côte d’Azur.</p>
    <div class="grille-sites">${autres.map((g) => `<a class="site-groupe" href="${g.url}"><strong>${g.nom}</strong><span>${g.texte}</span></a>`).join('')}</div>
  </div>
</section>`;
}

export function bandeauContact(site, titre = 'Un projet ? Parlons-en.') {
  return `<section class="section bandeau-contact">
  <div class="conteneur bandeau-in">
    <div><h2>${esc(titre)}</h2><p>Nos conseillers vous répondent du lundi au samedi.</p></div>
    <div class="bandeau-actions">
      ${AGENCE.agences.map((a) => `<a class="bouton bouton-clair" href="${tel(a.tel)}">${ICON.phone}${a.tel}</a>`).join('')}
      <a class="bouton bouton-contour-clair" href="/contact/">Écrire à l’agence</a>
    </div>
  </div>
</section>`;
}

export function enteteSimple(titre, sousTitre = '', fil = []) {
  return `<section class="entete-page">
  <div class="conteneur">
    ${fil.length ? `<nav class="fil" aria-label="Fil d’Ariane"><a href="/">Accueil</a>${fil.map(([h, t]) => (h ? ` / <a href="${h}">${esc(t)}</a>` : ` / <span>${esc(t)}</span>`)).join('')}</nav>` : ''}
    <h1>${esc(titre)}</h1>
    ${sousTitre ? `<p>${esc(sousTitre)}</p>` : ''}
  </div>
</section>`;
}

export function champsHonneypot() {
  return '<p class="cache" aria-hidden="true"><label>Ne pas remplir : <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>';
}

export function formulaire(nom, contenu, bouton = 'Envoyer') {
  return `<form class="formulaire" name="${nom}" method="POST" action="/merci/" data-netlify="true" netlify-honeypot="bot-field">
  <input type="hidden" name="form-name" value="${nom}">
  ${champsHonneypot()}
  ${contenu}
  <p class="rgpd">Vos coordonnées servent uniquement à répondre à votre demande. Elles ne sont jamais cédées.</p>
  <button class="bouton" type="submit">${esc(bouton)}</button>
</form>`;
}

export const champ = (nom, label, type = 'text', opts = {}) => {
  const req = opts.requis ? ' required' : '';
  const id = `f-${nom}`;
  if (type === 'textarea') return `<label class="champ${opts.large ? ' large' : ''}" for="${id}"><span>${esc(label)}${opts.requis ? ' *' : ''}</span><textarea id="${id}" name="${nom}" rows="${opts.large ? 6 : 4}"${req}>${opts.valeur || ''}</textarea></label>`;
  if (type === 'select') return `<label class="champ" for="${id}"><span>${esc(label)}</span><select id="${id}" name="${nom}"${req}>${opts.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select></label>`;
  return `<label class="champ${opts.large ? ' large' : ''}" for="${id}"><span>${esc(label)}${opts.requis ? ' *' : ''}</span><input id="${id}" type="${type}" name="${nom}"${opts.auto ? ` autocomplete="${opts.auto}"` : ''}${req}></label>`;
};

/** Bloc « nos deux agences » (page Contact, fiches…) */
export function blocAgences() {
  return `<div class="agences">${AGENCE.agences.map((a) => `<div class="agence">
      <h3>${AGENCE.nom} – ${esc(a.nom.replace('Agence ', ''))}</h3>
      <p>${ICON.pin}${esc(a.rue)} – ${a.cp} ${a.ville}</p>
      <p><a href="${tel(a.tel)}">${ICON.phone}${a.tel}</a></p>
      <p><a href="mailto:${a.mail}">${ICON.mail}${a.mail}</a></p>
    </div>`).join('')}</div>`;
}

export { esc, markdown, texte, ICON, tel, m2 };
