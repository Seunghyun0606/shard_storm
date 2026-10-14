import {CONFIG as C}from'./config.js';import{seededRNG}from'./entities.js';
const hash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
export function ensureOffer(save){
 save.anomalySeed ||= save.sandbox?'sandbox-fixed':globalThis.crypto?.randomUUID?.()||`install-${Date.now()}-${Math.random()}`;
 const seedKey=`${save.anomalySeed}:${save.totalRuns}:${save.anomalyOfferIndex}`;
 if(save.anomalyOffer&&save.anomalyOffer.eligibilityRank===save.discoveryRank&&save.anomalyOffer.seedKey===seedKey)return save.anomalyOffer;
 const rng=seededRNG(hash(seedKey)),pool=Object.keys(C.anomalies).filter(id=>save.discoveryRank>=C.anomalies[id].rank),offeredIds=[];
 while(pool.length&&offeredIds.length<C.meta.offerCount)offeredIds.push(pool.splice(Math.floor(rng()*pool.length),1)[0]);
 save.anomalyOffer={offerId:`offer-${hash(seedKey)}`,eligibilityRank:save.discoveryRank,offeredIds,seedKey};if(!offeredIds.includes(save.selectedAnomaly))save.selectedAnomaly=null;return save.anomalyOffer;
}
export function selectAnomaly(save,id,state){if(!['TITLE','RESULT'].includes(state)||save.pendingSettlement)return false;const offer=ensureOffer(save);if(id!==null&&!offer.offeredIds.includes(id))return false;save.selectedAnomaly=id;return true;}
export function consumeOffer(save){const offer=ensureOffer(save),chosen=offer.offeredIds.includes(save.selectedAnomaly)?save.selectedAnomaly:null;save.anomalyOfferIndex++;save.anomalyOffer=null;save.selectedAnomaly=null;ensureOffer(save);return{offerId:offer.offerId,anomalyId:chosen};}
export function anomalyResult(id,counters,refineryPayout){const d=C.anomalies[id];if(!d)return{id:null,succeeded:false,photon:0,actual:0,target:0};const actual=counters[d.counter]||0,alternate=d.alternateCounter?counters[d.alternateCounter]||0:0,succeeded=actual>=d.target||(d.alternateCounter&&alternate>=d.alternateTarget)||false;return{id,succeeded,actual,target:d.target,alternate,alternateTarget:d.alternateTarget||0,photon:succeeded?Math.min(C.meta.anomalyPhotonCap,Math.floor(refineryPayout*d.rate)):0};}
export function motionAnomaly(game,m){if(game.anomalyId!=='fastOrbit'||m.anomalyApplied)return;const d=C.anomalies.fastOrbit,speed=Math.hypot(m.ampX*m.speedX,m.ampY*m.speedY),factor=Math.min(d.motion,speed?C.motion.maxSpeed/speed:d.motion);m.speedX*=factor;m.speedY*=factor;const cap=m.rotationCap||C.motion.rotationMax;m.rotationRate=Math.sign(m.rotationRate)*Math.min(Math.abs(m.rotationRate)*d.motion,cap*Math.PI/180);m.anomalyApplied=true;}
export function modifierChances(game,base){const a=C.anomalies[game.anomalyId];let charged=base.charged*(a?.chargedMultiplier||1),cracked=base.cracked+(a?.crackedAdd||0);charged=Math.min(1,Math.max(0,charged));cracked=Math.min(1-charged,Math.max(0,cracked));return{cracked,charged};}
export function specialChance(game,type,base){const a=C.anomalies[game.anomalyId];return Math.max(0,Math.min(1,type==='hex'?base+(a?.hexAdd||0):type==='reactor'?base*(a?.reactorMultiplier||1):type==='ancient'?base*(a?.ancientMultiplier||1):base));}
