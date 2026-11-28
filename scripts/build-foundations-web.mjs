const project = '/projects/foundations/';
export const foundationsBookRoute = project + 'reader/';
const contents = project + 'contents/';
const formerMap = project + 'logic/';
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function linkProofParagraphs(html, retainedParagraphs) {
  let paragraph = 0;
  let item = 0;
  const paragraphs = html.replace(/<p(?:\s[^>]*)?>/g, tag => {
    paragraph++;
    const number = retainedParagraphs ? retainedParagraphs.get(paragraph) : paragraph;
    return number ? tag+'<span id="proof-paragraph-'+number+'"></span>' : tag;
  });
  if (retainedParagraphs) return paragraphs;
  return paragraphs.replace(/<li(?:\s[^>]*)?>/g, tag => tag+'<span id="proof-item-'+(++item)+'"></span>');
}

export function sourcePolicyNotice(finding) {
  if (!finding) return '';
  const status = finding.status === 'external-assumption' ? 'Conditional argument' : 'Open proof obligation';
  return `<aside class="proof-policy-note" aria-label="${status}"><strong>${status} · ${escape(finding.title)}</strong>
    <p>${escape(finding.text)}</p></aside>`;
}

export function foundationsBookmark(destination, retainProofFragment = false) {
  const proofBookmarks = Array.isArray(retainProofFragment) ? retainProofFragment.join(' ') :
    retainProofFragment ? 'true' : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>OpenMath Foundations</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="${destination.split('#')[0]}"></head>
    <body><main><p><a href="${escape(destination)}"${proofBookmarks ? ' data-proof-bookmark="'+escape(proofBookmarks)+'"' : ''}>Continue reading OpenMath Foundations</a></p></main>
    <script type="module" src="/assets/foundations-proof-bookmark.js"></script></body></html>`;
}

export function retiredFoundationsRoutes({graph, rows}, proofBookmarks = new Map()) {
  const routes = new Map([[formerMap, contents], [formerMap + 'full/', contents]]);
  for (const slug of Object.keys(graph.chapters)) {
    routes.set(formerMap + 'chapters/' + slug + '/', project + 'chapters/' + slug + '/');
  }
  for (const row of rows) routes.set(row.link + 'logic/', row.link);
  return new Map([...routes].map(([route,destination])=>
    [route,foundationsBookmark(destination,proofBookmarks.get(destination))]));
}
