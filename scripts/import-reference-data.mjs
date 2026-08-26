import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceDir = process.argv[2];
const auditPath = process.argv[3];
if (!sourceDir || !auditPath) {
  throw new Error("Usage: node scripts/import-reference-data.mjs <source-directory> <audit-json>");
}

const exclusions = new Map([
  ["Reference Data.zip", "Archive duplicates the individually available loose source files."],
  ["01-30-2027 - EGLE_Wexford_County_Landfill_Full_Export - Copy.xlsx", "Byte-identical copy of the same workbook without the Copy suffix."],
  ["08-13-2026 - Wexford_Cadillac_document_evidence_index-2.csv", "Byte-identical copy of the evidence index without the -2 suffix."],
  ["Cadillac_WWTP_2010_2018_Master_Manifest.xlsx", "Workbook content matches the dated 2010-07-28 to 2018-12-19 version."],
  ["Cadillac_WWTP_Documents.csv", "Contains the same 1,203 records as the dated 2000-07-26 to 2026-08-05 export; row order differs only."],
  ["Documents (1).csv", "Contains the same 1,178 records as Documents.csv; row order differs only."],
]);

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "public", "reference-data");
const manifestPath = path.join(projectRoot, "app", "reference-documents.json");
const auditManifestPath = path.join(projectRoot, "app", "reference-audit.json");
const audit = JSON.parse(await readFile(auditPath, "utf8"));
const auditByName = new Map(audit.files.map((file) => [file.name, file]));

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const classify = (name, extension) => {
  const lower = name.toLowerCase();
  if (lower.includes("pfas")) return "PFAS analysis";
  if (lower.includes("download_log") || lower.includes("download log")) return "Download log";
  if (lower.includes("master_manifest") || lower.includes("master manifest") || lower === "manifest.csv") return "Master manifest";
  if (lower.includes("cleanup") || lower.includes("filing") || lower.includes("rename_log") || lower.includes("same_content") || lower.includes("link_verification") || lower.includes("duplicate_lab")) return "Audit & cleanup";
  if (/violations|compliance|permits|evaluations|submissions/.test(lower)) return "Regulatory export";
  if (lower.includes("documents")) return "Document inventory";
  if (/evidence|entity_relationships|corpus_search|extraction_summary|vvclvh/.test(lower)) return "Research index";
  if (extension === ".xlsx") return "Workbook";
  return "Reference export";
};

const entries = (await readdir(sourceDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && [".csv", ".xlsx"].includes(path.extname(entry.name).toLowerCase()) && !exclusions.has(entry.name))
  .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));

const documents = [];
for (const [index, entry] of entries.entries()) {
  const sourcePath = path.join(sourceDir, entry.name);
  const sourceAudit = auditByName.get(entry.name);
  if (!sourceAudit) throw new Error(`Audit profile missing for ${entry.name}`);
  const extension = path.extname(entry.name).toLowerCase();
  const storedName = `${String(index + 1).padStart(3, "0")}-${sourceAudit.sha256.slice(0, 12)}${extension}`;
  await copyFile(sourcePath, path.join(outputDir, storedName));

  const table = sourceAudit.table;
  const workbook = sourceAudit.workbook;
  documents.push({
    id: `${String(index + 1).padStart(3, "0")}-${sourceAudit.sha256.slice(0, 12)}`,
    name: entry.name,
    url: `/reference-data/${storedName}`,
    format: extension.slice(1).toUpperCase(),
    type: classify(entry.name, extension),
    size: sourceAudit.size,
    rows: table?.row_count ?? workbook?.sheets?.reduce((total, sheet) => total + sheet.row_count, 0) ?? null,
    columns: table?.column_count ?? Math.max(0, ...(workbook?.sheets?.map((sheet) => sheet.column_count) ?? [])),
    sheets: workbook?.sheet_count ?? null,
    sha256: sourceAudit.sha256,
  });
}

const includedBytes = documents.reduce((total, document) => total + document.size, 0);
const auditManifest = {
  sourceFileCount: audit.summary.file_count,
  publishedFileCount: documents.length,
  excludedFileCount: exclusions.size,
  includedBytes,
  methods: [
    "SHA-256 byte comparison",
    "Normalized CSV header and cell comparison",
    "Row-order-independent CSV comparison",
    "Workbook sheet, formula and cell-value comparison",
    "ZIP-entry comparison against loose source files",
  ],
  exclusions: Array.from(exclusions, ([name, reason]) => ({ name, reason })),
};

await writeFile(manifestPath, `${JSON.stringify(documents, null, 2)}\n`, "utf8");
await writeFile(auditManifestPath, `${JSON.stringify(auditManifest, null, 2)}\n`, "utf8");
console.log(`Published ${documents.length} distinct reference files; excluded ${exclusions.size} duplicate containers/copies.`);
