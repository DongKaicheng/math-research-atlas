import {readFile,writeFile,mkdir,readdir,cp,access} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildBedfordTaylorMap} from './build-bedford-taylor-map.mjs';

const projectPath='/projects/bedford-taylor';
const exists=async file=>{try{await access(file);return true;}catch{return false;}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const filename=route=>route==='/'?'index.html':route.endsWith('/')?route.slice(1)+'index.html':route.slice(1);
const sourceDisplayTranslations = [
  ['Round 13：失败路线、修复和第一开放门槛', 'Round 13: Failed Approaches, Repairs, and the First Open Gate'],
  ['Non-Archimedean Bedford–Taylor theory：内部成果审计、任务清单与研究计划', 'Non-Archimedean Bedford–Taylor Theory: Internal Results Audit, Task List, and Research Plan'],
  ['(中文)', '(Chinese original)'],
];
const englishDisplay = text => sourceDisplayTranslations.reduce((value,[original,english])=>value.replaceAll(original,english),text);

/** Project current pages are a projection of an immutable, unsigned edition.
 * No TeX execution, mathematical regeneration or status promotion takes place.
 * Assets, data and downloads remain pinned to their exact edition.
 */
export async function buildBedfordTaylor({root,output,base,origin,repository}){
  const pointer=JSON.parse(await readFile(path.join(root,'content/bedford-taylor/current.json'),'utf8'));
  const revision=pointer.revision;
  if(pointer.project!=='bedford-taylor'||!/^v\d+\.\d+\.\d+$/.test(revision))throw Error('Invalid Bedford–Taylor current edition');
  const releaseRoot=path.join(root,'content/bedford-taylor/releases');
  const manifest=JSON.parse(await readFile(path.join(releaseRoot,revision,'manifest.json'),'utf8'));
  // An edition manifest identifies the frozen source publication, not the
  // hostname on which a later, mutable current-page projection is served.
  // Preserve the original manifest and frozen bytes when moving the atlas.
  if(manifest.revision!==revision||!manifest.publication.basePath||!manifest.publication.origin)throw Error('Invalid Bedford–Taylor immutable edition publication');
  const fixedPath=manifest.publication.fixedPath;
  const sourceFixedBase=manifest.publication.basePath+fixedPath;
  const sourceFixedOrigin=manifest.publication.origin+fixedPath;
  const fixedBase=base+fixedPath,currentBase=base+projectPath;
  const currentOrigin=origin+projectPath;
  const frozenPublic=path.join(root,'public',fixedPath.slice(1));
  const releases=(await readdir(releaseRoot)).filter(v=>/^v\d+\.\d+\.\d+$/.test(v)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const routes=[],indexableRoutes=[];
  for(const v of releases){
    const oldPath=projectPath+'/editions/'+v,oldRoot=path.join(root,'public',oldPath.slice(1));
    if(!await exists(path.join(oldRoot,'manifest.json')))throw Error('Missing frozen Bedford–Taylor edition: '+v);
    await cp(oldRoot,path.join(output,oldPath.slice(1)),{recursive:true});
    const oldManifest=JSON.parse(await readFile(path.join(oldRoot,'manifest.json'),'utf8'));
    routes.push(...oldManifest.routes.map(route=>oldPath+route));
  }
  const htmlRoutes=new Set(manifest.routes);
  const migrated=base!==manifest.publication.basePath||origin!==manifest.publication.origin;
  const currentAssets=currentBase+'/assets';
  const deploymentLink=value=>{
    let target=value;
    if(value.startsWith(manifest.publication.basePath+'/'))target=base+value.slice(manifest.publication.basePath.length);
    else if(value.startsWith(manifest.publication.origin+'/'))target=origin+value.slice(manifest.publication.origin.length);
    return target.replaceAll(encodeURIComponent(manifest.publication.origin),encodeURIComponent(origin));
  };
  const deploymentHTML=text=>text.replace(/\b(href|src)="([^"]*)"/g,(_all,attr,value)=>attr+'="'+deploymentLink(value)+'"');
  function currentLink(href){
    if(!href.startsWith(sourceFixedBase))return href;
    const suffix=href.slice(sourceFixedBase.length),p=suffix.split(/[?#]/)[0];
    return htmlRoutes.has(p)?currentBase+suffix:fixedBase+suffix;
  }
  function currentHTML(text){
    // Work only on hyperlinks, not formula text, hidden source, or file hashes.
    text=text.replace(/<a\b[^>]*>/g,tag=>tag.includes('data-atlas-edition')?tag:tag.replace(/\bhref="([^"]*)"/,(_all,value)=>'href="'+currentLink(value)+'"'));
    // The current reading projection is mutable site infrastructure. Route its
    // links and assets through the deployment base, while frozen editions and
    // the historical release manifest remain byte-for-byte unchanged.
    text=text.replaceAll('data-bt-page-base="'+sourceFixedBase+'"','data-bt-page-base="'+currentBase+'"');
    text=text.replace(/(<link rel="canonical" href=")([^"]*)(")/,(_all,a,u,b)=>a+u.replace(sourceFixedOrigin,currentOrigin)+b);
    text=text.replace(/(<meta property="og:url" content=")([^"]*)(")/,(_all,a,u,b)=>a+u.replace(sourceFixedOrigin,currentOrigin)+b);
    text=text.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(_all,json)=>'<script type="application/ld+json">'+json.replaceAll(sourceFixedOrigin,currentOrigin)+'</script>');
    text=deploymentHTML(text);
    if(migrated)for(const name of ['site.js','atlas-feedback.js'])text=text.replaceAll('src="'+fixedBase+'/assets/'+name+'"','src="'+currentAssets+'/'+name+'"');
    // Navigation is current infrastructure. It is never written back into a
    // frozen reading edition or its mathematical content.
    text=text.replace(/<body class="([^"]*)"/,'<body class="bt-current $1"');
    text=text.replaceAll('>Conjecture Atlas<','>'+esc(process.env.SITE_BRAND||'Conjecture Atlas')+'<');
    text=text.replace('</head>',`<link rel="stylesheet" href="${base}/assets/bedford-taylor-map.css"></head>`);
    text=text.replace(/(<nav id="primary-navigation"[^>]*><a\b[^>]*>Overview<\/a>)/,'$1'+`<a href="${currentBase}/map/">Research map</a>`);
    text=text.replace(/(<nav id="primary-navigation"[^>]*>)([\s\S]*?)(<\/nav>)/,(_all,open,links,close)=>open+links.replace('<a class="nav-search"',`<a href="${currentBase}/acknowledgements/">Acknowledgements</a><a class="nav-search"`)+close);
    text=text.replace(/(<nav class="footer-links"[^>]*>)/,'$1'+`<a href="${currentBase}/acknowledgements/">Acknowledgements</a>`);
    return englishDisplay(text);
  }
  if(migrated){
    // Frozen scripts/data encode the original deployment. Publish current-only
    // infrastructure projections; never edit their frozen source counterparts.
    const assetDirectory=path.join(output,projectPath.slice(1),'assets');
    const dataDirectory=path.join(output,projectPath.slice(1),'data');
    await mkdir(assetDirectory,{recursive:true});await mkdir(dataDirectory,{recursive:true});
    const feedback=await readFile(path.join(frozenPublic,'assets/atlas-feedback.js'),'utf8');
    await writeFile(path.join(assetDirectory,'atlas-feedback.js'),feedback.replaceAll(sourceFixedBase,fixedBase));
    const siteScript=await readFile(path.join(frozenPublic,'assets/site.js'),'utf8');
    await writeFile(path.join(assetDirectory,'site.js'),siteScript.replaceAll(sourceFixedBase,currentBase));
    const data=JSON.parse(await readFile(path.join(frozenPublic,'data/search-index.json'),'utf8'));
    await writeFile(path.join(dataDirectory,'search-index.json'),JSON.stringify(data.map(item=>({...item,title:englishDisplay(item.title),url:deploymentLink(currentLink(item.url))}))));
  }
  for(const route of manifest.routes){
    const source=path.join(frozenPublic,filename(route)),target=path.join(output,projectPath.slice(1),filename(route));
    let html=currentHTML(await readFile(source,'utf8'));
    if(route==='/')html=html.replace(/<div class="actions">[\s\S]*?<\/div>/,actions=>actions+`<p class="atlas-map-home-link"><a href="${currentBase}/map/">Explore the research map <span aria-hidden="true">→</span></a> <a class="atlas-map-overall-link" href="${currentBase}/map/#total-logic">Overall logical map</a></p>`);
    if(route==='/'&&!base){
      // The current landing projection is mutable; source editions are frozen.
      const pageTitle='Non-Archimedean Bedford–Taylor Theory | OpenMath';
      const snippet='Research programme for non-Archimedean Bedford–Taylor products, positive currents, psh potentials and Monge–Ampère theory on Berkovich analytic spaces.';
      html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+esc(pageTitle)+'</title>');
      html=html.replace(/(<meta name="description" content=")[^"]*(")/,'$1'+esc(snippet)+'$2');
      html=html.replace(/(<meta property="og:title" content=")[^"]*(")/,'$1'+esc(pageTitle)+'$2');
      html=html.replace(/(<meta property="og:description" content=")[^"]*(")/,'$1'+esc(snippet)+'$2');
    }
    const indexable=route!=='/404.html'&&route!=='/search/'&&!route.startsWith('/sources/view/');
    if(indexable)html=html.replace('<meta name="robots" content="noindex,follow">','<meta name="robots" content="index,follow">');
    await mkdir(path.dirname(target),{recursive:true});await writeFile(target,html);
    routes.push(projectPath+route);if(indexable)indexableRoutes.push(projectPath+route);
  }
  // A release page is atlas infrastructure; it is deliberately outside papers.
  let versions=currentHTML(await readFile(path.join(frozenPublic,'index.html'),'utf8'));
  const content=`<main id="main-content" class="shell"><header class="page-heading"><p class="eyebrow">Publication history</p><h1>Versions and corrections</h1><p>Current pages follow the selected public edition. Fixed editions preserve the exact pages, data, source downloads and PDFs used in a citation or feedback report.</p></header><section class="overview-section"><h2>Public editions</h2>${[...releases].reverse().map(v=>`<p><strong><a href="${base+projectPath}/editions/${v}/">Edition ${esc(v)}</a></strong>${v===revision?' — current publication':''}. <a href="${base+projectPath}/editions/${v}/manifest.json">File manifest and checksums</a>.</p>`).join('')}</section><section class="overview-section"><h2>Earlier project outline</h2><p>The <a href="${base+projectPath}/versions/0/">original atlas outline, version 0</a>, remains available. Earlier private research archives are not redistributed here.</p></section><section class="overview-section"><h2>Corrections and review</h2><p>Submit feedback through the shared board, specifying the entry and edition where relevant. An accepted correction is linked to its Issue, reviewed change and new edition. Publication and formatting checks do not certify a mathematical proof.</p><p><a href="${base}/feedback/?project=bedford-taylor">Project feedback</a> · <a href="${base}/maintenance/">Maintenance policy</a> · <a href="https://github.com/${esc(repository)}/commits/main">Repository history</a></p></section></main>`;
  versions=versions.replace(/<main\b[\s\S]*?<\/main>/,content).replace(/<title>[\s\S]*?<\/title>/,'<title>Versions and corrections · Non-Archimedean Bedford–Taylor Theory</title>');
  versions=versions.replace(/(<link rel="canonical" href=")[^"]*(")/,'$1'+currentOrigin+'/versions/$2').replace(/(<meta property="og:url" content=")[^"]*(")/,'$1'+currentOrigin+'/versions/$2');
  versions=versions.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(_all,json)=>{
    const data=JSON.parse(json);data.name='Versions and corrections';data.url=currentOrigin+'/versions/';data.description='Immutable public editions, exact source checksums and correction history.';
    return '<script type="application/ld+json">'+JSON.stringify(data)+'</script>';
  });
  const historyFeedback=base+'/feedback/?'+new URLSearchParams({project:'bedford-taylor',version:revision,page:currentOrigin+'/versions/'}).toString();
  versions=versions.replace(/<a\b[^>]*data-atlas-feedback[^>]*>/g,tag=>tag.replace(/\bhref="[^"]*"/,'href="'+esc(historyFeedback)+'"'));
  versions=versions.replace('<meta name="robots" content="noindex,follow">','<meta name="robots" content="index,follow">');
  const versionFile=path.join(output,projectPath.slice(1),'versions/index.html');await mkdir(path.dirname(versionFile),{recursive:true});await writeFile(versionFile,versions);
  routes.push(projectPath+'/versions/');indexableRoutes.push(projectPath+'/versions/');
  const map=await buildBedfordTaylorMap({root,frozenPublic,revision,currentBase,currentLink,mapURL:currentOrigin+'/map/'});
  let mapPage=currentHTML(await readFile(path.join(frozenPublic,'index.html'),'utf8'));
  mapPage=mapPage.replace(/<main\b[\s\S]*?<\/main>/,map.html)
    .replace('class="bt-current page-home"','class="bt-current page-map"')
    .replace(/<title>[\s\S]*?<\/title>/,'<title>Logical research map · Non-Archimedean Bedford–Taylor Theory</title>')
    .replace(/(<meta name="description" content=")[^"]*(")/,'$1'+esc(map.description)+'$2')
    .replace(/(<meta property="og:description" content=")[^"]*(")/,'$1'+esc(map.description)+'$2')
    .replace(/(<meta property="og:title" content=")[^"]*(")/,'$1Logical research map · Non-Archimedean Bedford–Taylor Theory$2')
    .replace(/(<link rel="canonical" href=")[^"]*(")/,'$1'+currentOrigin+'/map/$2')
    .replace(/(<meta property="og:url" content=")[^"]*(")/,'$1'+currentOrigin+'/map/$2')
    .replace('<meta name="robots" content="noindex,follow">','<meta name="robots" content="index,follow">');
  mapPage=mapPage.replace(/(<nav id="primary-navigation"[^>]*>)([\s\S]*?)(<\/nav>)/,(_all,open,links,close)=>open+links.replace(/ aria-current="page"/g,'').replace(`href="${currentBase}/map/"`,`href="${currentBase}/map/" aria-current="page"`)+close);
  mapPage=mapPage.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(_all,json)=>{
    const data=JSON.parse(json);data.name='Logical research map';data.url=currentOrigin+'/map/';data.description=map.description;
    return '<script type="application/ld+json">'+JSON.stringify(data)+'</script>';
  });
  const mapFeedback=base+'/feedback/?'+new URLSearchParams({project:'bedford-taylor',version:revision,page:currentOrigin+'/map/'}).toString();
  mapPage=mapPage.replace(/<a\b[^>]*data-atlas-feedback[^>]*>/g,tag=>tag.replace(/\bhref="[^"]*"/,'href="'+esc(mapFeedback)+'"'));
  const logicAssetHash=createHash('sha256').update(await readFile(path.join(root,'assets/bedford-taylor-logic.css'))).update(await readFile(path.join(root,'assets/bedford-taylor-logic.js'))).digest('hex').slice(0,16);
  mapPage=mapPage.replace('</head>',`<link rel="stylesheet" href="${base}/assets/bedford-taylor-logic.css?v=${logicAssetHash}"><script defer src="${base}/assets/bedford-taylor-map.js"></script><script defer src="${base}/assets/bedford-taylor-logic.js?v=${logicAssetHash}"></script></head>`);
  // The map is injected after currentHTML; rebase only its rendered link
  // attributes, leaving source-bound SVGs, records and manifests untouched.
  const mapFile=path.join(output,projectPath.slice(1),'map/index.html');await mkdir(path.dirname(mapFile),{recursive:true});await writeFile(mapFile,deploymentHTML(mapPage));
  routes.push(projectPath+'/map/');indexableRoutes.push(projectPath+'/map/');
  const sourceIndex=JSON.parse(await readFile(path.join(frozenPublic,'data/search-index.json'),'utf8'));
  const searchIndex=[...map.searchIndex,...sourceIndex.map(item=>({title:englishDisplay(item.title),summary:item.excerpt||'',keywords:['Bedford–Taylor',item.id,item.type].filter(Boolean),link:currentLink(item.url),category:item.type,id:item.id,body:item.text||item.excerpt||englishDisplay(item.title),project:'bedford-taylor',version:revision}))];
  // The detailed index primarily addresses theorem/section anchors. Keep both
  // standalone articles discoverable as pages as well, without invented claims.
  const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  for(const id of ['bedford-taylor-products','research-program']){
    const route='/papers/'+id+'/',link=currentBase+route;
    if(searchIndex.some(item=>item.link===link))continue;
    const html=await readFile(path.join(frozenPublic,filename(route)),'utf8');
    const title=decode((html.match(/<title>([^<]*)<\/title>/)?.[1]||'').split(' · Non-Archimedean')[0]);
    const summary=decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1]||'');
    searchIndex.push({id,title,summary,link,category:'paper',keywords:['Bedford–Taylor',id,'formal paper'],body:title+' '+summary,project:'bedford-taylor',version:revision});
  }
  return {routes,indexableRoutes,searchIndex,revision,manifest,recordCount:manifest.counts.topics};
}
