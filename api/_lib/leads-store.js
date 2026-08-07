/* =====================================================================
   RAMONVILLE · api/_lib/leads-store.js — où atterrissent les contacts.

   TROIS SORTIES, toutes optionnelles, toutes branchées par variable
   d’environnement. Aucune n’est obligatoire : sans la moindre clé, la
   fonction répond quand même 200 et journalise proprement — le parcours
   du visiteur ne casse JAMAIS parce qu’un service n’est pas configuré.

     1. REGISTRE  (KV_REST_API_URL + KV_REST_API_TOKEN)
        Redis REST (Vercel KV / Upstash), appelé en `fetch` : aucune
        dépendance npm, offre gratuite suffisante. C’est ce registre que
        « Le vestiaire » relit pour afficher la liste des contacts.
     2. E-MAIL    (RESEND_API_KEY + LEAD_TO, défaut boxingcenter31@gmail.com)
        Un appel HTTP, pas de SDK. Le staff reçoit le contact tout de suite.
     3. WEBHOOK   (LEAD_WEBHOOK_URL)
        Pour brancher un CRM, un Zapier, un Slack — le JSON brut est posté.

   Sans registre, la liste du vestiaire le DIT (état honnête, pas une
   liste vide qui ferait croire à zéro contact).
   ===================================================================== */

const KEY = "bc:ram:leads";
const MAX = 500;

const kv = () => {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
};

export const storeConfigured = () => Boolean(kv());

async function kvCmd(cmd) {
  const c = kv();
  if (!c) return null;
  const r = await fetch(c.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error("kv " + r.status);
  const j = await r.json();
  return j.result;
}

/** Ajoute un contact en tête de liste. Renvoie true si le registre a écrit. */
export async function saveLead(lead) {
  if (!kv()) return false;
  await kvCmd(["LPUSH", KEY, JSON.stringify(lead)]);
  await kvCmd(["LTRIM", KEY, 0, MAX - 1]);
  return true;
}

/** Les contacts, du plus récent au plus ancien.
    UNE FICHE PAR VISITEUR : la conversation enrichit le profil au fil de
    l’eau (d’abord le numéro, puis l’email…), et chaque enrichissement est
    écrit. On ne garde donc que la version la plus récente de chaque
    session — le staff lit des personnes, pas des versions. */
export async function listLeads(limit = 200) {
  if (!kv()) return null; // null = pas de registre (≠ liste vide)
  const rows = (await kvCmd(["LRANGE", KEY, 0, Math.max(0, limit * 3 - 1)])) || [];
  const vus = new Set();
  const out = [];
  for (const r of rows) {
    let l;
    try { l = JSON.parse(r); } catch { continue; }
    const id = l.sessionId || `${l.at}|${l.phone}|${l.email}`;
    if (vus.has(id)) continue;
    vus.add(id);
    out.push(l);
    if (out.length >= limit) break;
  }
  return out;
}

/** Envoi d’e-mail au staff. Silencieux si non configuré. */
export async function mailLead(lead) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const to = process.env.LEAD_TO || "boxingcenter31@gmail.com";
  const from = process.env.LEAD_FROM || "Boxing Center Ramonville <onboarding@resend.dev>";
  const ligne = (k, v) => (v ? `<tr><td style="padding:4px 12px 4px 0"><b>${k}</b></td><td>${v}</td></tr>` : "");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Nouveau contact — ${lead.prenom || "visiteur"}${lead.phone ? " · " + lead.phone : ""}`,
      html: `<p>Un visiteur a laissé ses coordonnées dans l’assistant du site Ramonville.</p>
<table style="font:14px/1.5 system-ui">
${ligne("Prénom", lead.prenom)}${ligne("Nom", lead.nom)}${ligne("Téléphone", lead.phone)}${ligne("Email", lead.email)}${ligne("Salle", lead.salle)}${ligne("Origine", lead.event)}${ligne("Reçu le", lead.at)}
</table>`,
    }),
  });
  return r.ok;
}

/** Webhook générique (CRM, Slack, Zapier…). Silencieux si non configuré. */
export async function hookLead(lead) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return false;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  return r.ok;
}
