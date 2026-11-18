# Bedford–Taylor logical research map

Prepared: 18 November 2026, 19:18:57 Asia/Shanghai
(2026-11-18T11:18:57Z).

Atlas project revision: 3. Mathematical source edition: v1.0.1.
Publication and live deployment verification: pending.

## Change

The current `/projects/bedford-taylor/map/` now shows the
logical relationships between results, hypotheses, obstructions and open
tasks. The independent homepage and project-navigation entry remain the entry
points. The complete earlier thematic register remains available as a
secondary reading index, with all 74 topics, 14 formal programme items and 26
definition groups.

The reviewed data contains three logical sections, 17 diagram panels,
93 nodes and 76 typed relations. These are presentation counts, not counts of
new theorems. The source index is
`content/bedford-taylor/research-logic.json`; the three components are
`logic-core.json`, `logic-descent.json` and `logic-energy.json` in that
directory. They distinguish deductions, equivalences, proof inputs,
specializations, open steps and obstructions. Multiple inputs to one relation
mean AND; alternative sufficient routes to the same conclusion mean OR.
Every relation retains its additional hypotheses, mathematical mechanism and
links to the exact source evidence. Open questions without an established
incoming inference retain their own linked context.

Every one of the 74 source topic records appears in a logical node; all 14
formal programme items retain their open status and exact references.

The three sections cover:

1. Bounded calculus, curvature relations and relative capacity. The
   bounded-difference criterion remains a separate analytic input. Pointwise
   domination and uniqueness retain the additional strict-gap detection
   requirement after the capacity-zero conclusions. Separate panels trace the
   projective curve criterion and its envelope inputs, continuous moving
   backgrounds, specified etale tuples, current modules, parameter bands and
   the qualified ambient Choquet theorem.
2. Actual-relation descent and the normal-three center. Exactness,
   fixed-control approximation and full-carrier certificates retain their
   different sufficient ranges. Punctured vanishing and the protected tangent
   estimates jointly give the central residual formula. Universal cancellation
   remains open, and the supplied model does not imply general-germ or
   higher-degree descent by itself.
3. Energy completion, equations and further applications. The map retains the
   distinctions between completion, source compatibility, actual classical
   representatives and the additional hypotheses needed by later applications. Additional panels give scalar level currents,
   relative envelopes, the critical and duality obstructions, parameter and
   radial inverses, and clamped and interface source graphs.

Clickable SVG diagrams and their `.dot` sources are checked in under
`content/bedford-taylor/logic-diagrams/`. Their manifest binds the selected
edition, panel data, renderer and shared logical-schema module to the generated SVG by SHA-256. The
`npm run build:bt-logic` command regenerates diagrams with Graphviz. The
ordinary website build consumes and validates the checked-in artifacts without
requiring Graphviz.

## Source review and mathematical scope

The logical relations were read against the actual TeX statements and proofs,
including the mature paper and research programme, rather than inferred from
topic membership or result titles. Source cross-review checked the descent
certificates, the rank-two construction and union-tuple restriction, the
carrier detector's range, the ordinary punctured cover, point-supported
Radon currents, protected transposition, leading-energy estimates,
compatible-PS tangent passage, spherical residual formula and fixed-domain
weak background closure. The descent component's 85 source links and anchors
were checked, and its established/conditional implication graph was checked
for cycles. A separate source readback checked the core distinction between
the bounded calculus and the adopted difference criterion, and between
capacity-zero conclusions and conditional pointwise conclusions.

These checks concern source fidelity and the precision of the displayed
relationships. They do not constitute new independent proof acceptance.
No theorem, proof, definition, source status or formal programme status is
changed. All 14 formal programme items remain open. The mathematical edition
stays v1.0.1; existing frozen editions, source receipts, paper sources and PDF
bytes are unchanged. The publication remains unsigned.

Feedback continues through the existing shared Issue board. Contextual
feedback keeps the actual map page and its exact fragment together with the
mathematical edition. Diagram and relation anchors are page context, not newly
assigned result IDs. General comments continue to require no result or edition.
Each relation includes a contextual “Discuss this logical step” link to that
same board. Current proof links are accompanied by immutable v1.0.1 source
links. No second feedback inbox is introduced.

The exact previous Atlas project bundle is retained as
`content/history/bedford-taylor/v2.json`; the current project revision becomes
3. Git retains the logical data and diagram history, while the existing fixed
mathematical edition retains the source and PDF history. Maintenance guidance
now describes diagram regeneration, input binding, semantic review and the
shared feedback workflow.

## Verification

The following local results were observed on the final integrated tree, which
preserves the concurrent site updates through commit
`761e08386e0ef1144f002df6f9e58b2c2aa285ca`. Live deployment is checked after the
non-force branch update.

| Check | Status |
| --- | --- |
| `npm ci` and logical-diagram regeneration through `npm run build:bt-logic` | Passed: clean install and 17 regenerated SVG diagrams |
| `npm run build`, including source binding, SVG hashes and ordinary-build independence from Graphviz | Passed: 754 routes, 3 projects and 128 permanent entries; ordinary build reads checked-in SVGs |
| `npm run check` | Passed: all 84 tests, including complete record coverage, typed arrows, exact feedback and rejection of a stale diagram after removing the zero-defect premise |
| `npm run check:release` for both mathematical projects | Passed: 340 Strong Green frozen files and 853 Bedford–Taylor edition files; 1,006 source bindings, 24 PDFs and 4 ZIP archives checked |
| `HISTORY_BASE_SHA=761e08386e0ef1144f002df6f9e58b2c2aa285ca npm run check:history` | Passed: no existing snapshot or frozen edition modified or removed |
| Desktop and narrow-screen diagram readability, relation conditions and keyboard navigation | Passed in the managed browser: AND/OR graph, 100% scale and fit-width controls, wide layout, Enter-key expansion, 390px reading frame with no horizontal page overflow |
| Direct source links, all formal open-item context, complete secondary register and exact map-fragment feedback | Passed: links and fragments resolve; actual shared feedback page received the exact `d-e-exact` relation and v1.0.1 without a fabricated result ID |
| Homepage and project-navigation entries, search and sitemap | Passed by generated-page and route checks |
| Non-force publication, GitHub Actions outcome and live Pages verification | Pending |

No new automated review or backup schedule is claimed by this release note.

Desktop and narrow-layout evidence is retained in
`docs/screenshots/bedford-taylor-logical-map-desktop.jpg` and
`docs/screenshots/bedford-taylor-logical-map-mobile.jpg`.
