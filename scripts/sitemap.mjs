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
const BASE = "https://bc-ramonville.vercel.app";

/* ---------------------------------------------------------------------
   L'INVENTAIRE DES PHOTOS — et pourquoi il est ici plutôt que dans le HTML.

   Les photos du site vivent en fonds CSS et en grilles peintes par le
   JavaScript. Google Images n'indexe QUE ce qu'il voit dans la page : une
   photo en `background-image` ne rapporte rien, aussi belle soit-elle.
   Le sitemap d'images est la seule déclaration officielle qui les rattrape.

   On n'en déclarait qu'UNE par page. On les déclare toutes, chacune avec
   son titre et sa légende — les mots de Ramonville, pas ceux d'une autre
   salle du réseau : le plateau couvert et chauffé, l'octogone de 7 m, le
   terminus du métro B. Une légende recopiée d'un site frère serait du
   doublon aux yeux du moteur, et un mensonge aux yeux du lecteur.

   Une seule taille par visuel : déclarer `planning-2026` ET
   `planning-2026-full` ferait deux images concurrentes pour la même chose.
   On déclare la version que la page sert en grand.
   --------------------------------------------------------------------- */
const CLUB = "Boxing Center Ramonville";
const I = {
  hero:      ["/assets/img/ram/hero.webp", `L'octogone de 7 m et le grand ring — ${CLUB}`, "Le plateau de Ramonville-Saint-Agne : un octogone de 7 mètres et un grand ring, en plein air, couverts et chauffés."],
  heroLarge: ["/assets/img/ram/hero-1200.webp", `Le plateau sous la charpente — ${CLUB}`, "Les 300 m² d'entraînement en plein air du club de Ramonville, sous charpente."],
  plateau:   ["/assets/img/ram/plateau.webp", `Le plateau : octogone, ring et tatamis — ${CLUB}`, "L'aire d'entraînement du Boxing Center Ramonville, 33 rue des Ormes, au terminus du métro B."],
  octogone:  ["/assets/img/ram/octogone.webp", `MMA dans l'octogone de 7 m — ${CLUB}`, "Cours de MMA dans l'octogone de 7 mètres du club de Ramonville-Saint-Agne."],
  anglaise:  ["/assets/img/ram/anglaise.webp", `Boxe anglaise sur le grand ring — ${CLUB}`, "Cours de boxe anglaise sur le grand ring de Ramonville, débutants acceptés."],
  pieds:     ["/assets/img/ram/pieds-poings.webp", `Boxe pieds-poings — ${CLUB}`, "Cours de boxe pieds-poings au Boxing Center Ramonville : thaï, kick, savate."],
  grappling: ["/assets/img/ram/grappling.webp", `Grappling au sol — ${CLUB}`, "Séance de grappling sur les tatamis du club de Ramonville-Saint-Agne."],
  camp:      ["/assets/img/ram/camp.webp", `Boxing Camp, la ligne de sacs lourds — ${CLUB}`, "Le Boxing Camp de Ramonville : circuit sur la ligne de sacs lourds, cardio et technique."],
  muscu:     ["/assets/img/ram/muscu.webp", `L'étage musculation et cardio — ${CLUB}`, "L'espace musculation-cardio à l'étage du Boxing Center Ramonville, compris dans l'abonnement."],
  sonia:     ["/assets/img/ram/coach-sonia.webp", `Sonia, coach au ${CLUB}`, "Sonia encadre les cours du Boxing Center Ramonville, enfants dès 3 ans comme adultes débutants."],
  jerome:    ["/assets/img/ram/coach-jerome.webp", `Jérôme, coach au ${CLUB}`, "Jérôme, coach au Boxing Center Ramonville-Saint-Agne."],
  /* Les huit photos livrees le 24/08/2026 — une par discipline. Le nom du
     fichier porte les mots qu'on tape : Google indexe l'URL autant que
     l'alt, et « kick-boxing-coup-de-pied-haut-... » remonte la ou
     « pieds-poings.webp » ne disait rien. */
  pAnglaise: ["/assets/img/ram/photos/cours-de-boxe-anglaise-sur-le-ring-boxing-center-ramonville.webp", `Cours de boxe anglaise sur le ring — ${CLUB}`, "Cours de boxe anglaise sur le grand ring du Boxing Center Ramonville, tous niveaux."],
  pKick:     ["/assets/img/ram/photos/kick-boxing-coup-de-pied-haut-boxing-center-ramonville.webp", `Kick-boxing, coup de pied haut — ${CLUB}`, "Coup de pied haut au bouclier pendant le cours de boxe pieds-poings du Boxing Center Ramonville."],
  pGrap:     ["/assets/img/ram/photos/grappling-controle-au-sol-boxing-center-ramonville.webp", `Grappling, contrôle au sol — ${CLUB}`, "Contrôle au sol pendant le cours de grappling du Boxing Center Ramonville."],
  pMma:      ["/assets/img/ram/photos/octogone-mma-cours-au-sol-boxing-center-ramonville.webp", `MMA dans l'octogone de 7 m — ${CLUB}`, "Cours de MMA au sol dans l'octogone de 7 mètres du Boxing Center Ramonville."],
  pCamp:     ["/assets/img/ram/photos/boxing-camp-circuit-de-renforcement-boxing-center-ramonville.webp", `Boxing Camp, circuit de renforcement — ${CLUB}`, "Circuit de renforcement du Boxing Camp au Boxing Center Ramonville, en groupe."],
  pLady:     ["/assets/img/ram/photos/lady-punch-boxe-100-pour-cent-feminin-boxing-center-ramonville.webp", `Lady Punch, 100 % féminin — ${CLUB}`, "Une pratiquante du cours Lady Punch au Boxing Center Ramonville, enchaînement aux gants."],
  pEcole:    ["/assets/img/ram/photos/boxe-educative-enfants-boxing-center-ramonville.webp", `Boxe éducative enfants — ${CLUB}`, "Cours de boxe éducative pour enfants au Boxing Center Ramonville, dès 3 ans."],
  pMuscu:    ["/assets/img/ram/photos/etage-musculation-sous-la-charpente-boxing-center-ramonville.webp", `L'étage musculation — ${CLUB}`, "L'étage musculation du Boxing Center Ramonville sous la charpente, en accès libre."],
  planRent:  ["/assets/img/ram/planning-rentree-2026-full.webp", `Planning de la rentrée 2026 — ${CLUB}`, "Le planning officiel des cours de la rentrée 2026 au Boxing Center Ramonville."],
};

/* `changefreq` suit le rythme réel : le planning et l'accueil bougent à la
   saison, le reste beaucoup moins. */
const PAGES = [
  { chemin: "", priorite: "1.0", freq: "weekly", imgs: [I.hero, I.octogone, I.plateau, I.anglaise] },
  { chemin: "la-salle/", priorite: "0.8", freq: "monthly", imgs: [I.plateau, I.octogone, I.muscu, I.camp, I.heroLarge] },
  { chemin: "activites/", priorite: "0.8", freq: "monthly", imgs: [I.pAnglaise, I.pKick, I.pGrap, I.pMma, I.pCamp, I.pLady, I.pEcole, I.pMuscu] },
  { chemin: "coachs/", priorite: "0.8", freq: "monthly", imgs: [I.sonia, I.jerome] },
  { chemin: "galerie/", priorite: "0.8", freq: "monthly", imgs: [I.heroLarge, I.plateau, I.octogone, I.anglaise, I.pieds, I.grappling, I.camp, I.muscu] },
  { chemin: "plannings/", priorite: "0.8", freq: "weekly", imgs: [I.planRent] },
  { chemin: "tarifs/", priorite: "0.8", freq: "monthly", imgs: [I.camp, I.plateau] },
  { chemin: "contact/", priorite: "0.8", freq: "monthly", imgs: [I.plateau] },
  /* La page de la première séance vaut le même poids que les tarifs : c'est
     l'autre porte d'entrée de quelqu'un qui n'est jamais venu. `monthly` :
     son contenu ne bouge qu'avec le planning et le prix de l'essai. */
  { chemin: "premiere-seance/", priorite: "0.8", freq: "monthly", imgs: [I.camp, I.anglaise, I.sonia] },
  /* Les fiches destinees aux IA. Un robot ne les decouvre autrement que par
     robots.txt : les declarer ici les met au meme rang que les pages.
     `fichier: true` : ce ne sont pas des dossiers avec un index.html. */
  { chemin: "llms.txt", fichier: true, priorite: "0.4", freq: "weekly", imgs: [] },
  { chemin: "llms-full.txt", fichier: true, priorite: "0.3", freq: "weekly", imgs: [] },
  { chemin: "ai.txt", fichier: true, priorite: "0.3", freq: "monthly", imgs: [] },
];

const aujourdhui = new Date().toISOString().slice(0, 10);
const etat = existsSync(ETAT) ? JSON.parse(await readFile(ETAT, "utf8")) : {};
const neuf = {};
const lignes = [];
let bouges = 0;

for (const p of PAGES) {
  const f = p.fichier ? join(DIST, p.chemin) : join(DIST, p.chemin, "index.html");
  const html = await readFile(f, "utf8");
  const empreinte = createHash("sha256").update(html).digest("hex").slice(0, 16);
  const ancien = etat[p.chemin || "/"];
  const change = !ancien || ancien.empreinte !== empreinte;
  const lastmod = change ? aujourdhui : ancien.lastmod;
  if (change) bouges++;
  neuf[p.chemin || "/"] = { empreinte, lastmod };

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const photos = p.imgs.map(([src, titre, legende]) =>
    `    <image:image>\n` +
    `      <image:loc>${BASE}${src}</image:loc>\n` +
    `      <image:title>${esc(titre)}</image:title>\n` +
    `      <image:caption>${esc(legende)}</image:caption>\n` +
    `    </image:image>`
  ).join("\n");

  lignes.push(
    `  <url>\n` +
    `    <loc>${BASE}/${p.chemin}</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>${p.freq}</changefreq>\n` +
    `    <priority>${p.priorite}</priority>\n` +
    photos + `\n` +
    `  </url>`
  );
}

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
  lignes.join("\n") + "\n</urlset>\n";

await writeFile(join(DIST, "sitemap.xml"), xml);
await writeFile(ETAT, JSON.stringify(neuf, null, 2) + "\n");

const photos = PAGES.reduce((n, p) => n + p.imgs.length, 0);
console.log(
  `[sitemap] ${PAGES.length} URL · ${photos} images déclarées · ${bouges} page(s) modifiée(s) depuis le dernier relevé` +
  `${bouges ? ` → lastmod ${aujourdhui}` : " → toutes les dates conservées"}`
);
