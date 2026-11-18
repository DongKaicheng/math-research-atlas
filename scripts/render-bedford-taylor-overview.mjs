// Regenerate the source-bound global graphs. The ordinary website build checks
// these artifacts and does not invoke Graphviz.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {loadBedfordTaylorLogic,relationLabels,nodeLabels,esc,hash} from '../lib/bedford-taylor-logic.mjs';
import {loadBedfordTaylorOverview,overviewGeneratorHash,overviewViewHash} from '../lib/bedford-taylor-overview.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pointer=JSON.parse(await readFile(path.join(root,'content/bedford-taylor/current.json'),'utf8'));
const logic=await loadBedfordTaylorLogic(root,pointer.revision);
const overview=await loadBedfordTaylorOverview(root,logic);
const generatorHash=await overviewGeneratorHash(root);
const directory=path.join(root,'content/bedford-taylor/overview-diagrams');
await mkdir(directory,{recursive:true});

const colors={known:'#315e50',model:'#285e87',open:'#76518c',condition:'#79602f',obstruction:'#9a4b30'};
const backgrounds={known:'#eef4ec',model:'#edf3f8',open:'#f4eff8',condition:'#faf5e8',obstruction:'#fbefe8'};
const relationColors={implication:'#315e50',equivalence:'#315e50','proof-dependency':'#64757c',specialization:'#285e87','open-step':'#76518c',obstruction:'#9a4b30'};
const quote=value=>JSON.stringify(String(value));
const wrap=(text,width=34)=>{
  const lines=[];let line='';
  for(const word of String(text).split(/\s+/)){
    if(line&&line.length+word.length+1>width){lines.push(line);line=word;}else line+=(line?' ':'')+word;
  }
  if(line)lines.push(line);
  return lines.map(esc).join('<BR ALIGN="LEFT"/>');
};
const nodeLabel=node=>`<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="7"><TR><TD ALIGN="LEFT"><FONT POINT-SIZE="11" COLOR="${colors[node.status]}">${esc(nodeLabels[node.status].toUpperCase())}</FONT></TD></TR><TR><TD ALIGN="LEFT"><FONT POINT-SIZE="17"><B>${wrap(node.title)}</B></FONT></TD></TR>${node.topicIds?.length?`<TR><TD ALIGN="LEFT"><FONT POINT-SIZE="11" COLOR="#5e6b65">${esc(node.topicIds.join(' · '))}</FONT></TD></TR>`:''}</TABLE>`;
const manifest={schemaVersion:1,edition:logic.edition,generatorHash,diagrams:[]};

// Keep the principal view narrow without dropping inputs or reducing type.
// These ranks only position the real DAG: invisible links are layout constraints
// and produce no additional SVG edges. Short branches move close to their use.
const compactRanks=(vertices,edges)=>{
  const outgoing=new Map(vertices.map(id=>[id,[]]));
  const degree=new Map(vertices.map(id=>[id,0])),level=new Map(vertices.map(id=>[id,0]));
  for(const [from,to] of edges){outgoing.get(from).push(to);degree.set(to,degree.get(to)+1);}
  const queue=vertices.filter(id=>degree.get(id)===0),order=[];
  for(let index=0;index<queue.length;index++){
    const id=queue[index];order.push(id);
    for(const to of outgoing.get(id)){
      level.set(to,Math.max(level.get(to),level.get(id)+1));degree.set(to,degree.get(to)-1);
      if(degree.get(to)===0)queue.push(to);
    }
  }
  // A proposed research route can contain an open cycle. Keep Graphviz's normal
  // layout in that case; do not alter or omit the displayed relation.
  if(order.length!==vertices.length)return [];
  for(const id of [...order].reverse())if(outgoing.get(id).length)level.set(id,Math.min(...outgoing.get(id).map(to=>level.get(to)-1)));
  const ranks=[];
  for(const number of [...new Set(level.values())].sort((a,b)=>a-b)){
    const members=vertices.filter(id=>level.get(id)===number);
    for(let index=0;index<members.length;index+=4)ranks.push(members.slice(index,index+4));
  }
  return [
    '// Pure layout constraints; these invisible links assert no mathematical relation.',
    ...ranks.map(rank=>'{rank=same; '+rank.map(quote).join('; ')+';}'),
    ...ranks.slice(1).map((rank,index)=>`${quote(ranks[index][0])} -> ${quote(rank[0])} [style=invis,weight=1];`)
  ];
};

const preserveReadableScale=svg=>{
  const match=svg.match(/transform="scale\(([\d.]+) ([\d.]+)\)/);
  if(!match)return svg;
  const x=Number(match[1]),y=Number(match[2]);
  if(!(x>0&&y>0)||Math.abs(x-y)>0.0001)throw Error('Unexpected nonuniform overview scaling');
  if(x===1)return svg;
  const box=svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
  if(!box||box.length!==4||!box.every(Number.isFinite))throw Error('Overview cannot preserve its natural text scale');
  const normalized=box.map(number=>(number/x).toFixed(2));
  return svg.replace(match[0],'transform="scale(1 1)')
    .replace(/viewBox="[^"]+"/,`viewBox="${normalized.join(' ')}"`)
    .replace(/<svg width="[^"]+" height="[^"]+"/,`<svg width="${normalized[2]}pt" height="${normalized[3]}pt"`);
};

for(const view of overview.views){
  const prefix='overview-'+view.id,nodes=new Map(view.nodes.map(node=>[node.id,node])),principal=view.id==='principal';
  const layoutVertices=[],layoutEdges=[];
  const alternatives=new Map();
  for(const node of view.nodes){
    const incoming=view.relations.filter(relation=>relation.conclusion===node.id&&relation.kind==='implication');
    if(incoming.length>1)alternatives.set(node.id,new Set(incoming.map(relation=>relation.id)));
  }
  const conditional=relation=>relation.kind==='implication'&&relation.premises.some(id=>['condition','open'].includes(nodes.get(id).status));
  const labelFor=relation=>relation.kind==='obstruction'?'Blocks this shortcut':conditional(relation)?'Conditional deduction':relationLabels[relation.kind];
  const relationNode=(relation,index)=>{
    const color=relationColors[relation.kind],number=String(index+1).padStart(2,'0');
    const label=`<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="5"><TR><TD><FONT POINT-SIZE="12" COLOR="${color}"><B>${relation.premises.length>1?'AND · ':''}${esc(labelFor(relation))} ${number}</B></FONT></TD></TR><TR><TD><FONT POINT-SIZE="12" COLOR="#1f4e79">${relation.hypotheses.length?relation.hypotheses.length+' additional '+(relation.hypotheses.length===1?'hypothesis applies':'hypotheses apply'):'Scope and proof'}</FONT></TD></TR></TABLE>`;
    return `${quote('r-'+relation.id)} [id=${quote(prefix+'-r-'+relation.id)},label=<${label}>,color=${quote(color)},fillcolor="#fffef9",URL=${quote('#'+relation.anchor)},tooltip=${quote(relation.hypotheses.join(' ')+' '+relation.explanation)}];`;
  };
  const dot=[`digraph ${quote(prefix)} {`,
    `graph [id=${quote('svg-'+prefix)},rankdir=TB,bgcolor="transparent",fontname="Arial",pad="0.3",nodesep="${principal?'0.15':'0.4'}",ranksep="0.65",splines=polyline,compound=true,pack=true,packmode="array_u3"${principal?',ratio=compress,size="22,120"':''}];`,
    'node [fontname="Arial",fontsize=16,shape=box,style="rounded,filled",color="#aebeb1",fillcolor="#fffef9",margin="0.09,0.06"];',
    'edge [fontname="Arial",fontsize=12,color="#315e50",penwidth=1.7,arrowsize=0.8];'];
  for(const group of view.groups){
    const members=view.nodes.filter(node=>node.sectionId===group.id);
    // Bridge-only groups contain cross-branch proof records, not a new subject.
    // Keep those gates outside clusters instead of drawing an empty fourth box.
    if(!members.length)continue;
    if(!principal){
      dot.push(`subgraph ${quote('cluster-'+group.id)} {`);
      dot.push(`graph [id=${quote(prefix+'-cluster-'+group.id)},label=<${wrap(group.title,46)}>,labelloc=t,labeljust=l,fontsize=19,fontcolor="#31483b",style="rounded",color="#b9c9b5",margin=24];`);
    }
    for(const node of members){
      layoutVertices.push('n-'+node.id);
      dot.push(`${quote('n-'+node.id)} [id=${quote(prefix+'-n-'+node.id)},label=<${nodeLabel(node)}>,color=${quote(colors[node.status])},fillcolor=${quote(backgrounds[node.status])},URL=${quote('#logic-node-'+node.id)},tooltip=${quote(node.summary)}];`);
    }
    for(const [index,relation] of view.relations.entries())if(relation.sectionId===group.id){layoutVertices.push('r-'+relation.id);dot.push(relationNode(relation,index));}
    for(const node of members)if(alternatives.has(node.id)){
      layoutVertices.push('or-'+node.id);
      dot.push(`${quote('or-'+node.id)} [id=${quote(prefix+'-or-'+node.id)},label="OR\nAny one sufficient route",fontsize=12,shape=ellipse,fillcolor="#eef4ec",color="#315e50",tooltip="Each incoming deduction has its own full joint premises and hypotheses."];`);
    }
    if(!principal)dot.push('}');
  }
  for(const [index,relation] of view.relations.entries())if(!view.nodes.some(node=>node.sectionId===relation.sectionId)){layoutVertices.push('r-'+relation.id);dot.push(relationNode(relation,index));}
  for(const conclusion of alternatives.keys()){
    layoutEdges.push(['or-'+conclusion,'n-'+conclusion]);
    dot.push(`${quote('or-'+conclusion)} -> ${quote('n-'+conclusion)} [color="#315e50"];`);
  }
  for(const relation of view.relations){
    for(const premise of relation.premises){
      layoutEdges.push(['n-'+premise,'r-'+relation.id]);
      dot.push(`${quote('n-'+premise)} -> ${quote('r-'+relation.id)} [id=${quote(prefix+'-input-'+relation.id+'-'+premise)},color="#9aa99d",penwidth=1.2,arrowhead=none];`);
    }
    const destination=alternatives.get(relation.conclusion)?.has(relation.id)?'or-'+relation.conclusion:'n-'+relation.conclusion;
    layoutEdges.push(['r-'+relation.id,destination]);
    const style=['open-step','proof-dependency'].includes(relation.kind)?'dashed':'solid';
    const arrow=relation.kind==='obstruction'?'tee':'normal';
    dot.push(`${quote('r-'+relation.id)} -> ${quote(destination)} [id=${quote(prefix+'-output-'+relation.id)},style=${quote(style)},color=${quote(relationColors[relation.kind])},arrowhead=${quote(arrow)},${relation.kind==='equivalence'?'dir=both,arrowtail=normal,':''}];`);
  }
  if(principal)dot.push(...compactRanks(layoutVertices,layoutEdges));
  dot.push('}');
  const dotText=dot.join('\n')+'\n';
  let svg=execFileSync('dot',['-Tsvg'],{input:dotText,encoding:'utf8',maxBuffer:32*1024*1024});
  svg=svg.replace(/<\?xml[\s\S]*?\?>\s*/,'').replace(/<!DOCTYPE[\s\S]*?>\s*/,'');
  if(principal)svg=preserveReadableScale(svg);
  svg=svg.replace('<svg ',`<svg role="group" aria-label="${esc(view.title)}" `).replace(/\bid="([^"]+)"/g,(_all,id)=>`id="${prefix}--${id.replace(/&#45;/g,'-')}"`);
  for(const node of view.nodes){
    const marker=`<g id="${prefix}--${prefix}-n-${node.id}"`;
    if(!svg.includes(marker))throw Error('Overview node group is missing: '+node.id);
    svg=svg.replace(marker,marker+` data-overview-node="${esc(node.id)}"`);
  }
  for(const relation of view.relations){
    const marker=`<g id="${prefix}--${prefix}-r-${relation.id}"`;
    if(!svg.includes(marker))throw Error('Overview relation group is missing: '+relation.id);
    svg=svg.replace(marker,marker+` data-overview-edge="${esc(relation.id)}"`);
  }
  await writeFile(path.join(directory,view.id+'.dot'),dotText);
  await writeFile(path.join(directory,view.id+'.svg'),svg);
  const viewBox=svg.match(/viewBox="([^"]+)"/)?.[1];
  if(!viewBox||!viewBox.split(/\s+/).every(value=>Number.isFinite(Number(value))))throw Error('Invalid overview diagram viewport: '+view.id);
  manifest.diagrams.push({id:view.id,file:view.id+'.svg',inputHash:overviewViewHash(view,logic.edition,generatorHash),sha256:hash(svg),viewBox});
}
await writeFile(path.join(directory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Generated ${manifest.diagrams.length} source-bound overall logical diagrams.`);
