import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const appDir = path.resolve('app');
const auditFiles = fs.readdirSync(appDir)
  .filter((name) => /^epa-docs-six-batch-intake-audit(?:-b\d+)?-2026-09-23\.json$/.test(name))
  .sort();

assert.equal(auditFiles.length, 6, 'all six EPA intake audits must be present');

for (const filename of auditFiles) {
  const audit = JSON.parse(fs.readFileSync(path.join(appDir, filename), 'utf8'));
  for (const record of audit.records) {
    if (record.statuses?.published !== false) continue;
    assert.match(
      record.disposition,
      /^exact-(?:existing|duplicate)/,
      `${filename}: only exact duplicate documents may remain published:false (${record.supplied})`,
    );
  }
}

console.log('EPA intake publication statuses verified: distinct records are published; false is reserved for exact duplicates.');
