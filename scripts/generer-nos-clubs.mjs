/* =====================================================================
   RAMONVILLE · scripts/generer-nos-clubs.mjs — la page « Nos clubs »

   Les cinq salles du réseau Boxing Center, écrites en dur dans le HTML
   depuis NETWORK (data.js), avec le site réel de chacune. Jamais les
   satellites, jamais Balma (vendue). La tête et le pied reprennent ceux
   de /la-salle/ (mêmes polices, même feuille — .network/.net y vivent).

   Ramonville, « vous êtes ici », prend toute la rangée ; les quatre autres
   tombent juste en dessous (règle d'Eddy : jamais une carte seule).
   Tourne après generer-coachs.mjs et avant astro build.
   ===================================================================== */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, BASE, donnees } from "./disciplines-lib.mjs";

const { NETWORK } = await donnees();
const GABARIT = readFileSync(join(ROOT, "src", "pages", "la-salle", "index.astro"), "utf8");

const e = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  .replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");

const TITRE = "Nos clubs : les 5 salles Boxing Center | Ramonville";
const DESC = "Les 5 clubs Boxing Center autour de Toulouse : Ramonville, Portet-sur-Garonne, Minimes, Saint-Cyprien et États-Unis. L’offre Saison ouvre les cinq.";
const URL = `${BASE}/nos-clubs/`;
const OG = `${BASE}/assets/img/ram/og/nos-clubs.jpg?v=1`;
const ALT = "Les cinq clubs Boxing Center autour de Toulouse";

let tete = GABARIT.slice(GABARIT.indexOf("<!doctype html>"), GABARIT.indexOf("</head>"))
  .replace(/\s*<script is:inline type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
const pose = (rx, val) => { if (!rx.test(tete)) throw new Error(`[nos-clubs] balise absente : ${rx}`); tete = tete.replace(rx, (m0, a, b) => `${a}${val}${b}`); };
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

const i0 = GABARIT.indexOf('<div id="footer"></div>');
const iPage = GABARIT.indexOf("/assets/js/page.js", i0);
if (i0 < 0 || iPage < 0) throw new Error("[nos-clubs] le gabarit /la-salle/ a changé de forme");
const PIED = GABARIT.slice(i0, GABARIT.indexOf("</script>", iPage) + "</script>".length);

const ici = NETWORK.find((n) => n.self);
const autres = NETWORK.filter((n) => !n.self);
const nomDe = (n) => `Boxing Center ${n.name}`;
const siteDe = (n) => (n.self ? `${BASE}/` : n.url);

const carte = (n) => n.self
  ? `<article class="net net--ici" data-reveal><span class="net__tag">Vous êtes ici</span><h3>${e(nomDe(n))}</h3><p>${e(n.feat)}</p><p class="net__adr">${e(n.adresse || "")}</p></article>`
  : `<a class="net" href="${e(n.url)}" target="_blank" rel="noopener" data-reveal><span class="net__tag">${e(n.tag)}</span><h3>${e(nomDe(n))}</h3><p>${e(n.feat)}</p><p class="net__adr">${e(n.adresse || "")}</p><span class="net__go">Voir le site du club</span></a>`;

const ld = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebPage", "@id": `${URL}#webpage`, url: URL, name: TITRE, description: DESC, inLanguage: "fr-FR",
      isPartOf: { "@id": `${BASE}/#website` }, breadcrumb: { "@id": `${URL}#breadcrumb` }, mainEntity: { "@id": `${URL}#reseau` },
      primaryImageOfPage: { "@type": "ImageObject", url: OG.replace(/\?.*$/, ""), width: 1200, height: 630 } },
    { "@type": "BreadcrumbList", "@id": `${URL}#breadcrumb`, itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Nos clubs", item: URL },
    ] },
    { "@type": "ItemList", "@id": `${URL}#reseau`, name: "Les 5 clubs Boxing Center autour de Toulouse",
      itemListElement: [ici, ...autres].map((n, i) => ({ "@type": "ListItem", position: i + 1,
        item: { "@type": "SportsActivityLocation", name: nomDe(n), url: siteDe(n), address: n.adresse } })) },
  ],
};

const html = `${tete}  <script is:inline type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
</head>

<body data-page="nos-clubs">
  <a class="sr-only" href="#main">Aller au contenu</a>
  <div id="nav"></div>
  <div id="drawer"></div>

  <main id="main">
    <header class="phero" aria-label="Nos clubs">
      <div class="sky" aria-hidden="true"><canvas class="sky__stars"></canvas><div class="sky__haze"></div><div class="sky__moon"></div></div>
      <div class="wrap">
        <nav class="breadcrumb" aria-label="Fil d’ariane"><a href="/">Accueil</a> / <span>Nos clubs</span></nav>
        <h1 class="display phero__title"><span class="reveal-mask"><span>Nos clubs</span></span><span class="reveal-mask"><span class="tint">autour de Toulouse.</span></span></h1>
      </div>
    </header>

    <section class="section" aria-labelledby="t-reseau">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Le réseau Boxing Center</span><h2 class="display" id="t-reseau">Cinq clubs, un seul abonnement.</h2></div>
        <p class="reseau__lead" data-reveal>L’offre Saison donne l’accès libre aux cinq clubs du réseau : tu t’entraînes à Ramonville, et tu peux pousser la porte des quatre autres.</p>
        <div class="network network--cinq" data-reveal-group>
          ${[ici, ...autres].map(carte).join("\n          ")}
        </div>
        <div class="reseau__cta" data-reveal>
          <a class="btn btn--primary" href="/tarifs/#tarif-offre-saison"><span>Voir l’Offre Saison</span></a>
          <a class="btn btn--ghost" href="https://boxingcenter.fr/" target="_blank" rel="noopener"><span>Le site du groupe ↗</span></a>
          <a class="btn btn--ghost" href="https://boutique.boxingcenter.fr/" target="_blank" rel="noopener"><span>La boutique ↗</span></a>
        </div>
      </div>
    </section>
  </main>

  ${PIED}
</body>
</html>
`;
mkdirSync(join(ROOT, "src", "pages", "nos-clubs"), { recursive: true });
writeFileSync(join(ROOT, "src", "pages", "nos-clubs", "index.astro"), html);
console.log(`[nos-clubs] /nos-clubs/ · ${NETWORK.length} clubs · titre ${TITRE.length} · description ${DESC.length}`);
