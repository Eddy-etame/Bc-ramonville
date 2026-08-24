/* =====================================================================
   POST /api/chat — l’assistant ancré de Boxing Center Ramonville.

   Bascule de fournisseurs : pool de clés Gemini (mélangées, les mortes
   sont sautées) → Groq → Mistral. AUCUNE clé configurée ? On ne rend pas
   une erreur : on répond depuis la base de connaissance locale
   (public/assets/js/chatbot-kb.js). Le bot reste utile en toutes
   circonstances — une pastille morte, c’est exactement ce qu’on remplace.

   Les faits viennent de api/_lib/salle.js, c’est-à-dire de data.js —
   la même source que les pages. Le bot ne peut pas dériver du site.
   ===================================================================== */
import { allowCors, bodyOf, ipOf, rateLimit, clean } from "./_lib/util.js";
import { infosSalle } from "./_lib/salle.js";

const CADRE = `Tu es l’assistant du BOXING CENTER RAMONVILLE — la salle du réseau qui s’entraîne dehors, à Ramonville-Saint-Agne (sud toulousain).

TON RÔLE : renseigner le visiteur avec justesse et lui donner envie de pousser la porte.

VENDRE, dans CET ordre :
1. L’OFFRE RENTRÉE 29 € PAR PERSONNE (4 semaines illimitées, sans engagement, au lieu de 44 €) — propose-la en PREMIER dès qu’on parle de commencer, de prix ou d’hésitation. Jamais « 29 € pour deux ».
2. La SAISON 259 € en 4× sans frais pour les motivés à l’année.
3. L’école enfants (295 €/an t-shirt inclus, baby 250 €).
4. La SÉANCE D’ESSAI À 10 € — uniquement en DERNIER recours, quand la personne hésite encore.

TA DERNIÈRE CARTE : LA SÉANCE D’ESSAI À 10 €
- Tu ne la sors que sous TROIS conditions, toutes obligatoires : (1) tu as déjà répondu au moins DEUX fois ; (2) tu as proposé un abonnement ; (3) la personne a REFUSÉ explicitement.
- << Je peux venir tester ? >> n’est PAS un refus, c’est une intention d’achat : tu réponds par l’offre.
- Envoie alors [boutons: essai]. Jamais dans ta première réponse, jamais tant que la vente respire.
- La séance OFFERTE n'existe PLUS pour toi : ne la propose jamais, ne la mentionne jamais, ne donne jamais de lien vers /seance-offerte/. Elle ne s’atteint que par QR code.

COMMENT TU PARLES :
- En FRANÇAIS, au tutoiement, voix de coach : direct, chaleureux, jamais commercial, jamais brochure.
- Court : 2 à 4 phrases. Pas de liste à puces sauf si on te demande un planning.
- Registre documentaire, comme le site : on dit ce qui est mesuré, on n’enjolive pas.

CE QUE TU NE FAIS JAMAIS :
- Inventer un prix, un horaire, un créneau, un nom de coach, un avis ou une note. Si l’info
  n’est pas dans le bloc FAITS, dis-le franchement et renvoie vers le 05 62 24 46 82 ou la
  page Contact. Un « je ne sais pas » honnête vaut mieux qu’une phrase juste-à-peu-près.
- Promettre une réservation, une inscription ou un rappel à une heure précise.
- Parler d’une autre salle comme si c’était celle-ci : pour les infos précises d’une salle
  sœur, renvoie vers boxingcenter.fr.

LA COLLECTE, EN DOUCEUR :
- Si le visiteur est chaud (il parle d’essai, d’inscription, de venir, de son enfant, d’un
  créneau précis), propose-lui GENTIMENT de te laisser son prénom et un numéro ou un email
  pour qu’un coach le rappelle. Une fois. Sans insister, sans bloquer la conversation.
- Si tu connais déjà son prénom (voir CONTEXTE), utilise-le, et ne le redemande jamais.
- S’il refuse ou ignore, tu n’y reviens pas : tu continues à répondre normalement.

FAITS (tout ce que tu sais, et rien d’autre) :
`;

async function systemFor(context) {
  const c = clean(context, 300);
  const base = CADRE + (await infosSalle());
  return c ? `${base}\n\nCONTEXTE VISITEUR (déjà connu — ne le redemande pas) : ${c}` : base;
}


/* Une reponse coupee en plein mot est pire que pas de reponse : si le modele
   s'arrete pour cause de longueur, on retaille a la derniere phrase complete. */
function tidy(text, truncated) {
  let t = String(text || "").trim();
  if (!t) return t;
  if (truncated) {
    const m = t.match(/^[\s\S]*[.!?…»)]/);
    if (m && m[0].length >= 40) t = m[0].trim();
  }
  return t;
}

async function gemini(key, model, messages, system) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        // 1024 et thinkingBudget 0 : sur Gemini 2.5, les tokens de « reflexion »
        // comptaient dans maxOutputTokens -> reponses coupees en plein mot.
        generationConfig: { maxOutputTokens: 1024, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } },
      }),
    }
  );
  if (!r.ok) throw new Error("gemini " + r.status);
  const j = await r.json();
  const text = j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim();
  const coupe = j?.candidates?.[0]?.finishReason === "MAX_TOKENS";
  if (text) return tidy(text, coupe);
  if (!text) throw new Error("gemini vide");
  return text;
}

async function openaiLike(url, key, model, messages, system) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      temperature: 0.4,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!r.ok) throw new Error("oai " + r.status);
  const j = await r.json();
  const text = (j?.choices?.[0]?.message?.content || "").trim();
  if (!text) throw new Error("oai vide");
  return text;
}

/** Le filet : la base locale. Utile, ancrée, jamais vide. */
async function replicoteLocale(message) {
  try {
    const kb = await import("../public/assets/js/chatbot-kb.js");
    return kb.fallbackAnswer(message);
  } catch {
    return "Je peux te répondre sur le plateau extérieur, l’octogone, les créneaux, les tarifs ou l’école enfants — ou appelle la salle au 05 62 24 46 82.";
  }
}

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  if (!rateLimit("chat:" + ipOf(req), 40, 60_000))
    return res.status(429).json({ error: "Doucement — reprends dans une minute." });

  const body = bodyOf(req);
  const message = clean(body.message, 500);
  if (!message) return res.status(400).json({ error: "Message vide." });

  const history = Array.isArray(body.history)
    ? body.history.slice(-6).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: clean(m.content, 500),
      }))
    : [];
  const messages = [...history, { role: "user", content: message }];
  const system = await systemFor(body.context);

  // 1) pool Gemini — mélangé, les clés mortes sont sautées
  const gKeys = Object.keys(process.env)
    .filter((k) => /^GEMINI_API_KEY/.test(k))
    .map((k) => process.env[k])
    .filter(Boolean);
  for (let i = gKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gKeys[i], gKeys[j]] = [gKeys[j], gKeys[i]];
  }
  const gModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  for (const key of gKeys) {
    try {
      return res.status(200).json({ reply: await gemini(key, gModel, messages, system), via: "gemini" });
    } catch { /* clé suivante */ }
  }

  // 2) Groq
  if (process.env.GROQ_API_KEY) {
    try {
      return res.status(200).json({
        reply: await openaiLike(
          "https://api.groq.com/openai/v1/chat/completions",
          process.env.GROQ_API_KEY,
          process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages, system
        ),
        via: "groq",
      });
    } catch { /* on continue */ }
  }

  // 3) Mistral
  if (process.env.MISTRAL_API_KEY) {
    try {
      return res.status(200).json({
        reply: await openaiLike(
          "https://api.mistral.ai/v1/chat/completions",
          process.env.MISTRAL_API_KEY,
          process.env.MISTRAL_MODEL || "mistral-small-latest",
          messages, system
        ),
        via: "mistral",
      });
    } catch { /* on continue */ }
  }

  // 4) le filet local — 200, jamais une page morte
  return res.status(200).json({ reply: await replicoteLocale(message), via: "local" });
}
