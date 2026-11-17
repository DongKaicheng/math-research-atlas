import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {safeRelative,containsPersonalIdentity,mathAnnotations,decodeText} from '../scripts/check-bedford-taylor-release.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const base='/math-research-atlas';
const project='/projects/bedford-taylor';
const read=p=>readFile(path.join(dist,p.replace(/^\//,'')),'utf8');
const current=JSON.parse(await readFile(path.join(root,'content/bedford-taylor/current.json'),'utf8'));
const manifest=JSON.parse(await readFile(path.join(root,'content/bedford-taylor/releases',current.revision,'manifest.json'),'utf8'));
const fixed=project+'/editions/'+current.revision;
const pageFile=(prefix,route)=>prefix+(route==='/'?'/index.html':route.endsWith('/')?route+'index.html':route);
const attrs=html=>[...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(m=>decodeText(m[1]));

test('BT manifest paths cannot escape their edition',()=>{
  for(const p of ['data/topics.json','downloads/paper.pdf'])assert.equal(safeRelative(p),true);
  for(const p of ['../private','/absolute','a/../b','a//b','a\\b',''])assert.equal(safeRelative(p),false);
});
test('Unsigned identity scanning exempts technical atlas URLs only',()=>{
  assert.equal(containsPersonalIdentity('https://dongkaicheng.github.io/math-research-atlas/projects/bedford-taylor/'),false);
  assert.equal(containsPersonalIdentity('https://github.com/DongKaicheng/math-research-atlas/issues'),false);
  assert.equal(containsPersonalIdentity('https%3A%2F%2Fdongkaicheng.github.io%2Fmath-research-atlas%2F'),false);
  assert.equal(containsPersonalIdentity(['Kai','cheng','Dong'].join(' ')),true);
  assert.equal(containsPersonalIdentity('K.~'+'Dong'),true);
  assert.equal(containsPersonalIdentity('董'+'开承'),true);
});
test('Current and fixed BT pages retain identical mathematical formulae and anchors',async()=>{
  for(const route of manifest.routes){
    if(route==='/404.html')continue;
    const live=await read(pageFile(project,route)),frozen=await read(pageFile(fixed,route));
    assert.deepEqual(mathAnnotations(live),mathAnnotations(frozen),route);
    const anchorIds=html=>[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]).filter(id=>!id.startsWith('atlas-'));
    assert.deepEqual(anchorIds(live),anchorIds(frozen),route+' anchors');
    assert.ok(!containsPersonalIdentity(live),route+' public identity');
  }
});
test('All BT links and section targets resolve under the GitHub Pages subpath',async()=>{
  const origin='https://dongkaicheng.github.io',cache=new Map(),existing=new Set();let checked=0;
  for(const prefix of [project,fixed])for(const route of manifest.routes){
    if(route==='/404.html')continue;
    const file=pageFile(prefix,route),html=await read(file);
    for(const href of attrs(html)){
      if(/^(?:mailto:|data:|tel:)/.test(href))continue;
      const url=new URL(href,origin+base+file.replace(/index\.html$/,''));
      if(url.origin!==origin)continue;
      assert.ok(url.pathname.startsWith(base+'/'),file+' wrong base');
      let target=decodeURIComponent(url.pathname.slice(base.length));
      if(target.endsWith('/'))target+='index.html';else if(!path.extname(target))target+='/index.html';
      const filename=path.join(dist,target.replace(/^\//,''));
      if(!existing.has(target)){
        assert.ok((await stat(filename)).isFile(),file+' missing '+href);existing.add(target);
      }
      if(target.endsWith('.html')&&url.hash){
        if(!cache.has(target))cache.set(target,new Set([...(await readFile(filename,'utf8')).matchAll(/\bid="([^"]+)"/g)].map(m=>decodeText(m[1]))));
        assert.ok(cache.get(target).has(decodeURIComponent(url.hash.slice(1))),file+' missing '+href);
      }
      checked++;
    }
  }
  assert.ok(checked>9000,'Full BT corpus link coverage');
});
test('BT current and frozen pages share Atlas feedback and bind the displayed edition',async()=>{
  for(const prefix of [project,fixed])for(const route of ['/','/results/r01/','/conjectures/','/papers/research-program/']){
    const html=await read(pageFile(prefix,route));
    const links=attrs(html).filter(href=>href.startsWith(base+'/feedback/?'));
    assert.ok(links.length>0,'Shared feedback link: '+prefix+route);
    const contexts=links.map(href=>new URL(href,'https://dongkaicheng.github.io').searchParams);
    assert.ok(contexts.some(p=>p.get('project')==='bedford-taylor'&&p.get('version')===current.revision));
    assert.ok(contexts.some(p=>p.get('page')?.includes(fixed+route)),'Feedback must cite the exact edition');
    if(route.includes('/r01/'))assert.ok(contexts.some(p=>p.get('entry')==='R01'),'Permanent record context');
    assert.doesNotMatch(html,/\/api\/feedback/,'No second inbox');
  }
});
test('All published BT records and both formal papers are in the unified search',async()=>{
  const search=JSON.parse(await read('/search-index.json'));
  for(const id of manifest.recordIds)assert.ok(search.some(s=>(s.link||s.url)?.endsWith(project+'/results/'+id.toLowerCase()+'/')),id);
  for(const slug of ['bedford-taylor-products','research-program'])assert.ok(search.some(s=>(s.link||s.url)?.endsWith(project+'/papers/'+slug+'/')),slug);
});
test('BT main navigation, definition links, version links, and public canonicals survive import',async()=>{
  const html=await read(project+'/index.html');
  for(const title of ['Overview','Conjectures','Progress','Complex comparison','Plan','Papers'])assert.ok(html.includes(title),title);
  assert.ok(attrs(html).some(href=>href.includes(fixed+'/')),'Fixed edition link');
  assert.match(html,/<link[^>]*rel="canonical"[^>]*https:\/\/dongkaicheng\.github\.io\/math-research-atlas\/projects\/bedford-taylor\//);
  assert.doesNotMatch(html,/<meta[^>]*name="robots"[^>]*noindex/,'Current publication must be indexable');
  const fixedHtml=await read(fixed+'/index.html');
  assert.match(fixedHtml,/<meta[^>]*name="robots"[^>]*noindex/,'Archive duplicate should not compete with current canonical');
  const definitions=JSON.parse(await read(fixed+'/data/definitions.json')).definitions;
  assert.equal(definitions.length,manifest.counts.definitions);
  const conjectures=await read(project+'/conjectures/index.html');
  for(const d of definitions)assert.ok(conjectures.includes('id="definition-'+d.id+'"'),d.id);
});
test('The original BT outline remains as a documented unsigned reading projection',async()=>{
  const old=JSON.parse(await readFile(path.join(root,'content/history/bedford-taylor/v0.json'),'utf8'));
  assert.equal(old.revision,0);assert.equal(old.project.id,'bedford-taylor');
  assert.deepEqual(old.project.authors,[]);assert.deepEqual(old.entries,[]);
  assert.equal(old.publicationProjection.kind,'unsigned historical reading copy');
  assert.match(old.publicationProjection.originalSha256,/^[a-f0-9]{64}$/);
  assert.equal(containsPersonalIdentity(JSON.stringify(old)),false);
  const html=await read(project+'/versions/0/index.html');
  assert.equal(containsPersonalIdentity(html),false);
  assert.match(html,/unsigned historical reading copy/i);
});
