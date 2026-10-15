import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {chooseTarget} from './simulation.js';

// Run alone after all growth/regression workers finish. This measures update
// CPU, not browser rendering/FPS. The M9 baseline is the actual integration.
const targetRoot=process.env.M10_SOURCE_ROOT||resolve('.');
const baseline='17dcc954',directory=mkdtempSync(join(tmpdir(),'shard-m10-performance-'));
try {
 execFileSync('git',['archive','--format=zip',`--output=${join(directory,'source.zip')}`,baseline,'*.js','package.json']);
 execFileSync('python',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',join(directory,'source.zip'),directory]);
 const versions=[];
 for(const root of [directory,targetRoot]) {
  const {Game}=await import(pathToFileURL(join(root,'game.js'))),{CONFIG:C}=await import(pathToFileURL(join(root,'config.js')));
  versions.push({Game,C});
 }
 const records=[];
 for(const seed of [31415,1,7,42,99])for(const rank of [0,4])for(let repetition=0;repetition<3;repetition++)for(const mode of ['M9','M10_OFF','M10_ON']) {
  const {Game,C}=versions[mode==='M9'?0:1],levels=Object.fromEntries(Object.entries(mode==='M10_ON'?C.upgrades:versions[0].C.upgrades).map(([id,u])=>[id,rank?u.max:0]));
  const g=new Game({seed,levels,discoveryRank:rank,duration:20,sandbox:true,ecologyEnabled:true,skillExpansionEnabled:mode==='M10_ON',advancedEnabled:false});
  const ticks=[];let next=.2;g.attack(480,335);
  while(g.state==='PLAYING') {
   if(g.elapsed>=next-1e-9){const target=chooseTarget(g);if(target)g.attack(target.x,target.y);next+=g.stats.attackInterval;}
   const start=performance.now();g.update(C.step);ticks.push(performance.now()-start);
  }
  ticks.sort((a,b)=>a-b);
  records.push({mode,seed,rank,repetition,kills:g.totalDestroyed,raw:g.runEarned,photon:g.refinery.payout,tickP95ms:ticks[Math.floor(ticks.length*.95)],caps:g.capCounts,projectileError:g.physicsChecks.maxProjectileContactError,waveError:g.physicsChecks.maxWaveContactError});
 }
 for(const a of records.filter(r=>r.mode==='M9')) {
  const b=records.find(r=>r.mode==='M10_OFF'&&r.seed===a.seed&&r.rank===a.rank&&r.repetition===a.repetition);
  assert.deepEqual([b.kills,b.raw,b.photon],[a.kills,a.raw,a.photon]);
 }
 for(const r of records)assert.ok(r.projectileError<.002&&r.waveError<.002);
 writeFileSync('artifacts/m10-performance.json',JSON.stringify({passed:true,isolated:process.env.PERFORMANCE_ISOLATED==='1',baseline,targetRoot,node:process.version,workload:'90 actual20s Runs;5seeds xRank0/4 x3repetitions xM9/M10_OFF/M10_ON. Rank0 zero levels; Rank4 baseline/OFF19 MAX, ON49 MAX. No active Signature/Evolution/Relic, no Contracts. Exact OFF economy parity; ON changes available passive skills, so its combat results need not match. M10 production source from M10_SOURCE_ROOT if set. update CPU only, not browser FPS.',records},null,2));
 console.log('M10 performance workload and exact M9-OFF parity PASS:90 actual Runs');
} finally {
 assert.equal(dirname(resolve(directory)),resolve(tmpdir()));assert.ok(basename(directory).startsWith('shard-m10-performance-'));
 rmSync(directory,{recursive:true,force:true});
}
