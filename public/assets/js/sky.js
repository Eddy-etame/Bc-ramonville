/* =====================================================================
   RAMONVILLE · sky.js — LE CIEL EST VRAI (signature §2.1)

   « À ciel ouvert » devient une condition d’exécution : le dégradé de nuit
   des heros est synchronisé sur la météo et l’heure RÉELLES de Ramonville.
     · Open-Meteo (gratuit, sans clé) — lat 43.546 / lon 1.474
     · pose data-sky="clair|voile|pluie|orage" + data-hour + data-daypart
       sur <html> → états CSS (gradients, brume) définis dans base.css
     · starfield canvas-2D dont la densité suit la météo, brume/pluie en
       parallaxe lente
     · Fallback offline : NUIT CLAIRE (aucune donnée réseau requise)
   window.__SKY = { sky, hour, tempC } — lu par les captions horodatées.
   ===================================================================== */

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const LAT = 43.546, LON = 1.474;
const root = document.documentElement;
/* écart horloge visiteur → horloge Ramonville (0 tant que le réseau n’a pas
   répondu : le repli est l’horloge locale). Déclaré ici, avant tout closure
   qui le lit, pour ne pas dépendre de la TDZ. */
let skewMs = 0;
let ramonvilleHour = null;

/* état par défaut = nuit claire (le fallback vit ici, pas dans le réseau) */
window.__SKY = { sky: "clair", hour: new Date().getHours(), tempC: null };
/* L’HEURE DE LA SALLE, exposée : tout ce qui prétend dire « maintenant, à
   Ramonville » (caption du hero, créneau en cours du planning) doit lire ÇA et
   non l’horloge du visiteur. Avant réponse réseau, `skewMs` vaut 0 → horloge
   locale, ce qui est le bon repli. */
window.__SKY.now = () => new Date(Date.now() + skewMs);

/* --- heure locale → moment du jour (la nuit domine, l’horizon change) --- */
function daypartFor(h) {
  if (h >= 22 || h < 6) return "nuit";
  if (h < 9) return "aube";
  if (h < 19) return "jour";
  return "crepuscule";
}
/* L’heure de RAMONVILLE, pas celle du visiteur. Open-Meteo est déjà appelé avec
   `timezone=auto` et renvoie `current.time` à l’heure locale de la salle : on
   la lisait jamais et on posait `new Date().getHours()` (fuseau du client).
   Un visiteur hors CET voyait donc le mauvais état de ciel, le mauvais moment
   du jour — la moitié « heure » de la signature n’était pas réelle.
   `ramonvilleHour` fait foi dès que le réseau répond ; l’horloge locale ne
   sert plus que d’amorce avant réponse et de repli hors-ligne. */
function applyHour(h) {
  const hour = (typeof h === "number" && h >= 0 && h <= 23) ? h : new Date().getHours();
  root.setAttribute("data-hour", String(hour));
  root.setAttribute("data-daypart", daypartFor(hour));
  window.__SKY.hour = hour;
}
/* le tick d’une minute : suit Ramonville si on la connaît, sinon l’horloge locale */
function tickHour() {
  if (ramonvilleHour == null) return applyHour();
  applyHour(new Date(Date.now() + skewMs).getHours());
}

/* --- code météo WMO (Open-Meteo) → état de ciel --- */
function skyFor(code) {
  if (code == null) return "clair";
  if ([95, 96, 99].includes(code)) return "orage";
  if ((code >= 51 && code <= 67) || (code >= 71 && code <= 82)) return "pluie";
  if ([45, 48].includes(code) || (code >= 1 && code <= 3)) return "voile";
  return "clair"; // 0 = ciel dégagé
}
function applySky(sky) {
  root.setAttribute("data-sky", sky);
  window.__SKY.sky = sky;
  window.dispatchEvent(new CustomEvent("sky:change", { detail: window.__SKY }));
}

/* --- météo réelle, avec garde-fou : jamais bloquer, jamais planter --- */
async function fetchWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&current=weather_code,is_day,temperature_2m&timezone=auto`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 4500);
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(to);
    if (!r.ok) throw new Error("http " + r.status);
    const j = await r.json();
    const cur = j.current || {};
    window.__SKY.tempC = typeof cur.temperature_2m === "number" ? Math.round(cur.temperature_2m) : null;
    // l’heure de Ramonville voyage dans la même réponse — on la prend
    const m = typeof cur.time === "string" && cur.time.match(/T(\d{2}):(\d{2})/);
    if (m) {
      ramonvilleHour = +m[1];
      const local = new Date();
      // écart visiteur→salle, arrondi à l’heure : garde le tick juste ensuite
      skewMs = (ramonvilleHour - local.getHours()) * 3600e3 + (+m[2] - local.getMinutes()) * 60e3;
      applyHour(ramonvilleHour);
    }
    applySky(skyFor(cur.weather_code));
  } catch (_) {
    clearTimeout(to);
    applySky("clair"); // fallback offline : nuit claire
  }
}

/* ======================= STARFIELD CANVAS ======================== *
   Un canvas 2D par bloc .sky. Densité selon la météo : clair = ciel plein,
   voile = clairsemé, pluie/orage = pas d’étoiles + stries de pluie. Brume
   et étoiles dérivent lentement (parallaxe au scroll) — sobre, nocturne. */
function densityFor(sky) {
  // voile relevé (0.42 → 0.6) : la « nuit dehors » reste lisible comme signature
  // même aux heures de bureau (jour + voile), pas un bleu-nuit quasi vide.
  return ({ clair: 1, voile: 0.6, pluie: 0, orage: 0 })[sky] ?? 1;
}
function isRain(sky) { return sky === "pluie" || sky === "orage"; }

function mountStarfield(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let stars = [], drops = [], raf = 0, t = 0, parY = 0;
  let running = false, inView = true;

  function seed() {
    const sky = window.__SKY.sky;
    const area = (W * H) / (dpr * dpr);
    const n = Math.round((area / 9000) * densityFor(sky));
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: (Math.random() * 1.3 + 0.3) * dpr,
      a: Math.random() * 0.6 + 0.25,
      tw: Math.random() * Math.PI * 2, sp: Math.random() * 0.9 + 0.3,
    }));
    drops = isRain(sky)
      ? Array.from({ length: Math.round((W * H) / (dpr * dpr) / 5200) }, () => ({
          x: Math.random() * W, y: Math.random() * H,
          l: (Math.random() * 14 + 8) * dpr, v: (Math.random() * 6 + 7) * dpr,
        }))
      : [];
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    H = canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    seed();
    paint(); // écrire canvas.width a vidé le bitmap : on le repeint TOUJOURS
  }
  /* accent (acier lune / cuivre — couleurs marque) lu du thème pour teinter les étoiles */
  function accent() {
    return getComputedStyle(root).getPropertyValue("--accent").trim() || "#9fb6d9";
  }

  /* PEINDRE et ORDONNANCER sont deux choses distinctes. Avant, tout vivait dans
     frame() qui se sabordait en reduced-motion (`cancelAnimationFrame` après
     UNE frame) : or chaque ré-ensemencement écrit canvas.width, ce qui (par
     spec HTML) REMET LE BITMAP À TRANSPARENT — et plus personne ne repeignait.
     Le ResizeObserver livrant toujours une observation initiale, il effaçait
     l’unique frame juste après. Résultat : ciel étoilé VIDE pour tout visiteur
     en reduced-motion, sur les 8 pages — la signature n°1, éteinte, par le
     dead-man censé la protéger. Désormais : tout effacement est suivi d’un
     paint(). */
  function paint() {
    ctx.clearRect(0, 0, W, H);
    const col = accent();
    // étoiles — scintillement doux + dérive parallaxe très lente
    for (const s of stars) {
      const a = s.a * (0.6 + 0.4 * Math.sin(t * s.sp + s.tw));
      const y = (s.y + parY * 0.04) % H;
      ctx.beginPath();
      ctx.arc(s.x, y < 0 ? y + H : y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,235,244,${a.toFixed(3)})`;
      ctx.fill();
      if (s.r > 1.1 * dpr) { // les plus grosses prennent la teinte du ciel
        ctx.beginPath(); ctx.arc(s.x, y < 0 ? y + H : y, s.r * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = col.startsWith("#")
          ? hexA(col, a * 0.10) : `rgba(159,182,217,${(a * 0.1).toFixed(3)})`;
        ctx.fill();
      }
    }
    // pluie / orage
    if (drops.length) {
      ctx.strokeStyle = "rgba(200,210,230,.22)"; ctx.lineWidth = dpr;
      for (const d of drops) {
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * 0.25, d.y + d.l); ctx.stroke();
        d.y += d.v; d.x -= d.v * 0.25;
        if (d.y > H) { d.y = -d.l; d.x = Math.random() * W; }
      }
    }
  }
  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    t += 0.016;
    paint();
  }
  function hexA(hex, a) {
    const n = hex.replace("#", "");
    const v = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
    const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16), b = parseInt(v.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  }

  /* rAF borné — même patron que octagon.js (qui l’avait, lui) : on ne repeint
     pas 2 canvas plein écran à 60 fps quand le hero est à trois écrans de là
     ou l’onglet en fond. Sur /tarifs/ ou /contact/ le hero quitte la vue
     immédiatement et les deux canvas tournaient toute la session. */
  const startLoop = () => {
    if (reduce) { paint(); return; }          // reduced-motion : une frame, mais PEINTE
    if (running || document.hidden || !inView) return;
    running = true; raf = requestAnimationFrame(frame);
  };
  const stopLoop = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  addEventListener("resize", () => { dpr = Math.min(window.devicePixelRatio || 1, 2); resize(); }, { passive: true });
  addEventListener("load", resize);
  // le canvas peut être mesuré avant que le layout ne soit stabilisé (buffer
  // 1px) → un ResizeObserver ré-ensemence dès que la vraie taille arrive.
  // resize() repeint : ce dead-man ne peut plus laisser un ciel vide.
  if ("ResizeObserver" in window) new ResizeObserver(() => resize()).observe(canvas);
  addEventListener("scroll", () => { parY = window.scrollY; }, { passive: true });
  // la météo arrive TOUJOURS après le boot : sans repaint, un visiteur en
  // reduced-motion ne voyait jamais la densité pilotée par le ciel réel.
  window.addEventListener("sky:change", () => { seed(); paint(); });
  window.addEventListener("bc:palette", () => { paint(); }); // teinte relue au paint
  document.addEventListener("visibilitychange", () => { document.hidden ? stopLoop() : startLoop(); });
  if ("IntersectionObserver" in window) {
    const host = canvas.closest(".sky") || canvas;
    new IntersectionObserver((es) => es.forEach((e) => {
      inView = e.isIntersecting; inView ? startLoop() : stopLoop();
    }), { threshold: 0 }).observe(host);
  }
  startLoop();
}

/* ------------------------------ BOOT ------------------------------ */
/* Hydratation des ciels INJECTÉS après le boot. Les cadres vivants du
   différenciateur (station « L’extérieur couvert », relevé du dehors,
   carnet) sont rendus par page.js, donc APRÈS ce module : leurs canvas
   n’existaient pas quand boot() a balayé le document, et ils restaient
   noirs — un ciel réel qui ne se lève que sur les heros écrits en dur.
   `mounted` garde l’idempotence : un même canvas n’est jamais monté deux
   fois, quel que soit le nombre d’appels. */
const mounted = new WeakSet();
function mountSkies(scope = document) {
  scope.querySelectorAll(".sky__stars").forEach((c) => {
    if (mounted.has(c)) return;
    mounted.add(c);
    mountStarfield(c);
  });
}
window.__SKY.mount = mountSkies;

function boot() {
  applyHour();                     // amorce : horloge locale, remplacée dès la réponse
  setInterval(tickHour, 60 * 1000); // l’heure avance avec celle de Ramonville
  // le starfield démarre tout de suite (fallback), la météo l’ajuste après
  mountSkies(document);
  fetchWeather();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
