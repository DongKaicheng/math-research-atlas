import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {restorePackedEdition} from '../scripts/restore-packed-assets.mjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function fixture(t){
  const root=await mkdtemp(path.join(os.tmpdir(),'atlas-packed-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const project='sample',edition='v1.0.0',relative='sources/view/proof/index.html';
  const bytes=Buffer.from('<!doctype html><p>Exact source: α ∧ β</p>\n');
  const packed=gzipSync(bytes),release=path.join(root,'content',project,'releases',edition);
  const archive='packed/'+sha(bytes)+'.html.gz';
  await mkdir(path.join(release,'packed'),{recursive:true});
  const index={schemaVersion:1,encoding:'gzip',files:[{path:relative,archive,archiveBytes:packed.length,archiveSha256:sha(packed)}]};
  const manifest={project,revision:edition,files:[{path:relative,bytes:bytes.length,sha256:sha(bytes)}]};
  await writeFile(path.join(release,archive),packed);
  await writeFile(path.join(release,'manifest.json'),JSON.stringify(manifest));
  await writeFile(path.join(release,'packed-assets.json'),JSON.stringify(index));
  return {root,project,edition,release,index,manifest,bytes,packed,archive,target:path.join(root,'public/projects',project,'editions',edition,relative)};
}

test('A clean checkout restores the exact frozen bytes and preserves them on later builds',async t=>{
  const f=await fixture(t);
  assert.equal(await restorePackedEdition(f),1);
  assert.deepEqual(await readFile(f.target),f.bytes);
  assert.equal(await restorePackedEdition(f),0);
});

test('Corrupt packed bytes cannot become a public page',async t=>{
  const f=await fixture(t),damaged=Buffer.from(f.packed);
  damaged[damaged.length-1]^=1;
  await writeFile(path.join(f.release,f.archive),damaged);
  await assert.rejects(restorePackedEdition(f),/Packed checksum mismatch/);
});

test('Packed paths cannot escape the declared public edition',async t=>{
  const f=await fixture(t);
  f.index.files[0].path='../../outside.html';
  await writeFile(path.join(f.release,'packed-assets.json'),JSON.stringify(f.index));
  await assert.rejects(restorePackedEdition(f),/Only exact declared HTML paths/);
});

test('A changed public file is reported instead of silently overwritten',async t=>{
  const f=await fixture(t);
  await mkdir(path.dirname(f.target),{recursive:true});
  await writeFile(f.target,'Changed mathematical content');
  await assert.rejects(restorePackedEdition(f),/Existing public asset differs/);
  assert.equal(await readFile(f.target,'utf8'),'Changed mathematical content');
});

test('The frozen manifest bounds decompression and unregistered archives fail the build',async t=>{
  const f=await fixture(t);
  f.manifest.files[0].bytes=1;
  await writeFile(path.join(f.release,'manifest.json'),JSON.stringify(f.manifest));
  await assert.rejects(restorePackedEdition(f));
  f.manifest.files[0].bytes=f.bytes.length;
  await writeFile(path.join(f.release,'manifest.json'),JSON.stringify(f.manifest));
  await writeFile(path.join(f.release,'packed/unregistered.gz'),f.packed);
  await assert.rejects(restorePackedEdition(f),/Unregistered packed archive/);
});
