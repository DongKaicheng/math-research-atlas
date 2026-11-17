import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const pointer = JSON.parse(await readFile(new URL('content/bedford-taylor/current.json', root), 'utf8'));
const fixed = '/math-research-atlas/projects/bedford-taylor/editions/' + pointer.revision;
const publicRoot = 'public/projects/bedford-taylor/editions/' + pointer.revision + '/';
const source = await readFile(new URL(publicRoot + 'assets/atlas-feedback.js', root), 'utf8');

function feedback(route, hash = '', entry = '') {
  const page = 'https://example.org' + fixed + route;
  const query = new URLSearchParams({project: 'bedford-taylor', version: pointer.revision, page});
  if (entry) query.set('entry', entry);
  const link = {href: 'https://example.org/math-research-atlas/feedback/?' + query};
  const location = {hash};
  const events = new Map();
  vm.runInNewContext(source, {
    URL, location, decodeURIComponent,
    document: {querySelectorAll() { return [link]; }},
    addEventListener(type, listener) { events.set(type, listener); },
  });
  return {
    get context() { return new URL(link.href).searchParams; },
    setHash(value) { location.hash = value; events.get('hashchange')(); },
  };
}

test('A formal theorem anchor uses its registered ID and keeps the exact frozen edition', () => {
  const context = feedback('/papers/bedford-taylor-products/', '#thm:main-bounded').context;
  assert.equal(context.get('entry'), 'NABT-000002');
  assert.equal(context.get('version'), pointer.revision);
  assert.equal(context.get('page'), 'https://example.org' + fixed + '/papers/bedford-taylor-products/#thm:main-bounded');
});

test('A programme conjecture uses its registered ID, including encoded TeX labels', () => {
  const f = feedback('/papers/research-program/', '#conj%3Adescent');
  assert.equal(f.context.get('entry'), 'NABT-000100');
  f.setHash('#conj:critical');
  assert.equal(f.context.get('entry'), 'NABT-000139');
  assert.ok(f.context.get('page').endsWith('#conj:critical'));
});

test('Changing or removing an unknown hash never retains a previously inferred theorem ID', () => {
  const f = feedback('/papers/bedford-taylor-products/', '#thm:main-bounded');
  f.setHash('#sec:introduction');
  assert.equal(f.context.has('entry'), false);
  assert.ok(f.context.get('page').endsWith('#sec:introduction'));
  f.setHash('');
  assert.equal(f.context.has('entry'), false);
  assert.ok(f.context.get('page').endsWith('/papers/bedford-taylor-products/'));
  f.setHash('#conj:descent');
  assert.equal(f.context.has('entry'), false, 'Labels from another article do not assign an identity');
});

test('Topic pages retain their existing stable record ID as hash context changes', () => {
  const f = feedback('/results/r01/', '#proof', 'R01');
  assert.equal(f.context.get('entry'), 'R01');
  f.setHash('');
  assert.equal(f.context.get('entry'), 'R01');
});

test('The imported pages run only the Atlas feedback context handler', async () => {
  for (const route of ['index.html', 'papers/bedford-taylor-products/index.html']) {
    const html = await readFile(new URL(publicRoot + route, root), 'utf8');
    assert.doesNotMatch(html, /data-source-feedback/);
    assert.doesNotMatch(html, /<script\b[^>]*src=["'][^"']*\/assets\/source-feedback\.js/);
    assert.match(html, /data-atlas-feedback/);
    assert.match(html, /<script\b[^>]*src=["'][^"']*\/assets\/atlas-feedback\.js/);
  }
});
