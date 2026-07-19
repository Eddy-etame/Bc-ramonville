/* =====================================================================
   BOXING CENTER — RAMONVILLE · « L'OCTOGONE À CIEL OUVERT »
   data.js — content source of truth (maquette). Plain ES module → Astro/Next.

   Le monde : la seule salle du réseau qui s'entraîne DEHORS. 300 m²
   extérieurs aménagés et protégés des intempéries, un octogone de 7 m, un
   ring olympique, deux niveaux avec un étage muscu/cardio. Registre
   documentaire — la nuit dehors, le ciel réel au-dessus de la cage.

   RÈGLES : tout fait vient des posters officiels 2026-2027 + du site
   boxingcenter.fr (brief §3). Noms de coachs ≡ photos (roster.json), jamais
   croisés. Aucun claim périssable dans les pages : la saison passe par la
   constante SEASON, les promos vivent dans PROMOS (jamais en dur ailleurs).
   Version d'assets unique : ?v=11 partout (imports compris).
   ===================================================================== */

/* Anti-péremption — tout libellé de saison passe par ces constantes. */
export const SEASON = "2026-2027";
export const SEASON_LABEL = "Saison 2026 — 2027";

/* ------------------------------------------------------------------ *
 *  LE CALQUE DU VESTIAIRE — bloc GÉNÉRÉ, ne pas écrire dedans à la main.
 *
 *  `npm run build` le remplit depuis src/content.json, c'est-à-dire
 *  depuis ce que le staff a publié dans /admin/. Vide (le cas normal),
 *  c'est data.js qui parle, mot pour mot : le vestiaire ne peut pas
 *  vider le site par mégarde, il ne peut que SURCHARGER un champ.
 *
 *  Le calque est écrit ICI, dans le fichier, plutôt qu'importé d'un
 *  module voisin : un import de plus, c'est un aller-retour réseau de
 *  plus, sur les huit pages, pour un objet qui pèse deux octets la
 *  plupart du temps. (loi n°3 — la perf ne doit que monter)
 * ------------------------------------------------------------------ */
/* @vestiaire:début */
const VESTIAIRE = {};
/* @vestiaire:fin */

/* Surcharge champ par champ. Un objet est fusionné (on ne perd pas les
   clés que le staff n'a pas touchées) ; une liste est remplacée en bloc
   (retirer un tarif doit pouvoir retirer un tarif). */
const calque = (base, cle) =>
  VESTIAIRE[cle] === undefined
    ? base
    : Array.isArray(base)
      ? VESTIAIRE[cle]
      : { ...base, ...VESTIAIRE[cle] };

const _SALLE = {
  id: "ramonville",
  name: "Boxing Center Ramonville",
  short: "Ramonville",
  baseline: "L'octogone à ciel ouvert.",
  district: "Ramonville-Saint-Agne · sud toulousain",

  address: {
    street: "33 rue des Ormes",
    zip: "31520",
    city: "Ramonville-Saint-Agne",
    full: "33 rue des Ormes, 31520 Ramonville-Saint-Agne",
  },
  // Ciel réel — coordonnées Ramonville pour Open-Meteo (sky.js)
  geo: { lat: 43.546, lon: 1.474 },
  access: [
    "Métro ligne B — terminus Ramonville, à proximité",
    "Bus — arrêt Ramonville Sud, au pied de la salle",
    "Sud toulousain — sortie rocade Ramonville",
  ],
  phone: "05 62 24 46 82",
  phoneHref: "+33562244682",
  email: "boxingcenter31@gmail.com",
  hours: "Lun – Sam · 10h00 – 21h30",
  hoursData: [
    { d: "Lundi – Vendredi", h: "10h00 – 21h30" },
    { d: "Samedi", h: "10h00 – 21h30" },
    { d: "Dimanche", h: "Fermé" },
  ],
  federations: ["FFBoxe", "FFKMDA", "FMMAF"],
  // émargement GPS obligatoire en salle (posters officiels)
  note: "Émargement GPS obligatoire en salle avant chaque cours.",
  mapsUrl: "https://www.google.com/maps?q=33%20rue%20des%20Ormes%2031520%20Ramonville-Saint-Agne&output=embed",
  mapsLink: "https://maps.google.com/?q=33+rue+des+Ormes+31520+Ramonville-Saint-Agne",
  // fait LD-JSON possible (brief §3) — JAMAIS en headline
  foundingDate: "2019-09",
};

/* Conversion — TOUT pointe vers box-plus (liens vérifiés 2026-07-12). */
export const LINKS = {
  essai: "https://box-plus.vercel.app/seance-essai",       // CTA principal — essai 10€
  abos: "https://box-plus.vercel.app/abonnements",
  promos: "https://box-plus.vercel.app/abonnements#promotions",
  enfants: "https://box-plus.vercel.app/abonnements#enfants",
  coachings: "https://box-plus.vercel.app/coachings",
  boutique: "https://box-plus.vercel.app/materiel",
  groupe: "https://boxingcenter.fr/",
  facebook: "https://www.facebook.com/BoxingCenterToulouse/",
  instagram: "https://www.instagram.com/boxingcentertoulouse/",
  google: "https://maps.google.com/?q=Boxing+Center+Ramonville+Saint+Agne",
};

export const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/la-salle/", label: "Le plateau" },
  { href: "/activites/", label: "Activités" },
  { href: "/coachs/", label: "Coachs" },
  { href: "/galerie/", label: "Galerie" },
  { href: "/plannings/", label: "Planning" },
  { href: "/tarifs/", label: "Tarifs" },
  { href: "/contact/", label: "Contact" },
];

/* Les chiffres du plateau — compteurs (brief §5). raw = pas d'animation. */
/* MÊMES CHIFFRES, DEUX LÉGENDES. `l` est lue par le hero de l'accueil,
   `rail` par le bandeau de /la-salle/. Les deux pages affichaient jusqu'ici
   les quatre mêmes lignes mot pour mot — une trentaine de mots identiques
   entre les deux URL qui comptent le plus, et la règle de la maison est
   qu'une formule ne sert qu'une fois. Les nombres, eux, ne bougent pas :
   ils sont le fait, et ils restent écrits à un seul endroit. L'accueil dit
   CE QUE C'EST ; le plateau, page de visite, dit CE QUE ÇA FAIT sur place. */
export const STATS = [
  { v: 7, suffix: " m", l: "l'octogone, sous le ciel", rail: "la cage, en plein air" },
  { v: 300, suffix: " m²", l: "d'extérieur couvert, aménagé", rail: "dehors, et à l'abri de la pluie" },
  { v: 2, suffix: "", l: "niveaux, étage muscu/cardio", rail: "niveaux : le plateau, puis la muscu" },
  { v: 6, suffix: " j/7", l: "de 10h à 21h30, accès libre inclus", raw: true, rail: "jours ouverts, 10h–21h30" },
];

/* ------------------------------------------------------------------ *
 *  LES 8 ARÊTES — l'octogone est la navigation (brief §2).
 *  8 côtés = 8 entrées. `edge` = ordre sur l'octogone (0 en haut,
 *  sens horaire). Chaque discipline pointe vers son ancre /activites/.
 *  Créneaux & coachs = posters officiels rentrée 2026 (brief §3, roster).
 * ------------------------------------------------------------------ */
const _DISCIPLINES = [
  {
    key: "anglaise",
    edge: 0,
    name: "Boxe Anglaise",
    tag: "Le noble art",
    famille: "adulte",
    coach: "Valentin G · Farouk",
    jours: "Anglaise mar. & ven. 12h40 · Loisirs lun./mer./ven. 19h45",
    niveau: "Débutant → confirmé",
    desc: "Jab, esquive, jeu de jambes. Les midis pour le geste propre, les soirs en loisirs quand la salle se remplit et que les frappes couvrent le bruit du dehors. Le fondamental de la maison.",
    img: "/assets/img/ram/anglaise.webp",
  },
  {
    key: "pieds-poings",
    edge: 1,
    name: "Boxe Pieds-Poings",
    tag: "Tibias & poings",
    famille: "adulte",
    coach: "Sonia",
    jours: "Mer. 12h40 · lun. & ven. 18h40",
    niveau: "Tous niveaux",
    desc: "Poings, tibias, genoux : la boxe la plus complète, menée par Sonia. Trois créneaux par semaine, du midi qui réveille au soir qui vide les jambes.",
    img: null,
  },
  {
    key: "grappling",
    edge: 2,
    name: "Grappling",
    tag: "Le sol",
    famille: "mma",
    coach: "Jérôme",
    jours: "Mardi · 18h40",
    niveau: "Tous niveaux",
    desc: "Contrôle, projections, soumissions au sol, dans l'octogone de 7 m. Jérôme y fait travailler la partie que la boxe ignore — celle qui finit les combats.",
    img: "/assets/img/ram/octogone.webp",
  },
  {
    key: "asso-mma",
    edge: 3,
    name: "Asso MMA",
    tag: "Dans la cage",
    famille: "mma",
    coach: "Jérôme",
    jours: "Mardi & jeudi · 19h45 – 21h15",
    niveau: "Confirmé · asso",
    desc: "Le créneau association : MMA complet dans l'octogone, debout et au sol. Deux soirs par semaine avec Jérôme, quand la cage est à nous et que le plateau, à deux pas, reste ouvert sur le soir.",
    img: null,
  },
  {
    key: "boxing-camp",
    edge: 4,
    name: "Boxing Camp",
    tag: "Le condensé",
    famille: "adulte",
    coach: "Sonia · Farouk · Jérôme · Valentin G",
    jours: "Lun./jeu. 12h40 · mer./jeu. 18h40 · sam. 11h",
    niveau: "Tous niveaux",
    desc: "Le format signature Boxing Center : technique, cardio et sacs dans une seule séance dense. Cinq créneaux, quatre coachs — le meilleur point d'entrée si tu hésites encore.",
    img: "/assets/img/ram/camp.webp",
  },
  {
    key: "lady-punch",
    edge: 5,
    name: "Lady Punch",
    tag: "100 % féminin",
    famille: "feminin",
    coach: "Sonia",
    jours: "Lundi & vendredi · 18h00 – 18h40",
    niveau: "Zéro prérequis",
    desc: "Un créneau à elles avant le pieds-poings du soir : la vraie boxe, le cardio qui pique, la frappe qui défoule — entre meufs, personne pour te reluquer. Sonia tient la porte.",
    img: null,
  },
  {
    key: "ecole",
    edge: 6,
    name: "École enfants",
    tag: "Dès 3 ans",
    famille: "enfant",
    coach: "Valentin G",
    jours: "Baby 3/6 sam. 14h15 · 7/11 mer./sam. 15h · 12/16 mer./sam. 16h",
    niveau: "Baby → ados",
    desc: "Du Baby Boxe dès 3 ans à l'éducative ados : tenir sa garde, attendre son tour, taper juste. Valentin G tient toute l'école, le mercredi et le samedi après-midi.",
    img: null,
  },
  {
    key: "acces-libre",
    edge: 7,
    name: "Accès libre",
    tag: "Muscu · cardio",
    famille: "libre",
    coach: "En autonomie",
    jours: "Lun. – sam. · 10h00 – 21h30",
    niveau: "À ton rythme",
    desc: "L'étage muscu/cardio et les espaces d'entraînement libres, ouverts six jours sur sept. Charges, machines, sacs : personne ne te dira quand venir.",
    img: "/assets/img/ram/muscu.webp",
  },
];

/* ------------------------------------------------------------------ *
 *  LE RELEVÉ DU DEHORS — le différenciateur, en fiche documentaire.
 *
 *  Les 300 m² extérieurs sont LE fait qui distingue Ramonville, et c'est
 *  le seul lieu de la salle dont on n'a AUCUN cliché : les six photos
 *  prouvées sont toutes prises à couvert. Pendant trois versions, ce trou
 *  a été traité en « tuile photo à venir » — c'est-à-dire en excuse : un
 *  cadre gris au milieu de cinq vraies photos, qui se lit « inachevé ».
 *
 *  Le parti pris tient en une phrase : un espace extérieur n'a pas de
 *  photographie fidèle, il a un CIEL. Le cadre n'est donc pas vide — il
 *  contient la seule image vraie qu'on puisse en donner : le ciel réel
 *  au-dessus des 300 m², à la seconde, via Open-Meteo (sky.js). Autour,
 *  un relevé de terrain : ce qui est mesuré, et ce qui ne l'est pas
 *  encore, dit franchement, dans le même registre que la fiche du pied
 *  de page. Rien à cacher, rien à inventer, rien qui ait l'air en attente.
 * ------------------------------------------------------------------ */
export const DEHORS = {
  eyebrow: "Relevé de terrain",
  t: "L'extérieur couvert",
  surface: "300 m²",
  claim: "Le seul plateau du réseau qui a un ciel pour plafond.",
  // NE REPREND PAS la formule de la section « 300 m² plein ciel » plus haut
  // (« couvert veut dire couvert… ») : une bonne phrase ne se dit qu'une fois
  // par site. Celle-ci pose le registre du relevé, pas le claim.
  lead: "Ce qu'on sait mesurer d'un lieu qu'on n'a pas encore photographié : sa surface, sa couverture, ses heures — et le ciel qu'il a au-dessus, qui lui se relève en direct.",
  /* les quatre lignes mesurées — verbatims officiels, rien d'ajouté */
  mesures: [
    // « d'un seul tenant » a été retiré : aucune source ne dit que les 300 m²
    // sont contigus. Le relevé ne note que ce qui est écrit noir sur blanc —
    // c'est tout l'intérêt d'un relevé.
    { k: "Surface", v: "300 m²", d: "d'entraînement extérieur, aménagés" },
    { k: "Couverture", v: "Couvert", d: "protégé des intempéries" },
    { k: "Ouverture", v: "Toute l'année", d: "six jours sur sept, 10h – 21h30" },
    // « l'air du dehors, pas un mur » appartient déjà au bloc RDC de la coupe
    // (/la-salle/) : une bonne phrase ne se dit qu'une fois par site.
    { k: "Plafond", v: "Le ciel", d: "aucune autre salle du réseau n'a ça" },
  ],
  /* la ligne qu'on n'a pas — assumée, au même format que les autres */
  nonReleve: {
    k: "Cliché",
    v: "Non relevé",
    d: "Les six photos du carnet sont prises à couvert. Aucune ne montre le dehors — on ne montre que ce qu'on a filmé.",
  },
  /* la légende du cadre vivant (le ciel remplace la photo absente) */
  cadre: {
    k: "Au-dessus des 300 m²",
    d: "Relevé en direct — Open-Meteo, station de Ramonville-Saint-Agne.",
  },
};

/* ------------------------------------------------------------------ *
 *  L'ARPENTAGE — le différenciateur DESSINÉ, sans rien inventer.
 *
 *  Le cadre au ciel réel disait la vérité mais ne montrait rien : 571 × 689
 *  px de nuit presque vide (≈ 280 pixels allumés en plein midi, l'heure où
 *  il n'y a pas d'étoiles). Une intention juste rendue en rectangle noir se
 *  lit comme une image qui n'a pas chargé — exactement ce qu'on voulait
 *  éviter. Le concept n'était pas faux, il était NU.
 *
 *  On l'arpente donc au lieu de le photographier. Deux faits, deux seuls,
 *  tous deux officiels : la SURFACE (300 m²) et la CAGE (7 m). On dessine
 *  trois cents carrés d'un mètre — un COMPTE, pas un plan — et l'octogone
 *  de 7 m à la même échelle, à côté, comme étalon. Le lecteur voit enfin
 *  la démesure du plateau, mesurée contre un objet qu'il connaît.
 *
 *  CE QU'ON NE DESSINE PAS : la forme. Aucune source ne dit si les 300 m²
 *  sont un carré, un L ou une bande. Les carrés sont donc rangés pour être
 *  COMPTÉS, jamais pour figurer un terrain — et la légende le dit en toutes
 *  lettres. Un relevé qui avoue sa lacune reste un relevé ; un plan inventé
 *  serait le seul vrai mensonge du site.
 * ------------------------------------------------------------------ */
export const ARPENT = {
  unit: 1,            // le carré étalon — 1 m²
  count: 300,         // 300 m² (poster officiel) → 300 carrés
  /* RANGEMENT, PAS EMPRISE. Les carrés sont posés pour être COMPTÉS : le
     nombre de colonnes n'affirme donc aucune dimension du plateau, et on le
     choisit pour la composition — 15 × 20, debout, à côté de l'étalon.
     UN SEUL rangement, parce qu'il n'y a plus qu'UNE planche par page : la
     variante couchée servait une tuile de station qui redessinait les mêmes
     300 carrés à trente centimètres du grand relevé, avec son compteur et
     sa barre météo en double sur le même écran. Un relevé qui se répète
     n'est plus un relevé, c'est un motif. */
  cols: 15, rows: 20,             // le relevé, seule planche du site
  cage: 7,            // l'octogone — 7 m, même échelle
  kUnit: "1 m²",
  kField: "300 × 1 m²",
  kCage: "L'octogone · 7 m",
  scale: "Même échelle",
  // la phrase qui tient tout le parti pris — elle ne se dit qu'ICI
  honest: "La surface est relevée. La forme ne l'est pas — on ne la dessine donc pas.",
  legend: "Trois cents carrés d'un mètre, rangés pour être comptés. À droite, la cage de 7 m au même étalon : c'est l'écart entre ce que tu connais déjà et ce qui t'attend dehors.",
};

/* ------------------------------------------------------------------ *
 *  LE PLATEAU — la visite du terrain (page /la-salle/). L'extérieur
 *  d'abord : c'est le différenciateur. Puis l'octogone, le ring, l'étage.
 *  Specs = verbatims officiels (brief §3), rien d'inventé.
 * ------------------------------------------------------------------ */
export const PLATEAU = [
  {
    n: "01",
    t: "L'extérieur couvert",
    tag: "300 m² · protégés des intempéries",
    d: "300 m² d'entraînement dehors, aménagés et protégés des intempéries. La seule salle du réseau où l'air, le ciel et le soir font partie de la séance. Tu t'échauffes sous les étoiles, tu récupères au grand air.",
    // Pas de photo : les 6 clichés prouvés de la salle sont TOUS intérieurs.
    // Illustrer les 300 m² extérieurs avec un cadre sous charpente serait le
    // seul vrai mensonge du site (registre documentaire, /galerie/ : « on ne
    // montre que ce qu'on a filmé »). Le cadre porte donc le CIEL RÉEL
    // au-dessus du plateau (sky.js) — voir DEHORS : la seule image fidèle
    // qu'on puisse donner d'un extérieur, et elle est vraie à la seconde.
    img: null,
    sky: true,
    specs: ["300 m² extérieurs", "Couverts · toute l'année"],
  },
  {
    n: "02",
    t: "L'octogone",
    tag: "7 m · la cage",
    d: "Un octogone de 7 mètres, grillagé, pour le grappling, l'asso MMA et le travail au sol. La signature du plateau : on tourne dedans, on tombe dedans, on apprend à finir dedans.",
    img: "/assets/img/ram/octogone.webp",
    specs: ["Octogone 7 m", "Grappling · Asso MMA"],
  },
  {
    n: "03",
    t: "Le ring olympique",
    tag: "Anglaise · pieds-poings",
    d: "Un ring de boxe olympique, cordes tendues, coin bleu, coin rouge. C'est là que le jab se règle et que le pieds-poings prend ses distances, midi et soir.",
    img: "/assets/img/ram/anglaise.webp",
    specs: ["Ring olympique", "Anglaise · Pieds-poings"],
  },
  {
    n: "04",
    t: "L'étage muscu/cardio",
    tag: "Deux niveaux",
    d: "Deux niveaux : en haut, l'étage muscu et cardio. Charges libres, machines, cardio — la caisse et la force qui portent tout le reste, en accès libre six jours sur sept.",
    img: "/assets/img/ram/muscu.webp",
    specs: ["Étage muscu/cardio", "Accès libre 6 j/7"],
  },
  {
    n: "05",
    t: "Les sacs",
    tag: "Boxing Camp · loisirs",
    d: "La ligne de sacs lourds pour le Boxing Camp et les créneaux loisirs : le volume, la répétition, le souffle qui brûle. On tape jusqu'à ne plus entendre que le cuir.",
    img: "/assets/img/ram/camp.webp",
    specs: ["Sacs lourds", "Camp · Loisirs"],
  },
  {
    n: "06",
    t: "Les espaces libres",
    tag: "Libres & collectifs",
    d: "Des espaces d'entraînement libres et collectifs, dedans et dehors, pour s'échauffer, gainer, étirer, ou juste souffler entre deux rounds, à l'air du soir.",
    img: "/assets/img/ram/plateau.webp",
    specs: ["Libres & collectifs", "Dedans · dehors"],
  },
];

/* Le code du plateau — quatre principes (registre documentaire). */
export const VALUES = [
  /* « on s'entraîne à l'air, sous le ciel » était écrit ici, sur l'accueil et
     dans la FAQ : la meilleure ligne du site, usée sur trois URL. Elle reste
     à l'accueil, où elle porte le claim. Ici, le registre est documentaire —
     on décrit le plateau, on ne le proclame pas. */
  { n: "01", t: "Dehors, vraiment", d: "300 m² extérieurs couverts. Tu sors du vestiaire et tu y es : la météo fait partie de la séance, pas d'un décor peint sur un mur." },
  // 02 : la cage tourne 3 créneaux/semaine et l'asso MMA est marquée « Confirmé »
  // → « tu tournes dedans dès la première séance » contredisait /plannings/.
  { n: "02", t: "La cage est à toi le mardi", d: "Un octogone de 7 m. Grappling le mardi soir, tous niveaux : c'est le créneau où on ouvre la cage aux débutants. L'asso MMA, deux soirs, quand tu es prêt." },
  { n: "03", t: "Le geste d'abord", d: "Ring olympique, des coachs qui corrigent le geste avant de te faire suer. La justesse avant le bruit." },
  // 04 : la salle n'émet aucune clé — le fait verrouillé est l'émargement GPS.
  { n: "04", t: "À ton heure", d: "Deux niveaux, étage muscu/cardio, accès libre six jours sur sept. Rien à réserver, personne à convaincre : la porte est ouverte de 10h à 21h30." },
];

/* L'encadrement — noms = posters officiels rentrée 2026. Photos : Sonia &
   Jérôme prouvées (roster.json). Farouk & Valentin G sans photo prouvée →
   tuiles nom/silhouette (JAMAIS de stock, JAMAIS la face d'un autre). */
const _COACHES = [
  {
    name: "Sonia",
    role: "Pieds-poings · Lady Punch · Camp",
    tag: "Le pilier",
    pillar: true,
    note: "Le fil rouge de la semaine : boxe pieds-poings, Lady Punch et Boxing Camp. Celle que les avis citent par son nom — l'accueil du plateau, c'est elle.",
    img: "/assets/img/ram/coach-sonia.webp",
  },
  {
    name: "Jérôme",
    role: "Grappling · Asso MMA",
    tag: "L'homme de la cage",
    // Pas de patronyme : le brief §3 ne liste que « Jérôme » et aucun poster
    // officiel ne le confirme (même piège que « Valentin Tapia » / Valentin G).
    note: "Le sol et l'octogone : grappling le mardi, asso MMA deux soirs. Jérôme t'emmène là où le combat se termine vraiment — au tapis, en soumission.",
    img: "/assets/img/ram/coach-jerome.webp",
  },
  {
    name: "Farouk",
    role: "Anglaise Loisirs · Boxing Camp",
    tag: "Les soirs loisirs",
    note: "L'anglaise loisirs trois soirs par semaine et le Boxing Camp du mercredi : les créneaux où la salle se remplit et où le collectif prend le dessus.",
    img: null,
  },
  {
    name: "Valentin G",
    role: "Anglaise · École enfants",
    tag: "L'école",
    // « aux États-Unis » se lisait comme le PAYS. La source (et /llms-full.txt)
    // parlent de la salle du réseau qui porte ce nom, à Toulouse. Un lecteur
    // qui comprend « il enseigne en Amérique » a lu un fait qui n'existe pas :
    // on lève l'ambiguïté au lieu de la laisser flatter la fiche.
    note: "L'anglaise du midi et toute l'école : Baby Boxe dès 3 ans, éducative 7/11 et ados 12/16, mercredi et samedi. Il enseigne aussi à la salle des États-Unis, dans le réseau.",
    img: null,
  },
];

/* ------------------------------------------------------------------ *
 *  LE PLANNING — grille filtrable (page /plannings/). Source : posters
 *  officiels rentrée 2026 (brief §3 + roster.json). Une ligne = un cours.
 *  `fam` relie au filtre discipline. Rien d'inventé, rien d'évasif.
 * ------------------------------------------------------------------ */
export const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const _SCHEDULE = [
  // Lundi
  { day: "Lun", start: "12h40", cours: "Boxing Camp", coach: "Sonia", fam: "adulte", disc: "boxing-camp" },
  { day: "Lun", start: "18h00", cours: "Lady Punch", coach: "Sonia", fam: "feminin", disc: "lady-punch" },
  { day: "Lun", start: "18h40", cours: "Boxe Pieds-Poings", coach: "Sonia", fam: "adulte", disc: "pieds-poings" },
  { day: "Lun", start: "19h45", cours: "Anglaise Loisirs", coach: "Farouk", fam: "adulte", disc: "anglaise" },
  // Mardi
  { day: "Mar", start: "12h40", cours: "Boxe Anglaise", coach: "Valentin G", fam: "adulte", disc: "anglaise" },
  { day: "Mar", start: "18h40", cours: "Grappling", coach: "Jérôme", fam: "mma", disc: "grappling" },
  { day: "Mar", start: "19h45", cours: "Asso MMA", coach: "Jérôme", fam: "mma", disc: "asso-mma" },
  // Mercredi
  { day: "Mer", start: "12h40", cours: "Boxe Pieds-Poings", coach: "Sonia", fam: "adulte", disc: "pieds-poings" },
  { day: "Mer", start: "15h00", cours: "Éducative 7/11", coach: "Valentin G", fam: "enfant", disc: "ecole" },
  { day: "Mer", start: "16h00", cours: "Éducative 12/16", coach: "Valentin G", fam: "enfant", disc: "ecole" },
  { day: "Mer", start: "18h40", cours: "Boxing Camp", coach: "Farouk", fam: "adulte", disc: "boxing-camp" },
  { day: "Mer", start: "19h45", cours: "Anglaise Loisirs", coach: "Farouk", fam: "adulte", disc: "anglaise" },
  // Jeudi
  { day: "Jeu", start: "12h40", cours: "Boxing Camp", coach: "Sonia", fam: "adulte", disc: "boxing-camp" },
  { day: "Jeu", start: "18h40", cours: "Boxing Camp", coach: "Jérôme", fam: "adulte", disc: "boxing-camp" },
  { day: "Jeu", start: "19h45", cours: "Asso MMA", coach: "Jérôme", fam: "mma", disc: "asso-mma" },
  // Vendredi
  { day: "Ven", start: "12h40", cours: "Boxe Anglaise", coach: "Valentin G", fam: "adulte", disc: "anglaise" },
  { day: "Ven", start: "18h00", cours: "Lady Punch", coach: "Sonia", fam: "feminin", disc: "lady-punch" },
  { day: "Ven", start: "18h40", cours: "Boxe Pieds-Poings", coach: "Sonia", fam: "adulte", disc: "pieds-poings" },
  { day: "Ven", start: "19h45", cours: "Anglaise Loisirs", coach: "Farouk", fam: "adulte", disc: "anglaise" },
  // Samedi
  { day: "Sam", start: "11h00", cours: "Boxing Camp", coach: "Valentin G", fam: "adulte", disc: "boxing-camp" },
  { day: "Sam", start: "14h15", cours: "Baby Boxe 3/6", coach: "Valentin G", fam: "enfant", disc: "ecole" },
  { day: "Sam", start: "15h00", cours: "Éducative 7/11", coach: "Valentin G", fam: "enfant", disc: "ecole" },
  { day: "Sam", start: "16h00", cours: "Éducative 12/16", coach: "Valentin G", fam: "enfant", disc: "ecole" },
];

/* Variante été 2026 — cours réduits, reste en accès libre (brief §3). */
export const SCHEDULE_ETE = [
  { day: "Lun", start: "12h30", cours: "Cours d'été", coach: "Renaud", fam: "adulte", disc: "anglaise" },
  { day: "Lun", start: "20h00", cours: "Cours d'été", coach: "Fayez", fam: "adulte", disc: "anglaise" },
];

/* L'ÉTÉ, DIT COMME IL EST — l'été ne tenait pas dans la grille de la rentrée.
   Deux cours, tous les deux le lundi : rendus dans un tableau à six colonnes,
   ça donnait DIX cases vides sur douze et une page qui avait l'air cassée
   plutôt qu'une salle qui lève le pied. L'été a donc son propre objet et son
   propre rendu : deux créneaux nommés, puis la vérité du reste de la semaine —
   l'accès libre, qui lui ne s'arrête jamais. Faits : posters officiels. */
export const ETE = {
  label: "Cours d'été",
  lead: "L'été, la salle ne ferme pas — elle change de rythme. Deux cours encadrés le lundi, et le plateau ouvert le reste de la semaine.",
  // les renforts : ni Renaud ni Fayez ne sont sur une fiche de Ramonville
  // (coachs du réseau) → on le DIT, on ne laisse pas deux noms sans visage.
  renfort: "Renaud et Fayez sont des coachs du réseau Boxing Center, en renfort sur l'été. Tu ne les trouveras pas sur la page Coachs : l'encadrement de la rentrée, c'est Sonia, Jérôme, Farouk et Valentin G.",
  libre: {
    k: "Mardi → samedi",
    v: "Accès libre",
    d: "Muscu, cardio, sacs et le plateau extérieur — 10h00 à 21h30, comme toute l'année.",
  },
  ferme: { k: "Dimanche", v: "Fermé", d: "Le seul jour où la cage est vide." },
  retour: "La rentrée reprend le planning complet — vingt-trois cours, six jours sur sept.",
};

/* LA LÉGENDE DE LA GRILLE — la grille code déjà deux familles à l'œil
   (le liseré argent du Lady Punch, le point des créneaux cage). Ce code
   n'était écrit NULLE PART : un signal visuel que personne ne pouvait lire.
   Il se lit maintenant. */
export const GRID_LEGEND = [
  { cls: "feminin", label: "Lady Punch", d: "créneau 100 % féminin" },
  { cls: "mma", label: "Cage", d: "grappling & asso MMA, dans l'octogone" },
  { cls: "enfant", label: "École", d: "Baby Boxe, éducative, ados" },
];

/* ------------------------------------------------------------------ *
 *  L'ENTRÉE EN MATIÈRE — /activites/ (les cinq familles, pesées).
 *
 *  La page listait huit fiches, puis un CTA : trois blocs en tout. Elle
 *  disait CE QU'ON FAIT, jamais par où on entre — et le seul fait qui
 *  intéresse quelqu'un qui n'a jamais boxé (le niveau demandé) était la
 *  troisième ligne d'un tableau de faits, sous le coach et les créneaux.
 *
 *  Ce bloc pèse les cinq familles contre le planning officiel : combien de
 *  créneaux, quels jours, quel niveau à l'entrée. Tout est COMPTÉ depuis
 *  SCHEDULE — si le planning bouge, le bloc bouge. Rien d'ajouté.
 *
 *  `ouvertes` : la seule décision éditoriale du bloc, déclarée ICI plutôt
 *  que devinée dans le rendu — la liste des libellés de `niveau` qu'on
 *  considère comme une porte ouverte sans expérience. Le reste (Confirmé ·
 *  asso) est dit tel quel : on n'ouvre pas une porte qui ne l'est pas.
 * ------------------------------------------------------------------ */
export const ENTREE = {
  eyebrow: "Par où on entre",
  lead: "Chaque famille pesée contre le planning de la rentrée : ce qu'elle occupe dans la semaine, quels jours, et ce qu'on te demande de savoir en poussant la porte.",
  // verbatims du champ `niveau` (DISCIPLINES) — aucune reformulation
  ouvertes: ["Zéro prérequis", "Tous niveaux", "Débutant → confirmé", "Baby → ados", "À ton rythme"],
  kOuvert: "Sans prérequis",
  kReserve: "Quand tu es prêt",
  kSlots: "créneaux / semaine",
  /* FAMILLES est la liste du FILTRE de planning : elle ne contient que les
     familles qui ont des créneaux, donc pas l'accès libre. Ce bloc parle des
     familles de DISCIPLINES, qui en compte une de plus. Le seul libellé qui
     manque vit ici — on ne duplique pas les quatre autres. */
  libreLabel: "Accès libre",
  // l'accès libre n'a AUCUN créneau au planning : ce n'est pas un zéro, c'est
  // une autre nature. On le dit, on ne le compte pas comme une famille vide.
  horsGrille: { v: "Hors grille", d: "Ni créneau ni inscription — 10h00 à 21h30, six jours sur sept." },
};

/* Filtres disciplines pour la grille planning. */
export const FAMILLES = [
  { key: "all", label: "Tout" },
  { key: "adulte", label: "Adultes" },
  { key: "feminin", label: "Féminin" },
  { key: "mma", label: "Grappling · MMA" },
  { key: "enfant", label: "Enfants" },
];

/* Posters officiels — EN COULEUR, cliquables plein format (loi n°5).
   `view` est la version servie DANS la page ; `src` est ce qui s'ouvre au clic.

   LES DEUX SONT MAINTENANT DU WebP, ET LE PLEIN FORMAT NE PERD RIEN.
   `src` désignait le PNG d'origine (1 961 et 1 418 ko) au nom du « non
   recompressé ». L'intention était juste, le moyen était cher : scripts/
   images.mjs encode désormais ces PNG en WebP SANS PERTE et vérifie le
   résultat pixel par pixel avant de l'écrire — écart maximal 0/255 sur les
   quatre canaux. Le fichier ouvert au clic est donc l'image d'origine au bit
   près, pour 798 et 673 ko au lieu de 1 961 et 1 418. Les PNG restent la
   source du dépôt, dans scripts/img-src/, hors de ce qui est déployé.

   `view` est calibré sur son affichage réel (1 600 px pour 1 552 px utiles au
   pire cas, mesuré au rendu) et non plus sur les 2 400 px du scan. */
export const POSTERS = [
  {
    src: "/assets/img/ram/planning-rentree-2026-full.webp",
    view: "/assets/img/ram/planning-rentree-2026.webp",
    w: 1600, h: 1160,
    label: `Rentrée ${SEASON}`,
    alt: `Planning officiel de la rentrée ${SEASON} de Boxing Center Ramonville : boxe anglaise, pieds-poings, grappling, asso MMA, boxing camp, Lady Punch et école enfants dès 3 ans, du lundi au samedi.`,
  },
  {
    src: "/assets/img/ram/planning-ete-2026-full.webp",
    view: "/assets/img/ram/planning-ete-2026.webp",
    w: 1600, h: 680,
    label: "Cours d'été",
    alt: "Planning officiel d'été de Boxing Center Ramonville : cours d'été le lundi midi et soir, reste de la semaine en accès libre muscu/cardio.",
  },
];

/* ------------------------------------------------------------------ *
 *  LES OFFRES — bloc daté, saison via SEASON (standards §2). JAMAIS de
 *  prix en dur dans les pages. Duo prioritaire, Saison secondaire.
 *  « 29 € par personne » obligatoire ; interdit « 29 € pour deux ».
 * ------------------------------------------------------------------ */
const _PROMOS = {
  saison: SEASON,
  duo: {
    name: "Offre Duo",
    price: "29 €",
    unit: "par personne",
    was: "au lieu de 44 €",
    feature: "4 semaines · cours illimités · sans engagement",
    items: ["4 semaines illimitées", "À deux, chacun 29 € / personne", "Sans engagement"],
    cta: "Je viens avec mon binôme",
    href: "https://box-plus.vercel.app/abonnements#promotions",
    priority: true,
  },
  saisonOffre: {
    name: "Offre Saison",
    price: "259 €",
    unit: "les 12 mois",
    was: "au lieu de 400 €",
    feature: "Payable en 4× sans frais · accès libre aux 5 clubs",
    items: [
      "12 mois, toutes disciplines",
      "4× sans frais",
      "Accès libre aux 5 clubs du réseau",
    ],
    cta: "Je prends ma saison",
    href: "https://box-plus.vercel.app/abonnements#promotions",
    priority: false,
  },
  bonus: "T-shirt Boxing Center offert aux 100 premiers inscrits.",
};

/* Les tarifs affichés (page /tarifs/). Essai 10€ en premier (standards §3). */
const _TARIFS = [
  {
    name: "Séance d'essai",
    price: "10 €",
    period: "la séance",
    feature: "Toutes disciplines, matériel prêté",
    items: ["Toutes les disciplines", "Matériel prêté", "Sans engagement"],
    cta: "Réserver l'essai",
    href: "https://box-plus.vercel.app/seance-essai",
    highlight: false,
  },
  {
    name: "Offre Duo",
    price: "29 €",
    period: "/ personne",
    feature: "4 semaines illimitées · sans engagement",
    items: ["4 semaines illimitées", "29 € par personne", "Sans engagement"],
    cta: "Je viens avec mon binôme",
    href: "https://box-plus.vercel.app/abonnements#promotions",
    highlight: true,
  },
  {
    name: "Offre Saison",
    price: "259 €",
    period: "/ 12 mois",
    feature: "4× sans frais · accès aux 5 clubs",
    items: ["12 mois toutes disciplines", "4× sans frais", "Accès libre aux 5 clubs"],
    cta: "Je prends ma saison",
    href: "https://box-plus.vercel.app/abonnements#promotions",
    highlight: false,
  },
  {
    name: "École enfants",
    price: "Dès 3 ans",
    period: "Baby · 7/11 · 12/16",
    feature: "L'école complète, mercredi & samedi",
    items: ["Baby Boxe 3/6 ans", "Éducative 7/11 & ados 12/16", "Encadrée par Valentin G"],
    cta: "Inscrire mon enfant",
    href: "https://box-plus.vercel.app/abonnements#enfants",
    highlight: false,
  },
];

/* Le réseau — 5 salles (Balma-Gramont VENDUE : jamais citée). `self`
   marque Ramonville, filtrée quand on montre « les 4 sœurs ». */
export const NETWORK = [
  { id: "portet", name: "Portet-sur-Garonne", tag: "Le vaisseau amiral", feat: "Ring olympique · cage MMA", url: "https://www.boxing-center-portet.fr/" },
  { id: "minimes", name: "Minimes", tag: "Le berceau", feat: "Salle historique · 3 rings · l'école dès 3 ans", url: "https://boxingcenter.fr/" },
  { id: "etats-unis", name: "États-Unis", tag: "Le colosse", feat: "La plus grande salle de France dédiée aux sports de combat", url: "https://boxingcenter.fr/" },
  { id: "st-cyprien", name: "Saint-Cyprien", tag: "La rive gauche", feat: "1 200 m² · un seul niveau", url: "https://boxingcenter.fr/" },
  { id: "ramonville", name: "Ramonville", tag: "L'octogone à ciel ouvert", feat: "Octogone 7 m · 300 m² extérieur couvert", url: "/", self: true },
];

/* Avis Google réels (source : _reviews-2026-07-12.json — Ramonville 4,1/5,
   47 avis). Verbatim, jamais édités, jamais inventés. */
export const REVIEWS = {
  rating: "4,1/5",
  count: 47,
  sourceLabel: "Avis Google",
  quotes: [
    { text: "Un grand merci à Sonia qui nous accompagne avec bienveillance. Je recommande la salle de Ramonville les yeux fermés !", author: "LEPICIER I.", stars: 5 },
    { text: "Super salle avec une très bonne ambiance. Les coachs sont très sympas et pédagogues. Je recommande !", author: "Camille L.", stars: 5 },
    { text: "Les enfants aiment bien y aller ; malgré un déménagement à 35 km, ils veulent continuer à s'entraîner.", author: "Manjoo N.", stars: 4 },
  ],
};

/* Carnet de terrain (page /galerie/). Uniquement des VRAIES photos Ramonville
   (scrapées du site officiel). AUCUNE photo d'une autre salle.

   HORODATAGE RETIRÉ — les 6 clichés prouvés sont pris DE JOUR et à COUVERT
   (charpente métallique, néons, lumière franche aux fenêtres). Les légendes
   « 21h48 / 20h12 / 19h05 » et l'alt « de nuit » étaient des repères de
   reportage inventés : dans un registre documentaire qui écrit « on ne montre
   que ce qu'on a filmé », c'est la seule chose que le client ne pardonnerait
   pas. La légende dit maintenant la ZONE, qui est vérifiable sur l'image.
   La météo LIVE reste dans la bande « Au-dessus du plateau » — elle parle de
   MAINTENANT, pas de la photo : ça, c'est honnête.

   `credit` : le photographe est incrusté dans le fichier (filigrane). On le
   crédite plutôt que de le rogner — un carnet de terrain cite ses sources.
   ⚠ À FAIRE VALIDER : droits d'exploitation des clichés Axel Derewiany. */
export const PHOTO_CREDIT = "Axel Derewiany";

/* `discs` — À QUOI SERT LE CADRE, dans la semaine. C'est l'angle propre au
   carnet, et il n'invente rien : chaque clé renvoie à une discipline de
   DISCIPLINES, et les jours/heures affichés sont RECOMPTÉS depuis SCHEDULE au
   rendu. La correspondance zone → discipline est celle qu'écrivent déjà les
   fiches de PLATEAU (l'octogone « pour le grappling, l'asso MMA » ; le ring
   « là que le jab se règle et que le pieds-poings prend ses distances » ; les
   sacs « pour le Boxing Camp » ; l'étage « en accès libre six jours sur
   sept »). Les deux plans larges n'ont pas de créneau à eux : ils portent
   `hors`, qui dit leur nature au lieu de leur inventer un horaire. */
export const GALLERY = [
  /* `plein` : la seule photo de la mosaïque dont la vignette et le grand
     format diffèrent. hero.webp fait 1 920 px et 238 ko ; dans la grille il
     n'occupe jamais plus de 415 px CSS (1 070 px à 3× sur mobile, mesuré au
     rendu) — plus du double des pixels utiles, sur la page la plus lourde du
     site. La grille charge donc la version 1 200 px, et la visionneuse va
     chercher le 1 920 AU CLIC, quand quelqu'un le demande vraiment. */
  { img: "/assets/img/ram/hero-1200.webp", plein: "/assets/img/ram/hero.webp", w: 1200, h: 801, zone: "Le plateau", place: "octogone 7 m + ring olympique", alt: "Le plateau de Boxing Center Ramonville sous la charpente : l'octogone de 7 m grillagé et le ring de boxe olympique.", discs: [], hors: "Le plan large — les deux instruments de la salle tiennent dans le même cadre, et rien ne les sépare." },
  { img: "/assets/img/ram/octogone.webp", w: 768, h: 512, zone: "L'octogone", place: "asso MMA · vue de dessus", alt: "Séance d'asso MMA dans l'octogone de 7 m à Boxing Center Ramonville, vue de dessus, le groupe au sol.", discs: ["grappling", "asso-mma"] },
  { img: "/assets/img/ram/anglaise.webp", w: 768, h: 512, zone: "Le ring", place: "pattes d'ours", alt: "Travail aux pattes d'ours près du ring à Boxing Center Ramonville, un boxeur enchaîne face au coach.", credit: true, discs: ["anglaise", "pieds-poings"] },
  { img: "/assets/img/ram/camp.webp", w: 768, h: 512, zone: "Les sacs", place: "Boxing Camp", alt: "La ligne de sacs lourds pendant le Boxing Camp à Boxing Center Ramonville, plusieurs pratiquants aux gants.", discs: ["boxing-camp"] },
  { img: "/assets/img/ram/muscu.webp", w: 768, h: 512, zone: "L'étage", place: "muscu / cardio", alt: "L'étage muscu/cardio de Boxing Center Ramonville : charges libres, bancs et machines en accès libre.", credit: true, discs: ["acces-libre"] },
  { img: "/assets/img/ram/plateau.webp", w: 768, h: 512, zone: "Les tatamis", place: "espaces libres · drapeaux au mur", alt: "Le plateau de Boxing Center Ramonville en couleur : l'octogone, le ring et les tatamis, drapeaux au mur.", discs: [], hors: "Les espaces libres et collectifs — aucun créneau ne les réserve, c'est ce qui les rend utilisables toute la journée." },
];

/* ------------------------------------------------------------------ *
 *  LE CARNET — la matière PROPRE à /galerie/.
 *
 *  La page récitait le RELEVÉ DU DEHORS mot pour mot : le même sur-titre,
 *  le même h2, la même phrase-thèse, les cinq mêmes cartes de mesure, la
 *  même note et la même signature que /la-salle/. Quarante-deux pour cent
 *  de la page appartenaient à sa sœur — et sans ce doublon il restait 209
 *  mots : la page la plus maigre du site. Un relevé se fait UNE FOIS, sur
 *  la page du plateau. Le carnet, lui, doit gagner sa place autrement.
 *
 *  Son angle : une photo de salle n'est pas un décor, c'est un LIEU où il
 *  se passe quelque chose à une heure connue. Le carnet croise donc les six
 *  cadres avec le planning officiel — la seule chose qu'aucune autre page
 *  ne fait — puis dit sa méthode, puis avoue sa page blanche en trois
 *  lignes qui renvoient au relevé au lieu de le recopier.
 * ------------------------------------------------------------------ */
export const CARNET = {
  // les en-têtes de section vivent en clair dans /galerie/ (comme partout sur
  // le site) ; ici, seulement ce qui est DONNÉE ou étiquette réutilisée.
  kQuoi: "Ce qui s'y tient",
  kQuand: "Quand",
  kLarge: "Plan large",
  usageFoot: "Quatre zones sur six ont un horaire. Les deux autres sont des plans d'ensemble : on ne leur en fabrique pas un.",
  /* les trois règles du carnet — la méthode, dite une fois, ici et nulle part
     ailleurs sur le site. */
  regles: [
    {
      k: "Une seule salle",
      d: "Aucun cadre ne vient d'une autre salle du réseau ni d'une banque d'images. Si ce n'est pas Ramonville, ce n'est pas dans ces pages — même quand ça laisse un trou.",
    },
    {
      k: "Le photographe est nommé",
      d: `Deux fichiers portent une signature incrustée : ${PHOTO_CREDIT}. On la cite sous le cadre au lieu de la rogner — c'est la seule façon honnête de garder l'image.`,
    },
    {
      k: "Aucune heure sur les légendes",
      d: "Les six cadres sont pris de jour et à couvert. La seule heure du carnet est celle de la bande du haut : elle vient du ciel de Ramonville, à la seconde où tu lis.",
    },
  ],
  // le renvoi de la page blanche : le relevé complet appartient à /la-salle/
  renvoi: { label: "Voir le relevé du dehors", href: "/la-salle/#releve" },
};

export const FAQ = [
  { q: "Où se trouve Boxing Center Ramonville ?", a: "Au 33 rue des Ormes, 31520 Ramonville-Saint-Agne, dans le sud toulousain — à proximité du terminus du métro (ligne B, Ramonville) et de l'arrêt bus Ramonville Sud." },
  { q: "C'est vrai qu'on s'entraîne dehors ?", a: "Oui, et c'est la seule des cinq salles où c'est possible : 300 m² dehors, aménagés et couverts, praticables toute l'année — une averse ne renvoie personne à l'intérieur. Sous charpente, tu as l'octogone de 7 m et le ring de boxe olympique." },
  { q: "Quelles disciplines peut-on pratiquer ?", a: "Boxe anglaise et anglaise loisirs, boxe pieds-poings, grappling, asso MMA dans l'octogone, Boxing Camp, Lady Punch (100 % féminin) et toute l'école enfants du Baby Boxe (3 ans) aux ados 12/16. Un étage muscu/cardio est en accès libre." },
  { q: "Y a-t-il des cours pour les enfants ?", a: "Oui, dès 3 ans : Baby Boxe 3/6 le samedi, éducative 7/11 ans et ados 12/16 ans le mercredi et le samedi après-midi, encadrés par Valentin G." },
  { q: "Faut-il un niveau pour commencer ?", a: "Aucun. La séance d'essai à 10 € donne accès à toutes les disciplines, matériel prêté. La plupart des créneaux — loisirs, camp, pieds-poings — sont ouverts à tous les niveaux." },
  { q: "Quels sont les horaires ?", a: "Du lundi au samedi, de 10h00 à 21h30, accès libre muscu/cardio inclus. Fermé le dimanche. Un émargement GPS est demandé en salle avant chaque cours." },
];

/* ------------------------------------------------------------------ *
 *  LES SIX EXPORTS SURCHARGEABLES.
 *  Tout le reste du fichier s'exporte tel quel : ce sont les faits que
 *  le staff n'a aucune raison de retoucher depuis le vestiaire (le
 *  relevé, l'arpentage, le carnet, la méthode). Ceux-ci bougent avec la
 *  vie de la salle — coordonnées, planning, tarifs, encadrement — et
 *  c'est exactement ceux-là que /admin/ peut publier.
 * ------------------------------------------------------------------ */
export const SALLE       = calque(_SALLE, "salle");
export const DISCIPLINES = calque(_DISCIPLINES, "disciplines");
export const COACHES     = calque(_COACHES, "coaches");
export const SCHEDULE    = calque(_SCHEDULE, "schedule");
export const TARIFS      = calque(_TARIFS, "tarifs");
export const PROMOS      = calque(_PROMOS, "promos");
