/* =====================================================================
   RAMONVILLE · scripts/generer-conseils.mjs — /conseils/ et ses articles

   Eddy, 1er/10 : une section d'articles sur chaque site, qui mène à la
   boutique de matériel. Ici, chaque article répond à une question qu'on
   pose au bord de la cage — quoi porter, quoi acheter, dans quel ordre —
   depuis ce que le site dit déjà (data.js, disciplines-pages.json). Les
   liens sortent du texte, là où la phrase en a besoin : vers Boutique de
   Boxe (le choix, les guides) et vers la boutique Boxing Center (retrait
   en salle).

   Le contenu vit dans src/conseils-pages.json ; rien n'est écrit ici. Le
   script s'arrête plutôt que de produire une page dont un lien interne
   ne mène nulle part, dont le titre ou la description débordent, dont un
   jour de cours n'est plus au planning, ou qui cite un prix sans date.

   Gabarit : la tête et le pied de /activites/mma/, comme
   /club-de-boxe-ramonville/. Tourne après generer-club-de-boxe.mjs et
   avant astro build.
   ===================================================================== */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ROOT, BASE, donnees, creneaux, joursEnMots } from "./disciplines-lib.mjs";

const { SCHEDULE } = await donnees();
const DATA = JSON.parse(readFileSync(join(ROOT, "src", "conseils-pages.json"), "utf8"));
const GABARIT = readFileSync(join(ROOT, "src", "pages", "activites", "mma", "index.astro"), "utf8");
const PUBLIC = join(ROOT, "public");
const CLUB = "Boxing Center Ramonville";
const RELEVE = DATA.releve;
const DATE_FR = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
  .format(new Date(RELEVE + "T12:00:00Z")).replace(/^1 /, "1er ");

const fautes = [];
const e = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  .replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
const nu = (s) => String(s).replace(/<[^>]+>/g, "");

/* {jours:asso-mma} → « le mardi et le jeudi », lu au planning. Un cours qui
   n'a plus de créneau arrête le build : la phrase serait fausse. */
const jours = (t, ou) => String(t).replace(/\{jours:([a-z-]+)\}/g, (m0, cle) => {
  const j = joursEnMots(creneaux(SCHEDULE, cle));
  if (!j) fautes.push(`${ou} : aucun créneau au planning pour « ${cle} »`);
  return j;
});
/* le HTML des paragraphes passe tel quel dans un fichier .astro : aucune accolade n'y survit */
const brut = (t, ou) => jours(t, ou).replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");

async function img(src, alt, sizes, { eager = false } = {}) {
  const f = join(PUBLIC, src);
  if (!existsSync(f)) { fautes.push(`photo introuvable : ${src}`); return ""; }
  const m = await sharp(f).metadata();
  const v800 = src.replace(/\.webp$/, "-800.webp");
  const srcset = existsSync(join(PUBLIC, v800)) && m.width > 800 ? ` srcset="${e(v800)} 800w, ${e(src)} ${m.width}w" sizes="${sizes}"` : "";
  const charge = eager ? ` loading="eager" fetchpriority="high"` : ` loading="lazy"`;
  return `<img src="${e(src)}"${srcset} width="${m.width}" height="${m.height}" alt="${e(alt)}"${charge} decoding="async" />`;
}

/* ── les garde-fous ──────────────────────────────────────────────────── */
const SLUGS = new Set(DATA.articles.map((a) => a.slug));
function verifier(nom, html, titre, desc) {
  if (titre.length > 60) fautes.push(`${nom} : titre de ${titre.length} caractères (60 au plus)`);
  if (desc.length < 80 || desc.length > 158) fautes.push(`${nom} : description de ${desc.length} caractères (80 à 158)`);
  if (/parking/i.test(html)) fautes.push(`${nom} : le mot interdit de la salle apparaît`);
  for (const [, href] of html.matchAll(/href="(\/[^"#]*)(?:#[^"]*)?"/g)) {
    const m = href.match(/^\/conseils\/(?:([a-z0-9-]+)\/)?$/);
    if (m) { if (m[1] && !SLUGS.has(m[1])) fautes.push(`${nom} : lien vers un conseil inconnu ${href}`); continue; }
    if (!existsSync(join(ROOT, "src", "pages", href, "index.astro"))) fautes.push(`${nom} : lien interne sans page ${href}`);
  }
}
for (const a of DATA.articles)
  for (const [q, r] of a.faq) if (/\d\s?€/.test(r) && !/\d{4}/.test(r)) fautes.push(`${a.slug} : la réponse « ${q} » cite un prix sans date`);

/* ── la tête et le pied ──────────────────────────────────────────────── */
function tete({ titre, desc, url, og, alt }) {
  let t = GABARIT.slice(GABARIT.indexOf("<!doctype html>"), GABARIT.indexOf("</head>"))
    .replace(/\s*<script is:inline type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  const pose = (rx, val) => { if (!rx.test(t)) throw new Error(`[conseils] balise absente : ${rx}`); t = t.replace(rx, (m0, a, b) => `${a}${val}${b}`); };
  t = t.replace(/<title>[\s\S]*?<\/title>/, `<title>${e(titre)}</title>`);
  pose(/(<meta name="description" content=")[^"]*(")/, e(desc));
  pose(/(<link rel="canonical" href=")[^"]*(")/, url);
  pose(/(<meta property="og:title" content=")[^"]*(")/, e(titre));
  pose(/(<meta property="og:description" content=")[^"]*(")/, e(desc));
  pose(/(<meta property="og:url" content=")[^"]*(")/, url);
  pose(/(<meta property="og:image" content=")[^"]*(")/, og);
  pose(/(<meta property="og:image:alt" content=")[^"]*(")/, e(alt));
  pose(/(<meta name="twitter:title" content=")[^"]*(")/, e(titre));
  pose(/(<meta name="twitter:description" content=")[^"]*(")/, e(desc));
  pose(/(<meta name="twitter:image" content=")[^"]*(")/, og);
  pose(/(<meta name="twitter:image:alt" content=")[^"]*(")/, e(alt));
  return t.replace(/<meta property="og:type" content="[^"]*"/, '<meta property="og:type" content="article"');
}
const i0 = GABARIT.indexOf('<div id="footer"></div>');
const iBody = GABARIT.lastIndexOf("</body>");
if (i0 < 0 || iBody < 0) throw new Error("[conseils] le gabarit /activites/mma/ a changé de forme");
const PIED = GABARIT.slice(i0, GABARIT.lastIndexOf("</script>", iBody) + "</script>".length);

const CIEL = `<div class="sky" aria-hidden="true"><canvas class="sky__stars"></canvas><div class="sky__haze"></div><div class="sky__moon"></div></div>`;
const h1 = (lignes) => `<h1 class="display phero__title phero__title--long">${lignes.map((l, i) => `<span class="reveal-mask"><span${i === lignes.length - 1 ? ' class="tint"' : ""}>${e(l)}</span></span>`).join("")}</h1>`;
const tetiere = (sur, titre, id) => `<div class="shead" data-reveal><span class="eyebrow">${e(sur)}</span><h2 class="display" id="${id}">${e(titre)}</h2></div>`;

function ecrire(dossier, { t, ld, page, corps }) {
  const html = `${t}  <script is:inline type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
</head>

<body data-page="${page}">
  <a class="sr-only" href="#main">Aller au contenu</a>
  <div id="nav"></div>
  <div id="drawer"></div>

  <main id="main">${corps}
  </main>

  ${PIED}
</body>
</html>
`;
  mkdirSync(join(ROOT, "src", "pages", dossier), { recursive: true });
  writeFileSync(join(ROOT, "src", "pages", dossier, "index.astro"), html);
}

const carte = async (a) => `<a class="cs-carte" href="/conseils/${a.slug}/" data-reveal>
            <figure class="cs-carte__photo">${await img(a.photo.src, a.photo.alt, "(max-width: 760px) 92vw, 46vw")}</figure>
            <div class="cs-carte__texte"><span class="dp-tag">${e(a.carte)}</span><h3>${e(nu(a.h1.join(" ")))}</h3><p>${e(a.resume)}</p><span class="dp-go">Lire le conseil <span aria-hidden="true">→</span></span></div>
          </a>`;

const auteur = { "@id": `${BASE}/#salle`, name: CLUB, url: `${BASE}/` };

/* ── chaque article ──────────────────────────────────────────────────── */
for (const a of DATA.articles) {
  const url = `${BASE}/conseils/${a.slug}/`;
  const og = `${BASE}/assets/img/ram/og/conseils/${a.slug}.jpg?v=1`;
  const nom = nu(a.h1.join(" "));
  const autres = DATA.articles.filter((x) => x.slug !== a.slug);
  const faq = a.faq.map(([q, r]) => [q, jours(r, a.slug)]);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${url}#webpage`, url, name: a.titre, description: a.desc, inLanguage: "fr-FR",
        isPartOf: { "@id": `${BASE}/#website` }, breadcrumb: { "@id": `${url}#breadcrumb` },
        primaryImageOfPage: { "@type": "ImageObject", url: og.replace(/\?.*$/, ""), width: 1200, height: 630 } },
      { "@type": "Article", "@id": `${url}#article`, headline: a.titre, description: a.desc, inLanguage: "fr-FR",
        datePublished: RELEVE, dateModified: RELEVE, image: og.replace(/\?.*$/, ""), mainEntityOfPage: { "@id": `${url}#webpage` },
        author: auteur, publisher: auteur },
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: "Conseils", item: `${BASE}/conseils/` },
        { "@type": "ListItem", position: 3, name: nom, item: url },
      ] },
      { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: faq.map(([q, r]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: r } })) },
    ],
  };
  const corps = `
    <header class="phero dp-hero cs-hero" aria-label="${e(nom)}">
      ${CIEL}
      <div class="wrap dp-hero__grille">
        <div class="dp-hero__texte">
          <nav class="breadcrumb" aria-label="Fil d’ariane"><a href="/">Accueil</a> / <a href="/conseils/">Conseils</a> / <span>${e(a.carte)}</span></nav>
          <span class="eyebrow dp-eyebrow">${e(a.eyebrow)}</span>
          ${h1(a.h1)}
          <p class="phero__lead">${e(a.lead)}</p>
          <p class="cs-maj">Mis à jour le <time datetime="${RELEVE}">${DATE_FR}</time></p>
        </div>
        <figure class="dp-photo">${await img(a.photo.src, a.photo.alt, "(max-width: 900px) 100vw, 42vw", { eager: true })}</figure>
      </div>
    </header>

    <section class="section cs-corps" aria-label="Le conseil">
      <div class="wrap cs-grille">
        <nav class="cs-sommaire" aria-label="Dans ce conseil">
          <span class="eyebrow">Dans ce conseil</span>
          <ol>
            ${a.sections.map((s, i) => `<li><a href="#etape-${i + 1}">${e(s.sur)}</a></li>`).join("\n            ")}${a.tableau ? `\n            <li><a href="#tableau">${e(a.tableau.sur)}</a></li>` : ""}
            <li><a href="#questions">Questions</a></li>
          </ol>
        </nav>
        <div class="cs-article">
          ${a.sections.map((s, i) => `<div class="cs-bloc dp-prose" id="etape-${i + 1}" data-reveal>
            <span class="cs-sur">${e(s.sur)}</span>
            <h2>${e(s.h2)}</h2>
            ${s.paras.map((p) => `<p>${brut(p, a.slug)}</p>`).join("\n            ")}
          </div>`).join("\n          ")}
        </div>
      </div>
    </section>
${a.tableau ? `
    <section class="section dp-bande" id="tableau" aria-labelledby="t-tableau">
      <div class="wrap">
        ${tetiere(a.tableau.sur, a.tableau.h2, "t-tableau")}
        <div class="cs-table" data-reveal>
          <table>
            <thead><tr>${a.tableau.entetes.map((x) => `<th scope="col">${e(x)}</th>`).join("")}</tr></thead>
            <tbody>
              ${a.tableau.lignes.map((l) => `<tr><th scope="row">${brut(l[0], a.slug)}</th>${l.slice(1).map((c, j) => `<td data-label="${e(a.tableau.entetes[j + 1])}">${brut(c, a.slug)}</td>`).join("")}</tr>`).join("\n              ")}
            </tbody>
          </table>
        </div>
        <div class="dp-prose cs-note" data-reveal><p>${brut(a.tableau.note, a.slug)}</p></div>
      </div>
    </section>
` : ""}
    <section class="section" id="questions" aria-labelledby="t-questions">
      <div class="wrap">
        ${tetiere("Questions", "Ce qu’on nous demande à l’accueil.", "t-questions")}
        <div class="dp-faq">
          ${faq.map(([q, r]) => `<details><summary>${e(q)}</summary><p>${e(r)}</p></details>`).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section dp-bande" aria-labelledby="t-aussi">
      <div class="wrap">
        ${tetiere("À lire ensuite", autres.length > 1 ? "Les autres listes du plateau." : "L’autre liste du plateau.", "t-aussi")}
        <div class="cs-cartes${autres.length === 1 ? " cs-cartes--large" : ""}">
          ${(await Promise.all(autres.map(carte))).join("\n          ")}
        </div>
        <p class="dp-suite" data-reveal><a href="/conseils/">Tous les conseils du club</a></p>
      </div>
    </section>

    <section class="section" aria-labelledby="t-fin">
      <div class="wrap dp-fin" data-reveal>
        <h2 class="display" id="t-fin">Le matériel peut attendre. <span class="tint">Le premier cours, non.</span></h2>
        <div class="dp-actions">
          <a class="btn btn--primary" href="/plannings/"><span>Voir le planning</span></a>
          <a class="btn btn--ghost" href="/activites/"><span>Toutes les activités</span></a>
          <a class="btn btn--ghost" href="/contact/"><span>Nous écrire</span></a>
        </div>
      </div>
    </section>`;
  verifier(a.slug, corps, a.titre, a.desc);
  ecrire(join("conseils", a.slug), { page: "conseil", ld, corps, t: tete({ titre: a.titre, desc: a.desc, url, og, alt: `${nom} — ${CLUB}` }) });
}

/* ── l'index ─────────────────────────────────────────────────────────── */
{
  const I = DATA.index;
  const url = `${BASE}/conseils/`;
  const og = `${BASE}/assets/img/ram/og/conseils.jpg?v=1`;
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${url}#webpage`, url, name: I.titre, description: I.desc, inLanguage: "fr-FR",
        isPartOf: { "@id": `${BASE}/#website` }, breadcrumb: { "@id": `${url}#breadcrumb` }, dateModified: RELEVE,
        primaryImageOfPage: { "@type": "ImageObject", url: og.replace(/\?.*$/, ""), width: 1200, height: 630 },
        mainEntity: { "@type": "ItemList", numberOfItems: DATA.articles.length, itemListElement: DATA.articles.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.titre, url: `${BASE}/conseils/${a.slug}/` })) } },
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: "Conseils", item: url },
      ] },
    ],
  };
  const corps = `
    <header class="phero" aria-label="Les conseils du club">
      ${CIEL}
      <div class="wrap">
        <nav class="breadcrumb" aria-label="Fil d’ariane"><a href="/">Accueil</a> / <span>Conseils</span></nav>
        <span class="eyebrow dp-eyebrow">${e(I.eyebrow)}</span>
        ${h1(I.h1)}
        <p class="phero__lead" data-reveal>${e(I.lead)}</p>
      </div>
    </header>

    <section class="section" aria-label="Les conseils">
      <div class="wrap">
        <div class="cs-cartes">
          ${(await Promise.all(DATA.articles.map(carte))).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section dp-bande" aria-labelledby="t-fin">
      <div class="wrap dp-fin" data-reveal>
        <h2 class="display" id="t-fin">Avant le matériel, <span class="tint">le premier cours.</span></h2>
        <div class="dp-actions">
          <a class="btn btn--primary" href="/plannings/"><span>Voir le planning</span></a>
          <a class="btn btn--ghost" href="/activites/"><span>Toutes les activités</span></a>
        </div>
      </div>
    </section>`;
  verifier("index", corps, I.titre, I.desc);
  ecrire("conseils", { page: "conseils", ld, corps, t: tete({ titre: I.titre, desc: I.desc, url, og, alt: `Les conseils matériel du ${CLUB}` }) });
}

if (fautes.length) {
  console.error("[conseils] ✗\n  " + fautes.join("\n  "));
  process.exit(1);
}
const sortants = DATA.articles.map((a) => (JSON.stringify(a).match(/https:\/\/(www\.boutique-de-boxe\.com|boutique\.boxingcenter\.fr)/g) || []).length);
console.log(`[conseils] /conseils/ + ${DATA.articles.length} articles · liens vers les boutiques : ${sortants.join(" + ")} · relevé du ${DATE_FR}`);
