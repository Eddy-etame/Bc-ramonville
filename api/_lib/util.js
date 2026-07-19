/* =====================================================================
   RAMONVILLE · api/_lib/util.js — les outils partagés des fonctions.
   Rien de spécifique à une salle ici : CORS, auth staff, IP, garde-fous.
   ===================================================================== */
import { createHash, timingSafeEqual } from "crypto";

export function allowCors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-token");
}

export function ipOf(req) {
  return (
    String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "0.0.0.0"
  );
}

/** Comparaison à temps constant du mot de passe staff (ADMIN_TOKEN). */
export function isAdmin(req) {
  if (!process.env.ADMIN_TOKEN) return false;
  const given = createHash("sha256").update(String(req.headers["x-admin-token"] || "")).digest();
  const good = createHash("sha256").update(process.env.ADMIN_TOKEN).digest();
  return timingSafeEqual(given, good);
}

/** Corps de requête, que Vercel l'ait parsé ou non. Ne lève jamais. */
export function bodyOf(req) {
  try {
    return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return {};
  }
}

/** Limiteur de débit en mémoire (par instance) — assez pour freiner l'abus
    évident sans dépendance ni stockage. Ne bloque jamais un vrai visiteur. */
const HITS = new Map();
export function rateLimit(key, max = 30, windowMs = 60_000) {
  const now = Date.now();
  const slot = HITS.get(key);
  if (!slot || now > slot.until) {
    HITS.set(key, { n: 1, until: now + windowMs });
    return true;
  }
  slot.n += 1;
  if (HITS.size > 5000) HITS.clear(); // garde-fou mémoire
  return slot.n <= max;
}

/** Nettoyage d'une chaîne venue du visiteur : longueur bornée, pas d'HTML. */
export function clean(s, max = 200) {
  return String(s ?? "").replace(/[<>]/g, "").trim().slice(0, max);
}
