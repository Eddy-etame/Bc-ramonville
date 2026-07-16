# Boxing Center Ramonville

Site vitrine de la salle Boxing Center de Ramonville-Saint-Agne (ramonville.boxingcenter.fr), construit avec [Astro](https://astro.build/). Les pages reprennent la maquette validée à l'identique : HTML, CSS, JS et images sont servis tels quels, sans transformation.

## Commandes

```bash
npm install       # installer les dépendances
npm run dev       # serveur de développement (http://localhost:4321)
npm run build     # build de production dans dist/
npm run preview   # prévisualiser le build
```

## Déploiement

Importer le repo dans Vercel — le framework Astro est détecté automatiquement (build `astro build`, sortie `dist/`).

Le fichier `vercel.json` porte les en-têtes de sécurité (HSTS, CSP, X-Frame-Options, etc.) : ils sont appliqués par Vercel à la mise en ligne. Ne pas le supprimer.

## Structure

- `src/pages/` — une page Astro par route (HTML identique à la maquette, scripts et styles en `is:inline`)
- `public/assets/` — CSS, JS et images, copiés octet pour octet depuis la maquette
- `public/` — `robots.txt`, `sitemap.xml`, `llms.txt`, `favicon.svg`
