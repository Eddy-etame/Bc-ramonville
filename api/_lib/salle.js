/* =====================================================================
   RAMONVILLE · api/_lib/salle.js — les FAITS, une seule fois.

   Le bloc d’ancrage du bot est CONSTRUIT depuis public/assets/js/data.js,
   c’est-à-dire depuis la même source que les pages. Personne ne re-tape
   une adresse ni un horaire ici : si le planning bouge sur le site, le
   bot bouge avec lui, sans intervention.

   Par-dessus, src/content.json — ce que « Le vestiaire » modifie. Il ne
   remplace que les champs qu’il contient réellement.

   Si la lecture échoue (bundle inattendu), un repli figé prend le relais :
   moins riche, mais jamais faux, jamais vide.
   ===================================================================== */
import { readFileSync } from "fs";
import { join } from "path";

const REPLI = `- Boxing Center Ramonville : la seule salle du réseau qui s’entraîne dehors — 300 m² extérieurs aménagés et protégés des intempéries, un octogone de 7 m, un ring de boxe olympique, deux niveaux avec un étage muscu/cardio.
- Adresse : 33 rue des Ormes, 31520 Ramonville-Saint-Agne. Téléphone : 05 62 24 46 82. Email : boxingcenter31@gmail.com.
- Accès : métro ligne B, terminus Ramonville, à proximité ; bus arrêt Ramonville Sud ; sortie rocade Ramonville.
- Horaires : du lundi au samedi, 10h00 – 21h30. Fermé le dimanche. Accès libre muscu/cardio inclus.
- Émargement GPS obligatoire en salle avant chaque cours.
- Disciplines : boxe anglaise et anglaise loisirs, boxe pieds-poings, grappling, asso MMA (dans l’octogone), Boxing Camp, Lady Punch (100 % féminin), école enfants du Baby Boxe 3/6 ans aux ados 12/16, accès libre muscu/cardio.
- Coachs : Sonia (pieds-poings, Lady Punch, Camp), Jérôme (grappling, asso MMA), Farouk (anglaise loisirs, Camp), Valentin G (anglaise, école enfants).
- Tarifs : séance d’essai 10 € (toutes disciplines, matériel prêté, sans engagement) ; Offre Duo 29 € par personne pour 4 semaines illimitées ; Offre Saison 259 € les 12 mois, payable en 4× sans frais, accès libre aux 5 clubs du réseau ; école enfants dès 3 ans.
- Avis Google : 4,1/5 sur 47 avis.`;

let cache = null;

/** Charge data.js (source de vérité du site) — une seule fois par instance. */
async function chargerData() {
  try {
    return await import("../../public/assets/js/data.js");
  } catch {
    return null;
  }
}

/** Le calque éditable du vestiaire. Absent = pas grave. */
function overlay() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "src/content.json"), "utf8"));
  } catch {
    return {};
  }
}

/** Le bloc de faits injecté dans le prompt système. */
export async function infosSalle() {
  if (cache) return cache;
  const D = await chargerData();
  if (!D?.SALLE) return (cache = REPLI);

  const c = overlay();
  const S = { ...D.SALLE, ...(c.salle || {}) };
  const adresse = c.salle?.address || S.address;
  const L = [];

  L.push(
    `${S.name} : ${S.baseline} La seule salle du réseau qui s’entraîne dehors — 300 m² extérieurs aménagés et protégés des intempéries, un octogone de 7 m, un ring de boxe olympique, deux niveaux avec un étage muscu/cardio.`
  );
  L.push(`Adresse : ${adresse.full}. Téléphone : ${S.phone}. Email : ${S.email}.`);
  if (Array.isArray(S.access) && S.access.length) L.push(`Accès : ${S.access.join(" ; ")}.`);
  L.push(`Horaires : ${S.hours}. Fermé le dimanche. Accès libre muscu/cardio inclus.`);
  if (S.note) L.push(S.note);

  const disciplines = c.disciplines || D.DISCIPLINES;
  if (Array.isArray(disciplines) && disciplines.length)
    L.push(
      "Disciplines : " +
        disciplines.map((d) => `${d.name} (${d.coach} — ${d.jours} — ${d.niveau})`).join(" ; ") +
        "."
    );

  const coachs = c.coaches || D.COACHES;
  if (Array.isArray(coachs) && coachs.length)
    L.push("Coachs : " + coachs.map((m) => `${m.name} (${m.role})`).join(", ") + ".");

  const tarifs = c.tarifs || D.TARIFS;
  if (Array.isArray(tarifs) && tarifs.length)
    L.push(
      "Tarifs : " +
        tarifs.map((t) => `${t.name} ${t.price} ${t.period} — ${t.feature}`).join(" ; ") +
        ". L’Offre Duo est de 29 € PAR PERSONNE (jamais « 29 € pour deux »)."
    );

  const planning = c.schedule || D.SCHEDULE;
  if (Array.isArray(planning) && planning.length)
    L.push(
      "Planning de la rentrée : " +
        (D.DAYS || ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"])
          .map((j) => {
            const lignes = planning.filter((s) => s.day === j);
            return lignes.length
              ? `${j} — ${lignes.map((s) => `${s.start} ${s.cours} (${s.coach})`).join(", ")}`
              : null;
          })
          .filter(Boolean)
          .join(" ; ") +
        "."
    );

  if (D.ETE) L.push(`L’été : ${D.ETE.lead} ${D.ETE.libre.k} en accès libre. Dimanche fermé.`);
  if (D.REVIEWS) L.push(`Avis Google : ${D.REVIEWS.rating} sur ${D.REVIEWS.count} avis.`);
  if (Array.isArray(D.NETWORK))
    L.push(
      "Réseau Boxing Center (l’abonnement Saison donne accès libre aux 5 clubs) : " +
        D.NETWORK.map((n) => `${n.name} (${n.tag})`).join(", ") +
        ". Site du groupe : boxingcenter.fr."
    );

  cache = "- " + L.join("\n- ");
  return cache;
}
