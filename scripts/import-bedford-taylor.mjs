import {readFile,writeFile,mkdir,readdir,lstat,access,mkdtemp,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

// One-way, allowlisted publication of an already audited unsigned reading tree.
// This command never imports the private project repository, corpus or archives.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const oldOrigin='https://nonarchimedean-bedford-taylor.spectacularsheep.chatgpt.site';
const projectPath='/projects/bedford-taylor';
const basePath='/math-research-atlas';
const origin='https://dongkaicheng.github.io/math-research-atlas';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const exists=async file=>{try{await access(file);return true;}catch{return false;}};
const args=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const sourceArg=option('--source');
const revision=option('--edition')||'v1.0.0';
const captureReceipt=option('--capture-receipt');
const receiptPath=option('--receipt')||path.join(root,'content/bedford-taylor/source-receipts/2026-11-18.json');
if(!sourceArg||!/^[v]\d+\.\d+\.\d+$/.test(revision))throw Error('Usage: node scripts/import-bedford-taylor.mjs --source <audited-dist> --edition v1.0.0');
const source=path.resolve(sourceArg);
const fixedPath=projectPath+'/editions/'+revision;
const fixedBase=basePath+fixedPath;
const fixedOrigin=origin+fixedPath;
const destination=path.join(root,'public',fixedPath.slice(1));
const releaseDirectory=path.join(root,'content','bedford-taylor','releases',revision);
const pointerFile=path.join(root,'content','bedford-taylor','current.json');
if(!captureReceipt&&(await exists(destination)||await exists(releaseDirectory)))throw Error('This edition already exists. Published editions are append-only; choose a new edition.');
const pointerExists=await exists(pointerFile);
if(pointerExists&&JSON.parse(await readFile(pointerFile,'utf8')).project!=='bedford-taylor')throw Error('The existing current pointer belongs to another project.');
const allowedRoots=new Set(['assets','comparison','conjectures','data','downloads','for-agents','papers','programme','references','results','search','sources']);
const allowedRootFiles=new Set(['index.html','404.html','robots.txt','sitemap.xml','llms.txt']);
async function list(directory,prefix=''){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const rel=prefix+entry.name,file=path.join(directory,entry.name),stat=await lstat(file);
    if(stat.isSymbolicLink())throw Error('Symlinks are not allowed in a public reading export: '+rel);
    if(entry.name.startsWith('.'))throw Error('Hidden paths are not public inputs: '+rel);
    if(entry.isDirectory())files.push(...await list(file,rel+'/'));
    else if(entry.isFile())files.push(rel);
    else throw Error('Unsupported input type: '+rel);
  }
  return files.sort();
}
const inputFiles=await list(source);
for(const rel of inputFiles){const top=rel.split('/')[0];if(!(rel.includes('/')?allowedRoots.has(top):allowedRootFiles.has(rel)))throw Error('Input outside the public allowlist: '+rel);}
const sourceProject=JSON.parse(await readFile(path.join(source,'data/project.json'),'utf8'));
if(sourceProject.authorPolicy!=='omit'||sourceProject.authors.length)throw Error('The selected input is not an unsigned reading edition.');
const topics=JSON.parse(await readFile(path.join(source,'data/topics.json'),'utf8'));
const definitions=JSON.parse(await readFile(path.join(source,'data/definitions.json'),'utf8'));
const programme=JSON.parse(await readFile(path.join(source,'data/programme.json'),'utf8'));
const statements=JSON.parse(await readFile(path.join(source,'data/statements.json'),'utf8'));
const sourceManifest=JSON.parse(await readFile(path.join(source,'data/source-manifest.json'),'utf8'));
const actualCounts={topics:topics.length,definitions:definitions.definitions.length,formalMatureStatements:statements.length,formalProgrammeItems:programme.items.length,proofSources:sourceManifest.length,pdfs:inputFiles.filter(f=>f.endsWith('.pdf')).length,zips:inputFiles.filter(f=>f.endsWith('.zip')).length,sourceFiles:inputFiles.length};
const inputInventory=[];
for(const rel of inputFiles){const b=await readFile(path.join(source,rel));inputInventory.push({path:rel,sha256:sha(b),bytes:b.length});}
// Capturing a checksum receipt is not approval or a mathematical review. The
// receipt must be inspected and accepted with its audit in the publication PR.
if(captureReceipt){
  const target=path.resolve(captureReceipt),allowed=path.join(root,'content/bedford-taylor/source-receipts')+path.sep;
  if(!target.startsWith(allowed)||await exists(target))throw Error('New receipts must have a new filename within content/bedford-taylor/source-receipts/.');
  const commit=option('--source-commit'),reportFile=option('--audit-report');
  if(!/^[a-f0-9]{40}$/.test(commit||'')||!reportFile)throw Error('Receipt capture requires --source-commit <40-hex> and --audit-report <completed public-export audit>.');
  const auditBytes=await readFile(reportFile),audit=JSON.parse(auditBytes.toString('utf8'));
  if(audit.valid!==true||audit.findings?.length||audit.counts?.servedAssetsInspected!==inputFiles.length)throw Error('The supplied audit must pass and cover this input file count.');
  const receipt={schemaVersion:1,project:'bedford-taylor',sourceCommit:commit,sourceEdition:sourceProject.sourceEdition,readingEdition:sourceProject.webEdition,authorPolicy:'omit',counts:actualCounts,allowedFiles:inputInventory,
    audit:{filename:path.basename(reportFile),sha256:sha(auditBytes),scope:audit.scope,mathematicalProofCorrectnessVerified:false},
    acceptancePolicy:'Inspect the exact source and completed artifact audit before accepting this receipt in a reviewed publication change. The checksum receipt is not a proof certificate.'};
  await mkdir(path.dirname(target),{recursive:true});await writeFile(target,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({receipt:target,counts:actualCounts,publicationChanged:false},null,2));
  process.exit(0);
}
const receiptBytes=await readFile(receiptPath),receipt=JSON.parse(receiptBytes.toString('utf8'));
if(receipt.schemaVersion!==1||receipt.project!=='bedford-taylor'||receipt.authorPolicy!=='omit'||!/^[a-f0-9]{40}$/.test(receipt.sourceCommit||''))throw Error('Invalid public-export source receipt.');
if(receipt.sourceEdition!==sourceProject.sourceEdition||receipt.readingEdition!==sourceProject.webEdition)throw Error('Source dates do not match the selected reviewed receipt.');
if(JSON.stringify(receipt.allowedFiles)!==JSON.stringify(inputInventory))throw Error('Input paths or bytes do not match the exact public allowlist. Obtain a newly audited receipt; do not weaken this gate.');
for(const [key,value] of Object.entries(actualCounts))if(receipt.counts[key]!==value)throw Error('Receipt coverage mismatch: '+key);
const sourceCommit=receipt.sourceCommit;
for(const entry of sourceManifest){
  const rel=entry.url.replace(/^\//,'');
  if(!inputFiles.includes(rel)||sha(await readFile(path.join(source,rel)))!==entry.sha256)throw Error('Source binding failed: '+entry.id);
}
const recordAt=new Map(topics.map(t=>[t.url,t.id]));
const fileRoutes=new Set(inputFiles.map(f=>f==='index.html'?'/':f.endsWith('/index.html')?'/'+f.slice(0,-10):'/'+f));
const routes=[...fileRoutes].filter(route=>route.endsWith('/')||route==='/404.html').sort();
const mapURL=value=>{
  if(value.startsWith(oldOrigin))return fixedOrigin+value.slice(oldOrigin.length);
  if(value.startsWith('/')&&!value.startsWith('//')){
    const p=value.split(/[?#]/)[0];
    if(fileRoutes.has(p)||allowedRoots.has(p.slice(1).split('/')[0]))return fixedBase+value;
  }
  return value;
};
const mapAttributes=text=>text.replace(/\b(href|src|action)=("|')([^"']*)\2/g,(_all,key,quote,value)=>key+'='+quote+mapURL(value)+quote);
function mapData(value){
  if(Array.isArray(value))return value.map(mapData);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,mapData(v)]));
  if(typeof value==='string')return mapAttributes(mapURL(value)).replaceAll(oldOrigin,fixedOrigin);
  return value;
}
const importedAt=new Date().toISOString();
const sourceHashes=new Map(inputInventory.map(f=>[f.path,{sha256:f.sha256,bytes:f.bytes}]));
const transformed=new Map();
await mkdir(path.join(root,'.cache'),{recursive:true});
const staging=await mkdtemp(path.join(root,'.cache','bt-import-'));
const stage=path.join(staging,'edition');
await mkdir(stage);
async function save(rel,data,reason){
  const file=path.join(stage,rel);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,data);
  transformed.set(rel,reason);
}
function feedbackURL(route){
  const q=new URLSearchParams({project:'bedford-taylor',version:revision,page:fixedOrigin+route});
  if(recordAt.has(route))q.set('entry',recordAt.get(route));
  return basePath+'/feedback/?'+q.toString();
}
function chrome(route){
  return `<div class="atlas-project-bar"><div class="shell"><a href="${basePath}/">Conjecture Atlas</a><nav aria-label="Atlas navigation"><a data-atlas-feedback href="${esc(feedbackURL(route))}">Shared feedback</a><a data-atlas-edition="frozen" href="${fixedBase+route}">Edition ${revision}</a><a data-atlas-current href="${basePath+projectPath+route}">Current version</a><a href="${basePath}/feedback/guide/">Contribution guide</a></nav></div></div>`;
}
// Use only registered identities whose literal anchor occurs on that page.
// The same TeX label in another article must never acquire this article's ID.
const feedbackAnchors = {};
const formalRoutes = ['/papers/bedford-taylor-products/', '/papers/research-program/', '/conjectures/', '/programme/'];
const pageAnchors = new Map();
for (const route of formalRoutes) {
  if (!fileRoutes.has(route)) continue;
  const text = await readFile(path.join(source, route.slice(1), 'index.html'), 'utf8');
  pageAnchors.set(route, new Set([...text.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])));
}
function bindFeedbackAnchor(route, label, id) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(label || '') || !/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(id || '') || !pageAnchors.get(route)?.has(label)) return;
  const key = fixedBase + route + '#' + label;
  if (feedbackAnchors[key] && feedbackAnchors[key] !== id) throw Error('Conflicting registered feedback identity: ' + key);
  feedbackAnchors[key] = id;
}
for (const item of statements) bindFeedbackAnchor('/papers/bedford-taylor-products/', item.legacyLabel, item.mpmId || item.id);
for (const item of programme.items) {
  const id = item.mpmId || item.id;
  const label = item.paperLink?.htmlId || item.latex_label;
  bindFeedbackAnchor('/papers/research-program/', label, id);
  for (const route of ['/conjectures/', '/programme/']) {
    bindFeedbackAnchor(route, label, id);
    bindFeedbackAnchor(route, item.id?.toLowerCase(), id);
  }
}
for(const rel of inputFiles){
  const bytes=await readFile(path.join(source,rel));sourceHashes.set(rel,{sha256:sha(bytes),bytes:bytes.length});
  if(rel.endsWith('.zip'))continue;
  if(rel.endsWith('.html')){
    const route=rel==='index.html'?'/':rel.endsWith('/index.html')?'/'+rel.slice(0,-10):'/'+rel;
    let text=mapAttributes(bytes.toString('utf8')).replaceAll(oldOrigin,fixedOrigin);
    // The original Sites edition shares the same board, but its source-page
    // context and hash handler must become this frozen Atlas edition's context.
    text=text.replace(/<a\b[^>]*\bdata-source-feedback(?:=(?:"[^"]*"|'[^']*'))?[^>]*>/g,tag=>tag
      .replace(/\bdata-source-feedback(?:=(?:"[^"]*"|'[^']*'))?/, 'data-atlas-feedback')
      .replace(/\bhref=(?:"[^"]*"|'[^']*')/, 'href="'+esc(feedbackURL(route))+'"'));
    text=text.replace(/<script\b[^>]*\bsrc=("|')[^"']*\/assets\/source-feedback\.js(?:[?#][^"']*)?\1[^>]*>\s*<\/script>/g,'');
    text=text.replace('<meta name="robots" content="noindex,nofollow">','<meta name="robots" content="noindex,follow">');
    text=text.replace(/<body\b([^>]*)>/,`<body$1 data-bt-page-base="${fixedBase}" data-bt-edition="${revision}">`);
    text=text.replace('<header class="site-header">',chrome(route)+'<header class="site-header">');
    text=text.replace('</head>',`<link rel="stylesheet" href="${fixedBase}/assets/atlas-publication.css"><script defer src="${fixedBase}/assets/atlas-feedback.js"></script></head>`);
    text=text.replace('<nav class="footer-links" aria-label="Footer">',`<nav class="footer-links" aria-label="Footer"><a href="${basePath+projectPath}/versions/">Versions</a><a data-atlas-feedback href="${esc(feedbackURL(route))}">Feedback</a><a href="${basePath}/maintenance/">Maintenance</a>`);
    await save(rel,text,'edition-bound links, canonical metadata and shared feedback chrome');
  }else if(rel.endsWith('.json')){
    const data=mapData(JSON.parse(bytes.toString('utf8')));
    if(rel==='data/project.json'){
      data.audience='public';data.origin=fixedOrigin;delete data.siteId;delete data.presentation.reference;
      data.atlasProject='bedford-taylor';data.atlasEdition=revision;data.currentURL=origin+projectPath+'/';
      data.publicationState='Public unsigned reading edition; mathematical source and review status are unchanged.';
    }
    await save(rel,JSON.stringify(data,null,2)+'\n','public metadata and edition-bound URLs');
  }else if(rel==='assets/site.js'){
    let js=bytes.toString('utf8');
    const replacements=[
      ["(()=>{'use strict';",`(()=>{'use strict';\n const BT_PAGE_BASE=document.body.dataset.btPageBase||${JSON.stringify(fixedBase)};`],
      ["location.pathname==='/results/'","location.pathname===BT_PAGE_BASE+'/results/'"],
      ["location.replace('/results/catalogue/'+","location.replace(BT_PAGE_BASE+'/results/catalogue/'+"],
      ["location.assign('/search/')","location.assign(BT_PAGE_BASE+'/search/')"],
      ["fetch('/data/search-index.json')",`fetch(${JSON.stringify(fixedBase+'/data/search-index.json')})`],
    ];
    for(const [from,to] of replacements){if(!js.includes(from))throw Error('Unexpected site.js; inspect before rebasing: '+from);js=js.replace(from,to);}
    js=mapAttributes(js);
    await save(rel,js,'subpath-aware search, shortcut and legacy catalogue redirect');
  }else if(rel==='robots.txt'){
    await save(rel,'# This is an edition resource. The atlas root robots.txt controls crawling.\n','public edition metadata; no site-wide crawl rule');
  }else if(rel==='sitemap.xml'){
    await save(rel,bytes.toString('utf8').replaceAll(oldOrigin,fixedOrigin),'edition-bound URLs; atlas root sitemap selects current pages');
  }else if(rel==='llms.txt'){
    let text=bytes.toString('utf8').replaceAll(oldOrigin,fixedOrigin);
    text=text.replace("All endpoints are read-only and inherit the site's audience. No anonymous bypass or public editing interface is provided.",'This public reading edition is read-only. Feedback is submitted through the atlas’s shared GitHub Issues; reader comments do not modify the mathematical corpus.');
    text+='\n## Publication\nAtlas edition: '+revision+'\nCurrent project: '+origin+projectPath+'/\nShared feedback: '+origin+'/feedback/?project=bedford-taylor&version='+revision+'\n';
    await save(rel,text,'public access statement and edition-bound URLs');
  }else await save(rel,bytes,'unchanged audited reading bytes');
}
await save('assets/atlas-publication.css',`.atlas-project-bar{background:#e8ece4;border-bottom:1px solid #cbd5c8;font:500 .86rem/1.5 system-ui,sans-serif}.atlas-project-bar>.shell{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.atlas-project-bar nav{display:flex;align-items:center;flex-wrap:wrap;gap:8px 18px}.atlas-project-bar a{display:inline-flex;align-items:center;min-height:44px;color:#22546c;text-decoration:underline;text-underline-offset:3px}.atlas-project-bar a:focus-visible{outline:2px solid #276278;outline-offset:3px}.atlas-project-bar>a{font-weight:700}@media(max-width:720px){.atlas-project-bar>.shell{gap:0;padding-block:5px}.atlas-project-bar nav{gap:0 14px}.atlas-project-bar a{font-size:.79rem;min-height:40px}}\n`,'generated atlas navigation styles');
await save('assets/atlas-feedback.js',`(()=>{'use strict';
const anchors=${JSON.stringify(feedbackAnchors)};
const links=[...document.querySelectorAll('[data-atlas-feedback]')].map(link=>{
  try{const url=new URL(link.href),page=new URL(url.searchParams.get('page'));return {link,url,page,entry:url.searchParams.get('entry')||''};}catch{return null;}
}).filter(Boolean);
const update=()=>{
  let anchor=location.hash.slice(1);try{anchor=decodeURIComponent(anchor);}catch{anchor='';}
  for(const {link,url,page,entry} of links){
    const u=new URL(url.href),p=new URL(page.href);p.hash=location.hash;
    const id=anchors[p.pathname+'#'+anchor]||entry;
    if(id)u.searchParams.set('entry',id);else u.searchParams.delete('entry');
    u.searchParams.set('page',p.href);link.href=u.href;
  }
};update();addEventListener('hashchange',update);})();\n`,'generated exact-page and registered-entry feedback context');

// Rebuild the two existing reading-source ZIP addresses from this publication's
// own public files; never copy the historical signed or complete private ZIPs.
const members=(await list(stage)).filter(rel=>rel.startsWith('sources/files/')||rel.startsWith('data/')||/^downloads\/.*\.(tex|csv|json)$/.test(rel));
const zipStage=path.join(staging,'zip');await mkdir(zipStage);
const zipMembers=[];
for(const rel of members){const b=await readFile(path.join(stage,rel));const dst=path.join(zipStage,rel);await mkdir(path.dirname(dst),{recursive:true});await writeFile(dst,b);zipMembers.push({path:rel,sha256:sha(b),bytes:b.length});}
const readme=Buffer.from(`Non-Archimedean Bedford–Taylor Theory\nPublic Atlas edition ${revision}; source reading edition ${sourceProject.webEdition}.\n\nThis package contains the unsigned reading sources and public metadata served by this exact Atlas edition. Source and PDF mathematical status is unchanged. Each source-manifest entry distinguishes the reading-copy SHA-256 from its original-source identity. Website URLs are bound to this frozen edition. Older source-download filenames supply this same public reading package, not a byte-exact historical archive.\n\nNo private full archive, signed original or private feedback is included. Publication checks establish artifact consistency, not independent proof acceptance.\n\nFrozen edition: ${fixedOrigin}/\nFeedback: ${origin}/feedback/?project=bedford-taylor&version=${revision}\n`);
await writeFile(path.join(zipStage,'README.txt'),readme);zipMembers.push({path:'README.txt',sha256:sha(readme),bytes:readme.length});
const zipFile=path.join(staging,'reading-sources.zip');
execFileSync('zip',['-q','-X',zipFile,...zipMembers.map(m=>m.path)],{cwd:zipStage,maxBuffer:1024*1024});
const zipBytes=await readFile(zipFile);
for(const rel of inputFiles.filter(f=>f.endsWith('.zip')))await save(rel,zipBytes,'public metadata and edition-bound URLs; rebuilt reading archive');

const files=[];
for(const rel of await list(stage)){const b=await readFile(path.join(stage,rel)),before=sourceHashes.get(rel);files.push({path:rel,sha256:sha(b),bytes:b.length,sourceSha256:before?.sha256??null,sourceBytes:before?.bytes??null,transformation:transformed.get(rel)});}
const manifest={schemaVersion:1,project:'bedford-taylor',revision,publishedAt:importedAt,
  original:{siteOrigin:oldOrigin,sourceCommit,sourceEdition:sourceProject.sourceEdition,readingEdition:sourceProject.webEdition,sourceReceipt:path.basename(receiptPath),sourceReceiptSha256:sha(receiptBytes)},
  publication:{basePath,origin,projectPath,fixedPath,authorPolicy:'omit',audience:'public'},
  counts:{...actualCounts,publicFiles:files.length+1,htmlPages:routes.length},
  recordIds:topics.map(t=>t.id),routes,files,zipMembers,
  sourceMathState:{
    topicStatuses:topics.map(({id,sourceStatus,sourceStatusCode,reviewStatus})=>({id,sourceStatus,sourceStatusCode,reviewStatus})),
    statements:statements.map(item=>({id:item.id,statementTexSha256:sha(item.statementTex||''),reviewStatus:item.reviewStatus,sourceStatus:item.sourceStatus})),
    programme:programme.items.map(item=>({id:item.id,status:item.status,statementSha256:sha(item.statement||'')})),
  },
  statusPolicy:sourceProject.statusPolicy,
  review:{scope:'Unsigned reading-export provenance, unchanged mathematical payloads and byte bindings. No new proof acceptance.',mathematicalProofCorrectnessVerified:false},
};
const manifestText=JSON.stringify(manifest,null,2)+'\n';await writeFile(path.join(stage,'manifest.json'),manifestText);
await mkdir(path.dirname(destination),{recursive:true});await rename(stage,destination);
await mkdir(releaseDirectory,{recursive:true});await writeFile(path.join(releaseDirectory,'manifest.json'),manifestText);
if(!pointerExists)await writeFile(pointerFile,JSON.stringify({schemaVersion:1,project:'bedford-taylor',revision},null,2)+'\n');
console.log(JSON.stringify({revision,destination,currentPointerCreated:!pointerExists,counts:manifest.counts,manifestSha256:sha(manifestText)},null,2));
