import {CONFIG as C} from './config.js';
import {PERKS,RESEARCH,normalizeResearch} from './modes.js';
export const hasPerk=(g,id)=>g.modeContext?.kind==='draft'&&g.modeContext.perks.includes(id);
export const hasResearch=(g,id)=>g.researchActive?.includes(id)||false;
export function initModeCombat(g,context,research=[],owned=[]){g.modeContext=context?Object.freeze(structuredClone(context)):null;g.researchActive=Object.freeze(normalizeResearch(research,owned,g.evolutionActive,g.signatureLoadout));g.modeMetrics={guardedPhase:0,structureDirect:false,normalChain20:false,fusePair:false,fuses:new Map(),conductors:new Map(),mechanics:new Set(),overload:false,salvage:false,reservations:{},chainReservations:new Map(),procs:{}};
 if(hasPerk(g,'shatterFocus')){g.stats.directDamage+=2;g.stats.attackInterval+=.04;}
 if(hasPerk(g,'chainOverload'))g.stats.directDamage=Math.max(1,g.stats.directDamage-1);
 const observe=g.combatObserver;g.combatObserver=(kind,e)=>{observe?.(kind,e);modeEvent(g,kind,e);};
}
export function modeEvent(g,kind,e={}){const m=g.modeMetrics;if(!m)return;
 if(['reflection','gravityBend','portalPass','fuseExploded','conductorDelivered','reactorStageWaveExecuted','wardReleasesFromHexDeath'].includes(kind))m.mechanics.add(kind);
 if(kind==='fuseExploded'){const list=m.fuses.get(e.chainId)||[];if(list.some(row=>row.id!==e.sourceShapeId&&g.simulationTime-row.at<=1+1e-9))m.fusePair=true;list.push({id:e.sourceShapeId,at:g.simulationTime});m.fuses.set(e.chainId,list);}
 if(kind==='conductorDelivered'&&g.shapes.some(s=>s.id===e.targetId&&!s.echo&&!s.fixture)){const ids=m.conductors.get(e.sourceShapeId)||new Set();ids.add(e.targetId);m.conductors.set(e.sourceShapeId,ids);}
}
export function modeDamage(g,s,actual,cause){if(cause.source==='direct'&&s.type==='phaseCrystal'&&actual===0&&!s.phaseWasVulnerable)g.modeMetrics.guardedPhase++;}
export function modeDeath(g,s,cause){const m=g.modeMetrics;if(cause.source==='direct'&&s.bossPart&&g.world?.boss?.parts.some(p=>p.shape.id===s.id)&&!s.echo&&!s.fixture)m.structureDirect=true;const chain=g.chains.get(cause.chainId);if(chain?.rewardedKills>=20&&!s.echo&&!s.fixture)m.normalChain20=true;if(hasPerk(g,'chainSalvage')&&chain?.rewardedKills>=20)m.salvage=true;
 if(hasPerk(g,'chainOverload')&&!m.overload&&chain?.rewardedKills>=10&&!s.echo){m.overload=true;const child={...cause,source:'draftOverload',originShapeId:s.id,depth:cause.depth+1,nativeWave:false,small:undefined};g.scheduleEffect(()=>{if(g.area(s,110,1,child,'#82ead4',s.id))modeProc(g,'chainOverload');},child,.04);}
}
export const MODE_EFFECT_CAPS={perRun:8,perChain:2};
function reserveMode(g,id,cause){const m=g.modeMetrics,key=id+':'+cause.chainId,run=m.reservations[id]||0,chain=m.chainReservations.get(key)||0;if(run>=MODE_EFFECT_CAPS.perRun||chain>=MODE_EFFECT_CAPS.perChain)return false;m.reservations[id]=run+1;m.chainReservations.set(key,chain+1);return true;}
export function modeProc(g,id){g.modeMetrics.procs[id]=(g.modeMetrics.procs[id]||0)+1;}
export function modeShard(g,s){if(s.small||!g.modeContext&&!g.researchActive.length)return;if(hasPerk(g,'pierceStorm')){s.penetrations=(s.penetrations||0)+1;s.range*=.75;modeProc(g,'pierceStorm');}if(hasPerk(g,'mirrorFan'))s.damage=Math.max(1,s.damage-1);if(hasPerk(g,'gravityDrift'))s.range=Math.max(10,s.range-25);
 if(hasResearch(g,'narrowPierce')){s.range+=60;s.penetrations=(s.penetrations||0)+1;s.researchSplitPenalty=1;modeProc(g,'narrowPierce');}
 if(hasResearch(g,'scatterPierce')){s.penetrations=Math.max(0,(s.penetrations||0)-1);s.researchExtraSplit=1;modeProc(g,'scatterPierce');}
 if(hasResearch(g,'gravitySpiral'))s.range=Math.max(10,s.range-30);s.life=Math.min(C.shard.maxLife,s.range/C.shard.speed+C.shard.lifePadding);
}
export function conductorRadius(g){return 115+(g.expansionLevels?.conductiveSurge>=2?15:0)+(hasPerk(g,'conductorWide')||hasResearch(g,'relaySurge')?20:0);}
export function conductorDamage(g){return Math.max(1,2+Number((g.expansionLevels?.conductiveSurge||0)>0)-Number(hasPerk(g,'conductorWide')||hasResearch(g,'relaySurge')));}
export function modeWaveRadius(g,r){return Math.max(1,r*(hasResearch(g,'focusDetonation')?.8:1)-(hasPerk(g,'phaseHunter')?15:0));}
export function modeWaveDamage(g,s,damage,cause,wave){return wave&&hasResearch(g,'focusDetonation')&&(s.bossPart||s.type==='hex'||s.type==='reactor'||s.type==='ancient')?damage+1:damage;}
export function modeStageDelay(g,delay,type){return delay+(type==='reactor'&&hasPerk(g,'reactorEcho')?.10:0)+(hasResearch(g,'delayedBloom')?.12:0);}
export function modeStageWave(g,s,origin,child,wave){
 if(hasPerk(g,'reactorEcho')&&s.type==='reactor'&&wave&&reserveMode(g,'reactorEcho',child)){const follow={...child,source:'draftReactorEcho',depth:child.depth+1,nativeWave:false};g.scheduleEffect(()=>{if(g.area(origin,55,1,follow,'#ecab85',s.id))modeProc(g,'reactorEcho');},follow,.08);}
 if(hasResearch(g,'delayedBloom')&&wave&&reserveMode(g,'delayedBloom',child)){const follow={...child,source:'researchBloom',depth:child.depth+1,nativeWave:false};for(const angle of [-Math.PI/3,Math.PI/3])if(g.emitAux(origin,(origin.angle||0)+angle,follow,'researchBloom',1,65))modeProc(g,'delayedBloom');}
}
export function modeReflect(g,s,target){if(!hasPerk(g,'mirrorFan')||target.type!=='mirror'||s.modeMirrorFan||!reserveMode(g,'mirrorFan',s))return;s.modeMirrorFan=true;const cause={...s,source:'draftMirrorFan',depth:s.depth+1,nativeWave:false};for(const angle of [-.4,.4])if(g.emitAux(target,s.angle+angle,cause,'draftMirrorFan',1,65))modeProc(g,'mirrorFan');}
