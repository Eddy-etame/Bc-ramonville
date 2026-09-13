/* =====================================================================
   RAMONVILLE · scripts/disciplines-lib.mjs — une vérité pour les pages
   de discipline, lue par le générateur, le sitemap, le llms et la
   cuisson des fiches.

   Les faits viennent de data.js (après content.mjs, qui y pose le calque
   du vestiaire) : fiche, créneaux, coachs. Le texte long vient de
   src/disciplines-pages.json. Une discipline sans texte n'a pas de page,
   et sa fiche reste sans lien : jamais de lien mort.
   ===================================================================== */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const BASE = "https://mmatoulouse.com";

export const donnees = () => import(pathToFileURL(join(ROOT, "public", "assets", "js", "data.js")).href);
export const textes = () => JSON.parse(readFileSync(join(ROOT, "src", "disciplines-pages.json"), "utf8")).pages;

export const JOUR = { Lun: "lundi", Mar: "mardi", Mer: "mercredi", Jeu: "jeudi", Ven: "vendredi", Sam: "samedi", Dim: "dimanche" };
export const JOUR_SCHEMA = { Lun: "Monday", Mar: "Tuesday", Mer: "Wednesday", Jeu: "Thursday", Ven: "Friday", Sam: "Saturday", Dim: "Sunday" };
const ORDRE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const minutes = (h) => { const [a, b] = String(h).replace("h", ":").split(":"); return +a * 60 + (+b || 0); };

/** Les créneaux d'une discipline, dans l'ordre de la semaine. */
export function creneaux(SCHEDULE, cle) {
  return SCHEDULE.filter((s) => s.disc === cle)
    .sort((a, b) => ORDRE.indexOf(a.day) - ORDRE.indexOf(b.day) || minutes(a.start) - minutes(b.start));
}

/** « le mardi, le mercredi et le samedi » */
export function joursEnMots(liste) {
  const j = [...new Set(liste.map((s) => s.day))].map((d) => "le " + JOUR[d]);
  if (!j.length) return "";
  return j.length === 1 ? j[0] : j.slice(0, -1).join(", ") + " et " + j.at(-1);
}

export const remplir = (t, jours) =>
  !t.includes("{jours}") ? t : jours ? t.replace(/\{jours\}/g, jours) : t.replace(/,?\s*\{jours\}/g, "").replace(/\s+\./g, ".");

/** Clé de discipline → chemin de sa page (ou "" : pas de page, pas de lien). */
export function lienDe(cle, T = textes()) {
  return T[cle] ? `/activites/${T[cle].slug}/` : "";
}
