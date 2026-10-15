import {ADVANCED_TRAITS} from './advanced-defs.js';
import {codexEvent} from './codex.js';
import { CONFIG as C } from './config.js';
import {level,form,expansionUsed,expansionReflected,expansionFuseExecuted} from './expansion.js';
import { ECOLOGY_SHAPES, TRAITS, FORMATIONS } from './ecology-defs.js';
import { seededRNG } from './entities.js';

export function initEcology(g, enabled, introSeen = {}) {
  g.ecologyEnabled=enabled;g.ecologyRng=seededRNG(g.seed^0xc48b92);g.traitRng=seededRNG(g.seed^0x8832ae);
  g.ecologyPatternRng=seededRNG(g.seed^0x274994);g.introSeen={...introSeen};g.introConsumed=[];
  g.ecologyEvents=[];g.ecologyCounts={};g.nextEcologyEvent=1;g.introFormationQueue=[];g.echoSpawned=0;g.echoKills=0;g.repairTotals=new Map();
}
export function ecologyLog(g,kind,s,cause={},extra={}) {
  g.ecologyCounts[kind]=(g.ecologyCounts[kind]||0)+1;
  codexEvent(g,kind,s,cause,extra);const eventId=g.nextEcologyEvent++;if(g.ecologyEvents.length<2048)g.ecologyEvents.push({eventId,kind,sourceId:s.id,chainId:cause.chainId,at:g.simulationTime,...extra});
}
export const ordinary = s => !C.shapes[s.type].special && !s.echo;
export function near(g,s,radius,predicate=ordinary) {
  return g.alive.filter(t=>t.id!==s.id&&predicate(t)&&Math.hypot(t.x-s.x,t.y-s.y)<=radius)
    .sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y)||a.id-b.id);
}
export function ecologyType(g) {
  if(!g.ecologyEnabled)return null;
  const rolls=Object.keys(ECOLOGY_SHAPES).map(()=>g.ecologyRng());
  if(g.alive.filter(s=>C.shapes[s.type].ecology&&!C.shapes[s.type].advanced).length>=7)return null;
  const eligible=Object.entries(ECOLOGY_SHAPES).filter(([id,d])=>g.discoveryRank>=d.rank&&g.highestTier>=d.tier&&g.alive.filter(s=>s.type===id).length<d.cap);
  const introduction=eligible.find(([id])=>!g.introSeen[id]&&!g.introConsumed.includes(id));
  if(introduction)return introduction[0];
  return eligible.find(([id,d])=>rolls[Object.keys(ECOLOGY_SHAPES).indexOf(id)]<d.chance)?.[0]||null;
}
export function rollTrait(g,s) {
  const roll=g.traitRng();if(!g.ecologyEnabled||!g.options.secondaryTraitsEnabled||!g.options.modifiers||g.initializing||s.echo)return null;
  let cursor=0;
  for(const [id,d]of Object.entries(g.advancedEnabled?{...TRAITS,...ADVANCED_TRAITS}:TRAITS)){
    if(g.discoveryRank<d.rank)continue;cursor+=d.chance;
    if(roll<cursor)return d.exclude.includes(s.type)||(d.excludeEnhanced&&s.enhanced)||(d.excludeCharged&&s.modifier==='charged')?null:id;
  }
  return null;
}
export function ecologySpawn(g,s) {
  s.secondaryTrait=rollTrait(g,s);
  if(!g.ecologyEnabled)return;
  if(C.shapes[s.type].ecology&&!C.shapes[s.type].advanced&&!g.introConsumed.includes(s.type)&&!g.introSeen[s.type]){g.introConsumed.push(s.type);g.introFormationQueue.push(s);ecologyLog(g,'introduction',s,{}, {type:s.type});}
  if(s.type==='conductor')s.linkIds=near(g,s,115+(level(g,'conductiveSurge')>=2?15:0)).slice(0,2).map(t=>t.id);
  if(s.type==='repairNode')s.nextRepair=g.simulationTime+.85;
}
export function traitDamage(g,s,damage,cause) {
  if(damage<=0)return 0;
  if(s.secondaryTrait==='reinforced'&&!s.armorUsed&&damage>0){s.armorUsed=true;damage=Math.max(0,damage-1);ecologyLog(g,'reinforced',s,cause);}
  if(s.secondaryTrait==='hollow'){if(cause.source==='direct')damage=Math.max(1,damage-1);else if(cause.small===false)damage++;}
  return damage;
}
function fuse(g,s,cause,delay) {
  const child={...cause,source:'fuse',originShapeId:s.id,depth:cause.depth+1};
  const version=(s.fuseVersion||0)+1;s.fuseVersion=version;s.fuseAt=g.simulationTime+delay;
  g.scheduleEffect(()=>{if(s.fuseVersion!==version||s.fuseExploded)return;s.fuseExploded=true;
    const origin=g.positionAt(s,g.simulationTime);const wave=g.area(origin,100,2,child,C.shapes.fuseBomb.color,s.id);
    if(wave){ecologyLog(g,'fuseExploded',s,cause,{waveId:wave.id});expansionFuseExecuted(g,s,cause);}
  },child,delay);
}
export function ecologyDamage(g,s,actual,cause) {
  if(!g.ecologyEnabled||actual<=0)return;
  if(cause.source==='conductor')ecologyLog(g,'conductorDelivered',{id:cause.originShapeId},cause,{targetId:s.id,amount:actual});
  if(s.type==='fuseBomb'&&!s.fuseArmed&&!s.fuseExploded){s.fuseArmed=true;const duration=Math.max(.3,.7-.1*level(g,'fuseAccelerator'));fuse(g,s,cause,duration);if(level(g,'fuseAccelerator'))expansionUsed(g,'fuseAccelerator',cause,{targetId:s.id,duration});ecologyLog(g,'fuseArmed',s,cause);}
}
export function safePoint(g,x,y,radius,ignore=null) {
  const A=C.arena,margin=C.motion.maxDrift;
  return x>=A.left+radius+margin&&x<=A.right-radius-margin&&y>=A.top+radius+margin&&y<=A.bottom-radius-margin
    &&g.alive.every(s=>s.id===ignore||Math.hypot((s.anchorX??s.x)-x,(s.anchorY??s.y)-y)>=s.radius+radius+C.spawnGap+margin*2);
}
export function ecologyDeath(g,s,cause) {
  if(!g.ecologyEnabled||s.echo)return;
  const child={...cause,depth:cause.depth+1,originShapeId:s.id};
  if(s.type==='splitter')g.scheduleEffect(()=>{
    for(let i=0;i<2;i++){
      if(g.echoSpawned>=20||g.alive.filter(t=>t.echo).length>=6||g.alive.length>=g.target)break;
      let point=null;for(let a=0;a<16;a++){const angle=s.angle+i*Math.PI+a*Math.PI/8,x=s.x+Math.cos(angle)*65,y=s.y+Math.sin(angle)*65;if(safePoint(g,x,y,16)){point={x,y};break;}}
      if(!point)continue;
      const echo=g.addShape('triangle',point.x,point.y,s.angle,false,C.spawnGrace,'normal',{echo:true});
      if(echo){echo.parentSplitter=s.id;echo.parentChain=cause.chainId;g.echoSpawned++;ecologyLog(g,'echoSpawn',s,cause,{targetId:echo.id});}
    }
  },{...child,source:'splitter'},.06);
  if(s.type==='fuseBomb'&&!s.fuseExploded)fuse(g,s,cause,.08);
  if(s.type==='conductor'){
    const chain=g.chains.get(cause.chainId);if((chain.conductorCount||0)<4){chain.conductorCount=(chain.conductorCount||0)+1;
      const radius=115+(level(g,'conductiveSurge')>=2?15:0);
      const targets=(s.linkIds||[]).map(id=>g.alive.find(t=>t.id===id)).filter(t=>t&&Math.hypot(t.x-s.x,t.y-s.y)<=radius);
      const tagged={...child,source:'conductor'};g.scheduleEffect(()=>{for(const t of targets){if(t.destroyed||Math.hypot(t.x-s.x,t.y-s.y)>radius)continue;g.enqueue(t,2+Number(level(g,'conductiveSurge')>0),tagged);}},tagged,.04);
    }
  }
  if(s.secondaryTrait==='volatile'){
    const tagged={...child,source:'volatile'};g.scheduleEffect(()=>g.area(s,70,1,tagged,'#ff886c',s.id),tagged,.05);
  }
}
export function repairTick(g) {
  if(!g.ecologyEnabled)return;
  for(const node of g.alive.filter(s=>s.type==='repairNode')){
    if(g.simulationTime+1e-9<node.nextRepair)continue;node.nextRepair=g.simulationTime+.85;
    const targets=near(g,node,105).filter(t=>t.hp<t.maxHP&&(g.repairTotals.get(t.id)||0)<2).sort((a,b)=>a.hp/a.maxHP-b.hp/b.maxHP||a.id-b.id).slice(0,2);
    for(const t of targets){t.hp++;g.repairTotals.set(t.id,(g.repairTotals.get(t.id)||0)+1);node.healedHP=(node.healedHP||0)+1;ecologyLog(g,'repair',node,{}, {targetId:t.id,amount:1});}
  }
}
export function bendShards(g,dt) {
  if(!g.ecologyEnabled)return;
  for(const s of g.shards.filter(s=>!s.small&&!s.dead)){
    // Shape IDs and projectile IDs use separate namespaces; equal numbers are unrelated.
    const well=near(g,{x:s.x,y:s.y},145,t=>t.type==='gravityWell')[0];if(!well)continue;
    const target=Math.atan2(well.y-s.y,well.x-s.x),difference=Math.atan2(Math.sin(target-s.angle),Math.cos(target-s.angle));
    const turn=Math.min(Math.abs(difference),6*Math.PI/180*dt/C.step,Math.max(0,(form(g,'gravity','pull')?45:30)*Math.PI/180-(s.gravityTurn||0)))*Math.sign(difference);
    let orbit=0;if(form(g,'gravity','orbit')){if(s.orbitStart===undefined)s.orbitStart=g.simulationTime;if(g.simulationTime<s.orbitStart+.08-1e-9){orbit=Math.min(6*Math.PI/180*dt/C.step,Math.max(0,30*Math.PI/180-(s.orbitTurn||0)))*(Math.sign(difference)||1);s.orbitTurn=(s.orbitTurn||0)+Math.abs(orbit);if(orbit)expansionUsed(g,'evolution:orbit',s,{wellId:well.id,angle:orbit});}}
    if(!turn&&!orbit)continue;s.gravityTurn=(s.gravityTurn||0)+Math.abs(turn);if(turn&&form(g,'gravity','pull'))expansionUsed(g,'evolution:pull',s,{wellId:well.id,angle:turn});s.angle+=turn+orbit;s.vx=Math.cos(s.angle)*C.shard.speed;s.vy=Math.sin(s.angle)*C.shard.speed;s.gravitySource=well.id;
    ecologyLog(g,'gravityBend',well,s,{shardId:s.id,angle:turn});
  }
}
export function reflectContact(g,shard,target) {
  if(!g.ecologyEnabled||shard.small)return false;
  let cap=0,limit;
  if(target.type==='mirror'&&(target.reflections||0)<2){cap=70*Math.PI/180;limit=2;}
  else if(target.secondaryTrait==='reflective'&&!target.reflections){cap=15*Math.PI/180;limit=1;}
  if(!cap)return false;
  const candidates=near(g,target,Infinity,t=>t.id!==target.id&&!shard.hitIds?.has(t.id));if(target.type==='mirror'&&level(g,'portalCalibration'))candidates.sort((a,b)=>b.hp-a.hp||a.id-b.id);const next=candidates[0];if(!next)return false;
  const aim=Math.atan2(next.y-shard.y,next.x-shard.x),difference=Math.atan2(Math.sin(aim-shard.angle),Math.cos(aim-shard.angle));
  const turn=(target.type==='mirror'?Math.min(cap,Math.abs(difference)):cap)*(Math.sign(difference)||1);shard.angle+=turn;
  shard.vx=Math.cos(shard.angle)*C.shard.speed;shard.vy=Math.sin(shard.angle)*C.shard.speed;
  shard.reflectionKind=target.type==='mirror'?'mirror':'trait';shard.reflectionSource=target.id;target.reflections=Math.min(limit,(target.reflections||0)+1);
  ecologyLog(g,'reflection',target,shard,{angle:turn});if(target.type==='mirror'){if(level(g,'portalCalibration'))expansionUsed(g,'portalCalibration',shard,{targetId:next.id,mirrorId:target.id});expansionReflected(g,shard,'mirror');}return true;
}
export function ecologyFormation(g) {
  if(!g.ecologyEnabled)return null;
  while(g.introFormationQueue[0]?.destroyed)g.introFormationQueue.shift();
  const introduced=g.introFormationQueue.shift();
  if(!introduced&&g.ecologyPatternRng()>=.20)return null;
  const kind=introduced?(introduced.type==='fuseBomb'?'bombGarden':['mirror','gravityWell'].includes(introduced.type)?'chainCorridor':'ringFormation'):FORMATIONS[Math.floor(g.ecologyPatternRng()*4)];
  const anchor=introduced||(kind==='shieldFortress'?g.alive.find(s=>s.type==='hex'):kind==='bombGarden'?g.alive.find(s=>s.type==='fuseBomb'):g.alive.find(s=>C.shapes[s.type].ecology));
  if(!anchor)return null;
  const angle=g.ecologyPatternRng()*Math.PI*2,points=[];
  if(kind==='chainCorridor')for(let i=0;i<5;i++)points.push({x:anchor.x+Math.cos(angle)*(80+65*i),y:anchor.y+Math.sin(angle)*(80+65*i)});
  else{const count=kind==='ringFormation'?6:4;for(let i=0;i<count;i++){const a=angle+i*Math.PI*2/count,r=kind==='shieldFortress'?80:95;points.push({x:anchor.x+Math.cos(a)*r,y:anchor.y+Math.sin(a)*r});}}
  return{kind,anchor,index:0,points};
}
