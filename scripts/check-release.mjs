import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const releaseRoot=path.join(root,'content/strong-green/releases');
let checked=0;
async function files(dir,relative=''){
  const result=[];
  for(const item of await readdir(path.join(dir,relative),{withFileTypes:true})){
    const next=path.posix.join(relative,item.name);
    assert.equal(item.isSymbolicLink(),false,'No symlinks in public releases');
    if(item.isDirectory())result.push(...await files(dir,next));else result.push(next);
  }return result;
}
for(const revision of (await readdir(releaseRoot)).filter(x=>/^v\d+\.\d+\.\d+$/.test(x))){
  const prefix='projects/strong-green/editions/'+revision;
  const record=await readFile(path.join(releaseRoot,revision,'public-files.json'),'utf8');
  const manifest=JSON.parse(record);
  assert.equal(manifest.revision,revision);
  const names=new Set();
  for(const file of manifest.files){
    assert.ok(file.path.startsWith(prefix+'/')&&!file.path.split('/').includes('..'));
    assert.ok(!names.has(file.path),'Duplicate frozen path');names.add(file.path);
    for(const tree of ['public','dist']){
      const bytes=await readFile(path.join(root,tree,file.path));
      assert.equal(hash(bytes),file.sha256,tree+': '+file.path);
      assert.equal(bytes.length,file.bytes,tree+': '+file.path);
    }checked++;
  }
  for(const tree of ['public','dist']){
    assert.equal(await readFile(path.join(root,tree,prefix,'checksums.json'),'utf8'),record);
    for(const file of await files(path.join(root,tree,prefix)))if(file!=='checksums.json')assert.ok(names.has(prefix+'/'+file),'Unregistered public file: '+file);
  }
  const bundle=JSON.parse(await readFile(path.join(releaseRoot,revision,'bundle.json'),'utf8'));
  assert.deepEqual(bundle.project.authors,[]);
  assert.equal(bundle.edition.revision,revision);
  assert.equal(new Set(bundle.entries.map(e=>e.id)).size,bundle.entries.length);
  const idSet=new Set(bundle.entries.map(e=>e.id));
  for(const entry of bundle.entries)for(const id of entry.dependencies)assert.ok(idSet.has(id),entry.id+': missing dependency '+id);
  for(const source of bundle.sourceFiles.filter(s=>s.url)){
    const bytes=await readFile(path.join(root,'public',prefix,source.url));
    assert.equal(hash(bytes),source.sha256,source.file);
  }
  for(const paper of bundle.papers){
    const full=JSON.parse(await readFile(path.join(releaseRoot,revision,'papers',paper.slug+'.json'),'utf8'));
    assert.equal(paper.pdfSha256,full.pdfSha256,paper.slug);
    for(const [ext,key] of [['pdf','pdfSha256'],['tex','sourceSha256']]){
      assert.equal(hash(await readFile(path.join(root,'public',prefix,'papers',paper.slug+'.'+ext))),full[key],paper.slug+'.'+ext);
    }
  }
}
console.log('Release integrity: '+checked+' frozen files verified in source and build; public source and paper hashes agree.');
