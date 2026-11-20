import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve(import.meta.dirname, '../dist');
const base = (process.env.SITE_BASE_PATH ?? '/math-research-atlas').replace(/\/$/, '');
const project = '/projects/foundations/';
const fixed = project + 'editions/sealed-1097/';
const local = route => base + route;
const read = file => readFile(path.join(dist, file.slice(1)), 'utf8');
const graph = async () => JSON.parse(await read(fixed + 'logic/data.json'));

test('The Foundations homepage points to the published reader and carries exact feedback context', async () => {
  const page = await read(project + 'index.html');
  const nav = page.match(/<nav class="foundations-home-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(nav);
  for (const route of ['contents/', 'logic/full/', 'coverage/', 'reader/']) {
    assert.ok(nav.includes('href="' + local(project + route) + '"'), route);
  }
  assert.ok(nav.includes('href="#foundations-query"'));
  for (const id of ['motivation', 'questions', 'results', 'programme', 'feedback']) {
    assert.ok(page.includes('id="' + id + '"'), id);
  }

  const links = [...page.matchAll(/\bhref="([^"]+)"/g)].map(([, href]) =>
    new URL(href.replaceAll('&amp;', '&'), 'https://atlas.test' + local(project)));
  const board = links.find(link => link.pathname === local('/feedback/') && link.searchParams.get('project') === 'foundations');
  assert.equal(board?.searchParams.get('version'), 'sealed-1097');
  assert.equal(board.searchParams.get('page'), local(project));
  const suggestion = links.find(link => link.searchParams.get('template') === 'suggestion.yml');
  assert.equal(suggestion?.searchParams.get('project'), 'foundations');
  assert.equal(suggestion.searchParams.get('version'), 'sealed-1097');
  assert.equal(suggestion.searchParams.get('target'), local(project));
});

test('The table of contents links every published chapter and each populated proof view', async () => {
  const data = await graph();
  const contents = await read(project + 'contents/index.html');
  const populated = new Set([...Object.values(data.arguments), ...Object.values(data.gaps)].map(record => record.chapter));
  for (const slug of Object.keys(data.chapters)) {
    assert.ok(contents.includes('href="' + local(project + 'chapters/' + slug + '/') + '"'), slug);
    const proofView = 'href="' + local(project + 'logic/chapters/' + slug + '/') + '"';
    assert.equal(contents.includes(proofView), populated.has(slug), slug);
  }
  for (const section of ['chapters', 'appendices', 'supplements', 'unlocated']) {
    assert.ok(contents.includes('href="#' + section + '"'), section);
  }
});

test('The web edition, exact proof diagrams and chapter totals bind to the frozen release', async () => {
  const data = await graph();
  const total = await read(project + 'logic/full/index.html');
  assert.match(total, /5,434 registered proof-input links/);
  assert.equal([...total.matchAll(/<small>(\d+) links<\/small>/g)].reduce((n, item) => n + Number(item[1]), 0),
    Object.values(data.arguments).reduce((n, arg) => n + arg.inputs.length, 0));
  const reader = await read(project + 'reader/index.html');
  assert.match(reader, /web-reader-book-contents/);
  const index = JSON.parse(await read(project + 'reader/tags.json'));
  const reverseTags = new Set(Object.values(index.pages).flat().map(({id}) => id));
  assert.deepEqual([...reverseTags].sort(), Object.keys(index.tags).sort());
  assert.equal(index.tags['NAG-002462'], 'dest=theorem.5.56.6');
  assert.ok(index.pages[1072].some(tag => tag.id === 'NAG-002462'));
  const tag = await read('/r/NAG-002462/index.html');
  assert.ok(tag.includes(local('/r/NAG-002462/logic/')));
  assert.ok(tag.includes(local(project + 'reader/?tag=NAG-002462')));
  assert.match(tag, /tag-proof-text/);
  assert.match(tag, /class="katex"/);
  const proof = await read('/r/NAG-002462/logic/index.html');
  assert.match(proof, /14 registered inputs/);
  assert.match(proof, /<strong>AND<\/strong>/);
  for (const input of data.arguments['NAG-002462'].inputs) {
    assert.ok(proof.includes(local('/r/' + data.nodes[input.key].id + '/logic/')), input.key);
  }
  const gap = await read('/r/NAG-002405/logic/index.html');
  assert.match(gap, /Historical proof gap/);
  const frozen = await read(fixed + 'r/NAG-002462/index.html');
  assert.doesNotMatch(frozen, /tag-proof-text/);
});
