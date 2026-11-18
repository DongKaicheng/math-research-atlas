import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const repo=path.resolve(import.meta.dirname,'..');
const read=async p=>readFile(path.join(repo,'dist',p),'utf8');
const pointer=JSON.parse(await readFile(path.join(repo,'public/agents/current.json'),'utf8'));
const release=`agents/releases/${pointer.release}/`;
const manifest=JSON.parse(await readFile(path.join(repo,'public',release,'manifest.json'),'utf8'));
const ids=['math-project-maintainer','math-research-publisher','math-writing-editor'];

test('Public skill archives are fixed, hashed and source-complete',async()=>{
  assert.equal(manifest.schema,'math-agent-release/v1');
  assert.equal(manifest.release,pointer.release);
  assert.deepEqual(Object.keys(manifest.agents).sort(),ids.slice().sort());
  for(const id of ids){
    const entry=manifest.agents[id];
    assert.equal(entry.file,id+'.zip');
    const local=await readFile(path.join(repo,'public',release,entry.file));
    const built=await readFile(path.join(repo,'dist',release,entry.file));
    assert.deepEqual(local,built,id);
    assert.equal(local.length,entry.bytes,id);
    assert.equal(createHash('sha256').update(local).digest('hex'),entry.sha256,id);
  }
});

test('Homepage exposes updated agents without replacing its three primary links',async()=>{
  const home=await read('index.html');
  assert.match(home,/id="home-agents-title">Three updated research agents/);
  assert.match(home,/href="\/math-research-atlas\/ai-and-math\/"/);
  assert.equal((home.match(/class="simple-quick-links"/g)||[]).length,1);
  assert.match(home,/About this site/);
  assert.match(home,/Feedback &amp; discussion/);
  assert.match(home,/Why this site\?/);
});

test('Agent page links exact downloadable archives, proof maps and shared feedback',async()=>{
  const page=await read('ai-and-math/index.html');
  assert.match(page,/Logical relationships, not just a list/);
  assert.match(page,/Every jointly required premise/);
  assert.match(page,/Separate sufficient proof routes/);
  assert.match(page,/Missing inferences/);
  assert.match(page,/<code>SKILL\.md<\/code>/);
  for(const id of ids){
    assert.match(page,new RegExp(`id="${id}"`));
    assert.ok(page.includes(`/math-research-atlas/${release}${id}.zip`));
    assert.ok(page.includes(manifest.agents[id].sha256));
  }
  assert.match(page,/href="\/math-research-atlas\/projects\/bedford-taylor\/map\/#total-logic"/);
  assert.match(page,/href="\/math-research-atlas\/projects\/strong-green\/results\/proof-diagrams\/"/);
  assert.match(page,/href="\/math-research-atlas\/feedback\/"/);
  assert.doesNotMatch(page,/appgprj_|spectacularsheep\.chatgpt\.site/i);
  assert.match(await read('sitemap.xml'),/math-research-atlas\/ai-and-math\//);
  assert.match(await read('updates/index.html'),/Mathematical agents: logical diagram release/);
});
