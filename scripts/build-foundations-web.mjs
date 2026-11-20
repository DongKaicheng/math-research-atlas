const project = '/projects/foundations/';
export const foundationsBookRoute = project + 'reader/';
export const formerDependencyRoute = project + 'logic/full/';
const contents = project + 'contents/';
const tagPath = id => '/r/' + id + '/';
const tagGraph = id => tagPath(id) + 'logic/';
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const link = (href, label) => '<a href="' + esc(href) + '">' + esc(label) + '</a>';
export const proofAnchor = key => 'proof-' + key.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
const paragraphAnchor = index => 'proof-paragraph-' + (index+1);
const paragraph = /<p(?:\s[^>]*)?>[\s\S]*?<\/p>/g;
const standingNames = {
  'BASE-RINGS':'Basic ring theory', 'BASE-TOPOLOGY':'Basic topology', 'BASE-LINEAR':'Linear algebra',
  'BASE-SETS':'Basic set theory', 'BASE-REAL':'Properties of the real numbers',
  'DEF-FORMAL-ETALE-RING-MAP':'Formally étale ring maps',
};

export function linkProofParagraphs(html) {
  let index=0;
  return html.replace(paragraph, block=>block.replace('>',`><span id="${paragraphAnchor(index++)}"></span>`));
}

function shell(route, title, body, alias = false) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} · OpenMath Foundations</title><link rel="canonical" href="${alias ? contents : route}">
  ${alias ? '<meta name="robots" content="noindex,follow">' : ''}
  <link rel="stylesheet" href="/assets/foundations-native.css"><link rel="stylesheet" href="/assets/foundations-web.css"></head>
  <body><a class="skip" href="#main">Skip to content</a><header class="site-header"><nav aria-label="Foundations">
  ${link(project,'OpenMath Foundations')}${link(contents,'Table of contents')}${link('/search/?project=foundations','Find a Tag')}
  </nav></header><main id="main">${body}</main></body></html>`;
}

function bookTarget(href) {
  const hash = href.split('#')[1];
  if (hash?.startsWith('nameddest=')) return foundationsBookRoute + '?dest=' + hash.slice(10);
  if (hash?.startsWith('page=')) return foundationsBookRoute + '?' + hash;
  return foundationsBookRoute;
}

function inputNode(graph, input, kind) {
  const source = graph.nodes[input.key] ?? graph.contexts[input.key];
  const [bookHref] = source?.href.split('#') ?? [];
  const target = kind === 'standing' ? bookHref : source?.href ?? input.href;
  const externalTag = input.href?.split('/').at(-1);
  const name = kind==='standing' ? standingNames[input.key] ?? input.key.replace(/^CONTEXT:/i,'').replace(/[_-]/g,' ') : input.key;
  return {
    kind, key:source?.id ?? externalTag, binding:input.key, target,
    title:externalTag ? 'Stacks Project, Tag '+externalTag : source?.label ?? name,
    scope:input.scopes ?? [],
    trace:graph.arguments[input.key] ? tagGraph(source.id)+'#'+proofAnchor(input.key) : null,
  };
}

function card({kind, key, binding, title, target, scope = [], trace}) {
  const captions = {registered:'Proof input', standing:'Standing context', external:'External result', condition:'Hypothesis', open:'Open step', reference:'Reference in the proof'};
  return `<div class="proof-node proof-node-${kind}"${key ? ` data-input="${esc(key)}"` : ''}${binding ? ` data-input-key="${esc(binding)}"` : ''}>
    <small>${captions[kind]}${key && title!==key && kind!=='external' ? ' · '+esc(key) : ''}</small>
    <span>${target ? link(target,title) : esc(title)}</span>
    ${scope.map(text=>`<p>${esc(text)}</p>`).join('')}${trace ? `<small>${link(trace,'Trace this input')}</small>` : ''}</div>`;
}

function fanIn(inputs) {
  const rows = [];
  for (let i=0;i<inputs.length;i+=3) rows.push(inputs.slice(i,i+3));
  return `<div class="proof-inputs" aria-label="Inputs into this argument">${rows.map(row =>
    `<div class="proof-input-row proof-columns-${row.length}">${row.map(card).join('')}</div>`).join('')}</div>`;
}

const arrow = (type = '') => `<div class="proof-arrow${type ? ' '+type : ''}" aria-hidden="true"></div>`;
const stage = (title, text) => `<div class="proof-stage"><strong>${esc(title)}</strong>${text ? `<p>${esc(text)}</p>` : ''}</div>`;

function annularUnitProof(inputs) {
  const get = ids => inputs.filter(node=>ids.includes(node.key));
  const normalForm = get(['NAG-001415','NAG-001416','NAG-000152','NAG-002026']);
  return `<div class="proof-derivations">
    <section aria-label="Forward implication">
    ${fanIn(normalForm)}${arrow('proof-input-arrow')}
    ${stage('From an inverse to the normal form','For fg = 1, the extreme-exponent widths of f and g add to zero at each radius. Finitely many possible maximizers and connectedness give one exponent m over the entire annulus.')}${arrow()}
    ${stage('Normalize the leading term','Take c to be the coefficient of Tᵐ. At the two endpoint radii the remaining coefficient terms are strictly smaller and tend to zero, giving a remainder of norm less than one.')}
    </section><section aria-label="Reverse implication">
    ${fanIn(get(['NAG-000184']))}${arrow('proof-input-arrow')}
    ${stage('From the normal form to an inverse','The strict norm bound makes the geometric series invert 1 + h. The monomial cTᵐ is already a unit.')}
    </section><section aria-label="Pointwise norm and uniqueness">
    ${fanIn(get(['NAG-000655']))}${arrow('proof-input-arrow')}
    ${stage('Pointwise norm and uniqueness','Pointwise domination gives |h(x)| < 1, so |1 + h(x)| = 1. The exponent in any normal form is the unique maximizing exponent.')}
    </section></div>`;
}

function sourcePassages(native, key, output, inputs) {
  const record = native.tags[key];
  if (key!==output.id || record?.proof==null) return null;
  const html = native.byKey.get(record.key).blocks.slice(record.proof,record.proofEnd+1).join('');
  const paragraphs = [...html.matchAll(paragraph)].map(([body])=>new Set(Array.from(body.matchAll(/\bhref="([^"]+)"/g),match=>match[1])));
  const groups = new Map();
  for (const input of inputs) {
    const locator = native.tags[input.key]?.href;
    const index = paragraphs.findIndex(hrefs=>hrefs.has(input.target) || (locator && hrefs.has(locator)));
    if (!groups.has(index)) groups.set(index,[]);
    groups.get(index).push(input);
  }
  if ([...groups.keys()].filter(index=>index>=0).length<2) return null;
  const ordered = [...groups].filter(([index])=>index>=0).sort(([a],[b])=>a-b);
  const passages = ordered.map(([index,items])=>`<div class="proof-passage">${fanIn(items)}${arrow('proof-input-arrow')}
    <div class="proof-stage">${link(output.href+'#'+paragraphAnchor(index),'Proof paragraph '+(index+1))}</div></div>`);
  if (groups.has(-1)) passages.push(`<div class="proof-passage">${fanIn(groups.get(-1))}${arrow('proof-input-arrow')}${stage('Other registered inputs','')}</div>`);
  return `<div class="proof-passages">${passages.join('')}</div>`;
}

export function manuscriptDiagram(proof, references) {
  const source = references.length ? `${fanIn(references)}${arrow('proof-input-arrow')}` : '';
  return `<section class="proof-diagram" id="proof-dependencies"><h2>Proof diagram</h2>
    ${references.length ? '<p>Dashed connectors show references appearing in this proof.</p>' : ''}
    ${source}${stage('Manuscript proof',references.length ? '' : 'The source register supplies no separate proof-input edges for this passage.')}
    <p>${link(proof.href,'Read the proof in context')}</p></section>`;
}

function drawArgument(graph, native, key) {
  const argument = graph.arguments[key];
  const output = graph.nodes[key];
  const registered = argument.inputs.map(item=>inputNode(graph,item,'registered'));
  const standing = argument.standing.map(item=>inputNode(graph,item,'standing'));
  const external = argument.external.map(item=>inputNode(graph,item,'external'));
  const conditions = (graph.principalConditions[key] ?? []).map(title=>({kind:'condition',title}));
  const unresolved = argument.unresolved.map(pointer=>({kind:'open',title: pointer.replace(/^(?:SUPPORT|CONTEXT):/, '').replace(/_/g,' ')}));
  const all = [...registered,...standing,...external,...conditions];
  const passages = sourcePassages(native,key,output,registered);
  const context = [...standing,...external,...conditions];
  const jointTitle = all.length>1 ? 'AND · Joint proof inputs' : 'Input to the proof';
  const diagram = key==='NAG-002027' ? `${fanIn(standing)}${arrow('proof-input-arrow')}${annularUnitProof(registered)}` :
    passages ? `${context.length ? fanIn(context)+arrow('proof-input-arrow') : ''}${passages}${arrow('proof-input-arrow')}${stage(jointTitle,graph.principalMethods[key])}` :
    (all.length ? `${fanIn(all)}${arrow('proof-input-arrow')}${stage(jointTitle,graph.principalMethods[key])}` : '');
  return `<section class="proof-argument" id="${proofAnchor(key)}" aria-label="${esc(output.label)}">
    <h3>${esc(output.label)}</h3>
    <figure aria-label="Proof relationships for ${esc(output.label)}">
      ${diagram}${diagram ? arrow(all.length && (graph.principalMethods[key] || key==='NAG-002027') ? '' : 'proof-input-arrow') : ''}
      ${stage('Conclusion',output.label)}
      ${unresolved.length ? `<div class="proof-open-inputs"><h4>Unresolved source references</h4>${unresolved.map(card).join('')}</div>` : ''}
      <figcaption>${esc(output.status)}${all.length ? ' · '+registered.length+' registered proof inputs' : ''} · ${link(output.href,'Read the statement and proof')}</figcaption>
    </figure></section>`;
}

function renderDiagram(row, graph, native, keys, book) {
  const gap=graph.gaps[row.id];
  const openStep=gap ? `<div class="proof-open-inputs"><h3>Historical proof gap</h3>${card({kind:'open',title:gap.step})}</div>` : '';
  const explanation=keys.length ? `<p class="proof-legend">Dashed arrows connect registered inputs to the argument that uses them. Solid arrows show steps described in the proof.</p>` : '';
  return `<section class="proof-diagram" id="proof-dependencies"><h2>Proof diagram</h2>
    ${explanation}${keys.map(key=>drawArgument(graph,native,key)).join('')}${openStep}
    ${keys.length || gap ? '' : `<p>The edition records no selected proof-input edges for this Tag.${book ? ' '+link(book,'Read the passage in the chapter')+'.' : ''}</p>`}</section>`;
}

export function createFoundationsWeb(release, textLocations) {
  const {graph} = release;
  const argumentsById = new Map();
  for (const key of Object.keys(graph.arguments)) {
    const id=graph.nodes[key].id;
    if (!argumentsById.has(id)) argumentsById.set(id,[]);
    argumentsById.get(id).push(key);
  }
  const diagrams=new Map();
  // Keep the former overview URL available to existing bookmarks.
  const pages = new Map([[formerDependencyRoute,
    shell(formerDependencyRoute,'Foundations table of contents',`<h1>Foundations table of contents</h1><p>${link(contents,'Read the chapters and their proofs')}</p>
      <script type="module" src="/assets/foundations-proof-bookmark.js"></script>`,true)]]);
  for (const row of release.rows) {
    const location=textLocations[row.id]?.href;
    const diagram=renderDiagram(row,graph,release.native,argumentsById.get(row.id) ?? [],location);
    diagrams.set(row.id,diagram);
    pages.set(tagGraph(row.id),shell(tagGraph(row.id),'Proof diagram for '+row.id,
      `<p class="tag-permalink">${esc(row.id)}</p><h1>${esc(row.title)}</h1>
       <nav class="tag-actions" aria-label="This Tag">${link(row.link,'Read the Tag')}${location ? link(location,'Read in chapter') : ''}</nav>${diagram}`));
  }
  function decorate(html) {
    return html.replace(/href="(\/projects\/foundations\/editions\/[^/]+\/reader-en\.pdf(?:#[^"]*)?)"/g,
      (_, href) => 'href="' + bookTarget(href) + '"')
      .replaceAll('>English PDF<', '>Web reader<')
      .replaceAll('Open in the English reader · PDF page', 'Read in the web edition · page');
  }
  return {pages, diagrams, decorate};
}
