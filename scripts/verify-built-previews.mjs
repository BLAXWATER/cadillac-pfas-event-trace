import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadDownloadDeliveryPlan} from './document-download-integrity.mjs';
const base='dist/client/assets/';
const files=await readdir(base);const hashes=new Map();
for(const file of files){const b=await readFile(base+file);hashes.set(createHash('sha256').update(b).digest('hex'),file);
 if(file.endsWith('.js'))for(const m of b.toString().matchAll(/data:[^"'\s]*?;base64,([A-Za-z0-9+/=]+)/g))hashes.set(createHash('sha256').update(Buffer.from(m[1],'base64')).digest('hex'),file);
}
const deliveries=(await loadDownloadDeliveryPlan()).filter(d=>d.kind==='bundled');
for(const d of deliveries){if(!hashes.has(d.row.sha256))throw Error('Missing built original '+d.row.name);}
const pdf=JSON.parse(await readFile('app/first-page-preview-manifest.json'));
const other=JSON.parse(await readFile('app/nonpdf-preview-manifest.json'));
let count=0;
for(const p of new Set([...Object.values(pdf),...Object.values(other).map(v=>v.preview)])){
 const b=await readFile('public'+p);const h=createHash('sha256').update(b).digest('hex');
 if(!hashes.has(h))throw Error('Missing built preview '+p);count++;
}
const study=await readFile('public/findings-docs/1988-cadillac-ri-234880.pdf');
if(!hashes.has(createHash('sha256').update(study).digest('hex')))throw Error('1988 original not bundled');
console.log(JSON.stringify({bundledDownloads:deliveries.length,builtPreviews:count,study1988:'passed'}));
