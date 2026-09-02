import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { publicManifestPath, verifyRecordPlacement } from "../scripts/record-placement-integrity.mjs";

test("every source record is assigned to exactly one intended visible archive block", async () => {
  const { schema, manifest, failures } = await verifyRecordPlacement();
  assert.deepEqual(failures, []);
  assert.equal(schema.length, 13);
  assert.equal(manifest.archiveCount, 13);
  assert.equal(manifest.recordCount, 1554);
  assert.equal(new Set(manifest.records.map((record) => record.id)).size, 1554);
  assert.equal(manifest.archives.reduce((sum, archive) => sum + archive.count, 0), 1554);
});

test("the public placement manifest exactly mirrors the rendered archive registry", async () => {
  const { manifest, failures } = await verifyRecordPlacement();
  assert.deepEqual(failures, []);
  const published = JSON.parse(await readFile(publicManifestPath, "utf8"));
  assert.deepEqual(published, manifest);
});
