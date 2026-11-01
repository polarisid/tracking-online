/**
 * Pós-build: troca o marcador __SITE_URL__ do index.html (og:image, og:url,
 * canonical, JSON-LD) e do sitemap/robots pela origem real do site — redes
 * sociais exigem URL absoluta. Sobrescreva com a variável SITE_URL se preciso.
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_SITE_URL = 'https://tracking.dacari.com.br';
const origin = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');

for (const name of ['index.html', 'robots.txt', 'sitemap.xml']) {
  const file = path.join(__dirname, '..', 'build', name);
  if (!fs.existsSync(file)) continue;
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('__SITE_URL__').join(origin));
}
console.log(`[inject-site-url] origem: ${origin}`);
