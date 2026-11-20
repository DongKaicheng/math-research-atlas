import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {indexFoundationsMap} from '../assets/foundations-full-map.js';

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
  for (const route of ['contents/', 'logic/full/', 'coverage/', 'editions/sealed-1097/reader-en.pdf']) {
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

test('The complete graph carries every selected input and keeps historical gap records distinct', async () => {
  const data = await graph();
  const {records, edges, uses} = indexFoundationsMap(data);
  assert.equal(records.size, Object.keys(data.nodes).length + Object.keys(data.gaps).length);
  const registered = Object.entries(data.arguments).flatMap(([key, arg]) => arg.inputs.map(({key: from}) => ({from, to: key})));
  assert.deepEqual(edges, registered);
  for (const {from, to} of edges) {
    assert.ok(records.has(from));
    assert.equal(records.get(to).kind, 'argument');
    assert.ok(uses.get(from).includes(to));
  }
  for (const [id, gap] of Object.entries(data.gaps)) {
    const plotted = records.get('gap:' + id);
    assert.equal(plotted.kind, 'gap');
    assert.equal(plotted.step, gap.step);
    assert.equal(plotted.href, gap.href);
  }
  const fullMap = await read(project + 'logic/full/index.html');
  assert.ok(fullMap.includes('href="' + local(fixed + 'logic/data.json') + '"'));
  const fixedMap = await read(fixed + 'logic/index.html');
  assert.ok(!fixedMap.includes(project + 'logic/full/'));
});
