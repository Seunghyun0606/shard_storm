// Registered by the M10 test entry point only after production integration.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../game.js';
import {CONFIG as C} from '../config.js';
import {SIGNATURE_IDS,EXPANSION_SKILLS,EVOLUTION_FAMILIES} from '../expansion-defs.js';
import {freshSave,loadSave} from '../storage.js';
import {buyUpgrade,stageSettlement,completeSettlement} from '../progression.js';
import {skillCost,validateSkillTree,skillDefinitions} from '../skill-tree.js';
import {toggleSignature,craftEvolution,activateEvolution,applyBuildPreset} from '../builds.js';

const advance=(g,seconds)=>{for(let left=seconds;left>1e-9;left-=C.step)g.update(Math.min(C.step,left));};
function arena(levels={},extra={}) {
 const g=new Game({ecologyEnabled:true,skillExpansionEnabled:true,discoveryRank:4,sandbox:true,levels,signatureLoadout:SIGNATURE_IDS.filter(id=>levels[id]),options:{motionEnabled:false},...extra});
 g.shapes=[];g.shards=[];g.queue=[];g.spawnClock=-Infinity;return g;
}
// Isolate one ability from random spawn traits; trait combination tests set them explicitly.
const add=(g,type,x=450,y=270)=>{const s=g.addShape(type,x,y,0,false,0);s.secondaryTrait=null;return s;};
function hit(g,s,damage,source='direct',chainId=g.newChain(),extra={}) {g.enqueue(s,damage,{source,chainId,depth:0,...extra});g.flush();return chainId;}
function waveHit(g,s,chain=g.newChain(),source='square') {const origin={x:s.x-65,y:s.y,id:-100};return g.area(origin,100,1,{source,chainId:chain,depth:0,nativeWave:true,originShapeId:-100},'#fff');}
export function registerM10Cases() {
 test('M10 exact49 nodes/100levels/10Signatures/15forms; old prices unchanged; graph valid',()=>{
  assert.equal(Object.keys(C.upgrades).length,49);assert.equal(Object.values(C.upgrades).reduce((n,u)=>n+u.max,0),100);
  assert.equal(Object.keys(EXPANSION_SKILLS).length,30);assert.equal(SIGNATURE_IDS.length,10);assert.equal(Object.values(EVOLUTION_FAMILIES).reduce((n,f)=>n+Object.keys(f.forms).length,0),15);
  assert.equal(validateSkillTree(),true);assert.equal(skillDefinitions.length,49);
  for(const[id,d]of Object.entries(EXPANSION_SKILLS)){assert.equal(skillCost(id,0),d.baseCost);if(d.max===2)assert.equal(skillCost(id,1),Math.ceil(d.baseCost*1.6));}
 });
 test('M10 purchases require Rank/prerequisites/both currencies/settledResult; no automatic equip',()=>{
  const s=freshSave();s.bank=10000;s.catalystBalance=100;s.levels.crushPower=2;
  assert.equal(buyUpgrade(s,'weakpointScanner','RESULT'),false);s.discoveryRank=1;
  assert.equal(buyUpgrade(s,'weakpointScanner','TITLE'),false);s.catalystBalance=0;assert.equal(buyUpgrade(s,'weakpointScanner','RESULT'),false);
  s.catalystBalance=100;assert.equal(buyUpgrade(s,'weakpointScanner','RESULT'),true);assert.equal(s.bank,9700);assert.equal(s.catalystBalance,99);
  assert.equal(buyUpgrade(s,'weakpointScanner','RESULT'),true);assert.equal(s.bank,9220);assert.equal(s.catalystBalance,97);assert.equal(buyUpgrade(s,'weakpointScanner','RESULT'),false);
  s.discoveryRank=4;s.levels.impactPulse=1;assert.equal(buyUpgrade(s,'chainStarter','RESULT'),true);assert.deepEqual(s.signatureLoadout,[]);
 });
 test('M10 Signature3 and Evolution2 slots distinguish ownership; frozen combat snapshot; state locks',()=>{
  const s=freshSave();s.discoveryRank=4;s.bank=100000;s.catalystBalance=1000;for(const[id,u]of Object.entries(C.upgrades))s.levels[id]=u.max;
  for(const id of SIGNATURE_IDS.slice(0,3))assert.equal(toggleSignature(s,id,'TITLE'),true);
  assert.equal(toggleSignature(s,SIGNATURE_IDS[3],'TITLE'),false);assert.equal(toggleSignature(s,SIGNATURE_IDS[0],'PLAYING'),false);
  assert.equal(craftEvolution(s,'direct','focusStrike','TITLE'),false);assert.equal(craftEvolution(s,'direct','focusStrike','RESULT'),true);assert.deepEqual(s.evolutionActive,[]);
  const bank=s.bank;assert.equal(craftEvolution(s,'direct','focusStrike','RESULT'),false);assert.equal(s.bank,bank);
  for(const [family,form]of [['direct','focusStrike'],['shard','ricochet'],['gravity','pull']]){if(family!=='direct')assert.equal(craftEvolution(s,family,form,'RESULT'),true);assert.equal(activateEvolution(s,family,form,'TITLE'),family!=='gravity');}
  const g=arena(s.levels,{signatureLoadout:s.signatureLoadout,evolutionOwned:s.evolutionOwned,evolutionActive:s.evolutionActive});
  s.signatureLoadout=[];s.evolutionActive[0].form='armorBypass';assert.equal(g.signatureLoadout.length,3);assert.equal(g.evolutionActive[0].form,'focusStrike');assert.ok(Object.isFrozen(g.signatureLoadout)&&Object.isFrozen(g.evolutionActive[0])&&Object.isFrozen(g.levels));
  assert.equal(applyBuildPreset(s,'Reactor','TITLE'),true);assert.ok(s.evolutionActive.every(r=>s.evolutionOwned[r.family].includes(r.form)));
 });

 const cases={
  weakpointScanner:()=>{const g=arena({weakpointScanner:2}),s=add(g,'star');s.hp=4;hit(g,s,1);assert.equal(s.hp,1);hit(g,s,1);return g;},
  armorShatter:()=>{const g=arena({armorShatter:2}),s=add(g,'star');s.secondaryTrait='reinforced';hit(g,s,3);assert.equal(s.hp,C.shapes.star.hp-4);return g;},
  markedTarget:()=>{const g=arena({markedTarget:2}),s=add(g,'star');hit(g,s,1);waveHit(g,s);advance(g,.1);assert.equal(s.hp,C.shapes.star.hp-4);return g;},
  chainStarter:()=>{const g=arena({chainStarter:1});hit(g,add(g,'triangle'),3);advance(g,.04);assert.equal(g.shardsEmitted,4);return g;},
  executionPulse:()=>{const g=arena({executionPulse:2});hit(g,add(g,'conductor'),6);advance(g,.05);assert.ok(g.waves.some(w=>w.sourceKind==='executionPulse'&&w.maxRadius===75));return g;},
  piercingShard:()=>{const g=arena({piercingShard:1});const a=add(g,'square',350),b=add(g,'square',410);g.emitShard(280,270,0,'triangle',g.newChain(),0);advance(g,.18);assert.equal(a.hp,1);assert.equal(b.hp,1);return g;},
  angularSplit:()=>{const g=arena({angularSplit:2}),s=add(g,'triangle',350);g.emitShard(280,270,0,'triangle',g.newChain(),0);advance(g,.13);assert.ok(s.destroyed);return g;},
  mirrorReturn:()=>{const g=arena({mirrorReturn:2});add(g,'mirror',350,250);const t=add(g,'triangle',420,310);t.hp=1;g.emitShard(250,250,0,'triangle',g.newChain(),0);advance(g,.3);assert.equal(t.destroyed,true);return g;},
  ricochetBloom:()=>{const g=arena({ricochetBloom:1});g.emitShard(C.arena.right-10,270,0,'triangle',g.newChain(),0);advance(g,.05);return g;},
  portalMomentum:()=>{const g=arena({portalMomentum:2}),p=g.emitShard(C.arena.right-10,270,0,'triangle',g.newChain(),0);const range=p.range;advance(g,.03);assert.equal(p.range,range+50);return g;},
  fuseAccelerator:()=>{const g=arena({fuseAccelerator:2}),f=add(g,'fuseBomb');hit(g,f,1);assert.ok(Math.abs(f.fuseAt-.5)<1e-9);advance(g,.51);assert.equal(g.ecologyCounts.fuseExploded,1);return g;},
  conductiveSurge:()=>{const g=arena({conductiveSurge:2}),a=add(g,'star',550),s=add(g,'conductor');hit(g,s,6);advance(g,.05);assert.equal(a.hp,C.shapes.star.hp-3);return g;},
  delayedEcho:()=>{const g=arena({delayedEcho:1});hit(g,add(g,'square'),4);advance(g,.17);assert.ok(g.waves.some(w=>w.sourceKind==='delayedEcho'));return g;},
  resonanceBurst:()=>{const g=arena({resonanceBurst:2}),s=add(g,'star'),chain=g.newChain();waveHit(g,s,chain);advance(g,.1);waveHit(g,s,chain,'star');advance(g,.15);return g;},
  chainOverdrive:()=>{const g=arena({chainOverdrive:1}),chain=g.newChain();for(let i=0;i<15;i++)hit(g,add(g,'triangle'),3,'direct',chain);advance(g,.04);return g;},
  gravityBreak:()=>{const g=arena({gravityBreak:2});hit(g,add(g,'gravityWell'),10);advance(g,.04);assert.equal(g.shardsEmitted,2);return g;},
  portalCalibration:()=>{const g=arena({portalCalibration:1});const m=add(g,'mirror',350,250);add(g,'triangle',400,270);const high=add(g,'star',420,310);g.emitShard(250,250,0,'triangle',g.newChain(),0);advance(g,.13);assert.equal(m.reflections,1);assert.ok(g.shards[0]?.angle>0);assert.equal(high.hp,C.shapes.star.hp);return g;},
  phaseDisruptor:()=>{const g=arena({phaseDisruptor:2},{options:{motionEnabled:true}}),s=add(g,'star');s.motion.rotationRate=.3;s.motion.ampX=1;hit(g,s,1);assert.equal(s.motionSlowFactor,.35);advance(g,.4);assert.ok(Math.abs(s.angle-.3*.4*.65)<1e-6);return g;},
  magneticPolarity:()=>{const g=arena({magneticPolarity:1});hit(g,add(g,'gravityWell'),10);advance(g,.04);assert.ok(g.waves.some(w=>w.sourceKind==='magneticPolarity'));return g;},
  targetIntercept:()=>{const g=arena({targetIntercept:2},{options:{motionEnabled:true}}),s=add(g,'fuseBomb');s.motion.rotationRate=.3;hit(g,s,1);assert.equal(s.hp,3);return g;},
  rareHarvest:()=>{const g=arena({rareHarvest:2}),s=add(g,'triangle');s.oreGrade='prism';hit(g,s,3);assert.equal(g.expansionRareRaw,20);return g;},
  catalystExtraction:()=>{const g=arena({catalystExtraction:2,crushPower:5}),r=add(g,'reactor');r.oreGrade='common';hit(g,r,4,'triangle');for(let i=0;i<9;i++){const a=i*Math.PI*2/9,t=add(g,'triangle',450+55*Math.cos(a),270+55*Math.sin(a));t.hp=1;t.oreGrade='common';}assert.equal(g.attack(r.x,r.y),true);assert.equal(g.pendingCatalyst,0);advance(g,.5);assert.equal(g.expansionCounts.catalystExtraction,1);return g;},
  precisionSalvage:()=>{const g=arena({precisionSalvage:2});hit(g,add(g,'fuseBomb'),6);assert.equal(g.expansionSalvageRaw,30);return g;},
  contractScanner:()=>{const id=Object.keys(C.contracts).find(id=>C.contracts[id].counter==='directKills'),g=arena({contractScanner:1},{activeContracts:[{id,stage:1,progress:0,maxCompletedStage:0}]});hit(g,add(g,'triangle'),3);hit(g,add(g,'triangle'),3);assert.equal(g.scannerPaid.size,1);assert.equal(g.rawSkillBonus,25);return g;},
  refineryCalibration:()=>{const g=arena({refineryCalibration:2},{duration:20});g.runEarned=10000;g.update(20);assert.equal(g.calibrationPhoton,Math.min(40,Math.floor(g.refinery.payout*.06+1e-9)));return g;},
  splitterMastery:()=>{const g=arena({splitterMastery:2});hit(g,g.addShape('triangle',450,270,0,false,0,'normal',{echo:true}),1);advance(g,.04);assert.equal(g.shardsEmitted,1);assert.equal(g.runEarned,0);return g;},
  fuseSymphony:()=>{const g=arena({fuseSymphony:1}),chain=g.newChain();hit(g,add(g,'fuseBomb',300),6,'direct',chain);hit(g,add(g,'fuseBomb',600),6,'direct',chain);advance(g,.13);return g;},
  shieldInversion:()=>{const g=arena({shieldInversion:2});add(g,'square',510);hit(g,add(g,'hex'),99);advance(g,.2);return g;},
  ancientBreaker:()=>{const g=arena({ancientBreaker:2}),s=add(g,'ancient');s.hp=23;hit(g,s,2);assert.equal(s.hp,19);return g;},
  prismaticCascade:()=>{const g=arena({prismaticCascade:1});add(g,'mirror',350,250);const t=add(g,'triangle',420,310);t.hp=1;g.emitShard(250,250,0,'triangle',g.newChain(),0);advance(g,.3);assert.equal(t.destroyed,true);return g;}
 };
 for(const[id,exercise]of Object.entries(cases))test(`M10 actual ability: ${id}`,()=>{
  const g=exercise();assert.ok(g.expansionExecuted[id]>=1,`${id} never actually executed`);
  assert.ok(g.peakShards<=150&&g.peakWaves<=64&&g.peakScheduled<=1024);assert.ok(g.physicsChecks.maxProjectileContactError<.002);
 });
 test('M10 owning every Signature without activation has zero combat or reward effect',()=>{
  const owned=Object.fromEntries(SIGNATURE_IDS.map(id=>[id,1]));
  for(const seed of [31415,1,7,42,99]) {
   const a=arena(owned,{seed,signatureLoadout:[]}),b=arena({}, {seed});
   for(const g of [a,b]){const s=add(g,'square',350);add(g,'triangle',410);hit(g,s,4);advance(g,.4);}
   assert.deepEqual([a.totalDestroyed,a.runEarned,a.shardsEmitted,a.waveContacts],[b.totalDestroyed,b.runEarned,b.shardsEmitted,b.waveContacts]);assert.deepEqual(a.expansionExecuted,{});
  }
 });
 test('M10 Double penetration + Coil never hits one target twice and respects range penalties',()=>{
  const g=arena({piercingShard:1,shardRange:2},{relicLoadout:['ricochetCoil'],evolutionOwned:{shard:['piercing']},evolutionActive:[{family:'shard',form:'piercing'}]});
  const targets=[330,380,420].map(x=>add(g,'square',x));const p=g.emitShard(250,270,0,'triangle',g.newChain(),0);
  assert.ok(Math.abs(p.range-((C.shard.range+100)*.7-35))<1e-9);advance(g,.3);
  assert.deepEqual(targets.map(t=>t.hp),[1,1,1]);assert.equal(p.hitIds.size,3);assert.ok(p.distance<=p.range+1e-7);
 });
 test('M10 perRun/perChain caps, 0-second deadline, and Echo never creates economic/Contract credit',()=>{
  const g=arena({chainStarter:1,precisionSalvage:2,rareHarvest:2,executionPulse:2}),chain=g.newChain();
  for(let i=0;i<20;i++){const s=add(g,'conductor');s.oreGrade='prism';hit(g,s,99,'direct',chain);}
  advance(g,.1);assert.equal(g.expansionCounts.chainStarter,3);assert.equal(g.expansionCounts.executionPulse,3);assert.equal(g.expansionRareRaw,400);assert.equal(g.expansionSalvageRaw,150);
  const late=arena({executionPulse:2},{duration:.02});hit(late,add(late,'conductor'),6);late.update(.1);assert.equal(late.expansionExecuted.executionPulse,undefined);
 });
 test('M10 Calibration is frozen separately from Refinery/Anomaly, refresh grants exact once',()=>{
  const g=arena({refineryCalibration:2},{duration:20,anomalyId:'fastOrbit'}),save=freshSave();save.sandbox=true;g.runEarned=10000;g.update(20);
  stageSettlement(save,g);const p=structuredClone(save.pendingSettlement);assert.equal(p.payoutBreakdown.calibrationPhoton,g.calibrationPhoton);
  const loaded=loadSave({getItem:()=>JSON.stringify({...save,sandbox:undefined})});
  assert.equal(completeSettlement(loaded),true);assert.equal(loaded.bank,p.payout);assert.equal(completeSettlement(loaded),false);
  assert.deepEqual(g.refinery.tokens,p.record.refinery.tokens);assert.equal(g.refinery.payout,p.payoutBreakdown.refineryPhoton);
 });
 test('M10 approved A: real direct-origin Reactor Chain qualifies later, perRun1/2 and pending once',()=>{
  for(const lv of [1,2]) {
   const g=arena({catalystExtraction:lv,crushPower:5});
   for(let attempt=0;attempt<3;attempt++) {
    const reactor=add(g,'reactor');reactor.oreGrade='common';hit(g,reactor,4,'triangle');
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9,t=add(g,'triangle',450+55*Math.cos(a),270+55*Math.sin(a));t.hp=1;t.oreGrade='common';}
    const before=g.pendingCatalyst;assert.equal(g.attack(reactor.x,reactor.y),true);assert.equal(g.pendingCatalyst,before);
    advance(g,.5);assert.equal(g.pendingCatalyst,Math.min(lv,attempt+1));
   }
   assert.equal(g.expansionExecuted.catalystExtraction,lv);
   g.update(20);const save=freshSave();save.sandbox=true;assert.equal(stageSettlement(save,g),true);assert.equal(save.catalystBalance,0);
   assert.equal(completeSettlement(save),true);assert.equal(save.catalystBalance,lv);assert.equal(completeSettlement(save),false);assert.equal(save.catalystBalance,lv);
  }
 });
 test('M10 approved A rejects unrelated Chain10, Echo kills, non-direct root and late effects',()=>{
  const g=arena({catalystExtraction:2,crushPower:5}),unrelated=g.newChain();
  for(let i=0;i<10;i++){const s=add(g,'triangle',200);s.oreGrade='common';hit(g,s,3,'triangle',unrelated);}
  const hex=add(g,'hex');hex.oreGrade='common';g.attack(hex.x,hex.y);
  const [id,chain]=[...g.chains].find(([,c])=>c.extractionOrigin===hex.id);assert.equal(chain.rewardedKills,1);assert.equal(g.pendingCatalyst,0);
  for(let i=0;i<20;i++)hit(g,g.addShape('triangle',700,300,0,false,0,'normal',{echo:true}),1,'triangle',id);
  assert.equal(chain.rewardedKills,1);assert.equal(g.pendingCatalyst,0);
  const nonDirect=add(g,'reactor',800);nonDirect.oreGrade='common';hit(g,nonDirect,99,'triangle',unrelated);assert.equal(g.pendingCatalyst,0);
  g.skipAhead(20);assert.equal(g.pendingCatalyst,0);assert.equal(g.expansionExecuted.catalystExtraction,undefined);
 });
 test('M10 native effects after a skill kill retain Relic synergy; Relic-origin recursion remains blocked',()=>{
  for(const blocked of [false,true]) {
   const g=arena({chainStarter:1},{relicLoadout:['waveCondenser']}),target=add(g,'square',495);target.hp=1;
   hit(g,add(g,'triangle',450),3,'direct',g.newChain(),{noRelicProc:blocked});advance(g,.15);
   assert.equal(target.destroyed,true);
   assert.equal(g.relicActivations.waveCondenser||0,blocked?0:1);
  }
 });
 test('M10 Ancient Breaker applies each crossed threshold once, armor bonuses cannot rearm',()=>{
  const g=arena({ancientBreaker:2,armorShatter:2}),ancient=add(g,'ancient');
  hit(g,ancient,22);assert.equal(ancient.hp,2);assert.equal(g.expansionExecuted.ancientBreaker,3);assert.equal(ancient.breakerStages.size,3);
  const s=add(g,'star',700);s.secondaryTrait='reinforced';hit(g,s,1);const before=s.hp;hit(g,s,1);assert.equal(s.hp,before-1);assert.equal(g.expansionExecuted.armorShatter,1);
 });
 test('M10 schema1..7 retains old assets and pending, only malformed new selection fields normalize',()=>{
  for(let version=1;version<=7;version++){
   const save=freshSave();save.saveVersion=version;save.bank=123456;save.catalystBalance=33;save.levels.crushPower=2;save.levels.extraTime=1;save.lifetimeDestroyed=8000;save.discoveryRank=4;
   save.signatureLoadout=['unknown','chainStarter','chainStarter'];save.levels.chainStarter=1;save.evolutionOwned={direct:['focusStrike','unknown']};save.evolutionActive=[{family:'direct',form:'focusStrike'},{family:'direct',form:'focusStrike'}];
   const loaded=loadSave({getItem:()=>JSON.stringify(save)});assert.equal(loaded.saveVersion,7);assert.equal(loaded.bank,123456);assert.equal(loaded.levels.crushPower,2);assert.equal(loaded.levels.extraTime,1);
   if(version>=3)assert.equal(loaded.catalystBalance,33);
   assert.deepEqual(loaded.signatureLoadout,version>=7?['chainStarter']:[]);assert.equal(loaded.evolutionActive.length,version>=7?1:0);
  }
 });
 const evolved=(family,form,levels={},extra={})=>arena(levels,{evolutionOwned:{[family]:[form]},evolutionActive:[{family,form}],...extra});
 const forms={
  armorBypass:()=>{const g=evolved('direct','armorBypass'),s=add(g,'star');s.secondaryTrait='reinforced';hit(g,s,3);assert.equal(s.hp,C.shapes.star.hp-4);return g;},
  markDetonator:()=>{const g=evolved('direct','markDetonator',{markedTarget:1}),s=add(g,'star');hit(g,s,1);waveHit(g,s);advance(g,.2);assert.ok(g.waves.some(w=>w.sourceKind==='evolution:markDetonator'));return g;},
  focusStrike:()=>{const g=evolved('direct','focusStrike'),s=add(g,'star');assert.equal(g.stats.directDamage,5);assert.ok(Math.abs(g.stats.attackInterval-.24)<1e-9);g.attack(s.x,s.y);assert.equal(s.hp,C.shapes.star.hp-5);return g;},
  piercing:()=>{const g=evolved('shard','piercing'),a=add(g,'square',350),b=add(g,'square',410),p=g.emitShard(280,270,0,'triangle',g.newChain(),0);assert.equal(p.range,145);advance(g,.2);assert.equal(a.hp,1);assert.equal(b.hp,1);return g;},
  ricochet:()=>{const g=evolved('shard','ricochet'),p=g.emitShard(C.arena.right-10,270,0,'triangle',g.newChain(),0);advance(g,.04);assert.equal(p.range,230);return g;},
  scatter:()=>{const g=evolved('shard','scatter');add(g,'triangle',350);g.emitShard(280,270,0,'triangle',g.newChain(),0);advance(g,.15);return g;},
  wide:()=>{const g=evolved('shockwave','wide'),s=add(g,'square',300),t=add(g,'star',300+g.stats.squareRadius+30);hit(g,s,4);advance(g,.3);assert.equal(t.hp,C.shapes.star.hp-Math.max(1,g.stats.squareDamage-1));return g;},
  focused:()=>{const g=evolved('shockwave','focused'),s=add(g,'square',300),t=add(g,'star',350);hit(g,s,4);advance(g,.2);assert.equal(t.hp,C.shapes.star.hp-g.stats.squareDamage-1);return g;},
  echo:()=>{const g=evolved('shockwave','echo'),s=add(g,'square',300),t=add(g,'triangle',350);t.hp=1;hit(g,s,4);advance(g,.25);return g;},
  quick:()=>{const g=evolved('reactor','quick'),r=add(g,'reactor');hit(g,r,7);assert.ok(Math.abs(g.stageEvents[0].scheduledAt-Math.max(.01,C.specialEffects.reactor[0].delay-.02))<1e-9);advance(g,.05);assert.ok(g.waves.some(w=>w.sourceKind==='reactor'&&w.damage===Math.max(1,C.specialEffects.reactor[0].damage-1)));return g;},
  delayed:()=>{const g=evolved('reactor','delayed'),r=add(g,'reactor');hit(g,r,7);assert.ok(Math.abs(g.stageEvents[0].scheduledAt-(C.specialEffects.reactor[0].delay+.12))<1e-9);advance(g,.3);assert.ok(g.waves.some(w=>w.sourceKind==='reactor'&&w.damage===C.specialEffects.reactor[0].damage+2));return g;},
  charge:()=>{const g=evolved('reactor','charge');hit(g,add(g,'reactor'),12);advance(g,.3);return g;},
  pull:()=>{const g=evolved('gravity','pull');add(g,'gravityWell',350,300);const p=g.emitShard(240,250,0,'triangle',g.newChain(),0);assert.equal(p.range,150);advance(g,.2);assert.ok(p.gravityTurn>0&&p.gravityTurn<=45*Math.PI/180+1e-9);return g;},
  push:()=>{const g=evolved('gravity','push');hit(g,add(g,'gravityWell'),10);advance(g,.04);assert.ok(g.waves.some(w=>w.sourceKind==='evolution:push'&&w.maxRadius===70));return g;},
  orbit:()=>{const g=evolved('gravity','orbit');add(g,'gravityWell',350,300);const p=g.emitShard(240,250,0,'triangle',g.newChain(),0);advance(g,.2);assert.ok(p.orbitTurn>0&&p.orbitTurn<=30*Math.PI/180+1e-9);assert.ok(g.physicsChecks.maxProjectileContactError<.002);return g;}
 };
 for(const[id,exercise]of Object.entries(forms))test(`M10 actual Evolution form: ${id}`,()=>{
  const g=exercise();assert.ok(g.expansionExecuted[`evolution:${id}`]>=1,`${id} did not execute`);
 });
}
