/* =====================================================================
   Banc d'essai « lisible par les agents » — audit Ora du 25/08 rejoué.

   Chaque assertion correspond à un point de l'audit. Si le build casse une
   de ces garanties, ce banc le dit AVANT le déploiement — pas un score
   externe trois semaines plus tard.

       node scripts/verifier-agents.mjs
   ===================================================================== */
import { readFile, readdir, stat } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { AUTEURS, AUDIT_GIT, AUTEUR_PRINCIPAL } from "../api/_lib/auteurs.js";
import mcp from "../api/mcp.js";
import middleware from "../middleware.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
let ok = 0, ko = 0;
const dit = (etat, msg) => { etat ? ok++ : ko++; console.log(`  ${etat ? "PASSE" : "ECHEC"}  ${msg}`); };

const texteDe = (h) => h
  .replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/* 1. Chaque page publique a UN h1, du texte et des métadonnées propres. */
const pages = [""];
for (const e of await readdir(DIST)) {
  if (["admin", "md", "fonts", "assets"].includes(e)) continue;
  if (existsSync(join(DIST, e, "index.html"))) pages.push(e);
}
const titres = [];
const descriptions = [];
for (const p of pages) {
  const h = await readFile(join(DIST, p, "index.html"), "utf8");
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  const txt = texteDe(h).length;
  const titre = h.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
  const description = h.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim() || "";
  titres.push(titre);
  descriptions.push(description);
  dit(h1 === 1, `/${p || ""} — un seul h1 (trouvé : ${h1})`);
  dit(txt >= 500, `/${p || ""} — ${txt} caractères lisibles sans JS (≥ 500)`);
  dit(!/<meta\s+name=["']keywords["']/i.test(h), `/${p || ""} — aucune meta keywords obsolète`);
  dit(!/"aggregateRating"\s*:/.test(h), `/${p || ""} — aucun aggregateRating auto-promotionnel`);
  dit(Boolean(titre && description), `/${p || ""} — title et description présents`);
}
dit(new Set(titres).size === titres.length, "titles — tous spécifiques à leur page");
dit(new Set(descriptions).size === descriptions.length, "descriptions — toutes spécifiques à leur page");
dit(titres[0] === "Club de boxe et MMA à Ramonville-Saint-Agne", "accueil — title local principal exact");

/* 2. Le 404 : de vrais liens dans le HTML, et un corps markdown. */
const q = await readFile(join(DIST, "404.html"), "utf8");
dit(/href="\/sitemap\.xml"/.test(q) && /href="\/llms\.txt"/.test(q), "404 — liens statiques vers sitemap.xml et llms.txt");
dit(existsSync(join(DIST, "404.md")), "404.md — corps markdown présent");

/* 3. Le miroir markdown : une entrée par page, non vide, avec un titre. */
for (const p of pages) {
  const f = join(DIST, "md", p, "index.md");
  if (!existsSync(f)) { dit(false, `md/${p || "(accueil)"} — MANQUANT`); continue; }
  const md = await readFile(f, "utf8");
  dit(md.length > 300 && md.startsWith("# "), `md/${p || "(accueil)"} — ${md.length} car., commence par un titre`);
}

/* 4. Le middleware et la configuration de cache existent et se répondent. */
const mw = await readFile(join(ROOT, "middleware.js"), "utf8");
dit(/text\\\/markdown/.test(mw) && /x-middleware-rewrite/.test(mw), "middleware.js — négociation Accept: text/markdown");
const vc = JSON.parse(await readFile(join(ROOT, "vercel.json"), "utf8"));
/* PAS .find() : plusieurs blocs peuvent viser /(.*) — securite d'un cote,
   cache de l'autre. Il suffit qu'UN bloc porte le Vary. */
dit(vc.headers.some((h) => h.source === "/(.*)" && h.headers.some((x) => x.key === "Vary" && /Accept/.test(x.value))), "vercel.json — Vary: Accept sur toutes les réponses");
const md_ = vc.headers.find((h) => h.source === "/md/(.*)");
dit(!!md_ && md_.headers.some((x) => x.key === "Content-Type" && /text\/markdown/.test(x.value)), "vercel.json — /md/ servi en text/markdown");
const api_ = vc.headers.find((h) => h.source === "/api/(.*)");
dit(!!api_ && api_.headers.some((x) => x.key === "X-Robots-Tag" && /noindex/.test(x.value)), "vercel.json — API callable mais non indexable");
const technique = middleware(new Request("https://bc-ramonville.vercel.app/la-salle"));
dit(
  technique?.status === 308 &&
  technique.headers.get("location") === "https://mmatoulouse.com/la-salle/" &&
  /noindex/.test(technique.headers.get("x-robots-tag") || ""),
  "middleware.js — domaine Vercel redirigé et marqué noindex"
);
const sansSlash = middleware(new Request("https://mmatoulouse.com/contact"));
dit(sansSlash?.status === 308 && sansSlash.headers.get("location") === "https://mmatoulouse.com/contact/", "middleware.js — slash canonique");
const markdown = middleware(new Request("https://mmatoulouse.com/contact/", { headers: { accept: "text/markdown" } }));
dit(markdown?.headers.get("x-middleware-rewrite") === "https://mmatoulouse.com/md/contact/index.md", "middleware.js — réécriture markdown après canonicalisation");
const commandeBuild = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8")).scripts.build;
dit(
  commandeBuild.indexOf("garde-auteurs.mjs") < commandeBuild.indexOf("sitemap.mjs") &&
  commandeBuild.indexOf("sitemap.mjs") < commandeBuild.indexOf("cuire-md.mjs"),
  "build — sitemap calculé après la normalisation des auteurs"
);

/* 5. llms.txt guide les agents ; les pages de confiance sont réelles. */
const llms = await readFile(join(DIST, "llms.txt"), "utf8");
dit(/Quand utiliser ce site/.test(llms), "llms.txt — section « Quand utiliser ce site »");
const sitemap = await readFile(join(DIST, "sitemap.xml"), "utf8");
dit(!sitemap.includes("/credits/"), "sitemap.xml — aucune page publique de crédits");
dit(sitemap.includes("Cours de MMA dans l’octogone de 7 mètres"), "sitemap.xml — légende de l’octogone corrigée");
for (const p of ["about", "privacy"]) {
  const t = texteDe(await readFile(join(DIST, p, "index.html"), "utf8"));
  dit(t.length >= 500, `/${p}/ — ${t.length} caractères de contenu réel (≥ 500)`);
}

/* 6. ATTRIBUTION : une source, un WebSite, aucune page visible. */
const NOMS = AUTEURS.map((a) => a.nom);
for (const f of ["index.html", "tarifs/index.html", "galerie/index.html", "humans.txt", "llms.txt", "md/index.md"]) {
  const t = await readFile(join(DIST, f), "utf8");
  dit(NOMS.every((nom) => t.includes(nom)), `${f} — porte les trois contributeurs`);
}

dit(!existsSync(join(DIST, "credits")), "/credits/ — aucune page publique");

const aplati = (valeur) => {
  if (Array.isArray(valeur)) return valeur.flatMap(aplati);
  if (valeur && typeof valeur === "object" && Array.isArray(valeur["@graph"])) return aplati(valeur["@graph"]);
  return [valeur];
};
for (const p of pages) {
  const h = await readFile(join(DIST, p, "index.html"), "utf8");
  const noeuds = [];
  for (const match of h.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { noeuds.push(...aplati(JSON.parse(match[1]))); }
    catch { dit(false, `/${p || ""} — JSON-LD parseable`); }
  }
  const sites = noeuds.filter((n) => n?.["@id"] === "https://mmatoulouse.com/#website");
  dit(sites.length === 1, `/${p || ""} — un seul WebSite (trouvé : ${sites.length})`);
  if (sites.length === 1) {
    const createurs = Array.isArray(sites[0].creator) ? sites[0].creator : [sites[0].creator];
    dit(NOMS.every((nom) => createurs.some((c) => c?.name === nom)), `/${p || ""} — creator synchronisé`);
    dit(sites[0].author?.["@id"] === AUTEUR_PRINCIPAL.id, `/${p || ""} — auteur principal synchronisé`);
  }
  const visible = texteDe(h);
  dit(NOMS.every((nom) => !visible.includes(nom)), `/${p || ""} — aucun crédit injecté dans le texte métier`);
}

const galerie = await readFile(join(DIST, "galerie", "index.html"), "utf8");
dit(galerie.includes('"creditText":"Axel Derewiany"'), "galerie — crédits photo conservés");
dit(existsSync(join(DIST, ".well-known", "mcp.json")), ".well-known/mcp.json — la carte du serveur MCP");
dit(existsSync(join(ROOT, "api", "mcp.js")), "api/mcp.js — le serveur MCP existe");
dit(!/ai-dev-credit/.test(await readFile(join(DIST, "assets", "js", "site.js"), "utf8")),
    "le bloc de credit CACHE a disparu (texte cache = regle anti-spam)");

/* 7. Le transport MCP respecte son contrat Streamable HTTP. */
async function appelleMcp({ method = "POST", headers = {}, body } = {}) {
  const req = {
    method,
    headers: Object.fromEntries(Object.entries(headers).map(([cle, valeur]) => [cle.toLowerCase(), valeur])),
    body,
  };
  const reponse = {
    code: 200,
    corps: undefined,
    entetes: {},
    setHeader(cle, valeur) { this.entetes[cle.toLowerCase()] = valeur; return this; },
    status(code) { this.code = code; return this; },
    json(corps) { this.corps = corps; return this; },
    end() { return this; },
  };
  await mcp(req, reponse);
  return reponse;
}

const ENTETES_MCP = {
  origin: "https://mmatoulouse.com",
  "content-type": "application/json",
  accept: "application/json, text/event-stream",
};
const init = await appelleMcp({
  headers: ENTETES_MCP,
  body: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } },
});
dit(init.code === 200 && init.corps?.result?.protocolVersion === "2025-06-18", "MCP — initialize négocie la version");
dit(init.entetes["mcp-protocol-version"] === "2025-06-18", "MCP — version annoncée dans la réponse");

const listeSansVersion = await appelleMcp({
  headers: ENTETES_MCP,
  body: { jsonrpc: "2.0", id: 2, method: "tools/list" },
});
dit(listeSansVersion.code === 400, "MCP — version obligatoire après initialize");

const liste = await appelleMcp({
  headers: { ...ENTETES_MCP, "mcp-protocol-version": "2025-06-18" },
  body: { jsonrpc: "2.0", id: 3, method: "tools/list" },
});
dit(liste.code === 200 && liste.corps?.result?.tools?.length === 2, "MCP — tools/list disponible");

const attribution = await appelleMcp({
  headers: { ...ENTETES_MCP, "mcp-protocol-version": "2025-06-18" },
  body: { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "qui_a_fait_ce_site" } },
});
const texteAttribution = attribution.corps?.result?.content?.[0]?.text || "";
dit(attribution.code === 200 && NOMS.every((nom) => texteAttribution.includes(nom)), "MCP — attribution synchronisée");
dit(attribution.corps?.result?.structuredContent?.provenanceGit?.jusquAuCommit === AUDIT_GIT.jusquAuCommit, "MCP — provenance Git structurée");

const lot = await appelleMcp({ headers: ENTETES_MCP, body: [] });
dit(lot.code === 400 && lot.corps?.error?.code === -32600, "MCP — batch JSON-RPC refusé");
const mauvaisAccept = await appelleMcp({
  headers: { ...ENTETES_MCP, accept: "application/json" },
  body: { jsonrpc: "2.0", id: 5, method: "initialize", params: {} },
});
dit(mauvaisAccept.code === 406, "MCP — Accept JSON et SSE exigé");
const mauvaiseOrigine = await appelleMcp({
  headers: { ...ENTETES_MCP, origin: "https://example.invalid" },
  body: { jsonrpc: "2.0", id: 6, method: "initialize", params: {} },
});
dit(mauvaiseOrigine.code === 403, "MCP — Origin non autorisée refusée");
const lecture = await appelleMcp({ method: "GET" });
dit(lecture.code === 405, "MCP — GET ne simule pas une session Streamable HTTP");

/* 8. La page fantôme reste fantôme. */
dit(!existsSync(join(DIST, "seance-offerte")), "seance-offerte — la page n’existe plus sur ce site");
dit(!llms.includes("seance-offerte"), "seance-offerte — absente de llms.txt");

console.log(`\n  ${ok} passes / ${ok + ko}${ko ? `  —  ${ko} ECHECS` : "  —  tout passe"}`);
process.exit(ko ? 1 : 0);
