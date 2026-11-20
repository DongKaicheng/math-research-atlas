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

test('The table of contents links the numbered chapters and appendices as HTML', async () => {
  const data = await graph();
  const contents = await read(project + 'contents/index.html');
  for (const slug of Object.keys(data.chapters).filter(slug => /^\d+$|^appendix-[a-i]$/.test(slug))) {
    assert.ok(contents.includes('href="' + local(project + 'chapters/' + slug + '/') + '"'), slug);
    const chapter = await read(project + 'chapters/' + slug + '/index.html');
    assert.match(chapter, /<article class="book-text"/);
    assert.match(chapter, /<p>/);
    assert.doesNotMatch(chapter, /<canvas|reader-en\.pdf|pdfjs/);
  }
  assert.match(contents, /Subject index/);
  assert.match(contents, /Bibliography/);
  assert.doesNotMatch(contents, /<canvas|pdfjs/);
});

test('The web edition, exact proof diagrams and chapter totals bind to the frozen release', async () => {
  const data = await graph();
  const total = await read(project + 'logic/full/index.html');
  assert.match(total, /5,434 registered proof-input links/);
  assert.equal([...total.matchAll(/<small>(\d+) links<\/small>/g)].reduce((n, item) => n + Number(item[1]), 0),
    Object.values(data.arguments).reduce((n, arg) => n + arg.inputs.length, 0));
  const reader = await read(project + 'reader/index.html');
  assert.match(reader, /Table of contents/);
  assert.doesNotMatch(reader, /web-reader-sheet|<canvas|pdfjs/);
  const index = JSON.parse(await read(project + 'reader/tags.json'));
  assert.equal(Object.keys(index.tags).length,1159);
  const href = index.tags['NAG-002462'];
  assert.equal(href,index.destinations['theorem.5.56.6']);
  assert.match(href, /\/chapters\/5\/#label-/);
  const [chapter,fragment] = href.slice(base.length).split('#');
  const book = await read(chapter+'index.html');
  assert.ok(book.includes(`id="${fragment}"`));
  assert.ok(book.includes(`href="${local('/r/NAG-002462/')}"`));
  const tag = await read('/r/NAG-002462/index.html');
  assert.ok(tag.includes(local('/r/NAG-002462/logic/')));
  assert.ok(tag.includes(href));
  assert.match(tag, /Theorem 5\.56\.6/);
  assert.match(tag, /class="proof"/);
  assert.match(tag, /<math\b/);
  assert.doesNotMatch(tag, /\p{Script=Han}|Exact TeX source|<canvas/u);
  const proof = await read('/r/NAG-002462/logic/index.html');
  assert.match(proof, /14 registered inputs/);
  assert.match(proof, /<strong>AND<\/strong>/);
  for (const input of data.arguments['NAG-002462'].inputs) {
    assert.ok(proof.includes(local('/r/' + data.nodes[input.key].id + '/logic/')), input.key);
  }
  const gap = await read('/r/NAG-002405/logic/index.html');
  assert.match(gap, /Historical proof gap/);
  const gapTag = await read('/r/NAG-002405/index.html');
  assert.match(gapTag, /Historical proof gap/);
  const frozen = await read(fixed + 'r/NAG-002462/index.html');
  assert.doesNotMatch(frozen, /tag-proof-text/);
});

test('Every permanent Tag has an English HTML page and a standalone dependency page', async () => {
  const rows = JSON.parse(await read('/search-index.json')).filter(row=>row.project==='foundations');
  assert.equal(rows.length,1205);
  for (const row of rows) {
    const route = row.link.slice(base.length);
    const tag = await read(route+'index.html');
    assert.match(tag,/^<!doctype html><html lang="en">/);
    assert.ok(tag.includes(`href="${row.link}logic/"`),row.id);
    assert.doesNotMatch(tag,/\p{Script=Han}|<canvas|pdfjs/u,row.id);
  }
});
