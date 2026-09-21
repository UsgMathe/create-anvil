import { readFileSync, rmSync, writeFileSync } from 'node:fs';

const { render } = await import('../dist-ssr/entry-server.js');

const PLACEHOLDER = '<div id="root"></div>';
const indexPath = 'dist/index.html';
const html = readFileSync(indexPath, 'utf8');

if (!html.includes(PLACEHOLDER)) {
  throw new Error(`Não encontrei ${PLACEHOLDER} em ${indexPath}.`);
}

const app = render();
writeFileSync(indexPath, html.replace(PLACEHOLDER, `<div id="root">${app}</div>`));
rmSync('dist-ssr', { recursive: true, force: true });

console.log(`prerender: ${String(app.length)} caracteres de HTML injetados`);
