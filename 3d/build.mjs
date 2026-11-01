// Bundles the 3D game (three.js + sources) into dist/fixing-good-3d.html, one file that runs from disk.
// Usage: node build.mjs [--dev]   (--dev skips minification)
import {build} from 'esbuild';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
const root = new URL('./', import.meta.url), dev = process.argv.includes('--dev'), t0 = Date.now();
const out = await build({entryPoints: [new URL('src/main.js', root).pathname], bundle: true, minify: !dev, format: 'iife', write: false, target: 'es2020', legalComments: 'none'});
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = readFileSync(new URL('index.html', root), 'utf8').replace('<!--BUNDLE-->', () => '<script>' + js + '</script>');
mkdirSync(new URL('dist/', root), {recursive: true});
writeFileSync(new URL('dist/fixing-good-3d.html', root), html);
console.log(`dist/fixing-good-3d.html  ${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB  (${Date.now() - t0} ms)`);
