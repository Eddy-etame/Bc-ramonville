/* =====================================================================
   RAMONVILLE · la lisibilité, mesurée — l'étalon est Saint-Cyprien

   POURQUOI. Le 25/08/2026, le patron : « We have to make the text simpler
   on Ramonville… onto baffled bar levels. You can really look at the Saint
   Cyprien website. » Ce n'était pas une impression. Mesure des quatre sites
   du réseau, le même jour :

                     mots/phrase   > 22 mots   incises   subordonnées
       Saint-Cyprien      8,6          4 %       0,34        0,16
       Portet             9,6          4 %       0,34        0,09
       Minimes            9,8          9 %       0,22        0,20
       RAMONVILLE        12,4         14 %       0,46        0,28

   44 % plus long que Saint-Cyprien, 3,5 fois plus de phrases
   interminables, 75 % de subordonnées en plus. Le défaut était toujours le
   même : un fait, un tiret cadratin, puis deux propositions empilées.

   Ce script relit le RENDU FINAL (dist/) et redonne ces chiffres. Il ne
   casse pas le build — la lisibilité se juge, elle ne se décrète pas — mais
   il rend la dérive visible avant qu'elle reparte en ligne.

       node scripts/verifier-lisibilite.mjs

   L'ÉTALON, gardé ici pour qu'on n'ait pas à re-scraper le réseau :
   Saint-Cyprien 8,6 mots/phrase. On vise ≤ 9,5.
   ===================================================================== */
import { readFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

const CIBLE = { mots: 9.5, longues: 5, incises: 0.35, subord: 0.18 };
const ETALON = "Saint-Cyprien : 8,6 mots/phrase · 4 % > 22 mots · 0,34 incise · 0,16 subordonnée";

/* On ne mesure que ce qu'un visiteur LIT : titres, paragraphes, items.
   Pas la nav, pas le pied de page (répétés sur huit pages), pas le JSON-LD. */
const texteDe = (html) => {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const main = s.match(/<main[\s\S]*?<\/main>/i);
  if (main) s = main[0];
  const morceaux = [];
  const re = /<(h1|h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(s))) {
    const t = m[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\s+/g, " ").trim();
    if (t.length > 12) morceaux.push(t);
  }
  return morceaux;
};

const mesure = (morceaux) => {
  let phr = 0, mots = 0, longues = 0, incises = 0, subord = 0;
  const pires = [];
  for (const bloc of morceaux) {
    for (const p of bloc.split(/(?<=[.!?])\s+/)) {
      const t = p.trim();
      if (t.length < 12) continue;
      const n = t.split(/\s+/).length;
      phr++; mots += n;
      if (n > 22) { longues++; pires.push([n, t]); }
      incises += (t.match(/—|\(|\s:\s|;/g) || []).length;
      subord += (t.match(/\b(qui|que|dont|où|lorsque|quand|parce que|alors que|tandis que|ce qui|ce que)\b/gi) || []).length;
    }
  }
  if (!phr) return null;
  pires.sort((a, b) => b[0] - a[0]);
  return {
    phr,
    mots: +(mots / phr).toFixed(1),
    longues: Math.round((100 * longues) / phr),
    incises: +(incises / phr).toFixed(2),
    subord: +(subord / phr).toFixed(2),
    pires: pires.slice(0, 2),
  };
};

const pages = [""];
for (const e of await readdir(DIST, { withFileTypes: true })) {
  if (!e.isDirectory() || ["admin", "seance-offerte", "md", "assets", "fonts", "img"].includes(e.name)) continue;
  if (existsSync(join(DIST, e.name, "index.html"))) pages.push(e.name);
}

console.log(`\n  Étalon — ${ETALON}`);
console.log(`  Cible  — ≤ ${CIBLE.mots} mots/phrase · ≤ ${CIBLE.longues} % > 22 mots · ≤ ${CIBLE.incises} incise · ≤ ${CIBLE.subord} subordonnée\n`);
console.log(`  ${"page".padEnd(18)}${"phr".padStart(5)}${"mots".padStart(7)}${"long%".padStart(7)}${"incis".padStart(7)}${"subor".padStart(7)}`);

let tot = { phr: 0, mots: 0, longues: 0, incises: 0, subord: 0 };
const hors = [];
for (const p of pages) {
  const m = mesure(texteDe(await readFile(join(DIST, p, "index.html"), "utf8")));
  if (!m) continue;
  tot.phr += m.phr; tot.mots += m.mots * m.phr;
  tot.longues += (m.longues * m.phr) / 100;
  tot.incises += m.incises * m.phr; tot.subord += m.subord * m.phr;
  const ko = m.mots > CIBLE.mots || m.longues > CIBLE.longues;
  if (ko) hors.push([p || "accueil", m]);
  console.log(`  ${ko ? "!" : " "} ${("/" + (p || "") + "/").padEnd(16)}${String(m.phr).padStart(5)}${String(m.mots).padStart(7)}${String(m.longues).padStart(7)}${String(m.incises).padStart(7)}${String(m.subord).padStart(7)}`);
}

const g = {
  mots: +(tot.mots / tot.phr).toFixed(1),
  longues: Math.round((100 * tot.longues) / tot.phr),
  incises: +(tot.incises / tot.phr).toFixed(2),
  subord: +(tot.subord / tot.phr).toFixed(2),
};
console.log(`\n  ${"ENSEMBLE".padEnd(18)}${String(tot.phr).padStart(5)}${String(g.mots).padStart(7)}${String(g.longues).padStart(7)}${String(g.incises).padStart(7)}${String(g.subord).padStart(7)}`);

const atteint = g.mots <= CIBLE.mots && g.longues <= CIBLE.longues;
console.log(atteint
  ? `\n  Au niveau du réseau. (Saint-Cyprien : 8,6 · 4 %)`
  : `\n  ENCORE AU-DESSUS de la cible — ${g.mots} mots/phrase contre ${CIBLE.mots} visés.`);

if (hors.length) {
  console.log("\n  Les phrases les plus lourdes qui restent :");
  for (const [p, m] of hors.slice(0, 4)) {
    for (const [n, t] of m.pires) console.log(`    ${String(n).padStart(2)} mots · /${p}/ — ${t.slice(0, 130)}`);
  }
}
