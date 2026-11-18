(() => {
  const forest = document.querySelector('[data-logic-forest]');
  if (!forest) return;
  const controls = forest.querySelector('[data-diagram-zoom-controls]');
  const canvas = forest.querySelector('[data-diagram-scroll]');
  const diagram = canvas?.querySelector?.('[data-complete-logical-diagram]');
  const toolbar = forest.querySelector('.logic-diagram-tools');
  const output = forest.querySelector('[data-diagram-zoom-value]');
  let zoom = 1;
  let zoomFramePending = false;
  let zoomAnchor;
  let hashFramePending = false;
  let hashNavigation = 0;
  if (controls) controls.hidden = false;

  function toolbarBottom() {
    const bounds = toolbar?.getBoundingClientRect();
    return bounds && bounds.top <= 0 && bounds.bottom > 0 ? bounds.bottom : 0;
  }
  function readingPoint() {
    if (hashFramePending) return;
    if (!diagram?.getBoundingClientRect || !canvas?.getBoundingClientRect) return;
    const bounds = diagram.getBoundingClientRect();
    const viewport = canvas.getBoundingClientRect();
    const anchor = { scrollX: window.scrollX, scrollY: window.scrollY, scrollLeft: canvas.scrollLeft };
    if (!(bounds.width > 0 && bounds.height > 0)) return anchor;
    const left = Math.max(0, viewport.left + canvas.clientLeft, bounds.left);
    const right = Math.min(window.innerWidth, viewport.left + canvas.clientLeft + canvas.clientWidth, bounds.right);
    const top = Math.max(0, toolbarBottom(), bounds.top);
    const bottom = Math.min(window.innerHeight, bounds.bottom);
    if (left >= right || top >= bottom) return anchor;
    anchor.x = (left + right) / 2;
    anchor.y = (top + bottom) / 2;
    anchor.u = (anchor.x - bounds.left) / bounds.width;
    anchor.v = (anchor.y - bounds.top) / bounds.height;
    return anchor;
  }
  function restoreReadingPoint(anchor) {
    if (!anchor) return;
    if (anchor.u === undefined) {
      // Changing a diagram below the viewport must not move the page.
      canvas.scrollLeft = anchor.scrollLeft;
      window.scrollTo({ left: anchor.scrollX, top: anchor.scrollY, behavior: 'instant' });
      return;
    }
    // Measure actual CSS dimensions after layout. This also compensates for
    // browser scroll anchoring instead of assuming the window stayed still.
    const bounds = diagram.getBoundingClientRect();
    canvas.scrollLeft += bounds.left + anchor.u * bounds.width - anchor.x;
    window.scrollTo({ left: window.scrollX,
      top: window.scrollY + bounds.top + anchor.v * bounds.height - anchor.y,
      behavior: 'instant' });
  }
  function setZoom(value) {
    const next = Math.max(.9, Math.min(2, Math.round(value * 10) / 10));
    if (next === zoom) return;
    // Several key presses in one animation frame share the original reading
    // point; recapturing it after a partial resize would accumulate drift.
    if (!zoomFramePending) zoomAnchor = readingPoint();
    zoom = next;
    canvas?.style.setProperty('--diagram-zoom', String(zoom));
    if (output) output.textContent = Math.round(zoom * 100) + '%';
    if (!zoomFramePending) {
      zoomFramePending = true;
      requestAnimationFrame(() => {
        zoomFramePending = false;
        const anchor = zoomAnchor;
        zoomAnchor = undefined;
        restoreReadingPoint(anchor);
      });
    }
  }
  forest.querySelector('[data-diagram-zoom="-"]')?.addEventListener('click', () => setZoom(zoom - .1));
  forest.querySelector('[data-diagram-zoom="+"]')?.addEventListener('click', () => setZoom(zoom + .1));
  forest.querySelector('[data-diagram-reset]')?.addEventListener('click', () => setZoom(1));
  function revealLogicHash() {
    const navigation = ++hashNavigation;
    hashFramePending = false;
    // Any new navigation wins over an older zoom, including a page anchor
    // outside the diagram. Only graph targets receive graph-specific focus.
    zoomAnchor = undefined;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = id && document.getElementById(id);
    if (!target || !forest.contains(target) || !target.matches('[data-logic-node], [data-logic-gate], [data-logic-tree]')) return;
    const hash = location.hash;
    hashFramePending = true;
    requestAnimationFrame(() => {
      if (navigation !== hashNavigation) return;
      hashFramePending = false;
      if (location.hash !== hash) return;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
      // CSS supplies a no-JS margin; account for a wrapping sticky toolbar too.
      const clearance = toolbarBottom();
      const bounds = target.getBoundingClientRect?.();
      if (clearance && bounds && bounds.top < clearance + 12)
        window.scrollBy({ top: bounds.top - clearance - 12, left: 0, behavior: 'instant' });
    });
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

// Keep a linked proof step as page context in the existing shared board.
// A diagram anchor is not a new permanent mathematical record ID.
(() => {
  const links = [...(document.querySelectorAll?.('[data-logic-feedback]') || [])];
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  if (!links.length || !canonical) return;
  function updateFeedbackContext() {
    const source = new URL(canonical);
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { id = ''; }
    const target = id && document.getElementById(id);
    const forest = document.querySelector('[data-logic-forest]');
    if (target && forest?.contains(target)) source.hash = location.hash;
    for (const link of links) {
      const destination = new URL(link.href);
      destination.searchParams.set('page', source.href);
      link.href = destination.href;
    }
  }
  window.addEventListener('hashchange', updateFeedbackContext);
  updateFeedbackContext();
})();
