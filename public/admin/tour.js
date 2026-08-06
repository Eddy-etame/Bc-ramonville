/* =====================================================================
   LE VESTIAIRE — Ramonville · tour.js : le guide et les assistants.

   Le principe : on assombrit tout l'écran SAUF la cible (quatre panneaux
   autour d'un trou). La cible reste cliquable, le reste est neutralisé —
   impossible de se perdre.

   Deux natures d'étape :
     · info   — un bouton « Compris » fait avancer ;
     · action — AUCUN bouton : c'est l'utilisateur qui fait le geste
                demandé (cliquer, écrire) et le guide avance tout seul.
                On apprend en faisant, pas en lisant.

   `guideFlow(etapes)` joue n'importe quel parcours : la grande visite de
   la première connexion comme les assistants de l'accueil.
   ===================================================================== */

const GUIDE_VU = "bc-ram-vestiaire-guide";
let FLOW = null;

function elt(tag, attrs = {}, ...enfants) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "onclick") n.addEventListener("click", v);
    else n.setAttribute(k, v);
  }
  for (const c of enfants) if (c != null) n.append(c);
  return n;
}

function guideFlow(etapes, opts = {}) {
  guideFin();
  const blocs = [0, 1, 2, 3].map(() => {
    const d = elt("div", { class: "guide-bloc" });
    document.body.append(d);
    return d;
  });
  const spot = elt("div", { class: "guide-spot" });
  const carte = elt("div", { class: "guide-carte", role: "dialog", "aria-label": "Guide pas à pas" });
  document.body.append(spot, carte);
  FLOW = { etapes, i: 0, spot, carte, blocs, opts, off: null };
  addEventListener("resize", guidePlace);
  addEventListener("scroll", guidePlace, true);
  document.addEventListener("keydown", guideTouche);
  guideEtape();
}

function guideFin() {
  if (!FLOW) return;
  FLOW.off?.();
  FLOW.spot.remove();
  FLOW.carte.remove();
  FLOW.blocs.forEach((b) => b.remove());
  removeEventListener("resize", guidePlace);
  removeEventListener("scroll", guidePlace, true);
  document.removeEventListener("keydown", guideTouche);
  const fini = FLOW.opts.onEnd;
  FLOW = null;
  fini?.();
}

function guideTouche(e) { if (e.key === "Escape") guideFin(); }

function guideSuivant() {
  if (!FLOW) return;
  FLOW.off?.(); FLOW.off = null;
  if (FLOW.i >= FLOW.etapes.length - 1) return guideFin();
  FLOW.i++;
  guideEtape();
}

const cibleDe = (etape) => (etape.sel ? document.querySelector(etape.sel) : null);

function guideEtape() {
  const etape = FLOW.etapes[FLOW.i];
  etape.faire?.(); // prépare l'écran (changer de section, etc.)

  const { carte } = FLOW;
  carte.innerHTML = "";
  carte.append(elt("h3", {}, etape.t), elt("p", {}, etape.b));

  const actes = elt("div", { class: "guide-actes" });
  if (etape.avanceSur) {
    carte.append(elt("span", { class: "indice" }, etape.indice || "À toi de jouer"));
    actes.append(elt("button", { class: "btn btn--fantome btn--petit", type: "button", onclick: guideSuivant }, "Passer"));
    const h = (e) => {
      if (!e.target.closest(etape.avanceSur.sel)) return;
      FLOW.off?.(); FLOW.off = null;
      setTimeout(guideSuivant, etape.avanceSur.delai ?? 420);
    };
    document.addEventListener(etape.avanceSur.ev, h, true);
    FLOW.off = () => document.removeEventListener(etape.avanceSur.ev, h, true);
  } else {
    actes.append(elt("button", { class: "btn btn--fantome btn--petit", type: "button", onclick: guideFin }, "Quitter"));
    actes.append(
      elt("button", { class: "btn btn--petit", type: "button", onclick: guideSuivant },
        FLOW.i >= FLOW.etapes.length - 1 ? "Terminer" : etape.ok || "Compris")
    );
  }
  carte.append(elt("div", { class: "guide-pied" }, elt("span", { class: "pas" }, `${FLOW.i + 1} / ${FLOW.etapes.length}`), actes));

  cibleDe(etape)?.scrollIntoView({ block: "center" });
  guidePlace();
  requestAnimationFrame(guidePlace); // correction après mise en page
}

function guidePlace() {
  if (!FLOW) return;
  const cible = cibleDe(FLOW.etapes[FLOW.i]);
  const { spot, carte, blocs: [haut, bas, gauche, droite] } = FLOW;
  const pose = (b, x, y, w, h) =>
    Object.assign(b.style, { left: x + "px", top: y + "px", width: Math.max(0, w) + "px", height: Math.max(0, h) + "px" });
  const cw = carte.offsetWidth || 340, ch = carte.offsetHeight || 200;

  if (cible) {
    const r = cible.getBoundingClientRect(), p = 8;
    const hl = r.left - p, ht = r.top - p, hw = r.width + 2 * p, hh = r.height + 2 * p;
    Object.assign(spot.style, { opacity: 1, left: hl + "px", top: ht + "px", width: hw + "px", height: hh + "px" });
    pose(haut, 0, 0, innerWidth, ht);
    pose(bas, 0, ht + hh, innerWidth, innerHeight - (ht + hh));
    pose(gauche, 0, ht, hl, hh);
    pose(droite, hl + hw, ht, innerWidth - (hl + hw), hh);
    let cy = r.bottom + 14;
    if (cy + ch > innerHeight - 12) cy = Math.max(12, r.top - ch - 14);
    const cx = Math.min(Math.max(12, r.left), Math.max(12, innerWidth - cw - 12));
    Object.assign(carte.style, { top: cy + "px", left: cx + "px" });
  } else {
    Object.assign(spot.style, { opacity: 0, width: "0px", height: "0px" });
    pose(haut, 0, 0, innerWidth, innerHeight);
    pose(bas, 0, 0, 0, 0); pose(gauche, 0, 0, 0, 0); pose(droite, 0, 0, 0, 0);
    Object.assign(carte.style, { top: Math.max(12, (innerHeight - ch) / 2) + "px", left: Math.max(12, (innerWidth - cw) / 2) + "px" });
  }
}

const section = (k) => window.vestiaire?.section(k);

/* ------------------- LA GRANDE VISITE (1re connexion) -------------- */
const VISITE = [
  {
    sel: null, t: "Bienvenue dans le vestiaire", ok: "C'est parti",
    b: "D'ici tu changes ce qui bouge dans la vie de la salle — coordonnées, planning, tarifs, coachs — et tu relis les contacts laissés par les visiteurs. Aucune connaissance technique. Et c'est toi qui mènes cette visite : tu vas faire les gestes toi-même.",
  },
  {
    sel: '#nav .navbtn[data-k="contacts"]', t: "1 · Le menu",
    b: "Chaque bouton ouvre une partie du vestiaire. À toi : clique sur « Contacts ».",
    indice: "Clique sur « Contacts »", avanceSur: { ev: "click", sel: '#nav .navbtn[data-k="contacts"]' },
  },
  {
    sel: "#pane", t: "2 · Les contacts",
    b: "Ce sont les gens qui ont laissé un prénom et un numéro (ou un email) à l'assistant du site, en discutant. Le plus récent est en haut. Tu peux cliquer sur un numéro pour appeler directement depuis un téléphone.",
  },
  {
    sel: '#nav .navbtn[data-k="salle"]', t: "3 · Modifier, c'est écrire",
    faire: () => section("salle"),
    b: "Un texte se change en écrivant dans sa case, comme dans un document. Essaie : ajoute ou retire un caractère dans une case de cette page.",
    indice: "Écris dans une case", avanceSur: { ev: "input", sel: "#pane input, #pane textarea" },
  },
  {
    sel: "#etat", t: "4 · Rien n'est encore en ligne",
    b: "Tu vois « Modifications non publiées » ? Tes essais restent dans ce navigateur, le vrai site n'a pas bougé d'un pixel. « Annuler tout » les jette et ramène la version publiée.",
  },
  {
    sel: "#publier", t: "5 · Publier",
    b: "Quand tout te va : « Publier ». Le site se reconstruit tout seul, il est à jour en une minute environ. Le vestiaire ne montre pas d'aperçu : ce que tu lis dans les cases est exactement ce qui partira en ligne. (Ne publie pas maintenant.)",
  },
  {
    sel: '#nav .navbtn[data-k="accueil"]', t: "Besoin d'être guidé ?",
    b: "L'Accueil propose un assistant pas à pas pour chaque tâche courante : changer un horaire, corriger un tarif, déplacer un créneau. Ils sont là quand tu veux. Bon entraînement.",
  },
];

function lancerVisite() {
  guideFlow(VISITE, { onEnd: () => { try { localStorage.setItem(GUIDE_VU, "1"); } catch {} } });
}
const visiteDejaVue = () => { try { return localStorage.getItem(GUIDE_VU) === "1"; } catch { return true; } };

/* ------------------ LES ASSISTANTS DE L'ACCUEIL -------------------- */
const ASSISTANTS = {
  horaires: {
    titre: "Changer un horaire ou un numéro",
    quoi: "Les coordonnées de la salle : téléphone, email, adresse, heures d'ouverture.",
    etapes: [
      {
        sel: "#pane .carte", faire: () => section("salle"), t: "Les coordonnées",
        b: "Tout ce que le visiteur lit en pied de page et tout ce que l'assistant du site répond au téléphone vient d'ici. Modifie la case que tu veux corriger.",
        indice: "Modifie une case", avanceSur: { ev: "input", sel: "#pane input, #pane textarea" },
      },
      { sel: "#etat", t: "C'est enregistré, pas publié", b: "L'état en haut passe à « Modifications non publiées ». Rien n'est en ligne tant que tu n'as pas cliqué sur Publier." },
      { sel: "#publier", t: "Mets-le en ligne", b: "Clique sur « Publier ». Le site se reconstruit et affiche ton nouvel horaire en une minute environ." },
    ],
  },
  tarif: {
    titre: "Corriger un tarif",
    quoi: "Le prix, la période et le descriptif de chaque offre de la page Tarifs.",
    etapes: [
      {
        sel: "#pane .carte", faire: () => section("tarifs"), t: "Une carte = une offre",
        b: "Chaque bloc est une offre de la page Tarifs. Change le prix, le nom ou la ligne de description directement dans les cases.",
        indice: "Modifie une case", avanceSur: { ev: "input", sel: "#pane input, #pane textarea" },
      },
      { sel: "#pane .carte", t: "Attention à la formule de la Rentrée", b: "L'Offre Rentrée se dit « 29 € par personne », jamais « 29 € pour deux » — c'est la formule officielle du réseau, et elle évite un malentendu à l'accueil." },
      { sel: "#publier", t: "Publie", b: "« Publier », et le nouveau prix est en ligne en une minute environ." },
    ],
  },
  planning: {
    titre: "Déplacer ou ajouter un créneau",
    quoi: "La grille des cours de la semaine, jour par jour.",
    etapes: [
      { sel: "#pane .carte", faire: () => section("planning"), t: "Le planning", b: "Chaque bloc est un jour. Chaque ligne est un cours : l'heure, le nom du cours, le coach. La croix au bout supprime la ligne." },
      {
        sel: "#pane .carte .btn", t: "Ajouter un cours",
        b: "À toi : clique sur « + Ajouter un cours » dans le premier jour.",
        indice: "Clique sur « + Ajouter un cours »", avanceSur: { ev: "click", sel: "#pane .carte .btn" },
      },
      { sel: "#pane .creneau:last-of-type", t: "Remplis-le", b: "Écris l'heure au format de la salle (12h40, 18h40, 19h45), le nom du cours, et le coach qui le tient. Puis « Publier »." },
    ],
  },
  coach: {
    titre: "Mettre à jour un coach",
    quoi: "Le rôle et la présentation de Sonia, Jérôme, Farouk et Valentin G.",
    etapes: [
      {
        sel: "#pane .carte", faire: () => section("coachs"), t: "L'encadrement",
        b: "Une carte par coach : son rôle (les cours qu'il tient) et sa présentation sur la page Coachs. Modifie ce qui a changé.",
        indice: "Modifie une case", avanceSur: { ev: "input", sel: "#pane input, #pane textarea" },
      },
      { sel: "#pane .carte", t: "Un nom, une photo, jamais l'inverse", b: "Les photos ne se changent pas d'ici : un nom ne doit jamais se retrouver sous le visage d'un autre. Pour ajouter ou remplacer une photo, passe par la personne qui gère le site." },
      { sel: "#publier", t: "Publie", b: "« Publier », et la page Coachs est à jour en une minute environ." },
    ],
  },
};
