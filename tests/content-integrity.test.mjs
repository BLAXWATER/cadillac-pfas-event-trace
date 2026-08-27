import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const appDirectory = path.join(root, "app");
const publicDirectory = path.join(root, "public");

async function loadCatalogs() {
  const files = (await readdir(appDirectory)).filter((name) => name.endsWith("-documents.json"));
  return Promise.all(files.map(async (name) => ({
    name,
    rows: JSON.parse(await readFile(path.join(appDirectory, name), "utf8")),
  })));
}

test("catalog records are unique and source metadata matches local files", async () => {
  const catalogs = await loadCatalogs();
  const allIds = new Set();
  const allUrls = new Set();
  const allHashes = new Set();
  let localFiles = 0;
  let externalFiles = 0;

  for (const catalog of catalogs) {
    assert.ok(catalog.rows.length > 0, `${catalog.name} is empty`);

    for (const row of catalog.rows) {
      assert.ok(row.id, `${catalog.name} contains a record without an id`);
      assert.ok(row.url, `${catalog.name}:${row.id} has no URL`);
      assert.ok(row.sha256, `${catalog.name}:${row.id} has no SHA-256 value`);
      assert.equal(allIds.has(row.id), false, `duplicate id: ${row.id}`);
      assert.equal(allUrls.has(row.url), false, `duplicate URL: ${row.url}`);
      assert.equal(allHashes.has(row.sha256), false, `duplicate content hash: ${row.sha256}`);
      allIds.add(row.id);
      allUrls.add(row.url);
      allHashes.add(row.sha256);

      if (row.url.startsWith("/")) {
        const sourcePath = path.join(publicDirectory, ...row.url.slice(1).split("/"));
        const sourceStat = await stat(sourcePath);
        const source = await readFile(sourcePath);
        assert.equal(sourceStat.size, row.size, `${catalog.name}:${row.id} size mismatch`);
        assert.equal(createHash("sha256").update(source).digest("hex"), row.sha256, `${catalog.name}:${row.id} hash mismatch`);
        localFiles += 1;
      } else {
        const url = new URL(row.url);
        assert.equal(url.protocol, "https:", `${catalog.name}:${row.id} is not HTTPS`);
        assert.equal(url.hostname, "github.com", `${catalog.name}:${row.id} uses an unexpected archive host`);
        assert.match(url.pathname, /^\/cazey43\/cadillac-pfas-event-trace\/blob\/[0-9a-f]{40}\//, `${catalog.name}:${row.id} is not pinned to a source commit`);
        externalFiles += 1;
      }
    }
  }

  assert.equal(localFiles, 525);
  assert.equal(externalFiles, 261);
});

test("timeline source and preview assets are present", async () => {
  const source = await readFile(path.join(appDirectory, "page.tsx"), "utf8");
  assert.doesNotMatch(source, /Original file not loaded/);

  const literalReferences = [...source.matchAll(/(?:url|preview):\s*["'](\/[^"']+)["']/g)].map((match) => match[1]);
  for (const reference of literalReferences) {
    const target = path.join(publicDirectory, ...reference.slice(1).split("/"));
    assert.ok((await stat(target)).size > 0, `missing or empty timeline asset: ${reference}`);
  }

  const helperReferences = [...source.matchAll(/(?:ippSource|archivedSource)\(\s*"[^"]+"\s*,\s*"([^"]+\.pdf)"/gs)].map((match) => match[1]);
  for (const reference of helperReferences) {
    const fileName = new URL(reference).pathname.split("/").pop().replace(/\.pdf$/i, ".jpg");
    const preview = path.join(publicDirectory, "source-previews", fileName);
    assert.ok((await stat(preview)).size > 0, `missing or empty source preview: ${fileName}`);
  }

  assert.equal(helperReferences.length, 17);
});

test("PFAS archive audit and repaired J19915 source remain consistent", async () => {
  const catalog = JSON.parse(await readFile(path.join(appDirectory, "pfas-documents.json"), "utf8"));
  const audit = JSON.parse(await readFile(path.join(appDirectory, "pfas-audit.json"), "utf8"));
  assert.equal(catalog.length, audit.stats.newDistinctRecords);
  assert.equal(audit.stats.suppliedFiles, 91);
  assert.equal(audit.stats.finalDistinctRecords, 87);
  assert.equal(audit.stats.duplicateCopiesSuppressed, 4);
  assert.equal(audit.stats.ocrReviewedPages, 30);
  assert.equal(catalog.some((row) => /PENDING/.test(row.url)), false);
  assert.equal(catalog.some((row) => /SUPERSEDED|duplicate/i.test(row.name)), false);

  const repairedSource = await readFile(path.join(publicDirectory, "docs", "2019-06-04-j19915-effluent.pdf"));
  assert.equal(
    createHash("sha256").update(repairedSource).digest("hex"),
    "47929ba9f41a9dcd5f3d5d3b9a5d5f63dbb3fcbc5b00dc74e81a0d550e8666fd",
  );
});
