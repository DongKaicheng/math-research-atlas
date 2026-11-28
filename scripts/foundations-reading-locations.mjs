import {createHash} from 'node:crypto';

const sha256 = source => createHash('sha256').update(source).digest('hex');
const equationLabel = anchor => `<span id="${anchor}"></span>`;

const wrongAliases = new Map([
  ['NAG-002565', 'NAG-003030'], ['NAG-002661', 'NAG-002943'], ['NAG-002884', 'NAG-002575'],
  ['NAG-002976', 'NAG-002806'], ['NAG-003002', 'NAG-003106'], ['NAG-003100', 'NAG-002989'],
]);

// These accepted results have their own named destinations and distinct text in the manuscript.
const recovered = {
  'NAG-002661': {key:'042', anchor:'foundations.nag-002661.recovered-proof', index:45, proof:46,
    title:'Support avoidance from the exact F7 support lemma', kind:'lemma', number:'F.1.7', page:1994},
  'NAG-002884': {key:'045', anchor:'foundations.nag-002884.original', index:187, proof:188,
    title:'Full trace inclusion–exclusion', kind:'theorem', number:'I.1.6', page:2097},
};

// Seal 1174, pp. 1137–1143. The expanded proof is consecutive text and
// subsection blocks, so the frozen native export has no proof environment for it.
export function restoreChapterEightBoundaryArgument(native) {
  const chapter = native.byKey.get('016');
  const range = {index:58,end:76,title:'Theorem 8.4.2'};
  if (!chapter || chapter.proofs.some(proof=>proof.index<=range.end && proof.end>=range.index) ||
      sha256(chapter.blocks[57])!=='f43b362810b0556c4c138a278300b1e5df4b9f9cdb8e69a64969080fa3e8304a' ||
      sha256(chapter.blocks.slice(range.index,range.end+1).join(''))!=='b5f58c891f11af4711703b812fa0ac9a515197dfb86f80532ceceb33ec69cd49') {
    throw Error('The sealed argument range for NAG-900054 has changed');
  }
  const restored = {...chapter,proofs:[...chapter.proofs,range].sort((a,b)=>a.index-b.index)};
  return {...native,byKey:new Map(native.byKey).set(restored.key,restored),
    chapters:new Map(native.chapters).set(restored.route,restored)};
}

export function restorePrintedSectionLevels(native, bindings) {
  const byKey=new Map(native.byKey);
  const chapters=new Map(native.chapters);
  for (const {name,chapter:key,block,anchor,sourceSha256,sourceLevel} of bindings.sections ?? []) {
    if (sourceLevel == null) continue;
    const chapter=byKey.get(key);
    const source=chapter?.blocks[block];
    const heading=new RegExp('^<h'+sourceLevel+' class="unnumbered" id="([^"]+)">([^<]+)</h'+sourceLevel+'>');
    const parts=heading.exec(source);
    if (sourceLevel!==4 || !parts || parts[1]!==anchor || sha256(source)!==sourceSha256 ||
        chapter.sections.some(section=>section.id===anchor || section.index===block)) {
      throw Error('Unbound printed section level '+name);
    }
    const section={level:2,sourceLevel,id:anchor,index:block,title:parts[2]};
    const restored={...chapter,sections:[...chapter.sections,section].sort((a,b)=>a.index-b.index)};
    byKey.set(key,restored);
    chapters.set(chapter.route,restored);
  }
  const catalogue=native.catalogue.map(chapter=>chapters.get(chapter.route) ?? chapter);
  return {...native,byKey,chapters,catalogue};
}

export function bindActiveReadingLocators(native, reader, bindings, destinations) {
  if (bindings?.schema!=='foundations-active-reading-locators/v1' ||
      bindings.nativePdfSha256!==native.sourcePdfSha256 || bindings.readerPdfSha256!==reader.sha256) {
    throw Error('Foundations active locators do not match their sealed sources');
  }
  const headingNumbers=new Map();
  const headingAliases=new Set();
  const equationCaptions=new Map();
  const seen=new Set();
  for (const [kind,records] of [['section',bindings.sections ?? []],['subsection',bindings.subsections],['equation',bindings.equations]]) {
    const level=kind==='section' ? 2 : 3;
    for (const {name,chapter:key,block,anchor,page,sourceSha256,precedingRows=[]} of records) {
      const parts=/^(section|subsection|equation)\.(([7-9]|1[0-9]|2[0-4]|[A-I])\.\d+(?:\.\d+)?)$/.exec(name);
      const chapter=native.byKey.get(key);
      const source=chapter?.blocks[block];
      if (parts?.[1]!==kind || parts[3]!==chapter?.number || parts[2].split('.').length!==level || seen.has(name) ||
          !Number.isInteger(block) || !source?.includes(`id="${anchor}"`) || sha256(source)!==sourceSha256 ||
          !Number.isInteger(page) || page<1 || page>reader.pages) {
        throw Error('Invalid Foundations active locator '+name);
      }
      seen.add(name);
      const href=chapter.route+'#'+anchor;
      if (kind!=='equation') {
        const section=chapter.sections.find(item=>item.id===anchor && item.level===level && item.index===block);
        if (!section || section.number || headingNumbers.has(href)) throw Error('Unbound printed heading '+name);
        const legacy=destinations[name];
        if (legacy && legacy!==href) {
          const [route,alias]=legacy.split('#');
          if (route!==chapter.route || !/^label-[0-9a-f]+$/.test(alias) ||
              !chapter.blocks[block+1]?.startsWith(`<div id="${alias}">`)) {
            throw Error('Unbound earlier heading bookmark '+name);
          }
          headingAliases.add(href);
        }
        headingNumbers.set(href,parts[2]);
        destinations[name] ??= href;
      } else {
        const rows=[...precedingRows,{name,anchor}];
        const labels=rows.map(row=>equationLabel(row.anchor)).join('');
        const display=source.slice(source.indexOf(labels)+labels.length).trimStart();
        if (!source.includes(labels) || !display.startsWith('<span class="book-equation">')) {
          throw Error('Unbound printed equation '+name);
        }
        const prefix=name.slice(0,name.lastIndexOf('.')+1);
        const end=Number(name.slice(prefix.length));
        const readers=rows.map((row,index)=>{
          const expected=prefix+(end-rows.length+index+1);
          if (!/^label-[0-9a-f]+$/.test(row.anchor) || destinations[row.name]!==chapter.route+'#'+row.anchor ||
              row.name!==expected || (row.name!==name && seen.has(row.name))) {
            throw Error('Unbound printed equation row '+row.name);
          }
          seen.add(row.name);
          return {destination:row.name,page,number:row.name.slice('equation.'.length)};
        });
        if (!equationCaptions.has(chapter.route)) equationCaptions.set(chapter.route,new Map());
        const captions=equationCaptions.get(chapter.route);
        if (captions.has(anchor)) throw Error('Duplicate printed equation anchor '+name);
        captions.set(anchor,readers);
      }
    }
  }
  for (const {destination,chapter:key,block,page,number,sourceSha256} of bindings.namedEquations ?? []) {
    const chapter=native.byKey.get(key);
    const source=chapter?.blocks[block];
    const label=equationLabel(destination);
    if (!/^foundations\.nag\d{6}\.formula\.\d+$/.test(destination) ||
        !destination.endsWith('.'+number) || !Number.isInteger(page) || page<1 || page>reader.pages ||
        !source?.includes(label) || sha256(source)!==sourceSha256 ||
        !source.slice(source.indexOf(label)+label.length).trimStart().startsWith('<span class="book-equation">')) {
      throw Error('Unbound named source equation '+destination);
    }
    const href=chapter.route+'#'+destination;
    if (destinations[destination] && destinations[destination]!==href) throw Error('Conflicting equation '+destination);
    destinations[destination]=href;
    if (!equationCaptions.has(chapter.route)) equationCaptions.set(chapter.route,new Map());
    const captions=equationCaptions.get(chapter.route);
    if (captions.has(destination)) throw Error('Duplicate named source equation '+destination);
    captions.set(destination,[{destination,page,number}]);
  }
  // The paper can reuse a named destination. The printed page is safe only
  // when it matches the existing web locator and its exact source formula block.
  for (const {lookup,chapter:key,block,anchor,page,sourceSha256} of bindings.pageEquations ?? []) {
    const chapter=native.byKey.get(key);
    const source=chapter?.blocks[block];
    const label=equationLabel(anchor);
    const number=/^equation\.((?:[A-I]|\d+)\.\d+\.\d+)$/.exec(lookup)?.[1];
    if (!number || !number.startsWith(chapter?.number+'.') || seen.has(lookup) ||
        !Number.isInteger(page) || page<1 || page>reader.pages || destinations[lookup]!==chapter.route+'#'+anchor ||
        !source?.includes(label) || sha256(source)!==sourceSha256 ||
        !source.slice(source.indexOf(label)+label.length).trimStart().startsWith('<span class="book-equation">')) {
      throw Error('Unbound printed source equation '+lookup);
    }
    if (!equationCaptions.has(chapter.route)) equationCaptions.set(chapter.route,new Map());
    const captions=equationCaptions.get(chapter.route);
    if (captions.has(anchor)) throw Error('Duplicate printed source equation '+lookup);
    captions.set(anchor,[{page,number}]);
    seen.add(lookup);
  }
  return {headingNumbers,headingAliases,equationCaptions};
}

export function restoreActiveInheritedProofs(native, inheritedReaders, accepted, bindings, locations) {
  for (const binding of bindings.inheritedProofs ?? []) {
    const {id,chapter:key,statement:index,proof,statementSha256,proofSha256,reader}=binding;
    const record=locations.tags[id];
    const chapter=native.byKey.get(key);
    const current=inheritedReaders[id];
    const range=chapter?.proofs.find(item=>item.index===proof && item.end===proof);
    if (!accepted.has(id) || !record || record.key!==key || record.index!==index || record.proof!=null ||
        current?.destination!==reader.destination || current?.page!==reader.page || !range ||
        sha256(chapter.blocks[index])!==statementSha256 || sha256(chapter.blocks[proof])!==proofSha256) {
      throw Error('Unbound inherited Foundations proof '+id);
    }
    locations.tags[id]={...record,proof,proofEnd:range.end,inheritedArgument:true};
    locations.restoredProofs.add(key+':'+proof);
  }
}

export function foundationsReadingLocations(native) {
  const tags = {...native.tags};
  const suppressed = new Map();
  const restored = new Map();
  const recoveredReaders = new Map();
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
    const {key, anchor, index, proof, title, kind, number, page} = record;
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
    recoveredReaders.set(id,{destination:anchor,page});
  }
  const destinations = {...native.destinations};
  for (const destination of Object.keys(destinations)) {
    const id = /\bnag-\d{6}\b/i.exec(destination)?.[0]?.toUpperCase();
    if (!wrongAliases.has(id)) continue;
    if (tags[id]) destinations[destination] = tags[id].href;
    else delete destinations[destination];
  }
  const restoredProofs = new Set(Object.keys(recovered).map(id => `${tags[id].key}:${tags[id].proof}`));
  return {tags, destinations, suppressed, restored, restoredProofs, recoveredReaders};
}
