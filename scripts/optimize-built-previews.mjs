import {readdir,readFile,rename,stat,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const project=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const assets=path.resolve(process.argv[2]??path.join(project,'dist','client','assets'));
if(!assets.startsWith(project+path.sep))throw new Error('Refusing preview optimization outside this project');

const files=(await readdir(assets)).filter(name=>name.toLowerCase().endsWith('.webp'));
let before=0,after=0,optimized=0;
for(const name of files){
  const source=path.join(assets,name);
  const sourceStat=await stat(source);
  before+=sourceStat.size;
  const input=await readFile(source);
  // Catalog cards render previews well below this width. Capping oversized
  // generated previews keeps the deployable archive bounded without touching
  // any downloadable evidence document.
  const output=await sharp(input,{failOn:'warning'})
    .resize({width:360,withoutEnlargement:true})
    .webp({quality:78,effort:6,smartSubsample:true})
    .toBuffer();
  if(output.length<input.length){
    const temp=`${source}.optimized`;
    await writeFile(temp,output);
    await rename(temp,source);
    after+=output.length;
    optimized++;
  }else{
    after+=input.length;
  }
}
console.log(`Optimized ${optimized}/${files.length} built WebP previews; saved ${before-after} bytes.`);
