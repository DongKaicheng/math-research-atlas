import {readFile,writeFile,mkdir,readdir,cp,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import katex from 'katex';
import {buildBedfordTaylor} from './build-bedford-taylor.mjs';
import {marked, Renderer} from 'marked';
import {buildStrongGreen} from './build-strong-green.mjs';
import {FEEDBACK_CATEGORIES, COMMUNITY_CATEGORIES, feedbackIssueUrl} from '../lib/feedback.mjs';
import {buildCommunityPages} from './build-community.mjs';
import {restorePackedAssets} from './restore-packed-assets.mjs';
import {createHash} from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
const base=(process.env.SITE_BASE_PATH??'/math-research-atlas').replace(/\/$/,'');
const origin=(process.env.SITE_ORIGIN??'https://dongkaicheng.github.io/math-research-atlas').replace(/\/$/,'');
const brand=process.env.SITE_BRAND||'Conjecture Atlas';
const repository=process.env.GITHUB_REPOSITORY||'DongKaicheng/math-research-atlas';
const gh='https://github.com/'+repository;
const CATEGORIES=FEEDBACK_CATEGORIES;

const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const url=p=>base+(p.startsWith('/')?p:'/'+p);
const githubIssueUrl=kind=>feedbackIssueUrl(repository,kind);
const canonical=p=>origin+(p==='/'?'/':p);
const section=(id,label,title,body)=>`<section class="document-section" id="${esc(id)}"><p class="section-number">${esc(label)}</p><h2>${esc(title)}</h2>${body}</section>`;
const alert=(title,copy)=>`<div class="outline-notice"><div><strong>${esc(title)}</strong><p>${esc(copy)}</p></div></div>`;

// dist is generated output; a clean build prevents stale public downloads.
await restorePackedAssets(root);
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});

function math(s,display=false){
  try{return katex.renderToString(s.trim(),{throwOnError:false,trust:false,displayMode:display,maxSize:12,maxExpand:1000});}
  catch{return `<code>${esc(s)}</code>`;}
}
function inline(source=''){
  const token=/(\\\([\s\S]*?\\\)|(?<!\\)\$(?!\$)(?:\\.|[^$\n])+?\$|\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^\s)]+\))/g;
  let cursor=0,out='';
  for(const match of source.matchAll(token)){
    const i=match.index??0,v=match[0];
    out+=esc(source.slice(cursor,i));
    if(v.startsWith('\\('))out+=math(v.slice(2,-2));
    else if(v.startsWith('$'))out+=math(v.slice(1,-1));
    else if(v.startsWith('**'))out+='<strong>'+esc(v.slice(2,-2))+'</strong>';
    else if(v.startsWith('`'))out+='<code>'+esc(v.slice(1,-1))+'</code>';
    else{
      const m=/^\[([^\]]+)\]\(([^\s)]+)\)$/.exec(v);
      const link=m?.[2];
      if(link&&(link.startsWith('/')&&!link.startsWith('//')||link.startsWith('#')||/^https?:\/\//i.test(link))){
        const target=link.startsWith('/')?url(link):link;
        out+=`<a href="${esc(target)}"${/^https?:/.test(link)?' rel="noopener noreferrer"':''}>${esc(m[1])}</a>`;
      }else out+=esc(v);
    }
    cursor=i+v.length;
  }
  return out+esc(source.slice(cursor));
}
function markdown(source=''){
  const lines=String(source).replace(/\r\n?/g,'\n').split('\n');
  const blocks=[];
  let i=0;
  while(i<lines.length){
    const line=lines[i].trim();
    if(!line){i++;continue;}
    if(line.startsWith('```')){
      i++;const code=[];
      while(i<lines.length&&!lines[i].trim().startsWith('```'))code.push(lines[i++]);
      if(i<lines.length)i++;
      blocks.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');continue;
    }
    if(line.startsWith('$$')||line.startsWith('\\[')){
      const finish=line.startsWith('$$')?'$$':'\\]';
      let value=line.slice(2);i++;
      if(value.endsWith(finish))value=value.slice(0,-2);
      else{
        const mathLines=[value];
        while(i<lines.length&&!lines[i].includes(finish))mathLines.push(lines[i++]);
        if(i<lines.length){mathLines.push(lines[i].split(finish)[0]);i++;}
        value=mathLines.join('\n');
      }
      blocks.push('<div class="math-display">'+math(value,true)+'</div>');continue;
    }
    const heading=/^(#{1,6})\s+(.+)$/.exec(line);
    if(heading){const level=Math.min(4,Math.max(3,heading[1].length+1));blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`);i++;continue;}
    if(/^(?:[-*+]\s+|\d+[.)]\s+)/.test(line)){
      const ordered=/^\d/.test(line),items=[];
      while(i<lines.length&&(ordered?/^\d+[.)]\s+/.test(lines[i].trim()):/^[-*+]\s+/.test(lines[i].trim()))){
        items.push('<li>'+inline(lines[i++].trim().replace(/^(?:[-*+]\s+|\d+[.)]\s+)/,''))+'</li>');
      }
      blocks.push(`<${ordered?'ol':'ul'}>${items.join('')}</${ordered?'ol':'ul'}>`);continue;
    }
    if(line.startsWith('> ')){
      const quotes=[];
      while(i<lines.length&&lines[i].trim().startsWith('> '))quotes.push(lines[i++].trim().slice(2));
      blocks.push('<blockquote>'+inline(quotes.join(' '))+'</blockquote>');continue;
    }
    const paragraph=[lines[i++].trim()];
    while(i<lines.length&&lines[i].trim()&&!/^(#{1,6}\s|```|\$\$|\\\[|[-*+]\s|\d+[.)]\s|> )/.test(lines[i].trim()))paragraph.push(lines[i++].trim());
    blocks.push('<p>'+inline(paragraph.join(' '))+'</p>');
  }
  return blocks.join('\n');
}

// Editorial guides use CommonMark lists and nested code blocks. Keep their
// renderer separate from mathematical records' explicit TeX handling.
function guideMarkdown(source=''){
  const renderer=new Renderer();
  renderer.html=({text})=>esc(text);
  renderer.link=function({href,title,tokens}){
    const text=this.parser.parseInline(tokens);
    if(!(/^(?:https?:\/\/|#)/i.test(href)||href.startsWith('/')&&!href.startsWith('//')))return text;
    const legacyOrigin='https://dongkaicheng.github.io/math-research-atlas';
    const target=href.startsWith(legacyOrigin+'/')?origin+href.slice(legacyOrigin.length):href.startsWith('/')?url(href):href;
    return `<a href="${esc(target)}"${title?` title="${esc(title)}"`:''}>${text}</a>`;
  };
  return marked.parse(source.replace(/^# [^\n]+\n\s*/,''),{renderer,async:false});
}

function loadPage(title,description,content,p,extraHead='',extraScripts=''){
  const pageTitle=title===brand?(brand==='OpenMath'?'OpenMath | Arithmetic and Non-Archimedean Geometry':brand+' — Open mathematics'):title+' | '+brand;
  // Public ownership marker issued by the owner's Google Search Console account.
  // Keep it on the canonical homepage after verification; it is not a login credential.
  const googleVerification=p==='/'&&origin==='https://openmath-atlas.org'?'<meta name="google-site-verification" content="WE7A5abWl6z3sg4dMlvn5oj4t7cYwGbb9T7qU1ld1Sw" />':'';
  const socialMetadata=`<meta property="og:type" content="website"><meta property="og:title" content="${esc(pageTitle)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical(p))}"><meta property="og:site_name" content="${esc(brand)}"><meta name="twitter:card" content="summary">`;
  const websiteSchema=p==='/'&&brand==='OpenMath'?'<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'WebSite','@id':canonical('/')+'#website',name:'OpenMath',url:canonical('/'),description, inLanguage:'en'})+'</script>':'';
  const collectionSchema=p==='/projects/foundations/'&&brand==='OpenMath'?'<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage',name:title,url:canonical(p),description,isPartOf:{'@id':canonical('/')+'#website'},about:['Non-Archimedean geometry','Berkovich analytic spaces','Formal models','Tropical geometry','Skeleta']})+'</script>':'';
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pageTitle)}</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical(p))}">
${googleVerification}
${socialMetadata}
${websiteSchema}${collectionSchema}
<link rel="icon" href="${url('/assets/favicon.svg')}" type="image/svg+xml">
<link rel="stylesheet" href="${url('/assets/style.css')}">
<link rel="stylesheet" href="${url('/assets/github-extra.css')}">
<link rel="stylesheet" href="${url('/assets/katex.min.css')}">
${extraHead}
</head><body>
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header"><div class="header-inner">
<a class="brand" href="${url('/')}" aria-label="${esc(brand)} home"><span>${esc(brand)}</span></a>
<nav aria-label="Main navigation">
<a href="${url('/foundations/')}">Foundations</a>
<a href="${url('/research/')}">Research</a>
<a href="${url('/ai-and-math/')}">AI &amp; Math</a>
<a href="${url('/feedback/')}">Feedback</a>
<a href="${url('/contribute/')}">Contribute</a>
<a href="${url('/about/')}">About</a>
</nav>
<div class="header-actions"><a class="search-link" href="${url('/search/')}" aria-label="Search">Search</a></div>
</div></header>
${content}
<footer class="site-footer minimal-footer"><div class="footer-bottom">
<span>${esc(brand)} · Open mathematical research</span>
<nav aria-label="Footer">
<a href="${url('/about/')}">About</a><a href="${url('/manifesto/')}">Why this site?</a>
<a href="${url('/ai-and-math/')}">AI &amp; Math</a>
<a href="${url('/feedback/')}">Feedback</a><a href="${url('/updates/')}">Updates</a><a href="${url('/maintenance/')}">How the site is maintained</a>
<a href="${url('/contribute/')}">Contribute</a><a href="${url('/admin/')}">Management</a>
<a href="${gh}" target="_blank" rel="noopener noreferrer">GitHub</a>
</nav></div></footer>
${extraScripts}
</body></html>`;
}

async function save(p,html){
  const relative=p==='/'?'index.html':p.replace(/^\//,'').replace(/\/$/,'')+'/index.html';
  const file=path.join(output,relative);
  await mkdir(path.dirname(file),{recursive:true});
  await writeFile(file,html);
}
function heading(sectionName,title,description){
  return `<div class="page-heading"><p class="eyebrow">${esc(sectionName)}</p><h1>${esc(title)}</h1><p class="page-description">${esc(description)}</p></div>`;
}
function breadcrumbs(labels){
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${url('/')}">Atlas</a>${labels.map(([label,href])=>`<span><span class="crumb-separator">/</span>${href?`<a href="${url(href)}">${esc(label)}</a>`:`<span aria-current="page">${esc(label)}</span>`}</span>`).join('')}</nav>`;
}
const externalArrow='<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19 19 5M8 5h11v11"/></svg>';
const agentPointer=JSON.parse(await readFile(path.join(root,'public','agents','current.json'),'utf8'));
if(!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(agentPointer.release))throw Error('Invalid agent release');
const agentBase='/agents/releases/'+agentPointer.release+'/';
const agentDirectory=path.join(root,'public','agents','releases',agentPointer.release);
const agentManifest=JSON.parse(await readFile(path.join(agentDirectory,'manifest.json'),'utf8'));
if(agentManifest.schema!=='math-agent-release/v1'||agentManifest.release!==agentPointer.release)throw Error('Agent release mismatch');
const agentDetails=[
  {id:'math-project-maintainer',title:'Math Project Maintainer',role:'Mathematical sources & proof dependencies',summary:'Maintains LaTeX corpora, stable result identities, exact hypotheses, proof support, review records and revisions. Now builds source-bound interactive logical diagrams, with explicit AND premises, valid OR alternatives and open steps.',skill:'6afb6f1142288191b50fba748e131144'},
  {id:'math-research-publisher',title:'Math Research Publisher',role:'Research websites & public editions',summary:'Publishes foundations and research programmes with stable links, paper editions, revision history and shared feedback. Integrates a principal, complete and focused logical map with an accessible mobile reading view.',skill:'6afbf7e6e934819199b3fe2819550ba7'},
  {id:'math-writing-editor',title:'Math Writing Editor',role:'Formal mathematical exposition',summary:'Improves definitions, theorem statements, proofs and research programmes without changing their mathematical substance. Now supports concise dependency diagrams for manuscripts and precise explanation of proof gaps.',skill:'6af6c42bc128819199ecf67841a635e5'},
];
if(Object.keys(agentManifest.agents).sort().join('|')!==agentDetails.map(a=>a.id).sort().join('|'))throw Error('Agent release is incomplete');
for(const agent of agentDetails){
  const entry=agentManifest.agents[agent.id];
  if(entry.file!==agent.id+'.zip'||!/^[0-9a-f]{64}$/.test(entry.sha256))throw Error('Invalid agent archive manifest: '+agent.id);
  const bytes=await readFile(path.join(agentDirectory,entry.file));
  if(bytes.length!==entry.bytes||createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('Agent archive hash mismatch: '+agent.id);
}
function card(p){
  return `<a href="${url('/projects/'+encodeURIComponent(p.project.id)+'/')}" class="project-row"><div><span class="micro">${p.project.category==='foundations'?'Foundations':'Research'} · ${p.edition?'Edition '+esc(p.edition):'Version '+p.revision}</span><h3>${esc(p.project.title)}</h3><p>${esc(p.project.summary)}</p></div>${externalArrow}</a>`;
}

const projectFiles=(await readdir(path.join(root,'content','projects'))).filter(f=>f.endsWith('.json')).sort();
const bundles=await Promise.all(projectFiles.map(async f=>JSON.parse(await readFile(path.join(root,'content','projects',f),'utf8'))));
if(new Set(bundles.map(x=>x.project.id)).size!==bundles.length)throw Error('Duplicate project ID');
if(bundles.some(x=>x.schemaVersion!==1||!Array.isArray(x.entries)))throw Error('Invalid project bundle');
const histories=new Map();
for(const current of bundles){
  let files=[];
  const dir=path.join(root,'content','history',current.project.id);
  try{files=(await readdir(dir)).filter(x=>/^v\d+\.json$/.test(x));}
  catch(e){if(e.code!=='ENOENT')throw e;}
  const records=await Promise.all(files.map(async file=>JSON.parse(await readFile(path.join(dir,file),'utf8'))));
  records.sort((a,b)=>a.revision-b.revision);
  for(const snapshot of records){
    if(snapshot.project?.id!==current.project.id||snapshot.revision>=current.revision)throw Error('Invalid historical snapshot: '+current.project.id);
    if(!files.includes('v'+snapshot.revision+'.json'))throw Error('Version filename does not match revision');
  }
  if(records.length!==current.revision)throw Error('Missing one or more immutable revision snapshots for '+current.project.id);
  histories.set(current.project.id,records);
}
const projects=bundles.filter(x=>x.project.category==='research');
const foundations=bundles.filter(x=>x.project.category==='foundations');
const entries=bundles.flatMap(b=>b.entries.map(entry=>({entry,project:b.project,revision:b.revision})));
if(new Set(entries.map(e=>e.entry.id)).size!==entries.length)throw Error('Duplicate permanent entry ID');

const featured=`<main id="main-content" class="simple-home">
<section class="simple-hero wrap">
<h1>${esc(brand)}</h1>
<p class="simple-statement">We use AI to bring mathematical knowledge together, share open questions, and build new theories with others.</p>
<p class="simple-statement" style="font-size:1rem;max-width:54rem">Explore Berkovich and non-Archimedean geometry, Bedford–Taylor pluripotential theory and positive currents, and Beilinson–Bloch heights and Arakelov geometry. Each research programme links its conjectures, proof dependencies, current status, and public references.</p>
<nav class="simple-quick-links" aria-label="About and feedback">
<a href="${url('/about/')}"><span>About this site</span>${externalArrow}</a>
<a href="${url('/feedback/')}"><span>Feedback &amp; discussion</span>${externalArrow}</a>
<a href="${url('/manifesto/')}"><span>Why this site?</span>${externalArrow}</a>
</nav></section>
<section class="community-home-invite wrap" aria-labelledby="home-contribute-title">
<div><p class="eyebrow">GROW OPENMATH WITH US</p><h2 id="home-contribute-title">New projects and project managers are welcome.</h2><p>Bring a mathematical project in any subject, or help maintain an existing one. The site owner reviews new-project proposals and appoints managers for an agreed scope.</p></div>
<div class="community-actions"><a class="button button-dark" href="${url('/contribute/projects/')}">Propose a project</a><a class="button button-outline" href="${url('/contribute/maintainers/')}">Become a project manager</a></div>
</section>
<section class="simple-tracks wrap"><h2>Two kinds of work</h2><div class="simple-track-list">
<a href="${url('/foundations/')}"><div><h3>Foundations</h3><p>Definitions, theorems, and full proofs, with clear links between results.</p></div>${externalArrow}</a>
<a href="${url('/research/')}"><div><h3>Research</h3><p>Conjectures, partial results, and plans for new theories.</p></div>${externalArrow}</a>
</div></section>
<section class="simple-projects wrap" id="projects"><h2>Projects</h2>
<div class="simple-project-list">${bundles.map(card).join('')}</div>
<p class="micro">Each project distinguishes open questions, conditional results, and available proofs. Outline projects are labelled separately from full research editions.</p>
</section>
<section class="simple-agent-bridge wrap" aria-labelledby="home-agents-title"><div><p class="eyebrow">TOOLS FOR MATHEMATICAL RESEARCH</p><h2 id="home-agents-title">Three updated research agents</h2><p>Download the mathematical maintainer, research publisher and writing editor. The latest packages include source-linked logical diagrams: joint premises, alternative proofs, open steps and readable mobile views.</p></div><a class="button button-dark" href="${url('/ai-and-math/')}">Explore AI &amp; Math ${externalArrow}</a></section>
</main>`;
await save('/',loadPage(brand,'OpenMath is an open research atlas for arithmetic and Arakelov geometry, Berkovich spaces, non-Archimedean Bedford–Taylor theory, Beilinson–Bloch heights, proof maps and AI for mathematics.',featured,'/'));

const agentCards=agentDetails.map(agent=>{
  const info=agentManifest.agents[agent.id];
  return `<article class="agent-card" id="${esc(agent.id)}"><p class="micro">${esc(agent.role)}</p><h3>${esc(agent.title)}</h3><p>${esc(agent.summary)}</p><div class="agent-actions"><a class="button button-dark" href="${url(agentBase+info.file)}" download>Download ZIP <span aria-hidden="true">↓</span></a><a class="text-link" href="https://chatgpt.com/skills?skill_id=${esc(agent.skill)}" rel="noopener noreferrer">Open skill details ${externalArrow}</a></div><p class="agent-integrity">Fixed snapshot · ${Math.ceil(info.bytes/1024)} KB · SHA-256 <code>${esc(info.sha256)}</code></p></article>`;
}).join('');
const agentFeedbackPage=canonical('/ai-and-math/');
const aiMath=`<main id="main-content" class="wrap index-page ai-math-page">
${breadcrumbs([['AI & Math']])}
${heading('OPEN RESEARCH TOOLS','AI & Math','Download mathematical research agents, study live proof maps, and contribute through the atlas-wide feedback board.')}
<div class="agent-release-bar"><div><span class="micro">PUBLIC SKILL SNAPSHOT</span><strong>${esc(agentManifest.release)}</strong><p>Three installable ZIPs; source-bound diagram workflow included.</p></div><a href="${url(agentBase+'manifest.json')}">Release manifest &amp; checksums ${externalArrow}</a></div>
<section id="agents" class="ai-section"><div class="ai-section-heading"><p class="eyebrow">01 / DOWNLOAD</p><h2>Research agents</h2><p>These are downloadable versions of the three active skill packages. They are tools for research work, not independent proof certificates or unattended background services.</p></div><div class="agent-grid">${agentCards}</div></section>
<section id="logic-diagrams" class="ai-section"><div class="ai-section-heading"><p class="eyebrow">02 / LOGIC MAPS</p><h2>Logical relationships, not just a list</h2><p>The common drawing workflow starts with exact statements and supporting arguments.</p></div><div class="logic-capability-grid"><div><strong>AND</strong><p>Every jointly required premise, additional hypothesis and input stays visible.</p></div><div><strong>OR</strong><p>Separate sufficient proof routes are distinguished from speculative alternatives.</p></div><div><strong>Open / blocked</strong><p>Missing inferences and invalid shortcuts never become proved arrows.</p></div><div><strong>Source &amp; scope</strong><p>Stable identifiers, detailed argument links, full and focused diagrams, and a text view on phones.</p></div></div><div class="ai-example-links"><a href="${url('/projects/bedford-taylor/map/#total-logic')}">Explore the Bedford–Taylor overall logical map ${externalArrow}</a><a href="${url('/projects/strong-green/results/proof-diagrams/')}">Explore the Strong Green proof maps ${externalArrow}</a></div></section>
<section id="usage" class="ai-section"><div class="ai-section-heading"><p class="eyebrow">03 / USE &amp; UPDATE</p><h2>Use a fixed version or follow updates</h2></div><ol class="ai-steps"><li>Download a ZIP and extract its single skill folder into your agent's skills directory; read its <code>SKILL.md</code>.</li><li>For portable interactive diagrams, use Python 3.10+ and Graphviz <code>dot</code>. The publisher can integrate the resulting views into an existing website.</li><li>Use the release manifest to verify SHA-256. Each future agent update receives a new immutable ZIP URL; the current download links change only after review and publication.</li></ol><p class="ai-muted">These packages are public snapshots. Updates to the personal agent do not automatically modify the website; a reviewed release must be published here.</p></section>
<section id="research-sites" class="ai-section"><div class="ai-section-heading"><p class="eyebrow">04 / MATHEMATICS</p><h2>Research and foundations</h2></div><div class="ai-research-links"><a href="${url('/')}"><strong>${esc(brand)}</strong><span>The umbrella atlas of foundations, conjectures and revisions.</span>${externalArrow}</a><a href="${url('/projects/bedford-taylor/')}"><strong>Non-Archimedean Bedford–Taylor Theory</strong><span>Source-linked results, open gates, papers and the overall logic map.</span>${externalArrow}</a><a href="${url('/projects/strong-green/')}"><strong>Beilinson–Bloch / Strong Green</strong><span>Research programme, permanent records and proof diagrams.</span>${externalArrow}</a></div><p class="ai-inline">For the wider position on shared mathematical knowledge, read the <a href="${url('/manifesto/')}">manifesto</a>.</p></section>
<section id="agent-feedback" class="ai-section ai-feedback"><div class="ai-section-heading"><p class="eyebrow">05 / DISCUSSION</p><h2>One feedback system</h2><p>Questions about the agents, accessibility, research maps, or future features use the existing Atlas GitHub Issues board. General comments need no theorem or edition number.</p></div><a class="button button-dark" href="${url('/feedback/')}">Leave general feedback ${externalArrow}</a><a class="text-link" href="${url('/feedback/')}?page=${encodeURIComponent(agentFeedbackPage)}">Discuss this tools page</a><a class="text-link" href="${url('/maintenance/')}">Publication &amp; maintenance</a></section>
<section id="ai-management" class="ai-section"><div class="ai-section-heading"><p class="eyebrow">MANAGE WITH YOUR AI</p><h2>Use the agents within your project scope</h2><p>Project managers can bring their AI assistant into the management workflow to review content, prepare source changes and keep the evidence with each revision.</p></div><div class="community-actions"><a class="button button-dark" href="${url('/ai-management/')}">AI management guide</a><a class="button button-outline" href="${url('/contribute/maintainers/')}">Become a project manager</a></div></section>
</main>`;
await save('/ai-and-math/',loadPage('AI & Math — Research Agents','Three downloadable mathematical research agents with source-bound logical diagrams, proof links and fixed release checksums.',aiMath,'/ai-and-math/'));

for(const [route,title,description,group] of [
  ['/foundations/','Foundations','Definitions, theorems, complete proofs, and stable references.',foundations],
  ['/research/','Research','Open conjectures, partial results, and plans for new mathematical theories.',projects],
]){
  const content=`<main id="main-content" class="wrap index-page simple-track-index">${breadcrumbs([[title]])}
  ${heading(brand.toUpperCase(),title,description)}
  <div class="simple-project-list">${group.map(card).join('')}</div>
  </main>`;
  await save(route,loadPage(title,description,content,route));
}

for(const bundle of bundles){
  const p=bundle.project,isFoundation=p.category==='foundations';
  const route='/projects/'+encodeURIComponent(p.id)+'/';
  const questions=bundle.entries.filter(e=>['conjecture','question'].includes(e.kind));
  const results=bundle.entries.filter(e=>e.kind==='result');
  const notes=bundle.entries.filter(e=>['definition','note'].includes(e.kind));
  const entryList=list=>list.length?`<ul class="entry-list">${list.map(e=>`<li class="entry-row"><a href="${url('/r/'+e.id+'/')}"><span class="entry-id">${esc(e.id)} · ${esc(e.status)}</span><h3>${esc(e.title)}</h3><p>${esc(e.summary)}</p></a></li>`).join('')}</ul>`:`<div class="empty-entries"><div class="empty-rule"></div><div><h3>Source texts are being prepared.</h3><p>Exact statements and their proofs will be added after source review.</p></div></div>`;
  const category=isFoundation?'Foundations':'Research';
  const content=`<main id="main-content" class="wrap document-page">
  ${breadcrumbs([[category,isFoundation?'/foundations/':'/research/'],[p.title]])}
  <header class="document-header">
  <p class="eyebrow">${isFoundation?'FOUNDATIONAL THEORY':'CONJECTURES & NEW THEORY'}</p>
  <h1>${esc(p.title)}</h1><p class="document-deck">${esc(p.summary)}</p>
  <div class="document-meta"><span class="outline-badge">Version ${bundle.revision}${bundle.revision===0?' · Outline':''}</span></div>
  ${bundle.revision>0?`<p class="document-meta">Earlier versions: ${histories.get(p.id).map(s=>`<a href="${url('/projects/'+p.id+'/versions/'+s.revision+'/')}">Version ${s.revision}</a>`).join(' · ')}</p>`:''}
  <div class="keyword-list">${p.keywords.map(x=>`<a href="${url('/search/')}?q=${encodeURIComponent(x)}">${esc(x)}</a>`).join('')}</div>
  </header>
  ${bundle.revision===0?alert('Source outline','Exact theorem statements and proofs will be added only from reviewed source material.'):''}
  <div class="document-grid"><aside class="document-sidebar"><p class="eyebrow">ON THIS PAGE</p><nav>
  <a href="#motivation">01 <span>${isFoundation?'Scope & organization':'Motivation'}</span></a>
  <a href="#questions">02 <span>${isFoundation?'Definitions & conventions':'Conjectures & questions'}</span></a>
  <a href="#results">03 <span>${isFoundation?'Theorems & proofs':'Partial results & proofs'}</span></a>
  <a href="#programme">04 <span>${isFoundation?'Further development':'Proof programme'}</span></a>
  <a href="#feedback">05 <span>Reader contributions</span></a>
  </nav></aside><div class="document-body">
  ${section('motivation','01 / MOTIVATION',isFoundation?'Scope & organization':'Why this question?',`<div class="prose-math">${markdown(p.motivation)}</div>`)}
  ${section('questions','02 / QUESTIONS',isFoundation?'Definitions & conventions':'Conjectures & open questions',entryList(isFoundation?notes:questions))}
  ${section('results','03 / RESULTS',isFoundation?'Theorems & complete proofs':'Partial results & proofs',entryList(results))}
  ${section('programme','04 / PROGRAMME',isFoundation?'Further development':'A programme of proof',`<div class="prose-math">${markdown(p.programme)}</div>`)}
  ${!isFoundation&&notes.length?section('notes','NOTES','Notes & definitions',entryList(notes)):''}
  ${section('feedback','05 / CONTRIBUTE','Questions and general feedback',`<p class="section-lead">Use the atlas-wide feedback board for this project, or leave a general comment without choosing a mathematical result.</p><a class="button button-dark" href="${url('/feedback/')}?project=${encodeURIComponent(p.id)}&amp;version=${encodeURIComponent(bundle.edition||String(bundle.revision))}">Discuss this project</a> <a class="text-link" href="${url('/feedback/guide/')}">How feedback works</a>`)}
  </div></div></main>`;
  const legacyRedirect=`<script>(function(){const v=new URLSearchParams(location.search).get('v');if(v!==null&&/^\\d+$/.test(v)){location.replace(${JSON.stringify(url('/projects/'+p.id+'/versions/'))}+v+'/');}})();</script>`;
  const searchSummary=p.id==='foundations'?'Non-Archimedean geometry foundations: Berkovich analytic spaces, formal models, skeleta and tropical geometry. An evolving reference of definitions, research questions and proof plans.':p.summary;
  await save(route,loadPage(p.title,searchSummary,content,route,'',legacyRedirect));
  for(const snapshot of histories.get(p.id)){
    const versionRoute='/projects/'+p.id+'/versions/'+snapshot.revision+'/';
    const old=snapshot.project;
    const oldEntries=snapshot.entries.map(e=>`<li class="entry-row"><strong>${esc(e.id)} · ${esc(e.kind)} · ${esc(e.status)}</strong><h3>${esc(e.title)}</h3><div class="prose-math">${markdown(e.statement)}</div>${e.proof?`<h4>Proof</h4><div class="prose-math">${markdown(e.proof)}</div>`:''}</li>`).join('');
    const oldContent=`<main id="main-content" class="wrap document-page">${breadcrumbs([[category,isFoundation?'/foundations/':'/research/'],[p.title,route],['Version '+snapshot.revision]])}
    <header class="document-header"><p class="eyebrow">ARCHIVED PUBLICATION</p><h1>${esc(old.title)}</h1><p class="document-deck">${esc(old.summary)}</p>
    <p class="document-meta">Version ${snapshot.revision} · ${esc(snapshot.publishedAt)}</p>
    ${alert('Historical version','This is an immutable snapshot; later versions may correct or extend its mathematics.')}
    ${snapshot.publicationProjection?'<p class="document-meta">Unsigned historical reading copy. Its mathematical text and historical status are retained; the original file identity is recorded with the snapshot.</p>':''}
    <a class="button button-outline" href="${url(route)}">Current version</a></header>
    <div class="document-body">
    ${section('motivation','MOTIVATION','Motivation',`<div class="prose-math">${markdown(old.motivation)}</div>`)}
    ${section('programme','PROGRAMME','Programme',`<div class="prose-math">${markdown(old.programme)}</div>`)}
    ${section('entries','MATHEMATICAL ENTRIES','Statements and arguments',oldEntries?`<ul class="entry-list">${oldEntries}</ul>`:'<p>No entries were published at this version.</p>')}
    </div></main>`;
    await save(versionRoute,loadPage(old.title+' — Version '+snapshot.revision,old.summary,oldContent,versionRoute));
  }
}

for(const {entry:e,project:p,revision} of entries){
  const route='/r/'+encodeURIComponent(e.id)+'/';
  const details=`<main id="main-content" class="wrap document-page">
  ${breadcrumbs([['Research','/research/'],[p.title,'/projects/'+p.id+'/'],[e.title]])}
  <header class="document-header"><p class="eyebrow">${esc(e.kind.toUpperCase())} · ${esc(e.id)}</p><h1>${esc(e.title)}</h1><p class="document-deck">${esc(e.summary)}</p><div class="document-meta"><span class="outline-badge">${esc(e.status)}</span><span>Project version ${revision}</span></div></header>
  <div class="document-body">
  ${section('statement','STATEMENT','Statement',`<div class="prose-math">${markdown(e.statement)}</div>`)}
  ${e.proof?section('proof','ARGUMENT','Proof',`<div class="prose-math">${markdown(e.proof)}</div>`):''}
  ${e.motivation?section('motivation','MOTIVATION','Why this matters',`<div class="prose-math">${markdown(e.motivation)}</div>`):''}
  ${e.approach?section('approach','APPROACH','Research approach',`<div class="prose-math">${markdown(e.approach)}</div>`):''}
  ${e.dependencies.length?section('dependencies','DEPENDENCIES','Direct dependencies',`<ul>${e.dependencies.map(id=>`<li><a href="${url('/r/'+id+'/')}">${esc(id)}</a></li>`).join('')}</ul>`):''}
  ${e.references.length?section('references','REFERENCES','References',`<ol>${e.references.map(x=>`<li><a href="${esc(x.url)}" rel="noopener noreferrer">${esc(x.label)}</a>${x.locator?' · '+esc(x.locator):''}</li>`).join('')}</ol>`):''}
  ${section('feedback','DISCUSSION','Questions and corrections',`<p class="section-lead">Reference this permanent ID (${esc(e.id)}) and project version ${revision} in your submission.</p><a class="button button-dark" href="${url('/feedback/')}?project=${encodeURIComponent(p.id)}&amp;entry=${encodeURIComponent(e.id)}&amp;version=${revision}">Discuss this result</a>`)}
  </div></main>`;
  await save(route,loadPage(e.title,e.summary,details,route));
}

// Public static prose is extracted once from the former site; update links for
// the GitHub Pages project subdirectory and revise the privacy policy.
const rewriteLinks=html=>html.replace(/\b(href|src)="\/(?!\/)([^"]*)"/g,(_all,attr,p)=>`${attr}="${url('/'+p)}"`);
const manifesto=await readFile(path.join(root,'content','manifesto.html'),'utf8');
await save('/manifesto/',loadPage('Why this site?','Our goals for open mathematics, AI, collaboration, and building new mathematical theory.',rewriteLinks(manifesto),'/manifesto/'));

const about=`<main id="main-content" class="wrap index-page simple-about-page">
${breadcrumbs([['About']])}
${heading('ABOUT THIS SITE','Math is better when we share it.',brand+' is a place to read, check, and build mathematics in the open.')}
<section class="simple-about-section"><h2>Two kinds of projects</h2>
<div class="simple-track-list"><a href="${url('/foundations/')}"><div><h3>Foundations</h3><p>Definitions, theorems, and complete proofs.</p></div>${externalArrow}</a>
<a href="${url('/research/')}"><div><h3>Research</h3><p>Open questions, partial results, and plans for new theories.</p></div>${externalArrow}</a></div></section>
<section class="simple-about-section"><h2>How we work</h2><p>We use AI to read, organize, and check mathematics. Exact versions and the history of changes remain available. We also aim to use Lean for formal verification.</p><a class="text-link" href="${url('/manifesto/')}">Read more about our goals ${externalArrow}</a></section>
<section class="simple-about-section"><h2>Research agents</h2><p>Three downloadable mathematical skills support source review, logically precise diagrams, public editions and readable exposition.</p><a class="text-link" href="${url('/ai-and-math/')}">AI &amp; Math: downloads and documentation ${externalArrow}</a></section>
<section class="simple-about-section"><h2>Feedback and editing</h2><p>All projects share one GitHub Issues feedback board. General comments do not need a theorem ID. Mathematical revisions are reviewed separately and published with an edition history.</p><a class="button button-dark" href="${url('/feedback/')}">Read and share feedback ${externalArrow}</a> <a class="text-link" href="${url('/maintenance/')}">Publication and maintenance</a></section>
</main>`;
await save('/about/',loadPage('About this site','About the open mathematical atlas and how to contribute.',about,'/about/'));

const management=JSON.parse(await readFile(path.join(root,'content','administration.json'),'utf8'));
const communityPages=buildCommunityPages({brand,repository,management,esc,url,heading,breadcrumbs});
for(const page of communityPages){
  await save(page.route,loadPage(page.title,page.description,page.html,page.route,page.noindex?'<meta name="robots" content="noindex,follow">':''));
}

const guideSource=await readFile(path.join(root,'content','guide.md'),'utf8');
const guide=`<main id="main-content" class="wrap index-page discussion-page discussion-guide">
${breadcrumbs([['Feedback','/feedback/'],['How feedback works']])}
${heading('CONTRIBUTE','How feedback works','Read, question, correct, and build on mathematical work together.')}
<div class="prose-math">${guideMarkdown(guideSource)}</div>
<p><a class="button button-dark" href="${url('/feedback/')}">View feedback</a> <a class="button button-outline" href="${gh}/issues/new/choose">Send feedback on GitHub</a></p>
</main>`;
await save('/feedback/guide/',loadPage('How feedback works','How to post public feedback, upload a LaTeX or Lean ZIP, and follow a GitHub discussion.',guide,'/feedback/guide/'));

const categories=CATEGORIES.map(([id,label])=>`<a data-feedback-kind="${esc(id)}" href="${githubIssueUrl(id)}">${esc(label)} ${externalArrow}</a>`).join('');
const filters=[...CATEGORIES,...COMMUNITY_CATEGORIES].map(([id,label])=>`<button type="button" data-category="${esc(id)}">${esc(label)}</button>`).join('');
const feedback=`<main id="main-content" class="wrap index-page discussion-page">
${breadcrumbs([['Feedback']])}
${heading('OPEN DISCUSSION','Feedback & discussion','One shared board for general comments, mathematical questions, corrections, and research ideas across the atlas.')}
<p class="discussion-guide-link">New here? <a href="${url('/feedback/guide/')}">How to submit feedback and upload LaTeX files.</a></p>
<div class="outline-notice"><div><strong>General feedback is welcome.</strong><p>Comment on the site, its organization, notation, explanations, accessibility, or future directions. A theorem ID, proof, or version number is not required.</p><a class="text-link" data-feedback-kind="general" href="${githubIssueUrl('general')}">Leave a general comment →</a></div></div>
<div id="feedback-context-controls"></div>
<div class="discussion-filters" role="group" aria-label="Filter feedback"><button type="button" data-category="" class="active">All</button>${filters}</div>
<section class="discussion-list" aria-label="Public feedback" id="github-feedback"><div class="discussion-empty"><p>Loading public GitHub Issues…</p><a href="${gh}/issues">Read the feedback directly on GitHub</a></div></section>
<p class="discussion-note">Discussions and attached ZIP files are public. You need a GitHub account to post or comment. <a href="${gh}/issues">View all issues on GitHub</a>.</p>
<section id="new" class="discussion-form"><h2>Start a discussion</h2><p>Choose a category to continue on GitHub. Opening the form does not submit anything. You can write your message, attach a ZIP file, and review it before posting publicly.</p>
<div class="feedback-choice-grid">${categories}</div>
<p>Corrections and proofs do not automatically change a published mathematical claim. Authorised project maintainers review proposed changes separately.</p>
<p class="community-board-entry">Want to develop the atlas? <a href="${url('/contribute/projects/')}">Propose a new project</a> or <a href="${url('/contribute/maintainers/')}">apply to be a project manager</a>. Applications use this same discussion board and are reviewed by the site owner.</p>
</section>
</main>`;
await save('/feedback/',loadPage('Feedback & discussion','Open GitHub-based mathematical feedback with comments, categories, and LaTeX attachments.',feedback,'/feedback/','',
  `<script>window.ATLAS_GITHUB_REPOSITORY=${JSON.stringify(repository)};window.ATLAS_FEEDBACK_PROJECTS=${JSON.stringify(bundles.map(b=>({id:b.project.id,title:b.project.title}))).replace(/</g,'\\u003c')};</script><script type="module" src="${url('/assets/feedback.js')}"></script>`));

const maintenanceSource=await readFile(path.join(root,'docs','MAINTENANCE.md'),'utf8');
await save('/maintenance/',loadPage('Publication and maintenance','How feedback, review, revisions, frozen editions, and corrections are maintained.',`<main id="main-content" class="wrap index-page discussion-page discussion-guide">${breadcrumbs([['Publication and maintenance']])}${heading(brand.toUpperCase(),'Publication and maintenance','One feedback board, reviewed changes, and permanent publication history.')}<div class="prose-math">${guideMarkdown(maintenanceSource)}</div></main>`,'/maintenance/'));

const updates=`<main id="main-content" class="wrap index-page simple-track-index">
${breadcrumbs([['Updates']])}
${heading(brand.toUpperCase(),'Updates','Changes to published projects. Old versions remain available.')}
<div class="simple-project-list">${bundles.filter(x=>x.revision>0).map(x=>`<a href="${url('/projects/'+x.project.id+'/')}"><div><span class="micro">${x.edition?'Edition '+esc(x.edition):'Version '+x.revision} · ${esc(x.publishedAt.slice(0,10))}</span><h3>${esc(x.project.title)}</h3><p>${esc(x.changeSummary)}</p></div></a>`).join('')||'<p class="simple-track-empty">No updates yet.</p>'}</div>
<div class="agent-update-note"><span class="micro">TOOLS · ${esc(agentManifest.release.slice(0,10))}</span><a href="${url('/ai-and-math/')}">Mathematical agents: logical diagram release ${externalArrow}</a><p>Three new fixed ZIP snapshots; published research editions remain unchanged.</p></div>
<p class="discussion-note">Every publication also has a Git commit and change history in <a href="${gh}/commits/main">GitHub</a>.</p>
</main>`;
await save('/updates/',loadPage('Updates','Public revision history for mathematical projects.',updates,'/updates/'));

const search=`<main id="main-content" class="wrap index-page search-page simple-search-page">
${breadcrumbs([['Search']])}${heading(brand.toUpperCase(),'Search','Find a project, theorem, or topic.')}
<form class="large-search" id="site-search"><label class="sr-only" for="atlas-search">Search published math</label>
<input id="atlas-search" type="search" name="q" placeholder="Enter a topic or result ID" maxlength="200" aria-label="Search published mathematics">
<button type="submit">Search</button></form>
<section class="search-results" id="search-results" aria-live="polite"></section>
</main>`;
await save('/search/',loadPage('Search','Search public project outlines, results, and mathematical topics.',search,'/search/','',
  `<script defer src="${url('/assets/search.js')}"></script>`));

await cp(path.join(root,'public'),output,{recursive:true});
const strongGreen=await buildStrongGreen({root,output,base,origin,repository});
const bedfordTaylor=await buildBedfordTaylor({root,output,base,origin,repository});
const searchIndex=[...bundles.map(b=>({title:b.project.title,summary:b.project.summary,keywords:b.project.keywords,link:url('/projects/'+b.project.id+'/'),category:b.project.category,body:[b.project.motivation,b.project.programme].join(' ')})),
  ...entries.map(({entry:e,project:p})=>({title:e.title,summary:e.summary,keywords:p.keywords,link:url('/r/'+e.id+'/'),category:e.kind,body:[e.statement,e.proof,e.motivation].filter(Boolean).join(' ')})),
  ...agentDetails.map(a=>({title:a.title,summary:a.summary,keywords:['agent','skill','logical diagrams','AI & Math'],link:url('/ai-and-math/#'+a.id),category:'tools',body:a.role})),
  ...communityPages.filter(p=>!p.noindex).map(p=>({title:p.title,summary:p.description,keywords:['contribute','new project','project manager','AI management'],link:url(p.route),category:'participation',body:p.description})),
  ...bedfordTaylor.searchIndex,...strongGreen.searchIndex];
await writeFile(path.join(output,'search-index.json'),JSON.stringify(searchIndex));
await cp(path.join(root,'assets'),path.join(output,'assets'),{recursive:true});
await cp(path.join(root,'lib','feedback.mjs'),path.join(output,'assets','feedback-core.mjs'));
const katexCss=path.join(root,'node_modules','katex','dist','katex.min.css');
await cp(katexCss,path.join(output,'assets','katex.min.css'));
await cp(path.join(root,'node_modules','katex','dist','fonts'),path.join(output,'assets','fonts'),{recursive:true});
await writeFile(path.join(output,'.nojekyll'),'');

const routes=['/','/about/','/manifesto/','/foundations/','/research/','/ai-and-math/','/feedback/','/feedback/guide/','/updates/','/search/','/maintenance/',...communityPages.map(p=>p.route),...bedfordTaylor.routes,...strongGreen.routes,
 ...bundles.map(b=>'/projects/'+b.project.id+'/'),...entries.map(x=>'/r/'+x.entry.id+'/'),
 ...bundles.flatMap(b=>histories.get(b.project.id).map(s=>'/projects/'+b.project.id+'/versions/'+s.revision+'/'))];
const xml=s=>esc(s).replace(/'/g,'&apos;');
const coreRoutes=['/','/projects/bedford-taylor/','/projects/foundations/','/projects/strong-green/'];
const indexableRoutes=[...new Set(routes.filter(p=>p!=='/search/'&&p!=='/admin/'&&(!bedfordTaylor.routes.includes(p)||bedfordTaylor.indexableRoutes.includes(p))&&(!strongGreen.routes.includes(p)||strongGreen.indexableRoutes.includes(p))))];
for(const route of coreRoutes)if(!indexableRoutes.includes(route))throw Error('Core Search Console entry is not indexable: '+route);
const sitemapXML=paths=>'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+paths.map(p=>`<url><loc>${xml(canonical(p))}</loc></url>`).join('\n')+'\n</urlset>\n';
await writeFile(path.join(output,'sitemap.xml'),sitemapXML([...coreRoutes,...indexableRoutes.filter(p=>!coreRoutes.includes(p))]));
await writeFile(path.join(output,'sitemap-core.xml'),sitemapXML(coreRoutes));
await writeFile(path.join(output,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${canonical('/sitemap.xml')}\nSitemap: ${canonical('/sitemap-core.xml')}\n`);
const updateItems=bundles.filter(b=>b.revision>0).map(b=>`<item><title>${xml(b.project.title)}</title><link>${xml(canonical('/projects/'+b.project.id+'/'))}</link><description>${xml(b.changeSummary)}</description><pubDate>${new Date(b.publishedAt).toUTCString()}</pubDate></item>`).join('');
await writeFile(path.join(output,'feed.xml'),`<?xml version="1.0"?><rss version="2.0"><channel><title>${xml(brand)} updates</title><link>${xml(canonical('/'))}</link><description>Changes to published mathematical research</description>${updateItems}</channel></rss>`);
await writeFile(path.join(output,'404.html'),loadPage('Page not found','This page could not be found.',`<main id="main-content" class="wrap index-page">${heading('NOT FOUND','Page not found','The link may be outdated.')}<p><a class="button button-dark" href="${url('/')}">Return to the atlas</a></p></main>`,'/404.html'));
if(!base){
  // Old reading editions are immutable and still contain the
  // original GitHub Pages /math-research-atlas/ asset URLs. Supply a legacy
  // base-path alias on the custom host without modifying any frozen release.
  const oldPath=path.join(output,'math-research-atlas');
  for(const project of ['bedford-taylor','strong-green']){
    const frozen=path.join('projects',project,'editions');
    await mkdir(path.join(oldPath,'projects',project),{recursive:true});
    await cp(path.join(output,frozen),path.join(oldPath,frozen),{recursive:true});
  }
  await cp(path.join(output,'assets'),path.join(oldPath,'assets'),{recursive:true});
  for(const route of routes){
    if(/^\/projects\/(?:bedford-taylor|strong-green)\/editions\//.test(route))continue;
    if(!route.startsWith('/')||route.includes('..'))throw Error('Unsafe legacy alias route');
    const target=path.join(oldPath,route.endsWith('/')?route.slice(1)+'index.html':route.slice(1));
    const destination=canonical(route);
    const legacy=route==='/' ? `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${esc(destination)}"><title>Former atlas address retired | OpenMath</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f8f7f2;color:#26332e;font:17px/1.65 system-ui,-apple-system,Segoe UI,sans-serif}main{max-width:670px;padding:44px 28px}h1{font:600 clamp(30px,5vw,44px)/1.2 Georgia,serif;color:#426558}a{color:#345849}a:focus-visible{outline:2px solid #426558;outline-offset:3px}.action{display:inline-block;padding:12px 20px;background:#426558;color:white;text-decoration:none;margin:14px 0}.small{font-size:14px;color:#68736c}</style></head><body><main><p class="small">OpenMath · site migration</p><h1>This website address is no longer in use.</h1><p>The former Mathematical Atlas website at <code>/math-research-atlas/</code> has been retired. Its current research content is now published at <strong>OpenMath</strong>.</p><p><a class="action" href="${esc(destination)}">Visit the current OpenMath website</a></p><p class="small">Historical mathematical editions and archived source files remain available through their permanent links; this notice replaces only the obsolete landing page.</p></main></body></html>` : `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${esc(destination)}"><meta http-equiv="refresh" content="0;url=${esc(destination)}"><title>Page moved to ${esc(brand)}</title></head><body><p>This page moved to <a href="${esc(destination)}">${esc(destination)}</a>.</p><script>location.replace(${JSON.stringify(destination)}+location.search+location.hash);</script></body></html>`;
    await mkdir(path.dirname(target),{recursive:true});await writeFile(target,legacy);
  }
}
process.stdout.write(`Built ${new Set(routes).size} page routes, ${bundles.length} projects and ${entries.length+bedfordTaylor.recordCount+strongGreen.recordCount} permanent entries into dist/.\n`);
