import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import katex from 'katex';
import {linkProofParagraphs, sourcePolicyNotice} from './build-foundations-web.mjs';
import {foundationsCoverage, gapCount} from './foundations-reading-status.mjs';
import {editFoundationsReadingHtml, foundationsReferenceLabels, foundationsRemarkNumbers} from './foundations-reading-editor.mjs';
import {foundationsReadingLocations} from './foundations-reading-locations.mjs';

const project = '/projects/foundations/';
export const nativeReaderRoute = project + 'reader/';
const contentsRoute = project + 'contents/';
const coverageRoute = project + 'coverage/';
const chapterCoverageRoute = chapter => coverageRoute+'chapters/'+chapter.slug+'/';
const proofTagsRoute = project + 'proof-tags/';
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const link = (href, title) => `<a href="${escape(href)}">${escape(title)}</a>`;
const tagRoute = id => `/r/${id}/`;
const heading = (number, title) => [number, title].filter(Boolean).join(' · ');
const unsafeMarkup = /<(?:script|iframe|object|embed|style|form)\b|<[^>]*\son[a-z]+\s*=|(?:href|src)="(?:javascript|data):/i;
const privateMaterial = /(?:\/workspace\/|\/home\/agent\/|[A-Z]:\\Users\\|libfile_|private_library_readback|BEGIN [A-Z ]*PRIVATE KEY)/i;
const tagId = /^NAG-\d{6}$/;
const entities = {amp:'&',lt:'<',gt:'>',quot:'"','#x27':"'",'#39':"'"};
const proofStyles = '<link rel="stylesheet" href="/assets/katex.min.css">';
const chapterSlug = route => route.startsWith(project + 'chapters/') ? route.split('/').at(-2) : null;
const gapLabel = 'Open at full scope';
const suppressTags = (html, ids = []) => ids.reduce((text,id) => text.replaceAll(link(tagRoute(id), id), ''), html);

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

export function loadHistoricalStatements(release, bytes) {
  const {schema, editionManifestSha256, statements} = JSON.parse(bytes);
  if (schema !== 'foundations-historical-statements/v1' || editionManifestSha256 !== release.current.editionManifestSha256) {
    throw Error('Historical web statements are not bound to the Foundations edition');
  }
  const {tags} = foundationsReadingLocations(release.native);
  const expected = Object.keys(release.graph.gaps).filter(id => tags[id]?.index == null);
  if (Object.keys(statements).length !== expected.length || expected.some(id => !Object.hasOwn(statements,id))) {
    throw Error('Historical web statements do not match the gaps without a manuscript statement');
  }
  for (const [id, {sourceSha256, html}] of Object.entries(statements)) {
    const archived = release.contents.get(`r/${id}/index.html`)?.toString('utf8');
    if (!release.graph.gaps[id] || !/^[a-f0-9]{64}$/.test(sourceSha256) ||
      !archived?.includes(`<summary>Historical statement · exact TeX</summary><pre data-sha256="${sourceSha256}">`) ||
      !html?.trim() || unsafeMarkup.test(html) || privateMaterial.test(html)) {
      throw Error('Historical statement binding or HTML is invalid for ' + id);
    }
  }
  return statements;
}

function shell(route, title, body, extra = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)} · OpenMath Foundations</title><link rel="canonical" href="${route}">
  <link rel="stylesheet" href="/assets/foundations-native.css">${extra}</head><body>
  <a class="skip" href="#main">Skip to content</a><header class="site-header"><nav aria-label="Foundations">
  ${link(project, 'OpenMath Foundations')}${link(contentsRoute, 'Table of contents')}
  ${link('/search/?project=foundations', 'Find a Tag')}${link(coverageRoute,'Tag and proof coverage')}
  </nav></header><main id="main">${body}</main></body></html>`;
}

function crumb(links) {
  return '<nav class="book-crumb" aria-label="Breadcrumb"><ol>' + links.map(([route,title]) =>
    '<li>' + (route ? link(route,title) : '<span aria-current="page">'+escape(title)+'</span>') + '</li>').join('') + '</ol></nav>';
}

const plural = (count, singular, pluralForm = singular+'s') => `${count} ${count === 1 ? singular : pluralForm}`;
function chapterCount(entry) {
  if (!entry) return '';
  const coverage = chapterCoverageRoute(entry);
  const counts = [link(coverage,plural(entry.tags.length,'NAG Tag'))];
  if (entry.gaps.length) counts.push(link(coverageRoute+'#gaps-'+entry.slug,plural(entry.gaps.length,'historical NAG gap')));
  if (entry.open.length) counts.push(link(coverage+'#manuscript-findings',plural(entry.open.length,'open manuscript item')));
  if (entry.conditional.length) counts.push(link(coverage+'#manuscript-findings',plural(entry.conditional.length,'conditional argument')));
  if (entry.comparisons.length) counts.push(link(coverage+'#manuscript-findings',plural(entry.comparisons.length,'comparison note')));
  return `<span class="chapter-open-count${entry.gaps.length || entry.open.length ? ' has-open' : ''}">${counts.join(' · ')}</span>`;
}

function bookContents(native, fixed, route, coverage) {
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
  groups.push({title:'Supplement and ledger records', items:[...coverage.chapters.values()]
    .filter(chapter => !chapter.native).map(chapter => ({...chapter, sections:[]}))});
  const body = groups.map(({title,items,note}, i) => `<section aria-labelledby="part-${i}" id="group-${i}">
    <h2 id="part-${i}">${escape(title)}</h2>${note ? `<p class="book-note">${link(note,'Part introduction')}</p>` : ''}
    <ul class="book-chapters">${items.map(entry => `<li><div class="book-chapter-entry">${link(entry.route,heading(entry.number,entry.title))}${chapterCount(coverage.chapters.get(chapterSlug(entry.route)))}</div>
      ${entry.sections.length ? `<details><summary>Sections (${entry.sections.length})</summary><ul>${entry.sections.map(section =>
        `<li>${link(entry.route+'#'+section.id,heading(section.number,section.title))}</li>`).join('')}</ul></details>` : ''}</li>`).join('')}</ul></section>`).join('');
  const trail = crumb([[project,'Foundations'],[null,'Table of contents']]);
  const archive = `<p class="book-note">${link(coverageRoute,'Tag and proof coverage')} · ${link(fixed,'Fixed edition and PDF')}</p>`;
  const jumps = `<nav class="book-jumps" aria-label="Parts">${groups.map(({title},i)=>link('#group-'+i,title)).join('')}
    ${link('/projects/foundations/chapters/appendix-a/#bibliography','Bibliography')}
    ${link('/projects/foundations/chapters/appendix-a/#subject-index','Subject index')}</nav>`;
  const script = route === nativeReaderRoute ? '<script type="module" src="/assets/foundations-native-reader.js"></script>' : '';
  return shell(route,'Table of contents',`${trail}<h1>Table of contents</h1>
    <p>Read Non-Archimedean Geometry Foundations by chapter and section. Follow permanent NAG Tags to their statements, proofs and coverage notes.</p>
    <p id="reader-location" hidden></p>${archive}${jumps}${body}`,script);
}

function partChapterOutline(chapter, index, catalogue, coverage) {
  if (!chapter.route.includes('/part-')) return '';
  const entries = [];
  for (const entry of catalogue.slice(index+1)) {
    if (!/^\d+$/.test(entry.number ?? '')) break;
    entries.push(`<li><div class="book-chapter-entry">${link(entry.route,heading(entry.number,entry.title))}${chapterCount(coverage.chapters.get(chapterSlug(entry.route)))}</div></li>`);
  }
  return `<section class="part-chapter-coverage"><h2>Chapters and proof coverage</h2><ul class="book-chapters">${entries.join('')}</ul></section>`;
}

function chapterPage(chapter, catalogue, proofs, dependencies, coverage, locations) {
  const title = heading(chapter.number, chapter.title);
  const index = catalogue.findIndex(entry => entry.key===chapter.key);
  const nav = `<nav class="book-adjacent" aria-label="Chapter navigation">${[-1,1].map(offset => {
    const entry = catalogue[index+offset];
    return entry ? link(entry.route, `${offset<0 ? '← ' : ''}${heading(entry.number,entry.title)}${offset>0 ? ' →' : ''}`) : '';
  }).join('')}</nav>`;
  const trail = crumb([[project,'Foundations'],[contentsRoute,'Table of contents'],[null,title]]);
  const coverageEntry = coverage.chapters.get(chapterSlug(chapter.route));
  const count = chapterCount(coverageEntry);
  const part = partChapterOutline(chapter,index,catalogue,coverage);
  const sections = chapter.sections.filter(section => section.level===2);
  const menu = sections.length ? `<nav class="book-sidebar" aria-label="On this page"><details open><summary>On this page</summary><ul>${sections.map(section =>
    `<li>${link('#'+section.id,heading(section.number,section.title))}</li>`).join('')}</ul></details></nav>` : '';
  const indexEntries = [...proofs.values()].map(proof=>`<li>${link('#'+proof.anchor,proof.title)} ${proof.tagLinks}</li>`).join('');
  const proofIndex = indexEntries ? `<details class="chapter-proof-index" id="chapter-proofs"><summary>Proofs in this chapter (${proofs.size})</summary><ol>${indexEntries}</ol></details>` : '<span id="chapter-proofs"></span>';
  const body = chapter.blocks.map((block,i)=> {
    const key = `${chapter.key}:${i}`;
    const proof=proofs.get(i);
    const result=dependencies.resultByBlock.get(key);
    const missing=coverage.missingByBlock.get(key);
    const note=coverage.sourceNotes.get(key);
    const review=coverage.reviewMarkers.get(key);
    const policy=dependencies.policyByBlock.get(key);
    const proofPolicy=proof && dependencies.byProof.get(key)?.policy;
    const locator=policy?.anchor.split('#')[1];
    const notice=policy ? `<div id="${escape(locator)}">${sourcePolicyNotice(policy)}</div>` : '';
    const restoredTag = locations.restored.get(key);
    const otherResultLink = restoredTag ? link(tagRoute(restoredTag), restoredTag) : result ? link(result.route,result.id+' · Result') : '';
    const status = coverage.proofFindings.get(key);
    const missingBadge = missing ? `<small class="book-untagged">Without a NAG Tag</small>` : '';
    const openBadge = status?.notes.length ? `<small class="book-untagged book-source-open">${link(status.notes[0].href,'Open proof obligation')}</small>` : '';
    const resultLink = otherResultLink || missingBadge || openBadge ? `<p class="book-result-link"${missing?.generatedAnchor ? ` id="${missing.generatedAnchor}"` : ''}>${otherResultLink}${missingBadge}${openBadge}</p>` : '';
    const open = coverage.byBlock.get(key) ?? [];
    const gapMarks = open.length ? `<p class="book-gap-marks">${open.map(gap => link(gap.route+'#open-status', gap.id+' · '+gapLabel)).join(' ')}</p>` : '';
    const proofLink=proof ? `<div class="chapter-proof-links" id="${proof.anchor}" role="group" aria-label="Tag links for this proof">${proof.tagLinks}
      ${proofPolicy ? link(proofPolicy.anchor,'Proof assumptions and status') : ''}</div>` : '';
    block = suppressTags(block, locations.suppressed.get(key));
    const sourceBlock = locator ? block.replace(` id="${locator}"`,'') : block;
    const reviewLink = review ? `<p class="reviewed-proof-passage" id="${review.href.split('#')[1]}">${link(chapterCoverageRoute(coverageEntry)+'#manuscript-findings', findingStatus[review.status])}</p>` : '';
    const wrapped = note ? `<div class="source-proof-note" id="${note.href.split('#')[1]}">${sourceBlock}</div>` : sourceBlock;
    return notice+resultLink+gapMarks+reviewLink+proofLink+wrapped;
  }).join('');
  return shell(chapter.route,title,`${trail}<h1>${escape(title)}</h1>${count ? `<p class="chapter-coverage">${count}</p>` : ''}${nav}${proofIndex}
    <div class="book-layout${menu ? ' has-sidebar' : ''}">${menu}<article class="book-text" aria-label="${escape(chapter.title)}">${body}</article></div>${part}${nav}`);
}

const findingStatus = {open:'Open proof obligation', conditional:'Conditional argument', comparison:'Scope of the comparison'};

function coveragePage(coverage, fixed) {
  const chapters = [...coverage.chapters.values()];
  const trail = crumb([[project,'Foundations'],[null,'Tag and proof coverage']]);
  const total = key => chapters.reduce((sum,chapter) => sum + chapter[key].length,0);
  const table = chapters.map(chapter => {
    const detail = chapterCoverageRoute(chapter);
    return `<tr id="chapter-${chapter.slug}"><th scope="row">${link(chapter.route,chapter.title)} <small>${link(detail,'Coverage details')}</small></th>
      <td data-count="tags">${link(detail+'#tag-inventory',String(chapter.tags.length))}</td>
      <td data-count="gaps">${chapter.gaps.length ? link('#gaps-'+chapter.slug,String(chapter.gaps.length)) : '0'}</td>
      <td data-count="open">${link(detail+'#manuscript-findings',String(chapter.open.length))}</td>
      <td data-count="missing">${link(detail+'#untagged-statements',String(chapter.missing.length))}</td></tr>`;
  }).join('');
  const gapSections = chapters.filter(chapter => chapter.gaps.length).map(chapter => `<section id="gaps-${chapter.slug}">
    <h3>${escape(chapter.title)} <span class="coverage-heading-count">${gapCount(chapter.gaps.length)}</span></h3>
    <ul class="coverage-list">${chapter.gaps.map(gap => `<li id="open-${gap.id}">${link(gap.route, `${gap.id}${gap.label === gap.id ? '' : ' · '+gap.label}`)}
      ${gap.narrower ? '<small>A narrower scope is available.</small>' : ''}</li>`).join('')}</ul></section>`).join('');
  const sources = chapters.filter(chapter => chapter.open.length || chapter.conditional.length || chapter.comparisons.length);
  return shell(coverageRoute,'Tag and proof coverage',`${trail}<h1>Tag and proof coverage</h1>
    <p class="coverage-lead"><strong>${total('tags').toLocaleString('en-US')} permanent NAG Tags</strong>, <strong>${total('open')} open manuscript items</strong> and <strong>${total('missing')} theorems, lemmas and propositions without a NAG Tag</strong>.</p>
    <p>Permanent Tag counts follow the fixed register’s chapter assignments. The other manuscript columns follow the location of each statement in the book. The open manuscript column counts distinct targets of explicit source notes and reviewed passages. Conditional arguments and comparison requirements are listed in the chapter details.</p>
    <p>For the original acceptance and export records, consult the ${link(fixed+'coverage/','fixed-edition coverage register')}.</p>
    <nav class="book-jumps" aria-label="Coverage sections">${link('#chapter-counts','Counts by chapter')}${link('#manuscript-obligations','Manuscript proof findings')}${link('#historical-proof-gaps','Historical NAG gaps')}</nav>
    <section id="chapter-counts"><h2>Counts by chapter</h2><div class="coverage-table-scroll" role="region" aria-label="Counts by chapter" tabindex="0"><table class="coverage-table"><thead><tr><th scope="col">Chapter or supplement</th><th scope="col">NAG Tags</th><th scope="col">Historical NAG gaps</th><th scope="col">Open manuscript items</th><th scope="col">Statements without NAG</th></tr></thead>
    <tbody>${table}</tbody><tfoot><tr><th scope="row">Total</th><td>${total('tags')}</td><td>${coverage.gaps.size}</td><td>${total('open')}</td><td>${total('missing')}</td></tr></tfoot></table></div></section>
    <section id="manuscript-obligations"><h2>Manuscript proof findings</h2><p>The manuscript contains ${coverage.notes} explicit proof notes. Multiple notes on the same statement count as one open item. The chapter details link each recorded obligation, conditional argument and comparison to the passage that supports it.</p>
    <ul class="coverage-list">${sources.map(chapter => `<li>${link(chapterCoverageRoute(chapter)+'#manuscript-findings',chapter.title)} <small>${plural(chapter.open.length,'open item')}${chapter.conditional.length ? ' · '+plural(chapter.conditional.length,'conditional argument') : ''}${chapter.comparisons.length ? ' · '+plural(chapter.comparisons.length,'comparison note') : ''}</small></li>`).join('')}</ul></section>
    <section id="historical-proof-gaps"><h2>Historical NAG gaps</h2><p><strong>${gapCount(coverage.gaps.size)}</strong> at the full scope of the original statement. Of these, ${coverage.gaps.size - coverage.narrower} have a recorded whole-proof gap and ${coverage.narrower} have a selected argument at a narrower scope.</p>${gapSections}</section>`);
}

function chapterCoveragePage(chapter, coverage, results) {
  const route = chapterCoverageRoute(chapter);
  const trail = crumb([[project,'Foundations'],[coverageRoute,'Tag and proof coverage'],[null,chapter.title]]);
  const kindCounts = ['theorem','lemma','proposition'].map(kind => plural(chapter.missing.filter(entry=>entry.kind===kind).length,kind)).join(', ');
  const findings = [...chapter.open,...chapter.conditional,...chapter.comparisons];
  const proofList = findings.length ? `<ul class="coverage-list proof-coverage-list">${findings.map(entry => `<li>
    <strong>${link(entry.href,entry.title)}</strong><small>${findingStatus[entry.status]}</small>
    ${entry.summary ? `<p>${escape(entry.summary)}</p>` : ''}${entry.notes.length ? `<ul>${entry.notes.map(note=>`<li>${link(note.href, 'Read the author’s '+note.kind+' proof note'+(note.source.route===chapter.route ? '' : ' in Chapter '+note.source.number))}</li>`).join('')}</ul>` : ''}</li>`).join('')}</ul>` : '<p>No manuscript proof findings are recorded here.</p>';
  const missing = chapter.missing.length ? `<ol class="coverage-list">${chapter.missing.map(entry=>{
    const result = results.get(entry.key);
    const status = coverage.proofFindings.get(entry.key)?.status;
    return `<li data-missing-nag="${entry.kind}">${link(entry.href,entry.title)} ${result ? link(result.route, result.id) : ''}${status ? `<small>${findingStatus[status]}</small>` : ''}</li>`;
  }).join('')}</ol>` : '<p>There are no indexed untagged theorems, lemmas or propositions in this chapter’s manuscript text.</p>';
  return shell(route,chapter.title+' · Coverage',`${trail}<h1>${escape(chapter.title)}</h1><p>${link(chapter.route,'Read the chapter')}</p>
    <nav class="book-jumps" aria-label="Chapter coverage sections">${link('#tag-inventory','NAG inventory')}${link('#manuscript-findings','Manuscript proof findings')}${link('#untagged-statements','Statements without a NAG Tag')}</nav>
    <section id="tag-inventory"><h2>NAG inventory</h2><p>${plural(chapter.tags.length,'permanent NAG Tag')} assigned here by the fixed register. ${plural(chapter.manuscriptTags.length,'NAG Tag')} with a reading location in this chapter.</p>
    ${chapter.gaps.length ? `<p>${link(coverageRoute+'#gaps-'+chapter.slug,plural(chapter.gaps.length,'historical NAG gap'))}</p>` : ''}
    ${chapter.tags.length ? `<details><summary>List of registered Tags</summary><ul class="coverage-list">${chapter.tags.map(row=>`<li>${link(row.link,row.title===row.id ? row.id : row.id+' · '+row.title)}</li>`).join('')}</ul></details>` : ''}</section>
    <section id="manuscript-findings"><h2>Manuscript proof findings</h2>${proofList}</section>
    <section id="untagged-statements"><h2>Statements without a NAG Tag</h2><p>${chapter.missing.length} out of ${chapter.statements.length} indexed theorems, lemmas and propositions (${kindCounts} without a NAG Tag).</p>${missing}</section>`);
}

const gapDescriptions = new Map([
  ['Pinned English candidate. This sweep did not bind an independently signed whole proof and operative scope map for these exact spans.',
    'The edition records the statement as a candidate. A complete proof covering its full scope has not been verified.'],
  ['1041 component chain handoff already contains exact joined/follow-on blocks. 1049 now selects exact 002970; retain existing writer queue and proof order.',
    'The edition records a gap in the proof of the original statement.'],
]);
const gapDescription = step => gapDescriptions.get(step) ?? step;

function tagPage(row, record, chapter, fixed, gap, scopes, archivedProof, historical, proofLocation, policy, suppressed = []) {
  const title = row.title;
  const status = policy ? (policy.status==='external-assumption' ? 'Conditional argument' : 'Open proof obligation') :
    (record?.proof != null ? row.coverage.replace(' · HTML export unavailable','') : row.coverage);
  const trail = crumb([[project,'Foundations'],[contentsRoute,'Table of contents'],
    ...(chapter ? [[chapter.route,heading(chapter.number,chapter.title)]] : []),
    ...(record?.section && record.section!=='*' ? [[chapter.route+'#'+record.sectionId,record.section]] : []),[null,row.id]]);
  const archive = fixed+'r/'+row.id+'/';
  const location = record ? link(record.href,'Read in chapter') : link(coverageRoute+(gap ? '#open-'+row.id : ''),'Coverage register');
  let statement = '';
  let proof = '';
  if (record?.index != null) {
    // The statement and adjacent proof come from the same English source block as the chapter.
    // Remove their self-links because this page is already the Tag permalink.
    statement = suppressTags(chapter.blocks[record.index], [row.id, ...suppressed]);
    if (record.inlineProof) statement = linkProofParagraphs(statement);
    else if (record.proof != null) proof = linkProofParagraphs(chapter.blocks.slice(record.proof,record.proofEnd+1).join(''));
    else if (record.kind !== 'definition') statement += `<p class="book-note">${link(record.href,'Read the surrounding argument in the chapter')}.</p>`;
    if (record.companion) proof += `<p class="book-note">${link(record.companion,'Read the companion argument')}</p>`;
  } else if (historical) {
    statement = '<h2>Historical statement</h2>' + historical.html;
  } else {
    if (record?.excerpt != null) statement = chapter.blocks[record.excerpt];
    statement += `<p>${record ? 'This Tag identifies a passage in the book.' : 'Read the historical record for this Tag in the fixed edition.'}</p>`;
  }
  const gapNote = gap ? `<aside class="tag-gap-note" id="open-status"><h2>Historical proof gap</h2><p>${escape(gapDescription(gap.step))}</p>
    ${gap.narrower ? '<p>A selected argument is available for a narrower scope.</p>' : ''}
    <p>${link(coverageRoute+'#open-'+row.id,'Find this Tag in the coverage register')}</p></aside>` : '';
  const selected = scopes?.length ? `<section><h2>Selected scopes</h2><ul>${scopes.map(scope=> {
    const fragment=scope.href.split('#')[1];
    return `<li id="${escape(fragment)}">${link(archive+'#'+fragment,scope.label)}</li>`;
  }).join('')}</ul></section>` : '';
  const includesProof = record?.inlineProof;
  const sourceProof = archivedProof && record?.proof == null && !includesProof ? `<p class="book-note" id="foundations-exact-proof">${link(archive+'#foundations-exact-proof','Selected proof in the fixed edition')}</p>` : '';
  const statementId = includesProof ? 'foundations-exact-proof' : 'tag-statement';
  const proofLabel = gap ? 'Argument in the manuscript' : 'Proof';
  return shell(row.link,row.id+' · '+title,`${trail}<p class="tag-permalink">Tag ${escape(row.id)}</p><h1>${escape(title)}</h1>
    ${gap ? `<p class="chapter-open-count has-open">${link('#open-status',gapLabel)}</p>` : `<p class="tag-status">${escape(status)}</p>`}
    <nav class="tag-actions" aria-label="Tag links">${location}
    ${record?.proof != null || includesProof || sourceProof ? link('#foundations-exact-proof',proofLabel) : ''}
    ${proofLocation ? link(proofLocation,'Proof in chapter') : ''}${link('#citation','Citation')}</nav>
    ${gapNote}${sourcePolicyNotice(policy)}
    <article class="book-text tag-text"><div class="tag-statement" id="${statementId}">${historical ? statement : typesetTag(statement)}</div>
    ${proof ? `<section class="tag-argument" id="foundations-exact-proof" aria-label="${proofLabel}">${gap ? `<h2>${proofLabel}</h2>` : ''}${typesetTag(proof)}</section>` : ''}</article>
    ${sourceProof}${selected}
    <section id="citation" class="tag-citation"><h2>Citation</h2><p>Non-Archimedean Geometry Foundations, Tag ${escape(row.id)}${record?.number ? ', '+escape(record.number) : ''}.</p>
    <p>${link(row.link,'Permanent link')} · ${link(archive,'Fixed-edition record')}</p></section>`,proofStyles);
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
    const tagLinks=tags.length ? tags.map(row=>link(row.link+'#foundations-exact-proof',row.id)).join(' ') : link(route,tag+' · Proof Tag');
    proofs.set(range.index,{...range,tag,route,href:chapter.route+'#'+anchor,anchor,title,tagLinks,tags,section});
  }
  return proofs;
}

function manuscriptTagPage(proof, chapter, review) {
  const text = linkProofParagraphs(chapter.blocks.slice(proof.index,proof.end+1).join(''));
  const trail = crumb([[project,'Foundations'],[contentsRoute,'Table of contents'],[chapter.route,heading(chapter.number,chapter.title)],[null,proof.tag]]);
  return shell(proof.route,proof.tag+' · '+proof.title,`${trail}<p class="tag-permalink">Proof Tag ${proof.tag}</p><h1>${escape(proof.title)}</h1>
    <nav class="tag-actions" aria-label="Proof Tag links">${link(proof.href,'Read in chapter')}
      ${proof.tags.map(row=>link(row.link,'Result '+row.id)).join('')}</nav>
    ${sourcePolicyNotice(review?.policy)}<article class="book-text tag-text">${typesetTag(text)}</article>`,proofStyles);
}

function manuscriptResultPage(result, dependencies) {
  const {chapter,index,proof}=result;
  const trail=crumb([[project,'Foundations'],[contentsRoute,'Table of contents'],[chapter.route,heading(chapter.number,chapter.title)],[null,result.id]]);
  const state=dependencies.policyByBlock.get(`${chapter.key}:${index}`);
  const statement=chapter.blocks[index];
  const argument=proof ? linkProofParagraphs(chapter.blocks.slice(proof.index,proof.end+1).join('')) : '';
  return shell(result.route,result.id+' · '+result.title,`${trail}<p class="tag-permalink">Result ${escape(result.id)}</p>
    <h1>${escape(result.title)}</h1><nav class="tag-actions" aria-label="Result links">${link(result.book,'Read in chapter')}
      ${proof ? link('#foundations-exact-proof','Proof') : ''}</nav>
    ${sourcePolicyNotice(state)}<article class="book-text tag-text"><div class="tag-statement">${typesetTag(statement)}</div>
      ${argument ? `<section class="tag-argument" id="foundations-exact-proof" aria-label="Proof">${typesetTag(argument)}</section>` : ''}</article>`,proofStyles);
}

function supplementPage(entry, archive) {
  const trail = crumb([[project,'Foundations'],[contentsRoute,'Table of contents'],[null,entry.title]]);
  const sealed = archive.match(/<main id="main">[\s\S]*?<\/h1>([\s\S]*?)<\/main>/)[1]
    .replace(/<p><a href="[^" ]*\/reader-en\.pdf[^" ]*">Chapter in the English reader<\/a><\/p>/, '')
    .replace(/<p class="logic-inline">[\s\S]*?<\/p>/g, '');
  return shell(entry.route,entry.title,`${trail}<h1>${escape(entry.title)}</h1>
    <p class="chapter-coverage">${chapterCount(entry)}</p><div class="supplement-records">${sealed}</div>`);
}

export function createFoundationsNative(release, dependencies) {
  const readingLocations = foundationsReadingLocations(release.native);
  const {tags, destinations} = readingLocations;
  const native = {...release.native, tags};
  const coverage = foundationsCoverage({...release, native}, dependencies.policyByBlock);
  const fixed = project + 'editions/' + release.current.edition + '/';
  const pages = new Map([[nativeReaderRoute,bookContents(native,fixed,nativeReaderRoute,coverage)],
    [contentsRoute,bookContents(native,fixed,contentsRoute,coverage)],
    [coverageRoute,coveragePage(coverage,fixed)]]);
  for (const chapter of coverage.chapters.values()) {
    pages.set(chapterCoverageRoute(chapter),chapterCoveragePage(chapter,coverage,dependencies.resultByBlock));
    if (!chapter.native) pages.set(chapter.route,supplementPage(chapter,release.contents.get(chapter.route.slice(1)+'index.html').toString('utf8')));
  }
  const scopes = new Map();
  for (const node of Object.values(release.graph.nodes)) {
    if (node.href.includes('#') && node.href.startsWith(tagRoute(node.id))) {
      if (!scopes.has(node.id)) scopes.set(node.id,[]);
      scopes.get(node.id).push(node);
    }
  }
  const linkedProofs = new Map();
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
    pages.set(chapter.route,chapterPage(chapter,native.catalogue,proofs,dependencies,coverage,readingLocations));
    for (const proof of proofs.values()) {
      if (proof.tags.length) {
        for (const tag of proof.tags) locations.set(tag.id,proof.href);
      }
      const key=`${chapter.key}:${proof.index}`;
      if(!proof.tags.length || priorProofTags.has(key) || readingLocations.restoredProofs.has(key)) {
        pages.set(proof.route,manuscriptTagPage(proof,chapter,dependencies.byProof.get(key)));
      }
    }
  }
  for(const result of dependencies.results.values())pages.set(result.route,manuscriptResultPage(result,dependencies));
  for (const row of release.rows) {
    const record = native.tags[row.id];
    const archivedProof = release.contents.get(row.link.slice(1)+'index.html').includes('id="foundations-exact-proof"');
    pages.set(row.link,tagPage(row,record,native.byKey.get(record?.key),fixed,coverage.gaps.get(row.id),
      scopes.get(row.id),archivedProof,release.historicalStatements?.[row.id],locations.get(row.id),
      dependencies.byId.get(row.id)?.policy ?? dependencies.policyByBlock.get(`${record?.key}:${record?.index}`),
      readingLocations.suppressed.get(`${record?.key}:${record?.index}`)));
  }
  const remarkNumbers = foundationsRemarkNumbers(native.destinations);
  const referenceLabels = foundationsReferenceLabels(native);
  for (const [route, page] of pages) pages.set(route, editFoundationsReadingHtml(page, remarkNumbers, referenceLabels));
  return {pages,tags,destinations};
}
