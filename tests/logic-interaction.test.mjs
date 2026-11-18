import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildLogicScene } from '../strong-green/views/content/logic-layout.mjs';
import { progressProofTrees } from '../strong-green/views/content/progress-proofs.mjs';

const root = new URL('../', import.meta.url);
const read = file => readFile(new URL(file, root), 'utf8');
const { revision } = JSON.parse(await read('content/strong-green/current.json'));
const { entries } = JSON.parse(await read(`content/strong-green/releases/${revision}/bundle.json`));
const controller = await read('strong-green/research-map.js');

// Compile the actual renderer in memory, so interaction and reading-order
// regressions can be checked without writing or rebuilding published pages.
const built = await build({
  entryPoints: [fileURLToPath(new URL('strong-green/views/components/logic-tree.tsx', root))],
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react'],
  plugins: [{ name: 'public-records-fixture', setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/content$/ }, () => ({ path: 'records', namespace: 'test-records' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-records' }, () => ({ contents: 'export const entries = ' + JSON.stringify(entries), loader: 'js' }));
    builder.onResolve({ filter: /^@\/content\/logic-layout\.mjs$/ }, () => ({ path: fileURLToPath(new URL('strong-green/views/content/logic-layout.mjs', root)) }));
  } }],
});
const renderedModule = { exports: {} };
vm.runInNewContext(built.outputFiles[0].text, { module: renderedModule, exports: renderedModule.exports, require: createRequire(import.meta.url) });
const { CompleteLogicSVG, LogicForest } = renderedModule.exports;

const fixture = [{
  id: 'proof-audit-tree', title: 'Unlinked proof target', summary: 'Interaction fixture.', scope: 'Rendering only.',
  root: { id: 'proof-audit-target', title: 'Intermediate conclusion', status: 'draft', note: 'An addressable node without a primary source link.',
    gate: { kind: 'all', label: 'Joint inputs', explanation: 'A source link remains next to its inference.',
      sources: [{ href: '#proof-audit-input', label: 'Inspect the input' }],
      children: [{ id: 'proof-audit-input', title: 'Input', href: '/papers/example', status: 'hypothesis', note: 'Fixture input.' }],
    },
  },
}];

test('Rendered keyboard and reading order follows the complete graph, with edges behind its content', () => {
  const scene = buildLogicScene(progressProofTrees, entries);
  const svg = renderToStaticMarkup(createElement(CompleteLogicSVG, { trees: progressProofTrees }));
  const positions = new Map([
    ...scene.sections.map(item => [item.id, item.y - 12]),
    ...scene.boxes.map(item => [item.id, item.y]),
    ...scene.gates.map(item => [item.id, item.cy - 29]),
  ]);
  const targets = [...svg.matchAll(/<g id="([^"]+)"[^>]*data-logic-(?:tree|node|gate)="[^"]*"[^>]*>/g)];
  assert.equal(targets.length, scene.anchors.length);
  assert.equal(new Set(targets.map(match => match[1])).size, scene.anchors.length);
  assert.ok(svg.indexOf('class="logic-svg-edges"') < targets[0].index, 'Edges remain a background layer');
  for (let i = 0; i < targets.length; i++) {
    assert.match(targets[i][0], /tabindex="-1"/i, targets[i][1]);
    if (i) assert.ok(positions.get(targets[i][1]) >= positions.get(targets[i - 1][1]),
      `${targets[i - 1][1]} must not precede the earlier ${targets[i][1]}`);
  }
  assert.equal((svg.match(/data-edge-kind="/g) || []).length, scene.edges.length);
  assert.doesNotMatch(svg, /<details\b|display:\s*none/);
});

test('Unlinked nodes retain fragment targets, standalone highlighting and explicit zoom names', () => {
  const html = renderToStaticMarkup(createElement(LogicForest, { trees: fixture }));
  const node = /<g id="proof-audit-target"([^>]*)>([\s\S]*?)<\/g>/.exec(html);
  assert.ok(node);
  assert.match(node[1], /tabindex="-1"/i);
  assert.match(node[2], /^<rect\b/);
  assert.doesNotMatch(node[2], /<a\b/);
  assert.ok(html.includes('.logic-svg-node:target > rect'), 'The exported SVG styles a bare target rectangle too');
  for (const label of ['Zoom out', 'Zoom in', 'Reset zoom to 100%'])
    assert.ok(html.includes('aria-label="' + label + '"'));
  assert.ok(html.includes('href="#proof-audit-tree"'));
  assert.ok(html.includes('href="#proof-audit-input"'));
});

function harness({ scrollY = 102000, scrollLeft = 140, toolbarHeight = 72 } = {}) {
  const handlers = {}, frames = [], events = [], nodes = new Map();
  const location = { hash: '' };
  const state = { zoom: 1, scrollY, scrollX: 0, scrollLeft, cssWrites: 0, nodeScrolls: 0 };
  const viewport = { width: 900, height: 800 };
  const canvasOrigin = { x: 60, y: 2400 };
  const window = {
    get innerWidth() { return viewport.width; }, get innerHeight() { return viewport.height; },
    get scrollX() { return state.scrollX; }, get scrollY() { return state.scrollY; },
    addEventListener: (type, fn) => { handlers[type] = fn; },
    scrollTo(options) { state.scrollX = options.left; state.scrollY = options.top; events.push(['window-scroll', options]); },
    scrollBy(options) { state.scrollX += options.left; state.scrollY += options.top; events.push(['window-scroll-by', options]); },
  };
  const diagram = {
    getBoundingClientRect() {
      const left = canvasOrigin.x + 1 - state.scrollX - state.scrollLeft;
      const top = canvasOrigin.y + 1 - state.scrollY;
      const width = 1120 * state.zoom, height = 208836 * state.zoom;
      return { left, top, right: left + width, bottom: top + height, width, height };
    },
  };
  const canvas = {
    clientLeft: 1, clientWidth: 780,
    get scrollLeft() { return state.scrollLeft; }, set scrollLeft(value) { state.scrollLeft = Math.max(0, Math.min(value, diagram.getBoundingClientRect().width - this.clientWidth)); },
    get scrollTop() { return 0; }, set scrollTop(_) { assert.fail('The expanding diagram scrolls vertically with the window, not inside the canvas'); },
    style: { setProperty(key, value) { assert.equal(key, '--diagram-zoom'); state.zoom = Number(value); state.cssWrites++; } },
    querySelector: selector => selector === '[data-complete-logical-diagram]' ? diagram : null,
    getBoundingClientRect() {
      const left = canvasOrigin.x - state.scrollX, top = canvasOrigin.y - state.scrollY;
      return { left, top, right: left + 782, bottom: top + 208836 * state.zoom + 2, width: 782, height: 208836 * state.zoom + 2 };
    },
  };
  const controls = { hidden: true }, output = { textContent: '100%' };
  const buttons = Object.fromEntries(['+', '-', 'reset'].map(name => [name, { addEventListener: (_, fn) => { handlers[name] = fn; } }]));
  const toolbar = { getBoundingClientRect: () => ({ top: 0, bottom: toolbarHeight }) };
  const forest = {
    contains: item => nodes.get(item.id) === item && !item.outside,
    querySelector: selector => ({
      '[data-diagram-zoom-controls]': controls, '[data-diagram-scroll]': canvas,
      '[data-diagram-zoom-value]': output, '.logic-diagram-tools': toolbar,
      '[data-diagram-zoom="+"]': buttons['+'], '[data-diagram-zoom="-"]': buttons['-'], '[data-diagram-reset]': buttons.reset,
    })[selector],
  };
  const document = {
    activeElement: null,
    querySelector: selector => selector === '[data-logic-forest]' ? forest : null,
    querySelectorAll: () => [],
    getElementById: id => nodes.get(id),
  };
  vm.runInNewContext(controller, { document, window, location, requestAnimationFrame: fn => { frames.push(fn); }, URL });
  function addTarget(id, { kind = 'node', outside = false, y = 50000, margin = 100 } = {}) {
    const target = { id, outside,
      matches: () => ['tree', 'node', 'gate'].includes(kind),
      focus(options) { events.push(['focus', id, options]); document.activeElement = this; },
      scrollIntoView(options) { events.push(['node-scroll', id, options]); state.scrollY = canvasOrigin.y + 1 + y * state.zoom - margin; state.nodeScrolls++; },
      getBoundingClientRect() { return { top: canvasOrigin.y + 1 + y * state.zoom - state.scrollY }; },
    };
    nodes.set(id, target);
    return target;
  }
  function navigate(hash) { location.hash = hash; handlers.hashchange(); }
  function flush() { const pending = frames.splice(0); pending.forEach(fn => fn()); }
  function coordinateAt(x = 451, y = (toolbarHeight + viewport.height) / 2) {
    const bounds = diagram.getBoundingClientRect();
    return { u: (x - bounds.left) / bounds.width, v: (y - bounds.top) / bounds.height };
  }
  return { state, viewport, window, canvas, diagram, controls, output, handlers, frames, events, document, addTarget, navigate, flush, coordinateAt };
}
const closePoint = (actual, expected) => {
  assert.ok(Math.abs(actual.u - expected.u) < 1e-10, `Horizontal reading point moved: ${actual.u} / ${expected.u}`);
  assert.ok(Math.abs(actual.v - expected.v) < 1e-10, `Vertical reading point moved: ${actual.v} / ${expected.v}`);
};

test('Deep zoom preserves the reading coordinate in both scroll surfaces, despite native scroll anchoring', () => {
  const h = harness();
  const before = h.coordinateAt();
  h.handlers['+']();
  assert.equal(h.output.textContent, '110%');
  assert.equal(h.frames.length, 1);
  assert.equal(h.state.scrollY, 102000, 'Layout restoration waits for the animation frame');
  h.state.scrollY += 8500; // The browser may already have anchored the layout.
  h.flush();
  closePoint(h.coordinateAt(), before);
  assert.ok(h.state.scrollLeft > 140);
  assert.ok(h.state.scrollY > 102000);
  h.handlers.reset(); h.flush();
  assert.equal(h.output.textContent, '100%');
  closePoint(h.coordinateAt(), before);
});

test('Repeated zoom actions share the original anchor and respect the 90–200% limits', () => {
  const h = harness({ scrollLeft: 200 });
  const before = h.coordinateAt();
  h.handlers['+'](); h.handlers['+']();
  assert.equal(h.frames.length, 1);
  h.flush();
  assert.equal(h.output.textContent, '120%');
  closePoint(h.coordinateAt(), before);
  for (let i = 0; i < 12; i++) h.handlers['+']();
  h.flush();
  assert.equal(h.output.textContent, '200%');
  closePoint(h.coordinateAt(), before);
  const writes = h.state.cssWrites;
  h.handlers['+']();
  assert.equal(h.state.cssWrites, writes);
  assert.equal(h.frames.length, 0);
  for (let i = 0; i < 14; i++) h.handlers['-']();
  h.flush();
  assert.equal(h.output.textContent, '90%');
  closePoint(h.coordinateAt(), before);
});

test('Zooming a diagram below the viewport preserves the document position', () => {
  const h = harness({ scrollY: 100 });
  h.handlers['+']();
  h.state.scrollY += 50;
  h.flush();
  assert.equal(h.state.scrollY, 100);
  assert.equal(h.state.scrollLeft, 140);
});

test('Node, gate and tree hashes move focus without activating any source link', () => {
  const h = harness({ toolbarHeight: 160 });
  for (const kind of ['node', 'gate', 'tree']) {
    const target = h.addTarget('proof-audit-' + kind, { kind });
    h.navigate('#' + target.id); h.flush();
    assert.equal(h.document.activeElement, target);
    const focusIndex = h.events.findIndex(event => event[0] === 'focus' && event[1] === target.id);
    const scrollIndex = h.events.findIndex(event => event[0] === 'node-scroll' && event[1] === target.id);
    assert.ok(focusIndex < scrollIndex);
    assert.equal(h.events[focusIndex][2].preventScroll, true);
    assert.equal(h.events[scrollIndex][2].inline, 'nearest');
    assert.equal(target.getBoundingClientRect().top, 172, 'A wrapping toolbar cannot cover the destination');
  }
});

test('Malformed, missing, decorative and external hashes cannot take over diagram focus', () => {
  const h = harness();
  h.addTarget('logic-arrow-all', { kind: 'marker' });
  h.addTarget('outside-node', { outside: true });
  for (const hash of ['#%', '#missing-node', '#logic-arrow-all', '#outside-node', '']) {
    h.navigate(hash); h.flush();
    assert.equal(h.document.activeElement, null);
    assert.equal(h.events.length, 0);
  }
});

test('A new hash supersedes pending zoom restoration and earlier hash navigation', () => {
  const h = harness();
  h.addTarget('proof-audit-old');
  const target = h.addTarget('proof-audit-new', { y: 80000 });
  h.handlers['+']();
  h.navigate('#proof-audit-old');
  h.navigate('#proof-audit-new');
  h.flush();
  assert.equal(h.document.activeElement, target);
  assert.equal(h.state.nodeScrolls, 1);
  assert.equal(h.state.scrollY, 2401 + 80000 * 1.1 - 100);
});

test('Zoom requested during a pending hash keeps the destination instead of restoring the old page position', () => {
  const h = harness();
  const target = h.addTarget('proof-audit-destination', { y: 90000 });
  h.navigate('#proof-audit-destination');
  h.handlers['+']();
  h.flush();
  assert.equal(h.document.activeElement, target);
  assert.equal(h.output.textContent, '110%');
  assert.equal(h.state.scrollY, 2401 + 90000 * 1.1 - 100);
});

test('An outside page fragment cancels an older zoom restoration without taking diagram focus', () => {
  const h = harness();
  h.addTarget('page-top', { outside: true });
  h.handlers['+']();
  h.navigate('#page-top');
  h.state.scrollY = 200; // The browser follows the ordinary page fragment.
  h.flush();
  assert.equal(h.state.scrollY, 200);
  assert.equal(h.document.activeElement, null);
  assert.equal(h.state.nodeScrolls, 0);
});
