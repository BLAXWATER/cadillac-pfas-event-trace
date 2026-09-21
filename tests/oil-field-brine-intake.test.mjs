import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("oil-field brine report is completely reviewed and source verified", async () => {
  const supplemental = JSON.parse(await readFile(new URL("app/supplemental-documents.json", root), "utf8"));
  const record = supplemental.find((row) => row.id === "210-6aec96618242");
  assert.ok(record);
  assert.equal(record.pages, 78);
  assert.equal(record.size, 3359014);
  assert.equal(record.sha256, "6aec966182427c220162a242f702c7112182aeef2cf720b5f4e14a6f04ec36b2");
  assert.match(record.category, /Groundwater & hydrogeology/);
  assert.match(record.description, /POSSIBLY ATTRIBUTABLE/);
  assert.match(record.description, /not PFAS/i);

  const bytes = await readFile(new URL("public/findings-docs/210-6aec96618242.pdf", root));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), record.sha256);

  const audit = JSON.parse(await readFile(new URL("app/oil-field-brine-intake-audit-2026-09-20.json", root), "utf8"));
  assert.deepEqual(audit.reviewCoverage.pageOrder, { first: 1, last: 78, count: 78, status: "reviewed" });
  assert.equal(audit.reviewCoverage.renderedPageReview.status, "visually-inspected");
  assert.equal(audit.reviewCoverage.ocrCoverage.status, "performed-and-visually-checked");
  assert.equal(audit.status.reviewed, true);
  assert.equal(audit.status.verified, true);
});

test("oil-field brine report has a preview, bundled download, catalog placement and bounded event", async () => {
  const preview = JSON.parse(await readFile(new URL("app/first-page-preview-manifest.json", root), "utf8"));
  assert.match(preview["/findings-docs/210-6aec96618242.pdf"], /dd71c2f4c45994ffd4106386dfd678652a4ad6db1f4e5a87a854668b6d9c9b95\.webp$/);
  const bundleSource = await readFile(new URL("app/bundled-public-assets.ts", root), "utf8");
  assert.match(bundleSource, /210-6aec96618242\.pdf/);
  const catalogSource = await readFile(new URL("app/catalog/catalog-data.ts", root), "utf8");
  assert.match(catalogSource, /category\.includes\("groundwater"\)/);
  const pageSource = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(pageSource, /State review flags possible road-brine effects at Plett Road wells/);
  assert.match(pageSource, /possibly attributable/i);
  assert.match(pageSource, /not PFAS evidence/);
  assert.match(pageSource, /not the City of Cadillac/);
});
