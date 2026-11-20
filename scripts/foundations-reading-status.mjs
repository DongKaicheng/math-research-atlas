const chapterPrefix = '/projects/foundations/chapters/';

export function foundationsCoverage({graph, rows, native, meta}) {
  const chapters = new Map(Object.entries(graph.chapters).map(([slug, title]) => {
    const route = chapterPrefix + slug + '/';
    return [slug, {slug, title, route, native: native.chapters.has(route), gaps: []}];
  }));
  const gaps = new Map();
  const byBlock = new Map();
  for (const row of rows) {
    const narrower = row.coverage === 'Selected narrower scope · historical proof gap';
    const open = narrower || row.coverage === 'Historical whole-proof gap';
    const entry = graph.gaps[row.id];
    if (Boolean(entry) !== open) throw Error('Foundations gap ledger differs from Tag status for ' + row.id);
    if (!open) continue;
    const chapter = chapters.get(entry.chapter);
    const location = native.tags[row.id];
    const gap = {...entry, id: row.id, route: row.link, label: row.title, narrower, location};
    gaps.set(row.id, gap);
    chapter.gaps.push(gap);
    if (location?.index != null) {
      const key = `${location.key}:${location.index}`;
      if (!byBlock.has(key)) byBlock.set(key, []);
      byBlock.get(key).push(gap);
    }
  }
  if (gaps.size !== meta.counts.historicalLedgerGaps || gaps.size !== Object.keys(graph.gaps).length) {
    throw Error('Foundations gap ledger does not reconcile with the web chapter bindings');
  }
  return {chapters, gaps, byBlock, narrower: [...gaps.values()].filter(gap => gap.narrower).length};
}

export const gapCount = count => `${count} open ${count === 1 ? 'Tag' : 'Tags'}`;
