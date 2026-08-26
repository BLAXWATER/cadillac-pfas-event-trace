import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const auditPath = process.argv[2];
if (!auditPath) {
  throw new Error("Usage: node scripts/reconcile-npdes-category.mjs <category-audit-json>");
}

const projectRoot = process.cwd();
const publicRoot = path.resolve(projectRoot, "public");
const outputDir = path.resolve(publicRoot, "npdes-docs");
const stagingDir = path.resolve(publicRoot, "npdes-docs-next");
if (!outputDir.startsWith(`${publicRoot}${path.sep}`) || !stagingDir.startsWith(`${publicRoot}${path.sep}`)) {
  throw new Error("Refusing to reconcile outside the Site public directory.");
}

const audit = JSON.parse(await readFile(auditPath, "utf8"));
await rm(stagingDir, { recursive: true, force: true });
await mkdir(stagingDir, { recursive: true });

const documents = [];
for (const [index, item] of audit.canonical.entries()) {
  const extension = item.extension.toLowerCase();
  if (![".pdf", ".msg"].includes(extension)) {
    throw new Error(`Unsupported canonical extension: ${extension}`);
  }
  const storedName = `${String(index + 1).padStart(3, "0")}-${item.sha256.slice(0, 12)}${extension}`;
  await copyFile(item.source_path, path.join(stagingDir, storedName));
  documents.push({
    id: `${String(index + 1).padStart(3, "0")}-${item.sha256.slice(0, 12)}`,
    name: item.name,
    url: `/npdes-docs/${storedName}`,
    year: item.year,
    type: item.type,
    format: extension === ".pdf" ? "PDF" : "MSG",
    pages: item.pages,
    size: item.size,
    sha256: item.sha256,
  });
}

await rm(outputDir, { recursive: true, force: true });
await rename(stagingDir, outputDir);
await writeFile(path.join(projectRoot, "app", "npdes-documents.json"), `${JSON.stringify(documents, null, 2)}\n`, "utf8");

const totalLoose = audit.summary.loose_pdf_count + audit.summary.loose_msg_count;
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
    looseMessagesReviewed: audit.summary.loose_msg_count,
    zipArchivesReviewed: audit.summary.zip_count,
    zipEntriesReviewed: audit.summary.zip_summaries.reduce((total, archive) => total + archive.supported_entries, 0),
    duplicateCopiesSuppressed: totalLoose - audit.summary.loose_distinct_groups,
    metadataOnlyEquivalentCopiesSuppressed: audit.summary.different_byte_equivalent_groups,
    closeRevisionsRetained: audit.summary.near_revision_pairs_retained,
    finalDistinctRecords: audit.summary.final_distinct_count,
    publishedBytes: audit.summary.published_bytes,
  },
  decisions: [
    {
      name: "#02-NPEDS.zip",
      reason: `All ${audit.summary.zip_summaries[0]?.supported_entries ?? 0} supported entries exactly repeat loose source files; the container is excluded.`,
    },
    {
      name: "10-09-2024 - IU Permit notes_COPY.pdf",
      reason: "Different embedded creation/modification metadata, but identical normalized text and identical rendered pages; one canonical copy is retained.",
    },
    {
      name: `${audit.summary.near_revision_pairs_retained} close document pairs`,
      reason: "High textual similarity but meaningful text or page-render differences; all are retained as distinct revisions.",
    },
  ],
};
await writeFile(path.join(projectRoot, "app", "npdes-audit.json"), `${JSON.stringify(categoryAudit, null, 2)}\n`, "utf8");
console.log(`Reconciled ${totalLoose} supplied files into ${documents.length} distinct Category 02 records.`);
