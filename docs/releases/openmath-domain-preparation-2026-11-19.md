# OpenMath domain migration preparation — 19 November 2026

## Scope and publication state

The owner selected **OpenMath** and registered **openmath-atlas.org** with
Dynadot, then authorised migration of the mathematical atlas. This change
prepares the current reading site for that domain's root. It does not claim
that DNS, GitHub Pages domain binding, HTTPS, or production cutover is complete.
The separate personal-homepage repository is outside this change.

The migration was reconciled with main commit
`f37a031c798823fddbb06e5caa78e5ed3b157e5b`, retaining its AI & Math page and
three immutable mathematical-agent downloads. Work is tracked in
[pull request #1](https://github.com/DongKaicheng/math-research-atlas/pull/1).

## Changes

- Configurable current-site branding and root URLs, with guarded deployment
  settings. Unset repository variables still select the existing legacy site.
- Current Bedford–Taylor canonical links, map links, search data and feedback
  scripts are delivery projections, separate from their frozen sources.
- Current Strong Green paper references keep their exact edition while using
  the selected deployment origin.
- Byte-identical historical edition and shared-resource aliases preserve
  original `/math-research-atlas/` references. Other legacy HTML routes redirect
  to the canonical current address, retaining query strings and fragments.
- The Pages workflow checks both publication modes before uploading the
  selected, already-checked artifact. Pull requests do not deploy.

No mathematical statement, proof, hypothesis, status, permanent identity,
source binding, PDF, frozen source package or existing tool release changed.

## Observed local verification

- `npm ci`: completed successfully.
- Legacy build: 770 routes, three projects, 128 permanent entries.
- Legacy `npm run check`: **141 passed**, zero failures.
- Custom-domain build: 770 routes with the OpenMath root configuration.
- `check:domain`: four primary entries, 307 mutable HTML pages, 464 frozen
  HTML pages, 18 standalone SVGs and current inline SVG destinations; 75,822
  internal links, 1,155 search links, exact feedback anchors and four legacy
  entry redirects checked.
- **1,196** historical alias files matched their root copies by SHA-256;
  checked-in frozen originals also matched. Shared CSS, fonts, literal script
  fetch destinations and edition resources resolved.
- Both build modes passed `check:release`: 340 Strong Green frozen files,
  plus two Bedford–Taylor editions with 853 files, 1,006 source bindings,
  24 PDFs and four ZIPs containing 600 members. PDF text was inspected by the
  release checker.
- The custom-domain current/fixed Bedford–Taylor formula-and-anchor identity
  regression passed independently.
- `check:history` against the main SHA above passed: no existing project
  snapshot, frozen edition or agent release was modified or removed.

These are publication/infrastructure tests, not an independent mathematical
proof review.

## Still required before claiming migration complete

- GitHub Actions results for the submitted commit.
- Browser-rendered desktop and narrow-layout checks. Local Chromium could not
  launch because the execution environment denied a socket operation; no
  rendered browser check or screenshot is claimed here.
- Authenticated GitHub account domain verification and project-only Pages
  binding; the available browser was not signed in at preparation time.
- Dynadot TXT verification followed by coordinated A/CNAME configuration,
  deployment-variable activation, real DNS propagation, TLS and HTTPS checks.
- Live verification of the four new addresses, old deep-link redirects,
  feedback, search, exact downloads and the unchanged personal homepage.

Follow [the migration procedure](../CUSTOM_DOMAIN_MIGRATION.md). Record live
observations in a subsequent deployment note rather than editing this
preparation record into evidence of checks that have not occurred.
