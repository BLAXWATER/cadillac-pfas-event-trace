import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadDocumentRecords, loadDownloadDeliveryPlan } from '../scripts/document-download-integrity.mjs';

const json = async file => JSON.parse(await readFile(new URL('../app/'+file+'.json',import.meta.url),'utf8'));
const audit = await json('solid-waste-plan-intake-audit');
const findings = await json('solid-waste-plan-findings');
const aliases = await json('verified-filename-aliases');
const previews = await json('first-page-preview-manifest');
const records = await loadDocumentRecords();

test('five complete solid-waste originals are distinct, preserved and searchable without duplicate aliases',async()=>{
  assert.equal(records.length,1618);
  assert.equal(audit.sources.length,5);
  assert.equal(audit.sources.reduce((n,r)=>n+r.pages,0),651);
  assert.equal(findings.events.length,8);
  const plans=await loadDownloadDeliveryPlan(records);
  for(const expected of audit.sources){
    const found=records.filter(r=>r.id===expected.id);
    assert.equal(found.length,1);
    const row=found[0];
    assert.equal(row.sha256,expected.sha);
    assert.equal(row.pages,expected.pages);
    assert.equal(row.size,expected.size);
    assert.equal(row.category,'Wexford landfill & leachate');
    const bytes=await readFile(new URL('../public'+row.url,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected.sha);
    assert.equal(bytes.length,expected.size);
    assert.ok(aliases[row.id].aliases.includes(expected.original));
    assert.equal(aliases[row.id].sha256,row.sha256);
    assert.ok(previews[row.url]);
    assert.equal(plans.find(p=>p.row.id===row.id).kind,'bundled');
  }
});

test('dated findings cite canonical originals and valid pages without turning authorization into delivery',()=>{
  assert.deepEqual(findings.events.map(e=>e.isoDate),['1995-09-19','1998-10-13','2007-02','2007-12-12','2011-04-19','2012-05-01','2014-05-14','2016-08-31']);
  for(const event of findings.events){
    assert.equal(event.year,event.isoDate.slice(0,4));
    assert.equal(event.category,'12 · Landfill & leachate');
    for(const s of event.sources){
      const r=records.find(r=>r.id===s.recordId);
      assert.equal(s.sha256,r.sha256);
      assert.equal(s.url,r.url);
      assert.equal(s.pages,r.pages);
      assert.ok(s.page>=1 && s.page<=r.pages);
    }
  }
  assert.match(findings.events[0].significance,/not Wexford leachate/);
  assert.match(findings.events[2].significance,/same map, not separate/);
  assert.match(findings.events[3].significance,/not an independent causation/);
  assert.match(findings.events[4].significance,/sample ordinance is not an executed/);
  assert.match(findings.events[5].significance,/does not establish actual deliveries/);
  assert.match(findings.events[7].finding,/blank, not 100%/);
  assert.match(findings.events[7].significance,/20,000-gallon/);
  assert.doesNotMatch(JSON.stringify(findings),/22,000-gallon/);
});

test('upstream planning and maps add tie-backs but close no WWTP or groundwater request',async()=>{
  const updates=await json('evidence-request-queue-updates');
  const notes=updates.blocks.flatMap(b=>b.held);
  for(const id of ['solid-waste-agreement-held','solid-waste-authorizations-held','landfill-maps-held'])assert.ok(notes.some(n=>n.id===id));
  const definitions=await json('evidence-request-queue');
  const closed=definitions.flatMap(b=>b.requirements).filter(r=>r.verifiedEvidence?.length);
  assert.deepEqual(closed.map(r=>r.id),['local-boring-well-construction']);
  assert.equal(definitions.flatMap(b=>b.requirements).length-closed.length,22);
  assert.ok(aliases['008-5b67e1ed1d5c'].aliases.includes('Item_149.pdf'));
  assert.ok(aliases['process-site-021-6c2e73d85da0'].aliases.includes('842.pdf'));
  assert.match(notes.find(n=>n.id==='agreement-approval').limitation,/842.pdf contains January 19, 2016/);
});

test('built public page exposes eight findings in their year blocks and the expanded count',async()=>{
  const {default:worker}=await import('../dist/server/index.js');
  const response=await worker.fetch(new Request('http://localhost/',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(response.status,200);
  const html=(await response.text()).replaceAll('<!-- -->','').replaceAll('&amp;','&').replaceAll('&#x27;',"'").replaceAll('&quot;','"');
  assert.match(html,/Search all 1,618 records/);
  for(const event of findings.events){
    const section=html.match(new RegExp('<section class="year-group" id="year-'+event.year+'"[\\s\\S]*?</section>'))?.[0];
    assert.ok(section?.includes(event.title),event.title);
    assert.ok(section?.includes(event.sources[0].name),event.sources[0].name);
  }
  assert.match(html,/22 requests still needed across 5 blocks/);
});
