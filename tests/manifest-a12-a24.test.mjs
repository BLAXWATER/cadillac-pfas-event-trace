import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { loadDocumentRecords, loadDownloadDeliveryPlan } from '../scripts/document-download-integrity.mjs';

const json = async name => JSON.parse(await readFile(new URL(`../app/${name}.json`, import.meta.url), 'utf8'));
const audit = await json('manifest-a12-a24-recheck');
const queue = await json('evidence-request-queue-updates');
const definitions = await json('evidence-request-queue');
const records = await loadDocumentRecords();
const notes = queue.blocks.flatMap(b => b.held);
const note = id => notes.find(n => n.id === id);

test('all sixteen official originals are accounted for once, with unchanged full hashes and filenames', async () => {
  assert.equal(audit.records.length, 16);
  assert.equal(new Set(audit.records.map(r => r.recordId)).size, 16);
  assert.equal(records.length, 1620);
  assert.equal(audit.counts.newRecords, 0);
  for (const row of audit.records) {
    const matches = records.filter(r => r.id === row.recordId && r.sha256 === row.sha256);
    assert.equal(matches.length, 1, row.manifestId);
    assert.equal(matches[0].size, row.size);
    assert.match(row.sha256, /^[a-f0-9]{64}$/);
    assert.equal(row.downloadedSha256, row.sha256);
    assert.equal(row.downloadedSize, row.size);
    assert.equal(row.sourceStatus, 200);
    assert.equal(new URL(row.sourceUrl).hostname, 'www.cadillac-mi.net');
    assert.ok(row.manifestResolvedUrl && row.retrievedUrl && row.sourceRetrievedAt);
    assert.ok(JSON.stringify(matches[0]).includes(row.filename), row.filename);
    assert.equal(row.publicDelivery.verified, true);
    assert.equal(row.publicDelivery.status, 200);
    assert.equal(row.publicDelivery.sha256, row.sha256);
    assert.equal(row.publicDelivery.size, row.size);
  }
  const plan = await loadDownloadDeliveryPlan(records.filter(r => audit.records.some(m => m.recordId === r.id)));
  assert.equal(plan.filter(p => p.kind === 'archive').length, 15);
  assert.equal(plan.filter(p => p.kind === 'bundled').length, 1);
  assert.match(audit.records.find(r => r.manifestId === 'A13').publicDelivery.url, /\/assets\/082-18e25560cde6-[^/]+\.pdf$/);
});

test('partial LDFA, flow-map and biosolids evidence cannot close the still-missing packages', () => {
  assert.match(note('ldfa-same-date-context').finding, /same-calendar-date LDFA entries, not established main-WWTP samples/);
  assert.match(note('ldfa-same-date-context').limitation, /November 27, 2025 where A16\/A17 print 2024/);
  assert.match(note('intermediate-aquifer-map-held').finding, /existing intermediate-aquifer data/);
  assert.match(note('intermediate-aquifer-map-held').limitation, /does not identify 1140 Plett/);
  assert.match(note('cadillac-biosolids-summary-held').finding, /5.1\/2.3 ppb/);
  assert.match(note('cadillac-biosolids-summary-held').limitation, /missing, not nondetects/);
  assert.match(note('cadillac-biosolids-summary-held').limitation, /May 2025 assessment/);
  assert.match(note('aoi-context-held').limitation, /TBA column/);
  const closed = definitions.flatMap(b => b.requirements).filter(r => r.verifiedEvidence?.length);
  assert.deepEqual(closed.map(r => r.id), ['local-boring-well-construction']);
  assert.equal(definitions.flatMap(b => b.requirements).length - closed.length, 22);
  assert.equal(audit.counts.newQueueClosures, 0);
});

test('standalone analytical views remain identified as duplicates of compilation pages', () => {
  assert.deepEqual(audit.duplicateViews.map(r => [r.manifestId, r.pages]), [
    ['A14', [21]], ['A15', [22]], ['A16', [23]], ['A17', [24]], ['A18', [25,26]],
  ]);
  for (const row of audit.duplicateViews) {
    const id = audit.records.find(r => r.manifestId === row.manifestId).recordId;
    assert.match(records.find(r => r.id === id).description, /identical to (?:page 21 of )?A13/);
  }
});
