/* =====================================================================
   RAMONVILLE · offres.js — les deux offres, en alternance

   Eddy, 13/09 : partout où l’offre à 29 € apparaît, l’année complète à
   259 € passe D’ABORD, puis les deux alternent. Toutes mènent à la page
   « offres spéciales » de la boutique, qui présente les deux.

   · Une seule horloge pour toute la page : à un instant donné, chaque
     plaque, chaque bouton montre la MÊME offre.
   · Le passage secret : la face sortante se referme sur une fente de
     lumière au milieu, la face entrante s’ouvre de cette fente vers les
     bords (CSS : .alt.is-passage, base.css).
   · Pas d’animation hors écran, ni sous le doigt ou le curseur (on ne
     change pas l’offre qu’on est en train de lire), ni onglet caché ;
     prefers-reduced-motion : bascule sans mouvement.
   · La carte qui reste : la plaque en format de poche, en bas à gauche,
     sur toutes les pages. Elle s’efface quand une grande plaque est déjà à
     l’écran — jamais la même offre deux fois sous les yeux — et quand le
     menu est ouvert (CSS).
   ===================================================================== */
const PROMOS = "https://boutique.boxingcenter.fr/offres-speciales";
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TEMPS = 5200;   // durée d’affichage d’une offre
const DUREE = 900;    // durée du passage (= animations CSS)
const armes = new Set();
let phase = 0;        // 0 = 259 €, 1 = 29 €

function poser(el, n, anime) {
  const faces = [...el.children].filter((c) => c.classList.contains("alt__face"));
  if (faces.length < 2) return;
  const cur = faces.findIndex((f) => f.classList.contains("is-on"));
  if (cur === n) return;
  const fin = () => {
    faces.forEach((f, k) => {
      f.classList.toggle("is-on", k === n);
      f.classList.remove("is-sort", "is-entre");
      f.setAttribute("aria-hidden", k === n ? "false" : "true");
    });
    el.classList.remove("is-passage");
  };
  if (!anime || reduce) { fin(); return; }
  el.classList.add("is-passage");
  faces[cur]?.classList.add("is-sort");
  faces[n].classList.add("is-entre", "is-on");
  setTimeout(fin, DUREE);
}

function armer(el) {
  if (el.dataset.alterneArme) return;
  el.dataset.alterneArme = "1";
  const hote = el.closest("a, button") || el;
  el._retenu = false;
  el._vu = true;
  hote.addEventListener("pointerenter", () => { el._retenu = true; });
  hote.addEventListener("pointerleave", () => { el._retenu = false; });
  hote.addEventListener("focusin", () => { el._retenu = true; });
  hote.addEventListener("focusout", () => { el._retenu = false; });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => es.forEach((e) => {
      el._vu = e.isIntersecting;
      if (e.isIntersecting && !el._retenu) poser(el, phase, false);   // revenu à l’écran : déjà à l’heure
    })).observe(el);
  }
  armes.add(el);
}

/** À rappeler par une page qui injecte du contenu après coup. */
export function armerAlternances(scope = document) {
  scope.querySelectorAll("[data-alterne]").forEach(armer);
}

function tic() {
  if (document.hidden) return;
  phase = 1 - phase;
  armes.forEach((el) => {
    if (!el.isConnected) { armes.delete(el); return; }
    if (!el._retenu) poser(el, phase, el._vu);
  });
}

const FACES = `
      <span class="plaque__face alt__face is-on">
        <span class="plaque__sur">L’année complète</span>
        <span class="plaque__prix"><b>259</b><i>€</i></span>
        <span class="plaque__barre">400 €</span>
        <span class="plaque__unit">12 mois · les 5 clubs</span>
      </span>
      <span class="plaque__face alt__face" aria-hidden="true">
        <span class="plaque__sur">Offre de rentrée</span>
        <span class="plaque__prix"><b>29</b><i>€</i></span>
        <span class="plaque__barre">44 €</span>
        <span class="plaque__unit">par personne · 4 sem.</span>
      </span>`;

function monterFlotte() {
  if (document.querySelector(".flotte")) return;
  const a = document.createElement("a");
  a.className = "plaque flotte";
  a.href = PROMOS;
  a.setAttribute("aria-label", "Offres spéciales : l’année complète à 259 € au lieu de 400 €, ou l’offre de rentrée à 29 € par personne pour 4 semaines au lieu de 44 €");
  a.innerHTML = `<span class="plaque__faces alt" data-alterne>${FACES}</span><span class="plaque__go">Offres spéciales <i aria-hidden="true">→</i></span>`;

  /* SUR ORDINATEUR, PAS DANS LE HERO (Eddy, 13/09). À l’accueil, la plaque
     arrive quand on ENTRE dans les disciplines (#onav, juste après « 300 m²
     dehors ») et repart si l’on remonte au-dessus ; sur les autres pages,
     une fois le hero passé. Téléphone et tablette : elle est là dès
     l’arrivée — c’est validé tel quel. */
  const bureau = window.matchMedia("(min-width: 980px)");
  const repere = document.getElementById("onav");
  const hero = document.querySelector(".phero, .hero");
  const avant = () => {
    if (!bureau.matches) return false;
    // « quand j’entre dans la section » : son haut a passé le milieu de l’écran, pas un simple bord qui dépasse
    if (repere) return repere.getBoundingClientRect().top > window.innerHeight * 0.5;
    if (hero) return hero.getBoundingClientRect().bottom > 90;
    return false;
  };
  let image = 0;
  const maj = () => { image = 0; a.classList.toggle("is-avant", avant()); };
  const planifier = () => { if (!image) image = requestAnimationFrame(maj); };
  a.classList.toggle("is-avant", avant());   // posée AVANT l’insertion : aucun éclair au chargement
  document.body.appendChild(a);
  window.addEventListener("scroll", planifier, { passive: true });
  window.addEventListener("resize", planifier);
  bureau.addEventListener?.("change", planifier);

  const grandes = [...document.querySelectorAll(".plaque:not(.flotte)")];
  if (grandes.length && "IntersectionObserver" in window) {
    const vues = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? vues.add(e.target) : vues.delete(e.target)));
      a.classList.toggle("is-cachee", vues.size > 0);
    }, { threshold: 0.15 });
    grandes.forEach((g) => io.observe(g));
  }
}

let demarre = false;
/** Appelé par site.js, une fois la barre, le menu et le pied de page montés. */
export function demarrerOffres() {
  if (demarre) return;
  demarre = true;
  monterFlotte();
  armerAlternances();
  /* page.js peint ses cartes APRÈS ce module (bouton « Quatre semaines ·
     29 € » des disciplines) : tout [data-alterne] qui arrive est armé. */
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    if (n.matches("[data-alterne]")) armer(n);
    n.querySelectorAll("[data-alterne]").forEach(armer);
  }))).observe(document.body, { childList: true, subtree: true });
  setInterval(tic, TEMPS);
}
