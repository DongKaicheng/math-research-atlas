// Proof-reading model. Gates are checked against the cited statements, not
// inferred from the record dependency arrays. Intermediate properties are
// reading nodes, never new permanent theorem records.
// Tree contexts supply definitions or scope; they are not logical premises.
// Gate rules are separately displayed registered inference/support records.
// Their source status is independent of the status of the conclusion node.
const source = (href, label) => ({ href, label });
const rec = (record, note, extra = {}) => ({ record, note, ...extra });
const node = (title, href, status, note, gate, id) => ({ title, href, status, note, ...(gate ? { gate } : {}), ...(id ? { id } : {}) });
const gate = (kind, label, explanation, sources, children, ruleNotes = {}) => ({
  kind, label, explanation, sources, children,
  ...(Object.keys(ruleNotes).length ? { rules: Object.keys(ruleNotes), ruleNotes } : {}),
});
const arithmetic = (anchor, label) => source('/papers/arithmetic-reductions#' + anchor, label);
const determinant = (anchor, label) => source('/papers/determinant-metrics#' + anchor, label);
const direct = (anchor, label) => source('/papers/green-height-route#' + anchor, label);
const obstruction = (anchor, label) => source('/papers/obstruction-height-route#' + anchor, label);
const construction = (anchor, label) => source('/papers/green-constructions#' + anchor, label);
const programme = (anchor, label) => source('/papers/strong-g-programme#' + anchor, label);
const height = (anchor, label) => source('/papers/global-height-pairing#' + anchor, label);

const fullChowPairing = node(
  'A symmetric pairing on both full homologically trivial Chow groups',
  '/programme#global', 'conditional',
  'Fix X/F and complementary codimensions r+s=dim(X)+1. The three methods below have different inputs; their pairings are not identified merely by listing the routes.',
  gate('any', 'ANY complete construction route',
    'One route may construct a pairing for the varieties and classes satisfying all of its premises. A result for one geometric family does not settle the universal target.',
    [programme('sec:programme-global', 'Global construction'), source('/routes', 'Compare the three routes')], [
      node('Strong Green forms give the full pairing (PH16)', '/papers/global-height-pairing#r16ph:general-height', 'conditional',
        'Theorem 7.5 proves the full canonical real pairing on both geometrically homologically trivial rational Chow groups, under the displayed analytic foundations.',
        gate('all', 'ALL analytic and global inputs',
          'The principal-push theorem (PH16; Theorem 7.5) proves this implication under the stated analytic foundations. Its proof establishes the principal norm law, Green-choice independence and reciprocity; good-place vanishing and the product formula give a finite sum that descends to both Chow groups. Strong G supplies the forms for every representative.',
          [height('r16ph:general-height', 'PH16 · Theorem 7.5 and proof'), height('sec:height-hypotheses', 'Standing analytic foundations'), direct('groute:global-height', 'Local-to-global summary'), height('r16ph:principal-law', 'Principal transformation law')], [
            rec('STRONG-G', 'Required at every finite completion, in BOTH complementary codimensions, over the original valued field.'),
            node('Restriction, principal-cycle operations and reciprocity', '/papers/global-height-pairing#r16ph:principal-push', 'hypothesis', 'Use the stated current, intersection and principal-divisor calculus, including the auxiliary varieties and both ordered degrees. The source arguments are available; the analytic foundations retain their stated mathematical review status.'),
            node('Moving, archimedean identities and good-place vanishing', '/papers/global-height-pairing#r16ph:general-height', 'hypothesis', 'These are inputs used in the supplied PH16 proof: moving handles representatives; the classical archimedean identities and good-model vanishing make the normalized sum well-defined. Their role in assembly is proved there, within the standing foundations.'),
          ])),
      node('Enlarge the obstruction-kernel pairing', '/routes/obstruction-vanishing', 'conditional',
        'Vanishing must hold on localizations of GLOBAL classes in BOTH degrees. This target can be weaker than Strong G for every local Chow class.',
        gate('all', 'BOTH the kernel construction and full-domain vanishing',
          'The same kernel-domain construction has full domain exactly when Hʳ=Vʳ and Hˢ=Vˢ. This is not a claim about every possible extension of that pairing. A finite-detector description needs its separate fixed-witness comparison.',
          [obstruction('obroute:kernel-height', 'Kernel pairing'), obstruction('obroute:full-domain', 'Full-domain criterion'), obstruction('obroute:detectors', 'Finite-detector qualifications')], [
            rec('BB-H16-KERNEL-DOMAIN', 'Retain the local height identities and the source-version hypotheses. For the finite-detector presentation, retain the FD17 witness comparison.'),
            node('Zero actual obstruction for all localized global classes in degrees r AND s', '/papers/obstruction-height-route#obroute:global-vanishing', 'open', 'Vanishing in only one degree enlarges only one factor.'),
          ])),
      node('Admissible arithmetic liftings', '/routes/zhang', 'conditional',
        'Zhang’s model-theoretic approach constructs arithmetic-intersection heights. It does not, by itself, construct actual non-Archimedean Green forms.',
        gate('all', 'ALL lifting and descent inputs',
          'The standard conjectures provide a published conditional route to the liftings. The curve–surface theorem is a known case, not a proof for arbitrary X.',
          [source('/papers/zhang-height-route#thm:zhang-main', 'Lifting and intersection theorem'), source('/papers/zhang-height-route#prop:zhang-common-alteration', 'Common-alteration comparison')], [
            node('Admissible liftings in BOTH complementary degrees', '/papers/zhang-height-route#thm:zhang-main', 'hypothesis', 'On a regular flat projective arithmetic model, lift every class numerically orthogonally to vertical cycles; use zero-curvature Green currents at infinity.',
              gate('any', 'ANY complete source of the required liftings',
                'Apply the selected method to every relevant class, in both degrees and at every required finite place.',
                [source('/papers/zhang-height-route#prop:zhang-numerical-obstruction', 'Numerical correction criterion'), source('/papers/zhang-height-route#thm:zhang-local-input', 'Zhang’s conditional local input')], [
                  node('Vanishing of the model numerical obstruction', '/papers/zhang-height-route#prop:zhang-numerical-obstruction', 'open',
                    'For the chosen closure, solve the correction equation against ALL vertical tests.',
                    gate('iff', 'EQUIVALENT lifting criterion',
                      'Zero model obstruction is equivalent to solvability of the full vertical correction equation and hence to a numerically admissible lifting.',
                      [source('/papers/zhang-height-route#prop:zhang-numerical-obstruction', 'Exact numerical obstruction')], [
                        node('The full vertical correction equation is solvable', '/papers/zhang-height-route#prop:zhang-numerical-obstruction', 'open', 'The finite-matrix test is valid only after all tests are proved to factor through the chosen finite-dimensional spaces.'),
                      ])),
                  node('The standard-conjecture route on semistable strata', '/papers/zhang-height-route#thm:zhang-local-input', 'conditional',
                    'This is a published conditional lifting theorem, not a proof of its general standard-conjecture premises.',
                    gate('all', 'ALL local and descent hypotheses',
                      'Retain the geometric-stratum hypotheses and descent from the completion of the maximal unramified extension.',
                      [source('/papers/zhang-height-route#thm:zhang-local-input', 'Precise local lifting hypotheses')], [
                        node('Lefschetz and Hodge standard conjectures on every required geometric stratum', '/papers/zhang-height-route#thm:zhang-local-input', 'open', 'The strata come from the specified strictly semistable model.'),
                        node('Semistable model, local lifting theorem and cycle descent', '/papers/zhang-height-route#thm:zhang-local-input', 'hypothesis', 'Keep the stated base valuation rings and the descent of the model and cycle; use the separately stated alteration argument when necessary.'),
                      ])),
                ]), 'logic-admissible-liftings'),
            node('Projection formulas and degree-normalized model descent', '/papers/zhang-height-route#prop:zhang-degree-descent', 'hypothesis', 'Retain native total degrees, compatible field extension and a common dominating alteration for comparisons.'),
          ])),
    ]), 'logic-full-chow-pairing');

const fixedFieldNorthcott = () => node('Northcott over one fixed number field E', '/programme#finiteness', 'open',
  'Only the projected images of integral cycles are counted. Bounded height among arbitrary rational multiples is not the target.',
  gate('any', 'ANY complete fixed-field criterion',
    'These are sufficient routes, not completed geometric hypotheses. Real positivity is required in each route.',
    [arithmetic('thm:lattice-equivalence', 'Finite-rank lattice criterion'), arithmetic('thm:weak-mw-gap', 'Weak Mordell–Weil and gap criterion')], [
      node('Real positivity AND one common rational lattice', '/entries/R2-N3', 'conditional',
        'In finite rational rank with a real positive form, Northcott, a positive gap, finite generation, a common denominator lattice and finite-adelic compactness are equivalent.',
        gate('all', 'BOTH positivity and a common lattice',
          'A common finite-rank lattice supplies the required discreteness. Positive definiteness by itself does not.',
          [arithmetic('thm:lattice-equivalence', 'R2-N3: five equivalent conditions')], [
            rec('OPEN-REAL-POSITIVITY', 'Real positive definiteness of the fixed-field residual form.'),
            rec('OPEN-INTEGRAL-LATTICE', 'A single finite-rank rational lattice contains the entire integral image up to one common denominator.', {
              gate: gate('all', 'One sufficient route: ALL-prime saturation',
                'R2-N4 needs agreement with the same rational lattice at almost every prime. Separate local integral bounds do not supply this agreement.',
                [arithmetic('thm:all-prime', 'R2-N4: all-prime criterion')], [
                  rec('OPEN-SCALAR-DETECTION', 'Require scalar-extended injective detectors at EVERY rational prime p.'),
                  rec('R2-R3', 'Choose full ℤₚ-lattices Mₚ in the finite-dimensional targets containing the actual integral regulator images. These are local bounds.'),
                  node('Almost-everywhere saturation relative to ONE full rational lattice', '/papers/arithmetic-reductions#thm:all-prime', 'open', 'For almost all p, Dₚ⁻¹(Mₚ)=Λ₀⊗ℤₚ for that same Λ₀. This is additional to local finite generation.'),
                ], {
                  'R2-N4': 'Inference rule under finite rational dimension, injectivity at every prime, full local lattices and the stated almost-everywhere equality with ONE rational lattice. It does not provide that equality.',
                }),
            }),
          ], {
            'R2-N3': 'The finite-rank lattice equivalence justifies this sufficient criterion. Its proved status belongs to the equivalence, not to real positivity or the existence of the required geometric lattice.',
          })),
      node('Real positivity AND a genuine height gap AND a finite Kummer quotient', '/entries/R2-N5', 'conditional',
        'This descent criterion does not assume finite rank in advance; finite generation and Northcott are conclusions.',
        gate('all', 'ALL three weak Mordell–Weil inputs',
          'The uniform positive height gap is an independent requirement. A finite quotient alone does not establish it.',
          [arithmetic('thm:weak-mw-gap', 'R2-N5: quantitative descent')], [
            rec('OPEN-REAL-POSITIVITY', 'Use the real positive quadratic form.'),
            node('A uniform positive gap on nonzero integral classes', '/papers/arithmetic-reductions#thm:weak-mw-gap', 'open', 'Find ε>0 with q(λ)≥ε for every nonzero λ in the fixed-field integral image.'),
            node('A finite quotient Λ/mΛ for some m≥2', '/papers/arithmetic-reductions#prop:local-lattice', 'conditional', 'One coefficient prime may supply m=p under scalar detection.',
              gate('all', 'BOTH local integrality and scalar detection',
                'The scalar-injective image embeds Λ⊗ℤₚ into a finite ℤₚ-module. Taking its own quotient modulo p gives a finite Kummer quotient.',
                [arithmetic('prop:local-lattice', 'Local integral image theorem'), arithmetic('cor:finite-rank', 'Finite-rank consequence')], [
                  rec('OPEN-SCALAR-DETECTION', 'Injectivity after extension of scalars to ℚₚ, not merely injectivity over ℚ.'),
                  rec('R2-R3', 'Use the actual integral regulator bound at that prime.'),
                ])),
          ], {
            'R2-N5': 'The descent theorem takes real positivity, a finite Kummer quotient and a genuine uniform positive gap as premises. Finite generation is its conclusion; finite rank is not assumed in advance.',
          })),
    ]));

export const logicalTrees = [
  {
    id: 'logic-global', navTitle: 'Global height target', title: 'From a constructed pairing to the full global target',
    summary: 'A complete construction route + functoriality + normalization + comparison ⇒ the full height target.',
    scope: 'Fix a number field F, a smooth projective geometrically integral X/F and complementary r+s=dim(X)+1. The universal conjecture requires the same properties for every required variety and finite extension.',
    contexts: [
      rec('BB-HEIGHT-DATA', 'Defines the complete H1–H4 interface. The construction and comparison gates must establish these properties on the required domains; the definition does not establish them.'),
    ],
    root: rec('BB-GLOBAL', 'The root is the full target, not merely the existence of a bilinear pairing.', {
      gate: gate('all', 'ALL requirements of the full target',
        'This separates the requirements in the target statement. A construction theorem must be supplemented by the additional comparison and functoriality inputs on its own domain.',
        [source('/entries/BB-GLOBAL', 'Full target'), source('/entries/BB-HEIGHT-DATA', 'H1–H4'), programme('sec:programme-comparison', 'Separate comparison step')], [
          fullChowPairing,
          node('H2: normalized extension, isomorphism and Galois compatibility', '/entries/BB-HEIGHT-DATA', 'hypothesis', 'For the direct construction, finite trace and its degree formula are additional inputs.', undefined, 'logic-extension-compatibility'),
          node('H3: full correspondence adjunction', '/papers/global-height-pairing#r16ha:adjunction', 'hypothesis', 'The adjunction theorem retains its proper-intersection hypotheses and the specified height domains.'),
          node('H4 and classical agreement on common domains', '/programme#comparison', 'open', 'Match the pointed-curve Néron–Tate sign and Poincaré normalization, and compare with classical heights under the stated model hypotheses.', undefined, 'logic-classical-comparison'),
        ]),
    }),
  },
  {
    id: 'logic-green', navTitle: 'Local Green forms', title: 'How an exact-support Green form is obtained',
    summary: 'A curved Green pair + a global actual primitive ⇒ a strong Green form for the same cycle.',
    scope: 'Use BB-LOCAL-DATA: X/K is smooth projective geometrically integral, K/ℚₚ is the original finite extension, and Z is a rational codimension-r cycle with 1≤r≤dim(X). Every conclusion keeps the prescribed complement and full actual tests.',
    contexts: [
      rec('BB-LOCAL-DATA', 'Fixes the original absolute value, ordinary actual form sheaf, prescribed cycle coefficients and exact complement, full actual test space, integrability and native finite degrees.'),
    ],
    root: node('A strong zero-curvature Green form for the prescribed Z', '/entries/BB-GREEN-CORRECTION', 'conditional',
      'The correction is γ=G−Ψ on the original complement. This is a sufficient construction; an arbitrary strong Green form need not arise from the selected obstruction map.',
      gate('all', 'ALL inputs of curvature correction',
        'Subtract the actual Stokes identity for the global primitive from the curved Green identity. No additional support is removed.',
        [obstruction('obroute:curvature-correction', 'Curvature-correction proof'), source('/entries/BB-GREEN-CORRECTION', 'Permanent reduction record')], [
          rec('BB-SUPPORTED-GREEN-PAIR', 'The exact-support construction remains a draft analytic input.'),
          node('A global actual primitive DΨ=Ω', '/papers/obstruction-height-route#obroute:bott-chern', 'open',
            'When the obstruction construction identifies [ΩZ] with Ob([Z]), zero obstruction is equivalent to this primitive. A directly constructed primitive does not require that obstruction construction. Each method below keeps its own premises.',
            gate('any', 'ANY applicable method for the primitive',
              'Geometric cases do not exhaust all homologically trivial cycles. The general source-vanishing and tropical interfaces remain open.',
              [obstruction('obroute:bott-chern', 'Actual Bott–Chern quotient'), programme('sec:programme-source', 'Source-vanishing programme')], [
                rec('BB-ALG-TRANSFER', 'Theorem A applies to geometrically ALGEBRAICALLY trivial classes.', {
                  gate: gate('all', 'ALL Theorem A premises',
                    'Rational-fibre rigidity makes the additive Jacobian map locally constant; compactness and torsion-freeness force its image to vanish.',
                    [construction('thm:main-algebraic', 'Theorem A'), construction('hyp:construction-calculus', 'Construction calculus')], [
                      node('Z is geometrically algebraically trivial', '/entries/BB-ALG-TRANSFER', 'hypothesis', 'This domain is smaller than the full homologically trivial Chow group.'),
                      rec('BB-ACTUAL-OBSTRUCTION', 'Assume the Chow-invariant actual obstruction (A1), together with the curved Green construction (A2).'),
                      rec('BB-RATIONAL-FIBRE-RIGIDITY', 'The rational-fibre rigidity input R is still a draft.'),
                      rec('BB-COMPACT-RIGIDITY', 'This is the proved compact-group step, not a substitute for the analytic rigidity input.'),
                    ]),
                }),
                rec('BB-MOTIVIC-TRANSFER', 'Theorem B applies to potential abelian Chow retracts, with geometrically homologically trivial Z.', {
                  gate: gate('all', 'ALL Theorem B premises',
                    'Use abelian obstruction vanishing and the actual Chow identity for the diagonal, then descend with the full finite degree. A numerical or cohomological factorization is not enough.',
                    [construction('thm:main-abelian', 'Theorem B'), construction('def:construction-retraction', 'Chow retraction and degree shifts')], [
                      node('The analytic packages A1, A2, N and C', '/papers/green-constructions#hyp:construction-calculus', 'hypothesis', 'These include the stated obstruction, support, numerical descent and correspondence compatibilities; R is not an extra premise of this route.'),
                      rec('BB-ABELIAN-STAGE', 'The abelian conclusion retains both the geometric certificate and the draft analytic descent input.', {
                        gate: gate('all', 'BOTH the abelian numerical certificate and finite numerical descent',
                          'After finite extension, the semistable abelian model produces a certificate for the pullback of the given geometrically homologically trivial class. Finite numerical descent returns its obstruction to zero over the original field.',
                          [construction('thm:kunnemann-local', 'Local semistable model input'), construction('lem:abelian-lift', 'The abelian numerical certificate'), construction('thm:abelian-G', 'Conditional abelian conclusion')], [
                            node('Künnemann’s semistable input and the abelian numerical certificate', '/papers/green-constructions#lem:abelian-lift', 'hypothesis', 'For the prescribed homologically trivial class on A, retain the semistable component exactness, cycle-class injectivity and the numerical vanishing on every vertical testing cycle.'),
                            rec('BB-FINITE-NUMERICAL-DESCENT', 'Assume the proposed analytic descent theorem for the finite map A_F→A. Retain the numerical detector, generic-Chow-zero primitive, trace on the original scalar–curvature generators, and full degree [F:K]. A proper alteration alone is not this finite map.'),
                          ]),
                      }),
                      node('An actual abelian Chow retraction after finite extension', '/papers/green-constructions#def:construction-retraction', 'hypothesis', 'The rational Chow identity uses opposite Tate shifts. Z must be geometrically homologically trivial.', undefined, 'logic-chow-retraction'),
                    ]),
                  links: [source('/entries/BB-CURVE-CHOW-DIAGONAL', 'Proved diagonal for pointed products'), source('/entries/BB-CURVE-PRODUCT-DRAFT', 'Product application: draft, with regular-model premises')],
                }),
                rec('BB-RESIDUAL-PERIODS', 'Only the image of the original Chow source needs to vanish; the entire obstruction space need not vanish. The general record concerns that whole source; this local branch applies the criterion to the fixed class [Z].', {
                  gate: gate('all', 'BOTH detection and vanishing',
                    'A sufficient detector comparison is intersection of period kernels contained in the obstruction kernel. Equality of kernels is a stronger statement.',
                    [obstruction('obroute:period-criterion', 'Period criterion')], [
                      node('Comparison with the ORIGINAL actual obstruction', '/papers/obstruction-height-route#obroute:period-criterion', 'open', 'First identify [ΩZ]=Ob([Z]) for the chosen Green pair. Fix the period functionals and prove that their joint vanishing detects this Ob on the specified Chow source.'),
                      node('All selected periods vanish on the required classes', '/entries/BB-RESIDUAL-PERIODS', 'open', 'The general target requires this for EVERY original homologically trivial class; one calculation only treats that class. Finite-dimensionality of a cohomology group alone proves neither assertion.'),
                    ]),
                }),
                rec('BB-TROPICAL-INTERFACE', 'An alternative construction of Ψ, not a consequence of topological inverse limits alone.', {
                  gate: gate('open', 'OPEN realization bridge',
                    'A primitive in a tropical complex becomes usable only after a comparison into global actual forms with every listed compatibility.',
                    [direct('groute:gluing', 'Tropical comparison problem')], [
                      node('A primitive of the original curvature in the chosen tropical complex', '/papers/green-height-route#groute:gluing', 'open', 'The complex and the relevant Hodge/Aeppli comparison must be specified.'),
                      node('Actual realization, both differentials, integration, gluing and descent', '/entries/BB-TROPICAL-INTERFACE', 'open', 'Preserve all actual tests, ordinary refinements, overlaps, the exact support and the original valued-field normalization.'),
                    ]),
                }),
              ])),
          node('Actual Stokes against every complementary test', '/entries/BB-GREEN-CORRECTION', 'hypothesis', 'The primitive is global and belongs to the actual form space, not merely to a larger current space.'),
        ], {
          'BB-GREEN-CORRECTION': 'Conditional curvature-correction rule: the prescribed curved pair and a global actual primitive, with actual Stokes, give the strong identity on the SAME complement and every stated test.',
        })),
    related: [
      rec('BB-CURVE-PRODUCT-DRAFT', 'The product-of-curves application retains its draft status, although its Chow-diagonal ingredient has an internal proof.', {
        gate: gate('all', 'ALL premises of the model-sensitive application',
          'A Chow factorization alone does not supply the simultaneous models or the actual-form transfer theorem.',
          [construction('thm:chow-abelian-criterion', 'Model-sensitive Chow criterion')], [
            rec('BB-CURVE-CHOW-DIAGONAL', 'The actual rational Chow diagonal, with the required degree shifts.'),
            rec('BB-REGULAR-PRODUCT-MODELS', 'The simultaneous regular-model construction remains a draft input.'),
            rec('BB-REGULAR-CHOW-CRITERION', 'Retain its numerical detector, finite numerical descent and supported correspondence-transfer hypotheses.'),
          ]),
      }),
      rec('BB-ANALYTIC-INTERFACE', 'The open verification problem for the actual-form construction. These draft ingredients are obligations to establish, not a completed proof package.', {
        id: 'logic-analytic-interface',
        gate: gate('open', 'OPEN analytic verification obligations',
          'Verify the numerical detector and the scalar–curvature trace with their actual relations, then the supported and Chow-invariant constructions. This verification relation does not promote any draft status or replace the stronger operations used in global height assembly.',
          [programme('sec:programme-analytic', 'Prescribed-cycle, trace and residue obligations'), source('/entries/BB-ANALYTIC-INTERFACE', 'The exact analytic question')], [
            rec('BB-MODEL-DETECTOR', 'Draft inference on an integral projective flat model: zero operational degree against EVERY vertical r-cycle gives strict zero actual model curvature. The vector-bundle statement also needs the stated flag-bundle descent; smooth or reduced special fibre is not assumed.'),
            rec('BB-RESTRICTED-TRACE', 'Draft trace for finite dominant maps of normal integral separated varieties, only on the actual scalar–curvature module generated by u₀Du₁⋯Duₖ. Verify presentation independence, ordinary locality, the required differential identities, full native degree and all-test adjunction. This is not a trace of arbitrary actual forms along a proper map.'),
            rec('BB-SUPPORTED-GREEN-PAIR', 'Verify the supported-complex residue with its lengths and rational coefficients, on the ENTIRE prescribed complement and all compact actual tests.'),
            rec('BB-ACTUAL-OBSTRUCTION', 'Verify model and resolution independence in actual Bott–Chern cohomology, Chow invariance, and the genuine pullbacks required by A1. The selected Green curvature must represent this same obstruction.'),
          ]),
      }),
    ],
  },
  {
    id: 'logic-arithmetic', navTitle: 'Arithmetic equivalences', title: 'The exact arithmetic reduction for products of curves',
    summary: 'Under H1–H4: off-central vanishing + AJ injectivity + residual Northcott ⇔ the full product package.',
    scope: 'Fix the pointed products and product polarization. H1–H4 must hold on all required subproducts, source curves of correspondences and finite extensions.',
    contexts: [
      rec('BB-CENTRAL-DATA', 'Defines the pointed product, anchored positive integral polarization, Chow cores U, algebraic part A and quotient G. The primitive and central ranges stay fixed throughout each use.'),
      rec('BB-HEIGHT-DATA', 'Assume H1–H4 on all involved varieties and finite extensions for conclusions involving heights. The Chow equivalence R2-L1 and the geometric projector construction do not themselves need these height axioms.'),
      rec('BB-INTEGRAL-IMAGE', 'Defines the projected images of integral cycles and bounded-degree Northcott. Counting takes place after rational equivalence and torsion have been removed, in one geometric rational group.'),
    ],
    root: node('Arithmetic hard Lefschetz AND primitive integral bounded-degree Northcott', '/entries/R2-L3', 'open',
      'R2-L3 proves an equivalence under the height axioms. It does not establish the three open inputs.',
      gate('iff', 'EQUIVALENT to ALL three assertions, under H1–H4',
        'The same package then implies real primitive positivity and complementary nondegeneracy. The sum-of-squares identity R2-L2 is the propagation rule, with its common coordinate denominator.',
        [arithmetic('thm:program-equivalence', 'R2-L3: exact package'), arithmetic('thm:primitive-squares', 'R2-L2: primitive sum of squares'), source('/entries/BB-HEIGHT-DATA', 'Required height system H1–H4')], [
          rec('OPEN-OFFCENTRAL', 'For all required subproducts. R2-L1 identifies this with arithmetic hard Lefschetz; it does not prove the vanishing.', { links: [source('/entries/R2-L1', 'R2-L1: the Chow equivalence')] }),
          rec('OPEN-AJ-KERNEL', 'Eliminate the algebraic contribution to the central height radical.'),
          rec('OPEN-RESIDUAL-NC', 'Bounded-height, bounded-degree finiteness for the residual INTEGRAL image.', {
            links: [source('/research-map#logic-fixed-field', 'Fixed-field criteria'), source('/research-map#logic-fields', 'The extra field-control step')],
          }),
        ], {
          'R2-L3': 'Main equivalence rule under H1–H4 on every required subproduct, correspondence source and finite extension. Its conditional theorem status does not resolve any of the three open inputs.',
          'R2-L1': 'Proof ingredient: for the fixed pointed product and fixed E, off-central vanishing on ALL subproducts is equivalent to arithmetic hard Lefschetz. No height axiom is needed for this equivalence.',
          'R2-L2': 'Proof ingredient: H1–H4 and the central Chow-block construction give the primitive sum-of-squares identity with one common denominator ∏aᵢ. Off-central vanishing is NOT a premise of that identity; it is used separately when passing to the whole product.',
        }), 'logic-product-package'),
    related: [
      node('Central integral bounded-degree Northcott for every odd subproduct', '/entries/R2-N1', 'open',
        'The orthogonal projector separates the Néron–Tate part from the residual quotient before Northcott is tested.',
        gate('iff', 'EQUIVALENT to BOTH assertions, under H1–H4',
          'The algebraic radical must be zero and the residual integral classes must satisfy Northcott.',
          [arithmetic('thm:central-northcott', 'R2-N1: central criterion'), arithmetic('prop:central-projector', 'Projector, orthogonality and radical')], [
            rec('OPEN-AJ-KERNEL', 'Injectivity on the central algebraic part.'),
            rec('OPEN-RESIDUAL-NC', 'Finiteness on the residual integral image.'),
          ], {
            'BB-CHOW-PROJECTOR': 'Geometric construction of actual self-transpose Chow idempotents e and R after ONE fixed finite extension, valid for every further finite E. It supplies the curve-visible abelian summand independently of the height axioms.',
            'BB-RESIDUAL-PAIRING': 'With those projectors AND H1–H4, orthogonality identifies the algebraic AJ kernel with the relevant radical and constructs the residual form on G=U/A. These are the inputs used by the central Northcott criterion.',
            'R2-N1': 'Central Northcott equivalence rule: in the stated height setting, integral Northcott is equivalent to algebraic AJ injectivity together with residual integral Northcott. Retain the same fixed-field or bounded-degree quantifiers on both sides.',
          })),
      rec('OPEN-REAL-POSITIVITY', 'A necessary consequence of residual Northcott on each fixed field, not an equivalent finiteness statement.', {
        gate: gate('all', 'ONE-WAY implication',
          'R2-N2 rules out real null directions from Northcott without a finite-rank hypothesis. The reverse direction still needs integral control.',
          [arithmetic('lem:northcott-real', 'R2-N2: Northcott forces real positivity')], [rec('OPEN-RESIDUAL-NC', 'Apply the bounded-degree assertion on each fixed field.')], {
            'R2-N2': 'Inference rule for an additive integral image spanning its rational space: finite upper height balls force positive definiteness after real scalar extension. It does not assume finite rank and has no converse without integral discreteness.',
          }),
      }),
    ],
  },
  {
    id: 'logic-fixed-field', navTitle: 'Fixed-field Northcott', title: 'Two ways to establish fixed-field Northcott',
    summary: 'Positive height + common lattice, OR positive height + genuine gap + finite Kummer quotient.',
    scope: 'Assume H1–H4 and fix one odd central block, one finite extension E/F₀ of number fields and the projected integral image ΛG(E). Do not replace it by all rational classes.',
    contexts: [
      rec('BB-INTEGRAL-IMAGE', 'The group here is the image of integral cycles in the fixed residual rational quotient. Fixed-field Northcott fixes E; rational multiples with unbounded denominators are outside this target.'),
    ],
    root: fixedFieldNorthcott(),
    related: [
      node('A common rational lattice for the integral image', '/entries/OPEN-INTEGRAL-LATTICE', 'open',
        'The denominator example is an abstract obstruction to an inference, not a counterexample to the geometric Northcott conjecture.',
        gate('blocked', 'INSUFFICIENT without global denominator control',
          'Even finite local modules at every prime do not supply the almost-everywhere saturation required by R2-N4.',
          [arithmetic('ex:denominators', 'The denominator obstruction')], [
            rec('R2-R3', 'Prime-by-prime local integral bounds are available, but are not a common rational lattice.'),
          ], {
            'BB-DENOMINATOR-EXAMPLE': 'Counterexample supporting the BLOCKED inference: Λ=∑ₚ(1/p)ℤ⊂ℚ has finite free local ℤₚ-modules but unbounded global denominators and arbitrarily small nonzero squared heights. This is not a counterexample to the geometric lattice conjecture.',
          })),
      node('Finite rational dimension of the residual source over E', '/papers/arithmetic-reductions#cor:finite-rank', 'conditional',
        'This is a separate conditional reduction, not a proof of scalar detection.',
        gate('all', 'BOTH inputs, at ONE prime',
          'Scalar-extended injectivity embeds the residual source into the finite-dimensional arithmetic target.',
          [arithmetic('cor:finite-rank', 'Finite-rank corollary'), arithmetic('prop:weight-minus-one', 'Weight −1 target theorem')], [
            rec('OPEN-SCALAR-DETECTION', 'Injectivity after tensoring with ℚₚ at one prime.'),
            rec('R2-R2', 'Finite-dimensional full rational target for the fixed field, using the residual regulator R2-R1.'),
          ], {
            'R2-R1': 'Construction used by this reduction: the actual residual projector supplies the canonical regulator G_E→H¹(E,Vₚ), independent of the curve-visible choice under the stated identification. The regulator construction alone proves neither scalar injectivity nor finite rational rank and needs no height axioms.',
          })),
    ],
  },
  {
    id: 'logic-fields', navTitle: 'Bounded-degree Northcott', title: 'The additional step from fixed field to bounded degree',
    summary: 'Fixed-field Northcott over every finite extension + uniform class-field ramification ⇔ bounded-degree Northcott.',
    scope: 'Assume H1–H4 and apply the criterion separately to EVERY odd subproduct, with the field- and Galois-invariant residual form and restriction/trace-compatible integral images. Use the minimal field of the cycle CLASS, not cohomological ramification over a fixed field.',
    contexts: [
      rec('BB-INTEGRAL-IMAGE', 'The same compatible projected integral images are used over all finite E. The minimal field of a rational Chow class need not already carry an integral representative of that class.'),
    ],
    root: rec('OPEN-RESIDUAL-NC', 'The bounded-degree target needs both arithmetic finiteness and field control.', {
      gate: gate('iff', 'EQUIVALENT to BOTH requirements',
        'R2-F2 uses Hermite–Minkowski for finitely many candidate fields and R2-F1 for a bounded descent multiplier, then applies fixed-field Northcott.',
        [arithmetic('thm:ramification', 'R2-F2: field criterion'), arithmetic('lem:class-trace', 'R2-F1: trace to the class field')], [
          node('Fixed-field Northcott for EVERY finite extension E/F₀', '/research-map#logic-fixed-field', 'open', 'Prove one of the fixed-field criteria for each field. This alone does not control a union of varying fields.'),
          rec('OPEN-CLASS-RAMIFICATION', 'For bounded height and degree, bound a finite set of primes ramifying in the minimal class fields.', {
            gate: gate('all', 'A STRONGER sufficient condition',
              'The discriminant estimate is one possible route to ramification control; the converse is not asserted.',
              [arithmetic('eq:discriminant-target', 'Quantitative discriminant target')], [
                rec('OPEN-DISCRIMINANT', 'A uniform bound in terms of height and degree gives finitely many possible discriminants at fixed bounds.'),
              ]),
          }),
        ], {
          'R2-F2': 'Ramification equivalence rule for a field- and Galois-invariant height and trace-compatible integral images. Its theorem does not establish the open ramification assertion for geometric residual classes.',
          'R2-F1': 'Descent lemma used in the proof: for ξ represented integrally over E and class field K, [E:K]ξ lies in Λ(K), with multiplier at most the bounded field degree. It does NOT assert ξ∈Λ(K).',
        }),
    }),
    related: [
      node('Bounded-degree Northcott for the residual integral image', '/entries/OPEN-RESIDUAL-NC', 'open',
        'The abstract varying-quadratic-field example isolates a failed inference to this target. It is not a counterexample to the geometric residual Northcott conjecture.',
        gate('blocked', 'INSUFFICIENT without field control',
          'Even uniform rank, height-gap and Kummer estimates over each fixed field do not replace ramification control of the class fields.',
          [arithmetic('ex:quadratic-fields', 'Varying-field obstruction')], [
            node('All fixed-field finiteness statements', '/research-map#logic-fixed-field', 'hypothesis', 'These concern one field at a time.'),
          ])),
    ],
  },
  {
    id: 'logic-metrics', navTitle: 'Metric and family comparison', title: 'Metric comparison: established pieces and the open bridges',
    summary: 'Complex comparison and good-reduction comparison are parallel inputs; bad reduction and families need further arguments.',
    scope: 'Respect rank, degree, source-model, boundary, sign and normalization hypotheses. None of these comparisons alone establishes a global family-height theorem.',
    root: node('Classical comparison of a constructed global pairing', '/research-map#logic-classical-comparison', 'open',
      'This supplies part of the comparison work in the first tree; it is not an automatic consequence of height existence.',
      gate('open', 'OPEN global comparison bridge',
        'The work package combines a constructed pairing with placewise comparisons and compatible projection, biextension and sign conventions.',
        [programme('sec:programme-comparison', 'Global comparison programme')], [
          node('A constructed global pairing on the desired domain', '/research-map#logic-full-chow-pairing', 'conditional', 'Use one complete construction route from the first tree.'),
          rec('R2-M2', 'Rank-zero and cycle determinant comparisons at the complex places.', {
            gate: gate('all', 'ALL hypotheses for the cycle comparison',
              'The normalized Quillen theorem is combined with rank-zero Deligne comparison and the filtered Riemann–Roch cycle calculation.',
              [determinant('cor:cycle-determinant', 'Cycle determinant comparison'), determinant('thm:deligne-isometry', 'Rank-zero Deligne isometry')], [
                rec('R2-M1', 'Retain the rigidification, mixed Poincaré curvature and product Kähler hypotheses.'),
                node('Virtual rank zero and the filtered GRR cycle hypotheses', '/papers/determinant-metrics#cor:cycle-determinant', 'hypothesis', 'These identify the determinant with the flat Poincaré metric of the transpose divisor.'),
              ]),
          }),
          rec('R2-M3', 'Independent good-reduction input: a smooth proper source-curve model, section, rank zero, determinant degree zero and perfect pushforward.'),
          rec('OPEN-BAD-REDUCTION-METRIC', 'The semistable/Néron extension needs admissible vertical correction and matching actual-form trace, length and normalization.'),
          node('Compatible projection, biextension and sign conventions', '/programme#comparison', 'hypothesis', 'Keep the extra hypotheses of the chosen classical comparison, including singular-fibre conditions where relevant.'),
        ])),
    related: [
      rec('BB-FAMILY-HEIGHTS', 'A further research target, beyond local metric matching.', {
        gate: gate('open', 'OPEN family-height programme',
          'Construct the correctly metrized height line and prove boundary-compatible domination. Local metric agreement is only one input.',
          [source('/entries/BB-FAMILY-HEIGHTS', 'Family-height target'), programme('sec:programme-comparison', 'Comparison foundation')], [
            node('Compatible local and global height comparisons', '/research-map#logic-metrics', 'hypothesis', 'Use the preceding comparison problem with its actual scope.'),
            node('A correct height line, boundary hypotheses and height domination', '/entries/BB-FAMILY-HEIGHTS', 'open', 'These are separate geometric and arithmetic tasks; they are not supplied by R2-M1–M3.'),
          ]),
      }),
      node('Northcott for parameter points in a specified family open set U', '/papers/determinant-metrics#prob:family-height', 'conditional',
        'This concerns the family parameter points, not all integral classes in one fixed Chow group.',
        gate('all', 'ALL inputs of the family finiteness deduction',
          'The domination inequality bounds an ample height; classical Northcott then gives finitely many parameter points of bounded degree.',
          [determinant('prob:family-height', 'Family domination and its consequence')], [
            node('Field-invariant fibre pairings and a uniform domination inequality on U', '/entries/BB-FAMILY-HEIGHTS', 'open', 'Prove q_Z(s) ≥ ε h_A(s) − C with ε>0, with the required metric identification and boundary hypotheses.'),
            node('An ample line bundle A on a fixed projective compactification over a number field', '/papers/determinant-metrics#prob:family-height', 'hypothesis', 'The degree and q_Z(s) are bounded. Fix the polarization, open set and constants throughout.'),
          ])),
    ],
  },
];

export function validateLogicalMap(entries, trees = logicalTrees) {
  const ids = new Set(entries.map(entry => entry.id));
  const entryById = new Map(entries.map(entry => [entry.id, entry]));
  const referencedRecords = new Set();
  const anchors = new Set();
  let contextOccurrences = 0;
  let ruleOccurrences = 0;
  const kinds = new Set(['all', 'any', 'iff', 'open', 'blocked']);
  const addAnchor = id => {
    if (anchors.has(id)) throw new Error('Repeated logical-map anchor: ' + id);
    anchors.add(id);
  };
  function visit(item) {
    if (item.id) addAnchor(item.id);
    if (item.record && !ids.has(item.record)) throw new Error('Unknown logical-map record: ' + item.record);
    if (item.record && item.status) throw new Error('A logical map must not override source status: ' + item.record);
    if (item.record) referencedRecords.add(item.record);
    if (!item.record && (!item.title || !item.href || !item.status)) throw new Error('Incomplete logical-map property node');
    if (!item.gate) return;
    if (!kinds.has(item.gate.kind) || !item.gate.children?.length || !item.gate.explanation || !item.gate.sources?.length) throw new Error('Incomplete logical relation for ' + (item.record || item.title));
    for (const evidence of item.gate.sources) if (!evidence.href || !evidence.label) throw new Error('Missing logical relation evidence');
    const rules = item.gate.rules || [];
    if (!Array.isArray(rules) || new Set(rules).size !== rules.length) throw new Error('Invalid logical-map inference rules');
    for (const record of rules) {
      if (!ids.has(record)) throw new Error('Unknown logical-map rule: ' + record);
      if (!item.gate.ruleNotes?.[record]) throw new Error('Missing logical-map rule scope: ' + record);
      referencedRecords.add(record);
      ruleOccurrences++;
    }
    for (const record of Object.keys(item.gate.ruleNotes || {})) {
      if (!rules.includes(record)) throw new Error('Rule note without a logical-map rule: ' + record);
    }
    item.gate.children.forEach(visit);
  }
  for (const tree of trees) {
    addAnchor(tree.id);
    if (!tree.scope || !tree.summary) throw new Error('Logical tree lacks its scope: ' + tree.id);
    for (const context of tree.contexts || []) {
      if (!context.record || entryById.get(context.record)?.kind !== 'definition' || !context.note || context.gate) throw new Error('Invalid logical-map definition context');
      visit(context);
      contextOccurrences++;
    }
    visit(tree.root);
    (tree.related || []).forEach(visit);
  }
  const missing = entries.filter(entry => !referencedRecords.has(entry.id)).map(entry => entry.id);
  if (missing.length) throw new Error('Permanent records missing from logical-map nodes: ' + missing.join(', '));
  return { trees: trees.length, anchors: anchors.size, records: referencedRecords.size, contexts: contextOccurrences, rules: ruleOccurrences };
}
