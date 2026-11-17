import type { Metadata } from "next";
import EntryExplorer from "@/components/EntryExplorer";
import { entries } from "@/lib/content";
export const metadata: Metadata = { title: "Permanent mathematical records", alternates: { canonical: "/records" } };
export default function RecordsPage() {
  return <div className="site-shell"><header className="page-header"><p className="eyebrow">Reference index</p><h1>Permanent mathematical records.</h1><p>This index preserves the identities, source bindings, and revision history of individual claims. For a coherent exposition, begin with the conjecture families or a complete paper.</p><div className="hero-actions"><a className="button" href="/papers">Read the mathematical papers</a><a className="button button-secondary" href="/conjectures">Conjecture families</a></div></header><EntryExplorer entries={entries} /></div>;
}
