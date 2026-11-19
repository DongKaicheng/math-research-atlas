// Shared by the static build, browser, and regression tests. No write endpoint.
export const FEEDBACK_CATEGORIES = Object.freeze([
  ['general', 'General feedback'], ['question', 'Questions'],
  ['correction', 'Corrections'], ['reference', 'References'],
  ['suggestion', 'Ideas'], ['proof', 'Proofs'],
  ['counterexample', 'Counterexamples'], ['formalization', 'Lean / formalization'],
]);
export const COMMUNITY_CATEGORIES = Object.freeze([
  ['project-proposal', 'New project proposals'],
  ['maintainer-application', 'Project manager applications'],
]);
const kinds = new Set(FEEDBACK_CATEGORIES.map(([kind]) => kind));
const applicationKinds = new Set(COMMUNITY_CATEGORIES.map(([kind]) => kind));
const displayKinds = new Set([...kinds, ...applicationKinds]);
export const isSiteWideCategory = kind => kind === 'general' || applicationKinds.has(kind);

// Applications are owner-reviewed public discussions. They deliberately carry
// no theorem, revision, or permission-bearing project context.
export function applicationIssueUrl(repository, kind) {
  if (repository.length > 200 || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Invalid feedback repository');
  if (!applicationKinds.has(kind)) throw new Error('Unknown application category');
  const url = new URL('https://github.com/' + repository + '/issues/new');
  url.searchParams.set('template', kind + '.yml');
  url.searchParams.set('title', '[' + kind[0].toUpperCase() + kind.slice(1) + '] ');
  return url.href;
}
const slug = value => String(value ?? '').length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value ?? ''))
  ? String(value) : '';
const shortText = (value, maximum = 160) => {
  const text = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return text.length <= maximum ? text : '';
};
const contextValue = (query, key) => query instanceof URLSearchParams ? query.get(key)
  : typeof query === 'object' && query !== null ? query[key]
    : new URLSearchParams(String(query)).get(key);
export const MAX_ISSUE_URL_LENGTH = 2000;

function pageReference(value) {
  const text = String(value ?? '').trim();
  // A shortened URL may identify another page or lose the exact proof anchor.
  if (text.length > 1000 || /[\u0000-\u001f\u007f]/.test(text)) return '';
  if (text.startsWith('/') && !text.startsWith('//')) return text;
  try {
    const url = new URL(text);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && url.href.length <= 1000) return url.href;
  } catch { /* Invalid context is optional, not a navigation target. */ }
  return '';
}
export function feedbackContext(query = '') {
  const get = key => contextValue(query, key);
  const entry = shortText(get('entry'), 128);
  return {
    project: slug(get('project')),
    entry: /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(entry) ? entry : '',
    version: shortText(get('version'), 120),
    page: pageReference(get('page')),
  };
}
export function feedbackIssueUrl(repository, kind = 'general', context = {}) {
  return feedbackIssueDraft(repository, kind, context).url;
}
export function feedbackIssueDraft(repository, kind = 'general', context = {}) {
  if (repository.length > 200 || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Invalid feedback repository');
  if (!kinds.has(kind)) throw new Error('Unknown feedback category');
  const url = new URL('https://github.com/' + repository + '/issues/new');
  url.searchParams.set('template', kind + '.yml');
  const label = kind[0].toUpperCase() + kind.slice(1);
  const c = feedbackContext(context);
  // General feedback deliberately has no theorem, project, or revision binding.
  if (kind === 'general') {
    url.searchParams.set('title', '[General] ');
    return {url: url.href, omitted: []};
  }
  const omitted = new Set(['project', 'entry', 'version', 'page'].filter(key =>
    String(contextValue(context, key) ?? '').trim() && !c[key]));
  url.searchParams.set('title', '[' + label + '] ' + (c.project ? '[' + c.project + '] ' : ''));
  if (c.project) url.searchParams.set('project', c.project);
  const target = [c.entry, c.page].filter(Boolean).join(' — ');
  if (target) url.searchParams.set('target', target);
  if (c.version) url.searchParams.set('version', c.version);
  if (url.href.length > MAX_ISSUE_URL_LENGTH && c.page) {
    if (c.entry) url.searchParams.set('target', c.entry);
    else url.searchParams.delete('target');
    omitted.add('page');
  }
  if (url.href.length > MAX_ISSUE_URL_LENGTH && c.version) {
    url.searchParams.delete('version');
    omitted.add('version');
  }
  return {url: url.href, omitted: [...omitted]};
}
export function issueCategory(issue) {
  for (const label of issue?.labels ?? []) {
    const name = String(typeof label === 'string' ? label : label.name ?? '').toLowerCase();
    if (displayKinds.has(name)) return name;
  }
  const prefix = /^\[([^\]]+)\]/.exec(issue?.title ?? '')?.[1]?.toLowerCase();
  return displayKinds.has(prefix) ? prefix : 'other';
}
function formField(body, heading) {
  const safe = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(?:^|\\n)### ' + safe + '\\s*\\n([\\s\\S]*?)(?=\\n### |$)').exec(body ?? '')?.[1]?.trim() ?? '';
}
export function issueProject(issue) {
  if (isSiteWideCategory(issueCategory(issue))) return '';
  for (const label of issue?.labels ?? []) {
    const name = String(typeof label === 'string' ? label : label.name ?? '');
    if (name.startsWith('project:') && slug(name.slice(8))) return slug(name.slice(8));
  }
  const explicit = formField(issue?.body, 'Project (optional)');
  if (slug(explicit)) return slug(explicit);
  // Legacy atlas issues used the target field or a project title prefix.
  const target = formField(issue?.body, 'Related project or result');
  const inLink = /\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:[\/#?\s]|$)/.exec(target)?.[1];
  if (inLink) return inLink;
  if (slug(target)) return slug(target);
  const prefixes = [...String(issue?.title ?? '').matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);
  return prefixes.map(slug).find(value => value && !kinds.has(value)) ?? '';
}
export function matchesFeedback(issue, {project = '', category = ''} = {}) {
  return !issue?.pull_request && (!category || issueCategory(issue) === category)
    && (!project || issueProject(issue) === project);
}
export function isRepositoryIssueUrl(value, repository) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com'
      && !url.username && !url.password && !url.search && !url.hash
      && new RegExp('^/' + repository.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/issues/[1-9][0-9]*$').test(url.pathname);
  } catch { return false; }
}
