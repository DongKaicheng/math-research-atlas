import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { logicalTrees, validateLogicalMap } from '../strong-green/views/content/logical-map.mjs';

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
  assert.ok(html.includes('Read upward from the connected premises'));
  for (const relation of gates) for (const evidence of relation.sources) {
    assert.ok(html.includes(`href="${published(evidence.href)}"`), evidence.href);
  }
  for (const item of nodes) if (item.record) {
    assert.ok(html.includes(`href="${project}/entries/${item.record}/"`), item.record);
  }
  assert.ok(html.includes('data-logic-expand=""'));
  assert.ok(html.includes('data-logic-overview=""'));
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

test('Logical controls and deep hashes affect only the logical disclosures', async () => {
  const source = await read('strong-green/research-map.js');
  const handlers = {};
  const controls = { hidden: true };
  const expand = { addEventListener: (_, fn) => { handlers.expand = fn; } };
  const overview = { addEventListener: (_, fn) => { handlers.overview = fn; } };
  const forest = {
    querySelector: selector => ({ '[data-logic-controls]': controls, '[data-logic-expand]': expand, '[data-logic-overview]': overview })[selector],
    querySelectorAll: () => [outer, inner, other],
    contains: item => item === target,
  };
  const outer = { tagName: 'DETAILS', open: false, parentElement: forest };
  const inner = { tagName: 'DETAILS', open: false, parentElement: outer };
  const other = { tagName: 'DETAILS', open: false, parentElement: forest };
  const target = { parentElement: inner, scrollIntoView() { this.scrolled = true; } };
  vm.runInNewContext(source, {
    document: { querySelector: selector => selector === '[data-logic-forest]' ? forest : null, getElementById: () => target },
    location: { hash: '#logic-chow-retraction' }, window: { addEventListener() {} }, requestAnimationFrame: callback => callback(),
  });
  assert.equal(controls.hidden, false);
  assert.deepEqual([outer.open, inner.open, other.open], [true, true, false]);
  handlers.expand();
  assert.deepEqual([outer.open, inner.open, other.open], [true, true, true]);
  handlers.overview();
  assert.deepEqual([outer.open, inner.open, other.open], [false, false, false]);
});
