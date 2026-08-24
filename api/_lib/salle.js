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

/* LE REPLI MENTAIT SUR TROIS FAITS, ET IL EST LE SEUL BLOC QUE PERSONNE
   NE RELIT : il ne sert que quand l’import de data.js échoue, c’est-à-dire
   au pire moment. Il portait « un ring de boxe olympique » (le claim que
   la salle ne confirme pas, purgé partout ailleurs), « Offre Duo » (le nom
   abandonné) et 47 avis (il y en a 55). Un repli a le droit d’être moins
   riche ; il n’a jamais le droit d’être faux. */
const REPLI = `- Boxing Center Ramonville : la seule salle du réseau qui s’entraîne dehors — 300 m² extérieurs aménagés et protégés des intempéries, un octogone de 7 m, un grand ring de boxe, deux niveaux avec un étage muscu/cardio.
- Adresse : 33 rue des Ormes, 31520 Ramonville-Saint-Agne. Téléphone : 05 62 24 46 82. Email : boxingcenter31@gmail.com.
- Accès : métro ligne B, terminus Ramonville, à proximité ; bus arrêt Ramonville Sud ; sortie rocade Ramonville.
- Horaires : du lundi au samedi, 10h00 – 21h30. Fermé le dimanche. Accès libre muscu/cardio inclus.
- Émargement GPS obligatoire en salle avant chaque cours.
- Disciplines : boxe anglaise et anglaise loisirs, boxe pieds-poings, grappling, asso MMA (dans l’octogone), Boxing Camp, Lady Punch (100 % féminin), école enfants du Baby Boxe 3/6 ans aux ados 12/16, accès libre muscu/cardio.
- Coachs : Sonia (pieds-poings, Lady Punch, Camp), Jérôme (grappling, asso MMA), Farouk (anglaise loisirs, anglaise du mercredi soir), Valentin G (anglaise, école enfants).
- Tarifs, dans l’ordre : Offre Rentrée 29 € PAR PERSONNE pour 4 semaines illimitées ; Offre Saison 259 € les 12 mois, payable en 4× sans frais, accès libre aux 5 clubs du réseau ; école enfants dès 3 ans (295 €/an, baby 250 €) ; et EN DERNIER la séance d’essai 10 € (toutes disciplines, matériel prêté, sans engagement).
- Première séance : on dit à l’accueil que c’est sa première fois, un coach prête les gants et les bandes. Aucun sparring imposé, aucun test de niveau, aucun engagement. À apporter : t-shirt, short ou legging, baskets propres, bouteille d’eau. Le déroulé complet est sur /premiere-seance/.
- Avis Google : 4,1/5 sur 55 avis.`;

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
    /* « olympique » a été purgé des huit pages, des deux llms et du sitemap —
       et il est resté ICI, dans la seule phrase que le bot récite à chaque
       conversation. Le claim n’est confirmé par aucune source du club. */
    `${S.name} : ${S.baseline} La seule salle du réseau qui s’entraîne dehors — 300 m² extérieurs aménagés et protégés des intempéries, un octogone de 7 m, un grand ring de boxe, deux niveaux avec un étage muscu/cardio.`
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
        ". L’Offre Rentrée est de 29 € PAR PERSONNE (jamais « 29 € pour deux », jamais appelée « Duo »). La séance d’essai se propose EN DERNIER."
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

  /* CE QUE LE BOT NE SAVAIT PAS DIRE : ce qui se passe une première fois.
     C’est pourtant la question la plus fréquente d’un visiteur qui n’a
     jamais boxé — et la page /premiere-seance/ y répond en entier. */
  L.push(
    "Première séance (page dédiée : /premiere-seance/) : on arrive un quart d’heure avant le cours, on dit à l’accueil que c’est sa première fois, on émarge, un coach prête les gants et les bandes et montre le plateau ; puis c’est le cours normal — échauffement, technique, sac. AUCUN sparring imposé (personne ne monte sur le ring sans en avoir envie), AUCUN test de niveau, AUCUN engagement. À apporter : t-shirt, short ou legging, baskets propres gardées pour l’intérieur, bouteille d’eau."
  );

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
