import type { Metadata } from 'next';
import { edition, entries } from '@/lib/content';
import { pairingGroups } from '@/content/pairing-progress.mjs';
import { progressProofById, progressProofTrees, progressProofSvgPath, validateProgressProofs } from '@/content/progress-proofs.mjs';
import { LogicForest } from '@/components/logic-tree';

export const metadata: Metadata = {
  title: 'Progress: complete result and proof diagrams',
  description: 'Fully expanded logical diagrams for every Progress result and application: exact hypotheses, intermediate deductions, alternative proofs and links to the original arguments.',
  alternates: { canonical: '/results/proof-diagrams' },
};

export default function ProgressProofIndex() {
  const coverage = validateProgressProofs(entries, edition.revision);
  return <div className="site-shell research-map progress-proofs">
    <header className="map-header">
      <p className="eyebrow">Progress · results and their proofs</p>
      <h1>Proof diagrams</h1>
      <p>Follow the proof of each result from its hypotheses through the intermediate deductions to its conclusion. Every diagram is fully drawn below; each result also has its own reading page.</p>
      <p className="map-edition">Based on mathematical edition <a href={'/editions/' + edition.revision + '/'}>{edition.revision}</a> · {coverage.cases} result families · {coverage.applications} applications and subresults · {coverage.trees} fully expanded proof trees</p>
      <nav className="proof-page-links" aria-label="Proof diagram resources">
        <a href="/results">Read Progress →</a><a href="/research-map">Whole-project logical map →</a><a href="/papers/pairing-constructions">Geometric results and full proofs →</a>
      </nav>
    </header>
    <section className="proof-reading-note" aria-label="How the proof diagrams relate to the papers">
      <p>The diagrams retain the hypotheses and proof status of the source papers. A geometric deduction under an analytic or model hypothesis remains conditional on that input. The full statement and proof are linked at the inference that uses them.</p>
    </section>
    <nav className="proof-case-navigation" aria-label="Independent result and proof pages">
      {pairingGroups.map(group => <section key={group.id}>
        <h2>{group.title}</h2>
        <ul>{group.cases.map(item => {
          const proof = progressProofById.get(item.id)!;
          return <li key={item.id}><a href={proof.path} data-proof-page={item.id}>{item.title} →</a><a className="proof-jump" href={'#' + proof.trees[0].id}>Locate in the complete diagram</a></li>;
        })}</ul>
      </section>)}
    </nav>
    <LogicForest trees={progressProofTrees} title="Progress: complete result and proof diagrams" downloadPath={progressProofSvgPath} downloadName="strong-green-progress-proofs.svg" />
    <nav className="map-footer-links" aria-label="Continue reading"><a href="/results">Progress</a><a href="/research-map">Whole-project logical map</a><a href="/papers">Papers and PDFs</a></nav>
  </div>;
}
