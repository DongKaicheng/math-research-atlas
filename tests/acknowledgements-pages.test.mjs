import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderProjectAcknowledgements} from '../scripts/build-acknowledgements.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFile(path.join(root,'dist',file),'utf8');
const source=file=>readFile(path.join(root,file),'utf8');
const projectIds=['bedford-taylor','foundations','strong-green'];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

test('Every project has an independent acknowledgement page and overview navigation',async()=>{
  const ledger=JSON.parse(await source('content/feedback/adopted.json'));
  for(const id of projectIds){
    const route='projects/'+id+'/acknowledgements/';
    const html=await read(route+'index.html');
    assert.match(html,/<h1>Acknowledgements<\/h1>/);
    assert.match(html,/id="general-acknowledgements"/);
    assert.match(html,/id="accepted-feedback"/);
    const contributions=ledger.contributions.filter(item=>item.projectId===id);
    assert.equal(html.includes('No contributions from accepted feedback have been recorded yet'),contributions.length===0);
    for(const item of contributions){
      assert.ok(html.includes('id="'+item.id+'"'));
      assert.ok(html.includes(esc(item.summary)));
      assert.ok(html.includes('href="'+esc(item.changeUrl)+'"'));
    }
    assert.match(html,/does not imply co-authorship, endorsement/);
    assert.match(html,/href="[^"<>]*\/feedback\/\?project=/);
    assert.ok(html.includes('project='+id));
    assert.match(html,/<link rel="canonical" href="https:\/\/[^"<>]+\/acknowledgements\/">/);
    assert.doesNotMatch(html,/<meta name="robots" content="noindex/);
    assert.ok((await read('projects/'+id+'/index.html')).includes('/'+route+'"'));
  }
});

test('Xia is thanked only for research sharing, only within the Bedford–Taylor project',async()=>{
  const bt=await read('projects/bedford-taylor/acknowledgements/index.html');
  assert.match(bt,/We thank Mingchen Xia \(夏铭辰\) for generously sharing his research\./);
  const thanks=bt.split('id="general-acknowledgements"')[1].split('</section>')[0];
  assert.match(thanks,/mingchen-xia-research-sharing/);
  const accepted=bt.split('id="accepted-feedback"')[1].split('</section>')[0];
  assert.doesNotMatch(accepted,/mingchen-xia-research-sharing|for generously sharing his research/);
  for(const id of ['foundations','strong-green'])assert.doesNotMatch(await read('projects/'+id+'/acknowledgements/index.html'),/mingchen-xia-research-sharing/);
  const ledger=JSON.parse(await source('content/feedback/adopted.json'));
  assert.equal(ledger.contributions.some(item=>item.id==='mingchen-xia-research-sharing'),false);
});

test('Acknowledgement directory, public guide, search and sitemap point to all separate pages',async()=>{
  const directory=await read('acknowledgements/index.html');
  const sitemap=await read('sitemap.xml');
  const index=JSON.parse(await read('search-index.json'));
  for(const id of projectIds){
    const route='/projects/'+id+'/acknowledgements/';
    assert.ok(directory.includes(route+'"'));
    assert.ok(sitemap.includes(route+'</loc>'));
    assert.ok(index.some(item=>item.link.endsWith(route)));
  }
  assert.match(await read('feedback/guide/index.html'),/<h2 id="acknowledgements-and-credit">Acknowledgements and credit<\/h2>/);
  assert.match(await read('feedback/index.html'),/project acknowledgements page/);
  assert.match(await read('index.html'),/>Acknowledgements<\/a>/);
});

test('Current project subpages link to acknowledgements but frozen editions remain unchanged',async()=>{
  for(const route of ['projects/bedford-taylor/map/','projects/bedford-taylor/conjectures/','projects/strong-green/results/','projects/strong-green/programme/']){
    assert.match(await read(route+'index.html'),/>Acknowledgements<\/a>/);
  }
  for(const [id,edition] of [['bedford-taylor','v1.0.1'],['strong-green','v0.5.1']]){
    assert.doesNotMatch(await read('projects/'+id+'/editions/'+edition+'/index.html'),/\/acknowledgements\//);
  }
});

test('Page rendering escapes contributor text and preserves exact project feedback context',()=>{
  const attack='<img src=x onerror=alert(1)> & "quote"';
  const record={projectId:'test-project',updatedAt:'2026-11-19',acknowledgements:[{id:'general-thanks',displayName:attack,text:attack}],contributions:[{
    id:'feedback-42',category:'correction',summary:attack,acceptedAt:'2026-11-18',incorporatedAt:'2026-11-19',
    credit:{mode:'named',displayName:attack},feedbackUrl:'https://github.com/org/repo/issues/42',acceptanceUrl:'https://github.com/org/repo/issues/42#issuecomment-123',changeUrl:'https://github.com/org/repo/pull/43',
  }]};
  const page=renderProjectAcknowledgements({record,project:{id:'test-project',title:'Test project',category:'research'},repository:'org/repo',url:value=>'/base'+value,origin:'https://example.org/base',esc,breadcrumbs:()=>''});
  assert.doesNotMatch(page.html,/<img|<script/);
  assert.match(page.html,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(page.html,/href="https:\/\/github.com\/org\/repo\/issues\/42#issuecomment-123"/);
  const feedback=page.html.match(/href="([^"]*\/feedback\/\?project=test-project[^"]*)"/)[1].replaceAll('&amp;','&');
  const query=new URL(feedback,'https://example.org').searchParams;
  assert.equal(query.get('page'),'https://example.org/base/projects/test-project/acknowledgements/');
  assert.equal(query.has('entry'),false);
});

test('All feedback forms offer explicit optional attribution without collecting private contact data',async()=>{
  for(const kind of ['general','question','correction','reference','suggestion','proof','counterexample','formalization']){
    const form=await source('.github/ISSUE_TEMPLATE/'+kind+'.yml');
    assert.match(form,/id: credit_preference/);
    assert.match(form,/default: 0/);
    assert.match(form,/Ask me before naming me/);
    assert.match(form,/Credit my GitHub username if this feedback is adopted/);
    assert.match(form,/Do not name me on acknowledgement pages/);
    assert.match(form,/id: credit_name/);
    assert.match(form,/required: false/);
  }
  const protocol=await source('AGENTS.md');
  assert.match(protocol,/content\/feedback\/adopted\.json/);
  assert.match(protocol,/same publication/);
});
