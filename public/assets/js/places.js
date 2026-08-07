/**
 * « Plus que N places » — la rarete, mais la VRAIE.
 *
 * Le nombre vient des inscriptions REELLEMENT payees sur l'offre de rentree
 * (box-plus, /api/offre-rentree/places = quota decide par le patron, moins les
 * ventes). Il descend pour de bon et il est le meme pour tout le monde.
 *
 * Pourquoi pas un compteur qui descend tout seul, different d'une rue a
 * l'autre : annoncer une disponibilite limitee qui n'existe pas est une
 * pratique commerciale trompeuse (code de la consommation, art. L.121-2 et
 * L.121-4) ; le faire varier par micro-zone pour que deux voisins ne puissent
 * pas recouper, c'est ce qui transforme l'erreur en intention. Et la
 * geolocalisation par IP ne descend de toute facon pas a la rue : en 4G, le
 * partage d'adresses change la zone d'un instant a l'autre, donc le nombre
 * sauterait du wifi aux donnees mobiles.
 *
 * REGLE DE SECURITE : pas de reponse, pas de compteur. Jamais de valeur de
 * repli — un compteur absent ne coute rien, un compteur invente coute tout.
 */
const BCP_PLACES_SOURCE = "https://box-plus.vercel.app/api/offre-rentree/places";
const BCP_PLACES_SEUIL = 25;   // au-dela, le nombre n'impressionne plus : on se tait

let _bcpPlaces = null;

function _bcpLirePlaces() {
  if (_bcpPlaces) return _bcpPlaces;
  _bcpPlaces = fetch(BCP_PLACES_SOURCE, { credentials: "omit" })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((d) => {
      // On ne retient QUE les reponses utiles : un hoquet reseau ne doit pas
      // supprimer le compteur pour le reste de la visite.
      if (!d || !d.ok) _bcpPlaces = null;
      return d;
    });
  return _bcpPlaces;
}

const _BCP_MOIS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];

function _bcpDateEnClair(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return null;
  const jour = Number(m[3]);
  return (jour === 1 ? "1er" : jour) + " " + _BCP_MOIS[Number(m[2]) - 1];
}

export async function initPlaces() {
  const cibles = document.querySelectorAll("[data-places]");
  if (!cibles.length) return;
  const d = await _bcpLirePlaces();
  if (!d || !d.ok || typeof d.restantes !== "number") return;
  const n = d.restantes;
  if (n <= 0 || n > BCP_PLACES_SEUIL) return;
  const fin = d.fin ? _bcpDateEnClair(d.fin) : null;
  cibles.forEach((el) => {
    el.textContent = n === 1
      ? "Derniere place a ce prix"
      : "Plus que " + n + " places a ce prix" + (fin ? ", jusqu\u2019au " + fin : "");
    el.hidden = false;
    el.setAttribute("role", "status");
  });
}
