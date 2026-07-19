# =====================================================================
# RAMONVILLE · scripts/fonts.py — alleger les polices SANS perdre un glyphe
#
# POURQUOI. Mesure sur le rendu, huit pages, brotli comme en production :
# les polices etaient le poste le PLUS LOURD et le plus CONSTANT du site —
# 65 a 75 ko sur chaque page, avant la moindre photo. Trois d'entre elles
# sont prechargees : elles partent donc en premier, en concurrence directe
# avec le premier ecran.
#
# CE QU'ON NE FAIT PAS. On ne touche pas au cmap. Pas un seul caractere
# n'est retire — pas de sous-ensemble « caracteres vus sur le site », qui
# aurait casse le premier prenom accentue tape dans le chatbot ou affiche
# dans le vestiaire. Le script VERIFIE et refuse d'ecrire si un codepoint
# manque a l'arrivee.
#
# LES DEUX LEVIERS, tous deux sans effet visible :
#
#   1) L'AXE VARIABLE, ramene a ce que le CSS declare vraiment.
#      JetBrains Mono porte un axe wght 400-800 ; fonts.css n'en declare
#      que 400 et 600, et les 41 usages de var(--f-mono) du site sont
#      TOUS en 600 (verifie). On garde 400-600. Manrope porte 200-800,
#      le site declare 400 a 800 : on garde 400-800.
#
#   2) LES FONCTIONNALITES OPENTYPE que personne n'appelle, avec les
#      glyphes alternes qu'elles trainent. Le gros morceau est `calt` de
#      JetBrains Mono : ce sont ses ligatures de programmation (`=>`,
#      `!=`, `->`…). 394 glyphes pour 229 caracteres — 165 glyphes de
#      code source dans une police qui n'ecrit ici que des intitules.
#      On garde ccmp/mark/locl (composition des accents) partout, kern et
#      liga sur Manrope et Chakra Petch, qui portent du texte courant.
#      `font-variant-numeric: tabular-nums` est utilise cinq fois dans le
#      CSS, toujours sur var(--f-display) : Chakra Petch n'expose pas tnum
#      (verifie) — ces cinq regles retombaient deja sur les chiffres par
#      defaut. Rien ne change.
#
# RESULTAT MESURE : 86,1 ko -> 60,3 ko sur le disque, dont -17,1 ko sur le
# seul JetBrains Mono, qui part sur les huit pages. Zero caractere perdu.
#
# Usage : python scripts/fonts.py
#   entree  scripts/fonts-src/*.woff2  (les fichiers Google Fonts d'origine,
#           hors public/ : ils ne sont pas deployes)
#   sortie  public/fonts/*.woff2
# Idempotent : relancer sur une sortie deja allegee redonne le meme fichier.
# =====================================================================
import io
import os
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.subset import Subsetter, Options

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RACINE, "scripts", "fonts-src")
DST = os.path.join(RACINE, "public", "fonts")

PLAN = {
    # (axes conserves, fonctionnalites OpenType conservees)
    "jetbrainsmono-var-latin.woff2": ({"wght": (400, 600)}, ["ccmp", "mark", "locl"]),
    "manrope-var-latin.woff2":       ({"wght": (400, 800)}, ["ccmp", "mark", "locl", "kern", "liga"]),
    "chakrapetch-500-latin.woff2":   (None, ["ccmp", "mark", "mkmk", "locl", "kern", "liga"]),
    "chakrapetch-600-latin.woff2":   (None, ["ccmp", "mark", "mkmk", "locl", "kern", "liga"]),
    "chakrapetch-700-latin.woff2":   (None, ["ccmp", "mark", "mkmk", "locl", "kern", "liga"]),
}


def cmap_de(police):
    couvert = set()
    for table in police["cmap"].tables:
        couvert |= set(table.cmap.keys())
    return couvert


def alleger(nom, axes, features):
    entree = os.path.join(SRC, nom)
    sortie = os.path.join(DST, nom)
    avant = os.path.getsize(entree)
    police = TTFont(entree)
    attendu = cmap_de(police)

    if axes and "fvar" in police:
        police = instancer.instantiateVariableFont(police, axes, updateFontNames=False)
        # L'instanciation partielle laisse `gvar` en lecture paresseuse, que le
        # subsetter ne sait pas relire (KeyError 'space'). Aller-retour memoire.
        tampon = io.BytesIO()
        police.flavor = None
        police.save(tampon)
        tampon.seek(0)
        police = TTFont(tampon)

    opts = Options()
    opts.layout_features = features
    opts.hinting = True
    opts.legacy_kern = False
    opts.desubroutinize = False
    opts.name_IDs = [1, 2, 3, 4, 6]
    opts.name_legacy = False
    opts.notdef_outline = False
    opts.drop_tables += ["DSIG"]
    reducteur = Subsetter(options=opts)
    reducteur.populate(unicodes=attendu)      # <- cmap a l'identique
    reducteur.subset(police)

    obtenu = cmap_de(police)
    perdus = attendu - obtenu
    if perdus:
        # FILET : on n'ecrit rien plutot que d'expedier une police trouee.
        raise SystemExit(
            f"ARRET — {nom} perdrait {len(perdus)} caracteres : "
            + " ".join(f"U+{c:04X}" for c in sorted(perdus)[:20])
        )

    police.flavor = "woff2"
    police.save(sortie)
    apres = os.path.getsize(sortie)
    return avant, apres, len(attendu)


def main():
    if not os.path.isdir(SRC):
        raise SystemExit(f"ARRET — sources introuvables : {SRC}")
    os.makedirs(DST, exist_ok=True)
    total_av = total_ap = 0
    for nom, (axes, features) in PLAN.items():
        if not os.path.exists(os.path.join(SRC, nom)):
            print(f"  (absent, ignore) {nom}")
            continue
        av, ap, n = alleger(nom, axes, features)
        total_av += av
        total_ap += ap
        print(f"{nom:34s} {av/1024:6.1f} -> {ap/1024:6.1f} ko  "
              f"(-{100*(av-ap)/av:4.1f} %)  {n} caracteres conserves, 0 perdu")
    print(f"{'TOTAL':34s} {total_av/1024:6.1f} -> {total_ap/1024:6.1f} ko  "
          f"({(total_av-total_ap)/1024:.1f} ko de moins)")


if __name__ == "__main__":
    main()
