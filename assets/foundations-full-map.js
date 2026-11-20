const inputGroup = 'additional-inputs';
const svgNS = 'http://www.w3.org/2000/svg';

export function indexFoundationsMap(data) {
  const groups = new Map(Object.entries(data.chapters).map(([id, label]) => [id, {id, label, records: []}]));
  groups.set(inputGroup, {id: inputGroup, label: 'Additional input records', records: []});
  const records = new Map();
  const edges = [];
  const uses = new Map();

  function add(key, kind, group, record) {
    const item = {...record, key, kind, group};
    records.set(key, item);
    groups.get(group).records.push(item);
  }

  for (const [key, node] of Object.entries(data.nodes)) {
    const argument = data.arguments[key];
    add(key, argument ? 'argument' : 'input', argument?.chapter ?? inputGroup, node);
  }
  for (const [id, gap] of Object.entries(data.gaps)) {
    add('gap:' + id, 'gap', gap.chapter, {...gap, id, status: 'Historical whole-proof gap'});
  }
  for (const [key, argument] of Object.entries(data.arguments)) {
    for (const input of argument.inputs) {
      edges.push({from: input.key, to: key});
      if (!uses.has(input.key)) uses.set(input.key, []);
      uses.get(input.key).push(key);
    }
  }
  return {groups, records, edges, uses};
}

function svgNode(tag, attributes = {}, text) {
  const node = document.createElementNS(svgNS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text) node.textContent = text;
  return node;
}

function drawMap(svg, groups, edges) {
  const columns = Math.min(4, Math.max(1, groups.length));
  const width = columns === 1 ? 680 : 270;
  const step = columns === 1 ? 17 : 11;
  const across = Math.floor((width - 30) / step);
  const gutter = 12;
  const frame = svgNode('g');
  const lines = svgNode('g');
  const points = svgNode('g');
  const positions = new Map();
  const markers = new Map();
  let top = gutter;

  for (let offset = 0; offset < groups.length; offset += columns) {
    const row = groups.slice(offset, offset + columns);
    const height = 62 + Math.max(...row.map(group => Math.ceil(group.records.length / across))) * step;
    for (const [column, group] of row.entries()) {
      const left = gutter + column * (width + gutter);
      frame.append(svgNode('rect', {x: left, y: top, width, height, rx: 8, class: 'proof-map-panel'}));
      const label = group.label.length > 43 && columns > 1 ? group.label.slice(0, 40) + '…' : group.label;
      const heading = svgNode('text', {x: left + 13, y: top + 23, class: 'proof-map-panel-title'}, label);
      heading.append(svgNode('title', {}, group.label));
      frame.append(heading);
      frame.append(svgNode('text', {x: left + 13, y: top + 40, class: 'proof-map-panel-count'}, group.records.length + ' records'));
      for (const [position, record] of group.records.entries()) {
        const x = left + 17 + position % across * step;
        const y = top + 55 + Math.floor(position / across) * step;
        positions.set(record.key, [x, y]);
        const node = record.kind === 'gap'
          ? svgNode('rect', {x: x - 3, y: y - 3, width: 6, height: 6})
          : svgNode('circle', {cx: x, cy: y, r: 3.5});
        node.setAttribute('class', 'proof-map-node proof-map-node-' + record.kind);
        node.setAttribute('data-record', record.key);
        node.append(svgNode('title', {}, record.id + ' · ' + record.label + ' · ' + record.status));
        markers.set(record.key, node);
        points.append(node);
      }
    }
    top += height + gutter;
  }
  if (!groups.length) {
    frame.append(svgNode('text', {x: 18, y: 36, class: 'proof-map-panel-title'}, 'This chapter has no records in the proof map.'));
    top = 65;
  }
  const visibleEdges = [];
  for (const {from, to} of edges) {
    if (!positions.has(from) || !positions.has(to)) continue;
    const [x1, y1] = positions.get(from);
    const [x2, y2] = positions.get(to);
    const dx = x2 - x1, dy = y2 - y1;
    const reach = Math.max(0, 1 - 5 / Math.hypot(dx, dy));
    const line = svgNode('line', {x1, y1, x2: x1 + reach * dx, y2: y1 + reach * dy, class: 'proof-map-edge'});
    visibleEdges.push({from, to, line});
    lines.append(line);
  }
  const arrow = svgNode('marker', {
    id: 'proof-map-arrow', viewBox: '0 0 8 8', refX: 8, refY: 4, markerWidth: 6, markerHeight: 6,
    orient: 'auto', markerUnits: 'userSpaceOnUse',
  });
  arrow.append(svgNode('path', {d: 'M0,0 L8,4 L0,8 Z', fill: '#315d4d'}));
  const definitions = svgNode('defs');
  definitions.append(arrow);
  svg.replaceChildren(svg.querySelector('title'), definitions, frame, lines, points);
  svg.setAttribute('viewBox', '0 0 ' + (columns * (width + gutter) + gutter) + ' ' + top);
  return {markers, visibleEdges};
}

function append(parent, tag, text) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  parent.append(node);
  return node;
}

function addLink(parent, href, text) {
  const anchor = append(parent, 'a', text);
  anchor.href = href;
}

function addInputs(parent, inputs, lookup, atlasHref) {
  const list = append(parent, 'ul');
  for (const input of inputs) {
    const item = append(list, 'li');
    const node = Object.hasOwn(lookup, input.key) ? lookup[input.key] : null;
    const label = node && node.label !== input.key ? input.key + ' · ' + node.label : input.key;
    if (node) addLink(item, atlasHref(node.href), label);
    else if (input.href) addLink(item, input.href.startsWith('/') ? atlasHref(input.href) : input.href, label);
    else append(item, 'code', label);
    const scopes = input.scopes ?? [];
    for (const scope of scopes) append(item, 'p', scope);
    const windows = input.useWindows ?? [];
    if (windows.length) {
      const spans = windows.map(({lines: [first, last]}) => first === last ? String(first) : first + '–' + last);
      append(item, 'small', 'Source lines ' + spans.join(', '));
    }
  }
}

function renderRecord(region, record, map, data, chapterIndex, atlasHref) {
  region.replaceChildren();
  region.hidden = !record;
  if (!record) return;
  const label = record.kind === 'argument' ? record.key : record.id;
  append(region, 'h2', label + ' · ' + record.label);
  append(region, 'p', record.status).className = 'proof-map-record-status';
  const links = append(region, 'p');
  links.className = 'logic-links';
  addLink(links, atlasHref(record.href), 'Open the record');
  const argument = data.arguments[record.key];
  const gap = record.kind === 'gap';
  if (argument || gap) {
    const anchor = gap ? 'open-' + record.id : 'argument-' + record.key.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    addLink(links, new URL('chapters/' + record.group + '/#' + anchor, chapterIndex).href,
      gap ? 'Open step in the chapter' : 'Full argument details');
  }
  if (gap) {
    append(region, 'p', record.step);
    return;
  }
  if (argument?.inputs.length) {
    const junction = append(region, 'div');
    junction.className = 'proof-map-junction';
    const count = argument.inputs.length;
    append(junction, 'span', count + (count === 1 ? ' registered input' : ' registered inputs'));
    append(junction, 'span', '→').setAttribute('aria-hidden', 'true');
    if (count > 1) {
      append(junction, 'strong', 'AND');
      append(junction, 'span', '→').setAttribute('aria-hidden', 'true');
    }
    append(junction, 'span', 'Selected argument');
  }
  if (data.principalMethods[record.key]) append(region, 'p', data.principalMethods[record.key]);

  const columns = append(region, 'div');
  columns.className = 'proof-map-neighbours';
  const inputs = append(columns, 'section');
  append(inputs, 'h3', 'Registered proof inputs');
  if (argument?.inputs.length) {
    addInputs(inputs, argument.inputs, data.nodes, atlasHref);
  } else {
    append(inputs, 'p', 'The map records no linked proof inputs for this record.');
  }
  if (data.principalConditions[record.key]?.length) {
    const details = append(inputs, 'details');
    append(details, 'summary', 'Hypotheses for this application');
    const list = append(details, 'ul');
    for (const condition of data.principalConditions[record.key]) append(list, 'li', condition);
  }
  const usedBy = append(columns, 'section');
  append(usedBy, 'h3', 'Arguments that use this record');
  const uses = map.uses.get(record.key) ?? [];
  if (uses.length) {
    const list = append(usedBy, 'ul');
    for (const key of uses) {
      const target = map.records.get(key);
      addLink(append(list, 'li'), atlasHref(target.href), key + ' · ' + target.label);
    }
  } else {
    append(usedBy, 'p', 'The map records no uses of this record.');
  }
  if (!argument) return;
  for (const [title, values, lookup] of [
    ['Standing context and base inputs', argument.standing, data.contexts],
    ['Exact named external applications', argument.external, {}],
    ['Unlinked source pointers', argument.unresolved.map(key => ({key})), {}],
  ]) {
    if (!values.length) continue;
    const details = append(region, 'details');
    append(details, 'summary', title);
    addInputs(details, values, lookup, atlasHref);
  }
}

function connectMap(data, elements) {
  const {mapRoot, status, controls, chapter, query, records, focus, picture, scroll, out, zoomIn, fit} = elements;
  const chapterIndex = document.getElementById('proof-map-chapters').href;
  const base = new URL('../../../', chapterIndex);
  const atlasHref = route => new URL(route.slice(1), base).href;
  const map = indexFoundationsMap(data);
  const allRecords = [...map.records.values()];
  const params = new URLSearchParams(location.search);
  let zoom = 1;
  let drawing;

  for (const group of map.groups.values()) {
    append(chapter, 'option', group.label).value = group.id;
  }
  if (map.groups.has(params.get('chapter'))) chapter.value = params.get('chapter');

  function showChoices(choices) {
    records.replaceChildren();
    const prompt = append(records, 'option', choices.length ? 'Select a record' : 'No matching records');
    prompt.value = '';
    records.disabled = !choices.length;
    for (const record of choices) {
      const label = record.kind === 'gap' ? record.id + ' · Historical gap' : record.key;
      append(records, 'option', label + ' · ' + record.label).value = record.key;
    }
  }

  function chapterRecords() {
    return chapter.value ? map.groups.get(chapter.value).records : allRecords;
  }

  function applyZoom() {
    picture.style.width = zoom * 100 + '%';
    out.disabled = zoom === 1;
    zoomIn.disabled = zoom === 4;
  }

  function redraw() {
    const groups = chapter.value ? [map.groups.get(chapter.value)] : [...map.groups.values()];
    drawing = drawMap(picture, groups.filter(group => group.records.length), map.edges);
    zoom = 1;
    scroll.scrollLeft = 0;
    applyZoom();
  }

  function showRecord(key) {
    const record = map.records.get(key);
    if (record && chapter.value && record.group !== chapter.value) {
      chapter.value = '';
      redraw();
    }
    records.value = key;
    picture.classList.toggle('has-selection', Boolean(record));
    const neighbours = new Set([key]);
    for (const {from, to, line} of drawing.visibleEdges) {
      const linked = from === key || to === key;
      line.classList.toggle('is-related', linked);
      if (linked) {
        line.setAttribute('marker-end', 'url(#proof-map-arrow)');
        neighbours.add(from);
        neighbours.add(to);
      } else {
        line.removeAttribute('marker-end');
      }
    }
    for (const [id, marker] of drawing.markers) {
      marker.classList.toggle('is-current', id === key);
      marker.classList.toggle('is-related', neighbours.has(id));
    }
    renderRecord(focus, record, map, data, chapterIndex, atlasHref);
    if (record) {
      status.textContent = 'Selected ' + record.id + ' · ' + record.label;
      params.set('record', key);
    } else {
      params.delete('record');
    }
    if (chapter.value) params.set('chapter', chapter.value);
    else params.delete('chapter');
    history.replaceState(null, '', location.pathname + (params.size ? '?' + params : '') + location.hash);
  }

  function showChapter() {
    query.value = '';
    showChoices(chapterRecords());
    redraw();
    showRecord('');
    status.textContent = chapterRecords().length.toLocaleString('en-US') + ' records in this view.';
  }

  chapter.addEventListener('change', showChapter);
  controls.addEventListener('submit', event => {
    event.preventDefault();
    const search = query.value.trim().toLowerCase();
    const terms = search.split(/\s+/).filter(Boolean);
    const choices = search ? allRecords.filter(record => {
      const text = [record.key, record.id, record.label].join(' ').toLowerCase();
      return terms.every(term => text.includes(term));
    }) : chapterRecords();
    showChoices(choices);
    const exact = choices.find(record => record.key.toLowerCase() === search);
    const match = exact || (search && choices.length === 1 ? choices[0] : null);
    showRecord(match?.key ?? '');
    if (!match) {
      status.textContent = choices.length
        ? choices.length.toLocaleString('en-US') + ' records match. Choose a record from the list.'
        : 'No matching proof records.';
    }
  });
  records.addEventListener('change', () => showRecord(records.value));
  picture.addEventListener('click', event => {
    const key = event.target.closest('[data-record]')?.getAttribute('data-record');
    if (!key) return;
    if (![...records.options].some(option => option.value === key)) {
      showChoices(chapterRecords());
      query.value = '';
    }
    showRecord(key);
    focus.scrollIntoView({block: 'nearest'});
  });
  out.addEventListener('click', () => { zoom = Math.max(1, zoom - 0.5); applyZoom(); });
  zoomIn.addEventListener('click', () => { zoom = Math.min(4, zoom + 0.5); applyZoom(); });
  fit.addEventListener('click', () => { zoom = 1; scroll.scrollLeft = 0; applyZoom(); });

  const initial = map.records.get(params.get('record'));
  if (initial && chapter.value && initial.group !== chapter.value) chapter.value = '';
  showChoices(chapterRecords());
  redraw();
  showRecord(initial?.key ?? '');
  if (!initial) status.textContent = chapterRecords().length.toLocaleString('en-US') + ' records in this view.';
  mapRoot.hidden = false;
}

async function startMap() {
  const byId = name => document.getElementById('proof-map-' + name);
  const mapRoot = byId('interactive');
  if (!mapRoot) return;
  const status = byId('status');
  status.textContent = 'Loading the proof map…';
  try {
    const response = await fetch(byId('source').href);
    if (!response.ok) throw Error('The proof-map data could not be loaded.');
    const data = await response.json();
    if (data.schema !== 'foundations-proof-map/v1') throw Error('Unexpected proof-map format.');
    connectMap(data, {
      mapRoot, status, controls: byId('controls'), chapter: byId('chapter'), query: byId('query'),
      records: byId('record'), focus: byId('focus'), picture: byId('svg'),
      scroll: byId('scroll'), out: byId('zoom-out'), zoomIn: byId('zoom-in'), fit: byId('fit'),
    });
  } catch {
    status.textContent = 'The interactive map is temporarily unavailable. The chapter views contain the proof inputs and gaps.';
  }
}

if (typeof document !== 'undefined') startMap();
