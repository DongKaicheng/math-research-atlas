import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {runInNewContext} from 'node:vm';
import {restoreFoundationsNumberedLinks, restoreFoundationsPdfCaptions} from '../scripts/foundations-reading-editor.mjs';

const dist = path.resolve(import.meta.dirname, '../dist');
const base = (process.env.SITE_BASE_PATH ?? '/math-research-atlas').replace(/\/$/, '');
const project = '/projects/foundations/';
const fixed = project + 'editions/sealed-1097/';
const current = JSON.parse(await readFile(new URL('../content/foundations/current.json',import.meta.url),'utf8'));
const selected = project + 'editions/' + current.edition + '/';
const update = current.revision===2
  ? JSON.parse(await readFile(new URL('../content/foundations/releases/sealed-1174/data.json',import.meta.url),'utf8'))
  : null;
const updated = id => update?.records[id];
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
  assert.equal(board?.searchParams.get('version'), current.edition);
  assert.equal(board.searchParams.get('page'), local(project));
  assert.ok(!links.some(link => link.hostname === 'github.com'));
});

test('The homepage and contents offer the fixed English PDF, and the homepage discloses the role of AI',async()=>{
  const page = await read(project+'index.html');
  const pdf = selected+'reader-en.pdf';
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
  assert.match(glossary,/restriction, counterexample or inference still open at the original scope/);
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
    assert.doesNotMatch(chapter, /<canvas|<iframe|<embed|<object|pdfjs/);
    if (update?.chapterReaders[slug]) {
      const destination=encodeURIComponent(update.chapterReaders[slug].destination);
      assert.ok(chapter.includes(local(selected+'reader-en.pdf#nameddest='+destination)),slug);
    }
  }
  assert.match(contents, /Subject index/);
  assert.match(contents, /Bibliography/);
  assert.doesNotMatch(contents, /<canvas|pdfjs/);
});

test('Active chapter introductions link permanent Tags to their chapter and scope', async () => {
  const {tags} = JSON.parse(await read(project+'reader/tags.json'));
  const entries = JSON.parse(await readFile(new URL('../content/foundations/chapter-introductions.json',import.meta.url),'utf8'));
  const expectedChapters=Object.keys((await graph()).chapters).filter(slug=>/^\d+$|^appendix-[a-i]$/.test(slug));
  assert.deepEqual(Object.keys(entries).sort(),expectedChapters.sort());
  for (const [slug,parts] of Object.entries(entries)) {
    const route=project+'chapters/'+slug+'/';
    const page=await read(route+'index.html');
    const intro=page.match(/<p class="page-lead chapter-introduction">([^<]*(?:<a [^>]+>[^<]*<\/a>[^<]*)*)<\/p>/)?.[1];
    if (!update) {
      assert.equal(intro,undefined,slug);
      continue;
    }
    assert.ok(intro && page.indexOf(intro)<page.indexOf('<article class="book-text"'),slug);
    const links=[...intro.matchAll(/<a href="([^"]+)">/g)].map(([,href])=>href);
    const linked=parts.filter(part=>typeof part==='object');
    const expected=part=>{
      const canonical='/r/'+part.tag+'/';
      if (!part.scope) return canonical;
      const clause=update.scopeRecords[part.scope];
      assert.equal(clause?.id,part.tag);
      return clause.reader || clause.proof
        ? canonical+'#scope-'+encodeURIComponent(part.scope).replaceAll('%','_')
        : fixed+clause.archived.slice(1);
    };
    assert.deepEqual(links,linked.map(part=>local(expected(part))),slug);
    for (const part of linked) {
      const canonical=await read('/r/'+part.tag+'/index.html');
      const chapterLanding=tags[part.tag];
      assert.ok(chapterLanding?.startsWith(local(project+'chapters/'+(part.chapter ?? slug)+'/')+'#'),part.tag);
      assert.ok(canonical.includes('data-closure="'+part.status+'"'),part.tag);
      assert.ok(canonical.includes('href="'+chapterLanding+'">Read in chapter</a>'),part.tag);
      if (part.scope) {
        const [path,fragment]=expected(part).split('#');
        const scopePage=await read(path+'index.html');
        assert.ok(fragment && scopePage.includes('id="'+fragment+'"'),part.scope);
      }
    }
    assert.ok(!(await read(fixed+route.slice(project.length)+'index.html')).includes('chapter-introduction'),slug);
  }
});

test('The web edition preserves exact source and proof links', async () => {
  const oldMap = await read(project + 'logic/full/index.html');
  assert.match(oldMap, /foundations-proof-bookmark\.js/);
  assert.doesNotMatch(oldMap, /5,434 registered/);
  const reader = await read(project + 'reader/index.html');
  assert.match(reader, /Table of contents/);
  assert.doesNotMatch(reader, /web-reader-sheet|<canvas|pdfjs/);
  const index = JSON.parse(await read(project + 'reader/tags.json'));
  assert.equal(Object.keys(index.tags).length,update ? 1712 : 1662);
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
  if (update) assert.match(tag, /reader-en\.pdf#nameddest=theorem\.5\.56\.6/);
  else assert.match(tag, /Theorem 5\.56\.6/);
  assert.match(tag, /class="proof"/);
  assert.match(tag, /<math\b/);
  if (!update) assert.match(tag, /class="katex-html"/);
  assert.match(tag, /id="foundations-exact-proof"/);
  assert.doesNotMatch(tag, /\p{Script=Han}|Exact TeX source|<canvas/u);
  const frozen = await read(fixed + 'r/NAG-002462/index.html');
  assert.doesNotMatch(frozen, /tag-proof-text/);
});

test('Chapters and all kinds of public Tags typeset display math and styled symbols', async () => {
  const routes = [project+'chapters/16/', '/r/NAG-900301/', '/r/NAG-002462/', '/r/NAG-002567/'];
  for (const route of routes) {
    const page = await read(route+'index.html');
    const id=route.split('/').at(-2);
    if (updated(id)?.proof) {
      assert.match(page, /class="proof"/,route);
      assert.match(page, /<math\b/,route);
      assert.match(page, /id="foundations-exact-proof"/,route);
      continue;
    }
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
  if (updated('NAG-002567')) {
    assert.match(historical, /data-closure="closed"/);
    assert.match(historical, /id="foundations-exact-proof"/);
  } else {
    assert.match(historical, /Historical statement/);
    assert.match(historical, /class="tag"/);
  }
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
  const rows = JSON.parse(await read('/search-index.json')).filter(row=>row.project==='foundations');
  assert.equal(rows.length,1712);
  assert.equal(new Set(rows.map(row=>row.id)).size,rows.length);
  const data = await graph();
  let historical = 0;
  for (const row of rows) {
    const route = row.link.slice(base.length);
    const tag = await read(route+'index.html');
    assert.match(tag,/^<!doctype html><html lang="en">/);
    assert.doesNotMatch(tag,/\p{Script=Han}|<canvas|pdfjs/u,row.id);
    const scopedActions=/<a href="[^"]+\/logic\/chapters\/5\/#argument-clause-nag-002405-[a-z_]+">Proof map for this scope<\/a>/g;
    const reading=row.id==='NAG-002405' && update ? tag.replace(scopedActions,'') : tag;
    if (reading!==tag) assert.equal([...tag.matchAll(scopedActions)].length,3);
    assert.doesNotMatch(reading,diagramMarkup,row.id);
    assert.equal(tag.includes('id="open-status"'),Object.hasOwn(data.gaps,row.id),row.id);
    assert.match(tag,new RegExp('data-closure="'+row.status+'"'),row.id);
    if (updated(row.id)?.erratum) {
      assert.match(tag,/Reviewed erratum/,row.id);
      assert.match(tag,/Full proofs at narrower scope/,row.id);
    } else if (!['definition','closed'].includes(row.status)) {
      assert.match(tag,/<dt>Problem types<\/dt><dd><a /,row.id);
    }
    const visible = tag.replace(/<details(?: open)?><summary>TeX reading text<\/summary>[\s\S]*?<\/details>/g,'').replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g,'').replace(/<[^>]+>/g,'');
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
  assert.doesNotMatch(overview.replace(/editions\/sealed-1174\/logic\//g,''),diagramMarkup);
  const locators=JSON.parse(await read(project+'reader/tags.json')).tags;
  const slugs=Object.keys(data.chapters);
  const expectedByChapter=new Map(slugs.map(slug=>[slug,new Set()]));
  const originalIds=new Set();
  for (const slug of slugs) {
    const sealed=await read(fixed+`chapters/${slug}/index.html`);
    for (const [,id] of sealed.matchAll(/<li class="entry"><small>(NAG-\d{6})<\/small>/g)) {
      assert.ok(!originalIds.has(id),id);
      originalIds.add(id);
      const location=locators[id]?.split('/').at(-2);
      const current=update ? updated(id)?.chapter ?? (expectedByChapter.has(location) ? location : slug) : slug;
      expectedByChapter.get(current).add(id);
    }
  }
  for (const record of Object.values(update?.records ?? {})) expectedByChapter.get(record.chapter).add(record.id);
  let total=0;
  const assigned=new Set();
  for (const slug of slugs) {
    const entries=Object.entries(data.gaps).filter(([,gap])=>gap.chapter===slug);
    const row=overview.match(new RegExp(`<tr id="chapter-${slug}"[^>]*>[\\s\\S]*?</tr>`))?.[0];
    const count=type=>Number(row.match(new RegExp(`<td data-count="${type}"[^>]*>(.*?)</td>`))?.[1]?.replace(/<[^>]+>/g,''));
    const detail=await read(project+`coverage/chapters/${slug}/index.html`);
    const ids=[...detail.matchAll(/<li data-tag-status="[^"]+"><a href="[^"]*\/r\/(NAG-\d{6})\//g)].map(([,id])=>id);
    assert.deepEqual(ids.filter(id=>!id.startsWith('NAG-9')).sort(),[...expectedByChapter.get(slug)].sort(),slug);
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

test('The current chapters integrate the selected statements, proofs and scope corrections', {skip:!update}, async () => {
  const chapters=new Map();
  const selectedTags=new Set(update.selected);
  for (const record of Object.values(update.records)) {
    const chapter=project+'chapters/'+record.chapter+'/';
    if (!chapters.has(chapter)) chapters.set(chapter,await read(chapter+'index.html'));
    const page=chapters.get(chapter);
    const tag=await read('/r/'+record.id+'/index.html');
    const fragment='result-'+record.id;
    assert.match(tag,new RegExp('data-closure="'+record.status+'"'),record.id);
    if (!record.custody) {
      assert.ok(page.includes('id="'+fragment+'"'),record.id);
      assert.ok(page.includes('id="'+fragment+'-proof"'),record.id);
      assert.ok(page.includes(local('/r/'+record.id+'/')),record.id);
    }
    assert.equal(selectedTags.has(record.id),record.status==='closed',record.id);
    assert.ok(tag.includes('#nameddest='+encodeURIComponent(record.reader.destination)),record.id);
    assert.ok(tag.includes('page='+encodeURIComponent('/r/'+record.id+'/')+'&amp;entry='+record.id),record.id);
    if (record.erratum) {
      assert.ok(tag.includes('#nameddest='+encodeURIComponent(record.historical.destination)),record.id);
      for (const reader of record.narrowReaders) assert.ok(tag.includes('#nameddest='+encodeURIComponent(reader.destination)),record.id);
    }
  }
  assert.doesNotMatch(chapters.get(project+'chapters/10/'),/transitive prerequisite cone is still under review/);
  for(const chapter of chapters.values()) assert.doesNotMatch(chapter,/Earlier manuscript passages below retain/);
});

test('Section 10.1 links the exact consumers and distinguishes its two local proofs', {skip:!update}, async () => {
  const route=project+'chapters/10/';
  const chapter=await read(route+'index.html');
  const section=chapter.slice(chapter.indexOf('id="ii:PL"'),chapter.indexOf('id="new:interval"'));
  const consumer=section.slice(section.indexOf('id="exact-consumer."'),section.indexOf('id="the-actual-operation."'));
  for (const id of ['NAG-003103','NAG-003106']) {
    assert.ok(consumer.includes('href="'+local('/r/'+id+'/')+'">'+id+'</a>'),id);
    const tag=await read('/r/'+id+'/index.html');
    assert.match(tag,/<a href="#foundations-exact-proof">Proof<\/a>/);
    assert.match(tag,/<section id="foundations-exact-proof"/);
  }
  assert.ok(section.includes('href="'+local('/r/NAG-002473/')+'">002473</a>'));
  assert.ok(section.includes('href="#finite-localization-lemma.">finite cutoff lemma</a>'));
  for (const [label,id,paragraph] of [
    ['proof lines 240–254 of F8NM','NAG-003103',1], ['as in lines 240–245','NAG-003103',1],
    ['lines 372–381','NAG-003106',4], ['lines 259–285','NAG-003103',2],
  ]) {
    const href=local('/r/'+id+'/#proof-paragraph-'+paragraph);
    assert.ok(section.includes('href="'+href+'">'+label+'</a>'),label);
  }
  const comparison=local(selected+'reader-en.pdf#nameddest=section*.398');
  assert.equal(section.split('href="'+comparison+'">finite-refinement scalar comparison</a>').length,3);
  assert.doesNotMatch(section,/nonauthor interface-fit receipt|still separate from canonical admission/);
  for (const [name,id] of [
    ['F8CR-S','002966'], ['F8CR-N','002967'], ['F8CR-I','002976'], ['F8CR-C','002979'],
    ['F8CR-P','002981'], ['F8MG-O','002999'], ['F8MG-T','003002'],
  ]) {
    assert.ok(section.includes('href="'+local('/r/NAG-'+id+'/')+'">'+name+'</a>'),name);
  }
  for (const digest of [
    '34cea90b0be25d9bcbc565721888844e328453d64137a13c9bf79097495005af',
    'b211ebdb9ad232a3f66d7e80feac6be31857f66a1415c91a034b599ca615aa2b',
  ]) assert.ok(section.includes('<code>'+digest+'</code>'));
  for (const [proof,title,oldId,destination] of [
    ['024199762ed7','Finite localization lemma','proof.','section*.62'],
    ['17d7eff8a70f','Logarithmic clipping on bounded ordinary tests','proof.-1','section*.65'],
  ]) {
    const anchor='manuscript-proof-'+proof;
    assert.ok(chapter.includes('href="#'+anchor+'">'+title+'</a>'));
    assert.ok(chapter.includes('href="'+local(selected+'reader-en.pdf#nameddest='+destination)+'">'+title+' in the English PDF</a>'));
    assert.ok(section.includes('id="'+anchor+'"'));
    assert.ok(section.includes('id="'+oldId+'"'));
    const former=await read(project+'proof-tags/p-'+proof+'/index.html');
    assert.ok(former.includes(local(route)+'#'+anchor));
  }
});

test('Section 10.1 proof citations follow the public seal 1174 source', {skip:!update}, async () => {
  const chapter=await read(project+'chapters/10/index.html');
  const fixedTest=await read('/r/NAG-003103/index.html');
  const current=await read('/r/NAG-003106/index.html');
  const citation=(href,label)=>'<a href="'+local(href)+'">'+label+'</a>';
  for (const html of [chapter,fixedTest]) {
    assert.ok(html.replace(/\s+/g,' ').includes(citation('/r/NAG-003100/','NAG-003100')+' identifies the full Cartier'));
    assert.ok(html.includes(citation('/r/NAG-001630/','NAG-001630')+'/'+citation('/r/NAG-001704/','001704')));
    for (const [label,number,formula,references] of [
      ['eq:meromorphic','10.1.1',String.raw`L_f(\dd\eta)`,2], ['eq:metric','10.1.2',String.raw`G_s(\dd\eta)`,1],
    ]) {
      const id='label-'+Buffer.from(label).toString('hex');
      assert.equal(html.split('id="'+id+'"').length,2,id);
      const pdf=local(selected+'reader-en.pdf#nameddest=equation.'+number);
      assert.equal(html.split('href="'+pdf+'">('+number+')</a>').length,references+1,id);
      const display=html.split('<span id="'+id+'"></span>')[1]?.match(/^<span class="math display">[\s\S]+?<annotation[^>]*>(.*?)<\/annotation>/s)?.[1];
      assert.ok(display?.startsWith(formula),id+' next to '+String(display));
    }
  }
  for (const html of [chapter,current]) {
    assert.ok(html.includes(citation('/r/NAG-003103/','NAG-003103')+','));
    for (const [shortLabel,destination] of [['003101','I.2.82'],['003102','I.2.83']]) {
      assert.ok(html.includes(citation(selected+'reader-en.pdf#nameddest=equation.'+destination,'NAG-'+shortLabel)));
    }
    assert.ok(html.includes(citation('/r/NAG-002473/','NAG-002473')+','));
    assert.doesNotMatch(html,/nameddest=equation\.I\.2\.33">\[eq:logsplit\]<\/a>/);
  }
  for (const [id,anchor,paragraphs] of [
    ['NAG-003103','label-74686d3a6669786564',3], ['NAG-003106','label-70726f703a746f706f6c6f6779',4],
  ]) {
    assert.equal(chapter.split('id="'+anchor+'"').length,2,id);
    const tag=await read('/r/'+id+'/index.html');
    assert.ok(tag.includes(citation(project+'chapters/10/#'+anchor,'Read in chapter')));
    assert.ok(tag.includes(citation(project+'chapters/10/#f8nm:native-placement-review','Hypotheses in Section 10.1')));
    assert.ok(tag.includes('data-source-sha256="'+updated(id).proof.sourceSha256+'"'));
    const proof=tag.split('<section id="foundations-exact-proof"')[1]?.split('</section>')[0];
    assert.ok(proof,id);
    for (let i=1;i<=paragraphs;i++) {
      const anchor='id="proof-paragraph-'+i+'"';
      assert.ok(proof.includes('<p><span '+anchor+'></span>'),id+' paragraph '+i);
      assert.equal(tag.split(anchor).length,2,id+' unique paragraph '+i);
    }
  }
  const former=await read(selected+'r/NAG-003106/index.html');
  assert.ok(former.includes(citation(selected+'reader-en.pdf#nameddest=equation.I.2.33','[eq:logsplit]')));
});

test('Chapter 10 displays the printed equation numbers at their original formulas', {skip:!update}, async () => {
  const chapter=await read(project+'chapters/10/index.html');
  for (const [tag,label,number,formula] of [
    ['NAG-003103','eq:meromorphic','10.1.1','L_f('],
    ['NAG-003103','eq:metric','10.1.2','G_s('],
    ['NAG-003002','fnd:nag003002:dual-equation','I.2.36','(d&#39;T)'],
  ]) {
    const fragment='label-'+Buffer.from(label).toString('hex');
    const active=await read('/r/'+tag+'/index.html');
    const frozen=await read(selected+'r/'+tag+'/index.html');
    const labelNote='<span class="book-note equation-number">('+number+')</span>';
    const start='<span id="'+fragment+'"></span>';
    for (const page of [chapter,active]) {
      assert.equal(page.split(start).length,2,fragment);
      assert.equal(page.split(labelNote).length,2,number);
      const nearby=page.split(start)[1].split(labelNote)[0];
      assert.match(nearby,/^<span class="math display"/);
      if (tag==='NAG-003002') assert.match(nearby,/^<span class="math display" tabindex="0"><math display="block"/);
      assert.ok(nearby.includes('encoding="application/x-tex">'+formula),number);
    }
    assert.ok(!frozen.includes(labelNote),number);
    if (tag==='NAG-003002') {
      const proof=active.split('<section id="foundations-exact-proof"')[1]?.split('</section>')[0];
      assert.equal([...proof.matchAll(/<span class="math display" tabindex="0"><math display="block"/g)].length,2);
      assert.ok(!proof.includes('class="book-note equation-number"'));
    }
  }
  const transfer=await read('/r/NAG-003106/index.html');
  assert.ok(!transfer.includes('class="book-note equation-number"'));
});

test('Former proof and chapter bookmarks preserve encoded matching fragments', async () => {
  const script=await read('/assets/foundations-proof-bookmark.js');
  for (const [route,encoded,carry,path,fragment] of [
    ['/r/NAG-900099/','#proof%2Dparagraph%2D2',true,'/r/NAG-900099/','#proof-paragraph-2'],
    ['/r/NAG-900099/','#proof%2Dparagraph%2D2',false,'/r/NAG-900099/',''],
    ['/r/NAG-002463/','#proof%2Dparagraph%2D1','foundations-exact-proof proof-paragraph-1','/r/NAG-002463/','#proof-paragraph-1'],
    ['/r/NAG-002463/','#proof-paragraph-2','foundations-exact-proof proof-paragraph-1','/r/NAG-002463/',''],
    ['/r/NAG-900099/#foundations-exact-proof','#%E0%A4%A',true,'/r/NAG-900099/','#foundations-exact-proof'],
    ['/r/NAG-900099/#foundations-exact-proof','#proof%252Dparagraph%252D2',true,'/r/NAG-900099/','#foundations-exact-proof'],
    [project+'contents/','#dependency%2D10',false,project+'chapters/10/','#chapter-proofs'],
  ]) {
    let actual;
    const location={hash:encoded,replace:target=>{actual=target;}};
    const a={href:'https://atlas.test'+local(route),getAttribute:()=>carry ? String(carry) : null};
    runInNewContext(script,{location,document:{querySelector:()=>a},URL});
    assert.equal(actual.pathname,local(path),encoded);
    assert.equal(actual.hash,fragment,encoded);
  }
});

test('Foundations search and saved reader links expose a script-free Tag index fallback', async () => {
  const search=await read(project+'search/index.html');
  const reader=await read(project+'reader/index.html');
  const contents=await read(project+'contents/index.html');
  const href='href="'+local(project+'coverage/')+'"';
  assert.ok(search.split('<noscript>')[1]?.split('</noscript>')[0].includes(href+'>Browse the Tag index'));
  assert.ok(reader.split('<noscript>')[1]?.split('</noscript>')[0].includes(href+'>browse the Tag index'));
  assert.ok(!contents.includes('Saved reading links use JavaScript.'));
});

test('Chapters 2 and 5 display the exact compiled section numbers and retain their bookmarks', {skip:!update}, async () => {
  const contents=await read(project+'contents/index.html');
  const {destinations}=JSON.parse(await read(project+'reader/tags.json'));
  for (const [chapter,number,id,title,savedAnchor] of [
    ['2','2.27','fnd:strictggsection','Gerritzen–Grauert in the strict category','label-666e643a737472696374676773656374696f6e'],
    ['2','2.54','fnd:etaleresiduereconstruction','Simple roots and finite étale germs','label-666e643a6574616c65726573696475657265636f6e737472756374696f6e'],
    ['5','5.24','the-faces-of-an-étalesemistable-chart','The faces of an étalesemistable chart','the-faces-of-an-étalesemistable-chart'],
  ]) {
    const route=project+'chapters/'+chapter+'/';
    const page=await read(route+'index.html');
    assert.ok(page.includes('<h2 id="'+id+'">'+number+' '+title+'</h2>'),number);
    assert.ok(page.includes('href="#'+id+'">'+number+' · '+title+'</a>'),number);
    assert.ok(contents.includes('href="'+local(route)+'#'+id+'">'+number+' · '+title+'</a>'),number);
    assert.equal(destinations['section.'+number],local(route)+'#'+savedAnchor,number);
    assert.equal(page.split('id="'+savedAnchor+'"').length,2,number);
  }
  assert.match(await read(project+'chapters/2/index.html'),/>2\.28 Finite modules and Laurent descent<\/h2>/);
});

test('Chapter 4–6 unproved statements retain source context and exact external references', {skip:!update}, async () => {
  const appendix=project+'chapters/appendix-a/';
  const bib=await read(appendix+'index.html');
  for (const [tag,state,cue,refs,source] of [
    ['NAG-900007','open','Its divisor is therefore unambiguous',['BPRStructure'],['4','50']],
    ['NAG-900009','open',null,['GubGuide'],['5','54']],
    ['NAG-900030','open',null,['GRPL'],['6','125']],
    ['NAG-900034','open','We retain the coefficient data',['DT26','APW26'],['6','148']],
    ['NAG-900008','pending','all Berkovich points',['GubGuide']],
    ['NAG-900010','pending','Independence of displacement uses balancing',['GK17']],
    ['NAG-900024','pending','unimodular on its polyhedral pieces',['GRW16']],
  ]) {
    const page=await read('/r/'+tag+'/index.html');
    assert.ok(page.includes('data-closure="'+state+'"'),tag);
    assert.doesNotMatch(page,/id="foundations-exact-proof"|href="#foundations-exact-proof"/,tag);
    if (cue) assert.ok(page.includes(cue),tag);
    for (const key of refs) {
      const href='href="'+local(appendix+'#ref-'+key)+'"';
      assert.ok(bib.includes('id="ref-'+key+'"'),key);
      assert.ok(page.includes(href),tag);
      if (source) {
        const [slug,note]=source;
        const chapter=await read(project+'chapters/'+slug+'/index.html');
        assert.ok(chapter.split('id="source-proof-obligation-'+note+'"')[1].split('</div>')[0].includes(href),tag);
      }
    }
  }
  const source=await read('/r/NAG-900008/index.html');
  assert.ok(source.includes('href="'+local(project+'chapters/5/#cancellation-and-repeated-minima')+'"'));
});

test('Corollary 4.40.2 links each retained model proof citation to its own exact scope', {skip:!update}, async () => {
  const old=project+'chapters/3/#label-666e643a666f726d616c676c6f62616c67656e65726963666169746866756c';
  const oldTag=local('/r/NAG-001944/');
  const citations=[
    ['as in Proposition','scope-CLAUSE_3ANAG-001944_3Aformal_topology','errata%3Anag001944'],
    ['Uniqueness follows from the faithfulness in Proposition','scope-SUPPORT_3ANAG-001944_3Asupplied_actual_arrow_faithfulness','nag.scope.001944.suppliedarrowfaithfulness'],
  ];
  const scope=await read('/r/NAG-001944/index.html');
  const frozen=await read(selected+'r/NAG-002227/index.html');
  const current=[await read('/r/NAG-002227/index.html'),await read(project+'chapters/4/index.html')];
  const chapter=await read(project+'chapters/3/index.html');
  assert.equal(chapter.split('id="'+old.split('#')[1]+'"').length,2);
  for (const [text,anchor,dest] of citations) {
    const prefix=text+' <a href="';
    for (const page of current) {
      assert.ok(page.includes(prefix+oldTag+'#'+anchor+'">3.17.2</a>'),anchor);
      assert.ok(!page.includes(prefix+local(old)+'">3.17.2</a>'),anchor);
    }
    assert.ok(frozen.includes(prefix+local(old)+'">3.17.2</a>'),anchor);
    const bound=scope.split('id="'+anchor+'"')[1].split('</section>')[0];
    assert.ok(bound.includes(local(selected+'reader-en.pdf#nameddest='+dest)),dest);
  }
});

test('Chapter 3 proof citations select the retained topology and product-blowup clauses', {skip:!update}, async () => {
  const chapter=await read(project+'chapters/3/index.html');
  for (const [tag,phrase,number,label,target] of [
    ['NAG-001946','is Noetherian topologically, by Proposition','3.17.2','fnd:formalglobalgenericfaithful',
      '/r/NAG-001944/#scope-CLAUSE_3ANAG-001944_3Aformal_topology'],
    ['NAG-002016','For a finite family of monomials, blow up the product of these open ideals. Lemma','3.17.3','fnd:formalglobalblowupcalculus',
      fixed+'r/NAG-001945/#formal_existence_restriction_product_pullback'],
  ]) {
    const entry=await read('/r/'+tag+'/index.html');
    const prefix=phrase+' <a href="';
    const anchor='label-'+Buffer.from(label).toString('hex');
    const previous=local(project+'chapters/3/#'+anchor);
    assert.equal(chapter.split('id="'+anchor+'"').length,2,label);
    for (const page of [entry,chapter]) {
      assert.ok(page.includes(prefix+local(target)+'">'+number+'</a>'),tag);
      assert.ok(!page.includes(prefix+previous+'">'+number+'</a>'),tag);
    }
  }
  const archive=await read(fixed+'r/NAG-001945/index.html');
  assert.match(archive,/id="formal_existence_restriction_product_pullback"/);
});

test('Characteristic-zero and integral-coefficient proof citations follow exact sealed errata', {skip:!update}, async () => {
  const regular=local(selected+'reader-en.pdf#nameddest=errata%3Anag001761');
  const integral=local(selected+'reader-en.pdf#nameddest=lemma.I.2.72');
  const [chapter2,chapter4]=await Promise.all([2,4].map(n=>read(project+'chapters/'+n+'/index.html')));
  const formerRegular='label-'+Buffer.from('fnd:separablenormalizationregularlocus').toString('hex');
  const formerSlope='label-'+Buffer.from('cand:boundarycoefficientorder').toString('hex');
  assert.equal(chapter2.split('id="'+formerRegular+'"').length,2);
  assert.equal(chapter4.split('id="'+formerSlope+'"').length,2);
  const regularLink='href="'+regular+'">2.35.24</a>';
  const integralLink='href="'+integral+'">4.24.4</a>';
  for (const [id,count] of [['NAG-001763',2],['NAG-001764',1]]) {
    const proof=await read('/r/'+id+'/index.html');
    assert.equal(proof.split(regularLink).length-1,count,id);
    assert.ok(!proof.includes(local(project+'chapters/2/#'+formerRegular)+'">2.35.24</a>'),id);
  }
  assert.equal(chapter2.split(regularLink).length-1,3);
  const slope=await read('/r/NAG-002073/index.html');
  assert.ok(slope.includes(integralLink));
  assert.ok(chapter4.includes(integralLink));
  assert.ok(!slope.includes(local(project+'chapters/4/#'+formerSlope)+'">4.24.4</a>'));
});

test('Chapter proof indexes disclose the valid scope of sealed errata', {skip:!update}, async () => {
  const caption='Erratum and proof at the valid scope';
  const partials=update.counts.pendingOriginals;
  for (const id of partials) {
    const slug=updated(id).chapter;
    const page=await read(project+'chapters/'+slug+'/index.html');
    const index=page.split('id="chapter-proofs"')[1].split('</details>')[0];
    const fragment='result-'+id+'-proof';
    const entry=index.split('href="#'+fragment+'">')[1].split('</li>')[0];
    assert.ok(entry.includes(' · '+caption+'</a>'),id);
    assert.ok(entry.includes('href="'+local('/r/'+id+'/')+'">'+id+'</a>'),id);
    assert.ok(page.includes('id="'+fragment+'"><summary>'+caption+'</summary>'),id);
  }
  const active=await read(project+'chapters/2/index.html');
  const index=active.split('id="chapter-proofs"')[1].split('</details>')[0];
  assert.equal(index.split(caption).length-1,partials.filter(id=>updated(id).chapter==='2').length);
});

test('Chapter 6 distinguishes the open purity theorem from its projection lemma', {skip:!update}, async () => {
  const chapter=await read(project+'chapters/6/index.html');
  const section=chapter.split('id="new:affinoid_tropical_purity"')[1].split('id="new:matroidal_models"')[0];
  assert.match(section,/The proof strategy is useful beyond the dimension theorem/);
  const note='source-proof-obligation-125';
  assert.equal(section.split('id="'+note+'"').length,2);
  assert.ok(section.includes('href="#'+note+'">open proof obligation for Theorem 6.10.2</a>'));
  assert.ok(section.includes('href="'+local(project+'chapters/appendix-a/#ref-GRPL')+'">[GRPL]</a>'));
  assert.match(section,/Open proof obligation \(RC2\)/);
  assert.doesNotMatch(section,/The proof above expands/);

  const open=await read('/r/NAG-900030/index.html');
  assert.match(open,/data-closure="open"/);
  assert.doesNotMatch(open,/id="foundations-exact-proof"/);
  assert.ok(open.includes('href="'+local(project+'chapters/6/#'+note)+'">Chapter 6 note (RC2)</a>'));
  const lemma=await read('/r/NAG-900029/index.html');
  assert.match(lemma,/data-closure="pending"/);
  assert.match(lemma,/id="foundations-exact-proof"/);
});

test('Explicit finite and supplied formal atlases cite their exact retained scopes', {skip:!update}, async () => {
  const finite=local(selected+'reader-en.pdf#nameddest=nag.scope.001944.qpcfiniteincidence');
  const comparison=local(selected+'reader-en.pdf#nameddest=nag.scope.001945.suppliedatlas');
  const trace=local('/r/NAG-001944/#scope-SUPPORT_3ANAG-001944_3Agiven_atlas_open_preimages_and_contraction');
  const chapter=await read(project+'chapters/3/index.html');
  const wholeFibre='label-'+Buffer.from('fnd:formalglobalgenericfaithful').toString('hex');
  const wholeBlowup='label-'+Buffer.from('fnd:formalglobalblowupcalculus').toString('hex');
  const old=local(project+'chapters/3/#'+wholeFibre);
  for (const anchor of [wholeFibre,wholeBlowup]) assert.equal(chapter.split('id="'+anchor+'"').length,2,anchor);

  for (const [id,targets] of [
    ['NAG-002016',[finite]], ['NAG-002038',[finite]], ['NAG-002054',[trace,finite]],
    ['NAG-002100',[comparison]], ['NAG-002274',[finite]], ['NAG-002276',[finite]],
    ['NAG-002310',[finite]], ['NAG-002339',[trace]],
    ['NAG-002176',[trace]], ['NAG-002177',[finite]], ['NAG-002218',[trace]],
  ]) {
    const proof=(await read('/r/'+id+'/index.html')).split('id="foundations-exact-proof"')[1].split('</section>')[0];
    const printedNumber=id==='NAG-002100' ? '3.17.3' : '3.17.2';
    for (const target of targets) assert.ok(proof.includes('href="'+target+'">'+printedNumber+'</a>'),id);
    assert.ok(!proof.includes('href="'+old+'">3.17.2</a>'),id);
    if (id==='NAG-002100') assert.ok(!proof.includes('href="'+local(project+'chapters/3/#'+wholeBlowup)+'">3.17.3</a>'),id);
  }
  for (const id of ['NAG-001798','NAG-001799','NAG-002036','NAG-002220','NAG-002221','NAG-002226','NAG-002263','NAG-002335']) {
    const proof=(await read('/r/'+id+'/index.html')).split('id="foundations-exact-proof"')[1].split('</section>')[0];
    assert.ok(proof.includes('href="'+old+'">3.17.2</a>'),id);
  }
});

test('Chapter 3 companion passages link the retained authorities they name', {skip:!update}, async () => {
  const chapter=await read(project+'chapters/3/index.html');
  const topology=local('/r/NAG-001944/#scope-CLAUSE_3ANAG-001944_3Aformal_topology');
  const formal=local(project+'editions/sealed-1097/r/NAG-001945/#formal_existence_restriction_product_pullback');
  const extension=local('/r/NAG-001946/#foundations-exact-proof');
  for (const [caption,target,count] of [
    ['formal-topology clause of NAG-001944',topology,3],
    ['topological Noetherian clause of NAG-001944',topology,1],
    ['formal-only NAG-001945 clause',formal,1],
    ['formal existence and restriction clause of NAG-001945',formal,1],
  ]) {
    assert.equal(chapter.split('href="'+target+'">'+caption+'</a>').length-1,count,caption);
  }
  assert.match(await read('/r/NAG-001944/index.html'),/id="scope-CLAUSE_3ANAG-001944_3Aformal_topology"/);
  assert.match(await read(project+'editions/sealed-1097/r/NAG-001945/index.html'),
    /id="formal_existence_restriction_product_pullback"/);
  assert.equal(chapter.split('via <a href="'+extension+'">NAG-001946</a> and perform').length,2);
  assert.match(await read('/r/NAG-001946/index.html'),/id="foundations-exact-proof"/);
});

const pendingManuscriptsByChapter = new Map([
  [2,[900003]], [4,[900005,900006]],
  [5,[900011,900012,900013,900014,900015,900016,900017,900018,900019,900020,900021]],
  [6,[900025,900026,900027,900028,900029,900031,900032,900033]],
]);

test('Early chapter proof indexes and argument landings disclose the pending state', {skip:!update}, async () => {
  const status='<small class="book-tag-status">Proof review pending</small>';
  for (const [chapter,pending] of pendingManuscriptsByChapter) {
    const page=await read(project+'chapters/'+chapter+'/index.html');
    const index=page.split('id="chapter-proofs"')[1].split('</details>')[0];
    for (const number of pending) {
      const tag='NAG-'+number;
      const reference='href="'+local('/r/'+tag+'/#foundations-exact-proof')+'">'+tag+'</a> '+status;
      assert.equal(index.split(reference).length,2,tag);
      assert.equal(page.split(reference).length,3,tag);
    }
    if (chapter===6) assert.ok(!index.includes('NAG-900030'));
  }
  const first=await read(project+'chapters/1/index.html');
  const index=first.split('id="chapter-proofs"')[1].split('</details>')[0];
  assert.ok(index.includes('NAG-000138'));
  assert.ok(!index.includes(status));
});

test('Accepted early proofs restore printed captions while retaining sealed destinations', {skip:!update}, async () => {
  const cases=[
    ['NAG-000157','2','fnd:generalrelativeinterioropen','theorem.2.46.2','2.46.2'],
    ['NAG-000176','3','fnd:formalmodels','section.3.5','3.5'],
    ['NAG-000186','3','fnd:nag001985:strict-subdomains-functoriality','foundations.nag-001985.strict-subdomains-functoriality','I.2.28'],
    ['NAG-001948','3','fnd:nag001947:whole-original','foundations.nag-001947.original','I.2.41'],
    ['NAG-001824','2','fnd:nontrivialinnercoherentflatness','theorem.2.62.2','2.62.2'],
    ['NAG-002463','5','v038:degree:genericcoefficientcondition','equation.5.56.1','(5.56.1)'],
  ];
  for (const [id,chapter,key,destination,caption] of cases) {
    const href=local(selected+'reader-en.pdf#nameddest='+destination);
    const former='href="'+href+'">['+key+']</a>';
    const printed='href="'+href+'">'+caption+'</a>';
    const proofSection = page => page.split('id="foundations-exact-proof"')[1].split('</section>')[0];
    const tag=proofSection(await read('/r/'+id+'/index.html'));
    const old=proofSection(await read(selected+'r/'+id+'/index.html'));
    const book=(await read(project+'chapters/'+chapter+'/index.html'))
      .split('id="result-'+id+'-proof"')[1].split('</details>')[0];
    assert.ok(tag.includes(printed) && book.includes(printed),id);
    assert.ok(!tag.includes(former) && !book.includes(former),id);
    assert.ok(old.includes(former),id);
  }
});

test('The Chapter 10 cited manuscript bookmarks disclose their existing status row', {skip:!update}, async () => {
  const routes=JSON.parse(await read(project+'reader/tags.json'));
  const status='Proof review pending';
  for (const [destination,tag,caption] of [
    ['theorem.15.5.2','NAG-900286',status],
    ['proposition.10.6.1','NAG-900098',status],
    ['lemma.10.8.1','NAG-900100',status],
    ['theorem.6.10.2','NAG-900030','Open proof obligation'],
    ['theorem.10.7.1','NAG-900099',status],
  ]) {
    const record=routes.destinations[destination];
    assert.equal(routes.tags[tag],record);
    const [url,anchor]=record.split('#');
    const originalAnchor='id="'+anchor+'"';
    const page=await read(url.replace(new RegExp('^'+base),'')+'index.html');
    const bookmark='data-statement-bookmark="'+anchor+'" tabindex="-1"';
    assert.equal(page.split(originalAnchor).length,2,destination);
    assert.equal(page.split(bookmark).length,2,destination);
    const strip=page.split(bookmark)[1].split('</p>')[0];
    assert.ok(strip.includes('href="'+local('/r/'+tag+'/')+'">'+tag+'</a>'),tag);
    assert.ok(strip.includes(caption+'</small>'),tag);
    const individual=await read('/r/'+tag+'/index.html');
    assert.ok(!individual.includes(bookmark),tag);
  }
  const chapter=await read(project+'chapters/10/index.html');
  assert.equal([...chapter.matchAll(/class="book-result-link" data-statement-bookmark=/g)].length,3);
  assert.ok(!chapter.includes('data-statement-bookmark="result-NAG-003103-proof"'));
  const proofTargets=[...chapter.matchAll(/id="(manuscript-proof-[0-9a-f]+)" role="group" aria-label="Proof links" data-reveal-proof-bookmark/g)].map(([,id])=>id);
  assert.deepEqual(proofTargets,['manuscript-proof-e055641e8f19','manuscript-proof-2746af732cf5']);
  const accepted=await read('/r/NAG-003106/index.html');
  assert.ok(!accepted.includes('data-statement-bookmark='));
});

test('Early open and pending Tag bookmarks expose their existing chapter status', {skip:!update}, async () => {
  const routes=JSON.parse(await read(project+'reader/tags.json'));
  for (const [tag,chapter,state,hasArgument=false] of [
    ['NAG-900007','4','open'], ['NAG-900009','5','open'], ['NAG-900034','6','open'],
    ['NAG-900008','5','pending'], ['NAG-900010','5','pending'], ['NAG-900024','6','pending'],
    ...[...pendingManuscriptsByChapter].flatMap(([chapter,tags])=>
      tags.map(tag=>['NAG-'+tag,chapter,'pending',true])),
  ]) {
    const route=project+'chapters/'+chapter+'/';
    const [url,anchor]=routes.tags[tag].split('#');
    assert.equal(url,local(route),tag);
    const body=await read(route+'index.html');
    assert.equal(body.split('id="'+anchor+'"').length,2,tag);
    const row=body.split('data-statement-bookmark="'+anchor+'" tabindex="-1"');
    assert.equal(row.length,2,tag);
    assert.ok(row[0].slice(row[0].lastIndexOf('<p')).includes('class="book-result-link early-status-bookmark"'),tag);
    const status=state==='open' ? 'Open proof obligation' : 'Proof review pending';
    assert.ok(row[1].split('</p>')[0].includes(status+'</small>'),tag);
    const entry=await read('/r/'+tag+'/index.html');
    assert.ok(entry.includes('data-closure="'+state+'"'),tag);
    assert.equal(/id="foundations-exact-proof"/.test(entry),hasArgument,tag);
    assert.equal(/href="#foundations-exact-proof"/.test(entry),hasArgument,tag);
  }
});

test('Early sealed statements show their own printed reference captions', {skip:!update}, async () => {
  const statement = html => html.split('id="tag-statement"')[1].split('</section>')[0];
  for (const [id,chapter,key,destination,caption] of [
    ['NAG-001981',3,'fnd:doublelaurentaffinoidgluing','theorem.2.45.2','2.45.2'],
    ['NAG-002405',5,'v037:integration:momenttests','theorem.5.46.4','5.46.4'],
    ['NAG-002463',5,'v038:degree:genericcoefficientcondition','equation.5.56.1','(5.56.1)'],
    ['NAG-002465',5,'v038:degree:propergenericprojection','theorem.5.56.7','5.56.7'],
  ]) {
    const href=local(selected+'reader-en.pdf#nameddest='+destination);
    const raw='href="'+href+'">['+key+']</a>';
    const printed='href="'+href+'">'+caption+'</a>';
    const tag=statement(await read('/r/'+id+'/index.html'));
    const old=statement(await read(selected+'r/'+id+'/index.html'));
    const page=await read(project+'chapters/'+chapter+'/index.html');
    const book=page.split('id="result-'+id+'"')[1].split('id="result-'+id+'-proof"')[0];
    assert.ok(tag.includes(printed) && book.includes(printed),id);
    assert.ok(!tag.includes(raw) && !book.includes(raw),id);
    assert.ok(old.includes(raw),id);
  }
});

test('Early proof pages restore named Stacks citations from their own TeX', {skip:!update}, async () => {
  const cases=[['NAG-001795',5],['NAG-001796',5],['NAG-002012',1]];
  const chapter=await read(project+'chapters/2/index.html');
  for (const [id,count] of cases) {
    const tag=await read('/r/'+id+'/index.html');
    const archive=await read(selected+'r/'+id+'/index.html');
    const chapterProof=chapter.split('id="result-'+id+'-proof"')[1].split('</details>')[0];
    const citations=[...updated(id).proof.tex.matchAll(/\\cite\[(Tag ([A-Z0-9]{4})[^\]]*)\]\{StacksAlg\}/g)];
    assert.equal(citations.length,count,id);
    for (const [,caption,stack] of citations) {
      const link='href="https://stacks.math.columbia.edu/tag/'+stack+'">[StacksAlg, '+caption+']</a>';
      assert.ok(tag.includes(link) && chapterProof.includes(link),id);
      assert.ok(!archive.includes(link),id);
    }
  }
});

test('Wide early sealed displays have the same keyboard-scroll treatment as native equations', {skip:!update}, async () => {
  const marker='<span class="math display" tabindex="0"><math display="block"';
  for (const [id,chapter] of [['NAG-001962',3],['NAG-001981',3],['NAG-002405',5],['NAG-002462',5],['NAG-002463',5]]) {
    const tag=await read('/r/'+id+'/index.html');
    const archive=await read(selected+'r/'+id+'/index.html');
    const page=await read(project+'chapters/'+chapter+'/index.html');
    const book=page.split('id="result-'+id+'"')[1].split('</section>')[0];
    assert.ok(tag.includes(marker) && book.includes(marker),id);
    assert.ok(!archive.includes(marker),id);
  }
  const scoped=await read('/r/NAG-002405/index.html');
  const selectedScope=scoped.split('id="scope-CLAUSE_3ANAG-002405_3Afinite_cell_functional"')[1];
  assert.ok(selectedScope?.split('</section>')[0].includes(marker));
});

test('The early normality corollary links its preceding theorem’s exact hypotheses', {skip:!update}, async () => {
  const prior='NAG-001795';
  const id='NAG-001796';
  const route=local('/r/'+prior+'/#tag-statement');
  const reference='href="'+route+'">preceding theorem</a>';
  const current=await read('/r/'+id+'/index.html');
  const fixedCopy=await read(selected+'r/'+id+'/index.html');
  const chapter=await read(project+'chapters/2/index.html');
  assert.ok(current.includes(reference));
  assert.ok(chapter.split('id="result-'+id+'"')[1].split('</section>')[0].includes(reference));
  assert.ok(!fixedCopy.includes(reference));
  const theorem=await read('/r/'+prior+'/index.html');
  const statement=theorem.split('id="tag-statement"')[1].split('</section>')[0];
  assert.match(statement,/good analytic spaces over any complete/);
  assert.match(statement,/quasi-smooth at/);
  assert.match(theorem,/data-closure="closed"/);
});

test('Matched historical early bookmarks identify their actual current proof paragraphs', {skip:!update}, async () => {
  const page=await read('/r/NAG-002463/index.html');
  const frozen=await read(selected+'r/NAG-002463/index.html');
  const proof=page.split('id="foundations-exact-proof"')[1].split('</section>')[0];
  const retained='<span id="proof-paragraph-1"></span>';
  assert.equal(page.split(retained).length,2);
  assert.match(proof.split(retained)[1]?.slice(0,20) ?? '',/^Fix\s/);
  assert.ok(!proof.includes('id="proof-paragraph-2"'));
  assert.equal(page.split('id="proof-paragraph-2"').length,2);
  assert.ok(!frozen.split('id="foundations-exact-proof"')[1].split('</section>')[0].includes(retained));
  const retired=await read('/r/NAG-002463/logic/index.html');
  assert.match(retired,/data-proof-bookmark="foundations-exact-proof proof-paragraph-1 proof-paragraph-5 proof-paragraph-6"/);
  const laurent=await read('/r/NAG-001981/index.html');
  assert.match(laurent,/<span id="proof-paragraph-2"><\/span><em>Step 1/);
});

test('The Chapter 10 signed-measure citation lands with its accepted statement status', {skip:!update}, async () => {
  const id='NAG-002970';
  const route=project+'chapters/8/';
  const anchor='label-70726f703a6d656173757265';
  const caller=await read(project+'chapters/10/index.html');
  const chapter=await read(route+'index.html');
  const canonical=await read('/r/'+id+'/index.html');
  assert.ok(caller.includes('href="'+local(route+'#'+anchor)+'">'+id+'</a>'));
  assert.equal(chapter.split('id="'+anchor+'"').length,2);
  const row=chapter.split('data-statement-bookmark="'+anchor+'" tabindex="-1"');
  assert.equal(row.length,2);
  const marker=row[1].split('</p>')[0];
  assert.ok(marker.includes('href="'+local('/r/'+id+'/')+'">'+id+'</a>'));
  assert.match(marker,/Closed at the accepted scope/);
  assert.ok(chapter.includes('id="manuscript-proof-e2d47ebe8113"'));
  assert.ok(chapter.includes('href="'+local('/r/'+id+'/#foundations-exact-proof')+'"'));
  assert.ok(canonical.includes('href="'+local(route+'#'+anchor)+'">Read in chapter</a>'));
  assert.match(canonical,/data-closure="closed"/);
});

test('Signed-measure equation numbers label their original formulas on both active readers', {skip:!update}, async () => {
  const route=project+'chapters/8/';
  const tag='/r/NAG-002970/';
  for (const reader of [route,tag]) {
    const page=await read(reader+'index.html');
    for (const [number,sourceLabel] of [['8.4.1','eq:measure'],['8.4.2','eq:bound']]) {
      const fragment='label-'+Buffer.from(sourceLabel).toString('hex');
      const anchor='<span id="'+fragment+'"></span>';
      const caption='<span class="book-note equation-number"><a href="'+
        local(selected+'reader-en.pdf#nameddest=equation.'+number)+'">('+number+')</a></span>';
      assert.equal(page.split(anchor).length,2,reader+sourceLabel);
      assert.equal(page.split(caption).length,2,reader+number);
      const formula=page.split(anchor)[1].split(caption)[0];
      assert.match(formula,/^\s*<span class="book-equation">/);
      assert.equal(formula.split('encoding="application/x-tex"').length,2);
    }
    assert.ok(page.includes('href="'+local(route+'#label-65713a6d656173757265')+'">(8.4.1)</a>'));
  }
});

test('Chapter 8 offers the exact expanded pending argument under its existing Tag', {skip:!update}, async () => {
  const id='NAG-900054';
  const tag=await read('/r/'+id+'/index.html');
  const chapter=await read(project+'chapters/8/index.html');
  const proof='<section class="tag-argument" id="foundations-exact-proof" aria-label="Argument in the manuscript">';
  assert.match(tag,/data-closure="pending"/);
  assert.ok(tag.includes('href="#foundations-exact-proof">Argument in the manuscript</a>'));
  assert.ok(tag.includes('Proof awaiting review'));
  assert.ok(tag.includes('href="'+local(project+'chapters/8/#coverage-statement-57')+'">Read in chapter</a>'));
  const body=tag.split(proof)[1]?.split('</section>')[0] ?? '';
  assert.match(body,/We give the proof first for/);
  for (const title of ['The native bulk comparison under free extension','Coherent coefficients and finite cuts',
    'Compact Radon representation within the ordinary calculus','Ordinary localization and the closed-cut formula']) {
    assert.ok(body.includes(title),title);
  }
  assert.match(body,/the native Lagerberg involution/);
  assert.doesNotMatch(body,/A uniform scalar bound from the fixed moment image/);
  const marker=chapter.split('aria-label="Tag links for this proof">').find(block=>block.startsWith(
    '<a href="'+local('/r/'+id+'/#foundations-exact-proof')+'">'+id+'</a>'));
  assert.match(marker?.slice(0,270) ?? '',/Proof review pending[\s\S]*We give the proof first/);
  assert.ok(chapter.includes('id="f7candidate:fixed-image-bound"'));
  for (const inline of ['NAG-900037','NAG-900043']) {
    const note=await read('/r/'+inline+'/index.html');
    assert.match(note,/data-closure="pending"/);
    assert.doesNotMatch(note,/href="#foundations-exact-proof"/);
  }
});

test('Chapter 13 fixed-test corollary retains its limitation and exact pending precedent', {skip:!update}, async () => {
  const corollary=await read('/r/NAG-900268/index.html');
  const chapter=await read(project+'chapters/13/index.html');
  const ref='href="'+local('/r/NAG-900267/')+'">preceding theorem</a>';
  const statement=corollary.split('id="tag-statement"')[1]?.split('</aside>')[0] ?? '';
  assert.match(corollary,/data-closure="pending"/);
  assert.ok(chapter.includes(ref));
  assert.ok(statement.includes(ref));
  assert.match(statement,/gives no total-variation convergence/);
  assert.match(statement,/alone give a numerical rate for the background error/);
  assert.doesNotMatch(corollary,/href="#foundations-exact-proof"/);
  const preceding=await read('/r/NAG-900267/index.html');
  assert.match(preceding,/data-closure="pending"/);
  assert.ok(preceding.includes('href="#foundations-exact-proof">Argument in the manuscript</a>'));
});

test('Chapter 7–14 direct statement bookmarks reveal their unchanged status', {skip:!update}, async () => {
  for (const [chapter,id,label,status] of [
    [7,'NAG-900035','prop:algebra','Proof review pending'],
    [8,'NAG-002472','f8cont:def:stages','Definition · proof status does not apply'],
    [8,'NAG-002476','f8cont:tangential','Closed at the accepted scope'],
    [8,'NAG-900055','thm:geoinputs','Open proof obligation'],
    [10,'NAG-900094','new:intervalcorner','Proof review pending'],
    [11,'NAG-900102','prop:fnd-uniform-psh','Proof review pending'],
    [13,'NAG-900268','new:bounded_family_continuity','Proof review pending'],
  ]) {
    const reader=await read(project+'chapters/'+chapter+'/index.html');
    const target='label-'+Buffer.from(label).toString('hex');
    const bookmark='class="book-result-link midchapter-status-bookmark" data-statement-bookmark="'+target+'" tabindex="-1"';
    const row=reader.split(bookmark)[1]?.split('</p>')[0] ?? '';
    assert.equal(reader.split('id="'+target+'"').length,2,id);
    assert.ok(row.includes('href="'+local('/r/'+id+'/')+'">'+id+'</a>'),id);
    assert.ok(row.includes(status),id);
  }
  const chapter11=await read(project+'chapters/11/index.html');
  const notice='label-72656d3a666e642d7073682d636f6e7665727365';
  assert.ok(chapter11.includes('id="'+notice+'"'));
  assert.ok(!chapter11.includes('data-statement-bookmark="'+notice+'"'));
  const chapter7=await read(project+'chapters/7/index.html');
  const pendingLink='<a href="'+local('/r/NAG-900035/#foundations-exact-proof')+'">NAG-900035</a>';
  assert.ok(chapter7.includes(pendingLink+' <small class="book-tag-status">Proof review pending</small>'));
});

test('Chapter 7–14 Tags retain the source context that sets their exact scope', {skip:!update}, async () => {
  for (const [id,words] of [
    ['NAG-900041','fixed form dominating every symmetric coefficient matrix'],
    ['NAG-900044','Order the exterior coordinates'],
    ['NAG-900048','be open and star-shaped about'],
    ['NAG-900049','Only the primed slots are scaled in this formula.'],
    ['NAG-900051','are restrictions of smooth ambient superforms'],
    ['NAG-900251','even nonnegative function'],
    ['NAG-900252','be represented on a common refinement of their charts'],
    ['NAG-900266','The Euclidean estimate below is not asserted on an arbitrary analytic space'],
    ['NAG-900267','The Euclidean estimate below is not asserted on an arbitrary analytic space'],
    ['NAG-900278','parameterized by lattice length'],
    ['NAG-900279','analytic theory admits a smaller harmonic class'],
    ['NAG-900281','paracompact real affine manifold'],
  ]) {
    const page=await read('/r/'+id+'/index.html');
    const state=id==='NAG-900048' ? 'definition' : 'pending';
    assert.ok(page.includes('data-closure="'+state+'"'),id);
    assert.ok(page.split('id="tag-statement"')[1].split('id="closure"')[0].includes(words),id);
  }
  for (const [id,chapter,label,href] of [
    ['NAG-900077',9,'Under these hypotheses','/r/NAG-900076/'],
    ['NAG-900182',11,'as above',project+'chapters/11/#v19:missing_factor'],
  ]) {
    const link='href="'+local(href)+'">'+label+'</a>';
    for (const route of ['/r/'+id+'/',project+'chapters/'+chapter+'/']) {
      const page=await read(route+'index.html');
      assert.equal(page.split(link).length,2,id+route);
    }
  }
  const corollary=await read('/r/NAG-900243/index.html');
  const antecedent=await read('/r/NAG-900242/index.html');
  assert.match(corollary,/data-closure="pending"/);
  assert.match(antecedent,/data-closure="open"/);
  assert.ok(corollary.includes('href="'+local(project+'chapters/11/#label-7632353a7265706c6163656d656e74')+'">11.23.2</a>'));
  assert.doesNotMatch(antecedent,/href="#foundations-exact-proof"/);
});

test('Chapter 7–14 open proof notes link their exact bibliography entries without changing dispositions', {skip:!update}, async () => {
  const appendix=project+'chapters/appendix-a/';
  const bibliography=await read(appendix+'index.html');
  for (const [chapter,id,reference] of [
    [8,'NAG-900055','Gubler16'],[9,'NAG-900067','GJR'],
    [11,'NAG-900142','BE21'],[13,'NAG-900257','CLD12'],[13,'NAG-900259','CLD25'],
  ]) {
    const book=await read(project+'chapters/'+chapter+'/index.html');
    const tag=await read('/r/'+id+'/index.html');
    const cite='href="'+local(appendix+'#ref-'+reference)+'">'+reference+'</a>';
    assert.equal(bibliography.split('id="ref-'+reference+'"').length,2,reference);
    assert.ok(book.includes(cite),id);
    assert.ok(tag.split('id="closure"')[1].split('</aside>')[0].includes(cite),id);
    assert.match(tag,/data-closure="open"/);
    assert.doesNotMatch(tag,/href="#foundations-exact-proof"/);
  }
  const explanatory=await read('/r/NAG-900259/index.html');
  assert.match(explanatory,/recursion is explanatory here and its citation does not discharge either open native premise/);
});

test('Chapter 8 preserves its printed subsection and pending theorem numbers', {skip:!update}, async () => {
  const chapterRoute=project+'chapters/8/';
  const chapter=await read(chapterRoute+'index.html');
  const {destinations}=JSON.parse(await read(project+'reader/tags.json'));
  for (const [number,id,title] of [
    ['8.4.1','compatibility-of-integral-presentations','Compatibility of integral presentations'],
    ['8.4.2','the-construction-in-three-steps','The construction in three steps'],
    ['8.4.3','stokes-on-the-analytic-space','Stokes on the analytic space'],
    ['8.4.4','f7native:ordinary-coherent-boundary','The signed boundary measure for ordinary native forms'],
    ['8.4.5','a-green-identity-and-its-use','A Green identity and its use'],
    ['8.4.6','the-signed-measure-of-an-ordinary-top-form','The signed measure of an ordinary top form'],
    ['8.15.1','independence-of-the-analytic-integral','Independence of the analytic integral'],
    ['8.15.2','ordinary-presentation-topologies-on-compact-tests','Ordinary presentation topologies on compact tests'],
    ['8.15.3','multiplication-in-chart-and-support-topologies','Multiplication in chart and support topologies'],
    ['8.15.4','estimates-on-bounded-sets-in-final-test-spaces','Estimates on bounded sets in final test spaces'],
  ]) {
    const legacy=number==='8.4.4' ? ' data-numbered-heading' : '';
    assert.ok(chapter.includes('<h3 id="'+id+'"'+legacy+'>'+number+' '+title+'</h3>'),number);
    const destination=destinations['subsection.'+number];
    assert.ok(destination.startsWith(local(chapterRoute)+'#'),number);
    if (number!=='8.4.4') assert.equal(destination,local(chapterRoute)+'#'+id);
    assert.equal(chapter.split('id="'+destination.split('#')[1]+'"').length,2,number);
  }
  assert.ok(chapter.includes('id="f7candidate:fixed-image-bound">A uniform scalar bound from the fixed moment image</h3>'));
  assert.equal(destinations['theorem.8.4.2'],local(chapterRoute)+'#coverage-statement-57');
  const tag=await read('/r/NAG-900054/index.html');
  for (const reader of [tag,chapter]) assert.ok(reader.includes('<strong>Theorem 8.4.2.</strong>'));
  assert.ok(tag.includes('<h1>Theorem 8.4.2</h1>'));
  assert.match(tag,/data-closure="pending"/);
  assert.ok(chapter.includes('id="manuscript-proof-131812a526e3"'));
});

test('Chapter 7–14 printed numbers bind to original headings and exact formulas', {skip:!update}, async () => {
  const binding=JSON.parse(await readFile(new URL('../content/foundations/active-reading-locators-1174.json',import.meta.url),'utf8'));
  const {destinations}=JSON.parse(await read(project+'reader/tags.json'));
  const chapters=new Map();
  const middle=[...binding.subsections,...binding.equations].filter(entry=>/^(?:subsection|equation)\.(?:[7-9]|1[0-4])\./.test(entry.name));
  for (const {name,anchor,precedingRows=[]} of middle) {
    const [kind,chapter,section,item]=name.split('.');
    const route=project+'chapters/'+chapter+'/';
    if (!chapters.has(route)) chapters.set(route,await read(route+'index.html'));
    const html=chapters.get(route);
    const number=[chapter,section,item].join('.');
    const location=destinations[name];
    assert.ok(location?.startsWith(local(route)+'#'),name);
    assert.equal(html.split('id="'+anchor+'"').length,2,name);
    assert.equal(html.split('id="'+location.split('#')[1]+'"').length,2,name);
    if (kind==='subsection') {
      const heading=html.split('<h3 id="'+anchor+'"')[1].split('</h3>')[0];
      assert.ok(heading.startsWith('>'+number+' ') || heading.startsWith(' data-numbered-heading>'+number+' '),name);
    } else {
      assert.equal(location,local(route)+'#'+anchor,name);
      const rows=[...precedingRows,{name,anchor}];
      const order=precedingRows.length ? ' role="group" aria-label="Equation numbers in row order"' : '';
      const links=rows.map(row=>{
        assert.equal(destinations[row.name],local(route)+'#'+row.anchor);
        assert.equal(html.split('id="'+row.anchor+'"').length,2,row.name);
        return '<a href="'+local(selected+'reader-en.pdf#nameddest='+row.name)+'">('+row.name.slice('equation.'.length)+')</a>';
      });
      const caption='<span class="book-note equation-number"'+order+'>'+links.join(', ')+'</span>';
      assert.equal(html.split(caption).length,2,name);
      const passage=html.split('<span id="'+anchor+'"></span>')[1].split(caption)[0];
      assert.match(passage,/^\s*<span class="book-equation">/);
      assert.equal(passage.split('encoding="application/x-tex"').length,2,name);
    }
  }
  const bound=binding.equations.flatMap(item=>[item,...(item.precedingRows ?? [])]).map(item=>item.name);
  for (const withheld of ['equation.10.1.1','equation.10.1.2','equation.11.11.2']) {
    assert.ok(!bound.includes(withheld),withheld);
  }
});

test('Aligned equation rows have separate sealed links on the Chapter and Tag readers', {skip:!update}, async () => {
  for (const [id,chapter,group] of [
    ['NAG-900249','11',['11.24.3','11.24.4']],
    ['NAG-900251','12',['12.1.1','12.1.2','12.1.3']],
  ]) {
    const suffix='aria-label="Equation numbers in row order">';
    for (const route of [project+'chapters/'+chapter+'/','/r/'+id+'/']) {
      const page=await read(route+'index.html');
      const rendered=page.split(suffix);
      assert.equal(rendered.length,2,id+route);
      const caption=rendered[1].split('</span>')[0];
      const numbers=[...caption.matchAll(/<a [^>]*>\(([0-9.]+)\)<\/a>/g)].map(([,n])=>n);
      assert.deepEqual(numbers,group,id+route);
      for (const n of group) assert.ok(caption.includes('href="'+local(selected+'reader-en.pdf#nameddest=equation.'+n)+'"'),n);
    }
  }
});

test('The signed-measure proof links the eight literal inputs at their declared scope', {skip:!update}, async () => {
  const book=await read(project+'chapters/8/index.html');
  const tag=await read('/r/NAG-002970/index.html');
  const sources=[book.split('id="manuscript-proof-e2d47ebe8113"')[1].split('id="iii:infrastructure"')[0],
    tag.split('id="foundations-exact-proof"')[1].split('</section>')[0]];
  for (const proof of sources) {
    const compact=local(fixed+'r/NAG-002428/#compact_partition_only');
    assert.equal(proof.split('href="'+compact+'"').length,4);
    assert.ok(!proof.includes('href="'+local('/r/NAG-002428/')+'"'));
    assert.equal(proof.split('href="'+local('/r/NAG-002427/')+'"').length,3);
    assert.equal(proof.split('href="'+local('/r/NAG-002425/')+'"').length,4);
    assert.ok(proof.includes('downstream'));
    assert.ok(!proof.includes('href="'+local('/r/NAG-002973/')+'"'));
    assert.ok(!proof.includes('href="'+local('/r/NAG-002424/')+'"'));
  }
  assert.match(tag,/data-closure="closed"/);
});

test('The final topology proof distinguishes its accepted compact input from the current source statement', {skip:!update}, async () => {
  const book=await read(project+'chapters/8/index.html');
  const tag=await read('/r/NAG-002473/index.html');
  const scope=local(fixed+'r/NAG-002428/#compact_partition_only');
  const statement=local(project+'chapters/appendix-c/#label-763033373a666f726d733a636f6d70616374706172746974696f6e');
  const chapterMarker=book.split('id="manuscript-proof-e2a71f5a6785"')[1].split('</div>')[0];
  const argument=tag.split('id="foundations-exact-proof"')[1].split('</section>')[0];
  for (const part of [chapterMarker,argument]) {
    assert.equal(part.split('href="'+scope+'">Accepted compact-partition proof</a>').length,2);
  }
  assert.ok(book.includes('href="'+statement+'">Theorem C.1.60</a>'));
  assert.ok(argument.includes('href="'+statement+'">Theorem C.1.60</a>'));
  assert.match(tag,/data-closure="closed"/);
  assert.match(await read('/r/NAG-900497/index.html'),/data-closure="pending"/);
});

test('The Appendix C compact-partition statement has its sealed number and distinct pending argument', {skip:!update}, async () => {
  const route=project+'chapters/appendix-c/';
  const fragment='label-763033373a666f726d733a636f6d70616374706172746974696f6e';
  const chapter=await read(route+'index.html');
  const tag=await read('/r/NAG-900497/index.html');
  const {destinations}=JSON.parse(await read(project+'reader/tags.json'));
  assert.equal(destinations['theorem.C.1.60'],local(route+'#'+fragment));
  assert.equal(chapter.split('id="'+fragment+'"').length,2);
  assert.ok(chapter.includes('data-statement-bookmark="'+fragment+'"'));
  assert.match(chapter,/<strong>Theorem C\.1\.60\.<\/strong>[\s\S]{0,135}id="label-763033373a666f726d733a636f6d70616374706172746974696f6e"/);
  assert.ok(tag.includes('<h1>Theorem C.1.60 · Finite smooth partitions near a compact set</h1>'));
  assert.ok(tag.includes('<strong>Theorem C.1.60.</strong>'));
  assert.match(tag,/data-closure="pending"/);
  assert.ok(tag.includes('href="#foundations-exact-proof">Argument in the manuscript</a>'));
});

test('Accepted Appendix statements recover their printed numbers and both old locations', {skip:!update}, async () => {
  const {tags,destinations}=JSON.parse(await read(project+'reader/tags.json'));
  for (const [id,chapter,kind,number,label,reader] of [
    ['NAG-002610','c','Theorem','C.1.53','cand:f5tame:charactercriterion','foundations.nag-002610.recovered-proof'],
    ['NAG-002648','c','Theorem','C.1.78','cand:f5res:residualidentity','foundations.nag002648.original'],
    ['NAG-003116','c','Proposition','C.1.102','f9sc:signed','foundations.nag003116.original'],
    ['NAG-003210','c','Example','C.1.110','f9be:inseparable','foundations.nag003210.original'],
    ['NAG-003112','i','Theorem','I.2.10','f9sc:refined','foundations.nag-003112.original'],
  ]) {
    const route=project+'chapters/appendix-'+chapter+'/';
    const oldLabel='label-'+Buffer.from(label).toString('hex');
    assert.equal(destinations[kind.toLowerCase()+'.'+number],local(route+'#'+oldLabel));
    assert.equal(tags[id],local(route+'#'+reader));
    const source=await read(route+'index.html');
    assert.equal(source.split('id="'+oldLabel+'"').length,2,id);
    assert.equal(source.split('id="'+reader+'"').length,2,id);
    const status=source.split('data-statement-bookmark="'+oldLabel+'"')[1]?.split('</p>')[0];
    assert.ok(status?.includes('Closed at the accepted scope'),id);
    const published=await read('/r/'+id+'/index.html');
    assert.ok(published.includes('<strong>'+kind+' '+number+'.</strong>'),id);
    assert.match(published,/data-closure="closed"/);
    assert.ok(published.includes('href="#foundations-exact-proof">'+(kind==='Example' ? 'Example' : 'Proof')+'</a>'),id);
  }
});

test('Late direct statement bookmarks show status without moving the source note', {skip:!update}, async () => {
  const {tags}=JSON.parse(await read(project+'reader/tags.json'));
  for (const [id,status] of [
    ['NAG-900338','Open proof obligation'],
    ['NAG-900307','Conditional on stated inputs'],
    ['NAG-900283','Conditional on stated inputs'],
    ['NAG-900321','Proof review pending'],
  ]) {
    const [route,fragment]=tags[id].split('#');
    const chapter=await read(route.slice(base.length)+'index.html');
    const statusRow=chapter.split('data-statement-bookmark="'+fragment+'"')[1]?.split('</p>')[0];
    assert.ok(statusRow?.includes(status),id);
    assert.equal(chapter.split('id="'+fragment+'"').length,2,id);
    assert.ok(chapter.includes('<span id="'+fragment+'" data-late-scope-bookmark></span>'),id);
  }
  const source=await read(project+'chapters/15/index.html');
  assert.match(source,/class="reviewed-proof-passage" id="source-proof-obligation-74"[^>]*><a[^>]*>NAG-900289 · Comparison requirements remain/);
  const tag=await read('/r/NAG-900289/index.html');
  assert.match(tag,/data-closure="comparison"/);
  assert.ok(tag.includes('href="'+local(project+'chapters/15/#source-proof-obligation-74')+'">Read in chapter</a>'));
});

test('Late retired proof and result bookmarks retain only real argument fragments', {skip:!update}, async () => {
  const canonical='/r/NAG-900507/';
  const tag=await read('/r/NAG-900507/index.html');
  const proof=tag.split('id="foundations-exact-proof"')[1]?.split('</section>')[0];
  const expected=['foundations-exact-proof',...Array.from(proof.matchAll(/id="(proof-(?:item|paragraph)-\d+)"/g),match=>match[1])];
  assert.ok(expected.includes('proof-paragraph-1'));
  for (const [path,fragment] of [
    ['proof-tags/p-f0a3a87deeb3/','#foundations-exact-proof'],
    ['results/fnd-5dcfd85d952f/',''],
  ]) {
    const source=await read(project+path+'index.html');
    assert.ok(source.includes('href="'+local(canonical+fragment)+'"'));
    const actual=/data-proof-bookmark="([^"]+)"/.exec(source)?.[1].split(' ');
    assert.deepEqual(actual,expected,path);
    assert.ok(!source.includes('proof-paragraph-9999'));
  }
});

test('Late chapter proof landmarks keep pending, conditional, and example roles distinct', {skip:!update}, async () => {
  for (const [id,status] of [
    ['NAG-900282','Proof review pending'], ['NAG-900469','Proof review pending'],
    ['NAG-900283','Conditional on stated inputs'], ['NAG-900424','Conditional on stated inputs'],
    ['NAG-900506','Proof review pending'],
  ]) {
    const tag=await read('/r/'+id+'/index.html');
    const href=tag.match(/<a href="([^"]+)">Proof in chapter<\/a>/)?.[1];
    assert.ok(href,id);
    const [route,fragment]=href.split('#');
    const chapter=await read(route.slice(base.length)+'index.html');
    const exact='href="'+local('/r/'+id+'/#foundations-exact-proof')+'">'+id+
      '</a> <small class="book-tag-status">'+status+'</small>';
    const marker=chapter.split('id="'+fragment+'"')[1].split('</div>')[0];
    assert.ok(marker.includes(exact),id);
    const sidebar=chapter.split('id="chapter-proofs"')[1].split('</details>')[0];
    assert.ok(sidebar.includes(exact),id);
    assert.ok(tag.includes('aria-label="Argument in the manuscript"'),id);
  }
  for (const id of ['NAG-900323','NAG-900397','NAG-900461','NAG-900411','NAG-900289']) {
    assert.ok(!(await read('/r/'+id+'/index.html')).includes('>Proof in chapter</a>'),id);
  }
});

test('Late conditional Tags preserve their manuscript hypotheses and exact imports', {skip:!update}, async () => {
  for (const [id,phrases,links] of [
    ['NAG-900283',['small generic displacement','multiplication on arbitrary distributional currents'],['GK17']],
    ['NAG-900287',['principal-divisor relations','geometric source of refinement compatibility'],['FS']],
    ['NAG-900289',['matching the calibration','the entire algebras coincide'],['CLD25','GK17']],
    ['NAG-900298',['without analytic boundary','nontrivial-valuation hypotheses','analytic wedge-detection theorem'],[]],
    ['NAG-900299',['a balanced polyhedral pushforward','Additional representation control'],['Mih24']],
    ['NAG-900328',['smooth zero-Hessian','geometric approximants'],[]],
    ['NAG-900411',['nontrivially valued','imported analytic comparison theorem','toric Gauss section'],['GH']],
    ['NAG-900420',['completed algebraic closure','one fixed ground field','Every simplex'],['GubCanonical']],
    ['NAG-900424',['projective integral variety','tropical geometry and arithmetic theorems','mixed reduction'],['GubBogomolov','GubCanonical']],
  ]) {
    const page=await read('/r/'+id+'/index.html');
    assert.match(page,/data-closure="(?:conditional|comparison)"/,id);
    assert.ok(phrases.every(phrase=>page.includes(phrase)),id);
    for (const key of links) {
      assert.ok(page.includes('href="'+local(project+'chapters/appendix-a/#ref-'+key)+'"'),id+' '+key);
    }
  }
  const imported=await read('/r/NAG-900411/index.html');
  const text=imported.split('id="tag-statement"')[1].split('id="closure"')[0];
  assert.match(text,/nontrivially valued/);
  assert.match(text,/real measure is extended by zero/);
  assert.ok(!imported.includes('>Proof in chapter</a>'));
  const premise=await read('/r/NAG-900418/index.html');
  assert.match(premise,/data-closure="open"/);
});

test('Wide late formulas use a focusable local scroll area', {skip:!update}, async () => {
  const chapter=await read(project+'chapters/23/index.html');
  const appendixH=await read(project+'chapters/appendix-h/index.html');
  const appendixI=await read(project+'chapters/appendix-i/index.html');
  const inline='class="book-equation book-inline-equation" role="group" aria-label="Finite-energy reference identity" tabindex="0"';
  assert.ok(chapter.includes(inline+'><span class="katex">'));
  assert.ok(chapter.includes('I(a)+E(a,c)=I(a)+E(a,b)+E(b,c)=I(b)+E(b,c)'));
  assert.ok(appendixI.includes('class="book-equation" role="group" aria-label="Orientation sign formula" tabindex="0"'));
  for (const [id,source] of [['NAG-002976',appendixH],['NAG-002973',appendixI]]) {
    const statement=source.split('id="result-'+id+'"')[1]?.split('<details class="proof"')[0];
    assert.ok(statement?.includes('class="math display" tabindex="0"><math display="block"'),id);
    const active=await read('/r/'+id+'/index.html');
    const archived=await read(selected+'r/'+id+'/index.html');
    assert.ok(active.includes('class="math display" tabindex="0"><math display="block"'),id);
    assert.ok(!archived.includes('class="math display" tabindex="0"><math display="block"'),id);
  }
});

test('Appendix C.2 retains its section and source aliases and printed standalone numbers', {skip:!update}, async () => {
  const manifest=JSON.parse(await readFile(new URL('../content/foundations/active-reading-locators-1174.json',import.meta.url),'utf8'));
  const {tags,destinations}=JSON.parse(await read(project+'reader/tags.json'));
  const route=project+'chapters/appendix-c/';
  const chapter=await read(route+'index.html');
  assert.equal(destinations['section.C.2'],local(route+'#label-6763693a73656374696f6e'));
  assert.ok(chapter.includes('<h2 id="gci:section" data-numbered-heading>C.2 The exact whole-fibre boundary and capture condition</h2>'));
  assert.ok(chapter.includes('href="#gci:section">C.2 · The exact whole-fibre boundary and capture condition</a>'));
  for (const entry of ['contents/','reader/']) {
    const contents=await read(project+entry+'index.html');
    assert.ok(contents.includes('href="'+local(route+'#gci:section')+'">C.2 · The exact whole-fibre boundary and capture condition</a>'),entry);
  }
  assert.ok(tags['NAG-001886'].startsWith(local(project+'chapters/3/#')));
  const printedC2=manifest.appendixStatements.filter(entry=>!entry.chapter);
  assert.equal(printedC2.length,18);
  for (const {id,kind,number,label,anchor,destination} of printedC2) {
    const typed=kind.toLowerCase()+'.'+number;
    const labelAnchor=label ? 'label-'+Buffer.from(label).toString('hex') : anchor;
    assert.equal(destinations[typed],local(route+'#'+labelAnchor),typed);
    assert.equal(chapter.split('id="'+labelAnchor+'"').length,2,typed);
    assert.ok(chapter.includes('<strong>'+kind+' '+number+'.</strong>'),typed);
    if (!id) continue;
    assert.equal(tags[id],local(route+'#'+destination),id);
    const tag=await read('/r/'+id+'/index.html');
    assert.match(tag,/data-closure="closed"/,id);
    assert.ok(tag.includes('<strong>'+kind+' '+number+'.</strong>'),id);
  }
});

test('Accepted late Appendix citations land on their independently numbered native statements', {skip:!update}, async () => {
  const manifest=JSON.parse(await readFile(new URL('../content/foundations/active-reading-locators-1174.json',import.meta.url),'utf8'));
  const {tags,destinations}=JSON.parse(await read(project+'reader/tags.json'));
  const restored=manifest.appendixStatements.filter(entry=>entry.chapter && entry.destination);
  assert.equal(restored.length,94);
  const chapters=new Map();
  for (const {id,kind,number,label,destination} of restored) {
    const route=project+'chapters/appendix-'+number[0].toLowerCase()+'/';
    const raw='label-'+Buffer.from(label).toString('hex');
    assert.equal(destinations[kind.toLowerCase()+'.'+number],local(route+'#'+raw),id);
    assert.equal(tags[id],local(route+'#'+destination),id);
    if (!chapters.has(route)) chapters.set(route,await read(route+'index.html'));
    const page=chapters.get(route);
    assert.equal(page.split('id="'+raw+'"').length,2,id);
    assert.ok(page.includes('<strong>'+kind+' '+number+'.</strong>'),id);
    const tag=await read('/r/'+id+'/index.html');
    assert.match(tag,/data-closure="closed"/,id);
    assert.ok(tag.includes('<strong>'+kind+' '+number+'.</strong>'),id);
    assert.ok(tag.includes('>Proof in chapter</a>'),id);
  }
  const absolute=await read('/r/NAG-002976/index.html');
  assert.ok(!absolute.includes('<strong>Proposition H.0.5.</strong>'));
  const f=chapters.get(project+'chapters/appendix-f/');
  assert.doesNotMatch(f,/lem:finiteflatlem:avoid|component-supportlem:avoid|regular-quotient-representativeslem:avoid/);
  assert.ok(f.includes('Proposition F.1.14.'));
});

test('Verified printed Appendix names are searchable without changing their states', {skip:!update}, async () => {
  const manifest=JSON.parse(await readFile(new URL('../content/foundations/active-reading-locators-1174.json',import.meta.url),'utf8'));
  const index=JSON.parse(await read('/search-index.json'));
  const rows=new Map(index.filter(row=>row.project==='foundations').map(row=>[row.id,row]));
  const pending=new Set(['NAG-900499','NAG-900500','NAG-900501']);
  const printed=manifest.appendixStatements.filter(entry=>entry.id).map(({id,kind,number})=>
    [id,kind+' '+number,pending.has(id) ? 'Proof review pending' : 'Accepted whole']);
  printed.push(
    ['NAG-002610','Theorem C.1.53','Accepted whole'],
    ['NAG-002648','Theorem C.1.78','Accepted whole'],
    ['NAG-003116','Proposition C.1.102','Accepted whole'],
    ['NAG-003210','Example C.1.110','Accepted whole'],
    ['NAG-003112','Theorem I.2.10','Accepted whole'],
    ['NAG-900497','Theorem C.1.60','Proof review pending'],
  );
  assert.equal(printed.length,117);
  for (const [id,caption,status] of printed) {
    const row=rows.get(id);
    assert.equal(row.link,local('/r/'+id+'/'),id);
    assert.equal(row.coverage,status,id);
    assert.deepEqual(row.keywords.filter(keyword=>keyword===caption),[caption],id);
  }
});

test('The three supplied model displays use their author destinations and printed captions', {skip:!update}, async () => {
  const {destinations}=JSON.parse(await read(project+'reader/tags.json'));
  const route=project+'chapters/appendix-i/';
  const chapter=await read(route+'index.html');
  for (const [result,caption] of [['003147','22'],['003148','23'],['003148','24']]) {
    const destination='foundations.nag'+result+'.formula.'+caption;
    assert.equal(destinations[destination],local(route+'#'+destination));
    const formula=chapter.split('id="'+destination+'"')[1]?.split('class="book-note equation-number"')[1]?.split('</span>')[0];
    assert.ok(formula?.includes('href="'+local(selected+'reader-en.pdf#nameddest='+destination)+'">('+caption+')</a>'));
  }
  assert.equal(destinations['equation.I.0.24'],
    local(route+'#label-666e643a6e61673030323939303a737570706c6965642d7363616c61722d706c'));
});

test('Late numbered headings use exact source landmarks and retain prior aliases', {skip:!update}, async () => {
  const manifest=JSON.parse(await readFile(new URL('../content/foundations/active-reading-locators-1174.json',import.meta.url),'utf8'));
  const late=entry=>/^(?:section|subsection)\.(?:1[5-9]|2[0-4]|[A-I])\./.test(entry.name);
  const {destinations}=JSON.parse(await read(project+'reader/tags.json'));
  const headings=[...manifest.sections,...manifest.subsections.filter(late)];
  assert.equal(headings.length,212);
  const pages=new Map();
  for (const {name,anchor} of headings) {
    const [,part,number]=name.match(/^(section|subsection)\.(.*)$/);
    const [chapter]=number.split('.');
    const slug=/^[A-I]$/.test(chapter) ? 'appendix-'+chapter.toLowerCase() : chapter;
    const route=project+'chapters/'+slug+'/';
    if (!pages.has(route)) pages.set(route,await read(route+'index.html'));
    const page=pages.get(route);
    const level=part==='section' ? 2 : 3;
    assert.ok(page.includes('<h'+level+' id="'+anchor+'">'+number+' ') ||
      page.includes('<h'+level+' id="'+anchor+'" data-numbered-heading>'+number+' '),name);
    const destination=destinations[name];
    assert.ok(destination.startsWith(local(route)+'#'),name);
    assert.equal(page.split('id="'+destination.split('#')[1]+'"').length,2,name);
  }
  assert.notEqual(destinations['subsection.20.1.3'],destinations['subsection.20.6.1']);
});

test('Appendix H and I keep exact sealed citation targets and display printed captions', {skip:!update}, async () => {
  const manifest=JSON.parse(await readFile(new URL('../content/foundations/active-reading-locators-1174.json',import.meta.url),'utf8'));
  assert.equal(manifest.appendixCitations.length,157);
  const pdf=local(selected+'reader-en.pdf#nameddest=');
  const h=await read(project+'chapters/appendix-h/index.html');
  const i=await read(project+'chapters/appendix-i/index.html');
  assert.ok(h.includes('href="'+pdf+'proposition.8.4.4">NAG-002970</a>'));
  assert.ok(h.includes('href="'+pdf+'equation.I.2.31">(I.2.31)</a>'));
  assert.ok(i.includes('href="'+pdf+'nag.scope.002893.productchart">I.2.31</a>'));
  assert.ok(i.includes('href="'+pdf+'AMS.417">(B1)</a>'));
  const product=await read('/r/NAG-002893/index.html');
  const scope=product.split('id="scope-CLAUSE_3ANAG-002893_3Aweighted_product_chart_and_lateral_vanishing-proof"')[1]?.split('</section>')[0];
  assert.ok(scope?.includes('href="'+pdf+'foundations.nag-002500.original">I.2.29</a>'));
  assert.ok(scope.includes('href="'+pdf+'equation.I.1.4">(I.1.4)</a>'));
  const active=await read('/r/NAG-002651/index.html');
  const frozen=await read(selected+'r/NAG-002651/index.html');
  const stacks='href="https://stacks.math.columbia.edu/tag/00JB">[StacksAlg, Tag 00JB]</a>';
  assert.ok(i.includes(stacks) && active.includes(stacks));
  assert.ok(!frozen.includes(stacks));
});

test('Late display captions retain exact manuscript and PDF row destinations', {skip:!update}, async () => {
  const binding=JSON.parse(await readFile(new URL('../content/foundations/active-reading-locators-1174.json',import.meta.url),'utf8'));
  const late=binding.equations.filter(e=>/^equation\.(?:1[5-9]|2[0-4]|[A-I])\./.test(e.name));
  const {destinations}=JSON.parse(await read(project+'reader/tags.json'));
  assert.equal(late.length,243);
  assert.equal(late.reduce((count,e)=>count+(e.precedingRows?.length??0),0),8);
  const pages=new Map();
  for (const entry of late) {
    const [route,fragment]=destinations[entry.name].split('#');
    assert.equal(fragment,entry.anchor);
    if (!pages.has(route)) pages.set(route,await read(route.slice(base.length)+'index.html'));
    const page=pages.get(route);
    const rows=[...(entry.precedingRows??[]),entry];
    const html=page.split('id="'+entry.anchor+'"')[1]?.split('class="book-note equation-number"')[1]?.split('</span>')[0];
    assert.ok(html,entry.name);
    for (const row of rows) {
      assert.ok(html.includes('href="'+local(selected+'reader-en.pdf#nameddest='+row.name)+'"'),row.name);
      assert.ok(html.includes('>('+row.name.slice('equation.'.length)+')</a>'),row.name);
    }
    if (rows.length>1) assert.ok(html.includes('aria-label="Equation numbers in row order"'),entry.name);
  }
  for (const excluded of ['equation.19.18.8','equation.I.0.24']) {
    assert.ok(!late.some(entry=>entry.name===excluded || entry.precedingRows?.some(row=>row.name===excluded)));
  }
  const tensor=await read('/r/NAG-900506/index.html');
  assert.ok(tensor.includes('href="'+local(selected+'reader-en.pdf#nameddest=equation.G.0.7')+'">(G.0.7)</a>'));
  assert.match(tensor,/data-closure="pending"/);
});

test('Inherited arguments keep their fixed-edition proof and original source access', {skip:!update}, async () => {
  const binding=JSON.parse(await readFile(new URL('../content/foundations/active-reading-locators-1174.json',import.meta.url),'utf8'));
  assert.equal(binding.inheritedProofs.length,9);
  for (const {id,reader} of binding.inheritedProofs) {
    const tag=await read('/r/'+id+'/index.html');
    assert.match(tag,/data-closure="closed"/);
    const proof=tag.split('id="foundations-exact-proof"')[1]?.split('</section>')[0];
    assert.ok(proof?.includes('<h2>Proof</h2>'),id);
    assert.ok(proof.includes('id="proof-paragraph-1"'),id);
    const archive=fixed+'r/'+id+'/#foundations-exact-proof';
    assert.ok(proof.includes('href="'+local(archive)+'">Selected proof in the fixed edition</a>'),id);
    assert.ok(tag.includes('href="'+local(selected+'reader-en.pdf#nameddest='+reader.destination)+'"'),id);
    assert.ok(tag.includes('>Proof in chapter</a>'),id);
  }
  const stokes=await read('/r/NAG-002577/index.html');
  assert.ok(stokes.includes('compact-collar zero extension'));
  const stokesProof=stokes.split('id="foundations-exact-proof"')[1].split('</section>')[0];
  assert.ok(stokesProof.includes('Proof of Theorem') && stokesProof.includes('exact frozen sign'));
  assert.ok(!stokesProof.includes('Minimal evaluation kernels'));
  const cartier=await read('/r/NAG-002541/index.html');
  assert.ok(cartier.includes('<strong>Direct inputs</strong>'));
  assert.doesNotMatch(cartier,/9DSFollowerInputs/);
  const scalar=await read('/r/NAG-002990/index.html');
  assert.ok(scalar.includes('R-SPL (supplied hypothesis)') && scalar.includes('R-ZP (supplied hypothesis)'));
  assert.ok(scalar.includes('No component reduction'));
  const dvr=await read('/r/NAG-003111/index.html');
  assert.ok(dvr.includes('href="https://stacks.math.columbia.edu/tag/00PD"'));
});

test('Appendix passages and examples retain their full reasoning without a separate proof', {skip:!update}, async () => {
  for (const [id,label,phrases] of [
    ['NAG-002856','Passage',['Interior on the actual charts.','For the second formula','ordinary interior']],
    ['NAG-003210','Example',['Example C.1.110.','For the supported-cycle computation','full input cycle']],
  ]) {
    const page=await read('/r/'+id+'/index.html');
    const statement=page.split('id="tag-statement"')[1].split('id="closure"')[0];
    const archive=local(fixed+'r/'+id+'/#foundations-exact-proof');
    assert.match(page,/data-closure="closed"/);
    assert.ok(phrases.every(phrase=>statement.includes(phrase)),id);
    assert.ok(page.includes('href="#foundations-exact-proof">'+label+'</a>'),id);
    assert.ok(statement.includes('id="foundations-exact-proof"'),id);
    assert.ok(page.includes('<a href="'+archive+'">Selected '+label.toLowerCase()+' in the fixed edition</a>'),id);
    assert.ok(!page.includes('>Proof in chapter</a>'),id);
    assert.ok(!statement.includes('A criterion for an affinoid containing the whole interior fibre'),id);
  }
});

test('The Appendix G coherent tensor argument follows its direct inputs and keeps its status', {skip:!update}, async () => {
  const chapter=await read(project+'chapters/appendix-g/index.html');
  const pending=await read('/r/NAG-900506/index.html');
  const previous=await read(project+'proof-tags/p-1eb9271443c0/index.html');
  const scope=local(fixed+'r/NAG-002525/#coherent_tensor_projection');
  const statement=pending.split('id="tag-statement"')[1].split('id="closure"')[0];
  const proof=pending.split('id="foundations-exact-proof"')[1].split('</section>')[0];
  assert.ok(statement.includes('<strong>Direct inputs</strong>'));
  assert.match(pending,/data-closure="pending"/);
  assert.match(proof,/Argument in the manuscript/);
  assert.ok(proof.includes('asserts no exactness for tensoring'));
  assert.ok(proof.includes('href="'+scope+'"'));
  for (const id of ['NAG-001565','NAG-001624','NAG-001702','NAG-001752']) {
    assert.ok(statement.includes('href="'+local('/r/'+id+'/')+'"'));
  }
  const marker=chapter.split('id="manuscript-proof-1eb9271443c0"')[1].split('</div>')[0];
  assert.ok(marker.includes('Proof review pending'));
  assert.ok(marker.includes('href="'+scope+'"'));
  assert.ok(previous.includes('href="'+local('/r/NAG-900506/#foundations-exact-proof')+'"'));
  assert.ok(previous.includes('data-proof-bookmark="foundations-exact-proof proof-paragraph-1'));
  const formerResult=await read(project+'results/fnd-7196ab6e460e/index.html');
  assert.ok(formerResult.includes('href="'+local('/r/NAG-900506/')+'"'));
  assert.ok(formerResult.includes('data-proof-bookmark="foundations-exact-proof proof-paragraph-1'));
});

test('Late pending sources distinguish illustration, derived result and imported calibration', {skip:!update}, async () => {
  const statements=[
    ['17','NAG-900323','label-6e65773a66696e6974655f726573696475655f706963617264','every point of its Jacobian is torsion',false],
    ['20','NAG-900397','label-6e65773a766572746963616c5f686f6467655f696e646578','split regular reduced-fibre hypotheses',false],
    ['23','NAG-900461','label-6e65773a7363616c6172696e76617269616e6365','calibration theorem is imported here',false],
    ['appendix-g','NAG-900506','label-636c617573653a6e61673030323532353a636f686572656e745f74656e736f725f70726f6a656374696f6e','Direct inputs',true],
  ];
  const tags=new Map();
  for (const [slug,id,anchor,words,hasArgument] of statements) {
    const page=await read('/r/'+id+'/index.html');
    const chapter=await read(project+'chapters/'+slug+'/index.html');
    assert.match(page,/data-closure="pending"/);
    assert.equal(page.includes('id="foundations-exact-proof"'),hasArgument,id);
    assert.ok(chapter.includes('data-statement-bookmark="'+anchor+'"'),id);
    const statement=page.split('id="tag-statement"')[1].split('id="closure"')[0];
    assert.ok(statement.includes(words),id);
    tags.set(id,statement);
  }
  assert.ok(tags.get('NAG-900397').includes('finite connected compact metric graph'));
  assert.ok(tags.get('NAG-900397').includes('href="'+local('/r/NAG-900396/')+'">The vertical divisor calculation</a>'));
  const scalar=tags.get('NAG-900461');
  assert.ok(scalar.includes('href="'+local(project+'chapters/appendix-a/#ref-CLD25')+'">CLD25</a>'));
  assert.ok(scalar.includes('over the same field'));
});

test('The inherited Chapter 8 Tags include the original context for the stated topology', {skip:!update}, async () => {
  const cases=[
    ['NAG-002472','definition',['All supports in this note are ordinary compact supports','Both definitions refer to ordinary sections']],
    ['NAG-002473','closed',['All supports in this note are ordinary compact supports','compatibility solely on a finite closed affinoid cover']],
    ['NAG-002476','closed',['A converse would require a bound for ambient representatives']],
    ['NAG-003086','closed',['No separation or completeness assumption will be needed']],
    ['NAG-003090','closed',['No separation or completeness assumption will be needed','For the following estimate, let']],
  ];
  for (const [id,status,phrases] of cases) {
    const tag=await read('/r/'+id+'/index.html');
    assert.ok(tag.includes('data-closure="'+status+'"'),id);
    const statement=tag.split('id="tag-statement"')[1].split('id="closure"')[0];
    for (const phrase of phrases) assert.ok(statement.includes(phrase),id);
    assert.equal(tag.includes('id="foundations-exact-proof"'),status==='closed',id);
  }
  const comparison=await read('/r/NAG-002473/index.html');
  assert.ok(comparison.includes('href="'+local('/r/NAG-002472/')+'">Both definitions</a>'));
  const estimate=await read('/r/NAG-003090/index.html');
  const title='Proposition 8.15.13 · A quantitative estimate across presentations';
  assert.ok(estimate.includes('<h1>'+title+'</h1>'));
  const index=JSON.parse(await read('/search-index.json'));
  assert.equal(index.find(row=>row.id==='NAG-003090').title,title);
  const catalog=await read(project+'coverage/chapters/8/index.html');
  assert.ok(catalog.includes(title));
  const proofLink='href="'+local('/r/NAG-003090/#foundations-exact-proof')+'"';
  for (const chapter of ['8','appendix-i']) {
    const currentMap=await read(selected+'logic/chapters/'+chapter+'/index.html');
    assert.ok(currentMap.includes(proofLink+'>NAG-003090 · '+title+'</a>'));
  }
  const archivedMap=await read(fixed+'logic/chapters/8/index.html');
  assert.ok(archivedMap.includes('NAG-003090 · Result 8.15.13'));
});

test('Chapter 7 Tag context preserves the printed operator and positivity conventions', {skip:!update}, async () => {
  const chapter=await read(project+'chapters/7/index.html');
  for (const number of ['7.1.2','7.1.3']) {
    assert.ok(chapter.includes('<strong>Definition '+number+'.</strong>'));
  }
  for (const [id,fragment] of [
    ['NAG-900035','<strong>Definition 7.1.3.</strong>'],
    ['NAG-900036','<strong>Definition 7.1.2.</strong>'],
    ['NAG-900038','pointwise decomposition need not have smoothly varying summands'],
    ['NAG-900040','pointwise decomposition need not have smoothly varying summands'],
    ['NAG-900042','dominating every symmetric coefficient matrix'],
    ['NAG-900045','Order the exterior coordinates'],
  ]) {
    const page=await read('/r/'+id+'/index.html');
    assert.match(page,/data-closure="pending"/);
    assert.ok(page.split('id="tag-statement"')[1].split('id="closure"')[0].includes(fragment),id);
  }
  const conversion=await read('/r/NAG-900036/index.html');
  assert.ok(conversion.includes('href="'+local(project+'chapters/7/#label-6465663a666e642d7375706572666f726d73')+'">Definition 7.1.1</a>'));
});

test('Chapter 11 and 13 scope references retain the sealed hypothesis and proof roles', {skip:!update}, async () => {
  for (const [id,chapter,status,target,caption,context] of [
    ['NAG-900107','11','pending',project+'chapters/11/#label-7365633a7073683235','In the setting above','The neighbourhood in the definition is fixed'],
    ['NAG-900108','11','pending',project+'chapters/11/#label-7365633a7073683235','the preceding category','good Hausdorff boundaryless analytic space'],
    ['NAG-900128','11','pending','/r/NAG-900127/','the preceding setting','The extensions must preserve order'],
    ['NAG-900138','11','pending',null,null,'All topological neighbourhoods below are ordinary neighbourhoods'],
    ['NAG-900160','11','pending','/r/NAG-900155/','the relative-support presentations above',null],
    ['NAG-900195','11','pending','/r/NAG-900194/','the preceding smooth psh example',null],
    ['NAG-900259','13','open',project+'chapters/13/#label-6465663a62742d6f7065726174696f6e','the preceding positivity and closedness assumptions','Dependence only on its curvature current is a separate question'],
  ]) {
    const page=await read('/r/'+id+'/index.html');
    const statement=page.split('id="tag-statement"')[1].split('id="closure"')[0];
    assert.ok(page.includes('data-closure="'+status+'"'),id);
    assert.equal(page.includes('id="foundations-exact-proof"'),status==='pending',id);
    if (context) assert.ok(statement.includes(context),id);
    if (target) {
      const expected='href="'+local(target)+'">'+caption+'</a>';
      assert.ok(statement.includes(expected),id);
      assert.ok((await read(project+'chapters/'+chapter+'/index.html')).includes(expected),id);
    }
  }
  assert.match(await read('/r/NAG-900155/index.html'),/data-closure="open"/);
  assert.match(await read('/r/NAG-900194/index.html'),/data-closure="pending"/);
});

test('The native Chapter 11 tail comparison scrolls locally without changing its MathML', {skip:!update}, async () => {
  const page=await read(project+'chapters/11/index.html');
  const excerpt=page.split('The same proof applies termwise to a decreasing sequence')[1].split('</p>')[0];
  const wrapper='<span class="book-equation book-inline-equation" role="group" aria-label="Decreasing sequence inequality" tabindex="0">';
  assert.equal(page.split(wrapper).length,2);
  const expression=excerpt.split(wrapper)[1].split('</math>')[0];
  assert.ok(expression.includes(String.raw`G_{j+1}+2\eta_{j+1}\leq u_{j+1}+3\eta_{j+1}\leq u_j+\eta_j\leq G_j+2\eta_j`));
  assert.ok(excerpt.includes('uniform convergence is claimed only when the targets themselves converge uniformly'));
  assert.ok(!excerpt.includes('class="proof"'));
});

test('Chapter 11 and Chapter 13 open inputs and negative conclusions remain separate', {skip:!update}, async () => {
  const chapter=await read(project+'chapters/13/index.html');
  const input=await read('/r/NAG-900257/index.html');
  const step=await read('/r/NAG-900258/index.html');
  const iteration=await read('/r/NAG-900259/index.html');
  const comparison=await read('/r/NAG-900180/index.html');
  const convergence='href="'+local('/r/NAG-900257/')+'">multiplier convergence</a>';
  const positivity='href="'+local('/r/NAG-900258/')+'">one-step positivity</a>';
  assert.equal(chapter.split(convergence).length,3);
  assert.ok(chapter.includes(positivity));
  assert.ok(step.includes(convergence));
  assert.ok(iteration.includes(convergence) && iteration.includes(positivity));
  assert.match(iteration,/citation does not discharge either open native premise/);
  assert.ok(comparison.split('id="tag-statement"')[1].split('id="closure"')[0].includes(
    'The last current-positivity conclusion is not used to reverse the argument.'));
  for (const page of [input,step,iteration,comparison]) {
    assert.match(page,/data-closure="open"/);
    assert.doesNotMatch(page,/href="#foundations-exact-proof"/);
  }
});

test('Middle-chapter shortcuts carry only real retained proof anchors', {skip:!update}, async () => {
  for (const [id,alias,fragment] of [
    ['NAG-900035','proof-tags/p-a53ba4c07a9d/','#foundations-exact-proof'],
    ['NAG-900054','proof-tags/p-131812a526e3/','#foundations-exact-proof'],
    ['NAG-900143','results/fnd-4aaef65a0a05/',''],
  ]) {
    const route='/r/'+id+'/';
    const tag=await read(route+'index.html');
    const argument=tag.split('id="foundations-exact-proof"')[1].split('</section>')[0];
    const proofIds=[...argument.matchAll(/id="(proof-(?:paragraph|item)-\d+)"/g)].map(([,id])=>id);
    const saved=await read(project+alias+'index.html');
    assert.ok(saved.includes('href="'+local(route+fragment)+'"'),id);
    assert.ok(saved.includes('data-proof-bookmark="'+['foundations-exact-proof',...proofIds].join(' ')+'"'),id);
  }
});

test('Current and mixed-product Tags retain their original hypotheses and limitations', {skip:!update}, async () => {
  for (const [id,words] of [
    ['NAG-900070','The trace measure depends on coordinates'],
    ['NAG-900079','use the distributional convention'],
    ['NAG-900080','left multiplication is defined by'],
    ['NAG-900081','Positivity requires more'],
    ['NAG-900083','relations among chart presentations must remain visible'],
    ['NAG-900084','Positivity provides continuity'],
    ['NAG-900088','For weak positivity alone'],
    ['NAG-900089','For weak positivity alone'],
    ['NAG-900265','No equivalence with all continuous functions'],
    ['NAG-900269','Work either in the real setting above or'],
    ['NAG-900270','an algebraically closed complete nontrivially valued field'],
    ['NAG-900271','one common one-step approximation'],
    ['NAG-900273','by current pushforward'],
    ['NAG-900274','by current pushforward'],
    ['NAG-900276','These hypotheses are part of the statement'],
    ['NAG-900277','Different classes may give different capacities'],
  ]) {
    const page=await read('/r/'+id+'/index.html');
    assert.match(page,/data-closure="pending"/);
    assert.ok(page.split('id="tag-statement"')[1].split('id="closure"')[0].includes(words),id);
  }
  const prior='href="'+local(project+'chapters/13/#new:generated_symmetry')+'">scope just specified</a>';
  for (const route of [project+'chapters/13/','/r/NAG-900273/','/r/NAG-900274/']) {
    const page=await read(route+'index.html');
    assert.equal(page.split(prior).length,2,route);
  }
});

test('Middle-chapter old section aliases expose their original numbered heading', {skip:!update}, async () => {
  for (const [chapter,label,number] of [
    [8,'ii:integration','8.4'],[10,'ii:PL','10.1'],
    [11,'v21:fan_density_section','11.18'],[13,'new:generated_symmetry','13.9'],
  ]) {
    const page=await read(project+'chapters/'+chapter+'/index.html');
    const alias='label-'+Buffer.from(label).toString('hex');
    const header=page.split('<h2 id="'+label+'" data-numbered-heading>'+number+' ')[1];
    assert.ok(header,number);
    assert.ok(header.split('</h2>')[1].trimStart().startsWith('<div id="'+alias+'">'),number);
    assert.equal(page.split('id="'+alias+'"').length,2,number);
  }
  const early=await read(project+'chapters/6/index.html');
  assert.ok(!early.includes('<h2 id="iv:GRW" data-numbered-heading'));
});

test('Chapter 10 bibliography links distinguish the two CLD editions', async () => {
  const chapter=await read(project+'chapters/10/index.html');
  const appendix=project+'chapters/appendix-a/';
  const refs=await read(appendix+'index.html');
  for (const [id,label] of [['CLD12','CLD12'],['CLD25','CLD25'],['Gubler16','[Gubler]'],['GRPL','[GRPL]']]) {
    assert.equal(refs.split('id="ref-'+id+'"').length,2,id);
    assert.ok(chapter.includes('href="'+local(appendix+'#ref-'+id)+'">'+label+'</a>'),id);
  }
  const boundaryLemma=await read('/r/NAG-900100/index.html');
  assert.ok(boundaryLemma.includes('affinoid boundary lemma of <a href="'+local(appendix+'#ref-CLD12')+'">CLD12</a>'));
  assert.ok(!boundaryLemma.includes('#ref-CLD25'));
});

test('Chapter 10 restores the retained closed pullback citations only on the active Tag', {skip:!update}, async () => {
  const key='CLAUSE:NAG-003106:closed_pullback_only';
  const id='scope-CLAUSE_3ANAG-003106_3Aclosed_pullback_only';
  const route='/r/NAG-003106/index.html';
  const active=await read(route);
  const frozen=await read(selected+route.slice(1));
  const proof=html=>html.split('<section id="'+id+'-proof">')[1]?.split('</section>')[0];
  const cite=(href,caption)=>'<a href="'+local(href)+'">'+caption+'</a>';
  const pdf=selected+'reader-en.pdf#nameddest=';
  for (const [type,caption,label] of [
    ['theorem','2.39.6','fnd:fullgkiehltheoremb'],
    ['corollary','1.18.4','fnd:generalizedaffinoidquotients'],
    ['lemma','2.53.2','fnd:closedimmersiontargetglocal'],
    ['theorem','5.52.3','v037:forms:germsheaf'],
  ]) {
    const target=pdf+type+'.'+caption;
    assert.ok(proof(active).includes(cite(target,caption)),caption);
    assert.ok(proof(frozen).includes(cite(target,'['+label+']')),label);
  }
  assert.ok(proof(active).includes(cite('/r/NAG-002966/','NAG-002966')+' gives the'));
  assert.ok(proof(frozen).includes('finality proves pullback continuity. gives the'));
  const exact=html=>proof(html).match(/<pre data-source-sha256="[^"]+">[\s\S]*?<\/pre>/)?.[0];
  assert.ok(exact(active)?.includes(update.scopeRecords[key].proof.sourceSha256));
  assert.equal(exact(active),exact(frozen));
  const graph=await read(selected+'logic/chapters/10/index.html');
  const panel=graph.split('id="argument-clause-nag-003106-closed_pullback_only"')[1]?.split('</details>')[0];
  const linked=[...panel.matchAll(/<li><a [^>]*>(NAG-\d{6}) ·/g)].map(([,tag])=>tag);
  assert.deepEqual(linked,update.scopeRecords[key].requires);
});

test('Chapter 10 manuscript Tags include their sealed statement contexts', async () => {
  const search=JSON.parse(await read('/search-index.json'));
  const chapter=await read(project+'chapters/10/index.html');
  for (const [id,context,formula,number] of [
    ['NAG-900094','We use the normalization',String.raw`\int a(t)d`,'10.2.1'],
    ['NAG-900095','Assume balancing at all vertices',String.raw`m_e`,'10.3.1'],
    ['NAG-900097','a primitive normal is a class modulo tangent directions',String.raw`c_\tau(u)=\sum_`,'10.5.1'],
  ]) {
    const entry=await read('/r/'+id+'/index.html');
    const statement=entry.split('id="tag-statement"')[1]?.split('id="closure"')[0];
    assert.ok(statement?.includes(context),id);
    assert.ok(statement.includes(formula),id);
    assert.ok(statement.indexOf(context)<statement.indexOf(number),id);
    assert.ok(chapter.includes(context),id);
    assert.match(entry,/data-closure="pending"/);
    const item=search.find(row=>row.id===id);
    assert.equal(item.status,'pending',id);
    assert.ok(item.body.includes(context),id);
  }
});

test('Chapter 10 verifies numbered citations before removing copied macro labels', async () => {
  const chapter=project+'chapters/10/';
  const known=chapter+'#label-6e65773a7077735f706f73697469766974795f73706c6974';
  const duplicated=href=>'<p>Proposition f8nmTag:new:pws_positivity_split <code>f8nmTag:new:pws_positivity_split</code>  <a href="'+href+'">10.6.1</a> then applies.</p>';
  const bindings=new Map([['new:pws_positivity_split',{href:known,title:'Proposition 10.6.1'}]]);
  assert.equal(restoreFoundationsNumberedLinks(duplicated(known),bindings),
    '<p>Proposition <a href="'+known+'">10.6.1</a> then applies.</p>');
  const wrong=duplicated(chapter+'#wrong');
  assert.equal(restoreFoundationsNumberedLinks(wrong,bindings),wrong);
  const wrongNumber=duplicated(known).replace('>10.6.1<','>10.7.1<');
  assert.equal(restoreFoundationsNumberedLinks(wrongNumber,bindings),wrongNumber);

  const cite=(href,number)=>'<a href="'+local(href)+'">'+number+'</a>';
  const confirmed=[
    [project+'chapters/15/#label-6e65773a636f726e65725f62616c616e636564','15.5.2',1],
    [known,'10.6.1',2],
    [chapter+'#label-6e65773a626f756e646172795f73657061726174696e675f756e697473','10.8.1',1],
    [project+'chapters/6/#label-6e65773a616666696e6f69645f7075726974795f7468656f72656d','6.10.2',1],
    [chapter+'#label-6e65773a74726f706963616c5f7374726f6e675f6d6178696d756d','10.7.1',1],
  ];
  const html=await read(chapter+'index.html');
  const later=html.slice(html.indexOf('id="new:interval"'));
  assert.doesNotMatch(later,/f8nmTag:/);
  for (const [href,number,count] of confirmed) {
    assert.equal(later.split(cite(href,number)).length,count+1,number);
  }
  const former=await read('/r/NAG-900099/index.html');
  const last=await read('/r/NAG-900101/index.html');
  assert.doesNotMatch(former+last,/f8nmTag:/);
  assert.equal(former.split(cite(known,'10.6.1')).length,3);
  for (const [href,number] of confirmed.slice(2)) assert.ok(last.includes(cite(href,number)),number);

  const rows=JSON.parse(await read('/search-index.json'));
  for (let i=900094;i<=900101;i++) {
    const row=rows.find(row=>row.id==='NAG-'+i);
    assert.equal(row.status,'pending',row.id);
    assert.equal(row.link,local('/r/'+row.id+'/'));
    assert.doesNotMatch(row.body,/f8nmTag:|^\w+ 10\.\d+\.\d+\.\./);
  }
  if (update) {
    const transfer=rows.find(row=>row.id==='NAG-003106');
    assert.equal(transfer.status,'closed');
    assert.match(transfer.body,/Theorem NAG-003103/);
    assert.doesNotMatch(transfer.body,/\[thm:fixed\]/);
    const continuity=rows.find(row=>row.id==='NAG-003002');
    assert.equal(continuity.status,'closed');
    assert.match(continuity.summary,/Proposition I\.0\.18/);
    const href=destination=>selected+'reader-en.pdf#nameddest='+destination;
    const entry=await read('/r/NAG-003002/index.html');
    for (const [destination,caption] of [
      ['foundations.nag-002999.original','I.0.18'],
      ['equation.I.2.36','(I.2.36)'],
      ['foundations.nag-002995.original','I.2.15'],
    ]) {
      assert.ok(entry.includes(cite(href(destination),caption)),destination);
      assert.ok(later.includes(cite(href(destination),caption)),destination);
    }
    assert.doesNotMatch(entry,/\[prop:orderzero\]|\[fnd:nag00(?:2995|3002):/);
    assert.ok(entry.includes('Frozen '+cite('/r/NAG-002473/','NAG-002473')+' transfers the same conclusion'));
    const frozen=await read(selected+'r/NAG-003002/index.html');
    assert.match(frozen,/Frozen\s+transfers the same conclusion/);
  }
});

test('Current Coverage follows recovered chapter locations without retiring the supplement register', {skip:!update}, async () => {
  const {tags}=JSON.parse(await read(project+'reader/tags.json'));
  const examples=[
    ['NAG-002474','appendix-c','f8-reader-t4-di-supplement-0'],
    ['NAG-002661','appendix-f','f8-reader-t4-di-supplement-0','foundations.nag-002661.recovered-proof',1994],
    ['NAG-002884','appendix-i','appendix-g','foundations.nag-002884.original',2097],
  ];
  for (const [id,chapter,previous,pdf,physicalPage] of examples) {
    const route='/r/'+id+'/';
    const active=await read(project+'coverage/chapters/'+chapter+'/index.html');
    const former=await read(project+'coverage/chapters/'+previous+'/index.html');
    assert.ok(active.includes('href="'+local(route)+'"'),id);
    assert.ok(!former.includes('href="'+local(route)+'"'),id);
    assert.ok(tags[id].startsWith(local(project+'chapters/'+chapter+'/#')),id);
    if (!pdf) continue;
    const tag=await read(route+'index.html');
    assert.ok(tag.includes('reader-en.pdf#nameddest='+pdf+'">Statement and proof in the English PDF (p. '+physicalPage+')</a>'),id);
  }
  const historical=await read(project+'chapters/f8-reader-t4-di-supplement-0/index.html');
  assert.ok(historical.includes('Supplement records from seal 1097'));
  assert.ok(historical.includes('href="'+local('/r/NAG-002474/')+'"'));
});

test('Current proof-map chapters use the bound argument and historical argument anchors still resolve', {skip:!update}, async () => {
  for (const [id,prior,current] of [
    ['NAG-002474','f8-reader-t4-di-supplement-0','appendix-c'],
    ['NAG-002488','f7native-interior-stokes-supplement-0','appendix-c'],
    ['NAG-002661','f8-reader-t4-di-supplement-0','appendix-f'],
    ['NAG-002884','appendix-g','appendix-i'],
  ]) {
    const anchor='argument-'+id.toLowerCase();
    const target=selected+'logic/chapters/'+current+'/';
    const old=await read(selected+'logic/chapters/'+prior+'/index.html');
    const active=await read(target+'index.html');
    assert.ok(old.includes('<li id="'+anchor+'"><a href="'+local(target+'#'+anchor)+'">'),id);
    assert.ok(!old.includes('class="logic-proof" id="'+anchor+'"'),id);
    assert.ok(active.includes('class="logic-proof" id="'+anchor+'"'),id);
  }
});

test('The current proof map uses formal clauses for model metrics and preserves exceptional scope dispositions', {skip:!update}, async () => {
  const logic=await read(selected+'logic/chapters/3/index.html');
  const metric=logic.match(/id="argument-nag-000176"[\s\S]*?<\/details>/)?.[0];
  assert.ok(metric);
  assert.match(metric,/joint registered proof inputs/);
  assert.match(metric,/formal_topology/);
  assert.match(metric,/formal_existence_restriction_product_pullback/);
  assert.doesNotMatch(metric,/\/r\/NAG-00194[45]\/#foundations-exact-proof/);
  const coverage=await read(project+'coverage/index.html');
  assert.match(coverage,/1,174 accepted whole results, including 77/);
  assert.match(coverage,/21 clauses separately/);
  assert.match(coverage,/966 of 971 priority originals/);
  assert.match(coverage,/68 of 68 exceptional originals/);
});

test('Restored arguments reconcile the current proof map and search while retaining original held anchors', {skip:!update}, async () => {
  const rows=new Map(JSON.parse(await read('/search-index.json')).map(row=>[row.id,row]));
  const old=await graph();
  for (const id of update.counts.previousExactExportHolds) {
    const path='/r/'+id+'/';
    const active=await read(path+'index.html');
    assert.ok(active.includes('id="accepted-export-held"'),id);
    assert.ok(active.includes('id="foundations-exact-proof"'),id);
    assert.equal(old.nodes[id].href,path+'#accepted-export-held',id);
    assert.equal(rows.get(id)?.coverage,'Accepted whole',id);
    assert.equal(rows.get(id)?.status,'closed',id);
    assert.doesNotMatch(rows.get(id)?.summary,/unavailable/i,id);
  }
  const example=await read('/r/NAG-002484/index.html');
  assert.ok(example.includes('href="#foundations-exact-proof">Example and argument</a>'));
  assert.match(rows.get('NAG-002484')?.summary,/includes its argument/);
  for (const [chapter,id] of [['2','NAG-001831'],['appendix-c','NAG-001586']]) {
    const active=await read(selected+'logic/chapters/'+chapter+'/index.html');
    const path='/r/'+id+'/';
    assert.ok(active.includes('href="'+local(path+'#foundations-exact-proof')+'"'),id);
    assert.ok(!active.includes('href="'+local(path+'#accepted-export-held')+'"'),id);
  }
});

test('The shared search index exposes every current Tag with its supported scope and canonical link', {skip:!update}, async () => {
  const rows=JSON.parse(await read('/search-index.json')).filter(row=>row.project==='foundations');
  const byId=new Map(rows.map(row=>[row.id,row]));
  for (const record of Object.values(update.records)) {
    const row=byId.get(record.id);
    assert.equal(row?.link,local('/r/'+record.id+'/'),record.id);
    assert.equal(row.status,record.status,record.id);
  }
  assert.match(byId.get('NAG-000176').summary,/model.metric.+formal models/i);
  assert.match(byId.get('NAG-001944').summary,/quasi-net.+finite-incidence/i);
  const descent=byId.get('NAG-002884');
  assert.ok(descent.keywords.includes('I Descent of the polarized mixed tower'));
  assert.ok(descent.keywords.includes('G Stable inertia and original-field models'));
});

test('Numbered statement search follows exact reader anchors and keeps equation locators separate', {skip:!update}, async () => {
  const {destinations,tags}=JSON.parse(await read(project+'reader/tags.json'));
  const rows=new Map(JSON.parse(await read('/search-index.json')).map(row=>[row.id,row]));
  for (const [id,number] of [['NAG-002503','C.1.1'],['NAG-002520','C.1.9']]) {
    assert.equal(destinations['theorem.'+number],tags[id]);
    assert.ok(rows.get(id).keywords.includes('Theorem '+number),id);
  }
  for (const [id,kind,number,book] of [
    ['NAG-002661','Lemma','F.1.7','foundations.nag-002661.recovered-proof'],
    ['NAG-002913','Lemma','G.0.1','foundations.nag002913.original'],
    ['NAG-003007','Lemma','G.0.8','foundations.nag003007.original'],
    ['NAG-003008','Lemma','H.0.1','foundations.nag003008.original'],
    ['NAG-003009','Theorem','H.0.2','foundations.nag003009.original'],
    ['NAG-003010','Theorem','I.0.1','foundations.nag003010.original'],
    ['NAG-003147','Theorem','I.0.13','foundations.nag003147.pdf-derived'],
    ['NAG-002884','Theorem','I.1.6','foundations.nag-002884.original'],
  ]) {
    const [chapter,authorLabel]=destinations[kind.toLowerCase()+'.'+number].split('#');
    assert.equal(tags[id],chapter+'#'+book,id);
    assert.ok(rows.get(id).keywords.includes(kind+' '+number),id);
    assert.equal(rows.get(id).status,'closed',id);
    const snippet=await read(chapter.slice(base.length)+'index.html');
    assert.ok(snippet.includes('id="'+authorLabel+'"'),id);
    const tag=await read('/r/'+id+'/index.html');
    assert.ok(tag.includes('<strong>'+kind+' '+number+'.</strong>'),id);
    assert.ok(tag.includes('id="foundations-exact-proof"'),id);
  }
  assert.match(destinations['lemma.C.1.13'],/\/appendix-c\/#label-6c656d3a61766f6964$/);
  assert.doesNotMatch(await read('/r/NAG-002661/index.html'),/lem:avoidlem:avoid/);
  assert.notEqual(destinations['equation.G.0.1'],destinations['lemma.G.0.1']);
  assert.notEqual(destinations['equation.I.0.13'],destinations['theorem.I.0.13']);
});

test('Each bound Appendix statement agrees with its existing author label and named PDF action', {skip:!update}, async () => {
  const locators=JSON.parse(await readFile(new URL('../content/foundations/active-reading-locators-1174.json',import.meta.url),'utf8'));
  const {destinations,tags}=JSON.parse(await read(project+'reader/tags.json'));
  const rows=new Map(JSON.parse(await read('/search-index.json')).map(row=>[row.id,row]));
  for (const {id,kind,number,label,destination,exposedLabelSuffix} of locators.appendixStatements.filter(entry=>entry.id && entry.destination)) {
    const [route,anchor]=tags[id].split('#');
    const authored='label-'+Buffer.from(label).toString('hex');
    assert.ok([authored,destination].includes(anchor),id);
    assert.equal(destinations[kind.toLowerCase()+'.'+number],route+'#'+authored,id);
    const page=await read('/r/'+id+'/index.html');
    assert.ok(page.includes('<strong>'+kind+' '+number+'.</strong>'),id);
    if (exposedLabelSuffix) {
      const chapter=await read(route.slice(base.length)+'index.html');
      assert.ok(chapter.includes('id="'+authored+'"'),id);
      assert.ok(!chapter.includes('<em>'+label+exposedLabelSuffix),id);
      assert.ok(!page.includes('<em>'+label+exposedLabelSuffix),id);
    }
    assert.ok(page.includes('reader-en.pdf#nameddest='+destination),id);
    assert.equal(rows.get(id).status,'closed',id);
    assert.ok(rows.get(id).keywords.includes(kind+' '+number),id);
  }
});

test('Printed Appendix captions for reviewed source passages preserve existing pending and contextual roles', {skip:!update}, async () => {
  const {destinations,tags}=JSON.parse(await read(project+'reader/tags.json'));
  for (const [kind,number,id] of [
    ['Lemma','C.1.25'], ['Proposition','C.1.27'], ['Proposition','C.1.93'], ['Lemma','F.1.6'],
    ['Theorem','C.1.101','NAG-900499'], ['Theorem','C.1.105','NAG-900500'], ['Lemma','C.1.111','NAG-900501'],
  ]) {
    const key=kind.toLowerCase()+'.'+number;
    const [route,anchor]=destinations[key].split('#');
    const doc=await read(route.slice(base.length)+'index.html');
    assert.ok(doc.includes('id="'+anchor+'"'),key);
    assert.ok(doc.includes('<strong>'+kind+' '+number+'.</strong>'),key);
    if (!id) continue;
    assert.equal(tags[id],destinations[key]);
    const tag=await read('/r/'+id+'/index.html');
    assert.ok(tag.includes('<strong>'+kind+' '+number+'.</strong>'),id);
    assert.ok(tag.includes('data-closure="pending"'),id);
    assert.ok(!tag.includes('reader-en.pdf#nameddest='+key),id);
  }
  const oldUse=await read('/r/NAG-003148/index.html');
  assert.ok(oldUse.includes('href="'+destinations['theorem.I.0.13']+'">Theorem\u00a01.55.5</a>'));
  assert.equal(destinations['theorem.1.55.5'],undefined);
});

test('Search places an exact numbered statement before longer number matches', {skip:!update}, async () => {
  const index=JSON.parse(await read('/search-index.json'));
  const search=await read('/assets/foundations-search.js');
  for (const query of ['Theorem I.0.1','I.0.1']) {
    const elements=[];
    const make=()=>({appendChild(node){this.children.push(node);},children:[]});
    const form={dataset:{project:'foundations'},addEventListener(){}};
    const results={appendChild(node){elements.push(node);},replaceChildren(){elements.length=0;}};
    const input={};
    const document={
      getElementById:id=>({'site-search':form,'search-results':results,'atlas-search':input})[id],
      querySelector:()=>({src:'https://atlas.test/assets/foundations-search.js'}),
      createElement:make,
    };
    runInNewContext(search,{
      document,URLSearchParams,location:{search:'?q='+encodeURIComponent(query)},addEventListener(){},
      fetch:async()=>({ok:true,json:async()=>index}),
    });
    await new Promise(resolve=>setImmediate(resolve));
    const links=elements.filter(node=>node.className==='search-result');
    assert.equal(links[0]?.href,local('/r/NAG-003010/'),query);
    assert.ok(links.some(node=>node.href===local('/r/NAG-003147/')),query);
  }
});

test('Current printed statement actions preserve the proof status and existing proof actions', {skip:!update}, async () => {
  const {statementReaders}=JSON.parse(await readFile(new URL('../content/foundations/active-reading-locators-1174.json',import.meta.url),'utf8'));
  const {destinations,tags}=JSON.parse(await read(project+'reader/tags.json'));
  const rows=new Map(JSON.parse(await read('/search-index.json')).map(row=>[row.id,row]));
  for (const [tag,{destination,page}] of Object.entries(statementReaders)) {
    assert.equal(destinations[destination],tags[tag],tag);
    const reader=await read('/r/'+tag+'/index.html');
    const actions=reader.match(/<nav class="tag-actions page-actions"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(actions?.includes('reader-en.pdf#nameddest='+destination+'">Statement in the English PDF (p. '+page+')</a>'),tag);
    assert.ok(!actions?.includes('Statement and proof in the English PDF'),tag);
    assert.ok(reader.includes('data-closure="'+rows.get(tag).status+'"'),tag);
  }
  const boundary=await read('/r/NAG-900054/index.html');
  assert.ok(boundary.includes('href="#foundations-exact-proof">Argument in the manuscript</a>'));
  const compact=await read('/r/NAG-900497/index.html');
  assert.ok(!compact.includes('Statement in the English PDF (p.'));
  const existing=await read('/r/NAG-002227/index.html');
  assert.ok(existing.includes('reader-en.pdf#nameddest=corollary.4.40.2'));
  assert.ok(!existing.includes('>Statement in the English PDF (p.'));
});

test('Plain Stacks citations are linked within the same manuscript proofs', {skip:!update}, async () => {
  const oldMap=await graph();
  for (const [id,chapter,codes] of [
    ['NAG-001463','2',['01FM']],
    ['NAG-002204','4',['033C']],
    ['NAG-002207','4',['0E74','0D32','0B5N']],
  ]) {
    const tag=await read('/r/'+id+'/index.html');
    const book=await read(project+'chapters/'+chapter+'/index.html');
    for (const code of codes) {
      const cite='href="https://stacks.math.columbia.edu/tag/'+code+'">'+code+'</a>';
      assert.ok(tag.includes(cite),id);
      assert.ok(book.includes(cite),id);
      assert.ok(oldMap.arguments[id].unresolved.includes('STACKS-'+code),id);
    }
  }
});

test('Appendix C zero-purity proofs cite the regular-elements lemma at the exact chapter label', {skip:!update}, async () => {
  const corrected=local(project+'chapters/appendix-c/#label-6c656d3a61766f6964');
  const former=local(project+'chapters/appendix-f/#label-6c656d3a61766f6964');
  const cite=href=>'href="'+href+'">C.1.13</a>';
  for (const route of [project+'chapters/appendix-c/','/r/NAG-002946/','/r/NAG-002947/']) {
    const doc=await read(route+'index.html');
    assert.ok(doc.includes(cite(corrected)),route);
    assert.ok(!doc.includes(cite(former)),route);
  }
  const statement=await read('/r/NAG-002661/index.html');
  assert.ok(statement.includes('<strong>Lemma F.1.7.</strong>'));
  const {destinations}=JSON.parse(await read(project+'reader/tags.json'));
  assert.equal(destinations['lemma.C.1.13'],corrected);
  assert.equal(destinations['lemma.F.1.7'],former);
  assert.notEqual(destinations['equation.C.1.13'],corrected);
});

test('Formerly unlocated records keep the historical register and current Tag destinations', {skip:!update}, async () => {
  const route='chapters/unlocated/';
  const historical=await read(fixed+route+'index.html');
  const current=await read(project+route+'index.html');
  const ids=page=>[...page.matchAll(/<li class="entry"><small>(NAG-\d{6})<\/small>/g)].map(([,id])=>id);
  assert.match(historical,/<h1>Records without a chapter binding<\/h1>/);
  assert.match(current,/<h1>Formerly unlocated records<\/h1>/);
  assert.deepEqual(ids(current),ids(historical));
  const {tags}=JSON.parse(await read(project+'reader/tags.json'));
  for (const id of ids(historical)) {
    assert.ok(tags[id]?.startsWith(local(project+'chapters/')),id);
    assert.ok(!tags[id]?.startsWith(local(project+route)),id);
    assert.ok((await read('/r/'+id+'/index.html')).includes('data-closure="closed"'),id);
  }
  const contents=await read(project+'contents/index.html');
  assert.ok(contents.includes('href="'+local(project+route)+'">Formerly unlocated records</a>'));
  const logic=await read(selected+'logic/'+route+'index.html');
  assert.match(logic,/<h1>Formerly unlocated records · proof inputs<\/h1>/);
});

test('The archived quasi-net argument has its exact active text while the manuscript review remains separate', {skip:!update}, async () => {
  const definition=await read('/r/NAG-001619/index.html');
  const inherited=await read('/r/NAG-001620/index.html');
  const manuscript=await read('/r/NAG-900003/index.html');
  assert.match(definition,/data-closure="definition"/);
  assert.ok(!definition.includes('id="foundations-exact-proof"'));
  assert.match(inherited,/data-closure="closed"/);
  assert.match(manuscript,/data-closure="pending"/);
  const argument=html=>html.match(/<section class="tag-argument" id="foundations-exact-proof"[^>]+>[\s\S]*?(<div class="proof">[\s\S]*?<\/div>)\s*<\/section>/)?.[1];
  assert.ok(argument(inherited));
  assert.equal(argument(inherited),argument(manuscript));
  const {tags,destinations}=JSON.parse(await read(project+'reader/tags.json'));
  assert.equal(tags['NAG-001619'],destinations['definition.2.39.1']);
  assert.equal(tags['NAG-001620'],destinations['definition.2.39.1']);
  assert.equal(tags['NAG-900003'],destinations['lemma.2.39.2']);
  assert.ok(inherited.includes('href="'+local(fixed+'r/NAG-001620/#foundations-exact-proof')+'"'));
  const shortcut=await read(project+'proof-tags/p-00f88c900c54/index.html');
  assert.ok(shortcut.includes('href="'+local('/r/NAG-900003/#foundations-exact-proof')+'" data-proof-bookmark="true"'));
  const chapter=await read(project+'chapters/2/index.html');
  assert.ok(chapter.includes('href="#manuscript-proof-00f88c900c54">Lemma 2.39.2 · Refining quasi-nets</a>'));
});

test('The chart-interior passage and retained-multiplicity example land in their current exact texts', {skip:!update}, async () => {
  const passage=await read('/r/NAG-002856/index.html');
  assert.match(passage,/<h2 id="foundations-exact-proof">Interior on the actual charts\.<\/h2>/);
  assert.match(passage,/the local test on both spaces/);
  const example=await read('/r/NAG-003210/index.html');
  assert.match(example,/<div class="example" id="foundations-exact-proof">/);
  assert.match(example,/not a permissible deletion/);
  for (const [id,kind,doc] of [['NAG-002856','Passage',passage],['NAG-003210','Example',example]]) {
    assert.ok(doc.includes('id="tag-statement"'),id);
    assert.ok(doc.includes('data-closure="closed"'),id);
    assert.ok(doc.includes('href="#foundations-exact-proof">'+kind+'</a>'),id);
    assert.ok(doc.includes('href="'+local(fixed+'r/'+id+'/#foundations-exact-proof')+'"'),id);
    assert.ok(doc.includes('>Read the '+kind.toLowerCase()+' in the English PDF (p.'),id);
    assert.equal(doc.split('id="foundations-exact-proof"').length,2,id);
  }
});

test('Colliding LaTeX labels do not put unrelated proofs under open or accepted Tags', async () => {
  for (const [id,foreign] of [['002565','003030'],['002976','002806'],['003100','002989'],['003002','003106']]) {
    const page=await read('/r/NAG-'+id+'/index.html');
    assert.match(page,/<math\b/);
    if (updated('NAG-'+id)?.proof) {
      assert.match(page,/data-closure="closed"/,id);
      assert.match(page,/id="foundations-exact-proof"/,id);
      assert.ok(page.includes('reader-en.pdf#nameddest='+encodeURIComponent(updated('NAG-'+id).reader.destination)),id);
      assert.doesNotMatch(page,new RegExp('>'+foreign+'</a>'),id);
    } else {
      assert.match(page,/Historical statement/);
      assert.doesNotMatch(page,/id="foundations-exact-proof"|Proof in chapter|Read in chapter/,id);
    }
    const paired=await read('/r/NAG-'+foreign+'/index.html');
    assert.equal(paired.includes(`>NAG-${id}</a>`),
      updated('NAG-'+foreign)?.requires.includes('NAG-'+id) ?? false,foreign);
  }
  const lemma=await read('/r/NAG-002661/index.html');
  assert.match(lemma,/Lemma F\.1\.7\./);
  assert.match(lemma,/appendix-f\/#foundations\.nag-002661\.recovered-proof/);
  const theorem=await read('/r/NAG-002884/index.html');
  assert.match(theorem,/Theorem I\.1\.6\./);
  assert.match(theorem,/appendix-i\/#foundations\.nag-002884\.original/);
});

test('Only matching typed PDF destinations replace raw author captions', () => {
  const pdf=selected+'reader-en.pdf';
  const destination='lemma.2.3.4';
  const label='src:exact';
  const citation=(file,name,text)=>'<a href="'+file+'#nameddest='+name+'">['+text+']</a>';
  const reader=project+'chapters/2/#label-'+Buffer.from(label).toString('hex');
  const destinations={[destination]:reader,'historical.lemma':reader};
  const correct=citation(pdf,destination,label);
  const unchanged=[
    citation(pdf,destination,'src:other'),
    citation(pdf,'theorem.2.3.4',label),
    citation(pdf,'historical.lemma',label),
    citation(fixed+'reader-en.pdf',destination,label),
  ];
  assert.equal(restoreFoundationsPdfCaptions([correct,...unchanged].join(''),pdf,destinations),
    [correct.replace('['+label+']','2.3.4'),...unchanged].join(''));
});

test('Active scoped and whole arguments show the source PDF numbers and retain the original PDF actions', {skip:!update}, async () => {
  const cases=[
    ['r/NAG-001808/','corollary.3.19.13','fnd:propergermreductionbasechange','3.19.13'],
    ['r/NAG-001982/','theorem.2.31.1','fnd:generalizedrationalpoints','2.31.1'],
    ['r/NAG-002405/','theorem.5.42.2','v037:degree:modulefunctoriality','5.42.2'],
    ['r/NAG-002565/','theorem.C.1.24','thm:estimate','C.1.24'],
    ['r/NAG-002565/','foundations.nag-002563.original','thm:weak','I.1.16'],
    ['chapters/f8-reader-t4-di-supplement-0/','foundations.nag-002563.original','thm:weak','I.1.16'],
    ['chapters/f8-reader-t4-di-supplement-0/','theorem.C.1.24','thm:estimate','C.1.24'],
  ];
  for (const [route,destination,label,number] of cases) {
    const url=(route.startsWith('r/') ? '/' : project)+route;
    const doc=await read(url+'index.html');
    const href='href="'+local(selected+'reader-en.pdf#nameddest='+destination)+'"';
    assert.ok(doc.includes(href+'>'+number+'</a>'),url);
    assert.ok(!doc.includes(href+'>['+label+']</a>'),url);
  }
  const historical=await read(selected+'r/NAG-002565/index.html');
  assert.ok(historical.includes('reader-en.pdf#nameddest=theorem.C.1.24">[thm:estimate]</a>'));
});

test('The historical direct-image supplement confines its exact displays to keyboard-scrollable boxes', {skip:!update}, async () => {
  const id='NAG-002565';
  const displays=[...updated(id).statement.html.matchAll(/<math display="block"[^>]*>[\s\S]*?<\/math>/g)].map(match=>match[0]);
  assert.equal(displays.length,4);
  const marker='<span class="math display" tabindex="0">';
  const archive=await read(selected+'r/'+id+'/index.html');
  for (const route of ['/r/'+id+'/',project+'chapters/f8-reader-t4-di-supplement-0/']) {
    const page=await read(route+'index.html');
    for (const display of displays) {
      assert.ok(page.includes(marker+display+'</span>'),route);
      assert.ok(archive.includes(display) && !archive.includes(marker+display),route);
    }
  }
});

test('The three retained finite-module scopes open their own proof-map cards and keep their old bookmarks', {skip:!update}, async () => {
  const id='NAG-002405';
  const route='/r/'+id+'/';
  const tag=await read(route+'index.html');
  const earlier=await read(selected+route.slice(1)+'index.html');
  const mapRoute=selected+'logic/chapters/5/';
  const map=await read(mapRoute+'index.html');
  for (const [name,count] of [
    ['finite_cell_functional',3], ['global_finite_module_chain_weights',5], ['same_affinoid_coordinate_augmentation',10],
  ]) {
    const scope='scope-CLAUSE_3A'+id+'_3A'+name;
    const anchor='argument-clause-'+id.toLowerCase()+'-'+name;
    const current=tag.slice(tag.indexOf('<section id="'+scope+'">'));
    assert.ok(current.startsWith('<section id="'+scope+'"><span id="'+name+'"></span><h3>'),name);
    const actions=current.slice(0,current.indexOf('</p>'));
    assert.ok(actions.includes('href="'+local(mapRoute+'#'+anchor)+'">Proof map for this scope</a>'),name);
    assert.equal(tag.split('id="'+name+'"').length,2,name);
    assert.ok(!earlier.includes(local(mapRoute+'#'+anchor)),name);
    const start=map.indexOf('<details class="logic-proof" id="'+anchor+'">');
    assert.ok(start>=0,name);
    const card=map.slice(start,map.indexOf('</details>',start));
    assert.equal(card.match(/class="logic-clause"/g)?.length,count,name);
    assert.ok(card.includes('href="'+local(route+'#'+scope)+'"'),name);
    if (name==='finite_cell_functional') assert.ok(card.includes('<code>NAG-002388</code>'),name);
  }
  const clipped=await read('/r/NAG-003106/index.html');
  assert.ok(!clipped.includes('Proof map for this scope'));
});

test('The current formal-topology scope shows the precise historical passage and its separate erratum', {skip:!update}, async () => {
  const scope='scope-CLAUSE_3ANAG-001944_3Aformal_topology';
  const route='/r/NAG-001944/';
  const active=await read(route+'index.html');
  const frozen=await read(selected+route.slice(1)+'index.html');
  const chapter=await read(project+'chapters/3/index.html');
  const action='href="'+local(route+'#'+scope)+'">Noetherian affine formal topology</a>';
  assert.ok(chapter.includes(action));
  assert.ok(active.includes(action));
  assert.ok(!frozen.includes(action));
  assert.equal(active.split('id="formal_topology"').length,2);
  assert.ok(active.includes('data-closure="partial"'));
  const source=active.split('id="'+scope+'"')[1].split('</section>')[0];
  assert.ok(source.includes('<span id="formal_topology"></span>'));
  assert.ok(source.includes('reader-en.pdf#page=538">Historical proof in the English PDF (p. 538)</a>'));
  assert.ok(source.includes('reader-en.pdf#nameddest=errata%3Anag001944">Reviewed erratum in the English PDF (p. 2270)</a>'));
  assert.match(source,/standing nontrivially valued field/);
  assert.match(source,/topologically Noetherian because/);
  assert.match(source,/have finite principal-affine covers\.<\/p>/);
  assert.equal(source.match(/encoding="application\/x-tex"/g)?.length,9);
  assert.doesNotMatch(source,/Their generic fibres consequently|proves quasi-separatedness/);
});

test('The three curve Tags that use the shared model setup link its precise chapter paragraph', {skip:!update}, async () => {
  const route=project+'chapters/4/';
  const anchor='split-nodal-model-assumptions';
  const book=await read(route+'index.html');
  assert.equal(book.split('id="'+anchor+'"').length,2);
  const setup=book.split('id="'+anchor+'"')[1].split('</p>')[0];
  assert.match(setup,/For the rest of this section and the next, assume that/);
  assert.match(setup,/is algebraically closed/);
  assert.match(setup,/A split nodal algebraic model means a projective/);
  const request='href="'+local(route+'#'+anchor)+'">Split nodal model assumptions</a>';
  for (const id of ['NAG-002231','NAG-002232','NAG-002235']) {
    const tag=await read('/r/'+id+'/index.html');
    assert.ok(tag.includes(request),id);
    assert.ok(tag.includes('data-closure="closed"'),id);
  }
  for (const id of ['NAG-002234','NAG-002236']) {
    const tag=await read('/r/'+id+'/index.html');
    assert.ok(!tag.includes(request),id);
  }
});

test('The reduced product mass scope retains both named external applications in the active proof map', {skip:!update}, async () => {
  const key='SUPPORT:NAG-002737+NAG-002757:reduced_product_model_mass';
  const id='argument-support-nag-002737-nag-002757-reduced_product_model_mass';
  const scope='scope-SUPPORT_3ANAG-002737_2BNAG-002757_3Areduced_product_model_mass';
  const route=selected+'logic/chapters/appendix-i/index.html';
  const current=await read(route);
  const fixedMap=await read(fixed+'logic/chapters/appendix-i/index.html');
  assert.ok(!fixedMap.includes('id="'+id+'"'));
  const card=current.split('id="'+id+'"')[1]?.split('</details></details>')[0];
  assert.ok(card?.includes('<summary>'+key+' · reduced product model mass</summary>'));
  assert.ok(card.includes('href="'+local('/r/NAG-002737/#'+scope)+'"'));
  assert.ok(card.includes('<summary>Exact named external applications</summary>'));
  for (const name of ['01WC','02T9']) {
    assert.ok(card.includes('href="https://stacks.math.columbia.edu/tag/'+name+'">Stacks Project, Tag '+name+'</a>'));
  }
  assert.doesNotMatch(card,/class="logic-premises"[\s\S]*?class="logic-clause"/);
  for (const tag of ['NAG-002737','NAG-002757']) {
    const proof=current.split('id="argument-'+tag.toLowerCase()+'"')[1]?.split('</details>')[0];
    assert.ok(proof?.includes('href="'+local('/r/NAG-002737/#'+scope)+'"'),tag);
    assert.ok(proof.includes('accepted narrower scope'),tag);
  }
  const target=(await read('/r/NAG-002737/index.html')).split('id="'+scope+'"')[1]?.split('</section>')[0];
  assert.ok(target?.includes('reader-en.pdf#nameddest=lemma.I.2.68'));
});

test('The scalar reduction links its two explicitly supplied source contexts', {skip:!update}, async () => {
  const id='NAG-002675';
  const tag=await read('/r/'+id+'/index.html');
  const chapter=await read(project+'chapters/appendix-i/index.html');
  const snapshot=await read(selected+'r/'+id+'/index.html');
  const paper=local(selected+'reader-en.pdf');
  const assumption='<a href="'+paper+'#page=2021">(SC)</a>';
  const interfaces='<a href="'+paper+'#nameddest=section*.412">the frozen interfaces specified above</a>';
  for (const current of [tag,chapter]) assert.ok(current.includes('Assume '+assumption+', '+interfaces));
  assert.ok(snapshot.includes('Assume (SC), the frozen interfaces specified above'));
  assert.ok(!snapshot.includes(assumption));
  assert.ok(tag.includes('data-closure="closed"'));
});


test('The conditional Cartier reduction names the exact local inputs and compact partition clause', {skip:!update}, async () => {
  const id='NAG-002981';
  const tag=await read('/r/'+id+'/index.html');
  const chapter=await read(project+'chapters/appendix-i/index.html');
  const frozen=await read(selected+'r/'+id+'/index.html');
  const citation=(href,text)=>'<a href="'+local(href)+'">'+text+'</a>';
  const interior=citation('/r/NAG-001630/#tag-statement','NAG-001630');
  const composition=citation('/r/NAG-001704/#tag-statement','NAG-001704');
  const partition=citation(fixed+'r/NAG-002428/#compact_partition_only','NAG-002428');
  const gluing=citation(selected+'reader-en.pdf#nameddest=equation.F.1.5','NAG-002772');
  for (const current of [tag,chapter]) {
    assert.ok(current.includes('By '+interior+' and relative-interior composition\n'+composition+', each'));
    assert.ok(current.includes('Use '+partition+' to choose\ncompact ordinary smooth'));
    assert.ok(current.includes('effective Cartier gluing in '+gluing+', identify the local pairings'));
  }
  assert.ok(tag.includes('data-closure="closed"'));
  assert.ok(frozen.includes('By and relative-interior composition'));
  assert.ok(frozen.includes('effective Cartier gluing in , identify'));
  assert.ok(!frozen.includes('Use '+partition+' to choose'));
});


test('Sealed Appendix I Tag commands render at the cited scopes without promoting pending interfaces', {skip:!update}, async () => {
  const appendix=await read(project+'chapters/appendix-i/index.html');
  const paper=destination=>selected+'reader-en.pdf#nameddest='+destination;
  const citation=(href,label)=>'<a href="'+local(href)+'">'+label+'</a>';
  const statement=id=>citation('/r/'+id+'/#tag-statement',id);
  const other=[
    ['NAG-002811',['pending F8ST-C and F8ST-I interfaces']],
    ['NAG-002899',[
      citation(paper('foundations.nag-002806.original'),'F8RC-L'),
      citation(paper('foundations.nag-002802.original'),'F8RC-P'),
      citation(paper('foundations.nag-002765.original'),'F8ST-A'),
    ]],
    ['NAG-002957',['Frozen integral inclusion–exclusion '+statement('NAG-002416')+' identifies']],
    ['NAG-002961',['the frozen grid construction '+statement('NAG-002389')+'; no measurable extension']],
    ['NAG-002983',['inherited purity are the frozen '+statement('NAG-002411')+'/'+statement('NAG-002413')]],
    ['NAG-002995',['The two clauses of frozen '+citation(paper('fsevenInteriorDisplay.1'),'NAG-002577')]],
    ['NAG-003100',[
      'the dimension-drop input '+statement('NAG-002374'),
      'The exact antichain clause of '+citation(paper('foundations.nag-002772.original'),'NAG-002772'),
      'followed by '+citation(paper('foundations.nag-002778.original'),'NAG-002778'),
      'For logarithms, frozen '+citation(paper('foundations.nag-002806.original'),'NAG-002806'),
    ]],
  ];
  for (const [id,texts] of other) {
    const tag=await read('/r/'+id+'/index.html');
    const fixedTag=await read(selected+'r/'+id+'/index.html');
    for (const text of texts) {
      assert.ok(tag.includes(text),id+' in Tag');
      assert.ok(appendix.includes(text),id+' in chapter');
      assert.ok(!fixedTag.includes(text),id+' fixed version');
    }
  }
  const pending=await read('/r/NAG-002811/index.html');
  assert.doesNotMatch(pending,/>F8ST-[CI]<\/a>/);
});


test('The historical Appendix I scalar formula keeps its web key and links its exact printed page', {skip:!update}, async () => {
  const legacy='label-666e643a6e61673030323939303a737570706c6965642d7363616c61722d706c';
  const named='foundations.nag003148.formula.24';
  const route=project+'chapters/appendix-i/';
  const book=await read(route+'index.html');
  const {destinations}=JSON.parse(await read(project+'reader/tags.json'));
  assert.equal(destinations['equation.I.0.24'],local(route+'#'+legacy));
  assert.equal(destinations[named],local(route+'#'+named));
  const formula=book.split('id="'+legacy+'"')[1]?.split('</dd>')[0];
  assert.ok(formula?.includes('href="'+local(selected+'reader-en.pdf#page=2080')+'">(I.0.24)</a>'));
  assert.doesNotMatch(formula,/#nameddest=equation\.I\.0\.24/);
  const other=book.split('id="'+named+'"')[1]?.split('</p>')[0];
  assert.ok(other?.includes('href="'+local(selected+'reader-en.pdf#nameddest='+named)+'">(24)</a>'));
});


test('The active chapters keep verified wide inline formulas in labelled scrollers without changing their math', {skip:!update}, async () => {
  const expected = {
    '1': ['Divisible value group formula'],
    '3': ['Polynomial presentation after scalar extension'],
    '4': ['Distance comparison'],
    '5': ['Standard chart presentation'],
    '10': ['Differentiated terms in the localization argument'],
    '11': ['Local coordinates at the marked points'],
    '21': ['Bidegree of the product'],
    '23': ['Local expansion of the polynomial quotient'],
    'appendix-c': ['Top-degree form in coordinates','Quotient module isomorphism'],
  };
  for (const [chapter,labels] of Object.entries(expected)) {
    const html = await read(project+'chapters/'+chapter+'/index.html');
    for (const label of labels) {
      const opener = '<span class="book-equation book-inline-equation" role="group" aria-label="'+label+'" tabindex="0">';
      assert.ok(html.includes(opener), chapter+': '+label);
      for (const found of html.split(opener).slice(1)) {
        assert.match(found, /^<span class="katex">[\s\S]*?<annotation encoding="application\/x-tex">[^<]+<\/annotation>/, label);
      }
    }
  }
  const css = await read('/assets/foundations-native.css');
  assert.match(css, /\.book-text table \{ position: relative;[^}]*overflow-x: auto;/);
});
