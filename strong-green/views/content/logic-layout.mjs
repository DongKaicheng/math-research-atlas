// Current reading geometry only. Cached coordinates never supply mathematics.
import { createHash } from 'node:crypto';
import geometryCache from '../../../content/strong-green/logic-diagrams/geometry.json' with { type: 'json' };
import geometryManifest from '../../../content/strong-green/logic-diagrams/manifest.json' with { type: 'json' };
import { logicalTrees } from './logical-map.mjs';
import { progressProofTrees } from './progress-proofs.mjs';

export const graphStatusLabels = { open: 'Open', conditional: 'Conditional', proved: 'Internal proof available', draft: 'Draft · audit pending', hypothesis: 'Hypothesis', published: 'Published result' };
export const graphGateLabels = { all: 'AND', any: 'OR', iff: 'IFF', open: 'OPEN', blocked: 'BLOCKED' };
export const graphLayoutMetrics = Object.freeze({ schemaVersion: 1, boxWidth: 272, titleFontSize: 17, titleLineHeight: 22, statusFontSize: 11, boxBaseHeight: 78, gateWidth: 236, gateHeight: 64, gateFontSize: 12, gateLineHeight: 17, padding: 24, rowGap: 48, siblingGap: 32 });
const gateCaptions = { all: 'All stated inputs', any: 'Any complete route', iff: 'The whole premise bundle', open: 'Unproved bridge', blocked: 'No asserted implication' };
const publishedIds = new Set([...logicalTrees, ...progressProofTrees].map(tree => tree.id));
const manifestById = new Map((geometryManifest.trees || []).map(item => [item.id, item]));

export function textWidth(text, size = 16) {
  return [...String(text)].reduce((sum, c) => sum + size * (/[ilI.,:;'!| ]/.test(c) ? .32 : /[MW@%]/.test(c) ? .9 : /[A-Z]/.test(c) ? .69 : c.codePointAt(0) > 255 ? .85 : .59), 0);
}
export function wrapText(text, width, size = 16) {
  const lines = [];
  for (const paragraph of String(text || '').split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && textWidth(line + ' ' + word, size) > width) { lines.push(line); line = ''; }
      if (textWidth(word, size) > width) {
        for (const c of word) { if (textWidth(line + c, size) > width) { lines.push(line); line = ''; } line += c; }
      } else line += (line ? ' ' : '') + word;
    }
    if (line) lines.push(line);
  }
  return lines;
}
export function canonicalLogicJSON(value) {
  const normalize = item => Array.isArray(item) ? item.map(normalize) : item && typeof item === 'object' ? Object.fromEntries(Object.keys(item).sort().filter(key => item[key] !== undefined).map(key => [key, normalize(item[key])])) : item;
  return JSON.stringify(normalize(value));
}
export const logicHash = value => createHash('sha256').update(typeof value === 'string' ? value : canonicalLogicJSON(value)).digest('hex');

/** Fresh detail data; exact legacy occurrence IDs, including positional gates.
 * Repeated records keep distinct identities and scopes. */
export function prepareLogicTree(tree, records) {
  const byId = new Map(records.map(entry => [entry.id, entry])), usedRecords = new Map(), ids = new Set();
  const model = { id: tree.id, title: tree.title, summary: tree.summary, scope: tree.scope || '', boxes: [], gates: [], edges: [], branches: [] };
  let gateNumber = 0;
  const known = id => { const entry = byId.get(id); if (!entry) throw Error('Unknown diagram record: ' + id); usedRecords.set(id, { id, title: entry.title, summary: entry.summary, status: entry.status, kind: entry.kind }); return entry; };
  const register = id => { if (!id || ids.has(id)) throw Error('Duplicate or missing logical occurrence: ' + id); ids.add(id); };
  function box(item, role, identity) {
    const entry = item.record ? known(item.record) : undefined, title = item.title || entry?.title || '';
    if (!title) throw Error('Diagram node has no title: ' + identity);
    const status = entry?.status || item.status;
    const statusLabel = entry?.kind === 'definition' && entry.status === 'draft' ? 'Definition' : graphStatusLabels[status] || status || '';
    const width = graphLayoutMetrics.boxWidth, titleLines = wrapText(title, width - 36, 17), note = item.note || '';
    const rawLinks = (item.links || []).map(link => ({ ...link }));
    const value = { id: item.id || identity, identity, treeId: tree.id, record: entry?.id, role, title, titleLines, titleFontSize: 17, titleLineHeight: 22,
      status, statusLabel, statusFontSize: 11, note, noteLines: wrapText(note, width - 36, 14), rawLinks,
      links: rawLinks.map(link => ({ ...link, lines: wrapText(link.label, width - 36, 13) })), href: item.href || (entry ? '/entries/' + entry.id : undefined),
      width, height: graphLayoutMetrics.boxBaseHeight + titleLines.length * graphLayoutMetrics.titleLineHeight };
    register(value.id); model.boxes.push(value); return value;
  }
  const edge = (id, from, to, kind, extra = {}) => model.edges.push({ id, treeId: tree.id, from, to, kind, ...extra });
  function node(item, identity, role = 'premise') {
    const current = box(item, role, identity);
    if (!item.gate) return current;
    const relation = item.gate;
    if (!graphGateLabels[relation.kind]) throw Error('Unknown logical gate: ' + relation.kind);
    const gateId = identity + '-gate'; register(gateId);
    const number = String(++gateNumber).padStart(2, '0'), width = graphLayoutMetrics.gateWidth;
    const rawSources = (relation.sources || []).map(link => ({ ...link }));
    const gate = { id: gateId, treeId: tree.id, kind: relation.kind, number, conclusionId: current.id, childrenIds: [], ruleIds: [], rules: [...(relation.rules || [])], ruleNotes: { ...(relation.ruleNotes || {}) },
      label: relation.label || graphGateLabels[relation.kind], explanation: relation.explanation || '', rawSources,
      sources: rawSources.map(link => ({ ...link, lines: wrapText(link.label, width - 36, 13) })),
      relationLines: wrapText(relation.label || graphGateLabels[relation.kind], width - 32, 16), explanationLines: wrapText(relation.explanation || '', width - 32, 14),
      compactLines: [`${graphGateLabels[relation.kind]} · ${number}`, gateCaptions[relation.kind]], compactFontSize: 12, compactLineHeight: 17, width, height: graphLayoutMetrics.gateHeight };
    model.gates.push(gate);
    edge(gateId + '-output', gateId, current.id, relation.kind, { arrow: relation.kind !== 'blocked', both: relation.kind === 'iff', blocked: relation.kind === 'blocked' });
    for (const [index, record] of (relation.rules || []).entries()) {
      const entry = known(record), rule = box({ record, note: relation.ruleNotes?.[record] || entry.summary }, 'rule', `${identity}-rule-${index}`);
      gate.ruleIds.push(rule.id); edge(gateId + '-rule-' + index, rule.id, gateId, 'rule', { arrow: true });
    }
    for (const [index, child] of relation.children.entries()) {
      const premise = node(child, `${identity}-premise-${index}`); gate.childrenIds.push(premise.id);
      edge(gateId + '-input-' + index, premise.id, gateId, 'input', { arrow: false, relation: relation.kind });
    }
    return current;
  }
  function branch(item, identity, role, contexts = [], index = 0) {
    const start = { boxes: model.boxes.length, gates: model.gates.length, edges: model.edges.length };
    const contextBoxes = contexts.map((context, i) => { const entry = context.record ? known(context.record) : undefined; return box({ ...context, note: context.note || entry?.summary || '' }, 'context', `${tree.id}-context-${i}`); });
    const root = node(item, identity, role);
    for (const [i, context] of contextBoxes.entries()) edge(identity + '-context-' + i, context.id, root.id, 'context', { arrow: false });
    model.branches.push({ id: identity, rootId: root.id, index, boxIds: model.boxes.slice(start.boxes).map(value => value.id), gateIds: model.gates.slice(start.gates).map(value => value.id), edgeIds: model.edges.slice(start.edges).map(value => value.id), contextIds: contextBoxes.map(value => value.id) });
  }
  branch(tree.root, tree.id + '-root', 'conclusion', tree.contexts || []);
  for (const [index, related] of (tree.related || []).entries()) branch(related, `${tree.id}-related-${index}`, related.gate?.kind === 'blocked' ? 'unreached target' : 'conclusion', [], index + 1);
  model.inputHash = logicHash({ metrics: graphLayoutMetrics, tree, records: [...usedRecords.values()].sort((a, b) => a.id.localeCompare(b.id)) });
  return model;
}

/** Stack separately proved related deductions without fabricating edges. */
export function stackLogicBranches(model, parts) {
  if (parts.length !== model.branches.length) throw Error('Missing branch geometry: ' + model.id);
  const width = Math.max(...parts.map(part => part.width)), result = { width, height: 0, boxes: {}, gates: {}, edges: {}, texts: [] };
  let y = 0;
  for (const [index, part] of parts.entries()) {
    if (index) { result.texts.push({ x: 24, y: y + 24, text: 'SEPARATE DEDUCTION OR LIMIT · ' + index, kind: 'related' }); y += 44; }
    const dx = (width - part.width) / 2;
    for (const type of ['boxes', 'gates']) for (const [id, rect] of Object.entries(part[type])) result[type][id] = { ...rect, x: rect.x + dx, y: rect.y + y };
    for (const [id, route] of Object.entries(part.edges)) result.edges[id] = { ...route, points: route.points.map(point => ({ x: point.x + dx, y: point.y + y })) };
    y += part.height;
  }
  result.height = y; return result;
}

// Pure TB fallback only for unpublished synthetic test/demo fixtures.
function fixtureGeometry(model) {
  const parts = model.branches.map(branch => {
    const boxes = model.boxes.filter(item => branch.boxIds.includes(item.id)), gates = model.gates.filter(item => branch.gateIds.includes(item.id)), edges = model.edges.filter(item => branch.edgeIds.includes(item.id));
    const items = [...boxes, ...gates], logical = edges.filter(edge => !['rule', 'context'].includes(edge.kind)), ranks = new Map();
    const rank = id => { if (ranks.has(id)) return ranks.get(id); const incoming = logical.filter(edge => edge.to === id); const value = incoming.length ? Math.max(...incoming.map(edge => rank(edge.from))) + 1 : 0; ranks.set(id, value); return value; };
    items.forEach(item => rank(item.id));
    for (const gate of gates) for (const ruleId of gate.ruleIds) ranks.set(ruleId, ranks.get(gate.id));
    const rows = []; for (const item of items) (rows[ranks.get(item.id)] ||= []).push(item);
    const rowWidth = row => row.reduce((sum, item) => sum + item.width, 0) + Math.max(0, row.length - 1) * 32;
    const width = Math.max(...rows.filter(Boolean).map(rowWidth)) + 48, result = { width, height: 0, boxes: {}, gates: {}, edges: {} };
    let y = 24;
    for (const row of rows) {
      if (!row) continue; let x = (width - rowWidth(row)) / 2;
      for (const item of row) { result[branch.boxIds.includes(item.id) ? 'boxes' : 'gates'][item.id] = { x, y, width: item.width, height: item.height }; x += item.width + 32; }
      y += Math.max(...row.map(item => item.height)) + 48;
    }
    result.height = y - 24;
    const rectFor = id => result.boxes[id] || result.gates[id];
    for (const edge of edges) {
      const a = rectFor(edge.from), b = rectFor(edge.to); let points;
      if (['rule', 'context'].includes(edge.kind) && a.y === b.y) {
        const right = a.x < b.x; points = [{ x: a.x + (right ? a.width : 0), y: a.y + a.height / 2 }, { x: b.x + (right ? 0 : b.width), y: b.y + b.height / 2 }];
      } else {
        const start = { x: a.x + a.width / 2, y: a.y + a.height }, end = { x: b.x + b.width / 2, y: b.y }, mid = (start.y + end.y) / 2;
        points = [start, { x: start.x, y: mid }, { x: end.x, y: mid }, end];
      }
      result.edges[edge.id] = { points, curve: 'polyline' };
    }
    return result;
  });
  return stackLogicBranches(model, parts);
}
export function validateLogicGeometry(model, geometry) {
  if (!geometry || !Number.isFinite(geometry.width) || !Number.isFinite(geometry.height) || geometry.width <= 0 || geometry.height <= 0) throw Error('Invalid logical geometry: ' + model.id);
  for (const [kind, objects] of [['boxes', model.boxes], ['gates', model.gates]]) {
    if (Object.keys(geometry[kind] || {}).length !== objects.length) throw Error('Incomplete logical ' + kind + ': ' + model.id);
    for (const object of objects) { const r = geometry[kind][object.id];
      if (!r || !['x', 'y', 'width', 'height'].every(key => Number.isFinite(r[key])) || r.width !== object.width || r.height !== object.height || r.x < 0 || r.y < 0 || r.x + r.width > geometry.width + .05 || r.y + r.height > geometry.height + .05) throw Error('Logical rectangle exceeds its checked geometry: ' + object.id);
    }
  }
  if (Object.keys(geometry.edges || {}).length !== model.edges.length) throw Error('Incomplete logical routes: ' + model.id);
  for (const edge of model.edges) if (!geometry.edges[edge.id]?.points?.length || geometry.edges[edge.id].points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) throw Error('Invalid logical edge geometry: ' + edge.id);
}
function geometryFor(model) {
  const entry = geometryCache.trees?.[model.id], binding = manifestById.get(model.id);
  if (!publishedIds.has(model.id) && !binding && !entry) return fixtureGeometry(model);
  if (!entry || !binding || entry.inputHash !== model.inputHash || binding.inputHash !== model.inputHash) throw Error('Stale or missing published logical geometry; regenerate with node scripts/render-strong-green-logic.mjs: ' + model.id);
  if (geometryCache.schemaVersion !== 1 || geometryManifest.schemaVersion !== 1 || logicHash(entry.geometry) !== binding.geometryHash) throw Error('Logical geometry hash mismatch: ' + model.id);
  return entry.geometry;
}
function pathFor(points, curve) {
  const point = value => `${Number(value.x.toFixed(3))} ${Number(value.y.toFixed(3))}`;
  let d = 'M ' + point(points[0]);
  if (curve === 'bezier' && (points.length - 1) % 3 === 0) for (let i = 1; i < points.length; i += 3) d += ' C ' + points.slice(i, i + 3).map(point).join(' ');
  else for (const value of points.slice(1)) d += ' L ' + point(value);
  return d;
}

/** Cache positions + fresh complete details, with per-tree crop bounds. */
export function buildLogicScene(trees, records) {
  if (!trees.length) return { width: 1000, height: 1, sections: [], boxes: [], gates: [], edges: [], texts: [], anchors: [] };
  const prepared = trees.map(tree => { const model = prepareLogicTree(tree, records), geometry = geometryFor(model); validateLogicGeometry(model, geometry); return { model, geometry }; });
  const width = Math.max(1000, ...prepared.map(item => item.geometry.width)), scene = { width, height: 0, sections: [], boxes: [], gates: [], edges: [], texts: [], anchors: [] };
  let y = 24;
  for (const [index, { model, geometry }] of prepared.entries()) {
    const titleLines = wrapText(model.title, Math.min(width - 108, 1012), 28), summaryLines = wrapText(model.summary, Math.min(width - 108, 1012), 16), scopeLines = wrapText('Scope: ' + model.scope, Math.min(width - 108, 1012), 14);
    const headerHeight = 34 + titleLines.length * 35 + 16 + summaryLines.length * 23 + 13 + scopeLines.length * 20 + 34, dx = (width - geometry.width) / 2, dy = y + headerHeight;
    const section = { id: model.id, number: String(index + 1).padStart(2, '0'), title: model.title, summary: model.summary, scope: model.scope, y, titleLines, summaryLines, scopeLines, contentY: dy, graphBounds: { x: dx, y: dy, width: geometry.width, height: geometry.height }, height: headerHeight + geometry.height + 64 };
    scene.sections.push(section); scene.anchors.push(section.id);
    for (const box of model.boxes) { const rect = geometry.boxes[box.id]; scene.boxes.push({ ...box, ...rect, x: rect.x + dx, y: rect.y + dy }); scene.anchors.push(box.id); }
    // Display numbers follow the visible proof flow, independently of the
    // stable source identities and recursive order used for permanent links.
    const gateNumbers = new Map([...model.gates].sort((a, b) => geometry.gates[a.id].y - geometry.gates[b.id].y || geometry.gates[a.id].x - geometry.gates[b.id].x || a.id.localeCompare(b.id)).map((gate, gateIndex) => [gate.id, String(gateIndex + 1).padStart(2, '0')]));
    for (const gate of model.gates) { const rect = geometry.gates[gate.id], x = rect.x + dx, gy = rect.y + dy, number = gateNumbers.get(gate.id); scene.gates.push({ ...gate, ...rect, number, compactLines: [`${graphGateLabels[gate.kind]} · ${number}`, gateCaptions[gate.kind]], x, y: gy, cx: x + rect.width / 2, cy: gy + rect.height / 2 }); scene.anchors.push(gate.id); }
    for (const edge of model.edges) { const route = geometry.edges[edge.id], points = route.points.map(p => ({ x: p.x + dx, y: p.y + dy })); scene.edges.push({ ...edge, points, start: points[0], end: points.at(-1), d: pathFor(points, route.curve) }); }
    for (const text of geometry.texts || []) scene.texts.push({ ...text, treeId: model.id, x: text.x + dx, y: text.y + dy });
    y += section.height;
  }
  scene.height = y + 24;
  if (new Set(scene.anchors).size !== scene.anchors.length) throw Error('Duplicate SVG anchor');
  return scene;
}
