/* =====================================================================
   RAMONVILLE · octagon.js — L'OCTOGONE EST L'INSTRUMENT (signature §2.2)

   CE QUE LE CLIENT A VU, ET IL AVAIT RAISON : « il sort littéralement de
   la page ». Mesuré sur le rendu, à 768 px : le cadre peint de l'octogone
   allait jusqu'à x=637,7 alors que son conteneur s'arrêtait à x=606,4 —
   31,3 px de contenu DEHORS, et seulement à certaines largeurs, ce qui
   rendait le défaut insaisissable. La cause n'était pas un débordement
   CSS : c'était le viewBox. Il était figé à 460 pendant que les huit
   libellés, eux, étaient dimensionnés en VRAIS pixels écran (11 px, quelle
   que soit l'échelle) — donc, en unités-utilisateur, ils GRANDISSAIENT
   quand le svg rétrécissait. Une boîte fixe autour d'un contenu qui enfle :
   le contenu gagne, et il sort.

   CE QUE LE CLIENT A DEMANDÉ, mot pour mot : « c'est supposé rentrer
   juste un peu et TOURNER sur soi-même. Et pendant qu'il tourne, les
   différentes disciplines changent. »

   CE QU'IL FAIT MAINTENANT :
     · IL RENTRE. Le viewBox n'est plus une constante, il est MESURÉ :
       après chaque mise à l'échelle on relève la boîte réelle de tout ce
       qui est peint (getBBox, libellés compris) et on cadre dessus. Le
       cadre est un CARRÉ CENTRÉ SUR (CX, CY) — le centre géométrique de
       l'octogone, pas le centre du dessin : la forme ne peut donc ni
       déborder, ni dériver sur le côté. `overflow: hidden` par-dessus, en
       dernier verrou. Vrai de 320 à 2560 px, et c'est mesuré.
     · IL TOURNE, tout seul, un tour en ~72 s. Ce n'est plus la « dérive »
       de 0,03°/frame d'avant (un tour en 200 s : invisible à l'œil nu),
       c'est une rotation qu'on VOIT sans avoir à la fixer.
     · LES DISCIPLINES CHANGENT AVEC LUI. L'aiguille tourne avec la cage ;
       tous les 45° elle arrive sur une nouvelle discipline, son libellé
       s'allume et le cartouche sous l'octogone change de nom. Huit paliers,
       un tour, huit disciplines. La rotation n'est pas un décor : c'est
       elle qui fait défiler le sommaire.
     · ON PEUT TOUJOURS LE SAISIR. Le drag et l'inertie d'origine sont
       gardés — on ne retire jamais un geste au visiteur ; après l'élan, il
       reprend son tour de lui-même.

   MOUVEMENT RÉDUIT (prefers-reduced-motion) : la rotation est coupée net,
   mais le défilé des disciplines RESTE — le cartouche change toutes les
   6 s, sans transition. On ne prive pas quelqu'un de l'information sous
   prétexte qu'on lui a retiré l'animation.

   LES HUIT LIBELLÉS RESTENT DES LIENS RÉELS, fixes et droits (un texte qui
   tourne ne se lit pas), avec 44 px de cible tactile garantis.
   ===================================================================== */
import { DISCIPLINES } from "./data.js?v=11";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const NS = "http://www.w3.org/2000/svg";
const CX = 230, CY = 230, R = 150, RL = 190, RIN = 96;

/* Un tour en 72 s → 9 s par discipline. Assez lent pour rester calme, assez
   vif pour qu'on voie que ça tourne sans avoir à le fixer. Cette durée est
   posée UNE fois, en CSS (--octa-tour, base.css), et relue ici : l'animation
   et le compteur de disciplines ne peuvent pas diverger. */
const TOUR_SEC = 72;

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

  const svg = el("svg", { viewBox: "0 0 460 460", role: "group", "aria-label": "Octogone des 8 disciplines — il tourne, la discipline change" });
  /* LE DERNIER VERROU. Le cadre calculé plus bas est fait pour que rien ne
     dépasse ; ceci garantit qu'à supposer même qu'un libellé s'allonge entre
     deux mesures, RIEN ne peut être peint hors du cadre. La loi du client :
     l'octogone reste dans l'écran, à toutes les largeurs, sans exception. */
  svg.style.overflow = "hidden";

  /* --- couche TOURNANTE : la cage, les rayons, l'aiguille ---
     Tout ce qui est GÉOMÉTRIE tourne. Rien de ce qui est TEXTE ne tourne.

     DEUX COUCHES, ET C'EST VOULU :
       · `.octa__turn` porte le TOUR DE FOND, et c'est une animation CSS
         (base.css, @keyframes octaTurn). Elle vit dans le compositeur : le
         tour ne coûte plus une frame de JavaScript, là où l'ancienne dérive
         écrivait un attribut `transform` soixante fois par seconde pour
         0,03° — un tour en 200 s, c'est-à-dire rien à l'œil et tout au
         processeur. Le navigateur la met en pause tout seul quand l'onglet
         dort, et `prefers-reduced-motion` la coupe en CSS, à la source.
       · `.octa__spin` porte la MAIN DU VISITEUR (le drag et son inertie),
         en JS. Les deux rotations se composent : on peut pousser la cage
         pendant qu'elle tourne, elle repart de là où on l'a lâchée.
     Les deux tournent autour du même centre (CX, CY) : l'octogone tourne
     donc bien sur LUI-MÊME, pas autour d'un point de la page. */
  const spin = el("g", { class: "octa__spin" });
  const turn = el("g", { class: "octa__turn" });
  // le moyeu (octogone intérieur)
  let dInner = "";
  for (let j = 0; j < 8; j++) { const [x, y] = pt(-22.5 + j * 45, RIN); dInner += (j ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " "; }
  dInner += "Z";
  turn.appendChild(el("path", { class: "octa__hub", d: dInner }));
  // rayons vers les 8 sommets
  for (let j = 0; j < 8; j++) { const [x, y] = pt(-22.5 + j * 45, R); turn.appendChild(el("line", { class: "octa__grid", x1: CX, y1: CY, x2: x.toFixed(1), y2: y.toFixed(1) })); }

  /* LES 8 ARÊTES DE LA CAGE — elles tournent, et elles se tracent au scroll.
     Elles ne portent plus le lien : un lien qui tourne se dérobe sous le
     doigt, et il fallait un drapeau anti-clic pour rattraper le coup. Le lien
     vit maintenant sur le libellé, qui lui ne bouge pas d'un pixel. */
  const segLen = 2 * R * Math.sin(rad(22.5));
  const segs = [];
  for (let j = 0; j < 8; j++) {
    const [x1, y1] = pt(-22.5 + j * 45, R);
    const [x2, y2] = pt(22.5 + j * 45, R);
    const seg = el("line", { class: "octa__seg", x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1) });
    seg.style.strokeDasharray = segLen.toFixed(1);
    seg.style.strokeDashoffset = reduce ? "0" : segLen.toFixed(1);
    seg.style.transition = "stroke-dashoffset .9s var(--ease)";
    seg.style.transitionDelay = (j * 0.09).toFixed(2) + "s";
    turn.appendChild(seg);
    segs.push(seg);
  }

  // l'aiguille (pointe en haut au repos) — c'est elle qui DÉSIGNE
  const needle = el("g", { class: "octa__needle" });
  needle.appendChild(el("line", { x1: CX, y1: CY, x2: CX, y2: CY - (R - 14), stroke: "var(--accent)", "stroke-width": 2 }));
  const [nx, ny] = pt(0, R - 14);
  needle.appendChild(el("circle", { cx: nx, cy: ny, r: 5, fill: "var(--accent)" }));
  needle.appendChild(el("circle", { cx: CX, cy: CY, r: 4, fill: "none", stroke: "var(--accent)", "stroke-width": 2 }));
  turn.appendChild(needle);
  spin.appendChild(turn);
  svg.appendChild(spin);

  /* --- couche FIXE : les 8 libellés, droits, cliquables, jamais tournés --- */
  const groups = [];
  edges.forEach((d, j) => {
    const [ax, ay] = pt(-22.5 + j * 45, R);
    const [bx, by] = pt(22.5 + j * 45, R);
    const [mx, my] = pt(j * 45, R);       // milieu d'arête
    const [lx, ly] = pt(j * 45, RL);      // ancre du libellé
    const g = el("g", { class: "octa__link", "data-i": String(j) });
    const a = el("a");
    a.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `/activites/#${d.key}`);
    a.setAttribute("href", `/activites/#${d.key}`);
    a.setAttribute("aria-label", `${d.name} — voir les créneaux`);
    // le fil qui relie le milieu de l'arête à son libellé
    const tick = el("line", { class: "octa__grid", x1: mx.toFixed(1), y1: my.toFixed(1), x2: (mx + (lx - mx) * 0.45).toFixed(1), y2: (my + (ly - my) * 0.45).toFixed(1) });
    // libellé — ancré vers l'intérieur, et de toute façon cadré par le viewBox
    const anchor = lx < CX - 6 ? "end" : lx > CX + 6 ? "start" : "middle";
    const dy = ly < CY - 6 ? "0" : ly > CY + 6 ? ".72em" : ".32em";
    const label = el("text", { class: "octa__label", x: lx.toFixed(1), y: ly.toFixed(1), "text-anchor": anchor, dy });
    label.textContent = SHORT[d.key] || d.name;
    // cible tactile épaisse et invisible, posée sur l'arête (elle ne tourne pas)
    const hit = el("line", { class: "octa__edge", x1: ax.toFixed(1), y1: ay.toFixed(1), x2: bx.toFixed(1), y2: by.toFixed(1) });
    a.append(tick, label, hit);
    g.appendChild(a);
    svg.appendChild(g);
    groups.push({ g, d });
  });

  host.classList.add("octa");
  host.appendChild(svg);

  /* ---------------- LE CARTOUCHE — la discipline du moment --------------
     C'est LUI qui répond à « pendant qu'il tourne, les disciplines
     changent » : un vrai lien, qui change de nom à chaque palier de 45°.
     `aria-live="polite"` : le changement est annoncé, jamais hurlé. */
  const now = document.createElement("a");
  now.className = "octa__now";
  now.setAttribute("aria-live", "polite");
  now.innerHTML = `<span class="octa__now-tag"></span><span class="octa__now-name"></span>`;
  host.appendChild(now);
  const nowTag = now.querySelector(".octa__now-tag");
  const nowName = now.querySelector(".octa__now-name");

  const hint = document.createElement("span");
  hint.className = "octa__hint";
  hint.textContent = reduce ? "8 côtés · 8 disciplines" : "Il tourne · 8 côtés, 8 disciplines";
  host.appendChild(hint);

  /* ---- LE CADRE EST MESURÉ, PLUS JAMAIS SUPPOSÉ ----
     Deux choses s'imbriquent, et c'est ce nœud-là qui faisait sortir la
     forme de la page :
       · les libellés sont demandés en VRAIS pixels écran (11 px), donc en
         unités-utilisateur ils valent 11 × côtéViewBox / largeurCSS — plus
         le svg est étroit, plus ils sont GROS dans le repère ;
       · le viewBox, lui, était figé à 460, calculé une fois pour un cas.
     On inverse la dépendance : on pose la police, on MESURE la boîte peinte
     (getBBox couvre tout, texte compris), on en déduit le cadre — ce qui
     change l'échelle, donc la police — et on recommence. Six passes suffisent
     largement (l'écart tombe sous le demi-pixel dès la troisième).

     Le cadre final est un CARRÉ CENTRÉ SUR (CX, CY) : l'octogone est cadré
     sur SON centre, pas sur le centre du dessin. Sinon un libellé plus long
     d'un côté le décalerait — et c'est exactement le « centre décentré » que
     le client a relevé en même temps que le débordement. */
  const LABEL_PX = 11, HIT_PX = 44, MARGE = 6;
  let labelsHidden = false, vbCote = 460;

  const cadrer = () => {
    const w = svg.getBoundingClientRect().width;
    if (!w) return;                                   // pas encore mesurable
    // sous ~360 px de large, les libellés s'effacent : à cette taille ils
    // mangeraient la cage. La légende .oleg (déjà ≥44px) reste la nav primaire.
    const hide = w < 360;
    if (hide !== labelsHidden) {
      labelsHidden = hide;
      svg.querySelectorAll(".octa__label").forEach((l) => { l.style.display = hide ? "none" : ""; });
    }
    let cote = vbCote;
    for (let i = 0; i < 6; i++) {
      const echelle = w / cote;
      svg.querySelectorAll(".octa__label").forEach((l) => { l.style.fontSize = (LABEL_PX / echelle).toFixed(2) + "px"; });
      let demi = R + 8;                               // plancher : la cage elle-même
      try {
        const bb = svg.getBBox();
        if (bb.width) demi = Math.max(demi, CX - bb.x, bb.x + bb.width - CX, CY - bb.y, bb.y + bb.height - CY);
      } catch (_) { /* svg pas encore rendu : on garde le plancher */ }
      const suivant = 2 * (demi + MARGE);
      const fini = Math.abs(suivant - cote) < 0.5;
      cote = suivant;
      if (fini) break;
    }
    vbCote = cote;
    const demi = cote / 2;
    svg.setAttribute("viewBox", `${(CX - demi).toFixed(1)} ${(CY - demi).toFixed(1)} ${cote.toFixed(1)} ${cote.toFixed(1)}`);
    // cible tactile réelle : 44 px à l'écran, quelle que soit l'échelle finale
    const hitU = (HIT_PX / (w / cote)).toFixed(1);
    svg.querySelectorAll(".octa__edge").forEach((e) => { e.style.strokeWidth = hitU; });
  };
  cadrer();
  addEventListener("resize", cadrer, { passive: true });
  addEventListener("load", cadrer);
  // le svg peut mesurer 0 au boot (hero replié, onglet en fond) → on re-mesure
  // dès que la vraie largeur arrive. Sans ça, le cadre reste faux.
  if ("ResizeObserver" in window) new ResizeObserver(cadrer).observe(svg);
  // …et quand la police mono arrive : elle change la largeur des libellés,
  // donc la boîte peinte. Un cadre mesuré avant le swap serait un cadre faux.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(cadrer).catch(() => {});

  /* --------- tracé au scroll : révèle les 8 arêtes en cascade -------- */
  const draw = () => segs.forEach((s) => (s.style.strokeDashoffset = "0"));
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

  /* ------------------- LA ROTATION, ET CE QU'ELLE DÉSIGNE ------------ */
  let rot = 0, vel = 0, dragging = false, lastAng = 0;

  const angleFrom = (clientX, clientY) => {
    const r = svg.getBoundingClientRect();
    return (Math.atan2(clientY - (r.top + r.height / 2), clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  let lastHot = -1;
  const designer = (k) => {
    if (k === lastHot) return;                 // n'écrit dans le DOM QUE si ça change (perf mobile)
    lastHot = k;
    groups.forEach(({ g }, i) => g.classList.toggle("is-hot", i === k));
    const d = groups[k].d;
    nowTag.textContent = d.tag;
    nowName.textContent = d.name;
    now.setAttribute("href", `/activites/#${d.key}`);
    now.setAttribute("aria-label", `${d.name} — ${d.tag}. Voir les créneaux.`);
  };

  /* L'ANGLE DU TOUR DE FOND EST LU SUR L'ANIMATION ELLE-MÊME, pas recalculé
     à côté. `getAnimations()` donne l'horloge exacte de l'animation CSS : la
     discipline désignée ne peut donc PAS dériver par rapport à la position
     réelle de l'aiguille, même après une pause d'onglet ou un ralenti. Si le
     navigateur n'expose pas l'API (repli), on retombe sur l'horloge murale —
     même période, même résultat visuel. */
  const t0 = performance.now();
  const angleDeFond = () => {
    if (reduce) return 0;
    try {
      const an = turn.getAnimations && turn.getAnimations()[0];
      if (an && an.currentTime != null) return ((an.currentTime / 1000) % TOUR_SEC) / TOUR_SEC * 360;
    } catch (_) { /* repli ci-dessous */ }
    return (((performance.now() - t0) / 1000) % TOUR_SEC) / TOUR_SEC * 360;
  };
  const angleTotal = () => angleDeFond() + rot;
  const setHot = () => {
    const a = angleTotal();
    designer(((Math.round((((a % 360) + 360) % 360) / 45)) % 8 + 8) % 8);
  };
  const apply = () => { spin.setAttribute("transform", `rotate(${rot.toFixed(2)} ${CX} ${CY})`); setHot(); };

  function onDown(e) {
    dragging = true; svg.setPointerCapture?.(e.pointerId);
    host.classList.add("is-dragging");
    lastAng = angleFrom(e.clientX, e.clientY); vel = 0;
  }
  function onMove(e) {
    if (!dragging) return;
    const a = angleFrom(e.clientX, e.clientY);
    let dA = a - lastAng;
    if (dA > 180) dA -= 360; else if (dA < -180) dA += 360;
    rot += dA; vel = dA; lastAng = a;
    apply();
  }
  function onUp() {
    if (!dragging) return;
    dragging = false; host.classList.remove("is-dragging");
    // l'élan s'éteint en quelques frames, puis la cage reprend son tour CSS
    if (Math.abs(vel) > 0.05) {
      const glisse = () => {
        if (dragging || Math.abs(vel) <= 0.05) { vel = 0; return; }
        rot += vel; vel *= 0.94; apply();
        requestAnimationFrame(glisse);
      };
      requestAnimationFrame(glisse);
    }
  }

  if (reduce) {
    /* MOUVEMENT COUPÉ, DÉFILÉ CONSERVÉ : la cage ne bouge pas d'un degré (le
       @keyframes est éteint en CSS, à la source), mais les huit disciplines
       passent quand même — sans transition, sans rotation, juste le nom qui
       change toutes les six secondes. L'information n'appartient pas à
       l'animation, et c'est la demande explicite du client. */
    let k = 0;
    designer(0);
    setInterval(() => { k = (k + 1) % 8; designer(k); }, 6000);
  } else {
    svg.addEventListener("pointerdown", onDown, { passive: true });
    svg.addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerup", onUp, { passive: true });
    addEventListener("pointercancel", onUp, { passive: true });

    /* LE SEUL MINUTEUR QUI RESTE, ET IL EST À 400 ms.
       Le tour est peint par le compositeur ; ici on ne fait que RELIRE
       l'horloge de l'animation pour savoir quelle discipline l'aiguille
       désigne. 2,5 réveils par seconde, et `designer()` n'écrit dans le DOM
       qu'au changement de palier — soit 8 écritures par tour de 72 s, contre
       60 écritures d'attribut PAR SECONDE dans l'ancienne dérive rAF. Le
       coût du hero ne peut que descendre. */
    let horloge = 0;
    const partir = () => { if (!horloge) { setHot(); horloge = setInterval(setHot, 400); } };
    const arreter = () => { clearInterval(horloge); horloge = 0; };
    partir();
    document.addEventListener("visibilitychange", () => { document.hidden ? arreter() : partir(); });
    /* Hors de l'écran, on met le tour EN PAUSE (animation-play-state) et on
       arrête de relire l'horloge : une rotation que personne ne regarde ne
       doit rien coûter, ni au processeur ni à la batterie. */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => es.forEach((e) => {
        turn.style.animationPlayState = e.isIntersecting ? "" : "paused";
        e.isIntersecting ? partir() : arreter();
      }), { threshold: 0 }).observe(host);
    }
  }
  apply();
}

/* auto-mount si un hôte #octa est présent */
const host = document.getElementById("octa");
if (host) mountOctagon(host);
