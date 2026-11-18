import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {containsPersonalIdentity, decodeText} from '../scripts/check-bedford-taylor-release.mjs';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const base = '/math-research-atlas';
const project = '/projects/bedford-taylor';
const route = project + '/map/';
const origin = 'https://dongkaicheng.github.io';
const mapURL = origin + base + route;
const json = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const pointer = await json('content/bedford-taylor/current.json');
const map = await json('content/bedford-taylor/research-map.json');
const frozen = project + '/editions/' + pointer.revision;
const source = 'public' + frozen + '/data/';
const topics = await json(source + 'topics.json');
const programme = (await json(source + 'programme.json')).items;
const definitions = (await json(source + 'definitions.json')).definitions;
const readPage = relative => readFile(path.join(dist, relative.replace(/^\//, '')), 'utf8');
const mapHTML = () => readPage(route + 'index.html');
const plain = html => decodeText(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
// Decode HTML attributes without decoding percent escapes inside feedback URLs.
const attributeText = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attributes = (html, name = '(?:href|src)') => [...html.matchAll(new RegExp('\\b' + name + '="([^"]+)"', 'g'))].map(m => attributeText(m[1]));
const sorted = values => [...values].sort();

test('The research tree covers the exact edition without losing or duplicating primary topic records', () => {
  assert.equal(map.project, 'bedford-taylor');
  assert.equal(map.edition, pointer.revision);
  assert.equal(map.relation, 'navigation', 'The reading hierarchy is not a proof-dependency assertion');
  const assigned = map.branches.flatMap(branch => branch.topicIds);
  assert.deepEqual(sorted(assigned), sorted(topics.map(item => item.id)));
  assert.equal(new Set(assigned).size, assigned.length, 'Each topic has one primary branch');
  assert.deepEqual(sorted(new Set(map.branches.flatMap(branch => branch.programmeIds))), sorted(programme.map(item => item.id)));
  const topicIDs = new Set(topics.map(item => item.id));
  const programmeIDs = new Set(programme.map(item => item.id));
  const definitionIDs = new Set(definitions.map(item => item.id));
  const nodes = map.branches.flatMap(branch => branch.nodes);
  assert.deepEqual(sorted(new Set(nodes.flatMap(node => node.topicIds))), sorted(topicIDs));
  assert.deepEqual(sorted(new Set(nodes.flatMap(node => node.programmeIds))), sorted(programmeIDs));
  for (const branch of map.branches) {
    for (const id of branch.definitionIds) assert.ok(definitionIDs.has(id), 'Unknown definition: ' + id);
    for (const node of branch.nodes) {
      for (const id of node.topicIds) assert.ok(topicIDs.has(id), 'Unknown topic: ' + id);
      for (const id of node.programmeIds) assert.ok(programmeIDs.has(id), 'Unknown programme item: ' + id);
      assert.ok(node.topicIds.length + node.programmeIds.length + node.links.length > 0, node.id + ' has no source destination');
    }
  }
  assert.ok(programme.every(item => item.status === 'OPEN'), 'The formal programme has not been promoted to proved results');
});

test('Rendered research records preserve source titles and mathematical status labels', async () => {
  const html = await mapHTML();
  const text = plain(html);
  assert.match(html, new RegExp('data-map-edition="' + pointer.revision.replaceAll('.', '\\.') + '"'));
  for (const branch of map.branches) for (const node of branch.nodes) {
    assert.ok(text.includes(plain(node.summary)), node.id + ' current scope-qualified summary');
  }
  assert.ok(text.includes(plain(map.readingNote)), 'Navigation and implication remain distinct');
  assert.ok(text.includes(plain(map.scopeNote)), 'Ambient scope remains visible');
  const rows = [...html.matchAll(/<li\b(?=[^>]*\bdata-map-record="([^"]+)")[^>]*>[\s\S]*?<\/li>/g)];
  assert.deepEqual(sorted(rows.map(row => row[1])), sorted(topics.map(item => item.id)));
  for (const topic of topics) {
    const row = rows.find(row => row[1] === topic.id)[0];
    assert.match(row, new RegExp('data-source-status="' + topic.sourceStatusCode + '"'), topic.id);
    assert.ok(plain(row).includes(plain(topic.sourceStatus)), topic.id + ' exact source status');
    assert.ok(plain(row).includes(plain(topic.title)), topic.id + ' source title');
    const expected = topic.url.replace(base + frozen, base + project);
    assert.ok(attributes(row, 'href').includes(expected), topic.id + ' statement destination');
  }
  for (const item of programme) {
    const tags = [...html.matchAll(/<[^>]+\bdata-map-programme="([^"]+)"[^>]*>/g)].filter(match => match[1] === item.id);
    assert.ok(tags.length > 0, 'Missing formal programme item: ' + item.id);
    for (const tag of tags) assert.match(tag[0], /\bdata-programme-status="OPEN"/, item.id + ' remains open');
    assert.ok(plain(html).includes(item.mpmId), item.id + ' permanent identity');
    const expected = item.paperLink.href.replace(base + frozen, base + project);
    assert.ok(attributes(html, 'href').includes(expected), item.id + ' exact formal statement');
  }
});

test('Every research-map link resolves to a public page, file or existing section anchor', async () => {
  const html = await mapHTML();
  const cache = new Map();
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => attributeText(match[1]));
  assert.equal(new Set(ids).size, ids.length, 'Tree anchors must be unique');
  for (const href of attributes(html)) {
    if (/^(?:mailto:|data:|tel:)/.test(href)) continue;
    const url = new URL(href, mapURL);
    if (url.origin !== origin) continue;
    assert.ok(url.pathname.startsWith(base + '/'), 'Incorrect Pages subpath: ' + href);
    let target = decodeURIComponent(url.pathname.slice(base.length));
    if (target.endsWith('/')) target += 'index.html';
    else if (!path.extname(target)) target += '/index.html';
    const file = path.join(dist, target.replace(/^\//, ''));
    assert.ok((await stat(file)).isFile(), 'Missing map destination: ' + href);
    if (url.hash && target.endsWith('.html')) {
      if (!cache.has(file)) cache.set(file, new Set([...(await readFile(file, 'utf8')).matchAll(/\bid="([^"]+)"/g)].map(match => attributeText(match[1]))));
      assert.ok(cache.get(file).has(decodeURIComponent(url.hash.slice(1))), 'Missing map section: ' + href);
    }
  }
});

test('The independent research map is reachable from project navigation, the homepage, search and sitemap', async () => {
  const html = await mapHTML();
  for (const page of ['/index.html', '/conjectures/index.html', '/results/index.html', '/papers/research-program/index.html']) {
    const source = await readPage(project + page);
    const nav = source.match(/<nav\b[^>]*id="primary-navigation"[^>]*>[\s\S]*?<\/nav>/)?.[0];
    assert.ok(nav, 'Project navigation exists: ' + page);
    assert.ok(attributes(nav, 'href').includes(base + route), 'Map navigation: ' + page);
    assert.match(plain(nav), /Research map/);
  }
  const homepage = await readPage(project + '/index.html');
  const main = homepage.match(/<main\b[\s\S]*?<\/main>/)?.[0];
  assert.ok(main && attributes(main, 'href').includes(base + route), 'Prominent homepage map link');
  const mapNav = html.match(/<nav\b[^>]*id="primary-navigation"[^>]*>[\s\S]*?<\/nav>/)?.[0];
  const currentLinks = [...mapNav.matchAll(/<a\b(?=[^>]*aria-current="page")[^>]*>[\s\S]*?<\/a>/g)];
  assert.equal(currentLinks.length, 1);
  assert.equal(plain(currentLinks[0][0]), 'Research map');
  assert.ok(attributes(currentLinks[0][0], 'href').includes(base + route));
  const canonical = html.match(/<link\b(?=[^>]*rel="canonical")[^>]*>/)?.[0];
  assert.deepEqual(attributes(canonical || '', 'href'), [mapURL]);
  assert.doesNotMatch(html, /<meta\b[^>]*name="robots"[^>]*noindex/);
  assert.ok((await readPage('/sitemap.xml')).includes('<loc>' + mapURL + '</loc>'));
  const search = JSON.parse(await readPage('/search-index.json'));
  assert.ok(search.some(item => item.link === base + route), 'Searchable map page');
});

test('Map feedback keeps the real current map and branch hash without inventing a frozen map or theorem', async () => {
  const html = await mapHTML();
  const feedbackTags = [...html.matchAll(/<a\b(?=[^>]*\bdata-atlas-feedback\b)[^>]*>/g)].map(match => match[0]);
  assert.ok(feedbackTags.length > 0);
  const links = feedbackTags.map(tag => ({href: new URL(attributes(tag, 'href')[0], origin).href}));
  for (const link of links) {
    const url = new URL(link.href);
    assert.equal(url.pathname, base + '/feedback/');
    assert.equal(url.searchParams.get('project'), 'bedford-taylor');
    assert.equal(url.searchParams.get('version'), pointer.revision);
    assert.equal(url.searchParams.get('page'), mapURL);
    assert.equal(url.searchParams.has('entry'), false);
  }
  const script = await readFile(path.join(root, 'public' + frozen + '/assets/atlas-feedback.js'), 'utf8');
  const events = new Map();
  const location = {hash: '#' + map.branches[0].id};
  vm.runInNewContext(script, {URL, location, decodeURIComponent, document: {querySelectorAll: () => links}, addEventListener: (type, listener) => events.set(type, listener)});
  for (const link of links) {
    const context = new URL(link.href).searchParams;
    assert.equal(context.get('page'), mapURL + location.hash);
    assert.equal(context.has('entry'), false, 'A branch is not a registered theorem');
  }
  location.hash = '';
  events.get('hashchange')();
  assert.ok(links.every(link => new URL(link.href).searchParams.get('page') === mapURL));
  assert.doesNotMatch(html, /\/api\/feedback|data-source-feedback/, 'One shared feedback system');
});

test('The research map stays unsigned and retains only the declared public reading corpus', async () => {
  const html = await mapHTML();
  assert.equal(containsPersonalIdentity(JSON.stringify(map)), false);
  assert.equal(containsPersonalIdentity(html), false);
  assert.doesNotMatch(html, /\b(?:\/workspace\/|\/home\/agent\/)/);
  assert.doesNotMatch(html, /class="byline"/);
});
