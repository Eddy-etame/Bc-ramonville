/* =====================================================================
   RAMONVILLE · scripts/cuire-llms.mjs — les fiches pour IA, recomptées

   POURQUOI CE SCRIPT EXISTE.
   public/llms.txt et public/llms-full.txt étaient écrits à la main. Le
   24/08/2026, ils déclaraient encore aux robots :
     · « coach à confirmer » sur le mercredi 12h40 et le jeudi 12h40 — deux
       créneaux attribués depuis (Hicham, Sonia) ;
     · « MMA tous niveaux », alors que la base officielle V4 impose « MMA tous
       niveaux, débutants acceptés » en public ;
     · une section « L'été » avec deux coachs de renfort (Renaud, Fayez) qui
       ne figurent sur aucune fiche de la salle, pour un planning retiré du
       site le matin même ;
     · quatre coachs, sans Hicham qui tient les trois midis.

   C'est le défaut que ce dépôt condamne par écrit dans sitemap.mjs : « rien
   de périssable dans du balisage figé ». Une liste tapée à la main à côté
   d'un tableau qui bouge finit toujours par mentir — et un fichier destiné
   aux modèles ment plus longtemps qu'une page, parce que personne ne le
   relit jamais.

   CE QU'IL FAIT. Les sections VOLATILES (disciplines, planning, rythme,
   coachs) sont recalculées depuis public/assets/js/data.js — la même source
   que les pages. Les sections de PROSE (l'établissement, le plateau, les
   tarifs, la première séance, les avis, la FAQ, le réseau) restent écrites
   à la main dans public/ : ce sont des faits qui ne se comptent pas.

   Les sections générées sont bornées par des repères HTML invisibles en
   Markdown, pour qu'on voie du premier coup d'œil ce qui est calculé et ce
   qui ne l'est pas.

   Usage : appelé par `npm run build`, avant sitemap.mjs (qui prend
   l'empreinte des fichiers servis). Écrit dans dist/.
   ===================================================================== */
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { SCHEDULE, DISCIPLINES, COACHES, DAYS } = await import(
  pathToFileURL(join(ROOT, "public", "assets", "js", "data.js")).href
);

const JOUR = { Lun: "lundi", Mar: "mardi", Mer: "mercredi", Jeu: "jeudi", Ven: "vendredi", Sam: "samedi" };
const minutes = (h) => { const [a, b] = h.replace("h", ":").split(":"); return +a * 60 + (+b || 0); };
const parJour = (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || minutes(a.start) - minutes(b.start);
const liste = (xs) => xs.length > 1 ? xs.slice(0, -1).join(", ") + " et " + xs.at(-1) : (xs[0] || "");
/* Le planning porte la cle du poster officiel (« Valentin G ») ; la fiche du
   coach porte son nom (« Valentin Guth »). On traduit a l'affichage — un
   poster fait foi sur le planning, pas sur l'etat civil. */
const NOM = Object.fromEntries(COACHES.filter((c) => c.planning).map((c) => [c.planning, c.name]));
const nomDe = (c) => NOM[c] || c;

/* --------------------------------------------------- les quatre sections */

function sectionDisciplines() {
  const out = [];
  for (const d of DISCIPLINES) {
    const slots = SCHEDULE.filter((s) => s.disc === d.key).sort(parJour);
    if (!slots.length) {
      /* l'accès libre n'a pas de créneau : ce n'est pas un zéro, c'est une
         autre nature. On lit ses horaires d'ouverture. */
      out.push(`- ${d.name} — en autonomie — ${d.jours}`);
      continue;
    }
    const jours = [...new Set(slots.map((s) => `${JOUR[s.day]} ${s.start}`))];
    out.push(`- ${d.name} — ${liste(jours)} — ${d.niveau}`);
  }
  return out.join("\n");
}

function sectionFamilles() {
  /* Les cles viennent de SCHEDULE.fam — « mma » et « feminin », pas « sol »
     ni « femme ». Les deviner faisait disparaitre deux familles sur quatre,
     dont le creneau 100 % feminin : exactement ce qu'une IA doit pouvoir
     repondre. On les lit. */
  const fams = [
    ["adulte", "Adultes"], ["enfant", "Enfants"],
    ["mma", "Grappling & MMA"], ["feminin", "Féminin"],
  ];
  const out = [`Compté sur les ${SCHEDULE.length} cours de la grille de la rentrée.`, ""];
  for (const [cle, titre] of fams) {
    const s = SCHEDULE.filter((x) => x.fam === cle);
    if (!s.length) continue;
    const jours = [...new Set(s.sort(parJour).map((x) => JOUR[x.day]))];
    const discs = [...new Set(s.map((x) => DISCIPLINES.find((d) => d.key === x.disc)?.name).filter(Boolean))];
    out.push(`- ${titre} — ${s.length} créneaux, ${jours.length > 2 ? `du ${jours[0]} au ${jours.at(-1)}` : liste(jours)} — ${discs.join(", ").toLowerCase()}`);
  }
  const libre = DISCIPLINES.find((d) => !SCHEDULE.some((s) => s.disc === d.key));
  if (libre) out.push(`- ${libre.name} — hors grille, aucun créneau ni inscription — ${libre.jours}`);
  return out.join("\n");
}

function sectionPlanning() {
  const out = [];
  for (const j of DAYS) {
    const s = SCHEDULE.filter((x) => x.day === j).sort(parJour);
    out.push(`- ${JOUR[j][0].toUpperCase()}${JOUR[j].slice(1)} : ` +
      s.map((x) => `${x.start} ${x.cours}`).join(" · "));
  }
  out.push("- Dimanche : fermé");
  return out.join("\n");
}

function sectionRythme() {
  const parJ = DAYS.map((j) => [JOUR[j], SCHEDULE.filter((s) => s.day === j).length]);
  const max = Math.max(...parJ.map(([, n]) => n));
  const midi = SCHEDULE.filter((s) => minutes(s.start) < 14 * 60).length;
  const aprem = SCHEDULE.filter((s) => minutes(s.start) >= 14 * 60 && minutes(s.start) < 17 * 60).length;
  const soir = SCHEDULE.filter((s) => minutes(s.start) >= 17 * 60).length;
  return [
    `- Total : ${SCHEDULE.length} cours encadrés par semaine, sur ${parJ.filter(([, n]) => n).length} jours`,
    `- Par jour : ${parJ.map(([j, n]) => `${j} ${n}`).join(" · ")}`,
    `- Jours les plus chargés : ${liste(parJ.filter(([, n]) => n === max).map(([j]) => j))}, ${max} cours chacun`,
    `- Répartition : ${midi} cours le midi (avant 14h), ${aprem} l'après-midi (14h–17h), ${soir} le soir (après 17h)`,
    "- Entre et autour des cours : accès libre muscu/cardio et plateau extérieur, 10h00–21h30, six jours sur sept",
  ].join("\n");
}

function sectionCoachs() {
  return COACHES.map((c) => {
    const disc = (c.disciplines || []).join(", ").toLowerCase();
    const tete = c.tag?.toLowerCase().includes("head") || c.pillar ? " — head coach" : "";
    return `- ${c.name}${tete} — ${disc}`;
  }).join("\n");
}

/* --------------------------------------------------------- le remplacement */

const SECTIONS = [
  ["disciplines", sectionDisciplines],
  ["familles", sectionFamilles],
  ["planning", sectionPlanning],
  ["rythme", sectionRythme],
  ["coachs", sectionCoachs],
];

function cuire(txt) {
  let n = 0;
  for (const [nom, faire] of SECTIONS) {
    const re = new RegExp(`(<!--calcule:${nom}-->)[\\s\\S]*?(<!--/calcule:${nom}-->)`);
    if (!re.test(txt)) continue;
    txt = txt.replace(re, `$1\n${faire()}\n$2`);
    n++;
  }
  return [txt, n];
}

let total = 0;
for (const f of ["llms.txt", "llms-full.txt"]) {
  const p = join(ROOT, "dist", f);
  const [txt, n] = cuire(await readFile(p, "utf8"));
  if (n) await writeFile(p, txt);
  total += n;
  console.log(`[llms] ${f} — ${n} section(s) recalculée(s) depuis data.js`);
}
if (!total) {
  console.error("[llms] AUCUN repère <!--calcule:…--> trouvé : les fiches IA ne sont plus reliées aux données");
  process.exit(1);
}
console.log(`[llms] ${SCHEDULE.length} cours · ${COACHES.length} coachs · ${DISCIPLINES.length} disciplines`);
