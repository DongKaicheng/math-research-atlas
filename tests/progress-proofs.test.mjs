import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import { pairingGroups } from '../strong-green/views/content/pairing-progress.mjs';
import { progressProofs, progressProofTrees, progressProofPath, progressProofSvgPath, progressProofInventory, validateProgressProofs, walkProofNodes, progressApplicationLink } from '../strong-green/views/content/progress-proofs.mjs';
import { buildLogicScene, textWidth } from '../strong-green/views/content/logic-layout.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = file => readFile(path.join(root, file), 'utf8');
const { revision } = JSON.parse(await read('content/strong-green/current.json'));
const { entries } = JSON.parse(await read(`content/strong-green/releases/${revision}/bundle.json`));
const base = '/math-research-atlas';
const prefix = base + '/projects/strong-green';
const cases = pairingGroups.flatMap(group => group.cases);
const pagePath = item => `dist/projects/strong-green${item.path}/index.html`;
const sceneFor = item => buildLogicScene(item.trees, entries);
const allNodes = item => item.trees.flatMap(tree => [...(tree.contexts || []), ...[tree.root, ...(tree.related || [])].flatMap(walkProofNodes)]);
const allGates = item => allNodes(item).filter(node => node.gate).map(node => node.gate);
const records = new Map(entries.map(entry => [entry.id, entry]));
const normalized = value => String(value || '').replace(/\s+/g, ' ').trim();
const decode = value => String(value).replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, entity => {
  if (/^&#x/i.test(entity)) return String.fromCodePoint(parseInt(entity.slice(3, -1), 16));
  if (/^&#/.test(entity)) return String.fromCodePoint(Number(entity.slice(2, -1)));
  return { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" }[entity.toLowerCase()];
});
const plain = html => normalized(decode(String(html).replace(/<[^>]*>/g, ' ')));
const hrefs = html => [...html.matchAll(/\bhref="([^"]+)"/g)].map(match => decode(match[1]));
const ids = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(match => decode(match[1]));
const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Balance the real element, so a nested list or disclosure cannot make a
// truncated excerpt pass the content-retention checks.
function element(html, id) {
  const matches = [...html.matchAll(new RegExp('<([a-z][\\w:-]*)\\b(?=[^>]*\\bid="' + escapeRegExp(id) + '")[^>]*>', 'g'))];
  assert.equal(matches.length, 1, 'Exactly one rendered destination: ' + id);
  const match = matches[0], tag = match[1];
  const tokens = new RegExp('<\\/?' + tag + '\\b[^>]*>', 'g');
  tokens.lastIndex = match.index;
  let depth = 0, token;
  while ((token = tokens.exec(html))) {
    if (token[0].startsWith('</')) depth--;
    else if (!token[0].endsWith('/>')) depth++;
    if (!depth) return html.slice(match.index, tokens.lastIndex);
  }
  assert.fail('Unclosed rendered destination: ' + id);
}

function published(href) {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  if (href.startsWith('/source-files/') || /^\/papers\/[^/#?]+\.(?:tex|pdf)(?:[?#]|$)/.test(href))
    return prefix + '/editions/' + revision + href;
  const split = href.search(/[?#]/), pathname = split < 0 ? href : href.slice(0, split), suffix = split < 0 ? '' : href.slice(split);
  return prefix + pathname.replace(/\/$/, '') + (/\.[A-Za-z\d]+$/.test(pathname) ? '' : '/') + suffix;
}

// Derive identities and logical incidence from the authored trees, independently
// of either the layout or renderer. These are the already published paths.
function expectedGraph(trees) {
  const nodes = [], gates = [];
  const add = (source, identity, treeId, role) => {
    const record = source.record && records.get(source.record);
    const node = { id: source.id || identity, treeId, role, record: source.record,
      title: source.title || record?.title, status: record?.status || source.status,
      note: source.note || (role === 'context' ? record?.summary || '' : ''), href: source.href || (record ? '/entries/' + record.id : undefined), links: source.links || [] };
    nodes.push(node);
    if (source.gate) {
      const gate = source.gate;
      const ruleIds = (gate.rules || []).map((record, index) => add({ record, note: gate.ruleNotes?.[record] || records.get(record).summary }, `${identity}-rule-${index}`, treeId, 'rule'));
      const childrenIds = gate.children.map((child, index) => add(child, `${identity}-premise-${index}`, treeId, 'premise'));
      gates.push({ ...gate, id: identity + '-gate', treeId, conclusionId: node.id, childrenIds, ruleIds });
    }
    return node.id;
  };
  for (const tree of trees) {
    (tree.contexts || []).forEach((node, index) => add(node, `${tree.id}-context-${index}`, tree.id, 'context'));
    add(tree.root, `${tree.id}-root`, tree.id, 'conclusion');
    (tree.related || []).forEach((node, index) => add(node, `${tree.id}-related-${index}`, tree.id, node.gate?.kind === 'blocked' ? 'unreached target' : 'conclusion'));
  }
  return { nodes, gates };
}

function assertReadingDetails(html, tree, expected) {
  const panel = element(html, tree.id);
  assert.match(panel, /^<section\b[^>]*data-logic-panel=/, tree.id + ': an always-visible panel');
  assert.ok(plain(panel).includes(normalized(tree.title)), tree.id + ': full proof-unit title');
  assert.ok(plain(panel).includes(normalized(tree.summary)), tree.id + ': full reading summary');
  assert.ok(plain(panel).includes(normalized(tree.scope)), tree.id + ': complete ambient scope');
  assert.equal((panel.match(/data-complete-logical-diagram=""/g) || []).length, 1, tree.id + ': its own graph');
  const details = [...panel.matchAll(/<details\b[^>]*>/g)];
  assert.ok(details.every(match => /\bdata-logic-detail=|\bclass="[^"]*\blogic-node-register\b/.test(match[0])), tree.id + ': only textual deductions and their register use disclosures');
  let disclosureDepth = 0;
  for (const [tag] of panel.matchAll(/<\/?(?:details|svg)\b[^>]*>/g)) {
    if (tag.startsWith('<details')) disclosureDepth++;
    else if (tag.startsWith('</details')) disclosureDepth--;
    else if (tag.startsWith('<svg')) assert.equal(disclosureDepth, 0, tree.id + ': every graph is outside every disclosure');
  }
  assert.equal(disclosureDepth, 0, tree.id + ': balanced text disclosures');
  for (const node of expected.nodes.filter(node => node.treeId === tree.id)) {
    const drawn = element(panel, node.id), detail = element(panel, node.id + '-detail');
    assert.match(drawn, /^<g\b[^>]*data-logic-node=/, node.id + ': still drawn, not just an alias');
    assert.ok(drawn.includes('data-logic-role="' + node.role + '"'), node.id + ': mathematical role retained');
    assert.ok(drawn.includes('data-logic-status="' + node.status + '"'), node.id + ': status retained');
    assert.match(detail, /^<details\b[^>]*data-logic-detail=/, node.id + ': textual deduction remains addressable');
    assert.doesNotMatch(detail, /data-complete-logical-diagram=/, node.id + ': graph cannot be hidden in its note');
    assert.ok(plain(detail).includes(normalized(node.note)), node.id + ': full scope and qualification');
    assert.ok(plain(detail).includes(normalized(node.title)), node.id + ': full title');
    if (node.href) assert.ok(hrefs(drawn + detail).includes(published(node.href)), node.id + ': original primary destination');
    for (const link of node.links) {
      assert.ok(hrefs(detail).includes(published(link.href)), node.id + ': related evidence ' + link.href);
      assert.ok(plain(detail).includes(normalized(link.label)), node.id + ': evidence label');
    }
    assert.ok(hrefs(drawn).includes('#' + node.id + '-detail'), node.id + ': graph opens its own complete scope');
  }
  for (const gate of expected.gates.filter(gate => gate.treeId === tree.id)) {
    const drawn = element(panel, gate.id), detail = element(panel, gate.id + '-detail');
    assert.ok(drawn.includes('data-logic-gate="' + gate.kind + '"'), gate.id + ': relation kind retained');
    assert.ok(hrefs(drawn).includes('#' + gate.id + '-detail'), gate.id + ': graph opens this inference');
    assert.doesNotMatch(detail, /data-complete-logical-diagram=/, gate.id + ': graph cannot be hidden in a deduction');
    assert.ok(plain(detail).includes(normalized(gate.label)), gate.id + ': complete inference label');
    assert.ok(plain(detail).includes(normalized(gate.explanation)), gate.id + ': complete mechanism');
    for (const id of [...gate.childrenIds, gate.conclusionId, ...gate.ruleIds])
      assert.ok(hrefs(detail).some(href => href === '#' + id || href === '#' + id + '-detail'), gate.id + ': exact scoped participant ' + id);
    for (const link of gate.sources) {
      assert.ok(hrefs(detail).includes(published(link.href)), gate.id + ': source ' + link.href);
      assert.ok(plain(detail).includes(normalized(link.label)), gate.id + ': source label');
    }
  }
}

test('Every Progress result and all 32 applications have a drawn proof destination', () => {
  const coverage = validateProgressProofs(entries, revision);
  assert.equal(coverage.cases, 13);
  assert.equal(coverage.applications, 32);
  assert.ok(coverage.trees >= 117, 'The visual revision retains every reviewed proof unit');
  assert.deepEqual(progressProofs.map(item => item.caseId), cases.map(item => item.id));
  for (const item of progressProofs) {
    const scene = sceneFor(item);
    for (const row of item.coverage) assert.ok(scene.boxes.some(box => box.id === row.nodeId), row.title);
    assert.ok(scene.gates.length >= 2, item.caseId + ': a proof has intermediate deductions');
    assert.ok(allGates(item).every(gate => gate.sources.some(source => source.href.startsWith('/papers/'))), item.caseId + ': every inference has a paper source');
    assert.ok(allNodes(item).some(node => node.gate?.children.some(child => child.gate)), item.caseId + ': not a one-level input catalogue');
  }
});

test('Proof coverage and edition bindings reject a stale or incomplete diagram', () => {
  assert.throws(() => validateProgressProofs(entries, 'v99.0.0'), /source review/);
  assert.throws(() => validateProgressProofs(entries, revision, progressProofs.slice(1)), /coverage/);
  const missing = structuredClone(progressProofs);
  missing.find(item => item.coverage.length > 1).coverage.pop();
  assert.throws(() => validateProgressProofs(entries, revision, missing), /application coverage/);
  const stale = structuredClone(progressProofs);
  const recorded = stale.flatMap(allNodes).find(node => node.record);
  recorded.status = entries.find(entry => entry.id === recorded.record).status === 'proved' ? 'open' : 'proved';
  assert.throws(() => validateProgressProofs(entries, revision, stale), /must not override source status/);
  const unbound = structuredClone(progressProofs);
  unbound[0].trees[0].root.gate.sources = [];
  assert.throws(() => validateProgressProofs(entries, revision, unbound), /Incomplete Progress logical relation/);
});

test('Progress proof views remain bound to the exact inspected public source bytes', async () => {
  const sources = [progressProofInventory, ...progressProofs.flatMap(item => item.sourceBindings)];
  for (const source of sources) {
    const bytes = await readFile(path.join(root, source.file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256, source.file);
  }
});

test('Reviewed H22 constructions are proved and source-bound while source vanishing and height interfaces remain open', async () => {
  const sourcePath = `public/projects/strong-green/editions/${revision}/source-files/companion/chow-obstruction-green-pairs.tex`;
  const source = await readFile(path.join(root, sourcePath));
  const digest = createHash('sha256').update(source).digest('hex');
  const labels = new Set([...source.toString('utf8').matchAll(/\\label(?:\[[^\]]+\])?\{([^}]+)\}/g)].map(match => match[1]));
  const paper = JSON.parse(await read(`content/strong-green/releases/${revision}/papers/chow-obstruction-green-pairs.json`));
  assert.equal(paper.sourceSha256, digest, 'The theorem article and published proof use the same exact source');
  for (const [id, locator] of [
    ['BB-CHOW-GREEN-PAIRS', 'h22:main'],
    ['BB-ACTUAL-OBSTRUCTION', 'r11p:generic-chow-primitive'],
    ['BB-SUPPORTED-GREEN-PAIR', 'r11p:complex-green'],
    ['BB-RESTRICTED-TRACE', 'r11p:minimal-trace-theorem'],
    ['BB-MODEL-DETECTOR', 'h22c:numerical-zero'],
  ]) {
    const entry = records.get(id);
    assert.ok(entry, id);
    assert.equal(entry.status, 'proved', id);
    assert.equal(entry.proofMode, 'proof', id);
    assert.equal(entry.source.url, '/source-files/companion/chow-obstruction-green-pairs.tex', id);
    assert.equal(entry.source.sha256, digest, id + ': status is tied to the inspected proof bytes');
    assert.ok(entry.source.locator.includes(locator) && labels.has(locator), id + ': its exact proof locator exists');
  }
  for (const id of ['BB-RESIDUAL-PERIODS', 'BB-ANALYTIC-INTERFACE', 'STRONG-G', 'BB-GLOBAL'])
    assert.equal(records.get(id).status, 'open', id + ': H22 does not discharge this remaining assertion');
  assert.equal(records.get('BB-RATIONAL-FIBRE-RIGIDITY').status, 'draft');
});

test('Recovered endpoints use a separate conditional compact proof without circular curve transfer', () => {
  const endpoint = progressProofs.find(item => item.caseId === 'endpoints');
  const byId = new Map(allNodes(endpoint).map(node => [node.id, node]));
  for (const suffix of ['divisor', 'zero-cycle', 'algebraic-endpoint']) {
    const tree = endpoint.trees.find(item => item.id === `proof-endpoints-${suffix}-tree`);
    assert.ok(tree, suffix);
    assert.equal(tree.root.id, `proof-endpoints-${suffix}-conclusion`);
    assert.equal(tree.root.status, 'conditional');
    assert.equal(tree.root.gate.kind, 'all');
    assert.ok(tree.scope.includes('(A1)') && tree.scope.includes('(A2)') && tree.scope.includes('(R)'));
  }
  const independent = endpoint.trees.find(item => item.id === 'proof-endpoints-algebraic-endpoint-tree');
  const actualInputs = new Set(walkProofNodes(independent.root).map(node => node.record).filter(Boolean));
  for (const [record, status] of [
    ['BB-ACTUAL-OBSTRUCTION', 'proved'],
    ['BB-SUPPORTED-GREEN-PAIR', 'proved'],
    ['BB-RATIONAL-FIBRE-RIGIDITY', 'draft'],
  ]) {
    assert.ok(actualInputs.has(record), record);
    assert.equal(entries.find(item => item.id === record).status, status, record);
  }
  const independentLinks = walkProofNodes(independent.root).flatMap(node => [node.href, ...(node.links || []).map(link => link.href), ...(node.gate?.sources || []).map(link => link.href)]).filter(Boolean);
  assert.ok(independentLinks.every(href => !/pairing-constructions#(?:prop|sub):algebraic-triviality/.test(href)), 'Endpoint cannot depend on the curve-transfer proof which uses that endpoint');
  assert.match(byId.get('proof-endpoints-divisor-algebraic-power').note, /Definition 6\.1.*Theorem 6\.3/);
  assert.match(byId.get('proof-endpoints-zero-cycle-component-scope').note, /every geometric connected component/);
  assert.match(byId.get('proof-endpoints-algebraic-original-character').note, /ΨZ=|D\(\(βa−Hz\)\/d\)=ΩZ/);
  assert.equal(byId.get('proof-endpoints-divisor-input').href, '/results/proof-diagrams/endpoints/#proof-endpoints-divisor-conclusion');
  assert.equal(byId.get('proof-endpoints-zero-cycle-input').href, '/results/proof-diagrams/endpoints/#proof-endpoints-zero-cycle-conclusion');
  const source = endpoint.sourceBindings.find(item => item.file.endsWith('R12_compact_parameter_algebraic_triviality.tex'));
  assert.ok(source.locators.includes('r12p:picard-products') && source.locators.includes('r12p:top-degree'));
});

test('Kernel-domain proofs expand finite trace, point residue, proper slices, transport and Chow descent', () => {
  const kernel = progressProofs.find(item => item.caseId === 'kernel-domain');
  const nodes = new Map(allNodes(kernel).map(node => [node.id, node]));
  const units = ['finite-base-change', 'point-residue', 'proper-slice', 'principal-transport', 'chow-descent'];
  for (const unit of units) {
    const tree = kernel.trees.find(item => item.id === `proof-kernel-domain-${unit}-tree`);
    assert.ok(tree, unit);
    assert.equal(tree.root.id, `proof-kernel-domain-${unit}-conclusion`);
    assert.equal(tree.root.status, 'conditional');
    assert.equal(tree.root.gate.kind, 'all');
    assert.ok(walkProofNodes(tree.root).filter(node => node.gate).length >= 2, unit + ': intermediate deductions are drawn');
  }
  for (const [input, target] of [
    ['curved-slice', 'proper-slice'], ['point-coefficients', 'point-residue'],
    ['principal-law', 'principal-transport'], ['chow-descent', 'chow-descent'],
    ['base-changed-form', 'finite-base-change'],
  ]) assert.equal(nodes.get('proof-kernel-domain-' + input).href, `/results/proof-diagrams/kernel-domain/#proof-kernel-domain-${target}-conclusion`);
  const binding = kernel.sourceBindings.find(item => item.file.endsWith('/global-height-pairing.tex'));
  for (const label of ['r16h:finite-base-change', 'r16h:base-change', 'r16h:product-trace', 'r16h:refined-residue', 'r16h:curved-slice-eq', 'r16h:source-degrees', 'r16h:upstairs-slice', 'r16h:principal'])
    assert.ok(binding.locators.includes(label), label);
});

test('Expanded kernel arguments retain normal carriers, exact multiplicities and rational integralization', () => {
  const kernel = progressProofs.find(item => item.caseId === 'kernel-domain');
  const nodes = new Map(allNodes(kernel).map(node => [node.id, node]));
  const at = suffix => nodes.get('proof-kernel-domain-' + suffix);
  const finite = kernel.trees.find(item => item.id === 'proof-kernel-domain-finite-base-change-tree');
  const slice = kernel.trees.find(item => item.id === 'proof-kernel-domain-proper-slice-tree');
  assert.match(finite.scope, /finite flat.*smooth integral.*normal integral/);
  assert.match(at('bc-cycle').note, /generic Artinian length/);
  assert.equal(at('bc-ci-input').status, 'hypothesis');
  assert.equal(at('bc-current-injection').status, 'hypothesis');
  assert.match(slice.scope, /normal, integral, quasiprojective.*finite.*compact actual scalar/);
  assert.equal(at('slice-supported-record').record, 'BB-SUPPORTED-GREEN-PAIR');
  assert.equal(entries.find(item => item.id === 'BB-SUPPORTED-GREEN-PAIR').status, 'proved');
  assert.match(at('slice-normal-carriers').note, /Components lying over S contribute zero to this displayed dominating-cycle pushforward/);
  assert.match(at('slice-fibre-degree').note, /native residue degree/);
  assert.equal(at('slice-refined-input').href, '/results/proof-diagrams/kernel-domain/#proof-kernel-domain-point-residue-conclusion');
  assert.match(at('principal-transport-conclusion').note, /integralized data.*product of the two clearing multipliers/);
  assert.match(at('transport-integral-data').note, /Z,Z′,B.*W.*division by mk/);
  assert.match(at('transport-carrier').note, /normal s-fold.*finite.*unit near S.*pushforward/);
  assert.match(at('transport-compact').note, /\|f\+1\|<1/);
  assert.match(at('transport-completions').note, /full degrees.*same a\(B,W\)/);
  assert.match(at('descent-simultaneous').note, /\(Z₁,W₁\)→\(Z₁,W₀\)→\(Z₂,W₀\)→\(Z₂,W₂\)/);
});

test('The low-dimensional endpoint reference opens the three local proofs, not the global conclusion', () => {
  const endpoint = progressProofs.find(item => item.caseId === 'endpoints');
  const node = allNodes(endpoint).find(node => node.id === 'proof-endpoints-all-endpoints');
  assert.equal(node.href, '/results/proof-diagrams/endpoints/#proof-endpoints-divisor-conclusion');
  assert.deepEqual(node.links.map(link => link.href), [
    '/results/proof-diagrams/endpoints/#proof-endpoints-zero-cycle-conclusion',
    '/results/proof-diagrams/endpoints/#proof-endpoints-one-cycle-conclusion',
  ]);
});

test('The curve-surface product proof separates endpoints, the empty product and the DP20 range', () => {
  const item = progressProofs.find(item => item.caseId === 'surface-products');
  const nodes = new Map(allNodes(item).map(node => [node.id, node]));
  const at = suffix => nodes.get('proof-surface-products-' + suffix);
  assert.equal(at('local-products').status, 'conditional');
  assert.equal(at('local-products').gate.kind, 'any');
  assert.deepEqual(at('local-products').gate.children.map(node => node.id), [
    'proof-surface-products-low-dimensional-products',
    'proof-surface-products-empty-product',
    'proof-surface-products-higher-dimensional-products',
  ]);
  assert.equal(at('low-dimensional-products').gate.kind, 'all');
  assert.equal(at('low-dimensional-divisors').href, '/results/proof-diagrams/endpoints/#proof-endpoints-divisor-conclusion');
  assert.equal(at('low-dimensional-zero-cycles').href, '/results/proof-diagrams/endpoints/#proof-endpoints-zero-cycle-conclusion');
  const higher = new Set(at('higher-dimensional-products').gate.children.map(node => node.id));
  for (const suffix of ['product-model-range', 'product-witness', 'product-exactness', 'product-weights', 'product-analytic'])
    assert.ok(higher.has('proof-surface-products-' + suffix), suffix);
  assert.match(at('product-model-range').title, /m≥1 and n≥3/);
  assert.equal(at('product-model-assumption').status, 'hypothesis');
  assert.equal(at('good-native-obstruction').status, 'conditional');
  assert.equal(at('good-exact-support').status, 'conditional');
  assert.equal(at('good-numerical-calculus').status, 'proved');
  assert.equal(at('good-numerical-calculus').href, '/papers/chow-obstruction-green-pairs#h22c:numerical-zero');
  for (const suffix of ['good-constructive-primitives', 'good-composite-trace-calculus'])
    assert.equal(at(suffix).status, 'hypothesis', suffix);
  assert.match(at('good-finite-cover').title, /\[L:K\]/);
  assert.match(at('good-composite-trace-calculus').note, /original Gⱼ.*original absolute value.*every compact K-actual/);
  const native = item.sourceBindings.find(source => source.file.endsWith('R11_curvature_class_and_next_step.tex'));
  assert.ok(native.locators.includes('r11o:finite-good-vanishing'));
});

test('Positive hosts retain signature-only and boundary-comparison routes as genuine alternatives', () => {
  const item = progressProofs.find(item => item.caseId === 'arithmetic-families');
  const nodes = new Map(allNodes(item).map(node => [node.id, node]));
  const at = suffix => nodes.get('proof-arithmetic-families-' + suffix);
  assert.equal(at('host-vanishing').gate.kind, 'any');
  assert.deepEqual(at('host-vanishing').gate.children.map(node => node.id), [
    'proof-arithmetic-families-host-signature-route',
    'proof-arithmetic-families-host-cc-route',
  ]);
  assert.equal(at('host-signature-route').gate.kind, 'all');
  assert.equal(at('host-cc-route').gate.kind, 'all');
  const signatureInputs = new Set(at('host-signature-route').gate.children.map(node => node.id));
  for (const suffix of ['host-signature', 'host-strata', 'host-signature-unramified', 'host-signature-all-finite'])
    assert.ok(signatureInputs.has('proof-arithmetic-families-' + suffix), suffix);
  const ccInputs = new Set(at('host-cc-route').gate.children.map(node => node.id));
  for (const suffix of ['host-cc-signature', 'host-cc-strata', 'host-curve-input', 'host-local-input'])
    assert.ok(ccInputs.has('proof-arithmetic-families-' + suffix), suffix);
  assert.ok(!walkProofNodes(at('host-signature-route')).some(node => node.id === 'proof-arithmetic-families-host-curve-input'));
  assert.equal(at('host-projective-apply').href, '#proof-arithmetic-families-host-main');
  assert.equal(at('elliptic-fourth-model').href, '#proof-arithmetic-families-host-main');
  assert.equal(at('host-global-height').href, '#proof-arithmetic-families-assembly-global');
  assert.equal(at('host-global-height').status, 'hypothesis');
  assert.ok(at('host-main').gate.children.some(node => node.id === 'proof-arithmetic-families-host-global-height'));
  assert.equal(at('host-curve-input').status, 'hypothesis');
  assert.match(at('host-curve-input').title, /EVERY v∣p.*EVERY finite k′\/k\(v\).*EVERY boundary i/);
  assert.match(at('host-curve-input').note, /EVERY actual native rational 1-cycle/);
  assert.match(at('host-local-input').note, /EACH finite valued L\/K.*EACH newly specified/);
  assert.match(at('host-local-input').note, /full \[L′:L\].*absolute value.*exact original support.*all actual compact tests/);
  assert.equal(at('host-boundary-cc').gate.kind, 'all');
  assert.equal(at('host-curve-gysin').gate.kind, 'all');
  assert.ok(item.trees.some(tree => tree.id === 'proof-arithmetic-families-positive-host-curve-gate-tree'));
  assert.equal(at('elliptic-fourth-curve-comparison').href, '#proof-arithmetic-families-host-elliptic-curve-comparison');
  assert.ok(item.sourceBindings.some(source => source.locators.includes('r22su:ampleCC') && source.locators.includes('r22su:gates')));
  assert.ok(item.sourceBindings.some(source => source.locators.includes('r18rb:fourfold')));
});

test('The signature-only host proof separates numerical positivity, residuals and exact period descent', () => {
  const item = progressProofs.find(item => item.caseId === 'arithmetic-families');
  const nodes = new Map(allNodes(item).map(node => [node.id, node]));
  const at = suffix => nodes.get('proof-arithmetic-families-' + suffix);
  for (const suffix of ['positive-host-positivity', 'positive-host-ramified']) {
    const tree = item.trees.find(tree => tree.id === 'proof-arithmetic-families-' + suffix + '-tree');
    assert.ok(tree, suffix);
    assert.equal(tree.root.status, 'conditional');
    assert.equal(tree.root.gate.kind, 'all');
  }
  assert.equal(at('host-pc16-positive-input').href, '#proof-arithmetic-families-host-components-positive');
  assert.equal(at('host-u2-positive-input').href, '#proof-arithmetic-families-host-components-positive');
  assert.ok(!walkProofNodes(at('host-pc16-obstruction')).some(node => node.href === '#proof-arithmetic-families-host-full-u2'));
  for (const suffix of ['host-canonical-residual-input', 'host-operational-lift-input', 'host-native-detector-input', 'host-exact-period-input', 'host-period-kernel-input', 'host-full-degree-injection'])
    assert.equal(at(suffix).status, 'hypothesis', suffix);
  assert.equal(at('host-exact-reconstruction-input').status, 'proved');
  assert.equal(at('host-exact-reconstruction-input').href, '/papers/chow-obstruction-green-pairs#h22:correction');
  assert.match(at('host-canonical-residual-input').note, /r15res:canonical-residual.*r15iso:total-isotropy.*supplied historical inputs/);
  assert.match(at('host-unramified-domain').title, /EVERY finite unramified/);
  assert.match(at('host-all-finite-domain').title, /EVERY finite valued/);
  assert.match(at('host-inertia-period-zero').note, /full.*\[E:K₀\]/);
  assert.match(at('host-period-kernel-input').title, /ker ν = ker Ob/);
  assert.match(at('host-full-degree-injection').title, /\[E:L\]/);
  for (const label of ['r22phs:theorem', 'r22as:local', 'r16pos:local', 'r18ri:all-finite', 'r17fd:numerical-kernel', 'r17vt:model-converse'])
    assert.ok(item.sourceBindings.some(source => source.locators.includes(label)), label);
  assert.ok(at('host-exact-period-input').links.some(link => link.href.endsWith('/R17_vertical_tests_and_strong_green_necessity.tex')));
});

test('Every proof unit has an always-visible compact graph and a complete linked textual deduction', async () => {
  const pages = [{ path: progressProofPath, trees: progressProofTrees }, ...progressProofs];
  for (const item of pages) {
    const html = await read(pagePath(item));
    const scene = sceneFor(item);
    const expected = expectedGraph(item.trees), allIds = ids(html);
    assert.equal(new Set(allIds).size, allIds.length, item.path + ': panel, SVG, detail and marker IDs are unique');
    assert.equal((html.match(/data-complete-logical-diagram=""/g) || []).length, item.trees.length, item.path);
    assert.equal((html.match(/data-logic-panel="/g) || []).length, item.trees.length, item.path);
    assert.equal((html.match(/data-logic-node=""/g) || []).length, scene.boxes.length, item.path);
    assert.equal((html.match(/data-logic-gate="/g) || []).length, scene.gates.length, item.path);
    assert.equal((html.match(/data-logic-detail="/g) || []).length, expected.nodes.length + expected.gates.length, item.path);
    assert.doesNotMatch(html, /data-logic-expand|data-logic-overview/);
    for (const tree of item.trees) assertReadingDetails(html, tree, expected);
    assert.match(html, /Download the complete linked SVG/);
    assert.ok(html.includes(`${prefix}/assets/research-map.js?v=`));
    assert.ok(html.includes(`${prefix}/assets/logic-tree.css?v=`));
    assert.ok(html.includes(`${prefix}/assets/progress-proofs.css?v=`));
    assert.ok(html.includes('version=' + revision + '&amp;page=' + encodeURIComponent('https://dongkaicheng.github.io' + prefix + item.path + '/')));
    assert.equal((html.match(/data-logic-feedback=""/g) || []).length, 2, item.path + ': both shared feedback links retain diagram context');
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1, item.path + ': unambiguous current navigation');
  }
});

test('Progress, applications, homepage and research map link to the independent proof pages', async () => {
  const progress = await read('dist/projects/strong-green/results/index.html');
  const index = await read(`dist/projects/strong-green${progressProofPath}/index.html`);
  for (const item of cases) {
    assert.ok(progress.includes(`href="${prefix}${progressProofPath}/${item.id}/" data-proof-page="${item.id}"`));
    assert.ok(index.includes(`href="${prefix}${progressProofPath}/${item.id}/" data-proof-page="${item.id}"`));
    for (const child of item.children || []) {
      const [p, hash] = progressApplicationLink(item.id, child.title).split('#');
      assert.ok(progress.includes(`href="${prefix}${p}/#${hash}"`), child.title);
    }
  }
  for (const file of ['dist/projects/strong-green/index.html', 'dist/projects/strong-green/research-map/index.html'])
    assert.ok((await read(file)).includes(`href="${prefix}${progressProofPath}/"`), file);
});

test('Independent diagrams enter sitemap and search, not the frozen mathematical edition', async () => {
  const search = JSON.parse(await read('dist/search-index.json'));
  const sitemap = await read('dist/sitemap.xml');
  for (const item of [{ path: progressProofPath }, ...progressProofs]) {
    const url = prefix + item.path + '/';
    assert.ok(search.some(row => row.link === url), url);
    assert.ok(sitemap.includes('<loc>https://dongkaicheng.github.io' + url + '</loc>'), url);
    await assert.rejects(stat(path.join(root, 'dist/projects/strong-green/editions', revision, item.path, 'index.html')), { code: 'ENOENT' });
  }
  const frozen = `projects/strong-green/editions/${revision}/results/index.html`;
  assert.equal(await read('dist/' + frozen), await read('public/' + frozen));
  // Ordinary links to maintained diagrams do not embed their current runtime.
  const frozenHtml = await read('dist/' + frozen);
  const resources = [...frozenHtml.matchAll(/<(?:link|script)\b[^>]*\b(?:href|src)=["']([^"']+)["']/gi)].map(match => match[1]);
  assert.deepEqual(resources.filter(url => /\/(?:research-map|logic-tree|progress-proofs)\.(?:css|js)(?:[?#]|$)/.test(url)), [], 'Frozen results do not load current diagram CSS or JavaScript');
  assert.deepEqual([...frozenHtml.matchAll(/\bdata-(?:research-map|logic-forest|logic-tree|logic-panel|complete-logical-diagram|diagram-scroll|diagram-zoom-controls)\b/g)].map(match => match[0]), [], 'Frozen results do not embed current diagram surfaces');
});

test('New public reading pages remain unsigned and use only the shared feedback route', async () => {
  for (const item of [{ path: progressProofPath }, ...progressProofs]) {
    const html = await read(pagePath(item));
    assert.doesNotMatch(html, /董开承|Kaicheng\s+Dong|Dong\s+Kaicheng|<meta\s+name="author"/i, item.path);
    assert.doesNotMatch(html, /\/api\/feedback|<form\b|spectacularsheep\.chatgpt\.site/, item.path);
    assert.ok(html.includes(base + '/feedback/?project=strong-green&amp;version=' + revision));
  }
});

test('Compact proof geometry retains every occurrence and has no two-dimensional box or gate collisions', () => {
  const scene = buildLogicScene(progressProofTrees, entries);
  const expected = expectedGraph(progressProofTrees);
  assert.equal(scene.anchors.length, new Set(scene.anchors).size);
  assert.deepEqual(new Set(scene.boxes.map(node => node.id)), new Set(expected.nodes.map(node => node.id)), 'The layout cannot omit or merge a scoped occurrence');
  assert.deepEqual(new Set(scene.gates.map(gate => gate.id)), new Set(expected.gates.map(gate => gate.id)), 'Every old inference anchor survives');
  for (const node of scene.boxes) {
    const source = expected.nodes.find(item => item.id === node.id);
    assert.equal(node.status, source.status, node.id + ': no display status promotion');
    assert.equal(node.note, source.note, node.id + ': compact geometry retains full scope metadata');
    for (const line of node.titleLines) assert.ok(textWidth(line, 17) <= node.width - 35, node.id + ': compact title');
  }
  const rectangles = [...scene.boxes, ...scene.gates];
  for (const [index, box] of rectangles.entries()) {
    assert.ok([box.x, box.y, box.width, box.height].every(Number.isFinite), box.id + ': finite geometry');
    assert.ok(box.width > 0 && box.height > 0 && box.x >= 0 && box.y >= 0 && box.x + box.width <= scene.width + 1 && box.y + box.height <= scene.height + 1, box.id + ': within the viewBox');
    for (const other of rectangles.slice(index + 1)) {
      const overlap = box.x < other.x + other.width && other.x < box.x + box.width && box.y < other.y + other.height && other.y < box.y + box.height;
      assert.equal(overlap, false, box.id + ' / ' + other.id);
    }
  }
  for (const tree of progressProofTrees) {
    const visualOrder = scene.gates.filter(gate => gate.treeId === tree.id).sort((a, b) => a.y - b.y || a.x - b.x);
    assert.deepEqual(visualOrder.map(gate => gate.number), visualOrder.map((_, index) => String(index + 1).padStart(2, '0')), tree.id + ': step numbers follow top-to-bottom, left-to-right visual order');
  }
});

test('Each authored premise joins its own inference above its conclusion, with no invented individual implication', () => {
  const scene = buildLogicScene(progressProofTrees, entries);
  const expected = expectedGraph(progressProofTrees);
  const boxes = new Map(scene.boxes.map(node => [node.id, node]));
  const expectedEdges = [];
  const port = (point, rectangle, side, tolerance, label) => {
    assert.ok(point && Number.isFinite(point.x) && Number.isFinite(point.y), label + ': real connector endpoint');
    assert.ok(point.x >= rectangle.x - 2 && point.x <= rectangle.x + rectangle.width + 2, label + ': endpoint belongs to its declared participant');
    assert.ok(Math.abs(point.y - (rectangle.y + (side === 'bottom' ? rectangle.height : 0))) <= tolerance, label + ': endpoint reaches the correct border');
  };
  for (const source of expected.gates) {
    const gate = scene.gates.find(item => item.id === source.id);
    assert.equal(gate.kind, source.kind, gate.id);
    assert.equal(gate.conclusionId, source.conclusionId, gate.id);
    assert.deepEqual(gate.childrenIds, source.childrenIds, gate.id + ': the whole original premise bundle');
    assert.deepEqual(gate.ruleIds, source.ruleIds, gate.id + ': supporting rules are separate');
    const inputEdges = scene.edges.filter(edge => edge.to === gate.id && edge.kind === 'input');
    assert.deepEqual(new Set(inputEdges.map(edge => edge.from)), new Set(source.childrenIds), gate.id + ': exact incidence');
    assert.equal(inputEdges.length, source.childrenIds.length, gate.id + ': no duplicate inputs');
    for (const edge of inputEdges) {
      assert.equal(edge.relation, source.kind, edge.id);
      assert.ok(!edge.arrow && !edge.both && !edge.blocked, edge.id + ': a premise does not independently imply the result');
      const input = boxes.get(edge.from);
      assert.ok(input.y + input.height <= gate.y, edge.id + ': top-down input → junction');
      port(edge.points?.[0], input, 'bottom', 2, edge.id);
      port(edge.points?.at(-1), gate, 'top', 2, edge.id);
      expectedEdges.push(edge.from + '|' + gate.id + '|input');
    }
    const outputs = scene.edges.filter(edge => edge.from === gate.id);
    assert.equal(outputs.length, 1, gate.id + ': one conclusion edge for the whole bundle');
    const output = outputs[0], conclusion = boxes.get(source.conclusionId);
    assert.equal(output.to, source.conclusionId);
    assert.equal(output.kind, source.kind);
    assert.equal(Boolean(output.arrow), source.kind !== 'blocked');
    assert.equal(Boolean(output.both), source.kind === 'iff');
    assert.equal(Boolean(output.blocked), source.kind === 'blocked');
    assert.ok(gate.y + gate.height <= conclusion.y, gate.id + ': top-down junction → conclusion');
    port(output.points?.[0], gate, 'bottom', source.kind === 'iff' ? 16 : 2, output.id);
    port(output.points?.at(-1), conclusion, 'top', 16, output.id + ': includes arrowhead clearance');
    expectedEdges.push(gate.id + '|' + conclusion.id + '|' + source.kind);
    const ruleEdges = scene.edges.filter(edge => edge.to === gate.id && edge.kind === 'rule');
    assert.deepEqual(new Set(ruleEdges.map(edge => edge.from)), new Set(source.ruleIds));
    assert.ok(source.ruleIds.every(id => !source.childrenIds.includes(id)), gate.id + ': rules are not extra AND premises');
    for (const id of source.ruleIds) expectedEdges.push(id + '|' + gate.id + '|rule');
  }
  for (const edge of scene.edges.filter(edge => edge.kind === 'context')) assert.ok(!edge.arrow && !edge.both, edge.id + ': ambient scope asserts no implication');
  for (const tree of progressProofTrees) for (const [index, context] of (tree.contexts || []).entries())
    expectedEdges.push((context.id || `${tree.id}-context-${index}`) + '|' + (tree.root.id || `${tree.id}-root`) + '|context');
  assert.deepEqual(scene.edges.map(edge => edge.from + '|' + edge.to + '|' + edge.kind).sort(), expectedEdges.sort(), 'No hidden bypass, duplicate input or extra mathematical implication');
});

test('A three-premise proof branches horizontally and long deductions do not turn its SVG back into a prose stack', () => {
  const tree = {
    id: 'proof-layout-regression-tree', title: 'Joint premises', summary: 'A compact branching fixture.', scope: 'Rendering only.',
    root: { id: 'proof-layout-regression-result', title: 'Conclusion', href: '/papers/example', status: 'conditional', note: 'Conclusion scope.',
      gate: { kind: 'all', label: 'All three inputs', explanation: 'Use the three inputs jointly.', sources: [{ href: '/papers/example', label: 'Fixture source' }],
        children: ['A', 'B', 'C'].map((title, index) => ({ id: 'proof-layout-regression-input-' + index, title, href: '/papers/example', status: 'hypothesis', note: 'Exact input scope.' })),
      },
    },
  };
  const scene = buildLogicScene([tree], entries);
  const children = tree.root.gate.children.map(node => scene.boxes.find(box => box.id === node.id));
  assert.ok(children.every(node => Math.abs(node.y - children[0].y) < 1), 'Parallel prerequisites share a visible input rank');
  const row = [...children].sort((a, b) => a.x - b.x);
  for (let index = 1; index < row.length; index++) assert.ok(row[index - 1].x + row[index - 1].width < row[index].x, 'Separate horizontal branches must be visible');
  const expanded = structuredClone(tree);
  expanded.root.note = 'A complete qualification. '.repeat(200);
  expanded.root.gate.explanation = 'A complete intermediate argument. '.repeat(200);
  expanded.root.gate.children.forEach(node => { node.note = 'The full quantified premise. '.repeat(200); });
  const expandedScene = buildLogicScene([expanded], entries);
  const geometry = item => [...item.boxes, ...item.gates].map(({ id, x, y, width, height }) => ({ id, x, y, width, height }));
  assert.deepEqual(geometry(expandedScene), geometry(scene), 'Full deductions live in linked readable text, not giant SVG rectangles');
  assert.equal(expandedScene.boxes.find(node => node.id === expanded.root.id).note, expanded.root.note, 'Compactness does not discard the complete note');
  assert.equal(expandedScene.gates[0].explanation, expanded.root.gate.explanation, 'Compactness does not discard the proof mechanism');
});

test('Every standalone SVG has a matching content fingerprint and working links', async () => {
  const items = [{ path: progressProofPath, svgPath: progressProofSvgPath, trees: progressProofTrees }, ...progressProofs];
  const cache = new Map();
  async function targetText(file) {
    if (!cache.has(file)) cache.set(file, await read('dist/' + file));
    return cache.get(file);
  }
  for (const item of items) {
    const file = item.svgPath.slice(1);
    const svg = await targetText(file);
    const scene = sceneFor(item);
    assert.equal((svg.match(/data-logic-node=""/g) || []).length, scene.boxes.length, file);
    const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, file);
    const fingerprint = createHash('sha256').update(svg).digest('hex').slice(0, 16);
    assert.ok((await read(pagePath(item))).includes(base + item.svgPath + '?v=' + fingerprint));
    const here = 'https://dongkaicheng.github.io' + base + item.svgPath;
    for (const [, raw] of svg.matchAll(/\bhref="([^"]+)"/g)) {
      const href = raw.replaceAll('&amp;', '&');
      const url = new URL(href, here);
      assert.equal(url.origin, 'https://dongkaicheng.github.io', href);
      assert.ok(url.pathname.startsWith(base + '/'), href);
      assert.ok(!url.pathname.includes(base + base), href);
      if (/\/(?:papers|entries)\//.test(url.pathname)) {
        assert.ok(url.pathname.startsWith(prefix + '/editions/' + revision + '/'), 'Saved diagram evidence must be edition-pinned: ' + href);
      }
      let target = decodeURIComponent(url.pathname.slice(base.length + 1));
      if (target.endsWith('/')) target += 'index.html';
      else if (!path.extname(target)) target += '/index.html';
      const text = await targetText(target);
      if (url.hash) assert.ok(text.includes('id="' + decodeURIComponent(url.hash.slice(1)) + '"'), file + ': ' + href);
    }
  }
});

test('The saved whole-project map also pins paper and record evidence to its edition', async () => {
  const svg = await read('dist/projects/strong-green/assets/complete-logical-map.svg');
  const evidence = [...svg.matchAll(/\bhref="([^"]+)"/g)].map(match => match[1]).filter(href => /\/(?:papers|entries)\//.test(href));
  assert.ok(evidence.length > 10);
  for (const href of evidence) assert.ok(href.startsWith('https://dongkaicheng.github.io' + prefix + '/editions/' + revision + '/'), href);
});

test('Shared feedback preserves valid proof fragments without creating another inbox or record ID', async () => {
  const item = progressProofs[0];
  const page = 'https://dongkaicheng.github.io' + prefix + item.path + '/';
  const node = { id: item.coverage[0].nodeId };
  const detail = { id: node.id + '-detail' };
  const outside = { id: 'outside-proof-detail' };
  const links = [1, 2].map(() => ({ href: 'https://dongkaicheng.github.io' + base + '/feedback/?project=strong-green&version=' + revision + '&page=' + encodeURIComponent(page) }));
  const events = new Map();
  let contains = false;
  const forest = { querySelector: () => undefined, querySelectorAll: () => [], contains: target => target === node || target === detail };
  const location = { hash: '#' + node.id };
  vm.runInNewContext(await read('strong-green/research-map.js'), {
    URL, location, decodeURIComponent,
    requestAnimationFrame: () => {},
    window: { addEventListener: (type, handler) => events.set(type, handler) },
    document: {
      querySelectorAll: selector => selector === '[data-logic-feedback]' ? links : [],
      querySelector: selector => {
        if (selector === 'link[rel="canonical"]') { contains = true; return { href: page }; }
        // The first IIFE is independently tested in logical-map.test.mjs.
        return contains && selector === '[data-logic-forest]' ? forest : undefined;
      },
      getElementById: id => [node, detail, outside].find(target => target.id === id),
    },
  });
  for (const link of links) {
    const url = new URL(link.href);
    assert.equal(url.pathname, base + '/feedback/');
    assert.equal(url.searchParams.get('project'), 'strong-green');
    assert.equal(url.searchParams.get('version'), revision);
    assert.equal(url.searchParams.get('page'), page + '#' + node.id);
    assert.equal(url.searchParams.has('entry'), false);
  }
  location.hash = '#' + detail.id; events.get('hashchange')();
  for (const link of links) {
    const url = new URL(link.href);
    assert.equal(url.pathname, base + '/feedback/');
    assert.equal(url.searchParams.get('page'), page + '#' + detail.id, 'The complete inference detail has exact shared-board context');
    assert.equal(url.searchParams.get('version'), revision);
    assert.equal(url.searchParams.has('entry'), false);
  }
  location.hash = '#' + outside.id; events.get('hashchange')();
  assert.equal(new URL(links[0].href).searchParams.get('page'), page, 'An unrelated page element is not a proof fragment');
  location.hash = '#not-a-diagram-node'; events.get('hashchange')();
  assert.equal(new URL(links[0].href).searchParams.get('page'), page);
  location.hash = '#%'; events.get('hashchange')();
  assert.equal(new URL(links[0].href).searchParams.get('page'), page);
});
