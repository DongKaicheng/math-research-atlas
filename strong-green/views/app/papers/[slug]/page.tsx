import type { Metadata } from "next";
import { notFound } from "next/navigation";
import katex from "katex";
import { papers, getPaper } from "@/lib/papers";
import { edition, getEntry, label } from "@/lib/content";

// Reading-view correction only: the frozen v0.5.1 paper and its TeX/PDF hashes
// remain unchanged. PH16.10 originally puts the pairing domain and the height
// formula into one unbreakably long KaTeX display. Preserve the exact TeX from
// its MathML annotation and reflow the two parts on current reading pages.
function reflowHeightEquation(html: string): string {
  const anchor = '<span id="r16ph:general-height-formula" class="equation-anchor"></span>';
  const anchorPosition = html.indexOf(anchor);
  if (anchorPosition < 0) return html;
  const start = html.lastIndexOf('<span class="paper-equation">', anchorPosition);
  if (start < 0) return html;

  // KaTeX nests spans, so a non-greedy closing-tag replacement is not safe.
  const spanTags = /<\/?span\b[^>]*>/g;
  spanTags.lastIndex = start;
  let depth = 0;
  let end = -1;
  for (let match = spanTags.exec(html); match; match = spanTags.exec(html)) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) { end = spanTags.lastIndex; break; }
  }
  if (end < 0) return html;
  const original = html.slice(start, end);
  const tex = original.match(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/)?.[1];
  if (!tex || !tex.includes('\\tag{PH16.10}')) return html;
  const parts = tex.trim().split(/\s*\\qquad\s*/);
  if (parts.length !== 2 || !parts[0].includes('\\times')) return html;

  // The TeX content and tag are unaltered; only a display line break precedes ×.
  const domain = '\\begin{gathered}\n' +
    parts[0].trim().replace('\\times', '\\\\[0.25em]\\times') +
    '\n\\end{gathered}';
  const value = parts[1].trim();
  const options = { displayMode: true, throwOnError: true, strict: 'ignore' as const, trust: false };
  const replacement = '<span class="paper-equation" style="padding-right:0">' + anchor +
    '<span style="display:block;max-width:100%;margin-bottom:0.55em">' + katex.renderToString(domain, options) + '</span>' +
    '<span style="display:block;max-width:100%">' + katex.renderToString(value, options) + '</span></span>';
  return html.slice(0, start) + replacement + html.slice(end);
}

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
      <article className="formal-paper"><header className="paper-title"><p className="eyebrow">{paper.category}</p><h1>{paper.title}</h1><p className="paper-subtitle">{paper.subtitle}</p><p className="paper-date">{date}</p></header><section className="paper-abstract" id="paper-abstract"><h2>Abstract</h2><div dangerouslySetInnerHTML={{__html:paper.abstractHtml}} /></section><div className="paper-body" dangerouslySetInnerHTML={{__html:slug === "global-height-pairing" ? reflowHeightEquation(paper.html) : paper.html}} /></article>
    </div>
    <section className="paper-download" id="paper-download"><div><p className="eyebrow">PDF and source</p><h2>Download the paper</h2><p>The PDF contains the full article, numbered statements, proofs, and references. The LaTeX download is self-contained, with the included proof sources expanded.</p><div className="hero-actions"><a className="button" href={paper.pdf} download>Download PDF · {paper.pages} pages</a><a className="button button-secondary" href={paper.tex} download>Download LaTeX source</a></div></div><div className="paper-provenance"><h3>Edition and evidence</h3><p>{paper.evidence}</p><details><summary>Source and PDF fingerprints</summary><p>{paper.proofCount} proof environments retained from the source. This checks document preservation, not mathematical validity.</p><p>Expanded LaTeX SHA-256</p><code className="hash">{paper.sourceSha256}</code><p>PDF SHA-256</p><code className="hash">{paper.pdfSha256}</code></details></div></section>
    {linked.length>0&&<section className="paper-record-register"><h2>Permanent records and reader corrections</h2><p>These links retain individual claim identities and revision-bound feedback. They are the reference index for this paper and its associated open problems.</p><div className="paper-record-links">{linked.map(entry=><a key={entry.id} href={'/entries/'+entry.id}><span className="record-id">{entry.id}</span><span>{entry.title}</span><small>{label(entry)}</small></a>)}</div></section>}
  </div>;
}
