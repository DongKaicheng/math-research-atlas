import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const previousEdition = 'v0.5.2';
const edition = 'v0.5.3';
const read = file => readFile(new URL(file, root), 'utf8');
const bytes = file => readFile(new URL(file, root));
const digest = value => createHash('sha256').update(value).digest('hex');
const normalized = value => String(value).replace(/\s+/g, ' ').trim();
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const paperPath = (version, slug, extension) => `public/projects/strong-green/editions/${version}/papers/${slug}.${extension}`;
const bundlePath = version => `content/strong-green/releases/${version}/bundle.json`;
const previous = JSON.parse(await read(bundlePath(previousEdition)));
const current = JSON.parse(await read(bundlePath(edition)));

// The old published inventory is the baseline, not the new audit's own claims.
// Permanent labels and numbers survive a change of statement environment.
const expected = [
  ['global-height-pairing', 'hyp:height-calculus', '2.1', 'Proposition'],
  ['global-height-pairing', 'hyp:height-supported', '2.2', 'Proposition'],
  ['global-height-pairing', 'hyp:height-trace', '2.3', 'Proposition'],
  ['global-height-pairing', 'hyp:height-immersion', '2.4', 'Proposition'],
  ['global-height-pairing', 'hyp:height-covariance', '2.5', 'Proposition'],
  ['global-height-pairing', 'hyp:height-model', '2.6', 'Proposition'],
  ['global-height-pairing', 'hyp:height-geometric', '2.7', 'Proposition'],
  ['green-constructions', 'hyp:construction-calculus', '1.2', 'Theorem'],
  ['green-height-route', 'groute:current-calculus', '2.1', 'Proposition'],
  ['green-height-route', 'groute:principal-operations', '3.2', 'Proposition'],
  ['green-height-route', 'groute:global-compatibility', '4.1', 'Proposition'],
  ['green-height-route', 'groute:trace', '5.1', 'Proposition'],
  ['obstruction-height-route', 'obroute:fibre-constancy', '3.2', 'Proposition'],
  ['obstruction-height-route', 'obroute:covariance', '3.4', 'Proposition'],
  ['obstruction-height-route', 'obroute:height-identities', '4.1', 'Proposition'],
  ['pairing-constructions', 'prop:numerical', '2.2', 'Proposition'],
  ['pairing-constructions', 'prop:covariance', '2.3', 'Proposition'],
  ['pairing-constructions', 'hyp:height-input', '2.4', 'Theorem'],
  ['strong-g-programme', 'hyp:trace', '2.4', 'Theorem'],
  ['strong-g-programme', 'hyp:rigidity', '3.2', 'Proposition'],
  ['strong-g-programme', 'hyp:assembly', '5.2', 'Hypothesis'],
  ['zhang-height-route', 'hyp:zhang-model-projection', '5.1', 'Hypothesis'],
].map(([paper, label, number, kind]) => ({ paper, label, number, kind }));
const identity = ({ paper, label }) => `${paper}#${label}`;
const identities = items => items.map(identity).sort();
const statementKinds = new Set(['theorem', 'proposition', 'lemma', 'corollary', 'definition', 'hypothesis', 'conjecture', 'problem', 'remark', 'example']);

function texStatements(source) {
  return [...source.matchAll(/\\begin\{(theorem|proposition|lemma|corollary|definition|hypothesis|conjecture|problem|remark|example)\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{\1\}/g)].map(match => {
    const label = match[3].match(/\\label(?:\[([^\]]+)\])?\{([^}]+)\}/);
    return { kind: match[1], title: normalized(match[2] || ''), label: label?.[2], labelKind: label?.[1], body: match[3] };
  });
}

// Read actual rendered statement containers; a label in prose or a cross-link
// does not count as a correctly numbered theorem destination.
function htmlStatements(html) {
  const stack = [], statements = [];
  for (const token of html.matchAll(/<\/?div\b[^>]*>/g)) {
    if (token[0].startsWith('</')) {
      const opening = stack.pop();
      assert.ok(opening, 'Balanced rendered div containers');
      if (!opening.kind) continue;
      const body = html.slice(opening.start, token.index + token[0].length);
      const heading = body.match(/<(?:strong|em)\b[^>]*>\s*(Theorem|Proposition|Lemma|Corollary|Definition|Hypothesis|Conjecture|Problem|Remark|Example)\s+([\dA-Z]+(?:\.[\dA-Z]+)*)\s*<\/(?:strong|em)>/);
      assert.ok(heading, 'A numbered heading for each rendered ' + opening.kind);
      assert.equal(heading[1].toLowerCase(), opening.kind, 'Heading and statement class agree');
      statements.push({ kind: heading[1], number: heading[2], labels: [...body.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]), body });
    } else {
      const classes = token[0].match(/\bclass="([^"]*)"/)?.[1].split(/\s+/) || [];
      stack.push({ start: token.index, kind: classes.find(kind => statementKinds.has(kind)) });
    }
  }
  assert.equal(stack.length, 0, 'All rendered div containers close');
  return statements;
}

async function loadPapers(bundle, version) {
  return new Map(await Promise.all(bundle.papers.map(async registered => {
    const metadata = JSON.parse(await read(`content/strong-green/releases/${version}/papers/${registered.slug}.json`));
    const source = await read(paperPath(version, registered.slug, 'tex'));
    return [registered.slug, { registered, metadata, source, tex: texStatements(source), html: htmlStatements(metadata.html) }];
  })));
}

const oldPapers = await loadPapers(previous, previousEdition);
const papers = await loadPapers(current, edition);

function statement(collection, paper, label) {
  const item = collection.get(paper);
  assert.ok(item, paper);
  const tex = item.tex.filter(row => row.label === label);
  const html = item.html.filter(row => row.labels.includes(label));
  assert.equal(tex.length, 1, `${paper}#${label}: one source statement`);
  assert.equal(html.length, 1, `${paper}#${label}: one rendered statement`);
  assert.equal([...item.metadata.html.matchAll(new RegExp('\\bid="' + escapeRegExp(label) + '"', 'g'))].length, 1, `${paper}#${label}: one HTML anchor`);
  assert.equal(tex[0].kind, html[0].kind.toLowerCase(), `${paper}#${label}: source and HTML type`);
  if (tex[0].labelKind) assert.equal(tex[0].labelKind, tex[0].kind, `${paper}#${label}: cross-reference type`);
  return { tex: tex[0], html: html[0] };
}

test('The frozen v0.5.2 inventory has exactly the 22 reviewed hypotheses', () => {
  assert.equal(previous.papers.length, 11);
  const inventory = [...oldPapers].flatMap(([paper, item]) => item.tex.filter(row => row.kind === 'hypothesis').map(row => ({ paper, label: row.label })));
  assert.equal(inventory.length, 22);
  assert.deepEqual(identities(inventory), identities(expected));
  for (const item of expected) {
    const old = statement(oldPapers, item.paper, item.label);
    assert.equal(old.html.kind, 'Hypothesis', identity(item));
    assert.equal(old.html.number, item.number, identity(item));
  }
});

test('All 22 reviewed statements retain their anchors and numbers with exactly 20 promotions and two hypotheses', () => {
  assert.deepEqual([...papers.keys()].sort(), [...oldPapers.keys()].sort());
  const counts = { Proposition: 0, Theorem: 0, Hypothesis: 0 };
  for (const item of expected) {
    const actual = statement(papers, item.paper, item.label);
    assert.equal(actual.html.kind, item.kind, identity(item));
    assert.equal(actual.html.number, item.number, identity(item));
    counts[actual.html.kind]++;
  }
  assert.deepEqual(counts, { Proposition: 17, Theorem: 3, Hypothesis: 2 });
  const remaining = [...papers].flatMap(([paper, item]) => item.tex.filter(row => row.kind === 'hypothesis').map(row => ({ paper, label: row.label })));
  assert.deepEqual(identities(remaining), identities(expected.filter(item => item.kind === 'Hypothesis')));
});

test('The public audit binds every old and new statement to its actual paper source', () => {
  const audit = current.publication.hypothesisAudit;
  const change = current.publication.change;
  assert.equal(audit.previousEdition, previousEdition);
  assert.equal(audit.edition, edition);
  assert.deepEqual([audit.reviewed, audit.promoted, audit.retained], [22, 20, 2]);
  assert.deepEqual([change.reviewedHypotheses, change.promotedHypotheses, change.retainedHypotheses], [22, 20, 2]);
  assert.match(audit.reviewType, /internal AI-assisted source review/i);
  assert.match(audit.reviewType, /not external peer review or formal verification/);
  assert.equal(audit.rows.length, 22);
  assert.equal(new Set(audit.rows.map(identity)).size, 22, 'No repeated row can conceal an omitted hypothesis');
  assert.deepEqual(identities(audit.rows), identities(expected));
  assert.deepEqual([...change.anchorsPreserved].sort(), identities(expected));
  assert.deepEqual([...change.retainedConditions].sort(), identities(expected.filter(item => item.kind === 'Hypothesis')));
  for (const item of expected) {
    const row = audit.rows.find(row => identity(row) === identity(item));
    const old = statement(oldPapers, item.paper, item.label);
    const actual = statement(papers, item.paper, item.label);
    assert.equal(row.title, old.tex.title, identity(item) + ': the reviewed title identifies the frozen statement');
    assert.equal(row.previousKind, old.html.kind, identity(item));
    assert.equal(row.previousNumber, old.html.number, identity(item));
    assert.equal(row.currentKind, actual.html.kind, identity(item));
    assert.equal(row.currentNumber, actual.html.number, identity(item));
    assert.equal(row.outcome, item.kind === 'Hypothesis' ? 'Retained hypothesis' : 'Internal proof available', identity(item));
    assert.ok(normalized(row.scope).length > 40, identity(item) + ': mathematical scope is recorded');
    assert.equal(row.proofUrl, `/papers/${item.paper}#${item.label}`);
    assert.equal(row.previousUrl, `/editions/${previousEdition}/papers/${item.paper}/#${item.label}`);
    assert.equal(row.sourceUrl, `/papers/${item.paper}.tex`);
    assert.equal(row.sourceSha256, digest(papers.get(item.paper).source), identity(item) + ': audit binds the actual public source');
  }
});

test('Every v0.5.3 paper binds the real source, PDF and rendered HTML bytes in both public metadata records', async () => {
  for (const [slug, item] of papers) {
    const pdf = await bytes(paperPath(edition, slug, 'pdf'));
    const actual = { sourceSha256: digest(item.source), pdfSha256: digest(pdf), htmlSha256: digest(item.metadata.html) };
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-', slug + ': an actual PDF asset');
    for (const metadata of [item.metadata, item.registered]) {
      assert.equal(metadata.revision, edition, slug);
      assert.equal(metadata.tex, `/papers/${slug}.tex`, slug);
      assert.equal(metadata.pdf, `/papers/${slug}.pdf`, slug);
      for (const [field, hash] of Object.entries(actual))
        assert.equal(metadata[field], hash, `${slug}: ${field} binds the actual published bytes`);
    }
  }
});

test('The five repaired statement anchors render with their real environments and existing numbers', () => {
  for (const [paper, label, kind, number] of [
    ['chow-obstruction-green-pairs', 'h22:parameter-scope', 'Remark', '4.4'],
    ['chow-obstruction-green-pairs', 'h22:native-constant-extensions', 'Remark', '9.2'],
    ['green-constructions', 'r12p:additive-family', 'Definition', '6.3'],
    ['green-constructions', 'r12p:shorter-quotient', 'Remark', '6.5'],
    ['pairing-constructions', 'ex:quartic-sixfold', 'Example', '8.2'],
  ]) {
    const actual = statement(papers, paper, label);
    assert.equal(actual.html.kind, kind, `${paper}#${label}`);
    assert.equal(actual.html.number, number, `${paper}#${label}`);
  }
});

test('The two completed route tasks preserve their old problem anchors and numbers', () => {
  const closed = [
    ['green-height-route', 'groute:operations', '6.3'],
    ['obstruction-height-route', 'obroute:height-problem', '5.5'],
  ];
  assert.deepEqual([...current.publication.change.additionalClosedTasks].sort(), closed.map(([paper, label]) => `${paper}#${label}`).sort());
  for (const [paper, label, number] of closed) {
    const old = statement(oldPapers, paper, label);
    const actual = statement(papers, paper, label);
    assert.equal(old.html.kind, 'Problem');
    assert.equal(old.html.number, number);
    assert.equal(actual.html.kind, 'Proposition');
    assert.equal(actual.html.number, number);
  }
});

test('The six promoted records use exact current proof sources while the register retains all 55 identities', () => {
  const records = new Map(current.entries.map(entry => [entry.id, entry]));
  assert.equal(records.size, 55);
  assert.equal(current.entries.length, 55);
  assert.deepEqual([...records.keys()].sort(), previous.entries.map(entry => entry.id).sort());
  const proved = [
    ['BB-ANALYTIC-INTERFACE', 'global-height-pairing', ['hyp:height-calculus', 'hyp:height-supported', 'hyp:height-trace', 'hyp:height-immersion', 'hyp:height-covariance']],
    ['BB-RATIONAL-FIBRE-RIGIDITY', 'strong-g-programme', ['hyp:rigidity']],
    ['BB-FINITE-NUMERICAL-DESCENT', 'green-constructions', ['def:numerical-certificate', 'lem:refine-certificate', 'thm:finite-numerical']],
    ['BB-ALG-TRANSFER', 'green-constructions', ['r12p:geometric-algebraic']],
    ['BB-ABELIAN-STAGE', 'green-constructions', ['thm:kunnemann-local', 'lem:abelian-lift', 'thm:abelian-G']],
    ['BB-MOTIVIC-TRANSFER', 'green-constructions', ['thm:main-abelian', 'thm:chow-abelian-criterion']],
  ];
  assert.deepEqual([...current.publication.change.established].sort(), proved.map(([id]) => id).sort());
  for (const [id, paper, labels] of proved) {
    const entry = records.get(id);
    assert.equal(entry.status, 'proved', id);
    assert.equal(entry.proofMode, 'complete internal proof', id);
    assert.equal(entry.source.file, `papers/${paper}.tex`, id);
    assert.equal(entry.source.url, `/papers/${paper}.tex`, id);
    assert.equal(entry.source.sha256, digest(papers.get(paper).source), id + ': exact proof bytes');
    for (const label of labels) {
      assert.ok(entry.source.locator.includes(label), id + ': exact proof locator ' + label);
      statement(papers, paper, label);
    }
  }
  for (const id of ['STRONG-G', 'BB-GLOBAL', 'BB-RESIDUAL-PERIODS'])
    assert.equal(records.get(id).status, 'open', id + ': the general target remains open');
});

test('All-completion height assembly is proved without identifying it with the fixed finite-test kernel', () => {
  const record = current.entries.find(entry => entry.id === 'BB-H16-KERNEL-DOMAIN');
  assert.equal(record.status, 'conditional');
  assert.match(record.statement, /S.*detectors fixed before the cycle/);
  assert.match(record.statement, /\\bigoplus_\{w\\in S\}/);
  assert.match(record.proof, /intersection of the local obstruction kernels at all finite completions/);
  assert.match(record.proof, /Hypothesis 5\.2/);
  const programme = papers.get('strong-g-programme');
  const comparison = statement(papers, 'strong-g-programme', 'hyp:assembly');
  assert.equal(comparison.html.kind, 'Hypothesis');
  assert.equal(comparison.html.number, '5.2');
  assert.match(comparison.tex.body, /both complementary codimensions/);
  assert.match(comparison.tex.body, /P_X\^j\(z\)=0[\s\S]*\\Longleftrightarrow[\s\S]*for every finite/);
  assert.match(comparison.tex.body, /\\mathcal H\^j\(X\)=\\mathcal K\^j\(X\)/);
  assert.match(comparison.html.body, /\\mathcal H\^j\(X\)=\\mathcal K\^j\(X\)/);
  assert.match(comparison.tex.body, /fixed independently of \$z\$/);
  assert.match(programme.source, /\\mathcal K\^r\(X\)=\s*\\bigcap_\{v\\nmid\\infty\}/);
  assert.match(programme.source, /Good-model vanishing[\s\S]*?does not identify their kernels/);
  const established = statement(papers, 'global-height-pairing', 'r16h:global-height');
  assert.equal(established.html.kind, 'Theorem');
  assert.equal(established.html.number, '3.6');
  assert.match(papers.get('global-height-pairing').source, /\\mathfrak o_\{X_\{F_v\}\}\^r\(\\alpha_\{F_v\}\)=0[\s\S]*?every finite place/);
  assert.match(established.tex.body, /\\mathcal H\^p\(X\)\\times\\mathcal H\^q\(X\)/);
});

test('Zhang projection and generic-degree operations remain hypotheses on the chosen arithmetic models', () => {
  const model = statement(papers, 'zhang-height-route', 'hyp:zhang-model-projection');
  assert.equal(model.html.kind, 'Hypothesis');
  assert.equal(model.html.number, '5.1');
  assert.match(model.tex.body, /For each proper generically finite morphism of regular arithmetic models used/);
  assert.match(model.tex.body, /pullback, pushforward and intersection are defined/);
  assert.match(model.tex.body, /projection formula.*f_\*f\^\*=D/);
  assert.match(model.tex.body, /vertical class pushes forward to a vertical class/);
  assert.match(papers.get('zhang-height-route').source, /does not construct arithmetic pullback on an arbitrary nonflat model morphism/);
  const descent = statement(papers, 'zhang-height-route', 'prop:zhang-degree-descent');
  assert.match(descent.tex.body, /Assume compatible regular models[\s\S]*\\Cref\{hyp:zhang-model-projection\}/);
});
