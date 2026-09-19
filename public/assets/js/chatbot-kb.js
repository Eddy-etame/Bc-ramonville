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

/* Le planning, pour les deux réponses qui dépendent de lui : l’âge d’un
   enfant et « ce soir / demain ». Alias propre : aucune collision possible. */
import { SCHEDULE as PLANNING_KB } from "./data.js?v=25";

export const QUICKS = [
  {
    /* AJOUTÉE LE 25/08. En production, « il y a t il la clim ? » recevait
       « Oui, la salle est aménagée et protégée des intempéries. » Le bot n'a
       rien inventé : il a recyclé le fait le plus proche, faute d'en avoir un
       vrai. Un trou dans la base ne produit pas un « je ne sais pas », il
       produit un oui. Ici le plateau est dehors : couvert, NI climatisé NI
       chauffé (confirmé par Eddy le 19/09). */
    q: "Il y a la clim ?",
    a: "Non, ni clim ni chauffage — aucune de nos salles n’en a. Ici le plateau est " +
       "dehors : il est couvert et protégé des intempéries, et l’été tu as l’air libre " +
       "et l’ombre. Quand ça tape, les créneaux du midi et du soir sont les plus respirables.",
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
    a: "Tu dis à l’accueil que c’est ta première fois. Un coach t’oriente, puis tu suis la séance à ton rythme. Personne ne te met sur le ring sans ton accord. La séance d’essai coûte 10 € ; confirme le matériel requis avec la salle. [boutons: essai, contact]",
  },
  {
    label: "Tarifs",
    q: "Quels sont les tarifs ?",
    a: "La Saison — l’année complète — coûte 259 € comptant au lieu de 400 € : 12 mois, accès aux 5 clubs ; le 4× est uniquement proposé par PayPal, selon disponibilité et éligibilité. Sans engagement, l’offre Rentrée coûte 29 € par personne toutes les 4 semaines au lieu de 44 € : la première échéance se paie par carte, puis les suivantes sur IBAN ; les coordonnées d’un proche sont requises ; le badge coûte 34,99 € en plus, facturé 72 h après le début. [boutons: saison, offre, tarifs]",
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
  {
    /* 13/09 : les boutons du site mènent tous à la page « offres spéciales ». */
    q: "Quelles sont les offres spéciales ?",
    a: "Deux offres en ce moment. L’année complète à 259 € comptant au lieu de 400 € : 12 mois, accès aux 5 clubs. Et l’offre de rentrée à 29 € par personne toutes les 4 semaines au lieu de 44 €, sans engagement (badge 34,99 € en plus). Les deux sont sur la page des offres spéciales de la boutique. [boutons: promos, tarifs]",
  },
];

/* Ordre = priorité. Le premier motif qui accroche donne la réponse. */
const RULES = [
  /* EN TÊTE, et c'est voulu : « clim » tombait sinon sur la règle du dehors
     (/couvert|intempérie/), qui répond « oui, on est protégés » — la réponse
     exacte à une AUTRE question. */
  [/clim|climatis|(?<![a-zà-ÿ])chauff|air.?conditionn|ventil|il fait (chaud|froid)|temp[ée]rature|canicule/i, 0],
  [/dehors|ext[ée]rieur|plein air|300|couvert|intemp[ée]rie|ciel/i, 1],
  /* 13/09 — LES ENFANTS REMONTENT. « mon fils, quels cours ? » tombait sur
     /cours/ (la liste adulte) et « combien pour ma fille » sur les tarifs
     adultes. Et « ans\b » accrochait « dans la cage » : il faut un nombre. */
  [/enfant|gamin|b[ée]b[ée]|baby|\bados?\b|fils|fille|[ée]cole|[ée]ducative/i, 8],   // l’âge seul est traité par reponseAge (≤ 16 ans) : « j’ai 25 ans » n’est pas un enfant
  [/promo|offres? sp[ée]ciale|bon plan|r[ée]duc/i, 11],
  [/octogone|cage|mma|grappling|sol|soumission/i, 2],
  [/essai|d[ée]couvr|tester|premi[èe]re|essayer|10\s?€/i, 3],   // pas « débute » : cette réponse donne l’essai à 10 €, la dernière carte — un débutant n’y va pas d’entrée
  [/tarif|prix|co[ûu]te|combien|abonn|duo|saison|mensuel|annuel/i, 4],
  [/horaire|ouvert|ferm|heure|dimanche|[ée]margement/i, 5],
  [/adresse|o[ùu]\b|situ|acc[èe]s|m[ée]tro|bus|parking|venir|plan|rue|rocade/i, 6],
  [/discipline|cours|anglaise|pieds.?poings|camp|muscu|cardio|libre|boxe/i, 7],
  [/coach|entra[îi]neur|prof|encadr|[ée]quipe|sonia|j[ée]r[ôo]me|farouk|valentin/i, 9],
  [/lady|femme|f[ée]minin|meuf|entre filles/i, 10],
];

const JOURS_KB = { Lun: "lundi", Mar: "mardi", Mer: "mercredi", Jeu: "jeudi", Ven: "vendredi", Sam: "samedi" };
const CLES_KB = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const mn = (h) => { const m = /(\d{1,2})h(\d{2})?/.exec(h || ""); return m ? +m[1] * 60 + +(m[2] || 0) : null; };

/* L’ÂGE D’UN ENFANT → la bonne ligne de l’école, tout de suite, tirée du
   planning (jours, heure) : « mon fils a 3 ans » ne doit pas recevoir un
   catalogue. Au-delà de 16 ans, ce n’est plus l’école : les règles suivent. */
function reponseAge(msg) {
  const m = /\b(\d{1,2})\s*ans\b/i.exec(msg);
  if (!m || +m[1] > 16) return null;
  const n = +m[1];
  if (n < 3) return "L’école commence à 3 ans, avec le Baby Boxe 3/6 le samedi à 14h15. Tu peux venir voir un cours avant : les parents restent dans la salle. [boutons: enfants, contact]";
  const g = new Map();
  for (const s of PLANNING_KB.filter((x) => x.fam === "enfant")) {
    const a = /(\d+)\/(\d+)/.exec(s.cours);
    if (!a || n < +a[1] || n > +a[2]) continue;
    const e = g.get(s.cours) || { cours: s.cours, jours: [], start: s.start };
    e.jours.push(JOURS_KB[s.day]);
    g.set(s.cours, e);
  }
  const e = [...g.values()][0];
  if (!e) return null;
  const prix = /baby/i.test(e.cours) ? "250 € l’année" : "295 € l’année";
  return `À ${n} ans, c’est le cours ${e.cours} : le ${e.jours.join(" et le ")} à ${e.start}, avec Valentin Guth. ${prix}. Tu peux rester dans la salle pendant le cours. [boutons: enfants, planning]`;
}

/* « Il y a cours ce soir ? » / « demain ? » — en heure de Paris, jamais une date devinée. */
function reponseDuJour(msg) {
  if (!/aujourd|ce soir|ce midi|cet apr[èe]s|demain|maintenant|en ce moment/i.test(msg)) return null;
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  const i = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  const maint = +p.hour * 60 + +p.minute;
  const du = (cle) => PLANNING_KB.filter((s) => s.day === cle).sort((a, b) => mn(a.start) - mn(b.start));
  const liste = (l) => l.map((s) => `${s.start} ${s.cours}`).join(", ");
  if (/demain/i.test(msg)) {
    const cle = CLES_KB[(i + 1) % 7], l = du(cle);
    return l.length ? `Demain, ${JOURS_KB[cle]} : ${liste(l)}. [boutons: planning]` : "Demain, c’est dimanche : la salle est fermée. On reprend lundi dès 10h. [boutons: planning]";
  }
  if (CLES_KB[i] === "Dim") return `Le dimanche, la salle est fermée. On reprend lundi : ${liste(du("Lun"))}. [boutons: planning]`;
  const reste = du(CLES_KB[i]).filter((s) => mn(s.start) > maint);
  if (reste.length) return `Aujourd’hui, il reste : ${liste(reste)}. [boutons: planning]`;
  const cle = CLES_KB[(i + 1) % 7] === "Dim" ? "Lun" : CLES_KB[(i + 1) % 7];
  return `C’est fini pour aujourd’hui. Prochains cours ${JOURS_KB[cle]} : ${liste(du(cle))}. [boutons: planning]`;
}

export function fallbackAnswer(msg) {
  if (RULES[0][0].test(msg)) return QUICKS[0].a;           // la clim d’abord, toujours
  const direct = reponseAge(msg) || reponseDuJour(msg);
  if (direct) return direct;
  for (const [re, i] of RULES) if (re.test(msg)) return QUICKS[i].a;
  return "Je peux te répondre sur le plateau extérieur, l’octogone, les créneaux, les tarifs ou l’école enfants. Pose ta question — ou appelle la salle au 09 39 03 67 48.";
}
