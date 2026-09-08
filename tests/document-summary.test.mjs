import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDocumentRecords } from '../scripts/document-download-integrity.mjs';
import { documentSummary } from '../app/document-summary.mjs';
test('every catalog card has a description or explicit missing-findings notice', async () => {
  const records = await loadDocumentRecords();
  assert.equal(records.length, 1623);
  for (const record of records) {
    const summary = documentSummary(record);
    assert.ok(summary.trim(), record.id);
    if (record.description?.trim()) assert.equal(summary, record.description.trim());
    else assert.match(summary, /findings summary has not yet been recorded/);
  }
});
test('all rendered archive cards contain summaries including HNN report', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const res = await worker.fetch(new Request('http://localhost/'), { ASSETS: { fetch: async () => new Response('', {status:404}) } }, {waitUntil(){},passThroughOnException(){}});
  assert.equal(res.status,200);
  const html = await res.text();
  const cards = [...html.matchAll(/<article class="archive-card[^"]*"[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
  assert.equal(cards.length,1623);
  for(const card of cards) assert.match(card, /<p class="archive-description">[\s\S]+?<\/p>/);
  assert.ok(cards.find(c=>c.includes('form-submission-033-bffd8eec3c32')).includes('Certified IPP annual report for calendar year 2018'));
});
