/* =====================================================================
   RAMONVILLE · chatbot.js — l’assistant du plateau.

   CE QUE C’EST : une conversation, pas un formulaire. Le bot se présente,
   demande le prénom (comme un coach à l’accueil), puis RÉPOND — via
   /api/chat, ancré sur les vraies données de la salle. Il capte les
   coordonnées AU FIL DE L’EAU, quand le visiteur les donne de lui-même,
   et les transmet au staff dès qu’il y a de quoi rappeler quelqu’un.
   Personne n’est interrogé de force, personne n’est bloqué.

   CE QUE ÇA REMPLACE : une pastille qui pointait sur `tel:` — un faux
   chatbot. Le lien tel: reste le REPLI sans JavaScript : la pastille est
   toujours un vrai lien dans le HTML, on ne fait que la surclasser ici.

   ACCESSIBILITÉ : dialogue nommé, focus piégé tant qu’il est ouvert,
   Échap ferme et rend le focus à la pastille, le fil est un `log`
   aria-live pour que chaque réponse soit annoncée, et l’animation
   d’ouverture est purement décorative (prefers-reduced-motion respecté
   côté CSS — rien ici ne dépend d’une transition pour être lisible).
   ===================================================================== */
import { QUICKS, fallbackAnswer } from "./chatbot-kb.js?v=18";
import { SALLE, NETWORK } from "./data.js?v=18";

/* --------------------------- LES MOTIFS ---------------------------- */
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
/* numéro FR : +33 ou 0, puis 9 chiffres groupés librement */
const PHONE_RE = /(?:\+33|0)\s?[1-9](?:[\s.\-]?\d{2}){4}/;
/* déclencheurs SPÉCIFIQUES d’un prénom — jamais un « c’est » nu, qui
   capterait « c’est ouvert le samedi ? » et baptiserait le visiteur Ouvert */
const NAME_RE = /(?:je m['’ ]?appelle|moi c['’ ]?est|mon nom est|mon pr[ée]nom (?:est|c['’ ]?est)|je me nomme|c['’ ]?est moi)\s+([a-zà-öø-ÿ][a-zà-öø-ÿ'’-]+)/i;
const STOP_NAMES = /^(bonjour|salut|coucou|hello|merci|oui|non|ok|d['’]accord|bien|super|cool|pas|ouvert|ferm[ée]?|combien|quoi|rien|voir|bof|peut|je|tu|il|elle|on|nous|vous|un|une|le|la|les|des|pour|avec|sans)$/i;

const SESSION_KEY = "bc-ram-chat";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const capitale = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

function sessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY, id); }
    return id;
  } catch { return String(Date.now()) + Math.random().toString(16).slice(2); }
}

/* LE PROFIL SURVIT À LA NAVIGATION.
   Le site fait huit pages : sans ça, un visiteur qui donne son prénom sur
   l’accueil puis son numéro sur la page Tarifs repartait de zéro à chaque
   chargement — le bot le vouvoyait à nouveau, et le staff recevait deux
   demi-fiches au lieu d’une personne. Le profil est donc rangé à côté de
   l’identifiant de session, dans le même sessionStorage : il vit le temps
   de l’onglet, pas une seconde de plus. */
const PROFIL_KEY = "bc-ram-chat-profil";
function lireProfil() {
  const vide = { prenom: "", nom: "", email: "", phone: "", salle: "" };
  try { return { ...vide, ...JSON.parse(sessionStorage.getItem(PROFIL_KEY) || "{}") }; }
  catch { return vide; }
}
function ecrireProfil(p) {
  try { sessionStorage.setItem(PROFIL_KEY, JSON.stringify(p)); } catch {}
}

/* --------------------------- LE RÉSEAU ----------------------------- */
async function askAi(message, history, context) {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, context }),
  });
  if (!r.ok) throw new Error("chat " + r.status);
  const j = await r.json();
  if (!j.reply) throw new Error("chat vide");
  return j.reply;
}
function submitLead(payload) {
  return fetch("/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ salle: "Ramonville", page: location.pathname, ...payload }),
  });
}

/* ============================ LE WIDGET ============================ */

/* La pensée Portet émulée : clés fermées → vrais boutons sous les messages. */
const ACTIONS = {
  offre:       { label: "Je prends ma place — 29€", href: "https://box-plus.vercel.app/abonnements#promo" },
  saison:      { label: "Je réserve ma saison · 259€", href: "https://box-plus.vercel.app/abonnements#promo" },
  essai:       { label: "Je viens essayer · 10€", href: "https://box-plus.vercel.app/seance-essai" },
  enfants:     { label: "J’inscris mon enfant", href: "https://box-plus.vercel.app/abonnements#enfants" },
  abonnements: { label: "Voir les abonnements", href: "https://box-plus.vercel.app/abonnements" },
  boutique:    { label: "La boutique du club", href: "https://box-plus.vercel.app/" },
  tarifs:      { label: "Les tarifs en détail", href: "/tarifs/" },
  planning:    { label: "Voir le planning", href: "/plannings/" },
  disciplines: { label: "Découvrir les cours", href: "/activites/" },
  plateau:     { label: "Voir le plateau", href: "/la-salle/" },
  coachs:      { label: "Rencontrer les coachs", href: "/coachs/" },
  galerie:     { label: "Voir la galerie", href: "/galerie/" },
  contact:     { label: "Adresse & contact", href: "/contact/" },
  appeler:     { label: "Appeler la salle", href: "tel:+33562244682" },
  offert:      { label: "Je réserve ma séance offerte", href: "/seance-offerte/" },
  rappel:      { label: "Être rappelé par un coach", act: "rappel" },
};
function resolveActions(keys) {
  const out = [];
  for (const k of keys) {
    const [key, ...rest] = String(k).split(":");
    const def = ACTIONS[key.trim()];
    if (!def) continue;
    const label = rest.join(":").trim();
    if (!out.some((a) => (a.href || a.act) === (def.href || def.act))) out.push(label ? { ...def, label } : def);
    if (out.length >= 3) break;
  }
  return out;
}
function parseReply(brut) {
  let text = String(brut);
  const keys = [];
  text = text.replace(/\[\s*(?:boutons|buttons)\s*:\s*([^\]]+)\]/gi, (_, list) => {
    keys.push(...list.split(",").map((s) => s.trim()).filter(Boolean));
    return "";
  });
  text = text.replace(/(?:https?:\/\/)?box-plus\.vercel\.app[\w\/#-]*/gi, (u) => {
    const href = (u.startsWith("http") ? u : "https://" + u).replace(/\/$/, "");
    const hit = Object.entries(ACTIONS).find(([, d]) => (d.href || "").replace(/\/$/, "") === href);
    if (hit && !keys.some((k) => k.split(":")[0] === hit[0])) keys.push(hit[0]);
    return hit ? "la boutique en ligne" : u;
  });
  text = text.replace(/\s{2,}/g, " ").replace(/\s+([.,!?])/g, "$1").trim();
  return { text, actions: resolveActions(keys) };
}

export function initChatbot() {
  const launcher = document.querySelector("a.chatbot, button.chatbot");
  if (!launcher || document.getElementById("bcr-chat")) return;

  const sid = sessionId();
  const profil = lireProfil();
  const historique = [];
  let ouvertUneFois = false;
  let enTrainDeTaper = false;
  let echanges = 0;        // réponses données par le bot
  let relanceFaite = false; // l’invitation douce a-t-elle été passée ?
  let attendPrenom = false; // le bot vient de demander le prénom
  /* la signature repart du profil DÉJÀ connu : si le lead a été transmis
     sur une page précédente, on ne le retransmet pas au chargement suivant */
  let signature = profil.email || profil.phone ? JSON.stringify(profil) : "";
  let rappelDemande = false;

  /* la pastille devient un vrai bouton de dialogue — le href reste dans
     l’attribut, comme filet : si ce script ne s’exécute pas, le lien
     appelle la salle exactement comme avant. */
  launcher.setAttribute("role", "button");
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-haspopup", "dialog");
  launcher.setAttribute("aria-label", "Ouvrir l’assistant de Boxing Center Ramonville");
  const etiquette = launcher.querySelector(".chatbot__label");
  if (etiquette) etiquette.innerHTML = "Une question&nbsp;? Parle au coach";

  const racine = document.createElement("div");
  racine.className = "bcr-chat";
  racine.id = "bcr-chat";
  racine.innerHTML = `
    <section class="bcr-chat__panel" id="bcr-panel" role="dialog" aria-modal="true"
             aria-label="Assistant de Boxing Center Ramonville" hidden>
      <header class="bcr-chat__head">
        <span class="bcr-chat__sigil" aria-hidden="true">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="9">
            <path d="M65.6 16.8 L134.4 16.8 L183.2 65.6 L183.2 134.4 L134.4 183.2 L65.6 183.2 L16.8 134.4 L16.8 65.6 Z"/>
          </svg>
        </span>
        <span class="bcr-chat__head-text">
          <b>Boxing Center Ramonville</b>
          <span class="bcr-chat__status">L’assistant du plateau</span>
        </span>
        <button type="button" class="bcr-chat__close" id="bcr-close" aria-label="Fermer l’assistant">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
        </button>
      </header>
      <div class="bcr-chat__log" id="bcr-log" role="log" aria-live="polite" aria-atomic="false"></div>
      <div class="bcr-chat__foot">
        <div class="bcr-chat__chips" id="bcr-chips" hidden></div>
        <form class="bcr-chat__form" id="bcr-form">
          <label class="sr-only" for="bcr-input">Ton message</label>
          <input class="bcr-chat__input" id="bcr-input" type="text" autocomplete="off"
                 placeholder="Écris ta question…" />
          <button class="bcr-chat__send" type="submit" aria-label="Envoyer le message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 12h14M14 6l6 6-6 6" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </form>
        <p class="bcr-chat__legal">Réponses ancrées sur les infos du club · la salle : <a href="tel:${SALLE.phoneHref}">${SALLE.phone}</a></p>
      </div>
    </section>`;
  document.body.appendChild(racine);

  const panneau = racine.querySelector("#bcr-panel");
  const logEl = racine.querySelector("#bcr-log");
  const chipsEl = racine.querySelector("#bcr-chips");
  const form = racine.querySelector("#bcr-form");
  const input = racine.querySelector("#bcr-input");
  const closeBtn = racine.querySelector("#bcr-close");

  const messages = [];

  /* ------------------------ RENDU DU FIL --------------------------- */
  const echappe = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

  function rendre() {
    logEl.innerHTML =
      messages
        .map((m) => {
          const actions = m.actions && m.actions.length ? `<div class="bcr-chat__actions">${m.actions.map((a) => {
            if (a.act) return `<button type="button" class="bcr-chat__action bcr-chat__action--ext" data-act="${a.act}">${echappe(a.label)}</button>`;
            const ext = /^https?:/i.test(a.href);
            return `<a class="bcr-chat__action${ext ? " bcr-chat__action--ext" : ""}" href="${a.href.replace(/"/g, "&quot;")}"${ext ? ` target="_blank" rel="noopener"` : ""}>${echappe(a.label)}</a>`;
          }).join("")}</div>` : "";
          return `<div class="bcr-chat__msg bcr-chat__msg--${m.role}"><div class="bcr-chat__stack"><div class="bcr-chat__bubble">${echappe(m.text)}</div>${actions}</div></div>`;
        })
        .join("") +
      (enTrainDeTaper
        ? `<div class="bcr-chat__msg bcr-chat__msg--bot"><div class="bcr-chat__bubble"><span class="bcr-chat__dots" aria-label="L’assistant écrit"><i></i><i></i><i></i></span></div></div>`
        : "");
    logEl.scrollTop = logEl.scrollHeight;
  }
  async function botDit(text, pause = 520, actions) {
    enTrainDeTaper = true; rendre();
    await delay(pause);
    enTrainDeTaper = false;
    messages.push({ role: "bot", text, actions });
    rendre();
  }
  const visiteurDit = (text) => { messages.push({ role: "user", text }); rendre(); };
  logEl.addEventListener("click", (e) => {
    const act = e.target.closest("button[data-act]");
    if (act && act.dataset.act === "rappel") demanderRappel();
    /* Le laissez-passer de la seance offerte : sans ce jeton depose par le
       bot au moment ou il l'offre, l'URL rend une 404. */
    const lien = e.target.closest('a[href^="/seance-offerte"]');
    if (lien) { try { sessionStorage.setItem("bcr-offert-pass", String(Date.now())); } catch (_) {} }
  });

  /* -------------------------- SUGGESTIONS -------------------------- */
  function montrerChips() {
    chipsEl.hidden = false;
    chipsEl.innerHTML =
      QUICKS.slice(0, 4)
        .map((q) => `<button type="button" data-q="${echappe(q.q).replace(/"/g, "&quot;")}">${echappe(q.label)}</button>`)
        .join("") + `<button type="button" data-rappel>Être rappelé</button>`;
  }
  const cacherChips = () => { chipsEl.hidden = true; chipsEl.innerHTML = ""; };

  /* --------------- CAPTURE DES COORDONNÉES AU FIL DE L’EAU --------- */
  function contexte() {
    const bits = [];
    if (profil.prenom) bits.push(`Prénom : ${profil.prenom}`);
    if (profil.salle) bits.push(`Salle évoquée : ${profil.salle}`);
    if (profil.email) bits.push("Email déjà donné");
    if (profil.phone) bits.push("Téléphone déjà donné");
    return bits.join(". ");
  }

  /** Envoi au staff — seulement s’il y a de quoi rappeler, et une seule
      fois par état du profil (la signature évite le doublon). */
  function peutEtreEnvoyer(event) {
    if (!profil.email && !profil.phone) return false;
    const sig = JSON.stringify(profil);
    if (sig === signature) return false;
    signature = sig;
    submitLead({ event, sessionId: sid, ...profil, name: [profil.prenom, profil.nom].filter(Boolean).join(" ").trim() })
      .catch(() => { /* silencieux : un lead qui échoue ne casse jamais la conversation */ });
    return true;
  }

  /** Extrait prénom / email / téléphone / salle. true si du neuf est capté. */
  function extraire(texte) {
    let neuf = false;

    const email = texte.match(EMAIL_RE);
    if (email && !profil.email) { profil.email = email[0]; neuf = true; }

    const phone = texte.match(PHONE_RE);
    if (phone && !profil.phone) { profil.phone = phone[0].replace(/\s+/g, " ").trim(); neuf = true; }

    if (!profil.salle) {
      const salle = (NETWORK || []).find(
        (s) => !s.self && new RegExp(`\\b${s.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(texte)
      );
      if (salle) { profil.salle = salle.name; neuf = true; }
    }

    if (!profil.prenom) {
      const m = texte.match(NAME_RE);
      let nom = m?.[1]?.trim();
      /* le bot vient de demander le prénom : un mot seul suffit — mais on
         refuse ce qui n’est visiblement pas un prénom (chiffre, email,
         mot outil), sinon on baptise les gens « Merci » ou « 18h ». */
      if (!nom && attendPrenom) {
        const mots = texte.trim().split(/\s+/).filter(Boolean);
        const w = mots[0];
        if (w && mots.length <= 3 && !EMAIL_RE.test(w) && !/\d/.test(w) && /^[a-zà-öø-ÿ'’-]{2,}$/i.test(w) && !STOP_NAMES.test(w))
          nom = w;
      }
      if (nom && !STOP_NAMES.test(nom)) { profil.prenom = capitale(nom.split(/\s+/)[0]); neuf = true; }
    }

    attendPrenom = false;
    if (neuf) ecrireProfil(profil);
    return neuf;
  }

  /* --------------------------- LA RÉPONSE -------------------------- */
  async function repondre(texte) {
    const neuf = extraire(texte);
    const envoye = neuf ? peutEtreEnvoyer(rappelDemande ? "callback_request" : "lead_collected") : false;

    cacherChips();
    let reponse, boutons = [];
    try {
      const lu = parseReply(await askAi(texte, historique.slice(-6), contexte()));
      reponse = lu.text; boutons = lu.actions;
    } catch {
      const lu = parseReply(fallbackAnswer(texte)); // hors-ligne / dev : la base locale
      reponse = lu.text; boutons = lu.actions;
    }
    historique.push({ role: "user", content: texte }, { role: "assistant", content: reponse });
    await botDit(reponse, 520, boutons);
    echanges++;

    if (envoye && rappelDemande) {
      rappelDemande = false;
      await botDit(
        `C’est noté${profil.prenom ? `, ${profil.prenom}` : ""} — je passe ça aux coachs, on te rappelle.`,
        460
      );
    } else if (!relanceFaite && echanges >= 2 && !profil.email && !profil.phone) {
      /* l’invitation douce, UNE seule fois. Si elle est ignorée, on n’y
         revient jamais : on continue à répondre, c’est tout. */
      relanceFaite = true;
      await botDit(
        "Au fait — si tu veux qu’un coach te rappelle ou te cale un créneau d’essai, laisse-moi ton prénom et un numéro ou un email. Sinon on continue, ça marche aussi.",
        460
      );
    }
    montrerChips();
  }

  async function demanderRappel() {
    rappelDemande = true;
    cacherChips();
    if (profil.email || profil.phone) {
      peutEtreEnvoyer("callback_request");
      await botDit(
        `Ça marche${profil.prenom ? `, ${profil.prenom}` : ""} — je transmets, un coach te rappelle. En attendant, une question sur le plateau ?`
      );
      rappelDemande = false;
      montrerChips();
      return;
    }
    attendPrenom = !profil.prenom;
    await botDit(
      profil.prenom
        ? `Avec plaisir ${profil.prenom} — laisse-moi un numéro ou un email et un coach te rappelle.`
        : "Avec plaisir — donne-moi ton prénom et un numéro (ou un email), et un coach te rappelle."
    );
    input.placeholder = "Ton prénom et ton numéro…";
    montrerChips();
  }

  /* -------------------- OUVERTURE / FERMETURE ---------------------- */
  const focusables = () =>
    [...panneau.querySelectorAll('button, input, a[href], [tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);

  async function ouvrir() {
    panneau.hidden = false;
    launcher.classList.add("is-open");
    launcher.setAttribute("aria-expanded", "true");
    launcher.setAttribute("aria-label", "Fermer l’assistant de Boxing Center Ramonville");
    input.focus();
    if (!ouvertUneFois) {
      ouvertUneFois = true;
      await botDit(
        profil.prenom
          ? `Re-salut ${profil.prenom} ! Je suis toujours là — créneaux, octogone, tarifs, école enfants : demande.`
          : "Salut ! Je suis l’assistant de Boxing Center Ramonville — la salle qui s’entraîne dehors, 33 rue des Ormes. L’offre de la rentrée est à 29 € par personne — et je réponds sur les créneaux, l’octogone, l’école enfants.",
        700,
        resolveActions(["offre", "essai"])
      );
      /* on ne redemande JAMAIS un prénom déjà donné — c’est la première
         chose qui trahit un robot */
      if (!profil.prenom) {
        attendPrenom = true;
        await botDit("Dis-moi d’abord ton prénom, qu’on se parle correctement.", 520);
      }
      montrerChips();
    }
  }
  function fermer(rendreFocus = true) {
    panneau.hidden = true;
    launcher.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-label", "Ouvrir l’assistant de Boxing Center Ramonville");
    if (rendreFocus) launcher.focus();
  }
  const estOuvert = () => !panneau.hidden;

  /* ---------------------------- ÉVÉNEMENTS ------------------------- */
  launcher.addEventListener("click", (e) => {
    e.preventDefault(); // le href tel: reste le repli sans JS, pas la destination
    estOuvert() ? fermer() : void ouvrir();
  });
  closeBtn.addEventListener("click", () => fermer());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texte = input.value.trim();
    if (!texte || enTrainDeTaper) return;
    input.value = "";
    input.placeholder = "Écris ta question…";
    visiteurDit(texte);
    await repondre(texte);
  });

  chipsEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.hasAttribute("data-rappel")) { await demanderRappel(); return; }
    const q = btn.dataset.q;
    if (q) { cacherChips(); visiteurDit(q); await repondre(q); }
  });

  /* Échap ferme · Tab reste piégé dans le dialogue tant qu’il est ouvert */
  document.addEventListener("keydown", (e) => {
    if (!estOuvert()) return;
    if (e.key === "Escape") { e.stopPropagation(); fermer(); return; }
    if (e.key !== "Tab") return;
    const f = focusables();
    if (!f.length) return;
    const premier = f[0], dernier = f[f.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  });
}

initChatbot();
