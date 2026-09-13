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
   la salle ne confirme pas, purgé partout ailleurs), un ancien nom d'offre
   et 47 avis (il y en a 55). Un repli a le droit d’être moins
   riche ; il n’a jamais le droit d’être faux. */
const REPLI = `- Boxing Center Ramonville : un club ouvert à tous, même si tu n’as jamais fait de sport. La seule salle du réseau qui s’entraîne dehors — 300 m² couverts, une cage de 7 m (octogone), un grand ring de boxe, deux niveaux avec muscu et cardio.
- Adresse : 33 rue des Ormes, 31520 Ramonville-Saint-Agne. Téléphone : 09 39 03 67 48. Email : boxingcenter31@gmail.com.
- Accès : métro ligne B, terminus Ramonville, à proximité ; bus arrêt Ramonville Sud ; sortie rocade Ramonville.
- Horaires : du lundi au samedi, 10h00 – 21h30. Fermé le dimanche. Accès libre muscu/cardio inclus.
- Avant chaque cours : valider sa présence à l’accueil (émargement GPS).
- Cours : boxe anglaise, boxe pieds-poings, grappling (combat au sol), MMA tous niveaux (dans la cage), Boxing Camp, Lady Punch (100 % féminin), école enfants dès 3 ans, accès libre muscu/cardio. Tous ouverts aux débutants.
- Coachs : Sonia (pieds-poings, Lady Punch, Camp), Jérôme (grappling, MMA), Farouk (boxe anglaise du soir), Valentin Guth (école enfants), Hicham (boxe anglaise des midis).
- Tarifs, dans l’ordre : Offre Saison 259 € les 12 mois au lieu de 400 € (tarif annuel normal), payés comptant ; 4× uniquement via PayPal si l’option est disponible et si la personne est éligible ; accès libre aux 5 clubs du réseau. Puis, sans engagement, Offre Rentrée 29 € PAR PERSONNE TOUTES LES 4 SEMAINES au lieu de 44 € ; première échéance par carte bancaire puis prélèvements sur IBAN ; coordonnées d’un proche requises ; badge nominatif 34,99 € en plus, facturé 72 h après le début. École enfants dès 3 ans (295 €/an, baby 250 €). EN DERNIER : séance d’essai 10 €, conditions à confirmer avec la salle.
- CGV : le badge nominatif à 34,99 € s’ajoute à tous les abonnements sans engagement de 4 semaines, sauf exception indiquée dans l’offre ou les CGV.
- Première séance : on dit à l’accueil que c’est sa première fois et un coach oriente la personne. Aucun combat imposé, aucun test de niveau. À apporter : t-shirt, short ou legging, baskets propres, bouteille d’eau. Vérifier le matériel requis avec la salle.
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
        disciplines.map((d) => `${d.name} (${d.jours} — ${d.niveau})`).join(" ; ") +
        "."
    );

  const coachs = c.coaches || D.COACHES;
  if (Array.isArray(coachs) && coachs.length)
    L.push("Coachs : " + coachs.map((m) => `${m.name} (${m.role})`).join(", ") + ".");

  const tarifs = c.tarifs || D.TARIFS;
  if (Array.isArray(tarifs) && tarifs.length)
    L.push(
      "Tarifs : " +
        tarifs.map((t) =>
          `${t.name} ${t.price} ${t.period} — ${t.feature}` +
          (Array.isArray(t.items) && t.items.length ? ` — ${t.items.join(" ; ")}` : "")
        ).join(" ; ") +
        ". La Saison coûte 259 € comptant au lieu de 400 € (le tarif annuel normal) et s’annonce EN PREMIER ; le 4× est proposé uniquement par PayPal, sous réserve de disponibilité et d’éligibilité. L’Offre Rentrée, l’alternative sans engagement, est de 29 € PAR PERSONNE TOUTES LES 4 SEMAINES au lieu de 44 €. La première échéance est payée par carte bancaire, puis les suivantes sont prélevées sur IBAN. Les coordonnées d’un proche sont requises. Le badge nominatif de 34,99 € est facturé en plus 72 h après le début. La séance d’essai se propose EN DERNIER."
    );
  if (D.CONDITIONS_COMMERCIALES?.badge) L.push(`CGV : ${D.CONDITIONS_COMMERCIALES.badge}`);

  const planning = c.schedule || D.SCHEDULE;
  if (Array.isArray(planning) && planning.length)
    L.push(
      "Planning de la rentrée : " +
        (D.DAYS || ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"])
          .map((j) => {
            const lignes = planning.filter((s) => s.day === j);
            return lignes.length
              ? `${j} — ${lignes.map((s) => `${s.start} ${s.cours}`).join(", ")}`
              : null;
          })
          .filter(Boolean)
          .join(" ; ") +
        "."
    );

  /* CE QUE LE BOT NE SAVAIT PAS DIRE : ce qui se passe une première fois.
     C’est pourtant la question la plus fréquente d’un visiteur qui n’a
     jamais boxé. */
  L.push(
    "Première séance : on arrive un quart d’heure avant le cours, on dit à l’accueil que c’est sa première fois, on valide sa présence et un coach oriente la personne ; puis c’est le cours normal — échauffement, un geste, du sac. AUCUN combat imposé (personne ne monte sur le ring sans en avoir envie), AUCUN test de niveau. À apporter : t-shirt, short ou legging, baskets propres gardées pour l’intérieur, bouteille d’eau. Le matériel requis est à confirmer avec la salle."
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
