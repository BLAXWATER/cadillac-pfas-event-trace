import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { loadDocumentRecords } from '../scripts/document-download-integrity.mjs';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('page.tsx', page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let events;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'events') events = node.initializer.elements;
  ts.forEachChild(node, visit);
}
visit(ast);
const property = (node, name) => node.properties.find(p => p.name?.getText(ast) === name)?.initializer;
const value = (node, name) => property(node, name)?.text;
const findEvent = (date, titlePart) => {
  const found = events.filter(e => value(e, 'date') === date && value(e, 'title').includes(titlePart));
  assert.equal(found.length, 1, `${date}: ${titlePart} must appear exactly once`);
  return found[0];
};
const records = await loadDocumentRecords();
const cases = [
  ['2016-01-12', 'American Waste', '039-c677de7c10e6', 1],
  ['2016-01-19', 'Kemira', 'process-site-021-6c2e73d85da0', 4],
  ['2016-03-29', 'JWC quotes', 'process-site-019-1376a072059f', 2],
  ['2016-04-18', 'HESCO', 'process-site-018-26f79914deae', 5],
  ['2016-05-09', 'hauled-waste revenue', 'process-site-023-0fcc5cbb1c14', 19],
  ['2017-11-20', 'Webb', '164-519d4faa6c33', 2],
  ['2019-02-18', 'Mattoon', 'process-site-022-fe153aeaa6d9', 4],
  ['2023-02-06', 'installed in 2016', 'process-site-020-28d1cb87cb36', 2],
];

for (const [date, title, recordId, startPage] of cases) {
  test(`main timeline correctly dates and page-links ${recordId}`, () => {
    const event = findEvent(date, title);
    assert.equal(value(event, 'year'), date.slice(0, 4));
    assert.equal(value(event, 'isoDate'), date);
    const original = records.find(r => r.id === recordId);
    assert.ok(original?.sha256, recordId);
    const sources = property(event, 'sources').elements;
    const source = sources.find(s => s.getText(ast).includes(`${recordId}.pdf`));
    assert.ok(source, `${recordId}: link must use the preserved original`);
    assert.equal(Number(value(source, 'page')), startPage);
    assert.ok(startPage <= original.pages);
  });
}

test('delivery timeline preserves affirmative findings and evidence limits', () => {
  const spill = findEvent('2016-01-12', 'American Waste').getText(ast);
  assert.match(spill, /actual American Waste leachate offloading/);
  assert.match(spill, /10,000 gallons is tanker capacity, not a measured delivery or spill volume/);
  assert.match(spill, /notification call, not a verified delivery-start time/);
  assert.match(spill, /typed letter does not identify the originating landfill/);
  const quote = findEvent('2016-03-29', 'JWC quotes').getText(ast);
  assert.match(quote, /estimates submittals four weeks after order and shipment eight weeks after approval and release/);
  assert.match(quote, /no actual shipment date or carrier/);
  const award = findEvent('2016-04-18', 'HESCO').getText(ast);
  assert.match(award, /\$52,100/);
  assert.match(award, /two HESCO automatic refrigerated wastewater samplers/);
  assert.match(award, /role: "Cross-reference"/);
  assert.match(award, /process-site-020-28d1cb87cb36\.pdf/);
  const budget = findEvent('2016-05-09', 'hauled-waste revenue').getText(ast);
  assert.match(budget, /NPDES permit levels/);
  assert.match(budget, /Class A EQ biosolids/);
  assert.match(budget, /page: 21/);
  assert.match(budget, /does not quantify individual deliveries/);
  const later = findEvent('2023-02-06', 'installed in 2016').getText(ast);
  assert.match(later, /1997/);
  assert.match(later, /retrospective/);
  assert.match(page, /<strong>Missing tickets do not negate documented activity\.<\/strong>/);
  assert.doesNotMatch(page, /former employee confirms|tickets were rarely (kept|completed|filled)/i);
});

test('built timeline displays all eight findings in their proper year bands', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/', { headers: { accept: 'text/html' } }),
    { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  const yearBands = new Map([...html.matchAll(/<section class="year-group" id="year-(\d+)"[\s\S]*?<\/section>/g)].map(m => [m[1], m[0]]));
  for (const [date, title] of cases) {
    const heading = value(findEvent(date, title), 'title').toUpperCase().replaceAll('&', '&amp;');
    assert.ok(yearBands.get(date.slice(0, 4))?.includes(heading), `${date}: ${heading}`);
  }
  assert.match(html, /Missing tickets do not negate documented activity/);
  const dates2016 = [...yearBands.get('2016').matchAll(/<time dateTime="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(dates2016, [...dates2016].sort());
  // Procurement findings do not close the separate load-level evidence queue.
  assert.ok(html.includes('Requirements remain open until a source review confirms that the exact record satisfies them'));
  assert.ok(html.includes('Per-load Wexford leachate manifests'));
});
