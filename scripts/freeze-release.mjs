import {readdir,readFile,writeFile,mkdir,copyFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const {revision}=JSON.parse(await readFile(path.join(root,'content/strong-green/current.json')));
if(!/^v\d+\.\d+\.\d+$/.test(revision))throw Error('Invalid edition');
const prefix='projects/strong-green/editions/'+revision;
const source=path.join(root,'dist',prefix),target=path.join(root,'public',prefix);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function files(dir,relative=''){
  const result=[];
  for(const item of (await readdir(path.join(dir,relative),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    const next=path.posix.join(relative,item.name);
    if(item.isSymbolicLink())throw Error('A frozen edition must not contain symlinks');
    if(item.isDirectory())result.push(...await files(dir,next));else result.push(next);
  }
  return result;
}
const manifest={schemaVersion:1,project:'strong-green',revision,files:[]};
for(const file of await files(source)){
  if(file==='checksums.json')continue;
  const bytes=await readFile(path.join(source,file));
  const destination=path.join(target,file);
  try{
    if((await stat(destination)).isFile()&&hash(await readFile(destination))!==hash(bytes))throw Error('Refusing to replace existing publication: '+file);
  }catch(error){if(error.code!=='ENOENT')throw error;}
  await mkdir(path.dirname(destination),{recursive:true});
  await copyFile(path.join(source,file),destination);
  manifest.files.push({path:prefix+'/'+file,bytes:bytes.length,sha256:hash(bytes)});
}
const value=JSON.stringify(manifest,null,2)+'\n';
const record=path.join(root,'content/strong-green/releases',revision,'public-files.json');
try{if(await readFile(record,'utf8')!==value)throw Error('Refusing to replace a frozen release manifest');}
catch(error){if(error.code!=='ENOENT')throw error;}
await writeFile(record,value);
await writeFile(path.join(target,'checksums.json'),value);
await writeFile(path.join(source,'checksums.json'),value);
console.log('Frozen '+revision+': '+manifest.files.length+' public files; existing bytes preserved.');
