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

test('The Foundations homepage has uniform project navigation and exact feedback context', async () => {
  const page = await read(project + 'index.html');
  const nav = page.match(/<nav class="foundation-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(nav);
  for (const route of ['contents/', 'coverage/', 'guide/', 'search/']) {
    assert.ok(nav.includes('href="' + local(project + route) + '"'), route);
  }
  assert.ok(nav.includes('href="' + local('/feedback/?project=foundations') + '"'));
  assert.doesNotMatch(nav,/button|\/reader\/|\/logic\/|aria-current/);
  assert.ok(page.includes('action="' + local(project+'search/') + '"'));
  for (const id of ['motivation', 'questions', 'results', 'programme', 'feedback']) {
    assert.ok(page.includes('id="' + id + '"'), id);
  }

  const links = [...page.matchAll(/\bhref="([^"]+)"/g)].map(([, href]) =>
    new URL(href.replaceAll('&amp;', '&'), 'https://atlas.test' + local(project)));
  const board = links.find(link => link.pathname === local('/feedback/') && link.searchParams.get('project') === 'foundations' && link.searchParams.has('page'));
  assert.equal(board?.searchParams.get('version'), 'sealed-1097');
  assert.equal(board.searchParams.get('page'), local(project));
  assert.ok(!links.some(link => link.hostname === 'github.com'));
});

test('The homepage and contents offer the fixed English PDF, and the homepage discloses the role of AI',async()=>{
  const page = await read(project+'index.html');
  const pdf = fixed+'reader-en.pdf';
  for (const html of [page,await read(project+'contents/index.html'),await read(project+'reader/index.html')]) {
    assert.ok(html.includes(`href="${local(pdf)}" download="Non-Archimedean-Geometry-Foundations.pdf"`));
  }
  assert.match(await read(pdf),/^%PDF-/);
  assert.match(page,/Banach and affinoid algebras, and Berkovich analytic spaces/);
  assert.match(page,/AI generated most of the mathematical content in this project/);
  assert.ok(page.includes(`href="${local(project+'coverage/')}"`));
});

test('Reader pages share the project navigation and explain the actual Tag labels', async () => {
  const chrome = page => page.match(/<nav class="foundation-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1]?.replaceAll(' aria-current="page"','');
  const home = chrome(await read(project+'index.html'));
  for (const route of [project+'contents/',project+'guide/',project+'search/',project+'acknowledgements/',
    project+'coverage/',project+'coverage/chapters/16/',project+'chapters/16/','/r/NAG-900298/']) {
    const page = await read(route+'index.html');
    assert.equal(chrome(page),home,route);
    assert.match(page,/foundations-native\.css/);
  }
  const glossary = await read(project+'guide/index.html');
  for(const status of ['closed','open','partial','conditional','comparison','pending','definition']) assert.ok(glossary.includes(`id="status-${status}"`),status);
  assert.match(glossary,/The full statement remains open/);
  assert.match(glossary,/specified objects, hypotheses and tests/);
  const tag = await read('/r/NAG-900298/index.html');
  assert.ok(tag.includes(local(project+'guide/#status-conditional')));
  assert.ok(tag.includes(local(project+'guide/#type-external-proof-input')));
  assert.equal([...tag.matchAll(/id="closure"/g)].length,1);
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
  assert.equal(Object.keys(index.tags).length,1662);
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

test('Chapters and all kinds of public Tags typeset display math and styled symbols', async () => {
  const routes = [project+'chapters/16/', '/r/NAG-900301/', '/r/NAG-002462/', '/r/NAG-002567/'];
  for (const route of routes) {
    const page = await read(route+'index.html');
    assert.ok(page.includes(`href="${local('/assets/katex.min.css')}"`),route);
    assert.match(page, /<span class="katex-mathml"><math\b/,route);
    assert.match(page, /class="katex-html" aria-hidden="true"/,route);
    assert.match(page, /<span class="book-equation"><span class="katex-display">/,route);
    assert.doesNotMatch(page, /class="(?:katex-error|book-math-fallback)"/,route);
    if (route.startsWith('/r/')) assert.doesNotMatch(page, /class="katex"><math\b/,route);
  }
  const chapter = await read(project+'chapters/16/index.html');
  assert.match(chapter, /class="mord mathbb">[CNRZ]</);
  assert.doesNotMatch(chapter, /class="katex"><math[^>]*display="block"/);
  const historical = await read('/r/NAG-002567/index.html');
  assert.match(historical, /Historical statement/);
  assert.match(historical, /class="tag"/);
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

test('Every permanent Tag gives its closure status and gap type where applicable', async () => {
  const rows = JSON.parse(await read('/search-index.json')).filter(row=>row.project==='foundations' && /^NAG-\d{6}$/.test(row.id));
  assert.equal(rows.length,1712);
  assert.equal(new Set(rows.map(row=>row.id)).size,rows.length);
  const data = await graph();
  let historical = 0;
  for (const row of rows) {
    const route = row.link.slice(base.length);
    const tag = await read(route+'index.html');
    assert.match(tag,/^<!doctype html><html lang="en">/);
    assert.doesNotMatch(tag,/\p{Script=Han}|<canvas|pdfjs/u,row.id);
    assert.doesNotMatch(tag,diagramMarkup,row.id);
    assert.equal(tag.includes('id="open-status"'),Object.hasOwn(data.gaps,row.id),row.id);
    assert.match(tag,new RegExp('data-closure="'+row.status+'"'),row.id);
    if (!['definition','closed'].includes(row.status)) assert.match(tag,/<dt>Problem types<\/dt><dd><a /,row.id);
    const visible = tag.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g,'').replace(/<[^>]+>/g,'');
    assert.ok(!/(?:FSevenLabelAlias:|FSevenSourceLink:|[a-z\d]+(?:Alias|Source|Ref)@|f8restoration@|dimplacement@|\uFFFD|\\(?:href|hyperref|csname|begin|end)\b)/i.test(visible),row.id);
    if (row.id.startsWith('NAG-9')) continue;
    historical++;
    const bookmark = await read(route+'logic/index.html');
    assert.doesNotMatch(bookmark,diagramMarkup,row.id);
    assert.match(bookmark,/noindex,follow/,row.id);
    assert.ok(bookmark.includes(`href="${row.link}"`),row.id);
  }
  assert.equal(historical,1205);
});

test('The chapter tables reconcile all registered Tags and the fixed historical subset', async () => {
  const data=await graph();
  const overview=await read(project+'coverage/index.html');
  assert.match(overview,/1,712 permanent Tags/);
  assert.doesNotMatch(overview,diagramMarkup);
  let total=0;
  const assigned=new Set();
  for (const slug of Object.keys(data.chapters)) {
    const entries=Object.entries(data.gaps).filter(([,gap])=>gap.chapter===slug);
    const row=overview.match(new RegExp(`<tr id="chapter-${slug}"[^>]*>[\\s\\S]*?</tr>`))?.[0];
    const count=type=>Number(row.match(new RegExp(`<td data-count="${type}"[^>]*>(.*?)</td>`))?.[1]?.replace(/<[^>]+>/g,''));
    const detail=await read(project+`coverage/chapters/${slug}/index.html`);
    const ids=[...detail.matchAll(/<li data-tag-status="[^"]+"><a href="[^"]*\/r\/(NAG-\d{6})\//g)].map(([,id])=>id);
    const sealed=await read(fixed+`chapters/${slug}/index.html`);
    const old=[...sealed.matchAll(/<li class="entry"><small>(NAG-\d{6})<\/small>/g)].map(([,id])=>id);
    assert.deepEqual(ids.filter(id=>!id.startsWith('NAG-9')).sort(),old.sort(),slug);
    assert.equal(count('tags'),ids.length,slug);
    assert.equal(['closed','open','conditional','comparison','pending','definition'].reduce((n,g)=>n+count(g),0),ids.length,slug);
    for (const id of ids) {
      assert.ok(!assigned.has(id),id);
      assigned.add(id);
    }
    total += ids.length;
    for (const [id] of entries) assert.ok(overview.includes(`id="open-${id}"`),id);
  }
  assert.equal(total,1712);
});

test('The Delta and harmonic findings use one canonical Tag per statement or comparison', async () => {
  const detail=await read(project+'coverage/chapters/16/index.html');
  for (const [status,count] of [['open',3],['conditional',2],['comparison',1]]) {
    assert.equal([...detail.matchAll(new RegExp(`data-tag-status="${status}"`,'g'))].length,count);
  }
  const expected = [
    ['900291','open','Functorial detection of a generalized delta-form'],
    ['900293','open','Piecewise smooth criterion'],
    ['900295','conditional','Geometric inputs to the algebra of delta-forms'],
    ['900298','conditional','Geometric detection in Proposition 16.4.1'],
    ['900299','comparison','delta-form presentation'],
    ['900300','open','Mihatsch’s sheaf'],
  ];
  for (const [id,state,label] of expected) {
    assert.ok(detail.includes(local(`/r/NAG-${id}/`)));
    const tag = await read(`/r/NAG-${id}/index.html`);
    assert.ok(tag.includes(label),id);
    assert.ok(tag.includes(`data-closure="${state}"`),id);
    assert.match(tag,/Read in chapter|Read the source passage/);
  }
  const part=await read(project+'reader/part-024/index.html');
  assert.match(part,/3 open Tags/);
  assert.match(part,/10 open Tags/);
  assert.match(part,/2 conditional Tags/);
  assert.doesNotMatch(part,/open manuscript items|Without a NAG Tag/);
});

test('Chapter proof anchors remain stable and every published proof link uses a NAG Tag', async () => {
  const data=await graph();
  let anchors=0;
  let tagged=0;
  for (const slug of Object.keys(data.chapters).filter(slug=>/^\d+$|^appendix-[a-i]$/.test(slug))) {
    const chapter=await read(project+'chapters/'+slug+'/index.html');
    anchors += [...chapter.matchAll(/id="manuscript-proof-[a-f0-9]{12}"/g)].length;
    for (const [,links] of chapter.matchAll(/<div class="chapter-proof-links"[^>]*>(.*?)<\/div>/gs)) {
      assert.match(links,/\/r\/NAG-\d{6}\/#foundations-exact-proof/);
      tagged++;
    }
    assert.doesNotMatch(chapter,/href="[^"]*\/(?:proof-tags\/p-|results\/fnd-)/i);
  }
  assert.ok(anchors>=1548);
  assert.ok(tagged>=1400);
});
test('Proofs retain exact paragraph locators in the text',async()=>{
  const tag=await read('/r/NAG-001831/index.html');
  assert.match(tag,/id="foundations-exact-proof"/);
  assert.match(tag,/id="proof-paragraph-1"/);
});

test('The old result URLs are aliases and the proposition uses a permanent Tag',async()=>{
  const chapter=await read(project+'chapters/11/index.html');
  const route=chapter.match(/href="([^"]*\/r\/NAG-9\d{5}\/)"[^>]*>NAG-9\d{5}<\/a>\s*<small[^>]*>[^<]*<\/small><\/p>\s*<div class="proposition">\s*<p><strong>Proposition 11\.4\.1\./)?.[1];
  assert.ok(route);
  const result=await read(route.slice(base.length)+'index.html');
  assert.match(result,/<strong>Proposition 11\.4\.1\.<\/strong>/);
  const alias=await read(project+'proof-tags/p-e3fb034c75ff/index.html');
  assert.match(alias,/noindex,follow/);
  assert.doesNotMatch(alias,diagramMarkup);
});

test('Stacks citations and conditional proof status are visible in the manuscript',async()=>{
  const result=await read('/r/NAG-001450/index.html');
  const proof=result.match(/<article\b[^>]*>[\s\S]*?<\/article>/)?.[0];
  for(const stacksTag of ['00IA','00IB']) {
    assert.ok(proof.includes('href="https://stacks.math.columbia.edu/tag/'+stacksTag+'"'));
  }
  const bookmark=await read(project+'proof-tags/p-a3b77345d5f0/index.html');
  const route=bookmark.match(/href="([^"]*\/r\/NAG-9\d{5}\/)#foundations-exact-proof"/)?.[1];
  assert.ok(route);
  const conditional=await read(route.slice(base.length)+'index.html');
  assert.match(conditional,/data-closure="conditional"/);
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
