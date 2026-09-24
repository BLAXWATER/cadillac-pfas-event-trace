import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const defaultSource =
  "C:/Users/casey/Documents/Codex/2026-09-01/referenced-chatgpt-conversation-this-is-an-2/outputs/WEX_NEW_ORIGINALS_2026-09-09";
const sourceRoot = path.resolve(process.argv[2] ?? defaultSource);
const outputPath = path.resolve(
  process.argv[3] ?? path.join(repositoryRoot, "output", "eight-batch-audit.json"),
);

const batchDefinitions = [
  ["01_EGLE_Leachate", "01_EGLE_61366/01_Leachate"],
  ["02_EGLE_Permit", "01_EGLE_61366/02_Permit"],
  ["03_EGLE_Hearing", "01_EGLE_61366/03_Hearing"],
  ["04_EGLE_Email", "01_EGLE_61366/04_Email"],
  ["05_EGLE_Well_Test", "01_EGLE_61366/05_Well_Test"],
  ["06_EGLE_Operations", "01_EGLE_61366/06_Operations"],
  ["07_EGLE_2020_MOR", "01_EGLE_61366/07_2020_MOR"],
  ["08_Cadillac_Wexford_Corporate", "."],
];

async function walk(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(target)));
    else if (entry.isFile()) found.push(target);
  }
  return found;
}

function portable(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function digest(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

const results = [];
for (const [batch, relativeDirectory] of batchDefinitions) {
  const directory = path.resolve(sourceRoot, relativeDirectory);
  let files = await walk(directory);
  if (batch === "08_Cadillac_Wexford_Corporate") {
    files = files.filter((file) => !path.relative(sourceRoot, file).startsWith(`01_EGLE_61366${path.sep}`));
  }
  const rows = [];
  for (const file of files.sort((a, b) => a.localeCompare(b))) {
    const data = await readFile(file);
    const relative =
      batch === "08_Cadillac_Wexford_Corporate"
        ? path.relative(sourceRoot, file)
        : path.relative(path.dirname(directory), file);
    rows.push({
      filename: portable(relative),
      bytes: (await stat(file)).size,
      sha256: digest(data),
    });
  }
  results.push({
    batch,
    archive: null,
    recoveredFrom: "preserved WEX_NEW_ORIGINALS_2026-09-09 tree",
    crc_error: null,
    count: rows.length,
    files: rows,
  });
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
console.log(`Rebuilt ${results.length} batches and ${results.reduce((sum, batch) => sum + batch.count, 0)} records at ${outputPath}`);
