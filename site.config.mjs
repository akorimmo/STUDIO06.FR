// Réglages du site www.studio06.fr — modifiables sans toucher au reste.
export default {
  id: 'studio06',
  domaine: 'www.studio06.fr',
  nom: 'Studio06',
  logo: ['Studio', '06'],
  slogan: 'Studios et petites surfaces à vendre à Nice et sur la Côte d’Azur',
  // Agent : recherche « A vendre » + type « Appartement » sur akorimmo.com,
  // puis on ne garde que les biens d'une seule pièce (studios / 1 pièce).
  agent: {
    types: ['Appartement'],
    filtre: (b) => b.pieces === 1 || (b.pieces == null && /\bstudio\b/i.test(b.titre) && !/pi[eè]ces/i.test(b.titre)),
  },
  bien: { singulier: 'studio', pluriel: 'studios', article: 'un studio' },
  filtres: { pieces: false, chambres: false },
  couleurs: { accent: '#0d6f7c', accent2: '#e9a93a', fond: '#f6f4ef', encre: '#14262b' },
  secteurs: ['nice', 'nice-carre-dor', 'nice-promenade-des-anglais', 'nice-cimiez', 'nice-mont-boron', 'nice-nord', 'nice-ouest', 'nice-st-pancrace', 'nice-st-pierre-de-feric', 'aspremont', 'falicon', 'arriere-pays', 'saint-laurent-du-var-a-villeneuve-loubet', 'villefranche-sur-mer-a-menton', 'antibes-a-cannes', 'var'],
  communes: ['06'],
};
