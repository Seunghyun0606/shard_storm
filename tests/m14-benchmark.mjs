import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {readyWorld,playWorld,maximum} from './m14-helpers.js';
import {BUILD_PRESETS,EVOLUTION_FAMILIES} from '../expansion-defs.js';
import {settle} from '../progression.js';
const rows=[];
for(const seed of [31415,1,7,42,99])for(const build of ['Crusher','Cascade','Reactor'])for(const world of ['w1','w2','w3','w4','w5'])for(const bossChallenge of [false,true])for(const duration of [20,32]){
 const s=readyWorld(world),preset=BUILD_PRESETS[build],g=playWorld(s,world,{seed,duration,bossChallenge,signatureLoadout:preset.signatures,evolutionOwned:Object.fromEntries(Object.entries(EVOLUTION_FAMILIES).map(([id,v])=>[id,Object.keys(v.forms)])),evolutionActive:preset.evolutions});const r=g.record();
 assert.equal(r.physicsDebt.discardedPhysicalSeconds,0);assert.equal(r.physicsChecks.lateWaveContacts,0);assert.ok(r.peakShards<=150&&r.peakWaves<=64&&r.peakScheduled<=1024);assert.equal(settle(s,g),true);
 rows.push({seed,build,world,bossChallenge,duration,kills:r.totalDestroyed,raw:r.rawEarned,photon:r.processedPhoton,chain:r.bestChain,distance:r.destruction.maxDistance,boss:r.worldRun.boss,caps:r.capCounts});
}
writeFileSync('artifacts/m14-benchmark-results.json',JSON.stringify({passed:true,actualRuns:rows.length,rows,method:'5seeds x3 real build presets x5Worlds xNormal/Boss x20/32s; explicit Rank4/full skill fixtures, tactical input. Human fun not assessed.'},null,2));console.log('M14 benchmark PASS '+rows.length+' actual Runs; Boss clears '+rows.filter(r=>r.boss?.cleared).length+'/150');
