/**
 * Pós-build: troca o marcador __SITE_URL__ do index.html pela origem real do
 * site (necessária para og:image / og:url / canonical — redes sociais exigem
 * URL absoluta). Ordem de busca: SITE_URL, domínio de produção da Vercel,
 * URL do deploy atual. Sem nenhuma, usa caminhos relativos.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'build', 'index.html');
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const origin = (process.env.SITE_URL || (host ? `https://${host}` : '')).replace(/\/+$/, '');

const html = fs.readFileSync(file, 'utf8').split('__SITE_URL__').join(origin);
fs.writeFileSync(file, html);
console.log(`[inject-site-url] origem: ${origin || '(relativa — defina SITE_URL para links absolutos)'}`);
