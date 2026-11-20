import {createHash} from 'node:crypto';
import {readingText, statementTitle} from './build-foundations-dependencies.mjs';

const chapterPrefix = '/projects/foundations/chapters/';
const chapterRecord = /<li class="entry"><small>(NAG-\d{6})<\/small><a href="\/r\/\1\/"/g;
const proofNote = /^<p><strong>Open proof obligation \((RC[23])\)\.<\/strong>/;
const statement = /^<div class="(theorem|lemma|proposition|corollary|fthreeHStrictVal|fthreeHStrictGerm)">/;
const countedKinds = new Set(['theorem','lemma','proposition']);
const statementKinds = new Map([['fthreeHStrictVal','proposition'], ['fthreeHStrictGerm','corollary']]);
const compiledTitles = new Map([['fthreeHStrictVal','Proposition 3.HS.1'], ['fthreeHStrictGerm','Corollary 3.HS.2']]);
const keyAt = (chapter,index) => `${chapter.key}:${index}`;
const noteAnchor = index => `source-proof-obligation-${index}`;
const statementAnchor = index => `coverage-statement-${index}`;
const hash = html => createHash('sha256').update(html).digest('hex');

export function foundationsCoverage({graph, rows, native, meta, contents, proofCoverageReview}, policyByBlock) {
  const chapters = new Map(Object.entries(graph.chapters).map(([slug, title]) => {
    const route = chapterPrefix + slug + '/';
    return [slug, {slug, title, route, native: native.chapters.has(route), gaps: [], tags:[], manuscriptTags:[],
      statements:[], missing:[], open:[], conditional:[], comparisons:[]}];
  }));
  const byRoute = new Map([...chapters.values()].map(chapter => [chapter.route,chapter]));
  const rowById = new Map(rows.map(row => [row.id,row]));
  const registered = new Set();
  for (const chapter of chapters.values()) {
    const html = contents.get(chapter.route.slice(1)+'index.html').toString('utf8');
    for (const [,id] of html.matchAll(chapterRecord)) {
      if (!rowById.has(id) || registered.has(id)) throw Error('Duplicate or unknown chapter Tag ' + id);
      registered.add(id);
      chapter.tags.push(rowById.get(id));
    }
  }
  if (registered.size !== rows.length) throw Error('Foundations chapter Tag totals do not reconcile');
  const gaps = new Map();
  const byBlock = new Map();
  for (const row of rows) {
    const narrower = row.coverage === 'Selected narrower scope · historical proof gap';
    const open = narrower || row.coverage === 'Historical whole-proof gap';
    const entry = graph.gaps[row.id];
    if (Boolean(entry) !== open) throw Error('Foundations gap ledger differs from Tag status for ' + row.id);
    if (!open) continue;
    const chapter = chapters.get(entry.chapter);
    const location = native.tags[row.id];
    const gap = {...entry, id: row.id, route: row.link, label: row.title, narrower, location};
    gaps.set(row.id, gap);
    chapter.gaps.push(gap);
    if (location?.index != null) {
      const key = `${location.key}:${location.index}`;
      if (!byBlock.has(key)) byBlock.set(key, []);
      byBlock.get(key).push(gap);
    }
  }
  if (gaps.size !== meta.counts.historicalLedgerGaps || gaps.size !== Object.keys(graph.gaps).length) {
    throw Error('Foundations gap ledger does not reconcile with the web chapter bindings');
  }
  const tagBindings = new Map();
  for (const [id, record] of Object.entries(native.tags)) {
    const chapter = byRoute.get(native.byKey.get(record.key).route);
    if (chapter) chapter.manuscriptTags.push(id);
    if (record.index == null) continue;
    const key = `${record.key}:${record.index}`;
    if (!tagBindings.has(key)) tagBindings.set(key, []);
    tagBindings.get(key).push(id);
  }
  const statements = new Map();
  const missingByBlock = new Map();
  const sourceNotes = new Map();
  const noteEntries = [];
  for (const source of native.chapters.values()) {
    const chapter = byRoute.get(source.route);
    for (const [index,block] of source.blocks.entries()) {
      const key = keyAt(source,index);
      const rawKind = block.match(statement)?.[1];
      const note = block.match(proofNote)?.[1];
      if (note) {
        const noteEntry = {kind:note, key, source, index, href:source.route+'#'+noteAnchor(index)};
        sourceNotes.set(key, noteEntry);
        noteEntries.push(noteEntry);
      }
      if (!rawKind) continue;
      const kind = statementKinds.get(rawKind) ?? rawKind;
      const heading = statementTitle(block,kind);
      const numbered = native.destinations[`${kind}.${heading.number}`];
      const named = numbered?.startsWith(source.route+'#') ? numbered.split('#')[1] : null;
      const locator = named && block.includes(`id="${named}"`) ? named : block.match(/\bid="(label-[a-f0-9]+)"/)?.[1];
      const entry = {chapter, key, index, kind, tags:tagBindings.get(key) ?? [],
        title:compiledTitles.get(rawKind) ?? heading.title, href:source.route+'#'+(locator ?? statementAnchor(index)),
        generatedAnchor: locator ? null : statementAnchor(index)};
      statements.set(key,entry);
      if (!countedKinds.has(kind)) continue;
      if (!chapter) throw Error('Foundations statement outside the chapter inventory: ' + key);
      chapter.statements.push(entry);
      if (!entry.tags.length) {
        chapter.missing.push(entry);
        missingByBlock.set(key, entry);
      }
    }
  }

  const proofFindings = new Map();
  function recordFinding(key, chapter, fields) {
    const earlier = proofFindings.get(key);
    if (earlier && earlier.status !== fields.status) throw Error('Inconsistent proof coverage at '+key);
    if (!earlier) {
      const entry = {...fields, key, notes:[]};
      proofFindings.set(key,entry);
      chapter[fields.status === 'open' ? 'open' : fields.status === 'conditional' ? 'conditional' : 'comparisons'].push(entry);
    }
    return proofFindings.get(key);
  }

  const byHref = new Map([...statements.values()].map(entry => [entry.href,entry]));
  for (const note of noteEntries) {
    // RC2 follows the affected statement. The sole RC3 names its target first and is printed in a different chapter.
    const entry = note.kind === 'RC2' ? statements.get(keyAt(note.source,note.index-1)) :
      byHref.get(note.source.blocks[note.index].match(/\bhref="([^"]+)"/)?.[1]);
    if (!entry?.chapter) throw Error('Cannot locate the subject of the Foundations note ' + note.key);
    const finding = recordFinding(entry.key,entry.chapter,{title:entry.title, href:entry.href, status:'open', statement:entry});
    finding.notes.push(note);
  }
  for (const [key,finding] of policyByBlock) {
    const chapter = byRoute.get(finding.anchor.split('#')[0]);
    const entry = recordFinding(key,chapter,{title:finding.title, href:finding.anchor,
      status:finding.status === 'open' ? 'open' : 'conditional', statement:statements.get(key)});
    if (!entry.notes.length) entry.summary = finding.text;
  }
  const reviewMarkers = new Map();
  if (proofCoverageReview?.sourcePdfSha256 !== native.sourcePdfSha256) throw Error('Stale Foundations coverage review');
  for (const check of proofCoverageReview.findings) {
    const [key,index] = check.block.split(':');
    const source = native.byKey.get(key);
    const block = source?.blocks[Number(index)];
    if (!block || hash(block) !== check.blockSha256 || !readingText(block).includes(check.evidence) ||
        !['open','conditional','comparison'].includes(check.status)) {
      throw Error('Unbound Foundations proof coverage review at '+check.block);
    }
    const chapter = byRoute.get(source.route);
    const href = source.route+'#'+noteAnchor(index);
    const entry = recordFinding(check.block,chapter,{title:check.title, href, status:check.status, summary:check.summary,
      statement:statements.get(check.block)});
    reviewMarkers.set(check.block,entry);
  }
  return {chapters, gaps, byBlock, missingByBlock, proofFindings, sourceNotes, reviewMarkers,
    notes:noteEntries.length, narrower:[...gaps.values()].filter(gap => gap.narrower).length};
}

export const gapCount = count => `${count} open ${count === 1 ? 'Tag' : 'Tags'}`;
