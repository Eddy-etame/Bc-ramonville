/* =====================================================================
   RAMONVILLE · l'empreinte des assets, pour que les correctifs ARRIVENT

   LE DÉFAUT, constaté le 25/08/2026.
   Les pages appellent leurs feuilles et leurs scripts avec « ?v=19 » —
   156 fois, écrit à la main dans 16 fichiers, sans constante nulle part.
   Ce numéro est la CLÉ DE CACHE du navigateur : tant qu'il ne change pas,
   un visiteur déjà venu ne retélécharge rien.

   Or « v=19 » n'avait plus bougé depuis six commits qui touchaient tous le
   CSS ou le JS. Concrètement, tout ce qu'on avait corrigé pour le téléphone
   — les tailles de texte relevées, le champ du chat qui ne faisait plus
   sauter la page, les huit noms de l'octogone, Otto lui-même — n'est jamais
   arrivé chez quelqu'un qui avait déjà visité le site. Le travail était
   fait, poussé, en ligne, et invisible.

   POURQUOI ON N'ÉCRIT PAS « PENSER À INCRÉMENTER ».
   Une consigne qui compense un outil défaillant est oubliée au troisième
   déploiement. Un outil réparé, jamais. Le numéro devient donc une
   empreinte du CONTENU RÉEL des fichiers servis : il change exactement
   quand ils changent, et il ne change pas quand ils ne changent pas — ce
   qui préserve le cache au lieu de le casser à chaque build.

   Ce script tourne APRÈS minify.mjs : il empreinte ce qui part vraiment,
   pas les sources.
   ===================================================================== */
import { createHash } from "crypto";
import fs from "fs";
import path from "path";

const DIST = "dist";

/* Tout ce qui est appelé avec ?v= : styles, scripts, polices. */
const EXT = /\.(css|js|woff2?)$/i;

function parcourir(dir, sur) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) parcourir(p, sur);
    else sur(p);
  }
}

/* 1. L'empreinte : le contenu de chaque asset, dans un ordre stable. */
const assets = [];
parcourir(DIST, (p) => { if (EXT.test(p)) assets.push(p); });
assets.sort();

const h = createHash("sha256");
for (const p of assets) {
  h.update(path.relative(DIST, p).replace(/\\/g, "/"));
  h.update(fs.readFileSync(p));
}
const empreinte = h.digest("hex").slice(0, 8);

/* 2. On la pose partout où un « ?v=… » traîne, dans le HTML ET dans le JS
      (data.js est importé avec ?v= depuis les autres modules). */
let fichiers = 0, remplacements = 0;
parcourir(DIST, (p) => {
  if (!/\.(html|js)$/i.test(p)) return;
  const avant = fs.readFileSync(p, "utf8");
  const apres = avant.replace(/([?&]v=)[A-Za-z0-9._-]+/g, (_, pre) => `${pre}${empreinte}`);
  if (apres !== avant) {
    fs.writeFileSync(p, apres);
    fichiers++;
    remplacements += (avant.match(/[?&]v=[A-Za-z0-9._-]+/g) || []).length;
  }
});

console.log(`[empreinte] v=${empreinte} — ${remplacements} appel(s) dans ${fichiers} fichier(s), calculée sur ${assets.length} asset(s)`);
console.log(`[empreinte] elle ne changera qu'au prochain changement réel de CSS, JS ou police`);
