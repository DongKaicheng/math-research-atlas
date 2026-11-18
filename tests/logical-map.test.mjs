import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { logicalTrees, validateLogicalMap } from '../strong-green/views/content/logical-map.mjs';
import { buildLogicScene, textWidth } from '../strong-green/views/content/logic-layout.mjs';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const { revision } = JSON.parse(await read('content/strong-green/current.json'));
const { entries } = JSON.parse(await read(`content/strong-green/releases/${revision}/bundle.json`));
const walk = item => [item, ...(item.gate?.children || []).flatMap(walk)];
const nodes = logicalTrees.flatMap(tree => [tree.root, ...(tree.related || [])].flatMap(walk));
const gates = nodes.filter(item => item.gate).map(item => item.gate);
const project = '/math-research-atlas/projects/strong-green';
function published(href) {
  if (href.startsWith('#') || !href.startsWith('/')) return href;
  const [pathname, anchor] = href.split('#');
  return project + pathname.replace(/\/$/, '') + '/' + (anchor ? '#' + anchor : '');
}

test('Logical map has six scoped, source-backed trees and does not promote registered statuses', () => {
  assert.equal(validateLogicalMap(entries).trees, 6);
  assert.ok(gates.length >= 20);
  assert.deepEqual(new Set(gates.map(g => g.kind)), new Set(['all', 'any', 'iff', 'open', 'blocked']));
  const invalid = structuredClone(logicalTrees);
  invalid[0].root.status = 'proved';
  assert.throws(() => validateLogicalMap(entries, invalid), /must not override source status/);
  delete invalid[0].root.status;
  invalid[0].root.gate.sources = [];
  assert.throws(() => validateLogicalMap(entries, invalid), /Incomplete logical relation/);
});

test('The full target separates construction from functoriality, normalization and comparison', () => {
  const global = logicalTrees.find(tree => tree.id === 'logic-global').root;
  assert.equal(global.record, 'BB-GLOBAL');
  assert.equal(global.gate.kind, 'all');
  assert.equal(global.gate.children.length, 4);
  const construction = global.gate.children[0];
  assert.equal(construction.gate.kind, 'any');
  assert.equal(construction.gate.children.length, 3);
  assert.ok(construction.gate.children.every(route => route.gate.kind === 'all'));
  assert.match(construction.note, /not identified/);
  const local = logicalTrees.find(tree => tree.id === 'logic-green').root;
  assert.equal(local.gate.kind, 'all');
  assert.equal(local.gate.children.length, 3);
  assert.match(local.note, /sufficient construction/);
});

test('Arithmetic equivalences, alternative criteria and non-implications remain distinct', () => {
  const arithmetic = logicalTrees.find(tree => tree.id === 'logic-arithmetic');
  assert.equal(arithmetic.root.gate.kind, 'iff');
  assert.deepEqual(arithmetic.root.gate.children.map(n => n.record), ['OPEN-OFFCENTRAL', 'OPEN-AJ-KERNEL', 'OPEN-RESIDUAL-NC']);
  assert.match(arithmetic.scope, /H1–H4/);
  const fixed = logicalTrees.find(tree => tree.id === 'logic-fixed-field');
  assert.equal(fixed.root.gate.kind, 'any');
  assert.equal(fixed.root.gate.children.length, 2);
  assert.equal(fixed.related[0].gate.kind, 'blocked');
  const fields = logicalTrees.find(tree => tree.id === 'logic-fields');
  assert.equal(fields.root.gate.kind, 'iff');
  assert.equal(fields.root.gate.children.length, 2);
  assert.equal(fields.related[0].gate.kind, 'blocked');
});

test('Rendered logic is visible before the supplementary index, with every evidence link', async () => {
  const html = await read('dist/projects/strong-green/research-map/index.html');
  assert.equal((html.match(/data-logic-tree=""/g) || []).length, 6);
  assert.equal((html.match(/data-logic-gate="/g) || []).length, gates.length);
  assert.ok(html.indexOf('data-logic-forest') < html.indexOf('id="complete-record-index"'));
  assert.ok(html.includes('<details class="map-reference-index" id="complete-record-index">'));
  assert.ok(html.includes('Read upward from premises through a junction'));
  for (const relation of gates) for (const evidence of relation.sources) {
    assert.ok(html.includes(`href="${published(evidence.href)}"`), evidence.href);
  }
  for (const item of nodes) if (item.record) {
    assert.ok(html.includes(`href="${project}/entries/${item.record}/"`), item.record);
  }
  assert.ok(html.includes('data-complete-logical-diagram=""'));
  assert.ok(html.includes('data-diagram-zoom-controls=""'));
  assert.doesNotMatch(html.slice(html.indexOf('data-logic-forest'),html.indexOf('<details class="map-reference-index"')), /<details\b|data-logic-expand|data-logic-overview/);
  assert.ok(html.includes(`${project}/assets/logic-tree.css`));
  const frozen = await read(`dist/projects/strong-green/editions/${revision}/index.html`);
  assert.doesNotMatch(frozen, /logic-tree\.css|logical-map/);
});

test('A supplementary record hash opens the enclosing index as well as its branch', async () => {
  const source = await read('strong-green/research-map.js');
  const index = { tagName: 'DETAILS', open: false };
  const controls = { hidden: true };
  const input = { value: '', addEventListener() {} };
  const button = { addEventListener() {} };
  const root = {
    parentElement: index,
    closest: () => index,
    contains: item => item === target,
    querySelector: selector => ({ '.map-controls': controls, '#map-search': input, '.map-match-count': {}, '.map-empty': {}, '[data-map-expand]': button, '[data-map-overview]': button })[selector],
    querySelectorAll: () => [],
  };
  const branch = { tagName: 'DETAILS', open: false, parentElement: root };
  const group = { tagName: 'DETAILS', open: false, parentElement: branch };
  const target = { tagName: 'LI', parentElement: group, querySelector: () => null, scrollIntoView() { this.scrolled = true; } };
  vm.runInNewContext(source, {
    document: { querySelector: selector => selector === '[data-research-map]' ? root : null, getElementById: id => id === 'map-STRONG-G' ? target : null },
    location: { hash: '#map-STRONG-G' }, window: { addEventListener() {} }, requestAnimationFrame: callback => callback(),
  });
  assert.equal(index.open, true);
  assert.equal(branch.open, true);
  assert.equal(group.open, true);
  assert.equal(target.scrolled, true);
});

test('Diagram zoom and deep links never collapse a branch or modify the supplementary index', async () => {
  const source = await read('strong-green/research-map.js');
  const handlers = {};
  const controls = { hidden: true };
  const plus = { addEventListener: (_, fn) => { handlers.plus = fn; } };
  const minus = { addEventListener: (_, fn) => { handlers.minus = fn; } };
  const reset = { addEventListener: (_, fn) => { handlers.reset = fn; } };
  const output = { textContent: '100%' };
  const canvas = { style: { setProperty: (key, value) => { handlers[key] = value; } } };
  const forest = {
    querySelector: selector => ({ '[data-diagram-zoom-controls]': controls, '[data-diagram-zoom="+"]': plus, '[data-diagram-zoom="-"]': minus, '[data-diagram-reset]': reset, '[data-diagram-zoom-value]': output, '[data-diagram-scroll]': canvas })[selector],
    contains: item => item === target,
  };
  const target = { scrollIntoView() { this.scrolled = true; } };
  vm.runInNewContext(source, {
    document: { querySelector: selector => selector === '[data-logic-forest]' ? forest : null, getElementById: () => target },
    location: { hash: '#logic-chow-retraction' }, window: { addEventListener() {} }, requestAnimationFrame: callback => callback(),
  });
  assert.equal(controls.hidden, false);
  assert.equal(target.scrolled, true);
  handlers.plus();
  assert.equal(output.textContent, '110%');
  assert.equal(handlers['--diagram-zoom'], '1.1');
  handlers.minus();
  handlers.reset();
  assert.equal(output.textContent, '100%');
});

test('Current map resources are content-versioned so cached topic assets cannot disable the logic controls', async () => {
  const html = await read('dist/projects/strong-green/research-map/index.html');
  for (const name of ['research-map.css', 'research-map.js', 'logic-tree.css']) {
    const contents = await read('strong-green/' + name);
    const fingerprint = createHash('sha256').update(contents).digest('hex').slice(0, 16);
    assert.ok(html.includes(`${project}/assets/${name}?v=${fingerprint}`), name);
  }
  const frozen = await read(`dist/projects/strong-green/editions/${revision}/index.html`);
  assert.doesNotMatch(frozen, /research-map|logic-tree/);
});

test('The complete SVG contains every permanent record as a scoped node, rule or definition', async () => {
  const scene = buildLogicScene(logicalTrees, entries);
  assert.equal(validateLogicalMap(entries).records, entries.length);
  assert.deepEqual(new Set(scene.boxes.map(item => item.record).filter(Boolean)), new Set(entries.map(item => item.id)));
  assert.equal(scene.gates.length, gates.length);
  assert.equal(scene.anchors.length, new Set(scene.anchors).size);
  assert.ok(scene.height > 10000, 'The full diagram is not compressed into an unreadable thumbnail');
  const html = await read('dist/projects/strong-green/research-map/index.html');
  assert.equal((html.match(/data-logic-node=""/g) || []).length, scene.boxes.length);
  assert.equal((html.match(/data-edge-kind="/g) || []).length, scene.edges.length);
  for (const node of scene.boxes) {
    assert.ok(node.href, node.id);
    if (node.record) assert.equal(node.status, entries.find(entry => entry.id === node.record).status);
  }
  const scalarNodes = scene.boxes.filter(node => node.record === 'OPEN-SCALAR-DETECTION');
  assert.ok(scalarNodes.length >= 3);
  assert.equal(new Set(scalarNodes.map(node => node.id)).size, scalarNodes.length);
  assert.ok(scalarNodes.some(node => node.noteLines.join(' ').includes('EVERY')));
});

test('SVG arrows join premise bundles; IFF and blocked links cannot become false individual implications', () => {
  const scene = buildLogicScene(logicalTrees, entries);
  for (const gate of scene.gates) {
    const outcome = scene.edges.find(edge => edge.from === gate.id);
    assert.ok(outcome);
    assert.equal(Boolean(outcome.both), gate.kind === 'iff');
    assert.equal(Boolean(outcome.arrow), gate.kind !== 'blocked');
    assert.equal(Boolean(outcome.blocked), gate.kind === 'blocked');
    const inputs = scene.edges.filter(edge => edge.to === gate.id && edge.kind === 'input');
    assert.ok(inputs.length);
    assert.ok(inputs.every(edge => !edge.arrow && !edge.both));
    assert.equal(scene.edges.filter(edge => edge.to === gate.id && edge.kind === 'bundle').length, 1);
    if (gate.kind === 'blocked') {
      const target = scene.boxes.find(node => node.id === outcome.to);
      assert.equal(target.status, 'open');
      assert.doesNotMatch(target.title, /NOT follow|NOT prove/);
    }
  }
  assert.ok(scene.edges.filter(edge => edge.kind === 'context').every(edge => !edge.arrow));
  assert.ok(scene.boxes.filter(node => node.role === 'rule').every(node => node.record));
});

test('All SVG node boxes and their conservative text measurements fit without overlap', () => {
  const scene = buildLogicScene(logicalTrees, entries);
  for (const [index, node] of scene.boxes.entries()) {
    assert.ok(node.x >= 0 && node.y >= 0 && node.x + node.width <= scene.width && node.y + node.height <= scene.height, node.id);
    for (const line of node.titleLines) assert.ok(textWidth(line, 19) <= node.width - 36, node.id + ' title');
    for (const line of node.noteLines) assert.ok(textWidth(line, 14) <= node.width - 36, node.id + ' scope');
    for (const other of scene.boxes.slice(index + 1)) {
      const intersects = node.x < other.x + other.width && other.x < node.x + node.width && node.y < other.y + other.height && other.y < node.y + node.height;
      assert.equal(intersects, false, node.id + ' / ' + other.id);
    }
  }
});

test('The downloadable SVG is complete and keeps absolute canonical hyperlinks without a doubled project prefix', async () => {
  const svg = await read('dist/projects/strong-green/assets/complete-logical-map.svg');
  const scene = buildLogicScene(logicalTrees, entries);
  assert.equal((svg.match(/data-logic-node=""/g) || []).length, scene.boxes.length);
  assert.equal((svg.match(/data-logic-gate="/g) || []).length, scene.gates.length);
  assert.doesNotMatch(svg, /<script|foreignObject|<details|\/math-research-atlas\/math-research-atlas/);
  for (const entry of entries) assert.ok(svg.includes(`href="https://dongkaicheng.github.io${project}/entries/${entry.id}/"`), entry.id);
  const html = await read('dist/projects/strong-green/research-map/index.html');
  const fingerprint = createHash('sha256').update(svg).digest('hex').slice(0, 16);
  assert.ok(html.includes(`${project}/assets/complete-logical-map.svg?v=${fingerprint}`));
});
