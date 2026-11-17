import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(repo,'dist');
const read=async p=>readFile(path.join(dist,p),'utf8');

test('Core pages, guide, and mathematical project URLs are generated',async()=>{
  for(const route of [
    'index.html','manifesto/index.html','about/index.html','feedback/index.html',
    'feedback/guide/index.html','foundations/index.html','research/index.html',
    'search/index.html','updates/index.html','projects/strong-green/index.html',
    'projects/bedford-taylor/index.html','projects/foundations/index.html',
  ])assert.ok((await read(route)).includes('Conjecture Atlas'),route);
});
test('All internal links are GitHub Pages base-path aware',async()=>{
  const routes=['index.html','manifesto/index.html','about/index.html','feedback/index.html','feedback/guide/index.html'];
  for(const file of routes){
    const html=await read(file);
    const anchors=[...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map(x=>x[1]);
    for(const href of anchors)assert.ok(href.startsWith('/math-research-atlas/'),file+': '+href);
  }
});
test('The full public manifesto and the core vision sentence survive migration',async()=>{
  const homepage=await read('index.html'),manifesto=await read('manifesto/index.html');
  assert.match(homepage,/We use AI to bring mathematical knowledge together/);
  assert.match(manifesto,/Building open mathematical theory/);
  assert.match(manifesto,/Mathematical knowledge should be a common good/);
});
test('Feedback is GitHub-based with no ChatGPT or proprietary API dependency',async()=>{
  const board=await read('feedback/index.html');
  const guide=await read('feedback/guide/index.html');
  assert.match(board,/github\.com\/DongKaicheng\/math-research-atlas/);
  assert.match(board,/assets\/feedback\.js/);
  assert.match(guide,/All GitHub Issues, comments, names, and attachments are public/);
  assert.match(guide,/href="\/math-research-atlas\/feedback\/"/);
  for(const html of [board,guide])assert.doesNotMatch(html,/spectacularsheep\.chatgpt\.site|\/api\/feedback/);
});
test('All seven contribution categories have public GitHub Issue forms',async()=>{
  const names=['question','correction','reference','suggestion','proof','counterexample','formalization'];
  for(const name of names){
    const yaml=await readFile(path.join(repo,'.github','ISSUE_TEMPLATE',name+'.yml'),'utf8');
    assert.match(yaml,/body:\s*\n/);
    assert.match(yaml,/\.zip/);
    assert.match(yaml,/public/);
    assert.match(yaml,/required: true/);
  }
});
test('The site is discoverable and contains no server-side program',async()=>{
  const sitemap=await read('sitemap.xml');
  assert.match(sitemap,/https:\/\/dongkaicheng\.github\.io\/math-research-atlas\/feedback\/guide\//);
  assert.match(await read('robots.txt'),/Sitemap:/);
  assert.ok((await stat(path.join(dist,'.nojekyll'))).isFile());
  const assets=await readdir(path.join(dist,'assets'));
  assert.ok(assets.includes('katex.min.css'));
  assert.ok(assets.includes('github-extra.css'));
});
test('Projects have unique permanent IDs and explicit mathematical tracks',async()=>{
  const files=(await readdir(path.join(repo,'content','projects'))).filter(x=>x.endsWith('.json'));
  const projects=await Promise.all(files.map(async f=>JSON.parse(await readFile(path.join(repo,'content','projects',f)))));
  assert.equal(projects.length,3);
  assert.equal(new Set(projects.map(p=>p.project.id)).size,projects.length);
  const ids=[];
  for(const project of projects){
    assert.ok(['foundations','research'].includes(project.project.category));
    assert.ok(Array.isArray(project.entries));
    for(const entry of project.entries)ids.push(entry.id);
  }
  assert.equal(new Set(ids).size,ids.length);
});
