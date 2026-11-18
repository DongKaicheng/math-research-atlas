# Bedford–Taylor overall logical map — 18 November 2026

## Publication scope

This update adds the overall view requested after the first logical-map
publication. It advances the Atlas project presentation from revision 3 to
revision 4. The mathematical reading edition remains **v1.0.1**. Frozen
statements, proof texts, source receipts, PDFs, ZIPs and mathematical status
records are unchanged. The exact revision 3 project bundle is retained in
`content/history/bedford-taylor/v3.json`.

The source checkout began at `a26967e`. Before publication it was fast-forwarded
to `74116ad20ee9042cbc554a0ba00d7d135aa48384`, preserving the concurrent Strong
Green diagram update. Its new generation command and maintenance instructions
were retained when reconciling the shared files. This change is restricted to Bedford–Taylor presentation,
its tests and the shared maintenance document. It does not alter that other
project's mathematics or diagrams.

## What changed

The research-map page now begins with `#total-logic` and two views:

| View | Assertions | Logical relations | Purpose |
| --- | ---: | ---: | --- |
| Principal proof routes | 45 | 35 | The common foundations, descent, energy, compatible sources and open Green interface |
| Complete logical graph | 94 | 80 | Every canonical node and relation across the three branches and their cross-branch connections |

All 17 existing focused diagrams remain available with their original anchors.
All 74 thematic source records, 14 formal open items and 26 definition groups
retain their source links and secondary complete index. The homepage and map
introduction provide an explicit overall-map link. The new entry is also in
the shared search index.

The overview selects canonical node and relation records rather than copying
new abbreviated statements. Every selected relation carries all its premises,
full additional hypotheses, conclusion, kind and source locators. Multiple
sufficient implications meet at OR; the inputs of one argument meet at AND.
Proof inputs and open steps keep their separate dashed styles. Obstructions
retain tee endings. A conditional deduction does not prove its open input.

## Source audit and refinements

The source review inspected the actual v1.0.1 R6 degree-one/Leibniz proofs,
QA1–QA19, LC1–LC2, the R11 bounded capacitary completion, collar and capacity
localization arguments, the mature analytic-estimates theorem, and the formal
programme's Green-product problem and proof architecture. An agent who did
not author the new bridge records independently checked those applications.

Four additional relations make the existing branch interfaces explicit:

1. Bounded calculus, quasicontinuity and compact-gap comparison supply proof
   inputs to the analytic tail and truncation calculus, with the required
   Laurent domain, extending background, collars, localization, original
   tests and degree budgets. General raw/outer Borel equality is not assumed.
2. The bounded weighted calculus supplies a proof input to the scalar chain
   calculus for actual bounded psh differences on its positive closed
   background, with coefficient-Radon control and actual Borel values.
3. Bounded calculus together with the separately available degree-one action
   and full Leibniz rule supplies the quadratic transgression argument. Its
   finite presentation has **real constant coefficients** and degree
   `0 ≤ p ≤ n−2`. It does not assert variable-coefficient or arbitrary
   higher-degree multiplication. The real-coefficient restriction was made
   explicit in response to the independent source review.
4. General actual-relation descent, capacity tails and mixed energy meet at
   the **open** Green-product problem. Cycle multiplication, intersection,
   integrability, presentation/truncation independence and comparison remain
   visible obligations.

The extra degree-one node describes an available established R6 input. Its
ochre "Hypothesis" label describes its role in this application, while its
title and scope distinguish it from an unresolved conjecture.

Two display titles were made more precise:

- "Continuous degree-one curvature relations descend" retains the continuous
  coefficient, degree-one scope already stated in the source.
- "Unique source solution in the completed cone" retains the theorem's
  uniqueness inside the completed cone, without claiming recovery of a
  classical psh representative.

The review also checked the certificate alternatives, union-rank restriction,
weak-background density route, normal-three central residual, strong-energy
completion, and the four-input projection/probe/strong-datum/zero-defect gate.
It found no reason to promote or withdraw a frozen mathematical status.
This is a source-fidelity and logical-presentation audit, not a new independent
proof acceptance or formal verification of the research corpus.

## Reading and interaction

The principal graph uses a compact top-down layout with at most four boxes
per rank. The generated viewport is about 1616 × 4413 units, compared with
about 5012 units of width in the first draft. Titles retain their natural
17-unit size. Pure layout constraints are invisible and assert no mathematical
relations. The complete graph retains section clusters and every canonical
record.

Readers can locate a named assertion, highlight and center it, change scale,
fit the whole width for orientation, return to readable size, or expose the
full height. The complete graph intentionally remains a large canvas.
Every graph node opens its precise scope; every connection opens its unique
canonical explanation and evidence. Zoom controls have 44-pixel touch targets.

Both views have a connected text projection retaining every premise,
conclusion and full hypothesis. On narrow screens this is the primary reading
view. A connection selector jumps directly to the desired AND/OR argument,
and branch groups can be collapsed. The existing focused diagrams retain
their separate narrow-screen flows.

All feedback remains on the existing board. The overall-map link supplies
`#total-logic`; each new bridge supplies its exact canonical relation fragment
and v1.0.1. General comments still require no theorem or edition. No map
fragment is represented as an invented permanent theorem ID.

## Maintenance and validation

The new loader rejects duplicate or unknown identities, incomplete selections,
edition mismatches and circular established support across branches. Its
separate artifact manifest binds the complete view data, ambient scopes,
renderer, shared schema and exact SVG bytes. The normal build verifies these
artifacts without Graphviz; `npm run build:bt-logic` regenerates both sets.

Seven new tests cover complete source projection, the essential mathematical
gates, full text flows, actual SVG edge topology, artifact binding, invalid
global identities/cycles, and rejection of a stale graph after removing the
independent zero-defect premise. The first complete run found duplicate SVG
IDs inherited by Graphviz clusters; the renderer now assigns unique cluster
IDs. The targeted 23-test run then passed, including all local-page/anchor
checks. A separate projection review counted 104 visible principal edges and
226 visible complete edges, with no extra visible mathematical connection.

Completed at the time of this record:

- Dependency installation and both graph generations.
- Whole-site build, including the appended revision history route.
- Frozen-release integrity: 340 Strong Green files and 853 Bedford–Taylor
  files across two editions; 1006 source bindings, 24 PDFs, four ZIPs and
  600 ZIP members, with zero unchecked PDF text files.
- Desktop observation of the overall-map entry, diagram labels and the
  locator highlighting the solution node in its completed-cone scope.

Final prepublication verification:

- **138/138 tests passed** after integration with the concurrent Strong Green
  update (the preceding 126-test suite also passed), including the
  seven new overview tests and every existing project, feedback, source,
  privacy, link and history-format check.
- At a 390-pixel browser frame, the document's content width and scroll width
  were both **375 pixels**. The principal text view was open, the connection
  selector located the source-equation argument, and all four inputs plus all
  additional hypotheses were readable without page horizontal overflow.
- The narrow-view proof link expanded the original focused panel and exact
  relation. Enter closed and reopened its summary. Its feedback link retained
  the exact relation fragment and v1.0.1.
- The complete graph's Fit whole width control fitted its actual SVG below
  the canvas width at approximately 15%; locating a node restored readable
  size and highlighted the selected assertion. Page content width and scroll
  width were both 1348 pixels.
- Full-height mode exposed the complete 4135-pixel canvas, and the control
  returned it to the scrolling view. Clicking the graph's quadratic-vanishing
  node opened its canonical scope record.
- Opening Discuss the overall map reached the shared feedback form with
  project `bedford-taylor`, edition `v1.0.1`, page ending `#total-logic`, and an
  empty result ID. The general-feedback link contained no theorem or edition.
  The preview's anonymous Issue-list request used the existing GitHub fallback;
  the actual form destinations and optional context remained intact.
- Desktop and narrow screenshots are retained in
  `docs/screenshots/bedford-taylor-overall-map-{desktop,mobile}.jpg`.

## Publication and live verification

The functional update was published as commit
`0de0d8e8401df35a8f617329459d3a5eabb21418`, with the actual remote parent
`25b978524dc52388407299a18985ca95aa8a9fe4`. The concurrent Strong Green update
and its subsequent live-audit record were preserved. All 32 uploaded blobs
matched their local Git object IDs; the assembled tree matched the staged
local tree exactly. The branch update used `force: false` and the expected
parent SHA. The history guard passed against that actual parent.

[Publish mathematical atlas, run 44337069477](https://github.com/DongKaicheng/math-research-atlas/actions/runs/44337069477)
completed successfully before the following live browser checks:

- The project homepage displayed its separate **Overall logical map** link.
  Following it reached the public map's `#total-logic` section, with 94 nodes,
  80 explained connections, 14 formal open items, and the retained 17 focused
  diagrams.
- The principal view displayed 45 assertions and 35 connections. Opening the
  complete view displayed exactly 94 SVG nodes and 80 connection gates.
- The live quadratic-transgression bridge's direct fragment opened its
  canonical explanation. The real constant coefficient restriction, both
  joint inputs, degree budget, original tests and source references were
  present.
- Discuss the overall map reached the shared feedback form with project
  `bedford-taylor`, edition `v1.0.1`, an empty result ID and the exact public
  `#total-logic` URL. General feedback still opened without a theorem or
  edition. No feedback was submitted as part of verification.
- The principal diagram fitted the desktop canvas at 73%; page content width
  and scroll width both measured 1348 pixels. Its live viewport was captured
  in `docs/screenshots/bedford-taylor-overall-map-live.jpg`.

The follow-up commit containing this verification record and its screenshot
changes no rendered research content, frozen source, or mathematical status.
