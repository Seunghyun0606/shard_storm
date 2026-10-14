import test from 'node:test';import assert from 'node:assert/strict';
import {Game}from'../game.js';import {CONFIG as C}from'../config.js';
import {ECOLOGY_SHAPES,TRAITS,FORMATIONS}from'../ecology-defs.js';
import {ecologyType,ecologyFormation,rollTrait,safePoint}from'../ecology.js';
import {freshSave,loadSave,writeSave}from'../storage.js';
import {stageSettlement,completeSettlement}from'../progression.js';
import {battle}from'./m7-m8-simulation.js';
function arena(args={}){const g=new Game({ecologyEnabled:true,sandbox:true,options:{motionEnabled:false},...args});g.shapes=[];g.shards=[];g.queue=[];g.spawnClock=-Infinity;return g;}
function damage(g,s,n,source='direct',chainId=g.newChain()){g.enqueue(s,n,{source,chainId,depth:0});g.flush();return chainId;}
const advance=(g,t)=>{while(t>1e-9){const step=Math.min(t,C.step);g.update(step);t-=step;}};
test('M9 exact six definitions/rank AND tier/total seven cap and deterministic introductions',()=>{
 assert.equal(Object.keys(C.shapes).length,13);assert.equal(Object.keys(ECOLOGY_SHAPES).length,6);assert.equal(Object.keys(TRAITS).length,4);
 for(const [id,d]of Object.entries(ECOLOGY_SHAPES)){
  const g=arena({discoveryRank:d.rank});g.introSeen=Object.fromEntries(Object.keys(ECOLOGY_SHAPES).filter(k=>k!==id).map(k=>[k,true]));g.highestTier=d.tier-1;assert.equal(ecologyType(g),null);
  g.highestTier=d.tier;assert.equal(ecologyType(g),id);for(let i=0;i<d.cap;i++)g.addShape(id,100+i*75,200,0,false,0);assert.notEqual(ecologyType(g),id);
 }
});
test('M9 Splitter creates exactly2 safe Echo; zero economic/persistent/contract farm',()=>{
 const g=arena({discoveryRank:4}),s=g.addShape('splitter',450,290,0,false,0);const chain=damage(g,s,5);const paid=g.runEarned;
 advance(g,.07);const children=g.alive.filter(s=>s.echo);assert.equal(children.length,2);assert.ok(children.every(s=>s.hp===1&&s.radius===16&&s.oreGrade==='common'&&s.bonus===0));
 advance(g,.16);for(const child of children)damage(g,child,1,'triangle',chain);
 assert.equal(g.totalDestroyed,1);assert.equal(g.runEarned,paid);assert.equal(g.echoKills,2);assert.equal(g.metaCounters.primaryShardKills,0);assert.equal(g.oreKills.common,1);assert.equal(g.chains.get(chain)?.kills,3);assert.equal(g.alive.length,0);assert.equal(g.pendingCatalyst,g.rewardLog.filter(r=>r.kind==='catalyst').reduce((a,r)=>a+r.amount,0));
});
test('M9 Echo live6/Run20 limits and unsafe births abandon without overlap',()=>{
 const g=arena();for(let i=0;i<4;i++){const s=g.addShape('splitter',150+i*180,260,0,false,0);damage(g,s,10);}advance(g,.07);assert.ok(g.echoSpawned<=6);
 g.shapes=[];g.echoSpawned=19;damage(g,g.addShape('splitter',450,290,0,false,0),5);advance(g,.07);assert.equal(g.echoSpawned,20);
 damage(g,g.addShape('splitter',700,290,0,false,0),5);advance(g,.07);assert.equal(g.echoSpawned,20);
 assert.equal(safePoint(g,C.arena.left,100,16),false);
});
test('M9 Fuse arms on positive actual only, expires .70, early death .08 once, deadline zero',()=>{
 const g=arena(),f=g.addShape('fuseBomb',350,250,0,false,0),t=g.addShape('square',430,250,0,false,0);
 f.secondaryTrait='reinforced';damage(g,f,1);assert.equal(f.fuseArmed,undefined);damage(g,f,1);assert.equal(f.fuseArmed,true);advance(g,.69);assert.equal(g.ecologyEvents.filter(e=>e.kind==='fuseExploded').length,0);advance(g,.03);assert.equal(g.ecologyEvents.filter(e=>e.kind==='fuseExploded').length,1);advance(g,.13);assert.ok(t.hp<=2);
 damage(g,f,99);advance(g,.15);assert.equal(g.ecologyEvents.filter(e=>e.kind==='fuseExploded').length,1);
 const early=arena();damage(early,early.addShape('fuseBomb',300,250,0,false,0),6);advance(early,.09);assert.equal(early.ecologyEvents.filter(e=>e.kind==='fuseExploded').length,1);advance(early,1);assert.equal(early.ecologyEvents.filter(e=>e.kind==='fuseExploded').length,1);
 const late=arena({duration:.05});damage(late,late.addShape('fuseBomb',300,250,0,false,0),6);advance(late,.2);assert.equal(late.ecologyEvents.filter(e=>e.kind==='fuseExploded').length,0);
});
test('M9 Conductor current original link targets receive actual delayed2 once, Chain4 nodes cap',()=>{
 const g=arena(),a=g.addShape('square',430,210,0,false,0),b=g.addShape('square',430,290,0,false,0),c=g.addShape('conductor',350,250,0,false,0);assert.equal(c.linkIds.length,2);
 damage(g,c,6);advance(g,.05);assert.equal(a.hp,2);assert.equal(b.hp,2);assert.equal(g.ecologyEvents.filter(e=>e.kind==='conductorDelivered').length,2);
 const chain=g.newChain();g.chains.get(chain).conductorCount=4;damage(g,g.addShape('conductor',350,250,0,false,0),6,'direct',chain);advance(g,.05);assert.equal(a.hp,2);assert.equal(b.hp,2);
});
test('M9 actual Mirror collision damages and redirects same main ID, auxiliary cannot reflect',()=>{
 const g=arena(),m=g.addShape('mirror',350,250,0,false,0);g.addShape('square',420,310,0,false,0);const p=g.emitShard(250,250,0,'triangle',g.newChain(),0);p.bounces=0;advance(g,.15);
 assert.equal(m.hp,5);assert.equal(m.reflections,1);assert.equal(p.reflectionKind,'mirror');assert.ok(p.angle>0&&p.angle<=70*Math.PI/180);assert.equal(g.physicsChecks.maxProjectileContactError,0);assert.ok(p.hitIds.has(m.id));
 const h=arena(),mirror=h.addShape('mirror',350,250,0,false,0);h.addShape('square',420,310,0,false,0);h.emitShard(250,250,0,'inherited',h.newChain(),0,true);advance(h,.15);assert.equal(mirror.reflections,undefined);
});
test('M9 Gravity uses swept short segments with <=6deg/tick <=30deg total and preserves distance',()=>{
 const g=arena();g.addShape('gravityWell',350,300,0,false,0);const target=g.addShape('triangle',410,278,0,false,0),p=g.emitShard(240,250,0,'triangle',g.newChain(),0);p.range=400;p.life=.6;advance(g,.3);
 const turns=g.ecologyEvents.filter(e=>e.kind==='gravityBend');assert.ok(turns.length);assert.ok(turns.every(e=>Math.abs(e.angle)<=6*Math.PI/180+1e-9));assert.ok(p.gravityTurn<=30*Math.PI/180+1e-9);assert.ok(p.distance<=p.range);assert.ok(g.physicsChecks.maxProjectileContactError<.002);assert.ok(target.destroyed||p.angle!==0);
});
test('M9 Repair heals damaged ordinary HP at .85, target cap2, pause/death stop, maxHP never exceeded',()=>{
 const g=arena(),s=g.addShape('star',430,250,0,false,0),n=g.addShape('repairNode',350,250,0,false,0);s.hp=5;advance(g,.84);assert.equal(s.hp,5);advance(g,.04);assert.equal(s.hp,6);advance(g,.9);assert.equal(s.hp,7);advance(g,1);assert.equal(s.hp,7);s.hp=3;g.paused=true;advance(g,1);assert.equal(s.hp,3);g.paused=false;damage(g,n,9);advance(g,1);assert.equal(s.hp,3);
});
test('M9 traits armor/volatile/reflective/hollow real damage plus incompatible roll fallback',()=>{
 for(const [trait,expected]of [['reinforced',2],['hollow',2]]){const g=arena(),s=g.addShape('square',350,250,0,false,0);s.secondaryTrait=trait;damage(g,s,3);assert.equal(s.hp,4-expected);}
 const g=arena(),h=g.addShape('square',350,250,0,false,0);h.secondaryTrait='hollow';damage(g,h,2,'triangle');assert.equal(h.hp,2,'non-shard source alone not enough');
 const v=g.addShape('square',500,250,0,false,0);v.secondaryTrait='volatile';damage(g,v,4);advance(g,.06);assert.ok(g.waves.some(w=>w.sourceKind==='volatile'&&w.maxRadius===70));
 const e=arena({discoveryRank:4});e.traitRng=()=>.01;const s=e.addShape('hex',300,250,0,false,0);assert.equal(s.secondaryTrait,null);e.traitRng=()=>.06;assert.equal(rollTrait(e,{type:'mirror'}),null);e.options.secondaryTraitsEnabled=false;assert.equal(rollTrait(e,{type:'triangle'}),null);
});
test('M9 formation4 plans gated anchors, safe fallback and persistent intro atomic once',()=>{
 for(const [i,id]of FORMATIONS.entries()){const g=arena({discoveryRank:4});const anchor=g.addShape(i===2?'hex':i===3?'fuseBomb':'gravityWell',450,300,0,false,0);g.introFormationQueue=[];let rolls=[0,(i+.1)/4,0];g.ecologyPatternRng=()=>rolls.shift()??0;const plan=ecologyFormation(g);assert.equal(plan.kind,id);assert.ok(plan.points.length>=4&&plan.points.length<=6);assert.equal(plan.anchor,anchor);}
 const live=freshSave(),g=arena();live.sandbox=true;g.addShape('splitter',300,250,0,false,0);g.update(20);assert.equal(live.shapeIntroSeen.splitter,undefined);stageSettlement(live,g);assert.equal(live.shapeIntroSeen.splitter,undefined);assert.equal(completeSettlement(live),true);assert.equal(live.shapeIntroSeen.splitter,true);assert.equal(completeSettlement(live),false);
 const loaded=loadSave({getItem:()=>JSON.stringify({...live,bank:999,saveVersion:5})});assert.equal(loaded.bank,999);assert.equal(loaded.shapeIntroSeen.splitter,true);assert.equal(writeSave({setItem:()=>{throw Error();}},loaded),false);
});
test('M9 feature OFF remains M8 seeded golden and feature ON cosmetic parity',()=>{
 const golden=battle({seed:31415,duration:20});assert.equal(golden.totalDestroyed,164);assert.equal(golden.refinery.payout,163);
 for(const seed of [31415,1,7,42,99]){const args={seed,ecologyEnabled:true,discoveryRank:4,levels:Object.fromEntries(Object.entries(C.upgrades).map(([k,u])=>[k,u.max])),duration:20};const a=battle(args),b=battle({...args,options:{combatFXEnabled:false,modifierVisuals:false,reducedMotionEnabled:true}});for(const k of ['runEarned','totalDestroyed','pendingCatalyst','ecologyEvents','metaResult'])assert.deepEqual(a[k],b[k]);}
});
test('M9 Hollow main shard +1 and Reflective actual15deg once, incompatible/none boundaries',()=>{
 const g=arena(),s=g.addShape('square',350,250,0,false,0);s.secondaryTrait='hollow';g.emitShard(250,250,0,'triangle',g.newChain(),0);advance(g,.15);assert.equal(s.destroyed,true);assert.equal(g.rawHP,4);
 const r=arena(),m=r.addShape('square',350,250,0,false,0);m.secondaryTrait='reflective';r.addShape('square',420,310,0,false,0);const p=r.emitShard(250,250,0,'triangle',r.newChain(),0);advance(r,.13);assert.equal(m.hp,1);assert.equal(m.reflections,1);assert.ok(Math.abs(p.angle-15*Math.PI/180)<1e-9);assert.equal(p.reflectionKind,'trait');
 const probability=arena({discoveryRank:4}),normal={type:'triangle'};
 for(const[roll,expected]of [[0,'reinforced'],[.025,'volatile'],[.05,'reflective'],[.065,'hollow'],[.08,null]]){probability.traitRng=()=>roll;assert.equal(rollTrait(probability,normal),expected);}
});
test('M9 all four actual formations use safe coordinates and log fallback honestly',()=>{
 for(const[i,kind]of FORMATIONS.entries()){
  const g=arena({discoveryRank:4});g.addShape(i===2?'hex':i===3?'fuseBomb':'gravityWell',450,300,0,false,0);g.introFormationQueue=[];g.experiment.clusterChance=1;
  const rolls=[0,(i+.1)/4,0];g.ecologyPatternRng=()=>rolls.shift()??.9;
  const spawned=[];for(let j=0;j<(kind==='ringFormation'?6:kind==='chainCorridor'?5:4);j++){const s=g.spawn('triangle',0);assert.ok(s);spawned.push(s);}
  assert.ok(spawned.filter(s=>s.spawnPattern===kind).length>=4,kind);
  for(const s of spawned){assert.ok(s.x-s.radius>=C.arena.left&&s.x+s.radius<=C.arena.right);for(const t of g.alive.filter(t=>t!==s))assert.ok(Math.hypot(s.x-t.x,s.y-t.y)>=s.radius+t.radius+C.spawnGap);}
 }
});
test('M9 equal numeric shape/projectile IDs never exclude Gravity influence',()=>{
 const g=arena(),well=g.addShape('gravityWell',350,300,0,false,0);g.nextShard=well.id;
 const p=g.emitShard(240,250,0,'triangle',g.newChain(),0);assert.equal(p.id,well.id);g.update(C.step);assert.ok(p.gravityTurn>0);
});
test('M9 Fuse to Conductor to native Square is one real causal chain, no duplicate native reward',()=>{
 const g=arena();const square=g.addShape('square',510,250,0,false,0);square.hp=2;
 const final=g.addShape('triangle',580,250,0,false,0);final.hp=2;
 const conductor=g.addShape('conductor',430,250,0,false,0);conductor.hp=2;
 const fuse=g.addShape('fuseBomb',350,250,0,false,0);damage(g,fuse,6);advance(g,.6);
 assert.equal(g.totalDestroyed,4);assert.equal(square.destroyed,true);assert.equal(final.destroyed,true);
 assert.equal(g.ecologyCounts.fuseExploded,1);assert.equal(g.ecologyCounts.conductorDelivered,1);assert.equal(g.metaCounters.nativeWaveKills,1);assert.equal(g.bestChain,4);
});
test('M9 Repair supports Cracked/Enhanced/Hollow ordinary targets but never special nodes',()=>{
 for(const variant of ['cracked','enhanced','hollow']){
  const g=arena(),s=g.addShape('square',430,250,0,variant==='enhanced',0,variant==='cracked'?'cracked':'normal');if(variant==='hollow')s.secondaryTrait='hollow';s.hp=1;
  const special=g.addShape('fuseBomb',350,330,0,false,0);special.hp=1;g.addShape('repairNode',350,250,0,false,0);
  advance(g,1.8);assert.equal(s.hp,3);assert.equal(special.hp,1);assert.ok(s.hp<=s.maxHP);assert.equal(g.repairTotals.get(s.id),2);
 }
});
test('M9 mixed Echo and normal kills cannot farm Contract Chain10 or Anomaly Chain15',()=>{
 const g=arena(),chain=g.newChain();
 for(let i=0;i<9;i++)damage(g,g.addShape('triangle',300,250,0,false,0),1,'triangle',chain); // nonfatal hits do not count
 for(let i=0;i<9;i++)damage(g,g.addShape('triangle',400,250,0,false,0,'normal',{echo:true}),1,'triangle',chain);
 damage(g,g.addShape('triangle',500,250,0,false,0),3,'triangle',chain);
 assert.equal(g.chains.get(chain).kills,10);assert.equal(g.chains.get(chain).rewardedKills,1);assert.equal(g.metaCounters.chain10,0);assert.equal(g.metaCounters.chain15,0);
 for(let i=0;i<9;i++)damage(g,g.addShape('triangle',500,250,0,false,0),3,'triangle',chain);
 assert.equal(g.metaCounters.chain10,1);assert.equal(g.metaCounters.chain15,0);
 for(let i=0;i<5;i++)damage(g,g.addShape('triangle',500,250,0,false,0),3,'triangle',chain);
 assert.equal(g.metaCounters.chain10,1);assert.equal(g.metaCounters.chain15,1);
});
test('M9 first encounters prioritize mechanic-friendly formations before random20percent lottery',()=>{
 for(const[type,kind]of [['splitter','ringFormation'],['fuseBomb','bombGarden'],['conductor','ringFormation'],['mirror','chainCorridor'],['gravityWell','chainCorridor'],['repairNode','ringFormation']]){
  const g=arena({discoveryRank:4}),s=g.addShape(type,450,300,0,false,0);g.ecologyPatternRng=()=>.99;const plan=ecologyFormation(g);assert.equal(plan.kind,kind);assert.equal(plan.anchor,s);assert.equal(g.introFormationQueue.length,0);
 }
});
