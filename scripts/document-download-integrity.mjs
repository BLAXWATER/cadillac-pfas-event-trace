import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("..", import.meta.url));
const appDirectory = path.join(root, "app");
const publicDirectory = path.join(root, "public");

export async function loadDocumentRecords() {
  const files = (await readdir(appDirectory))
    .filter((name) => name.endsWith("-documents.json"))
    .sort();
  const catalogs = await Promise.all(files.map(async (catalog) => ({
    catalog,
    rows: JSON.parse(await readFile(path.join(appDirectory, catalog), "utf8")),
  })));
  return catalogs.flatMap(({ catalog, rows }) => rows.map((row) => ({ catalog, ...row })));
}

export function parsePinnedRepositoryUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }

  const match = parsed.pathname.match(
    /^\/(?:cazey43|BLAXWATER)\/cadillac-pfas-event-trace\/blob\/([0-9a-f]{40})\/public\/(.+)$/i,
  );
  if (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== "github.com" || !match) {
    return undefined;
  }

  const commit = match[1].toLowerCase();
  const repositoryPath = `public/${decodeURIComponent(match[2])}`;
  const rawPath = match[2].split("/").map((segment) => encodeURIComponent(decodeURIComponent(segment))).join("/");
  return {
    commit,
    repositoryPath,
    spec: `${commit}:${repositoryPath}`,
    rawUrl: `https://raw.githubusercontent.com/BLAXWATER/cadillac-pfas-event-trace/${commit}/public/${rawPath}`,
  };
}

function gitBlobMetadata(specs) {
  const result = spawnSync("git", ["cat-file", "--batch-check"], {
    cwd: root,
    encoding: "utf8",
    input: `${specs.join("\n")}\n`,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || "git cat-file failed");
  }
  return result.stdout.trim().split(/\r?\n/);
}

export async function verifyCatalogIntegrity() {
  const records = await loadDocumentRecords();
  const local = records.filter((row) => row.url.startsWith("/"));
  const external = records.filter((row) => !row.url.startsWith("/"));
  const failures = [];

  for (const row of local) {
    const sourcePath = path.join(publicDirectory, ...row.url.slice(1).split("/").map(decodeURIComponent));
    try {
      const sourceStat = await stat(sourcePath);
      const source = await readFile(sourcePath);
      const hash = createHash("sha256").update(source).digest("hex");
      if (sourceStat.size !== row.size) failures.push(`${row.catalog}:${row.id} local size ${sourceStat.size} != ${row.size}`);
      if (hash !== row.sha256) failures.push(`${row.catalog}:${row.id} local SHA-256 mismatch`);
    } catch (error) {
      failures.push(`${row.catalog}:${row.id} local file unavailable: ${error.message}`);
    }
  }

  const parsed = external.map((row) => ({ row, source: parsePinnedRepositoryUrl(row.url) }));
  for (const { row, source } of parsed) {
    if (!source) {
      failures.push(`${row.catalog}:${row.id} is not a pinned repository source`);
      continue;
    }
    const direct = new URL(source.rawUrl);
    if (direct.hostname !== "raw.githubusercontent.com") failures.push(`${row.catalog}:${row.id} does not use direct file delivery`);
    if (direct.hash) failures.push(`${row.catalog}:${row.id} download URL contains a fragment`);
  }

  const valid = parsed.filter(({ source }) => source);
  const metadata = gitBlobMetadata(valid.map(({ source }) => source.spec));
  metadata.forEach((line, index) => {
    const { row, source } = valid[index];
    if (/ missing$/.test(line)) {
      failures.push(`${row.catalog}:${row.id} repository blob is missing (${source.spec})`);
      return;
    }
    const match = line.match(/^[0-9a-f]+ blob (\d+)$/);
    if (!match) {
      failures.push(`${row.catalog}:${row.id} repository object is not a file (${line})`);
      return;
    }
    if (Number(match[1]) !== row.size) failures.push(`${row.catalog}:${row.id} repository size ${match[1]} != ${row.size}`);
  });

  return { records, local, external, failures };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await verifyCatalogIntegrity();
  if (result.failures.length) {
    console.error(`Catalog integrity FAILED: ${result.failures.length} issue(s).`);
    for (const failure of result.failures.slice(0, 25)) console.error(`- ${failure}`);
    if (result.failures.length > 25) console.error(`- ... ${result.failures.length - 25} more`);
    process.exitCode = 1;
  } else {
    console.log(`Catalog integrity passed: ${result.records.length} records (${result.local.length} bundled, ${result.external.length} public archive).`);
  }
}
