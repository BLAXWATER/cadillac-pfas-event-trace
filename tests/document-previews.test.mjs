import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer } from 'vite';
const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(readFileSync(path.join(root,'app/first-page-preview-manifest.json')));
const other = JSON.parse(readFileSync(path.join(root,'app/nonpdf-preview-manifest.json')));
const provenance = JSON.parse(readFileSync(path.join(root,'app/document-preview-provenance.json')));
function key(url) {
  return decodeURIComponent(new URL(url,'https://site.invalid').pathname).replace(/^.*\/public\//,'/');
}
test('every catalog document has a bundled source-derived image', () => {
  let count = 0;
  for (const file of readdirSync(path.join(root,'app')).filter(f=>f.endsWith('-documents.json'))) {
    for (const doc of JSON.parse(readFileSync(path.join(root,'app',file)))) {
      const p=key(doc.url);
      const preview=manifest[p] ?? other[p]?.preview;
      assert.ok(preview, `Missing preview: ${doc.name}`);
      if (other[p]) assert.equal(other[p].sourceSha256,doc.sha256);
      if (manifest[p]) {
        assert.equal(provenance[p]?.sourceSha256,doc.sha256, `Unverified source: ${doc.name}`);
        assert.equal(provenance[p]?.preview,preview, `Provenance points to another preview: ${doc.name}`);
        assert.equal(provenance[p]?.page,1);
      }
      const image=path.join(root,'public',preview);
      assert.ok(existsSync(image), `Missing image: ${image}`);
      const bytes=readFileSync(image);
      assert.equal(bytes.toString('ascii',0,4),'RIFF');
      assert.equal(bytes.toString('ascii',8,12),'WEBP');
      count++;
    }
  }
  const placement = JSON.parse(readFileSync(path.join(root,'public/record-placement-manifest.json')));
  assert.equal(count,placement.recordCount);
});
test('1988 study preview is derived from its original', () => {
  assert.ok(manifest['/findings-docs/1988-cadillac-ri-234880.pdf']);
  const provenance=JSON.parse(readFileSync(path.join(root,'app/document-preview-provenance.json')));
  assert.equal(provenance['/findings-docs/1988-cadillac-ri-234880.pdf'].page,1);
});
test('every catalog URL resolves through the actual shared runtime preview resolver', async () => {
  const vite = await createServer({ configFile: false, root, appType: 'custom', server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const { bundledFirstPagePreview } = await vite.ssrLoadModule('/app/bundled-public-assets.ts');
    const failures = [];
    for (const file of readdirSync(path.join(root, 'app')).filter(f => f.endsWith('-documents.json'))) {
      for (const doc of JSON.parse(readFileSync(path.join(root, 'app', file)))) {
        if (!doc.preview && !bundledFirstPagePreview(doc.url)) failures.push(doc.name);
      }
    }
    assert.deepEqual(failures, []);
    const url = 'https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/1fb4ab511dabbf1e1589643afad50b72ae9fc926/public/findings-docs/218-0a9bdc712747.pdf';
    assert.ok(bundledFirstPagePreview(url + '#page=1'));
  } finally { await vite.close(); }
});
test('page-view dialog uses the shared preview resolver, including original images', () => {
  const page=readFileSync(path.join(root,'app/page.tsx'),'utf8');
  assert.match(page,/src=\{selectedPreviewUrl\}/);
  assert.match(page,/sourcePreviewUrl\(selected\)/);
});
