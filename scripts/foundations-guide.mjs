import {escape, foundationsShell, guideRoute, link} from './foundations-layout.mjs';

export const shortStatus = {closed:'Closed', open:'Open', partial:'Narrower scope proved', conditional:'Conditional',
  comparison:'Comparison pending', pending:'Review pending', definition:'Definition'};

const statusDescriptions = {
  closed:'The edition accepts a proof for the stated hypotheses and conclusion. The accepted result can be used within that scope.',
  open:'A step needed for the stated result is unresolved. The Tag identifies the step or records that a complete proof has yet to be verified.',
  partial:'An accepted argument covers a narrower set of hypotheses or a weaker conclusion. The full statement remains open. Follow the selected scopes for the proved part.',
  conditional:'The displayed argument establishes its conclusion assuming the listed inputs. Check those inputs in the setting where you want to apply the result.',
  comparison:'The Tag records what must be checked to relate two constructions or categories, such as matching their test spaces or local presentations.',
  pending:'The statement has a permanent Tag while its proof evidence is being checked. The Tag indicates whether an argument has been located.',
  definition:'The Tag records the meaning or conventions for an object. A proof status applies to claims made using that definition.',
};

const typeSections = [
  ['Evidence, hypotheses and scope', {
    'counterexample':'An example contradicts the stated claim or a proposed extension. The admissible scope needs to be reduced or the statement revised.',
    'external-proof-input':'The argument uses a result supplied by an outside source. Its exact statement and applicability matter for the conclusion here.',
    'hypothesis-transfer':'An assumption must be verified after a change of field, model, test space or other setting.',
    'missing-prerequisite':'Another assertion is needed before the argument can proceed.',
    'scope-extension':'The available argument covers a narrower case. The missing step is to reach the rest of the stated scope.',
    'source-binding':'The right statement, proof version or precise source location needs to be matched to the Tag.',
    'unverified-proof':'The record leaves a full proof unverified and gives too little evidence to name a more specific mathematical gap.',
    'proof-awaiting-review':'A manuscript argument has been located. Its steps and applicability still need review.',
    'proof-location':'The argument’s location or its coverage of the stated claim still needs verification.',
  }],
  ['Constructions and comparisons', {
    'algebraic-criterion':'An algebraic condition must be shown to characterize the stated property.',
    'chart-presentation':'Local coordinates or generators must represent the object, with the required compatibility of representations.',
    'closure-property':'Applying an operation has to keep the result in the specified class.',
    'cohomological-comparison':'The argument must identify cohomological constructions or check the claimed duality.',
    comparison:'Two constructions must agree on the specified objects, hypotheses and tests.',
    construction:'The object or operation still needs to be constructed in the stated setting.',
    detection:'The proposed tests must distinguish the objects or detect the property claimed.',
    functoriality:'The construction has to commute with the stated maps, such as pullback or pushforward.',
    gluing:'The local objects must agree on overlaps and assemble into a global object.',
    'lifting-descent':'An object or map must lift to a larger setting or descend through the stated change of setting.',
    'uniqueness-independence':'The result must be unique or independent of the choices made in its construction.',
    'well-definedness':'The proposed formula must define an object and respect the equivalence of representatives.',
  }],
  ['Estimates, limits and geometric criteria', {
    balancing:'The weighted directions or faces must satisfy the balancing equations.',
    'coefficient-control':'The coefficients or values must obey the required estimates or lie in the specified value group.',
    continuity:'The stated operation must be continuous in the required topology.',
    density:'The permitted test objects or approximants must be dense in the stated space and topology.',
    dimension:'The required dimension, codimension or purity statement still needs justification.',
    'divisor-current-identity':'The divisor and current descriptions must agree with the stated sign, normalization and tests.',
    equidistribution:'The proof needs a distribution or measure limit for the specified points or nets.',
    finiteness:'The argument needs the stated finite fibres, finite morphism or other finiteness property.',
    'integration-calibration':'Integration must use the correct weights, orientation or lattice normalization.',
    'intersection-product':'The specified product must exist and satisfy the claimed intersection properties.',
    'limit-stability':'A construction or identity must survive the stated passage to a limit.',
    'maximum-principle':'The required bound or extremum property must be established on the stated domain.',
    'norm-estimate':'The result needs a bound in the stated norm with control of the constants.',
    'numerical-criterion':'Numerical data such as degrees or intersection numbers must characterize the geometric condition.',
    positivity:'The asserted positivity or equivalence of positivity conditions must hold in the stated category.',
    regularization:'Approximants of the required class must exist with the specified convergence and constraints.',
    'support-boundary':'The proof must control the support or behavior at the boundary of the stated domain.',
    vanishing:'A specified form, current or obstruction must vanish under the stated conditions.',
    'volume-energy-comparison':'Volume and energy must agree in the stated setting with the specified normalization.',
  }],
];

export function foundationsGuide(release) {
  const labels = {...release.historicalGapTypes.types,...release.manuscriptGapTypes.types,
    'proof-awaiting-review':'Proof awaiting review','proof-location':'Proof or proof location to verify'};
  const ids = new Map(Object.entries(labels).map(([id,label])=>[label,id]));
  const descriptions = Object.assign({},...typeSections.map(([,entries])=>entries));
  if (Object.keys(labels).some(id=>!Object.hasOwn(descriptions,id))) throw Error('Missing Foundations problem type explanation');
  const statusLink = (status,title) => link(`${guideRoute}#status-${status}`,title);
  const typeLink = label => {
    const id = ids.get(label);
    if (!id) throw Error('Unknown Foundations problem type '+label);
    return link(`${guideRoute}#type-${id}`,label);
  };
  const statuses = Object.entries(statusDescriptions).map(([status,description])=>
    `<div id="status-${status}"><dt>${escape(shortStatus[status])}</dt><dd>${escape(description)}</dd></div>`).join('');
  const types = typeSections.map(([section,entries])=>`<section class="guide-type-group"><h3>${escape(section)}</h3><dl class="guide-definitions">
    ${Object.entries(entries).filter(([id])=>Object.hasOwn(labels,id)).map(([id,text])=>`<div id="type-${id}"><dt>${escape(labels[id])}</dt><dd>${escape(text)}</dd></div>`).join('')}</dl></section>`).join('');
  const page = foundationsShell(guideRoute,'Reading guide',`<header class="page-intro"><h1>Reading guide</h1>
    <p class="page-lead">Use a NAG Tag to find, read or cite a mathematical entry.</p></header>
    <nav class="page-links" aria-label="Guide sections">${link('#proof-statuses','Proof statuses')}${link('#problem-types','Problem types')}</nav>
    <div class="guide-text"><p>A Tag may identify a definition, a statement such as a theorem or lemma, or a specific proof question. The Tag links to the relevant passage and any available argument.</p>
    <section id="proof-statuses"><h2>Proof statuses</h2><dl class="guide-definitions">${statuses}</dl></section>
    <section id="problem-types"><h2>Problem types</h2><p>These labels describe the work involved in a recorded gap. An entry can have several types. Read the status and the source note to see how much of the result is established.</p>${types}</section></div>`,{layout:'guide-page',description:'How to read and cite permanent NAG Tags in OpenMath Foundations, with explanations of open, conditional and accepted-scope statements and their proof obligations.'});
  return {page,statusLink,typeLink};
}
