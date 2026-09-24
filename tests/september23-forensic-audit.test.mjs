import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("September 23 forensic audit preserves the complete eight-batch baseline", async () => {
  const baseline = JSON.parse(await readFile(new URL("../output/eight-batch-audit.json", import.meta.url), "utf8"));
  const records = baseline.flatMap((batch) => batch.files);
  assert.equal(baseline.length, 8);
  assert.equal(records.length, 123);
  assert.equal(new Set(records.map((record) => record.sha256)).size, 123);
  assert.ok(records.every((record) => record.filename && record.bytes > 0 && /^[a-f0-9]{64}$/.test(record.sha256)));
  assert.ok(records.some((record) => record.sha256 === "d231f1f3c7ba418beac42afc1cec6c2c1da678f4849bb8df22d5b7d0b8357738"));
  assert.ok(records.some((record) => record.sha256 === "03d33d742b160912b6e19cfe522c6abd73487bc20b4408ba6cb8e3f49df9b281"));
});

test("forensic report does not overstate unresolved review and publication", async () => {
  const report = JSON.parse(await readFile(new URL("../docs/september-23-forensic-audit.json", import.meta.url), "utf8"));
  assert.equal(report.verdict, "not-fully-compliant");
  assert.equal(report.catalog.records, 1678);
  assert.deepEqual(report.catalog.integrityFailures, []);
  assert.deepEqual(report.catalog.placementFailures, []);
  assert.equal(report.eightBatchBaseline.records, 123);
  assert.equal(report.eightBatchBaseline.operations.pages, 71);
  assert.ok(report.eightBatchBaseline.operations.pendingPages > 0);
  assert.ok(report.eightBatchBaseline.notExactHashReconciled > 0);
  assert.ok(report.blockers.length > 0);
});
