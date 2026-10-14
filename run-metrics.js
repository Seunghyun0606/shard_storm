import { CONFIG as C } from './config.js';
export const emptyCounters=()=>Object.fromEntries([...new Set([...Object.values(C.relics).map(r=>r.counter),...Object.values(C.contracts).map(r=>r.counter),'chain15','movingDirectKills','chargedOrReactorKills'])].map(k=>[k,0]));
export function count(game,key,amount=1,event={}){if(game.state!=='PLAYING'||game.simulationTime>=game.duration)return;game.metaCounters[key]=(game.metaCounters[key]||0)+amount;if(game.causalLog.length<C.meta.eventLogCap)game.causalLog.push({eventId:++game.nextCausalEvent,runId:game.runId,simulationTime:game.simulationTime,eventType:key,amount,...event});}
export function killMetrics(game,s,cause,wave){const direct=cause.source==='direct',primary=!wave&&cause.small===false&&['triangle','pentagon'].includes(cause.source),native=(Boolean(wave)||cause.nativeWave===true)&&['square','star'].includes(cause.source);const data={chainId:cause.chainId,sourceType:cause.source,sourceShapeId:cause.originShapeId,targetShapeId:s.id,targetType:s.type,targetModifier:s.modifier,targetOreGrade:s.oreGrade,direct,primaryShard:primary,nativeWave:native,relicId:cause.relicId,anomalyId:game.anomalyId};
 if(direct){count(game,'directKills',1,data);if(s.modifier==='cracked')count(game,'directCrackedKills',1,data);const m=s.motion;if(game.options.motionEnabled&&Number.isFinite(m?.startAt)&&game.simulationTime>=m.startAt&&(m.rotationRate||m.ampX||m.ampY))count(game,'movingDirectKills',1,data);}
 if(primary)count(game,'primaryShardKills',1,data);if(native)count(game,'nativeWaveKills',1,data);if(s.oreGrade==='core')count(game,'coreOreKills',1,data);if(s.type==='ancient')count(game,'ancientKills',1,data);if(s.modifier==='charged'||s.type==='reactor')count(game,'chargedOrReactorKills',1,data);
 const chain=game.chains.get(cause.chainId);chain.rewardedKills=(chain.rewardedKills||0)+1;
 // Echo increases the visible combo only. Reward objectives count normal deaths.
 for(const n of [10,15])if(chain.rewardedKills>=n&&!chain[`counted${n}`]){chain[`counted${n}`]=true;count(game,`chain${n}`,1,{chainId:cause.chainId,eventType:'chainThresholdCrossed',threshold:n});}
}
export function releaseWard(game,target,origin,reason){if(target.destroyed||!target.wardSourceId)return false;delete target.wardSourceId;delete target.wardExpiresAt;delete target.wardDeathOrigin;
 if(origin?.destroyed&&!target.wardReleaseCounted){target.wardReleaseCounted=true;count(game,'wardReleasesFromHexDeath',1,{sourceShapeId:origin.id,targetShapeId:target.id,reason,eventType:'wardReleased'});}
 if(reason==='wave'&&origin&&!origin.siphonBlocked&&!origin.siphonCredited&&game.relicLoadout.includes('hexSiphon')){origin.siphonCredited=true;const r=C.relics.hexSiphon;game.siphonCharges=game.siphonCharges.filter(t=>t>game.simulationTime);if(game.siphonCharges.length<r.chargeCap)game.siphonCharges.push(game.simulationTime+r.expires);}
 return true;
}
