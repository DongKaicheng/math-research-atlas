import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';

const root = path.resolve(import.meta.dirname,'..');
const dist = path.join(root,'dist');
const base = (process.env.SITE_BASE_PATH ?? '/math-research-atlas').replace(/\/$/,'');
const project = '/projects/foundations/';
const read = route => readFile(path.join(dist,route.replace(/^\//,'')),'utf8');
const description = html => html.match(/<meta name="description" content="([^"]+)"/i)?.[1];

test('Current Foundations chapters carry distinct descriptions of their actual subjects',async()=>{
  const index = JSON.parse(gunzipSync(await readFile(path.join(root,'content/foundations/native/index.json.gz'))));
  const descriptions = new Set();
  for (const chapter of index.catalogue) {
    const page = await read(chapter.route+'index.html');
    const summary = description(page);
    assert.ok(summary && summary.length > 40,chapter.route);
    assert.ok(!descriptions.has(summary),'Duplicate chapter description: '+chapter.route);
    assert.doesNotMatch(summary,/<math|<annotation|\\(?:begin|operatorname|mathrm)/,chapter.route);
    descriptions.add(summary);
  }
  const analytic = description(await read(project+'chapters/2/index.html'));
  assert.match(analytic,/Analytic spaces, morphisms and fibres/);
  const tropical = description(await read(project+'chapters/5/index.html'));
  assert.match(tropical,/Tropicalization, multiplicities and balancing/);
});

test('Permanent NAG pages have individual searchable summaries without changing proof status',async()=>{
  const rows = JSON.parse(await read('/search-index.json')).filter(row=>row.project==='foundations' && /^NAG-\d{6}$/.test(row.id));
  assert.ok(rows.length > 1600,'Expected the complete current Foundations Tag register');
  const descriptions = new Set();
  for (const row of rows) {
    const route = row.link.startsWith(base+'/') ? row.link.slice(base.length) : row.link;
    const page = await read(route+'index.html');
    const summary = description(page);
    assert.ok(summary?.includes(row.id),row.id);
    assert.ok(!descriptions.has(summary),'Duplicate Tag description: '+row.id);
    assert.doesNotMatch(summary,/<annotation|\\(?:begin|operatorname|mathrm)|\[formula\]/,row.id);
    descriptions.add(summary);
  }
  const analytification = await read('/r/NAG-000136/index.html');
  assert.match(analytification.match(/<title>([^<]+)<\/title>/)[1],/Analytification and algebraic comparison/);
  const open = await read('/r/NAG-000157/index.html');
  assert.match(description(open),/Open proof obligation/);
  assert.doesNotMatch(description(open),/Closed at the accepted scope|verified theorem|formally proved/i);
  assert.match(open,/<h1>Result 2\.7\.2<\/h1>/);
});

test('The project search interface is crawlable but excluded from search results and sitemaps',async()=>{
  const page = await read(project+'search/index.html');
  assert.match(page,/<meta name="robots" content="noindex,follow">/);
  assert.match(page,/<form[^>]*action="[^"]*\/projects\/foundations\/search\/"/);
  const sitemap = await read('/sitemap.xml');
  assert.doesNotMatch(sitemap,/<loc>[^<]*\/projects\/foundations\/search\/<\/loc>/);
  assert.match(sitemap,/<loc>[^<]*\/r\/NAG-000136\/<\/loc>/);
});
