(() => {
  const forest = document.querySelector('[data-logic-forest]');
  if (!forest) return;
  const panels = [...(forest.querySelectorAll?.('[data-logic-panel]') || [])];
  const states = [];
  let hashNavigation = 0;
  let hashFramePending = false;
  let resizeFramePending = false;
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  function toolbarBottom(state) {
    const bounds = state?.toolbar?.getBoundingClientRect();
    return bounds && bounds.top <= 0 && bounds.bottom > 0 ? bounds.bottom : 0;
  }
  function readingPoint(state) {
    if (hashFramePending) return;
    const { canvas, diagram } = state;
    const bounds = diagram.getBoundingClientRect();
    const viewport = canvas.getBoundingClientRect();
    const anchor = {
      navigation: hashNavigation, scrollX: window.scrollX, scrollY: window.scrollY,
      scrollLeft: canvas.scrollLeft, scrollTop: canvas.scrollTop,
    };
    if (!(bounds.width > 0 && bounds.height > 0 && canvas.clientWidth > 0 && canvas.clientHeight > 0)) return anchor;
    const contentLeft = viewport.left + canvas.clientLeft;
    const contentTop = viewport.top + canvas.clientTop;
    const left = Math.max(0, contentLeft, bounds.left);
    const right = Math.min(window.innerWidth, contentLeft + canvas.clientWidth, bounds.right);
    const top = Math.max(0, toolbarBottom(state), contentTop, bounds.top);
    const bottom = Math.min(window.innerHeight, contentTop + canvas.clientHeight, bounds.bottom);
    if (left >= right || top >= bottom) return anchor;
    const x = (left + right) / 2, y = (top + bottom) / 2;
    anchor.u = (x - bounds.left) / bounds.width;
    anchor.v = (y - bounds.top) / bounds.height;
    anchor.viewportX = (x - contentLeft) / canvas.clientWidth;
    anchor.viewportY = (y - contentTop) / canvas.clientHeight;
    return anchor;
  }
  function automaticReadingPoint(state) {
    const anchor = readingPoint(state);
    // Background panels have no visible reading point to preserve. In
    // particular, they must never restore a document scroll position.
    if (anchor?.u === undefined) return;
    anchor.automatic = true;
    return anchor;
  }
  function restoreReadingPoint(state, anchor) {
    if (!anchor || anchor.navigation !== hashNavigation || hashFramePending) return;
    const { canvas, diagram } = state;
    if (anchor.automatic) {
      // Responsive layout is not a reading gesture. Let scrolling between
      // frames win, and do not adjust a panel that has left the viewport.
      if (window.scrollX !== anchor.scrollX || window.scrollY !== anchor.scrollY ||
        canvas.scrollLeft !== anchor.scrollLeft || canvas.scrollTop !== anchor.scrollTop ||
        readingPoint(state)?.u === undefined) return;
    } else if (window.scrollX !== anchor.scrollX || window.scrollY !== anchor.scrollY) {
      // Only an explicit zoom/fit/reset compensates native page anchoring.
      window.scrollTo({ left: anchor.scrollX, top: anchor.scrollY, behavior: 'instant' });
    }
    if (anchor.u === undefined) {
      canvas.scrollLeft = anchor.scrollLeft;
      canvas.scrollTop = anchor.scrollTop;
      return;
    }
    const viewport = canvas.getBoundingClientRect();
    const bounds = diagram.getBoundingClientRect();
    const x = viewport.left + canvas.clientLeft + anchor.viewportX * canvas.clientWidth;
    const y = viewport.top + canvas.clientTop + anchor.viewportY * canvas.clientHeight;
    canvas.scrollLeft += bounds.left + anchor.u * bounds.width - x;
    canvas.scrollTop += bounds.top + anchor.v * bounds.height - y;
  }
  function queueRestore(state, anchor) {
    if (!anchor || state.framePending) return;
    state.framePending = true;
    state.anchor = anchor;
    requestAnimationFrame(() => {
      state.framePending = false;
      const point = state.anchor;
      state.anchor = undefined;
      restoreReadingPoint(state, point);
    });
  }
  function updateControls(state) {
    if (state.output) {
      const percent = state.zoom * 100;
      const label = (percent < .1 ? '<0.1' : percent < 10 ? Math.round(percent * 10) / 10 : Math.round(percent)) + '%';
      const overview = state.mode === 'fit' && state.zoom < .7;
      state.output.textContent = label + (overview ? ' · overview' : '');
      state.output.setAttribute?.('aria-label', overview
        ? label + ' overview. Choose Readable size to restore the text size.' : label + ' zoom');
    }
    if (state.minus) state.minus.disabled = state.zoom <= .4;
    if (state.plus) state.plus.disabled = state.zoom >= 2;
  }
  function setZoom(state, value, mode = 'manual', preserve = true) {
    // Fit shows the whole graph without enlarging a small one. It is separate
    // from both the readable initial scale and the manual zoom range.
    const next = mode === 'fit' ? Math.max(Number.EPSILON, Math.min(1, value))
      : clamp(value, mode === 'readable' ? .7 : .4, mode === 'manual' ? 2 : 1);
    state.mode = mode;
    if (Math.abs(next - state.zoom) < .000001) {
      updateControls(state);
      return;
    }
    // Repeated presses in one frame reuse the original point, independently
    // for each diagram. A newer fragment navigation cancels that restoration.
    if (preserve) queueRestore(state, preserve === 'automatic' ? automaticReadingPoint(state) : readingPoint(state));
    state.zoom = next;
    state.canvas.style.setProperty('--diagram-zoom', String(next));
    state.diagram.style.width = state.width * next + 'px';
    state.diagram.style.height = state.height * next + 'px';
    updateControls(state);
  }
  function fitZoom(state) {
    return state.canvas.clientWidth > 0 ? state.canvas.clientWidth / state.width : 1;
  }
  function refitPanels() {
    if (resizeFramePending) return;
    resizeFramePending = true;
    requestAnimationFrame(() => {
      resizeFramePending = false;
      for (const state of states) {
        const width = state.canvas.clientWidth;
        if (width === state.viewportWidth) continue;
        state.viewportWidth = width;
        if (state.mode !== 'manual') setZoom(state, fitZoom(state), state.mode, 'automatic');
      }
    });
  }

  for (const panel of panels) {
    const canvas = panel.querySelector('[data-diagram-scroll]');
    const diagram = canvas?.querySelector('[data-complete-logical-diagram]');
    const width = Number(diagram?.getAttribute('width'));
    const height = Number(diagram?.getAttribute('height'));
    if (!canvas || !diagram || !(width > 0 && height > 0)) continue;
    const state = {
      panel, canvas, diagram, width, height, zoom: 1, mode: 'readable',
      viewportWidth: canvas.clientWidth, framePending: false, anchor: undefined,
      toolbar: panel.querySelector('.logic-diagram-tools'),
      controls: panel.querySelector('[data-diagram-zoom-controls]'),
      output: panel.querySelector('[data-diagram-zoom-value]'),
      minus: panel.querySelector('[data-diagram-zoom="-"]'),
      plus: panel.querySelector('[data-diagram-zoom="+"]'),
    };
    states.push(state);
    if (state.controls) state.controls.hidden = false;
    state.minus?.addEventListener('click', () => {
      // An explicit fit may be smaller than the manual 40% floor. Zoom out
      // must never enlarge that view; zoom in can restore a readable scale.
      if (state.zoom > .4) setZoom(state, Math.round((state.zoom - .1) * 100) / 100);
    });
    state.plus?.addEventListener('click', () => setZoom(state, Math.round((state.zoom + .1) * 100) / 100));
    panel.querySelector('[data-diagram-reset]')?.addEventListener('click', () => setZoom(state, 1));
    panel.querySelector('[data-diagram-fit]')?.addEventListener('click', () => setZoom(state, fitZoom(state), 'fit'));
    setZoom(state, fitZoom(state), 'readable', false);
  }

  const wideButtons = [...(forest.querySelectorAll?.('[data-diagram-wide]') || [])];
  function updateWideButtons() {
    const expanded = forest.classList.contains('logic-wide');
    for (const button of wideButtons) button.setAttribute('aria-pressed', String(expanded));
  }
  for (const button of wideButtons) button.addEventListener('click', () => {
    const points = states.map(state => automaticReadingPoint(state));
    forest.classList.toggle('logic-wide');
    updateWideButtons();
    states.forEach((state, index) => {
      queueRestore(state, points[index]);
      state.viewportWidth = state.canvas.clientWidth;
      if (state.mode !== 'manual') setZoom(state, fitZoom(state), state.mode, false);
    });
  });
  if (wideButtons.length) updateWideButtons();
  window.addEventListener('resize', refitPanels);
  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(refitPanels);
    for (const state of states) observer.observe(state.canvas);
  }

  function revealLogicHash() {
    const navigation = ++hashNavigation;
    hashFramePending = false;
    // Outside and malformed fragments also win over an older zoom or hash.
    for (const state of states) state.anchor = undefined;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = id && document.getElementById(id);
    if (!target || !forest.contains(target) ||
      !target.matches?.('[data-logic-node], [data-logic-gate], [data-logic-tree], [data-logic-detail]')) return;
    // Complete notes may live in native disclosures; graph panels stay open.
    for (let element = target; element && element !== forest; element = element.parentElement)
      if (element.tagName === 'DETAILS') element.open = true;
    const state = states.find(item => item.panel.contains(target));
    const hash = location.hash;
    hashFramePending = true;
    requestAnimationFrame(() => {
      if (navigation !== hashNavigation || location.hash !== hash) return;
      hashFramePending = false;
      if (!target.hasAttribute?.('tabindex')) target.setAttribute?.('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.scrollIntoView({
        block: target.matches('[data-logic-node], [data-logic-gate]') ? 'nearest' : 'start',
        inline: 'nearest', behavior: 'instant',
      });
      const clearance = toolbarBottom(state);
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
