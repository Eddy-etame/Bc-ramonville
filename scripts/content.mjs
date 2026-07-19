/* =====================================================================
   scripts/content.mjs — le calque du vestiaire, posé dans data.js.

   Lit src/content.json (ce que le staff a publié depuis /admin/) et
   réécrit le bloc marqué `@vestiaire` de public/assets/js/data.js. Rien
   d'autre du fichier n'est touché — le script échoue bruyamment plutôt
   que d'écrire à côté des marqueurs.

   Tourne au début de `npm run build`. Sans src/content.json, il remet le
   bloc à vide : le site retombe sur data.js, tel qu'il est écrit.
   ===================================================================== */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const cible = join(racine, "public/assets/js/data.js");
const source = join(racine, "src/content.json");
const CLES = ["salle", "tarifs", "coaches", "schedule", "promos", "disciplines"];

let calque = {};
if (existsSync(source)) {
  try {
    const brut = JSON.parse(readFileSync(source, "utf8"));
    for (const k of CLES) if (brut[k] !== undefined) calque[k] = brut[k];
  } catch (e) {
    console.error("[vestiaire] src/content.json illisible — le calque reste vide.", e.message);
    calque = {};
  }
}

const js = readFileSync(cible, "utf8");
const debut = "/* @vestiaire:début */";
const fin = "/* @vestiaire:fin */";
const i = js.indexOf(debut);
const j = js.indexOf(fin);
if (i < 0 || j < 0 || j < i) {
  console.error("[vestiaire] marqueurs introuvables dans data.js — rien n'a été écrit.");
  process.exit(1);
}

const bloc = `${debut}\nconst VESTIAIRE = ${JSON.stringify(calque, null, 2)};\n${fin}`;
const sortie = js.slice(0, i) + bloc + js.slice(j + fin.length);
if (sortie !== js) writeFileSync(cible, sortie, "utf8");

const n = Object.keys(calque).length;
console.log(n ? `[vestiaire] calque posé — ${Object.keys(calque).join(", ")}.` : "[vestiaire] aucun calque — data.js parle seul.");
