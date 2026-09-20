import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,cacheDir:`${root}/.sites-runtime/test-cache/document-controls`,optimizeDeps:{noDiscovery:true,include:[]},resolve:{alias:{'@':root}},server:{middlewareMode:true,hmr:false}});
after(()=>vite.close());
const {downloadDocumentFile,documentDownloadFilename}=await vite.ssrLoadModule('/app/document-download.ts');
const {DocumentDownloadButton}=await vite.ssrLoadModule('/app/document-download-button.tsx');
const {documentPreviewCaption}=await vite.ssrLoadModule('/app/document-controls.ts');

test('save preserves the original bytes and filename for every supported format',async()=>{
  for(const format of ['pdf','csv','tsv','txt','geojson','png','jpg','xlsx','xls','doc','docx','msg','zip','html']) {
    const url=`https://raw.githubusercontent.com/BLAXWATER/cadillac-pfas-event-trace/${'a'.repeat(40)}/public/docs/file.${format}`;
    const bytes=new Uint8Array([0,1,128,255,10]); let saved;
    await downloadDocumentFile(url,`Original – ${format}.${format}`,{
      fetch:async(source,options)=>{assert.equal(source,url);assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');return new Response(bytes);},
      save:(blob,name)=>{saved={blob,name};},
    });
    assert.equal(saved.name,`Original – ${format}.${format}`);
    assert.deepEqual(new Uint8Array(await saved.blob.arrayBuffer()),bytes);
  }
});

test('failed, interrupted, denied and empty responses never create a download',async()=>{
  for(const fetch of [async()=>new Response('missing',{status:404}),async()=>new Response(null),async()=>{throw Error('CORS denied');},async()=>new Response(new ReadableStream({start(c){c.error(Error('interrupted'));}}))]) {
    await assert.rejects(downloadDocumentFile('/assets/source.pdf','source.pdf',{fetch,save:()=>assert.fail('must not save failure')}));
  }
});

test('timeline citations and descriptive titles save with usable document extensions', async()=>{
  assert.equal(documentDownloadFilename('Cadillac WWTP SIU Information.pdf · page 4','/assets/source.pdf'),'Cadillac WWTP SIU Information.pdf');
  assert.equal(documentDownloadFilename('District Compliance File.pdf · pages 93–94','/assets/source.pdf'),'District Compliance File.pdf');
  assert.equal(documentDownloadFilename('2015-12-21 City incident notification — Grease B Gone discharge','/assets/source.pdf'),'2015-12-21 City incident notification — Grease B Gone discharge.pdf');
  assert.equal(documentDownloadFilename('Original_file_2019.PDF','/assets/source.pdf'),'Original_file_2019.PDF');
  let saved;
  await downloadDocumentFile('/assets/source.pdf','Leachate revenue highlights, PDF page 21',{
    fetch:async()=>new Response(new Uint8Array([37,80,68,70])),
    save:(_blob,name)=>{saved=name;},
  });
  assert.equal(saved,'Leachate revenue highlights, PDF page 21.pdf');
});

test('download control remains on the portal and cleans up local Blob URLs',async()=>{
  const html=renderToStaticMarkup(React.createElement(DocumentDownloadButton,{name:'Original.pdf',downloadUrl:'/assets/original.pdf'}));
  assert.match(html,/aria-label="Download Original.pdf"/);
  assert.match(html,/type="button"/);
  assert.match(html,/role="status"/);
  const src=await readFile(new URL('../app/document-download-button.tsx',import.meta.url),'utf8');
  assert.match(src,/link.download = filename/);
  assert.match(src,/URL.createObjectURL\(blob\)/);
  assert.match(src,/URL.revokeObjectURL\(url\)/);
  assert.match(src,/if \(controller.current\) return/);
  assert.doesNotMatch(src,/return \(\) => controller.current\?\.abort/);
  assert.match(src,/window.clearTimeout\(timeout\)/);
  assert.match(src,/fallback\.target = "_blank"/);
  assert.match(src,/fallback\.rel = "noopener noreferrer"/);
  assert.match(src,/The original opened in a new tab/);
  assert.doesNotMatch(src,/window.open|location.href/);
  assert.equal(documentDownloadFilename('path/a\\b\r\n.pdf'),'path_a_b__.pdf');
});

test('labels track actual preview page, not a later cited page',async()=>{
  assert.equal(documentPreviewCaption({format:'PDF',page:93}),'Page 1 preview');
  for(const page of [2,5,13,22])assert.equal(documentPreviewCaption({format:'PDF',page:99,previewPage:page}),`Page ${page} preview`);
  assert.equal(documentPreviewCaption({format:'PNG'}),'Original source image');
  assert.match(documentPreviewCaption({format:'XLSX'}),/Content excerpt/);
  const src=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
  for(const page of [2,5,13,22])assert.match(src,new RegExp(`056-7c7c68a98555-p${page}\\.jpg"\\),\\s*previewPage: ${page}`));
  const image=await readFile(new URL('../app/document-preview-image.tsx',import.meta.url),'utf8');
  assert.match(image,/onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(image,/Preview image could not load/);
});

test('preview layout allows multiline statuses without clipping and uses a contrasting error panel',async()=>{
  const css=await readFile(new URL('../app/globals.css',import.meta.url),'utf8');
  assert.match(css,/\.document-dialog \{[^}]*grid-template-rows: auto minmax\(0, 1fr\)/);
  assert.match(css,/\.document-frame \{[^}]*height: auto/);
  assert.match(css,/\.document-preview-page \.unsupported-document \{[^}]*background: #050708; color: #e8eef5/);
});
