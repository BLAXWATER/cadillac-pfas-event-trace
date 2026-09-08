import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {root,loadDownloadDeliveryPlan} from '../scripts/document-download-integrity.mjs';

const archivedIds=['149-e4e6ac86e7bc','007-9aecbfcf4abc','010-1aba682de0b8','104-6815e2f8b48e','140-3db93feeaf81','125-9e67bc822d9c','168-cdc906173203','151-5a0d25ca941a','165-676065b15331','098-044977305e5f','146-6b4e98f4c779'];
test('large originals reuse identical pinned public copies without changing the library',async()=>{
  const plans=await loadDownloadDeliveryPlan();
  assert.equal(plans.length,1623);
  for(const id of archivedIds){
    const p=plans.find(p=>p.row.id===id);
    assert.equal(p.kind,'archive');
    assert.match(p.source.rawUrl,/^https:\/\/raw\.githubusercontent\.com\/BLAXWATER\/cadillac-pfas-event-trace\/[a-f0-9]{40}\/public\//);
    const local=await readFile(path.join(root,'public',p.publicPath));
    const archived=execFileSync('git',['show',p.source.spec],{cwd:root,maxBuffer:32*1024*1024});
    assert.equal(local.length,p.row.size);
    assert.ok(local.equals(archived),'Archived original differs from the retained local file');
    assert.equal(createHash('sha256').update(local).digest('hex'),p.row.sha256);
  }
});

test('release omits only the redundant bundled copies of the eleven archived originals',async()=>{
  const assets=await readdir(path.join(root,'dist/client/assets'));
  for(const id of archivedIds)assert.ok(!assets.some(n=>n.startsWith(id+'-')&&n.endsWith('.pdf')));
  const plans=await loadDownloadDeliveryPlan();
  assert.equal(plans.filter(p=>p.kind==='bundled').length,157);
  assert.equal(plans.filter(p=>p.kind==='archive').length,1466);
});

test('expanded release assets stay below the hosting limit with packaging headroom',async()=>{
  async function bytes(directory){
    let total=0;
    for(const entry of await readdir(directory,{withFileTypes:true})){
      const target=path.join(directory,entry.name);
      total+=entry.isDirectory()?await bytes(target):(await stat(target)).size;
    }
    return total;
  }
  const expandedBytes=await bytes(path.join(root,'dist'));
  assert.ok(expandedBytes<255*1024*1024,`Expanded build is ${expandedBytes} bytes; reserve at least 1 MiB below the 256 MiB archive limit`);
});
