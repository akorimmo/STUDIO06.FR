// ---------------------------------------------------------------------------
// Construit le site dans le dossier public/ :
//   1. l'agent récupère les annonces sur akorimmo.com (sauf --hors-ligne),
//   2. les pages sont générées à partir de content/ et des annonces.
// Utilisation : node agent/build.mjs            (récupère puis construit)
//               node agent/build.mjs --hors-ligne (reconstruit avec data/annonces.json)
// ---------------------------------------------------------------------------
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { recupererAnnonces } from './akorimmo.mjs';
import { SECTEURS, norm } from './secteurs.mjs';
import { COMMUNES } from './communes.mjs';
import { frontMatter } from './markdown.mjs';
import {
  AGENCE, layout, grille, carteBien, bandeauSites, bandeauContact, enteteSimple, formulaire, champ,
  esc, markdown, texte, euros, urlBien, ICON, tel, m2, slugify, recherche, mailInfo, blocAgences,
} from './templates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data', 'annonces.json');
const site = (await import(pathToFileURL(path.join(ROOT, 'site.config.mjs')).href)).default;
const horsLigne = process.argv.includes('--hors-ligne') || process.env.AGENT === '0';
const log = (...a) => console.log(`[${site.nom}]`, ...a);

// ------------------------------------------------------------- 1. l'agent
async function lireJSON(f, def) { try { return JSON.parse(await fs.readFile(f, 'utf8')); } catch { return def; } }
const precedent = await lireJSON(DATA, { maj: null, biens: [] });
let donnees = precedent;

if (!horsLigne) {
  try {
    log('Agent : connexion à akorimmo.com…');
    const tous = await recupererAnnonces({ types: site.agent.types, log });
    const biens = tous.filter(site.agent.filtre);
    log(`Agent : ${biens.length} bien(s) retenu(s) pour ${site.domaine} sur ${tous.length} récupéré(s).`);
    if (!tous.length && precedent.biens.length) {
      log('Agent : aucune annonce reçue (site injoignable ou modifié ?) — on garde les annonces précédentes.');
    } else {
      donnees = { maj: new Date().toISOString(), source: 'https://akorimmo.com', biens };
      await fs.mkdir(path.dirname(DATA), { recursive: true });
      await fs.writeFile(DATA, JSON.stringify(donnees, null, 1));
    }
  } catch (e) {
    log(`Agent : échec (${e.message}) — construction avec les dernières annonces enregistrées.`);
  }
}

// ------------------------------------------------------- 2. préparation
const maj = donnees.maj ? new Date(donnees.maj) : new Date();
site.version = maj.getTime().toString(36);
site.majTexte = maj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
const il30j = Date.now() - 30 * 864e5;
const biens = donnees.biens
  .map((b) => ({ ...b, nouveau: b.publie && new Date(b.publie).getTime() > il30j }))
  .sort((a, b) => String(b.publie || '').localeCompare(String(a.publie || '')) || (b.prix || 0) - (a.prix || 0));

async function lireContenu(rel) {
  try { return frontMatter(await fs.readFile(path.join(ROOT, 'content', rel), 'utf8')); } catch { return { meta: {}, body: '' }; }
}
site.secteursActifs = site.secteurs.filter((s) => SECTEURS[s]).map((slug) => ({ slug, ...SECTEURS[slug] }));
for (const s of site.secteursActifs) {
  s.contenu = await lireContenu(`secteurs/${s.slug}.md`);
  s.biens = biens.filter(s.test);
}

await fs.rm(OUT, { recursive: true, force: true });
const ecrits = [];
function cheminsRelatifs(chemin, html) {
  if (!chemin.endsWith('/')) return html; // 404.html : servie à n'importe quelle adresse, on garde les chemins absolus
  const prof = chemin.split('/').filter(Boolean).length;
  const pre = prof ? '../'.repeat(prof) : './';
  return html.replace(/(href|src|action)="\/(?!\/)/g, `$1="${pre}`);
}
async function page(chemin, html) {
  html = cheminsRelatifs(chemin, html);
  const f = path.join(OUT, chemin.replace(/^\//, ''), chemin.endsWith('/') ? 'index.html' : '');
  await fs.mkdir(path.dirname(f), { recursive: true });
  await fs.writeFile(f, html);
  if (chemin.endsWith('/')) ecrits.push(chemin);
}
const B = site.bien;
const Maj = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const titreSite = (t) => (t.includes(site.nom) ? t : `${t} | ${site.nom}`);

// Villes proposées dans le menu déroulant (avec le nombre de biens)
function listeVilles(liste) { return [...new Set(liste.map((b) => b.ville))].sort((a, b) => a.localeCompare(b, 'fr')); }
// Toutes les communes du (des) département(s) du site + les villes des annonces
// (orthographe de l'annonce conservée pour que le filtre corresponde).
function villesSite(liste) {
  const vues = new Map(listeVilles(liste).map((v) => [norm(v), v]));
  for (const d of site.communes || []) for (const c of COMMUNES[d] || []) if (!vues.has(norm(c))) vues.set(norm(c), c);
  return [...vues.values()].sort((a, b) => a.localeCompare(b, 'fr'));
}
function compteVilles(liste) { const c = {}; for (const b of liste) c[b.ville] = (c[b.ville] || 0) + 1; return c; }

// ---------------------------------------------------------------- accueil
// Page d'accueil volontairement épurée : le logo (titre), puis une seule
// fenêtre où 3 biens défilent toutes les 5 secondes, en décalé.
{
  const { meta } = await lireContenu('accueil.md');
  const vitrine = biens.filter((b) => b.photos.length).slice(0, 30);
  const donnees = vitrine.map((b) => ({
    t: b.titre, p: euros(b.prix), v: b.ville, s: b.surface ? m2(b.surface) : '', n: b.pieces ? `${b.pieces} p.` : '',
    i: b.photos[0], u: urlBien(b).slice(1), m: mailInfo(b, site),
  }));
  const fente = (k) => {
    const b = vitrine[k];
    if (!b) return '';
    return `<article class="fente" data-fente="${k}">
      <a class="fente-lien" href="${urlBien(b)}"><span class="fente-photo"><img src="${esc(b.photos[0])}" alt="${esc(b.titre)}" referrerpolicy="no-referrer"></span>
      <span class="fente-texte"><strong class="fente-prix">${euros(b.prix)}</strong><span class="fente-titre">${esc(b.titre)}</span><span class="fente-ville">${esc(b.ville)}${b.surface ? ` · ${m2(b.surface)}` : ''}</span></span></a>
      <a class="fente-info" href="${mailInfo(b, site)}">Demander plus d’informations</a>
    </article>`;
  };
  const corps = `
<section class="vitrine" aria-label="Sélection de biens">
  <div class="conteneur">
    ${vitrine.length ? `<div class="fenetre" id="fenetre">${[0, 1, 2].map(fente).join('')}</div>
    <script type="application/json" id="vitrine-donnees">${JSON.stringify(donnees).replace(/</g, '\\u003c')}</script>`
    : `<p class="vide">Aucun ${esc(B.singulier)} n’est en vente en ce moment. <a href="/alerte/">Créez une alerte e-mail</a>.</p>`}
    ${recherche(villesSite(biens), { action: '/biens/', id: 'recherche-accueil', compteurs: compteVilles(biens) })}
  </div>
</section>`;
  await page('/', layout(site, {
    titre: meta.meta_title || `${site.nom} — ${site.slogan}`, description: meta.meta_description || site.slogan, chemin: '/', corps, image: vitrine[0]?.photos[0], actif: 'accueil', accueil: true,
    jsonld: { '@context': 'https://schema.org', '@type': 'RealEstateAgent', name: `${site.nom} by Akorimmo`, url: `https://${site.domaine}/`, telephone: AGENCE.tel1, email: AGENCE.mail1, address: { '@type': 'PostalAddress', streetAddress: '63 boulevard de Cessole', postalCode: '06100', addressLocality: 'Nice', addressCountry: 'FR' }, department: AGENCE.agences.slice(1).map((a) => ({ '@type': 'RealEstateAgent', name: `Akorimmo ${a.nom}`, telephone: a.tel, email: a.mail, address: { '@type': 'PostalAddress', streetAddress: a.rue, postalCode: a.cp, addressLocality: a.ville, addressCountry: 'FR' } })) },
  }));
}

// ------------------------------------------------------------- nos biens
function filtresHTML(liste, toutes = false) {
  return `${recherche(toutes ? villesSite(liste) : listeVilles(liste), { action: '', id: 'filtres', compteurs: compteVilles(liste) })}
<div class="filtres-bas barre-liste">
  <span class="compteur" id="compteur" aria-live="polite">${liste.length} bien${liste.length > 1 ? 's' : ''}</span>
  <label class="tri"><span class="cache">Trier par</span><select id="tri" aria-label="Trier par"><option value="date">Plus récents</option><option value="prix-asc">Prix croissant</option><option value="prix-desc">Prix décroissant</option><option value="surface-desc">Surface</option></select></label>
  <button type="button" class="bouton bouton-contour bouton-petit" id="voir-carte" aria-pressed="false">Afficher la carte</button>
</div>`;
}

function listePage(liste, introHTML = '', toutes = false) {
  return `<section class="section section-liste">
  <div class="conteneur">
    ${introHTML}
    ${liste.length ? `${filtresHTML(liste, toutes)}
    <div class="carte-liste" id="carte" hidden></div>
    ${grille(liste, site)}
    <p class="vide" id="aucun" hidden>Aucun bien ne correspond à ces critères. <a href="/alerte/">Créez une alerte e-mail</a> : nous vous prévenons dès qu’un bien correspond.</p>`
    : `<p class="vide">Aucun ${esc(B.singulier)} n’est disponible pour le moment. <a href="/alerte/">Créez une alerte e-mail</a> pour être prévenu en premier, ou <a href="/contact/">contactez-nous</a> : certains biens sont vendus hors publicité.</p>`}
  </div>
</section>`;
}

await page('/biens/', layout(site, {
  titre: titreSite(`${Maj(B.pluriel)} à vendre`), description: `${biens.length} ${B.pluriel} à vendre — ${site.slogan}.`, chemin: '/biens/', actif: 'biens', carte: true,
  corps: enteteSimple(`${Maj(B.pluriel)} à vendre`, `${biens.length} bien${biens.length > 1 ? 's' : ''} sélectionné${biens.length > 1 ? 's' : ''} par Akorimmo · mis à jour le ${site.majTexte}`, [[null, 'Nos biens']]) + listePage(biens, '', true) + bandeauContact(site, 'Vous ne trouvez pas votre bien ?'),
}));

// ------------------------------------------------------------ fiche bien
for (const b of biens) {
  const chemin = urlBien(b);
  const faits = [
    ['Prix', euros(b.prix)], b.surface && ['Surface', m2(b.surface)], b.pieces && ['Pièces', b.pieces], b.chambres && ['Chambres', b.chambres],
    b.sdb && ['Salles de bains', b.sdb], ['Ville', `${b.ville}${b.cp ? ` (${b.cp})` : ''}`], b.reference && ['Référence', b.reference],
  ].filter(Boolean);
  const proches = biens.filter((x) => x.id !== b.id && x.ville === b.ville).slice(0, 3);
  const autres = proches.length ? proches : biens.filter((x) => x.id !== b.id).slice(0, 3);
  const msg = `Bonjour, je souhaite obtenir des informations sur le bien « ${b.titre} » (réf. ${b.reference || b.id}). Merci de me recontacter.`;
  const corps = `
${enteteSimple(b.titre, `${b.entete || ''}`, [['/biens/', 'Nos biens'], [null, b.ville]])}
<section class="section fiche">
  <div class="conteneur fiche-grille">
    <div class="fiche-principale">
      <div class="galerie" data-galerie>
        ${b.photos.length ? `<button class="galerie-principale" type="button" data-index="0" aria-label="Agrandir la photo"><img src="${esc(b.photos[0])}" alt="${esc(b.titre)} — photo 1" referrerpolicy="no-referrer" fetchpriority="high"></button>
        <div class="galerie-vignettes">${b.photos.slice(0, 40).map((p, i) => `<button type="button" data-index="${i}" data-src="${esc(p)}" aria-label="Photo ${i + 1}"><img src="${esc(p)}" alt="" loading="lazy" referrerpolicy="no-referrer"></button>`).join('')}</div>` : '<div class="sans-photo grand">Photos à venir</div>'}
      </div>
      <h2 class="titre-bloc">Description</h2>
      <div class="prose description">${texte(b.description) || '<p>Description disponible sur demande auprès de l’agence.</p>'}</div>
      ${b.lat != null ? `<h2 class="titre-bloc">Situation</h2><div class="carte-fiche" id="carte-fiche" data-lat="${b.lat}" data-lng="${b.lng}" role="img" aria-label="Situation approximative du bien à ${esc(b.ville)}"></div><p class="note">Localisation approximative.</p>` : ''}
    </div>
    <aside class="fiche-cote">
      <div class="encadre">
        <p class="fiche-prix">${euros(b.prix)}</p>
        <dl class="fiche-faits">${faits.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <div class="fiche-actions">
          <a class="bouton bouton-large" href="${mailInfo(b, site)}">${ICON.mail}Demander plus d’informations</a>
          ${AGENCE.agences.map((a) => `<a class="bouton bouton-contour bouton-large" href="${tel(a.tel)}">${ICON.phone}${a.tel} <small>(${esc(a.nom.replace('Agence ', ''))})</small></a>`).join('')}
        </div>
        <p class="petit">Honoraires : voir notre <a href="${AGENCE.honoraires}" rel="noopener">barème</a>.</p>
      </div>
      <div class="encadre">
        <h2 class="titre-bloc">Ou laissez vos coordonnées</h2>
        ${formulaire('demande-bien', `
        <input type="hidden" name="bien" value="${esc(`${b.titre} — réf. ${b.reference || b.id}`)}">
        <input type="hidden" name="page" value="https://${site.domaine}${chemin}">
        ${champ('nom', 'Nom', 'text', { requis: true, auto: 'name' })}
        ${champ('email', 'E-mail', 'email', { requis: true, auto: 'email' })}
        ${champ('telephone', 'Téléphone', 'tel', { auto: 'tel' })}
        ${champ('message', 'Message', 'textarea', { valeur: msg, lignes: 4 })}`, 'Être recontacté')}
      </div>
    </aside>
  </div>
</section>
<section class="section section-proches"><div class="conteneur"><h2 class="titre-section">${proches.length ? `Autres biens à ${esc(b.ville)}` : 'À découvrir aussi'}</h2>${grille(autres, site)}</div></section>`;
  await page(chemin, layout(site, {
    titre: titreSite(`${b.titre} – ${euros(b.prix)}`),
    description: `${b.entete || b.titre} : ${[b.surface && m2(b.surface), b.pieces && `${b.pieces} pièce(s)`, euros(b.prix)].filter(Boolean).join(', ')}. ${(b.description || '').replace(/\s+/g, ' ').slice(0, 180)}`,
    chemin, corps, image: b.photos[0], carte: b.lat != null, actif: 'biens',
    jsonld: {
      '@context': 'https://schema.org', '@type': 'RealEstateListing', name: b.titre, url: `https://${site.domaine}${chemin}`,
      image: b.photos.slice(0, 6), datePosted: b.publie || undefined,
      offers: { '@type': 'Offer', price: b.prix, priceCurrency: 'EUR' },
      about: { '@type': b.typeSchema || 'Place', numberOfRooms: b.pieces || undefined, floorSize: b.surface ? { '@type': 'QuantitativeValue', value: b.surface, unitCode: 'MTK' } : undefined, address: { '@type': 'PostalAddress', addressLocality: b.ville, postalCode: b.cp || undefined, addressCountry: 'FR' } },
    },
  }));
}

// --------------------------------------------------------------- secteurs
// Toutes les communes, avec ou sans bien en vente : chacune ouvre la liste filtrée.
function grilleCommunes() {
  const nb = compteVilles(biens);
  const villes = villesSite(biens);
  if (!villes.length) return '';
  return `<section class="section section-communes"><div class="conteneur">
  <h2 class="titre-section">Toutes les villes et communes</h2>
  <p class="intro-section">${villes.length} villes et villages. Pas encore de bien dans votre commune ? <a href="/alerte/">Créez une alerte</a> ou <a href="/contact/">contactez-nous</a> : nous recherchons pour vous.</p>
  <ul class="grille-communes">${villes.map((v) => `<li><a href="/biens/?ville=${encodeURIComponent(v)}"${nb[v] ? ' class="avec-biens"' : ''}>${esc(v)}${nb[v] ? ` <span class="nb">${nb[v]}</span>` : ''}</a></li>`).join('')}</ul>
</div></section>`;
}

if (site.secteursActifs.length) {
  await page('/secteurs/', layout(site, {
    titre: titreSite(`Nos secteurs – ${Maj(B.pluriel)} à vendre`), description: `${Maj(B.pluriel)} à vendre par secteur : ${site.secteursActifs.map((s) => s.nom).join(', ')}.`, chemin: '/secteurs/', actif: 'secteurs',
    corps: enteteSimple('Nos secteurs', `Retrouvez nos ${B.pluriel} quartier par quartier.`, [[null, 'Secteurs']]) + `<section class="section"><div class="conteneur grille-secteurs">${site.secteursActifs.map((s) => {
      const p = s.biens.find((x) => x.photos.length)?.photos[0];
      return `<a class="tuile-secteur" href="/secteurs/${s.slug}/"${p ? ` style="--img:url('${esc(p)}')"` : ''}><strong>${esc(s.nom)}</strong><span>${s.biens.length} bien${s.biens.length > 1 ? 's' : ''}</span></a>`;
    }).join('')}</div></section>` + grilleCommunes() + bandeauContact(site),
  }));
  for (const s of site.secteursActifs) {
    const { meta, body } = s.contenu;
    const titre = meta.titre || `${Maj(B.pluriel)} à vendre – ${s.nom}`;
    const intro = body ? `<div class="prose secteur-texte">${markdown(body)}</div>` : `<div class="prose secteur-texte"><p>Découvrez notre sélection de ${esc(B.pluriel)} à vendre dans le secteur ${esc(s.nom)}. Notre équipe connaît chaque quartier : <a href="/contact/">contactez-nous</a> pour être tenu informé des nouveautés, y compris des biens vendus hors publicité.</p></div>`;
    await page(`/secteurs/${s.slug}/`, layout(site, {
      titre: meta.meta_title || titreSite(titre), description: meta.meta_description || `${Maj(B.pluriel)} à vendre : ${s.nom}. ${s.biens.length} bien(s) disponible(s).`,
      chemin: `/secteurs/${s.slug}/`, carte: s.biens.length > 0, actif: 'secteurs',
      corps: enteteSimple(titre, `${s.biens.length} bien${s.biens.length > 1 ? 's' : ''} dans ce secteur`, [['/secteurs/', 'Secteurs'], [null, s.nom]]) + listePage(s.biens, intro) + bandeauContact(site),
    }));
  }
}

// -------------------------------------------------------- pages de texte
async function pageTexte(fichier, chemin, actif, defTitre, apres = '') {
  const { meta, body } = await lireContenu(fichier);
  const titre = meta.titre && meta.titre.length < 90 ? meta.titre : defTitre;
  await page(chemin, layout(site, {
    titre: meta.meta_title || titreSite(defTitre), description: meta.meta_description || `${defTitre} – ${site.slogan}`, chemin, actif,
    corps: `${enteteSimple(titre, '', [[null, defTitre]])}<section class="section"><div class="conteneur texte-colonne prose">${markdown(body)}</div></section>${apres}`,
  }));
}

await pageTexte('a-propos.md', '/a-propos/', 'a-propos', 'À propos', bandeauContact(site));

const typesBien = { studio06: ['Studio', 'Appartement', 'Autre'], appartement06: ['Appartement', 'Studio', 'Maison', 'Autre'], commerce06: ['Fonds de commerce', 'Murs commerciaux', 'Droit au bail', 'Bureau', 'Local d’activité', 'Autre'], maison83: ['Maison', 'Villa', 'Propriété', 'Terrain', 'Autre'] }[site.id] || ['Appartement', 'Maison', 'Autre'];
await pageTexte('estimation.md', '/estimation/', 'estimation', 'Estimation', `
<section class="section section-formulaire" id="formulaire"><div class="conteneur texte-colonne">
  <h2 class="titre-section">Demande d’estimation offerte</h2>
  <p class="intro-section">Décrivez votre bien : un conseiller vous recontacte sous 48 h pour convenir d’un rendez-vous.</p>
  ${formulaire('estimation', `<div class="champs-2">
    ${champ('type', 'Type de bien', 'select', { options: typesBien })}
    ${champ('ville', 'Commune', 'text', { requis: true })}
    ${champ('surface', 'Surface (m²)', 'number')}
    ${champ('pieces', 'Nombre de pièces', 'number')}
    ${champ('nom', 'Nom', 'text', { requis: true, auto: 'name' })}
    ${champ('telephone', 'Téléphone', 'tel', { requis: true, auto: 'tel' })}
    ${champ('email', 'E-mail', 'email', { requis: true, auto: 'email', large: true })}
    ${champ('message', 'Précisions (adresse, étage, état, délai…)', 'textarea', { large: true })}</div>`, 'Demander mon estimation')}
</div></section>`);

{
  const { meta, body } = await lireContenu('contact.md');
  await page('/contact/', layout(site, {
    titre: meta.meta_title || titreSite('Contact'), description: meta.meta_description || `Contactez ${site.nom} by Akorimmo.`, chemin: '/contact/', actif: 'contact',
    corps: `${enteteSimple(meta.titre && meta.titre.length < 70 ? meta.titre : 'Contactez-nous', 'Une question, une visite, un projet de vente ? Nous vous répondons rapidement.', [[null, 'Contact']])}
<section class="section"><div class="conteneur contact-grille">
  <div>
    ${body ? `<div class="prose">${markdown(body)}</div>` : ''}
    <div class="encadre coordonnees">
      <h2 class="titre-bloc">Nos deux agences à Nice</h2>
      ${blocAgences()}
    </div>
  </div>
  <div class="encadre">
    <h2 class="titre-bloc">Écrivez-nous</h2>
    ${formulaire('contact', `${champ('nom', 'Nom', 'text', { requis: true, auto: 'name' })}
    ${champ('email', 'E-mail', 'email', { requis: true, auto: 'email' })}
    ${champ('telephone', 'Téléphone', 'tel', { auto: 'tel' })}
    ${champ('sujet', 'Votre projet', 'select', { options: ['Acheter', 'Vendre / faire estimer', 'Visiter un bien', 'Autre demande'] })}
    ${champ('message', 'Message', 'textarea', { requis: true })}`)}
  </div>
</div></section>`,
  }));
}

await page('/alerte/', layout(site, {
  titre: titreSite('Alerte e-mail'), description: `Recevez en avant-première les nouveaux ${B.pluriel} correspondant à vos critères.`, chemin: '/alerte/', actif: '',
  corps: `${enteteSimple('Alerte e-mail', `Soyez prévenu en premier des nouveaux ${B.pluriel} qui correspondent à votre recherche.`, [[null, 'Alerte e-mail']])}
<section class="section"><div class="conteneur texte-colonne">
  ${formulaire('alerte', `<div class="champs-2">
    ${champ('nom', 'Nom', 'text', { requis: true, auto: 'name' })}
    ${champ('email', 'E-mail', 'email', { requis: true, auto: 'email' })}
    ${champ('communes', 'Communes ou quartiers souhaités', 'text', { large: true, placeholder: 'Ex. : Nice Carré d’Or, Villefranche…' })}
    ${champ('budget', 'Budget maximum (€)', 'number')}
    ${champ('surface', 'Surface minimum (m²)', 'number')}
    ${champ('telephone', 'Téléphone (facultatif)', 'tel', { auto: 'tel' })}
    ${champ('precisions', 'Autres critères', 'textarea', { large: true, lignes: 3 })}</div>`, 'Créer mon alerte')}
</div></section>`,
}));

await page('/merci/', layout(site, {
  titre: titreSite('Merci'), description: 'Votre demande a bien été envoyée.', chemin: '/merci/',
  corps: `${enteteSimple('Merci, votre demande est bien partie', 'Un conseiller Akorimmo vous répond très rapidement.')}<section class="section"><div class="conteneur texte-colonne"><p><a class="bouton" href="/biens/">Revenir aux biens</a></p></div></section>`,
}));
await page('/404.html', layout(site, {
  titre: titreSite('Page introuvable'), description: 'Cette page n’existe pas ou plus.', chemin: '/404.html',
  corps: `${enteteSimple('Cette page n’existe plus', 'Le bien a peut-être été vendu. Découvrez nos autres biens disponibles.')}<section class="section"><div class="conteneur">${grille(biens.slice(0, 3), site)}<p style="margin-top:2rem"><a class="bouton" href="/biens/">Tous nos biens</a></p></div></section>`,
}));

// ------------------------------------------------- fichiers techniques
await fs.cp(path.join(ROOT, 'agent', 'assets'), path.join(OUT, 'assets'), { recursive: true });
await fs.copyFile(path.join(ROOT, 'logo.png'), path.join(OUT, 'assets', 'logo.png'));
const c = site.couleurs;
await fs.writeFile(path.join(OUT, 'assets', 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#000"/><text x="32" y="43" font-family="Arial,sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="#e2002e">${esc(site.logo[1])}</text></svg>`);
await fs.writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: https://${site.domaine}/sitemap.xml\n`);
await fs.writeFile(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ecrits.filter((u) => u !== '/merci/').map((u) => `<url><loc>https://${site.domaine}${u}</loc><lastmod>${maj.toISOString().slice(0, 10)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
await fs.writeFile(path.join(OUT, 'annonces.json'), JSON.stringify({ maj: donnees.maj, biens: biens.map(({ description, ...r }) => ({ ...r, page: urlBien(r) })) }));

// Redirections des anciennes adresses (ancien site Apimo) vers les nouvelles pages
const redir = [
  '# Anciennes adresses → nouvelles pages (301 = définitif)',
  '/fr              /                 301',
  '/fr/             /                 301',
  '/fr/contact      /contact/         301',
  '/fr/estimation   /estimation/      301',
  '/fr/vendre       /estimation/      301',
  '/fr/a-propos     /a-propos/        301',
  '/fr/agence       /a-propos/        301',
  '/fr/alerte*      /alerte/          301',
  '/fr/bulletin*    /alerte/          301',
  '/fr/nos-biens*   /biens/           301',
  '/fr/biens*       /biens/           301',
  '/fr/recherche*   /biens/           301',
  ...biens.map((b) => `${new URL(b.url).pathname.replace(/ /g, '%20')}  ${urlBien(b)}  301`),
  '/fr/propriete/*  /biens/           301',
  ...site.secteursActifs.flatMap((s) => [`/fr/${s.slug}      /secteurs/${s.slug}/  301`, `/fr/${s.slug}/*    /secteurs/${s.slug}/  301`]),
  '/fr/*            /                 301',
  ...['en', 'es', 'it', 'nl', 'ru'].map((l) => `/${l}/*          /                 301`),
];
await fs.writeFile(path.join(OUT, '_redirects'), redir.join('\n') + '\n');

log(`Site généré dans public/ : ${ecrits.length} pages, ${biens.length} biens (annonces du ${site.majTexte}).`);
