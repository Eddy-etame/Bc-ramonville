/* =====================================================================
   RAMONVILLE · site.js — chrome + moteur de motion (édition nuit)
   window.BC = { reveal, magnetic, refresh, media, split, scramble, lenis }

   Même moteur éprouvé que les salles sœurs (lenis · reveal + dead-man ·
   magnetic · media hydrate · marquee · scramble), RE-SKINNÉ pour le
   plateau : chrome anguleux, footer « fiche de terrain », et la bascule
   bi-palette (Acier lune ⇄ Cuivre) montée dans la nav, no-flash.
   Aucun chrome copié de Saint-Cyprien.
   ===================================================================== */
import { NAV, LINKS, SALLE, SEASON_LABEL } from "./data.js?v=8";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
if (!gsap) document.documentElement.classList.remove("fx");

let lenis = null;
let velocity = 0;

/* --------------------------- PALETTE ------------------------------ *
   Bascule Acier lune ⇄ Cuivre — deux métaux 100 % Boxing Center (argent
   marque / cuivre brûlé du logo). localStorage bc-ram-palette. Le no-flash
   (lecture avant paint) est fait par un petit script inline dans chaque
   <head> ; ici on ne gère que le toggle runtime. */
const PAL_KEY = "bc-ram-palette";
function currentPalette() { return document.documentElement.getAttribute("data-palette") === "cuivre" ? "cuivre" : "acier"; }
function setPalette(p) {
  if (p === "cuivre") document.documentElement.setAttribute("data-palette", "cuivre");
  else document.documentElement.removeAttribute("data-palette");   // "acier" = défaut :root
  try { localStorage.setItem(PAL_KEY, p); } catch (_) {}
  const btn = document.getElementById("pal");
  if (btn) {
    btn.querySelector(".pal__txt").textContent = p === "cuivre" ? "Cuivre" : "Acier";
    btn.setAttribute("aria-pressed", String(p === "cuivre")); // AT : état de la palette
  }
  /* sky.js écoutait `bc:palette` pour re-teinter les étoiles… et PERSONNE ne
     l'émettait : un abonné mort depuis l'origine. Sans motion réduite ça ne se
     voyait pas (le canvas repeint à chaque frame et relit --accent au passage),
     mais en `prefers-reduced-motion` le ciel n'est peint QU'UNE FOIS : basculer
     Acier ⇄ Cuivre laissait alors les étoiles à l'ancien métal, définitivement.
     La bascule est censée tout re-teinter — elle le fait maintenant partout. */
  window.dispatchEvent(new CustomEvent("bc:palette", { detail: { palette: p } }));
}

/* ----------------------------- NAV / MENU ------------------------- */
function currentPath() {
  let p = location.pathname.replace(/index\.html$/, "");
  if (!p.endsWith("/")) p += "/";
  return p;
}
function mountNav() {
  const path = currentPath();
  const links = NAV.map(
    (n) => `<a href="${n.href}"${n.href === path ? ' aria-current="page"' : ""}>${n.label}</a>`
  ).join("");
  const pal = currentPalette();
  document.getElementById("nav").innerHTML = `
    <nav class="nav" id="site-nav">
      <a class="nav__brand" href="/" aria-label="Boxing Center Ramonville — accueil">
        <!-- alt="" : le lien parent porte déjà aria-label="Boxing Center
             Ramonville — accueil", qui EST le nom accessible. Un alt en plus ne
             se lit jamais et ne sort qu'en doublon dans les audits. -->
        <img class="nav__logo" src="/assets/img/logo-white.png" alt="" width="3542" height="1655" />
        <span class="nav__salle">Ramonville</span>
      </a>
      <div class="nav__links">${links}</div>
      <div class="nav__right">
        <button class="pal" id="pal" type="button" aria-label="Basculer la palette de couleurs (Acier lune / Cuivre)" aria-pressed="${pal === "cuivre"}">
          <span class="pal__dot" aria-hidden="true"></span><span class="pal__txt">${pal === "cuivre" ? "Cuivre" : "Acier"}</span>
        </button>
        <a class="btn btn--primary nav__cta" data-magnetic href="${LINKS.essai}"><span>Essai · 10€</span></a>
        <button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
      </div>
    </nav>`;

  const menuLinks = NAV.map(
    (n, i) => `<a class="menu__link" href="${n.href}"><span class="n">${String(i + 1).padStart(2, "0")}</span>${n.label}</a>`
  ).join("");
  document.getElementById("drawer").innerHTML = `
    <div class="menu" id="menu" aria-hidden="true">
      <div class="menu__top">
        <a class="nav__brand" href="/" aria-label="Boxing Center Ramonville — accueil">
          <!-- alt="" : le lien parent porte déjà aria-label="Boxing Center
             Ramonville — accueil", qui EST le nom accessible. Un alt en plus ne
             se lit jamais et ne sort qu'en doublon dans les audits. -->
        <img class="nav__logo" src="/assets/img/logo-white.png" alt="" width="3542" height="1655" />
          <span class="nav__salle">Ramonville</span>
        </a>
        <button class="menu__close" id="menu-close">Fermer <span aria-hidden="true">✕</span></button>
      </div>
      <nav class="menu__nav">${menuLinks}</nav>
      <div class="menu__foot">
        <a class="btn btn--primary" data-magnetic href="${LINKS.essai}"><span>Réserver l'essai · 10€</span></a>
        <div style="display:flex;gap:1.4rem;flex-wrap:wrap">
          <a href="${LINKS.boutique}" target="_blank" rel="noopener">Boutique ↗</a>
          <a href="${LINKS.instagram}" target="_blank" rel="noopener">Instagram ↗</a>
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
    // gestion du focus : entre dans le menu à l'ouverture, revient au burger à la fermeture
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

  document.getElementById("pal").addEventListener("click", () => setPalette(currentPalette() === "cuivre" ? "acier" : "cuivre"));

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
  const cols = [
    { h: "Le plateau", links: NAV.slice(1, 6) },
    { h: "Le réseau", links: [
      { href: LINKS.groupe, label: "Boxing Center ↗" },
      { href: "https://www.boxing-center-portet.fr/", label: "Portet ↗" },
      { href: LINKS.instagram, label: "Instagram ↗" },
      { href: LINKS.facebook, label: "Facebook ↗" },
    ] },
  ];
  const fields = [
    { k: "Établissement", v: "Boxing Center — Ramonville", wide: true },
    { k: "Le signe", v: "Octogone 7 m · 300 m² extérieur couvert" },
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
            <span class="eyebrow">Le plateau t'attend</span>
            <h2 class="display footer__cut" aria-label="Même le plafond est une excuse en moins.">Même le plafond<br><span class="tint">est une excuse en moins.</span></h2>
          </div>
          <a class="btn btn--primary" data-magnetic href="${LINKS.essai}"><span>Réserver l'essai · 10€</span></a>
        </div>
        <div class="fiche" aria-label="Fiche de la salle">
          ${fields.map((f) => `<div class="fiche__cell${f.wide ? " fiche__cell--wide" : ""}"><span class="fk">${f.k}</span><span class="fv">${f.v}</span></div>`).join("")}
        </div>
        <div class="footer__links">
          ${cols.map((c) => `<div class="footer__col"><h4>${c.h}</h4>${c.links.map((l) => `<a href="${l.href}">${l.label}</a>`).join("")}</div>`).join("")}
          <div class="footer__col">
            <h4>Suivre</h4>
            <a href="${LINKS.instagram}" target="_blank" rel="noopener">Instagram ↗</a>
            <a href="${LINKS.facebook}" target="_blank" rel="noopener">Facebook ↗</a>
            <a href="${LINKS.boutique}" target="_blank" rel="noopener">Boutique ↗</a>
          </div>
        </div>
        <div class="footer__bottom">
          <span>© ${new Date().getFullYear()} Boxing Center Ramonville.</span>
          <span class="footer__stamp">${SEASON_LABEL} · sous le ciel de Ramonville</span>
        </div>
      </div>
    </footer>`;
}

/* ------------------------------ LENIS ----------------------------- */
function initSmooth() {
  if (reduce || !window.Lenis) return;
  lenis = new window.Lenis({ duration: 1.05, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  lenis.on("scroll", (e) => { velocity = e.velocity; ScrollTrigger?.update(); });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ----------------------------- MAGNETIC --------------------------- */
function magnetic(scope = document) {
  if (reduce || window.matchMedia("(hover: none)").matches) return;
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
  /* DEAD-MAN (loi n°1) — le seul effet rAF du moteur qui n'en avait pas, alors
     que countUp, le rail de /la-salle/ et le tracé de l'octogone en ont tous un.
     Un scramble gelé (onglet ouvert en fond, rAF étranglé) laisse la caption
     figée sur des GLYPHES ALÉATOIRES : le texte le plus documentaire du site
     rendu en charabia. Passé le double de sa durée, on POSE le texte final. */
  setTimeout(settle, dur * 2 + 400);
}

/* ----------------------------- REVEAL ----------------------------- */
function reveal(scope = document) {
  if (reduce) { document.documentElement.classList.remove("fx"); return; }
  scope.querySelectorAll(".reveal-mask").forEach((m) => {
    const kids = [...m.children];
    if (m.dataset.revBound || !kids.length) return; m.dataset.revBound = "1";
    gsap.set(kids, { yPercent: 112, opacity: 0 });
    gsap.to(kids, { yPercent: 0, opacity: 1, duration: 1, ease: "power4.out", stagger: 0.08, scrollTrigger: { trigger: m, start: "top 90%" } });
  });
  scope.querySelectorAll("[data-reveal]").forEach((el) => {
    if (el.dataset.revBound) return; el.dataset.revBound = "1";
    gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%" } });
  });
  scope.querySelectorAll("[data-reveal-group]").forEach((g) => {
    const kids = [...g.children];
    if (g.dataset.revBound || !kids.length) return; g.dataset.revBound = "1";
    gsap.set(kids, { opacity: 0, y: 30 });
    gsap.to(kids, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.07, scrollTrigger: { trigger: g, start: "top 88%" } });
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
    img.src = el.dataset.img;
    img.alt = el.dataset.alt || el.dataset.label || "";
    img.loading = el.hasAttribute("data-eager") ? "eager" : "lazy"; img.decoding = "async";
    if (el.dataset.w) img.width = el.dataset.w;
    if (el.dataset.h) img.height = el.dataset.h;
    el.prepend(img);
  });
}

/* --------------------- VELOCITY: ticker drift --------------------- */
let kineticsOn = false;
function initKinetics() {
  if (reduce || kineticsOn) return; kineticsOn = true;
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
   accessible SANS espace au raccord — « L'octogoneà ciel ouvert. », « Le tourdu
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

/* ------------------------------ BOOT ------------------------------ */
window.BC = {
  reveal, magnetic, refresh, media: hydrateMedia, split, scramble, initKinetics, touchLife,
  setPalette, get lenis() { return lenis; }, get velocity() { return velocity; },
};
mountNav();
mountFooter();
labelSplitHeadings();
initSmooth();
hydrateMedia(document);
magnetic(document);
touchLife();

export const BC = window.BC;
