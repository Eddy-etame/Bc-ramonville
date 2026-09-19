/* Les disciplines d'un coach deviennent des liens — sans toucher au texte.

   Le rôle d'un coach (« MMA · Grappling · Forme physique ») et ses pastilles
   (« Boxe thaï », « Boxing Lady ») sont écrits à la main dans data.js. Ici, on
   reconnaît ce que chaque libellé désigne et on le relie à la page de la
   discipline. Quand un libellé peut en désigner deux (« Boxe loisirs »), c'est
   la page qui nomme ce coach qui gagne : la table vient de
   disciplines-liens.js, écrite par scripts/generer-disciplines.mjs.

   Un seul module pour l'accueil (home.js), /coachs/, et les générateurs. */
import { PAGES_DISCIPLINES } from "./disciplines-liens.js?v=1";

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* libellé → clés de discipline possibles, par ordre de préférence */
const REGLES = [
  [/\bmma\b/, ["asso-mma"]],
  [/grappling|jiu|jjb|luta/, ["grappling"]],
  [/forme physique|boxing camp|renfo|cardio/, ["boxing-camp"]],
  [/lady/, ["lady-punch"]],
  [/thai|kick|pieds|k-?1\b/, ["pieds-poings"]],
  [/enfant|ecole|baby|educative/, ["ecole"]],
  [/boxe anglaise/, ["anglaise"]],
  [/boxe loisirs?/, ["anglaise", "boxing-camp"]],
];

export function creerLiens(pages) {
  const page = (cle) => pages.find((p) => p.key === cle);
  /** L'adresse de la page de discipline que désigne ce libellé, ou "". */
  const lienLibelle = (libelle, coach = "") => {
    const n = norm(libelle);
    const r = REGLES.find(([rx]) => rx.test(n));
    if (!r) return "";
    const dispo = r[1].map(page).filter(Boolean);
    const sienne = coach ? dispo.find((p) => (p.coachs || []).includes(coach)) : null;
    return (sienne || dispo[0] || {}).href || "";
  };
  /** Le rôle en morceaux, séparateurs compris : [{ t, href? }]. */
  const morceauxRole = (role, coach = "") =>
    String(role || "").split(/(\s+[·—–&]\s+|\s*,\s+)/).map((t, i) => {
      const href = i % 2 ? "" : lienLibelle(t, coach);
      return href ? { t, href } : { t };
    }).filter((m) => m.t !== "");
  const ech = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  /** Le rôle en HTML : même texte, disciplines en liens (classe role-lien). */
  const roleHtml = (role, coach = "", sauf = "") =>
    morceauxRole(role, coach).map((m) => (m.href && m.href !== sauf ? `<a class="role-lien" href="${m.href}">${ech(m.t)}</a>` : ech(m.t))).join("");
  /** Une pastille de discipline : un lien si la page existe, le texte sinon. */
  const pastilleHtml = (libelle, coach = "", sauf = "") => {
    const href = lienLibelle(libelle, coach);
    return href && href !== sauf ? `<a class="role-lien" href="${href}">${ech(libelle)}</a>` : ech(libelle);
  };
  return { lienLibelle, morceauxRole, roleHtml, pastilleHtml };
}

export const { lienLibelle, morceauxRole, roleHtml, pastilleHtml } = creerLiens(PAGES_DISCIPLINES);
