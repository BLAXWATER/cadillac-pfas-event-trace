import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { loadDownloadDeliveryPlan } from "../scripts/document-download-integrity.mjs";
const json = async file => JSON.parse(await readFile(new URL("../app/" + file, import.meta.url), "utf8"));
const audit = await json("wexford-plans-review-20260914.json");

test("review ranges cover every supplied page exactly once without equating review and strict verification", () => {
  assert.equal(audit.status.strictFullyVerified, false);
  for (const record of audit.records) {
    const pages = record.coverage.flatMap(range => Array.from({length: range.to-range.from+1}, (_,i) => range.from+i));
    assert.deepEqual(pages, Array.from({length:record.pages},(_,i)=>i+1));
    assert(record.unresolved.length > 0);
  }
});

test("originals are byte-preserved and both have bundled delivery", async () => {
  const deliveries = await loadDownloadDeliveryPlan();
  for (const record of audit.records) {
    const match = deliveries.filter(d => d.row.id === record.recordId);
    assert.equal(match.length,1);
    assert.equal(match[0].kind,"bundled");
    const bytes = await readFile(new URL("../public"+match[0].publicPath,import.meta.url));
    assert.equal(bytes.length, record.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),record.sha256);
  }
});

test("preview and supplied-filename provenance agree with the originals", async () => {
  const aliases = await json("verified-filename-aliases.json");
  const previews = await json("document-preview-provenance.json");
  const manifest = await json("first-page-preview-manifest.json");
  const deliveries = await loadDownloadDeliveryPlan();
  for(const record of audit.records) {
    const {publicPath}=deliveries.find(d=>d.row.id===record.recordId);
    assert.equal(aliases[record.recordId].sha256,record.sha256);
    assert(aliases[record.recordId].aliases.includes(record.suppliedPath.split("/").at(-1)));
    assert.equal(previews[publicPath].sourceSha256,record.sha256);
    assert.equal(previews[publicPath].page,1);
    assert.equal(previews[publicPath].preview,manifest[publicPath]);
  }
});

test("new events retain proposal, approval and planning boundaries and exact page references", async () => {
  const {events} = await json("solid-waste-plan-findings.json");
  for(const date of ["2000-01-25","2002-03-07","2004-05-19"]) {
    const found=events.filter(e=>e.isoDate===date);
    assert.equal(found.length,1);
    assert(found[0].significance.length>100);
    for(const source of found[0].sources)assert(source.page>0 && source.page<=source.pages);
  }
  const agreement = events.filter(e=>e.isoDate==="1995-09-19");
  assert.equal(agreement.length,1);
  assert(agreement[0].sources.some(s=>s.recordId==="110-fb263b3ea6c1"));
  assert.equal(events.find(e=>e.isoDate==="2004-05-19").sources[0].page,102);
});
