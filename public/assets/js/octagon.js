/* =====================================================================
   RAMONVILLE · octagon.js — L'OCTOGONE EST L'INSTRUMENT (signature §2.2)

   Un octogone SVG qui :
     · SE TRACE au scroll (stroke-dashoffset, 8 arêtes en cascade)
     · se saisit et TOURNE avec inertie (drag pointer + décroissance rAF,
       sans dépendre d'InertiaPlugin ; dérive lente au repos)
     · dont les 8 ARÊTES SONT LA NAVIGATION — 8 côtés = 8 disciplines,
       chacune un vrai lien (fallback clic natif), l'aiguille éclaire la
       cible quand on la fait tourner.
   Généré depuis DISCIPLINES (data.js) : l'ordre `edge` fixe les 8 côtés.
   ===================================================================== */
import { DISCIPLINES } from "./data.js?v=9";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const NS = "http://www.w3.org/2000/svg";
const CX = 230, CY = 230, R = 150, RL = 190, RIN = 96;

/* labels courts propres à l'instrument (le nom long vit dans la fiche) */
const SHORT = {
  anglaise: "Anglaise", "pieds-poings": "P-Poings", grappling: "Grappling",
  "asso-mma": "Asso MMA", "boxing-camp": "Camp", "lady-punch": "Lady",
  ecole: "École", "acces-libre": "Libre",
};

const rad = (a) => (a * Math.PI) / 180;
const pt = (a, r) => [CX + r * Math.sin(rad(a)), CY - r * Math.cos(rad(a))];
const el = (n, attrs = {}) => { const e = document.createElementNS(NS, n); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

export function mountOctagon(host) {
  if (!host) return;
  const edges = [...DISCIPLINES].sort((a, b) => a.edge - b.edge).slice(0, 8);

  const svg = el("svg", { viewBox: "0 0 460 460", role: "group", "aria-label": "Octogone de navigation — les 8 disciplines" });

  /* --- couche tournante : octogone filaire + rayons + aiguille --- */
  const spin = el("g", { class: "octa__spin" });
  // octogone intérieur (décor tournant)
  let dInner = "";
  for (let j = 0; j < 8; j++) { const [x, y] = pt(-22.5 + j * 45, RIN); dInner += (j ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " "; }
  dInner += "Z";
  spin.appendChild(el("path", { class: "octa__hub", d: dInner }));
  // rayons vers les 8 sommets
  for (let j = 0; j < 8; j++) { const [x, y] = pt(-22.5 + j * 45, R); spin.appendChild(el("line", { class: "octa__grid", x1: CX, y1: CY, x2: x.toFixed(1), y2: y.toFixed(1) })); }
  // aiguille (pointe en haut, dir 0)
  const needle = el("g", { class: "octa__needle" });
  needle.appendChild(el("line", { x1: CX, y1: CY, x2: CX, y2: CY - (R - 14), stroke: "var(--accent)", "stroke-width": 2 }));
  const [nx, ny] = pt(0, R - 14);
  needle.appendChild(el("circle", { cx: nx, cy: ny, r: 5, fill: "var(--accent)" }));
  needle.appendChild(el("circle", { cx: CX, cy: CY, r: 4, fill: "none", stroke: "var(--accent)", "stroke-width": 2 }));
  spin.appendChild(needle);
  svg.appendChild(spin);

  /* --- couche fixe : les 8 arêtes = la nav (liens réels + labels) --- */
  const segLen = 2 * R * Math.sin(rad(22.5));
  const groups = [];
  edges.forEach((d, j) => {
    const [x1, y1] = pt(-22.5 + j * 45, R);
    const [x2, y2] = pt(22.5 + j * 45, R);
    const [mx, my] = pt(j * 45, R);       // milieu d'arête
    const [lx, ly] = pt(j * 45, RL);      // ancre du label
    const g = el("g", { class: "octa__link", "data-i": String(j) });
    const a = el("a");
    a.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `/activites/#${d.key}`);
    a.setAttribute("href", `/activites/#${d.key}`);
    a.setAttribute("aria-label", `${d.name} — voir les créneaux`);
    // l'arête visible (se trace au scroll)
    const seg = el("line", { class: "octa__seg", x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1) });
    seg.style.strokeDasharray = segLen.toFixed(1);
    seg.style.strokeDashoffset = reduce ? "0" : segLen.toFixed(1);
    seg.style.transition = "stroke-dashoffset .9s var(--ease)";
    seg.style.transitionDelay = (j * 0.09).toFixed(2) + "s";
    // tick du milieu vers le label
    const tick = el("line", { class: "octa__grid", x1: mx.toFixed(1), y1: my.toFixed(1), x2: (mx + (lx - mx) * 0.45).toFixed(1), y2: (my + (ly - my) * 0.45).toFixed(1) });
    // label — ancré vers l'intérieur pour ne pas déborder
    const anchor = lx < CX - 6 ? "end" : lx > CX + 6 ? "start" : "middle";
    const dy = ly < CY - 6 ? "0" : ly > CY + 6 ? ".72em" : ".32em";
    const label = el("text", { class: "octa__label", x: lx.toFixed(1), y: ly.toFixed(1), "text-anchor": anchor, dy });
    label.textContent = SHORT[d.key] || d.name;
    // zone de clic épaisse invisible sur l'arête
    const hit = el("line", { class: "octa__edge", x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1) });
    a.append(seg, tick, label, hit);
    g.appendChild(a);
    svg.appendChild(g);
    groups.push({ g, seg });
    // drapeau anti-navigation quand on a tourné (drag) plutôt que cliqué
    a.addEventListener("click", (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); } });
  });

  host.classList.add("octa");
  host.appendChild(svg);

  /* ---- ÉCHELLE : rendre les unités-utilisateur en VRAIS pixels écran ----
     Le viewBox 460 est remis à l'échelle de la largeur CSS du svg : une taille
     déclarée en unités SVG N'EST PAS une taille en px. À 375px, le svg fait
     310,5px de large → facteur 0,675. Les labels, écrits `clamp(.62rem,1vw,.72rem)`
     comme s'il s'agissait de px CSS, rendaient donc ~6,7px — et le bug se
     cumulait (écran plus étroit = clamp plus bas ET échelle plus petite, ça
     rétrécit deux fois). Les arêtes-cibles, elles, faisaient ~15px au doigt
     (23px avec la règle tactile) au lieu des 44px que tout le reste du système
     respecte. On mesure l'échelle et on divise : ce qui est demandé en px
     ARRIVE en px. Sous ~360px, les labels s'effacent et la légende .oleg
     (déjà ≥44px) reste la nav primaire. */
  const LABEL_PX = 11, HIT_PX = 44;
  const vbW = 460;
  let labelsHidden = false;
  const sizeToScale = () => {
    const w = svg.getBoundingClientRect().width;
    if (!w) return;                                   // pas encore mesurable
    const scale = w / vbW;
    const hide = w < 360;
    if (hide !== labelsHidden) {
      labelsHidden = hide;
      svg.querySelectorAll(".octa__label").forEach((l) => { l.style.display = hide ? "none" : ""; });
    }
    svg.querySelectorAll(".octa__label").forEach((l) => { l.style.fontSize = (LABEL_PX / scale).toFixed(2) + "px"; });
    // cible tactile réelle : 44px à l'écran, quel que soit le viewBox
    const hit = (HIT_PX / scale).toFixed(1);
    svg.querySelectorAll(".octa__edge").forEach((e) => { e.style.strokeWidth = hit; });
  };
  sizeToScale();
  addEventListener("resize", sizeToScale, { passive: true });
  addEventListener("load", sizeToScale);
  // le svg peut mesurer 0 au boot (hero replié, onglet en fond) → on re-mesure
  // dès que la vraie largeur arrive. Sans ça, labels et cibles restent faux.
  if ("ResizeObserver" in window) new ResizeObserver(sizeToScale).observe(svg);

  const hint = document.createElement("span");
  hint.className = "octa__hint";
  hint.textContent = reduce ? "8 côtés · 8 disciplines" : "Fais-le tourner · 8 côtés = 8 disciplines";
  host.appendChild(hint);

  /* --------- tracé au scroll : révèle les 8 arêtes en cascade -------- */
  const draw = () => groups.forEach(({ seg }) => (seg.style.strokeDashoffset = "0"));
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { draw(); io.disconnect(); }
    }), { threshold: 0.01 });
    io.observe(svg);
    // dead-man du tracé : l'octogone ne reste JAMAIS invisible (loi n°1),
    // même si l'IO n'a pas déclenché (mesure 0 px au boot, onglet en fond…).
    setTimeout(draw, 1600);
  } else {
    draw();
  }

  /* ------------------- rotation : drag + inertie + dérive ----------- */
  let rot = 0, vel = 0, dragging = false, dragged = false, lastAng = 0, downX = 0, downY = 0, downT = 0;

  const angleFrom = (clientX, clientY) => {
    const r = svg.getBoundingClientRect();
    return (Math.atan2(clientY - (r.top + r.height / 2), clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  let lastHot = -1;
  const setHot = () => {
    const k = ((Math.round((((rot % 360) + 360) % 360) / 45)) % 8 + 8) % 8;
    if (k === lastHot) return;                 // n'écrit dans le DOM QUE si l'arête chaude change (perf mobile)
    lastHot = k;
    groups.forEach(({ g }, i) => g.classList.toggle("is-hot", i === k));
  };
  const apply = () => { spin.setAttribute("transform", `rotate(${rot.toFixed(2)} ${CX} ${CY})`); setHot(); };

  function onDown(e) {
    dragging = true; dragged = false; svg.setPointerCapture?.(e.pointerId);
    host.classList.add("is-dragging");
    lastAng = angleFrom(e.clientX, e.clientY); vel = 0;
    downX = e.clientX; downY = e.clientY; downT = performance.now();
  }
  function onMove(e) {
    if (!dragging) return;
    const a = angleFrom(e.clientX, e.clientY);
    let dA = a - lastAng;
    if (dA > 180) dA -= 360; else if (dA < -180) dA += 360;
    rot += dA; vel = dA; lastAng = a;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) dragged = true;
    apply();
  }
  function onUp() {
    if (!dragging) return;
    dragging = false; host.classList.remove("is-dragging");
  }
  if (!reduce) {
    svg.addEventListener("pointerdown", onDown, { passive: true });
    svg.addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerup", onUp, { passive: true });
    addEventListener("pointercancel", onUp, { passive: true });

    let raf = 0, running = false, inView = true;
    const frame = () => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (!dragging) {
        if (Math.abs(vel) > 0.02) { rot += vel; vel *= 0.94; apply(); }   // inertie
        else { rot += 0.03; apply(); }                                     // dérive lente (de la vie)
      }
    };
    const startLoop = () => { if (running || document.hidden || !inView) return; running = true; raf = requestAnimationFrame(frame); };
    const stopLoop = () => { running = false; cancelAnimationFrame(raf); };
    startLoop();
    // stoppe le rAF quand l'onglet dort (perf batterie)
    document.addEventListener("visibilitychange", () => { document.hidden ? stopLoop() : startLoop(); });
    // …et quand l'octogone quitte l'écran : la dérive décorative ne coûte rien hors-vue
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => es.forEach((e) => {
        inView = e.isIntersecting; inView ? startLoop() : stopLoop();
      }), { threshold: 0 }).observe(host);
    }
  }
  apply();
}

/* auto-mount si un hôte #octa est présent */
const host = document.getElementById("octa");
if (host) mountOctagon(host);
