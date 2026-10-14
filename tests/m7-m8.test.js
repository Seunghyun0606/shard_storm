import test from 'node:test';import assert from 'node:assert/strict';
import {CONFIG as C}from'../config.js';import{Game}from'../game.js';
import{freshSave,loadSave,writeSave}from'../storage.js';import{stageSettlement,completeSettlement}from'../progression.js';
import{blueprints,craftRelic,equipRelic}from'../relics.js';import{memoryStorage}from'./helpers.js';
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
 for(const version of [1,2,3,4,5]){const m=memoryStorage(),s={...freshSave(),saveVersion:version,bank:12345,catalystBalance:19,lifetimeDestroyed:8001,levels:{...freshSave().levels,extraTime:6}};s.relicOwned=['unknown','ricochetCoil','ricochetCoil'];s.relicEquipped=['unknown','ricochetCoil','ricochetCoil'];s.relicAchievements.mainShardWallBounces=30;m.setItem(C.storageKey,JSON.stringify(s));const v=loadSave(m);assert.equal(v.saveVersion,5);assert.equal(v.bank,12345);assert.equal(v.levels.extraTime,6);assert.deepEqual(v.relicOwned,version===5?['ricochetCoil']:[]);assert.equal(v.relicAchievements.mainShardWallBounces,version===5?30:0);}
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
