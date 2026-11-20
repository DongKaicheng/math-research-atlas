import {createHash} from 'node:crypto';
import {adjacentProof, readingText} from './build-foundations-dependencies.mjs';

export const tagRoute = id => `/r/${id}/`;
export const statusLabels = {
  closed:'Closed at the accepted scope', partial:'Open at full scope · narrower result available', open:'Open proof obligation',
  conditional:'Conditional on stated inputs', comparison:'Comparison requirements remain', pending:'Proof review pending',
  definition:'Definition · proof status does not apply',
};
export const coverageGroups = ['closed','open','conditional','comparison','pending','definition'];
export const groupLabels = {closed:'Closed',open:'Open or partial',conditional:'Conditional',comparison:'Comparison',pending:'Review pending',definition:'Definitions'};
const digest = block => createHash('sha256').update(block).digest('hex');

// This review concerns the argument of the immediately preceding proposition.
// Its source passage and proposition share one result identity.
const statementOf = new Map([['026:66','026:65']]);

export function collectManuscriptTags(coverage, dependencies, native) {
  const findingsBySubject = new Map();
  for (const [key,finding] of coverage.proofFindings) {
    const subject = statementOf.get(key) ?? key;
    if (findingsBySubject.has(subject)) throw Error('Two coverage entries claim the same Tag: '+subject);
    findingsBySubject.set(subject,finding);
  }
  const keys = new Set([...coverage.missingByBlock.keys(), ...findingsBySubject.keys(), ...dependencies.resultByBlock.keys()]);
  for (const [key,entry] of coverage.statements) if (entry.kind === 'corollary' && !entry.tags.length) keys.add(key);
  const candidates = new Map();
  for (const key of [...keys].sort((a,b)=>a.localeCompare(b,'en',{numeric:true}))) {
    const [chapterKey,indexText] = key.split(':');
    const index = Number(indexText);
    const chapter = native.byKey.get(chapterKey);
    const block = chapter?.blocks[index];
    const ledger = coverage.chapters.get(chapter?.route.split('/').at(-2));
    const statement = coverage.statements.get(key);
    const result = dependencies.resultByBlock.get(key);
    const finding = findingsBySubject.get(key);
    if (!block || !ledger || (!statement && !result && !finding)) throw Error('Unbound manuscript Tag '+key);
    const href = statement?.href ?? result?.book ?? finding.href;
    const generatedAnchor = statement?.generatedAnchor ?? null;
    candidates.set(key,{key, index, chapter, ledger, statement, result, finding, href, generatedAnchor,
      hash:digest(block), title:finding?.title ?? statement?.title ?? result.title,
      existing:coverage.tagBindings.get(key)?.[0], proof:statement || result ? adjacentProof(chapter,index) : null});
  }
  return candidates;
}

function coverageTypes(data, keys) {
  const {types, findings} = data;
  const received = Object.keys(findings);
  if (received.length !== keys.size || received.some(key=>!keys.has(key)) ||
    Object.values(findings).some(ids=>!Array.isArray(ids) || !ids.length || new Set(ids).size!==ids.length ||
      ids.some(id=>!Object.hasOwn(types,id) || typeof types[id]!=='string' || !types[id].trim()))) {
    throw Error('Proof gap types do not reconcile with the coverage inventory');
  }
  return new Map(received.map(key=>[key,findings[key].map(id=>types[id])]));
}

export function registerFoundationsTags(release, coverage, dependencies, native) {
  const candidates = collectManuscriptTags(coverage,dependencies,native);
  const {tagRegistry, manuscriptGapTypes, historicalGapTypes} = release;
  if (tagRegistry.schema !== 'foundations-manuscript-tag-register/v1' || tagRegistry.sourcePdfSha256 !== native.sourcePdfSha256 ||
    manuscriptGapTypes.sourcePdfSha256 !== native.sourcePdfSha256 || historicalGapTypes.editionManifestSha256 !== release.current.editionManifestSha256) {
    throw Error('The Foundations Tag register is out of scope for this edition');
  }
  const manuscriptTypes = coverageTypes(manuscriptGapTypes,new Set(coverage.proofFindings.keys()));
  const archivedTypes = coverageTypes(historicalGapTypes,new Set(coverage.gaps.keys()));
  const assigned = new Map();
  for (const [id,entry] of Object.entries(tagRegistry.entries)) {
    const expected = candidates.get(entry.block);
    if (!/^NAG-9\d{5}$/.test(id) || !expected || expected.existing || expected.hash !== entry.sha256 || assigned.has(entry.block)) {
      throw Error('Unbound or reused permanent manuscript Tag '+id);
    }
    assigned.set(entry.block,id);
  }
  const records = new Map();
  const byBlock = new Map();
  const sourceAliases = new Map();
  const tagLocations = {...native.tags};
  const tags = new Map();
  for (const row of release.rows) {
    const gap = coverage.gaps.get(row.id);
    const status = gap ? (gap.narrower ? 'partial' : 'open') : row.coverage==='Standing definition' ? 'definition' :
      row.coverage.startsWith('Accepted whole') ? 'closed' : null;
    if (!status) throw Error('Unknown fixed proof status for '+row.id);
    tags.set(row.id,{...row,status,gap,types:archivedTypes.get(row.id) ?? []});
  }
  for (const item of candidates.values()) {
    const id = item.existing ?? assigned.get(item.key);
    if (!id) throw Error('Permanent manuscript Tag needs a registry entry: '+item.key);
    const finding = item.finding;
    const kind = item.statement?.kind ?? item.result?.kind;
    const status = finding?.status ?? (kind === 'definition' ? 'definition' : 'pending');
    const types = finding ? manuscriptTypes.get(finding.key) : status === 'pending' ? [item.proof ? 'Proof awaiting review' : 'Proof or proof location to verify'] : [];
    if (!item.existing) {
      const summary = statusLabels[status];
      tags.set(id,{id,link:tagRoute(id),project:'foundations',category:'Foundations',title:item.title,status,types,finding,
        coverage:summary,summary,keywords:[id,item.ledger.title,...types],body:readingText(item.chapter.blocks[item.index]).slice(0,280)});
      const section = item.chapter.sections.findLast(section=>section.index<=item.index && section.title!=='*');
      tagLocations[id] = {key:item.chapter.key, index:item.index, href:item.href, kind,
        proof:item.proof?.index, proofEnd:item.proof?.end, section:section?.title, sectionId:section?.id};
      records.set(id,item);
      item.ledger.tags.push(tags.get(id));
    } else if (finding) {
      const current = tags.get(id);
      if (current.status !== status) throw Error('Sealed status conflicts with a manuscript coverage finding: '+id);
    }
    byBlock.set(item.key,id);
    if (finding) {
      sourceAliases.set(finding.key,id);
      for (const note of finding.notes) sourceAliases.set(note.key,id);
    }
  }
  for (const chapter of coverage.chapters.values()) {
    chapter.tags = chapter.tags.map(row=>tags.get(row.id));
    chapter.tagCounts = Object.fromEntries(coverageGroups.map(group=>[group,0]));
    for (const row of chapter.tags) chapter.tagCounts[closureGroup(row.status)]++;
  }
  return {tags, records, tagLocations, byBlock, sourceAliases};
}

export const closureGroup = status => status === 'partial' ? 'open' : status;
