import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const relationLabels={
  implication:'Deduction',equivalence:'Equivalence','proof-dependency':'Proof input',
  specialization:'Specialization','open-step':'Open step',obstruction:'Obstruction'
};
export const nodeLabels={known:'Established in source',model:'Model case',open:'Open',condition:'Hypothesis',obstruction:'Obstruction'};
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const graphId=(section,panel)=>section.id+'-'+panel.id;
export const relationAnchor=(section,relation)=>'logic-'+section.id+'-'+relation.id;

export async function loadBedfordTaylorLogic(root,revision){
  const dir=path.join(root,'content/bedford-taylor');
  const read=async file=>JSON.parse(await readFile(file,'utf8'));
  const index=await read(path.join(dir,'research-logic.json'));
  if(index.schemaVersion!==1||index.project!=='bedford-taylor'||index.edition!==revision)throw Error('Logical map requires review against the selected mathematical edition');
  const sections=[],sectionIds=new Set(),nodeIds=new Set(),relationIds=new Set(),panelIds=new Set();
  const sourcePrefix='/math-research-atlas/projects/bedford-taylor/editions/'+revision+'/';
  const safeId=id=>typeof id==='string'&&/^[a-z][a-z0-9-]*$/.test(id);
  const checkLinks=(links,owner)=>{
    if(!Array.isArray(links)||!links.length)throw Error('Logical map lacks source evidence: '+owner);
    for(const link of links)if(!link.label||!link.url?.startsWith(sourcePrefix))throw Error('Logical map source must be pinned to its edition: '+owner);
  };
  for(const file of index.components){
    if(!/^logic-[a-z]+\.json$/.test(file))throw Error('Invalid logical-map component path');
    const section=await read(path.join(dir,file));
    if(!safeId(section.id)||sectionIds.has(section.id)||!section.title||!section.scope)throw Error('Invalid logical-map section');
    sectionIds.add(section.id);
    const nodes=new Map(),relations=new Map(),panels=new Set();
    for(const node of section.nodes){
      if(!safeId(node.id)||nodeIds.has(node.id)||!nodeLabels[node.status]||!node.title||!node.summary)throw Error('Invalid logical-map node: '+node.id);
      checkLinks(node.links,node.id);nodes.set(node.id,node);nodeIds.add(node.id);
    }
    for(const relation of section.relations){
      if(!safeId(relation.id)||relationIds.has(relation.id)||!relationLabels[relation.kind]||!relation.explanation)throw Error('Invalid logical relation: '+relation.id);
      if(!Array.isArray(relation.premises)||!relation.premises.length||new Set(relation.premises).size!==relation.premises.length)throw Error('Invalid joint premises: '+relation.id);
      for(const id of [...relation.premises,relation.conclusion])if(!nodes.has(id))throw Error('Unknown logical-map node: '+id);
      if(relation.premises.includes(relation.conclusion))throw Error('Circular logical relation: '+relation.id);
      if(!Array.isArray(relation.hypotheses))throw Error('Additional hypotheses must be explicit: '+relation.id);
      if(relation.kind==='equivalence'&&relation.premises.length!==1)throw Error('An equivalence needs one precise assertion on each side: '+relation.id);
      checkLinks(relation.links,relation.id);relations.set(relation.id,relation);relationIds.add(relation.id);
    }
    const covered=new Set();
    for(const panel of section.panels){
      if(!safeId(panel.id)||panelIds.has(panel.id)||!panel.title||!panel.summary||!panel.relationIds?.length)throw Error('Invalid logical-map panel');
      panels.add(panel.id);panelIds.add(panel.id);
      for(const id of panel.relationIds){if(!relations.has(id))throw Error('Unknown panel relation: '+id);if(covered.has(id))throw Error('A logical relation needs one primary explanation: '+id);covered.add(id);}
      const needed=new Set(panel.relationIds.flatMap(id=>{const r=relations.get(id);return [...r.premises,r.conclusion];}));
      if(panel.nodeIds&&[...needed].some(id=>!panel.nodeIds.includes(id)))throw Error('Panel omits a logical input: '+panel.id);
    }
    if(covered.size!==relations.size)throw Error('A logical relation disappeared from its diagrams: '+section.id);
    const adjacency=new Map([...nodes.keys()].map(id=>[id,[]]));
    for(const relation of relations.values())if(!['open-step','obstruction'].includes(relation.kind))for(const premise of relation.premises)adjacency.get(premise).push(relation.conclusion);
    const visiting=new Set(),visited=new Set();
    const visit=id=>{if(visiting.has(id))throw Error('Circular proof support in logical map: '+id);if(visited.has(id))return;visiting.add(id);for(const next of adjacency.get(id))visit(next);visiting.delete(id);visited.add(id);};
    for(const id of nodes.keys())visit(id);
    sections.push(section);
  }
  return {...index,sections};
}

export async function diagramGeneratorHash(root){
  const [renderer,shared]=await Promise.all([
    readFile(path.join(root,'scripts/render-bedford-taylor-logic.mjs')),
    readFile(path.join(root,'lib/bedford-taylor-logic.mjs'))
  ]);
  return hash(Buffer.concat([renderer,Buffer.from('\n--shared-logical-schema--\n'),shared]));
}
export function panelData(section,panel){
  const relations=panel.relationIds.map(id=>section.relations.find(r=>r.id===id));
  const ids=new Set(relations.flatMap(r=>[...r.premises,r.conclusion]));
  return {relations,nodes:section.nodes.filter(node=>ids.has(node.id))};
}
export function panelHash(section,panel,edition,generatorHash){
  return hash(JSON.stringify({edition,generatorHash,section:section.id,panel,...panelData(section,panel)}));
}
