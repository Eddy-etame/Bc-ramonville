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
     · pas de renommage des noms de tête dans un script CLASSIQUE : c'est
       la portée globale, elle est PARTAGÉE (voir plus bas) ;
     · rien n'est touché dans public/ — le script lit et réécrit dist/,
       et rien d'autre. Relancer un build repart toujours de la source.

   Usage : `npm run build` l'appelle après astro build. Seul.
   ===================================================================== */
import esbuild from "esbuild";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname, sep, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import vm from "node:vm";

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

/* =====================================================================
   UN SCRIPT CLASSIQUE N'A PAS DE PORTÉE À LUI. C'EST TOUTE LA QUESTION.

   La leçon des libs tierces ci-dessus n'avait été tirée qu'à MOITIÉ : on
   avait retenu « ne pas coller d'`export` dans un script classique », on
   avait manqué le reste. Un `<script>` sans `type="module"` déclare ses
   noms de tête dans la portée GLOBALE, partagée avec tous les autres
   scripts classiques de la page. `format:'esm'` dit à esbuild l'inverse —
   « ce fichier a sa propre portée » — donc il renomme librement les noms
   de tête, fichier par fichier, en repartant de a, b, c…

   Deux dégâts, tous deux mesurés sur /admin/ :

     1. LES LIAISONS SE ROMPENT. tour.js publie `guideFlow`, `ASSISTANTS`,
        `lancerVisite`, `visiteDejaVue` ; app.js les appelle par leur nom.
        Le renommage a réécrit les définitions de tour.js et pas les
        appels d'app.js — le contrat était déjà cassé.
     2. LES NOMS SE PERCUTENT. Deux fichiers renommés chacun depuis a, b,
        c retombent fatalement sur les mêmes lettres : 9 collisions de
        tête entre tour.js et app.js (C, M, S, T, m, q, v, w, y) →
        « Identifier 'm' has already been declared » → app.js ne s'exécute
        JAMAIS → tout le vestiaire inerte, avec le BON mot de passe.

   LA CORRECTION EST À LA RACINE, ET ELLE VAUT POUR TOUT LE DÉPÔT : on ne
   devine plus la nature d'un fichier, on la LIT dans le HTML livré. Tout
   script chargé en classique est minifié SANS `format` — esbuild sait
   alors que la portée de tête est globale et n'y touche pas (les noms
   internes aux fonctions, eux, sont raccourcis comme avant). Les modules
   gardent `format:'esm'`, où le renommage est sans danger.

   Et parce qu'une règle non vérifiée est une règle qui rouille, deux
   gardes ci-dessous REJOUENT le navigateur et font ÉCHOUER le build.
   ===================================================================== */

/* Qui est chargé comment ? La réponse est dans les pages livrées, pas
   dans nos souvenirs. On lit chaque <script src> de chaque .html. */
const classiques = new Set();          // chemins disque des scripts classiques
const pages = new Map();               // page .html → [scripts classiques, dans l'ordre]
const avantApres = new Map();          // script classique → { source, final }

const versDisque = (src) => {
  const chemin = src.split("?")[0].split("#")[0];
  if (!chemin.startsWith("/")) return null;      // externe (http…) : pas à nous
  return resolve(join(DIST, chemin));
};

for await (const f of fichiers(DIST)) {
  if (extname(f) !== ".html") continue;
  const html = await readFile(f, "utf8");
  const liste = [];
  for (const [, attrs] of html.matchAll(/<script\b([^>]*)>/gi)) {
    const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (!src) continue;                                        // script en ligne
    const type = attrs.match(/\btype\s*=\s*["']([^"']*)["']/i);
    const t = (type?.[1] || "").trim().toLowerCase();
    if (t === "module" || (t && t !== "text/javascript" && t !== "application/javascript")) continue;
    const disque = versDisque(src[1]);
    if (!disque) continue;
    classiques.add(disque);
    liste.push(disque);
  }
  if (liste.length) pages.set(f, liste);
}

for await (const f of fichiers(DIST)) {
  const ext = extname(f);
  if (ext !== ".js" && ext !== ".css") continue;
  if (f.includes(TIERS)) continue;

  /* Un script classique n'a pas de portée à lui : pas de `format`, donc
     esbuild laisse les noms de tête intacts. Sinon : module, `esm`. */
  const classique = classiques.has(resolve(f));
  const source = await readFile(f, "utf8");
  if (classique && ext === ".js") avantApres.set(resolve(f), { source, final: source });
  const sortie = ext === ".css"
    ? (await esbuild.transform(source, { loader: "css", minify: true, legalComments: "none" })).code
    : (await esbuild.transform(source, {
        minify: true, target: "es2020", legalComments: "none",
        ...(classique ? {} : { format: "esm" }),
      })).code;

  /* Filet : si la minification RENVOIE PLUS GROS (fichier déjà minifié,
     cas dégénéré), on garde la source. On ne perd jamais d'octets à
     vouloir en gagner. */
  if (sortie.length >= source.length) continue;

  await writeFile(f, sortie);
  if (classique && ext === ".js") avantApres.set(resolve(f), { source, final: sortie });
  brutAvant += source.length; brutApres += sortie.length;
  zipAvant += gz(source);     zipApres += gz(sortie);
  n++;
}

console.log(
  `[minify] ${n} fichiers · brut ${ko(brutAvant)} → ${ko(brutApres)} ` +
  `(-${ko(brutAvant - brutApres)}) · gzip ${ko(zipAvant)} → ${ko(zipApres)} ` +
  `(-${ko(zipAvant - zipApres)})`
);

/* =====================================================================
   LES DEUX GARDES — ON REJOUE LE NAVIGATEUR, ET ON CASSE LE BUILD.

   Le réglage ci-dessus est juste aujourd'hui. Un réglage juste qui n'est
   pas vérifié redevient faux au premier coup de main suivant : c'est
   exactement ce qui s'est produit. Alors on ne se fie pas au réglage, on
   MESURE son effet — et sur le fichier livré, pas sur l'intention.

   V8 met les `let` / `const` / `class` de tête d'un script classique dans
   la portée lexicale globale, PARTAGÉE. `vm.runInContext` reproduit ça à
   l'identique : deux scripts joués dans un même contexte se percutent
   exactement comme dans l'onglet. C'est le navigateur, sans le navigateur.

   Un échec ici doit ARRÊTER le build. Une page morte qui part en ligne
   coûte infiniment plus cher qu'un build rouge.
   ===================================================================== */
const joue = (ctx, code, nom) => {
  try { vm.runInContext(code, ctx, { filename: nom, timeout: 10000 }); return null; }
  catch (e) { return e; }
};
/* Les erreurs d'EXÉCUTION (`document` absent hors navigateur) ne nous
   regardent pas : les déclarations de tête sont enregistrées AVANT la
   moindre ligne exécutée. Seule la collision de déclaration compte. */
const collision = (e) => !!e && /has already been declared/.test(String(e && e.message));
const court = (f) => f.slice(DIST.length + 1).replace(/\\/g, "/");
const fatal = [];

/* --- GARDE 1 · les noms de tête d'un script classique sont INTOUCHÉS ---
   Astuce : on rejoue la SOURCE puis le MINIFIÉ dans le même contexte. Si
   les noms de tête ont survécu, ils se percutent avec eux-mêmes — la
   collision est le résultat ATTENDU. Son ABSENCE prouve un renommage.
   (On ne teste que les fichiers qui ont bien des noms lexicaux de tête :
   on le détermine en rejouant la source contre elle-même.) */
for (const [f, { source, final }] of avantApres) {
  const temoin = vm.createContext({});
  joue(temoin, source, f);
  if (!collision(joue(temoin, source, f))) continue;   // rien de lexical en tête

  const ctx = vm.createContext({});
  joue(ctx, source, f);
  if (!collision(joue(ctx, final, f)))
    fatal.push(`${court(f)} : les noms de tête ont été RENOMMÉS par la minification. ` +
               `Un script classique partage la portée globale — ses noms sont un contrat public.`);
}

/* --- GARDE 2 · deux scripts d'une même page ne se percutent jamais ---
   Le vrai scénario : les scripts classiques d'une page, dans l'ordre du
   HTML, dans une seule portée globale. C'est la panne d'/admin/ mot pour
   mot — sauf qu'ici elle sort en rouge dans le terminal, pas en silence
   chez le staff. Les libs tierces sont incluses : elles sont classiques
   elles aussi, donc concernées. */
for (const [page, scripts] of pages) {
  if (scripts.length < 2) continue;
  const ctx = vm.createContext({});
  for (const s of scripts) {
    let code = null;
    try { code = await readFile(s, "utf8"); } catch { continue; }
    const e = joue(ctx, code, s);
    if (collision(e))
      fatal.push(`${court(page)} : ${court(s)} percute un script chargé avant lui — ${e.message}. ` +
                 `Ce fichier ne s'exécuterait PAS dans le navigateur.`);
  }
}

if (fatal.length) {
  console.error(`\n[minify] ✕ PORTÉE GLOBALE — ${fatal.length} défaut(s), le build s'arrête :`);
  for (const m of fatal) console.error(`  · ${m}`);
  process.exit(1);
}
console.log(
  `[minify] portée globale vérifiée · ${avantApres.size} scripts classiques aux noms intacts · ` +
  `${[...pages.values()].filter((s) => s.length > 1).length} pages sans collision de tête`
);
