import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, copyFile, mkdir, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {loadBedfordTaylorLogic, diagramGeneratorHash, panelHash, graphId, relationAnchor} from '../lib/bedford-taylor-logic.mjs';

const root = path.resolve(import.meta.dirname, '..');
const content = path.join(root, 'content/bedford-taylor');
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const {revision} = await json(path.join(content, 'current.json'));
const logic = await loadBedfordTaylorLogic(root, revision);
const currentBase = '/math-research-atlas/projects/bedford-taylor';
const frozenBase = currentBase + '/editions/' + revision;
const frozenData = path.join(root, 'public/projects/bedford-taylor/editions', revision, 'data');
const topics = await json(path.join(frozenData, 'topics.json'));
const programme = await json(path.join(frozenData, 'programme.json'));
const diagramDir = path.join(content, 'logic-diagrams');
const manifest = await json(path.join(diagramDir, 'manifest.json'));
const htmlPage = () => readFile(path.join(root, 'dist/projects/bedford-taylor/map/index.html'), 'utf8');
const digest = value => createHash('sha256').update(value).digest('hex');
const sorted = values => [...values].sort();
const regexpEscape = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const decode = value => String(value).replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, entity => {
  if (/^&#x/i.test(entity)) return String.fromCodePoint(parseInt(entity.slice(3, -1), 16));
  if (/^&#/.test(entity)) return String.fromCodePoint(Number(entity.slice(2, -1)));
  return {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'"}[entity.toLowerCase()];
});
const plain = html => decode(String(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
// JSON strings are mathematical text, not HTML: q<r ... n>q must survive.
const sourceText = value => String(value).replace(/\s+/g, ' ').trim();
const hrefs = html => [...html.matchAll(/\bhref="([^"]+)"/g)].map(match => decode(match[1]));
const ids = html => [...html.matchAll(/\sid="([^"]+)"/g)].map(match => decode(match[1]));
const currentLink = href => href.startsWith(frozenBase + '/') && /\/(?:[?#]|$)/.test(href.slice(frozenBase.length))
  ? currentBase + href.slice(frozenBase.length) : href;

// Match a semantic record without tying the test to article/div/list layout.
// Balancing its tag handles nested lists and disclosure elements inside a card.
function element(html, attribute, value) {
  const pattern = new RegExp('<([a-z][\\w:-]*)\\b(?=[^>]*\\b' + attribute + '="' + regexpEscape(value) + '")[^>]*>', 'g');
  const matches = [...html.matchAll(pattern)];
  assert.equal(matches.length, 1, `Exactly one ${attribute}="${value}"`);
  const match = matches[0], tag = match[1];
  const tokens = new RegExp('<\\/?' + tag + '\\b[^>]*>', 'g');
  tokens.lastIndex = match.index;
  let depth = 0, token;
  while ((token = tokens.exec(html))) {
    if (token[0].startsWith('</')) depth--;
    else if (!token[0].endsWith('/>')) depth++;
    if (depth === 0) return html.slice(match.index, tokens.lastIndex);
  }
  assert.fail('Unclosed semantic record: ' + value);
}

function section(id) {
  const found = logic.sections.find(item => item.id === id);
  assert.ok(found, 'Required logical section: ' + id);
  return found;
}
function relation(group, id) {
  const found = group.relations.find(item => item.id === id);
  assert.ok(found, 'Required logical relation: ' + id);
  return found;
}
function node(group, id) {
  const found = group.nodes.find(item => item.id === id);
  assert.ok(found, 'Required logical node: ' + id);
  return found;
}

test('Logical records stay edition-bound and cover every frozen topic and formal open item', () => {
  assert.equal(logic.edition, revision);
  assert.equal(programme.items.length, 14, 'An edition change requires a programme coverage review');
  const topicIDs = new Set(topics.map(item => item.id));
  const programmeIDs = new Set(programme.items.map(item => item.id));
  const usedProgramme = new Set();
  const usedTopics = new Set();
  const allNodes = logic.sections.flatMap(group => group.nodes);
  assert.equal(new Set(allNodes.map(item => item.id)).size, allNodes.length, 'Node anchors are global across sections');
  for (const group of logic.sections) {
    assert.ok(group.scope, group.id + ' has an explicit ambient scope');
    for (const item of group.nodes) {
      for (const id of item.topicIds) {
        assert.ok(topicIDs.has(id), item.id + ': unknown frozen topic ' + id);
        usedTopics.add(id);
      }
      for (const id of item.programmeIds) {
        assert.ok(programmeIDs.has(id), item.id + ': unknown formal programme item ' + id);
        usedProgramme.add(id);
      }
    }
    for (const item of [...group.nodes, ...group.relations]) {
      assert.ok(item.links.length, item.id + ' lacks evidence');
      for (const link of item.links) assert.ok(link.url.startsWith(frozenBase + '/'), item.id + ' evidence must remain edition-bound');
    }
  }
  assert.deepEqual(sorted(usedProgramme), sorted(programmeIDs));
  assert.deepEqual(sorted(usedTopics), sorted(topicIDs), 'Every frozen topic needs a scope-qualified logical home');
  assert.ok(programme.items.every(item => item.status === 'OPEN'), 'The derived graph cannot promote the frozen formal programme');
});

test('Every displayed inference retains all joint premises, full conditions, mechanism and current evidence links', async () => {
  const html = await htmlPage();
  const allIDs = ids(html);
  assert.equal(new Set(allIDs).size, allIDs.length, 'Inline diagrams and explanation records cannot duplicate anchors');
  for (const group of logic.sections) {
    assert.ok(plain(html).includes(sourceText(group.scope)), group.id + ': full section scope remains visible');
    for (const item of group.nodes) {
      const record = element(html, 'data-logic-node', item.id);
      assert.match(record, new RegExp('data-node-status="' + item.status + '"'), item.id + ': status retained');
      assert.ok(ids(record).includes('logic-node-' + item.id), item.id + ': stable node destination');
      assert.ok(plain(record).includes(sourceText(item.summary)), item.id + ': complete scope-qualified summary');
    }
    for (const item of group.relations) {
      const record = element(html, 'data-logic-relation', item.id);
      assert.match(record, new RegExp('data-relation-kind="' + item.kind + '"'), item.id + ': logical kind retained');
      assert.equal(allIDs.filter(id => id === relationAnchor(group, item)).length, 1, item.id + ': one source-explanation anchor');
      for (const id of [...item.premises, item.conclusion]) {
        assert.ok(hrefs(record).includes('#logic-node-' + id), item.id + ': linked assertion ' + id);
        assert.ok(plain(record).includes(sourceText(node(group, id).title)), item.id + ': readable assertion ' + id);
      }
      for (const condition of item.hypotheses) assert.ok(plain(record).includes(sourceText(condition)), item.id + ': full additional hypothesis');
      assert.ok(plain(record).includes(sourceText(item.explanation)), item.id + ': inference mechanism');
      for (const link of item.links) assert.ok(hrefs(record).includes(currentLink(link.url)), item.id + ': exact current proof destination ' + link.url);
      const feedback = element(record, 'data-logic-feedback', item.id);
      const feedbackURL = new URL(hrefs(feedback)[0], 'https://example.test');
      assert.equal(feedbackURL.pathname, '/math-research-atlas/feedback/', item.id + ': shared feedback endpoint');
      assert.equal(feedbackURL.searchParams.get('project'), 'bedford-taylor');
      assert.equal(feedbackURL.searchParams.get('version'), revision);
      const contextPage = new URL(feedbackURL.searchParams.get('page'), 'https://example.test');
      assert.equal(contextPage.pathname, currentBase + '/map/');
      assert.equal(contextPage.hash, '#' + relationAnchor(group, item), item.id + ': exact logical-step feedback context');
      assert.ok(!feedbackURL.searchParams.has('entry'), item.id + ': a logical step is general contextual feedback, not a frozen theorem record');
    }
  }
});

test('The graph preserves the mathematical gates separating compatibility, detection and general descent', () => {
  const energy = section('energy-and-equations');
  const source = relation(energy, 'energy-r7-zero-defect-solves');
  assert.equal(source.kind, 'implication');
  assert.deepEqual(sorted(source.premises), sorted(['energy-projection', 'energy-probe', 'energy-strong-datum', 'energy-defect-zero']));
  assert.equal(node(energy, 'energy-defect-zero').status, 'condition');
  assert.equal(relation(energy, 'energy-r8-nonzero-defect-obstruction').kind, 'obstruction');
  assert.ok(energy.relations.filter(item => item.conclusion === 'energy-defect-zero').every(item => ['open-step', 'obstruction'].includes(item.kind)), 'Strong continuity must not silently become zero defect');
  assert.equal(relation(energy, 'energy-r4-fixed-domination').kind, 'implication');
  assert.equal(relation(energy, 'energy-r5-literal-continuity-open').kind, 'open-step');
  assert.equal(relation(energy, 'energy-r10-linear-dirichlet').conclusion, 'energy-linear-dirichlet');
  assert.ok(!energy.relations.some(item => item.premises.includes('energy-linear-dirichlet') && item.conclusion === 'energy-source-solution'), 'The part-form solution cannot stand in for membership in the nonlinear source cone');

  const descent = section('descent');
  const alternatives = descent.relations.filter(item => item.conclusion === 'd-vanishing' && item.kind === 'implication');
  assert.deepEqual(sorted(alternatives.map(item => item.id)), sorted(['d-e-exact', 'd-e-control', 'd-e-carrier']));
  assert.deepEqual(relation(descent, 'd-e-exact').premises, ['d-transgression', 'd-full-exact']);
  assert.deepEqual(relation(descent, 'd-e-control').premises, ['d-transgression', 'd-fixed-control']);
  assert.deepEqual(relation(descent, 'd-e-carrier').premises, ['d-carrier']);
  assert.equal(node(descent, 'd-general-descent').status, 'open');
  assert.equal(node(descent, 'd-critical-cancellation').status, 'open');
  assert.ok(relation(descent, 'd-e-model-close').premises.includes('d-critical-cancellation'));
  assert.equal(relation(descent, 'd-e-model-to-general').kind, 'open-step', 'A supplied model cannot be promoted to arbitrary ordinary germs');
  assert.ok(relation(descent, 'd-e-density-route').premises.includes('d-background-density'));
  assert.equal(node(descent, 'd-background-density').status, 'open');

  const core = section('bounded-calculus-and-relative-capacity');
  const pointwise = relation(core, 'core-r13-conditional-pointwise');
  assert.deepEqual(sorted(pointwise.premises), sorted(['core-qe-domination', 'core-strict-gap-detection']));
  assert.equal(node(core, 'core-strict-gap-detection').status, 'condition');
  assert.ok(core.relations.filter(item => item.conclusion === 'core-strict-gap-detection').every(item => item.kind === 'open-step'), 'CAP-DETECT is an independent obligation, not a deduction from relative quasicontinuity');
  assert.equal(node(core, 'core-borel-inner-regularity').status, 'open');
  assert.equal(relation(core, 'core-r14-borel-remainder-open').kind, 'open-step');
});

test('Every checked-in diagram is bound to its edition, generator, complete logical input and exact SVG bytes', async () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.edition, revision);
  const generatorHash = await diagramGeneratorHash(root);
  assert.equal(manifest.generatorHash, generatorHash, 'Renderer or shared logical schema edits require regenerated diagrams');
  const expected = logic.sections.flatMap(group => group.panels.map(panel => graphId(group, panel)));
  assert.deepEqual(sorted(manifest.diagrams.map(item => item.id)), sorted(expected), 'No missing, extra or duplicated panel diagram');
  for (const group of logic.sections) for (const panel of group.panels) {
    const item = manifest.diagrams.find(diagram => diagram.id === graphId(group, panel));
    assert.equal(item.inputHash, panelHash(group, panel, revision, generatorHash), item.id + ': reviewed data changed without regeneration');
    const svg = await readFile(path.join(diagramDir, item.file));
    assert.equal(item.sha256, digest(svg), item.id + ': diagram bytes differ from the manifest');
    const viewBox = svg.toString().match(/viewBox="([^"]+)"/)?.[1];
    assert.equal(viewBox, item.viewBox);
    assert.ok(viewBox.split(/\s+/).every(value => Number.isFinite(Number(value))), item.id + ': finite viewport');
  }
});

test('Desktop diagrams and mobile flows retain every premise, typed conclusion and proof-detail destination', async () => {
  const html = await htmlPage();
  for (const group of logic.sections) for (const panel of group.panels) {
    const record = element(html, 'data-logic-panel', panel.id);
    const figure = element(record, 'data-logic-diagram', graphId(group, panel));
    assert.match(figure, /<svg\b/, panel.id + ': actual inline graph');
    const svg = await readFile(path.join(diagramDir, graphId(group, panel) + '.svg'), 'utf8');
    const dot = await readFile(path.join(diagramDir, graphId(group, panel) + '.dot'), 'utf8');
    const topology = [...svg.matchAll(/<title>([^<]+)<\/title>/g)].map(match => decode(match[1]));
    for (const id of panel.relationIds) {
      const item = relation(group, id);
      const flow = element(record, 'data-logic-flow', id);
      const detail = element(record, 'data-logic-relation', id);
      for (const premise of item.premises) {
        assert.ok(plain(flow).includes(sourceText(node(group, premise).title)), id + ': mobile input ' + premise);
        assert.ok(topology.includes('n-' + premise + '->r-' + id), id + ': visible graph input ' + premise);
      }
      assert.ok(plain(flow).includes(sourceText(node(group, item.conclusion).title)), id + ': mobile conclusion');
      assert.ok(hrefs(detail).includes('#' + relationAnchor(group, item)), id + ': mobile proof details');
      assert.ok(hrefs(svg).includes('#' + relationAnchor(group, item)), id + ': graph proof details');
      const alternative = panel.relationIds.map(key => relation(group, key)).filter(other => other.conclusion === item.conclusion && other.kind === 'implication').length > 1 && item.kind === 'implication';
      assert.ok(topology.includes('r-' + id + '->' + (alternative ? 'or-' : 'n-') + item.conclusion), id + ': typed graph output');
      if (alternative) assert.ok(topology.includes('or-' + item.conclusion + '->n-' + item.conclusion), id + ': alternative routes remain OR');
      if (item.premises.length > 1) assert.match(plain(flow), /\bAND\b/, id + ': mobile fan-in must be conjunctive');
      const edge = dot.split('\n').find(line => line.includes('id="' + graphId(group, panel) + '-output-' + id + '"'));
      assert.ok(edge, id + ': generated output edge');
      if (item.kind === 'obstruction') assert.match(edge, /arrowhead="?tee"?/, id + ': an obstruction must be drawn as a blocker');
      if (item.kind === 'open-step') assert.match(edge, /style="?dashed"?/, id + ': a proposed route must remain visibly open');
    }
  }
});

test('The build rejects stale diagrams after a valid edit removes the zero-defect premise', async () => {
  const {buildBedfordTaylorLogic} = await import('../scripts/build-bedford-taylor-logic.mjs');
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'bt-logical-map-'));
  try {
    const files = [
      'content/bedford-taylor/research-logic.json',
      ...logic.components.map(file => 'content/bedford-taylor/' + file),
      'content/bedford-taylor/logic-diagrams/manifest.json',
      ...manifest.diagrams.map(item => 'content/bedford-taylor/logic-diagrams/' + item.file),
      'scripts/render-bedford-taylor-logic.mjs',
      'lib/bedford-taylor-logic.mjs'
    ];
    for (const file of files) {
      const target = path.join(temporaryRoot, file);
      await mkdir(path.dirname(target), {recursive: true});
      await copyFile(path.join(root, file), target);
    }
    const options = {root: temporaryRoot, revision, currentBase, currentLink, topics, programme: programme.items};
    const baseline = await buildBedfordTaylorLogic(options);
    assert.ok(baseline.html.includes('energy-r7-zero-defect-solves'), 'The unchanged isolated fixture must build before testing rejection');
    const file = path.join(temporaryRoot, 'content/bedford-taylor/logic-energy.json');
    const changed = await json(file);
    const target = relation(changed, 'energy-r7-zero-defect-solves');
    target.premises = target.premises.filter(id => id !== 'energy-defect-zero');
    await writeFile(file, JSON.stringify(changed));
    // The edit is syntactically valid, but its new HTML and old SVG would tell
    // different mathematical stories. Publication must fail closed here.
    await assert.rejects(() => buildBedfordTaylorLogic(options), /stale|regenerat|input.*hash/i);
  } finally {
    await rm(temporaryRoot, {recursive: true, force: true});
  }
});
