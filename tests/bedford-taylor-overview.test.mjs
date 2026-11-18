import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, copyFile, mkdir, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {loadBedfordTaylorLogic} from '../lib/bedford-taylor-logic.mjs';
import {loadBedfordTaylorOverview, overviewGeneratorHash, overviewViewHash} from '../lib/bedford-taylor-overview.mjs';

const root = path.resolve(import.meta.dirname, '..');
const content = path.join(root, 'content/bedford-taylor');
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const {revision} = await json(path.join(content, 'current.json'));
const logic = await loadBedfordTaylorLogic(root, revision);
const overview = await loadBedfordTaylorOverview(root, logic);
const diagrams = path.join(content, 'overview-diagrams');
const manifest = await json(path.join(diagrams, 'manifest.json'));
const currentBase = '/math-research-atlas/projects/bedford-taylor';
const fixedBase = currentBase + '/editions/' + revision;
const page = () => readFile(path.join(root, 'dist/projects/bedford-taylor/map/index.html'), 'utf8');
const sorted = values => [...values].sort();
const digest = value => createHash('sha256').update(value).digest('hex');
const normalized = value => String(value).replace(/\s+/g, ' ').trim();
const regexpEscape = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const decode = value => String(value).replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, entity => {
  if (/^&#x/i.test(entity)) return String.fromCodePoint(parseInt(entity.slice(3, -1), 16));
  if (/^&#/.test(entity)) return String.fromCodePoint(Number(entity.slice(2, -1)));
  return {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'"}[entity.toLowerCase()];
});
const plain = value => normalized(decode(String(value).replace(/<[^>]*>/g, ' ')));
const hrefs = html => [...html.matchAll(/\bhref="([^"]+)"/g)].map(match => decode(match[1]));
const ids = html => [...html.matchAll(/\sid="([^"]+)"/g)].map(match => decode(match[1]));
const currentLink = href => href.startsWith(fixedBase + '/') && /\/(?:[?#]|$)/.test(href.slice(fixedBase.length))
  ? currentBase + href.slice(fixedBase.length) : href;

// Extract a semantic element without coupling these checks to its layout tag.
function element(html, attribute, value) {
  const pattern = new RegExp('<([a-z][\\w:-]*)\\b(?=[^>]*\\b' + attribute + '="' + regexpEscape(value) + '")[^>]*>', 'g');
  const matches = [...html.matchAll(pattern)];
  assert.equal(matches.length, 1, `Exactly one ${attribute}="${value}"`);
  const start = matches[0], tag = start[1];
  const tokens = new RegExp('<\\/?' + tag + '\\b[^>]*>', 'g');
  tokens.lastIndex = start.index;
  let depth = 0, token;
  while ((token = tokens.exec(html))) {
    if (token[0].startsWith('</')) depth--;
    else if (!token[0].endsWith('/>')) depth++;
    if (depth === 0) return html.slice(start.index, tokens.lastIndex);
  }
  assert.fail('Unclosed overview element: ' + value);
}

const view = id => {
  const item = overview.views.find(candidate => candidate.id === id);
  assert.ok(item, 'Required total-graph view: ' + id);
  return item;
};

test('The complete total graph projects every original assertion and relation without changing its meaning', () => {
  assert.equal(overview.edition, revision);
  assert.deepEqual(sorted(overview.views.map(item => item.id)), ['complete', 'principal']);
  const complete = view('complete');
  assert.deepEqual(sorted(complete.nodes.map(item => item.id)), sorted(overview.nodes.keys()));
  assert.deepEqual(sorted(complete.relations.map(item => item.id)), sorted(overview.relations.keys()));
  assert.ok(view('principal').relations.length < complete.relations.length, 'The principal view provides a legible selection alongside full coverage');

  for (const section of logic.sections) {
    for (const original of section.nodes) {
      const projected = overview.nodes.get(original.id);
      assert.ok(projected, 'Missing original node: ' + original.id);
      for (const key of Object.keys(original)) assert.deepEqual(projected[key], original[key], original.id + ': ' + key + ' changed in the overview');
      assert.equal(projected.sectionId, section.id);
    }
    for (const original of section.relations) {
      const projected = overview.relations.get(original.id);
      assert.ok(projected, 'Missing original relation: ' + original.id);
      for (const key of Object.keys(original)) assert.deepEqual(projected[key], original[key], original.id + ': ' + key + ' changed in the overview');
      assert.equal(projected.sectionId, section.id);
      assert.equal(projected.anchor, 'logic-' + section.id + '-' + original.id);
    }
  }
  for (const item of overview.views) {
    const nodes = new Set(item.nodes.map(node => node.id));
    assert.equal(nodes.size, item.nodes.length, item.id + ': duplicate assertion');
    assert.equal(new Set(item.relations.map(relation => relation.id)).size, item.relations.length, item.id + ': duplicate logical step');
    for (const relation of item.relations) {
      for (const id of [...relation.premises, relation.conclusion]) assert.ok(nodes.has(id), item.id + ': omitted joint input or conclusion ' + id);
      assert.deepEqual(relation, overview.relations.get(relation.id), 'The displayed relation must retain its exact canonical data');
    }
  }
});

test('The total graph preserves source compatibility, independent detection and the distinction between model and general descent', () => {
  const source = overview.relations.get('energy-r7-zero-defect-solves');
  assert.equal(source.kind, 'implication');
  assert.deepEqual(sorted(source.premises), sorted(['energy-projection', 'energy-probe', 'energy-strong-datum', 'energy-defect-zero']));
  assert.equal(overview.nodes.get('energy-defect-zero').status, 'condition');
  assert.ok(view('principal').relations.some(item => item.id === source.id), 'The principal picture must expose the exact source-solvability gate');
  assert.equal(overview.relations.get('energy-r8-nonzero-defect-obstruction').kind, 'obstruction');

  const alternatives = view('complete').relations.filter(item => item.kind === 'implication' && item.conclusion === 'd-vanishing');
  assert.deepEqual(sorted(alternatives.map(item => item.id)), sorted(['d-e-exact', 'd-e-control', 'd-e-carrier']));
  assert.deepEqual(overview.relations.get('d-e-exact').premises, ['d-transgression', 'd-full-exact']);
  assert.deepEqual(overview.relations.get('d-e-control').premises, ['d-transgression', 'd-fixed-control']);
  assert.equal(overview.nodes.get('d-background-density').status, 'open');
  assert.ok(overview.relations.get('d-e-density-route').premises.includes('d-background-density'));
  assert.equal(overview.nodes.get('d-critical-cancellation').status, 'open');
  assert.ok(overview.relations.get('d-e-model-close').premises.includes('d-critical-cancellation'));
  assert.equal(overview.relations.get('d-e-model-to-general').kind, 'open-step');
  assert.equal(overview.nodes.get('d-general-descent').status, 'open');
  assert.equal(overview.nodes.get('core-strict-gap-detection').status, 'condition');
  assert.ok(overview.relations.get('core-r13-conditional-pointwise').premises.includes('core-strict-gap-detection'));
  assert.equal(overview.relations.get('core-r14-borel-remainder-open').kind, 'open-step');
  assert.equal(overview.relations.get('bridge-capacity-to-energy').kind, 'proof-dependency', 'Bounded capacity is an input to the finite-energy argument, not a sufficient theorem by itself');
  const transgression = overview.relations.get('bridge-bounded-transgression');
  assert.equal(transgression.kind, 'proof-dependency');
  assert.ok(transgression.premises.includes('bridge-degree-one-action'), 'The bounded action must retain its degree-one interface');
  assert.equal(overview.nodes.get('bridge-degree-one-action').status, 'condition');
  const green = overview.relations.get('bridge-descent-energy-green');
  assert.equal(green.kind, 'open-step');
  assert.deepEqual(sorted(green.premises), sorted(['d-general-descent', 'energy-tail-calculus', 'energy-mixed-energy']), 'The open Green interface retains both descent and finite-energy inputs');
  for (const relation of overview.relations.values()) {
    if (relation.conclusion === 'energy-defect-zero' || relation.conclusion === 'core-strict-gap-detection')
      assert.ok(['open-step', 'obstruction'].includes(relation.kind), relation.id + ': an independent condition was promoted to a known consequence');
  }
});

test('Both total-graph reading flows retain all premises and conditions and point to one canonical explanation', async () => {
  const html = await page();
  const allIDs = ids(html);
  assert.equal(new Set(allIDs).size, allIDs.length, 'Overview and focused diagrams must not duplicate fragment IDs');
  const total = element(html, 'id', 'total-logic');
  for (const item of overview.views) {
    const record = element(total, 'data-overview-view', item.id);
    assert.match(element(record, 'data-logic-diagram', 'overview-' + item.id), /<svg\b/, item.id + ': actual logical graph');
    for (const relation of item.relations) {
      const flow = element(record, 'data-overview-relation', item.id + ':' + relation.id);
      assert.match(flow, new RegExp('data-relation-kind="' + relation.kind + '"'), relation.id + ': typed mobile connection');
      for (const nodeID of [...relation.premises, relation.conclusion]) {
        assert.ok(plain(flow).includes(normalized(overview.nodes.get(nodeID).title)), relation.id + ': readable assertion ' + nodeID);
        assert.ok(hrefs(flow).includes('#logic-node-' + nodeID), relation.id + ': canonical assertion link ' + nodeID);
      }
      for (const hypothesis of relation.hypotheses) assert.ok(plain(flow).includes(normalized(hypothesis)), relation.id + ': full hypothesis retained');
      assert.ok(hrefs(flow).includes('#' + relation.anchor), relation.id + ': link to exact logical step');
      if (relation.premises.length > 1) assert.match(plain(flow), /\bAND\b/, relation.id + ': joint premises remain conjunctive');
    }
  }
  for (const relation of overview.relations.values()) {
    const canonical = element(html, 'data-logic-relation', relation.id);
    assert.ok(ids(canonical).includes(relation.anchor), relation.id + ': one stable source explanation');
    for (const hypothesis of relation.hypotheses) assert.ok(plain(canonical).includes(normalized(hypothesis)), relation.id + ': canonical hypotheses retained');
    if (relation.sectionId === overview.bridges.id) {
      assert.ok(plain(canonical).includes(normalized(relation.explanation)), relation.id + ': cross-branch mechanism retained');
      for (const link of relation.links) {
        assert.ok(hrefs(canonical).includes(currentLink(link.url)), relation.id + ': current proof link');
        assert.ok(hrefs(canonical).includes(link.url), relation.id + ': immutable edition evidence');
      }
      const feedback = element(canonical, 'data-logic-feedback', relation.id);
      const context = new URL(hrefs(feedback)[0], 'https://atlas.invalid');
      assert.equal(context.pathname, '/math-research-atlas/feedback/');
      assert.equal(context.searchParams.get('project'), 'bedford-taylor');
      assert.equal(context.searchParams.get('version'), revision);
      const contextPage = new URL(context.searchParams.get('page'), 'https://atlas.invalid');
      assert.equal(contextPage.pathname, currentBase + '/map/');
      assert.equal(contextPage.hash, '#' + relation.anchor);
      assert.equal(context.searchParams.has('entry'), false, 'A derived connection is page context, not an invented theorem identity');
    }
  }
  for (const node of overview.nodes.values()) {
    const canonical = element(html, 'data-logic-node', node.id);
    assert.match(canonical, new RegExp('data-node-status="' + node.status + '"'), node.id + ': canonical status retained');
    assert.ok(ids(canonical).includes('logic-node-' + node.id));
  }
});

test('The actual overview SVGs contain every typed edge and preserve AND inputs and alternative OR routes', async () => {
  for (const item of overview.views) {
    const svg = await readFile(path.join(diagrams, item.id + '.svg'), 'utf8');
    const dot = await readFile(path.join(diagrams, item.id + '.dot'), 'utf8');
    const topology = new Set([...svg.matchAll(/<title>([^<]+)<\/title>/g)].map(match => decode(match[1])));
    const links = new Set(hrefs(svg));
    for (const node of item.nodes) {
      assert.ok(topology.has('n-' + node.id), item.id + ': missing drawn assertion ' + node.id);
      assert.ok(links.has('#logic-node-' + node.id), item.id + ': node must link to its complete scope');
    }
    for (const relation of item.relations) {
      for (const premise of relation.premises) assert.ok(topology.has('n-' + premise + '->r-' + relation.id), item.id + ': graph lost premise ' + premise);
      const alternatives = relation.kind === 'implication' && item.relations.filter(other => other.kind === 'implication' && other.conclusion === relation.conclusion).length > 1;
      assert.ok(topology.has('r-' + relation.id + '->' + (alternatives ? 'or-' : 'n-') + relation.conclusion), relation.id + ': graph output or alternative junction');
      if (alternatives) assert.ok(topology.has('or-' + relation.conclusion + '->n-' + relation.conclusion), relation.id + ': alternative sufficient routes must meet at OR');
      assert.ok(links.has('#' + relation.anchor), relation.id + ': graph must open exact hypotheses');
      const output = dot.split('\n').find(line => line.includes('"r-' + relation.id + '" -> '));
      assert.ok(output, relation.id + ': actual SVG-generating output edge');
      if (relation.kind === 'obstruction') assert.match(output, /arrowhead="?tee"?/, relation.id + ': a blocker is not an implication');
      if (['proof-dependency', 'open-step'].includes(relation.kind)) assert.match(output, /style="?dashed"?/, relation.id + ': non-sufficient or open relation remains distinguished');
    }
  }
});

test('Both overview artifacts are bound to their exact edition, projection, generator and SVG bytes', async () => {
  const generatorHash = await overviewGeneratorHash(root);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.edition, revision);
  assert.equal(manifest.generatorHash, generatorHash);
  assert.deepEqual(sorted(manifest.diagrams.map(item => item.id)), sorted(overview.views.map(item => item.id)));
  for (const item of overview.views) {
    const artifact = manifest.diagrams.find(candidate => candidate.id === item.id);
    assert.equal(artifact.file, item.id + '.svg');
    assert.equal(artifact.inputHash, overviewViewHash(item, revision, generatorHash), item.id + ': stale source projection');
    const svg = await readFile(path.join(diagrams, artifact.file));
    assert.equal(artifact.sha256, digest(svg), item.id + ': unbound diagram bytes');
    assert.equal(artifact.viewBox, svg.toString().match(/viewBox="([^"]+)"/)?.[1]);
    assert.ok(artifact.viewBox.split(/\s+/).every(value => Number.isFinite(Number(value))));
  }
});

async function withOverviewFixture(run) {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'bt-total-logic-'));
  const files = [
    'content/bedford-taylor/research-logic.json',
    ...logic.components.map(file => 'content/bedford-taylor/' + file),
    'content/bedford-taylor/logic-overview.json',
    'content/bedford-taylor/logic-bridges.json',
    'content/bedford-taylor/overview-diagrams/manifest.json',
    ...manifest.diagrams.map(item => 'content/bedford-taylor/overview-diagrams/' + item.file),
    'scripts/render-bedford-taylor-overview.mjs',
    'lib/bedford-taylor-overview.mjs',
    'lib/bedford-taylor-logic.mjs'
  ];
  try {
    for (const file of files) {
      const target = path.join(temporaryRoot, file);
      await mkdir(path.dirname(target), {recursive: true});
      await copyFile(path.join(root, file), target);
    }
    await run(temporaryRoot);
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

test('The overview rejects duplicate identities, duplicate selections and a bridge that creates circular established support', async () => {
  await withOverviewFixture(async temporaryRoot => {
    const directory = path.join(temporaryRoot, 'content/bedford-taylor');
    const configFile = path.join(directory, 'logic-overview.json');
    const bridgeFile = path.join(directory, 'logic-bridges.json');
    const originalConfig = await json(configFile), originalBridges = await json(bridgeFile);
    const load = () => loadBedfordTaylorOverview(temporaryRoot, logic);
    await load();

    const duplicateSelection = structuredClone(originalConfig);
    const principal = duplicateSelection.views.find(item => item.id === 'principal');
    principal.relationIds.push(principal.relationIds[0]);
    await writeFile(configFile, JSON.stringify(duplicateSelection));
    await assert.rejects(load, /duplicate.*references/i);
    await writeFile(configFile, JSON.stringify(originalConfig));

    const duplicateNode = structuredClone(originalBridges);
    duplicateNode.nodes.push(structuredClone(logic.sections[0].nodes[0]));
    await writeFile(bridgeFile, JSON.stringify(duplicateNode));
    await assert.rejects(load, /duplicate.*node/i);

    const circular = structuredClone(originalBridges);
    const original = logic.sections[0].relations.find(item => item.id === 'core-r4-full-bounded-calculus');
    circular.relations.push({
      ...structuredClone(original), id: 'overview-test-circular-support',
      premises: ['core-bounded-calculus'], conclusion: 'core-regularization'
    });
    await writeFile(bridgeFile, JSON.stringify(circular));
    await assert.rejects(load, /circular.*support/i, 'Checking only the three separate branches would miss a cycle introduced by a bridge');
  });
});

test('Publication refuses the old total diagram after a valid source edit drops an independent source-solvability condition', async () => {
  const {buildBedfordTaylorOverview} = await import('../scripts/build-bedford-taylor-overview.mjs');
  await withOverviewFixture(async temporaryRoot => {
    const options = {root: temporaryRoot, revision, currentBase, currentLink};
    const baseline = await buildBedfordTaylorOverview(options);
    assert.ok(baseline.html.includes('total-logic'), 'The unchanged isolated overview fixture must first build successfully');
    const file = path.join(temporaryRoot, 'content/bedford-taylor/logic-energy.json');
    const changed = await json(file);
    const source = changed.relations.find(item => item.id === 'energy-r7-zero-defect-solves');
    source.premises = source.premises.filter(id => id !== 'energy-defect-zero');
    await writeFile(file, JSON.stringify(changed));
    // The loader may accept a syntactically sound edit, but publication must
    // reject the resulting mismatch between new reading text and old SVG.
    await assert.rejects(() => buildBedfordTaylorOverview(options), /stale|regenerat|input.*hash/i);
  });
});
