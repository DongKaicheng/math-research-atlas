import type { Metadata } from "next";
import { conjectureFamilies } from "@/content/organisation.mjs";
import { entryById, label } from "@/lib/content";

export const metadata: Metadata = { title: "Conjectures and their implications", description: "Four conjecture families: strong actual Green forms, global BB heights, arithmetic Lefschetz and positivity, and integral Northcott.", alternates: { canonical: "/conjectures" } };

function RecordLinks({ ids }: { ids: string[] }) {
  return <div className="family-record-links">{ids.map(id => { const entry = entryById.get(id); return <a key={id} href={"/entries/" + id}><span>{entry?.title || id}</span><small>{entry ? label(entry) : id}</small></a>; })}</div>;
}

export default function Page() {
  return <div className="site-shell">
    <header className="page-header summary-header"><p className="eyebrow">The conjectural programme</p><h1>Four families of questions.</h1><p>The local construction, global assembly, height structure, and arithmetic finiteness are connected by precise reductions. This page explains that structure; the papers give the formal statements and their context.</p><div className="summary-paper-links"><a className="text-link" href="/papers/strong-g-programme">Strong G programme paper</a><a className="text-link" href="/papers/arithmetic-conjectures">Arithmetic conjectures paper</a></div></header>
    <nav className="family-jump-nav" aria-label="Conjecture families">{conjectureFamilies.map(family => <a href={"#" + family.id} key={family.id}><span>{family.number}</span>{family.title}</a>)}</nav>
    <div className="family-sections">{conjectureFamilies.map(family => {
      const principal = entryById.get(family.principal)!;
      return <section className="research-family" id={family.id} key={family.id}>
        <header className="family-heading"><span className="family-number">{family.number}</span><div><p className="eyebrow">Conjecture family</p><h2>{family.title}</h2><p>{family.lead}</p></div></header>
        <div className="family-body"><div className="principal-record"><div className="record-meta"><span className="status status-open">{label(principal)}</span><a className="record-id" href={"/entries/" + principal.id}>{principal.id}</a></div><h3><a href={"/entries/" + principal.id}>{principal.title}</a></h3><p>{family.scope}</p></div>
          <ol className="family-branches">{family.branches.map(branch => <li key={branch.title}><p className="relationship-label">{branch.relation}</p><h3>{branch.title}</h3><p>{branch.text}</p><RecordLinks ids={branch.records} /></li>)}</ol>
          <div className="family-conclusion"><div><h3>What follows, and with which inputs</h3><p>{family.implication}</p></div><div className="family-obstacle"><h3>The remaining step</h3><p>{family.obstacle}</p></div></div>
          <a className="button formal-paper-link" href={family.paper}>Read the formal paper <span aria-hidden="true">→</span></a>
        </div>
      </section>;
    })}</div>
    <section className="edition-note"><div><h2>Implications are not dependency lists.</h2><p>A dependency may supply a definition or a proof ingredient. The connections above state the additional premises needed for an implication. The arithmetic conjectures are formulated within the Bloch–Beilinson tradition; no first-priority claim is made.</p></div><nav aria-label="Further conjecture resources"><a href="/dependencies">Proof dependencies</a><a href="/records">All permanent records</a></nav></section>
  </div>;
}
