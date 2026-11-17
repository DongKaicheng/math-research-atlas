import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { papers, getPaper } from "@/lib/papers";
import { edition, getEntry, label } from "@/lib/content";
type Props={params:Promise<{slug:string}>};
export function generateStaticParams(){return papers.map(({slug})=>({slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;const paper=getPaper(slug);if(!paper)return{title:'Paper not found',robots:{index:false}};
  return{title:paper.title,description:paper.summary,alternates:{canonical:'/papers/'+slug},openGraph:{type:'article',title:paper.title,description:paper.summary,url:edition.canonical+'/papers/'+slug}};
}
export default async function PaperPage({params}:Props){
  const {slug}=await params;const paper=getPaper(slug);if(!paper)notFound();
  const linked=paper.entries.map(getEntry).filter((e):e is NonNullable<typeof e>=>Boolean(e));
  const date=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(paper.date+'T00:00:00Z'));
  return <div className="site-shell paper-shell"><div className="paper-navigation"><a href="/papers">All papers</a><a href={paper.overview}>Overview and logical context</a><span>{paper.revision}</span></div>
    <div className="paper-edition-strip"><div><span className="eyebrow">{paper.status}</span><p>{date} · {paper.pages} PDF pages</p></div><a className="button" href={paper.pdf} download>Download standalone PDF</a></div>
    <div className="paper-reading-layout"><aside className="paper-toc"><h2>Contents</h2><nav aria-label="Paper contents"><a href="#paper-abstract">Abstract</a>{paper.toc.map(item=><a className={item.level===2?'paper-toc-subsection':undefined} key={item.id} href={'#'+item.id}>{item.number&&<span>{item.number}</span>}{item.title}</a>)}<a href="#paper-download">PDF and source</a></nav></aside>
      <article className="formal-paper"><header className="paper-title"><p className="eyebrow">{paper.category}</p><h1>{paper.title}</h1><p className="paper-subtitle">{paper.subtitle}</p><p className="paper-date">{date}</p></header><section className="paper-abstract" id="paper-abstract"><h2>Abstract</h2><div dangerouslySetInnerHTML={{__html:paper.abstractHtml}} /></section><div className="paper-body" dangerouslySetInnerHTML={{__html:paper.html}} /></article>
    </div>
    <section className="paper-download" id="paper-download"><div><p className="eyebrow">PDF and source</p><h2>Download the paper</h2><p>The PDF contains the full article, numbered statements, proofs, and references. The LaTeX download is self-contained, with the included proof sources expanded.</p><div className="hero-actions"><a className="button" href={paper.pdf} download>Download PDF · {paper.pages} pages</a><a className="button button-secondary" href={paper.tex} download>Download LaTeX source</a></div></div><div className="paper-provenance"><h3>Edition and evidence</h3><p>{paper.evidence}</p><details><summary>Source and PDF fingerprints</summary><p>{paper.proofCount} proof environments retained from the source. This checks document preservation, not mathematical validity.</p><p>Expanded LaTeX SHA-256</p><code className="hash">{paper.sourceSha256}</code><p>PDF SHA-256</p><code className="hash">{paper.pdfSha256}</code></details></div></section>
    {linked.length>0&&<section className="paper-record-register"><h2>Permanent records and reader corrections</h2><p>These links retain individual claim identities and revision-bound feedback. They are the reference index for this paper and its associated open problems.</p><div className="paper-record-links">{linked.map(entry=><a key={entry.id} href={'/entries/'+entry.id}><span className="record-id">{entry.id}</span><span>{entry.title}</span><small>{label(entry)}</small></a>)}</div></section>}
  </div>;
}
