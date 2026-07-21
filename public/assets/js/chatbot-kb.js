/* =====================================================================
   RAMONVILLE · chatbot-kb.js — le savoir du plateau, sans IA.

   Deux emplois pour un seul fichier :
     · côté visiteur, quand /api/chat ne répond pas (dev, réseau coupé) ;
     · côté serveur, quand AUCUNE clé de fournisseur n’est configurée —
       api/chat.js importe ce module et répond avec, plutôt que de rendre
       une pastille morte.

   Tous les faits viennent de data.js (posters officiels rentrée 2026).
   Aucun prix, aucun horaire, aucun nom n’est écrit ailleurs qu’ici et là.
   Voix de coach, tutoiement, pas de brochure.
   ===================================================================== */

export const QUICKS = [
  {
    label: "Le dehors",
    q: "C’est vrai qu’on s’entraîne dehors ?",
    a: "Oui, et c’est le seul plateau du réseau qui a ça : 300 m² d’entraînement extérieur, aménagés et protégés des intempéries. Couvert veut dire couvert — tu t’entraînes à l’air toute l’année, pas seulement quand il fait beau.",
  },
  {
    label: "L’octogone",
    q: "Parle-moi de l’octogone",
    a: "Un octogone de 7 mètres, grillagé. Grappling le mardi 18h40 avec Jérôme — c’est le créneau tous niveaux, celui où on ouvre la cage aux débutants. L’asso MMA, mardi et jeudi 19h45, c’est pour quand tu es prêt.",
  },
  {
    label: "Essai · 10€",
    q: "Comment se passe la séance d’essai ?",
    a: "10 € la séance, toutes disciplines, matériel prêté, sans engagement. Tu émarges, tu montes sur le plateau, tu tapes — on parle du reste après. Réservation sur box-plus.vercel.app/seance-essai ou passe au 33 rue des Ormes.",
  },
  {
    label: "Tarifs",
    q: "Quels sont les tarifs ?",
    a: "Essai 10 € la séance. Offre Duo : 29 € par personne pour 4 semaines illimitées, sans engagement. Offre Saison : 259 € les 12 mois, payable en 4× sans frais, avec l’accès libre aux 5 clubs du réseau. L’école enfants démarre dès 3 ans.",
  },
  {
    label: "Horaires",
    q: "Quels sont les horaires ?",
    a: "Du lundi au samedi, 10h00 – 21h30. Fermé le dimanche. L’étage muscu/cardio et les espaces libres sont ouverts sur toute cette plage. Un émargement GPS est demandé en salle avant chaque cours.",
  },
  {
    label: "Où c’est",
    q: "Où se trouve la salle ?",
    a: "33 rue des Ormes, 31520 Ramonville-Saint-Agne. Métro ligne B, terminus Ramonville, à proximité — bus arrêt Ramonville Sud au pied de la salle. Par la rocade : sortie Ramonville.",
  },
  {
    label: "Les cours",
    q: "Quelles disciplines proposez-vous ?",
    a: "Boxe anglaise et anglaise loisirs, boxe pieds-poings, grappling, asso MMA dans l’octogone, Boxing Camp, Lady Punch (100 % féminin) et toute l’école enfants du Baby Boxe 3/6 aux ados 12/16. L’étage muscu/cardio est en accès libre.",
  },
  {
    label: "Les enfants",
    q: "Il y a des cours pour les enfants ?",
    a: "Dès 3 ans. Baby Boxe 3/6 le samedi 14h15, éducative 7/11 mercredi et samedi 15h, ados 12/16 mercredi et samedi 16h. Toute l’école est tenue par Valentin G.",
  },
  {
    label: "Les coachs",
    q: "Qui sont les coachs ?",
    a: "Quatre, pas quarante. Sonia tient le pieds-poings, le Lady Punch et le Camp. Jérôme, c’est la cage : grappling et asso MMA. Farouk mène l’anglaise loisirs du soir. Valentin G a l’anglaise du midi et toute l’école enfants.",
  },
  {
    label: "Lady Punch",
    q: "C’est quoi le Lady Punch ?",
    a: "Un créneau 100 % féminin, lundi et vendredi 18h00 – 18h40, avec Sonia. Zéro prérequis : la vraie boxe, le cardio qui pique, entre meufs. Il tombe juste avant le pieds-poings du soir si tu veux enchaîner.",
  },
];

/* Ordre = priorité. Le premier motif qui accroche donne la réponse. */
const RULES = [
  [/dehors|ext[ée]rieur|plein air|300|couvert|intemp[ée]rie|ciel/i, 0],
  [/octogone|cage|mma|grappling|sol|soumission/i, 1],
  [/essai|d[ée]couvr|tester|premi[èe]re|essayer|10\s?€/i, 2],
  [/tarif|prix|co[ûu]te|combien|abonn|duo|saison|mensuel|annuel/i, 3],
  [/horaire|ouvert|ferm|heure|dimanche|[ée]margement/i, 4],
  [/adresse|o[ùu]\b|situ|acc[èe]s|m[ée]tro|bus|parking|venir|plan|rue|rocade/i, 5],
  [/discipline|cours|anglaise|pieds.?poings|camp|muscu|cardio|libre|boxe/i, 6],
  [/enfant|gamin|baby|ado|fils|fille|ans\b|[ée]cole|[ée]ducative/i, 7],
  [/coach|entra[îi]neur|prof|encadr|[ée]quipe|sonia|j[ée]r[ôo]me|farouk|valentin/i, 8],
  [/lady|femme|f[ée]minin|meuf|entre filles/i, 9],
];

export function fallbackAnswer(msg) {
  for (const [re, i] of RULES) if (re.test(msg)) return QUICKS[i].a;
  return "Je peux te répondre sur le plateau extérieur, l’octogone, les créneaux, les tarifs ou l’école enfants. Pose ta question — ou appelle la salle au 05 62 24 46 82.";
}
