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
  for (const route of ['contents/', 'coverage/', 'reader/']) {
    assert.ok(nav.includes('href="' + local(project + route) + '"'), route);
  }
  assert.ok(!nav.includes('/logic/full/'));
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

test('The web edition and proof diagrams bind to the frozen release', async () => {
  const data = await graph();
  const oldMap = await read(project + 'logic/full/index.html');
  assert.match(oldMap, /foundations-proof-bookmark\.js/);
  assert.doesNotMatch(oldMap, /5,434 registered/);
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
  assert.ok(book.includes(`href="${local('/r/NAG-002462/#foundations-exact-proof')}"`));
  const tag = await read('/r/NAG-002462/index.html');
  assert.ok(tag.includes(local('/r/NAG-002462/logic/')));
  assert.ok(tag.includes(href));
  assert.match(tag, /Theorem 5\.56\.6/);
  assert.match(tag, /class="proof"/);
  assert.match(tag, /<math\b/);
  assert.match(tag, /class="katex-html"/);
  assert.match(tag, /id="proof-dependencies"/);
  assert.doesNotMatch(tag, /\p{Script=Han}|Exact TeX source|<canvas/u);
  const proof = await read('/r/NAG-002462/logic/index.html');
  assert.match(proof, /14 registered proof inputs/);
  assert.match(proof, /<strong>AND · Joint proof inputs<\/strong>/);
  assert.match(proof, /class="proof-input-row/);
  assert.match(proof, /class="proof-arrow/);
  for (const input of data.arguments['NAG-002462'].inputs) {
    assert.ok(proof.includes(local(data.nodes[input.key].href)), input.key);
  }
  const gap = await read('/r/NAG-002405/logic/index.html');
  assert.match(gap, /Historical proof gap/);
  const gapTag = await read('/r/NAG-002405/index.html');
  assert.match(gapTag, /Historical proof gap/);
  const frozen = await read(fixed + 'r/NAG-002462/index.html');
  assert.doesNotMatch(frozen, /tag-proof-text/);
});

test('Annular units has separate derivations and keeps all six registered proof inputs', async () => {
  const proof = await read('/r/NAG-002027/logic/index.html');
  assert.match(proof, /From an inverse to the normal form/);
  assert.match(proof, /From the normal form to an inverse/);
  assert.match(proof, /Pointwise norm and uniqueness/);
  const data=await graph();
  for (const {key} of data.arguments['NAG-002027'].inputs) assert.ok(proof.includes(`data-input="${key}"`),key);
});

test('Every permanent Tag has an English HTML page and a standalone dependency page', async () => {
  const rows = JSON.parse(await read('/search-index.json')).filter(row=>row.project==='foundations');
  assert.equal(rows.length,1205);
  const data = await graph();
  const expected = Object.values(data.arguments).reduce((sum,argument)=>sum+argument.inputs.length,0);
  let relations=0;
  for (const row of rows) {
    const route = row.link.slice(base.length);
    const tag = await read(route+'index.html');
    assert.match(tag,/^<!doctype html><html lang="en">/);
    assert.ok(tag.includes(`href="${row.link}logic/"`),row.id);
    assert.doesNotMatch(tag,/\p{Script=Han}|<canvas|pdfjs/u,row.id);
    const visible = tag.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g,'').replace(/<[^>]+>/g,'');
    assert.ok(!/(?:FSevenLabelAlias:|FSevenSourceLink:|[a-z\d]+(?:Alias|Source|Ref)@|f8restoration@|dimplacement@|\uFFFD|\\(?:href|hyperref|csname|begin|end)\b)/i.test(visible),row.id);
    const diagram = await read(route+'logic/index.html');
    relations += [...diagram.matchAll(/class="proof-node proof-node-registered"/g)].length;
  }
  assert.equal(relations,expected);
});

test('Each structured chapter proof starts beside a working Tag link', async () => {
  const data=await graph();
  let proofLinks=0;
  let manuscriptProofs=0;
  for (const slug of Object.keys(data.chapters).filter(slug=>/^\d+$|^appendix-[a-i]$/.test(slug))) {
    const chapter=await read(project+'chapters/'+slug+'/index.html');
    const proofs=[...chapter.matchAll(/<div class="chapter-proof-links" id="([^"]+)"[^>]*>(.*?)<\/div>\s*(<div class="proof"|<h[2-6]\b|<p>)/gs)];
    proofLinks+=proofs.length;
    assert.equal(proofs.filter(match=>match[3]==='<div class="proof"').length,[...chapter.matchAll(/<div class="proof"/g)].length,slug);
    for (const [,anchor,links] of proofs) {
      assert.match(anchor,/^manuscript-proof-[a-f0-9]{12}$/);
      const href=links.match(/href="([^"]+)"/)?.[1];
      assert.ok(href?.includes('/r/NAG-') || href?.includes('/proof-tags/p-'),slug);
      if (href.includes('/proof-tags/')) manuscriptProofs++;
    }
  }
  assert.ok(proofLinks>=1548);
  assert.ok(manuscriptProofs>0);
});
