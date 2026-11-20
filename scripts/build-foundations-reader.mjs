import {feedbackIssueUrl} from '../lib/feedback.mjs';
import {foundationsBookRoute, foundationsDependenciesRoute} from './build-foundations-web.mjs';

const project = '/projects/foundations/';
export const foundationsContentsRoute = project + 'contents/';
const search = '/search/?project=foundations';
const stylesheet = '/assets/foundations-reader.css';

const chapterFile = /^projects\/foundations\/chapters\/([a-z0-9-]+)\/index\.html$/;
const recordFile = /^r\/(NAG-[0-9]{6})\/index\.html$/;
const chapterListing = /<li class="entry"><a href="\/projects\/foundations\/chapters\/([a-z0-9-]+)\/">[^<]+<\/a><small>(\d+) records<\/small><\/li>/g;
const recordListing = /<li class="entry"><small>(NAG-[0-9]{6})<\/small><a href="\/r\/\1\/"/g;

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => (
  {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]
));
const link = (href, title) => `<a href="${escapeHtml(href)}">${escapeHtml(title)}</a>`;

export function foundationsHome({release, title, trail, history, url, repository}) {
  const {current, rows} = release;
  const fixed = project + 'editions/' + current.edition + '/';
  const coverage = project + 'coverage/';
  const context = {project: current.project, version: current.edition, page: url(project)};
  const feedback = url('/feedback/') + '?' + new URLSearchParams(context);
  const suggestion = feedbackIssueUrl(repository, 'suggestion', context);
  const localLink = (route, label) => link(url(route), label);
  const [proof, gap] = ['NAG-002462', 'NAG-002405'].map(id => rows.find(row => row.id === id));
  requireReader(proof && gap, 'the homepage examples must belong to the published edition');
  const earlier = history.map(({revision}) =>
    localLink(project + 'versions/' + revision + '/', 'Version ' + revision)).join(' · ');

  return `<main id="main-content" class="wrap foundations-home">
    ${trail}
    <header class="foundations-home-header">
      <h1>${escapeHtml(title)}</h1>
      <p class="foundations-home-deck">A reference for definitions, theorems and proofs in non-Archimedean geometry, organized by chapter and searchable by permanent NAG number.</p>
      <p class="foundations-home-version">Version ${current.revision} · ${escapeHtml(current.edition)}</p>
      <nav class="foundations-home-nav" aria-label="Foundations project navigation">
        <a class="button button-dark" href="${escapeHtml(url(foundationsContentsRoute))}">Table of contents</a>
        ${link('#foundations-query', 'Search')}
        ${localLink(foundationsDependenciesRoute, 'Tag dependencies')}
        ${localLink(coverage, 'Coverage and gaps')}
        ${localLink(foundationsBookRoute, 'Web reader')}
        ${link('#editions', 'Editions')}
        ${link('#feedback', 'Feedback')}
      </nav>
      <form class="foundations-reading-search" action="${escapeHtml(url('/search/'))}" method="get" role="search" aria-label="Search Foundations">
        <input type="hidden" name="project" value="${escapeHtml(current.project)}">
        <label for="foundations-query">Search Foundations</label>
        <div><input type="search" id="foundations-query" name="q" placeholder="Keyword or ${proof.id}" maxlength="200" required><button class="button button-dark" type="submit">Search</button></div>
      </form>
    </header>

    <section id="motivation" class="foundations-home-section">
      <h2>About the project</h2>
      <div>
        <p id="questions">This project brings together existing mathematics in non-Archimedean geometry. It organizes definitions, results and proofs into a shared reference that readers can study, cite and build on.</p>
        <p>We maintain the reference openly to support mathematical exchange and contributions to shared knowledge. Readers are welcome to clarify an argument, suggest a reference or contribute mathematics through the project’s public discussion.</p>
      </div>
    </section>

    <section id="results" class="foundations-home-section">
      <h2>How to use the reference</h2>
      <div>
        <ol class="foundations-home-guide">
          <li><strong>Read by chapter.</strong> Open the ${localLink(foundationsContentsRoute, 'table of contents')} and use the previous and next links to read through a chapter.</li>
          <li><strong>Find a result.</strong> ${link('#foundations-query', 'Search by keyword or NAG number')}. Open the record to see its status and available proof sources. The citation gives both the permanent link and the fixed-edition link.</li>
          <li><strong>Trace an argument.</strong> Use the ${localLink(foundationsDependenciesRoute, 'Tag dependency map')} to explore dependencies by chapter. Each Tag has a separate diagram with its registered inputs and uses.</li>
        </ol>
        <p>Start with ${localLink(proof.link, proof.id + ' · ' + proof.title)} to read a complete selected proof. The linked record ${localLink(gap.link, gap.id + ' · ' + gap.title)} documents a historical proof gap in the broader argument.</p>
      </div>
    </section>

    <section id="programme" class="foundations-home-section">
      <h2 id="editions">Reading edition and archive</h2>
      <div>
        <p>${localLink(foundationsBookRoute, 'Read the full edition on the web')}. The ${localLink(fixed, 'fixed Version ' + current.revision + ' edition')} remains available for exact citations.</p>
        ${earlier ? `<p>Earlier edition · ${earlier}</p>` : ''}
      </div>
    </section>

    <section id="feedback" class="foundations-home-section">
      <h2>Feedback and suggestions</h2>
      <div>
        <p>We welcome corrections to statements and proofs, references that could help resolve an open step, and suggestions for making the chapters easier to read or navigate. For comments on a result, include its NAG number, the relevant passage or link, and the change you propose.</p>
        <div class="foundations-home-actions">
          <a class="button button-dark" href="${escapeHtml(feedback)}">Open the feedback board</a>
          ${link(suggestion, 'Suggest an improvement on GitHub')}
        </div>
        <p>${localLink(project + 'acknowledgements/', 'Acknowledgements and adopted contributions')}</p>
      </div>
    </section>
  </main>`;
}

function requireReader(condition, message) {
  if (!condition) throw Error('Foundations reading navigation: ' + message);
}

function indexChapters(contents, rows, chapterTitles) {
  const homepage = contents.get(project.slice(1) + 'index.html').toString('utf8');
  const records = new Map(rows.map(row => [row.id, row]));
  const membership = new Map();
  const chapters = new Map();

  for (const [, slug, count] of homepage.matchAll(chapterListing)) {
    const href = project + 'chapters/' + slug + '/';
    const chapter = contents.get(href.slice(1) + 'index.html');
    const title = chapterTitles[slug];
    requireReader(chapter && title && !chapters.has(slug), 'invalid chapter ' + slug);

    const entries = [...chapter.toString('utf8').matchAll(recordListing)].map(([, id], position) => {
      requireReader(records.has(id) && !membership.has(id), 'chapter membership for ' + id);
      membership.set(id, {slug, position});
      return records.get(id);
    });
    requireReader(entries.length === Number(count), 'chapter record count for ' + slug);
    chapters.set(slug, {slug, href, title, entries, position: chapters.size});
  }
  requireReader(chapters.size === Object.keys(chapterTitles).length, 'chapter inventory differs from the proof map');
  requireReader(membership.size === records.size, 'record inventory differs from the search index');
  return {chapters, records, membership};
}

function indexRegisteredUses({arguments: argumentsByKey, nodes}) {
  const uses = new Map();
  for (const [consumerKey, argument] of Object.entries(argumentsByKey)) {
    const consumer = nodes[consumerKey];
    for (const {key} of argument.inputs) {
      const input = nodes[key];
      if (input.id === consumer.id) continue;
      if (!uses.has(input.id)) uses.set(input.id, []);
      const use = {consumer, input: key === input.id ? null : input};
      uses.get(input.id).push(use);
    }
  }
  return uses;
}

function makeContentsPage(chapters, graph, fixed, edition) {
  const description = 'Browse the chapters, appendices and supplements of the Non-Archimedean geometry foundations reference.';
  const publishedChapters = [...chapters.values()];
  const logicChapters = new Set([...Object.values(graph.arguments), ...Object.values(graph.gaps)].map(row => row.chapter));
  const groups = [
    ['chapters', 'Chapters', publishedChapters.filter(row => /^\d+$/.test(row.slug))],
    ['appendices', 'Appendices', publishedChapters.filter(row => row.slug.startsWith('appendix-'))],
    ['supplements', 'Chapter supplements', publishedChapters.filter(row => /-supplement-/.test(row.slug))],
    ['unlocated', 'Records without a chapter binding', publishedChapters.filter(row => row.slug === 'unlocated')],
  ];
  requireReader(groups.reduce((count, [, , group]) => count + group.length, 0) === chapters.size,
    'every published chapter must appear in the contents');
  const sections = groups.filter(([, , group]) => group.length);
  const outline = sections.map(([id, title, group]) => `
    <section class="foundations-contents-section" id="${id}">
      <h2>${escapeHtml(title)}</h2>
      <ul class="foundations-reader-index">
        ${group.map(row => {
          const count = row.entries.length;
          const countLabel = count ? count + (count === 1 ? ' record' : ' records') : 'Chapter outline';
          const proofLink = logicChapters.has(row.slug)
            ? `<a href="${project}logic/chapters/${row.slug}/" aria-label="Proof inputs for ${escapeHtml(row.title)}">Proof inputs</a>`
            : '';
          return `<li>${link(row.href, row.title)}<span class="foundations-contents-links"><small>${countLabel}</small>${proofLink}</span></li>`;
        }).join('')}
      </ul>
    </section>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="foundations-edition" content="${escapeHtml(edition)}">
  <link rel="canonical" href="${foundationsContentsRoute}">
  <link rel="stylesheet" href="${fixed}reader.css">
  <link rel="stylesheet" href="${stylesheet}">
  <title>Table of contents · OpenMath Foundations</title>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header>
    <nav aria-label="Foundations">
      <a class="brand" href="${project}">OpenMath <span>Foundations</span></a>
      ${link(search, 'Search Foundations')}
      ${link(foundationsDependenciesRoute, 'Tag dependencies')}
      ${link(project + 'coverage/', 'Coverage')}
      ${link(foundationsBookRoute, 'Web reader')}
    </nav>
  </header>
  <main id="main">
    <nav class="foundations-reader-trail" aria-label="Breadcrumb">
      ${link(project, 'Foundations')}
      <span aria-current="page">Table of contents</span>
    </nav>
    <h1>Table of contents</h1>
    <p>Non-Archimedean geometry foundations · ${link(fixed, 'Fixed edition ' + edition)}</p>
    <nav class="foundations-contents-shortcuts" aria-label="Contents sections">${sections.map(([id, title]) => link('#' + id, title)).join('')}</nav>
    ${outline}
  </main>
  <footer>${link(project, 'OpenMath Foundations')}</footer>
</body>
</html>`;
}

function breadcrumb(chapter, record) {
  const parent = record
    ? link(chapter.href, chapter.title) + `<span aria-current="page">${record.id}</span>`
    : `<span aria-current="page">${escapeHtml(chapter.title)}</span>`;
  return `<nav class="foundations-reader-trail" aria-label="Breadcrumb">
    ${link(foundationsContentsRoute, 'Table of contents')}${parent}
  </nav>`;
}

function pageNavigation(previous, next, kind) {
  function adjacent(item, direction, label) {
    if (!item) return '';
    const name = item.id ? item.id + ' · ' + item.title : item.title;
    return `<a rel="${direction}" href="${escapeHtml(item.link ?? item.href)}">
      <small>${label} ${kind}</small><span>${escapeHtml(name)}</span>
    </a>`;
  }
  if (!previous && !next) return '';
  return `<nav class="foundations-reader-steps" aria-label="${kind === 'chapter' ? 'Chapter' : 'Record'} navigation">
    ${adjacent(previous, 'prev', 'Previous')}${adjacent(next, 'next', 'Next')}
  </nav>`;
}

function citation(record, edition, revision, fixed) {
  return `<details id="citation" class="foundations-reader-citation">
    <summary>Cite this record</summary>
    <p>OpenMath, <cite>Non-Archimedean geometry foundations</cite>, Version ${revision} (${escapeHtml(edition)}),
      ${record.id}, “${escapeHtml(record.title)}”.</p>
    <p>${link(record.link, 'Permanent link')} · ${link(fixed + record.link.slice(1), 'Fixed-edition record')}</p>
  </details>`;
}

function backlinks(uses = []) {
  if (!uses.length) return '';
  const list = uses.map(({consumer, input}) => `<li>
    ${link(consumer.href, consumer.id + ' · ' + consumer.label)}
    ${input ? '<small>Uses ' + link(input.href, input.label) + '</small>' : ''}
  </li>`).join('');
  return `<details id="registered-uses" class="foundations-reader-uses">
    <summary>Registered uses (${uses.length})</summary>
    <p>The proof map records this result or a linked clause among the inputs to these arguments.</p>
    <ul>${list}</ul>
  </details>`;
}

function decoratePage(text, trail, pagination, references = '') {
  const markers = ['</head>', '<main id="main">', '</h1>', '</main>', '<a href="/search/">Search</a>'];
  requireReader(markers.every(marker => text.includes(marker)), 'reader page structure differs from the checked projection');
  return text
    .replace('</head>', `<link rel="stylesheet" href="${stylesheet}"></head>`)
    .replace('<a href="/search/">Search</a>', link(foundationsContentsRoute, 'Contents') + link(search, 'Search'))
    .replace('<main id="main">', '<main id="main">' + trail)
    .replace('</h1>', '</h1>' + pagination)
    .replace('</main>', references + '</main>');
}

export function createFoundationsReader(release) {
  const {contents, rows} = release;
  const {edition, revision} = release.manifest;
  const fixed = project + 'editions/' + edition + '/';
  const graph = release.graph;
  const {chapters, records, membership} = indexChapters(contents, rows, graph.chapters);
  const chapterOrder = [...chapters.values()];
  const uses = indexRegisteredUses(graph);

  function decorate(name, text) {
    const chapterMatch = chapterFile.exec(name);
    if (chapterMatch) {
      const chapter = chapters.get(chapterMatch[1]);
      requireReader(chapter, 'chapter missing from the contents ' + name);
      const {position} = chapter;
      const pagination = pageNavigation(chapterOrder[position - 1], chapterOrder[position + 1], 'chapter');
      return decoratePage(text, breadcrumb(chapter), pagination);
    }
    const recordMatch = recordFile.exec(name);
    if (!recordMatch) return text;
    const id = recordMatch[1];
    const record = records.get(id);
    const {slug, position} = membership.get(id);
    const chapter = chapters.get(slug);
    const pagination = pageNavigation(chapter.entries[position - 1], chapter.entries[position + 1], 'record');
    const references = citation(record, edition, revision, fixed) + backlinks(uses.get(id));
    return decoratePage(text, breadcrumb(chapter, record), pagination, references);
  }

  return {contentsRoute: foundationsContentsRoute, contentsPage: makeContentsPage(chapters, graph, fixed, edition), chapterById: membership, decorate};
}
