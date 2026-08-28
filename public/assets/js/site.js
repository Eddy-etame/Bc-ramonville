/* =====================================================================
   RAMONVILLE · site.js — chrome + moteur de motion (édition nuit)
   window.BC = { reveal, magnetic, refresh, media, split, scramble, lenis }

   Même moteur éprouvé que les salles sœurs (lenis · reveal + dead-man ·
   magnetic · media hydrate · marquee · scramble), RE-SKINNÉ pour le
   plateau : chrome anguleux, footer « fiche de terrain », et une barre
   qui tient sur une ligne de 320 à 2560 px — l’argent de la marque est
   figé, il n’y a plus rien à basculer.
   Aucun chrome copié de Saint-Cyprien.
   ===================================================================== */
import { NAV, LINKS, SALLE, SEASON_LABEL, NETWORK } from "./data.js?v=19";

import { initPlaces } from "./places.js?v=19";
/* --------------------------- LE MAILLAGE --------------------------- *
   Les liens sortants vers le réseau propriétaire : le site du groupe, la
   boutique, et les quatre salles sœurs. Ils sont présents sur CHAQUE
   page (nav large + tiroir + pied de page), portent l’icône de lien
   externe, et s’ouvrent dans un onglet neuf.

   PAS DE `nofollow` : ce n’est pas du lien payé ni du contenu d’un
   tiers, c’est le maillage de marque du même propriétaire — le retirer
   reviendrait à demander à Google d’ignorer sa propre enseigne. On garde
   `noopener` (sécurité de l’onglet), rien de plus.
   ------------------------------------------------------------------- */
const svgExt = `<svg class="ext" width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M5 11L11 5M11 5H6M11 5V10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const lienExt = (href, label, titre) =>
  `<a href="${href}" target="_blank" rel="noopener"${titre ? ` title="${titre}"` : ""}>${label} ${svgExt}</a>`;
/* les sœurs : la liste des vraies salles, Ramonville retirée (c’est ici) */
const SOEURS = (NETWORK || []).filter((s) => !s.self);

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
if (!gsap) document.documentElement.classList.remove("fx");

/* GSAP ABSENT : LE TEXTE PASSE AVANT, ET RIEN NE DOIT LEVER.
   Retirer `fx` (ligne au-dessus) rendait bien le texte visible — mais
   reveal() continuait ensuite jusqu’à `gsap.set(...)` et jetait un
   TypeError, mesuré en conditions réelles sur /contact/ (« Cannot read
   properties of undefined (reading 'set') »). L’exception ne remontait pas
   qu’une ligne : elle interrompait reveal(), donc l’appelant, donc TOUT ce
   que page.js faisait après — la fin du montage de la page partait avec.
   Le texte restait lisible, ce qui rendait le défaut invisible à l'œil, et
   c’est précisément ce qui le rendait dangereux.

   `motionOK` est la seule porte : rien n’appelle gsap sans être passé par
   elle. On garde le filet dead-man en TÊTE et non en queue — c’est quand le
   moteur d’animation manque qu’il faut découvrir le texte, pas l’inverse
   (loi de lisibilité : l’animation révèle le texte, jamais le contraire). */
const motionOK = !!(gsap && ScrollTrigger) && !reduce;
function toutMontrer(scope = document) {
  document.documentElement.classList.remove("fx");
  scope.querySelectorAll(".reveal-mask > span, [data-reveal], [data-reveal-group] > *")
    .forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
}

let lenis = null;
let velocity = 0;

/* --------------------------- LA COULEUR EST FIXE ------------------ *
   LA BASCULE DE PALETTE EST PARTIE, ET C’EST UNE DÉCISION, PAS UN OUBLI.
   La barre empilait logo + RAMONVILLE + 8 liens + Le groupe ↗ + Boutique ↗
   + la pastille « ACIER » + l’offre 29€ + le burger : huit familles d’objets
   pour une seule ligne, et plus rien ne se lisait. Le premier à sauter est
   celui qui ne sert le visiteur en rien — personne n’est venu ici choisir
   un métal. Ramonville reste sur l’ARGENT lunaire de la marque, figé.

   Ce qui part avec : le bouton, `data-palette`, le petit script no-flash
   des neuf <head>, le bloc `:root[data-palette="cuivre"]` de base.css, et
   la clé localStorage — effacée UNE fois ci-dessous pour qu’un visiteur
   qui avait choisi le cuivre ne traîne pas une préférence sans objet.

   `bc:palette` reste ÉCOUTÉ par sky.js : l’événement n’est plus émis, le
   contrat ne bouge pas. Le jour où la marque tranche une autre couleur,
   il suffit de le réémettre — rien n’a été démonté du côté du ciel. */
try { localStorage.removeItem("bc-ram-palette"); } catch (_) {}

/* ----------------------------- NAV / MENU ------------------------- */
function currentPath() {
  let p = location.pathname.replace(/index\.html$/, "");
  if (!p.endsWith("/")) p += "/";
  return p;
}
function mountNav() {
  const path = currentPath();
  /* LA BARRE NE PORTE PLUS « ACCUEIL ».
     Le logo EST le lien d’accueil depuis toujours — la barre affichait donc
     deux fois la même destination, dans une ligne où plus rien ne tenait.
     Sur l’accueil, c’est le logo qui porte `aria-current="page"` : la page
     courante reste annoncée, elle l’est simplement au bon endroit. Le menu,
     lui, garde les huit entrées : rien n’est retiré au visiteur, on arrête
     seulement de le lui dire deux fois sur la même ligne. */
  const home = path === "/";
  /* `n.short` quand il existe : la barre est la seule ligne du site où la
     place manque vraiment (huit destinations, un logo, un bouton, un burger,
     à partir de 1160 px). Le tiroir, lui, garde le libellé entier. */
  const links = NAV.filter((n) => n.href !== "/" && n.top !== false).map(
    (n) => `<a href="${n.href}"${n.href === path ? ' aria-current="page"' : ""}>${n.short || n.label}</a>`
  ).join("");
  document.getElementById("nav").innerHTML = `
    <nav class="nav" id="site-nav">
      <a class="nav__brand" href="/" aria-label="Boxing Center Ramonville — accueil"${home ? ' aria-current="page"' : ""}>
        <!-- alt="" : le lien parent porte déjà aria-label="Boxing Center
             Ramonville — accueil", qui EST le nom accessible. Un alt en plus ne
             se lit jamais et ne sort qu’en doublon dans les audits.
             .webp 274×128 et non le PNG 3542×1655 : la barre l’affiche à 32 px
             de haut (base.css), on servait donc 131 ko pour en peindre 9 —
             sur les huit pages, avant la première photo de la salle. -->
        <img class="nav__logo" src="/assets/img/logo-white.webp" alt="" width="274" height="128" fetchpriority="high" decoding="async" />
        <span class="nav__salle">Ramonville</span>
      </a>
      <div class="nav__links">${links}</div>
      <!-- LE GROUPE ↗ ET BOUTIQUE ↗ NE SONT PLUS DANS LA BARRE — ils n’ont
           PAS quitté le site. Ils vivent dans le menu (.menu__ext, juste en
           dessous) ET dans le pied de page, qui est écrit EN DUR dans le HTML
           livré par scripts/maillage.mjs : le maillage de marque reste donc
           lisible par un robot qui n’exécute pas une ligne de JavaScript,
           exactement comme avant. Ce qui change, c’est qu’ils ne se battent
           plus avec huit entrées de menu pour trois centimètres de barre. -->
      <div class="nav__right">
        <a class="btn btn--primary nav__cta" data-magnetic href="${LINKS.rentree}"><span>Ma place · 29 €</span></a>
        <button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
      </div>
    </nav>`;

  const menuLinks = NAV.map(
    (n, i) => `<a class="menu__link" href="${n.href}"><span class="n">${String(i + 1).padStart(2, "0")}</span>${n.label}</a>`
  ).join("");
  document.getElementById("drawer").innerHTML = `
    <div class="menu" id="menu" aria-hidden="true" data-lenis-prevent>
      <div class="menu__top">
        <a class="nav__brand" href="/" aria-label="Boxing Center Ramonville — accueil">
          <!-- alt="" : le lien parent porte déjà aria-label="Boxing Center
             Ramonville — accueil", qui EST le nom accessible. Un alt en plus ne
             se lit jamais et ne sort qu’en doublon dans les audits. -->
        <img class="nav__logo" src="/assets/img/logo-white.webp" alt="" width="274" height="128" fetchpriority="high" decoding="async" />
          <span class="nav__salle">Ramonville</span>
        </a>
        <button class="menu__close" id="menu-close">Fermer <span aria-hidden="true">✕</span></button>
      </div>
      <nav class="menu__nav">${menuLinks}</nav>
      <div class="menu__foot">
        <a class="btn btn--primary" data-magnetic href="${LINKS.rentree}"><span>Je prends ma place — 29 €</span></a>
        <div class="menu__ext">
          ${lienExt(LINKS.groupe, "Le site officiel — boxingcenter.fr")}
          ${lienExt(LINKS.boutique, "La boutique — box-plus")}
          ${lienExt(LINKS.instagram, "Instagram")}
          <a href="tel:${SALLE.phoneHref}">${SALLE.phone}</a>
        </div>
      </div>
    </div>`;

  const nav = document.getElementById("site-nav");
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  const menuClose = document.getElementById("menu-close");
  const items = menu.querySelectorAll(".menu__link");
  menu.toggleAttribute("inert", true); // fermé au chargement : hors de la nav clavier
  const setOpen = (open) => {
    const wasOpen = menu.classList.contains("is-open");
    document.documentElement.classList.toggle("is-menu-open", open);
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    menu.toggleAttribute("inert", !open); // clavier/AT : pas de tab dans le menu fermé
    burger.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("is-locked", open);
    if (lenis) open ? lenis.stop() : lenis.start();
    // gestion du focus : entre dans le menu à l’ouverture, revient au burger à la fermeture
    if (open) menuClose?.focus();
    else if (wasOpen) burger.focus();
    if (gsap && !reduce && open) {
      gsap.fromTo(items, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.62, ease: "power4.out", stagger: 0.05, delay: 0.16 });
    }
  };
  burger.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
  document.getElementById("menu-close").addEventListener("click", () => setOpen(false));
  menu.querySelectorAll(".menu__link, .menu__foot a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

  let last = 0;
  ScrollTrigger?.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle("is-scrolled", y > 60);
      if (y > last && y > 380 && !menu.classList.contains("is-open")) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
      last = y;
    },
  });
}

/* --------------------- FOOTER — la fiche de terrain ---------------- */
function mountFooter() {
  const cols = [{ h: "Le plateau", links: NAV.slice(1, 6) }];
  const fields = [
    { k: "Établissement", v: "Boxing Center — Ramonville", wide: true },
    { k: "Extérieur", v: "300 m² couverts · octogone de 7 m" },
    { k: "Niveaux", v: "2 · étage muscu/cardio" },
    { k: "Adresse", v: SALLE.address.full, wide: true },
    { k: "Horaires", v: SALLE.hours },
    { k: "Téléphone", v: `<a href="tel:${SALLE.phoneHref}">${SALLE.phone}</a>` },
    { k: "Accès", v: "Métro B · terminus Ramonville" },
    { k: "Fédérations", v: SALLE.federations.join(" · ") },
  ];
  document.getElementById("footer").innerHTML = `
    <footer class="footer">
      <div class="wrap">
        <div class="footer__head">
          <div>
            <span class="eyebrow">Le plateau t’attend</span>
            <h2 class="display footer__cut" aria-label="Le seul plateau du réseau qui a un ciel pour plafond.">Le seul plateau du réseau<br><span class="tint">qui a un ciel pour plafond.</span></h2>
          </div>
          <a class="btn btn--primary" data-magnetic href="${LINKS.rentree}"><span>Je prends ma place — 29 €</span></a>
        </div>
        <div class="fiche" aria-label="Fiche de la salle">
          ${fields.map((f) => `<div class="fiche__cell${f.wide ? " fiche__cell--wide" : ""}"><span class="fk">${f.k}</span><span class="fv">${f.v}</span></div>`).join("")}
        </div>
        <div class="footer__links">
          ${cols.map((c) => `<div class="footer__col"><h4>${c.h}</h4>${c.links.map((l) => `<a href="${l.href}">${l.label}</a>`).join("")}</div>`).join("")}
          <div class="footer__col">
            <h4>Le réseau</h4>
            ${lienExt(LINKS.groupe, "Le site officiel — boxingcenter.fr", "Le site du réseau Boxing Center")}
            ${lienExt(LINKS.boutique, "La boutique — box-plus", "box-plus — la boutique Boxing Center")}
            ${lienExt(LINKS.instagram, "Instagram")}
            ${lienExt(LINKS.facebook, "Facebook")}
          </div>
          <div class="footer__col">
            <h4>Les salles sœurs</h4>
            ${SOEURS.map((s) => lienExt(s.url, s.name, `${s.name} — ${s.feat}`)).join("")}
          </div>
        </div>
        <!-- Le maillage inter-salles, en clair : le réseau existait en
             données depuis le début et n’était rendu nulle part. Un
             abonnement Saison ouvre les cinq clubs — autant que le
             visiteur (et le moteur) puissent y aller. -->
        <p class="footer__reseau">Cinq salles à Toulouse et alentour, un seul abonnement : l’Offre Saison donne l’accès libre aux ${(NETWORK || []).length} clubs du réseau.</p>
        <div class="footer__bottom">
          <span>© ${new Date().getFullYear()} Boxing Center Ramonville. · <a href="/about/">À propos</a> · <a href="/privacy/">Confidentialité</a></span>
          <span class="footer__stamp">${SEASON_LABEL} · sous le ciel de Ramonville</span>
        </div>
      </div>
    </footer>`;
}

/* ------------------------------ LENIS ----------------------------- */
function initSmooth() {
  /* `gsap.ticker` pilote le rAF de Lenis : sans gsap, la ligne suivante levait.
     Le défilement natif reprend la main, et personne ne voit la différence. */
  if (!motionOK || !window.Lenis) return;
  lenis = new window.Lenis({ duration: 1.05, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on("scroll", (e) => { velocity = e.velocity; ScrollTrigger?.update(); });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ----------------------------- MAGNETIC --------------------------- */
function magnetic(scope = document) {
  /* L’aimantation est un agrément : sans moteur, le bouton reste un bouton. */
  if (!motionOK || window.matchMedia("(hover: none)").matches) return;
  scope.querySelectorAll("[data-magnetic]").forEach((el) => {
    if (el.dataset.magBound) return; el.dataset.magBound = "1";
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.5, ease: "power3.out" });
    });
    el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" }));
  });
}

/* ----------------------------- SPLIT / SCRAMBLE -------------------- */
function split(el) {
  if (el.dataset.splitDone) return [...el.querySelectorAll(".char")];
  el.dataset.splitDone = "1";
  const text = el.textContent; el.textContent = "";
  const chars = [];
  [...text].forEach((ch) => { const s = document.createElement("span"); s.className = "char"; s.style.display = "inline-block"; s.textContent = ch === " " ? " " : ch; el.appendChild(s); chars.push(s); });
  return chars;
}
/* scramble mono — les captions horodatées « tapent » (brief §5) */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·:";
function scramble(el, opts = {}) {
  if (reduce) { el.textContent = el.dataset.text || el.textContent; return; }
  const final = el.dataset.text || el.textContent;
  el.dataset.text = final;
  const dur = opts.dur || 700;
  let start = null, done = false;
  const settle = () => { if (!done) { done = true; el.textContent = final; } };
  const step = (ts) => {
    if (done) return;
    if (!start) start = ts;
    const p = Math.min(1, (ts - start) / dur);
    const rev = Math.floor(p * final.length);
    let out = "";
    for (let i = 0; i < final.length; i++) out += i < rev || final[i] === " " ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    el.textContent = out;
    if (p < 1) requestAnimationFrame(step); else settle();
  };
  requestAnimationFrame(step);
  /* DEAD-MAN (loi n°1) — le seul effet rAF du moteur qui n’en avait pas, alors
     que countUp, le rail de /la-salle/ et le tracé de l’octogone en ont tous un.
     Un scramble gelé (onglet ouvert en fond, rAF étranglé) laisse la caption
     figée sur des GLYPHES ALÉATOIRES : le texte le plus documentaire du site
     rendu en charabia. Passé le double de sa durée, on POSE le texte final. */
  setTimeout(settle, dur * 2 + 400);
}

/* ----------------------------- REVEAL ----------------------------- */
/* LE PREMIER ÉCRAN N’APPARTIENT PLUS AU MOTEUR.
   Tout ce qui vit dans .hero / .phero est monté par une animation CSS qui
   part au premier rendu (base.css, § « le premier écran ne dépend plus du
   réseau »). Le mouvement est identique — mais il ne réclame plus qu’une
   librairie traverse l’Atlantique avant de rendre le texte visible.
   Ici, on se contente donc de le déclarer déjà traité : sans ça, le
   `gsap.set(..., { opacity: 0 })` ci-dessous le RE-CACHERAIT juste après
   que le navigateur l’a montré — le pire des deux mondes. */
const premierEcran = (el) => !!(el.closest && el.closest(".hero, .phero"));

function reveal(scope = document) {
  /* Un seul verrou pour les deux cas — mouvement refusé par l’utilisateur, ou
     moteur d’animation absent. Avant, seul `reduce` était traité, et l’absence
     de gsap tombait dans les `gsap.set` plus bas. */
  if (!motionOK) { toutMontrer(scope); return; }
  scope.querySelectorAll(".reveal-mask").forEach((m) => {
    const kids = [...m.children];
    if (m.dataset.revBound || !kids.length) return; m.dataset.revBound = "1";
    if (premierEcran(m)) return;
    gsap.set(kids, { yPercent: 112, opacity: 0 });
    gsap.to(kids, { yPercent: 0, opacity: 1, duration: 0.6, ease: "power2.out", stagger: 0.05, scrollTrigger: { trigger: m, start: "top 90%" } });
  });
  scope.querySelectorAll("[data-reveal]").forEach((el) => {
    if (el.dataset.revBound) return; el.dataset.revBound = "1";
    if (premierEcran(el)) return;
    gsap.to(el, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 92%" } });
  });
  scope.querySelectorAll("[data-reveal-group]").forEach((g) => {
    const kids = [...g.children];
    if (g.dataset.revBound || !kids.length) return; g.dataset.revBound = "1";
    if (premierEcran(g)) return;
    gsap.set(kids, { opacity: 0, y: 12 });
    gsap.to(kids, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.04, scrollTrigger: { trigger: g, start: "top 88%" } });
  });

  /* Dead-man net (loi de lisibilité) : si le ticker gèle, tout redevient
     lisible de force. Le motion RÉVÈLE, il ne bloque jamais. */
  if (!reveal._net && gsap) {
    reveal._net = true;
    const f0 = gsap.ticker.frame;
    setTimeout(() => {
      if (gsap.ticker.frame !== f0) return;
      document.documentElement.classList.remove("fx");
      document.querySelectorAll(".reveal-mask > span, [data-reveal], [data-reveal-group] > *").forEach((el) => {
        el.style.opacity = "1"; el.style.transform = "none";
      });
    }, 3500);
  }
}

/* --------------------------- MEDIA HYDRATE ------------------------ */
function hydrateMedia(scope = document) {
  scope.querySelectorAll(".media[data-img]").forEach((el) => {
    if (el.dataset.mediaBound) return; el.dataset.mediaBound = "1";
    const img = new Image();
    /* L’ORDRE DÉCIDE. Dès que `src` est affecté, le navigateur lance le
       téléchargement et fige son choix : un srcset posé après est ignoré
       (vu le 25/08 — currentSrc restait sur le fichier de 1086 px alors que
       la vignette de 320 était bien déclarée). Idem pour `loading`. Donc
       srcset, sizes et loading D’ABORD, src EN DERNIER. */
    img.alt = el.dataset.alt || el.dataset.label || "";
    img.loading = el.hasAttribute("data-eager") ? "eager" : "lazy"; img.decoding = "async";
    /* Le navigateur choisit la taille. Mesuré le 25/08 sur l’accueil à 375 px :
       les cinq portraits descendaient en 1086 px pour une case de 143 — 483 ko
       pour 69 ko utiles. `srcset` ne remplace rien, il ajoute un choix, et le
       navigateur prend toujours la plus petite image qui suffit. */
    if (el.dataset.w) img.width = el.dataset.w;
    if (el.dataset.h) img.height = el.dataset.h;
    /* `sizes` D’ABORD : affecter `srcset` lance la sélection sur-le-champ, et
       si `sizes` vaut encore 100vw à cet instant, le navigateur croit avoir
       besoin de 750 px sur un écran de 375 en densité 2 — il prend la grande,
       et la ligne `sizes` posée juste après arrive trop tard. */
    if (el.dataset.srcset) { img.sizes = el.dataset.sizes || "100vw"; img.srcset = el.dataset.srcset; }
    img.src = el.dataset.img;   /* EN DERNIER — voir le commentaire plus haut */
    el.prepend(img);
  });
}

/* --------------------- VELOCITY: ticker drift --------------------- */
let kineticsOn = false;
function initKinetics() {
  /* Le bandeau défilant est porté par gsap.ticker : sans lui, il reste posé,
     lisible, à sa place de départ — plutôt qu’une exception à mi-parcours. */
  if (!motionOK || kineticsOn) return; kineticsOn = true;
  const tracks = [...document.querySelectorAll(".marquee__track")].map((t) => {
    const half = t.scrollWidth / 2 || 1;
    return { el: t, half, x: 0, base: parseFloat(t.dataset.speed || "0.6") };
  });
  if (!tracks.length) return;
  gsap.ticker.add(() => {
    let smooth = velocity * 0.2;
    tracks.forEach((m) => {
      m.x -= m.base + Math.abs(smooth) * 0.3;
      if (m.x <= -m.half) m.x += m.half;
      m.el.style.transform = `translateX(${m.x}px)`;
    });
    velocity *= 0.9;
  });
}

/* touch : les cartes se soulèvent en traversant le viewport (pas de hover) */
function touchLife(sel = ".card, .cfg, .tarif, .coach, .promo") {
  if (!window.matchMedia("(hover: none)").matches || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => e.target.classList.toggle("is-inview", e.isIntersecting && e.intersectionRatio >= 0.55)),
    { threshold: [0, 0.55, 1] }
  );
  document.querySelectorAll(sel).forEach((el) => io.observe(el));
}

/* a11y : un titre coupé en deux .reveal-mask (blocs séparés) produit un nom
   accessible SANS espace au raccord — « L’octogoneà ciel ouvert. », « Le tourdu
   terrain. ». On recompose un aria-label propre depuis les fragments, sans
   toucher au visuel (deux lignes). Idempotent : ne réécrit jamais un aria-label
   déjà posé. */
function labelSplitHeadings(scope = document) {
  scope.querySelectorAll("h1, h2").forEach((h) => {
    if (h.hasAttribute("aria-label")) return;
    const masks = h.querySelectorAll(".reveal-mask");
    if (masks.length < 2) return;
    const name = [...masks].map((m) => m.textContent.replace(/\s+/g, " ").trim()).filter(Boolean).join(" ");
    if (name) h.setAttribute("aria-label", name);
  });
}

const refresh = () => ScrollTrigger?.refresh();

/* ================================================================
   L'ASSISTANT SE PRESENTE TOUT SEUL — une fois, au bon moment.

   Une pastille muette dans un coin ne se remarque pas : personne ne
   clique sur ce qu'il n'a pas compris. Le bot se presente donc de
   lui-meme, mais seulement quand le visiteur a montre qu'il lisait
   (il a fait defiler). Jamais a l'arrivee : s'ouvrir sur le nez de
   quelqu'un qui vient d'atterrir, c'est le geste qui fait fermer
   l'onglet.

   POURQUOI UN CLIC SIMULE plutot qu'un appel de fonction : le module
   du bot ne descend qu'a l'intention de parler, et chaque salle a sa
   propre mecanique de chargement. Cliquer la pastille, c'est le chemin
   qu'emprunte un vrai visiteur — il marche partout, sans rien savoir
   de ce qu'il y a derriere.

   Trois garde-fous : une seule fois par session ; jamais si le panneau
   est deja la ; jamais sur /seance-offerte/, page de conversion ou le
   formulaire ne doit rien avoir devant lui.

   Sur telephone, le panneau couvre l'ecran : on y pose une BULLE avec
   la premiere phrase et un bouton. Le message est vu, la page reste au
   visiteur.
   ================================================================ */
function presentationAssistant() {
  const CLE = "bcr-chat-auto", SEUIL_PX = 900, SEUIL_PART = 0.28;
  const pastille = document.querySelector("a.chatbot, .chatbot");
  if (!pastille) return;
  try { if (sessionStorage.getItem(CLE)) return; } catch (e) { /* stockage indispo */ }
  if (location.pathname.indexOf("/seance-offerte") === 0) return;

  let fait = false, bulle = null;
  const dejaLa = () => !!document.querySelector('[class*="chat__panel"], [class*="chat-panel"], #bcr-panel, #scchat-panel');
  const congedier = () => { if (bulle) { bulle.remove(); bulle = null; } };
  const ouvrir = () => pastille.click();

  function poserBulle(texte) {
    if (bulle) return;
    bulle = document.createElement("div");
    bulle.className = "bc-amorce";
    bulle.setAttribute("role", "status");
    bulle.innerHTML =
      '<button type="button" class="bc-amorce__fermer" aria-label="Masquer le message de l’assistant">×</button>' +
      '<p class="bc-amorce__texte">' + texte + "</p>" +
      '<span class="bc-amorce__cta">Discuter →</span>';
    bulle.addEventListener("click", (e) => {
      const ferme = e.target.closest(".bc-amorce__fermer");
      congedier();
      if (!ferme) ouvrir();
    });
    document.body.appendChild(bulle);
  }

  function regarder() {
    if (fait || dejaLa()) return;
    const h = document.documentElement;
    const y = window.scrollY || h.scrollTop || 0;
    const total = Math.max(1, h.scrollHeight - h.clientHeight);
    if (y < SEUIL_PX && y / total < SEUIL_PART) return;
    fait = true;
    try { sessionStorage.setItem(CLE, "1"); } catch (e) { /* stockage indispo */ }
    setTimeout(() => {
      if (dejaLa()) return;
      if (window.matchMedia("(max-width: 480px)").matches) poserBulle("Une question sur les offres, l’octogone ou les créneaux ? Je réponds tout de suite.");
      else ouvrir();
    }, 650);
  }

  /* On LIT la position, on n'attend pas qu'on nous la signale : aucun
     evenement `scroll` n'est emis sur ce site (Lenis les absorbe — mesure
     faite au navigateur). Un intervalle plutot que requestAnimationFrame,
     parce que rAF est gele des que la page ne compose plus d'images
     (onglet d'arriere-plan) : la presentation ne partirait jamais pour
     quelqu'un qui ouvre le site dans un onglet et y revient. 300 ms coute
     cent fois moins qu'une image. On s'arrete pour de bon au premier
     declenchement, et on abandonne au bout de deux minutes. */
  const minuteur = setInterval(() => {
    regarder();
    if (fait) clearInterval(minuteur);
  }, 300);
  setTimeout(() => clearInterval(minuteur), 120000);
  regarder();   // page deja defilee (retour arriere, ancre) : on tranche tout de suite
}

/* ------------------------------ BOOT ------------------------------ */
window.BC = {
  reveal, magnetic, refresh, media: hydrateMedia, split, scramble, initKinetics, touchLife,
  get lenis() { return lenis; }, get velocity() { return velocity; },
};
mountNav();
mountFooter();
labelSplitHeadings();
initSmooth();
hydrateMedia(document);
magnetic(document);
touchLife();

/* « Plus que N places » : le nombre vient des ventes reelles de la
   boutique. Sans reponse, aucun compteur ne s'affiche — voir places.js. */
void initPlaces();
presentationAssistant();

export const BC = window.BC;
