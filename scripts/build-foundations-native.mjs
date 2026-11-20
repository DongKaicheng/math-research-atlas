import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import katex from 'katex';
import {foundationsBookmark, linkProofParagraphs, sourcePolicyNotice} from './build-foundations-web.mjs';
import {foundationsCoverage, gapCount} from './foundations-reading-status.mjs';
import {editFoundationsReadingHtml, foundationsReferenceLabels, foundationsRemarkNumbers} from './foundations-reading-editor.mjs';
import {foundationsReadingLocations} from './foundations-reading-locations.mjs';
import {closureGroup, coverageGroups, groupLabels, registerFoundationsTags, statusLabels, tagRoute} from './foundations-tag-register.mjs';
import {contentsRoute, coverageRoute, escape, foundationsPdfLink, foundationsSearchForm, foundationsShell, guideRoute, link, project, searchRoute} from './foundations-layout.mjs';
import {foundationsGuide, shortStatus} from './foundations-guide.mjs';
import {readingText, statementTitle} from './build-foundations-dependencies.mjs';

export const nativeReaderRoute = project + 'reader/';
const chapterCoverageRoute = chapter => coverageRoute+'chapters/'+chapter.slug+'/';
const proofTagsRoute = project + 'proof-tags/';
const heading = (number, title) => [number, title].filter(Boolean).join(' · ');
const unsafeMarkup = /<(?:script|iframe|object|embed|style|form)\b|<[^>]*\son[a-z]+\s*=|(?:href|src)="(?:javascript|data):/i;
const privateMaterial = /(?:\/workspace\/|\/home\/agent\/|[A-Z]:\\Users\\|libfile_|private_library_readback|BEGIN [A-Z ]*PRIVATE KEY)/i;
const tagId = /^NAG-\d{6}$/;
const entities = {amp:'&',lt:'<',gt:'>',quot:'"','#x27':"'",'#39':"'"};
const mathStyles = '<link rel="stylesheet" href="/assets/katex.min.css">';
const complexMath = /mathvariant="(?!normal")|<(?:mfrac|msqrt|mroot|mtable|mover|munder|munderover|mphantom|mpadded|mstyle)\b/;
const chapterSlug = route => route.startsWith(project + 'chapters/') ? route.split('/').at(-2) : null;
const gapLabel = 'Open at full scope';
const suppressTags = (html, ids = []) => ids.reduce((text,id) => text.replaceAll(link(tagRoute(id), id), ''), html);

function typesetReadingMath(page, cache, route) {
  if (!page.includes('class="katex"')) return page;
  const tag = tagId.test(route.split('/').at(-2));
  // A chapter can have thousands of short inline expressions. Keep its simple MathML
  // compact and typeset the displays, font variants and layout-sensitive formulas.
  const rendered = page.replace(/<span class="katex"><math([^>]*)>[\s\S]*?<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation><\/semantics><\/math><\/span>/g,
    (math, attrs, source) => {
      const displayMode = attrs.includes('display="block"');
      if (!tag && !displayMode && !complexMath.test(math)) return math;
      const key = (displayMode ? 'display:' : 'inline:') + source;
      if (!cache.has(key)) {
        const tex = source.replace(/&(amp|lt|gt|quot|#x27|#39);/g, (all, name) => entities[name]);
        try {
          cache.set(key, katex.renderToString(tex, {output:'htmlAndMathml', displayMode, strict:'ignore', trust:false}));
        } catch (error) {
          throw new Error(`Cannot typeset Foundations formula on ${route}: ${error.message}`, {cause:error});
        }
      }
      return cache.get(key);
    });
  return rendered.replace('</head>', mathStyles + '</head>');
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

const shorten = (text, limit) => {
  text = String(text).replace(/\s+/g,' ').trim();
  if (text.length <= limit) return text;
  const prefix = text.slice(0, limit - 1);
  return prefix.slice(0, Math.max(prefix.lastIndexOf(' '), Math.floor(limit * .7))).replace(/[\s,;:·–—-]+$/,'') + '…';
};

// These summaries describe the current reading page, not a new proof judgment.
// MathML (including its TeX annotation) is omitted from snippets by readingText.
const shell = (route,title,body,extra = '',layout = '',description = '') => foundationsShell(route,title,body,
  {extra,layout,description:description || `${title}. Read the mathematical text, source links and proof-status notes in Non-Archimedean Geometry Foundations.`});

const metadataStatement = html => html.replace(/<math\b[^>]*>([\s\S]*?)<\/math>/g,(_,math) =>
  math.replace(/<annotation\b[^>]*>[\s\S]*?<\/annotation>/g,'').replace(/<[^>]+>/g,''));

function chapterDescription(chapter) {
  const topics = chapter.sections.filter(section => section.level === 2 && section.title !== '*')
    .map(section => readingText(section.title)).slice(0, 3);
  const subject = heading(chapter.number, readingText(chapter.title));
  return shorten(`${subject}${topics.length ? ': ' + topics.join('; ') : ''}. Read the chapter and its permanent NAG Tags in OpenMath Foundations.`, 280);
}

function tagMetadata(row, record, chapter, statement) {
  const generic = /^(?:(?:result|theorem|lemma|proposition|corollary|definition|example|remark|question|construction)(?:\s+[\dA-Z][\dA-Z.]*)?|NAG-\d{6})\.?$/i.test(row.title.trim());
  const named = record?.kind ? statementTitle(metadataStatement(statement), record.kind).title : '';
  const section = record?.section && !/^(?:\*|proof(?: of .*)?[.:]?)$/i.test(record.section) ? readingText(record.section) : '';
  const sourceTitle = row.title.includes('[formula]') && named ? named : row.title;
  const subject = generic ? named.includes(' · ') ? named : `${row.title}${section || chapter?.title ? ' · ' + (section || readingText(chapter.title)) : ''}` : sourceTitle;
  const title = `${row.id} · ${shorten(subject, 140)}`;
  const status = statusLabels[row.status];
  // A formula-free first sentence can convey the subject more precisely without
  // repeating TeX or treating a displayed statement as an accepted theorem.
  const text = readingText(statement).replace(/^Historical statement\s*/, '')
    .replace(/^(?:Theorem|Lemma|Proposition|Corollary|Definition|Example|Remark|Question|Construction)\s+[A-Z\d][A-Z\d.]*\s*/i, '')
    .replace(/^(?:NAG-\d{6}\s*)?[.\s]*/, '')
    .replace(/^\([^)]*\)\.\s*/, '');
  const sentence = text.match(/^([^.!?]{35,170}[.!?])(?:\s|$)/)?.[1];
  const excerpt = sentence && !sentence.includes('[formula]') && !sentence.includes('\\') ? sentence : '';
  const description = `${row.id}: ${shorten(subject, 130)}. ${status}. ${excerpt ? 'Statement: ' + excerpt : 'Statement, source context and proof notes in OpenMath Foundations.'}`;
  return {title, description:shorten(description, 320)};
}

function crumb(links) {
  return '<nav class="book-crumb" aria-label="Breadcrumb"><ol>' + links.map(([route,title]) =>
    '<li>' + (route ? link(route,title) : '<span aria-current="page">'+escape(title)+'</span>') + '</li>').join('') + '</ol></nav>';
}

const plural = (count, singular, pluralForm = singular+'s') => `${count} ${count === 1 ? singular : pluralForm}`;
function chapterCount(entry, detailed = false) {
  if (!entry) return '';
  const coverage = chapterCoverageRoute(entry);
  const counts = [link(coverage,plural(entry.tags.length,'NAG Tag'))];
  if (!detailed) return `<span class="chapter-open-count">${counts[0]}</span>`;
  const open = entry.tagCounts.open;
  if (open) counts.push(link(coverage+'#tags-open',plural(open,'open Tag')));
  if (entry.tagCounts.conditional) counts.push(link(coverage+'#tags-conditional',plural(entry.tagCounts.conditional,'conditional Tag')));
  if (entry.tagCounts.comparison) counts.push(link(coverage+'#tags-comparison',plural(entry.tagCounts.comparison,'comparison Tag')));
  return `<span class="chapter-open-count${open ? ' has-open' : ''}">${counts.join(' · ')}</span>`;
}

function bookContents(native, route, coverage, pdf) {
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
  const body = groups.map(({title,items,note}, i) => `<section class="contents-group" aria-labelledby="part-${i}" id="group-${i}">
    <div class="contents-group-title"><h2 id="part-${i}">${escape(title)}</h2>${note ? link(note,'Part overview') : ''}</div>
    <ul class="book-chapters">${items.map(entry => `<li><div class="book-chapter-entry">${link(entry.route,heading(entry.number,entry.title))}${chapterCount(coverage.chapters.get(chapterSlug(entry.route)))}</div>
      ${entry.sections.length ? `<details><summary>${entry.sections.length} sections</summary><ul>${entry.sections.map(section =>
        `<li>${link(entry.route+'#'+section.id,heading(section.number,section.title))}</li>`).join('')}</ul></details>` : ''}</li>`).join('')}</ul></section>`).join('');
  const jumps = `<aside class="book-sidebar"><details data-desktop-open><summary>Parts</summary><nav aria-label="Parts"><ul>${groups.map(({title},i)=>`<li>${link('#group-'+i,title)}</li>`).join('')}
    <li>${link('/projects/foundations/chapters/appendix-a/#bibliography','Bibliography')}</li>
    <li>${link('/projects/foundations/chapters/appendix-a/#subject-index','Subject index')}</li></ul></nav></details></aside>`;
  const script = route === nativeReaderRoute ? '<script type="module" src="/assets/foundations-native-reader.js"></script>' : '';
  return shell(route,'Table of contents',`<header class="page-intro"><h1>Table of contents</h1>${foundationsPdfLink(pdf)}</header>
    <p id="reader-location" hidden></p><div class="book-layout has-sidebar">${jumps}<div class="contents-text">${body}</div></div>`,script,'contents-page',
    `${route === nativeReaderRoute ? 'Reader navigation' : 'Table of contents'} for Non-Archimedean Geometry Foundations: valued fields, Berkovich spaces, formal models, tropicalization, forms and currents.`);
}

function partChapterOutline(chapter, index, catalogue, coverage) {
  if (!chapter.route.includes('/part-')) return '';
  const entries = [];
  for (const entry of catalogue.slice(index+1)) {
    if (!/^\d+$/.test(entry.number ?? '')) break;
    entries.push(`<li><div class="book-chapter-entry">${link(entry.route,heading(entry.number,entry.title))}${chapterCount(coverage.chapters.get(chapterSlug(entry.route)),true)}</div></li>`);
  }
  return `<section class="part-chapter-coverage"><h2>Chapters and proof coverage</h2><ul class="book-chapters">${entries.join('')}</ul></section>`;
}

function chapterPage(chapter, catalogue, proofs, dependencies, coverage, locations, registry) {
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
  const sectionMenu = sections.length ? `<details data-desktop-open><summary>In this chapter</summary><nav aria-label="Chapter sections"><ul>${sections.map(section =>
    `<li>${link('#'+section.id,heading(section.number,section.title))}</li>`).join('')}</ul></nav></details>` : '';
  const indexEntries = [...proofs.values()].map(proof=>`<li>${link('#'+proof.anchor,proof.title)} ${proof.tagLinks}</li>`).join('');
  const proofIndex = indexEntries ? `<details class="chapter-proof-index" id="chapter-proofs"><summary>Proofs in this chapter (${proofs.size})</summary><ol>${indexEntries}</ol></details>` : '<span id="chapter-proofs"></span>';
  const menu = sectionMenu || indexEntries ? `<aside class="book-sidebar">${sectionMenu}${proofIndex}</aside>` : '';
  const body = chapter.blocks.map((block,i)=> {
    const key = `${chapter.key}:${i}`;
    const proof=proofs.get(i);
    const note=coverage.sourceNotes.get(key);
    const review=coverage.reviewMarkers.get(key);
    const policy=dependencies.policyByBlock.get(key);
    const locator=policy?.anchor.split('#')[1];
    const notice=policy ? `<div id="${escape(locator)}">${sourcePolicyNotice(policy)}</div>` : '';
    const id = registry.byBlock.get(key) ?? locations.restored.get(key);
    const sourceId = registry.sourceAliases.get(key);
    const result = registry.tags.get(id);
    const manuscript = registry.records.get(id);
    const resultLink = result ? `<p class="book-result-link"${manuscript?.generatedAnchor ? ` id="${manuscript.generatedAnchor}"` : ''}>${link(result.link,result.id)}
      <small class="book-tag-status${result.status === 'open' ? ' book-source-open' : ''}">${escape(statusLabels[result.status])}</small></p>` : '';
    const open = coverage.byBlock.get(key) ?? [];
    const gapMarks = open.length ? `<p class="book-gap-marks">${open.map(gap => link(gap.route+'#open-status', gap.id+' · '+gapLabel)).join(' ')}</p>` : '';
    const proofLink = !proof ? '' : proof.tagLinks ? `<div class="chapter-proof-links" id="${proof.anchor}" role="group" aria-label="Tag links for this proof">${proof.tagLinks}</div>` : `<span id="${proof.anchor}"></span>`;
    block = suppressTags(block, locations.suppressed.get(key));
    const sourceBlock = locator ? block.replace(` id="${locator}"`,'') : block;
    const reviewLink = review ? `<p class="reviewed-proof-passage" id="${review.href.split('#')[1]}">${link(tagRoute(sourceId),sourceId+' · '+statusLabels[review.status])}</p>` : '';
    const wrapped = note ? `<div class="source-proof-note" id="${note.href.split('#')[1]}">${sourceBlock}<p>${link(tagRoute(sourceId),sourceId+' · Proof status')}</p></div>` : sourceBlock;
    return notice+resultLink+gapMarks+reviewLink+proofLink+wrapped;
  }).join('');
  return shell(chapter.route,title,`${trail}<header class="page-intro"><h1>${escape(title)}</h1>${count ? `<p class="chapter-coverage">${count}</p>` : ''}</header>${menu ? '' : proofIndex}
    <div class="book-layout${menu ? ' has-sidebar' : ''}">${menu}<article class="book-text" aria-label="${escape(chapter.title)}">${body}</article></div>${part}${nav}`,'','reading-page',chapterDescription(chapter));
}

function coveragePage(coverage, fixed) {
  const chapters = [...coverage.chapters.values()];
  const total = group => chapters.reduce((sum,chapter) => sum + chapter.tagCounts[group],0);
  const count = chapters.reduce((sum,chapter) => sum + chapter.tags.length,0);
  const cell = (count,group,label,href) => `<td data-count="${group}" data-label="${label}"${count ? '' : ' class="count-zero"'}>${href && count ? link(href,String(count)) : count}</td>`;
  const table = chapters.map(chapter => {
    const detail = chapterCoverageRoute(chapter);
    return `<tr id="chapter-${chapter.slug}" role="row"><th scope="row">${link(detail,chapter.title)}</th>
      ${cell(chapter.tags.length,'tags','Tags',detail)}${coverageGroups.map(group=>cell(chapter.tagCounts[group],group,groupLabels[group],detail+'#tags-'+group)).join('')}</tr>`;
  }).join('');
  const historical = chapters.filter(chapter=>chapter.gaps.length).map(chapter=>`<section id="gaps-${chapter.slug}">
    <h3>${escape(chapter.title)}</h3><ul class="coverage-list">${chapter.gaps.map(gap=>`<li id="open-${gap.id}">${link(gap.route,gap.id+' · '+gap.label)}</li>`).join('')}</ul></section>`).join('');
  return shell(coverageRoute,'Tag index',`<header class="page-intro"><h1>Tag index</h1>
    <p class="page-lead">Browse ${count.toLocaleString('en-US')} permanent Tags by chapter and proof status.</p>
    <p class="page-actions">${link(guideRoute+'#proof-statuses','What each status means')}</p></header>
    <section id="chapter-counts"><span id="manuscript-obligations"></span><h2 class="coverage-heading">By chapter</h2><table class="coverage-table" role="table" aria-label="Tags by chapter and proof status"><thead role="rowgroup"><tr role="row"><th scope="col">Chapter or supplement</th><th scope="col">Tags</th>${coverageGroups.map(group=>`<th scope="col">${groupLabels[group]}</th>`).join('')}</tr></thead>
    <tbody role="rowgroup">${table}</tbody><tfoot role="rowgroup"><tr role="row"><th scope="row">Total</th>${cell(count,'tags','Tags')}${coverageGroups.map(group=>cell(total(group),group,groupLabels[group])).join('')}</tr></tfoot></table></section>
    <details class="historical-register" id="historical-proof-gaps"><summary>Historical proof gaps</summary><p>${gapCount(coverage.gaps.size)} from the fixed edition, including ${coverage.narrower} with a narrower scope available. ${link(fixed+'coverage/','Fixed-edition register')}</p>${historical}</details>`,'','coverage-page',
    `Browse ${count.toLocaleString('en-US')} permanent NAG Tags by chapter and proof status in Non-Archimedean Geometry Foundations, including open and conditional statements.`);
}

function chapterCoveragePage(chapter) {
  const route = chapterCoverageRoute(chapter);
  const trail = crumb([[coverageRoute,'Tag index'],[null,chapter.title]]);
  const groups = ['open','conditional','comparison','pending','closed','definition'];
  const scoped = new Set(['open','conditional','comparison']);
  const lists = groups.map(group=>{
    const rows = chapter.tags.filter(row=>closureGroup(row.status)===group);
    const title = groupLabels[group]+' ('+rows.length+')';
    const list = `<ul class="tag-register-list">${rows.map(row=>`<li data-tag-status="${row.status}"><a href="${row.link}"><span class="tag-id">${row.id}</span>${row.title!==row.id ? `<span>${escape(row.title)}</span>` : ''}</a>
      ${row.types.length ? `<small>${escape(row.types.join(' · '))}</small>` : ''}</li>`).join('')}</ul>`;
    if (!rows.length) return `<span id="tags-${group}"></span>`;
    return scoped.has(group) ? `<section id="tags-${group}"><h2>${title}</h2>${list}</section>` : `<details class="tag-coverage-list" id="tags-${group}"><summary>${title}</summary>${list}</details>`;
  }).join('');
  return shell(route,chapter.title+' · Tags',`${trail}<header class="page-intro"><h1>${escape(chapter.title)}</h1>
    <p id="tag-inventory" class="page-actions">${link(chapter.route,'Read the chapter')}<span>${plural(chapter.tags.length,'Tag')}</span></p></header>
    <nav class="page-links" aria-label="Tag status groups">${groups.filter(group=>chapter.tagCounts[group]).map(group=>link('#tags-'+group,`${groupLabels[group]} (${chapter.tagCounts[group]})`)).join('')}</nav>
    <span id="manuscript-findings"></span><span id="untagged-statements"></span>${lists}`,'','chapter-tags-page',
    shorten(`${chapter.title}: ${plural(chapter.tags.length,'permanent NAG Tag')} with source links and separate open, conditional, accepted-scope and definition records.`, 280));
}

function searchPage() {
  return shell(searchRoute,'Search Foundations',`<header class="page-intro"><h1>Search Foundations</h1></header>
    ${foundationsSearchForm({formId:'site-search'})}<div id="search-results" class="foundation-search-results"></div>`,
    '<meta name="robots" content="noindex,follow"><script defer src="/assets/foundations-search.js"></script>','search-page',
    'Search the current Non-Archimedean Geometry Foundations by mathematical keyword, statement title or permanent NAG Tag.');
}
const gapDescriptions = new Map([
  ['Pinned English candidate. This sweep did not bind an independently signed whole proof and operative scope map for these exact spans.',
    'The edition records the statement as a candidate. A complete proof covering its full scope has not been verified.'],
  ['1041 component chain handoff already contains exact joined/follow-on blocks. 1049 now selects exact 002970; retain existing writer queue and proof order.',
    'The edition records a gap in the proof of the original statement.'],
]);
const gapDescription = step => gapDescriptions.get(step) ?? step;

function tagPage(row, {record, chapter, fixed, gap, scopes, archivedProof, historical, proofLocation, policy, suppressed = [], manuscript, guide}) {
  const title = row.title;
  const trail = crumb([[chapter?.route ?? coverageRoute,chapter ? heading(chapter.number,chapter.title) : 'Tag index']]);
  const archive = fixed+'r/'+row.id+'/';
  const location = record ? link(record.href,'Read in chapter') : link(coverageRoute+(gap ? '#open-'+row.id : ''),'Find in Tag index');
  let statement = '';
  let proof = '';
  if (record?.index != null) {
    // The statement and adjacent proof come from the same English source block as the chapter.
    // Remove their self-links because this page is already the Tag permalink.
    statement = suppressTags(chapter.blocks[record.index], [row.id, ...suppressed]);
    if (record.inlineProof) statement = linkProofParagraphs(statement);
    else if (record.proof != null) proof = linkProofParagraphs(chapter.blocks.slice(record.proof,record.proofEnd+1).join(''));
    if (record.companion) proof += `<p class="book-note">${link(record.companion,'Read the companion argument')}</p>`;
  } else if (historical) {
    statement = '<h2>Historical statement</h2>' + historical.html;
  } else {
    if (record?.excerpt != null) statement = chapter.blocks[record.excerpt];
    statement += `<p>${record ? 'This Tag identifies a passage in the book.' : 'Read the historical record for this Tag in the fixed edition.'}</p>`;
  }
  const gapNote = gap ? `<div id="open-status"><h3>Historical proof gap</h3><p>${escape(gapDescription(gap.step))}</p></div>` : '';
  const finding = row.finding;
  const proofEvidence = finding?.notes.map(note => `<li>${link(note.href, 'Chapter '+note.source.number+' note ('+note.kind+')')}</li>`).join('');
  const kinds = row.types.length ? `<dl class="tag-types"><dt>Problem types</dt><dd>${row.types.map(guide.typeLink).join(' · ')}</dd></dl>` : '';
  const evidence = finding ? `${finding.summary ? `<p>${escape(finding.summary)}</p>` : ''}
    ${finding.notes.map(note=>note.source.blocks[note.index].replace(/^<p><strong>Open proof obligation \(RC[23]\)\.<\/strong>\s*/, '<p>')).join('')}
    ${proofEvidence ? `<ul>${proofEvidence}</ul>` : `<p>${link(finding.href,'Read the source passage')}</p>`}` : '';
  const hasContext = Boolean(kinds || evidence || gap || policy);
  const statusDetails = hasContext ? `<aside class="tag-closure" id="closure"><h2>Proof notes</h2>${kinds}
    ${row.status === 'pending' ? `<p>${record?.proof != null ? 'A manuscript argument is available for review.' : 'The location or full scope of the argument remains to be verified.'}</p>` : ''}${evidence}${gapNote}${sourcePolicyNotice(policy)}</aside>` : '<span id="closure"></span>';
  const selected = scopes?.length ? `<details class="tag-scopes"><summary>Selected scopes (${scopes.length})</summary><ul>${scopes.map(scope=> {
    const fragment=scope.href.split('#')[1];
    return `<li id="${escape(fragment)}">${link(archive+'#'+fragment,scope.label)}</li>`;
  }).join('')}</ul></details>` : '';
  const includesProof = record?.inlineProof;
  const sourceProof = archivedProof && record?.proof == null && !includesProof ? `<p class="book-note" id="foundations-exact-proof">${link(archive+'#foundations-exact-proof','Selected proof in the fixed edition')}</p>` : '';
  const statementId = includesProof ? 'foundations-exact-proof' : 'tag-statement';
  const proofLabel = row.status === 'closed' ? 'Proof' : 'Argument in the manuscript';
  const hasArgument = record?.proof != null || includesProof || sourceProof;
  const citationSources = [proofLocation ? link(proofLocation,'Proof in chapter') : '', manuscript ? '' : link(archive,'Fixed-edition record')].filter(Boolean).join(' · ');
  const metadata = tagMetadata(row,record,chapter,statement);
  return shell(row.link,metadata.title,`${trail}<header class="page-intro tag-header"><div class="tag-heading-meta">
    <p class="tag-permalink">${escape(row.id)}</p><p class="tag-status" data-closure="${row.status}">${guide.statusLink(row.status,shortStatus[row.status])}</p></div>
    <h1>${escape(title)}</h1><nav class="tag-actions page-actions" aria-label="Tag links">
    ${hasArgument ? `<a class="reading-action" href="#foundations-exact-proof">${proofLabel}</a>` : ''}${location}
    ${hasContext ? link('#closure','Proof notes') : ''}</nav></header>
    <article class="book-text tag-text${hasContext ? ' with-context' : ''}"><div class="tag-statement" id="${statementId}">${statement}</div>
    ${statusDetails}${proof ? `<section class="tag-argument" id="foundations-exact-proof" aria-label="${proofLabel}"><h2>${proofLabel}</h2>${proof}</section>` : ''}</article>
    ${sourceProof}${selected}
    <section id="citation" class="tag-citation"><h2>Citation</h2><p>Non-Archimedean Geometry Foundations, ${link(row.link,'Tag '+row.id)}${record?.number ? ', '+escape(record.number) : ''}.</p>
    ${citationSources ? `<p>${citationSources}</p>` : ''}</section>`,'','tag-page',metadata.description);
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
    const tagLinks=tags.map(row=>link(row.link+'#foundations-exact-proof',row.id)).join(' ');
    proofs.set(range.index,{...range,tag,route,href:chapter.route+'#'+anchor,anchor,title,tagLinks,tags,section});
  }
  return proofs;
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
  const registry = registerFoundationsTags(release,coverage,dependencies,native);
  const guide = foundationsGuide(release);
  const rows = [...registry.tags.values()];
  const redirects = new Map();
  const fixed = project + 'editions/' + release.current.edition + '/';
  const pdf = release.meta.reader.path;
  const pages = new Map([[nativeReaderRoute,bookContents(native,nativeReaderRoute,coverage,pdf)],
    [contentsRoute,bookContents(native,contentsRoute,coverage,pdf)],
    [coverageRoute,coveragePage(coverage,fixed)],[guideRoute,guide.page],[searchRoute,searchPage()]]);
  for (const chapter of coverage.chapters.values()) {
    pages.set(chapterCoverageRoute(chapter),chapterCoveragePage(chapter));
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
  for (const row of rows) {
    const record=registry.tagLocations[row.id];
    if (record?.proof == null) continue;
    if (!linkedProofs.has(record.key)) linkedProofs.set(record.key,new Map());
    const links=linkedProofs.get(record.key);
    if (!links.has(record.proof)) links.set(record.proof,[]);
    links.get(record.proof).push(row);
  }
  const locations = new Map();
  const priorProofTags=new Set(release.dependencyReview.bindings.filter(binding=>!binding.inline).map(binding=>binding.proof));
  const oldProofs=new Set(Object.values(native.tags).filter(record=>record.proof!=null).map(record=>`${record.key}:${record.proof}`));
  for (const chapter of native.chapters.values()) {
    const proofs=bindProofs(native,chapter,linkedProofs.get(chapter.key) ?? new Map());
    pages.set(chapter.route,chapterPage(chapter,native.catalogue,proofs,dependencies,coverage,readingLocations,registry));
    for (const proof of proofs.values()) {
      if (proof.tags.length) {
        for (const tag of proof.tags) locations.set(tag.id,proof.href);
      }
      const key=`${chapter.key}:${proof.index}`;
      if(!oldProofs.has(key) || priorProofTags.has(key) || readingLocations.restoredProofs.has(key)) {
        const binding = proof.tags.length === 1 ? proof.tags[0].link+'#foundations-exact-proof' : null;
        redirects.set(proof.route,foundationsBookmark(binding ?? proof.href, Boolean(binding)));
      }
    }
  }
  for (const result of dependencies.results.values()) {
    const id = registry.byBlock.get(`${result.chapter.key}:${result.index}`);
    if (!id) throw Error('A former result page does not resolve to a Tag: '+result.id);
    redirects.set(result.route,foundationsBookmark(tagRoute(id), Boolean(result.proof)));
    const row = registry.tags.get(id);
    row.keywords = [...new Set([...row.keywords, result.id])];
  }
  for (const row of rows) {
    const record = registry.tagLocations[row.id];
    const archivedProof = release.contents.get(row.link.slice(1)+'index.html')?.includes('id="foundations-exact-proof"');
    const key = `${record?.key}:${record?.index}`;
    const policy = row.finding ? null : (dependencies.byId.get(row.id)?.policy ?? dependencies.policyByBlock.get(key));
    pages.set(row.link,tagPage(row,{record,chapter:native.byKey.get(record?.key),fixed,gap:coverage.gaps.get(row.id),
      scopes:scopes.get(row.id),archivedProof,historical:release.historicalStatements?.[row.id],proofLocation:locations.get(row.id),
      policy,suppressed:readingLocations.suppressed.get(key),manuscript:registry.records.get(row.id),guide}));
  }
  const remarkNumbers = foundationsRemarkNumbers(native.destinations);
  const referenceLabels = foundationsReferenceLabels(native);
  const mathCache = new Map();
  for (const [route, page] of pages) {
    const edited = editFoundationsReadingHtml(page, remarkNumbers, referenceLabels);
    pages.set(route, typesetReadingMath(edited, mathCache, route));
  }
  const indexableRoutes = [...pages.keys()].filter(route => route !== searchRoute);
  return {pages,tags:registry.tagLocations,destinations,rows,redirects,indexableRoutes};
}
