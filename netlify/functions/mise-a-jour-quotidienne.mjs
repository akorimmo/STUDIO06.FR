// Fonction planifiée Netlify : chaque matin, elle relance la construction du
// site. La construction exécute l'agent, qui va relire les annonces sur
// akorimmo.com : nouveaux biens ajoutés, biens vendus retirés, prix mis à jour.
//
// À faire une seule fois dans Netlify :
//   Site configuration > Build & deploy > Build hooks > « Add build hook »
//   puis copier l'adresse obtenue dans une variable d'environnement
//   nommée BUILD_HOOK_URL (Site configuration > Environment variables).
export default async () => {
  const hook = process.env.BUILD_HOOK_URL;
  if (!hook) {
    console.log('BUILD_HOOK_URL non définie : mise à jour automatique désactivée.');
    return new Response('BUILD_HOOK_URL manquante', { status: 200 });
  }
  const r = await fetch(hook, { method: 'POST', body: '{}' });
  console.log(`Reconstruction demandée à Netlify : HTTP ${r.status}`);
  return new Response('ok');
};

// Tous les jours à 6 h 00 (heure UTC, soit 7 h ou 8 h à Paris).
export const config = { schedule: '0 6 * * *' };
