import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {contentsRoute, coverageRoute, escape, foundationsShell, guideRoute, link, project, topicsRoute} from './foundations-layout.mjs';

export const topicRoute = slug => topicsRoute + slug + '/';
const jsonLD = data => '<script type="application/ld+json">' + JSON.stringify(data).replaceAll('<', '\\u003c') + '</script>';
const requireFact = (condition, message) => { if (!condition) throw Error('Foundations topics: ' + message); };
const isText = value => typeof value === 'string' && value.trim().length > 0 && !/[<>]/.test(value);

export async function loadFoundationsTopics(root, release) {
  if (!release?.current) return null;
  const data = JSON.parse(await readFile(path.join(root, 'content/foundations/topics.json'), 'utf8'));
  requireFact(data.schemaVersion === 1 && /^\d{4}-\d{2}-\d{2}$/.test(data.updatedAt) &&
    new Date(data.updatedAt + 'T00:00:00Z').toISOString().startsWith(data.updatedAt), 'invalid source date');
  requireFact(Array.isArray(data.topics) && data.topics.length > 0, 'missing topic inventory');
  const slugs = new Set();
  const chapters = new Map(release.native.catalogue.map(chapter => [chapter.route, chapter]));
  for (const topic of data.topics) {
    requireFact(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic.slug) && !slugs.has(topic.slug), 'invalid or duplicate topic slug');
    slugs.add(topic.slug);
    requireFact(isText(topic.title) && isText(topic.description) && topic.description.length >= 65 &&
      isText(topic.introduction), 'missing visible topic description: ' + topic.slug);
    requireFact(Array.isArray(topic.keywords) && topic.keywords.length > 0 &&
      topic.keywords.every(isText), 'invalid related terms: ' + topic.slug);
    requireFact(Array.isArray(topic.chapters) && topic.chapters.length >= 2, 'topic needs source chapters: ' + topic.slug);
    const routes = new Set();
    for (const chapter of topic.chapters) {
      requireFact(chapters.get(chapter.route)?.title === chapter.title &&
        isText(chapter.description) && !routes.has(chapter.route), 'unbound source chapter: ' + topic.slug);
      routes.add(chapter.route);
    }
    for (const tag of topic.tags ?? []) {
      requireFact(release.rows.some(row => row.id === tag.id) && isText(tag.description), 'unbound selected Tag: ' + topic.slug);
    }
  }
  for (const topic of data.topics) {
    requireFact(Array.isArray(topic.relatedSlugs) && topic.relatedSlugs.every(slug =>
      slugs.has(slug) && slug !== topic.slug) && new Set(topic.relatedSlugs).size === topic.relatedSlugs.length,
    'invalid related topic: ' + topic.slug);
  }
  return data;
}

export function foundationsTopicLinks(data, url = route => route) {
  if (!data) return '';
  return '<ul class="home-topic-list">' + data.topics.map(topic =>
    '<li>' + link(url(topicRoute(topic.slug)), topic.title) + '</li>').join('') + '</ul>';
}

export async function buildFoundationsTopics({data, output, url, canonical}) {
  if (!data) return {routes: [], searchIndex: [], lastmod: {}};
  const routes = [], searchIndex = [], lastmod = {};
  const bySlug = new Map(data.topics.map(topic => [topic.slug, topic]));
  const breadcrumbs = items => '<nav class="book-crumb" aria-label="Breadcrumb"><ol>' +
    items.map(([href, title]) => '<li>' + (href ? link(url(href), title) :
      '<span aria-current="page">' + escape(title) + '</span>') + '</li>').join('') + '</ol></nav>';
  const schema = (route, title, description, items, terms, trail) => jsonLD({
    '@context': 'https://schema.org',
    '@graph': [
      {'@type': 'CollectionPage', '@id': canonical(route) + '#page', url: canonical(route),
        name: title, description, inLanguage: 'en', dateModified: data.updatedAt,
        isPartOf: {'@id': canonical(project) + '#collection'},
        about: terms.map(name => ({'@type': 'Thing', name})),
        mainEntity: {'@type': 'ItemList', itemListElement: items.map((item, index) =>
          ({'@type': 'ListItem', position: index + 1, name: item.title, url: canonical(item.route)}))}},
      {'@type': 'BreadcrumbList', itemListElement: trail.map(([href, name], index) =>
        ({'@type': 'ListItem', position: index + 1, name, item: canonical(href)}))}
    ]
  });
  async function save(route, title, description, body, extra, keywords) {
    const directory = path.join(output, route.slice(1));
    await mkdir(directory, {recursive: true});
    await writeFile(path.join(directory, 'index.html'), foundationsShell(route, title, body,
      {url, canonical: canonical(route), description, extra, layout: 'topics-page'}), {flag: 'wx'});
    routes.push(route);
    lastmod[route] = data.updatedAt;
    searchIndex.push({title, summary: description, keywords, link: url(route), project: 'foundations',
      category: 'topic', body: description + ' ' + keywords.join(' ')});
  }

  const indexTitle = 'Non-Archimedean geometry topics';
  const indexDescription = 'Explore Berkovich spaces, affinoid algebras, tropical geometry, differential forms, currents and metrics through the OpenMath Foundations chapters and NAG Tags.';
  const cards = '<ul class="topic-grid">' + data.topics.map(topic =>
    '<li><h2>' + link(url(topicRoute(topic.slug)), topic.title) + '</h2><p>' +
      escape(topic.description) + '</p></li>').join('') + '</ul>';
  const indexBody = breadcrumbs([[project, 'Foundations'], [null, 'Topics']]) +
    '<header class="page-intro"><h1>' + indexTitle + '</h1><p class="page-lead">Find a subject, then follow its definitions, statements and arguments in the book.</p></header>' +
    '<p class="topic-introduction">These reading guides connect common mathematical terms to the current Foundations chapters. Permanent NAG Tags carry the precise hypotheses and proof status of individual entries.</p>' + cards;
  await save(topicsRoute, indexTitle, indexDescription, indexBody,
    schema(topicsRoute, indexTitle, indexDescription, data.topics.map(topic =>
      ({route: topicRoute(topic.slug), title: topic.title})), ['Non-Archimedean geometry'],
    [[project, 'Foundations'], [topicsRoute, 'Topics']]), data.topics.flatMap(topic => topic.keywords));

  for (const topic of data.topics) {
    const route = topicRoute(topic.slug);
    const chapters = '<ol class="topic-reading-list">' + topic.chapters.map(chapter =>
      '<li><h3>' + link(url(chapter.route), chapter.title) + '</h3><p>' +
        escape(chapter.description) + '</p></li>').join('') + '</ol>';
    const tags = topic.tags?.length ? '<section><h2>Selected NAG Tags</h2><ul>' + topic.tags.map(tag =>
      '<li>' + link(url('/r/' + tag.id + '/'), tag.id) + ' — ' + escape(tag.description) + '</li>').join('') + '</ul></section>' : '';
    const related = topic.relatedSlugs.map(slug => link(url(topicRoute(slug)), bySlug.get(slug).title)).join(' · ');
    const body = breadcrumbs([[project, 'Foundations'], [topicsRoute, 'Topics'], [null, topic.title]]) +
      '<header class="page-intro"><h1>' + escape(topic.title) + '</h1><p class="page-lead">' + escape(topic.description) + '</p></header>' +
      '<article><p class="topic-introduction">' + escape(topic.introduction) + '</p>' +
      '<p class="topic-terms"><strong>Related terms:</strong> ' + escape(topic.keywords.join('; ')) + '.</p>' +
      '<section aria-labelledby="topic-reading"><h2 id="topic-reading">Read in the Foundations</h2>' + chapters + '</section>' + tags +
      '<section><h2>Related topics</h2><p class="topic-related">' + related + '</p></section></article>' +
      '<footer class="topic-footer"><p>For exact hypotheses, arguments and current proof status, follow the NAG Tags in each chapter.</p>' +
      '<nav class="page-links" aria-label="Continue reading">' + link(url(contentsRoute), 'Table of contents') +
        link(url(coverageRoute), 'NAG Tag index') + link(url(guideRoute), 'Reading guide') + '</nav></footer>';
    await save(route, topic.title, topic.description, body,
      schema(route, topic.title, topic.description, topic.chapters, topic.keywords,
        [[project, 'Foundations'], [topicsRoute, 'Topics'], [route, topic.title]]), topic.keywords);
  }
  return {routes, searchIndex, lastmod};
}
