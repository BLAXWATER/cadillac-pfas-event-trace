import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadDownloadDeliveryPlan} from './document-download-integrity.mjs';
const base='dist/client/assets/';
const files=await readdir(base);const hashes=new Map();
for(const file of files){const b=await readFile(base+file);hashes.set(createHash('sha256').update(b).digest('hex'),file);
}
const deliveries=(await loadDownloadDeliveryPlan()).filter(d=>d.kind==='bundled');
for(const d of deliveries){if(!hashes.has(d.row.sha256))throw Error('Missing standalone built original (inline data URLs cannot be shared): '+d.row.name);}
const pdf=JSON.parse(await readFile('app/first-page-preview-manifest.json'));
const other=JSON.parse(await readFile('app/nonpdf-preview-manifest.json'));
const vite=JSON.parse(await readFile('dist/client/.vite/manifest.json'));
let count=0;
for(const p of new Set([...Object.values(pdf),...Object.values(other).map(v=>v.preview)])){
 const source=`public${p}`.replaceAll('\\','/');
 const emitted=vite[source]?.file?.split('/').at(-1);
 const built=emitted&&files.includes(emitted);
 if(!built)throw Error('Missing built preview '+p);count++;
}
const study=await readFile('public/findings-docs/1988-cadillac-ri-234880.pdf');
if(!hashes.has(createHash('sha256').update(study).digest('hex')))throw Error('1988 original not bundled');
console.log(JSON.stringify({bundledDownloads:deliveries.length,builtPreviews:count,study1988:'passed'}));
