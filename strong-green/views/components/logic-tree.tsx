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
  all: '#315e50', any: '#285e87', iff: '#315e50', open: '#76518c', blocked: '#9a4b30',
  rule: '#64757c', context: '#87928b', input: '#9aa99d', bundle: '#9aa99d',
};
const palettes: Record<string, string[]> = {
  proved: ['#315e50', '#eef4ec'], published: ['#315e50', '#eef4ec'],
  conditional: ['#285e87', '#edf3f8'], hypothesis: ['#79602f', '#faf5e8'],
  open: ['#76518c', '#f4eff8'], draft: ['#76518c', '#f4eff8'],
};
const roleNames: Record<string, string> = {
  conclusion: 'Conclusion / target', premise: 'Premise', rule: 'Supporting result',
  context: 'Scope / definition', 'unreached target': 'Target not reached by these inputs',
};
const gateNames: Record<string, string> = {
  all: 'Deduction', any: 'Routes', iff: 'Equivalence', open: 'Open step', blocked: 'Shortcut',
};
const detailHref = (item: any, base = '') => base + '#' + item.id + '-detail';

function Lines({ lines, x, y, step = 22, size = 17, color = '#263b31', weight = 600, serif = false }: any) {
  return <text x={x} y={y} fill={color} fontSize={size} fontFamily={serif ? 'Georgia, serif' : 'Arial, sans-serif'} fontWeight={weight}>
    {lines.map((line: string, index: number) => <tspan key={index} x={x} dy={index ? step : 0}>{line}</tspan>)}
  </text>;
}

function DiagramBox({ item, detailBase = '' }: { item: any; detailBase?: string }) {
  const { x, y, width, height, role } = item;
  const [stroke, fill] = role === 'context' ? ['#87928b', '#f2f4ef'] : palettes[item.status] || ['#64757c', '#f4f6f2'];
  const prefix = role === 'rule' ? 'RULE · ' : role === 'context' ? 'CONTEXT · ' : '';
  const href = item.href || item.links[0]?.href || detailHref(item, detailBase);
  return <g id={item.id} tabIndex={-1} data-logic-node="" data-logic-role={role} data-logic-record={item.record}
    data-logic-status={item.status} className="logic-svg-node" aria-label={roleNames[role] + ': ' + item.title + '. ' + item.statusLabel}>
    <title>{item.title + (item.note ? '. ' + item.note : '')}</title>
    <a href={href} aria-label={'Read ' + item.title} className="logic-svg-link">
      <rect x={x} y={y} width={width} height={height} rx={9} fill={fill} stroke={stroke} strokeWidth={role === 'conclusion' ? 2 : 1.5} />
      <text x={x + 16} y={y + 22} fill={stroke} fontFamily="Arial, sans-serif" fontSize={10.5} fontWeight={700}>
        {prefix}{String(item.statusLabel || roleNames[role]).toUpperCase()}
      </text>
      <Lines lines={item.titleLines} x={x + 16} y={y + 47} step={22} size={17} />
      {item.record && <text x={x + 16} y={y + height - 35} fill="#66746b" fontFamily="Arial, sans-serif" fontSize={10.5}>{item.record}</text>}
    </a>
    <a href={detailHref(item, detailBase)} className="logic-svg-source" aria-label={'Scope and sources for ' + item.title}>
      <text x={x + 16} y={y + height - 14} fill="#315e50" fontFamily="Arial, sans-serif" fontSize={11.5}>Scope &amp; sources</text>
    </a>
  </g>;
}

function DiagramGate({ item, detailBase = '' }: { item: any; detailBase?: string }) {
  const { x, y, width, height, kind } = item;
  return <g id={item.id} tabIndex={-1} data-logic-gate={kind} className="logic-svg-gate" aria-label={item.label + '. ' + item.explanation}>
    <title>{item.label + '. ' + item.explanation}</title>
    <a href={detailHref(item, detailBase)} className="logic-svg-link" aria-label={'Read connection ' + item.number + ': ' + item.label}>
      <rect x={x} y={y} width={width} height={height} rx={kind === 'any' ? height / 2 : 7}
        fill={kind === 'open' ? '#f4eff8' : kind === 'blocked' ? '#fbf0e9' : '#f8faf4'} stroke={colors[kind]} strokeWidth={1.7}
        strokeDasharray={kind === 'open' ? '6 4' : undefined} />
      <text x={x + width / 2} y={y + 24} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={12} fontWeight={700} fill={colors[kind]}>
        {graphGateLabels[kind]} · {gateNames[kind]} {item.number}
      </text>
      <text x={x + width / 2} y={y + 45} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={11.5} fill="#526259">Read hypotheses &amp; proof</text>
    </a>
  </g>;
}

function DiagramSection({ item: section, width }: { item: any; width: number }) {
  let sy = section.y + 34;
  const titleY = sy; sy += section.titleLines.length * 35 + 16;
  const summaryY = sy; sy += section.summaryLines.length * 23 + 13;
  return <g id={section.id} tabIndex={-1} data-logic-tree="" aria-label={section.title}>
    <path d={'M 28 ' + (section.y - 12) + ' H ' + (width - 28)} stroke="#7d9986" strokeWidth="2" />
    <text x="54" y={section.y + 5} fontFamily="Arial, sans-serif" fontWeight="700" fontSize="11" fill="#597260">LOGICAL TREE {section.number}</text>
    <Lines lines={section.titleLines} x={54} y={titleY} step={35} size={28} color="#214d3c" serif />
    <Lines lines={section.summaryLines} x={54} y={summaryY} step={23} size={16} weight={400} />
    <Lines lines={section.scopeLines} x={54} y={sy} step={20} size={14} weight={400} color="#59665f" />
  </g>;
}

function LogicSceneSVG({ scene, section, title, detailBase = '' }: { scene: any; section?: any; title: string; detailBase?: string }) {
  const boxes = section ? scene.boxes.filter((item: any) => item.treeId === section.id) : scene.boxes;
  const gates = section ? scene.gates.filter((item: any) => item.treeId === section.id) : scene.gates;
  const texts = section ? scene.texts.filter((item: any) => item.treeId === section.id) : scene.texts;
  const ids = new Set([...boxes, ...gates].map((item: any) => item.id));
  const edges = section ? scene.edges.filter((edge: any) => ids.has(edge.from) && ids.has(edge.to)) : scene.edges;
  const bounds = section?.graphBounds || { x: 0, y: 0, width: scene.width, height: scene.height };
  const prefix = 'logic-svg-' + (section?.id || scene.sections[0]?.id || 'empty') + (section ? '' : '-complete');
  const readingOrder = [
    ...(!section ? scene.sections.map((item: any) => ({ kind: 'section', item, y: item.y - 12, x: 0, key: item.id })) : []),
    ...boxes.map((item: any) => ({ kind: 'box', item, y: item.y, x: item.x, key: item.id })),
    ...gates.map((item: any) => ({ kind: 'gate', item, y: item.y, x: item.x, key: item.id })),
    ...texts.map((item: any, index: number) => ({ kind: 'text', item, y: item.y, x: item.x, key: 'label-' + index })),
  ].sort((a: any, b: any) => a.y - b.y || a.x - b.x);
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={[bounds.x, bounds.y, bounds.width, bounds.height].join(' ')} width={bounds.width} height={bounds.height}
    className="complete-logic-svg" data-complete-logical-diagram="" data-logic-direction="top-down" role="group" aria-labelledby={prefix + '-title ' + prefix + '-description'}>
    <title id={prefix + '-title'}>{title}</title>
    <desc id={prefix + '-description'}>Read from top to bottom: parallel premises meet at a numbered AND, OR or IFF junction, followed by the conclusion. Dashed OPEN links are unproved bridges; barred links do not assert an implication. Grey links identify supporting rules or context. Each node and connection links to its complete hypotheses and sources below the diagram.</desc>
    <style>{'.logic-svg-link:hover>rect,.logic-svg-link:focus-visible>rect{stroke:#176e92;stroke-width:3}.logic-svg-source:hover text,.logic-svg-source:focus-visible text{fill:#9a4b30;text-decoration:underline}.logic-svg-node:target>a>rect,.logic-svg-node:focus-visible>a>rect,.logic-svg-gate:target>a>rect,.logic-svg-gate:focus-visible>a>rect{stroke:#b76524;stroke-width:4}.logic-svg-link,.logic-svg-source{cursor:pointer}'}</style>
    <defs>{Object.entries(colors).map(([kind, color]) => <marker key={kind} id={prefix + '-arrow-' + kind} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M 0 0 L 9 4.5 L 0 9 Z" fill={color} /></marker>)}</defs>
    <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="#fbfcf7" />
    <g className="logic-svg-edges" aria-hidden="true" fill="none" strokeLinejoin="round" strokeLinecap="round">
      {edges.map((edge: any) => {
        const effective = edge.relation || edge.kind, color = colors[effective];
        const dashed = ['open', 'rule', 'context'].includes(effective);
        return <g key={edge.id} data-edge-from={edge.from} data-edge-to={edge.to} data-edge-kind={edge.kind} data-edge-relation={edge.relation}>
          <path d={edge.d} stroke={color} strokeWidth={['rule', 'context'].includes(edge.kind) ? 1.4 : 1.8}
            strokeDasharray={dashed ? '6 5' : undefined}
            markerEnd={edge.arrow ? 'url(#' + prefix + '-arrow-' + effective + ')' : undefined}
            markerStart={edge.both ? 'url(#' + prefix + '-arrow-' + effective + ')' : undefined} />
          {edge.blocked && <path d={'M ' + (edge.end.x - 8) + ' ' + (edge.end.y - 3) + ' H ' + (edge.end.x + 8)} stroke={color} strokeWidth={3} />}
        </g>;
      })}
    </g>
    {readingOrder.map(({ kind, item, key }: any) => kind === 'section' ? <DiagramSection key={key} item={item} width={scene.width} /> :
      kind === 'box' ? <DiagramBox key={key} item={item} detailBase={detailBase} /> : kind === 'gate' ? <DiagramGate key={key} item={item} detailBase={detailBase} /> :
        <text key={key} x={item.x} y={item.y} fontFamily="Arial, sans-serif" fontSize={10.5} fontWeight={600} fill="#6c7d63">{item.text}</text>)}
  </svg>;
}

export function CompleteLogicSVG({ trees, title = 'Complete logical diagram: Beilinson–Bloch heights and Green forms', detailBase = '' }: { trees: readonly LogicTree[]; title?: string; detailBase?: string }) {
  return <LogicSceneSVG scene={buildLogicScene(trees, entries)} title={title} detailBase={detailBase} />;
}

function SourceLinks({ links }: { links: readonly LogicLink[] }) {
  if (!links.length) return null;
  return <ul className="logic-source-links">{links.map((link, index) => <li key={index}><a href={link.href}>{link.label}</a></li>)}</ul>;
}

function NodeReference({ item }: { item: any }) {
  return <div className="logic-node-reference">
    <span className={'logic-status logic-status-' + item.status}>{item.statusLabel}</span>
    <a href={'#' + item.id} className="logic-reference-title">{item.title}</a>
    {item.record && <code>{item.record}</code>}
    {item.note && <p>{item.note}</p>}
    <a className="logic-detail-link" href={detailHref(item)}>Scope &amp; sources</a>
  </div>;
}

function ConnectionDetails({ gate, byId }: { gate: any; byId: Map<string, any> }) {
  const conclusion = byId.get(gate.conclusionId);
  const inputs = gate.childrenIds.map((id: string) => byId.get(id));
  const rules = gate.ruleIds.map((id: string) => byId.get(id));
  return <details id={gate.id + '-detail'} data-logic-detail="" data-logic-detail-kind="connection" data-connection-for={gate.id} tabIndex={-1} className={'logic-connection logic-connection-' + gate.kind}>
    <summary><span className="logic-connection-number">{gate.number}</span><span><b>{graphGateLabels[gate.kind]}</b> · {gate.label}</span></summary>
    <div className="logic-detail-body">
      <h5>{gate.kind === 'any' ? 'Alternative complete routes' : gate.kind === 'blocked' ? 'Inputs to the rejected shortcut' : 'Premises and stated hypotheses'}</h5>
      <ol className="logic-premise-list">{inputs.map((item: any) => <li key={item.id}><NodeReference item={item} /></li>)}</ol>
      {rules.length > 0 && <><h5>Supporting results used in this deduction</h5><ul className="logic-rule-list">{rules.map((item: any) => <li key={item.id}><NodeReference item={item} /></li>)}</ul></>}
      <div className="logic-deduction"><h5>{gate.kind === 'open' ? 'Remaining step' : gate.kind === 'blocked' ? 'Why the shortcut fails' : 'How the deduction works'}</h5><p>{gate.explanation}</p></div>
      <h5>{gate.kind === 'blocked' ? 'Target not obtained from these inputs' : 'Conclusion / target'}</h5>
      <NodeReference item={conclusion} />
      <h5>Evidence and further reading</h5><SourceLinks links={gate.sources} />
      <a className="logic-back-link" href={'#' + gate.id}>Back to connection {gate.number} in the diagram ↑</a>
    </div>
  </details>;
}

function NodeDetails({ item }: { item: any }) {
  return <details id={item.id + '-detail'} data-logic-detail="" data-logic-detail-kind="node" data-node-detail-for={item.id} tabIndex={-1} className="logic-node-detail">
    <summary><span className={'logic-status logic-status-' + item.status}>{item.statusLabel}</span><span>{item.title}</span></summary>
    <div className="logic-detail-body">
      <p className="logic-detail-meta">{roleNames[item.role]}{item.record && <> · <code>{item.record}</code></>}</p>
      {item.note && <p>{item.note}</p>}
      {item.href && <p><a href={item.href}>Read the linked statement</a></p>}
      <SourceLinks links={item.links} />
      <a className="logic-back-link" href={'#' + item.id}>Back to this node in the diagram ↑</a>
    </div>
  </details>;
}

export function LogicForest({ trees, title, downloadPath = '/projects/strong-green/assets/complete-logical-map.svg', downloadName = 'strong-green-logical-map.svg' }: { trees: readonly LogicTree[]; title?: string; downloadPath?: string; downloadName?: string }) {
  const scene = buildLogicScene(trees, entries);
  const covered = new Set(scene.boxes.map((item: any) => item.record).filter(Boolean));
  const byId = new Map<string, any>(scene.boxes.map((item: any) => [item.id, item]));
  return <div className="logical-map" data-logic-forest="" aria-label={title}>
    <div className="logic-reading-guide">
      <h2>How to read the logic</h2>
      <p>Read from top to bottom. Parallel premises meet at a numbered connection, then lead to a conclusion. Select a connection to read its hypotheses and deduction; select a node to read the linked statement.</p>
      <div className="logic-diagram-key" aria-label="Diagram legend">
        <span><b>AND</b> All inputs are required</span><span><b>OR</b> Alternative complete routes</span><span><b>IFF</b> Equivalent to the whole premise bundle</span>
        <span><b className="logic-open-key">OPEN ⋯→</b> Unproved bridge</span><span><b className="logic-blocked-key">Barred link</b> The implication fails</span>
        <span><b className="logic-context-key">Grey dashed</b> Supporting rule or context</span>
      </div>
      <div className="logic-status-key" aria-label="Node status legend">
        {[['published', 'Published input'], ['proved', 'Internal proof available'], ['conditional', 'Conditional'], ['hypothesis', 'Stated hypothesis'], ['open', 'Open'], ['draft', 'Draft']].map(([status, label]) => <span key={status} className={'logic-status logic-status-' + status}>{label}</span>)}
      </div>
      <p className="logic-scope-note">The full scope of each occurrence is recorded below its diagram. A proved conditional implication and an open geometric premise keep their separate statuses.</p>
      <div className="logic-guide-footer"><p className="logic-counts">{covered.size > 0 && <>{covered.size} permanent records · </>}{scene.boxes.length} scoped node occurrences · {scene.gates.length} connections</p><a href={downloadPath} download={downloadName}>Download the complete linked SVG ↗</a></div>
    </div>
    <div className="logic-layout">
      <nav className="logic-quick-nav" aria-label="Jump to a logical tree">
        <h2>In this map</h2><ol>{trees.map((tree, index) => <li key={tree.id}><a href={'#' + tree.id}><span>{String(index + 1).padStart(2, '0')}</span>{(tree.navTitle || tree.title).replace(/^\d+\.\s*/, '')}</a></li>)}</ol>
      </nav>
      <div className="logic-panels">{scene.sections.map((section: any) => {
        const boxes = scene.boxes.filter((item: any) => item.treeId === section.id);
        const gates = scene.gates.filter((item: any) => item.treeId === section.id).sort((a: any, b: any) => Number(a.number) - Number(b.number));
        return <section key={section.id} id={section.id} tabIndex={-1} data-logic-tree="" data-logic-panel="" className="logic-panel">
          <header className="logic-panel-header"><p className="logic-panel-number">LOGIC {section.number}</p><h3>{section.title}</h3><p>{section.summary}</p></header>
          {section.scope && <p className="logic-panel-scope"><strong>Scope.</strong> {section.scope}</p>}
          <figure className="logic-figure">
            <figcaption>Premises → connection → conclusion</figcaption>
            <div className="logic-diagram-tools"><div data-diagram-zoom-controls="" hidden>
              <button type="button" data-diagram-zoom="-" aria-label="Zoom out">−</button><output data-diagram-zoom-value="" aria-live="polite">100%</output><button type="button" data-diagram-zoom="+" aria-label="Zoom in">+</button>
              <button type="button" data-diagram-fit="" aria-label="Fit this diagram to the available width">Fit width</button><button type="button" data-diagram-reset="" aria-label="Reset this diagram to readable size at 100 percent">Readable size</button><button type="button" data-diagram-wide="" aria-label="Toggle wide reading mode" aria-pressed="false">Wide view</button>
            </div></div>
            <div className="logic-diagram-scroll" data-diagram-scroll="" tabIndex={0} role="region" aria-label={section.title + ': scrollable logical diagram'}>
              <LogicSceneSVG scene={scene} section={section} title={section.title} />
            </div>
            <p className="logic-pan-hint">Scroll inside the frame to follow a large branch. “Fit width” shows the whole layout; “Readable size” restores the text to 100%.</p>
          </figure>
          <div className="logic-connections"><h4>Read the {gates.length} {gates.length === 1 ? 'connection' : 'connections'}</h4><p>Each numbered card gives the exact inputs, the deduction and its sources.</p>
            {gates.map((gate: any) => <ConnectionDetails key={gate.id} gate={gate} byId={byId} />)}
          </div>
          <details className="logic-node-register"><summary>All {boxes.length} nodes: scope, status and sources</summary><div>{boxes.map((item: any) => <NodeDetails key={item.id} item={item} />)}</div></details>
          <a className="logic-back-link" href={'#' + section.id}>Back to diagram ↑</a>
        </section>;
      })}</div>
    </div>
  </div>;
}

export default LogicForest;
