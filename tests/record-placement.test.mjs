import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { publicManifestPath, verifyRecordPlacement } from "../scripts/record-placement-integrity.mjs";

test("every source record is assigned to exactly one intended visible archive block", async () => {
  const { schema, manifest, failures } = await verifyRecordPlacement();
  assert.deepEqual(failures, []);
  assert.equal(schema.length, 13);
  assert.equal(manifest.archiveCount, 13);
  assert.equal(manifest.recordCount, 1558);
  assert.equal(new Set(manifest.records.map((record) => record.id)).size, 1558);
  assert.equal(manifest.archives.reduce((sum, archive) => sum + archive.count, 0), 1558);
});

test("the public placement manifest exactly mirrors the rendered archive registry", async () => {
  const { manifest, failures } = await verifyRecordPlacement();
  assert.deepEqual(failures, []);
  const published = JSON.parse(await readFile(publicManifestPath, "utf8"));
  assert.deepEqual(published, manifest);
});

test("the production page exposes the bundled placement manifest used by the live audit", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const bundledAssets = await readFile(new URL("../app/bundled-public-assets.ts", import.meta.url), "utf8");
  assert.match(page, /data-placement-manifest-url=\{bundledPublicAsset\("\/record-placement-manifest\.json"\)\}/);
  assert.match(bundledAssets, /import\.meta\.glob\("\.\.\/public\/record-placement-manifest\.json"/);
});
