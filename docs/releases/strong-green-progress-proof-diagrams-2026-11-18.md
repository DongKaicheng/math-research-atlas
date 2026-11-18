# Progress result and proof diagrams — 18 November 2026

Project: Beilinson–Bloch Heights and the Strong Zero-Curvature Green Conjecture.

Mathematical source edition: **v0.5.1**, unchanged. This publication adds a
source-bound graphical reading of the existing results and their available
proofs. It does not accept, strengthen, or reclassify a mathematical result.

## Reading pages

The current project has a separate `/results/proof-diagrams/` page containing
all the proof trees, fully expanded, and an independent page beneath it for
each of the 13 Progress result families:

- `kernel-domain`
- `algebraically-trivial`
- `endpoints`
- `individual-certificates`
- `abelian-retracts`
- `surface-products`
- `small-support`
- `chow-niveau`
- `numerical-models`
- `reduction-strata`
- `arithmetic-families`
- `classical-comparison`
- `arithmetic-properties`

Every one of the 32 applications already listed in Progress has a drawn
destination and a direct anchor from its Progress paragraph. The homepage,
project navigation, overall research map, Progress introduction, and each
individual result link to the new reading pages. Each diagram also provides
its own standalone, hyperlinked SVG.

The complete view contains **105 proof trees, 777 scoped node occurrences,
247 logical junctions and 1,121 drawn connections**. These are graph counts,
not claims of that many independent theorems. Shared inputs are repeated with
the scope of their actual use.

## Logical and source contract

The data under `strong-green/views/content/progress-proof-*.mjs` are derived
reading views. They retain the original result IDs and link to existing paper
statements and proof sections. Local intermediate steps do not become new
permanent theorem records.

Inputs are grouped through ALL gates, alternative complete arguments through
ANY gates, and an IFF applies to its entire displayed premise bundle. An open
inference remains marked OPEN. A blocked argument does not acquire an arrow
to its target. Definitions and ambient data are separated from proof premises.

The diagrams preserve the distinction between a complete geometric deduction
under stated analytic hypotheses and independent acceptance of those analytic
inputs. They retain both complementary cycle degrees, original support and
test requirements, Chow rather than cohomological identities, and field and
cover degree normalizations wherever used. A proof diagram is not a new proof
certificate.

Exact public source files are bound by SHA-256 and source locators. The Progress
inventory is also bound by hash. The build refuses stale source bindings,
missing cases, missing applications, invalid record IDs and status overrides.
A future source revision therefore requires review of the corresponding graph
instead of silently reusing it.

The supplied public endpoint corpus includes the full one-cycle correction
and descent argument. The divisor and zero-cycle assertions are cited as
inputs in `prop:endpoint-input`; their separate full proof bodies were not
located in that corpus. The graph therefore marks those two assertions as
imported hypotheses and does not reconstruct or invent absent proofs.

Source-fidelity cross-review corrected the operational Chow pullback wording,
the finite Galois extension used by the norm-family construction, and the
precise MM16 testing support, top-degree polynomial and zero archimedean
curvature requirements. Product-model candidates, analytic hypotheses and
open arithmetic conditions retain their source status.

## History and feedback

No frozen source, PDF, paper text, release directory or historical snapshot is
rewritten. These reading pages are current-only; Git retains the diagram and
layout revisions. The existing shared feedback board receives the actual
diagram page URL, a valid linked diagram fragment, and mathematical source
edition. The fragment is page context, not a new theorem ID. No second inbox, public
write API, reader edit permission or recurring job is created.

## Verification

The working branch was reconciled with the remote base
`c5965eac8785058580132acc3cc6c697486dca76`, preserving the separately published
Bedford–Taylor logical map, its live verification record, and the shared
maintenance guide. Checks completed on the combined source:

- `npm ci`, `npm run build`, and all **94** repository tests passed.
- The build generated **768 page routes** across the existing three projects.
- Release checks verified **340** Strong Green frozen files, and the existing
  Bedford–Taylor release inventory, source bindings, PDFs and ZIP members.
- The append-only history check passed against the exact remote base above.
- Every new independent page and the aggregate SVG passed link, anchor,
  coverage, source-fingerprint and unsigned-publication checks.
- Inkscape's actual rendered bounding boxes were checked across all 14 new
  SVG files: **1,554** node occurrences and **494** junction occurrences,
  counting the aggregate and independent copies. No box overflow was found.
  Representative core, surface-model and arithmetic-barrier regions were
  rendered and visually inspected. This is vector-layout QA, not browser
  viewport verification.
- The shared-feedback controller was tested to retain an existing diagram
  fragment as page context, clear invalid fragments, and preserve the project
  and mathematical edition without inventing a theorem ID.

Production deployment and browser interaction checks are performed after the
published commit is deployed; their observed outcome is reported in the
publication handoff. These checks concern publication consistency and source
fidelity, not independent certification of every underlying mathematical proof.
