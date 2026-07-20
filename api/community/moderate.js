/* =====================================================================
   POST /api/community/moderate — LE COACH TRANCHE (staff seulement).

   « publier » : on pose le tag approved, on retire pending → le fichier
   apparaît sur le mur au prochain chargement de /galerie/.
   « supprimer » : on DÉTRUIT le fichier chez Cloudinary. Pas de corbeille,
   pas de tag « refusé » qui garderait la photo de quelqu'un sur nos
   serveurs pour rien — refuser, c'est effacer.

   Le garde-fou du dossier est le même que dans check.js : on ne peut agir
   que sur une ressource DE NOTRE DOSSIER. Un identifiant deviné ne permet
   pas de détruire le média d'une salle sœur qui partagerait le compte.
   ===================================================================== */
import { cloudinary, FOLDER, configuree } from "../_lib/community.js";
import { allowCors, bodyOf, isAdmin } from "../_lib/util.js";

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  if (!isAdmin(req)) return res.status(401).json({ error: "Accès refusé" });
  if (!configuree()) return res.status(503).json({ error: "La galerie du club n'est pas branchée (CLOUDINARY_URL manquant)." });

  const { id, action, type } = bodyOf(req);
  const kind = type === "image" ? "image" : "video";
  if (!id || !String(id).startsWith(FOLDER + "/"))
    return res.status(400).json({ error: "Fichier inconnu." });

  try {
    if (action === "publier") {
      await cloudinary.uploader.add_tag("approved", [id], { resource_type: kind });
      await cloudinary.uploader.remove_tag("pending", [id], { resource_type: kind });
      return res.status(200).json({ ok: true, id, etat: "publie" });
    }
    if (action === "supprimer") {
      await cloudinary.uploader.destroy(id, { resource_type: kind, invalidate: true });
      return res.status(200).json({ ok: true, id, etat: "supprime" });
    }
    return res.status(400).json({ error: "Action inconnue." });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
