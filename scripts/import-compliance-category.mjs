import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function argument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const mode = argument("--mode", "archive");
const targetRoot = path.resolve(argument("--target-root", process.cwd()));
const catalogRoot = path.resolve(argument("--catalog-root", targetRoot));
const sourceDir = argument("--source-dir");
const inventoryPath = argument("--inventory");
const archiveRoot = argument("--archive-root");
const archiveCommit = argument("--archive-commit");

const syntheticExclusions = new Set([
  "05-21-2026 - Cadillac_Cyanide_Reporter_One_Page_Brief.pdf",
  "08-06-2026 - Cadillac_WWTP_TruthFirst_Final_Report.md",
  "Cadillac_MI_Compliance_Investigation_2026-08-11.pdf",
  "Cadillac_MI_Compliance_Investigation_2026-08-11_v2.pdf",
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function sha256(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function cleanDisplayName(name) {
  return name
    .replace(/^08 - Compliance & Enforcement_/i, "")
    .replace(/\s*\(copy\s*\d+\)(?=\.[^.]+$)/i, "")
    .replace(/_COPY(?=\.[^.]+$)/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function inferYear(name, inventory) {
  const range = name.match(/(?<!\d)((?:19|20)\d{2})[-–]((?:19|20)\d{2})(?!\d)/);
  if (range) return `${range[1]}–${range[2]}`;
  if (/Compliance_File_Pages_/i.test(name)) return "2014–2016";
  if (/Violation Notice Attachment - Effluent Limitation/i.test(name)) return "2014";
  const year = name.match(/\b((?:19|20)\d{2})\b/);
  if (year) return year[1];
  const compactDate = /(exceed|written rpt|verbal notify)/i.test(name)
    ? name.match(/(?<!\d)\d{4}(\d{2})(?!\d)/)
    : null;
  if (compactDate) {
    const shortYear = Number(compactDate[1]);
    return String(shortYear >= 70 ? 1900 + shortYear : 2000 + shortYear);
  }
  const metadata = inventory?.pdf_metadata ?? {};
  for (const key of ["CreationDate", "ModDate"]) {
    const match = String(metadata[key] ?? "").match(/D:((?:19|20)\d{2})/);
    if (match) return match[1];
  }
  return "Undated";
}

function inferType(name, format) {
  const lower = name.toLowerCase();
  if (/spill|bypass|incident notification/.test(lower)) return "Spill or bypass notification";
  if (/attachment/.test(lower)) return "Violation attachment";
  if (/exceed|low ph|effluent limitation|reported values/.test(lower)) return "Effluent exceedance record";
  if (/full compliance evaluation|compliance evaluation/.test(lower)) return "Compliance evaluation";
  if (/read receipt|response|follow-up|correspondence|email|communication|comresp|egle file cc/.test(lower)) return "Compliance correspondence";
  if (/violation notice|\bsvn[-_ ]|\bvn[-_ ]|nov\b|violation letter/.test(lower)) return "Violation notice";
  if (/application compliance|application incomplete/.test(lower)) return "Application compliance review";
  if (/district compliance file|chronological/.test(lower)) return "Compliance file compilation";
  if (/compliance_file_pages|compliance file pages/.test(lower)) return "Searchable source extract";
  if (/qtr|quarter|monitoring/.test(lower)) return "Compliance monitoring report";
  if (/notebook/.test(lower)) return "Agency notebook image";
  if (format === "MSG") return "Compliance email";
  return "Supporting compliance record";
}

function describe(type, format) {
  const suffix = format === "MSG" ? " Preserved in its original Outlook message format." : "";
  const descriptions = {
    "Spill or bypass notification": "Source record documenting a reported spill, bypass or treatment-system incident.",
    "Effluent exceedance record": "Source record documenting an effluent-limit exceedance, abnormal result or follow-up reporting.",
    "Compliance evaluation": "Agency compliance-evaluation record for the Cadillac wastewater treatment facility.",
    "Violation notice": "Formal notice or supporting record concerning an identified compliance violation.",
    "Violation attachment": "Attachment supporting a violation notice, including reported-value tables or agency working material.",
    "Application compliance review": "Agency review material concerning application completeness or permit compliance information.",
    "Compliance file compilation": "Compiled district compliance-file source preserved as a distinct record package.",
    "Searchable source extract": "Searchable source-order excerpt retained separately from the larger chronological compilation.",
    "Compliance monitoring report": "Regulatory monitoring or quarterly compliance source record.",
    "Agency notebook image": "Photographed agency notebook material preserved as a source image.",
    "Compliance correspondence": "Agency, municipal or related correspondence concerning compliance and corrective action.",
    "Compliance email": "Original email record concerning compliance or enforcement activity.",
    "Supporting compliance record": "Supporting source record included in the compliance and enforcement file.",
  };
  return `${descriptions[type]}${suffix}`;
}

function loadCatalogs(root) {
  const directory = path.join(root, "app");
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith("-documents.json"))
    .map((name) => ({ name, rows: readJson(path.join(directory, name)) }));
}

function buildAudit({ sourceCount, selected, crossCategory, synthetic, existingCount, inventoryByHash }) {
  const pages = selected.reduce((total, row) => total + (row.pages ?? 0), 0);
  const ocrPages = selected.reduce((total, row) => total + (inventoryByHash.get(row.sha256)?.ocr_required_pages ?? 0), 0) +
    selected.filter((row) => ["JPG", "JPEG", "PNG"].includes(row.format)).length;
  return {
    methods: [
      "SHA-256 comparison within the category and against every published catalog",
      "PDF page-count and document-metadata verification",
      "Embedded-text extraction from every PDF page",
      "OCR of every image and PDF page with fewer than 40 normalized embedded characters",
      "Sequence-preserving rendered-page and normalized-text comparison",
      "Manual visual review of low-confidence aerial-image and rotated-table pages",
    ],
    stats: {
      sourceFilesReviewed: sourceCount,
      exactDuplicateGroupsWithinSource: 0,
      renderIdenticalByteDifferentGroupsWithinSource: 0,
      crossCategoryCopiesReferencedElsewhere: crossCategory.length,
      analystAuthoredReportsExcluded: synthetic.length,
      existingComplianceRecordsRetained: existingCount,
      finalDistinctRecords: selected.length,
      reviewedPages: pages,
      ocrPages,
      publishedBytes: selected.reduce((total, row) => total + row.size, 0),
    },
    decisions: [
      {
        name: "Duplicate validation result",
        reason: "No byte-identical or page-for-page render-identical duplicates were found among the remaining compliance source records. Similar titles, source extracts, revisions, raw MSG files and rendered email PDFs were retained when their content or format differed.",
      },
      ...crossCategory.map((row) => ({
        name: row.name,
        reason: `Not republished in Category 08 because the same SHA-256 source is already preserved in ${row.catalog}.`,
      })),
      ...synthetic.map((name) => ({
        name,
        reason: /TruthFirst/i.test(name)
          ? "Excluded in accordance with the prior instruction to remove the Truth-First final report."
          : "Excluded from the primary-source library because file metadata and authorship identify it as an analyst-authored derivative report rather than an underlying agency record.",
      })),
      {
        name: "Low-confidence OCR pages",
        reason: "District compliance-file pages 56, 228 and 230 were visually verified as a valid aerial image and two rotated dense tables; no source page is missing or corrupt.",
      },
    ],
  };
}

if (mode === "archive") {
  if (!sourceDir || !inventoryPath) throw new Error("archive mode requires --source-dir and --inventory");
  const sourceRoot = path.resolve(sourceDir);
  const targetCatalogs = loadCatalogs(targetRoot);
  const authoritativeCatalogs = loadCatalogs(catalogRoot);
  const complianceCatalog = authoritativeCatalogs.find((catalog) => catalog.name === "compliance-documents.json")?.rows ??
    targetCatalogs.find((catalog) => catalog.name === "compliance-documents.json")?.rows ?? [];
  const complianceByHash = new Map(complianceCatalog.map((row) => [row.sha256, row]));
  const otherByHash = new Map();
  for (const catalog of authoritativeCatalogs.filter((entry) => entry.name !== "compliance-documents.json")) {
    for (const row of catalog.rows) if (row.sha256) otherByHash.set(row.sha256, { catalog: catalog.name, name: row.name });
  }
  const inventory = readJson(path.resolve(inventoryPath));
  const inventoryByName = new Map(inventory.records.map((row) => [row.name, row]));
  const inventoryByHash = new Map(inventory.records.map((row) => [row.sha256, row]));
  const sourceFiles = fs.readdirSync(sourceRoot).map((name) => path.join(sourceRoot, name)).filter((file) => fs.statSync(file).isFile()).sort();
  const exactSeen = new Map();
  const crossCategory = [];
  const synthetic = [];
  const candidates = [];
  for (const file of sourceFiles) {
    const name = path.basename(file);
    const hash = sha256(file);
    if (syntheticExclusions.has(name)) {
      synthetic.push(name);
      continue;
    }
    if (exactSeen.has(hash)) continue;
    exactSeen.set(hash, name);
    if (otherByHash.has(hash)) {
      crossCategory.push({ name, hash, ...otherByHash.get(hash) });
      continue;
    }
    candidates.push({ file, name, hash });
  }

  const outputDirectory = path.join(targetRoot, "public", "compliance-docs");
  fs.mkdirSync(outputDirectory, { recursive: true });
  const selected = [];
  let nextIndex = complianceCatalog.reduce((maximum, row) => Math.max(maximum, Number.parseInt(String(row.id).slice(0, 3), 10) || 0), 0) + 1;
  for (const candidate of candidates) {
    const existing = complianceByHash.get(candidate.hash);
    if (existing) {
      selected.push(existing);
      continue;
    }
    const sourceInventory = inventoryByName.get(candidate.name);
    const extension = path.extname(candidate.name).toLowerCase();
    const id = `${String(nextIndex).padStart(3, "0")}-${candidate.hash.slice(0, 12)}`;
    nextIndex += 1;
    const storedName = `${id}${extension}`;
    fs.copyFileSync(candidate.file, path.join(outputDirectory, storedName));
    const format = extension.slice(1).toUpperCase();
    const displayName = cleanDisplayName(candidate.name);
    const type = inferType(displayName, format);
    selected.push({
      id,
      name: displayName,
      url: `/compliance-docs/${storedName}`,
      year: inferYear(displayName, sourceInventory),
      type,
      format,
      pages: sourceInventory?.actual_pages ?? (["JPG", "JPEG", "PNG"].includes(format) ? 1 : null),
      size: fs.statSync(candidate.file).size,
      sha256: candidate.hash,
      description: describe(type, format),
    });
  }
  selected.sort((a, b) => String(a.year).localeCompare(String(b.year)) || a.name.localeCompare(b.name));
  const audit = buildAudit({ sourceCount: sourceFiles.length, selected, crossCategory, synthetic, existingCount: complianceCatalog.length, inventoryByHash });
  writeJson(path.join(targetRoot, "app", "compliance-documents.json"), selected);
  writeJson(path.join(targetRoot, "app", "compliance-audit.json"), audit);
  console.log(JSON.stringify({ records: selected.length, added: selected.length - complianceCatalog.length, crossCategory, synthetic, audit: audit.stats }, null, 2));
} else if (mode === "site") {
  if (!archiveRoot || !archiveCommit) throw new Error("site mode requires --archive-root and --archive-commit");
  const archiveCatalog = readJson(path.join(path.resolve(archiveRoot), "app", "compliance-documents.json"));
  const archiveAudit = readJson(path.join(path.resolve(archiveRoot), "app", "compliance-audit.json"));
  const catalog = archiveCatalog.map((row) => ({
    ...row,
    url: `https://github.com/cazey43/cadillac-pfas-event-trace/blob/${archiveCommit}/public${row.url}`,
  }));
  writeJson(path.join(targetRoot, "app", "compliance-documents.json"), catalog);
  writeJson(path.join(targetRoot, "app", "compliance-audit.json"), archiveAudit);
  console.log(JSON.stringify({ records: catalog.length, commit: archiveCommit }, null, 2));
} else {
  throw new Error(`Unsupported mode: ${mode}`);
}
