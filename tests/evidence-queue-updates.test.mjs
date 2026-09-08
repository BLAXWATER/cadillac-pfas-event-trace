import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { loadDocumentRecords } from '../scripts/document-download-integrity.mjs';

const readJson = async (name) => JSON.parse(await readFile(new URL(`../app/${name}.json`, import.meta.url), 'utf8'));
const updates = await readJson('evidence-request-queue-updates');
const definitions = await readJson('evidence-request-queue');
const audit = await readJson('evidence-request-queue-audit');
const records = await loadDocumentRecords();
const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const allNotes = updates.blocks.flatMap(block => block.held);
const note = id => allNotes.find(item => item.id === id);

test('queue update covers all five blocks with exact canonical sources and valid PDF pages', () => {
  assert.deepEqual(updates.blocks.map(block => block.requestId).sort(), definitions.map(block => block.id).sort());
  assert.equal(new Set(allNotes.map(item => item.id)).size, allNotes.length);
  assert.equal(allNotes.length, 25);
  const ids = new Set();
  for (const item of allNotes) {
    assert.ok(item.finding.trim() && item.limitation.trim());
    assert.ok(item.sources.length);
    for (const source of item.sources) {
      const matches = records.filter(record => record.id === source.recordId && record.sha256 === source.sha256);
      assert.equal(matches.length, 1, `${source.recordId} must resolve to one unchanged original`);
      assert.ok(source.label.trim());
      for (const p of source.pages ?? []) assert.ok(Number.isInteger(p) && p >= 1 && p <= matches[0].pages, `${source.recordId} PDF page ${p}`);
      ids.add(source.recordId);
    }
  }
  assert.equal(ids.size, 60);
});

test('every note ties to defined requests, and every requirement has a tie-back and a block follow-up', () => {
  for (const block of updates.blocks) {
    const definition = definitions.find(d => d.id === block.requestId);
    const linked = new Set();
    assert.ok(block.followUp.trim());
    for (const item of block.held) {
      assert.ok(item.requirementIds.length, item.id);
      assert.equal(new Set(item.requirementIds).size, item.requirementIds.length);
      for (const id of item.requirementIds) {
        assert.ok(definition.requirements.some(r => r.id === id), `${item.id}: ${id}`);
        linked.add(id);
      }
    }
    assert.deepEqual([...linked].sort(), definition.requirements.map(r => r.id).sort());
  }
  assert.equal(audit.lastRecheck.fullyCompletedBlocks, 0);
});

test('source boundaries preserve the 2009 period, cessation sequence, separate PFAS media and corrected Plett date', async () => {
  assert.doesNotMatch(note('receiving-relationship').limitation, /predates/);
  assert.doesNotMatch(note('landfill-2010-context').limitation, /before the 2012/);
  assert.match(note('reported-cessation').finding, /March 18, 2019/);
  assert.match(note('reported-cessation').finding, /December 18/);
  assert.equal(note('reported-cessation').sources.length, 4);
  assert.match(note('leachate-pfas-held').limitation, /not mixed main-WWTP influent/);
  assert.match(note('digester-pfas-held').limitation, /Water\/ng\/L/);
  assert.match(note('digester-pfas-held').limitation, /estimated values and matrix-interference/);
  assert.match(note('effluent-series-held').limitation, /not a paired treatment study/);
  const march = definitions.flatMap(d => d.requirements).find(r => r.id === 'plett-coc-2025-03-07');
  assert.match(march.label, /March 7, 2025/);
  assert.match(march.label, /WTK_PFAS_16874/);
  assert.match(march.label, /timezone unspecified/);
  assert.ok(!definitions.flatMap(d => d.requirements).some(r => r.id === 'plett-coc-2025-03-04'));
  assert.match(page, /date: "2025-03-07"/);
  assert.match(page, /Original filename retained despite its March 4 date/);
  assert.match(note('plett-packet-held').limitation, /subtracting 24 from 49 does not establish/);
  assert.doesNotMatch(JSON.stringify(audit), /lacks chain-of-custody forms and 25 pages/);
  const oldAudit = await readJson('batch33-egle-aoi-multi-agency-audit');
  assert.doesNotMatch(JSON.stringify(oldAudit), /only 24 of 49 work-order pages/);
});

test('held context cannot silently close any requirement or inflate the catalog count', () => {
  const closed = definitions.flatMap(d => d.requirements).filter(r => r.verifiedEvidence?.length);
  assert.deepEqual(closed.map(r => r.id), ['local-boring-well-construction']);
  assert.equal(definitions.flatMap(d => d.requirements).length - closed.length, 22);
  assert.equal(definitions.find(d => d.id === 'receiving-history').requirements.length, 7);
  assert.equal(records.length, 1623);
  assert.equal(audit.lastRecheck.localCatalogRecords, records.length);
  assert.equal(audit.lastRecheck.newClosures, 0);
  assert.equal(audit.lastRecheck.remainingRequirements, 22);
  assert.equal(audit.lastRecheck.previouslySatisfiedRequirements, 1);
  assert.equal(audit.lastRecheckDate, updates.reviewDate);
  assert.match(updates.scope, /not a fresh reread/);
  assert.doesNotMatch(JSON.stringify(updates), /"verifiedEvidence"/);
  assert.match(page, /reference\.recordId && record\.sha256 === reference\.sha256/);
  assert.match(page, /sources\.every\(\(source\) => source\.document\)/);
  assert.match(page, /const remainingEvidenceRequirements = evidenceRequests\.reduce/);
});

test('queue retains affirmative offloading and cessation findings with exact limits', () => {
  assert.match(note('actual-offloading').finding, /actual American Waste leachate offloading/);
  assert.match(note('actual-offloading').finding, /Missing tickets do not negate/);
  assert.match(note('actual-offloading').limitation, /notification-call time/);
  assert.match(note('actual-offloading').limitation, /tanker capacity, not a measured load/);
  assert.match(note('actual-offloading').limitation, /does not identify the originating landfill/);
  assert.match(note('reported-cessation').finding, /would no longer bring leachate/);
  assert.match(note('reported-cessation').limitation, /do not state the exact final-load date\/time/);
  assert.match(note('agreement-approval').finding, /2009\.216/);
  assert.match(note('agreement-approval').finding, /842/);
  assert.match(note('agreement-approval').limitation, /fully executed agreement/);
  assert.match(note('receiving-relationship').limitation, /2017 comes from file metadata/);
});

test('procurement, EPA drafts and County proposals do not become delivery or PFAS pathway proof', () => {
  assert.match(note('equipment-chain').limitation, /estimated lead times, not an actual shipment date or carrier/);
  assert.match(note('chemical-pump-purchases').limitation, /not individual delivery receipts/);
  assert.match(note('county-and-epa-context').limitation, /draft permitting do not supply/);
  assert.match(note('county-2020-boundary').limitation, /not original leachate invoices/);
  assert.match(note('county-2020-boundary').limitation, /completed PFAS tests/);
  assert.match(note('influent-still-unmeasured').finding, /influent sampling “NO”/);
  assert.match(note('influent-still-unmeasured').limitation, /LDFA influent is not main-WWTP influent/);
  assert.match(note('aoi-context-held').limitation, /not a PFAS source investigation/);
  assert.match(note('revenue-and-record-leads').limitation, /historical guidance/);
  assert.doesNotMatch(JSON.stringify(updates), /former employee confirms|tickets were rarely/i);
});

test('production queue renders current counts, all context notes and every outstanding request', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/', { headers: { accept: 'text/html' } }),
    { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  const queue = html.match(/<section class="evidence-queue"[\s\S]*?<\/section>/)?.[0];
  assert.ok(queue);
  const plain = queue.replaceAll('<!-- -->', '').replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
  assert.ok(plain.includes('22 requests still needed across 5 blocks'));
  assert.ok(plain.includes('1 previously satisfied'));
  assert.ok(plain.includes('0 fully completed blocks'));
  assert.ok(plain.includes('Already satisfied'));
  assert.ok(plain.includes('Review completion evidence'));
  assert.ok(plain.includes(updates.scope));
  assert.ok(plain.includes(updates.reviewDateLabel));
  for (const block of updates.blocks) {
    assert.ok(plain.includes(`id="request-${block.requestId}"`));
    assert.ok(plain.includes(block.summary));
    assert.ok(plain.includes(block.followUp));
    for (const item of block.held) {
      assert.ok(plain.includes(item.finding), item.id);
      assert.ok(plain.includes(item.limitation), item.id);
      for (const ref of item.sources) assert.ok(plain.includes(ref.label), ref.recordId);
      for (const id of item.requirementIds) {
        assert.ok(plain.includes(`href="#requirement-${id}"`), id);
        assert.equal((plain.match(new RegExp(`id="requirement-${id}"`, 'g')) ?? []).length, 1, `${id}: one target`);
      }
    }
  }
  for (const req of definitions.flatMap(d => d.requirements).filter(r => !r.verifiedEvidence?.length)) assert.ok(plain.includes(req.label), req.id);
  assert.equal((queue.match(/class="request-card"/g) ?? []).length, 5);
  assert.equal((queue.match(/class="request-held"/g) ?? []).length, 5);
});
