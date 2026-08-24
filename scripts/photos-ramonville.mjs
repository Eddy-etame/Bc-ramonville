/* =====================================================================
   RAMONVILLE · les 62 photos livrées le 24/08/2026

   CE QUE FAIT CE SCRIPT
   1. Il RENOMME chaque photo d'après ce qu'elle montre, en français, avec
      les mots qu'on tape dans Google. Un fichier qui s'appelle
      « 2023-01-09-Cécile-Domenech-TMBC-268-.jpg » ne dit rien à personne ;
      « octogone-mma-cours-au-sol-boxing-center-ramonville.webp » dit à
      Google de quoi il s'agit, et remonte sur « MMA Ramonville ».
   2. Il RANGE les originaux dans scripts/img-src/photos-2026/ — la règle de
      la maison : les sources ne sont jamais déployées, elles restent la
      vérité du dépôt.
   3. Il ENCODE deux tailles en WebP dans public/assets/img/ram/photos/ :
      1600 px pour le plein écran, 800 px pour les grilles. Les originaux
      font 15 à 28 Mo — un visiteur n'a jamais à télécharger ça.
   4. Il ÉCRIT un manifeste avec l'alt de chaque photo, pour que les pages
      n'aient jamais à réinventer une description.

   L'ALT N'EST PAS DÉCORATIF. C'est ce que lit un lecteur d'écran, et c'est
   ce que Google indexe quand il ne peut pas voir l'image. Chaque alt dit
   le sujet, le lieu, et la discipline — jamais « photo de la salle ».
   ===================================================================== */
import sharp from "sharp";
import fs from "fs";
import path from "path";

const SRC = "C:/Users/Mommy Jayce/Downloads/wetransfer_photos-ramonville_2026-08-24_1313";
const RACINE = "C:/Users/Mommy Jayce/Desktop/Boxing Center/sites/bc-ramonville";
const SOURCES = path.join(RACINE, "scripts/img-src/photos-2026");
const SORTIE = path.join(RACINE, "public/assets/img/ram/photos");
const SUFF = "-boxing-center-ramonville";

/* [nom SEO sans suffixe, alt] — dans l'ordre alphabétique des fichiers d'origine. */
const MAP = [
  ["sacs-de-frappe-entrainement", "Deux pratiquants devant la ligne de sacs lourds du Boxing Center Ramonville, sous la charpente."],
  ["ring-de-boxe-avant-le-cours", "Le grand ring de boxe du Boxing Center Ramonville avant le début du cours collectif."],
  ["cours-de-boxe-collectif-sur-le-ring", "Cours de boxe collectif sur le ring du Boxing Center Ramonville, une dizaine de pratiquants."],
  ["cours-de-boxe-anglaise-sur-le-ring", "Cours de boxe anglaise sur le ring du Boxing Center Ramonville, travail de déplacements."],
  ["ring-de-boxe-et-fresque-murale", "Le ring de boxe du Boxing Center Ramonville devant la fresque murale du club."],
  ["octogone-mma-cours-au-sol", "Cours de MMA au sol dans l'octogone de 7 mètres du Boxing Center Ramonville."],
  ["sac-de-frappe-plateau-bois", "Un pratiquant au sac de frappe sur le plateau bois du Boxing Center Ramonville."],
  ["espace-cardio-velos", "L'espace cardio du Boxing Center Ramonville : vélos et rameurs à l'étage."],
  ["espace-musculation-poulies", "L'espace musculation du Boxing Center Ramonville : poulies, bancs et charges libres."],
  ["salle-de-musculation-machines", "La salle de musculation du Boxing Center Ramonville et ses machines guidées."],
  ["espace-cardio-rameur", "Un rameur de l'espace cardio du Boxing Center Ramonville, à l'étage du club."],
  ["octogone-mma-et-drapeaux", "Un pratiquant dans l'octogone du Boxing Center Ramonville, devant le mur de drapeaux."],
  ["octogone-vu-du-grillage-noir-et-blanc", "L'octogone du Boxing Center Ramonville vu à travers le grillage, en noir et blanc."],
  ["octogone-vu-du-grillage", "L'intérieur de l'octogone du Boxing Center Ramonville vu à travers le grillage."],
  ["grappling-groupe-dans-l-octogone", "Un groupe de grappling réuni dans l'octogone du Boxing Center Ramonville."],
  ["mma-entrainement-dans-l-octogone", "Entraînement de MMA dans l'octogone grillagé du Boxing Center Ramonville."],

  ["octogone-vue-plongeante", "L'octogone de 7 mètres du Boxing Center Ramonville vu de dessus pendant un cours."],
  ["cours-de-mma-groupe-debout", "Le groupe du cours de MMA debout dans l'octogone du Boxing Center Ramonville."],
  ["grappling-au-sol-dans-l-octogone", "Travail de grappling au sol dans l'octogone du Boxing Center Ramonville."],
  ["cours-de-grappling-vue-du-dessus", "Cours de grappling au Boxing Center Ramonville, plusieurs binômes au sol."],
  ["plateau-ring-tatami-et-octogone", "Le plateau du Boxing Center Ramonville : le ring, le tatami et l'octogone sous la charpente."],
  ["etage-musculation-sous-la-charpente", "L'étage musculation du Boxing Center Ramonville, sous la charpente métallique."],
  ["boxe-pieds-poings-noir-et-blanc", "Cours de boxe pieds-poings au Boxing Center Ramonville, vu à travers le grillage."],
  ["boxe-anglaise-garde-haute", "Un boxeur en garde haute au Boxing Center Ramonville, devant la fresque du club."],
  ["travail-aux-pattes-d-ours", "Travail aux pattes d'ours en binôme au Boxing Center Ramonville."],
  ["lady-punch-boxe-100-pour-cent-feminin", "Une pratiquante du cours Lady Punch au Boxing Center Ramonville, enchaînement aux gants."],
  ["frappe-au-sac-lourd", "Frappe au sac lourd pendant le Boxing Camp du Boxing Center Ramonville."],
  ["coach-de-boxe-portrait", "Un coach du Boxing Center Ramonville en garde, portrait devant le ring."],
  ["grappling-projection-debout", "Travail de projection en grappling au Boxing Center Ramonville."],
  ["cours-de-grappling-plusieurs-binomes", "Cours de grappling au Boxing Center Ramonville, vue haute sur plusieurs binômes."],
  ["grappling-controle-au-sol", "Contrôle au sol pendant le cours de grappling du Boxing Center Ramonville."],
  ["jiu-jitsu-bresilien-au-sol", "Travail de jiu-jitsu brésilien au sol dans l'octogone du Boxing Center Ramonville."],

  ["octogone-cours-vue-plongeante", "Vue plongeante sur un cours au sol dans l'octogone du Boxing Center Ramonville."],
  ["renforcement-aux-halteres", "Renforcement aux haltères pendant le Boxing Camp du Boxing Center Ramonville."],
  ["boxing-camp-circuit-de-renforcement", "Circuit de renforcement du Boxing Camp au Boxing Center Ramonville, en groupe."],
  ["etage-musculation-vue-generale", "Vue générale de l'étage musculation du Boxing Center Ramonville."],
  ["machines-de-musculation-guidees", "Les machines de musculation guidées du Boxing Center Ramonville."],
  ["octogone-7-metres-vide", "L'octogone de 7 mètres du Boxing Center Ramonville, vide, entre deux cours."],
  ["boxe-educative-enfants", "Cours de boxe éducative pour enfants au Boxing Center Ramonville."],
  ["boxing-lady-renforcement", "Renforcement pendant le cours Boxing Lady du Boxing Center Ramonville."],
  ["coach-au-milieu-du-cours", "Un coach du Boxing Center Ramonville au milieu de son cours collectif."],
  ["coach-portrait-devant-l-octogone", "Portrait d'un coach du Boxing Center Ramonville devant l'octogone."],
  ["coach-en-garde-devant-l-octogone", "Un coach du Boxing Center Ramonville en garde devant l'octogone."],
  ["coach-bras-croises-devant-l-octogone", "Portrait d'un coach du Boxing Center Ramonville, bras croisés devant l'octogone."],
  ["coach-portrait-cage-mma", "Portrait d'un coach du Boxing Center Ramonville devant la cage de MMA."],
  ["gainage-et-pompes-en-binome", "Gainage et pompes en binôme pendant le Boxing Camp du Boxing Center Ramonville."],
  ["renforcement-au-sol-en-binome", "Renforcement au sol en binôme au Boxing Center Ramonville."],
  ["pratiquant-senior-en-garde", "Un pratiquant senior en garde au Boxing Center Ramonville : la boxe à tout âge."],

  ["pratiquant-senior-portrait", "Portrait d'un pratiquant senior du Boxing Center Ramonville devant le ring."],
  ["pratiquant-senior-bras-croises", "Un pratiquant senior du Boxing Center Ramonville, bras croisés devant les pneus du Boxing Camp."],
  ["pratiquant-senior-devant-le-ring", "Un pratiquant senior du Boxing Center Ramonville devant le ring de boxe."],
  ["kick-boxing-coup-de-pied-haut", "Coup de pied haut au bouclier pendant le cours de kick-boxing du Boxing Center Ramonville."],
  ["sparring-pieds-poings-sur-tatami", "Sparring pieds-poings sur le tatami du Boxing Center Ramonville."],
  ["boxeur-portrait-devant-l-octogone", "Portrait d'un boxeur du Boxing Center Ramonville devant l'octogone."],
  ["boxeur-en-garde-devant-l-octogone", "Un boxeur du Boxing Center Ramonville en garde devant l'octogone."],
  ["boxeur-bras-croises-devant-la-cage", "Portrait d'un boxeur du Boxing Center Ramonville, bras croisés devant la cage."],
  ["boxeur-portrait-dans-la-cage", "Portrait d'un boxeur du Boxing Center Ramonville à l'intérieur de la cage."],
  ["boxe-anglaise-en-binome", "Travail de boxe anglaise en binôme au Boxing Center Ramonville, devant le ring."],
  ["boxe-anglaise-garde-en-binome", "Deux pratiquants en garde pendant le cours de boxe anglaise du Boxing Center Ramonville."],
  ["coach-aux-pattes-d-ours-direct", "Un coach du Boxing Center Ramonville reçoit un direct aux pattes d'ours."],
  ["gainage-planche-au-sol", "Gainage en planche pendant le renforcement du Boxing Center Ramonville."],
  ["renforcement-squat-aux-halteres", "Squat aux haltères pendant le renforcement du Boxing Center Ramonville."],
];

const fics = fs.readdirSync(SRC).filter((f) => /\.jpe?g$/i.test(f)).sort();
if (fics.length !== MAP.length) {
  console.error(`ATTENTION : ${fics.length} photos pour ${MAP.length} noms — on s'arrête.`);
  process.exit(1);
}

fs.mkdirSync(SOURCES, { recursive: true });
fs.mkdirSync(SORTIE, { recursive: true });

const manifeste = [];
let octetsAvant = 0, octetsApres = 0;

for (let i = 0; i < fics.length; i++) {
  const [slug, alt] = MAP[i];
  const nom = slug + SUFF;
  const orig = path.join(SRC, fics[i]);
  octetsAvant += fs.statSync(orig).size;

  /* 1. la source, rangée sous son vrai nom, jamais déployée */
  const dest = path.join(SOURCES, nom + ".jpg");
  if (!fs.existsSync(dest)) fs.copyFileSync(orig, dest);

  /* 2. deux tailles servies — 1600 pour le plein écran, 800 pour les grilles */
  const im = sharp(orig).rotate();
  const meta = await im.metadata();
  for (const [suffixe, largeur] of [["", 1600], ["-800", 800]]) {
    const cible = path.join(SORTIE, nom + suffixe + ".webp");
    await sharp(orig).rotate()
      .resize({ width: largeur, withoutEnlargement: true })
      .webp({ quality: 76, effort: 5 })
      .toFile(cible);
    octetsApres += fs.statSync(cible).size;
  }
  manifeste.push({ nom, alt, w: meta.width, h: meta.height });
  if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/${fics.length}`);
}

fs.writeFileSync(
  path.join(RACINE, "public/assets/js/data-photos.js"),
  `/* Les 62 photos de Ramonville livrees le 24/08/2026.\n` +
  `   GENERE par scripts/photos-ramonville.mjs — ne pas editer a la main.\n` +
  `   L'alt n'est pas decoratif : c'est ce que lit un lecteur d'ecran, et ce\n` +
  `   que Google indexe quand il ne peut pas voir l'image. */\n` +
  `export const PHOTOS = ${JSON.stringify(manifeste, null, 2)};\n`,
  "utf8"
);

const mo = (n) => (n / 1048576).toFixed(1) + " Mo";
console.log(`\n  ${fics.length} photos renommees et encodees`);
console.log(`  originaux ${mo(octetsAvant)} -> servi ${mo(octetsApres)} (${Math.round((1 - octetsApres / octetsAvant) * 100)} % de moins)`);
console.log(`  sources  : scripts/img-src/photos-2026/`);
console.log(`  servies  : public/assets/img/ram/photos/`);
console.log(`  manifeste: public/assets/js/data-photos.js`);
