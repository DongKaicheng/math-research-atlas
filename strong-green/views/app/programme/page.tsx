import type { Metadata } from "next";
import { programmeSteps, programmeOverview, programmeImplications } from "@/content/organisation.mjs";
import MathText from "@/components/MathText";
import "@/app/programme-layout.css";

export const metadata: Metadata = {
  title: "Research programme: Green forms and Beilinson–Bloch heights",
  description: "Precise objectives, hypotheses and conditional implications for local Green forms, global height pairings, classical comparison, positivity and integral Northcott finiteness.",
  alternates: { canonical: "/programme" },
};

export default function Page() {
  return <div className="site-shell programme-overview">
    <header className="page-header summary-header">
      <p className="eyebrow">Research programme</p>
      <h1>{programmeOverview.title}</h1>
      <p>{programmeOverview.summary}</p>
      <div className="programme-paper-actions">
        <a className="button formal-paper-link" href={programmeOverview.paper}>Read the formal research programme <span aria-hidden="true">→</span></a>
        <a className="programme-pdf-link" href={programmeOverview.pdf} download>Download the programme paper (PDF)</a>
      </div>
      <p className="programme-routes-entry"><a className="text-link" href="/routes">View the research routes <span aria-hidden="true">→</span></a><span>Alternative constructions and the main open steps, at a glance.</span></p>
    </header>

    <section className="programme-target" aria-labelledby="target-heading">
      <h2 id="target-heading">The main objective</h2>
      <MathText text={programmeOverview.target} />
      <p><a href="/papers/global-height-pairing#r16ph:general-height">Theorem 7.5 (PH16)</a> establishes the finite sum of local terms, independence of Green choices and descent to both Chow groups from Strong G at every finite completion in both complementary codimensions, within the <a href="/papers/global-height-pairing#sec:height-hypotheses">stated analytic foundations</a>. This identifies the significance of the local conjecture for the global height problem.</p>
      <p>The <a href="/papers/chow-obstruction-green-pairs#h22:main">Chow obstruction and prescribed Green-pair theorem</a> now establishes Hypothesis 2.2 over the original valued field, for smooth integral projective varieties and every prescribed rational cycle. On the obstruction route, the remaining general local task is vanishing of this class on homologically trivial cycles.</p>
    </section>

    <section className="programme-logic" aria-labelledby="logic-heading">
      <h2 id="logic-heading">The logical implications</h2>
      <p>There are two routes to the global pairing: enlarge the obstruction-zero domain, or apply the proved principal-push theorem directly to strong Green forms. Each route keeps its stated analytic hypotheses and review status.</p>
      <table className="programme-implications">
        <thead><tr><th scope="col">Hypotheses</th><th scope="col">Conclusion</th><th scope="col">Argument</th></tr></thead>
        <tbody>{programmeImplications.map(item => <tr key={item.id}>
          <td data-label="Hypotheses">{item.assumptions}</td>
          <td data-label="Conclusion">{item.conclusion}</td>
          <td data-label="Argument"><a href={item.href}>{item.label} <span aria-hidden="true">→</span></a></td>
        </tr>)}</tbody>
      </table>
    </section>

    <section className="programme-objectives" aria-labelledby="objectives-heading">
      <header><h2 id="objectives-heading">The construction and further research</h2><p>Step 1 is the established curved Green construction. Step 2 is the remaining general source-vanishing problem. Step 3 is the proved conditional passage to a full height pairing. Step 4 concerns comparison with classical constructions. Steps 5–6 ask for additional arithmetic properties.</p></header>
      <nav className="programme-section-links" aria-label="Research problems">{programmeSteps.map(step => <a key={step.id} href={"#" + step.id}>{step.number}. {step.title}</a>)}</nav>
      {programmeSteps.map(step => <section className="programme-problem" id={step.id} key={step.id}>
        <h3><span>{step.number}.</span> {step.title}</h3>
        <p className="programme-problem-goal">{step.goal}</p>
        <div className="programme-problem-formula"><MathText text={step.formula} /></div>
        <dl>
          <div><dt>{step.methodLabel || 'Proposed argument'}</dt><dd>{step.method}</dd></div>
          <div><dt>Consequence</dt><dd>{step.output}</dd></div>
          <div><dt>Prerequisites</dt><dd>{step.depends}</dd></div>
        </dl>
        <a className="programme-section-paper" href={step.paper}>{step.linkLabel || 'Precise statement and research plan'} <span aria-hidden="true">→</span></a>
      </section>)}
    </section>

    <section className="programme-reading">
      <h2>Formal statements and available proofs</h2>
      <p>The programme paper gives the precise objectives and conditional arguments. The progress page collects the constructions already available and their remaining hypotheses.</p>
      <nav className="summary-paper-links" aria-label="Further programme reading">
        <a className="text-link" href="/papers/strong-g-programme">Research programme</a>
        <a className="text-link" href="/papers/arithmetic-conjectures">Arithmetic conjectures</a>
        <a className="text-link" href="/results">Progress and proofs</a>
      </nav>
    </section>
  </div>;
}
