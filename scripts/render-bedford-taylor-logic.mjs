// Regenerate the checked-in, clickable SVG diagrams after editing logical data.
// The ordinary website build verifies these exact inputs and needs no Graphviz.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {loadBedfordTaylorLogic,diagramGeneratorHash,panelData,panelHash,graphId,relationAnchor,relationLabels,nodeLabels,esc,hash} from '../lib/bedford-taylor-logic.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pointer=JSON.parse(await readFile(path.join(root,'content/bedford-taylor/current.json'),'utf8'));
const logic=await loadBedfordTaylorLogic(root,pointer.revision);
const generatorHash=await diagramGeneratorHash(root);
const output=path.join(root,'content/bedford-taylor/logic-diagrams');
await mkdir(output,{recursive:true});
const colors={known:'#315e50',model:'#285e87',open:'#76518c',condition:'#79602f',obstruction:'#9a4b30'};
const backgrounds={known:'#eef4ec',model:'#edf3f8',open:'#f4eff8',condition:'#faf5e8',obstruction:'#fbefe8'};
const kindColors={implication:'#315e50',equivalence:'#315e50','proof-dependency':'#64757c',specialization:'#285e87','open-step':'#76518c',obstruction:'#9a4b30'};
const current=url=>url.replace('/editions/'+pointer.revision,'');
const quote=value=>JSON.stringify(String(value));
const wrap=(value,width=36)=>{
  const words=String(value).split(/\s+/),lines=[];let line='';
  for(const word of words){if(line&&line.length+word.length+1>width){lines.push(line);line=word;}else line+=(line?' ':'')+word;}
  if(line)lines.push(line);
  return lines.map(esc).join('<BR ALIGN="LEFT"/>');
};
const nodeLabel=node=>`<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="7"><TR><TD ALIGN="LEFT"><FONT POINT-SIZE="11" COLOR="${colors[node.status]}">${esc(nodeLabels[node.status].toUpperCase())}</FONT></TD></TR><TR><TD ALIGN="LEFT"><FONT POINT-SIZE="17"><B>${wrap(node.title,32)}</B></FONT></TD></TR>${node.topicIds?.length?`<TR><TD ALIGN="LEFT"><FONT POINT-SIZE="11" COLOR="#5e6b65">${esc(node.topicIds.join(' · '))}</FONT></TD></TR>`:''}</TABLE>`;
const manifest={schemaVersion:1,edition:pointer.revision,generatorHash,diagrams:[]};
for(const section of logic.sections)for(const panel of section.panels){
  const id=graphId(section,panel),data=panelData(section,panel),nodes=new Map(data.nodes.map(n=>[n.id,n]));
  const alternatives=new Map();
  for(const node of data.nodes){
    const incoming=data.relations.filter(r=>r.conclusion===node.id&&r.kind==='implication');
    if(incoming.length>1)alternatives.set(node.id,incoming.map(r=>r.id));
  }
  const dot=[`digraph ${quote(id)} {`,
    `graph [id=${quote('svg-'+id)},rankdir=TB,bgcolor="transparent",fontname="Arial",pad="0.2",nodesep="0.35",ranksep="0.55",splines=polyline,pack=true,packmode="array_u1"];`,
    'node [fontname="Arial",fontsize=16,shape=box,style="rounded,filled",color="#aebeb1",fillcolor="#fffef9",margin="0.09,0.06"];',
    'edge [fontname="Arial",fontsize=12,color="#315e50",penwidth=1.7,arrowsize=0.8];'];
  for(const node of data.nodes){
    dot.push(`${quote('n-'+node.id)} [id=${quote(id+'-n-'+node.id)},label=<${nodeLabel(node)}>,color=${quote(colors[node.status])},fillcolor=${quote(backgrounds[node.status])},URL=${quote(current(node.links[0].url))},tooltip=${quote(node.summary)}];`);
  }
  for(const [conclusion] of alternatives){
    dot.push(`${quote('or-'+conclusion)} [id=${quote(id+'-or-'+conclusion)},label="OR\nAny one sufficient route",fontsize=12,shape=ellipse,fillcolor="#eef4ec",color="#315e50",tooltip="These incoming deductions are alternatives, with their own stated hypotheses."];`);
    dot.push(`${quote('or-'+conclusion)} -> ${quote('n-'+conclusion)} [color="#315e50"];`);
  }
  for(const [index,relation] of data.relations.entries()){
    const color=kindColors[relation.kind];
    const conditional=relation.premises.some(n=>['open','condition'].includes(nodes.get(n).status));
    const label=relation.kind==='obstruction'?'Blocks this shortcut':relation.kind==='implication'&&conditional?'Conditional deduction':relationLabels[relation.kind];
    const number=String(index+1).padStart(2,'0');
    const gate=`<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="5"><TR><TD><FONT POINT-SIZE="12" COLOR="${color}"><B>${relation.premises.length>1?'AND · ':''}${esc(label)} ${number}</B></FONT></TD></TR><TR><TD><FONT POINT-SIZE="12" COLOR="#1f4e79">${relation.hypotheses.length?'With '+relation.hypotheses.length+' stated '+(relation.hypotheses.length===1?'hypothesis':'hypotheses'):'See precise scope'}</FONT></TD></TR></TABLE>`;
    dot.push(`${quote('r-'+relation.id)} [id=${quote(id+'-r-'+relation.id)},label=<${gate}>,color=${quote(color)},fillcolor="#fffef9",URL=${quote('#'+relationAnchor(section,relation))},tooltip=${quote(relation.hypotheses.join(' ')+' '+relation.explanation)}];`);
    for(const premise of relation.premises){
      dot.push(`${quote('n-'+premise)} -> ${quote('r-'+relation.id)} [id=${quote(id+'-input-'+relation.id+'-'+premise)},color="#9aa99d",penwidth=1.2,arrowhead=none];`);
    }
    const style=['open-step','proof-dependency'].includes(relation.kind)?'dashed':'solid';
    const arrow=relation.kind==='obstruction'?'tee':'normal';
    const destination=alternatives.get(relation.conclusion)?.includes(relation.id)?'or-'+relation.conclusion:'n-'+relation.conclusion;
    dot.push(`${quote('r-'+relation.id)} -> ${quote(destination)} [id=${quote(id+'-output-'+relation.id)},style=${quote(style)},color=${quote(color)},arrowhead=${quote(arrow)},${relation.kind==='equivalence'?'dir=both,arrowtail=normal,':''}];`);
  }
  dot.push('}');
  const dotText=dot.join('\n')+'\n';
  let svg=execFileSync('dot',['-Tsvg'],{input:dotText,encoding:'utf8',maxBuffer:16*1024*1024});
  svg=svg.replace(/<\?xml[\s\S]*?\?>\s*/,'').replace(/<!DOCTYPE[\s\S]*?>\s*/,'');
  // Use global page anchors for explanation links, and keep SVG IDs unique when
  // several diagrams are embedded in the same document.
  svg=svg.replace('<svg ',`<svg role="group" aria-label="${esc(panel.title)}" `);
  svg=svg.replace(/\bid="([^"]+)"/g,(_all,local)=>`id="${id}--${local}"`);
  await writeFile(path.join(output,id+'.dot'),dotText);
  await writeFile(path.join(output,id+'.svg'),svg);
  const viewBox=svg.match(/viewBox="([^"]+)"/)?.[1];
  manifest.diagrams.push({id,file:id+'.svg',inputHash:panelHash(section,panel,logic.edition,generatorHash),sha256:hash(svg),viewBox});
}
await writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Generated ${manifest.diagrams.length} source-bound logical diagrams.`);
