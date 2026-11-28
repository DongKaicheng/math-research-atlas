import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import katex from 'katex';
import {contentsRoute, coverageRoute, escape, foundationsFeedback, foundationsPdfLink, foundationsShell, link, project} from './foundations-layout.mjs';
import {readingText} from './build-foundations-dependencies.mjs';
import {linkProofParagraphs} from './build-foundations-web.mjs';
import {currentFoundationsLogicPages, proofMapArgumentHref} from './build-foundations-logic.mjs';
import {closureGroup, coverageGroups, statusLabels, tagRoute} from './foundations-tag-register.mjs';
import activeReaderLocators from '../content/foundations/active-reading-locators-1174.json' with {type:'json'};

const edition = 'sealed-1174';
const fixed = project + 'editions/' + edition + '/';
const oldFixed = project + 'editions/sealed-1097/';
const readerPath = fixed + 'reader-en.pdf';
const idPattern = /^NAG-\d{6}$/;
const chapterRoute = slug => project+'chapters/'+slug+'/';
const resultAnchor = id => 'result-'+id;
const proofAnchor = id => resultAnchor(id)+'-proof';
const labels = {
  proof_comparison_refuted_unrestricted_theorem_open:'Analytically separable case proved; remaining extensions open',
  unrestricted_atlas_refuted_in_project_category:'Finite-incidence and supplied-atlas results',
  unrestricted_generic_existence_obstruction:'Formal blowup and comparison on supplied atlases',
  uniformly_bounded_annulus_refuted:'Residual order for integral coefficients',
  empty_face_refuted:'Generization along nonempty faces',
};
const titles = {
  'NAG-002500':'Factorization of the facet normal functional',
  'NAG-002567':'Conditional local weak Poincaré–Lelong',
  'NAG-002675':'Reduction to a scalar Poincaré–Lelong identity on an S₁ space',
  'NAG-002981':'Conditional reduction beyond S₁',
  'NAG-002012':'An étale-domain factorization in rank zero',
  'NAG-003103':'Fixed-test identities for regular meromorphic functions',
  'NAG-003106':'Closed-immersion pullback and transfer to currents',
};
const titleOf = record => titles[record.id] ?? record.title.replace(/; F[0-9][A-Z0-9-]+$/, '');
const disposition = record => record.erratum ? labels[record.disposition] : statusLabels.closed;
const narrowProofCaption = 'Erratum and proof at the valid scope';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const privateMaterial = /\/workspace\/|\/home\/agent\/|libfile_|Sentinel_|private_library_readback|BEGIN [A-Z ]*PRIVATE KEY/i;

function requireFact(condition, detail) {
  if (!condition) throw Error('Foundations 1174: ' + detail);
}

export async function loadFoundationsUpdate(directory, pointer, previous) {
  requireFact(pointer.edition === edition && pointer.revision === 2 && pointer.project === 'foundations' &&
    pointer.schemaVersion === 1 && /^\d{4}-\d{2}-\d{2}$/.test(pointer.releaseDate) &&
    typeof pointer.changeSummary === 'string' && !privateMaterial.test(pointer.changeSummary), 'invalid current pointer');
  const release = path.join(directory,'releases',edition);
  const [dataBytes,pdf] = await Promise.all(['data.json','reader-en.pdf'].map(name=>readFile(path.join(release,name))));
  requireFact(digest(dataBytes) === pointer.editionManifestSha256 && !privateMaterial.test(dataBytes.toString()), 'edition data integrity or privacy check failed');
  const data = JSON.parse(dataBytes);
  requireFact(data.edition === pointer.edition && data.revision === pointer.revision && data.project === pointer.project, 'edition identity mismatch');
  requireFact(pdf.subarray(0,5).toString() === '%PDF-' && digest(pdf) === data.reader.sha256 &&
    data.reader.sha256 === 'c8ea494eb514aff4af81fa5de449af04d5f78247c4c7e6f6a04682fc54bf46d5' && data.reader.pages === 2279, 'reader PDF mismatch');
  const oldWhole = new Set(previous.rows.filter(row=>row.coverage.startsWith('Accepted whole')).map(row=>row.id));
  const selected = new Set(data.selected);
  const additions = data.selected.filter(id=>!oldWhole.has(id));
  requireFact(data.selected.every(id=>idPattern.test(id)) && selected.size===1174 && selected.size===data.selected.length &&
    [...oldWhole].every(id=>selected.has(id)) && additions.length===77 && data.counts.whole===selected.size &&
    data.counts.standaloneClauses===21 && data.counts.priorityAccepted===966 && data.counts.priorityTotal===971 &&
    data.counts.exceptionalAccepted===68 && data.counts.exceptionalTotal===68, 'accepted inventory mismatch');
  requireFact(additions.every(id=>data.records[id]?.status==='closed' && data.records[id].proof && data.records[id].statement),
    'new accepted result without exact output');
  requireFact(data.counts.pendingOriginals.length===5 &&
    data.counts.pendingOriginals.every(id=>!selected.has(id) && data.records[id]?.status==='partial'), 'original scope mismatch');
  const checkReader = entry => requireFact(entry && typeof entry.destination==='string' && entry.destination.length &&
    Number.isInteger(entry.page) && entry.page>0 && entry.page<=data.reader.pages, 'invalid printed destination');
  for (const [id,entry] of Object.entries(data.records)) {
    requireFact(id===entry.id && idPattern.test(id) && previous.graph.chapters[entry.chapter] &&
      (entry.status==='closed' ? selected.has(id) : entry.status==='partial' && !selected.has(id)), 'invalid record '+id);
    checkReader(entry.reader);
    if (entry.historical) checkReader(entry.historical);
    for (const reader of entry.narrowReaders ?? []) checkReader(reader);
  }
  for (const entry of Object.values(data.scopeRecords)) if (entry.reader) checkReader(entry.reader);
  for (const reader of [...Object.values(data.inheritedReaders),...Object.values(data.chapterReaders)]) checkReader(reader);
  checkDependencyCycles(data,previous.graph);
  for (const record of Object.values(data.records)) {
    if (record.proof) record.proof = proofWithScopedLinks(record,data);
  }
  return {current:pointer, data, pdf, additions:new Set(additions), fixed, readerPath};
}

function checkDependencyCycles(data,previous) {
  const exact = new Map(Object.entries(previous.arguments).map(([id,record])=>[id,record.inputs.map(entry=>entry.key)]));
  for (const [key,record] of Object.entries({...data.records,...data.scopeRecords})) {
    if (record.status==='closed' || (!record.status && record.requires.length)) exact.set(key,record.requires);
  }
  const pending = new Set(data.counts.pendingOriginals);
  for (const record of [...Object.values(data.records),...Object.values(data.scopeRecords)]) {
    requireFact(record.requires.every(key=>!pending.has(key)), 'a rejected whole was used as an operative input');
  }
  const pendingVisit = new Set();
  const visited = new Set();
  function visit(key) {
    if (!exact.has(key) || visited.has(key)) return;
    requireFact(!pendingVisit.has(key), 'cycle at '+key);
    pendingVisit.add(key);
    for (const target of exact.get(key)) visit(target);
    pendingVisit.delete(key);
    visited.add(key);
  }
  for (const key of exact.keys()) visit(key);
  requireFact(visited.size===data.verifiedGraphNodes,'dependency inventory drift');
}

export const printed = (reader, label) => link(readerPath+'#nameddest='+encodeURIComponent(reader.destination),
  label ?? 'Read in the English PDF (p. '+reader.page+')');
const scopeAnchor = key => 'scope-'+encodeURIComponent(key).replaceAll('%','_');
const facetNormal = {destination:'equation.I.2.48',page:2180};
const pdfDestination = reader => readerPath+'#nameddest='+encodeURIComponent(reader.destination);

export function selectedScopeHref(key, scope) {
  if (scope.reader || scope.proof) return tagRoute(scope.id)+'#'+scopeAnchor(key);
  return scope.archived ? oldFixed+scope.archived.slice(1) : '';
}

// Historical result numbers can cover several different scopes. Only replace
// citations whose sentence specifies a verified retained input.
const formalTopologyScope = 'CLAUSE:NAG-001944:formal_topology';
const formalBlowupScope = 'CLAUSE:NAG-001945:formal_existence_restriction_product_pullback';
const fibreStatementLabel = 'fnd:formalglobalgenericfaithful';
const strictRegularityLabel = 'fnd:separablenormalizationregularlocus';
const suppliedTraceScope = 'SUPPORT:NAG-001944:given_atlas_open_preimages_and_contraction';
const fibreReference = (context,key) => [context,'3.17.2',fibreStatementLabel,key];
const directNarrowProofs = new Map([
  ['NAG-001761','errata:nag001761'],
  ['NAG-002072','lemma.I.2.72'],
  ['NAG-001944','nag.scope.001944.qpcfiniteincidence'],
  ['NAG-001945','nag.scope.001945.suppliedatlas'],
]);
const inheritedProofReferences = new Map([
  ['NAG-001763',[
    ['is strict and integral. Proposition','2.35.24',strictRegularityLabel,'NAG-001761'],
    ['Apply Proposition','2.35.24',strictRegularityLabel,'NAG-001761'],
  ]],
  ['NAG-001764',[
    ['Apply Proposition','2.35.24',strictRegularityLabel,'NAG-001761'],
  ]],
  ['NAG-002073',[
    ['</a> and','4.24.4','cand:boundarycoefficientorder','NAG-002072',' '],
  ]],
  ['NAG-002227',[
    ['as in Proposition','3.17.2',fibreStatementLabel,formalTopologyScope],
    ['Uniqueness follows from the faithfulness in Proposition','3.17.2',fibreStatementLabel,
      'SUPPORT:NAG-001944:supplied_actual_arrow_faithfulness'],
  ]],
  ['NAG-001946',[
    ['is Noetherian topologically, by Proposition','3.17.2',fibreStatementLabel,formalTopologyScope],
  ]],
  ['NAG-002016',[
    ['For a finite family of monomials, blow up the product of these open ideals. Lemma','3.17.3','fnd:formalglobalblowupcalculus',
      formalBlowupScope],
    fibreReference('by functoriality of specialization and Proposition','NAG-001944'),
  ]],
  ['NAG-002038',[
    fibreReference('2.33.30</a>. Proposition','NAG-001944'),
  ]],
  ['NAG-002054',[
    fibreReference('Formal-open compatibility in Proposition',suppliedTraceScope),
    fibreReference('The affinoid net topology of Proposition','NAG-001944'),
  ]],
  ['NAG-002100',[
    ['Its formal generic fibre is unchanged by Lemma','3.17.3','fnd:formalglobalblowupcalculus','NAG-001945'],
  ]],
  ['NAG-002274',[fibreReference('Functoriality of specialization in Proposition','NAG-001944')]],
  ['NAG-002276',[
    fibreReference('Functoriality of specialization and its surjectivity on the source, both in Proposition','NAG-001944'),
  ]],
  ['NAG-002310',[
    fibreReference('Surjectivity and functoriality of specialization are Proposition','NAG-001944'),
  ]],
  ['NAG-002339',[fibreReference('4.13.1</a> and Proposition',suppliedTraceScope)]],
  ['NAG-002176',[
    fibreReference('and their generic fibres are the corresponding unions by Proposition',suppliedTraceScope),
  ]],
  ['NAG-002177',[
    fibreReference('and their generic fibres cover the analytic overlap by Proposition','NAG-001944'),
  ]],
  ['NAG-002218',[
    fibreReference('its formal open set is its generic domain, by Proposition',suppliedTraceScope),
  ]],
]);

export function linkInheritedProofReferences(html, id, data) {
  const record=data.records[id];
  for (const [context,number,label,key,space=' '] of inheritedProofReferences.get(id) ?? []) {
    const scope=data.scopeRecords[key];
    const narrow=data.records[key]?.narrowReaders?.find(reader=>reader.destination===directNarrowProofs.get(key));
    requireFact((scope || narrow) && (!record || record.requires.includes(key)),'missing retained proof input '+key);
    const oldHref=chapterRoute(number.split('.')[0])+'#label-'+Buffer.from(label).toString('hex');
    const href=scope ? selectedScopeHref(key,scope) : pdfDestination(narrow);
    const source=context+space+link(oldHref,number);
    requireFact(href && html.includes(source),'missing retained proof citation '+id+' / '+key);
    html=html.replace(source,()=>context+space+link(href,number));
  }
  return html;
}

// These companion passages name retained authorities in the seal but have
// no numbered proof citation or separately registered result.
const topologyCitation = ['formal-topology clause of NAG-001944',formalTopologyScope];
const formalChapterReferences = new Map([
  ['010:105',[topologyCitation]],
  ['010:248',[topologyCitation]],
  ['010:258',[['NAG-001946','NAG-001946']]],
  ['010:267',[['formal-only NAG-001945 clause',formalBlowupScope]]],
  ['010:411',[
    ['topological Noetherian clause of NAG-001944',formalTopologyScope],
    ['formal existence and restriction clause of NAG-001945',formalBlowupScope],
  ]],
  ['010:419',[topologyCitation]],
]);

export function linkFormalChapterReferences(html, block, data) {
  for (const [source,key] of formalChapterReferences.get(block) ?? []) {
    const scope=data.scopeRecords[key];
    const proof=data.inheritedReaders[key];
    const href=scope ? selectedScopeHref(key,scope) : proof ? tagRoute(key)+'#foundations-exact-proof' : '';
    requireFact(href && html.includes(source),'missing formal chapter citation '+block+' / '+key);
    html=html.replace(source,()=>link(href,source));
  }
  return html;
}

function proofWithScopedLinks(record, data) {
  let html=record.proof.html;
  const scopes = record.requires.map(key=>[key,data.scopeRecords[key]]).filter(([,scope])=>scope);
  for (const [key,scope] of scopes) {
    const historical=data.records[scope.id]?.historical;
    if (!historical || scopes.filter(([,item])=>item.id===scope.id).length!==1) continue;
    const target=selectedScopeHref(key,scope);
    if (target) html=html.replaceAll('href="'+pdfDestination(historical)+'"','href="'+target+'"');
  }
  return {...record.proof,html};
}

function inputs(record, data) {
  const selected = new Set(data.selected);
  const refs = record.requires.map(key => {
    const scope = data.scopeRecords[key];
    const target=scope ? selectedScopeHref(key,scope) : '';
    if (target) {
      return link(target,scope.title)+' <small>('+escape(scope.id)+')</small>';
    }
    if (key==='SUPPORT:F7:exact_facet_normal_formula') return printed(facetNormal,'Facet-normal boundary formula');
    if (selected.has(key)) return link(tagRoute(key),key);
    if (/^STACKS[:-][A-Z0-9]{4}$/.test(key) && record.stacks.includes(key.slice(-4))) {
      return link('https://stacks.math.columbia.edu/tag/'+key.slice(-4),'Stacks Project, Tag '+key.slice(-4));
    }
    return escape(key)+' <small>(exact web target unavailable)</small>';
  });
  for (const tag of record.stacks)
    refs.push(link('https://stacks.math.columbia.edu/tag/'+tag,'Stacks Project, Tag '+tag));
  return refs.length ? '<section><h2>Selected proof inputs</h2><ul>'+[...new Set(refs)].map(ref=>'<li>'+ref+'</li>').join('')+'</ul></section>' : '';
}


const macros = Object.fromEntries([
  ['mathbb', ['R','RR','N','Z','ZZ']],
  ['mathcal', ['A','BB','cA','cE','cL','cM','cO','cX','cY','D','E','F','I','OO','PP','T','TT']],
].flatMap(([command,names])=>names.map(name=>['\\'+name,'\\'+command+'{'+name.at(-1)+'}'])));
Object.assign(macros, {
  '\\an':'\\mathrm{an}', '\\dd':"d'd''", '\\DD':"d'd''", '\\B':'\\mathfrak{B}',
  '\\divis':'\\operatorname{div}', '\\length':'\\operatorname{length}', '\\ext':'\\operatorname{ext}_0',
  '\\Int':'\\operatorname{Int}', '\\Min':'\\operatorname{Min}', '\\supp':'\\operatorname{supp}',
  '\\Supp':'\\operatorname{Supp}', '\\relint':'\\operatorname{relint}',
});
const entities = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&#x27;':"'"};

function typesetReaderText(html) {
  return html.replace(/<span\s+class="math (inline|display)">(\$\$[\s\S]*?\$\$|\$[^$]*\$|\\\([\s\S]*?\\\))<\/span>/g,
    (math, layout, formula) => {
      const width = formula.startsWith('$$') || formula.startsWith('\\(') ? 2 : 1;
      const tex=formula.slice(width,-width).replace(/&(?:amp|lt|gt|quot|#39|#x27);/g,entity=>entities[entity])
        .replace(/\\(begin|end)\{split\}/g,'\\$1{aligned}');
      return '<span class="math '+layout+'">'+katex.renderToString(tex,
        {displayMode: layout==='display', output:'htmlAndMathml', macros:{...macros}, strict:'ignore', trust:false})+'</span>';
    });
}

function textSection(title, binding, id) {
  if (!binding) return '';
  return '<section id="'+id+'"'+(id==='foundations-exact-proof' ? ' class="proof"' : '')+'><h2>'+escape(title)+'</h2>'+typesetReaderText(binding.html)+
    '<details'+(binding.html ? '' : ' open')+'><summary>TeX reading text</summary><pre data-source-sha256="'+
    binding.sourceSha256+'">'+escape(binding.tex)+'</pre></details></section>';
}

const narrowProofLabels = {
  'NAG-001761':['Uniform regularity for analytically separable extensions'],
  'NAG-001944':['Principal formal opens','Generic fibre under finite incidence',
    'Specialization traces on a supplied atlas','Faithfulness for supplied compatible arrows'],
  'NAG-001945':['Generic comparison on supplied compatible atlases'],
  'NAG-002072':['Integral coefficients and residual order'],
  'NAG-002213':['Generization along nonempty faces'],
};

function narrowProofs(record, current = false) {
  if (!record.erratum) return '';
  const proofs = record.narrowReaders.map((reader,index)=>printed(reader,narrowProofLabels[record.id][index]));
  if (record.id==='NAG-001761') {
    proofs.push(printed({destination:'proposition.2.35.27',page:332},'Strict normalization with the finite Tate normalizer'));
  }
  if (record.formalWindow) {
    const old = oldFixed+tagRoute(record.id).slice(1);
    const fragment = record.id==='NAG-001945' ? 'formal_existence_restriction_product_pullback' : 'formal_topology';
    const target=current && record.id==='NAG-001944' ? tagRoute(record.id)+'#'+scopeAnchor(formalTopologyScope) : old+'#'+fragment;
    proofs.unshift(link(target,record.id==='NAG-001945'
      ? 'Formal blowup, restriction, products and pullback' : 'Noetherian affine formal topology'));
  }
  return '<ul class="scope-proofs">'+proofs.map(proof=>'<li>'+proof+'</li>').join('')+'</ul>';
}

// Assigned numbers are those printed in the sealed PDF at pp. 1212 and 2155.
const fixedTestEquations = new Map([['eq:meromorphic','10.1.1'], ['eq:metric','10.1.2']]);
const dualEquations = new Map([['fnd:nag003002:dual-equation','I.2.36']]);
const equationLabelAnchor = label => 'label-'+Buffer.from(label).toString('hex');
const compactTeX = tex => tex.replace(/\s+/g,'').replace(/\.$/,'');
const scrollableMathML = display => '<span class="math display" tabindex="0">'+display+'</span>';

function numberSealedEquations(statement, numbers) {
  const byFormula = new Map();
  for (const [,label,formula] of statement.tex.matchAll(/\\begin\{equation\}\\label\{([^}]+)\}([\s\S]*?)\\end\{equation\}/g)) {
    if (numbers.has(label)) byFormula.set(compactTeX(formula),{label,number:numbers.get(label)});
  }
  requireFact(byFormula.size===numbers.size,'sealed equation labels changed');

  const displays=/<span\s+class="math display">\$\$([\s\S]*?)\$\$<\/span>|<math\s+display="block"[^>]*>[\s\S]*?<\/math>/g;
  const html=statement.html.replace(displays, (display,tex) => {
    const annotation=tex ?? display.match(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/)?.[1];
    if (!annotation) return display;
    const formula=compactTeX(annotation.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g,entity=>entities[entity]));
    const equation=byFormula.get(formula);
    if (!equation) return display;
    byFormula.delete(formula);
    const boundedDisplay=tex==null ? scrollableMathML(display) : display;
    return '<span id="'+equationLabelAnchor(equation.label)+'"></span>'+boundedDisplay+
      '<span class="book-note equation-number">('+equation.number+')</span>';
  });
  requireFact(byFormula.size===0,'sealed equations did not match the HTML displays');
  return {...statement,html};
}

function currentStatement(record) {
  if (record.id==='NAG-003002') {
    const reader={destination:'foundations.nag-002999.original'};
    return {...record.statement,html:record.statement.html.replace(
      printed(reader,'[prop:orderzero]'),printed(reader,'I.0.18'))};
  }
  if (record.id==='NAG-003106') {
    return {...record.statement,html:currentFixedTestCitation(record.statement.html)};
  }
  return record.statement;
}

function currentFixedTestCitation(html) {
  return html.replaceAll(printed({destination:'theorem.10.1.1'},'[thm:fixed]'),
    link(tagRoute('NAG-003103'),'NAG-003103'));
}

// These links follow the seal 1174 PDF annotations on pages 1213–1214 and 2155–2156.
// Its HTML export resolved the unqualified labels against other source blocks.
function currentReadingLinks(record) {
  const tag = id => link(tagRoute(id),id);
  const contextHref = chapterRoute('10')+'#f8nm:native-placement-review';
  if (record.id === 'NAG-003103') {
    let html = record.proof.html
      .replace('and frozen /, exactly', 'and frozen '+tag('NAG-001630')+'/'+link(tagRoute('NAG-001704'),'001704')+', exactly')
      .replace(printed({destination:'foundations.nag-002989.original'},'[prop:quotient]'), tag('NAG-003100'));
    for (const [label, number] of fixedTestEquations) {
      const reader={destination:'equation.'+number};
      html=html.replaceAll(printed(reader,'['+label+']'),printed(reader,'('+number+')'));
    }
    return {...record,contextHref,statement:numberSealedEquations(record.statement,fixedTestEquations),proof:{...record.proof,html}};
  }
  if (record.id === 'NAG-003002') {
    const equation={destination:'equation.I.2.36'};
    const smoothPairing={destination:'foundations.nag-002995.original'};
    const html=record.proof.html
      .replace(/Frozen\s+transfers the same conclusion/, 'Frozen '+tag('NAG-002473')+' transfers the same conclusion')
      .replace(printed(equation,'[fnd:nag003002:dual-equation]'),printed(equation,'(I.2.36)'))
      .replace(printed(smoothPairing,'[fnd:nag002995:smooth-pairing]'),printed(smoothPairing,'I.2.15'))
      .replace(/<math\s+display="block"[^>]*>[\s\S]*?<\/math>/g,scrollableMathML);
    return {...record,statement:numberSealedEquations(currentStatement(record),dualEquations),proof:{...record.proof,html}};
  }
  if (record.id === 'NAG-003106') {
    const html = currentFixedTestCitation(record.proof.html)
      .replaceAll(printed({destination:'equation.I.2.33'},'[eq:logsplit]'),
        '('+printed({destination:'equation.I.2.82'},'NAG-003101')+')')
      .replace('[eq:cycles]', '('+printed({destination:'equation.I.2.83'},'NAG-003102')+')')
      .replace('factorization used in frozen ,', 'factorization used in frozen '+tag('NAG-002473')+',');
    return {...record,contextHref,statement:currentStatement(record),proof:{...record.proof,html}};
  }
  return record;
}

// Restore the visible citations on p. 2200 in the active retained clause.
function currentScopePresentation(data, release, graph, logicRoot) {
  const previous=release.graph;
  const key='CLAUSE:NAG-003106:closed_pullback_only';
  const scope=data.scopeRecords[key];
  let html=scope.proof.html;
  for (const [destination,label,number] of [
    ['theorem.2.39.6','fnd:fullgkiehltheoremb','2.39.6'],
    ['corollary.1.18.4','fnd:generalizedaffinoidquotients','1.18.4'],
    ['lemma.2.53.2','fnd:closedimmersiontargetglocal','2.53.2'],
    ['theorem.5.52.3','v037:forms:germsheaf','5.52.3'],
  ]) {
    const reader={destination};
    html=html.replace(printed(reader,'['+label+']'),printed(reader,number));
  }
  const componentInput=link(tagRoute('NAG-002966'),'NAG-002966');
  html=html.replace('finality proves pullback continuity. gives the',
    'finality proves pullback continuity. '+componentInput+' gives the');
  const scopeRecords={...data.scopeRecords,[key]:{...scope,proof:{...scope.proof,html}}};
  for (const [scopeKey,entry] of Object.entries(scopeRecords)) {
    const parent=data.records[entry.id];
    const proof=isLateAppendixRecord(parent) ? currentReaderText(parent,entry.proof) : scrollEarlyDisplays(parent,entry.proof);
    const argument=graph.arguments[scopeKey];
    const earlier=previous.nodes[scopeKey];
    // Require the exact registered source span before carrying the earlier
    // bookmark into this scope and offering the scope's own argument card.
    const inherited=entry.proof && !entry.requires.length && argument?.inputs.length &&
      earlier?.spanHashes?.includes(entry.proof.sourceSha256);
    if (inherited) {
      const legacyPrefix=tagRoute(entry.id)+'#';
      requireFact(earlier.href.startsWith(legacyPrefix),'invalid legacy scope bookmark '+scopeKey);
      scopeRecords[scopeKey]={...entry,proof,legacyFragment:earlier.href.slice(legacyPrefix.length),
        mapHref:proofMapArgumentHref(logicRoot,argument.chapter,scopeKey)};
    } else if (proof!==entry.proof) {
      scopeRecords[scopeKey]={...entry,proof};
    }
  }
  // The erratum names this paragraph on p. 538. Stop where the proof turns
  // from formal topology to the separate assertions about generic fibres.
  const block=release.native.byKey.get('010')?.blocks[215];
  requireFact(block && digest(block)==='4ac070032bccf31ba25e5589405efd52728550ac0c3e151375bd69483b35887f',
    'formal-topology proof source drift');
  const passage=block.match(/<p>For every [\s\S]+?have finite principal-affine covers\./)?.[0];
  requireFact(passage && !passage.includes('</p>'),'missing formal-topology paragraph');
  scopeRecords[formalTopologyScope]={...scopeRecords[formalTopologyScope],legacyFragment:'formal_topology',
    sourcePassage:{html:'<p class="book-note">The formal affine is admissible over the standing nontrivially valued field.</p>'+
      passage+'</p>',page:538}};
  return {...data,scopeRecords};
}

// These four named destinations have printed Appendix I numbers on pp. 508
// and 2208 but do not carry those numbers in their stable destination names.
const earlyAppendixCitationNumbers = new Map([
  ['foundations.nag-001985.strict-subdomains-functoriality','I.2.28'],
  ['foundations.nag-001982.affine-to-good','I.2.27'],
  ['foundations.nag-001947.original','I.2.41'],
  ['foundations.nag-001948.original','I.2.42'],
]);

const isEarlyRecord = record => /^[1-6]$/.test(record?.chapter);

function scrollMathMLDisplays(binding) {
  const displays=/<span class="math display"[^>]*>\s*<math\s+display="block"[^>]*>[\s\S]*?<\/math><\/span>|<math\s+display="block"[^>]*>[\s\S]*?<\/math>/g;
  const html=binding.html.replace(displays,display=>display.startsWith('<span') ? display : scrollableMathML(display));
  return html===binding.html ? binding : {...binding,html};
}

function scrollEarlyDisplays(record, binding) {
  return binding && isEarlyRecord(record) ? scrollMathMLDisplays(binding) : binding;
}

const readerCitationKey = (destination, label) => JSON.stringify([destination,label]);
const appendixCitationCaptions = new Map(activeReaderLocators.appendixCitations.map(({destination,label,caption}) =>
  [readerCitationKey(destination,label),caption]));

const isLateAppendixRecord = record => record?.chapter==='appendix-h' || record?.chapter==='appendix-i';

const tagStatement = id => link(tagRoute(id)+'#tag-statement',id);
const printedTag = (destination, text) => printed({destination},text);
const cartierPartition = oldFixed+tagRoute('NAG-002428').slice(1)+'#compact_partition_only';
const frozenLogarithmicPairing = 'foundations.nag-002806.original';

// The HTML export drops Tag commands at these exact sites. Use the printed
// captions and, where the seal names a narrower clause or formula, its exact target.
const sealedTagCitations = new Map([
  ['NAG-002811',['proof','F8ST-C F8ST-I',[
    ['precisely the pending and interfaces;', 'precisely the pending F8ST-C and F8ST-I interfaces;'],
  ]]], // p. 2196 gives names to the two pending interfaces without links.
  ['NAG-002899',['statement','F8RC-L F8RC-P F8ST-A',[
    ['of the unchanged candidate;',
      'of the unchanged '+printedTag(frozenLogarithmicPairing,'F8RC-L')+' candidate;'],
    ['calibrated product assertion , with',
      'calibrated product assertion '+printedTag('foundations.nag-002802.original','F8RC-P')+', with'],
    ['the separately reviewed supplies it',
      'the separately reviewed '+printedTag('foundations.nag-002765.original','F8ST-A')+' supplies it'],
  ]]], // pp. 2190–2191
  ['NAG-002957',['proof','NAG-002416',[
    ['Frozen integral inclusion–exclusion identifies',
      'Frozen integral inclusion–exclusion '+tagStatement('NAG-002416')+' identifies'],
  ]]], // p. 2236
  ['NAG-002961',['proof','NAG-002389',[
    ['the frozen grid construction ; no measurable',
      'the frozen grid construction '+tagStatement('NAG-002389')+'; no measurable'],
  ]]], // p. 2219
  ['NAG-002981',['proof','NAG-001630 NAG-001704 NAG-002428 NAG-002772',[
    ['By and relative-interior composition\n, each',
      'By '+tagStatement('NAG-001630')+' and relative-interior composition\n'+tagStatement('NAG-001704')+', each'],
    ['Use to choose\ncompact ordinary smooth',
      'Use '+link(cartierPartition,'NAG-002428')+' to choose\ncompact ordinary smooth'],
    ['effective Cartier gluing in , identify',
      'effective Cartier gluing in '+printedTag('equation.F.1.5','NAG-002772')+', identify'],
  ]]], // p. 2162
  ['NAG-002983',['proof','NAG-002411 002413',[
    ['inherited purity are the frozen /\nstatements.',
      'inherited purity are the frozen '+tagStatement('NAG-002411')+'/'+tagStatement('NAG-002413')+'\nstatements.'],
  ]]], // p. 2220
  ['NAG-002995',['proof','NAG-002577',[
    ['The two clauses of frozen and the exterior signs',
      'The two clauses of frozen '+printedTag('fsevenInteriorDisplay.1','NAG-002577')+' and the exterior signs'],
  ]]], // p. 2154
  ['NAG-003100',['proof','NAG-002374 NAG-002772 002778 NAG-002806',[
    ['the dimension-drop input .', 'the dimension-drop input '+tagStatement('NAG-002374')+'.'],
    ['The exact antichain clause of , followed by , therefore identifies',
      'The exact antichain clause of '+printedTag('foundations.nag-002772.original','NAG-002772')+', followed by '+
        printedTag('foundations.nag-002778.original','NAG-002778')+', therefore identifies'],
    ['For logarithms, frozen makes each fixed compact top test',
      'For logarithms, frozen '+printedTag(frozenLogarithmicPairing,'NAG-002806')+' makes each fixed compact top test'],
  ]]], // p. 2224
]);

function restoreSealedTagCitations(record, binding, html) {
  const entry=sealedTagCitations.get(record.id);
  if (!entry) return html;
  const [part,commands,replacements]=entry;
  if (binding!==record[part]) return html;
  const actual=[...binding.tex.matchAll(/\\tagg\{([A-Z0-9-]+)\}/g)].map(match=>match[1]);
  requireFact(actual.join(' ')===commands,'sealed Tag citation sequence changed for '+record.id);
  for (const [before,after] of replacements) {
    requireFact(html.split(before).length===2,'sealed Tag citation context changed for '+record.id);
    html=html.replace(before,()=>after);
  }
  return html;
}

function currentReaderText(record, binding) {
  if (!binding) return binding;
  const appendix=isLateAppendixRecord(record);
  // The logarithmic excision supplement also cites the sealed Appendix I text.
  if (!appendix && record?.id!=='NAG-002565') return earlyReaderText(record,binding);
  let citations=restoreReaderReferences(binding,(destination,label,equation)=>{
    const caption=appendixCitationCaptions.get(readerCitationKey(destination,label));
    return caption?.startsWith('(')===equation ? caption : '';
  });
  citations=restoreSealedTagCitations(record,binding,citations);
  if (record.id==='NAG-002675' && binding===record.statement) {
    // (SC) is printed before Proposition G.0.9 without its own name.
    // The unmixed-quotient interfaces begin at the named heading on p. 2232.
    const phrase='the frozen interfaces specified above';
    const clause='Assume (SC), '+phrase;
    requireFact(citations.includes(clause),'scalar reduction hypothesis text drift');
    citations=citations.replace(clause,()=> 'Assume '+link(readerPath+'#page=2021','(SC)')+', '+
      printed({destination:'section*.412'},phrase));
  }
  const html=appendix ? linkStacksCitations(citations,binding.tex) : citations;
  return scrollMathMLDisplays(html===binding.html ? binding : {...binding,html});
}

function linkStacksCitations(html, tex) {
  const empty=/(<span\s+class="citation"\s+data-cites="StacksAlg">)<\/span>/g;
  const count=[...html.matchAll(empty)].length;
  if (!count) return html;
  const citations=[...tex.matchAll(/\\cite\[(Tag ([A-Z0-9]{4})[^\]]*)\]\{StacksAlg\}/g)];
  requireFact(citations.length===count,'unmatched sealed Stacks citation');
  let index=0;
  return html.replace(empty,(_,opening)=>{
    const [,caption,tag]=citations[index++];
    return opening+link('https://stacks.math.columbia.edu/tag/'+tag,'[StacksAlg, '+caption+']')+'</span>';
  });
}

function restoreReaderReferences(binding, captionFor) {
  const pdfTarget=readerPath+'#nameddest=';
  return binding.html.replace(/<a href="([^"]+)">\[([^\[\]]+:[^\[\]]+)\]<\/a>/g,(citation,href,label)=>{
    if (!href.startsWith(pdfTarget)) return citation;
    const reference=binding.tex.includes('\\ref{'+label+'}');
    const equation=binding.tex.includes('\\eqref{'+label+'}');
    if (reference===equation) return citation;
    const caption=captionFor(href.slice(pdfTarget.length),label,equation);
    return caption ? link(href,caption) : citation;
  });
}

function earlyReaderText(record, binding) {
  if (!binding || !isEarlyRecord(record)) return binding;
  const numbered=/^(?:theorem|lemma|proposition|corollary|definition|section|equation)\.(\d+(?:\.\d+)+)$/;
  const html=restoreReaderReferences(binding,(destination,_label,equation)=>{
    const number=earlyAppendixCitationNumbers.get(destination) ?? numbered.exec(destination)?.[1];
    return number && (equation ? '('+number+')' : number);
  });
  let linked=linkStacksCitations(html,binding.tex);
  if (record.id==='NAG-001796' && binding===record.statement) {
    const prior='NAG-001795';
    const caption='preceding theorem';
    requireFact(record.requires.includes(prior) && linked.includes(caption),'missing regularity hypothesis reference');
    linked=linked.replace(caption,()=>link(tagRoute(prior)+'#tag-statement',caption));
  }
  return scrollEarlyDisplays(record,linked===binding.html ? binding : {...binding,html:linked});
}

const anchorIds = html => new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));

function oldAnchors(html, alreadyPresent = '') {
  const current=anchorIds(alreadyPresent);
  return [...anchorIds(html)].filter(id=>!current.has(id))
    .map(id=>'<span id="'+escape(id)+'"></span>').join('');
}

export function createFoundationsReadingUpdate(update, release, registry) {
  if (!update) return null;
  const replacements=new Map(), superseded=new Map(), additional=new Map(), placements=new Map(), byChapter=new Map();
  const source=release.native;
  for (const record of Object.values(update.data.records).sort((a,b)=>a.reader.page-b.reader.page)) {
    const old=registry.tagLocations[record.id];
    const chapter=source.byKey.get(old?.key);
    const route=chapterRoute(record.chapter);
    const onPage=old?.index!=null && chapter.route===route;
    const location={href:onPage ? old.href : route+'#'+resultAnchor(record.id),
      sourceStatement:onPage ? chapter.blocks[old.index] : null};
    if (record.id==='NAG-000176') {
      const model=onPage ? chapter.blocks[old.index-1] : '';
      requireFact(readingText(model).includes('Its generic fibre is an analytic line bundle'),'model metric context drift');
      location.context=model;
    }
    placements.set(record.id,location);
    if (!byChapter.has(route)) byChapter.set(route,[]);
    byChapter.get(route).push(record);
    if (!onPage) {
      if (!additional.has(route)) additional.set(route,[]);
      additional.get(route).push(record);
      registry.tagLocations[record.id]={href:location.href,key:source.chapters.get(route)?.key};
      continue;
    }
    replacements.set(old.key+':'+old.index,record);
    if (!record.custody && old.proof!=null) {
      for (let index=old.proof; index<=old.proofEnd; index++) superseded.set(old.key+':'+index,record);
    }
  }
  const readerOnly=new Map();
  for (const id of update.data.counts.previousExactExportHolds) {
    const location=registry.tagLocations[id];
    const reader=update.data.inheritedReaders[id];
    requireFact(location?.index!=null && reader,'missing inherited proof location for '+id);
    const inline=location.inlineProof===true;
    const onWeb=location.proof!=null || inline;
    if (onWeb) {
      const row=registry.tags.get(id);
      requireFact(row?.status==='closed','unbound restored result in the current Tag index '+id);
      row.coverage='Accepted whole';
      row.summary=inline ? 'Accepted whole. The example includes its argument.' : row.coverage;
    }
    readerOnly.set(id,{reader,onWeb});
  }
  return {update,replacements,superseded,additional,placements,byChapter,readerOnly};
}

export function currentChapterRecord(record, source = '', hasNativeAnchor = false) {
  record=currentReadingLinks(record);
  const heading='<h3>'+escape(titleOf(record))+'</h3>';
  const tools='<p class="book-result-link">'+link(tagRoute(record.id),record.id)+' <small>'+
    escape(disposition(record))+'</small> · '+printed(record.reader)+'</p>';
  if (record.custody) {
    return source+'<p class="book-note">'+escape(record.custody)+' '+printed(record.reader)+'</p>';
  }
  const anchor=hasNativeAnchor ? oldAnchors(source,record.statement?.html) : '';
  const proofId=proofAnchor(record.id);
  const mathematics=record.erratum ?
    '<div class="tag-closure"><p>'+escape(record.scope)+'</p>'+narrowProofs(record,true)+'</div>'+
    '<details class="proof" id="'+proofId+'"><summary>'+narrowProofCaption+'</summary>'+
    typesetReaderText(record.erratum.html)+'</details>'+
    (record.historical ? '<p>'+printed(record.historical,'Original printed statement')+'</p>' : '') :
    typesetReaderText(currentReaderText(record,record.statement).html)+
    '<details class="proof" id="'+proofId+'"><summary>Proof</summary>'+typesetReaderText(currentReaderText(record,record.proof).html)+'</details>';
  return '<section class="chapter-current-result sealed-record" id="'+resultAnchor(record.id)+'">'+anchor+heading+tools+
    (!record.erratum && record.scope ? '<p class="book-note">'+escape(record.scope)+'</p>' : '')+mathematics+'</section>';
}

export const historicalReadingAnchors = oldAnchors;
export const currentProofHref = record => '#'+(record.custody ? resultAnchor(record.id) : proofAnchor(record.id));
export function currentProofTitle(record) {
  const title = titleOf(record);
  return record.erratum ? title+' · '+narrowProofCaption : title;
}

export function additionalChapterSection(reading, route) {
  if (!reading?.additional.get(route)?.length) return null;
  return {id:'local-analytic-arguments', title:route.includes('f8-reader-t4-di') ?
    'Logarithmic excision on a finite graph' : 'Local analytic arguments'};
}

function scopeSection(key, entry, data) {
  if (!entry.reader && !entry.proof) return '';
  const passage=entry.sourcePassage;
  const actions=[
    entry.reader ? printed(entry.reader,passage ? 'Reviewed erratum in the English PDF (p. '+entry.reader.page+')' : undefined) : '',
    passage ? link(readerPath+'#page='+passage.page,'Historical proof in the English PDF (p. '+passage.page+')') : '',
    entry.mapHref ? link(entry.mapHref,'Proof map for this scope') : '',
  ].filter(Boolean);
  const legacy=entry.legacyFragment ? '<span id="'+escape(entry.legacyFragment)+'"></span>' : '';
  return '<section id="'+scopeAnchor(key)+'">'+legacy+'<h3>'+escape(entry.title)+'</h3>'+
    (actions.length ? '<p>'+actions.join(' · ')+'</p>' : '')+(passage?.html ?? '')+
    textSection('Argument',entry.proof,scopeAnchor(key)+'-proof')+
    inputs(entry,data)+'</section>';
}

function extraScopes(id, data) {
  const entries = Object.entries(data.scopeRecords).filter(([, entry])=>entry.id===id)
    .map(([key,entry])=>scopeSection(key,entry,data)).filter(Boolean);
  return entries.length ? '<section class="book-text" id="selected-scopes"><h2>Selected scopes</h2>'+entries.join('')+'</section>' : '';
}

// Current paragraph ordinal followed by its original bookmark number. These
// passages match the pinned prose, ordered TeX and exact source references.
const earlyProofBookmarks = new Map([
  ['NAG-001808',[[1,1]]],
  ['NAG-001981',[[1,1],[2,2],[4,4]]],
  ['NAG-002405',[[1,1],[2,2],[3,3],[4,4],[5,5],[6,6]]],
  ['NAG-002462',[[1,1],[2,2],[3,3],[4,4],[5,5]]],
  ['NAG-002463',[[2,1],[7,5],[8,6]]],
  ['NAG-002465',[[1,1]]],
]);

function restoreEarlyProofBookmarks(record, proof, oldPage) {
  const placements=earlyProofBookmarks.get(record.id);
  if (!placements) return proof;
  const prior=anchorIds(oldPage ?? '');
  const html=linkProofParagraphs(proof.html,new Map(placements));
  const restored=anchorIds(html);
  for (const [,number] of placements) {
    const bookmark='proof-paragraph-'+number;
    requireFact(prior.has(bookmark) && restored.has(bookmark),'missing historical proof bookmark '+record.id+' / '+bookmark);
  }
  return {...proof,html};
}

function carryAnchors(oldPage, newPage) {
  if (!oldPage) return newPage;
  return newPage.replace('</main>',oldAnchors(oldPage,newPage)+'</main>');
}

function tagPage(record, data, oldPage, oldLocation, legacyGap) {
  const id = record.id;
  const route = tagRoute(id);
  const old = oldFixed+route.slice(1);
  const chapter = chapterRoute(record.chapter);
  const title = titleOf(record);
  if (record.custody && oldPage) {
    return oldPage.replace('<section id="citation"', '<section class="book-text" id="selected-inputs"><h2>Current proof binding</h2><p>'+
      escape(record.custody)+'</p><p>'+printed(record.reader)+'</p>'+inputs(record,data)+
      '<p>'+foundationsFeedback(route,data.edition,id)+'</p></section><section id="citation"');
  }
  const stateId = record.status==='partial' ? 'status-partial' : 'status-closed';
  const header = '<header class="page-intro tag-header"><div class="tag-heading-meta"><p class="tag-permalink">'+id+
    '</p><p class="tag-status" data-closure="'+record.status+'">'+link(project+'guide/#'+stateId,disposition(record))+'</p></div><h1>'+
    escape(title)+'</h1><nav class="tag-actions page-actions" aria-label="Tag links">'+link(oldLocation?.href ?? chapter,'Read in chapter')+
    link('#foundations-exact-proof',record.proof ? 'Proof' : 'Erratum and narrower proof')+
    (record.contextHref ? link(record.contextHref,'Hypotheses in Section 10.1') : '')+printed(record.reader)+
    (legacyGap ? link(old,'Prior fixed record') : '')+'</nav></header>';
  const narrower = record.erratum ? '<div id="closure"><p>'+escape(record.scope)+'</p>'+
    (record.historical ? '<p>'+printed(record.historical,'Original printed statement')+'</p>' : '')+
    (oldLocation?.sourceStatement ? '<details><summary>Original statement in the manuscript</summary>'+
      oldLocation.sourceStatement+'</details>' : '')+
    textSection('Reviewed erratum', record.erratum,'foundations-exact-proof')+
    '<h2>Full proofs at narrower scope</h2>'+narrowProofs(record,Boolean(data.scopeRecords[formalTopologyScope]?.sourcePassage))+'</div>' : '';
  const context=oldLocation?.context ? '<section id="model-metric-context"><h2>Formal model and metric</h2>'+
    oldLocation.context+'</section>' : '';
  const body = '<article class="book-text tag-text sealed-record">'+context+textSection('Statement',record.statement,'tag-statement')+
    (record.scope && !record.erratum ? '<p id="closure">'+escape(record.scope)+'</p>' : '')+narrower+
    textSection('Proof',record.proof,'foundations-exact-proof')+inputs(record,data)+
    extraScopes(id,data)+'</article><section id="citation" class="tag-citation"><h2>Citation</h2><p>Non-Archimedean Geometry Foundations, '+
    link(route,'Tag '+id)+', seal 1174.</p><p>'+foundationsFeedback(route,data.edition,id)+'</p></section>';
  const legacyStatus=legacyGap
    ? '<p id="open-status">'+link(record.status==='partial'?'#closure':'#foundations-exact-proof','Current proof status for '+id)+'</p>' : '';
  return carryAnchors(oldPage,foundationsShell(route,id+' · '+title,header+body+legacyStatus,{layout:'tag-page',
    extra:'<link rel="stylesheet" href="/assets/katex.min.css">'}));
}

export function applyFoundationsCoverage(update, coverage, registry) {
  for (const record of Object.values(update.data.records)) {
    let row = registry.tags.get(record.id);
    const destination=coverage.chapters.get(record.chapter);
    const earlier=[...coverage.chapters.values()].find(chapter=>chapter.tags.some(tag=>tag.id===record.id));
    if (!row) {
      row={id:record.id,link:tagRoute(record.id),category:'Foundations',project:'foundations',keywords:[],types:[]};
      registry.tags.set(record.id,row);
      destination.tags.push(row);
    } else if (earlier && earlier!==destination) {
      earlier.tags=earlier.tags.filter(tag=>tag.id!==record.id);
      destination.tags.push(row);
    }
    const statement=currentStatement(record);
    const text=readingText(statement?.html ?? record.erratum?.html ?? '');
    const summary=record.scope || text.slice(0,480) || row.summary;
    Object.assign(row,{title:titleOf(record),status:record.status,coverage:disposition(record),summary,
      body:[record.scope,text].filter(Boolean).join(' ').slice(0,1100) || row.body});
    if (record.status==='closed') {
      delete row.gap;
      row.types=[];
      coverage.gaps.delete(record.id);
    }
  }
  for (const [key,gaps] of coverage.byBlock) {
    const current=gaps.filter(gap=>coverage.gaps.has(gap.id) && !update.data.records[gap.id]?.erratum);
    coverage.byBlock.set(key,current);
  }
  for (const chapter of coverage.chapters.values()) {
    chapter.gaps=chapter.gaps.filter(gap=>coverage.gaps.has(gap.id));
    chapter.tagCounts=Object.fromEntries(coverageGroups.map(group=>[group,0]));
    for (const row of chapter.tags) chapter.tagCounts[closureGroup(row.status)]++;
  }
  coverage.narrower=[...coverage.gaps.keys()].filter(id=>registry.tags.get(id).status==='partial').length;
}

const items = records => '<ul>'+records.map(record=>'<li>'+link(tagRoute(record.id),record.id+' · '+titleOf(record))+
  (record.erratum ? ' <small>'+escape(disposition(record))+'</small>' : '')+
  (record.status==='partial' ? ' · '+link(tagRoute(record.id)+'#closure','Erratum and narrower scope') :
    ' · '+link(tagRoute(record.id)+'#foundations-exact-proof','Proof'))+'</li>').join('')+'</ul>';

function auditSection(audit) {
  const [exact,nonResults,omissions,narrower,unknown]=audit.coverage;
  return '<section id="reader33"><h2>Historical Reader33 audit</h2><p>The earlier audit classifies '+exact+
    ' exact-content windows, '+nonResults+' non-result windows, '+omissions+' confirmed omissions, '+narrower+
    ' windows with a narrower result and '+unknown+' unresolved printed windows. These are counts of windows.</p>'+
    '<h3>Five confirmed historical omissions</h3><ul>'+audit.omissions.map(([label,pages,gate])=>'<li><strong>'+
      escape(label)+'</strong> (historical pp. '+escape(pages)+'). '+escape(gate)+'</li>').join('')+'</ul>'+
    '<h3>Six further full-scope matches</h3><ul>'+audit.furtherFullScopeMatches.map(([label,id])=>'<li>'+
      escape(label)+' · '+link(tagRoute(id),id)+'</li>').join('')+'</ul><p>These matches have independently verified current proofs. '+
    'Their overlap with the earlier set of '+unknown+' unresolved windows remains unverified.</p></section>';
}

function countsParagraph(counts, additions) {
  return '<p>'+counts.whole.toLocaleString('en-US')+' accepted whole results, including '+additions+
    ' added since seal 1097. The source counts '+counts.standaloneClauses+' clauses separately. '+
    counts.priorityAccepted+' of '+counts.priorityTotal+' priority originals and '+
    counts.exceptionalAccepted+' of '+counts.exceptionalTotal+' exceptional originals are accepted at their stated scope.</p>';
}

function overview(update, changes, chapterTitles) {
  const {counts,historicalAudit}=update.data;
  const body='<header class="page-intro"><h1>Foundations seal 1174</h1>'+foundationsPdfLink(readerPath)+
    countsParagraph(counts,update.additions.size)+'<p>'+
    link(contentsRoute,'Table of contents')+' · '+link(fixed+'coverage/','Coverage and historical audit')+' · '+
    link(fixed+'logic/','Selected proof inputs')+' · '+link(oldFixed,'Previous fixed edition')+'</p></header>'+
    '<section><h2>77 newly accepted whole results</h2>'+Object.entries(chapterTitles).map(([slug,title])=>{
      const accepted=changes.filter(record=>record.chapter===slug && update.additions.has(record.id));
      return accepted.length ? '<h3>'+link(project+'chapters/'+slug+'/',title)+'</h3>'+items(accepted) : '';
    }).join('')+'</section><section><h2>Five original-scope errata</h2>'+
    items(changes.filter(row=>row.status==='partial'))+'</section>';
  return foundationsShell(fixed,'Seal 1174',body,{layout:'coverage-page'});
}

function currentProofMap(previous, data, {reading:{inheritedTitles,readerOnly},tags,coverage}) {
  const nodes={...previous.nodes};
  for (const [id,{onWeb}] of readerOnly) {
    if (!onWeb) continue;
    const node=nodes[id];
    requireFact(node?.href===tagRoute(id)+'#accepted-export-held' && node.status==='accepted whole; PDF destination',
      'unbound restored result in the current proof map '+id);
    nodes[id]={...node,href:tagRoute(id),status:'accepted whole'};
  }
  for (const [id,label] of inheritedTitles) {
    requireFact(nodes[id]?.status==='accepted whole','unbound inherited proof map title '+id);
    nodes[id]={...nodes[id],label};
  }
  const argumentsByKey={...previous.arguments};
  const conditions={...previous.principalConditions};
  for (const [key,entry] of Object.entries(data.scopeRecords)) {
    if (!entry.proof && !entry.reader && !entry.archived) continue;
    const href=selectedScopeHref(key,entry);
    nodes[key]={id:entry.id,label:entry.title,href,status:'accepted narrower scope'};
  }
  for (const record of Object.values(data.records)) {
    if (record.erratum) continue;
    nodes[record.id]={id:record.id,label:titleOf(record),status:'accepted whole',href:tagRoute(record.id)};
    if (record.scope) conditions[record.id]=[record.scope];
  }
  nodes['SUPPORT:F7:exact_facet_normal_formula']={label:'Facet-normal boundary formula',status:'named source formula',href:pdfDestination(facetNormal)};
  for (const [key,record] of Object.entries({...data.records,...data.scopeRecords})) {
    if (record.erratum || !nodes[key] || (!record.status && !record.requires.length && !record.stacks.length)) continue;
    const external=new Set(record.stacks);
    const inputs=[], unresolved=[];
    for (const premise of record.requires) {
      if (nodes[premise]) inputs.push({key:premise,scopes:[]});
      else if (/^STACKS[:-][A-Z0-9]{4}$/.test(premise)) external.add(premise.slice(-4));
      else unresolved.push(premise);
    }
    const chapter=record.chapter ?? data.records[record.id]?.chapter ?? previous.arguments[key]?.chapter ??
      Object.keys(previous.chapters).find(slug=>Object.hasOwn(previous.arguments,record.id) && previous.arguments[record.id].chapter===slug);
    requireFact(chapter && previous.chapters[chapter],'no chapter binding for selected proof '+key);
    argumentsByKey[key]={chapter,inputs,standing:[],unresolved,
      external:[...external].map(tag=>({key:'Stacks Project, Tag '+tag,href:'https://stacks.math.columbia.edu/tag/'+tag,scopes:[]}))};
  }
  const relocatedArguments=new Map();
  for (const [key,argument] of Object.entries(argumentsByKey)) {
    const chapter=tags[key]?.href.split('/').at(-2);
    if (!chapter || chapter===argument.chapter || !Object.hasOwn(previous.chapters,chapter) ||
        nodes[key]?.status!=='accepted whole') continue;
    const earlier=relocatedArguments.get(argument.chapter) ?? [];
    earlier.push(key);
    relocatedArguments.set(argument.chapter,earlier);
    argumentsByKey[key]={...argument,chapter};
  }
  const gaps=Object.fromEntries(data.counts.pendingOriginals.map(id=>{
    const record=data.records[id];
    return [id,{href:tagRoute(id)+'#closure',chapter:record.chapter,label:titleOf(record),step:record.scope}];
  }));
  const chapters=Object.fromEntries([...coverage.chapters].map(([slug,{title}])=>[slug,title]));
  return {...previous,edition:data.edition,chapters,nodes,arguments:argumentsByKey,relocatedArguments,gaps,principalConditions:conditions};
}

export function buildFoundationsUpdate(update, native, oldRelease) {
  const data=update.data;
  const records=Object.values(data.records);
  const logicRoute=fixed+'logic/';
  const graph=currentProofMap(oldRelease.graph,data,native);
  const currentData=currentScopePresentation(data,oldRelease,graph,logicRoute);
  const changedScopes=new Set(Object.entries(currentData.scopeRecords)
    .filter(([key,entry])=>entry!==data.scopeRecords[key]).map(([,entry])=>entry.id));
  const active=new Map();
  const frozen=new Map();
  for (const record of records) {
    const route=tagRoute(record.id);
    const oldPage=native.pages.get(route);
    const location=native.reading.placements.get(record.id);
    const legacyGap=Object.hasOwn(oldRelease.graph.gaps,record.id);
    const recordPage=tagPage(record,data,oldPage,location,legacyGap);
    const currentRecord=currentReadingLinks(record);
    if (currentRecord===record) {
      const proof=restoreEarlyProofBookmarks(record,currentReaderText(record,record.proof),oldPage);
      const statement=currentReaderText(record,record.statement);
      const activePage=proof===record.proof && statement===record.statement && !changedScopes.has(record.id)
        ? recordPage : tagPage({...record,proof,statement},currentData,oldPage,location,legacyGap);
      active.set(route,activePage);
    } else {
      const proof=currentReaderText(record,currentRecord.proof);
      const statement=currentReaderText(record,currentRecord.statement);
      // The exact proofs have the same paragraph boundaries as the native proofs.
      const anchoredRecord={...currentRecord,statement,proof:{...proof,html:linkProofParagraphs(proof.html)}};
      active.set(route,tagPage(anchoredRecord,currentData,oldPage,location,legacyGap));
    }
    const fixedTag=fixed+route.slice(1);
    frozen.set(fixedTag,recordPage.replace('rel="canonical" href="'+route+'"','rel="canonical" href="'+fixedTag+'"')
      .replace(foundationsFeedback(route,data.edition,record.id),foundationsFeedback(fixedTag,data.edition,record.id)));
  }
  for (const [id, inheritedReader] of Object.entries(data.inheritedReaders)) {
    const reader=native.reading.recoveredReaders.get(id) ?? inheritedReader;
    const route=tagRoute(id);
    const page=native.pages.get(route);
    const exportReceipt=native.reading.readerOnly.get(id);
    const textKind=native.reading.textArguments.get(id)?.kind;
    const printLabel=textKind ? 'Read the '+textKind+' in the English PDF (p. '+reader.page+')' :
      'Statement and proof in the English PDF (p. '+reader.page+')';
    const receipt=exportReceipt && !exportReceipt.onWeb
      ? '<p'+(page?.includes('id="foundations-exact-proof"') ? '' : ' id="foundations-exact-proof"')+'>'+
        printed(reader,'Read the example and its argument in the English PDF')+'</p>'
      : printed(reader,printLabel);
    if (page && !active.has(route)) active.set(route,page.replace('<section id="citation"',
      '<div class="book-note">'+receipt+'</div><section id="citation"'));
  }
  for (const id of new Set(Object.values(data.scopeRecords).map(record=>record.id))) {
    const route=tagRoute(id);
    const page=active.get(route) ?? native.pages.get(route);
    if (data.records[id] || !page) continue;
    const scopes=extraScopes(id,currentData);
    if (scopes) active.set(route,page.replace('</main>',scopes+'</main>'));
  }
  for (const id of inheritedProofReferences.keys()) {
    const route=tagRoute(id);
    const page=active.get(route) ?? native.pages.get(route);
    requireFact(page,'unavailable retained Tag page '+id);
    active.set(route,linkInheritedProofReferences(page,id,currentData));
  }
  const pdfRoutes=[contentsRoute,project+'reader/'];
  for (const route of pdfRoutes) {
    const page=native.pages.get(route);
    active.set(route,page.replace('</header>','<p class="page-actions">'+link(fixed,'Fixed edition')+
      ' · '+link(fixed+'logic/','Proof map')+'</p></header>'));
  }
  const audit=auditSection(data.historicalAudit);
  const holds='<section id="proof-access"><h2>Proof access for seven previously accepted results</h2><ul>'+
    [...native.reading.readerOnly].map(([id,binding])=>'<li>'+link(tagRoute(id),id)+' · '+
      (binding.onWeb ? link(tagRoute(id)+'#foundations-exact-proof','Web proof')+' · ' : '')+printed(binding.reader)+'</li>').join('')+'</ul></section>';
  const coverage=items(records.filter(record=>record.status==='partial'));
  const currentCoverage=native.pages.get(coverageRoute);
  const earlierGaps=Object.entries(oldRelease.graph.gaps).filter(([id])=>update.additions.has(id));
  const oldGroups=[...new Set(earlierGaps.map(([,gap])=>gap.chapter))];
  const oldLocations=oldGroups.filter(chapter=>!currentCoverage.includes('id="gaps-'+chapter+'"'))
    .map(chapter=>'<span id="gaps-'+escape(chapter)+'"></span>').join('');
  const nowSelected='<details><summary>Previously open Tags now accepted</summary>'+oldLocations+'<ul>'+
    earlierGaps.map(([id])=>'<li id="open-'+id+'">'+link(tagRoute(id),id)+'</li>').join('')+'</ul></details>';
  const counts='<section id="accepted-result-counts"><h2>Accepted results in seal 1174</h2>'+
    countsParagraph(data.counts,update.additions.size)+'</section>';
  active.set(coverageRoute,currentCoverage.replace('</header>','</header>'+counts+
    '<section id="original-scope"><h2>Five original claims with restrictions or a remaining gap</h2>'+coverage+'</section>')
    .replace('</main>',nowSelected+holds+audit+'</main>'));
  frozen.set(fixed,overview(update,records,oldRelease.graph.chapters));
  frozen.set(fixed+'coverage/',foundationsShell(fixed+'coverage/','Seal 1174 coverage',
    '<h1>Coverage and remaining obligations</h1>'+counts+'<section><h2>Five original claims with restrictions or a remaining gap</h2>'+coverage+'</section>'+holds+audit,
    {layout:'coverage-page'}));
  const logicShell=(route,title,body)=>foundationsShell(route,title,
    '<div class="logic-flow">'+body+'</div>',{layout:'coverage-page',
      extra:'<link rel="stylesheet" href="'+oldFixed+'logic/logic.css">'});
  const logic=currentFoundationsLogicPages(graph,oldRelease.logicBytes,logicRoute,logicShell);
  for (const [route,page] of logic) frozen.set(route,page);
  const proofBookmarks=new Map([...earlyProofBookmarks].map(([id,placements])=>
    [tagRoute(id),['foundations-exact-proof',...placements.map(([,prior])=>'proof-paragraph-'+prior)]]));
  return {active,frozen,proofBookmarks};
}
