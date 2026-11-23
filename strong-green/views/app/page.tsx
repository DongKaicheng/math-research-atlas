import type { Metadata } from "next";
import MathText from "@/components/MathText";
import HeightOverviewDiagram from "@/components/HeightOverviewDiagram";
import { edition } from "@/lib/content";

export const metadata: Metadata = {
  title: { absolute: "Beilinson–Bloch Heights and the Strong Zero-Curvature Green Conjecture" },
  description: "An unconditional construction of Beilinson–Bloch heights is the goal. Explore the Strong Green conjecture, its local-to-global height theorem, and alternative approaches.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <div className="site-shell sg-overview">
    <header className="sg-overview-heading" id="project-goal">
      <p className="eyebrow">The goal of this project</p>
      <h1>Beilinson–Bloch heights<br /><span>and the Strong Green conjecture</span></h1>
      <p className="sg-overview-lead">We seek an unconditional construction of the canonical real Beilinson–Bloch height pairing in arbitrary dimension. Our approach is to construct zero-curvature Green forms on non-Archimedean analytic spaces and assemble their local integrals into a global height.</p>
      <MathText className="sg-overview-math sg-target-pairing" text={String.raw`\[h_X:\operatorname{CH}^r(X)_{\mathbb Q,\mathrm{hom}}\times\operatorname{CH}^s(X)_{\mathbb Q,\mathrm{hom}}\longrightarrow\mathbb R,\qquad r+s=n+1.\]`} />
      <MathText className="sg-overview-notation" text={String.raw`Here \(X/F\) is smooth, projective and geometrically integral over a number field, \(n=\dim X\), and \(r,s\geq1\). The subscript \(\mathrm{hom}\) denotes cycles whose geometric cohomology class is zero, modulo rational equivalence.`} />
      <nav className="sg-overview-jump" aria-label="On this overview">
        <a href="#history">Why heights?</a><a href="#green-question">Strong Green</a><a href="#height-question">From Green forms to heights</a><a href="#other-routes">Other approaches</a>
      </nav>
    </header>

    <section className="sg-overview-section" aria-labelledby="history">
      <p className="eyebrow">History and significance</p>
      <h2 id="history">From heights on curves to higher algebraic cycles</h2>
      <p>For degree-zero divisors on a curve, height pairings are governed by the Néron–Tate theory of its Jacobian. Bloch and Beilinson developed higher-codimension height pairings in the 1980s; Gillet–Soulé’s arithmetic intersection theory provides a construction through arithmetic models. <a className="sg-reference" href="https://www.numdam.org/article/ASENS_2001_4_34_4_503_0.pdf">Historical background and the abelian-variety case</a>.</p>
      <p>A homologically trivial cycle can still carry arithmetic information that its cohomology class does not detect. Heights measure this finer information and enter <a href="https://www.numdam.org/article/ASENS_2001_4_34_4_503_0.pdf#page=2">conjectural formulas for the leading terms of motivic <i>L</i>-functions</a>. The problem is to construct the pairing for general varieties, with local contributions that combine into a number depending only on the two Chow classes.</p>
    </section>

    <section className="sg-overview-section sg-main-conjecture" aria-labelledby="green-question">
      <div className="sg-section-label"><p className="eyebrow">Our main conjecture</p><span className="sg-open-label">Open in general</span></div>
      <h2 id="green-question">The strong zero-curvature Green conjecture</h2>
      <p>Strong Green asks for an actual non-Archimedean differential form whose second derivative cancels the integration current of a prescribed homologically trivial cycle. Here the forms belong to Mihatsch’s sheaf of actual δ-forms.</p>
      <MathText className="sg-overview-prose" text={String.raw`Fix a finite extension \(K/\mathbb Q_p\) with its absolute value, a smooth projective geometrically integral \(K\)-variety \(X\) of dimension \(n\), and \(1\leq r\leq n\). For every rational codimension-\(r\) cycle \(Z\) with zero geometric cycle class, the conjecture asks for \(\gamma_Z\in\mathcal B^{r-1,r-1}(U_Z)\), where \(U_Z=X^{\mathrm{an}}\setminus|Z|^{\mathrm{an}}\), such that`} />
      <MathText className="sg-overview-math" text={String.raw`\[\int_{U_Z}\gamma_Z\wedge d'd''\eta=-\int_{Z^{\mathrm{an}}}\eta.\]`} />
      <MathText className="sg-overview-prose" text={String.raw`This identity must hold for every \(\eta\in\mathcal B_c^{n-r,n-r}(X^{\mathrm{an}})\). The form lives over the original valued field, on the exact complement of the prescribed cycle, and is tested against all compactly supported actual forms.`} />
      <p className="sg-section-links"><a href="/papers/strong-g-programme#conj:strong-green">Read the precise conjecture and programme →</a></p>
    </section>

    <section className="sg-overview-section" aria-labelledby="height-question">
      <p className="eyebrow">The local-to-global argument</p>
      <h2 id="height-question">Why Strong Green would give Beilinson–Bloch heights</h2>
      <p><a href="/papers/global-height-pairing#r16ph:general-height">Theorem 7.5</a> proves this passage within its <a href="/papers/global-height-pairing#sec:height-hypotheses">standing analytic and global foundations</a>. Strong Green is required at every finite completion, for every prescribed geometrically homologically trivial cycle in both complementary codimensions.</p>
      <HeightOverviewDiagram />
      <MathText className="sg-overview-prose" text={String.raw`Choose disjoint representatives \(Z,W\). At a finite place \(v\), integrate the Green form for \(Z\) over \(W\); at the archimedean places use the classical Green pairing. Then take the normalized sum:`} />
      <MathText className="sg-overview-math" text={String.raw`\[\begin{aligned}\lambda_v(Z,W)&=\int_{W_{F_v}^{\mathrm{an}}}\gamma_{Z,v} &&\text{(finite }v\text{)},\\[4pt]h_X([Z],[W])&=\sum_v\frac{[F_v:\mathbb Q_v]}{[F:\mathbb Q]}\,\lambda_v(Z,W).\end{aligned}\]`} />
      <p>Good-place vanishing makes the sum finite. The principal transformation law and the product formula make it independent of rational-equivalence representatives; reciprocity gives symmetry and independence of Green choices. These are parts of the theorem’s proof under the displayed foundations.</p>
      <p className="sg-section-links"><a href="/papers/global-height-pairing#r16ph:general-height">Read the height theorem and proof →</a><a className="home-map-link" href="/research-map">Explore the full logical research map →</a></p>
      <p className="sg-overview-note">Comparison with classical model constructions and further properties of the height have their own <a href="/papers/global-height-pairing#sec:height-remaining">hypotheses and research questions</a>.</p>
    </section>

    <aside className="sg-overview-progress" aria-labelledby="chow-green-theorem">
      <p className="eyebrow">Current progress</p>
      <h2 id="chow-green-theorem">The curved Green construction is now proved internally</h2>
      <p><a href="/papers/strong-g-programme#hyp:green-pairs">Theorem 2.2</a> constructs a curved actual Green pair for every prescribed rational cycle and identifies its Chow-invariant curvature obstruction. If that obstruction vanishes, a global primitive removes the curvature and gives a strong Green form. General vanishing on homologically trivial classes remains open.</p>
      <p className="sg-section-links"><a href="/papers/chow-obstruction-green-pairs#h22:main">Complete proof →</a><a href="/results">All results and known cases →</a></p>
    </aside>

    <section className="sg-overview-section" aria-labelledby="other-routes">
      <p className="eyebrow">Other approaches to the height problem</p>
      <h2 id="other-routes">Three routes to explore</h2>
      <div className="sg-route-list">
        <article>
          <h3><a href="/routes/obstruction-vanishing">Vanishing on global cycle classes <span aria-hidden="true">→</span></a></h3>
          <p>Use the curved Green construction and prove that its local obstruction vanishes on classes coming from the number field, at every finite place and in both degrees. This can suffice for the height construction without solving Strong Green for every local cycle.</p>
          <a className="sg-route-detail" href="/papers/obstruction-height-route">The obstruction route and its precise hypotheses</a>
        </article>
        <article>
          <h3><a href="/routes/zhang">Arithmetic models and admissible liftings <span aria-hidden="true">→</span></a></h3>
          <p>Correct cycle closures by vertical cycles, then apply arithmetic intersection. Zhang’s approach relates the general lifting problem to standard conjectures on degenerate fibres.</p>
          <div className="sg-route-reading"><a href="/papers/zhang-height-route">Admissible liftings and arithmetic intersection</a><a href="https://arxiv.org/abs/2009.07089v3">Zhang’s paper</a></div>
        </article>
        <article>
          <h3><a href="https://link.springer.com/article/10.1134/S0081543823010030">Cohomology and adelic torus bundles <span aria-hidden="true">→</span></a></h3>
          <p>Bloch’s <i>Heights via p-Adic Points</i> studies real heights through cohomological extensions and adelic torus bundles. Good-reduction vanishing and agreement with the classical Beilinson–Bloch pairing are explicit conjectures in that construction.</p>
          <a className="sg-route-detail" href="https://link.springer.com/article/10.1134/S0081543823010030">Read Bloch’s 2023 article</a>
        </article>
      </div>
      <p className="sg-related-programme"><strong>Related analytic programme.</strong> <a href="https://openmath-atlas.org/projects/bedford-taylor/">Non-Archimedean Bedford–Taylor theory</a> develops products, potentials and integration for Berkovich currents. It is a direction for developing the analytic tools for height theory.</p>
      <p className="sg-section-links"><a href="/routes">Compare the project’s research routes →</a><a href="/papers/determinant-metrics">Biextensions and determinant metrics →</a></p>
    </section>

    <nav className="sg-overview-reading" aria-label="Continue reading">
      <a href="/papers">Papers and PDFs</a><a href="/programme">Research plan</a><a href="/results/proof-diagrams">Detailed proof diagrams</a><a href="/conjectures">All conjectures</a>
    </nav>
    <p className="sg-overview-edition">Mathematical edition {edition.revision} · <a href="/versions">Version history</a> · <a href="/feedback">Send a correction or question</a></p>
  </div>;
}
