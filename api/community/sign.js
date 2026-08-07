/* =====================================================================
   POST /api/community/sign — LE LAISSEZ-PASSER.

   Le fichier NE PASSE PAS par Vercel : une fonction serverless plafonne à
   4,5 Mo de corps de requête, et une vidéo du plateau en fait dix fois
   plus. On valide donc ici (identité, filtre à injures, débit par IP), on
   SIGNE des paramètres, et le navigateur téléverse en direct chez
   Cloudinary avec cette signature. Le clip atterrit tagué « pending » :
   personne ne le voit tant que le staff ne l'a pas approuvé.

   CE QU'ON EXIGE POUR DÉPOSER : un prénom, ET un moyen de recontact
   (email OU téléphone). Ce n'est pas un péage, c'est la contrepartie
   honnête : on publie ta photo sur le site du club, on veut savoir à qui
   dire merci — et le staff veut pouvoir te répondre. C'est aussi ce qui
   fait de la galerie une source de contacts (le navigateur poste ensuite
   vers /api/lead avec event="upload_contributor", dans le carnet qui
   existe déjà — on n'ouvre pas un second registre).

   LA VALIDATION DU FICHIER LUI-MÊME se fait en deux temps : le navigateur
   refuse l'évident avant l'envoi (type, poids, durée), et
   /api/community/check REVÉRIFIE APRÈS COUP sur les métadonnées que
   Cloudinary a extraites du fichier réel. Ce qui est vérifié ici ne peut
   pas être contourné en trafiquant le formulaire.
   ===================================================================== */
import {
  cloudinary, FOLDER, LIMITES, configuree, cleanName, estEmail, estTel,
} from "../_lib/community.js";
import { allowCors, bodyOf, ipOf, rateLimit, issuePow, verifyPow } from "../_lib/util.js";

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") return res.status(200).json(issuePow()); // le defi anti-bot
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  if (!configuree())
    return res.status(503).json({ error: "Le mur du club n'est pas encore ouvert. Reviens très vite." });

  const ip = ipOf(req);
  // garde-fou immédiat, avant même de parler à Cloudinary
  if (!rateLimit("upload:" + ip, 6, 10 * 60_000))
    return res.status(429).json({ error: "Tu y vas fort. Laisse passer dix minutes et reviens." });

  const b = bodyOf(req);

  /* Pot de miel : un humain ne voit pas ce champ. Un bot qui le remplit recoit
     une signature FACTICE — son upload echouera chez Cloudinary, en silence. */
  if (String(b.website || "").length > 0) {
    return res.status(200).json({ cloudName: "denied", apiKey: "0", timestamp: 0, folder: "x", tags: "pending", context: "", signature: "0" });
  }
  /* Preuve de travail obligatoire */
  if (!verifyPow(b.pow || {})) {
    return res.status(400).json({ error: "Vérification expirée — réessaie, ça prend une seconde." });
  }
  const prenom = cleanName(b.prenom, 40);
  const titre = cleanName(b.titre, 70);
  const email = String(b.email || "").trim();
  const tel = String(b.tel || "").trim();

  if (prenom.value.length < 2)
    return res.status(400).json({ error: "Donne-nous ton prénom — on veut savoir à qui dire merci." });
  if (prenom.bad || titre.bad)
    return res.status(400).json({ error: "Ce nom ne passe pas. Trouve-en un autre, on n'est pas difficiles." });
  if (!email && !tel)
    return res.status(400).json({ error: "Laisse un email ou un numéro : c'est comme ça qu'on te répond." });
  if (email && !estEmail(email))
    return res.status(400).json({ error: "Cet email ne ressemble pas à un email. Vérifie-le." });
  if (tel && !estTel(tel))
    return res.status(400).json({ error: "Ce numéro ne ressemble pas à un numéro français. Vérifie-le." });

  const type = b.type === "image" ? "image" : "video";

  /* Débit par IP, vu depuis le stockage : le compteur en mémoire ci-dessus
     ne survit pas au recyclage de l'instance, celui-ci compte les fichiers
     RÉELLEMENT déposés. La recherche est un service au mieux — si elle ne
     répond pas, on laisse passer plutôt que de bloquer un vrai visiteur. */
  const fenetreMin = +(process.env.COMMUNITY_FENETRE_MIN || 10);
  const maxParFenetre = +(process.env.COMMUNITY_MAX_PAR_FENETRE || 3);
  try {
    const depuis = new Date(Date.now() - fenetreMin * 60000).toISOString();
    const r = await cloudinary.search
      .expression(`folder:${FOLDER} AND context.ip="${ip}" AND uploaded_at>"${depuis}"`)
      .max_results(maxParFenetre + 1)
      .execute();
    if ((r.total_count ?? (r.resources || []).length) >= maxParFenetre)
      return res.status(429).json({ error: `Trop d'envois d'un coup. Reviens dans ${fenetreMin} minutes.` });
  } catch { /* au mieux — on ne punit pas le visiteur d'une panne d'index */ }

  const timestamp = Math.round(Date.now() / 1000);
  /* Le contexte voyage AVEC le fichier : c'est là que vivent le prénom, le
     titre, l'IP (pour le débit) et le moyen de recontact. Le staff les relit
     dans Le vestiaire au moment de modérer. */
  const context = [
    `titre=${titre.value}`,
    `auteur=${prenom.value}`,
    `ip=${ip}`,
    email ? `email=${email}` : "",
    tel ? `tel=${tel}` : "",
  ].filter(Boolean).join("|");

  const aSigner = { context, folder: FOLDER, tags: "pending", timestamp };
  const signature = cloudinary.utils.api_sign_request(aSigner, cloudinary.config().api_secret);

  return res.status(200).json({
    cloudName: cloudinary.config().cloud_name,
    apiKey: cloudinary.config().api_key,
    timestamp, folder: FOLDER, tags: "pending", context, signature,
    type, limites: LIMITES,
  });
}
