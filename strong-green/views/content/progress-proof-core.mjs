// Reading diagrams for the four admitted-domain Progress cases.
// The frozen papers, permanent records and their statuses remain authoritative.
// A custom intermediate conclusion is conditional on its displayed hypotheses;
// a source theorem used as a rule retains its own registered status.
const link = (href, label) => ({ href, label });
const paper = (slug, anchor, label) => link(`/papers/${slug}#${anchor}`, label);
const pairing = (anchor, label) => paper('pairing-constructions', anchor, label);
const green = (anchor, label) => paper('green-constructions', anchor, label);
const height = (anchor, label) => paper('global-height-pairing', anchor, label);
const sourceRoot = '/editions/v0.5.1/source-files/';
const raw = (file, label) => link(sourceRoot + file, label);
const sourceFile = file => 'public/projects/strong-green' + sourceRoot + file;
const foundation = name => `companion/proofs/foundations/${name}.tex`;
const curveFile = foundation('R12_curve_lifts_and_actual_green');
const descentFile = foundation('R16_one_cycles_and_dominant_activation');
const finiteFile = foundation('R17_finite_actual_tests_and_height_obstruction_quotients');
const compactFile = foundation('R12_compact_parameter_algebraic_triviality');
const algebraicFile = 'green-draft/algebraic_equivalence.tex';
const curveSource = label => raw(curveFile, label);
const descentSource = label => raw(descentFile, label);
const finiteSource = label => raw(finiteFile, label);
const compactSource = label => raw(compactFile, label);
const algebraicSource = label => raw(algebraicFile, label);
const diagram = (caseId, suffix, label) => link(`/results/proof-diagrams/${caseId}/#proof-${caseId}-${suffix}`, label);

const gate = (kind, label, explanation, sources, children, ruleNotes = {}) => {
  // The reading paper states the domain; the exact companion TeX supplies the
  // expanded proof. Keep both destinations when the latter is not typeset there.
  const proofSources = [...sources];
  if (!proofSources.some(item => item.href.startsWith('/papers/'))) {
    if (proofSources.some(item => item.href.endsWith(finiteFile)))
      proofSources.push(pairing('sub:finite-certificates', 'Reading paper: the finite-period criterion'));
    else if (proofSources.some(item => item.href.endsWith(curveFile) || item.href.endsWith(descentFile)))
      proofSources.push(pairing('prop:endpoint-input', 'Reading paper: the endpoint statement'));
  }
  return {
    kind, label, explanation, sources: proofSources, children,
    ...(Object.keys(ruleNotes).length ? { rules: Object.keys(ruleNotes), ruleNotes } : {}),
  };
};
const vocabulary = caseId => ({
  id: suffix => `proof-${caseId}-${suffix}`,
  node: (suffix, title, evidence, note, derivation, status = 'conditional', links = []) => ({
    id: `proof-${caseId}-${suffix}`, title, href: evidence.href, status, note,
    ...(derivation ? { gate: derivation } : {}), ...(links.length ? { links } : {}),
  }),
  record: (suffix, record, note, derivation) => ({
    id: `proof-${caseId}-${suffix}`, record, note, ...(derivation ? { gate: derivation } : {}),
  }),
});
const pairingBinding = locators => ({
  file: 'public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex',
  sha256: '246716570c7476e2ccac6f9b3c19eb55941aca9cf265e431e1f14502272311f1', locators,
});
const heightBinding = locators => ({
  file: 'public/projects/strong-green/editions/v0.5.1/papers/global-height-pairing.tex',
  sha256: '7d8edacfa18eb8496cc69942f15da22b15348a03f91fdd7316362c0d01851a08', locators,
});
const greenBinding = locators => ({
  file: 'public/projects/strong-green/editions/v0.5.1/papers/green-constructions.tex',
  sha256: '968f0560d434f7fb071eedff83c9d90c73a5387113975eb9e8a3a6697d56b263', locators,
});
const compactBinding = locators => ({
  file: sourceFile(compactFile),
  sha256: 'de1a3a130af7221532e3d860cc858ddea7b74e29316a3b854d7398512b9f0efe', locators,
});

function kernelDomain() {
  const c = 'kernel-domain', { id, node, record } = vocabulary(c);
  const local = {
    id: id('local-tree'), navTitle: '1. Exact support and residues',
    title: 'A zero obstruction gives the concrete Green form needed for reciprocity',
    summary: 'A supported curved pair and a global actual primitive give both strong G and its point-slice identity.',
    scope: 'Fix a finite place K, a smooth projective geometrically integral X/K, and the prescribed rational codimension-r cycle Z. Keep its final support, the original absolute value, native degrees and every actual test.',
    contexts: [record('local-context', 'BB-LOCAL-DATA', 'These are the scope and normalization conventions. The analytic construction below remains conditional on the stated companion foundations.')],
    root: node('local-conclusion', 'Exact-support strong G with the point-slice property', height('r16h:P', 'H16: point-slice corollary'),
      'The same γ = G − Ψ works on Xᵃⁿ ∖ |Z|ᵃⁿ. For every normal integral quasiprojective r-dimensional carrier a:M→X with finite a⁻¹|Z|, its point-slice identity holds against every compact actual scalar test on Mᵃⁿ.',
      gate('all', 'ALL ingredients of the concrete correction',
        'Subtract the pullback of the global primitive from the curved slice identity. The correction introduces no additional deleted locus.',
        [height('r16h:P', 'Proof of the exact-support and point-slice conclusion')], [
          node('primitive', 'A global actual primitive DΨ = Ω', height('hyp:height-covariance', 'Actual obstruction quotient'),
            'Zero obstruction is zero in the actual Bott–Chern quotient, so the selected curvature has a global actual primitive.',
            gate('all', 'BOTH zero class and the curvature identification',
              'The quotient is by D of global ordinary actual forms, not by arbitrary currents.',
              [height('hyp:height-covariance', 'Chow-independent curvature class')], [
                node('obstruction-zero', 'Ob([Z]) = 0 over the original K', height('r16h:P', 'Local zero-obstruction premise'), 'This is the local input defining the height domain.', undefined, 'hypothesis'),
                record('obstruction-interface', 'BB-ACTUAL-OBSTRUCTION', 'The prescribed pair has curvature representing this Chow-invariant class. This analytic interface retains its draft status.'),
              ])),
          node('curved-slice', 'The curved pair has the exact finite-intersection residue', height('r16h:curved-slice', 'All-actual finite-intersection residue theorem'),
            'For a normal integral quasiprojective r-dimensional carrier a:M→X with finite S = a⁻¹|Z|, the curved slice identity holds against every compact actual scalar test on Mᵃⁿ. Its residue is precisely the refined intersection Iₐ(Z), with every point coefficient.',
            gate('all', 'ALL data in the proper-slice calculation',
              'Normalize the components dominating M, retain their Artinian lengths, sum scalar Poincaré–Lelong, identify the algebraic point cycle, and divide by the full presentation degree.',
              [height('r16h:curved-slice', 'Complete proper-slice proof'), height('r16h:source-degrees', 'Weighted source-degree identity')], [
                record('supported-pair', 'BB-SUPPORTED-GREEN-PAIR', 'Use the specified line-complex presentation, strict curvature identity, top Chern-degree formula and actual trace. An unspecified current solution is insufficient.'),
                node('point-coefficients', 'Localized Chern character = refined point intersection', height('r16h:algebraic-residue', 'Algebraic residue lemma'),
                  'Arbitrary base change and graph Gysin commute with the bivariant character. CH₀ of the finite scheme is free on its points, so coefficients cannot change modulo rational equivalence.'),
                node('scalar-trace-input', 'Scalar PL, finite trace and native top degrees', height('hyp:height-calculus', 'Actual scalar and current calculus'),
                  'Scalar PL is used on normal sources. Actual finite trace is used on the finite locus; top Chern integration is used on proper fibres. Keep residue degrees and nonreduced lengths.', undefined, 'hypothesis', [height('hyp:height-trace', 'Full trace hypotheses'), height('hyp:height-supported', 'Supported-complex hypotheses')]),
              ])),
          node('all-test-stokes', 'Actual pullback commutes with D; all-test Stokes holds', height('hyp:height-calculus', 'Actual-form and current calculus'),
            'Both the strong equation and the pulled-back primitive equation are evaluated on the original full actual test spaces.', undefined, 'hypothesis'),
        ], { 'BB-GREEN-CORRECTION': 'This conditional reduction justifies subtracting the global primitive; it does not establish the analytic input or universal obstruction vanishing.' })),
  };

  const assembly = {
    id: id('assembly-tree'), navTitle: '2. The global pairing',
    title: 'From local Green values to a pairing on Chow classes',
    summary: 'Local reciprocity gives one global principal transport element; the product formula removes it from the finite weighted sum.',
    scope: 'Let X/F be smooth projective geometrically integral of dimension n over a number field, r+s=n+1, and z∈Hʳ(X), w∈Hˢ(X). The source requires local obstruction vanishing in BOTH degrees.',
    contexts: [node('domain-definition', 'Hʳ is the intersection of the finite-place kernels', height('r16h:height-domain', 'The height domain'),
      'Hʳ consists of geometrically homologically trivial rational Chow classes with zero actual obstruction at every finite completion. This definition does not prove Hʳ = Vʳ.', undefined, 'definition')],
    root: node('main', 'A canonical symmetric rational-bilinear height on Hʳ × Hˢ', height('r16h:global-height', 'H16 global height theorem'),
      'h(z,w) = Σᵥ nᵥ λᵥ(Z,W), with nᵥ = [Fᵥ:ℚᵥ]/[F:ℚ]. It is independent of Green forms and moving representatives and invariant under finite number-field extension.',
      gate('all', 'ALL local, global and normalization inputs',
        'The displayed steps establish the pairing on the kernel domain. No claim of positivity, full correspondence adjunction, or equality Hʳ = Vʳ is inserted.',
        [height('r16h:global-height', 'Complete construction proof'), pairing('sub:height-input', 'Pairing manuscript: precise height input')], [
          node('local-values', 'Local values are choice-independent, symmetric and additive', height('r16h:global-height', 'Local definition and symmetry'),
            'For disjoint Z,W put λ = ∫W γZ. Both complementary cycles need a strong solution.',
            gate('all', 'BOTH strong choices and disjoint-polar Stokes',
              'Use (Dg)h − g(Dh) = d′((d″g)h) + d″(g(d′h)). Evaluation on 1 gives symmetry; subtracting two choices gives independence. Additivity is checked in common disjoint position.',
              [height('r16h:global-height', 'Green-current calculation')], [
                node('green-both', 'Concrete strong forms in BOTH complementary degrees', diagram(c, 'local-conclusion', 'Exact-support residue tree'),
                  'Apply the preceding construction to each localized representative. At infinity use the classical zero-curvature complex construction.', undefined, 'conditional', [height('r16h:P', 'Finite-place input')]),
                node('mixed-currents', 'Mixed currents and all-actual compact Stokes', height('hyp:height-calculus', 'Current hypotheses'),
                  'Germ vanishing makes complementary tests avoid each polar support. Since the two supports are disjoint, local mixed products glue on their covering opens.', undefined, 'hypothesis'),
              ])),
          node('finite-sum', 'Almost every local term is zero', height('hyp:height-model', 'Good-model hypothesis'),
            'Spread the fixed disjoint pair to a smooth projective model. The intersection of the closures has finite image, so outside a finite set the closures are disjoint.',
            gate('all', 'BOTH spreading and good-model vanishing',
              'A good-model Green choice has zero curvature and vanishes off its closure tube; the other cycle lies there. Choice independence transfers the value zero to every allowed choice.',
              [height('r16h:global-height', 'Almost-all-place vanishing proof')], [
                node('spread-disjoint', 'A smooth model with disjoint closures away from finitely many places', height('r16h:global-height', 'Spreading argument'), 'Properness of the intersection over the arithmetic base and its empty generic fibre make its image finite.'),
                node('good-model-input', 'The good-model Green and curvature calculation', height('hyp:height-model', 'Model-form hypotheses'), 'This companion analytic result is an explicit input to the finite-sum argument.', undefined, 'hypothesis'),
              ])),
          node('principal-law', 'Rational equivalence changes λᵥ by one global logarithm', height('r16h:principal', 'Exact principal transport'),
            'After clearing denominators in both cycles, λᵥ(∂B,W) = −log|a(B,W)|ᵥ; divide by the two multipliers. The algebraic norm element belongs to F× and is the same at every place.',
            gate('all', 'ALL moving and residue ingredients',
              'Normalize a good higher-Chow chain over F. Its faces separately avoid W; point-slice residues and scalar PL produce the prescribed product of field norms with exact multiplicities.',
              [height('r16h:principal', 'Point-norm formula'), height('r16h:global-height', 'Higher-Chow transport proof')], [
                node('good-chain', 'A good higher-Chow chain over the original number field', height('r16h:global-height', 'Moving-complex argument'), 'The moving subcomplex meets W and both simplex faces properly. Clear rational denominators in the chain and in W before taking integral point exponents.', undefined, 'hypothesis'),
                node('chain-residues', 'The full point-slice identity and scalar PL', diagram(c, 'local-conclusion', 'Exact-support residue tree'), 'Pull back the concrete Green form to the normal chain carrier. This step uses the proved slice calculation, not pullback of an arbitrary distributional equation.', undefined, 'conditional', [height('r16h:P-eq', 'Point-slice identity')]),
                node('global-norm', 'Algebraic norms and the same archimedean law', height('r16h:principal', 'Global transport element'), 'Finite tensor factors and refined coefficients retain their full degrees at completion. A possible global sign has absolute value one at every place.', undefined, 'hypothesis'),
              ])),
          node('chow-descent', 'The product formula and common moving remove all choices', height('r16h:global-height', 'Chow descent paragraph'),
            'Σᵥ nᵥ log|a|ᵥ = 0 gives first-slot descent; symmetry gives the second. Compare two moved pairs through one representative avoiding both first supports. Common disjoint position gives rational bilinearity.', undefined, 'hypothesis'),
          node('absolute-input', 'Finite extensions preserve the normalized global sum', diagram(c, 'absolute-conclusion', 'Absolute-normalization tree'),
            'Local value invariance and the sum of completion weights prove the finite-extension clause.', undefined, 'conditional', [height('r16h:constant-extension', 'Local absolute normalization')]),
        ], { 'BB-H16-KERNEL-DOMAIN': 'The permanent record is a conditional construction on its fixed kernel domain. Its additional finite-detector description requires the separate comparison, drawn in the period-criterion case.' })),
    related: [node('full-domain-gap', 'Extend the construction to both full homologically trivial groups', pairing('lem:two-degrees', 'Two-degree domain criterion'),
      'This requires zero obstruction for every localized global class in degree r AND degree s. The kernel construction does not establish that general vanishing.', undefined, 'open')],
  };

  const absolute = {
    id: id('absolute-tree'), navTitle: '3. Finite-extension normalization',
    title: 'Why the height is unchanged by finite extension of the number field',
    summary: 'The full local degree cancels the change of native measure, then the normalized completion weights add back to the original weight.',
    scope: 'Use the specified extending absolute value; do not renormalize it on L/K. The assertion concerns pullbacks of classes already in the admitted domain.',
    root: node('absolute-conclusion', 'h over F′ of the pulled-back pair equals h over F', height('r16h:global-height', 'Absolute base-field proof'),
      'For every finite F′/F, the construction is absolute on the pullbacks of both admitted factors.',
      gate('all', 'BOTH local invariance and the weight identity',
        'Group the finite and infinite places of F′ above each place of F. Their normalized weights sum to the old weight.',
        [height('r16h:constant-extension', 'Local absolute normalization'), height('r16h:global-height', 'Global weight calculation')], [
          node('local-absolute', 'λL(ZL,WL) = λK(Z,W)', height('r16h:local-absolute', 'Local equality'),
            'The base-changed Green choice is strong on every actual test. Native finite degree and native measure conversion use the same full factor [L:K].',
            gate('all', 'ALL finite-extension compatibilities',
              'Base-change the supported complex and its line presentation, pull back the global primitive, then cancel the full native factor in the cycle integral.',
              [height('r16h:constant-extension', 'Proof of local invariance')], [
                node('base-changed-form', 'The supported Green choice base-changes on all actual tests', height('r16h:finite-base-change', 'Finite base-change lemma'), 'The line-sum trace is compatible on the finite locus; the same presentation degree is retained across all components.', undefined, 'hypothesis'),
                node('native-factor', 'Native K integration is [L:K] times native L integration', height('hyp:height-trace', 'Native finite-constant comparison'), 'Use identical genuine unit presentations. Keep ramification and residue degree, rather than a geometric sheet count.', undefined, 'hypothesis'),
                node('choice-after-extension', 'Both pulled-back classes have zero obstruction', height('hyp:height-covariance', 'Constant-extension covariance'), 'The obstruction and actual primitive pull back. Disjoint-polar Stokes then permits any strong Green choices.', undefined, 'hypothesis'),
              ])),
          node('global-weights', 'The completion weights above v sum to nᵥ', height('r16h:global-height', 'Normalized place weights'),
            'Σw|v [F′w:ℚᵥ]/[F′:ℚ] = [Fᵥ:ℚᵥ]/[F:ℚ]. The classical infinite-place normalization is included.', undefined, 'hypothesis'),
        ])),
  };
  return {
    caseId: c, trees: [local, assembly, absolute],
    coverage: [{ title: 'A height pairing when the local obstruction vanishes', treeId: assembly.id, nodeId: id('main'), source: height('r16h:global-height', 'Obstruction-zero analytic height theorem') }],
    sourceBindings: [
      pairingBinding(['sub:height-input', 'hyp:height-input', 'lem:two-degrees']),
      heightBinding(['sec:height-hypotheses', 'hyp:height-calculus', 'hyp:height-supported', 'hyp:height-trace', 'hyp:height-covariance', 'hyp:height-model', 'r16h:algebraic-residue', 'r16h:curved-slice', 'r16h:P', 'r16h:constant-extension', 'r16h:height-domain', 'r16h:global-height', 'r16h:principal']),
    ],
  };
}

function algebraicallyTrivial() {
  const c = 'algebraically-trivial', { id, node, record } = vocabulary(c);
  const local = {
    id: id('local-tree'), navTitle: '1. Two local proofs',
    title: 'Two source-supported routes to local vanishing for algebraically trivial cycles',
    summary: 'Transfer from degree-zero divisors, or use a Poincaré family and compactness over the original valued field.',
    scope: 'Geometric algebraic equivalence is over an algebraic closure. Descend the finitely many curves, marked points, correspondences and rational-equivalence witnesses to a finite L/K; for the supplied norm-family route, enlarge once to make L/K Galois.',
    contexts: [record('local-data', 'BB-LOCAL-DATA', 'The local conclusion is ordinary actual, over the original K, with the prescribed support and all actual tests.')],
    root: node('local-vanishing', 'Ob([Z]) = 0 for every geometrically algebraically trivial Z', green('thm:main-algebraic', 'Conditional Theorem A'),
      'This conclusion covers every dimension and codimension, under the premises of the chosen route. It does not cover every homologically trivial class.',
      gate('any', 'ANY complete proof with its own inputs',
        'The curve-transfer proof uses the endpoint divisor input and correspondence covariance. The compact proof uses the actual obstruction, supported construction and rational-fibre rigidity.',
        [pairing('sub:algebraic-triviality', 'Curve-transfer proof'), green('sec:conditional-algebraic-proof', 'Compact-parameter proof')], [
          node('curve-transfer', 'Transfer the endpoint vanishing along curve correspondences', pairing('prop:algebraic-triviality', 'Algebraically trivial cycles proposition'),
            'Over L, write zL as a finite rational sum Γ*([a]−[b]); transfer each zero obstruction and return to K.',
            gate('all', 'ALL curve-transfer data',
              'Kernel covariance kills every correspondence image. Summing gives zero for zL; proper finite pushdown gives [L:K]z, then divide in the rational Chow group.',
              [pairing('prop:algebraic-triviality', 'Proof of the algebraic-equivalence inclusion')], [
                node('curve-expression', 'A finite curve-family expression for zL', pairing('prop:algebraic-triviality', 'Descent of the curve data'), 'Use smooth projective connected curves, rational marked points, correspondences and actual finite rational-equivalence witnesses over L.', undefined, 'hypothesis'),
                node('degree-zero-divisor', 'The degree-zero divisor endpoint input', diagram('endpoints', 'divisor-conclusion', 'Recovered conditional divisor proof'),
                  'This application uses the divisor endpoint as a premise. The endpoint diagram derives it from geometric algebraic equivalence and the independent compact/Poincaré proof under (A1), (A2) and (R); it does not invoke this curve-transfer argument.', undefined, 'hypothesis', [green('sec:conditional-algebraic-proof', 'Independent compact proof'), compactSource('R12: r12p:picard-products')]),
                node('chow-covariance', 'Kernel preservation by Chow correspondences and finite pushdown', pairing('prop:covariance', 'Chow covariance'), 'Use the correct codimension shifts. An L-correspondence is read on the diagonal open-and-closed component over K; finite pushforward after pullback is multiplication by [L:K].', undefined, 'hypothesis'),
              ])),
          node('norm-compact', 'A native norm family reduces z to compact additive rigidity', green('r12p:geometric-algebraic', 'Geometric algebraic triviality theorem'),
            'The algebraic norm family has a K-rational fibre d z, d=[L:K]. Compact rigidity kills its obstruction over K. For the prescribed curvature, DHz=Ωa−Ω₀−dΩZ gives ΨZ=(βa−Hz)/d.',
            gate('all', 'ALL norm-family ingredients',
              'Build a family on a product of Jacobians, take its Weil-restriction norm, apply the compact-family theorem over K, and divide by d.',
              [green('sec:conditional-algebraic-proof', 'Original-field proof'), algebraicSource('R12.P13–14: norm and primitive')], [
                node('poincare', 'The Poincaré bundle gives an additive Jacobian family', green('r12p:poincare', 'Poincaré family lemma'),
                  'For Θ = pXJ*(pXC*Γ · pCJ*c₁(P)), refined base change gives Θt = Γ*c₁(Pt); the Picard group law gives additivity in CHʳ. Products combine the finitely many families.'),
                node('weil-norm', 'The norm family over K has fibre d z', green('r12p:norm-family', 'Native algebraic norm lemma'),
                  'For the chosen finite Galois L/K let A=ResL/K J. Pull back along evaluation and push down algebraically; refined finite-flat base change gives Θᴺa = h*zL = d z. This step does not assume an analytic trace of arbitrary primitives.'),
                node('compact-use', 'Compact additive rigidity kills the norm-family obstruction', diagram(c, 'compact-conclusion', 'Detailed compact-family tree'),
                  'The local constancy and primitive comparison needed for this step remain explicit analytic inputs.', undefined, 'conditional', [green('r12p:compact-additive', 'Compact-family theorem')]),
              ])),
        ], { 'BB-ALG-TRANSFER': 'Theorem A is a conditional algebraic-equivalence result. The ANY junction does not enlarge its domain to arbitrary homologically trivial cycles.' })),
  };

  const compact = {
    id: id('compact-tree'), navTitle: '2. Compactness and the actual primitive',
    title: 'How compact additive families produce a global actual primitive',
    summary: 'Uniform constancy near the zero fibre and compact multiples reduce the obstruction to a generic Chow-zero character.',
    scope: 'A/K is an abelian variety and Θ is additive as a CHʳ(X)ℚ-valued family with Θ₀=0. Additivity is supplied by the Poincaré construction; it is not automatic for an arbitrary family.',
    root: node('compact-conclusion', 'Every additive fibre has zero obstruction and an actual primitive', green('r12p:compact-additive', 'Compact additive-family theorem'),
      'The primitive is built from the original global scalar–curvature trace generators. No trace theorem for an arbitrary chosen primitive is assumed.',
      gate('all', 'ALL steps in the explicit primitive argument',
        'Choose m with ma near zero. Additivity makes Δ = Ωma − Ω₀ − m(Ωa−Ω₀) generically Chow-zero; local constancy gives Ωma=Ω₀. A Chow-zero primitive H for Δ yields βa = −H/m.',
        [green('r12p:compact-additive', 'Proof of compact additive vanishing'), algebraicSource('R12.P4–6: explicit primitive')], [
          node('uniform-near-zero', 'Ωb = Ω₀ on all of X for b in one ordinary neighbourhood', green('r12p:rigid-fiber', 'Uniform rational-fibre rigidity'),
            'The neighbourhood is uniform in X, rather than a pointwise neighbourhood depending on x.',
            gate('all', 'BOTH local unit constancy and properness',
              'Near the zero section compare analytic units f with their fibre values f⁰. Shrink until |f−f⁰|<|f⁰|, so their valuations agree. Proper projection removes the closed complement of the equality locus.',
              [green('r12p:rigid-fiber', 'Rigidity proof')], [
                record('rigidity-input', 'BB-RATIONAL-FIBRE-RIGIDITY', 'The analytic rigidity result is still draft; the proof uses genuine unit presentations and ordinary neighbourhoods.'),
                node('proper-uniformity', 'Proper projection supplies one parameter neighbourhood', green('r12p:rigid-fiber', 'Uniformity along the whole fibre'), 'If W contains the entire zero fibre where actual forms agree, take V=Aᵃⁿ∖q(X×A∖W). Properness makes this open and q⁻¹V⊂W. No Cartesian description of analytic points is used.'),
              ])),
          node('compact-multiple', 'Some positive multiple ma lies in that neighbourhood', green('r12p:compact-multiple', 'Compact-multiple lemma'),
            'A(K) is compact. Cover it by finitely many translates of V with V−V inside the chosen neighbourhood; two multiples of a occupy one translate, so their difference enters it.',
            undefined, 'conditional', [green('r12p:compact-additive', 'Torsion-free obstruction conclusion')]),
          node('chow-zero-primitive', 'Additivity and the generic Chow-zero primitive theorem', green('r12p:compact-additive', 'Primitive construction'),
            'Δ has zero generic Chow character, hence D H=Δ. The actual Chow-invariant obstruction and global supported-complex primitive theorem are required.', undefined, 'hypothesis', [green('r11p:generic-chow-primitive', 'Generic Chow-zero primitive')]),
          node('original-curvature', 'The primitive is independent of the chosen model character', green('r12p:compact-additive', 'Model-character comparison'),
            'Any other model character for the same fibre class differs from Ωa−Ω₀ by a generically Chow-zero character. Its global actual primitive corrects βa to the new character.', undefined, 'conditional', [algebraicSource('R12.P6 and the following comparison')]),
        ], { 'BB-COMPACT-RIGIDITY': 'Compactness forces a locally constant additive image in a torsion-free group to vanish. This proved group-theoretic step does not establish the draft analytic local-constancy premise.' })),
  };

  const global = {
    id: id('global-tree'), navTitle: '3. The admitted global factors',
    title: 'Place-by-place algebraic vanishing gives the stated height domains',
    summary: 'The local inclusion places the algebraically trivial factor in H; the complementary factor must still satisfy its own kernel condition.',
    scope: 'X/F is smooth projective geometrically integral of dimension n, r+s=n+1. Algebraic equivalence is geometric. Both factors may be algebraically trivial.',
    root: node('main', 'A height on CHʳalg × Hˢ, and on CHʳalg × CHˢalg', pairing('prop:algebraic-triviality', 'Global algebraic-equivalence consequence'),
      'Symmetry also permits Hʳ × CHˢalg. No argument here replaces the remaining H factor by every homologically trivial class.',
      gate('all', 'ALL ingredients for the global restriction',
        'Localize the algebraic-equivalence witnesses at each finite place, apply either complete local proof, and use the already constructed kernel pairing.',
        [pairing('prop:algebraic-triviality', 'Global-domain proof')], [
          node('all-local', 'Every localization of an algebraically trivial class has Ob = 0', diagram(c, 'local-vanishing', 'Two local proofs'),
            'Finite curve and rational-equivalence data remain valid under completion, so the class belongs to Hʳ.', undefined, 'conditional', [green('thm:main-algebraic', 'Local conditional Theorem A')]),
          node('other-factor', 'The complementary factor lies in Hˢ', height('r16h:height-domain', 'Complementary domain'),
            'This may follow from algebraic triviality as well, or from a separate zero-obstruction theorem in degree s.', undefined, 'hypothesis'),
          node('kernel-height', 'The conditional height construction on Hʳ × Hˢ', diagram('kernel-domain', 'main', 'Kernel-domain proof diagram'),
            'Retain the exact Green, reciprocity, good-place, moving and normalization hypotheses of H16.', undefined, 'conditional', [height('r16h:global-height', 'Global pairing proof')]),
        ])),
  };
  return {
    caseId: c, trees: [local, compact, global],
    coverage: [{ title: 'Height pairings on algebraically trivial cycles', treeId: global.id, nodeId: id('main'), source: pairing('prop:algebraic-triviality', 'Algebraically trivial cycles proposition') }],
    sourceBindings: [
      pairingBinding(['prop:algebraic-triviality', 'sub:algebraic-triviality', 'prop:covariance', 'prop:endpoint-input']),
      { file: sourceFile(algebraicFile), sha256: '443e559c7d05c8784d45c4e17ba8ccc55344c60fc0ab7e8d46b13cd9e59ac585', locators: ['r12p:rigid-fiber', 'r12p:compact-multiple', 'r12p:compact-additive', 'r12p:poincare', 'r12p:norm-family', 'r12p:geometric-algebraic', 'r12p:degree-norm', 'r12p:final-primitive'] },
      greenBinding(['hyp:construction-calculus', 'thm:main-algebraic', 'sec:conditional-algebraic-proof']),
      compactBinding(['r12p:geometric-algebraic', 'r12p:picard-products']),
    ],
  };
}

function endpoints() {
  const c = 'endpoints', { id, node, record } = vocabulary(c);
  const global = {
    id: id('domains-tree'), navTitle: '1. Endpoint domains and low dimensions',
    title: 'Endpoint vanishing must cover both complementary degrees',
    summary: 'Divisors and zero-cycles supply a full pair in every dimension; one-cycles supply the complete middle pair on a threefold.',
    scope: 'Work under the standing actual-form and covariance hypotheses. Vʳ denotes geometrically homologically trivial rational Chow classes; Hʳ imposes every finite-place obstruction condition.',
    root: node('main', 'Full V¹ × Vⁿ, and Vⁿ⁻¹ × H² for n≥2', pairing('sec:endpoints', 'Endpoint degrees'),
      'The one-cycle result covers degree n−1. In dimensions at least four, it does not by itself determine the codimension-two factor.',
      gate('all', 'ALL endpoint inputs and the kernel pairing',
        'The three local endpoint results imply H¹=V¹, Hⁿ=Vⁿ and Hⁿ⁻¹=Vⁿ⁻¹. Substitute the appropriate equalities in Hʳ×Hⁿ⁺¹⁻ʳ.',
        [pairing('prop:endpoint-input', 'Endpoint proposition'), pairing('lem:two-degrees', 'Two-degree criterion')], [
          node('divisor-input', 'Homologically trivial divisors have zero obstruction', diagram(c, 'divisor-conclusion', 'Recovered conditional divisor proof'),
            'This remains an input to the domain calculation. The expanded proof below uses the divisor numerical-to-algebraic comparison and the independent compact/Poincaré construction under (A1), (A2) and (R).', undefined, 'hypothesis', [pairing('prop:endpoint-input', 'Endpoint assertion'), compactSource('R12: r12p:picard-products')]),
          node('zero-cycle-input', 'Homologically trivial zero-cycles have zero obstruction', diagram(c, 'zero-cycle-conclusion', 'Recovered conditional zero-cycle proof'),
            'This remains an input to the domain calculation. The public R12 top-degree proof reduces componentwise degree-zero cycles to geometric algebraic equivalence; its actual-form hypotheses remain explicit below.', undefined, 'hypothesis', [pairing('prop:endpoint-input', 'Endpoint assertion'), compactSource('R12: r12p:top-degree')]),
          node('one-cycle-input', 'Homologically trivial one-cycles have zero obstruction', diagram(c, 'one-cycle-conclusion', 'One-cycle descent proof'),
            'The same-dimensional semistable alteration, original-model curve correction and dominant obstruction injection are expanded below.', undefined, 'conditional', [descentSource('R16: theorem r16G:one-cycles')]),
          node('two-degree-transfer', 'Localize global classes and apply the kernel pairing', pairing('lem:two-degrees', 'Two-degree proof'),
            'Geometric cycle classes commute with completion. Vanishing at every finite place gives Hᵃ=Vᵃ in each covered degree a; both complementary equalities are needed for a full pair.', undefined, 'conditional', [diagram('kernel-domain', 'main', 'Global kernel construction')]),
        ])),
    related: [node('low-dimension', 'Every complementary pair is covered when dim X≤3', pairing('prop:endpoint-input', 'Low-dimensional consequence'),
      'For a threefold, the middle group V² is the one-cycle group, so h:V²×V²→ℝ is included.',
      gate('all', 'BOTH coverage of every degree and the pairing theorem',
        'For n≤3 each admissible codimension is 1, n−1 or n. Thus the endpoint set and its complementary set cover every pair.',
        [pairing('prop:endpoint-input', 'Endpoint range'), pairing('lem:two-degrees', 'Complementary-degree criterion')], [
          node('small-dimension', 'The dimension satisfies 1≤n≤3', pairing('prop:endpoint-input', 'Dimension range'), 'Only codimensions 1 through n occur. In dimension zero the listed positive complementary range is empty.', undefined, 'hypothesis'),
          node('all-endpoints', 'The three local endpoint inputs above', diagram(c, 'main', 'Endpoint-domain tree'), 'Use the expanded conditional divisor and zero-cycle proofs and the conditional one-cycle proof. All three retain their actual-form premises.'),
          node('small-height', 'H16 on both complementary kernels', diagram('kernel-domain', 'main', 'Kernel-domain proof diagram'), 'The same analytic and reciprocity hypotheses remain required.', undefined, 'conditional', [height('r16h:global-height', 'H16 height theorem')]),
        ]))],
  };

  const divisor = {
    id: id('divisor-tree'), navTitle: '2. Divisors from algebraic equivalence',
    title: 'The divisor endpoint follows from the independent compact-parameter proof',
    summary: 'Geometric homological triviality gives numerical triviality; a nonzero tensor power is algebraically trivial, and rational coefficients remove that power.',
    scope: 'K is the original finite extension of ℚp with its original absolute value. Let X/K be smooth projective geometrically integral of dimension n≥1 and D a prescribed rational divisor with zero geometric ℓ-adic class for one ℓ≠p. The actual-form conclusion assumes (A1), (A2) and (R).',
    contexts: [node('divisor-cartier-convention', 'Clear rational coefficients in the divisor class', curveSource('R12: divisor comparison in r12n:cohom-lift'),
      'Choose a positive integer a so that aD is a Cartier divisor on smooth X, and put L=O(aD). The comparison below is made on X over an algebraic closure; rational Chow coefficients permit division by every nonzero integer.', undefined, 'definition')],
    root: node('divisor-conclusion', 'Ob¹X([D]) = 0 and exact-support strong G for D', green('thm:main-algebraic', 'Conditional Theorem A in codimension one'),
      'The R12 Picard corollary supplies Df=c₁(L̄) for a geometrically algebraically trivial rational line-bundle class. A generic Chow-zero comparison handles the particular model character in the prescribed curved pair.',
      gate('all', 'BOTH the algebraic reduction and the conditional actual construction',
        'Apply the independent compact/Poincaré theorem to the rational divisor class. Its global primitive corrects the original curved pair on X, preserving the exact support and every compact actual complementary test.',
        [green('thm:main-algebraic', 'Conditional algebraic-equivalence theorem'), compactSource('R12: r12p:picard-products and r12p:geometric-algebraic')], [
          node('divisor-geometric-algebraic', '[D] is geometrically algebraically trivial in CH¹ℚ', compactSource('R12: r12p:picard-products'),
            'If L⊗m is algebraically trivial for m≠0, then am[D] is algebraically trivial. Divide by am in the rational Chow group.',
            gate('all', 'Pass from the tensor power to the rational divisor class',
              'This implication uses rational coefficients; it does not assert that every numerically trivial integral line bundle already lies in Pic⁰.',
              [curveSource('R12: r12n:cohom-lift, Kleiman 6.3(a,b)'), green('thm:main-algebraic', 'Geometric algebraic-equivalence input')], [
                node('divisor-algebraic-power', 'Some nonzero tensor power of L is algebraically trivial', curveSource('R12: Kleiman comparison in r12n:cohom-lift'),
                  'Kleiman, The Picard scheme, Definition 6.1 and Theorem 6.3(b)⇒(a), over an algebraically closed field: numerical triviality is equivalent to a nonzero tensor power being algebraically trivial. The R12 source cites this exact comparison.',
                  gate('all', 'Apply the projective Picard comparison',
                    'X over the algebraic closure is projective and L is invertible, so the stated theorem applies to its numerically trivial class.',
                    [curveSource('R12: r12n:cohom-lift and its primary-source record'), green('thm:main-algebraic', 'Target algebraic input')], [
                      node('divisor-numerical-zero', 'L has degree zero on every geometric integral curve', curveSource('R12: divisor numerical/cohomological comparison'),
                        'For each complete integral curve C, cycle classes commute with intersection and trace: deg(c₁(L)·[C])=Tr(c₁(L)∪cl(C))=0. Thus L is geometrically numerically trivial.',
                        gate('all', 'Use cycle-class compatibility with intersection and degree',
                          'Multiplying the prescribed divisor by a preserves its zero geometric class. The trace calculation is on the geometric generic fibre; no special-fibre correction or divisor Tate assertion is used.',
                          [curveSource('R12: divisor comparison used in r12n:cohom-lift'), pairing('prop:endpoint-input', 'Geometric homological endpoint input')], [
                            node('divisor-homology-zero', 'The prescribed divisor has zero geometric ℓ-adic class', pairing('prop:endpoint-input', 'Divisor premise'),
                              'This is the input for one ℓ≠p. It concerns the class of D on X over the algebraic closure, not only a numerical condition on one model.', undefined, 'hypothesis'),
                          ])),
                    ])),
              ])),
          node('divisor-actual-construction', 'The compact/Poincaré theorem under (A1), (A2), (R)', diagram(c, 'algebraic-endpoint-conclusion', 'Complete independent actual-form construction'),
            'Use the construction expanded below with r=1. It starts from generic Chow-zero model relations, rational-fibre rigidity and compactness; it does not use the divisor endpoint or the curve-transfer proof.', undefined, 'conditional', [green('hyp:construction-calculus', 'Exact actual-form hypotheses'), compactSource('R12: r12p:picard-primitive')]),
        ], { 'BB-ALG-TRANSFER': 'This remains a conditional application of Theorem A; the classical divisor comparison does not certify its draft actual-form premises.' })),
  };

  const zeroCycle = {
    id: id('zero-cycle-tree'), navTitle: '3. Zero-cycles from degree zero',
    title: 'The top-degree endpoint has an explicit public R12 proof',
    summary: 'A zero geometric top-degree class has degree zero on each geometric component. Point differences are algebraically trivial and enter the compact-parameter construction.',
    scope: 'Let X/K be smooth projective geometrically integral of dimension n≥1 over the original valued finite extension K/ℚp, and let Z be a prescribed rational zero-cycle. Assume zero geometric ℓ-adic class for one ℓ≠p and retain (A1), (A2), (R).',
    contexts: [node('zero-cycle-component-scope', 'The degree condition is geometric and componentwise', compactSource('R12: boundary after r12p:top-degree'),
      'For the stated geometrically integral X there is one geometric component. If that assumption is dropped, require degree zero on every geometric connected component; total degree zero across different components is insufficient.', undefined, 'definition')],
    root: node('zero-cycle-conclusion', 'ObⁿX([Z]) = 0 and exact-support strong G for Z', green('thm:main-algebraic', 'Conditional Theorem A in top degree'),
      'The complete companion source proves r12p:top-degree. Apply it to the actual model character of the prescribed pair, then subtract its global actual primitive. The test space is all compact actual scalar tests on Xᵃⁿ.',
      gate('all', 'BOTH geometric algebraic equivalence and the actual construction',
        'The R12 top-degree proof reduces the generic zero-cycle class to geometric algebraic equivalence and invokes the compact/Poincaré theorem. Its primitive is on all of X, so the correction retains exactly Xᵃⁿ∖|Z|ᵃⁿ.',
        [compactSource('R12: r12p:top-degree and its proof'), green('sec:conditional-algebraic-proof', 'Conditional construction over the original field')], [
          node('zero-cycle-geometric-algebraic', '[Z] is geometrically algebraically trivial', compactSource('R12: proof of r12p:top-degree'),
            'Every degree-zero class on a smooth connected projective geometric component is a rational sum of point differences. Those differences are algebraically trivial.',
            gate('all', 'BOTH the point-difference expression and connected families',
              'Algebraic equivalence is additive, so the finite rational sum of the displayed point differences is algebraically trivial.',
              [compactSource('R12: r12p:top-degree, geometric point-difference argument'), green('r12p:geometric-algebraic', 'Curve-family representation of algebraic equivalence')], [
                node('zero-cycle-point-differences', 'Write each component as Σᵢaᵢ([xᵢ]−[x₀])', compactSource('R12: degree-zero generic class in r12p:top-degree'),
                  'Over the algebraic closure all closed points have degree one. Choose x₀ on each component; the equality follows from Σᵢaᵢ=0 on that component.',
                  gate('all', 'Use the componentwise degree-zero equality',
                    'The cycle has finite support and rational coefficients, so this is a finite identity of cycles on each component.',
                    [compactSource('R12: r12p:top-degree and componentwise qualification'), pairing('prop:endpoint-input', 'Zero-cycle endpoint input')], [
                      node('zero-cycle-geometric-degree', 'The degree on every geometric component is zero', compactSource('R12: top-degree generic Chow condition'),
                        'The trace of a zero-cycle class on a smooth projective connected geometric component is its degree. Restrict the zero cohomology class to each component and take that trace.',
                        gate('all', 'Trace the geometric top-degree cycle class',
                          'The trace is normalized so that a geometric point has class of degree one. This gives zero degree separately on every component.',
                          [compactSource('R12: r12p:top-degree and its geometric scope'), pairing('prop:endpoint-input', 'Geometric homological hypothesis')], [
                            node('zero-cycle-homology-zero', 'The prescribed zero-cycle has zero geometric ℓ-adic class', pairing('prop:endpoint-input', 'Zero-cycle premise'),
                              'Use the actual geometric class in H²ⁿ(X over the algebraic closure, ℚℓ(n)), for one ℓ≠p.', undefined, 'hypothesis'),
                          ])),
                    ])),
                node('zero-cycle-point-families', 'Point differences are fibres of connected cycle families', compactSource('R12: point differences connected by curve correspondences'),
                  'On a smooth connected projective geometric component V, the diagonal in V×V is the family of points. Its fibres at x and x₀ give [x]−[x₀]. The curve-correspondence formulation used by R12 gives the same algebraic equivalence; its finite witnesses descend in the common construction below.', undefined, 'conditional', [green('r12p:geometric-algebraic', 'Finite curve-correspondence witnesses')]),
              ])),
          node('zero-cycle-actual-construction', 'The compact/Poincaré theorem under (A1), (A2), (R)', diagram(c, 'algebraic-endpoint-conclusion', 'Complete independent actual-form construction'),
            'Use the construction below with r=n. The prescribed curvature is an actual degree-n model character. R12 first combines Chern polynomials by Adams projection and tensor products; it makes no claim for arbitrary atomic actual forms.', undefined, 'conditional', [compactSource('R12: r12p:top-degree and its stated boundary'), green('hyp:construction-calculus', 'Exact actual-form hypotheses')]),
        ], { 'BB-ALG-TRANSFER': 'The top-degree corollary applies the conditional algebraic-equivalence theorem. Recovering its public proof does not upgrade the analytic foundations.' })),
  };

  const algebraicEndpoint = {
    id: id('algebraic-endpoint-tree'), navTitle: '4. The independent actual-form construction',
    title: 'Compact Poincaré families supply the global primitive for both endpoints',
    summary: 'Descend finite algebraic data, form an additive norm family over K, use compactness and rational-fibre rigidity, and correct the original model character.',
    scope: 'Let K/ℚp be finite with its original absolute value, X/K smooth projective geometrically integral with n=dim X, and z=[Z]∈CHʳ(X)ℚ geometrically algebraically trivial, 1≤r≤n. All actual-form assertions are under (A1), (A2), (R) for every smooth projective variety used. K and its absolute value remain fixed; a finite Galois extension is used only for algebraic family data.',
    root: node('algebraic-endpoint-conclusion', 'ObʳX(z) = 0 and strong G for the original Z', green('sec:conditional-algebraic-proof', 'Independent conditional Theorem A proof'),
      'The construction uses no divisor endpoint and no correspondence-kernel transfer theorem. All final forms and tests are native over K, on exactly Xᵃⁿ∖|Z|ᵃⁿ.',
      gate('all', 'ALL norm-family, primitive and exact-support inputs',
        'The native norm fibre is d z. Compactness gives Dβa=Ωa−Ω₀. Generic Chow-zero comparison gives DHz=Ωa−Ω₀−dΩZ; hence ΨZ=(βa−Hz)/d has DΨZ=ΩZ. Subtract ΨZ from the prescribed pair and apply actual Stokes.',
        [green('sec:conditional-algebraic-proof', 'Complete conditional argument'), compactSource('R12: r12p:geometric-algebraic, R12.P13–14')], [
          node('algebraic-native-family', 'An additive family over K has a rational fibre d z', green('r12p:norm-family', 'Algebraic norm family'),
            'Here d=[L:K] is the entire finite field degree. The norm operates on algebraic Chow families, not on an already constructed actual primitive.',
            gate('all', 'ALL algebraic data for the native norm family',
              'Poincaré families on the finitely many Jacobians combine on their product J. Weil restriction and algebraic finite-flat pushforward then give the required additive family over K.',
              [compactSource('R12: r12p:poincare, r12p:norm-family and r12p:degree-norm'), green('r12p:geometric-algebraic', 'Finite geometric data and norm')], [
                node('algebraic-finite-galois-data', 'Finite curve and Chow identities over one Galois L/K', green('r12p:geometric-algebraic', 'Descent of the algebraic-equivalence witnesses'),
                  'Start with geometric algebraic triviality. The curves, correspondences, marked points and rational-equivalence witnesses use finitely many coefficients. Enlarge once to finite Galois L/K, with rational basepoints on all curves, and obtain the finite expression for zL.', undefined, 'hypothesis'),
                node('algebraic-poincare-family', 'A Poincaré family is additive and has fibre zL', green('r12p:poincare', 'Additive Poincaré construction'),
                  'Define Θ=pXJ*(pXC*Γ·pCJ*c₁(P)). Refined Gysin base change gives Θt=Γ*c₁(Pt), and the rigidified Picard group law gives Θt+t′=Θt+Θt′ and Θ₀=0 in Chow. Products and sums combine the finitely many families.'),
                node('algebraic-weil-norm', 'Evaluation and algebraic norm give Θᴺa = d z', green('r12p:norm-family', 'Native norm fibre formula'),
                  'Set A=ResL/K J and Θᴺ=(hA)*(id×evaluation)*Θ. The finite-flat/refined-Gysin identity gives Θᴺa=h*Θt=h*zL=d z. Evaluation is a group map, so rational fibres remain additive and the zero fibre is zero.'),
              ])),
          node('algebraic-compact-primitive', 'Compactness produces Dβa = Ωa−Ω₀', green('r12p:compact-additive', 'Compact-family primitive'),
            'Use a model character Ω of the additive native family on X×A. The primitive retains the restricted finite-flat traces of original scalar–curvature generators; no trace of an arbitrary primitive is required.',
            gate('all', 'ALL actual comparison, rigidity and compactness premises',
              'Choose m>0 with ma near zero. Rigidity gives Ωma=Ω₀, while Chow additivity makes Δ=Ωma−Ω₀−m(Ωa−Ω₀) generically Chow-zero. By (A1), D H=Δ; thus βa=−H/m has the required derivative.',
              [compactSource('R12: r12p:compact-additive, R12.P5–7'), green('hyp:construction-calculus', 'The separate A1 and R hypotheses')], [
                record('algebraic-a1', 'BB-ACTUAL-OBSTRUCTION', '(A1): strict actual model characters, pullback compatibility and a global actual primitive for a generic degree-r Chow-zero difference. Its registered analytic status remains draft.'),
                record('algebraic-r', 'BB-RATIONAL-FIBRE-RIGIDITY', '(R): one ordinary neighbourhood of 0∈A(K) gives Ωb=Ω₀ on all of X. The uniform actual-form assertion remains draft.'),
                node('algebraic-compact-multiple', 'A positive multiple ma enters that neighbourhood', green('r12p:compact-multiple', 'Compact-multiple proof'),
                  'A(K) is compact because A is projective over the local field. Choose V with V−V inside the neighbourhood and cover A(K) by finitely many translates; two multiples of a in one translate give the required positive multiple.'),
                node('algebraic-additive-relation', 'The difference Δ has generic Chow character zero', green('r12p:compact-additive', 'Use of Chow additivity'),
                  'The additive native family has Θma−mΘa=0 and Θ₀=0. This is a relation of Chow classes, so (A1) applies to Δ. Merely having an abelian parameter variety would not suffice.', undefined, 'conditional', [green('r11p:generic-chow-primitive', 'Global primitive for a generic Chow-zero model character')]),
              ], { 'BB-COMPACT-RIGIDITY': 'Compactness is the proved group-theoretic step; the actual local constancy and model-character comparison remain separately displayed premises.' })),
          record('algebraic-a2', 'BB-SUPPORTED-GREEN-PAIR', '(A2): choose (GZ,ΩZ) for the original prescribed cycle, with ΩZ representing its actual obstruction. The pair and its all-test identity retain their draft analytic source status.'),
          node('algebraic-original-character', 'Correct the prescribed curvature by ΨZ=(βa−Hz)/d', compactSource('R12: r12p:final-primitive'),
            'The difference Ωa−Ω₀−dΩZ has generic Chow class Θᴺa−d z=0. By (A1), choose a GLOBAL actual Hz with DHz equal to that difference. Then D((βa−Hz)/d)=ΩZ; both the minus sign and the full d=[L:K] are retained.', undefined, 'conditional', [green('r11p:generic-chow-primitive', 'A1 supplies the global character-comparison primitive')]),
          node('algebraic-exact-support-correction', 'γZ=GZ−ΨZ on the original support complement', green('sec:conditional-algebraic-proof', 'Final exact-support correction'),
            'ΨZ is global on Xᵃⁿ, so restriction introduces no extra removed set. Actual Stokes cancels ΩZ in the curved identity for every compact actual test of bidegree (n−r,n−r), preserving the original cycle coefficients.', undefined, 'conditional', [compactSource('R12: conclusion of r12p:geometric-algebraic')]),
        ], { 'BB-ALG-TRANSFER': 'This is the independent conditional compact/Poincaré route, with its actual-form inputs visible.', 'BB-GREEN-CORRECTION': 'The formal global correction preserves the exact complement once the curved pair and global actual primitive are supplied.' })),
  };

  const oneCycle = {
    id: id('one-cycle-tree'), navTitle: '5. One-cycles and original-field descent',
    title: 'One-cycles on arbitrary smooth projective varieties',
    summary: 'A same-dimensional alteration supplies the regular model; descend the zero obstruction and correct the original prescribed cycle on X.',
    scope: 'For n≥3 let X/K be smooth projective geometrically integral and Z a rational one-cycle with zero geometric ℓ-adic class for one ℓ≠p. For n=2, the source uses the divisor endpoint input.',
    root: node('one-cycle-conclusion', 'Obⁿ⁻¹X([Z]) = 0 and strong G on the exact original complement', pairing('prop:endpoint-input', 'One-cycle endpoint'),
      'The result holds over the original K, on Xᵃⁿ∖|Z|ᵃⁿ, against every compact actual (1,1) test.',
      gate('all', 'ALL geometric, descent and support inputs',
        'The numerical certificate kills the upstairs obstruction. Covariance and dominant injectivity kill the downstairs class; subtract a global primitive from the original pair on X.',
        [descentSource('R16: r16G:one-cycles and r16G:dominant-witness'), pairing('prop:endpoint-input', 'Published reading section')], [
          node('same-dimensional-alteration', 'A regular strictly semistable alteration of the SAME dimension', descentSource('R16 one-cycle proof'),
            'de Jong gives finite F/K and V/F of dimension n with a projective generically finite dominant K-map V→X and a regular projective strictly semistable model. Operational Chow pullback between the smooth generic varieties preserves the geometric cycle class and codimension n−1.', undefined, 'hypothesis'),
          node('curve-certificate', 'A pure virtual-bundle curve certificate on the model of V', diagram(c, 'model-conclusion', 'Detailed numerical curve-correction tree'),
            'Its generic character is f*[Z], and its degree is zero against every vertical (n−1)-dimensional integral subvariety.', undefined, 'conditional', [curveSource('R12: original-model witness theorem')]),
          node('original-field-descent', 'Numerical detection and dominant Bott–Chern injection', descentSource('R16: r16G:numerical-witness'),
            'Regard the F-model over K. Native special-fibre degrees acquire the positive residue-field factor; the numerical detector kills curvature. Dominant injection retains all field and function-field degrees.',
            gate('all', 'BOTH analytic detection and injective pullback',
              'ObV(f*z)=f*ObX(z)=0, so injectivity gives ObX(z)=0. No analytic pushforward of an upstairs Green form is asserted.',
              [descentSource('R16: numerical-witness and dominant-witness proofs')], [
                node('numerical-detector', 'The native model-Chern detector and generic Chow comparison', pairing('prop:numerical', 'Numerical-model interface'), 'Test every vertical cycle, including full multiplicities and native residue degrees. The companion analytic detector is an explicit hypothesis.', undefined, 'hypothesis'),
                node('dominant-injection', 'All-degree dominant obstruction pullback is injective', descentSource('Named premise r16pb:dominant'), 'Retain the actual covariance theorem, all-degree injection, and full degrees. An alteration is not treated as finite away from the given Z.', undefined, 'hypothesis'),
              ])),
          node('original-pair', 'Correct the prescribed pair on X by a global actual primitive', pairing('prop:obstruction', 'Exact-support curvature correction'),
            'Take (GZ,ΩZ) for the original Z. Zero obstruction gives DΨ=ΩZ globally; γ=GZ−Ψ on the exact original complement. No support from the alteration is deleted.', undefined, 'hypothesis'),
        ])),
  };

  const model = {
    id: id('model-tree'), navTitle: '6. The regular-model curve correction',
    title: 'The weighted numerical correction on a regular SNC model',
    summary: 'A divisor-kernel calculation and geometric homology annihilate the obstruction functional; numerical duality then solves the vertical correction equation.',
    scope: 'A supplied integral regular flat projective model has special fibre ΣᵢmᵢDᵢ with strict normal-crossing reduced support and smooth closed strata; n≥3. The prescribed one-cycle has zero geometric ℓ-adic class for one ℓ≠p. All mᵢ are positive and all groups rational.',
    contexts: [node('weighted-operators', 'Aₐ is restriction after vertical Gysin; M=diag(mᵢ)', curveSource('R12: NL3–NL8'),
      'δ compares divisor restrictions on double strata, and γ₀ is signed Gysin of edge constants. Every degree is native over the finite residue field.', undefined, 'definition')],
    root: node('model-conclusion', 'A pure K₀ witness with zero degree on every vertical test', curveSource('R12: theorem r12n:main'),
      'There is ξ with chₙ₋₁(ξ|X)=z, all other operational character components zero, and zero degree on every integral vertical (n−1)-cycle.',
      gate('all', 'BOTH the corrected Chow extension and its operational realization',
        'Apply the pure operational representative lemma to the vertically corrected class. Numerical triviality on each smooth component then tests every vertical subvariety, including singular ones.',
        [curveSource('R12: r12n:admissible, r12n:K0 and proof of r12n:main')], [
          node('admissible-extension', 'A corrected extension has zero numerical restriction on every Dᵢ', curveSource('R12: proposition r12n:admissible'),
            'If Tᵢ=jᵢ!Θ and T=Aₙ₋₂u, then Θad=Θ−Σjᵢ*uᵢ has unchanged generic class and componentwise numerical restriction zero.',
            gate('all', 'ALL inputs of the finite-dimensional correction',
              'The extension functional annihilates ker A₁. Perfect numerical duality and A₁ᵗ=Aₙ₋₂ then put T in im Aₙ₋₂; choose rational cycle representatives of a preimage.',
              [curveSource('R12: NL17–NL19 and their proof')], [
                node('annihilator', 'The extension functional tΘ annihilates ker A₁', curveSource('R12: r12n:admissible proof'),
                  'ker A₁ = M ker δ + im γ₀. The two summands are killed for different reasons.',
                  gate('all', 'ALL weighted-kernel and vanishing steps',
                    'Signed edge cycles cancel as actual supported cycles. For a compatible divisor tuple, the geometric cycle class of z and the multiplicity-weighted trace make the pairing zero.',
                    [curveSource('R12: r12n:kernel, r12n:cohom-lift and r12n:weighted-trace')], [
                      node('weighted-kernel', 'ker A₁ = M ker δ + im γ₀', curveSource('R12: multiplicity-corrected divisor-kernel lemma'),
                        'The principal-fibre relation gives the mᵢmⱼ weighted incidence matrix. Finite-dimensional edge correction and two divisor Hodge-index energy identities force compatibility. No middle-dimensional standard-conjecture sign is used.'),
                      node('supported-edge-cancellation', 'tΘ vanishes on im γ₀', curveSource('R12: NL5 and r12n:admissible'), 'Each double-stratum cycle occurs twice with opposite signs under Σjᵢ*. Projection therefore kills the edge contribution.'),
                      node('compatible-lift-trace', 'tΘ vanishes on M ker δ by geometric homology', curveSource('R12: cohomological lift and weighted trace'),
                        'Numerically compatible divisors have compatible geometric ℓ-adic classes. Purity kills outgoing Čech differentials, proper base change lifts the class, and ΣmᵢTrDi equals generic trace. The generic z factor is zero. No algebraic or Frobenius-fixed lift is required.'),
                    ])),
                node('transpose-duality', 'Perfect numerical duality identifies the transpose image', curveSource('R12: r12n:admissible proof'), 'Projection on double strata and the same diagonal normal term give A₁ᵗ=Aₙ₋₂. Thus (ker A₁)⊥=im Aₙ₋₂ over ℚ.'),
              ])),
          node('pure-operational', 'The regular-model Chern character gives a pure operational ξ', curveSource('R12: lemma r12n:K0'),
            'The rational K₀-to-Chow isomorphism gives the preimage of the pure class. Uniqueness under the Adams operation forces every other OPERATIONAL component to vanish; cap equality alone is not substituted.'),
          node('vertical-supported-tests', 'Componentwise numerical zero tests every vertical integral support', curveSource('R12: r12n:K0 proof'),
            'Every vertical integral V lies in some Dᵢ. Regular Gysin compatibility and projection identify the supported character degree with (jᵢ!Θad)·[V], which is zero.'),
        ])),
  };
  return {
    caseId: c, trees: [global, divisor, zeroCycle, algebraicEndpoint, oneCycle, model],
    coverage: [
      { title: 'Divisors, zero-cycles and one-cycles', treeId: global.id, nodeId: id('main'), source: pairing('sec:endpoints', 'Endpoint degrees and proof') },
      { title: 'Varieties of dimension at most three', treeId: global.id, nodeId: id('low-dimension'), source: pairing('prop:endpoint-input', 'Endpoint proposition and low-dimensional consequence') },
    ],
    sourceBindings: [
      pairingBinding(['sec:endpoints', 'lem:two-degrees', 'prop:endpoint-input', 'bibitem:InternalEndpoints']),
      greenBinding(['hyp:construction-calculus', 'thm:main-algebraic', 'sec:conditional-algebraic-proof', 'r12p:rigid-fiber', 'r12p:compact-multiple', 'r12p:compact-additive', 'r12p:poincare', 'r12p:norm-family', 'r12p:geometric-algebraic', 'r11p:generic-chow-primitive']),
      compactBinding(['r12p:rigid-fiber', 'r12p:compact-multiple', 'r12p:compact-additive', 'r12p:poincare', 'r12p:norm-family', 'r12p:geometric-algebraic', 'r12p:degree-norm', 'r12p:final-primitive', 'r12p:picard-products', 'r12p:picard-primitive', 'r12p:top-degree']),
      { file: sourceFile(curveFile), sha256: 'd76922f35be1cca4c08686a70d65b3dcffdc31f9c4837bb790115fceb6959e15', locators: ['r12n:main', 'r12n:kernel', 'r12n:cohom-lift', 'r12n:weighted-trace', 'r12n:admissible', 'r12n:K0', 'r12n:actual-zero'] },
      { file: sourceFile(descentFile), sha256: '72ccf8d0c8700f9784d2e409645143468a3ed801251705c6f9a8b6fbec3c5b23', locators: ['r16G:dominant-witness', 'r16G:numerical-witness', 'r16G:one-cycles'] },
    ],
  };
}

function individualCertificates() {
  const c = 'individual-certificates', { id, node } = vocabulary(c);
  const global = {
    id: id('global-tree'), navTitle: '1. A criterion for the two height factors',
    title: 'Finite obstruction periods put specified classes in the pairing domain',
    summary: 'Fix the witness and comparison before the cycle, check the relevant bad-place coordinates, and treat all other places by good reduction.',
    scope: 'Let X/F be smooth projective geometrically integral. The FD17 fixed arithmetic witness, VT17 comparison, original-field reconstruction and height hypotheses are retained. Take z∈Vʳ and w∈Vⁿ⁺¹⁻ʳ.',
    root: node('main', 'The two certified classes admit the global height pairing', pairing('sub:finite-certificates', 'Finite period certificates'),
      'The criterion applies to individual classes and their rational linear combinations. It does not prove that all homologically trivial classes have zero periods.',
      gate('all', 'BOTH degree-wise certificates and the height construction',
        'Apply the same argument separately in the two complementary degrees. Each period vector has the correct local kernel; vanishing therefore puts each class in its H factor.',
        [pairing('sub:finite-certificates', 'Period criterion'), finiteSource('FD17: r17fd:global-finite')], [
          node('both-period-vectors', 'The selected periods vanish in BOTH complementary degrees', finiteSource('FD17: global-finite theorem'),
            'Use one fixed arithmetic witness chosen before the classes and a finite set S containing its bad places and the places above an auxiliary prime. For each w∈S use the full local degree [Ew:Fv].', undefined, 'hypothesis'),
          node('finite-place-kernel', 'Each zero period vector gives the original local kernel condition', diagram(c, 'finite-tests-conclusion', 'Finite actual-test construction'),
            'The comparison is literal equality with rational numerical coordinates. It preserves the original actual sheaf and every test in the Green conclusion.', undefined, 'conditional', [finiteSource('FD17: r17fd:finite-tests')]),
          node('good-place-kernel', 'Good reduction kills the remaining local coordinates', finiteSource('FD17: global-finite proof'),
            'Smooth proper specialization sends the zero geometric generic class to zero on the special fibre, so all algebraic degree pairings vanish. The model detector kills the upstairs obstruction; dominant and finite-constant injection return to Fv.', undefined, 'hypothesis'),
          node('certified-height', 'H16 pairs the two admitted factors', diagram('kernel-domain', 'main', 'Kernel-domain proof diagram'),
            'All reciprocity, moving, good-place and archimedean normalization premises remain in force.', undefined, 'conditional', [height('r16h:global-height', 'Global height proof')]),
        ])),
    related: [node('universal-period-gap', 'Every homologically trivial class has all these periods zero', pairing('sub:finite-certificates', 'Remaining source-vanishing problem'),
      'The finite-dimensional description neither proves this vanishing nor supplies an effective algorithm for all numerical cycle groups. Coordinate choices change with the witness; the kernel does not.', undefined, 'open')],
  };

  const numerical = {
    id: id('numerical-tree'), navTitle: '2. Why the numerical vector has the right kernel',
    title: 'The fixed model quotient and the actual obstruction have the same kernel',
    summary: 'Chow localization makes the coordinates well-defined; numerical duality and the stated comparison prove the two kernel inclusions.',
    scope: 'Fix K, r and a finite L/K, a generically finite projective dominant g:Y→XL, and a regular projective reduced strictly semistable model of Y, before choosing Z. These are the FD17 witness data.',
    contexts: [node('numerical-spaces', 'Vmodel = ker Aₙ₋ᵣ and ν(z)(v)=〈rᵣΘW,v〉', finiteSource('FD17.1–2: spaces and coordinates'),
      'Cᵃ is the direct sum of rational numerical cycle spaces on the native special components. W represents g*p*z and ΘW is a model extension. A is restriction after vertical Gysin.', undefined, 'definition')],
    root: node('numerical-conclusion', 'ν is rational linear, representative-independent, and ker ν = ker Ob', finiteSource('FD17: r17fd:numerical-kernel'),
      'This equality is conditional on VT17, the numerical detector, actual covariance, and dominant and full finite-constant injection.',
      gate('all', 'ALL well-definedness and two kernel inclusions',
        'The source proves an equality of kernels, not merely a finite list of possible numerical tests.',
        [finiteSource('FD17: proof of numerical-kernel lemma')], [
          node('coordinates-well-defined', 'Changing the Chow extension does not change ν', finiteSource('FD17: numerical-kernel proof'),
            'Two extensions differ by actual rational vertical cycles Σjᵢ*uᵢ. Their restrictions differ by Aᵣ₋₁u, which annihilates ker Aₙ₋ᵣ by transpose duality. Adding extensions gives rational linearity.'),
          node('obstruction-to-period', 'Ob = 0 implies ν = 0', finiteSource('FD17: first kernel inclusion'),
            'Pull zero obstruction through finite constants and g; VT17 places the model restriction in im Aᵣ₋₁, so every coordinate against its transpose kernel vanishes.',
            gate('all', 'BOTH covariance and the reverse model comparison',
              'The necessary direction depends on VT17. It is not inferred from the existence of an arbitrary selected Green-pair construction alone.',
              [finiteSource('FD17: numerical-kernel proof, first implication')], [
                node('pullback-obstruction', 'Actual obstruction pullback and native finite-constant comparison', pairing('prop:covariance', 'Covariance interface'), 'Keep the original absolute value and the full finite-constant degree.', undefined, 'hypothesis'),
                node('vt17-necessity', 'VT17: zero obstruction forces the model image condition', finiteSource('FD17: invoked VT17 comparison'), 'This explicit comparison remains a companion hypothesis; a numerical dimension count does not replace it.', undefined, 'hypothesis'),
              ])),
          node('period-to-obstruction', 'ν = 0 implies Ob = 0', finiteSource('FD17: second kernel inclusion'),
            'Perfect numerical duality gives a vertical correction. The model detector kills the corrected upstairs curvature; two injective pullbacks then return the zero class to X/K.',
            gate('all', 'ALL correction, detection and descent steps',
              'Choose rational Chow representatives of a numerical preimage. This preserves the generic Chow class and does not require a specified cycle to pull back in proper position.',
              [finiteSource('FD17: numerical-kernel proof, converse')], [
                node('rational-correction', 'ν = 0 gives rᵣΘW ∈ im Aᵣ₋₁', finiteSource('FD17.1 and numerical-kernel proof'), 'The perfect rational component pairing identifies Cʳ/im Aᵣ₋₁ with (ker Aₙ₋ᵣ)∨. Subtract a rational vertical preimage to obtain componentwise numerical zero.'),
                node('model-detection', 'The full vertical numerical criterion kills upstairs Ob', pairing('prop:numerical', 'Numerical-model criterion'), 'All vertical testing cycles and native degrees are retained.', undefined, 'hypothesis'),
                node('two-injections', 'Dominant injection followed by full finite-constant injection', finiteSource('FD17: numerical-kernel proof'), 'First descend along g, then XL→X using m=[L:K]. No geometric sheet count is substituted.', undefined, 'hypothesis'),
              ])),
        ])),
  };

  const finiteTests = {
    id: id('finite-tests-tree'), navTitle: '3. Actual tests and exact normalization',
    title: 'Realizing every rational coordinate by an original-field actual test',
    summary: 'Framed vertical tests, a graph adjoint and the full finite trace realize the coordinates exactly, not just up to an unspecified scalar.',
    scope: 'The witness and basis are fixed before the rational cycle Z. The statement concerns all rational Chow classes locally, with no homological assumption; its comparison hypotheses remain explicit.',
    root: node('finite-tests-conclusion', 'Fixed D-closed actual periods detect strong G on the exact support', finiteSource('FD17: r17fd:finite-tests'),
      'For t=dim Vmodel, fixed η₁,…,ηt satisfy ∫Zηj=ν([Z])(vj)∈ℚ. Under this full comparison, strong G for Z is equivalent to all these periods vanishing.',
      gate('all', 'ALL construction and both directions of the criterion',
        'These finitely many forms detect the obstruction. The resulting Green identity still holds against EVERY compact actual test.',
        [finiteSource('FD17.3–10: full finite-test proof'), pairing('sub:finite-certificates', 'Reading-paper statement')], [
          node('normalized-tests', 'ηj = TrKXL/X(bj) / ([L:K] cL)', finiteSource('FD17.9–10: native calibration'),
            'Here cL=−log|πL|=cK/e(L/K). Use the extending absolute value, full field degree and literal D-closedness.',
            gate('all', 'ALL steps yielding exact rational periods',
              'The graph-adjoint equality gives ∫ZLbj=cLν. Full finite trace gives an original-K actual form; native K integration upstairs is [L:K] times native L integration, canceling the factor exactly.',
              [finiteSource('FD17.6–10: coordinate realization')], [
                node('framed-tests', 'VT17 constructs fixed global D-closed βj on Y', finiteSource('FD17.6: vertical values'), 'Choose rational basis cycles once. The framed comparison gives ∫Wβj=cL〈rᵣ[W̄],vj〉 for every W, with the same cL and the complete resolution differential.', undefined, 'hypothesis'),
                node('adjoint-transfer', 'AD17 gives global D-closed bj on XL', finiteSource('FD17.7–8: graph adjoint'), 'Against every separately closed ω, ∫XLbjω=∫Yβjg*ω. Curved Green identities and Stokes remove the global D-boundary between g*ΩZL and ΩW. No proper-position support premise is inserted.', undefined, 'hypothesis'),
                node('actual-full-trace', 'Full actual finite trace and native measure comparison', finiteSource('FD17.9–10: original-field reconstruction'), 'Trace commutes with D and pairs with every actual cycle test, including native flat lengths. This is a full actual trace input, not merely the restricted scalar–curvature trace.', undefined, 'hypothesis'),
              ])),
          node('necessity', 'Strong G forces every fixed period to vanish', finiteSource('FD17: necessity in the criterion'),
            'Projectivity makes each global ηj compact as a test. Insert Dηj=0 into the strong Green identity; its residue term is therefore zero.'),
          node('sufficiency', 'Zero periods give zero obstruction and the prescribed Green form', diagram(c, 'numerical-conclusion', 'Exact numerical-kernel proof'),
            'A basis makes zero periods equivalent to ν=0. The kernel comparison gives Ob=0; the supported pair and global actual primitive correct the very specified Z.', undefined, 'conditional', [diagram('kernel-domain', 'local-conclusion', 'Exact-support correction proof')]),
        ])),
  };

  const ci = {
    id: id('ci-tree'), navTitle: '4. Differences of complete intersections',
    title: 'Extending a complete-intersection Green difference across canceled components',
    summary: 'A supplied comparison certificate produces a relative Aeppli decomposition; a support-controlled cutoff turns it into an exact-support Green form.',
    scope: 'Fix n≥r≥3, one allowed metric on the same line bundle L, and two regular rank-r section tuples s₀,s₁. Let Yi=V(si) with full scheme multiplicities, Z=[Y₁]−[Y₀], S=|Y₀|∪|Y₁|, U=Xᵃⁿ∖|Z|, W=Xᵃⁿ∖S and CU=S∩U.',
    root: node('ci-main', 'The exact-support Green difference has global height zero', pairing('prop:ci-cancellation', 'Cancellation-safe complete-intersection difference'),
      'Under one of the specified comparison certificates, the form extends across canceled components to U. For global data, hX([Z],w)=0 for every admitted complementary w; individual local integrals may be nonzero.',
      gate('all', 'BOTH the analytic support correction and the Chow-class calculation',
        'The analytic branch constructs a form for the specified difference cycle. The algebraic branch independently shows its global Chow class is zero.',
        [pairing('prop:ci-cancellation', 'Full proposition and proof'), pairing('sub:ci-certificates', 'Scope of the certificates')], [
          node('ci-exact-form', 'A strong actual Green form on U, with no extra deleted support', pairing('prop:ci-cancellation', 'Relative support argument'),
            'Start with G₁−G₀ on W. Near CU, subtract derivatives of cutoff primitives and glue to the actual error E.',
            gate('all', 'ALL kernel, certificate and cutoff ingredients',
              'On N∩W the certificate gives G₁−G₀=d′α+d″β+E. With ζ supported closed in U inside N and equal to 1 near CU, subtract d′ext₀(ζα)+d″ext₀(ζβ). It equals E near CU and is actual there.',
              [pairing('prop:ci-cancellation', 'Exact-support gluing proof')], [
                node('ci-curved-kernels', 'The two complete-intersection kernels have the SAME curvature Rʳ', pairing('eq:ci-kernel', 'Complete-intersection Green kernel'),
                  'φs=minᵢ(−log∥si∥), As=R−Dφs, and Gs=φsΣAsʲRʳ⁻¹⁻ʲ. The all-test identity is D[Gs]+δYs=[Rʳ], with nonreduced multiplicities. Their difference is initially defined only on W.', undefined, 'hypothesis'),
                node('ci-relative-decomposition', 'A valid certificate gives a relative Aeppli decomposition near CU', diagram(c, 'ci-certificate-conclusion', 'Two certificate routes'),
                  'The certificate must be supplied in the precise analytic-matrix or conormal-word form. Rational equivalence by itself is not this datum.', undefined, 'conditional', [pairing('prop:ci-cancellation', 'Certificate statement')]),
                node('ci-cutoff-stokes', 'Relative-support cutoff, extension by zero and all-test Stokes', pairing('prop:ci-cancellation', 'Cutoff and Stokes proof'),
                  'Retain support closed in U, ζ=1 near the canceled locus, and the differentiated partition terms. The source relative-support Stokes theorem proves the identity on every actual test.', undefined, 'hypothesis'),
              ])),
          node('ci-chow-zero', '[Y₁]=[Y₀]=c₁(L)ʳ, so [Z]=0 in Chow', pairing('prop:ci-cancellation', 'Final Chow calculation'),
            'Each regular zero scheme represents cr(L⊕r)∩[X], with its original multiplicities. Global Chow descent and bilinearity then give zero height against every admitted complementary class.',
            gate('all', 'BOTH the common Chow class and the existing height',
              'Use equality in rational Chow and the kernel-domain height on classes, rather than claiming that every local representative integral vanishes.',
              [pairing('prop:ci-cancellation', 'Last paragraph of the proof'), height('r16h:global-height', 'Descent to Chow classes')], [
                node('ci-common-bundle', 'Both tuples are regular sections of the SAME L⊕r', pairing('sub:ci-certificates', 'Complete-intersection setup'), 'The metric is also fixed for the analytic curvature cancellation.', undefined, 'hypothesis'),
                node('ci-height-input', 'The complementary class is admitted for the global height', diagram('kernel-domain', 'main', 'Kernel height proof'), 'All global reciprocity hypotheses and the complementary local-kernel condition remain necessary.', undefined, 'hypothesis'),
              ])),
        ])),
  };

  const ciCertificates = {
    id: id('ci-certificates-tree'), navTitle: '5. The two allowed cancellation certificates',
    title: 'Which comparison data justify crossing the canceled locus',
    summary: 'The ordinary analytic three-row matrix and the finite conormal word are alternative sufficient certificates; neither is inferred from rational equivalence.',
    scope: 'Keep the complete-intersection setup and CU from the preceding tree, n≥r≥3. All coefficient lifts, row labels, inverses, cap offsets and partitions specified by the source are part of the certificate.',
    root: node('ci-certificate-conclusion', 'G₁−G₀=d′α+d″β+E near the canceled locus, with E actual across it', pairing('prop:ci-cancellation', 'Relative Aeppli conclusion'),
      'This is the local decomposition needed by the support-controlled cutoff construction. The α and β primitives are actual on the overlap with W; E is actual across CU.',
      gate('any', 'ANY one of the TWO supplied certificates',
        'Each branch retains all of its comparison data. The theorem does not assert that arbitrary pairs of regular tuples admit one of these certificates.',
        [pairing('prop:ci-cancellation', 'The two hypotheses and their proofs')], [
          node('ci-three-row', 'An exact analytic three-row comparison with a two-pivot cover', pairing('prop:ci-cancellation', 'Certificate (i)'),
            'On an ordinary analytic neighbourhood N of CU, s₁=M s₀ with an invertible three-row block and identity elsewhere. The specified first-column entries a,d have nonvanishing opens covering CU.',
            gate('all', 'ALL exact matrix and relative-face inputs',
              'Apply the relative three-row face identities and glue with a two-pivot partition controlled by v(d)−v(a). Its derivative and mixed terms are retained in E.',
              [pairing('prop:ci-cancellation', 'Proof for the analytic matrix')], [
                node('ci-exact-matrix', 'The exact matrix identity and the two-pivot cover are supplied', pairing('prop:ci-cancellation', 'Analytic matrix hypothesis'), 'Invertibility, the active three rows, identity on all other rows and the specified pivot cover are part of the hypothesis.', undefined, 'hypothesis'),
                node('ci-face-identities', 'The companion relative three-row face identities', pairing('prop:ci-cancellation', 'Invoked face identities'), 'They provide the complete relative primitives and include the differentiated partition and mixed-face contributions.', undefined, 'hypothesis'),
              ])),
          node('ci-conormal-word', 'A finite supplied word for the reduced conormal comparison', pairing('prop:ci-cancellation', 'Certificate (ii)'),
            'On a Zariski neighbourhood of CU the two ideals agree. The reduced conormal comparison is a finite ordered word in shears, one-entry units, invertible two-row blocks, and allowed three-row blocks.',
            gate('all', 'ALL word, lift and germ-compatibility inputs',
              'Lift the same ordered word locally and execute it on the actual intermediate tuples. The coefficient-uniform germ theorem makes the complete primitive germs agree across lifts; a locally finite partition glues them.',
              [pairing('prop:ci-cancellation', 'Proof for the conormal word')], [
                node('ci-fixed-word', 'The full word, coefficients, inverses and common partition data', pairing('prop:ci-cancellation', 'Conormal-word hypothesis'), 'At each fixed word position all coefficient lifts use the SAME cap offsets and inner/outer partitions; every three-row block retains its two-pivot cover.', undefined, 'hypothesis'),
                node('ci-identity-error', 'The final discrepancy is 1+E₀ with E₀ vanishing on the reduced zero scheme', pairing('prop:ci-cancellation', 'End-of-word discrepancy'), 'Shrink until ∥E₀∥<1. The tuple sup norm and the entire complete-intersection expression are then unchanged; this does not replace the original nonreduced cycles by their reductions.'),
                node('ci-uniform-germs', 'Coefficient-uniform primitive germs and locally finite gluing', pairing('prop:ci-cancellation', 'Germ stability and gluing'), 'The complete primitive germs, not only currents or pointwise values, agree on overlaps. The differentiated discrepancy extends by zero.', undefined, 'hypothesis'),
              ])),
        ])),
  };
  return {
    caseId: c, trees: [global, numerical, finiteTests, ci, ciCertificates],
    coverage: [
      { title: 'A period criterion for individual cycle classes', treeId: global.id, nodeId: id('main'), source: pairing('sub:finite-certificates', 'Fixed finite-period criterion') },
      { title: 'Differences of complete intersections', treeId: ci.id, nodeId: id('ci-main'), source: pairing('prop:ci-cancellation', 'Cancellation-safe complete-intersection proposition') },
    ],
    sourceBindings: [
      pairingBinding(['sub:finite-certificates', 'sub:ci-certificates', 'eq:ci-kernel', 'prop:ci-cancellation']),
      { file: sourceFile(finiteFile), sha256: 'f87ec78c73824e24ea21ab435873c9d29b6a878d3021148448565f9a91529895', locators: ['r17fd:spaces', 'r17fd:coordinates', 'r17fd:numerical-kernel', 'r17fd:finite-tests', 'r17fd:adjoint', 'r17fd:normalized-test', 'r17fd:native-calibration', 'r17fd:global-finite'] },
    ],
  };
}

export const progressProofCore = [
  kernelDomain(),
  algebraicallyTrivial(),
  endpoints(),
  individualCertificates(),
];
