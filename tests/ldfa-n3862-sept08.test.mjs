import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadDocumentRecords, loadDownloadDeliveryPlan} from '../scripts/document-download-integrity.mjs';

const json = async n => JSON.parse(await readFile(new URL(`../app/${n}.json`,import.meta.url),'utf8'));
const audit = await json('ldfa-n3862-sept08-review');
const records = await loadDocumentRecords();
const byId = id => records.find(r => r.id === id);
const page = await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');

test('three reviewed originals yield two additions, with an exact duplicate and same-inspection variant distinguished',async()=>{
  assert.equal(audit.counts.sourcePagesReviewed,13);
  assert.equal(audit.counts.catalogRecordsAfter-audit.counts.catalogRecordsBefore,2);
  assert.equal(audit.counts.catalogRecordsAfter,1620,'Historical intake count remains unchanged');
  assert.equal(records.length,1622);
  for(const row of audit.records){
    assert.equal(byId(row.recordId).sha256,row.sha256);
    assert.equal(byId(row.recordId).size,row.size);
    assert.equal(byId(row.recordId).pages,row.pages);
    assert.equal(records.filter(r=>r.sha256===row.sha256).length,1);
  }
  const scan = audit.records[2];
  assert.equal(byId(scan.sameInspectionRecordId).sha256,scan.sameInspectionSha256);
  assert.notEqual(scan.sha256,scan.sameInspectionSha256);
  assert.match(byId(scan.recordId).description,/not a second inspection or independent corroboration/);
  assert.match(byId(scan.sameInspectionRecordId).description,/versions of the same inspection/);
  assert.equal([...page.matchAll(/date: "2015-11-18"/g)].length,1);
});

test('new originals and first-page previews are included in actual bundled delivery',async()=>{
  const plan=await loadDownloadDeliveryPlan(audit.records.filter(r=>r.recordId!=='006-0f46024ab583').map(r=>byId(r.recordId)));
  const previews=await json('first-page-preview-manifest');
  for(const p of plan){
    assert.equal(p.kind,'bundled');
    const bytes=await readFile(new URL('../public'+p.publicPath,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),p.row.sha256);
    assert.ok((await stat(new URL('../public'+previews[p.publicPath],import.meta.url))).size>0);
  }
});

test('printed dates, attribution, forecasts and limited inspection conclusions remain explicit',()=>{
  assert.equal(byId('194-e0ad50e1248b').year,'2020');
  assert.match(byId('194-e0ad50e1248b').description,/Printed December 8, 2020, despite supplied filename/);
  assert.match(page,/not attached written EPA\/EGLE determinations/);
  assert.match(page,/recorded vote refusing PFAS testing/);
  assert.match(page,/forecasts do not establish completed shutdowns or achieved savings/);
  assert.match(byId('111-d8141f278b56').description,/recent late-reporting VN/);
  assert.match(byId('111-d8141f278b56').description,/removal from the permit would be requested/);
  assert.match(byId('006-0f46024ab583').description,/not the report date/);
});

test('additional agency injection history strengthens context without closing the final-delivery request',async()=>{
  const queue=await json('evidence-request-queue-updates');
  const note=queue.blocks.flatMap(b=>b.held).find(n=>n.id==='reported-cessation');
  assert.ok(note.sources.some(s=>s.recordId==='006-0f46024ab583' && s.pages.includes(4)));
  assert.match(note.limitation,/do not state the exact final-load date\/time/);
  assert.match(note.limitation,/Beginning injection does not by itself establish/);
  const definitions=await json('evidence-request-queue');
  const requirements=definitions.flatMap(b=>b.requirements);
  assert.equal(requirements.filter(r=>!r.verifiedEvidence?.length).length,22);
});

test('production HTML includes both new chronology findings and the current searchable count',async()=>{
  const {default: worker}=await import('../dist/server/index.js');
  const response=await worker.fetch(new Request('http://localhost/',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(response.status,200);
  const html=(await response.text()).replaceAll('<!-- -->','');
  assert.match(html,/Search all 1,622 records/);
  assert.match(html,/LDFA discusses PFAS testing before closeout and seeks legal advice/);
  assert.match(html,/Signed landfill inspection preserves asbestos-record review and pond non-use/);
  assert.match(html,/22 requests still needed across 5 blocks/);
});
