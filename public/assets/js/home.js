/* =====================================================================
   RAMONVILLE · home.js — l'arrivée sous le ciel

   Rend depuis data.js : les chiffres du plateau (compteurs), le ticker,
   la bande staff (visages prouvés, tuiles nom sinon), la légende des 8
   arêtes. La caption du hero lit le VRAI ciel (window.__SKY : heure +
   température) — carnet de terrain. L'octogone est monté par octagon.js.
   ===================================================================== */
import { STATS, DISCIPLINES, COACHES, SALLE } from "./data.js?v=6";
import "./octagon.js?v=6"; // effet de bord : auto-monte l'octogone interactif du hero (#octa)

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const nf = new Intl.NumberFormat("fr-FR");

/* --------------------------- RENDER ------------------------------- */
function renderStats() {
  const box = $("#stats"); if (!box) return;
  box.innerHTML = STATS.map(
    (s) => `<div class="stat">
      <div class="stat__v"><span data-count="${s.v}" ${s.raw ? "data-raw" : ""}>${s.raw ? s.v : 0}</span>${s.suffix ? `<sup>${s.suffix.trim()}</sup>` : ""}</div>
      <div class="stat__l">${s.l}</div>
    </div>`
  ).join("");
}

function renderTicker() {
  const t = $("#marquee"); if (!t) return;
  const items = ["300 m² dehors", "Octogone 7 m", "Ring olympique", "Anglaise", "Pieds-poings", "Grappling", "Asso MMA", "Boxing Camp", "Lady Punch", "Dès 3 ans", "Accès libre 6 j/7", "Métro B · Ramonville"];
  const row = items.map((i) => `<span>${i}</span>`).join("");
  t.innerHTML = row + row; t.dataset.speed = "0.55";
}

/* la bande staff — 4 vrais visages si prouvés, tuiles nom sinon (jamais stock) */
function renderStaff() {
  const box = $("#staff"); if (!box) return;
  box.innerHTML = COACHES.map((c) => {
    const face = c.img
      ? `<div class="media staff__face" data-img="${c.img}" data-label="" data-alt="${c.name} — coach à Boxing Center Ramonville"></div>`
      : `<div class="staff__face staff__face--tile" aria-hidden="true"><span>${c.name.split(" ").map((w) => w[0]).join("")}</span></div>`;
    return `<a class="staff__card ${c.pillar ? "is-pillar" : ""}" href="/coachs/">
      ${face}
      <div class="staff__meta">
        <b>${c.name}</b>
        <span class="mono">${c.role}</span>
        <i>${c.tag}</i>
      </div>
    </a>`;
  }).join("");
}

/* la légende des 8 arêtes — accessible, cliquable, à côté de l'instrument */
function renderOctaLegend() {
  const box = $("#octa-legend"); if (!box) return;
  box.innerHTML = [...DISCIPLINES].sort((a, b) => a.edge - b.edge).map(
    (d, i) => `<a class="oleg" href="/activites/#${d.key}">
      <span class="oleg__n">${String(i + 1).padStart(2, "0")}</span>
      <span class="oleg__name">${d.name}</span>
      <span class="oleg__tag">${d.tag}</span>
    </a>`
  ).join("");
}

/* ------------------------- CHOREOGRAPHY --------------------------- */
/* compteurs — AUTO-PORTANTS (sans dépendre de gsap/ScrollTrigger) :
   IntersectionObserver + rAF, plus un dead-man (loi n°1) qui POSE la vraie
   valeur même si l'IO ne déclenche jamais (strip à cheval sur le fold au boot,
   onglet en fond) ou si le rAF gèle. Le différenciateur ne rend JAMAIS « 0 m² ».
   Même patron que le rail de /la-salle/ — appliqué ici, la page la plus vue. */
function countUp() {
  const els = [...document.querySelectorAll("[data-count]")].filter((e) => !e.hasAttribute("data-raw"));
  if (!els.length) return;
  const run = (el) => {
    if (el.dataset.counting) return; el.dataset.counting = "1";
    const end = +el.dataset.count;
    if (reduce || !window.requestAnimationFrame) { el.textContent = nf.format(end); return; }
    const dur = 1400; let t0 = null;
    const step = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min(1, (ts - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = nf.format(Math.round(end * eased));
      if (p < 1) requestAnimationFrame(step); else el.textContent = nf.format(end);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    }), { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
    // dead-man : jamais un chiffre bloqué à 0 — on écrit la vraie valeur de force.
    setTimeout(() => els.forEach((el) => {
      if (el.textContent.replace(/\D/g, "") !== el.dataset.count) { io.unobserve(el); el.textContent = nf.format(+el.dataset.count); }
    }), 1800);
  } else {
    els.forEach(run);
  }
}

/* caption documentaire du hero : heure + température RÉELLES (carnet de terrain).
   « 21h42 · plateau extérieur · 14°C » — l'heure/température viennent du ciel. */
function heroCaption() {
  const cap = $("#hero-cap"); if (!cap) return;
  const paint = () => {
    const now = new Date();
    // l'heure vient du ciel (sky.js → Open-Meteo, fuseau de la salle) : cette
    // caption est un relevé de terrain AU-DESSUS DE RAMONVILLE, pas l'horloge
    // du visiteur. Repli sur l'horloge locale tant que le réseau n'a pas répondu.
    const hh = String(window.__SKY?.hour ?? now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const temp = window.__SKY && window.__SKY.tempC != null ? ` · ${window.__SKY.tempC}°C` : "";
    const txt = `${hh}h${mm} · plateau extérieur${temp}`;
    cap.dataset.text = txt;
    if (window.BC && window.BC.scramble && !reduce) window.BC.scramble(cap, { dur: 800 });
    else cap.textContent = txt;
  };
  paint();
  window.addEventListener("sky:change", paint);
  setInterval(paint, 60 * 1000);
}

/* le claim « 300 m² dehors » porte les conditions RÉELLES au-dessus de la salle.
   Le fond de cette section est le vrai ciel (sky.js) et non une photo : les 6
   clichés prouvés sont tous intérieurs. Ce chip est la preuve que le ciel de la
   page est une donnée — il se réécrit quand Open-Meteo répond. */
const SKY_FR = { clair: "Ciel dégagé", voile: "Ciel voilé", pluie: "Pluie", orage: "Orage" };
function claimLive() {
  const box = $("#claim-live"); if (!box) return;
  const paint = () => {
    const s = window.__SKY || {};
    const sky = SKY_FR[s.sky] || "Nuit claire";
    const temp = s.tempC != null ? ` · <b>${s.tempC}°C</b>` : "";
    const h = typeof s.hour === "number" ? String(s.hour).padStart(2, "0") + "h" : "";
    box.innerHTML = `Au-dessus de la salle, maintenant : <b>${sky}</b>${temp}${h ? " · " + h : ""}`;
  };
  paint();
  window.addEventListener("sky:change", paint);
}

/* ------------------------------ BOOT ------------------------------ */
function boot() {
  renderStats(); renderTicker(); renderStaff(); renderOctaLegend(); claimLive();
  // l'octogone interactif du hero s'auto-monte (#octa via octagon.js). La
  // section octogone-nav ne répète PAS l'instrument : elle porte un octogone
  // filaire réduit (statique, brief §2.2) + la légende cliquable des 8 côtés.

  window.BC.media(document);
  window.BC.reveal(document);
  window.BC.magnetic(document);
  window.BC.touchLife(".staff__card, .oleg, .card, .tarif");
  countUp();
  heroCaption();

  const start = () => { window.BC.refresh(); window.BC.initKinetics(); };
  window.addEventListener("load", start);
  setTimeout(start, 500);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
