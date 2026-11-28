import {additionalChapterSection, applyFoundationsCoverage, createFoundationsReadingUpdate, currentChapterRecord,
  currentProofHref, currentProofTitle, historicalReadingAnchors, linkFormalChapterReferences,
  linkInheritedProofReferences, printed, selectedScopeHref} from './build-foundations-update.mjs';
import {readFile} from 'node:fs/promises';
import {readingText} from './build-foundations-dependencies.mjs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import katex from 'katex';
import {foundationsBookmark, linkProofParagraphs, sourcePolicyNotice} from './build-foundations-web.mjs';
import {foundationsCoverage, gapCount} from './foundations-reading-status.mjs';
import {editFoundationsReadingHtml, foundationsReferenceLabels, foundationsRemarkNumbers, linkFoundationsBibliographyKeys, linkFoundationsProofInputs, linkFoundationsStacksCitations, linkFoundationsTagCitations, restoreFoundationsNumberedLinks} from './foundations-reading-editor.mjs';
import {bindActiveReadingLocators, foundationsReadingLocations, restoreActiveInheritedProofs, restoreChapterEightBoundaryArgument, restorePrintedSectionLevels} from './foundations-reading-locations.mjs';
import {closureGroup, coverageGroups, groupLabels, registerFoundationsTags, statusLabels, tagRoute} from './foundations-tag-register.mjs';
import {contentsRoute, coverageRoute, escape, foundationsFeedback, foundationsPdfLink, foundationsSearchForm, foundationsShell, guideRoute, link, project, searchRoute} from './foundations-layout.mjs';
import {foundationsGuide, shortStatus} from './foundations-guide.mjs';

export const nativeReaderRoute = project + 'reader/';
const chapterCoverageRoute = chapter => coverageRoute+'chapters/'+chapter.slug+'/';
const proofTagsRoute = project + 'proof-tags/';
const heading = (number, title) => [number, title].filter(Boolean).join(' · ');
const unsafeMarkup = /<(?:script|iframe|object|embed|style|form)\b|<[^>]*\son[a-z]+\s*=|(?:href|src)="(?:javascript|data):/i;
const privateMaterial = /(?:\/workspace\/|\/home\/agent\/|[A-Z]:\\Users\\|libfile_|private_library_readback|BEGIN [A-Z ]*PRIVATE KEY)/i;
const tagId = /^NAG-\d{6}$/;
const entities = {amp:'&',lt:'<',gt:'>',quot:'"','#x27':"'",'#39':"'"};
const mathStyles = '<link rel="stylesheet" href="/assets/katex.min.css">';
const complexMath = /mathvariant="(?!normal")|<(?:mfrac|msqrt|mroot|mtable|mover|munder|munderover|mphantom|mpadded|mstyle)\b/;
const chapterSlug = route => route.startsWith(project + 'chapters/') ? route.split('/').at(-2) : null;
const isMiddleChapter = number => /^(?:[7-9]|1[0-4])$/.test(number);
const isLateChapter = number => /^(?:1[5-9]|2[0-4]|[A-I])$/.test(number);
const usesExactPendingBookmarks = number => isMiddleChapter(number) || isLateChapter(number);
const gapLabel = 'Open at full scope';
const divisorSectionId = 'ii:PL';
const chapterEightRoute = project + 'chapters/8/';
const authorLabelAnchor = label => 'label-'+Buffer.from(label).toString('hex');
const chapterTenRoute = project + 'chapters/10/';
// The assumptions opening §4.41 also apply in §4.42 (seal 1174 p. 754).
const splitModelContext='011:340';
const splitModelContextId='split-nodal-model-assumptions';
const splitModelStatements=new Set(['011:341','011:343','011:349']);
// Seal 1174 p. 1349, after Theorem 11.20.4.
const wideInlineMath = new Map([
  [project+'chapters/11/',[String.raw`G_{j+1}+2\eta_{j+1}\leq u_{j+1}+3\eta_{j+1}\leq u_j+\eta_j\leq G_j+2\eta_j`,'Decreasing sequence inequality']],
  [project+'chapters/23/',['I(a)+E(a,c)=I(a)+E(a,b)+E(b,c)=I(b)+E(b,c)','Finite-energy reference identity']],
]);
// Exact inline expressions that would otherwise widen the chapter at 320px.
const scrollableInlineMath = new Map([
  ['1',new Map([
    ["\\Gamma_K^{\\mathrm{div}}=\\{t>0:t^n\\in|K^\\times|\\text{ for some }n\\geq 1\\}","Divisible value group formula"],
  ])],
  ['10',new Map([
    ["\\rho_j\\mathrm d'\\mathrm d''\\eta,\\ d'\\rho_j\\wedge d''\\eta,\\\n-d''\\rho_j\\wedge d'\\eta,\\ \\mathrm d'\\mathrm d''\\rho_j\\wedge\\eta","Differentiated terms in the localization argument"],
  ])],
  ['11',new Map([
    ["(p_1,p_2,p_t,q_l,q_r)=(m/N,(m+1)/N,0,1,0)","Local coordinates at the marked points"],
  ])],
  ['21',new Map([
    ["(p+q-1+n-n',p+q-1+n-n')","Bidegree of the product"],
  ])],
  ['23',new Map([
    ["P(z_0+h)/P(z_0)=1+c h^k+O(|h|^{k+1})","Local expansion of the polynomial quotient"],
  ])],
  ['3',new Map([
    ["F[b]\\otimes_F H=H[Z]/(Z^e+a_1Z^{e-1}+\\cdots+a_e)","Polynomial presentation after scalar extension"],
  ])],
  ['4',new Map([
    ["\\max(d(x,A),d(x,B))=d/2+d(x,c)>d/2","Distance comparison"],
  ])],
  ['5',new Map([
    ["A_0=O\\langle X_0,\\ldots,X_r,T_1,\\ldots,T_q\\rangle/\n(X_0\\cdots X_r-a)","Standard chart presentation"],
  ])],
  ['appendix-c',new Map([
    ["\\alpha=s_d A\\,d'y_1\\wedge\\cdots\\wedge d'y_d\n\\wedge d''y_1\\wedge\\cdots\\wedge d''y_d","Top-degree form in coordinates"],
    ["S/(f_1,\\ldots,f_{i-1})S\\simeq\n(R/(f_1,\\ldots,f_{i-1}))^n","Quotient module isomorphism"],
  ])],
]);
const inlineMathScroller = (math, label) => '<span class="book-equation book-inline-equation" role="group" aria-label="'+escape(label)+'" tabindex="0">'+math+'</span>';
// The sealed PDF prints these section numbers at physical pages 225, 448 and 905.
const earlierSectionNumbers = new Map([
  [project+'chapters/2/#fnd:strictggsection','2.27'],
  [project+'chapters/2/#fnd:etaleresiduereconstruction','2.54'],
  [project+'chapters/5/#the-faces-of-an-étalesemistable-chart','5.24'],
]);
const compactPartitionScope = project+'editions/sealed-1097/r/NAG-002428/#compact_partition_only';
const compactPartitionProofLink = link(compactPartitionScope,'Accepted compact-partition proof');
const compactPartitionManuscriptTag = 'NAG-900497';
const appendixPrintedStatements = new Map([
  [compactPartitionManuscriptTag,{chapter:'039',index:536,kind:'Theorem',number:'C.1.60',
    label:'v037:forms:compactpartition'}], // Printed on seal 1174 p. 1867, with no named PDF destination.
  ['NAG-002610',{chapter:'039',index:484,kind:'Theorem',number:'C.1.53',label:'cand:f5tame:charactercriterion',
    destination:'foundations.nag-002610.recovered-proof',page:1859}],
  ['NAG-002648',{chapter:'039',index:663,kind:'Theorem',number:'C.1.78',label:'cand:f5res:residualidentity',
    destination:'foundations.nag002648.original',page:1896}],
  ['NAG-003116',{chapter:'039',index:823,kind:'Proposition',number:'C.1.102',label:'f9sc:signed',
    destination:'foundations.nag003116.original',page:1931}],
  ['NAG-003210',{chapter:'039',index:865,kind:'Example',number:'C.1.110',label:'f9be:inseparable',
    destination:'foundations.nag003210.original',page:1941}],
  ['NAG-003112',{chapter:'045',index:342,kind:'Theorem',number:'I.2.10',label:'f9sc:refined',
    destination:'foundations.nag-003112.original',page:2146}],
]);
const finalTopologyTag = 'NAG-002473';
const coherentTensorManuscriptTag = 'NAG-900506';
const selectedProofInputs = new Map([
  [finalTopologyTag,compactPartitionProofLink],
  [coherentTensorManuscriptTag,link(project+'editions/sealed-1097/r/NAG-002525/#coherent_tensor_projection',
    'Accepted archive proof of the coherent tensor scope')],
]);
// Only the numbered manuscript prerequisites cited from the Chapter 10 pilot.
const signedMeasureTag = 'NAG-002970';
const signedMeasureInputLinks = new Map([
  ['002425',tagRoute('NAG-002425')],
  ['002427',tagRoute('NAG-002427')],
  ['002428',compactPartitionScope],
]);
const boundaryArgumentTag = 'NAG-900054';
// The heading and theorem number are printed on seal 1174 p. 1137.
const boundaryTheoremNumber = '8.4.2';
const boundaryTheoremTitle = 'Theorem '+boundaryTheoremNumber;
const sourceStatementNumbers = new Map([
  ['015:6',['Definition','7.1.2']], ['015:8',['Definition','7.1.3']], // Seal 1174 p. 1114
  ['016:57',['Theorem',boundaryTheoremNumber]],
  ...Array.from(appendixPrintedStatements.values(),({chapter,index,kind,number})=>[chapter+':'+index,[kind,number]]),
]);
function restoreSourceStatementNumber(html, key, numbers = sourceStatementNumbers) {
  const reference=numbers.get(key);
  if (!reference) return html;
  const [kind,number,exposedLabel]=reference;
  const heading='<strong>'+kind+'.</strong>';
  const printed='<strong>'+kind+' '+number+'.</strong>';
  const numbered=html.replace(heading+'.',printed).replace(heading,printed);
  return exposedLabel ? numbered.replace(exposedLabel,'<em>') : numbered;
}
// These Chapter 8 statements already have permanent locations in the sealed registry.
const chapterEightPublishedTags = ['NAG-002472',finalTopologyTag,'NAG-002476',signedMeasureTag,'NAG-003086','NAG-003090'];
const chapterTenCitedStatements = new Set([signedMeasureTag,'NAG-900030','NAG-900098','NAG-900099','NAG-900100','NAG-900286']);
// These early Tag-to-chapter jumps can place the status above a wrapped heading.
const earlyOpenStatusBookmarks = new Set(['NAG-900007','NAG-900009','NAG-900034']);
const lateStatementBookmarks = new Set([
  compactPartitionManuscriptTag,coherentTensorManuscriptTag,'NAG-900323','NAG-900397','NAG-900461',
]);
// Selected neighbouring blocks carry hypotheses, definitions, or limits of imported statements.
const statementContexts = new Map([
  ['011:49',{before:[48]}], // 4.7.1: the function and its residue at the type II point
  ['012:14',{before:[13],after:[15,16]}], // 5.1.3: set-theoretic tropicalization and the lifting direction
  ['012:96',{before:[95],after:[97,98]}], // 5.4.5: displacement data and the balancing requirement
  ['013:26',{before:[25],after:[27]}], // 6.1.3: strict semistable pair and the scope of faithfulness
  ['013:147',{before:[146],after:[149]}], // 6.12.1: the fixed category and its limits
  ['015:10',{before:[8,9]}], ['015:13',{before:[6]}], // 7.1: the differential and involution conventions
  ['015:20',{before:[18,19]}], ['015:24',{before:[18,19]}], // 7.2: pointwise positivity and duality
  ['015:28',{before:[27]}], ['015:30',{before:[27]}], // 7.3: fixed comparison form
  ['015:37',{before:[36]}], ['015:39',{before:[36]}], // 7.4: exterior coordinates and matrix
  ['015:55',{before:[54]}], ['015:57',{before:[54,55,56]}], // 7.6: the two radial operators
  ['015:75',{before:[73,74]}], // 7.8.1: ambient representatives on a finite fan
  ['016:201',{before:[199,200],after:[202]}], // 8.15.3: ordinary supports and the two presentation families
  ['016:203',{before:[199,202]}], // 8.15.4: the scope of the final topologies
  ['016:205',{after:[207]}], // 8.15.5: the available direction on a fixed polyhedral image
  ['016:227',{before:[226]}], ['016:230',{before:[226,229]}], // 8.15.12–13: actual generators and linearity
  ['017:42',{before:[41]}], // 9.3.3: coordinate trace measure
  ['017:76',{before:[75]}], ['017:79',{before:[75,78]}], // 9.7: distributional signs
  ['017:86',{before:[85]}], // 9.8.1: positivity and approximation
  ['017:95',{before:[94]}], ['017:98',{before:[97],after:[100]}], // 9.9: presentation relations
  ['017:126',{before:[125]}], ['017:128',{before:[125]}], // 9.13: real scalar trace
  ['018:67',{before:[66]}], ['018:73',{before:[72]}], ['018:85',{before:[84]}],
  ['020:29',{before:[21,23,24,25,26]}], ['020:34',{before:[21]}], // 11.2: analytic category and distinct approximation classes
  ['020:135',{before:[132]}], // 11.7.4: the chosen psh potential class
  ['020:185',{before:[180]}], // 11.8.9: the projective hypotheses of the metric construction
  ['020:416',{after:[418]}], // 11.13.6: current positivity and the strict R-PL comparison
  ['021:6',{before:[5]}], ['021:12',{before:[11]}], // 12.1.2 and 12.2.1: normalization and common refinement
  ['022:13',{before:[9,12]}], // 13.1.4: ordinary positive, closed inputs and the continuous sheaf
  ['022:81',{before:[79,80],after:[83]}], // 13.6.3: admitted class and curvature kernel
  ['022:88',{before:[87]}], ['022:90',{before:[87]}], // 13.7: real domain and positive closed current
  ['022:92',{after:[93]}], // 13.7.3: fixed tests and the limits of the estimate
  ['022:97',{before:[79,80,96]}], // 13.8.1: maxima in the admitted class
  ['022:106',{before:[105]}], ['022:108',{before:[104,105]}], // 13.9: exact closure assumptions
  ['022:119',{before:[118]}], ['022:121',{before:[118]}], // 13.11: proper map and bidimension
  ['022:136',{before:[135]}], ['022:144',{before:[135,143]}], // 13.13–14: fixed class and mass
  ['023:44',{before:[43]}], ['023:46',{before:[43],after:[48]}], // 14.3: ray model and harmonic test class
  ['023:59',{before:[58]}], // 14.4.1: affine manifold and chosen potentials
  ['025:16',{before:[15],after:[18]}], // 15.3.1: assumed geometric cycle theorem and intrinsic coefficient argument
  ['025:38',{before:[36,37],after:[39]}], ['025:41',{before:[39],after:[43]}], // 15.6.1–2
  ['025:74',{after:[76]}], // 15.8.3: exact references for the comparison requirement
  ['026:65',{before:[63,64],after:[67]}], // 16.4.1: boundaryless category and analytic detection
  ['028:71',{before:[69,70],after:[72]}], // 18.7: prescribed smooth zero-Hessian gluing inputs
  ['031:159',{before:[152,157],after:[160]}], // 20.12.3: connected graph and reduced model
  ['032:77',{after:[78,79]}], // 21.7: toric setting and both imported Gauss-section formulas
  ['032:132',{before:[121,131]}], // 21.12.3: positive simplex input in the source setting
  ['032:161',{before:[158,159,160],after:[163,164,165]}], // 21.15.1: totally degenerate setting and inputs
  ['035:23',{before:[22],after:[24,25]}], // 23.2.1: the imported field-extension calibration
  ['039:123',{before:[122],after:[151]}], // Global Stokes with interior compact support
  ['039:228',{after:[229]}], // C.1.17: exact external DVR characterization
  ['039:865',{before:[863],after:[866]}], // C.1.110: retained multiplicity and the supported-cycle computation
  ['045:156',{before:[154,155],after:[157]}], // Whole-fibre passage: interior on the actual charts
  ['043:36',{after:[37]}], // Seal 1174 p. 2013: direct inputs to the coherent tensor argument
  ['045:68',{after:[69]}], ['045:77',{before:[76],after:[78]}],
  ['045:131',{before:[126,129],after:[132]}], ['045:136',{before:[126,128],after:[137]}],
  ['045:140',{before:[129],after:[141]}], ['045:145',{before:[143],after:[146]}],
]);
const statementContextLinks = new Map([
  ['017:68',['Under these hypotheses',tagRoute('NAG-900076')]],
  ['020:29',['In the setting above',project+'chapters/11/#label-7365633a7073683235']],
  ['020:34',['the preceding category',project+'chapters/11/#label-7365633a7073683235']],
  ['020:135',['the preceding setting',tagRoute('NAG-900127')]],
  ['020:305',['the relative-support presentations above',tagRoute('NAG-900155')]],
  ['020:433',['as above',project+'chapters/11/#v19:missing_factor']],
  ['020:497',['the preceding smooth psh example',tagRoute('NAG-900194')]],
  ['022:13',['the preceding positivity and closedness assumptions',project+'chapters/13/#label-6465663a62742d6f7065726174696f6e']],
  ['022:92',['preceding theorem',tagRoute('NAG-900267')]],
  ['022:118',['scope just specified',project+'chapters/13/#new:generated_symmetry']],
  ['025:15',['GK17',project+'chapters/appendix-a/#ref-GK17']],
  ['025:18',['GK17',project+'chapters/appendix-a/#ref-GK17']],
  ['025:38',['Fulton–Sturmfels theorem',project+'chapters/appendix-a/#ref-FS']],
  ['025:41',['toric fan product',tagRoute('NAG-900287')]],
  ['026:72',['Mihatsch Example 2.45(3)',project+'chapters/appendix-a/#ref-Mih24']],
  ['032:78',['Gubler–Hertel’s classification',project+'chapters/appendix-a/#ref-GH']],
  ['035:24',['CLD25',project+'chapters/appendix-a/#ref-CLD25']],
  ['039:229',['Tag 00PD','https://stacks.math.columbia.edu/tag/00PD']],
]);
const proofNoteBibliography = new Map([
  ['011:50',['BPRStructure']], ['012:54',['GubGuide']],
  ['013:125',['GRPL']], ['013:148',['DT26','APW26']],
]);
const middleProofNoteBibliography = new Map([
  ['016',['Gubler16']], ['017',['GJR']],
  ['020',['BE21','BGM22','Bosch14','CLD12','FK17','GJR','GK19','GM','GRPL','GRPSH']],
  ['022',['CLD12','CLD25']],
]);
const proofNoteInputs = new Map([
  ['022:11',[['multiplier convergence','NAG-900257']]],
  ['022:14',[['one-step positivity','NAG-900258'],['multiplier convergence','NAG-900257']]],
]);
function linkProofNoteSources(html, key) {
  let note=linkFoundationsBibliographyKeys(html,
    proofNoteBibliography.get(key) ?? middleProofNoteBibliography.get(key.split(':',1)[0]));
  for (const [words,id] of proofNoteInputs.get(key) ?? []) {
    note=note.replace(words,link(tagRoute(id),words));
  }
  return note;
}

// These duplicate labels are conversion artifacts. See seal 1174 pp. 1995, 1998 and 2004.
const unprintedStatementLabels = new Map([
  ['042:50','lem:finiteflatlem:avoid'],
  ['042:65','fnd:nag002966:component-supportlem:avoid'],
  ['042:80','fnd:nag003099:regular-quotient-representativeslem:avoid'],
]);

function linkStatementContext(html, key) {
  const duplicate=unprintedStatementLabels.get(key);
  if (duplicate) html=html.replace('<em>'+duplicate,'<em>');
  if (key==='043:37') html=html.replace('<p>','<p><strong>Direct inputs</strong> ');
  if (key==='045:69') html=html.replace('9MIFollowerInputs','');
  if (key==='045:78') html=html.replace('9DSFollowerInputs','<strong>Direct inputs</strong> ');
  const reference=statementContextLinks.get(key);
  return reference ? html.replace(reference[0],link(reference[1],reference[0])) : html;
}

function statementContext(chapter, statementIndex, side) {
  const statementKey=chapter?.key+':'+statementIndex;
  return (statementContexts.get(statementKey)?.[side] ?? []).map(index => {
    // Keep the exact mathematical content while leaving chapter bookmarks on their source page.
    const original=chapter.blocks[index].replace(/\sid="[^"]+"/g,'');
    if (statementKey==='045:156' && index===155) return original.replace(/<([/]?)h5>/g,'<$1h2>');
    const key=chapter.key+':'+index;
    const block=restoreSourceStatementNumber(linkStatementContext(original,key),key);
    if (statementKey==='012:14' && index===16) {
      const phrase='The elementary argument above';
      return block.replace(phrase,link(chapter.route+'#cancellation-and-repeated-minima',phrase));
    }
    if (statementKey==='016:203' && index===202) {
      return block.replace('Both definitions',link(tagRoute('NAG-002472'),'Both definitions'));
    }
    if (statementKey==='031:159' && index===157) {
      const caption='The vertical divisor calculation';
      return block.replace(caption,link(tagRoute('NAG-900396'),caption));
    }
    return block;
  }).join('');
}

function linkChapterTenBibliography(html) {
  const cite = id => link(project+'chapters/appendix-a/#ref-'+id,id);
  return html.replace('support theorems in CLD25 have additional hypotheses.',
    'support theorems in '+cite('CLD25')+' have additional hypotheses.')
    .replace('affinoid boundary lemma of CLD12 supplies',
      'affinoid boundary lemma of '+cite('CLD12')+' supplies');
}
const divisorProofReaders = new Map([
  ['proof.',{title:'Finite localization lemma', destination:'section*.62', page:1207}],
  ['proof.-1',{title:'Logarithmic clipping on bounded ordinary tests', destination:'section*.65', page:1209}],
]);
// Literal digests printed in seal 1174, PDF pages 1211 and 1212.
const divisorSourceDigests = {
  'component':'34cea90b0be25d9bcbc565721888844e328453d64137a13c9bf79097495005af',
  'reviewed meromorphic':'b211ebdb9ad232a3f66d7e80feac6be31857f66a1415c91a034b599ca615aa2b',
};
// Seal 1174 p. 1211 links both context references to this appendix argument.
const divisorScalarComparison = {destination:'section*.398', page:2226};
// The printed F8NM line citations correspond to these paragraphs of the
// sealed proof exports. Keep the printed locator as the link text.
const divisorProofPassages = [
  ['proof lines 240–254 of F8NM','NAG-003103',1],
  ['as in lines 240–245','NAG-003103',1],
  ['lines 372–381','NAG-003106',4],
  ['lines 259–285','NAG-003103',2],
];
const divisorInputTags = new Map([
  ['F8CR-S','NAG-002966'],
  ['F8CR-N','NAG-002967'],
  ['F8CR-I','NAG-002976'],
  ['F8CR-C','NAG-002979'],
  ['F8CR-P','NAG-002981'],
  ['F8MG-O','NAG-002999'],
  ['F8MG-T','NAG-003002'],
]);
const suppressTags = (html, ids = []) => ids.reduce((text,id) => text.replaceAll(link(tagRoute(id), id), ''), html);

function restoreEquationCaptions(page, captions, readerPath) {
  if (!captions?.size) return page;
  return page.replace(/<span id="([^"]+)"><\/span>\s*<span class="book-equation">[\s\S]*?<\/annotation><\/semantics><\/math><\/span><\/span>/g,
    (formula,anchor) => {
      const readers=captions.get(anchor);
      if (!readers) return formula;
      const rowOrder=readers.length>1 ? ' role="group" aria-label="Equation numbers in row order"' : '';
      const links=readers.map(reader=>{
        const number='('+reader.number+')';
        return reader.destination ? printed(reader,number) : link(readerPath+'#page='+reader.page,number);
      }).join(', ');
      return formula+'<span class="book-note equation-number"'+rowOrder+'>'+links+'</span>';
    });
}

function typesetReadingMath(page, cache, route) {
  if (!page.includes('class="katex"')) return page;
  const tag = tagId.test(route.split('/').at(-2));
  const wideInline = wideInlineMath.get(route);
  const scrollable = scrollableInlineMath.get(chapterSlug(route));
  // A chapter can have thousands of short inline expressions. Keep its simple MathML
  // compact and typeset the displays, font variants and layout-sensitive formulas.
  const rendered = page.replace(/<span class="katex"><math([^>]*)>[\s\S]*?<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation><\/semantics><\/math><\/span>/g,
    (math, attrs, source) => {
      const displayMode = attrs.includes('display="block"');
      if (!displayMode && wideInline?.[0]===source) {
        return inlineMathScroller(math,wideInline[1]);
      }
      const tex = source.replace(/&(amp|lt|gt|quot|#x27|#39);/g, (all, name) => entities[name]);
      const label = displayMode ? undefined : scrollable?.get(tex.replaceAll('\r\n','\n'));
      const contain = rendered => label ? inlineMathScroller(rendered,label) : rendered;
      if (!tag && !displayMode && !complexMath.test(math)) return contain(math);
      const key = (displayMode ? 'display:' : 'inline:') + source;
      if (!cache.has(key)) {
        try {
          cache.set(key, katex.renderToString(tex, {output:'htmlAndMathml', displayMode, strict:'ignore', trust:false}));
        } catch (error) {
          throw new Error(`Cannot typeset Foundations formula on ${route}: ${error.message}`, {cause:error});
        }
      }
      return contain(cache.get(key));
    });
  return rendered.replace('</head>', mathStyles + '</head>');
}

export async function loadFoundationsNative(directory, pdfDigest) {
  const load = async name => JSON.parse(gunzipSync(await readFile(path.join(directory, name + '.json.gz'))));
  const index = await load('index');
  if (index.sourcePdfSha256 !== pdfDigest) throw Error('Foundations HTML edition source mismatch');
  const chapters = new Map();
  for (const entry of index.catalogue) {
    if (!/^\d{3}$/.test(entry.key) || !/^\/projects\/foundations\/(chapters|reader)\/[a-z0-9-]+\/$/.test(entry.route) || chapters.has(entry.route)) {
      throw Error('Invalid Foundations reading route');
    }
    const chapter = await load(entry.key);
    if (chapter.route !== entry.route || chapter.title !== entry.title || !Array.isArray(chapter.proofs) || chapter.blocks.some(block =>
      unsafeMarkup.test(block) || privateMaterial.test(block))) throw Error('Invalid Foundations chapter ' + entry.key);
    let previous = -1;
    for (const proof of chapter.proofs) {
      if (!Number.isInteger(proof.index) || !Number.isInteger(proof.end) || proof.index <= previous || proof.end < proof.index ||
        !chapter.blocks[proof.index] || proof.end >= chapter.blocks.length) throw Error('Invalid Foundations proof range ' + entry.key);
      previous=proof.end;
    }
    chapters.set(entry.route, chapter);
  }
  const byKey = new Map([...chapters.values()].map(chapter => [chapter.key, chapter]));
  if (Object.keys(index.tags).length !== 1159) throw Error('Incomplete Foundations HTML location inventory');
  for (const [id, record] of Object.entries(index.tags)) {
    const chapter = byKey.get(record.key);
    if (!tagId.test(id) || !chapter || !record.href.startsWith(chapter.route + '#') ||
      !chapter.blocks.some(block => block.includes(`id="${record.href.split('#')[1]}"`)) ||
      [record.index, record.excerpt, record.proof].some(i => i != null && !chapter.blocks[i]) ||
      (record.proof != null && !chapter.proofs.some(proof=>proof.index===record.proof && proof.end===record.proofEnd))) {
      throw Error('Invalid Foundations HTML Tag ' + id);
    }
  }
  return {...index, chapters, byKey};
}

export function loadHistoricalStatements(release, bytes) {
  const {schema, editionManifestSha256, statements} = JSON.parse(bytes);
  if (schema !== 'foundations-historical-statements/v1' || editionManifestSha256 !== release.current.editionManifestSha256) {
    throw Error('Historical web statements are not bound to the Foundations edition');
  }
  const {tags} = foundationsReadingLocations(release.native);
  const expected = Object.keys(release.graph.gaps).filter(id => tags[id]?.index == null);
  if (Object.keys(statements).length !== expected.length || expected.some(id => !Object.hasOwn(statements,id))) {
    throw Error('Historical web statements do not match the gaps without a manuscript statement');
  }
  for (const [id, {sourceSha256, html}] of Object.entries(statements)) {
    const archived = release.contents.get(`r/${id}/index.html`)?.toString('utf8');
    if (!release.graph.gaps[id] || !/^[a-f0-9]{64}$/.test(sourceSha256) ||
      !archived?.includes(`<summary>Historical statement · exact TeX</summary><pre data-sha256="${sourceSha256}">`) ||
      !html?.trim() || unsafeMarkup.test(html) || privateMaterial.test(html)) {
      throw Error('Historical statement binding or HTML is invalid for ' + id);
    }
  }
  return statements;
}

const shell = (route,title,body,extra = '',layout = '',canonical = route) => foundationsShell(route,title,body,{extra,layout,canonical});

function crumb(links) {
  return '<nav class="book-crumb" aria-label="Breadcrumb"><ol>' + links.map(([route,title]) =>
    '<li>' + (route ? link(route,title) : '<span aria-current="page">'+escape(title)+'</span>') + '</li>').join('') + '</ol></nav>';
}

const plural = (count, singular, pluralForm = singular+'s') => `${count} ${count === 1 ? singular : pluralForm}`;
function chapterCount(entry, detailed = false) {
  if (!entry) return '';
  const coverage = chapterCoverageRoute(entry);
  const counts = [link(coverage,plural(entry.tags.length,'NAG Tag'))];
  if (!detailed) return `<span class="chapter-open-count">${counts[0]}</span>`;
  const open = entry.tagCounts.open;
  if (open) counts.push(link(coverage+'#tags-open',plural(open,'open Tag')));
  if (entry.tagCounts.conditional) counts.push(link(coverage+'#tags-conditional',plural(entry.tagCounts.conditional,'conditional Tag')));
  if (entry.tagCounts.comparison) counts.push(link(coverage+'#tags-comparison',plural(entry.tagCounts.comparison,'comparison Tag')));
  return `<span class="chapter-open-count${open ? ' has-open' : ''}">${counts.join(' · ')}</span>`;
}

function bookContents(native, route, coverage, pdf, reading) {
  const seen = new Set();
  let groups = [{title:'Front matter', items:[]}];
  for (const entry of native.catalogue) {
    if (entry.route.endsWith('/reader/title/')) continue;
    if (entry.route.includes('/part-')) {
      groups.push({title:entry.title, items:[], note:entry.route});
      continue;
    }
    if (entry.number === 'A') groups.push({title:'Appendices', items:[]});
    if (seen.has(entry.route)) throw Error('Repeated Foundations reading route');
    seen.add(entry.route);
    groups.at(-1).items.push(entry);
  }
  groups.push({title:'Supplement and ledger records', items:[...coverage.chapters.values()]
    .filter(chapter => !chapter.native).map(chapter => ({...chapter, sections:[]}))});
  const body = groups.map(({title,items,note}, i) => `<section class="contents-group" aria-labelledby="part-${i}" id="group-${i}">
    <div class="contents-group-title"><h2 id="part-${i}">${escape(title)}</h2>${note ? link(note,'Part overview') : ''}</div>
    <ul class="book-chapters">${items.map(entry => `<li><div class="book-chapter-entry">${link(entry.route,heading(entry.number,entry.title))}${chapterCount(coverage.chapters.get(chapterSlug(entry.route)))}</div>
      ${chapterSections(entry,reading).length ? `<details><summary>Sections</summary><ul>${chapterSections(entry,reading).map(section =>
        `<li>${link(entry.route+'#'+section.id,heading(section.number,section.title))}</li>`).join('')}</ul></details>` : ''}</li>`).join('')}</ul></section>`).join('');
  const jumps = `<aside class="book-sidebar"><details data-desktop-open><summary>Parts</summary><nav aria-label="Parts"><ul>${groups.map(({title},i)=>`<li>${link('#group-'+i,title)}</li>`).join('')}
    <li>${link('/projects/foundations/chapters/appendix-a/#bibliography','Bibliography')}</li>
    <li>${link('/projects/foundations/chapters/appendix-a/#subject-index','Subject index')}</li></ul></nav></details></aside>`;
  const script = route === nativeReaderRoute ? '<script type="module" src="/assets/foundations-native-reader.js"></script>' : '';
  const fallback = route === nativeReaderRoute ? '<noscript><p class="book-note">Saved reading links use JavaScript. Choose a chapter below or '+
    link(coverageRoute,'browse the Tag index')+'.</p></noscript>' : '';
  return shell(route,'Table of contents',`<header class="page-intro"><h1>Table of contents</h1>${foundationsPdfLink(pdf)}</header>
    <p id="reader-location" hidden></p>${fallback}<div class="book-layout has-sidebar">${jumps}<div class="contents-text">${body}</div></div>`,script,'contents-page',contentsRoute);
}

function partChapterOutline(chapter, index, catalogue, coverage) {
  if (!chapter.route.includes('/part-')) return '';
  const entries = [];
  for (const entry of catalogue.slice(index+1)) {
    if (!/^\d+$/.test(entry.number ?? '')) break;
    entries.push(`<li><div class="book-chapter-entry">${link(entry.route,heading(entry.number,entry.title))}${chapterCount(coverage.chapters.get(chapterSlug(entry.route)),true)}</div></li>`);
  }
  return `<section class="part-chapter-coverage"><h2>Chapters and proof coverage</h2><ul class="book-chapters">${entries.join('')}</ul></section>`;
}

function chapterSections(chapter, reading) {
  if (!reading) return chapter.sections;
  const sections = chapter.sections.map(section => {
    if (section.number) return section;
    const number = reading.headingNumbers.get(chapter.route+'#'+section.id);
    return number ? {...section,number} : section;
  });
  const additional=additionalChapterSection(reading,chapter.route);
  return additional ? [...sections,{...additional,level:2}] : sections;
}

function newChapterSection(reading, route) {
  const section=additionalChapterSection(reading,route);
  return section ? `<section id="${section.id}"><h2>${escape(section.title)}</h2>
    ${reading.additional.get(route).map(record=>currentChapterRecord(record)).join('')}</section>` : '';
}

function updateDivisorContext(html) {
  const comparison=printed(divisorScalarComparison,'finite-refinement scalar comparison');
  let context = html.replace('Their transitive prerequisite cone is still under review. '+
    'References to the detached quotient comparison and its two formulae are printed by their permanent identifiers.',
    'The actual reduced-component inputs are bound in the '+comparison+
    '. The quotient comparison and its two formulae are linked at their use sites.')
    .replace('The separate nonauthor interface-fit receipt discharges those premises on the actual pure affinoids and reduced components used there. '+
      'These are reviewed applications, still separate from canonical admission.',
    'The '+comparison+' checks these premises on the actual pure affinoids and reduced components.');
  for (const [caption,id,paragraph] of divisorProofPassages) {
    context=context.replace(caption,link(tagRoute(id)+'#proof-paragraph-'+paragraph,caption));
  }
  if (!context.includes('The exact component source has SHA-256')) return context;
  return context.replace('F8CR-N/I','F8CR-N and F8CR-I').replace('F8MG-O/T','F8MG-O and F8MG-T')
    .replace(/\b(?:F8CR-[SNICP]|F8MG-[OT])\b/g,name=>link(tagRoute(divisorInputTags.get(name)),name));
}

const pendingProofStates = new Set(['pending']);
const lateProofStates = new Set(['pending','conditional']);

function proofTagLinks(tags, states) {
  return tags.map(tag => {
    const proof=link(tag.link+'#foundations-exact-proof',tag.id);
    return states?.has(tag.status)
      ? proof+' <small class="book-tag-status">'+escape(statusLabels[tag.status])+'</small>' : proof;
  }).join(' ');
}

function bindChapterIntroductions(entries, native, registry, scopes) {
  const introductions = new Map();
  const expected = [...native.chapters.keys()].filter(route=>chapterSlug(route));
  if (Object.keys(entries).length!==expected.length || expected.some(route=>!Object.hasOwn(entries,chapterSlug(route)))) {
    throw Error('Incomplete Foundations chapter introductions');
  }
  for (const [slug, parts] of Object.entries(entries)) {
    const route = project+'chapters/'+slug+'/';
    const chapter = native.chapters.get(route);
    if (!chapter || !Array.isArray(parts) || !parts.some(part=>typeof part==='object' && part?.tag)) {
      throw Error('Unbound Foundations chapter introduction '+slug);
    }
    const body = parts.map(part=>{
      if (typeof part==='string') return escape(part);
      const {tag, status, text, scope, chapter:sourceSlug=slug} = part;
      const row = registry.tags.get(tag);
      const source = native.chapters.get(project+'chapters/'+sourceSlug+'/');
      if (!source || !row || row.status!==status || registry.tagLocations[tag]?.key!==source.key || !text?.trim()) {
        throw Error('Unbound Foundations chapter introduction link '+slug+' / '+tag);
      }
      if (!scope) return link(row.link,text);
      const clause = scopes[scope];
      const href = clause?.id===tag && selectedScopeHref(scope,clause);
      if (!href) throw Error('Unbound Foundations chapter introduction scope '+slug+' / '+scope);
      return link(href,text);
    }).join('');
    introductions.set(route,'<p class="page-lead chapter-introduction">'+body+'</p>');
  }
  return introductions;
}

function chapterPage(chapter, catalogue, proofs, dependencies, coverage, locations, registry, reading) {
  const title = heading(chapter.number, chapter.title);
  const index = catalogue.findIndex(entry => entry.key===chapter.key);
  const nav = `<nav class="book-adjacent" aria-label="Chapter navigation">${[-1,1].map(offset => {
    const entry = catalogue[index+offset];
    return entry ? link(entry.route, `${offset<0 ? '← ' : ''}${heading(entry.number,entry.title)}${offset>0 ? ' →' : ''}`) : '';
  }).join('')}</nav>`;
  const trail = crumb([[project,'Foundations'],[contentsRoute,'Table of contents'],[null,title]]);
  const coverageEntry = coverage.chapters.get(chapterSlug(chapter.route));
  const count = chapterCount(coverageEntry);
  const part = partChapterOutline(chapter,index,catalogue,coverage);
  const readerSections=chapterSections(chapter,reading);
  const sections = readerSections.filter(section=>section.level===2);
  const restoredHeadings = new Map(readerSections.filter(section=>reading?.headingNumbers.has(chapter.route+'#'+section.id))
    .map(section=>[section.index,section]));
  const sectionMenu = sections.length ? `<details data-desktop-open><summary>In this chapter</summary><nav aria-label="Chapter sections"><ul>${sections.map(section =>
    `<li>${link('#'+section.id,heading(section.number,section.title))}</li>`).join('')}</ul></nav></details>` : '';
  const divisorIndex = sections.findIndex(section=>section.id===divisorSectionId);
  const divisorStart = sections[divisorIndex]?.index;
  const divisorEnd = sections[divisorIndex+1]?.index ?? chapter.blocks.length;
  // Seal 1174 p. 1107 leaves this specific theorem open after the proof of 6.10.1.
  const purityNote = reading && chapter.route===project+'chapters/6/' ? coverage.sourceNotes.get(chapter.key+':125') : null;
  const currentProofs = (reading?.byChapter.get(chapter.route) ?? []).filter(record=>!record.custody);
  const nativeProofs = [...proofs.values()].filter(proof=>!reading?.superseded.has(chapter.key+':'+proof.index));
  const earlyReader = reading && /^[1-6]$/.test(chapter.number);
  const middleReader = reading && isMiddleChapter(chapter.number);
  const lateReader = reading && isLateChapter(chapter.number);
  const sectionAliases=new Set(middleReader ? sections.filter(section=>{
    const id='label-'+Buffer.from(section.id).toString('hex');
    return section.number && chapter.blocks[section.index+1]?.startsWith('<div id="'+id+'">');
  }).map(section=>section.index) : []);
  const proofStates = lateReader ? lateProofStates : earlyReader || middleReader ? pendingProofStates : null;
  const chapterProofTagLinks = proof => proofStates ? proofTagLinks(proof.tags,proofStates) : proof.tagLinks;
  const indexEntries = nativeProofs.map(proof=>{
    const sourceLink=reading && proof.reader ? ' · '+printed(proof.reader,proof.title+' in the English PDF') : '';
    return `<li>${link('#'+proof.anchor,proof.title)} ${chapterProofTagLinks(proof)}${sourceLink}</li>`;
  })
    .concat(currentProofs.map(record=>`<li>${link(currentProofHref(record),currentProofTitle(record))} ${link(tagRoute(record.id),record.id)}</li>`)).join('');
  const proofIndex = indexEntries ? `<details class="chapter-proof-index" id="chapter-proofs"><summary>Proofs in this chapter (${nativeProofs.length+currentProofs.length})</summary><ol>${indexEntries}</ol></details>` : '<span id="chapter-proofs"></span>';
  const menu = sectionMenu || indexEntries ? `<aside class="book-sidebar">${sectionMenu}${proofIndex}</aside>` : '';
  const publishedTags = new Map();
  if (reading) {
    const ids=chapter.route===chapterEightRoute ? chapterEightPublishedTags :
      [...reading.appendixPrintedStatements].filter(([,entry])=>entry.destination && entry.chapter===chapter.key).map(([id])=>id);
    for (const id of ids) {
      const location=registry.tagLocations[id];
      if (location?.key!==chapter.key || location.index==null || publishedTags.has(location.index)) {
        throw Error('Unbound published statement Tag '+id);
      }
      publishedTags.set(location.index,id);
    }
  }
  const body = chapter.blocks.map((block,i)=> {
    const key = `${chapter.key}:${i}`;
    const proof=proofs.get(i);
    const replacement=reading?.replacements.get(key);
    if (replacement && !replacement.custody) return currentChapterRecord(replacement,block,true);
    if (reading?.superseded.has(key)) {
      const reveal = chapter.route===chapterTenRoute ? ' data-reveal-proof-bookmark' : '';
      const oldAnchor=proof ? `<div class="chapter-proof-links" id="${proof.anchor}" role="group" aria-label="Proof links"${reveal}>
        ${link(currentProofHref(reading.superseded.get(key)),'Current proof')} ${proof.tagLinks}</div>` : '';
      return oldAnchor+historicalReadingAnchors(block);
    }
    const note=coverage.sourceNotes.get(key);
    const review=coverage.reviewMarkers.get(key);
    const policy=dependencies.policyByBlock.get(key);
    const locator=policy?.anchor.split('#')[1];
    const notice=policy ? `<div id="${escape(locator)}">${sourcePolicyNotice(policy)}</div>` : '';
    const publishedId = publishedTags.get(i);
    const id = registry.byBlock.get(key) ?? locations.restored.get(key) ?? publishedId;
    const sourceId = registry.sourceAliases.get(key);
    const updatedNote=reading?.update.data.records[sourceId];
    if ((note || review) && updatedNote) {
      const oldId=(note ?? review).href.split('#')[1];
      return `<p class="book-note" id="${escape(oldId)}">${link(tagRoute(sourceId),'Current scope and proof of '+sourceId)}</p>`;
    }
    const result = registry.tags.get(id);
    const manuscript = registry.records.get(id);
    const earlyBookmark = earlyReader && (earlyOpenStatusBookmarks.has(id) || result?.status==='pending');
    const bookmarkLocation = publishedId && id===publishedId ? registry.tagLocations[id] : manuscript;
    const printedStatement = reading?.appendixPrintedStatements.get(id);
    const fragment = printedStatement ? authorLabelAnchor(printedStatement.label) : bookmarkLocation?.href.split('#')[1];
    // Policy notes own their old locators. Only focus the status of the source statement.
    const citedBookmark = chapterTenCitedStatements.has(id);
    const numberedBookmark = (middleReader || lateStatementBookmarks.has(id) || printedStatement) && !citedBookmark && !locator &&
      fragment?.startsWith('label-') && block.startsWith('<div ') && block.includes(`id="${fragment}"`);
    const statementAnchor = '<span id="'+fragment+'"></span>';
    const lateStatus = result?.status==='open' || result?.status==='conditional' || result?.status==='pending';
    const lateScopeBookmark = lateReader && lateStatus && !numberedBookmark && !citedBookmark &&
      fragment?.startsWith('label-') && locator!==fragment && block.startsWith('<div ') && block.includes(statementAnchor);
    const statusBookmark = reading && (earlyBookmark || numberedBookmark || citedBookmark || lateScopeBookmark) ? fragment : null;
    const bookmarkStatus = statusBookmark ? ' data-statement-bookmark="'+escape(statusBookmark)+'" tabindex="-1"' : '';
    const offsetClass = earlyBookmark ? ' early-status-bookmark' : reading && numberedBookmark ? ' midchapter-status-bookmark' : '';
    const resultLink = result ? `<p class="book-result-link${offsetClass}"${manuscript?.generatedAnchor ? ` id="${manuscript.generatedAnchor}"` : ''}${bookmarkStatus}>${link(result.link,result.id)}
      <small class="book-tag-status${result.status === 'open' ? ' book-source-open' : ''}">${escape(statusLabels[result.status])}</small></p>` : '';
    const open = coverage.byBlock.get(key) ?? [];
    const gapMarks = open.length ? `<p class="book-gap-marks">${open.map(gap => link(gap.route+'#open-status', gap.id+' · '+gapLabel)).join(' ')}</p>` : '';
    const selectedInputs = reading && proof ? proof.tags.map(tag=>selectedProofInputs.get(tag.id)).filter(Boolean) : [];
    const proofLink = !proof ? '' : proof.tagLinks ? `<div class="chapter-proof-links" id="${proof.anchor}" role="group" aria-label="Tag links for this proof">${[chapterProofTagLinks(proof),...selectedInputs].join(' ')}</div>` : `<span id="${proof.anchor}"></span>`;
    block = suppressTags(block, locations.suppressed.get(key));
    let sourceBlock = locator ? block.replace(` id="${locator}"`,'') : block;
    if (lateScopeBookmark) {
      sourceBlock=sourceBlock.replace(statementAnchor,'<span id="'+fragment+'" data-late-scope-bookmark></span>');
    }
    if (reading) {
      if (key===splitModelContext) {
        const digest=createHash('sha256').update(chapter.blocks[i]).digest('hex');
        if (digest!=='02e61fa84ae9fd17e72f27c9ed16f504d140e537bae783b2b9988bddc237cedf' || !sourceBlock.startsWith('<p>')) {
          throw Error('Split nodal model assumptions no longer match the sealed source');
        }
        sourceBlock='<p id="'+splitModelContextId+'">'+sourceBlock.slice(3);
      }
      sourceBlock=restoreSourceStatementNumber(linkStatementContext(sourceBlock,key),key,reading.statementNumbers);
      sourceBlock=editProofCitations(sourceBlock,reading.proofCitations.get(key));
      const printedAnchor=reading.appendixPassageAnchors.get(key);
      if (printedAnchor) {
        sourceBlock=sourceBlock.replace(/^<div class="definition">/,opening=>opening.slice(0,-1)+' id="'+printedAnchor+'">');
      }
      if (key==='045:179') {
        sourceBlock=sourceBlock.replace('<span class="book-equation">','<span class="book-equation" role="group" aria-label="Orientation sign formula" tabindex="0">');
      }
    }
    if (reading && divisorStart!=null && i>=divisorStart && i<divisorEnd) {
      sourceBlock=linkFoundationsTagCitations(sourceBlock,registry.tags)
        .replace('The independently reviewed finite cutoff lemma supplies',
          'The independently reviewed '+link('#finite-localization-lemma.','finite cutoff lemma')+' supplies')
        .replace(/(The exact (component|reviewed meromorphic) source has SHA-256<\/p>\s*<div class="center">\s*<p>)\.<\/p>/g,
          (_,opening,source)=>opening+'<code>'+divisorSourceDigests[source]+'</code>.</p>');
      sourceBlock=updateDivisorContext(sourceBlock);
    }
    if (purityNote && i===120) {
      sourceBlock=sourceBlock.replace('The proof is useful beyond the dimension theorem:',
        'The proof strategy is useful beyond the dimension theorem:');
    }
    if (purityNote && i===128) {
      sourceBlock=sourceBlock.replace('The proof above expands the finite-projection and Shilov-boundary argument; analytic dimension,',
        'For the finite-projection and Shilov-boundary argument, see the cited references and the '+
        link('#'+purityNote.href.split('#')[1],'open proof obligation for Theorem 6.10.2')+'. Analytic dimension,');
    }
    const restored = reading && restoredHeadings.get(i);
    if (restored) {
      const id=escape(restored.id);
      const sourceLevel=restored.sourceLevel ?? restored.level;
      const opening='<h'+sourceLevel+(restored.sourceLevel ? ' class="unnumbered"' : '')+' id="'+id+'">';
      if (!sourceBlock.startsWith(opening)) throw Error('Missing exact numbered heading '+restored.id);
      const alias=reading.headingAliases.has(chapter.route+'#'+restored.id) ? ' data-numbered-heading' : '';
      const content=sourceBlock.slice(opening.length).replace('</h'+sourceLevel+'>','</h'+restored.level+'>');
      sourceBlock='<h'+restored.level+' id="'+id+'"'+alias+'>'+restored.number+' '+content;
    }
    if (sectionAliases.has(i)) {
      sourceBlock=sourceBlock.replace(/^<h2 id="[^"]+">/,opening=>opening.slice(0,-1)+' data-numbered-heading>');
    }
    if (reading && proof) {
      for (const tag of proof.tags) {
        sourceBlock=linkInheritedProofReferences(sourceBlock,tag.id,reading.update.data);
        if (tag.id===signedMeasureTag) sourceBlock=linkFoundationsProofInputs(sourceBlock,signedMeasureInputLinks);
      }
    }
    if (reading && chapter.route===project+'chapters/3/') {
      sourceBlock=linkFormalChapterReferences(sourceBlock,key,reading.update.data);
    }
    if (replacement?.custody) sourceBlock=currentChapterRecord(replacement,sourceBlock);
    const exportReceipt=reading?.readerOnly.get(id);
    if (exportReceipt) sourceBlock+=`<p class="book-note">${printed(exportReceipt.reader,exportReceipt.onWeb ?
      'Statement and proof in the English PDF' : 'Complete argument in the English PDF')}</p>`;
    const reviewLink = review ? `<p class="reviewed-proof-passage" id="${review.href.split('#')[1]}">${link(tagRoute(sourceId),sourceId+' · '+statusLabels[review.status])}</p>` : '';
    const wrapped = note ? `<div class="source-proof-note" id="${note.href.split('#')[1]}">${linkProofNoteSources(sourceBlock,key)}<p>${link(tagRoute(sourceId),sourceId+' · Proof status')}</p></div>` : sourceBlock;
    return notice+resultLink+gapMarks+reviewLink+proofLink+wrapped;
  }).join('');
  const reader=reading?.update.data.chapterReaders[chapterSlug(chapter.route)];
  const links=reader ? `<p class="page-actions">${printed(reader,'Chapter in the English PDF')}
    ${link(reading.update.fixed+'logic/chapters/'+chapterSlug(chapter.route)+'/','Proof map')}
    ${foundationsFeedback(chapter.route,reading.update.current.edition)}</p>` : '';
  return shell(chapter.route,title,`${trail}<header class="page-intro"><h1>${escape(title)}</h1>${reading?.introductions.get(chapter.route) ?? ''}${count ? `<p class="chapter-coverage">${count}</p>` : ''}${links}</header>${menu ? '' : proofIndex}
    <div class="book-layout${menu ? ' has-sidebar' : ''}">${menu}<article class="book-text" aria-label="${escape(chapter.title)}">${body}
    ${newChapterSection(reading,chapter.route)}</article></div>${part}${nav}`,'','reading-page');
}

function coveragePage(coverage, fixed, current) {
  const chapters = [...coverage.chapters.values()];
  const total = group => chapters.reduce((sum,chapter) => sum + chapter.tagCounts[group],0);
  const count = chapters.reduce((sum,chapter) => sum + chapter.tags.length,0);
  const cell = (count,group,label,href) => `<td data-count="${group}" data-label="${label}"${count ? '' : ' class="count-zero"'}>${href && count ? link(href,String(count)) : count}</td>`;
  const table = chapters.map(chapter => {
    const detail = chapterCoverageRoute(chapter);
    return `<tr id="chapter-${chapter.slug}" role="row"><th scope="row">${link(detail,chapter.title)}</th>
      ${cell(chapter.tags.length,'tags','Tags',detail)}${coverageGroups.map(group=>cell(chapter.tagCounts[group],group,groupLabels[group],detail+'#tags-'+group)).join('')}</tr>`;
  }).join('');
  const historical = chapters.filter(chapter=>chapter.gaps.length).map(chapter=>`<section id="gaps-${chapter.slug}">
    <h3>${escape(chapter.title)}</h3><ul class="coverage-list">${chapter.gaps.map(gap=>`<li id="open-${gap.id}">${link(gap.route,gap.id+' · '+gap.label)}</li>`).join('')}</ul></section>`).join('');
  const gapSummary=current ? 'Original-scope index' : 'Historical proof gaps';
  const gapDescription=current ? plural(coverage.gaps.size,'original claim')+' with an obstruction, a restriction or a remaining case.' :
    gapCount(coverage.gaps.size)+' from the fixed edition, including '+coverage.narrower+' with a narrower scope available.';
  return shell(coverageRoute,'Tag index',`<header class="page-intro"><h1>Tag index</h1>
    <p class="page-lead">Browse ${count.toLocaleString('en-US')} permanent Tags by chapter and proof status.</p>
    <p class="page-actions">${link(guideRoute+'#proof-statuses','What each status means')}</p></header>
    <section id="chapter-counts"><span id="manuscript-obligations"></span><h2 class="coverage-heading">By chapter</h2><table class="coverage-table" role="table" aria-label="Tags by chapter and proof status"><thead role="rowgroup"><tr role="row"><th scope="col">Chapter or supplement</th><th scope="col">Tags</th>${coverageGroups.map(group=>`<th scope="col">${groupLabels[group]}</th>`).join('')}</tr></thead>
    <tbody role="rowgroup">${table}</tbody><tfoot role="rowgroup"><tr role="row"><th scope="row">Total</th>${cell(count,'tags','Tags')}${coverageGroups.map(group=>cell(total(group),group,groupLabels[group])).join('')}</tr></tfoot></table></section>
    <details class="historical-register" id="historical-proof-gaps"><summary>${gapSummary}</summary><p>${gapDescription} ${link(fixed+'coverage/','Fixed-edition register')}</p>${historical}</details>`,'','coverage-page');
}

function chapterCoveragePage(chapter, current) {
  const route = chapterCoverageRoute(chapter);
  const trail = crumb([[coverageRoute,'Tag index'],[null,chapter.title]]);
  const groups = ['open','conditional','comparison','pending','closed','definition'];
  const scoped = new Set(['open','conditional','comparison']);
  const lists = groups.map(group=>{
    const rows = chapter.tags.filter(row=>closureGroup(row.status)===group);
    const title = groupLabels[group]+' ('+rows.length+')';
    const list = `<ul class="tag-register-list">${rows.map(row=>`<li data-tag-status="${row.status}"><a href="${row.link}"><span class="tag-id">${row.id}</span>${row.title!==row.id ? `<span>${escape(row.title)}</span>` : ''}</a>
      ${row.types.length ? `<small>${escape(row.types.join(' · '))}</small>` : ''}</li>`).join('')}</ul>`;
    if (!rows.length) return `<span id="tags-${group}"></span>`;
    return scoped.has(group) ? `<section id="tags-${group}"><h2>${title}</h2>${list}</section>` : `<details class="tag-coverage-list" id="tags-${group}"><summary>${title}</summary>${list}</details>`;
  }).join('');
  const readingLink=link(chapter.route,current && chapter.slug==='unlocated' ? 'Read the historical register' : 'Read the chapter');
  return shell(route,chapter.title+' · Tags',`${trail}<header class="page-intro"><h1>${escape(chapter.title)}</h1>
    <p id="tag-inventory" class="page-actions">${readingLink}<span>${plural(chapter.tags.length,'Tag')}</span></p></header>
    <nav class="page-links" aria-label="Tag status groups">${groups.filter(group=>chapter.tagCounts[group]).map(group=>link('#tags-'+group,`${groupLabels[group]} (${chapter.tagCounts[group]})`)).join('')}</nav>
    <span id="manuscript-findings"></span><span id="untagged-statements"></span>${lists}`,'','chapter-tags-page');
}

function searchPage() {
  return shell(searchRoute,'Search Foundations',`<header class="page-intro"><h1>Search Foundations</h1></header>
    ${foundationsSearchForm({formId:'site-search'})}<div id="search-results" class="foundation-search-results"></div>
    <noscript><p>Search uses JavaScript. ${link(coverageRoute,'Browse the Tag index')} to find statements and proofs.</p></noscript>`,
    '<meta name="robots" content="noindex,follow"><script defer src="/assets/foundations-search.js"></script>','search-page');
}
const gapDescriptions = new Map([
  ['Pinned English candidate. This sweep did not bind an independently signed whole proof and operative scope map for these exact spans.',
    'The edition records the statement as a candidate. A complete proof covering its full scope has not been verified.'],
  ['1041 component chain handoff already contains exact joined/follow-on blocks. 1049 now selects exact 002970; retain existing writer queue and proof order.',
    'The edition records a gap in the proof of the original statement.'],
]);
const gapDescription = step => gapDescriptions.get(step) ?? step;

function editProofCitations(html, citations) {
  if (!citations) return html;
  const {stacks,links}=citations;
  let edited=stacks.length ? linkFoundationsStacksCitations(html,stacks) : html;
  for (const [before,after] of links) edited=edited.replace(before,after);
  return edited;
}

function manuscriptArgument(chapter, start, end, citations) {
  const blocks=chapter.blocks.slice(start,end+1);
  if (citations) {
    for (const [index,block] of blocks.entries()) {
      blocks[index]=editProofCitations(block,citations.get(chapter.key+':'+(start+index)));
    }
  }
  return linkProofParagraphs(blocks.join(''));
}
function manuscriptArgumentBookmarks(chapter, start, end) {
  const argument=manuscriptArgument(chapter,start,end);
  const paragraphsAndItems=Array.from(argument.matchAll(/\bid="(proof-(?:paragraph|item)-\d+)"/g),match=>match[1]);
  return ['foundations-exact-proof',...paragraphsAndItems];
}

const fixedTextLabels = new Map([['NAG-002484','Example and argument'],['NAG-002856','Passage'],['NAG-003210','Example']]);

function tagPage(row, {record, chapter, fixed, gap, scopes, archivedProof, historical, proofLocation, policy, suppressed = [], manuscript, guide, currentEdition, reading, statementReader}) {
  const title = row.title;
  const trail = crumb([[chapter?.route ?? coverageRoute,chapter ? heading(chapter.number,chapter.title) : 'Tag index']]);
  const archive = fixed+'r/'+row.id+'/';
  const location = record ? link(record.href,'Read in chapter') : link(coverageRoute+(gap ? '#open-'+row.id : ''),'Find in Tag index');
  const textArgument=reading?.textArguments.get(row.id);
  let statement = '';
  let proof = '';
  if (record?.index != null) {
    // The statement and adjacent proof come from the same English source block as the chapter.
    // Remove their self-links because this page is already the Tag permalink.
    statement=linkStatementContext(suppressTags(chapter.blocks[record.index], [row.id, ...suppressed]),
      `${chapter.key}:${record.index}`);
    if (row.id===boundaryArgumentTag && currentEdition || reading?.appendixPrintedStatements.has(row.id)) {
      statement=restoreSourceStatementNumber(statement,`${chapter.key}:${record.index}`,reading?.statementNumbers);
    }
    if (record.inlineProof) statement = linkProofParagraphs(statement);
    else if (record.proof != null) {
      proof=manuscriptArgument(chapter,record.proof,record.proofEnd,reading?.proofCitations);
      if (row.id===signedMeasureTag) proof=linkFoundationsProofInputs(proof,signedMeasureInputLinks);
    }
    if (textArgument?.kind==='example') {
      statement=statement.replace('<div class="example">','<div class="example" id="foundations-exact-proof">');
    }
    if (record.companion) proof += `<p class="book-note">${link(record.companion,'Read the companion argument')}</p>`;
  } else if (historical) {
    statement = '<h2>Historical statement</h2>' + historical.html;
  } else {
    if (record?.excerpt != null) statement = chapter.blocks[record.excerpt];
    if (!textArgument) statement += `<p>${record ? 'This Tag identifies a passage in the book.' : 'Read the historical record for this Tag in the fixed edition.'}</p>`;
  }
  const gapNote = gap ? `<div id="open-status"><h3>Historical proof gap</h3><p>${escape(gapDescription(gap.step))}</p></div>` : '';
  const finding = row.finding;
  const proofEvidence = finding?.notes.map(note => `<li>${link(note.href, 'Chapter '+note.source.number+' note ('+note.kind+')')}</li>`).join('');
  const kinds = row.types.length ? `<dl class="tag-types"><dt>Problem types</dt><dd>${row.types.map(guide.typeLink).join(' · ')}</dd></dl>` : '';
  const evidence = finding ? `${finding.summary ? `<p>${escape(finding.summary)}</p>` : ''}
    ${finding.notes.map(note=>linkProofNoteSources(note.source.blocks[note.index].replace(/^<p><strong>Open proof obligation \(RC[23]\)\.<\/strong>\s*/, '<p>'),note.source.key+':'+note.index)).join('')}
    ${proofEvidence ? `<ul>${proofEvidence}</ul>` : `<p>${link(finding.href,'Read the source passage')}</p>`}` : '';
  const hasContext = Boolean(kinds || evidence || gap || policy);
  const statusDetails = hasContext ? `<aside class="tag-closure" id="closure"><h2>Proof notes</h2>${kinds}
    ${row.status === 'pending' ? `<p>${record?.proof != null ? 'A manuscript argument is available for review.' : 'The location or full scope of the argument remains to be verified.'}</p>` : ''}${evidence}${gapNote}${sourcePolicyNotice(policy)}</aside>` : '<span id="closure"></span>';
  const selected = scopes?.length ? `<details class="tag-scopes"><summary>Selected scopes (${scopes.length})</summary><ul>${scopes.map(scope=> {
    const fragment=scope.href.split('#')[1];
    return `<li id="${escape(fragment)}">${link(archive+'#'+fragment,scope.label)}</li>`;
  }).join('')}</ul></details>` : '';
  const includesProof = record?.inlineProof;
  const fixedText = currentEdition ? fixedTextLabels.get(row.id) : undefined;
  const fallbackAnchor=textArgument ? '' : ' id="foundations-exact-proof"';
  const sourceProof = archivedProof && record?.proof == null && !includesProof ? `<p class="book-note"${fallbackAnchor}>${link(archive+'#foundations-exact-proof',fixedText ? 'Selected '+fixedText.toLowerCase()+' in the fixed edition' : 'Selected proof in the fixed edition')}</p>` : '';
  const statementId = includesProof ? 'foundations-exact-proof' : 'tag-statement';
  const contextIndex=manuscript || currentEdition ? record?.index ?? (fixedText && record?.excerpt) : null;
  const contextBefore=statementContext(chapter,contextIndex,'before');
  const beforeStatement=textArgument?.kind==='passage'
    ? contextBefore.replace('<h2>','<h2 id="foundations-exact-proof">') : contextBefore;
  const afterStatement=statementContext(chapter,contextIndex,'after');
  const proofLabel = fixedText ?? (row.status === 'closed' ? 'Proof' : 'Argument in the manuscript');
  const hasArgument = record?.proof != null || includesProof || sourceProof;
  const selectedInput = currentEdition && selectedProofInputs.get(row.id);
  const fixedProof = record?.inheritedArgument && archivedProof ? link(archive+'#foundations-exact-proof','Selected proof in the fixed edition') : '';
  const proofInput = selectedInput || fixedProof ? `<p class="book-note">${selectedInput || fixedProof}</p>` : '';
  const statementPDF = statementReader ? printed(statementReader,'Statement in the English PDF (p. '+statementReader.page+')') : '';
  const scopeContext = currentEdition && splitModelStatements.has(chapter?.key+':'+record?.index)
    ? link(chapter.route+'#'+splitModelContextId,'Split nodal model assumptions') : '';
  const citationSources = [proofLocation ? link(proofLocation,'Proof in chapter') : '', manuscript ? '' : link(archive,'Fixed-edition record')].filter(Boolean).join(' · ');
  return shell(row.link,row.id+' · '+title,`${trail}<header class="page-intro tag-header"><div class="tag-heading-meta">
    <p class="tag-permalink">${escape(row.id)}</p><p class="tag-status" data-closure="${row.status}">${guide.statusLink(row.status,shortStatus[row.status])}</p></div>
    <h1>${escape(title)}</h1><nav class="tag-actions page-actions" aria-label="Tag links">
    ${hasArgument ? `<a class="reading-action" href="#foundations-exact-proof">${proofLabel}</a>` : ''}${location}${scopeContext}
    ${hasContext ? link('#closure','Proof notes') : ''}${statementPDF}</nav></header>
    <article class="book-text tag-text${hasContext ? ' with-context' : ''}"><div class="tag-statement" id="${statementId}">${beforeStatement}${statement}${afterStatement}</div>
    ${statusDetails}${proof ? `<section class="tag-argument" id="foundations-exact-proof" aria-label="${proofLabel}"><h2>${proofLabel}</h2>${proofInput}${proof}</section>` : ''}</article>
    ${sourceProof}${selected}
    <section id="citation" class="tag-citation"><h2>Citation</h2><p>Non-Archimedean Geometry Foundations, ${link(row.link,'Tag '+row.id)}${record?.number ? ', '+escape(record.number) : ''}.</p>
    ${citationSources ? `<p>${citationSources}</p>` : ''}</section>`,'','tag-page');
}

function bindProofs(native, chapter, linkedTags, tagLocations) {
  const proofs = new Map();
  for (const range of chapter.proofs) {
    const tags=linkedTags.get(range.index) ?? [];
    const key=createHash('sha256').update([native.sourcePdfSha256,chapter.route,range.index].join('\n')).digest('hex').slice(0,12);
    const anchor='manuscript-proof-'+key;
    const section=chapter.sections.findLast(item=>item.index<=range.index && item.title!=='*' && !/^Proof(?: of .+)?[.:]$/i.test(item.title));
    const sectionHeading = chapter.sections.findLast(item=>item.index<=range.index && item.level===2);
    const localAnchor = sectionHeading?.id===divisorSectionId
      ? /^<h5 id="([^"]+)">Proof\.<\/h5>/.exec(chapter.blocks[range.index])?.[1] : null;
    const reader=divisorProofReaders.get(localAnchor);
    const originalTags=tags.filter(row=>!tagLocations[row.id]?.inheritedArgument);
    const primary=originalTags[0] ?? tags[0];
    const title=primary?.title ?? reader?.title ?? (range.title && range.title!=='Proof.' ? range.title.replace(/\.$/,'') : 'Proof in '+(section?.title ?? chapter.title));
    const tag='P-'+key.toUpperCase();
    const route=proofTagsRoute+tag.toLowerCase()+'/';
    const tagLinks=proofTagLinks(tags);
    proofs.set(range.index,{...range,tag,route,href:chapter.route+'#'+anchor,anchor,title,reader,tagLinks,tags,originalTags,section});
  }
  return proofs;
}

function supplementPage(entry, archive, reading) {
  const trail = crumb([[project,'Foundations'],[contentsRoute,'Table of contents'],[null,entry.title]]);
  const sealed = archive.match(/<main id="main">[\s\S]*?<\/h1>([\s\S]*?)<\/main>/)[1]
    .replace(/<p><a href="[^" ]*\/reader-en\.pdf[^" ]*">Chapter in the English reader<\/a><\/p>/, '')
    .replace(/<p class="logic-inline">[\s\S]*?<\/p>/g, '');
  const changed=new Set((reading?.byChapter.get(entry.route) ?? []).map(record=>record.id));
  const earlier=sealed.replace(/<li class="entry"><small>(NAG-\d{6})<\/small>[\s\S]*?<\/li>/g,(entry,id)=>changed.has(id) ? '' : entry);
  const reader=reading?.update.data.chapterReaders[entry.slug];
  const historical=reading && earlier.includes('<li class="entry">') ? '<h2>Supplement records from seal 1097</h2>' : '';
  const formerLocations=reading && entry.slug==='unlocated'
    ? '<p>Seal 1097 listed these Tags without chapter locations. Open a Tag to find its current chapter and proof status.</p>' : '';
  return shell(entry.route,entry.title,`${trail}<h1>${escape(entry.title)}</h1>
    <p class="chapter-coverage">${chapterCount(entry)}</p>${reader ? printed(reader,'Chapter in the English PDF') : ''}
    <article class="book-text">${newChapterSection(reading,entry.route)}<div class="supplement-records">${historical}${formerLocations}${earlier}</div></article>`);
}

const numberedStatement = /^(definition|lemma|proposition|theorem|corollary|remark|example)\.((?:[1-9]\d*|[A-I])\.\d+\.\d+)$/;

function addNumberedSearchKeywords(registry, destinations) {
  const byLocation=new Map();
  for (const [destination,href] of Object.entries(destinations)) {
    const match=numberedStatement.exec(destination);
    if (!match) continue;
    const [,kind,number]=match;
    const keyword=kind[0].toUpperCase()+kind.slice(1)+' '+number;
    if (!byLocation.has(href)) byLocation.set(href,new Set());
    byLocation.get(href).add(keyword);
  }
  for (const row of registry.tags.values()) {
    const matches=byLocation.get(registry.tagLocations[row.id]?.href);
    // An exact statement locator may identify a historical statement linked to a narrower Tag.
    // Add search terms only when it identifies a single numbered statement; the row keeps its reviewed status.
    if (matches?.size===1) row.keywords=[...new Set([...row.keywords,...matches])];
  }
}

function bindPrintedStatementReaders(registry, destinations, bindings, data) {
  const readers=bindings.statementReaders ?? {};
  const occupants=new Map();
  for (const {href} of Object.values(registry.tagLocations)) {
    occupants.set(href,(occupants.get(href) ?? 0)+1);
  }
  for (const [id,{destination,page}] of Object.entries(readers)) {
    const location=registry.tagLocations[id];
    if (!registry.tags.has(id) || !numberedStatement.test(destination) || !location || destinations[destination]!==location.href ||
        occupants.get(location.href)!==1 || !Number.isInteger(page) || page<1 || page>data.reader.pages ||
        data.records[id] || data.inheritedReaders[id]) {
      throw Error('Unbound printed statement reader '+id);
    }
  }
  return readers;
}

function bindProofCitations(native, registry, destinations, bindings) {
  const citations=new Map();
  for (const {id,block,stacks=[],chapterReferences=[],sourceSha256} of bindings.proofCitations ?? []) {
    const record=registry.tagLocations[id];
    const key=record?.key+':'+block;
    const source=native.byKey.get(record?.key)?.blocks[block];
    const edited=source && linkFoundationsStacksCitations(source,stacks);
    if (!source || record?.proof==null || block<record.proof || block>record.proofEnd || citations.has(key) ||
        createHash('sha256').update(source).digest('hex')!==sourceSha256 ||
        (!stacks.length && !chapterReferences.length) || stacks.some(tag=>!/^[A-Z0-9]{4}$/.test(tag) ||
          !edited.includes(link('https://stacks.math.columbia.edu/tag/'+tag,tag)) ||
          source.includes('https://stacks.math.columbia.edu/tag/'+tag))) {
      throw Error('Unbound printed Stacks citation '+id);
    }
    const links=chapterReferences.map(({fromChapter,destination})=>{
      const correct=destinations[destination];
      const number=numberedStatement.exec(destination)?.[2];
      const anchor=correct?.split('#')[1];
      const former=project+'chapters/'+fromChapter+'/#'+anchor;
      const before=link(former,number);
      if (!native.chapters.has(project+'chapters/'+fromChapter+'/') || !number || !anchor ||
          correct===former || source.split(before).length!==2) {
        throw Error('Unbound numbered proof citation '+id+' '+destination);
      }
      return [before,link(correct,number)];
    });
    citations.set(key,{stacks,links});
  }
  return citations;
}

function bindNativeTextArguments(native, registry, readers, bindings) {
  const texts=new Map();
  for (const {id,chapter:key,start,end,kind,reader,sourceSha256} of bindings.textArguments ?? []) {
    const location=registry.tagLocations[id];
    const chapter=native.byKey.get(key);
    const active=readers[id];
    const context=statementContexts.get(key+':'+location?.excerpt);
    const example=kind==='example' && location?.index===start && end===start &&
      chapter?.blocks[start]?.startsWith('<div class="example">');
    const passage=kind==='passage' && location?.index==null && location?.excerpt===start+1 && end===start+2 &&
      context?.before.includes(start) && context?.after.includes(end) && chapter?.blocks[start]?.startsWith('<h5');
    const source=chapter?.blocks.slice(start,end+1).join('');
    if ((!example && !passage) || !source || createHash('sha256').update(source).digest('hex')!==sourceSha256 ||
        location.key!==key || location.proof!=null || fixedTextLabels.get(id)?.toLowerCase()!==kind ||
        registry.tags.get(id)?.status!=='closed' || active?.destination!==reader.destination || active.page!==reader.page ||
        texts.has(id)) {
      throw Error('Unbound native example or passage '+id);
    }
    const title=passage ? readingText(chapter.blocks[start]).replace(/\.$/,'') : '';
    texts.set(id,{kind,title});
  }
  return texts;
}

function bindAppendixPrintedStatements(native, registry, readers, destinations, releaseBindings) {
  const printed=new Map(appendixPrintedStatements);
  const statementNumbers=new Map(sourceStatementNumbers);
  const appendixPassageAnchors=new Map();
  for (const binding of releaseBindings.appendixStatements ?? []) {
    const {id,chapter:chapterKey='039',index,kind,number,label,anchor,headingReader,sourceSha256,exposedLabelSuffix}=binding;
    const chapter=native.byKey.get(chapterKey);
    const source=chapter?.blocks[index];
    const key=chapterKey+':'+index;
    const typed=kind.toLowerCase()+'.'+number;
    const fragment=label ? authorLabelAnchor(label) : anchor;
    if (!source || createHash('sha256').update(source).digest('hex')!==sourceSha256 ||
        !/^[A-I]\.\d+\.\d+$/.test(number) || !number.startsWith(chapter.number+'.') || statementNumbers.has(key) ||
        (label ? !source.includes('id="'+fragment+'"') : anchor!==typed || !source.startsWith('<div class="definition">')) ||
        (headingReader && !chapter.blocks[index-1].includes('id="'+headingReader+'"'))) {
      throw Error('Unbound Appendix source block '+typed);
    }
    let exposedLabel;
    if (exposedLabelSuffix) {
      const prefix='<em>'+label+exposedLabelSuffix;
      const beginning=source.indexOf(prefix);
      const anchorStart=source.indexOf('<span id="'+fragment+'"></span>',beginning);
      exposedLabel=source.slice(beginning,anchorStart);
      if (beginning<0 || anchorStart<0 || exposedLabel.trimEnd()!==prefix) {
        throw Error('Unbound visible import label '+typed);
      }
    }
    statementNumbers.set(key,[kind,number,exposedLabel]);
    if (id) {
      if (printed.has(id)) throw Error('Duplicate Appendix Tag '+id);
      printed.set(id,{...binding,chapter:chapterKey});
      continue;
    }
    if (!label) appendixPassageAnchors.set(key,anchor);
    const href=chapter.route+'#'+fragment;
    if (destinations[typed] && destinations[typed]!==href) throw Error('Conflicting Appendix destination '+typed);
    destinations[typed]=href;
  }
  for (const [id,binding] of printed) {
    const {chapter:key,index,kind,number,label,destination,page}=binding;
    const chapter=native.byKey.get(key);
    const location=registry.tagLocations[id];
    const tag=registry.tags.get(id);
    const anchor=authorLabelAnchor(label);
    const href=chapter?.route+'#'+anchor;
    const namedHref=destination ? chapter?.route+'#'+destination : href;
    const reader=readers[id];
    if (location?.key!==key || location.index!==index || (location.href!==href && location.href!==namedHref) ||
        !chapter.blocks[index].includes(`id="${anchor}"`) ||
        (destination ? tag?.status!=='closed' || reader?.destination!==destination || reader.page!==page : tag?.status!=='pending')) {
      throw Error('Unbound printed Appendix statement '+id);
    }
    location.number=number;
    tag.keywords=[...new Set([...tag.keywords,kind+' '+number])];
    if (id===compactPartitionManuscriptTag) {
      tag.title=tag.title.replace(/^Theorem · /,'Theorem '+number+' · ');
    }
    const typed=kind.toLowerCase()+'.'+number;
    if (destinations[typed] && destinations[typed]!==href) throw Error('Conflicting Appendix destination '+typed);
    destinations[typed]=href;
  }
  return {appendixPrintedStatements:printed,statementNumbers,appendixPassageAnchors};
}

export function createFoundationsNative(release, dependencies) {
  const readingLocations = foundationsReadingLocations(release.native);
  if (release.update) {
    const accepted=new Set(release.rows.filter(row=>row.coverage.startsWith('Accepted whole')).map(row=>row.id));
    restoreActiveInheritedProofs(release.native,release.update.data.inheritedReaders,accepted,release.activeReadingLocators,readingLocations);
  }
  const {tags, destinations} = readingLocations;
  const updated = release.update ? restorePrintedSectionLevels(
    restoreChapterEightBoundaryArgument(release.native),release.activeReadingLocators) : release.native;
  const native = {...updated,tags};
  const coverage = foundationsCoverage({...release, native}, dependencies.policyByBlock);
  const registry = registerFoundationsTags(release,coverage,dependencies,native);
  const guide = foundationsGuide(release);
  if (release.update) {
    applyFoundationsCoverage(release.update,coverage,registry);
    for (const {title,tags} of coverage.chapters.values()) {
      for (const row of tags) {
        if (!row.keywords.includes(title)) row.keywords=[...row.keywords,title];
      }
    }
  }
  const reading = createFoundationsReadingUpdate(release.update,release,registry);
  if (reading) {
    reading.recoveredReaders=readingLocations.recoveredReaders;
    Object.assign(reading,bindActiveReadingLocators(native,release.update.data.reader,release.activeReadingLocators,destinations));
    for (const [href,number] of earlierSectionNumbers) {
      reading.headingNumbers.set(href,number);
      destinations['section.'+number] ??= href;
    }
    const location=registry.tagLocations[boundaryArgumentTag];
    const tag=registry.tags.get(boundaryArgumentTag);
    if (!location || tag?.status!=='pending') throw Error('Unbound Chapter 8 boundary theorem heading');
    location.number=boundaryTheoremNumber;
    tag.title=boundaryTheoremTitle;
    destinations['theorem.'+boundaryTheoremNumber] ??= location.href;
    const readers={...release.update.data.inheritedReaders,...Object.fromEntries(reading.recoveredReaders)};
    Object.assign(reading,bindAppendixPrintedStatements(native,registry,readers,destinations,release.activeReadingLocators));
    addNumberedSearchKeywords(registry,destinations);
    reading.statementReaders=bindPrintedStatementReaders(registry,destinations,release.activeReadingLocators,release.update.data);
    reading.proofCitations=bindProofCitations(native,registry,destinations,release.activeReadingLocators);
    reading.textArguments=bindNativeTextArguments(native,registry,readers,release.activeReadingLocators);
    // Seal 1174 p. 1175 prints the proposition title absent from the fixed-edition catalog.
    const estimate=registry.tags.get('NAG-003090');
    const estimateLocation=registry.tagLocations['NAG-003090'];
    const estimateStatement=coverage.statements.get(estimateLocation?.key+':'+estimateLocation?.index);
    if (!estimateStatement?.title.startsWith('Proposition 8.15.13 · ') || estimate?.status!=='closed') {
      throw Error('Unbound Chapter 8 quantitative estimate title');
    }
    estimate.title=estimateStatement.title;
    reading.inheritedTitles=new Map([[estimate.id,estimate.title]]);
    for (const [id,{title}] of reading.textArguments) {
      if (!title) continue;
      registry.tags.get(id).title=title;
      reading.inheritedTitles.set(id,title);
    }
    reading.introductions=bindChapterIntroductions(release.chapterIntroductions,native,registry,reading.update.data.scopeRecords);
  }
  const rows = [...registry.tags.values()];
  const redirects = new Map();
  const fixed = project + 'editions/' + release.current.edition + '/';
  const pdf = release.update?.readerPath ?? release.meta.reader.path;
  const pages = new Map([[nativeReaderRoute,bookContents(native,nativeReaderRoute,coverage,pdf,reading)],
    [contentsRoute,bookContents(native,contentsRoute,coverage,pdf,reading)],
    [coverageRoute,coveragePage(coverage,release.update?.fixed ?? fixed,Boolean(reading))],[guideRoute,guide.page],[searchRoute,searchPage()]]);
  for (const chapter of coverage.chapters.values()) {
    pages.set(chapterCoverageRoute(chapter),chapterCoveragePage(chapter,Boolean(reading)));
    if (!chapter.native) pages.set(chapter.route,supplementPage(chapter,release.contents.get(chapter.route.slice(1)+'index.html').toString('utf8'),reading));
  }
  const scopes = new Map();
  for (const node of Object.values(release.graph.nodes)) {
    if (node.href.includes('#') && node.href.startsWith(tagRoute(node.id))) {
      if (!scopes.has(node.id)) scopes.set(node.id,[]);
      scopes.get(node.id).push(node);
    }
  }
  const linkedProofs = new Map();
  for (const row of rows) {
    const record=registry.tagLocations[row.id];
    if (record?.proof == null) continue;
    if (!linkedProofs.has(record.key)) linkedProofs.set(record.key,new Map());
    const links=linkedProofs.get(record.key);
    if (!links.has(record.proof)) links.set(record.proof,[]);
    links.get(record.proof).push(row);
  }
  const locations = new Map();
  const priorProofTags=new Set(release.dependencyReview.bindings.filter(binding=>!binding.inline).map(binding=>binding.proof));
  const oldProofs=new Set(Object.values(native.tags).filter(record=>record.proof!=null).map(record=>`${record.key}:${record.proof}`));
  for (const chapter of native.chapters.values()) {
    const proofs=bindProofs(native,chapter,linkedProofs.get(chapter.key) ?? new Map(),registry.tagLocations);
    pages.set(chapter.route,chapterPage(chapter,native.catalogue,proofs,dependencies,coverage,readingLocations,registry,reading));
    for (const proof of proofs.values()) {
      if (proof.tags.length) {
        for (const tag of proof.tags) locations.set(tag.id,proof.href);
      }
      const key=`${chapter.key}:${proof.index}`;
      if(!oldProofs.has(key) || priorProofTags.has(key) || readingLocations.restoredProofs.has(key)) {
        // A restored reading of the same argument must preserve the manuscript proof's older shortcut.
        const candidates=proof.tags.length===1 ? proof.tags : proof.originalTags;
        const tag=candidates.length===1 ? candidates[0] : null;
        const destination=tag ? tag.link+'#foundations-exact-proof' : proof.href;
        let retained=Boolean(tag);
        if (reading && tag && (registry.tagLocations[tag.id]?.inheritedArgument ||
            tag.status==='pending' && usesExactPendingBookmarks(chapter.number))) {
          retained=manuscriptArgumentBookmarks(chapter,proof.index,proof.end);
        }
        redirects.set(proof.route,foundationsBookmark(destination,retained));
      }
    }
  }
  for (const result of dependencies.results.values()) {
    const id = registry.byBlock.get(`${result.chapter.key}:${result.index}`);
    if (!id) throw Error('A former result page does not resolve to a Tag: '+result.id);
    const row=registry.tags.get(id);
    const record=registry.tagLocations[id];
    let retained=Boolean(result.proof);
    if (retained && reading && row.status==='pending' && record?.proof!=null &&
        usesExactPendingBookmarks(result.chapter.number)) {
      retained=manuscriptArgumentBookmarks(result.chapter,record.proof,record.proofEnd);
    }
    redirects.set(result.route,foundationsBookmark(tagRoute(id),retained));
    row.keywords = [...new Set([...row.keywords, result.id])];
  }
  for (const row of rows) {
    const record = registry.tagLocations[row.id];
    const archivedProof = release.contents.get(row.link.slice(1)+'index.html')?.includes('id="foundations-exact-proof"');
    const key = `${record?.key}:${record?.index}`;
    const policy = row.finding ? null : (dependencies.byId.get(row.id)?.policy ?? dependencies.policyByBlock.get(key));
    pages.set(row.link,tagPage(row,{record,chapter:native.byKey.get(record?.key),fixed,gap:coverage.gaps.get(row.id),
      scopes:scopes.get(row.id),archivedProof,historical:release.historicalStatements?.[row.id],proofLocation:locations.get(row.id),
      policy,suppressed:readingLocations.suppressed.get(key),manuscript:registry.records.get(row.id),guide,currentEdition:Boolean(reading),
      reading,statementReader:reading?.statementReaders[row.id]}));
  }
  const remarkNumbers = foundationsRemarkNumbers(native.destinations);
  const referenceLabels = foundationsReferenceLabels(native);
  const chapterTenPages = new Set([chapterTenRoute]);
  for (const row of rows) {
    const manuscript=registry.records.get(row.id);
    if (manuscript?.chapter.route!==chapterTenRoute) continue;
    chapterTenPages.add(row.link);
    const statement=manuscript.chapter.blocks[manuscript.index];
    const edited=editFoundationsReadingHtml(statement,remarkNumbers,referenceLabels);
    const excerpt=readingText(restoreFoundationsNumberedLinks(edited,referenceLabels)).slice(0,280);
    const context=readingText(statementContext(manuscript.chapter,manuscript.index,'before'));
    row.body=[excerpt,context].filter(Boolean).join(' ');
  }
  const mathCache = new Map();
  for (const [route, page] of pages) {
    let edited = editFoundationsReadingHtml(page, remarkNumbers, referenceLabels);
    if (chapterTenPages.has(route)) {
      edited=linkChapterTenBibliography(restoreFoundationsNumberedLinks(edited,referenceLabels));
    }
    if (reading) {
      const location=registry.tagLocations[route.split('/').at(-2)];
      const chapter=location ? native.byKey.get(location.key)?.route : route;
      edited=restoreEquationCaptions(edited,reading.equationCaptions.get(chapter),reading.update.readerPath);
    }
    pages.set(route, typesetReadingMath(edited, mathCache, route));
  }
  return {pages,tags:registry.tagLocations,destinations,rows,redirects,reading,coverage};
}
