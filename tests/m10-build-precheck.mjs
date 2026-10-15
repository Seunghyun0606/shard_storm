// Preparatory pure-state checks; not a substitute for integrated combat QA.
import assert from 'node:assert/strict';
import {SIGNATURE_IDS,EVOLUTION_FAMILIES,EVOLUTION_COSTS,EXPANSION_SKILLS} from '../expansion-defs.js';
import {toggleSignature,craftEvolution,activateEvolution,applyBuildPreset,normalizeEvolutionOwned,normalizeEvolutionActive,normalizeSignatures} from '../builds.js';
const levels=Object.fromEntries(Object.entries(EXPANSION_SKILLS).map(([id,d])=>[id,d.max]));
for(const d of Object.values(EVOLUTION_FAMILIES))levels[d.prerequisite.id]=d.prerequisite.minLevel;
const save={levels,discoveryRank:4,bank:100000,catalystBalance:10000,signatureLoadout:[],evolutionOwned:{},evolutionActive:[],pendingSettlement:null};
for(const id of SIGNATURE_IDS.slice(0,3))assert.equal(toggleSignature(save,id,'TITLE'),true);
assert.equal(toggleSignature(save,SIGNATURE_IDS[3],'TITLE'),false);
assert.equal(toggleSignature(save,SIGNATURE_IDS[0],'PLAYING'),false);
assert.equal(toggleSignature(save,SIGNATURE_IDS[0],'RESULT'),true);
assert.deepEqual(normalizeSignatures(['unknown',SIGNATURE_IDS[1],SIGNATURE_IDS[1]],levels),[SIGNATURE_IDS[1]]);
let photonSpent=0,catalystSpent=0,crafted=0;
for(const[family,d]of Object.entries(EVOLUTION_FAMILIES))for(const[form,index]of Object.keys(d.forms).map((form,index)=>[form,index])) {
 const bank=save.bank,catalyst=save.catalystBalance;
 assert.equal(craftEvolution(save,family,form,'TITLE'),false);
 assert.equal(craftEvolution(save,family,form,'RESULT'),true);
 assert.equal(bank-save.bank,EVOLUTION_COSTS[index].photon);assert.equal(catalyst-save.catalystBalance,EVOLUTION_COSTS[index].catalyst);
 assert.equal(craftEvolution(save,family,form,'RESULT'),false);assert.deepEqual(save.evolutionActive,[]);
 photonSpent+=EVOLUTION_COSTS[index].photon;catalystSpent+=EVOLUTION_COSTS[index].catalyst;crafted++;
}
assert.equal(crafted,15);assert.equal(save.bank,100000-photonSpent);assert.equal(save.catalystBalance,10000-catalystSpent);
assert.equal(activateEvolution(save,'direct','focusStrike','TITLE'),true);
assert.equal(activateEvolution(save,'shard','piercing','TITLE'),true);
assert.equal(activateEvolution(save,'gravity','pull','TITLE'),false);
assert.equal(activateEvolution(save,'direct','armorBypass','TITLE'),true);
assert.equal(save.evolutionActive.length,2);assert.equal(save.evolutionActive.filter(r=>r.family==='direct').length,1);
assert.equal(activateEvolution(save,'direct',null,'TITLE'),true);
assert.equal(activateEvolution(save,'gravity','pull','TITLE'),true);
assert.equal(activateEvolution(save,'gravity','push','PLAYING'),false);
for(const key of ['Crusher','Cascade','Reactor']) {
 assert.equal(applyBuildPreset(save,key,'TITLE'),true);assert.ok(save.signatureLoadout.length<=3&&save.evolutionActive.length<=2);
 assert.ok(save.evolutionActive.every(r=>save.evolutionOwned[r.family].includes(r.form)));
}
const malformed={direct:['unknown','armorBypass','armorBypass']},owned=normalizeEvolutionOwned(malformed);
assert.deepEqual(owned.direct,['armorBypass']);assert.deepEqual(normalizeEvolutionActive([{family:'direct',form:'unknown'},{family:'direct',form:'armorBypass'},{family:'direct',form:'armorBypass'}],owned),[{family:'direct',form:'armorBypass'}]);
save.pendingSettlement={id:'pending'};assert.equal(toggleSignature(save,SIGNATURE_IDS[0],'RESULT'),false);assert.equal(activateEvolution(save,'gravity',null,'RESULT'),false);
console.log('M10 preparatory build-state checks PASS:15 actual crafts, costs/ownership/duplicates/slots/presets/state locks; combat integration not yet verified');
