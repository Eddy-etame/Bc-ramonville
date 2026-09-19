/* =====================================================================
   RAMONVILLE · scripts/generer-club-de-boxe.mjs — /club-de-boxe-ramonville/

   Eddy, 17/09 : sur « club de boxe ramonville », mmatoulouse.com est
   cinquième, derrière le site du groupe, une page GitHub et une salle de
   CrossFit. Cette page est LA page du club pour cette requête : son
   histoire (ouvert en septembre 2019), ce qui le distingue (le plateau
   dehors, l'octogone), ce qu'on y pratique, qui encadre, comment venir,
   ce que ça coûte — et des liens vers TOUTES les pages du site, pour que
   chacune en profite.

   Rien n'est inventé : les faits viennent de data.js (SALLE, DISCIPLINES,
   COACHES, NETWORK, SCHEDULE) et des liens générés (disciplines-liens,
   coachs-liens). Aucun texte d'une autre page n'est recopié : les phrases
   sont neuves (jamais le même texte deux fois sur le site).

   Gabarit : la tête et le pied de /activites/mma/ (discipline.css porte
   .dp-faq, .dp-grille, .dp-carte). Tourne après generer-nos-clubs.mjs et
   avant astro build.
   ===================================================================== */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, BASE, donnees } from "./disciplines-lib.mjs";

const D = await donnees();
const { SALLE, DISCIPLINES, COACHES, NETWORK, SCHEDULE } = D;
const { PAGES_DISCIPLINES } = await import(pathToFileURL(join(ROOT, "public", "assets", "js", "disciplines-liens.js")).href);
const { PAGES_COACHS } = await import(pathToFileURL(join(ROOT, "public", "assets", "js", "coachs-liens.js")).href);
const { roleHtml } = await import(pathToFileURL(join(ROOT, "public", "assets", "js", "role-liens.js")).href);

const GABARIT = readFileSync(join(ROOT, "src", "pages", "activites", "mma", "index.astro"), "utf8");
const e = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  .replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");

const CHEMIN = "/club-de-boxe-ramonville/";
const URL = `${BASE}${CHEMIN}`;
const TITRE = "Club de boxe à Ramonville : le Boxing Center depuis 2019";
const DESC = "Le club de boxe de Ramonville-Saint-Agne, ouvert en septembre 2019 au terminus du métro B : le plateau dehors, l’octogone de 7 m, huit disciplines, cinq coachs. Son histoire, ses cours, ses tarifs.";
const OG = `${BASE}/assets/img/ram/og/club-de-boxe-ramonville.jpg?v=1`;
const ALT = "Le ring et la fresque murale du club de boxe de Ramonville";
const ANNEE = (SALLE.foundingDate || "2019-09").slice(0, 4);
const nbCours = Array.isArray(SCHEDULE) ? SCHEDULE.length : 22;

/* ── la tête ─────────────────────────────────────────────────────────── */
let tete = GABARIT.slice(GABARIT.indexOf("<!doctype html>"), GABARIT.indexOf("</head>"))
  .replace(/\s*<script is:inline type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
const pose = (rx, val) => { if (!rx.test(tete)) throw new Error(`[club-de-boxe] balise absente : ${rx}`); tete = tete.replace(rx, (m0, a, b) => `${a}${val}${b}`); };
tete = tete.replace(/<title>[\s\S]*?<\/title>/, `<title>${e(TITRE)}</title>`);
pose(/(<meta name="description" content=")[^"]*(")/, e(DESC));
pose(/(<link rel="canonical" href=")[^"]*(")/, URL);
pose(/(<meta property="og:title" content=")[^"]*(")/, e(TITRE));
pose(/(<meta property="og:description" content=")[^"]*(")/, e(DESC));
pose(/(<meta property="og:url" content=")[^"]*(")/, URL);
pose(/(<meta property="og:image" content=")[^"]*(")/, OG);
pose(/(<meta property="og:image:alt" content=")[^"]*(")/, e(ALT));
pose(/(<meta name="twitter:title" content=")[^"]*(")/, e(TITRE));
pose(/(<meta name="twitter:description" content=")[^"]*(")/, e(DESC));
pose(/(<meta name="twitter:image" content=")[^"]*(")/, OG);
pose(/(<meta name="twitter:image:alt" content=")[^"]*(")/, e(ALT));
tete = tete.replace(/<meta property="og:type" content="[^"]*"/, '<meta property="og:type" content="article"');

/* ── le pied ─────────────────────────────────────────────────────────── */
const i0 = GABARIT.indexOf('<div id="footer"></div>');
const iBody = GABARIT.lastIndexOf("</body>");
if (i0 < 0 || iBody < 0) throw new Error("[club-de-boxe] le gabarit /activites/mma/ a changé de forme");
const PIED = GABARIT.slice(i0, GABARIT.lastIndexOf("</script>", iBody) + "</script>".length);

/* ── les cartes ──────────────────────────────────────────────────────── */
const hrefDisc = (d) => (PAGES_DISCIPLINES.find((p) => p.key === d.key) || {}).href || "/activites/";
const hrefCoach = (c) => (PAGES_COACHS.find((p) => p.nom === c.name) || {}).href || "/coachs/";

/* une ligne NEUVE par discipline — pas la description de /activites/ */
const LIGNE = {
  "anglaise": "Les poings, la garde, le déplacement, sur le grand ring du plateau.",
  "pieds-poings": "Poings et jambes, sur le tatami du plateau, avec Sonia.",
  "grappling": "Le combat au sol, sans un coup : la porte d’entrée vers la cage.",
  "asso-mma": "Debout et au sol, dans l’octogone de 7 m, tous niveaux.",
  "boxing-camp": "Un peu de tout, beaucoup de cardio. Le cours pour démarrer.",
  "lady-punch": "La boxe entre femmes, 100 % féminin, zéro prérequis.",
  "ecole": "Dès 3 ans : Baby Boxe, puis 7/11 et 12/16. On touche, on ne frappe pas.",
  "acces-libre": "L’étage muscu et cardio, compris dans l’abonnement, aux heures d’ouverture.",
};
const carteDisc = (d) => `<a class="dp-carte dp-carte--lien" href="${hrefDisc(d)}"><span class="dp-tag">${e(d.tag)}</span><h3>${e(d.name)}</h3><p>${e(LIGNE[d.key] || d.jours)}</p></a>`;
const carteCoach = (c) => `<article class="dp-carte dp-carte--lien carte-lien"><span class="dp-tag">${e(c.tag)}</span><h3><a class="carte-lien__tout" href="${hrefCoach(c)}">${e(c.name)}</a></h3><p>${roleHtml(c.role, c.name)}</p></article>`;

const ici = NETWORK.find((n) => n.self);
const autres = NETWORK.filter((n) => !n.self);

/* ── la FAQ ──────────────────────────────────────────────────────────── */
const FAQ = [
  ["Depuis quand le club de boxe de Ramonville existe-t-il ?",
   `Boxing Center Ramonville a ouvert en septembre ${ANNEE}, au ${SALLE.address.street}, à Ramonville-Saint-Agne. C’est l’une des cinq salles du réseau Boxing Center autour de Toulouse.`],
  ["C’est un club de boxe ou un club de MMA ?",
   "Les deux. La boxe anglaise a le grand ring, le MMA et le grappling ont l’octogone de 7 m, la boxe pieds-poings a le tatami. Le même abonnement ouvre tous les cours."],
  ["Qu’est-ce qui le distingue des autres clubs de boxe ?",
   "Le plateau est dehors : 300 m² couverts, où l’on s’entraîne toute l’année. Aucune autre salle du réseau ne le propose."],
  ["Peut-on venir depuis Toulouse sans voiture ?",
   "Oui. La salle est au pied du terminus Ramonville de la ligne B du métro, et le bus s’arrête à Ramonville Sud, juste devant."],
  ["Faut-il déjà savoir boxer pour s’inscrire ?",
   "Non. Sept cours sur huit n’ont aucun prérequis. Le premier soir, on dit « c’est ma première fois » à l’accueil et un coach oriente."],
  ["Combien coûte l’inscription au club ?",
   "L’année complète est à 259 € au lieu de 400 €, payée comptant, pour les cinq clubs. Sans engagement, l’offre de rentrée est à 29 € par personne toutes les 4 semaines, au lieu de 44 €. Le détail est sur la page des tarifs."],
];

/* ── les données structurées ─────────────────────────────────────────── */
const ld = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "@id": `${URL}#webpage`, url: URL, name: TITRE, description: DESC, inLanguage: "fr-FR",
      isPartOf: { "@id": `${BASE}/#website` }, about: { "@id": `${BASE}/#salle` }, mainEntity: { "@id": `${BASE}/#salle` },
      breadcrumb: { "@id": `${URL}#breadcrumb` },
      primaryImageOfPage: { "@type": "ImageObject", url: OG.replace(/\?.*$/, ""), width: 1200, height: 630 } },
    { "@type": "BreadcrumbList", "@id": `${URL}#breadcrumb`, itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Le club de boxe de Ramonville", item: URL },
    ] },
    { "@type": "FAQPage", "@id": `${URL}#faq`, mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ],
};

const html = `${tete}  <script is:inline type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
</head>

<body data-page="club-de-boxe">
  <a class="sr-only" href="#main">Aller au contenu</a>
  <div id="nav"></div>
  <div id="drawer"></div>

  <main id="main">
    <header class="phero" aria-label="Le club de boxe de Ramonville">
      <div class="sky" aria-hidden="true"><canvas class="sky__stars"></canvas><div class="sky__haze"></div><div class="sky__moon"></div></div>
      <div class="wrap">
        <nav class="breadcrumb" aria-label="Fil d’ariane"><a href="/">Accueil</a> / <span>Le club</span></nav>
        <h1 class="display phero__title"><span class="reveal-mask"><span>Le club de boxe</span></span><span class="reveal-mask"><span class="tint">de Ramonville.</span></span></h1>
        <p class="phero__lead" data-reveal>Boxing Center Ramonville : un club de boxe et de MMA au terminus du métro B, ouvert depuis septembre ${ANNEE}, où l’on s’entraîne dehors toute l’année.</p>
      </div>
    </header>

    <section class="section" aria-labelledby="t-histoire">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">L’histoire</span><h2 class="display" id="t-histoire">Un club de boxe au sud de Toulouse.</h2></div>
        <div class="dp-prose" data-reveal>
          <p>Boxing Center Ramonville a ouvert ses portes en septembre ${ANNEE}, au ${e(SALLE.address.street)}, à Ramonville-Saint-Agne. Le club appartient au réseau Boxing Center, cinq salles autour de Toulouse dont la salle phare est à Portet-sur-Garonne depuis 2016. À Ramonville, l’idée de départ n’a pas changé : un club de boxe ouvert à tout le monde, à celui qui n’a jamais fait de sport comme à celle qui prépare un combat.</p>
          <p>Ce qui fait la différence tient en un mot : dehors. Le plateau d’entraînement est en extérieur — 300 m² aménagés et couverts, avec un octogone de 7 m pour le MMA et le grappling, un grand ring pour la boxe anglaise et un tatami pour la boxe pieds-poings. Un étage de musculation et de cardio complète la salle, en accès libre aux heures d’ouverture. <a href="/la-salle/">Le plateau en détail</a>, et <a href="/galerie/">les photos du club</a>.</p>
          <p>Aujourd’hui, le club donne ${nbCours} cours par semaine, du lundi au samedi, tenus par cinq coachs. Il est affilié à la ${e(SALLE.federations.join(", à la "))}.</p>
        </div>
      </div>
    </section>

    <section class="section dp-bande" aria-labelledby="t-cours">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Les cours</span><h2 class="display" id="t-cours">Huit disciplines, un seul club.</h2></div>
        <div class="dp-grille dp-grille--3" data-reveal-group>
          ${DISCIPLINES.map(carteDisc).join("\n          ")}
        </div>
        <p class="dp-suite" data-reveal><a class="btn btn--ghost" data-magnetic href="/activites/"><span>Toutes les activités</span></a> <a class="btn btn--ghost" data-magnetic href="/plannings/"><span>Le planning de la semaine</span></a></p>
      </div>
    </section>

    <section class="section" aria-labelledby="t-coachs">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">L’encadrement</span><h2 class="display" id="t-coachs">Cinq coachs, chacun sa discipline.</h2></div>
        <div class="dp-grille dp-grille--3" data-reveal-group>
          ${COACHES.map(carteCoach).join("\n          ")}
        </div>
        <p class="dp-suite" data-reveal><a class="btn btn--ghost" data-magnetic href="/coachs/"><span>L’équipe au complet</span></a></p>
      </div>
    </section>

    <section class="section dp-bande" aria-labelledby="t-venir">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Venir au club</span><h2 class="display" id="t-venir">Au terminus du métro B.</h2></div>
        <div class="dp-prose" data-reveal>
          <p>Le club est au ${e(SALLE.address.full)}. ${e(SALLE.access[0].replace(/ — /, " : "))}. ${e(SALLE.access[1].replace(/ — /, " : "))}. Par la rocade, sortie Ramonville.</p>
          <p>Ouvert ${e(SALLE.hours.replace("Lun – Sam", "du lundi au samedi"))}, fermé le dimanche. ${e(SALLE.note)} <a href="/contact/">Adresse, plan et contact</a> · <a href="/plannings/">les horaires de chaque cours</a>.</p>
        </div>
      </div>
    </section>

    <section class="piege" aria-label="Les offres">
      <div class="wrap">
        <p class="amorce-ram" data-reveal>Un abonnement, les cinq clubs.</p>
        <a class="plaque plaque--duo" data-reveal href="https://boutique.boxingcenter.fr/offres-speciales"
           aria-label="Offres spéciales : l’année complète à 259 € au lieu de 400 €, ou l’offre de rentrée à 29 € par personne pour 4 semaines, au lieu de 44 €">
          <span class="plaque__faces alt" data-alterne>
            <span class="plaque__face alt__face is-on">
              <span class="plaque__sur">L’année complète</span>
              <span class="plaque__prix"><b>259</b><i>€</i></span>
              <span class="plaque__unit">12 mois · les 5 clubs</span>
              <span class="plaque__barre">au lieu de 400 €</span>
            </span>
            <span class="plaque__face alt__face" aria-hidden="true">
              <span class="plaque__sur">Offre de rentrée</span>
              <span class="plaque__prix"><b>29</b><i>€</i></span>
              <span class="plaque__unit">par personne · 4 semaines</span>
              <span class="plaque__barre">au lieu de 44 €</span>
            </span>
          </span>
          <span class="plaque__go">Voir les offres spéciales <i aria-hidden="true">→</i></span>
        </a>
        <p class="dp-suite" data-reveal><a href="/tarifs/">Toutes les formules et leurs conditions</a></p>
      </div>
    </section>

    <section class="section" aria-labelledby="t-reseau">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Le réseau</span><h2 class="display" id="t-reseau">Un club parmi cinq.</h2></div>
        <div class="dp-prose" data-reveal>
          <p>Boxing Center ${e(ici.name)} est l’une des cinq salles du réseau, avec ${autres.map((n) => `<a href="${e(n.url)}" rel="noopener">${e(n.name)}</a>`).join(", ")}. L’abonnement Saison ouvre les cinq. <a href="/nos-clubs/">Les cinq clubs, leurs adresses et leurs sites</a> · <a href="/about/">à propos de Boxing Center Ramonville</a>.</p>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="t-faq">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Questions</span><h2 class="display" id="t-faq">Ce qu’on demande sur le club.</h2></div>
        <div class="dp-faq">
          ${FAQ.map(([q, a]) => `<details><summary>${e(q)}</summary><p>${e(a)}</p></details>`).join("\n          ")}
        </div>
      </div>
    </section>
  </main>

  ${PIED}
</body>
</html>
`;
mkdirSync(join(ROOT, "src", "pages", "club-de-boxe-ramonville"), { recursive: true });
writeFileSync(join(ROOT, "src", "pages", "club-de-boxe-ramonville", "index.astro"), html);
const liens = (html.match(/href="\/[^"]*"/g) || []).length;
console.log(`[club-de-boxe] ${CHEMIN} · ${DISCIPLINES.length} disciplines · ${COACHES.length} coachs · ${FAQ.length} questions · ${liens} liens internes · titre ${TITRE.length} · description ${DESC.length}`);
