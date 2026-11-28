import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const origin=(process.env.SITE_ORIGIN||'').replace(/\/$/,'');
if(process.env.SITE_BASE_PATH!=='/'||!/^https:\/\/[a-z0-9.-]+$/i.test(origin))throw Error('Domain check requires SITE_BASE_PATH=/ and an HTTPS SITE_ORIGIN');
const brand=process.env.SITE_BRAND||'OpenMath';
const legacyBase='/math-research-atlas';
const oldHost='https://dongkaicheng.github.io';
const failures=new Set();
const fail=message=>failures.add(message);
const counts={currentPages:0,frozenPages:0,svg:0,links:0,frozenFiles:0,jsonLinks:0};
const fileCache=new Map(),textCache=new Map(),anchorCache=new Map();
const slash=value=>value.split(path.sep).join('/');
const decode=value=>value.replace(/&(?:amp|quot|apos|lt|gt);|&#(?:x[0-9a-f]+|[0-9]+);/gi,entity=>{
  const named={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'};
  if(named[entity.toLowerCase()])return named[entity.toLowerCase()];
  const code=entity.slice(2,-1);return String.fromCodePoint(code[0].toLowerCase()==='x'?parseInt(code.slice(1),16):Number(code));
});
async function isFile(file){
  if(!fileCache.has(file))fileCache.set(file,stat(file).then(value=>value.isFile(),()=>false));
  return fileCache.get(file);
}
async function text(file){
  if(!textCache.has(file))textCache.set(file,readFile(file,'utf8'));
  return textCache.get(file);
}
async function* files(folder){
  for(const entry of await readdir(folder,{withFileTypes:true})){
    const file=path.join(folder,entry.name);
    if(entry.isDirectory())yield* files(file);
    else if(entry.isFile())yield file;
  }
}
// Only actual checked-in public edition trees are exempt from current-page
// URL rules. Their published bytes and every legacy resource are checked below.
const frozenRoots=[];
for(const project of await readdir(path.join(root,'public/projects'),{withFileTypes:true})){
  if(!project.isDirectory())continue;
  const directory=path.join(root,'public/projects',project.name,'editions');
  let editions;try{editions=await readdir(directory,{withFileTypes:true});}catch{continue;}
  for(const edition of editions)if(edition.isDirectory())frozenRoots.push('projects/'+project.name+'/editions/'+edition.name+'/');
}
const isFrozen=relative=>frozenRoots.some(prefix=>relative.startsWith(prefix));
function attributes(content){
  return [...content.matchAll(/(?:^|[\s<])(?:xlink:)?(?:href|src)\s*=\s*(["'])(.*?)\1/gs)].map(match=>decode(match[2]));
}
async function checkLink(href,relative,{frozen=false,fragment=false}={}){
  if(!href||/^(?:data:|mailto:|tel:|javascript:)/i.test(href))return;
  let parsed;
  try{parsed=new URL(href,origin+'/'+relative);}catch{fail('Invalid URL: '+relative+' -> '+href);return;}
  if(!frozen&&parsed.origin===oldHost)fail('Old personal host on current output: '+relative+' -> '+href);
  if(parsed.origin!==origin)return;
  counts.links++;
  if(!frozen&&parsed.pathname.startsWith(legacyBase+'/'))fail('Legacy path on current output: '+relative+' -> '+href);
  let pathname;
  try{pathname=decodeURIComponent(parsed.pathname);}catch{fail('Invalid URL encoding: '+relative+' -> '+href);return;}
  if(pathname.split('/').includes('..')||pathname.includes('\0')){fail('Unsafe local URL: '+href);return;}
  const local=path.join(dist,pathname.replace(/^\/+/,''));
  let target=parsed.pathname.endsWith('/')?path.join(local,'index.html'):local;
  if(!await isFile(target))target=path.join(local,'index.html');
  if(!await isFile(target)){fail('Broken local link: '+relative+' -> '+href);return;}
  if(fragment&&parsed.hash&&/\.(?:html|svg)$/.test(target)){
    let anchor;try{anchor=decodeURIComponent(parsed.hash.slice(1));}catch{fail('Invalid fragment: '+href);return;}
    // Text fragments are browser instructions rather than element IDs.
    anchor=anchor.split(':~:text=')[0];
    if(anchor){
      if(!anchorCache.has(target)){
        const content=await text(target);
        anchorCache.set(target,new Set([...content.matchAll(/\b(?:id|name)\s*=\s*(["'])(.*?)\1/gs)].map(match=>decode(match[2]))));
      }
      if(!anchorCache.get(target).has(anchor))fail('Missing fragment: '+relative+' -> '+href);
    }
  }
}

const projectRoutes=['/projects/bedford-taylor/','/projects/foundations/','/projects/strong-green/'];
const routes=['/',...projectRoutes];
const rootHtml=await text(path.join(dist,'index.html'));
if(!rootHtml.includes('<h1 id="home-title">'+brand+'</h1>'))fail('Root page does not display '+brand);
const projectList=rootHtml.match(/<section\b[^>]*\bid="projects"[^>]*>([\s\S]*?)<\/section>/)?.[1]??'';
for(const route of projectRoutes){
  if(!projectList.includes('href="'+route+'"'))fail('Homepage project link missing: '+route);
}
if(origin==='https://openmath-atlas.org'){
  const head=rootHtml.match(/<head>([\s\S]*?)<\/head>/)?.[1]||'';
  if(!head.includes('<meta name="google-site-verification" content="WE7A5abWl6z3sg4dMlvn5oj4t7cYwGbb9T7qU1ld1Sw" />'))fail('Missing owner-issued Google Search Console verification marker in homepage head');
}
for(const route of routes){
  const html=await text(path.join(dist,route.slice(1),'index.html'));
  if(!html.includes('<link rel="canonical" href="'+origin+route+'"'))fail('Wrong canonical: '+route);
  if(!/<meta name="description" content="[^"]{65,}"/.test(html))fail('Short or missing search description: '+route);
  if(!/<title>[^<]{20,}<\/title>/.test(html))fail('Short or missing HTML title: '+route);
  if(/<meta name="robots" content="noindex/.test(html))fail('Priority page blocked from indexing: '+route);
  if(route==='/'){
    if(!html.includes('"@type":"WebSite"'))fail('Missing website identity structured data');
  }
  if(route==='/projects/foundations/'&&!html.includes('"@type":"CollectionPage"'))fail('Missing foundations collection structured data');
  if(route==='/projects/strong-green/'&&!html.includes('"@type":"CollectionPage"'))fail('Missing Strong Green collection structured data');

  const alias=path.join(dist,'math-research-atlas',route.slice(1),'index.html');
  if(!await isFile(alias)){fail('Missing route alias: '+route);continue;}
  const redirect=await text(alias),script=redirect.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if(route==='/'){
    if(!redirect.includes('This website address is no longer in use.'))fail('Old landing page lacks an explicit retirement notice');
    if(!redirect.includes('<a class="action" href="'+origin+'/">Visit the current OpenMath website</a>'))fail('Old landing page lacks the new site link');
    if(!redirect.includes('name="robots" content="noindex,follow"'))fail('Old landing page must not be indexed');
    if(/location\.replace|http-equiv="refresh"/.test(redirect))fail('Old landing page must remain visible instead of silently redirecting');
    if(redirect.includes('The central problem')||redirect.includes('<h1>OpenMath</h1>'))fail('Old landing page still serves current research content');
    continue;
  }
  let destination;
  const search='?q=capacity&version='+encodeURIComponent('v1.0.1'),hash='#thm:main-bounded';
  try{
    if(!script)throw Error('Missing redirect script');
    vm.runInNewContext(script,{location:{search,hash,replace:value=>{destination=value;}}},{timeout:1000});
    if(destination!==origin+route+search+hash)fail('Route alias loses query or fragment: '+route);
    if(!redirect.includes('name="robots" content="noindex,follow"'))fail('Route alias is indexable: '+route);
  }catch(error){fail('Route alias failed: '+route+' -> '+error.message);}
}
const coreXML=await text(path.join(dist,'sitemap-core.xml'));
const expectedCore=routes.map(route=>origin+route);
const coreURLs=[...coreXML.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>decode(match[1]));
if(JSON.stringify(coreURLs)!==JSON.stringify(expectedCore))fail('Core sitemap must contain exactly the four canonical entry points, in order');
const fullXML=await text(path.join(dist,'sitemap.xml'));
for(const page of expectedCore)if(!fullXML.includes('<loc>'+page+'</loc>'))fail('Main sitemap omits priority URL: '+page);
// Check every submitted page, not only the four project entry points. A sitemap
// must not advertise a search shell, a redirect, or a noncanonical duplicate.
const sitemapURLs=[...fullXML.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>decode(match[1]));
const submittedURLs=new Set(sitemapURLs);
if(submittedURLs.size!==sitemapURLs.length)fail('Main sitemap repeats a URL');
function headAttributes(tag){
  return Object.fromEntries([...tag.matchAll(/\b([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)]
    .map(([,name,,value])=>[name.toLowerCase(),decode(value)]));
}
for(const page of sitemapURLs){
  let parsed;
  try{parsed=new URL(page);}catch{fail('Invalid sitemap URL: '+page);continue;}
  if(parsed.origin!==origin||parsed.search||parsed.hash||!parsed.pathname.endsWith('/')){
    fail('Sitemap URL is not a canonical directory URL: '+page);continue;
  }
  const file=path.join(dist,parsed.pathname.slice(1),'index.html');
  if(!await isFile(file)){fail('Missing sitemap page: '+page);continue;}
  const head=(await text(file)).match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]??'';
  const links=[...head.matchAll(/<link\b[^>]*>/gi)].map(([tag])=>headAttributes(tag));
  const canonicals=links.filter(tag=>tag.rel?.toLowerCase().split(/\s+/).includes('canonical'));
  if(canonicals.length!==1||canonicals[0].href!==page)fail('Sitemap page lacks one matching canonical: '+page);
  const metadata=[...head.matchAll(/<meta\b[^>]*>/gi)].map(([tag])=>headAttributes(tag));
  if(metadata.some(tag=>['robots','googlebot'].includes(tag.name?.toLowerCase())&&/\b(?:noindex|none)\b/i.test(tag.content??'')))fail('Sitemap page blocks indexing: '+page);
  if(metadata.some(tag=>tag['http-equiv']?.toLowerCase()==='refresh'))fail('Sitemap page redirects: '+page);
}
for(const route of ['/search/','/projects/foundations/search/','/404.html']){
  const file=path.join(dist,route.slice(1),route.endsWith('/')?'index.html':'');
  const head=(await text(file)).split('</head>')[0];
  if(!head.includes('<meta name="robots" content="noindex,follow">'))fail('Utility page lacks noindex: '+route);
  if(submittedURLs.has(origin+route))fail('Utility page appears in sitemap: '+route);
}
const readerRoute='/projects/foundations/reader/';
const readerHead=(await text(path.join(dist,readerRoute.slice(1),'index.html'))).split('</head>')[0];
if(!readerHead.includes('<link rel="canonical" href="'+origin+'/projects/foundations/contents/"'))fail('Saved-reader entry does not select the contents canonical');
if(submittedURLs.has(origin+readerRoute))fail('Duplicate reader root appears in sitemap');
const robots=await text(path.join(dist,'robots.txt'));
for(const path of ['/sitemap.xml','/sitemap-core.xml'])if(!robots.includes('Sitemap: '+origin+path))fail('Missing Search Console sitemap discovery in robots.txt: '+path);

for(const file of ['sitemap.xml','robots.txt']){
  const content=await text(path.join(dist,file));
  if(!content.includes(origin+'/'))fail('Missing domain in '+file);
  if(content.includes(oldHost)||content.includes(origin+legacyBase+'/'))fail('Old host/base in '+file);
}

// Include inlined maps, standalone SVGs, CSS fonts and literal JS fetch URLs;
// checking HTML alone misses frozen search indexes and diagram downloads.
for await(const file of files(dist)){
  const relative=slash(path.relative(dist,file));
  if(relative.startsWith('math-research-atlas/'))continue;
  const frozen=isFrozen(relative),extension=path.extname(relative);
  if(!['.html','.svg','.css','.js'].includes(extension))continue;
  const content=await text(file);
  if(extension==='.html')counts[frozen?'frozenPages':'currentPages']++;
  if(extension==='.svg')counts.svg++;
  if(extension==='.html'||extension==='.svg'){
    for(const href of attributes(content))await checkLink(href,relative,{frozen,fragment:extension==='.svg'&&!frozen});
  }
  if(extension==='.html'&&!frozen)for(const svg of content.matchAll(/<svg\b[\s\S]*?<\/svg>/g)){
    for(const href of attributes(svg[0]))await checkLink(href,relative,{fragment:true});
  }
  if(extension==='.css')for(const match of content.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/g))await checkLink(match[2],relative,{frozen});
  if(extension==='.js')for(const match of content.matchAll(/\bfetch\(\s*(["'])([^"']+)\1/g))await checkLink(match[2],relative,{frozen});
}

// Search prose may contain historical citations. Validate navigable URL fields,
// not incidental old URLs in statement/source text.
async function checkIndex(relative,{frozen=false}={}){
  if(!await isFile(path.join(dist,relative))){fail('Missing search index: '+relative);return;}
  const data=JSON.parse(await text(path.join(dist,relative)));
  if(!Array.isArray(data)||!data.length){fail('Empty or invalid search index: '+relative);return;}
  for(const item of data){
    const href=item.link||item.url;
    if(typeof href!=='string'){fail('Search entry lacks URL: '+relative);continue;}
    counts.jsonLinks++;await checkLink(href,relative,{frozen,fragment:!frozen});
  }
}
await checkIndex('search-index.json');
const pointer=JSON.parse(await readFile(path.join(root,'content/bedford-taylor/current.json'),'utf8'));
const btFixed='projects/bedford-taylor/editions/'+pointer.revision;
await checkIndex('projects/bedford-taylor/data/search-index.json');
await checkIndex(btFixed+'/data/search-index.json',{frozen:true});

// Compare every original frozen file, not a sample, both at the new root and
// under the old base used by its unmodified HTML, JS and data. Also cover any
// generated frozen assets not present in public/ yet.
const digest=buffer=>createHash('sha256').update(buffer).digest('hex');
for(const prefix of frozenRoots){
  for await(const source of files(path.join(root,'public',prefix))){
    const relative=prefix+slash(path.relative(path.join(root,'public',prefix),source));
    if(!await isFile(path.join(dist,relative))){fail('Missing frozen original: '+relative);continue;}
    const [a,b]=await Promise.all([readFile(source),readFile(path.join(dist,relative))]);
    if(digest(a)!==digest(b))fail('Changed frozen original: '+relative);
  }
  for await(const file of files(path.join(dist,prefix))){
    const relative=slash(path.relative(dist,file)),alias=path.join(dist,'math-research-atlas',relative);counts.frozenFiles++;
    if(!await isFile(alias)){fail('Missing frozen alias: '+relative);continue;}
    const [a,b]=await Promise.all([readFile(file),readFile(alias)]);
    if(digest(a)!==digest(b))fail('Changed frozen alias: '+relative);
  }
}

// Permanent-result feedback is computed at runtime. A domain/base rewrite must
// not silently lose the record ID while retaining the apparent page link.
async function feedbackRegression(relative,expectedPage){
  const html=await text(path.join(dist,relative));
  const tag=html.match(/<a\b[^>]*\bdata-atlas-feedback(?:\s|=|>)[^>]*>/)?.[0];
  const href=tag?.match(/\bhref=(["'])(.*?)\1/)?.[2];
  const script=attributes(html).find(value=>/\/(?:assets\/)?atlas-feedback\.js(?:[?#]|$)/.test(value));
  if(!href||!script){fail('Missing anchored feedback wiring: '+relative);return;}
  const scriptPath=new URL(script,origin+'/'+relative).pathname;
  const link={href:new URL(decode(href),origin+'/'+relative).href};
  const location={hash:'#thm:main-bounded'},events=new Map();
  try{
    vm.runInNewContext(await text(path.join(dist,scriptPath.replace(/^\//,''))),{
      URL,document:{querySelectorAll:()=>[link]},location,addEventListener:(name,handler)=>events.set(name,handler),
    },{timeout:1000});
    const assert=(id,hash)=>{
      const context=new URL(link.href).searchParams;
      if(context.get('entry')!==id||context.get('version')!==pointer.revision||context.get('project')!=='bedford-taylor'||context.get('page')!==expectedPage+hash)fail('Lost exact feedback context: '+relative+' '+hash+' -> '+link.href);
    };
    assert('NABT-000002','#thm:main-bounded');
    location.hash='#prop:regularization';events.get('hashchange')?.();
    assert('NABT-000012','#prop:regularization');
  }catch(error){fail('Feedback script failed: '+relative+' -> '+error.message);}
}
const paper='/papers/bedford-taylor-products/';
const manifest=JSON.parse(await readFile(path.join(root,'content/bedford-taylor/releases',pointer.revision,'manifest.json'),'utf8'));
await feedbackRegression(btFixed+paper+'index.html',manifest.publication.origin+manifest.publication.fixedPath+paper);
await feedbackRegression('projects/bedford-taylor'+paper+'index.html',origin+'/'+btFixed+paper);

if(failures.size){
  for(const message of [...failures].slice(0,30))process.stderr.write(message+'\n');
  throw Error(failures.size+' custom-domain checks failed');
}
process.stdout.write('Custom domain '+origin+': '+routes.length+' entry points, '+sitemapURLs.length+' indexable canonical sitemap pages, '+counts.currentPages+' mutable pages, '+counts.frozenPages+' frozen pages, '+counts.svg+' SVGs and '+counts.links+' internal links checked; '+counts.frozenFiles+' byte-identical historical aliases, '+counts.jsonLinks+' search links and anchored feedback verified.\n');
