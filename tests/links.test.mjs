import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../dist');
const repo=path.resolve(import.meta.dirname,'..');
const base='/math-research-atlas';
const origin='https://dongkaicheng.github.io';
async function walk(relative=''){
  const out=[];
  for(const f of await readdir(path.join(root,relative),{withFileTypes:true})){
    const p=path.posix.join(relative,f.name);
    if(f.isDirectory())out.push(...await walk(p));else out.push(p);
  }return out;
}
test('Every local page, paper, source, anchor, and stylesheet URL resolves',async()=>{
  const all=await walk(),names=new Set(all),ids=new Map(),fail=[];
  let checked=0;
  const htmlFiles=all.filter(f=>f.endsWith('.html'));
  for(const file of htmlFiles){
    const text=await readFile(path.join(root,file),'utf8');
    const values=[...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(values).size,values.length,'Duplicate HTML anchor in '+file);
    ids.set(file,new Set(values));
  }
  for(const file of htmlFiles){
    const text=await readFile(path.join(root,file),'utf8');
    const here=origin+base+'/'+file.replace(/index\.html$/,'');
    for(const match of text.matchAll(/\b(?:href|src)="([^"]+)"/g)){
      const href=match[1].replaceAll('&amp;','&');
      if(/^(?:mailto:|data:|tel:)/.test(href))continue;
      const u=new URL(href,here);
      if(u.origin!==origin)continue;
      if(!u.pathname.startsWith(base+'/')){fail.push(file+' → wrong base: '+href);continue;}
      let target=decodeURIComponent(u.pathname.slice(base.length+1));
      if(!target||target.endsWith('/'))target+='index.html';
      else if(!path.extname(target))target+='/index.html';
      if(!names.has(target)){fail.push(file+' → missing '+href);continue;}
      if(u.hash&&target.endsWith('.html')&&!ids.get(target)?.has(decodeURIComponent(u.hash.slice(1))))fail.push(file+' → missing anchor '+href);
      checked++;
    }
  }
  for(const file of all.filter(f=>f.endsWith('.css'))){
    const css=await readFile(path.join(root,file),'utf8');
    for(const match of css.matchAll(/url\((?:["']?)([^)'"\s]+)(?:["']?)\)/g)){
      if(/^(?:data:|https?:)/.test(match[1]))continue;
      const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1].split(/[?#]/)[0]));
      if(!names.has(target))fail.push(file+' → missing font/asset '+match[1]);
    }
  }
  assert.deepEqual(fail,[]);
  assert.ok(checked>1000,'Full research corpus link coverage');
});
test('All formal papers and permanent records are searchable',async()=>{
  const search=JSON.parse(await readFile(path.join(root,'search-index.json'),'utf8'));
  const {revision}=JSON.parse(await readFile(path.join(repo,'content/strong-green/current.json'),'utf8'));
  assert.match(revision,/^v\d+\.\d+\.\d+$/);
  const b=JSON.parse(await readFile(path.join(root,'projects/strong-green/editions',revision,'research.json'),'utf8'));
  for(const e of b.entries)assert.ok(search.some(s=>s.link.endsWith('/entries/'+e.id+'/')),e.id);
  for(const p of b.papers)assert.ok(search.some(s=>s.link.endsWith('/papers/'+p.slug+'/')),p.slug);
});
test('The atlas card, current pointer and published research edition agree',async()=>{
  const {revision}=JSON.parse(await readFile(path.join(repo,'content/strong-green/current.json'),'utf8'));
  const card=JSON.parse(await readFile(path.join(repo,'content/projects/strong-green.json'),'utf8'));
  const published=JSON.parse(await readFile(path.join(root,'projects/strong-green/editions',revision,'research.json'),'utf8'));
  const source=JSON.parse(await readFile(path.join(repo,'content/strong-green/releases',revision,'bundle.json'),'utf8'));
  assert.equal(card.edition,revision);
  assert.equal(source.edition.revision,revision);
  assert.equal(published.edition.revision,revision);
});
test('The Beilinson–Bloch publication retains its exact PDF inventory without historical signed archives',async()=>{
  const all=await walk();
  // A new edition keeps the old PDFs. Match every retained edition's declared
  // paper inventory instead of fixing the total to the initial release count.
  // Use research.json, which is present before the first freeze, rather than
  // requiring the post-QA checksums manifest during a candidate build.
  const editionPrefix='projects/strong-green/editions';
  const editions=(await readdir(path.join(root,editionPrefix),{withFileTypes:true})).filter(item=>item.isDirectory()&&/^v\d+\.\d+\.\d+$/.test(item.name));
  const expected=[];
  for(const edition of editions){
    const prefix=editionPrefix+'/'+edition.name;
    const bundle=JSON.parse(await readFile(path.join(root,prefix,'research.json'),'utf8'));
    assert.equal(bundle.edition.revision,edition.name);
    assert.ok(Array.isArray(bundle.papers));
    const slugs=new Set();
    for(const paper of bundle.papers){
      assert.match(paper.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.ok(!slugs.has(paper.slug),'Duplicate paper in '+edition.name);slugs.add(paper.slug);
      expected.push(prefix+'/papers/'+paper.slug+'.pdf');
    }
  }
  assert.ok(editions.length>0,'At least the current public edition is retained');
  assert.deepEqual(all.filter(f=>f.startsWith(editionPrefix+'/')&&f.endsWith('.pdf')).sort(),expected.sort());
  assert.ok(!all.some(f=>f.startsWith('api/')),'No public write endpoint');
  assert.ok(!all.some(f=>f.startsWith(editionPrefix+'/')&&(f.endsWith('.zip')||f.includes('/manuscripts/'))),'The BB export contains only its declared public source projection');
  for(const f of all.filter(x=>x.endsWith('.html'))){
    const text=await readFile(path.join(root,f),'utf8');
    assert.doesNotMatch(text,/\/api\/feedback|beilinson-bloch-research\.spectacularsheep\.chatgpt\.site/);
  }
});
