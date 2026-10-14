import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../config.js';
import { rankFor } from '../discovery.js';
import { freshSave, loadSave, writeSave } from '../storage.js';
import { stageSettlement, completeSettlement } from '../progression.js';
import { Game } from '../game.js';
import { buyUpgrade } from '../progression.js';
import { skillDefinitions, skillState, skillCost } from '../skill-tree.js';
import { planRefinery } from '../refinery.js';
import { poseAt } from '../motion.js';
import { specialType, specialPlan, applyTether } from '../content.js';
import { skillWaveContact } from '../content.js';
const emptyGameM6=(opts={})=>{const g=new Game({...opts,options:{motionEnabled:false,...opts.options}});g.shapes=[];g.spawn=()=>null;return g;};
const hit=(g,s,damage,source='direct',extra={})=>{const c={source,chainId:g.newChain(),depth:0,...extra};g.enqueue(s,damage,c);g.flush();return c;};
const step=(g,t)=>{for(let i=0;i<Math.ceil(t/C.step);i++)g.update(C.step);};
import { memoryStorage } from './helpers.js';
import { rollOre, oreChances } from '../ore.js';
test('M5 ore independent spawn/HP/placement, unlocked probability boundaries and once-only drops',()=>{
  assert.equal(rollOre(0,0), 'common');assert.equal(rollOre(.019999,2),'core');assert.equal(rollOre(.02,2),'prism');assert.equal(rollOre(.1,2),'common');assert.equal(rollOre(.004999,4),'void');assert.deepEqual(oreChances(0,2),{prism:0,core:0,void:0});
  const a=new Game({seed:7,discoveryRank:4}),b=new Game({seed:7,discoveryRank:4,oreEnabled:false});
  assert.deepEqual(a.alive.map(s=>[s.type,s.x,s.y,s.hp,s.modifier]),b.alive.map(s=>[s.type,s.x,s.y,s.hp,s.modifier]));
  for(const source of ['direct','triangle','square']){const g=new Game({discoveryRank:2,options:{motionEnabled:false}});g.shapes=[];const s=g.addShape('square',300,300,0,false,0);s.oreGrade='core';const c={source,chainId:g.newChain(),depth:0};g.enqueue(s,99,c);g.flush();assert.equal(g.rawOreBonus,60);assert.equal(g.pendingCatalyst,1);g.enqueue(s,99,c);g.flush();assert.equal(g.pendingCatalyst,1);g.update(20);const save=freshSave();stageSettlement(save,g);assert.equal(save.catalystBalance,0);completeSettlement(save);assert.equal(save.catalystBalance,1);completeSettlement(save);assert.equal(save.catalystBalance,1);}
});
test('M5 rank exact boundaries, staged rewards advance once only after completion',()=>{
  for(const [k,r] of [[0,0],[299,0],[300,1],[1199,1],[1200,2],[3499,2],[3500,3],[7999,3],[8000,4]])assert.equal(rankFor(k),r);
  const save=freshSave(),g=new Game({runId:'rank-proof'});save.lifetimeDestroyed=299;g.totalDestroyed=1;g.update(20);
  stageSettlement(save,g);assert.equal(save.discoveryRank,0);assert.equal(save.lifetimeDestroyed,299);
  completeSettlement(save);assert.equal(save.discoveryRank,1);assert.equal(save.milestoneWelcomeFlags[1],true);assert.equal(completeSettlement(save),false);assert.equal(save.lifetimeDestroyed,300);
});
test('M5 schema1/2/3/4 preserve valid bank, levels, history and exact lifetime; sandbox cannot write',()=>{
  for(const version of [1,2,3,4]){const mem=memoryStorage(),old={...freshSave(),saveVersion:version,bank:999,levels:{...freshSave().levels,extraTime:6},lifetimeDestroyed:1570,totalRuns:9,lastRuns:[{totalDestroyed:60,photonsEarned:10}]};mem.setItem(C.storageKey,JSON.stringify(old));const s=loadSave(mem);assert.equal(s.saveVersion,6);assert.equal(s.bank,999);assert.equal(s.levels.extraTime,6);assert.deepEqual(s.lastRuns,old.lastRuns);assert.equal(s.lifetimeDestroyed,version<3?0:1570);assert.equal(s.discoveryRank,version<3?0:2);assert.equal(writeSave(mem,{...s,sandbox:true}),false);}
});
test('M5 eight skill purchases require rank, all prerequisites and both currencies atomically',()=>{
  for(const node of skillDefinitions.filter(n=>n.rank)){
    const s=freshSave();s.bank=10000;s.catalystBalance=100;s.discoveryRank=node.rank;for(const p of node.prerequisites)s.levels[p.id]=p.minLevel;
    const before=structuredClone(s);s.discoveryRank--;assert.equal(buyUpgrade(s,node.id,'RESULT'),false);s.discoveryRank++;
    if(node.catalyst[0]){s.catalystBalance=0;assert.equal(buyUpgrade(s,node.id,'RESULT'),false);assert.equal(s.bank,before.bank);s.catalystBalance=100;}
    assert.equal(buyUpgrade(s,node.id,'PLAYING'),false);assert.equal(buyUpgrade(s,node.id,'RESULT'),true);assert.equal(s.bank,10000-node.baseCost);assert.equal(s.catalystBalance,100-node.catalyst[0]);
    while(s.levels[node.id]<node.max)assert.equal(buyUpgrade(s,node.id,'RESULT'),true);assert.equal(buyUpgrade(s,node.id,'RESULT'),false);
  }
});
test('M5 Yield retains original slot RNG and applies level snapshot without reroll or OFF bonuses',()=>{
  for(const seed of [31415,1,7,42,99])for(const lv of [0,1,2]){
    const a=planRefinery({raw:10000,seed}),b=planRefinery({raw:10000,seed,yieldLevel:lv});assert.deepEqual(a.tokens.map(t=>t.slot),b.tokens.map(t=>t.slot));
    for(const t of b.tokens)assert.equal(t.multiplier,lv>=1&&t.originalMultiplier===.8?1:lv>=2&&t.originalMultiplier===1?1.1:t.originalMultiplier);
    assert.equal(b.payout,Math.floor(b.tokens.reduce((v,t)=>v+t.raw*.06*t.multiplier,0)+1e-9));assert.equal(planRefinery({raw:10000,seed,yieldLevel:lv,enabled:false}).payout,600);
  }
});
test('M6 Hex first hit armor: direct4 normal; direct3/projectile/wave one HP; wards pay actual only',()=>{
  for(const [damage,source,left]of [[4,'direct',4],[3,'direct',7],[9,'triangle',7],[2,'square',7]]){const g=emptyGameM6(),s=g.addShape('hex',400,300,0,false,0);hit(g,s,damage,source);assert.equal(s.hp,left);assert.equal(s.shieldBroken,true);hit(g,s,2);assert.equal(s.hp,left-2);}
  const g=emptyGameM6(),hex=g.addShape('hex',400,300,0,false,0),a=g.addShape('square',460,300,0,false,0),b=g.addShape('square',400,365,0,false,0),c=g.addShape('square',340,300,0,false,0);assert.equal(g.alive.filter(s=>s.wardSourceId===hex.id).length,2);const raw=g.runEarned;hit(g,a,1);assert.equal(a.hp,4);assert.equal(g.runEarned,raw);hit(g,a,3);assert.equal(a.hp,2);
  hit(g,hex,99);assert.equal(a.wardSourceId,hex.id);step(g,.04);assert.equal(a.wardSourceId,hex.id);step(g,.08);assert.equal(a.wardSourceId,undefined);assert.equal(b.wardSourceId,undefined);g.update(20);assert.ok(g.shapes.every(s=>!s.wardSourceId));
});
test('M6 Ward failsafe at .25 even when moving beyond release wave; rank AND tier and cap fallback',()=>{
 const g=emptyGameM6({options:{motionEnabled:true}}),hex=g.addShape('hex',400,300,0,false,0),t=g.addShape('square',465,300,0,false,0);hit(g,hex,99);t.motion.anchorX=t.x=800;step(g,.27);assert.equal(t.wardSourceId,undefined);
 for(const [rank,tier,expected]of [[1,6,null],[2,1,null],[2,2,'hex']]){const a=new Game({discoveryRank:rank});a.highestTier=tier;a.specialRng=()=>0;assert.equal(specialType(a),expected);}
 const a=emptyGameM6({discoveryRank:2});a.highestTier=2;a.specialRng=()=>0;for(let i=0;i<3;i++)a.addShape('hex',200+i*100,300,0,false,0);assert.equal(specialType(a),null);
});
test('M6 Shield Pocket and Tether Pair share actual bounded opposed pose and pause',()=>{
 const g=emptyGameM6({discoveryRank:2});g.addShape('hex',400,300,0,false,0);assert.equal(specialPlan(g,true).kind,'shield_pocket');
 const a=emptyGameM6({discoveryRank:2,options:{motionEnabled:true}});a.addShape('square',300,200,0,false,0);a.patternRng=()=>0;const plan=specialPlan(a,true);assert.equal(plan.kind,'tether_pair');const s1=a.addShape('triangle',plan.points[0].x,plan.points[0].y,0,false,0),s2=a.addShape('square',plan.points[1].x,plan.points[1].y,0,false,0);applyTether(a,plan,s1,0);applyTether(a,plan,s2,0);
 for(let t=0;t<8;t+=.1){const p=poseAt(s1,t),q=poseAt(s2,t);assert.ok(Math.abs(p.x-s1.anchorX+q.x-s2.anchorX)<1e-9);assert.ok(Math.abs(p.x-s1.anchorX)<=6);assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>s1.radius+s2.radius+C.spawnGap);}
 a.update(.1);assert.equal(a.attack(s1.x,s1.y),true);a.paused=true;const pos=poseAt(s2,a.elapsed);a.update(.1);assert.deepEqual(poseAt(s2,a.elapsed),pos);
});
test('M6 Reactor 12→6 once, 12→0 emits .03 and .11 sequential waves; deadline cancels late effects',()=>{
 for(const lethal of [false,true]){const g=emptyGameM6(),s=g.addShape('reactor',400,300,0,false,0);hit(g,s,lethal?12:6);assert.equal(g.stageEvents.length,lethal?2:1);assert.equal(g.waves.length,0);step(g,.04);assert.equal(g.waves.length,1);assert.equal(g.waves[0].damage,2);assert.equal(g.waves[0].maxRadius,75);if(lethal){step(g,.08);assert.ok(g.waves.some(w=>w.damage===3&&w.maxRadius===110));}else{hit(g,s,1);assert.equal(g.stageEvents.length,1);}}
 const g=emptyGameM6({duration:.02}),s=g.addShape('reactor',400,300,0,false,0);hit(g,s,99);g.update(.02);assert.equal(g.waves.length,0);assert.equal(g.queue.length,0);
});
test('M6 Ancient multi-threshold effects ordered once, no premature bonus, final Catalyst additive',()=>{
 const g=emptyGameM6(),s=g.addShape('ancient',400,300,0,false,0);s.oreGrade='void';hit(g,s,23);assert.deepEqual(g.stageEvents.map(e=>e.stageIndex),[1,2,3]);assert.equal(s.hp,7);assert.equal(g.pendingCatalyst,0);assert.equal(g.rawBase,23);step(g,.04);assert.equal(g.shards.length,6);assert.equal(g.waves.length,3);assert.ok(g.shards.every(p=>p.small&&p.damage===1&&p.range===90));hit(g,s,99);assert.equal(g.pendingCatalyst,4);assert.equal(g.rawBase,150);assert.equal(g.rawOreBonus,180);assert.equal(g.stageEvents.length,3);
 const a=new Game({discoveryRank:4});a.totalDestroyed=200;a.unlock();a.specialRng=()=>.095;assert.equal(specialType(a),'ancient');a.specialSpawns.ancient=2;assert.equal(specialType(a),null);
});
test('M6 Precision direct-final Cracked only, lv1/2 exact nonrecursive shards and Raw',()=>{
 for(const lv of [1,2])for(const source of ['direct','triangle']){const g=emptyGameM6({levels:{precisionFracture:lv}}),s=g.addShape('square',400,300,0,false,0,'cracked');hit(g,s,99,source);assert.equal(g.rawSkillBonus,source==='direct'?10*lv:0);step(g,.04);const p=g.shards.filter(s=>s.source==='precisionFracture');assert.equal(p.length,source==='direct'?lv+1:0);assert.ok(p.every(s=>s.small&&s.damage===1&&s.range===60&&s.bounces===0&&!s.split));}
});
test('M6 Rare Separator Core-only +40/80, first Core extra Catalyst once per Run',()=>{
 for(const lv of [1,2]){const g=emptyGameM6({levels:{rareSeparator:lv}});for(let i=0;i<2;i++){const s=g.addShape('square',200+i*200,300,0,false,0);s.oreGrade='core';hit(g,s,99);}assert.equal(g.rawSkillBonus,80*lv);assert.equal(g.pendingCatalyst,lv===1?2:3);}
});
test('M6 Fragment Relay primary final kills only; four per chain; lv1/2 and auxiliaries cannot recur',()=>{
 for(const lv of [1,2]){const g=emptyGameM6({levels:{fragmentRelay:lv}}),chainId=g.newChain();for(let i=0;i<6;i++){const s=g.addShape('square',200+i*70,300,0,false,0);hit(g,s,99,'triangle',{small:false,angle:0,chainId});}assert.equal(g.skillActivations.fragmentRelay,4);step(g,.04);const relay=g.shards.filter(s=>s.source==='relay');assert.equal(relay.length,4);assert.ok(relay.every(s=>s.damage===lv&&s.range===(lv===1?80:90)&&!s.split&&s.bounces===0));const n=g.addShape('square',300,450,0,false,0);hit(g,n,99,'relay',{small:true,chainId});assert.equal(g.skillActivations.fragmentRelay,4);const m=g.addShape('square',400,450,0,false,0);hit(g,m,99,'pentagon',{small:true});assert.equal(g.skillActivations.fragmentRelay,4);}
});
test('M6 Kinetic primary range uses original actual rotation, auxiliary/waves/static unaffected',()=>{
 for(const lv of [1,2])for(const rotating of [true,false]){const g=emptyGameM6({levels:{kineticReach:lv},options:{motionEnabled:true}}),s=g.addShape('triangle',400,300,0,false,0);s.motion.rotationRate=rotating?.2:0;s.motion.startAt=0;g.emitNative(s,{chainId:g.newChain(),depth:0});assert.ok(g.shards.every(p=>p.range===180+(rotating?30*lv:0)));const aux=g.emitAux(s,0,{chainId:g.newChain(),depth:0},'relay',1,80);assert.equal(aux.range,80);}
});
test('M6 Resonance Reactor→Charged only, delay .08, 50/60px, max2 per wave and no recursive aftershocks',()=>{
 for(const lv of [1,2]){const g=emptyGameM6({levels:{resonanceLayer:lv}}),wave={},cause={source:'reactor',depth:0,chainId:g.newChain()};for(let i=0;i<3;i++){const s=g.addShape('square',200+i*100,300,0,false,0);s.modifier='charged';skillWaveContact(g,s,cause,wave);}assert.equal(g.skillActivations.resonanceLayer,2);step(g,.066);assert.equal(g.waves.length,0);step(g,.017);assert.equal(g.waves.length,2);assert.ok(g.waves.every(w=>w.damage===1&&w.maxRadius===40+10*lv));skillWaveContact(g,g.alive[0],{...cause,source:'resonance'},{});assert.equal(g.skillActivations.resonanceLayer,2);}
});
test('M6 Salvage Scanner exact unlocked probabilities, cosmetic-independent and statistically sampled',()=>{
 assert.deepEqual(oreChances(2,2),{prism:.08,core:.03,void:0});assert.deepEqual(oreChances(4,2),{prism:.08,core:.03,void:.007});
 const a=new Game({seed:99,discoveryRank:4,levels:{salvageScanner:2}}),b=new Game({seed:99,discoveryRank:4,levels:{salvageScanner:2},options:{visualVariety:false,modifierVisuals:false}});assert.deepEqual(a.alive.map(s=>s.oreGrade),b.alive.map(s=>s.oreGrade));
 const counts={common:0,prism:0,core:0,void:0};for(let i=0;i<100000;i++)counts[rollOre((i+.5)/100000,4,2)]++;assert.deepEqual(counts,{common:88300,prism:8000,core:3000,void:700});
});
test('M6 Channel max2 marks per Ancient across all stages, expires1s; direct kill releases2 once',()=>{
 const g=emptyGameM6({levels:{catalystChannel:1}}),cause={source:'ancient',originShapeId:77,depth:0,chainId:g.newChain()},targets=[];
 for(let i=0;i<3;i++){const s=g.addShape('square',200+i*100,300,0,false,0);targets.push(s);skillWaveContact(g,s,cause,{});}assert.equal(g.channelCounts.get(77),2);assert.equal(targets[0].channelUntil,1);assert.equal(targets[2].channelUntil,undefined);
 hit(g,targets[0],99);step(g,.04);assert.equal(g.shards.filter(p=>p.source==='channel-fragment').length,2);assert.ok(g.shards.filter(p=>p.source==='channel-fragment').every(p=>p.range===70&&p.damage===1&&!p.split));step(g,1);hit(g,targets[1],99);assert.equal(g.skillActivations.catalystChannel,1);
});
test('M6 new stage/skill schedules respect chain events/depth/queue/shard caps and zero-time cleanup',()=>{
 const g=emptyGameM6({levels:{precisionFracture:2}}),chainId=g.newChain();g.chains.get(chainId).events=C.caps.events;assert.equal(g.skillEffect('precisionFracture',()=>{}, {source:'direct',chainId,depth:1}),false);assert.equal(g.capCounts.chainEvents,1);
 g.emitAux({x:300,y:300},0,{chainId,depth:11},'relay',1,80);assert.equal(g.shards.length,0);assert.equal(g.capCounts.depth,1);g.update(20);assert.equal(g.queue.length,0);assert.equal(g.shards.length,0);
});
test('M6 Kinetic full range3+reach2 flight lifetime covers390px; unsafe unpaired Tether falls back',()=>{
 const g=emptyGameM6({levels:{shardRange:3,kineticReach:2},options:{motionEnabled:true}}),s=g.addShape('triangle',400,300,0,false,0);s.motion.rotationRate=.2;s.motion.startAt=0;const p=g.emitMain(s,0,{chainId:g.newChain(),depth:0});assert.equal(p.range,390);assert.ok(p.life>=390/700);
 const plan={kind:'tether_pair',pair:[]},a=g.addShape('square',300,400,0,false,0),b=g.addShape('square',400,400,0,false,0);applyTether(g,plan,a,0);assert.equal(a.motion.startAt,Infinity);applyTether(g,plan,b,1);assert.ok(Number.isFinite(a.motion.startAt));
});
test('M6 complete dynamic battle deterministic and cosmetic-neutral at Rank4 with all new skills',async()=>{
 const {simulate}=await import('./simulation.js'),levels=Object.fromEntries(Object.entries(C.upgrades).map(([k,u])=>[k,u.max]));const args={seed:42,levels,discoveryRank:4,welcomeFlags:{4:true},duration:20};const a=simulate(args),b=simulate({...args,options:{...C.options,visualVariety:false,modifierVisuals:false,damageVFX:false,comboFeedback:false,sound:false}});
 for(const field of ['rawEarned','rawBase','rawOreBonus','rawSkillBonus','pendingCatalyst','totalDestroyed','photonsEarned','bestChain'])assert.equal(a[field],b[field]);assert.deepEqual(a.oreKills,b.oreKills);assert.deepEqual(a.skillActivations,b.skillActivations);
});
test('M6 actual Reactor wave contacts schedule Resonance; Ancient wave contacts allocate Channel marks',()=>{
 const g=emptyGameM6({levels:{resonanceLayer:2}}),r=g.addShape('reactor',400,300,0,false,0),a=g.addShape('star',450,300,0,false,0,'charged');hit(g,r,6);step(g,.09);assert.equal(g.skillActivations.resonanceLayer,1);const e=g.skillEvents.find(e=>e.triggeredBySkill==='resonanceLayer');assert.ok(Math.abs(e.scheduledAt-e.at-.08)<1e-9);step(g,.1);assert.ok(g.waves.some(w=>w.sourceKind==='resonance'&&w.maxRadius===60));assert.ok(a.hp<7);
 const q=emptyGameM6({levels:{catalystChannel:1}}),core=q.addShape('ancient',400,300,0,false,0);for(const [x,y]of [[440,300],[400,350],[350,300]])q.addShape('square',x,y,0,false,0);hit(q,core,8);step(q,.15);assert.equal(q.channelCounts.get(core.id),2);const marked=q.alive.filter(s=>s.channelUntil>=q.elapsed);assert.equal(marked.length,2);hit(q,marked[0],99);step(q,.04);assert.equal(q.skillActivations.catalystChannel,1);
});
test('M5 pending v3 refresh migrates and atomically credits exactly once in schema4; unsafe values preserve bank',()=>{
 const storage=memoryStorage(),save=freshSave(),g=new Game({runId:'v3-pending'});g.totalDestroyed=20;g.runEarned=1000;g.update(20);stageSettlement(save,g);save.saveVersion=3;storage.setItem(C.storageKey,JSON.stringify(save));const a=loadSave(storage);assert.equal(a.saveVersion,6);const payout=a.pendingSettlement.payout;assert.equal(completeSettlement(a),true);writeSave(storage,a);const b=loadSave(storage);assert.equal(completeSettlement(b),false);assert.equal(b.bank,payout);assert.equal(b.lifetimeDestroyed,20);
 const bad=freshSave();bad.bank=Number.MAX_SAFE_INTEGER;bad.pendingSettlement={id:'unsafe',payout:1,record:{totalDestroyed:0}};assert.equal(completeSettlement(bad),false);assert.equal(bad.bank,Number.MAX_SAFE_INTEGER);
});
test('M6 Ward failsafe survives visible stall skipping release events',()=>{
 const g=emptyGameM6(),h=g.addShape('hex',400,300,0,false,0),s=g.addShape('square',450,300,0,false,0);hit(g,h,99);assert.equal(s.wardSourceId,h.id);g.skipAhead(.3);assert.equal(s.wardSourceId,undefined);assert.equal(s.hp,4);hit(g,s,1);assert.equal(s.hp,3);
});
test('M6 Ancient Channel wave can reach safely spaced ordinary circles under the real spawn policy',()=>{
 const g=new Game({discoveryRank:4,options:{motionEnabled:false},levels:{catalystChannel:1}});g.shapes=[];g.totalDestroyed=200;g.unlock();g.pending=[];
 const a=g.addShape('ancient',480,300,0,false,0),cfg=C.shapes.square;g.rng=()=>.5;g.patternPlan={kind:'burst_cluster',anchor:a,index:0,points:[{x:480+76,y:300}]};g.experiment.clusterChance=1;
 const s=g.spawn('square',0);assert.ok(s);s.modifier='normal';s.hp=s.maxHP=cfg.hp;assert.ok(Math.hypot(s.anchorX-a.anchorX,s.anchorY-a.anchorY)>=a.radius+s.radius+C.spawnGap+C.motion.maxDrift);
 assert.ok(Math.hypot(s.x-a.x,s.y-a.y)-s.radius<=60);hit(g,a,8);step(g,.15);assert.ok(s.channelUntil>g.elapsed);hit(g,s,99);step(g,.04);assert.equal(g.skillActivations.catalystChannel,1);
});
