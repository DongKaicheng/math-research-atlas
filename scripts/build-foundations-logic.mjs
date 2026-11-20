import {createHash} from 'node:crypto';
import {lstat,readFile,readdir} from 'node:fs/promises';
import path from 'node:path';

const project='/projects/foundations/';
const index=project+'logic/';
const fixed='/projects/foundations/editions/sealed-1097/';
const directory='content/foundations/releases/sealed-1097-logic';
const logicManifestPin='1361932769f29ceb2455311fbbbed1b08ced251605a122a672674b87735c8901';
const assets=['projective-model.svg','cartier-norm.svg','data.json','logic.css'];
const digest=value=>createHash('sha256').update(value).digest('hex');
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ref=(url,label)=>'<a href="'+esc(url)+'">'+esc(label)+'</a>';
const privacy=/\/workspace\/|\/home\/agent\/|libfile_|private_library_readback|review_en\.md|Sentinel_|BEGIN [A-Z ]*PRIVATE KEY/i;
const expect=(condition,message)=>{if(!condition)throw Error('Foundations logic: '+message);};
const keyID=/^[A-Za-z0-9_:.@()/+-]{1,160}$/;
const keyAnchor=key=>'argument-'+key.toLowerCase().replace(/[^a-z0-9_-]/g,'-');
const chapterRoute=slug=>index+'chapters/'+slug+'/';
const file=route=>route.slice(1)+'index.html';

async function regular(file) {
  expect((await lstat(file)).isFile(),'nonregular artifact '+path.basename(file));
  return readFile(file);
}
function checkLocal(href, contents) {
  expect(/^\/r\/NAG-\d{6}\/(?:#[A-Za-z0-9_.%-]+)?$/.test(href),'invalid reader destination '+href);
  const [route,hash]=href.split('#');
  const content=contents.get(file(route));
  expect(content,'reader destination missing '+href);
  if(hash)expect(content.toString('utf8').includes('id="'+decodeURIComponent(hash)+'"'),'reader anchor missing '+href);
  return content.toString('utf8');
}
function loadGraph(data, release) {
  expect(data.schema==='foundations-proof-map/v1'&&data.edition===release.manifest.edition&&
    data.sourceManifestSha256===release.manifest.sourceManifestSha256&&
    data.editionManifestSha256===digest(release.manifestBytes),'wrong source or math edition');
  expect(Object.keys(data.arguments).length===1128&&Object.keys(data.gaps).length===82&&
    Object.keys(data.chapters).length===39,'source inventory drift');
  for (const [key,node] of Object.entries(data.nodes)) {
    expect(keyID.test(key)&&node.href.startsWith('/r/'+node.id+'/'),'bad reader identity '+key);
    const text=checkLocal(node.href,release.contents);
    for(const hash of node.spanHashes??[])expect(/^[0-9a-f]{64}$/.test(hash)&&text.includes('data-sha256="'+hash+'"'),
      'statement/proof byte binding lost at '+key);
  }
  for (const node of Object.values(data.contexts)) checkLocal(node.href,release.contents);
  for (const [key,arg] of Object.entries(data.arguments)) {
    expect(Object.hasOwn(data.nodes,key)&&Object.hasOwn(data.chapters,arg.chapter),'argument is out of scope '+key);
    expect(new Set(arg.inputs.map(input=>input.key)).size===arg.inputs.length,'duplicate inputs for '+key);
    for(const input of arg.inputs)expect(Object.hasOwn(data.nodes,input.key)&&input.key!==key,'unknown operative input on '+key);
    for(const input of arg.external)expect(/^https:\/\/stacks\.math\.columbia\.edu\/tag\/[A-Z0-9]{4}$/.test(input.href),
      'unsupported external authority in '+key);
  }
  for(const gap of Object.values(data.gaps)) {
    expect(Object.hasOwn(data.chapters,gap.chapter)&&gap.step,'gap outside chapter index');
    checkLocal(gap.href,release.contents);
  }
  expect(data.principal.length===2&&data.principal.every(b=>assets.includes(b.id+'.svg')&&b.targets.every(id=>data.arguments[id])),
    'invalid principal views');
}
function shell(title,route,body) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="foundations-edition" content="sealed-1097"><meta name="description" content="Read the selected inputs of exact Foundations arguments, their scopes and unresolved historical proof steps.">'+
    '<link rel="canonical" href="'+route+'"><link rel="stylesheet" href="'+fixed+'reader.css"><link rel="stylesheet" href="'+fixed+'logic/logic.css">'+
    '<title>'+esc(title)+' · Foundations</title></head><body><a class="skip" href="#main">Skip to content</a>'+
    '<header><nav aria-label="Foundations">'+ref(project,'Foundations')+' '+ref(index,'Proof map')+' '+ref(project+'coverage/','Coverage')+
    ' '+ref(fixed+'reader-en.pdf','English PDF')+' '+ref('/search/','Search')+'</nav></header>'+
    '<main class="logic-flow" id="main">'+body+'</main><footer>Foundations · sealed 1097</footer></body></html>';
}
function readerTarget(key,node) {
  return key.startsWith('NAG-')&&node.status==='accepted whole' ? node.href+'#foundations-exact-proof' : node.href;
}
function sourceProofTarget(key,node) {
  return ref(readerTarget(key,node),key+' · '+node.label);
}
function feedback(page) {
  return ref('/feedback/?project=foundations&version=sealed-1097&page='+encodeURIComponent(page),'Discuss this map');
}
function windows(input) {
  if(!input.useWindows?.length) return '';
  return ' <small class="logic-context">Exact source '+(input.useWindows.length===1?'window ':'windows ')+
    input.useWindows.map(({lines})=>lines[0]===lines[1]?lines[0]:lines[0]+'–'+lines[1]).join(', ')+'</small>';
}
function listInputs(items,nodes) {
  return '<ul class="logic-premises">'+items.map(inp=>{
    const node=Object.hasOwn(nodes,inp.key)?nodes[inp.key]:null;
    const link=inp.href?ref(inp.href,inp.key):node?sourceProofTarget(inp.key,node):'<code>'+esc(inp.key)+'</code>';
    return '<li>'+link+(node?'<span class="logic-clause"> · '+esc(node.status)+'</span>':'')+windows(inp)+
      (inp.scopes.length?'<ul>'+inp.scopes.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>':'')+'</li>';
  }).join('')+'</ul>';
}
function argument(data,key,{principal=false,body=false}={}) {
  const a=data.arguments[key], node=data.nodes[key];
  const argumentID=principal?'relation-uses-'+key:keyAnchor(key);
  const location=ref(chapterRoute(a.chapter)+'#'+keyAnchor(key),'Chapter argument');
  const inputs=a.inputs.length
    ? '<p class="logic-gate">'+(a.inputs.length>1?'AND · joint registered proof inputs':'Registered proof input')+'</p>'+listInputs(a.inputs,data.nodes)
    : '<p>No addressable selected proof input is recorded in this projection.</p>';
  const notes=(a.standing.length?
    '<details><summary>Standing context and base inputs</summary>'+listInputs(a.standing,data.contexts)+'</details>':'')+
    (a.external.length?'<details><summary>Exact named external applications</summary>'+listInputs(a.external,{})+'</details>':'')+
    (a.unresolved.length?'<details><summary>Unlinked source pointers</summary><p>These pointers have no operative linked edge in this map.</p><ul>'+
      a.unresolved.map(i=>'<li><code>'+esc(i)+'</code></li>').join('')+'</ul></details>':'');
  const conditions=data.principalConditions[key];
  const hypotheses=conditions?'<p><strong>Hypotheses for this application</strong></p><ul>'+
    conditions.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul>':'';
  const method=data.principalMethods[key];
  const mechanism=method?'<p>'+esc(method)+'</p>':'';
  const heading=sourceProofTarget(key,node)+(body?' · '+location:'');
  if(body)return '<details class="logic-inline" id="'+argumentID+'"><summary>Verified map inputs · '+esc(key)+'</summary>'+
    hypotheses+inputs+mechanism+notes+'<p class="logic-links">'+heading+'</p></details>';
  return '<details class="logic-proof" id="'+argumentID+'"'+(principal?' open':'')+'><summary>'+esc(key+' · '+node.label)+'</summary>'+
    hypotheses+inputs+mechanism+'<p class="logic-conclusion">Argument in the edition '+heading+'</p>'+notes+'</details>';
}
function portableSVG(raw,branch) {
  let svg=raw.match(/<svg\b[\s\S]*<\/svg>/)?.[0];
  expect(svg&&!/<script|foreignObject|\bon[a-z]+\s*=/i.test(svg),'invalid diagram asset');
  // Graphviz view-local drawing IDs are distinct from canonical reader anchors.
  svg=svg.replace(/\bid="([^"]+)"/g,(_,id)=>'id="svg-'+branch+'-'+id+'"')
    .replace(/(xlink:href|href)="index\.html#([^"]+)"/g,(_,attr,target)=>attr+'="#'+target+'"');
  return svg.replace('<svg','<svg role="img" aria-label="Selected joint proof inputs"');
}
function gapsHTML(entries) {
  if(!entries.length)return '';
  return '<section id="open-steps"><h2>Open proof steps</h2>'+entries.map(([key,g])=>
    '<article class="logic-open" id="open-'+esc(key)+'"><h3>'+ref(g.href,key+' · '+g.label)+'</h3><p>'+esc(g.step)+'</p></article>').join('')+'</section>';
}
function makePages(data,bytes) {
  const chapters=Object.entries(data.chapters);
  const keys=Object.keys(data.arguments);
  const gaps=Object.entries(data.gaps);
  const pages=new Map();
  const chapterIndex='<h2>Chapter and supplement views</h2><ul class="logic-index">'+chapters.map(([slug,title])=>
    '<li>'+ref(chapterRoute(slug),title)+'</li>').join('')+'</ul>';
  const branches=data.principal.map(b=>{
    const union=new Set(b.targets.flatMap(id=>[id,...data.arguments[id].inputs.map(x=>x.key)]));
    return '<section class="logic-panel" id="'+b.id+'"><h2>'+esc(b.name)+'</h2>'+
      '<p>'+ref('#text-'+b.id,'Read the joint premises as text')+'</p>'+
      '<div class="logic-scroll" tabindex="0" aria-label="'+esc(b.name+' diagram')+'">'+portableSVG(bytes.get(b.id+'.svg').toString('utf8'),b.id)+'</div>'+
      '<div id="text-'+b.id+'"><h3>Arguments and premises</h3>'+b.targets.map(k=>argument(data,k,{principal:true})).join('')+
      '<h3>Edition records</h3><ul>'+[...union].sort().map(k=>'<li id="node-'+esc(k)+'">'+sourceProofTarget(k,data.nodes[k])+'</li>').join('')+'</ul></div></section>';
  }).join('');
  const selectedGaps=gaps.filter(([id])=>['NAG-002405','NAG-002737','NAG-002757'].includes(id));
  const lead='<h1>Foundations proof map</h1><p>Explore two worked branches, then open the chapter views for the full selected input register. Dashed lines connect registered proof inputs. An AND junction lists all the selected inputs of that argument. The proof page gives the full hypotheses and conclusion.</p>'+
    '<p>'+data.counts.proofArguments.toLocaleString('en-US')+' selected proof or scope records and '+Object.keys(data.gaps).length+
    ' historical whole-proof gaps are indexed. Standing context, external applications and unresolved pointers are shown separately.</p>'+
    '<p class="logic-links">'+ref('#chapter-views','Chapter views')+' '+ref('#open-steps','Open steps')+' '+ref(fixed+'logic/data.json','Typed map data')+' '+feedback(index)+'</p>';
  pages.set(file(index),shell('Foundations proof map',index,lead+branches+gapsHTML(selectedGaps)+'<section id="chapter-views">'+chapterIndex+'</section>'));
  for(const [slug,title] of chapters) {
    const subset=keys.filter(k=>data.arguments[k].chapter===slug);
    const chapterGaps=gaps.filter(([,g])=>g.chapter===slug);
    const route=chapterRoute(slug);
    const body='<p class="logic-links">'+ref(index,'Principal map')+' '+ref(project+'chapters/'+slug+'/','Read the chapter')+
      ' '+feedback(route)+'</p><h1>'+esc(title)+' · proof inputs</h1>'+
      (subset.length?'<section><h2>Selected arguments</h2>'+
        subset.map(k=>argument(data,k)).join('')+'</section>':'<p>No proof input record is exported for this chapter.</p>')+gapsHTML(chapterGaps);
    pages.set(file(route),shell(title+' proof inputs',route,body));
  }
  return pages;
}
function decorate(contents,data) {
  const byParent=new Map();
  for(const key of Object.keys(data.arguments)) {
    const id=data.nodes[key].id;
    if(!byParent.has(id))byParent.set(id,[]);
    byParent.get(id).push(key);
  }
  for(const [name,value] of contents) {
    if(!name.endsWith('/index.html'))continue;
    let text=value.toString('utf8');
    const item=/^r\/(NAG-\d{6})\/index\.html$/.exec(name);
    const chapter=/^projects\/foundations\/chapters\/([a-z0-9-]+)\/index\.html$/.exec(name);
    const home=name==='projects/foundations/index.html'||name==='projects/foundations/coverage/index.html';
    let section='';
    if(item) {
      const id=item[1], related=byParent.get(id)??[];
      if(related.includes(id)){
        const before=/<details class="source"><summary>(?:Full selected proof|Statement and full selected proof|Selected proof part 1) · exact TeX<\/summary>/;
        expect(before.test(text),'exact whole proof anchor missing '+id);
        text=text.replace(before,m=>m.replace('<details class="source">','<details class="source" id="foundations-exact-proof">'));
      }
      if(related.length)section+='<section id="logic-inputs" class="logic-inline"><h2>Proof map</h2>'+
        related.map(k=>argument(data,k,{body:true})).join('')+'</section>';
      if(data.gaps[id])section+='<p class="logic-open">'+ref(chapterRoute(data.gaps[id].chapter)+'#open-'+id,'This open step in the proof map')+'</p>';
    }
    if(chapter)section+='<p class="logic-inline">'+ref(chapterRoute(chapter[1]),'Chapter proof map')+'</p>';
    if(home)section+='<p class="logic-inline">'+ref(index,'Foundations proof map')+'</p>';
    if(section) {
      expect(text.includes('</main>'),'reader main marker missing '+name);
      text=text.replace('</main>',section+'</main>').replace('</head>','<link rel="stylesheet" href="'+fixed+'logic/logic.css"></head>');
      contents.set(name,Buffer.from(text));
    }
  }
}

export async function augmentFoundationsLogic(root,release) {
  const dir=path.join(root,directory);
  const manifestBytes=await regular(path.join(dir,'manifest.json'));
  expect(digest(manifestBytes)===logicManifestPin,'logic manifest hash mismatch');
  const manifest=JSON.parse(manifestBytes);
  expect(manifest.schema==='foundations-proof-map-release/v1'&&
    manifest.editionManifestSha256===digest(release.manifestBytes)&&
    (!release.current||release.current.logicManifestSha256===logicManifestPin),'companion is not selected on this edition');
  const names=(await readdir(dir)).sort();
  expect(names.join('|')===[...assets,'manifest.json'].sort().join('|'),'unexpected logic asset');
  const bytes=new Map();
  for(const name of assets) {
    const b=await regular(path.join(dir,name));
    expect(manifest.files[name]===digest(b)&&!privacy.test(b.toString('utf8')),'private or changed artifact '+name);
    bytes.set(name,b);
  }
  const data=JSON.parse(bytes.get('data.json').toString('utf8'));
  loadGraph(data,release);
  const contents=new Map(release.contents);
  decorate(contents,data);
  for(const [name,b] of makePages(data,bytes))contents.set(name,Buffer.from(b));
  // SVGs are embedded in the principal page. Use the generated HTML as the
  // destination for its canonical node and relation anchors.
  for(const name of ['data.json','logic.css'])contents.set((fixed+'logic/'+name).slice(1),bytes.get(name));
  contents.set((fixed+'logic/manifest.json').slice(1),manifestBytes);
  return {...release,contents};
}
