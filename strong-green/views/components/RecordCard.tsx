import { type Entry, label } from "@/lib/content";
export default function RecordCard({ entry }: { entry: Entry }) {
  return <article className="entry-card">
    <div className="record-meta"><span>{entry.id}</span><span className={"status status-" + entry.status}>{label(entry)}</span></div>
    <h3><a href={"/entries/" + entry.id}>{entry.title}</a></h3><p>{entry.summary}</p>
    <a className="text-link" href={"/entries/" + entry.id}>Read statement &amp; sources ↗</a>
  </article>;
}
