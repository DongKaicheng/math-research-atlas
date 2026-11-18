// Regenerate current, source-bound Graphviz geometry. --check and the exported
// verifier use only checked-in JSON and source bytes; neither executes dot.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { prepareLogicTree, stackLogicBranches, validateLogicGeometry, logicHash, canonicalLogicJSON, graphLayoutMetrics } from '../strong-green/views/content/logic-layout.mjs';

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = 'content/strong-green/logic-diagrams';
const generatorFiles = ['scripts/render-strong-green-logic.mjs', 'strong-green/views/content/logic-layout.mjs'];
const dataFiles = [
  'content/strong-green/current.json',
  'strong-green/views/content/logical-map.mjs',
  'strong-green/views/content/pairing-progress.mjs',
  'strong-green/views/content/progress-proofs.mjs',
  'strong-green/views/content/progress-proof-core.mjs',
  'strong-green/views/content/progress-proof-kernel.mjs',
  'strong-green/views/content/progress-proof-geometry.mjs',
  'strong-green/views/content/progress-proof-models.mjs',
  'strong-green/views/content/progress-proof-required.mjs',
];
const readJSON = async file => JSON.parse(await readFile(file, 'utf8'));
const quote = value => JSON.stringify(String(value));
const rounded = value => Math.round(value * 1000) / 1000;

async function inputs(root) {
  const pointer = await readJSON(path.join(root, 'content/strong-green/current.json'));
  if (!/^v\d+\.\d+\.\d+$/.test(pointer.revision)) throw Error('Invalid Strong Green geometry edition');
  const bundleFile = `content/strong-green/releases/${pointer.revision}/bundle.json`;
  const bundle = await readJSON(path.join(root, bundleFile));
  const [{ logicalTrees }, { progressProofTrees }] = await Promise.all([
    import(pathToFileURL(path.join(root, 'strong-green/views/content/logical-map.mjs')).href),
    import(pathToFileURL(path.join(root, 'strong-green/views/content/progress-proofs.mjs')).href),
  ]);
  const trees = [...logicalTrees, ...progressProofTrees];
  if (new Set(trees.map(tree => tree.id)).size !== trees.length) throw Error('Duplicate published logical tree identity');
  const sources = await Promise.all([...dataFiles, bundleFile].map(async file => ({ file, sha256: logicHash(await readFile(path.join(root, file), 'utf8')) })));
  const generators = await Promise.all(generatorFiles.map(file => readFile(path.join(root, file), 'utf8')));
  return { revision: pointer.revision, trees, records: bundle.entries, sources,
    generatorHash: logicHash(generators.join('\n--strong-green-geometry-generator--\n')),
    researchTrees: logicalTrees.length, progressTrees: progressProofTrees.length };
}

function dotFor(model, branch) {
  const boxes = model.boxes.filter(item => branch.boxIds.includes(item.id));
  const gates = model.gates.filter(item => branch.gateIds.includes(item.id));
  const edges = model.edges.filter(item => branch.edgeIds.includes(item.id));
  const dot = [`digraph ${quote(branch.id)} {`,
    'graph [rankdir=TB,bgcolor="transparent",fontname="Arial",pad="0.2",nodesep="0.35",ranksep="0.55",splines=polyline,pack=true,packmode="array_u1"];',
    'node [shape=box,fixedsize=true,label="",margin="0,0"];',
    'edge [arrowhead=none,arrowsize=0.8];'];
  for (const item of [...boxes, ...gates]) dot.push(`${quote(item.id)} [width=${quote(item.width / 72)},height=${quote(item.height / 72)}];`);
  for (const gate of gates) {
    if (gate.childrenIds.length > 1) dot.push(`{rank=same;${gate.childrenIds.map(quote).join(';')};}`);
    if (gate.ruleIds.length) dot.push(`{rank=same;${[gate.id, ...gate.ruleIds].map(quote).join(';')};}`);
  }
  if (branch.contextIds.length) dot.push(`{rank=source;${branch.contextIds.map(quote).join(';')};}`);
  for (const edge of edges) {
    const logical = !['rule', 'context'].includes(edge.kind);
    const options = logical ? 'tailport=s,headport=n' : 'constraint=false';
    dot.push(`${quote(edge.from)} -> ${quote(edge.to)} [id=${quote(edge.id)},${options}];`);
  }
  dot.push('}'); return dot.join('\n') + '\n';
}

function graphvizPart(model, branch) {
  const dot = dotFor(model, branch);
  const data = JSON.parse(execFileSync('dot', ['-Tjson'], { input: dot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
  const [left, bottom, right, top] = String(data.bb).split(',').map(Number);
  if (![left, bottom, right, top].every(Number.isFinite)) throw Error('Invalid Graphviz bounds: ' + branch.id);
  const translate = values => ({ x: rounded(values[0] - left + 24), y: rounded(top - values[1] + 24) });
  const part = { width: rounded(right - left + 48), height: rounded(top - bottom + 48), boxes: {}, gates: {}, edges: {} };
  const nodeById = new Map([...model.boxes, ...model.gates].map(item => [item.id, item]));
  for (const object of data.objects || []) {
    const node = nodeById.get(object.name); if (!node) continue;
    const center = translate(object.pos.split(',').map(Number));
    part[branch.boxIds.includes(node.id) ? 'boxes' : 'gates'][node.id] = {
      x: rounded(center.x - node.width / 2), y: rounded(center.y - node.height / 2), width: node.width, height: node.height,
    };
  }
  for (const edge of data.edges || []) {
    if (!branch.edgeIds.includes(edge.id)) throw Error('Graphviz returned an unknown relation route');
    const drawing = (edge._draw_ || []).find(command => command.op === 'b' || command.op === 'L');
    if (!drawing?.points?.length) throw Error('Graphviz omitted a relation route: ' + edge.id);
    part.edges[edge.id] = { points: drawing.points.map(translate), curve: drawing.op === 'b' ? 'bezier' : 'polyline' };
  }
  return { part, dotHash: logicHash(dot) };
}

function checkGeometry(model, geometry) {
  validateLogicGeometry(model, geometry);
  const rectangles = [...Object.entries(geometry.boxes), ...Object.entries(geometry.gates)];
  for (let i = 0; i < rectangles.length; i++) for (let j = i + 1; j < rectangles.length; j++) {
    const [ai, a] = rectangles[i], [bi, b] = rectangles[j];
    if (a.x < b.x + b.width - .1 && a.x + a.width > b.x + .1 && a.y < b.y + b.height - .1 && a.y + a.height > b.y + .1)
      throw Error('Overlapping logical rectangles: ' + ai + ' and ' + bi);
  }
  for (const edge of model.edges) {
    const route = geometry.edges[edge.id];
    if (route.points.some(p => p.x < -.1 || p.y < -.1 || p.x > geometry.width + .1 || p.y > geometry.height + .1)) throw Error('Logical connector exceeds graph bounds: ' + edge.id);
    if (!['rule', 'context'].includes(edge.kind) && route.points[0].y > route.points.at(-1).y + .1) throw Error('A logical connector is not top-to-bottom: ' + edge.id);
  }
}

/** Build hook: validates source bytes and all geometry without executing dot. */
export async function verifyStrongGreenLogicCache(root = scriptRoot) {
  const current = await inputs(root);
  const geometryPath = path.join(root, directory, 'geometry.json');
  const [manifest, bytes] = await Promise.all([readJSON(path.join(root, directory, 'manifest.json')), readFile(geometryPath, 'utf8')]);
  const cache = JSON.parse(bytes);
  if (manifest.schemaVersion !== graphLayoutMetrics.schemaVersion || cache.schemaVersion !== graphLayoutMetrics.schemaVersion || manifest.edition !== current.revision || cache.edition !== current.revision) throw Error('Strong Green logical geometry requires regeneration for this edition');
  if (manifest.generatorHash !== current.generatorHash) throw Error('Strong Green logical geometry generator changed; regenerate the checked-in cache');
  if (canonicalLogicJSON(manifest.sources) !== canonicalLogicJSON(current.sources)) throw Error('Strong Green logical source bytes changed; regenerate the checked-in geometry cache');
  if (manifest.geometrySHA256 !== logicHash(bytes)) throw Error('Strong Green logical geometry artifact hash mismatch');
  const byId = new Map((manifest.trees || []).map(item => [item.id, item]));
  if (byId.size !== current.trees.length || Object.keys(cache.trees || {}).length !== current.trees.length) throw Error('Incomplete Strong Green logical geometry inventory');
  let boxes = 0, gates = 0, maxWidth = 0;
  for (const tree of current.trees) {
    const model = prepareLogicTree(tree, current.records), geometry = cache.trees[tree.id], binding = byId.get(tree.id);
    if (!geometry || !binding || geometry.inputHash !== model.inputHash || binding.inputHash !== model.inputHash) throw Error('Stale published logical geometry: ' + tree.id);
    if (binding.geometryHash !== logicHash(geometry.geometry)) throw Error('Logical tree geometry hash mismatch: ' + tree.id);
    if (binding.nodes !== model.boxes.length || binding.gates !== model.gates.length || binding.edges !== model.edges.length) throw Error('Logical tree coverage mismatch: ' + tree.id);
    checkGeometry(model, geometry.geometry);
    boxes += model.boxes.length; gates += model.gates.length; maxWidth = Math.max(maxWidth, geometry.geometry.width);
  }
  return { trees: current.trees.length, researchTrees: current.researchTrees, progressTrees: current.progressTrees, boxes, gates, maxWidth, generatorHash: manifest.generatorHash };
}

export async function renderStrongGreenLogic(root = scriptRoot) {
  const current = await inputs(root), cache = { schemaVersion: graphLayoutMetrics.schemaVersion, edition: current.revision, trees: {} };
  const version = spawnSync('dot', ['-V'], { encoding: 'utf8' });
  if (version.error || version.status !== 0) throw Error('Graphviz dot is required only for geometry regeneration');
  const graphvizVersion = (version.stderr || version.stdout).trim();
  const manifest = { schemaVersion: graphLayoutMetrics.schemaVersion, edition: current.revision,
    generatorHash: current.generatorHash, graphvizVersion, sources: current.sources,
    geometryFile: 'geometry.json', geometrySHA256: '', trees: [] };
  for (const tree of current.trees) {
    const model = prepareLogicTree(tree, current.records), generated = model.branches.map(branch => graphvizPart(model, branch));
    const geometry = stackLogicBranches(model, generated.map(item => item.part)); checkGeometry(model, geometry);
    cache.trees[tree.id] = { inputHash: model.inputHash, geometry };
    manifest.trees.push({ id: tree.id, inputHash: model.inputHash, geometryHash: logicHash(geometry),
      dotHashes: generated.map(item => item.dotHash), nodes: model.boxes.length, gates: model.gates.length, edges: model.edges.length,
      width: geometry.width, height: geometry.height });
  }
  const bytes = JSON.stringify(cache, null, 2) + '\n'; manifest.geometrySHA256 = logicHash(bytes);
  const output = path.join(root, directory); await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'geometry.json'), bytes);
  await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return verifyStrongGreenLogicCache(root);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = process.argv.includes('--check') ? await verifyStrongGreenLogicCache() : await renderStrongGreenLogic();
  console.log(JSON.stringify(result));
}
