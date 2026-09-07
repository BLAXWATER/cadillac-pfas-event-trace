import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { loadDocumentRecords, loadDownloadDeliveryPlan } from '../scripts/document-download-integrity.mjs';
import { verifyRecordPlacement } from '../scripts/record-placement-integrity.mjs';

const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const audit = await json('../app/cedar-creek-b-five-minutes-audit.json');
const aliases = await json('../app/verified-filename-aliases.json');
const previews = await json('../app/first-page-preview-manifest.json');
const records = await loadDocumentRecords();
const source = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const queue = await json('../app/evidence-request-queue-updates.json');

test('five original minutes add five distinct records with dates from their contents', async () => {
  assert.equal(records.length, 1613);
  assert.match(source, /supplementalDocuments\.length\}<\/strong> distinct additions/);
  assert.equal(audit.stats.recordsBefore + audit.stats.recordsAdded, audit.stats.recordsAfter);
  assert.deepEqual(audit.canonicalRecords.map(r => [r.sourceName, r.meetingDate, r.pages]), [
    ['city-minutes-scan-202.pdf', '2010-04-19', 7],
    ['city-minutes-scan-238.pdf', '2010-08-16', 5],
    ['city-minutes-scan-267.pdf', '2010-10-18', 6],
    ['city-minutes-scan-262.pdf', '2010-11-01', 7],
    ['city-minutes-scan-265.pdf', '2010-12-06', 5],
  ]);
  const plan = await loadDownloadDeliveryPlan(records);
  const placement = await verifyRecordPlacement({ writeManifest: false });
  assert.deepEqual(placement.failures, []);
  for (const entry of audit.canonicalRecords) {
    const matching = records.filter(r => r.sha256 === entry.sha256);
    assert.equal(matching.length, 1);
    const record = matching[0];
    assert.equal(record.id, entry.recordId);
    assert.equal(record.year, '2010');
    assert.equal(record.pages, entry.pages);
    assert.equal(plan.find(item => item.row.id === record.id)?.kind, 'bundled', 'New originals must be served by the public Site, not a missing GitHub path');
    const bytes = await readFile(new URL('../public' + entry.asset, import.meta.url));
    assert.equal(bytes.length, entry.size);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
    assert.equal(aliases[record.id].sha256, entry.sha256);
    assert.ok(aliases[record.id].aliases.includes(entry.sourceName));
    assert.equal(previews[record.url], entry.preview);
    assert.ok((await readFile(new URL('../public' + entry.preview, import.meta.url))).length);
    assert.ok(placement.manifest.records.some(r => r.id === record.id && r.catalog === 'supplemental-documents.json'));
  }
  // Delivery-plan validation must not fall back to an unpinned repository path.
  assert.ok(plan);
});

test('review preserves five blank pages without inventing OCR work or queue closures', () => {
  assert.equal(audit.stats.pdfPagesRead, 30);
  assert.equal(audit.stats.embeddedTextPages, 25);
  assert.equal(audit.stats.visuallyVerifiedBlankPages, 5);
  assert.equal(audit.stats.ocrPages, 0);
  assert.equal(audit.stats.requirementsClosed, 0);
  assert.deepEqual(audit.queueResolution.closedRequirementIds, []);
  assert.equal(audit.queueResolution.remainingRequirements, 22);
  for (const doc of audit.pageFingerprints) {
    assert.equal(doc.pages.filter(p => p.classification === 'visually verified blank').length, 1);
    assert.equal(doc.pages.at(-1).classification, 'visually verified blank');
  }
});

test('main year events distinguish retail rates, proposals, corrected minutes and amendment approval', () => {
  assert.match(source, /Motion 2010\.096 awards Environmental Recycling Group/);
  assert.match(source, /not leachate revenue, payment, actual material delivery/);
  assert.match(source, /These minutes contain no plan-amendment adoption/);
  assert.match(source, /November 1 minutes subsequently correct the earlier discussion/);
  assert.match(source, /Motion 2010\.248 approves the 2009 Solid Waste Management Plan amendment by 3–2/);
  assert.match(source, /John Divozzo, not Bob Joseph/);
  for (const date of audit.timelineMeetingDates) assert.ok(source.includes(`isoDate: "${date}"`));
  const note = queue.blocks.flatMap(b => b.held).find(n => n.id === 'landfill-2010-context');
  assert.equal(note.sources.length, 2);
  assert.match(note.limitation, /not wastewater-flow logs/);
  assert.match(note.limitation, /executed treatment agreement/);
});

test('built public page exposes the 1613 total and all three reviewed 2010 events', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/', { headers: { accept: 'text/html' } }),
    { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = (await response.text()).replaceAll('<!-- -->', '');
  assert.match(html, /Search all 1,613 records/);
  assert.match(html, /Council raises water and sewer rates and awards hazardous-waste collection/);
  assert.match(html, /Council hears landfill-sale, waste-import and tipping-fee proposals/);
  assert.match(html, /Council approves solid-waste-plan amendment after landfill-sale discussion/);
});
