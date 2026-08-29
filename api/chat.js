/* L’assistant a été retiré du site. L’endpoint reste pour ne pas
   renvoyer une 500 à d’éventuels appels en cache. */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();
  return res.status(410).json({ error: "L’assistant n’est plus proposé." });
}
