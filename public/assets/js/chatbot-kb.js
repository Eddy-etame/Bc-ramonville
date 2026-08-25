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
    /* AJOUTÉE LE 25/08. En production, « il y a t il la clim ? » recevait
       « Oui, la salle est aménagée et protégée des intempéries. » Le bot n'a
       rien inventé : il a recyclé le fait le plus proche, faute d'en avoir un
       vrai. Un trou dans la base ne produit pas un « je ne sais pas », il
       produit un oui. Et Ramonville n'est pas Portet : ici c'est couvert et
       CHAUFFÉ — pas de clim parce qu'on est dehors, pas par négligence. */
    q: "Il y a la clim ?",
    a: "Non, pas de clim — et pour une bonne raison : le plateau est dehors. " +
       "C’est couvert et chauffé l’hiver, et l’été tu as l’air libre et l’ombre. " +
       "Quand ça tape, les créneaux du midi et du soir sont les plus respirables.",
  },
  {
    label: "Le dehors",
    q: "C’est vrai qu’on s’entraîne dehors ?",
    a: "Oui, et c’est le seul plateau du réseau qui a ça : 300 m² d’entraînement extérieur, aménagés et protégés des intempéries. Couvert veut dire couvert — tu t’entraînes à l’air toute l’année, pas seulement quand il fait beau.",
  },
  {
    label: "L’octogone",
    q: "Parle-moi de l’octogone",
    a: "Un octogone de 7 mètres, grillagé. Grappling le mardi 18h40 avec Jérôme — c’est le créneau tous niveaux, celui où on ouvre la cage aux débutants. L’MMA tous niveaux, mardi et jeudi 19h45, c’est pour quand tu es prêt.",
  },
  {
    label: "Ta 1re fois",
    q: "Comment se passe la séance d’essai ?",
    a: "Tu dis à l’accueil que c’est ta première fois, un coach te prête les gants et te montre le plateau. Échauffement, technique, sac — à ton rythme, et personne ne monte sur le ring sans en avoir envie. 10 € la séance, toutes disciplines, sans engagement. Le déroulé complet est sur la page « Ta première séance ». [boutons: premiere, essai]",
  },
  {
    label: "Tarifs",
    q: "Quels sont les tarifs ?",
    a: "L’offre Rentrée : 29 € par personne pour 4 semaines illimitées, sans engagement (au lieu de 44 €). L’offre Saison : 259 € les 12 mois en 4× sans frais, accès libre aux 5 clubs. L’école enfants : 295 €/an t-shirt inclus, baby 250 €. Et l’essai à 10 € pour tester. [boutons: offre, tarifs]",
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
    a: "Boxe anglaise et anglaise loisirs, boxe pieds-poings, grappling, MMA tous niveaux dans l’octogone, Boxing Camp, Lady Punch (100 % féminin) et toute l’école enfants du Baby Boxe 3/6 aux ados 12/16. L’étage muscu/cardio est en accès libre.",
  },
  {
    label: "Les enfants",
    q: "Il y a des cours pour les enfants ?",
    a: "Dès 3 ans. Baby Boxe 3/6 le samedi 14h15, éducative 7/11 mercredi et samedi 15h, ados 12/16 mercredi et samedi 16h. Toute l’école est tenue par Valentin Guth.",
  },
  {
    label: "Les coachs",
    q: "Qui sont les coachs ?",
    a: "Cinq, pas cinquante. Jérôme est le head coach : la cage, grappling et MMA tous niveaux. Sonia tient la boxe thaï, le kickboxing et le Boxing Lady. Hicham a l’anglaise des trois midis. Farouk mène l’anglaise loisirs et compétiteurs du soir. Valentin Guth, boxeur professionnel, a toute l’école enfants.",
  },
  {
    label: "Lady Punch",
    q: "C’est quoi le Lady Punch ?",
    a: "Un créneau 100 % féminin, lundi et vendredi 18h00 – 18h40, avec Sonia. Zéro prérequis : la vraie boxe, le cardio, la frappe qui défoule, entre femmes. Il tombe juste avant le pieds-poings du soir si tu veux enchaîner.",
  },
];

/* Ordre = priorité. Le premier motif qui accroche donne la réponse. */
const RULES = [
  /* EN TÊTE, et c'est voulu : « clim » tombait sinon sur la règle du dehors
     (/couvert|intempérie/), qui répond « oui, on est protégés » — la réponse
     exacte à une AUTRE question. */
  [/clim|climatis|air.?conditionn|ventil|il fait (chaud|froid)|temp[ée]rature|canicule/i, 0],
  [/dehors|ext[ée]rieur|plein air|300|couvert|intemp[ée]rie|ciel/i, 1],
  [/octogone|cage|mma|grappling|sol|soumission/i, 2],
  [/essai|d[ée]couvr|tester|premi[èe]re|essayer|10\s?€/i, 3],
  [/tarif|prix|co[ûu]te|combien|abonn|duo|saison|mensuel|annuel/i, 4],
  [/horaire|ouvert|ferm|heure|dimanche|[ée]margement/i, 5],
  [/adresse|o[ùu]\b|situ|acc[èe]s|m[ée]tro|bus|parking|venir|plan|rue|rocade/i, 6],
  [/discipline|cours|anglaise|pieds.?poings|camp|muscu|cardio|libre|boxe/i, 7],
  [/enfant|gamin|baby|ado|fils|fille|ans\b|[ée]cole|[ée]ducative/i, 8],
  [/coach|entra[îi]neur|prof|encadr|[ée]quipe|sonia|j[ée]r[ôo]me|farouk|valentin/i, 9],
  [/lady|femme|f[ée]minin|meuf|entre filles/i, 10],
];

export function fallbackAnswer(msg) {
  for (const [re, i] of RULES) if (re.test(msg)) return QUICKS[i].a;
  return "Je peux te répondre sur le plateau extérieur, l’octogone, les créneaux, les tarifs ou l’école enfants. Pose ta question — ou appelle la salle au 05 62 24 46 82.";
}
