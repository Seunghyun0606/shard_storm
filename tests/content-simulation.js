import assert from 'node:assert/strict';
import {performance}from'node:perf_hooks';import {Game}from'../game.js';import {chooseTarget}from'./simulation.js';
import {CONFIG as C}from'../config.js';import {freshSave}from'../storage.js';
import {settle,buyUpgrade}from'../progression.js';import {skillState}from'../skill-tree.js';
import {craftRelic,equipRelic}from'../relics.js';import {acceptContract,snapshotContracts}from'../contracts.js';
import {ensureOffer,selectAnomaly,consumeOffer}from'../anomalies.js';
export function contentBattle(args){
 const g=new Game({...args,inputPolicy:'auto:density-hp-v1',sandbox:true});let next=C.attackInterval;g.attack(C.tutorial.x,C.tutorial.y);
 while(g.state==='PLAYING'){
  if(g.elapsed>=next-1e-9){const target=chooseTarget(g);if(target)g.attack(target.x,target.y);next+=g.stats.attackInterval;}
  const start=performance.now();g.update(C.step);g.observeFrame(0,performance.now()-start);
 }
 assert.equal(g.directKills+g.cascadeKills,g.totalDestroyed);assert.ok(g.peakShards<=C.caps.shards&&g.peakWaves<=C.caps.waves&&g.peakScheduled<=C.caps.scheduled);
 assert.ok(g.physicsChecks.maxProjectileContactError<.002&&g.physicsChecks.maxWaveContactError<.002);assert.equal(g.physicsChecks.lateWaveContacts,0);return g;
}
const priorities={Crusher:['crushPower','crushSpeed','impactPulse','precisionFracture'],Cascade:['shardPower','shardRange','shardBloom','ricochetPlus','fragmentRelay'],Reactor:['chainAmplifier','echoCatalyst','yieldStabilizer','resonanceLayer']};
export function contentGrowth(spec,checkpoint=null,onCheckpoint=()=>{}){
 const s=checkpoint?.save||freshSave();s.sandbox=true;const rows=checkpoint?.rows||[];
 if(!checkpoint){s.anomalySeed=`content-${spec.seed}`;if(spec.profile==='LegacyMax'){s.bank=10000;s.catalystBalance=200;s.lifetimeDestroyed=8000;s.discoveryRank=4;for(const[k,u]of Object.entries(C.upgrades))s.levels[k]=u.max;}}
 const allowed=Object.keys(C.upgrades),priority=[...priorities[spec.strategy],...allowed];
 for(let run=rows.length+1;run<=spec.count;run++){
  for(const id of Object.keys(C.relics))craftRelic(s,id,'RESULT');s.relicEquipped=[];
  const owned=[...s.relicOwned];if(spec.strategy==='Reactor')owned.sort((a,b)=>Number(b==='reactorGovernor')-Number(a==='reactorGovernor'));
  for(const[slot,id]of owned.slice(0,2).entries())equipRelic(s,id,slot,'RESULT');
  for(const id of Object.keys(C.contracts))acceptContract(s,id,'RESULT');
  const offers=ensureOffer(s).offeredIds,anomalyId=spec.mode==='Anomaly'?(offers.find(id=>id==='unstableCore'||id==='fastOrbit')||offers[0]||null):null;
  selectAnomaly(s,anomalyId,'RESULT');consumeOffer(s);
  const g=contentBattle({seed:spec.seed+run*7919,runId:`${spec.key}-${run}`,levels:s.levels,discoveryRank:s.discoveryRank,duration:spec.time==='Fixed20'?20:undefined,
   ecologyEnabled:spec.feature!=='M8',introSeen:s.shapeIntroSeen,welcomeFlags:s.milestoneWelcomeFlags,relicLoadout:s.relicEquipped,activeContracts:snapshotContracts(s),anomalyId,
   experiment:spec.mode==='Adaptive'?'m9_adaptive':'baseline'});
  assert.ok(g.alive.length<=32);assert.equal(settle(s,g),true);assert.equal(settle(s,g),false);
  for(let i=0;i<100;i++){const key=priority.find(k=>skillState(k,s.levels,s.bank,s).canBuy);if(!key||!buyUpgrade(s,key,'RESULT'))break;}
  const r=g.record();rows.push({run,seed:g.seed,rank:s.discoveryRank,kills:g.totalDestroyed,direct:g.directKills,cascade:g.cascadeKills,raw:g.runEarned,photon:r.processedPhoton,catalystEarned:r.metaResult.totalCatalyst,bank:s.bank,catalyst:s.catalystBalance,
   levels:Object.values(s.levels).reduce((a,b)=>a+b,0),duration:g.duration,chain:g.bestChain,contractPhoton:r.metaResult.contracts.photon,anomalyPhoton:r.metaResult.anomaly.photon,
   introduced:Object.keys(s.shapeIntroSeen),shapeStats:r.typeStats,ecologyCounts:r.ecologyCounts,echoSpawned:r.echoSpawned,echoKills:r.echoKills,echoRaw:r.echoRaw,
   blank:r.emptyArenaDuration,spawnFailures:r.spawnFailures,tickP95ms:r.fixedStepP95ms,peaks:{shards:r.peakShards,waves:r.peakWaves,scheduled:r.peakScheduled},caps:r.capCounts,physics:r.physicsChecks,patterns:r.patternCounts});
  assert.equal(s.totalRuns,run);assert.ok(s.bank>=0&&s.catalystBalance>=0);
  if(run%10===0||run===spec.count)onCheckpoint({spec,save:s,rows});
 }
 return{spec,save:s,rows};
}
