// Reading-order metadata. The formal statements and their evidence states
// remain in bundle.json; these summaries do not replace the source records.

export const conjectureFamilies = [
  {
    id: "strong-g", number: "01", title: "Strong G: actual local Green forms",
    lead: "Construct a zero-curvature Green form for a homologically trivial cycle on its prescribed support complement, over the original non-Archimedean field.",
    principal: "STRONG-G", paper: "/papers/strong-g-programme",
    scope: "Ordinary actual forms; every compact complementary actual test; the original absolute value and full finite-extension degree.",
    branches: [
      { title: "The original cycle source", relation: "Obstruction problem", text: "Under the detector and reconstruction hypotheses, annihilate the image of the original Chow source in the residual period dual.", records: ["BB-RESIDUAL-PERIODS"] },
      { title: "Actual realization", relation: "Analytic prerequisites", text: "Verify finite traces and exact-support Green pairs, and construct the required primitives in the full actual complex.", records: ["BB-ANALYTIC-INTERFACE", "BB-TROPICAL-INTERFACE"] },
    ],
    implication: "The recorded analytic package turns source-obstruction vanishing into the exact-support Green identity. Algebraic equivalence and abelian Chow retractions are two conditional routes for particular cycle sources.",
    obstacle: "The general source-image vanishing theorem and the version-bound certification of its actual analytic interfaces.",
  },
  {
    id: "global-heights", number: "02", title: "Canonical global height pairings",
    lead: "Assemble the local theory into a canonical Beilinson–Bloch pairing on the complete complementary homologically trivial Chow groups.",
    principal: "BB-GLOBAL", paper: "/papers/strong-g-programme",
    scope: "The global sum, normalization, correspondence adjunction, and independence of representatives belong to the construction.",
    branches: [
      { title: "The admitted global kernel", relation: "Intermediate domain", text: "H16 assembles the pairing on the intersection of local obstruction kernels. A fixed FD17 witness is an additional finite-detector presentation. Vanishing on localized global classes in both complementary degrees enlarges the domain.", records: ["BB-H16-KERNEL-DOMAIN", "BB-HEIGHT-DATA"] },
      { title: "Metrics and variation", relation: "Further research questions", text: "Compare admissible corrections at bad reduction, then identify the geometric input for height domination and boundary estimates in families.", records: ["OPEN-BAD-REDUCTION-METRIC", "BB-FAMILY-HEIGHTS"] },
    ],
    implication: "Source-obstruction vanishing supplies strong Green forms. With the principal-push and assembly hypotheses, strong Green forms in complementary degrees give the global pairing. The weaker target of vanishing only on localized global classes is useful in its own right.",
    obstacle: "A complete source-bound assembly/comparison theorem on the desired domain. Positivity and finiteness are separate arithmetic targets below.",
  },
  {
    id: "lefschetz-positivity", number: "03", title: "Lefschetz theory and central positivity",
    lead: "Reduce the structure of a pointed product of curves to its odd central Chow components, the algebraic Abel–Jacobi kernel, and the residual height.",
    principal: "OPEN-OFFCENTRAL", paper: "/papers/arithmetic-conjectures",
    scope: "All subproducts and finite extensions, with the fixed anchored product polarization. Height statements use H1–H4.",
    branches: [
      { title: "The algebraic radical", relation: "Independent central assertion", text: "Ask that the rational Abel–Jacobi map be injective on the central algebraically trivial part.", records: ["OPEN-AJ-KERNEL"] },
      { title: "Primitive height inequalities", relation: "Consequences with central positivity and H1–H4", text: "The central-block identity propagates positivity to primitive height forms and their inequalities. Residual positivity is grouped below under the stronger Northcott conjecture.", records: ["R2-L2"] },
    ],
    implication: "Off-central vanishing is equivalent to arithmetic hard Lefschetz. With H1–H4, algebraic AJ injectivity and residual positivity supply full central positivity; adding off-central vanishing gives primitive positivity and complementary nondegeneracy.",
    obstacle: "Chow-level off-central vanishing, the algebraic AJ kernel, and residual real positivity are distinct assertions. The equivalence theorem organizes them without assuming their truth.",
  },
  {
    id: "northcott", number: "04", title: "Northcott and arithmetic detection",
    lead: "Prove finiteness of classes in the projected integral image when the field degree and the residual quadratic height are bounded.",
    principal: "OPEN-RESIDUAL-NC", paper: "/papers/arithmetic-conjectures",
    scope: "Count classes in the fixed rational quotient, using images of integral cycles and controlled denominators.",
    branches: [
      { title: "Real residual positivity", relation: "A necessary consequence of Northcott", text: "Finiteness of integral height balls forces positive definiteness after real scalar extension over every fixed number field. This weaker statement is part of the Northcott conjectural hierarchy, not a second independent finiteness claim.", records: ["OPEN-REAL-POSITIVITY", "R2-N2"] },
      { title: "Over a fixed number field", relation: "Detection and discreteness", text: "Scalar-extended regulator injectivity gives a finite-rank route. A common rational lattice, or a genuine height gap with finite Kummer quotients, supplies integral control.", records: ["OPEN-SCALAR-DETECTION", "OPEN-INTEGRAL-LATTICE"] },
      { title: "As the field varies", relation: "Additional field control", text: "Bound ramification of the minimal fields of bounded-height classes. A discriminant–height inequality is a stronger quantitative question.", records: ["OPEN-CLASS-RAMIFICATION", "OPEN-DISCRIMINANT"] },
    ],
    implication: "Residual Northcott implies real positivity. Conversely, real positivity plus an integral lattice gives fixed-field Northcott; fixed-field Northcott over all finite fields plus class-field ramification control gives bounded-degree Northcott.",
    obstacle: "One-prime detection and separate local lattices do not supply a common denominator. Fixed-field arithmetic alone does not control the varying class fields.",
  },
];

export const resultFamilies = [
  {
    id: "green-constructions", number: "I", title: "Green constructions and transfer",
    lead: "A global actual primitive removes the curvature of a prescribed Green pair. Geometric arguments then address algebraically trivial classes and abelian Chow retracts under their stated analytic inputs.",
    principal: "BB-GREEN-CORRECTION", paper: "/papers/green-constructions",
    premise: "A prescribed exact-support Green pair, together with vanishing of its actual Bott–Chern obstruction.",
    mechanism: "Subtract the restriction of a global actual curvature primitive. The domain of the original Green pair is unchanged.",
    consequences: [
      { title: "Algebraically trivial cycle classes", relation: "With the companion package (A1)–(A2) and parameter rigidity", text: "Curve generation and compact parameters annihilate the obstruction. Curvature correction gives a zero-curvature form for the specified representative.", record: "BB-ALG-TRANSFER" },
      { title: "Abelian Chow retracts", relation: "Parallel transfer route; requires (A1), (A2), (N), (C), and a potential abelian Chow retraction", text: "The abelian numerical input and the actual Chow diagonal transport source vanishing, with finite-degree descent over the original field.", record: "BB-MOTIVIC-TRANSFER" },
      { title: "Products of curves", relation: "Draft application through the recorded analytic and regular-model chain", text: "The draft combines a Chow-diagonal factorization with the abelian stage and compatible regular models.", record: "BB-CURVE-PRODUCT-DRAFT" },
    ],
    support: ["BB-MODEL-DETECTOR", "BB-RESTRICTED-TRACE", "BB-SUPPORTED-GREEN-PAIR", "BB-ACTUAL-OBSTRUCTION", "BB-CURVE-CHOW-DIAGONAL"],
    obstacle: "The analytic building blocks retain their draft or conditional status. General strong G still requires vanishing on the original homologically trivial source.",
  },
  {
    id: "arithmetic-reductions", number: "II", title: "Arithmetic structure and finiteness",
    lead: "For an anchored product of curves, exact Chow decompositions and height identities reduce arithmetic Lefschetz and primitive Northcott to central residual assertions.",
    principal: "R2-L3", paper: "/papers/arithmetic-reductions",
    premise: "A curve-normalized height system H1–H4 on the fixed pointed product, its subproducts, and their finite field extensions.",
    mechanism: "The product package is equivalent to off-central vanishing, central algebraic AJ injectivity, and residual integral Northcott on all relevant subproducts.",
    consequences: [
      { title: "Primitive positivity and nondegeneracy", relation: "If either equivalent conjectural package holds", text: "The central forms become real positive definite. The primitive sum-of-squares identity gives positivity, Cauchy–Schwarz, and nondegeneracy of complementary height pairings.", record: "R2-L2" },
      { title: "The central Northcott criterion", relation: "An ingredient of the equivalence, under H1–H4", text: "Central integral Northcott is equivalent to vanishing of the algebraic AJ kernel together with residual integral Northcott.", record: "R2-N1" },
      { title: "From one field to bounded degree", relation: "A parallel criterion; assumes fixed-field Northcott over every finite field", text: "Bounded-degree Northcott is equivalent to finite ramification control of the minimal fields of bounded-height classes.", record: "R2-F2" },
    ],
    support: ["R2-L1", "BB-CHOW-PROJECTOR", "BB-RESIDUAL-PAIRING", "R2-N2", "R2-R1", "R2-R2", "R2-R3", "R2-N3", "R2-N4", "R2-N5", "R2-F1"],
    obstacle: "The reduction theorem proves an equivalence, not the conjectural packages. Regulator injectivity, global integral discreteness, and class-field control remain distinct inputs.",
  },
  {
    id: "determinant-metrics", number: "III", title: "Determinants and metrized comparison",
    lead: "Rigidification at the origin fixes the normalization of determinant metrics on Jacobian families and makes their relation to Poincaré and Deligne metrics precise.",
    principal: "R2-M1", paper: "/papers/determinant-metrics",
    premise: "The normalized determinants on a complex Jacobian family, formed with the product Kähler metrics and hermitian perfect complexes specified in the source.",
    mechanism: "The projection formula identifies the line bundles. Equality of curvature and the unit norm at the origin give the exact rigidified isometry.",
    consequences: [
      { title: "Deligne pairings and cycle determinants", relation: "Add virtual rank zero; for cycles, use the specified filtered K-theory lifts", text: "The normalized determinant agrees isometrically with the Deligne pairing. Filtered Riemann–Roch identifies the degree-zero divisor class supplied by the transpose correspondence.", record: "R2-M2" },
      { title: "The good-reduction comparison", relation: "Parallel non-Archimedean statement on a smooth proper source-curve model", text: "For generic virtual rank zero and determinant degree zero, the normalized model metric is the canonical rigidified Poincaré metric.", record: "R2-M3" },
    ],
    support: [],
    obstacle: "Bad reduction calls for admissible vertical corrections. Boundary estimates in families require their own geometric and cohomological hypotheses.",
  },
];

export { programmeSteps, programmeOverview, programmeImplications } from './programme.mjs';

export const readingPaths = [
  { number: "01", title: "The conjectural programme", text: "The two principal questions, their motivation, and the exact local-to-global interfaces.", href: "/papers/strong-g-programme", label: "Strong G and BB heights" },
  { number: "02", title: "The arithmetic questions", text: "Central Chow components, the Abel–Jacobi radical, positivity, and integral finiteness.", href: "/papers/arithmetic-conjectures", label: "Arithmetic conjectures" },
  { number: "03", title: "The arguments", text: "Source-linked constructions, reduction theorems, and normalized metric comparisons.", href: "/papers", label: "The research papers" },
];
