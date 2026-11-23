import {bibliography,bundle,edition,sourceFiles} from "@/lib/content";
import {papers} from "@/lib/papers";
export const metadata={title:"Published papers and proof sources",description:"Unsigned public mathematical sources, matching PDFs and source fingerprints."};
export default function Page(){
  const audit=bundle.publication.hypothesisAudit;
  const groups=[
    ["foundations","Local analytic foundations"],
    ["products","Products and Chow transfer"],
    ["models","Models and reduction criteria"],
    ["families","Arithmetic families"],
    ["tropical","Tropical and complete-intersection constructions"],
  ];
  const companion=sourceFiles.filter(file=>file.file.startsWith("research-sources/companion/proofs/"));
  const other=sourceFiles.filter(file=>!file.file.startsWith("research-sources/companion/proofs/"));
  const table=(files:typeof sourceFiles)=><div className="table-scroll"><table className="data-table"><thead><tr><th scope="col">Published source</th><th scope="col">SHA-256</th></tr></thead><tbody>{files.map(file=><tr key={file.file}><td>{file.url?<a href={file.url} download>{file.file.replace(/^research-sources\//,"")}</a>:<span>{file.file}<small className="source-private-note">Provenance record; no public download.</small></span>}</td><td><code className="hash">{file.sha256}</code></td></tr>)}</tbody></table></div>;
  return <div className="site-shell"><header className="page-header"><p className="eyebrow">Proof sources</p><h1>Papers and proof sources.</h1><p>The {papers.length} current articles have full mathematical webpages, standalone PDFs and self-contained LaTeX downloads.</p><div className="hero-actions"><a className="button" href="/papers">Read the papers</a><a className="button button-secondary" href="/results">Results and proofs</a></div></header>
    <section className="section" id="hypothesis-audit"><h2>Review of the 22 former hypotheses</h2>
    <p>Edition {audit.edition} supplies proofs for {audit.promoted} statements formerly labelled Hypothesis and retains {audit.retained} hypotheses. Original statement numbers and link anchors are preserved. The table records the precise scope of each change and links both editions.</p>
    <p>{audit.scopeNote}</p><p>{audit.reviewType}</p>
    <div className="table-scroll"><table className="data-table"><thead><tr><th scope="col">Paper and former statement</th><th scope="col">Current statement</th><th scope="col">Proof and retained scope</th></tr></thead><tbody>{audit.rows.map(row=><tr key={row.paper+":"+row.label} id={"review-"+row.label.replace(/:/g,"-")}><td><a href={row.previousUrl}>{papers.find(p=>p.slug===row.paper)?.title}<br />Hypothesis {row.previousNumber}</a></td><td><a href={row.proofUrl}>{row.currentKind} {row.currentNumber}</a><br /><small>{row.outcome}</small></td><td>{row.scope}<br /><a href={row.sourceUrl}>Matching LaTeX source</a></td></tr>)}</tbody></table></div>
    </section>
    <section className="section" id="companion-proofs"><h2>Companion proofs</h2><p>The <a href="/papers/global-height-pairing">global height paper</a> contains the assembly, reciprocity, proper-intersection, adjunction and model-comparison arguments. The <a href="/papers/pairing-constructions">pairing-domain paper</a> gives the geometric deductions for complete and partial domains.</p>
    <p>The following {companion.length} source records preserve the available companion arguments and their stated hypotheses. Their publication does not change their mathematical review status.</p>
    {groups.map(([id,title])=>{const files=companion.filter(file=>file.file.startsWith("research-sources/companion/proofs/"+id+"/"));return <details className="source-group" key={id}><summary>{title} <small>({files.length} files)</small></summary>{table(files)}</details>;})}</section>
    <section className="section"><h2>Public sources and history</h2><p>This unsigned public edition omits personal attribution from research sources. Its file fingerprints identify the published copies, not signed archival originals. Private editorial material and earlier signed downloads are not part of this GitHub edition.</p>
    <div className="hero-actions"><a className="text-link" href="/versions">Version history</a><a className="text-link" href={"/editions/"+edition.revision+"/research.json"} download>Structured research records</a><a className="text-link" href="/about">Status and review policy</a></div>
    <details className="source-group"><summary>Other published sources and provenance</summary>{table(other)}</details></section>
    <section className="section" id="bibliography"><h2>Primary references</h2><ol className="source-list bibliography">{bibliography.map(ref=><li key={ref.id}><h3><a href={ref.url} rel="noopener noreferrer" target="_blank">{ref.label}</a></h3><p className="reference-locator">{ref.locator}</p><p>{ref.description}</p></li>)}</ol></section>
  </div>;
}
