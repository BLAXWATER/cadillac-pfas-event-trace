import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("Kysor 234897 is reconciled to one fully reviewed canonical record", async () => {
  const records = JSON.parse(await readFile(new URL("app/supplemental-documents.json", root), "utf8"));
  const matches = records.filter((record) => record.sha256 === "b7620af87938165207a12d127689ca240e887565412c773210c4dd54c8510299");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, "095-b7620af87938");
  assert.equal(matches[0].pages, 22);
  assert.match(matches[0].description, /commingled/i);
  assert.match(matches[0].description, /not PFAS evidence/i);

  const bytes = await readFile(new URL("public/findings-docs/095-b7620af87938.pdf", root));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), matches[0].sha256);

  const audit = JSON.parse(await readFile(new URL("app/kysor-234897-rereview-audit-2026-09-21.json", root), "utf8"));
  assert.deepEqual(audit.reviewCoverage.pageOrder, { first: 1, last: 22, count: 22, status: "reviewed" });
  assert.equal(audit.reviewCoverage.renderedPageReview.status, "visually-inspected");
  assert.equal(audit.status.reviewed, true);
  assert.equal(audit.status.verified, true);
});

test("Kysor 234897 adds a bounded 1994 decision event without creating PFAS claims", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(page, /EPA includes North Park and West of Leeson in the cleanup/);
  assert.match(page, /more than 1,100 feet across/);
  assert.match(page, /more than 1,200 feet long/);
  assert.match(page, /does not test PFAS/);
  assert.match(page, /byte-identical to the already published source/);
});
