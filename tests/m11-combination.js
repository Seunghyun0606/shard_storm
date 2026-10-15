import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {CONFIG as C} from '../config.js';
import {EVOLUTION_FAMILIES as F,BUILD_PRESETS} from '../expansion-defs.js';
import {CODEX_IDS} from '../codex.js';
import {contentBattle} from './content-simulation.js';
const rows=[],levels=Object.fromEntries(Object.entries(C.upgrades).map(([id,u])=>[id,u.max])),owned=Object.fromEntries(Object.entries(F).map(([id,d])=>[id,Object.keys(d.forms)]));
for(const seed of [31415,1,7,42,99])for(const strategy of ['Crusher','Cascade','Reactor'])for(const duration of [20,32])for(const fx of [true,false]){
 const preset=BUILD_PRESETS[strategy],g=contentBattle({seed,levels,duration,ecologyEnabled:true,advancedEnabled:true,skillExpansionEnabled:true,discoveryRank:4,signatureLoadout:preset.signatures,evolutionOwned:owned,evolutionActive:preset.evolutions,insightUnlocked:CODEX_IDS,relicLoadout:strategy==='Reactor'?['reactorGovernor','ancientResonator']:['ricochetCoil','waveCondenser'],options:{combatFXEnabled:fx,damageVFX:fx,modifierVisuals:fx,reducedMotionEnabled:!fx}}),r=g.record();
 rows.push({seed,strategy,duration,fx,kills:g.totalDestroyed,raw:g.runEarned,photon:r.processedPhoton,advanced:r.advancedCounts,delta:r.codexDelta,elite:r.eliteDelta,caps:r.capCounts,physics:r.physicsChecks,peaks:{shards:r.peakShards,waves:r.peakWaves,scheduled:r.peakScheduled}});
}
for(const row of rows.filter(r=>r.fx)){const other=rows.find(r=>!r.fx&&r.seed===row.seed&&r.strategy===row.strategy&&r.duration===row.duration);for(const key of ['kills','raw','photon','advanced','delta','elite'])assert.deepEqual(other[key],row[key]);}
writeFileSync('artifacts/m11-combination-results.json',JSON.stringify({passed:true,actualRuns:rows.length,method:'5seeds x3 owned MAX build fixtures x20/32s xFX ON/OFF. Actual native battle, all insight fixture for Elite gates. No natural growth claim.',rows},null,2));console.log(`M11 combined battle and FX parity PASS:${rows.length} actual Runs`);
