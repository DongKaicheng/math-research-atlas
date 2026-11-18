import type { Metadata } from "next";
import { pairingGroups, pairingProgressIntroduction, pairingSourceCoverage } from "@/content/pairing-progress.mjs";
import { progressProofPath, progressApplicationLink } from "@/content/progress-proofs.mjs";
import MathText from "@/components/MathText";
import "@/app/pairing-progress.css";

export const metadata: Metadata = {
  title: "Constructions of Beilinson–Bloch height pairings",
  description: "Pairings on cycle subgroups and full homologically trivial Chow groups, their geometric applications, exact hypotheses and remaining construction problems.",
  alternates: { canonical: "/results" },
};

type ProofLink = { href: string; label: string };
type PairingCase = {
  id: string; title: string; result?: string; domain: string; status: string; established: string;
  proof: ProofLink; additionalProofs?: ProofLink[]; dependencies: string[]; gap: string;
  records?: string[]; children?: { title: string; text: string }[];
};
type PairingGroup = { id: string; title: string; summary: string; cases: PairingCase[] };
const groups = pairingGroups as unknown as PairingGroup[];
const legacyAnchors: Record<string, string> = { 'algebraically-trivial': 'green-constructions', 'arithmetic-properties': 'arithmetic-reductions', 'classical-comparison': 'determinant-metrics' };

export default function Page() {
  return <div className="site-shell pairing-progress">
    <header className="page-header summary-header">
      <p className="eyebrow">Progress</p>
      <h1>{pairingProgressIntroduction.title}</h1>
      <p>{pairingProgressIntroduction.summary}</p>
      <div className="summary-paper-links">
        <a className="text-link" href={progressProofPath}>Complete result and proof diagrams →</a>
        <a className="text-link" href="/papers/pairing-constructions">Geometric results and proofs →</a>
        <a className="text-link" href="/papers/global-height-pairing">Construction of the global pairing →</a>
        <a className="text-link" href="/routes">The three research routes →</a>
      </div>
    </header>
    <section className="pairing-convention" aria-label="Domain and proof conventions">
      <MathText text={pairingProgressIntroduction.convention} />
      <details className="pairing-foundations"><summary>Hypotheses of the construction</summary><p>{pairingProgressIntroduction.evidence}</p><a href="/papers/global-height-pairing#sec:height-hypotheses">Precise analytic hypotheses →</a></details>
    </section>
    <nav className="pairing-jumps" aria-label="Pairing domains">
      {groups.map(group => <a key={group.id} href={"#" + group.id}>{group.title}</a>)}
    </nav>
    {groups.map(group => <section className="pairing-group" id={group.id} key={group.id}>
      <header><h2>{group.title}</h2><p>{group.summary}</p></header>
      {group.cases.map(item => <article className="pairing-case" id={item.id} key={item.id}>
        {legacyAnchors[item.id] && <span id={legacyAnchors[item.id]} className="legacy-anchor" />}
        <h3>{item.title}</h3>
        {item.result && <MathText className="pairing-result" text={item.result} />}
        <div className="pairing-domain"><MathText text={item.domain} /></div>
        <p className="pairing-evidence">{item.status}</p>
        <nav className="pairing-proof-links" aria-label={item.title + ": proofs"}>
          <a href={progressProofPath + '/' + item.id} data-proof-page={item.id}>Read the proof diagram →</a>
          <a href={item.proof.href}>{item.proof.label} →</a>
          {item.additionalProofs?.map(link => <a key={link.href} href={link.href}>{link.label} →</a>)}
        </nav>
        <details className="pairing-detail">
          <summary>Proof, applications and hypotheses</summary>
          <div>
            <h4>Proof of the result</h4><MathText text={item.established} />
            {item.children && item.children.length > 0 && <section className="pairing-consequences">
              <h4>Applications</h4>
              <ol>{item.children.map(child => <li key={child.title}><h5>{child.title}</h5><MathText text={child.text} /><a className="pairing-application-diagram" href={progressApplicationLink(item.id, child.title)}>View this deduction in the proof diagram →</a></li>)}</ol>
            </section>}
            <h4>Hypotheses used</h4>
            <ul>{item.dependencies.map(dep => <li key={dep}><MathText text={dep} /></li>)}</ul>
            <section className="pairing-gap"><h4>What remains to be proved</h4><MathText text={item.gap} /></section>
            {item.records && <nav className="pairing-records" aria-label="Permanent records">{item.records.map(id => <a key={id} href={"/entries/" + id}>{id}</a>)}</nav>}
          </div>
        </details>
      </article>)}
    </section>)}
    <section className="pairing-source-note" id="proof-coverage">
      <h2>Papers and proofs</h2>
      {pairingSourceCoverage.map(item => <div className="pairing-coverage-item" key={item.title}><h3><a href={item.href}>{item.title}</a></h3><p>{item.scope}</p><p>{item.status}</p></div>)}
      <nav className="summary-paper-links">
        <a className="text-link" href="/sources#companion-proofs">Original companion proofs</a>
        <a className="text-link" href="/dependencies">Permanent proof dependencies</a>
        <a className="text-link" href="/papers">All papers and PDF downloads</a>
      </nav>
    </section>
  </div>;
}
