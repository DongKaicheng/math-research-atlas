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
const { entries } = JSON.parse(await read('content/strong-green/releases/' + revision + '/bundle.json'));
const controller = await read('strong-green/research-map.js');

// Compile the real renderer in memory; these assertions protect the page
// contract used by the controller without generating published artifacts.
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

const fixture = [0, 1].map(index => ({
  id: 'proof-audit-tree-' + index, title: 'Proof tree ' + index, summary: 'Interaction fixture.', scope: 'Rendering only.',
  root: {
    id: 'proof-audit-target-' + index, title: 'Intermediate conclusion', status: 'draft',
    note: 'The complete explanation remains available for target ' + index + '.',
    gate: {
      kind: 'all', label: 'Joint inputs', explanation: 'A cited joint inference, not an extra premise.',
      sources: [{ href: '#proof-audit-input-' + index, label: 'Inspect the input' }],
      children: [{
        id: 'proof-audit-input-' + index, title: 'Input', href: '/papers/example', status: 'hypothesis', note: 'Fixture input.',
      }],
    },
  },
}));

test('Compact standalone SVG retains every scoped node, gate and logical edge', () => {
  const scene = buildLogicScene(progressProofTrees, entries);
  const svg = renderToStaticMarkup(createElement(CompleteLogicSVG, { trees: progressProofTrees }));
  const targets = [...svg.matchAll(/<g id="([^"]+)"[^>]*data-logic-(?:node|gate)="[^"]*"[^>]*>/g)];
  const expected = new Set([...scene.boxes, ...scene.gates].map(item => item.id));
  assert.deepEqual(new Set(targets.map(match => match[1])), expected);
  assert.equal(targets.length, expected.size, 'Each occurrence has one stable fragment target');
  assert.ok(svg.indexOf('class="logic-svg-edges"') < targets[0].index, 'Edges remain a background layer');
  for (const target of targets) assert.match(target[0], /tabindex="-1"/i, target[1]);
  assert.equal((svg.match(/data-edge-kind="/g) || []).length, scene.edges.length);
  assert.doesNotMatch(svg, /<details\b|display:\s*none/);
});

test('Each proof panel is initially present with its own controls and complete addressable HTML details', () => {
  const html = renderToStaticMarkup(createElement(LogicForest, { trees: fixture }));
  const panels = [...html.matchAll(/<section\b[^>]*data-logic-panel="[^"]*"[^>]*>/g)];
  assert.equal(panels.length, 2);
  assert.equal((html.match(/data-complete-logical-diagram="/g) || []).length, 2);
  assert.equal((html.match(/data-diagram-scroll="/g) || []).length, 2);
  assert.equal((html.match(/data-diagram-zoom-controls="/g) || []).length, 2);
  for (let index = 0; index < 2; index++) {
    const panel = panels.find(match => match[0].includes('id="proof-audit-tree-' + index + '"'));
    assert.ok(panel);
    assert.match(panel[0], /data-logic-tree=/);
    assert.doesNotMatch(panel[0], /\bhidden\b/);
    for (const id of ['proof-audit-target-' + index, 'proof-audit-input-' + index]) {
      const node = new RegExp('<g id="' + id + '"([^>]*)>').exec(html);
      assert.ok(node, id);
      assert.match(node[1], /tabindex="-1"/i);
      const detail = new RegExp('<[a-z][^>]*id="' + id + '-detail"[^>]*>').exec(html);
      assert.ok(detail, id + ' has its complete HTML detail');
      assert.match(detail[0], /data-logic-detail=/);
      assert.ok(html.includes('href="#' + id + '-detail"'), id + ' links to its detail');
    }
    assert.ok(html.includes(fixture[index].root.note));
    assert.ok(html.includes('href="#proof-audit-tree-' + index + '"'));
  }
  for (const attribute of ['data-diagram-zoom="-"', 'data-diagram-zoom="+"', 'data-diagram-reset=""', 'data-diagram-fit=""', 'data-diagram-wide=""']) {
    const buttons = [...html.matchAll(/<button\b[^>]*>/g)].filter(match => match[0].includes(attribute));
    assert.equal(buttons.length, 2, attribute);
    buttons.forEach(button => assert.match(button[0], /aria-label="[^"]+"/));
  }
  assert.match(html, /\.logic-svg-node:target\s*>\s*a\s*>\s*rect/,
    'Targets without a primary source still link to their detail and retain exported highlighting');
});

// This small DOM models two independent scroll viewports and real clamping.
// It deliberately has no document-height diagram: vertical pan is now local.
function harness({ scrollY = 120, toolbarHeight = 76, viewportWidth = 1200,
  canvasWidths = [800, 600], naturalWidths = [1600, 1200], naturalHeights = [2400, 1800],
  maxHeights = [600, 600], stableScrollbarGutter = 0 } = {}) {
  const frames = [], events = [], ids = new Map(), listeners = new Map(), observers = [];
  const location = { hash: '' };
  const page = { scrollX: 0, scrollY };
  const viewport = { width: viewportWidth, height: 900 };
  let document;
  function element(tagName, id, attributes = {}) {
    const attributesMap = new Map(Object.entries(attributes));
    const children = [], handlers = new Map(), classes = new Set();
    const node = {
      tagName: tagName.toUpperCase(), id, parentElement: null, children, hidden: false, open: false,
      disabled: false, textContent: '', style: { setProperty() {} },
      append(child) { child.parentElement = this; children.push(child); return child; },
      setAttribute(name, value) { attributesMap.set(name, String(value)); },
      getAttribute(name) { return attributesMap.has(name) ? attributesMap.get(name) : null; },
      hasAttribute(name) { return attributesMap.has(name); },
      matches(selector) {
        return selector.split(',').some(part => {
          const value = part.trim();
          if (value.startsWith('.')) return classes.has(value.slice(1));
          const match = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(value);
          return match ? attributesMap.has(match[1]) && (match[2] === undefined || attributesMap.get(match[1]) === match[2]) : value.toUpperCase() === this.tagName;
        });
      },
      querySelectorAll(selector) {
        const found = [];
        const visit = current => { for (const child of current.children) { if (child.matches(selector)) found.push(child); visit(child); } };
        visit(this); return found;
      },
      querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
      contains(other) { for (let item = other; item; item = item.parentElement) if (item === this) return true; return false; },
      addEventListener(type, fn) { handlers.set(type, fn); },
      click() { if (!this.disabled) handlers.get('click')?.(); },
      focus(options) { document.activeElement = this; events.push(['focus', this.id, options]); },
      classList: { contains: name => classes.has(name), add: name => classes.add(name),
        toggle(name) { if (classes.has(name)) { classes.delete(name); return false; } classes.add(name); return true; } },
    };
    if (id) ids.set(id, node);
    return node;
  }
  const forest = element('div', 'forest', { 'data-logic-forest': '' });
  const outside = element('div', 'outside');
  const window = {
    get innerWidth() { return viewport.width; }, get innerHeight() { return viewport.height; },
    get scrollX() { return page.scrollX; }, get scrollY() { return page.scrollY; },
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    scrollTo(options) { page.scrollX = options.left; page.scrollY = options.top; events.push(['window-scroll', options]); },
    scrollBy(options) { page.scrollX += options.left; page.scrollY += options.top; events.push(['window-scroll-by', options]); },
  };
  const diagrams = [0, 1].map(index => {
    const state = { availableWidth: canvasWidths[index], naturalWidth: naturalWidths[index], naturalHeight: naturalHeights[index],
      width: naturalWidths[index], height: naturalHeights[index], scrollLeft: 140, scrollTop: 500, cssWrites: 0,
      origin: { x: 40, y: index ? 1150 : 180 } };
    const panel = forest.append(element('section', 'proof-audit-tree-' + index, { 'data-logic-panel': '', 'data-logic-tree': '' }));
    const toolbar = panel.append(element('div')); toolbar.classList.add('logic-diagram-tools');
    const controls = toolbar.append(element('div', '', { 'data-diagram-zoom-controls': '' })); controls.hidden = true;
    const output = controls.append(element('output', '', { 'data-diagram-zoom-value': '' })); output.textContent = '100%';
    const buttons = {};
    for (const [name, attrs] of Object.entries({
      plus: { 'data-diagram-zoom': '+' }, minus: { 'data-diagram-zoom': '-' }, reset: { 'data-diagram-reset': '' },
      fit: { 'data-diagram-fit': '' }, wide: { 'data-diagram-wide': '' },
    })) buttons[name] = controls.append(element('button', '', attrs));
    const canvas = panel.append(element('div', '', { 'data-diagram-scroll': '' }));
    const diagram = canvas.append(element('svg', '', { 'data-complete-logical-diagram': '', width: String(state.naturalWidth), height: String(state.naturalHeight) }));
    Object.defineProperties(canvas, {
      clientLeft: { value: 1 }, clientTop: { value: 1 },
      clientWidth: { get: () => (forest.classList.contains('logic-wide') ? viewport.width - 24 : state.availableWidth) - stableScrollbarGutter },
      clientHeight: { get: () => Math.min(maxHeights[index], state.height) },
      scrollLeft: { get: () => state.scrollLeft, set: value => { state.scrollLeft = Math.max(0, Math.min(value, state.width - canvas.clientWidth)); } },
      scrollTop: { get: () => state.scrollTop, set: value => { state.scrollTop = Math.max(0, Math.min(value, state.height - canvas.clientHeight)); } },
    });
    canvas.style.setProperty = (name, value) => {
      assert.equal(name, '--diagram-zoom'); assert.ok(Number.isFinite(Number(value))); state.cssWrites++;
    };
    Object.defineProperties(diagram.style, {
      width: { get: () => state.width + 'px', set: value => { state.width = parseFloat(value); canvas.scrollLeft = state.scrollLeft; } },
      height: { get: () => state.height + 'px', set: value => { state.height = parseFloat(value); canvas.scrollTop = state.scrollTop; } },
    });
    state.scale = () => state.width / state.naturalWidth;
    canvas.getBoundingClientRect = () => {
      const left = (forest.classList.contains('logic-wide') ? 12 : state.origin.x) - page.scrollX;
      const top = state.origin.y - page.scrollY, width = canvas.clientWidth + stableScrollbarGutter + 2, height = canvas.clientHeight + 2;
      return { left, top, width, height, right: left + width, bottom: top + height };
    };
    diagram.getBoundingClientRect = () => {
      const viewport = canvas.getBoundingClientRect();
      const left = viewport.left + 1 - state.scrollLeft, top = viewport.top + 1 - state.scrollTop;
      return { left, top, width: state.width, height: state.height, right: left + state.width, bottom: top + state.height };
    };
    toolbar.getBoundingClientRect = () => {
      const top = Math.max(0, state.origin.y - toolbarHeight - page.scrollY);
      return { top, bottom: top + toolbarHeight };
    };
    panel.getBoundingClientRect = () => canvas.getBoundingClientRect();
    panel.scrollIntoView = options => { events.push(['target-scroll', panel.id, options]); page.scrollY = state.origin.y; };
    return { state, panel, canvas, diagram, toolbar, controls, output, buttons };
  });
  document = {
    activeElement: null,
    querySelector: selector => selector === '[data-logic-forest]' ? forest : null,
    querySelectorAll: () => [], getElementById: id => ids.get(id) || null,
  };
  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
  }
  vm.runInNewContext(controller, { document, window, location, requestAnimationFrame: fn => frames.push(fn), ResizeObserver, URL });
  function addTarget(id, { index = 0, kind = 'node', x = 1400, y = 2000, ancestors = 0, ownDetails = false, external = false } = {}) {
    const item = diagrams[index];
    let parent = external ? outside : kind === 'detail' ? item.panel : item.diagram;
    const disclosures = [];
    for (let level = 0; level < ancestors; level++) {
      parent = parent.append(element('details')); disclosures.push(parent);
    }
    const target = parent.append(element(ownDetails ? 'details' : kind === 'detail' ? 'article' : 'g', id,
      kind === 'marker' ? { 'data-marker': '' } : { ['data-logic-' + kind]: '' }));
    if (ownDetails) disclosures.push(target);
    target.getBoundingClientRect = () => {
      if (kind === 'detail') {
        const left = item.state.origin.x - page.scrollX, top = item.state.origin.y + 760 - page.scrollY;
        return { left, top, right: left + item.canvas.clientWidth, bottom: top + 90, width: item.canvas.clientWidth, height: 90 };
      }
      const bounds = item.diagram.getBoundingClientRect(), scale = item.state.scale();
      const left = bounds.left + x * scale, top = bounds.top + y * scale;
      return { left, top, width: 160 * scale, height: 80 * scale, right: left + 160 * scale, bottom: top + 80 * scale };
    };
    target.scrollIntoView = options => {
      events.push(['target-scroll', id, options]);
      if (kind === 'detail') { page.scrollY = item.state.origin.y + 760; return; }
      const scale = item.state.scale();
      if (x * scale < item.canvas.scrollLeft) item.canvas.scrollLeft = x * scale;
      else if ((x + 160) * scale > item.canvas.scrollLeft + item.canvas.clientWidth) item.canvas.scrollLeft = (x + 160) * scale - item.canvas.clientWidth;
      if (y * scale < item.canvas.scrollTop) item.canvas.scrollTop = y * scale;
      else if ((y + 80) * scale > item.canvas.scrollTop + item.canvas.clientHeight) item.canvas.scrollTop = (y + 80) * scale - item.canvas.clientHeight;
      const bounds = target.getBoundingClientRect();
      if (bounds.top < 0) page.scrollY += bounds.top;
      else if (bounds.bottom > viewport.height) page.scrollY += bounds.bottom - viewport.height;
    };
    return { target, disclosures };
  }
  function dispatch(type) { for (const fn of listeners.get(type) || []) fn(); }
  function notifyResize() { for (const observer of observers) observer.callback(observer.targets.map(target => ({ target }))); }
  function navigate(hash) { location.hash = hash; dispatch('hashchange'); }
  function flush() { const pending = frames.splice(0); pending.forEach(fn => fn()); }
  function flushAll() { for (let count = 0; frames.length; count++) { assert.ok(count < 10, 'Animation frames must settle'); flush(); } }
  function coordinateAt(index = 0) {
    const { canvas, diagram, toolbar } = diagrams[index];
    const bounds = diagram.getBoundingClientRect(), rect = canvas.getBoundingClientRect(), tools = toolbar.getBoundingClientRect();
    const top = Math.max(0, tools.top <= 0 ? tools.bottom : 0, rect.top + canvas.clientTop, bounds.top);
    const bottom = Math.min(viewport.height, rect.top + canvas.clientTop + canvas.clientHeight, bounds.bottom);
    const left = Math.max(0, rect.left + canvas.clientLeft, bounds.left);
    const right = Math.min(viewport.width, rect.left + canvas.clientLeft + canvas.clientWidth, bounds.right);
    return { u: ((left + right) / 2 - bounds.left) / bounds.width, v: ((top + bottom) / 2 - bounds.top) / bounds.height };
  }
  return { diagrams, page, viewport, forest, document, window, frames, events, addTarget, navigate, dispatch, notifyResize, flush, flushAll, coordinateAt };
}
function closePoint(actual, expected) {
  assert.ok(Math.abs(actual.u - expected.u) < 1e-10, 'Horizontal reading point moved: ' + actual.u + ' / ' + expected.u);
  assert.ok(Math.abs(actual.v - expected.v) < 1e-10, 'Vertical reading point moved: ' + actual.v + ' / ' + expected.v);
}

test('Independent canvases default to a readable fit; zoom preserves both local reading coordinates', () => {
  const h = harness(), [first, second] = h.diagrams;
  assert.equal(first.output.textContent, '70%');
  assert.equal(second.output.textContent, '70%');
  assert.equal(first.controls.hidden, false);
  assert.equal(second.controls.hidden, false);
  const before = h.coordinateAt(), pageBefore = h.page.scrollY;
  const other = { zoom: second.state.scale(), left: second.canvas.scrollLeft, top: second.canvas.scrollTop, writes: second.state.cssWrites };
  first.buttons.plus.click();
  assert.equal(first.output.textContent, '80%');
  assert.equal(h.frames.length, 1);
  h.page.scrollY += 80; // Native anchoring must not turn inner zoom into page scroll.
  h.flush();
  closePoint(h.coordinateAt(), before);
  assert.equal(h.page.scrollY, pageBefore);
  assert.ok(first.canvas.scrollTop > 500);
  assert.deepEqual({ zoom: second.state.scale(), left: second.canvas.scrollLeft, top: second.canvas.scrollTop, writes: second.state.cssWrites }, other);
});

test('Rapid zoom presses reuse one anchor per canvas and respect manual 40–200% limits', () => {
  const h = harness(), first = h.diagrams[0], before = h.coordinateAt();
  first.buttons.plus.click(); first.buttons.plus.click();
  assert.equal(h.frames.length, 1);
  h.flush();
  assert.equal(first.output.textContent, '90%');
  closePoint(h.coordinateAt(), before);
  for (let i = 0; i < 20; i++) first.buttons.plus.click();
  h.flush();
  assert.equal(first.output.textContent, '200%');
  assert.equal(first.buttons.plus.disabled, true);
  const writes = first.state.cssWrites;
  first.buttons.plus.click();
  assert.equal(first.state.cssWrites, writes);
  for (let i = 0; i < 20; i++) first.buttons.minus.click();
  h.flush();
  assert.equal(first.output.textContent, '40%');
  assert.equal(first.buttons.minus.disabled, true);
  assert.equal(h.diagrams[1].output.textContent, '70%');
});

test('Fit width and 100% reset are independent, and resizing refits only fit-mode canvases', () => {
  const h = harness(), [first, second] = h.diagrams;
  const point = h.coordinateAt();
  first.buttons.fit.click(); h.flush();
  assert.equal(first.state.scale(), .5);
  // Once the whole width fits there is no horizontal pan left to preserve;
  // the previous point stays visible and the vertical reading point stays put.
  assert.equal(first.canvas.scrollLeft, 0);
  assert.ok(first.state.width <= first.canvas.clientWidth);
  assert.ok(Math.abs(h.coordinateAt().v - point.v) < 1e-10);
  second.buttons.plus.click(); h.flush();
  assert.equal(second.state.scale(), .8);
  first.state.availableWidth = 1000;
  second.state.availableWidth = 900;
  h.dispatch('resize'); h.flushAll();
  assert.equal(first.state.scale(), .625);
  assert.equal(second.state.scale(), .8, 'A manually zoomed diagram must not refit on window resize');
  first.buttons.reset.click(); h.flush();
  assert.equal(first.output.textContent, '100%');
  first.state.availableWidth = 700;
  h.dispatch('resize'); h.flushAll();
  assert.equal(first.state.scale(), 1, 'Reset establishes an explicit 100% scale');
});

test('Stable scrollbar space settles repeated resize notifications near the height threshold', async () => {
  const css = await read('strong-green/logic-tree.css');
  assert.match(css, /\.logic-diagram-scroll\s*\{[^}]*scrollbar-gutter:\s*stable/,
    'The real canvas must reserve scrollbar space, not only the test viewport');
  const h = harness({ canvasWidths: [1000, 600], naturalWidths: [1080, 1200],
    naturalHeights: [930, 1800], maxHeights: [850, 600], stableScrollbarGutter: 15 });
  const first = h.diagrams[0], scale = first.state.scale(), writes = first.state.cssWrites;
  assert.ok(first.state.height < 850);
  assert.equal(first.canvas.clientWidth, 985, 'The gutter remains reserved even just below the overflow threshold');
  for (let count = 0; count < 8; count++) {
    h.page.scrollY += 31;
    const userPosition = h.page.scrollY;
    h.notifyResize(); h.flushAll();
    assert.equal(h.page.scrollY, userPosition);
    assert.equal(first.state.scale(), scale);
    assert.equal(first.state.cssWrites, writes, 'Unchanged available width must not keep rewriting the fit');
    assert.equal(h.frames.length, 0);
  }
  assert.equal(h.events.filter(event => event[0].startsWith('window-scroll')).length, 0);
});

test('Automatic refits of offscreen panels cannot restore an old page position', () => {
  const h = harness(), second = h.diagrams[1];
  second.state.availableWidth = 1000;
  h.notifyResize(); h.flush();
  assert.ok(second.state.scale() > .7);
  assert.equal(h.frames.length, 0, 'An offscreen automatic fit has no reading-point restoration to queue');
  h.page.scrollY = 30;
  h.notifyResize(); h.flushAll();
  assert.equal(h.page.scrollY, 30);
  assert.equal(h.events.filter(event => event[0].startsWith('window-scroll')).length, 0);
});

test('Page and canvas scrolling after an automatic refit take precedence over a queued anchor', () => {
  for (const gesture of ['page', 'canvas']) {
    const h = harness(), first = h.diagrams[0];
    first.buttons.fit.click(); h.flushAll(); h.events.length = 0;
    first.state.availableWidth = 900;
    h.notifyResize(); h.flush();
    assert.equal(h.frames.length, 1, 'A visible canvas can preserve its internal point until the reader moves');
    if (gesture === 'page') h.page.scrollY += 170;
    else first.canvas.scrollTop += 70;
    const position = [h.page.scrollY, first.canvas.scrollLeft, first.canvas.scrollTop];
    h.flushAll();
    assert.deepEqual([h.page.scrollY, first.canvas.scrollLeft, first.canvas.scrollTop], position, gesture);
    assert.equal(h.events.filter(event => event[0].startsWith('window-scroll')).length, 0, gesture);
  }
});

test('An automatic visible refit preserves its canvas point without scrolling the document', () => {
  const h = harness(), first = h.diagrams[0];
  first.buttons.fit.click(); h.flushAll(); h.events.length = 0;
  const point = h.coordinateAt(), pagePosition = h.page.scrollY;
  first.state.availableWidth = 900;
  h.notifyResize(); h.flushAll();
  closePoint(h.coordinateAt(), point);
  assert.equal(h.page.scrollY, pagePosition);
  assert.equal(h.events.filter(event => event[0].startsWith('window-scroll')).length, 0);
});

test('A 3587px graph fits a 330px narrow canvas while its default and reset stay readable', () => {
  const h = harness({ viewportWidth: 390, canvasWidths: [330, 330], naturalWidths: [3587, 1200] }), first = h.diagrams[0];
  assert.ok(Math.abs(first.state.scale() - .7) < 1e-12);
  assert.ok(first.state.width > first.canvas.clientWidth, 'The actual graph remains horizontally scrollable');
  first.buttons.fit.click(); h.flush();
  assert.ok(Math.abs(first.state.scale() - 330 / 3587) < 1e-12);
  assert.ok(first.state.width <= first.canvas.clientWidth + 1, 'Fit width must display the entire graph, including its widest branches');
  assert.equal(first.output.textContent, '9.2% · overview');
  assert.match(first.output.getAttribute('aria-label'), /Readable size/);
  const writes = first.state.cssWrites;
  first.buttons.minus.click(); h.flush();
  assert.equal(first.state.cssWrites, writes, 'Zoom out cannot enlarge an explicitly fitted small diagram');
  first.buttons.plus.click(); h.flush();
  assert.equal(first.output.textContent, '40%');
  first.buttons.reset.click(); h.flush();
  assert.equal(first.output.textContent, '100%');
});

test('Fit never enlarges a 320px graph inside a 1000px canvas', () => {
  const h = harness({ canvasWidths: [1000, 600], naturalWidths: [320, 1200] }), first = h.diagrams[0];
  assert.equal(first.state.scale(), 1);
  first.buttons.plus.click(); h.flushAll();
  assert.equal(first.state.scale(), 1.1);
  first.buttons.fit.click(); h.flushAll();
  assert.equal(first.state.scale(), 1);
  assert.equal(first.state.width, 320);
  assert.equal(first.output.textContent, '100%');
});

test('Wide mode toggles the forest and all pressed states without changing a manual zoom', () => {
  const h = harness(), [first, second] = h.diagrams;
  first.buttons.reset.click(); second.buttons.fit.click(); h.flushAll();
  first.buttons.wide.click(); h.flushAll();
  assert.equal(h.forest.classList.contains('logic-wide'), true);
  assert.equal(first.buttons.wide.getAttribute('aria-pressed'), 'true');
  assert.equal(second.buttons.wide.getAttribute('aria-pressed'), 'true');
  assert.equal(first.state.scale(), 1);
  assert.equal(second.state.scale(), 1176 / 1200);
  second.buttons.wide.click(); h.flushAll();
  assert.equal(h.forest.classList.contains('logic-wide'), false);
  assert.equal(first.buttons.wide.getAttribute('aria-pressed'), 'false');
  assert.equal(second.state.scale(), .5);
});

test('Zooming an offscreen second canvas preserves the page and the first canvas', () => {
  const h = harness(), [first, second] = h.diagrams;
  const firstPosition = [first.canvas.scrollLeft, first.canvas.scrollTop, first.state.scale()];
  const position = [h.page.scrollY, second.canvas.scrollLeft, second.canvas.scrollTop];
  second.buttons.plus.click();
  h.page.scrollY += 55;
  h.flush();
  assert.deepEqual([h.page.scrollY, second.canvas.scrollLeft, second.canvas.scrollTop], position);
  assert.deepEqual([first.canvas.scrollLeft, first.canvas.scrollTop, first.state.scale()], firstPosition);
});

test('Node and gate hashes pan their own canvas, focus the target and do not activate source links', () => {
  const h = harness({ toolbarHeight: 160 }), first = h.diagrams[0], second = h.diagrams[1];
  const other = [second.canvas.scrollLeft, second.canvas.scrollTop];
  for (const kind of ['node', 'gate']) {
    first.canvas.scrollLeft = 0; first.canvas.scrollTop = 0;
    const { target } = h.addTarget('proof-audit-' + kind, { kind });
    h.navigate('#' + target.id); h.flushAll();
    assert.equal(h.document.activeElement, target);
    assert.ok(first.canvas.scrollLeft > 0 && first.canvas.scrollTop > 0, 'Both diagram axes reach the fragment');
    const focused = h.events.findIndex(event => event[0] === 'focus' && event[1] === target.id);
    const scrolled = h.events.findIndex(event => event[0] === 'target-scroll' && event[1] === target.id);
    assert.ok(focused < scrolled);
    assert.equal(h.events[focused][2].preventScroll, true);
    assert.equal(h.events[scrolled][2].inline, 'nearest');
  }
  assert.deepEqual([second.canvas.scrollLeft, second.canvas.scrollTop], other);
  h.navigate('#proof-audit-tree-1'); h.flushAll();
  assert.equal(h.document.activeElement, second.panel);
});

test('A detail fragment opens its own disclosure and every closed ancestor before focusing it', () => {
  const h = harness();
  const { target, disclosures } = h.addTarget('proof-audit-node-detail', { index: 1, kind: 'detail', ancestors: 2, ownDetails: true });
  assert.ok(disclosures.every(item => !item.open));
  h.navigate('#proof-audit-node-detail');
  assert.ok(disclosures.every(item => item.open));
  h.flushAll();
  assert.equal(h.document.activeElement, target);
  assert.equal(target.getAttribute('tabindex'), '-1');
  assert.equal(h.events.filter(event => event[0] === 'target-scroll').length, 1);
});

test('Malformed, missing, decorative and outside hashes cannot take diagram focus', () => {
  const h = harness();
  h.addTarget('logic-arrow-all', { kind: 'marker' });
  h.addTarget('outside-node', { external: true });
  for (const hash of ['#%', '#missing-node', '#logic-arrow-all', '#outside-node', '']) {
    h.navigate(hash); h.flushAll();
    assert.equal(h.document.activeElement, null);
  }
  assert.equal(h.events.length, 0);
});

test('Rapid hash navigation supersedes older zoom restoration and an earlier target in another panel', () => {
  const h = harness();
  h.addTarget('proof-audit-old');
  const { target, disclosures } = h.addTarget('proof-audit-new-detail', { index: 1, kind: 'detail', ancestors: 1 });
  h.diagrams[0].buttons.plus.click();
  h.navigate('#proof-audit-old');
  h.navigate('#proof-audit-new-detail');
  h.flushAll();
  assert.equal(h.document.activeElement, target);
  assert.ok(disclosures.every(item => item.open));
  assert.deepEqual(h.events.filter(event => event[0] === 'target-scroll').map(event => event[1]), [target.id]);
});

test('Zoom requested while a hash is pending keeps that destination', () => {
  const h = harness();
  const { target } = h.addTarget('proof-audit-destination', { index: 1, x: 950, y: 1500 });
  h.navigate('#proof-audit-destination');
  h.diagrams[1].buttons.plus.click();
  h.flushAll();
  assert.equal(h.document.activeElement, target);
  assert.equal(h.diagrams[1].output.textContent, '80%');
  assert.deepEqual(h.events.filter(event => event[0] === 'target-scroll').map(event => event[1]), [target.id]);
  const rect = target.getBoundingClientRect(), canvas = h.diagrams[1].canvas.getBoundingClientRect();
  assert.ok(rect.top >= canvas.top && rect.bottom <= canvas.bottom);
});

test('An ordinary outside fragment cancels pending diagram zoom without moving focus or page', () => {
  const h = harness();
  h.addTarget('page-top', { external: true });
  h.diagrams[0].buttons.plus.click();
  h.navigate('#page-top');
  h.page.scrollY = 20;
  h.flushAll();
  assert.equal(h.page.scrollY, 20);
  assert.equal(h.document.activeElement, null);
  assert.equal(h.events.filter(event => event[0] === 'target-scroll').length, 0);
});
