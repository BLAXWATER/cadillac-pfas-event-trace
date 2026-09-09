import fs from 'node:fs';
import crypto from 'node:crypto';
const source = 'C:/Users/casey/OneDrive/Desktop/WEX SPLIT/03_EGLE_Hearing/03_EGLE_Hearing/';
const items = [
 ['61366 Hearing - Transcript.PDF',69,'hearing-transcript-review/page-26.png','March 21, 2018 transcript: Dietlin states Cadillac received payment for leachate treatment (PDF p26), recalling earlier 70,000–80,000 gallons/day during seven-day deliveries (p27), without specifying that period. Peccia reports approximately 14 million gallons in 2016 (p22). Testimony is not a receiving log or PFAS-removal measurement.'],
 ['61366 Hearing - Written Comments.PDF',19,'hearing-written-comments-review/page-10.png','February–April 2018 written comments question sampling, financial assurance and historical water impacts; a signed supporting letter is also preserved (p19). The mayoral letter on pp14 and16 is duplicated. Comments are attributed statements, not agency findings or new laboratory results.'],
 ['61366 Hearing 2018-03-21.PDF',23,'hearing-march21-review/page-7.png','DEQ hearing materials describe moving the proposed well to avoid existing contamination and extra casing to prevent carry-down during drilling (p7). Includes a general aquifer schematic, proposed containment/monitoring, informal notes and EPA-transmitted sign-in sheets. Proposed safeguards are not proof of subsequent compliance.'],
 ['61366 Hearing - OGMD Response.PDF',6,'ogmd-response-review/page-2.png','Substantive OGMD response describes updated waste analyses, relocation to avoid carrying shallow contamination downward, containment and monitoring expectations, and a $33,000 plugging/restoration bond. Recommends issuance; not proof injection began. Its March19 hearing date conflicts with the March21 transcript.'],
];
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read('app/wexford-documents.json');
const previews=read('app/first-page-preview-manifest.json');
const added=[];
for(const [name,pages,preview,description] of items){
 const data=fs.readFileSync(source+name), sha256=crypto.createHash('sha256').update(data).digest('hex');
 const existing=catalog.find(d=>d.sha256===sha256);
 if(existing){added.push(existing);continue;}
 const id=`${112+added.length}-${sha256.slice(0,12)}`,url=`/wexford-docs/${id}.pdf`;
 fs.copyFileSync(source+name,`public${url}`);
 const row={id,name,url,year:'2018',category:'Wexford landfill & leachate',type:'Public hearing and permit review',format:'PDF',pages,size:data.length,sha256,description};
 catalog.push(row);added.push(row);
 previews[url]=`/optimized-source-previews/hearing-${id}.webp`;
}
fs.writeFileSync('app/wexford-documents.json',JSON.stringify(catalog,null,2)+'\n');
fs.writeFileSync('app/first-page-preview-manifest.json',JSON.stringify(previews,null,2)+'\n');
const audit=read('app/wexford-audit.json');
audit.stats.finalDistinctRecords=catalog.length;
audit.stats.publishedPages=catalog.reduce((s,d)=>s+d.pages,0);
audit.stats.publishedBytes=catalog.reduce((s,d)=>s+d.size,0);
audit.methods.unshift('September 9, 2026: four hearing originals (117 pages) reviewed. Transcript read fully with key-page visual checks; written comments and hearing packet visually read in full, with uncertain handwriting excluded from claims. OGMD response fully read with key-page visual checks. Earlier OCR statistics remain historical.');
fs.writeFileSync('app/wexford-audit.json',JSON.stringify(audit,null,2)+'\n');
fs.writeFileSync('app/hearing-sept09-records.json',JSON.stringify(added,null,2)+'\n');
console.log(added.map(d=>({name:d.name,url:d.url,pages:d.pages})));
