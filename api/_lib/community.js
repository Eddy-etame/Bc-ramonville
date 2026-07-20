/* =====================================================================
   RAMONVILLE · api/_lib/community.js — LA GALERIE DU CLUB, côté serveur.

   CE QUE C'EST : les visiteurs déposent leurs photos et leurs vidéos du
   plateau ; rien n'est publié avant qu'un membre du staff l'ait approuvé
   depuis Le vestiaire. Le stockage est CLOUDINARY — le même que Portet,
   pour que les deux salles se dépannent avec le même mode d'emploi :
   il stocke, il transcode, il sert, et ses TAGS servent de base de
   données (pending → approved). Aucun second système à maintenir.

   CHAQUE SALLE A SON DOSSIER. Ramonville écrit dans
   « bc-ramonville-community » : deux salles peuvent partager un compte
   Cloudinary sans jamais mélanger leurs murs, et la modération de l'une
   ne voit pas les fichiers de l'autre.

   SANS CLOUDINARY_URL, RIEN NE PLANTE. `configuree()` dit la vérité, les
   routes répondent « pas encore ouvert » en français, et la page publique
   affiche un état vide honnête. Un service absent n'a jamais fait perdre
   une page à personne — une page qui plante, si.
   ===================================================================== */
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({ secure: true }); // lit CLOUDINARY_URL dans l'environnement

export { cloudinary };
export const FOLDER = process.env.COMMUNITY_FOLDER || "bc-ramonville-community";

/** Le dépôt n'est ouvert que si le stockage est réellement branché. */
export function configuree() {
  const c = cloudinary.config();
  return !!(c.cloud_name && c.api_key && c.api_secret);
}

/* LES LIMITES, EN UN SEUL ENDROIT — le client les affiche, le serveur les
   applique. Elles ne peuvent pas diverger : la page les LIT ici (voir
   /api/community/items, champ `limites`) au lieu de les recopier. */
export const LIMITES = {
  maxPhotoMo: +(process.env.COMMUNITY_MAX_PHOTO_MO || 12),
  maxVideoMo: +(process.env.COMMUNITY_MAX_VIDEO_MO || 80),
  maxSecondes: +(process.env.COMMUNITY_MAX_SEC || 15),
};

/* Formats réellement acceptés — c'est Cloudinary qui nous dit le format
   RÉEL après décodage, pas l'extension ni le type déclaré par le
   navigateur. Un .exe renommé .jpg ne décode pas : il ne passe pas. */
export const FORMATS_IMAGE = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "avif"];
export const FORMATS_VIDEO = ["mp4", "mov", "webm", "m4v", "3gp", "avi", "mkv"];

/* Le même filtre à injures que le reste du site, appliqué au prénom ET au
   titre. Il est volontairement court et lisible : il attrape l'évident,
   il n'a pas la prétention d'attraper l'ingénieux — la modération humaine
   est derrière, et c'est elle qui décide. */
const GROSMOTS = [
  "merde", "putain", "connard", "connasse", "salope", "encule", "pute", "bite", "couille", "nique",
  "ntm", "pd", "pede", "tapette", "bougnoule", "negro", "negre", "youpin", "salaud",
  "fuck", "shit", "bitch", "cunt", "nigger", "faggot", "whore", "rape", "nazi", "kys", "porn", "sex",
];

/** Valide et nettoie une chaîne venue du visiteur. Renvoie { value, bad }. */
export function cleanName(s, max) {
  // on retire les caractères qui cassent un contexte Cloudinary (= et |) ou du HTML
  const value = String(s || "").trim().slice(0, max).replace(/[=|<>]/g, "");
  const norm = value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ");
  const bad =
    /(.)\1{6,}/.test(norm) ||                                  // spam (aaaaaaa)
    /https?:|www\.|\.[a-z]{2,}\/?/i.test(value) ||             // liens
    GROSMOTS.some((w) => new RegExp(`\\b${w}`, "i").test(norm));
  return { value, bad };
}

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const TEL_RE = /^(?:\+33|0)\s?[1-9](?:[\s.\-]?\d{2}){4}$/;
export const estEmail = (s) => EMAIL_RE.test(String(s || "").trim());
export const estTel = (s) => TEL_RE.test(String(s || "").trim());

/** Une ressource Cloudinary → la forme que la page publique attend. */
export function itemPublic(r) {
  const id = r.public_id;
  const ctx = (r.context && (r.context.custom || r.context)) || {};
  const video = r.resource_type === "video";
  const src = cloudinary.url(id, {
    resource_type: r.resource_type,
    secure: true,
    transformation: video
      ? [{ quality: "auto", width: 900, crop: "limit" }]
      : [{ quality: "auto", fetch_format: "auto", width: 900, crop: "limit" }],
  });
  const poster = cloudinary.url(id, {
    resource_type: r.resource_type,
    format: "jpg",
    secure: true,
    transformation: [{ quality: "auto", width: 600, crop: "limit" }],
  });
  return {
    id, type: video ? "video" : "image", src, poster,
    titre: ctx.titre || "", auteur: ctx.auteur || "",
    duree: r.duration ? Math.round(r.duration) : null,
    createdAt: r.created_at,
  };
}
