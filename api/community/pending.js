/* =====================================================================
   GET /api/community/pending — LA FILE DE MODÉRATION (staff seulement).

   Ce que le staff voit dans Le vestiaire, section « La galerie du club » :
   tout ce qui est tagué « pending », le plus ancien en tête (on traite
   dans l'ordre d'arrivée, personne n'attend derrière les autres).

   On renvoie AUSSI le moyen de recontact laissé par le contributeur : le
   coach qui approuve peut remercier, ou demander une précision. Cette
   route est derrière ADMIN_TOKEN — ces coordonnées ne sortent jamais par
   /items, qui est la route publique.
   ===================================================================== */
import { cloudinary, FOLDER, configuree, itemPublic } from "../_lib/community.js";
import { allowCors, isAdmin } from "../_lib/util.js";

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!isAdmin(req)) return res.status(401).json({ error: "Accès refusé" });

  if (!configuree())
    return res.status(200).json({
      items: [], ouvert: false,
      note: "La galerie du club n'est pas branchée : il manque CLOUDINARY_URL dans les réglages du site. Le reste du vestiaire fonctionne.",
    });

  try {
    const r = await cloudinary.search
      .expression(`folder:${FOLDER} AND tags=pending`)
      .with_field("context")
      .sort_by("created_at", "asc")
      .max_results(60)
      .execute();
    const items = (r.resources || []).map((x) => {
      const ctx = (x.context && (x.context.custom || x.context)) || {};
      return { ...itemPublic(x), email: ctx.email || "", tel: ctx.tel || "" };
    });
    return res.status(200).json({ items, ouvert: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
