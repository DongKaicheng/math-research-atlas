import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import katex from 'katex';
import {contentsRoute, coverageRoute, escape, foundationsFeedback, foundationsPdfLink, foundationsShell, link, project} from './foundations-layout.mjs';
import {readingText} from './build-foundations-dependencies.mjs';
import {currentFoundationsLogicPages} from './build-foundations-logic.mjs';
import {closureGroup, coverageGroups, statusLabels, tagRoute} from './foundations-tag-register.mjs';

const edition = 'sealed-1174';
const fixed = project + 'editions/' + edition + '/';
const oldFixed = project + 'editions/sealed-1097/';
const readerPath = fixed + 'reader-en.pdf';
const idPattern = /^NAG-\d{6}$/;
const chapterRoute = slug => project+'chapters/'+slug+'/';
const resultAnchor = id => 'result-'+id;
const proofAnchor = id => resultAnchor(id)+'-proof';
const labels = {
  proof_comparison_refuted_unrestricted_theorem_open:'Analytically separable case proved; remaining extensions open',
  unrestricted_atlas_refuted_in_project_category:'Finite-incidence and supplied-atlas results',
  unrestricted_generic_existence_obstruction:'Formal blowup and comparison on supplied atlases',
  uniformly_bounded_annulus_refuted:'Residual order for integral coefficients',
  empty_face_refuted:'Generization along nonempty faces',
};
const titles = {
  'NAG-002500':'Factorization of the facet normal functional',
  'NAG-002567':'Conditional local weak Poincaré–Lelong',
  'NAG-002675':'Reduction to a scalar Poincaré–Lelong identity on an S₁ space',
  'NAG-002981':'Conditional reduction beyond S₁',
  'NAG-002012':'An étale-domain factorization in rank zero',
  'NAG-003103':'Fixed-test identities for regular meromorphic functions',
  'NAG-003106':'Closed-immersion pullback and transfer to currents',
};
const titleOf = record => titles[record.id] ?? record.title.replace(/; F[0-9][A-Z0-9-]+$/, '');
const disposition = record => record.erratum ? labels[record.disposition] : statusLabels.closed;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const privateMaterial = /\/workspace\/|\/home\/agent\/|libfile_|Sentinel_|private_library_readback|BEGIN [A-Z ]*PRIVATE KEY/i;

function requireFact(condition, detail) {
  if (!condition) throw Error('Foundations 1174: ' + detail);
}

export async function loadFoundationsUpdate(directory, pointer, previous) {
  requireFact(pointer.edition === edition && pointer.revision === 2 && pointer.project === 'foundations' &&
    pointer.schemaVersion === 1 && /^\d{4}-\d{2}-\d{2}$/.test(pointer.releaseDate) &&
    typeof pointer.changeSummary === 'string' && !privateMaterial.test(pointer.changeSummary), 'invalid current pointer');
  const release = path.join(directory,'releases',edition);
  const [dataBytes,pdf] = await Promise.all(['data.json','reader-en.pdf'].map(name=>readFile(path.join(release,name))));
  requireFact(digest(dataBytes) === pointer.editionManifestSha256 && !privateMaterial.test(dataBytes.toString()), 'edition data integrity or privacy check failed');
  const data = JSON.parse(dataBytes);
  requireFact(data.edition === pointer.edition && data.revision === pointer.revision && data.project === pointer.project, 'edition identity mismatch');
  requireFact(pdf.subarray(0,5).toString() === '%PDF-' && digest(pdf) === data.reader.sha256 &&
    data.reader.sha256 === 'c8ea494eb514aff4af81fa5de449af04d5f78247c4c7e6f6a04682fc54bf46d5' && data.reader.pages === 2279, 'reader PDF mismatch');
  const oldWhole = new Set(previous.rows.filter(row=>row.coverage.startsWith('Accepted whole')).map(row=>row.id));
  const selected = new Set(data.selected);
  const additions = data.selected.filter(id=>!oldWhole.has(id));
  requireFact(data.selected.every(id=>idPattern.test(id)) && selected.size===1174 && selected.size===data.selected.length &&
    [...oldWhole].every(id=>selected.has(id)) && additions.length===77 && data.counts.whole===selected.size &&
    data.counts.standaloneClauses===21 && data.counts.priorityAccepted===966 && data.counts.priorityTotal===971 &&
    data.counts.exceptionalAccepted===68 && data.counts.exceptionalTotal===68, 'accepted inventory mismatch');
  requireFact(additions.every(id=>data.records[id]?.status==='closed' && data.records[id].proof && data.records[id].statement),
    'new accepted result without exact output');
  requireFact(data.counts.pendingOriginals.length===5 &&
    data.counts.pendingOriginals.every(id=>!selected.has(id) && data.records[id]?.status==='partial'), 'original scope mismatch');
  const checkReader = entry => requireFact(entry && typeof entry.destination==='string' && entry.destination.length &&
    Number.isInteger(entry.page) && entry.page>0 && entry.page<=data.reader.pages, 'invalid printed destination');
  for (const [id,entry] of Object.entries(data.records)) {
    requireFact(id===entry.id && idPattern.test(id) && previous.graph.chapters[entry.chapter] &&
      (entry.status==='closed' ? selected.has(id) : entry.status==='partial' && !selected.has(id)), 'invalid record '+id);
    checkReader(entry.reader);
    if (entry.historical) checkReader(entry.historical);
    for (const reader of entry.narrowReaders ?? []) checkReader(reader);
  }
  for (const entry of Object.values(data.scopeRecords)) if (entry.reader) checkReader(entry.reader);
  for (const reader of [...Object.values(data.inheritedReaders),...Object.values(data.chapterReaders)]) checkReader(reader);
  checkDependencyCycles(data,previous.graph);
  for (const record of Object.values(data.records)) {
    if (record.proof) record.proof = proofWithScopedLinks(record,data);
  }
  return {current:pointer, data, pdf, additions:new Set(additions), fixed, readerPath};
}

function checkDependencyCycles(data,previous) {
  const exact = new Map(Object.entries(previous.arguments).map(([id,record])=>[id,record.inputs.map(entry=>entry.key)]));
  for (const [key,record] of Object.entries({...data.records,...data.scopeRecords})) {
    if (record.status==='closed' || (!record.status && record.requires.length)) exact.set(key,record.requires);
  }
  const pending = new Set(data.counts.pendingOriginals);
  for (const record of [...Object.values(data.records),...Object.values(data.scopeRecords)]) {
    requireFact(record.requires.every(key=>!pending.has(key)), 'a rejected whole was used as an operative input');
  }
  const pendingVisit = new Set();
  const visited = new Set();
  function visit(key) {
    if (!exact.has(key) || visited.has(key)) return;
    requireFact(!pendingVisit.has(key), 'cycle at '+key);
    pendingVisit.add(key);
    for (const target of exact.get(key)) visit(target);
    pendingVisit.delete(key);
    visited.add(key);
  }
  for (const key of exact.keys()) visit(key);
  requireFact(visited.size===data.verifiedGraphNodes,'dependency inventory drift');
}

export const printed = (reader, label) => link(readerPath+'#nameddest='+encodeURIComponent(reader.destination),
  label ?? 'Read in the English PDF (p. '+reader.page+')');
const scopeAnchor = key => 'scope-'+encodeURIComponent(key).replaceAll('%','_');
const facetNormal = {destination:'equation.I.2.48',page:2180};
const pdfDestination = reader => readerPath+'#nameddest='+encodeURIComponent(reader.destination);

function selectedScopeHref(key, scope) {
  if (scope.reader || scope.proof) return tagRoute(scope.id)+'#'+scopeAnchor(key);
  return scope.archived ? oldFixed+scope.archived.slice(1) : '';
}

function proofWithScopedLinks(record, data) {
  let html=record.proof.html;
  const scopes = record.requires.map(key=>[key,data.scopeRecords[key]]).filter(([,scope])=>scope);
  for (const [key,scope] of scopes) {
    const historical=data.records[scope.id]?.historical;
    if (!historical || scopes.filter(([,item])=>item.id===scope.id).length!==1) continue;
    const target=selectedScopeHref(key,scope);
    if (target) html=html.replaceAll('href="'+pdfDestination(historical)+'"','href="'+target+'"');
  }
  return {...record.proof,html};
}

function inputs(record, data) {
  const selected = new Set(data.selected);
  const refs = record.requires.map(key => {
    const scope = data.scopeRecords[key];
    const target=scope ? selectedScopeHref(key,scope) : '';
    if (target) {
      return link(target,scope.title)+' <small>('+escape(scope.id)+')</small>';
    }
    if (key==='SUPPORT:F7:exact_facet_normal_formula') return printed(facetNormal,'Facet-normal boundary formula');
    if (selected.has(key)) return link(tagRoute(key),key);
    if (/^STACKS[:-][A-Z0-9]{4}$/.test(key) && record.stacks.includes(key.slice(-4))) {
      return link('https://stacks.math.columbia.edu/tag/'+key.slice(-4),'Stacks Project, Tag '+key.slice(-4));
    }
    return escape(key)+' <small>(exact web target unavailable)</small>';
  });
  for (const tag of record.stacks)
    refs.push(link('https://stacks.math.columbia.edu/tag/'+tag,'Stacks Project, Tag '+tag));
  return refs.length ? '<section><h2>Selected proof inputs</h2><ul>'+[...new Set(refs)].map(ref=>'<li>'+ref+'</li>').join('')+'</ul></section>' : '';
}


const macros = Object.fromEntries([
  ['mathbb', ['R','RR','N','Z','ZZ']],
  ['mathcal', ['A','BB','cA','cE','cL','cM','cO','cX','cY','D','E','F','I','OO','PP','T','TT']],
].flatMap(([command,names])=>names.map(name=>['\\'+name,'\\'+command+'{'+name.at(-1)+'}'])));
Object.assign(macros, {
  '\\an':'\\mathrm{an}', '\\dd':"d'd''", '\\DD':"d'd''", '\\B':'\\mathfrak{B}',
  '\\divis':'\\operatorname{div}', '\\length':'\\operatorname{length}', '\\ext':'\\operatorname{ext}_0',
  '\\Int':'\\operatorname{Int}', '\\Min':'\\operatorname{Min}', '\\supp':'\\operatorname{supp}',
  '\\Supp':'\\operatorname{Supp}', '\\relint':'\\operatorname{relint}',
});
const entities = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&#x27;':"'"};

function typesetReaderText(html) {
  return html.replace(/<span\s+class="math (inline|display)">(\$\$[\s\S]*?\$\$|\$[^$]*\$|\\\([\s\S]*?\\\))<\/span>/g,
    (math, layout, formula) => {
      const width = formula.startsWith('$$') || formula.startsWith('\\(') ? 2 : 1;
      const tex=formula.slice(width,-width).replace(/&(?:amp|lt|gt|quot|#39|#x27);/g,entity=>entities[entity])
        .replace(/\\(begin|end)\{split\}/g,'\\$1{aligned}');
      return '<span class="math '+layout+'">'+katex.renderToString(tex,
        {displayMode: layout==='display', output:'htmlAndMathml', macros:{...macros}, strict:'ignore', trust:false})+'</span>';
    });
}

function textSection(title, binding, id) {
  if (!binding) return '';
  return '<section id="'+id+'"'+(id==='foundations-exact-proof' ? ' class="proof"' : '')+'><h2>'+escape(title)+'</h2>'+typesetReaderText(binding.html)+
    '<details'+(binding.html ? '' : ' open')+'><summary>TeX reading text</summary><pre data-source-sha256="'+
    binding.sourceSha256+'">'+escape(binding.tex)+'</pre></details></section>';
}

const narrowProofLabels = {
  'NAG-001761':['Uniform regularity for analytically separable extensions'],
  'NAG-001944':['Principal formal opens','Generic fibre under finite incidence',
    'Specialization traces on a supplied atlas','Faithfulness for supplied compatible arrows'],
  'NAG-001945':['Generic comparison on supplied compatible atlases'],
  'NAG-002072':['Integral coefficients and residual order'],
  'NAG-002213':['Generization along nonempty faces'],
};

function narrowProofs(record) {
  if (!record.erratum) return '';
  const proofs = record.narrowReaders.map((reader,index)=>printed(reader,narrowProofLabels[record.id][index]));
  if (record.id==='NAG-001761') {
    proofs.push(printed({destination:'proposition.2.35.27',page:332},'Strict normalization with the finite Tate normalizer'));
  }
  if (record.formalWindow) {
    const old = oldFixed+tagRoute(record.id).slice(1);
    const fragment = record.id==='NAG-001945' ? 'formal_existence_restriction_product_pullback' : 'formal_topology';
    proofs.unshift(link(old+'#'+fragment,record.id==='NAG-001945'
      ? 'Formal blowup, restriction, products and pullback' : 'Noetherian affine formal topology'));
  }
  return '<ul class="scope-proofs">'+proofs.map(proof=>'<li>'+proof+'</li>').join('')+'</ul>';
}

function oldAnchors(html) {
  return [...new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]))]
    .map(id=>'<span id="'+escape(id)+'"></span>').join('');
}

export function createFoundationsReadingUpdate(update, release, registry) {
  if (!update) return null;
  const replacements=new Map(), superseded=new Map(), additional=new Map(), placements=new Map(), byChapter=new Map();
  const source=release.native;
  for (const record of Object.values(update.data.records).sort((a,b)=>a.reader.page-b.reader.page)) {
    const old=registry.tagLocations[record.id];
    const chapter=source.byKey.get(old?.key);
    const route=chapterRoute(record.chapter);
    const onPage=old?.index!=null && chapter.route===route;
    const location={href:onPage ? old.href : route+'#'+resultAnchor(record.id),
      sourceStatement:onPage ? chapter.blocks[old.index] : null};
    if (record.id==='NAG-000176') {
      const model=onPage ? chapter.blocks[old.index-1] : '';
      requireFact(readingText(model).includes('Its generic fibre is an analytic line bundle'),'model metric context drift');
      location.context=model;
    }
    placements.set(record.id,location);
    if (!byChapter.has(route)) byChapter.set(route,[]);
    byChapter.get(route).push(record);
    if (!onPage) {
      if (!additional.has(route)) additional.set(route,[]);
      additional.get(route).push(record);
      registry.tagLocations[record.id]={href:location.href,key:source.chapters.get(route)?.key};
      continue;
    }
    replacements.set(old.key+':'+old.index,record);
    if (!record.custody && old.proof!=null) {
      for (let index=old.proof; index<=old.proofEnd; index++) superseded.set(old.key+':'+index,record);
    }
  }
  const readerOnly=new Map();
  for (const id of update.data.counts.previousExactExportHolds) {
    const location=registry.tagLocations[id];
    const reader=update.data.inheritedReaders[id];
    requireFact(location?.index!=null && reader,'missing inherited proof location for '+id);
    const onWeb=location.proof!=null || location.inlineProof===true;
    readerOnly.set(id,{reader,onWeb});
  }
  return {update,replacements,superseded,additional,placements,byChapter,readerOnly};
}

export function currentChapterRecord(record, source = '', hasNativeAnchor = false) {
  const heading='<h3>'+escape(titleOf(record))+'</h3>';
  const tools='<p class="book-result-link">'+link(tagRoute(record.id),record.id)+' <small>'+
    escape(disposition(record))+'</small> · '+printed(record.reader)+'</p>';
  if (record.custody) {
    return source+'<p class="book-note">'+escape(record.custody)+' '+printed(record.reader)+'</p>';
  }
  const anchor=hasNativeAnchor ? oldAnchors(source) : '';
  const proofId=proofAnchor(record.id);
  const mathematics=record.erratum ?
    '<div class="tag-closure"><p>'+escape(record.scope)+'</p>'+narrowProofs(record)+'</div>'+
    '<details class="proof" id="'+proofId+'"><summary>Erratum and proof at the valid scope</summary>'+
    typesetReaderText(record.erratum.html)+'</details>'+
    (record.historical ? '<p>'+printed(record.historical,'Original printed statement')+'</p>' : '') :
    typesetReaderText(record.statement.html)+
    '<details class="proof" id="'+proofId+'"><summary>Proof</summary>'+typesetReaderText(record.proof.html)+'</details>';
  return '<section class="chapter-current-result sealed-record" id="'+resultAnchor(record.id)+'">'+anchor+heading+tools+
    (!record.erratum && record.scope ? '<p class="book-note">'+escape(record.scope)+'</p>' : '')+mathematics+'</section>';
}

export const historicalReadingAnchors = oldAnchors;
export const currentProofHref = record => '#'+(record.custody ? resultAnchor(record.id) : proofAnchor(record.id));
export const currentResultTitle = titleOf;

export function additionalChapterSection(reading, route) {
  if (!reading?.additional.get(route)?.length) return null;
  return {id:'local-analytic-arguments', title:route.includes('f8-reader-t4-di') ?
    'Logarithmic excision on a finite graph' : 'Local analytic arguments'};
}

function scopeSection(key, entry, data) {
  if (!entry.reader && !entry.proof) return '';
  return '<section id="'+scopeAnchor(key)+'"><h3>'+escape(entry.title)+'</h3>'+
    (entry.reader ? '<p>'+printed(entry.reader)+'</p>' : '')+textSection('Argument',entry.proof,scopeAnchor(key)+'-proof')+
    inputs(entry,data)+'</section>';
}

function extraScopes(id, data) {
  const entries = Object.entries(data.scopeRecords).filter(([, entry])=>entry.id===id)
    .map(([key,entry])=>scopeSection(key,entry,data)).filter(Boolean);
  return entries.length ? '<section class="book-text" id="selected-scopes"><h2>Selected scopes</h2>'+entries.join('')+'</section>' : '';
}

function carryAnchors(oldPage, newPage) {
  if (!oldPage) return newPage;
  const existing = new Set([...newPage.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
  const anchors = [...new Set([...oldPage.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]))].filter(id=>!existing.has(id));
  return newPage.replace('</main>',anchors.map(id=>'<span id="'+escape(id)+'"></span>').join('')+'</main>');
}

function tagPage(record, data, oldPage, oldLocation, legacyGap) {
  const id = record.id;
  const route = tagRoute(id);
  const old = oldFixed+route.slice(1);
  const chapter = chapterRoute(record.chapter);
  const title = titleOf(record);
  if (record.custody && oldPage) {
    return oldPage.replace('<section id="citation"', '<section class="book-text" id="selected-inputs"><h2>Current proof binding</h2><p>'+
      escape(record.custody)+'</p><p>'+printed(record.reader)+'</p>'+inputs(record,data)+
      '<p>'+foundationsFeedback(route,data.edition,id)+'</p></section><section id="citation"');
  }
  const stateId = record.status==='partial' ? 'status-partial' : 'status-closed';
  const header = '<header class="page-intro tag-header"><div class="tag-heading-meta"><p class="tag-permalink">'+id+
    '</p><p class="tag-status" data-closure="'+record.status+'">'+link(project+'guide/#'+stateId,disposition(record))+'</p></div><h1>'+
    escape(title)+'</h1><nav class="tag-actions page-actions" aria-label="Tag links">'+link(oldLocation?.href ?? chapter,'Read in chapter')+
    link('#foundations-exact-proof',record.proof ? 'Proof' : 'Erratum and narrower proof')+printed(record.reader)+
    (legacyGap ? link(old,'Prior fixed record') : '')+'</nav></header>';
  const narrower = record.erratum ? '<div id="closure"><p>'+escape(record.scope)+'</p>'+
    (record.historical ? '<p>'+printed(record.historical,'Original printed statement')+'</p>' : '')+
    (oldLocation?.sourceStatement ? '<details><summary>Original statement in the manuscript</summary>'+
      oldLocation.sourceStatement+'</details>' : '')+
    textSection('Reviewed erratum', record.erratum,'foundations-exact-proof')+
    '<h2>Full proofs at narrower scope</h2>'+narrowProofs(record)+'</div>' : '';
  const context=oldLocation?.context ? '<section id="model-metric-context"><h2>Formal model and metric</h2>'+
    oldLocation.context+'</section>' : '';
  const body = '<article class="book-text tag-text sealed-record">'+context+textSection('Statement',record.statement,'tag-statement')+
    (record.scope && !record.erratum ? '<p id="closure">'+escape(record.scope)+'</p>' : '')+narrower+
    textSection('Proof',record.proof,'foundations-exact-proof')+inputs(record,data)+
    extraScopes(id,data)+'</article><section id="citation" class="tag-citation"><h2>Citation</h2><p>Non-Archimedean Geometry Foundations, '+
    link(route,'Tag '+id)+', seal 1174.</p><p>'+foundationsFeedback(route,data.edition,id)+'</p></section>';
  const legacyStatus=legacyGap
    ? '<p id="open-status">'+link(record.status==='partial'?'#closure':'#foundations-exact-proof','Current proof status for '+id)+'</p>' : '';
  return carryAnchors(oldPage,foundationsShell(route,id+' · '+title,header+body+legacyStatus,{layout:'tag-page',
    extra:'<link rel="stylesheet" href="/assets/katex.min.css">'}));
}

export function applyFoundationsCoverage(update, coverage, registry) {
  for (const record of Object.values(update.data.records)) {
    let row = registry.tags.get(record.id);
    const destination=coverage.chapters.get(record.chapter);
    const earlier=[...coverage.chapters.values()].find(chapter=>chapter.tags.some(tag=>tag.id===record.id));
    if (!row) {
      row={id:record.id,link:tagRoute(record.id),category:'Foundations',project:'foundations',keywords:[],types:[]};
      registry.tags.set(record.id,row);
      destination.tags.push(row);
    } else if (earlier && earlier!==destination) {
      earlier.tags=earlier.tags.filter(tag=>tag.id!==record.id);
      destination.tags.push(row);
    }
    const text=readingText(record.statement?.html ?? record.erratum?.html ?? '');
    const summary=record.scope || text.slice(0,480) || row.summary;
    Object.assign(row,{title:titleOf(record),status:record.status,coverage:disposition(record),summary,
      body:[record.scope,text].filter(Boolean).join(' ').slice(0,1100) || row.body});
    if (record.status==='closed') {
      delete row.gap;
      row.types=[];
      coverage.gaps.delete(record.id);
    }
  }
  for (const [key,gaps] of coverage.byBlock) {
    const current=gaps.filter(gap=>coverage.gaps.has(gap.id) && !update.data.records[gap.id]?.erratum);
    coverage.byBlock.set(key,current);
  }
  for (const chapter of coverage.chapters.values()) {
    chapter.gaps=chapter.gaps.filter(gap=>coverage.gaps.has(gap.id));
    chapter.tagCounts=Object.fromEntries(coverageGroups.map(group=>[group,0]));
    for (const row of chapter.tags) chapter.tagCounts[closureGroup(row.status)]++;
  }
  coverage.narrower=[...coverage.gaps.keys()].filter(id=>registry.tags.get(id).status==='partial').length;
}

const items = records => '<ul>'+records.map(record=>'<li>'+link(tagRoute(record.id),record.id+' · '+titleOf(record))+
  (record.erratum ? ' <small>'+escape(disposition(record))+'</small>' : '')+
  (record.status==='partial' ? ' · '+link(tagRoute(record.id)+'#closure','Erratum and narrower scope') :
    ' · '+link(tagRoute(record.id)+'#foundations-exact-proof','Proof'))+'</li>').join('')+'</ul>';

function auditSection(audit) {
  const [exact,nonResults,omissions,narrower,unknown]=audit.coverage;
  return '<section id="reader33"><h2>Historical Reader33 audit</h2><p>The earlier audit classifies '+exact+
    ' exact-content windows, '+nonResults+' non-result windows, '+omissions+' confirmed omissions, '+narrower+
    ' windows with a narrower result and '+unknown+' unresolved printed windows. These are counts of windows.</p>'+
    '<h3>Five confirmed historical omissions</h3><ul>'+audit.omissions.map(([label,pages,gate])=>'<li><strong>'+
      escape(label)+'</strong> (historical pp. '+escape(pages)+'). '+escape(gate)+'</li>').join('')+'</ul>'+
    '<h3>Six further full-scope matches</h3><ul>'+audit.furtherFullScopeMatches.map(([label,id])=>'<li>'+
      escape(label)+' · '+link(tagRoute(id),id)+'</li>').join('')+'</ul><p>These matches have independently verified current proofs. '+
    'Their overlap with the earlier set of '+unknown+' unresolved windows remains unverified.</p></section>';
}

function countsParagraph(counts, additions) {
  return '<p>'+counts.whole.toLocaleString('en-US')+' accepted whole results, including '+additions+
    ' added since seal 1097. The source counts '+counts.standaloneClauses+' clauses separately. '+
    counts.priorityAccepted+' of '+counts.priorityTotal+' priority originals and '+
    counts.exceptionalAccepted+' of '+counts.exceptionalTotal+' exceptional originals are accepted at their stated scope.</p>';
}

function overview(update, changes, chapterTitles) {
  const {counts,historicalAudit}=update.data;
  const body='<header class="page-intro"><h1>Foundations seal 1174</h1>'+foundationsPdfLink(readerPath)+
    countsParagraph(counts,update.additions.size)+'<p>'+
    link(contentsRoute,'Table of contents')+' · '+link(fixed+'coverage/','Coverage and historical audit')+' · '+
    link(fixed+'logic/','Selected proof inputs')+' · '+link(oldFixed,'Previous fixed edition')+'</p></header>'+
    '<section><h2>77 newly accepted whole results</h2>'+Object.entries(chapterTitles).map(([slug,title])=>{
      const accepted=changes.filter(record=>record.chapter===slug && update.additions.has(record.id));
      return accepted.length ? '<h3>'+link(project+'chapters/'+slug+'/',title)+'</h3>'+items(accepted) : '';
    }).join('')+'</section><section><h2>Five original-scope errata</h2>'+
    items(changes.filter(row=>row.status==='partial'))+'</section>';
  return foundationsShell(fixed,'Seal 1174',body,{layout:'coverage-page'});
}

function currentProofMap(previous, data) {
  const nodes={...previous.nodes};
  const argumentsByKey={...previous.arguments};
  const conditions={...previous.principalConditions};
  for (const [key,entry] of Object.entries(data.scopeRecords)) {
    if (!entry.proof && !entry.reader && !entry.archived) continue;
    const href=selectedScopeHref(key,entry);
    nodes[key]={id:entry.id,label:entry.title,href,status:'accepted narrower scope'};
  }
  for (const record of Object.values(data.records)) {
    if (record.erratum) continue;
    nodes[record.id]={id:record.id,label:titleOf(record),status:'accepted whole',href:tagRoute(record.id)};
    if (record.scope) conditions[record.id]=[record.scope];
  }
  nodes['SUPPORT:F7:exact_facet_normal_formula']={label:'Facet-normal boundary formula',status:'named source formula',href:pdfDestination(facetNormal)};
  for (const [key,record] of Object.entries({...data.records,...data.scopeRecords})) {
    if (record.erratum || !nodes[key] || (!record.status && !record.requires.length)) continue;
    const external=new Set(record.stacks);
    const inputs=[], unresolved=[];
    for (const premise of record.requires) {
      if (nodes[premise]) inputs.push({key:premise,scopes:[]});
      else if (/^STACKS[:-][A-Z0-9]{4}$/.test(premise)) external.add(premise.slice(-4));
      else unresolved.push(premise);
    }
    const chapter=record.chapter ?? data.records[record.id]?.chapter ?? previous.arguments[key]?.chapter ??
      Object.keys(previous.chapters).find(slug=>Object.hasOwn(previous.arguments,record.id) && previous.arguments[record.id].chapter===slug);
    requireFact(chapter && previous.chapters[chapter],'no chapter binding for selected proof '+key);
    argumentsByKey[key]={chapter,inputs,standing:[],unresolved,
      external:[...external].map(tag=>({key:'Stacks Project, Tag '+tag,href:'https://stacks.math.columbia.edu/tag/'+tag,scopes:[]}))};
  }
  const gaps=Object.fromEntries(data.counts.pendingOriginals.map(id=>{
    const record=data.records[id];
    return [id,{href:tagRoute(id)+'#closure',chapter:record.chapter,label:titleOf(record),step:record.scope}];
  }));
  return {...previous,edition:data.edition,nodes,arguments:argumentsByKey,gaps,principalConditions:conditions};
}

export function buildFoundationsUpdate(update, native, oldRelease) {
  const data=update.data;
  const records=Object.values(data.records);
  const active=new Map();
  const frozen=new Map();
  for (const record of records) {
    const route=tagRoute(record.id);
    const oldPage=native.pages.get(route);
    const recordPage=tagPage(record,data,oldPage,native.reading.placements.get(record.id),Object.hasOwn(oldRelease.graph.gaps,record.id));
    active.set(route,recordPage);
    const fixedTag=fixed+route.slice(1);
    frozen.set(fixedTag,recordPage.replace('rel="canonical" href="'+route+'"','rel="canonical" href="'+fixedTag+'"')
      .replace(foundationsFeedback(route,data.edition,record.id),foundationsFeedback(fixedTag,data.edition,record.id)));
  }
  for (const [id, reader] of Object.entries(data.inheritedReaders)) {
    const route=tagRoute(id);
    const page=native.pages.get(route);
    const exportReceipt=native.reading.readerOnly.get(id);
    const receipt=exportReceipt && !exportReceipt.onWeb
      ? '<p'+(page?.includes('id="foundations-exact-proof"') ? '' : ' id="foundations-exact-proof"')+'>'+
        printed(reader,'Read the example and its argument in the English PDF')+'</p>'
      : printed(reader,'Statement and proof in the English PDF (p. '+reader.page+')');
    if (page && !active.has(route)) active.set(route,page.replace('<section id="citation"',
      '<div class="book-note">'+receipt+'</div><section id="citation"'));
  }
  for (const id of new Set(Object.values(data.scopeRecords).map(record=>record.id))) {
    const route=tagRoute(id);
    const page=active.get(route) ?? native.pages.get(route);
    if (data.records[id] || !page) continue;
    const scopes=extraScopes(id,data);
    if (scopes) active.set(route,page.replace('</main>',scopes+'</main>'));
  }
  const pdfRoutes=[contentsRoute,project+'reader/'];
  for (const route of pdfRoutes) {
    const page=native.pages.get(route);
    active.set(route,page.replace('</header>','<p class="page-actions">'+link(fixed,'Fixed edition')+
      ' · '+link(fixed+'logic/','Proof map')+'</p></header>'));
  }
  const audit=auditSection(data.historicalAudit);
  const holds='<section id="proof-access"><h2>Proof access for seven previously accepted results</h2><ul>'+
    [...native.reading.readerOnly].map(([id,binding])=>'<li>'+link(tagRoute(id),id)+' · '+
      (binding.onWeb ? link(tagRoute(id)+'#foundations-exact-proof','Web proof')+' · ' : '')+printed(binding.reader)+'</li>').join('')+'</ul></section>';
  const coverage=items(records.filter(record=>record.status==='partial'));
  const currentCoverage=native.pages.get(coverageRoute);
  const earlierGaps=Object.entries(oldRelease.graph.gaps).filter(([id])=>update.additions.has(id));
  const oldGroups=[...new Set(earlierGaps.map(([,gap])=>gap.chapter))];
  const oldLocations=oldGroups.filter(chapter=>!currentCoverage.includes('id="gaps-'+chapter+'"'))
    .map(chapter=>'<span id="gaps-'+escape(chapter)+'"></span>').join('');
  const nowSelected='<details><summary>Previously open Tags now accepted</summary>'+oldLocations+'<ul>'+
    earlierGaps.map(([id])=>'<li id="open-'+id+'">'+link(tagRoute(id),id)+'</li>').join('')+'</ul></details>';
  const counts='<section id="accepted-result-counts"><h2>Accepted results in seal 1174</h2>'+
    countsParagraph(data.counts,update.additions.size)+'</section>';
  active.set(coverageRoute,currentCoverage.replace('</header>','</header>'+counts+
    '<section id="original-scope"><h2>Five original claims with restrictions or a remaining gap</h2>'+coverage+'</section>')
    .replace('</main>',nowSelected+holds+audit+'</main>'));
  frozen.set(fixed,overview(update,records,oldRelease.graph.chapters));
  frozen.set(fixed+'coverage/',foundationsShell(fixed+'coverage/','Seal 1174 coverage',
    '<h1>Coverage and remaining obligations</h1>'+counts+'<section><h2>Five original claims with restrictions or a remaining gap</h2>'+coverage+'</section>'+holds+audit,
    {layout:'coverage-page'}));
  const logicRoute=fixed+'logic/';
  const logicShell=(route,title,body)=>foundationsShell(route,title,
    '<div class="logic-flow">'+body+'</div>',{layout:'coverage-page',
      extra:'<link rel="stylesheet" href="'+oldFixed+'logic/logic.css">'});
  const logic=currentFoundationsLogicPages(currentProofMap(oldRelease.graph,data),oldRelease.logicBytes,logicRoute,logicShell);
  for (const [route,page] of logic) frozen.set(route,page);
  return {active,frozen};
}
