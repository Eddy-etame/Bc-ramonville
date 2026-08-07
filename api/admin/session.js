/* =====================================================================
   GET /api/admin/session — la porte du vestiaire.

   Vérifie le mot de passe staff (ADMIN_TOKEN) et rend l’état RÉEL des
   capacités du backoffice. Le front s’en sert pour n’afficher que ce qui
   marche vraiment : pas un bouton mort, pas une promesse en l’air.
   ===================================================================== */
import { allowCors, isAdmin } from "../_lib/util.js";
import { storeConfigured } from "../_lib/leads-store.js";
import { configuree as galerieConfiguree } from "../_lib/community.js";

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!process.env.ADMIN_TOKEN)
    return res.status(503).json({ error: "Aucun mot de passe staff n’est configuré sur ce site (ADMIN_TOKEN)." });
  if (!isAdmin(req)) return res.status(401).json({ error: "Mot de passe incorrect." });

  return res.status(200).json({
    ok: true,
    salle: "Ramonville",
    capacites: {
      contenu: Boolean(process.env.GITHUB_TOKEN),   // édition + publication
      publication: Boolean(process.env.VERCEL_DEPLOY_HOOK),
      registre: storeConfigured(),                   // liste des contacts
      email: Boolean(process.env.RESEND_API_KEY),
      webhook: Boolean(process.env.LEAD_WEBHOOK_URL),
      galerie: galerieConfiguree(),                  // le mur du club (CLOUDINARY_URL)
    },
  });
}
