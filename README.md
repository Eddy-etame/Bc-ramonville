# Boxing Center Ramonville

Site de la salle Boxing Center de Ramonville-Saint-Agne (ramonville.boxingcenter.fr), construit avec [Astro](https://astro.build/). Les pages sont statiques ; trois fonctions serverless tournent à côté sur Vercel (l'assistant, les contacts, le backoffice).

## Commandes

```bash
npm install       # installer les dépendances
npm run dev       # serveur de développement (http://localhost:4321)
npm run build     # pose le calque du vestiaire, puis build dans dist/
npm run preview   # prévisualiser le build
npm run content   # poser le calque seul (sans rebuild)
```

> `npm run build` lance d'abord `scripts/content.mjs`, qui écrit ce que le staff a publié
> (`src/content.json`) dans le bloc `@vestiaire` de `public/assets/js/data.js`. Sans ce fichier,
> le bloc reste vide et `data.js` parle seul — c'est le cas normal.

## Structure

- `src/pages/` — une page Astro par route (HTML de la maquette, scripts et styles en `is:inline`)
- `public/assets/` — CSS, JS et images de la maquette
- `public/assets/js/data.js` — **la source de vérité** : adresse, horaires, disciplines, coachs, planning, tarifs, réseau
- `public/admin/` — « Le vestiaire », le backoffice (hors du routage Astro)
- `api/` — les fonctions serverless

---

## L'assistant du site

La pastille en bas à droite ouvre une vraie conversation (`public/assets/js/chatbot.js`).
Le bot se présente, demande le prénom, puis répond — et capte au vol le prénom, l'email,
le téléphone et la salle évoquée quand le visiteur les donne. Dès qu'il y a de quoi
rappeler quelqu'un, la fiche part vers `/api/lead`.

Le profil est rangé dans le `sessionStorage` de l'onglet : un visiteur qui donne son
prénom sur une page et son numéro sur une autre reste **une seule personne** pour le staff.

**Sans JavaScript**, la pastille reste ce qu'elle était : un lien `tel:` vers la salle.

### Les fournisseurs d'IA (tous optionnels)

`api/chat.js` essaie dans l'ordre, et saute ce qui échoue :

| Variable | Effet |
| --- | --- |
| `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, … | pool de clés Gemini, tirées au sort, les mortes sont sautées |
| `GEMINI_MODEL` | par défaut `gemini-2.5-flash` |
| `GROQ_API_KEY` / `GROQ_MODEL` | repli n°2 |
| `MISTRAL_API_KEY` / `MISTRAL_MODEL` | repli n°3 |

**Aucune clé configurée n'est pas une panne** : le bot répond alors depuis la base de
connaissance locale (`public/assets/js/chatbot-kb.js`), ancrée sur les mêmes faits.
Il reste utile, il ne rend jamais une page morte.

Les faits injectés dans le prompt sont **construits depuis `data.js`** (voir
`api/_lib/salle.js`) : si le planning change sur le site, le bot change avec lui.

---

## Où atterrissent les contacts

`api/lead.js` écrit vers **trois sorties, toutes optionnelles**. Sans aucune configuration,
la fonction répond quand même `200` et journalise la fiche — un service absent ne fait
jamais perdre un contact, et ne casse jamais le parcours du visiteur.

### 1. Le registre — pour relire les contacts dans le vestiaire

| Variable | Valeur |
| --- | --- |
| `KV_REST_API_URL` | l'URL REST du store |
| `KV_REST_API_TOKEN` | son jeton |

C'est du Redis REST appelé en `fetch` — **aucune dépendance npm**. Sur Vercel : Storage →
Upstash Redis (offre gratuite suffisante) ; les deux variables sont injectées
automatiquement dans le projet. C'est la **seule** sortie qui permet de relire les contacts
dans « Le vestiaire » ; sans elle, l'écran Contacts le dit franchement au lieu d'afficher
une liste vide.

### 2. L'e-mail au staff

| Variable | Valeur |
| --- | --- |
| `RESEND_API_KEY` | clé [Resend](https://resend.com) (offre gratuite) |
| `LEAD_TO` | destinataire — défaut `boxingcenter31@gmail.com` |
| `LEAD_FROM` | expéditeur vérifié chez Resend |

### 3. Le webhook

| Variable | Valeur |
| --- | --- |
| `LEAD_WEBHOOK_URL` | le JSON brut de la fiche y est posté (CRM, Zapier, Slack…) |

### 4. Le journal — toujours actif

Chaque fiche est écrite avec le préfixe `[lead]` dans les logs de la fonction
(Vercel → Deployments → Functions). C'est la sortie de dernier recours.

---

## Le vestiaire (backoffice)

`/admin/` — hors du routage Astro, `noindex`. Le staff y modifie les coordonnées, les
tarifs, les coachs et le planning, et relit les contacts.

| Variable | Effet |
| --- | --- |
| `ADMIN_TOKEN` | **obligatoire** — le mot de passe du staff. Sans lui, la porte reste fermée et le dit. |
| `GITHUB_TOKEN` | permet de publier (commit de `src/content.json`) |
| `GITHUB_REPO` | ex. `compte/bc-ramonville` |
| `GITHUB_BRANCH` | défaut `main` |
| `VERCEL_DEPLOY_HOOK` | déclenche la reconstruction après publication (recommandé) |

Le vestiaire n'écrit jamais dans le site : il écrit un **calque** (`src/content.json`) qui
surcharge `data.js` au build, champ par champ. Une case qu'on ne touche pas n'entre pas
dans le calque — on ne peut donc pas vider une page par mégarde.

Aucun secret ne vit dans le front : le mot de passe est envoyé en en-tête `x-admin-token`
et comparé côté serveur en temps constant.

**Pas d'aperçu, volontairement** : le site est statique, un aperçu fidèle demanderait une
reconstruction — c'est-à-dire exactement ce que fait « Publier ». Plutôt qu'un bouton qui
montrerait autre chose que la vérité, le vestiaire dit que les cases *sont* le résultat.

Une visite guidée se lance à la première connexion, et quatre assistants pas à pas
(changer un horaire, corriger un tarif, déplacer un créneau, mettre à jour un coach)
attendent sur l'écran d'accueil. `Échap` quitte le guide à tout moment.

---

## Déploiement

Importer le repo dans Vercel — Astro est détecté (build `npm run build`, sortie `dist/`),
et les fichiers de `api/` deviennent des fonctions serverless sans configuration.

`vercel.json` porte les en-têtes de sécurité (HSTS, CSP, X-Frame-Options…). La CSP autorise
`connect-src 'self'`, ce qui couvre `/api/chat` et `/api/lead`. Ne pas le supprimer.

---

## Mise en ligne (Vercel)

1. **Importer** — Vercel → *Add New Project* → importe `Bc-ramonville`. Le framework (Astro) est détecté tout seul : rien à configurer.
2. **Variables d'environnement** — copie celles de [`.env.example`](.env.example) dans *Settings → Environment Variables*. Toutes sont facultatives : sans elles le site tourne, en mode dégradé honnête (l'assistant répond depuis sa base locale, les contacts partent dans les logs, le vestiaire explique ce qui lui manque au lieu de casser).
3. **Domaine** — branche `ramonville.boxingcenter.fr` dans *Settings → Domains*.
4. **Vérifier les en-têtes** — une fois en ligne : `curl -I https://ramonville.boxingcenter.fr` doit montrer `strict-transport-security`, `x-content-type-options`, `x-frame-options`, `referrer-policy`, `permissions-policy` et `content-security-policy`. Ils ne s'activent que sur Vercel, jamais en local.

### La boutique
Les liens boutique pointent vers **`https://box-plus.vercel.app/`** (la nouvelle boutique Box-Plus).
Le jour où le domaine payant est en place, il n'y a qu'UN endroit à changer : `LINKS.boutique`
dans `public/assets/js/data.js` — tout le site, le maillage et le JSON-LD suivent.

### Sécurité
`.env` est ignoré par git ; aucun secret n'est présent dans le dépôt (vérifié). Les clés vivent
uniquement dans les variables d'environnement Vercel, jamais dans le front : l'admin s'authentifie
côté serverless, en comparaison à temps constant.

---

## Les en-têtes (`vercel.json`) — pourquoi ils sont écrits ainsi

> ⚠️ `vercel.json` est du JSON STRICT : **aucun commentaire**, aucune clé en trop.
> Vercel refuse le déploiement avec `should NOT have additional property`.
> Les explications vivent donc ici, pas dans le fichier.

- **CSP — `script-src 'self'`** : les trois libs d'animation étaient la seule raison d'autoriser
  `cdn.jsdelivr.net` ; elles sont désormais servies depuis `/assets/vendor/`. Un domaine tiers de
  moins autorisé à exécuter du script sur le site.
- **`/admin/` → `X-Robots-Tag: noindex`** : le vestiaire n'est pas une page du site. Une balise
  `<meta robots>` ne protège que si le robot ENTRE lire la page ; `robots.txt` l'empêche d'entrer
  mais pas d'indexer l'URL nue. L'en-tête, lui, voyage avec la réponse et couvre tout ce qui est
  servi sous `/admin/` — y compris `app.js` et `admin.css`, qui n'ont pas de `<head>`.
- **`/api/` → `X-Robots-Tag`** : même raison — ce sont des réponses, pas des documents.
- **`/assets/` et `/fonts/` → cache 1 an `immutable`** : ces fichiers sont versionnés (`?v=N` dans
  le balisage) ; quand ils changent, l'URL change, donc on peut les garder très longtemps.
