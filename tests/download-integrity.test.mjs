import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { verifyCatalogIntegrity, loadDownloadDeliveryPlan } from "../scripts/document-download-integrity.mjs";

test("every document download has valid metadata and a direct delivery path", async () => {
  const result = await verifyCatalogIntegrity();
  assert.deepEqual(result.failures, []);
  const placement = JSON.parse(await readFile(new URL('../public/record-placement-manifest.json', import.meta.url), 'utf8'));
  assert.equal(result.records.length, placement.recordCount);
  assert.equal(result.local.length + result.external.length, result.records.length);
  assert.deepEqual(result.records.map(r=>r.id).sort(), placement.records.map(r=>r.id).sort());
  assert.equal(result.bundledDeliveries.length + result.archiveDeliveries.length + result.officialDeliveries.length, result.records.length);
});

test("HTML originals use immutable raw downloads rather than transformed hosted pages", async () => {
  const deliveries = await loadDownloadDeliveryPlan();
  for (const id of ["110-c1db81fc64d9", "120-83295aef8621", "121-22691dcca74e"]) {
    const delivery = deliveries.find(({ row }) => row.id === id);
    assert.ok(delivery);
    assert.equal(delivery.kind, "archive");
    assert.match(delivery.source.rawUrl, /^https:\/\/raw\.githubusercontent\.com\/BLAXWATER\/cadillac-pfas-event-trace\/[a-f0-9]{40}\/public\/reference-data\/[^/]+\.html$/);
  }
});
