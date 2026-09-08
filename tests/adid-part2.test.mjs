import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {loadDocumentRecords,loadDownloadDeliveryPlan} from '../scripts/document-download-integrity.mjs';
const json=async n=>JSON.parse(await readFile(new URL('../app/'+n+'.json',import.meta.url),'utf8'));
const audit=await json('adid-part2-intake-audit');
const records=await loadDocumentRecords();
const byId=new Map(records.map(r=>[r.id,r]));
const finance=await json('leachate-finance-findings');
const queue=await json('evidence-request-queue-updates');
const source=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');

test('ADID Part2 reconciles 20 originals to two new records and 18 existing identities',async()=>{
 assert.deepEqual(audit.stats,{suppliedFiles:20,suppliedPages:2869,recordsBefore:1620,recordsAdded:2,existingIdentities:18,recordsAfter:1622});
 assert.equal(records.length,1623);
 assert.equal(audit.records.length,20);
 assert.equal(new Set(audit.records.map(r=>r.recordId)).size,20);
 assert.equal(audit.records.filter(r=>r.disposition==='new original').length,2);
 const aliases=await json('verified-filename-aliases');
 const previews=await json('first-page-preview-manifest');
 const plan=await loadDownloadDeliveryPlan(records);
 for(const row of audit.records){
  const r=byId.get(row.recordId);assert.equal(r.sha256,row.sha256);assert.equal(r.pages,row.pages);assert.equal(r.size,row.bytes);
  assert.equal(records.filter(r=>r.sha256===row.sha256).length,1);
  assert.equal(aliases[r.id].sha256,r.sha256);assert.ok(aliases[r.id].aliases.includes(row.filename));
  assert.doesNotMatch(row.filename,/[/\\]/);
  if(audit.newRecordIds.includes(r.id)){
   assert.equal(plan.find(p=>p.row.id===r.id).kind,'bundled');
   const bytes=await readFile(new URL('../public'+r.url,import.meta.url));
   assert.equal(bytes.length,r.size);assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);
   assert.ok((await readFile(new URL('../public'+previews[r.url],import.meta.url))).length>0);
  }
 }
});

test('work-session findings use the correct dates/pages without changing financial actuals',()=>{
 for(const [id,date,p] of [['195-ab25bfa3b3c4','2016-04-14',3],['196-fa41c0f607d9','2018-04-02',4]]){
  const matching=finance.events.filter(e=>e.sources.some(s=>s.recordId===id));assert.equal(matching.length,1);
  const e=matching[0];assert.equal(e.isoDate,date);assert.equal(e.sources[0].page,p);assert.equal(e.sources[0].sha256,byId.get(id).sha256);
  assert.match(e.timeBasis,/not a delivery time/);assert.match(e.finding,/above budget|above-budget/);
 }
 assert.match(byId.get('195-ab25bfa3b3c4').description,/Pages4–5 separately append April18/);
 assert.equal(finance.annualActuals.reduce((sum,r)=>sum+r.value,0),2996632);
 assert.equal(finance.annualActuals.find(r=>r.fiscalYear===2019).value,494691);
 const note=queue.blocks[0].held.find(n=>n.id==='revenue-and-record-leads');
 for(const id of audit.newRecordIds)assert.ok(note.sources.some(s=>s.recordId===id));
});

test('written cessation report is held, system signature is bounded, exact final-load request remains open',async()=>{
 const c=audit.cessationRecheck,r=byId.get(c.recordId);
 assert.equal(r.sha256,c.sha256);assert.equal(c.signatureFieldPresent,true);assert.equal(c.certificateTrustIndependentlyValidated,false);
 assert.equal(c.writtenReport,'held');assert.equal(c.finalLoadDetails,'unresolved');
 assert.match(r.description,/system digital signature/);assert.match(r.description,/not a personal digital signature by Dietlin/);
 assert.match(r.description,/certificate trust was not independently validated/);
 assert.match(r.description,/signing dates are not stated final-load dates/);
 assert.equal([...source.matchAll(/date: "2019-06-28"/g)].length,1);
 assert.match(source,/June28 is the submission date, not a stated final-truckload date/);
 const note=queue.blocks[0].held.find(n=>n.id==='reported-cessation');
 assert.match(note.finding,/Written cessation\/transition report: held/);
 assert.ok(note.sources.find(s=>s.recordId===c.recordId).pages.includes(3));
 const requirements=(await json('evidence-request-queue')).flatMap(b=>b.requirements);
 const final=requirements.find(r=>r.id==='final-leachate-delivery-record');
 assert.ok(!final.verifiedEvidence?.length);assert.match(final.label,/written cessation\/transition report is already held/);
 assert.equal(requirements.length,23);assert.equal(requirements.filter(r=>!r.verifiedEvidence?.length).length,22);
});

test('production page exposes both new events, updated report and narrowed outstanding request',async()=>{
 const {default:worker}=await import('../dist/server/index.js');
 const response=await worker.fetch(new Request('http://localhost/',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
 assert.equal(response.status,200);
 const html=(await response.text()).replaceAll('<!-- -->','').replaceAll('&amp;','&').replaceAll('&#x27;',"'").replaceAll('&quot;','"');
 assert.match(html,/Search all 1,623 records/);
 for(const id of audit.newRecordIds){const e=finance.events.find(e=>e.sources.some(s=>s.recordId===id));assert.ok(html.includes(e.title));}
 assert.match(html,/Cadillac submits a source-confirmation and leachate cessation report/);
 assert.match(html,/Written cessation\/transition report: held/);
 assert.match(html,/22 requests still needed across 5 blocks/);
});
