/* =====================================================================
   RAMONVILLE · scripts/maillage.mjs — le réseau, écrit en dur dans la page

   LE DÉFAUT. Le maillage de marque (le groupe, la boutique, les quatre
   salles sœurs) était bien rendu — mais par site.js, à l'exécution. Le
   HTML LIVRÉ, lui, ne contenait pas un seul de ces liens : le pied de
   page partait en `<div id="footer"></div>`, vide. Un robot qui n'exécute
   pas le JavaScript — et c'est le cas d'une bonne partie des moteurs de
   réponse — téléchargeait donc une page sans le moindre lien vers le
   réseau. Tout l'intérêt du maillage tombait : on liait le réseau pour
   les machines, et seules les machines ne le voyaient pas.

   LA CORRECTION. On écrit le maillage dans le HTML de chaque page livrée,
   À L'INTÉRIEUR de `<div id="footer">`. site.js commence son montage par
   `document.getElementById("footer").innerHTML = …` : ce bloc est donc
   remplacé intégralement dès que le JavaScript tourne. Le rendu final ne
   bouge pas d'un pixel — c'est vérifié en rejouant les deux rendus — et
   avant le JavaScript, le robot (comme le visiteur sans JS, qui n'avait
   RIEN jusqu'ici) trouve de vraies balises <a href>.

   UNE SEULE SOURCE DE VÉRITÉ. Les liens ne sont pas recopiés à la main :
   ils sont lus dans data.js, exactement comme site.js les lit. Ajouter
   une salle au réseau met à jour le rendu ET le HTML statique du même
   geste — les deux ne peuvent pas diverger.

   PAS DE `nofollow`, comme dans site.js : ce n'est ni du lien payé ni du
   contenu tiers, c'est le maillage de marque du même propriétaire. On
   garde `noopener` (sécurité de l'onglet), rien de plus. Les classes sont
   celles du pied de page rendu : si ce bloc est vu (JS coupé, réseau
   lent), il est déjà à sa place et à la charte — jamais des liens nus.

   Usage : `npm run build` l'appelle après astro build, avant minify.
   ===================================================================== */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

const { LINKS, NETWORK } = await import(
  pathToFileURL(join(ROOT, "public/assets/js/data.js")).href
);

async function* fichiers(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* fichiers(p);
    else yield p;
  }
}

/* Une page peut contenir une apostrophe droite ou un « & » dans un nom de
   salle : on échappe ce qui part dans un attribut, jamais de concaténation
   naïve dans du HTML. */
const attr = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const lien = (href, label, titre) =>
  `<a href="${attr(href)}" target="_blank" rel="noopener"` +
  `${titre ? ` title="${attr(titre)}"` : ""}>${attr(label)}</a>`;

/* Les sœurs : les vraies salles du réseau, Ramonville retirée (c'est ici).
   Même filtre que site.js — même liste, même ordre, mêmes libellés. */
const soeurs = (NETWORK || []).filter((s) => !s.self);

const MAILLAGE =
  `<footer class="footer"><div class="wrap"><div class="footer__links">` +
  `<div class="footer__col"><h4>Le réseau</h4>` +
  lien(LINKS.groupe, "Le site officiel — boxingcenter.fr", "Le site du réseau Boxing Center") +
  lien(LINKS.boutique, "La boutique — box-plus", "box-plus — la boutique Boxing Center") +
  `</div>` +
  `<div class="footer__col"><h4>Les salles sœurs</h4>` +
  soeurs.map((s) => lien(s.url, s.name, `${s.name} — ${s.feat}`)).join("") +
  `</div></div></div></footer>`;

const CIBLE = '<div id="footer"></div>';
let n = 0;
for await (const f of fichiers(DIST)) {
  if (extname(f) !== ".html") continue;
  const html = await readFile(f, "utf8");
  if (!html.includes(CIBLE)) continue;          // /admin/ n'a pas de pied de page
  await writeFile(f, html.replace(CIBLE, `<div id="footer">${MAILLAGE}</div>`));
  n++;
}

console.log(
  `[maillage] ${n} pages · ${2 + soeurs.length} liens du réseau écrits en dur ` +
  `(groupe, boutique, ${soeurs.length} salles sœurs) · remplacés par site.js au montage`
);
