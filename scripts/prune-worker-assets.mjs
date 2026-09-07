// Portable equivalent of the release cleanup: remove only byte-identical
// server copies of assets already present in the browser bundle.
import {readdir,readFile,realpath,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const project=await realpath(fileURLToPath(new URL('..',import.meta.url)));
const dist=await realpath(path.resolve(process.argv[2]??path.join(project,'dist')));
if(dist!==path.join(project,'dist'))throw new Error('Refusing cleanup outside this project dist');
const server=await realpath(path.join(dist,'server'));
const client=await realpath(path.join(dist,'client','assets'));
for(const dir of [server,client])if(!dir.startsWith(dist+path.sep))throw new Error('Asset directory escapes build');
const candidates=[];
async function visit(dir){
  for(const e of await readdir(dir,{withFileTypes:true})){
    if(e.isSymbolicLink())throw new Error('Unexpected symlink in server build');
    const p=path.join(dir,e.name);
    if(e.isDirectory())await visit(p);
    else if(e.isFile()&&/\.(webp|pdf|geojson|zip|html|txt|csv)$/i.test(e.name))candidates.push(p);
  }
}
await visit(server);
let bytes=0;
// Validate the complete plan before removing any generated copies.
for(const p of candidates){
  const target=await realpath(p);
  if(!target.startsWith(server+path.sep))throw new Error('Server asset escapes build');
  const copy=await realpath(path.join(client,path.basename(p)));
  if(!copy.startsWith(client+path.sep))throw new Error('Browser asset escapes build');
  const a=await readFile(target),b=await readFile(copy);
  if(!a.equals(b))throw new Error(`Browser copy differs: ${path.basename(p)}`);
  bytes+=a.length;
}
for(const p of candidates)await unlink(p);
console.log(`Pruned ${candidates.length} redundant Worker asset copies (${bytes} bytes); browser assets remain in ${client}.`);
