import type { Metadata } from "next";
import MathText from "@/components/MathText";
import { edition } from "@/lib/content";

export const metadata: Metadata = {
  title: { absolute: "Beilinson–Bloch Heights and the Strong Zero-Curvature Green Conjecture" },
  description: "Chow obstructions and prescribed curved Green pairs are established. Strong G supplies the remaining local existence input for full Beilinson–Bloch heights under the stated analytic foundations.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <div className="site-shell simple-home">
    <header className="simple-home-heading">
      <p className="eyebrow">A research programme in arithmetic geometry</p>
      <h1>Beilinson–Bloch Heights and the Strong Zero-Curvature Green Conjecture</h1>
      <p>For degree-zero divisors on a curve, height pairings connect intersection theory with the arithmetic of its Jacobian. The goal here is a canonical Beilinson–Bloch height pairing for homologically trivial cycles of complementary codimension on smooth projective varieties over number fields.</p>
    </header>
    <section className="simple-home-question" aria-labelledby="height-question">
      <p className="eyebrow">Theorem 7.5 · PH16 · proved conditional implication</p>
      <h2 id="height-question">Strong Green forms give Beilinson–Bloch heights</h2>
      <p>Within the <a href="/papers/global-height-pairing#sec:height-hypotheses">stated analytic foundations</a>, the <a href="/papers/global-height-pairing#r16ph:general-height">principal-push theorem</a> proves that Strong G at every finite completion, in both complementary codimensions, gives a canonical real Beilinson–Bloch height pairing on the full geometrically homologically trivial rational Chow groups.</p>
      <p>The proof establishes independence of Green choices, reciprocity, finiteness of the sum over places, and descent through rational equivalence in both variables. Thus solving the general strong Green conjecture supplies the local existence input for this full height construction.</p>
      <p>General Strong G remains open. Classical comparisons, positivity, nondegeneracy and arithmetic finiteness retain their own hypotheses and research questions. The analytic foundations retain their stated <a href="/about">mathematical review status</a>.</p>
      <p><a href="/papers/global-height-pairing#r16ph:general-height">Read Theorem 7.5 and its proof →</a> · <a href="/routes/green-forms">Follow the construction →</a></p>
    </section>
    <section className="simple-home-question" aria-labelledby="chow-green-theorem">
      <p className="eyebrow">Hypothesis 2.2 · internal proof completed</p>
      <h2 id="chow-green-theorem">Chow obstructions and prescribed Green pairs</h2>
      <p>The <a href="/papers/chow-obstruction-green-pairs#h22:main">Chow obstruction and prescribed Green-pair theorem</a> establishes the local construction over the original finite extension of the p-adic numbers. For every smooth integral projective variety, every positive codimension up to its dimension, and every prescribed rational cycle, it constructs a Chow-invariant actual Bott–Chern class and an actual Green form with that curvature on the exact support complement. The variety need not be geometrically integral, and the cycle need not be homologically trivial.</p>
      <MathText text={String.raw`Writing \(U_Z=X^{\mathrm{an}}\setminus|Z|^{\mathrm{an}}\), the pair satisfies`} />
      <MathText className="simple-home-equation" text={String.raw`\[\int_{U_Z}G_Z\wedge d'd''\eta+\int_{Z^{\mathrm{an}}}\eta=\int_{X^{\mathrm{an}}}\Omega_Z\wedge\eta,\qquad [\Omega_Z]=\mathfrak o^r_{X,K}([Z]).\]`} />
      <p>The identity holds for every compact complementary actual test form, with the original cycle coefficients and absolute value. If the obstruction vanishes, a global actual primitive removes the curvature. The remaining general problem on this route is to prove that the obstruction vanishes on every homologically trivial Chow class.</p>
      <p><a href="/papers/chow-obstruction-green-pairs#h22:main">Read the theorem and complete proof →</a> · <a href="/programme#source">The remaining vanishing problem →</a></p>
    </section>
    <section className="simple-home-question" aria-labelledby="green-question">
      <h2 id="green-question">The local conjecture</h2>
      <p>Over a finite extension of the p-adic numbers with its fixed absolute value, the strong Green conjecture asks for an actual non-Archimedean Green form for every prescribed homologically trivial cycle. The form must be defined on the exact complement of that cycle and satisfy</p>
      <MathText className="simple-home-equation" text={"\\[\\int_{X^{\\mathrm{an}}\\setminus|Z|^{\\mathrm{an}}}\\gamma_Z\\wedge d'd''\\eta=-\\int_{Z^{\\mathrm{an}}}\\eta\\]"} />
      <p>for every compactly supported complementary actual test form. <a href="/papers/strong-g-programme#conj:strong-green">Read the precise statement.</a></p>
    </section>
    <nav className="simple-home-links" aria-label="Read the research">
      <a className="home-map-link" href="/research-map"><span>Logical research map <span aria-hidden="true">→</span></span><small>How the results fit together: implications, exact prerequisites and open steps</small></a>
      <a className="home-map-link" href="/results/proof-diagrams"><span>Result and proof diagrams <span aria-hidden="true">→</span></span><small>Complete proof trees for the Progress results and their applications</small></a>
      <a className="home-routes-link" href="/routes"><span>Research routes <span aria-hidden="true">→</span></span><small>Logical chains, alternative approaches, and the main open steps</small></a>
      <a href="/conjectures"><span>Conjectures and plan</span><small>Statements, implications, and core difficulties</small></a>
      <a href="/results"><span>Pairing constructions and progress</span><small>Available proofs, assumptions, and remaining gaps</small></a>
      <a href="/papers"><span>Read the papers</span><small>Full mathematical articles and separate PDF downloads</small></a>
    </nav>
    <p className="simple-home-edition">Edition {edition.revision} · <a href="/versions">Version history</a> · <a href="/feedback">Send a correction or question</a></p>
  </div>;
}
