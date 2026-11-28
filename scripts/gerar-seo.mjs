// Roda depois do `vite build` (veja o script "build" no package.json).
// Gera dist/robots.txt e dist/sitemap.xml com o endereço do site definido em .env
// (VITE_SITE_URL). Sem o endereço, gera só o robots.txt e avisa.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';

const raiz = resolve(import.meta.dirname, '..');
const dist = resolve(raiz, 'dist');
const site = (loadEnv('production', raiz).VITE_SITE_URL ?? '').replace(/\/+$/, '');

const robots = [
  'User-agent: *',
  'Allow: /',
  // Painel administrativo: não deve aparecer no Google.
  'Disallow: /admin/',
  ...(site ? ['', `Sitemap: ${site}/sitemap.xml`] : []),
  '',
].join('\n');
writeFileSync(resolve(dist, 'robots.txt'), robots);

if (site) {
  const hoje = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}/</loc>
    <lastmod>${hoje}</lastmod>
  </url>
</urlset>
`;
  writeFileSync(resolve(dist, 'sitemap.xml'), sitemap);
  console.log(`SEO: robots.txt e sitemap.xml gerados para ${site}`);
} else {
  console.warn(
    '\n⚠ SEO: VITE_SITE_URL está vazio no .env. Gerei só o robots.txt.\n' +
      '  Sem o endereço do site, a prévia de link no WhatsApp fica sem foto e não há sitemap.\n'
  );
}
