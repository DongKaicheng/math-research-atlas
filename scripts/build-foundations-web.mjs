import katex from 'katex';

const project = '/projects/foundations/';
export const foundationsBookRoute = project + 'reader/';
export const foundationsDependenciesRoute = project + 'logic/full/';
const tagPath = id => '/r/' + id + '/';
const tagGraph = id => tagPath(id) + 'logic/';
const normalizedKey = key => key.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
const proofAnchor = key => 'proof-' + normalizedKey(key);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link = (href, label) => '<a href="' + esc(href) + '">' + esc(label) + '</a>';
const decode = value => value.replace(/&(amp|lt|gt|quot|#39);/g, (_, code) => ({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[code]));
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

function mathHtml(source) {
  const tex = source.replace(/\r\n?/g, '\n').replace(/\\label\{[^{}]*\}/g, '');
  const tokens = /\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|(?<![\\$])\$(?:\\.|[^$\n\\])+\$|\\begin\{(align\*?|equation\*?|gather\*?)\}[\s\S]*?\\end\{\1\}|\\(?:begin|end)\{(?:proof|theorem|lemma|proposition|corollary|definition|remark|example)\}(?:\[[^\]\n]*\])?|\n[ \t]*\n/g;
  let line = '', html = '', cursor = 0;
  const flush = () => {
    if (line.trim()) html += '<p>' + line + '</p>';
    line = '';
  };
  for (const match of tex.matchAll(tokens)) {
    line += esc(tex.slice(cursor, match.index));
    cursor = match.index + match[0].length;
    const token = match[0];
    if (token.startsWith('\n') || (token.startsWith('\\begin') && !match[1]) || token.startsWith('\\end')) {
      flush();
      const title = token.match(/\[([^\]]+)\]$/)?.[1];
      if (title) line += esc(title) + '. ';
      continue;
    }
    const display = Boolean(match[1]) || token.startsWith('\\[') || token.startsWith('$$');
    let math = match[1] ? token.slice(token.indexOf('}') + 1, token.lastIndexOf('\\end')) :
      token.startsWith('$$') || token.startsWith('\\') ? token.slice(2, -2) : token.slice(1, -1);
    if (match[1]?.startsWith('align')) math = '\\begin{aligned}' + math + '\\end{aligned}';
    if (match[1]?.startsWith('gather')) math = '\\begin{gathered}' + math + '\\end{gathered}';
    let rendered;
    try { rendered = katex.renderToString(math, {displayMode: display, trust: false, maxExpand: 400, maxSize: 10}); }
    catch { rendered = '<code class="source-notation">' + esc(token) + '</code>'; }
    if (display) {
      flush();
      html += '<div class="tag-equation">' + rendered + '</div>';
    } else line += rendered;
  }
  line += esc(tex.slice(cursor));
  flush();
  return html;
}

function tagText(html) {
  return html.replace(/(<details class="source"(?: id="[^"]+")?>)<summary>([^<]+)<\/summary>(\s*<pre\b[^>]*>)([\s\S]*?)(<\/pre>\s*<\/details>)/g,
    (whole, opening, title, pre, body, end) => {
      if (!title.includes('exact TeX')) return whole;
      const heading = title.replace(/ · exact TeX$/, '');
      return opening.replace(/>$/, ' open>') + '<summary>' + heading + '</summary>' +
        '<div class="tag-proof-text">' + mathHtml(decode(body)) + '</div>' +
        '<details class="tag-source"><summary>Exact TeX source</summary>' + pre + body + '</pre></details>' +
        end.slice('</pre>'.length);
    });
}

function bookTarget(href) {
  const hash = href.split('#')[1];
  if (hash?.startsWith('nameddest=')) return foundationsBookRoute + '?dest=' + hash.slice(10);
  if (hash?.startsWith('page=')) return foundationsBookRoute + '?' + hash;
  return foundationsBookRoute;
}

function locations(release, fixed) {
  const reader = fixed + 'reader-en.pdf';
  const tags = {};
  const pages = {};
  for (const row of release.rows) {
    const html = release.contents.get(row.link.slice(1) + 'index.html').toString('utf8');
    const anchor = [...html.matchAll(/<a href="([^"]+)"[^>]*>([^<]*)<\/a>/g)].find(([, href]) =>
      href.startsWith(reader + '#nameddest=') || href.startsWith(reader + '#page='));
    if (!anchor) continue;
    const [, href, label] = anchor;
    const dest = href.match(/#nameddest=(.+)$/)?.[1];
    const printed = (href.match(/#page=(\d+)/) || label.match(/\bPDF page (\d+)/i))?.[1];
    const witness = release.meta.acceptedExportHolds[row.id]?.verifiedReaderDestination;
    const sourcePage = witness && dest === encodeURIComponent(witness.destination) ? witness.page : undefined;
    const page = Number(printed ?? sourcePage);
    const query = dest ? 'dest=' + dest : 'page=' + page;
    if (!dest && (!Number.isInteger(page) || page < 1 || page > release.meta.reader.pages)) continue;
    tags[row.id] = query;
    if (page >= 1 && page <= release.meta.reader.pages) {
      (pages[page] ??= []).push({id: row.id, title: row.title, href: row.link});
    }
  }
  return {tags, pages};
}

function webReader(release, fixed) {
  return shell(foundationsBookRoute, 'Web reader', `
    <h1>Foundations web reader</h1><p>Read the complete fixed edition in the browser. Use the book contents, move by page or follow a Tag to the corresponding passage.</p>
    <p id="web-reader-status" role="status">Loading the reading edition…</p>
    <form id="web-reader-controls" hidden aria-label="Page navigation">
      <button type="button" id="web-reader-prev">Previous page</button>
      <label for="web-reader-page">Page</label><input type="number" min="1" max="${release.meta.reader.pages}" id="web-reader-page" required>
      <button type="submit">Go</button><button type="button" id="web-reader-next">Next page</button>
    </form>
    <details id="web-reader-outline"><summary>Book contents</summary><div id="web-reader-book-contents"></div></details>
    <section id="web-reader-tags" aria-label="Tags on this page" hidden><h2>Tags on this page</h2><ul></ul></section>
    <div id="web-reader-sheet" aria-label="Page from the English edition"></div>
    <noscript><p>JavaScript is required to lay out the book pages. ${link(project+'contents/','Browse the standalone Tag pages')}.</p></noscript>
    <p hidden><a id="web-reader-source" href="${fixed}reader-en.pdf">Fixed edition source</a>
      <a id="web-reader-index" href="${foundationsBookRoute}tags.json">Page to Tag index</a></p>`,
    fixed, '<link rel="stylesheet" href="/assets/foundations-pdfjs-text.css"><script type="module" src="/assets/foundations-web-reader.js"></script>');
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
  ${book ? link(foundationsBookRoute + '?' + book, 'Read the corresponding book page') : ''}
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

export function createFoundationsWeb(release, chapterById) {
  const fixed = project + 'editions/' + release.current.edition + '/';
  const graph = release.graph;
  const book = locations(release, fixed);
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
  const pages = new Map([[foundationsBookRoute, webReader(release, fixed)], [foundationsDependenciesRoute, total]]);
  for (const row of release.rows) {
    pages.set(tagGraph(row.id), proofPage(row, graph, argumentsById.get(row.id) ?? [], usesById.get(row.id) ?? [], book.tags[row.id], fixed));
  }
  function decorate(route, html) {
    let text = html.replace(/href="(\/projects\/foundations\/editions\/[^/]+\/reader-en\.pdf(?:#[^"]*)?)"/g,
      (_, href) => 'href="' + bookTarget(href) + '"')
      .replaceAll('>English PDF<', '>Web reader<')
      .replaceAll('Open in the English reader · PDF page', 'Read in the web edition · page');
    const match = /^\/r\/(NAG-\d{6})\/$/.exec(route);
    if (!match) return text;
    const [, id] = match;
    const target = book.tags[id];
    text = tagText(text).replace('</head>', '<link rel="stylesheet" href="/assets/foundations-web.css"><link rel="stylesheet" href="/assets/katex.min.css"></head>');
    return text.replace('</h1>', '</h1><nav class="tag-actions" aria-label="Tag reading links">' +
      link(tagGraph(id), 'Proof dependency diagram') +
      (target ? link(foundationsBookRoute + '?tag=' + id, 'Read the corresponding book page') : '') + '</nav>');
  }
  return {pages, book, decorate};
}
