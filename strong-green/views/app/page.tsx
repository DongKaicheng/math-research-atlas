import type { Metadata } from "next";
import MathText from "@/components/MathText";
import { edition } from "@/lib/content";

export const metadata: Metadata = {
  title: { absolute: "Beilinson–Bloch Heights and the Strong Zero-Curvature Green Conjecture" },
  description: "A research programme on canonical height pairings for algebraic cycles and actual non-Archimedean Green forms, with statements, available proofs, and open problems.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <div className="site-shell simple-home">
    <header className="simple-home-heading">
      <p className="eyebrow">A research programme in arithmetic geometry</p>
      <h1>Beilinson–Bloch Heights and the Strong Zero-Curvature Green Conjecture</h1>
      <p>For degree-zero divisors on a curve, height pairings connect intersection theory with the arithmetic of its Jacobian. The goal here is a canonical Beilinson–Bloch height pairing for homologically trivial cycles of complementary codimension on smooth projective varieties over number fields.</p>
    </header>
    <section className="simple-home-question" aria-labelledby="green-question">
      <h2 id="green-question">The local conjecture</h2>
      <p>Over a finite extension of the p-adic numbers with its fixed absolute value, the strong Green conjecture asks for an actual non-Archimedean Green form for every prescribed homologically trivial cycle. The form must be defined on the exact complement of that cycle and satisfy</p>
      <MathText className="simple-home-equation" text={"\\[\\int_{X^{\\mathrm{an}}\\setminus|Z|^{\\mathrm{an}}}\\gamma_Z\\wedge d'd''\\eta=-\\int_{Z^{\\mathrm{an}}}\\eta\\]"} />
      <p>for every compactly supported complementary actual test form. <a href="/papers/strong-g-programme#conj:strong-green">Read the precise statement.</a></p>
    </section>
    <section className="simple-home-question" aria-labelledby="height-question">
      <h2 id="height-question">From local forms to global heights</h2>
      <p>Turning local forms into a canonical global pairing requires reciprocity, a finite global sum, and independence of representatives and Green choices. Agreement with classical heights, positivity, and arithmetic finiteness are further steps. The programme identifies the main obstacle in each.</p>
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
