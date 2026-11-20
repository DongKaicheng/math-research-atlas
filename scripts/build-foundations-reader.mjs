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
    chapters.set(slug, {href, title, entries, position: chapters.size});
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

function makeContentsPage(chapters, fixed, edition) {
  const description = 'Browse the chapters, appendices and supplements of the Non-Archimedean geometry foundations reference.';
  const list = [...chapters.values()].map(({href, title, entries}) => `
    <li><a href="${escapeHtml(href)}">${escapeHtml(title)}</a><small>${entries.length} ${entries.length === 1 ? 'record' : 'records'}</small></li>`).join('');
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
      ${link(project + 'logic/', 'Proof map')}
      ${link(project + 'coverage/', 'Coverage')}
      ${link(fixed + 'reader-en.pdf', 'English PDF')}
    </nav>
  </header>
  <main id="main">
    <nav class="foundations-reader-trail" aria-label="Breadcrumb">
      ${link(project, 'Foundations')}
      <span aria-current="page">Table of contents</span>
    </nav>
    <h1>Table of contents</h1>
    <p>Non-Archimedean geometry foundations · ${link(fixed, 'Fixed edition ' + edition)}</p>
    <ul class="foundations-reader-index">${list}
    </ul>
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
  const graphBytes = contents.get((fixed + 'logic/data.json').slice(1));
  requireReader(graphBytes, 'the edition has no verified proof map');
  const graph = JSON.parse(graphBytes);
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

  return {contentsRoute: foundationsContentsRoute, contentsPage: makeContentsPage(chapters, fixed, edition), decorate};
}
