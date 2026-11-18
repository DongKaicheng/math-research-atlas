(() => {
  const forest = document.querySelector('[data-logic-forest]');
  if (!forest) return;
  const details = [...forest.querySelectorAll('details')];
  const controls = forest.querySelector('[data-logic-controls]');
  if (controls) controls.hidden = false;
  forest.querySelector('[data-logic-expand]')?.addEventListener('click', () => details.forEach(item => { item.open = true; }));
  forest.querySelector('[data-logic-overview]')?.addEventListener('click', () => details.forEach(item => { item.open = false; }));
  function revealLogicHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = id && document.getElementById(id);
    if (!target || !forest.contains(target)) return;
    let parent = target.parentElement;
    while (parent && parent !== forest) {
      if (parent.tagName === 'DETAILS') parent.open = true;
      parent = parent.parentElement;
    }
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
  }
  window.addEventListener('hashchange', revealLogicHash);
  revealLogicHash();
})();

(() => {
  const root = document.querySelector('[data-research-map]');
  if (!root) return;
  const controls = root.querySelector('.map-controls');
  const input = root.querySelector('#map-search');
  const output = root.querySelector('.map-match-count');
  const empty = root.querySelector('.map-empty');
  const items = [...root.querySelectorAll('[data-map-item]')];
  const containers = [...root.querySelectorAll('[data-map-container]')].reverse();
  const details = [...root.querySelectorAll('details')];
  const branches = [...root.querySelectorAll('[data-map-branch-node]')];
  const recordCount = root.querySelectorAll('[data-record-id]').length;
  const normalized = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  let savedState;

  function filter() {
    const query = normalized(input.value.trim());
    const terms = query.split(/\s+/).filter(Boolean);
    if (query && !savedState) savedState = details.map(detail => detail.open);
    for (const item of items) {
      const branch = item.closest('[data-map-branch-node]');
      const labels = [item.textContent, branch?.querySelector('.map-branch-title')?.textContent];
      let group = item.closest('[data-map-group]');
      while (group) {
        labels.push(group.querySelector(':scope > summary')?.textContent);
        group = group.parentElement?.closest('[data-map-group]');
      }
      const text = normalized(labels.join(' '));
      item.hidden = terms.some(term => !text.includes(term));
      // A matching geometric application may be inside a native disclosure.
      if (query && !item.hidden) item.querySelectorAll('details').forEach(detail => { detail.open = true; });
    }
    for (const container of containers) {
      const visible = [...container.querySelectorAll('[data-map-item]')].some(item => !item.hidden);
      container.hidden = Boolean(query) && !visible;
      if (query && visible) {
        const disclosure = container.querySelector(':scope > details');
        if (disclosure) disclosure.open = true;
      }
    }
    if (!query && savedState) {
      details.forEach((detail, index) => { detail.open = savedState[index]; });
      savedState = undefined;
    }
    const matches = items.filter(item => !item.hidden).length;
    const visibleBranches = branches.filter(branch => !branch.hidden).length;
    output.textContent = query
      ? `${matches} matching ${matches === 1 ? 'item' : 'items'} in ${visibleBranches} ${visibleBranches === 1 ? 'branch' : 'branches'}`
      : `${recordCount} records in ${branches.length} branches`;
    empty.hidden = !query || matches > 0;
  }

  input.addEventListener('input', filter);
  root.querySelector('[data-map-expand]').addEventListener('click', () => {
    details.forEach(detail => { if (!detail.closest('[hidden]')) detail.open = true; });
  });
  root.querySelector('[data-map-overview]').addEventListener('click', () => {
    input.value = '';
    filter();
    details.forEach(detail => { detail.open = false; });
  });

  // Permanent map anchors also work when their branches are initially closed.
  function revealHash() {
    if (!location.hash) return;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    const index = root.closest('.map-reference-index');
    if (!target || (!root.contains(target) && target !== index)) return;
    if (index) index.open = true;
    if (input.value) { input.value = ''; filter(); }
    if (target.tagName === 'DETAILS') target.open = true;
    const child = target.querySelector(':scope > details');
    if (child) child.open = true;
    let parent = target.parentElement;
    while (parent && parent !== root) {
      if (parent.tagName === 'DETAILS') parent.open = true;
      parent = parent.parentElement;
    }
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
  }
  window.addEventListener('hashchange', revealHash);
  controls.hidden = false;
  revealHash();
})();
