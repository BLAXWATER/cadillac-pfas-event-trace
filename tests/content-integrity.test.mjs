import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const appDirectory = path.join(root, "app");
const publicDirectory = path.join(root, "public");

async function loadCatalogs() {
  const files = (await readdir(appDirectory)).filter((name) => name.endsWith("-documents.json"));
  return Promise.all(files.map(async (name) => ({
    name,
    rows: JSON.parse(await readFile(path.join(appDirectory, name), "utf8")),
  })));
}

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(target) : [target];
  }));
  return nested.flat();
}

test("catalog records are unique and source metadata matches local files", async () => {
  const catalogs = await loadCatalogs();
  const allIds = new Set();
  const allUrls = new Set();
  const allHashes = new Set();
  let localFiles = 0;
  let externalFiles = 0;

  for (const catalog of catalogs) {
    assert.ok(catalog.rows.length > 0, `${catalog.name} is empty`);

    for (const row of catalog.rows) {
      assert.ok(row.id, `${catalog.name} contains a record without an id`);
      assert.ok(row.url, `${catalog.name}:${row.id} has no URL`);
      assert.ok(row.sha256, `${catalog.name}:${row.id} has no SHA-256 value`);
      assert.equal(allIds.has(row.id), false, `duplicate id: ${row.id}`);
      assert.equal(allUrls.has(row.url), false, `duplicate URL: ${row.url}`);
      assert.equal(allHashes.has(row.sha256), false, `duplicate content hash: ${row.sha256}`);
      allIds.add(row.id);
      allUrls.add(row.url);
      allHashes.add(row.sha256);

      if (row.url.startsWith("/")) {
        const sourcePath = path.join(publicDirectory, ...row.url.slice(1).split("/"));
        const sourceStat = await stat(sourcePath);
        const source = await readFile(sourcePath);
        assert.equal(sourceStat.size, row.size, `${catalog.name}:${row.id} size mismatch`);
        assert.equal(createHash("sha256").update(source).digest("hex"), row.sha256, `${catalog.name}:${row.id} hash mismatch`);
        localFiles += 1;
      } else {
        const url = new URL(row.url);
        assert.equal(url.protocol, "https:", `${catalog.name}:${row.id} is not HTTPS`);
        assert.equal(url.hostname, "github.com", `${catalog.name}:${row.id} uses an unexpected archive host`);
        assert.match(url.pathname, /^\/cazey43\/cadillac-pfas-event-trace\/blob\/[0-9a-f]{40}\//, `${catalog.name}:${row.id} is not pinned to a source commit`);
        externalFiles += 1;
      }
    }
  }

  assert.equal(localFiles, 644);
  assert.equal(externalFiles, 786);
});

test("every pinned GitHub source resolves to its recorded repository blob", async () => {
  const catalogs = await loadCatalogs();
  const specs = catalogs.flatMap((catalog) => catalog.rows)
    .filter((row) => row.url.startsWith("https://github.com/"))
    .map((row) => {
      const match = new URL(row.url).pathname.match(/^\/cazey43\/cadillac-pfas-event-trace\/blob\/([0-9a-f]{40})\/(.+)$/);
      assert.ok(match, `malformed pinned GitHub source: ${row.url}`);
      return `${match[1]}:${decodeURIComponent(match[2])}`;
    });

  const result = spawnSync("git", ["cat-file", "--batch-check"], {
    cwd: root,
    encoding: "utf8",
    input: `${specs.join("\n")}\n`,
  });
  assert.equal(result.status, 0, result.stderr);
  const lines = result.stdout.trim().split(/\r?\n/);
  assert.equal(lines.length, specs.length);
  for (const line of lines) {
    assert.doesNotMatch(line, / missing$/, `unresolved archived source: ${line}`);
    assert.match(line, / blob \d+$/, `archived source is not a blob: ${line}`);
  }
});

test("timeline source and preview assets are present", async () => {
  const source = await readFile(path.join(appDirectory, "page.tsx"), "utf8");
  assert.doesNotMatch(source, /Original file not loaded/);

  const literalReferences = [...source.matchAll(/(?:url|preview):\s*["'](\/[^"']+)["']/g)].map((match) => match[1]);
  for (const reference of literalReferences) {
    const target = path.join(publicDirectory, ...reference.slice(1).split("/"));
    assert.ok((await stat(target)).size > 0, `missing or empty timeline asset: ${reference}`);
  }

  const helperReferences = [...source.matchAll(/(?:ippSource|archivedSource)\(\s*"[^"]+"\s*,\s*"([^"]+\.pdf)"/gs)].map((match) => match[1]);
  for (const reference of helperReferences) {
    const fileName = new URL(reference).pathname.split("/").pop().replace(/\.pdf$/i, ".jpg");
    const preview = path.join(publicDirectory, "source-previews", fileName);
    assert.ok((await stat(preview)).size > 0, `missing or empty source preview: ${fileName}`);
  }

  assert.equal(helperReferences.length, 23);
});

test("site-wide search covers every evidence catalog", async () => {
  const catalogs = await loadCatalogs();
  const source = await readFile(path.join(appDirectory, "page.tsx"), "utf8");
  const recordCount = catalogs.reduce((total, catalog) => total + catalog.rows.length, 0);

  assert.equal(recordCount, 1430);
  assert.match(source, /id="record-search"/);
  assert.match(source, /Search all \{librarySearchRecords\.length\.toLocaleString\(\)\} records/);
  assert.match(source, /placeholder="Search all records/);
  for (const catalog of catalogs) {
    const variable = `${catalog.name.replace(/-documents\.json$/, "").replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}Documents`;
    assert.match(source, new RegExp(`documents: ${variable}\\b`), `${catalog.name} is missing from the site-wide search`);
  }
});

test("corpus OCR audit covers every record and leaves no verified duplicate", async () => {
  const catalogs = await loadCatalogs();
  const recordCount = catalogs.reduce((total, catalog) => total + catalog.rows.length, 0);
  const audit = JSON.parse(await readFile(path.join(appDirectory, "corpus-ocr-audit.json"), "utf8"));

  assert.equal(audit.stats.catalogRecords, recordCount);
  assert.equal(audit.stats.pdfRecords, 1304);
  assert.equal(audit.stats.pdfPages, 16711);
  assert.equal(audit.stats.imageRecords, 10);
  assert.equal(audit.stats.embeddedTextPages + audit.stats.ocrPages, audit.stats.pdfPages + audit.stats.imageRecords);
  assert.equal(audit.stats.hashFailures, 0);
  assert.equal(audit.stats.unreadableRecords, 0);
  assert.equal(audit.stats.pageCountFailures, 0);
  assert.equal(audit.stats.exactHashDuplicateGroups, 0);
  assert.equal(audit.stats.renderIdenticalByteDifferentGroups, 0);
  assert.equal(audit.manualReviewResolution.status, "visually-verified");
  assert.equal(audit.manualReviewResolution.pagesReviewed, audit.stats.manualReviewPages);
});

test("compliance archive audit preserves distinct records and excludes verified overlaps", async () => {
  const catalog = JSON.parse(await readFile(path.join(appDirectory, "compliance-documents.json"), "utf8"));
  const audit = JSON.parse(await readFile(path.join(appDirectory, "compliance-audit.json"), "utf8"));

  assert.equal(audit.stats.sourceFilesReviewed, 59);
  assert.equal(audit.stats.finalDistinctRecords, 52);
  assert.equal(catalog.length, audit.stats.finalDistinctRecords);
  assert.equal(audit.stats.exactDuplicateGroupsWithinSource, 0);
  assert.equal(audit.stats.renderIdenticalByteDifferentGroupsWithinSource, 0);
  assert.equal(audit.stats.crossCategoryCopiesReferencedElsewhere, 6);
  assert.equal(audit.stats.analystAuthoredReportsExcluded, 4);
  assert.equal(audit.stats.reviewedPages, 610);
  assert.equal(audit.stats.ocrPages, 283);
  assert.equal(audit.stats.latestAllDocsIntakeFiles, 23);
  assert.equal(audit.stats.latestAllDocsActualDuplicateCopiesSuppressed, 1);
  assert.equal(catalog.some((row) => /Truth-First|TruthFirst/i.test(row.name)), false);
  assert.equal(catalog.some((row) => /^(?:duplicate|copy)[-_ ]/i.test(row.name)), false);
});

test("correspondence archive audit preserves distinct records and reuses exact cross-category copies", async () => {
  const catalog = JSON.parse(await readFile(path.join(appDirectory, "correspondence-documents.json"), "utf8"));
  const audit = JSON.parse(await readFile(path.join(appDirectory, "correspondence-audit.json"), "utf8"));

  assert.equal(audit.stats.sourceFilesReviewed, 49);
  assert.equal(audit.stats.reviewedPages, 205);
  assert.equal(audit.stats.sourceOcrPages, 15);
  assert.equal(audit.stats.finalDistinctRecords, 35);
  assert.equal(catalog.length, audit.stats.finalDistinctRecords);
  assert.equal(audit.stats.crossCategoryCopiesReferencedElsewhere, 14);
  assert.equal(audit.stats.existingRecordMovedIntoCategory, 1);
  assert.equal(audit.stats.exactDuplicateGroupsWithinSource, 0);
  assert.equal(audit.stats.renderIdenticalByteDifferentGroupsWithinSource, 0);
  assert.equal(audit.stats.duplicateLabelsRemoved, 4);
  assert.equal(catalog.some((row) => /^(?:duplicates?|copy)[-_ ]/i.test(row.name)), false);
});

test("process and site archive audits every page and reuses only verified cross-category copies", async () => {
  const catalog = JSON.parse(await readFile(path.join(appDirectory, "process-site-documents.json"), "utf8"));
  const audit = JSON.parse(await readFile(path.join(appDirectory, "process-site-audit.json"), "utf8"));

  assert.equal(audit.stats.sourceFilesReviewed, 18);
  assert.equal(audit.stats.reviewedPages, 62);
  assert.equal(audit.stats.sourceOcrPages, 28);
  assert.equal(audit.stats.manuallyVerifiedMapAndAerialPages, 3);
  assert.equal(audit.stats.finalDistinctRecords, 15);
  assert.equal(catalog.length, audit.stats.finalDistinctRecords);
  assert.equal(audit.stats.crossCategoryCopiesReferencedElsewhere, 3);
  assert.equal(audit.stats.exactDuplicateGroupsWithinSource, 0);
  assert.equal(audit.stats.renderIdenticalByteDifferentGroupsWithinSource, 0);
  assert.equal(audit.stats.duplicateLikeLabelsRemoved, 3);
  assert.equal(catalog.some((row) => /~\d+|^(?:duplicates?|copy)[-_ ]/i.test(row.name)), false);
});

test("online form submissions retain real revisions and exclude only verified duplicate exports", async () => {
  const catalog = JSON.parse(await readFile(path.join(appDirectory, "form-submission-documents.json"), "utf8"));
  const audit = JSON.parse(await readFile(path.join(appDirectory, "form-submission-audit.json"), "utf8"));

  assert.equal(audit.stats.sourceFilesReviewed, 78);
  assert.equal(audit.stats.reviewedPages, 246);
  assert.equal(audit.stats.sourceOcrPages, 5);
  assert.equal(audit.stats.sourceOcrPagesWithText, 5);
  assert.equal(audit.stats.finalDistinctRecords, 73);
  assert.equal(catalog.length, audit.stats.finalDistinctRecords);
  assert.equal(audit.stats.actualDuplicateGroupsRemoved, 4);
  assert.equal(audit.stats.actualDuplicateFilesRemoved, 4);
  assert.equal(audit.stats.retainedMultiVersionSubmissionGroups, 14);
  assert.equal(audit.stats.publishedPages, 233);
  assert.equal(audit.stats.publishedOcrPages, 0);
  assert.equal(new Set(catalog.map((row) => row.sha256)).size, catalog.length);
  assert.equal(catalog.some((row) => /\(1\)|11 - Form Submissions|^PD-MWSX/i.test(row.name)), false);
  assert.equal(catalog.some((row) => row.name.includes("HPD-MWSX-Y48BC")), true);
});

test("Wexford archive OCRs every page and excludes only verified copies or non-primary derivatives", async () => {
  const catalog = JSON.parse(await readFile(path.join(appDirectory, "wexford-documents.json"), "utf8"));
  const audit = JSON.parse(await readFile(path.join(appDirectory, "wexford-audit.json"), "utf8"));

  assert.equal(audit.stats.sourceFilesReviewed, 114);
  assert.equal(audit.stats.sourcePagesAndImagesReviewed, 1688);
  assert.equal(audit.stats.sourceEmbeddedTextPages + audit.stats.sourceOcrPages, audit.stats.sourcePagesAndImagesReviewed);
  assert.equal(audit.stats.sourceOcrPagesWithText, 384);
  assert.equal(audit.stats.sourceManualReviewPages, 8);
  assert.equal(audit.stats.finalDistinctRecords, 103);
  assert.equal(catalog.length, audit.stats.finalDistinctRecords);
  assert.equal(audit.stats.recordsAddedThisPass, 84);
  assert.equal(audit.stats.exactExistingRecordsReused, 16);
  assert.equal(audit.stats.actualDuplicateGroupsRemoved, 5);
  assert.equal(audit.stats.actualDuplicateFilesRemoved, 5);
  assert.equal(audit.stats.nonPrimaryRecordsExcluded, 9);
  assert.equal(audit.stats.duplicateLikeLabelsRemoved, 12);
  assert.equal(audit.stats.publishedPages, 1591);
  assert.equal(audit.stats.latestRepeatIntakeFilesReviewed, 42);
  assert.equal(audit.stats.latestRepeatIntakePagesReviewed, 230);
  assert.equal(audit.stats.latestRepeatIntakeDistinctContentHashes, 41);
  assert.equal(audit.stats.latestRepeatIntakeDistinctContentPages, 200);
  assert.equal(audit.stats.latestRepeatIntakeExactExistingFileMatches, 42);
  assert.equal(audit.stats.latestRepeatIntakeIntraBatchDuplicateFiles, 1);
  assert.equal(audit.stats.latestRepeatIntakeRecordsAdded, 0);
  assert.equal(new Set(catalog.map((row) => row.sha256)).size, catalog.length);
  assert.equal(catalog.some((row) => /Truth-First|TruthFirst/i.test(row.name)), false);
  assert.equal(catalog.some((row) => /^(?:duplicates?|copy)[-_ ]|~\d+|\(copy\s*\d+\)/i.test(row.name)), false);
  assert.equal(catalog.some((row) => /rev(?:ision)?\.?\s*1|_v2|version\s*2/i.test(row.name)), true);
});

test("local public assets contain no byte-identical redundant copies", async () => {
  const files = await walkFiles(publicDirectory);
  const byHash = new Map();
  for (const file of files) {
    const source = await readFile(file);
    const hash = createHash("sha256").update(source).digest("hex");
    assert.equal(byHash.has(hash), false, `duplicate local assets: ${byHash.get(hash)} and ${file}`);
    byHash.set(hash, file);
  }
});

test("PFAS archive audit and repaired J19915 source remain consistent", async () => {
  const catalog = JSON.parse(await readFile(path.join(appDirectory, "pfas-documents.json"), "utf8"));
  const audit = JSON.parse(await readFile(path.join(appDirectory, "pfas-audit.json"), "utf8"));
  assert.equal(catalog.length, audit.stats.newDistinctRecords);
  assert.equal(audit.stats.suppliedFiles, 108);
  assert.equal(audit.stats.finalDistinctRecords, 104);
  assert.equal(audit.stats.duplicateCopiesSuppressed, 4);
  assert.equal(audit.stats.ocrReviewedPages, 192);
  assert.equal(catalog.some((row) => /PENDING/.test(row.url)), false);
  assert.equal(catalog.some((row) => /SUPERSEDED|duplicate/i.test(row.name)), false);

  const repairedSource = await readFile(path.join(publicDirectory, "docs", "2019-06-04-j19915-effluent.pdf"));
  assert.equal(
    createHash("sha256").update(repairedSource).digest("hex"),
    "47929ba9f41a9dcd5f3d5d3b9a5d5f63dbb3fcbc5b00dc74e81a0d550e8666fd",
  );
});

test("August 28 archive intake distinguishes exact copies from evidentiary exclusions", async () => {
  const pfasCatalog = JSON.parse(await readFile(path.join(appDirectory, "pfas-documents.json"), "utf8"));
  const supplementalCatalog = JSON.parse(await readFile(path.join(appDirectory, "supplemental-documents.json"), "utf8"));
  const pfasAudit = JSON.parse(await readFile(path.join(appDirectory, "pfas-audit.json"), "utf8"));
  const supplementalAudit = JSON.parse(await readFile(path.join(appDirectory, "supplemental-audit.json"), "utf8"));
  const intakeAudit = JSON.parse(await readFile(path.join(appDirectory, "archive-intake-audit.json"), "utf8"));
  const dumpAudit = JSON.parse(await readFile(path.join(appDirectory, "dump-intake-audit.json"), "utf8"));

  assert.equal(pfasCatalog.length, 97);
  assert.equal(supplementalCatalog.length, 81);
  assert.equal(pfasCatalog.length, pfasAudit.stats.newDistinctRecords);
  assert.equal(supplementalCatalog.length, supplementalAudit.stats.newDistinctRecords);
  assert.equal(supplementalAudit.stats.latestCategory1819RepeatFilesReviewed, 12);
  assert.equal(supplementalAudit.stats.latestCategory1819RepeatPagesReviewed, 179);
  assert.equal(supplementalAudit.stats.latestCategory1819RepeatDistinctInputHashes, 12);
  assert.equal(supplementalAudit.stats.latestCategory1819RepeatExactExistingFileMatches, 11);
  assert.equal(supplementalAudit.stats.latestCategory1819RepeatSameContentDerivatives, 1);
  assert.equal(supplementalAudit.stats.latestCategory1819RepeatRecordsAdded, 0);
  assert.equal(intakeAudit.stats.sourceRecords, 408);
  assert.equal(intakeAudit.stats.pdfs, 404);
  assert.equal(intakeAudit.stats.pdfPages, 13685);
  assert.equal(intakeAudit.stats.ocrRequiredPages, 2615);
  assert.equal(intakeAudit.stats.ocrPagesWithText, 2553);
  assert.equal(intakeAudit.stats.renderedManualReviewPages, 88);
  assert.equal(intakeAudit.stats.manifestHashMismatches, 0);
  assert.equal(intakeAudit.stats.newDistinctRecords, 54);
  assert.equal(intakeAudit.stats.exactExistingRecordsReused, 1);
  assert.equal(intakeAudit.stats.exactIntraBatchCopiesSuppressed, 1);
  assert.equal(intakeAudit.stats.outOfScopeIncidentalOrOverlappingExcluded, 352);
  assert.equal(dumpAudit.stats.namedPdfFiles, 49);
  assert.equal(dumpAudit.stats.pdfPages, 321);
  assert.equal(dumpAudit.stats.ocrPages, 38);
  assert.equal(dumpAudit.stats.ocrPagesWithText, 38);
  assert.equal(dumpAudit.stats.manualReviewPages, 0);
  assert.equal(dumpAudit.stats.newDistinctRecords, 5);
  assert.equal(dumpAudit.stats.existingCanonicalRecordsReplaced, 1);
  assert.equal(dumpAudit.stats.supersededDefectiveDerivativesSuppressed, 1);
  assert.equal(pfasCatalog.some((row) => /duplicate/i.test(row.name)), false);
  assert.equal(supplementalCatalog.some((row) => /duplicate/i.test(row.name)), false);
  assert.equal(
    supplementalCatalog.some((row) => row.sha256 === "8659ed67102c60eb9b887b6f5428fc799ffca1390fe1be81ed6ac57ff6d93845" && row.type === "City council minutes"),
    true,
  );
  assert.equal(
    supplementalCatalog.some((row) => row.sha256 === "2409802144f6cea6c6ec3605f556615b2bb0b86baed036302322f39e1ee4d5d4" && row.type === "Safety data sheet"),
    true,
  );
  assert.equal(
    supplementalCatalog.some((row) => row.sha256 === "1362c773fc5ea8067730a5c6084705e2ac52ddc4ca70ce14994a96f9675e39a2" && row.type === "County board packet"),
    true,
  );
  assert.equal(
    supplementalCatalog.filter((row) => row.category === "Research & technical literature" && row.type === "Peer-reviewed research article").length,
    7,
  );
});

test("biosolids archive audit preserves distinct records and suppresses only verified copies", async () => {
  const catalog = JSON.parse(await readFile(path.join(appDirectory, "biosolids-documents.json"), "utf8"));
  const audit = JSON.parse(await readFile(path.join(appDirectory, "biosolids-audit.json"), "utf8"));
  assert.equal(catalog.length, audit.stats.newDistinctRecords);
  assert.equal(audit.stats.suppliedFiles, 215);
  assert.equal(audit.stats.suppliedPdfPages, 1624);
  assert.equal(audit.stats.finalDistinctRecords, 213);
  assert.equal(audit.stats.existingRecordsReused, 3);
  assert.equal(audit.stats.duplicateCopiesSuppressed, 2);
  assert.equal(audit.stats.ocrPagesAttempted, 263);
  assert.equal(audit.stats.visuallyFingerprintedPages, 1624);
  assert.equal(catalog.some((row) => /PENDING/.test(row.url)), false);
  assert.equal(catalog.some((row) => /duplicate/i.test(row.name)), false);
  assert.equal(catalog.filter((row) => row.type === "Incident / spill note").length, 1);
  assert.equal(catalog.some((row) => /22,000 Gallons/i.test(row.name)), true);
});

test("laboratory archive audit preserves revisions and suppresses only verified wrapper copies", async () => {
  const catalog = JSON.parse(await readFile(path.join(appDirectory, "lab-documents.json"), "utf8"));
  const audit = JSON.parse(await readFile(path.join(appDirectory, "lab-audit.json"), "utf8"));
  assert.equal(catalog.length, audit.stats.newDistinctRecords);
  assert.equal(audit.stats.suppliedFiles, 100);
  assert.equal(audit.stats.suppliedPdfPages, 1401);
  assert.equal(audit.stats.finalDistinctRecords, 98);
  assert.equal(audit.stats.existingRecordsReused, 8);
  assert.equal(audit.stats.duplicateCopiesSuppressed, 2);
  assert.equal(audit.stats.ocrPagesAttempted, 75);
  assert.equal(audit.stats.visuallyFingerprintedPages, 1401);
  assert.equal(catalog.some((row) => /PENDING/.test(row.url)), false);
  assert.equal(catalog.some((row) => /^Duplicates_| \(copy \d+\)|~\d+/i.test(row.name)), false);
  assert.equal(catalog.filter((row) => /AMR\.Trace(?:\.rev)?\.pdf$/i.test(row.name)).length, 6);
  assert.equal(catalog.some((row) => /Portfolio with Embedded Report/i.test(row.name)), false);
});
