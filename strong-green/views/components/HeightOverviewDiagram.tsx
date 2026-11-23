import { logicalTrees } from "@/content/logical-map.mjs";
import { globalRoutes } from "@/content/routes.mjs";

// A reading projection of the existing direct-height branch. Every additional
// premise is retained in the grouped foundations input and its explanation.
const globalTree = logicalTrees.find((tree: any) => tree.id === "logic-global");
const fullPairing = globalTree.root.gate.children.find((node: any) => node.id === "logic-full-chow-pairing");
const route = globalRoutes.find((item: any) => item.slug === "green-forms");
const implication = fullPairing.gate.children.find((node: any) => node.href === route.proof.href);
if (implication.gate.kind !== "all" || !implication.gate.children.some((node: any) => node.record === "STRONG-G")) {
  throw new Error("The overview needs the canonical joint-premise Strong Green height implication");
}
const foundations = implication.gate.children.filter((node: any) => node.record !== "STRONG-G");

const inputs = [
  { id: "strong-green", title: "Strong Green", status: "Open conjecture", lines: ["Every finite place", "Both complementary codimensions"], href: "/papers/strong-g-programme#conj:strong-green" },
  { id: "foundations", title: "Analytic and global foundations", status: "Standing hypotheses", lines: ["Actual intersection and trace calculus", "Moving, archimedean theory, good places"], href: route.foundations.href },
];
const outputs = [
  { id: "local", title: "Local Green pairings", lines: ["Integrate one cycle’s Green form over the other"], href: route.steps[1].href },
  { id: "sum", title: "A finite normalized sum over places", lines: ["Principal transformation law + product formula"], href: route.steps[3].href },
  { id: "height", title: "Canonical real Beilinson–Bloch height", lines: ["On both full homologically trivial Chow groups", "Independent of choices and representatives"], href: route.proof.href },
];

export default function HeightOverviewDiagram() {
  return <div className="sg-height-summary" id="height-diagram" data-height-implication={route.proof.href}>
    <figure className="sg-height-figure">
      <svg className="sg-height-svg" viewBox="0 0 840 602" role="img" aria-labelledby="sg-height-title sg-height-description">
        <title id="sg-height-title">From Strong Green to Beilinson–Bloch heights</title>
        <desc id="sg-height-description">Both Strong Green at every finite place in both complementary codimensions and the standing analytic and global foundations are required. Together they supply local Green pairings. The finite normalized sum descends through rational equivalence to a canonical real height on both full homologically trivial Chow groups, by Theorem 7.5.</desc>
        <defs><marker id="sg-height-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
        <g className="sg-height-connectors" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M 210 126 V 150 H 420 M 630 126 V 150 H 420 V 168" />
          <path d="M 420 192 V 222" markerEnd="url(#sg-height-arrow)" />
          <path d="M 420 310 V 352" markerEnd="url(#sg-height-arrow)" />
          <path d="M 420 440 V 490" markerEnd="url(#sg-height-arrow)" />
        </g>
        {inputs.map((input, i) => <a key={input.id} href={input.href} className={"sg-height-node sg-height-input sg-height-" + input.id} aria-label={input.title + ". " + input.status + ". " + input.lines.join(". ")}>
          <rect x={i ? 438 : 18} y="12" width="384" height="114" rx="5" />
          <text x={i ? 630 : 210} y="37" className="sg-svg-status">{input.status}</text>
          <text x={i ? 630 : 210} y="64" className="sg-svg-title">{input.title}</text>
          {input.lines.map((line, j) => <text key={line} x={i ? 630 : 210} y={88 + j * 19} className="sg-svg-note">{line}</text>)}
        </a>)}
        <g className="sg-height-and"><rect x="354" y="164" width="132" height="29" rx="14.5" /><text x="420" y="184">BOTH required</text></g>
        {outputs.map((output, i) => {
          const y = [226, 356, 494][i];
          return <a key={output.id} href={output.href} className={"sg-height-node sg-height-output sg-height-" + output.id} aria-label={output.title + ". " + output.lines.join(". ")}>
            <rect x="118" y={y} width="604" height={i === 2 ? 96 : 84} rx="5" />
            <text x="420" y={y + 34} className="sg-svg-title">{output.title}</text>
            {output.lines.map((line, j) => <text key={line} x="420" y={y + 59 + j * 19} className="sg-svg-note">{line}</text>)}
          </a>;
        })}
        <text x="420" y="338" className="sg-svg-edge">Good-place vanishing</text>
        <text x="420" y="472" className="sg-svg-edge">Descent through rational equivalence</text>
      </svg>
      <div className="sg-height-mobile" aria-label="The same implication, in reading order">
        <div className="sg-height-mobile-inputs">{inputs.map(input => <a key={input.id} href={input.href} className={"sg-mobile-node sg-mobile-" + input.id}><small>{input.status}</small><strong>{input.title}</strong><span>{input.lines.join(" · ")}</span></a>)}</div>
        <p className="sg-mobile-and">BOTH required</p>
        <ol>{outputs.map(output => <li key={output.id}><a className={"sg-mobile-node sg-mobile-" + output.id} href={output.href}><strong>{output.title}</strong><span>{output.lines.join(". ")}</span></a></li>)}</ol>
      </div>
      <figcaption>A conditional implication proved in <a href={route.proof.href}>Theorem 7.5</a>. Strong Green remains open; the theorem also assumes the stated analytic and global foundations.</figcaption>
    </figure>
    <details className="sg-height-foundations">
      <summary>Which analytic and global foundations enter the argument?</summary>
      {foundations.map((input: any) => <div key={input.href}><h3><a href={input.href}>{input.title}</a></h3><p>{input.note}</p></div>)}
      <p><a href={route.foundations.href}>Read all standing hypotheses in §2 of the height paper →</a></p>
    </details>
  </div>;
}
