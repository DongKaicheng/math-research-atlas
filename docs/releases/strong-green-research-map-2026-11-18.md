# Beilinson–Bloch research map — 18 November 2026

Adds `/projects/strong-green/research-map/` to the project's primary navigation
and homepage. The primary view is a logical map, not a topic classification.
One continuous, fully expanded SVG draws six connected proof trees for the full global target, exact-support Green
construction, arithmetic equivalences, fixed-field Northcott, bounded-degree
field control, and metric/family comparison.

Conclusions are above their connected premises. Every junction distinguishes
joint requirements, alternative sufficient routes, equivalence, an open bridge,
or a known failure of implication. Each relation links to the exact supporting
paper or record. The full-domain pairing is separated from the additional
functoriality, normalization and classical-comparison requirements. Quantifiers,
geometric domains and height hypotheses remain explicit.

The collapsible supplementary index preserves all 54 permanent records, the
three existing construction routes, 13 pairing cases with their 32 geometric
applications, and the six existing programme steps. Registered titles and
statuses are read from the authoritative current records. Intermediate
properties in the proof trees are reading nodes, not new theorem records.

All 54 permanent records now occur in the diagram itself: as scoped proposition
nodes, inference/support rules, or definition/context nodes. The graph uses
119 scoped node occurrences and 34 logical junctions. Solid inference lines,
OPEN dashed bridges, blocked links ending in a cross, blue rule/support lines,
and grey scope/definition lines are distinct. Multi-premise equivalences connect
the conclusion to the WHOLE premise bundle, not to each premise separately.

Readers can jump to a conclusion and follow the complete node-and-arrow graph;
there are no collapsed or lazy-loaded branches. Zoom controls change only the
display size. Narrow screens scroll horizontally inside the graph at a readable
default size. A downloadable standalone SVG retains all nodes and absolute
hyperlinks. The supplementary index still supports searches by title, topic
and permanent ID. The diagram and its links work without JavaScript.

This is a current navigation view based on mathematical edition v0.5.1. It does
not change any statement, proof, mathematical status, PDF, or frozen file. The
map and its presentation assets are not inserted into the old edition. The
shared Atlas feedback link carries the project, mathematical edition and map
page; there is no new feedback store. Other projects are outside this change.

## Maintaining the map

`strong-green/views/content/logical-map.mjs` holds explicit logical relations
and their evidence. Do not derive implications mechanically from the generic
dependency arrays: those arrays include context and proof ingredients. Every
gate needs a precise scope, its full premise bundle, and a source for the
claimed relation. Record nodes cannot override their publication status.
Future changes to a source theorem require rechecking its displayed gates.
`gate.rules` and `gate.ruleNotes` describe registered inference/support records;
they are NOT additional mathematical premises. `tree.contexts` gives definition
and scope nodes, with no implication arrow. Coverage validation rejects a
permanent record omitted from the graph, even if it remains in the topic index.
`strong-green/views/content/logic-layout.mjs` supplies deterministic SVG geometry.
It preserves each scoped occurrence instead of merging by permanent ID. The
SVG uses text, rectangles, junctions and paths, with no runtime layout engine.

`strong-green/views/content/research-map.mjs` holds supplementary topic
membership by permanent ID. Build-time checks reject missing, duplicate or
unknown records. New records therefore require deliberate placement.

Current-only assets and the current-only page flag in
`scripts/build-strong-green.mjs` preserve all existing frozen URLs. Keep these
boundaries when changing the interface. A future formal edition can separately
include a frozen reading map if that is explicitly desired.
Current CSS and JavaScript URLs carry a content fingerprint, so a new logical
view cannot accidentally run the cached script from an older topic view.

Validate the build, generated links, statuses, navigation, search, sitemap,
shared feedback context and release integrity. Inspect desktop and narrow
layouts and exercise diagram navigation, zoom, source links, the complete SVG
download, and the supplementary index
before publication. Compare append-only history against the actual pre-change
remote head.
