import type { Metadata } from "next";
import { entries, edition, getEntry, label } from "@/lib/content";
export const metadata: Metadata = { title: "Proof dependencies", description: "Explicit support links, hypotheses and downstream consequences for each research record.", alternates: { canonical: "/dependencies" } };
const routes = [
  { title: "Local construction", ids: ["BB-RESTRICTED-TRACE","BB-SUPPORTED-GREEN-PAIR","BB-GREEN-CORRECTION","STRONG-G"] },
  { title: "Central arithmetic", ids: ["BB-CHOW-PROJECTOR","BB-RESIDUAL-PAIRING","R2-N1","OPEN-RESIDUAL-NC"] },
  { title: "Integral and field control", ids: ["R2-R3","R2-N4","R2-N5","R2-F2"] },
];
export default function Page() {
  return <div className="site-shell"><header className="page-header"><p className="eyebrow">The proof structure</p><h1>Dependencies of the registered claims.</h1><p>The index links statements to the definitions, hypotheses, constructions, and results they use. An edge is a declared relation, not evidence that an open premise is solved. Proof-specific qualifications appear on the individual records. The pairing-case inventory and the full papers record additional model and companion hypotheses.</p></header>
    <section className="three-columns">{routes.map(route => <article className="track-card" key={route.title}><h2>{route.title}</h2><ol className="dependency-route">{route.ids.map(id => <li key={id}><a href={"/entries/" + id}><span className="record-id">{id}</span>{getEntry(id)?.title}</a></li>)}</ol></article>)}</section>
    <section className="section"><div className="section-heading"><h2>Complete record index</h2><a className="text-link" href={"/editions/" + edition.revision + "/research.json"} download>Download the structured edition ↗</a></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th scope="col">Record</th><th scope="col">Status</th><th scope="col">Declared inputs / context</th></tr></thead><tbody>{entries.map(entry => <tr key={entry.id}><th scope="row"><a href={"/entries/" + entry.id}><span className="record-id">{entry.id}</span>{entry.title}</a></th><td><span className={"status status-" + entry.status}>{label(entry)}</span></td><td>{entry.dependencies.length ? entry.dependencies.map(dep => <a className="dependency-chip" key={dep} href={"/entries/" + dep}>{dep}</a>) : <span className="muted">Statement and external sources</span>}</td></tr>)}</tbody></table></div>
    </section><section className="callout"><h2>What the checks establish</h2><p>The publication check verifies permanent IDs, source fingerprints, missing links, and acyclicity of the selected dependency graph. Mathematical correctness remains a separate review task. No record in this edition has been upgraded to independently reviewed by this website import.</p></section>
  </div>;
}
