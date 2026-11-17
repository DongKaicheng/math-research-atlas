/** Restore exact, checksum-bound public bytes from compact Git storage. */
import {readFile,writeFile,mkdir,readdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const safeRelative=value=>typeof value==='string'&&value.length>0&&
  !value.startsWith('/')&&!value.includes('\\')&&!value.includes('\0')&&
  value.split('/').every(part=>part!==''&&part!=='.'&&part!=='..');

async function regularPath(root,relative){
  assert.ok(safeRelative(relative),'Unsafe packed asset path');
  let current=root;
  for(const part of relative.split('/')){
    current=path.join(current,part);
    try{assert.ok(!(await lstat(current)).isSymbolicLink(),'Packed assets cannot use symlinks');}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  return current;
}

export async function restorePackedEdition({root,project,edition}){
  assert.match(project,/^[a-z][a-z0-9-]*$/);
  assert.match(edition,/^v\d+\.\d+\.\d+$/);
  const release=await regularPath(root,`content/${project}/releases/${edition}`);
  let index;
  try{index=JSON.parse(await readFile(await regularPath(release,'packed-assets.json'),'utf8'));}
  catch(error){if(error.code==='ENOENT')return 0;throw error;}
  assert.equal(index.schemaVersion,1);
  assert.equal(index.encoding,'gzip');
  assert.ok(Array.isArray(index.files));
  const manifest=JSON.parse(await readFile(await regularPath(release,'manifest.json'),'utf8'));
  assert.equal(manifest.project,project);
  assert.equal(manifest.revision,edition);
  const declared=new Map(manifest.files.map(file=>[file.path,file]));
  const publicRoot=await regularPath(root,`public/projects/${project}/editions/${edition}`);
  const paths=new Set(),archives=new Set();
  let restored=0;
  for(const item of index.files){
    assert.ok(safeRelative(item.path)&&item.path.endsWith('.html'),'Only exact declared HTML paths may be restored');
    assert.ok(/^packed\/[a-f0-9]{64}\.html\.gz$/.test(item.archive),'Invalid packed archive path');
    assert.ok(!paths.has(item.path)&&!archives.has(item.archive),'Duplicate packed asset');
    paths.add(item.path);archives.add(item.archive);
    const expected=declared.get(item.path);
    assert.ok(expected,'Packed asset is absent from the frozen manifest');
    assert.ok(Number.isSafeInteger(expected.bytes)&&expected.bytes>0&&expected.bytes<=128*1024*1024,'Invalid unpacked size');
    const packed=await readFile(await regularPath(release,item.archive));
    assert.equal(packed.length,item.archiveBytes,'Packed size mismatch');
    assert.equal(digest(packed),item.archiveSha256,'Packed checksum mismatch');
    const bytes=gunzipSync(packed,{maxOutputLength:expected.bytes});
    assert.equal(bytes.length,expected.bytes,'Unpacked size mismatch');
    assert.equal(digest(bytes),expected.sha256,'Unpacked bytes differ from the frozen edition');
    const destination=await regularPath(publicRoot,item.path);
    try{
      const existing=await readFile(destination);
      assert.equal(existing.length,expected.bytes,'Existing public asset differs from the frozen edition');
      assert.equal(digest(existing),expected.sha256,'Existing public asset differs from the frozen edition');
    }catch(error){
      if(error.code!=='ENOENT')throw error;
      await mkdir(path.dirname(destination),{recursive:true});
      await writeFile(destination,bytes,{flag:'wx'});restored++;
    }
  }
  const stored=(await readdir(await regularPath(release,'packed'))).map(name=>'packed/'+name).sort();
  assert.deepEqual(stored,[...archives].sort(),'Unregistered packed archive');
  return restored;
}

export async function restorePackedAssets(root){
  let restored=0;
  for(const project of await readdir(path.join(root,'content'),{withFileTypes:true})){
    if(!project.isDirectory()||!/^[a-z][a-z0-9-]*$/.test(project.name))continue;
    let editions;
    try{editions=await readdir(path.join(root,'content',project.name,'releases'));}
    catch(error){if(error.code==='ENOENT')continue;throw error;}
    for(const edition of editions.filter(value=>/^v\d+\.\d+\.\d+$/.test(value)))
      restored+=await restorePackedEdition({root,project:project.name,edition});
  }
  return restored;
}
