import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { loadDocumentRecords } from '../scripts/document-download-integrity.mjs';

const source = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let events;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'events') events = node.initializer.elements;
  ts.forEachChild(node, visit);
}
visit(ast);
const property = (node, name) => node.properties.find(p => p.name?.getText(ast) === name)?.initializer;
const value = (node, name) => property(node, name)?.text;
const cases = [
  ['2015-10-21', 'Cedar Creek raises RAP', '105-b03fe8433176', 2],
  ['2017-04-05', 'Cedar Creek reports', '134-3dc615cfcf9c', 8],
  ['2017-11-01', 'Wexford votes 8–1', '044-7c628f229e98', 6],
  ['2020-09-21', 'EGLE requires Cedar Creek', '014-990955a02a90', 14],
  ['2020-10-13', 'PFAS agenda item', '014-990955a02a90', 13],
];
const findEvent = (date, title) => {
  const found = events.filter(e => value(e, 'date') === date && value(e, 'title').startsWith(title));
  assert.equal(found.length, 1, `${date}: unique event`);
  return found[0];
};
const records = await loadDocumentRecords();
for (const [date, title, id, startPage] of cases) {
  test(`Wexford evidence: correct date and original page for ${date}`, () => {
    const e = findEvent(date, title);
    assert.equal(value(e, 'year'), date.slice(0, 4));
    assert.equal(value(e, 'isoDate'), date);
    const original = records.find(r => r.id === id);
    assert.ok(original?.sha256);
    const s = property(e, 'sources').elements.find(s => s.getText(ast).includes(`${id}.pdf`));
    assert.ok(s);
    assert.equal(Number(value(s, 'page')), startPage);
    assert.ok(startPage <= original.pages);
  });
}

test('Wexford evidence separates statements, motion, proposal and monitoring', () => {
  const text = (date, title) => findEvent(date, title).getText(ast);
  assert.match(text('2015-10-21', 'Cedar Creek raises'), /attributed statements, not the executed host agreement/);
  assert.match(text('2017-04-05', 'Cedar Creek reports'), /public-comment time not stated/);
  assert.match(text('2017-11-01', 'Wexford votes'), /not final adoption/);
  assert.match(text('2017-11-01', 'Wexford votes'), /Hilty voting against/);
  const sampling = text('2020-09-21', 'EGLE requires');
  assert.match(sampling, /February 3, 2021/);
  assert.match(sampling, /TP001 Plant Tap \(Well No\. 1 and 2\)/);
  assert.match(sampling, /does not specify which alternative applied/);
  assert.match(sampling, /not completed sampling, a PFAS exceedance/);
  const proposal = text('2020-10-13', 'PFAS agenda item');
  assert.match(proposal, /250–300 tons/);
  assert.match(proposal, /\$0\.65 per ton to the County and \$0\.60 per ton to Cedar Creek Township/);
  assert.match(proposal, /not an approval, shipment ticket, payment record or proof of completed delivery/);
  assert.match(proposal, /landfill—not Cadillac WWTP/);
  assert.match(proposal, /pages 2–4 are marked DRAFT/);
});

test('expanded 2020 summary preserves original identity and budget limits', () => {
  const r = records.find(r => r.id === '014-990955a02a90');
  assert.equal(r.sha256, '990955a02a90f01cdb9c8007db2e9056fd217c571a6b7af11bc54048b3c4a91f');
  assert.equal(r.pages, 15);
  assert.equal(r.size, 976468);
  assert.match(r.description, /\$57,400 estimated, \$31,538\.47 remaining/);
  assert.match(r.description, /invoice-reference deductions, not original invoices or proof of payment or leachate hauling/);
  assert.match(r.description, /August 13, 2019 cover-letter date/);
  assert.match(r.description, /pages 2–4 are marked DRAFT/);
});

test('built Wexford findings appear once in their correct year bands', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const response = await worker.fetch(new Request('http://localhost/', { headers: { accept: 'text/html' } }),
    { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  const yearBands = new Map([...html.matchAll(/<section class="year-group" id="year-(\d+)"[\s\S]*?<\/section>/g)].map(m => [m[1], m[0]]));
  for (const [date, title] of cases) {
    const heading = value(findEvent(date, title), 'title').toUpperCase();
    assert.equal(html.split(heading).length - 1, 1);
    assert.ok(yearBands.get(date.slice(0, 4))?.includes(heading));
  }
  assert.match(html, /Missing tickets do not negate documented activity/);
  assert.match(html, /Per-load Wexford leachate manifests/);
});
