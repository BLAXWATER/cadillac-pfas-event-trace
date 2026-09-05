import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { loadDocumentRecords, loadDownloadDeliveryPlan, root } from '../scripts/document-download-integrity.mjs';
import path from 'node:path';

test('Cedar Creek/A intake preserves nine originals, suppresses duplicates and keeps evidence boundaries', async () => {
  const audit = JSON.parse(await readFile(path.join(root, 'app/batch101-cedar-creek-a-intake-audit.json'), 'utf8'));
  const records = await loadDocumentRecords();
  assert.equal(audit.dispositions.length, 24);
  assert.equal(audit.stats.recordsAdded, 9);
  assert.equal(audit.dispositions.filter(r => r.decision === 'existing exact match').length, 14);
  assert.equal(audit.dispositions.filter(r => r.decision === 'same-batch exact duplicate').length, 1);
  assert.deepEqual(audit.queueResolution.closedRequirementIds, []);
  const previews = JSON.parse(await readFile(path.join(root, 'app/first-page-preview-manifest.json'), 'utf8'));
  for (const entry of audit.canonicalRecords) {
    const matches = records.filter(r => r.sha256 === entry.sha256);
    assert.equal(matches.length, 1, entry.sourceName);
    const [record] = matches;
    assert.equal(record.catalog, entry.catalog);
    assert.equal(record.url, entry.asset);
    const bytes = await readFile(path.join(root, 'public', entry.asset.slice(1)));
    assert.equal(bytes.length, entry.size);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
    assert.equal((await loadDownloadDeliveryPlan([record]))[0].kind, 'bundled');
    assert.equal(previews[entry.asset], entry.preview);
    assert.ok((await readFile(path.join(root, 'public', entry.preview.slice(1)))).length > 0);
  }
  const faq = records.find(r => r.id === '135-5f86ea369b77');
  const itsl = records.find(r => r.id === '136-d6661d1949a4');
  assert.equal(itsl.year, '1994');
  assert.match(itsl.description, /not a water result or shipment record/);
  assert.match(faq.description, /Historical guidance only/);
  assert.match(records.find(r => r.id === 'process-site-020-28d1cb87cb36').description, /no 2016 delivery date or carrier/);
  const april = audit.dispositions.filter(r => r.sha256.startsWith('26f799'));
  assert.equal(april.length, 2);
  assert.equal(april[0].recordId, april[1].recordId);
});
