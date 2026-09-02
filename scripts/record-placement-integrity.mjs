import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("..", import.meta.url));
const appDirectory = path.join(root, "app");
const publicDirectory = path.join(root, "public");
const schemaPath = path.join(appDirectory, "library-placement-schema.json");
const pagePath = path.join(appDirectory, "page.tsx");
export const publicManifestPath = path.join(publicDirectory, "record-placement-manifest.json");

function sourcePathPrefix(url) {
  const base = url.split("#", 1)[0];
  if (base.startsWith("/")) return decodeURIComponent(base).split("/").filter(Boolean)[0];
  try {
    const parsed = new URL(base);
    const match = decodeURIComponent(parsed.pathname).match(/\/public\/([^/]+)\//);
    return match?.[1];
  } catch {
    return undefined;
  }
}

export async function verifyRecordPlacement({ writeManifest = false } = {}) {
  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  const pageSource = await readFile(pagePath, "utf8");
  const catalogFiles = (await readdir(appDirectory)).filter((name) => name.endsWith("-documents.json")).sort();
  const failures = [];
  const manifestRecords = [];
  const seenSchemaCatalogs = new Set();
  const seenArchiveIds = new Set();
  const seenSectionIds = new Set();
  const seenRecordIds = new Set();

  for (const placement of schema) {
    if (seenSchemaCatalogs.has(placement.catalog)) failures.push(`catalog is assigned to more than one block: ${placement.catalog}`);
    if (seenArchiveIds.has(placement.archiveId)) failures.push(`archive id is duplicated: ${placement.archiveId}`);
    if (seenSectionIds.has(placement.sectionId)) failures.push(`section id is duplicated: ${placement.sectionId}`);
    seenSchemaCatalogs.add(placement.catalog);
    seenArchiveIds.add(placement.archiveId);
    seenSectionIds.add(placement.sectionId);

    if (!catalogFiles.includes(placement.catalog)) {
      failures.push(`placement block ${placement.archiveId} references missing catalog ${placement.catalog}`);
      continue;
    }

    const records = JSON.parse(await readFile(path.join(appDirectory, placement.catalog), "utf8"));
    const sectionMarker = `data-archive-id="${placement.archiveId}"`;
    const sectionStart = pageSource.indexOf(sectionMarker);
    if (sectionStart < 0) {
      failures.push(`${placement.archiveId} has no visible section marker`);
    } else {
      const nextSection = pageSource.indexOf('<section className="document-library', sectionStart + sectionMarker.length);
      const sectionSource = pageSource.slice(sectionStart, nextSection < 0 ? undefined : nextSection);
      if (!sectionSource.includes(`aria-labelledby="${placement.sectionId}"`)) failures.push(`${placement.archiveId} is connected to the wrong heading`);
      if (!sectionSource.includes(`{${placement.renderCollection}.map((document) => (`)) failures.push(`${placement.archiveId} renders the wrong catalog collection`);
      if (!sectionSource.includes("data-record-id={document.id}")) failures.push(`${placement.archiveId} does not expose record placement markers`);
    }

    for (const record of records) {
      if (seenRecordIds.has(record.id)) failures.push(`record is assigned to more than one block: ${record.id}`);
      seenRecordIds.add(record.id);
      const prefix = sourcePathPrefix(record.url);
      if (!prefix || !placement.pathPrefixes.includes(prefix)) {
        failures.push(`${placement.catalog}:${record.id} is stored under ${prefix ?? "an invalid path"}, expected ${placement.pathPrefixes.join(" or ")}`);
      }
      manifestRecords.push({
        id: record.id,
        archiveId: placement.archiveId,
        archiveLabel: placement.label,
        catalog: placement.catalog,
        sectionId: placement.sectionId,
        name: record.name,
        url: record.url,
        sha256: record.sha256,
        size: record.size,
      });
    }
  }

  for (const catalog of catalogFiles) {
    if (!seenSchemaCatalogs.has(catalog)) failures.push(`catalog is not assigned to a visible block: ${catalog}`);
  }
  for (const placement of schema) {
    const pageRegistryPattern = new RegExp(`\\{ id: "${placement.archiveId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}", label: "${placement.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}", documents: `);
    if (!pageRegistryPattern.test(pageSource)) failures.push(`${placement.archiveId} is missing or mislabeled in complete-library search`);
  }

  manifestRecords.sort((a, b) => a.archiveId.localeCompare(b.archiveId) || a.id.localeCompare(b.id));
  const manifest = {
    version: 1,
    recordCount: manifestRecords.length,
    archiveCount: schema.length,
    archives: schema.map((placement) => ({
      archiveId: placement.archiveId,
      label: placement.label,
      catalog: placement.catalog,
      sectionId: placement.sectionId,
      count: manifestRecords.filter((record) => record.archiveId === placement.archiveId).length,
    })),
    records: manifestRecords,
  };

  if (writeManifest && failures.length === 0) {
    await writeFile(publicManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }
  return { schema, manifest, failures };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await verifyRecordPlacement({ writeManifest: process.argv.includes("--write-manifest") });
  if (result.failures.length) {
    console.error(`Record placement integrity FAILED: ${result.failures.length} issue(s).`);
    for (const failure of result.failures.slice(0, 50)) console.error(`- ${failure}`);
    if (result.failures.length > 50) console.error(`- ... ${result.failures.length - 50} more`);
    process.exitCode = 1;
  } else {
    console.log(`Record placement integrity passed: ${result.manifest.recordCount} records in ${result.manifest.archiveCount} visible archive blocks.`);
  }
}
