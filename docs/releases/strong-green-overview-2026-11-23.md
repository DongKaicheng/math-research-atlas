# Strong Green Overview — 23 November 2026

## Purpose and scope

Atlas presentation revision 4 rewrites the current project Overview around
the requested reading order: the goal and historical significance of
Beilinson–Bloch heights, the Strong Green conjecture, its conditional passage
to the height pairing, and links to other approaches. The goal and target
pairing appear before the proof machinery. The internally proved curved
Green construction is a short progress section after the main argument.

The mathematical edition remains v0.5.2. No theorem, proof, status, source
binding, PDF or frozen-edition byte is changed. The previous Atlas bundle is
preserved exactly in `content/history/strong-green/v3.json`. The original
Overview anchors `green-question`, `height-question` and `chow-green-theorem`
remain available. Other projects are outside the edit scope.

## Mathematical and editorial checks

- The Strong Green statement retains the original valued field, geometric
  homological triviality, the exact prescribed support complement, the actual
  form degree and every compact actual complementary test.
- The compact diagram projects the existing direct-height branch in
  `logical-map.mjs`. Its three canonical premises are shown as Strong Green
  and a grouped foundations input; both foundation records are rendered from
  the same source data in the explanation. The BOTH gate is explicit.
- Theorem 7.5 is a proved conditional implication. The Overview identifies
  every finite completion and both complementary degrees, keeps the standing
  analytic/global hypotheses, and does not recast its established assembly
  steps as open work. Comparison with classical constructions retains its
  separate hypotheses.
- Desktop SVG and narrow-screen connected HTML use the same input/output
  records. Nodes link to the conjecture, hypotheses and proof. The current
  Overview stylesheet is separate from immutable edition assets.
- Two read-only editorial/source reviews checked logical fidelity and reading
  order; these are publication reviews, not new proof certifications.

Historical context was checked against Künnemann, *Height pairings for
algebraic cycles on abelian varieties* (2001), Introduction and bibliography:
https://www.numdam.org/article/ASENS_2001_4_34_4_503_0.pdf

External route descriptions were checked against Zhang, *Standard Conjectures
and Height Pairings*, https://arxiv.org/abs/2009.07089v3, and Bloch, *Heights via
p-Adic Points* (2023), https://link.springer.com/article/10.1134/S0081543823010030.
The latter route retains its stated good-reduction and classical-comparison
conjectures. The Bedford–Taylor project is linked as a related analytic
programme.

## Validation

The preparation baseline is
`549d16b394a1f3b041d0c704a071ab599d453e08`.

- Offline dependency installation and both legacy/custom-domain builds passed.
- All 189 repository tests passed. The existing homepage research-map link
  marker was preserved after the initial navigation regression check.
- Custom-domain checks passed, including 195,812 internal links, retained
  historical aliases, search destinations and anchored feedback contexts.
- Both release-integrity checks passed. The Strong Green corpus retains 685
  frozen files; the Bedford–Taylor release and all its bindings are unchanged.
- Rendered HTML has no duplicate IDs or KaTeX error nodes; all original
  homepage anchors and the exact foundation link are present.

The publishing PR records the protected-history check, actual GitHub Actions
result, deployment and subsequent live browser inspection. These are separate
from the content review above. The remote browser cannot reach the local
loopback preview, so the visual UI checks use the published public page.
