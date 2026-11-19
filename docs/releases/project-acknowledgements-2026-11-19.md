# Project acknowledgements and adopted-feedback credit

Date: 19 November 2026

## Scope

This is a current-site publication and contribution-workflow change, not a new
mathematical edition. The pre-change baseline is
`b08bd41a266bbd4568daf2388f16e492ee2cc811`.

- Added an independent acknowledgement page for each of the three current
  projects and a shared directory at `/acknowledgements/`.
- Linked the pages from current project navigation, site footer, shared
  feedback, contribution guide, search index and sitemap.
- Added the owner's requested general thanks to Mingchen Xia (夏铭辰) on the
  Bedford–Taylor page: “We thank Mingchen Xia (夏铭辰) for generously sharing his
  research.” No specific application, incorporated proof, endorsement or
  co-authorship is claimed.
- Kept general research-sharing thanks separate from the adopted-feedback
  ledger. There are no adopted-feedback entries in this initial release.
- Added optional public-credit preferences to the eight reader feedback forms.
  Unanswered preferences never authorize publishing a name. Not being named
  on the acknowledgement page does not make a public GitHub Issue anonymous.
- Added validated, stable, project-scoped contribution records with acceptance,
  implementation and naming-permission evidence. Separate contributions from
  one collaborative Issue may each have their own record and permission.
- Documented same-release updates for incorporated feedback. Builds regenerate
  pages from the reviewed records; no scheduled monitoring, automatic
  acceptance, or new submission inbox is created.

## Verification before publication

- `npm ci` and the legacy `npm run build` passed; 779 page routes were built.
- `npm run check`: 171/171 tests passed, including 24 acknowledgement tests.
- `npm run check:release` passed for both legacy and custom-domain builds,
  including existing frozen mathematical files, source bindings and PDF text.
- Custom-domain `npm run check:domain` passed: 316 mutable pages, 464 frozen
  pages, 76,755 internal links and 1,196 byte-identical historical aliases.
- `HISTORY_BASE_SHA=b08bd41a266bbd4568daf2388f16e492ee2cc811 npm run check:history`
  confirmed no existing snapshots, frozen editions or agent releases changed.
- Browser QA checked the project-to-acknowledgement navigation, the exact
  general thanks, and the feedback link's project/page context without an
  invented mathematical result or edition.
- Narrow-layout QA used 390px preview frames. Both the acknowledgement page
  and Bedford–Taylor overview had document width and scroll width of 375px
  after the scrollbar, with no horizontal overflow; the mobile menu includes
  the acknowledgement link.

GitHub Actions and the live deployment are verified separately after the
source commit. These publication checks do not certify any mathematical claim.
