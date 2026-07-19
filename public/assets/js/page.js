/* =====================================================================
   RAMONVILLE · page.js — moteur de rendu des 7 pages intérieures

   Un seul module, aiguillé par body[data-page]. Tout vient de data.js
   (facts verrouillés, planning officiel, offres datées, avis réels). Le
   chrome, la météo du ciel et le motion vivent dans site.js / sky.js.
   ===================================================================== */
import {
  DISCIPLINES, PLATEAU, VALUES, NETWORK, SALLE, SEASON, SEASON_LABEL,
  DAYS, SCHEDULE, SCHEDULE_ETE, FAMILLES, POSTERS, TARIFS, PROMOS, REVIEWS,
  GALLERY, PHOTO_CREDIT, FAQ, LINKS, DEHORS, ETE, GRID_LEGEND, COACHES,
} from "./data.js?v=7";

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

/* ============== LE CADRE VIVANT — le ciel à la place de la photo ==== *
   Un extérieur n'a pas de photographie fidèle : il a un ciel, et il change.
   Là où le reportage manque (les 300 m²), le cadre porte donc le VRAI ciel
   de Ramonville — même couche .sky que les heros, même flux Open-Meteo,
   avec son propre starfield. Ce n'est pas un bouche-trou : c'est la seule
   image honnête d'un lieu dont on n'a pas de cliché, et elle est vraie à la
   seconde. La légende dit d'où elle vient (loi documentaire). */
function skyFrame(label, extraClass = "") {
  return `<div class="skyframe ${extraClass}" role="img" aria-label="${label} — le ciel réel au-dessus du plateau extérieur, relevé en direct">
    <div class="sky" aria-hidden="true"><canvas class="sky__stars"></canvas><div class="sky__haze"></div><div class="sky__moon"></div></div>
    <div class="skyframe__rule" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="skyframe__cap">
      <span class="skyframe__k">${DEHORS.cadre.k}</span>
      <span class="skyframe__live" data-skylive></span>
    </div>
  </div>`;
}

/* Les chips « en direct » du cadre : un seul point de vérité pour toutes les
   instances (station, relevé, galerie), re-peintes quand Open-Meteo répond. */
const SKY_FR = { clair: "Ciel dégagé", voile: "Ciel voilé", pluie: "Pluie", orage: "Orage" };
function paintSkyLive(scope = document) {
  const s = window.__SKY || {};
  const sky = SKY_FR[s.sky] || "Nuit claire";
  const temp = s.tempC != null ? ` · <b>${s.tempC}°C</b>` : "";
  const h = typeof s.hour === "number" ? ` · ${String(s.hour).padStart(2, "0")}h` : "";
  scope.querySelectorAll("[data-skylive]").forEach((el) => {
    el.innerHTML = `<b>${sky}</b>${temp}${h}`;
  });
}

/* ---------------- LE RELEVÉ DU DEHORS (la-salle + galerie) --------- *
   Le différenciateur en fiche de terrain : ce qui est mesuré, ce qui ne
   l'est pas encore, et le ciel qui tient lieu d'image. Même composant sur
   les deux pages qui portent le sujet — une seule source, pas deux copies
   qui divergeront. */
function renderReleve() {
  const box = $("#releve"); if (!box) return;
  const D = DEHORS;
  box.innerHTML = `
    <div class="releve__frame" data-reveal>${skyFrame(D.t)}</div>
    <div class="releve__sheet" data-reveal>
      <span class="eyebrow">${D.eyebrow}</span>
      <h3 class="releve__t">${D.claim}</h3>
      <p class="releve__lead">${D.lead}</p>
      <dl class="releve__rows">
        ${D.mesures.map((m) => `
          <div class="rrow">
            <dt>${m.k}</dt>
            <dd><b>${m.v}</b><span>${m.d}</span></dd>
          </div>`).join("")}
        <div class="rrow rrow--open">
          <dt>${D.nonReleve.k}</dt>
          <dd><b>${D.nonReleve.v}</b><span>${D.nonReleve.d}</span></dd>
        </div>
      </dl>
      <p class="releve__src">${D.cadre.d}</p>
    </div>`;
}

/* ------------------------- LE PLATEAU (la-salle) ------------------ */
function renderPlateau() {
  const box = $("#stations"); if (!box) return;
  box.innerHTML = PLATEAU.map((s) => `
    <article class="station" data-reveal>
      ${s.img
        ? `<div class="station__media media" data-img="${s.img}" data-label="" data-alt="${s.t} — Boxing Center Ramonville"></div>`
        /* pas de cliché prouvé → le cadre porte le ciel réel du lieu, jamais
           le cadre d'une AUTRE zone légendé à la place (même loi que
           « nom ≡ photo » côté coachs), et jamais un carré « à venir ». */
        : `<div class="station__media station__media--sky">${skyFrame(s.t, "skyframe--tight")}</div>`}
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

/* ------------------- QUI TIENT QUOI, ET QUAND (coachs) ------------ *
   /coachs/ s'arrêtait au roster : quatre fiches, une note d'intégrité, un
   CTA. On savait QUI ils sont, jamais QUAND les trouver ni vers qui aller.
   Ces deux blocs se déduisent entièrement du planning officiel — la garde
   de la semaine (qui est sur le plateau, jour par jour) et l'aiguillage
   (ce que tu cherches → qui le tient, quel soir). Rien d'écrit à la main :
   si le planning bouge, ces blocs bougent avec lui. */
function renderCoachDepth() {
  const dayIx = (d) => DAYS.indexOf(d);

  /* la garde : qui est sur le plateau, jour par jour */
  const garde = $("#garde");
  if (garde) {
    garde.innerHTML = DAYS.map((d) => {
      const slots = SCHEDULE.filter((s) => s.day === d);
      const names = [...new Set(slots.map((s) => s.coach))];
      return `<div class="garde__day">
        <span class="garde__d">${d}</span>
        <div class="garde__who">
          ${names.map((n) => {
            const c = COACHES.find((x) => x.name === n);
            const n2 = slots.filter((s) => s.coach === n).length;
            return `<span class="gwho${c?.pillar ? " is-pillar" : ""}">${n}<i>${n2}</i></span>`;
          }).join("")}
        </div>
        <span class="garde__n">${slots.length} cours</span>
      </div>`;
    }).join("");
  }

  /* l'aiguillage : ce que tu viens chercher → qui le tient */
  const route = $("#routage");
  if (route) {
    route.innerHTML = [...DISCIPLINES].sort((a, b) => a.edge - b.edge).map((d) => {
      const slots = SCHEDULE.filter((s) => s.disc === d.key);
      const names = [...new Set(slots.map((s) => s.coach))];
      const soirs = [...new Set(slots.sort((a, b) => dayIx(a.day) - dayIx(b.day)).map((s) => s.day))];
      // « Accès libre » n'a ni coach ni créneau : on le dit, on ne l'invente pas
      const who = names.length ? names.join(" · ") : d.coach;
      const when = soirs.length ? soirs.join(" · ") : d.jours;
      return `<a class="route" href="/activites/#${d.key}">
        <span class="route__tag">${d.tag}</span>
        <b class="route__n">${d.name}</b>
        <span class="route__who">${who}</span>
        <span class="route__when">${when}</span>
      </a>`;
    }).join("");
  }
}

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
  const gridwrap = grid.closest(".gridwrap");
  const eteBox = $("#ete");
  const filtBox = $("#plan-filter");
  let mode = "rentree"; // rentree | ete
  let fam = "all";

  /* La rentrée : 23 cours sur 6 jours — une grille est le bon outil. */
  const buildGrid = () => {
    const times = [...new Set(SCHEDULE.map((s) => s.start))].sort();
    const head = `<thead><tr><th>Heure</th>${DAYS.map((d) => `<th>${d}</th>`).join("")}</tr></thead>`;
    const body = times.map((t) => {
      const cells = DAYS.map((day) => {
        const slots = SCHEDULE.filter((s) => s.start === t && s.day === day);
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

  /* L'ÉTÉ N'EST PAS UNE GRILLE. Deux cours, tous les deux le lundi : dans un
     tableau à six colonnes ça donnait 10 cases vides sur 12 — une page qui
     avait l'air CASSÉE là où la salle lève simplement le pied. L'été a donc
     sa propre forme : les deux créneaux nommés, en grand, puis ce qui occupe
     réellement le reste de la semaine — l'accès libre, qui ne s'arrête pas.
     Même données, rendu honnête. */
  const buildEte = () => {
    if (!eteBox) return;
    eteBox.innerHTML = `
      <p class="ete__lead">${ETE.lead}</p>
      <div class="ete__slots">
        ${SCHEDULE_ETE.map((s) => `
          <a class="eslot" href="/activites/#${s.disc}">
            <span class="eslot__d">${s.day}</span>
            <span class="eslot__t">${s.start}</span>
            <b class="eslot__c">${s.cours}</b>
            <span class="eslot__k">${s.coach}</span>
          </a>`).join("")}
      </div>
      <div class="ete__rest">
        <div class="ete__cell">
          <span class="fk">${ETE.libre.k}</span>
          <b>${ETE.libre.v}</b>
          <span class="ete__d">${ETE.libre.d}</span>
        </div>
        <div class="ete__cell ete__cell--off">
          <span class="fk">${ETE.ferme.k}</span>
          <b>${ETE.ferme.v}</b>
          <span class="ete__d">${ETE.ferme.d}</span>
        </div>
      </div>
      <p class="ete__renfort">${ETE.renfort}</p>
      <p class="ete__back">${ETE.retour}</p>`;
  };

  /* bascule d'AFFICHAGE : la grille et l'été ne coexistent jamais à l'écran,
     et le filtre par famille n'a aucun sens sur deux cours — il disparaît
     avec la grille au lieu de rester là, inerte. */
  const swap = () => {
    const isEte = mode === "ete";
    if (gridwrap) gridwrap.hidden = isEte;
    if (eteBox) eteBox.hidden = !isEte;
    if (filtBox) filtBox.hidden = isEte;
    const leg = $("#grid-legend"); if (leg) leg.hidden = isEte;
    if (isEte) buildEte(); else buildGrid();
  };
  const build = swap;
  swap();

  // onglets rentrée / été — libellés de saison via constantes (anti-péremption
  // §4 : aucun millésime figé dans une étiquette utilisateur)
  const tabs = $("#plan-tabs");
  const note = $("#plan-note");
  const RENTREE_NOTE = `<b>${SEASON_LABEL}</b> — planning complet. Émargement GPS obligatoire en salle avant chaque cours.`;
  // Le détail de l'été (renforts, accès libre, retour de la rentrée) vit
  // maintenant DANS le bloc #ete, en clair. Cette note ne le répète pas : une
  // bonne phrase ne se dit qu'une fois par site (standards §7).
  const ETE_NOTE = `<b>Hors saison</b> — le rythme d'été. Émargement GPS toujours obligatoire en salle.`;
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

  /* LA LÉGENDE — la grille codait déjà deux familles à l'œil (liseré argent
     du Lady Punch, point des créneaux cage) sans que ce code soit écrit nulle
     part : de la signalétique que personne ne pouvait lire. */
  const leg = $("#grid-legend");
  if (leg) leg.innerHTML = GRID_LEGEND.map((g) => `
    <span class="glg">
      <i class="glg__sw" data-fam="${g.cls}" aria-hidden="true"></i>
      <b>${g.label}</b><span>${g.d}</span>
    </span>`).join("");

  renderRythme();
}

/* ------------------- LE RYTHME DE LA SEMAINE (plannings) ---------- *
   /plannings/ n'avait qu'UNE section : la grille, puis les posters, puis le
   CTA. Une page utilitaire, pas une page. Ce bloc lit la MÊME source
   (SCHEDULE) et la raconte autrement : ce que pèse chaque jour, où tombent
   les midis et les soirs, quel soir la salle est pleine. Zéro fait ajouté —
   tout est compté, rien n'est écrit à la main. */
function renderRythme() {
  const box = $("#rythme"); if (!box) return;
  /* trois tranches, pas deux : un « midi / soir » binaire rangeait le Baby
     Boxe du samedi 14h15 dans « midi » et l'éducative de 15h dans « soir » —
     deux étiquettes fausses sur la même après-midi d'enfants. */
  const tranche = (t) => (toMin(t) < 14 * 60 ? "midi" : toMin(t) < 17 * 60 ? "aprem" : "soir");
  const perDay = DAYS.map((d) => {
    const all = SCHEDULE.filter((s) => s.day === d).sort((a, b) => toMin(a.start) - toMin(b.start));
    const t = { midi: 0, aprem: 0, soir: 0 };
    all.forEach((s) => { t[tranche(s.start)]++; });
    return { d, n: all.length, ...t, first: all[0]?.start || "—", last: all[all.length - 1]?.start || "—" };
  });
  const max = Math.max(...perDay.map((p) => p.n)) || 1;
  const sum = (k) => perDay.reduce((a, p) => a + p[k], 0);
  const busiest = perDay.reduce((a, p) => (p.n > a.n ? p : a), perDay[0]);
  const apremSlots = SCHEDULE.filter((s) => tranche(s.start) === "aprem");
  // vérifié, pas affirmé : les après-midis appartiennent-ils vraiment à l'école ?
  const apremEcole = apremSlots.every((s) => s.fam === "enfant");
  const parts = (p) => [p.midi && `${p.midi} midi`, p.aprem && `${p.aprem} aprèm`, p.soir && `${p.soir} soir`].filter(Boolean).join(" · ");

  box.innerHTML = `
    <div class="rythme__bars" data-reveal-group>
      ${perDay.map((p) => `
        <div class="rbar${p.n === max ? " is-peak" : ""}">
          <span class="rbar__d">${p.d}</span>
          <span class="rbar__col" style="--h:${Math.round((p.n / max) * 100)}%" aria-hidden="true"><i></i></span>
          <span class="rbar__n">${p.n}</span>
          <span class="rbar__s">${parts(p)}</span>
          <span class="sr-only">${p.d} : ${p.n} cours, de ${p.first} à ${p.last}.</span>
        </div>`).join("")}
    </div>
    <div class="rythme__reads" data-reveal-group>
      <p><b>${sum("midi")}</b> cours le midi, <b>${sum("soir")}</b> le soir. La salle se remplit deux fois par jour : la pause déjeuner pour le geste propre, le soir pour le volume et le bruit.</p>
      <p><b>${busiest.d}</b> est le jour le plus chargé — ${busiest.n} cours, de ${busiest.first} à ${busiest.last}. Tu veux du monde sur le plateau ? Viens ce jour-là. Tu veux de la place ? Prends un midi.</p>
      <p>${apremEcole
        ? `Les <b>${sum("aprem")}</b> créneaux d'après-midi sont <b>tous</b> à l'école enfants — mercredi et samedi, entre 14h et 17h, le plateau est à eux.`
        : `<b>${sum("aprem")}</b> créneaux d'après-midi, entre 14h et 17h.`}
        Le reste du temps, rien ne ferme : accès libre de 10h à 21h30, six jours sur sept.</p>
    </div>`;
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
  /* L'accès ne tient plus en une ligne à trois <br> : trois façons de venir,
     trois entrées lisibles. Et les horaires viennent de SALLE.hoursData —
     une donnée qui existait depuis l'origine et que PERSONNE n'affichait :
     tout le site répétait la version résumée « Lun – Sam · 10h – 21h30 ». */
  const info = $("#info"); if (info) info.innerHTML = [
    { k: "Adresse", v: SALLE.address.full },
    { k: "Téléphone", v: `<a href="tel:${SALLE.phoneHref}">${SALLE.phone}</a>` },
    { k: "E-mail", v: `<a href="mailto:${SALLE.email}">${SALLE.email}</a>` },
    { k: "En salle", v: SALLE.note },
  ].map((r) => `<div class="info__row"><span class="fk">${r.k}</span><span class="fv">${r.v}</span></div>`).join("");

  const venir = $("#venir");
  if (venir) {
    const MODE = [
      { k: "Métro", ico: "M" }, { k: "Bus", ico: "B" }, { k: "Voiture", ico: "R" },
    ];
    venir.innerHTML = SALLE.access.map((a, i) => {
      const k = MODE[i]?.k || "Accès";
      const [h0, ...rest] = a.split(" — ");
      let head = h0, detail = rest.join(" — ");
      /* « Bus — arrêt Ramonville Sud… » donnait une carte titrée « Bus » sous
         une étiquette « Bus » : le mot deux fois, et l'info utile reléguée en
         petit. Quand l'intitulé ne fait que répéter le mode, on promeut le
         premier fait concret au titre. */
      if (head.toLowerCase() === k.toLowerCase() && detail) {
        const seg = detail.split(", ");
        head = seg.shift().replace(/^./, (c) => c.toUpperCase());
        detail = seg.join(", ");
      }
      return `<div class="venir__card">
        <span class="venir__ico" aria-hidden="true">${MODE[i]?.ico || "·"}</span>
        <span class="fk">${k}</span>
        <b>${head}</b>
        <span class="venir__d">${detail}</span>
      </div>`;
    }).join("");
  }

  const hrs = $("#horaires");
  if (hrs) hrs.innerHTML = SALLE.hoursData.map((h) => `
    <div class="hrow${/ferm/i.test(h.h) ? " hrow--off" : ""}">
      <span class="hrow__d">${h.d}</span>
      <span class="hrow__h">${h.h}</span>
    </div>`).join("")
    + `<p class="hrow__note">L'accès libre muscu/cardio suit les mêmes horaires : tant que la salle est ouverte, le plateau et l'étage le sont.</p>`;

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
  if (page === "la-salle") { renderReleve(); renderPlateau(); renderValues(); renderNetwork(); }
  if (page === "activites") renderDiscs();
  /* page === "coachs" : le roster est rendu par le module inline de la page
     (#coachroster) ; la garde de la semaine et l'aiguillage le sont ici. */
  if (page === "coachs") renderCoachDepth();
  if (page === "galerie") { renderGallery(); renderReleve(); }
  if (page === "plannings") renderPlanning();
  if (page === "tarifs") renderTarifs();
  if (page === "contact") renderContact();

  /* Les cadres vivants viennent d'être injectés : on monte leurs starfields
     (sky.js a balayé le document AVANT que ce module n'écrive quoi que ce
     soit) et on peint les relevés en direct. Sans ça, le ciel qui remplace la
     photo manquante reste un rectangle noir — le contraire du but. */
  window.__SKY?.mount?.(document);
  paintSkyLive(document);
  window.addEventListener("sky:change", () => paintSkyLive(document));

  window.BC.media(document);
  window.BC.reveal(document);
  window.BC.magnetic(document);
  window.BC.touchLife(".coach, .tarif, .net, .promo, .station, .value, .route, .eslot, .venir__card");

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
