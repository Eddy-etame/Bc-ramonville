/* =====================================================================
   RAMONVILLE · scripts/images.mjs — le pipeline images

   Toutes les photos de la salle sont en .webp (20 – 244 ko). Les deux
   posters de planning, eux, étaient restés en PNG plein format : 2 008 057
   et 1 452 252 octets, soit 3,4 Mo sur une seule page — dix fois le poids
   de tout le reste du site réuni. Un planning doit être LISIBLE en grand,
   pas LOURD à l'arrivée.

   Ce script encode une version WebP de chaque poster, à dimensions
   identiques. Le PNG d'origine n'est ni touché ni supprimé : il reste la
   source de vérité, et c'est lui qui s'ouvre au clic (POSTERS.src). La page
   ne sert que le WebP (POSTERS.view).

   Usage : node scripts/images.mjs        (idempotent — ré-encode et compare)
   ===================================================================== */
import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IMG = join(ROOT, "public", "assets", "img", "ram");
const QUALITY = 82;   // WebP : au-delà, le gain de lisibilité est nul sur un aplat

const ko = (n) => `${(n / 1024).toFixed(0)} ko`;

const files = (await readdir(IMG)).filter((f) => extname(f).toLowerCase() === ".png");
if (!files.length) { console.log("Aucun PNG à convertir."); process.exit(0); }

for (const f of files) {
  const src = join(IMG, f);
  const out = join(IMG, `${basename(f, extname(f))}.webp`);
  const before = (await stat(src)).size;
  const info = await sharp(src).webp({ quality: QUALITY, effort: 6 }).toFile(out);
  const after = (await stat(out)).size;
  console.log(
    `${f} → ${basename(out)}  ${ko(before)} → ${ko(after)}  ` +
    `(-${Math.round((1 - after / before) * 100)} %)  ${info.width}×${info.height}`
  );
}
