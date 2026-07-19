/* =====================================================================
   RAMONVILLE · scripts/minify.mjs — la passe qui gratte les octets

   POURQUOI CE SCRIPT EXISTE. Ce dépôt écrit ses raisons dans le code :
   base.css explique pourquoi tel filet existe, data.js explique pourquoi
   telle légende ne porte plus d'heure, sky.js explique d'où vient l'heure
   de la salle. Ces commentaires valent de l'or à la relecture — et ils ne
   valent rien au visiteur, qui les télécharge pourtant intégralement.

   On ne choisit donc pas entre les deux. La SOURCE garde tout : chaque
   commentaire, chaque nom de variable en français, chaque respiration.
   Le BUILD n'expédie que ce qui s'exécute. Un seul outil (esbuild, déjà
   dans l'arbre d'Astro) pour le CSS comme pour le JS.

   Ce qu'on ne fait PAS :
     · pas de regroupement : les modules ESM gardent leurs `import`, donc
       une page qui n'a pas besoin de page.js ne le charge pas ;
     · pas de renommage global : `format:'esm'` protège les exports, et
       les fichiers restent interchangeables un par un dans dist/ ;
     · rien n'est touché dans public/ — le script lit et réécrit dist/,
       et rien d'autre. Relancer un build repart toujours de la source.

   Usage : `npm run build` l'appelle après astro build. Seul.
   ===================================================================== */
import esbuild from "esbuild";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname, sep } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

/* On descend dans dist/ en entier : assets/ ET admin/. Le vestiaire est un
   outil de travail, pas une vitrine — mais il s'ouvre sur le téléphone du
   staff, souvent en 4G depuis le bord du tatami. Il a droit au même soin. */
async function* fichiers(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* fichiers(p);
    else yield p;
  }
}

const ko = (n) => `${(n / 1024).toFixed(1)} ko`;
const gz = (s) => gzipSync(Buffer.from(s), { level: 9 }).length;

/* --------------------------------------------------------------------
   LES COMMENTAIRES DE CHANTIER PARTAIENT CHEZ LE VISITEUR.

   Ce script disait déjà « la SOURCE garde tout, le BUILD n'expédie que ce
   qui s'exécute » — et il ne le faisait que pour le CSS et le JS. Les
   pages, elles, expédiaient l'intégralité de leurs commentaires HTML :
   pourquoi telle balise a bougé, ce qu'elle disait avant, le détail des
   mesures. 26 ko de brut, 11,6 ko après brotli, sur neuf pages, pour du
   texte qu'aucun visiteur ne lira jamais et qu'aucun robot n'indexe.

   On ne touche à RIEN d'autre. Le balisage, les attributs, le JSON-LD et
   les scripts en ligne sont recopiés à l'octet près : le contenu des
   blocs <script>, <style>, <pre> et <textarea> est mis de côté avant le
   passage, puis remis en place. Un `//` en fin de ligne dans un script en
   ligne, un `-->` dans une chaîne JSON — plus rien ne peut les atteindre.
   Les commentaires conditionnels (<!--[if …]>) sont épargnés par principe.
   -------------------------------------------------------------------- */
function sansCommentaires(html) {
  /* LE JETON DE MISE DE CÔTÉ DOIT ÊTRE IMPOSSIBLE DANS UNE PAGE.
     Première version : l'index entouré de deux espaces. Or « 300 m² dehors »
     contient bel et bien un 300 entre deux espaces — la restitution aurait
     remplacé le chiffre du hero par un bloc de script entier. On prend donc
     U+0000, qu'un document HTML servi ne contient jamais, et on le VÉRIFIE
     au lieu de le supposer. */
  const NUL = String.fromCharCode(0);
  if (html.includes(NUL)) return html;          // filet : on ne touche à rien

  const coffre = [];
  const garde = html.replace(
    /<(script|style|pre|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    (m) => NUL + "{" + (coffre.push(m) - 1) + "}" + NUL
  );
  const propre = garde.replace(/<!--(?!\[if)[\s\S]*?-->/g, "");
  const rendu = propre.replace(
    new RegExp(NUL + "\\{(\\d+)\\}" + NUL, "g"),
    (_, i) => coffre[+i]
  );

  /* SECOND FILET. Aucun jeton ne doit survivre, et tout ce qui a été mis de
     côté doit être revenu à l'identique. Au moindre doute : page intacte. */
  if (rendu.includes(NUL)) return html;
  for (const bloc of coffre) if (!rendu.includes(bloc)) return html;
  return rendu;
}
let htmlAvant = 0, htmlApres = 0, htmlZipAvant = 0, htmlZipApres = 0, nHtml = 0;
for await (const f of fichiers(DIST)) {
  if (extname(f) !== ".html") continue;
  const source = await readFile(f, "utf8");
  const sortie = sansCommentaires(source);
  if (sortie.length >= source.length) continue;
  await writeFile(f, sortie);
  htmlAvant += source.length; htmlApres += sortie.length;
  htmlZipAvant += gz(source); htmlZipApres += gz(sortie);
  nHtml++;
}
if (nHtml) {
  console.log(
    `[minify] ${nHtml} pages · commentaires de chantier retirés du rendu · ` +
    `brut ${ko(htmlAvant)} → ${ko(htmlApres)} (-${ko(htmlAvant - htmlApres)}) · ` +
    `gzip ${ko(htmlZipAvant)} → ${ko(htmlZipApres)} (-${ko(htmlZipAvant - htmlZipApres)})`
  );
}

let brutAvant = 0, brutApres = 0, zipAvant = 0, zipApres = 0, n = 0;

/* ON NE RETOUCHE PAS AUX LIBS TIERCES. Elles arrivent déjà minifiées, et
   surtout : elles sont chargées en script CLASSIQUE (<script defer>), pas en
   module. Les repasser dans esbuild avec `format:'esm'` leur a collé un
   `export default Ts();` en fin de fichier — un `export` dans un script
   classique, c'est une SyntaxError, donc plus de gsap, donc plus une seule
   animation sur les huit pages. Le filet dead-man a fait son travail (le texte
   est resté lisible, h1 visible, zéro repli de police), ce qui rendait la
   panne invisible à l'œil : c'est la mesure qui l'a vue, pas la relecture.
   Gain abandonné : 2,6 ko de brut, 0 après brotli. Rien, contre tout. */
const TIERS = `${sep}assets${sep}vendor${sep}`;

for await (const f of fichiers(DIST)) {
  const ext = extname(f);
  if (ext !== ".js" && ext !== ".css") continue;
  if (f.includes(TIERS)) continue;

  const source = await readFile(f, "utf8");
  const sortie = ext === ".css"
    ? (await esbuild.transform(source, { loader: "css", minify: true, legalComments: "none" })).code
    : (await esbuild.transform(source, { minify: true, format: "esm", target: "es2020", legalComments: "none" })).code;

  /* Filet : si la minification RENVOIE PLUS GROS (fichier déjà minifié,
     cas dégénéré), on garde la source. On ne perd jamais d'octets à
     vouloir en gagner. */
  if (sortie.length >= source.length) continue;

  await writeFile(f, sortie);
  brutAvant += source.length; brutApres += sortie.length;
  zipAvant += gz(source);     zipApres += gz(sortie);
  n++;
}

console.log(
  `[minify] ${n} fichiers · brut ${ko(brutAvant)} → ${ko(brutApres)} ` +
  `(-${ko(brutAvant - brutApres)}) · gzip ${ko(zipAvant)} → ${ko(zipApres)} ` +
  `(-${ko(zipAvant - zipApres)})`
);
