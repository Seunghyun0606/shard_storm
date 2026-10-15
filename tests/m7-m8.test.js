import test from 'node:test';import assert from 'node:assert/strict';
import {CONFIG as C}from'../config.js';import{Game}from'../game.js';
import{freshSave,loadSave,writeSave}from'../storage.js';import{stageSettlement,completeSettlement}from'../progression.js';
import{blueprints,craftRelic,equipRelic}from'../relics.js';import{memoryStorage}from'./helpers.js';
import{acceptContract,abandonContract,contractTerms,snapshotContracts,planContracts,applyContracts}from'../contracts.js';
import{ensureOffer,selectAnomaly,consumeOffer,anomalyResult,modifierChances,specialChance}from'../anomalies.js';
import{battle,growth}from'./m7-m8-simulation.js';
const empty=(args={})=>{const g=new Game({...args,options:{motionEnabled:false,...args.options}});g.shapes=[];g.spawn=()=>null;return g;};
const hit=(g,s,damage=99,source='direct',extra={})=>{const c={source,chainId:g.newChain(),depth:0,...extra};g.enqueue(s,damage,c);g.flush();return c;};
const advance=(g,t)=>{while(t>1e-9){const dt=Math.min(C.step,t);g.update(dt);t-=dt;}};
test('M7 all6 blueprint boundaries/rank, craft atomic currencies, two slots, duplication/state guards',()=>{
 for(const[id,r]of Object.entries(C.relics)){const s=freshSave();s.bank=10000;s.catalystBalance=100;s.discoveryRank=r.rank;
 for(const n of [r.target-1,r.target,r.target+1]){s.relicAchievements[r.counter]=n;assert.equal(blueprints(s).includes(id),n>=r.target);}s.discoveryRank--;assert.equal(craftRelic(s,id,'RESULT'),false);s.discoveryRank++;
 s.catalystBalance=0;assert.equal(craftRelic(s,id,'RESULT'),false);assert.equal(s.bank,10000);s.catalystBalance=100;assert.equal(craftRelic(s,id,'PLAYING'),false);assert.equal(craftRelic(s,id,'RESULT'),true);assert.equal(s.bank,10000-r.photon);assert.equal(s.catalystBalance,100-r.catalyst);assert.equal(craftRelic(s,id,'RESULT'),false);
 assert.equal(equipRelic(s,id,0,'TITLE'),true);assert.equal(equipRelic(s,id,1,'RESULT'),false);assert.equal(equipRelic(s,id,0,'PLAYING'),false);assert.equal(equipRelic(s,null,0,'RESULT'),true);
 }
});
test('M7 schema1..5 preserves old19/bank/history/pending; new invalid IDs normalize independently',()=>{
 for(const version of [1,2,3,4,5]){const m=memoryStorage(),s={...freshSave(),saveVersion:version,bank:12345,catalystBalance:19,lifetimeDestroyed:8001,levels:{...freshSave().levels,extraTime:6}};s.relicOwned=['unknown','constructor','ricochetCoil','ricochetCoil'];s.relicEquipped=['unknown','constructor','ricochetCoil','ricochetCoil'];s.relicAchievements.mainShardWallBounces=30;m.setItem(C.storageKey,JSON.stringify(s));const v=loadSave(m);assert.equal(v.saveVersion,C.saveVersion);assert.equal(v.bank,12345);assert.equal(v.levels.extraTime,6);assert.deepEqual(v.relicOwned,version===5?['ricochetCoil']:[]);assert.equal(v.relicAchievements.mainShardWallBounces,version===5?30:0);}
});
test('M7 real wall bounce counted once only on movement (not previews), Coil+Reach range/life',()=>{
 const g=empty({relicLoadout:['ricochetCoil'],levels:{shardRange:3,kineticReach:2},options:{motionEnabled:true}}),s=g.addShape('triangle',900,300,0,false,0);s.motion.rotationRate=.2;s.motion.startAt=0;const p=g.emitMain(s,0,{chainId:g.newChain(),depth:0});assert.equal(p.range,350);assert.equal(p.bounces,2);assert.ok(p.life>=350/700);g.shapes=[];advance(g,.08);assert.equal(g.metaCounters.mainShardWallBounces,1);assert.equal(p.bounces,1);
});
test('M7 Condenser+Amplifier affects only Square/Star native radius and damage',()=>{
 const g=empty({relicLoadout:['waveCondenser'],levels:{chainAmplifier:2}}),s=g.addShape('square',400,300,0,false,0);hit(g,s);advance(g,.04);assert.equal(g.waves[0].maxRadius,102);assert.equal(g.waves[0].damage,5);const c={chainId:g.newChain(),depth:0,source:'impact'};const w=g.area(s,42,1,c,'white');assert.equal(w.maxRadius,42);assert.equal(w.damage,1);
});
test('M7 Crackling Edge+Precision independent .03 effects, direct penalty and no recursive final hits',()=>{
 const g=empty({relicLoadout:['cracklingEdge'],levels:{precisionFracture:2}}),s=g.addShape('square',400,300,0,false,0,'cracked');assert.equal(g.stats.directDamage,2);g.attack(400,300);assert.equal(g.rawSkillBonus,20);advance(g,.04);assert.equal(g.shards.filter(p=>p.source==='precisionFracture').length,3);assert.equal(g.waves.filter(w=>w.cause.relicId==='cracklingEdge').length,1);assert.equal(g.metaCounters.directCrackedKills,1);
});
test('M7 Siphon real Hex wave release only, once/Hex, miss preserves charge, 4s expiry and6 uses',()=>{
 const g=empty({relicLoadout:['hexSiphon']}),h=g.addShape('hex',400,300,0,false,0),a=g.addShape('square',465,300,0,false,0);hit(g,h);advance(g,.12);assert.equal(g.metaCounters.wardReleasesFromHexDeath,1);assert.equal(g.siphonCharges.length,1);g.attack(100,100);assert.equal(g.siphonConsumed,0);g.attack(a.x,a.y);assert.equal(g.siphonConsumed,1);assert.equal(a.destroyed,true);
 g.siphonCharges=[g.elapsed+4];advance(g,4.01);const t=g.addShape('star',400,400,0,false,0);g.attack(t.x,t.y);assert.equal(g.siphonConsumed,1);g.siphonConsumed=6;g.siphonCharges=[g.elapsed+4];g.attack(t.x,t.y);assert.equal(g.siphonConsumed,6);
});
test('M7 Governor .11/.19 execution counts, Resonator3 auxiliary and deadline cancellation',()=>{
 const g=empty({relicLoadout:['reactorGovernor','ancientResonator']}),r=g.addShape('reactor',400,300,0,false,0);hit(g,r);advance(g,.1);assert.equal(g.metaCounters.reactorStageWaveExecuted,0);advance(g,.02);assert.equal(g.waves[0].damage,3);advance(g,.08);assert.equal(g.metaCounters.reactorStageWaveExecuted,2);assert.ok(g.waves.some(w=>w.damage===4));const a=g.addShape('ancient',650,300,0,false,0);hit(g,a);advance(g,.04);assert.equal(g.shards.filter(p=>p.source==='relic-ancient').length,3);assert.ok(g.shards.filter(p=>p.source==='relic-ancient').every(p=>p.range===75&&!p.split&&p.bounces===0));
 const q=empty({duration:.05,relicLoadout:['reactorGovernor']}),s=q.addShape('reactor',400,300,0,false,0);hit(q,s);q.update(.05);assert.equal(q.metaCounters.reactorStageWaveExecuted,0);
});
test('M7 achievements only settlement, refresh/duplicate does not add and v4 pending has no retroactive relics',()=>{
 const g=empty(),s=g.addShape('ancient',400,300,0,false,0);hit(g,s);g.update(20);const save=freshSave();stageSettlement(save,g);assert.equal(save.relicAchievements.ancientKills,0);const m=memoryStorage();writeSave(m,save);const restored=loadSave(m);completeSettlement(restored);assert.equal(restored.relicAchievements.ancientKills,1);assert.equal(completeSettlement(restored),false);
});
test('M8 all10 contracts each3 stages exact targets/rewards, no carryover and permanent stageIII medal',()=>{
 for(const[id,d]of Object.entries(C.contracts)){const s=freshSave();s.discoveryRank=d.rank;for(let stage=1;stage<=3;stage++){assert.equal(acceptContract(s,id,'PLAYING'),false);assert.equal(acceptContract(s,id,'RESULT'),true);const terms=contractTerms(id,stage),snap=snapshotContracts(s);assert.equal(terms.target,d.target*[1,2,4][stage-1]);const short=planContracts(snap,{[d.counter]:terms.target-1});assert.equal(short.photon,0);assert.equal(short.changes[0].progress,terms.target-1);const done=planContracts(snap,{[d.counter]:terms.target+10000});assert.equal(done.photon,Math.floor(d.photon*[1,1.5,2][stage-1]));assert.equal(done.catalyst,d.catalyst*stage);applyContracts(s,done);assert.equal(s.contracts.records[id].progress,0);assert.equal(s.contracts.active.length,0);}assert.deepEqual(s.contractMedals,[id]);assert.equal(acceptContract(s,id,'RESULT'),false);}
});
test('M8 three slots, locked contract no change, abandon only result clears current progress but keeps paid stages',()=>{
 const s=freshSave();s.discoveryRank=4;for(const id of ['preciseClicks','chainHunter','fragmentRoute'])assert.equal(acceptContract(s,id,'TITLE'),true);assert.equal(acceptContract(s,'waveTactic','RESULT'),false);s.contracts.records.preciseClicks.progress=79;assert.equal(abandonContract(s,'preciseClicks','TITLE'),false);assert.equal(abandonContract(s,'preciseClicks','RESULT'),true);assert.equal(s.contracts.records.preciseClicks.progress,0);assert.equal(acceptContract(s,'waveTactic','RESULT'),true);
});
test('M8 frozen contracts, atomic combined currency/achievements/Anomaly and refresh once',()=>{
 const save=freshSave();save.discoveryRank=2;acceptContract(save,'preciseClicks','RESULT');save.contracts.records.preciseClicks.progress=79;
 const g=empty({activeContracts:snapshotContracts(save),anomalyId:'fastOrbit',discoveryRank:2});const s=g.addShape('square',400,300,0,false,0);hit(g,s);g.metaCounters.movingDirectKills=12;g.update(20);assert.equal(g.metaResult.anomaly.succeeded,true);stageSettlement(save,g);assert.equal(save.bank,0);assert.equal(save.contracts.records.preciseClicks.progress,79);const payout=save.pendingSettlement.payout,storage=memoryStorage();writeSave(storage,save);const load=loadSave(storage);assert.ok(load.pendingSettlement);assert.equal(completeSettlement(load),true);assert.equal(load.bank,payout);assert.equal(load.totalAnomalyWins,1);assert.equal(load.contracts.records.preciseClicks.maxCompletedStage,1);assert.equal(completeSettlement(load),false);
});
test('M8 causal classification primary/auxiliary/native/relic wave and Chain10 dedup',()=>{
 const g=empty(),chainId=g.newChain();for(let i=0;i<12;i++){const s=g.addShape('square',400,300,0,false,0);hit(g,s,99,'triangle',{chainId,small:false});}assert.equal(g.metaCounters.primaryShardKills,12);assert.equal(g.metaCounters.chain10,1);const aux=g.addShape('square',400,300,0,false,0);hit(g,aux,99,'pentagon',{small:true});assert.equal(g.metaCounters.primaryShardKills,12);
 const target=g.addShape('triangle',450,300,0,false,0);g.area({x:400,y:300},90,99,{source:'square',chainId:g.newChain(),depth:0},'white');advance(g,.1);assert.equal(g.metaCounters.nativeWaveKills,1);assert.equal(target.destroyed,true);const t=g.addShape('square',650,300,0,false,0);g.area({x:650,y:300},55,99,{source:'relic-edge',chainId:g.newChain(),depth:0,relicId:'cracklingEdge'},'white');g.flush();assert.equal(g.metaCounters.nativeWaveKills,1);
});
test('M8 deterministic offers survive save/refresh/back; consume increments even Normal; sandbox independent',()=>{
 const s=freshSave();s.discoveryRank=4;s.lifetimeDestroyed=8000;s.anomalySeed='fixture-stable';const a=ensureOffer(s);assert.equal(a.offeredIds.length,3);assert.equal(new Set(a.offeredIds).size,3);assert.equal(selectAnomaly(s,a.offeredIds[0],'TITLE'),true);const m=memoryStorage();writeSave(m,s);const load=loadSave(m);assert.deepEqual(ensureOffer(load),a);assert.equal(load.selectedAnomaly,s.selectedAnomaly);assert.equal(selectAnomaly(s,'unknown','RESULT'),false);const chosen=consumeOffer(s);assert.equal(chosen.anomalyId,a.offeredIds[0]);assert.equal(s.anomalyOfferIndex,1);assert.equal(s.selectedAnomaly,null);selectAnomaly(s,null,'RESULT');consumeOffer(s);assert.equal(s.anomalyOfferIndex,2);
});
test('M8 all6 Anomaly success/failure exact bonus floors/cap; zero refinery success still counts',()=>{
 for(const[id,a]of Object.entries(C.anomalies)){assert.equal(anomalyResult(id,{[a.counter]:a.target-1},999).succeeded,false);const good=anomalyResult(id,{[a.counter]:a.target},999);assert.equal(good.photon,60);assert.equal(anomalyResult(id,{[a.counter]:a.target},101).photon,Math.floor(101*a.rate));assert.equal(anomalyResult(id,{[a.counter]:a.target},0).succeeded,true);assert.equal(anomalyResult(id,{},999).photon,0);}assert.equal(anomalyResult('unstableCore',{ancientKills:1},100).succeeded,true);
});
test('M8 actual motion cap, dense target, fragile preserves existing Charged interval, and special AND gates',()=>{
 const normal=new Game({seed:42,discoveryRank:4}),fast=new Game({seed:42,discoveryRank:4,anomalyId:'fastOrbit'});assert.deepEqual(normal.alive.map(s=>[s.x,s.y,s.hp,s.type,s.oreGrade]),fast.alive.map(s=>[s.x,s.y,s.hp,s.type,s.oreGrade]));for(const s of fast.alive){assert.ok(Math.abs(s.motion.rotationRate)<=35*Math.PI/180+1e-9);assert.ok(Math.hypot(s.motion.ampX*s.motion.speedX,s.motion.ampY*s.motion.speedY)<=16);}
 const dense=new Game({anomalyId:'denseField'});assert.equal(dense.target,15);dense.totalDestroyed=750;assert.equal(dense.target,32);
 const a=empty({discoveryRank:1,anomalyId:'fragileMatter'}),b=empty({discoveryRank:1});a.totalDestroyed=b.totalDestroyed=100;a.modifierRng=b.modifierRng=()=>.12;assert.equal(a.rollModifier(false),'charged');assert.equal(b.rollModifier(false),'charged');a.modifierRng=()=>.18;assert.equal(a.rollModifier(false),'cracked');
 const f=empty({discoveryRank:2,anomalyId:'fortified'}),h=f.addShape('hex',400,300,0,false,0),t=f.addShape('square',465,300,0,false,0);hit(f,t,2);assert.equal(t.hp,4);assert.equal(f.runEarned,0);hit(f,h);advance(f,.12);assert.equal(f.metaCounters.wardReleasesFromHexDeath,1);
});
test('M8 new pending corruption is rejected independently, old v4 pending credited without retroactive rewards',()=>{
 const s=freshSave();s.bank=500;const g=empty();hit(g,g.addShape('ancient',400,300,0,false,0));g.update(20);stageSettlement(s,g);s.saveVersion=4;delete s.pendingSettlement.relicAchievementDeltas;delete s.pendingSettlement.contractPlan;delete s.pendingSettlement.payoutBreakdown;delete s.pendingSettlement.anomalySucceeded;const m=memoryStorage();writeSave(m,s);const v=loadSave(m);completeSettlement(v);assert.equal(v.relicAchievements.ancientKills,0);assert.equal(v.totalAnomalyWins,0);assert.ok(v.bank>500);
 const bad=freshSave();bad.bank=600;stageSettlement(bad,g);bad.pendingSettlement.contractPlan={changes:[{id:'not-a-contract'}],completed:[],photon:1,catalyst:0};writeSave(m,bad);const safe=loadSave(m);assert.equal(safe.bank,600);assert.equal(safe.pendingSettlement,null);
});
test('M8 overlay exact probabilities and caps for all6, no rank/tier bypass or permanent mutation',()=>{
 const saved=JSON.stringify(C),g=empty({discoveryRank:4,anomalyId:'overcharge'});assert.deepEqual(modifierChances(g,{cracked:.10,charged:.05}),{cracked:.10,charged:.08750000000000001});assert.equal(specialChance(g,'reactor',.03),.045);assert.equal(specialChance(g,'hex',.06),.06);g.anomalyId='unstableCore';assert.equal(specialChance(g,'ancient',.006),.006*3);g.anomalyId='fortified';assert.equal(specialChance(g,'hex',.06),.1);g.anomalyId='fragileMatter';assert.deepEqual(modifierChances(g,{cracked:.10,charged:.04}),{cracked:.18,charged:.04});assert.equal(new Game({discoveryRank:0,anomalyId:'unstableCore'}).anomalyId,null);assert.equal(JSON.stringify(C),saved);
});
test('M7 Siphon scheduled-cap rejection consumes no charge, event log bounded, pause/deadline stop metrics',()=>{
 const g=empty({relicLoadout:['hexSiphon']}),s=g.addShape('star',400,300,0,false,0);g.siphonCharges=[4];for(let i=0;i<C.caps.scheduled;i++)g.scheduleEvent({kind:'effect',action:()=>{},chainId:g.newChain(),scheduledTime:1,priority:1});g.attack(s.x,s.y);assert.equal(g.siphonConsumed,0);g.paused=true;g.update(3);assert.equal(g.elapsed,0);g.paused=false;g.queue=[];for(let i=0;i<600;i++)hit(g,g.addShape('square',400,300,0,false,0));assert.equal(g.causalLog.length,C.meta.eventLogCap);g.update(20);const final=g.record().metaCounters;g.attack(400,300);advance(g,2);assert.deepEqual(g.record().metaCounters,final);
});
test('M8 source snapshot immutable, inactive contracts no retroactive progress and freeze payout at deadline',()=>{
 const s=freshSave();acceptContract(s,'preciseClicks','TITLE');const active=snapshotContracts(s),loadout=['waveCondenser'];const g=empty({activeContracts:active,relicLoadout:loadout});active[0].progress=100000;loadout[0]='cracklingEdge';assert.equal(g.contractSnapshot[0].progress,0);assert.deepEqual(g.relicLoadout,['waveCondenser']);g.update(20);assert.throws(()=>g.metaResult.contracts.changes[0].progress=50,TypeError);assert.throws(()=>g.metaResult.anomaly.photon=100,TypeError);assert.equal(g.metaResult.contracts.photon,0);
});
test('M8 Core/Ancient actual ore kill counters, independent chain thresholds and nonexecuted Reactor cancellation',()=>{
 const g=empty({discoveryRank:4});const s=g.addShape('ancient',400,300,0,false,0);s.oreGrade='core';hit(g,s);assert.equal(g.metaCounters.coreOreKills,1);assert.equal(g.metaCounters.ancientKills,1);assert.equal(g.metaCounters.chargedOrReactorKills,0);for(let j=0;j<2;j++){const chainId=g.newChain();for(let i=0;i<6;i++)hit(g,g.addShape('square',400,300,0,false,0),99,'direct',{chainId});}assert.equal(g.metaCounters.chain10,0);
 const r=empty({duration:.02,discoveryRank:3}),t=r.addShape('reactor',400,300,0,false,0);hit(r,t);r.update(.02);assert.equal(r.metaCounters.reactorStageWaveExecuted,0);assert.equal(r.metaCounters.chargedOrReactorKills,1);
});
test('M8 next offer uses confirmed Run count; aborted run consumes sequence without rewards',()=>{
 const s=freshSave();s.anomalySeed='stable';const initial=ensureOffer(s);consumeOffer(s);const pending=ensureOffer(s);assert.notEqual(pending.offerId,initial.offerId);assert.equal(s.totalRuns,0);s.totalRuns++;const confirmed=ensureOffer(s);assert.notEqual(confirmed.offerId,pending.offerId);assert.match(confirmed.seedKey,/:1:1$/);assert.equal(s.totalAnomalyWins,0);assert.equal(s.bank,0);
});
for(const pair of [['ricochetCoil','waveCondenser'],['cracklingEdge','hexSiphon'],['reactorGovernor','ancientResonator'],['waveCondenser','reactorGovernor'],['hexSiphon','ancientResonator']])test(`M7 pair ${pair.join('+')} real moving combat is deterministic, cosmetic-neutral and capped`,()=>{
 const levels=Object.fromEntries(Object.entries(C.upgrades).map(([k,u])=>[k,u.max])),args={seed:42,levels,duration:20,discoveryRank:4,relicLoadout:pair},a=battle(args),b=battle({...args,options:{...C.options,damageVFX:false,visualVariety:false,comboFeedback:false,sound:false,modifierVisuals:false}});assert.deepEqual([a.runEarned,a.totalDestroyed,a.finalMetaCounters,a.relicActivations,a.metaResult],[b.runEarned,b.totalDestroyed,b.finalMetaCounters,b.relicActivations,b.metaResult]);
});
for(const id of Object.keys(C.anomalies))test(`M8 ${id} real combat computes both success and failure and preserves base payout`,()=>{
 const a=C.anomalies[id],g=empty({anomalyId:id,discoveryRank:4});g.metaCounters[a.counter]=a.target;g.update(20);assert.equal(g.metaResult.anomaly.succeeded,true);assert.equal(g.metaCounters.anomalyWins,1);const f=empty({anomalyId:id,discoveryRank:4});hit(f,f.addShape('square',400,300,0,false,0));f.update(20);assert.equal(f.metaResult.anomaly.succeeded,false);const s=freshSave();stageSettlement(s,f);completeSettlement(s);assert.equal(s.bank,f.refinery.payout);assert.equal(s.totalAnomalyWins,0);
});
test('M7 Ancient auxiliary lineage cannot trigger additional Relics through native effects or HP stages',()=>{
 const g=empty({relicLoadout:['ancientResonator','reactorGovernor']}),r=g.addShape('reactor',400,300,0,false,0);hit(g,r,99,'relic-ancient',{small:true,relicId:'ancientResonator',noRelicProc:true});advance(g,.04);assert.equal(g.waves[0].damage,2);assert.equal(g.relicActivations.reactorGovernor||0,0);const a=g.addShape('ancient',650,300,0,false,0);hit(g,a,99,'relic-ancient',{small:true,noRelicProc:true});advance(g,.04);assert.equal(g.shards.filter(p=>p.source==='relic-ancient').length,0);
 const c=empty({relicLoadout:['waveCondenser','ancientResonator']}),s=c.addShape('square',400,300,0,false,0);hit(c,s,99,'relic-ancient',{small:true,noRelicProc:true});advance(c,.04);assert.equal(c.waves[0].maxRadius,90);assert.equal(c.waves[0].damage,2);assert.equal(c.relicActivations.waveCondenser||0,0);
});
test('M8 native wave owns its source shape ID and legacy M6 MAX fixture keeps fresh achievements',()=>{
 const g=empty(),s=g.addShape('square',400,300,0,false,0);hit(g,s,99,'triangle',{originShapeId:123,small:false});advance(g,.04);assert.equal(g.waves[0].cause.originShapeId,s.id);
 const data=growth({key:'legacy-test',seed:42,strategy:'Reactor',profile:'LegacyMax',mode:'OFF',timeMode:'Fixed20',count:1});assert.equal(data.firstMax,0);assert.equal(data.rows[0].levels,50);assert.equal(data.rows[0].rank,4);assert.deepEqual(data.rows[0].blueprints,[]);assert.equal(data.rows[0].catalyst,200+data.rows[0].catalystTotal);
});
test('M8 Dense objective is a real fifteen-kill chain; zero bonus still completes Anomaly Pilot once',()=>{
 const save=freshSave();save.discoveryRank=2;save.lifetimeDestroyed=1200;acceptContract(save,'anomalyPilot','RESULT');save.contracts.records.anomalyPilot.progress=3;
 const g=empty({discoveryRank:2,oreEnabled:false,anomalyId:'denseField',activeContracts:snapshotContracts(save)}),star=g.addShape('star',400,300,0,false,0);
 // Forced Star fixture at legal simultaneous field size; no counters injected.
 for(let i=0;i<14;i++){const a=i*Math.PI*2/14;g.addShape('triangle',400+Math.cos(a)*144,300+Math.sin(a)*144,0,false,0);}
 for(let i=0;i<3;i++){g.attack(star.x,star.y);if(i<2)advance(g,.2);}advance(g,.4);assert.equal(g.totalDestroyed,15);assert.equal(g.metaCounters.chain15,1);assert.equal(g.bestChain,15);g.update(20);
 assert.equal(g.metaResult.anomaly.succeeded,true);assert.equal(g.metaResult.anomaly.photon,0);assert.equal(g.metaResult.contracts.photon,180);stageSettlement(save,g);assert.equal(completeSettlement(save),true);assert.equal(save.totalAnomalyWins,1);assert.equal(save.bank,g.refinery.payout+180);assert.equal(completeSettlement(save),false);
});
