import type { Metadata } from 'next';
import { entries, entryById, edition, label } from '@/lib/content';
import { researchBranches, validateResearchMap } from '@/content/research-map.mjs';
import { globalRoutes } from '@/content/routes.mjs';
import { programmeSteps } from '@/content/programme.mjs';
import { pairingGroups } from '@/content/pairing-progress.mjs';
import { logicalTrees, validateLogicalMap } from '@/content/logical-map.mjs';
import { LogicForest } from '@/components/logic-tree';

export const metadata: Metadata = {
  title: 'Complete logical diagram: Beilinson–Bloch heights and Green forms',
  description: 'Top-down, linked logical diagrams of all 54 records: parallel premises, numbered deductions, alternative routes, equivalences and open bridges for Green forms and global heights.',
  alternates: { canonical: '/research-map' },
};

type Link = { href: string; label: string };
type Group = { id: string; title: string; records: string[] };
type Branch = {
  id: string; title: string; description: string; scope: string;
  plan: string[]; links: Link[]; groups: Group[]; routes?: boolean; pairingCases?: boolean;
};
const branches = researchBranches as Branch[];
const plans = new Map(programmeSteps.map(step => [step.id, step]));
const statusKey = (entry: (typeof entries)[number]) => entry.kind === 'definition' && entry.status === 'draft' ? 'definition' : entry.status;
const statusNames = [
  ['proved', 'Internal proof available'], ['conditional', 'Conditional'],
  ['draft', 'Draft · audit pending'], ['open', 'Open'], ['definition', 'Definition'],
] as const;

function Record({ id }: { id: string }) {
  const entry = entryById.get(id)!;
  return <li className="map-record" id={'map-' + id} data-map-item="record" data-record-id={id} data-status={entry.status}>
    <div className="map-record-heading">
      <a className="map-record-title" href={'/entries/' + id}>{entry.title}</a>
      <span className={'map-status map-status-' + statusKey(entry)}>{label(entry)}</span>
    </div>
    <p>{entry.summary}</p>
    <span className="map-record-id">{id}</span>
  </li>;
}

function RouteTree() {
  return <li className="map-group-node" data-map-container="">
    <details className="map-group" id="construction-routes" data-map-group="">
      <summary><span>Three construction routes</span><span className="map-count">3 routes</span></summary>
      <p className="map-group-intro">Alternative approaches to the global pairing, each with its own hypotheses.</p>
      <ul className="map-records">
        {globalRoutes.map(route => <li className="map-record map-route" key={route.id} data-map-item="route">
          <a className="map-record-title" href={'/routes/' + route.slug}>{route.title}</a>
          <p className="map-route-status">{route.status}</p>
          <p>{route.summary}</p>
          <a className="map-secondary-link" href={'/papers/' + route.paperSlug}>Formal article and PDF</a>
        </li>)}
      </ul>
    </details>
  </li>;
}

function PairingCaseTree() {
  return <li className="map-group-node" data-map-container="">
    <details className="map-group" id="geometric-cases" data-map-group="">
      <summary><span>Pairing domains and geometric cases</span><span className="map-count">{pairingGroups.reduce((n, g) => n + g.cases.length, 0)} cases</span></summary>
      <p className="map-group-intro">These constructions retain the Green-form and reciprocity hypotheses. Each case states its additional geometric or model assumptions.</p>
      <ol className="map-groups map-case-groups">
        {pairingGroups.map(group => <li key={group.id} className="map-group-node" data-map-container="">
          <details className="map-group" data-map-group="">
            <summary><span>{group.title.replace(/^\d+\.\s*/, '')}</span><span className="map-count">{group.cases.length} cases</span></summary>
            <ul className="map-records">
              {group.cases.map(item => <li key={item.id} className="map-record" data-map-item="case">
                <a className="map-record-title" href={'/results#' + item.id}>{item.title}</a>
                <p className="map-case-status">{item.status}</p>
                <a className="map-secondary-link" href={item.proof.href}>{item.proof.label}</a>
                {item.children?.length ? <details className="map-applications">
                  <summary>Geometric applications ({item.children.length})</summary>
                  <ul>{item.children.map(child => <li key={child.title}><a href={'/results#' + item.id}>{child.title}</a></li>)}</ul>
                </details> : null}
              </li>)}
            </ul>
          </details>
        </li>)}
      </ol>
    </details>
  </li>;
}

export default function ResearchMapPage() {
  validateResearchMap(entries);
  validateLogicalMap(entries);
  return <div className="site-shell research-map">
    <header className="map-header">
      <p className="eyebrow">Beilinson–Bloch heights · the structure of the arguments</p>
      <h1>Complete logical diagram</h1>
      <p>Results, exact premises and open steps, arranged in top-down diagrams. Parallel inputs meet at numbered logical connections; each connection links to its full hypotheses, explanation and sources below the graph.</p>
      <div className="map-edition">Based on mathematical edition <a href={'/editions/' + edition.revision + '/'}>{edition.revision}</a> · {logicalTrees.length} linked proof trees · {entries.length} permanent records</div>
      <p><a href="/results/proof-diagrams">Follow the detailed proof diagrams for every Progress result →</a></p>
    </header>

    <section className="map-reading-key" aria-labelledby="strong-green-height-theorem">
      <h2 id="strong-green-height-theorem">Why Strong G matters: a full height construction</h2>
      <p><strong>Theorem 7.5 (PH16) proves the implication from Strong G to the full Beilinson–Bloch height pairing, within the stated analytic foundations.</strong> Strong G is required at every finite completion in both complementary codimensions, for every specified geometrically homologically trivial rational cycle. The proof includes reciprocity, a finite sum over places and descent through rational equivalence.</p>
      <p>The first tree keeps the analytic and global inputs together at its AND connection. General Strong G remains open; positivity, nondegeneracy and arithmetic finiteness are further questions.</p>
      <p><a href="/papers/global-height-pairing#r16ph:general-height">Theorem and complete proof →</a> · <a href="/papers/global-height-pairing#sec:height-hypotheses">Analytic foundations</a> · <a href="/about">Review status</a></p>
    </section>

    <LogicForest trees={logicalTrees} />

    <details className="map-reference-index" id="complete-record-index">
    <summary>Complete record index <span>{entries.length} records · supporting topic index</span></summary>
    <div data-research-map="">
    <section className="map-reading-key" aria-label="How to read the map">
      <div className="map-legend">{statusNames.map(([status, name]) => <span key={status} className={'map-status map-status-' + status}>{name}<span className="map-status-count">{entries.filter(entry => statusKey(entry) === status).length}</span></span>)}</div>
      <p>This supplementary index preserves all source records. Branches group related topics for reading; the logical relations are in the proof trees above. “Internal proof available” indicates a supplied argument, not independent certification.</p>
    </section>

    <div className="map-controls" hidden>
      <div className="map-search"><label htmlFor="map-search">Find in this map</label><input type="search" id="map-search" placeholder="Title, topic or permanent ID" autoComplete="off" /></div>
      <div className="map-control-buttons"><button type="button" data-map-expand="">Expand all</button><button type="button" data-map-overview="">Overview</button></div>
      <p className="map-match-count" role="status" aria-live="polite" aria-atomic="true">{entries.length} records in {branches.length} branches</p>
    </div>

    <div className="map-tree">
      <ol className="map-branches">
        {branches.map((branch, index) => {
          const count = branch.groups.reduce((n, group) => n + group.records.length, 0);
          return <li className="map-branch-node" id={branch.id} key={branch.id} data-map-container="" data-map-branch-node="">
            <details className="map-branch" data-map-branch="">
              <summary className="map-branch-summary">
                <span className="map-branch-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <span className="map-branch-copy"><span className="map-branch-title">{branch.title}</span><span className="map-branch-description">{branch.description}</span></span>
                <span className="map-count">{count} records</span>
              </summary>
              <div className="map-branch-body">
                <p className="map-scope">{branch.scope}</p>
                <ol className="map-groups">
                  {branch.groups.map(group => <li key={group.id} className="map-group-node" data-map-container="">
                    <details className="map-group" id={group.id} data-map-group="">
                      <summary><span>{group.title}</span><span className="map-count">{group.records.length}</span></summary>
                      <ul className="map-records">{group.records.map(id => <Record key={id} id={id} />)}</ul>
                    </details>
                  </li>)}
                  {branch.routes ? <RouteTree /> : null}
                  {branch.pairingCases ? <PairingCaseTree /> : null}
                  <li className="map-group-node map-plan-node" data-map-container="">
                    <details className="map-group map-plan" data-map-group="">
                      <summary><span>Research plan</span><span className="map-count">{branch.plan.length === 1 ? 'Next problem' : 'Next problems'}</span></summary>
                      <ul className="map-records">{branch.plan.map(id => {
                        const step = plans.get(id)!;
                        if (!step) throw new Error('Missing research-map programme step: ' + id);
                        return <li className="map-record" key={id} data-map-item="plan">
                          <a className="map-record-title" href={'/programme#' + step.id}>{step.title}</a><p>{step.goal}</p>
                          <a className="map-secondary-link" href={step.paper}>Precise problem and proposed argument</a>
                        </li>;
                      })}</ul>
                    </details>
                  </li>
                </ol>
                <nav className="map-branch-reading" aria-label={branch.title + ': further reading'}>{branch.links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav>
              </div>
            </details>
          </li>;
        })}
      </ol>
      <p className="map-empty" hidden>No matching item. Try a shorter title or a permanent ID.</p>
    </div>
    </div>
    </details>
    <nav className="map-footer-links" aria-label="Research map resources"><a href="/records">All permanent records</a><a href="/dependencies">Proof dependencies</a><a href="/papers">Papers and PDFs</a><a href="/programme">Research programme</a></nav>
  </div>;
}
