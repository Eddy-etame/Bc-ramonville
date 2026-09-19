/* Écrit par scripts/generer-disciplines.mjs — ne pas modifier à la main. */
export const PAGES_DISCIPLINES = [
  {
    "key": "anglaise",
    "nom": "Boxe Anglaise",
    "href": "/activites/boxe-anglaise/",
    "coachs": [
      "Hicham",
      "Farouk"
    ]
  },
  {
    "key": "pieds-poings",
    "nom": "Boxe Pieds-Poings",
    "href": "/activites/boxe-pieds-poings/",
    "coachs": [
      "Sonia"
    ]
  },
  {
    "key": "grappling",
    "nom": "Grappling",
    "href": "/activites/grappling/",
    "coachs": [
      "Jérôme"
    ]
  },
  {
    "key": "asso-mma",
    "nom": "MMA tous niveaux",
    "href": "/activites/mma/",
    "coachs": [
      "Jérôme"
    ]
  },
  {
    "key": "boxing-camp",
    "nom": "Boxing Camp",
    "href": "/activites/boxing-camp/",
    "coachs": [
      "Sonia",
      "Hicham",
      "Jérôme",
      "Valentin Guth"
    ]
  },
  {
    "key": "lady-punch",
    "nom": "Lady Punch",
    "href": "/activites/lady-punch/",
    "coachs": [
      "Sonia"
    ]
  },
  {
    "key": "ecole",
    "nom": "École enfants",
    "href": "/activites/ecole-enfants/",
    "coachs": [
      "Valentin Guth"
    ]
  },
  {
    "key": "acces-libre",
    "nom": "Accès libre",
    "href": "/activites/acces-libre/",
    "coachs": []
  }
];
export const lienDiscipline = (cle) => (PAGES_DISCIPLINES.find((p) => p.key === cle) || {}).href || "";
