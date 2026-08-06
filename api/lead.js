/* =====================================================================
   POST /api/lead — un visiteur a laissé de quoi le rappeler.

   RÈGLE : cette fonction ne casse JAMAIS le parcours du visiteur. Même
   sans registre, sans e-mail et sans webhook configurés, elle répond 200
   et journalise le contact dans les logs de la fonction (récupérable
   depuis le tableau de bord Vercel). Un service absent n'a jamais fait
   perdre un contact à personne — un formulaire qui plante, si.

   Les trois sorties possibles sont documentées dans api/_lib/leads-store.js
   et dans le README (§ « Où atterrissent les contacts »).
   ===================================================================== */
import { allowCors, bodyOf, ipOf, rateLimit, clean } from "./_lib/util.js";
import { saveLead, mailLead, hookLead, storeConfigured } from "./_lib/leads-store.js";

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  if (!rateLimit("lead:" + ipOf(req), 12, 60_000))
    return res.status(429).json({ error: "Trop de demandes — réessaie dans une minute." });

  const b = bodyOf(req);
  const email = clean(b.email, 160);
  const lead = {
    at: new Date().toISOString(),
    event: clean(b.event, 40) || "lead_collected",
    sessionId: clean(b.sessionId, 60),
    prenom: clean(b.prenom, 60),
    nom: clean(b.nom, 60),
    email: EMAIL_RE.test(email) ? email : "",
    phone: clean(b.phone, 30),
    salle: clean(b.salle, 60) || "Ramonville",
    source: "ramonville",
    page: clean(b.page, 120),
  };

  // sans moyen de recontact, il n'y a rien à transmettre au staff
  if (!lead.email && !lead.phone)
    return res.status(400).json({ error: "Aucun moyen de recontact." });

  const sorties = { registre: false, email: false, webhook: false, reseau: false };
  /* Copie vers la base COMMUNE du réseau (gestion-manager) — la règle du
     boss : tout formulaire, tout chatbot, UNE seule base. Côté serveur :
     pas de CORS, jamais bloquant. */
  const versReseau = fetch("https://gestion-manager.vercel.app/api/chatbot/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...lead, salle: lead.salle || "Ramonville", source: "bc-ramonville" }),
  }).then((r) => (sorties.reseau = r.ok)).catch(() => {});
  await Promise.all([
    saveLead(lead).then((v) => (sorties.registre = v)).catch(() => {}),
    mailLead(lead).then((v) => (sorties.email = v)).catch(() => {}),
    hookLead(lead).then((v) => (sorties.webhook = v)).catch(() => {}),
    versReseau,
  ]);

  // le journal est la sortie de dernier recours — toujours écrite
  console.log(
    "[lead]",
    JSON.stringify({ ...lead, sorties, registreConfigure: storeConfigured() })
  );

  return res.status(200).json({ ok: true, sorties });
}
