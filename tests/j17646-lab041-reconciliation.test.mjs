import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("J17646 supplied copy resolves to one enriched local laboratory record", async () => {
  const records = JSON.parse(await readFile("app/lab-documents.json", "utf8"));
  const aliases = JSON.parse(await readFile("app/verified-filename-aliases.json", "utf8"));
  const audit = JSON.parse(await readFile("app/j17646-lab041-reconciliation-audit-2026-09-21.json", "utf8"));
  const record = records.find((row) => row.id === "lab-041-b6acc1cf09fd");

  assert.equal(record.url, "/lab-docs/041-b6acc1cf09fd.pdf");
  assert.match(record.description, /PFOS 120 ng\/L/);
  assert.match(record.description, /not mixed WWTP influent/i);
  assert.ok(aliases[record.id].aliases.includes("2018 - TEST-AMERICA-REPORT-J17646-1-UDS-Level-2-Report-Final-Report (1).pdf"));
  assert.equal(audit.source.sha256, record.sha256);
  assert.equal(audit.status.verified, true);
});
