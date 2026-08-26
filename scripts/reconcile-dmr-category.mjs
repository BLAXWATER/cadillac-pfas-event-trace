import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const auditPath = process.argv[2];
if (!auditPath) {
  throw new Error("Usage: node scripts/reconcile-dmr-category.mjs <full-category-audit-json>");
}

const projectRoot = process.cwd();
const publicRoot = path.resolve(projectRoot, "public");
const outputDir = path.resolve(publicRoot, "dmr-docs");
const stagingDir = path.resolve(publicRoot, "dmr-docs-next");
if (!outputDir.startsWith(`${publicRoot}${path.sep}`) || !stagingDir.startsWith(`${publicRoot}${path.sep}`)) {
  throw new Error("Refusing to reconcile outside the Site public directory.");
}

const audit = JSON.parse(await readFile(auditPath, "utf8"));
await rm(stagingDir, { recursive: true, force: true });
await mkdir(stagingDir, { recursive: true });

const documents = [];
for (const [index, item] of audit.canonical.entries()) {
  const storedName = `${String(index + 1).padStart(3, "0")}-${item.sha256.slice(0, 12)}.pdf`;
  await copyFile(item.source_path, path.join(stagingDir, storedName));
  documents.push({
    id: `${String(index + 1).padStart(3, "0")}-${item.sha256.slice(0, 12)}`,
    name: item.name,
    url: `/dmr-docs/${storedName}`,
    year: item.year,
    type: item.type,
    pages: item.pages,
    size: item.size,
    sha256: item.sha256,
  });
}

await rm(outputDir, { recursive: true, force: true });
await rename(stagingDir, outputDir);
await writeFile(path.join(projectRoot, "app", "dmr-documents.json"), `${JSON.stringify(documents, null, 2)}\n`, "utf8");

const categoryAudit = {
  methods: [
    "SHA-256 byte comparison",
    "Normalized PDF text comparison",
    "48-DPI rendered-page comparison",
    "Page-count and file-size comparison",
    "Author, creator, producer, creation-date and modification-date metadata comparison",
    "ZIP-entry comparison against loose files",
  ],
  stats: {
    loosePdfsReviewed: audit.summary.loose_pdf_count,
    zipArchivesReviewed: audit.summary.zip_count,
    zipPdfEntriesReviewed: audit.summary.zip_summaries.reduce((total, archive) => total + archive.pdf_entries, 0),
    repeatedLooseCopiesSuppressed: audit.summary.loose_pdf_count - audit.summary.loose_distinct_groups,
    metadataOnlyEquivalentCopiesSuppressed: audit.summary.equivalent_render_duplicate_groups,
    newDistinctRecords: audit.summary.new_distinct_records,
    finalDistinctRecords: audit.summary.final_distinct_count,
  },
  batches: [
    {
      label: "Original collection",
      supplied: 264,
      added: 264,
      duplicates: 0,
      note: "No true duplicates were found; similarly named revisions were retained.",
    },
    {
      label: "2011",
      supplied: 1,
      added: 1,
      duplicates: 0,
      note: "The municipal wastewater survey was distinct from the original collection.",
    },
    {
      label: "Full Category 01 reconciliation",
      supplied: audit.summary.loose_pdf_count,
      added: audit.summary.new_distinct_records,
      duplicates: audit.summary.loose_pdf_count - audit.summary.loose_distinct_groups,
      note: `Consolidated root and year folders; both ZIP archives repeated all ${audit.summary.loose_pdf_count} loose PDFs. Clean source filenames now replace prior duplicate-labelled display names where content matched.`,
    },
  ],
};
await writeFile(path.join(projectRoot, "app", "dmr-audit.json"), `${JSON.stringify(categoryAudit, null, 2)}\n`, "utf8");
console.log(`Reconciled ${audit.summary.loose_pdf_count} supplied PDFs into ${documents.length} distinct published records.`);
