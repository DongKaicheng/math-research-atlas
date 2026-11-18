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

test('Every Progress result and all 32 applications have a drawn proof destination', () => {
  const coverage = validateProgressProofs(entries, revision);
  assert.equal(coverage.cases, 13);
  assert.equal(coverage.applications, 32);
  assert.ok(coverage.trees >= 13);
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
  for (const record of ['BB-ACTUAL-OBSTRUCTION', 'BB-SUPPORTED-GREEN-PAIR', 'BB-RATIONAL-FIBRE-RIGIDITY']) {
    assert.ok(actualInputs.has(record), record);
    assert.equal(entries.find(item => item.id === record).status, 'draft', record);
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
  assert.equal(entries.find(item => item.id === 'BB-SUPPORTED-GREEN-PAIR').status, 'draft');
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
  for (const suffix of ['good-numerical-calculus', 'good-constructive-primitives', 'good-composite-trace-calculus'])
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
  for (const suffix of ['host-canonical-residual-input', 'host-operational-lift-input', 'host-native-detector-input', 'host-exact-period-input', 'host-period-kernel-input', 'host-full-degree-injection', 'host-exact-reconstruction-input'])
    assert.equal(at(suffix).status, 'hypothesis', suffix);
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

test('The complete index and all independent proof pages are fully drawn without disclosures', async () => {
  const pages = [{ path: progressProofPath, trees: progressProofTrees }, ...progressProofs];
  for (const item of pages) {
    const html = await read(pagePath(item));
    const scene = sceneFor(item);
    assert.equal((html.match(/data-complete-logical-diagram=""/g) || []).length, 1, item.path);
    assert.equal((html.match(/data-logic-node=""/g) || []).length, scene.boxes.length, item.path);
    assert.equal((html.match(/data-logic-gate="/g) || []).length, scene.gates.length, item.path);
    assert.doesNotMatch(html, /<details\b|data-logic-expand|data-logic-overview/);
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
  assert.doesNotMatch(await read('dist/' + frozen), /proof-diagrams|progress-proofs\.css/);
});

test('New public reading pages remain unsigned and use only the shared feedback route', async () => {
  for (const item of [{ path: progressProofPath }, ...progressProofs]) {
    const html = await read(pagePath(item));
    assert.doesNotMatch(html, /董开承|Kaicheng\s+Dong|Dong\s+Kaicheng|<meta\s+name="author"/i, item.path);
    assert.doesNotMatch(html, /\/api\/feedback|<form\b|spectacularsheep\.chatgpt\.site/, item.path);
    assert.ok(html.includes(base + '/feedback/?project=strong-green&amp;version=' + revision));
  }
});

test('Diagram nodes and proof explanations fit their view boxes without overlapping other nodes', () => {
  const scene = buildLogicScene(progressProofTrees, entries);
  assert.equal(scene.anchors.length, new Set(scene.anchors).size);
  for (const node of scene.boxes) {
    assert.ok(node.x >= 0 && node.x + node.width <= scene.width, node.id);
    for (const line of node.titleLines) assert.ok(textWidth(line, 19) <= node.width - 35, node.id);
    for (const line of node.noteLines) assert.ok(textWidth(line, 14) <= node.width - 35, node.id);
  }
  const ordered = [...scene.boxes].sort((a, b) => a.y - b.y);
  for (let i = 1; i < ordered.length; i++) assert.ok(ordered[i].y >= ordered[i - 1].y + ordered[i - 1].height, ordered[i].id);
  for (const gate of scene.gates) {
    for (const line of gate.explanationLines) assert.ok(textWidth(line, 14) <= gate.width + 1, gate.id);
  }
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
  const links = [1, 2].map(() => ({ href: 'https://dongkaicheng.github.io' + base + '/feedback/?project=strong-green&version=' + revision + '&page=' + encodeURIComponent(page) }));
  const events = new Map();
  let contains = false;
  const forest = { querySelector: () => undefined, contains: target => target === node };
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
      getElementById: id => id === node.id ? node : undefined,
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
  location.hash = '#not-a-diagram-node'; events.get('hashchange')();
  assert.equal(new URL(links[0].href).searchParams.get('page'), page);
  location.hash = '#%'; events.get('hashchange')();
  assert.equal(new URL(links[0].href).searchParams.get('page'), page);
});
