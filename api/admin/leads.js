/* =====================================================================
   GET /api/admin/leads — les contacts collectés par l'assistant.
   Protégé par ADMIN_TOKEN. Sans registre configuré, on le DIT :
   { registre:false } → le vestiaire affiche un état honnête plutôt
   qu'une liste vide qui laisserait croire à zéro contact.
   ===================================================================== */
import { allowCors, isAdmin } from "../_lib/util.js";
import { listLeads, storeConfigured } from "../_lib/leads-store.js";

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode non autorisée" });

  if (!storeConfigured())
    return res.status(200).json({
      registre: false,
      leads: [],
      note: "Aucun registre n'est branché sur ce site. Les contacts partent quand même par e-mail et sont écrits dans le journal des fonctions Vercel — mais ils ne peuvent pas être relus ici. Voir le README, § « Où atterrissent les contacts ».",
    });

  try {
    const leads = await listLeads(200);
    return res.status(200).json({ registre: true, leads });
  } catch (e) {
    return res.status(502).json({ error: "Le registre n'a pas répondu. Réessaie dans un instant." });
  }
}
