// Compare with the real pre-change commit in CI. Published snapshots are
// append-only; ordinary corrections create a new edition, not rewritten bytes.
import {execFileSync} from 'node:child_process';

const base=process.env.HISTORY_BASE_SHA;
if(!base||/^0+$/.test(base)){
  if(process.env.CI)throw Error('CI requires the actual pre-change commit for the published-history check.');
  console.log('No prior commit supplied for history comparison.');
  process.exit(0);
}
if(!/^[a-f0-9]{40}$/.test(base))throw Error('Invalid history base SHA');
const output=execFileSync('git',['diff','--name-status','--no-renames',base,'HEAD'],{encoding:'utf8'});
const protectedPath=name=>/^content\/history\//.test(name)||
  /^content\/[^/]+\/(?:releases|source-receipts)\//.test(name)||
  /^public\/projects\/[^/]+\/editions\//.test(name)||
  /^public\/agents\/releases\/[^/]+\//.test(name);
const rewrites=output.trim().split('\n').filter(Boolean).filter(line=>{
  const [status,...names]=line.split('\t');
  return status!=='A'&&names.some(protectedPath);
});
if(rewrites.length)throw Error('Published history is append-only. Add a new edition. A privacy-removal exception requires a separate authorised procedure:\n'+rewrites.join('\n'));
console.log('History check: no existing project snapshot, frozen edition or agent release was modified or removed.');
