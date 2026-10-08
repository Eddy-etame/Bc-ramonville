/* =====================================================================
   RAMONVILLE · sélection photo du 07/10/2026

   Les originaux restent dans 02_FOOTAGE_REEL et ne sont jamais modifiés.
   Chaque image retenue est recadrée AVANT la signature incrustée en bas à
   droite, puis exportée en WebP 1600 et 800 px. Sharp n'écrit ni EXIF, ni
   IPTC, ni XMP par défaut ; le contrôle final ci-dessous le vérifie.

   Cette sélection est volontairement courte : chaque cadre remplace une
   répétition précise et doit être plus fort que la photo qu'il remplace.
   ===================================================================== */
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "C:/Users/Mommy Jayce/Desktop/Boxing Center/02_FOOTAGE_REEL";
const OUTPUT = join(ROOT, "public", "assets", "img", "ram", "photos");

/* Les extractions ont été vérifiées sur les originaux pleine définition.
   Leur bord inférieur s'arrête au-dessus de la signature, sans couper le
   geste ni le sujet principal. */
const SELECTION = [
  {
    source: "Ramonville mma/DSC_3621.jpg",
    nom: "mma-percussions-en-binome-boxing-center-ramonville",
    extrait: { left: 8, top: 350, width: 4000, height: 5000 },
  },
  {
    source: "Ramonville mma/DSC_3596.jpg",
    nom: "mma-entrainement-debout-en-groupe-boxing-center-ramonville",
    extrait: { left: 289, top: 0, width: 4700, height: 3133 },
  },
  {
    source: "Ramonville-boxing camp/DSC_3523.jpg",
    nom: "boxing-camp-coup-de-pied-au-sac-boxing-center-ramonville",
    extrait: { left: 8, top: 350, width: 4000, height: 5000 },
  },
  {
    source: "Ramonville-boxing camp/DSC_3531.jpg",
    nom: "boxing-camp-circuit-cardio-boxing-center-ramonville",
    extrait: { left: 320, top: 0, width: 5100, height: 3400 },
  },
  {
    source: "Ramonville-boxing camp/DSC_3588.jpg",
    nom: "boxing-camp-groupe-boxing-center-ramonville",
    extrait: { left: 240, top: 0, width: 5100, height: 3400 },
  },
];

await mkdir(OUTPUT, { recursive: true });

for (const photo of SELECTION) {
  const source = join(SOURCE, photo.source);
  for (const largeur of [1600, 800]) {
    const suffixe = largeur === 800 ? "-800" : "";
    const cible = join(OUTPUT, `${photo.nom}${suffixe}.webp`);

    await sharp(source)
      .rotate()
      .extract(photo.extrait)
      .resize({ width: largeur, withoutEnlargement: true })
      .toColourspace("srgb")
      .modulate({ brightness: 1.025, saturation: 1.015 })
      .sharpen({ sigma: 0.45 })
      .webp({ quality: largeur === 800 ? 80 : 82, effort: 6, smartSubsample: true })
      .toFile(cible);

    const meta = await sharp(cible).metadata();
    if (meta.exif || meta.iptc || meta.xmp) {
      throw new Error(`Métadonnées publiques détectées dans ${cible}`);
    }
    const poids = Math.round((await stat(cible)).size / 1024);
    console.log(`${photo.nom}${suffixe}.webp · ${meta.width}×${meta.height} · ${poids} ko · métadonnées nettoyées`);
  }
}
