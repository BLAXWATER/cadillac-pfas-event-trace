import assert from "node:assert/strict";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const serverRoot = path.join(root, "dist", "server");
const clientAssets = path.join(root, "dist", "client", "assets");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(entryPath)));
    else if (entry.isFile()) files.push(entryPath);
  }

  return files;
}

test("Worker output excludes browser-only preview and document copies", async () => {
  const serverFiles = await walk(serverRoot);
  const serverBrowserOnlyFiles = serverFiles.filter((file) => /\.(?:webp|pdf)$/i.test(file));
  const serverBytes = (
    await Promise.all(serverFiles.map(async (file) => (await stat(file)).size))
  ).reduce((total, size) => total + size, 0);

  assert.deepEqual(serverBrowserOnlyFiles, []);
  assert.ok(serverBytes < 10 * 1024 * 1024, `Worker directory is ${serverBytes} bytes`);

  const clientFiles = await walk(clientAssets);
  assert.ok(
    clientFiles.some((file) => file.toLowerCase().endsWith(".webp")),
    "Browser preview assets must remain published",
  );
  assert.ok(
    clientFiles.filter((file) => file.toLowerCase().endsWith(".pdf")).length >= 5,
    "The five verified intake PDFs must remain downloadable",
  );
});
