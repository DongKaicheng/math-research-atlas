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
