/* =====================================================================
   RAMONVILLE · scripts/generer-disciplines.mjs — une page par discipline

   Écrit src/pages/activites/<slug>/index.astro pour chaque fiche de
   data.js qui a son texte dans src/disciplines-pages.json, puis la table
   public/assets/js/disciplines-liens.js que site.js et page.js lisent pour
   rendre les fiches cliquables.

   Tout est écrit dans le HTML — texte, créneaux, coachs, FAQ, données
   structurées — parce que GPTBot, ClaudeBot et PerplexityBot n'exécutent
   pas le JavaScript. La tête et le pied reprennent ceux de /activites/ :
   mêmes polices, mêmes feuilles, mêmes scripts ; seuls le titre, la
   description, l'URL canonique et la vignette changent.

   Tourne après content.mjs (qui pose le calque du vestiaire sur data.js)
   et avant astro build.
   ===================================================================== */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ROOT, BASE, donnees, textes, creneaux, joursEnMots, remplir, lienDe, JOUR, JOUR_SCHEMA } from "./disciplines-lib.mjs";

const { DISCIPLINES, SCHEDULE, COACHES, SALLE, LINKS, TARIFS } = await donnees();
const T = textes();
const TC = JSON.parse(readFileSync(join(ROOT, "src", "coachs-pages.json"), "utf8")).pages;
const GABARIT = readFileSync(join(ROOT, "src", "pages", "activites", "index.astro"), "utf8");
const PUBLIC = join(ROOT, "public");

const e = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  .replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
const jourMaj = (d) => JOUR[d][0].toUpperCase() + JOUR[d].slice(1);

/** <img> aux vraies dimensions, avec sa variante 800 px quand elle existe. */
async function img(src, alt, sizes, { eager = false } = {}) {
  const f = join(PUBLIC, src);
  let w = 0, h = 0;
  try { const m = await sharp(f).metadata(); w = m.width; h = m.height; } catch { /* dimensions inconnues */ }
  const v800 = src.replace(/\.webp$/, "-800.webp");
  const srcset = existsSync(join(PUBLIC, v800)) && w > 800 ? ` srcset="${e(v800)} 800w, ${e(src)} ${w}w" sizes="${sizes}"` : "";
  const dims = w ? ` width="${w}" height="${h}"` : "";
  const charge = eager ? ` loading="eager" fetchpriority="high"` : ` loading="lazy"`;
  return `<img src="${e(src)}"${srcset}${dims} alt="${e(alt)}"${charge} decoding="async" />`;
}

/* La tête de /activites/, débarrassée de ses données structurées et de sa
   feuille propre ; on y pose celles de la discipline. */
const TETE = GABARIT.slice(GABARIT.indexOf("<!doctype html>"), GABARIT.indexOf("</head>"))
  .replace(/\s*<script is:inline type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
  .replace(/<link rel="stylesheet" href="\/assets\/css\/activites\.css[^"]*" \/>/, '<link rel="stylesheet" href="/assets/css/discipline.css?v=3" />');
const i0 = GABARIT.indexOf('<div id="footer"></div>');
const iPage = GABARIT.indexOf("/assets/js/page.js", i0);
const PIED = GABARIT.slice(i0, GABARIT.indexOf("</script>", iPage) + "</script>".length);
if (i0 < 0 || iPage < 0) throw new Error("[disciplines] le gabarit /activites/ a changé de forme");

function tete(p, url, og) {
  let h = TETE;
  const pose = (rx, val) => { if (!rx.test(h)) throw new Error(`[disciplines] balise absente : ${rx}`); h = h.replace(rx, (m0, a, b) => `${a}${val}${b}`); };
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${e(p.titre)}</title>`);
  pose(/(<meta name="description" content=")[^"]*(")/, e(p.descriptionFinale));
  pose(/(<link rel="canonical" href=")[^"]*(")/, url);
  pose(/(<meta property="og:title" content=")[^"]*(")/, e(p.titre));
  pose(/(<meta property="og:description" content=")[^"]*(")/, e(p.descriptionFinale));
  pose(/(<meta property="og:url" content=")[^"]*(")/, url);
  pose(/(<meta property="og:image" content=")[^"]*(")/, og);
  pose(/(<meta property="og:image:alt" content=")[^"]*(")/, e(p.photo.alt));
  pose(/(<meta name="twitter:title" content=")[^"]*(")/, e(p.titre));
  pose(/(<meta name="twitter:description" content=")[^"]*(")/, e(p.descriptionFinale));
  pose(/(<meta name="twitter:image" content=")[^"]*(")/, og);
  pose(/(<meta name="twitter:image:alt" content=")[^"]*(")/, e(p.photo.alt));
  return h;
}

/* L'ancre d'une formule sur /tarifs/ — même règle que public/assets/js/page.js. */
const ancreTarif = (nom) => "tarif-" + String(nom || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const versTarif = (t) => `/tarifs/#${ancreTarif(t.name)}`;
/* Les formules d'une discipline : l'École enfants pour l'école, les formules
   adultes ailleurs. Jamais la séance d'essai : son prix ne vit que sur /tarifs/. */
const tarifsDe = (cle) => (TARIFS || [])
  .filter((t) => !/essai/i.test(t.name))
  .filter((t) => (cle === "ecole") === /enfant/i.test(t.name));
/* Le bouton dit ce qu'il ouvre : « Voir l’Offre Rentrée », « Voir le tarif École enfants ». */
const voirTarif = (t) => (/^offre\b/i.test(t.name) ? `Voir l’${t.name}`
  : /^abonnement\b/i.test(t.name) ? `Voir l’${t.name.charAt(0).toLowerCase()}${t.name.slice(1)}`
  : `Voir le tarif ${t.name}`);
const boutonTarif = (t) => (t
  ? `<a class="btn btn--primary" href="${versTarif(t)}"><span>${e(voirTarif(t))}</span></a>`
  : `<a class="btn btn--primary" href="/tarifs/"><span>Les tarifs</span></a>`);

function donneesStructurees(p, d, url, og, liste) {
  const heures = liste.map((s) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: `https://schema.org/${JOUR_SCHEMA[s.day]}`,
    opens: s.start.replace("h", ":"),
    description: `${s.cours} · ${s.coach}`,
  }));
  const service = {
    "@type": "Service",
    "@id": `${url}#service`,
    name: `${d.name} à Ramonville-Saint-Agne`,
    serviceType: d.name,
    description: p.descriptionFinale,
    url,
    image: `${BASE}${p.photo.src}`,
    provider: { "@id": `${BASE}/#salle` },
    areaServed: [
      { "@type": "City", name: "Ramonville-Saint-Agne" },
      { "@type": "City", name: "Toulouse" },
      { "@type": "AdministrativeArea", name: "Haute-Garonne" },
    ],
  };
  if (heures.length) service.hoursAvailable = heures;
  const formules = tarifsDe(d.key);
  if (formules.length) service.offers = formules.map((t) => ({ "@type": "Offer", name: t.name, price: String(t.price).replace(/\D/g, ""), priceCurrency: "EUR", url: t.href, description: `${t.price} ${t.period || ""}`.trim() }));
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${url}#webpage`, url, name: p.titre, description: p.descriptionFinale, inLanguage: "fr-FR",
        isPartOf: { "@id": `${BASE}/#website` }, about: { "@id": `${url}#service` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        primaryImageOfPage: { "@type": "ImageObject", url: og.replace(/\?.*$/, ""), width: 1200, height: 630 } },
      { "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`, itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE}/` },
        { "@type": "ListItem", position: 2, name: "Activités", item: `${BASE}/activites/` },
        { "@type": "ListItem", position: 3, name: d.name, item: url },
      ] },
      service,
      { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: p.faqFinale.map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.r } })) },
    ],
  };
}

async function corps(p, d, liste) {
  const coachs = (COACHES || []).filter((c) => (p.coachs || []).includes(c.name));
  const s = [];
  s.push(`
    <header class="phero dp-hero" aria-label="${e(d.name)} à Ramonville">
      <div class="sky" aria-hidden="true"><canvas class="sky__stars"></canvas><div class="sky__haze"></div><div class="sky__moon"></div></div>
      <div class="wrap dp-hero__grille">
        <div class="dp-hero__texte">
          <nav class="breadcrumb" aria-label="Fil d’ariane"><a href="/">Accueil</a> / <a href="/activites/">Activités</a> / <span>${e(d.name)}</span></nav>
          <span class="eyebrow dp-eyebrow">${e(p.eyebrow)}</span>
          <h1 class="display phero__title phero__title--long"><span class="reveal-mask"><span>${e(p.h1)}</span></span><span class="reveal-mask"><span class="tint">à Ramonville.</span></span></h1>
          <p class="phero__lead">${e(p.leadFinal)}</p>
          <div class="phero__meta"><span>${e(d.niveau)}</span><span>${e(d.coach)}</span><span>Métro B · terminus Ramonville</span></div>
          <div class="dp-actions">
            ${boutonTarif(tarifsDe(d.key)[0])}
            <a class="btn btn--ghost" href="/plannings/"><span>Voir le planning</span></a>
          </div>
        </div>
        <figure class="dp-photo">${await img(p.photo.src, p.photo.alt, "(max-width: 900px) 100vw, 42vw", { eager: true })}</figure>
      </div>
    </header>`);

  s.push(`
    <section class="section" aria-labelledby="t-travail">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Ce que tu travailles</span><h2 class="display" id="t-travail">${e(p.travailTitre)}</h2></div>
        <div class="dp-grille dp-grille--4" data-reveal-group>
          ${p.travail.map((t, i) => `<article class="dp-carte"><span class="dp-num">${String(i + 1).padStart(2, "0")}</span><h3>${e(t.titre)}</h3><p>${e(t.texte)}</p></article>`).join("\n          ")}
        </div>
      </div>
    </section>`);

  s.push(`
    <section class="section dp-bande" aria-labelledby="t-pourqui">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Pour qui</span><h2 class="display" id="t-pourqui">Ton point de départ.</h2></div>
        <div class="dp-grille dp-grille--3" data-reveal-group>
          ${p.pourQui.map((x) => `<article class="dp-carte"><span class="dp-tag">${e(x.tag)}</span><h3>${e(x.titre)}</h3><p>${e(x.texte)}</p></article>`).join("\n          ")}
        </div>
      </div>
    </section>`);

  const jours = [...new Set(liste.map((x) => x.day))];
  const planning = liste.length
    ? `<ol class="dp-creneaux" data-reveal-group>${jours.map((j) => `<li class="dp-jour"><h3>${jourMaj(j)}</h3><ul>${liste.filter((x) => x.day === j).map((x) => `<li><span class="dp-heure">${e(x.start)}</span><span class="dp-cours">${e(x.cours)}</span><span class="dp-coach">${e(x.coach)}</span></li>`).join("")}</ul></li>`).join("")}</ol>`
    : `<p class="dp-libre" data-reveal>${e(d.jours)} — ${e(SALLE.hours)}. Sans créneau ni réservation : l’accès libre suit l’ouverture de la salle.</p>`;
  s.push(`
    <section class="section" aria-labelledby="t-creneaux">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Les créneaux</span><h2 class="display" id="t-creneaux">Quand venir.</h2><p class="muted">Le planning de la rentrée, tel que la salle le publie. Avant chaque cours, tu valides ta présence à l’accueil.</p></div>
        ${planning}
        <p class="dp-lien"><a href="/plannings/">Tout le planning de la salle →</a></p>
      </div>
    </section>`);

  if (coachs.length) s.push(`
    <section class="section dp-bande" aria-labelledby="t-coachs">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Qui encadre</span><h2 class="display" id="t-coachs">${coachs.length > 1 ? "Tes coachs." : "Ton coach."}</h2></div>
        <div class="dp-coachs" data-reveal-group>
          ${(await Promise.all(coachs.map(async (c) => `<article class="dp-coach">${await img(c.img, `${c.name}, coach au Boxing Center Ramonville : ${c.role}`, "(max-width: 700px) 40vw, 180px")}<div><h3>${TC[c.name] ? `<a href="/coachs/${TC[c.name].slug}/">${e(c.name)}</a>` : e(c.name)}</h3><p class="dp-role">${e(c.role)}</p><p>${e(c.note)}</p></div></article>`))).join("\n          ")}
        </div>
        <p class="dp-lien"><a href="/coachs/">Toute l’équipe →</a></p>
      </div>
    </section>`);

  s.push(`
    <section class="section" aria-labelledby="t-images">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">En images</span><h2 class="display" id="t-images">Sur le plateau.</h2></div>
        <div class="dp-galerie" data-reveal-group>
          ${(await Promise.all(p.photos.map(async (ph) => `<figure>${await img(ph.src, ph.alt, "(max-width: 700px) 100vw, 50vw")}<figcaption>${e(ph.legende)}</figcaption></figure>`))).join("\n          ")}
        </div>
      </div>
    </section>`);

  /* LES FORMULES DE LA DISCIPLINE — chaque carte mène à SA formule sur
     /tarifs/ (ancre), où se trouve le bouton de paiement. */
  const formules = tarifsDe(d.key);
  const offre = formules[0];
  if (formules.length) s.push(`
    <section class="section" id="formules" aria-labelledby="t-formules">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Les tarifs</span><h2 class="display" id="t-formules">${formules.length > 1 ? "Ta formule." : "L’inscription."}</h2></div>
        <div class="dp-grille dp-grille--3 dp-tarifs${formules.length === 1 ? " dp-tarifs--seul" : ""}" data-reveal-group>
          ${formules.map((t) => `<a class="dp-carte dp-carte--lien${t.highlight ? " dp-carte--hot" : ""}" href="${versTarif(t)}"><h3>${e(t.name)}</h3><p class="dp-prix">${e(t.price)} <small>${e(t.period || "")}</small></p>${t.feature ? `<p>${e(t.feature)}</p>` : ""}<span class="dp-go">${e(voirTarif(t))} <span aria-hidden="true">→</span></span></a>`).join("\n          ")}
        </div>
        <p class="dp-lien"><a href="/tarifs/">Toutes les formules du club →</a></p>
      </div>
    </section>`);

  s.push(`
    <section class="section dp-bande" aria-labelledby="t-infos">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Infos pratiques</span><h2 class="display" id="t-infos">L’essentiel.</h2></div>
        <dl class="dp-infos" data-reveal>
          <div><dt>Adresse</dt><dd>${e(SALLE.name)}, ${e(SALLE.address.full)}</dd></div>
          <div><dt>Métro</dt><dd>Ligne B, terminus Ramonville : la salle est au pied de la station.</dd></div>
          <div><dt>Bus</dt><dd>Arrêt Ramonville Sud, au pied de la salle.</dd></div>
          <div><dt>Voiture</dt><dd>Rocade, sortie Ramonville.</dd></div>
          <div><dt>Ouverture</dt><dd>${e(SALLE.hours)}</dd></div>
          ${offre ? `<div><dt>Pour commencer</dt><dd>${e(offre.name)} : ${e(offre.price)} ${e(offre.period || "")}. <a href="${versTarif(offre)}">La formule en détail →</a></dd></div>` : ""}
          <div><dt>Téléphone</dt><dd><a href="tel:${e(SALLE.phoneHref)}">${e(SALLE.phone)}</a></dd></div>
        </dl>
      </div>
    </section>`);

  s.push(`
    <section class="section" aria-labelledby="t-faq">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Questions</span><h2 class="display" id="t-faq">Ce qu’on nous demande.</h2></div>
        <div class="dp-faq">
          ${p.faqFinale.map((q) => `<details><summary>${e(q.q)}</summary><p>${e(q.r)}</p></details>`).join("\n          ")}
        </div>
      </div>
    </section>`);

  const voisines = (p.voisines || []).map((k) => [k, DISCIPLINES.find((x) => x.key === k), T[k]]).filter(([, dd, tt]) => dd && tt);
  if (voisines.length) s.push(`
    <section class="section dp-bande" aria-labelledby="t-voisines">
      <div class="wrap">
        <div class="shead" data-reveal><span class="eyebrow">Les autres disciplines</span><h2 class="display" id="t-voisines">Et aussi, au plateau.</h2></div>
        <div class="dp-grille dp-grille--3" data-reveal-group>
          ${voisines.map(([k, dd, tt]) => `<a class="dp-carte dp-carte--lien" href="/activites/${tt.slug}/"><span class="dp-tag">${e(dd.tag)}</span><h3>${e(dd.name)}</h3><p>${e(dd.desc)}</p><span class="dp-go">Voir la discipline <span aria-hidden="true">→</span></span></a>`).join("\n          ")}
        </div>
      </div>
    </section>`);

  s.push(`
    <section class="section" aria-labelledby="t-fin">
      <div class="wrap dp-fin" data-reveal>
        <h2 class="display" id="t-fin">Tu dis « c’est ma première fois ». <span class="tint">On s’occupe du reste.</span></h2>
        <div class="dp-actions">
          ${boutonTarif(tarifsDe(d.key)[0])}
          <a class="btn btn--ghost" href="/activites/"><span>Toutes les activités</span></a>
          <a class="btn btn--ghost" href="/contact/"><span>Nous écrire</span></a>
        </div>
      </div>
    </section>`);
  return s.join("\n");
}

let n = 0;
for (const d of DISCIPLINES) {
  const p = T[d.key];
  if (!p) { console.log(`[disciplines] ${d.key} : pas de texte, pas de page`); continue; }
  const liste = creneaux(SCHEDULE, d.key);
  const jours = joursEnMots(liste);
  p.descriptionFinale = remplir(p.description, jours);
  p.leadFinal = remplir(p.lead, jours);
  p.faqFinale = p.faq.map((q) => ({ q: q.q, r: remplir(q.r, jours) }));
  const url = `${BASE}/activites/${p.slug}/`;
  const og = `${BASE}/assets/img/ram/og/disciplines/${p.slug}.jpg?v=1`;
  const ld = JSON.stringify(donneesStructurees(p, d, url, og, liste)).replace(/</g, "\\u003c");
  const html = `${tete(p, url, og)}  <script is:inline type="application/ld+json">${ld}</script>
</head>

<body data-page="discipline" data-discipline="${e(d.key)}">
  <a class="sr-only" href="#main">Aller au contenu</a>
  <div id="nav"></div>
  <div id="drawer"></div>

  <main id="main">
${await corps(p, d, liste)}
  </main>

  ${PIED}
</body>
</html>
`;
  const dossier = join(ROOT, "src", "pages", "activites", p.slug);
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, "index.astro"), html);
  const alerte = (p.descriptionFinale.length > 160 ? "  ✗ DESCRIPTION TROP LONGUE" : "") + (p.titre.length > 60 ? "  ✗ TITRE TROP LONG" : "");
  console.log(`[disciplines] /activites/${p.slug}/ · ${liste.length} créneau(x) · titre ${p.titre.length} · description ${p.descriptionFinale.length}${alerte}`);
  n++;
}

/* La table que site.js et page.js lisent pour rendre les fiches cliquables. */
const table = DISCIPLINES.filter((d) => T[d.key]).map((d) => ({ key: d.key, nom: d.name, href: lienDe(d.key, T) }));
writeFileSync(join(PUBLIC, "assets", "js", "disciplines-liens.js"),
  `/* Écrit par scripts/generer-disciplines.mjs — ne pas modifier à la main. */\n` +
  `export const PAGES_DISCIPLINES = ${JSON.stringify(table, null, 2)};\n` +
  `export const lienDiscipline = (cle) => (PAGES_DISCIPLINES.find((p) => p.key === cle) || {}).href || "";\n`);
console.log(`[disciplines] ${n} pages écrites · table des liens à jour`);
