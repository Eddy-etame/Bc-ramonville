/* Écrit par scripts/generer-coachs.mjs — ne pas modifier à la main. */
export const PAGES_COACHS = [
  {
    "nom": "Jérôme",
    "href": "/coachs/jerome/"
  },
  {
    "nom": "Sonia",
    "href": "/coachs/sonia/"
  },
  {
    "nom": "Hicham",
    "href": "/coachs/hicham/"
  },
  {
    "nom": "Farouk",
    "href": "/coachs/farouk/"
  },
  {
    "nom": "Valentin Guth",
    "href": "/coachs/valentin-guth/"
  }
];
export const lienCoach = (nom) => (PAGES_COACHS.find((p) => p.nom === nom) || {}).href || "";
