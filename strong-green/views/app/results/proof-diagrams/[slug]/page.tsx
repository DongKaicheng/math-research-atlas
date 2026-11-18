import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { edition, entries } from '@/lib/content';
import MathText from '@/components/MathText';
import { LogicForest } from '@/components/logic-tree';
import { progressProofById, progressProofs, progressProofPath, validateProgressProofs } from '@/content/progress-proofs.mjs';

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = progressProofById.get(slug);
  if (!item) return notFound();
  return { title: item.title + ' — proof diagram', description: 'Complete logical proof diagram: ' + item.result, alternates: { canonical: item.path } };
}

export default async function ProgressProofPage({ params }: Props) {
  validateProgressProofs(entries, edition.revision);
  const { slug } = await params;
  const item = progressProofById.get(slug);
  if (!item) return notFound();
  const index = progressProofs.indexOf(item);
  const previous = progressProofs[index - 1], next = progressProofs[index + 1];
  return <div className="site-shell research-map progress-proofs" data-proof-case={item.caseId}>
    <header className="map-header">
      <p className="eyebrow">Progress · independent proof diagram</p>
      <h1>{item.title}</h1>
      <MathText text={item.result} />
      <p className="map-edition">{item.status} · Source edition <a href={'/editions/' + edition.revision + '/'}>{edition.revision}</a></p>
      <nav className="proof-page-links" aria-label="Statement and full proof">
        <a href={'/results#' + item.caseId}>Result in Progress →</a>
        <a href={item.proof.href}>{item.proof.label} →</a>
        {item.additionalProofs?.map((source: { href: string; label: string }) => <a key={source.href} href={source.href}>{source.label} →</a>)}
        <a href={progressProofPath}>All result and proof diagrams →</a>
      </nav>
    </header>
    <section className="proof-domain" aria-label="Exact pairing domain"><h2>Domain of the result</h2><MathText text={item.domain} /></section>
    <p className="proof-reading-note">Read the diagrams from top to bottom. Select a numbered connection for its exact hypotheses and deduction, or follow a node to its source. Analytic, model and comparison assumptions retain their stated scope.</p>
    {item.coverage.length > 1 && <nav className="proof-application-navigation" aria-label="Applications within this proof diagram">
      <h2>Result and applications in this diagram</h2>
      <ul>{item.coverage.map((row: { title: string; nodeId: string }) => <li key={row.nodeId}><a href={'#' + row.nodeId}>{row.title}</a></li>)}</ul>
    </nav>}
    <LogicForest trees={item.trees} title={item.title + ': complete proof diagram'} downloadPath={item.svgPath} downloadName={'strong-green-proof-' + item.caseId + '.svg'} />
    <section className="proof-open-step" aria-label="Remaining mathematical problem"><h2>Remaining problem</h2><MathText text={item.gap} /></section>
    <nav className="proof-pagination" aria-label="Other proof diagrams">
      {previous && <a href={previous.path}>← {previous.title}</a>}
      <a href={progressProofPath}>All proof diagrams</a>
      {next && <a href={next.path}>{next.title} →</a>}
    </nav>
  </div>;
}
