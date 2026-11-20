// Builds dist/fixing-good.html (the full game) and dist/fixing-good-demo.html (the demo):
// each is the whole game in one file that runs straight from disk.
// Usage: node build.mjs
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
const root = new URL('./', import.meta.url);
const src = readFileSync(new URL('index.html', root), 'utf8').replace(/\r\n/g, '\n');
const block = src.match(/<!--GAME-SCRIPTS-->[\s\S]*?<!--\/GAME-SCRIPTS-->/);
if (!block) throw new Error('index.html is missing the GAME-SCRIPTS block');
const files = [...block[0].matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
let js = '';
for (const f of files) js += `\n/* ===== ${f} ===== */\n` + readFileSync(new URL(f, root), 'utf8');
mkdirSync(new URL('dist/', root), {recursive: true});
for (const [out, demo] of [['fixing-good.html', false], ['fixing-good-demo.html', true]]) {
  let html = src.replace(block[0], () => (demo ? '<script>window.FG_DEMO = true;</script>\n' : '') + '<script>\n' + js.replace(/<\/script/gi, '<\\/script') + '\n</script>');
  if (demo) html = html.replace('<title>Fixing Good</title>', '<title>Fixing Good (Demo)</title>');
  writeFileSync(new URL('dist/' + out, root), html);
  console.log(`dist/${out}  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB  (${files.length} scripts${demo ? ', demo' : ''})`);
}
