import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {loadBedfordTaylorLogic,diagramGeneratorHash,panelHash,graphId,relationAnchor,relationLabels,nodeLabels,esc,hash} from '../lib/bedford-taylor-logic.mjs';

/** This derived view is bound to the frozen source edition. Its labelled
 * relations record proof inputs and conditional deductions, not new results.
 * SVGs and the accessible reading view share the same mathematical data.
 */
export async function buildBedfordTaylorLogic({root,revision,currentBase,currentLink,topics,programme,mapURL=currentBase+'/map/'}){
  const logic=await loadBedfordTaylorLogic(root,revision);
  const directory=path.join(root,'content/bedford-taylor/logic-diagrams');
  const manifest=JSON.parse(await readFile(path.join(directory,'manifest.json'),'utf8'));
  const generatorHash=await diagramGeneratorHash(root);
  if(manifest.edition!==revision||manifest.generatorHash!==generatorHash)throw Error('Logical diagram generator or edition changed; run npm run build:bt-logic');
  const topicIndex=new Map(topics.map(t=>[t.id,t])),programmeIndex=new Map(programme.map(p=>[p.id,p]));
  const coveredTopics=new Set(logic.sections.flatMap(s=>s.nodes.flatMap(n=>n.topicIds||[])));
  const coveredProgramme=new Set(logic.sections.flatMap(s=>s.nodes.flatMap(n=>n.programmeIds||[])));
  for(const id of topicIndex.keys())if(!coveredTopics.has(id))throw Error('Research record missing from logical map: '+id);
  for(const id of programmeIndex.keys())if(!coveredProgramme.has(id))throw Error('Formal open item missing from logical map: '+id);
  const sourceLink=(url,label,extra='')=>`<a href="${esc(currentLink(url))}"${extra}>${esc(label)}</a>`;
  const labelFor=(relation,nodes)=>relation.kind==='obstruction'?'Blocks this shortcut':relation.kind==='implication'&&relation.premises.some(id=>['condition','open'].includes(nodes.get(id).status))?'Conditional deduction':relationLabels[relation.kind];
  const svgById=new Map();
  for(const section of logic.sections){
    for(const node of section.nodes){
      for(const id of node.topicIds||[])if(!topicIndex.has(id))throw Error('Unknown logical-map topic: '+id);
      for(const id of node.programmeIds||[])if(!programmeIndex.has(id))throw Error('Unknown logical-map programme item: '+id);
    }
    for(const panel of section.panels){
      const id=graphId(section,panel),entry=manifest.diagrams.find(d=>d.id===id);
      if(!entry||entry.file!==id+'.svg'||entry.inputHash!==panelHash(section,panel,revision,generatorHash))throw Error('Stale logical diagram inputs: '+id+'; run npm run build:bt-logic');
      const svg=await readFile(path.join(directory,entry.file),'utf8');
      if(hash(svg)!==entry.sha256)throw Error('Logical diagram bytes differ from their manifest: '+id);
      if(/<(?:script|foreignObject)\b|\son\w+=/i.test(svg))throw Error('Unexpected active content in a logical diagram');
      svgById.set(id,svg);
    }
  }
  const panelCount=logic.sections.reduce((sum,s)=>sum+s.panels.length,0);
  if(manifest.diagrams.length!==panelCount)throw Error('Unexpected logical diagram manifest coverage');
  let panelNumber=0;
  const renderSection=(section,sectionIndex)=>{
    const nodes=new Map(section.nodes.map(n=>[n.id,n]));
    const renderRelation=(relation,index)=>{
      const result=nodes.get(relation.conclusion),label=labelFor(relation,nodes),anchor=relationAnchor(section,relation);
      const feedback=currentBase.split('/projects/')[0]+'/feedback/?'+new URLSearchParams({project:'bedford-taylor',version:revision,page:mapURL+'#'+anchor}).toString();
      const alternative=relation.kind==='implication'&&section.relations.filter(r=>r.conclusion===relation.conclusion&&r.kind==='implication').length>1;
      const inputLinks=relation.premises.map(id=>{
        const node=nodes.get(id);
        return `<li><span class="bt-logic-status status-${esc(node.status)}">${esc(nodeLabels[node.status])}</span>${sourceLink(node.links[0].url,node.title)}<a class="bt-logic-context-link" href="#logic-node-${esc(node.id)}">Scope &amp; related steps</a></li>`;
      }).join('');
      const summaryInputs=relation.premises.map(id=>`<span>${esc(nodes.get(id).title)}</span>`).join('<b class="bt-logic-and">AND</b>');
      return `<li><details class="bt-logic-relation kind-${esc(relation.kind)}" id="${esc(anchor)}" data-logic-relation="${esc(relation.id)}" data-relation-kind="${esc(relation.kind)}"><summary><span class="bt-logic-step-number">${String(index+1).padStart(2,'0')}</span><span class="bt-logic-step-heading" data-logic-flow="${esc(relation.id)}" data-relation-kind="${esc(relation.kind)}"><span class="bt-logic-type">${esc(label)}${alternative?' · alternative sufficient route':''}</span><span class="bt-logic-mobile-inputs">${summaryInputs}<span class="bt-logic-mobile-arrow" aria-label="${esc(label)}">${relation.kind==='obstruction'?'⊣':relation.kind==='equivalence'?'↕':'↓'} <small>${relation.hypotheses.length?'with '+relation.hypotheses.length+' stated '+(relation.hypotheses.length===1?'hypothesis':'hypotheses'):'see precise scope'}</small></span></span><strong>${esc(result.title)}</strong></span><span class="bt-logic-plus" aria-hidden="true">+</span></summary><div class="bt-logic-relation-body"><div class="bt-logic-premises"><h5>${relation.premises.length>1?'Joint inputs in this argument (AND)':'Input'}</h5><ul>${inputLinks}</ul></div>${relation.hypotheses.length?`<div class="bt-logic-hypotheses"><h5>${relation.kind==='open-step'?'The missing step and its scope':relation.kind==='obstruction'?'Scope of the obstruction':'Additional hypotheses'}</h5><ul>${relation.hypotheses.map(h=>`<li>${esc(h)}</li>`).join('')}</ul></div>`:''}<div class="bt-logic-conclusion status-${esc(result.status)}"><span>${esc(label)} · ${esc(nodeLabels[result.status])}</span><strong>${sourceLink(result.links[0].url,result.title)}</strong><a class="bt-logic-context-link" href="#logic-node-${esc(result.id)}">Scope &amp; related steps</a></div><h5>${relation.kind==='open-step'?'What remains to be established':relation.kind==='obstruction'?'Why this shortcut is blocked':'Why the connection holds'}</h5><p class="bt-logic-explanation">${esc(relation.explanation)}</p><ul class="bt-logic-evidence" aria-label="Proof and statement references">${relation.links.map(link=>`<li>${sourceLink(link.url,link.label)} <a class="bt-logic-frozen" href="${esc(link.url)}">${esc(revision)} source</a></li>`).join('')}</ul><a class="bt-logic-permalink" href="#${esc(anchor)}">Link to this logical step</a> <a class="bt-logic-permalink bt-logic-feedback" data-logic-feedback="${esc(relation.id)}" href="${esc(feedback)}">Discuss this logical step</a></div></details></li>`;
    };
    const panels=section.panels.map((panel,index)=>{
      panelNumber++;
      const id=graphId(section,panel),relations=panel.relationIds.map(id=>section.relations.find(r=>r.id===id));
      return `<details class="bt-logic-panel" id="${esc(panel.id)}" data-logic-panel="${esc(panel.id)}"${panelNumber===1?' open':''}><summary><span class="bt-logic-panel-number">${String(panelNumber).padStart(2,'0')}</span><span><h3>${esc(panel.title)}</h3><span class="bt-logic-panel-caption">${relations.length} logical steps · ${esc(panel.summary)}</span></span><span class="bt-logic-plus" aria-hidden="true">+</span></summary><div class="bt-logic-panel-body"><figure class="bt-logic-figure" data-logic-diagram="${esc(id)}"><figcaption>Read from top to bottom. Click a result for its statement; click a numbered connection for its full hypotheses and proof.</figcaption><div class="bt-logic-graph-tools" hidden><button type="button" data-logic-zoom="out" aria-label="Reduce diagram scale">−</button><output>100%</output><button type="button" data-logic-zoom="in" aria-label="Enlarge diagram scale">+</button><button type="button" data-logic-zoom="fit">Fit width</button><button type="button" data-logic-zoom="reset">Readable size</button><button type="button" data-logic-zoom="wide" aria-pressed="false">Wide layout</button></div><div class="bt-logic-graph-scroll" tabindex="0" role="region" aria-label="${esc(panel.title)} — scrollable logical diagram">${svgById.get(id)}</div></figure><div class="bt-logic-step-intro"><h4>Read the ${relations.length} connections</h4><p>Each step includes its joint inputs, additional hypotheses, conclusion and exact source. ${relations.some(r=>r.kind==='obstruction')?'A blocked shortcut does not disprove the target conjecture.':''}</p></div><ol class="bt-logic-relations">${relations.map(renderRelation).join('')}</ol><a class="bt-logic-back" href="#logic-overview">Back to logical branches ↑</a></div></details>`;
    }).join('');
    const records=section.nodes.map(node=>{
      const occurrences=section.panels.filter(p=>p.relationIds.some(id=>{const r=section.relations.find(r=>r.id===id);return r.conclusion===node.id||r.premises.includes(node.id);}));
      return `<li id="logic-node-${esc(node.id)}" data-logic-node="${esc(node.id)}" data-node-status="${esc(node.status)}"><span class="bt-logic-status status-${esc(node.status)}">${esc(nodeLabels[node.status])}</span><h4>${sourceLink(node.links[0].url,node.title)}</h4><p>${esc(node.summary)}</p><div class="bt-logic-node-links">${(node.topicIds||[]).map(id=>sourceLink(topicIndex.get(id).url,id)).join(' ')}${(node.programmeIds||[]).map(id=>sourceLink(programmeIndex.get(id).paperLink.href,id+' · OPEN')).join(' ')}${node.links.slice(1).map(link=>sourceLink(link.url,link.label)).join(' ')}</div><div class="bt-logic-occurrences">In the logic: ${occurrences.map(p=>`<a href="#${esc(p.id)}">${esc(p.title)}</a>`).join(' · ')}</div></li>`;
    }).join('');
    return `<section class="bt-logic-section" id="logic-${esc(section.id)}"><header><p class="eyebrow">Logical branch ${String(sectionIndex+1).padStart(2,'0')}</p><h2>${esc(section.title)}</h2><p>${esc(section.scope)}</p></header><nav class="bt-logic-panel-nav" aria-label="Choose a diagram in ${esc(section.title)}">${section.panels.map((panel,index)=>`<a href="#${esc(panel.id)}"><span>${String(index+1).padStart(2,'0')}</span>${esc(panel.title)}</a>`).join('')}</nav>${panels}<details class="bt-logic-records"><summary>Read the ${section.nodes.length} node statements and their scope</summary><ul>${records}</ul></details></section>`;
  };
  const html=`<section class="bt-logic-reading" id="logic-overview"><h2>How to read the logic</h2><p>Follow arrows from the required inputs to the conclusion. An <strong>AND</strong> junction requires every incoming input together with the linked hypotheses. An <strong>OR</strong> junction offers separate sufficient routes, each under its own hypotheses.</p><ul class="bt-logic-legend"><li><span class="bt-logic-line line-deduction" aria-hidden="true"></span><strong>Deduction</strong><span>Established under the stated hypotheses.</span></li><li><span class="bt-logic-line line-proof" aria-hidden="true"></span><strong>Proof input</strong><span>A used part of the proof; open the connection for the remaining assumptions.</span></li><li><span class="bt-logic-line line-open" aria-hidden="true"></span><strong>Open step</strong><span>The named missing argument must still be supplied.</span></li><li><span class="bt-logic-line line-obstruction" aria-hidden="true"></span><strong>Blocked shortcut</strong><span>An obstruction to the indicated method or inference.</span></li></ul><p class="bt-logic-status-note">Green nodes are established in the source; blue nodes retain model hypotheses. Ochre nodes are additional conditions, and purple nodes are open. A deduction using an open premise remains conditional. Select a diagram below; on a narrow screen, the same connections appear as a vertical reading flow.</p><nav class="bt-logic-quicknav" aria-label="Choose a logical branch">${logic.sections.map((section,i)=>`<a href="#logic-${esc(section.id)}"><span>${String(i+1).padStart(2,'0')}</span>${esc(section.title)}</a>`).join('')}</nav></section>${logic.sections.map(renderSection).join('')}`;
  const navHTML=`<nav aria-label="Logical diagrams"><h2>Logical branches</h2>${logic.sections.map((section,i)=>`<div class="bt-logic-nav-group"><a href="#logic-${esc(section.id)}"><span>${String(i+1).padStart(2,'0')}</span>${esc(section.title)}</a><ol>${section.panels.map(panel=>`<li><a href="#${esc(panel.id)}">${esc(panel.title)}</a></li>`).join('')}</ol></div>`).join('')}<a class="bt-logic-register-nav" href="#record-index">Complete record index</a></nav>`;
  return {html,navHTML,title:logic.title,description:logic.description,counts:{sections:logic.sections.length,panels:panelCount,nodes:logic.sections.reduce((n,s)=>n+s.nodes.length,0),relations:logic.sections.reduce((n,s)=>n+s.relations.length,0)},searchText:logic.sections.map(s=>s.title+' '+s.scope+' '+s.nodes.map(n=>n.title+' '+n.summary).join(' ')+' '+s.relations.map(r=>r.explanation).join(' ')).join(' ')};
}
