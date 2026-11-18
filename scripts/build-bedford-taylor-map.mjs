import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {buildBedfordTaylorLogic} from './build-bedford-taylor-logic.mjs';
import {buildBedfordTaylorOverview} from './build-bedford-taylor-overview.mjs';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds={known:'Known results',model:'Model cases',obstruction:'Obstructions',open:'Open directions'};
const byId=items=>new Map(items.map(item=>[item.id,item]));
const sameIds=(actual,expected)=>JSON.stringify([...actual].sort())===JSON.stringify([...expected].sort());

/** The primary logical diagrams and secondary complete record index share a
 * frozen source register. Reviewed proof relations are separate from topic
 * membership. Edition bindings require review when current.json moves.
 */
export async function buildBedfordTaylorMap({root,frozenPublic,revision,currentBase,currentLink,mapURL}){
  const read=async file=>JSON.parse(await readFile(file,'utf8'));
  const [map,topics,programme,definitionData]=await Promise.all([
    read(path.join(root,'content/bedford-taylor/research-map.json')),
    read(path.join(frozenPublic,'data/topics.json')),
    read(path.join(frozenPublic,'data/programme.json')),
    read(path.join(frozenPublic,'data/definitions.json'))
  ]);
  if(map.schemaVersion!==1||map.project!=='bedford-taylor'||map.edition!==revision||map.relation!=='navigation')throw Error('Research map must be reviewed against the selected Bedford–Taylor edition');
  const records=byId(topics),formal=byId(programme.items),definitions=byId(definitionData.definitions);
  if(!sameIds(map.branches.flatMap(b=>b.topicIds),records.keys()))throw Error('Research map must assign every topic to exactly one primary branch');
  if(!sameIds(map.branches.flatMap(b=>b.programmeIds),formal.keys()))throw Error('Research map must assign every formal open item to exactly one primary branch');
  const ids=new Set();
  const checkId=id=>{if(!/^[a-z][a-z0-9-]+$/.test(id)||ids.has(id))throw Error('Invalid or repeated map anchor: '+id);ids.add(id);};
  const requireIds=(list,index)=>{for(const id of list)if(!index.has(id))throw Error('Unknown research-map source ID: '+id);};
  for(const branch of map.branches){
    checkId(branch.id);requireIds(branch.definitionIds,definitions);
    for(const node of branch.nodes){
      checkId(node.id);requireIds(node.topicIds,records);requireIds(node.programmeIds,formal);
      if(!kinds[node.kind])throw Error('Unknown research-map node kind: '+node.kind);
      if(!(node.topicIds.length+node.programmeIds.length+node.links.length))throw Error('Unlinked research-map node: '+node.id);
    }
    for(const id of branch.programmeIds)if(!branch.nodes.some(n=>n.programmeIds.includes(id)))throw Error('Formal programme item missing from the visible tree: '+id);
  }
  const href=url=>esc(currentLink(url));
  const formalHref=item=>href(item.paperLink.href);
  const countLabel=(n,noun)=>`${n} ${noun}${n===1?'':'s'}`;
  const sourceLink=(url,label,extra='')=>`<a href="${href(url)}"${extra}>${esc(label)}</a>`;
  const formalLink=(id,branch)=>{
    const item=formal.get(id);
    const primary=branch.programmeIds.includes(id)?` data-map-programme="${esc(id)}"`:'';
    return `<li${primary} data-programme-status="${esc(item.status)}"><span class="bt-map-formal-label">Open ${esc(item.type.toLowerCase())} · ${esc(item.paperLink.number)}</span><a href="${formalHref(item)}">${esc(item.title)}</a><span class="bt-map-permanent-id">${esc(item.mpmId)}</span></li>`;
  };
  const renderNode=(node,branch)=>{
    const first=node.programmeIds.length?formal.get(node.programmeIds[0]).paperLink.href:node.topicIds.length?records.get(node.topicIds[0]).url:node.links[0].url;
    const usedFormal=new Set(node.programmeIds.map(id=>formal.get(id).paperLink.href));
    const extraLinks=node.links.filter(link=>!usedFormal.has(link.url));
    return `<li class="bt-map-node bt-map-kind-${esc(node.kind)}" id="${esc(node.id)}"><div class="bt-map-node-kind">${esc(kinds[node.kind])}</div><div class="bt-map-node-copy"><h3>${sourceLink(first,node.title)}</h3><p>${esc(node.summary)}</p>${node.topicIds.length?`<div class="bt-map-record-links" aria-label="Research records">${node.topicIds.map(id=>sourceLink(records.get(id).url,id,` title="${esc(records.get(id).title)}"`)).join('')}</div>`:''}${node.programmeIds.length?`<ul class="bt-map-formal-links">${node.programmeIds.map(id=>formalLink(id,branch)).join('')}</ul>`:''}${extraLinks.length?`<div class="bt-map-source-links">${extraLinks.map(link=>sourceLink(link.url,link.label+'')).join('')}</div>`:''}</div></li>`;
  };
  const renderBranch=(branch,i)=>`<details class="bt-map-branch" id="${esc(branch.id)}" data-map-branch open><summary><span class="bt-map-number">${String(i+1).padStart(2,'0')}</span><span class="bt-map-branch-heading"><h2>${esc(branch.title)}</h2><span>${esc(branch.summary)}</span><span class="bt-map-branch-counts">${countLabel(branch.topicIds.length,'record')}${branch.programmeIds.length?' · '+countLabel(branch.programmeIds.length,'formal open item'):''}</span></span><span class="bt-map-disclosure" aria-hidden="true"></span></summary><div class="bt-map-branch-body"><ul class="bt-map-nodes">${branch.nodes.map(n=>renderNode(n,branch)).join('')}</ul><div class="bt-map-branch-reference"><details class="bt-map-register" data-map-register><summary>All ${branch.topicIds.length} research records in this branch <span>Titles &amp; source status</span></summary><ul>${branch.topicIds.map(id=>{
    const item=records.get(id);
    return `<li data-map-record="${esc(id)}" data-source-status="${esc(item.sourceStatusCode)}"><a href="${href(item.url)}"><span class="bt-map-record-id">${esc(id)}</span><span>${esc(item.title)}</span></a><span class="bt-map-source-status status-${esc(item.sourceStatusCode)}">${esc(item.sourceStatus)}</span></li>`;
  }).join('')}</ul></details>${branch.definitionIds.length?`<div class="bt-map-definitions"><span>Definitions</span>${branch.definitionIds.map(id=>sourceLink(definitions.get(id).url,definitions.get(id).title)).join('')}</div>`:''}<a class="bt-map-top-link" href="#research-tree">Back to the tree overview ↑</a></div></div></details>`;
  const logic=await buildBedfordTaylorLogic({root,revision,currentBase,currentLink,mapURL,topics,programme:programme.items});
  const overview=await buildBedfordTaylorOverview({root,revision,currentBase,currentLink,mapURL});
  const html=`<main id="main-content" class="shell bt-map bt-logical-map" data-map-edition="${esc(revision)}">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${currentBase}/">Project overview</a><span aria-hidden="true">/</span><span>Research map</span></nav>
    <header class="bt-map-hero"><p class="eyebrow">Premises → deductions → open steps</p><h1>${esc(logic.title)}</h1><p class="bt-map-deck">What each result needs, what it gives, and where the next argument is missing.</p><p class="bt-map-intro">Start with the overall logical map, then follow ${logic.counts.panels} focused diagrams. Joint hypotheses, alternative sufficient routes and obstacles appear in the connections themselves; every connection opens its full scope and proof references.</p><div class="bt-map-stats"><span><strong>${overview.counts.nodes}</strong> logical nodes</span><span><strong>${overview.counts.relations}</strong> explained connections</span><span><strong>${programme.items.length}</strong> formal open items</span><a href="${currentBase}/editions/${esc(revision)}/">Source edition ${esc(revision)}</a></div><nav class="bt-map-entry-links" aria-label="Choose a reading level"><a href="#total-logic">Overall logical map ↓</a><a href="#logic-overview">Focused diagrams</a><a href="#record-index">Complete record index</a></nav></header>
    ${overview.html}
    <div class="bt-map-layout">
      <aside class="bt-map-sidebar">${overview.navHTML}${logic.navHTML}<div class="bt-map-reading-links"><a href="${currentBase}/results/">Progress overview</a><a href="${currentBase}/papers/research-program/">Full research programme</a></div></aside>
      <div class="bt-logic-main">${logic.html}<details class="bt-logic-complete-index" id="record-index"><summary><h2>Complete record index</h2><span>${topics.length} research records · ${programme.items.length} formal open items · ${definitions.size} definition groups</span></summary><div class="bt-map-tree" id="research-tree"><section class="bt-map-root" aria-label="Record index"><p class="eyebrow">Browse every source record</p><h2><a href="${currentBase}/">Non-Archimedean Bedford–Taylor theory</a></h2><p>The index below groups the complete source corpus by subject. The logical connections are shown in the diagrams above.</p></section><div class="bt-map-tree-guide"><p>${esc(map.readingNote)}</p><div class="bt-map-legend" aria-label="Node types">${Object.entries(kinds).map(([kind,label])=>`<span class="bt-map-kind-${kind}"><i aria-hidden="true"></i>${label}</span>`).join('')}</div><div class="bt-map-controls" data-map-controls hidden><button type="button" data-map-expand>Expand all branches</button><button type="button" data-map-collapse>Collapse all branches</button></div></div><div class="bt-map-branches">${map.branches.map(renderBranch).join('')}</div><section class="bt-map-scope"><h2>Reading the results in context</h2><p>${esc(map.scopeNote)}</p><p>“Known results” includes foundational inputs and results established in the source. “Model cases” retain their model hypotheses. The record lists show the exact source status; full statements and proof locations are one link away. Open items retain their conjecture, question or problem status.</p><p><a href="${currentBase}/conjectures/">Definitions and conjectures</a> · <a href="${currentBase}/versions/">Editions and corrections</a></p></section></div></details></div>
    </div>
  </main>`;
  const searchIndex=[{id:'bedford-taylor-research-map',title:'Logical research map · Non-Archimedean Bedford–Taylor theory',summary:logic.description,keywords:['Bedford–Taylor','research map','logical tree','overall logical map','proof dependencies','joint hypotheses','known results','conjectures','research programme'],link:currentBase+'/map/',category:'Research map',body:overview.searchText+' '+logic.searchText+' '+map.branches.map(b=>b.title+' '+b.summary).join(' '),project:'bedford-taylor',version:revision},{id:'bedford-taylor-overall-logical-map',title:'Overall logical map · Non-Archimedean Bedford–Taylor theory',summary:'The complete logical graph and its principal proof routes, linking bounded calculus, actual relation descent and finite energy.',keywords:['overall map','total logic','cross-branch dependencies','Bedford–Taylor'],link:currentBase+'/map/#total-logic',category:'Research map',body:overview.searchText,project:'bedford-taylor',version:revision}];
  return {html,searchIndex,description:logic.description};
}
