import { entries } from '@/lib/content';
import { buildLogicScene, graphGateLabels } from '@/content/logic-layout.mjs';

export type LogicLink = { href: string; label: string };
export type LogicGate = {
  kind: 'all' | 'any' | 'iff' | 'open' | 'blocked'; label?: string;
  explanation: string; sources: readonly LogicLink[]; children: readonly LogicNode[];
  rules?: readonly string[]; ruleNotes?: Record<string, string>;
};
export type LogicNode = {
  id?: string; title?: string; record?: string; href?: string; status?: string;
  note?: string; links?: readonly LogicLink[]; gate?: LogicGate;
};
export type LogicTree = {
  id: string; navTitle?: string; title: string; summary: string; scope?: string;
  root: LogicNode; related?: readonly LogicNode[]; contexts?: readonly LogicNode[];
};

const colors: Record<string, string> = {
  all: '#32624d', any: '#2c6279', iff: '#755692', open: '#a27013', blocked: '#ae4539',
  rule: '#507aa3', context: '#808a8c', input: '#526b5e', bundle: '#526b5e',
};
const roleNames: Record<string, string> = {
  conclusion: 'CONCLUSION / TARGET', premise: 'PREMISE', rule: 'RULE / SUPPORT',
  context: 'SCOPE / DEFINITION', 'unreached target': 'TARGET NOT REACHED BY THESE INPUTS',
};

function Lines({ lines, x, y, step = 20, size = 14, color = '#3f514a', serif = false, weight = 400 }: any) {
  return <text x={x} y={y} fill={color} fontSize={size} fontFamily={serif ? 'Georgia, serif' : 'Arial, sans-serif'} fontWeight={weight}>
    {lines.map((line: string, index: number) => <tspan key={index} x={x} dy={index ? step : 0}>{line}</tspan>)}
  </text>;
}

function DiagramBox({ item }: { item: any }) {
  const { x, y, width, height, role } = item;
  const support = role === 'rule', context = role === 'context';
  const stroke = support ? '#83a2bf' : context ? '#a2abad' : item.status === 'open' ? '#b9a273' : '#6b8d7b';
  const fill = support ? '#edf3f9' : context ? '#f0f2f2' : role === 'conclusion' ? '#eaf2e9' : '#fffefb';
  const titleY = y + 52;
  const noteY = titleY + item.titleLines.length * 25 + 5;
  let linksY = noteY + item.noteLines.length * 20 + 4;
  const contents = <>
    <rect x={x} y={y} width={width} height={height} rx={context ? 2 : 9} fill={fill} stroke={stroke} strokeWidth={role === 'conclusion' ? 2.3 : 1.5} />
    <text x={x + 17} y={y + 23} fill={support ? '#436787' : '#52685c'} fontFamily="Arial, sans-serif" fontSize={10.5} fontWeight={700}>
      {roleNames[role]}{item.record ? ' · ' + item.record : ''}{item.statusLabel ? ' · ' + item.statusLabel : ''}
    </text>
    <Lines lines={item.titleLines} x={x + 17} y={titleY} step={25} size={19} color="#1d4d3a" serif />
    {item.noteLines.length > 0 && <Lines lines={item.noteLines} x={x + 17} y={noteY} />}
  </>;
  return <g id={item.id} data-logic-node="" data-logic-role={role} data-logic-record={item.record}
    data-logic-status={item.status} className="logic-svg-node" aria-label={`${roleNames[role]}: ${item.title}. ${item.statusLabel}`}>
    {item.href ? <a href={item.href} aria-label={`Read ${item.title}`} className="logic-svg-link">{contents}</a> : contents}
    {item.links.map((link: any, index: number) => {
      const linkY = linksY;
      linksY += link.lines.length * 19 + 7;
      return <a key={index} href={link.href} className="logic-svg-source" aria-label={link.label}>
        <Lines lines={link.lines} x={x + 17} y={linkY} step={19} size={13} color="#276f89" weight={600} />
      </a>;
    })}
  </g>;
}

function DiagramGate({ item }: { item: any }) {
  const { cx, cy, x, kind } = item;
  let nextY = cy - 22;
  const relationY = nextY;
  nextY += item.relationLines.length * 22 + 10;
  const explanationY = nextY;
  nextY += item.explanationLines.length * 20 + 11;
  const path = `M ${cx} ${cy - 29} L ${cx + 32} ${cy} L ${cx} ${cy + 29} L ${cx - 32} ${cy} Z`;
  return <g id={item.id} data-logic-gate={kind} className="logic-svg-gate" aria-label={`${item.relationLines.join(' ')}. ${item.explanationLines.join(' ')}`}>
    <path d={path} fill={kind === 'blocked' ? '#fff0eb' : kind === 'open' ? '#fff5d9' : '#f4f6f1'} stroke={colors[kind]} strokeWidth={2.3} />
    <text x={cx} y={cy + 4} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={kind === 'blocked' ? 12 : 11} fontWeight={700} fill={colors[kind]}>{graphGateLabels[kind]}</text>
    <Lines lines={item.relationLines} x={x} y={relationY} step={22} size={16} color={colors[kind]} weight={700} />
    <Lines lines={item.explanationLines} x={x} y={explanationY} />
    {item.sources.map((link: any, index: number) => {
      const sourceY = nextY; nextY += link.lines.length * 19 + 4;
      return <a key={index} href={link.href} aria-label={link.label} className="logic-svg-source">
        <Lines lines={link.lines} x={x + 12} y={sourceY} step={19} size={13} color="#276f89" weight={600} />
      </a>;
    })}
  </g>;
}

export function CompleteLogicSVG({ trees }: { trees: readonly LogicTree[] }) {
  const scene = buildLogicScene(trees, entries);
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${scene.width} ${scene.height}`} width={scene.width} height={scene.height}
    className="complete-logic-svg" data-complete-logical-diagram="" role="group" aria-labelledby="complete-logic-title complete-logic-description">
    <title id="complete-logic-title">Complete logical diagram: Beilinson–Bloch heights and Green forms</title>
    <desc id="complete-logic-description">Every argument is fully drawn. Read from premises upward through ALL, ANY, IFF or OPEN junctions. Red blocked links do not assert an implication. Blue dashed links identify proof rules; grey dashed links give scope and definitions. All result boxes and proof sources are hyperlinks.</desc>
    <style>{`.logic-svg-link:hover > rect,.logic-svg-link:focus-visible > rect{stroke:#176e92;stroke-width:3}.logic-svg-source:hover text,.logic-svg-source:focus-visible text{fill:#aa4828;text-decoration:underline}.logic-svg-node:target > a > rect{stroke:#b76524;stroke-width:4}.logic-svg-link,.logic-svg-source{cursor:pointer}`}</style>
    <defs>{Object.entries(colors).map(([kind, color]) => <marker key={kind} id={`logic-arrow-${kind}`} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M 0 0 L 9 4.5 L 0 9 Z" fill={color} /></marker>)}</defs>
    <rect width={scene.width} height={scene.height} fill="#fbfcf8" />
    {scene.sections.map((section: any) => {
      let sy = section.y + 34;
      const titleY = sy; sy += section.titleLines.length * 35 + 16;
      const summaryY = sy; sy += section.summaryLines.length * 23 + 13;
      return <g id={section.id} key={section.id} data-logic-tree="" aria-label={section.titleLines.join(' ')}>
        <path d={`M 28 ${section.y - 12} H ${scene.width - 28}`} stroke="#7d9986" strokeWidth="2" />
        <text x="54" y={section.y + 5} fontFamily="Arial, sans-serif" fontWeight="700" fontSize="11" fill="#597260">LOGICAL TREE {section.number}</text>
        <Lines lines={section.titleLines} x={54} y={titleY} step={35} size={28} color="#214d3c" serif />
        <Lines lines={section.summaryLines} x={54} y={summaryY} step={23} size={16} />
        <Lines lines={section.scopeLines} x={54} y={sy} size={14} color="#59665f" />
      </g>;
    })}
    <g className="logic-svg-edges" fill="none" strokeLinejoin="round" strokeLinecap="round">
      {scene.edges.map((edge: any) => {
        const effective = edge.relation || edge.kind;
        const color = colors[effective];
        const dashed = ['open', 'rule', 'context'].includes(effective);
        return <g key={edge.id} data-edge-from={edge.from} data-edge-to={edge.to} data-edge-kind={edge.kind} data-edge-relation={edge.relation}>
          <path d={edge.d} stroke={color} strokeWidth={edge.kind === 'rule' || edge.kind === 'context' ? 1.5 : 2.2}
            strokeDasharray={dashed ? '6 5' : undefined}
            markerEnd={edge.arrow ? `url(#logic-arrow-${effective})` : undefined}
            markerStart={edge.both ? `url(#logic-arrow-${effective})` : undefined} />
          {edge.blocked && <text x={Number(edge.d.split(' ')[1])} y={Number(edge.d.split(' ').at(-1)) - 3} textAnchor="middle" stroke="none" fill={color} fontSize="24" fontFamily="Arial, sans-serif">×</text>}
        </g>;
      })}
    </g>
    {scene.texts.map((item: any, index: number) => <text key={index} x={item.x} y={item.y} fontSize="10.5" fontWeight="700" fill="#6e7b75" fontFamily="Arial, sans-serif">{item.text}</text>)}
    {scene.boxes.map((item: any) => <DiagramBox key={item.identity} item={item} />)}
    {scene.gates.map((item: any) => <DiagramGate key={item.id} item={item} />)}
  </svg>;
}

export function LogicForest({ trees }: { trees: readonly LogicTree[] }) {
  const scene = buildLogicScene(trees, entries);
  const covered = new Set(scene.boxes.map((item: any) => item.record).filter(Boolean));
  return <div className="logical-map" data-logic-forest="">
    <div className="logic-reading-guide">
      <p>A complete node-and-arrow diagram, with every branch visible. Read upward from premises through a junction to its conclusion.</p>
      <p className="logic-counts">{covered.size} permanent records · {scene.boxes.length} scoped node occurrences · {scene.gates.length} logical junctions</p>
      <div className="logic-diagram-key" aria-label="Diagram legend">
        <span><b>ALL</b> Joint sufficient premises</span><span><b>ANY</b> Alternative complete routes</span><span><b>IFF</b> Conclusion ⇔ the whole premise bundle</span>
        <span><b>OPEN ⋯→</b> Unproved bridge</span><span><b>×</b> These inputs do not imply the target</span>
        <span><b className="logic-rule-key">Blue dashed</b> Rule / supporting argument</span><span><b className="logic-context-key">Grey dashed</b> Scope / definitions, not an implication</span>
      </div>
      <p className="logic-scope-note">Repeated records retain the quantifiers and hypotheses of each occurrence. A theorem establishing a conditional implication is separate from its still-open geometric premises.</p>
    </div>
    <nav className="logic-quick-nav" aria-label="Jump to a logical tree">
      <ul>{trees.map(tree => <li key={tree.id}><a href={`#${tree.id}`}>{tree.navTitle || tree.title}</a></li>)}</ul>
    </nav>
    <div className="logic-diagram-tools">
      <div data-diagram-zoom-controls="" hidden><button type="button" data-diagram-zoom="-">−</button><output data-diagram-zoom-value="" aria-live="polite">100%</output><button type="button" data-diagram-zoom="+">+</button><button type="button" data-diagram-reset="">100%</button></div>
      <a href="/projects/strong-green/assets/complete-logical-map.svg" download="strong-green-logical-map.svg">Download the complete linked SVG</a>
    </div>
    <p className="logic-pan-hint">The full diagram continues down the page. On a narrow screen, scroll sideways inside the diagram to keep the text readable.</p>
    <div className="logic-diagram-scroll" data-diagram-scroll="" tabIndex={0} role="region" aria-label="Complete logical diagram; horizontally scrollable on narrow screens">
      <CompleteLogicSVG trees={trees} />
    </div>
  </div>;
}

export default LogicForest;
