/* Écrit par scripts/generer-disciplines.mjs — ne pas modifier à la main. */
export const PAGES_DISCIPLINES = [
  {
    "key": "anglaise",
    "nom": "Boxe Anglaise",
    "href": "/activites/boxe-anglaise/"
  },
  {
    "key": "pieds-poings",
    "nom": "Boxe Pieds-Poings",
    "href": "/activites/boxe-pieds-poings/"
  },
  {
    "key": "grappling",
    "nom": "Grappling",
    "href": "/activites/grappling/"
  },
  {
    "key": "asso-mma",
    "nom": "MMA tous niveaux",
    "href": "/activites/mma/"
  },
  {
    "key": "boxing-camp",
    "nom": "Boxing Camp",
    "href": "/activites/boxing-camp/"
  },
  {
    "key": "lady-punch",
    "nom": "Lady Punch",
    "href": "/activites/lady-punch/"
  },
  {
    "key": "ecole",
    "nom": "École enfants",
    "href": "/activites/ecole-enfants/"
  },
  {
    "key": "acces-libre",
    "nom": "Accès libre",
    "href": "/activites/acces-libre/"
  }
];
export const lienDiscipline = (cle) => (PAGES_DISCIPLINES.find((p) => p.key === cle) || {}).href || "";
