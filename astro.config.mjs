import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mmatoulouse.com',
  trailingSlash: 'always',
  /* Les pages sont écrites avec leurs commentaires de chantier (pourquoi telle
     ligne a changé, ce qu'elle disait avant). C'est la mémoire du projet : ça
     reste dans src/. Le visiteur, lui, ne reçoit que le balisage. Vérifié :
     aucun <pre>, aucun <textarea>, aucun `white-space: pre` sur le site — rien
     dont l'espacement soit signifiant à l'écran. */
  compressHTML: true,
  build: { format: 'directory' },
  devToolbar: { enabled: false }
});
