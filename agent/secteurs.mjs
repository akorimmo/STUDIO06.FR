// Secteurs géographiques et règles d'affectation des annonces.
// Une annonce est rattachée à un secteur d'après sa ville et les mots-clés
// présents dans son titre / son en-tête / le début de sa description.

const norm = (s = '') => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, ' ').replace(/[-_]/g, ' ');
const villeIn = (b, list) => list.map(norm).includes(norm(b.ville));
const texte = (b) => norm(`${b.titre} ${b.entete} ${(b.description || '').slice(0, 400)}`);
const motCle = (b, list) => { const t = texte(b); return list.some((k) => t.includes(norm(k))); };
const estNice = (b) => villeIn(b, ['Nice']);

const LITTORAL_OUEST = ['Antibes', 'Juan-les-Pins', 'Cannes', 'Le Cannet', 'Vallauris', 'Golfe-Juan', 'Biot', 'Mandelieu-la-Napoule', 'Théoule-sur-Mer', 'Mougins', 'Valbonne', 'Mouans-Sartoux', 'Grasse', 'Châteauneuf-Grasse', 'Opio', 'Pégomas', 'Magagnosc'];
const ST_LAURENT = ['Saint-Laurent-du-Var', 'Cagnes-sur-Mer', 'Villeneuve-Loubet', 'La Gaude', 'Saint-Jeannet', 'Vence', 'Saint-Paul-de-Vence', 'La Colle-sur-Loup', 'Gattières', 'Carros'];
const EST = ['Villefranche-sur-Mer', 'Beaulieu-sur-Mer', 'Saint-Jean-Cap-Ferrat', 'Èze', 'Cap-d\'Ail', 'Beausoleil', 'La Turbie', 'Roquebrune-Cap-Martin', 'Menton', 'Gorbio', 'Sainte-Agnès'];
const FREJUS = ['Fréjus', 'Saint-Raphaël', 'Les Adrets-de-l\'Estérel', 'Puget-sur-Argens', 'Roquebrune-sur-Argens', 'Les Issambres', 'Saint-Aygulf', 'Agay', 'Bagnols-en-Forêt'];
const ST_TROPEZ = ['Saint-Tropez', 'Gassin', 'Ramatuelle', 'Cogolin', 'Grimaud', 'Sainte-Maxime', 'La Croix-Valmer', 'Cavalaire-sur-Mer', 'Le Plan-de-la-Tour', 'La Garde-Freinet', 'La Môle', 'Rayol-Canadel-sur-Mer'];
const TOULON = ['Toulon', 'La Seyne-sur-Mer', 'Six-Fours-les-Plages', 'Sanary-sur-Mer', 'Bandol', 'Ollioules', 'La Valette-du-Var', 'La Garde', 'Le Pradet', 'Carqueiranne', 'Saint-Mandrier-sur-Mer', 'Le Revest-les-Eaux', 'La Farlède', 'Solliès-Pont', 'Solliès-Toucas', 'Solliès-Ville', 'Évenos', 'Le Beausset', 'Le Castellet', 'La Cadière-d\'Azur', 'Saint-Cyr-sur-Mer', 'Signes', 'Belgentier'];
const HYERES = ['Hyères', 'La Crau', 'La Londe-les-Maures', 'Bormes-les-Mimosas', 'Le Lavandou', 'Collobrières', 'Pierrefeu-du-Var', 'Cuers', 'Puget-Ville'];
const FAYENCE = ['Fayence', 'Seillans', 'Montauroux', 'Callian', 'Tourrettes', 'Tanneron', 'Mons', 'Saint-Paul-en-Forêt'];
const DRACENIE = ['Draguignan', 'Les Arcs', 'Le Muy', 'Trans-en-Provence', 'Lorgues', 'Flayosc', 'Vidauban', 'Taradeau', 'Figanières', 'Callas', 'Bargemon', 'Claviers', 'Ampus', 'Châteaudouble', 'La Motte', 'Montferrat', 'Le Cannet-des-Maures', 'Le Luc', 'Le Thoronet'];

export const SECTEURS = {
  'antibes-a-cannes': { nom: 'Antibes à Cannes', test: (b) => villeIn(b, LITTORAL_OUEST) },
  'arriere-pays': {
    nom: 'Arrière-pays niçois',
    test: (b) => String(b.cp).startsWith('06') && !estNice(b) && !villeIn(b, [...LITTORAL_OUEST, ...ST_LAURENT, ...EST, 'Aspremont', 'Falicon']),
  },
  aspremont: { nom: 'Aspremont', test: (b) => villeIn(b, ['Aspremont']) },
  falicon: { nom: 'Falicon', test: (b) => villeIn(b, ['Falicon']) },
  nice: { nom: 'Nice', test: estNice },
  'nice-carre-dor': { nom: 'Nice Carré d\'Or', test: (b) => estNice(b) && motCle(b, ['carré d\'or', 'carre d or', 'masséna', 'jean médecin', 'wilson', 'musiciens', 'rue de france', 'buffa', 'victor hugo', 'gambetta', 'centre-ville', 'centre ville']) },
  'nice-cimiez': { nom: 'Nice Cimiez', test: (b) => estNice(b) && motCle(b, ['cimiez', 'régina', 'brancolar']) },
  'nice-mont-boron': { nom: 'Nice Mont Boron', test: (b) => estNice(b) && motCle(b, ['mont boron', 'mont-boron']) },
  'nice-nord': { nom: 'Nice Nord', test: (b) => estNice(b) && motCle(b, ['nice nord', 'gairaut', 'las planas', 'saint-sylvestre', 'saint sylvestre', 'pessicart', 'rimiez', 'borriglione', 'libération', 'comte de falicon', 'cessole', 'ariane', 'saint-maurice']) },
  'nice-ouest': { nom: 'Nice Ouest', test: (b) => estNice(b) && motCle(b, ['nice ouest', 'fabron', 'caucade', 'saint-isidore', 'lanterne', 'magnan', 'arénas', 'californie', 'saint-augustin', 'bellet', 'ferber', 'crémat', 'saint-antoine']) },
  'nice-promenade-des-anglais': { nom: 'Nice Promenade des Anglais', test: (b) => estNice(b) && motCle(b, ['promenade des anglais', 'bord de mer', 'front de mer', 'face mer', 'pieds dans l\'eau']) },
  'nice-st-pancrace': { nom: 'Nice Saint-Pancrace', test: (b) => estNice(b) && motCle(b, ['pancrace']) },
  'nice-st-pierre-de-feric': { nom: 'Nice Saint-Pierre de Féric', test: (b) => estNice(b) && motCle(b, ['féric', 'feric']) },
  'saint-laurent-du-var-a-villeneuve-loubet': { nom: 'Saint-Laurent-du-Var à Villeneuve-Loubet', test: (b) => villeIn(b, ST_LAURENT) },
  var: { nom: 'Var', test: (b) => String(b.cp).startsWith('83') },
  'villefranche-sur-mer-a-menton': { nom: 'Villefranche-sur-Mer à Menton', test: (b) => villeIn(b, EST) },
  'frejus-saint-raphael': { nom: 'Fréjus – Saint-Raphaël', test: (b) => villeIn(b, FREJUS) },
  // Secteurs du Var (maison83.com)
  'golfe-de-saint-tropez': { nom: 'Golfe de Saint-Tropez', test: (b) => villeIn(b, ST_TROPEZ) },
  'toulon-et-littoral-ouest': { nom: 'Toulon, Bandol et Sanary', test: (b) => villeIn(b, TOULON) },
  'hyeres-bormes-le-lavandou': { nom: 'Hyères, Bormes et Le Lavandou', test: (b) => villeIn(b, HYERES) },
  'pays-de-fayence': { nom: 'Pays de Fayence', test: (b) => villeIn(b, FAYENCE) },
  dracenie: { nom: 'Draguignan et la Dracénie', test: (b) => villeIn(b, DRACENIE) },
  'centre-var-verdon': {
    nom: 'Centre Var et Verdon',
    test: (b) => String(b.cp).startsWith('83') && !villeIn(b, [...FREJUS, ...ST_TROPEZ, ...TOULON, ...HYERES, ...FAYENCE, ...DRACENIE]),
  },
};

// Contour simplifié du département du Var (lng, lat) pour la recherche cartographique.
export const CONTOUR_VAR = [
  [5.672, 43.178], [5.760, 43.300], [5.700, 43.420], [5.690, 43.560], [5.760, 43.640], [5.780, 43.720],
  [5.960, 43.760], [6.170, 43.800], [6.380, 43.790], [6.560, 43.810], [6.680, 43.790], [6.780, 43.720],
  [6.870, 43.640], [6.910, 43.560], [6.935, 43.480], [6.880, 43.410], [6.760, 43.360], [6.690, 43.250],
  [6.600, 43.160], [6.400, 43.120], [6.200, 43.020], [6.150, 42.980], [5.900, 43.040], [5.780, 43.080],
];

export function dansPolygone([x, y], poly) {
  let dedans = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]; const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
}

/**
 * Recherche cartographique : vrai si la position GPS du bien tombe dans le
 * contour du Var. Le code postal sert d'arbitre près des limites du
 * département (contour simplifié) et quand la fiche n'a pas de coordonnées.
 */
export function estDansLeVar(b) {
  const cp = String(b.cp || '');
  if (b.lat != null && b.lng != null && dansPolygone([b.lng, b.lat], CONTOUR_VAR)) {
    return !/^(06|04|13|84)/.test(cp);
  }
  return cp.startsWith('83');
}

export { norm };
