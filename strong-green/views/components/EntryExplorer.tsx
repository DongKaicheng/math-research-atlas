export type ExplorerEntry={id:string;kind:string;title:string;summary:string;status:string;topic?:string;dependencies:string[]};
const labels:Record<string,string>={open:"Open",draft:"Draft · audit pending",conditional:"Conditional",proved:"Internal proof available",reviewed:"Review recorded",withdrawn:"Withdrawn"};
export default function EntryExplorer({entries,initialKind="all"}:{entries:ExplorerEntry[];initialKind?:string}){
  return <div className="entry-explorer" data-record-explorer data-initial-kind={initialKind}>
    <form className="explorer-toolbar" role="search">
      <label className="search-label" htmlFor="research-record-search">Search the research records<span className="search-field"><input id="research-record-search" name="q" type="search" placeholder="A theorem, conjecture, or record ID…" autoComplete="off" /></span></label>
      <label className="filter-label" htmlFor="research-record-status">Mathematical status<select id="research-record-status" name="status" defaultValue="all"><option value="all">All statuses</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    </form>
    <div className="explorer-subbar"><div className="kind-filters" aria-label="Record type">{[["all","All records"],["conjecture","Conjectures"],["result","Results"]].map(([value,label])=><button key={value} type="button" data-record-kind={value} aria-pressed={initialKind===value}>{label}</button>)}</div><p className="results-count" aria-live="polite">{entries.length} of {entries.length} records</p></div>
    <noscript><p>All records are shown. Use your browser’s Find command to search this page.</p></noscript>
    <div className="entry-list">{entries.map(entry=><article className="entry-card" key={entry.id} data-kind={entry.kind} data-status={entry.status} data-search={[entry.id,entry.title,entry.summary,entry.topic||""].join(" ")}>
      <div className="record-meta"><span>{entry.id}</span><span className={"status status-"+entry.status}>{labels[entry.status]||entry.status}</span></div>
      <h2><a href={"/entries/"+entry.id}>{entry.title}</a></h2><p>{entry.summary}</p>
      <div className="entry-card-footer">{entry.topic&&<span className="entry-topic">{entry.topic}</span>}{entry.dependencies.length>0&&<span>{entry.dependencies.length} {entry.dependencies.length===1?"dependency":"dependencies"}</span>}<a href={"/entries/"+entry.id}>Read record ↗</a></div>
    </article>)}</div>
    <p className="record-empty-state" hidden>No matching records. Try a shorter search or choose another status.</p>
  </div>;
}
