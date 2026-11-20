import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const base = (process.env.SITE_BASE_PATH ?? '/math-research-atlas').replace(/\/$/, '');
const origin = (process.env.SITE_ORIGIN ?? 'https://dongkaicheng.github.io/math-research-atlas').replace(/\/$/, '');
const topicRoot = '/projects/foundations/topics/';
const read = route => readFile(path.join(dist, route.replace(/^\//, '')), 'utf8');
const config = JSON.parse(await readFile(path.join(root, 'content/foundations/topics.json'), 'utf8'));
const xmlURLs = xml => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);

test('Topic guides are static, substantive pages linked to the actual chapter routes', async () => {
  const home = await read('/projects/foundations/index.html');
  const index = await read(topicRoot + 'index.html');
  assert.ok(home.includes('href="' + base + topicRoot + '"'));
  for (const topic of config.topics) {
    const route = topicRoot + topic.slug + '/';
    const html = await read(route + 'index.html');
    assert.ok(home.includes('href="' + base + route + '"'), topic.slug);
    assert.ok(index.includes('href="' + base + route + '"'), topic.slug);
    assert.ok(html.includes('<link rel="canonical" href="' + origin + route + '"'), topic.slug);
    assert.ok(html.includes(topic.description.replaceAll('&', '&amp;')), topic.slug);
    assert.doesNotMatch(html, /name="robots" content="noindex|name="keywords"/);
    assert.ok(topic.introduction.split(/\s+/).length >= 80, topic.slug);
    for (const chapter of topic.chapters) {
      assert.ok(html.includes('href="' + base + chapter.route + '"'), topic.slug);
      assert.match(await read(chapter.route + 'index.html'), /<article class="book-text"/);
    }
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
    const page = data['@graph'].find(item => item['@type'] === 'CollectionPage');
    assert.equal(page.url, origin + route);
    assert.equal(page.name, topic.title);
    assert.deepEqual(page.mainEntity.itemListElement.map(item => item.url), topic.chapters.map(chapter => origin + chapter.route));
    assert.ok(data['@graph'].some(item => item['@type'] === 'BreadcrumbList'));
  }
});

test('Topic and Foundations sitemaps contain canonical current pages and preserve source dates', async () => {
  const main = xmlURLs(await read('/sitemap.xml'));
  const foundation = xmlURLs(await read('/sitemap-foundations.xml'));
  const topicsXML = await read('/sitemap-topics.xml');
  const topics = xmlURLs(topicsXML);
  assert.equal(topics.length, config.topics.length + 1);
  assert.equal(new Set(main).size, main.length);
  for (const url of topics) {
    assert.ok(main.includes(url), url);
    assert.ok(foundation.includes(url), url);
  }
  assert.ok(foundation.includes(origin + '/r/NAG-000136/'));
  assert.ok(!foundation.some(url => /\/(?:search|editions)\//.test(url)));
  assert.equal([...topicsXML.matchAll(/<lastmod>/g)].length, topics.length);
  assert.ok(topicsXML.includes('<lastmod>' + config.updatedAt + '</lastmod>'));
  const robots = await read('/robots.txt');
  for (const name of ['sitemap-foundations.xml', 'sitemap-topics.xml']) {
    assert.ok(robots.includes('Sitemap: ' + origin + '/' + name));
  }
});
