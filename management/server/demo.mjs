import {createHash} from 'node:crypto';
import {initialProjectFiles,isEditablePath,isReadablePath,RepositoryError} from './github.mjs';

const blob=content=>createHash('sha1').update(`blob ${Buffer.byteLength(content)}\0`).update(content).digest('hex');
export const demoProjects=[{id:'demo-research',title:'A collaborative research project',category:'research',
  summary:'A disposable workspace for trying source editing, reviews and project access. This is demonstration data, not a published mathematical project.',
  createdAt:'2026-11-23T00:00:00.000Z'}];
export class DemoRepository {
  constructor(){
    this.ref='d'.repeat(40);this.files=new Map();
    for(const p of demoProjects)for(const f of initialProjectFiles(p))this.files.set(f.path,f.content);
  }
  async head(){return this.ref;}
  async listSources(project){
    const result=[...this.files].filter(([p])=>isReadablePath(project.id,p)).map(([path,content])=>({path,sha:blob(content),size:Buffer.byteLength(content),editable:isEditablePath(project.id,path)}));
    if(!this.files.has(`content/projects/${project.id}.json`))for(const f of initialProjectFiles(project))result.push({path:f.path,sha:null,size:Buffer.byteLength(f.content),editable:true});
    return {ref:this.ref,files:result};
  }
  async readSource(project,path,ref){
    if(ref!==this.ref||!isReadablePath(project.id,path))throw new RepositoryError('Source not available.',404);
    const content=this.files.get(path)??initialProjectFiles(project).find(f=>f.path===path)?.content;
    if(content===undefined)throw new RepositoryError('Source not found.',404);
    return {path,content,sha:this.files.has(path)?blob(content):null,ref,editable:isEditablePath(project.id,path)};
  }
  async validateChanges(project,ref,changes){
    if(ref!==this.ref)throw new RepositoryError('Source baseline changed.',409);
    for(const c of changes){
      if(!isEditablePath(project.id,c.path))throw new RepositoryError('File is outside editable project scope.',403);
      if((this.files.has(c.path)?blob(this.files.get(c.path)):null)!==c.baseSha)throw new RepositoryError('Source baseline changed.',409);
    }
    return changes.map(({path,content,baseSha})=>({path,content,baseSha}));
  }
  async publish(){throw new RepositoryError('Demo cannot write to GitHub.',503);}
}
