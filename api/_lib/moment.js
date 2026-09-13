/* =====================================================================
   RAMONVILLE · api/_lib/moment.js — le bot sait QUAND on lui parle.

   Eddy, 13/09 : « the bots need to be able to know the current date ».
   Le modèle n’a pas d’horloge : sans ce bloc, « il y a cours ce soir ? »
   se répondait avec une date devinée. Calculé À CHAQUE MESSAGE (jamais mis
   en cache, contrairement aux FAITS), en heure de Paris : les serveurs
   Vercel tournent en UTC.

   Il porte aussi la TABLE ENFANTS, tirée du planning et des tarifs de
   data.js : « mon fils a 3 ans » doit donner le groupe, le jour, l’heure,
   le prix et le lien, sans question en plus.
   ===================================================================== */
const JOURS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CLES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const NOMS = { Dim: "dimanche", Lun: "lundi", Mar: "mardi", Mer: "mercredi", Jeu: "jeudi", Ven: "vendredi", Sam: "samedi" };
const DUREE = 60;               // le planning ne donne que les débuts : un cours dure une heure, par défaut
const OUVRE = 10 * 60, FERME = 21 * 60 + 30;

/* Les clés que chatbot.js sait transformer en boutons (BTN). Une clé hors
   liste est ignorée côté client : autant ne jamais l’écrire. */
export const BOUTONS_VALIDES = ["offre", "saison", "promos", "essai", "enfants", "abonnements", "boutique",
  "premiere", "tarifs", "planning", "disciplines", "plateau", "coachs", "galerie", "contact", "appeler", "rappel"];

const minutes = (h) => { const m = /(\d{1,2})h(\d{2})?/.exec(h || ""); return m ? +m[1] * 60 + +(m[2] || 0) : null; };
const hh = (m) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;

export function parisMaintenant(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now).map((x) => [x.type, x.value]));
  const i = JOURS_EN.indexOf(p.weekday);
  return {
    cle: CLES[i], index: i, mins: +p.hour * 60 + +p.minute,
    date: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now),
  };
}

function coursDu(schedule, cle) {
  return schedule.filter((s) => s.day === cle)
    /* « Boxe Anglaise (jusqu’à 20h15) » : quand le planning écrit la fin, elle prime sur l’heure par défaut */
    .map((s) => ({ ...s, debut: minutes(s.start), fin: minutes((/jusqu.?à\s*(\d{1,2}h\d{2})/i.exec(s.cours || "") || [])[1]) }))
    .filter((s) => s.debut != null)
    .sort((a, b) => a.debut - b.debut);
}

const ligne = (s) => `${hh(s.debut)} ${s.cours}${s.coach ? ` (${s.coach})` : ""}`;

function tableEnfants(schedule, tarifs) {
  const ecole = (tarifs || []).find((t) => /enfant/i.test(t.name || ""));
  const items = ecole?.items || [];
  const prixPour = (cours) => {
    const cle = /baby/i.test(cours) ? /baby/i : new RegExp((/(\d+\/\d+)/.exec(cours) || [])[1] || "^$");
    const it = items.find((x) => cle.test(x));
    const m = it && /(\d+)\s*€\s*\/\s*an/.exec(it);
    return m ? `${m[1]} €/an` : null;
  };
  const groupes = new Map();
  for (const s of schedule.filter((x) => x.fam === "enfant")) {
    const g = groupes.get(s.cours) || { cours: s.cours, coach: s.coach, creneaux: [] };
    g.creneaux.push(`${NOMS[s.day]} ${s.start}`);
    groupes.set(s.cours, g);
  }
  const ageMin = (g) => +((/(\d+)\//.exec(g.cours) || [0, 99])[1]);
  const lignes = [...groupes.values()].sort((a, b) => ageMin(a) - ageMin(b)).map((g) => {
    const age = /(\d+)\/(\d+)/.exec(g.cours);
    const tranche = age ? `${age[1]} à ${age[2]} ans` : g.cours;
    const prix = prixPour(g.cours);
    return `- ${tranche} → ${g.cours} : ${g.creneaux.join(" et ")}${prix ? ` · ${prix}` : ""}${g.coach ? ` · coach ${g.coach}` : ""}.`;
  });
  if (!lignes.length) return "";
  return `ÉCOLE ENFANTS — LA TABLE. Quand le visiteur donne l’âge de l’enfant, tu réponds DIRECTEMENT avec la bonne ligne (groupe, jour, heure, prix), sans reposer de question sur l’âge, et tu termines par [boutons: enfants, planning].
${lignes.join("\n")}
- Le parent peut rester dans la salle pendant le cours. Chez les enfants, on touche, on ne frappe pas.
- Un âge hors de ces tranches : tu le dis simplement et tu renvoies vers la salle (numéro de la fiche) pour le cours adapté — tu n’inventes aucun groupe.`;
}

/** Le bloc « maintenant », recalculé à chaque message. */
export async function contexteDuMoment(now = new Date()) {
  let D;
  try { D = await import("../../public/assets/js/data.js"); } catch { D = null; }
  const P = parisMaintenant(now);
  const L = [`MAINTENANT — heure de Paris, recalculée à chaque message ; c’est la SEULE date que tu connais : ${P.date}, ${hh(P.mins)}.`];
  const schedule = Array.isArray(D?.SCHEDULE) ? D.SCHEDULE : [];

  const ouverte = P.cle !== "Dim" && P.mins >= OUVRE && P.mins < FERME;
  L.push(ouverte ? `- La salle est OUVERTE en ce moment (${hh(OUVRE)} – ${hh(FERME)}).` : `- La salle est FERMÉE en ce moment (ouverte du lundi au samedi, ${hh(OUVRE)} – ${hh(FERME)}).`);

  const auj = coursDu(schedule, P.cle);
  const enCours = auj.filter((s) => P.mins >= s.debut && P.mins < (s.fin ?? s.debut + DUREE));
  const suivant = auj.find((s) => s.debut > P.mins);
  if (enCours.length) L.push(`- En ce moment : ${enCours.map((s) => `${s.cours} (commencé à ${hh(s.debut)})`).join(", ")}.`);
  if (suivant) L.push(`- Prochain cours aujourd’hui : ${ligne(suivant)}.`);
  else if (auj.length) L.push(`- Plus aucun cours aujourd’hui.`);
  L.push(auj.length ? `- Aujourd’hui (${NOMS[P.cle]}) : ${auj.map(ligne).join(", ")}.` : `- Aujourd’hui (${NOMS[P.cle]}) : aucun cours.`);

  // le prochain jour avec des cours (demain, ou lundi si demain est dimanche)
  for (let k = 1; k <= 7; k++) {
    const cle = CLES[(P.index + k) % 7];
    const jour = coursDu(schedule, cle);
    if (!jour.length) { if (k === 1) L.push(`- Demain (${NOMS[cle]}) : salle fermée, aucun cours.`); continue; }
    L.push(`- ${k === 1 ? "Demain" : `Prochain jour de cours`} (${NOMS[cle]}) : ${jour.map(ligne).join(", ")}.`);
    break;
  }
  L.push("Quand on te dit « aujourd’hui », « ce soir », « demain », « là, maintenant », tu réponds avec CE bloc, jamais avec une date devinée. Les heures de fin ne sont pas publiées : ne donne que les heures de début.");

  const enfants = tableEnfants(schedule, D?.TARIFS);
  if (enfants) L.push("", enfants);
  L.push("", `BOUTONS — tu écris [boutons: clé, clé] avec UNIQUEMENT ces clés : ${BOUTONS_VALIDES.join(", ")}. « promos » ouvre la page des offres spéciales de la boutique (l’année complète à 259 € et l’offre de rentrée à 29 €). Toute autre clé est ignorée.`);
  return L.join("\n");
}
