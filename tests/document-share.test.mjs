import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ appType: 'custom', configFile: false, root, resolve: { alias: { '@': root } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { documentShareUrl, shareDocumentLink } = await vite.ssrLoadModule('/app/document-share.ts');
const { sourceDownloadUrl } = await vite.ssrLoadModule('/app/source-media.ts');
const { DocumentShareButton } = await vite.ssrLoadModule('/app/document-share-button.tsx');
const origin = 'https://cadillac-pfas-event-trace.icons-7120.chatgpt.site';

test('share resolves the exact document to an absolute URL, not the page or a preview', () => {
  for (const suffix of ['pdf','csv','xlsx','docx','zip','png']) {
    const path = `/assets/original-document.${suffix}`;
    assert.equal(documentShareUrl(path, origin), origin + path);
  }
  assert.equal(documentShareUrl('/assets/My Report – 2019.pdf', origin), origin + '/assets/My%20Report%20%E2%80%93%202019.pdf');
  assert.equal(documentShareUrl('/assets/My%20Report.pdf', origin), origin + '/assets/My%20Report.pdf');
  assert.equal(documentShareUrl('https://www.epa.gov/example.pdf',origin),'https://www.epa.gov/example.pdf');
  const sha='be4c2d5dadbb16835a539e8509ac065d560bb055';
  const download=sourceDownloadUrl(`https://github.com/BLAXWATER/cadillac-pfas-event-trace/blob/${sha}/public/docs/report.pdf#page=3`,'PDF',u=>u);
  assert.equal(documentShareUrl(download,origin),`https://raw.githubusercontent.com/BLAXWATER/cadillac-pfas-event-trace/${sha}/public/docs/report.pdf`);
});

test('share refuses local-only, credential-bearing and non-web URLs', () => {
  for (const url of ['javascript:alert(1)','data:text/plain,secret','file:///C:/private.pdf','https://user:secret@example.com/doc.pdf','http://localhost:5173/a.pdf','http://127.0.0.1/a.pdf','http://[::1]/a.pdf']) assert.equal(documentShareUrl(url,origin),undefined,url);
  assert.equal(documentShareUrl('/assets/report.pdf','http://127.0.0.1:5173'),undefined);
});

test('native sharing is called immediately with document name and exact URL', async () => {
  const data={title:'Original report.pdf',url:origin+'/assets/report.pdf'};
  let called=false;
  const result=shareDocumentLink(data,{share:async payload=>{called=true;assert.deepEqual(payload,data);},writeText:async()=>assert.fail('native share must not copy')});
  assert.equal(called,true,'retain user activation without an earlier async task');
  assert.equal(await result,'shared');
});

test('cancelled native share does not silently copy or retry', async () => {
  const result=await shareDocumentLink({title:'Report',url:origin+'/report.pdf'},{share:async()=>{throw {name:'AbortError'};},writeText:async()=>assert.fail('cancel means cancel')});
  assert.equal(result,'cancelled');
});

test('unavailable or denied native sharing falls back to verified clipboard success', async () => {
  const data={title:'Report',url:origin+'/report.pdf'};
  for (const native of [{},{canShare:()=>false,share:async()=>assert.fail('unsupported')},{share:async()=>{throw {name:'NotAllowedError'};}},{canShare:()=>{throw Error('blocked');},share:async()=>assert.fail('blocked')}]) {
    let copied;
    assert.equal(await shareDocumentLink(data,{...native,writeText:async text=>{copied=text;}}),'copied');
    assert.equal(copied,data.url);
  }
});

test('clipboard rejection or absence asks for manual copying, never false success', async () => {
  const data={title:'Report',url:origin+'/report.pdf'};
  assert.equal(await shareDocumentLink(data,{}),'manual');
  assert.equal(await shareDocumentLink(data,{writeText:async()=>{throw Error('denied');}}),'manual');
});

test('one shared, accessible viewer control covers every existing Download location', async () => {
  const page=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
  const component=await readFile(new URL('../app/document-share-button.tsx',import.meta.url),'utf8');
  const html=renderToStaticMarkup(React.createElement(DocumentShareButton,{name:'Report.pdf',downloadUrl:'/assets/report.pdf'}));
  assert.match(html,/aria-label="Share Report.pdf"/);
  assert.match(html,/type="button"/);
  assert.match(html,/role="status" aria-live="polite"/);
  assert.equal((page.match(/download=\{/g)??[]).length,1,'all downloads use the single viewer');
  assert.match(page,/href=\{selectedDownloadUrl\}[\s\S]*?<DocumentShareButton key=\{`\$\{selectedDownloadUrl\}-\$\{selected.name\}`\} name=\{selected.name\} downloadUrl=\{selectedDownloadUrl\}/);
  assert.match(component,/if \(busy.current\) return/);
  assert.match(component,/disabled=\{pending\}/);
  assert.match(component,/readOnly value=\{manualUrl\}/);
  assert.match(component,/currentTarget.select\(\)/);
  assert.doesNotMatch(component,/window.location.href|navigator.clipboard.writeText\(window/);
});
