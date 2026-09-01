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
        assert.match(url.pathname, /^\/(?:cazey43|BLAXWATER)\/cadillac-pfas-event-trace\/blob\/[0-9a-f]{40}\//, `${catalog.name}:${row.id} is not pinned to a source commit`);
        externalFiles += 1;
      }
    }
  }

  assert.equal(localFiles, 676);
  assert.equal(externalFiles, 840);
});

test("every pinned GitHub source resolves to its recorded repository blob", async () => {
  const catalogs = await loadCatalogs();
  const specs = catalogs.flatMap((catalog) => catalog.rows)
    .filter((row) => row.url.startsWith("https://github.com/"))
    .map((row) => {
      const match = new URL(row.url).pathname.match(/^\/(?:cazey43|BLAXWATER)\/cadillac-pfas-event-trace\/blob\/([0-9a-f]{40})\/(.+)$/);
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
    const fileName = new URL(reference, "https://local.invalid").pathname.split("/").pop().replace(/\.pdf$/i, ".jpg");
    const preview = path.join(publicDirectory, "source-previews", fileName);
    assert.ok((await stat(preview)).size > 0, `missing or empty source preview: ${fileName}`);
  }

  const restoredPermitPaths = [
    "docs/2016-09-06-rule-2210-final.pdf",
    "previews/2016-09-06-rule-2210-final.jpg",
    "optimized-previews/2016-09-06-rule-2210-final.webp",
  ];
  for (const reference of restoredPermitPaths) {
    assert.ok((await stat(path.join(publicDirectory, reference))).size > 0, `missing or empty restored permit asset: ${reference}`);
  }
  const restoredPermit = await readFile(path.join(publicDirectory, restoredPermitPaths[0]));
  assert.equal(createHash("sha256").update(restoredPermit).digest("hex"), "38c4dd289771ab2109af0cf4a8ac198c69e58432d076683732ba20c68a9618be");
  const restoredPermitPages = await readdir(path.join(publicDirectory, "document-pages", "2016-09-06-rule-2210-final"));
  assert.deepEqual(restoredPermitPages.sort(), Array.from({ length: 26 }, (_, index) => `${String(index + 1).padStart(2, "0")}.webp`));

  assert.equal(helperReferences.length, 59);

  const timelinePdfSlugs = [...source.matchAll(/\bpdf\(\s*"[^"]+"\s*,\s*"([^"]+)"/gs)].map((match) => match[1]);
  for (const slug of timelinePdfSlugs) {
    const preview = path.join(publicDirectory, "previews", `${slug}.jpg`);
    const optimizedPreview = path.join(publicDirectory, "optimized-previews", `${slug}.webp`);
    assert.ok((await stat(preview)).size > 0, `missing or empty timeline PDF preview: ${slug}.jpg`);
    assert.ok((await stat(optimizedPreview)).size > 0, `missing or empty optimized timeline PDF preview: ${slug}.webp`);
  }
});

test("site-wide search covers every evidence catalog", async () => {
  const catalogs = await loadCatalogs();
  const source = await readFile(path.join(appDirectory, "page.tsx"), "utf8");
  const recordCount = catalogs.reduce((total, catalog) => total + catalog.rows.length, 0);

  assert.equal(recordCount, 1516);
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
  const catalogFingerprint = createHash("sha256").update(
    catalogs.flatMap((catalog) => catalog.rows.map((row) => [
      catalog.name,
      row.id ?? "",
      row.url ?? "",
      row.size ?? "",
      (row.sha256 ?? "").toLowerCase(),
    ].join("\t"))).sort().join("\n"),
  ).digest("hex");

  assert.equal(audit.stats.catalogRecords, recordCount);
  assert.equal(audit.stats.verifiedRecords, recordCount);
  assert.equal(audit.catalogFingerprint, catalogFingerprint);
  assert.equal(audit.stats.pdfRecords, 1387);
  assert.equal(audit.stats.pdfPages, 19517);
  assert.equal(audit.stats.imageRecords, 13);
  assert.equal(audit.stats.embeddedTextPages + audit.stats.ocrPages, audit.stats.pdfPages + audit.stats.imageRecords);
  assert.equal(audit.stats.missingHashes, 0);
  assert.equal(audit.stats.hashFailures, 0);
  assert.equal(audit.stats.sizeFailures, 0);
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

  assert.equal(audit.stats.sourceFilesReviewed, 115);
  assert.equal(audit.stats.finalDistinctRecords, 61);
  assert.equal(catalog.length, audit.stats.finalDistinctRecords);
  assert.equal(audit.stats.exactDuplicateGroupsWithinSource, 0);
  assert.equal(audit.stats.renderIdenticalByteDifferentGroupsWithinSource, 0);
  assert.equal(audit.stats.crossCategoryCopiesReferencedElsewhere, 6);
  assert.equal(audit.stats.analystAuthoredReportsExcluded, 4);
  assert.equal(audit.stats.reviewedPages, 721);
  assert.equal(audit.stats.ocrPages, 308);
  assert.equal(audit.stats.latestAllDocsIntakeFiles, 23);
  assert.equal(audit.stats.latestAllDocsActualDuplicateCopiesSuppressed, 1);
  assert.equal(audit.stats.latestDropboxIntakeFiles, 50);
  assert.equal(audit.stats.latestDropboxExactExistingRecords, 47);
  assert.equal(audit.stats.latestDropboxActualDuplicateCopiesSuppressed, 47);
  assert.equal(audit.stats.latestDropboxNewComplianceRecords, 3);
  assert.equal(catalog.some((row) => /Truth-First|TruthFirst/i.test(row.name)), false);
  assert.equal(catalog.some((row) => /^(?:duplicate|copy)[-_ ]/i.test(row.name)), false);
});

test("correspondence archive audit preserves distinct records and reuses exact cross-category copies", async () => {
  const catalog = JSON.parse(await readFile(path.join(appDirectory, "correspondence-documents.json"), "utf8"));
  const audit = JSON.parse(await readFile(path.join(appDirectory, "correspondence-audit.json"), "utf8"));

  assert.equal(audit.stats.sourceFilesReviewed, 51);
  assert.equal(audit.stats.reviewedPages, 247);
  assert.equal(audit.stats.sourceOcrPages, 23);
  assert.equal(audit.stats.finalDistinctRecords, 42);
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

  assert.equal(audit.stats.sourceFilesReviewed, 24);
  assert.equal(audit.stats.reviewedPages, 78);
  assert.equal(audit.stats.sourceOcrPages, 28);
  assert.equal(audit.stats.manuallyVerifiedMapAndAerialPages, 4);
  assert.equal(audit.stats.finalDistinctRecords, 17);
  assert.equal(catalog.length, audit.stats.finalDistinctRecords);
  assert.equal(audit.stats.crossCategoryCopiesReferencedElsewhere, 3);
  assert.equal(audit.stats.exactDuplicateGroupsWithinSource, 0);
  assert.equal(audit.stats.renderIdenticalByteDifferentGroupsWithinSource, 4);
  assert.equal(audit.stats.matchingSourceFilesPreserved, 4);
  assert.equal(audit.stats.matchingSourcePagesPreserved, 12);
  assert.equal(audit.stats.duplicateLikeLabelsRemoved, 3);
  assert.equal(catalog.some((row) => /~\d+|^(?:duplicates?|copy)[-_ ]/i.test(row.name)), false);

  const matchingSources = catalog.flatMap((row) => row.matchingSources ?? []);
  assert.equal(matchingSources.length, 4);
  for (const source of matchingSources) {
    const relativeSourcePath = source.url.startsWith("/")
      ? source.url.slice(1)
      : decodeURIComponent(new URL(source.url).pathname.split("/public/")[1] ?? "");
    assert.ok(relativeSourcePath, `${source.name} must resolve inside the repository public directory`);
    const sourcePath = path.join(publicDirectory, ...relativeSourcePath.split("/"));
    const sourceStat = await stat(sourcePath);
    const sourceBytes = await readFile(sourcePath);
    assert.equal(sourceStat.size, source.size, `${source.name} size mismatch`);
    assert.equal(createHash("sha256").update(sourceBytes).digest("hex"), source.sha256, `${source.name} hash mismatch`);
  }
});

test("online form submissions retain real revisions and exclude only verified duplicate exports", async () => {
  const catalog = JSON.parse(await readFile(path.join(appDirectory, "form-submission-documents.json"), "utf8"));
  const audit = JSON.parse(await readFile(path.join(appDirectory, "form-submission-audit.json"), "utf8"));

  assert.equal(audit.stats.sourceFilesReviewed, 80);
  assert.equal(audit.stats.reviewedPages, 250);
  assert.equal(audit.stats.sourceOcrPages, 5);
  assert.equal(audit.stats.sourceOcrPagesWithText, 5);
  assert.equal(audit.stats.finalDistinctRecords, 75);
  assert.equal(catalog.length, audit.stats.finalDistinctRecords);
  assert.equal(audit.stats.actualDuplicateGroupsRemoved, 4);
  assert.equal(audit.stats.actualDuplicateFilesRemoved, 4);
  assert.equal(audit.stats.retainedMultiVersionSubmissionGroups, 14);
  assert.equal(audit.stats.publishedPages, 237);
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
  assert.equal(supplementalCatalog.length, 144);
  assert.equal(pfasCatalog.length, pfasAudit.stats.newDistinctRecords);
  assert.equal(supplementalCatalog.length, supplementalAudit.stats.newDistinctRecords);
  assert.equal(supplementalAudit.stats.latestCategory1819RepeatFilesReviewed, 12);
  assert.equal(supplementalAudit.stats.latestCategory1819RepeatPagesReviewed, 179);
  assert.equal(supplementalAudit.stats.latestCategory1819RepeatDistinctInputHashes, 12);
  assert.equal(supplementalAudit.stats.latestCategory1819RepeatExactExistingFileMatches, 11);
  assert.equal(supplementalAudit.stats.latestCategory1819RepeatSameContentDerivatives, 1);
  assert.equal(supplementalAudit.stats.latestCategory1819RepeatRecordsAdded, 0);
  assert.equal(supplementalAudit.stats.latestGroundwaterFlowFilesReviewed, 2);
  assert.equal(supplementalAudit.stats.latestGroundwaterFlowPagesReviewed, 48);
  assert.equal(supplementalAudit.stats.latestGroundwaterFlowDistinctInputHashes, 2);
  assert.equal(supplementalAudit.stats.latestGroundwaterFlowCanonicalCopyMatches, 1);
  assert.equal(supplementalAudit.stats.latestGroundwaterFlowDistinctOfficialEditions, 2);
  assert.equal(supplementalAudit.stats.latestGroundwaterFlowRecordsAdded, 2);
  assert.equal(supplementalAudit.stats.latestWWTPBatchFilesReviewed, 94);
  assert.equal(supplementalAudit.stats.latestWWTPBatchPdfPagesReviewed, 3158);
  assert.equal(supplementalAudit.stats.latestWWTPBatchImagesReviewed, 3);
  assert.equal(supplementalAudit.stats.latestWWTPBatchOCRPages, 248);
  assert.equal(supplementalAudit.stats.latestWWTPBatchOCRPagesWithText, 235);
  assert.equal(supplementalAudit.stats.latestWWTPBatchExactExistingRecords, 33);
  assert.equal(supplementalAudit.stats.latestWWTPBatchSameContentDerivatives, 3);
  assert.equal(supplementalAudit.stats.latestWWTPBatchOutOfScopeRecords, 10);
  assert.equal(supplementalAudit.stats.latestWWTPBatchRecordsAdded, 48);
  assert.equal(supplementalAudit.stats.latestWexfordLeachateBatchFilesReviewed, 25);
  assert.equal(supplementalAudit.stats.latestWexfordLeachateBatchPagesReviewed, 207);
  assert.equal(supplementalAudit.stats.latestWexfordLeachateBatchOCRPages, 74);
  assert.equal(supplementalAudit.stats.latestWexfordLeachateBatchManualReviewPages, 0);
  assert.equal(supplementalAudit.stats.latestWexfordLeachateBatchExactExistingRecords, 13);
  assert.equal(supplementalAudit.stats.latestWexfordLeachateBatchSameContentDerivatives, 10);
  assert.equal(supplementalAudit.stats.latestWexfordLeachateBatchCanonicalSourceUpgrades, 1);
  assert.equal(supplementalAudit.stats.latestWexfordLeachateBatchRecordsAdded, 1);
  assert.equal(supplementalAudit.stats.latestWexfordAuthorizationBatchFilesReviewed, 31);
  assert.equal(supplementalAudit.stats.latestWexfordAuthorizationBatchPagesReviewed, 257);
  assert.equal(supplementalAudit.stats.latestWexfordAuthorizationBatchOCRPages, 52);
  assert.equal(supplementalAudit.stats.latestWexfordAuthorizationBatchOCRPagesWithText, 48);
  assert.equal(supplementalAudit.stats.latestWexfordAuthorizationBatchManualReviewPages, 0);
  assert.equal(supplementalAudit.stats.latestWexfordAuthorizationBatchExactExistingRecords, 27);
  assert.equal(supplementalAudit.stats.latestWexfordAuthorizationBatchSameContentDerivatives, 3);
  assert.equal(supplementalAudit.stats.latestWexfordAuthorizationBatchRecordsAdded, 1);
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
    supplementalCatalog.some((row) => row.sha256 === "b131111d78289b588bf5b2a7d616e51f3d62ab8f31faeb2979729f32b70c03c3" && row.type === "County financial audit"),
    true,
  );
  assert.equal(
    supplementalCatalog.some((row) => row.sha256 === "3dc615cfcf9ce5e8252c0d536a755cb548ed6c290ebed1f773ca5bb9356f72a0" && row.type === "County board minutes"),
    true,
  );
  const completePreinspection = await readFile(path.join(publicDirectory, "docs", "2014-preinspection.pdf"));
  assert.equal(
    createHash("sha256").update(completePreinspection).digest("hex"),
    "f496a616cd2a5ceef1019ce1b08c4aa1aa2f840387e20a78c7f5d9bd6a395cba",
  );
  assert.equal(
    supplementalCatalog.filter((row) => row.category === "Research & technical literature" && row.type === "Peer-reviewed research article").length,
    7,
  );
  assert.equal(
    supplementalCatalog.filter((row) => row.type === "USGS groundwater-flow study").length,
    2,
  );
  assert.equal(
    supplementalCatalog.some((row) => row.sha256 === "1a5758abbd591b44fe1b547aadded48616988118525ca480a6a83d94192fc0a1"),
    true,
  );
  assert.equal(
    supplementalCatalog.some((row) => row.sha256 === "2b78292aa0e0d1d2d660f8f30a13273f73207e45932dd9cd5f9025a5b04d91ac"),
    true,
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

test("batch 06 replay excludes only verified existing evidence and repairs catalog metadata", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch06-intake-audit.json"), "utf8"));
  const biosolidsCatalog = JSON.parse(await readFile(path.join(appDirectory, "biosolids-documents.json"), "utf8"));
  const supplementalCatalog = JSON.parse(await readFile(path.join(appDirectory, "supplemental-documents.json"), "utf8"));

  assert.equal(audit.stats.receivedFiles, 4);
  assert.equal(audit.stats.pdfPages, 141);
  assert.equal(audit.stats.retainedDistinctFiles, 0);
  assert.equal(audit.stats.excludedDuplicateFiles, 4);
  assert.equal(audit.stats.exactByteDuplicates, 2);
  assert.equal(audit.stats.renderIdenticalByteDifferentDuplicates, 2);
  assert.equal(audit.stats.timelineEventsAdded, 0);
  assert.deepEqual(
    audit.excludedDuplicates.map((row) => row.pages),
    [112, 2, 16, 11],
  );
  assert.equal(
    biosolidsCatalog.some((row) => row.id === "052-760656b79f1f"
      && row.name === "Cadillac WWTP Septage Information.pdf"
      && row.year === "2012"),
    true,
  );
  assert.equal(
    supplementalCatalog.some((row) => row.id === "133-b131111d7828"
      && row.sha256 === "b131111d78289b588bf5b2a7d616e51f3d62ab8f31faeb2979729f32b70c03c3"),
    true,
  );
});

test("batch 07 integrity follow-up records the alternate 2015 FCE without duplicating it", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch07-intake-audit.json"), "utf8"));

  assert.equal(audit.sourceFile.sha256, "ce9e484eae03dd60d2d29b2e50b7d3f1521be131c8c9648a062d3332c8333456");
  assert.equal(audit.sourceFile.pages, 1);
  assert.equal(audit.catalogMatch.id, "019-038472a6ae4c");
  assert.match(audit.catalogMatch.relationship, /same signed one-page inspection scan/i);
  assert.equal(audit.corpusIntegrity.catalogRecords, 1497);
  assert.equal(audit.corpusIntegrity.verifiedRecords, 1497);
  assert.equal(audit.corpusIntegrity.missingHashes, 0);
  assert.equal(audit.corpusIntegrity.hashFailures, 0);
  assert.equal(audit.corpusIntegrity.sizeFailures, 0);
  assert.equal(audit.corpusIntegrity.pageCountFailures, 0);
  assert.equal(audit.corpusIntegrity.unreadableRecords, 0);
  assert.match(audit.resolution, /no timeline event was added/i);
});

test("batch 08 preserves distinct Cadillac evidence and reuses verified copies", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch08-intake-audit.json"), "utf8"));
  const supplementalCatalog = JSON.parse(await readFile(path.join(appDirectory, "supplemental-documents.json"), "utf8"));

  assert.equal(audit.stats.receivedFiles, 17);
  assert.equal(audit.stats.pdfPages, 1280);
  assert.equal(audit.stats.distinctInputHashes, 16);
  assert.equal(audit.stats.ocrPages, 700);
  assert.equal(audit.stats.manualReviewPages, 5);
  assert.equal(audit.stats.hashFailures, 0);
  assert.equal(audit.stats.pageCountFailures, 0);
  assert.equal(audit.stats.unreadableFiles, 0);
  assert.equal(audit.stats.exactExistingRecords, 6);
  assert.equal(audit.stats.duplicateDMRFilenames, 2);
  assert.equal(audit.stats.retainedDistinctRecords, 7);
  assert.equal(audit.stats.outOfScopeRecords, 2);
  assert.equal(audit.stats.timelineEventsAdded, 8);
  assert.equal(audit.duplicateResolution.match, "DMR record 037-f1501daa350b");
  assert.match(audit.duplicateResolution.basis, /all 16 rendered pages are identical/i);
  assert.deepEqual(
    audit.retainedRecords.map((row) => row.id),
    [
      "137-ecd87ef13168",
      "138-5c29ab75dc0e",
      "139-b8fc380e3939",
      "140-e190873ad45d",
      "141-ffb3658949f7",
      "142-e631ea6ceff8",
      "143-be8756e643c5",
    ],
  );
  assert.equal(
    audit.outOfScopeRecords.some((row) => row.name === "Agenda Item G.pdf" && /City of Novi/i.test(row.reason)),
    true,
  );
  for (const row of audit.retainedRecords) {
    assert.equal(supplementalCatalog.some((record) => record.id === row.id), true, row.id);
  }
});

test("batch 09 accounts for every leftovers file without publishing redundant worksheets", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch09-leftovers-audit.json"), "utf8"));
  const supplementalCatalog = JSON.parse(await readFile(path.join(appDirectory, "supplemental-documents.json"), "utf8"));
  const retainedAsset = path.join(publicDirectory, "findings-docs", "144-346ad8ed5ebc.pdf");
  const retainedBytes = await readFile(retainedAsset);

  assert.equal(audit.stats.receivedFiles, 31);
  assert.equal(audit.stats.pdfPages, 164);
  assert.equal(audit.stats.distinctInputHashes, 21);
  assert.equal(audit.stats.exactDuplicateFilenameCopies, 10);
  assert.equal(audit.stats.exactExistingHashes, 17);
  assert.equal(audit.stats.exactExistingFileInstances, 24);
  assert.equal(audit.stats.renderIdenticalExistingVariants, 3);
  assert.equal(audit.stats.renderIdenticalFileInstances, 6);
  assert.equal(audit.stats.retainedDistinctRecords, 1);
  assert.equal(audit.stats.timelineEventsAdded, 0);
  assert.equal(
    audit.stats.exactExistingFileInstances
      + audit.stats.renderIdenticalFileInstances
      + audit.stats.retainedDistinctRecords,
    audit.stats.receivedFiles,
  );
  assert.deepEqual(audit.renderIdenticalVariants.map((row) => row.pages), [6, 6, 2]);
  assert.equal(
    createHash("sha256").update(retainedBytes).digest("hex"),
    "346ad8ed5ebc0850d8f278a46670a9d7b29ff47c0cb533873bce43b69e5f93ec",
  );
  assert.equal(
    supplementalCatalog.some((row) => row.id === "144-346ad8ed5ebc"
      && row.pages === 1
      && row.size === 114433
      && /not a driller-certified well-completion log/i.test(row.description)),
    true,
  );
  assert.match(audit.resolution, /no timeline event was added/i);
});

test("batch 10 reuses verified WET, WQBEL, exceedance and landfill evidence", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch10-leftovers-audit.json"), "utf8"));

  assert.equal(audit.stats.receivedFiles, 27);
  assert.equal(audit.stats.pdfPages, 154);
  assert.equal(audit.stats.distinctInputHashes, 24);
  assert.equal(audit.stats.exactDuplicateFilenameCopies, 3);
  assert.equal(audit.stats.exactExistingHashes, 22);
  assert.equal(audit.stats.exactExistingFileInstances, 25);
  assert.equal(audit.stats.renderIdenticalExistingVariants, 2);
  assert.equal(audit.stats.renderIdenticalFileInstances, 2);
  assert.equal(audit.stats.retainedDistinctRecords, 0);
  assert.equal(audit.stats.timelineEventsAdded, 0);
  assert.equal(
    audit.stats.exactExistingFileInstances + audit.stats.renderIdenticalFileInstances,
    audit.stats.receivedFiles,
  );
  assert.deepEqual(
    audit.renderIdenticalVariants.map((row) => row.match),
    ["IPP record 037-1f7e70d66b30", "IPP record 037-1f7e70d66b30"],
  );
  for (const row of audit.renderIdenticalVariants) {
    assert.equal(row.pages, 1);
    assert.match(row.basis, /identical at both 72 and 144 DPI/i);
  }
  assert.match(audit.resolution, /No redundant asset, catalog record or timeline event was added/i);
});

test("batch 11 accounts for repeated leftovers and retains only distinct correspondence", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch11-leftovers-audit.json"), "utf8"));
  const correspondenceCatalog = JSON.parse(await readFile(path.join(appDirectory, "correspondence-documents.json"), "utf8"));

  assert.equal(audit.stats.receivedFiles, 62);
  assert.equal(audit.stats.pdfPages, 371);
  assert.equal(audit.stats.distinctInputHashes, 51);
  assert.equal(audit.stats.exactDuplicateFilenameCopies, 11);
  assert.equal(audit.stats.exactExistingHashes, 44);
  assert.equal(audit.stats.exactExistingFileInstances, 52);
  assert.equal(audit.stats.renderIdenticalExistingVariants, 4);
  assert.equal(audit.stats.renderIdenticalFileInstances, 7);
  assert.equal(audit.stats.ocrPages, 12);
  assert.equal(audit.stats.ocrPagesWithText, 12);
  assert.equal(audit.stats.manualReviewPages, 63);
  assert.equal(audit.stats.retainedDistinctRecords, 3);
  assert.equal(audit.stats.timelineEventsAdded, 0);
  assert.equal(
    audit.stats.exactExistingFileInstances
      + audit.stats.renderIdenticalFileInstances
      + audit.stats.retainedDistinctRecords,
    audit.stats.receivedFiles,
  );
  assert.equal(audit.exactExistingRecords.length, 44);
  assert.equal(audit.renderIdenticalVariants.length, 4);
  assert.deepEqual(
    audit.retainedRecords.map((row) => row.id),
    ["corr-038-60eb9cdca3e6", "corr-039-ae0709a82af7", "corr-040-57ed2d4d18eb"],
  );
  assert.equal(
    audit.renderIdenticalVariants.some((row) =>
      row.sha256 === "50e47e8f1d9da05215ff046112c41f4aa1449c550ea6c53260919de577793b58"
        && row.match === "correspondence record corr-040-57ed2d4d18eb"
        && /72 and 144 DPI/i.test(row.basis)),
    true,
  );

  for (const retained of audit.retainedRecords) {
    const record = correspondenceCatalog.find((row) => row.id === retained.id);
    assert.ok(record, retained.id);
    assert.equal(record.pages, retained.pages);
    assert.equal(record.size, retained.size);
    const source = await readFile(path.join(publicDirectory, "correspondence-docs", `${retained.id}.pdf`));
    assert.equal(createHash("sha256").update(source).digest("hex"), retained.sha256);
  }
  assert.match(audit.resolution, /no timeline event was added/i);
});

test("batch 12 reuses established records and retains the two distinct PFAS review threads", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch12-leftovers-audit.json"), "utf8"));
  const correspondenceCatalog = JSON.parse(await readFile(path.join(appDirectory, "correspondence-documents.json"), "utf8"));

  assert.equal(audit.stats.receivedFiles, 13);
  assert.equal(audit.stats.pdfPages, 199);
  assert.equal(audit.stats.distinctInputHashes, 13);
  assert.equal(audit.stats.exactExistingHashes, 10);
  assert.equal(audit.stats.exactExistingFileInstances, 10);
  assert.equal(audit.stats.renderIdenticalExistingVariants, 1);
  assert.equal(audit.stats.renderIdenticalFileInstances, 1);
  assert.equal(audit.stats.manualReviewPages, 16);
  assert.equal(audit.stats.retainedDistinctRecords, 2);
  assert.equal(audit.stats.timelineEventsAdded, 2);
  assert.equal(
    audit.stats.exactExistingFileInstances
      + audit.stats.renderIdenticalFileInstances
      + audit.stats.retainedDistinctRecords,
    audit.stats.receivedFiles,
  );
  assert.equal(audit.exactExistingRecords.length, 10);
  assert.equal(audit.renderIdenticalVariants.length, 1);
  assert.deepEqual(
    audit.retainedRecords.map((row) => row.id),
    ["corr-041-7797237d5b67", "corr-042-c73c0b45e14a"],
  );
  assert.equal(
    audit.renderIdenticalVariants.some((row) =>
      row.sha256 === "8715db9170efddc157de7a9c4635312a1622a8a92f530af85583825311aa76e6"
        && row.match === "correspondence record corr-038-60eb9cdca3e6"
        && /72 and 144 DPI/i.test(row.basis)),
    true,
  );

  for (const retained of audit.retainedRecords) {
    const record = correspondenceCatalog.find((row) => row.id === retained.id);
    assert.ok(record, retained.id);
    assert.equal(record.pages, retained.pages);
    assert.equal(record.size, retained.size);
    const source = await readFile(path.join(publicDirectory, "correspondence-docs", `${retained.id}.pdf`));
    assert.equal(createHash("sha256").update(source).digest("hex"), retained.sha256);
  }
  assert.match(audit.resolution, /two dated events/i);
});

test("batch 13 reuses all eleven exact IPP, NPDES, biosolids and laboratory records", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch13-leftovers-audit.json"), "utf8"));
  const catalogRows = (await loadCatalogs()).flatMap((catalog) => catalog.rows);

  assert.equal(audit.stats.receivedFiles, 11);
  assert.equal(audit.stats.pdfPages, 41);
  assert.equal(audit.stats.distinctInputHashes, 11);
  assert.equal(audit.stats.exactDuplicateFilenameCopies, 0);
  assert.equal(audit.stats.exactExistingHashes, 11);
  assert.equal(audit.stats.exactExistingFileInstances, 11);
  assert.equal(audit.stats.publishedAssetHashMatches, 11);
  assert.equal(audit.stats.manualReviewPages, 41);
  assert.equal(audit.stats.blankFirstPages, 0);
  assert.equal(audit.stats.retainedDistinctRecords, 0);
  assert.equal(audit.stats.timelineEventsAdded, 0);
  assert.equal(audit.exactExistingRecords.length, 11);

  for (const exact of audit.exactExistingRecords) {
    const record = catalogRows.find((row) => row.sha256 === exact.sha256);
    assert.ok(record, exact.sha256);
    assert.match(exact.match, new RegExp(record.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  assert.match(audit.resolution, /No redundant asset, catalog record or timeline event was added/i);
  assert.match(audit.resolution, /no source PDF was modified/i);
});

test("batch 14 reuses eighteen exact NPDES records and retains one Plett Road photo set", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch14-leftovers-audit.json"), "utf8"));
  const catalogRows = (await loadCatalogs()).flatMap((catalog) => catalog.rows);

  assert.equal(audit.stats.receivedFiles, 19);
  assert.equal(audit.stats.pdfPages, 690);
  assert.equal(audit.stats.distinctInputHashes, 19);
  assert.equal(audit.stats.exactDuplicateFilenameCopies, 0);
  assert.equal(audit.stats.exactExistingHashes, 18);
  assert.equal(audit.stats.exactExistingFileInstances, 18);
  assert.equal(audit.stats.publishedAssetHashMatches, 19);
  assert.equal(audit.stats.manualReviewPages, 690);
  assert.equal(audit.stats.blankFirstPages, 0);
  assert.equal(audit.stats.retainedDistinctRecords, 1);
  assert.equal(audit.stats.timelineEventsAdded, 0);
  assert.equal(audit.exactExistingRecords.length, 18);
  assert.equal(audit.retainedRecords.length, 1);
  assert.equal(
    audit.stats.exactExistingFileInstances + audit.stats.retainedDistinctRecords,
    audit.stats.receivedFiles,
  );

  for (const exact of audit.exactExistingRecords) {
    const record = catalogRows.find((row) => row.sha256 === exact.sha256);
    assert.ok(record, exact.sha256);
    assert.match(exact.match, new RegExp(record.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  const retained = audit.retainedRecords[0];
  const retainedRecord = catalogRows.find((row) => row.id === retained.id);
  assert.ok(retainedRecord, retained.id);
  assert.equal(retainedRecord.sha256, retained.sha256);
  assert.equal(retainedRecord.pages, retained.pages);
  assert.equal(retainedRecord.size, retained.size);
  assert.match(retainedRecord.description, /not treated as a survey/i);
  const source = await readFile(path.join(publicDirectory, retained.asset.replace(/^\//, "")));
  assert.equal(createHash("sha256").update(source).digest("hex"), retained.sha256);
  const sourceUrlModule = await readFile(path.join(appDirectory, "source-url.ts"), "utf8");
  const repositoryCommit = sourceUrlModule.match(/repositoryAssetCommit = "([0-9a-f]{40})"/)?.[1];
  assert.ok(repositoryCommit, "source URL module has no immutable repository commit");
  const publishedBlob = spawnSync("git", ["cat-file", "-e", `${repositoryCommit}:public${retained.asset}`], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(publishedBlob.status, 0, `retained source is absent from repository commit ${repositoryCommit}`);
  assert.match(audit.resolution, /without adding a timeline event/i);
  assert.match(audit.resolution, /No source PDF was modified/i);
});

test("batch 15 reuses nine established MAHL and SVN-01952 records", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch15-mahl-audit.json"), "utf8"));
  const catalogRows = (await loadCatalogs()).flatMap((catalog) => catalog.rows);

  assert.equal(audit.stats.receivedFiles, 15);
  assert.equal(audit.stats.pdfPages, 897);
  assert.equal(audit.stats.distinctInputHashes, 14);
  assert.equal(audit.stats.exactDuplicateFilenameCopies, 1);
  assert.equal(audit.stats.exactExistingHashes, 3);
  assert.equal(audit.stats.exactExistingFileInstances, 4);
  assert.equal(audit.stats.renderIdenticalFileInstances, 11);
  assert.equal(audit.stats.establishedRecordsReused, 9);
  assert.equal(audit.stats.ocrPages, 53);
  assert.equal(audit.stats.manualReviewPages, 897);
  assert.equal(audit.stats.blankFirstPages, 0);
  assert.equal(audit.stats.retainedDistinctRecords, 0);
  assert.equal(audit.stats.timelineEventsAdded, 0);
  assert.equal(audit.establishedRecords.length, 9);
  assert.equal(
    audit.stats.exactExistingFileInstances + audit.stats.renderIdenticalFileInstances,
    audit.stats.receivedFiles,
  );

  const suppliedFiles = audit.establishedRecords.flatMap((group) => group.files);
  assert.equal(suppliedFiles.length, audit.stats.receivedFiles);
  assert.equal(new Set(suppliedFiles.map((file) => file.sha256)).size, audit.stats.distinctInputHashes);

  for (const group of audit.establishedRecords) {
    const record = catalogRows.find((row) => row.sha256 === group.canonicalSha256);
    assert.ok(record, group.canonicalSha256);
    assert.equal(record.pages, group.canonicalPages);
    assert.match(group.match, new RegExp(record.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  assert.match(audit.resolution, /No redundant asset, catalog record or timeline event was added/i);
  assert.match(audit.resolution, /no source PDF was modified/i);
});

test("batch 16 reuses eight established records and retains two inspection exports", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch16-potw-audit.json"), "utf8"));
  const catalogRows = (await loadCatalogs()).flatMap((catalog) => catalog.rows);

  assert.equal(audit.stats.receivedFiles, 11);
  assert.equal(audit.stats.pdfPages, 171);
  assert.equal(audit.stats.distinctInputHashes, 10);
  assert.equal(audit.stats.exactDuplicateFilenameCopies, 1);
  assert.equal(audit.stats.exactExistingHashes, 8);
  assert.equal(audit.stats.exactExistingFileInstances, 9);
  assert.equal(audit.stats.establishedRecordsReused, 8);
  assert.equal(audit.stats.ocrPages, 13);
  assert.equal(audit.stats.manualReviewPages, 171);
  assert.equal(audit.stats.blankFirstPages, 0);
  assert.equal(audit.stats.retainedDistinctRecords, 2);
  assert.equal(audit.stats.timelineEventsAdded, 1);
  assert.equal(audit.stats.timelineSourcesAdded, 2);
  assert.equal(audit.establishedRecords.length, 8);
  assert.equal(
    audit.stats.exactExistingFileInstances + audit.stats.retainedDistinctRecords,
    audit.stats.receivedFiles,
  );

  const suppliedFiles = audit.establishedRecords.flatMap((group) => group.files);
  assert.equal(suppliedFiles.length, audit.stats.exactExistingFileInstances);
  for (const group of audit.establishedRecords) {
    const record = catalogRows.find((row) => row.sha256 === group.canonicalSha256);
    assert.ok(record, group.canonicalSha256);
    assert.equal(record.pages, group.canonicalPages);
    assert.match(group.match, new RegExp(record.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  for (const retained of audit.retainedRecords) {
    const record = catalogRows.find((row) => row.id === retained.id);
    assert.ok(record, retained.id);
    assert.equal(record.sha256, retained.sha256);
    assert.equal(record.pages, retained.pages);
    assert.equal(record.size, retained.size);
    const source = await readFile(path.join(publicDirectory, retained.asset.replace(/^\//, "")));
    assert.equal(createHash("sha256").update(source).digest("hex"), retained.sha256);
  }

  assert.match(audit.resolution, /one dated timeline event/i);
  assert.match(audit.resolution, /No source PDF was modified/i);
});

test("batch 17 reuses nine monitoring summaries and retains one post-inspection export", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch17-potw-monitoring-audit.json"), "utf8"));
  const catalogRows = (await loadCatalogs()).flatMap((catalog) => catalog.rows);

  assert.equal(audit.stats.receivedFiles, 10);
  assert.equal(audit.stats.pdfPages, 37);
  assert.equal(audit.stats.distinctInputHashes, 10);
  assert.equal(audit.stats.exactExistingHashes, 9);
  assert.equal(audit.stats.exactExistingFileInstances, 9);
  assert.equal(audit.stats.establishedRecordsReused, 9);
  assert.equal(audit.stats.ocrPages, 0);
  assert.equal(audit.stats.manualReviewPages, 37);
  assert.equal(audit.stats.blankFirstPages, 0);
  assert.equal(audit.stats.retainedDistinctRecords, 1);
  assert.equal(audit.stats.timelineEventsAdded, 1);
  assert.equal(audit.stats.timelineSourcesAdded, 1);
  assert.equal(audit.establishedRecords.length, 9);
  assert.equal(
    audit.stats.exactExistingFileInstances + audit.stats.retainedDistinctRecords,
    audit.stats.receivedFiles,
  );

  const suppliedFiles = audit.establishedRecords.flatMap((group) => group.files);
  assert.equal(suppliedFiles.length, audit.stats.exactExistingFileInstances);
  for (const group of audit.establishedRecords) {
    const record = catalogRows.find((row) => row.sha256 === group.canonicalSha256);
    assert.ok(record, group.canonicalSha256);
    assert.equal(record.pages, group.canonicalPages);
    assert.match(group.match, new RegExp(record.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  for (const retained of audit.retainedRecords) {
    const record = catalogRows.find((row) => row.id === retained.id);
    assert.ok(record, retained.id);
    assert.equal(record.sha256, retained.sha256);
    assert.equal(record.pages, retained.pages);
    assert.equal(record.size, retained.size);
    const source = await readFile(path.join(publicDirectory, retained.asset.replace(/^\//, "")));
    assert.equal(createHash("sha256").update(source).digest("hex"), retained.sha256);
  }

  assert.match(audit.resolution, /original and revised 2024 summaries retained as distinct records/i);
  assert.match(audit.resolution, /No source PDF was modified/i);
});

test("batch 18 reuses eight exact records and one content-identical Pace re-export", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch18-permit-lab-site-audit.json"), "utf8"));
  const catalogRows = (await loadCatalogs()).flatMap((catalog) => catalog.rows);

  assert.equal(audit.stats.receivedFiles, 9);
  assert.equal(audit.stats.pdfPages, 158);
  assert.equal(audit.stats.distinctInputHashes, 9);
  assert.equal(audit.stats.exactDuplicateFilenameCopies, 0);
  assert.equal(audit.stats.exactExistingHashes, 8);
  assert.equal(audit.stats.exactExistingFileInstances, 8);
  assert.equal(audit.stats.renderIdenticalFileInstances, 1);
  assert.equal(audit.stats.establishedRecordsReused, 9);
  assert.equal(audit.stats.ocrPages, 11);
  assert.equal(audit.stats.ocrPagesWithText, 5);
  assert.equal(audit.stats.gpuOcrPages, 11);
  assert.equal(audit.stats.manualReviewPages, 158);
  assert.equal(audit.stats.verifiedBlankPages, 6);
  assert.equal(audit.stats.blankFirstPages, 0);
  assert.equal(audit.stats.retainedDistinctRecords, 0);
  assert.equal(audit.stats.timelineEventsAdded, 0);
  assert.equal(audit.establishedRecords.length, 9);
  assert.equal(
    audit.stats.exactExistingFileInstances + audit.stats.renderIdenticalFileInstances,
    audit.stats.receivedFiles,
  );

  const suppliedFiles = audit.establishedRecords.flatMap((group) => group.files);
  assert.equal(suppliedFiles.length, audit.stats.receivedFiles);
  assert.equal(new Set(suppliedFiles.map((file) => file.sha256)).size, audit.stats.distinctInputHashes);

  for (const group of audit.establishedRecords) {
    const record = catalogRows.find((row) => row.sha256 === group.canonicalSha256);
    assert.ok(record, group.canonicalSha256);
    assert.equal(record.pages, group.canonicalPages);
    assert.match(group.match, new RegExp(record.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  const pace = audit.establishedRecords.find((group) => group.match.includes("063-95e40af937e2"));
  assert.ok(pace);
  assert.notEqual(pace.files[0].sha256, pace.canonicalSha256);
  assert.match(pace.files[0].classification, /all 16 pages match/i);
  assert.match(audit.resolution, /No redundant asset, catalog record or timeline event was added/i);
  assert.match(audit.resolution, /no source PDF was modified/i);
});

test("batch 19 reuses seven established records for eight NPDES and biosolids files", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch19-npdes-permit-audit.json"), "utf8"));
  const catalogRows = (await loadCatalogs()).flatMap((catalog) => catalog.rows);

  assert.equal(audit.stats.receivedFiles, 8);
  assert.equal(audit.stats.pdfPages, 177);
  assert.equal(audit.stats.distinctInputHashes, 7);
  assert.equal(audit.stats.exactDuplicateFilenameCopies, 1);
  assert.equal(audit.stats.exactExistingHashes, 7);
  assert.equal(audit.stats.exactExistingFileInstances, 8);
  assert.equal(audit.stats.establishedRecordsReused, 7);
  assert.equal(audit.stats.ocrPages, 5);
  assert.equal(audit.stats.ocrPagesWithText, 5);
  assert.equal(audit.stats.gpuOcrPages, 5);
  assert.equal(audit.stats.manualReviewPages, 177);
  assert.equal(audit.stats.verifiedBlankPages, 0);
  assert.equal(audit.stats.blankFirstPages, 0);
  assert.equal(audit.stats.retainedDistinctRecords, 0);
  assert.equal(audit.stats.timelineEventsAdded, 0);
  assert.equal(audit.establishedRecords.length, 7);

  const suppliedFiles = audit.establishedRecords.flatMap((group) => group.files);
  assert.equal(suppliedFiles.length, audit.stats.receivedFiles);
  assert.equal(new Set(suppliedFiles.map((file) => file.sha256)).size, audit.stats.distinctInputHashes);

  for (const group of audit.establishedRecords) {
    const record = catalogRows.find((row) => row.sha256 === group.canonicalSha256);
    assert.ok(record, group.canonicalSha256);
    assert.equal(record.pages, group.canonicalPages);
    assert.match(group.match, new RegExp(record.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  const mapGroup = audit.establishedRecords.find((group) => group.match.includes("010-f809ae7f23d8"));
  assert.ok(mapGroup);
  assert.equal(mapGroup.files.length, 2);
  assert.equal(mapGroup.files[0].sha256, mapGroup.files[1].sha256);
  assert.match(audit.resolution, /four similarly named draft\/final permit files remain separate/i);
  assert.match(audit.resolution, /No redundant asset, catalog record or timeline event was added/i);
  assert.match(audit.resolution, /no source PDF was modified/i);
});

test("batch 20 reuses four exact records and preserves the distinct Munson flow values", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch20-biosolids-ipp-snc-audit.json"), "utf8"));
  const catalogRows = (await loadCatalogs()).flatMap((catalog) => catalog.rows);

  assert.equal(audit.stats.receivedFiles, 4);
  assert.equal(audit.stats.pdfPages, 4);
  assert.equal(audit.stats.distinctInputHashes, 4);
  assert.equal(audit.stats.exactDuplicateFilenameCopies, 0);
  assert.equal(audit.stats.exactExistingHashes, 4);
  assert.equal(audit.stats.exactExistingFileInstances, 4);
  assert.equal(audit.stats.establishedRecordsReused, 4);
  assert.equal(audit.stats.ocrPages, 1);
  assert.equal(audit.stats.ocrPagesWithText, 1);
  assert.equal(audit.stats.gpuOcrPages, 1);
  assert.equal(audit.stats.manualReviewPages, 4);
  assert.equal(audit.stats.verifiedBlankPages, 0);
  assert.equal(audit.stats.blankFirstPages, 0);
  assert.equal(audit.stats.retainedDistinctRecords, 0);
  assert.equal(audit.stats.timelineEventsAdded, 0);
  assert.equal(audit.establishedRecords.length, 4);

  const suppliedFiles = audit.establishedRecords.flatMap((group) => group.files);
  assert.equal(suppliedFiles.length, audit.stats.receivedFiles);
  assert.equal(new Set(suppliedFiles.map((file) => file.sha256)).size, audit.stats.distinctInputHashes);

  for (const group of audit.establishedRecords) {
    const record = catalogRows.find((row) => row.sha256 === group.canonicalSha256);
    assert.ok(record, group.canonicalSha256);
    assert.equal(record.pages, group.canonicalPages);
    assert.match(group.match, new RegExp(record.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }

  assert.equal(audit.munsonComparison.exactRender, false);
  assert.equal(audit.munsonComparison.exactExtractedText, false);
  assert.match(audit.munsonComparison.materialDifference, /21,907 gpd.*21,000 gpd/i);
  assert.match(audit.resolution, /two Munson documents remain separate/i);
  assert.match(audit.resolution, /No redundant asset, catalog record or timeline event was added/i);
  assert.match(audit.resolution, /no source PDF was modified/i);
});

test("batch 21 reconciles laboratory reports and retains both 2015 interview records", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch21-lab-ipp-intake-audit.json"), "utf8"));
  const catalogRows = (await loadCatalogs()).flatMap((catalog) => catalog.rows);
  const pageSource = await readFile(path.join(appDirectory, "page.tsx"), "utf8");

  assert.equal(audit.stats.receivedFiles, 32);
  assert.equal(audit.stats.pdfPages, 255);
  assert.equal(audit.stats.distinctInputHashes, 30);
  assert.equal(audit.stats.exactDuplicateFilenameCopies, 2);
  assert.equal(audit.stats.exactExistingHashes, 27);
  assert.equal(audit.stats.exactExistingFileInstances, 29);
  assert.equal(audit.stats.renderIdenticalFileInstances, 1);
  assert.equal(audit.stats.establishedRecordsReused, 27);
  assert.equal(audit.stats.ocrPages, 49);
  assert.equal(audit.stats.ocrPagesWithText, 49);
  assert.equal(audit.stats.gpuOcrPages, 49);
  assert.equal(audit.stats.manualReviewPages, 255);
  assert.equal(audit.stats.verifiedBlankPages, 0);
  assert.equal(audit.stats.blankFirstPages, 0);
  assert.equal(audit.stats.retainedDistinctRecords, 2);
  assert.equal(audit.stats.timelineEventsAdded, 1);
  assert.equal(audit.stats.timelineSourcesAdded, 2);
  assert.equal(audit.catalogMatches.length, 24);
  assert.equal(audit.timelineReportMatches.length, 3);
  assert.equal(audit.timelineReportMatches.flatMap((group) => group.files).length, 6);
  assert.equal(
    audit.catalogMatches.length + audit.timelineReportMatches.flatMap((group) => group.files).length + audit.retainedRecords.length,
    audit.stats.receivedFiles,
  );

  for (const matched of audit.catalogMatches) {
    const record = catalogRows.find((row) => row.id === matched.recordId);
    assert.ok(record, matched.recordId);
    assert.equal(record.sha256, matched.sha256);
    assert.equal(record.pages, matched.pages);
    assert.equal(record.size, matched.size);
  }

  for (const retained of audit.retainedRecords) {
    const record = catalogRows.find((row) => row.id === retained.id);
    assert.ok(record, retained.id);
    assert.equal(record.sha256, retained.sha256);
    assert.equal(record.pages, retained.pages);
    assert.equal(record.size, retained.size);
    assert.match(record.url, /github\.com\/BLAXWATER\/cadillac-pfas-event-trace\/blob\/eb9cd4c0506afd72d73a4d4ebd4ab1ffe97ab7f5\//);
    const source = await readFile(path.join(publicDirectory, retained.asset.replace(/^\//, "")));
    assert.equal(createHash("sha256").update(source).digest("hex"), retained.sha256);
    assert.ok((await stat(path.join(publicDirectory, retained.preview.replace(/^\//, "")))).size > 0);
  }

  const j17646 = audit.timelineReportMatches.find((group) => group.canonical.includes("j17646"));
  assert.ok(j17646);
  assert.equal(j17646.files.length, 4);
  assert.equal(j17646.files.filter((file) => file.sha256 === j17646.canonicalSha256).length, 3);
  assert.match(j17646.files.find((file) => file.sha256 !== j17646.canonicalSha256).classification, /all 23 normalized-text and rendered pages match/i);
  assert.match(pageSource, /DEQ interview records document Cadillac's pretreatment program/);
  assert.match(pageSource, /158-05788837212e\.pdf/);
  assert.match(pageSource, /159-4158539aa924\.pdf/);
  assert.match(audit.resolution, /No redundant report copy was added/i);
  assert.match(audit.resolution, /no source PDF was modified/i);
});

test("batch 22 reconciles six Cadillac core sources and keeps their previews and downloads local", async () => {
  const audit = JSON.parse(await readFile(path.join(appDirectory, "batch22-core-source-reconciliation-audit.json"), "utf8"));
  const catalogRows = (await loadCatalogs()).flatMap((catalog) => catalog.rows);
  const previewManifest = JSON.parse(await readFile(path.join(appDirectory, "first-page-preview-manifest.json"), "utf8"));
  const bundledSource = await readFile(path.join(appDirectory, "bundled-public-assets.ts"), "utf8");

  assert.equal(audit.stats.receivedFiles, 6);
  assert.equal(audit.stats.pdfPages, 81);
  assert.equal(audit.stats.exactExistingHashes, 5);
  assert.equal(audit.stats.alternateExistingSourceExports, 1);
  assert.equal(audit.stats.establishedRecordsReused, 6);
  assert.equal(audit.stats.canonicalAssetsRestored, 3);
  assert.equal(audit.stats.bundledDownloadsEnabled, 6);
  assert.equal(audit.stats.firstPagePreviewsAvailable, 6);
  assert.equal(audit.stats.missingHashes, 0);
  assert.equal(audit.stats.staleHashes, 0);
  assert.equal(audit.stats.hashFailures, 0);
  assert.equal(audit.stats.pageCountFailures, 0);
  assert.equal(audit.stats.unreadableFiles, 0);
  assert.equal(audit.stats.retainedDistinctRecords, 0);
  assert.equal(audit.catalogMatches.length, 5);
  assert.equal(audit.alternateSourceExports.length, 1);

  const reconciled = [
    ...audit.catalogMatches,
    ...audit.alternateSourceExports.map((entry) => ({
      recordId: entry.recordId,
      sha256: entry.canonicalSha256,
      pages: entry.pages,
      size: entry.canonicalSize,
      asset: entry.canonicalAsset,
    })),
  ];

  for (const matched of reconciled) {
    const record = catalogRows.find((row) => row.id === matched.recordId);
    assert.ok(record, matched.recordId);
    assert.equal(record.sha256, matched.sha256);
    assert.equal(record.pages, matched.pages);
    assert.equal(record.size, matched.size);

    const source = await readFile(path.join(publicDirectory, matched.asset.replace(/^\//, "")));
    assert.equal(createHash("sha256").update(source).digest("hex"), matched.sha256);
    assert.ok(previewManifest[matched.asset], `Missing preview for ${matched.asset}`);
    assert.match(bundledSource, new RegExp(matched.asset.replace(/^\//, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(audit.alternateSourceExports[0].classification, /same official 62-page meeting packet source/i);
  assert.match(audit.resolution, /No redundant asset, catalog record or timeline event was added/i);
  assert.match(audit.resolution, /no source PDF was modified/i);
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
