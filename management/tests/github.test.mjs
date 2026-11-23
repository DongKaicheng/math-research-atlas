import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {GitHubRepository, initialProjectFiles, isReadablePath, isEditablePath} from '../server/github.mjs';

const sha = value => createHash('sha1').update(value).digest('hex');
const blobSha = value => sha(`blob ${Buffer.byteLength(value)}\0${value}`);
const project = {id: 'test-theory', title: 'Test theory', category: 'research', summary: 'A source-backed test project.', createdAt: '2026-11-23T10:00:00.000Z', sourceKind: 'repository'};
const cardPath = `content/projects/${project.id}.json`;
const ackPath = `content/acknowledgements/${project.id}.json`;
const starter = () => Object.fromEntries(initialProjectFiles(project).map(item => [item.path, item.content]));
const revisionFor = changes => ({id: 'revision-1', title: 'Explain the first definition', hash: 'a'.repeat(64), changes});

/** A stateful Git API fake exercises real source/commit/PR reconciliation. */
class FakeGitHub {
  constructor(files = starter()) {
    this.repository = 'mathematician/atlas';
    this.blobs = new Map(); this.trees = new Map(); this.commits = new Map(); this.refs = new Map(); this.prs = [];
    this.calls = []; this.posts = []; this.counter = 0; this.failNext = null;
    const tree = this.makeTree(files);
    this.main = this.makeCommit(tree, [], 'initial');
    this.refs.set('main', this.main);
  }
  makeTree(files) {
    const tree = Object.entries(files).map(([path, value]) => {
      const content = typeof value === 'string' ? value : value.content;
      const blob = blobSha(content); this.blobs.set(blob, content);
      return {path, type: 'blob', mode: value.mode ?? '100644', sha: blob, size: Buffer.byteLength(content)};
    }).sort((a, b) => a.path.localeCompare(b.path));
    const id = sha(JSON.stringify(tree)); this.trees.set(id, tree); return id;
  }
  makeCommit(tree, parents, message) {
    const commit = {tree: {sha: tree}, parents: parents.map(id => ({sha: id})), message};
    const id = sha(JSON.stringify(commit) + String(this.counter++));
    this.commits.set(id, {sha: id, ...commit}); return id;
  }
  advance(changes) {
    const current = this.refs.get('main');
    const files = Object.fromEntries(this.trees.get(this.commits.get(current).tree.sha).map(entry => [entry.path, {content: this.blobs.get(entry.sha), mode: entry.mode}]));
    Object.assign(files, changes);
    const id = this.makeCommit(this.makeTree(files), [current], 'another maintainer');
    this.refs.set('main', id); return id;
  }
  response(value, status = 200) { return new Response(JSON.stringify(value), {status, headers: {'content-type': 'application/json'}}); }
  fetch = async (rawUrl, options) => {
    const url = new URL(rawUrl);
    assert.equal(url.origin, 'https://api.github.com');
    assert.equal(options.redirect, 'error');
    assert.ok(url.pathname.startsWith(`/repos/${this.repository}/`));
    const path = decodeURIComponent(url.pathname.slice(`/repos/${this.repository}`.length));
    const method = options.method;
    const body = options.body === undefined ? undefined : JSON.parse(options.body);
    this.calls.push({method, path, body, headers: options.headers});
    if (method !== 'GET') this.posts.push({method, path, body});
    if (this.failNext && this.failNext.path === path && this.failNext.method === method) {
      const failure = this.failNext; this.failNext = null;
      if (failure.throw) throw new Error('simulated dropped connection');
      return this.response({}, failure.status);
    }
    if (method === 'GET' && path.startsWith('/git/ref/heads/')) {
      const branch = path.slice('/git/ref/heads/'.length), id = this.refs.get(branch);
      return id ? this.response({object: {type: 'commit', sha: id}}) : this.response({}, 404);
    }
    if (method === 'GET' && path.startsWith('/git/commits/')) return this.response(this.commits.get(path.split('/').at(-1)) ?? {}, this.commits.has(path.split('/').at(-1)) ? 200 : 404);
    if (method === 'GET' && path.startsWith('/git/trees/')) {
      const tree = this.trees.get(path.split('/').at(-1));
      return tree ? this.response({tree, truncated: false}) : this.response({}, 404);
    }
    if (method === 'GET' && path.startsWith('/git/blobs/')) {
      const content = this.blobs.get(path.split('/').at(-1));
      return content === undefined ? this.response({}, 404) : this.response({content: Buffer.from(content).toString('base64'), encoding: 'base64', size: Buffer.byteLength(content)});
    }
    if (method === 'GET' && path === '/pulls') {
      assert.equal(url.searchParams.get('state'), 'all');
      const [, branch] = url.searchParams.get('head').split(':');
      return this.response(this.prs.filter(pr => pr.head.ref === branch));
    }
    if (method === 'POST' && path === '/git/trees') {
      assert.ok(body.base_tree, 'must preserve the complete base tree');
      const files = Object.fromEntries(this.trees.get(body.base_tree).map(entry => [entry.path, {content: this.blobs.get(entry.sha), mode: entry.mode}]));
      for (const entry of body.tree) {
        assert.equal(entry.type, 'blob'); assert.equal(entry.mode, '100644');
        assert.equal(typeof entry.content, 'string'); assert.equal(entry.sha, undefined);
        files[entry.path] = entry.content;
      }
      return this.response({sha: this.makeTree(files)}, 201);
    }
    if (method === 'POST' && path === '/git/commits') return this.response({sha: this.makeCommit(body.tree, body.parents, body.message)}, 201);
    if (method === 'POST' && path === '/git/refs') {
      const branch = body.ref.slice('refs/heads/'.length);
      assert.notEqual(branch, 'main');
      if (this.refs.has(branch)) return this.response({}, 422);
      this.refs.set(branch, body.sha); return this.response({ref: body.ref, object: {sha: body.sha}}, 201);
    }
    if (method === 'POST' && path === '/pulls') {
      const number = this.prs.length + 1;
      const pr = {number, html_url: `https://github.com/${this.repository}/pull/${number}`, state: 'open', body: body.body,
        head: {ref: body.head, sha: this.refs.get(body.head), repo: {full_name: this.repository}}, base: {ref: body.base}};
      this.prs.push(pr); return this.response(pr, 201);
    }
    throw Error(`Unexpected GitHub call: ${method} ${path}`);
  };
  adapter(token = 'test-publication-token') {
    return new GitHubRepository({repository: this.repository, branch: 'main', token, fetchImpl: this.fetch});
  }
  source(path, ref = this.refs.get('main')) {
    const entry = this.trees.get(this.commits.get(ref).tree.sha).find(item => item.path === path);
    return entry && {path, content: this.blobs.get(entry.sha), sha: entry.sha};
  }
}

async function cardChanges(api, fake, programme = '## Aim\n\nA precise definition.') {
  const old = fake.source(cardPath);
  const card = JSON.parse(old.content); card.project.programme = programme; card.changeSummary = 'Explain the supplied definition.';
  return api.validateChanges(project, fake.main, [{path: cardPath, content: JSON.stringify(card), baseSha: old.sha}]);
}

test('scope and extension allowlists deny executable edits, traversal, reserved IDs and frozen additions', () => {
  assert.equal(isEditablePath(project.id, cardPath), true);
  assert.equal(isReadablePath(project.id, `${project.id}/views/content/programme.mjs`), true);
  assert.equal(isEditablePath(project.id, `${project.id}/views/content/programme.mjs`), false);
  assert.equal(isReadablePath('projects', 'content/projects/other.json'), false);
  assert.equal(isEditablePath('foundations', 'content/projects/foundations.json'), false);
  for (const path of ['content/projects/other.json', `content/${project.id}/../other.json`,
    `content/${project.id}/%2e%2e/other.json`, `content/${project.id}/a\\b.json`,
    `content/${project.id}/current.json`, `content/${project.id}/releases/new/source.tex`,
    `content/${project.id}/source-receipts/new.json`, `content/history/${project.id}/v9.json`,
    `content/${project.id}/sources/.env`, `content/${project.id}/secrets.json`,
    `public/projects/${project.id}/editions/new/paper.tex`, '.github/workflows/publish.yml']) {
    assert.equal(isEditablePath(project.id, path), false, path);
  }
});

test('new projects expose private virtual starter files and valid empty acknowledgements', async () => {
  const fake = new FakeGitHub({'README.md': 'Shared repository'}), api = fake.adapter('');
  const fresh = {...project, sourceKind: 'workspace'};
  const listing = await api.listSources(fresh);
  assert.equal(listing.files.length, 2);
  assert.ok(listing.files.every(file => file.sha === null && file.editable));
  const source = await api.readSource(fresh, cardPath, listing.ref);
  assert.deepEqual(JSON.parse(source.content).entries, []);
  assert.equal(source.sha, null);
  const changes = await api.validateChanges(fresh, listing.ref, [{path: cardPath, content: source.content, baseSha: null}]);
  assert.equal(changes.length, 2);
  assert.equal(JSON.parse(changes.find(item => item.path === ackPath).content).projectId, project.id);
  assert.equal(fake.calls.some(call => call.headers.Authorization), false);
  assert.equal(fake.posts.length, 0);
});

test('a merged project uses actual sources even if stored sourceKind is workspace', async () => {
  const fake = new FakeGitHub(), api = fake.adapter();
  const fresh = {...project, title: 'Old private title', sourceKind: 'workspace'};
  const listing = await api.listSources(fresh);
  assert.ok(listing.files.every(file => file.sha !== null));
  const source = await api.readSource(fresh, cardPath, listing.ref);
  assert.equal(JSON.parse(source.content).project.title, project.title);
});

test('reading requires exact ref, project scope, regular UTF-8 source and matching blob hash', async () => {
  const path = `content/${project.id}/sources/example.tex`;
  const fake = new FakeGitHub({...starter(), [path]: {content: '/secret/location', mode: '120000'}}), api = fake.adapter();
  await assert.rejects(api.readSource(project, 'content/projects/other.json', fake.main), {status: 403});
  await assert.rejects(api.readSource(project, cardPath, 'main'), {status: 400});
  await assert.rejects(api.readSource(project, path, fake.main), {code: 'SOURCE_MODE_FORBIDDEN'});
  assert.equal((await api.listSources(project)).files.some(file => file.path === path), false);
  const hash = fake.source(cardPath).sha;
  fake.blobs.set(hash, 'tampered');
  await assert.rejects(api.readSource(project, cardPath, fake.main), {code: 'SOURCE_HASH_MISMATCH'});
});

test('source reads preserve a UTF-8 BOM byte-for-byte', async () => {
  const path = `content/${project.id}/sources/example.tex`;
  const content = '\ufeff\\section{A theorem}\n';
  const fake = new FakeGitHub({...starter(), [path]: content});
  const source = await fake.adapter().readSource(project, path, fake.main);
  assert.equal(source.content, content);
});

test('normalization creates an exact immutable snapshot and is idempotent when saved again', async () => {
  const fake = new FakeGitHub(), api = fake.adapter();
  const changes = await cardChanges(api, fake);
  assert.equal(changes.length, 2);
  const snapshot = changes.find(change => change.path === `content/history/${project.id}/v0.json`);
  assert.equal(snapshot.content, fake.source(cardPath).content);
  assert.equal(snapshot.baseSha, null);
  assert.equal(JSON.parse(changes.find(change => change.path === cardPath).content).revision, 1);
  assert.deepEqual(await api.validateChanges(project, fake.main, changes), changes);
  const revised = changes.map(change => ({...change}));
  const card = revised.find(change => change.path === cardPath);
  const parsed = JSON.parse(card.content); parsed.project.programme = 'A second exposition.'; card.content = JSON.stringify(parsed);
  const savedAgain = await api.validateChanges(project, fake.main, revised);
  assert.equal(savedAgain.filter(change => change.path.startsWith('content/history/')).length, 1);
  assert.equal(JSON.parse(savedAgain.find(change => change.path === cardPath).content).revision, 1);
});

test('wrong baseline blobs, arbitrary frozen contents and duplicate paths are rejected', async () => {
  const fake = new FakeGitHub(), api = fake.adapter();
  await assert.rejects(api.validateChanges(project, fake.main, [{path: cardPath, content: fake.source(cardPath).content, baseSha: 'f'.repeat(40)}]), {code: 'SOURCE_CONFLICT'});
  await assert.rejects(api.validateChanges(project, fake.main, [{path: `content/history/${project.id}/v0.json`, content: '{}', baseSha: null}]), {status: 403});
  const change = {path: ackPath, content: fake.source(ackPath).content, baseSha: fake.source(ackPath).sha};
  await assert.rejects(api.validateChanges(project, fake.main, [change, change]), /distinct paths/);
});

test('project identity/category and mathematical permanent IDs cannot be replaced', async () => {
  const fake = new FakeGitHub(), api = fake.adapter();
  const source = fake.source(cardPath);
  for (const field of ['id', 'category']) {
    const bundle = JSON.parse(source.content); bundle.project[field] = 'other';
    await assert.rejects(api.validateChanges(project, fake.main, [{path: cardPath, content: JSON.stringify(bundle), baseSha: source.sha}]), /preserve/);
  }
  const bundle = JSON.parse(source.content);
  bundle.entries = [{id: 'THEORY-1', kind: 'result', title: 'A theorem', summary: 'Test statement', statement: 'x=x', proof: 'Reflexivity.', status: 'proved'}];
  const withEntry = new FakeGitHub({...starter(), [cardPath]: JSON.stringify(bundle)});
  bundle.entries = [];
  await assert.rejects(withEntry.adapter().validateChanges(project, withEntry.main, [{path: cardPath, content: JSON.stringify(bundle), baseSha: withEntry.source(cardPath).sha}]), {code: 'PERMANENT_ID_REMOVAL'});
});

test('changed reviewed statements cannot retain an obsolete proof-review badge', async () => {
  const bundle = JSON.parse(starter()[cardPath]);
  bundle.entries = [{id: 'THEORY-1', kind: 'result', title: 'A theorem', summary: 'Test statement', statement: 'x=x', proof: 'Reflexivity.', status: 'reviewed', review: {hash: 'old'}}];
  const fake = new FakeGitHub({...starter(), [cardPath]: JSON.stringify(bundle)});
  bundle.entries[0].statement = 'x=y';
  await assert.rejects(fake.adapter().validateChanges(project, fake.main, [{path: cardPath, content: JSON.stringify(bundle), baseSha: fake.source(cardPath).sha}]), {code: 'PROOF_REVIEW_REQUIRED'});
});

test('changing a prerequisite cannot retain an unchanged dependent review', async () => {
  const bundle = JSON.parse(starter()[cardPath]);
  bundle.entries = [
    {id: 'THEORY-A', kind: 'result', title: 'Prerequisite', summary: 'A supplied result', statement: 'x=x', proof: 'Reflexivity.', status: 'proved'},
    {id: 'THEORY-B', kind: 'result', title: 'Dependent', summary: 'Uses A', statement: 'x=x', proof: 'Apply THEORY-A.', status: 'reviewed', dependencies: ['THEORY-A'], review: {hash: 'old', supportHash: 'old-prerequisite'}},
  ];
  const fake = new FakeGitHub({...starter(), [cardPath]: JSON.stringify(bundle)});
  bundle.entries[0].statement = 'x=y';
  await assert.rejects(fake.adapter().validateChanges(project, fake.main, [{path: cardPath, content: JSON.stringify(bundle), baseSha: fake.source(cardPath).sha}]), {code: 'PROOF_REVIEW_REQUIRED', status: 409});
  assert.equal(fake.posts.length, 0);
});

test('project prose remains editable when reviewed entry records stay exactly unchanged', async () => {
  const bundle = JSON.parse(starter()[cardPath]);
  bundle.entries = [{id: 'THEORY-1', kind: 'result', title: 'Reviewed result', summary: 'A supplied result', statement: 'x=x', proof: 'Reflexivity.', status: 'reviewed', review: {hash: 'existing'}}];
  const fake = new FakeGitHub({...starter(), [cardPath]: JSON.stringify(bundle)});
  const before = JSON.stringify(bundle.entries);
  bundle.project.title = 'A clearer project title';
  bundle.project.summary = 'A clearer account of the same programme.';
  const normalized = await fake.adapter().validateChanges(project, fake.main, [{path: cardPath, content: JSON.stringify(bundle), baseSha: fake.source(cardPath).sha}]);
  const published = JSON.parse(normalized.find(change => change.path === cardPath).content);
  assert.equal(JSON.stringify(published.entries), before);
  assert.equal(published.project.title, bundle.project.title);
});

test('first public write is preceded by fresh authorization; denied jobs disclose nothing', async () => {
  const fake = new FakeGitHub(), api = fake.adapter();
  const changes = await cardChanges(api, fake);
  const revision = {...revisionFor(changes), baseRef: fake.main};
  await assert.rejects(api.publish(project, revision, 'operation-1', async () => { throw Object.assign(Error('Grant revoked'), {status: 403}); }), /Grant revoked/);
  assert.equal(fake.posts.length, 0);
  assert.equal(fake.refs.size, 1);
});

test('publication creates one PR, preserves unrelated concurrent work, and never updates main', async () => {
  const fake = new FakeGitHub(), api = fake.adapter();
  const changes = await cardChanges(api, fake);
  const revision = {...revisionFor(changes), baseRef: fake.main};
  const latest = fake.advance({'content/projects/elsewhere.json': '{"entries":[]}'});
  let authorized = 0;
  const outcome = await api.publish(project, revision, 'operation-1', async () => { authorized++; });
  assert.ok(authorized >= 1);
  assert.equal(outcome.prUrl, 'https://github.com/mathematician/atlas/pull/1');
  assert.equal(fake.refs.get('main'), latest);
  assert.equal(fake.commits.get(outcome.headSha).parents[0].sha, latest);
  assert.equal(fake.source('content/projects/elsewhere.json', outcome.headSha).content, '{"entries":[]}');
  assert.equal(fake.posts.filter(call => call.path === '/pulls').length, 1);
  assert.equal(fake.posts.some(call => call.method === 'PATCH' || call.path.endsWith('/merge')), false);
  assert.ok(fake.prs[0].body.includes('does not certify a mathematical proof or deploy'));
});

test('same-source concurrent edits cause conflict before any public writes', async () => {
  const fake = new FakeGitHub(), api = fake.adapter();
  const changes = await cardChanges(api, fake);
  const revision = {...revisionFor(changes), baseRef: fake.main};
  const card = JSON.parse(fake.source(cardPath).content); card.project.summary = 'Concurrent change';
  fake.advance({[cardPath]: JSON.stringify(card)});
  await assert.rejects(api.publish(project, revision, 'operation-1', async () => {}), {code: 'SOURCE_CONFLICT'});
  assert.equal(fake.posts.length, 0);
});

test('retries reconcile the exact same branch and PR, including a closed PR', async () => {
  const fake = new FakeGitHub(), api = fake.adapter();
  const changes = await cardChanges(api, fake);
  const revision = {...revisionFor(changes), baseRef: fake.main};
  const first = await api.publish(project, revision, 'operation-1', async () => {});
  const posts = fake.posts.length;
  fake.prs[0].state = 'closed';
  assert.deepEqual(await api.publish(project, revision, 'operation-1', async () => {}), first);
  assert.equal(fake.posts.length, posts);
  assert.equal(fake.prs.length, 1);
});

test('partial submission after a dropped PR response reconciles without a second branch', async () => {
  const fake = new FakeGitHub(), api = fake.adapter();
  const changes = await cardChanges(api, fake);
  const revision = {...revisionFor(changes), baseRef: fake.main};
  fake.failNext = {method: 'POST', path: '/pulls', throw: true};
  await assert.rejects(api.publish(project, revision, 'operation-1', async () => {}), {code: 'GITHUB_UNAVAILABLE', uncertain: true});
  assert.equal(fake.refs.size, 2);
  const result = await api.publish(project, revision, 'operation-1', async () => {});
  assert.equal(result.prUrl, 'https://github.com/mathematician/atlas/pull/1');
  assert.equal(fake.posts.filter(call => call.path === '/git/refs').length, 1);
});

test('reusing an operation ID with a different approved hash fails without overwriting branch', async () => {
  const fake = new FakeGitHub(), api = fake.adapter();
  const changes = await cardChanges(api, fake);
  const revision = {...revisionFor(changes), baseRef: fake.main};
  const result = await api.publish(project, revision, 'operation-1', async () => {});
  const posts = fake.posts.length;
  await assert.rejects(api.publish(project, {...revision, hash: 'b'.repeat(64)}, 'operation-1', async () => {}), {code: 'PUBLICATION_BRANCH_CONFLICT'});
  assert.equal(fake.posts.length, posts);
  assert.equal(fake.refs.get(result.branch), result.headSha);
});

test('tampered operation branch cannot be adopted as an approved revision', async () => {
  const fake = new FakeGitHub(), api = fake.adapter();
  const changes = await cardChanges(api, fake);
  const revision = {...revisionFor(changes), baseRef: fake.main};
  const result = await api.publish(project, revision, 'operation-1', async () => {});
  const commit = fake.commits.get(result.headSha);
  const changedTree = fake.makeTree({...starter(), 'stolen.txt': 'unexpected'});
  const tampered = fake.makeCommit(changedTree, [fake.main], commit.message);
  fake.refs.set(result.branch, tampered);
  await assert.rejects(api.publish(project, revision, 'operation-1', async () => {}), {code: 'PUBLICATION_BRANCH_CONFLICT'});
});

test('missing publication credential and incomplete tree fail closed', async () => {
  const fake = new FakeGitHub(), api = fake.adapter('');
  const changes = await cardChanges(api, fake);
  await assert.rejects(api.publish(project, {...revisionFor(changes), baseRef: fake.main}, 'operation-1', async () => {}), {status: 503, code: 'PUBLICATION_NOT_CONFIGURED'});
  const incomplete = new GitHubRepository({repository: fake.repository, fetchImpl: async (url, options) => {
    if (url.includes('/git/trees/')) return fake.response({tree: [], truncated: true});
    return fake.fetch(url, options);
  }});
  await assert.rejects(incomplete.listSources(project), {code: 'GITHUB_TREE_INCOMPLETE'});
});
