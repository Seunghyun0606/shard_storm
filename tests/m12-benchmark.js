import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,mkdtempSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {Game} from '../game.js';
import {CONFIG as C} from '../config.js';
import {BUILD_PRESETS,EVOLUTION_FAMILIES} from '../expansion-defs.js';
import {CODEX_IDS} from '../codex.js';
import {ELITES} from '../advanced-defs.js';
import {chooseTarget} from './simulation.js';
import {eliteChoice,directorRecord} from '../spawn-director.js';

const baseline=mkdtempSync(join(tmpdir(),'shard-m12-control-')),zip=join(baseline,'source.zip');
execFileSync('git',['archive','--format=zip','--output='+zip,'633f8a4','*.js','package.json']);
execFileSync('python',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',zip,baseline]);
const {Game:OldGame}=await import(pathToFileURL(join(baseline,'game.js')));
const oldSkills=['crushPower','crushSpeed','impactPulse','shardPower','shardRange','shardBloom','ricochetPlus','chainAmplifier','echoCatalyst','extraTime','photonBoost','precisionFracture','yieldStabilizer','rareSeparator','fragmentRelay','kineticReach','resonanceLayer','salvageScanner','catalystChannel'];
const history=Object.fromEntries(Object.keys(ELITES).map(id=>[id,{spawned:1}]));
const owned=Object.fromEntries(Object.entries(EVOLUTION_FAMILIES).map(([id,d])=>[id,Object.keys(d.forms)]));
export function battle(Type,args){
 const g=new Type({...args,sandbox:true});let next=.2;const ticks=[];g.attack(480,335);
 while(g.state==='PLAYING'){
  if(g.elapsed>=next-1e-9){const target=chooseTarget(g);if(target)g.attack(target.x,target.y);next+=g.stats.attackInterval;}
  const start=performance.now();g.update(C.step);ticks.push(performance.now()-start);
 }
 const r=g.record();ticks.sort((a,b)=>a-b);
 assert.equal(r.physicsChecks.lateWaveContacts,0);assert.ok(r.physicsChecks.maxProjectileContactError<.002&&r.physicsChecks.maxWaveContactError<.002);
 assert.ok(r.peakShards<=150&&r.peakWaves<=64&&r.peakScheduled<=1024);assert.equal(r.runDurationActual,args.duration);
 return {r,ticks:{p95:ticks[Math.floor(ticks.length*.95)],p99:ticks[Math.floor(ticks.length*.99)]}};
}
function argsFor(seed,build,rank,duration,anomalyId=null){const max=rank===4,preset=BUILD_PRESETS[build],levels=Object.fromEntries(Object.entries(C.upgrades).map(([id,u])=>[id,max?u.max:0]));
 return {seed,levels,discoveryRank:rank,duration,anomalyId,ecologyEnabled:true,advancedEnabled:true,skillExpansionEnabled:true,signatureLoadout:max?preset.signatures:[],evolutionOwned:max?owned:{},evolutionActive:max?preset.evolutions:[],insightUnlocked:max?CODEX_IDS:[],eliteHistory:history};}
const fingerprint=r=>({kills:r.totalDestroyed,raw:r.rawEarned,photon:r.processedPhoton,catalyst:r.pendingCatalyst,stats:r.typeStats,skills:r.expansionExecuted,meta:r.metaCounters,codex:r.codexDelta,elite:r.eliteDelta,
 targets:r.causalLog.map(e=>[e.eventType,e.sourceType,e.sourceShapeId??e.sourceId,e.targetShapeId??e.targetId,e.chainId])});
const rows=[],supplies=[],eliteRates=[],eliteCombats=[];let identical=0,corrected=0;
const cappedPaths=[];
for(const seed of [2,3,4,5,6])for(const duration of [20,32]){
 const a=argsFor(seed,'Crusher',4,duration);a.signatureLoadout=[];a.evolutionActive=[];
 const old=battle(OldGame,a),fixed=battle(Game,a);assert.equal(fixed.r.physicsDebt.discardedPhysicalSeconds,0);
 if(!old.r.capCounts.tickIterations)assert.deepEqual(fingerprint(old.r),fingerprint(fixed.r));
 cappedPaths.push({seed,duration,oldCaps:old.r.capCounts,oldKills:old.r.totalDestroyed,newKills:fixed.r.totalDestroyed,oldRaw:old.r.rawEarned,newRaw:fixed.r.rawEarned,debt:fixed.r.physicsDebt});
}
assert.ok(cappedPaths.some(r=>r.oldCaps.tickIterations>0));
for(const seed of [31415,1,7,42,99])for(const build of ['Crusher','Cascade','Reactor'])for(const rank of [0,4])for(const duration of [20,32])for(const anomalyId of [null,'unstableCore']){
 const args=argsFor(seed,build,rank,duration,anomalyId),old=battle(OldGame,args),off=battle(Game,{...args,schedulerCorrectness:false}),fixed=battle(Game,args);
 assert.deepEqual(fingerprint(off.r),fingerprint(old.r),'M11 OFF mismatch');assert.equal(fixed.r.physicsDebt.discardedPhysicalSeconds,0);
 let same=true;try{assert.deepEqual(fingerprint(fixed.r),fingerprint(old.r));}catch{same=false;}
 if(same)identical++;else{assert.ok(old.r.capCounts.tickIterations>0,'Non-cap replay changed');corrected++;}
 rows.push({seed,build,rank,duration,anomalyId,same,old:{kills:old.r.totalDestroyed,raw:old.r.rawEarned,caps:old.r.capCounts},fixed:{kills:fixed.r.totalDestroyed,raw:fixed.r.rawEarned,caps:fixed.r.capCounts,debt:fixed.r.physicsDebt,ticks:fixed.ticks}});
}
console.log(`Scheduler: ${rows.length} paired conditions (${rows.length*3} Runs), ${identical} exact / ${corrected} corrected cap paths`);
for(const seed of [31415,1,7,42,99])for(const build of ['Crusher','Cascade','Reactor'])for(const elitePolicy of ['M11_attempt','M12_run03','M12_run15','M12_run20','M12_run25','M12_run20_pity6']){
 const {r}=battle(Game,{...argsFor(seed,build,4,20),elitePolicy});eliteCombats.push({seed,build,elitePolicy,kills:r.totalDestroyed,raw:r.rawEarned,photon:r.processedPhoton,elite:r.director.elite,spawned:Object.values(r.eliteDelta).some(e=>e.spawned>0),placementFailures:r.advancedCounts.elitePlacementFailed||0});
}
for(const seed of [31415,1,7,42,99])for(const build of ['Crusher','Cascade','Reactor'])for(const duration of [20,32])for(const supplyProfile of ['M11_fixed','M12_elastic15','M12_elastic18','M12_elastic21','M12_elastic24','M12_elastic30']){
 const a=argsFor(seed,build,4,duration),{r,ticks}=battle(Game,{...a,supplyProfile,elitePolicy:'M12_run20_pity6'});
 supplies.push({seed,build,duration,supplyProfile,kills:r.totalDestroyed,raw:r.rawEarned,photon:r.processedPhoton,chain:r.bestChain,empty:r.emptyArenaDuration,failures:r.spawnFailures,attempts:r.spawnAttempts,successes:r.spawnSuccesses,missedClicks:r.missedClicks,samples:r.director.samples,transitions:r.director.transitions,ticks,caps:r.capCounts});
}
// 10,000 eligible Run decisions per candidate, 100 repeated calls/Run. This is
// an eligibility lottery experiment, not 60,000 full combat Runs.
for(const policy of ['M12_run03','M12_run15','M12_run20','M12_run25','M12_run20_pity6']){
 let pity=0,accepted=0,maxGap=0,gap=0;
 for(let i=0;i<10000;i++){const g=new Game({seed:i+1,sandbox:true,elitePolicy:policy,elitePity:pity});for(let k=0;k<100;k++)eliteChoice(g,['bombReactor'],null,null);const e=g.director.elite;if(e.accepted){accepted++;e.naturalSpawned=true;gap=0;}else maxGap=Math.max(maxGap,++gap);pity=directorRecord(g).elite.pityNext;}
 eliteRates.push({policy,eligibleRunDecisions:10000,accepted,fraction:accepted/10000,maxGap});
}
const sources=readdirSync('.').filter(p=>p.endsWith('.js')).concat(['tests/m12-benchmark.js','tests/m12.test.js']).sort(),hash=createHash('sha256');for(const p of sources)hash.update(p+'\0'+readFileSync(p,'utf8').replaceAll('\r\n','\n')+'\0');
const result={passed:true,baseline:'633f8a4efab15b324f40c3284a79509c561c7222',signature:hash.digest('hex'),sources,node:process.version,actualCombatRuns:rows.length*3+supplies.length+cappedPaths.length*2+eliteCombats.length,scheduler:{conditions:rows.length,identical,corrected,rows,cappedPaths},supplies,eliteRates,eliteCombats,productionSelection:'User approved A: live Run20% + pity6, schema9. Fixed15 supply retained; other policies sandbox only.',humanFun:'Not evaluated by automated input.'};
writeFileSync('artifacts/m12-benchmark-results.json',JSON.stringify(result,null,2));console.log(`M12 benchmark PASS: ${result.actualCombatRuns} actual combat Runs; lottery trials separate.`);
