/* =====================================================================
   RAMONVILLE · scripts/generer-mma-toulouse.mjs — /mma-toulouse/

   Eddy, 12/10/2026 : le site s'appelle mmatoulouse.com et il n'apparaît
   nulle part sur « MMA Toulouse » (absent du top 10 Google, du top 24
   Bing et du top 20 Brave, relevé du 12/10). Aucun titre, aucun H1 du
   site ne répond à cette requête. Cette page y répond, honnêtement : le
   club est à Ramonville-Saint-Agne, pas dans Toulouse — on le dit, et on
   montre les trois cages du réseau autour de Toulouse.

   Rien n'est inventé :
   - créneaux, coach, fédérations, horaires, adresse : data.js (SCHEDULE,
     DISCIPLINES, COACHES, SALLE, NETWORK) ;
   - 8 km du Capitole : coordonnées OpenStreetMap du 33 rue des Ormes
     (43,5366 ; 1,4840) et du Capitole (43,6044 ; 1,4431), vol d'oiseau ;
   - gants MMA « The Shell » à retirer à Ramonville : fiche box-plus
     (attribut « Lieu retrait produits », relevé du 12/10).
   Ni prix (ils changent, ils vivent sur /tarifs/), ni le mot qu'Eddy
   interdit pour Ramonville, ni « au pied du métro » (la station est à
   2,2 km à vol d'oiseau selon OpenStreetMap : question posée à Eddy).

   Phrases neuves : aucune n'est reprise d'une autre page du site ni du
   réseau (règle « une phrase, un site »).

   Gabarit : la tête et le pied de /activites/mma/, comme
   generer-club-de-boxe.mjs. Tourne après celui-ci, avant astro build.
   ===================================================================== */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, BASE, donnees, creneaux, JOUR } from "./disciplines-lib.mjs";

const D = await donnees();
const { SALLE, DISCIPLINES, COACHES, NETWORK, SCHEDULE } = D;

const GABARIT = readFileSync(join(ROOT, "src", "pages", "activites", "mma", "index.astro"), "utf8");
const e = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  .replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");

const CHEMIN = "/mma-toulouse/";
const URL = `${BASE}${CHEMIN}`;
const TITRE = "MMA à Toulouse sud-est : l’octogone de 7 m de Ramonville";
const DESC = "Le MMA au sud-est de Toulouse : un octogone de 7 m à Ramonville-Saint-Agne, deux cours par semaine ouverts aux débutants, et les deux autres cages du réseau.";
const OG = `${BASE}/assets/img/ram/og/mma-toulouse.jpg?v=1`;
const ALT = "Un cours dans l’octogone de 7 m du Boxing Center Ramonville, vu de la mezzanine";
const PUBLIE = "2026-10-12";

/* ── les faits ───────────────────────────────────────────────────────── */
const MMA = DISCIPLINES.find((d) => d.key === "asso-mma");
const GRAP = DISCIPLINES.find((d) => d.key === "grappling");
if (!MMA || !GRAP) throw new Error("[mma-toulouse] les fiches MMA et grappling manquent à data.js");
const cMma = creneaux(SCHEDULE, "asso-mma");
const cGrap = creneaux(SCHEDULE, "grappling");
if (!cMma.length || !cGrap.length) throw new Error("[mma-toulouse] aucun créneau MMA ou grappling dans SCHEDULE");
const heure = (h) => String(h).replace(/^(\d+)h(\d\d)$/, "$1\u00a0h\u00a0$2").replace(/^(\d+)h$/, "$1\u00a0h");
const EN_MOTS = ["Zéro", "Un", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit"];
const fin = (MMA.jours.match(/–\s*(\d+h\d\d)/) || [])[1];
const joursMma = [...new Set(cMma.map((s) => JOUR[s.day]))];
const joursMmaMots = joursMma.length === 1 ? `le ${joursMma[0]}` : `le ${joursMma.slice(0, -1).join(", le ")} et le ${joursMma.at(-1)}`;
const coach = COACHES.find((c) => c.name === MMA.coach) || COACHES[0];
const feds = SALLE.federations || [];
const etatsUnis = NETWORK.find((n) => n.id === "etats-unis");
const portet = NETWORK.find((n) => n.id === "portet");
const cageAilleurs = [etatsUnis, portet].filter(Boolean);
const BOXPLUS_SHELL = "https://boutique.boxingcenter.fr/materiel/produit/gants-mma-the-shell";

/* ── la tête ─────────────────────────────────────────────────────────── */
let tete = GABARIT.slice(GABARIT.indexOf("<!doctype html>"), GABARIT.indexOf("</head>"))
  .replace(/\s*<script is:inline type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
const pose = (rx, val) => { if (!rx.test(tete)) throw new Error(`[mma-toulouse] balise absente : ${rx}`); tete = tete.replace(rx, (m0, a, b) => `${a}${val}${b}`); };
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
if (i0 < 0 || iBody < 0) throw new Error("[mma-toulouse] le gabarit /activites/mma/ a changé de forme");
const PIED = GABARIT.slice(i0, GABARIT.lastIndexOf("</script>", iBody) + "</script>".length);

/* ── la semaine autour de la cage ────────────────────────────────────── */
const LIGNE_COURS = {
  "grappling": "Le combat au sol, sans un seul coup. La porte d’entrée la plus douce.",
  "asso-mma": "Debout puis au sol, dans la cage. Débutants acceptés.",
};
const lignes = [...cGrap, ...cMma]
  .sort((a, b) => ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].indexOf(a.day) - ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].indexOf(b.day) || a.start.localeCompare(b.start))
  .map((s) => `<tr><th scope="row">${e(JOUR[s.day].replace(/^./, (c) => c.toUpperCase()))}</th><td data-label="Heure">${e(heure(s.start))}${s.disc === "asso-mma" && fin ? `\u00a0–\u00a0${e(heure(fin))}` : ""}</td><td data-label="Cours"><a href="${s.disc === "asso-mma" ? "/activites/mma/" : "/activites/grappling/"}">${e(s.cours)}</a></td><td data-label="Pour qui">${e(LIGNE_COURS[s.disc] || "")}</td></tr>`);

/* ── la FAQ ──────────────────────────────────────────────────────────── */
const adresseDe = (n) => (n && n.adresse) || "";
const FAQ = [
  ["Où faire du MMA à Toulouse ?",
   `Le réseau Boxing Center a trois cages : à Toulouse même, avenue des États-Unis (${adresseDe(etatsUnis)}), à Portet-sur-Garonne (${adresseDe(portet)}) et à Ramonville-Saint-Agne (${SALLE.address.full}), au sud-est. À Ramonville, le MMA tous niveaux a lieu ${joursMmaMots} à ${heure(cMma[0].start)}.`],
  ["Peut-on débuter le MMA sans jamais avoir combattu ?",
   `Oui. Le cours de MMA est ouvert aux débutants, et le grappling du ${JOUR[cGrap[0].day]} à ${heure(cGrap[0].start)} fait découvrir la cage sans recevoir de coups.`],
  ["Faut-il viser la compétition pour s’inscrire ?",
   "Non. Le cours est tous niveaux : on peut s’y entraîner des années sans jamais monter sur un combat."],
  ["Quel matériel pour un premier cours de MMA ?",
   "Une tenue ajustée, sans poche ni fermeture éclair, suffit le premier soir. Les gants à doigts libres et le protège-dents viennent ensuite ; la liste complète, dans l’ordre, est dans le conseil matériel du club."],
  ["MMA ou grappling : par quoi commencer ?",
   "Par le grappling si tu veux apprivoiser la cage sans coups, par le MMA si le travail debout t’attire tout de suite. Le même abonnement ouvre les deux."],
  ["Le club est-il affilié à une fédération ?",
   `Oui : à la ${feds.join(", à la ")}. La FMMAF est la fédération française de MMA.`],
];

/* ── les données structurées ─────────────────────────────────────────── */
const ld = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "@id": `${URL}#webpage`, url: URL, name: TITRE, description: DESC, inLanguage: "fr-FR",
      datePublished: PUBLIE, dateModified: PUBLIE,
      isPartOf: { "@id": `${BASE}/#website` }, about: { "@id": `${BASE}/#salle` },
      breadcrumb: { "@id": `${URL}#breadcrumb` },
      primaryImageOfPage: { "@type": "ImageObject", url: OG.replace(/\?.*$/, ""), width: 1200, height: 630 } },
    { "@type": "BreadcrumbList", "@id": `${URL}#breadcrumb`, itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Le MMA au sud-est de Toulouse", item: URL },
    ] },
    { "@type": "FAQPage", "@id": `${URL}#faq`, mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ],
};

const html = `${tete}  <script is:inline type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
</head>

<body data-page="mma-toulouse">
  <a class="sr-only" href="#main">Aller au contenu</a>
  <div id="nav"></div>
  <div id="drawer"></div>

  <main id="main">
    <header class="phero" aria-label="Le MMA au sud-est de Toulouse">
      <div class="sky" aria-hidden="true"><canvas class="sky__stars"></canvas><div class="sky__haze"></div><div class="sky__moon"></div></div>
      <div class="wrap">
        <nav class="breadcrumb" aria-label="Fil d’ariane"><a href="/">Accueil</a> / <span>MMA Toulouse</span></nav>
        <h1 class="display phero__title"><span class="reveal-mask"><span>Le MMA,</span></span><span class="reveal-mask"><span class="tint">au sud-est de Toulouse.</span></span></h1>
        <p class="phero__lead" data-reveal>À Ramonville-Saint-Agne, à 8 km du Capitole, Boxing Center Ramonville fait du MMA ${e(joursMmaMots)} soir dans un octogone de 7 m, débutants compris. Pour une première fois en douceur, le grappling du ${e(JOUR[cGrap[0].day])} ouvre la cage sans un seul coup.</p>
        <p class="cs-maj" data-reveal>Publié le 12 octobre 2026</p>
      </div>
    </header>

    <section class="section" aria-labelledby="t-cage">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Dans la cage</span><h2 class="display" id="t-cage">Debout, au corps à corps, puis au sol.</h2></div>
        <div class="dp-prose" data-reveal>
          <p>Le MMA assemble trois manières de se battre : frapper debout, saisir au corps à corps, contrôler au sol. À Ramonville, le cours s’appelle « ${e(MMA.name)} » et se donne dans l’octogone de 7 m du plateau, sous la charpente. On y apprend d’abord à placer sa garde, à chuter sans se faire mal, à se relever, à tenir une position.</p>
          <p>L’opposition n’est jamais une obligation : personne n’affronte un partenaire sans l’avoir demandé. Le cours est tous niveaux : on y vient pour apprendre, la compétition reste un choix personnel. <a href="/activites/mma/">Le cours de MMA en détail</a> · <a href="/activites/grappling/">le grappling</a>.</p>
        </div>
      </div>
    </section>

    <section class="section dp-bande" aria-labelledby="t-semaine">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">La semaine</span><h2 class="display" id="t-semaine">${EN_MOTS[cGrap.length + cMma.length] || cGrap.length + cMma.length} rendez-vous par semaine autour de la cage.</h2></div>
        <div class="dp-prose" data-reveal>
          <div class="cs-table">
            <table aria-label="Les cours de MMA et de grappling de Boxing Center Ramonville">
              <thead><tr><th scope="col">Jour</th><th scope="col">Heure</th><th scope="col">Cours</th><th scope="col">Pour qui</th></tr></thead>
              <tbody>
                ${lignes.join("\n                ")}
              </tbody>
            </table>
          </div>
          <p>La salle est ouverte ${e(SALLE.hours.replace("Lun – Sam", "du lundi au samedi").replace("·", "de").replace(/(\d+)h00/g, "$1 h").replace(/(\d+)h(\d\d)/g, "$1 h $2").replace(" – ", " à "))} : en dehors des cours, l’étage de musculation et de cardio est en <a href="/activites/acces-libre/">accès libre</a>. <a href="/plannings/">Le planning complet de la semaine</a>.</p>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="t-coach">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">L’encadrement</span><h2 class="display" id="t-coach">${e(coach.name)} tient la cage.</h2></div>
        <div class="dp-prose" data-reveal>
          <p>Les trois créneaux de la cage sont tenus par ${e(coach.name)}, coach principal du club, qui s’occupe aussi de la préparation physique. Son parcours de combattant est passé par les États-Unis et le Canada. <a href="/coachs/jerome/">Son parcours et ses cours</a> · <a href="/coachs/">toute l’équipe</a>.</p>
        </div>
      </div>
    </section>

    <section class="section dp-bande" aria-labelledby="t-debut">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Commencer</span><h2 class="display" id="t-debut">Un premier soir de MMA, sans avoir jamais combattu.</h2></div>
        <div class="dp-prose" data-reveal>
          <ol>
            <li><strong>Choisir sa porte d’entrée.</strong> Le grappling du ${e(JOUR[cGrap[0].day])} à ${e(heure(cGrap[0].start))} si tu préfères commencer au sol, le MMA du ${e(JOUR[cMma[0].day])} à ${e(heure(cMma[0].start))} si tu veux tout voir d’un coup.</li>
            <li><strong>Le dire en arrivant.</strong> Un mot à l’accueil — « c’est ma première séance » — et le coach est prévenu.</li>
            <li><strong>Valider sa présence.</strong> L’émargement se fait à l’accueil, géolocalisé, juste avant d’entrer dans la cage.</li>
            <li><strong>S’équiper peu à peu.</strong> Le premier soir, une tenue ajustée sans poche ni zip ; ensuite, les gants à doigts libres et le protège-dents. <a href="/conseils/equipement-mma-debutant/">L’équipement MMA d’un débutant, dans l’ordre</a>.</li>
          </ol>
          <p>Les gants MMA « The Shell » de Metal Boxe se commandent sur <a href="${BOXPLUS_SHELL}" rel="noopener">box-plus, la boutique des clubs Boxing Center</a>, et se retirent à l’accueil de Ramonville.</p>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="t-cages">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Le réseau</span><h2 class="display" id="t-cages">Trois cages Boxing Center autour de Toulouse.</h2></div>
        <div class="dp-prose" data-reveal>
          <p>Celle de Ramonville est au sud-est. ${cageAilleurs.map((n) => n.id === "etats-unis"
            ? `La cage de <a href="${e(n.url)}" rel="noopener">Boxing Center ${e(n.name)}</a> est dans Toulouse même, au nord (${e(n.adresse)})`
            : `celle de <a href="${e(n.url)}activites/mma/" rel="noopener">Boxing Center ${e(n.name)}</a> au sud (${e(n.adresse)})`).join(", et ")}.</p>
          <p>Le plus simple est de choisir la cage la plus proche de son trajet du soir : depuis Labège, Castanet-Tolosan, Saint-Orens ou le sud-est toulousain, c’est Ramonville ; depuis le nord de la ville, les États-Unis. L’abonnement Saison est valable dans les cinq salles du réseau. <a href="/nos-clubs/">Les cinq clubs et leurs adresses</a>.</p>
        </div>
      </div>
    </section>

    <section class="section dp-bande" aria-labelledby="t-venir">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Venir</span><h2 class="display" id="t-venir">Où se trouve la cage.</h2></div>
        <div class="dp-prose" data-reveal>
          <p>${e(SALLE.address.full)}. En voiture, c’est la sortie Ramonville de la rocade. <a href="/contact/">Le plan, les transports et le téléphone</a>.</p>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="t-prix">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Le prix</span><h2 class="display" id="t-prix">Pas de supplément pour la cage.</h2></div>
        <div class="dp-prose" data-reveal>
          <p>Le MMA n’est pas une option payée à part : l’abonnement du club ouvre tous les cours, la cage comme le ring. Pour essayer avant de s’engager, il existe une séance d’essai. <a href="/tarifs/">Les formules, leurs prix et leurs conditions</a>.</p>
        </div>
      </div>
    </section>

    <section class="section dp-bande" aria-labelledby="t-faq">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Questions</span><h2 class="display" id="t-faq">Ce qu’on demande sur le MMA à Toulouse.</h2></div>
        <div class="dp-faq">
          ${FAQ.map(([q, a]) => `<details><summary>${e(q)}</summary><p>${e(a)}</p></details>`).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="t-sources">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Sources</span><h2 class="display" id="t-sources">D’où viennent ces informations.</h2></div>
        <div class="dp-prose" data-reveal>
          <ul>
            <li>Créneaux et encadrement : <a href="/plannings/">le planning du club</a> (${e(D.SEASON_LABEL || "saison 2026/2027")}).</li>
            <li>Distance au Capitole : calculée à vol d’oiseau sur les coordonnées <a href="https://www.openstreetmap.org/#map=16/43.5366/1.4840" rel="noopener">OpenStreetMap</a> de la salle et du Capitole.</li>
            <li>Fédération : <a href="https://www.fmmaf.fr/" rel="noopener">Fédération française de MMA (FMMAF)</a>.</li>
          </ul>
        </div>
      </div>
    </section>
  </main>

  ${PIED}
</body>
</html>
`;
mkdirSync(join(ROOT, "src", "pages", "mma-toulouse"), { recursive: true });
writeFileSync(join(ROOT, "src", "pages", "mma-toulouse", "index.astro"), html);
const liens = (html.match(/href="\/[^"]*"/g) || []).length;
const h2 = (html.match(/<h2[\s>]/g) || []).length;
console.log(`[mma-toulouse] ${CHEMIN} · ${lignes.length} créneaux · ${FAQ.length} questions · ${h2} H2 · ${liens} liens internes · titre ${TITRE.length} · description ${DESC.length}`);
if (TITRE.length > 60 || DESC.length < 80 || DESC.length > 158) throw new Error(`[mma-toulouse] titre ${TITRE.length} / description ${DESC.length} hors bornes`);
