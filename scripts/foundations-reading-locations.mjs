const wrongAliases = new Map([
  ['NAG-002565', 'NAG-003030'], ['NAG-002661', 'NAG-002943'], ['NAG-002884', 'NAG-002575'],
  ['NAG-002976', 'NAG-002806'], ['NAG-003002', 'NAG-003106'], ['NAG-003100', 'NAG-002989'],
]);

// These accepted results have their own named destinations and distinct text in the manuscript.
const recovered = {
  'NAG-002661': {key:'042', anchor:'foundations.nag-002661.recovered-proof', index:45, proof:46,
    title:'Support avoidance from the exact F7 support lemma', kind:'lemma', number:'F.1.7'},
  'NAG-002884': {key:'045', anchor:'foundations.nag-002884.original', index:187, proof:188,
    title:'Full trace inclusion–exclusion', kind:'theorem', number:'I.1.6'},
};

export function foundationsReadingLocations(native) {
  const tags = {...native.tags};
  const suppressed = new Map();
  const restored = new Map();
  for (const [alias, correct] of wrongAliases) {
    const record = tags[alias];
    if (!record || record.key !== tags[correct]?.key || record.index !== tags[correct]?.index) {
      throw Error('Foundations statement alias has changed: ' + alias);
    }
    const key = `${record.key}:${record.index}`;
    if (!suppressed.has(key)) suppressed.set(key, []);
    suppressed.get(key).push(alias);
    delete tags[alias];
  }
  for (const [id, record] of Object.entries(recovered)) {
    const {key, anchor, index, proof, title, kind, number} = record;
    const chapter = native.byKey.get(key);
    const range = chapter?.proofs.find(item => item.index === proof);
    const section = chapter?.sections.findLast(item => item.index < index);
    if (!range || !section || !chapter.blocks[index].includes(title) ||
        !chapter.blocks.slice(0, index).some(block => block.includes(`id="${anchor}"`))) {
      throw Error('Foundations replacement location has changed for ' + id);
    }
    tags[id] = {key,index,proof,proofEnd:range.end,kind,number,section:section.title,sectionId:section.id,
      href:chapter.route+'#'+anchor};
    restored.set(`${key}:${index}`, id);
  }
  const destinations = {...native.destinations};
  for (const destination of Object.keys(destinations)) {
    const id = /\bnag-\d{6}\b/i.exec(destination)?.[0]?.toUpperCase();
    if (!wrongAliases.has(id)) continue;
    if (tags[id]) destinations[destination] = tags[id].href;
    else delete destinations[destination];
  }
  const restoredProofs = new Set(Object.keys(recovered).map(id => `${tags[id].key}:${tags[id].proof}`));
  return {tags, destinations, suppressed, restored, restoredProofs};
}
