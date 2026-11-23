// A source-bound reading view of Progress. These objects are proof diagrams,
// not new theorem records or a second mathematical status register.
import { pairingGroups } from './pairing-progress.mjs';
import { progressProofCore } from './progress-proof-core.mjs';
import { progressProofGeometry } from './progress-proof-geometry.mjs';
import { progressProofModels } from './progress-proof-models.mjs';
import { progressProofRequirements } from './progress-proof-required.mjs';

export const progressProofEdition = 'v0.5.1';
export const progressProofInventory = {
  file: 'strong-green/views/content/pairing-progress.mjs',
  sha256: 'b53862e700bbb393e19501381e7e0181fedba737b3475ca3c690dcf9cec9283d',
};
export const progressProofPath = '/results/proof-diagrams';
const authored = [...progressProofCore, ...progressProofGeometry, ...progressProofModels];
const caseById = new Map(pairingGroups.flatMap(group => group.cases.map(item => [item.id, { ...item, groupId: group.id, groupTitle: group.title }])));
const authoredById = new Map(authored.map(item => [item.caseId, item]));
if (authoredById.size !== authored.length) throw Error('Repeated Progress proof case');
if (authored.some(item => !caseById.has(item.caseId))) throw Error('Unknown Progress proof case');

export const progressProofs = [...caseById].map(([id, item]) => {
  const diagram = authoredById.get(id);
  if (!diagram) throw Error('Missing Progress proof case: ' + id);
  return { ...item, ...diagram, path: progressProofPath + '/' + id,
    svgPath: '/projects/strong-green/assets/progress-proofs/' + id + '.svg' };
});
export const progressProofById = new Map(progressProofs.map(item => [item.caseId, item]));
export const progressProofTrees = progressProofs.flatMap(item => item.trees);
export const progressProofSvgPath = '/projects/strong-green/assets/progress-proofs/complete.svg';

export function progressApplicationLink(caseId, title) {
  const item = progressProofById.get(caseId);
  const covered = item?.coverage.find(row => row.title === title);
  if (!covered) throw Error('Missing Progress application diagram: ' + caseId + ': ' + title);
  return item.path + '#' + covered.nodeId;
}

export function walkProofNodes(node) {
  return [node, ...(node.gate?.children || []).flatMap(walkProofNodes)];
}

export function validateProgressProofs(records, revision, candidates = progressProofs) {
  if (revision !== progressProofEdition) throw Error('Progress proof diagrams require source review for the selected edition');
  const known = new Map(records.map(record => [record.id, record]));
  const expectedCases = [...caseById.keys()];
  if (candidates.length !== expectedCases.length || new Set(candidates.map(item => item.caseId)).size !== candidates.length)
    throw Error('Incomplete or repeated Progress proof case coverage');
  const allIds = new Set();
  let nodeCount = 0, junctionCount = 0, coverageCount = 0;
  function id(value) {
    if (!value || !/^proof-[a-z0-9-]+$/.test(value) || allIds.has(value)) throw Error('Missing or repeated Progress diagram identity: ' + value);
    allIds.add(value);
  }
  function link(value) {
    const href = value?.href || '';
    if (!value || !value.label || (!/^#proof-[a-z0-9-]+$/.test(href) && !/^\/(?:papers|entries|results|research-map|programme|routes|sources|source-files|editions)(?:[\/#?]|$)/.test(href)))
      throw Error('Invalid Progress proof source: ' + JSON.stringify(value));
  }
  for (const item of candidates) {
    const original = caseById.get(item.caseId);
    if (!original || !expectedCases.includes(item.caseId)) throw Error('Unknown Progress case: ' + item.caseId);
    if (!Array.isArray(item.trees) || !item.trees.length) throw Error('Missing Progress proof tree: ' + item.caseId);
    if (!Array.isArray(item.sourceBindings) || !item.sourceBindings.length) throw Error('Missing Progress proof source binding: ' + item.caseId);
    const required = progressProofRequirements[item.caseId];
    if (!required) throw Error('Missing retained Progress proof inventory: ' + item.caseId);
    const treeIds = new Set(item.trees.map(tree => tree.id));
    const missingTrees = required.treeIds.filter(treeId => !treeIds.has(treeId));
    if (missingTrees.length) throw Error('Required Progress proof trees missing from ' + item.caseId + ': ' + missingTrees.join(', '));
    for (const source of item.sourceBindings) {
      if (!/^(?:content\/strong-green\/releases\/v0\.5\.1\/papers\/|public\/projects\/strong-green\/editions\/v0\.5\.1\/)/.test(source.file || '') || source.file.includes('..') || !/^[a-f0-9]{64}$/.test(source.sha256 || '') || !Array.isArray(source.locators) || !source.locators.length || Array.from(source.locators).some(locator => typeof locator !== 'string' || !locator.trim()))
        throw Error('Invalid Progress proof source binding: ' + item.caseId);
    }
    const sourceFiles = new Set(item.sourceBindings.map(source => source.file));
    const missingSources = required.sourceFiles.filter(file => !sourceFiles.has(file));
    if (missingSources.length) throw Error('Required Progress proof source bindings missing from ' + item.caseId + ': ' + missingSources.join(', '));
    const localIds = new Map();
    for (const tree of item.trees) {
      id(tree.id);
      if (!tree.title || !tree.summary || !tree.scope || !tree.root?.gate) throw Error('Incomplete Progress proof tree: ' + tree.id);
      // Context boxes state ambient scope; their layout has no proof children.
      // A derivation belongs in root/related, where every child is rendered.
      for (const context of tree.contexts || []) if (context.gate)
        throw Error('Progress context must not contain a logical relation: ' + (context.id || context.record || tree.id));
      for (const node of [...(tree.contexts || []), ...[tree.root, ...(tree.related || [])].flatMap(walkProofNodes)]) {
        nodeCount++;
        if (node.id) { id(node.id); localIds.set(node.id, tree.id); }
        if (node.record) {
          if (!known.has(node.record)) throw Error('Unknown Progress proof record: ' + node.record);
          if (node.status && node.status !== known.get(node.record).status) throw Error('Progress diagram must not override source status: ' + node.record);
        } else if (!node.title || !node.href || !node.status) throw Error('Incomplete Progress proof node: ' + tree.id);
        if (!node.note) throw Error('Missing mathematical role at Progress node: ' + (node.id || node.record));
        if (node.href) link({ href: node.href, label: node.title || node.record });
        for (const source of node.links || []) link(source);
        if (!node.gate) continue;
        const gate = node.gate;
        junctionCount++;
        if (!['all','any','iff','open','blocked'].includes(gate.kind) || !gate.label || !gate.explanation || !gate.sources?.length || !gate.children?.length)
          throw Error('Incomplete Progress logical relation: ' + (node.id || node.record));
        if (['any','iff'].includes(gate.kind) && gate.children.length < 2) throw Error('An alternative/equivalence needs its complete premise bundle');
        gate.sources.forEach(link);
        for (const record of gate.rules || []) if (!known.has(record) || !gate.ruleNotes?.[record]) throw Error('Unbound Progress inference rule: ' + record);
      }
    }
    const expected = [original.title, ...(original.children || []).map(child => child.title)].sort();
    const covered = (item.coverage || []).map(row => row.title).sort();
    if (JSON.stringify(covered) !== JSON.stringify(expected)) throw Error('Incomplete Progress application coverage: ' + item.caseId);
    for (const row of item.coverage) {
      if (localIds.get(row.nodeId) !== row.treeId) throw Error('Progress application is not a drawn node: ' + row.title);
      link(row.source); coverageCount++;
    }
  }
  return { cases: candidates.length, applications: coverageCount - candidates.length,
    trees: candidates.reduce((n, item) => n + item.trees.length, 0), nodes: nodeCount, junctions: junctionCount };
}
