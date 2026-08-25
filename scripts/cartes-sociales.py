# -*- coding: utf-8 -*-
"""RAMONVILLE · les cartes sociales — une par page, 1200 x 630, pour de vrai.

POURQUOI CE SCRIPT EXISTE.
Le 24/08/2026, le site declarait `og:image:width 1200` et `og:image:height 630`
sur onze pages. Cinq images sur six ne faisaient pas cette taille : quatre
etaient des photos de 768 x 512, une etait l'affiche du planning en 1400 x 1069.
Une declaration fausse ne donne pas une image un peu differente : elle donne une
vignette rognee de travers dans chaque partage WhatsApp, chaque post Facebook,
chaque lien colle dans une conversation.

Pire, `og.jpg` — la carte de l'ACCUEIL, celle que tout le monde voit en premier —
faisait bien 1200 x 630 mais avait un RGB moyen de 121/121/121 : canaux
strictement egaux, donc du gris pur. La salle a un sol rouge et vert, un ring
bleu et quatre drapeaux au mur ; elle arrivait en noir et blanc dans chaque
partage.

CE QUE FAIT CE SCRIPT.
Une carte par page, au format exact, construite avec la maison :
  · la photo de la page, en couleur, graduee comme le site (pas eteinte) ;
  · un voile diagonal qui descend vers le navy #141a26, pour que le texte tienne
    quelle que soit la photo ;
  · le titre en Chakra Petch — les VRAIES lettres du site. La police n'est pas
    installee sur cette machine, alors on lit la woff2 deja embarquee dans le
    site et on convertit chaque glyphe en chemin SVG. Meme fichier, memes
    glyphes, meme rendu qu'a l'ecran ;
  · une ligne de faits en JetBrains Mono, celle qui vend : le prix, la note, le
    metro ;
  · le losange d'accent de la marque, et la signature du club.

Rien n'est tape a la main : le titre, les faits et la photo viennent de la
definition ci-dessous, et les dimensions declarees dans le HTML sont celles du
fichier produit — verifiees a la fin.

Usage : python scripts/cartes-sociales.py
Les TTF viennent de scripts/og-src/ (conversion des woff2 du site).
"""
import io
import os
import re
import subprocess

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

RACINE = r"C:\Users\Mommy Jayce\Desktop\Boxing Center\sites\bc-ramonville"
os.chdir(RACINE)
SORTIE = "public/assets/img/ram/og"
os.makedirs(SORTIE, exist_ok=True)

L, H = 1200, 630
NAVY, ENCRE, ARGENT, MUET = "#141a26", "#e8ebf4", "#9fb6d9", "#8a93a8"
CLUB = "BOXING CENTER RAMONVILLE"

# --------------------------------------------------------------- typographie

class Police:
    """Dessine du texte en chemins SVG, avec les vrais glyphes du site."""

    def __init__(self, chemin):
        self.f = TTFont(chemin)
        self.glyphes = self.f.getGlyphSet()
        self.cmap = self.f.getBestCmap()
        self.upem = self.f["head"].unitsPerEm
        self.kern = self._kerning()

    def _kerning(self):
        """Le crenage de la table GPOS, quand elle en a un simple."""
        paires = {}
        try:
            gpos = self.f["GPOS"].table
        except KeyError:
            return paires
        for lookup in getattr(gpos.LookupList, "Lookup", []):
            if lookup.LookupType != 2:
                continue
            for st in lookup.SubTable:
                if getattr(st, "Format", None) != 1 or not getattr(st, "PairSet", None):
                    continue
                prem = st.Coverage.glyphs
                for g1, ps in zip(prem, st.PairSet):
                    for rec in ps.PairValueRecord:
                        v = getattr(rec.Value1, "XAdvance", 0)
                        if v:
                            paires[(g1, rec.SecondGlyph)] = v
        return paires

    def mesure(self, txt, taille, interlettre=0.0):
        e = taille / self.upem
        larg, prec = 0.0, None
        for ch in txt:
            g = self.cmap.get(ord(ch))
            if g is None:
                larg += taille * 0.3
                prec = None
                continue
            if prec is not None:
                larg += self.kern.get((prec, g), 0) * e
            larg += self.glyphes[g].width * e + taille * interlettre
            prec = g
        return larg

    def chemin(self, txt, x, y, taille, interlettre=0.0):
        """Un seul <path> pour toute la chaine — moins de noeuds, meme resultat."""
        e = taille / self.upem
        d, cur, prec = [], float(x), None
        for ch in txt:
            g = self.cmap.get(ord(ch))
            if g is None:
                cur += taille * 0.3
                prec = None
                continue
            if prec is not None:
                cur += self.kern.get((prec, g), 0) * e
            pen = SVGPathPen(self.glyphes)
            self.glyphes[g].draw(pen)
            trace = pen.getCommands()
            if trace:
                # y inverse : les polices montent, le SVG descend
                d.append(f'<g transform="translate({cur:.2f} {y:.2f}) scale({e:.6f} {-e:.6f})">'
                         f'<path d="{trace}"/></g>')
            cur += self.glyphes[g].width * e + taille * interlettre
            prec = g
        return "".join(d)


DISPLAY = Police("scripts/og-src/chakra-700.ttf")
MONO = Police("scripts/og-src/mono.ttf")


ETOILE = ("M 0 -0.5 L 0.1123 -0.1545 L 0.4755 -0.1545 L 0.1816 0.059 "
          "L 0.2939 0.4045 L 0 0.191 L -0.2939 0.4045 L -0.1816 0.059 "
          "L -0.4755 -0.1545 L -0.1123 -0.1545 Z")


def ligne_titre(txt, x, y, taille, couleur, police=DISPLAY, inter=0.0):
    """Le sous-ensemble latin des polices du site ne contient pas U+2605 : la
    note Google s'ecrivait « 4,3  sur Google », avec un trou au milieu — juste
    a l'endroit ou l'etoile est l'argument. On la dessine."""
    if "★" in txt:
        av, _, ap = txt.partition("★")
        d = police.chemin(av, x, y, taille, inter)
        xe = x + police.mesure(av, taille, inter) + taille * 0.34
        d += (f'<g transform="translate({xe:.2f} {y - taille * 0.33:.2f}) '
              f'scale({taille * 0.90:.3f})"><path d="{ETOILE}"/></g>')
        d += police.chemin(ap, xe + taille * 0.62, y, taille, inter)
        return f'<g fill="{couleur}">{d}</g>'
    return f'<g fill="{couleur}">{police.chemin(txt, x, y, taille, inter)}</g>'


def couper(txt, police, taille, largeur, inter=0.0):
    """Coupe en lignes qui tiennent dans `largeur`."""
    mots, lignes, cur = txt.split(), [], ""
    for m in mots:
        essai = (cur + " " + m).strip()
        if police.mesure(essai, taille, inter) <= largeur or not cur:
            cur = essai
        else:
            lignes.append(cur)
            cur = m
    if cur:
        lignes.append(cur)
    return lignes


# ------------------------------------------------------------------ les cartes
# (fichier, photo source, sur-titre, titre, les trois faits qui vendent)
CARTES = [
    ("accueil", "photos/plateau-ring-tatami-et-octogone-boxing-center-ramonville.webp",
     "RAMONVILLE-SAINT-AGNE · TERMINUS MÉTRO B",
     "L’octogone à ciel ouvert.",
     ["Dès 29 €/mois", "4,3★ sur Google", "300 m² couverts"]),

    ("premiere-seance", "photos/boxe-anglaise-en-binome-boxing-center-ramonville.webp",
     "TA PREMIÈRE FOIS",
     "Personne ne te frappera le premier soir.",
     ["Gants prêtés", "Aucun niveau requis", "Dès 3 ans"]),

    # Le titre annonce les 300 m2 couverts : l ancienne photo montrait l etage
    # de muscu, vide. On montre l espace couvert EN USAGE — tatami rouge et vert
    # sous la charpente, c est exactement ce dont la phrase parle.
    ("la-salle", "photos/sparring-pieds-poings-sur-tatami-boxing-center-ramonville.webp",
     "LE PLATEAU",
     "300 m² dehors, couverts et chauffés.",
     ["Octogone de 7 m", "Grand ring", "Muscu & cardio"]),

    ("activites", "photos/kick-boxing-coup-de-pied-haut-boxing-center-ramonville.webp",
     "HUIT DISCIPLINES",
     "Anglaise, pieds-poings, grappling, MMA.",
     ["22 cours/semaine", "Débutants acceptés", "6 jours sur 7"]),

    ("coachs", "photos/cours-de-mma-groupe-debout-boxing-center-ramonville.webp",
     "L’ÉQUIPE 2026/2027",
     "Cinq coachs, cinq territoires.",
     ["Jérôme, head coach", "BPJEPS & STAPS", "Un vrai visage"]),

    ("plannings", "photos/octogone-cours-vu-d-en-haut-boxing-center-ramonville.webp",
     "PLANNING DE LA RENTRÉE",
     "22 cours par semaine, six jours sur sept.",
     ["Midi & soir", "Lun. – sam.", "10h – 21h30"]),

    ("tarifs", "photos/boxing-camp-circuit-de-renforcement-boxing-center-ramonville.webp",
     "LES TARIFS",
     "Ta place de rentrée à 29 €.",
     ["29 €/mois", "Sans engagement", "Essai à 10 €"]),

    ("contact", "photos/octogone-7-metres-vide-boxing-center-ramonville.webp",
     "VENIR À LA SALLE",
     "33 rue des Ormes, Ramonville.",
     # « Parking gratuit » etait INVENTE — la base du reseau interdit
     # explicitement d'affirmer qu'une salle a un parking. Et le numero
     # etait celui de PORTET : celui de Ramonville est le 05 62 24 46 82.
     ["Terminus métro B", "Lun. – sam. 10h–21h30", "05 62 24 46 82"]),

    ("galerie", "photos/octogone-vu-du-grillage-boxing-center-ramonville.webp",
     "LE CARNET",
     "24 clichés, une seule salle.",
     ["Aucune banque d’images", "Photographe cité", "Tout est d’ici"]),
]


def carte(photo, sur, titre, faits):
    lignes = couper(titre, DISPLAY, 76, L - 200)
    if len(lignes) > 2:                       # trois lignes = trop : on retrecit
        taille = 62
        lignes = couper(titre, DISPLAY, taille, L - 200)
    else:
        taille = 76

    y0 = H - 150 - (len(lignes) - 1) * (taille + 8)
    corps = []
    for i, ln in enumerate(lignes):
        corps.append(ligne_titre(ln, 72, y0 + i * (taille + 8), taille, ENCRE))

    # le sur-titre, en mono, precede du losange de la marque
    corps.insert(0, f'<rect x="72" y="{y0 - 96}" width="11" height="11" fill="{ARGENT}" transform="rotate(45 77.5 {y0 - 90.5})"/>')
    corps.insert(1, ligne_titre(sur, 98, y0 - 84, 21, ARGENT, MONO, 0.09))

    # la ligne de faits : c'est elle qui vend
    x = 72
    yf = H - 62
    for i, f in enumerate(faits):
        w = MONO.mesure(f.replace('★', ''), 23, 0.02) + (23 * 0.96 if '★' in f else 0)
        corps.append(f'<rect x="{x - 14}" y="{yf - 26}" width="{w + 28:.0f}" height="40" rx="3" '
                     f'fill="none" stroke="{ARGENT}" stroke-opacity=".45"/>')
        corps.append(ligne_titre(f, x, yf, 23, ENCRE, MONO, 0.02))
        x += w + 44

    # La signature, en haut a droite. Elle tombait sur le ring et les neons :
    # illisible. Une plaque navy la porte — la meme que celle des pastilles.
    wc = MONO.mesure(CLUB, 19, 0.14)
    corps.append(f'<rect x="{L - 96 - wc:.0f}" y="52" width="{wc + 48:.0f}" height="38" rx="3" '
                 f'fill="{NAVY}" fill-opacity=".62"/>')
    corps.append(ligne_titre(CLUB, L - 72 - wc, 77, 19, ARGENT, MONO, 0.14))

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{L}" height="{H}" viewBox="0 0 {L} {H}">
  <defs>
    <linearGradient id="voile" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="{NAVY}" stop-opacity="1"/>
      <stop offset=".42" stop-color="{NAVY}" stop-opacity=".92"/>
      <stop offset=".78" stop-color="{NAVY}" stop-opacity=".34"/>
      <stop offset="1" stop-color="{NAVY}" stop-opacity=".12"/>
    </linearGradient>
    <linearGradient id="pied" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{NAVY}" stop-opacity="0"/>
      <stop offset="1" stop-color="{NAVY}" stop-opacity=".96"/>
    </linearGradient>
  </defs>
  <rect width="{L}" height="{H}" fill="url(#voile)"/>
  <rect y="{H - 260}" width="{L}" height="260" fill="url(#pied)"/>
  <rect y="{H - 6}" width="{L}" height="6" fill="{ARGENT}"/>
  {"".join(corps)}
</svg>'''


# ------------------------------------------------------------------ production
NODE = r"""
const sharp = require("sharp");
const fs = require("fs");
const [photo, svg, sortie] = process.argv.slice(2);
(async () => {
  /* Le plateau, le ring et les drapeaux sont dans la moitie BASSE des photos ;
     la moitie haute est de la charpente. `attention` choisissait le toit (plus
     de contraste) et la carte vendait une tole. On prend une bande centree a
     58 % : sous le milieu, la ou l action se passe. */
  const src = sharp(photo);
  const meta = await src.metadata();
  const hVoulue = Math.round(meta.width / (1200 / 630));
  const top = Math.max(0, Math.min(meta.height - hVoulue, Math.round((meta.height - hVoulue) * 0.58)));
  const fond = await sharp(photo)
    .extract({ left: 0, top, width: meta.width, height: Math.min(hVoulue, meta.height) })
    .resize(1200, 630, { fit: "cover" })
    .modulate({ brightness: 1.04, saturation: 1.02 })
    .linear(1.03, -3)
    .toBuffer();
  await sharp(fond)
    .composite([{ input: fs.readFileSync(svg), top: 0, left: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(sortie);
  const m = await sharp(sortie).metadata();
  const st = await sharp(sortie).stats();
  const c = st.channels.slice(0, 3).map((x) => Math.round(x.mean));
  console.log(`${m.width}x${m.height} ${Math.round(fs.statSync(sortie).size / 1024)}ko RGB:${c.join("/")} ecart:${Math.abs(c[0] - c[2])}`);
})();
"""
with io.open("scripts/og-src/_composer.cjs", "w", encoding="utf-8") as f:
    f.write(NODE)

print("  CARTE                 TAILLE       POIDS   COULEUR (ecart R-B > 3 = pas du gris)")
for nom, photo, sur, titre, faits in CARTES:
    svg = carte(photo, sur, titre, faits)
    tmp = "scripts/og-src/_%s.svg" % nom
    with io.open(tmp, "w", encoding="utf-8") as f:
        f.write(svg)
    src = "public/assets/img/ram/" + photo
    if not os.path.exists(src):
        print("  %-20s PHOTO INTROUVABLE : %s" % (nom, photo))
        continue
    out = "%s/%s.jpg" % (SORTIE, nom)
    r = subprocess.run(["node", "scripts/og-src/_composer.cjs", src, tmp, out],
                       capture_output=True, text=True)
    print("  %-20s %s" % (nom, (r.stdout or r.stderr).strip()[:70]))
    os.remove(tmp)
