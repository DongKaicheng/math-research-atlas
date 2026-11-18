// A complete, deterministic SVG scene. Nothing is folded or laid out by a
// browser measurement pass. Every occurrence keeps its own scope and identity.
export const graphStatusLabels = {
  open: 'Open', conditional: 'Conditional', proved: 'Internal proof available',
  draft: 'Draft · audit pending', hypothesis: 'Hypothesis', published: 'Published result',
};
export const graphGateLabels = { all: 'ALL', any: 'ANY', iff: 'IFF', open: 'OPEN', blocked: 'NO' };

// Conservative character metrics keep labels inside fixed SVG rectangles.
export function textWidth(text, size = 16) {
  return [...String(text)].reduce((sum, c) => sum + size * (
    /[ilI.,:;'!| ]/.test(c) ? .32 : /[MW@%]/.test(c) ? .9 : /[A-Z]/.test(c) ? .69 :
      c.codePointAt(0) > 255 ? .85 : .59), 0);
}
export function wrapText(text, width, size = 16) {
  const lines = [];
  for (const paragraph of String(text || '').split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && textWidth(line + ' ' + word, size) > width) { lines.push(line); line = ''; }
      if (textWidth(word, size) > width) {
        for (const c of word) {
          if (textWidth(line + c, size) > width) { lines.push(line); line = ''; }
          line += c;
        }
      } else line += (line ? ' ' : '') + word;
    }
    if (line) lines.push(line);
  }
  return lines;
}

export function buildLogicScene(trees, records) {
  const byId = new Map(records.map(entry => [entry.id, entry]));
  const width = 1120, indent = 52, boxWidth = 670;
  const scene = { width, height: 0, sections: [], boxes: [], gates: [], edges: [], texts: [], anchors: [] };
  let serial = 0;
  const known = id => {
    const entry = byId.get(id);
    if (!entry) throw Error('Unknown diagram record: ' + id);
    return entry;
  };
  const titleFor = item => item.title || (item.record ? known(item.record).title : '');
  const statusFor = item => {
    const entry = item.record ? known(item.record) : undefined;
    return { status: entry?.status || item.status,
      label: entry?.kind === 'definition' && entry.status === 'draft' ? 'Definition' :
        graphStatusLabels[entry?.status || item.status] || item.status || '' };
  };
  function box(item, x, y, role, identity, customWidth = boxWidth) {
    const entry = item.record ? known(item.record) : undefined;
    const state = statusFor(item);
    const title = titleFor(item);
    if (!title) throw Error('Diagram node has no title: ' + identity);
    const titleLines = wrapText(title, customWidth - 36, 19);
    const noteLines = wrapText(item.note || '', customWidth - 36, 14);
    const links = (item.links || []).map(link => ({ ...link, lines: wrapText(link.label, customWidth - 36, 13) }));
    const height = 42 + titleLines.length * 25 + (noteLines.length ? 12 + noteLines.length * 20 : 0) +
      links.reduce((h, link) => h + link.lines.length * 19 + 7, 0) + 17;
    const object = { id: item.id || identity, identity, record: entry?.id, role, title, titleLines,
      noteLines, links, status: state.status, statusLabel: state.label, x, y, width: customWidth, height,
      href: item.href || (entry ? '/entries/' + entry.id : undefined) };
    scene.boxes.push(object); scene.anchors.push(object.id);
    return object;
  }
  function edge(from, to, kind, d, extra = {}) {
    scene.edges.push({ id: 'logic-edge-' + ++serial, from, to, kind, d, ...extra });
  }
  function treeNode(item, depth, y, identity, role = 'premise') {
    const x = 54 + depth * indent;
    const current = box(item, x, y, role, identity);
    let bottom = y + current.height;
    if (!item.gate) return { box: current, bottom };
    const relation = item.gate;
    const cx = x + 25, gy = bottom + 68;
    const gx = cx + 64;
    const available = width - gx - 40;
    const relationLines = wrapText(relation.label || graphGateLabels[relation.kind], available, 16);
    const explanationLines = wrapText(relation.explanation, available, 14);
    const sources = relation.sources.map(link => ({ ...link, lines: wrapText(link.label, available - 18, 13) }));
    const gateId = identity + '-gate';
    const gate = { id: gateId, kind: relation.kind, cx, cy: gy, x: gx,
      relationLines, explanationLines, sources, width: available };
    scene.gates.push(gate); scene.anchors.push(gateId);
    edge(gateId, current.id, relation.kind, `M ${cx} ${gy - 29} V ${bottom + (relation.kind === 'blocked' ? 16 : 2)}`,
      { arrow: relation.kind !== 'blocked', both: relation.kind === 'iff', blocked: relation.kind === 'blocked' });
    let next = gy - 22 + relationLines.length * 22 + 10 + explanationLines.length * 20 + 11 +
      sources.reduce((h, link) => h + link.lines.length * 19 + 4, 0) + 24;
    next = Math.max(next, gy + 66);
    // Proof rules are evidence for an inference, not extra AND-premises.
    for (const [index, id] of (relation.rules || []).entries()) {
      const entry = known(id);
      const rule = box({ record: id, note: relation.ruleNotes?.[id] || entry.summary }, gx, next,
        'rule', `${identity}-rule-${index}`, Math.min(boxWidth, available));
      const rail = cx + 39;
      edge(rule.id, gateId, 'rule', `M ${rule.x} ${rule.y + 24} H ${rail} V ${gy} H ${cx + 32}`,
        { arrow: true });
      next = rule.y + rule.height + 22;
    }
    const children = [];
    for (const [index, child] of relation.children.entries()) {
      const result = treeNode(child, depth + 1, next, `${identity}-premise-${index}`);
      const port = result.box.y + 28;
      edge(result.box.id, gateId, 'input', `M ${result.box.x} ${port} H ${cx}`,
        { relation: relation.kind });
      children.push({ id: result.box.id, port });
      next = result.bottom + 30;
    }
    if (children.length) edge(children.map(child => child.id).join(' '), gateId, 'bundle',
      `M ${cx} ${children.at(-1).port} V ${gy + 30}`, { arrow: true, relation: relation.kind });
    return { box: current, bottom: Math.max(bottom, next - 30) };
  }

  let y = 38;
  for (const [sectionIndex, tree] of trees.entries()) {
    const start = y;
    const titleLines = wrapText(tree.title, width - 108, 28);
    const summaryLines = wrapText(tree.summary, width - 108, 16);
    const scopeLines = wrapText('Scope: ' + tree.scope, width - 108, 14);
    const section = { id: tree.id, number: String(sectionIndex + 1).padStart(2, '0'), y: start,
      titleLines, summaryLines, scopeLines, height: 0 };
    scene.sections.push(section); scene.anchors.push(tree.id);
    y += 34 + titleLines.length * 35 + 16 + summaryLines.length * 23 + 13 + scopeLines.length * 20 + 34;
    const contexts = [];
    for (const [index, context] of (tree.contexts || []).entries()) {
      const entry = context.record ? known(context.record) : undefined;
      const object = box({ ...context, note: context.note || entry?.summary || '' }, 126, y,
        'context', `${tree.id}-context-${index}`);
      contexts.push(object); y += object.height + 22;
    }
    const root = treeNode(tree.root, 0, y + (contexts.length ? 50 : 0), `${tree.id}-root`, 'conclusion');
    if (contexts.length) {
      const rail = 33, targetY = root.box.y + 26;
      for (const context of contexts) edge(context.id, root.box.id, 'context',
        `M ${context.x} ${context.y + 25} H ${rail} V ${targetY} H ${root.box.x}`, { arrow: false });
      scene.texts.push({ x: 54, y: root.box.y - 20, text: 'SCOPE / DEFINITIONS · NOT AN ADDITIONAL IMPLICATION', kind: 'context' });
    }
    y = root.bottom + 60;
    for (const [index, related] of (tree.related || []).entries()) {
      scene.texts.push({ x: 54, y, text: 'SEPARATE DEDUCTION OR LIMIT · ' + (index + 1), kind: 'related' });
      const additional = treeNode(related, 0, y + 25, `${tree.id}-related-${index}`, related.gate?.kind === 'blocked' ? 'unreached target' : 'conclusion');
      y = additional.bottom + 60;
    }
    section.height = y - start;
    y += 80;
  }
  scene.height = y;
  const unique = new Set(scene.anchors);
  if (unique.size !== scene.anchors.length) throw Error('Duplicate SVG anchor');
  for (const b of scene.boxes) if (b.x < 0 || b.y < 0 || b.x + b.width > width || b.y + b.height > y)
    throw Error('Logical diagram node exceeds its viewBox: ' + b.id);
  return scene;
}
