# www.maison83.com — mise en ligne sur Netlify

Ce dossier contient le site complet **www.maison83.com** et son **agent** qui récupère
automatiquement sur www.akorimmo.com les maisons à vendre situées dans le Var : position GPS de chaque fiche comparée au contour du département (recherche cartographique), code postal 83 en contrôle.

## Contenu du dossier

| Élément | Rôle |
|---|---|
| `public/` | Le site prêt à publier (déjà rempli avec les annonces du 23 octobre 2026) |
| `agent/` | L'agent (akorimmo.mjs) et le générateur de pages |
| `content/` | Les textes du site (accueil, à propos, estimation, contact, secteurs) — modifiables dans le Bloc-notes |
| `site.config.mjs` | Nom, couleurs, filtre de l'agent, secteurs affichés |
| `data/annonces.json` | Dernières annonces récupérées (sert de secours si akorimmo est injoignable) |
| `netlify.toml`, `netlify/functions/` | Réglages Netlify et mise à jour automatique quotidienne |
| `mettre-a-jour.bat` | Mise à jour manuelle depuis votre PC (nécessite Node.js) |

## Option A — en ligne en 2 minutes (glisser-déposer)

1. Ouvrez https://app.netlify.com/drop (connecté à votre compte Netlify).
2. Glissez le dossier **`public`** (et lui seul) dans la zone de dépôt.
3. Le site est en ligne sur une adresse provisoire `xxx.netlify.app`.

Les annonces sont alors figées à la date du dépôt. Pour les rafraîchir :
double-cliquez sur `mettre-a-jour.bat` (Node.js doit être installé : https://nodejs.org),
puis dans Netlify, onglet **Deploys**, glissez à nouveau le dossier `public`.

## Option B — recommandée : mise à jour automatique chaque jour

L'agent tourne alors sur les serveurs de Netlify : chaque matin il relit
akorimmo.com, ajoute les nouveaux biens, retire les biens vendus et met les prix à jour.

1. Créez un dépôt GitHub (gratuit) pour ce site et déposez-y **tout ce dossier**
   (par exemple avec GitHub Desktop, ou « Add file > Upload files » sur github.com).
2. Dans Netlify : **Add new site > Import an existing project > GitHub**, choisissez le dépôt.
   Les réglages sont lus automatiquement dans `netlify.toml` (rien à saisir) → **Deploy**.
3. Mise à jour quotidienne : **Site configuration > Build & deploy > Build hooks > Add build hook**
   (nom : « akorimmo »), copiez l'adresse obtenue, puis **Site configuration > Environment variables >
   Add a variable** : nom `BUILD_HOOK_URL`, valeur = l'adresse copiée. Redéployez une fois.
   La fonction `mise-a-jour-quotidienne` relance alors le site tous les jours à 6 h (UTC).

(Alternative sans GitHub : dans ce dossier, `npx netlify-cli deploy --build --prod`.)

## Après la mise en ligne (A ou B)

- **Formulaires** (contact, estimation, alerte e-mail, demande sur un bien) :
  Netlify > **Forms** > *Enable form detection*, puis redéployez.
  Ensuite **Forms > Form notifications > Add notification > Email** → contact@akorimmo.com.
- **Nom de domaine** : **Domain management > Add a domain** → `www.maison83.com`.
  Chez votre registraire : enregistrement `CNAME` pour `www` vers l'adresse `xxx.netlify.app`,
  et enregistrement `A` du domaine nu vers `75.2.60.5`. Le HTTPS est activé automatiquement.
- Les anciennes adresses (`/fr/...`, anciennes fiches de biens, autres langues) sont
  redirigées vers les nouvelles pages pour conserver le référencement Google.

## Modifier le site

- Textes : fichiers de `content/` (le haut de chaque fichier contient titre et description Google).
- Couleurs, secteurs, filtre de l'agent : `site.config.mjs`.
- Après modification : `mettre-a-jour.bat` (option A) ou envoi sur GitHub (option B).

Le site est entièrement statique (aucune base de données, aucun espace
d'administration en ligne) : il n'offre pratiquement aucune prise aux attaques
qui ont conduit à la suppression des anciens sites.
