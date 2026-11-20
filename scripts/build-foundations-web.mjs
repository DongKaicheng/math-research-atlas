const project = '/projects/foundations/';
export const foundationsBookRoute = project + 'reader/';
export const foundationsDependenciesRoute = project + 'logic/full/';
const tagPath = id => '/r/' + id + '/';
const tagGraph = id => tagPath(id) + 'logic/';
const normalizedKey = key => key.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
const proofAnchor = key => 'proof-' + normalizedKey(key);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = (href, label) => '<a href="' + esc(href) + '">' + esc(label) + '</a>';
const count = value => value.toLocaleString('en-US');

function shell(route, title, body, fixed, head = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} · OpenMath Foundations</title><link rel="canonical" href="${route}">
  <link rel="stylesheet" href="${fixed}reader.css"><link rel="stylesheet" href="/assets/foundations-web.css">${head}</head>
  <body><a class="skip" href="#main">Skip to content</a><header><nav aria-label="Foundations">
  ${link(project,'Project home')}${link(project+'contents/','Table of contents')}${link(foundationsBookRoute,'Web reader')}
  ${link('/search/?project=foundations','Find a Tag')}${link(foundationsDependenciesRoute,'Tag dependencies')}
  </nav></header><main id="main">${body}</main></body></html>`;
}

function bookTarget(href) {
  const hash = href.split('#')[1];
  if (hash?.startsWith('nameddest=')) return foundationsBookRoute + '?dest=' + hash.slice(10);
  if (hash?.startsWith('page=')) return foundationsBookRoute + '?' + hash;
  return foundationsBookRoute;
}

function labelNode(key, node) {
  return key === node.id ? key + ' · ' + node.label : node.label + ' (' + key + ')';
}

function proofPage(row, graph, argumentsForTag, consumers, book, fixed) {
  const diagramLink = key => {
    const node = graph.nodes[key];
    return link(tagGraph(node.id) + (graph.arguments[key] ? '#' + proofAnchor(key) : ''), labelNode(key, node));
  };
  const summary = `<h1>Proof dependencies for ${esc(row.id)}</h1><p>${esc(row.title)}</p>
  <nav class="tag-actions" aria-label="This Tag">${link(row.link,'Read the Tag')}
  ${book ? link(book, 'Read in chapter') : ''}
  ${link(foundationsDependenciesRoute,'All Tag dependencies')}</nav>`;
  const branches = argumentsForTag.map(key => {
    const scope = graph.nodes[key];
    const argument = graph.arguments[key];
    const inputs = argument.inputs.map(input => {
      return '<li>' + diagramLink(input.key) +
        input.scopes.map(text => '<p>' + esc(text) + '</p>').join('') + '</li>';
    }).join('');
    const inputList = inputs ? '<ol>' + inputs + '</ol>' : '<p>No linked proof input is registered for this argument.</p>';
    const detail = project + 'logic/chapters/' + argument.chapter + '/#argument-' + normalizedKey(key);
    return `<section class="tag-argument" id="${proofAnchor(key)}"><h2>${esc(labelNode(key, scope))}</h2><p>${esc(scope.status)}</p>
      <div class="tag-junction"><span>${argument.inputs.length} registered inputs</span><span aria-hidden="true">→</span>
      ${argument.inputs.length > 1 ? '<strong>AND</strong><span aria-hidden="true">→</span>' : ''}
      ${link(scope.href,'Statement and proof record')}</div>
      ${inputList}<p>${link(detail,'Exact scope, source references and argument details')}</p></section>`;
  }).join('');
  const gap = graph.gaps[row.id];
  const uses = [...consumers].map(key => '<li>' + diagramLink(key) + '</li>').join('');
  return shell(tagGraph(row.id), 'Proof dependencies for ' + row.id,
    summary + (gap ? '<section class="tag-gap"><h2>Historical proof gap</h2><p>' + esc(gap.step) + '</p></section>' : '') +
    (branches || '<p>This Tag has no selected argument in this edition’s proof register.</p>') +
    (uses ? '<section><h2>Arguments that use this Tag</h2><ul>' + uses + '</ul></section>' : ''), fixed);
}

export function createFoundationsWeb(release, chapterById, textLocations) {
  const fixed = project + 'editions/' + release.current.edition + '/';
  const graph = release.graph;
  const argumentsById = new Map();
  const usesById = new Map();
  const chapters = new Map();
  const byChapter = new Map();
  for (const [key, argument] of Object.entries(graph.arguments)) {
    const id = graph.nodes[key].id;
    if (!argumentsById.has(id)) argumentsById.set(id, []);
    argumentsById.get(id).push(key);
    if (!byChapter.has(argument.chapter)) byChapter.set(argument.chapter, new Set());
    byChapter.get(argument.chapter).add(id);
    if (!chapters.has(argument.chapter)) chapters.set(argument.chapter, new Map());
    const counts = chapters.get(argument.chapter);
    for (const {key: input} of argument.inputs) {
      const source = graph.nodes[input].id;
      if (!usesById.has(source)) usesById.set(source, new Set());
      usesById.get(source).add(key);
      const chapter = graph.arguments[input]?.chapter ?? chapterById.get(source)?.slug ?? 'unlocated';
      counts.set(chapter, (counts.get(chapter) ?? 0) + 1);
    }
  }

  const relations = Object.values(graph.arguments).reduce((sum, argument) => sum + argument.inputs.length, 0);
  const table = [...chapters].map(([target, inputs]) => {
    const source = [...inputs].sort((a,b) => b[1] - a[1]).map(([chapter, number]) =>
      '<li>' + link(project + 'chapters/' + chapter + '/', graph.chapters[chapter]) + ' <small>' + number + ' links</small></li>').join('');
    const tags = [...byChapter.get(target)].map(id => '<li>' + link(tagGraph(id), id) + '</li>').join('');
    return `<section class="dependency-chapter" id="dependency-${target}"><h2>${esc(graph.chapters[target])}</h2>
      <div class="tag-junction"><span>Source chapters</span><span aria-hidden="true">→</span><strong>Arguments in this chapter</strong></div>
      ${source ? '<ul class="dependency-sources">' + source + '</ul>' : '<p>This chapter has no registered incoming proof-input links.</p>'}
      <details><summary>Open individual Tag diagrams (${byChapter.get(target).size})</summary><ul class="dependency-tags">${tags}</ul></details>
      <p>${link(project + 'logic/chapters/' + target + '/', 'Read the chapter’s argument register')}</p></section>`;
  }).join('');
  const shortcuts = [...chapters].map(([chapter]) => link('#dependency-' + chapter, graph.chapters[chapter])).join('');
  const total = shell(foundationsDependenciesRoute, 'Tag dependency map', `
    <h1>Tag dependency map</h1><p>${count(relations)} registered proof-input links are grouped by the chapter that uses them. Each row shows the chapters supplying those inputs. Open the individual Tag diagrams for the exact inputs and their scopes.</p>
    <p>${link(project+'coverage/','Coverage and open steps')} · ${link('/search/?project=foundations','Find a Tag by number or topic')}</p>
    <details class="dependency-index"><summary>Jump to a chapter</summary><nav aria-label="Dependency chapters">${shortcuts}</nav></details>
    ${table}`, fixed);
  const pages = new Map([[foundationsDependenciesRoute, total]]);
  for (const row of release.rows) {
    pages.set(tagGraph(row.id), proofPage(row, graph, argumentsById.get(row.id) ?? [], usesById.get(row.id) ?? [], textLocations[row.id]?.href, fixed));
  }
  function decorate(route, html) {
    return html.replace(/href="(\/projects\/foundations\/editions\/[^/]+\/reader-en\.pdf(?:#[^"]*)?)"/g,
      (_, href) => 'href="' + bookTarget(href) + '"')
      .replaceAll('>English PDF<', '>Web reader<')
      .replaceAll('Open in the English reader · PDF page', 'Read in the web edition · page');
  }
  return {pages, decorate};
}
