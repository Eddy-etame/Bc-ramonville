/* =====================================================================
   LE VESTIAIRE — Ramonville · app.js

   COMMENT ÇA MARCHE (et pourquoi c'est fait comme ça) :

   Le vestiaire n'écrit pas dans le site : il écrit un CALQUE
   (src/content.json) qui surcharge data.js au moment du build. Une case
   qu'on ne touche pas n'apparaît pas dans le calque — le staff ne peut
   donc pas vider une page par mégarde, il ne peut que corriger un champ.

   Le brouillon vit dans ce navigateur tant qu'on n'a pas publié. L'état
   en haut à droite dit toujours la vérité : « Tout est publié » ou
   « Modifications non publiées ». Aucun bouton ne ment, aucun bouton
   n'est mort : ce que le serveur ne sait pas faire (faute de clé) est
   annoncé en toutes lettres au lieu d'être proposé puis raté.

   PAS D'APERÇU, ET C'EST VOLONTAIRE : le site est statique, un aperçu
   fidèle demanderait une reconstruction — c'est-à-dire exactement ce que
   fait « Publier ». Plutôt qu'un bouton qui montrerait autre chose que
   la vérité, le vestiaire dit franchement que les cases SONT le résultat.
   ===================================================================== */

const BROUILLON = "bc-ram-vestiaire-brouillon";
const CLE_TOKEN = "bc-ram-vestiaire-token";

const $ = (s, r = document) => r.querySelector(s);
const app = {
  token: "",
  capacites: {},
  base: null,      // data.js — les valeurs du site
  calque: {},      // ce qui est publié dans src/content.json
  brouillon: {},   // ce qui est en cours d'édition ici
  section: "accueil",
  leads: null,
};

const echappe = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ------------------------------ RÉSEAU ---------------------------- */
async function api(chemin, init = {}) {
  const r = await fetch(chemin, {
    ...init,
    headers: { "Content-Type": "application/json", "x-admin-token": app.token, ...(init.headers || {}) },
  });
  let j = {};
  try { j = await r.json(); } catch {}
  if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
  return j;
}

/* ------------------------------ LA PORTE -------------------------- */
const porte = $("#porte"), porteForm = $("#porteForm"), porteErr = $("#porteErr"), porteBtn = $("#porteBtn");

porteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const val = $("#token").value.trim();
  if (!val) return;
  porteErr.hidden = true;
  porteBtn.disabled = true;
  porteBtn.textContent = "Vérification…";
  app.token = val;
  try {
    const s = await api("/api/admin/session");
    app.capacites = s.capacites || {};
    try { sessionStorage.setItem(CLE_TOKEN, val); } catch {}
    await entrer();
  } catch (err) {
    app.token = "";
    porteErr.textContent = err.message;
    porteErr.hidden = false;
  } finally {
    porteBtn.disabled = false;
    porteBtn.textContent = "Entrer";
  }
});

async function entrer() {
  porte.hidden = true;
  $("#app").hidden = false;
  await chargerBase();
  await chargerCalque();
  lireBrouillon();
  monterNav();
  rendreSection(app.section);
  majEtat();
  // le compteur ne bloque pas l'entrée dans le vestiaire : il arrive après
  if (app.section !== "galerie") majCompteurGalerie();
  if (!visiteDejaVue()) setTimeout(lancerVisite, 400);
}

/* ------------------------- CHARGEMENT DES DONNÉES ----------------- */
async function chargerBase() {
  try {
    app.base = await import("/assets/js/data.js?v=11");
  } catch {
    app.base = null;
  }
}

async function chargerCalque() {
  if (!app.capacites.contenu) { app.calque = {}; return; }
  try {
    const j = await api("/api/admin/content");
    app.calque = j.content || {};
  } catch {
    app.calque = {};
  }
}

/* Valeur affichée : brouillon > calque publié > data.js. */
function valeur(cle) {
  if (app.brouillon[cle] !== undefined) return app.brouillon[cle];
  if (app.calque[cle] !== undefined) return app.calque[cle];
  const B = app.base;
  if (!B) return undefined;
  return { salle: B.SALLE, tarifs: B.TARIFS, coaches: B.COACHES, schedule: B.SCHEDULE, promos: B.PROMOS, disciplines: B.DISCIPLINES }[cle];
}
function ecrire(cle, val) {
  app.brouillon[cle] = val;
  try { localStorage.setItem(BROUILLON, JSON.stringify(app.brouillon)); } catch {}
  majEtat();
}
function lireBrouillon() {
  try { app.brouillon = JSON.parse(localStorage.getItem(BROUILLON) || "{}"); } catch { app.brouillon = {}; }
}
const sale = () => Object.keys(app.brouillon).length > 0;

function majEtat() {
  const el = $("#etat");
  el.className = "etat " + (sale() ? "etat--sale" : "etat--bon");
  el.textContent = sale() ? "Modifications non publiées" : "Tout est publié";
  $("#publier").disabled = !sale() || !app.capacites.contenu;
  $("#annuler").disabled = !sale();
}

/* ------------------------------- LE MENU -------------------------- */
const SECTIONS = [
  { k: "accueil", t: "Accueil" },
  { k: "contacts", t: "Contacts" },
  { k: "galerie", t: "La galerie du club" },
  { k: "salle", t: "Coordonnées & club" },
  { k: "tarifs", t: "Tarifs" },
  { k: "coachs", t: "Coachs" },
  { k: "planning", t: "Planning" },
];

function monterNav() {
  $("#nav").innerHTML = SECTIONS.map(
    (s) => `<button class="navbtn" type="button" data-k="${s.k}" aria-current="${s.k === app.section}"><span>${s.t}</span>${
      s.k === "galerie" ? `<span class="navbtn__n" id="navGalerieN" hidden></span>` : ""
    }</button>`
  ).join("");
  $("#nav").addEventListener("click", (e) => {
    const b = e.target.closest(".navbtn");
    if (b) rendreSection(b.dataset.k);
  });
}

/* COMBIEN ATTENDENT — le staff doit savoir qu'il y a du monde dans la file
   SANS avoir à ouvrir la section. Le compteur se rafraîchit au démarrage
   et après chaque décision (publier / supprimer), donc il ne ment jamais
   d'un tour. En panne, il se tait plutôt que d'afficher un faux zéro. */
async function majCompteurGalerie(n) {
  const el = $("#navGalerieN");
  if (!el) return;
  if (n == null) {
    if (!app.capacites.galerie) { el.hidden = true; return; }
    try { n = ((await api("/api/community/pending")).items || []).length; }
    catch { el.hidden = true; return; }
  }
  el.hidden = !n;
  el.textContent = String(n);
  // le nombre seul ne dit pas ce qu'il compte : on l'écrit pour l'oreille
  el.setAttribute("aria-label", `${n} fichier${n > 1 ? "s" : ""} en attente de relecture`);
}

/* UN SEUL jeu d'écouteurs sur #pane, posé une fois pour toutes.
   Chaque vue dépose sa fonction de récolte ici ; brancher un écouteur à
   chaque rendu les empilait section après section — un même caractère
   tapé finissait par déclencher six récoltes. */
let recolteur = null;
let cliqueur = null;
$("#pane").addEventListener("input", (e) => recolteur?.(e));
$("#pane").addEventListener("click", (e) => cliqueur?.(e));

function rendreSection(k) {
  app.section = k;
  recolteur = null;
  cliqueur = null;
  const s = SECTIONS.find((x) => x.k === k) || SECTIONS[0];
  $("#paneTitre").textContent = s.t;
  $("#nav").querySelectorAll(".navbtn").forEach((b) => b.setAttribute("aria-current", String(b.dataset.k === k)));
  ({ accueil: vueAccueil, contacts: vueContacts, galerie: vueGalerie, salle: vueSalle, tarifs: vueTarifs, coachs: vueCoachs, planning: vuePlanning }[k] || vueAccueil)();
}

/* ====================== LA GALERIE DU CLUB ========================= *
   La file d'attente du mur : ce que les visiteurs ont déposé sur
   /galerie/ et que PERSONNE n'a encore vu sur le site. Rien n'est publié
   tout seul — c'est toute la raison d'être de cet écran.

   Deux boutons, deux gestes irréversibles dans le bon sens :
     · « Publier sur le mur » pose le tag approved → la photo apparaît.
     · « Supprimer » DÉTRUIT le fichier. Pas de corbeille : on ne garde pas
       la photo de quelqu'un sur nos serveurs après l'avoir refusée. C'est
       pour ça que ce bouton demande confirmation, et pas l'autre.

   On affiche le moyen de recontact laissé par le contributeur : le coach
   qui publie peut dire merci. Ces coordonnées ne sortent QUE par cette
   route, derrière le mot de passe staff — jamais par le mur public.

   Cette section ne s'écrit PAS dans le calque de contenu : elle agit tout
   de suite sur le stockage. Elle n'a donc rien à voir avec « Publier » en
   haut à droite, et c'est dit en toutes lettres au staff. */
async function vueGalerie() {
  const intro = `<p class="intro">Ce que les visiteurs ont déposé sur la page Galerie. <b>Rien n'est en ligne tant que tu n'as pas cliqué « Publier sur le mur »</b> — et ici, contrairement au reste du vestiaire, l'effet est immédiat : pas besoin de repasser par le bouton « Publier » en haut.</p>`;

  if (!app.capacites.galerie) {
    $("#pane").innerHTML = `${intro}
      <div class="vide"><b>La galerie du club n'est pas encore branchée</b>
      Il manque la clé de stockage (CLOUDINARY_URL) dans les réglages du site. Tant qu'elle n'y est pas, la section reste visible sur le site avec un message d'attente honnête — personne ne voit d'erreur. La marche à suivre est dans le README, section « La galerie du club ».</div>`;
    return;
  }

  $("#pane").innerHTML = `${intro}<p class="etat">Chargement…</p>`;
  let d;
  try {
    d = await api("/api/community/pending");
  } catch (e) {
    $("#pane").innerHTML = `${intro}
      <div class="vide"><b>La file n'a pas répondu</b>${echappe(e.message)}. Réessaie dans un instant — ou recharge la page.</div>`;
    return;
  }

  const items = d.items || [];
  majCompteurGalerie(items.length);
  if (!items.length) {
    $("#pane").innerHTML = `${intro}
      <div class="vide"><b>Rien à relire pour l'instant</b>
      La file est vide : tout ce qui a été déposé est déjà traité. Dès qu'un visiteur postera une photo ou une vidéo depuis la page Galerie, elle apparaîtra ici, la plus ancienne en tête.</div>`;
    return;
  }

  const quand = (iso) => {
    const dt = new Date(iso);
    return isNaN(dt) ? "" : dt.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };
  $("#pane").innerHTML = `${intro}
    <p class="intro"><b>${items.length} fichier${items.length > 1 ? "s" : ""}</b> en attente, le plus ancien en premier.</p>
    <div class="file">
      ${items.map((it) => `
        <div class="file__item" data-id="${echappe(it.id)}" data-type="${echappe(it.type)}">
          <div class="file__vue">
            ${it.type === "video"
              ? `<video src="${echappe(it.src)}" poster="${echappe(it.poster)}" controls preload="none" playsinline></video>`
              : `<img src="${echappe(it.poster)}" alt="Proposition de ${echappe(it.auteur || "un visiteur")}" loading="lazy" decoding="async" />`}
          </div>
          <div class="file__meta">
            <b>${echappe(it.titre || "Sans titre")}</b>
            <span>Par ${echappe(it.auteur || "anonyme")} · ${echappe(quand(it.createdAt))}${it.duree ? ` · ${it.duree}s` : ""}</span>
            <span class="file__coord">
              ${it.tel ? `<a href="tel:${echappe(it.tel.replace(/\s/g, ""))}">${echappe(it.tel)}</a>` : ""}
              ${it.email ? `<a href="mailto:${echappe(it.email)}">${echappe(it.email)}</a>` : ""}
            </span>
            <div class="file__actes">
              <button class="btn" type="button" data-acte="publier">Publier sur le mur</button>
              <button class="btn btn--fantome" type="button" data-acte="supprimer">Supprimer</button>
            </div>
          </div>
        </div>`).join("")}
    </div>`;

  /* La vue est asynchrone : entre le `await` et ici, le staff a pu changer
     de section. Sans ce garde, on brancherait le clic de la galerie sur un
     écran qui affiche les tarifs — et rendreSection() a déjà remis le
     récolteur à zéro pour la bonne raison. */
  if (app.section !== "galerie") return;
  cliqueur = async (e) => {
    const b = e.target.closest("[data-acte]");
    if (!b) return;
    const carte = b.closest(".file__item");
    const acte = b.dataset.acte;
    if (acte === "supprimer" && !confirm("Supprimer définitivement ce fichier ? Il ne sera pas récupérable.")) return;
    carte.querySelectorAll("button").forEach((x) => (x.disabled = true));
    b.textContent = "…";
    try {
      await api("/api/community/moderate", {
        method: "POST",
        body: JSON.stringify({ id: carte.dataset.id, type: carte.dataset.type, action: acte }),
      });
      carte.remove();
      const reste = $("#pane").querySelectorAll(".file__item").length;
      majCompteurGalerie(reste);
      if (!reste) rendreSection("galerie");
    } catch (err) {
      carte.querySelectorAll("button").forEach((x) => (x.disabled = false));
      b.textContent = acte === "publier" ? "Publier sur le mur" : "Supprimer";
      alert("Ça n'a pas marché : " + err.message);
    }
  };
}

/* ------------------------------- ACCUEIL -------------------------- */
function vueAccueil() {
  const manque = [];
  if (!app.capacites.contenu) manque.push("l'édition du contenu (il manque la clé GitHub côté serveur)");
  if (!app.capacites.registre) manque.push("la relecture des contacts (aucun registre n'est branché)");

  $("#pane").innerHTML = `
    <p class="intro">Ici, tu changes ce qui bouge dans la vie de la salle et tu relis les contacts laissés par les visiteurs.
    <b>Rien n'est en ligne tant que tu n'as pas cliqué sur « Publier »</b> — tu peux tout essayer sans risque.</p>

    ${manque.length ? `<div class="carte"><div class="carte__tete"><h3>À savoir sur ce site</h3></div>
      <p style="margin:0;color:var(--muted);font-size:var(--step--1)">Deux choses ne sont pas encore branchées côté serveur : ${manque.join(", ")}.
      Le reste fonctionne. Ces réglages se font une fois pour toutes dans les variables d'environnement du site — la marche à suivre est dans le README, section « Le vestiaire ».</p></div>` : ""}

    <h3 style="margin:1.6rem 0 .8rem">Les assistants — on te tient la main</h3>
    <div class="assists" id="assists">
      ${Object.entries(ASSISTANTS).map(([k, a]) => `
        <button class="assist" type="button" data-assist="${k}">
          <b>${echappe(a.titre)}</b><span>${echappe(a.quoi)}</span>
        </button>`).join("")}
    </div>

    <div class="carte" style="margin-top:1.6rem">
      <div class="carte__tete"><h3>Comment ça se passe, en trois phrases</h3></div>
      <p style="margin:0;color:var(--muted);font-size:var(--step--1);line-height:1.7">
        1. Tu écris dans les cases — c'est enregistré dans ce navigateur, pas en ligne.<br>
        2. Tu relis. Ce que tu vois dans les cases est exactement ce qui partira ; le vestiaire ne montre pas d'aperçu parce qu'il n'a rien de plus fidèle à montrer.<br>
        3. Tu cliques sur « Publier ». Le site se reconstruit et il est à jour en une minute environ.
      </p>
    </div>`;

  cliqueur = (e) => {
    const b = e.target.closest("[data-assist]");
    if (b) guideFlow(ASSISTANTS[b.dataset.assist].etapes);
  };
}

/* ------------------------------ CONTACTS -------------------------- */
async function vueContacts() {
  $("#pane").innerHTML = `<p class="intro">Les visiteurs qui ont laissé un prénom et un moyen de les rappeler, en discutant avec l'assistant du site. Le plus récent en premier.</p><p class="etat">Chargement…</p>`;
  let d;
  try {
    d = await api("/api/admin/leads");
  } catch (e) {
    $("#pane").innerHTML = `<p class="intro">Les contacts laissés par les visiteurs.</p>
      <div class="vide"><b>Le registre n'a pas répondu</b>${echappe(e.message)}. Réessaie dans un instant — ou recharge la page.</div>`;
    return;
  }
  app.leads = d.leads || [];

  if (!d.registre) {
    $("#pane").innerHTML = `<p class="intro">Les contacts laissés par les visiteurs.</p>
      <div class="vide"><b>Les contacts ne sont pas relus ici</b>
      ${echappe(d.note || "")}</div>`;
    return;
  }
  if (!app.leads.length) {
    $("#pane").innerHTML = `<p class="intro">Les contacts laissés par les visiteurs.</p>
      <div class="vide"><b>Aucun contact pour l'instant</b>
      Le registre est bien branché et il écoute. Dès qu'un visiteur laissera son prénom et un numéro (ou un email) à l'assistant du site, sa fiche apparaîtra ici, la plus récente en haut.</div>`;
    return;
  }

  const quand = (iso) => {
    const d2 = new Date(iso);
    return isNaN(d2) ? "" : d2.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };
  $("#pane").innerHTML = `
    <p class="intro">Les visiteurs qui ont laissé un prénom et un moyen de les rappeler, en discutant avec l'assistant du site.
    <b>${app.leads.length} contact${app.leads.length > 1 ? "s" : ""}</b>, le plus récent en premier.</p>
    <div class="leads">
      ${app.leads.map((l) => `
        <div class="lead">
          <span class="lead__nom">${echappe([l.prenom, l.nom].filter(Boolean).join(" ") || "Sans prénom")}</span>
          <span class="lead__coord">
            ${l.phone ? `<a href="tel:${echappe(l.phone.replace(/\s/g, ""))}">${echappe(l.phone)}</a>` : ""}
            ${l.email ? `<a href="mailto:${echappe(l.email)}">${echappe(l.email)}</a>` : ""}
            ${l.event === "callback_request" ? "<span>a demandé à être rappelé</span>" : ""}
          </span>
          <span class="lead__quand">${echappe(quand(l.at))}</span>
        </div>`).join("")}
    </div>`;
}

/* --------------------------- COORDONNÉES -------------------------- */
function champ(label, val, aide, oninput) {
  const id = "c" + Math.random().toString(16).slice(2, 8);
  return { html: `<div class="champ"><label for="${id}">${echappe(label)}</label><input id="${id}" type="text" value="${echappe(val)}" />${aide ? `<span class="aide">${echappe(aide)}</span>` : ""}</div>`, id, oninput };
}

function vueSalle() {
  const s = valeur("salle") || {};
  const a = s.address || {};
  $("#pane").innerHTML = `
    <p class="intro">Les coordonnées de la salle. Elles apparaissent en pied de page, sur la page Contact, et <b>l'assistant du site répond avec</b> : une correction ici corrige tout le site d'un coup.</p>
    <div class="carte">
      <div class="carte__tete"><h3>Joindre la salle</h3></div>
      <div class="grille2">
        <div class="champ"><label for="f-tel">Téléphone (affiché)</label><input id="f-tel" type="text" value="${echappe(s.phone)}" /></div>
        <div class="champ"><label for="f-telh">Téléphone (pour appeler)</label><input id="f-telh" type="text" value="${echappe(s.phoneHref)}" /><span class="aide">Format international, sans espace : +33562244682</span></div>
        <div class="champ"><label for="f-mail">Email</label><input id="f-mail" type="text" value="${echappe(s.email)}" /></div>
        <div class="champ"><label for="f-heures">Horaires (affichés)</label><input id="f-heures" type="text" value="${echappe(s.hours)}" /><span class="aide">Ex. Lun – Sam · 10h00 – 21h30</span></div>
      </div>
    </div>
    <div class="carte">
      <div class="carte__tete"><h3>L'adresse</h3></div>
      <div class="grille2">
        <div class="champ"><label for="f-rue">Rue</label><input id="f-rue" type="text" value="${echappe(a.street)}" /></div>
        <div class="champ"><label for="f-cp">Code postal</label><input id="f-cp" type="text" value="${echappe(a.zip)}" /></div>
        <div class="champ"><label for="f-ville">Ville</label><input id="f-ville" type="text" value="${echappe(a.city)}" /></div>
        <div class="champ"><label for="f-full">Adresse complète (une ligne)</label><input id="f-full" type="text" value="${echappe(a.full)}" /><span class="aide">C'est cette ligne-là qui s'affiche en pied de page.</span></div>
      </div>
    </div>
    <div class="carte">
      <div class="carte__tete"><h3>La note d'accueil</h3></div>
      <div class="champ"><label for="f-note">Consigne affichée aux visiteurs</label><textarea id="f-note">${echappe(s.note)}</textarea><span class="aide">Ex. l'émargement GPS demandé en salle avant chaque cours.</span></div>
    </div>`;

  const maj = () => {
    const suivant = {
      ...s,
      phone: $("#f-tel").value, phoneHref: $("#f-telh").value,
      email: $("#f-mail").value, hours: $("#f-heures").value,
      note: $("#f-note").value,
      address: { ...a, street: $("#f-rue").value, zip: $("#f-cp").value, city: $("#f-ville").value, full: $("#f-full").value },
    };
    ecrire("salle", suivant);
  };
  $("#pane").querySelectorAll("input, textarea").forEach((el) => el.addEventListener("input", maj));
}

/* ------------------------------- TARIFS --------------------------- */
function vueTarifs() {
  const t = valeur("tarifs") || [];
  $("#pane").innerHTML = `
    <p class="intro">Une carte par offre de la page Tarifs. <b>L'Offre Rentrée se dit « 29 € par personne »</b>, jamais « pour deux » : c'est la formule officielle, et elle évite un malentendu à l'accueil.</p>
    ${t.map((o, i) => `
      <div class="carte" data-i="${i}">
        <div class="carte__tete"><h3>${echappe(o.name)}</h3></div>
        <div class="grille2">
          <div class="champ"><label>Nom de l'offre</label><input data-f="name" type="text" value="${echappe(o.name)}" /></div>
          <div class="champ"><label>Prix</label><input data-f="price" type="text" value="${echappe(o.price)}" /></div>
          <div class="champ"><label>Période</label><input data-f="period" type="text" value="${echappe(o.period)}" /><span class="aide">Ex. la séance, / personne, / 12 mois</span></div>
          <div class="champ"><label>Ligne de résumé</label><input data-f="feature" type="text" value="${echappe(o.feature)}" /></div>
        </div>
        <div class="champ"><label>Les points, un par ligne</label><textarea data-f="items">${echappe((o.items || []).join("\n"))}</textarea></div>
      </div>`).join("")}`;

  recolteur = () => {
    const suivant = [...$("#pane").querySelectorAll(".carte")].map((c, i) => {
      const g = (f) => c.querySelector(`[data-f="${f}"]`).value;
      return { ...t[i], name: g("name"), price: g("price"), period: g("period"), feature: g("feature"), items: g("items").split("\n").map((x) => x.trim()).filter(Boolean) };
    });
    ecrire("tarifs", suivant);
  };
}

/* ------------------------------- COACHS --------------------------- */
function vueCoachs() {
  const c = valeur("coaches") || [];
  $("#pane").innerHTML = `
    <p class="intro">Une carte par coach. <b>Les photos ne se changent pas d'ici</b> : un nom ne doit jamais se retrouver sous le visage d'un autre. Pour une photo, passe par la personne qui gère le site.</p>
    ${c.map((m, i) => `
      <div class="carte" data-i="${i}">
        <div class="carte__tete"><h3>${echappe(m.name)}</h3></div>
        <div class="grille2">
          <div class="champ"><label>Prénom affiché</label><input data-f="name" type="text" value="${echappe(m.name)}" /></div>
          <div class="champ"><label>Rôle — les cours qu'il ou elle tient</label><input data-f="role" type="text" value="${echappe(m.role)}" /></div>
        </div>
        <div class="champ"><label>Présentation</label><textarea data-f="note">${echappe(m.note)}</textarea></div>
      </div>`).join("")}`;

  recolteur = () => {
    const suivant = [...$("#pane").querySelectorAll(".carte")].map((el, i) => {
      const g = (f) => el.querySelector(`[data-f="${f}"]`).value;
      return { ...c[i], name: g("name"), role: g("role"), note: g("note") };
    });
    ecrire("coaches", suivant);
  };
}

/* ------------------------------ PLANNING -------------------------- */
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function vuePlanning() {
  const s = valeur("schedule") || [];
  $("#pane").innerHTML = `
    <p class="intro">La grille des cours, jour par jour. Une ligne = un cours : l'heure, le nom, le coach. <b>Garde le format d'heure de la salle</b> (12h40, 18h40, 19h45) — c'est lui qui trie la grille du site.</p>
    ${JOURS.map((j) => `
      <div class="carte" data-jour="${j}">
        <div class="carte__tete"><h3>${j}</h3><button class="btn btn--fantome btn--petit" type="button" data-ajout="${j}">+ Ajouter un cours</button></div>
        <div class="creneaux">
          ${s.filter((x) => x.day === j).map((x) => ligneCreneau(x)).join("") || `<p class="aide" style="color:var(--muted);font-size:var(--step--2)">Aucun cours ce jour-là.</p>`}
        </div>
      </div>`).join("")}`;

  const recolte = () => {
    const suivant = [];
    $("#pane").querySelectorAll(".carte").forEach((c) => {
      const jour = c.dataset.jour;
      c.querySelectorAll(".creneau").forEach((l) => {
        const g = (f) => l.querySelector(`[data-f="${f}"]`).value.trim();
        const ancien = s.find((x) => x.day === jour && x.start === g("start") && x.cours === g("cours")) || {};
        if (g("start") || g("cours")) suivant.push({ ...ancien, day: jour, start: g("start"), cours: g("cours"), coach: g("coach") });
      });
    });
    ecrire("schedule", suivant);
  };

  recolteur = recolte;
  cliqueur = (e) => {
    const ajout = e.target.closest("[data-ajout]");
    if (ajout) {
      const zone = ajout.closest(".carte").querySelector(".creneaux");
      const vide = zone.querySelector("p.aide");
      if (vide) vide.remove();
      zone.insertAdjacentHTML("beforeend", ligneCreneau({ start: "", cours: "", coach: "" }));
      zone.querySelector(".creneau:last-of-type input")?.focus();
      recolte();
      return;
    }
    const sup = e.target.closest(".sup");
    if (sup) { sup.closest(".creneau").remove(); recolte(); }
  };
}

const ligneCreneau = (x) => `
  <div class="creneau">
    <input data-f="start" type="text" value="${echappe(x.start)}" aria-label="Heure" placeholder="18h40" />
    <input data-f="cours" type="text" value="${echappe(x.cours)}" aria-label="Nom du cours" placeholder="Boxing Camp" />
    <input class="coach" data-f="coach" type="text" value="${echappe(x.coach)}" aria-label="Coach" placeholder="Coach" />
    <button class="sup" type="button" aria-label="Supprimer ce cours" title="Supprimer ce cours">✕</button>
  </div>`;

/* --------------------------- PUBLIER / ANNULER -------------------- */
$("#publier").addEventListener("click", async () => {
  if (!sale()) return;
  const b = $("#publier");
  b.disabled = true;
  const avant = b.textContent;
  b.textContent = "Publication…";
  try {
    const contenu = { ...app.calque, ...app.brouillon };
    const r = await api("/api/admin/content", { method: "POST", body: JSON.stringify({ content: contenu }) });
    app.calque = contenu;
    app.brouillon = {};
    try { localStorage.removeItem(BROUILLON); } catch {}
    majEtat();
    const el = $("#etat");
    el.className = "etat etat--bon";
    el.textContent = r.redeploiement
      ? "Publié — le site se reconstruit, à jour dans une minute environ."
      : "Publié — le site se mettra à jour au prochain déploiement.";
  } catch (e) {
    const el = $("#etat");
    el.className = "etat etat--sale";
    el.textContent = "Échec : " + e.message;
  } finally {
    b.textContent = avant;
    majEtat();
  }
});

$("#annuler").addEventListener("click", () => {
  if (!sale()) return;
  if (!confirm("Jeter toutes les modifications non publiées et revenir à la version en ligne ?")) return;
  app.brouillon = {};
  try { localStorage.removeItem(BROUILLON); } catch {}
  rendreSection(app.section);
  majEtat();
});

$("#guideBtn").addEventListener("click", () => lancerVisite());
$("#sortir").addEventListener("click", () => {
  try { sessionStorage.removeItem(CLE_TOKEN); } catch {}
  location.reload();
});

/* on prévient avant de perdre un brouillon en fermant l'onglet */
addEventListener("beforeunload", (e) => { if (sale()) { e.preventDefault(); e.returnValue = ""; } });

/* le vestiaire est accessible au guide (tour.js) */
window.vestiaire = { section: rendreSection, etat: majEtat };

/* reprise de session : on ne redemande pas le mot de passe à chaque onglet */
(async () => {
  let t = "";
  try { t = sessionStorage.getItem(CLE_TOKEN) || ""; } catch {}
  if (!t) return;
  app.token = t;
  try {
    const s = await api("/api/admin/session");
    app.capacites = s.capacites || {};
    await entrer();
  } catch {
    app.token = "";
    try { sessionStorage.removeItem(CLE_TOKEN); } catch {}
  }
})();
