import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ramonville.boxingcenter.fr',
  trailingSlash: 'always',
  compressHTML: false,
  build: { format: 'directory' },
  devToolbar: { enabled: false }
});
