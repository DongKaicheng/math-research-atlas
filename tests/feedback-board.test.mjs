import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as core from '../lib/feedback.mjs';

// Minimal DOM fixture: exercises the actual board module without a network call,
// a browser dependency, or submitting production test Issues.
class Element {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.dataset = {};
    this.textContent = '';
    this.listeners = new Map();
    this.attributes = new Map();
    this.classList = {toggle() {}};
  }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  setAttribute(key, value) { this.attributes.set(key, value); }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  click() { this.listeners.get('click')?.({preventDefault() {}}); }
  get elements() { return {namedItem: name => nodes(this).find(el => el.name === name)}; }
  get options() { return this.children.filter(el => el.tagName === 'option'); }
}
const nodes = el => [el, ...el.children.flatMap(nodes)];
const textOf = el => nodes(el).map(n => n.textContent).join('\n');
const flush = () => new Promise(resolve => setImmediate(resolve));
const repository = 'Example/math-atlas';
const issue = (number, extra = {}) => ({
  number, title: '[Question] [strong-green] Detail ' + number,
  body: 'A mathematical question.', state: 'open', labels: [],
  html_url: 'https://github.com/' + repository + '/issues/' + number,
  created_at: '2026-11-18T00:00:00Z', comments: 0, user: {login: 'Reader'}, ...extra,
});

async function board(responses, query = '', withContext = false) {
  const list = new Element('section');
  const contextHost = withContext ? new Element('div') : null;
  const buttons = ['', 'general', 'question', 'correction', 'project-proposal', 'maintainer-application'].map(category => {
    const el = new Element('button'); el.dataset.category = category; return el;
  });
  const links = ['general', 'question'].map(kind => {
    const el = new Element('a'); el.dataset.feedbackKind = kind; return el;
  });
  let location = new URL('https://example.org/math-atlas/feedback/' + query);
  const requests = [];
  const sandbox = {
    ...core, URL, URLSearchParams, Date, Number, Set, Object,
    get location() { return location; },
    window: {ATLAS_GITHUB_REPOSITORY: repository, ATLAS_FEEDBACK_PROJECTS: [
      {id: 'strong-green', title: 'Strong Green'}, {id: 'bedford-taylor', title: 'Bedford–Taylor'},
    ]},
    FormData: class {
      constructor(form) { this.values = nodes(form).filter(node => node.name).map(node => [node.name, node.value]); }
      [Symbol.iterator]() { return this.values[Symbol.iterator](); }
    },
    history: {pushState(_state, _title, path) { location = new URL(path, location); }},
    addEventListener() {},
    document: {
      getElementById(id) { return id === 'github-feedback' ? list : id === 'feedback-context-controls' ? contextHost : null; },
      querySelectorAll(selector) { return selector.includes('discussion-filters') ? buttons : links; },
      createElement(tag) { return new Element(tag); },
    },
    async fetch(url, options) {
      requests.push({url, options});
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return {ok: true, async json() { return response ?? []; }};
    },
  };
  const source = (await readFile(new URL('../assets/feedback.js', import.meta.url), 'utf8'))
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*'\.\/feedback-core\.mjs';\s*/, '');
  vm.runInNewContext(source, sandbox);
  await flush();
  return {list, buttons, links, requests, contextHost, get location() { return location; }};
}

test('Board explicitly loads older pages, deduplicates Issues, and never submits data', async () => {
  const first = Array.from({length: 100}, (_, n) => issue(n + 1));
  const second = [issue(100), issue(101), issue(102, {pull_request: {url: 'ignored'}})];
  const b = await board([first, second]);
  assert.equal(b.requests.length, 1);
  assert.match(textOf(b.list), /100 matching discussions/);
  assert.match(textOf(b.list), /Older issues may not yet be shown/);
  nodes(b.list).find(n => n.textContent === 'Load older feedback').click();
  await flush();
  assert.equal(b.requests.length, 2);
  assert.match(b.requests[1].url, /page=2$/);
  assert.match(textOf(b.list), /101 matching discussions/);
  assert.doesNotMatch(textOf(b.list), /Older issues may not yet be shown/);
  assert.equal(nodes(b.list).filter(n => n.className === 'discussion-card').length, 101);
  for (const request of b.requests) {
    assert.equal(request.options.credentials, 'omit');
    assert.equal(request.options.method, undefined);
    assert.equal(request.options.body, undefined);
  }
});

test('Project filtering and General feedback share the same board without false version binding', async () => {
  const b = await board([[issue(1), issue(2, {title: '[General] Site organisation'})]], '?project=strong-green&version=v0.5.1');
  assert.equal(nodes(b.list).filter(n => n.className === 'discussion-card').length, 1);
  assert.equal(new URL(b.links[1].href).searchParams.get('project'), 'strong-green');
  assert.equal(new URL(b.links[1].href).searchParams.get('version'), 'v0.5.1');
  assert.equal(new URL(b.links[0].href).searchParams.has('project'), false);
  b.buttons.find(b => b.dataset.category === 'general').click();
  assert.equal(b.location.searchParams.has('project'), false);
  assert.equal(b.location.searchParams.has('version'), false);
  assert.match(textOf(b.list), /Site organisation/);
  assert.doesNotMatch(textOf(b.list), /Detail 1/);
  assert.equal(b.requests.length, 1, 'A filter change does not create a new inbox or request');
});

test('API failures retain the direct GitHub path and can be retried', async () => {
  const b = await board([new Error('offline'), [issue(1)]]);
  assert.match(textOf(b.list), /Read public feedback on GitHub/);
  assert.match(textOf(b.list), /Retry loading feedback/);
  const direct = nodes(b.list).find(n => n.textContent === 'Browse and search all GitHub Issues');
  assert.equal(direct.href, 'https://github.com/' + repository + '/issues');
  nodes(b.list).find(n => n.textContent === 'Retry loading feedback').click();
  await flush();
  assert.match(b.requests[1].url, /page=1$/);
  assert.match(textOf(b.list), /Detail 1/);
});

test('Reader content stays literal text and forged off-repository links are discarded', async () => {
  const b = await board([[
    issue(1, {title: '<img src=x onerror=alert(1)>', body: '<script>alert(2)</script>'}),
    issue(2, {html_url: 'https://github.com.evil.example/Example/math-atlas/issues/2'}),
  ]]);
  const cards = nodes(b.list).filter(n => n.className === 'discussion-card');
  assert.equal(cards.length, 1);
  assert.ok(nodes(cards[0]).some(n => n.tagName === 'h2' && n.textContent === '<img src=x onerror=alert(1)>'));
  assert.equal(nodes(cards[0]).some(n => ['script', 'img'].includes(n.tagName)), false);
});

test('Optional mathematical context is collapsed for a general visit and preserves deliberate expansion', async () => {
  const b = await board([[]], '', true);
  const panel = nodes(b.contextHost).find(n => n.tagName === 'details');
  const entry = nodes(b.contextHost).find(n => n.name === 'entry');
  assert.equal(panel.open, false);
  assert.ok(nodes(panel).some(n => n.tagName === 'summary' && n.textContent === 'Optional context for a mathematical comment'));
  panel.open = true;
  entry.value = 'UNSUBMITTED-ID';
  b.buttons.find(n => n.dataset.category === 'question').click();
  assert.equal(panel.open, true, 'A board redraw must not close a manually opened panel');
  assert.equal(entry.value, 'UNSUBMITTED-ID', 'A board redraw must not erase unsent typing');
  b.buttons.find(n => n.dataset.category === 'general').click();
  assert.equal(panel.open, false);
  assert.equal(entry.value, '');
});

test('Linked project context starts expanded and General feedback clears and closes it', async () => {
  const b = await board([[]], '?project=strong-green&entry=SG-001&version=v0.5.1', true);
  const panel = nodes(b.contextHost).find(n => n.tagName === 'details');
  assert.equal(panel.open, true);
  assert.equal(nodes(panel).find(n => n.name === 'entry').value, 'SG-001');
  b.buttons.find(n => n.dataset.category === 'general').click();
  assert.equal(panel.open, false);
  for (const key of ['project', 'entry', 'version', 'page']) {
    assert.equal(nodes(panel).find(n => n.name === key).value, '');
    assert.equal(b.location.searchParams.has(key), false);
  }
});

test('Changing the project clears the previous mathematical context before opening another Issue draft', async () => {
  const page = 'https://example.org/math-atlas/projects/strong-green/editions/v0.5.1/#proof';
  const b = await board([[]], '?' + new URLSearchParams({...{
    project: 'strong-green', entry: 'SG-001', version: 'v0.5.1', page,
  }}), true);
  const form = nodes(b.contextHost).find(node => node.tagName === 'form');
  const project = form.elements.namedItem('project');
  project.value = 'bedford-taylor';
  project.listeners.get('change')();
  assert.equal(b.location.searchParams.get('project'), 'bedford-taylor');
  for (const key of ['entry', 'version', 'page']) {
    assert.equal(b.location.searchParams.has(key), false);
    assert.equal(form.elements.namedItem(key).value, '');
  }
  const draft = new URL(b.links[1].href);
  assert.equal(draft.searchParams.get('project'), 'bedford-taylor');
  assert.equal(draft.searchParams.has('target'), false);
  assert.equal(draft.searchParams.has('version'), false);
  assert.match(textOf(b.contextHost), /Previous result, version and page context was cleared/);
  form.elements.namedItem('entry').value = 'NABT-000002';
  form.elements.namedItem('version').value = 'v1.0.1';
  form.listeners.get('submit')({preventDefault() {}});
  const amended = new URL(b.links[1].href);
  assert.equal(amended.searchParams.get('target'), 'NABT-000002');
  assert.equal(amended.searchParams.get('version'), 'v1.0.1');
});

test('A source URL too long to prefill remains available for copying and is clearly explained', async () => {
  const page = 'https://example.org/' + 'a'.repeat(1100) + '#proof';
  const b = await board([[]], '?' + new URLSearchParams({project: 'bedford-taylor', page}), true);
  const form = nodes(b.contextHost).find(node => node.tagName === 'form');
  assert.equal(form.elements.namedItem('page').value, page);
  assert.equal(new URL(b.links[1].href).searchParams.has('target'), false);
  assert.match(textOf(b.contextHost), /page link could not be included/);
  assert.match(textOf(b.contextHost), /it has not been shortened/);
  form.listeners.get('submit')({preventDefault() {}});
  assert.equal(form.elements.namedItem('page').value, page);
  assert.equal(b.location.searchParams.has('page'), false);
  assert.equal(new URL(b.links[1].href).searchParams.has('target'), false);
  assert.match(textOf(b.contextHost), /Copy the complete value/);
});

test('A valid Unicode source URL omitted from a long draft receives a visible explanation', async () => {
  const page = 'https://example.org/?q=' + 'é'.repeat(140) + '#proof';
  const b = await board([[]], '?' + new URLSearchParams({project: 'bedford-taylor', entry: 'R01', version: '版'.repeat(120), page}), true);
  assert.equal(new URL(b.links[1].href).searchParams.get('target'), 'R01');
  assert.match(textOf(b.contextHost), /page link could not be included/);
  const form = nodes(b.contextHost).find(node => node.tagName === 'form');
  assert.ok(form.elements.namedItem('page').value.endsWith('#proof'));
});

test('Bedford–Taylor uses the shared board and preserves exact context in its Issue drafts', async () => {
  const page = 'https://example.org/math-atlas/projects/bedford-taylor/editions/v0.18.0/results/r01/#proof';
  const query = '?' + new URLSearchParams({project: 'bedford-taylor', entry: 'R01', version: 'v0.18.0', page});
  const b = await board([[
    issue(1), issue(2, {title: '[Correction] [bedford-taylor] A missing assumption'}),
  ]], query, true);
  assert.equal(nodes(b.list).filter(n => n.className === 'discussion-card').length, 1);
  assert.match(textOf(b.list), /A missing assumption/);
  const target = new URL(b.links[1].href);
  assert.equal(target.pathname, '/Example/math-atlas/issues/new');
  assert.equal(target.searchParams.get('project'), 'bedford-taylor');
  assert.equal(target.searchParams.get('version'), 'v0.18.0');
  assert.equal(target.searchParams.get('target'), 'R01 — ' + page);
  assert.equal(b.requests.length, 1);
  assert.match(b.requests[0].url, /^https:\/\/api\.github\.com\/repos\/Example\/math-atlas\/issues\?/);
});

test('The configured repository owner is displayed as Maintainer on discussion cards', async () => {
  const b = await board([[issue(1, {user: {login: 'example'}})]]);
  const card = nodes(b.list).find(n => n.className === 'discussion-card');
  const meta = nodes(card).find(n => n.className === 'discussion-meta');
  assert.match(textOf(meta), /Maintainer/);
  assert.doesNotMatch(textOf(meta), /example/i);
});

test('Application filters clear inherited theorem context and use the same public Issue feed', async () => {
  const b = await board([[issue(1), issue(2, {title: '[Project-proposal] A new subject'}), issue(3, {title: '[Maintainer-application] A focused contribution'})]], '?project=strong-green&entry=SG-001&version=v0.5.1', true);
  b.buttons.find(button => button.dataset.category === 'project-proposal').click();
  for (const key of ['project', 'entry', 'version', 'page']) assert.equal(b.location.searchParams.has(key), false);
  assert.match(textOf(b.list), /A new subject/);
  assert.match(textOf(b.list), /New project proposals/);
  assert.doesNotMatch(textOf(b.list), /A focused contribution|Detail 1/);
  b.buttons.find(button => button.dataset.category === 'maintainer-application').click();
  assert.match(textOf(b.list), /A focused contribution/);
  assert.equal(b.requests.length, 1);
});
