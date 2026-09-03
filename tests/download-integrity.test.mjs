import assert from "node:assert/strict";
import test from "node:test";
import { verifyCatalogIntegrity } from "../scripts/document-download-integrity.mjs";

test("every document download has valid metadata and a direct delivery path", async () => {
  const result = await verifyCatalogIntegrity();
  assert.deepEqual(result.failures, []);
  assert.equal(result.records.length, 1559);
  assert.equal(result.local.length, 729);
  assert.equal(result.external.length, 830);
  assert.equal(result.bundledDeliveries.length + result.archiveDeliveries.length, result.records.length);
});
