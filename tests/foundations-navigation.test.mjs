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

test('The web edition preserves exact source and proof links', async () => {
  const oldMap = await read(project + 'logic/full/index.html');
  assert.match(oldMap, /foundations-proof-bookmark\.js/);
  assert.doesNotMatch(oldMap, /5,434 registered/);
  const reader = await read(project + 'reader/index.html');
  assert.match(reader, /Table of contents/);
  assert.doesNotMatch(reader, /web-reader-sheet|<canvas|pdfjs/);
  const index = JSON.parse(await read(project + 'reader/tags.json'));
  assert.equal(Object.keys(index.tags).length,1155);
  const href = index.tags['NAG-002462'];
  assert.equal(href,index.destinations['theorem.5.56.6']);
  assert.match(href, /\/chapters\/5\/#label-/);
  const [chapter,fragment] = href.slice(base.length).split('#');
  const book = await read(chapter+'index.html');
  assert.ok(book.includes(`id="${fragment}"`));
  assert.ok(book.includes(`href="${local('/r/NAG-002462/')}"`));
  assert.ok(book.includes(`href="${local('/r/NAG-002462/#foundations-exact-proof')}"`));
  const tag = await read('/r/NAG-002462/index.html');
  assert.ok(tag.includes(href));
  assert.match(tag, /Theorem 5\.56\.6/);
  assert.match(tag, /class="proof"/);
  assert.match(tag, /<math\b/);
  assert.match(tag, /class="katex-html"/);
  assert.match(tag, /id="foundations-exact-proof"/);
  assert.doesNotMatch(tag, /\p{Script=Han}|Exact TeX source|<canvas/u);
  const frozen = await read(fixed + 'r/NAG-002462/index.html');
  assert.doesNotMatch(frozen, /tag-proof-text/);
});

const diagramMarkup = /class="(?:proof-diagram|logic-flow|logic-inline|proof-arrow)|href="[^"]*(?:\/logic\/|#proof-dependencies)|(?:Proof|dependency) diagram/i;

test('Former diagram routes forward readers to current content', async () => {
  for (const [route,destination] of [['logic/','contents/'],['logic/full/','contents/'],['logic/chapters/5/','chapters/5/']]) {
    const page = await read(project+route+'index.html');
    assert.ok(page.includes(`href="${local(project+destination)}"`));
    assert.match(page, /noindex,follow/);
    assert.doesNotMatch(page,diagramMarkup);
  }
  const sitemap = await read('/sitemap.xml');
  assert.doesNotMatch(sitemap, /\/r\/NAG-\d+\/logic\/|\/foundations\/logic\//);
});

test('Every permanent Tag has English HTML and a retired diagram URL', async () => {
  const rows = JSON.parse(await read('/search-index.json')).filter(row=>row.project==='foundations');
  assert.equal(rows.length,1205);
  const data = await graph();
  for (const row of rows) {
    const route = row.link.slice(base.length);
    const tag = await read(route+'index.html');
    assert.match(tag,/^<!doctype html><html lang="en">/);
    assert.doesNotMatch(tag,/\p{Script=Han}|<canvas|pdfjs/u,row.id);
    assert.doesNotMatch(tag,diagramMarkup,row.id);
    assert.equal(tag.includes('id="open-status"'),Object.hasOwn(data.gaps,row.id),row.id);
    const visible = tag.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g,'').replace(/<[^>]+>/g,'');
    assert.ok(!/(?:FSevenLabelAlias:|FSevenSourceLink:|[a-z\d]+(?:Alias|Source|Ref)@|f8restoration@|dimplacement@|\uFFFD|\\(?:href|hyperref|csname|begin|end)\b)/i.test(visible),row.id);
    const bookmark = await read(route+'logic/index.html');
    assert.doesNotMatch(bookmark,diagramMarkup,row.id);
    assert.match(bookmark,/noindex,follow/,row.id);
    assert.ok(bookmark.includes(`href="${row.link}"`),row.id);
  }
});

test('The coverage table reconciles all permanent open Tags to their ledger assignments', async () => {
  const data=await graph();
  const coverage=await read(project+'coverage/index.html');
  assert.doesNotMatch(coverage,diagramMarkup);
  assert.match(coverage,/<strong>82 open Tags<\/strong>/);
  assert.match(coverage,/77 have a recorded whole-proof gap and 5 have a selected argument at a narrower scope/);
  for (const slug of Object.keys(data.chapters)) {
    const entries=Object.entries(data.gaps).filter(([,gap])=>gap.chapter===slug);
    const row=coverage.match(new RegExp(`<tr id="chapter-${slug}">[\\s\\S]*?<td>(.*?)</td></tr>`))?.[1];
    assert.equal(Number(row?.replace(/<[^>]+>/g,'')),entries.length,slug);
    for (const [id] of entries) assert.ok(coverage.includes(`id="open-${id}"`),id);
    const chapter=await read(project+`chapters/${slug}/index.html`);
    assert.doesNotMatch(chapter,diagramMarkup,slug);
    assert.ok(chapter.includes(`href="${local(project+'coverage/#chapter-'+slug)}"`),slug);
  }
  const chapter=await read(project+'chapters/5/index.html');
  assert.ok(chapter.includes(`href="${local('/r/NAG-002405/#open-status')}"`));
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

test('Proofs retain exact paragraph locators in the text',async()=>{
  const tag=await read('/r/NAG-001831/index.html');
  assert.match(tag,/id="foundations-exact-proof"/);
  assert.match(tag,/id="proof-paragraph-1"/);
});

test('An unregistered exact book proposition keeps its result page',async()=>{
  const chapter=await read(project+'chapters/11/index.html');
  const route=chapter.match(/href="([^"]*\/results\/fnd-[\da-f]+\/)"[^>]*>FND-[\dA-F]+ · Result<\/a><\/p>\s*<div class="proposition">\s*<p><strong>Proposition 11\.4\.1\./)?.[1];
  assert.ok(route);
  const result=await read(route.slice(base.length)+'index.html');
  assert.match(result,/<strong>Proposition 11\.4\.1\.<\/strong>/);
  const alias=await read(project+'proof-tags/p-e3fb034c75ff/index.html');
  assert.match(alias,/class="book-text tag-text"/);
  assert.doesNotMatch(alias,diagramMarkup);
});

test('Stacks citations and conditional proof status are visible in the manuscript',async()=>{
  const result=await read('/r/NAG-001450/index.html');
  const proof=result.match(/<article\b[^>]*>[\s\S]*?<\/article>/)?.[0];
  for(const stacksTag of ['00IA','00IB']) {
    assert.ok(proof.includes('href="https://stacks.math.columbia.edu/tag/'+stacksTag+'"'));
  }
  const conditional=await read(project+'proof-tags/p-a3b77345d5f0/index.html');
  assert.match(conditional,/Conditional argument/);
  assert.doesNotMatch(conditional,diagramMarkup);
  const chapter=await read(project+'chapters/21/index.html');
  assert.match(chapter,/id="label-6e65773a626f676f6d6f6c6f765f72656475636564"><aside class="proof-policy-note"/);
  assert.ok(chapter.lastIndexOf('Theorem 21.15.1 requires tropical equidistribution')<chapter.indexOf('<strong>Theorem 21.15.1.</strong>'));
});

test('Reviewed proof bindings retain the former proof permalink',async()=>{
  const tag=await read('/r/NAG-002503/index.html');
  assert.match(tag,/id="foundations-exact-proof"/);
  assert.match(tag,/Read the companion argument/);
  const former=await read(project+'proof-tags/p-d52e01268beb/index.html');
  assert.ok(former.includes(local('/r/NAG-002503/')));
});

test('The seven accepted export exceptions retain their available web proofs',async()=>{
  for(const id of ['001586','001587','001831','001832','001990','002360','002484']) {
    const page=await read('/r/NAG-'+id+'/index.html');
    assert.match(page,/id="foundations-exact-proof"/,id);
  }
  const example=await read('/r/NAG-002484/index.html');
  assert.equal([...example.matchAll(/class="example"/g)].length,1);
});

test('Colliding LaTeX labels do not put unrelated proofs under open or accepted Tags', async () => {
  for (const [id,foreign] of [['002565','003030'],['002976','002806'],['003100','002989'],['003002','003106']]) {
    const page=await read('/r/NAG-'+id+'/index.html');
    assert.match(page,/Historical statement/);
    assert.match(page,/<math\b/);
    assert.doesNotMatch(page,/id="foundations-exact-proof"|Proof in chapter|Read in chapter/,id);
    const paired=await read('/r/NAG-'+foreign+'/index.html');
    assert.ok(!paired.includes(`>NAG-${id}</a>`),foreign);
  }
  const lemma=await read('/r/NAG-002661/index.html');
  assert.match(lemma,/Lemma F\.1\.7\./);
  assert.match(lemma,/appendix-f\/#foundations\.nag-002661\.recovered-proof/);
  const theorem=await read('/r/NAG-002884/index.html');
  assert.match(theorem,/Theorem I\.1\.6\./);
  assert.match(theorem,/appendix-i\/#foundations\.nag-002884\.original/);
});
