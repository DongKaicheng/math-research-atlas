import {readFile,writeFile,mkdir,readdir,cp,access,unlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const projectPath='/projects/strong-green';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const exists=async file=>{try{await access(file);return true;}catch{return false;}};
const trailing=route=>route==='/'?'/':route.replace(/\/$/,'')+'/';
const nav=[['/','Overview'],['/conjectures','Conjectures'],['/results','Progress'],['/routes','Routes'],['/programme','Plan'],['/papers','Papers']];

/** Render the public BB edition without a Next server or a second feedback store.
 * The mathematical records and paper bodies are release inputs. Static page
 * views preserve the curated publication's text; they are not proof reviewers.
 * Frozen HTML/assets already present in public/ are copied byte for byte.
 */
export async function buildStrongGreen({root,output,base,origin,repository}){
  const publicRoot=path.join(root,'public');
  const releaseRoot=path.join(root,'content','strong-green','releases');
  const publication=JSON.parse(await readFile(path.join(root,'content','strong-green','current.json'),'utf8'));
  const revision=publication.revision;
  if(!/^v\d+\.\d+\.\d+$/.test(revision||''))throw Error('Invalid current strong-green publication pointer');
  const atlasProject=JSON.parse(await readFile(path.join(root,'content','projects','strong-green.json'),'utf8'));
  if(atlasProject.edition!==revision)throw Error('Strong-green atlas card and current publication pointer disagree; revise both in the same publication');
  const releaseDirectories=(await readdir(releaseRoot)).filter(x=>/^v\d+\.\d+\.\d+$/.test(x));
  if(!releaseDirectories.includes(revision))throw Error('The current strong-green publication is missing');
  const releases=[];
  for(const candidate of releaseDirectories){
    if(candidate===revision||await exists(path.join(publicRoot,projectPath.slice(1),'editions',candidate,'index.html')))releases.push(candidate);
  }
  releases.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const release=path.join(releaseRoot,revision);
  const bundle=JSON.parse(await readFile(path.join(release,'bundle.json'),'utf8'));
  if(bundle.edition.revision!==revision)throw Error('Strong-green release and bundle revision disagree');
  const project=bundle.project;
  const views=path.join(root,'strong-green','views');
  const editionPath=projectPath+'/editions/'+revision;
  const frozenRoot=path.join(output,editionPath.slice(1));
  const frozenPublicRoot=path.join(publicRoot,editionPath.slice(1));
  const assetPath=editionPath+'/assets';
  const cache=path.join(root,'.cache','strong-green');
  await mkdir(cache,{recursive:true});
  await mkdir(frozenRoot,{recursive:true});

  const pageFiles={
    home:'app/page.tsx',conjectures:'app/conjectures/page.tsx',results:'app/results/page.tsx',
    researchMap:'app/research-map/page.tsx',
    routes:'app/routes/page.tsx',route:'app/routes/[slug]/page.tsx',programme:'app/programme/page.tsx',
    papers:'app/papers/page.tsx',paper:'app/papers/[slug]/page.tsx',records:'app/records/page.tsx',
    entry:'app/entries/[id]/page.tsx',dependencies:'app/dependencies/page.tsx',sources:'app/sources/page.tsx',about:'app/about/page.tsx',
  };
  const entryCode=Object.entries(pageFiles).map(([name,file])=>`import * as ${name} from ${JSON.stringify(path.join(views,file))};`).join('\n')+
    '\nexport const pages={'+Object.keys(pageFiles).join(',')+'};\n'+
    'export {globalRoutes} from '+JSON.stringify(path.join(views,'content','routes.mjs'))+';\n'+
    'export {papers} from '+JSON.stringify(path.join(views,'lib','papers.ts'))+';\n';
  const rendererFile=path.join(cache,'renderer-'+process.pid+'-'+Date.now()+'.mjs');
  await build({
    stdin:{contents:entryCode,resolveDir:root,sourcefile:'public-research-renderer.ts'},
    outfile:rendererFile,bundle:true,platform:'node',format:'esm',jsx:'automatic',packages:'external',logLevel:'silent',
    plugins:[{name:'public-research-inputs',setup(plugin){
      plugin.onResolve({filter:/^@\//},args=>{
        const rel=args.path.slice(2);
        let target=rel==='content/bundle.json'?path.join(release,'bundle.json'):
          rel.startsWith('content/papers/')?path.join(release,'papers',rel.slice('content/papers/'.length)):path.join(views,rel);
        return {path:target,namespace:'research-resolve',pluginData:{target}};
      });
      plugin.onLoad({filter:/.*/,namespace:'research-resolve'},async args=>{
        const initial=args.pluginData.target;
        const candidates=path.extname(initial)?[initial]:[initial+'.tsx',initial+'.ts',initial+'.mjs',initial+'.json'];
        let file;
        for(const candidate of candidates)if(await exists(candidate)){file=candidate;break;}
        if(!file)throw Error('Missing curated public view or release input: '+initial);
        const ext=path.extname(file).slice(1);
        if(ext==='css')return {contents:'',loader:'js',resolveDir:path.dirname(file)};
        return {contents:await readFile(file,'utf8'),loader:ext==='mjs'?'js':ext,resolveDir:path.dirname(file)};
      });
      plugin.onResolve({filter:/^next\/navigation$/},()=>({path:'navigation',namespace:'public-shim'}));
      plugin.onLoad({filter:/.*/,namespace:'public-shim'},()=>({contents:'export function notFound(){throw new Error("Unknown public mathematical page");}',loader:'js'}));
    }}],
  });
  let rendered;
  try{rendered=await import(pathToFileURL(rendererFile).href);}finally{await unlink(rendererFile);}
  const {pages,papers,globalRoutes}=rendered;
  const specs=[
    ['/',pages.home],['/conjectures',pages.conjectures],['/results',pages.results],['/routes',pages.routes],
    ['/research-map',pages.researchMap,undefined,{currentOnly:true}],
    ['/programme',pages.programme],['/papers',pages.papers],['/records',pages.records],
    ['/dependencies',pages.dependencies],['/sources',pages.sources],['/about',pages.about],
    ...globalRoutes.map(route=>['/routes/'+route.slug,pages.route,{slug:route.slug}]),
    ...papers.map(paper=>['/papers/'+paper.slug,pages.paper,{slug:paper.slug}]),
    ...bundle.entries.map(entry=>['/entries/'+entry.id,pages.entry,{id:entry.id}]),
  ];

  const url=p=>base+p;
  const currentAssetNames=['research-map.css','research-map.js','logic-tree.css'];
  const currentAssetVersions=new Map(await Promise.all(currentAssetNames.map(async name=>[
    name,createHash('sha256').update(await readFile(path.join(root,'strong-green',name))).digest('hex').slice(0,16),
  ])));
  const currentAsset=name=>url(projectPath+'/assets/'+name)+'?v='+currentAssetVersions.get(name);
  function link(href,namespace){
    if(href.startsWith('/atlas-feedback/'))return url('/feedback/')+href.slice('/atlas-feedback/'.length);
    if(href==='/atlas-maintenance/')return url('/maintenance/');
    if(href.startsWith('/projects/strong-green/'))return url(href);
    // This reading guide follows the current records; it is not part of a
    // previously frozen mathematical edition.
    if(/^\/research-map(?:[/?#]|$)/.test(href))return url(projectPath+'/research-map/')+href.slice('/research-map'.length).replace(/^\//,'');
    if(base&&href.startsWith(base+'/'))return href;
    if(/^\/feedback(?:[/?#]|$)/.test(href)){
      if(href.startsWith('/feedback/guide'))return url('/feedback/guide/');
      const extra=href.includes('?')?'&'+href.split('?')[1]:'';
      return url('/feedback/')+'?project=strong-green&amp;version='+revision+extra;
    }
    if(href.startsWith('/source-files/'))return url(editionPath+href);
    if(/^\/papers\/[^/#?]+\.(?:pdf|tex)(?:[?#]|$)/.test(href))return url(editionPath+href);
    if(href.startsWith('/editions/'))return url(projectPath+href);
    if(href==='/versions/'+revision||href==='/versions/'+revision+'/')return url(editionPath+'/');
    if(href.startsWith('/manuscripts/'))throw Error('Signed historical asset is not a public export: '+href);
    if(href.startsWith('/')&&!href.startsWith('//')){
      const split=href.search(/[?#]/),p=split<0?href:href.slice(0,split),suffix=split<0?'':href.slice(split);
      return url(namespace+(p==='/'?'/':/\.[A-Za-z\d]+$/.test(p)?p:trailing(p)))+suffix;
    }
    return href;
  }
  const rewrite=(html,namespace)=>html.replace(/\b(href|src)="([^"]*)"/g,(_all,attr,href)=>`${attr}="${link(href,namespace)}"`);
  function frame(title,description,body,route,namespace,{archived=false,noindex=false}={}){
    const relative=namespace+(route==='/'?'/':trailing(route));
    const canonical=origin+relative;
    const feedback=url('/feedback/')+'?project=strong-green&amp;version='+revision+'&amp;page='+encodeURIComponent(canonical);
    const projectNav=archived?nav:[nav[0],['/research-map','Research map'],...nav.slice(1)];
    return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Conjecture Atlas</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}">
${noindex||archived?'<meta name="robots" content="noindex,follow">':''}
<link rel="icon" type="image/svg+xml" href="${url('/assets/favicon.svg')}"><link rel="stylesheet" href="${url(assetPath+'/katex.min.css')}"><link rel="stylesheet" href="${url(assetPath+'/strong-green.css')}">
${archived?'':`<link rel="stylesheet" href="${currentAsset('research-map.css')}">`}
${!archived&&route==='/research-map'?`<link rel="stylesheet" href="${currentAsset('logic-tree.css')}">`:''}
</head><body><a class="skip-link" href="#main-content">Skip to content</a>
<div class="atlas-project-bar"><div class="site-shell"><a href="${url('/')}">Conjecture Atlas</a><nav aria-label="Atlas navigation"><a href="${url('/research/')}">All research projects</a><a href="${feedback}">Shared feedback</a><a href="${url('/feedback/guide/')}">Contribution guide</a></nav></div></div>
<header class="site-header simple-site-header"><div class="site-shell masthead"><a class="site-brand" href="${url(namespace+'/')}"><span class="brand-title">${esc(project.title)}</span></a>
<nav class="primary-nav" aria-label="Project navigation">${projectNav.map(([p,label])=>`<a href="${link(p,namespace)}"${route===p||(p!=='/'&&route.startsWith(p+'/'))?' aria-current="page"':''}>${label}</a>`).join('')}</nav></div></header>
${archived?`<div class="edition-banner"><div class="site-shell">Frozen public edition ${esc(revision)}. <a href="${url(projectPath+(route==='/'?'/':trailing(route)))}">Read the current version of this page</a>.</div></div>`:''}
<main id="main-content">${body}</main>
<footer class="site-footer simple-site-footer"><div class="site-shell footer-inner"><nav class="footer-links" aria-label="Research resources">${[['/records','Permanent records'],['/dependencies','Dependencies'],['/sources','Sources'],['/versions','Versions'],['/about','Review policy']].map(([p,label])=>`<a href="${link(p,namespace)}">${label}</a>`).join('')}<a href="${feedback}">Feedback</a><a href="${url('/maintenance/')}">Maintenance</a></nav></div></footer>
${route==='/records'?`<script defer src="${url(assetPath+'/records.js')}"></script>`:''}${route==='/research-map'&&!archived?`<script defer src="${currentAsset('research-map.js')}"></script>`:''}</body></html>\n`;
  }
  async function save(route,html){
    const file=path.join(output,route.replace(/^\//,'').replace(/\/$/,'')||'.','index.html');
    await mkdir(path.dirname(file),{recursive:true});await writeFile(file,html);
  }
  async function frozenAsset(rel,create){
    const destination=path.join(frozenRoot,rel),source=path.join(frozenPublicRoot,rel);
    await mkdir(path.dirname(destination),{recursive:true});
    if(await exists(source))await cp(source,destination,{recursive:true});else await create(destination);
  }
  const cssFiles=['app/globals.css','app/research-layout.css','app/paper-layout.css','app/pairing-progress.css','app/programme-layout.css','app/routes-layout.css'];
  const css=(await Promise.all(cssFiles.map(file=>readFile(path.join(views,file),'utf8')))).join('\n')+'\n'+await readFile(path.join(root,'strong-green','static.css'),'utf8');
  await frozenAsset('assets/strong-green.css',destination=>writeFile(destination,css));
  await frozenAsset('assets/records.js',destination=>cp(path.join(root,'strong-green','records.js'),destination));
  await frozenAsset('assets/katex.min.css',destination=>cp(path.join(root,'node_modules','katex','dist','katex.min.css'),destination));
  await frozenAsset('assets/fonts',destination=>cp(path.join(root,'node_modules','katex','dist','fonts'),destination,{recursive:true}));

  // Current navigation has its own assets. Never overwrite edition assets to
  // introduce a new reading view or change an archived page's navigation.
  const currentAssets=path.join(output,projectPath.slice(1),'assets');
  await mkdir(currentAssets,{recursive:true});
  for(const name of currentAssetNames)await cp(path.join(root,'strong-green',name),path.join(currentAssets,name));

  const routes=[],indexableRoutes=[],searchIndex=[];
  for(const [route,module,params,options={}] of specs){
    const props=params?{params:Promise.resolve(params)}:{};
    const metadata=module.generateMetadata?await module.generateMetadata(props):module.metadata||{};
    const title=typeof metadata.title==='string'?metadata.title:metadata.title?.absolute||project.title;
    const description=metadata.description||project.summary;
    const node=await module.default(props);
    const body=renderToStaticMarkup(node);
    const currentRoute=projectPath+(route==='/'?'/':trailing(route));
    await save(currentRoute,frame(title,description,rewrite(body,projectPath),route,projectPath,{noindex:metadata.robots?.index===false}));
    routes.push(currentRoute);if(metadata.robots?.index!==false)indexableRoutes.push(currentRoute);
    if(!options.currentOnly){
      const fixedRoute=editionPath+(route==='/'?'/':trailing(route));
      const frozenFile=path.join(frozenPublicRoot,route==='/'?'index.html':route.slice(1)+'/index.html');
      if(await exists(frozenFile)){
        const destination=path.join(output,fixedRoute.slice(1),'index.html');await mkdir(path.dirname(destination),{recursive:true});await cp(frozenFile,destination);
      }else await save(fixedRoute,frame(title,description,rewrite(body,editionPath),route,editionPath,{archived:true}));
      routes.push(fixedRoute);
    }
    if(route.startsWith('/entries/')){
      const record=bundle.entries.find(entry=>entry.id===params.id);
      searchIndex.push({title:record.title,summary:record.summary,keywords:[...project.keywords,record.id,record.kind,record.status],link:url(currentRoute),category:record.kind,status:record.status,id:record.id,body:[record.id,record.title,record.statement,record.proof,record.motivation,record.approach,record.status].filter(Boolean).join(' ')});
    }else searchIndex.push({title,summary:description,keywords:project.keywords,link:url(currentRoute),category:route.startsWith('/papers/')?'paper':'research',body:body.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,160000)});
  }

  const versionsBody=`<div class="site-shell"><header class="page-header"><p class="eyebrow">Publication history</p><h1>Versions and corrections.</h1><p>Current pages follow the latest edition. Fixed edition URLs retain the published pages, source files, PDFs and checksums.</p><p><a class="text-link" href="${url(editionPath+'/checksums.json')}" download>Download all file checksums for ${esc(revision)}</a></p></header>
${[...releases].reverse().map(v=>`<section class="version-summary"><h2><a href="${url(projectPath+'/editions/'+v+'/')}">Public edition ${esc(v)}</a></h2><p>${v===revision?'GitHub publication with unsigned sources and the atlas’s shared feedback system. Mathematical record IDs, hypotheses and statuses are preserved.':'A retained public edition.'}</p><div class="hero-actions"><a class="button button-secondary" href="${url(projectPath+'/editions/'+v+'/')}">Read this edition</a><a class="text-link" href="${url(projectPath+'/editions/'+v+'/research.json')}" download>Research records</a><a class="text-link" href="${url(projectPath+'/editions/'+v+'/manifest.json')}" download>Release manifest</a></div></section>`).join('')}
<section class="version-summary"><h2>Before the first full GitHub edition</h2><p>The <a href="${url(projectPath+'/versions/0/')}">original atlas outline (version 0)</a> is retained. Earlier private development editions are not redistributed here. This publication does not expose signed archival manuscripts or private feedback.</p></section>
<section class="version-summary"><h2>How corrections are published</h2><p>Feedback is discussed in a shared GitHub Issue, checked against its source, and linked to a proposed change. Accepted mathematical corrections enter a new edition; older mathematical text is retained and accompanied by an explicit correction notice where needed.</p><p><a href="${url('/feedback/?project=strong-green')}">Discuss a correction</a> · <a href="${url('/maintenance/')}">Maintenance policy</a> · <a href="https://github.com/${esc(repository)}/commits/main">Repository history</a></p></section></div>`;
  await save(projectPath+'/versions/',frame('Version history','Frozen public editions, correction policy and repository history.',versionsBody,'/versions',projectPath));
  routes.push(projectPath+'/versions/');indexableRoutes.push(projectPath+'/versions/');
  const fixedVersions=path.join(frozenPublicRoot,'versions','index.html');
  if(await exists(fixedVersions)){
    await mkdir(path.join(frozenRoot,'versions'),{recursive:true});await cp(fixedVersions,path.join(frozenRoot,'versions','index.html'));
  }else await save(editionPath+'/versions/',frame('Version history','Frozen public edition history.',versionsBody,'/versions',editionPath,{archived:true}));
  routes.push(editionPath+'/versions/');

  // Legacy project feedback URLs remain useful, but never instantiate another
  // inbox or submit handler. Readers explicitly continue to the shared board.
  const feedbackBody=`<div class="site-shell"><header class="page-header"><p class="eyebrow">One shared discussion board</p><h1>Feedback for this project.</h1><p>General suggestions and mathematical comments use the same GitHub Issues system as every atlas project.</p><div class="hero-actions"><a class="button" href="${url('/feedback/?project=strong-green&amp;version='+revision)}">Open the shared feedback board</a><a class="text-link" href="${url('/feedback/guide/')}">Feedback and source-upload guide</a></div></header></div>`;
  await save(projectPath+'/feedback/',frame('Project feedback','One shared GitHub feedback board for the research atlas.',feedbackBody,'/feedback',projectPath));
  routes.push(projectPath+'/feedback/');
  return {routes,indexableRoutes,searchIndex,revision,paperCount:papers.length,recordCount:bundle.entries.length};
}
