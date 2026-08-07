/* =====================================================================
   RAMONVILLE · api/_lib/util.js — les outils partagés des fonctions.
   Rien de spécifique à une salle ici : CORS, auth staff, IP, garde-fous.
   ===================================================================== */
import { createHash, createHmac, timingSafeEqual } from "crypto";

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

/* ---------- Preuve de travail (anti-bot, cout ~un clignement d'oeil) ----------
   Meme mecanique que Portet et Minimes : defi signe HMAC (aucun etat serveur),
   le client trouve un nonce tel que sha256("challenge:nonce") commence par
   N zeros ; le serveur verifie signature, fraicheur et preuve. */
const POW_DIFFICULTY = +(process.env.POW_DIFFICULTY || 4);
const POW_TTL_MS = 10 * 60 * 1000;
const powSecret = () => (process.env.CLOUDINARY_URL || process.env.ADMIN_TOKEN || "bc");

export function issuePow() {
  const ts = Date.now();
  const challenge = createHash("sha256").update(`${ts}:${Math.random()}`).digest("hex").slice(0, 32);
  const sig = createHmac("sha256", powSecret()).update(`${challenge}.${ts}`).digest("hex");
  return { challenge, ts, sig, difficulty: POW_DIFFICULTY };
}

export function verifyPow({ challenge, ts, sig, nonce } = {}) {
  if (!challenge || !ts || !sig || nonce === undefined) return false;
  if (Date.now() - Number(ts) > POW_TTL_MS) return false;
  const expect = createHmac("sha256", powSecret()).update(`${challenge}.${ts}`).digest("hex");
  const a = Buffer.from(String(sig)), b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const h = createHash("sha256").update(`${challenge}:${nonce}`).digest("hex");
  return h.startsWith("0".repeat(POW_DIFFICULTY));
}
