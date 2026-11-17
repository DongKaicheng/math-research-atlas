import {readFile,writeFile,mkdir,readdir,cp,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import katex from 'katex';
import {marked, Renderer} from 'marked';
import {buildStrongGreen} from './build-strong-green.mjs';
import {FEEDBACK_CATEGORIES, feedbackIssueUrl} from '../lib/feedback.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
const base=(process.env.SITE_BASE_PATH??'/math-research-atlas').replace(/\/$/,'');
const origin=(process.env.SITE_ORIGIN??'https://dongkaicheng.github.io/math-research-atlas').replace(/\/$/,'');
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
    const target=href.startsWith('/')?url(href):href;
    return `<a href="${esc(target)}"${title?` title="${esc(title)}"`:''}>${text}</a>`;
  };
  return marked.parse(source.replace(/^# [^\n]+\n\s*/,''),{renderer,async:false});
}

function loadPage(title,description,content,p,extraHead='',extraScripts=''){
  const pageTitle=title==='Conjecture Atlas'?'Conjecture Atlas — Open mathematics':title+' | Conjecture Atlas';
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pageTitle)}</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical(p))}">
<link rel="icon" href="${url('/assets/favicon.svg')}" type="image/svg+xml">
<link rel="stylesheet" href="${url('/assets/style.css')}">
<link rel="stylesheet" href="${url('/assets/github-extra.css')}">
<link rel="stylesheet" href="${url('/assets/katex.min.css')}">
${extraHead}
</head><body>
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header"><div class="header-inner">
<a class="brand" href="${url('/')}" aria-label="Conjecture Atlas home"><span>Conjecture Atlas</span></a>
<nav aria-label="Main navigation">
<a href="${url('/foundations/')}">Foundations</a>
<a href="${url('/research/')}">Research</a>
<a href="${url('/feedback/')}">Feedback</a>
<a href="${url('/about/')}">About</a>
</nav>
<div class="header-actions"><a class="search-link" href="${url('/search/')}" aria-label="Search">Search</a></div>
</div></header>
${content}
<footer class="site-footer minimal-footer"><div class="footer-bottom">
<span>Conjecture Atlas · Open mathematical research</span>
<nav aria-label="Footer">
<a href="${url('/about/')}">About</a><a href="${url('/manifesto/')}">Why this site?</a>
<a href="${url('/feedback/')}">Feedback</a><a href="${url('/updates/')}">Updates</a><a href="${url('/maintenance/')}">How the site is maintained</a>
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
<h1>Conjecture Atlas</h1>
<p class="simple-statement">We use AI to bring mathematical knowledge together, share open questions, and build new theories with others.</p>
<nav class="simple-quick-links" aria-label="About and feedback">
<a href="${url('/about/')}"><span>About this site</span>${externalArrow}</a>
<a href="${url('/feedback/')}"><span>Feedback &amp; discussion</span>${externalArrow}</a>
<a href="${url('/manifesto/')}"><span>Why this site?</span>${externalArrow}</a>
</nav></section>
<section class="simple-tracks wrap"><h2>Two kinds of work</h2><div class="simple-track-list">
<a href="${url('/foundations/')}"><div><h3>Foundations</h3><p>Definitions, theorems, and full proofs, with clear links between results.</p></div>${externalArrow}</a>
<a href="${url('/research/')}"><div><h3>Research</h3><p>Conjectures, partial results, and plans for new theories.</p></div>${externalArrow}</a>
</div></section>
<section class="simple-projects wrap" id="projects"><h2>Projects</h2>
<div class="simple-project-list">${bundles.map(card).join('')}</div>
<p class="micro">Each project distinguishes open questions, conditional results, and available proofs. Outline projects are labelled separately from full research editions.</p>
</section></main>`;
await save('/',loadPage('Conjecture Atlas','Open mathematical theory, research programmes, proofs, and collaboration.',featured,'/'));

for(const [route,title,description,group] of [
  ['/foundations/','Foundations','Definitions, theorems, complete proofs, and stable references.',foundations],
  ['/research/','Research','Open conjectures, partial results, and plans for new mathematical theories.',projects],
]){
  const content=`<main id="main-content" class="wrap index-page simple-track-index">${breadcrumbs([[title]])}
  ${heading('CONJECTURE ATLAS',title,description)}
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
  <div class="document-meta"><span>${esc(p.authors.join(' · '))}</span><span class="outline-badge">Version ${bundle.revision}${bundle.revision===0?' · Outline':''}</span></div>
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
  await save(route,loadPage(p.title,p.summary,content,route,'',legacyRedirect));
  for(const snapshot of histories.get(p.id)){
    const versionRoute='/projects/'+p.id+'/versions/'+snapshot.revision+'/';
    const old=snapshot.project;
    const oldEntries=snapshot.entries.map(e=>`<li class="entry-row"><strong>${esc(e.id)} · ${esc(e.kind)} · ${esc(e.status)}</strong><h3>${esc(e.title)}</h3><div class="prose-math">${markdown(e.statement)}</div>${e.proof?`<h4>Proof</h4><div class="prose-math">${markdown(e.proof)}</div>`:''}</li>`).join('');
    const oldContent=`<main id="main-content" class="wrap document-page">${breadcrumbs([[category,isFoundation?'/foundations/':'/research/'],[p.title,route],['Version '+snapshot.revision]])}
    <header class="document-header"><p class="eyebrow">ARCHIVED PUBLICATION</p><h1>${esc(old.title)}</h1><p class="document-deck">${esc(old.summary)}</p>
    <p class="document-meta">Version ${snapshot.revision} · ${esc(snapshot.publishedAt)}</p>
    ${alert('Historical version','This is an immutable snapshot; later versions may correct or extend its mathematics.')}
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
${heading('ABOUT THIS SITE','Math is better when we share it.','Conjecture Atlas is a place to read, check, and build mathematics in the open.')}
<section class="simple-about-section"><h2>Two kinds of projects</h2>
<div class="simple-track-list"><a href="${url('/foundations/')}"><div><h3>Foundations</h3><p>Definitions, theorems, and complete proofs.</p></div>${externalArrow}</a>
<a href="${url('/research/')}"><div><h3>Research</h3><p>Open questions, partial results, and plans for new theories.</p></div>${externalArrow}</a></div></section>
<section class="simple-about-section"><h2>How we work</h2><p>We use AI to read, organize, and check mathematics. Exact versions and the history of changes remain available. We also aim to use Lean for formal verification.</p><a class="text-link" href="${url('/manifesto/')}">Read more about our goals ${externalArrow}</a></section>
<section class="simple-about-section"><h2>Feedback and editing</h2><p>All projects share one GitHub Issues feedback board. General comments do not need a theorem ID. Mathematical revisions are reviewed separately and published with an edition history.</p><a class="button button-dark" href="${url('/feedback/')}">Read and share feedback ${externalArrow}</a> <a class="text-link" href="${url('/maintenance/')}">Publication and maintenance</a></section>
</main>`;
await save('/about/',loadPage('About this site','About the open mathematical atlas and how to contribute.',about,'/about/'));

const guideSource=await readFile(path.join(root,'content','guide.md'),'utf8');
const guide=`<main id="main-content" class="wrap index-page discussion-page discussion-guide">
${breadcrumbs([['Feedback','/feedback/'],['How feedback works']])}
${heading('CONTRIBUTE','How feedback works','Read, question, correct, and build on mathematical work together.')}
<div class="prose-math">${guideMarkdown(guideSource)}</div>
<p><a class="button button-dark" href="${url('/feedback/')}">View feedback</a> <a class="button button-outline" href="${gh}/issues/new/choose">Send feedback on GitHub</a></p>
</main>`;
await save('/feedback/guide/',loadPage('How feedback works','How to post public feedback, upload a LaTeX or Lean ZIP, and follow a GitHub discussion.',guide,'/feedback/guide/'));

const categories=CATEGORIES.map(([id,label])=>`<a data-feedback-kind="${esc(id)}" href="${githubIssueUrl(id)}">${esc(label)} ${externalArrow}</a>`).join('');
const filters=CATEGORIES.map(([id,label])=>`<button type="button" data-category="${esc(id)}">${esc(label)}</button>`).join('');
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
<p>Corrections and proofs do not automatically change a published mathematical claim. The owner reviews proposed changes separately.</p>
</section>
</main>`;
await save('/feedback/',loadPage('Feedback & discussion','Open GitHub-based mathematical feedback with comments, categories, and LaTeX attachments.',feedback,'/feedback/','',
  `<script>window.ATLAS_GITHUB_REPOSITORY=${JSON.stringify(repository)};window.ATLAS_FEEDBACK_PROJECTS=${JSON.stringify(bundles.map(b=>({id:b.project.id,title:b.project.title}))).replace(/</g,'\\u003c')};</script><script type="module" src="${url('/assets/feedback.js')}"></script>`));

const maintenanceSource=await readFile(path.join(root,'docs','MAINTENANCE.md'),'utf8');
await save('/maintenance/',loadPage('Publication and maintenance','How feedback, review, revisions, frozen editions, and corrections are maintained.',`<main id="main-content" class="wrap index-page discussion-page discussion-guide">${breadcrumbs([['Publication and maintenance']])}${heading('CONJECTURE ATLAS','Publication and maintenance','One feedback board, reviewed changes, and permanent publication history.')}<div class="prose-math">${guideMarkdown(maintenanceSource)}</div></main>`,'/maintenance/'));

const updates=`<main id="main-content" class="wrap index-page simple-track-index">
${breadcrumbs([['Updates']])}
${heading('CONJECTURE ATLAS','Updates','Changes to published projects. Old versions remain available.')}
<div class="simple-project-list">${bundles.filter(x=>x.revision>0).map(x=>`<a href="${url('/projects/'+x.project.id+'/')}"><div><span class="micro">${x.edition?'Edition '+esc(x.edition):'Version '+x.revision} · ${esc(x.publishedAt.slice(0,10))}</span><h3>${esc(x.project.title)}</h3><p>${esc(x.changeSummary)}</p></div></a>`).join('')||'<p class="simple-track-empty">No updates yet.</p>'}</div>
<p class="discussion-note">Every publication also has a Git commit and change history in <a href="${gh}/commits/main">GitHub</a>.</p>
</main>`;
await save('/updates/',loadPage('Updates','Public revision history for mathematical projects.',updates,'/updates/'));

const search=`<main id="main-content" class="wrap index-page search-page simple-search-page">
${breadcrumbs([['Search']])}${heading('CONJECTURE ATLAS','Search','Find a project, theorem, or topic.')}
<form class="large-search" id="site-search"><label class="sr-only" for="atlas-search">Search published math</label>
<input id="atlas-search" type="search" name="q" placeholder="Enter a topic or result ID" maxlength="200" aria-label="Search published mathematics">
<button type="submit">Search</button></form>
<section class="search-results" id="search-results" aria-live="polite"></section>
</main>`;
await save('/search/',loadPage('Search','Search public project outlines, results, and mathematical topics.',search,'/search/','',
  `<script defer src="${url('/assets/search.js')}"></script>`));

await cp(path.join(root,'public'),output,{recursive:true});
const strongGreen=await buildStrongGreen({root,output,base,origin,repository});
const searchIndex=[...bundles.map(b=>({title:b.project.title,summary:b.project.summary,keywords:b.project.keywords,link:url('/projects/'+b.project.id+'/'),category:b.project.category,body:[b.project.motivation,b.project.programme].join(' ')})),
  ...entries.map(({entry:e,project:p})=>({title:e.title,summary:e.summary,keywords:p.keywords,link:url('/r/'+e.id+'/'),category:e.kind,body:[e.statement,e.proof,e.motivation].filter(Boolean).join(' ')})),...strongGreen.searchIndex];
await writeFile(path.join(output,'search-index.json'),JSON.stringify(searchIndex));
await cp(path.join(root,'assets'),path.join(output,'assets'),{recursive:true});
await cp(path.join(root,'lib','feedback.mjs'),path.join(output,'assets','feedback-core.mjs'));
const katexCss=path.join(root,'node_modules','katex','dist','katex.min.css');
await cp(katexCss,path.join(output,'assets','katex.min.css'));
await cp(path.join(root,'node_modules','katex','dist','fonts'),path.join(output,'assets','fonts'),{recursive:true});
await writeFile(path.join(output,'.nojekyll'),'');

const routes=['/','/about/','/manifesto/','/foundations/','/research/','/feedback/','/feedback/guide/','/updates/','/search/','/maintenance/',...strongGreen.routes,
 ...bundles.map(b=>'/projects/'+b.project.id+'/'),...entries.map(x=>'/r/'+x.entry.id+'/'),
 ...bundles.flatMap(b=>histories.get(b.project.id).map(s=>'/projects/'+b.project.id+'/versions/'+s.revision+'/'))];
const xml=s=>esc(s).replace(/'/g,'&apos;');
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
 [...new Set(routes.filter(p=>p!=='/search/'&&(!strongGreen.routes.includes(p)||strongGreen.indexableRoutes.includes(p))))].map(p=>`<url><loc>${xml(canonical(p))}</loc></url>`).join('\n')+'\n</urlset>\n';
await writeFile(path.join(output,'sitemap.xml'),sitemap);
await writeFile(path.join(output,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${canonical('/sitemap.xml')}\n`);
const updateItems=bundles.filter(b=>b.revision>0).map(b=>`<item><title>${xml(b.project.title)}</title><link>${xml(canonical('/projects/'+b.project.id+'/'))}</link><description>${xml(b.changeSummary)}</description><pubDate>${new Date(b.publishedAt).toUTCString()}</pubDate></item>`).join('');
await writeFile(path.join(output,'feed.xml'),`<?xml version="1.0"?><rss version="2.0"><channel><title>Conjecture Atlas updates</title><link>${xml(canonical('/'))}</link><description>Changes to published mathematical research</description>${updateItems}</channel></rss>`);
await writeFile(path.join(output,'404.html'),loadPage('Page not found','This page could not be found.',`<main id="main-content" class="wrap index-page">${heading('NOT FOUND','Page not found','The link may be outdated.')}<p><a class="button button-dark" href="${url('/')}">Return to the atlas</a></p></main>`,'/404.html'));
process.stdout.write(`Built ${new Set(routes).size} page routes, ${bundles.length} projects and ${entries.length+strongGreen.recordCount} permanent entries into dist/.\n`);
