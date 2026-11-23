// Current-only proof-reading diagrams for the model, family and arithmetic cases.
// Model and descent arguments retain their immutable v0.5.1 source bindings.
// Analytic steps use the audited v0.5.3 propositions and kernel-domain height theorem.
// Every edge is a stated inference with its full local scope, not a dependency-array edge.
const paper = (slug, anchor, label) => ({ href: `/papers/${slug}${anchor ? '#' + anchor : ''}`, label });
const P = (anchor, label) => paper('pairing-constructions', anchor, label);
const A = (anchor, label) => paper('arithmetic-reductions', anchor, label);
const Q = (anchor, label) => paper('arithmetic-conjectures', anchor, label);
const H = (anchor, label) => paper('global-height-pairing', anchor, label);
const M = (anchor, label) => paper('determinant-metrics', anchor, label);
const G = (kind, label, explanation, sources, children, rules = {}) => ({
  kind, label, explanation, sources: Array.isArray(sources) ? sources : [sources], children,
  ...(Object.keys(rules).length ? { rules: Object.keys(rules), ruleNotes: rules } : {}),
});
function factory(caseId) {
  const id = key => `proof-${caseId}-${key}`;
  const N = (key, title, source, note, gate, status = 'conditional') => ({
    id: id(key), title, href: typeof source === 'string' ? source : source.href, status, note,
    ...(gate ? { gate } : {}),
  });
  const L = (key, title, target, note, status = 'conditional') => N(key, title, '#' + id(target), note, undefined, status);
  const T = (key, title, summary, scope, root, related = []) => ({
    id: id(key + '-tree'), navTitle: title, title, summary, scope, root, ...(related.length ? { related } : {}),
  });
  const C = (title, tree, target, source) => ({ title, treeId: id(tree + '-tree'), nodeId: id(target), source });
  return { id, N, L, T, C };
}
const localScope = 'K/ℚₚ is the original finite extension with its prescribed absolute value. X is smooth projective geometrically integral. Retain the actual obstruction, exact support complement, full actual tests, native residue degrees and complete finite degrees. Actual numerical detection and native covariance are proved in this scope. Each model, numerical lift and additional period or stratum comparison must satisfy the conditions stated in its branch.';
const heightScope = 'Over a number field F, use geometrically homologically trivial rational Chow classes, complementary r+s=dim(X)+1, absolute height normalization, and BOTH local-kernel domains ℋʳ(X) and ℋˢ(X). H16 constructs the height and HA16 gives adjunction on these domains; MM16 compares supplied admissible model lifts. Local auxiliary fields are descended before the global sum. Membership of arbitrary homological classes and existence of admissible models remain separate requirements.';
const arithmeticScope = 'Fix a pointed product of curves, its positive integral product polarization and the projected integral images in the geometric rational Chow group. Every height assertion assumes H1–H4 on the required products, correspondence sources and finite extensions; no proof status is promoted.';

function numericalModels() {
  const { N, L, T, C } = factory('numerical-models');
  const numerical = P('prop:numerical', 'Proposition: finite numerical-model detection');
  const assembly = T('assembly', 'Numerical corrections and the global pairing',
    'Vertical numerical vanishing gives native obstruction zero; both complementary local kernels then give the height domain.', heightScope,
    N('main', 'A pairing on the numerically certified subgroups', P('sec:models', 'Model criteria'),
      'The full product Vʳ(X) × Vˢ(X) is obtained only when every class in BOTH degrees has the required certificates at every finite place.',
      G('all', 'BOTH local membership and the admitted-domain height theorem',
        'Local vanishing identifies the two subgroups contained in ℋ. The separate reciprocity theorem supplies the pairing, its Chow descent and its absolute normalization.',
        [P('lem:two-degrees', 'The two-degree criterion'), P('hyp:height-input', 'Theorem: admitted-domain reciprocity')], [
          N('both-domains', 'The certified classes lie in ℋʳ(X) and ℋˢ(X)', P('lem:two-degrees', 'Both localizations'),
            'Check every finite completion; checking only one degree supplies only that factor of the pairing.',
            G('all', 'Apply the local argument to EACH class in BOTH degrees at EACH finite place',
              'The definition of ℋ is the intersection of these native local kernels.', P('lem:two-degrees', 'Kernel intersection'), [
                N('native-zero', 'The original local obstruction is zero', P('sec:models', 'Dominant numerical witnesses'),
                  'A positive-relative-dimensional witness is permitted only with the stated dominant obstruction detector. Finite numerical descent retains the complete extension degree.',
                  G('all', 'Numerical detection upstairs AND legitimate descent',
                    'The pure operational character has the prescribed generic class and zero degree on every vertical test. The model detector kills its actual curvature; dominant detection and finite-field injectivity descend zero.',
                    [numerical, P('sub:covariance', 'Native covariance and degrees')], [
                      N('vertical-certificate', 'A pure operational lift with all vertical degrees zero', numerical,
                        'The character equals the pulled-back cycle in degree r and vanishes in other degrees. Every integral vertical r-cycle is tested, with its native multiplicity and residue degree.', undefined, 'hypothesis'),
                      N('descent', 'Native dominant detection and full-degree finite descent', P('sec:models', 'General witness formulation'),
                        'The witness is smooth and projective over the specified finite extension. Preserve the original valued field; the finite push–pull scalar is [L:K].', undefined, 'proved'),
                    ])),
              ])),
          N('height-input', 'The Green, residue and global reciprocity construction', P('hyp:height-input', 'Theorem: height on both local-kernel domains'),
            'On ℋʳ(X)×ℋˢ(X), the proved theorem gives good-place vanishing, archimedean terms, symmetry, rational-equivalence descent and finite number-field invariance. Each class must first satisfy every local kernel condition.', undefined, 'proved'),
        ])));
  const scalar = T('scalar', 'One-dimensional Gysin images',
    'The component degrees form a zero-sum vector; a weighted Laplacian corrects all of them at once.', localScope + ' The supplied regular projective reduced strictly semistable model has n≥3, smooth geometrically integral components and smooth closed strata.',
    N('scalar-main', 'Every homologically trivial codimension-r class has zero obstruction', P('prop:scalar-model', 'Scalar total boundary image'),
      'Fix 1≤r≤n and an invertible coefficient prime. The TOTAL sum of Gysin images at each component must have dimension one.',
      G('all', 'The corrected numerical lift AND the numerical-model input',
        'A zero component cycle class has zero numerical degree against every vertical test, so the numerical-model criterion applies.', P('prop:scalar-model', 'Proof of scalar correction'), [
          N('scalar-correction', 'Θad = Θ − Σᵢ vᵢ iᵢ*Hᵢʳ⁻¹ has zero component classes', P('prop:scalar-model', 'Corrected extension'),
            'The correction is vertical, so the generic cycle is unchanged. A common change of all vᵢ adds the principal total-fibre class times Hʳ⁻¹.',
            G('all', 'Degree cancellation AND one-dimensional detection',
              'Specialization places each component class in its total Gysin image. In that one-dimensional image, degree against Hᵢⁿ⁻ʳ detects the class.', P('prop:scalar-model', 'Specialization and detection'), [
                N('scalar-laplacian', 'Rational coefficients solve Σⱼ wᵢⱼ(vⱼ−vᵢ)=λᵢ', P('prop:scalar-model', 'Weighted graph equation'),
                  'Here λᵢ=degₖ(iᵢ!Θ·Hᵢⁿ⁻ʳ), and wᵢⱼ=degₖ(H|Eᵢⱼ)ⁿ⁻¹, summing disconnected intersections with residue degrees.',
                  G('all', 'The zero-sum condition AND the connected positive weighted graph',
                    'The weighted Laplacian has kernel the constants and image the vectors with total sum zero; all coefficients are rational.', P('prop:scalar-model', 'Laplacian solvability'), [
                      N('scalar-trace', 'Specialization trace gives Σᵢ λᵢ=0', P('prop:scalar-model', 'Trace identity'), 'Choose a Chow extension of the specified geometrically homologically trivial generic cycle.', undefined, 'hypothesis'),
                      N('scalar-graph', 'The dual graph is connected and wᵢⱼ>0 on its edges', P('prop:scalar-model', 'Connectedness and ample weights'), 'One relatively ample H supplies the intersection weights.', undefined, 'hypothesis'),
                    ])),
                N('scalar-one-dimensional', 'Each total Gysin image is one-dimensional', P('prop:scalar-model', 'Full component hypothesis'), 'The condition is imposed on the sum over all adjacent strata, not separately on each summand.', undefined, 'hypothesis'),
              ])),
          N('scalar-detector', 'Every supplied pure numerical lift has zero actual curvature', numerical, 'The proved detector uses the exact operational degree and zero intersection with EVERY vertical testing cycle. The preceding model correction must supply that lift.', undefined, 'proved'),
        ])));
  const twoFactor = T('two-factor', 'The two-factor hypersurface model',
    'The blowup of (A,ϖ) produces the two components used in the scalar calculation.', localScope,
    N('two-factor-main', 'The supplied AB+ϖG degeneration has all-degree vanishing', P('eq:two-factor-model', 'Two-factor degeneration'),
      'deg A=a, deg B=b and deg G=a+b; the generic hypersurface and all specified strata are smooth and geometrically integral.',
      G('all', 'The scalar calculation AND the transverse blowup geometry',
        'The component and restriction computations verify the scalar-image hypothesis in every degree, so the preceding graph correction applies degree by degree.', P('eq:two-factor-model', 'Blowup and restriction calculation'), [
          L('two-factor-scalar', 'Apply the scalar-image criterion in each degree', 'scalar-main', 'The connected two-vertex graph and native intersection degrees are those of the actual resolved model.'),
          N('two-factor-components', 'Components: BlΣ(A=0) and (B=0), meeting in (A=B=0)', P('eq:two-factor-model', 'The actual model'),
            'Σ=(A=B=G=0). Blowing up the ideal (A,ϖ) produces these components; the companion computation retains their restriction and Gysin maps.',
            G('all', 'The specified transverse strata and generic smoothness',
              'The normal-crossings model is obtained for these supplied equations, with the stated integral strata.', P('eq:two-factor-model', 'Geometric hypotheses'), [
                N('two-factor-data', 'The A, B, intersection and Σ strata satisfy the supplied smoothness hypotheses', P('eq:two-factor-model', 'Stratum conditions'), 'Require all the smooth transverse geometrically integral strata in the equation, not only a smooth generic fibre.', undefined, 'hypothesis'),
              ])),
        ])));
  const positive = T('positive', 'Positive primitive intersection forms on fourfolds',
    'A weighted zero sum of positive primitive self-intersections annihilates the complete residual.', localScope + ' The original variety and its dominant witness have dimension four; the model has SNC support and positive multiplicities mᵢ.',
    N('positive-main', 'The original fourfold has vanishing obstruction in every degree', P('prop:positive-model', 'Positive primitive components'),
      'Codimension two comes from the numerical residual; divisors, one-cycles and zero-cycles supply the other degrees.',
      G('all', 'Codimension two AND the endpoint and one-cycle cases',
        'These cover degrees 1,2,3,4 on a fourfold.', [P('prop:positive-model', 'Fourfold conclusion'), P('prop:endpoint-input', 'Endpoint and one-cycle input')], [
          N('positive-codim-two', 'The codimension-two operational lift is numerically admissible', P('prop:positive-model', 'Residual correction'),
            'The companion correction theorem constructs a canonical primitive residual Rᵢ on each component.',
            G('all', 'Every primitive residual vanishes AND witness descent applies',
              'Zero residual completes the vertical numerical correction. The original-field detector then kills the obstruction.', P('prop:positive-model', 'Completion of the correction'), [
                N('positive-residual-zero', 'Rᵢ=0 on every component', P('prop:positive-model', 'Positive sum argument'),
                  'Every term mᵢ deg(Rᵢ²) is nonnegative; their sum is zero, so positive definiteness forces each vector to vanish.',
                  G('all', 'The weighted residual identity AND strict primitive positivity',
                    'Retain the native constant-field factors in Σᵢmᵢdeg(Rᵢ²)=0 and mᵢ>0.', P('prop:positive-model', 'Primitive-residual identity'), [
                      N('positive-identity', 'Σᵢmᵢdeg(Rᵢ²)=0 for Rᵢ∈ker(H:N²(Dᵢ)→N³(Dᵢ))', P('prop:positive-model', 'Companion residual theorem'), 'The residual theorem is a supplied model input.', undefined, 'hypothesis'),
                      N('positive-form', 'deg(xy) is positive definite on every P²_H(Dᵢ)', P('prop:positive-model', 'Positivity hypothesis'), 'The statement is over rational numerical classes; the supplied list includes abelian fourfolds and the stated projective-bundle hosts.', undefined, 'hypothesis'),
                    ])),
                N('positive-witness', 'Numerical detection and dominant witness descent apply to the supplied lift', numerical, 'Given the corrected pure lift, the proved detector and native covariance descend its zero obstruction. Preserve the finite extension and every multiplicity of the supplied smooth projective dominant witness.', undefined, 'proved'),
              ])),
          N('positive-endpoints', 'Degrees 1,3,4 are covered by endpoint and one-cycle vanishing', P('prop:endpoint-input', 'Remaining fourfold degrees'), 'The proved divisor, one-cycle and zero-cycle cases apply on the original smooth projective fourfold, with its original valued field and all actual tests.', undefined, 'proved'),
        ])));
  const symmetry = T('symmetry', 'Multiplicity-free finite-group actions',
    'The invariant residual is totally isotropic; a multiplicity-free nondegenerate representation has no such nonzero submodule.', localScope + ' The regular projective model has n≥4 and a finite group preserving the numerical ample class H.',
    N('symmetry-main', 'The selected codimension-two classes have zero obstruction', P('prop:symmetry-model', 'Finite model symmetries'),
      'For the full primitive representation this covers every homological codimension-two class. For a central isotypic projector e, it covers the corresponding eCH² subgroup.',
      G('all', 'Residual zero AND numerical correction with descent',
        'The equivariant residual theorem is applied on the same actual model and the same rational representation.', P('prop:symmetry-model', 'Symmetry proof'), [
          N('symmetry-zero', 'The invariant totally isotropic residual image is zero', P('prop:symmetry-model', 'The representation argument'),
            'Q(x,y)=Σᵢmᵢdeg(xᵢyᵢHᵢⁿ⁻⁴), on P²_H=⊕ᵢker(Hⁿ⁻³:N²(Dᵢ)→Nⁿ⁻¹(Dᵢ)).',
            G('all', 'Invariant isotropy AND no nonzero invariant isotropic summand',
              'An invariant submodule is a sum of simple summands. Each such summand is nondegenerate, so none can lie in a totally isotropic submodule.', P('prop:symmetry-model', 'Canonical residual and Schur decomposition'), [
                N('symmetry-isotropy', 'The canonical residual image is invariant and totally isotropic', P('prop:symmetry-model', 'Equivariant residual theorem'), 'This is the supplied equivariant residual identity, not a consequence of group action alone.', undefined, 'hypothesis'),
                N('symmetry-simple', 'Distinct simple summands are orthogonal and each is nondegenerate', P('prop:symmetry-model', 'Rational representation calculation'),
                  'Averaging a positive rational form makes every rational simple finite-group representation self-dual; multiplicity-freeness and nondegeneracy of Q give the claim.',
                  G('all', 'Multiplicity-free representation AND nondegenerate invariant Q',
                    'The same argument applies to eP²_H when the hypotheses hold on that selected sector.', P('prop:symmetry-model', 'Exact representation hypotheses'), [
                      N('symmetry-hypotheses', 'The relevant rational primitive representation is multiplicity-free and Q is nondegenerate', P('prop:symmetry-model', 'Representation and intersection conditions'), 'In dimension four, numerical duality and divisor Hodge index supply nondegeneracy.', undefined, 'hypothesis'),
                    ])),
              ])),
          N('symmetry-descent', 'Zero residual supplies an admissible lift to which native descent applies', numerical, 'The residual-to-lift construction remains a supplied model condition. Once that lift is given, the numerical detector and native obstruction descent are proved.', undefined, 'hypothesis'),
        ])), [
      N('symmetry-fourfold', 'In dimension four the full-group criterion gives every complementary height', P('prop:symmetry-model', 'Fourfold and subgroup consequences'),
        'For a restricted e-sector in higher dimension, the resulting subgroup pairs with the admitted complementary group.',
        G('all', 'The codimension-two conclusion AND the other degrees at every completion',
          'Fourfold endpoint and one-cycle vanishing supplies degrees 1,3,4; the two-degree criterion then supplies the full pairings.', [P('prop:symmetry-model', 'Fourfold completion'), P('lem:two-degrees', 'Global assembly')], [
            L('symmetry-fourfold-input', 'Full codimension-two vanishing at each completion', 'symmetry-main', 'Use e=1 and n=4, with the model hypotheses satisfied at every finite place.'),
            N('symmetry-other-degrees', 'Endpoint and one-cycle vanishing, followed by kernel-domain reciprocity', P('prop:endpoint-input', 'Remaining degrees'), 'The proved local cases cover degrees 1,3,4. H16 supplies the height once BOTH complementary classes belong to every local kernel; the codimension-two model conditions remain required at every finite place.', undefined, 'proved'),
          ])),
    ]);
  return {
    caseId: 'numerical-models', trees: [assembly, scalar, twoFactor, positive, symmetry],
    coverage: [
      C('Numerical corrections on regular models', 'assembly', 'main', P('sec:models', 'Model criteria')),
      C('One-dimensional Gysin images', 'scalar', 'scalar-main', P('prop:scalar-model', 'Scalar total boundary image')),
      C('Positive primitive intersection forms on fourfolds', 'positive', 'positive-main', P('prop:positive-model', 'Positive primitive components')),
      C('Multiplicity-free finite-group actions', 'symmetry', 'symmetry-main', P('prop:symmetry-model', 'Finite model symmetries')),
    ],
    sourceBindings: [],
  };
}

function reductionStrata() {
  const { N, L, T, C } = factory('reduction-strata');
  const ordinary = P('thm:ordinary', 'Ordinary-reduction theorem and proof');
  const strata = P('thm:abelian-strata', 'All closed strata theorem and proof');
  const degenerate = P('thm:totally-degenerate', 'Totally degenerate strata theorem and proof');
  const assembly = T('assembly', 'From placewise models to global heights',
    'A full local criterion is chosen separately at every finite place; its original-field vanishing supplies both global factors.', heightScope,
    N('main', 'Every complementary homological pair has a height', P('sub:ordinary-reduction', 'Good or ordinary reduction and global assembly'),
      'The local witnesses and their auxiliary extensions may depend on the place. Each chosen model criterion retains all of its geometric and comparison conditions; H16 supplies the height once both local-kernel memberships have been established.',
      G('all', 'All finite completions AND the admitted-domain reciprocity theorem',
        'Each local criterion gives every codimension, so both r and n+1−r lie in the intersection of the local kernels.', [P('lem:two-degrees', 'Both complementary groups'), P('hyp:height-input', 'Theorem: kernel-domain reciprocity')], [
          N('placewise', 'At EACH finite place, one applicable full local criterion holds', P('sec:models', 'Alternative local model criteria'),
            'For a fixed variety, the choice of criterion can vary with the finite place.',
            G('any', 'Choose an applicable local criterion, including all of its hypotheses',
              'Each of these separately gives native vanishing in every codimension; the alternatives are not required simultaneously.', [ordinary, strata, degenerate], [
                N('good', 'A supplied smooth projective good-reduction model', ordinary,
                  'For dimension at least three, the ordinary theorem includes the case of no singular points. In smaller dimensions use the endpoint and one-cycle cases.', undefined, 'hypothesis'),
                L('ordinary-link', 'The ordinary quadratic criterion', 'ordinary-main', 'Use the complete ordinary model, including characteristic two and its dominant-witness variant.'),
                L('strata-link', 'The all-strata criterion, including Drinfeld presentations', 'strata-main', 'Every connected closed geometric stratum and the full weight–monodromy input are required.'),
                L('degenerate-link', 'The totally degenerate criterion', 'degenerate-main', 'Supply all integral cycle-class and primitive positivity hypotheses on the actual witness.'),
              ])),
          N('global-input', 'The proved height and reciprocity construction on both local kernels', P('hyp:height-input', 'Theorem: global kernel-domain height'),
            'Once both classes lie in every native local kernel, H16 gives good-place vanishing, archimedean terms, absolute normalization and rational-equivalence descent. The placewise model hypotheses still establish the required membership.', undefined, 'proved'),
        ])));
  const ordinaryTree = T('ordinary', 'Ordinary quadratic singularities',
    'Resolve an actual ordinary local model into a reduced quadric forest, correct numerically, and descend the native obstruction.', localScope + ' dim X=n≥3. The supplied integral flat projective model has integral geometric special fibre, smooth except at finitely many ordinary quadratic points with smooth projectivized tangent quadrics.',
    N('ordinary-main', 'All homological classes on the original X have zero obstruction', ordinary,
      'The same argument treats a supplied smooth projective dominant witness after finite extension and ALL new classes after EVERY finite valued extension.',
      G('all', 'A numerically corrected forest AND full-degree witness descent',
        'The companion forest criterion makes all vertical numerical tests vanish. Its original-field detector and finite descent kill the original obstruction.', ordinary, [
          N('ordinary-forest', 'A regular reduced quadric forest with compatible numerical corrections', ordinary,
            'Use the applicable characteristic and dimension calculation; none is omitted at residue two.',
            G('any', 'The appropriate residue-characteristic branch',
              'These branches cover odd residue characteristic, residue two with odd dimension, and residue two with even dimension n≥4.', ordinary, [
                N('ordinary-odd-p', 'Odd residue characteristic: normal form and reduced-point blowups', ordinary,
                  'After finite extension, the supplied normal-form calculation gives the quadric forest and its actual incidence-compatible numerical correction.', undefined, 'hypothesis'),
                N('ordinary-odd-n', 'Residue two, odd n: the all-characteristic quadric-forest theorem', ordinary,
                  'This is the stated companion theorem for odd-dimensional ordinary models, not the even-dimensional normal-form calculation.', undefined, 'hypothesis'),
                L('ordinary-even-n', 'Residue two, even n≥4: the explicit degenerate-node chain', 'node-chain', 'The separate tree retains the actual étale equation, the finite order q and the q blowups.'),
              ])),
          N('ordinary-native-descent', 'Descent divides by the COMPLETE common field degree', P('sub:covariance', 'Native finite and dominant detection'),
            'The proved native covariance and full-degree finite descent return zero obstruction to the original field with its fixed absolute value. The prescribed Green-pair theorem then supplies the exact-support correction. The numerical forest and its witness remain the stated model inputs.', undefined, 'proved'),
        ])), [
      N('ordinary-new-cycles', 'The construction reapplies to all new cycles after every finite extension', ordinary,
        'This statement is stronger than compatibility only for pullbacks of old cycles.',
        G('all', 'Persistence of ordinary geometric points AND a new correction for the specified cycle',
          'The orders may increase but remain finite. Rerun the forest construction and descend from the new common auxiliary field.', ordinary, [
            N('ordinary-persistence', 'Ordinary geometric special points persist, with possibly larger finite orders', ordinary, 'The original local model is pulled to the new valued field; the companion construction repairs it.', undefined, 'hypothesis'),
            L('ordinary-rerun', 'Apply the native forest argument anew', 'ordinary-main', 'Its input is the newly specified homological class over the new field.'),
          ])),
    ]);
  const characteristicTwo = T('characteristic-two', 'The even-dimensional characteristic-two chain',
    'The finite normal-form order is reduced one step at each actual point blowup; the final chain has the prescribed intersection strata.', localScope + ' Residue characteristic two and even n≥4, with finitely many ordinary quadratic points.',
    N('node-chain', 'A reduced quadric chain meeting the forest criterion', ordinary,
      'After q blowups there are q−1 copies of ℙ_E(𝒪_E⊕𝒪_E(−1)) and one terminal smooth quadric. All multiplicities are one.',
      G('all', 'The exact q-step blowup calculation AND the smooth double strata',
        'Intermediate sections are disjoint; every double stratum is the smooth odd-dimensional quadric E. These are the strata used by the numerical forest criterion.', ordinary, [
          N('node-order', 'Each reduced-point blowup lowers q by exactly one', ordinary,
            'The companion calculation is made on common pointed étale neighbourhoods, with saturated blowup charts.',
            G('all', 'Actual pointed étale normal form AND its saturated blowup calculation',
              'A common finite extension splits all the finitely many node polynomials. Integral-root translation then gives the required actual equation.', ordinary, [
                N('node-equation', 'P(x₁,…,xₙ)+z²+εϖᵠz=0, with q≥1 and ε a unit', ordinary,
                  'P has unimodular polar form. The valuation ring and uniformizer belong to the common auxiliary field.', undefined, 'hypothesis'),
                N('node-charts', 'The exact common étale and saturated blowup calculation', ordinary,
                  'Use the stated companion normal-form and native degenerate-node-chain input.', undefined, 'hypothesis'),
              ])),
          N('node-quadrics', 'E: P̄(X)+Z²=0; terminal T: P̄(X)+Z²+ε̄ZS=0', ordinary,
            'E⊂ℙⁿ is smooth and odd-dimensional; T⊂ℙⁿ⁺¹ is smooth. Their actual geometry and incidence supply the forest hypotheses.', undefined, 'hypothesis'),
        ])));
  const allStrata = T('strata', 'Semistable models with abelian-type strata',
    'An algebraic inner inverse of incidence gives kernel lifting on all mixed summands; weight–monodromy provides the separate odd-weight condition.', localScope + ' Y and T are smooth projective geometrically integral; Y has the supplied regular projective reduced strictly semistable model and T has potentially good projective reduction.',
    N('strata-main', 'T×Y has all-degree vanishing, also for every new cycle over every finite extension', strata,
      'Every connected CLOSED geometric stratum must have a rational Chow motive of abelian type after finite constants. Require weight–monodromy for Y in every degree and every invertible coefficient prime.',
      G('all', 'The three companion-model conditions AND native descent',
        'The ramified repair preserves the model hypotheses. Apply the companion criterion after a common extension, then descend with the complete degree and correct the original newly specified support.', strata, [
          N('strata-conditions', 'Odd weights, numerical-kernel lifting and actual-span saturation', strata,
            'The three conditions have distinct sources; weight–monodromy alone does not supply the algebraic inner inverse.',
            G('all', 'Weight–monodromy AND an all-summand algebraic inner inverse',
              'Weight–monodromy gives the odd-weight condition. The inner inverse yields both numerical-kernel lifting and actual-span saturation.', strata, [
                N('strata-weights', 'Weight–monodromy in every degree and every invertible prime', strata, 'This is an explicit hypothesis on Y.', undefined, 'hypothesis'),
                N('strata-inverse', 'An algebraic inner inverse acts on ALL mixed Künneth summands', strata,
                  'Tensor the boundary inverse with the diagonal of the good coefficient T.',
                  G('all', 'One abelian carrier AND the coefficient diagonal',
                    'Numerical semisimplicity and its comparison prime produce the cohomological inner inverse as an algebraic correspondence on that carrier.', strata, [
                      N('strata-carrier', 'The closed strata share the supplied abelian-type carrier and comparison', strata, 'Include numerical semisimplicity and the specified comparison prime, not only a decomposition of vector spaces.', undefined, 'hypothesis'),
                      N('strata-coefficient', 'After finite extension T is good and all strata split', strata, 'The actual coefficient diagonal retains all mixed summands.', undefined, 'hypothesis'),
                    ])),
              ])),
          L('strata-repair-input', 'The ramified semistable repair retains the closed-stratum property', 'repair-main', 'This makes the argument applicable to every newly specified cycle and finite valued extension.'),
          N('strata-detector', 'The companion model criterion and complete-degree native descent', strata, 'The companion stratum criterion still must supply the required numerical lift. Its subsequent actual detection, complete-degree native descent and exact-support curved-pair correction are proved.', undefined, 'hypothesis'),
        ])));
  const repair = T('repair', 'Why ramified repair preserves the stratum condition',
    'Toroidal factorization expresses the repaired strata through operations that preserve actual rational Chow motives of abelian type.', localScope,
    N('repair-main', 'Every closed geometric stratum of the repaired projective model remains of abelian type', strata,
      'Apply the supplied ramified all-strata theorem, retaining actual transition functions and the primitive character lattice.',
      G('all', 'Toroidal factorization AND stability under its actual geometric operations',
        'New strata are built from projective bundles and blowups of old boundary strata. The closed-boundary blowup property is used in both directions.', strata, [
          N('repair-factorization', 'New strata arise from old closed boundary strata by the stated factorization', strata, 'The new character lattice is primitive and the actual line-bundle transition functions are retained.', undefined, 'hypothesis'),
          N('repair-chow', 'The projective-bundle and blowup Chow identities preserve abelian type', strata, 'These are identities of rational Chow motives, not solely of cohomology; the reverse closed-boundary implication is also available.', undefined, 'hypothesis'),
        ])));
  const drinfeld = T('drinfeld', 'Drinfeld uniformization',
    'The actual strata are split Tate, and Ito’s theorem supplies the weight input required by the all-strata criterion.', localScope + ' Xₐ are smooth projective algebraizations of Γₐ∖Ω_Kᵈᵃ with Γₐ torsion-free, discrete and cocompact in PGL(dₐ+1), dₐ≥1.',
    N('drinfeld-main', 'T×∏ₐXₐ has all-degree vanishing over every finite extension', P('cor:drinfeld', 'Drinfeld uniformization proof'),
      'T is potentially good and projective. The finite semistable cover is descended with its complete degree.',
      G('all', 'The all-strata criterion AND the Drinfeld geometric and weight inputs',
        'Apply the preceding all-strata theorem to the semistable cover of the product, then descend the cover.', P('cor:drinfeld', 'Application of the all-strata theorem'), [
          L('drinfeld-criterion', 'The all-strata implication, including its new-cycle quantifier', 'strata-main', 'Supply all the stratum and weight hypotheses established below.'),
          N('drinfeld-tate', 'Every product stratum has an actual split Tate Chow motive', P('cor:drinfeld', 'Projective and staircase strata'),
            'The Chow blowup formula applies to the actual rational-linear-subspace blowups of projective space.',
            G('all', 'The projective semistable cover AND staircase products',
              'Components and all closed strata come from those successive blowups; staircase products retain split Tate motives.', P('cor:drinfeld', 'Stratum calculation'), [
                N('drinfeld-cover', 'The projective semistable cover has the specified blowup strata', P('cor:drinfeld', 'Geometric cover input'), 'The stated compact torsion-free smooth projective algebraizations are required.', undefined, 'hypothesis'),
                N('drinfeld-chow', 'Actual blowup and product Chow formulas', P('cor:drinfeld', 'Tate-motive calculation'), 'The conclusion concerns all closed geometric strata.', undefined, 'hypothesis'),
              ])),
          N('drinfeld-weights', 'Ito weight–monodromy and Künneth give the product weight condition', P('cor:drinfeld', 'Ito and product input'), 'Apply the theorem in the stated degree and coefficient range.', undefined, 'hypothesis'),
        ])), [
      N('drinfeld-extra-factors', 'The stated curve and surface factors may be included', P('cor:drinfeld', 'Permitted further factors'),
        'Each extra factor must carry the supplied projective strict semistable model with ALL closed strata of Chow abelian type.',
        G('all', 'The supplied all-strata models AND the same placewise global criterion',
          'The paper permits these factors in local presentations; a full global height requires such presentations at every finite completion.', [P('cor:drinfeld', 'Additional factors'), P('lem:two-degrees', 'Global domain')], [
            N('drinfeld-extra-models', 'The additional curve or surface models satisfy the stated all-strata inputs', P('cor:drinfeld', 'Additional model hypothesis'), 'A general surface is not being assumed to have an abelian-type motive.', undefined, 'hypothesis'),
            L('drinfeld-extra-global', 'Use an applicable full local presentation at EVERY finite place', 'main', 'The factors and the auxiliary fields can depend on the place.'),
          ])),
    ]);
  const total = T('degenerate', 'Totally degenerate reduction',
    'Integral cycle-class detection lifts numerical tests to closed support tests; the Raskind–Xarles weights then annihilate their rational periods.', localScope + ' After finite L/K, a projective dominant generically finite Y→X_L of the same dimension has the supplied regular projective reduced strictly semistable model.',
    N('degenerate-main', 'The original X has vanishing obstruction in every degree', degenerate,
      'The theorem states the supplied-witness conclusion. Reapplication to new fields requires its hypotheses there; no additional universal new-cycle assertion is inserted.',
      G('all', 'Zero rational detector periods AND finite detection with exact-support descent',
        'The companion finite detector reconstructs the primitive, then full finite and dominant descent returns to the original X and specified support.', degenerate, [
          N('degenerate-periods', 'Every rational detector period is zero', degenerate,
            'A rational intersection number whose image in ℚℓ is zero is zero over ℚ.',
            G('all', 'Closed support-test lifting AND local Galois vanishing AND period comparison',
              'The companion comparison identifies the period with the local Abel–Jacobi cup product against the lifted closed support test.', degenerate, [
                L('degenerate-tests', 'Every numerical-kernel test lifts to a closed cohomological support test', 'degenerate-detection', 'This uses the integral stratum hypotheses and the actual incidence correspondences.'),
                N('degenerate-galois', 'For W=H²ᵗ⁻¹(Ȳ,ℚℓ(t)), Wᴳᴸ=H¹(L,W)=0', degenerate,
                  'The relevant odd representation is the one appearing in the detector comparison.',
                  G('all', 'The two Raskind–Xarles inertia-weight bounds',
                    'Inertia invariants have weights at most −1, while the inertia-H¹ term has weights at least +1. The local Galois calculation excludes weight zero in both places.', degenerate, [
                      N('degenerate-weight-input', 'The Raskind–Xarles weight theorem under its stratum hypotheses', degenerate, 'Use the compatible ample classes, finite integral Chow generation and every-prime integral cycle isomorphisms.', undefined, 'hypothesis'),
                    ])),
                N('degenerate-comparison', 'The companion rational-period / local Abel–Jacobi comparison', degenerate, 'The detector period and its native intersection degree are retained exactly.', undefined, 'hypothesis'),
              ])),
          N('degenerate-detector', 'Finite actual detection, support reconstruction and full-degree descent', degenerate, 'The finite-period reconstruction requires its stated exact detector comparison. Given that comparison, the proved native descent retains all auxiliary field degrees and the original support complement.', undefined, 'hypothesis'),
        ])));
  const totalDetection = T('degenerate-detection', 'Integral strata give the required detector tests',
    'A finite constant extension defines the integral generators, and cycle-class duality identifies the actual incidence-compatible numerical groups.', localScope,
    N('degenerate-detection', 'Every numerical-kernel test lifts to a closed cohomological support test', degenerate,
      'The conclusion is the companion component-detection theorem with the exact native model and incidence maps.',
      G('all', 'Native cycle-class duality AND the companion lifting theorem',
        'The integral cycle isomorphisms and Poincaré duality identify numerical groups with even cohomology, so the companion theorem applies to each actual incidence test.', degenerate, [
          N('degenerate-strata-data', 'All connected closed geometric strata satisfy conditions (i) and (ii)', degenerate,
            'Smooth projective toric strata are the supplied example of this entire package.',
            G('all', 'Finite integral Chow generation AND primitive positivity AND integral cycle isomorphisms',
              'All three conditions belong to the theorem; positivity or Tate-type rational cohomology alone is not the package.', degenerate, [
                N('degenerate-finite', 'Each integral CH group is finitely generated', degenerate, 'Define the finitely many generators and components over one finite residue extension and lift it unramifiedly.', undefined, 'hypothesis'),
                N('degenerate-positive', '(−1)ᶜdeg(xHᵈ⁻²ᶜx)>0 on every nonzero rational primitive x', degenerate, 'Here d=dim D, 2c≤d and Hᵈ⁻²ᶜ⁺¹x=0; H is compatible with the fixed projective embedding.', undefined, 'hypothesis'),
                N('degenerate-integral', 'For EVERY ℓ≠p: odd integral cohomology is torsion and the even cycle map is an isomorphism modulo torsion', degenerate, '(CHᶜ(D)/tors)⊗ℤℓ ≅ H²ᶜ(D,ℤℓ(c))/tors, with the native incidence maps.', undefined, 'hypothesis'),
              ])),
          N('degenerate-lifting-input', 'The companion component-detection and support-test theorem', degenerate, 'This is an explicit comparison input, not a formal consequence of dimension counting.', undefined, 'hypothesis'),
        ])));
  return {
    caseId: 'reduction-strata', trees: [assembly, ordinaryTree, characteristicTwo, allStrata, repair, drinfeld, total, totalDetection],
    coverage: [
      C('Good reduction and semistable reduction', 'assembly', 'main', P('sub:ordinary-reduction', 'Placewise reduction criteria')),
      C('Ordinary quadratic singularities', 'ordinary', 'ordinary-main', ordinary),
      C('Semistable models with abelian-type strata', 'strata', 'strata-main', strata),
      C('Drinfeld uniformization', 'drinfeld', 'drinfeld-main', P('cor:drinfeld', 'Drinfeld application')),
      C('Totally degenerate reduction', 'degenerate', 'degenerate-main', degenerate),
    ], sourceBindings: [],
  };
}

function arithmeticFamilies() {
  const { N, L, T, C } = factory('arithmetic-families');
  const pencils = P('lem:congruence-pencils', 'Congruence-pencils lemma and proof');
  const hypersurfaces = P('thm:dense-hypersurfaces', 'Dense hypersurface families and proof');
  const ci = P('thm:dense-ci', 'Successive complete-intersection sections and proof');
  const products = P('thm:dense-products', 'Dense product-ambient families and proof');
  const elliptic = P('explicit-elliptic-power-families', 'All four elliptic-power families');
  const suspension = { href: '/editions/v0.5.1/source-files/companion/proofs/models/r22/geometry/positive_fourfold_suspensions_and_quintuple_models.tex', label: 'SU22 full proof: r22su:gates and r22su:theorem' };
  const ampleCC = { ...suspension, label: 'SU22 ample-boundary proof: r22su:ampleCC, r22su:weakL and r22su:Gysiniso' };
  const ellipticCC = { ...suspension, label: 'SU22 elliptic fourth-power proof: r22su:host' };
  const ramified = { href: '/editions/v0.5.1/source-files/companion/proofs/models/r18/u2/ramified_base_change_of_positive_fourfold_models.tex', label: 'RB18 full ramified proof: r18rb:strata and r18rb:fourfold' };
  const positiveHostSource = { href: '/editions/v0.5.1/source-files/companion/proofs/families/r22/geometry/supplied_positive_hosts_and_projective_bundle_height_families.tex', label: 'PSH22 full proof: r22phs:theorem, r22phs:bundles and r22phs:P4' };
  const positiveLocal = { href: '/editions/v0.5.1/source-files/companion/proofs/families/r22/geometry/abelian_hosts_and_general_suspension_height_families.tex', label: 'AS22-local full proof: r22as:local and r22as:MP' };
  const positiveComponents = { href: '/editions/v0.5.1/source-files/companion/proofs/models/r16/model_obstruction/positive_fourfold_component_activation.tex', label: 'PC16 full proof: r16pos:types, r16pos:local and r16pos:weighted-zero' };
  const inertia = { href: '/editions/v0.5.1/source-files/companion/proofs/models/r18/u2/inertial_triviality_and_ramified_norm_detection.tex', label: 'RI18 full proof: r18ri:torus, r18ri:norm and r18ri:all-finite' };
  const periods = { href: '/editions/v0.5.1/source-files/companion/proofs/foundations/R17_finite_actual_tests_and_height_obstruction_quotients.tex', label: 'FD17 exact-kernel proof: r17fd:numerical-kernel and r17fd:finite-tests' };
  const verticalTests = { href: '/editions/v0.5.1/source-files/companion/proofs/foundations/R17_vertical_tests_and_strong_green_necessity.tex', label: 'VT17 full proofs: r17vt:transpose, r17vt:vertical and r17vt:model-converse' };
  const projectiveChow = P('bib-Fulton', 'Classical input: the projective-space Chow formula; Fulton bibliography');
  const familyScope = heightScope + ' Density is in the exact stated coefficient space over one fixed number field. The supplied companion local-model theorems must treat every newly specified homological class after every further finite extension.';
  const assembly = T('assembly', 'Arithmetic families from Lefschetz pencils',
    'A fixed-field congruence construction supplies the local models; their all-new-cycle comparison gives both height factors over every further finite extension.', familyScope,
    N('main', 'Dense families with full heights after every further finite extension', P('sub:arithmetic-construction', 'The common arithmetic construction'),
      'The local-model hypotheses, section-spanning qualifications and field of definition remain those of each family below.',
      G('all', 'Dense members with the prepared local models AND all-place local vanishing AND reciprocity',
        'The pencil lemma constructs members. Local model theorems establish every homological cycle class in both complementary kernels; the independent global theorem then constructs the height.', [pencils, P('lem:two-degrees', 'The two-degree criterion')], [
          L('assembly-pencils', 'The fixed-field congruence-pencil construction is Zariski dense', 'pencils-main', 'Its finite spreading set may depend on the second member, while its number field remains fixed.'),
          N('assembly-local', 'EVERY finite completion has an applicable full local criterion', P('hypersurfaces-and-complete-intersections', 'Local-model and extension quantifiers'),
            'Use the established distinguished smoothing model, smooth reduction at the exceptional places, and ordinary quadratic reduction elsewhere.',
            G('all', 'Distinguished local comparison AND ordinary/good comparison elsewhere',
              'The local theorems must reapply to all new cycles after arbitrary finite valued extension, so the conclusion survives every global finite extension.', [P('thm:ordinary', 'Ordinary reduction and new cycles'), products], [
                N('assembly-distinguished', 'The chosen distinguished model has the stated uniform finite-extension theorem', P('sec:models', 'Companion model hypotheses'), 'A monodromy rank calculation by itself is not this vanishing theorem.', undefined, 'hypothesis'),
                N('assembly-ordinary', 'At the other places the good or ordinary criterion applies', P('thm:ordinary', 'Ordinary quadratic criterion'), 'Check every completion, including those above residue characteristic two.', undefined, 'hypothesis'),
              ])),
          N('assembly-global', 'The height and reciprocity theorem on both local-kernel domains', P('hyp:height-input', 'Theorem: global kernel-domain height'), 'For classes in BOTH local-kernel domains, H16 provides archimedean terms, absolute normalization, symmetry and Chow descent. The family model conditions must establish that membership at every finite place and after each stated extension.', undefined, 'proved'),
        ])), [
      N('hypersurface-ci-main', 'Hypersurfaces and complete intersections', ci,
        'The ordinary hypersurfaces are dense over ℚ; the successive-section construction uses one fixed extension of the specified initial field.',
        G('all', 'The two stated family theorems',
          'These are separate construction conclusions, each with its own ambient, degree and field hypotheses.', [hypersurfaces, ci], [
            L('hypersurface-ci-hypersurfaces', 'Full degree-D hypersurfaces, n≥3 and D≥3', 'hypersurfaces-main', 'The prescribed product-profile refinement has its additional dimension and degree-partition conditions.'),
            L('hypersurface-ci-sections', 'Successive degree-at-least-three complete-intersection sections', 'ci-main', 'The supplied ambient model and the full section-space argument are retained.'),
          ])),
    ]);
  const pencilConstruction = T('pencils', 'The fixed-field congruence construction',
    'Prepare finite residue data in one number field, choose a second section in a congruence lattice, and impose local parameter conditions on its pencil.', familyScope,
    N('pencils-main', 'Zariski-dense smooth geometrically integral members with all prescribed reductions', pencils,
      'The ambient is integral, flat and projective with geometrically integral fibres. The chosen equations must be nonzero on EVERY special ambient fibre.',
      G('all', 'The constructed pencil members AND the density argument',
        'The construction controls all finite places; the independent polynomial-on-lines argument proves density in precisely the supplied section space.', pencils, [
          N('pencils-members', 'Infinitely many permitted smooth members on each permitted pencil', pencils,
            'After choosing H₁, its further finite bad set may grow; the field never changes at this step.',
            G('all', 'Prepared H₀,H₁ AND parameter Chinese remainders AND flatness',
              'At newly bad primes specialize to the smooth reference member; at prepared primes preserve the chosen residue smoothing. Omit the finitely many singular generic members.', pencils, [
                L('pencils-preparation', 'One fixed field and a dense permitted set of H₁', 'pencil-field', 'The first-order smoothing is preserved modulo the square of each native maximal ideal.'),
                N('pencils-parameters', 'CRT supplies infinitely many parameters satisfying all local requirements', pencils,
                  'Spread the chosen Lefschetz pencil outside a finite further set. Outside it, every member is smooth or ordinary quadratic; the exceptional choices are smooth or the prepared model.', undefined, 'hypothesis'),
                N('pencils-flatness', 'Nonzero equations on integral special fibres give relative Cartier flatness', pencils,
                  'The nonzero residues are non-zero-divisors; generic geometric integrality comes from the stated open. Congruences handle exceptional primes and independence of H₀,H₁ handles the others.', undefined, 'hypothesis'),
              ])),
          L('pencils-density', 'The polynomial-on-lines argument proves full stated-space density', 'density-main', 'The coefficient module must surject to this stated space.'),
        ])));
  const pencilPreparation = T('pencil-field', 'Preparing one field and a congruence lattice',
    'One monic polynomial realizes the finitely many residue extensions; the second-section lattice is dense in the fixed-member Lefschetz open.', familyScope,
    N('pencil-field', 'One fixed field supports a dense set of permitted second sections H₁', pencils,
      'The extension is unramified at the prepared primes. It is fixed before the varying pencil and its further spreading set are chosen.',
      G('all', 'A common number field AND the full coefficient-module congruences AND the Lefschetz open',
        'The finite free coefficient module surjects to both the section system and required residue spaces. Its affine CRT lattice is Zariski dense, hence stays dense after intersection with the nonempty open.', pencils, [
          N('pencil-field-realization', 'One monic polynomial realizes all prepared residue extensions', pencils,
            'Use separable irreducible reductions of one common degree at the finite set of primes.',
            G('all', 'A smooth reference H₀ AND finite residue preparation',
              'Include primes below bad reductions, zero special sections and residue two; prepare smooth sections or the established smoothing there.', pencils, [
                N('pencil-reference', 'H₀ is smooth and the required local sections can be prepared', pencils, 'These are hypotheses on the fixed section system and its residue spaces.', undefined, 'hypothesis'),
                N('pencil-residue-data', 'Finite residue extensions and separable common-degree reductions', pencils, 'The common polynomial is chosen before varying H₁.', undefined, 'hypothesis'),
              ])),
          N('pencil-coefficients', 'The finite free module surjects onto the section and residue systems', pencils, 'Impose H₁ congruences modulo native maximal-ideal SQUARES; p² is valid in the stated unramified rational-prime applications.', undefined, 'hypothesis'),
          N('pencil-open', 'The fixed-H₀ Lefschetz-pencil open is nonempty', pencils, 'Intersect that open with the dense affine congruence lattice.', undefined, 'hypothesis'),
        ])));
  const density = T('density', 'Why the construction is dense',
    'A polynomial vanishing on all constructed members first vanishes along every permitted pencil and then on the full stated section space.', familyScope,
    N('density-main', 'The constructed members are Zariski dense in the supplied section space', pencils,
      'If the coefficient system only spans an image, this conclusion concerns that image; it does not silently enlarge it to a full linear system.',
      G('all', 'Infinitely many points on each permitted line AND a dense family of line directions',
        'Restrict a vanishing polynomial to each permitted pencil. Infinitely many points force that polynomial restriction to vanish identically; dense H₁ then forces the original polynomial to vanish on the whole stated coefficient space.', pencils, [
          N('density-lines', 'Each permitted pencil contains infinitely many constructed members', pencils, 'The CRT parameter conditions are finite, and only finitely many singular generic parameters are omitted.', undefined, 'hypothesis'),
          N('density-directions', 'H₁ varies in a Zariski-dense congruence open', pencils, 'The surjective coefficient module and the fixed-member Lefschetz open are the specified ones.', undefined, 'hypothesis'),
        ])));
  const hypersurface = T('hypersurfaces', 'Dense hypersurfaces over ℚ',
    'Two explicit degree-D equations cover all residue primes; arithmetic pencils then give the ordinary family without changing ℚ.', familyScope + ' Fix n≥3 and D≥3.',
    N('hypersurfaces-main', 'A dense subset of the full degree-D space over ℚ has full heights over every number field', hypersurfaces,
      'The members are smooth and geometrically integral. Both local degrees needed for a height are covered.',
      G('all', 'Explicit smooth residue choices AND the pencil-density argument AND ordinary comparison',
        'Take DF₀+aF₁ with the finite CRT conditions on a. These are smooth at exceptional primes including two and ordinary elsewhere; vary F₁ in its dense permitted open.', hypersurfaces, [
          N('hypersurfaces-residues', 'F₀ is smooth at p∤D and J_D is smooth at p∣D', hypersurfaces,
            'F₀=ΣXⱼᴰ; J_D=Σⱼ₌₀ⁿXⱼᴰ⁻¹Xⱼ₊₁+Xₙ₊₁ᴰ.',
            G('all', 'The two explicit residue derivative calculations',
              'At p∣D, descend through the partial derivatives of J_D. At p∤D, the Fermat derivatives rule out a projective singular point.', hypersurfaces, [
                N('hypersurfaces-fermat', 'p∤D: the partial derivatives of F₀ have no common projective zero', hypersurfaces, 'The coefficient D is invertible.', undefined, 'proved'),
                N('hypersurfaces-chain', 'p∣D: descending partial derivatives prove J_D smooth', hypersurfaces, 'This is the characteristic-dividing-degree branch used to prepare F₁.', undefined, 'proved'),
              ])),
          N('hypersurfaces-pencil', 'F₁≡J_D at p∣D and F₁ lies in the fixed-F₀ Lefschetz open', hypersurfaces, 'The integral congruence lattice and CRT parameter choices give the stated full-space density.', undefined, 'hypothesis'),
          N('hypersurfaces-height', 'Good or ordinary local models reapply after every finite extension', P('thm:ordinary', 'Ordinary criterion'), 'Apply the independent admitted-domain height construction after the local criterion in every degree.', undefined, 'hypothesis'),
        ])));
  const productProfile = T('hypersurface-profile', 'Prescribing the hypersurface monodromy profile',
    'A congruence modulo q² fixes the actual first-order product smoothing; the companion ordered-model theorem supplies both vanishing and a separate rank calculation.', familyScope + ' n≥4, dᵢ>0, m≥3, D=Σdᵢ and bₙ=Σ|I|=n+1 ∏ᵢ∈I dᵢ−binom(m−1,n)>0.',
    N('hypersurface-profile-main', 'The same full-space density holds with rank Nⁿ=bₙ at a distinguished prime', hypersurfaces,
      'For linear factors D≥n+2, bₙ=binom(D−1,n+1). The rank is a further conclusion of the model calculation, not a premise for heights.',
      G('all', 'The exact product smoothing AND the ordered local theorem AND the other places',
        'The distinguished congruence is compatible with the finitely many ordinary-family congruences, so the same density proof applies.', hypersurfaces, [
          N('profile-equation', 'At q the actual equation is P+qQₐ with Q̄ₐ=Q̄', hypersurfaces,
            'Choose q>D outside the bad set, P=∏fᵢ transverse and Q the prescribed smoothing.',
            G('all', 'The H₁ congruence AND the parameter congruence',
              'Substituting a≡1 modulo q² into DF₀+aF₁ preserves the required first-order smoothing.', hypersurfaces, [
                N('profile-section', 'F₁≡P−DF₀+qQ modulo q²', hypersurfaces, 'The transverse integral factors and smoothing section are prepared before q is chosen.', undefined, 'hypothesis'),
                N('profile-parameter', 'a≡1 modulo q²', hypersurfaces, 'Impose this along with the other finite CRT conditions.', undefined, 'hypothesis'),
              ])),
          N('profile-local', 'The ordered model gives all-degree vanishing and the displayed rank', hypersurfaces, 'Its uniform ramified-extension theorem treats ALL new classes after arbitrary finite extension.', undefined, 'hypothesis'),
          L('profile-other-places', 'Use the ordinary hypersurface construction at every other place', 'hypersurfaces-main', 'The argument for varying F₁ and preserving a fixed field is unchanged.'),
        ])));
  const completeIntersections = T('complete-intersections', 'Successive complete-intersection sections',
    'Koszul gives the full coefficients, residue Bertini avoids the finite ambient singular sets, and the degree-at-least-three jets give the Lefschetz pencils.', familyScope + ' The supplied relative complete-intersection ambient is integral, flat and projective, of dimension m≥4, with smooth geometrically integral generic fibre and geometrically integral special fibres smooth off finite sets.',
    N('ci-main', 'After one fixed extension, a dense subset of the FULL degree-d section system has all heights', ci,
      'Here d≥3, the new member has dimension m−1≥3, and full height domains persist after every finite extension of the fixed field.',
      G('all', 'The three section-system inputs AND the common pencil and local comparison',
        'The constructed model is integral and flat, smooth or odd-characteristic ordinary, and good at two. The ordinary theorem gives all-degree vanishing.', ci, [
          N('ci-coefficients', 'Koszul supplies every section from ambient polynomials', ci, 'This is why the density conclusion concerns the full section space.', undefined, 'hypothesis'),
          N('ci-residues', 'Prepared smooth residue sections avoid the finite ambient singular loci', ci, 'Use the required finite residue extensions; geometric integrality is retained.', undefined, 'hypothesis'),
          N('ci-jets', 'Degree-d jets, d≥3, give the nonempty fixed-member Lefschetz open', ci, 'This is the stated jet range, not an assertion for arbitrary lower degree.', undefined, 'hypothesis'),
          L('ci-pencil', 'Apply the congruence-pencil construction and every-place height assembly', 'main', 'All the section-system hypotheses have now been supplied.'),
        ])), [
      N('ci-iteration', 'Any specified multidegree dᵢ≥3 and final dimension ≥3 can be constructed', ci,
        'One fixed extension suffices for the finite iteration. Earlier equations may be fixed before varying the final section; a split quadric can be the initial ambient.',
        G('all', 'The one-step theorem AND persistence of its ambient model hypotheses',
          'Each resulting model has the same finite-singular-locus property needed by the next step. Induct through the finite list of degrees.', ci, [
            L('ci-iteration-step', 'The one-step section theorem', 'ci-main', 'Apply in dimension at least four before taking the next section.'),
            N('ci-iteration-model', 'The constructed model retains integral fibres and only finitely many singular points', ci, 'These are the hypotheses used to prepare residue sections in the next step.', undefined, 'hypothesis'),
          ])),
      N('ci-profile', 'A product-profile final section has the stated extreme monodromy rank', ci,
        'm=n+1≥5, ambient degree δ, D=Σeᵢ, s≥3, eᵢ≥1. The rank is δΣ|I|=n+1 ∏eᵢ−binom(s−1,n); type (2,5) fourfolds give rank N⁴=1.',
        G('all', 'The fixed-ambient product-model theorem AND the same congruence construction',
          'The local product theorem supplies the full new-cycle domain; the incidence computation gives the separate rank formula.', ci, [
            N('ci-product-local', 'The supplied fixed-ambient product-profile theorem', ci, 'Retain the ambient degree and exact incidence complex.', undefined, 'hypothesis'),
            L('ci-product-pencil', 'The fixed-field congruence and density argument', 'pencils-main', 'Only the last section is varied after the ambient is fixed.'),
          ])),
    ]);
  const productAmbients = T('product-ambients', 'Divisors in products with projective space',
    'Each ambient has a different local comparison; the common pencil proof is applied only after its coefficient and stratum hypotheses are supplied.', familyScope,
    N('products-main', 'The three stated product-ambient constructions give dense complete height domains', products,
      'Each fixed input data set has one fixed finite extension, and each constructed member is covered over every further finite extension.',
      G('all', 'The three separately scoped construction results',
        'This conclusion packages the three families; it does not identify their hypotheses or their coefficient spaces.', products, [
          N('products-projective', 'P¹×P⁴: the full bidegree-(D,D) system, D≥5', products,
            'The rank is (D−1)binom(D−1,4)>0.',
            G('all', 'D transverse O(1,1) factors AND the ordered double-stratum comparison AND pencils',
              'Retain BOTH ambient hyperplane classes. The incidence rank is 5binom(D,5)−binom(D−1,4), equal to the displayed rank.', products, [
                N('products-projective-model', 'The local ordered model and uniform extension comparison', products, 'The actual double-stratum calculation retains both projective hyperplane classes.', undefined, 'hypothesis'),
                L('products-projective-pencil', 'The common fixed-field pencil and full-height argument', 'main', 'The full bidegree coefficient system is available.'),
              ])),
          N('products-surface', 'S×P³: dense in the image of degree-five embedding polynomials', products,
            'S has a supplied everywhere-good smooth projective geometrically integral surface model, A is relatively very ample and L=A⊠O(1). The rank is 10deg(A²)−1.',
            G('all', 'The actual double-stratum blowup comparison AND the supplied coefficient image',
              'The local incidence complex gives the rank and vanishing; pencils give density in the polynomial image. Equality with the full |L⁵| requires the additional spanning hypothesis.', products, [
                N('products-surface-model', 'The surface-ambient theorem uses the ACTUAL blowups of double strata', products, 'Retain its uniform finite-extension comparison, not just its numerical rank formula.', undefined, 'hypothesis'),
                N('products-surface-coefficients', 'The free embedding-polynomial module supplies the stated image', products, 'Only when these polynomials span all sections is the resulting density in the full |L⁵|.', undefined, 'hypothesis'),
                L('products-surface-pencil', 'Apply the common fixed-field pencil argument', 'main', 'Use the exact supplied coefficient image.'),
              ])),
          L('products-host', 'M×P¹: the full positive-fourfold-host construction', 'host-main', 'The primary PSH22/AS22-local route uses the uniform signature. A separate SU22/RB18 sufficient route also requires uniform boundary curve comparison.'),
        ])));
  const positiveHost = T('positive-host', 'The positive-fourfold-host suspension',
    'PSH22 uses the uniform signature through the independent PC16 obstruction argument and RI18 norm detection. SU22/RB18 gives another sufficient route with an additional curve-comparison gate. The incidence join and section module supply the rank and density.', familyScope + ' M is a supplied smooth projective geometrically integral fourfold over the WHOLE number ring of F₀; odd p is unramified in F₀. H is sufficiently positive for very ampleness, normal generation and section base change. Let c=deg H⁴. The primary PSH22/AS22-local proof requires the displayed uniform signature, its supplied residual and operational-lift constructions, and its exact period comparison. Uniform CCℓ(Fᵢ), for fixed ℓ≠p, belongs only to the alternative SU22/RB18 route.',
    N('host-main', 'One fixed F/F₀ unramified above p supports a dense complete-height family in the full |(H⊠O(1))⁵|', products,
      'rank N⁴=4(5c−4), b₁(X)=b₁(M), b₂(X)=b₂(M)+1. The unramified condition concerns only the initial F/F₀; full heights persist after EVERY subsequent finite F′/F, including ramified extensions.',
      G('all', 'All-place local vanishing AND global height theory AND full-coefficient pencils AND the separate invariants',
        'The coefficient module and prepared data feed the common dense-pencil construction. The local theorems put BOTH complementary groups in the kernels at EVERY finite place; the proved kernel-domain height theorem then supplies reciprocity and the pairing. The incidence and Betti calculations give the separate stated invariants.', [products, positiveHostSource, pencils, P('hyp:height-input', 'Independent admitted-domain height theorem')], [
          N('host-vanishing', 'The five-divisor / five-point local model has all-new-cycle vanishing', products,
            'At each distinguished completion K, either complete source route treats EVERY finite valued L/K and EVERY newly specified geometrically homologically trivial rational cycle on X_L. No new cycle is assumed to descend to K.',
            G('any', 'PSH22 signature-only route OR the SU22/RB18 signature-plus-CCℓ route',
              'AS22-local explicitly proves the first route without a double-curve comparison hypothesis, using PC16 and RI18. The second route uses the separate double-comparison gate of SU22 and RB18. Each branch retains its complete model and period-comparison conditions; the numerical detector and covariance steps are proved.', [products, positiveHostSource, positiveLocal, suspension, ramified], [
                N('host-signature-route', 'PSH22: the uniform signature gives the full new-cycle domain', positiveHostSource,
                  'Primitive-positive components feed PC16 directly. Its obstruction-zero result holds anew over every unramified extension; RI18 then treats every finite valued extension.',
                  G('all', 'Prepared geometry AND uniform signature AND PC16 native obstruction zero AND RI18',
                    'PC16 uses the canonical residual, multiplicity-weighted isotropy and pure operational numerical detection. The separate consequence U₂=0 is not the sole input to that obstruction argument.', [products, positiveHostSource, positiveLocal, positiveComponents, inertia], [
                      N('host-signature', 'b⁻(N²(Mₖ′)ℝ,deg xy)=ρ(Mₖ′)−1 for EVERY v∣p and EVERY finite k′/k(v)', P('eq:host-signature', 'Exact signature quantifier'), 'Everywhere-good abelian fourfolds, the stated projective-bundle hosts and P⁴ supply the listed numerical signatures on the whole native numerical groups. This is the primary PSH22 hypothesis.', undefined, 'hypothesis'),
                      N('host-strata', 'Five divisors and five distinct P¹ points have the stated prepared intersections', products, 'One-, two- and three-divisor intersections are smooth geometrically integral; fourfold intersections are split finite étale of degree c; fivefold intersection is empty. The smoothing cuts strata transversely and avoids zero-dimensional strata.', undefined, 'hypothesis'),
                      L('host-signature-unramified', 'AS22-local and PC16 give Ob=0 for all new unramified classes', 'host-unramified-domain', 'Use the same actual ordered geometry and full numerical signature over each finite constant field.'),
                      L('host-signature-all-finite', 'RI18 norm detection gives Ob=0 after EVERY finite valued extension', 'host-all-finite-domain', 'The exact FD17 period kernel remains an explicit condition. The proved native descent retains the complete final field degree.'),
                    ])),
                N('host-cc-route', 'SU22/RB18: uniform signature plus boundary CCℓ gives the full domain', suspension,
                  'This alternative sufficient proof requires the extra CCℓ gate; it does not restrict the preceding PSH22 route.',
                  G('all', 'Prepared geometry AND uniform signature AND uniform boundary CCℓ AND comparison',
                    'SU22.5 explicitly has two finite-field gates. CCℓ(Fᵢ), surface-times-P¹ comparison and smooth-curve blowup comparison give CCℓ on every actual double, closing CL17. RB18 requires both universal component positivity and universal double comparison.', [products, suspension, ramified], [
                      L('host-cc-signature', 'The same uniform signature on the whole new numerical groups', 'host-signature', 'Retain EVERY v∣p and EVERY finite k′/k(v).', 'hypothesis'),
                      L('host-cc-strata', 'The actual prepared geometry and smoothing cuts', 'host-strata', 'Every double is the actual prescribed smooth-curve blowup of Fᵢ or of a surface times P¹.', 'hypothesis'),
                      N('host-curve-input', 'CCℓ(Fᵢₖ′) for EVERY v∣p, EVERY finite k′/k(v) and EVERY boundary i', '#proof-arithmetic-families-host-boundary-cc', 'For EVERY actual native rational 1-cycle z on (Fᵢ)ₖ′, numerical zero must imply clℓ(z)=0 in geometric H⁴(−,ℚℓ(2)). This is a required input of this SU22/RB18 branch only. The linked sufficient proof uses uniform CCℓ(M) and smooth ample boundaries.', undefined, 'hypothesis'),
                      N('host-local-input', 'The supplied SU22 suspension and RB18 ramified comparison', ramified, 'Apply to these actual strata with universal component positivity and CCℓ on EVERY actual double over EVERY finite residue extension. For EACH finite valued L/K and EACH newly specified geometrically homologically trivial rational cycle on X_L, use the new model; any further unramified preparation L′/L is descended by the full [L′:L], with the absolute value extending the original one, exact original support and all actual compact tests.', undefined, 'hypothesis'),
                    ])),
              ])),
          N('host-invariants', 'Joining five point vertices changes dim H₃=5c−4 to rank N⁴=4(5c−4)', products, 'Weak Lefschetz gives b₁(X)=b₁(M) and b₂(X)=b₂(M)+1.', undefined, 'conditional'),
          N('host-coefficients', 'Serre vanishing and a sufficiently high Veronese supply FULL coefficients and jets', products, 'Apply the congruence-pencil lemma over one fixed extension unramified above p; use ordinary comparison elsewhere.', undefined, 'hypothesis'),
          L('host-pencil-construction', 'The prepared full coefficient system gives the fixed-field dense-pencil construction', 'pencils-main', 'PSH22 supplies the finite residue preparation and jets before choosing the pencil directions; the field remains fixed as the exceptional spreading sets vary.'),
          L('host-other-places', 'Good or ordinary comparison holds at EVERY other finite completion', 'assembly-ordinary', 'PSH22 checks smooth replacement fibres at the prepared exceptional places and smooth or odd-characteristic one-node fibres elsewhere; residue characteristic two lies in the smooth regime. The criterion reapplies to every new class after every finite extension.', 'hypothesis'),
          L('host-global-height', 'The proved height and reciprocity theorem on both local kernels', 'assembly-global', 'Retain BOTH complementary local kernels, archimedean terms, absolute normalization, symmetry and rational-equivalence descent.', 'proved'),
        ])), [
      N('host-projective-example', 'For M=P⁴, H=O(1), p=5: rank N⁴=4 and (b₁,b₂)=(0,2)', products,
        'These are bidegree-(5,5) fourfolds in P⁴×P¹.',
        G('all', 'The P⁴ signature/data AND the PSH22 route AND substitution c=1',
          'PSH22:r22phs:P4 applies its signature-only construction. The separate projective-space CC calculation below also supplies the alternative route.', [products, positiveHostSource], [
            N('host-projective-data', 'P⁴ supplies the signature, good model and full coefficient system', products, 'Use H=O(1) and the distinguished prime five.', undefined, 'hypothesis'),
            L('host-projective-apply', 'Apply the full PSH22 positive-host construction', 'host-main', 'Use its signature-only local alternative, its full coefficient/pencil proof and its global height input. Substitute c=deg H⁴=1.'),
          ])),
      L('host-projective-curve-input', 'P⁴ also supplies the alternative route’s boundary CCℓ input', 'host-projective-curve-comparison', 'The classical projective-space Chow calculation and SU22:ampleCC establish it over EVERY finite residue extension. This is an additional sufficient route, with the application input status retained.', 'hypothesis'),
      L('elliptic-fourth-curve-comparison', 'E⁴ also supplies the alternative route’s uniform boundary CCℓ', 'host-elliptic-curve-comparison', 'SU22:r22su:host gives this optional comparison route through SP19 and its ample-boundary lemma.'),
    ]);
  const hostPositiveModel = T('positive-host-positivity', 'The AS22-local and PC16 native-obstruction proof',
    'The actual ordered model has primitive-positive components. PC16 then uses its canonical residual and weighted isotropy to build a numerical model certificate and kill the original actual obstruction. The separate U₂ consequence is displayed below.',
    localScope + ' Here X is the supplied fourfold smoothing at a distinguished completion K. For EACH finite unramified K′/K, rerun the argument on the whole native numerical and Chow groups of the base-changed model and on EACH newly specified geometrically homologically trivial class, in every 1≤r≤4. The uniform signature is imposed on EVERY resulting finite constant field.',
    N('host-unramified-domain', 'Every new homological class over EVERY finite unramified K′/K has Ob=0', positiveLocal,
      'The proof is repeated over the current K′. It does not assume that a new class or a new numerical component class descends to K.',
      G('all', 'The actual ordered model AND primitive-positive components AND the PC16 obstruction argument',
        'AS22-local verifies the geometric and positivity hypotheses of PC16 over each finite constant field. PC16 directly supplies native obstruction zero and the exact-support reconstruction in all four degrees.', [products, positiveLocal, positiveComponents], [
          N('host-ordered-geometry', 'The ordered factor blowups give a regular projective reduced strict semistable model', suspension,
            'Its components are unchanged copies of M and iterated smooth surface blowups of Fᵢ×P¹. Every closed stratum is smooth, including the genuine higher intersections.',
            G('all', 'Prepared transverse data AND saturated local charts AND the actual center calculation',
              'The geometric part of SU22 uses no CC hypothesis. It supplies the precise model required by AS22-local and PC16.', [products, suspension, positiveLocal], [
                L('host-model-data', 'Use every prepared factor intersection and smoothing cut', 'host-strata', 'The generic fourfold is smooth and geometrically integral; Q avoids the zero-dimensional strata.', 'hypothesis'),
                N('host-ordered-charts', 'At Q=0: x₁⋯xₛ=πy, s≤4; at quintuple points: x₁⋯x₅=πu', suspension, 'The saturated ordered charts are regular with reduced special fibre and no extra vertical components. At a quintuple point u is a unit, so the chart is already strict semistable.'),
                N('host-ordered-centers', 'Each continuing H_I is blown up in H_I∩Hⱼ∩Q, in decreasing j', suspension, 'Each nonempty center has codimension two in H_I. Earlier centers meet later ones in a Cartier divisor, so the later center is unchanged; Q avoids the zero-dimensional collisions.'),
              ])),
          N('host-components-positive', 'Every fourfold component is primitive-positive for one actual relatively ample H', positiveLocal,
            'All numerical forms and multiplicities use native residue degrees. No numerical-to-ℓ-adic comparison is used to calculate these signatures.',
            G('all', 'The host signature AND the full Fᵢ×P¹ form AND the surface-blowup formula AND divisor Hodge index',
              'The full negative middle index of each component equals its Picard rank minus one. Its H·N¹ part has exactly that negative index by divisor Hodge index, so the orthogonal primitive middle form is positive definite.', [products, positiveLocal, positiveComponents], [
                L('host-positive-host-signature', 'The point components M satisfy the uniform signature', 'host-signature', 'Apply the hypothesis to the whole native numerical group over the current finite residue field.', 'hypothesis'),
                N('host-hyperbolic-product', 'N²(Fᵢ×P¹)=N²(Fᵢ)⊕N¹(Fᵢ) has the full hyperbolic pairing', positiveComponents, 'The pairing is deg(αβ′+α′β). Perfect numerical duality makes its negative index dim N¹(Fᵢ), while ρ(Fᵢ×P¹)=dim N¹(Fᵢ)+1. Use all native numerical cycle classes and perfect numerical duality; no identification with the full cohomology group is needed.'),
                N('host-surface-blowups', 'Each connected smooth surface center adds one negative direction and one Picard generator', positiveLocal, 'Its exceptional middle block is the negative of the surface divisor pairing. Apply this component by component for a disconnected center, retaining every positive native degree factor.'),
                N('host-ample-hodge', 'One relatively ample line bundle restricts to every component', positiveLocal, 'Divisor Hodge index gives signature (1,ρ−1) on H·N¹. Numerical duality identifies its orthogonal complement with the entire primitive middle group.', undefined, 'hypothesis'),
              ])),
          N('host-pc16-obstruction', 'PC16 kills the actual obstruction in every degree 1≤r≤4', positiveComponents,
            'For r=2, positive weights and primitive positive definiteness force every canonical residual component to be zero. The other three degrees use the separately established endpoint and one-cycle inputs.',
            G('all', 'Primitive positivity AND canonical weighted residuals AND a pure operational witness AND native detection',
              'For r=2 the imported identities give Rᵢ∈P²_H(Dᵢ) and Σmᵢdeg(Rᵢ²)=0. Hence every Rᵢ=0. The residual theorem supplies a rational model Chow lift with zero component numerical restrictions; its pure operational character gives the native obstruction-zero certificate.', [products, positiveComponents, P('prop:numerical', 'Proposition: actual numerical-model detection')], [
                L('host-pc16-positive-input', 'Use positivity of the entire primitive component groups', 'host-components-positive', 'This is the input to PC16. The separate statement U₂=0 is not substituted for it.'),
                N('host-canonical-residual-input', 'Rᵢ∈P²_H(Dᵢ) and Σᵢmᵢdegₖ′(Rᵢ²)=0 for the specified homological class', positiveComponents, 'PC16 explicitly imports r15res:canonical-residual and r15iso:total-isotropy. They remain supplied historical inputs; no new proof of their original dossiers is asserted here. Each mᵢ and every residue-field degree is positive.', undefined, 'hypothesis'),
                N('host-operational-lift-input', 'Residual zero supplies a pure operational K₀ witness for the same generic class', positiveComponents, 'Use PC16’s imported r12n:K0 construction. Its degree-two character has zero degree on EVERY integral vertical two-cycle and generic character exactly the prescribed pulled Chow class.', undefined, 'hypothesis'),
                N('host-native-detector-input', 'Actual model-Chern detection and dominant/finite obstruction injection', P('prop:numerical', 'Proposition: actual model-Chern detection'), 'Given the supplied pure operational lift, the proved detector kills its actual curvature on the original valued-field theory. Native dominant Bott–Chern injection and full finite-constant injection then descend Ob=0, retaining ramification, native residue degrees and the original absolute value. The residual-to-lift input remains separate.', undefined, 'proved'),
                N('host-other-degrees-input', 'r=1,3,4 use the proved divisor, one-cycle and zero-cycle results', P('prop:endpoint-input', 'The remaining fourfold degrees'), 'PC16 applies those inputs over the current K′ to every new homological class. The same actual curved-pair reconstruction returns the specified exact support and all actual tests.', undefined, 'proved'),
              ])),
        ])), [
      N('host-full-u2', 'The same primitive positivity also gives the entire U₂=0', positiveLocal,
        'This is a parallel consequence. The PC16 obstruction proof above has its own residual and detection inputs.',
        G('all', 'Primitive-positive components AND the supplied PU18 primitive-isotropic representative theorem',
          'PU18 represents the whole numerator ker ρ₂∩im σ₂ by a totally isotropic primitive subspace. Positive definiteness forces that subspace to vanish, with all higher-stratum terms retained.', [products, positiveLocal], [
            L('host-u2-positive-input', 'The entire primitive component form is positive definite', 'host-components-positive', 'Use the same actual ample class and native intersection forms.'),
            N('host-pu18-input', 'The complete PU18 representative theorem', positiveLocal, 'AS22-local explicitly invokes this theorem for the full U₂ numerator, including genuine higher strata. It is a supplied source interface, independent of PC16’s route to Ob=0.', undefined, 'hypothesis'),
          ])),
    ]);
  const hostRamifiedNorm = T('positive-host-ramified', 'RI18: from all unramified domains to every finite extension',
    'The inertia action is a global connected-torus translation on each actual component. It fixes all numerical tests, so the norm of a new cycle detects its full period. The exact FD17 kernel then returns to the native obstruction.',
    localScope + ' Fix ANY finite valued L/K and ANY geometrically homologically trivial rational codimension-r cycle Z on X_L, 1≤r≤4. Choose a finite Galois E/K containing L and put K₀=Eᴵ for its inertia subgroup I. In the norm step W=Z_E and p:X_E→X_K₀. E/K₀ is totally ramified Galois; all degrees include their wild, ramification and residue factors.',
    N('host-all-finite-domain', 'Every new homological class over EVERY finite valued L/K has Ob=0', inertia,
      'The starting class is arbitrary over L. It is pulled to E only after it has been specified, and the final argument returns to L with its original absolute value.',
      G('all', 'The universal unramified domain AND the Galois norm calculation AND the exact period kernel AND native descent',
        'The norm B=p_*W is homologically trivial over K₀, hence has strong G. Full finite actual ascent gives strong G for p*B over E. Necessity of the exact detector and inertia invariance imply 0=ν(p*B)=|I|ν(W). Thus ν(W)=0; FD17’s exact numerical kernel gives Ob(W)=0. Native finite-constant injection then descends to the original class over L.', [products, inertia, periods, P('sub:finite-certificates', 'The finite-period criterion')], [
          L('host-all-finite-unramified', 'EVERY homological class over EVERY finite unramified K₀/K has Ob=0', 'host-unramified-domain', 'Use the statement for the whole new group over K₀, so it applies to the norm B even if B is not a class defined over K.'),
          N('host-galois-preparation', 'E/K is Galois, contains L, and E/K₀ is totally ramified with group I', inertia, 'The original reduced strict semistable model remains so under K₀/K. Saito’s actual blowup gives the I-equivariant reduced strict model over E, including wild ramification.'),
          N('host-inertia-period-zero', 'The full model period ν(W) is zero', inertia,
            'The period is tested on every v∈ker A in the complete native numerical component space. Rational coefficients allow division by the full |I|=[E:K₀].',
            G('all', 'Trivial numerical inertia action AND the actual norm identity AND all-test ascent AND exact period necessity',
              'For every numerical test v, ν(gW)(v)=ν(W)(g⁻¹v)=ν(W)(v). Since p*p_*W=Σg∈I gW, the zero period of the norm pullback equals |I|ν(W). This treats the arbitrary new class rather than assuming its descent.', [products, inertia, periods, verticalTests], [
                N('host-inertia-action', 'Every g∈I acts trivially on every Nᵃ(F) of every actual new component F', inertia,
                  'The action is numerical, with no cycle-class comparison imposed on a special-fibre component.',
                  G('all', 'The Galois-equivariant Saito model AND a global connected normal-torus action',
                    'A component labelled by (D_I,(aᵢ)) has normal characters zᵢ=xᵢ/tᵃⁱ. Inertia acts by zᵢ↦c_g⁻ᵃⁱzᵢ with ∏c_g⁻ᵃⁱ=1. This is a point of a split connected torus acting on the entire projective component; its translates are numerically equivalent.', [products, inertia], [
                      N('host-saito-action', 'The actual Saito blowup ideal and component labels are inertia-stable', inertia, 'Every old component ideal is fixed and g(t)/t is a unit. The integral unimodular charts give the genuine reduced strict model and its labelled native components, with no tame assumption.'),
                      N('host-global-torus', 'The normal-torus action extends and glues over every boundary chart', inertia, 'The normal characters have an integral lattice basis, transition factors come from base units, and the monomial charts are homogeneous. Connected-torus translation preserves numerical classes via proper flat families. Native constant-field degrees remain intact.'),
                    ])),
                N('host-norm-cycle', 'B=p_*W is homologically trivial and p*B=Σg∈I gW in rational Chow', inertia, 'Over the geometric generic fibre the pushforward class is a sum of conjugate zero classes. Finite flat Galois pullback gives the actual norm identity with all cycle coefficients retained.'),
                N('host-norm-ascent-input', 'Strong G for B ascends to p*B on ALL E-actual tests', P('sub:covariance', 'Proposition: finite-constant covariance'), 'The proved full finite actual trace and finite-constant comparison retain the complete degree [E:K₀], all native cycle lengths and the original absolute value. They apply to the whole E-actual test space. The separate identification of those tests with the full FD17 period coordinates remains required.', undefined, 'proved'),
                { ...N('host-exact-period-input', 'The supplied FD17/VT17 period detector has BOTH necessary and sufficient directions', periods, 'Its global ordinary D-closed actual tests realize the full ν coordinates. VT17 constructs the framed vertical tests, proves the transpose identity and gives the supplied-model converse. Necessity gives ν(p*B)=0 from strong G. FD17 sufficiency uses its exact numerical kernel and reconstructs strong G on the exact support with every actual test. The exact identification of the full period space, including both necessary and sufficient directions, remains a supplied condition; the proved trace and numerical-descent results do not establish it.', undefined, 'hypothesis'), links: [verticalTests] },
              ])),
          N('host-period-kernel-input', 'FD17:r17fd:numerical-kernel gives ker ν = ker Ob', periods, 'For ν=0, perfect numerical duality supplies an actual rational vertical correction. The model detector, dominant Bott–Chern injection and full finite-constant injection give native Ob=0. This explicit conditional lemma is the bridge; no general converse is taken from the earlier R11 sufficient criterion.', undefined, 'hypothesis'),
          N('host-final-field-descent', 'Return from E to L with the full [E:L] and reconstruct the original support', inertia,
            'Given Ob(W)=0 from the preceding period-kernel argument, the proved native obstruction injection descends it to L. Full finite actual trace and the prescribed-pair reconstruction preserve the complete original test space and the absolute value on L.',
            G('all', 'Full-degree native obstruction injection AND exact-support actual reconstruction',
              'The final cycle is the original specified Z over L. The descended zero obstruction provides a global primitive of its original curvature, which is subtracted from its own exact-support curved pair.', [products, inertia, periods, P('prop:obstruction', 'Native obstruction and exact-support reconstruction')], [
                N('host-full-degree-injection', 'Finite-constant obstruction injection retains the complete [E:L]', P('sub:covariance', 'Native covariance and full degrees'), 'Ramification and residue degrees are not replaced by a geometric sheet count. The norm on L is the initially prescribed one.', undefined, 'proved'),
                N('host-exact-reconstruction-input', 'Zero obstruction gives the original exact-support Green form', { href: '/papers/chow-obstruction-green-pairs#h22:correction', label: 'Proved curvature correction' }, 'Once the preceding descent gives zero obstruction, the established pair and a global actual primitive give a form on exactly X_Lᵃⁿ∖|Z|ᵃⁿ against every compact actual complementary test.', undefined, 'proved'),
              ]), 'proved'),
        ])));
  const hostCurveComparison = T('positive-host-curve-gate', 'The uniform ample-boundary curve-comparison gate',
    'The full SU22 proof isolates a sufficient ambient comparison and proves the Gysin cancellation needed on each boundary. Its elliptic host supplies the ambient comparison through the cited product-of-curves theorem.',
    familyScope + ' This is the finite-field input of the selected SU22/RB18 route. Fix ℓ≠p. For EACH v∣p, EACH finite k′/k(v), EACH boundary i and EACH actual native rational 1-cycle z on (Fᵢ)ₖ′, apply the argument over k′. General uniform CCℓ(M) remains a supplied hypothesis; the numerical signature is a separate requirement.',
    N('host-boundary-cc', 'Every smooth ample boundary Fᵢ has CCℓ over EVERY finite constant extension', ampleCC,
      'Fix arbitrary v, k′, i and numerically zero z. The proof applies anew to the whole native curve group over k′, including curves that do not descend to k(v).',
      G('all', 'Uniform ambient CCℓ AND smooth ample boundaries AND projection formula AND injective Gysin',
        'The numerical projection formula makes i_*z numerically zero on M. Ambient CCℓ gives clℓ(i_*z)=0. Compatibility of cycle classes with Gysin and the displayed injection then give clℓ(z)=0. This proves the stated implication for every new native 1-cycle over every k′.', [products, ampleCC], [
          N('host-ambient-curve-input', 'CCℓ(Mₖ′) for EVERY v∣p and EVERY finite k′/k(v)', suspension, 'For EVERY actual native rational 1-cycle on Mₖ′, numerical zero implies zero geometric ℓ-adic class. This sufficient ambient input is not supplied by the signature equation alone.', undefined, 'hypothesis'),
          N('host-ample-boundary-input', 'Each Fᵢ is a smooth geometrically integral ample divisor in M', ampleCC, 'The prepared H-divisors satisfy this geometric condition; it persists after every finite constant extension.', undefined, 'hypothesis'),
          N('host-curve-pushforward', 'Numerical zero of z on Fᵢ implies numerical zero of i_*z on M', ampleCC, 'For EVERY native divisor A on Mₖ′, deg_M(i_*z·A)=deg_Fᵢ(z·i^*A)=0 by the actual projection formula. Use all native divisor tests over the current k′.'),
          N('host-curve-gysin', 'Gysin: H⁴(Fᵢ̄,ℚℓ(2)) → H⁶(M̄,ℚℓ(3)) is injective', ampleCC,
            'The actual Gysin is an isomorphism, so its zero value on clℓ(z) can be cancelled.',
            G('all', 'Weak Lefschetz AND Poincaré duality with the cohomological projection formula',
              'For a smooth ample divisor in a fourfold, restriction on H² is an isomorphism. Poincaré duality identifies its dual with the Gysin from H⁴(Fᵢ) to H⁶(M); it too is an isomorphism over every geometric constant field.', [products, ampleCC], [
                N('host-boundary-weak-lefschetz', 'Restriction: H²(M̄,ℚℓ(1)) ≅ H²(Fᵢ̄,ℚℓ(1))', ampleCC, 'SU22.1 applies ordinary weak Lefschetz to the supplied smooth ample boundary.', undefined, 'hypothesis'),
                N('host-boundary-duality', 'The Gysin in SU22.2 is dual to that restriction', ampleCC, 'Use Poincaré duality for the smooth projective fourfold and threefold and the cohomological projection formula.', undefined, 'hypothesis'),
              ])),
        ])), [
      N('host-projective-curve-comparison', 'P⁴ supplies boundary CCℓ over EVERY finite residue extension', ampleCC,
        'For EVERY finite k′/k(v) and EVERY native rational 1-cycle, the classical projective-space calculation gives ambient CCℓ. The same sufficient ample-boundary proof then applies to each Fᵢ. In the H=O(1) example each Fᵢ is P³.',
        G('all', 'The projective-space Chow calculation AND smooth ample boundaries AND SU22:ampleCC',
          'Numerical zero of z=d[line] forces d=0 by intersecting one hyperplane, hence its Chow class and geometric ℓ-adic class vanish. Apply the already displayed ample-boundary Gysin argument over the same k′. This explicitly supplies the alternative route’s comparison input.', [products, projectiveChow, ampleCC], [
            N('host-projective-ambient-cc', 'CCℓ(P⁴ₖ′) holds for EVERY finite k′ and EVERY native rational 1-cycle', projectiveChow,
              'This calculation works over every field. It therefore treats each new native curve cycle after every finite residue extension.',
              G('all', 'The classical Chow formula AND the degree-one hyperplane test',
                'Write [z]=d[line]. Numerical zero gives 0=deg(z·h)=d, so [z]=0 in rational Chow. The geometric cycle-class homomorphism then gives clℓ(z)=0.', [products, projectiveChow, P('prop:closures', 'Reading-paper use of the Chow projective-bundle decomposition')], [
                  N('host-projective-chow-formula', 'CH₁(P⁴ₖ′)ℚ=ℚ·[line] over EVERY field k′', projectiveChow, 'The classical projective-space Chow formula is an explicit input here, as used in the reading paper’s projective-bundle discussion. It is not attributed to the SU22 ample-boundary lemma.', undefined, 'hypothesis'),
                  N('host-projective-degree-test', 'For h=c₁(O(1)), deg([line]·h)=1', projectiveChow, 'A native line meets a native hyperplane in degree one. Thus the coefficient d of a numerically zero rational 1-cycle is exactly zero.'),
                ])),
            N('host-projective-boundary-data', 'The prepared H-divisors on P⁴ are smooth, geometrically integral and ample', positiveHostSource, 'For H=O(1), PSH22:r22phs:P4 uses the five coordinate hyperplanes. Each is P³ and these properties persist over every finite constant field.', undefined, 'hypothesis'),
            L('host-projective-ample-cc', 'Apply the proved ambient-to-boundary CCℓ implication', 'host-boundary-cc', 'Use the ambient CC just calculated and SU22’s weak-Lefschetz / dual-Gysin isomorphism, with fixed ℓ≠p.'),
          ])),
      N('host-elliptic-curve-comparison', 'The E⁴ host supplies CCℓ on every ample boundary over EVERY finite constant extension', ellipticCC,
        'For E/𝔽₅: y²=x³−x and its finite constant extensions, this is the curve-comparison part of SU22:r22su:host. The uniform signature, the supplied CC comparison and the exact period conditions retain their stated scope and status; the native detector and covariance steps are proved.',
        G('all', 'The cited SP19 comparison for E⁴ AND the ample-boundary proof',
          'SU22 applies SP19 to E⁴ as a product of curves and then applies its proved ample-boundary lemma to each Fᵢ. Both statements apply afresh to every native curve after every finite constant extension.', [products, ellipticCC, ampleCC], [
            N('host-elliptic-ambient-cc', 'The supplied SP19 theorem gives CCℓ(E⁴ₖ′) for EVERY finite k′/𝔽₅', ellipticCC, 'This is the comparison input explicitly invoked in the full elliptic-host proof; it concerns the whole native curve group over each k′.', undefined, 'hypothesis'),
            L('host-elliptic-ample-cc', 'Apply the uniform ample-boundary argument to each prepared Fᵢ', 'host-boundary-cc', 'The boundary divisors are smooth, geometrically integral and ample. Use the same coefficient prime ℓ≠5 throughout.'),
          ])),
    ]);
  const ellipticPreparation = T('elliptic-preparation', 'The everywhere-good elliptic carrier and full section system',
    'Adjoining all three-torsion kills the finite inertia at two; the plane-cubic and Segre embeddings give the full coefficients needed by the pencils.', familyScope,
    N('elliptic-prepared', 'The fixed elliptic carrier supplies good models, the required signature and full section spanning', elliptic,
      'E₀: y²=x³−x, Ftor=ℚ(E₀[3]); Ftor is unramified above five. Use fixed further extensions unramified above five.',
      G('all', 'Everywhere-good E AND the explicit ample classes AND full Segre coefficients',
        'A=O_E(3[0])⊠O_E(3[0]) on E² and H=⊠⁴O_E(3[0]) on E⁴ supply the numerical inputs; the abelian host has the required signature.', elliptic, [
          N('elliptic-good', 'E has an everywhere-good model over Ftor', elliptic,
            'Only the prime two needs the stated potential-good argument; the curve is already good at the other primes.',
            G('all', 'CM potential good reduction AND the torsion-free congruence subgroup',
              'After adjoining all geometric three-torsion, the finite inertia image lies in the torsion-free principal congruence subgroup of GL₂(ℤ₃), so it is trivial.', elliptic, [
                N('elliptic-inertia', 'CM gives finite inertia at two; E[3] makes its image congruent to one', elliptic, 'The three-adic principal congruence subgroup contains no nontrivial torsion.', undefined, 'hypothesis'),
                N('elliptic-other-primes', 'Good reduction away from two, and Ftor unramified above five', elliptic, 'These are the stated properties of this fixed curve and torsion field.', undefined, 'hypothesis'),
              ])),
          N('elliptic-degrees', 'deg A²=18 and c=deg H⁴=4!·3⁴=1944', elliptic, 'The factors are the specified degree-three point line bundles; their product intersections give these constants.', undefined, 'proved'),
          N('elliptic-spanning', 'Plane-cubic embeddings plus Segre give FULL section spanning', elliptic, 'Thus the four conclusions below concern the full displayed linear systems, not only an embedding-polynomial image.', undefined, 'hypothesis'),
        ])));
  const ellipticFamilies = T('elliptic-families', 'Four distinct elliptic-power families',
    'Each monodromy profile uses its own actual local-model theorem; all four use the same prepared elliptic carrier and congruence argument.', familyScope,
    N('elliptic-main', 'All four displayed full linear systems contain the stated dense complete-height subsets', elliptic,
      'For each profile the fixed field is a finite extension of Ftor unramified above five; heights cover every further finite extension.',
      G('all', 'The four independently specified local profiles and their common arithmetic construction',
        'The conclusions retain distinct monodromy profiles even when the ambient linear system is identical. None of their rank formulas is used as a height criterion.', elliptic, [
          N('elliptic-first', 'E²×P³, five section factors: rank N⁴=179 and (b₁,b₂)=(4,7)', elliptic,
            'The full system is |(A⊠O(1))⁵|.',
            G('all', 'The surface-ambient model AND the prepared carrier and pencils',
              'Substitute deg A²=18 into 10deg A²−1. Apply the surface comparison with full section spanning.', [elliptic, products], [
                L('elliptic-first-model', 'The surface-ambient construction', 'products-surface', 'The actual double-stratum blowup theorem provides local vanishing.'),
                L('elliptic-first-carrier', 'The good elliptic carrier, full sections and fixed-field pencils', 'elliptic-prepared', 'Apply the congruence construction to this profile; the displayed degree gives 179.'),
              ])),
          N('elliptic-second', 'E²×P³, a curve and five hyperplanes: N⁴=0 and (b₁,b₂)=(4,7)', elliptic,
            'The same full |(A⊠O(1))⁵| contains a different dense subset; its weight-two contribution contains a nonzero eight-dimensional summand.',
            G('all', 'The mixed surface–hyperplane theorem AND full-coefficient pencils',
              'This profile uses its own mixed-family local comparison; it is not obtained by substituting into the first profile’s rank formula.', elliptic, [
                N('elliptic-second-model', 'The supplied mixed surface–hyperplane local theorem', elliptic, 'Retain its weight-two summand and uniform extension conclusion.', undefined, 'hypothesis'),
                L('elliptic-second-carrier', 'The good carrier and full Segre coefficient system', 'elliptic-prepared', 'Apply the same fixed-field congruence construction to the mixed profile.'),
              ])),
          N('elliptic-third', 'E⁴×P¹, two curves and five points: rank N²=802816, N³=0', elliptic,
            'The full system is |(H⊠O(1))⁵| and (b₁,b₂)=(8,29).',
            G('all', 'The actual curve-product blowup model AND its signature/rank calculation AND pencils',
              'The exact rank is (2g(C)−b₁(S))(2g(D)−b₁(T))(d−1)=448²·4, with g(C)=g(D)=226, b₁(S)=b₁(T)=4 and d=5.', elliptic, [
                N('elliptic-third-model', 'The double-stratum model is the actual blowup along the smoothing cuts', elliptic, 'The abelian fourfold product satisfies the local signature condition; use the supplied comparison and its N³=0 conclusion.', undefined, 'hypothesis'),
                L('elliptic-third-carrier', 'The good carrier, full sections and common pencil proof', 'elliptic-prepared', 'The numerical rank comes from the stated curve-product incidence formula.'),
              ])),
          N('elliptic-fourth', 'E⁴×P¹, five divisors and five points: rank N⁴=38864 and (b₁,b₂)=(8,29)', elliptic,
            'This is the other dense profile in the same full |(H⊠O(1))⁵|.',
            G('all', 'The PSH22 signature-only host theorem AND the explicit elliptic degree',
              'AS22:r22as:abelianlocal supplies the uniform signature for the abelian host. Substitute c=1944 into 4(5c−4); the separate SU22 curve-comparison route is also displayed.', [elliptic, products, positiveHostSource, positiveLocal], [
                L('elliptic-fourth-model', 'The full PSH22 positive-fourfold-host construction', 'host-main', 'Use its signature-only local alternative and RI18 for EVERY new cycle over EVERY finite valued extension, together with the full coefficient/pencil and global height inputs.'),
                L('elliptic-fourth-carrier', 'The prepared carrier has c=1944 and full section spanning', 'elliptic-prepared', 'The same fixed-field congruence argument gives density.'),
              ])),
        ])));
  return {
    caseId: 'arithmetic-families', trees: [assembly, pencilConstruction, pencilPreparation, density, hypersurface, productProfile, completeIntersections, productAmbients, positiveHost, hostPositiveModel, hostRamifiedNorm, hostCurveComparison, ellipticPreparation, ellipticFamilies],
    coverage: [
      C('Arithmetic families from Lefschetz pencils', 'assembly', 'main', P('sub:arithmetic-construction', 'Common arithmetic proof')),
      C('Hypersurfaces and complete intersections', 'assembly', 'hypersurface-ci-main', ci),
      C('Divisors in products with projective space', 'product-ambients', 'products-main', products),
      C('Products of elliptic curves and projective spaces', 'elliptic-families', 'elliptic-main', elliptic),
    ], sourceBindings: [],
  };
}

function classicalComparison() {
  const { N, L, T, C } = factory('classical-comparison');
  const adjunction = H('r16ha:adjunction', 'HA16 correspondence adjunction and proof');
  const moving = H('r16ha:moving', 'HA16 simultaneous moving lemma');
  const framed = H('r16mm:framed', 'MM16 framed scalar comparison and proof');
  const local = H('r16mm:local', 'MM16 local numerically admissible comparison');
  const global = H('r16mm:global', 'MM16 normalized global model comparison');
  const scope = heightScope + ' A supplied Chow factorization or numerically admissible model is required in the corresponding branch. Arithmetic model and alteration formulas also require arithmetic Green lifts of ZERO archimedean curvature. The diagrams do not assert existence of such lifts for arbitrary classes.';
  const overview = T('overview', 'Comparison with classical height pairings',
    'Adjunction gives the abelian formula; the native framed calculation gives the arithmetic-model formula; a generically finite alteration contributes its separate degree.', scope,
    N('main', 'Each stated classical formula computes the canonical analytic height', P('sec:heights', 'Height formulas and comparisons'),
      'For z∈ℋʳ(X), w∈ℋⁿ⁺¹⁻ʳ(X), use only the formula whose complete geometric and model hypotheses are supplied.',
      G('all', 'The three scoped comparison theorems',
        'These are compatible comparison conclusions, not three simultaneous assumptions on every X. Each computes the same already constructed height and therefore is independent of its auxiliary choices.', [H('r16ha:motivic-formula', 'Abelian formula'), global, H('r16ha:alteration-comparison', 'Alteration formula')], [
          L('overview-motivic', 'A Chow abelian factorization gives the normalized Künnemann sum', 'motivic-main', 'The normalization is 1/[E:ℚ] and the same fixed height sign is retained.', 'proved'),
          L('overview-model', 'Supplied regular numerically admissible lifts give normalized arithmetic intersection', 'global-main', 'The normalization is 1/[F:ℚ], with exact native finite-place factors and the archimedean convention.', 'proved'),
          L('overview-alteration', 'A degree-d alteration over E gives the factor 1/(d[E:ℚ])', 'alteration-main', 'The geometric degree and the number-field degree have different origins.', 'proved'),
        ]), 'proved'));
  const movingTree = T('moving', 'Move the cycles before pulling them to a correspondence',
    'Fibre-dimension stratification first bounds one inverse image, then permits the other cycle to avoid its closed image.', scope + ' T is smooth projective of dimension ℓ, a:T→V, b:T→X and r+q=ℓ+1; work over the original infinite field.',
    N('moving-main', 'Rationally equivalent Z,W have disjoint inverse supports and the required dimension bounds', moving,
      'The lemma treats a finite family of correspondence resolutions simultaneously, and rational cycles after clearing denominators.',
      G('all', 'The first moved cycle AND the second move against its image and fibre strata',
        'The second move makes W disjoint from B=b(a⁻¹|Z|) and meets every required fibre stratum properly.', moving, [
          N('moving-first', 'dim a⁻¹|Z|≤ℓ−r and dim B≤q−1', moving,
            'B is closed because b is proper; r+q=ℓ+1 gives the last inequality.',
            G('all', 'Fibre-dimension stratification AND a proper-moving representative',
              'For a stratum with fibre dimension k, dim S+k≤ℓ. Proper intersection of Z with its closure gives dim a⁻¹|Z|≤ℓ−r.', moving, [
                N('moving-strata', 'Finitely many fibre-dimension strata for a and b', moving, 'Use closures of the strata as the moving constraints.', undefined, 'proved'),
                N('moving-z', 'Move Z properly against every a-stratum closure over the original field', moving, 'Use the stated moving lemma, not an alteration of the field.', undefined, 'proved'),
              ]), 'proved'),
          N('moving-w', 'Move W properly against B and every b-stratum closure', moving,
            'Since dim B≤q−1 and codim W=q, proper meeting means W∩B is empty; the b-strata also give dim b⁻¹|W|≤ℓ−q.', undefined, 'proved'),
        ]), 'proved'));
  const adjunctionTree = T('adjunction', 'Adjunction for an actual Chow correspondence',
    'Resolve each correspondence component, use refined Gysin cycles in proper position, and apply the height projection formula twice.', scope + ' Γ∈CHᵐ⁺ᵈ(V×X)ℚ, m=dim V, n=dim X and r+d+q=n+1.',
    N('adjunction-main', 'h_X(Γ∗z,w)=h_V(z,ᵗΓ∗w)', adjunction,
      'Every cycle and pullback belongs to the stated admitted domains. Refined Gysin coefficients, residue degrees and complete field degrees are retained.',
      G('all', 'The resolved-component height identity AND descent/summation of actual Chow components',
        'For each geometrically integral component choose a smooth resolution j:T→Γ of generic degree one. The refined algebraic projection formulas identify its pushed cycles with the correspondence actions.', adjunction, [
          N('adjunction-component', 'h_X(b∗a!Z,W)=h_T(a!Z,b!W)=h_V(Z,a∗b!W)', adjunction,
            'T has dimension n−d; its refined cycles A=a!Z and B=b!W have disjoint supports.',
            G('all', 'Properly moved refined cycles AND the two height projection formulas',
              'The b-projection gives the first equality. The a-projection and symmetry give the second. The action is on cycle classes, not an arbitrary pushforward of actual differential forms.', [adjunction, H('r16ha:first-projection', 'First projection'), H('r16ha:second-projection', 'Second projection')], [
                L('adjunction-position', 'Use the simultaneous moving lemma', 'moving-main', 'The full refined Gysin cycles and their coefficients are used after movement.', 'proved'),
                N('adjunction-projection', 'The proper-slice projection formula and symmetry on the admitted domain', adjunction, 'Pullback membership and every stated height input are retained.', undefined, 'proved'),
                N('adjunction-chow', 'j∗[T]=[Γ] and refined Chow projection formulas', H('r16ha:refined-cycles', 'Refined coefficient identities'), 'The generic resolution degree is one, and all refined intersection coefficients remain present.', undefined, 'proved'),
              ]), 'proved'),
          N('adjunction-descent', 'Split non-geometrically-integral components over a finite E and descend', adjunction,
            'Keep the flat cycle coefficients. Absolute height invariance cancels the full field factor; sum the components and rational coefficients.', undefined, 'proved'),
        ]), 'proved'));
  const motivic = T('motivic', 'The normalized abelian height formula',
    'Expand by the actual Chow diagonal, move each return correspondence to the second argument, and use the fixed abelian comparison.', scope + ' Over finite E/F, Δ_XE=Σⱼvⱼ∘uⱼ in rational Chow, with uⱼ of degree dⱼ through the abelian Aⱼ and vⱼ of degree −dⱼ.',
    N('motivic-main', 'h_X(z,w)=[E:ℚ]⁻¹Σⱼ⟨uⱼ∗z_E,ᵗvⱼ∗w_E⟩Kun', H('r16ha:motivic-formula', 'Motivic formula and proof'),
      'The Aⱼ degrees are r+dⱼ and dim Aⱼ+1−r−dⱼ. Impossible degrees and homologically trivial rank-degree terms vanish.',
      G('all', 'The Chow-diagonal expansion AND correspondence adjunction AND the normalized abelian comparison',
        'Absolute field invariance gives h_X=h_XE. Expand z_E by the actual diagonal, then apply adjunction term by term and the fixed-sign classical abelian formula.', [H('r16ha:motivic-formula', 'Complete formula'), adjunction, H('r16mm:abelian', 'Abelian identification')], [
          N('motivic-diagonal', 'The actual rational Chow identity recovers z_E', H('r16ha:factorization', 'The factorization data'),
            'The geometric transfer theorem supplies every required admitted domain on X and each abelian factor; a realization-only decomposition is insufficient.', undefined, 'hypothesis'),
          L('motivic-adjunction', 'Move vⱼ from the first height factor to ᵗvⱼ on the second', 'adjunction-main', 'Use the admitted-domain identity with the stated complementary degrees.', 'proved'),
          N('motivic-abelian', 'h_AE=[E:ℚ]⁻¹⟨−,−⟩Kun with the same convention', H('r16mm:abelian', 'Fixed classical abelian normalization'), 'This identifies the already published classical height under the model comparison; no new existence claim is made.', undefined, 'proved'),
        ]), 'proved'), [
      N('motivic-independent', 'The value is independent of factorization, splitting field and representatives', H('r16ha:motivic-formula', 'Independence assertion'),
        'Independence follows because each allowed formula computes the canonical left-hand height.',
        G('all', 'Equality with h_X AND the already established height invariances',
          'This does not assert that arbitrary collections of abstract bilinear forms are uniquely determined by the factorization.', [H('r16ha:motivic-formula', 'Choice independence'), P('hyp:height-input', 'Height invariance')], [
            L('motivic-independent-formula', 'Every allowed choice computes h_X', 'motivic-main', 'The same proof applies after a common further finite extension.', 'proved'),
            N('motivic-independent-height', 'The canonical height descends through rational equivalence and finite field extension', P('hyp:height-input', 'Theorem: kernel-domain height invariance'), 'H16 proves these properties on the two local-kernel domains, with the fixed absolute height normalization.', undefined, 'proved'),
          ]), 'proved'),
    ]);
  const vertical = T('vertical', 'The native vertical Cartier scalar',
    'The special-fibre multiplicity in the actual model measure cancels the valuation denominator at its divisorial point.', scope + ' K/ℚₚ has its prescribed absolute value, c_R=−log|ϖ|. The model is integral, normal, flat and projective of relative dimension t. P is a HOMOGENEOUS degree-t polynomial in model first Chern classes; all zero-cycle degrees are native degrees over its residue field k.',
    N('vertical-main', '∫g_E Pᵃⁿ=c_R Σᵢaᵢdegₖ(P|Yᵢ)=c_R degₖ(P|E∩[E])', H('r16mm:vertical', 'Native vertical Cartier evaluation'),
      'For special fibre Σbᵢ[Yᵢ] and vertical Cartier divisor E=Σaᵢ[Yᵢ], retain signed coefficients and residue-field degrees.',
      G('all', 'The actual model measure AND the native divisor valuation',
        'At ξᵢ the measure coefficient contains bᵢ, while g_E(ξᵢ)=c_R aᵢ/bᵢ. Multiplication cancels bᵢ exactly, without changing fields.', H('r16mm:vertical', 'Proof of vertical evaluation'), [
          N('vertical-measure', '[Pᵃⁿ]=Σᵢbᵢdegₖ(P|Yᵢ)δξᵢ', H('r16mm:vertical', 'Actual-product/model-measure comparison'),
            'Use the frozen actual-product comparison and its continuous model-weight recursion on the normal model.', undefined, 'proved'),
          N('vertical-value', 'g_E(ξᵢ)=c_R aᵢ/bᵢ', H('r16mm:vertical', 'Native valuation index'),
            'The valuation index is bᵢ; it is not replaced by one. Normality and excellence provide the stated divisorial formal model.', undefined, 'proved'),
        ]), 'proved'));
  const cartier = T('cartier', 'The supported line-complex character over the trait',
    'A deformation over the DVR computes the exceptional contribution without forgetting the vertical or nonreduced support.', scope + ' For a nonzero line-bundle map L→M with Cartier zero scheme E, put M in homological degree zero.',
    N('cartier-main', 'chᵉ_r([L→M])∩[V]=(1/r!)Σⱼ₌₀ʳ⁻¹ mʳ⁻¹⁻ʲlʲ∩[E]', H('r16mm:cartier', 'Supported Cartier character'),
      'Here m=c₁(M|E), l=c₁(L|E). The equality lives on E over the excellent DVR itself.',
      G('all', 'The exceptional deformation identity AND the projective-bundle calculation',
        'On P=ℙ_E(N∨⊕O), N=M⊗L⁻¹, the zero-section class h satisfies h²=(m−l)h, π∗h=[E] and π∗1=0. Push eᵐ(1−e⁻ʰ) and take degree r−1.', H('r16mm:cartier', 'Deformation proof'), [
          N('cartier-deformation', 'Blow up ℙ¹_V along E×{∞}; the strict transform contributes zero', H('r16mm:cartier', 'General-base deformation'),
            'The local chart A[t,y]/(ty−f), J=(y), is valid even for singular ambient or nonreduced E because f is a non-zero-divisor.', undefined, 'proved'),
          N('cartier-polynomial', 'The exceptional push is (eᵐ−eˡ)/(m−l)∩[E]', H('r16mm:cartier', 'Formal polynomial series'),
            'This quotient denotes its polynomial series, never inversion of a Chow class. Its degree r−1 part is the displayed sum.', undefined, 'proved'),
        ]), 'proved'));
  const framedTree = T('framed', 'The concrete framed Green scalar',
    'Actual trace adjunction reduces a framed splitting presentation to line complexes; their native Cartier integrals reconstruct the supported character.', scope + ' Fix the complex C exact OFF its FULL model support and its generic trivialization; its generic support Z has pure codimension r or is empty. The testing W is integral, has dimension r−1 and is contained in X∖Z. The supplied R11 presentation has generic finite flat degree d; all analytic forms and integrations remain native over K.',
    N('framed-main', 'The concrete framed Green integral equals c_R times the supported character degree', framed,
      'The theorem concerns the fixed-supported-complex scalar, including vertical generically acyclic terms. Absolute curvature alone does not retain this information.',
      G('all', 'Finite actual trace adjunction AND weighted closure pushforward AND Cartier evaluation',
        'The concrete form is d⁻¹Tr of the signed line-complex Green forms with their degree-(r−1) Chern polynomial. Pull to each testing component with all Artinian lengths, integrate there, and push the supported character back.', framed, [
          N('framed-closure', 'The weighted normal testing closures push to d[W̄]', H('r16mm:closure-degree', 'Exact closure degree'),
            'The weights are the generic Artinian lengths eλ. Nilpotent and residue-degree data are not discarded.',
            G('all', 'Finite-flat generic testing cycle AND proper closure with its lengths',
              'The finite-flat rank gives the generic cycle identity; proper closure and pushforward retain those coefficients.', framed, [
                N('framed-presentation', 'The specified supported complex, frame and finite-flat presentation', H('r16mm:presentation', 'Framed presentation'), 'Retain the fixed differential and full model support. The degree d is the complete generic rank of this presentation. The framed comparison uses the proved full actual trace identity for these data.', undefined, 'hypothesis'),
                N('framed-lengths', 'Every generic testing component carries its Artinian multiplicity', H('r16mm:closure-degree', 'Testing multiplicities'), 'Normalize the closures without changing their weighted pushforward.', undefined, 'proved'),
              ]), 'proved'),
          L('framed-vertical', 'Evaluate each vertical line-complex term natively', 'vertical-main', 'The special-fibre multiplicity cancels against its valuation denominator; residue degrees remain.', 'proved'),
          L('framed-cartier', 'Reassemble the supported line-complex Chern character', 'cartier-main', 'Bivariant pushforward gives d times the original supported character; this d cancels the presentation factor d⁻¹.', 'proved'),
        ]), 'proved'), [
      N('framed-warning', 'A valid scalar comparison for an arbitrary generically trivial complex', framed,
        'This target still requires a specified frame. A zero absolute K₀ class or zero curvature does not supply its scalar.',
        G('blocked', 'Curvature alone loses the framed vertical scalar',
          'For [O —ϖᵃ→ O], the absolute K₀ curvature is zero but the framed scalar is a·c_R. Forgetting the frame destroys the needed datum.', framed, [
            N('framed-forgotten', 'Only the zero absolute K₀ class or curvature is retained', framed, 'The trivialization and its valuation have been forgotten.', undefined, 'hypothesis'),
          ]), 'open'),
    ]);
  const euler = T('euler', 'From the supported character to the Euler length',
    'Leading localized characters cap to the proper vertical intersection class; the zero-dimensional support identification turns it into the derived Euler length.', scope + ' The regular model has total dimension N; r+s=N and the generic Z,W are disjoint. Their vertical intersection may have positive-dimensional support.',
    N('euler-main', 'The localized intersection degree is the Euler length of O_Z̄⊗ᴸO_W̄', H('r16mm:euler', 'Euler comparison and proof'),
      'No proper-intersection assumption on the special fibre is inserted. The final Chow class is pure of dimension zero on the actual support.',
      G('all', 'Purity of the localized cap product AND the support Euler pushforward',
        'The lower localized components vanish after capping in the indicated dimensions. The degree-N product is the leading cycle product; its proper support push is the alternating residue length.', H('r16mm:euler', 'Pure-zero-dimensional Euler argument'), [
          N('euler-leading', 'The leading localized characters are [Z̄] and [W̄]; the cap product is pure zero-dimensional', H('r16mm:pure-zero', 'Cap and Adams purity'),
            'Retain the support and use the stated cap/Adams argument, including vanishing of lower-dimensional contributions.', undefined, 'proved'),
          N('euler-support', 'The supported G₀–Chow identification matches every closed point', H('r16mm:euler', 'Supported Riemann–Roch and length'),
            'Proper Euler push sends Oₓ to [κ(x):k]. Summing the derived cohomology lengths with signs gives the same degree.', undefined, 'proved'),
        ]), 'proved'));
  const localTree = T('local', 'Numerically admissible local lifts',
    'The concrete Green forms have zero curvature by the numerical detector; their framed scalar is the model intersection, and the second admissible lift removes its vertical difference.', scope + ' A regular projective model and numerically admissible pure lifts Θ_Z,Θ_W are supplied; the generic cycles are disjoint and r+s equals the total model dimension.',
    N('local-main', 'The local analytic term is c_R I(Θ_Z,Θ_W)', local,
      'The exact-support Green forms include the generically acyclic vertical complexes. The value is independent of the admitted Green choice by the two-sided construction.',
      G('all', 'Concrete numerical Green forms AND framed/Euler evaluation AND the second numerical correction',
        'First evaluate against the closure W̄. Since Θ_W−[W̄] is vertical, numerical admissibility of Θ_Z kills its contribution and replaces W̄ by Θ_W.', local, [
          N('local-green', 'The supplied pure numerically admissible resolutions have zero ACTUAL curvature', local,
            'For the supplied pure lifts, the proved numerical model detector applies in the exact operational degree and gives zero curvature on ALL actual tests. The concrete Green forms remain on the original exact cycle support complement.', undefined, 'proved'),
          N('local-evaluation', 'The concrete scalar is c_R I(Θ_Z,[W̄])', local,
            'The supported character computation and Euler comparison are both needed for this equality.',
            G('all', 'Framed scalar comparison AND the pure Euler-length identity',
              'Use the exact supported complexes and retain all local multiplicities, including vertical generically acyclic terms.', [framed, H('r16mm:euler', 'Euler comparison')], [
                L('local-framed', 'The native framed Green scalar', 'framed-main', 'Use the fixed generic trivialization.', 'proved'),
                L('local-euler', 'The supported-character / derived-Euler identity', 'euler-main', 'No proper special-fibre intersection is required.', 'proved'),
              ]), 'proved'),
          N('local-vertical', 'Θ_W−[W̄] is vertical and Θ_Z tests every vertical complementary cycle as zero', local, 'This is the full numerical admissibility condition, not only vanishing against selected components.', undefined, 'hypothesis'),
          N('local-choice', 'The proved two-sided Green-choice independence theorem applies', local, 'Both cycles have strong G from their supplied admissible lifts. The theorem therefore permits replacement of the concrete forms by the chosen admitted Green forms.', undefined, 'proved'),
        ]), 'proved'));
  const globalTree = T('global', 'The normalized global arithmetic-model formula',
    'Native local weights turn the finite scalar into the arithmetic finite-place degree; the specified Green convention supplies the matching archimedean half-factor.', scope + ' A regular projective arithmetic model over O_F and numerically admissible lifts of both classes are supplied, with arithmetic Green lifts of ZERO archimedean curvature.',
    N('global-main', 'h_X(z,w)=[F:ℚ]⁻¹ deĝ(Θ̂_Z·Θ̂_W)', global,
      'Move the generic cycles to be disjoint and extend the rational functions used in movement, retaining their vertical divisor terms.',
      G('all', 'The finite-place equality AND the archimedean equality AND Chow invariance',
        'Sum these equalities with the absolute weights used in the already constructed height. The finite sum and the archimedean contribution match the arithmetic degree term by term.', global, [
          N('global-finite', 'At v∣p the weighted local scalar is log#k(v)/[F:ℚ] times the Euler length', H('r16mm:weight', 'Exact finite-place weights'),
            'Here c_v=(log p)/e_v and the height weight is [F_v:ℚₚ]/[F:ℚ]=e_v f_v/[F:ℚ].',
            G('all', 'The native local comparison AND the complete local/global weights',
              'Multiplication cancels e_v and leaves f_v log p=log#k(v); residue lengths remain inside the intersection term.', [local, H('r16mm:weight', 'Normalization')], [
                L('global-local', 'The local equality c_v I(Θ_Z,Θ_W)', 'local-main', 'Apply at every finite place to the supplied admissible model data.', 'proved'),
                N('global-native-weights', 'c_v=(log p)/e_v and [F_v:ℚₚ]/[F:ℚ]', H('r16mm:weight', 'Native scalar and height weight'), 'The full degree, including ramification and residue degree, is retained.', undefined, 'proved'),
              ]), 'proved'),
          N('global-infinite', 'At infinity the normalized analytic Green term matches the arithmetic half-sum', global,
            'For the supplied arithmetic Green lifts of ZERO archimedean curvature, the star product reduces to its evaluation term. The Gillet–Soulé convention is −log|f|² and the analytic one is half of it; real places have weight one and complex places weight two.', undefined, 'proved'),
          N('global-moving', 'Generic movement, extended principal divisors and height Chow invariance', global,
            'Rational equivalences change the lifts by their complete principal arithmetic divisors, including vertical terms; no proper special-fibre intersection is assumed.', undefined, 'proved'),
        ]), 'proved'));
  const alteration = T('alteration', 'The alteration comparison and its two degrees',
    'The supplied upstairs model first gives downstairs membership; projection formula then gives the geometric factor, while the model normalization gives the number-field factor.', scope + ' f:Y→X_E is a smooth-projective generically finite alteration of degree d over a finite E/F; both pulled-back classes have supplied regular numerically admissible arithmetic lifts on Y.',
    N('alteration-main', 'h_X(z,w)=deĝ(Θ̂_f*z·Θ̂_f*w)/(d[E:ℚ])', H('r16ha:alteration-comparison', 'Alteration comparison and proof'),
      'A model morphism extending f is not required. Nor is f assumed finite outside the chosen cycle.',
      G('all', 'Downstairs admitted membership AND generic-degree adjunction AND the upstairs model formula',
        'The complete finite field factor is handled by absolute field invariance, separately from f∗f*=d on Chow.', H('r16ha:alteration-comparison', 'Proof of alteration formula'), [
          N('alteration-membership', 'The original z,w belong to their native local kernels', H('r16ha:alteration-comparison', 'Membership before the pairing calculation'),
            'The argument applies to both complementary classes.',
            G('all', 'Numerical vanishing upstairs AND dominant detection AND finite-constant descent',
              'The local numerical criterion kills the pulled-back obstruction; dominant injectivity and then finite-field injectivity descend it.', H('r16ha:alteration-comparison', 'Exact membership descent'), [
                N('alteration-lifts', 'The upstairs regular numerically admissible lifts are actually supplied', H('r16ha:alteration-comparison', 'Model hypothesis'), 'No general existence theorem for arbitrary classes is inferred.', undefined, 'hypothesis'),
                N('alteration-detectors', 'The proved native dominant and finite-degree obstruction detectors', H('r16ha:alteration-comparison', 'Obstruction descent inputs'), 'Use the original support and complete field degree.', undefined, 'proved'),
              ]), 'proved'),
          N('alteration-degree', 'h_Y(f*z_E,f*w_E)=d h_XE(z_E,w_E)', H('r16ha:alteration-height', 'Height projection identity'),
            'This is adjunction together with f∗f*=d; it is applied after both domains have been established.',
            G('all', 'Adjunction AND the generic-degree Chow push–pull identity',
              'Apply the graph correspondence and then divide by the nonzero rational integer d.', adjunction, [
                L('alteration-adjunction', 'The correspondence adjunction theorem', 'adjunction-main', 'Use the graph of f.', 'proved'),
                N('alteration-chow-degree', 'f∗f*=d on the relevant rational Chow classes', H('r16ha:alteration-comparison', 'Geometric degree'), 'd is the generic degree of f, not [E:ℚ].', undefined, 'proved'),
              ]), 'proved'),
          L('alteration-global', 'The upstairs model formula contributes 1/[E:ℚ]', 'global-main', 'Absolute extension invariance then identifies h_XE with h_X.', 'proved'),
        ]), 'proved'));
  const recursion = T('recursion', 'Blowups, Shioda–Katsura joins and cyclic covers',
    'The actual codimension-two blowup identity supplies a negative exceptional summand; a finite-flat cover supplies its full generic rank.', scope,
    N('blowup-main', 'For the resolved join, h_H=(h_V−h_C)/d on the specified transforms', P('cor:height-recursion', 'Signed join recursion'),
      'Let W=Bl_C(V) and g:W→H have degree d. Set a_z=q∗g*z and b_z=p∗i*g*z, with the same operations for w.',
      G('all', 'The degree-d pullback identity AND the signed blowup diagonal AND adjunction',
        'First d h_H=h_W(g*z,g*w). Expand the blowup diagonal into the ambient summand and the negative exceptional summand, then apply adjunction to each.', [P('eq:height-recursion', 'Exact recursion'), P('the-signed-join-recursion', 'Blowup proof')], [
          N('blowup-degree', 'g∗g*=d on the generic Chow groups', P('the-signed-join-recursion', 'Join degree'), 'This d is the generic degree of the actual resolved join map.', undefined, 'hypothesis'),
          N('blowup-sign', 'The codimension-two blowup formula has the negative center term', P('the-signed-join-recursion', 'Exceptional normal-bundle sign'),
            'The normal bundle of the exceptional divisor fixes the minus sign. The center classes have degrees r−1,s−1, whose sum is dim C+1.', undefined, 'hypothesis'),
          L('blowup-adjunction', 'Transfer each summand by correspondence adjunction', 'adjunction-main', 'Zero or out-of-range homological terms are omitted; split components after finite extension with absolute normalization.', 'proved'),
        ])), [
      N('cyclic-main', 'A finite-flat rank-M cover gives h_X=h_Y/M', P('eq:cyclic-height', 'Cyclic-cover height scalar'),
        'With an abelian factorization of the covering variety over E, this is (M[E:ℚ])⁻¹ times its Künnemann sum.',
        G('all', 'Finite-flat push–pull AND adjunction AND the covering formula',
          'The generic finite-flat rank M and the field degree [E:ℚ] are independent. Absorbing 1/M into a return correspondence yields the same formula.', P('the-cyclic-cover-scalar', 'Complete cyclic-cover calculation'), [
            N('cyclic-rank', 'f∗f*=M for the actual finite-flat covering map', P('the-cyclic-cover-scalar', 'Full rank identity'), 'Use its full rank with all cycle multiplicities.', undefined, 'hypothesis'),
            L('cyclic-adjunction', 'Correspondence adjunction identifies the pulled-back height', 'adjunction-main', 'Both classes are in their admitted domains.', 'proved'),
            L('cyclic-motivic', 'The normalized abelian formula on Y', 'motivic-main', 'Its normalization contributes the separate number-field factor.', 'proved'),
          ])),
    ]);
  const metrics = T('metric-overview', 'Determinant metrics and Deligne pairings',
    'The normalized complex determinant comparisons and the smooth-model non-Archimedean comparison are proved in their precise settings; general bad-reduction compatibility remains a separate target.', scope,
    N('metric-main', 'The stated normalized determinant and Poincaré metric identities hold', M('sec:metrics', 'Normalized determinant comparisons'),
      'The precise hypotheses of each of the four linked results are retained. These do not already provide every bad-reduction height metric.',
      G('all', 'The complex projection, rank-zero, cycle and good-reduction results',
        'Each result concerns its stated normalized rigidified line; the common unit rigidification removes the otherwise constant metric ambiguity.', [M('thm:quillen-isometry', 'Complex projection'), M('thm:deligne-isometry', 'Deligne pairing'), M('prop:good-reduction', 'Good-reduction comparison')], [
          L('metric-quillen', 'The normalized Quillen projection-formula isometry', 'quillen-main', 'Product Kähler metrics and unit origin rigidifications are part of the statement.', 'proved'),
          L('metric-deligne', 'Virtual rank zero gives the flat Deligne pairing', 'deligne-main', 'Use the curve determinant convention and the normalized metric.', 'proved'),
          L('metric-cycle', 'A curve correspondence gives the normalized flat Poincaré line', 'cycle-metric-main', 'Use filtered rational K₀ lifts and complementary cycle degrees.', 'proved'),
          L('metric-good', 'The source-curve good-reduction model has the canonical metric', 'good-metric-main', 'The complete DVR, smooth curve model and generic rank/degree conditions are required.', 'proved'),
        ]), 'proved'), [
      N('metric-bad-target', 'A general bad-reduction determinant metric agrees with the required admissible height metric', M('sec:remaining-metrics', 'Remaining metric comparison problem'),
        'This is an open comparison target. The smooth-model identities do not complete it.',
        G('open', 'Construct and compare the missing admissible bad-reduction metric',
          'The vertical correction depends on a semistable or Néron model. It must be compared with the actual height on the original valued field, including trace, local lengths, continuity and normalization.', [M('sec:good-reduction-metric', 'Limit of the smooth-model proof'), M('sec:remaining-metrics', 'Open extension problem')], [
            N('metric-bad-correction', 'A canonical admissible vertical correction at bad reduction', M('sec:remaining-metrics', 'Admissible correction'), 'The abelian-scheme single-component argument used at good reduction is no longer available in this form.', undefined, 'open'),
            N('metric-bad-identity', 'A native comparison identity with trace, local lengths and the fixed sign', M('sec:remaining-metrics', 'Comparison requirements'), 'A line isomorphism or a generic-fibre identity alone does not fix the local metric scalar.', undefined, 'open'),
          ]), 'open'),
    ]);
  const quillen = T('quillen', 'The normalized Quillen projection isometry',
    'Derived projection identifies the rigidified lines; equal curvature on the whole compact Jacobian and the unit origin make the metric ratio identically one.', 'C is a pointed smooth projective connected complex curve, X is a smooth projective connected complex variety, J=Pic⁰(C), and P is axis-rigidified with its standard unit metric and purely mixed Chern form Ω. Use a hermitian perfect F on C×X, K=Rq∗F, the cochain determinant convention and product Kähler metrics.',
    N('quillen-main', 'D_C×X(F)≅D_C(Rq∗F) is an exact rigidified isometry', M('thm:quillen-isometry', 'Normalized Quillen theorem'),
      'Both Chern forms are (rk K)/2 ·∫CΩ². Under the canonical rigidified identifications the normalized metric is independent of the chosen hermitian representatives and fixed product metrics.',
      G('all', 'The rigidified algebraic isomorphism AND identical curvature AND global smoothness with unit normalization',
        'The logarithm of the metric ratio is smooth pluriharmonic on compact connected J, hence constant. Unit norm at zero forces that constant to vanish.', M('thm:quillen-isometry', 'Complete proof'), [
          N('quillen-algebraic', 'Derived projection and base change identify numerator complexes and their fibres at zero', M('thm:quillen-isometry', 'Algebraic determinant identification'), 'The constant denominator uses the SAME Quillen norm as the numerator at zero.', undefined, 'proved'),
          N('quillen-curvature', 'Only Ω²/2 contributes base degree two in the BGS formula', M('eq:quillen-curvature', 'Curvature calculation'),
            'Ω already contributes degree two on C, so positive C-degree factors cannot contribute. Integration over X leaves its Euler characteristic rk K.',
            G('all', 'Purely mixed Poincaré curvature AND the determinant curvature formula',
              'The ambient integral is ∫C×X Td(T_C)Td(T_X)ch(F)(e^Ω−1); the curve calculation gives the same answer.', M('thm:quillen-isometry', 'BGS degree calculation'), [
                N('quillen-mixed', 'Ω has real degree one on C and one on J', M('sec:poincare-metric', 'Axis-rigidified Poincaré metric'), 'The pure theta-curvature terms cancel in the Poincaré construction.', undefined, 'hypothesis'),
                N('quillen-bgs', 'BGS curvature with the stated determinant and product conventions', M('thm:quillen-isometry', 'Cited curvature input'), 'Derived base change identifies the constant fibre Euler characteristic with rk K.', undefined, 'hypothesis'),
              ]), 'proved'),
          N('quillen-global', 'The normalized Quillen metrics are smooth on ALL J and unit at zero', M('thm:quillen-isometry', 'Smoothness and normalization'), 'This includes cohomology-jump loci. The same argument works after changing the allowed representative or fixed product metrics.', undefined, 'hypothesis'),
        ]), 'proved'));
  const deligne = T('deligne', 'Virtual rank zero and the flat Deligne metric',
    'Rank and determinant reduce the perfect complex to a line minus the unit line, whose normalized determinant is precisely the Deligne pairing.', 'Use the same pointed complex curve and normalized Poincaré line. K is a perfect complex of VIRTUAL RANK ZERO on C and L=det K.',
    N('deligne-main', 'D_C(K)≅⟨P,p_C*L⟩ is the unique rigidified flat isometry', M('thm:deligne-isometry', 'Deligne-pairing theorem'),
      'Any smooth hermitian metric on L may be used. The metric on the resulting rigidified line is the same normalized flat metric.',
      G('all', 'The rank-zero K₀ identity AND the determinant expression AND zero curvatures with unit origin',
        'On the nonsingular curve K₀(C)=ℤ⊕Pic(C), so [K]=[L]−[O]. The resulting four determinant factors are the Deligne pairing; compactness and the rigidification identify the metrics.', M('thm:deligne-isometry', 'Complete Deligne proof'), [
          N('deligne-k', 'The normalized determinant is λ(PL)λ(P)⁻¹λ(L)⁻¹λ(O)', M('thm:deligne-isometry', 'Rank and determinant calculation'), 'Normalize the algebraic isomorphism at zero; invertible holomorphic functions on connected projective J are constant.', undefined, 'proved'),
          L('deligne-quillen', 'The Quillen curvature is zero because rk K=0', 'quillen-main', 'Use the established curvature formula.', 'proved'),
          N('deligne-flat', 'The Deligne curvature ∫CΩc₁(L) vanishes by C-degree three', M('thm:deligne-isometry', 'Flat metric comparison'), 'Both metrics are smooth and unit at zero, so their pluriharmonic log ratio is zero.', undefined, 'proved'),
        ]), 'proved'));
  const cycleMetric = T('cycle-metric', 'Curve correspondences and filtered K₀ lifts',
    'Filtered GRR identifies the determinant with the transpose correspondence divisor, and the two normalized isometries give its flat Poincaré metric.', 'dim X=n, Γ∈CHʳ(C×X)ℚ and W∈Vⁿ⁺¹⁻ʳ(X). Choose rational K₀ lifts with Chern characters starting in the indicated degrees; use F=E_Γ⊗ᴸp_X*E_W.',
    N('cycle-metric-main', 'The normalized determinant is the flat Poincaré line of ᵗΓ∗W', M('cor:cycle-determinant', 'Cycle-determinant corollary'),
      'The divisor ᵗΓ∗W has degree zero because W is homologically trivial.',
      G('all', 'Filtered GRR AND the two normalized isometries AND rational-lift independence',
        'For rational classes take a common tensor power, apply the integral identities and then take the positive real root of the metric norm.', M('cor:cycle-determinant', 'Full corollary proof'), [
          N('cycle-metric-grr', 'rk Rq∗F=0 and c₁(det Rq∗F)=ᵗΓ∗W', M('eq:grr-leading', 'Leading filtered GRR'),
            'The product Chern character starts in codimension n+1, so positive Todd terms cannot affect rank or c₁.', undefined, 'proved'),
          L('cycle-metric-quillen', 'Project the normalized determinant to C', 'quillen-main', 'Use the exact projection-formula isometry.', 'proved'),
          L('cycle-metric-deligne', 'Identify the curve rank-zero determinant with its Deligne line', 'deligne-main', 'The degree-zero divisor gives the normalized flat Poincaré metric.', 'proved'),
          N('cycle-metric-lifts', 'Changing higher-filtration lifts changes the product only in codimension ≥n+2', M('cor:cycle-determinant', 'Independence of cycle lifts'), 'That codimension is zero on C×X, so the rational Chern character gives the same normalized line.', undefined, 'proved'),
        ]), 'proved'), [
      N('cycle-metric-height', 'The corresponding disjoint-cycle trivialization gives the stated archimedean height convention', M('sec:correspondence-metric', 'Biextension and height comparison'),
        'A zero or pole of a meromorphic incidence frame is distinct from a singularity of the smooth line metric.',
        G('all', 'The determinant–cycle–Hodge comparison AND the fixed sign conventions',
          'The cited relative comparison has an inversion under its conventions. Fixing the cochain determinant and matching Poincaré sign removes the ambiguity; for s=fe, −log∥s∥=−log|f|−log∥e∥.', M('sec:correspondence-metric', 'Classical comparison and incidence continuity'), [
            N('cycle-metric-biextension', 'The cited determinant–cycle–Hodge and relative comparison theorems', M('sec:correspondence-metric', 'External comparison inputs'), 'Use the precise disjoint-cycle trivialization and conventions named in the paper.', undefined, 'hypothesis'),
            L('cycle-metric-smooth', 'The normalized Poincaré line metric is smooth across incidence', 'cycle-metric-main', 'The meromorphic frame, not the metric in a nonvanishing local frame, accounts for its zero/pole term.', 'proved'),
          ])),
    ]);
  const goodMetric = T('good-metric', 'The good-reduction source-curve model metric',
    'The generic rigidified identity differs by a vertical divisor; a geometrically integral special fibre and the unit zero section force that divisor to vanish.', 'Over a complete DVR with its FIXED absolute value, C is a smooth proper geometrically connected curve with a section and J its abelian-scheme Jacobian. K is model-perfect with generic virtual rank zero and deg det K_generic=0.',
    N('good-metric-main', 'The normalized determinant model metric is the canonical rigidified Poincaré metric', M('prop:good-reduction', 'Good-reduction proposition'),
      'An ambient model reduces to this case only when its derived pushforward to the source curve is perfect.',
      G('all', 'The generic rank-zero rigidified identity AND extension with no vertical divisor AND Poincaré laws',
        'Normality extends the identity and its inverse over the whole model. The extended Poincaré multiplication laws are isometries, identifying the model metric with the canonical one.', M('prop:good-reduction', 'Complete model-metric proof'), [
          N('good-metric-generic', 'det K has degree zero on every fibre and defines a relative Pic⁰ point', M('prop:good-reduction', 'Relative Picard construction'), 'Rigidify along the section; the generic rank-zero determinant identity respects the unit at the origin.', undefined, 'proved'),
          N('good-metric-divisor', 'The quotient divisor is a[J_s] and its coefficient a is zero', M('prop:good-reduction', 'Vertical correction calculation'),
            'The abelian scheme is regular and its special fibre is geometrically integral.',
            G('all', 'A single integral special-fibre component AND unit integral origin rigidifications',
              'Pulling a[J_s] to the zero section gives valuation a. Both origin frames are units, so that valuation is zero.', M('prop:good-reduction', 'Origin valuation proof'), [
                N('good-metric-regular', 'Regular J with geometrically integral special fibre', M('prop:good-reduction', 'Smooth-model geometry'), 'This is why an arbitrary vertical divisor has just this one coefficient.', undefined, 'hypothesis'),
                N('good-metric-unit', 'Both model lines have integral unit origin rigidifications', M('prop:good-reduction', 'Exact normalization'), 'Retain the native absolute value and the actual model lines.', undefined, 'hypothesis'),
              ]), 'proved'),
          N('good-metric-laws', 'The Poincaré multiplication laws extend over the abelian scheme', M('prop:good-reduction', 'Canonical metric identification'), 'The induced model maps are isometries.', undefined, 'hypothesis'),
        ]), 'proved'));
  return {
    caseId: 'classical-comparison', trees: [overview, movingTree, adjunctionTree, motivic, vertical, cartier, framedTree, euler, localTree, globalTree, alteration, recursion, metrics, quillen, deligne, cycleMetric, goodMetric],
    coverage: [
      C('Comparison with classical height pairings', 'overview', 'main', P('sec:heights', 'Classical formulas')),
      C('Blowups and Shioda–Katsura constructions', 'recursion', 'blowup-main', P('cor:height-recursion', 'Signed blowup recursion')),
      C('Determinant metrics and Deligne pairings', 'metric-overview', 'metric-main', M('sec:metrics', 'Determinant-metric comparisons')),
    ], sourceBindings: [],
  };
}

function arithmeticProperties() {
  const { N, L, T, C } = factory('arithmetic-properties');
  const blocks = A('sec:chow-blocks', 'Exact Chow blocks');
  const square = A('lem:square-zero', 'Square-zero Lefschetz calculation');
  const lefschetz = A('sec:lefschetz-proof', 'Both directions of the Lefschetz reduction');
  const primitive = A('thm:primitive-squares', 'Primitive sum of squares');
  const propagation = A('cor:positivity-propagation', 'Positivity and integral finiteness propagation');
  const projector = A('prop:central-projector', 'The maximal curve-visible projector');
  const central = A('thm:central-northcott', 'The exact central Northcott criterion');
  const packageProof = A('sec:proof-main', 'Proof of the equivalence of the product and residual programmes');
  const fixedScope = arithmeticScope + ' For a fixed odd subproduct |S|=2c−1, U=Π∗CHᶜ_hom,ℚ, A=U∩CHᶜ_alg,ℚ and G=U/A. Define all curve-visible projectors over ONE fixed F₀, then work over every required finite E/F₀.';
  const programme = T('programme', 'Arithmetic hard Lefschetz, positivity and finiteness',
    'The complete product package is equivalent to three still-open central assertions under H1–H4. The subsequent trees show both directions and isolate the additional arithmetic conditions.', arithmeticScope,
    N('main', 'Arithmetic hard Lefschetz AND primitive integral bounded-degree Northcott', A('thm:program-equivalence', 'The exact conjectural package'),
      'The target is for the fixed pointed product and positive integral polarization, in every required degree and over every finite extension. The equivalence is proved conditionally; the three inputs remain open.',
      G('iff', 'IFF the WHOLE three-part package holds on ALL subproducts',
        'Under H1–H4, the theorem proves both directions for this full conjunction. No single child is equivalent to the whole target.', [A('thm:program-equivalence', 'Exact equivalence statement'), packageProof], [
          N('offcentral', 'All off-central subproduct cores vanish', Q('conj:offcentral', 'Off-central vanishing'), 'For EVERY subproduct Y_S, EVERY finite E/F₀ and EVERY c with |S|≠2c−1, require U_Sᶜ(E)=0.', undefined, 'open'),
          N('aj', 'The algebraic Abel–Jacobi map is rationally injective on every central A', Q('conj:AJ', 'Central algebraic Abel–Jacobi injectivity'), 'For EVERY odd subproduct |S|=2c−1 and EVERY finite E/F₀.', undefined, 'open'),
          N('residual-nc', 'Each central residual form has integral bounded-degree Northcott', Q('conj:residual-northcott', 'Residual integral Northcott'), 'Count projected images of actual integral cycles in the common geometric rational quotient, with both a height and a field-degree bound.', undefined, 'open'),
        ], { 'R2-L3': 'The conditional equivalence, with both directions expanded in the package-proof tree. It does not establish the three open conditions.' }), 'open'), [
      N('package-theorem', 'Under H1–H4 the displayed equivalence itself is proved', packageProof,
        'The Chow Lefschetz reduction does not require the height axioms; the height, radical and Northcott steps do.',
        G('all', 'The forward construction AND the reverse recovery',
          'The two separate directions are expanded below; they use the same fixed product, polarization, projectors, integral images and field quantifiers.', packageProof, [
            L('package-forward-link', 'The three central assertions imply the product package', 'package-forward', 'Use the exact central criterion and the primitive coefficient formula.'),
            L('package-reverse-link', 'The product package recovers all three central assertions', 'package-reverse', 'Inflate a central core by fundamental classes; its primitive height is an explicit positive multiple.'),
          ])),
    ]);
  const chowBlocks = T('chow-blocks', 'The actual Chow-block decomposition',
    'Tensor the three curve projectors, identify each image by explicit inverse correspondences, and rescale the point factors so the polarization is square-zero raising.', 'X=∏ᵢ₌₁ⁿCᵢ with chosen rational points, Hᵢ their pullback point divisors and ℓ=ΣaᵢHᵢ with positive integers aᵢ. This decomposition and its integral denominator control do not require height axioms.',
    N('blocks-main', 'V*(X_E)=⊕_{S,c} U_Sᶜ(E)⊗B_I[c], with ℓ acting as E=Σᵢ∈I xᵢ', blocks,
      'I=[n]∖S, B_I=ℚ[xᵢ]/(xᵢ²), and u⊗x_T maps to a_T j_Tu. The same identities hold on integral images.',
      G('all', 'Actual inverse projector correspondences AND the polarization calculation',
        'Orthogonal tensor projectors give the direct sum. Rescaling by a_T converts multiplication by the weighted polarization into E on B_I.', blocks, [
          N('blocks-inverses', 'b_Tj_T=Π_S and j_Tb_T=P_{S,T,U} in rational Chow', A('eq:chow-decomposition', 'Projector decomposition'),
            'j_T inserts points on T and fundamental classes on U; b_T projects z·∏ᵢ∈U Hᵢ to Y_S. These operations have integral coefficients.',
            G('all', 'The orthogonal curve projectors AND their tensor products',
              'Use π₀=o×C, π₂=C×o, π₁=Δ−π₀−π₂ and partition [n]=S⊔T⊔U.', blocks, [
                N('blocks-curve', 'π₀,π₁,π₂ are actual orthogonal Chow projectors summing to Δ', blocks, 'Their transposes exchange π₀,π₂ and fix π₁.', undefined, 'proved'),
                N('blocks-insert', 'Explicit insertion and projection correspondences j_T,b_T', blocks, 'Intersections with degree-one point divisors recover the source class exactly.', undefined, 'proved'),
              ]), 'proved'),
          N('blocks-raising', 'Hᵢπ₁,ᵢ=0 and the weighted coordinate map turns ℓ into Σxᵢ', A('eq:weighted-chow-block', 'Weighted block identity'), 'This is an actual Chow-composition identity, not just a cohomological equality.', undefined, 'proved'),
        ]), 'proved'), [
      N('blocks-integral', 'One fixed integer N_a=∏ᵢaᵢ clears every block-coordinate denominator', A('eq:coordinate-denominator', 'Uniform integral coordinate bound'),
        'The bound works in every degree and every finite extension.',
        G('all', 'Integral inverse correspondences AND the displayed rescaling',
          'For an integral z, a_Tu_T lies in the central integral image. Every a_T divides N_a.', blocks, [
            L('blocks-integral-inverses', 'The inverse maps have integral coefficients', 'blocks-inverses', 'Thus the unweighted component class is an integral image.', 'proved'),
            N('blocks-integral-weights', 'a_T=∏ᵢ∈T aᵢ divides N_a', A('eq:coordinate-denominator', 'Common denominator'), 'The weights aᵢ are fixed positive integers.', undefined, 'proved'),
          ]), 'proved'),
    ]);
  const squareZero = T('square-zero', 'Square-zero Lefschetz strings and the exact star constant',
    'Raising and lowering form finite sl₂ strings; inclusion–exclusion determines the sign and factorial on their primitive part.', 'B_I has monomial basis x_T, |I|=m. Let E add one variable, F delete one variable, Hx_T=(m−2|T|)x_T and *x_T=x_{I∖T}. This is a rational algebra calculation.',
    N('square-main', 'Eᵐ⁻²ᵗ is an isomorphism and primitive degree-t vectors are exactly ker F', square,
      'For 0≤t≤m/2: Eᵐ⁻²ᵗ:B_Iᵗ→B_Iᵐ⁻ᵗ and ker Eᵐ⁻²ᵗ⁺¹=ker F.',
      G('all', 'The commutator identities AND positive adjointness',
        'If Fv=0, then FEʲv=j(m−2t−j+1)Eʲ⁻¹v. Adjointness forces a nonzero string through Eᵐ⁻²ᵗv and then termination; successive orthogonal ker F and im E decompose B_I.', square, [
          N('square-commutators', '[F,E]=H, [H,F]=2F, [H,E]=−2E', square, 'Check on the monomial basis by counting variables added or deleted.', undefined, 'proved'),
          N('square-adjoints', 'E and F are adjoint for orthonormal monomials', square, 'This positive scalar product proves the asserted nonzero string lengths.', undefined, 'proved'),
        ]), 'proved'), [
      N('square-star', 'For z∈M⊗ker F, Eᵐ⁻²ᵗz=(−1)ᵗ(m−2t)! *z', A('eq:star-identity', 'Exact primitive star identity'),
        'The identity includes t=0 and coefficients in any rational vector space M.',
        G('all', 'Coefficient vanishing from Fz=0 AND inclusion–exclusion AND the raising multiplicity',
          'For |J|<t, the coefficient of x_J in Fᵗ⁻|J|z gives Σ_{T⊃J}u_T=0. For |K|=m−t, inclusion–exclusion gives Σ_{T⊂K}u_T=(−1)ᵗu_{I∖K}; E contributes the factor (m−2t)!.', square, [
            N('square-coefficients', 'Fz=0 gives all lower containment sums zero', square, 'The coefficient has the nonzero factor (t−|J|)!, which can be divided in ℚ.', undefined, 'proved'),
            N('square-inclusion', 'Inclusion–exclusion leaves only the complementary coefficient', square, 'All proper subsets of I∖K vanish in the alternating containment sum.', undefined, 'proved'),
          ]), 'proved'),
    ]);
  const lefschetzTree = T('lefschetz', 'Both directions of the arithmetic Lefschetz reduction',
    'Central blocks have precisely the square-zero string length; every noncentral block obstructs either injectivity or surjectivity.', 'Fix the pointed product, polarization and ONE finite field E. The statement is an unconditional rational Chow equivalence for this data and has no height assumption.',
    N('lefschetz-main', 'All off-central U_Sᶜ(E) vanish ⇔ every required ℓⁿ⁺¹⁻²ʳ map is an isomorphism', A('thm:main-lefschetz', 'Arithmetic Lefschetz equivalence'),
      'The exponent and both domains are the ones of the product of n curves. The statement concerns ALL subproducts and all required degrees.',
      G('all', 'Prove EACH direction of the stated equivalence',
        'The children are the two proof directions, not individually the hypotheses of an IFF gate.', lefschetz, [
          N('lefschetz-forward', 'Off-central vanishing makes every block map a square-zero Lefschetz isomorphism', lefschetz,
            'On a surviving block |S|=2c−1, m=n−|S| and t=r−c give n+1−2r=m−2t. If t<0 both block spaces vanish.',
            G('all', 'Central-only blocks AND the square-zero string theorem',
              'Take the direct sum of the blockwise isomorphisms.', lefschetz, [
                N('lefschetz-central-input', 'Every nonzero core has |S|=2c−1', A('thm:main-lefschetz', 'Forward-direction hypothesis'), 'Assumed for this direction, not established by the block decomposition.', undefined, 'hypothesis'),
                L('lefschetz-block-input', 'The exact Chow blocks and square-zero strings', 'square-main', 'Use the coefficient identification of blocks-main.', 'proved'),
              ]), 'proved'),
          N('lefschetz-reverse', 'An isomorphism in every required degree rules out every noncentral block', lefschetz,
            'If U_Sᶜ≠0, put k=|S|, m=n−k and d=k+1−2c. Both d≠0 cases contradict an asserted isomorphism.',
            G('all', 'Exclude the positive-d case AND exclude the negative-d case',
              'Multiplication preserves each actual Chow block, so a failure in that block cannot be repaired by a different summand.', lefschetz, [
                N('lefschetz-too-long', 'd>0: r=c gives exponent m+d>m and kills U_Sᶜ⊗1', lefschetz, 'A nonzero source is sent to zero, contradicting injectivity.', undefined, 'proved'),
                N('lefschetz-no-source', 'd<0: r=k+1−c has polynomial source degree d<0 and a nonzero top target', lefschetz, 'The permitted r has zero source in this block and target U_Sᶜ⊗x_I, contradicting surjectivity.', undefined, 'proved'),
              ]), 'proved'),
        ]), 'proved'));
  const primitiveTree = T('primitive', 'The primitive sum of squares with its full constant',
    'Complementary projector indices isolate identical coefficients; the primitive star identity supplies the sign and factorial.', arithmeticScope + ' Fix a CENTRAL block |S|=2c−1, m=n−|S| and 0≤t=r−c≤m/2. This central-block identity does not assume off-central vanishing.',
    N('primitive-main', 'q_ℓ,r(z_S)=(m−2t)!·a_I·Σ|T|=t q_S,c(u_T)', primitive,
      'Here z_S=Σu_Tx_T is primitive, a_I=∏ᵢ∈I aᵢ and q_S,c(u)=(−1)ᶜh_YS(u,u).',
      G('all', 'The primitive star identity AND complementary-index adjunction AND the weight/sign calculation',
        'Primitivity is Fz_S=0. Only each coefficient paired with its own complementary index survives. Their weights multiply to a_I and (−1)ʳ⁺ᵗ=(−1)ᶜ.', primitive, [
          L('primitive-star', 'Eᵐ⁻²ᵗz_S=(−1)ᵗ(m−2t)! *z_S', 'square-star', 'The primitive exponent is m−2t+1.', 'proved'),
          N('primitive-pair', 'h_X(j_Tu,j_{I∖T}v)=h_YS(u,v), and all nonmatching blocks are orthogonal', A('eq:complement-height', 'Exact complementary-block pairing'),
            'Transpose swaps the point and fundamental-class indices. Its composition integrates one degree-one point in each omitted factor.',
            G('all', 'Actual transpose projector identities AND H3 correspondence adjunction',
              'This is the height-theoretic step of the sum-of-squares proof; the prior square-zero algebra alone does not supply it.', primitive, [
                L('primitive-transposes', 'The actual Chow projector and insertion identities', 'blocks-main', 'Transposition exchanges T and I∖T.', 'proved'),
                N('primitive-h3', 'H3 holds on all required correspondence sources and products', A('def:heights', 'Full height axioms'), 'The matching normalization and other standing H1–H4 assumptions remain in force.', undefined, 'hypothesis'),
              ])),
          N('primitive-constant', 'a_Ta_{I∖T}=a_I and r=c+t', primitive, 'These identities give the exact positive coefficient (m−2t)!a_I and the central sign.', undefined, 'proved'),
        ])));
  const propagationTree = T('propagation', 'From central forms to primitive positivity and integral finiteness',
    'The same sum-of-squares identity gives positivity from real central positivity, while finiteness additionally uses central integral Northcott and one common coordinate denominator.', arithmeticScope,
    N('propagation-main', 'Real primitive positivity and nondegenerate complementary pairings', propagation,
      'This conclusion is over a FIXED number field, including real scalar extension.',
      G('all', 'ALL off-central cores vanish AND every central form is REAL positive definite',
        'Complementary blocks then pair nondegenerately; distinct S are orthogonal. Positive coefficients in the primitive formula give primitive definiteness, and q(z+tw)≥0 gives Cauchy–Schwarz.', propagation, [
          N('propagation-offcentral', 'All off-central subproduct cores vanish over the fixed field', A('thm:main-lefschetz', 'Central-only hypothesis'), 'This is an additional hypothesis, not a consequence of the central primitive identity.', undefined, 'hypothesis'),
          N('propagation-positive', 'Every central q_S,c is positive definite AFTER real scalar extension', propagation, 'Positivity only on nonzero rational vectors is insufficient.', undefined, 'hypothesis'),
          L('propagation-formula', 'The exact primitive sum-of-squares and complementary pairings', 'primitive-main', 'All coefficients (m−2t)!a_I are strictly positive.'),
        ])), [
      N('primitive-nc', 'Primitive integral bounded-degree Northcott on the full product', propagation,
        'Count the intersection of the actual integral cycle image with the primitive subspace, over fields with bounded degree.',
        G('all', 'Off-central vanishing over EVERY extension AND central bounded-degree Northcott AND fixed coefficient denominators',
          'Central Northcott forces nonnegative rational central forms. If q_ℓ,r(z)≤B, every coordinate has q_S,c(u_T)≤B/((m−2t)!a_I), while N_a u_T is integral. Each coordinate therefore has finitely many possibilities; finitely many injective blocks give finiteness.', propagation, [
            N('primitive-nc-central', 'Every central projected integral image has bounded-degree Northcott', central, 'A rational nonpositive central vector would have infinitely many bounded-height integral multiples, so all terms are nonnegative.', undefined, 'hypothesis'),
            N('primitive-nc-offcentral', 'Every off-central core vanishes over every required finite extension', Q('conj:offcentral', 'Fieldwise core hypothesis'), 'The global field-degree bound is kept when selecting each coordinate.', undefined, 'hypothesis'),
            L('primitive-nc-coordinates', 'N_a clears ALL block-coordinate denominators uniformly', 'blocks-integral', 'There is one fixed N_a, independent of the extension and cycle.', 'proved'),
            L('primitive-nc-formula', 'The primitive height bounds each coordinate separately', 'primitive-main', 'Use nonnegativity of every other central term.'),
          ])),
    ]);
  const visibleProjector = T('visible-projector', 'The actual maximal curve-visible Chow projector',
    'A geometric positive semisimple endomorphism of a product of Jacobians has a polynomial pseudoinverse; faithful h¹ realization turns its identities into actual Chow identities.', fixedScope + ' The geometric construction of e,R and the abelian summand does not require the height axioms.',
    N('projector-main', 'Actual self-transpose Chow projectors e and R=Π−e, with eU_E≅B(E)ℚ', projector,
      'One fixed F₀ defines the finitely many spanning curve correspondences and source points; the same projectors and abelian variety work for EVERY finite E/F₀.',
      G('all', 'A faithful semisimple curve endomorphism AND its polynomial pseudoinverse',
        'Set a=ᵗΓΓ, a⁺=f(a), p=a⁺a and e=Γa⁺ᵗΓ. Faithfulness gives a⁺aa⁺=a⁺ and p²=p=ᵗp as actual Chow identities; hence e²=e=ᵗe and eΠ=Πe=e.', projector, [
          N('projector-a', 'a lies in End(⊕h¹Cⱼ)=End(J)ℚ, is semisimple, and ker a=ker Γ', projector,
            'The entries are divisor correspondences because 2c−dim Y=1. Geometric Hodge–Riemann applies to the primitive middle curve-visible space W.',
            G('all', 'A finite family spans the maximal geometric W AND geometric Hodge–Riemann with faithful h¹ realization',
              'Transposition is Rosati adjunction; (−1)ᶜ⁻¹a is positive semidefinite. This is a geometric positivity theorem, distinct from conjectural height positivity.', projector, [
                N('projector-carrier', 'Finitely many projected curve correspondences span ALL W', projector, 'Γⱼ=ΠΓⱼπ₁,ⱼ and J=∏Pic⁰(Cⱼ), all over one F₀.', undefined, 'hypothesis'),
                N('projector-faithful', 'The actual h¹ endomorphism realization is faithful and W is primitive', projector, 'The actual Chow identity ℓ_YΠ=0 proves geometric primitiveness; Hodge–Riemann supplies the sign.', undefined, 'hypothesis'),
              ]), 'proved'),
          N('projector-inverse', 'Choose f∈ℚ[t] equal to 1/t on nonzero spectrum and zero at zero', projector, 'The fixed maps Γ and a⁺ᵗΓ identify B=pJ, up to isogeny, with eU_E on rational points.', undefined, 'proved'),
        ]), 'proved'), [
      N('visible-height', 'q_e=(−1)ᶜh_Y on eU is a positive Néron–Tate form', projector,
        'This height conclusion uses H3 and H4 in addition to the geometric projector construction.',
        G('all', 'The abelian Chow identification AND curve adjunction/normalization',
          'Adjunction gives h_Y(Γx,Γy)=h_curves(x,ay). The positive form (−1)ᶜ⁻¹a on pJ and −h_C equal to Néron–Tate give the asserted positive polarization.', projector, [
            L('visible-height-projector', 'The actual projector and abelian summand', 'projector-main', 'Use the same fixed a and B.', 'proved'),
            N('visible-height-axioms', 'H3 full correspondence adjunction and H4 the fixed curve sign', A('def:heights', 'Height axioms'), 'All standing H1–H4 hypotheses remain in force.', undefined, 'hypothesis'),
          ])),
    ]);
  const invisible = T('invisible', 'Why curve-invisible algebraic cycles are in the radical',
    'Zero cohomological action forces the transpose divisor’s Abel–Jacobi class to vanish, which is the divisor itself on a curve; height adjunction then gives radical membership.', fixedScope,
    N('invisible-main', 'If Γ∗H¹(C)=0, then Γ∗Pic⁰(C)ℚ lies in the full height radical', A('lem:invisible', 'Curve-invisible cycles lemma'),
      'Γ∈CHʳ(C×X)ℚ and the tested w lies in Vⁿ⁺¹⁻ʳ(X). The statement is about every such complementary test class.',
      G('all', 'The transpose divisor vanishes AND correspondence adjunction',
        'For every degree-zero divisor D, h_X(Γ∗D,w)=h_C(D,ᵗΓ∗w)=0.', A('lem:invisible', 'Complete invisible-cycle proof'), [
          N('invisible-divisor', 'ᵗΓ∗w=0 in Pic⁰(C)ℚ', A('lem:invisible', 'Transpose Abel–Jacobi argument'),
            'Rational divisor vanishing after complex base change descends.',
            G('all', 'Poincaré duality AND Abel–Jacobi functoriality AND the curve identification',
              'Duality makes the transpose geometric map to H¹(C) zero. Its Abel–Jacobi value vanishes, and on a curve rationalized AJ identifies the class with Pic⁰.', A('lem:invisible', 'Divisor-detection proof'), [
                N('invisible-zero-action', 'Γ has zero geometric H¹ action', A('lem:invisible', 'Exact hypothesis'), 'This condition concerns the projected curve correspondence.', undefined, 'hypothesis'),
                N('invisible-aj', 'AJ is correspondence-functorial and is Pic⁰ on a curve', A('lem:invisible', 'Geometric divisor input'), 'Use the stated rationalized map and base-change descent.', undefined, 'hypothesis'),
              ]), 'proved'),
          N('invisible-adjunction', 'The supplied H3 identity holds for Γ and every complementary w', A('def:heights', 'Full adjunction'), 'The resulting zero is in the full radical, not only the radical against algebraic tests.', undefined, 'hypothesis'),
        ])));
  const residual = T('residual', 'The algebraic radical and the residual pairing',
    'Maximality makes every residual curve correspondence invisible; the nondegenerate visible abelian part identifies all the relevant kernels, and self-transposition makes the quotient orthogonal.', fixedScope,
    N('residual-main', 'RA=ker(AJℚ|A)=A∩rad(U)=rad(A), and h_G on G=U/A is well-defined', projector,
      'U=eU⊕RU is orthogonal. The residual form is independent of the chosen maximal curve-visible projector.',
      G('all', 'The residual algebraic classes are invisible AND the visible abelian part is detected AND self-transpose orthogonality',
        'Curve generation makes RA both AJ-zero and fully radical. On eU⊂A, AJ is rationally injective and the height nondegenerate. These facts identify the kernel and radicals; the residual form descends to RU/RA≅G.', projector, [
          N('residual-invisible', 'Every later RΔ from a curve has zero geometric H¹ action', projector,
            'Maximality of W includes all curves after finite extensions, not merely the finite family initially selected.',
            G('all', 'Maximal W AND curve generation with trace descent AND the invisible-cycle lemma',
              'Every geometrically algebraically trivial cycle is generated from curves after finite extension and traced back. Apply the invisible lemma to RΔ.', projector, [
                L('residual-maximal', 'The maximal geometric projector', 'projector-main', 'Its complement kills the geometric action of every curve correspondence.', 'proved'),
                L('residual-invisible-lemma', 'Curve-invisible cycles lie in the FULL radical', 'invisible-main', 'The same zero geometric action kills their Abel–Jacobi classes.'),
                N('residual-curve-generation', 'Geometrically algebraic cycles are curve-generated after finite extension', A('sec:invisible-cycles', 'Curve generation and trace'), 'Trace descends the finite data to E; rational coefficients allow the finite degree to be divided.', undefined, 'hypothesis'),
              ])),
          N('residual-visible', 'AJ is rationally injective and q_e is nondegenerate on eU⊂A', projector, 'The map from B to the intermediate Jacobian has injective rational H₁, hence finite kernel; visible-height supplies the positive Néron–Tate form.', undefined, 'conditional'),
          N('residual-orthogonal', 'e=ᵗe gives orthogonality; two orthogonalized lifts differ in A∩A⊥', projector, 'The identified radical makes their difference fully invisible to heights, so the quotient form and its value are independent of e.', undefined, 'conditional'),
        ])));
  const visibleIntegral = T('visible-integral', 'Integral control of the visible Néron–Tate summand',
    'A fixed correspondence denominator converts the projected class into an actual point of a fixed Jacobian, where classical Northcott applies.', fixedScope,
    N('visible-integral-main', 'The projected integral image in eU has bounded-degree Northcott with any fixed denominator bound', A('lem:visible-integral', 'Visible integral Northcott lemma'),
      'The projector is rational; the argument controls its denominators explicitly rather than treating ez as an integral abelian point.',
      G('all', 'One fixed integral detecting correspondence AND polarization comparison AND classical Northcott',
        'Let D=a⁺ᵗΓ with De=D. Choose N clearing its Chow denominators. For integral z, NDz is an actual point of J(E) detecting ez, and its Néron–Tate height is bounded by a fixed multiple of q_e(ez).', A('lem:visible-integral', 'Full integral-control proof'), [
          N('visible-integral-detector', 'ND is integral and D is injective on eU', A('lem:visible-integral', 'Fixed denominator and detection'), 'N is independent of the cycle and the finite extension; any prescribed extra denominator bound is absorbed once.', undefined, 'hypothesis'),
          L('visible-integral-polarization', 'q_e is a positive Néron–Tate form on the fixed B', 'visible-height', 'Comparing its polarization with the ambient J polarization bounds the height of NDz.'),
          N('visible-integral-nc', 'Classical bounded-degree Northcott on the actual points of J', A('lem:visible-integral', 'Classical finiteness input'), 'Keep the fixed height and degree bounds; rationalization removes torsion without changing these heights.', undefined, 'hypothesis'),
        ])));
  const centralNC = T('central-northcott', 'The exact central Northcott equivalence',
    'Central finiteness excludes an AJ kernel and bounds the residual image; conversely the residual ball and visible abelian ball determine the class when the AJ kernel vanishes.', fixedScope,
    N('central-main', 'Central integral Northcott', central,
      'The same equivalence holds either over one fixed E, or with bounded degree and the vanishing condition over EVERY finite E/F₀.',
      G('iff', 'IFF the WHOLE bundle: algebraic AJ injectivity AND residual integral Northcott',
        'The equivalence uses the actual orthogonal projector, its fixed denominators and H1–H4. The two directions are expanded below.', central, [
          N('central-aj-input', 'ker(AJℚ|A_E)=0 for every field required by the chosen version', central, 'For the fixed-field version only that E is required.', undefined, 'hypothesis'),
          N('central-residual-input', 'q_G has Northcott on the projected residual integral image with the SAME field quantifier', central, 'The residual quotient is viewed in the common geometric rational group and injects under field extension.', undefined, 'hypothesis'),
        ])), [
      N('central-forward', 'Central Northcott implies AJ-kernel zero and residual Northcott', central,
        'Choose one integer M making MR an integral correspondence.',
        G('all', 'The zero-height kernel argument AND the denominator-cleared residual lift',
          'A nonzero rational AJ-kernel class can be made integral; its distinct multiples have height zero. For a residual integral ξ represented by z, MRz is integral, q_U(MRz)=M²q_G(ξ), and [MRz]=Mξ. Finite central balls therefore bound ξ.', central, [
            N('central-forward-assumption', 'Central integral Northcott with the stated field quantifier', central, 'Use the theorem’s premise for this direction.', undefined, 'hypothesis'),
            L('central-forward-radical', 'The AJ kernel is RA and is in the full height radical', 'residual-main', 'This supplies the zero-height conclusion for all integer multiples.'),
            N('central-forward-denominator', 'One M clears the fixed rational projector R', central, 'Multiplication by M is injective in the rational geometric quotient, and the field-degree bound is unchanged.', undefined, 'hypothesis'),
          ])),
      N('central-reverse', 'AJ-kernel zero and residual Northcott imply central Northcott', central,
        'Orthogonality gives q_U(z)=q_e(ez)+q_G([z]), with both terms nonnegative.',
        G('all', 'A finite residual ball AND a finite visible ball AND the injective joint detector',
          'Residual Northcott excludes a nonzero rational class of nonpositive height by its integral multiples. A bound on q_U therefore bounds both terms. The map z↦(ez,[z]) has kernel RA=ker AJ=0.', central, [
            N('central-reverse-residual', 'Residual Northcott makes the allowed [z] finite and q_G nonnegative', central, 'This uses integral multiples in the specified residual image and the same field quantifier.', undefined, 'hypothesis'),
            L('central-reverse-visible', 'The fixed projected integral visible part satisfies classical Northcott', 'visible-integral-main', 'Use its fixed correspondence denominator.'),
            N('central-reverse-injective', 'The AJ kernel vanishes, so z↦(ez,[z]) is injective', central, 'The radical identification is essential; positivity alone would not prove this injectivity.', undefined, 'hypothesis'),
          ])),
    ]);
  const packageDirections = T('package-directions', 'Proof of the complete product/residual equivalence',
    'The forward direction propagates central finiteness; the reverse direction inserts a central class into the whole product with an exact positive height factor.', arithmeticScope,
    N('package-forward', 'The three central assertions imply the entire product package', packageProof,
      'They also imply real primitive positivity and nondegeneracy over every fixed number field.',
      G('all', 'The Lefschetz equivalence AND central Northcott AND primitive propagation',
        'Off-central vanishing gives hard Lefschetz. AJ injectivity plus residual Northcott gives central Northcott; Northcott forces real central positivity, and the coefficient formula gives primitive finiteness, positivity and nondegeneracy.', packageProof, [
          L('package-forward-hl', 'Apply the exact Chow Lefschetz equivalence', 'lefschetz-main', 'Assume all off-central cores vanish over every finite extension.', 'proved'),
          L('package-forward-central', 'Apply the exact central Northcott criterion', 'central-main', 'Assume AJ injectivity and residual bounded-degree Northcott on every central subproduct.'),
          L('package-forward-real', 'Northcott forces positivity after real scalar extension', 'northcott-real-main', 'This implication does not assume finite rational rank.', 'proved'),
          L('package-forward-primitive', 'Apply positivity and integral coefficient propagation', 'primitive-nc', 'The fixed N_a controls every block coefficient and field extension.'),
        ])), [
      N('package-reverse', 'The product package implies all three central assertions', packageProof,
        'The primitive injection uses the same integral Chow projectors and the same polarization as the forward argument.',
        G('all', 'Hard Lefschetz gives off-central vanishing AND primitive Northcott restricts to each central core',
          'For |S|=2c−1 and m=n−|S|, inflate u by fundamental classes on omitted factors. j_∅u is primitive and its height is m!·∏ᵢ∉S aᵢ·q_S,c(u); therefore its integral bounded-degree finiteness gives central Northcott, then the central criterion gives AJ injectivity and residual Northcott.', packageProof, [
            L('package-reverse-hl', 'The reverse Chow Lefschetz implication', 'lefschetz-main', 'Use the assumed isomorphisms in every degree and finite extension.', 'proved'),
            N('package-reverse-injection', 'u↦j_∅u is an INTEGRAL primitive injection with the exact positive factor', packageProof, 'Take degree r=c and t=0 in the central block; the omitted factors contribute m! times their fixed polarization weights.', undefined, 'conditional'),
            N('package-reverse-input', 'Primitive integral bounded-degree Northcott on the whole product', A('thm:program-equivalence', 'Reverse-direction hypothesis'), 'Restrict it to the images of the central integral classes under this injection.', undefined, 'hypothesis'),
            L('package-reverse-central', 'Central Northcott forces the two central residual conditions', 'central-forward', 'Apply separately to each odd subproduct with the original field quantifiers.'),
          ])),
    ]);
  const regulator = T('regulator', 'The residual arithmetic regulator',
    'An actual Chow projector leaves one Hochschild–Serre row; curve generation and maximal invisibility make the arithmetic cycle class factor through the residual quotient.', fixedScope + ' These cohomological constructions do not require a height or off-central vanishing. Fix p and V_p=R∗H²ᶜ⁻¹(Ȳ,ℚₚ(c)).',
    N('regulator-main', 'A canonical residual map a_p,E:G_E→H¹(E,V_p)', A('prop:residual-regulator', 'Residual regulator proposition'),
      'It respects restriction, corestriction and correspondences preserving the projectors, and is independent of the maximal curve-visible lift under the common cohomological identification.',
      G('all', 'The single-row identification AND annihilation of A_E AND functoriality',
        'Map z to cl_p(Rz), identify its target through the single row, and quotient by algebraically trivial classes only after proving their vanishing.', A('prop:residual-regulator', 'Complete regulator proof'), [
          N('regulator-row', 'R H²ᶜ_cont(Y_E,ℚₚ(c))≅H¹(E,V_p), with F¹=H and F²=0', A('eq:single-row', 'Single-row Hochschild–Serre identity'),
            'The actual R has geometric action only in degree k=2c−1, so only the q=k row survives in total degree k+1.', undefined, 'proved'),
          N('regulator-kills', 'The projected arithmetic cycle class vanishes on A_E', A('prop:residual-regulator', 'Algebraic-cycle annihilation'),
            'The filtration statement is essential: vanishing on the associated graded is converted into actual zero by F²=0.',
            G('all', 'Curve generation AND zero geometric H¹ action AND rational trace descent',
              'A degree-zero curve divisor lives in its π₁ single row. RΔπ₁ has zero geometric action, so the image lies in F²=0. After finite L/E, cor∘res=[L:E] makes restriction injective over ℚₚ.', A('prop:residual-regulator', 'Factorization proof'), [
                L('regulator-projector', 'Maximality kills every residual curve H¹ action', 'projector-main', 'Only the geometric projector conclusion is used here.', 'proved'),
                N('regulator-generation', 'Algebraically trivial classes are curve-generated after finite extension', A('sec:invisible-cycles', 'Generation and rational trace'), 'The finite data can be traced back to E.', undefined, 'hypothesis'),
                N('regulator-filtration', 'Cycle maps and spectral sequences respect correspondences and trace', A('prop:residual-regulator', 'Cohomological functoriality'), 'All actions are the actual Chow-projector actions.', undefined, 'hypothesis'),
              ]), 'proved'),
          N('regulator-independent', 'All maximal visible lifts have the same geometric action on the only graded term', A('prop:residual-regulator', 'Projector independence'),
            'The Π-part in total degree k+1 has just its first graded term. Equal geometric actions therefore give equal actions on the entire continuous-cohomology target.', undefined, 'proved'),
        ]), 'proved'));
  const weightCohomology = T('weight-cohomology', 'Weight −1 gives finite arithmetic targets',
    'The two local Frobenius weight exclusions kill rational local H¹; cocycles then factor through one finite-ramification Galois group, whose integral cohomology is finitely generated.', fixedScope + ' For every finite E/F₀ and every coefficient prime p, S_E includes the places over the fixed bad set S₀ and p, and all archimedean places. V_p has geometric weight −1.',
    N('weight-main', 'H¹(E,V_p)=H¹(G_E,S_E,V_p) is finite-dimensional over ℚₚ', A('prop:weight-minus-one', 'Weight-minus-one theorem'),
      'For a stable free ℤₚ-lattice T, the corresponding integral inflation is also an isomorphism and H¹(E,T) is finitely generated. The local integral H¹ need not be zero.',
      G('all', 'Inertia vanishing of every global cocycle AND integral finite generation',
        'The closed normal kernel is generated by inertia outside S_E. The cocycle identity shows that a cocycle zero on those inertia groups is zero on that kernel, so it descends. Rationalization of the integral cohomology proves finite dimension.', A('prop:weight-minus-one', 'Complete global argument'), [
          N('weight-inertia', 'Outside S_E every local rational H¹ is zero, and integral cocycles restrict trivially to inertia', A('prop:weight-minus-one', 'Local inflation–restriction'),
            'Integral local H¹ can equal the nonzero finite group T/(Fr−1)T; its inertia restriction is nevertheless zero.',
            G('all', 'Good unramified reduction AND the two Frobenius eigenvalue exclusions',
              'Smooth proper base change makes inertia trivial. Eigenvalue absolute values qᵥ^(−1/2) kill V/(Fr−1)V, and values qᵥ^(1/2) on V(−1) kill H¹(I,V)^Fr. The integral inertia invariants inject into the rational ones.', A('prop:weight-minus-one', 'Weight calculation'), [
                N('weight-good', 'v∉S_E, so the representation is unramified and v∤p', A('prop:weight-minus-one', 'Local scope'), 'Both restrictions are required for the stated tame-inertia calculation.', undefined, 'hypothesis'),
                N('weight-frobenius', 'V has weight −1 and V(−1) has weight +1', A('prop:weight-minus-one', 'Deligne-weight input'), 'Neither relevant eigenvalue can be one.', undefined, 'hypothesis'),
              ]), 'proved'),
          N('weight-integral', 'H¹(G_E,S_E,T) is a compact, finitely generated ℤₚ-module', A('prop:weight-minus-one', 'Integral cohomology finiteness'),
            'The finite-coefficient inverse limit is compact, and its mod-p quotient embeds in finite H¹(G,T/pT).',
            G('all', 'Finite cohomology with finite coefficients AND compact Nakayama',
              'The degree-zero inverse system is Mittag–Leffler. Thus H¹(G,T)=lim H¹(G,T/pᵃT); finite reduction and compact Nakayama imply finite generation. Continuous rational cocycles have bounded lattice denominators.', A('prop:weight-minus-one', 'Integral proof'), [
                N('weight-finite-coefficients', 'The cited arithmetic cohomology finiteness theorem', A('prop:weight-minus-one', 'Finite coefficient input'), 'Apply it to the fixed finite set of places over the chosen E.', undefined, 'hypothesis'),
                N('weight-nakayama', 'The compact Nakayama argument and bounded continuous-cocycle image', A('prop:weight-minus-one', 'Module argument'), 'Clearing denominators identifies rational H¹ with the tensor product of integral H¹ and ℚₚ.', undefined, 'proved'),
              ]), 'proved'),
        ]), 'proved'), [
      N('regulator-fixed-model', 'The cycle-class image factors through the SAME fixed arithmetic model outside S₀ and p', A('prop:fixed-S', 'Fixed-model factorization'),
        'This is the original image-specific argument; the weight theorem above strengthens it to the whole target.',
        G('all', 'Spread Y,R and the rational-equivalence witnesses once AND extend cycles by closure',
          'The surviving R-part is a lisse sheaf in the one degree. Apply R to Leray on the smooth proper model; a finite flat base change to O_E[1/S_E] preserves the correspondence identities.', A('prop:fixed-S', 'Arithmetic-model proof'), [
            N('regulator-spread', 'One finite S₀ supports smooth Y and the actual identity R²=R', A('prop:fixed-S', 'Uniform spread'), 'Spread the finitely many cycle representatives AND their rational-equivalence witnesses.', undefined, 'hypothesis'),
            N('regulator-closure', 'Every generic cycle extends to the regular model by closure', A('prop:fixed-S', 'Closure and Leray'), 'Cycle-map compatibility gives the factorization, and arithmetic cohomology finiteness gives its finite-dimensional target.', undefined, 'proved'),
          ]), 'proved'),
    ]);
  const integralRegulator = T('integral-regulator', 'Scalar detection and local integral modules',
    'A fixed projector denominator places integral cycles in a finite ℤₚ-module; scalar-extended injectivity then controls the source rank and its p-adic integral image.', fixedScope,
    N('integral-regulator-main', 'For every fixed E,p, a_p,E(Λ_G(E)) lies in a finitely generated ℤₚ-module', A('prop:local-lattice', 'Local integral-image theorem'),
      'This is a separate conclusion at EACH coefficient prime. It does not supply a common rational lattice as p varies.',
      G('all', 'One integral projector multiple AND integral cycle-class finiteness AND the single-row identification',
        'Choose M with MR integral. The integral cycle map contains Mcl_p(RZ); intersect its finite module with the R-subspace, apply the single-row identity and divide by the fixed M.', A('prop:local-lattice', 'First part of the proof'), [
          N('integral-regulator-denominator', 'One M clears the Chow coefficients of R', A('prop:local-lattice', 'Projector denominator'), 'For an actual integral representative Z, (MR)Z is an integral cycle.', undefined, 'hypothesis'),
          N('integral-regulator-kahn', 'The cited integral continuous cycle-class image is a finitely generated ℤₚ-module', A('prop:local-lattice', 'Kahn integral-image input'), 'Intersect its rational image with the R-subspace; a submodule of a finite ℤₚ-module is finite.', undefined, 'hypothesis'),
          L('integral-regulator-row', 'The residual regulator uses the single-row isomorphism', 'regulator-main', 'This turns the bounded cycle-class module into the stated H¹ module.', 'proved'),
        ]), 'proved'), [
      N('scalar-rank', 'Scalar-extended injectivity at ONE p implies dimℚ G_E<∞', A('cor:finite-rank', 'Scalar detection and finite rank'),
        'Injectivity merely as a ℚ-linear map into a finite-dimensional ℚₚ-space would be insufficient.',
        G('all', 'Injectivity AFTER tensoring with ℚₚ AND a finite-dimensional ℚₚ target',
          'Scalar extension preserves the dimension of a rational vector space, so its dimension is bounded by the target dimension.', A('cor:finite-rank', 'Finite-rank proof'), [
            N('scalar-rank-input', 'G_E⊗ℚℚₚ→H¹(E,V_p) is injective', A('eq:scalar-detection', 'Exact injectivity hypothesis'), 'This rational-detection conjecture is an additional hypothesis.', undefined, 'hypothesis'),
            L('scalar-rank-target', 'The complete H¹ target is finite-dimensional over ℚₚ', 'weight-main', 'Use the weight-minus-one theorem.', 'proved'),
          ]), 'proved'),
      N('integral-regulator-source', 'Under scalar injectivity, Λ_G(E)⊗ℤℤₚ is finite and Λ_G(E)/pΛ_G(E) is finite', A('prop:local-lattice', 'Second part of the local theorem'),
        '“Finite” for the tensor module means finitely generated over ℤₚ, not a finite set.',
        G('all', 'The local integral bound AND scalar-extended injectivity',
          'The tensor source is torsion-free, and its localization is G_E⊗ℚₚ because Λ_G(E) spans G_E. Injectivity therefore embeds it in the finite ℤₚ-module; reduction modulo p is finite.', A('prop:local-lattice', 'Integral-source proof'), [
            L('integral-regulator-source-bound', 'The integral regulator image lies in a finite ℤₚ-module', 'integral-regulator-main', 'This is the local bound proved without injectivity.', 'proved'),
            N('integral-regulator-injective', 'The same scalar-extended regulator is injective', A('eq:scalar-detection', 'Scalar injectivity'), 'Retain injectivity after extension of scalars, not only on rational points.', undefined, 'hypothesis'),
          ]), 'proved'),
    ]);
  const northcottReal = T('northcott-real', 'Northcott forces real positive definiteness',
    'A negative direction gives integral multiples of negative height; a real null direction gives infinitely many bounded-height integer roundings.', 'Λ is a subgroup spanning a rational space V and q is a real-valued quadratic form. No finite-rank hypothesis is used: work in each finite-dimensional rational subspace.',
    N('northcott-real-main', 'Integral Northcott implies positive definiteness on V⊗ℚℝ', A('lem:northcott-real', 'Real positivity lemma'),
      'This is stronger than positivity on nonzero rational vectors, and it has no converse without arithmetic control of Λ.',
      G('all', 'Exclude every negative real direction AND every nonzero real null direction',
        'Choose a rational basis in Λ on any finite-dimensional subspace. Both failures of definiteness contradict finite upper height balls.', A('lem:northcott-real', 'Complete Gram-matrix proof'), [
          N('northcott-negative', 'A negative real direction gives a nonzero integral vector of negative height', A('lem:northcott-real', 'Negative-direction argument'),
            'Use rational approximation and clear denominators; all its positive integer multiples lie in a fixed upper height ball.', undefined, 'proved'),
          N('northcott-null', 'A nonzero real null vector gives infinitely many distinct bounded-height roundings', A('lem:northcott-real', 'Null-direction argument'),
            'After excluding negative directions Q is semidefinite. Round tu to integer z_t with bounded error; q(z_t)=(z_t−tu)ᵗQ(z_t−tu) is bounded while z_t is unbounded.', undefined, 'proved'),
          N('northcott-real-assumption', 'The upper q-balls in Λ are finite', A('lem:northcott-real', 'Northcott assumption'), 'Integral basis vectors in each finite rational subspace are available because Λ spans V.', undefined, 'hypothesis'),
        ]), 'proved'));
  const lattice = T('lattice', 'The five finite-rank lattice criteria',
    'A positive gap makes the integral image uniformly discrete; a bounded fundamental parallelepiped then gives a single denominator. That same denominator is equivalent to finite-adelic relative compactness.', 'Λ is torsion-free of FINITE rank, V=Λ⊗ℚ, and q is positive definite on V⊗ℝ. The zero group is included, with the gap condition interpreted vacuously.',
    N('lattice-main', 'Northcott ⇔ positive gap ⇔ finite generation ⇔ one denominator ⇔ finite-adelic relative compactness', A('thm:lattice-equivalence', 'Five lattice equivalences'),
      'Finite rank and REAL definiteness are standing hypotheses of this equivalence.',
      G('all', 'The gap-to-lattice chain AND lattice-to-finiteness AND the finite-adelic comparison',
        'These proof directions establish the full chain of equivalent conditions in the theorem.', A('thm:lattice-equivalence', 'Complete lattice proof'), [
          N('lattice-gap-chain', 'Northcott gives a gap, which gives a finite-index basis lattice', A('thm:lattice-equivalence', 'Gap and fundamental parallelepiped'),
            'Take a positive minimum on the finite unit ball, or use one if it contains no nonzero point.',
            G('all', 'A uniform positive gap AND a rational basis in Λ',
              'For the Euclidean norm √q, the gap makes Λ uniformly discrete. Reducing modulo the ℤ-span of the basis into a bounded fundamental parallelepiped leaves finitely many representatives; hence that lattice has finite index.', A('thm:lattice-equivalence', 'Discreteness implies finite generation'), [
                N('lattice-gap', 'A positive lower bound q(λ)≥ε for every nonzero λ', A('thm:lattice-equivalence', 'Gap condition'), 'Northcott gives this under the standing positive definite finite-rank scope.', undefined, 'hypothesis'),
                N('lattice-basis', 'A finite rational basis chosen inside Λ', A('thm:lattice-equivalence', 'Finite-rank input'), 'The bounded fundamental parallelepiped is finite-dimensional.', undefined, 'hypothesis'),
              ]), 'proved'),
          N('lattice-denominator', 'Finite generation clears to Λ⊂N⁻¹Λ₀, and bounded lattice balls are finite', A('thm:lattice-equivalence', 'Common denominator and reverse implication'),
            'Clear the finitely many rational generator coordinates. Positive real definiteness makes each height ball bounded in the Euclidean lattice.', undefined, 'proved'),
          N('lattice-adeles', 'Relative compactness in V(𝔸_f) is equivalent to one such denominator', A('thm:lattice-equivalence', 'Finite-adelic argument'),
            'A compact set lies in N⁻¹Λ₀⊗ℤ̂ by a finite subcover of these open compact sets. Conversely these sets are compact; intersect with V(ℚ).', undefined, 'proved'),
        ]), 'proved'), [
      N('lattice-count', 'A height-B ball has at most (1+2⌊N√(B/μ)⌋)ˢ points', A('eq:lattice-count', 'Explicit lattice count'),
        's=dim V and μ>0 is the least eigenvalue of the Gram matrix in a basis of Λ₀.',
        G('all', 'The common denominator AND the least-eigenvalue norm bound',
          'Each coordinate of Nλ is an integer of absolute value at most N√(B/μ); multiply the coordinate counts.', A('eq:lattice-count', 'Counting consequence'), [
            N('lattice-count-denominator', 'Λ⊂N⁻¹Λ₀', A('thm:lattice-equivalence', 'Lattice condition'), 'Use the same fixed rational basis and denominator.', undefined, 'hypothesis'),
            N('lattice-count-positive', 'The real Gram matrix has least eigenvalue μ>0', A('eq:lattice-count', 'Norm bound'), 'The count is stated for B≥0.', undefined, 'hypothesis'),
          ]), 'proved'),
    ]);
  const allPrime = T('all-prime', 'All-prime saturation produces one denominator',
    'All local inverse lattices are bounded; almost-everywhere equality with ONE rational lattice leaves only finitely many denominator factors to clear.', 'V is finite-dimensional over ℚ, Λ⊂V and Λ₀ is a full rational lattice. For EVERY prime p, D_p:V⊗ℚₚ↪W_p is injective and M_p is a full ℤₚ-lattice in the finite-dimensional target.',
    N('all-prime-main', 'Λ⊂N⁻¹Λ₀ for one integer N; every real positive definite q then has Northcott', A('thm:all-prime', 'All-prime saturation theorem'),
      'For every p require D_p(Λ)⊂M_p; for almost every p require D_p⁻¹(M_p)=Λ₀⊗ℤₚ with the SAME Λ₀.',
      G('all', 'Open compact inverse lattices AND almost-everywhere equality AND global coordinate integrality',
        'At finitely many exceptional p choose b_p with D_p⁻¹(M_p)⊂p⁻ᵇᵖΛ₀⊗ℤₚ. Put N=∏pᵇᵖ; every coordinate of Nλ lies in ℤₚ for every p, hence in ℚ∩∏ₚℤₚ=ℤ.', A('thm:all-prime', 'Full proof'), [
          N('all-prime-inverse', 'Injectivity makes L_p=D_p⁻¹(M_p) an open compact ℤₚ-lattice', A('thm:all-prime', 'Inverse-lattice lemma'), 'The target is finite-dimensional and the map is injective AFTER extending scalars.', undefined, 'proved'),
          N('all-prime-common', 'L_p=Λ₀⊗ℤₚ for all but finitely many p', A('thm:all-prime', 'Common-lattice saturation assumption'), 'This comparison across primes is an additional hypothesis beyond separate finite generation at each p.', undefined, 'hypothesis'),
          N('all-prime-containment', 'D_p(Λ)⊂M_p for EVERY prime p', A('thm:all-prime', 'All-prime integral containment'), 'A finite list of detectors cannot clear a denominator at an untested prime.', undefined, 'hypothesis'),
          L('all-prime-nc', 'A fixed denominator plus real positive definiteness gives finite height balls', 'lattice-main', 'Use the lattice theorem only after the denominator is established.', 'proved'),
        ]), 'proved'));
  const weakMW = T('weak-mordell-weil', 'A finite Kummer quotient and a genuine height gap',
    'Sufficiently deep reduction modulo m separates a bounded height ball; then repeated division by m with bounded representatives produces finite generation.', 'Λ is torsion-free, √q is a REAL positive quadratic norm on Λ⊗ℝ, m≥2, s=|Λ/mΛ|<∞ and q(λ)≥ε>0 for every nonzero λ. No finite-rank assumption is needed.',
    N('weak-mw-main', 'Λ is finitely generated and q has Northcott', A('thm:weak-mw-gap', 'Quantitative descent theorem'),
      'If m²ʲε>4B, the height-B ball has at most sʲ elements.',
      G('all', 'The finite bounded-ball count AND the height descent on quotient representatives',
        'First prove finite balls by a modulo-mʲ injection. Then use a finite set T of representatives modulo mΛ to descend every vector to one fixed finite ball.', A('thm:weak-mw-gap', 'Complete descent proof'), [
          N('weak-mw-count', 'The height-B ball injects into Λ/mʲΛ, of size sʲ', A('eq:kummer-count', 'Explicit Kummer bound'),
            'If x−y=mʲz and q(x),q(y)≤B, then ∥z∥≤2√B/mʲ<√ε, so z=0.',
            G('all', 'A genuine uniform gap AND finite quotient layers AND the norm triangle inequality',
              'Torsion-freeness identifies every mⁱΛ/mⁱ⁺¹Λ with Λ/mΛ. The real positive norm makes the height separation estimate valid.', A('thm:weak-mw-gap', 'Bounded-ball injection'), [
                N('weak-mw-gap-input', 'q(λ)≥ε>0 for all nonzero integral λ', A('thm:weak-mw-gap', 'Gap assumption'), 'Rational or real positivity alone does not give this uniform gap.', undefined, 'hypothesis'),
                N('weak-mw-finite-input', '|Λ/mΛ|=s<∞ and Λ is torsion-free', A('thm:weak-mw-gap', 'Kummer assumption'), 'Retain one fixed m≥2.', undefined, 'hypothesis'),
              ]), 'proved'),
          N('weak-mw-descent', 'Writing x=my+t gives ∥y∥≤(∥x∥+C)/m', A('thm:weak-mw-gap', 'Generation descent'),
            'With C=max∥t∥ for t∈T, repeat until entering any ball of radius >C/(m−1). That finite ball together with T generates Λ.', undefined, 'proved'),
        ]), 'proved'));
  const trace = T('class-trace', 'Trace to the field of a class',
    'The stabilizer defines the class field, and trace supplies an integral representative there after a bounded multiplier, even when the chosen cycle itself does not descend.', 'The common geometric rational Chow quotient has a discrete Galois action, compatible integral images Λ(E), and restriction and trace preserving those images. Every class is defined over a finite extension.',
    N('class-trace-main', 'For ξ∈Λ(E), K=F₀(ξ)⊂E and [E:K]ξ∈Λ(K)', A('lem:class-trace', 'Class-field trace lemma'),
      'If [E:F₀]≤D, the multiplier m=[E:K] lies between one and D.',
      G('all', 'The open stabilizer inclusion AND integral trace with projector compatibility',
        'Gal(F̄/E) is contained in the stabilizer, so K⊂E. Push an integral cycle representative from E to K; geometrically it is a sum over K-embeddings, each having class ξ, hence equals [E:K]ξ.', A('lem:class-trace', 'Complete trace proof'), [
          N('class-trace-stabilizer', 'K is the fixed field of the stabilizer of the QUOTIENT CLASS', A('sec:class-fields', 'Minimal class field'), 'It need not be a field of definition of the chosen integral cycle representative.', undefined, 'hypothesis'),
          N('class-trace-compatible', 'Trace preserves integral images, fixed Chow projectors and algebraic equivalence', A('lem:class-trace', 'Integral trace compatibility'), 'These are the standing assumptions for the geometric quotient.', undefined, 'hypothesis'),
        ]), 'proved'));
  const fields = T('fields', 'The separate condition on fields of definition',
    'Fixed-field Northcott handles a finite list of class fields; uniform ramification is exactly what produces that finite list at bounded degree.', 'Use the geometric quotient, integral images and trace assumptions of class-trace. q is invariant under Galois and field extension; bounded-degree balls are counted in the ONE geometric rational group.',
    N('fields-main', 'Bounded-degree integral Northcott', A('thm:ramification', 'Ramification criterion'),
      'For every height bound B and degree bound D. The theorem is a proved equivalence under the displayed compatibility; its geometric residual hypotheses remain open.',
      G('iff', 'IFF fixed-field Northcott for EVERY finite K AND uniform class-field ramification on each bounded ball',
        'Bounded-degree Northcott trivially includes each fixed-field assertion. Under those assertions, the theorem makes the ramification condition exactly equivalent to the bounded-degree conclusion.', [A('def:northcott', 'The field quantifiers'), A('thm:ramification', 'Exact ramification theorem')], [
          N('fields-fixed', 'q has fixed-field Northcott on Λ(K) for EVERY finite K/F₀', A('thm:ramification', 'Fixed-field prerequisite'), 'A theorem over a single E is not enough for this prerequisite.', undefined, 'hypothesis'),
          N('fields-ramification', 'For every B,D, all minimal class fields in the ball are unramified outside ONE finite S(B,D)', A('thm:ramification', 'Exact variable-field condition'), 'This controls the fields F₀(ξ), not merely the Galois cohomology over a separately chosen E.', undefined, 'hypothesis'),
        ])), [
      N('fields-forward', 'These two hypotheses make each bounded-degree height ball finite', A('thm:ramification', 'Forward implication'),
        'The trace multiplier and the height bound are kept explicitly.',
        G('all', 'Finitely many possible class fields AND finitely many scaled classes in each',
          'Hermite–Minkowski gives finitely many K of degree ≤D unramified outside S(B,D). Trace gives mξ∈Λ(K) with 1≤m≤D and q(mξ)≤D²B. Fixed-field Northcott gives finitely many mξ; rational multiplication by m is injective.', A('thm:ramification', 'Full forward proof'), [
            N('fields-finite-fields', 'Hermite–Minkowski bounds the fields of degree ≤D outside S(B,D)', A('thm:ramification', 'Finite-ramification form'), 'The fixed-degree local discriminant exponents can be bounded; then apply discriminant finiteness.', undefined, 'hypothesis'),
            L('fields-trace-input', 'mξ descends integrally with m≤D', 'class-trace-main', 'This avoids assuming that ξ itself has an integral representative over its minimal class field.', 'proved'),
            N('fields-finite-classes', 'Fixed-field Northcott bounds mξ at height D²B', A('thm:ramification', 'Class count'), 'There are only finitely many K and multipliers m; the group is rational, so m has no kernel.', undefined, 'hypothesis'),
          ]), 'proved'),
      N('fields-reverse', 'A finite bounded-degree ball has one finite class-field ramification set', A('thm:ramification', 'Reverse implication'),
        'The finite set can depend on B,D; no linear estimate in height is asserted.',
        G('all', 'Finitely many classes AND finite ramification for each finite class field',
          'Take the finite union of the ramification sets of their minimal fields.', A('thm:ramification', 'Reverse proof'), [
            N('fields-finite-ball', 'The given bounded-degree height ball is finite', A('def:northcott', 'Bounded-degree assumption'), 'This is the premise for the reverse direction.', undefined, 'hypothesis'),
            N('fields-individual-ramification', 'Each finite extension ramifies at only finitely many finite places', A('thm:ramification', 'Finite-union step'), 'The stabilizer class fields are finite by the discrete Galois assumption.', undefined, 'proved'),
          ]), 'proved'),
      N('fields-quantitative', 'A quantitative discriminant route to bounded-degree Northcott', A('eq:discriminant-target', 'Stronger quantitative target'),
        'The estimate log N disc(F₀(ξ)/F₀)≤A_D q(ξ)+B_D is a proposed sufficient bound, not equivalent to qualitative uniform ramification.',
        G('all', 'The stronger discriminant estimate AND fixed-field Northcott suffice',
          'A uniform discriminant bound at fixed B,D gives finitely many fields directly. The same trace and fixed-field argument then gives finiteness of classes.', A('eq:discriminant-target', 'Quantitative research question'), [
            N('fields-discriminant-input', 'The displayed discriminant inequality for all integral classes of degree ≤D', A('eq:discriminant-target', 'Open estimate'), 'Constants depend on D and the fixed geometric data; the estimate is not proved in this paper.', undefined, 'open'),
            N('fields-quantitative-fixed', 'Fixed-field Northcott for every finite class field', A('thm:ramification', 'Independent fixed-field requirement'), 'The field bound does not provide this arithmetic condition.', undefined, 'open'),
          ]), 'open'),
    ]);
  const barriers = T('arithmetic-barriers', 'Why the omitted arithmetic hypotheses cannot be skipped',
    'The paper’s abstract counterexamples separate rational positivity, real positivity, integral denominators, finite rank and the fields of definition.', 'These are abstract groups and quadratic forms used to identify missing implications. They are not geometric counterexamples to the conjectures.',
    N('barrier-local', 'Fixed-field integral Northcott from real positivity and local integral bounds', A('ex:denominators', 'Separate local lattices do not give global discreteness'),
      'The target still requires arithmetic discreteness or another valid finiteness criterion.',
      G('blocked', 'Separate finite generation at EVERY prime is insufficient',
        'Λ=Σₚ ℤ·(1/p)⊂ℚ and q(x)=x² have Λ⊗ℤₚ=p⁻¹ℤₚ finite free for every p, but q(1/p)→0. The inverse lattices differ from one fixed lattice at infinitely many primes.', A('ex:denominators', 'Exact denominator counterexample'), [
          N('barrier-local-input', 'Real positive q and a finite local integral module for each coefficient prime', A('ex:denominators', 'Insufficient package'), 'There is no assumed almost-everywhere saturation relative to ONE rational lattice.', undefined, 'hypothesis'),
        ]), 'open'), [
      N('barrier-real', 'Real positive definiteness from positivity only on nonzero rational vectors', A('ex:denominators', 'Irrational null direction'),
        'The stronger real condition is the one used in Euclidean height descent.',
        G('blocked', 'Rational positivity leaves a real null direction',
          'q(a,b)=(a−√2b)² is positive on nonzero rational pairs, but its real kernel admits infinitely many bounded-height lattice roundings.', A('ex:denominators', 'Real-definiteness counterexample'), [
            N('barrier-rational-input', 'q(v)>0 for every nonzero rational v', A('ex:denominators', 'Insufficient positivity'), 'This does not exclude a nonzero real null vector.', undefined, 'hypothesis'),
          ]), 'open'),
      N('barrier-rank', 'Finite rational rank from Northcott alone', A('thm:weak-mw-gap', 'Infinite-rank example following the descent theorem'),
        'Scalar detection is a separate route to finite rank; the rank conclusion cannot be added to the general Northcott lemma.',
        G('blocked', 'Finite upper height balls do not force finite rank',
          'Λ=⊕ᵢ≥1ℤeᵢ with q(Σaᵢeᵢ)=Σ2ⁱaᵢ² has finite height balls and infinite rank.', A('thm:weak-mw-gap', 'Abstract infinite-rank Northcott example'), [
            N('barrier-rank-input', 'Only Northcott on the integral image', A('thm:weak-mw-gap', 'Insufficient rank hypothesis'), 'No scalar-extended rational detector or finite Kummer quotient is supplied.', undefined, 'hypothesis'),
          ]), 'open'),
      N('barrier-fields', 'Bounded-degree Northcott from uniform fixed-field estimates alone', A('ex:quadratic-fields', 'Varying quadratic-fields counterexample'),
        'A separate restriction on minimal class fields is still needed.',
        G('blocked', 'Uniform rank, gap and Kummer bounds do not bound the fields',
          'Take infinitely many quadratic Kᵢ with characters χᵢ, G=⊕ℚeᵢ, σeᵢ=χᵢ(σ)eᵢ and Λ(E)=⊕_{Kᵢ⊂E}ℤeᵢ, q=Σaᵢ². Every fixed field has a finitely generated lattice, rank≤[E:F₀]−1, gap one and |Λ(E)/mΛ(E)|≤m^([E:F₀]−1); nevertheless all eᵢ have degree two and height one.', A('ex:quadratic-fields', 'Complete abstract counterexample'), [
            N('barrier-fields-input', 'Fixed-field Northcott with uniform degree-dependent rank, gap and Kummer bounds', A('ex:quadratic-fields', 'Insufficient variable-field package'), 'The compatible trace and restriction images in the example still satisfy these properties.', undefined, 'hypothesis'),
          ]), 'open'),
      N('barrier-finite-primes', 'A common denominator from detectors at finitely many primes', A('ex:denominators', 'Finite-detector obstruction'),
        'The all-prime theorem really requires every coefficient prime.',
        G('blocked', 'An untested prime supports unbounded denominators',
          'Λ=ℤ[1/p] with q(x)=x² defeats any finite collection of integral detectors at primes different from p.', A('ex:denominators', 'The untested-prime example'), [
            N('barrier-finite-primes-input', 'Integral detector bounds only at a finite list of primes', A('ex:denominators', 'Insufficient detector range'), 'Choose p outside the finite list.', undefined, 'hypothesis'),
          ]), 'open'),
    ]);
  return {
    caseId: 'arithmetic-properties', trees: [programme, chowBlocks, squareZero, lefschetzTree, primitiveTree, propagationTree, visibleProjector, invisible, residual, visibleIntegral, centralNC, packageDirections, regulator, weightCohomology, integralRegulator, northcottReal, lattice, allPrime, weakMW, trace, fields, barriers],
    coverage: [C('Arithmetic hard Lefschetz, positivity and finiteness', 'programme', 'main', A('thm:program-equivalence', 'Full product and residual package'))],
    sourceBindings: [],
  };
}

// Bind the reading view to the exact unsigned public source bytes inspected above.
// Locators refer to labels or literal subsection titles inside these source files.
const B = (file, sha256, locators) => ({ file: 'public/projects/strong-green/editions/' + (file.startsWith('papers/') ? 'v0.5.3/' : 'v0.5.1/') + file, sha256, locators });
const pairingBinding = B('papers/pairing-constructions.tex', '68043edb59e398a63e217c6b32057b1e07ed8b17f79c3951b2389a7e24207f34', ['sec:analytic', 'prop:numerical', 'sub:covariance', 'hyp:height-input', 'lem:two-degrees', 'sec:models', 'sec:heights']);
const modelsBinding = (locators) => B('source-files/pairing-cases/sections/models_families.tex', '34cfba218bf4653f55cf09aae936c3c3acc7047dd051b7561a0432a4b73e7138', locators);
const determinantBinding = B('source-files/height-r2/sections/determinants.tex', 'b2d1a9edb46fe597686acc287641fca8c8ea3ffa1c40f88950b0473747169a1c', ['sec:poincare-metric', 'thm:quillen-isometry', 'thm:deligne-isometry', 'eq:grr-leading', 'cor:cycle-determinant', 'prop:good-reduction']);
const chowGreenBinding = {
  file: 'public/projects/strong-green/editions/v0.5.3/source-files/companion/chow-obstruction-green-pairs.tex',
  sha256: '62e3177c413d01c5c7a429da778f784196db10cd8148e5d2ca665f6919616a5a',
  locators: ['h22:main', 'h22:correction'],
};
const bindings = {
  'numerical-models': [pairingBinding, modelsBinding(['sec:models', 'prop:scalar-model', 'eq:two-factor-model', 'prop:positive-model', 'prop:symmetry-model'])],
  'reduction-strata': [chowGreenBinding, pairingBinding, modelsBinding(['thm:ordinary', 'thm:abelian-strata', 'cor:drinfeld', 'thm:totally-degenerate'])],
  'arithmetic-families': [
    chowGreenBinding,
    { ...pairingBinding, locators: [...pairingBinding.locators, 'prop:closures', '\\bibitem{Fulton}'] },
    modelsBinding(['lem:congruence-pencils', 'thm:dense-hypersurfaces', 'thm:dense-ci', 'thm:dense-products', 'eq:host-signature', 'Explicit elliptic-power families']),
    B('source-files/companion/proofs/models/r22/geometry/positive_fourfold_suspensions_and_quintuple_models.tex', '694efaacb303eed41c37a7da292f75afc55224b95197fed069f537bb5674654d', ['r22su:ampleCC', 'r22su:weakL', 'r22su:Gysiniso', 'r22su:gates', 'r22su:theorem', 'r22su:host']),
    B('source-files/companion/proofs/models/r18/u2/ramified_base_change_of_positive_fourfold_models.tex', '81fb527a8fccbaef7bb5d35e3fa1b213474e06d6e081e3e01084aff08a6b33b8', ['r18rb:strata', 'r18rb:fourfold']),
    B('source-files/companion/proofs/families/r22/geometry/supplied_positive_hosts_and_projective_bundle_height_families.tex', '259cb922b1778b8b2059c5dacfe43233660803f0b5e9ecb35b3d74790e9c2560', ['r22phs:theorem', 'r22phs:positivity', 'r22phs:bundles', 'r22phs:P4']),
    B('source-files/companion/proofs/families/r22/geometry/abelian_hosts_and_general_suspension_height_families.tex', 'f453a4e7d288485a252b7725aed7b5aa64ab361037d435ab9dc50491e582c199', ['r22as:local', 'r22as:MP', 'r22as:abelianlocal', 'r22as:Ancona']),
    B('source-files/companion/proofs/models/r16/model_obstruction/positive_fourfold_component_activation.tex', 'effea0886a1944d2d953fb4c330ab8f671bae9258195dd7ac059f3b55f255f9a', ['r16pos:types', 'r16pos:local', 'r16pos:weighted-zero']),
    B('source-files/companion/proofs/models/r18/u2/inertial_triviality_and_ramified_norm_detection.tex', '6ee8b9811a2dac308d4102e500fcbdb26b7f03d8dc3e1817937f4e0db4de71de', ['r18ri:torus', 'r18ri:norm', 'r18ri:period-equivariance', 'r18ri:norm-identity', 'r18ri:averaging', 'r18ri:all-finite']),
    B('source-files/companion/proofs/foundations/R17_finite_actual_tests_and_height_obstruction_quotients.tex', 'f87ec78c73824e24ea21ab435873c9d29b6a878d3021148448565f9a91529895', ['r17fd:coordinates', 'r17fd:numerical-kernel', 'r17fd:finite-tests', 'r17fd:criterion']),
    B('source-files/companion/proofs/foundations/R17_vertical_tests_and_strong_green_necessity.tex', 'a15262f354f2ffa29c1035657bbac848e1663f99aa216a37cecac9a392ae2394', ['r17vt:transpose', 'r17vt:vertical', 'r17vt:model-converse']),
  ],
  'classical-comparison': [
    pairingBinding,
    B('source-files/global-height/ha16-correspondence_adjunction_and_motivic_height.tex', 'bd1825f6a6edd71a80b732bc2051a7382a09dc0c2add3a2e1dd8ba4b2c97cc41', ['r16ha:moving', 'r16ha:adjunction', 'r16ha:alteration-comparison', 'r16ha:motivic-formula']),
    B('source-files/global-height/mm16-regular_admissible_model_comparison.tex', '417539950fc780407bd9b588c090d7eeaa5701398a7f2bacb42b621fa2602a3f', ['r16mm:vertical', 'r16mm:cartier', 'r16mm:framed', 'r16mm:euler', 'r16mm:local', 'r16mm:global', 'r16mm:abelian']),
    determinantBinding,
    B('papers/determinant-metrics.tex', '1a4beb3e356331e01a37465473ae9553d9826965bcd988cb768607b8847ca9ed', ['sec:remaining-metrics', 'sec:good-reduction-metric']),
  ],
  'arithmetic-properties': [
    B('source-files/height-r2/sections/setup.tex', '79e7e0473f49db1ae7f12cfad47c006d055f4803706b87ac0787ba9663a68f99', ['def:heights', 'def:northcott', 'lem:invisible', 'prop:central-projector', 'lem:visible-integral']),
    B('source-files/height-r2/sections/lefschetz.tex', 'd3c0ad9be144a49271754664960f32b1509f0ee7b5a6d6f997990e591305bb50', ['sec:chow-blocks', 'eq:coordinate-denominator', 'lem:square-zero', 'eq:star-identity', 'sec:lefschetz-proof', 'thm:primitive-squares', 'cor:positivity-propagation']),
    B('source-files/height-r2/sections/central_northcott.tex', 'da82927ba909bb296aae4f4244701d193359b9d344fa96740c1f1bed446d385b', ['thm:central-northcott', 'eq:central-norm-split']),
    B('source-files/height-r2/sections/regulators.tex', '481d51d467b1963aacc2f9e6bd795b1d51ec94d9cc5d233045c23b08d961ccc5', ['eq:single-row', 'prop:residual-regulator', 'prop:fixed-S', 'prop:weight-minus-one', 'cor:finite-rank', 'eq:scalar-detection', 'prop:local-lattice']),
    B('source-files/height-r2/sections/lattices.tex', '331486e4a447cfc94a40505c49f952f4cc48032d135413d33487578b62e914e2', ['lem:northcott-real', 'thm:lattice-equivalence', 'eq:lattice-count', 'thm:all-prime', 'ex:denominators', 'thm:weak-mw-gap', 'eq:kummer-count']),
    B('source-files/height-r2/sections/fields.tex', '5618d401731d1a1321dddeaed4b8c0a64aec9765a2a35317cdb8229acbeadb0b', ['lem:class-trace', 'thm:ramification', 'eq:discriminant-target', 'ex:quadratic-fields']),
    B('source-files/height-r2/sections/program.tex', '132264ad41e685ccc659c662b52c0c0571bbad6706ab6a3168ffa666c7844477', ['conj:offcentral', 'conj:AJ', 'conj:residual-northcott', 'thm:program-equivalence', 'conj:detection', 'conj:lattice', 'conj:ramification']),
  ],
};

export const progressProofModels = [numericalModels(), reductionStrata(), arithmeticFamilies(), classicalComparison(), arithmeticProperties()]
  .map(item => ({ ...item, sourceBindings: bindings[item.caseId] }));
