import {readFile,writeFile,mkdir,readdir,cp,access} from 'node:fs/promises';
import path from 'node:path';
import {buildBedfordTaylorMap} from './build-bedford-taylor-map.mjs';

const projectPath='/projects/bedford-taylor';
const exists=async file=>{try{await access(file);return true;}catch{return false;}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const filename=route=>route==='/'?'index.html':route.endsWith('/')?route.slice(1)+'index.html':route.slice(1);

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
  if(manifest.revision!==revision||manifest.publication.basePath!==base||manifest.publication.origin!==origin)throw Error('Bedford–Taylor immutable edition origin/base mismatch');
  const fixedPath=manifest.publication.fixedPath;
  const fixedBase=base+fixedPath,currentBase=base+projectPath;
  const fixedOrigin=origin+fixedPath,currentOrigin=origin+projectPath;
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
  function currentLink(href){
    if(!href.startsWith(fixedBase))return href;
    const suffix=href.slice(fixedBase.length),p=suffix.split(/[?#]/)[0];
    return htmlRoutes.has(p)?currentBase+suffix:href;
  }
  function currentHTML(text){
    // Work only on hyperlinks, not formula text, hidden source, or file hashes.
    text=text.replace(/<a\b[^>]*>/g,tag=>tag.includes('data-atlas-edition')?tag:tag.replace(/\bhref="([^"]*)"/,(_all,value)=>'href="'+currentLink(value)+'"'));
    text=text.replaceAll('data-bt-page-base="'+fixedBase+'"','data-bt-page-base="'+currentBase+'"');
    text=text.replace(/(<link rel="canonical" href=")([^"]*)(")/,(_all,a,u,b)=>a+u.replace(fixedOrigin,currentOrigin)+b);
    text=text.replace(/(<meta property="og:url" content=")([^"]*)(")/,(_all,a,u,b)=>a+u.replace(fixedOrigin,currentOrigin)+b);
    text=text.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(_all,json)=>'<script type="application/ld+json">'+json.replaceAll(fixedOrigin,currentOrigin)+'</script>');
    // Navigation is current infrastructure. It is never written back into a
    // frozen reading edition or its mathematical content.
    text=text.replace(/<body class="([^"]*)"/,'<body class="bt-current $1"');
    text=text.replace('</head>',`<link rel="stylesheet" href="${base}/assets/bedford-taylor-map.css"></head>`);
    text=text.replace(/(<nav id="primary-navigation"[^>]*><a\b[^>]*>Overview<\/a>)/,'$1'+`<a href="${currentBase}/map/">Research map</a>`);
    return text;
  }
  for(const route of manifest.routes){
    const source=path.join(frozenPublic,filename(route)),target=path.join(output,projectPath.slice(1),filename(route));
    let html=currentHTML(await readFile(source,'utf8'));
    if(route==='/')html=html.replace(/<div class="actions">[\s\S]*?<\/div>/,actions=>actions+`<p class="atlas-map-home-link"><a href="${currentBase}/map/">Explore the research map <span aria-hidden="true">→</span></a></p>`);
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
  const map=await buildBedfordTaylorMap({root,frozenPublic,revision,currentBase,currentLink});
  let mapPage=currentHTML(await readFile(path.join(frozenPublic,'index.html'),'utf8'));
  mapPage=mapPage.replace(/<main\b[\s\S]*?<\/main>/,map.html)
    .replace('class="bt-current page-home"','class="bt-current page-map"')
    .replace(/<title>[\s\S]*?<\/title>/,'<title>Research map · Non-Archimedean Bedford–Taylor Theory</title>')
    .replace(/(<meta name="description" content=")[^"]*(")/,'$1'+esc(map.description)+'$2')
    .replace(/(<meta property="og:description" content=")[^"]*(")/,'$1'+esc(map.description)+'$2')
    .replace(/(<meta property="og:title" content=")[^"]*(")/,'$1Research map · Non-Archimedean Bedford–Taylor Theory$2')
    .replace(/(<link rel="canonical" href=")[^"]*(")/,'$1'+currentOrigin+'/map/$2')
    .replace(/(<meta property="og:url" content=")[^"]*(")/,'$1'+currentOrigin+'/map/$2')
    .replace('<meta name="robots" content="noindex,follow">','<meta name="robots" content="index,follow">');
  mapPage=mapPage.replace(/(<nav id="primary-navigation"[^>]*>)([\s\S]*?)(<\/nav>)/,(_all,open,links,close)=>open+links.replace(/ aria-current="page"/g,'').replace(`href="${currentBase}/map/"`,`href="${currentBase}/map/" aria-current="page"`)+close);
  mapPage=mapPage.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(_all,json)=>{
    const data=JSON.parse(json);data.name='Research map';data.url=currentOrigin+'/map/';data.description=map.description;
    return '<script type="application/ld+json">'+JSON.stringify(data)+'</script>';
  });
  const mapFeedback=base+'/feedback/?'+new URLSearchParams({project:'bedford-taylor',version:revision,page:currentOrigin+'/map/'}).toString();
  mapPage=mapPage.replace(/<a\b[^>]*data-atlas-feedback[^>]*>/g,tag=>tag.replace(/\bhref="[^"]*"/,'href="'+esc(mapFeedback)+'"'));
  mapPage=mapPage.replace('</head>',`<script defer src="${base}/assets/bedford-taylor-map.js"></script></head>`);
  const mapFile=path.join(output,projectPath.slice(1),'map/index.html');await mkdir(path.dirname(mapFile),{recursive:true});await writeFile(mapFile,mapPage);
  routes.push(projectPath+'/map/');indexableRoutes.push(projectPath+'/map/');
  const sourceIndex=JSON.parse(await readFile(path.join(frozenPublic,'data/search-index.json'),'utf8'));
  const searchIndex=[...map.searchIndex,...sourceIndex.map(item=>({title:item.title,summary:item.excerpt||'',keywords:['Bedford–Taylor',item.id,item.type].filter(Boolean),link:currentLink(item.url),category:item.type,id:item.id,body:item.text||item.excerpt||item.title,project:'bedford-taylor',version:revision}))];
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
