import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {CONFIG as C} from '../config.js';
import {contentBattle} from './content-simulation.js';
import {EVOLUTION_FAMILIES} from '../expansion-defs.js';
const levels=Object.fromEntries(Object.entries(C.upgrades).map(([id,u])=>[id,u.max])),owned=Object.fromEntries(Object.entries(EVOLUTION_FAMILIES).map(([id,d])=>[id,Object.keys(d.forms)])),rows=[];
for(const seed of [31415,1,7,42,99])for(const duration of [20,32])for(const destructionEnabled of [false,true]){
 const g=contentBattle({seed,levels,discoveryRank:4,duration,ecologyEnabled:true,advancedEnabled:true,skillExpansionEnabled:true,destructionEnabled,elitePolicy:'M12_run20_pity6',signatureLoadout:['portalCalibration','magneticPolarity','prismaticCascade'],evolutionOwned:owned,evolutionActive:[{family:'gravity',form:'orbit'},{family:'shard',form:'piercing'}]});
 const r=g.record();assert.equal(r.physicsDebt.discardedPhysicalSeconds,0);assert.ok(r.destruction.triggers<=3&&r.destruction.spawned<=18);rows.push({seed,duration,destructionEnabled,kills:r.totalDestroyed,chain:r.bestChain,spatial:r.destruction,mechanics:{...r.ecologyCounts,...r.advancedCounts},abilities:r.expansionExecuted});
}
writeFileSync('artifacts/m13-control-results.json',JSON.stringify({passed:true,actualRuns:rows.length,method:'Control: full-owned fixture, Signature3/Evolution2;5seed x20/32 xOFF/ON, fixed density input; not human fun',rows},null,2));console.log('M13 Control PASS20 actual Runs');
