# Bedford–Taylor-style proof diagrams — 18 November 2026

This is a presentation revision of the current Strong Green research map and
Progress proof pages. It follows the requested Bedford–Taylor example at
`projects/bedford-taylor/map/#logic-bounded-calculus-and-relative-capacity`.
The mathematical source edition remains **v0.5.1**. No statement, hypothesis,
proof text, source binding or mathematical status is changed.

## Reading structure

Each authored tree now has its own always-visible, top-down graphical panel.
Parallel premises feed a compact numbered junction, which leads to the
conclusion. Junction numbers follow the drawing from top to bottom and then
left to right. AND, OR and IFF retain their original meanings; open steps,
blocked shortcuts, supporting rules and ambient context remain distinct.

Nodes show a concise title, status and, where applicable, permanent record
identifier. Complete occurrence notes, rule notes, hypotheses, deduction
explanations and sources appear in addressable HTML details immediately below
the drawing. Selecting a connection opens its explanation. A node's title
opens its linked statement; its separate scope link opens the full local
description. Only textual details collapse: no proof branch is hidden.

All old tree, occurrence and junction fragment identifiers remain valid.
Explanation targets append `-detail`. Current research-map navigation and all
13 independent Progress family pages remain available. Saved SVGs retain
edition-pinned paper and record evidence and link their explanations to the
correct current HTML page.

## Coverage and geometry

The Progress inventory remains **117 trees, 968 scoped node occurrences and
304 logical junctions**, covering the same 13 result families and 32
applications. Together with the six whole-project trees, the renderer covers
**123 trees, 1,087 nodes and 338 junctions**. These are graphical occurrence
counts, not additional mathematical results.

The Progress drawing has 1,104 actual input/output edges. The previous layout
also counted 304 synthetic bundle rails; removing those decorative rails does
not remove any premise, junction or conclusion relationship.

Graphviz generates a checked-in coordinate cache; normal builds require no
Graphviz executable. Its manifest binds the source data, layout code,
generation code and geometry bytes. A stale cache for a published tree fails
the build. Mathematical prose and statuses are read from the existing records,
not duplicated in the cache.

Independent source comparison preserved every tree/node/gate identity, title,
status, record reference, role, target and source link. All 1,087 node boxes,
338 junction boxes and 5,163 connector control points lie within their
per-tree viewBoxes, with at least 24 pixels of crop margin. Rectangle overlap,
port incidence, top-down order and displayed numbering are regression-tested.

## Reading controls

Each panel has independent two-axis scrolling and zoom. The initial scale
stays within 70–100%; manual zoom uses 40–200%; explicit fit can show a much
wider graph at an overview scale, with a separate 100% readable-size control.
Wide view removes the sidebar while retaining every panel.

Browser testing exposed a scrollbar-width feedback loop near the canvas
height limit. A stable scrollbar gutter removes that oscillation. Automatic
resize no longer restores the document scroll position, and user scrolling
supersedes a queued automatic adjustment. Explicit zoom retains its visible
canvas reading point. Regression tests cover these separate behaviors.

## Preservation

The publication is based on remote commit
`a26967e7a57b169d982946407491e81707ab6810`. Frozen editions, PDFs, public proof
sources and mathematical release manifests remain unchanged. The existing
shared feedback board retains the exact valid diagram or explanation fragment
as page context; no new mathematical ID or feedback inbox is created.

## Prepublication checks

- A fresh build generated 768 routes, three projects and 128 permanent entries.
- All **131** repository tests passed, including 19 interaction regressions.
- The coordinate cache passed a fresh source-hash check.
- Release verification covered the 340 frozen Strong Green files and the
  unchanged Bedford–Taylor inventory: two editions, 853 files, 1,006 source
  bindings, 24 inspected PDFs, four ZIPs and 600 archive members.
- The managed browser preview displayed horizontal premise branches and
  sequential downward deductions. Independent fit controls changed one
  panel without changing another. A connection opened and focused its full
  explanation; a nested node-scope link opened both enclosing disclosures.
- A source link opened `papers/global-height-pairing/#hyp:height-trace`, and
  the target anchor was present. Shared feedback retained the exact new
  explanation URL and edition `v0.5.1` without inventing a result identifier.
- At desktop width 1,363 CSS pixels and a narrow 454-pixel CSS viewport,
  the document had no horizontal body overflow. The narrow check used
  ordinary browser zoom, not mobile-device emulation.

Production deployment and its final screenshot are checked separately after
publication; this prepublication record does not assert a deployment outcome.

This record concerns rendering, interaction and source fidelity. It does not
constitute independent mathematical certification of the underlying proofs.
