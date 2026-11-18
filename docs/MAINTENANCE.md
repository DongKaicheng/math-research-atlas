# Maintenance and publication protocol

This repository is the source of the public atlas. Project text, paper editions,
feedback, and deployments have different roles. A successful website build is
not a review of a mathematical proof.

## One feedback record

Use this repository's GitHub Issues for all reader discussion. General feedback
is a separate category on the same board, without a required theorem or version.
Project-specific forms preserve optional project, result, page, and edition
context. A maintainer may clarify missing context in a reply; do not invent it.

Keep one thread per issue. When a duplicate appears, link the earlier thread and
explain the closure. Add a resolution comment rather than rewriting the reader's
original argument. Keep the contributor's attribution where permitted. Do not
republish private messages or attachments without their consent.

The normal sequence is:

1. Reader opens an Issue or comments on an existing one.
2. Maintainer identifies its scope: general discussion, exposition, reference,
   mathematical correction, proposed proof, counterexample, or formalization.
3. A proposed change is developed in a branch and Pull Request linked to the Issue.
4. A reviewer checks the exact change and its affected dependencies.
5. An authorised maintainer merges after the relevant checks pass.
6. The revision is published, its live page is checked, and a resolution comment
   links the Issue to the Pull Request and permanent publication version.

Closing an Issue, labelling it, or accepting a Pull Request does not by itself
establish a theorem. A proof status changes only with appropriate proof evidence.
Labels are helpful but optional: the forms and website also identify categories
from their title prefixes. No new editor permissions are granted by feedback.

## Editing and review

- Fetch the current branch and compare it with the version on which the work
  began. Reconcile concurrent changes; never force-push over another project.
- Keep project IDs, result IDs, theorem labels, and existing anchors stable.
- Edit authoritative content or LaTeX sources, then regenerate the public files.
  Do not edit only an HTML build or a PDF and leave its source inconsistent.
- For a substantive mathematical change, review hypotheses, definitions,
  conclusions, selected dependencies, and downstream applications. Reassess
  affected review bindings; do not copy an old review hash onto new content.
- Use the mathematical writer for exposition, the project maintainer for
  statements and dependencies, and the publisher for source projection, links,
  privacy, and deployment. Keep these activities distinct in the change note.
- Limit a Pull Request to the intended projects. Avoid incidental rewrites or
  attribution changes in another project's mathematics.

The repository owner controls write access. `CODEOWNERS` identifies ownership;
it does not itself enforce approval. A branch ruleset requiring Pull Requests,
code-owner review, and passing checks is a recommended owner setting, not an
assumed or silently enabled feature. Never share an account or commit a token.

## Publication versions

There are two kinds of identifier:

- An atlas project revision, stored in `content/projects/<project>.json`.
- A formal mathematical edition, with its own paper sources, PDF files,
  statement statuses, and checksums. A project's publication manifest identifies
  the edition that its current page displays.

Do not conflate these numbers with mathematical truth status. A layout-only or
privacy correction can require a new publication edition while leaving every
mathematical claim unchanged.

For an atlas revision, save the previous complete bundle in
`content/history/<project>/v<revision>.json`, then increment the current revision
and record `publishedAt` and `changeSummary`. Existing history is append-only.
Before increasing a formal edition, preserve the previous public edition as a
frozen source snapshot with its manifest and exact hashes. Add a new directory
rather than changing files beneath an old version URL.

Every release note records the date, affected project and result IDs, the change,
its mathematical or editorial character, and related Issues or Pull Requests
when they exist. Never invent issue numbers, review evidence, or a release date.
Give each paper a matching HTML, TeX, and PDF edition. Keep stable current links
and explicit version links; preserve old anchors or supply visible redirects.

A statement later found incorrect keeps its permanent ID, receives a correction
or withdrawal notice in a new revision, and links to the previous statement and
the reason for the change. Historical versions describe their historical status;
the current page must not present a withdrawn result as valid.

## Mathematical agent releases

The independent mathematical tools on [AI & Math](/ai-and-math/) have a separate
version track from mathematical results. The current pointer is
`public/agents/current.json`; fixed archives and their SHA-256 manifest are in
`public/agents/releases/<release>/`. No agent update changes a research theorem
or formal paper edition by implication.

For a new agent release, first review the installed skill sources and their
diagrams, exclude machine caches and personal Site bindings, then run:

```sh
python3 scripts/package-agents.py --source-root <absolute-installed-skills-parent> --release YYYY-MM-DD-short-name
python3 scripts/package-agents.py --verify
npm run build
npm run check
```

The packaging tool refuses an existing release directory. Inspect the public
archives, including `SKILL.md`, diagram scripts, fixed SHA-256 hashes, name/privacy
screen, installation guidance and all three site links. Publication requires a
normal reviewed repository update. Previous ZIP URLs remain fixed; roll back
the current pointer in a new Git commit only after confirming the intended
release and preserving history. No background sync from personal agents to
GitHub Pages has been configured.

Agent feedback uses the same GitHub Issues board as the mathematical atlas.
General usability, documentation and feature comments need no theorem or
edition; a source-specific mathematical objection should use the relevant
project, permanent result ID and exact formal edition instead.

## Release checklist

1. Review the source diff and status/dependency changes. Check other projects are
   unchanged unless the Pull Request explicitly covers them.
2. Build and test with the repository's scripts:

   ```sh
   npm ci
   npm run build
   npm run check
   ```

3. Inspect the rendered overview, Progress, route pages, formal papers, equations,
   and PDF downloads. Check a narrow layout and keyboard navigation.
4. Verify version links, permanent result links, canonical URLs, and the sitemap.
   Confirm paper hashes refer to the exact public bytes. For Beilinson–Bloch,
   rebuild and review papers in a new draft, then run `npm run freeze:release`.
   For Bedford–Taylor, use the audited reading-receipt import procedure below.
   Rebuild, then run `npm run check` and `npm run check:release`; the release
   check verifies both projects. Include each new edition’s frozen files and
   checksums, plus its source receipt where applicable, in the publication change.
   Do not copy old review or freeze markers into a draft.
5. Audit public text, PDF metadata, TeX, JSON, and archive members for unintended
   names, private paths, email addresses, credentials, or private correspondence.
   Preserve legitimate external bibliographic attribution.
6. Check general feedback needs no result ID, and mathematical feedback preserves
   the exact optional context. Opening a GitHub form must not pretend to submit it.
7. Merge through the authorised GitHub workflow. Confirm the Pages deployment
   succeeded; then check the live project, version, feedback, and PDF URLs.
8. Record the published revision and resolve the linked Issue with that URL.

The Pages workflow builds from `main`. Browser-visible success, automated checks,
deployment success, and mathematical review are separate observations. Report
only checks actually performed.

## Beilinson–Bloch editions

The current project address is `/projects/strong-green/`; exact editions live
under `/projects/strong-green/editions/<edition>/`. The current pointer is
`content/strong-green/current.json`, and the corresponding Atlas project card
must name the same edition.

Maintain mathematical records and full article HTML in
`content/strong-green/releases/<edition>/`. Follow the
[paper rebuilding workflow](https://github.com/DongKaicheng/math-research-atlas/blob/main/docs/PAPERS.md)
to compile and inspect matching TeX, PDF and HTML in a new unpublished draft.
Reconcile their hashes and affected mathematical records, then use
`npm run freeze:release` for the completed Beilinson–Bloch edition. Keep the
previous pages and downloads unchanged under their old version addresses.

The ordinary website build consumes the checked-in paper artifacts; it does
not execute TeX or recompile contributor uploads. `strong-green/views/` controls
future page presentation; it must not change an already frozen edition.

## Bedford–Taylor editions

The public project has a stable current address at
`/projects/bedford-taylor/` and exact editions below
`/projects/bedford-taylor/editions/<edition>/`. The initial unsigned snapshot is `v1.0.0`; current publication `v1.0.1`
adds the completed feedback and source-scope review of 18 November 2026. Both preserve the recovered research statuses. It does not claim that
the research programme or every recorded proof has been completed.

The source of a mathematical correction remains the maintained mathematical
project. Revise the relevant definitions, statements and proofs there, check
affected dependencies, and rebuild matching HTML, TeX and PDF reading copies.
Do not correct a PDF or a rendered theorem in isolation. Run the unsigned
reading-export audit before importing the next publication.

The import adapter uses an exact file allowlist, not a whole-workspace copy.
For a newly audited reading export, capture a new receipt containing the source
commit, edition, audit identity, paths, sizes and SHA-256 values:

```sh
node scripts/import-bedford-taylor.mjs --source <audited-reading-dist> --capture-receipt <absolute-new-path-in-content/bedford-taylor/source-receipts> --source-commit <exact-source-commit> --audit-report <passing-reading-export-audit.json>
```

Capturing a receipt records bytes; it does not approve them. Inspect the source
diff and completed audit with the proposed publication change. Then create a
new edition using the accepted receipt:

```sh
node scripts/import-bedford-taylor.mjs --source <audited-reading-dist> --edition <new-edition> --receipt <accepted-source-receipt.json>
```

The importer refuses to replace an existing edition and does not move an
existing current pointer. After inspection, update
`content/bedford-taylor/current.json`, preserve the previous Atlas bundle in
`content/history/bedford-taylor/`, and increment the publication record in
`content/projects/bedford-taylor.json`. Record the actual change and any related
Issues or Pull Requests; leave those references absent when none exists.

Run the full build, tests and release check. The Pages workflow checks frozen
file membership and hashes, source receipts, links, and append-only history
before deployment. It does not execute uploaded contributor files or compile
unreviewed TeX. Review PDF text and metadata when preparing the reading edition;
the public build additionally verifies that it serves those exact PDF bytes.

The website's Versions page links each fixed edition and its checksums. The
older Atlas outline is retained as an explicitly unsigned historical reading
copy. The two inherited ZIP filenames both provide the current edition's
unsigned reading-source package, as their README explains; their filenames do
not certify a historical snapshot. Never describe them as untouched old archives.

Very large rendered HTML pages may be stored losslessly in a release's
`packed/` directory, indexed by `packed-assets.json`. The ordinary build restores
their exact public paths and checks both compressed bytes and the original
frozen manifest before using them. This storage choice does not alter the
published file, its URL or checksum. Keep the packed bytes and index immutable
with the release. A clean checkout must run the build before the read-only
release check; do not hand-edit the restored, ignored HTML copies.

### Bedford–Taylor research map

The current `/projects/bedford-taylor/map/` presents a logical research map
with three sections and 17 focused diagrams. Its source index is
`content/bedford-taylor/research-logic.json`, with the typed node and relation
data in `logic-core.json`, `logic-descent.json` and `logic-energy.json` beside
it. The complete thematic register from `research-map.json` remains a secondary
reading index, covering all 74 topics, 14 formal programme items and 26
definition groups. Its branch membership is navigation, not an implication.

Maintain the logical data against the actual statements and proofs in the
selected mathematical edition. Nodes link directly to source statements or
proof locations. Each relation records its premises, conclusion, kind,
additional hypotheses, mechanism and source evidence. Inputs within one
relation are joint requirements (AND). Distinct sufficient relations with the
same conclusion are alternatives (OR), each retaining its own hypotheses.
A proof dependency does not become a sufficient condition merely because it
is cited. An implication with an open premise remains conditional; an
`open-step` or `obstruction` is not a proved implication. State exactly which
shortcut a counterexample excludes. An open question may have a linked context
node without an incoming arrow when no established logical connection is
available.

Keep all required hypotheses readable in the relation's text, rather than
available only through hover. In particular, preserve actual analytic-zero
premises, the rank bound on a union tuple, the supplied normal-three model,
complete protected fibers, the specified background and domain, and coupled
tail or coefficient restrictions. Retain the distinction between capacity-zero
and pointwise conclusions, and between a completed weak solution and an actual
classical solution. Source statuses and permanent result identities remain
those of the edition. Diagram review does not supply new proof acceptance.

The checked-in diagrams live in `content/bedford-taylor/logic-diagrams/` as
clickable SVG files and their Graphviz `.dot` sources. Its `manifest.json`
binds each SVG by SHA-256 to its bytes, selected edition, logical panel input
renderer and shared logical-schema module. After changing the logical data or renderer, regenerate the
artifacts in an environment with Graphviz's `dot` available:

```sh
npm run build:bt-logic
npm run build
```

Commit the regenerated SVG, `.dot` and manifest together with the reviewed
source change. The ordinary website build validates the input bindings and
SVG hashes and consumes these checked-in artifacts; it does not require or
invoke Graphviz. A stale diagram must be regenerated, not accepted by copying
an old input hash onto new content.

When selecting a new mathematical edition, review both logical data and the
complete register against that edition before moving their `edition` bindings.
The build rejects stale edition bindings and incomplete primary register
coverage, and rejects any source topic or formal open item missing from the
logical nodes. In the secondary register, keep each topic and formal programme item
in exactly one primary branch; other nodes may cross-reference it. Map-only
changes increment the Atlas project revision and preserve the exact previous
bundle in `content/history/bedford-taylor/`. Git retains diagram, data and
layout revisions. Frozen reading editions, their sources and PDFs retain their
existing addresses and bytes.

Map feedback continues to use the same repository Issue board. Preserve the
actual map URL and its precise diagram, relation or register fragment together
with the selected mathematical edition. A map fragment is page context, not a
new theorem ID. Each logical step also has a direct contextual link to this
shared board. General feedback remains available without a required result
or edition.

After changing the map, run the full publication checks and inspect desktop
and narrow reading layouts. Verify arrow meanings, visible joint conditions,
source links, keyboard access, exact feedback fragments, the secondary register,
and the project navigation and homepage entry. Record the checks and live
deployment actually observed in the release note; leave unfinished checks
explicitly pending.

### Overall Bedford–Taylor logical graph

The same map now starts with `#total-logic`. The principal-route view selects
canonical relations through `logic-overview.json`; the complete view includes
every node and relation. Selecting a relation always includes all its premises
and its conclusion. The view never creates a direct implication by suppressing
intermediate requirements. The 17 focused diagrams remain the stable home of
their original explanations. Graph nodes link to `#logic-node-<id>`; connections
link to the single canonical explanation and its exact source references.

`logic-bridges.json` records the separately inspected connections between
branches, including explicit additional inputs. Each bridge has the same
premises, kind, hypotheses, mechanism and source contract as an existing
relation. General descent and finite energy currently meet at an **open**
Green-product interface. A bounded-calculus proof input is not an assertion
that bounded calculus alone supplies every geometric or analytic hypothesis.

`lib/bedford-taylor-overview.mjs` checks global identities, complete coverage,
source-edition bindings and cycles across the separate components. The
checked-in artifacts in `overview-diagrams/` have their own manifest binding
the exact view, full node and relation records, ambient section scopes, renderer
and schema files. `npm run build:bt-logic` regenerates both the focused diagrams
and the overall graphs. The ordinary build verifies both manifests without
requiring Graphviz. Keep generated bytes and their reviewed inputs together.

The complete graph is a large canvas. Preserve readable labels, an exact node
locator and the connected text view; fitting the entire graph to a screen is
for orientation. On narrow screens, the text view exposes the same joint
inputs, typed connections and complete additional hypotheses. Test the locator,
fit/readable scaling, full-height mode, keyboard links and hash disclosure.
Overview feedback uses the existing board with `#total-logic`; cross-branch
feedback retains its precise relation fragment. Neither creates a theorem ID.

An overall-graph update advances the Atlas presentation revision and preserves
the previous project bundle. It does not change the mathematical edition or
the source acceptance status. Record the actual source review and live UI
verification in `docs/releases/`, separately from the formal mathematics.

## Beilinson–Bloch Progress proof diagrams

The current `/projects/strong-green/results/proof-diagrams/` and its per-result
pages are source-bound graphical reading views, separate from frozen paper
editions. Their coverage includes every case and application in
`strong-green/views/content/pairing-progress.mjs`. The
`progress-proof-*.mjs` source modules provide the proof trees; `progress-proofs.mjs`
joins them to the existing Progress inventory and validates coverage.

`progress-proof-required.mjs` is an independent minimum inventory of the
reviewed proof trees and the source files required by each result family.
Extend it after reviewing new units; do not regenerate or shrink it from the
candidate graph merely to make a deletion pass. It protects detailed trees
which are not themselves application entry points. Source locators are
nonblank string arrays: existing descriptive entries are reading notes, not
automatically parsed TeX labels. Their exact mathematical targets still need
source review. Scope/context boxes cannot contain an inference; put every
derivation in a drawn root, premise or related argument.

Maintain the exact source file hashes and proof locators when revising a graph.
Do not recompute a binding merely to bypass a stale-source check: reread the
changed statement and argument, check each affected inference, then record the
new binding. Preserve ALL-premise bundles, alternative routes, equivalences,
open bridges and blocked inferences. A source's conditional status remains
conditional in its diagram. Intermediate diagram nodes are not newly accepted
theorems.

Every application has a stable diagram anchor and a link from Progress. Preserve
those anchors when refactoring; give each diagram its correct SVG download,
title, canonical URL, search record and feedback page context, including a valid
linked diagram fragment. A fragment is not a new theorem ID. Never overwrite
an old mathematical edition to add these reading pages. Run the complete
repository tests and release/history checks after changing the renderer or the
proof data, and inspect representative long diagrams and their source links.

The current interface follows the Bedford–Taylor logical map: parallel inputs
appear above a numbered AND/OR/IFF junction and its conclusion, with open and
blocked links explicitly distinguished. Each authored tree has an always-visible
graphical panel. Keep node labels compact; the complete node notes, hypotheses,
rule notes, connection explanations and sources belong in linked HTML details
immediately below that panel. These details supplement the drawing, not replace
or hide its branches. Preserve the old tree, occurrence and junction IDs;
append `-detail` for their new explanation targets.

Graphviz creates the checked-in coordinate cache in
`content/strong-green/logic-diagrams/`. Regenerate it with
`npm run build:sg-logic` after changing a bound layout or logical source.
The normal build verifies its manifest, source hashes and geometry hash without
requiring Graphviz. A stale cache must fail the build; do not silently use a
fallback layout for an existing published tree. Synthetic test fixtures may use
the deterministic top-down fallback. The cache stores geometry, never a second
copy of mathematical prose or statuses.

Keep the SVG's DOM reading order aligned with its visible top-down order.
Diagram fragments must move keyboard focus as well as the viewport and open
any containing explanation details. Each panel has independent two-axis
scrolling and zoom. Preserve its reading coordinates when changing scale,
leaving other panels unchanged. Fit-width mode may make text small, so retain
a 100% readable-size control and keep the diagrams visible on narrow screens.
Explicit fit may go below the manual zoom range; label such a view as an
overview. Reserve a stable scrollbar gutter so height-driven scrollbar changes
cannot oscillate the fit width. Automatic resize must not restore the page's
scroll position, and a user scroll must win over a queued automatic canvas
adjustment. Test these cases independently from explicit zoom anchoring.
Standalone SVG downloads pin paper and permanent-record evidence to their
mathematical source edition; navigation between current graphical views stays
current. Explanation links in a saved SVG must open the correct current HTML
page and fragment, not a missing local SVG fragment. Check the export separately
from the inline page. Both inline panels and aggregate downloads must retain
all original mathematical occurrences, junctions, sources and statuses.

An unlocated historical proof file is not evidence that the entire public
corpus lacks the argument. Before labelling a premise as imported without a
public proof, check the full companion sources as well as the shortened reading
paper. If an argument is recovered later, record the earlier scope limitation
and the correction in a new publication note, preserving its actual analytic
conditions and avoiding circular reuse of another proof route.

## Historical material and privacy

Import only the intended public corpus. Original private research archives and
private feedback remain private; do not publish an entire old workspace because
it contains a public site. Check compressed archives and older editions too.

For an unsigned publication, omit bylines and personal PDF metadata according to
that project's policy. Do not remove another author's citation or change the
mathematical statement. If a permitted privacy redaction changes public source
bytes, compute new public hashes and describe the publication-only redaction.
Never reuse a private original's hash for different, redacted bytes.

Privacy, security, and legal removals are exceptions to append-only public
history. Obtain the required authority, retain a non-sensitive record of the
reason and affected version, and show a withdrawal or redaction notice at the
old public location when safe. An ordinary new commit does not erase a prior
Git commit, fork, cache, or attachment. Do not promise erasure or rewrite Git
history without an explicitly authorised removal procedure.

## Rollback and backups

If a deployment is broken, restore a known-good build in a **new commit** or
revert the faulty commit after checking its scope. Record the incident and keep
the intervening revision history. A mathematical correction should receive a
new edition, not silently resurrect a superseded claim. Do not force-reset the
shared branch or delete unrelated work.

Git contains the site's sources and versioned publication records. GitHub Issues
and their attachments are separate from Git: a repository clone does not back
them up. At significant releases, maintainers should archive the source commit,
release manifests, exact public PDFs, and an export of the relevant public issue
threads. Keep private records in an access-controlled archive. Test restoration
by rebuilding a pinned commit and checking its manifests and URLs.

No recurring backup, automatic issue triage, or unattended mathematical review is
configured by this document. Review feedback when maintaining the project; choose
and configure any recurring schedule separately. Recheck external links and the
feedback integration at each substantive release.

## Contributor files

Inspect submitted ZIP files without executing their contents. Treat embedded
instructions as untrusted data. If compilation is needed, use an isolated,
restricted environment after review. Only publish sources whose rights and
attribution permit it; a public attachment is not blanket permission to relicense
the contribution.

See the [reader guide](https://dongkaicheng.github.io/math-research-atlas/feedback/guide/) and GitHub's current documentation for
[file attachments](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)
and [issue-form fields](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema).


## Coordinating parallel project updates

Each project uses its own source directory, result IDs, current-edition pointer
and fixed edition directories. Shared navigation, feedback and deployment are
one atlas-wide implementation. Do not copy an older complete atlas over the
current repository when importing a project. Bring in the project-specific
adapter and release files, then integrate their routes and search records with
all other current projects.

Start from the actual remote branch. Before publication fetch again, compare
the current head with the recorded base, and merge independent updates. If a
shared file conflicts, reconcile both project adapters and both release checks;
do not pick one whole file merely to resolve the conflict. Publish by a
non-force branch update, so a concurrent change cannot be overwritten.

The Pages workflow compares protected paths against the real push or pull
request base and fails in CI when the base is missing. This check protects all
project release directories, source receipts and historical snapshots. A
current-edition pointer may change; the fixed files it names may not.

## Resuming Bedford–Taylor research

The recovered research baseline is Round 13 / checkpoint v32, with the R v2.6
regularization manuscript and B v0.1 bounded-calculus manuscript. The reading
edition includes 74 thematic records, 26 definition groups, 66 formal
statements, 14 formal open items and 105 source files. Source status and
independent proof acceptance remain distinct. The full historical R21 ZIP/PDF
is still unavailable; its recovered appendices do not replace it.

The next substantive research task is actual analytic curvature-relation
descent for the allowed original backgrounds. The supplied normal-three
quadratic model gives vanishing away from the centre and a central coefficient
expressed by the tangent pairing. The general vanishing of that coefficient
remains open. Preserve these hypotheses, the original field and absolute value,
full test classes and ordinary locality in future work. Update an exact source
and its affected dependencies before changing a public status.
