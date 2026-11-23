import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {readConfig} from '../server/config.mjs';
import {createApplication} from '../server/app.mjs';
import {DemoRepository,demoProjects} from '../server/demo.mjs';

const dir=mkdtempSync(path.join(tmpdir(),'openmath-demo-'));
const port=process.env.PORT||'8787';
const config=readConfig({OPENMATH_DEMO:'true',APP_ORIGIN:`http://127.0.0.1:${port}`,HOST:'127.0.0.1',PORT:port,OPENMATH_DB:path.join(dir,'demo.sqlite')});
const app=createApplication({config,repository:new DemoRepository(),seedProjects:demoProjects});
app.store.account({id:'1002',login:'demo-editor',name:'Demonstration editor'});
app.store.account({id:'1003',login:'demo-reviewer',name:'Demonstration reviewer'});
app.server.listen(config.port,config.host,()=>console.log(`Disposable OpenMath demo: ${config.origin}\nUse Sign in with GitHub to enter the local demonstration. No external authentication or publication occurs.`));
let closing=false;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;await app.close();rmSync(dir,{recursive:true,force:true});process.exit(0);});
