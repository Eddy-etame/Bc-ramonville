/* =====================================================================
   RAMONVILLE · scripts/sitemap.mjs — le plan du site, daté pour de vrai

   POURQUOI CE SCRIPT REMPLACE UN FICHIER ÉCRIT À LA MAIN.
   public/sitemap.xml portait huit `<lastmod>2026-07-19</lastmod>` tapés le
   jour où quelqu'un y a pensé. Deux défauts, et le second est le pire :

     · c'est une date en dur dans un fichier inerte — exactement ce que la
       maison s'interdit (rien de périssable dans du balisage figé) ;
     · surtout, c'est FAUX dès le lendemain. Un `lastmod` qui ne bouge pas
       quand la page bouge, ou qui bouge quand elle n'a pas bougé, n'est pas
       une imprécision : c'est un signal que le moteur apprend à ignorer.
       Autant ne rien déclarer que déclarer n'importe quoi.

   COMMENT CELUI-CI DIT LA VÉRITÉ. Après le build, on prend l'empreinte
   SHA-256 du HTML RÉELLEMENT SERVI pour chaque page — commentaires retirés,
   JSON-LD compris, donc tout ce qu'un robot lira. On la compare à celle
   enregistrée dans scripts/sitemap-etat.json :
     · empreinte identique → on garde la date d'avant. Republier ne
       « rafraîchit » rien : reconstruire n'est pas modifier ;
     · empreinte différente → la page a vraiment changé, `lastmod` prend
       la date du jour, et la nouvelle empreinte est enregistrée.

   L'état est versionné avec le dépôt : c'est lui qui porte la mémoire des
   dates, pas le XML, et pas l'horloge de la machine de build.

   Usage : appelé par `npm run build`, après astro build et minify (il doit
   voir le HTML définitif). Écrit dist/sitemap.xml.
   ===================================================================== */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const ETAT = join(ROOT, "scripts", "sitemap-etat.json");
const BASE = "https://ramonville.boxingcenter.fr";

/* L'image déclarée par page est celle que la page MONTRE — pas la plus
   flatteuse. `changefreq` suit le rythme réel : le planning et l'accueil
   bougent à la saison, le reste beaucoup moins. */
const PAGES = [
  { chemin: "", priorite: "1.0", freq: "weekly", img: "/assets/img/ram/hero.webp", titre: "Boxing Center Ramonville — l'octogone de 7 m et le ring de boxe olympique" },
  { chemin: "la-salle/", priorite: "0.8", freq: "monthly", img: "/assets/img/ram/plateau.webp", titre: "Le plateau Boxing Center Ramonville — l'octogone, le ring olympique et les tatamis" },
  { chemin: "activites/", priorite: "0.8", freq: "monthly", img: "/assets/img/ram/octogone.webp", titre: "Asso MMA dans l'octogone de 7 m — Boxing Center Ramonville" },
  { chemin: "coachs/", priorite: "0.8", freq: "monthly", img: "/assets/img/ram/coach-sonia.webp", titre: "Sonia, coach à Boxing Center Ramonville" },
  { chemin: "galerie/", priorite: "0.8", freq: "monthly", img: "/assets/img/ram/hero-1200.webp", titre: "Le plateau de Boxing Center Ramonville sous la charpente" },
  { chemin: "plannings/", priorite: "0.8", freq: "weekly", img: "/assets/img/ram/planning-rentree-2026.webp", titre: "Planning officiel des cours — Boxing Center Ramonville" },
  { chemin: "tarifs/", priorite: "0.8", freq: "monthly", img: "/assets/img/ram/camp.webp", titre: "Boxing Camp — la ligne de sacs lourds à Boxing Center Ramonville" },
  { chemin: "contact/", priorite: "0.8", freq: "monthly", img: "/assets/img/ram/plateau.webp", titre: "Boxing Center Ramonville — 33 rue des Ormes, Ramonville-Saint-Agne" },
];

const aujourdhui = new Date().toISOString().slice(0, 10);
const etat = existsSync(ETAT) ? JSON.parse(await readFile(ETAT, "utf8")) : {};
const neuf = {};
const lignes = [];
let bouges = 0;

for (const p of PAGES) {
  const f = join(DIST, p.chemin, "index.html");
  const html = await readFile(f, "utf8");
  const empreinte = createHash("sha256").update(html).digest("hex").slice(0, 16);
  const ancien = etat[p.chemin || "/"];
  const change = !ancien || ancien.empreinte !== empreinte;
  const lastmod = change ? aujourdhui : ancien.lastmod;
  if (change) bouges++;
  neuf[p.chemin || "/"] = { empreinte, lastmod };

  lignes.push(
    `  <url>\n` +
    `    <loc>${BASE}/${p.chemin}</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>${p.freq}</changefreq>\n` +
    `    <priority>${p.priorite}</priority>\n` +
    `    <image:image>\n` +
    `      <image:loc>${BASE}${p.img}</image:loc>\n` +
    `      <image:title>${p.titre.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</image:title>\n` +
    `    </image:image>\n` +
    `  </url>`
  );
}

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
  lignes.join("\n") + "\n</urlset>\n";

await writeFile(join(DIST, "sitemap.xml"), xml);
await writeFile(ETAT, JSON.stringify(neuf, null, 2) + "\n");

console.log(
  `[sitemap] ${PAGES.length} URL · ${bouges} page(s) modifiée(s) depuis le dernier relevé` +
  `${bouges ? ` → lastmod ${aujourdhui}` : " → toutes les dates conservées"}`
);
