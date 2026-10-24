// Réglages du site www.maison83.com — modifiables sans toucher au reste.
import { estDansLeVar } from '../agent/secteurs.mjs';

export default {
  id: 'maison83',
  domaine: 'www.maison83.com',
  nom: 'Maison83',
  logo: ['Maison', '83'],
  slogan: 'Maisons et villas à vendre dans le Var, de l’Estérel à Bandol',
  // Agent : recherche « A vendre » + type « Maison » sur akorimmo.com, puis
  // recherche cartographique : on ne garde que les biens situés dans le Var
  // (position GPS dans le contour du département et code postal 83).
  agent: { types: ['Maison'], filtre: estDansLeVar },
  bien: { singulier: 'maison', pluriel: 'maisons et villas', article: 'une maison' },
  filtres: { pieces: true, chambres: true },
  couleurs: { accent: '#55632b', accent2: '#7a68a6', fond: '#f5f2ea', encre: '#1f2416' },
  secteurs: ['frejus-saint-raphael', 'golfe-de-saint-tropez', 'toulon-et-littoral-ouest', 'hyeres-bormes-le-lavandou', 'pays-de-fayence', 'dracenie', 'centre-var-verdon'],
  communes: ['83'],
};
