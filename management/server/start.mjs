import {readFile} from 'node:fs/promises';
import {readConfig,managementRoot} from './config.mjs';
import {GitHubRepository} from './github.mjs';
import {createApplication} from './app.mjs';
import path from 'node:path';

const config=readConfig();
if(config.demo)throw Error('Start disposable demo mode with npm run management:demo.');
const seedProjects=JSON.parse(await readFile(path.join(managementRoot,'seed-projects.json'),'utf8'));
const repository=new GitHubRepository({repository:config.repository,branch:config.branch,token:config.publicationToken});
const app=createApplication({config,repository,seedProjects});
app.server.listen(config.port,config.host,()=>{
  console.log(`OpenMath management listening at ${config.origin}`);
  console.log(`GitHub login: ${config.clientId&&config.clientSecret?'configured':'not configured'}; public PR publication: ${config.publicationToken?'configured':'not configured'}.`);
});
let closing=false;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{
  if(closing)return;closing=true;await app.close();process.exit(0);
});
