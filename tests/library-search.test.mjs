import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import ts from 'typescript';
import { documentSummary } from '../app/document-summary.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ appType:'custom', configFile:false, root, server:{middlewareMode:true} });
after(() => vite.close());
const search = await vite.ssrLoadModule('/app/library-search.ts');
const { formatSourceDisplayName } = await vite.ssrLoadModule('/app/source-display-name.ts');
const aliases = JSON.parse(await readFile(new URL('../app/verified-filename-aliases.json',import.meta.url),'utf8'));
const fixtures = JSON.parse(await readFile(new URL('./fixtures/filename-alias-regressions.json',import.meta.url),'utf8'));
const source = await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');
const ast = ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let registry, searchSection;
const visit = (node) => {
  if(ts.isVariableDeclaration(node) && node.name.getText(ast)==='libraryArchives') registry=node.initializer;
  if(ts.isJsxElement(node) && node.openingElement.attributes.properties.some(p=>p.name?.text==='id' && p.initializer?.text==='record-search')) searchSection=node;
  ts.forEachChild(node,visit);
}; visit(ast);
const catalogs = new Map();
for(const filename of (await readdir(new URL('../app/',import.meta.url))).filter(f=>f.endsWith('-documents.json'))) {
  const variable=filename.replace(/-documents\.json$/,'').replace(/-([a-z])/g,(_,c)=>c.toUpperCase())+'Documents';
  catalogs.set(variable,JSON.parse(await readFile(new URL('../app/'+filename,import.meta.url),'utf8')));
}
const records=registry.elements.flatMap(entry=>{
  const prop=(name)=>entry.properties.find(p=>p.name?.getText(ast)===name).initializer;
  return catalogs.get(prop('documents').getText(ast)).map(r=>({...r,archive:prop('label').text,archiveId:prop('id').text}));
});
const index=search.createLibrarySearchIndex(records,aliases);
const ids=(query)=>search.searchLibrary(index,query).map(r=>r.id);

test('J19915 uploaded filename and laboratory job retrieve one newly indexed existing report',()=>{
 for(const q of ['ORIGINAL-J19915-1 UDS Level 2 Report Final Report.pdf','J19915-1 UDS Level 2 Report Final Report.pdf','190-19915-1'])assert.equal(ids(q)[0],'lab-091-c2427c56e094',q);
 assert.equal(ids('ORIGINAL-J19915-1 UDS Level 2 Report Final Report.pdf').filter(id=>id==='lab-091-c2427c56e094').length,1);
});

test('September 8 LDFA and N3862 upload filenames retrieve the reviewed originals',()=>{
  assert.equal(ids('LDFA Minutes 12-8-21 - Fight being held accountable.pdf')[0],'194-e0ad50e1248b');
  assert.equal(ids('N3862 Staff Report 11-01-22.pdf')[0],'006-0f46024ab583');
  assert.equal(ids('N3862_SAR_20151118.pdf')[0],'111-d8141f278b56');
});

test('every filename in the reconciled A12–A24 manifest finds its existing document', async()=>{
  const manifest=JSON.parse(await readFile(new URL('../app/manifest-a12-a24-recheck.json',import.meta.url),'utf8'));
  for(const row of manifest.records) assert.equal(ids(row.filename)[0],row.recordId,row.filename);
});

test('search registry includes each catalog row exactly once; aliases do not inflate count',()=>{
  assert.equal(registry.elements.length,catalogs.size);
  assert.equal(records.length,1627);
  assert.equal(index.length,records.length);
  assert.equal(new Set(records.map(r=>r.id)).size,1627);
  assert.equal(new Set(records.map(r=>r.sha256)).size,1627);
});

test('all stored canonical and displayed filenames retrieve their own record',()=>{
  for(const r of records) {
    assert.ok(ids(r.name).includes(r.id),r.name);
    assert.ok(ids(formatSourceDisplayName(r.name,r.format,true)).includes(r.id),r.name);
  }
});

test('all verified uploaded aliases resolve to the same original, ranked first',()=>{
  let count=0;
  for(const [id,entry] of Object.entries(aliases)) {
    assert.equal(records.find(r=>r.id===id)?.sha256,entry.sha256,id);
    assert.equal(new Set(entry.aliases).size,entry.aliases.length);
    for(const name of entry.aliases) {
      assert.doesNotMatch(name,/[/\\]/,'Only basenames may be published');
      assert.equal(ids(name)[0],id,name);
      assert.equal(ids(name.replaceAll('_',' ').toUpperCase())[0],id,name);
      count++;
    }
  }
  assert.ok(count>=32);
});

for(const f of fixtures) test(`latest supplied filename: ${f.filename}`,()=>{
  assert.equal(ids(f.filename)[0],f.id);
  assert.equal(records.find(r=>r.id===f.id)?.sha256,f.sha256);
});

test('previously failed recent filenames are preserved too',()=>{
  for(const [query,id] of [
    ['2020-10-13_Wexford_Executive_Committee_Packet.pdf','014-990955a02a90'],
    ['2015-10-21_Wexford_County_Board_Minutes.pdf','105-b03fe8433176'],
    ['2017-04-05_Wexford_County_Board_Minutes.pdf','134-3dc615cfcf9c'],
    ['2017-11-01_Wexford_County_Board_Minutes.pdf','044-7c628f229e98'],
    ['02_2016-04-18_JWC_and_HESCO_Purchase_Awards.pdf','process-site-018-26f79914deae'],
  ]) assert.equal(ids(query)[0],id,query);
});

test('spacing, dash, case and punctuation variants produce equal matches',()=>{
  for(const q of ['250-300','250–300','250—300','250_300',' 250  300 ']) assert.deepEqual(ids(q),ids('250 300'));
  assert.ok(ids('250-300').includes('014-990955a02a90'));
  assert.deepEqual(ids('8–1'),ids('8-1'));
  assert.deepEqual(ids('  JWC___HESCO  '),ids('jwc hesco'));
  for(const q of ['','  ','---','___']) assert.deepEqual(ids(q),[]);
});

test('an alias with a mismatched content hash is not accepted',()=>{
  const r={id:'test',name:'Original.pdf',sha256:'correct'};
  const bad=search.createLibrarySearchIndex([r],{test:{sha256:'wrong',aliases:['secret-alias.pdf']}});
  assert.deepEqual(search.searchLibrary(bad,'secret-alias'),[]);
});

test('all broad-query matches are reachable with no duplicates or skipped final rows',()=>{
  for(const query of ['PFAS','2018','2017','PDF','2020']) {
    const matches=search.searchLibrary(index,query);
    let state=search.librarySearchReducer(search.initialLibrarySearchState,{type:'query',query});
    let window=search.librarySearchWindow(matches,state.limit);
    let iterations=0;
    while(window.remaining) {
      assert.ok(++iterations<100);
      const previous=window.visible.length;
      state=search.librarySearchReducer(state,{type:'more'});
      window=search.librarySearchWindow(matches,state.limit);
      assert.equal(window.visible.length,Math.min(previous+100,matches.length));
    }
    assert.deepEqual(window.visible.map(r=>r.id),matches.map(r=>r.id));
    assert.equal(new Set(window.visible.map(r=>r.id)).size,matches.length);
  }
});

// Execute the actual JSX and its event handlers from page.tsx, not a duplicate test UI.
const jsx=searchSection.getText(ast);
const body=`function view(React, props) { const {librarySearchRecords,globalQuery,dispatchGlobalSearch,globalSearchResults,visibleGlobalResults,remainingGlobalResults,normalizeLibrarySearch,SEARCH_BATCH_SIZE,formatSourceDisplayName,documentSummary,Search,Badge,Button,DocumentPopoutButton,setSelected}=props; return (${jsx}); }`;
const view=new Function('React',ts.transpileModule(body,{compilerOptions:{jsx:ts.JsxEmit.React,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText+'; return view;')(React);
const Badge=({children})=>React.createElement('span',null,children);
const Button=({children,variant,...props})=>React.createElement('button',props,children);
const flatten=(node)=> !node || typeof node!=='object' ? [] : [node,...React.Children.toArray(node.props?.children).flatMap(flatten)];
function ui(state,onAction) {
  const matches=search.searchLibrary(index,state.query);
  const window=search.librarySearchWindow(matches,state.limit);
  return view(React,{librarySearchRecords:records,globalQuery:state.query,dispatchGlobalSearch:onAction,
    globalSearchResults:matches,visibleGlobalResults:window.visible,remainingGlobalResults:window.remaining,
    ...search,formatSourceDisplayName,documentSummary,Search:()=>null,Badge,Button,DocumentPopoutButton:()=>null,setSelected:()=>{}});
}

test('real search UI exposes and executes Show more, reaches the last result, and resets on typing',()=>{
  let state=search.librarySearchReducer(search.initialLibrarySearchState,{type:'query',query:'PFAS'});
  const action=(a)=>{state=search.librarySearchReducer(state,a);};
  let tree=ui(state,action);
  assert.equal(flatten(tree).filter(n=>n.type==='article').length,100);
  let clicks=0;
  while(true) {
    const button=flatten(tree).find(n=>n.type===Button && n.props['aria-controls']==='global-search-records');
    if(!button) break;
    assert.ok(++clicks<30);
    button.props.onClick(); tree=ui(state,action);
  }
  assert.ok(clicks>=2);
  assert.equal(flatten(tree).filter(n=>n.type==='article').length,ids('PFAS').length);
  const html=renderToStaticMarkup(tree);
  assert.match(html,/showing/); assert.doesNotMatch(html,/Show \d+ more records/);
  const input=flatten(tree).find(n=>n.type==='input');
  input.props.onChange({target:{value:'2018'}});
  assert.equal(state.limit,100);
  assert.equal(flatten(ui(state,action)).filter(n=>n.type==='article').length,100);
  input.props.onChange({target:{value:'no-such-record-xyzabc'}});
  assert.match(renderToStaticMarkup(ui(state,action)),/No records match this search/);
  input.props.onChange({target:{value:''}});
  assert.doesNotMatch(renderToStaticMarkup(ui(state,action)),/matching records|No records match/);
});

test('page is wired to the tested index, reducer and uncapped progressive window',()=>{
  assert.match(source,/createLibrarySearchIndex\(librarySearchRecords, verifiedFilenameAliases\)/);
  assert.match(source,/useReducer\(librarySearchReducer, initialLibrarySearchState\)/);
  assert.match(source,/searchLibrary\(librarySearchIndex, globalQuery\)/);
  assert.match(source,/librarySearchWindow\(globalSearchResults, globalSearch\.limit\)/);
  assert.doesNotMatch(source,/globalSearchResults\.slice\(0,\s*100\)/);
  assert.match(jsx,/not the full text inside each document/);
});
