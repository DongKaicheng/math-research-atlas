// Shared by the static build, browser, and regression tests. No write endpoint.
export const FEEDBACK_CATEGORIES = Object.freeze([
  ['general', 'General feedback'], ['question', 'Questions'],
  ['correction', 'Corrections'], ['reference', 'References'],
  ['suggestion', 'Ideas'], ['proof', 'Proofs'],
  ['counterexample', 'Counterexamples'], ['formalization', 'Lean / formalization'],
]);
const kinds = new Set(FEEDBACK_CATEGORIES.map(([kind]) => kind));
const slug = value => String(value ?? '').length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value ?? ''))
  ? String(value) : '';
const shortText = (value, maximum = 160) => String(value ?? '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maximum);

function pageReference(value) {
  const text = shortText(value, 1000);
  if (text.startsWith('/') && !text.startsWith('//')) return text;
  try {
    const url = new URL(text);
    if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return url.href;
  } catch { /* Invalid context is optional, not a navigation target. */ }
  return '';
}
export function feedbackContext(query = '') {
  const get = query instanceof URLSearchParams ? key => query.get(key)
    : typeof query === 'object' && query !== null ? key => query[key]
      : key => new URLSearchParams(String(query)).get(key);
  const entry = shortText(get('entry'), 128);
  return {
    project: slug(get('project')),
    entry: /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(entry) ? entry : '',
    version: shortText(get('version'), 120),
    page: pageReference(get('page')),
  };
}
export function feedbackIssueUrl(repository, kind = 'general', context = {}) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Invalid feedback repository');
  if (!kinds.has(kind)) throw new Error('Unknown feedback category');
  const url = new URL('https://github.com/' + repository + '/issues/new');
  url.searchParams.set('template', kind + '.yml');
  const label = kind[0].toUpperCase() + kind.slice(1);
  const c = feedbackContext(context);
  // General feedback deliberately has no theorem, project, or revision binding.
  if (kind === 'general') {
    url.searchParams.set('title', '[General] ');
    return url.href;
  }
  url.searchParams.set('title', '[' + label + '] ' + (c.project ? '[' + c.project + '] ' : ''));
  if (c.project) url.searchParams.set('project', c.project);
  const target = [c.entry, c.page].filter(Boolean).join(' — ');
  if (target) url.searchParams.set('target', target);
  if (c.version) url.searchParams.set('version', c.version);
  return url.href;
}
export function issueCategory(issue) {
  for (const label of issue?.labels ?? []) {
    const name = String(typeof label === 'string' ? label : label.name ?? '').toLowerCase();
    if (kinds.has(name)) return name;
  }
  const prefix = /^\[([^\]]+)\]/.exec(issue?.title ?? '')?.[1]?.toLowerCase();
  return kinds.has(prefix) ? prefix : 'other';
}
function formField(body, heading) {
  const safe = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(?:^|\\n)### ' + safe + '\\s*\\n([\\s\\S]*?)(?=\\n### |$)').exec(body ?? '')?.[1]?.trim() ?? '';
}
export function issueProject(issue) {
  if (issueCategory(issue) === 'general') return '';
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
