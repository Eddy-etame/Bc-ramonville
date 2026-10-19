/* =====================================================================
   RAMONVILLE · garde-offres — la sortie du build ne relie aucune offre retirée

   Le 20/10/2026, l'offre de rentrée, l'année à prix réduit et la page
   des offres spéciales de la boutique sont retirées (motifs ci-dessous).
   verifier-coherence.mjs relit les SOURCES avant le build ; ce garde relit
   dist/, c'est-à-dire ce qui part vraiment en ligne — HTML, JS, CSS,
   llms, sitemap — et casse le build si un lien ou un prix y survit.

       node scripts/garde-offres.mjs
   ===================================================================== */
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const DIST = "dist";
const MOTIFS = [
  [/boutique\.boxingcenter\.fr\/offre\/(29|259)\b/, "lien vers une offre retirée"],
  [/\/offre\/(29|259)\b/, "lien vers une offre retirée"],
  [/offres-speciale[s]/, "lien vers la page des offres spéciales"],
  [/offre-(duo|saison)\b/, "produit retiré"],
  [/(?<![\d,.])(29|259)(\s|&nbsp;|&#160;|\u00a0)?(€|&euro;)/, "prix d'une offre retirée"],
];
const TEXTE = /\.(html?|m?js|css|txt|xml|json|md|webmanifest)$/i;

const fautes = [];
let lus = 0;
const parcourir = (dir) => {
  for (const nom of readdirSync(dir)) {
    const p = join(dir, nom);
    if (statSync(p).isDirectory()) { parcourir(p); continue; }
    if (!TEXTE.test(nom)) continue;
    lus++;
    const txt = readFileSync(p, "utf8");
    for (const [rx, quoi] of MOTIFS) {
      const m = txt.match(rx);
      if (m) fautes.push(`${relative(DIST, p).replace(/\\/g, "/")} : ${quoi} — « ${m[0]} »`);
    }
  }
};
parcourir(DIST);

if (fautes.length) {
  console.error(`\n[garde-offres] ${fautes.length} trace(s) d'offre retirée dans dist/ — le build s'arrête\n`);
  for (const f of fautes) console.error("  ✗ " + f);
  console.error("");
  process.exit(1);
}
console.log(`[garde-offres] ${lus} fichiers relus dans dist/ — aucune offre retirée`);
