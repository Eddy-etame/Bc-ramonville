/* =====================================================================
   /api/admin/content — le contenu éditable de la salle.

     GET   → src/content.json (le calque publié) + son sha
     POST  → valide, commite sur GitHub, déclenche le redéploiement

   Le calque ne REMPLACE pas data.js : il le surcharge, champ par champ,
   au moment du build (scripts/content.mjs → content.gen.js). Une clé
   absente du calque, c'est data.js qui parle. On ne peut donc pas vider
   le site par mégarde depuis le vestiaire.

   Env : ADMIN_TOKEN, GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH,
         VERCEL_DEPLOY_HOOK (recommandé).
   ===================================================================== */
import { allowCors, isAdmin, bodyOf } from "../_lib/util.js";

const REPO = process.env.GITHUB_REPO || "";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const PATH = "src/content.json";
const CLES = ["salle", "tarifs", "coaches", "schedule", "promos", "disciplines"];

function gh(path, init = {}) {
  return fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "bc-ramonville-admin",
      ...(init.headers || {}),
    },
  });
}

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });
  if (!process.env.GITHUB_TOKEN || !REPO)
    return res.status(503).json({
      error:
        "L'édition de contenu n'est pas branchée sur ce site (il manque GITHUB_TOKEN et/ou GITHUB_REPO). Les contacts, eux, fonctionnent.",
    });

  if (req.method === "GET") {
    const r = await gh(`contents/${PATH}?ref=${BRANCH}`);
    if (r.status === 404) return res.status(200).json({ content: {}, sha: null, neuf: true });
    if (!r.ok) return res.status(502).json({ error: "Lecture GitHub échouée (" + r.status + ")" });
    const j = await r.json();
    let content = {};
    try { content = JSON.parse(Buffer.from(j.content, "base64").toString("utf8")); } catch {}
    return res.status(200).json({ content, sha: j.sha });
  }

  if (req.method === "POST") {
    const content = bodyOf(req).content;
    if (!content || typeof content !== "object" || Array.isArray(content))
      return res.status(400).json({ error: "Contenu invalide." });
    if (!Object.keys(content).every((k) => CLES.includes(k)))
      return res.status(400).json({ error: "Structure de contenu inattendue." });

    const json = JSON.stringify(content, null, 2);
    if (json.length > 400_000) return res.status(413).json({ error: "Contenu trop volumineux." });

    const cur = await gh(`contents/${PATH}?ref=${BRANCH}`);
    const sha = cur.ok ? (await cur.json()).sha : undefined;

    const put = await gh(`contents/${PATH}`, {
      method: "PUT",
      body: JSON.stringify({
        message: "vestiaire : mise à jour du contenu de Ramonville",
        content: Buffer.from(json + "\n", "utf8").toString("base64"),
        branch: BRANCH,
        sha,
      }),
    });
    if (!put.ok) return res.status(502).json({ error: "Écriture GitHub échouée (" + put.status + ")" });

    let redeploiement = false;
    if (process.env.VERCEL_DEPLOY_HOOK) {
      try { await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: "POST" }); redeploiement = true; } catch {}
    }
    return res.status(200).json({ ok: true, redeploiement });
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
