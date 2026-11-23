// A reading tree over the current edition, not a second result register.
// Titles, summaries and mathematical statuses are read from bundle.json.
// Membership expresses a topic; proof dependencies remain in the records.
export const researchBranches = [
  {
    id: 'local-green', title: 'Local Green forms',
    description: 'Construct actual Green forms on the prescribed support complement.',
    scope: 'The local problem uses the original valued field, ordinary actual forms and every compact complementary actual test. Finite descent retains the full field degree.',
    plan: ['analytic', 'source'],
    links: [{ href: '/papers/green-constructions', label: 'Green constructions and transfer' }],
    groups: [
      { id: 'local-target', title: 'The local setting and conjecture', records: ['BB-LOCAL-DATA', 'STRONG-G'] },
      { id: 'green-pairs', title: 'Green pairs, trace and curvature', records: ['BB-MODEL-DETECTOR', 'BB-RESTRICTED-TRACE', 'BB-SUPPORTED-GREEN-PAIR', 'BB-ACTUAL-OBSTRUCTION', 'BB-GREEN-CORRECTION'] },
      { id: 'algebraic-equivalence', title: 'Algebraically trivial cycles', records: ['BB-COMPACT-RIGIDITY', 'BB-RATIONAL-FIBRE-RIGIDITY', 'BB-ALG-TRANSFER'] },
      { id: 'abelian-transfer', title: 'Abelian varieties and Chow transfer', records: ['BB-FINITE-NUMERICAL-DESCENT', 'BB-ABELIAN-STAGE', 'BB-MOTIVIC-TRANSFER'] },
      { id: 'curve-products', title: 'Products of curves', records: ['BB-CURVE-CHOW-DIAGONAL', 'BB-REGULAR-PRODUCT-MODELS', 'BB-REGULAR-CHOW-CRITERION', 'BB-CURVE-PRODUCT-DRAFT'] },
      { id: 'local-open', title: 'The remaining general case', records: ['BB-ANALYTIC-INTERFACE', 'BB-RESIDUAL-PERIODS', 'BB-TROPICAL-INTERFACE'] },
    ],
  },
  {
    id: 'global-heights', title: 'Global height pairings',
    description: 'PH16 constructs the full pairing from Strong G; the obstruction route gives a second account of its domain.',
    scope: 'Within the stated analytic foundations, PH16 (Theorem 7.5) constructs the full height from Strong G at every finite completion in both complementary codimensions. The kernel-domain route instead enlarges its pairing by proving local obstruction vanishing in both degrees. These are separate sufficient routes; the direct theorem does not require vanishing of a preselected obstruction.',
    plan: ['global'],
    links: [{ href: '/papers/global-height-pairing#r16ph:general-height', label: 'Strong G gives the full height: Theorem 7.5' }, { href: '/papers/global-height-pairing', label: 'The global construction' }, { href: '/papers/pairing-constructions', label: 'Geometric pairing domains' }],
    groups: [
      { id: 'pairing-domain', title: 'The pairing and its domain', records: ['BB-H16-KERNEL-DOMAIN', 'BB-GLOBAL'] },
    ],
    routes: true,
    pairingCases: true,
  },
  {
    id: 'chow-positivity', title: 'Chow groups and positivity',
    description: 'Decompose the Chow groups and isolate the arithmetic conjectures.',
    scope: 'The height identities use the curve-normalized axioms H1–H4 on the stated pointed products, subproducts, source curves of correspondences and finite extensions. The Lefschetz result is an equivalence with off-central vanishing.',
    plan: ['arithmetic'],
    links: [{ href: '/papers/arithmetic-reductions', label: 'Arithmetic reductions and proofs' }, { href: '/entries/OPEN-REAL-POSITIVITY', label: 'Related: residual real positivity' }],
    groups: [
      { id: 'height-setting', title: 'Central Chow components and height axioms', records: ['BB-CENTRAL-DATA', 'BB-HEIGHT-DATA'] },
      { id: 'chow-decompositions', title: 'Chow decompositions and Lefschetz theory', records: ['BB-CHOW-PROJECTOR', 'R2-L1', 'OPEN-OFFCENTRAL'] },
      { id: 'central-heights', title: 'Central heights and the residual pairing', records: ['OPEN-AJ-KERNEL', 'BB-RESIDUAL-PAIRING', 'R2-L2', 'R2-L3'] },
    ],
  },
  {
    id: 'integral-northcott', title: 'Integral Northcott',
    description: 'Control integral cycle classes, their heights and their fields of definition.',
    scope: 'The objects being counted are projected integral cycle classes. Real positivity, a common integral lattice and control of the fields of definition are separate parts of the finiteness problem.',
    plan: ['finiteness'],
    links: [{ href: '/papers/arithmetic-conjectures', label: 'The arithmetic conjectures' }, { href: '/papers/arithmetic-reductions', label: 'Finiteness criteria and proofs' }],
    groups: [
      { id: 'northcott-target', title: 'Finiteness and real positivity', records: ['BB-INTEGRAL-IMAGE', 'OPEN-RESIDUAL-NC', 'R2-N1', 'OPEN-REAL-POSITIVITY', 'R2-N2'] },
      { id: 'regulators', title: 'Arithmetic regulators and detection', records: ['R2-R1', 'R2-R2', 'R2-R3', 'OPEN-SCALAR-DETECTION'] },
      { id: 'integral-control', title: 'Integral control over a fixed field', records: ['OPEN-INTEGRAL-LATTICE', 'R2-N3', 'R2-N4', 'R2-N5', 'BB-DENOMINATOR-EXAMPLE'] },
      { id: 'varying-fields', title: 'Varying the field', records: ['R2-F1', 'R2-F2', 'OPEN-CLASS-RAMIFICATION', 'OPEN-DISCRIMINANT'] },
    ],
  },
  {
    id: 'metrics-families', title: 'Metrics and families',
    description: 'Compare normalized metrics and study degeneration and height variation.',
    scope: 'The determinant comparisons retain the stated normalization and model hypotheses. Bad reduction and height estimates in families are further research problems.',
    plan: ['comparison'],
    links: [{ href: '/papers/determinant-metrics', label: 'Determinant metrics and comparisons' }],
    groups: [
      { id: 'determinant-metrics', title: 'Normalized determinant metrics', records: ['R2-M1', 'R2-M2', 'R2-M3'] },
      { id: 'degeneration', title: 'Degeneration and variation', records: ['OPEN-BAD-REDUCTION-METRIC', 'BB-FAMILY-HEIGHTS'] },
    ],
  },
];

// Fail the build if a later edition adds or removes a record without updating
// the reading tree. Each permanent record has exactly one primary placement.
export function validateResearchMap(entries, branches = researchBranches) {
  const known = new Set(entries.map(entry => entry.id));
  const used = new Set();
  const anchors = new Set();
  for (const branch of branches) {
    for (const node of [branch, ...branch.groups]) {
      if (anchors.has(node.id)) throw new Error('Repeated research-map anchor: ' + node.id);
      anchors.add(node.id);
    }
    for (const group of branch.groups) for (const id of group.records) {
      if (!known.has(id)) throw new Error('Unknown research-map record: ' + id);
      if (used.has(id)) throw new Error('Repeated research-map record: ' + id);
      used.add(id);
    }
  }
  const missing = entries.filter(entry => !used.has(entry.id)).map(entry => entry.id);
  if (missing.length) throw new Error('Records missing from the research map: ' + missing.join(', '));
}
