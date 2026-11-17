(() => {
  'use strict';
  const repo = window.ATLAS_GITHUB_REPOSITORY;
  const list = document.getElementById('github-feedback');
  if (!repo || !list) return;
  const categories = {
    question: 'Questions', correction: 'Corrections', reference: 'References',
    suggestion: 'Ideas', proof: 'Proofs', counterexample: 'Counterexamples',
    formalization: 'Lean / formalization',
  };
  const buttons = [...document.querySelectorAll('.discussion-filters button[data-category]')];
  let issues = [];
  const githubUrl = 'https://github.com/' + repo + '/issues';

  function category(issue) {
    for (const l of issue.labels || []) {
      const name = typeof l === 'string' ? l : l.name;
      if (Object.hasOwn(categories, name)) return name;
    }
    const prefix = /^\[([^\]]+)\]/.exec(issue.title || '')?.[1]?.toLowerCase();
    return Object.keys(categories).find(k => k === prefix) || 'question';
  }
  function append(parent, tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = value;
    parent.appendChild(el);
    return el;
  }
  function draw() {
    const requested = new URLSearchParams(location.search).get('category') || '';
    const selected = Object.hasOwn(categories, requested) ? requested : '';
    buttons.forEach(b => b.classList.toggle('active', b.dataset.category === selected));
    list.replaceChildren();
    const visible = issues.filter(issue => !selected || category(issue) === selected);
    if (!visible.length) {
      const empty = append(list, 'div', 'discussion-empty', '');
      append(empty, 'h2', '', 'No public feedback in this category yet.');
      append(empty, 'p', '', 'Start a new discussion below, or see all Issues on GitHub.');
      return;
    }
    visible.forEach(issue => {
      if (typeof issue.html_url !== 'string' || !issue.html_url.startsWith(githubUrl + '/')) return;
      const card = document.createElement('a');
      card.className = 'discussion-card';
      card.href = issue.html_url;
      card.rel = 'noopener noreferrer';
      const meta = append(card, 'div', 'discussion-meta', '');
      append(meta, 'span', 'discussion-tag', categories[category(issue)]);
      const date = new Date(issue.created_at).toLocaleDateString('en-GB', {year:'numeric',month:'short',day:'numeric'});
      append(meta, 'span', '', (issue.user?.login || 'Reader') + ' · ' + date);
      append(card, 'h2', '', issue.title || 'Untitled feedback');
      const preview = (issue.body || '').replace(/[#*\[\]<>]/g, '').trim().slice(0, 260);
      append(card, 'p', '', preview);
      append(card, 'span', 'discussion-read', issue.comments + ' comments · View discussion ↗');
      list.appendChild(card);
    });
  }
  buttons.forEach(b => b.addEventListener('click', () => {
    const chosen = b.dataset.category;
    const dest = chosen ? '?category=' + encodeURIComponent(chosen) : location.pathname;
    history.pushState({}, '', dest);
    draw();
  }));
  addEventListener('popstate', draw);
  fetch('https://api.github.com/repos/' + repo + '/issues?state=all&per_page=100&sort=created&direction=desc', {
    headers: {'Accept': 'application/vnd.github+json'}
  }).then(async result => {
    if (!result.ok) throw Error('GitHub API unavailable');
    const values = await result.json();
    issues = values.filter(x => !x.pull_request);
    draw();
  }).catch(() => {
    list.replaceChildren();
    const fallback = append(list, 'div', 'discussion-empty', '');
    append(fallback, 'h2', '', 'Read public discussions on GitHub');
    append(fallback, 'p', '', 'GitHub discussions cannot be loaded on this page right now.');
    const link = append(fallback, 'a', 'button button-dark', 'Open GitHub Issues ↗');
    link.href = githubUrl;
  });
})();
