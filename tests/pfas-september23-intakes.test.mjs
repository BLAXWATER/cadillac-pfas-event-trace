import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (file) => JSON.parse(fs.readFileSync(new URL('../app/' + file, import.meta.url)));
test('both PFAS intakes retain six batches, full review coverage and existing-source reconciliation', () => {
  const queue = read('upload-review-queue.json');
  for (const [file, pages] of [['pfas-ten-six-batch-audit-2026-09-23.json',56], ['pfas-second-ten-six-batch-audit-2026-09-23.json',105]]) {
    const audit = read(file);
    assert.equal(audit.records.length,10);
    assert.equal(audit.totalPages,pages);
    assert.equal(audit.newDistinctRecords,0);
    assert.deepEqual([...new Set(audit.records.map(r=>r.batch))],[1,2,3,4,5,6]);
    for (const r of audit.records) {
      assert.deepEqual(r.reviewedPages,Array.from({length:r.pages},(_,i)=>i+1));
      assert.equal(r.pageComparisons.length,r.pages);
      assert.ok(r.pageComparisons.every(p=>p.renderEqual));
      assert.ok(r.canonicalAsset);
      assert.ok(queue.items.some(q=>q.name===r.name&&q.sha256===r.sha256&&q.stages.reviewed&&q.stages.cataloged));
    }
  }
});
