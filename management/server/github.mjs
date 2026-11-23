import {createHash} from 'node:crypto';

const API = 'https://api.github.com';
const SHA = /^[a-f0-9]{40}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_IDS = new Set(['site', 'projects', 'history', 'acknowledgements', 'feedback', 'agents', 'admin', 'management', 'scripts', 'public', 'content', 'lib', 'tests']);
const MAX_FILE = 1024 * 1024;
const MAX_CHANGESET = 4 * MAX_FILE;
const TEXT_EXTENSIONS = /\.(?:json|md|tex|bib|txt|csv|tsv|html|css|js|mjs|jsx|tsx|ts)$/i;
const EDIT_EXTENSIONS = /\.(?:json|md|tex|bib|txt|csv|tsv)$/i;
const encodePath = path => path.split('/').map(encodeURIComponent).join('/');
const json = value => JSON.stringify(value, null, 2) + '\n';
const digest = value => createHash('sha256').update(value).digest('hex');
const blobSha = value => createHash('sha1').update(`blob ${Buffer.byteLength(value)}\0`).update(value).digest('hex');

export class RepositoryError extends Error {
  constructor(message, status = 400, code = 'SOURCE_INVALID', extra = {}) {
    super(message);
    this.name = 'RepositoryError';
    this.status = status;
    this.code = code;
    Object.assign(this, extra);
  }
}
const fail = (message, status, code, extra) => { throw new RepositoryError(message, status, code, extra); };
const exactRef = ref => {
  if (!SHA.test(ref ?? '')) fail('Select an exact repository commit before editing.', 400, 'SOURCE_REF_REQUIRED');
  return ref;
};
function projectId(value) {
  if (typeof value !== 'string' || value.length > 64 || !ID.test(value) || RESERVED_IDS.has(value)) return null;
  return value;
}
function safePath(path) {
  return typeof path === 'string' && path.length > 0 && path.length <= 600 &&
    !/[\\%?#:\u0000-\u001f\u007f]/.test(path) && !path.startsWith('/') &&
    path.split('/').every(part => part && !part.startsWith('.') && part.trim() === part) &&
    !/(?:^|\/)(?:private|secrets?|credentials?|node_modules|drafts)(?:\/|\.|$)/i.test(path);
}
function scoped(id, path) {
  return path === `content/projects/${id}.json` || path === `content/acknowledgements/${id}.json` ||
    path.startsWith(`content/${id}/`) || path.startsWith(`content/history/${id}/`) ||
    path.startsWith(`public/projects/${id}/editions/`) || path.startsWith(`${id}/`);
}
export function isReadablePath(id, path) {
  return Boolean(projectId(id) && safePath(path) && scoped(id, path) && TEXT_EXTENSIONS.test(path));
}
export function isEditablePath(id, path) {
  if (!isReadablePath(id, path) || !EDIT_EXTENSIONS.test(path)) return false;
  if (path === `content/projects/${id}.json`) return id !== 'foundations';
  if (path === `content/acknowledgements/${id}.json`) return true;
  if (!path.startsWith(`content/${id}/`)) return false;
  const suffix = path.slice(`content/${id}/`.length);
  if (/^(?:releases|source-receipts|history)\//.test(suffix)) return false;
  if (/(?:^|\/)(?:current|manifest|manuscript-tags|package|package-lock|tsconfig|jsconfig)\.json$/i.test(suffix)) return false;
  return true;
}
function checkedProject(project) {
  if (!projectId(project?.id) || !['research', 'foundations'].includes(project.category)) {
    fail('The stored project identity or category is invalid.');
  }
  return project.id;
}
function nonempty(value, label, maximum = 4000) {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum || value.includes('\0')) fail(`${label} is invalid.`);
  return value;
}
function parseJSON(content, label) {
  try { return JSON.parse(content); } catch { fail(`${label} must contain valid JSON.`); }
}

/** Initial content is private until an exact revision is approved and submitted. */
export function initialProjectFiles(project) {
  const id = checkedProject(project);
  const timestamp = project.createdAt && Number.isFinite(Date.parse(project.createdAt))
    ? new Date(project.createdAt).toISOString() : new Date().toISOString();
  const summary = nonempty(project.summary, 'Project summary');
  return [
    {path: `content/projects/${id}.json`, baseSha: null, content: json({
      schemaVersion: 1, revision: 0, publishedAt: timestamp,
      changeSummary: 'Initial project outline; mathematical results require their own source review.',
      project: {id, title: nonempty(project.title, 'Project title', 200), category: project.category,
        subtitle: '', summary, authors: [], keywords: [], motivation: summary,
        programme: '', updatedAt: timestamp}, entries: [],
    })},
    {path: `content/acknowledgements/${id}.json`, baseSha: null, content: json({
      schemaVersion: 1, projectId: id, updatedAt: timestamp.slice(0, 10), acknowledgements: [],
    })},
  ];
}

function validateCard(project, candidate, previous) {
  const id = checkedProject(project);
  if (candidate?.schemaVersion !== 1 || candidate.project?.id !== id ||
      candidate.project?.category !== project.category || !Array.isArray(candidate.entries)) {
    fail('The project bundle must preserve its schema, permanent project ID and category.');
  }
  if (previous && candidate.project.category !== previous.project.category) fail('A source revision cannot change the project category.');
  const p = candidate.project;
  for (const key of ['title', 'summary']) nonempty(p[key], `Project ${key}`, key === 'title' ? 200 : 10000);
  for (const key of ['subtitle', 'motivation', 'programme']) {
    if (typeof p[key] !== 'string') fail(`Project ${key} must be text.`);
  }
  for (const key of ['authors', 'keywords']) {
    if (!Array.isArray(p[key]) || p[key].some(item => typeof item !== 'string')) fail(`Project ${key} must be a text array.`);
  }
  if (candidate.edition !== previous?.edition && (candidate.edition !== undefined || previous?.edition !== undefined)) {
    fail('Formal editions must use the project-specific release/import workflow.', 409, 'FORMAL_RELEASE_REQUIRED');
  }
  // A review can bind to prerequisites that this generic text adapter cannot
  // resolve transitively. Even an unchanged dependent may lose its applicable
  // review when another entry changes. Fail closed for the whole reviewed
  // corpus; only the dedicated mathematical release workflow may rebind it.
  // Project prose remains editable when the entry records are byte-equivalent.
  const previousEntries = previous?.entries ?? [];
  const entriesChanged = JSON.stringify(candidate.entries) !== JSON.stringify(previousEntries);
  const hasReviewBinding = entry => entry?.status === 'reviewed' || Boolean(entry?.review);
  if (entriesChanged && [...previousEntries, ...candidate.entries].some(hasReviewBinding)) {
    fail('Entry changes in a reviewed corpus require the project-specific dependency review and release workflow.', 409, 'PROOF_REVIEW_REQUIRED');
  }
  const entries = new Map();
  const oldEntries = new Map(previousEntries.map(entry => [entry.id, entry]));
  for (const entry of candidate.entries) {
    if (!entry || typeof entry.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(entry.id) || entries.has(entry.id)) {
      fail('Mathematical entry IDs must be permanent, unique, URL-safe identifiers.');
    }
    if (!['definition', 'note', 'result', 'conjecture', 'question'].includes(entry.kind)) fail(`Unsupported entry kind for ${entry.id}.`);
    for (const key of ['title', 'summary', 'statement', 'status']) nonempty(entry[key], `Entry ${key}`, MAX_FILE);
    const old = oldEntries.get(entry.id);
    const changed = !old || JSON.stringify(old) !== JSON.stringify(entry);
    if (changed && entry.status === 'reviewed') {
      fail('New or changed reviewed entries require the project-specific proof review and release workflow.', 409, 'PROOF_REVIEW_REQUIRED');
    }
    if (changed && entry.review) fail('Remove obsolete review bindings from a changed mathematical entry.', 409, 'STALE_PROOF_REVIEW');
    for (const key of ['proof', 'motivation', 'approach']) {
      if (entry[key] !== undefined && typeof entry[key] !== 'string') fail(`Entry ${key} must be text.`);
    }
    if (entry.status === 'proved' && !entry.proof?.trim()) fail('A proved entry requires the supplied proof text.');
    entries.set(entry.id, entry);
  }
  for (const id of oldEntries.keys()) if (!entries.has(id)) fail(`Permanent entry ${id} must be retained; use a withdrawal notice.`, 409, 'PERMANENT_ID_REMOVAL');
  return candidate;
}

/**
 * Scoped text adapter. No arbitrary URLs, commands, repository selection or
 * auto-merge are exposed to the caller. Credentials never enter return values.
 */
export class GitHubRepository {
  #token;
  #fetch;
  #trees = new Map();
  constructor({repository, branch = 'main', token = '', fetchImpl = globalThis.fetch} = {}) {
    if (typeof repository !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(repository)) fail('Invalid configured GitHub repository.');
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(branch) || branch.includes('..') || branch.includes('//') || branch.endsWith('/')) fail('Invalid configured publication branch.');
    this.repository = repository;
    this.branch = branch;
    this.#token = token;
    this.#fetch = fetchImpl;
  }
  async #request(path, {method = 'GET', body, optional = false} = {}) {
    const headers = {Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'OpenMath-Standalone-Management'};
    if (this.#token) headers.Authorization = `Bearer ${this.#token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    let response;
    try {
      response = await this.#fetch(`${API}/repos/${this.repository}${path}`, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error', signal: AbortSignal.timeout(20000),
      });
    } catch {
      fail('GitHub could not be reached. Check the operation state before retrying.', 502, 'GITHUB_UNAVAILABLE', {uncertain: method !== 'GET'});
    }
    if (optional && response.status === 404) return null;
    if (!response.ok) {
      fail(`GitHub returned HTTP ${response.status}.`, 502, 'GITHUB_HTTP_ERROR', {upstreamStatus: response.status, uncertain: method !== 'GET' && response.status >= 500});
    }
    const limit = 32 * MAX_FILE;
    if (Number(response.headers.get('content-length') ?? 0) > limit) fail('GitHub response exceeds the safe size limit.', 502, 'GITHUB_RESPONSE_TOO_LARGE');
    let raw;
    try { raw = await response.text(); } catch {
      fail('GitHub response was interrupted. Reconcile publication before retrying.', 502, 'GITHUB_UNAVAILABLE', {uncertain: method !== 'GET'});
    }
    if (Buffer.byteLength(raw) > limit) fail('GitHub response exceeds the safe size limit.', 502, 'GITHUB_RESPONSE_TOO_LARGE');
    try { return JSON.parse(raw); } catch { fail('GitHub returned an invalid response.', 502, 'GITHUB_RESPONSE_INVALID', {uncertain: method !== 'GET'}); }
  }
  async head() {
    const ref = await this.#request(`/git/ref/heads/${encodePath(this.branch)}`);
    if (ref.object?.type !== 'commit') fail('The configured repository branch is not a commit.', 502, 'GITHUB_RESPONSE_INVALID');
    return exactRef(ref.object.sha);
  }
  async #tree(ref) {
    exactRef(ref);
    if (this.#trees.has(ref)) return this.#trees.get(ref);
    const commit = await this.#request(`/git/commits/${ref}`);
    const treeSha = exactRef(commit.tree?.sha);
    const result = await this.#request(`/git/trees/${treeSha}?recursive=1`);
    if (result.truncated || !Array.isArray(result.tree)) fail('GitHub returned an incomplete tree; no source or publication decision was made.', 502, 'GITHUB_TREE_INCOMPLETE');
    const tree = new Map(result.tree.map(entry => [entry.path, entry]));
    const value = {tree, treeSha, commit};
    if (this.#trees.size >= 8) this.#trees.delete(this.#trees.keys().next().value);
    this.#trees.set(ref, value);
    return value;
  }
  #regular(entry, path, tree) {
    if (entry && (entry.type !== 'blob' || entry.mode !== '100644' || !SHA.test(entry.sha))) {
      fail('Only regular, non-executable text files are supported.', 403, 'SOURCE_MODE_FORBIDDEN');
    }
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) {
      const parent = tree.get(parts.slice(0, i).join('/'));
      if (parent && parent.type !== 'tree') fail('A source path crosses a non-directory object.', 403, 'SOURCE_MODE_FORBIDDEN');
    }
  }
  async #blob(entry) {
    if ((entry.size ?? 0) > MAX_FILE) fail('This source exceeds the one MiB editor limit.', 413, 'SOURCE_TOO_LARGE');
    const result = await this.#request(`/git/blobs/${entry.sha}`);
    if (result.encoding !== 'base64' || typeof result.content !== 'string' || result.size > MAX_FILE) fail('Only bounded UTF-8 text blobs are supported.', 413, 'SOURCE_TOO_LARGE');
    const bytes = Buffer.from(result.content, 'base64');
    if (bytes.length > MAX_FILE || bytes.includes(0)) fail('This file is not supported UTF-8 text.', 400, 'SOURCE_NOT_TEXT');
    let content;
    try { content = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true}).decode(bytes); } catch { fail('This file is not supported UTF-8 text.', 400, 'SOURCE_NOT_TEXT'); }
    if (blobSha(content) !== entry.sha) fail('The source blob did not match its exact Git hash.', 502, 'SOURCE_HASH_MISMATCH');
    return content;
  }
  #virtual(project, tree) {
    if (project.sourceKind !== 'workspace' || tree.has(`content/projects/${project.id}.json`)) return [];
    return initialProjectFiles(project);
  }
  async listSources(project, ref) {
    checkedProject(project);
    ref = ref === undefined ? await this.head() : exactRef(ref);
    const {tree} = await this.#tree(ref);
    const files = [];
    for (const [path, entry] of tree) {
      if (entry.type !== 'blob' || entry.mode !== '100644' || !isReadablePath(project.id, path)) continue;
      files.push({path, sha: entry.sha, size: entry.size ?? null, editable: isEditablePath(project.id, path) && (entry.size ?? 0) <= MAX_FILE});
    }
    for (const item of this.#virtual(project, tree)) {
      if (!tree.has(item.path)) files.push({path: item.path, sha: null, size: Buffer.byteLength(item.content), editable: true});
    }
    return {ref, files: files.sort((a, b) => a.path.localeCompare(b.path))};
  }
  async readSource(project, path, ref) {
    checkedProject(project);
    if (!isReadablePath(project.id, path)) fail('The source is outside this project or unsupported.', 403, 'SOURCE_FORBIDDEN');
    ref = ref === undefined ? await this.head() : exactRef(ref);
    const {tree} = await this.#tree(ref);
    const entry = tree.get(path);
    this.#regular(entry, path, tree);
    if (!entry) {
      const virtual = this.#virtual(project, tree).find(item => item.path === path);
      if (virtual) return {path, content: virtual.content, sha: null, ref, editable: true};
      fail('Source file not found in the selected commit.', 404, 'SOURCE_NOT_FOUND');
    }
    return {path, content: await this.#blob(entry), sha: entry.sha, ref, editable: isEditablePath(project.id, path)};
  }
  async validateChanges(project, baseRef, changes) {
    const id = checkedProject(project);
    exactRef(baseRef);
    if (!Array.isArray(changes) || changes.length < 1 || changes.length > 50) fail('A revision must contain between one and fifty source changes.');
    const {tree} = await this.#tree(baseRef);
    const normalized = [];
    const seen = new Set();
    let total = 0;
    const cardPath = `content/projects/${id}.json`;
    const cardEntry = tree.get(cardPath);
    this.#regular(cardEntry, cardPath, tree);
    let oldCardText, oldCard;
    if (cardEntry) { oldCardText = await this.#blob(cardEntry); oldCard = parseJSON(oldCardText, 'Current project bundle'); }
    const generatedHistoryPath = oldCard && Number.isSafeInteger(oldCard.revision)
      ? `content/history/${id}/v${oldCard.revision}.json` : null;
    for (const change of changes) {
      if (!change || typeof change !== 'object' || seen.has(change.path)) fail('Source changes must have distinct paths.');
      seen.add(change.path);
      const generatedHistory = change.path === generatedHistoryPath && change.content === oldCardText && change.baseSha === null;
      if (!isEditablePath(id, change.path) && !generatedHistory) fail('This source is read-only or outside the project.', 403, 'SOURCE_FORBIDDEN');
      if (typeof change.content !== 'string' || change.content.includes('\0')) fail('Source contents must be UTF-8 text.');
      const bytes = Buffer.byteLength(change.content);
      total += bytes;
      if (bytes > MAX_FILE || total > MAX_CHANGESET) fail('The revision exceeds the editor size limit.', 413, 'SOURCE_TOO_LARGE');
      if (change.baseSha !== null && !SHA.test(change.baseSha ?? '')) fail('Every source change needs its exact baseline blob SHA or null.');
      const entry = tree.get(change.path);
      this.#regular(entry, change.path, tree);
      if ((entry?.sha ?? null) !== change.baseSha) fail(`The baseline for ${change.path} does not match. Reload the source.`, 409, 'SOURCE_CONFLICT');
      if (change.path.endsWith('.json')) parseJSON(change.content, change.path);
      if (generatedHistory && entry) fail('The historical snapshot already exists; use the dedicated project release workflow.', 409, 'HISTORY_CONFLICT');
      normalized.push({path: change.path, content: change.content, baseSha: change.baseSha});
    }
    const card = normalized.find(change => change.path === cardPath);
    if (card) {
      const candidate = validateCard(project, parseJSON(card.content, 'Project bundle'), oldCard);
      const expectedRevision = oldCard ? oldCard.revision + 1 : 0;
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) fail('The current project revision is invalid.', 409, 'SOURCE_CONFLICT');
      if (oldCard && candidate.revision === oldCard.revision) {
        candidate.revision = expectedRevision;
        candidate.publishedAt = new Date().toISOString();
        candidate.project.updatedAt = candidate.publishedAt;
      }
      if (candidate.revision !== expectedRevision) fail('The proposed atlas revision does not follow the current revision.', 409, 'REVISION_NUMBER_CONFLICT');
      nonempty(candidate.changeSummary, 'Publication change summary', 10000);
      if (!Number.isFinite(Date.parse(candidate.publishedAt)) || !Number.isFinite(Date.parse(candidate.project.updatedAt))) fail('Publication and project dates must be valid ISO dates.');
      if (oldCard) {
        if (tree.has(generatedHistoryPath)) fail('A prior snapshot already occupies the next history slot; use the dedicated project release workflow.', 409, 'HISTORY_CONFLICT');
        const suppliedHistory = normalized.find(change => change.path === generatedHistoryPath);
        if (!suppliedHistory) normalized.push({path: generatedHistoryPath, content: oldCardText, baseSha: null});
      }
      card.content = json(candidate);
      // The public renderer writes one permanent route per entry. Check that a
      // newly introduced ID cannot overwrite another project's published route.
      const ownIds = new Set(candidate.entries.map(entry => entry.id));
      if (ownIds.size) {
        for (const [path, entry] of tree) {
          if (!/^content\/projects\/[^/]+\.json$/.test(path) || path === cardPath) continue;
          this.#regular(entry, path, tree);
          const other = parseJSON(await this.#blob(entry), 'Existing project bundle');
          if ((other.entries ?? []).some(item => ownIds.has(item.id))) fail('A mathematical entry ID already belongs to another project.', 409, 'PERMANENT_ID_CONFLICT');
        }
      }
    } else if (normalized.some(change => change.path === generatedHistoryPath)) {
      fail('A history snapshot must accompany its corresponding project-card revision.');
    }
    const ackPath = `content/acknowledgements/${id}.json`;
    const acknowledgement = normalized.find(change => change.path === ackPath);
    if (acknowledgement) {
      const ack = parseJSON(acknowledgement.content, 'Acknowledgements');
      if (ack.schemaVersion !== 1 || ack.projectId !== id || !Array.isArray(ack.acknowledgements) || !/^\d{4}-\d{2}-\d{2}$/.test(ack.updatedAt)) fail('Acknowledgements must retain the exact project ID and valid schema.');
    }
    if (!cardEntry && project.sourceKind === 'workspace') {
      if (!card) fail('The first publication must include the new project bundle.');
      if (!tree.has(ackPath) && !acknowledgement) {
        normalized.push(initialProjectFiles(project).find(change => change.path === ackPath));
      }
    }
    if (normalized.length > 50 || normalized.reduce((n, item) => n + Buffer.byteLength(item.content), 0) > MAX_CHANGESET) fail('Generated snapshots exceed the revision size limit.', 413, 'SOURCE_TOO_LARGE');
    return normalized.sort((a, b) => a.path.localeCompare(b.path));
  }
  async #findPR(branch) {
    const head = `${this.repository.split('/')[0]}:${branch}`;
    const pulls = await this.#request(`/pulls?state=all&head=${encodeURIComponent(head)}&base=${encodeURIComponent(this.branch)}&per_page=100`);
    if (!Array.isArray(pulls)) fail('GitHub returned invalid pull request data.', 502, 'GITHUB_RESPONSE_INVALID');
    return pulls.filter(pr => pr.head?.ref === branch && pr.head?.repo?.full_name?.toLowerCase() === this.repository.toLowerCase() && pr.base?.ref === this.branch);
  }
  async #existingBranch(branch, revision, marker) {
    const ref = await this.#request(`/git/ref/heads/${encodePath(branch)}`, {optional: true});
    if (!ref) return null;
    const headSha = exactRef(ref.object?.sha);
    const {tree, commit} = await this.#tree(headSha);
    if (!commit.message?.includes(marker) || commit.parents?.length !== 1) fail('The operation branch is not the approved publication candidate.', 409, 'PUBLICATION_BRANCH_CONFLICT');
    const {tree: parentTree} = await this.#tree(exactRef(commit.parents[0].sha));
    const expected = new Map(revision.changes.map(change => [change.path, blobSha(change.content)]));
    for (const [path, sha] of expected) {
      const entry = tree.get(path);
      if (entry?.sha !== sha || entry?.mode !== '100644' || entry.type !== 'blob') fail('The existing publication branch has changed.', 409, 'PUBLICATION_BRANCH_CONFLICT');
    }
    for (const path of new Set([...tree.keys(), ...parentTree.keys()])) {
      const before = parentTree.get(path), after = tree.get(path);
      if (before?.type === 'tree' || after?.type === 'tree') continue;
      if (!expected.has(path) && (before?.sha !== after?.sha || before?.mode !== after?.mode)) fail('The existing publication includes unexpected changes.', 409, 'PUBLICATION_BRANCH_CONFLICT');
    }
    return headSha;
  }
  async publish(project, revision, operationId, beforeSubmit) {
    const id = checkedProject(project);
    if (!this.#token) fail('A repository publication credential has not been configured.', 503, 'PUBLICATION_NOT_CONFIGURED');
    if (typeof beforeSubmit !== 'function') fail('A fresh publication authorization callback is required.', 403, 'PUBLICATION_NOT_AUTHORIZED');
    if (typeof operationId !== 'string' || operationId.length < 8 || operationId.length > 128 || !/^[A-Za-z0-9_-]+$/.test(operationId)) fail('Invalid publication operation ID.');
    if (!/^[a-f0-9]{64}$/.test(revision?.hash ?? '') || typeof revision.id !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(revision.id)) fail('An exact approved revision is required.');
    nonempty(revision.title, 'Revision title', 200);
    const validated = await this.validateChanges(project, revision.baseRef, revision.changes);
    if (JSON.stringify(validated) !== JSON.stringify(revision.changes)) fail('Publication content changed during validation; save and approve the normalized candidate again.', 409, 'PUBLICATION_HASH_CONFLICT');
    const operationHash = digest(operationId);
    const branch = `openmath/${id}/${operationHash.slice(0, 24)}`;
    const marker = `OpenMath-Revision: ${revision.id}\nOpenMath-Hash: ${revision.hash}\nOpenMath-Operation: ${operationHash}`;
    let headSha = await this.#existingBranch(branch, revision, marker);
    if (!headSha) {
      const current = await this.head();
      const {tree, treeSha} = await this.#tree(current);
      for (const change of revision.changes) {
        const entry = tree.get(change.path);
        this.#regular(entry, change.path, tree);
        if ((entry?.sha ?? null) !== change.baseSha) fail(`Published source ${change.path} changed after this draft began.`, 409, 'SOURCE_CONFLICT');
      }
      // Git blobs themselves are externally retrievable. This authorization
      // check precedes every write, including the first unreferenced tree/blob.
      await beforeSubmit();
      const createdTree = await this.#request('/git/trees', {method: 'POST', body: {
        base_tree: treeSha,
        tree: revision.changes.map(change => ({path: change.path, mode: '100644', type: 'blob', content: change.content})),
      }});
      const createdCommit = await this.#request('/git/commits', {method: 'POST', body: {
        message: `OpenMath: ${revision.title.replace(/[\r\n]/g, ' ')}\n\n${marker}`,
        tree: exactRef(createdTree.sha), parents: [current],
      }});
      headSha = exactRef(createdCommit.sha);
      // A branch may advance while external I/O is in flight. Never force or
      // overwrite main; a changed main is handled by PR review/required checks.
      await beforeSubmit();
      try {
        await this.#request('/git/refs', {method: 'POST', body: {ref: `refs/heads/${branch}`, sha: headSha}});
      } catch (error) {
        if (error.upstreamStatus !== 422) throw error;
        headSha = await this.#existingBranch(branch, revision, marker);
        if (!headSha) throw error;
      }
    }
    const existing = await this.#findPR(branch);
    if (existing.length > 1) fail('More than one publication PR uses this operation; reconcile it manually.', 409, 'PUBLICATION_PR_CONFLICT');
    let pr = existing[0];
    if (pr && pr.head?.sha !== headSha) fail('The publication pull request no longer contains the approved commit.', 409, 'PUBLICATION_BRANCH_CONFLICT');
    if (!pr) {
      await beforeSubmit();
      try {
        pr = await this.#request('/pulls', {method: 'POST', body: {
          title: `OpenMath: ${revision.title.replace(/[\r\n]/g, ' ')}`,
          head: branch, base: this.branch, draft: false,
          body: `## Approved source revision\n\nProject: \`${id}\`\n\nThis pull request discloses the exact owner-approved source candidate. It does not certify a mathematical proof or deploy the website.\n\nRun the repository publication checks and inspect the source/rendered diff before merging. Frozen editions remain unchanged.\n\n<!--\n${marker}\n-->`,
        }});
      } catch (error) {
        if (error.upstreamStatus !== 422) throw error;
        const reconciled = await this.#findPR(branch);
        if (reconciled.length !== 1 || reconciled[0].head?.sha !== headSha) throw error;
        pr = reconciled[0];
      }
    }
    const expectedPrefix = `https://github.com/${this.repository}/pull/`;
    if (typeof pr.html_url !== 'string' || !pr.html_url.startsWith(expectedPrefix) || !/^[1-9][0-9]*$/.test(pr.html_url.slice(expectedPrefix.length))) fail('GitHub did not return a verified pull request URL.', 502, 'GITHUB_RESPONSE_INVALID', {uncertain: true});
    return {prUrl: pr.html_url, branch, headSha};
  }
}
