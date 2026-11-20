const numberedStatement = /(<div class="(?:definition|lemma|proposition|theorem|corollary|construction|example|question|remark)">\s*<p><strong>[^<]+\.<\/strong>)((?:\s*<a href="\/r\/NAG-\d{6}\/">NAG-\d{6}<\/a>)*)\s*\.(?=\s|<)/g;
const numberedRemark = /(<div class="remark">\s*<p><em>Remark) \d+(?:\.\d+)+(<\/em>)([\s\S]*?)(?=<\/p>)/g;
const sourceAnchor = /\bid="(label-[0-9a-f]+)"/g;
const referenceMarkup = /(?<linkOpen><a\b[^>]*href="(?<href>[^"]+)"[^>]*>)(?<caption>[\s\S]*?)<\/a>|<span class="upright"><code>(?<upright>[\w.:-]+)<\/code><\/span>|<code>(?<code>[\w.:-]+)<\/code>|(?<noteOpen><p>(?:<em>)?<em>Proof input\.<\/em>\s+)(?<note>[\w.:-]+)(?<noteEnd>(?:<\/em>)?<\/p>)/g;
const rawCaption = /^(?:<span class="upright">)?(?:<code>)?([\w.:-]+)(?:<\/code>)?(?:<\/span>)?$/;
const referenceNumber = /^(definition|lemma|proposition|theorem|corollary|construction|example|question|remark)\.([A-Z0-9]+(?:\.\d+)+)$/;
const sourceLabel = /^[\w-]+:[\w.:-]+$/;
const supportAvoidance = /(<strong>)Lemma C\.1\.13\.(<\/strong> \(Support avoidance from the exact F7 support lemma; F8F7-S\)\.\s*<em>)lem:avoidlem:avoid\s*(<span id="label-6c656d3a61766f6964"><\/span>)/g;
const traceCover = /(<strong>)Theorem\.(<\/strong> \(Full trace inclusion–exclusion; F8AG-C\)\.\s*<em><span id="label-666e643a6e61673030323838343a66756c6c2d74726163652d66696e6974652d636f766572"><\/span>)/g;

// The compiled manuscript uses bespoke named destinations for these clauses.
// Their exact displayed numbers come from the corresponding sealed AUX records.
const referenceOverrides = [
  ['v037:forms:compactpartition', 'appendix-c', 'Theorem C.1.60'],
  ['cand:f5tame:charactercriterion', 'appendix-c', 'Theorem C.1.53'],
  ['cand:f5res:residualidentity', 'appendix-c', 'Theorem C.1.78'],
  ['f9sc:signed', 'appendix-c', 'Proposition C.1.102'],
  ['f9sc:refined', 'appendix-i', 'Theorem I.2.10'],
];
const globalChainClause = '/projects/foundations/chapters/appendix-c/#label-666e643a6e61673030323430353a676c6f62616c2d66696e6974652d6d6f64756c652d636861696e2d77656967687473';

export function foundationsRemarkNumbers(destinations = {}) {
  const numbers = new Map();
  for (const [destination, href] of Object.entries(destinations)) {
    const number = /^remark\.([A-Z0-9]+(?:\.\d+)+)$/.exec(destination)?.[1];
    const anchor = href.split('#')[1];
    if (number && anchor) numbers.set(anchor, number);
  }
  return numbers;
}

export function foundationsReferenceLabels(native) {
  const references = new Map();
  for (const [destination, href] of Object.entries(native.destinations)) {
    const number = referenceNumber.exec(destination);
    const anchor = href.split('#')[1];
    if (!number || !/^label-[0-9a-f]+$/.test(anchor ?? '')) continue;
    const label = Buffer.from(anchor.slice(6), 'hex').toString('utf8');
    if (!sourceLabel.test(label)) continue;
    const [, kind, value] = number;
    references.set(label, {href, title: kind[0].toUpperCase() + kind.slice(1) + ' ' + value});
  }
  for (const [label, chapter, title] of referenceOverrides) {
    const route = '/projects/foundations/chapters/' + chapter + '/';
    const anchor = 'label-' + Buffer.from(label).toString('hex');
    if (!native.chapters.get(route)?.blocks.some(block => block.includes(`id="${anchor}"`))) {
      throw Error('Missing Foundations citation source: ' + label);
    }
    references.set(label, {href: route + '#' + anchor, title});
  }
  return references;
}

export function editFoundationsReadingHtml(html, remarkNumbers, referenceLabels) {
  // Pandoc leaves a second period when the manuscript heading already ends in one.
  let text = html.replace(numberedStatement, '$1$2')
    .replace(supportAvoidance, '$1Lemma F.1.7.$2$3')
    .replace(traceCover, '$1Theorem I.1.6.$2')
    .replace(/(<div class="fthreeHStrictVal">\s*<p><strong>Proposition) 1\.1<\/strong>\./g,'$1 3.HS.1.</strong>')
    .replace(/(<div class="fthreeHStrictGerm">\s*<p><strong>Corollary) 1\.1<\/strong>/g,'$1 3.HS.2.</strong>');

  // Each Pandoc chunk starts its own remark counter. Restore the compiled number
  // when the manuscript has a named destination and omit the local counter otherwise.
  if (remarkNumbers) {
    text = text.replace(numberedRemark, (_, heading, end, paragraph) => {
      for (const [, anchor] of paragraph.matchAll(sourceAnchor)) {
        const number = remarkNumbers.get(anchor);
        if (number) return heading + ' ' + number + end + paragraph;
      }
      return heading + end + paragraph;
    });
  }
  if (!referenceLabels) return text;

  return text.replace(referenceMarkup, (original, ...parts) => {
    const {linkOpen, href, caption, upright, code, noteOpen, note, noteEnd} = parts.at(-1);
    const label = linkOpen ? rawCaption.exec(caption)?.[1] : upright ?? code ?? note;
    if (label === 'v037:integration:globalchain' && href === globalChainClause) {
      return linkOpen + 'NAG-002405, finite module-chain and weights clause</a>';
    }
    const reference = referenceLabels.get(label);
    if (!reference) return original;
    if (linkOpen) return href === reference.href ? linkOpen + reference.title + '</a>' : original;
    const linked = `<a href="${reference.href}">${reference.title}</a>`;
    return noteOpen ? noteOpen + linked + noteEnd : linked;
  });
}
