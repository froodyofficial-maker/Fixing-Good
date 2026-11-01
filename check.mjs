// Syntax-checks every game script, and the scripts joined in load order (they share one global scope).
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const files=[...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m=>m[1]);
let ok=true,all='';
for(const f of files){const src=readFileSync(new URL('./'+f,import.meta.url),'utf8');all+='\n;'+src;try{new vm.Script(src,{filename:f})}catch(e){ok=false;console.error(f+': '+e.message)}}
try{new vm.Script(all,{filename:'combined.js'})}catch(e){ok=false;console.error('combined: '+e.message)}
console.log(ok?`ok: ${files.length} files`:'syntax errors found');process.exit(ok?0:1);
