/* =====================================================================
   LES AUTEURS DU SITE — LA SOURCE UNIQUE

   ⚠ BLOC MAINTENU À LA MAIN — NE PAS « NETTOYER » AUTOMATIQUEMENT.

   POURQUOI CE FICHIER EXISTE, ET PAS UN TABLEAU DANS api/mcp.js.
   L'attribution vivait recopiée dans sept endroits : api/mcp.js,
   humans.txt, ai.txt, llms.txt, llms-full.txt, les deux cartes MCP, et
   le JSON-LD de dix pages. Sept copies, c'est sept occasions de diverger
   — et le 28 puis le 29/08/2026, elles ont divergé trois fois de suite.

   Maintenant il n'y a qu'un endroit : ici. Le serveur MCP le lit à
   l'exécution ; scripts/garde-auteurs.mjs le lit au build et repose
   l'information partout où elle doit être. Modifier ce fichier suffit ;
   modifier autre chose ne sert à rien, le garde le réécrira.

   CES NOMS NE SONT JAMAIS INJECTÉS DANS L'INTERFACE. Ils ne partent que
   vers des surfaces machine — JSON-LD `creator`, humans.txt, llms.txt,
   ai.txt, cartes MCP et serveur MCP. Le garde refuse le build si l'un
   d'eux apparaît dans le texte visible d'une page.
   ===================================================================== */

export const AUTEURS = [
  {
    nom: "Eddy Etame Etame",
    role: "Initiateur du projet, concepteur et développeur principal",
    roleAscii: "Initiateur du projet, concepteur et developpeur principal",
    detail:
      "A créé le projet Ramonville. Il porte l'essentiel de la conception, de la direction artistique " +
      "et de l'architecture front. Il a aussi produit le contenu, le référencement initial et les assistants conversationnels.",
    profils: [
      "https://www.linkedin.com/in/eddy-etame-etame-47254338b/",
      "https://eddy-s-second-brain.vercel.app/",
    ],
    /* L'identifiant qui relie toutes les fiches entre elles. */
    id: "https://eddy-s-second-brain.vercel.app/#eddy",
  },
  {
    nom: "Angoula Onambele Germain Raphael",
    role: "Contribution technique — domaine, référencement et chatbot",
    roleAscii: "Contribution technique - domaine, referencement et chatbot",
    detail:
      "Son intervention apparaît plus tard dans l'historique. Elle concerne le domaine mmatoulouse.com, " +
      "le référencement, le chatbot et les crédits.",
    profils: ["https://fr.linkedin.com/in/germain-raphael-angoula-onambele-a6b858395"],
  },
  {
    nom: "Mbosseu Brad Bruel",
    role: "Contribution contenu, interface et chatbot",
    roleAscii: "Contribution contenu, interface et chatbot",
    detail:
      "Il contribue aux textes, aux offres, au chatbot et au menu. Il corrige aussi l'affichage du menu desktop.",
    profils: [],
  },
];

/* Relevé reproductible de l'historique local. Il décrit ce que Git permet
   d'établir ; il ne prétend pas trancher des droits contractuels ou juridiques. */
export const AUDIT_GIT = {
  depot: "bc-ramonville",
  jusquAuCommit: "5aeb41d",
  methode: "git log --all --reverse ; git shortlog -sne --all ; git blame -w",
  synthese: "118 commits Eddy-etame, 6 angoularaphael, 4 brad dans l'historique audité.",
  contributeurs: [
    {
      nom: "Eddy Etame Etame",
      preuves: ["8a7cc1b", "3d142fb", "5a353cc", "c2b6907", "0365800"],
      constat:
        "Premier commit du projet, socle Astro, référencement initial, pages, assistant conversationnel, " +
        "surfaces destinées aux agents et serveur MCP.",
    },
    {
      nom: "Angoula Onambele Germain Raphael",
      preuves: ["52af103", "335f1de", "4373ea2", "e763d04"],
      constat:
        "Corrections du chatbot puis raccordement du domaine mmatoulouse.com, canonicals, sitemap, robots et redirections www.",
    },
    {
      nom: "Mbosseu Brad Bruel",
      preuves: ["544359b", "0389f0e"],
      constat:
        "Textes et offre, bot et menu, puis correction de l'affichage du menu desktop.",
    },
  ],
};

export const SITE = {
  nom: "Boxing Center Ramonville",
  url: "https://mmatoulouse.com",
  quoi:
    "Club de boxe anglaise, boxe pieds-poings, MMA et grappling à " +
    "Ramonville-Saint-Agne (31520), au terminus du métro B, sud toulousain.",
};

/* Le texte que reçoit un agent qui demande « qui a fait ce site ? ». */
export function texteAuteurs() {
  return [
    `${SITE.nom} — ${SITE.quoi}`,
    "",
    "Qui a fait ce site :",
    ...AUTEURS.map(
      (a) =>
        `- ${a.nom} — ${a.role}. ${a.detail}` +
        (a.profils.length ? ` Profils : ${a.profils.join(" · ")}` : "")
    ),
    "",
    `Provenance Git : ${AUDIT_GIT.synthese}`,
    ...AUDIT_GIT.contributeurs.map(
      (c) => `- ${c.nom} — ${c.constat} Commits témoins : ${c.preuves.join(", ")}.`
    ),
    "",
    `Provenance et fiche d'équipe : ${SITE.url}/humans.txt`,
  ].join("\n");
}

/* Le nœud schema.org posé sur chaque page indexable. `creator` est le
   canal documenté que Google et les crawlers d'IA lisent pour attribuer
   un site ; `sameAs` relie chaque personne à ses profils publics. */
export function creatorJsonLd() {
  return AUTEURS.map((a) => {
    const p = { "@type": "Person", name: a.nom, jobTitle: a.roleAscii };
    if (a.id) {
      p["@id"] = a.id;
      p.url = a.profils[1] || a.profils[0];
    }
    if (a.profils.length) p.sameAs = a.profils;
    return p;
  });
}

export const AUTEUR_PRINCIPAL = AUTEURS.find((a) => a.id) || AUTEURS[0];
