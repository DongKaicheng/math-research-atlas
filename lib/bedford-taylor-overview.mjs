import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {hash,relationAnchor,relationLabels,nodeLabels} from './bedford-taylor-logic.mjs';

const safeId=value=>typeof value==='string'&&/^[a-z][a-z0-9-]*$/.test(value);
const uniqueRefs=(values,label)=>{
  if(!Array.isArray(values)||values.some(id=>!safeId(id))||new Set(values).size!==values.length)throw Error('Invalid or duplicate overview references: '+label);
  return values;
};

/** A reading projection of the existing logical records. A selected relation
 * always brings every joint premise with it; a view never invents a shortcut.
 * Cross-branch records are reviewed, edition-bound relations in their own right.
 */
export async function loadBedfordTaylorOverview(root,logic){
  const directory=path.join(root,'content/bedford-taylor');
  const [config,bridges]=await Promise.all(['logic-overview.json','logic-bridges.json'].map(async file=>JSON.parse(await readFile(path.join(directory,file),'utf8'))));
  const checkBinding=(record,label)=>{
    if(record.schemaVersion!==1||record.project!=='bedford-taylor'||record.edition!==logic.edition)throw Error('Overview '+label+' requires review against the selected mathematical edition');
  };
  checkBinding(config,'configuration');checkBinding(bridges,'cross-branch connections');
  if(!config.title||!config.description||!Array.isArray(config.views)||!config.views.length)throw Error('Incomplete logical overview configuration');
  if(!safeId(bridges.id)||!bridges.title||!bridges.scope||!Array.isArray(bridges.nodes)||!Array.isArray(bridges.relations))throw Error('Incomplete cross-branch logical records');

  const sections=[...logic.sections,bridges],sectionIds=new Set(),nodes=new Map(),relations=new Map();
  const prefix='/math-research-atlas/projects/bedford-taylor/editions/'+logic.edition+'/';
  const checkLinks=(links,owner)=>{
    if(!Array.isArray(links)||!links.length)throw Error('Overview lacks source evidence: '+owner);
    for(const link of links){
      if(!link.label||typeof link.url!=='string'||!link.url.startsWith(prefix))throw Error('Overview source must be pinned to its edition: '+owner);
      const parsed=new URL(link.url,'https://atlas.invalid');
      if(parsed.origin!=='https://atlas.invalid'||!parsed.pathname.startsWith(prefix))throw Error('Overview source escapes its pinned edition: '+owner);
    }
  };
  for(const section of sections){
    if(!safeId(section.id)||sectionIds.has(section.id)||!section.title||!section.scope)throw Error('Invalid or duplicate overview section: '+section.id);
    sectionIds.add(section.id);
    for(const node of section.nodes){
      if(!safeId(node.id)||nodes.has(node.id)||!nodeLabels[node.status]||!node.title||!node.summary)throw Error('Invalid or duplicate overview node: '+node.id);
      checkLinks(node.links,node.id);
      nodes.set(node.id,{...node,sectionId:section.id});
    }
  }
  for(const section of sections)for(const relation of section.relations){
    if(!safeId(relation.id)||relations.has(relation.id)||!relationLabels[relation.kind]||!relation.explanation)throw Error('Invalid or duplicate overview relation: '+relation.id);
    const premises=uniqueRefs(relation.premises,relation.id);
    if(!premises.length)throw Error('Overview relation has no input: '+relation.id);
    for(const id of [...premises,relation.conclusion])if(!nodes.has(id))throw Error('Unknown overview relation node: '+id);
    if(premises.includes(relation.conclusion))throw Error('Circular overview relation: '+relation.id);
    if(!Array.isArray(relation.hypotheses)||relation.hypotheses.some(value=>typeof value!=='string'||!value.trim()))throw Error('Overview additional hypotheses must be explicit: '+relation.id);
    if(relation.kind==='equivalence'&&premises.length!==1)throw Error('Overview equivalence needs one precise assertion on each side: '+relation.id);
    checkLinks(relation.links,relation.id);
    relations.set(relation.id,{...relation,sectionId:section.id,anchor:relationAnchor(section,relation)});
  }

  // An extra bridge must not close a cycle that individual component checks
  // cannot see. Open goals and blocked shortcuts are not established support.
  const adjacency=new Map([...nodes.keys()].map(id=>[id,[]]));
  for(const relation of relations.values())if(!['open-step','obstruction'].includes(relation.kind))for(const premise of relation.premises)adjacency.get(premise).push(relation.conclusion);
  const active=new Set(),visited=new Set();
  const visit=id=>{
    if(active.has(id))throw Error('Circular established support in overview: '+id);
    if(visited.has(id))return;
    active.add(id);for(const next of adjacency.get(id))visit(next);active.delete(id);visited.add(id);
  };
  for(const id of nodes.keys())visit(id);

  const viewIds=new Set();
  const views=config.views.map(view=>{
    if(!safeId(view.id)||viewIds.has(view.id)||!view.title||!view.summary)throw Error('Invalid or duplicate logical overview view: '+view.id);
    viewIds.add(view.id);
    if(view.includeAll!==undefined&&typeof view.includeAll!=='boolean')throw Error('Invalid complete-overview selection: '+view.id);
    if(view.includeAll&&(view.relationIds!==undefined||view.nodeIds!==undefined))throw Error('A complete overview cannot also contain a selective record list: '+view.id);
    const relationIds=view.includeAll?[...relations.keys()]:uniqueRefs(view.relationIds,view.id+' relations');
    const additionalNodes=view.nodeIds===undefined?[]:uniqueRefs(view.nodeIds,view.id+' nodes');
    if(!relationIds.length)throw Error('Logical overview has no connections: '+view.id);
    for(const id of relationIds)if(!relations.has(id))throw Error('Unknown overview relation reference: '+id);
    for(const id of additionalNodes)if(!nodes.has(id))throw Error('Unknown overview node reference: '+id);
    const selectedRelations=relationIds.map(id=>relations.get(id));
    const requiredNodes=new Set(view.includeAll?[...nodes.keys()]:[...additionalNodes,...selectedRelations.flatMap(relation=>[...relation.premises,relation.conclusion])]);
    const selectedNodes=[...nodes.values()].filter(node=>requiredNodes.has(node.id));
    const requiredGroups=new Set([...selectedNodes.map(node=>node.sectionId),...selectedRelations.map(relation=>relation.sectionId)]);
    const groups=sections.filter(section=>requiredGroups.has(section.id)).map(({id,title,scope})=>({id,title,scope}));
    return {...view,nodes:selectedNodes,relations:selectedRelations,groups};
  });
  if(!views.some(view=>view.id==='complete'&&view.includeAll))throw Error('Logical overview requires an explicit complete graph');
  return {...config,bridges,nodes,relations,views};
}

export async function overviewGeneratorHash(root){
  const files=['scripts/render-bedford-taylor-overview.mjs','lib/bedford-taylor-overview.mjs','lib/bedford-taylor-logic.mjs'];
  const contents=await Promise.all(files.map(file=>readFile(path.join(root,file))));
  return hash(Buffer.concat(contents.flatMap((bytes,index)=>[Buffer.from('\n--'+files[index]+'--\n'),bytes])));
}

export function overviewViewHash(view,edition,generatorHash){
  // Include the full records and all ambient scopes, not only the text printed
  // inside a node. This also binds canonical links and every extra hypothesis.
  return hash(JSON.stringify({edition,generatorHash,view}));
}
