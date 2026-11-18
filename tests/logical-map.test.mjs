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

function element(html, id) {
  const matches = [...html.matchAll(new RegExp('<([a-z][\\w:-]*)\\b(?=[^>]*\\bid="' + escapeRegExp(id) + '")[^>]*>', 'g'))];
  assert.equal(matches.length, 1, 'Exactly one rendered destination: ' + id);
  const match = matches[0], tokens = new RegExp('<\\/?' + match[1] + '\\b[^>]*>', 'g');
  tokens.lastIndex = match.index;
  let depth = 0, token;
  while ((token = tokens.exec(html))) {
    if (token[0].startsWith('</')) depth--;
    else if (!token[0].endsWith('/>')) depth++;
    if (!depth) return html.slice(match.index, tokens.lastIndex);
  }
  assert.fail('Unclosed rendered destination: ' + id);
}

// This traversal encodes the published identity convention independently of
// the new geometry. A compact layout must not merge repeated scoped records.
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

function published(href) {
  if (href.startsWith('#') || !href.startsWith('/')) return href;
  if (href.startsWith('/source-files/') || /^\/papers\/[^/#?]+\.(?:tex|pdf)(?:[?#]|$)/.test(href))
    return project + '/editions/' + revision + href;
  const split = href.search(/[?#]/), pathname = split < 0 ? href : href.slice(0, split), suffix = split < 0 ? '' : href.slice(split);
  return project + pathname.replace(/\/$/, '') + (/\.[A-Za-z\d]+$/.test(pathname) ? '' : '/') + suffix;
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

test('Six top-down graphs remain visible before the index with complete linked deduction details', async () => {
  const html = await read('dist/projects/strong-green/research-map/index.html');
  const expected = expectedGraph(logicalTrees), allIds = ids(html);
  assert.equal(new Set(allIds).size, allIds.length, 'Inline SVGs, full details and decorative markers have unique IDs');
  assert.equal((html.match(/data-logic-tree=""/g) || []).length, 6);
  assert.equal((html.match(/data-logic-panel="/g) || []).length, 6);
  assert.equal((html.match(/data-complete-logical-diagram=""/g) || []).length, 6);
  assert.equal((html.match(/data-logic-gate="/g) || []).length, gates.length);
  assert.ok(html.indexOf('data-logic-forest') < html.indexOf('id="complete-record-index"'));
  assert.ok(html.includes('<details class="map-reference-index" id="complete-record-index">'));
  assert.match(plain(html), /(?:Read|read|Follow|follow)[^.]*top to bottom/);
  for (const tree of logicalTrees) {
    const panel = element(html, tree.id);
    assert.match(panel, /^<section\b[^>]*data-logic-panel=/, tree.id + ': the graph is not a disclosure');
    assert.equal((panel.match(/data-complete-logical-diagram=""/g) || []).length, 1);
    assert.ok(plain(panel).includes(normalized(tree.title)), tree.id + ': full unit title');
    assert.ok(plain(panel).includes(normalized(tree.summary)), tree.id + ': full reading summary');
    assert.ok(plain(panel).includes(normalized(tree.scope)), tree.id + ': complete ambient scope');
    assert.ok([...panel.matchAll(/<details\b[^>]*>/g)].every(match => /\bdata-logic-detail=|\bclass="[^"]*\blogic-node-register\b/.test(match[0])), tree.id + ': only text details and their register may use disclosures');
    let disclosureDepth = 0;
    for (const [tag] of panel.matchAll(/<\/?(?:details|svg)\b[^>]*>/g)) {
      if (tag.startsWith('<details')) disclosureDepth++;
      else if (tag.startsWith('</details')) disclosureDepth--;
      else if (tag.startsWith('<svg')) assert.equal(disclosureDepth, 0, tree.id + ': graphs stay outside every disclosure');
    }
    assert.equal(disclosureDepth, 0);
    for (const node of expected.nodes.filter(node => node.treeId === tree.id)) {
      const drawn = element(panel, node.id), detail = element(panel, node.id + '-detail');
      assert.match(drawn, /^<g\b[^>]*data-logic-node=/, node.id);
      assert.ok(drawn.includes('data-logic-role="' + node.role + '"'), node.id + ': source, scope and proof roles remain distinct');
      assert.ok(drawn.includes('data-logic-status="' + node.status + '"'), node.id + ': original status');
      assert.match(detail, /^<details\b[^>]*data-logic-detail=/, node.id);
      assert.doesNotMatch(detail, /data-complete-logical-diagram=/, node.id + ': graph is never folded');
      assert.ok(plain(detail).includes(normalized(node.title)), node.id + ': complete title');
      assert.ok(plain(detail).includes(normalized(node.note)), node.id + ': full quantified scope');
      assert.ok(hrefs(drawn).includes('#' + node.id + '-detail'), node.id + ': graph points to its scope');
      if (node.href) assert.ok(hrefs(drawn + detail).includes(published(node.href)), node.id + ': original destination');
      for (const link of node.links) {
        assert.ok(hrefs(detail).includes(published(link.href)), node.id + ': related source');
        assert.ok(plain(detail).includes(normalized(link.label)), node.id + ': related source label');
      }
    }
    for (const gate of expected.gates.filter(gate => gate.treeId === tree.id)) {
      const drawn = element(panel, gate.id), detail = element(panel, gate.id + '-detail');
      assert.ok(drawn.includes('data-logic-gate="' + gate.kind + '"'), gate.id);
      assert.ok(hrefs(drawn).includes('#' + gate.id + '-detail'), gate.id + ': exact inference details');
      assert.doesNotMatch(detail, /data-complete-logical-diagram=/, gate.id + ': graph is never folded');
      if (gate.label) assert.ok(plain(detail).includes(normalized(gate.label)), gate.id + ': complete relation label');
      assert.ok(plain(detail).includes(normalized(gate.explanation)), gate.id + ': complete mechanism');
      for (const id of [...gate.childrenIds, gate.conclusionId, ...gate.ruleIds])
        assert.ok(hrefs(detail).some(href => href === '#' + id || href === '#' + id + '-detail'), gate.id + ': exact participant ' + id);
      for (const link of gate.sources) {
        assert.ok(hrefs(detail).includes(published(link.href)), gate.id + ': evidence ' + link.href);
        assert.ok(plain(detail).includes(normalized(link.label)), gate.id + ': evidence label');
      }
    }
  }
  assert.ok(html.includes('data-diagram-zoom-controls=""'));
  assert.doesNotMatch(html.slice(html.indexOf('data-logic-forest'),html.indexOf('<details class="map-reference-index"')), /data-logic-expand|data-logic-overview/);
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

test('Per-tree zoom and deep links preserve the always-visible graph panel', async () => {
  const source = await read('strong-green/research-map.js');
  const handlers = {};
  const controls = { hidden: true };
  const plus = { addEventListener: (_, fn) => { handlers.plus = fn; } };
  const minus = { addEventListener: (_, fn) => { handlers.minus = fn; } };
  const reset = { addEventListener: (_, fn) => { handlers.reset = fn; } };
  const output = { textContent: '100%' };
  let zoom = 1;
  const diagram = {
    style: {}, getAttribute: name => name === 'width' ? '1120' : '800',
    getBoundingClientRect: () => ({ left: 0, top: 100, right: 1120 * zoom, bottom: 100 + 800 * zoom, width: 1120 * zoom, height: 800 * zoom }),
  };
  const canvas = {
    clientWidth: 1120, clientHeight: 600, clientTop: 0, clientLeft: 0, scrollLeft: 0, scrollTop: 0,
    style: { setProperty(key, value) { handlers[key] = value; zoom = Number(value); } },
    querySelector: selector => selector === '[data-complete-logical-diagram]' ? diagram : undefined,
    getBoundingClientRect: () => ({ left: 0, top: 100, right: 1120, bottom: 700, width: 1120, height: 600 }),
  };
  const panel = {
    tagName: 'SECTION', hidden: false,
    querySelector: selector => ({ '[data-diagram-zoom-controls]': controls, '[data-diagram-zoom="+"]': plus, '[data-diagram-zoom="-"]': minus, '[data-diagram-reset]': reset, '[data-diagram-zoom-value]': output, '[data-diagram-scroll]': canvas })[selector],
    contains: item => item === target,
  };
  const forest = {
    querySelectorAll: selector => selector === '[data-logic-panel]' ? [panel] : [],
    contains: item => item === target,
  };
  panel.parentElement = forest;
  const target = { parentElement: panel, matches: () => true, focus(options) { this.focused = options.preventScroll; }, scrollIntoView() { this.scrolled = true; } };
  vm.runInNewContext(source, {
    document: { querySelector: selector => selector === '[data-logic-forest]' ? forest : null, getElementById: () => target },
    location: { hash: '#logic-chow-retraction' },
    window: { innerWidth: 1200, innerHeight: 900, scrollX: 0, scrollY: 0, addEventListener() {}, scrollTo() {} },
    requestAnimationFrame: callback => callback(),
  });
  assert.equal(controls.hidden, false);
  assert.equal(target.focused, true);
  assert.equal(target.scrolled, true);
  handlers.plus();
  assert.equal(output.textContent, '110%');
  assert.equal(handlers['--diagram-zoom'], '1.1');
  handlers.minus();
  handlers.reset();
  assert.equal(output.textContent, '100%');
  assert.equal(panel.hidden, false);
  assert.equal(panel.tagName, 'SECTION');
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
  const expected = expectedGraph(logicalTrees);
  assert.equal(validateLogicalMap(entries).records, entries.length);
  assert.deepEqual(new Set(scene.boxes.map(item => item.record).filter(Boolean)), new Set(entries.map(item => item.id)));
  assert.deepEqual(new Set(scene.boxes.map(item => item.id)), new Set(expected.nodes.map(item => item.id)), 'Every published scoped occurrence survives');
  assert.deepEqual(new Set(scene.gates.map(item => item.id)), new Set(expected.gates.map(item => item.id)), 'Every published inference anchor survives');
  assert.equal(scene.gates.length, gates.length);
  assert.equal(scene.anchors.length, new Set(scene.anchors).size);
  const html = await read('dist/projects/strong-green/research-map/index.html');
  assert.equal((html.match(/data-logic-node=""/g) || []).length, scene.boxes.length);
  assert.equal((html.match(/data-edge-kind="/g) || []).length, scene.edges.length);
  for (const node of scene.boxes) {
    const source = expected.nodes.find(item => item.id === node.id);
    assert.ok(node.href, node.id);
    assert.equal(node.status, source.status, node.id + ': no status promotion');
    assert.equal(node.note, source.note, node.id + ': complete scope remains available outside the compact box');
  }
  const scalarNodes = scene.boxes.filter(node => node.record === 'OPEN-SCALAR-DETECTION');
  assert.ok(scalarNodes.length >= 3);
  assert.equal(new Set(scalarNodes.map(node => node.id)).size, scalarNodes.length);
  assert.ok(scalarNodes.some(node => node.note.includes('EVERY')));
});

test('Top-down SVG arrows preserve exact premise bundles, IFF, open bridges, blocks and scope edges', () => {
  const scene = buildLogicScene(logicalTrees, entries);
  const expected = expectedGraph(logicalTrees);
  const boxes = new Map(scene.boxes.map(node => [node.id, node]));
  const expectedEdges = [];
  const port = (point, rectangle, side, tolerance, label) => {
    assert.ok(point && Number.isFinite(point.x) && Number.isFinite(point.y), label + ': finite connector endpoint');
    assert.ok(point.x >= rectangle.x - 2 && point.x <= rectangle.x + rectangle.width + 2, label + ': correct participant');
    assert.ok(Math.abs(point.y - rectangle.y - (side === 'bottom' ? rectangle.height : 0)) <= tolerance, label + ': correct border');
  };
  for (const source of expected.gates) {
    const gate = scene.gates.find(item => item.id === source.id);
    assert.equal(gate.kind, source.kind);
    assert.equal(gate.conclusionId, source.conclusionId);
    assert.deepEqual(gate.childrenIds, source.childrenIds, gate.id + ': every joint input is retained');
    assert.deepEqual(gate.ruleIds, source.ruleIds, gate.id + ': support is not silently promoted to an input');
    const outcomes = scene.edges.filter(edge => edge.from === gate.id);
    assert.equal(outcomes.length, 1);
    const outcome = outcomes[0], target = boxes.get(source.conclusionId);
    assert.equal(outcome.to, target.id);
    assert.equal(outcome.kind, source.kind);
    assert.equal(Boolean(outcome.both), gate.kind === 'iff');
    assert.equal(Boolean(outcome.arrow), gate.kind !== 'blocked');
    assert.equal(Boolean(outcome.blocked), gate.kind === 'blocked');
    assert.ok(gate.y + gate.height <= target.y, gate.id + ': junction above its conclusion');
    port(outcome.points?.[0], gate, 'bottom', gate.kind === 'iff' ? 16 : 2, outcome.id);
    port(outcome.points?.at(-1), target, 'top', 16, outcome.id + ': arrowhead clearance');
    expectedEdges.push(gate.id + '|' + target.id + '|' + source.kind);
    const inputs = scene.edges.filter(edge => edge.to === gate.id && edge.kind === 'input');
    assert.deepEqual(new Set(inputs.map(edge => edge.from)), new Set(source.childrenIds));
    assert.equal(inputs.length, source.childrenIds.length);
    for (const edge of inputs) {
      const input = boxes.get(edge.from);
      assert.ok(!edge.arrow && !edge.both && !edge.blocked, edge.id + ': IFF does not create an individual reverse implication');
      assert.equal(edge.relation, source.kind);
      assert.ok(input.y + input.height <= gate.y, edge.id + ': premise above its junction');
      port(edge.points?.[0], input, 'bottom', 2, edge.id);
      port(edge.points?.at(-1), gate, 'top', 2, edge.id);
      expectedEdges.push(edge.from + '|' + gate.id + '|input');
    }
    const rules = scene.edges.filter(edge => edge.to === gate.id && edge.kind === 'rule');
    assert.deepEqual(new Set(rules.map(edge => edge.from)), new Set(source.ruleIds));
    assert.ok(source.ruleIds.every(id => !source.childrenIds.includes(id)));
    for (const id of source.ruleIds) expectedEdges.push(id + '|' + gate.id + '|rule');
    if (gate.kind === 'blocked') {
      assert.equal(target.status, 'open');
      assert.doesNotMatch(target.title, /NOT follow|NOT prove/);
    }
  }
  assert.ok(scene.edges.filter(edge => edge.kind === 'context').every(edge => !edge.arrow));
  assert.ok(scene.boxes.filter(node => node.role === 'rule').every(node => node.record));
  for (const tree of logicalTrees) for (const [index, context] of (tree.contexts || []).entries())
    expectedEdges.push((context.id || `${tree.id}-context-${index}`) + '|' + (tree.root.id || `${tree.id}-root`) + '|context');
  assert.deepEqual(scene.edges.map(edge => edge.from + '|' + edge.to + '|' + edge.kind).sort(), expectedEdges.sort(), 'No added implication bypasses its joint gate');
});

test('Compact graph boxes and inference gates fit in two dimensions with genuine horizontal branches', () => {
  const scene = buildLogicScene(logicalTrees, entries);
  for (const node of scene.boxes)
    for (const line of node.titleLines) assert.ok(textWidth(line, 17) <= node.width - 35, node.id + ' compact title');
  for (const gate of scene.gates)
    for (const line of gate.compactLines) assert.ok(textWidth(line, 12) <= gate.width - 31, gate.id + ' compact label');
  const rectangles = [...scene.boxes, ...scene.gates];
  for (const [index, node] of rectangles.entries()) {
    assert.ok([node.x, node.y, node.width, node.height].every(Number.isFinite), node.id);
    assert.ok(node.width > 0 && node.height > 0 && node.x >= 0 && node.y >= 0 && node.x + node.width <= scene.width + 1 && node.y + node.height <= scene.height + 1, node.id);
    for (const other of rectangles.slice(index + 1)) {
      const intersects = node.x < other.x + other.width && other.x < node.x + node.width && node.y < other.y + other.height && other.y < node.y + node.height;
      assert.equal(intersects, false, node.id + ' / ' + other.id);
    }
  }
  const byId = new Map(scene.boxes.map(node => [node.id, node]));
  for (const tree of logicalTrees) {
    const visualOrder = scene.gates.filter(gate => gate.treeId === tree.id).sort((a, b) => a.y - b.y || a.x - b.x);
    assert.deepEqual(visualOrder.map(gate => gate.number), visualOrder.map((_, index) => String(index + 1).padStart(2, '0')), tree.id + ': step numbers follow top-to-bottom, left-to-right visual order');
    const branching = scene.gates.filter(gate => gate.treeId === tree.id && gate.childrenIds.length > 1);
    assert.ok(branching.length, tree.id + ': contains a nontrivial logical branch');
    assert.ok(branching.some(gate => gate.childrenIds.some((id, index) => gate.childrenIds.slice(index + 1).some(otherId => {
      const a = byId.get(id), b = byId.get(otherId);
      return a.y < b.y + b.height && b.y < a.y + a.height && (a.x + a.width <= b.x || b.x + b.width <= a.x);
    }))), tree.id + ': sibling premises really occupy separate horizontal branches');
  }
});

test('Published graph geometry rejects a changed scope, proof mechanism or premise bundle until regeneration', () => {
  assert.doesNotThrow(() => buildLogicScene([logicalTrees[0]], entries), 'The reviewed published input must render before testing stale data');
  const mutations = [
    tree => { tree.root.note += ' Additional unreviewed scope.'; },
    tree => { tree.root.gate.explanation += ' A changed proof mechanism.'; },
    tree => { tree.root.gate.children.pop(); },
  ];
  for (const mutate of mutations) {
    const tree = structuredClone(logicalTrees[0]);
    mutate(tree);
    assert.throws(() => buildLogicScene([tree], entries), /Stale or missing published logical geometry/, 'A known tree cannot silently fall back to unrelated geometry');
  }
});

test('The downloadable SVG is complete and keeps absolute canonical hyperlinks without a doubled project prefix', async () => {
  const svg = await read('dist/projects/strong-green/assets/complete-logical-map.svg');
  const scene = buildLogicScene(logicalTrees, entries);
  assert.equal((svg.match(/data-logic-node=""/g) || []).length, scene.boxes.length);
  assert.equal((svg.match(/data-logic-gate="/g) || []).length, scene.gates.length);
  assert.doesNotMatch(svg, /<script|foreignObject|<details|\/math-research-atlas\/math-research-atlas/);
  for (const entry of entries) assert.ok(svg.includes(`href="https://dongkaicheng.github.io${project}/editions/${revision}/entries/${entry.id}/"`), entry.id);
  const html = await read('dist/projects/strong-green/research-map/index.html');
  const fingerprint = createHash('sha256').update(svg).digest('hex').slice(0, 16);
  assert.ok(html.includes(`${project}/assets/complete-logical-map.svg?v=${fingerprint}`));
});
