import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceDir = process.argv[2];
const auditPath = process.argv[3];
const typeOverride = process.argv[4] || null;
if (!sourceDir || !auditPath) {
  throw new Error("Usage: node scripts/import-dmr-year.mjs <source-directory> <audit-json> [record-type]");
}

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "public", "dmr-docs");
const manifestPath = path.join(projectRoot, "app", "dmr-documents.json");
const auditManifestPath = path.join(projectRoot, "app", "dmr-audit.json");
const batchAudit = JSON.parse(await readFile(auditPath, "utf8"));
const documents = JSON.parse(await readFile(manifestPath, "utf8"));
const auditManifest = JSON.parse(await readFile(auditManifestPath, "utf8"));
const batchLabel = path.basename(sourceDir);

await mkdir(outputDir, { recursive: true });

const existingHashes = new Set();
for (const document of documents) {
  const storedPath = path.join(projectRoot, "public", document.url.replace(/^\//, ""));
  const bytes = await readFile(storedPath);
  existingHashes.add(createHash("sha256").update(bytes).digest("hex"));
}

let added = 0;
let duplicates = 0;
for (const fileAudit of batchAudit.files) {
  if (fileAudit.is_existing_duplicate || existingHashes.has(fileAudit.sha256)) {
    duplicates += 1;
    continue;
  }
  const sourcePath = path.join(sourceDir, fileAudit.name);
  const extension = path.extname(fileAudit.name).toLowerCase();
  const storedName = `${batchLabel}-${fileAudit.sha256.slice(0, 12)}${extension}`;
  await copyFile(sourcePath, path.join(outputDir, storedName));
  documents.push({
    id: `${batchLabel}-${fileAudit.sha256.slice(0, 12)}`,
    name: fileAudit.name,
    url: `/dmr-docs/${storedName}`,
    year: batchLabel,
    type: typeOverride ?? "Supporting record",
  });
  existingHashes.add(fileAudit.sha256);
  added += 1;
}

documents.sort((left, right) => `${left.year} ${left.name}`.localeCompare(`${right.year} ${right.name}`, "en", { numeric: true }));
auditManifest.batches.push({
  label: batchLabel,
  supplied: batchAudit.batch_count,
  added,
  duplicates,
  note: duplicates === 0
    ? "All supplied records were distinct from the published archive."
    : "Only confirmed content duplicates were suppressed.",
});

await writeFile(manifestPath, `${JSON.stringify(documents, null, 2)}\n`, "utf8");
await writeFile(auditManifestPath, `${JSON.stringify(auditManifest, null, 2)}\n`, "utf8");
console.log(`DMR ${batchLabel}: ${added} added, ${duplicates} duplicate(s) suppressed.`);
