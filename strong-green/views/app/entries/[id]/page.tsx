import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MathText from "@/components/MathText";
import FeedbackForm from "@/components/FeedbackForm";
import { entries, edition, getEntry, dependents, kindLabels, label, sourcePdf } from "@/lib/content";
import { papersForEntry } from "@/lib/papers";
type Props = { params: Promise<{ id: string }> };
export function generateStaticParams() { return entries.map(({ id }) => ({ id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params; const entry = getEntry(id);
  if (!entry) return { title: "Record not found", robots: { index: false } };
  // Definition records retain the legacy draft status without being draft claims.
  // Match their existing public "Definition" label; do not promote a proof status.
  const isDraftClaim = entry.status === "draft" && entry.kind !== "definition";
  return { title: entry.title, description: entry.summary, alternates: { canonical: "/entries/" + entry.id }, robots: isDraftClaim ? { index: false, follow: true } : undefined };
}
export default async function EntryPage({ params }: Props) {
  const { id } = await params; const entry = getEntry(id); if (!entry) notFound();
  const reverse = dependents(id); const pdf = sourcePdf(entry); const papers = papersForEntry(id);
  const proofTitle = entry.proofMode === "proof" ? "Argument" : entry.proofMode === "outline" ? "Proof outline" : entry.status === "draft" ? "Draft proof route" : "Proof / construction";
  return <div className="site-shell">
    <header className="page-header record-header"><a className="text-link" href="/records">Permanent record index</a>
      <div className="record-meta"><span>{entry.id}</span><span>{kindLabels[entry.kind]}</span><span className={"status status-" + entry.status}>{label(entry)}</span></div>
      <h1>{entry.title}</h1><p>{entry.summary}</p><p className="revision-line">{edition.revision} · {entry.topic}</p>
    </header>
    <div className="content-grid">
      <article className="article">
        {papers.length>0&&<aside className="record-paper-link"><p className="eyebrow">Read this claim in context</p><p>This permanent record is the claim-level reference. The complete mathematical exposition is organized in the linked articles.</p>{papers.map(paper=><a key={paper.slug} href={'/papers/'+paper.slug}>{paper.title}</a>)}</aside>}
        {id === 'BB-H16-KERNEL-DOMAIN' && <aside className="record-paper-link"><p className="eyebrow">Source update · edition 0.3.0</p><p>The exact H16, reciprocity, adjunction and model-comparison proof sources have now been recovered. This permanent record preserves its earlier synthesis and conditional status; the new paper supplies the full proof texts and states their analytic hypotheses.</p><a href="/papers/global-height-pairing">Read the global pairing construction and proofs</a></aside>}
        <section id="statement"><h2>{entry.kind === "question" ? "The problem" : "Statement"}</h2><MathText text={entry.statement} /></section>
        {entry.motivation && <section id="motivation"><h2>Motivation</h2><MathText text={entry.motivation} /></section>}
        {entry.proof && <section className="proof" id="proof"><h2>{proofTitle}</h2><MathText text={entry.proof} />{entry.proofMode !== "proof" && <p className="proof-source-note">The source below contains the expanded argument and its hypotheses.</p>}</section>}
        {entry.approach && <section id="approach"><h2>Proof programme</h2><MathText text={entry.approach} /></section>}
        <section id="source"><h2>Source and version</h2><div className="source-record"><p><strong>{entry.source.locator}</strong></p><p className="source-filename">{entry.source.file}</p><p>{pdf && <a className="button button-secondary" href={pdf}>Read the manuscript (PDF)</a>}{" "}{entry.source.url && <a className="text-link" href={entry.source.url} download>Download published source</a>}</p>{!entry.source.url && <p>This record preserves the earlier mathematical synthesis. The current papers and source library provide the recovered original arguments and their stated hypotheses.</p>}<details><summary>File and record fingerprints</summary><p>Published source SHA-256</p><code className="hash">{entry.source.sha256}</code><p>Statement / argument record SHA-256</p><code className="hash">{entry.contentHash}</code><p>Public source copies omit personal attribution; each fingerprint identifies the bytes of that published copy.</p></details></div></section>
        {entry.references.length > 0 && <section id="references"><h2>References</h2><ol className="source-list">{entry.references.map(ref => <li key={ref.url}><a href={ref.url} target="_blank" rel="noopener noreferrer">{ref.label}</a>{ref.locator && <p>{ref.locator}</p>}</li>)}</ol></section>}
        <FeedbackForm entryId={entry.id} revision={edition.revision} />
      </article>
      <aside className="sidebar">
        <h3>In this record</h3><a href="#statement">Statement</a>{entry.motivation && <a href="#motivation">Motivation</a>}{entry.proof && <a href="#proof">{proofTitle}</a>}{entry.approach && <a href="#approach">Proof programme</a>}<a href="#source">Source and version</a>
        <h3>Declared inputs / context</h3>{entry.dependencies.length ? <ul>{entry.dependencies.map(dep => <li key={dep}><a href={"/entries/" + dep}><span className="record-id">{dep}</span><span>{getEntry(dep)?.title}</span></a>{entry.dependencyNotes?.[dep] && <p className="dependency-note">{entry.dependencyNotes[dep]}</p>}</li>)}</ul> : <p>No internal prerequisite is declared. The statement and cited sources specify the hypotheses.</p>}
        <h3>Used by</h3>{reverse.length ? <ul>{reverse.map(item => <li key={item.id}><a href={"/entries/" + item.id}><span className="record-id">{item.id}</span><span>{item.title}</span></a></li>)}</ul> : <p>No downstream record in this edition.</p>}
        <a href="/dependencies">Full dependency index ↗</a><a href="/about">Status policy ↗</a><a href={"/versions/" + edition.revision}>Frozen edition ↗</a>
      </aside>
    </div>
  </div>;
}
