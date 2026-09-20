import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("Muskegon plan is fully reviewed and conservatively cataloged", async () => {
  const supplemental = JSON.parse(await readFile(new URL("app/supplemental-documents.json", root), "utf8"));
  const record = supplemental.find((row) => row.id === "209-781d1714fe06");
  assert.ok(record);
  assert.equal(record.pages, 449);
  assert.equal(record.size, 50690086);
  assert.equal(record.sha256, "781d1714fe069941098f928cf15fb58fe2678e36d5495b92a36d5fbe18249d5e");
  assert.equal(record.url, "https://mrwa.org/wp-content/uploads/repository/MuskegonManagementPlan.pdf");
  assert.equal(record.officialSource, true);
  assert.match(record.description, /no PFAS testing/i);
  assert.match(record.description, /does not identify exact locations, sources or causes/i);

  const audit = JSON.parse(await readFile(new URL("app/muskegon-management-plan-intake-audit.json", root), "utf8"));
  assert.equal(audit.reviewCoverage.pageReview.length, 449);
  assert.deepEqual(audit.reviewCoverage.pageReview.map((row) => row.page), Array.from({ length: 449 }, (_, index) => index + 1));
  assert.ok(audit.reviewCoverage.pageReview.every((row) => row.renderedReview === "reviewed"));
  assert.equal(audit.reviewCoverage.pageReview.filter((row) => row.ocr === "performed-and-visually-checked").length, 53);
  assert.equal(audit.status.received, true);
  assert.equal(audit.status.extracted, true);
  assert.equal(audit.status.reviewed, true);
  assert.equal(audit.status.verified, true);
  assert.equal(audit.status.published, true);
  assert.equal(audit.status.publishedUrl, "https://cadillac-pfas-event-trace.icons-7120.chatgpt.site");
  assert.equal(audit.status.firstPublishedSitesVersion, 284);
});

test("Muskegon plan appears in Groundwater and Reference catalogs with a local preview", async () => {
  const catalogSource = await readFile(new URL("app/catalog/catalog-data.ts", root), "utf8");
  const pageSource = await readFile(new URL("app/page.tsx", root), "utf8");
  const cardSource = await readFile(new URL("app/catalog/CatalogPageClient.tsx", root), "utf8");
  assert.match(catalogSource, /category\.includes\("groundwater"\) \|\| category\.includes\("watershed"\)/);
  assert.match(catalogSource, /Watershed management plan and hydrologic reference/);
  assert.match(pageSource, /document\.preview \? bundledPublicAsset\(document\.preview\)/);
  assert.match(cardSource, /record\.preview \? bundledPublicAsset\(record\.preview\)/);
});

test("Muskegon plan has a conservative five-point front-page key finding", async () => {
  const pageSource = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(pageSource, /id="muskegon-finding-title"/);
  assert.match(pageSource, /2002 Muskegon River Watershed Management Plan/);
  assert.match(pageSource, /Cadillac watershed setting/);
  assert.match(pageSource, /Regional groundwater framework/);
  assert.match(pageSource, /Clam River flow context/);
  assert.match(pageSource, /Historical WWTP finding/);
  assert.match(pageSource, /No Plett Road pathway finding/);
  assert.match(pageSource, /contains no PFAS testing and does not establish a Plett Road WWTP pathway/);
});
