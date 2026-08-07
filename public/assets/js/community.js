/* =====================================================================
   RAMONVILLE · community.js — LA GALERIE DU CLUB, côté visiteur.

   CE QUE ÇA FAIT : le mur des photos et vidéos déposées par les gens de la
   salle, et le formulaire pour en déposer une. Rien n’apparaît sans qu’un
   coach l’ait relu — c’est écrit sur le formulaire, pas caché en petit.

   CE QUE ÇA NE FAIT PAS : coûter quoi que ce soit à qui ne descend pas
   jusqu’ici. Ce module et sa feuille de style ne sont chargés que quand la
   section approche de l’écran (voir /galerie/, script en pied de page), et
   les médias du mur ne sont demandés qu’au moment où ils entrent dans le
   champ (`preload="none"` + IntersectionObserver). Le premier rendu de la
   page ne télécharge pas une seule photo de la communauté.

   LA VALIDATION EST FAITE DEUX FOIS, ET C’EST VOULU. Ici, avant l’envoi :
   pour ne pas faire monter 80 Mo à quelqu’un dont la vidéo sera refusée de
   toute façon, et pour lui dire tout de suite ce qui cloche. Puis côté
   serveur, dans /api/community/check, sur les métadonnées du fichier RÉEL.
   Le contrôle du navigateur est une politesse ; celui du serveur est la loi.

   POURQUOI ON DEMANDE UN PRÉNOM ET UN CONTACT : la galerie est aussi la
   porte d’entrée la plus douce du site. Quelqu’un qui poste une photo de sa
   salle est déjà dedans. À l’envoi réussi, on prévient /api/lead avec
   event="upload_contributor" — le MÊME carnet que l’assistant, relu dans
   Le vestiaire. Un seul registre, une seule liste à rappeler.
   ===================================================================== */

const API = "";                                   // même origine (/api/…)
let LIMITES = { maxPhotoMo: 12, maxVideoMo: 80, maxSecondes: 15 };

/* Le même filtre à injures que le serveur — première ligne, pas dernière.
   Il évite un aller-retour réseau pour dire non ; le serveur re-tranche. */
const GROSMOTS = [
  "merde", "putain", "connard", "connasse", "salope", "encule", "enculé", "pute", "bite", "couille",
  "nique", "niquer", "ntm", "pd", "pédé", "tapette", "bougnoule", "negro", "nègre", "youpin", "salaud",
  "fuck", "shit", "bitch", "cunt", "nigger", "faggot", "whore", "rape", "nazi", "kys", "porn", "sex",
];
function vilain(s) {
  const norm = String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ");
  if (/(.)\1{6,}/.test(norm)) return true;                    // aaaaaaa
  if (/https?:|www\.|\.[a-z]{2,}\/?/i.test(s)) return true;   // liens
  return GROSMOTS.some((w) => new RegExp(`\\b${w}`, "i").test(norm));
}

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const TEL_RE = /^(?:\+33|0)\s?[1-9](?:[\s.\-]?\d{2}){4}$/;
const echappe = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function initCommunity() {
  const racine = document.getElementById("communaute");
  if (!racine || racine.dataset.monte) return;
  racine.dataset.monte = "1";
  const grille = racine.querySelector("#communaute-mur");
  const form = racine.querySelector("#communaute-form");
  const etat = racine.querySelector("#communaute-etat");
  if (!grille || !form || !etat) return;

  brancherForm(form, etat);
  chargerMur(grille);
}

/* ============================== LE MUR ============================== */
async function chargerMur(grille) {
  let d;
  try {
    const r = await fetch(`${API}/api/community/items`);
    if (!r.ok) throw new Error();
    d = await r.json();
  } catch {
    grille.innerHTML = vide("Le mur revient dans un instant. Reviens le voir — il se remplit vite.");
    return;
  }
  if (d.limites) LIMITES = d.limites;
  majAides();

  const items = d.items || [];
  if (!items.length) {
    grille.innerHTML = vide(
      d.ouvert
        ? "Personne n’a encore posté. Sois le premier — une photo du plateau, un round au sac, ce que tu veux."
        : "Le mur du club ouvre très bientôt. Garde ta plus belle photo au chaud."
    );
    return;
  }

  grille.innerHTML = items.map((it) => {
    const legende = `${echappe(it.titre || "Le plateau")}${it.auteur ? ` · ${echappe(it.auteur)}` : ""}`;
    /* `preload="none"` et `loading="lazy"` : RIEN ne part au premier rendu.
       Les posters sont servis en 600 px par Cloudinary — pas la peine de
       télécharger un 4000 px pour peindre une vignette. */
    return it.type === "video"
      ? `<figure class="mur__item mur__item--video">
           <video src="${echappe(it.src)}" poster="${echappe(it.poster)}" muted loop playsinline preload="none"></video>
           <span class="mur__play" aria-hidden="true">▶</span>
           <figcaption class="mur__cap">${legende}</figcaption>
         </figure>`
      : `<figure class="mur__item">
           <img src="${echappe(it.poster)}" alt="${legende}, Boxing Center Ramonville" loading="lazy" decoding="async" />
           <figcaption class="mur__cap">${legende}</figcaption>
         </figure>`;
  }).join("");

  /* Les vidéos ne se chargent — et ne jouent — qu’une fois à l’écran, et
     elles s’arrêtent en sortant. Un mur de quinze clips ne doit pas faire
     tourner quinze décodeurs dans le dos du visiteur. */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) { if (v.preload === "none") v.preload = "auto"; v.play().catch(() => {}); }
      else v.pause();
    }), { threshold: 0.25, rootMargin: "80px" });
    grille.querySelectorAll("video").forEach((v) => io.observe(v));
  }
}

const vide = (msg) => `<p class="mur__vide">${msg}</p>`;

function majAides() {
  const a = document.getElementById("communaute-limites");
  if (a) a.textContent =
    `Photo ${LIMITES.maxPhotoMo} Mo max · vidéo ${LIMITES.maxVideoMo} Mo et ${LIMITES.maxSecondes} s max · relu par un coach avant d’apparaître`;
}

/* ============================ LE DÉPÔT ============================== */
function brancherForm(form, etat) {
  const fichier = form.querySelector('input[type="file"]');
  const envoyer = form.querySelector('button[type="submit"]');
  const jauge = form.querySelector(".mur__jauge > i");
  const nomFichier = form.querySelector("#communaute-nomfichier");

  fichier.addEventListener("change", () => {
    const f = fichier.files?.[0];
    nomFichier.textContent = f ? `${f.name} · ${(f.size / 1048576).toFixed(1)} Mo` : "Aucun fichier choisi";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const prenom = (form.querySelector('input[name="prenom"]')?.value || "").trim();
    const titre = (form.querySelector('input[name="titre"]')?.value || "").trim();
    const email = (form.querySelector('input[name="email"]')?.value || "").trim();
    const tel = (form.querySelector('input[name="tel"]')?.value || "").trim();
    const f = fichier.files?.[0];

    /* --- l’identité : c’est le prix d’entrée, et il est annoncé --- */
    if (prenom.length < 2) return dire(etat, "Ton prénom d’abord — on veut savoir à qui dire merci.", "err");
    if (vilain(prenom)) return dire(etat, "Ce prénom ne passe pas. Mets le vrai, ça ira plus vite.", "err");
    if (titre && vilain(titre)) return dire(etat, "Ce titre ne passe pas. Trouve autre chose.", "err");
    if (!email && !tel) return dire(etat, "Laisse un email ou un numéro : c’est comme ça qu’on te répond.", "err");
    if (email && !EMAIL_RE.test(email)) return dire(etat, "Cet email ne ressemble pas à un email. Vérifie-le.", "err");
    if (tel && !TEL_RE.test(tel)) return dire(etat, "Ce numéro ne ressemble pas à un numéro. Vérifie-le.", "err");

    /* --- le fichier : type réel, poids, durée --- */
    if (!f) return dire(etat, "Choisis une photo ou une vidéo à envoyer.", "err");
    const image = f.type.startsWith("image/");
    const video = f.type.startsWith("video/");
    if (!image && !video) return dire(etat, "On prend les photos et les vidéos, rien d’autre.", "err");

    const maxMo = image ? LIMITES.maxPhotoMo : LIMITES.maxVideoMo;
    if (f.size > maxMo * 1048576)
      return dire(etat, `Trop lourd : ${(f.size / 1048576).toFixed(1)} Mo pour ${maxMo} Mo maximum.`, "err");

    dire(etat, "On regarde ton fichier…", "info");
    if (image) {
      /* ON L’OUVRE VRAIMENT. `f.type` n’est qu’une étiquette posée par le
         système sur l’extension ; un fichier renommé la porte tout autant.
         Un décodage qui échoue, c’est un fichier qui n’est pas une image. */
      const ok = await imageValide(f);
      if (!ok) return dire(etat, "Ce fichier n’est pas une vraie photo — il ne s’ouvre pas.", "err");
    } else {
      const duree = await dureeVideo(f).catch(() => 0);
      if (!duree) return dire(etat, "Cette vidéo ne se lit pas. Réessaie avec un autre fichier.", "err");
      if (duree > LIMITES.maxSecondes + 0.5)
        return dire(etat, `Trop longue : ${Math.round(duree)} s pour ${LIMITES.maxSecondes} s maximum. Garde le plus fort.`, "err");
    }

    envoyer.disabled = true;
    const type = image ? "image" : "video";
    try {
      // 1) notre fonction valide l’identité et SIGNE — les octets ne passent pas par elle
      /* 0) le defi anti-bot : emis par le serveur, resolu ici en un clin d'oeil */
      const powRes = await fetch(`${API}/api/community/sign`).then((r) => r.json()).catch(() => null);
      let powNonce = "";
      if (powRes && powRes.challenge) {
        const shaHex = async (x) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(x)))].map((v) => v.toString(16).padStart(2, "0")).join("");
        const prefix = "0".repeat(powRes.difficulty || 4);
        for (let n = 0; ; n++) {
          if ((await shaHex(`${powRes.challenge}:${n}`)).startsWith(prefix)) { powNonce = String(n); break; }
          if (n % 2000 === 1999) await new Promise((r) => setTimeout(r));
        }
      }
      const website = (form.querySelector('input[name="website"]') || {}).value || "";
      const rs = await fetch(`${API}/api/community/sign`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, titre, email, tel, type, website,
          pow: powRes ? { challenge: powRes.challenge, ts: powRes.ts, sig: powRes.sig, nonce: powNonce } : {} }),
      });
      const sign = await rs.json().catch(() => ({}));
      if (!rs.ok) { envoyer.disabled = false; return dire(etat, sign.error || "Envoi refusé.", "err"); }
      if (sign.limites) { LIMITES = sign.limites; majAides(); }

      // 2) le fichier part EN DIRECT chez Cloudinary avec la signature
      dire(etat, "Envoi en cours…", "info");
      const id = await televerser(f, sign, type, (p) => { if (jauge) jauge.style.width = p + "%"; });
      if (jauge) jauge.style.width = "0%";

      /* 3) le serveur revérifie le fichier RÉEL (format, durée, poids, coup
         d'œil). CE TEMPS-LÀ SE DIT : le contrôle relit le fichier chez
         Cloudinary et, pour une photo, y ajoute le coup d'œil automatique —
         quelques secondes, parfois plus sur un réseau lent. Laisser
         « Envoi en cours… » à l’écran pendant ce temps donnait l’impression
         d’un envoi bloqué alors qu’il était fini. */
      dire(etat, `On vérifie ${image ? "ta photo" : "ta vidéo"}… ça prend quelques secondes.`, "info");
      const rc = await fetch(`${API}/api/community/check`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type }),
      });
      const check = await rc.json().catch(() => ({}));
      envoyer.disabled = false;
      if (!rc.ok) return dire(etat, check.error || "Fichier refusé.", "err");

      /* 4) le contributeur entre dans le carnet — le MÊME que l’assistant.
         LE CHAMP S’APPELLE `phone`, PAS `tel`. C’est le nom qu’emploient
         déjà l’assistant, le registre et l’e-mail au staff : en envoyant
         `tel`, on parlait une langue que le carnet ne comprend pas — il
         voyait un contact sans email NI téléphone et le refusait. Un
         déposant qui laissait son numéro (et pas son email) disparaissait
         donc entièrement, alors que c’est exactement le contact qu’on
         cherche à récupérer. On se plie au contrat existant. */
      fetch(`${API}/api/lead`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "upload_contributor", prenom, email, phone: tel,
          salle: "Ramonville", page: location.pathname,
        }),
      }).catch(() => {});   // le contact est un bonus : il ne bloque JAMAIS l’envoi

      form.reset();
      nomFichier.textContent = "Aucun fichier choisi";
      dire(etat, "C’est pris, merci. Un coach relit, et ça arrive sur le mur.", "ok");
    } catch (err) {
      envoyer.disabled = false;
      if (jauge) jauge.style.width = "0%";
      dire(etat, "L’envoi n’est pas passé. Réessaie dans un instant.", "err");
    }
  });
}

function televerser(f, sign, type, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", f);
    fd.append("api_key", sign.apiKey);
    fd.append("timestamp", String(sign.timestamp));
    fd.append("folder", sign.folder);
    fd.append("tags", sign.tags);
    fd.append("context", sign.context);
    fd.append("signature", sign.signature);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sign.cloudName}/${type}/upload`);
    xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) return reject(new Error("upload " + xhr.status));
      try { resolve(JSON.parse(xhr.responseText).public_id); } catch { reject(new Error("réponse illisible")); }
    };
    xhr.onerror = () => reject(new Error("réseau"));
    xhr.send(fd);
  });
}

/** Décodage réel — createImageBitmap échoue sur ce qui n’est pas une image. */
async function imageValide(f) {
  try {
    if (window.createImageBitmap) {
      const bmp = await createImageBitmap(f);
      const ok = bmp.width > 0 && bmp.height > 0;
      bmp.close?.();
      return ok;
    }
  } catch { return false; }
  // repli pour les navigateurs sans createImageBitmap : on passe par <img>
  return new Promise((res) => {
    const u = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(u); res(img.naturalWidth > 0); };
    img.onerror = () => { URL.revokeObjectURL(u); res(false); };
    img.src = u;
  });
}

function dureeVideo(f) {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    const u = URL.createObjectURL(f);
    v.onloadedmetadata = () => { URL.revokeObjectURL(u); resolve(v.duration); };
    v.onerror = () => { URL.revokeObjectURL(u); reject(new Error("illisible")); };
    v.src = u;
  });
}

function dire(el, msg, genre) {
  el.textContent = msg;
  el.dataset.genre = genre;
}

/* auto-mount si la section est là */
initCommunity();
