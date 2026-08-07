/* =====================================================================
   RAMONVILLE · scripts/cuire-galerie.mjs — les photos entrent dans le HTML

   LE PROBLÈME, MESURÉ. /galerie/ servait ceci au robot :

       <div class="gallery" id="gallery"></div>

   Une div vide. La page entière du site dont le SEUL objet est de montrer
   la salle contenait UNE balise <img> — celle de la visionneuse, vide elle
   aussi. Google Images n'indexe que ce qu'il lit dans le HTML : zéro photo
   déclarée, zéro photo indexée, sur les six clichés prouvés du plateau.
   Et les robots des assistants (GPTBot, ClaudeBot, PerplexityBot)
   n'exécutent pas le JavaScript : pour eux la galerie n'existait pas.

   CE QUE FAIT CE SCRIPT. Après le build, il écrit dans la div les MÊMES
   figures que renderGallery() peindra ensuite — même balisage, mêmes
   attributs, mêmes légendes. Le JS fait `box.innerHTML = …` : il réécrit
   par-dessus à l'identique, donc aucun doublon et aucun risque d'écart
   entre ce que voit le robot et ce que voit le visiteur.

   Effet de bord assumé et voulu : sans JavaScript, la galerie s'affiche.

   Usage : appelé par `npm run build`, après astro build, AVANT minify
   (le HTML cuit doit être minifié comme le reste) et avant sitemap.mjs
   (dont l'empreinte doit porter sur le HTML définitif).
   ===================================================================== */
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = join(ROOT, "dist", "galerie", "index.html");
const { GALLERY, PHOTO_CREDIT } = await import(
  pathToFileURL(join(ROOT, "public", "assets", "js", "data.js")).href
);

/* La loupe : recopiée telle quelle de page.js. Si elle diverge un jour, le
   JS la réécrira de toute façon — mais autant que le robot voie le vrai. */
const LOUPE =
  `<span class="shot__zoom" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="7"/><line x1="21" y1="21" x2="15.5" y2="15.5"/><line x1="10.5" y1="7.5" x2="10.5" y2="13.5"/><line x1="7.5" y1="10.5" x2="13.5" y2="10.5"/></svg></span>`;

const figures = GALLERY.map((g) => `
    <figure class="shot" role="button" tabindex="0" aria-label="Agrandir — ${g.zone} · ${g.place}">
      <img src="${g.img}" ${g.plein ? `data-plein="${g.plein}" ` : ""}alt="${g.alt}" width="${g.w}" height="${g.h}" loading="lazy" decoding="async" />
      ${LOUPE}
      <figcaption class="shot__cap"><b data-cap="${g.zone}">${g.zone}</b> · ${g.place}${g.credit ? `<em class="shot__credit">Photo ${PHOTO_CREDIT}</em>` : ""}</figcaption>
    </figure>`).join("");

const html = await readFile(PAGE, "utf8");
const creux = /(<div class="gallery" id="gallery"[^>]*>)\s*(<\/div>)/;
if (!creux.test(html)) {
  console.error("[galerie] la div #gallery n'est plus vide ou a changé de forme — rien de cuit");
  process.exit(1);
}
await writeFile(PAGE, html.replace(creux, `$1${figures}\n  $2`));
console.log(`[galerie] ${GALLERY.length} photos cuites dans /galerie/ (lisibles sans JavaScript)`);
