/* =====================================================================
   RAMONVILLE · page.js — moteur de rendu des 7 pages intérieures

   Un seul module, aiguillé par body[data-page]. Tout vient de data.js
   (facts verrouillés, planning officiel, offres datées, avis réels). Le
   chrome, la météo du ciel et le motion vivent dans site.js / sky.js.
   ===================================================================== */
import {
  DISCIPLINES, PLATEAU, VALUES, NETWORK, SALLE, SEASON, SEASON_LABEL,
  DAYS, SCHEDULE, FAMILLES, POSTERS, TARIFS, PROMOS, REVIEWS,
  GALLERY, PHOTO_CREDIT, FAQ, LINKS, DEHORS, GRID_LEGEND, COACHES, ARPENT,
  ENTREE, CARNET,
} from "./data.js?v=22";

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const page = document.body.dataset.page;

/* =================== L’OBJET DU HERO, PROPRE À CHAQUE PAGE =========
   Les 7 sous-pages ouvraient sur le MÊME tampon : même .sky, même octogone
   filigrane aux mêmes coordonnées haut-droite, même rotation 90s, puis fil
   d’ariane → titre → chapô. Cinq d’entre elles ne contenaient rien d’autre :
   l’octogone y devenait un watermark payé sept fois au lieu d’un instrument.
   Le filigrane est supprimé des 7 ; chaque hero porte maintenant SON fait —
   et c’est .phero__meta, le composant construit pour exactement ça et utilisé
   par zéro page, qui le porte. /la-salle/ (#prail) et /galerie/ (#tournage)
   avaient déjà le leur : on n’y touche pas. */
const two = (n) => String(n).padStart(2, "0");
const toMin = (t) => { const m = /^(\d{1,2})h(\d{2})$/.exec(t); return m ? +m[1] * 60 + +m[2] : 0; };

/* /plannings/ — ce qui se passe MAINTENANT, lu de SCHEDULE + l’heure réelle
   de la salle (window.__SKY.now, fuseau Ramonville, pas celui du visiteur). */
function planningNow() {
  const now = (window.__SKY?.now?.() || new Date());
  const day = DAYS[now.getDay() - 1];           // getDay: 0=dim … 6=sam ; DAYS[0]="Lun"
  if (!day) return { closed: true };            // dimanche : fermé, et on le dit
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = SCHEDULE.filter((s) => s.day === day).sort((a, b) => toMin(a.start) - toMin(b.start));
  // « en ce moment » = commencé depuis moins de 60 min (durée type d’un cours)
  const live = today.find((s) => mins >= toMin(s.start) && mins < toMin(s.start) + 60);
  const next = today.find((s) => toMin(s.start) > mins);
  return { day, live, next, count: today.length };
}

function pheroMeta() {
  const box = $("#phero-meta"); if (!box) return;
  /* Si la page a déjà posé ses chips dans le HTML (cas de /tarifs/, dont les
     trois prix sont fixes et lus au build), on n’y touche pas : les remplacer
     ne changerait rien à l’écran et rendrait au décalage les 67 px qu’on
     vient de lui reprendre. Les pages dont le bandeau dépend de l’heure —
     /plannings/ et son « en ce moment » — passent, elles, par ici. */
  if (box.children.length && page !== "plannings") return;
  const chip = (html) => `<span>${html}</span>`;

  if (page === "plannings") {
    const paint = () => {
      const p = planningNow();
      if (p.closed) { box.innerHTML = chip("Dimanche — <b>la salle est fermée</b>") + chip("Lun–sam · 10h–21h30"); return; }
      const head = p.live
        ? chip(`En ce moment — <b>${p.live.cours}</b>`)
        : p.next
          ? chip(`Prochain cours — <b>${p.next.cours}</b> à ${p.next.start}`)
          : chip("Plus de cours aujourd’hui — <b>accès libre</b> jusqu’à 21h30");
      box.innerHTML = head + chip(`${p.count} cours aujourd’hui`) + chip(`${SCHEDULE.length} sur la semaine`);
    };
    paint();
    window.addEventListener("sky:change", paint);   // l’heure de la salle vient d’arriver
    setInterval(paint, 60 * 1000);
    return;
  }

  if (page === "tarifs") {
    /* PAR SON NOM, PAS PAR SON RANG. TARIFS[0] a designe la Seance d’essai
       jusqu’au jour ou l’Offre Rentree est passee en tete : la chip a alors
       annonce « 29 € l’essai » quand l’essai est a 10 €. Un rang se deplace,
       un nom non. */
    const essai = TARIFS.find((t) => /essai/i.test(t.name || ""));
    box.innerHTML = chip(`<b>${PROMOS.duo.price}</b> ${PROMOS.duo.unit} · 4 semaines`)
      + chip(`<b>${PROMOS.saisonOffre.price}</b> ${PROMOS.saisonOffre.unit} · les 5 clubs`)
      + (essai ? chip(`<b>${essai.price}</b> l’essai, matériel prêté`) : "");
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
      + chip("De <b>3 ans</b> à l’accès libre");
    return;
  }

  if (page === "coachs") {
    /* « Coach à confirmer » n’est PAS un coach : deux créneaux du poster de la
       rentrée attendent encore leur nom. Les compter faisait annoncer cinq
       coachs sur une page qui en présente quatre — le chiffre du hero
       contredisait la page qu’il coiffe. */
    const named = new Set(SCHEDULE.map((s) => s.coach).filter((c) => !/confirmer/i.test(c)));
    box.innerHTML = chip(`<b>${named.size}</b> coachs sur le planning`)
      + chip(`<b>${SCHEDULE.length}</b> créneaux / semaine`)
      + chip("Du <b>Baby Boxe</b> à la cage");
  }
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

/* ================== L’ARPENTAGE — LE DEHORS, DESSINÉ ================ *
   Le cadre au ciel réel était juste mais NU : en plein midi il n’y a pas
   d’étoiles, et le différenciateur du site s’affichait en rectangle de nuit
   quasi vide — une intention honnête rendue comme une image qui n’a pas
   chargé. On arpente donc le dehors au lieu de l’attendre en photo.

   Deux faits, deux seuls, tous deux officiels : 300 m² et une cage de 7 m.
   On dessine trois cents carrés d’un mètre — un COMPTE, rangé pour être lu,
   jamais une emprise — et l’octogone au même étalon, à côté, coté 7 m. Le
   ciel réel reste le fond : il n’a pas disparu, il a enfin quelque chose
   au-dessus de quoi être. La forme des 300 m² n’est dessinée nulle part, et
   la légende dit pourquoi : c’est un relevé, pas un plan inventé. */
const OCT_T = 1 / (2 + Math.SQRT2); // découpe d’un octogone régulier inscrit

/* le tracé de l’octogone, inscrit dans un carré de côté `a` en (x,y) */
function octPath(x, y, a) {
  const t = a * OCT_T, X = (v) => +(x + v).toFixed(2), Y = (v) => +(y + v).toFixed(2);
  return `M${X(t)} ${Y(0)} L${X(a - t)} ${Y(0)} L${X(a)} ${Y(t)} L${X(a)} ${Y(a - t)} `
       + `L${X(a - t)} ${Y(a)} L${X(t)} ${Y(a)} L${X(0)} ${Y(a - t)} L${X(0)} ${Y(t)} Z`;
}

/* la planche : 300 carrés + la cage étalon. UNE SEULE par page — la planche
   compacte qui doublait celle-ci dans la tuile de station a été supprimée :
   elle redessinait les 300 mêmes carrés à trente centimètres du grand relevé,
   et surtout elle affichait une DEUXIÈME fois le compteur « 300 m² dehors » et
   la barre météo en direct sur le même écran. Un relevé qui se répète cesse
   d’être un relevé. */
function arpentPlot() {
  const A = ARPENT, U = 10, PAD = .8;          // 1 m = 10 unités SVG
  const cols = A.cols, rows = A.rows;
  const fw = cols * U, fh = rows * U;          // le champ
  const cage = A.cage * U, gap = 26;
  const cx = fw + gap, cy = (fh - cage) / 2;   // l’étalon, à droite, centré

  let sq = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      // l’ordre de remplissage suit la lecture (ligne par ligne) : on COMPTE
      sq += `<rect x="${c * U + PAD}" y="${r * U + PAD}" width="${U - PAD * 2}" height="${U - PAD * 2}" style="--i:${i}"/>`;
    }
  }
  const W = cx + cage, H = fh + 34;
  return `<svg class="arpent__plot" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
    <g class="arpent__field">${sq}</g>
    <path class="arpent__cage" d="${octPath(cx, cy, cage)}"/>
    <g class="arpent__dim">
      <line x1="${cx}" y1="${fh + 12}" x2="${cx + cage}" y2="${fh + 12}"/>
      <line x1="${cx}" y1="${fh + 8}" x2="${cx}" y2="${fh + 16}"/>
      <line x1="${cx + cage}" y1="${fh + 8}" x2="${cx + cage}" y2="${fh + 16}"/>
    </g>
    <text class="arpent__lbl" x="${fw / 2}" y="${fh + 28}" text-anchor="middle">${A.kField}</text>
    <text class="arpent__lbl arpent__lbl--cage" x="${cx + cage / 2}" y="${fh + 28}" text-anchor="middle">${A.cage} m</text>
  </svg>`;
}

/* le cadre complet : ciel réel en fond, planche par-dessus, relevé en pied */
function arpentFrame() {
  const A = ARPENT;
  const label = `Arpentage du plateau extérieur : ${A.count} carrés d’un mètre, soit ${A.count} m², et l’octogone de ${A.cage} m dessiné au même étalon. ${A.honest}`;
  return `<div class="arpent" role="img" aria-label="${label}">
    <div class="sky" aria-hidden="true"><canvas class="sky__stars"></canvas><div class="sky__haze"></div><div class="sky__moon"></div></div>
    <div class="arpent__stage">${arpentPlot()}</div>
    <p class="arpent__honest">${A.honest}</p>
    <div class="arpent__cap">
      <!-- la VRAIE valeur est peinte d’emblée (loi n°1) : sur une frame jamais
           peinte — rAF gelé, onglet en fond, JS lent — le lecteur voit 300, pas
           un « 0 m² dehors » qui serait un chiffre FAUX. Le zéro n’est écrit
           qu’une fois la boucle d’animation prouvée vivante (voir animateArpent). -->
      <span class="arpent__count"><b data-arpent="${A.count}">${A.count}</b><small>m² dehors</small></span>
      <span class="arpent__live">
        <span class="skyframe__k">${DEHORS.cadre.k}</span>
        <span class="skyframe__live" data-skylive></span>
      </span>
    </div>
  </div>`;
}

/* La vie de la planche : les carrés se posent un par un (on COMPTE le terrain),
   le compteur suit.

   LE REPLI DIT LA VÉRITÉ. Le compteur naît à 300 dans le HTML, pas à 0 : si le
   rAF ne tourne jamais (onglet en fond, frame jamais peinte, JS coupé), ce qui
   reste à l’écran est la VRAIE surface. Un « 0 m² dehors » serait pire qu’une
   absence — c’est un chiffre faux sur le seul fait qui distingue la salle. Le
   zéro de départ n’est donc écrit qu’à l’intérieur d’un rAF, c’est-à-dire une
   fois la boucle prouvée vivante, et avant que la planche n’entre à l’écran.
   Dead-man conservé par-dessus : la planche finit toujours posée. */
function animateArpent(scope = document) {
  scope.querySelectorAll(".arpent").forEach((box) => {
    if (box.dataset.live) return;
    box.dataset.live = "1";
    const num = box.querySelector("[data-arpent]");
    const target = num ? +num.dataset.arpent : 0;
    const settle = () => { box.classList.add("is-on", "is-done"); if (num) num.textContent = String(target); };
    if (reduce) { settle(); return; }

    // la boucle est-elle vivante ? seule preuve acceptable pour effacer la vérité
    if (num) requestAnimationFrame(() => {
      if (!box.classList.contains("is-on")) num.textContent = "0";
    });

    const run = () => {
      box.classList.add("is-on");
      if (num) {
        const dur = 1400; let t0 = null;
        const step = (ts) => {
          if (!t0) t0 = ts;
          const p = Math.min(1, (ts - t0) / dur);
          num.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      // dead-man : la planche est entièrement posée, quoi qu’il arrive
      setTimeout(settle, 2600);
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { io.disconnect(); run(); }
      }), { threshold: .2 });
      io.observe(box);
      setTimeout(() => { if (!box.classList.contains("is-on")) settle(); }, 6000);
    } else run();
  });
}

/* ---------------- LE RELEVÉ DU DEHORS (la-salle + galerie) --------- *
   Le différenciateur en fiche de terrain : ce qui est mesuré, ce qui ne
   l’est pas encore, et le ciel qui tient lieu d’image. Même composant sur
   les deux pages qui portent le sujet — une seule source, pas deux copies
   qui divergeront. */
function renderReleve() {
  const box = $("#releve"); if (!box) return;
  const D = DEHORS;
  box.innerHTML = `
    <div class="releve__frame" data-reveal>${arpentFrame()}</div>
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

/* ------------------------- LE PLATEAU (la-salle) ------------------ *
   La station sans cliché prouvé (l’extérieur couvert) portait une SECONDE
   planche d’arpentage, compacte — les 300 mêmes carrés, le même compteur, la
   même barre météo en direct, à un écran d’écart du grand relevé qui les
   porte déjà. Le lecteur lisait « 300 M² DEHORS » deux fois dans la même
   page, et 600 rectangles étaient dessinés pour 300 mètres carrés.
   La planche vit dans le relevé, une fois. La station, elle, dit ce qu’elle
   est — une zone décrite mais non filmée — et RENVOIE au relevé au lieu de
   le rejouer. Jamais le cadre d’une AUTRE zone (même loi que « nom ≡ photo »
   côté coachs), jamais un carré « à venir ». */
function renderPlateau() {
  const box = $("#stations"); if (!box) return;
  box.innerHTML = PLATEAU.map((s) => `
    <article class="station${s.img ? "" : " station--releve"}" data-reveal>
      ${s.img
        ? `<div class="station__media media" data-img="${s.img}" data-label="" data-alt="${s.t} — Boxing Center Ramonville"></div>`
        : ""}
      <div class="station__body">
        <span class="station__n">${s.n}</span>
        <span class="station__tag">${s.tag}</span>
        <h3>${s.t}</h3>
        <p>${s.d}</p>
        <div class="station__specs">${s.specs.map((x) => `<span>${x}</span>`).join("")}</div>
        ${s.img ? "" : `<a class="station__renvoi" href="#releve">
          <span>${DEHORS.eyebrow}</span>
          <b>Cette zone n’a pas de cliché — elle a un arpentage.</b>
          <i aria-hidden="true">↑</i>
        </a>`}
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
        ? `<div class="disc__media media" data-img="${d.img}" data-label="" data-alt="${d.imgAlt || `${d.name} — Boxing Center Ramonville`}"></div>`
        : /* LA PLAQUE, pas un trou. Elle porte le sigle, le tag, ET la raison
             écrite de l’absence : `role="img"` mentirait sur un bloc qui
             contient du vrai texte à lire, on le laisse donc en contenu
             normal, annoncé par sa propre phrase (voir activites.css). */
          `<div class="disc__media disc__media--tile">
             <svg class="disc__oct" viewBox="0 0 100 100" aria-hidden="true"><path d="M32.8 8.4 L67.2 8.4 L91.6 32.8 L91.6 67.2 L67.2 91.6 L32.8 91.6 L8.4 67.2 L8.4 32.8 Z"/></svg>
             <span class="disc__tagbig">${d.tag}</span>
             ${d.nophoto ? `<p class="disc__nophoto">${d.nophoto}</p>` : ""}
           </div>`}
      <div class="disc__body">
        <span class="disc__tag">${d.tag}</span>
        <h2>${d.name}</h2>
        <p>${d.desc}</p>
        <div class="disc__facts">
          <div class="disc__fact"><b>Créneaux</b><span>${d.jours}</span></div>
          <div class="disc__fact"><b>Niveau</b><span>${d.niveau}</span></div>
        </div>
        <div class="disc__cta">
          <a class="btn btn--primary" data-magnetic href="${LINKS.rentree}"><span>Quatre semaines · 29 €</span></a>
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

/* ---------------- L’ENTRÉE EN MATIÈRE (activites) ----------------- *
   /activites/ tenait en trois blocs : hero, huit fiches, CTA. Elle disait ce
   qu’on fait, jamais par où on entre — et le seul fait qui compte pour qui
   n’a jamais boxé (le niveau demandé) était la 3e ligne d’un tableau de
   faits. Ici, les cinq familles sont PESÉES contre le planning officiel :
   créneaux, jours, niveau à l’entrée. Tout compté depuis SCHEDULE. */
function renderEntree() {
  const box = $("#entree"); if (!box) return;
  const dayIx = (d) => DAYS.indexOf(d);
  const isOpen = (d) => ENTREE.ouvertes.includes(d.niveau);
  /* l’ordre et la LISTE viennent des disciplines, pas du filtre de planning :
     FAMILLES ne connaît que les familles qui ont des créneaux — l’accès libre
     n’en a aucun et disparaissait purement et simplement du bloc. */
  const famKeys = [...new Set([...DISCIPLINES].sort((a, b) => a.edge - b.edge).map((d) => d.famille))];
  const labelOf = (k) => FAMILLES.find((f) => f.key === k)?.label || ENTREE.libreLabel;

  const cards = famKeys.map((key) => {
    const discs = DISCIPLINES.filter((d) => d.famille === key).sort((a, b) => a.edge - b.edge);
    const slots = SCHEDULE.filter((s) => s.fam === key);
    const jours = [...new Set(slots.map((s) => s.day))].sort((a, b) => dayIx(a) - dayIx(b));
    const nOpen = discs.filter(isOpen).length;
    /* ON COMPTE LES PORTES, ON NE LES RABAT PAS. Les deux créneaux de la
       cage sont ouverts : le grappling est « Tous niveaux », le MMA est
       « Tous niveaux · débutants acceptés ». Ce second libellé manquait à
       ENTREE.ouvertes — et son absence faisait écrire à la page que le MMA
       attend que tu saches tenir un round, contre sa propre fiche affichée
       quinze centimètres plus haut. Le compte reste conservé tel quel pour
       le jour où un créneau, lui, se refermera vraiment. */
    const lvl = nOpen === discs.length ? ENTREE.kOuvert
      : nOpen === 0 ? ENTREE.kReserve
      : `${nOpen} sur ${discs.length} sans prérequis`;
    /* l’accès libre n’a aucun créneau : ce n’est pas un zéro, c’est une autre
       nature. On l’écrit, on ne le rend pas comme une famille vide. */
    const horsGrille = slots.length === 0;
    return `<article class="fam${nOpen ? " fam--open" : ""}${horsGrille ? " fam--free" : ""}">
      <span class="fam__k">${labelOf(key)}</span>
      ${horsGrille
        ? `<b class="fam__free">${ENTREE.horsGrille.v}</b><span class="fam__freed">${ENTREE.horsGrille.d}</span>`
        : `<span class="fam__n"><b>${slots.length}</b><small>${ENTREE.kSlots}</small></span>
           <span class="fam__days">${jours.map((d) => `<i>${d}</i>`).join("")}</span>`}
      <span class="fam__lvl">${lvl}</span>
      <span class="fam__discs">${discs.map((d) =>
        `<a href="#${d.key}" data-key="${d.key}"${isOpen(d) ? "" : ' class="is-hold"'}>
           <b>${d.name}</b><i>${d.niveau}</i></a>`).join("")}</span>
    </article>`;
  }).join("");

  // le compte qui ouvre le bloc — vérifié, pas affirmé
  const nOpen = DISCIPLINES.filter((d) => ENTREE.ouvertes.includes(d.niveau)).length;
  const reserve = DISCIPLINES.filter((d) => !ENTREE.ouvertes.includes(d.niveau));

  box.innerHTML = `
    <p class="entree__lead" data-reveal>${ENTREE.lead}</p>
    <div class="fams" data-reveal-group>${cards}</div>
    <p class="entree__read" data-reveal>
      <b>${nOpen} côtés sur ${DISCIPLINES.length}</b> s’ouvrent sans rien savoir faire. Les gants et les bandes sont prêtés. Tu préviens le coach en arrivant. Tu fais la séance avec les autres.
      ${reserve.length
        ? `${reserve.length === 1 ? "Le dernier" : `Les ${reserve.length} derniers`} — ${reserve.map((d) => d.name).join(", ")} — ${reserve.length === 1 ? "demande" : "demandent"} quelques séances derrière toi. On te le dira. On ne t’y enverra pas le premier soir.`
        : ""}
    </p>`;

  // le sommaire et le filtre de la page pilotent les mêmes ancres
  box.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-key]"); if (!a) return;
    e.preventDefault();
    const all = document.querySelector('.chip[data-fam="all"]');
    if (all && !all.classList.contains("is-on")) all.click();
    const el = document.getElementById(a.dataset.key);
    if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", "#" + a.dataset.key);
  });
}

/* ----------------------------- COACHS ---------------------------- *
   Pas de renderCoachs() ici. /coachs/ rend son roster dans un module inline
   (il dérive les vrais créneaux de SCHEDULE — implémentation plus riche) sur
   #coachroster. La version qui vivait ici visait #coachs, un id qui n’existe
   sur aucune des 8 pages : code mort, et SECONDE source de vérité divergente
   pour la même fiche coach. Supprimée — une seule implémentation. */

/* ------------------- QUI TIENT QUOI, ET QUAND (coachs) ------------ *
   /coachs/ s’arrêtait au roster : quatre fiches, une note d’intégrité, un
   CTA. On savait QUI ils sont, jamais QUAND les trouver ni vers qui aller.
   Ces deux blocs se déduisent entièrement du planning officiel — la garde
   de la semaine (qui est sur le plateau, jour par jour) et l’aiguillage
   (ce que tu cherches → qui le tient, quel soir). Rien d’écrit à la main :
   si le planning bouge, ces blocs bougent avec lui. */
function renderCoachDepth() {
  const dayIx = (d) => DAYS.indexOf(d);

  /* la garde : qui est sur le plateau, jour par jour */
  const garde = $("#garde");
  if (garde) {
    garde.innerHTML = DAYS.map((d) => {
      const slots = SCHEDULE.filter((s) => s.day === d);
      const names = [...new Set(slots.map((s) => nomDe(s.coach)))];
      return `<div class="garde__day">
        <span class="garde__d">${d}</span>
        <div class="garde__who">
          ${names.map((n) => {
            const c = COACHES.find((x) => x.name === n);
            const n2 = slots.filter((s) => nomDe(s.coach) === n).length;
            return `<span class="gwho${c?.pillar ? " is-pillar" : ""}">${n}<i>${n2}</i></span>`;
          }).join("")}
        </div>
        <span class="garde__n">${slots.length} cours</span>
      </div>`;
    }).join("");
  }

  /* l’aiguillage : ce que tu viens chercher → qui le tient */
  const route = $("#routage");
  if (route) {
    route.innerHTML = [...DISCIPLINES].sort((a, b) => a.edge - b.edge).map((d) => {
      const slots = SCHEDULE.filter((s) => s.disc === d.key);
      const names = [...new Set(slots.map((s) => nomDe(s.coach)))];
      const soirs = [...new Set(slots.sort((a, b) => dayIx(a.day) - dayIx(b.day)).map((s) => s.day))];
      // « Accès libre » n’a ni coach ni créneau : on le dit, on ne l’invente pas
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

/* LE NOM AFFICHE, PAS LA CLE DU POSTER.
   Le poster de la rentree ecrit « Valentin G » : c'est la cle qui relie
   un creneau a une fiche, et elle ne bouge pas — un poster fait foi sur
   le planning. Mais elle n'a rien a faire a l'ecran, et elle s'affichait
   six fois dans la grille. Une fiche qui porte `planning` declare sa
   cle ; partout ailleurs on lit son nom. */
const NOM_COACH = Object.fromEntries(
  COACHES.filter((c) => c.planning).map((c) => [c.planning, c.name]));
const nomDe = (c) => NOM_COACH[c] || c;

/* ----------------------------- GALERIE --------------------------- */
function renderGallery() {
  const box = $("#gallery"); if (!box) return;
  // role=button + tabindex=0 : les vignettes sont de VRAIS contrôles. La
  // visionneuse avait déjà Escape, piège à focus, retour de focus, role=dialog
  // et aria-modal — tout sauf la porte d’entrée : au clavier, les 6 photos
  // étaient inatteignables (WCAG 2.1.1, niveau A).
  box.innerHTML = GALLERY.map((g, i) => `
    <figure class="shot" role="button" tabindex="0" aria-label="Agrandir — ${g.zone} · ${g.place}">
      <img src="${g.img}" ${g.plein ? `data-plein="${g.plein}" ` : ""}alt="${g.alt}" width="${g.w}" height="${g.h}" ${i < 3 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async" />
      <span class="shot__zoom" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="7"/><line x1="21" y1="21" x2="15.5" y2="15.5"/><line x1="10.5" y1="7.5" x2="10.5" y2="13.5"/><line x1="7.5" y1="10.5" x2="13.5" y2="10.5"/></svg></span>
      <figcaption class="shot__cap"><b data-cap="${g.zone}">${g.zone}</b> · ${g.place}${g.credit ? `<em class="shot__credit">Photo ${PHOTO_CREDIT}</em>` : ""}</figcaption>
    </figure>`).join("");
  // Les légendes disent la ZONE — vérifiable sur l’image. Elles disaient avant
  // une heure (« 21h48 »), inventée : les 6 clichés prouvés sont pris de JOUR,
  // sous charpente. Un carnet de terrain qui écrit « on ne montre que ce qu’on
  // a filmé » ne peut pas horodater ce qu’il n’a pas filmé. La météo LIVE reste
  // dans la bande du hero : elle parle de MAINTENANT, au-dessus de la salle —
  // ça, c’est une donnée réelle, et c’est la signature.
  if ("IntersectionObserver" in window && !reduce && window.BC?.scramble) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { const b = e.target.querySelector(".shot__cap b"); if (b && !b.dataset.done) { b.dataset.done = "1"; window.BC.scramble(b, { dur: 650 }); } io.unobserve(e.target); }
    }), { threshold: 0.5 });
    box.querySelectorAll(".shot").forEach((s) => io.observe(s));
  }
}

/* ------------- LE CARNET À L’USAGE (galerie, et elle seule) -------- *
   /galerie/ rejouait le RELEVÉ DU DEHORS de /la-salle/ à l’identique : même
   sur-titre, même titre, même phrase-thèse, mêmes cinq cartes de mesure,
   même signature. 149 mots sur 358 appartenaient à une autre page — et sans
   ce doublon il ne restait que trois sections. Le relevé est rendu à sa page.
   Le carnet gagne la sienne avec ce que lui seul peut dire : ce que chacun
   des vingt-quatre cadres contient, et à quelle heure ça se produit dans la semaine.
   Tout est RECOMPTÉ depuis SCHEDULE — si le planning bouge, le carnet bouge. */
function renderCarnet() {
  const dayIx = (d) => DAYS.indexOf(d);

  /* LES ZONES, PAS LES CLICHES.
     Cette boucle mappait GALLERY : une ligne par photo. Avec six cliches,
     une photo = une zone, et le compte tombait juste par accident. Avec
     vingt-quatre, « L'octogone » s'ecrivait huit fois de suite avec les
     memes horaires recopies dessous. On regroupe donc par zone et on fait
     l'union de ses disciplines : le carnet ne depend plus de la taille du
     lot. */
  const usage = $("#carnet-usage");
  if (usage) {
    const zones = [];
    const parZone = new Map();
    for (const g of GALLERY) {
      let z = parZone.get(g.zone);
      if (!z) { z = { zone: g.zone, n: 0, discs: [], hors: "" }; parZone.set(g.zone, z); zones.push(z); }
      z.n++;
      if (g.hors && !z.hors) z.hors = g.hors;
      for (const k of (g.discs || [])) if (!z.discs.includes(k)) z.discs.push(k);
    }

    usage.innerHTML = zones.map((z) => {
      const cadres = `${z.n} cadre${z.n > 1 ? "s" : ""}`;
      const discs = z.discs.map((k) => DISCIPLINES.find((d) => d.key === k)).filter(Boolean);
      if (!discs.length) {
        // plan large : aucune discipline ne lui appartient. On le dit.
        return `<article class="zrow zrow--wide">
          <span class="zrow__z">${z.zone}<i class="zrow__n">${cadres}</i></span>
          <span class="zrow__k">${CARNET.kLarge}</span>
          <p class="zrow__d">${z.hors || CARNET.horsDefaut}</p>
        </article>`;
      }
      const lines = discs.map((d) => {
        const slots = SCHEDULE.filter((s) => s.disc === d.key)
          .sort((a, b) => (dayIx(a.day) - dayIx(b.day)) || toMin(a.start) - toMin(b.start));
        /* l'acces libre n'a aucun creneau : ce n'est pas un zero, c'est une
           autre nature — meme regle que /activites/. On lit ses horaires
           d'ouverture au lieu d'inventer une case vide. */
        const when = slots.length
          ? [...new Set(slots.map((s) => `${s.day} ${s.start}`))].join(" · ")
          : d.jours;
        return `<a class="zline" href="/activites/#${d.key}">
          <b>${d.name}</b>
          <span class="zline__when">${when}</span>
        </a>`;
      }).join("");
      return `<article class="zrow">
        <span class="zrow__z">${z.zone}<i class="zrow__n">${cadres}</i></span>
        <span class="zrow__k">${CARNET.kQuoi} · ${CARNET.kQuand}</span>
        <div class="zrow__lines">${lines}</div>
      </article>`;
    }).join("") + `<p class="zrow__foot">${CARNET.usageFoot(zones)}</p>`;
  }


  /* la méthode — trois règles, tenues sur les vingt-quatre cadres */
  const meth = $("#carnet-methode");
  if (meth) {
    meth.innerHTML = CARNET.regles.map((r, i) => `
      <article class="regle">
        <span class="regle__n">${String(i + 1).padStart(2, "0")}</span>
        <h3>${r.k}</h3>
        <p>${r.d}</p>
      </article>`).join("");
  }

  /* le renvoi de la page blanche : le relevé complet vit sur /la-salle/ */
  const renvoi = $("#carnet-renvoi");
  if (renvoi) {
    renvoi.innerHTML = `<a class="btn btn--ghost" data-magnetic href="${CARNET.renvoi.href}"><span>${CARNET.renvoi.label}</span></a>`;
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
            <b>${s.cours}</b>
          </a>`).join("")}</td>`;
      }).join("");
      return `<tr><td class="time">${t}</td>${cells}</tr>`;
    }).join("");
    grid.innerHTML = head + `<tbody>${body}</tbody>`;
  };

  /* L’ÉTÉ N’EST PAS UNE GRILLE. Deux cours, tous les deux le lundi : dans un
     tableau à six colonnes ça donnait 10 cases vides sur 12 — une page qui
     avait l’air CASSÉE là où la salle lève simplement le pied. L’été a donc
     sa propre forme : les deux créneaux nommés, en grand, puis ce qui occupe
     réellement le reste de la semaine — l’accès libre, qui ne s’arrête pas.
     Même données, rendu honnête. */
  const buildEte = () => {
    if (!eteBox) return;
  };

  /* bascule d’AFFICHAGE : la grille et l’été ne coexistent jamais à l’écran,
     et le filtre par famille n’a aucun sens sur deux cours — il disparaît
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
  /* La phrase « émargement GPS obligatoire en salle avant chaque cours »
     tombait à l’identique ici et sur /la-salle/. C’est une règle de la
     maison, elle doit être dite deux fois ; elle n’a pas à être écrite
     deux fois de la même façon. Là-bas c’est un constat de visite, ici
     c’est une consigne d’arrivée — et le fait ne bouge pas d’un mot. */
  const RENTREE_NOTE = `<b>${SEASON_LABEL}</b> — la grille affichée en salle, recopiée ici. Clique un cours, tu tombes sur sa fiche. Une seule formalité : valider ta présence à l’accueil avant chaque cours. Puis tu montes.`;
  // Le détail de l’été (renforts, accès libre, retour de la rentrée) vit
  // maintenant DANS le bloc #ete, en clair. Cette note ne le répète pas : une
  // bonne phrase ne se dit qu’une fois par site (standards §7).
  const ETE_NOTE = `<b>Hors saison</b> — le rythme d’été. Émargement GPS toujours obligatoire en salle.`;
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
  /* Le poster SERVI est le WebP (132 et 64 ko) ; le lien ouvre le PNG
     d’origine (1,9 Mo et 1,4 Mo), non recompressé — la source de vérité reste
     consultable en grand. Avant, la page téléchargeait les deux PNG pleins,
     3,4 Mo, pour deux vignettes : dix fois le poids de tout le reste du site. */
  const pbox = $("#posters");
  if (pbox) pbox.innerHTML = POSTERS.map((p) => `
    <a class="poster" href="${p.src}" target="_blank" rel="noopener" aria-label="Ouvrir le planning ${p.label} en grand format, image d’origine">
      <span class="poster__cap">${p.label}</span>
      <img src="${p.view || p.src}" alt="${p.alt}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async" />
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
   /plannings/ n’avait qu’UNE section : la grille, puis les posters, puis le
   CTA. Une page utilitaire, pas une page. Ce bloc lit la MÊME source
   (SCHEDULE) et la raconte autrement : ce que pèse chaque jour, où tombent
   les midis et les soirs, quel soir la salle est pleine. Zéro fait ajouté —
   tout est compté, rien n’est écrit à la main. */
function renderRythme() {
  const box = $("#rythme"); if (!box) return;
  /* trois tranches, pas deux : un « midi / soir » binaire rangeait le Baby
     Boxe du samedi 14h15 dans « midi » et l’éducative de 15h dans « soir » —
     deux étiquettes fausses sur la même après-midi d’enfants. */
  const tranche = (t) => (toMin(t) < 14 * 60 ? "midi" : toMin(t) < 17 * 60 ? "aprem" : "soir");
  const perDay = DAYS.map((d) => {
    const all = SCHEDULE.filter((s) => s.day === d).sort((a, b) => toMin(a.start) - toMin(b.start));
    const t = { midi: 0, aprem: 0, soir: 0 };
    all.forEach((s) => { t[tranche(s.start)]++; });
    return { d, n: all.length, ...t, first: all[0]?.start || "—", last: all[all.length - 1]?.start || "—" };
  });
  const max = Math.max(...perDay.map((p) => p.n)) || 1;
  const sum = (k) => perDay.reduce((a, p) => a + p[k], 0);
  /* PAS un reduce aveugle : plusieurs jours peuvent etre a egalite — c'est
     le cas a la rentree 2026 (lun, mer, ven, sam : 4 cours chacun).
     Affirmer « LE jour le plus charge » quand ils sont quatre, c'est un
     faux que le lecteur verifie trois lignes plus haut. */
  const busiest = perDay.reduce((a, p) => (p.n > a.n ? p : a), perDay[0]);
  const exAequo = perDay.filter((p) => p.n === busiest.n);
  const apremSlots = SCHEDULE.filter((s) => tranche(s.start) === "aprem");
  // vérifié, pas affirmé : les après-midis appartiennent-ils vraiment à l’école ?
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
      <p><b>${sum("midi")}</b> cours le midi, <b>${sum("soir")}</b> le soir. La salle se remplit deux fois par jour. Le midi tient dans une pause déjeuner. Tu tapes, tu souffles, tu repars les épaules cuites. Et tu es à l’heure. Le soir, c’est le volume et le bruit. Et du monde à qui se mesurer.</p>
      <p>${exAequo.length > 1 ? `<b>${exAequo.map((p) => p.d).join(", ")}</b> sont les jours les plus chargés. ${busiest.n} cours chacun.` : `<b>${busiest.d}</b> est le jour le plus chargé. ${busiest.n} cours, de ${busiest.first} à ${busiest.last}.`} Tu veux du monde sur le plateau ? Viens ${exAequo.length > 1 ? "ces jours-là" : "ce jour-là"}. Tu veux de la place ? Prends un midi.</p>
      <p>${apremEcole
        ? `Les <b>${sum("aprem")}</b> créneaux d’après-midi sont <b>tous</b> à l’école enfants. Mercredi et samedi, entre 14h et 17h, le plateau est à eux. Ton enfant boxe ? Tu n’es pas obligé d’attendre dehors. La salle reste ouverte pendant le cours.`
        : `<b>${sum("aprem")}</b> créneaux d’après-midi, entre 14h et 17h.`}
        Le reste du temps, rien ne ferme. Accès libre de 10h à 21h30, six jours sur sept.</p>
    </div>`;
}

/* ------------------------------ TARIFS --------------------------- */
function renderTarifs() {
  const box = $("#tarifs"); if (box) box.innerHTML = TARIFS.map((t) => `
    <article class="tarif ${t.highlight ? "tarif--hot" : ""}">
      ${t.highlight ? '<span class="tarif__badge">Le + malin</span>' : ""}
      <h3 class="tarif__name">${t.name}</h3>
      <div class="tarif__price">${t.was ? `<s class="tarif__was">${t.was}</s> ` : ""}${t.price}<small> ${t.period}</small></div>
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
  if (bonus) {
    if (PROMOS.bonus) bonus.innerHTML = `<b>Bonus rentrée —</b> ${PROMOS.bonus}`;
    else bonus.remove();
  }

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
  /* L’accès ne tient plus en une ligne à trois <br> : trois façons de venir,
     trois entrées lisibles. Et les horaires viennent de SALLE.hoursData —
     une donnée qui existait depuis l’origine et que PERSONNE n’affichait :
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
      { k: "Métro", ico: "M" }, { k: "Bus", ico: "B" }, { k: "Voiture", ico: "V" },
    ];
    venir.innerHTML = SALLE.access.map((a, i) => {
      const k = MODE[i]?.k || "Accès";
      const [h0, ...rest] = a.split(" — ");
      let head = h0, detail = rest.join(" — ");
      /* « Bus — arrêt Ramonville Sud… » donnait une carte titrée « Bus » sous
         une étiquette « Bus » : le mot deux fois, et l’info utile reléguée en
         petit. Quand l’intitulé ne fait que répéter le mode, on promeut le
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
    + `<p class="hrow__note">La muscu et le cardio suivent les mêmes horaires : salle ouverte, étage ouvert. Tu n’as personne à prévenir. Tu viens à l’heure qui t’arrange.</p>`;

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
  pheroMeta();   // l’objet propre au hero de la page (remplace le filigrane partagé)
  if (page === "la-salle") { renderReleve(); renderPlateau(); renderValues(); renderNetwork(); }
  if (page === "activites") { renderDiscs(); renderEntree(); }
  /* page === "coachs" : le roster est rendu par le module inline de la page
     (#coachroster). Les créneaux nominatifs ne s’affichent plus. */
  if (page === "galerie") { renderGallery(); renderCarnet(); }
  if (page === "plannings") renderPlanning();
  if (page === "tarifs") renderTarifs();
  if (page === "contact") renderContact();

  /* Les cadres vivants viennent d’être injectés : on monte leurs starfields
     (sky.js a balayé le document AVANT que ce module n’écrive quoi que ce
     soit) et on peint les relevés en direct. Sans ça, le ciel qui remplace la
     photo manquante reste un rectangle noir — le contraire du but. */
  window.__SKY?.mount?.(document);
  paintSkyLive(document);
  window.addEventListener("sky:change", () => paintSkyLive(document));
  animateArpent(document);   // la planche se pose, le compteur monte (dead-man inclus)

  window.BC.media(document);
  window.BC.reveal(document);
  window.BC.magnetic(document);
  window.BC.touchLife(".coach, .tarif, .net, .promo, .station, .value, .route, .eslot, .venir__card, .nope__card");

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

/* ---------- L'indice de defilement de la grille planning ----------
   Une table plus large que l'ecran ne se devine pas : on annonce le geste,
   et on efface l'annonce des qu'il est fait. */
(() => {
  const wrap = document.querySelector(".gridwrap");
  const hint = document.querySelector(".gridwrap__hint");
  if (!wrap) return;
  const majuscule = () => wrap.classList.toggle("has-more", wrap.scrollWidth > wrap.clientWidth + 4);
  majuscule();
  window.addEventListener("resize", majuscule, { passive: true });
  wrap.addEventListener("scroll", () => {
    if (hint && wrap.scrollLeft > 12) { hint.classList.add("is-gone"); }
  }, { passive: true });
})();
