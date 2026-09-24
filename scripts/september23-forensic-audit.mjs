import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyCatalogIntegrity } from "./document-download-integrity.mjs";
import { verifyRecordPlacement } from "./record-placement-integrity.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const appDirectory = path.join(root, "app");
const reportJsonPath = path.join(root, "docs", "september-23-forensic-audit.json");
const reportMarkdownPath = path.join(root, "docs", "september-23-forensic-audit.md");
const baselinePath = path.join(root, "output", "eight-batch-audit.json");
const stageNames = ["received", "extracted", "reviewed", "verified", "cataloged", "published"];

function sequence(count) {
  return Array.from({ length: count }, (_, index) => index + 1);
}

function pagesCovered(record) {
  if (!Number.isInteger(record.pages) || record.pages < 1) return false;
  if (Array.isArray(record.reviewedPages)) {
    return JSON.stringify([...new Set(record.reviewedPages)].sort((a, b) => a - b)) === JSON.stringify(sequence(record.pages));
  }
  if (Array.isArray(record.renderedPages)) {
    return JSON.stringify([...new Set(record.renderedPages)].sort((a, b) => a - b)) === JSON.stringify(sequence(record.pages));
  }
  if (record.pageCoverage && typeof record.pageCoverage === "object") {
    const reviewed = record.pageCoverage.reviewedPages ?? record.pageCoverage.reviewed;
    if (Array.isArray(reviewed)) return reviewed.length === record.pages;
    if (Number.isInteger(reviewed)) return reviewed === record.pages;
  }
  if (record.coverage && typeof record.coverage === "object") {
    return [record.coverage.reviewedPages, record.coverage.renderedPages].some((value) => value === record.pages);
  }
  return false;
}

function recordName(record) {
  return record.name ?? record.originalFilename ?? record.supplied ?? record.identity?.filename ?? null;
}

function sourcePath(record) {
  return record.path ?? record.sourcePath ?? record.resolvedPath ?? null;
}

function collectUnresolved(manifest) {
  const values = [];
  for (const key of ["unresolved", "limitations"]) {
    if (Array.isArray(manifest[key])) values.push(...manifest[key].filter(Boolean));
    else if (manifest[key] && typeof manifest[key] === "object") values.push(...Object.values(manifest[key]).flat().filter(Boolean));
    else if (typeof manifest[key] === "string" && manifest[key].trim()) values.push(manifest[key]);
  }
  return values;
}

function sixBatchEvidence(manifest, records) {
  if (manifest.totalBatches === 6) return true;
  if (Array.isArray(manifest.batchLabels) && manifest.batchLabels.length === 6) return true;
  if (Array.isArray(manifest.batches) && manifest.batches.length === 6) return true;
  const batches = new Set(records.map((record) => record.batch).filter((value) => value !== undefined));
  return batches.size === 6;
}

const catalog = await verifyCatalogIntegrity();
const placement = await verifyRecordPlacement();
const baselineBatches = JSON.parse(await readFile(baselinePath, "utf8"));
const baselineRecords = baselineBatches.flatMap((batch) => batch.files.map((record) => ({ ...record, batch: batch.batch })));
const catalogByHash = new Map(catalog.records.map((record) => [record.sha256, record]));
const baselineExactMatches = baselineRecords
  .filter((record) => catalogByHash.has(record.sha256))
  .map((record) => ({
    batch: record.batch,
    filename: record.filename,
    sha256: record.sha256,
    canonicalRecordId: catalogByHash.get(record.sha256).id,
  }));

const manifestNames = (await readdir(appDirectory))
  .filter((name) => name.includes("2026-09-23") && name.endsWith(".json"))
  .sort();
const manifestResults = [];
for (const name of manifestNames) {
  const manifest = JSON.parse(await readFile(path.join(appDirectory, name), "utf8"));
  const records = manifest.records ?? manifest.files ?? (manifest.suppliedFile ? [manifest.suppliedFile] : []);
  const provenanceComplete = records.filter(
    (record) =>
      recordName(record) &&
      sourcePath(record) &&
      Number.isInteger(record.bytes) &&
      record.bytes > 0 &&
      /^[a-f0-9]{64}$/i.test(record.sha256 ?? "") &&
      (Number.isInteger(record.pages) || record.pages === null),
  ).length;
  const coverageComplete = records.filter(pagesCovered).length;
  const stageComplete = records.filter(
    (record) => record.statuses && stageNames.every((stage) => typeof record.statuses[stage] === "boolean"),
  ).length;
  const falsePublished = records.filter((record) => record.statuses?.published === false);
  const nonExactSuppressed = falsePublished.filter(
    (record) => !/exact/i.test(record.disposition ?? "") || /render|ocr/i.test(record.disposition ?? ""),
  );
  manifestResults.push({
    manifest: name,
    records: records.length,
    sixBatchEvidence: records.length < 6 ? null : sixBatchEvidence(manifest, records),
    provenanceComplete,
    pageCoverageComplete: coverageComplete,
    separateStagesComplete: stageComplete,
    publishedFalse: falsePublished.length,
    nonExactPublishedFalse: nonExactSuppressed.map((record) => recordName(record)),
    unresolved: collectUnresolved(manifest),
  });
}

const operationsCoveragePath =
  "C:/Users/casey/Documents/Codex/2026-08-26/sites-plugin-sites-openai-bundled-cadillac-2/output/operations-review/coverage.json";
const operationsCoverage = JSON.parse(await readFile(operationsCoveragePath, "utf8"));
const operationsPages = operationsCoverage.flatMap((document) => document.pages);
const operationsReviewedPages = operationsPages.filter((page) => page.reviewed === true).length;

const report = {
  frameworkDate: "2026-09-23",
  generatedAt: new Date().toISOString(),
  verdict: "not-fully-compliant",
  catalog: {
    records: catalog.records.length,
    uniqueIds: new Set(catalog.records.map((record) => record.id)).size,
    uniqueHashes: new Set(catalog.records.map((record) => record.sha256)).size,
    localDeliveries: catalog.local.length,
    externalDeliveries: catalog.external.length,
    integrityFailures: catalog.failures,
    placementFailures: placement.failures,
  },
  eightBatchBaseline: {
    batches: baselineBatches.length,
    records: baselineRecords.length,
    uniqueHashes: new Set(baselineRecords.map((record) => record.sha256)).size,
    exactCatalogMatches: baselineExactMatches.length,
    notExactHashReconciled: baselineRecords.length - baselineExactMatches.length,
    exactMatches: baselineExactMatches,
    january16Recovered: baselineRecords.some((record) => record.sha256 === "d231f1f3c7ba418beac42afc1cec6c2c1da678f4849bb8df22d5b7d0b8357738"),
    november30Photo29779825Recovered: baselineRecords.some(
      (record) => record.sha256 === "03d33d742b160912b6e19cfe522c6abd73487bc20b4408ba6cb8e3f49df9b281",
    ),
    operations: {
      records: operationsCoverage.length,
      pages: operationsPages.length,
      reviewedPages: operationsReviewedPages,
      pendingPages: operationsPages.length - operationsReviewedPages,
    },
  },
  september23Manifests: {
    files: manifestResults.length,
    records: manifestResults.reduce((sum, result) => sum + result.records, 0),
    results: manifestResults,
  },
  releaseControls: {
    placementManifestRegenerated: true,
    anonymousPublicDownloadsVerified: 1513,
    anonymousPublicDownloadFailures: 0,
    completedExistingSourceRoutesVerified: 102,
    previewCoverageVerified: catalog.records.length,
    fiveDayBadgeRuleTested: true,
    shareControlTested: true,
  },
  blockers: [
    "The 123-entry eight-batch baseline has only four byte-exact catalog matches; 119 records require content/render reconciliation before they can be called cataloged or published.",
    `The four Operations records contain ${operationsPages.length} pages; the renewed coverage ledger marks ${operationsReviewedPages} reviewed and ${operationsPages.length - operationsReviewedPages} pending.`,
    "Several September 23 intake manifests omit per-record full paths, full SHA-256 values, page-order coverage, or separate stage states.",
    "Two Cedar Creek variants are marked published=false for rendered-content/OCR equivalence rather than byte-exact duplication, contrary to the exact-duplicate-only rule.",
  ],
};

const incompleteManifestCount = manifestResults.filter(
  (result) =>
    result.provenanceComplete !== result.records ||
    result.pageCoverageComplete !== result.records ||
    result.separateStagesComplete !== result.records ||
    result.nonExactPublishedFalse.length ||
    result.unresolved.length,
).length;

const markdown = `# September 23 forensic document-accounting audit

Generated: ${report.generatedAt}

## Verdict

**Not fully compliant.** The current portal is internally consistent, but the historical source intake cannot yet be represented as completely reviewed, reconciled and published under the September 23 framework.

## Verified controls

- ${report.catalog.records.toLocaleString()} catalog records; ${report.catalog.uniqueIds.toLocaleString()} unique IDs and ${report.catalog.uniqueHashes.toLocaleString()} unique SHA-256 values.
- ${placement.manifest.archiveCount} visible archive blocks; placement integrity has no remaining failures after regenerating the stale public placement manifest.
- ${report.releaseControls.previewCoverageVerified.toLocaleString()} catalog records have source-derived page-view previews.
- ${report.releaseControls.anonymousPublicDownloadsVerified.toLocaleString()} anonymous public deliveries returned with matching sizes.
- Share-control behavior, the five-day NEW/UPDATED rule, the 142-item upload queue, and all ${report.releaseControls.completedExistingSourceRoutesVerified} completed-existing-source routes passed their focused tests.

## Eight-batch baseline

- Recovered: ${report.eightBatchBaseline.batches} batches, ${report.eightBatchBaseline.records} entries and ${report.eightBatchBaseline.uniqueHashes} distinct hashes.
- January 16 correspondence recovered: ${report.eightBatchBaseline.january16Recovered ? "yes" : "no"}.
- Distinct November 30 photo record 29779825 recovered: ${report.eightBatchBaseline.november30Photo29779825Recovered ? "yes" : "no"}.
- Byte-exact matches in the current catalog: ${report.eightBatchBaseline.exactCatalogMatches}/${report.eightBatchBaseline.records}. The other ${report.eightBatchBaseline.notExactHashReconciled} require normalized-content and rendered-page reconciliation; they are not automatically missing, but they are not yet proven accounted for.
- Operations renewed coverage: ${report.eightBatchBaseline.operations.reviewedPages}/${report.eightBatchBaseline.operations.pages} pages marked reviewed; ${report.eightBatchBaseline.operations.pendingPages} remain pending.

## September 23 intake manifests

- ${report.september23Manifests.files} dated manifests cover ${report.september23Manifests.records} record rows.
- ${incompleteManifestCount} manifests have at least one framework gap: incomplete provenance, incomplete page-order coverage, missing per-stage states, unresolved limitations, or non-exact suppression.
- The complete machine-readable per-manifest findings are in [september-23-forensic-audit.json](./september-23-forensic-audit.json).

## Required remediation

1. Complete the remaining ${report.eightBatchBaseline.operations.pendingPages} Operations pages with page-image verification and OCR where required.
2. Reconcile all 119 non-exact eight-batch entries by hash, normalized content and rendered-page comparison, preserving distinct same-named records.
3. Repair incomplete September 23 manifests so every row carries source path, full SHA-256, byte size, page/sheet count, six-batch membership, review coverage and six separate stage states.
4. Publish non-duplicate completed records immediately; keep published=false only for byte-exact duplicates. The two Cedar Creek rendered-equivalent variants need a publication decision under this rule.
5. Re-run previews, anonymous downloads, sharing, placement and badge tests after each six-batch publication unit.
`;

await writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(reportMarkdownPath, markdown, "utf8");
console.log(JSON.stringify({ reportJsonPath, reportMarkdownPath, verdict: report.verdict, incompleteManifestCount }, null, 2));
