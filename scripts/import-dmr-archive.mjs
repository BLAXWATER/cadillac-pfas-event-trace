import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceDir = process.argv[2];
if (!sourceDir) {
  throw new Error("Usage: node scripts/import-dmr-archive.mjs <source-directory>");
}

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "public", "dmr-docs");
const manifestPath = path.join(projectRoot, "app", "dmr-documents.json");
await mkdir(outputDir, { recursive: true });

const entries = (await readdir(sourceDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
  .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));

const documents = [];
for (const [index, entry] of entries.entries()) {
  const sourcePath = path.join(sourceDir, entry.name);
  const digest = createHash("sha256").update(entry.name).digest("hex").slice(0, 10);
  const storedName = `${String(index + 1).padStart(3, "0")}-${digest}.pdf`;
  await copyFile(sourcePath, path.join(outputDir, storedName));

  const years = entry.name.match(/\b(?:19|20)\d{2}\b/g) ?? [];
  const primaryYear = years[0] ?? "Undated";
  const lower = entry.name.toLowerCase();
  const type = lower.includes("dmr-qa") || lower.includes("dmr qa") || lower.includes("dmrqa")
    ? "DMR-QA"
    : lower.includes("fact sheet")
      ? "Fact sheet"
      : lower.includes("summary")
        ? "DMR summary"
        : lower.includes("daily")
          ? "DMR daily"
          : lower.includes("dmr")
            ? "DMR report"
            : "Supporting record";

  documents.push({
    id: `${String(index + 1).padStart(3, "0")}-${digest}`,
    name: entry.name,
    url: `/dmr-docs/${storedName}`,
    year: primaryYear,
    type,
  });
}

await writeFile(manifestPath, `${JSON.stringify(documents, null, 2)}\n`, "utf8");
console.log(`Imported ${documents.length} PDFs into ${outputDir}`);
