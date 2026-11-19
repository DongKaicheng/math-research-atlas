// Public acknowledgement records are approved editorial data, not proof reviews.
// This validator performs no network calls and never interprets Issue closure or
// labels as acceptance. Render every returned text field as escaped plain text.
import {FEEDBACK_CATEGORIES} from './feedback.mjs';

const categories = new Set(FEEDBACK_CATEGORIES.map(([kind]) => kind));
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;

function fail(path, message) {
  throw new Error('Acknowledgements: ' + path + ' ' + message);
}

function object(value, path, required, optional = []) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    fail(path, 'must be a plain object');
  }
  const fields = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!fields.has(key)) fail(path, 'contains an unknown field: ' + key);
  }
  for (const key of required) {
    if (!own(value, key)) fail(path, 'is missing ' + key);
  }
  return value;
}

function schema(value, path) {
  if (value !== 1) fail(path, 'must be 1');
}

function text(value, path, maximum) {
  if (typeof value !== 'string') fail(path, 'must be plain text');
  // Do not silently remove invisible controls or trim a long value into safety.
  if (value.length > maximum) fail(path, 'exceeds ' + maximum + ' characters');
  if (/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value)) {
    fail(path, 'contains a control character');
  }
  const normalized = value.trim();
  if (!normalized.replace(/[\u200b\ufeff]/gu, '')) fail(path, 'must not be blank');
  return normalized;
}

function slug(value, path) {
  if (typeof value !== 'string' || value.length > 100
      || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    fail(path, 'must be a lowercase hyphenated identifier of at most 100 characters');
  }
  return value;
}

function date(value, path) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(path, 'must be an exact YYYY-MM-DD date');
  }
  const parsed = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    fail(path, 'must be a valid calendar date');
  }
  return value;
}

function repositoryName(value) {
  if (typeof value !== 'string' || value.length > 200
      || !/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(value)
      || ['.', '..'].includes(value.split('/')[1])) {
    fail('repository', 'must be an owner/repository name');
  }
  return value;
}

function githubUrl(value, path, repository) {
  if (typeof value !== 'string' || value.length > 600
      || /[\s\u0000-\u001f\u007f]/u.test(value)) {
    fail(path, 'must be a canonical repository URL');
  }
  let url;
  try { url = new URL(value); } catch { fail(path, 'must be a canonical repository URL'); }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port
      || url.username || url.password || value.includes('?') || url.search
      || (value.includes('#') && !url.hash) || url.href !== value
      || !url.pathname.startsWith('/' + repository + '/')) {
    fail(path, 'must be a canonical URL in the configured GitHub repository');
  }
  return url;
}

function issueUrl(value, path, repository) {
  const url = githubUrl(value, path, repository);
  const suffix = url.pathname.slice(repository.length + 2);
  if (!/^issues\/[1-9][0-9]*$/.test(suffix) || url.hash) {
    fail(path, 'must identify one exact repository Issue without a fragment');
  }
  return url.href;
}

function threadUrl(value, path, repository, feedbackUrl) {
  const url = githubUrl(value, path, repository);
  if ((url.hash && !/^#issuecomment-[1-9][0-9]*$/.test(url.hash))
      || url.origin + url.pathname !== feedbackUrl) {
    fail(path, 'must link to the same feedback thread or one of its Issue comments');
  }
  return url.href;
}

function changeUrl(value, path, repository) {
  const url = githubUrl(value, path, repository);
  const suffix = url.pathname.slice(repository.length + 2);
  if (url.hash || !/^(?:pull\/[1-9][0-9]*|commit\/[a-f0-9]{40})$/.test(suffix)) {
    fail(path, 'must identify a repository Pull Request or full commit SHA');
  }
  return url.href;
}

function publicCredit(value, path, repository, feedbackUrl) {
  object(value, path, ['mode'], ['displayName', 'consentUrl']);
  if (value.mode === 'unattributed') {
    if (own(value, 'displayName') || own(value, 'consentUrl')) {
      fail(path, 'unattributed credit must omit displayName and consentUrl');
    }
    // This is not an anonymity guarantee: the linked public Issue may name its author.
    return {mode: 'unattributed'};
  }
  if (!['named', 'username'].includes(value.mode)) fail(path + '.mode', 'is unsupported');
  const displayName = text(value.displayName, path + '.displayName', 160);
  if (value.mode === 'username'
      && !/^@?[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(displayName)) {
    fail(path + '.displayName', 'must be an explicitly permitted GitHub username');
  }
  const consentUrl = threadUrl(value.consentUrl, path + '.consentUrl', repository, feedbackUrl);
  return {mode: value.mode, displayName, consentUrl};
}

/**
 * Validate approved public records and group them by existing project.
 *
 * projectAcknowledgements is an array of per-project JSON documents. projects
 * accepts the site's current atlas bundles ({project: {id, ...}, ...}) or plain
 * project records ({id, ...}). Exactly one acknowledgement document is required
 * per project. The ledger's records must already be explicitly incorporated.
 *
 * Returns {schemaVersion, updatedAt, byProject}, with stable ordering and fresh
 * objects. Validation establishes structural integrity only: it does not fetch
 * URLs, verify consent, certify a proof, or confirm a merge/deployment.
 */
export function validateAcknowledgements(projectAcknowledgements, adoptedFeedback, projects, repository) {
  repositoryName(repository);
  if (!Array.isArray(projects) || !projects.length) fail('projects', 'must be a nonempty array');
  const projectIds = projects.map((record, i) => slug(record?.project?.id ?? record?.id, 'projects[' + i + '].id'));
  if (new Set(projectIds).size !== projectIds.length) fail('projects', 'contains duplicate project identifiers');
  projectIds.sort(compare);
  const known = new Set(projectIds);
  if (!Array.isArray(projectAcknowledgements)) fail('projectAcknowledgements', 'must be an array');

  object(adoptedFeedback, 'adoptedFeedback', ['schemaVersion', 'updatedAt', 'contributions']);
  schema(adoptedFeedback.schemaVersion, 'adoptedFeedback.schemaVersion');
  const ledgerDate = date(adoptedFeedback.updatedAt, 'adoptedFeedback.updatedAt');
  if (!Array.isArray(adoptedFeedback.contributions)) fail('adoptedFeedback.contributions', 'must be an array');

  const records = new Map();
  const idsByProject = new Map();
  for (const [index, document] of projectAcknowledgements.entries()) {
    const path = 'projectAcknowledgements[' + index + ']';
    object(document, path, ['schemaVersion', 'projectId', 'updatedAt', 'acknowledgements']);
    schema(document.schemaVersion, path + '.schemaVersion');
    const projectId = slug(document.projectId, path + '.projectId');
    if (!known.has(projectId)) fail(path + '.projectId', 'is not a known project');
    if (records.has(projectId)) fail(path + '.projectId', 'has more than one document');
    const updatedAt = date(document.updatedAt, path + '.updatedAt');
    if (!Array.isArray(document.acknowledgements)) fail(path + '.acknowledgements', 'must be an array');
    const ids = new Set();
    const acknowledgements = document.acknowledgements.map((entry, i) => {
      const p = path + '.acknowledgements[' + i + ']';
      object(entry, p, ['id', 'displayName', 'text']);
      const id = slug(entry.id, p + '.id');
      if (ids.has(id)) fail(p + '.id', 'is duplicated within this project');
      ids.add(id);
      return {id, displayName: text(entry.displayName, p + '.displayName', 160), text: text(entry.text, p + '.text', 2000)};
    }).sort((a, b) => compare(a.id, b.id));
    records.set(projectId, {projectId, updatedAt, acknowledgements, contributions: []});
    idsByProject.set(projectId, ids);
  }
  for (const projectId of projectIds) {
    if (!records.has(projectId)) fail('projectAcknowledgements', 'is missing project ' + projectId);
  }

  const ledgerIds = new Set();
  for (const [index, entry] of adoptedFeedback.contributions.entries()) {
    const path = 'adoptedFeedback.contributions[' + index + ']';
    object(entry, path, ['id', 'projectId', 'status', 'category', 'summary', 'acceptedAt', 'incorporatedAt', 'feedbackUrl', 'acceptanceUrl', 'changeUrl', 'credit']);
    const id = slug(entry.id, path + '.id');
    if (ledgerIds.has(id)) fail(path + '.id', 'is duplicated in the ledger');
    ledgerIds.add(id);
    const projectId = slug(entry.projectId, path + '.projectId');
    if (!known.has(projectId)) fail(path + '.projectId', 'is not a known project');
    if (idsByProject.get(projectId).has(id)) fail(path + '.id', 'is duplicated within this project');
    idsByProject.get(projectId).add(id);
    if (entry.status !== 'incorporated') fail(path + '.status', 'must be incorporated, not merely closed or accepted');
    if (!categories.has(entry.category)) fail(path + '.category', 'is not a feedback category');
    const summary = text(entry.summary, path + '.summary', 1000);
    const acceptedAt = date(entry.acceptedAt, path + '.acceptedAt');
    const incorporatedAt = date(entry.incorporatedAt, path + '.incorporatedAt');
    if (acceptedAt > incorporatedAt || incorporatedAt > ledgerDate) {
      fail(path, 'requires acceptedAt <= incorporatedAt <= ledger updatedAt');
    }
    // One collaborative Issue may produce several independently credited
    // contributions. Each keeps a globally unique ID and its own evidence.
    const feedbackUrl = issueUrl(entry.feedbackUrl, path + '.feedbackUrl', repository);
    const normalized = {
      id, projectId, status: 'incorporated', category: entry.category, summary,
      acceptedAt, incorporatedAt, feedbackUrl,
      acceptanceUrl: threadUrl(entry.acceptanceUrl, path + '.acceptanceUrl', repository, feedbackUrl),
      changeUrl: changeUrl(entry.changeUrl, path + '.changeUrl', repository),
      credit: publicCredit(entry.credit, path + '.credit', repository, feedbackUrl),
    };
    records.get(projectId).contributions.push(normalized);
  }

  const byProject = Object.fromEntries(projectIds.map(projectId => {
    const record = records.get(projectId);
    record.contributions.sort((a, b) => compare(b.incorporatedAt, a.incorporatedAt) || compare(a.id, b.id));
    // The ledger is a shared publication input: its date also covers editorial
    // changes to old contributions, not just their original incorporation date.
    record.updatedAt = record.updatedAt > ledgerDate ? record.updatedAt : ledgerDate;
    return [projectId, record];
  }));
  const updatedAt = Object.values(byProject).reduce((latest, record) => latest > record.updatedAt ? latest : record.updatedAt, ledgerDate);
  return {schemaVersion: 1, updatedAt, byProject};
}
