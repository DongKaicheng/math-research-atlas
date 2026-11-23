// Minimum retained proof coverage for the current reading diagrams.
// Initial inventory: 6e571fa97ed5739624bd555c7665bc5f0da88e95 (108 trees).
// Reviewed 18 November 2026 expansion: five H16 proof units, native good
// reduction, native positive-host and finite-extension arguments, and the
// uniform ample-boundary curve gate (117 trees total).
// The 23 November 2026 construction update adds the precise Hypothesis 2.2
// source to the seven cases whose prescribed-pair or Chow-class input it supplies.
// All previous proof units and source receipts remain required.
// This explicit list is independent of candidate graph data. It records
// published proof units and their source receipts, not mathematical acceptance.
// Add reviewed trees and sources here when extending the protected minimum;
// additional valid trees and bindings remain allowed before that update.
const requirements = {
  "kernel-domain": {
    "treeIds": [
      "proof-kernel-domain-local-tree",
      "proof-kernel-domain-assembly-tree",
      "proof-kernel-domain-absolute-tree",
      "proof-kernel-domain-finite-base-change-tree",
      "proof-kernel-domain-point-residue-tree",
      "proof-kernel-domain-proper-slice-tree",
      "proof-kernel-domain-principal-transport-tree",
      "proof-kernel-domain-chow-descent-tree"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.2/source-files/companion/chow-obstruction-green-pairs.tex",
      "public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/papers/global-height-pairing.tex"
    ]
  },
  "algebraically-trivial": {
    "treeIds": [
      "proof-algebraically-trivial-local-tree",
      "proof-algebraically-trivial-compact-tree",
      "proof-algebraically-trivial-global-tree"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.2/source-files/companion/chow-obstruction-green-pairs.tex",
      "public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/green-draft/algebraic_equivalence.tex",
      "public/projects/strong-green/editions/v0.5.1/papers/green-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/foundations/R12_compact_parameter_algebraic_triviality.tex"
    ]
  },
  "endpoints": {
    "treeIds": [
      "proof-endpoints-domains-tree",
      "proof-endpoints-divisor-tree",
      "proof-endpoints-zero-cycle-tree",
      "proof-endpoints-algebraic-endpoint-tree",
      "proof-endpoints-one-cycle-tree",
      "proof-endpoints-model-tree"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.2/source-files/companion/chow-obstruction-green-pairs.tex",
      "public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/papers/green-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/foundations/R12_compact_parameter_algebraic_triviality.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/foundations/R12_curve_lifts_and_actual_green.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/foundations/R16_one_cycles_and_dominant_activation.tex"
    ]
  },
  "individual-certificates": {
    "treeIds": [
      "proof-individual-certificates-global-tree",
      "proof-individual-certificates-numerical-tree",
      "proof-individual-certificates-finite-tests-tree",
      "proof-individual-certificates-ci-tree",
      "proof-individual-certificates-ci-certificates-tree"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/foundations/R17_finite_actual_tests_and_height_obstruction_quotients.tex"
    ]
  },
  "abelian-retracts": {
    "treeIds": [
      "proof-abelian-retracts-tree-transfer",
      "proof-abelian-retracts-tree-abelian-model",
      "proof-abelian-retracts-tree-images",
      "proof-abelian-retracts-tree-curves",
      "proof-abelian-retracts-tree-binary",
      "proof-abelian-retracts-tree-cubics",
      "proof-abelian-retracts-tree-cyclic",
      "proof-abelian-retracts-tree-forms"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.2/source-files/companion/chow-obstruction-green-pairs.tex",
      "public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex"
    ]
  },
  "surface-products": {
    "treeIds": [
      "proof-surface-products-tree-products",
      "proof-surface-products-tree-good-reduction",
      "proof-surface-products-tree-deletion",
      "proof-surface-products-tree-inverse",
      "proof-surface-products-tree-envelope",
      "proof-surface-products-tree-hilbert",
      "proof-surface-products-tree-moduli"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.2/source-files/companion/chow-obstruction-green-pairs.tex",
      "public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/pairing-cases/sections/products_moduli.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/products/inertia/all_factor_deletion_and_core_exactness.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/products/families/surface_incidence_inverse_and_good_coefficients.tex",
      "public/projects/strong-green/editions/v0.5.1/papers/green-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/foundations/R12_compact_parameter_algebraic_triviality.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/foundations/R11_curvature_class_and_next_step.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/foundations/R11_supported_complex_green.tex"
    ]
  },
  "small-support": {
    "treeIds": [
      "proof-small-support-tree-diagonal",
      "proof-small-support-tree-universal",
      "proof-small-support-tree-rationally-connected",
      "proof-small-support-tree-unirational",
      "proof-small-support-tree-closures",
      "proof-small-support-tree-uniruled"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/pairing-cases/sections/endpoints_support.tex"
    ]
  },
  "chow-niveau": {
    "treeIds": [
      "proof-chow-niveau-tree-residual",
      "proof-chow-niveau-tree-criterion",
      "proof-chow-niveau-tree-chow-bounds",
      "proof-chow-niveau-tree-complete-intersections",
      "proof-chow-niveau-tree-fibration-criterion",
      "proof-chow-niveau-tree-fiber-applications",
      "proof-chow-niveau-tree-quadrics",
      "proof-chow-niveau-tree-relative-quadrics"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/pairing-cases/sections/niveau_fibrations.tex"
    ]
  },
  "numerical-models": {
    "treeIds": [
      "proof-numerical-models-assembly-tree",
      "proof-numerical-models-scalar-tree",
      "proof-numerical-models-two-factor-tree",
      "proof-numerical-models-positive-tree",
      "proof-numerical-models-symmetry-tree"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/pairing-cases/sections/models_families.tex"
    ]
  },
  "reduction-strata": {
    "treeIds": [
      "proof-reduction-strata-assembly-tree",
      "proof-reduction-strata-ordinary-tree",
      "proof-reduction-strata-characteristic-two-tree",
      "proof-reduction-strata-strata-tree",
      "proof-reduction-strata-repair-tree",
      "proof-reduction-strata-drinfeld-tree",
      "proof-reduction-strata-degenerate-tree",
      "proof-reduction-strata-degenerate-detection-tree"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.2/source-files/companion/chow-obstruction-green-pairs.tex",
      "public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/pairing-cases/sections/models_families.tex"
    ]
  },
  "arithmetic-families": {
    "treeIds": [
      "proof-arithmetic-families-assembly-tree",
      "proof-arithmetic-families-pencils-tree",
      "proof-arithmetic-families-pencil-field-tree",
      "proof-arithmetic-families-density-tree",
      "proof-arithmetic-families-hypersurfaces-tree",
      "proof-arithmetic-families-hypersurface-profile-tree",
      "proof-arithmetic-families-complete-intersections-tree",
      "proof-arithmetic-families-product-ambients-tree",
      "proof-arithmetic-families-positive-host-tree",
      "proof-arithmetic-families-positive-host-positivity-tree",
      "proof-arithmetic-families-positive-host-ramified-tree",
      "proof-arithmetic-families-positive-host-curve-gate-tree",
      "proof-arithmetic-families-elliptic-preparation-tree",
      "proof-arithmetic-families-elliptic-families-tree"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.2/source-files/companion/chow-obstruction-green-pairs.tex",
      "public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/pairing-cases/sections/models_families.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/models/r22/geometry/positive_fourfold_suspensions_and_quintuple_models.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/models/r18/u2/ramified_base_change_of_positive_fourfold_models.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/families/r22/geometry/supplied_positive_hosts_and_projective_bundle_height_families.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/families/r22/geometry/abelian_hosts_and_general_suspension_height_families.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/models/r16/model_obstruction/positive_fourfold_component_activation.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/models/r18/u2/inertial_triviality_and_ramified_norm_detection.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/foundations/R17_finite_actual_tests_and_height_obstruction_quotients.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/companion/proofs/foundations/R17_vertical_tests_and_strong_green_necessity.tex"
    ]
  },
  "classical-comparison": {
    "treeIds": [
      "proof-classical-comparison-overview-tree",
      "proof-classical-comparison-moving-tree",
      "proof-classical-comparison-adjunction-tree",
      "proof-classical-comparison-motivic-tree",
      "proof-classical-comparison-vertical-tree",
      "proof-classical-comparison-cartier-tree",
      "proof-classical-comparison-framed-tree",
      "proof-classical-comparison-euler-tree",
      "proof-classical-comparison-local-tree",
      "proof-classical-comparison-global-tree",
      "proof-classical-comparison-alteration-tree",
      "proof-classical-comparison-recursion-tree",
      "proof-classical-comparison-metric-overview-tree",
      "proof-classical-comparison-quillen-tree",
      "proof-classical-comparison-deligne-tree",
      "proof-classical-comparison-cycle-metric-tree",
      "proof-classical-comparison-good-metric-tree"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.1/papers/pairing-constructions.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/global-height/ha16-correspondence_adjunction_and_motivic_height.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/global-height/mm16-regular_admissible_model_comparison.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/height-r2/sections/determinants.tex",
      "public/projects/strong-green/editions/v0.5.1/papers/determinant-metrics.tex"
    ]
  },
  "arithmetic-properties": {
    "treeIds": [
      "proof-arithmetic-properties-programme-tree",
      "proof-arithmetic-properties-chow-blocks-tree",
      "proof-arithmetic-properties-square-zero-tree",
      "proof-arithmetic-properties-lefschetz-tree",
      "proof-arithmetic-properties-primitive-tree",
      "proof-arithmetic-properties-propagation-tree",
      "proof-arithmetic-properties-visible-projector-tree",
      "proof-arithmetic-properties-invisible-tree",
      "proof-arithmetic-properties-residual-tree",
      "proof-arithmetic-properties-visible-integral-tree",
      "proof-arithmetic-properties-central-northcott-tree",
      "proof-arithmetic-properties-package-directions-tree",
      "proof-arithmetic-properties-regulator-tree",
      "proof-arithmetic-properties-weight-cohomology-tree",
      "proof-arithmetic-properties-integral-regulator-tree",
      "proof-arithmetic-properties-northcott-real-tree",
      "proof-arithmetic-properties-lattice-tree",
      "proof-arithmetic-properties-all-prime-tree",
      "proof-arithmetic-properties-weak-mordell-weil-tree",
      "proof-arithmetic-properties-class-trace-tree",
      "proof-arithmetic-properties-fields-tree",
      "proof-arithmetic-properties-arithmetic-barriers-tree"
    ],
    "sourceFiles": [
      "public/projects/strong-green/editions/v0.5.1/source-files/height-r2/sections/setup.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/height-r2/sections/lefschetz.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/height-r2/sections/central_northcott.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/height-r2/sections/regulators.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/height-r2/sections/lattices.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/height-r2/sections/fields.tex",
      "public/projects/strong-green/editions/v0.5.1/source-files/height-r2/sections/program.tex"
    ]
  }
};

for (const item of Object.values(requirements)) {
  Object.freeze(item.treeIds);
  Object.freeze(item.sourceFiles);
  Object.freeze(item);
}
export const progressProofRequirements = Object.freeze(requirements);

