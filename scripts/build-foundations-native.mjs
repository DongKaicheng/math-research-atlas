import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import katex from 'katex';
import {linkProofParagraphs, manuscriptDiagram, proofAnchor, sourcePolicyNotice} from './build-foundations-web.mjs';

const project = '/projects/foundations/';
export const nativeReaderRoute = project + 'reader/';
const contentsRoute = project + 'contents/';
const proofTagsRoute = project + 'proof-tags/';
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const link = (href, title) => `<a href="${escape(href)}">${escape(title)}</a>`;
const tagRoute = id => `/r/${id}/`;
const heading = (number, title) => [number, title].filter(Boolean).join(' · ');
const unsafeMarkup = /<(?:script|iframe|object|embed|style|form)\b|<[^>]*\son[a-z]+\s*=|(?:href|src)="(?:javascript|data):/i;
const privateMaterial = /(?:\/workspace\/|\/home\/agent\/|[A-Z]:\\Users\\|libfile_|private_library_readback|BEGIN [A-Z ]*PRIVATE KEY)/i;
const tagId = /^NAG-\d{6}$/;
const entities = {amp:'&',lt:'<',gt:'>',quot:'"','#x27':"'",'#39':"'"};
const proofStyles = '<link rel="stylesheet" href="/assets/katex.min.css"><link rel="stylesheet" href="/assets/foundations-web.css">';

function typesetTag(html) {
  return html.replace(/<span class="katex"><math([^>]*)>[\s\S]*?<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation><\/semantics><\/math><\/span>/g,
    (_,attrs,source) => katex.renderToString(source.replace(/&(amp|lt|gt|quot|#x27|#39);/g, (all,key)=>entities[key]),
      {output:'htmlAndMathml', displayMode:attrs.includes('display="block"'),strict:'ignore',trust:false}));
}

export async function loadFoundationsNative(directory, pdfDigest) {
  const load = async name => JSON.parse(gunzipSync(await readFile(path.join(directory, name + '.json.gz'))));
  const index = await load('index');
  if (index.sourcePdfSha256 !== pdfDigest) throw Error('Foundations HTML edition source mismatch');
  const chapters = new Map();
  for (const entry of index.catalogue) {
    if (!/^\d{3}$/.test(entry.key) || !/^\/projects\/foundations\/(chapters|reader)\/[a-z0-9-]+\/$/.test(entry.route) || chapters.has(entry.route)) {
      throw Error('Invalid Foundations reading route');
    }
    const chapter = await load(entry.key);
    if (chapter.route !== entry.route || chapter.title !== entry.title || !Array.isArray(chapter.proofs) || chapter.blocks.some(block =>
      unsafeMarkup.test(block) || privateMaterial.test(block))) throw Error('Invalid Foundations chapter ' + entry.key);
    let previous = -1;
    for (const proof of chapter.proofs) {
      if (!Number.isInteger(proof.index) || !Number.isInteger(proof.end) || proof.index <= previous || proof.end < proof.index ||
        !chapter.blocks[proof.index] || proof.end >= chapter.blocks.length) throw Error('Invalid Foundations proof range ' + entry.key);
      previous=proof.end;
    }
    chapters.set(entry.route, chapter);
  }
  const byKey = new Map([...chapters.values()].map(chapter => [chapter.key, chapter]));
  if (Object.keys(index.tags).length !== 1159) throw Error('Incomplete Foundations HTML location inventory');
  for (const [id, record] of Object.entries(index.tags)) {
    const chapter = byKey.get(record.key);
    if (!tagId.test(id) || !chapter || !record.href.startsWith(chapter.route + '#') ||
      !chapter.blocks.some(block => block.includes(`id="${record.href.split('#')[1]}"`)) ||
      [record.index, record.excerpt, record.proof].some(i => i != null && !chapter.blocks[i]) ||
      (record.proof != null && !chapter.proofs.some(proof=>proof.index===record.proof && proof.end===record.proofEnd))) {
      throw Error('Invalid Foundations HTML Tag ' + id);
    }
  }
  return {...index, chapters, byKey};
}

function shell(route, title, body, extra = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)} · OpenMath Foundations</title><link rel="canonical" href="${route}">
  <link rel="stylesheet" href="/assets/foundations-native.css">${extra}</head><body>
  <a class="skip" href="#main">Skip to content</a><header class="site-header"><nav aria-label="Foundations">
  ${link(project, 'OpenMath Foundations')}${link(contentsRoute, 'Table of contents')}
  ${link('/search/?project=foundations', 'Find a Tag')}
  </nav></header><main id="main">${body}</main></body></html>`;
}

function crumb(links) {
  return '<nav class="book-crumb" aria-label="Breadcrumb"><ol>' + links.map(([route,title]) =>
    '<li>' + (route ? link(route,title) : '<span aria-current="page">'+escape(title)+'</span>') + '</li>').join('') + '</ol></nav>';
}

function bookContents(native, fixed, route) {
  const seen = new Set();
  let groups = [{title:'Front matter', items:[]}];
  for (const entry of native.catalogue) {
    if (entry.route.endsWith('/reader/title/')) continue;
    if (entry.route.includes('/part-')) {
      groups.push({title:entry.title, items:[], note:entry.route});
      continue;
    }
    if (entry.number === 'A') groups.push({title:'Appendices', items:[]});
    if (seen.has(entry.route)) throw Error('Repeated Foundations reading route');
    seen.add(entry.route);
    groups.at(-1).items.push(entry);
  }
  const body = groups.map(({title,items,note}, i) => `<section aria-labelledby="part-${i}" id="group-${i}">
    <h2 id="part-${i}">${escape(title)}</h2>${note ? `<p class="book-note">${link(note,'Part introduction')}</p>` : ''}
    <ul class="book-chapters">${items.map(entry => `<li>${link(entry.route,heading(entry.number,entry.title))}
      ${entry.sections.length ? `<details><summary>Sections (${entry.sections.length})</summary><ul>${entry.sections.map(section =>
        `<li>${link(entry.route+'#'+section.id,heading(section.number,section.title))}</li>`).join('')}</ul></details>` : ''}</li>`).join('')}</ul></section>`).join('');
  const trail = crumb([[project,'Foundations'],[null,'Table of contents']]);
  const archive = `<p class="book-note">${link(project+'coverage/','Coverage register')} · ${link(fixed,'Fixed edition and PDF')}</p>`;
  const jumps = `<nav class="book-jumps" aria-label="Parts">${groups.map(({title},i)=>link('#group-'+i,title)).join('')}
    ${link('/projects/foundations/chapters/appendix-a/#bibliography','Bibliography')}
    ${link('/projects/foundations/chapters/appendix-a/#subject-index','Subject index')}</nav>`;
  const script = route === nativeReaderRoute ? '<script type="module" src="/assets/foundations-native-reader.js"></script>' : '';
  return shell(route,'Table of contents',`${trail}<h1>Table of contents</h1>
    <p>Read Non-Archimedean Geometry Foundations by chapter and section. Permanent NAG Tags in the text open individual statements, proofs and dependency diagrams.</p>
    <p id="reader-location" hidden></p>${archive}${jumps}${body}`,script);
}

function chapterPage(chapter, catalogue, proofs, dependencies) {
  const title = heading(chapter.number, chapter.title);
  const index = catalogue.findIndex(entry => entry.key===chapter.key);
  const nav = `<nav class="book-adjacent" aria-label="Chapter navigation">${[-1,1].map(offset => {
    const entry = catalogue[index+offset];
    return entry ? link(entry.route, `${offset<0 ? '← ' : ''}${heading(entry.number,entry.title)}${offset>0 ? ' →' : ''}`) : '';
  }).join('')}</nav>`;
  const trail = crumb([[project,'Foundations'],[contentsRoute,'Table of contents'],[null,title]]);
  const sections = chapter.sections.filter(section => section.level===2);
  const menu = sections.length ? `<nav class="book-sidebar" aria-label="On this page"><details open><summary>On this page</summary><ul>${sections.map(section =>
    `<li>${link('#'+section.id,heading(section.number,section.title))}</li>`).join('')}</ul></details></nav>` : '';
  const indexEntries = [...proofs.values()].map(proof=>`<li>${link('#'+proof.anchor,proof.title)} ${proof.tagLinks}</li>`).join('');
  const proofIndex = indexEntries ? `<details class="chapter-proof-index" id="chapter-proofs"><summary>Proofs in this chapter (${proofs.size})</summary><ol>${indexEntries}</ol></details>` : '<span id="chapter-proofs"></span>';
  const body = chapter.blocks.map((block,i)=> {
    const proof=proofs.get(i);
    const result=dependencies.resultByBlock.get(`${chapter.key}:${i}`);
    const policy=dependencies.policyByBlock.get(`${chapter.key}:${i}`);
    const proofPolicy=proof && dependencies.byProof.get(`${chapter.key}:${i}`)?.policy;
    const locator=policy?.anchor.split('#')[1];
    const notice=policy ? `<div id="${escape(locator)}">${sourcePolicyNotice(policy)}</div>` : '';
    const resultLink=result ? `<p class="book-result-link">${link(result.route,result.id+' · Result')}</p>` : '';
    const proofLink=proof ? `<div class="chapter-proof-links" id="${proof.anchor}" role="group" aria-label="Tag links for this proof">${proof.tagLinks}
      ${proofPolicy ? link(proofPolicy.anchor,'Proof assumptions and status') : ''}</div>` : '';
    return notice+resultLink+proofLink+(locator ? block.replace(` id="${locator}"`,'') : block);
  }).join('');
  return shell(chapter.route,title,`${trail}<h1>${escape(title)}</h1>${nav}${proofIndex}
    <div class="book-layout${menu ? ' has-sidebar' : ''}">${menu}<article class="book-text" aria-label="${escape(chapter.title)}">${body}</article></div>${nav}`,
    '<link rel="stylesheet" href="/assets/foundations-web.css">');
}

function tagPage(row, record, chapter, fixed, graph, backlinks, scopes, archivedProof, diagram, proofLocation, policy) {
  const title = row.title;
  const status = policy ? (policy.status==='external-assumption' ? 'Conditional argument' : 'Open proof obligation') :
    'Edition status · '+(record?.proof != null ? row.coverage.replace(' · HTML export unavailable','') : row.coverage);
  const trail = crumb([[project,'Foundations'],[contentsRoute,'Table of contents'],
    ...(chapter ? [[chapter.route,heading(chapter.number,chapter.title)]] : []),
    ...(record?.section && record.section!=='*' ? [[chapter.route+'#'+record.sectionId,record.section]] : []),[null,row.id]]);
  const archive = fixed+'r/'+row.id+'/';
  const location = record ? link(record.href,'Read in chapter') : link(project+'coverage/','Coverage register');
  let text;
  if (record?.index != null) {
    // The statement and adjacent proof come from the same English source block as the chapter.
    // Remove their self-links because this page is already the Tag permalink.
    text = chapter.blocks[record.index].replaceAll(`<a href="${row.link}">${row.id}</a>`, '');
    if (record.inlineProof) text = linkProofParagraphs(text);
    else if (record.proof !== null) text += linkProofParagraphs(chapter.blocks.slice(record.proof,record.proofEnd+1).join(''));
    else if (record.kind !== 'definition') text += `<p class="book-note">${link(record.href,'Read the surrounding argument in the chapter')}.</p>`;
    if (record.companion) text += `<p class="book-note">${link(record.companion,'Read the companion argument')}</p>`;
  } else {
    text = record?.excerpt != null ? chapter.blocks[record.excerpt] : '';
    text += `<p>${record ? 'This Tag identifies a passage in the book.' : 'This Tag is maintained in the coverage register.'} ${location}.</p>`;
  }
  const gap = graph.gaps[row.id];
  const gapNote = gap && !/\p{Script=Han}/u.test(gap.step) ? `<section class="tag-gap-note"><h2>Historical proof gap</h2><p>${escape(gap.step)}</p></section>` : '';
  const citedBy = backlinks?.length ? `<details class="tag-uses"><summary>Used by ${backlinks.length} ${backlinks.length === 1 ? 'Tag' : 'Tags'}</summary><ul>
    ${backlinks.map(id=>`<li>${link(tagRoute(id),[id,graph.nodes[id]?.label].filter(Boolean).join(' · '))}</li>`).join('')}</ul></details>` : '';
  const selected = scopes?.length ? `<section><h2>Selected scopes</h2><ul>${scopes.map(scope=> {
    const fragment=scope.href.split('#')[1];
    const target=graph.arguments[scope.key] ? '#'+proofAnchor(scope.key) : archive+'#'+fragment;
    return `<li id="${escape(fragment)}">${link(target,scope.label)}</li>`;
  }).join('')}</ul></section>` : '';
  const sourceProof = archivedProof && record?.proof == null ? `<p class="book-note" id="foundations-exact-proof">${link(archive+'#foundations-exact-proof','Selected proof in the fixed edition')}</p>` : '';
  return shell(row.link,row.id+' · '+title,`${trail}<p class="tag-permalink">Tag ${escape(row.id)}</p><h1>${escape(title)}</h1>
    <p class="tag-status">${escape(status)}</p><nav class="tag-actions" aria-label="Tag links">${location}
    ${proofLocation ? link(proofLocation,'Proof in chapter') : ''}${link('#proof-dependencies','Proof diagram')}${link('#citation','Citation')}</nav>
    <article class="book-text tag-text"${record?.proof != null ? ' id="foundations-exact-proof"' : ''}>${sourcePolicyNotice(policy)}${typesetTag(text)}</article>
    ${sourceProof}${gapNote}${diagram}${selected}${citedBy}
    <section id="citation" class="tag-citation"><h2>Citation</h2><p>Non-Archimedean Geometry Foundations, Tag ${escape(row.id)}${record?.number ? ', '+escape(record.number) : ''}.</p>
    <p>${link(row.link,'Permanent link')} · ${link(row.link+'logic/','Standalone proof diagram')} · ${link(archive,'Fixed-edition record')}</p></section>`,proofStyles);
}

function bindProofs(native, chapter, linkedTags) {
  const proofs = new Map();
  for (const range of chapter.proofs) {
    const tags=linkedTags.get(range.index) ?? [];
    const key=createHash('sha256').update([native.sourcePdfSha256,chapter.route,range.index].join('\n')).digest('hex').slice(0,12);
    const anchor='manuscript-proof-'+key;
    const section=chapter.sections.findLast(item=>item.index<=range.index && item.title!=='*' && !/^Proof(?: of .+)?[.:]$/i.test(item.title));
    const title=tags[0]?.title ?? (range.title && range.title!=='Proof.' ? range.title.replace(/\.$/,'') : 'Proof in '+(section?.title ?? chapter.title));
    const tag='P-'+key.toUpperCase();
    const route=proofTagsRoute+tag.toLowerCase()+'/';
    const tagLinks=tags.length ? tags.map(row=>`${link(row.link+'#foundations-exact-proof',row.id)} ${link(row.link+'#proof-dependencies','Proof diagram')}`).join(' ') : link(route,tag+' · Proof Tag');
    proofs.set(range.index,{...range,tag,route,href:chapter.route+'#'+anchor,anchor,title,tagLinks,tags,section});
  }
  return proofs;
}

function manuscriptTagPage(proof, chapter, review) {
  const text = linkProofParagraphs(chapter.blocks.slice(proof.index,proof.end+1).join(''));
  const trail = crumb([[project,'Foundations'],[contentsRoute,'Table of contents'],[chapter.route,heading(chapter.number,chapter.title)],[null,proof.tag]]);
  return shell(proof.route,proof.tag+' · '+proof.title,`${trail}<p class="tag-permalink">Proof Tag ${proof.tag}</p><h1>${escape(proof.title)}</h1>
    <nav class="tag-actions" aria-label="Proof Tag links">${link(proof.href,'Read in chapter')}${link('#proof-dependencies','Proof diagram')}
      ${proof.tags.map(row=>link(row.link,'Result '+row.id)).join('')}</nav>
    ${sourcePolicyNotice(review?.policy)}<article class="book-text tag-text">${typesetTag(text)}</article>${manuscriptDiagram(proof,review)}`,proofStyles);
}

function manuscriptResultPage(result, dependencies) {
  const {chapter,index,proof}=result;
  const trail=crumb([[project,'Foundations'],[contentsRoute,'Table of contents'],[chapter.route,heading(chapter.number,chapter.title)],[null,result.id]]);
  const state=dependencies.policyByBlock.get(`${chapter.key}:${index}`);
  const body=chapter.blocks[index]+(proof ? linkProofParagraphs(chapter.blocks.slice(proof.index,proof.end+1).join('')) : '');
  const graph=proof ? manuscriptDiagram({route:result.route,href:result.book},dependencies.byProof.get(`${chapter.key}:${proof.index}`)) : '';
  return shell(result.route,result.id+' · '+result.title,`${trail}<p class="tag-permalink">Result ${escape(result.id)}</p>
    <h1>${escape(result.title)}</h1><nav class="tag-actions" aria-label="Result links">${link(result.book,'Read in chapter')}
      ${proof ? link('#proof-dependencies','Proof diagram') : ''}</nav>
    ${sourcePolicyNotice(state)}<article class="book-text tag-text">${typesetTag(body)}</article>${graph}`,proofStyles);
}

export function createFoundationsNative(release, diagrams, dependencies) {
  const native = release.native;
  const fixed = project + 'editions/' + release.current.edition + '/';
  const pages = new Map([[nativeReaderRoute,bookContents(native,fixed,nativeReaderRoute)],
    [contentsRoute,bookContents(native,fixed,contentsRoute)]]);
  const predecessors = new Map();
  const scopes = new Map();
  for (const [key,node] of Object.entries(release.graph.nodes)) {
    if (node.href.includes('#') && node.href.startsWith(tagRoute(node.id))) {
      if (!scopes.has(node.id)) scopes.set(node.id,[]);
      scopes.get(node.id).push({...node,key});
    }
    for (const input of release.graph.arguments[key]?.inputs ?? []) {
      const used = release.graph.nodes[input.key].id;
      if (used === node.id || !release.graph.nodes[node.id]) continue;
      if (!predecessors.has(used)) predecessors.set(used,new Set());
      predecessors.get(used).add(node.id);
    }
  }
  const linkedProofs = new Map();
  for(const record of dependencies.byProof.values())for(const edge of record.confirmed) {
    if(!tagId.test(edge.node.id ?? ''))continue;
    if(!predecessors.has(edge.node.id))predecessors.set(edge.node.id,new Set());
    for(const id of record.owners)if(id!==edge.node.id)predecessors.get(edge.node.id).add(id);
  }
  for (const row of release.rows) {
    const record=native.tags[row.id];
    if (record?.proof == null) continue;
    if (!linkedProofs.has(record.key)) linkedProofs.set(record.key,new Map());
    const links=linkedProofs.get(record.key);
    if (!links.has(record.proof)) links.set(record.proof,[]);
    links.get(record.proof).push(row);
  }
  const locations = new Map();
  const priorProofTags=new Set(release.dependencyReview.bindings.filter(binding=>!binding.inline).map(binding=>binding.proof));
  for (const chapter of native.chapters.values()) {
    const proofs=bindProofs(native,chapter,linkedProofs.get(chapter.key) ?? new Map());
    pages.set(chapter.route,chapterPage(chapter,native.catalogue,proofs,dependencies));
    for (const proof of proofs.values()) {
      if (proof.tags.length) {
        for (const tag of proof.tags) locations.set(tag.id,proof.href);
      }
      const key=`${chapter.key}:${proof.index}`;
      if(!proof.tags.length || priorProofTags.has(key))pages.set(proof.route,manuscriptTagPage(proof,chapter,dependencies.byProof.get(key)));
    }
  }
  for(const result of dependencies.results.values())pages.set(result.route,manuscriptResultPage(result,dependencies));
  for (const row of release.rows) {
    const record = native.tags[row.id];
    const archivedProof = release.contents.get(row.link.slice(1)+'index.html').includes('id="foundations-exact-proof"');
    pages.set(row.link,tagPage(row,record,native.byKey.get(record?.key),fixed,release.graph,
      [...(predecessors.get(row.id) ?? [])].sort(),scopes.get(row.id),archivedProof,diagrams.get(row.id),locations.get(row.id),
      dependencies.byId.get(row.id)?.policy ?? dependencies.policyByBlock.get(`${record?.key}:${record?.index}`)));
  }
  return {pages,tags:native.tags};
}
