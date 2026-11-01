// Builds dist/fixing-good.html: the whole game in one file that runs straight from disk.
// Usage: node build.mjs
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
const root = new URL('./', import.meta.url);
let html = readFileSync(new URL('index.html', root), 'utf8').replace(/\r\n/g, '\n');
const block = html.match(/<!--GAME-SCRIPTS-->[\s\S]*?<!--\/GAME-SCRIPTS-->/);
if (!block) throw new Error('index.html is missing the GAME-SCRIPTS block');
const files = [...block[0].matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
let js = '';
for (const f of files) js += `\n/* ===== ${f} ===== */\n` + readFileSync(new URL(f, root), 'utf8');
html = html.replace(block[0], () => '<script>\n' + js.replace(/<\/script/gi, '<\\/script') + '\n</script>');
mkdirSync(new URL('dist/', root), {recursive: true});
writeFileSync(new URL('dist/fixing-good.html', root), html);
console.log(`dist/fixing-good.html  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB  (${files.length} scripts)`);
