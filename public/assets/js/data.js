/* =====================================================================
   BOXING CENTER — RAMONVILLE · « L’OCTOGONE À CIEL OUVERT »
   data.js — content source of truth (maquette). Plain ES module → Astro/Next.

   Le monde : la seule salle du réseau qui s’entraîne DEHORS. 300 m²
   extérieurs aménagés et protégés des intempéries, un octogone de 7 m, un
   grand ring, deux niveaux avec un étage muscu/cardio. Registre
   documentaire — la nuit dehors, le ciel réel au-dessus de la cage.

   RÈGLES : tout fait vient des posters officiels 2026-2027 + du site
   boxingcenter.fr (brief §3). Noms de coachs ≡ photos (roster.json), jamais
   croisés. Aucun claim périssable dans les pages : la saison passe par la
   constante SEASON, les promos vivent dans PROMOS (jamais en dur ailleurs).
   Version d’assets unique : ?v=19 partout (imports compris).
   ===================================================================== */

/* Anti-péremption — tout libellé de saison passe par ces constantes. */
export const SEASON = "2026-2027";
export const SEASON_LABEL = "Saison 2026 — 2027";

/* ------------------------------------------------------------------ *
 *  LE CALQUE DU VESTIAIRE — bloc GÉNÉRÉ, ne pas écrire dedans à la main.
 *
 *  `npm run build` le remplit depuis src/content.json, c’est-à-dire
 *  depuis ce que le staff a publié dans /admin/. Vide (le cas normal),
 *  c’est data.js qui parle, mot pour mot : le vestiaire ne peut pas
 *  vider le site par mégarde, il ne peut que SURCHARGER un champ.
 *
 *  Le calque est écrit ICI, dans le fichier, plutôt qu’importé d’un
 *  module voisin : un import de plus, c’est un aller-retour réseau de
 *  plus, sur les huit pages, pour un objet qui pèse deux octets la
 *  plupart du temps. (loi n°3 — la perf ne doit que monter)
 * ------------------------------------------------------------------ */
/* @vestiaire:début */
const VESTIAIRE = {};
/* @vestiaire:fin */

/* Surcharge champ par champ. Un objet est fusionné (on ne perd pas les
   clés que le staff n’a pas touchées) ; une liste est remplacée en bloc
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
  baseline: "L’octogone à ciel ouvert.",
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
    "Métro ligne B — descends au terminus, tu y es",
    "Bus — arrêt Ramonville Sud, au pied de la salle",
    "Rocade — sortie Ramonville, parking gratuit",
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
  /* Le bouton permanent de l'en-tête vend l'OFFRE, pas l'essai (ordre
     d'Eddy, 21/08) : le clic toujours visible doit porter le produit qui
     fait entrer, pas le moins cher. La destination est celle qu'il a
     donnée telle quelle — /offre/29, sans UTM, comme les autres liens
     d'offre déjà en place sur le site. */
  rentree: "https://boutique.boxingcenter.fr/offre/29",
  /* Ne sert PLUS que la ligne « Séance d’essai » de la grille tarifs.
     Ailleurs le 10 € a quitté le site : ordre d’Eddy du 24/08/2026, le
     prix ne vit que dans la section tarifs et dans le bot. */
  essai: "https://boutique.boxingcenter.fr/seance-essai",
  abos: "https://boutique.boxingcenter.fr/abonnements",
  promos: "https://boutique.boxingcenter.fr/offres-speciales",
  enfants: "https://boutique.boxingcenter.fr/abonnements",
  coachings: "https://boutique.boxingcenter.fr/coachings",
  boutique: "https://boutique.boxingcenter.fr/",   // la BOUTIQUE, pas un rayon (parité Minimes/St-Cyprien)
  groupe: "https://boxingcenter.fr/",
  facebook: "https://www.facebook.com/BoxingCenterToulouse/",
  instagram: "https://www.instagram.com/boxingcentertoulouse/",
  google: "https://maps.google.com/?q=Boxing+Center+Ramonville+Saint+Agne",
};

/* `short` : le libellé que porte la BARRE, quand il doit être plus court que
   celui du menu. La barre tient sur une ligne à partir de 1160 px et pas un
   pixel de moins ; « Première séance » y prend la place de deux entrées, alors
   qu’au tiroir il a toute la largeur pour se dire en entier. Une seule liste,
   deux longueurs — pas deux listes à tenir d’accord. */
export const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/premiere-seance/", label: "1re séance", short: "1re séance" },
  { href: "/la-salle/", label: "Le plateau", top: false },
  { href: "/activites/", label: "Activités" },
  { href: "/coachs/", label: "Coachs" },
  { href: "/galerie/", label: "Galerie", top: false },
  { href: "/plannings/", label: "Planning" },
  { href: "/tarifs/", label: "Tarifs" },
  { href: "/contact/", label: "Contact" },
];

/* Les chiffres du plateau — compteurs (brief §5). raw = pas d’animation. */
/* MÊMES CHIFFRES, DEUX LÉGENDES. `l` est lue par le hero de l’accueil,
   `rail` par le bandeau de /la-salle/. Les deux pages affichaient jusqu’ici
   les quatre mêmes lignes mot pour mot — une trentaine de mots identiques
   entre les deux URL qui comptent le plus, et la règle de la maison est
   qu’une formule ne sert qu’une fois. Les nombres, eux, ne bougent pas :
   ils sont le fait, et ils restent écrits à un seul endroit. L’accueil dit
   CE QUE C’EST ; le plateau, page de visite, dit CE QUE ÇA FAIT sur place. */
export const STATS = [
  { v: 7, suffix: " m", l: "l’octogone, sous le ciel", rail: "la cage, en plein air" },
  { v: 300, suffix: " m²", l: "d’extérieur couvert, aménagé", rail: "dehors, et à l’abri de la pluie" },
  { v: 2, suffix: "", l: "niveaux, étage muscu/cardio", rail: "niveaux : le plateau, puis la muscu" },
  { v: 6, suffix: " j/7", l: "de 10h à 21h30, accès libre inclus", raw: true, rail: "jours ouverts, 10h–21h30" },
];

/* ------------------------------------------------------------------ *
 *  LES 8 ARÊTES — l’octogone est la navigation (brief §2).
 *  8 côtés = 8 entrées. `edge` = ordre sur l’octogone (0 en haut,
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
    coach: "Valentin Guth · Farouk",
    /* RECOPIÉ SUR LA GRILLE, PAS SUR LA VERSION D’AVANT. Le poster de la
       rentrée a redressé le mercredi soir — un seul bloc d’anglaise 18h45 →
       20h15 avec Farouk, et non un loisirs de 19h45. Cette ligne l’ignorait
       encore : la fiche annonçait un créneau que la grille, deux pages plus
       loin, ne montrait pas. Les cinq créneaux ci-dessous sont ceux de
       SCHEDULE, un par un. */
    jours: "Anglaise mar. & ven. 12h40 · mer. 18h45 → 20h15 · Loisirs lun. & ven. 19h45",
    niveau: "Débutant → confirmé",
    desc: "Jab, esquive, jeu de jambes. Les midis pour le geste propre, les soirs en loisirs quand la salle se remplit et que les frappes couvrent le bruit du dehors. Le fondamental de la maison.",
    img: "/assets/img/ram/photos/boxe-anglaise-en-binome-boxing-center-ramonville.webp",
  },
  {
    key: "pieds-poings",
    edge: 1,
    name: "Boxe Pieds-Poings",
    tag: "Tibias & poings",
    famille: "adulte",
    /* Le midi du pieds-poings a changé de jour au poster de la rentrée :
       jeudi, plus mercredi. Et son coach n’est pas encore arrêté — on écrit
       « à confirmer » plutôt que de prêter ce créneau à Sonia, qui tient les
       deux soirs et rien d’autre. */
    coach: "Sonia · jeudi midi à confirmer",
    jours: "Jeu. 12h40 · lun. & ven. 18h40",
    niveau: "Tous niveaux",
    desc: "Poings, tibias, genoux : la boxe la plus complète, menée par Sonia. Trois créneaux par semaine, du midi qui réveille au soir qui défoule — et le sac encaisse tout, toi tu apprends.",
    /* CETTE FICHE N’AVAIT PAS D’IMAGE — et le carnet en avait une pour elle
       depuis le début. anglaise.webp est indexée `discs: ["anglaise",
       "pieds-poings"]` dans CARNET, plus bas dans ce même fichier : les
       pattes d’ours près du ring servent aux deux boxes, c’est la salle qui
       le dit, pas nous. On ne va pas chercher une photo d’une autre
       discipline, on branche celle qui était déjà déclarée pour celle-ci. */
    img: "/assets/img/ram/photos/kick-boxing-coup-de-pied-haut-boxing-center-ramonville.webp",
    imgAlt: "Coup de pied haut au bouclier pendant le cours de boxe pieds-poings du Boxing Center Ramonville.",
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
    desc: "Contrôle, projections, travail au sol dans l’octogone de 7 m. Jérôme y enseigne la partie que la boxe ignore : le sol. Mardi soir, tous niveaux — c’est le créneau où la cage s’ouvre aux débutants.",
    img: "/assets/img/ram/photos/jiu-jitsu-bresilien-au-sol-boxing-center-ramonville.webp",
  },
  {
    key: "asso-mma",
    edge: 3,
    name: "MMA tous niveaux",
    tag: "Dans la cage",
    famille: "mma",
    coach: "Jérôme",
    jours: "Mardi & jeudi · 19h45 – 21h15",
    niveau: "Tous niveaux · débutants acceptés",
    desc: "Le créneau association : MMA complet dans l’octogone, debout et au sol. Deux soirs par semaine avec Jérôme, quand la cage est à nous et que le plateau, à deux pas, reste ouvert sur le soir.",
    /* octogone.webp EST une photo d’MMA tous niveaux — son `alt` du carnet le dit mot
       pour mot (« Séance d’MMA tous niveaux dans l’octogone de 7 m »), et elle est
       indexée `discs: ["grappling", "asso-mma"]`. La fiche du créneau qui se
       passe DANS la cage s’affichait sans la seule photo de la cage : ce
       n’était pas un manque de matière, c’était un fil non branché. */
    img: "/assets/img/ram/photos/cours-de-mma-groupe-debout-boxing-center-ramonville.webp",
    imgAlt: "Le groupe debout dans l'octogone de 7 mètres pendant un cours de MMA au Boxing Center Ramonville.",
  },
  {
    key: "boxing-camp",
    edge: 4,
    name: "Boxing Camp",
    tag: "Le condensé",
    famille: "adulte",
    /* Quatre créneaux, trois coachs — recompté sur la grille de la rentrée.
       Le camp du mercredi soir est passé au midi, celui du jeudi midi est
       devenu du pieds-poings, et Farouk n’en tient plus aucun : il a le bloc
       d’anglaise du mercredi soir. On corrige la fiche plutôt que de laisser
       la page promettre un cinquième créneau qui n’existe plus. */
    coach: "Sonia · Jérôme · Valentin Guth · mer. midi à confirmer",
    jours: "Lun. & mer. 12h40 · jeu. 18h40 · sam. 11h",
    niveau: "Tous niveaux",
    desc: "Le format signature Boxing Center : technique, cardio et sacs dans une seule séance dense. Quatre créneaux, du lundi midi au samedi matin — le meilleur point d’entrée si tu hésites encore.",
    img: "/assets/img/ram/photos/boxing-camp-circuit-de-renforcement-boxing-center-ramonville.webp",
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
    desc: "Un créneau à vous, lundi et vendredi 18h : la vraie boxe, le cardio, la frappe qui défoule — entre femmes, avec Sonia qui tient la porte. Zéro prérequis : beaucoup y mettent les gants pour la première fois. Et à 18h40, celles qui veulent enchaînent sur le pieds-poings.",
    /* LES SIX PHOTOS PROUVÉES DE LA SALLE NE MONTRENT AUCUN CRÉNEAU FÉMININ.
       Illustrer un cours 100 % féminin avec un adulte masculin, ce serait
       mentir sur la seule chose qui définit ce créneau. `nophoto` remplace la
       photo par une PLAQUE assumée, avec cette phrase-là dessus. */
    img: null,
    nophoto: "Aucune photo du créneau féminin n’a encore été prise. On préfère te le dire que te montrer quelqu’un d’autre — viens voir Sonia le lundi.",
    img: "/assets/img/ram/photos/lady-punch-boxe-100-pour-cent-feminin-boxing-center-ramonville.webp",
    imgAlt: "Une pratiquante du cours Lady Punch au Boxing Center Ramonville, enchaînement aux gants."
  },
  {
    key: "ecole",
    edge: 6,
    name: "École enfants",
    tag: "Dès 3 ans",
    famille: "enfant",
    coach: "Valentin Guth",
    jours: "Baby 3/6 sam. 14h15 · 7/11 mer./sam. 15h · 12/16 mer./sam. 16h",
    niveau: "Baby → ados",
    desc: "Du Baby Boxe (dès 3 ans) à l’éducative ados, la règle est fédérale et non négociable : on touche, on ne frappe pas. Pas de coups portés — de la motricité, de la concentration, du respect, à hauteur d’enfant. Valentin Guth tient toute l’école, mercredi et samedi après-midi. Parents : restez, la salle est ouverte pendant le cours.",
    /* Même règle, et elle est plus stricte encore ici : on ne publie pas le
       visage d’un enfant sans l’accord écrit des parents, et aucune des six
       photos prouvées n’en montre. La plaque le dit franchement. */
    img: null,
    nophoto: "Pas de photo des cours enfants : on ne publie pas le visage d’un enfant sans l’accord de ses parents. Le mercredi et le samedi, la salle est à eux.",
    img: "/assets/img/ram/photos/cours-de-renforcement-vue-plongeante-boxing-center-ramonville.webp",
    imgAlt: "Cours de boxe éducative pour enfants au Boxing Center Ramonville."
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
    desc: "L’étage muscu/cardio et les espaces d’entraînement libres, ouverts six jours sur sept. Charges, machines, sacs : personne ne te dira quand venir.",
    img: "/assets/img/ram/photos/etage-musculation-sous-la-charpente-boxing-center-ramonville.webp",
  },
];

/* ------------------------------------------------------------------ *
 *  LE RELEVÉ DU DEHORS — le différenciateur, en fiche documentaire.
 *
 *  Les 300 m² extérieurs sont LE fait qui distingue Ramonville, et c’est
 *  le seul lieu de la salle dont on n’a AUCUN cliché : les vingt-quatre photos
 *  prouvées sont toutes prises à couvert. Pendant trois versions, ce trou
 *  a été traité en « tuile photo à venir » — c’est-à-dire en excuse : un
 *  cadre gris au milieu de cinq vraies photos, qui se lit « inachevé ».
 *
 *  Le parti pris tient en une phrase : un espace extérieur n’a pas de
 *  photographie fidèle, il a un CIEL. Le cadre n’est donc pas vide — il
 *  contient la seule image vraie qu’on puisse en donner : le ciel réel
 *  au-dessus des 300 m², à la seconde, via Open-Meteo (sky.js). Autour,
 *  un relevé de terrain : ce qui est mesuré, et ce qui ne l’est pas
 *  encore, dit franchement, dans le même registre que la fiche du pied
 *  de page. Rien à cacher, rien à inventer, rien qui ait l’air en attente.
 * ------------------------------------------------------------------ */
export const DEHORS = {
  eyebrow: "Relevé de terrain",
  t: "L’extérieur couvert",
  surface: "300 m²",
  claim: "Le seul plateau du réseau qui a un ciel pour plafond.",
  // NE REPREND PAS la formule de la section « 300 m² plein ciel » plus haut
  // (« couvert veut dire couvert… ») : une bonne phrase ne se dit qu’une fois
  // par site. Celle-ci pose le registre du relevé, pas le claim.
  lead: "Le plateau extérieur, en chiffres : sa surface, sa couverture, ses heures — et le ciel au-dessus, relevé en direct.",
  /* les quatre lignes mesurées — verbatims officiels, rien d’ajouté */
  mesures: [
    // « d’un seul tenant » a été retiré : aucune source ne dit que les 300 m²
    // sont contigus. Le relevé ne note que ce qui est écrit noir sur blanc —
    // c’est tout l’intérêt d’un relevé.
    { k: "Surface", v: "300 m²", d: "d’entraînement extérieur, aménagés" },
    { k: "Couverture", v: "Couvert", d: "protégé des intempéries" },
    { k: "Ouverture", v: "Toute l’année", d: "six jours sur sept, 10h – 21h30" },
    // « l’air du dehors, pas un mur » appartient déjà au bloc RDC de la coupe
    // (/la-salle/) : une bonne phrase ne se dit qu’une fois par site.
    { k: "Plafond", v: "Le ciel", d: "aucune autre salle du réseau n’a ça" },
  ],
  /* la ligne qu’on n’a pas — assumée, au même format que les autres */
  nonReleve: {
    k: "Cliché",
    v: "Non relevé",
    d: "Aucune des vingt-quatre photos de la galerie ne montre le dehors : il n’a pas encore été shooté. En attendant, voilà ses chiffres — et le vrai ciel au-dessus.",
  },
  /* la légende du cadre vivant (le ciel remplace la photo absente) */
  cadre: {
    k: "Au-dessus des 300 m²",
    d: "Relevé en direct — Open-Meteo, station de Ramonville-Saint-Agne.",
  },
};

/* ------------------------------------------------------------------ *
 *  L’ARPENTAGE — le différenciateur DESSINÉ, sans rien inventer.
 *
 *  Le cadre au ciel réel disait la vérité mais ne montrait rien : 571 × 689
 *  px de nuit presque vide (≈ 280 pixels allumés en plein midi, l’heure où
 *  il n’y a pas d’étoiles). Une intention juste rendue en rectangle noir se
 *  lit comme une image qui n’a pas chargé — exactement ce qu’on voulait
 *  éviter. Le concept n’était pas faux, il était NU.
 *
 *  On l’arpente donc au lieu de le photographier. Deux faits, deux seuls,
 *  tous deux officiels : la SURFACE (300 m²) et la CAGE (7 m). On dessine
 *  trois cents carrés d’un mètre — un COMPTE, pas un plan — et l’octogone
 *  de 7 m à la même échelle, à côté, comme étalon. Le lecteur voit enfin
 *  la démesure du plateau, mesurée contre un objet qu’il connaît.
 *
 *  CE QU’ON NE DESSINE PAS : la forme. Aucune source ne dit si les 300 m²
 *  sont un carré, un L ou une bande. Les carrés sont donc rangés pour être
 *  COMPTÉS, jamais pour figurer un terrain — et la légende le dit en toutes
 *  lettres. Un relevé qui avoue sa lacune reste un relevé ; un plan inventé
 *  serait le seul vrai mensonge du site.
 * ------------------------------------------------------------------ */
export const ARPENT = {
  unit: 1,            // le carré étalon — 1 m²
  count: 300,         // 300 m² (poster officiel) → 300 carrés
  /* RANGEMENT, PAS EMPRISE. Les carrés sont posés pour être COMPTÉS : le
     nombre de colonnes n’affirme donc aucune dimension du plateau, et on le
     choisit pour la composition — 15 × 20, debout, à côté de l’étalon.
     UN SEUL rangement, parce qu’il n’y a plus qu’UNE planche par page : la
     variante couchée servait une tuile de station qui redessinait les mêmes
     300 carrés à trente centimètres du grand relevé, avec son compteur et
     sa barre météo en double sur le même écran. Un relevé qui se répète
     n’est plus un relevé, c’est un motif. */
  cols: 15, rows: 20,             // le relevé, seule planche du site
  cage: 7,            // l’octogone — 7 m, même échelle
  kUnit: "1 m²",
  kField: "300 × 1 m²",
  kCage: "L’octogone · 7 m",
  scale: "Même échelle",
  // la phrase qui tient tout le parti pris — elle ne se dit qu’ICI
  honest: "300 m² mesurés sur les documents officiels de la salle. La forme exacte, tu la verras sur place.",
  legend: "300 carrés d’un mètre chacun — la surface réelle du plateau extérieur. À droite, l’octogone de 7 m à la même échelle : compare, et tu vois ce qui t’attend dehors.",
};

/* ------------------------------------------------------------------ *
 *  LE PLATEAU — la visite du terrain (page /la-salle/). L’extérieur
 *  d’abord : c’est le différenciateur. Puis l’octogone, le ring, l’étage.
 *  Specs = verbatims officiels (brief §3), rien d’inventé.
 * ------------------------------------------------------------------ */
export const PLATEAU = [
  {
    n: "01",
    t: "L’extérieur couvert",
    tag: "300 m² · protégés des intempéries",
    d: "300 m² d’entraînement dehors, aménagés et protégés des intempéries. La seule salle du réseau où l’air, le ciel et le soir font partie de la séance. Tu t’échauffes sous les étoiles, tu récupères au grand air.",
    // Pas de photo : les 6 clichés prouvés de la salle sont TOUS intérieurs.
    // Illustrer les 300 m² extérieurs avec un cadre sous charpente serait le
    // seul vrai mensonge du site (registre documentaire, /galerie/ : « on ne
    // montre que ce qu’on a filmé »). Le cadre porte donc le CIEL RÉEL
    // au-dessus du plateau (sky.js) — voir DEHORS : la seule image fidèle
    // qu’on puisse donner d’un extérieur, et elle est vraie à la seconde.
    img: null,
    sky: true,
    specs: ["300 m² extérieurs", "Couverts · toute l’année"],
  },
  {
    n: "02",
    t: "L’octogone",
    tag: "7 m · la cage",
    /* La phrase disait deux fois « La signature du plateau : » et deux fois
       « pour le grappling et le MMA tous niveaux » — une fusion d’édition restée en
       l’état. Une seule signature, une seule fois. */
    d: "Un octogone de 7 mètres, grillagé, pour le grappling, le MMA tous niveaux et le travail au sol. La signature du plateau : le mardi soir, c’est le créneau tous niveaux — la cage s’ouvre aux débutants, Jérôme tient la porte.",
    img: "/assets/img/ram/octogone.webp",
    specs: ["Octogone 7 m", "Grappling · MMA tous niveaux"],
  },
  {
    n: "03",
    t: "Le grand ring",
    tag: "Anglaise · pieds-poings",
    d: "Un grand ring de boxe, cordes tendues, coin bleu, coin rouge. C’est là que le jab se règle et que le pieds-poings prend ses distances, midi et soir — et que le débutant apprend d’abord à toucher, pas à frapper.",
    img: "/assets/img/ram/anglaise.webp",
    specs: ["Grand ring de boxe", "Anglaise · Pieds-poings"],
  },
  {
    n: "04",
    t: "L’étage muscu/cardio",
    tag: "Deux niveaux",
    d: "Deux niveaux : en haut, l’étage muscu et cardio. Charges libres, machines, cardio — la caisse et la force qui portent tout le reste, en accès libre six jours sur sept.",
    img: "/assets/img/ram/muscu.webp",
    specs: ["Étage muscu/cardio", "Accès libre 6 j/7"],
  },
  {
    n: "05",
    t: "Les sacs",
    tag: "Boxing Camp · loisirs",
    d: "La ligne de sacs lourds pour le Boxing Camp et les créneaux loisirs : le volume, la répétition, le souffle qui brûle. On tape jusqu’à ne plus entendre que le cuir.",
    img: "/assets/img/ram/camp.webp",
    specs: ["Sacs lourds", "Camp · Loisirs"],
  },
  {
    n: "06",
    t: "Les espaces libres",
    tag: "Libres & collectifs",
    d: "Des espaces d’entraînement libres et collectifs, dedans et dehors, pour s’échauffer, gainer, étirer, ou juste souffler entre deux rounds, à l’air du soir.",
    img: "/assets/img/ram/plateau.webp",
    specs: ["Libres & collectifs", "Dedans · dehors"],
  },
];

/* Le code du plateau — quatre principes (registre documentaire). */
export const VALUES = [
  /* « on s’entraîne à l’air, sous le ciel » était écrit ici, sur l’accueil et
     dans la FAQ : la meilleure ligne du site, usée sur trois URL. Elle reste
     à l’accueil, où elle porte le claim. Ici, le registre est documentaire —
     on décrit le plateau, on ne le proclame pas. */
  { n: "01", t: "Dehors, vraiment", d: "300 m² extérieurs couverts. Tu sors du vestiaire et tu y es : la météo fait partie de la séance, pas d’un décor peint sur un mur." },
  // 02 : la cage tourne 3 créneaux/semaine et le MMA tous niveaux est marquée « Confirmé »
  // → « tu tournes dedans dès la première séance » contredisait /plannings/.
  { n: "02", t: "La cage est à toi le mardi", d: "Un octogone de 7 m. Grappling le mardi soir, tous niveaux : c’est le créneau où on ouvre la cage aux débutants. L’MMA tous niveaux, deux soirs, quand tu es prêt." },
  { n: "03", t: "Le geste d’abord", d: "Un grand ring, des coachs qui corrigent le geste avant de te faire suer. La justesse avant le bruit." },
  // 04 : la salle n’émet aucune clé — le fait verrouillé est l’émargement GPS.
  { n: "04", t: "À ton heure", d: "Deux niveaux, étage muscu/cardio, accès libre six jours sur sept. Rien à réserver, personne à convaincre : la porte est ouverte de 10h à 21h30." },
];

/* L’encadrement — noms = posters officiels rentrée 2026. Photos : Sonia &
   Jérôme prouvées (roster.json). Farouk & Valentin Guth sans photo prouvée →
   tuiles nom/silhouette (JAMAIS de stock, JAMAIS la face d’un autre). */
const _COACHES = [
  /* L'ORDRE EST UNE INFORMATION. Sonia ouvrait la liste en Â« pilier Â» ; le
     head coach est Jerome, et c'est imprime sous son nom sur le visuel
     officiel de la saison 2026/2027. Il ouvre donc, et les quatre autres
     suivent dans l'ordre ou la semaine les rencontre.

     Les cinq fiches portent desormais ce que les visuels disent : les
     disciplines, la bio, les qualites, la formation, l'approche, la devise.
     C'etait imprime sur le pave blanc de chaque visuel. On ne recopie pas ce
     pave en image â le site a sa propre fiche â mais on en garde chaque mot :
     une image ne s'indexe pas, un texte oui.

     `planning` : la cle qui relie au planning quand elle differe du nom
     affiche. Valentin s'appelle Guth (son visuel le dit) ; le planning
     officiel ecrit Â« Valentin Guth Â». On corrige l'affichage sans toucher au
     planning â un poster fait foi sur le planning, pas sur l'etat civil. */
  {
    name: "Jérôme",
    ratio: "1086 / 992",   /* le bloc sombre de SON visuel : le cadre s'y accorde */
    role: "MMA · Grappling · Prépa physique",
    tag: "Head coach",
    pillar: true,
    disciplines: ["MMA", "Grappling", "Prépa physique"],
    note: "Ancien combattant professionnel de MMA — il a évolué aux plus hauts niveaux aux États-Unis et au Canada. Exigeant et humain : il te reprend debout comme au sol, et son grappling du mardi soir est la porte d’entrée de la cage pour les débutants.",
    qualites: ["Leadership", "Exigence", "Passionné", "Pédagogue", "Mental d'acier"],
    parcours: "Ancien combattant professionnel de MMA — États-Unis et Canada",
    approche: [
      "Technique et discipline au service de la performance",
      "Progression individuelle et esprit d'équipe",
      "Respect, humilité et dépassement de soi",
    ],
    devise: "Discipline. Dépassement. Respect. Esprit de combat.",
    img: "/assets/img/ram/coach-jerome.webp",
  },
  {
    name: "Sonia",
    ratio: "1086 / 941",   /* le bloc sombre de SON visuel : le cadre s'y accorde */
    role: "Boxe thaï · Kickboxing · Boxing Lady",
    tag: "Présente toute la semaine",
    disciplines: ["Boxe thaï", "Kickboxing", "Préparation physique", "Boxing Lady"],
    note: "Les avis Google la citent par son prénom, et ce n’est pas un hasard : six créneaux par semaine, le pieds-poings et tout le féminin. Beaucoup mettent les gants pour la première fois dans son cours — le Lady Punch est fait pour ça.",
    qualites: ["Dynamique", "Exigeante", "Passionnée", "À l'écoute", "Mental d'acier"],
    formation: ["BPJEPS Sports de contact"],
    approche: [
      "Technique et pédagogie au service de la progression",
      "Entraînements variés, intenses et adaptés",
      "Bienveillance, motivation et dépassement de soi",
    ],
    devise: "Force, discipline, confiance : ensemble on va plus loin.",
    img: "/assets/img/ram/coach-sonia.webp",
  },
  {
    /* ABSENT DU SITE JUSQU'AU 24/08. Hicham tient les TROIS midis du planning
       officiel de la rentrée â le site le faisait travailler sans le nommer
       nulle part, et sa fiche n'existait pas. */
    name: "Hicham",
    ratio: "1086 / 879",   /* le bloc sombre de SON visuel : le cadre s'y accorde */
    role: "Boxe anglaise · les trois midis",
    tag: "Les midis",
    disciplines: ["Boxe anglaise", "Préparation physique"],
    note: "L’homme des midis : trois créneaux entre 12h40 et 13h20, anglaise et Boxing Camp — le format qui tient dans une pause déjeuner. Le geste propre d’abord, la condition physique avec, et tu retournes au bureau doué d’un direct.",
    qualites: ["Pédagogue", "Rigoureux", "À l'écoute", "Motivant", "Exigeant"],
    formation: ["BPJEPS AF"],
    approche: [
      "Technique et condition physique",
      "Progression adaptée à chacun",
      "Exigence et pédagogie",
    ],
    devise: "Se préparer. Apprendre. Progresser.",
    img: "/assets/img/ram/coach-hicham.webp",
  },
  {
    name: "Farouk",
    ratio: "1086 / 877",   /* le bloc sombre de SON visuel : le cadre s'y accorde */
    role: "Anglaise loisirs · Anglaise compétiteurs",
    tag: "Les soirs loisirs",
    disciplines: ["Boxe anglaise loisirs", "Boxe anglaise compétiteurs"],
    note: "L’anglaise du soir, dans les deux sens : les loisirs du lundi et du vendredi à 19h45, et le cours du mercredi qui pousse jusqu’à 20h15. Que tu veuilles apprendre à boxer ou préparer un combat, c’est le même homme qui tient les deux bouts.",
    qualites: ["Pédagogue", "Rigoureux", "À l'écoute", "Motivant", "Exigeant"],
    formation: ["Licence STAPS"],
    approche: [
      "Technique et tactique de la boxe",
      "Progression adaptée à chacun",
      "Exigence et bienveillance",
    ],
    devise: "Discipline. Technique. Progression. Dépassement.",
    img: "/assets/img/ram/coach-farouk.webp",
  },
  {
    name: "Valentin Guth",
    ratio: "1086 / 928",   /* le bloc sombre de SON visuel : le cadre s'y accorde */
    planning: "Valentin G",
    role: "Boxe loisirs · Boxe éducative",
    tag: "L'école",
    disciplines: ["Boxe loisirs", "Boxe éducative"],
    note: "Boxeur professionnel — et c’est à lui que la salle confie toute l’école : Baby Boxe dès 3 ans, éducative 7/11, ados 12/16, mercredi et samedi. Une boxe technique et engagée, mise à hauteur d’enfant sans jamais être au rabais.",
    qualites: ["Technique", "Combatif", "Rigoureux", "Passionné", "Pédagogue"],
    formation: ["BPJEPS Boxe anglaise", "BPJEPS Sports de contact"],
    parcours: "Boxeur professionnel — 3 victoires, 1 défaite, 1 nul · 2ᵉ français chez les super-coqs",
    approche: [
      "Technique et engagement",
      "De l'initiation au perfectionnement",
      "Passion et exigence à chaque séance",
    ],
    devise: "Apprendre. Combattre. Progresser.",
    img: "/assets/img/ram/coach-valentin.webp",
  },
];


/* ------------------------------------------------------------------ *
 *  LE PLANNING — grille filtrable (page /plannings/). Source : posters
 *  officiels rentrée 2026 (brief §3 + roster.json). Une ligne = un cours.
 *  `fam` relie au filtre discipline. Rien d’inventé, rien d’évasif.
 * ------------------------------------------------------------------ */
export const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const _SCHEDULE = [
  // Lundi
  { day: "Lun", start: "12h40", cours: "Boxing Camp", coach: "Sonia", fam: "adulte", disc: "boxing-camp" },
  { day: "Lun", start: "18h00", cours: "Lady Punch", coach: "Sonia", fam: "feminin", disc: "lady-punch" },
  { day: "Lun", start: "18h40", cours: "Boxe Pieds-Poings", coach: "Sonia", fam: "adulte", disc: "pieds-poings" },
  { day: "Lun", start: "19h45", cours: "Anglaise Loisirs", coach: "Farouk", fam: "adulte", disc: "anglaise" },
  // Mardi
  { day: "Mar", start: "12h40", cours: "Boxe Anglaise", coach: "Hicham", fam: "adulte", disc: "anglaise" },
  { day: "Mar", start: "18h40", cours: "Grappling", coach: "Jérôme", fam: "mma", disc: "grappling" },
  { day: "Mar", start: "19h45", cours: "MMA tous niveaux", coach: "Jérôme", fam: "mma", disc: "asso-mma" },
  // Mercredi
  { day: "Mer", start: "12h40", cours: "Boxing Camp", coach: "Hicham", fam: "adulte", disc: "boxing-camp" },
  { day: "Mer", start: "15h00", cours: "Éducative 7/11", coach: "Valentin G", fam: "enfant", disc: "ecole" },
  { day: "Mer", start: "16h00", cours: "Éducative 12/16", coach: "Valentin G", fam: "enfant", disc: "ecole" },
  { day: "Mer", start: "18h45", cours: "Boxe Anglaise (jusqu’à 20h15)", coach: "Farouk", fam: "adulte", disc: "anglaise" },
  // Jeudi
  { day: "Jeu", start: "12h40", cours: "Boxe Pieds-Poings", coach: "Sonia", fam: "adulte", disc: "pieds-poings" },
  { day: "Jeu", start: "18h40", cours: "Boxing Camp", coach: "Jérôme", fam: "adulte", disc: "boxing-camp" },
  { day: "Jeu", start: "19h45", cours: "MMA tous niveaux", coach: "Jérôme", fam: "mma", disc: "asso-mma" },
  // Vendredi
  { day: "Ven", start: "12h40", cours: "Boxe Anglaise", coach: "Hicham", fam: "adulte", disc: "anglaise" },
  { day: "Ven", start: "18h00", cours: "Lady Punch", coach: "Sonia", fam: "feminin", disc: "lady-punch" },
  { day: "Ven", start: "18h40", cours: "Boxe Pieds-Poings", coach: "Sonia", fam: "adulte", disc: "pieds-poings" },
  { day: "Ven", start: "19h45", cours: "Anglaise Loisirs", coach: "Farouk", fam: "adulte", disc: "anglaise" },
  // Samedi
  { day: "Sam", start: "11h00", cours: "Boxing Camp", coach: "Valentin G", fam: "adulte", disc: "boxing-camp" },
  { day: "Sam", start: "14h15", cours: "Baby Boxe 3/6", coach: "Valentin G", fam: "enfant", disc: "ecole" },
  { day: "Sam", start: "15h00", cours: "Éducative 7/11", coach: "Valentin G", fam: "enfant", disc: "ecole" },
  { day: "Sam", start: "16h00", cours: "Éducative 12/16", coach: "Valentin G", fam: "enfant", disc: "ecole" },
];




/* LA LÉGENDE DE LA GRILLE — la grille code déjà deux familles à l'œil
   (le liseré argent du Lady Punch, le point des créneaux cage). Ce code
   n’était écrit NULLE PART : un signal visuel que personne ne pouvait lire.
   Il se lit maintenant. */
export const GRID_LEGEND = [
  { cls: "feminin", label: "Lady Punch", d: "créneau 100 % féminin" },
  { cls: "mma", label: "Cage", d: "grappling & MMA tous niveaux, dans l’octogone" },
  { cls: "enfant", label: "École", d: "Baby Boxe, éducative, ados" },
];

/* ------------------------------------------------------------------ *
 *  L’ENTRÉE EN MATIÈRE — /activites/ (les cinq familles, pesées).
 *
 *  La page listait huit fiches, puis un CTA : trois blocs en tout. Elle
 *  disait CE QU’ON FAIT, jamais par où on entre — et le seul fait qui
 *  intéresse quelqu’un qui n’a jamais boxé (le niveau demandé) était la
 *  troisième ligne d’un tableau de faits, sous le coach et les créneaux.
 *
 *  Ce bloc pèse les cinq familles contre le planning officiel : combien de
 *  créneaux, quels jours, quel niveau à l’entrée. Tout est COMPTÉ depuis
 *  SCHEDULE — si le planning bouge, le bloc bouge. Rien d’ajouté.
 *
 *  `ouvertes` : la seule décision éditoriale du bloc, déclarée ICI plutôt
 *  que devinée dans le rendu — la liste des libellés de `niveau` qu’on
 *  considère comme une porte ouverte sans expérience. Le reste (Confirmé ·
 *  asso) est dit tel quel : on n’ouvre pas une porte qui ne l’est pas.
 * ------------------------------------------------------------------ */
export const ENTREE = {
  eyebrow: "Par où on entre",
  lead: "Chaque famille pesée contre le planning de la rentrée : ce qu’elle occupe dans la semaine, quels jours, et ce qu’on te demande de savoir en poussant la porte.",
  // verbatims du champ `niveau` (DISCIPLINES) — aucune reformulation
  ouvertes: ["Zéro prérequis", "Tous niveaux", "Débutant → confirmé", "Baby → ados", "À ton rythme"],
  kOuvert: "Sans prérequis",
  kReserve: "Quand tu es prêt",
  kSlots: "créneaux / semaine",
  /* FAMILLES est la liste du FILTRE de planning : elle ne contient que les
     familles qui ont des créneaux, donc pas l’accès libre. Ce bloc parle des
     familles de DISCIPLINES, qui en compte une de plus. Le seul libellé qui
     manque vit ici — on ne duplique pas les quatre autres. */
  libreLabel: "Accès libre",
  // l’accès libre n’a AUCUN créneau au planning : ce n’est pas un zéro, c’est
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
   `view` est la version servie DANS la page ; `src` est ce qui s’ouvre au clic.

   LES DEUX SONT MAINTENANT DU WebP, ET LE PLEIN FORMAT NE PERD RIEN.
   `src` désignait le PNG d’origine (1 961 et 1 418 ko) au nom du « non
   recompressé ». L’intention était juste, le moyen était cher : scripts/
   images.mjs encode désormais ces PNG en WebP SANS PERTE et vérifie le
   résultat pixel par pixel avant de l’écrire — écart maximal 0/255 sur les
   quatre canaux. Le fichier ouvert au clic est donc l’image d’origine au bit
   près, pour 798 et 673 ko au lieu de 1 961 et 1 418. Les PNG restent la
   source du dépôt, dans scripts/img-src/, hors de ce qui est déployé.

   `view` est calibré sur son affichage réel (1 600 px pour 1 552 px utiles au
   pire cas, mesuré au rendu) et non plus sur les 2 400 px du scan. */
export const POSTERS = [
  {
    src: "/assets/img/ram/planning-rentree-2026-full.webp",
    view: "/assets/img/ram/planning-rentree-2026.webp",
    w: 1600, h: 1189,
    label: `Rentrée ${SEASON}`,
    alt: `Planning officiel de la rentrée ${SEASON} de Boxing Center Ramonville : boxe anglaise, pieds-poings, grappling, MMA tous niveaux, boxing camp, Lady Punch et école enfants dès 3 ans, du lundi au samedi.`,
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
    name: "Offre Rentrée",
    price: "29 €",
    unit: "par personne",
    was: "au lieu de 44 €",
    feature: "4 semaines · cours illimités · sans engagement",
    items: ["4 semaines illimitées", "Encore mieux à deux — 29 € chacun", "Sans engagement"],
    cta: "Je prends ma place — 29 €",
    href: "https://boutique.boxingcenter.fr/offre/29",
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
    href: "https://boutique.boxingcenter.fr/offre/259",
    priority: false,
  },
  bonus: "Inscription enfant : le t-shirt Boxing Center est inclus — pour tous.",
};

/* Les tarifs affichés (page /tarifs/). C’est le SEUL endroit du site où
   le 10 € a le droit d’apparaître — ordre d’Eddy du 24/08/2026. */
const _TARIFS = [
  {
    name: "Offre Rentrée",
    price: "29 €",
    was: "44 €",
    period: "/ personne · 4 semaines",
    feature: "Cours illimités · sans engagement — encore mieux à deux",
    items: ["4 semaines illimitées", "29 € par personne (au lieu de 44 €)", "Sans engagement"],
    cta: "Je prends ma place — 29 €",
    href: "https://boutique.boxingcenter.fr/offre/29",
    highlight: true,
  },
  {
    name: "Offre Saison",
    price: "259 €",
    was: "400 €",
    period: "/ 12 mois",
    feature: "4× sans frais · accès aux 5 clubs — moins de 5 € par semaine",
    items: ["12 mois toutes disciplines", "4× 64,75 € sans frais", "Accès libre aux 5 clubs"],
    cta: "Je prends ma saison",
    href: "https://boutique.boxingcenter.fr/offre/259",
    highlight: false,
  },
  /* L'abonnement de tous les jours. Il manquait : la page passait de
     l'offre de rentree a l'ecole des enfants, et quelqu'un qui voulait
     juste s'abonner au mois ne trouvait aucun prix. Ecrit SANS prix barre —
     ce n'est pas une promotion, c'est le tarif. */
  {
    name: "L’abonnement au mois",
    price: "44 €",
    period: "/ 4 semaines · adulte",
    feature: "Étudiant 36 € sur justificatif — le tarif de tous les jours",
    items: ["Adulte 44 € / 4 semaines", "Étudiant 36 € / 4 semaines", "L’octogone, le ring, l’étage muscu", "Sans engagement"],
    cta: "Voir les formules au mois",
    href: "https://boutique.boxingcenter.fr/abonnements",
    highlight: false,
  },
  {
    name: "École enfants",
    price: "295 €",
    period: "/ an · t-shirt inclus",
    feature: "Baby Boxe 250 € · dès 3 ans, mercredi & samedi",
    items: ["Baby Boxe 3/6 ans : 250 €/an", "Éducative 7/11 & ados 12/16 : 295 €/an t-shirt inclus", "Encadrée par Valentin Guth"],
    cta: "Inscrire mon enfant",
    href: "https://boutique.boxingcenter.fr/abonnements",
    highlight: false,
  },
  {
    name: "Séance d’essai",
    price: "10 €",
    period: "la séance",
    feature: "Toujours là ? Alors viens essayer — matériel prêté",
    items: ["Toutes les disciplines", "Matériel prêté", "Sans engagement — tu viens, tu testes, tu décides"],
    cta: "Je viens essayer · 10 €",
    href: "https://boutique.boxingcenter.fr/seance-essai",
    highlight: false,
  },
];

/* Le réseau — 5 salles (Balma-Gramont VENDUE : jamais citée). `self`
   marque Ramonville, filtrée quand on montre « les 4 sœurs ». */
export const NETWORK = [
  { id: "portet", name: "Portet-sur-Garonne", tag: "Le vaisseau amiral", feat: "600 m² · ring de boxe anglaise · cage MMA", url: "https://www.boxing-center-portet.fr/" },
  { id: "minimes", name: "Minimes", tag: "Le berceau", feat: "Salle historique · 3 rings · l’école dès 3 ans", url: "https://bc-minimes.vercel.app/" },
  { id: "etats-unis", name: "États-Unis", tag: "Le colosse", feat: "La plus grande salle de France dédiée aux sports de combat", url: "https://boxingcenter.fr/" },
  { id: "st-cyprien", name: "Saint-Cyprien", tag: "La rive gauche", feat: "1 200 m² · un seul niveau", url: "https://bc-st-cyprien.vercel.app/" },
  { id: "ramonville", name: "Ramonville", tag: "L’octogone à ciel ouvert", feat: "Octogone 7 m · 300 m² extérieur couvert", url: "/", self: true },
];

/* Avis Google réels (source : _reviews-2026-07-12.json — Ramonville 4,1/5,
   55 avis). Verbatim, jamais édités, jamais inventés. */
export const REVIEWS = {
  rating: "4,1/5",
  count: 55, // relevé Google Maps 2026-08-06
  sourceLabel: "Avis Google",
  quotes: [
    { text: "Un grand merci à Sonia qui nous accompagne avec bienveillance. Je recommande la salle de Ramonville les yeux fermés !", author: "LEPICIER I.", stars: 5 },
    { text: "Super salle avec une très bonne ambiance. Les coachs sont très sympas et pédagogues. Je recommande !", author: "Camille L.", stars: 5 },
    { text: "Les enfants aiment bien y aller ; malgré un déménagement à 35 km, ils veulent continuer à s’entraîner.", author: "Manjoo N.", stars: 4 },
  ],
};

/* Carnet de terrain (page /galerie/). Uniquement des VRAIES photos Ramonville
   (scrapées du site officiel). AUCUNE photo d’une autre salle.

   HORODATAGE RETIRÉ — les 6 clichés prouvés sont pris DE JOUR et à COUVERT
   (charpente métallique, néons, lumière franche aux fenêtres). Les légendes
   « 21h48 / 20h12 / 19h05 » et l’alt « de nuit » étaient des repères de
   reportage inventés : dans un registre documentaire qui écrit « on ne montre
   que ce qu’on a filmé », c’est la seule chose que le client ne pardonnerait
   pas. La légende dit maintenant la ZONE, qui est vérifiable sur l’image.
   La météo LIVE reste dans la bande « Au-dessus du plateau » — elle parle de
   MAINTENANT, pas de la photo : ça, c’est honnête.

   `credit` : le photographe est incrusté dans le fichier (filigrane). On le
   crédite plutôt que de le rogner — un carnet de terrain cite ses sources.
   ⚠ À FAIRE VALIDER : droits d’exploitation des clichés Axel Derewiany. */
export const PHOTO_CREDIT = "Axel Derewiany";

/* `discs` — À QUOI SERT LE CADRE, dans la semaine. C’est l’angle propre au
   carnet, et il n’invente rien : chaque clé renvoie à une discipline de
   DISCIPLINES, et les jours/heures affichés sont RECOMPTÉS depuis SCHEDULE au
   rendu. La correspondance zone → discipline est celle qu’écrivent déjà les
   fiches de PLATEAU (l’octogone « pour le grappling, le MMA tous niveaux » ; le ring
   « là que le jab se règle et que le pieds-poings prend ses distances » ; les
   sacs « pour le Boxing Camp » ; l’étage « en accès libre six jours sur
   sept »). Les deux plans larges n’ont pas de créneau à eux : ils portent
   `hors`, qui dit leur nature au lieu de leur inventer un horaire. */
export const GALLERY = [
  /* 24 clichés choisis parmi les 62 livrés le 24/08/2026, dans l'ordre où
     on traverse la salle : le plateau, l'octogone, le ring, les sacs,
     l'étage, les cours. On n'en verse pas 62 — une galerie qui déverse
     n'est plus un carnet, c'est un dossier. La vignette charge la 800 ;
     la visionneuse va chercher la 1600 AU CLIC, quand on la demande. */
  { img: "/assets/img/ram/photos/plateau-ring-tatami-et-octogone-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/plateau-ring-tatami-et-octogone-boxing-center-ramonville.webp", w: 800, h: 534, zone: "Le plateau", place: "ring, tatami et octogone", alt: "Le plateau du Boxing Center Ramonville : le ring, le tatami et l'octogone sous la charpente.", discs: [] },
  { img: "/assets/img/ram/photos/octogone-7-metres-vide-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/octogone-7-metres-vide-boxing-center-ramonville.webp", w: 800, h: 533, zone: "Le plateau", place: "l'octogone au repos", alt: "L'octogone de 7 mètres du Boxing Center Ramonville, vide, entre deux cours.", discs: [] },
  { img: "/assets/img/ram/photos/etage-musculation-sous-la-charpente-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/etage-musculation-sous-la-charpente-boxing-center-ramonville.webp", w: 800, h: 534, zone: "Le plateau", place: "l'étage, sous la charpente", alt: "L'étage musculation du Boxing Center Ramonville, sous la charpente métallique.", discs: [] },
  { img: "/assets/img/ram/photos/octogone-cours-vu-d-en-haut-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/octogone-cours-vu-d-en-haut-boxing-center-ramonville.webp", w: 800, h: 532, zone: "L'octogone", place: "MMA au sol", alt: "Cours de MMA au sol dans l'octogone de 7 mètres du Boxing Center Ramonville.", discs: ["asso-mma", "grappling"] },
  { img: "/assets/img/ram/photos/octogone-vue-plongeante-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/octogone-vue-plongeante-boxing-center-ramonville.webp", w: 800, h: 532, zone: "L'octogone", place: "vue de dessus", alt: "L'octogone de 7 mètres du Boxing Center Ramonville vu de dessus pendant un cours.", discs: ["asso-mma"] },
  { img: "/assets/img/ram/photos/cours-de-mma-groupe-debout-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/cours-de-mma-groupe-debout-boxing-center-ramonville.webp", w: 800, h: 532, zone: "L'octogone", place: "le groupe debout", alt: "Le groupe du cours de MMA debout dans l'octogone du Boxing Center Ramonville.", discs: ["asso-mma"] },
  { img: "/assets/img/ram/photos/grappling-controle-au-sol-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/grappling-controle-au-sol-boxing-center-ramonville.webp", w: 800, h: 534, zone: "L'octogone", place: "contrôle au sol", alt: "Contrôle au sol pendant le cours de grappling du Boxing Center Ramonville.", discs: ["grappling"] },
  { img: "/assets/img/ram/photos/jiu-jitsu-bresilien-au-sol-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/jiu-jitsu-bresilien-au-sol-boxing-center-ramonville.webp", w: 800, h: 534, zone: "L'octogone", place: "travail au sol", alt: "Travail de jiu-jitsu brésilien au sol dans l'octogone du Boxing Center Ramonville.", discs: ["grappling"] },
  { img: "/assets/img/ram/photos/demonstration-de-soumission-au-sol-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/demonstration-de-soumission-au-sol-boxing-center-ramonville.webp", w: 800, h: 534, zone: "L'octogone", place: "travail de soumission au sol", alt: "Travail de projection en grappling au Boxing Center Ramonville.", discs: ["grappling"] },
  { img: "/assets/img/ram/photos/octogone-vu-du-grillage-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/octogone-vu-du-grillage-boxing-center-ramonville.webp", w: 800, h: 532, zone: "L'octogone", place: "vu du grillage", alt: "L'intérieur de l'octogone du Boxing Center Ramonville vu à travers le grillage.", discs: [] },
  { img: "/assets/img/ram/photos/mma-entrainement-dans-l-octogone-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/mma-entrainement-dans-l-octogone-boxing-center-ramonville.webp", w: 800, h: 532, zone: "L'octogone", place: "à l'entraînement", alt: "Entraînement de MMA dans l'octogone grillagé du Boxing Center Ramonville.", discs: ["asso-mma"] },
  { img: "/assets/img/ram/photos/cours-de-boxe-anglaise-sur-le-ring-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/cours-de-boxe-anglaise-sur-le-ring-boxing-center-ramonville.webp", w: 800, h: 532, zone: "Le ring", place: "cours d'anglaise", alt: "Cours de boxe anglaise sur le ring du Boxing Center Ramonville, travail de déplacements.", discs: ["anglaise"] },
  { img: "/assets/img/ram/photos/echauffement-du-groupe-debout-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/echauffement-du-groupe-debout-boxing-center-ramonville.webp", w: 800, h: 534, zone: "Le ring", place: "pattes d'ours", alt: "Travail aux pattes d'ours en binôme au Boxing Center Ramonville.", discs: ["anglaise", "pieds-poings"] },
  { img: "/assets/img/ram/photos/boxe-anglaise-garde-haute-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/boxe-anglaise-garde-haute-boxing-center-ramonville.webp", w: 800, h: 534, zone: "Le ring", place: "la garde", alt: "Un boxeur en garde haute au Boxing Center Ramonville, devant la fresque du club.", discs: ["anglaise"] },
  { img: "/assets/img/ram/photos/boxe-anglaise-en-binome-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/boxe-anglaise-en-binome-boxing-center-ramonville.webp", w: 800, h: 492, zone: "Le ring", place: "en binôme", alt: "Travail de boxe anglaise en binôme au Boxing Center Ramonville, devant le ring.", discs: ["anglaise"] },
  { img: "/assets/img/ram/photos/kick-boxing-coup-de-pied-haut-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/kick-boxing-coup-de-pied-haut-boxing-center-ramonville.webp", w: 800, h: 534, zone: "Le ring", place: "kick, coup de pied haut", alt: "Coup de pied haut au bouclier pendant le cours de kick-boxing du Boxing Center Ramonville.", discs: ["pieds-poings"] },
  { img: "/assets/img/ram/photos/sparring-pieds-poings-sur-tatami-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/sparring-pieds-poings-sur-tatami-boxing-center-ramonville.webp", w: 800, h: 533, zone: "Le ring", place: "sparring pieds-poings", alt: "Sparring pieds-poings sur le tatami du Boxing Center Ramonville.", discs: ["pieds-poings"] },
  { img: "/assets/img/ram/photos/boxing-camp-circuit-de-renforcement-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/boxing-camp-circuit-de-renforcement-boxing-center-ramonville.webp", w: 800, h: 447, zone: "Les sacs", place: "Boxing Camp", alt: "Circuit de renforcement du Boxing Camp au Boxing Center Ramonville, en groupe.", discs: ["boxing-camp"] },
  { img: "/assets/img/ram/photos/direct-aux-pattes-d-ours-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/direct-aux-pattes-d-ours-boxing-center-ramonville.webp", w: 800, h: 534, zone: "Les sacs", place: "direct aux pattes d’ours", alt: "Frappe au sac lourd pendant le Boxing Camp du Boxing Center Ramonville.", discs: ["boxing-camp"] },
  { img: "/assets/img/ram/photos/sacs-de-frappe-entrainement-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/sacs-de-frappe-entrainement-boxing-center-ramonville.webp", w: 800, h: 532, zone: "Les sacs", place: "la ligne de sacs", alt: "Deux pratiquants devant la ligne de sacs lourds du Boxing Center Ramonville, sous la charpente.", discs: ["boxing-camp"] },
  { img: "/assets/img/ram/photos/espace-musculation-poulies-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/espace-musculation-poulies-boxing-center-ramonville.webp", w: 800, h: 532, zone: "L'étage", place: "poulies et charges", alt: "L'espace musculation du Boxing Center Ramonville : poulies, bancs et charges libres.", discs: ["acces-libre"] },
  { img: "/assets/img/ram/photos/etage-bancs-et-machines-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/etage-bancs-et-machines-boxing-center-ramonville.webp", w: 800, h: 532, zone: "L'étage", place: "le cardio", alt: "L'espace cardio du Boxing Center Ramonville : vélos et rameurs à l'étage.", discs: ["acces-libre"] },
  { img: "/assets/img/ram/photos/lady-punch-boxe-100-pour-cent-feminin-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/lady-punch-boxe-100-pour-cent-feminin-boxing-center-ramonville.webp", w: 800, h: 534, zone: "Les cours", place: "Lady Punch", alt: "Une pratiquante du cours Lady Punch au Boxing Center Ramonville, enchaînement aux gants.", discs: ["lady-punch"] },
  { img: "/assets/img/ram/photos/cours-de-renforcement-vue-plongeante-boxing-center-ramonville-800.webp", plein: "/assets/img/ram/photos/cours-de-renforcement-vue-plongeante-boxing-center-ramonville.webp", w: 800, h: 533, zone: "Les cours", place: "renforcement, vu d’en haut", alt: "Cours de renforcement vu d’en haut au Boxing Center Ramonville.", discs: ["ecole"] },
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
 *  Son angle : une photo de salle n’est pas un décor, c’est un LIEU où il
 *  se passe quelque chose à une heure connue. Le carnet croise donc les six
 *  cadres avec le planning officiel — la seule chose qu’aucune autre page
 *  ne fait — puis dit sa méthode, puis avoue sa page blanche en trois
 *  lignes qui renvoient au relevé au lieu de le recopier.
 * ------------------------------------------------------------------ */
export const CARNET = {
  // les en-têtes de section vivent en clair dans /galerie/ (comme partout sur
  // le site) ; ici, seulement ce qui est DONNÉE ou étiquette réutilisée.
  kQuoi: "Les cours",
  kQuand: "Les jours",
  kLarge: "Plan large",
  /* COMPTE, PAS TEXTE. Cette phrase disait « quatre zones sur six » en
     dur : elle redevenait fausse au premier cliché ajouté — et elle l'est
     devenue le 24/08. Elle se calcule maintenant sur ce qui est
     réellement affiché. */
  usageFoot: (zones) => {
    const N = ["zéro", "Une", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit"];
    const avec = zones.filter((z) => z.discs.length).length;
    const sans = zones.length - avec;
    const g = `${N[avec] || avec} zone${avec > 1 ? "s" : ""} sur ${N[zones.length]?.toLowerCase() || zones.length} ${avec > 1 ? "ont" : "a"} un horaire.`;
    if (!sans) return `${g} Chacune est rendue au planning officiel.`;
    const q = sans > 1
      ? `Les ${N[sans].toLowerCase()} autres sont des plans d’ensemble : aucun cours ne s’y donne, donc aucun horaire.`
      : "L’autre est un plan d’ensemble : aucun cours ne s’y donne, donc aucun horaire.";
    return `${g} ${q}`;
  },
  horsDefaut: "Plan d’ensemble : on y voit l’espace, pas un cours. Donc pas d’horaire — on n’en invente pas.",
  /* les trois règles du carnet — la méthode, dite une fois, ici et nulle part
     ailleurs sur le site. */
  regles: [
    {
      k: "Une seule salle",
      d: "Aucun cadre ne vient d’une autre salle du réseau ni d’une banque d’images. Si ce n’est pas Ramonville, ce n’est pas dans ces pages — même quand ça laisse un trou.",
    },
    {
      k: "Le photographe est nommé",
      d: `Deux photos portent la signature de leur auteur, ${PHOTO_CREDIT} — incrustée dans l’image, on ne la rogne pas — c’est la seule façon honnête de garder l’image.`,
    },
    {
      k: "Aucune heure sur les légendes",
      d: "Les vingt-quatre cadres sont pris de jour et à couvert. La seule heure du carnet est celle de la bande du haut : elle vient du ciel de Ramonville, à la seconde où tu lis.",
    },
  ],
  // le renvoi de la page blanche : le relevé complet appartient à /la-salle/
  renvoi: { label: "Découvrir le plateau extérieur", href: "/la-salle/#releve" },
};

export const FAQ = [
  { q: "Où se trouve Boxing Center Ramonville ?", a: "Au 33 rue des Ormes, 31520 Ramonville-Saint-Agne, dans le sud toulousain — au pied du terminus du métro (ligne B, Ramonville) et de l’arrêt bus Ramonville Sud." },
  { q: "C’est vrai qu’on s’entraîne dehors ?", a: "Oui, et c’est la seule des cinq salles où c’est possible : 300 m² dehors, aménagés et couverts, praticables toute l’année — une averse ne renvoie personne à l’intérieur. Sous charpente, tu as l’octogone de 7 m et le grand ring de boxe." },
  { q: "Quelles disciplines peut-on pratiquer ?", a: "Boxe anglaise et anglaise loisirs, boxe pieds-poings, grappling, MMA tous niveaux dans l’octogone, Boxing Camp, Lady Punch (100 % féminin) et toute l’école enfants du Baby Boxe (3 ans) aux ados 12/16. Un étage muscu/cardio est en accès libre." },
  { q: "Y a-t-il des cours pour les enfants ?", a: "Oui, dès 3 ans : Baby Boxe 3/6 le samedi, éducative 7/11 ans et ados 12/16 ans le mercredi et le samedi après-midi, encadrés par Valentin Guth." },
  { q: "Faut-il un niveau pour commencer ?", a: "Aucun. L’offre de rentrée à 29 € par personne ouvre quatre semaines de cours illimités, matériel prêté. La plupart des créneaux — loisirs, camp, pieds-poings — sont ouverts à tous les niveaux." },
  { q: "Quels sont les horaires ?", a: "Du lundi au samedi, de 10h00 à 21h30, accès libre muscu/cardio inclus. Fermé le dimanche. Un émargement GPS est demandé en salle avant chaque cours." },
];

/* ------------------------------------------------------------------ *
 *  LES SIX EXPORTS SURCHARGEABLES.
 *  Tout le reste du fichier s’exporte tel quel : ce sont les faits que
 *  le staff n’a aucune raison de retoucher depuis le vestiaire (le
 *  relevé, l’arpentage, le carnet, la méthode). Ceux-ci bougent avec la
 *  vie de la salle — coordonnées, planning, tarifs, encadrement — et
 *  c’est exactement ceux-là que /admin/ peut publier.
 * ------------------------------------------------------------------ */
export const SALLE       = calque(_SALLE, "salle");
export const DISCIPLINES = calque(_DISCIPLINES, "disciplines");
export const COACHES     = calque(_COACHES, "coaches");
export const SCHEDULE    = calque(_SCHEDULE, "schedule");
export const TARIFS      = calque(_TARIFS, "tarifs");
export const PROMOS      = calque(_PROMOS, "promos");
