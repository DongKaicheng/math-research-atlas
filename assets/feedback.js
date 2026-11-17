import {
  FEEDBACK_CATEGORIES, feedbackContext, feedbackIssueUrl,
  issueCategory, issueProject, matchesFeedback, isRepositoryIssueUrl,
} from './feedback-core.mjs';

const repository = window.ATLAS_GITHUB_REPOSITORY;
const list = document.getElementById('github-feedback');
if (repository && list && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
  const categories = Object.fromEntries(FEEDBACK_CATEGORIES);
  const buttons = [...document.querySelectorAll('.discussion-filters [data-category]')];
  const githubUrl = 'https://github.com/' + repository + '/issues';
  const issueLinks = [...document.querySelectorAll('a[data-feedback-kind]')];
  const contextHost = document.getElementById('feedback-context-controls');
  let contextForm, contextNotice, contextPanel;
  let lastContext = null;
  let issues = [];
  let nextPage = 1, loadedPages = 0;
  let hasMore = true, loading = false, error = false;

  function append(parent, tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined) el.textContent = value;
    parent.appendChild(el);
    return el;
  }
  function context() { return feedbackContext(location.search); }
  function category() {
    const value = new URLSearchParams(location.search).get('category') ?? '';
    return Object.hasOwn(categories, value) ? value : '';
  }
  function navigate(values) {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries(values)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.pushState({}, '', url.pathname + url.search + url.hash);
    draw();
  }
  function syncContext() {
    const c = context();
    issueLinks.forEach(link => {
      if (Object.hasOwn(categories, link.dataset.feedbackKind)) {
        link.href = feedbackIssueUrl(repository, link.dataset.feedbackKind, c);
      }
    });
    if (!contextForm) return;
    const serialized = JSON.stringify(c);
    // Preserve a reader's expansion and unsubmitted typing when only the board
    // is redrawn (pagination, loading, or a category filter).
    if (serialized === lastContext) return;
    lastContext = serialized;
    contextPanel.open = Object.values(c).some(Boolean);
    for (const key of ['project', 'entry', 'version', 'page']) {
      const control = contextForm.elements.namedItem(key);
      if (key === 'project' && c.project && ![...control.options].some(o => o.value === c.project)) {
        const option = append(control, 'option', '', c.project);
        option.value = c.project;
      }
      control.value = c[key];
    }
    contextNotice.textContent = c.project
      ? 'Showing feedback linked to ' + c.project + '. Mathematical forms below carry the optional context shown here. General feedback always opens without a theorem or version.'
      : 'All projects share this discussion board. Context is optional. General feedback needs no project, theorem, or version.';
  }
  if (contextHost) {
    contextPanel = append(contextHost, 'details', 'feedback-context-panel');
    append(contextPanel, 'summary', '', 'Optional context for a mathematical comment');
    contextForm = append(contextPanel, 'form', 'feedback-context');
    contextForm.setAttribute('aria-label', 'Optional feedback context');
    const scopeLabel = append(contextForm, 'label', '', 'Project');
    const scope = append(scopeLabel, 'select');
    scope.name = 'project';
    const all = append(scope, 'option', '', 'All projects / general website');
    all.value = '';
    for (const item of window.ATLAS_FEEDBACK_PROJECTS ?? []) {
      const value = feedbackContext({project: item.id}).project;
      if (!value) continue;
      const option = append(scope, 'option', '', String(item.title ?? value));
      option.value = value;
    }
    for (const [name, labelText, placeholder] of [
      ['entry', 'Result ID (optional)', 'Permanent ID, if relevant'],
      ['version', 'Version (optional)', 'Exact edition, if known'],
      ['page', 'Page link (optional)', 'The page or paper being discussed'],
    ]) {
      const label = append(contextForm, 'label', '', labelText);
      const input = append(label, 'input');
      input.name = name;
      input.type = 'text';
      input.maxLength = name === 'page' ? 1000 : 128;
      input.placeholder = placeholder;
    }
    const actions = append(contextForm, 'div', 'feedback-context-actions');
    const apply = append(actions, 'button', 'button button-outline', 'Apply context');
    apply.type = 'submit';
    const clear = append(actions, 'button', 'button button-outline', 'Clear context');
    clear.type = 'button';
    clear.addEventListener('click', () => {
      lastContext = null;
      navigate({project: '', entry: '', version: '', page: ''});
    });
    contextNotice = append(contextPanel, 'p', 'discussion-note');
    contextNotice.setAttribute('aria-live', 'polite');
    contextForm.addEventListener('submit', event => {
      event.preventDefault();
      const values = feedbackContext(Object.fromEntries(new FormData(contextForm)));
      navigate({...values, ...(values.project && category() === 'general' ? {category: ''} : {})});
    });
  }

  function draw() {
    const c = context(), selected = category();
    syncContext();
    buttons.forEach(b => {
      const active = b.dataset.category === selected;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    list.replaceChildren();
    list.setAttribute('aria-busy', String(loading));
    const visible = issues.filter(issue => matchesFeedback(issue, {project: c.project, category: selected}));
    if (!visible.length) {
      const empty = append(list, 'div', 'discussion-empty');
      append(empty, 'h2', '', loading && !loadedPages ? 'Loading public feedback…'
        : error && !loadedPages ? 'Read public feedback on GitHub'
          : hasMore ? 'No matching feedback among the issues loaded so far.'
            : 'No public feedback matches this filter.');
      append(empty, 'p', '', c.project
        ? 'Older posts without an identifiable project may appear only in All projects. You can also browse or search all Issues on GitHub.'
        : 'Use a form below to start a discussion, or browse all Issues on GitHub.');
    }
    for (const issue of visible) {
      if (!isRepositoryIssueUrl(issue.html_url, repository)) continue;
      const card = append(list, 'a', 'discussion-card');
      card.href = issue.html_url;
      card.rel = 'noopener noreferrer';
      const meta = append(card, 'div', 'discussion-meta');
      append(meta, 'span', 'discussion-tag', categories[issueCategory(issue)] ?? 'Other feedback');
      const project = issueProject(issue);
      if (project) append(meta, 'span', '', project);
      append(meta, 'span', '', issue.state === 'closed' ? 'Closed discussion' : 'Open discussion');
      const date = new Date(issue.created_at);
      const login=issue.user?.login ?? 'Reader';
      const displayName=login.toLowerCase()===repository.split('/')[0].toLowerCase()?'Maintainer':login;
      append(meta, 'span', '', displayName + (Number.isNaN(date.valueOf()) ? '' : ' · ' + date.toLocaleDateString('en-GB', {year: 'numeric', month: 'short', day: 'numeric'})));
      append(card, 'h2', '', issue.title ?? 'Untitled feedback');
      append(card, 'p', '', String(issue.body ?? '').replace(/[#*\[\]<>]/g, '').trim().slice(0, 260));
      append(card, 'span', 'discussion-read', (Number.isSafeInteger(issue.comments) ? issue.comments : 0) + ' comments · View discussion');
    }
    const footer = append(list, 'div', 'feedback-pagination');
    append(footer, 'p', 'discussion-note', loadedPages
      ? 'Showing ' + visible.length + ' matching discussions from ' + issues.length + ' issues loaded (' + loadedPages + ' page' + (loadedPages === 1 ? '' : 's') + ').' + (hasMore ? ' Older issues may not yet be shown.' : '')
      : 'This page reads the public GitHub issue list; GitHub is the complete discussion record.');
    if (error) append(footer, 'p', 'discussion-note', 'GitHub could not load the next page. Existing results remain visible. Retry or use the link below.');
    if (hasMore) {
      const more = append(footer, 'button', 'button button-outline', loading ? 'Loading…' : error ? 'Retry loading feedback' : 'Load older feedback');
      more.type = 'button';
      more.disabled = loading;
      more.addEventListener('click', loadNextPage);
    }
    const full = append(footer, 'a', 'text-link', 'Browse and search all GitHub Issues');
    full.href = githubUrl;
    full.rel = 'noopener noreferrer';
  }

  async function loadNextPage() {
    if (loading || !hasMore) return;
    loading = true; error = false; draw();
    try {
      const result = await fetch('https://api.github.com/repos/' + repository + '/issues?state=all&per_page=100&sort=created&direction=desc&page=' + nextPage, {
        headers: {Accept: 'application/vnd.github+json'}, credentials: 'omit',
      });
      if (!result.ok) throw new Error('GitHub API unavailable');
      const values = await result.json();
      if (!Array.isArray(values)) throw new Error('Invalid issue list');
      const known = new Set(issues.map(i => i.number));
      for (const issue of values) {
        if (!issue.pull_request && !known.has(issue.number) && isRepositoryIssueUrl(issue.html_url, repository)) {
          issues.push(issue); known.add(issue.number);
        }
      }
      nextPage += 1; loadedPages += 1; hasMore = values.length === 100;
    } catch { error = true; }
    finally { loading = false; draw(); }
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    if (button.dataset.category === 'general') lastContext = null;
    navigate({
      category: button.dataset.category,
      ...(button.dataset.category === 'general' ? {project: '', entry: '', version: '', page: ''} : {}),
    });
  }));
  addEventListener('popstate', draw);
  loadNextPage();
}
