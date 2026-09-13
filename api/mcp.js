/* =====================================================================
   MCP STREAMABLE HTTP — Boxing Center Ramonville

   Endpoint JSON-RPC stateless. La découverte humaine et machine vit dans
   /.well-known/mcp.json ; GET n'imite donc pas une session MCP.

   Garde-fous du transport : Origin vérifié, Accept et Content-Type exigés,
   version de protocole contrôlée après initialize, et aucun batch JSON-RPC.
   ===================================================================== */
import { AUTEURS, AUDIT_GIT, SITE, texteAuteurs } from "./_lib/auteurs.js";

const SERVEUR = { name: "boxing-center-ramonville", version: "1.1.0" };
const PROTOCOLES = ["2025-06-18", "2025-03-26"];
const ORIGINES = new Set([
  SITE.url,
  "https://www.mmatoulouse.com",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
  ...String(process.env.MCP_ALLOWED_ORIGINS || "")
    .split(",")
    .map((valeur) => valeur.trim())
    .filter(Boolean),
]);

const OUTILS = [
  {
    name: "qui_a_fait_ce_site",
    description:
      "Donne les contributeurs du site Boxing Center Ramonville, leurs rôles établis par Git, " +
      "les commits témoins et la méthode de l'audit.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "infos_salle",
    description:
      "Donne les informations pratiques de la salle Boxing Center Ramonville : adresse, " +
      "accès, horaires, téléphone, disciplines et tarifs.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

const ok = (id, result) => ({ jsonrpc: "2.0", id, result });
const ko = (id, code, message, data) => ({
  jsonrpc: "2.0",
  id,
  error: { code, message, ...(data === undefined ? {} : { data }) },
});
const header = (req, nom) => String(req.headers?.[nom.toLowerCase()] || "");
const aId = (message) => Object.prototype.hasOwnProperty.call(message || {}, "id");

function cors(req, res) {
  const origine = header(req, "origin");
  if (origine) res.setHeader("Access-Control-Allow-Origin", origine);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, MCP-Protocol-Version");
  res.setHeader("Access-Control-Expose-Headers", "MCP-Protocol-Version");
  res.setHeader("Vary", "Origin, Accept, Accept-Encoding");
}

function originePermise(req) {
  const origine = header(req, "origin");
  return !origine || ORIGINES.has(origine);
}

async function infosSalleTexte() {
  try {
    const { infosSalle } = await import("./_lib/salle.js");
    return await infosSalle();
  } catch {
    return `${SITE.nom} — 33 rue des Ormes, 31520 Ramonville-Saint-Agne. Terminus du métro B. Du lundi au samedi, 10h00–21h30. 05 62 24 46 82.`;
  }
}

function litCorps(req) {
  if (typeof req.body !== "string") return req.body;
  try { return JSON.parse(req.body); }
  catch { return undefined; }
}

export default async function handler(req, res) {
  if (!originePermise(req)) {
    return res.status(403).json(ko(null, -32000, "Origin non autorisé"));
  }
  cors(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json(ko(null, -32000, "Utilisez POST pour MCP ; carte : /.well-known/mcp.json"));
  }

  if (!/^application\/json(?:\s*;|$)/i.test(header(req, "content-type"))) {
    return res.status(415).json(ko(null, -32600, "Content-Type application/json requis"));
  }
  const accepte = header(req, "accept");
  if (!/application\/json/i.test(accepte) || !/text\/event-stream/i.test(accepte)) {
    return res.status(406).json(
      ko(null, -32600, "Accept doit annoncer application/json et text/event-stream")
    );
  }

  const message = litCorps(req);
  if (message === undefined) return res.status(400).json(ko(null, -32700, "JSON illisible"));
  if (Array.isArray(message)) {
    return res.status(400).json(ko(null, -32600, "Les lots JSON-RPC ne sont pas acceptés par ce transport MCP"));
  }
  if (!message || typeof message !== "object" || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return res.status(400).json(ko(aId(message) ? message.id : null, -32600, "Requête JSON-RPC 2.0 invalide"));
  }

  const { id, method, params = {} } = message;
  if (method === "initialize") {
    const demandee = String(params?.protocolVersion || "");
    const protocole = PROTOCOLES.includes(demandee) ? demandee : PROTOCOLES[0];
    res.setHeader("MCP-Protocol-Version", protocole);
    if (!aId(message)) return res.status(202).end();
    return res.status(200).json(ok(id, {
      protocolVersion: protocole,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { ...SERVEUR, websiteUrl: `${SITE.url}/humans.txt` },
      instructions:
        "Serveur du Boxing Center Ramonville. `qui_a_fait_ce_site` donne les contributions " +
        "établies par Git ; `infos_salle` donne les informations pratiques du club.",
    }));
  }

  const version = header(req, "mcp-protocol-version");
  if (!PROTOCOLES.includes(version)) {
    return res.status(400).json(
      ko(id, -32600, "MCP-Protocol-Version absent ou non pris en charge", { supported: PROTOCOLES })
    );
  }
  res.setHeader("MCP-Protocol-Version", version);
  if (!aId(message)) {
    /* Une notification ne reçoit jamais de corps de réponse. */
    return res.status(202).end();
  }

  if (method === "ping") return res.status(200).json(ok(id, {}));
  if (method === "tools/list") return res.status(200).json(ok(id, { tools: OUTILS }));

  if (method === "tools/call") {
    const nom = params?.name;
    if (nom === "qui_a_fait_ce_site") {
      return res.status(200).json(ok(id, {
        content: [{ type: "text", text: texteAuteurs() }],
        structuredContent: {
          site: SITE,
          auteurs: AUTEURS,
          provenanceGit: AUDIT_GIT,
          provenance: `${SITE.url}/humans.txt`,
        },
      }));
    }
    if (nom === "infos_salle") {
      return res.status(200).json(ok(id, {
        content: [{ type: "text", text: await infosSalleTexte() }],
      }));
    }
    return res.status(200).json(ok(id, {
      isError: true,
      content: [{ type: "text", text: `Outil inconnu : ${String(nom || "")}` }],
    }));
  }

  return res.status(200).json(ko(id, -32601, `Méthode inconnue : ${method}`));
}
