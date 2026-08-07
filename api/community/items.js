/* =====================================================================
   GET /api/community/items — LE MUR PUBLIC.

   Il ne renvoie QUE ce qui porte le tag « approved » : un fichier déposé
   n’est jamais visible avant qu’un coach l’ait relu dans Le vestiaire.
   Photos et vidéos vivent dans le même mur, dans l’ordre d’arrivée
   inverse (le dernier posté en tête).

   EN CAS DE PANNE, ON RÉPOND 200 AVEC UN MUR VIDE. La galerie est une
   section d’une page statique : si Cloudinary tousse, la page continue de
   se lire de haut en bas — elle affiche l’état vide, elle ne montre pas
   une erreur au visiteur venu voir des photos de sa salle.
   ===================================================================== */
import { cloudinary, FOLDER, LIMITES, configuree, itemPublic } from "../_lib/community.js";
import { allowCors } from "../_lib/util.js";

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  // le navigateur peut garder le mur une minute : c’est une galerie, pas un
  // tableau de bord. `stale-while-revalidate` sert l’ancien pendant qu’on
  // récupère le neuf — le mur ne clignote jamais.
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");

  if (!configuree())
    return res.status(200).json({ items: [], ouvert: false, limites: LIMITES });

  try {
    const r = await cloudinary.search
      .expression(`folder:${FOLDER} AND tags=approved`)
      .with_field("context")
      .sort_by("created_at", "desc")
      .max_results(48)
      .execute();
    return res.status(200).json({
      items: (r.resources || []).map(itemPublic),
      ouvert: true, limites: LIMITES,
    });
  } catch {
    return res.status(200).json({ items: [], ouvert: true, limites: LIMITES });
  }
}
