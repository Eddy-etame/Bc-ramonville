/* =====================================================================
   RAMONVILLE · scripts/images.mjs — le pipeline images

   RÈGLE DE LA MAISON : les fichiers SOURCES ne sont pas déployés.
   Ils vivent dans scripts/img-src/, hors de public/. Ils restent la
   vérité du dépôt, consultables, ré-encodables — mais un visiteur n'a
   jamais à les télécharger, et Vercel n'a jamais à les héberger.

   ---------------------------------------------------------------------
   CE QUI A CHANGÉ À CETTE PASSE, ET POURQUOI (tout est mesuré)

   1. LES DEUX PLANNINGS PLEIN FORMAT PASSENT EN WebP SANS PERTE.
      Le clic « ouvrir le planning en grand » servait les PNG d'origine :
      1 961 ko et 1 418 ko, 3,4 Mo à deux. On les a comparés pixel par
      pixel à leur encodage WebP `lossless` : ÉCART MAXIMAL 0/255 sur les
      quatre canaux, sur les 4,2 et 2,4 millions de pixels. Ce ne sont pas
      des images « presque pareilles » : ce sont les mêmes, au bit près,
      pour 1 471 ko au lieu de 3 379. On ne discute pas 1,9 Mo gratuits.
      (Une passe en `quality: 95` pesait 250 ko mais montrait jusqu'à
      77/255 d'écart sur les arêtes de texte : refusé. Un planning, ça se
      lit.)

   2. LE PLANNING AFFICHÉ DANS LA PAGE EST CALIBRÉ SUR SON AFFICHAGE.
      Mesuré au rendu : le poster occupe au plus 776 px CSS en bureau,
      donc 1 552 px sur un écran à 2×. Il était servi en 2 400 px. À
      1 600 px il couvre encore le pire cas avec de la marge, et le clic
      ouvre toujours le plein format. 132 → 106 ko et 64 → 51 ko.

   3. LE PLAN LARGE DE LA GALERIE A UNE VERSION DE VIGNETTE.
      hero.webp fait 1 920 px et pèse 238 ko. Dans la mosaïque il est
      affiché à 415 px CSS (830 px à 2×), et sur mobile à 357 px (1 070 px
      à 3×) : on servait plus du double des pixels utiles, sur la page la
      plus lourde du site. Une version 1 200 px (124 ko) couvre les deux
      cas. LA VISIONNEUSE, ELLE, CONTINUE D'OUVRIR LE 1 920 : elle le
      charge au clic, via data-full. La page s'allège de 114 ko, la photo
      en grand ne perd pas un pixel. hero.webp reste aussi l'image des
      cartes sociales et du JSON-LD, où 1 920 px est la bonne taille.

   4. LE LOGO. Son PNG source (3 542 × 1 655 px, 131 ko) traînait encore
      dans public/ alors que plus une seule balise ne le désignait — la
      nav sert le .webp de 128 px de haut depuis la passe précédente. Il
      rejoint scripts/img-src/ : 131 ko de moins à déployer, zéro octet
      de moins à l'écran.

   Usage : node scripts/images.mjs   (idempotent — ré-encode et compare)
   ===================================================================== */
import sharp from "sharp";
import { stat, mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "scripts", "img-src");
const IMG = join(ROOT, "public", "assets", "img", "ram");
const ASSETS = join(ROOT, "public", "assets", "img");

const ko = (n) => `${(n / 1024).toFixed(1)} ko`;
const poids = async (p) => (await stat(p)).size;

/* --------------------------------------------------------------------
   Filet de sécurité : on ne remplace une image par une version « sans
   perte » que si elle l'est VRAIMENT. On redécode les deux et on compare
   les octets bruts. Zéro confiance, une comparaison.
   -------------------------------------------------------------------- */
async function identique(aPath, bBuf) {
  const a = await sharp(aPath).ensureAlpha().raw().toBuffer();
  const b = await sharp(bBuf).ensureAlpha().raw().toBuffer();
  if (a.length !== b.length) return false;
  return a.equals(b);
}

await mkdir(IMG, { recursive: true });

/* ---- 1 & 2. les plannings : plein format sans perte + vue calibrée ---- */
const PLANNINGS = [
  { nom: "planning-rentree-2026", vue: 1600 },
  { nom: "planning-ete-2026", vue: 1600 },
];

for (const { nom, vue } of PLANNINGS) {
  const src = join(SRC, `${nom}.png`);
  const avant = await poids(src);

  /* plein format, sans perte, VÉRIFIÉ pixel à pixel */
  const plein = await sharp(src).webp({ lossless: true, effort: 6 }).toBuffer();
  if (!await identique(src, plein)) {
    throw new Error(`ARRÊT — ${nom} : l'encodage « sans perte » diffère du PNG.`);
  }
  /* ON ÉCRIT LE TAMPON, PAS UNE RELECTURE DU TAMPON.
     `sharp(plein).toFile(...)` re-décodait le WebP sans perte et le
     ré-encodait avec les réglages par défaut — c'est-à-dire AVEC perte :
     le fichier tombait à 127 ko et ne valait plus la vérification faite
     trois lignes plus haut. Le contrôle portait sur le bon tampon, la
     sortie sur un autre. On écrit l'octet vérifié. */
  const outPlein = join(IMG, `${nom}-full.webp`);
  await writeFile(outPlein, plein);

  /* la vue de page */
  const outVue = join(IMG, `${nom}.webp`);
  const infoVue = await sharp(src).resize({ width: vue }).webp({ quality: 88, effort: 6 }).toFile(outVue);

  console.log(
    `${nom}\n` +
    `   plein format  PNG ${ko(avant)} → WebP sans perte ${ko(await poids(outPlein))}  ` +
    `(écart pixel 0/255, vérifié)\n` +
    `   vue de page   ${infoVue.width}×${infoVue.height} → ${ko(await poids(outVue))}`
  );
}

/* ---- 3. la vignette du plan large (la visionneuse garde le 1 920) ---- */
{
  const src = join(IMG, "hero.webp");
  const out = join(IMG, "hero-1200.webp");
  const info = await sharp(src).resize({ width: 1200 }).webp({ quality: 82, effort: 6 }).toFile(out);
  console.log(
    `hero.webp → hero-1200.webp  ${ko(await poids(src))} → ${ko(await poids(out))}  ` +
    `${info.width}×${info.height}  (mosaïque ; la visionneuse ouvre toujours le 1 920)`
  );
}

/* ---- 4. le logo de la nav : 128 px de haut, alpha intact ---- */
{
  const src = join(SRC, "logo-white.png");
  const out = join(ASSETS, "logo-white.webp");
  const avant = await poids(src);
  const info = await sharp(src)
    .resize({ height: 128 })                             // 4× le 32 px maxi de .nav__logo
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })  // le blanc franc, le fond vide
    .toFile(out);
  console.log(
    `logo-white.png → logo-white.webp  ${ko(avant)} → ${ko(await poids(out))}  ` +
    `${info.width}×${info.height}`
  );
}
