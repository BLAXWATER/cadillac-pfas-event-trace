import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Avon review preserves source identity, blank detections and uncertainty', () => {
  const records = JSON.parse(readFileSync(new URL('../app/ipp-documents.json', import.meta.url), 'utf8'));
  const matches = records.filter(r => r.id === '044-c1b8c7e5c6e0');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].pages, 22);
  for (const text of ['660', '1.4 J', '3.5', 'QC exceptions', 'paired location', 'nondetect is not zero']) {
    assert.ok(matches[0].description.includes(text), text);
  }
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  const start = page.indexOf('date: "2018-11-07"');
  assert.ok(start > 0);
  const event = page.slice(start, page.indexOf('date: "2018-11-29"', start));
  for (const text of ['190-18036-1', 'field blank', 'QC exceptions', 'not verified midnight', 'December 10', '044-c1b8c7e5c6e0.pdf']) {
    assert.ok(event.includes(text), text);
  }
});
