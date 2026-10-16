import {CONFIG as C} from './config.js';
import {ADVANCED_SHAPES} from './advanced-defs.js';
import {seededRNG} from './entities.js';
import {safePoint,near,ordinary} from './ecology.js';
import {level,expansionReflected,expansionUsed} from './expansion.js';
import {initCodex,codexFeat,codexEvent,codexContact,codexDeath} from './codex.js';
export function initAdvanced(g,enabled,intro={},insights=[],eliteHistory={}){
 initCodex(g,Boolean(enabled)&&g.ecologyEnabled);g.advancedRng=seededRNG(g.seed^0x17eab2);g.advancedIntroFlags={...intro};g.advancedIntroConsumed=[];g.advancedCounts={};g.advancedEvents=[];g.portalSequence=1;g.advancedInsight=new Set(insights).size;g.eliteHistory=structuredClone(eliteHistory);g.eliteDelta={};g.eliteSpawned=false;g.eliteAttempted=new Set();g.advancedSpawned={};
}
export function advancedLog(g,kind,s,cause={},extra={}){g.combatObserver?.(kind,{sourceShapeId:s.id,small:cause.small,chainId:cause.chainId,...extra});g.advancedCounts[kind]=(g.advancedCounts[kind]||0)+1;if(g.advancedEvents.length<2048)g.advancedEvents.push({kind,sourceId:s.id,chainId:cause.chainId,attackEventId:cause.attackEventId,at:g.simulationTime,...extra});}
export function advancedType(g){
 if(!g.advancedEnabled)return null;
 const rolls=Object.keys(ADVANCED_SHAPES).map(()=>g.advancedRng());
 const eligible=Object.entries(ADVANCED_SHAPES).filter(([id,d])=>g.discoveryRank>=d.rank&&g.highestTier>=d.tier&&g.alive.filter(s=>s.type===id).length<d.cap);
 const intro=eligible.find(([id])=>!g.advancedIntroFlags[id]&&!g.advancedIntroConsumed.includes(id));
 return intro?.[0]||eligible.find(([id,d])=>rolls[Object.keys(ADVANCED_SHAPES).indexOf(id)]<d.chance)?.[0]||null;
}
export function advancedSpawn(g,s){
 if(!g.advancedEnabled)return;
 s.spawnAt=g.simulationTime;s.phaseOffset=seededRNG(g.seed^Math.imul(s.id,0x78a4e))()*1.4;
 if(ADVANCED_SHAPES[s.type]){g.advancedSpawned[s.type]=(g.advancedSpawned[s.type]||0)+1;if(!s.bossPart&&!g.advancedIntroFlags[s.type]&&!g.advancedIntroConsumed.includes(s.type)){g.advancedIntroConsumed.push(s.type);advancedLog(g,'introduction',s,{}, {type:s.type});}}
 if(s.type==='parasiteLink')s.parasiteIds=near(g,s,100).slice(0,2).map(t=>t.id);
 if(s.type==='shifter'){s.motion.ampX=s.motion.ampY=0;planLeap(g,s,g.simulationTime+1.3);}
}
function planLeap(g,s,at){
 s.nextLeapAt=at;
 // The queue boundary divides swept paths before and after the discontinuity.
 g.scheduleEvent({kind:'effect',sourceKind:'shifter-leap',scheduledTime:at,priority:-1,action:()=>{
  if(s.destroyed||!g.advancedEnabled)return;
  let point=null;for(let i=0;i<16;i++){const angle=g.advancedRng()*Math.PI*2,d=25+g.advancedRng()*10,x=s.x+Math.cos(angle)*d,y=s.y+Math.sin(angle)*d;if(safePoint(g,x,y,s.radius,s.id)){point={x,y};break;}}
  if(point){const old={x:s.x,y:s.y};Object.assign(s,point,{anchorX:point.x,anchorY:point.y,prevX:point.x,prevY:point.y,lastLeapAt:g.simulationTime});Object.assign(s.motion,{anchorX:point.x,anchorY:point.y});advancedLog(g,'shifterLeap',s,{}, {from:old,to:point});}
  else advancedLog(g,'shifterBlocked',s);
  planLeap(g,s,at+1.3);
 }});
}
export function phaseVulnerable(g,s,time=g.simulationTime){const clock=Math.max(0,time-(s.spawnAt||0))+(s.phaseOffset||0),hitClock=Math.max(0,(s.motionSlowAt??-Infinity)-(s.spawnAt||0))+(s.phaseOffset||0),extension=Math.floor(clock/1.4)===Math.floor(hitClock/1.4)?(s.phaseExtension||0):0;return clock%1.4<Math.min(1.39,.9+extension);}
// A fully guarded direct attack has no positive hit for Reinforced to absorb.
// Keep partial shard/wave resistance at the final defense stage as before.
export function advancedDirectGate(g,s,damage,cause){return g.advancedEnabled&&s.type==='phaseCrystal'&&cause.source==='direct'&&!phaseVulnerable(g,s)?0:damage;}
export function advancedDefense(g,s,damage,cause){
 if(!g.advancedEnabled)return damage;
 if(s.type==='phaseCrystal'){s.phaseWasVulnerable=phaseVulnerable(g,s);if(!s.phaseWasVulnerable)damage=cause.source==='direct'?0:Math.min(1,damage);}
 if(s.secondaryTrait==='timeLocked'&&cause.source==='direct'&&damage>0){const t=Math.max(0,g.simulationTime-(s.spawnAt||0))+(s.phaseOffset||0),cycle=Math.floor(t/1.4);if(t%1.4>=1&&s.timeGuardUsed!==cycle){s.timeGuardUsed=cycle;damage=Math.max(0,damage-1);advancedLog(g,'timeLocked',s,cause);}}
 return damage;
}
const childCause=(s,cause,source)=>({...cause,source,small:undefined,originShapeId:s.id,nativeWave:false,stageIndex:undefined,depth:(cause.depth||0)+1});
export function advancedContact(g,s,cause,wave){
 if(!g.advancedEnabled)return;codexContact(g,s,cause,wave);
 if(s.type!=='prismLens'||!wave||!cause.nativeWave||!['square','star'].includes(cause.source)||s.echo)return;
 s.lensWaves||=new Set();if(s.lensWaves.has(wave.id)||s.lensWaves.size>=2)return;s.lensWaves.add(wave.id);
 const angle=Math.atan2(s.y-wave.y,s.x-wave.x),origin={id:s.id,x:s.x,y:s.y},child=childCause(s,cause,'prismRefraction');
 g.scheduleEffect(()=>{for(let i=0;i<2;i++){const dir=angle+(i===0?-1:1)*35*Math.PI/180,sector=g.area(origin,120,1,{...child,sectorIndex:i},C.shapes.prismLens.color,s.id,{angle:dir,halfAngle:12*Math.PI/180});if(sector)advancedLog(g,'lensSector',s,child,{waveId:sector.id,sectorIndex:i});}},child,.04);
}
export function advancedDamaged(g,s,actual,cause,wave){
 if(!g.advancedEnabled||actual<=0||s.echo)return;
 if(cause.source==='parasiteCopied'){codexEvent(g,'parasiteCopied',{id:cause.originShapeId},cause,{targetId:s.id});advancedLog(g,'parasiteDelivered',{id:cause.originShapeId},cause,{targetId:s.id,actual});return;}
 if(s.type==='parasiteLink'){
  const targets=(s.parasiteIds||[]).map(id=>g.alive.find(t=>t.id===id)).filter(t=>t&&ordinary(t)&&Math.hypot(t.x-s.x,t.y-s.y)<=100),child=childCause(s,cause,'parasiteCopied');
  child.attackEventId=g.processingEventId;child.originalOriginShapeId=cause.originShapeId;child.originalTargetId=s.id;
  if(targets.length)g.scheduleEffect(()=>{for(const target of targets)if(!target.destroyed&&Math.hypot(target.x-s.x,target.y-s.y)<=100)g.enqueue(target,Math.min(1,actual),child);},child,.04);
 }
 if(s.secondaryTrait==='resonant'&&wave&&!s.resonantUsed){
  s.resonantHits=(s.resonantHits||[]).filter(e=>g.simulationTime-e.at<=1);if(!s.resonantHits.some(e=>e.wave===wave.id))s.resonantHits.push({wave:wave.id,chain:cause.chainId,at:g.simulationTime});
  if(s.resonantHits.filter(e=>e.chain===cause.chainId).length>=2){const child=childCause(s,cause,'traitResonant');if(g.scheduleEffect(()=>{if(g.area(s,65,1,child,'#b4e4ff',s.id))advancedLog(g,'resonant',s,child);},child,.03))s.resonantUsed=true;}
 }
}
export function advancedDeath(g,s,cause,wave){
 if(!g.advancedEnabled)return;codexDeath(g,s,cause,wave);if(s.echo)return;
 if(s.portalPartner){const other=g.shapes.find(t=>t.id===s.portalPartner);if(other){delete other.portalPartner;advancedLog(g,'portalUnlinked',other,cause);}delete s.portalPartner;}
 if(s.type==='chainBeacon'&&(g.chains.get(cause.chainId)?.rewardedKills||0)>=10&&!s.beaconUsed){s.beaconUsed=true;const child=childCause(s,cause,'chainBeacon');g.scheduleEffect(()=>{const wave=g.area(s,130,2,child,C.shapes.chainBeacon.color,s.id);if(wave){advancedLog(g,'beaconWave',s,cause,{waveId:wave.id});codexFeat(g,'chainBeacon','death:'+s.id,cause,{sourceId:s.id,waveId:wave.id});}},child,.05);}
 if(s.secondaryTrait==='fragmented'&&cause.source!=='traitFragmented'){
  const child=childCause(s,cause,'traitFragmented');g.scheduleEffect(()=>{for(let i=0;i<2;i++)if(g.emitAux(s,s.angle+i*Math.PI,child,'traitFragmented',1,65))advancedLog(g,'fragmented',s,cause);},child,.03);
 }
 if(s.elitePrimary&&!s.elitePaid){s.elitePaid=true;g.pendingCatalyst+=3;(g.eliteDelta[s.eliteId]||={attempts:0,spawned:0,kills:0}).kills++;g.rewardLog.push({kind:'catalyst:elite',amount:3,shapeId:s.id,chainId:cause.chainId,at:g.simulationTime});advancedLog(g,'eliteKilled',s,cause,{eliteId:s.eliteId});}
}
export function portalContact(g,shard,target,time){
 if(!g.advancedEnabled||shard.small||target.type!=='portalGate'||!target.portalPartner)return false;
 const partner=g.alive.find(t=>t.id===target.portalPartner);if(!partner)return false;
 shard.portalPairs||=new Set();if(shard.portalPairs.has(target.portalPairId))return false;
 let angle=shard.angle;
 if(level(g,'portalCalibration')){const next=near(g,partner,Infinity,t=>t.id!==target.id&&!shard.hitIds?.has(t.id)).sort((a,b)=>b.hp-a.hp||a.id-b.id)[0];if(next)angle=Math.atan2(next.y-partner.y,next.x-partner.x);}
 const p=g.positionAt(partner,time),distance=partner.radius+C.shard.radius+.01,x=p.x+Math.cos(angle)*distance,y=p.y+Math.sin(angle)*distance,A=C.arena;
 if(x<A.left+C.shard.radius||x>A.right-C.shard.radius||y<A.top+C.shard.radius||y>A.bottom-C.shard.radius||g.alive.some(t=>t.id!==partner.id&&Math.hypot(x-g.positionAt(t,time).x,y-g.positionAt(t,time).y)<t.radius+C.shard.radius+.001))return false;
 shard.portalPairs.add(target.portalPairId);shard.portalPassed=target.id;shard.hitIds||=new Set();shard.hitIds.add(target.id);shard.hitIds.add(partner.id);Object.assign(shard,{x,y,prevX:x,prevY:y,angle,vx:Math.cos(angle)*C.shard.speed,vy:Math.sin(angle)*C.shard.speed,dead:false});
 const old=g.processingTime;g.processingTime=time;expansionReflected(g,shard,'portal');if(level(g,'portalCalibration'))expansionUsed(g,'portalCalibration',shard,{portalId:target.id});advancedLog(g,'portalPass',target,shard,{shardId:shard.id,exitId:partner.id});g.processingTime=old;return true;
}
// Formal M11 main refraction: actual main contact at a Lens, at most2/Lens,
// steers at most70deg toward a living unhit target. Sector waves never qualify.
export function lensMainContact(g,shard,target){
 if(!g.advancedEnabled||shard.small||target.type!=='prismLens'||(target.mainRefractions||0)>=2)return false;
 const next=near(g,target,Infinity,t=>!shard.hitIds?.has(t.id))[0];if(!next)return false;
 const aim=Math.atan2(next.y-shard.y,next.x-shard.x),diff=Math.atan2(Math.sin(aim-shard.angle),Math.cos(aim-shard.angle));shard.angle+=Math.sign(diff)*Math.min(Math.abs(diff),70*Math.PI/180);shard.vx=Math.cos(shard.angle)*C.shard.speed;shard.vy=Math.sin(shard.angle)*C.shard.speed;shard.reflectionKind='prism';shard.reflectionSource=target.id;target.mainRefractions=(target.mainRefractions||0)+1;advancedLog(g,'lensMainRefraction',target,shard,{shardId:shard.id});return true;
}
export function polarTick(g){
 if(!g.advancedEnabled)return;
 const nodes=g.alive.filter(s=>s.secondaryTrait==='polarized'&&!s.polarBroken);
 for(const shard of g.shards.filter(s=>!s.small&&!s.dead))for(const a of nodes){const b=nodes.filter(t=>t.id!==a.id&&Math.hypot(t.x-a.x,t.y-a.y)<=105).sort((x,y)=>Math.hypot(x.x-a.x,x.y-a.y)-Math.hypot(y.x-a.x,y.y-a.y)||x.id-y.id)[0];if(!b||Math.hypot(shard.x-a.x,shard.y-a.y)>105)continue;const key=[a.id,b.id].sort((x,y)=>x-y).join(':');shard.polarPairs||=new Set();if(shard.polarPairs.has(key))continue;shard.polarPairs.add(key);shard.angle+=(a.id<b.id?1:-1)*10*Math.PI/180;shard.vx=Math.cos(shard.angle)*C.shard.speed;shard.vy=Math.sin(shard.angle)*C.shard.speed;advancedLog(g,'polarized',a,shard,{targetId:b.id,shardId:shard.id});}
}
export function safePortalPair(g,points=null){
 if(g.alive.some(s=>s.type==='portalGate')||g.alive.length+2>g.target)return null;
 let found=points;
 if(!found)for(let i=0;i<96;i++){const A=C.arena,a={x:A.left+45+g.advancedRng()*(A.right-A.left-90),y:A.top+45+g.advancedRng()*(A.bottom-A.top-90)},b={x:A.left+45+g.advancedRng()*(A.right-A.left-90),y:A.top+45+g.advancedRng()*(A.bottom-A.top-90)};if(Math.hypot(a.x-b.x,a.y-b.y)>=180&&safePoint(g,a.x,a.y,22)&&safePoint(g,b.x,b.y,22)){found=[a,b];break;}}
 if(!found||found.length!==2||Math.hypot(found[0].x-found[1].x,found[0].y-found[1].y)<180||!found.every(p=>safePoint(g,p.x,p.y,22)))return null;
 const pair=found.map(p=>g.addShape('portalGate',p.x,p.y,0,false,C.spawnGrace,'normal'));
 if(pair.some(s=>!s))throw Error('Atomic portal commit precondition violated');
 const pairId=g.portalSequence++;for(let i=0;i<2;i++){pair[i].portalPairId=pairId;pair[i].portalPartner=pair[1-i].id;}
 // Only one rare roll per pair; the second still consumes the independent RNG draw.
 g.oreSpawnCounts[pair[1].oreGrade]--;pair[1].oreGrade='common';g.oreSpawnCounts.common++;return pair;
}

export function advancedSkipped(g){if(!g.advancedEnabled||g.state!=='PLAYING')return;for(const s of g.alive.filter(s=>s.type==='shifter'&&s.nextLeapAt<=g.elapsed+1e-9))planLeap(g,s,(s.spawnAt||0)+(Math.floor((g.elapsed-(s.spawnAt||0))/1.3)+1)*1.3);}
