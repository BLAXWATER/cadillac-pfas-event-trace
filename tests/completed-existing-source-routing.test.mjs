import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const queue = JSON.parse(readFileSync(path.join(root, "app/upload-review-queue.json"), "utf8"));
const previewManifest = JSON.parse(readFileSync(path.join(root, "app/first-page-preview-manifest.json"), "utf8"));
const timelineTargets = new Set([
  "/docs/2014-preinspection.pdf", "/docs/2015-2016-leachate-request.pdf", "/docs/2018-02-20-pfas-ipp-letter.pdf",
  "/docs/2018-05-24-extension-approval.pdf", "/docs/2018-06-27-monitoring-plan.pdf", "/docs/2018-10-03-j17646-leachate.pdf",
  "/docs/2018-11-05-j17993-effluent.pdf", "/docs/2018-11-30-monitoring-plan-update.pdf", "/docs/2019-03-04-report-approval.pdf",
  "/docs/2019-12-pfas-status.pdf",
]);
const catalogFiles = ["biosolids-documents.json", "compliance-documents.json", "correspondence-documents.json", "dmr-documents.json", "form-submission-documents.json", "ipp-documents.json", "lab-documents.json", "npdes-documents.json", "pfas-documents.json", "process-site-documents.json", "reference-documents.json", "supplemental-documents.json", "wexford-documents.json"];
const normalize = (value) => {
  const clean = value.split("#", 1)[0].split("?", 1)[0];
  const marker = clean.indexOf("/public/");
  if (marker >= 0) return clean.slice(marker + 7);
  return new URL(clean, "https://catalog.local").pathname;
};
const catalogAssets = new Set(catalogFiles.flatMap((file) => JSON.parse(readFileSync(path.join(root, "app", file), "utf8"))).map((record) => normalize(record.url)));
const completed = queue.items.filter((item) => item.status === "Completed · existing source");
assert.equal(completed.length, 102, "expected the complete existing-source queue");
for (const item of completed) {
  assert.ok(item.stages.received && item.stages.extractedOrOcr && item.stages.reviewed && item.stages.verified && item.stages.cataloged && item.stages.published, `${item.name}: completed status must have every stage complete`);
  const asset = normalize(item.canonicalAsset);
  assert.ok(catalogAssets.has(asset) || timelineTargets.has(asset), `${item.name}: canonical source is not routed to a catalog or timeline block`);
  const preview = previewManifest[asset];
  assert.ok(preview, `${item.name}: canonical source lacks a first-page preview mapping`);
  assert.ok(existsSync(path.join(root, "public", preview.replace(/^\//, ""))), `${item.name}: first-page preview file is missing`);
}
console.log(`Verified ${completed.length} completed existing-source uploads: routed, fully staged, and preview-backed.`);
