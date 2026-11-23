// Reading order and conditional implications, not additional theorem records.
// Exact statements and proofs are in the linked programme and companion papers.
export const programmeOverview = {
  title: 'From Green forms to height pairings',
  summary: 'The principal-push theorem (PH16; Theorem 7.5) proves the passage from Strong G to the full Beilinson–Bloch height pairing within the stated analytic foundations. The central general existence problem is to supply the required strong Green forms. Classical comparisons, positivity and finiteness for integral classes have their own hypotheses and research questions.',
  target: String.raw`For a smooth, projective and geometrically integral variety \(X/F\) of dimension \(n\) over a number field, construct a canonical pairing
\[
h_X:\operatorname{CH}^r(X)_{\mathbb Q,\mathrm{hom}}\times\operatorname{CH}^{n+1-r}(X)_{\mathbb Q,\mathrm{hom}}\longrightarrow\mathbb R.
\]`,
  paper: '/papers/strong-g-programme#sec:programme',
  pdf: '/papers/strong-g-programme.pdf',
};

export const programmeImplications = [
  {
    id: 'curvature-correction',
    assumptions: 'A Green pair on the prescribed complement and a global actual primitive of its curvature.',
    conclusion: 'A zero-curvature Green form for that prescribed cycle, against all actual tests.',
    href: '/papers/strong-g-programme#thm:source-reduction',
    label: 'Curvature correction',
  },
  {
    id: 'domain-extension',
    assumptions: 'The height construction on the intersection of the local obstruction kernels, and vanishing for global classes in both complementary degrees.',
    conclusion: 'The same pairing is defined on both full homologically trivial Chow groups.',
    href: '/papers/strong-g-programme#sec:programme-global',
    label: 'Enlargement of the domain',
  },
  {
    id: 'direct-assembly',
    assumptions: 'Strong G at every finite completion for every specified geometrically homologically trivial rational cycle in both complementary codimensions, within the standing analytic foundations of the global height paper.',
    conclusion: 'A canonical real pairing on both full Chow groups, with Green-choice independence, symmetry, finite summation, rational-equivalence descent and the stated base-extension and Bloch-biextension properties.',
    href: '/papers/global-height-pairing#r16ph:general-height',
    label: 'Proved implication: Theorem 7.5 (PH16)',
  },
];

export const programmeSteps = [
  {
    id: 'analytic', number: '1', title: 'Green forms and finite trace',
    goal: 'Construct a Green pair for every prescribed cycle over the original non-Archimedean field.',
    formula: String.raw`\(D[G_Z]+\delta_Z=[\Omega_Z]\), where \(D=d'd''\) and \(G_Z\in\mathcal B^{r-1,r-1}(X^{\mathrm{an}}\setminus|Z|^{\mathrm{an}})\).`,
    method: 'Prove the supported construction and its trace identities on the actual form space. Trace must preserve differential relations and adjunction against every compact actual test, with the full field-degree normalization.',
    output: 'Once the curvature has a global actual primitive, subtracting it gives Strong G on the same support complement.',
    depends: 'The actual differential calculus and the supported Chern-form construction.',
    records: ['BB-SUPPORTED-GREEN-PAIR', 'BB-RESTRICTED-TRACE', 'BB-GREEN-CORRECTION'],
    paper: '/papers/strong-g-programme#sec:programme-analytic',
  },
  {
    id: 'source', number: '2', title: 'Vanishing of the Bott–Chern class',
    goal: 'Show that homologically trivial cycles have zero curvature class in the actual Bott–Chern quotient.',
    formula: String.raw`\(\mathfrak o^r_{X,K}\bigl(\operatorname{CH}^r(X)_{\mathbb Q,\mathrm{hom}}\bigr)=0\).`,
    method: 'First apply the algebraic-equivalence and Chow-correspondence arguments on their stated domains. For the remaining classes, seek a comparison theorem showing that vanishing of the cohomological cycle class forces every actual obstruction period to vanish.',
    output: 'Together with Step 1, this is a sufficient route to Strong G. The tropical approach is an alternative method for constructing the required actual primitives, with its own descent and integration comparisons.',
    depends: 'Step 1 for the passage from obstruction vanishing to a Green form.',
    records: ['BB-ALG-TRANSFER', 'BB-MOTIVIC-TRANSFER', 'BB-RESIDUAL-PERIODS', 'BB-TROPICAL-INTERFACE'],
    paper: '/papers/strong-g-programme#sec:programme-source',
  },
  {
    id: 'global', number: '3', title: 'The proved height construction from Strong G',
    goal: 'Apply Theorem 7.5 (PH16): within the standing analytic foundations, Strong G gives a local sum independent of Green choices that descends through rational equivalence in both variables.',
    formula: String.raw`\(h_X(Z,W)=\sum_v \dfrac{[F_v:\mathbb Q_v]}{[F:\mathbb Q]}\,\lambda_v(Z_v,W_v)\).`,
    methodLabel: 'Proved construction',
    method: 'The principal-push proof computes the principal-cycle norm from −log|u| on a normal carrier. Reciprocity transfers the calculation to arbitrary supplied strong Green forms. Good-place vanishing makes the sum finite, and the product formula gives Chow descent. The alternative obstruction-kernel route reaches full domain by vanishing on localized global classes in both degrees.',
    output: 'A canonical real symmetric pairing on both full geometrically homologically trivial rational Chow groups, with the prescribed normalization and Bloch-biextension interpretation. Positivity and finiteness remain separate questions.',
    depends: 'Strong G at every finite completion in both complementary codimensions, and the stated analytic foundations, whose review status is retained. The direct theorem does not require vanishing of a chosen obstruction map.',
    records: ['BB-H16-KERNEL-DOMAIN', 'BB-GLOBAL'],
    paper: '/papers/global-height-pairing#r16ph:general-height',
    linkLabel: 'Theorem 7.5 and its complete proof',
  },
  {
    id: 'comparison', number: '4', title: 'Correspondence adjunction and classical heights',
    goal: 'Prove that the constructed pairing has the required correspondence identity and agrees with the classical height on common domains.',
    formula: String.raw`\(h_X(\Gamma_*z,w)=h_Y(z,{}^t\Gamma_*w)\).`,
    method: 'Apply the proper-intersection projection formula to correspondences. Compare the finite-place terms on supplied admissible arithmetic models, and match the archimedean determinant and Poincaré normalizations. At bad reduction, construct the required vertical corrections.',
    output: 'Identification with the classical Beilinson–Bloch pairing on the common domain, together with the normalization needed for subsequent height identities.',
    depends: 'Step 3 and the additional projection-formula and admissible-model hypotheses used by each comparison.',
    records: ['R2-M1', 'R2-M2', 'R2-M3', 'OPEN-BAD-REDUCTION-METRIC'],
    paper: '/papers/strong-g-programme#sec:programme-comparison',
  },
  {
    id: 'arithmetic', number: '5', title: 'Arithmetic Lefschetz and positivity',
    goal: 'For pointed products of curves, prove the Chow vanishing and central positivity assertions used by the arithmetic reduction theorem.',
    formula: String.raw`\(\Pi_*\operatorname{CH}^c(Y)_{\mathbb Q,\mathrm{hom}}=0\quad(k\ne2c-1),\qquad Y=\prod_{i=1}^{k}C_i\), where \(\Pi=\bigotimes_i(\Delta_{C_i}-o_i\times C_i-C_i\times o_i)\) is the projector onto the product of the \(h^1(C_i)\) factors.`,
    method: 'Work separately on off-central vanishing, injectivity of the central algebraic Abel–Jacobi map, and real positive definiteness of the residual height. Keep the fixed product polarization and the height axioms H1–H4 throughout.',
    output: 'Under H1–H4, these assertions yield arithmetic hard Lefschetz, primitive positivity and complementary nondegeneracy by the central-block identities.',
    depends: 'The height system H1–H4 on all required subproducts, source curves of correspondences and finite extensions; these arithmetic assertions are additional to height existence.',
    records: ['OPEN-OFFCENTRAL', 'OPEN-AJ-KERNEL', 'OPEN-REAL-POSITIVITY', 'R2-L3'],
    paper: '/papers/strong-g-programme#sec:programme-arithmetic',
  },
  {
    id: 'finiteness', number: '6', title: 'Integral Northcott finiteness',
    goal: 'Prove bounded-height finiteness for the projected images of integral cycles, first over a fixed field and then in bounded degree.',
    formula: String.raw`\(\#\{z\in\Lambda_{\le d}:q(z)\le B\}<\infty\). Here \(q\) is the signed residual quadratic height and \(\Lambda_{\le d}\) consists of projected integral classes defined over extensions of degree at most \(d\) of the fixed base field.`,
    method: 'Over each fixed field, combine real positivity with a common finite-rank lattice, or use real positivity and a proved height gap with a finite Kummer quotient for some integer m ≥ 2. Then bound ramification of the minimal fields of definition of bounded-height classes.',
    output: 'A common finite-rank lattice and real positivity give fixed-field Northcott; the additional ramification control gives bounded-degree Northcott. Positive definiteness alone does not give either finiteness assertion.',
    depends: 'The residual quadratic height and integral image from the arithmetic programme. Integral control and field control are separate requirements.',
    records: ['OPEN-RESIDUAL-NC', 'OPEN-INTEGRAL-LATTICE', 'OPEN-CLASS-RAMIFICATION', 'R2-F2'],
    paper: '/papers/strong-g-programme#sec:programme-northcott',
  },
];
