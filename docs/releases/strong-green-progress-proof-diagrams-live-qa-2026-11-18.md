# Live verification of Progress proof diagrams — 18 November 2026

This record verifies the public reading interface published in commit
`d7cde5c38f1d6117bef89ed1a82ac7af4db49c30`, with source tree
`2df88aac2e489e8ec3c0c5bb39a9b993ed34a382`. It supplements
`strong-green-progress-proof-diagrams-2026-11-18.md` and does not change the
mathematical edition or certify the underlying proofs.

## Deployment

GitHub Actions run `44302177445` completed successfully. Its build and deploy
jobs both reported success. The public homepage displayed the new **Proof
diagrams** navigation entry and the **Result and proof diagrams** homepage
entry after deployment.

## Public browser checks

- The aggregate page displayed **105** fully expanded trees, **777** scoped
  nodes and **247** logical junctions. It contained no collapsible `details`
  elements. At a desktop CSS viewport width of 1348 pixels, the document had
  no horizontal body overflow.
- The independent kernel-domain page displayed three trees, 33 nodes and
  nine junctions, without collapsed branches. Its diagram zoom changed from
  100% to 110% and reset to 100% through the visible controls.
- Its **Exact support and residues** jump link landed on the drawn tree.
  The linked proof opened `papers/global-height-pairing/#r16h:P`; the source
  anchor was present.
- From Progress, opening the endpoint result's applications and selecting
  **View this deduction in the proof diagram** opened the independent
  endpoint page at `#proof-endpoints-low-dimension`. The target was a real
  drawn conclusion with its ALL gate and three connected premises.
- **Download the complete linked SVG** completed a browser download from
  the endpoint proof page.
- **Shared feedback** opened the existing Atlas board with the Strong Green
  project, mathematical edition `v0.5.1`, and the exact endpoint node URL.
  The optional result ID remained empty. No issue was submitted during QA.
- The aggregate page was left open for review. The screenshots below are
  unmodified desktop browser captures. No mobile-device emulation or narrow
  viewport verification is claimed; the stylesheet's narrow-screen scroll
  behavior remains covered by implementation and automated checks.

## Evidence

- `strong-green-proof-qa/proof-diagrams-index-live.jpg`: aggregate reading
  page and the independent-page navigation.
- `strong-green-proof-qa/endpoints-node-live.jpg`: a Progress application
  reached through its link, showing the highlighted conclusion, the ALL
  junction, and the three premises with proof hyperlinks.

All mathematical hypotheses and statuses remain those of the source edition.
In particular, the imported divisor and zero-cycle inputs are not presented
as independently recovered full proofs.
