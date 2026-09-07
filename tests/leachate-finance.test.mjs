import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {loadDocumentRecords,loadDownloadDeliveryPlan} from '../scripts/document-download-integrity.mjs';
import {verifyRecordPlacement} from '../scripts/record-placement-integrity.mjs';

const json=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const finance=await json('../app/leachate-finance-findings.json');
const audit=await json('../app/leachate-finance-intake-audit.json');
const aliases=await json('../app/verified-filename-aliases.json');
const previews=await json('../app/first-page-preview-manifest.json');
const records=await loadDocumentRecords();
const byId=new Map(records.map(r=>[r.id,r]));
const source=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');

test('20 financial originals reconcile to 14 additions and six existing canonical records',async()=>{
  assert.deepEqual([audit.stats.suppliedFiles,audit.stats.suppliedPages,audit.stats.recordsBefore,audit.stats.recordsAdded,audit.stats.recordsAfter],[20,3490,1599,14,1613]);
  assert.equal(records.length,1613);
  assert.equal(audit.sources.filter(s=>s.relationship.startsWith('byte-identical')).length,3);
  assert.equal(audit.sources.filter(s=>s.relationship.startsWith('render-identical')).length,3);
  assert.equal(new Set(audit.sources.map(s=>s.recordId)).size,20);
  const plan=await loadDownloadDeliveryPlan(records);
  const placement=await verifyRecordPlacement({writeManifest:false});
  assert.deepEqual(placement.failures,[]);
  for(const s of audit.sources){
    const r=byId.get(s.recordId);
    assert.equal(r.sha256,s.sha256);
    assert.equal(r.pages,s.sourcePages);
    assert.equal(aliases[r.id].sha256,r.sha256);
    assert.ok(aliases[r.id].aliases.includes(s.filename));
    assert.ok(placement.manifest.records.some(p=>p.id===r.id&&p.archiveId==='supplemental'));
    if(audit.newRecordIds.includes(r.id)){
      assert.equal(s.sourceSha256,r.sha256);
      assert.equal(plan.find(p=>p.row.id===r.id).kind,'bundled');
      const bytes=await readFile(new URL('../public'+r.url,import.meta.url));
      assert.equal(bytes.length,r.size);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);
      assert.ok(previews[r.url]);
      assert.ok((await readFile(new URL('../public'+previews[r.url],import.meta.url))).length>0);
    }
  }
});

test('annual series preserves Actual columns, fiscal dates, exact page links and arithmetic',()=>{
  const expected=[[2011,262970,115],[2012,199680,113],[2013,270678,109],[2014,246629,101],[2015,328211,103],[2016,314984,101],[2017,447684,105],[2018,431105,103],[2019,494691,107]];
  assert.deepEqual(finance.annualActuals.map(r=>[r.fiscalYear,r.value,r.source.page]),expected);
  assert.equal(finance.annualActuals.reduce((s,r)=>s+r.value,0),2996632);
  assert.equal(finance.annualActuals.filter(r=>r.fiscalYear>=2012).reduce((s,r)=>s+r.value,0),2733662);
  for(const r of finance.annualActuals){
    assert.equal(r.status,'Actual');assert.equal(r.account,'Leachate');assert.equal(r.unit,'USD');
    const event=finance.events.find(e=>e.year===String(r.fiscalYear)&&e.title.startsWith('City reports $'));
    assert.equal(event.isoDate,`${r.fiscalYear}-06-30`);
    assert.match(event.timeBasis,/not a delivery/i);
    assert.ok(event.sources.some(s=>s.recordId===r.source.recordId&&s.page===r.source.page));
  }
  for(const e of finance.events)for(const s of e.sources){
    const r=byId.get(s.recordId);assert.equal(s.sha256,r.sha256);assert.equal(s.url,r.url);
    assert.ok(s.page>=1&&s.page<=r.pages);assert.equal(s.pages,r.pages);
  }
  assert.match(source,/\.\.\.leachateFinance.events.map/);
  assert.match(source,/page: source.page/);
});

test('source limitations survive publication and do not close transaction requests',async()=>{
  const all=JSON.stringify(finance);
  assert.match(all,/\$1 discrepancy retained/);
  assert.match(all,/not an audit opinion or assurance/);
  assert.match(all,/comparable final budget baseline remains unverified/);
  assert.match(all,/corrected executed exhibit/);
  assert.match(all,/Estimated\/proposed zeros are not verified final actuals/);
  assert.match(all,/not a verified total paid by one customer/);
  const revenueSummary=finance.events.find(e=>e.title==='City reports nearly $3 million in leachate revenue, FY2011–FY2019');
  assert.equal(revenueSummary.isoDate,'2019-06-30');
  assert.ok(revenueSummary.significance.startsWith('Missing tickets, missing documents doesn’t mean missing events.'));
  assert.match(revenueSummary.significance,/not cash receipts, profit, per-load tickets or gallons/);
  assert.ok(revenueSummary.sources.every(s=>!s.result.includes('Missing tickets, missing documents')),'Reader clarification must not be presented as a source quotation');
  assert.deepEqual(finance.compliance.map(r=>[r.fiscalYear,r.count]),[[2014,8],[2015,38],[2016,6],[2017,7],[2018,5],[2019,12]]);
  assert.doesNotMatch(source,/Audited report documents FY201[678] landfill-leachate revenue variance/);
  const queue=await json('../app/evidence-request-queue-updates.json');
  const financialNote=queue.blocks[0].held.find(n=>n.id==='financial-actuals-2011-2019');
  assert.equal(financialNote.sources.length,14);
  for (const id of ['170-641352fc860b','192-fa26ae6e44ab','193-c1fd49ce87b7','013-f756ecea1687','180-eb9d0123f72e']) assert.ok(financialNote.sources.some(s=>s.recordId===id));
  const requirements=(await json('../app/evidence-request-queue.json')).flatMap(q=>q.requirements);
  assert.equal(requirements.filter(r=>!r.verifiedEvidence?.length).length,22);
});

test('built public page renders every new finding in the proper year band',async()=>{
  const {default:worker}=await import('../dist/server/index.js');
  const response=await worker.fetch(new Request('http://localhost/',{headers:{accept:'text/html'}}),{ASSETS:{fetch:async()=>new Response('Not found',{status:404})}},{waitUntil(){},passThroughOnException(){}});
  assert.equal(response.status,200);
  const html=(await response.text()).replaceAll('<!-- -->','').replaceAll('&amp;','&').replaceAll('&#x27;',"'").replaceAll('&quot;','"');
  assert.match(html,/Search all 1,613 records/);
  for(const event of finance.events)assert.ok(html.includes(event.title),event.title);
  assert.match(html,/\$2,996,632/);
  const year2019=html.match(/<section class="year-group" id="year-2019"[\s\S]*?<\/section>/)?.[0];
  assert.ok(year2019?.includes('Missing tickets, missing documents doesn’t mean missing events.'));
  assert.match(html,/22 requests still needed across 5 blocks/);
});
