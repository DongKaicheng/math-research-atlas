import {getDocument, GlobalWorkerOptions, TextLayer} from './foundations-pdfjs/pdf.min.mjs';

const asset = name => new URL('./foundations-pdfjs/' + name, import.meta.url).href;
GlobalWorkerOptions.workerSrc = asset('pdf.worker.min.mjs');

const byId = name => document.getElementById('web-reader-' + name);
const status = byId('status');
const form = byId('controls');
const field = byId('page');
const sheet = byId('sheet');
const tags = byId('tags');
const base = new URL('../../../', location.href);
let pageNumber = 1;
let generation = 0;
let activeRender;
let activeText;

function element(parent, type, text) {
  const node = document.createElement(type);
  if (text) node.textContent = text;
  parent.append(node);
  return node;
}

async function start() {
  const source = byId('source').href;
  const doc = await getDocument({
    url: source,
    isEvalSupported: false,
    disableAutoFetch: true,
    disableStream: true,
    cMapUrl: asset('cmaps/'),
    cMapPacked: true,
    standardFontDataUrl: asset('standard_fonts/'),
    wasmUrl: asset('wasm/'),
    iccUrl: asset('iccs/'),
  }).promise;
  const indexRequest = fetch(byId('index').href)
    .then(response => response.ok ? response.json() : {tags:{},pages:{}})
    .catch(() => ({tags:{},pages:{}}));
  const index = await indexRequest;
  const fit = () => Math.min(sheet.clientWidth || 700, 840);
  field.max = doc.numPages;

  async function destinationPage(destination) {
    const explicit = typeof destination === 'string' ? await doc.getDestination(destination) : destination;
    if (!Array.isArray(explicit)) return null;
    const ref = explicit[0];
    return (Number.isInteger(ref) ? ref : await doc.getPageIndex(ref)) + 1;
  }

  function showTags(number) {
    const list = tags.querySelector('ul');
    list.replaceChildren();
    const records = index.pages[number] ?? [];
    tags.hidden = !records.length;
    for (const record of records) {
      const item = element(list, 'li');
      element(item, 'a', record.id + ' · ' + record.title).href = new URL(record.href.slice(1), base).href;
    }
  }

  async function display(number, route = null) {
    const token = ++generation;
    activeRender?.cancel();
    activeText?.cancel();
    pageNumber = Math.min(doc.numPages, Math.max(1, Number.isInteger(number) ? number : 1));
    field.value = pageNumber;
    byId('prev').disabled = pageNumber <= 1;
    byId('next').disabled = pageNumber >= doc.numPages;
    status.textContent = 'Page ' + pageNumber + ' of ' + doc.numPages;
    showTags(pageNumber);
    if (route) history.pushState(null, '', '?' + route);
    const page = await doc.getPage(pageNumber);
    if (token !== generation) return;
    const viewport = page.getViewport({scale: fit() / page.getViewport({scale:1}).width});
    const paper = document.createElement('div');
    paper.className = 'web-reader-paper';
    paper.style.width = viewport.width + 'px';
    paper.style.height = viewport.height + 'px';
    paper.style.setProperty('--scale-factor', viewport.scale);
    paper.style.setProperty('--total-scale-factor', viewport.scale * page.userUnit);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = element(paper,'canvas');
    canvas.setAttribute('aria-hidden','true');
    canvas.width = Math.ceil(viewport.width * ratio);
    canvas.height = Math.ceil(viewport.height * ratio);
    const container = element(paper, 'div');
    container.className = 'textLayer';
    sheet.replaceChildren(paper);
    activeRender = page.render({canvas, viewport, transform: [ratio,0,0,ratio,0,0]});
    activeText = new TextLayer({textContentSource: page.streamTextContent(), container, viewport});
    await Promise.all([activeRender.promise, activeText.render()]);
    if (token === generation) form.hidden = false;
  }

  async function readLocation() {
    const params = new URLSearchParams(location.search);
    const located = index.tags[params.get('tag')];
    const query = located ? new URLSearchParams(located) : params;
    const dest = query.get('dest');
    const target = dest ? await destinationPage(dest) : Number(query.get('page') || 1);
    if (dest && !target) {
      status.textContent = 'This book destination could not be located. Use the book contents to select a section.';
      form.hidden = false;
      return;
    }
    await display(target);
  }

  const safe = action => Promise.resolve().then(action).catch(error => {
    if (!['RenderingCancelledException','AbortException'].includes(error.name)) {
      status.textContent = 'This page could not be displayed. Choose another page or section.';
      form.hidden = false;
    }
  });
  const jump = number => safe(() => display(number, 'page=' + number));
  byId('prev').addEventListener('click', () => jump(pageNumber - 1));
  byId('next').addEventListener('click', () => jump(pageNumber + 1));
  form.addEventListener('submit', event => {
    event.preventDefault();
    jump(Number(field.value));
  });
  addEventListener('popstate', () => safe(readLocation));
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => safe(() => display(pageNumber)), 180);
  });

  function outline(parent, items) {
    const list = element(parent, 'ul');
    for (const entry of items) {
      const row = element(list, 'li');
      if (typeof entry.dest === 'string') {
        const target = 'dest=' + encodeURIComponent(entry.dest);
        element(row, 'a', entry.title).href = '?' + target;
      } else if (entry.dest) {
        const control = element(row, 'button', entry.title);
        control.type = 'button';
        control.addEventListener('click', () => safe(async () => {
          const page = await destinationPage(entry.dest);
          if (page) await display(page, 'page=' + page);
        }));
      } else element(row, 'span', entry.title);
      if (entry.items?.length) outline(row, entry.items);
    }
  }
  doc.getOutline().then(items => {
    const section = byId('book-contents');
    if (items?.length) outline(section, items);
    else element(section, 'p', 'Use the project table of contents to browse the Tag pages.');
  }).catch(() => { byId('outline').hidden = true; });
  await safe(readLocation);
}

start().catch(() => {
  status.textContent = 'The reading edition could not load. The Table of contents and Tag pages remain available.';
});
