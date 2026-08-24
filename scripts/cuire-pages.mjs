/* =====================================================================
   RAMONVILLE · scripts/cuire-pages.mjs — le texte entre dans le HTML

   LE PROBLÈME, MESURÉ EN LIGNE (20/08/2026). Beaucoup de HTML servi,
   presque aucun contenu. Une fois les <script> retirés :

       /coachs      26 563 o servis  ->  1 360 o de texte
       /plannings   21 811 o servis  ->    995 o
       /tarifs      23 091 o servis  ->  1 684 o
       /activites   24 100 o servis  ->    786 o

   Autrement dit : 85 à 95 % de ce que lit un visiteur n'existait que
   dans le JavaScript. Google finit par l'exécuter, avec retard et sous
   budget ; GPTBot, ClaudeBot et PerplexityBot ne l'exécutent pas du
   tout. Les quatre pages qui portent l'offre étaient donc muettes pour
   exactement les moteurs qu'on cherche à séduire.

   CE QUE FAIT CE SCRIPT. Après le build, il écrit dans les creux le même
   contenu que le JS peindra ensuite, tiré du MÊME data.js. Balisage
   sobre (h3/p/ul) plutôt qu'une copie du rendu riche : c'est le TEXTE
   qui doit être lisible, et une copie du markup dériverait au premier
   changement de style. Chaque module fait `el.innerHTML = …` au
   chargement : le visiteur voit le rendu complet, à l'identique.

   CE QUI N'EST PAS CUIT, ET POURQUOI. #entree et #promos s'appuient sur
   des objets fortement imbriqués (compteurs de créneaux ouverts, calculs
   croisés avec le planning) : les recomposer à la main, c'est inventer
   une seconde vérité qui dérivera. Ils restent au JS.

   GARDE-FOU. Si un creux n'est plus vide ou change de nom, le script
   s'arrête en erreur au lieu de cuire à côté.

   Usage : dans `npm run build`, APRÈS cuire-galerie.mjs et AVANT
   minify.mjs — sinon le contenu cuit échappe à la minification.
   ===================================================================== */
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = (f) => pathToFileURL(join(ROOT, "public", "assets", "js", f)).href;
const { COACHES, SCHEDULE, DAYS, DISCIPLINES, TARIFS, REVIEWS } = await import(url("data.js"));

const e = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ul = (xs) => (xs && xs.length ? `<ul>${xs.map((x) => `<li>${e(x)}</li>`).join("")}</ul>` : "");

/* /coachs — qui encadre, et sur quels créneaux on le trouve */
const coachroster = COACHES.map((c) => {
  const slots = SCHEDULE.filter((s) => s.coach === c.name);
  return `<article><h3>${e(c.name)}</h3><p><b>${e(c.role || "")}</b>${
    c.tag ? ` · ${e(c.tag)}` : ""
  }</p>${c.note ? `<p>${e(c.note)}</p>` : ""}${ul(
    slots.map((s) => `${s.day} ${s.start} — ${s.cours}`)
  )}</article>`;
}).join("");

/* Le poster ecrit « Valentin G » ; c'est la cle qui relie un creneau a
   une fiche, et elle ne bouge pas. Mais cette table est ce qu'un robot
   lit SANS JavaScript : elle doit porter le nom, comme la version
   hydratee. */
const NOM_COACH = Object.fromEntries(
  COACHES.filter((c) => c.planning).map((c) => [c.planning, c.name]));
const nomDe = (c) => NOM_COACH[c] || c;

/* /plannings — la semaine. Le creux est une <table> : on écrit un vrai
   corps de tableau, pas des <section> — du HTML invalide dans une table est
   reparenté par le navigateur et casserait la page avant que le JS passe. */
const grid =
  `<caption>Planning de la semaine — Boxing Center Ramonville</caption>` +
  `<tbody>` +
  DAYS.map((j) =>
    SCHEDULE.filter((s) => s.day === j)
      .map(
        (s) =>
          `<tr><th scope="row">${e(j)} · ${e(s.start)}</th><td>${e(s.cours)}</td><td>${
            s.coach ? e(nomDe(s.coach)) : ""
          }</td></tr>`
      )
      .join("")
  ).join("") +
  `</tbody>`;

/* /activites — les disciplines, une par une */
const discs = DISCIPLINES.map(
  (d) =>
    `<article><h3>${e(d.name)}</h3><p><b>${e(d.tag || "")}</b>${
      d.coach ? ` · encadré par ${e(d.coach)}` : ""
    }</p>${d.desc ? `<p>${e(d.desc)}</p>` : ""}<p>${e(d.jours || "")}${
      d.niveau ? ` · ${e(d.niveau)}` : ""
    }</p></article>`
).join("");

/* /tarifs — les offres et les avis */
const tarifs = TARIFS.map(
  (t) =>
    `<article><h3>${e(t.name)}</h3><p><b>${e(t.price)}</b>${t.period ? ` ${e(t.period)}` : ""}${
      t.was ? ` (au lieu de ${e(t.was)})` : ""
    }</p>${t.feature ? `<p>${e(t.feature)}</p>` : ""}${ul(t.items)}</article>`
).join("");

const reviews = (REVIEWS.quotes || [])
  .map((q) => `<blockquote><p>${e(q.text)}</p><cite>${e(q.author)}</cite></blockquote>`)
  .join("");

const FOURNEES = [
  ["coachs", "coachroster", coachroster, COACHES.length + " coachs"],
  ["plannings", "grid", grid, SCHEDULE.length + " creneaux"],
  ["activites", "discs", discs, DISCIPLINES.length + " disciplines"],
  ["tarifs", "tarifs", tarifs, TARIFS.length + " offres"],
  ["tarifs", "reviews", reviews, (REVIEWS.quotes || []).length + " avis"],
];

const pages = new Map();
for (const [page, id, contenu, quoi] of FOURNEES) {
  if (!contenu) { console.error(`[pages] rien a cuire pour #${id} — donnees vides`); process.exit(1); }
  const f = join(ROOT, "dist", page, "index.html");
  if (!pages.has(f)) pages.set(f, await readFile(f, "utf8"));
  const creux = new RegExp(`(<(?:div|section|ul|ol|table|tbody)[^>]*\\s+id="${id}"[^>]*>)\\s*(</(?:div|section|ul|ol|table|tbody)>)`);
  const html = pages.get(f);
  if (!creux.test(html)) {
    console.error(`[pages] #${id} de /${page}/ n'est plus vide ou a change de forme — rien de cuit`);
    process.exit(1);
  }
  pages.set(f, html.replace(creux, `$1${contenu}$2`));
  console.log(`[pages] /${page}/ #${id} : ${quoi}`);
}
for (const [f, html] of pages) await writeFile(f, html);
console.log("[pages] contenu cuit — les 4 pages sont lisibles sans JavaScript");
