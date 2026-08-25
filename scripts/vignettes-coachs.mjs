/* =====================================================================
   RAMONVILLE · les vignettes de coachs de la page d'accueil

   MESURÉ LE 25/08/2026, à 375 px, onglet au premier plan :
   l'accueil pesait 912 ko, dont 485 ko pour les CINQ portraits de coachs.
   Chacun descend en 1086 px de large pour une case de 143 px — soit
   14,4 fois plus de pixels que l'écran n'en affiche. Le navigateur
   télécharge tout, puis jette 93 % du fichier au redimensionnement.

   Les mêmes fichiers servent en grand sur /coachs/ : on ne les remplace
   donc pas, on AJOUTE une taille. Le `srcset` laisse le navigateur choisir,
   et il choisit toujours la plus petite qui suffit.

   320 px couvre la case de 143 px sur un écran à 2x (286 px nécessaires),
   avec une marge pour les téléphones un peu plus larges.
   ===================================================================== */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const DOSSIER = "public/assets/img/ram";
const LARGEUR = 320;

const sources = fs.readdirSync(DOSSIER)
  .filter((f) => /^coach-[a-z]+\.webp$/.test(f));

let avant = 0, apres = 0;
for (const f of sources) {
  const src = path.join(DOSSIER, f);
  const dst = path.join(DOSSIER, f.replace(/\.webp$/, `-${LARGEUR}.webp`));
  const meta = await sharp(src).metadata();
  await sharp(src).resize({ width: LARGEUR }).webp({ quality: 78 }).toFile(dst);
  const a = fs.statSync(src).size, b = fs.statSync(dst).size;
  avant += a; apres += b;
  console.log(`  ${f.padEnd(24)} ${meta.width}px ${(a / 1024).toFixed(0)} ko  ->  ${LARGEUR}px ${(b / 1024).toFixed(0)} ko`);
}
console.log(`\n  ${sources.length} vignettes · ${(avant / 1024).toFixed(0)} ko -> ${(apres / 1024).toFixed(0)} ko sur l'accueil (${Math.round(100 - (apres / avant) * 100)} % de moins)`);
