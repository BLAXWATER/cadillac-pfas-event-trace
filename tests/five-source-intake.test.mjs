import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=async p=>JSON.parse(await fs.readFile(new URL('../'+p,import.meta.url),'utf8'));
test('five-source intake preserves every supplied original and separates review from strict verification',async()=>{
 const audit=await read('app/five-source-intake-audit-2026-09-14.json');
 assert.equal(audit.records.length,5);assert.equal(audit.records.reduce((n,r)=>n+r.pageCount,0),150);
 assert.deepEqual([...new Set(audit.records.map(r=>r.batch))],['B1','B2','B3']);
 for(const r of audit.records){
  const bytes=await fs.readFile(new URL('../public'+r.canonicalUrl,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);
  assert.equal(bytes.length,r.bytes);assert.equal(r.pages.length,r.pageCount);
  assert.ok(r.pages.every(p=>p.pageOrderReview&&p.renderedPageInspected&&p.ocrApplied));
 }
 assert.equal(audit.records.find(r=>r.key==='supplemental-ri').status.strictFullyVerified,false);
 assert.equal(audit.records.find(r=>r.key==='action-memo').status.strictFullyVerified,false);
 assert.equal(audit.stats.newEvidenceRequestsClosed,0);
});
test('four new catalog entries and existing July2006 fact sheet remain distinct and source-qualified',async()=>{
 const supp=await read('app/supplemental-documents.json'),wex=await read('app/wexford-documents.json');
 for(const prefix of ['199-','200-','201-','202-'])assert.equal(supp.filter(r=>r.id.startsWith(prefix)).length,1);
 const fact=wex.find(r=>r.id==='027-b6b5e1c0bddb');assert.match(fact.name,/July 2006/);assert.match(fact.description,/not leachate deliveries/);
 const sri=supp.find(r=>r.id.startsWith('201-'));assert.match(sri.description,/unidentified/);assert.match(sri.description,/not PFAS results/);
 const index=supp.find(r=>r.id.startsWith('202-'));assert.match(index.description,/not attachments/);
 const aliases=await read('app/verified-filename-aliases.json');assert.ok(aliases[fact.id].aliases.includes('06-20-2006 - 421579.pdf'));
});
