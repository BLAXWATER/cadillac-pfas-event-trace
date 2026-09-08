import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {loadDocumentRecords,loadDownloadDeliveryPlan} from '../scripts/document-download-integrity.mjs';
const json=async name=>JSON.parse(await readFile(new URL('../app/'+name+'.json',import.meta.url),'utf8'));
const audit=await json('j19915-intake-audit');
const records=await loadDocumentRecords();
const record=records.find(r=>r.id===audit.recordId);
const source=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
test('J19915 adds one searchable record for an existing event and preserves both source renditions',async()=>{
 assert.equal(records.length,1623);assert.equal(audit.searchableRecordsAdded,1);assert.equal(audit.newSamplingEvents,0);
 assert.equal(record.name,audit.filename);assert.equal(record.sha256,audit.sha256);assert.equal(record.pages,22);
 assert.equal(records.filter(r=>r.sha256===audit.sha256).length,1);
 for(const [url,sha,size] of [[record.url,audit.sha256,audit.bytes],[audit.existingRendition.url,audit.existingRendition.sha256,audit.existingRendition.bytes]]){
  const bytes=await readFile(new URL('../public'+url,import.meta.url));assert.equal(bytes.length,size);assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
 }
 assert.equal((await loadDownloadDeliveryPlan(records)).find(d=>d.row.id===record.id).kind,'bundled');
 assert.equal([...source.matchAll(/date: "2019-06-04"/g)].length,1);
 assert.match(source,/modified: "2026-05-01 08:31:07 EDT"/);
 assert.match(source,/not a new sampling or laboratory-release date/);
 assert.match(record.description,/p16 receipt-log scan is clipped/);
 assert.match(record.description,/Different renditions are not independent corroboration/);
 const previews=await json('first-page-preview-manifest');assert.ok(await readFile(new URL('../public'+previews[record.url],import.meta.url)));
});
test('primary and duplicate are attributed separately without rewriting the City form',async()=>{
 assert.deepEqual([audit.primary.subcontractId,audit.primary.page,audit.primary.pfos,audit.primary.pfoa],['1074244',8,7.8,16]);
 assert.deepEqual([audit.duplicate.subcontractId,audit.duplicate.page,audit.duplicate.pfos,audit.duplicate.pfoa],['1074245',9,7.1,15]);
 assert.match(source,/isoDate: "2019-06-04T13:15:00-04:00"/);
 for(const text of ['PFOS 7.8 ng/L and PFOA 16 ng/L','PFOS 7.1 ng/L and PFOA 15 ng/L','opening-CCV','not leachate loads into the WWTP'])assert.ok(record.description.includes(text)||source.includes(text),text);
 const form=(await json('form-submission-documents')).find(r=>r.id==='form-submission-034-00d98416b456');
 assert.match(form.description,/reports June 4, 2019 outfall results of PFOS 7.1 ng\/L and PFOA 15 ng\/L/);
 assert.match(form.description,/match Effluent Duplicate 1074245/);
 const queue=await json('evidence-request-queue-updates');const note=queue.blocks.flatMap(b=>b.held).find(n=>n.id==='j19915-effluent-package-held');
 assert.equal(note.sources[0].sha256,record.sha256);assert.match(note.limitation,/No influent, landfill leachate, biosolids or groundwater sample/);
 const requirements=(await json('evidence-request-queue')).flatMap(b=>b.requirements);assert.equal(requirements.filter(r=>!r.verifiedEvidence?.length).length,22);
 assert.deepEqual(audit.closedRequirementIds,[]);
});
test('built public page exposes the report once in the laboratory archive and both result pairs',async()=>{
 const {default:worker}=await import('../dist/server/index.js');
 const r=await worker.fetch(new Request('http://localhost/',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
 assert.equal(r.status,200);const html=(await r.text()).replaceAll('<!-- -->','');
 assert.match(html,/Search all 1,623 records/);assert.match(html,/June 2019 effluent PFAS: primary and duplicate results/);
 assert.equal(html.split('data-record-id="'+record.id+'"').length-1,1);
 assert.match(html,/1074244/);assert.match(html,/1074245/);assert.match(html,/22 requests still needed across 5 blocks/);
});
