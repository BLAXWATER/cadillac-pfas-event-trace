import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { loadDocumentRecords, loadDownloadDeliveryPlan, root } from '../scripts/document-download-integrity.mjs';

const readJson = async name => JSON.parse(await readFile(path.join(root, name), 'utf8'));

test('17-file Cedar Creek repeat batch maps original identities to the intended existing blocks', async () => {
  const audit = await readJson('app/batch102-cedar-creek-17-recheck-audit.json');
  const records = await loadDocumentRecords();
  assert.equal(audit.dispositions.length, 17);
  assert.equal(audit.stats.recordsAdded, 0);
  assert.equal(audit.stats.descriptionsUpdated, 11);
  assert.equal(audit.updatedRecordIds.length, 11);
  assert.equal(new Set(audit.dispositions.map(r => r.sha256)).size, 16);
  assert.equal(audit.dispositions.reduce((n, r) => n + r.pages, 0), 144);
  assert.equal([...new Map(audit.dispositions.map(r => [r.sha256, r])).values()].reduce((n, r) => n + r.pages, 0), 143);
  assert.deepEqual(audit.queueResolution.closedRequirementIds, []);
  for (const supplied of audit.dispositions) {
    const matches = records.filter(r => r.sha256 === supplied.sha256);
    assert.equal(matches.length, 1, supplied.sourceName);
    const [record] = matches;
    for (const field of ['catalog', 'url', 'sha256', 'size', 'pages']) assert.equal(record[field], supplied[field], `${record.id}: ${field}`);
    assert.equal(record.id, supplied.recordId);
    const [delivery] = await loadDownloadDeliveryPlan([record]);
    assert.ok(['bundled', 'archive'].includes(delivery.kind), record.id);
    const bytes = delivery.kind === 'bundled'
      ? await readFile(path.join(root, 'public', delivery.publicPath.slice(1)))
      : execFileSync('git', ['show', delivery.source.spec], { cwd: root, maxBuffer: 16 * 1024 * 1024 });
    assert.equal(bytes.length, record.size);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256);
  }
});

test('pre-inspection export does not misdate the historical receiving observation', async () => {
  const records = await loadDocumentRecords();
  const record = records.find(r => r.id === '059-72e0d17a78ae');
  assert.equal(record.year, 'Undated');
  assert.doesNotMatch(record.name, /2013-09-30/);
  assert.match(record.description, /February 3, 2011/);
  assert.match(record.description, /completion date is blank/);
  assert.match(record.description, /August 28, 2015, not an inspection date/);
  const page = await readFile(path.join(root, 'app/page.tsx'), 'utf8');
  assert.match(page, /isoDate: "2011-02-03"[\s\S]{0,800}title: "DEQ records County Landfill leachate/);
  assert.doesNotMatch(page, /title: "DEQ inspection documents aging infrastructure at the WWTP"/);
});

test('spill and source-status descriptions preserve measured-versus-reported boundaries', async () => {
  const records = await loadDocumentRecords();
  const spill = records.find(r => r.id === '039-c677de7c10e6');
  assert.match(spill.description, /9:22 a\.m\./);
  assert.match(spill.description, /WWTP drying beds/);
  assert.match(spill.description, /10,000 gallons is truck capacity, not measured load or spill volume/);
  assert.match(spill.description, /typed body does not name the originating landfill/);
  assert.equal(records.filter(r => r.description?.includes('January 12, 2016 City letter documents an actual American Waste')).length, 1);
  const status = records.find(r => r.id === 'form-submission-034-00d98416b456');
  assert.match(status.description, /PFOS 7\.1 ng\/L and PFOA 15 ng\/L at 2 MGD/);
  assert.match(status.description, /influent sampling NO/);
  assert.match(status.description, /not a claim of zero PFOS in effluent or proof of removal efficiency/);
  assert.match(status.description, /No exact final-delivery date/);
});

test('EPA draft and shipment guidance cannot be mistaken for operating or delivery evidence', async () => {
  const records = await loadDocumentRecords();
  const draft = records.find(r => r.id === '020-9ad6d46eb20b');
  assert.doesNotMatch(draft.name, /01-01-2017/);
  assert.match(draft.description, /EPA-signature fields are blank/);
  assert.match(draft.description, /84 gallons per minute.*not actual operating measurements/);
  assert.match(draft.description, /January 22, 2015/);
  assert.match(draft.description, /6,800 mg\/L, chloride 1,500 mg\/L and benzene 276 µg\/L/);
  assert.match(draft.description, /not a complete native laboratory package/);
  const hearing = records.find(r => r.id === '131-0cbb4e491791');
  assert.match(hearing.name, /Public-Hearing.*Draft/);
  assert.match(hearing.description, /not evidence the well operated/);
  const faq = records.find(r => r.id === '135-5f86ea369b77');
  assert.match(faq.description, /Historical guidance only/);
  assert.match(faq.description, /evidence that a record still exists today/);
  const webb = records.find(r => r.id === '164-519d4faa6c33');
  assert.match(webb.description, /\$0\.245 per dry pound/);
  assert.match(webb.description, /purchase authorization, not a delivery receipt/);
});
