import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import katex from 'katex';
import {contentsRoute, coverageRoute, escape, foundationsPdfLink, foundationsShell, link, project} from './foundations-layout.mjs';
import {closureGroup, coverageGroups, statusLabels, tagRoute} from './foundations-tag-register.mjs';

const edition = 'sealed-1174';
const fixed = project + 'editions/' + edition + '/';
const oldFixed = project + 'editions/sealed-1097/';
const readerPath = fixed + 'reader-en.pdf';
const idPattern = /^NAG-\d{6}$/;
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
  const checkReader = entry => requireFact(entry && typeof entry.destination==='string' &&
    Number.isInteger(entry.page) && entry.page>0 && entry.page<=data.reader.pages, 'invalid printed destination');
  for (const [id,entry] of Object.entries(data.records)) {
    requireFact(id===entry.id && idPattern.test(id) && previous.graph.chapters[entry.chapter] &&
      (entry.status==='closed' ? selected.has(id) : entry.status==='partial' && !selected.has(id)), 'invalid record '+id);
    checkReader(entry.reader);
    for (const reader of entry.narrowReaders ?? []) checkReader(reader);
  }
  for (const entry of Object.values(data.scopeRecords)) if (entry.reader) checkReader(entry.reader);
  checkDependencyCycles(data,previous.graph);
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

const printed = (reader, label) => link(readerPath+'#nameddest='+encodeURIComponent(reader.destination),
  label ?? 'Read in the English PDF (p. '+reader.page+')');
const scopeAnchor = key => 'scope-'+encodeURIComponent(key).replaceAll('%','_');

function inputs(record, data) {
  const selected = new Set(data.selected);
  const refs = record.requires.map(key => {
    const scope = data.scopeRecords[key];
    if (scope?.reader || scope?.proof) {
      return link(tagRoute(scope.id)+'#'+scopeAnchor(key),scope.title)+' <small>('+escape(scope.id)+')</small>';
    }
    if (scope?.archived) {
      return link(oldFixed+scope.archived.slice(1),scope.title)+' <small>(earlier fixed record)</small>';
    }
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
  ['mathbb', ['R','RR','N','Z','PP']],
  ['mathcal', ['A','B','BB','cE','cL','cM','cO','cX','cY','D','E','F','OO','T','TT']],
].flatMap(([command,names])=>names.map(name=>['\\'+name,'\\'+command+'{'+name.at(-1)+'}'])));
Object.assign(macros, {
  '\\an':'\\mathrm{an}', '\\dd':'\\mathrm{d}', '\\DD':"\\mathrm{d}'\\mathrm{d}''",
  '\\divis':'\\operatorname{div}', '\\length':'\\operatorname{length}', '\\ext':'\\operatorname{ext}',
  '\\Int':'\\operatorname{Int}', '\\Min':'\\operatorname{Min}', '\\supp':'\\operatorname{supp}',
  '\\Supp':'\\operatorname{Supp}',
});
const entities = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&#x27;':"'"};

function typesetReaderText(html) {
  return html.replace(/<span class="math (inline|display)">(\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\))<\/span>/g,
    (math, layout, formula) => {
      const tex=formula.slice(2,-2).replace(/&(?:amp|lt|gt|quot|#39|#x27);/g,entity=>entities[entity])
        .replace(/\\(begin|end)\{split\}/g,'\\$1{aligned}');
      return '<span class="math '+layout+'">'+katex.renderToString(tex,
        {displayMode: layout==='display', output:'mathml', macros, strict:'ignore', trust:false})+'</span>';
    });
}

function textSection(title, binding, id) {
  if (!binding) return '';
  return '<section id="'+id+'"'+(id==='foundations-exact-proof' ? ' class="proof"' : '')+'><h2>'+escape(title)+'</h2>'+typesetReaderText(binding.html)+
    '<details'+(binding.html ? '' : ' open')+'><summary>TeX reading text</summary><pre data-source-sha256="'+
    binding.sourceSha256+'">'+escape(binding.tex)+'</pre></details></section>';
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
  const keepOriginal = oldPage && !record.statement;
  const chapter = project+'chapters/'+record.chapter+'/';
  const state = record.status==='partial' ? {
    proof_comparison_refuted_unrestricted_theorem_open:'Open at full scope · a proof step fails',
    unrestricted_atlas_refuted_in_project_category:'Unrestricted atlas claim refuted',
    unrestricted_generic_existence_obstruction:'Obstruction to the unrestricted existence claim',
    uniformly_bounded_annulus_refuted:'Unrestricted coefficient claim refuted',
    empty_face_refuted:'Empty-face case refuted',
  }[record.disposition] : statusLabels.closed;
  if (record.custody && oldPage) {
    return oldPage.replace('<section id="citation"', '<section class="book-text" id="selected-inputs"><h2>Current proof binding</h2><p>'+
      escape(record.custody)+'</p><p>'+printed(record.reader)+'</p>'+inputs(record,data)+'</section><section id="citation"');
  }
  const stateId = record.status==='partial' ? 'status-partial' : 'status-closed';
  const header = '<header class="page-intro tag-header"><div class="tag-heading-meta"><p class="tag-permalink">'+id+
    '</p><p class="tag-status" data-closure="'+record.status+'">'+link(project+'guide/#'+stateId,state)+'</p></div><h1>'+
    escape(record.title)+'</h1><nav class="tag-actions page-actions">'+link(oldLocation?.href ?? chapter,'Read in chapter')+
    (record.proof ? link('#foundations-exact-proof','Proof') : link('#closure','Erratum'))+printed(record.reader)+
    (oldPage ? link(old,'Prior fixed record') : '')+'</nav></header>';
  const narrower = record.erratum ? '<div id="closure"><p>'+escape(record.scope)+'</p>'+
    (record.historical ? '<p>'+printed(record.historical,'Original printed statement')+'</p>' : '')+
    (keepOriginal ? '<p>'+link(old,'Historical statement and earlier scope record')+'</p>' : '')+
    textSection('Reviewed erratum', record.erratum,'foundations-exact-proof')+
    (record.formalWindow ? '<p>'+link(old,'Earlier fixed record for the formal-only argument')+'</p>' : '')+
    (record.narrowReaders.length ? '<h2>Full proofs at narrower scope</h2><ul>'+
      record.narrowReaders.map(reader=>'<li>'+printed(reader)+'</li>').join('')+'</ul>' : '')+'</div>' : '';
  const body = '<article class="book-text tag-text sealed-record">'+textSection('Statement',record.statement,'tag-statement')+
    (record.scope && !record.erratum ? '<p id="closure">'+escape(record.scope)+'</p>' : '')+narrower+
    textSection('Proof',record.proof,'foundations-exact-proof')+inputs(record,data)+
    extraScopes(id,data)+'</article><section id="citation" class="tag-citation"><h2>Citation</h2><p>Non-Archimedean Geometry Foundations, '+
    link(route,'Tag '+id)+', seal 1174.</p></section>';
  const legacyStatus=legacyGap
    ? '<p id="open-status">'+link(record.status==='partial'?'#closure':'#foundations-exact-proof','Current proof status for '+id)+'</p>' : '';
  return carryAnchors(oldPage,foundationsShell(route,id+' · '+record.title,header+body+legacyStatus,{layout:'tag-page'}));
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
    const summary=record.status==='closed' ? 'Accepted whole' : statusLabels.partial;
    Object.assign(row,{title:record.title,status:record.status,coverage:summary,summary,
      body:[record.scope,record.statement?.html.replace(/<[^>]+>/g,' ')].filter(Boolean).join(' ').slice(0,600)});
    if (record.status==='closed') {
      delete row.gap;
      row.types=[];
      coverage.gaps.delete(record.id);
    }
  }
  for (const chapter of coverage.chapters.values()) {
    chapter.gaps=chapter.gaps.filter(gap=>coverage.gaps.has(gap.id));
    chapter.tagCounts=Object.fromEntries(coverageGroups.map(group=>[group,0]));
    for (const row of chapter.tags) chapter.tagCounts[closureGroup(row.status)]++;
  }
  coverage.narrower=[...coverage.gaps.keys()].filter(id=>registry.tags.get(id).status==='partial').length;
}

const items = records => '<ul>'+records.map(record=>'<li>'+link(tagRoute(record.id),record.id+' · '+record.title)+
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

function overview(update, changes, chapterTitles) {
  const {counts,historicalAudit}=update.data;
  const body='<header class="page-intro"><h1>Foundations seal 1174</h1>'+foundationsPdfLink(readerPath)+
    '<p>'+counts.whole.toLocaleString('en-US')+' accepted whole results and '+counts.standaloneClauses+
    ' separately counted clauses. '+counts.priorityAccepted+' of '+counts.priorityTotal+' priority originals and '+
    counts.exceptionalAccepted+' of '+counts.exceptionalTotal+' exceptional originals are accepted at their stated scope.</p><p>'+
    link(contentsRoute,'Table of contents')+' · '+link(fixed+'coverage/','Coverage and historical audit')+' · '+
    link(fixed+'logic/','Selected proof inputs')+' · '+link(oldFixed,'Previous fixed edition')+'</p></header>'+
    '<section><h2>77 newly accepted whole results</h2>'+Object.entries(chapterTitles).map(([slug,title])=>{
      const accepted=changes.filter(record=>record.chapter===slug && update.additions.has(record.id));
      return accepted.length ? '<h3>'+link(project+'chapters/'+slug+'/',title)+'</h3>'+items(accepted) : '';
    }).join('')+'</section><section><h2>Five original-scope errata</h2>'+
    items(changes.filter(row=>row.status==='partial'))+'</section>';
  return foundationsShell(fixed,'Seal 1174',body,{layout:'coverage-page'});
}

export function buildFoundationsUpdate(update, native, oldRelease) {
  const data=update.data;
  const records=Object.values(data.records);
  const active=new Map();
  const frozen=new Map();
  for (const record of records) {
    const route=tagRoute(record.id);
    const oldPage=native.pages.get(route);
    const recordPage=tagPage(record,data,oldPage,native.tags[record.id],Object.hasOwn(oldRelease.graph.gaps,record.id));
    active.set(route,recordPage);
    frozen.set(fixed+route.slice(1),recordPage.replace('rel="canonical" href="'+route+'"','rel="canonical" href="'+fixed+route.slice(1)+'"'));
  }
  for (const [id, reader] of Object.entries(data.inheritedReaders)) {
    const route=tagRoute(id);
    const page=native.pages.get(route);
    if (page && !active.has(route)) active.set(route,page.replace('<section id="citation"',
      '<p class="book-note">'+printed(reader)+'</p><section id="citation"'));
  }
  for (const id of new Set(Object.values(data.scopeRecords).map(record=>record.id))) {
    const route=tagRoute(id);
    const page=active.get(route) ?? native.pages.get(route);
    if (data.records[id] || !page) continue;
    const scopes=extraScopes(id,data);
    if (scopes) active.set(route,page.replace('</main>',scopes+'</main>'));
  }
  for (const [slug,title] of Object.entries(oldRelease.graph.chapters)) {
    const route=project+'chapters/'+slug+'/';
    const changes=records.filter(record=>record.chapter===slug);
    const page=native.pages.get(route);
    if (!page || !changes.length) continue;
    const section='<section class="book-text" id="seal-1174"><h2>Seal 1174</h2>'+items(changes)+
      '<p>Earlier manuscript passages below retain their original wording and proof notes.</p></section>';
    active.set(route,page.replace(/<article class="book-text"/,section+'<article class="book-text"').replace('</main>',
      page.includes('<article class="book-text"') ? '</main>' : section+'</main>'));
  }
  const pdfRoutes=[contentsRoute,project+'reader/'];
  for (const route of pdfRoutes) {
    const page=native.pages.get(route).replace(oldRelease.meta.reader.path,readerPath);
    active.set(route,page.replace('</header>','<p>'+link(fixed,'Seal 1174 · additions and corrected scopes')+'</p></header>'));
  }
  const audit=auditSection(data.historicalAudit);
  const holds='<section><h2>Previously accepted results with a web export gap</h2><ul>'+
    data.counts.previousExactExportHolds.map(id=>'<li>'+link(tagRoute(id),id)+'</li>').join('')+'</ul></section>';
  const coverage=items(records.filter(record=>record.status==='partial'));
  const currentCoverage=native.pages.get(coverageRoute);
  const earlierGaps=Object.entries(oldRelease.graph.gaps).filter(([id])=>update.additions.has(id));
  const oldGroups=[...new Set(earlierGaps.map(([,gap])=>gap.chapter))];
  const oldLocations=oldGroups.filter(chapter=>!currentCoverage.includes('id="gaps-'+chapter+'"'))
    .map(chapter=>'<span id="gaps-'+escape(chapter)+'"></span>').join('');
  const nowSelected='<details><summary>Previously open Tags now accepted</summary>'+oldLocations+'<ul>'+
    earlierGaps.map(([id])=>'<li id="open-'+id+'">'+link(tagRoute(id),id)+'</li>').join('')+'</ul></details>';
  active.set(coverageRoute,currentCoverage.replace('</main>',nowSelected+audit+'</main>'));
  frozen.set(fixed,overview(update,records,oldRelease.graph.chapters));
  frozen.set(fixed+'coverage/',foundationsShell(fixed+'coverage/','Seal 1174 coverage',
    '<h1>Coverage and remaining obligations</h1><section><h2>Five unsettled original scopes</h2>'+coverage+'</section>'+holds+audit,
    {layout:'coverage-page'}));
  const logic=records.filter(record=>record.status==='closed' && record.requires.length);
  const logicRoute=fixed+'logic/';
  frozen.set(logicRoute,foundationsShell(logicRoute,'Seal 1174 proof inputs',
    '<h1>Selected proof inputs</h1><p>'+link(oldFixed+'logic/','Proof map for seal 1097')+'</p>'+
    logic.map(record=>'<section><h2>'+link(tagRoute(record.id),record.id+' · '+record.title)+'</h2>'+inputs(record,data)+'</section>').join(''),
    {layout:'coverage-page'}));
  return {active,frozen};
}
