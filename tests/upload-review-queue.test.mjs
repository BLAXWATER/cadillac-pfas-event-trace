import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const queue = JSON.parse(readFileSync(new URL("../app/upload-review-queue.json", import.meta.url), "utf8"));
const items = queue.items;

assert.deepEqual(items.map((item) => item.position), items.map((_, index) => index + 1), "queue positions must be stable and sequential");
assert.equal(items[0].lane, "current", "the first supplied record must remain the current review");
assert.equal(items[0].stages.reviewed, false, "the 691-page Rexair record must not be overstated as reviewed");
assert.equal(items[0].stages.verified, false, "the 691-page Rexair record must not be overstated as verified");
assert.equal(items[3].sha256, items[1].sha256, "the contract close-out alias must retain its exact-file tie to queue item 02");
assert.match(items[3].status, /Matched file 02/, "the exact-file alias must be identified visibly");
assert.equal(items[4].stages.published, true, "the already cataloged Kysor review must remain resolved");
assert.equal(items[5].pages, 416, "the Northernaire Phase 2 record must retain its complete page count");
assert.equal(items[6].pages, 94, "the incoming Northernaire five-year review must retain its supplied page count");
assert.match(items[6].status, /possible catalog match/, "the non-identical 94-page review must remain a comparison candidate");

for (const item of items) {
  assert.equal(item.sha256.length, 64, `${item.name} must have a complete SHA-256`);
  assert.ok(item.pages > 0 && item.bytes > 0, `${item.name} must retain page and byte counts`);
  assert.ok(!item.stages.cataloged || item.stages.verified, `${item.name} cannot be cataloged before verification`);
  assert.ok(!item.stages.published || item.stages.cataloged, `${item.name} cannot be published before cataloging`);
}

console.log(`Upload review queue verified: ${items.length} ordered records with separate stage states.`);
