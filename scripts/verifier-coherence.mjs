/* =====================================================================
   RAMONVILLE · le contrôle de cohérence — deux sources, un seul fait

   POURQUOI CE FICHIER EXISTE. Le 25/08/2026, trois défauts BLOQUANTS sur
   huit avaient la même cause : un fait corrigé à un endroit et laissé faux
   à un autre.

     · Le MMA : la fiche disait « Tous niveaux · débutants acceptés », et la
       page /activites/ affirmait dans le même écran qu'il « attend que tu
       saches déjà tenir un round » — parce que ENTREE.ouvertes ne
       connaissait pas ce libellé. Le correctif avait été posé dans
       premiere-seance/index.astro… et pas dans data.js.
     · L'alt de l'école enfants, corrigé dans GALLERY, resté faux dans
       DISCIPLINES.
     · Sur Portet, la même semaine : STATIC_INFO corrigé, liveInfo() oublié
       — et c'est liveInfo() qui parle.

   Une consigne (« pense à vérifier les deux ») s'oublie au troisième
   déploiement. Un contrôle qui casse le build, jamais. C'est la différence
   entre écrire une règle et réparer l'outil.

   Ce script tourne AVANT le build (npm run build). Il ne lit aucune page :
   il compare les données entre elles, là où la vérité doit être unique.

       node scripts/verifier-coherence.mjs
   ===================================================================== */
import { pathToFileURL } from "url";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = await import(pathToFileURL(join(ROOT, "public/assets/js/data.js")).href);
const { DISCIPLINES, SCHEDULE, TARIFS, PROMOS, GALLERY, ENTREE, COACHES } = data;

const fautes = [];
const faute = (quoi, detail) => fautes.push({ quoi, detail });

/* ------------------------------------------------------------------
   1. LE COACH D'UNE DISCIPLINE = CELUI QUI LA TIENT AU PLANNING.
   La fiche annonçait « Valentin Guth · Farouk » sur la boxe anglaise
   quand la grille donne Hicham et Farouk. Un visiteur se déplace pour
   un coach qui n'est pas là.
   ------------------------------------------------------------------ */
/* Le planning abrège : « Valentin G » y désigne Valentin Guth. data.js le
   sait déjà — chaque coach porte une clé `planning` quand son libellé de
   grille diffère de son nom affiché. On s'en sert au lieu de comparer des
   chaînes brutes, sinon le contrôle hurle sur une abréviation légitime. */
const CANON = new Map();
for (const c of COACHES || []) {
  if (c.name) CANON.set(c.name, c.name);
  if (c.planning) CANON.set(c.planning, c.name);
}
const canon = (n) => CANON.get(n) || n;
/* Le champ `coach` d'une fiche porte parfois une NOTE d'exploitation
   (« mer. midi à confirmer ») : c'est une information de planning en
   attente, pas un nom. */
const estUnNom = (n) => !/confirmer|autonomie|libre|\bà venir\b/i.test(n);

const decoupe = (s) => String(s || "").split("·").map((x) => x.trim()).filter(Boolean);
for (const d of DISCIPLINES) {
  const annonces = [...new Set(decoupe(d.coach).filter(estUnNom).map(canon))];
  if (!annonces.length) continue;
  const reels = [...new Set(SCHEDULE.filter((s) => s.disc === d.key)
    .flatMap((s) => decoupe(s.coach)).filter(estUnNom).map(canon))];
  if (!reels.length) continue;                       // pas de créneau : rien à croiser
  const fantomes = annonces.filter((a) => !reels.includes(a));
  const oublies = reels.filter((r) => !annonces.includes(r));
  if (fantomes.length) faute("coach fantôme",
    `${d.name} annonce « ${fantomes.join(" · ")} » — le planning donne « ${reels.join(" · ")} »`);
  if (oublies.length) faute("coach oublié",
    `${d.name} : « ${oublies.join(" · ")} » tient des créneaux mais n'est pas cité sur la fiche`);
}

/* ------------------------------------------------------------------
   2. LE NIVEAU D'UNE DISCIPLINE A UNE SEULE DÉFINITION.
   ENTREE.ouvertes liste les libellés qui valent « ouvert aux débutants ».
   Tout libellé de DISCIPLINES qui commence par « Tous niveaux » ou
   « Zéro prérequis » et qui manque à cette liste ferme une porte que la
   salle ouvre.
   ------------------------------------------------------------------ */
const ouvertes = new Set(ENTREE?.ouvertes || []);
for (const d of DISCIPLINES) {
  const n = String(d.niveau || "");
  const devraitEtreOuverte = /^(tous niveaux|z[ée]ro pr[ée]requis|d[ée]butant|baby|[àa] ton rythme)/i.test(n);
  if (devraitEtreOuverte && !ouvertes.has(n)) {
    faute("niveau non reconnu",
      `${d.name} : « ${n} » se lit comme ouvert aux débutants mais manque à ENTREE.ouvertes — les pages en déduiront le contraire`);
  }
}

/* ------------------------------------------------------------------
   3. UNE PHOTO NE DIT PAS AUTRE CHOSE QUE CE QU'ELLE MONTRE.
   Les fichiers ont été renommés d'après leur contenu : le nom fait foi.
   Un alt qui parle d'enfants sur « cours-de-renforcement… » ment.
   ------------------------------------------------------------------ */
const SUJETS = [
  [/enfant|baby|[ée]ducative|[ée]cole/i, /enfant|baby|educative|ecole|kids/i, "un cours d'enfants"],
  [/octogone|cage|mma|grappling/i, /octogone|cage|mma|grappling|soumission|sol/i, "l'octogone"],
  [/\bring\b/i, /\bring\b|anglaise|collectif/i, "le ring"],
  [/sac(s|\b)/i, /sac|patte|frappe|direct/i, "les sacs"],
  [/muscu|cardio|charge/i, /muscu|cardio|poulie|charge|renforcement|etage|banc|machine/i, "l'étage muscu"],
];
const verifieAlt = (chemin, alt, ou) => {
  if (!chemin || !alt) return;
  const nom = String(chemin).split("/").pop().toLowerCase();
  for (const [dansAlt, dansNom, sujet] of SUJETS) {
    if (dansAlt.test(alt) && !dansNom.test(nom)) {
      faute("alt qui ment",
        `${ou} : l'alt annonce ${sujet} sur « ${nom} » — le nom du fichier dit autre chose`);
      return;
    }
  }
};
for (const d of DISCIPLINES) verifieAlt(d.img, d.imgAlt, `DISCIPLINES/${d.name}`);
for (const g of GALLERY || []) verifieAlt(g.img, g.alt, `GALLERY/${g.zone} · ${g.place}`);

/* ------------------------------------------------------------------
   4. UN PRIX EST ÉCRIT AU MÊME ENDROIT PARTOUT.
   La chip du hero visait TARIFS[0] en dur : le jour où l'ordre des cartes
   a changé, elle a annoncé « 29 € l'essai » alors que l'essai est à 10 €.
   Un tarif se cherche par son NOM, jamais par son rang.
   ------------------------------------------------------------------ */
const parNom = (motif) => (TARIFS || []).find((t) => motif.test(t.name || ""));
const essai = parNom(/essai/i);
const rentree = parNom(/rentr[ée]e/i);
const saison = parNom(/saison/i);
if (!essai) faute("tarif introuvable", "aucune carte « essai » dans TARIFS");
if (!rentree) faute("tarif introuvable", "aucune carte « rentrée » dans TARIFS");
if (essai && rentree && essai.price === rentree.price)
  faute("prix confondus", `l'essai et la rentrée affichent le même prix (${essai.price})`);
if (rentree && PROMOS?.duo?.price && rentree.price !== PROMOS.duo.price)
  faute("prix divergent", `TARIFS dit ${rentree.price} pour la rentrée, PROMOS.duo dit ${PROMOS.duo.price}`);
if (saison && PROMOS?.saisonOffre?.price && saison.price !== PROMOS.saisonOffre.price)
  faute("prix divergent", `TARIFS dit ${saison.price} pour la saison, PROMOS.saisonOffre dit ${PROMOS.saisonOffre.price}`);

/* Et le rang ne doit servir nulle part : TARIFS[n] dans le code, c'est la
   bombe à retardement qui a explosé le 25/08. */
for (const f of ["public/assets/js/page.js", "public/assets/js/home.js", "public/assets/js/site.js"]) {
  let src = "";
  try { src = await readFile(join(ROOT, f), "utf8"); } catch { continue; }
  /* Sans retirer les commentaires, ce contrôle se déclenche sur le
     commentaire qui EXPLIQUE le piège — et il devient impossible de
     documenter la faute qu’il surveille. */
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const m = code.match(/TARIFS\[\d+\]/g);
  if (m) faute("tarif appelé par son rang",
    `${f} contient ${[...new Set(m)].join(", ")} — un rang se déplace, cherche le tarif par son nom`);
}

/* ------------------------------------------------------------------
   5. LE 10 € NE VIT QUE SUR /tarifs/. Ordre du 24/08 : partout ailleurs,
   c'est un prix que le lecteur ne peut acheter nulle part sur la page.
   ------------------------------------------------------------------ */
const { readdir } = await import("fs/promises");
for (const dir of await readdir(join(ROOT, "src/pages"), { withFileTypes: true })) {
  if (!dir.isDirectory() || dir.name === "tarifs") continue;
  let src = "";
  try { src = await readFile(join(ROOT, "src/pages", dir.name, "index.astro"), "utf8"); } catch { continue; }
  const sansCommentaires = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "");
  if (/\b10\s?(€|&nbsp;€)/.test(sansCommentaires))
    faute("le 10 € a fui", `/${dir.name}/ mentionne 10 € — il ne vit que dans la grille des tarifs`);
}

/* ------------------------------------------------------------------
   6. UN COACH CITÉ EXISTE. Les noms d'autres salles ne traversent pas.
   ------------------------------------------------------------------ */
const connus = new Set((COACHES || []).flatMap((c) => [c.name, c.planning].filter(Boolean)));
for (const s of SCHEDULE || []) {
  if (!s.coach || /autonomie|libre/i.test(s.coach)) continue;
  for (const nom of decoupe(s.coach)) {
    if (!connus.has(nom)) faute("coach inconnu",
      `le planning cite « ${nom} » (${s.day} ${s.start}) — absent de COACHES`);
  }
}

/* ------------------------------------------------------------------ */
if (fautes.length) {
  console.error(`\n[cohérence] ${fautes.length} contradiction(s) — le build s'arrête\n`);
  for (const f of fautes) console.error(`  ✗ ${f.quoi.padEnd(24)} ${f.detail}`);
  console.error("\n  Un même fait ne peut pas avoir deux versions. Corrige la source, pas la page.\n");
  process.exit(1);
}
console.log(`[cohérence] ${DISCIPLINES.length} disciplines · ${SCHEDULE.length} créneaux · ${(GALLERY || []).length} photos · ${(TARIFS || []).length} tarifs — aucune contradiction`);
