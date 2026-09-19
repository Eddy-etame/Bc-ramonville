/* =====================================================================
   RAMONVILLE · scripts/generer-coachs.mjs — une page par coach

   Écrit src/pages/coachs/<slug>/index.astro pour chaque coach de data.js
   qui a son texte dans src/coachs-pages.json, puis la table
   public/assets/js/coachs-liens.js que home.js et /coachs/ lisent pour
   relier chaque carte à sa page.

   Tout est écrit dans le HTML — parcours, méthode, disciplines, FAQ,
   données structurées ProfilePage + Person — parce que les robots des
   moteurs de réponse n'exécutent pas le JavaScript. La tête et le pied
   reprennent ceux de /activites/, comme les pages de discipline.
   Les créneaux nominatifs restent internes : une page de coach renvoie au
   planning du club, elle ne publie pas le sien.

   Tourne après generer-disciplines.mjs et avant astro build.
   ===================================================================== */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ROOT, BASE, donnees, textes as textesDisciplines, lienDe } from "./disciplines-lib.mjs";
import { pathToFileURL } from "node:url";
const { roleHtml, pastilleHtml } = await import(pathToFileURL(join(ROOT, "public", "assets", "js", "role-liens.js")).href);

const { DISCIPLINES, COACHES, SALLE, TARIFS } = await donnees();
const TD = textesDisciplines();
const TC = JSON.parse(readFileSync(join(ROOT, "src", "coachs-pages.json"), "utf8")).pages;
const GABARIT = readFileSync(join(ROOT, "src", "pages", "activites", "index.astro"), "utf8");
const PUBLIC = join(ROOT, "public");

const e = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  .replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");

/* La tête de /activites/, sans ses données structurées ; la feuille des
   pages de discipline, qui porte aussi les styles des pages de coach. */
const TETE = GABARIT.slice(GABARIT.indexOf("<!doctype html>"), GABARIT.indexOf("</head>"))
  .replace(/\s*<script is:inline type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
  .replace(/<link rel="stylesheet" href="\/assets\/css\/activites\.css[^"]*" \/>/, '<link rel="stylesheet" href="/assets/css/discipline.css?v=3" />');
const i0 = GABARIT.indexOf('<div id="footer"></div>');
const iPage = GABARIT.indexOf("/assets/js/page.js", i0);
const PIED = GABARIT.slice(i0, GABARIT.indexOf("</script>", iPage) + "</script>".length);
if (i0 < 0 || iPage < 0) throw new Error("[coachs] le gabarit /activites/ a changé de forme");

/* Le portrait officiel du coach, à ses vraies dimensions, avec sa variante 320 px. */
async function portrait(c, alt, sizes, { eager = false } = {}) {
  let w = 0, h = 0;
  try { const m = await sharp(join(PUBLIC, c.img)).metadata(); w = m.width; h = m.height; } catch { /* dimensions inconnues */ }
  const petit = c.img.replace(/\.webp$/, "-320.webp");
  const srcset = w > 320 ? ` srcset="${e(petit)} 320w, ${e(c.img)} ${w}w" sizes="${sizes}"` : "";
  const dims = w ? ` width="${w}" height="${h}"` : "";
  const charge = eager ? ` loading="eager" fetchpriority="high"` : ` loading="lazy"`;
  return `<img src="${e(c.img)}"${srcset}${dims} alt="${e(alt)}"${charge} decoding="async" />`;
}

/* L'ancre d'une formule sur /tarifs/ — même règle que public/assets/js/page.js. */
const ancreTarif = (nom) => "tarif-" + String(nom || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const voirTarif = (t) => (/^offre\b/i.test(t.name) ? `Voir l’${t.name}` : `Voir le tarif ${t.name}`);
const boutonTarif = (t) => (t
  ? `<a class="btn btn--primary" href="/tarifs/#${ancreTarif(t.name)}"><span>${e(voirTarif(t))}</span></a>`
  : `<a class="btn btn--primary" href="/tarifs/"><span>Les tarifs</span></a>`);

const slugDe = (nom) => TC[nom]?.slug;
const prenom = (nom) => String(nom).split(" ")[0];

function tete(p, c, url, og) {
  let h = TETE;
  const pose = (rx, val) => { if (!rx.test(h)) throw new Error(`[coachs] balise absente : ${rx}`); h = h.replace(rx, (m0, a, b) => `${a}${val}${b}`); };
  const alt = `${c.name}, ${p.poste.charAt(0).toLowerCase()}${p.poste.slice(1)}, au Boxing Center Ramonville`;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${e(p.titre)}</title>`);
  pose(/(<meta name="description" content=")[^"]*(")/, e(p.description));
  pose(/(<link rel="canonical" href=")[^"]*(")/, url);
  pose(/(<meta property="og:title" content=")[^"]*(")/, e(p.titre));
  pose(/(<meta property="og:description" content=")[^"]*(")/, e(p.description));
  pose(/(<meta property="og:url" content=")[^"]*(")/, url);
  pose(/(<meta property="og:image" content=")[^"]*(")/, og);
  pose(/(<meta property="og:image:alt" content=")[^"]*(")/, e(alt));
  pose(/(<meta name="twitter:title" content=")[^"]*(")/, e(p.titre));
  pose(/(<meta name="twitter:description" content=")[^"]*(")/, e(p.description));
  pose(/(<meta name="twitter:image" content=")[^"]*(")/, og);
  pose(/(<meta name="twitter:image:alt" content=")[^"]*(")/, e(alt));
  return h;
}

function donneesStructurees(p, c, url, og, discs) {
  const personne = {
    "@type": "Person",
    "@id": `${url}#personne`,
    name: c.name,
    jobTitle: p.poste,
    description: p.description,
    image: `${BASE}${c.img}`,
    url,
    worksFor: { "@id": `${BASE}/#salle` },
    knowsAbout: discs.length ? discs.map((d) => d.name) : c.disciplines,
  };
  if (p.diplomes?.length) personne.hasCredential = p.diplomes.map((d) => ({ "@type": "EducationalOccupationalCredential", name: d, credentialCategory: "Diplôme" }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "ProfilePage", "@id": `${url}#webpage`, url, name: p.titre, description: p.description, inLanguage: "fr-FR",
        isPartOf: { "@id": `${BASE}/#website` }, mainEntity: { "@id": `${url}#personne` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        primaryImageOfPage: { "@type": "ImageObject", url: og.replace(/\?.*$/, ""), width: 1200, height: 630 } },
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: "Coachs", item: `${BASE}/coachs/` },
        { "@type": "ListItem", position: 3, name: c.name, item: url },
      ] },
      personne,
      { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: p.faq.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.r } })) },
    ],
  };
}

async function corps(p, c, discs) {
  const tarif = (TARIFS || []).find((t) => t.name === p.tarif) || (TARIFS || []).find((t) => /rentr/i.test(t.name));
  const s = [];

  s.push(`
    <header class="phero dp-hero cp-hero" aria-label="${e(c.name)}, coach au Boxing Center Ramonville">
      <div class="sky" aria-hidden="true"><canvas class="sky__stars"></canvas><div class="sky__haze"></div><div class="sky__moon"></div></div>
      <div class="wrap dp-hero__grille">
        <div class="dp-hero__texte">
          <nav class="breadcrumb" aria-label="Fil d’ariane"><a href="/">Accueil</a> / <a href="/coachs/">Coachs</a> / <span>${e(c.name)}</span></nav>
          <span class="eyebrow dp-eyebrow">${e(p.eyebrow)}</span>
          <h1 class="display phero__title phero__title--long"><span class="reveal-mask"><span>${e(p.h1)}</span></span><span class="reveal-mask"><span class="tint">${e(p.h1Tint)}</span></span></h1>
          <p class="phero__lead">${e(p.lead)}</p>
          <div class="phero__meta">${(c.disciplines || []).map((x) => `<span>${pastilleHtml(x, c.name)}</span>`).join("")}</div>
          <div class="dp-actions">
            ${boutonTarif(tarif)}
            <a class="btn btn--ghost" href="/plannings/"><span>Voir le planning</span></a>
          </div>
        </div>
        <figure class="dp-photo cp-photo"${c.ratio ? ` style="aspect-ratio:${c.ratio}"` : ""}>${await portrait(c, `${c.name}, ${p.poste.charAt(0).toLowerCase()}${p.poste.slice(1)}, au Boxing Center Ramonville`, "(max-width: 900px) 100vw, 42vw", { eager: true })}</figure>
      </div>
    </header>`);

  s.push(`
    <section class="section cp-reperes" aria-label="${e(c.name)} en trois repères">
      <div class="wrap">
        <dl class="cp-faits" data-reveal-group>
          ${p.faits.map(([v, l]) => `<div class="cp-fait" data-reveal><dt>${e(l)}</dt><dd>${e(v)}</dd></div>`).join("\n          ")}
        </dl>
      </div>
    </section>`);

  p.sections.forEach((sec, i) => s.push(`
    <section class="section${i % 2 === 0 ? " dp-bande" : ""}" aria-labelledby="t-s${i}">
      <div class="wrap cp-texte">
        <div class="shead" data-reveal><span class="eyebrow">${e(sec.eyebrow)}</span><h2 class="display" id="t-s${i}">${e(sec.titre)}</h2></div>
        <div class="cp-paras" data-reveal>${sec.textes.map((t) => `<p>${e(t)}</p>`).join("")}</div>
      </div>
    </section>`));

  s.push(`
    <section class="section" aria-labelledby="t-profil">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">En bref</span><h2 class="display" id="t-profil">Son profil.</h2></div>
        <dl class="dp-infos" data-reveal>
          <div><dt>Rôle</dt><dd>${e(p.poste)}</dd></div>
          ${p.diplomes?.length ? `<div><dt>Formation</dt><dd>${e(p.diplomes.join(" · "))}</dd></div>` : ""}
          ${c.qualites?.length ? `<div><dt>Qualités</dt><dd>${e(c.qualites.join(" · "))}</dd></div>` : ""}
          <div><dt>Salle</dt><dd>${e(SALLE.name)}, ${e(SALLE.address.full)} · métro B, terminus Ramonville</dd></div>
        </dl>
        ${c.devise ? `<blockquote class="cp-devise" data-reveal><p>${e(c.devise)}</p><cite>${e(c.name)}</cite></blockquote>` : ""}
      </div>
    </section>`);

  if (discs.length) s.push(`
    <section class="section dp-bande" aria-labelledby="t-disc">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Ses disciplines</span><h2 class="display" id="t-disc">Où le retrouver.</h2></div>
        <div class="dp-grille dp-grille--3" data-reveal-group>
          ${discs.map((d) => `<a class="dp-carte dp-carte--lien" href="${lienDe(d.key, TD)}"><span class="dp-tag">${e(d.tag)}</span><h3>${e(d.name)}</h3><p>${e(d.desc)}</p><span class="dp-go">Voir la discipline <span aria-hidden="true">→</span></span></a>`).join("\n          ")}
        </div>
      </div>
    </section>`.replace("Où le retrouver.", p.elle ? "Où la retrouver." : "Où le retrouver."));

  s.push(`
    <section class="section" aria-labelledby="t-faq">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Questions</span><h2 class="display" id="t-faq">Ce qu’on nous demande.</h2></div>
        <div class="dp-faq">
          ${p.faq.map((q) => `<details><summary>${e(q.q)}</summary><p>${e(q.r)}</p></details>`).join("\n          ")}
        </div>
      </div>
    </section>`);

  const autres = COACHES.filter((x) => x.name !== c.name && TC[x.name]);
  if (autres.length) s.push(`
    <section class="section dp-bande" aria-labelledby="t-autres">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">L’équipe</span><h2 class="display" id="t-autres">Les autres coachs.</h2></div>
        <div class="dp-grille dp-grille--4 cp-autres" data-reveal-group>
          ${(await Promise.all(autres.map(async (x) => `<article class="dp-carte dp-carte--lien cp-autre carte-lien">${await portrait(x, `${x.name}, coach au Boxing Center Ramonville`, "(max-width: 700px) 90vw, 280px")}<span class="dp-tag">${e(x.tag)}</span><h3><a class="carte-lien__tout" href="/coachs/${slugDe(x.name)}/">${e(x.name)}</a></h3><p>${roleHtml(x.role, x.name)}</p><span class="dp-go" aria-hidden="true">Voir sa page <span aria-hidden="true">→</span></span></article>`))).join("\n          ")}
        </div>
        <p class="dp-lien"><a href="/coachs/">Toute l’équipe →</a></p>
      </div>
    </section>`);

  s.push(`
    <section class="section" aria-labelledby="t-fin">
      <div class="wrap dp-fin" data-reveal>
        <h2 class="display" id="t-fin">Viens t’entraîner avec ${e(prenom(c.name))}. <span class="tint">Le premier cours se fait sans rien savoir.</span></h2>
        <div class="dp-actions">
          ${boutonTarif(tarif)}
          <a class="btn btn--ghost" href="/coachs/"><span>Toute l’équipe</span></a>
          <a class="btn btn--ghost" href="/contact/"><span>Nous écrire</span></a>
        </div>
      </div>
    </section>`);
  return s.join("\n");
}

let n = 0;
for (const c of COACHES) {
  const p = TC[c.name];
  if (!p) { console.log(`[coachs] ${c.name} : pas de texte, pas de page`); continue; }
  const discs = DISCIPLINES.filter((d) => TD[d.key] && (TD[d.key].coachs || []).includes(c.name));
  const url = `${BASE}/coachs/${p.slug}/`;
  const og = `${BASE}/assets/img/ram/og/coachs/${p.slug}.jpg?v=1`;
  const ld = JSON.stringify(donneesStructurees(p, c, url, og, discs)).replace(/</g, "\\u003c");
  const html = `${tete(p, c, url, og)}  <script is:inline type="application/ld+json">${ld}</script>
</head>

<body data-page="coach" data-coach="${e(p.slug)}">
  <a class="sr-only" href="#main">Aller au contenu</a>
  <div id="nav"></div>
  <div id="drawer"></div>

  <main id="main">
${await corps(p, c, discs)}
  </main>

  ${PIED}
</body>
</html>
`;
  const dossier = join(ROOT, "src", "pages", "coachs", p.slug);
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, "index.astro"), html);
  const alerte = (p.description.length > 160 ? "  ✗ DESCRIPTION TROP LONGUE" : "") + (p.titre.length > 60 ? "  ✗ TITRE TROP LONG" : "");
  console.log(`[coachs] /coachs/${p.slug}/ · ${discs.length} discipline(s) · titre ${p.titre.length} · description ${p.description.length}${alerte}`);
  n++;
}

/* La table que home.js et /coachs/ lisent pour relier chaque carte à sa page. */
const table = COACHES.filter((c) => TC[c.name]).map((c) => ({ nom: c.name, href: `/coachs/${TC[c.name].slug}/` }));
writeFileSync(join(PUBLIC, "assets", "js", "coachs-liens.js"),
  `/* Écrit par scripts/generer-coachs.mjs — ne pas modifier à la main. */\n` +
  `export const PAGES_COACHS = ${JSON.stringify(table, null, 2)};\n` +
  `export const lienCoach = (nom) => (PAGES_COACHS.find((p) => p.nom === nom) || {}).href || "";\n`);
console.log(`[coachs] ${n} pages écrites · table des liens à jour`);
