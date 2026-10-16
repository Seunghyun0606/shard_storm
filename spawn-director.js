import {seededRNG} from './entities.js';

// User-approved M12 policy A: Run20% + six eligible natural misses then a
// guaranteed safe placement attempt. Supply experiments remain sandbox-only.
export const LIVE_ELITE_POLICY='M12_run20_pity6';
export const SUPPLY_PROFILES=Object.freeze(Object.fromEntries([15,18,21,24,30].map(rate=>[`M12_elastic${rate}`,Object.freeze({rate,interval:3/rate,batch:3})])));
export const ELITE_POLICIES=Object.freeze({M11_attempt:null,M12_run03:{chance:.03,pity:false},M12_run15:{chance:.15,pity:false},M12_run20:{chance:.20,pity:false},M12_run25:{chance:.25,pity:false},M12_run20_pity6:{chance:.20,pity:true}});
export function initDirector(g,{supplyProfile='M11_fixed',elitePolicy='M11_attempt',elitePity=0}={}){
 if(supplyProfile!=='M11_fixed'&&!SUPPLY_PROFILES[supplyProfile])throw Error('Unknown supply profile');
 if(!Object.hasOwn(ELITE_POLICIES,elitePolicy))throw Error('Unknown Elite policy');
 const stormSupply=g.destructionEnabled&&g.destructionStage.index===4&&supplyProfile==='M12_elastic24';
 if(!g.sandbox&&((supplyProfile!=='M11_fixed'&&!stormSupply)||!['M11_attempt',LIVE_ELITE_POLICY].includes(elitePolicy)))throw Error('Unadopted M12 policies require sandbox');
 g.director={profile:supplyProfile,policy:elitePolicy,high:false,readySince:null,cooldownUntil:0,recentDeaths:[],lastDamageAt:-Infinity,lastSample:-1,failures:0,transitions:[],samples:[],elite:{eligible:false,sampled:false,accepted:false,introduction:false,naturalSpawned:false,attempts:0,placementFailures:0,pityStart:Math.max(0,Math.min(6,Math.floor(elitePity)||0)),selectedId:null}};
 g.directorEliteRng=seededRNG(g.seed^0x12e117e);
}
export function directorDamage(g,actual){if(actual>0)g.director.lastDamageAt=g.simulationTime;}
export function directorDeath(g,s){if(!s.echo)g.director.recentDeaths.push(g.simulationTime);}
export function directorInterval(g,fallback){
 const d=g.director,p=SUPPLY_PROFILES[d.profile],now=g.elapsed;
 d.recentDeaths=d.recentDeaths.filter(at=>now-at<=4);
 const rate=d.recentDeaths.length/Math.min(4,Math.max(1,now)),live=g.alive,special=live.filter(s=>s.type!=='triangle'&&s.type!=='square'&&s.type!=='pentagon'&&s.type!=='star').length/Math.max(1,live.length);
 const active=now-d.lastDamageAt<=1.5,eligible=now>=3&&g.discoveryRank>=2&&rate>=10&&live.length<g.target*.75&&special<=.6&&d.failures<3&&active;
 const highBefore=d.high;
 if(!p||!eligible){d.readySince=null;if(d.high){d.high=false;d.cooldownUntil=now+3;}}
 else if(!d.high&&now>=d.cooldownUntil){d.readySince??=now;if(now-d.readySince>=2-1e-9)d.high=true;}
 if(d.high!==highBefore)d.transitions.push({at:now,high:d.high,rate,alive:live.length,reason:d.high?'sustained-real-kills':!active?'idle':d.failures>=3?'placement-failures':'density-or-rate'});
 const second=Math.floor(now);
 if(second!==d.lastSample){d.lastSample=second;let overlap=0;for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++)if(Math.hypot(live[i].x-live[j].x,live[i].y-live[j].y)<live[i].radius+live[j].radius)overlap++;
  d.samples.push({at:now,alive:live.length,target:g.target,killRate:rate,specialRatio:special,overlapPairs:overlap,high:d.high,spawnAttempts:g.spawnAttempts,spawnSuccesses:g.spawnSuccesses,spawnFailures:g.spawnFailures,missedClicks:g.missedClicks,emptySeconds:g.emptyArenaDuration});}
 return p?(d.high?p.interval:.2):fallback;
}
export function eliteChoice(g,eligible,introduction,forced){
 const d=g.director,e=d.elite,p=ELITE_POLICIES[d.policy];
 if(!p)return forced||introduction||(g.advancedRng()<.03?eligible[Math.floor(g.advancedRng()*eligible.length)]:null);
 if(forced)return forced;
 e.eligible=true;
 if(!e.sampled){e.sampled=true;e.roll=g.directorEliteRng();e.accepted=e.roll<p.chance||(p.pity&&e.pityStart>=6);if(e.accepted)e.selectedId=eligible[Math.floor(g.directorEliteRng()*eligible.length)];}
 if(introduction){e.introduction=true;return introduction;}
 return e.accepted&&e.attempts<8?e.selectedId:null;
}
export function directorRecord(g){
 const d=g.director,e=d.elite,p=ELITE_POLICIES[d.policy];
 const pityNext=!p?.pity||!e.eligible?e.pityStart:e.naturalSpawned?0:e.introduction?e.pityStart:Math.min(6,e.pityStart+1);
 return {profile:d.profile,policy:d.policy,transitions:structuredClone(d.transitions),samples:structuredClone(d.samples),elite:{...e,pityNext},experimental:d.profile!=='M11_fixed'||!['M11_attempt',LIVE_ELITE_POLICY].includes(d.policy)};
}
export function eliteSettlement(g){
 if(g.director?.policy!==LIVE_ELITE_POLICY)return null;const e=directorRecord(g).elite;
 return {version:1,runId:g.runId,policy:LIVE_ELITE_POLICY,start:e.pityStart,next:e.pityNext,eligible:e.eligible,introduction:e.introduction,spawned:e.naturalSpawned};
}
export function validEliteSettlement(e,runId){
 if(e==null)return true;
 if(e.version!==1||e.policy!==LIVE_ELITE_POLICY||e.runId!==runId||!['start','next'].every(k=>Number.isInteger(e[k])&&e[k]>=0&&e[k]<=6)||!['eligible','introduction','spawned'].every(k=>typeof e[k]==='boolean'))return false;
 return e.next===(!e.eligible?e.start:e.spawned?0:e.introduction?e.start:Math.min(6,e.start+1));
}
