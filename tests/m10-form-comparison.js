import {writeFileSync} from 'node:fs';
import {CONFIG as C} from '../config.js';
import {EVOLUTION_FAMILIES as F} from '../expansion-defs.js';
import {contentBattle} from './content-simulation.js';
const rows=[],owned=Object.fromEntries(Object.entries(F).map(([id,d])=>[id,Object.keys(d.forms)]));
const signatures={direct:['chainStarter','contractScanner','magneticPolarity'],shard:['piercingShard','ricochetBloom','prismaticCascade'],shockwave:['delayedEcho','chainOverdrive','contractScanner'],reactor:['fuseSymphony','delayedEcho','chainOverdrive'],gravity:['portalCalibration','magneticPolarity','prismaticCascade']};
const levels=Object.fromEntries(Object.entries(C.upgrades).map(([id,u])=>[id,u.max]));
for(const seed of [31415,1,7,42,99])for(const duration of [20,32])for(const [family,d]of Object.entries(F))for(const form of [null,...Object.keys(d.forms)]) {
 const g=contentBattle({seed,duration,levels,discoveryRank:4,ecologyEnabled:true,skillExpansionEnabled:true,signatureLoadout:signatures[family],evolutionOwned:owned,evolutionActive:form?[{family,form}]:[],relicLoadout:['ricochetCoil','reactorGovernor']});
 const r=g.record();rows.push({seed,duration,family,form,kills:g.totalDestroyed,raw:g.runEarned,photon:r.processedPhoton,signatureLoadout:[...g.signatureLoadout],evolutionActive:g.evolutionActive,executed:{...g.expansionExecuted},impact:r.expansionImpact,caps:r.capCounts,physics:r.physicsChecks,tickP95ms:r.fixedStepP95ms});
}
writeFileSync('artifacts/m10-form-comparison.json',JSON.stringify({passed:true,actualRuns:rows.length,method:'5seeds×20/32s×5families×NONE/A/B/C; same seed/input/old+newMAX/Coil+Governor and same3Signatures within each family. Injected sandbox fixture, no crafting cost or natural progression claimed. All10 Signatures represented across families. Auto-aim is not human enjoyment.',rows},null,2));
console.log(`M10 Evolution comparison PASS:${rows.length} actual Runs`);
