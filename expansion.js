import {CONFIG as C} from './config.js';
import {EXPANSION_SKILLS} from './expansion-defs.js';
import {normalizeSignatures,normalizeEvolutionActive} from './builds.js';

export function initExpansion(g,enabled,signatures=[],evolutions=[],owned={}) {
 g.skillExpansionEnabled=Boolean(enabled)&&g.ruleset!=='legacy_v08';
 g.signatureLoadout=Object.freeze(g.skillExpansionEnabled?normalizeSignatures(signatures,g.levels):[]);
 g.evolutionActive=Object.freeze((g.skillExpansionEnabled?normalizeEvolutionActive(evolutions,owned):[]).map(Object.freeze));
 g.expansionLevels=Object.freeze(Object.fromEntries(Object.entries(EXPANSION_SKILLS).map(([id,d])=>[id,g.skillExpansionEnabled&&(d.type!=='S'||g.signatureLoadout.includes(id))?Math.min(d.max,Math.max(0,g.levels[id]||0)):0])));
 g.expansionCounts={};g.expansionExecuted={};g.expansionEvents=[];g.nextExpansionEvent=0;g.expansionChainCounts=new Map();g.scannerPaid=new Set();g.fuseTimes=new Map();g.reactorExecutions=new Map();
 g.expansionRareRaw=0;g.expansionSalvageRaw=0;g.calibrationPhoton=0;g.expansionImpact={};
 if(form(g,'direct','focusStrike')){g.stats.directDamage+=2;g.stats.attackInterval+=.04;}
}
export const level=(g,id)=>g.expansionLevels?.[id]||0;
export const form=(g,family,id)=>g.evolutionActive?.some(r=>r.family===family&&r.form===id)||false;
function record(g,id,cause={},extra={}) {
 g.expansionExecuted[id]=(g.expansionExecuted[id]||0)+1;
 const eventId=++g.nextExpansionEvent;
 if(g.expansionEvents.length<2048)g.expansionEvents.push({id,sourceSkill:id,eventId,at:g.simulationTime,sourceShapeId:cause.originShapeId??extra.targetId,chainId:cause.chainId,shardId:cause.small===false?cause.id:undefined,...extra});
}
export function expansionUsed(g,id,cause={},extra={}) {if(g.skillExpansionEnabled)record(g,id,cause,extra);}
function reserve(g,id,cause,runCap,chainCap) {
 if(!g.chains.has(cause.chainId))return null;
 const chainKey=`${cause.chainId}:${id}`,run=g.expansionCounts[id]||0,chain=g.expansionChainCounts.get(chainKey)||0;
 if(run>=runCap||chain>=chainCap)return null;
 return ()=>{g.expansionCounts[id]=run+1;g.expansionChainCounts.set(chainKey,chain+1);};
}
function proc(g,id,origin,cause,{radius,damage=1,shards,range,delay=.03,runCap=Infinity,chainCap=Infinity}={}) {
 const commit=reserve(g,id,cause,runCap,chainCap);if(!commit)return false;
 const at={x:origin.x,y:origin.y,angle:origin.angle||0,id:origin.id},child={...cause,depth:(cause.depth||0)+1,source:id,triggeredBySkill:id,originShapeId:origin.id,noRelicProc:Boolean(cause.noRelicProc),nativeWave:false};
 delete child.stageIndex;
 const done=g.skillEffect(id,()=>{
  let emitted=0,waveId;
  if(shards)for(let i=0;i<shards;i++)emitted+=Number(Boolean(g.emitAux(at,at.angle+i*Math.PI*2/shards,child,id,damage,range)));
  else {const wave=g.area(at,radius,damage,child,'#b5e5e0',at.id);emitted=Number(Boolean(wave));waveId=wave?.id;}
  if(emitted)record(g,id,child,{emitted,waveId});
 },child,delay);
 if(done)commit();return Boolean(done);
}
const moving=(g,s)=>g.options.motionEnabled&&s.motion&&Number.isFinite(s.motion.startAt)&&(s.motion.ampX||s.motion.ampY||s.motion.rotationRate);
export function expansionBeforeDamage(g,s,damage,cause,wave) {
 if(!g.skillExpansionEnabled)return damage;
 for(const key of ['weakpointBonus','armorBonus','armorShatterApplied','armorEvolution','interceptBonus','breakerStages','markConsumed'])delete cause[key];
 if(damage<=0)return damage;
 if(cause.source==='direct') {
  if(level(g,'weakpointScanner')&&s.hp<=s.maxHP/2&&!s.weakpointUsed){cause.weakpointBonus=level(g,'weakpointScanner');damage+=cause.weakpointBonus;}
  if((level(g,'armorShatter')||form(g,'direct','armorBypass'))&&((s.secondaryTrait==='reinforced'&&!s.armorUsed)||(s.type==='hex'&&!s.shieldBroken))) {
   cause.armorBonus=s.armorShatterUsed?0:level(g,'armorShatter');cause.armorShatterApplied=cause.armorBonus>0;
   if(form(g,'direct','armorBypass')&&!s.armorBypassUsed&&(g.expansionCounts['evolution:armorBypass']||0)<6){cause.armorEvolution=true;cause.armorBonus+=2;}
  }
  if(level(g,'targetIntercept')&&C.shapes[s.type].special&&moving(g,s)&&!s.interceptUsed&&(g.expansionCounts.targetIntercept||0)<5){cause.interceptBonus=level(g,'targetIntercept');damage+=cause.interceptBonus;}
  if(level(g,'ancientBreaker')&&s.type==='ancient') {
   s.breakerStages ||= new Set();cause.breakerStages=[];
   for(const[stage,hp]of C.specialEffects.ancient.thresholds.entries())if(s.hp>hp&&s.hp-damage<=hp&&!s.breakerStages.has(stage)){cause.breakerStages.push(stage);damage+=level(g,'ancientBreaker');}
  }
 }
 if(wave&&!cause.wardRelease&&(!cause.triggeredBySkill||cause.nativeWave||(['reactor','ancient'].includes(cause.source)&&cause.stageIndex))&&s.markUntil>=g.simulationTime&&level(g,'markedTarget')){cause.markConsumed=true;damage+=level(g,'markedTarget');}
 return damage;
}
export function expansionAfterDefense(g,damage,cause) {
 return g.skillExpansionEnabled&&cause.armorBonus?damage+cause.armorBonus:damage;
}
export function expansionDamaged(g,s,actual,cause,wave) {
 if(!g.skillExpansionEnabled||actual<=0||s.echo)return;
 if(cause.triggeredBySkill&&cause.source===cause.triggeredBySkill){const impact=g.expansionImpact[cause.triggeredBySkill]||={hits:0,damage:0,kills:0};impact.hits++;impact.damage+=actual;impact.kills+=Number(s.hp<=0);}
 if(cause.source==='direct'&&form(g,'direct','focusStrike'))record(g,'evolution:focusStrike',cause,{targetId:s.id});
 if(cause.source==='conductor'&&level(g,'conductiveSurge'))record(g,'conductiveSurge',cause,{targetId:s.id,actual});
 for(const [field,id]of [['weakpointBonus','weakpointScanner'],['interceptBonus','targetIntercept']])if(cause[field]){s[id==='weakpointScanner'?'weakpointUsed':'interceptUsed']=true;g.expansionCounts[id]=(g.expansionCounts[id]||0)+1;record(g,id,cause,{targetId:s.id,bonus:cause[field]});}
 if(cause.armorBonus){if(cause.armorShatterApplied){s.armorShatterUsed=true;record(g,'armorShatter',cause,{targetId:s.id});}if(cause.armorEvolution){s.armorBypassUsed=true;g.expansionCounts['evolution:armorBypass']=(g.expansionCounts['evolution:armorBypass']||0)+1;record(g,'evolution:armorBypass',cause,{targetId:s.id});}}
 for(const stage of cause.breakerStages||[]){s.breakerStages.add(stage);record(g,'ancientBreaker',cause,{targetId:s.id,stage});}
 if(cause.markConsumed){delete s.markUntil;record(g,'markedTarget',cause,{targetId:s.id,consumed:true});if(form(g,'direct','markDetonator'))proc(g,'evolution:markDetonator',s,cause,{radius:65,runCap:3});}
 if(cause.source==='direct') {
  if(level(g,'markedTarget')){s.markUntil=g.simulationTime+1.5;record(g,'markedTarget',cause,{targetId:s.id,marked:true});}
  if(level(g,'phaseDisruptor')&&!s.disruptorUsed&&(moving(g,s)||s.type==='phaseCrystal')) {
   s.disruptorUsed=true;s.motionSlowAt=g.simulationTime;s.motionSlowFactor=level(g,'phaseDisruptor')===1?.2:.35;s.phaseExtension=.1*level(g,'phaseDisruptor');record(g,'phaseDisruptor',cause,{targetId:s.id});
  }
  if(level(g,'magneticPolarity')&&s.secondaryTrait==='polarized')s.polarBroken=true;
 }
 if(wave&&['square','star','reactor','ancient'].includes(cause.source)&&(cause.nativeWave||cause.stageIndex)&&level(g,'resonanceBurst')&&!s.resonanceBurstUsed) {
  s.expansionWaveHits=(s.expansionWaveHits||[]).filter(r=>g.simulationTime-r.at<=1);
  if(!s.expansionWaveHits.some(r=>r.id===wave.id))s.expansionWaveHits.push({id:wave.id,at:g.simulationTime});
  if(s.expansionWaveHits.length>=2&&proc(g,'resonanceBurst',s,cause,{radius:level(g,'resonanceBurst')===1?60:80,runCap:4}))s.resonanceBurstUsed=true;
 }
}
export function expansionKilled(g,s,cause,wave,countersBefore={}) {
 if(!g.skillExpansionEnabled)return;
 if(s.echo){if(level(g,'splitterMastery'))proc(g,'splitterMastery',s,cause,{shards:1,range:65,runCap:2*level(g,'splitterMastery')});return;}
 const main=cause.small===false,dir=cause.source==='direct',special=C.shapes[s.type].special,chain=g.chains.get(cause.chainId),kills=chain?.rewardedKills||0;
 if(dir&&level(g,'chainStarter'))proc(g,'chainStarter',s,cause,{shards:1,range:65,chainCap:3,runCap:12});
 if(dir&&special&&level(g,'executionPulse'))proc(g,'executionPulse',s,cause,{radius:level(g,'executionPulse')===1?60:75,delay:.04,runCap:1+level(g,'executionPulse')});
 if(main&&level(g,'angularSplit'))proc(g,'angularSplit',s,cause,{shards:level(g,'angularSplit'),range:60,chainCap:3});
 if(main&&cause.reflectionKind==='mirror'&&level(g,'mirrorReturn'))proc(g,'mirrorReturn',s,cause,{radius:level(g,'mirrorReturn')===1?45:60,runCap:2*level(g,'mirrorReturn')});
 if(main&&['mirror','prism'].includes(cause.reflectionKind)&&!cause.prismaticUsed&&level(g,'prismaticCascade')){if(proc(g,'prismaticCascade',s,cause,{shards:1,range:80,runCap:2}))cause.prismaticUsed=true;}
 if(main&&form(g,'shard','scatter')&&!cause.scatterUsed){if(proc(g,'evolution:scatter',s,cause,{shards:2,range:65,chainCap:2}))cause.scatterUsed=true;}
 if(wave&&cause.nativeWave&&['square','star'].includes(cause.source)&&form(g,'shockwave','echo'))proc(g,'evolution:echo',s,cause,{radius:55,delay:.1,runCap:2});
 if(kills>=15&&level(g,'chainOverdrive'))proc(g,'chainOverdrive',s,cause,{radius:100,damage:2,runCap:1});
 if(s.type==='gravityWell') {
  if(level(g,'gravityBreak'))proc(g,'gravityBreak',s,cause,{shards:level(g,'gravityBreak'),range:70,runCap:4});
  if(dir&&level(g,'magneticPolarity'))proc(g,'magneticPolarity',s,cause,{radius:80,runCap:2});
  if(form(g,'gravity','push'))proc(g,'evolution:push',s,cause,{radius:70,runCap:2});
 }
 if(level(g,'rareHarvest')&&['prism','core','void'].includes(s.oreGrade)) {
  const amount=Math.min(400-g.expansionRareRaw,10*level(g,'rareHarvest'));
  if(amount>0){g.rewardExtra(amount,'skill',s,{...cause,triggeredBySkill:'rareHarvest'});g.expansionRareRaw+=amount;record(g,'rareHarvest',cause,{targetId:s.id,amount});}
 }
 if(dir&&special&&level(g,'precisionSalvage')) {
  const amount=Math.min(150-g.expansionSalvageRaw,15*level(g,'precisionSalvage'));
  if(amount>0){g.rewardExtra(amount,'skill',s,{...cause,triggeredBySkill:'precisionSalvage'});g.expansionSalvageRaw+=amount;record(g,'precisionSalvage',cause,{targetId:s.id,amount});}
 }
 // Human-approved option A: remember the direct root, then qualify ONLY its
 // normal deaths. Each pointer attack still owns a separate Chain.
 if(dir&&cause.rootAttack&&kills===1&&['hex','reactor'].includes(s.type)&&level(g,'catalystExtraction'))chain.extractionOrigin=s.id;
 if(chain?.extractionOrigin&&kills>=10&&!chain.extractionCredited&&level(g,'catalystExtraction')&&(g.expansionCounts.catalystExtraction||0)<level(g,'catalystExtraction')) {
  chain.extractionCredited=true;g.expansionCounts.catalystExtraction=(g.expansionCounts.catalystExtraction||0)+1;g.pendingCatalyst++;
  record(g,'catalystExtraction',{...cause,originShapeId:chain.extractionOrigin},{targetId:s.id,normalKills:kills,amount:1});
  g.rewardLog.push({kind:'catalyst:extraction',amount:1,shapeId:chain.extractionOrigin,chainId:cause.chainId,at:g.simulationTime});
 }
 if(level(g,'contractScanner'))for(const contract of g.contractSnapshot) {
  const counter=C.contracts[contract.id].counter;
  if(!g.scannerPaid.has(contract.id)&&(g.metaCounters[counter]||0)>(countersBefore[counter]||0)) {
   g.scannerPaid.add(contract.id);g.rewardExtra(25,'skill',s,{...cause,triggeredBySkill:'contractScanner'});record(g,'contractScanner',cause,{contractId:contract.id,amount:25});
  }
 }
}
export function expansionNativeWave(g,s,cause,wave) {
 if(wave)for(const id of ['wide','focused'])if(form(g,'shockwave',id))record(g,`evolution:${id}`,cause,{waveId:wave.id});
 if(wave&&level(g,'delayedEcho'))proc(g,'delayedEcho',s,cause,{radius:60,delay:.12,runCap:2});
}
export function expansionWaveStats(g,radius,damage) {
 if(form(g,'shockwave','wide'))return {radius:radius+20,damage:Math.max(1,damage-1)};
 if(form(g,'shockwave','focused'))return {radius:Math.max(1,radius-20),damage:damage+1};
 return {radius,damage};
}
export function expansionStageStats(g,delay,damage) {
 if(form(g,'reactor','quick'))return {delay:Math.max(.01,delay-.02),damage:Math.max(1,damage-1)};
 if(form(g,'reactor','delayed'))return {delay:delay+.12,damage:damage+2};
 return {delay,damage};
}
export function expansionStageExecuted(g,s,cause,wave) {
 if(!wave||!form(g,'reactor','charge'))return;
 const events=g.reactorExecutions.get(cause.chainId)||new Set();events.add(wave.id??`${s.id}:${cause.stageIndex}`);g.reactorExecutions.set(cause.chainId,events);
 if(events.size>=2)proc(g,'evolution:charge',s,cause,{radius:75,runCap:1});
}
export function expansionFuseExecuted(g,s,cause) {
 if(!level(g,'fuseSymphony'))return;
 const recent=(g.fuseTimes.get(cause.chainId)||[]).filter(e=>g.simulationTime-e.at<=1);
 recent.push({id:s.id,at:g.simulationTime});g.fuseTimes.set(cause.chainId,recent);
 if(new Set(recent.map(r=>r.id)).size>=2)proc(g,'fuseSymphony',s,cause,{radius:90,damage:2,runCap:1});
}
export function expansionWardReleased(g,hex,cause) {
 if(hex.inversionUsed||!level(g,'shieldInversion'))return;
 if(proc(g,'shieldInversion',hex,cause,{radius:level(g,'shieldInversion')===1?60:70,runCap:level(g,'shieldInversion')}))hex.inversionUsed=true;
}
export function expansionShardCreated(g,s) {
 if(s.small||!g.skillExpansionEnabled)return;
 s.wallHooks=Boolean(level(g,'portalMomentum')||level(g,'ricochetBloom')||form(g,'shard','ricochet'));
 let changed=false;
 if(level(g,'piercingShard')){s.penetrations=(s.penetrations||0)+1;s.range*=.7;changed=true;}
 if(form(g,'shard','piercing')){s.penetrations=(s.penetrations||0)+1;s.range=Math.max(1,s.range-35);changed=true;}
 if(form(g,'gravity','pull')){s.range=Math.max(1,s.range-30);changed=true;}
 if(changed)s.life=s.range/C.shard.speed+C.shard.lifePadding;
}
export function expansionReflected(g,s,kind) {
 if(s.small||!g.skillExpansionEnabled)return;
 if(level(g,'portalMomentum')&&!s.momentumUsed&&['mirror','wall','portal'].includes(kind)){s.momentumUsed=true;s.range+=25*level(g,'portalMomentum');s.life=s.range/C.shard.speed+C.shard.lifePadding;record(g,'portalMomentum',s,{kind});}
 if(kind==='wall') {
  if(!s.ricochetEvolutionUsed&&form(g,'shard','ricochet')){s.ricochetEvolutionUsed=true;s.range+=50;s.life=s.range/C.shard.speed+C.shard.lifePadding;record(g,'evolution:ricochet',s);}
  if(!s.bloomWallUsed&&level(g,'ricochetBloom')){s.bloomWallUsed=true;proc(g,'ricochetBloom',{x:s.x,y:s.y,id:-1,angle:s.angle},s,{shards:2,range:80,chainCap:2,delay:0});}
 }
}
export function expansionCalibration(g) {
 if(!level(g,'refineryCalibration')||g.calibrationApplied)return;
 g.calibrationApplied=true;g.calibrationPhoton=Math.min(40,Math.floor(g.refinery.payout*.03*level(g,'refineryCalibration')+1e-9));
 if(g.calibrationPhoton)record(g,'refineryCalibration',{}, {amount:g.calibrationPhoton,baseRefinery:g.refinery.payout});
}
export function scannerEligible(g,s) {
 if(!level(g,'contractScanner')||g.elapsed>=3||s.echo||s.destroyed)return false;
 return g.contractSnapshot.some(({id})=>{
  switch(C.contracts[id]?.counter) {
   case 'directCrackedKills': return s.modifier==='cracked';
   case 'wardReleasesFromHexDeath': return s.type==='hex'&&g.alive.some(t=>t.wardSourceId===s.id);
   case 'coreOreKills': return s.oreGrade==='core';
   case 'reactorStageWaveExecuted': return s.type==='reactor';
   case 'ancientKills': return s.type==='ancient';
   case 'movingDirectKills': return Boolean(moving(g,s));
   case 'chargedOrReactorKills': return s.modifier==='charged'||s.type==='reactor';
   case 'anomalyWins': return false;
   default: return true;
  }
 });
}
