import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { researchBranches, validateResearchMap } from '../strong-green/views/content/research-map.mjs';
import { globalRoutes } from '../strong-green/views/content/routes.mjs';
import { programmeSteps } from '../strong-green/views/content/programme.mjs';
import { pairingGroups } from '../strong-green/views/content/pairing-progress.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = file => readFile(path.join(root, 'dist', file), 'utf8');
const { revision } = JSON.parse(await readFile(path.join(root, 'content/strong-green/current.json'), 'utf8'));
const { entries } = JSON.parse(await readFile(path.join(root, 'content/strong-green/releases', revision, 'bundle.json'), 'utf8'));
const mapPath = 'projects/strong-green/research-map/index.html';
const prefix = '/math-research-atlas/projects/strong-green';

test('The reading tree covers each current record once and keeps its original status', async () => {
  validateResearchMap(entries);
  const html = await read(mapPath);
  const found = [...html.matchAll(/data-record-id="([^"]+)" data-status="([^"]+)"/g)].map(match => [match[1], match[2]]);
  assert.equal(found.length, entries.length);
  assert.deepEqual(new Map(found), new Map(entries.map(entry => [entry.id, entry.status])));
  assert.match(html, /Branches group related topics for reading/);
  assert.match(html, /Internal proof available/);
  assert.match(html, /Draft · audit pending/);
  for (const entry of entries) assert.ok(html.includes(`href="${prefix}/entries/${entry.id}/"`), entry.id);
});

test('A future added record cannot silently disappear from the reading tree', () => {
  assert.throws(() => validateResearchMap([...entries, { id: 'NEW-RECORD' }]), /Records missing/);
  const changed = structuredClone(researchBranches);
  changed[0].groups[0].records.push(entries[0].id);
  assert.throws(() => validateResearchMap(entries, changed), /Repeated research-map record/);
});

test('Routes, geometric cases, applications and all programme steps remain linked', async () => {
  const html = await read(mapPath);
  for (const route of globalRoutes) assert.ok(html.includes(`href="${prefix}/routes/${route.slug}/"`), route.slug);
  for (const group of pairingGroups) for (const item of group.cases) {
    assert.ok(html.includes(`href="${prefix}/results/#${item.id}"`), item.id);
    assert.ok(html.includes(item.status));
    for (const child of item.children || []) assert.ok(html.includes(child.title), child.title);
  }
  for (const step of programmeSteps) assert.ok(html.includes(`href="${prefix}/programme/#${step.id}"`), step.id);
});

test('Research map is in current navigation, the homepage, search and sitemap', async () => {
  const html = await read(mapPath);
  assert.ok(html.includes(`href="${prefix}/research-map/" aria-current="page">Research map</a>`));
  assert.ok((await read('projects/strong-green/index.html')).includes('class="home-map-link"'));
  const search = JSON.parse(await read('search-index.json'));
  const record = search.find(item => item.link === prefix + '/research-map/');
  assert.ok(record);
  assert.ok(record.body.includes('OPEN-RESIDUAL-NC'));
  assert.match(await read('sitemap.xml'), /<loc>https:\/\/dongkaicheng\.github\.io\/math-research-atlas\/projects\/strong-green\/research-map\/<\/loc>/);
  assert.ok(html.includes('version=' + revision + '&amp;page=' + encodeURIComponent('https://dongkaicheng.github.io' + prefix + '/research-map/')));
});

test('The map is usable static HTML and does not extend or restyle the frozen edition', async () => {
  const html = await read(mapPath);
  assert.ok(html.includes('<details class="map-branch"'));
  assert.ok(html.includes('<details class="map-group"'));
  assert.ok(html.includes('Based on mathematical edition'));
  assert.ok(html.includes(`href="${prefix}/assets/research-map.css"`));
  assert.ok(html.includes(`src="${prefix}/assets/research-map.js"`));
  await assert.rejects(read(`projects/strong-green/editions/${revision}/research-map/index.html`), { code: 'ENOENT' });
  const frozen = await read(`projects/strong-green/editions/${revision}/index.html`);
  assert.doesNotMatch(frozen, /research-map/);
  assert.equal(frozen, await readFile(path.join(root, 'public/projects/strong-green/editions', revision, 'index.html'), 'utf8'));
});
