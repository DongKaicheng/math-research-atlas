import { entryById, label } from "@/lib/content";

export type LogicLink = { href: string; label: string };
export type LogicGate = {
  kind: "all" | "any" | "iff" | "open" | "blocked";
  label?: string;
  explanation: string;
  sources: readonly LogicLink[];
  children: readonly LogicNode[];
};
export type LogicNode = {
  id?: string;
  title?: string;
  record?: string;
  href?: string;
  status?: "open" | "conditional" | "proved" | "draft" | "hypothesis" | "published";
  note?: string;
  links?: readonly LogicLink[];
  gate?: LogicGate;
};
export type LogicTree = {
  id: string;
  navTitle?: string;
  title: string;
  summary: string;
  scope?: string;
  root: LogicNode;
  related?: readonly LogicNode[];
};

const gateLabels = {
  all: { pill: "ALL", label: "All premises jointly" },
  any: { pill: "ANY", label: "Any complete alternative" },
  iff: { pill: "IFF", label: "Equivalent conditions" },
  open: { pill: "OPEN", label: "Open implication" },
  blocked: { pill: "INSUFFICIENT", label: "Insufficient premises" },
} as const;
const nodeStatusLabels = {
  open: "Open", conditional: "Conditional", proved: "Internal argument available",
  draft: "Draft", hypothesis: "Hypothesis", published: "Published result",
} as const;

function Links({ links, kind = "Sources and proof" }: { links?: readonly LogicLink[]; kind?: string }) {
  if (!links?.length) return null;
  return <ul className="logic-links" aria-label={kind}>{links.map((link, index) =>
    <li key={`${link.href}-${index}`}><a href={link.href}>{link.label}</a></li>
  )}</ul>;
}

function GatePill({ kind }: { kind: LogicGate["kind"] }) {
  return <span className={`logic-gate-pill logic-gate-pill-${kind}`}>{gateLabels[kind].pill}</span>;
}

function Premises({ gate, depth, branch, headingBase }: { gate: LogicGate; depth: number; branch: string; headingBase: number }) {
  const relation = gate.label ?? gateLabels[gate.kind].label;
  return <div className="logic-branch" data-logic-kind={gate.kind}>
    <div className="logic-stem" aria-hidden="true"><span>{gate.kind === "blocked" ? "×" : gate.kind === "iff" ? "↕" : "↑"}</span></div>
    <div className="logic-junction" data-logic-gate={gate.kind}>
      <div className="logic-junction-heading"><GatePill kind={gate.kind} /><strong>{relation}</strong></div>
      <p className="logic-junction-explanation">{gate.explanation}</p>
      <Links links={gate.sources} />
    </div>
    <ul className="logic-children" aria-label={relation}>{gate.children.map((child, index) =>
      <li className="logic-child" key={`${branch}-${index}`}>
        <Node node={child} depth={depth + 1} branch={`${branch}-${index}`} headingBase={headingBase} />
      </li>
    )}</ul>
  </div>;
}

function Node({ node, depth, branch, headingBase = 3 }: { node: LogicNode; depth: number; branch: string; headingBase?: number }) {
  const record = node.record ? entryById.get(node.record) : undefined;
  if (node.record && !record) throw new Error(`Unknown logical-map record: ${node.record}`);
  const title = node.title ?? record?.title;
  if (!title) throw new Error(`A logical-map node requires a title or record (${branch})`);
  const href = node.href ?? (record ? `/entries/${record.id}` : undefined);
  // Record statuses always come from the selected publication. A display node
  // cannot promote a registered draft by supplying a different status.
  const status = record?.status ?? node.status;
  const statusText = record ? label(record) : node.status ? nodeStatusLabels[node.status] : undefined;
  const level = headingBase + depth;
  const Heading = level <= 3 ? "h3" : level === 4 ? "h4" : level === 5 ? "h5" : "h6";
  const gate = node.gate;
  const relation = gate ? gate.label ?? gateLabels[gate.kind].label : "";
  return <div className={`logic-node${depth === 0 ? " logic-node-root" : ""}`} id={node.id} data-logic-node="" data-logic-depth={depth}>
    <article className="logic-card" data-logic-status={status}>
      <div className="logic-node-meta">
        <span className="logic-node-role">{depth === 0 ? "Conclusion" : "Premise"}</span>
        {record && <span className="logic-record-id">{record.id}</span>}
        {statusText && <span className="logic-status">{statusText}</span>}
      </div>
      <Heading className="logic-node-title">{href ? <a href={href}>{title}</a> : title}</Heading>
      {node.note && <p className="logic-node-note">{node.note}</p>}
      <Links links={node.links} kind="Statement links" />
    </article>
    {gate && (depth === 0
      ? <div data-logic-root-gate=""><Premises gate={gate} depth={depth} branch={branch} headingBase={headingBase} /></div>
      : <details className="logic-details" data-logic-details="">
          <summary>
            <span className="logic-disclosure" aria-hidden="true" />
            <GatePill kind={gate.kind} />
            <span className="logic-details-label">{relation}</span>
            <span className="logic-premise-count">{gate.children.length} {gate.children.length === 1 ? "premise" : "premises"}</span>
          </summary>
          <Premises gate={gate} depth={depth} branch={branch} headingBase={headingBase} />
        </details>)}
  </div>;
}

export function LogicForest({ trees }: { trees: readonly LogicTree[] }) {
  // Only explicit IDs are addressable nodes. A record may occur in several
  // arguments, so its permanent record ID is never reused as a DOM anchor.
  const ids = new Set<string>();
  const reserve = (id: string) => {
    if (ids.has(id)) throw new Error(`Duplicate logical-map anchor: ${id}`);
    ids.add(id);
  };
  const inspect = (node: LogicNode) => {
    if (node.id) reserve(node.id);
    node.gate?.children.forEach(inspect);
  };
  trees.forEach(tree => {
    reserve(tree.id); reserve(`${tree.id}-heading`);
    inspect(tree.root);
    if (tree.related?.length) {
      reserve(`${tree.id}-related-heading`);
      tree.related.forEach(inspect);
    }
  });
  return <div className="logical-map" data-logic-forest="">
    <div className="logic-reading-guide">
      <p>Read upward from the connected premises to the conclusion or target. Each junction states the relation and links to its argument.</p>
      <dl className="logic-legend">
        <div><dt><GatePill kind="all" /></dt><dd>Joint premises</dd></div>
        <div><dt><GatePill kind="any" /></dt><dd>Alternative sufficient premises</dd></div>
        <div><dt><GatePill kind="iff" /></dt><dd>Equivalent conditions</dd></div>
        <div><dt><GatePill kind="open" /></dt><dd>Proposed, unproved bridge</dd></div>
        <div><dt><GatePill kind="blocked" /></dt><dd>Premises do not suffice</dd></div>
      </dl>
      <div className="logic-controls" data-logic-controls="" hidden>
        <button type="button" data-logic-expand="">Expand all premises</button>
        <button type="button" data-logic-overview="">Return to overview</button>
      </div>
    </div>
    <nav className="logic-quick-nav" aria-label="Jump to a logical tree">
      <p>Choose a conclusion</p>
      <ul>{trees.map(tree => <li key={tree.id}><a href={`#${tree.id}`}>{tree.navTitle ?? tree.title}</a></li>)}</ul>
    </nav>
    <div className="logic-trees">{trees.map(tree =>
      <section className="logic-tree" id={tree.id} data-logic-tree="" key={tree.id} aria-labelledby={`${tree.id}-heading`}>
        <header className="logic-tree-heading">
          <h2 id={`${tree.id}-heading`}>{tree.title}</h2>
          <p className="logic-tree-summary">{tree.summary}</p>
          {tree.scope && <p className="logic-tree-scope"><strong>Scope.</strong> {tree.scope}</p>}
        </header>
        <Node node={tree.root} depth={0} branch={tree.id} />
        {Boolean(tree.related?.length) && <section className="logic-related" aria-labelledby={`${tree.id}-related-heading`}>
          <h3 id={`${tree.id}-related-heading`}>Further deductions and limits</h3>
          <div className="logic-related-roots">{tree.related?.map((item, index) =>
            <Node key={`${tree.id}-related-${index}`} node={item} depth={0} headingBase={4} branch={`${tree.id}-related-${index}`} />
          )}</div>
        </section>}
      </section>
    )}</div>
  </div>;
}

export default LogicForest;
