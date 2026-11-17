// In CI, compare against the actual pre-change commit. A new edition may be
// added; an already-published source or static snapshot must not be rewritten.
import {execFileSync} from 'node:child_process';
const base=process.env.HISTORY_BASE_SHA;
if(!base){
  if(process.env.GITHUB_ACTIONS==='true')throw Error('A deployment requires the actual pre-change commit for the history check.');
  console.log('No prior commit supplied for local history comparison.');process.exit(0);
}
if(/^0+$/.test(base)){console.log('Initial branch publication: no prior branch history to compare.');process.exit(0);}
if(!/^[a-f0-9]{40}$/.test(base))throw Error('Invalid history base SHA');
const output=execFileSync('git',['diff','--name-status','--no-renames',base,'HEAD','--','content/history','content/strong-green/releases','public/projects/strong-green/editions'],{encoding:'utf8'});
const rewrites=output.trim().split('\n').filter(Boolean).filter(line=>!line.startsWith('A\t'));
if(rewrites.length)throw Error('Published history is append-only. Use a new edition; a privacy-removal exception requires a separate authorised procedure:\n'+rewrites.join('\n'));
console.log('History check: no published snapshot was modified or removed.');
