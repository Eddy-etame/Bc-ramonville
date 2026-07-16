/* =====================================================================
   RAMONVILLE · page.js — moteur de rendu des 7 pages intérieures

   Un seul module, aiguillé par body[data-page]. Tout vient de data.js
   (facts verrouillés, planning officiel, offres datées, avis réels). Le
   chrome, la météo du ciel et le motion vivent dans site.js / sky.js.
   ===================================================================== */
import {
  DISCIPLINES, PLATEAU, VALUES, NETWORK, SALLE, SEASON, SEASON_LABEL,
  DAYS, SCHEDULE, SCHEDULE_ETE, FAMILLES, POSTERS, TARIFS, PROMOS, REVIEWS,
  GALLERY, PHOTO_CREDIT, FAQ, LINKS,
} from "./data.js?v=6";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const page = document.body.dataset.page;

/* =================== L'OBJET DU HERO, PROPRE À CHAQUE PAGE =========
   Les 7 sous-pages ouvraient sur le MÊME tampon : même .sky, même octogone
   filigrane aux mêmes coordonnées haut-droite, même rotation 90s, puis fil
   d'ariane → titre → chapô. Cinq d'entre elles ne contenaient rien d'autre :
   l'octogone y devenait un watermark payé sept fois au lieu d'un instrument.
   Le filigrane est supprimé des 7 ; chaque hero porte maintenant SON fait —
   et c'est .phero__meta, le composant construit pour exactement ça et utilisé
   par zéro page, qui le porte. /la-salle/ (#prail) et /galerie/ (#tournage)
   avaient déjà le leur : on n'y touche pas. */
const two = (n) => String(n).padStart(2, "0");
const toMin = (t) => { const m = /^(\d{1,2})h(\d{2})$/.exec(t); return m ? +m[1] * 60 + +m[2] : 0; };

/* /plannings/ — ce qui se passe MAINTENANT, lu de SCHEDULE + l'heure réelle
   de la salle (window.__SKY.now, fuseau Ramonville, pas celui du visiteur). */
function planningNow() {
  const now = (window.__SKY?.now?.() || new Date());
  const day = DAYS[now.getDay() - 1];           // getDay: 0=dim … 6=sam ; DAYS[0]="Lun"
  if (!day) return { closed: true };            // dimanche : fermé, et on le dit
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = SCHEDULE.filter((s) => s.day === day).sort((a, b) => toMin(a.start) - toMin(b.start));
  // « en ce moment » = commencé depuis moins de 60 min (durée type d'un cours)
  const live = today.find((s) => mins >= toMin(s.start) && mins < toMin(s.start) + 60);
  const next = today.find((s) => toMin(s.start) > mins);
  return { day, live, next, count: today.length };
}

function pheroMeta() {
  const box = $("#phero-meta"); if (!box) return;
  const chip = (html) => `<span>${html}</span>`;

  if (page === "plannings") {
    const paint = () => {
      const p = planningNow();
      if (p.closed) { box.innerHTML = chip("Dimanche — <b>la salle est fermée</b>") + chip("Lun–sam · 10h–21h30"); return; }
      const head = p.live
        ? chip(`En ce moment — <b>${p.live.cours}</b> · ${p.live.coach}`)
        : p.next
          ? chip(`Prochain cours — <b>${p.next.cours}</b> à ${p.next.start}`)
          : chip("Plus de cours aujourd'hui — <b>accès libre</b> jusqu'à 21h30");
      box.innerHTML = head + chip(`${p.count} cours aujourd'hui`) + chip(`${SCHEDULE.length} sur la semaine`);
    };
    paint();
    window.addEventListener("sky:change", paint);   // l'heure de la salle vient d'arriver
    setInterval(paint, 60 * 1000);
    return;
  }

  if (page === "tarifs") {
    box.innerHTML = chip(`<b>${TARIFS[0].price}</b> l'essai`)
      + chip(`<b>${PROMOS.duo.price}</b> ${PROMOS.duo.unit}`)
      + chip(`<b>${PROMOS.saisonOffre.price}</b> ${PROMOS.saisonOffre.unit}`);
    return;
  }

  if (page === "contact") {
    box.innerHTML = chip("Métro B — <b>terminus Ramonville</b>")
      + chip(SALLE.hours)
      + chip(`<a href="tel:${SALLE.phoneHref}">${SALLE.phone}</a>`);
    return;
  }

  if (page === "activites") {
    const fams = new Set(DISCIPLINES.map((d) => d.famille));
    box.innerHTML = chip(`<b>${DISCIPLINES.length}</b> disciplines`)
      + chip(`<b>${fams.size}</b> familles`)
      + chip("De <b>3 ans</b> à l'accès libre");
    return;
  }

  if (page === "coachs") {
    const named = new Set(SCHEDULE.map((s) => s.coach));
    box.innerHTML = chip(`<b>${named.size}</b> coachs sur le planning`)
      + chip(`<b>${SCHEDULE.length}</b> créneaux / semaine`)
      + chip("Un visage dès que la photo est prouvée");
  }
}

/* ------------------------- LE PLATEAU (la-salle) ------------------ */
function renderPlateau() {
  const box = $("#stations"); if (!box) return;
  box.innerHTML = PLATEAU.map((s) => `
    <article class="station" data-reveal>
      ${s.img
        ? `<div class="station__media media" data-img="${s.img}" data-label="" data-alt="${s.t} — Boxing Center Ramonville"></div>`
        /* pas de photo prouvée → tuile honnête, jamais le cadre d'une autre
           zone légendé à la place (même loi que « nom ≡ photo » côté coachs) */
        : `<div class="station__media station__media--todo" role="img" aria-label="${s.t} — ${s.todo || "photo à venir"}">
             <svg class="todo__glyph" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6 51 14 59 33 51 52 32 60 13 52 5 33 13 14Z"/></svg>
             <span class="todo__k">${s.todo || "Photo à venir"}</span>
             <span class="todo__d">On ne montre que ce qu'on a filmé.</span>
           </div>`}
      <div class="station__body">
        <span class="station__n">${s.n}</span>
        <span class="station__tag">${s.tag}</span>
        <h3>${s.t}</h3>
        <p>${s.d}</p>
        <div class="station__specs">${s.specs.map((x) => `<span>${x}</span>`).join("")}</div>
      </div>
    </article>`).join("");
}
function renderValues() {
  const box = $("#values"); if (!box) return;
  box.innerHTML = VALUES.map((v) => `
    <article class="value">
      <span class="value__n">${v.n}</span>
      <h3>${v.t}</h3>
      <p>${v.d}</p>
    </article>`).join("");
}
/* le réseau : les 4 sœurs (Ramonville filtrée) */
function renderNetwork() {
  const box = $("#network"); if (!box) return;
  box.innerHTML = NETWORK.filter((n) => !n.self).map((n) => `
    <a class="net" href="${n.url}"${n.url.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>
      <span class="net__tag">${n.tag}</span>
      <h3>${n.name}</h3>
      <p>${n.feat}</p>
    </a>`).join("");
}

/* --------------------------- ACTIVITÉS --------------------------- */
function renderDiscs() {
  const box = $("#discs"); if (!box) return;
  box.innerHTML = DISCIPLINES.map((d) => `
    <section class="disc" id="${d.key}" data-fam="${d.famille}" data-reveal>
      ${d.img
        ? `<div class="disc__media media" data-img="${d.img}" data-label="" data-alt="${d.name} — Boxing Center Ramonville"></div>`
        : `<div class="disc__media disc__media--tile" role="img" aria-label="${d.name}, Boxing Center Ramonville">
             <svg class="disc__oct" viewBox="0 0 100 100" aria-hidden="true"><path d="M32.8 8.4 L67.2 8.4 L91.6 32.8 L91.6 67.2 L67.2 91.6 L32.8 91.6 L8.4 67.2 L8.4 32.8 Z"/></svg>
             <span class="disc__tagbig">${d.tag}</span>
           </div>`}
      <div class="disc__body">
        <span class="disc__tag">${d.tag}</span>
        <h2>${d.name}</h2>
        <p>${d.desc}</p>
        <div class="disc__facts">
          <div class="disc__fact"><b>Coach</b><span>${d.coach}</span></div>
          <div class="disc__fact"><b>Créneaux</b><span>${d.jours}</span></div>
          <div class="disc__fact"><b>Niveau</b><span>${d.niveau}</span></div>
        </div>
        <div class="disc__cta">
          <a class="btn btn--primary" data-magnetic href="${LINKS.essai}"><span>Essayer · 10€</span></a>
          <a class="btn btn--ghost" data-magnetic href="/plannings/"><span>Voir le planning</span></a>
        </div>
      </div>
    </section>`).join("");
  // filtres par famille
  const filt = $("#famfilter"); if (!filt) return;
  filt.innerHTML = FAMILLES.map((f, i) => `<button class="chip ${i === 0 ? "is-on" : ""}" data-fam="${f.key}" aria-pressed="${i === 0}">${f.label}</button>`).join("");
  filt.addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    const fam = b.dataset.fam;
    filt.querySelectorAll(".chip").forEach((c) => { const on = c === b; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", String(on)); });
    box.querySelectorAll(".disc").forEach((d) => d.classList.toggle("is-hidden", fam !== "all" && d.dataset.fam !== fam));
  });
}

/* ----------------------------- COACHS ---------------------------- *
   Pas de renderCoachs() ici. /coachs/ rend son roster dans un module inline
   (il dérive les vrais créneaux de SCHEDULE — implémentation plus riche) sur
   #coachroster. La version qui vivait ici visait #coachs, un id qui n'existe
   sur aucune des 8 pages : code mort, et SECONDE source de vérité divergente
   pour la même fiche coach. Supprimée — une seule implémentation. */

/* ----------------------------- GALERIE --------------------------- */
function renderGallery() {
  const box = $("#gallery"); if (!box) return;
  // role=button + tabindex=0 : les vignettes sont de VRAIS contrôles. La
  // visionneuse avait déjà Escape, piège à focus, retour de focus, role=dialog
  // et aria-modal — tout sauf la porte d'entrée : au clavier, les 6 photos
  // étaient inatteignables (WCAG 2.1.1, niveau A).
  box.innerHTML = GALLERY.map((g) => `
    <figure class="shot" role="button" tabindex="0" aria-label="Agrandir — ${g.zone} · ${g.place}">
      <img src="${g.img}" alt="${g.alt}" width="${g.w}" height="${g.h}" loading="lazy" decoding="async" />
      <span class="shot__zoom" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="7"/><line x1="21" y1="21" x2="15.5" y2="15.5"/><line x1="10.5" y1="7.5" x2="10.5" y2="13.5"/><line x1="7.5" y1="10.5" x2="13.5" y2="10.5"/></svg></span>
      <figcaption class="shot__cap"><b data-cap="${g.zone}">${g.zone}</b> · ${g.place}${g.credit ? `<em class="shot__credit">Photo ${PHOTO_CREDIT}</em>` : ""}</figcaption>
    </figure>`).join("");
  // Les légendes disent la ZONE — vérifiable sur l'image. Elles disaient avant
  // une heure (« 21h48 »), inventée : les 6 clichés prouvés sont pris de JOUR,
  // sous charpente. Un carnet de terrain qui écrit « on ne montre que ce qu'on
  // a filmé » ne peut pas horodater ce qu'il n'a pas filmé. La météo LIVE reste
  // dans la bande du hero : elle parle de MAINTENANT, au-dessus de la salle —
  // ça, c'est une donnée réelle, et c'est la signature.
  if ("IntersectionObserver" in window && !reduce && window.BC?.scramble) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { const b = e.target.querySelector(".shot__cap b"); if (b && !b.dataset.done) { b.dataset.done = "1"; window.BC.scramble(b, { dur: 650 }); } io.unobserve(e.target); }
    }), { threshold: 0.5 });
    box.querySelectorAll(".shot").forEach((s) => io.observe(s));
  }
}

/* ----------------------------- PLANNING -------------------------- */
function renderPlanning() {
  const grid = $("#grid"); if (!grid) return;
  let mode = "rentree"; // rentree | ete
  let fam = "all";

  const build = () => {
    const data = mode === "ete" ? SCHEDULE_ETE : SCHEDULE;
    // lignes = créneaux horaires triés ; colonnes = jours
    const times = [...new Set(data.map((s) => s.start))].sort();
    const head = `<thead><tr><th>Heure</th>${DAYS.map((d) => `<th>${d}</th>`).join("")}</tr></thead>`;
    const body = times.map((t) => {
      const cells = DAYS.map((day) => {
        const slots = data.filter((s) => s.start === t && s.day === day);
        if (!slots.length) return `<td class="empty" aria-hidden="true">·</td>`;
        return `<td>${slots.map((s) => `
          <a class="slot ${fam !== "all" && s.fam !== fam ? "is-dim" : ""}" data-fam="${s.fam}" href="/activites/#${s.disc}">
            <b>${s.cours}</b><span>${s.coach}</span>
          </a>`).join("")}</td>`;
      }).join("");
      return `<tr><td class="time">${t}</td>${cells}</tr>`;
    }).join("");
    grid.innerHTML = head + `<tbody>${body}</tbody>`;
  };
  build();

  // onglets rentrée / été — libellés de saison via constantes (anti-péremption
  // §4 : aucun millésime figé dans une étiquette utilisateur)
  const tabs = $("#plan-tabs");
  const note = $("#plan-note");
  const RENTREE_NOTE = `<b>${SEASON_LABEL}</b> — planning complet. Émargement GPS obligatoire en salle avant chaque cours.`;
  // Renaud et Fayez ne sont sur aucune fiche de Ramonville (ce sont des coachs
  // du réseau en renfort l'été). Sur une page qui promet « nom ≡ photo », on ne
  // laisse pas deux noms sans visage sans dire ce qu'ils sont.
  const ETE_NOTE = "Cours d'été : deux cours par semaine, tenus par des coachs du réseau en renfort (Renaud, Fayez), <b>le reste en accès libre</b> muscu/cardio. La rentrée reprend le planning complet.";
  if (tabs) {
    const tR = tabs.querySelector('[data-mode="rentree"]');
    if (tR) tR.textContent = `Rentrée ${SEASON}`;
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest(".plan__tab"); if (!b) return;
      mode = b.dataset.mode;
      tabs.querySelectorAll(".plan__tab").forEach((x) => { const on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", String(on)); }); // AT : quel planning est affiché
      if (note) note.innerHTML = mode === "ete" ? ETE_NOTE : RENTREE_NOTE;
      build();
    });
  }
  if (note) note.innerHTML = RENTREE_NOTE;

  // filtres discipline
  const filt = $("#plan-filter");
  if (filt) {
    filt.innerHTML = FAMILLES.map((f, i) => `<button class="chip ${i === 0 ? "is-on" : ""}" data-fam="${f.key}" aria-pressed="${i === 0}">${f.label}</button>`).join("");
    filt.addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      fam = b.dataset.fam;
      filt.querySelectorAll(".chip").forEach((c) => { const on = c === b; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", String(on)); });
      build();
    });
  }

  // posters couleur cliquables
  const pbox = $("#posters");
  if (pbox) pbox.innerHTML = POSTERS.map((p) => `
    <a class="poster" href="${p.src}" target="_blank" rel="noopener" aria-label="Ouvrir le planning ${p.label} en grand format">
      <span class="poster__cap">${p.label}</span>
      <img src="${p.src}" alt="${p.alt}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async" />
    </a>`).join("");
}

/* ------------------------------ TARIFS --------------------------- */
function renderTarifs() {
  const box = $("#tarifs"); if (box) box.innerHTML = TARIFS.map((t) => `
    <article class="tarif ${t.highlight ? "tarif--hot" : ""}">
      ${t.highlight ? '<span class="tarif__badge">Le + malin</span>' : ""}
      <h3 class="tarif__name">${t.name}</h3>
      <div class="tarif__price">${t.price}<small> ${t.period}</small></div>
      <p class="tarif__feature">${t.feature}</p>
      <ul class="tarif__items">${t.items.map((i) => `<li>${i}</li>`).join("")}</ul>
      <a class="btn ${t.highlight ? "" : "btn--primary"}" data-magnetic href="${t.href}"><span>${t.cta}</span></a>
    </article>`).join("");

  const pbox = $("#promos");
  if (pbox) {
    const D = PROMOS.duo, S = PROMOS.saisonOffre;
    pbox.innerHTML = `
      <article class="promo promo--duo">
        <span class="promo__badge">Prioritaire</span>
        <h3>${D.name}</h3>
        <div class="promo__price"><b>${D.price}</b><i>${D.unit}</i><s>${D.was}</s></div>
        <p class="promo__feat">${D.feature}</p>
        <ul class="promo__items">${D.items.map((i) => `<li>${i}</li>`).join("")}</ul>
        <a class="btn btn--primary" data-magnetic href="${D.href}"><span>${D.cta}</span></a>
      </article>
      <article class="promo promo--saison">
        <span class="promo__badge">La saison</span>
        <h3>${S.name}</h3>
        <div class="promo__price"><b>${S.price}</b><i>${S.unit}</i><s>${S.was}</s></div>
        <p class="promo__feat">${S.feature}</p>
        <ul class="promo__items">${S.items.map((i) => `<li>${i}</li>`).join("")}</ul>
        <a class="btn btn--ghost" data-magnetic href="${S.href}"><span>${S.cta}</span></a>
      </article>`;
  }
  const bonus = $("#promo-bonus");
  if (bonus) bonus.innerHTML = `<b>Bonus rentrée —</b> ${PROMOS.bonus}`;

  // avis Google réels (jamais inventés)
  const rbox = $("#reviews");
  if (rbox && REVIEWS.quotes.length) {
    rbox.innerHTML = REVIEWS.quotes.map((q) => `
      <figure class="review">
        <div class="review__stars" aria-label="${q.stars} étoiles sur 5">${"★".repeat(q.stars)}${"☆".repeat(5 - q.stars)}</div>
        <blockquote><p>« ${q.text} »</p></blockquote>
        <figcaption class="review__by">${q.author}</figcaption>
      </figure>`).join("");
    const rh = $("#reviews-head");
    if (rh) rh.innerHTML = `<span class="reviews__rating">${REVIEWS.rating}</span><span class="reviews__count">${REVIEWS.count} ${REVIEWS.sourceLabel}</span>`;
  }
}

/* ------------------------------ CONTACT -------------------------- */
function renderContact() {
  const info = $("#info"); if (info) info.innerHTML = [
    { k: "Adresse", v: SALLE.address.full },
    { k: "Téléphone", v: `<a href="tel:${SALLE.phoneHref}">${SALLE.phone}</a>` },
    { k: "Horaires", v: SALLE.hours + " · dimanche fermé" },
    { k: "Accès", v: SALLE.access.join("<br>") },
    { k: "En salle", v: SALLE.note },
  ].map((r) => `<div class="info__row"><span class="fk">${r.k}</span><span class="fv">${r.v}</span></div>`).join("");

  const map = $("#map");
  if (map) map.innerHTML = `<iframe title="Carte — Boxing Center Ramonville, ${SALLE.address.full}" src="${SALLE.mapsUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

  const faq = $("#faq");
  if (faq) faq.innerHTML = FAQ.map((f, i) => `
    <details${i === 0 ? " open" : ""}>
      <summary>${f.q}</summary>
      <p>${f.a}</p>
    </details>`).join("");
}

/* ------------------------------ BOOT ----------------------------- */
function boot() {
  pheroMeta();   // l'objet propre au hero de la page (remplace le filigrane partagé)
  if (page === "la-salle") { renderPlateau(); renderValues(); renderNetwork(); }
  if (page === "activites") renderDiscs();
  /* page === "coachs" : rien ici — le roster est rendu par le module inline de
     la page (#coachroster), qui dérive les créneaux réels de SCHEDULE. */
  if (page === "galerie") renderGallery();
  if (page === "plannings") renderPlanning();
  if (page === "tarifs") renderTarifs();
  if (page === "contact") renderContact();

  window.BC.media(document);
  window.BC.reveal(document);
  window.BC.magnetic(document);
  window.BC.touchLife(".coach, .tarif, .net, .promo, .station, .value");

  // ancre profonde (ex. /activites/#grappling) après rendu dynamique
  if (location.hash) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  }

  const start = () => { window.BC.refresh(); window.BC.initKinetics(); };
  window.addEventListener("load", start);
  setTimeout(start, 500);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
