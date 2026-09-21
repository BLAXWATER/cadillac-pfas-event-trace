import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("234880.pdf resolves to the reviewed canonical 1988 investigation", async () => {
  const aliases = JSON.parse(await readFile("app/verified-filename-aliases.json", "utf8"));
  const audit = JSON.parse(await readFile("app/epa-234880-alias-intake-audit-2026-09-21.json", "utf8"));
  const row = aliases["198-402da04fc76d"];

  assert.ok(row.aliases.includes("234880.pdf"));
  assert.equal(audit.source.sha256, "ddd2bc1eb32fddc91b8c2653243d3755fc6d409fd6a595781ea39862d8049a60");
  assert.match(audit.comparison.disposition, /one canonical downloadable original/i);
  assert.equal(audit.status.verified, true);
});
