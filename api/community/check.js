/* =====================================================================
   POST /api/community/check — LE CONTRÔLE APRÈS COUP, ET C'EST LUI QUI
   COMPTE.

   POURQUOI IL EXISTE. Le fichier ne transite pas par nous (limite de
   4,5 Mo des fonctions) : il part du navigateur directement chez
   Cloudinary. Tout ce que le navigateur a vérifié avant l'envoi — type,
   poids, durée — est donc, du point de vue du serveur, une DÉCLARATION.
   Un formulaire trafiqué contourne ces trois contrôles en trente
   secondes. Cette route est la seule qui les vérifie sur des faits :
   les métadonnées que Cloudinary a extraites du fichier RÉEL, après
   l'avoir décodé lui-même.

   CE QU'ELLE VÉRIFIE, ET CE QU'ELLE FAIT DU FICHIER QUI ÉCHOUE :
     · le format réel (pas l'extension) est dans la liste attendue ;
     · pour une image : Cloudinary lui a trouvé une largeur et une hauteur
       — c'est la preuve du décodage. Un exécutable renommé .jpg n'en a pas ;
     · pour une vidéo : la durée réelle ≤ 15 s (COMMUNITY_MAX_SEC) ;
     · le poids réel sous la limite.
   Tout manquement → le fichier est DÉTRUIT immédiatement et le visiteur
   reçoit un message clair. Rien de douteux ne reste dans le dossier, même
   en attente : la file de modération n'est pas une poubelle.

   LA VISION, SI ELLE EST DISPONIBLE. Si GEMINI_API_KEY est présente, on
   montre à un modèle une vignette de l'image et on lui demande une seule
   chose : est-ce que ça a un rapport avec une salle de sport / de boxe,
   ou est-ce manifestement hors sujet (capture d'écran, document, contenu
   choquant) ? Un « manifestement hors sujet » détruit le fichier. Le doute
   ne détruit rien — il laisse partir en modération, où un humain tranche.
   SANS CLÉ, LE SYSTÈME MARCHE PAREIL : tout part en file de modération, et
   c'est dit en toutes lettres au visiteur. Dégradation honnête, pas panne.
   ===================================================================== */
import {
  cloudinary, FOLDER, LIMITES, FORMATS_IMAGE, FORMATS_VIDEO, configuree,
} from "../_lib/community.js";
import { allowCors, bodyOf, ipOf, rateLimit } from "../_lib/util.js";

const detruire = async (id, type) => {
  try { await cloudinary.uploader.destroy(id, { resource_type: type, invalidate: true }); } catch {}
};

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  if (!configuree()) return res.status(503).json({ error: "Le mur du club n'est pas encore ouvert." });
  if (!rateLimit("check:" + ipOf(req), 20, 60_000))
    return res.status(429).json({ error: "Trop de demandes — réessaie dans une minute." });

  const b = bodyOf(req);
  const id = String(b.id || "");
  const type = b.type === "image" ? "image" : "video";
  // on ne touche QUE ce qui est dans notre dossier : pas de destruction
  // téléguidée d'une ressource voisine par un identifiant deviné.
  if (!id || !id.startsWith(FOLDER + "/"))
    return res.status(400).json({ error: "Fichier inconnu." });

  let r;
  try {
    r = await cloudinary.api.resource(id, { resource_type: type });
  } catch {
    return res.status(404).json({ error: "Fichier introuvable — recommence l'envoi." });
  }

  const format = String(r.format || "").toLowerCase();
  const octets = r.bytes || 0;

  if (type === "image") {
    if (!FORMATS_IMAGE.includes(format)) {
      await detruire(id, type);
      return res.status(415).json({ error: "Ce fichier n'est pas une photo. On n'accepte que des images et des vidéos." });
    }
    // la preuve du décodage : Cloudinary n'a de largeur/hauteur que s'il a
    // vraiment ouvert l'image. Un fichier déguisé n'en a pas.
    if (!r.width || !r.height) {
      await detruire(id, type);
      return res.status(415).json({ error: "Cette image ne s'ouvre pas. Réessaie avec une vraie photo." });
    }
    if (octets > LIMITES.maxPhotoMo * 1024 * 1024) {
      await detruire(id, type);
      return res.status(413).json({ error: `Photo trop lourde (${LIMITES.maxPhotoMo} Mo maximum).` });
    }
  } else {
    if (!FORMATS_VIDEO.includes(format)) {
      await detruire(id, type);
      return res.status(415).json({ error: "Ce fichier n'est pas une vidéo." });
    }
    const duree = Number(r.duration || 0);
    if (!duree) {
      await detruire(id, type);
      return res.status(415).json({ error: "Cette vidéo ne se lit pas. Réessaie avec un autre fichier." });
    }
    // +0,5 s de tolérance : un encodeur qui vise 15 s en rend souvent 15,04.
    if (duree > LIMITES.maxSecondes + 0.5) {
      await detruire(id, type);
      return res.status(413).json({ error: `Trop longue : ${Math.round(duree)} s pour ${LIMITES.maxSecondes} s maximum. Coupe au plus fort.` });
    }
    if (octets > LIMITES.maxVideoMo * 1024 * 1024) {
      await detruire(id, type);
      return res.status(413).json({ error: `Vidéo trop lourde (${LIMITES.maxVideoMo} Mo maximum).` });
    }
  }

  /* ---- LE COUP D'ŒIL, quand une clé de vision est là (facultatif) ---- */
  let vu = "sans-cle";
  if (type === "image" && process.env.GEMINI_API_KEY) {
    try {
      const verdict = await regarder(id);
      if (verdict === "hors-sujet") {
        await detruire(id, type);
        return res.status(422).json({ error: "Cette image n'a rien à voir avec la salle. Envoie une photo du plateau." });
      }
      vu = verdict;                       // "ok" ou "doute"
    } catch { vu = "indisponible"; }      // panne du service → on laisse le staff trancher
  }

  return res.status(200).json({
    ok: true, id, type, format, vu,
    message: "C'est pris. Un coach relit, et ça arrive sur le mur.",
  });
}

/* Une seule question, une seule réponse. On demande un mot, pas un essai :
   la sortie est contrainte, donc lisible sans devoir faire confiance au
   modèle sur la forme. Au moindre doute, on ne détruit rien. */
async function regarder(id) {
  const url = cloudinary.url(id, {
    resource_type: "image", secure: true,
    transformation: [{ width: 512, height: 512, crop: "limit", quality: "auto", fetch_format: "jpg" }],
  });
  const img = await fetch(url);
  if (!img.ok) throw new Error("image illisible");
  const b64 = Buffer.from(await img.arrayBuffer()).toString("base64");

  const modele = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text:
                "Cette photo est proposée pour le mur d'une salle de boxe et de MMA. " +
                "Réponds par UN SEUL mot. « OK » si elle peut avoir un rapport avec le sport, " +
                "la salle, l'entraînement, un groupe, du matériel ou des gens qui s'entraînent. " +
                "« HORS » seulement si elle est manifestement sans aucun rapport " +
                "(capture d'écran, document, publicité, contenu choquant ou pornographique). " +
                "Dans le doute, réponds OK.",
            },
            { inline_data: { mime_type: "image/jpeg", data: b64 } },
          ],
        }],
        generationConfig: { maxOutputTokens: 8, temperature: 0 },
      }),
    }
  );
  if (!r.ok) throw new Error("vision " + r.status);
  const j = await r.json();
  const mot = (j?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim().toUpperCase();
  if (mot.startsWith("HORS")) return "hors-sujet";
  if (mot.startsWith("OK")) return "ok";
  return "doute";                          // réponse inattendue = on ne tranche pas
}
