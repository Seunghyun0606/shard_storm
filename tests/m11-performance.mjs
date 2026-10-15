import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {chooseTarget} from './simulation.js';
import {BUILD_PRESETS,EVOLUTION_FAMILIES} from '../expansion-defs.js';
import {CODEX_IDS} from '../codex.js';

// Run alone after all growth/regression workers finish. This measures update
// CPU, not browser rendering/FPS. The M10 baseline is the actual integration.
const baseline='2f75e4f',directory=mkdtempSync(join(tmpdir(),'shard-m11-performance-'));
try {
 execFileSync('git',['archive','--format=zip',`--output=${join(directory,'source.zip')}`,baseline,'*.js','package.json']);
 execFileSync('python',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',join(directory,'source.zip'),directory]);
 const versions=[];
 for(const root of [directory,resolve('.')]) {
  const {Game}=await import(pathToFileURL(join(root,'game.js'))),{CONFIG:C}=await import(pathToFileURL(join(root,'config.js')));
  versions.push({Game,C});
 }
 const records=[];
 for(const seed of [31415,1,7,42,99])for(const rank of [0,4])for(const strategy of ['Crusher','Cascade','Reactor'])for(const mode of ['M10','M11_OFF','M11_ON']) {
  const {Game,C}=versions[mode==='M10'?0:1],levels=Object.fromEntries(Object.entries(versions[0].C.upgrades).map(([id,u])=>[id,rank?u.max:0]));
  const preset=BUILD_PRESETS[strategy],owned=Object.fromEntries(Object.entries(EVOLUTION_FAMILIES).map(([id,d])=>[id,Object.keys(d.forms)]));
  const g=new Game({seed,levels,discoveryRank:rank,duration:20,sandbox:true,ecologyEnabled:true,skillExpansionEnabled:true,advancedEnabled:mode==='M11_ON',
   signatureLoadout:rank?preset.signatures:[],evolutionOwned:rank?owned:{},evolutionActive:rank?preset.evolutions:[],insightUnlocked:rank?CODEX_IDS:[],
   relicLoadout:rank?(strategy==='Reactor'?['reactorGovernor','ancientResonator']:['ricochetCoil','waveCondenser']):[]});
  const ticks=[];let next=.2;g.attack(480,335);
  while(g.state==='PLAYING') {
   if(g.elapsed>=next-1e-9){const target=chooseTarget(g);if(target)g.attack(target.x,target.y);next+=g.stats.attackInterval;}
   const start=performance.now();g.update(C.step);ticks.push(performance.now()-start);
  }
  ticks.sort((a,b)=>a-b);
  records.push({mode,seed,rank,strategy,kills:g.totalDestroyed,raw:g.runEarned,photon:g.metaResult?.totalPhoton??g.refinery.payout,calibrationPhoton:g.calibrationPhoton||0,catalyst:g.metaResult?.totalCatalyst??g.pendingCatalyst,tickP95ms:ticks[Math.floor(ticks.length*.95)],caps:g.capCounts,projectileError:g.physicsChecks.maxProjectileContactError,waveError:g.physicsChecks.maxWaveContactError});
 }
 for(const a of records.filter(r=>r.mode==='M10')) {
  const b=records.find(r=>r.mode==='M11_OFF'&&r.seed===a.seed&&r.rank===a.rank&&r.strategy===a.strategy);
  assert.deepEqual([b.kills,b.raw,b.photon,b.calibrationPhoton,b.catalyst],[a.kills,a.raw,a.photon,a.calibrationPhoton,a.catalyst]);
 }
 for(const r of records)assert.ok(r.projectileError<.002&&r.waveError<.002);
 writeFileSync('artifacts/m11-performance.json',JSON.stringify({passed:true,isolated:process.env.PERFORMANCE_ISOLATED==='1',baseline,node:process.version,workload:'90 actual20s Runs;5seeds xRank0/4 x3builds xM10/M11_OFF/M11_ON. Rank0 zero levels/loadouts; Rank4 MAX49+Signature3+Evolution2+Relic2+19 insight fixture, no Contracts. Exact OFF economy parity; ON uses new shape/Elite eligibility with fixture insights. update CPU only, not browser FPS.',records},null,2));
 console.log('M11 performance workload and exact M10-OFF parity PASS:90 actual Runs');
} finally {
 assert.equal(dirname(resolve(directory)),resolve(tmpdir()));assert.ok(basename(directory).startsWith('shard-m11-performance-'));
 rmSync(directory,{recursive:true,force:true});
}
