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
import { QUICKS, fallbackAnswer } from "./chatbot-kb.js?v=19";
import { SALLE, NETWORK } from "./data.js?v=19";

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

/* ------------------------------------------------------------------ *
 *  LA SIGNATURE DE L’ASSISTANT DANS LA BOUTIQUE.
 *
 *  Jusqu’ici, un visiteur envoyé par le bot vers box-plus arrivait
 *  ANONYME : la boutique voyait une visite de plus, jamais « celle-ci
 *  vient du chat de Ramonville ». On ne pouvait donc pas prouver que
 *  l’assistant vend — ni décider quoi que ce soit sur cette base.
 *
 *  `boutique()` colle la signature sur les seuls liens sortants (les
 *  liens internes, /tarifs/ ou /plannings/, n’ont rien à signer : la
 *  page suivante est déjà chez nous).
 *
 *  L’ANCRE RESTE LA DERNIÈRE. `#promo` est ce qui fait ouvrir le bon
 *  rayon de la boutique : une URL qui finirait par `#promo?utm_source=…`
 *  enverrait le visiteur en haut de la page des abonnements, et la vente
 *  la mieux amenée se perdrait dans le défilement. La requête se glisse
 *  donc AVANT le croisillon, jamais après.
 * ------------------------------------------------------------------ */
const UTM = "utm_source=chatbot&utm_medium=bouton&utm_campaign=bc-ramonville";
function boutique(url) {
  const [base, ancre] = String(url).split("#");
  return base + (base.includes("?") ? "&" : "?") + UTM + (ancre ? "#" + ancre : "");
}

/* La pensée Portet émulée : clés fermées → vrais boutons sous les messages. */
const ACTIONS = {
  offre:       { label: "Je prends ma place — 29€", href: boutique("https://boutique.boxingcenter.fr/offre/29") },
  saison:      { label: "Je réserve ma saison · 259€", href: boutique("https://boutique.boxingcenter.fr/offre/259") },
  essai:       { label: "Je viens essayer · 10€", href: boutique("https://boutique.boxingcenter.fr/seance-essai") },
  enfants:     { label: "J’inscris mon enfant", href: boutique("https://boutique.boxingcenter.fr/abonnements") },
  abonnements: { label: "Voir les abonnements", href: boutique("https://boutique.boxingcenter.fr/abonnements") },
  boutique:    { label: "La boutique du club", href: boutique("https://boutique.boxingcenter.fr/") },
  premiere:    { label: "Comment se passe la 1re séance", href: "/premiere-seance/" },
  tarifs:      { label: "Les tarifs en détail", href: "/tarifs/" },
  planning:    { label: "Voir le planning", href: "/plannings/" },
  disciplines: { label: "Découvrir les cours", href: "/activites/" },
  plateau:     { label: "Voir le plateau", href: "/la-salle/" },
  coachs:      { label: "Rencontrer les coachs", href: "/coachs/" },
  galerie:     { label: "Voir la galerie", href: "/galerie/" },
  contact:     { label: "Adresse & contact", href: "/contact/" },
  appeler:     { label: "Appeler la salle", href: "tel:+33562244682" },
  rappel:      { label: "Être rappelé par un coach", act: "rappel" },
};
/* L’adresse NUE d’une action, signature retirée : c’est elle qui sert à
   reconnaître une URL écrite en clair par le modèle (qui, lui, n’écrit
   jamais d’utm_) et à éviter deux boutons pour la même destination.
   L’ANCRE EST GARDÉE : sans elle, « abonnements » et « abonnements#promo »
   se confondraient et l’un des deux boutons disparaîtrait. */
function nue(href) {
  const [base, ancre] = String(href || "").split("#");
  return base.split("?")[0].replace(/\/$/, "") + (ancre ? "#" + ancre : "");
}
function resolveActions(keys) {
  const out = [];
  for (const k of keys) {
    const [key, ...rest] = String(k).split(":");
    const def = ACTIONS[key.trim()];
    if (!def) continue;
    const label = rest.join(":").trim();
    if (!out.some((a) => (a.href ? nue(a.href) : a.act) === (def.href ? nue(def.href) : def.act))) out.push(label ? { ...def, label } : def);
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
    /* le modèle écrit l’adresse sans signature : on compare donc du nu au nu,
       sinon plus aucune URL en clair ne serait reconnue et le bot laisserait
       traîner une URL brute dans sa phrase au lieu d’un bouton. */
    const href = nue(u.startsWith("http") ? u : "https://" + u);
    const hit = Object.entries(ACTIONS).find(([, d]) => nue(d.href) === href);
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
  let reponsesRendues = 0;  // combien de fois il a VRAIMENT repondu a une question
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

  /* IL A UN NOM ET UN VISAGE. Il s'annoncait « L'assistant du plateau » :
     pas de nom, pas de visage, pas de signature — il parlait de lui a la
     troisieme personne, comme un service. Portet a Gus depuis longtemps.
     Otto, c'est l'octogone du site devenu personnage : la signature de la
     salle, huit cotes, huit disciplines. Meme loi de construction que la
     mascotte de Portet — un disque, UN objet, deux yeux, rien d'autre —
     et verifie a 26 px, la taille du plus petit avatar du fil. */
  const BOT_NOM = "Otto";
  const BOT_AVATAR = "/assets/img/ram/mascotte.svg";

  const racine = document.createElement("div");
  racine.className = "bcr-chat";
  racine.id = "bcr-chat";
  racine.innerHTML = `
    <section class="bcr-chat__panel" id="bcr-panel" data-lenis-prevent role="dialog" aria-modal="true"
             aria-label="Assistant de Boxing Center Ramonville" hidden>
      <header class="bcr-chat__head">
        <img class="bcr-chat__avatar" src="${BOT_AVATAR}" alt="" width="40" height="40" decoding="async" />
        <span class="bcr-chat__head-text">
          <b>${BOT_NOM} · Boxing Center Ramonville</b>
          <span class="bcr-chat__status">L’assistant de la salle</span>
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
        <p class="bcr-chat__legal">Réponses ancrées sur les infos du club.</p>
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
          const face = m.role === "bot"
            ? `<img class="bcr-chat__msg-avatar" src="${BOT_AVATAR}" alt="" width="26" height="26" decoding="async" />`
            : "";
          return `<div class="bcr-chat__msg bcr-chat__msg--${m.role}">${face}<div class="bcr-chat__stack"><div class="bcr-chat__bubble">${echappe(m.text)}</div>${actions}</div></div>`;
        })
        .join("") +
      (enTrainDeTaper
        ? `<div class="bcr-chat__msg bcr-chat__msg--bot"><img class="bcr-chat__msg-avatar" src="${BOT_AVATAR}" alt="" width="26" height="26" decoding="async" /><div class="bcr-chat__bubble"><span class="bcr-chat__dots" aria-label="${BOT_NOM} écrit"><i></i><i></i><i></i></span></div></div>`
        : "");
    logEl.scrollTop = logEl.scrollHeight;
  }
  /* Le moment ou le prenom devient une question naturelle : deux reponses
     rendues, et on ne l'a pas encore. Une seule fois. */
  async function peutEtreDemanderPrenom() {
    if (profil.prenom || attendPrenom || reponsesRendues < 2) return;
    attendPrenom = true;
    await botDit("Au fait, moi c’est Otto — et toi ?", 520);
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
    /* Une VRAIE reponse vient d'etre rendue. C'est ce compteur-la, et pas le
       nombre de tours, qui autorise la question du prenom : on ne demande
       rien avant d'avoir servi a quelque chose. */
    if (!attendPrenom) reponsesRendues++;
    await peutEtreDemanderPrenom();

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

      /* LES HUIT OUVERTURES — une par page, deux phrases, un fait vrai et UNE
     question. Elles ont été reprises le 24/08/2026 pour trois raisons :

       · Otto VOUVOYAIT. 21 « vous / votre » contre 9 « tu / ton » dans ce
         seul fichier, alors que tout le site tutoie — « Ce qui t'attend le
         premier soir », « Ta 1re fois », et jusqu'à sa propre zone de
         saisie, « Écris ta question… ». Ses boutons disaient « Je prends
         ma place » pendant qu'il répondait « posez votre question ». Deux
         personnes dans la même fenêtre.

       · Il ne se NOMMAIT pas : « Je suis l'assistant de Boxing Center
         Ramonville » est une fonction, pas quelqu'un. Il se présente une
         fois, au premier message, et plus jamais ensuite.

       · /tarifs/ ouvrait sur la GRILLE — « Six formules. La rentrée à 29 €
         est la plus prise. » C'est le catalogue lâché avant de savoir ce que
         la personne cherche, et six options font chuter la décision. Une
         question de situation d'abord ; les prix viennent après, et deux au
         maximum.

     Deux faits périmés corrigés au passage : « six clichés » (la galerie en
     porte vingt-quatre depuis ce matin) et « six formules » (la page en
     compte sept). Chiffres vérifiés dans data.js, un par un.

     JAMAIS DEUX QUESTIONS dans la même bulle : on ne répond qu'à la
     dernière, et la première information est perdue. */
    const ACCUEILS = {
      "/tarifs/": ["Salut 👋 Moi c’est Otto.", "Avant de te sortir des prix : c’est pour toi ou pour ton enfant ?"],
      "/activites/": ["Salut 👋 Moi c’est Otto.", "Huit disciplines, du baby boxe dès 3 ans au MMA tous niveaux dans l’octogone. Tu cherches à te défouler, à apprendre à te battre, ou à te remettre en forme ?"],
      "/plannings/": ["Salut 👋 Moi c’est Otto.", "Vingt-deux cours par semaine, du lundi au samedi, 10h–21h30. Dis-moi tes créneaux possibles et je te dis lesquels tombent bien."],
      "/coachs/": ["Salut 👋 Moi c’est Otto.", "Cinq coachs : Jérôme le head coach, Sonia, Hicham, Farouk et Valentin Guth. Tu veux savoir qui tient quel cours ?"],
      "/la-salle/": ["Salut 👋 Moi c’est Otto.", "300 m² dehors, couverts et chauffés, un octogone de 7 m et un grand ring. Tu veux venir voir avant de décider ?"],
      "/galerie/": ["Salut 👋 Moi c’est Otto.", "Vingt-quatre cadres, tous pris ici — aucune banque d’images. Il y a une discipline qui t’a accroché l’œil ?"],
      "/premiere-seance/": ["Salut 👋 Moi c’est Otto.", "Gants et bandes prêtés, aucun niveau demandé, et personne ne te met en face de quelqu’un le premier soir. C’est quoi qui te retient ?"],
      "/contact/": ["Salut 👋 Moi c’est Otto.", "33 rue des Ormes, au terminus du métro B, parking gratuit. Tu veux passer quel jour ?"],
    };
  /** Le premier message, choisi selon la page — et rien de plus long. */
  function _accueilRamonville() {
    const p = location.pathname.replace(/index\.html$/, "");
    const a = ACCUEILS[p];
    return a ? a[0] + " " + a[1]
      : "Salut 👋 Moi c’est Otto, l’assistant de la salle. Les créneaux, l’octogone, les tarifs — demande-moi.";
  }

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
          : _accueilRamonville(),
        700,
        resolveActions(["offre", "saison"])
      );
      /* on ne redemande JAMAIS un prénom déjà donné — c’est la première
         chose qui trahit un robot */
      /* LE PRENOM NE SE DEMANDE PLUS ICI. Ce commentaire portait deja la
         bonne regle — « en troisieme bulle, apres deux messages qui ont
         rendu service » — mais le code posait la question juste apres
         l'accueil, donc en DEUXIEME bulle. Deux degats :

           · deux questions dans le meme tour (« pour toi ou pour ton
             enfant ? » puis « comment tu t'appelles ? ») : on ne repond
             qu'a la derniere, et c'est la question de qualification qui
             se perd — celle qui sert a vendre ;
           · un nom demande avant d'avoir rien donne, c'est un peage.

         Il se demande maintenant apres DEUX vraies reponses (voir
         `reponsesRendues`), et jamais s'il est deja connu. */
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
