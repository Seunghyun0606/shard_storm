import assert from 'node:assert/strict';
import {CONFIG as C} from '../config.js';
import {freshSave} from '../storage.js';
import {settle,buyUpgrade} from '../progression.js';
import {skillState} from '../skill-tree.js';
import {craftRelic,equipRelic} from '../relics.js';
import {acceptContract,snapshotContracts} from '../contracts.js';
import {ensureOffer,selectAnomaly,consumeOffer} from '../anomalies.js';
import {EXPANSION_SKILLS,EVOLUTION_FAMILIES,BUILD_PRESETS} from '../expansion-defs.js';
import {craftEvolution,applyBuildPreset} from '../builds.js';
import {contentBattle} from './content-simulation.js';

const priorities={
 Crusher:['crushPower','crushSpeed','impactPulse','precisionFracture','weakpointScanner','armorShatter','markedTarget','chainStarter','executionPulse','targetIntercept','precisionSalvage'],
 Cascade:['shardPower','shardRange','shardBloom','ricochetPlus','fragmentRelay','piercingShard','angularSplit','mirrorReturn','ricochetBloom','portalMomentum','prismaticCascade'],
 Reactor:['chainAmplifier','echoCatalyst','yieldStabilizer','resonanceLayer','fuseAccelerator','conductiveSurge','delayedEcho','resonanceBurst','chainOverdrive','fuseSymphony']
};
export function expandedGrowth(spec,checkpoint=null,onCheckpoint=()=>{}) {
 const save=checkpoint?.save||freshSave(),rows=checkpoint?.rows||[];save.sandbox=true;
 const enabled=spec.feature!=='M9',withSignatures=['Signature3','Evolution2'].includes(spec.feature),withEvolution=spec.feature==='Evolution2';
 if(!checkpoint) {
  save.anomalySeed=`m10-${spec.seed}`;
  if(spec.profile==='LegacyMax') {
   save.bank=10000;save.catalystBalance=200;save.lifetimeDestroyed=8000;save.discoveryRank=4;
   for(const[k,u]of Object.entries(C.upgrades))if(!EXPANSION_SKILLS[k])save.levels[k]=u.max;
  }
 }
 const allowed=Object.keys(C.upgrades).filter(id=>enabled||!EXPANSION_SKILLS[id]),priority=[...priorities[spec.strategy],...allowed].filter(id=>allowed.includes(id));
 for(let run=rows.length+1;run<=spec.count;run++) {
  for(const id of Object.keys(C.relics))craftRelic(save,id,'RESULT');save.relicEquipped=[];
  const owned=[...save.relicOwned];if(spec.strategy==='Reactor')owned.sort((a,b)=>Number(b==='reactorGovernor')-Number(a==='reactorGovernor'));
  for(const[slot,id]of owned.slice(0,2).entries())equipRelic(save,id,slot,'RESULT');
  for(const id of Object.keys(C.contracts))acceptContract(save,id,'RESULT');
  ensureOffer(save);selectAnomaly(save,null,'RESULT');consumeOffer(save);
  if(withEvolution)for(const[family,d]of Object.entries(EVOLUTION_FAMILIES))for(const form of Object.keys(d.forms))craftEvolution(save,family,form,'RESULT');
  applyBuildPreset(save,spec.strategy,'RESULT');
  if(!withSignatures)save.signatureLoadout=[];if(!withEvolution)save.evolutionActive=[];
  const signatureSnapshot=[...save.signatureLoadout],evolutionSnapshot=structuredClone(save.evolutionActive);
  const g=contentBattle({seed:spec.seed+run*7919,runId:`${spec.key}-${run}`,levels:save.levels,discoveryRank:save.discoveryRank,duration:spec.time==='Fixed20'?20:undefined,
   ecologyEnabled:true,skillExpansionEnabled:enabled,signatureLoadout:signatureSnapshot,evolutionOwned:save.evolutionOwned,evolutionActive:evolutionSnapshot,
   introSeen:save.shapeIntroSeen,welcomeFlags:save.milestoneWelcomeFlags,relicLoadout:save.relicEquipped,activeContracts:snapshotContracts(save)});
  assert.equal(settle(save,g),true);assert.equal(settle(save,g),false);
  for(let n=0;n<100;n++){const id=priority.find(id=>skillState(id,save.levels,save.bank,save).canBuy);if(!id||!buyUpgrade(save,id,'RESULT'))break;}
  const record=g.record();
  rows.push({run,rank:save.discoveryRank,seed:g.seed,kills:g.totalDestroyed,raw:g.runEarned,photon:record.processedPhoton,bank:save.bank,catalyst:save.catalystBalance,
   levels:Object.values(save.levels).reduce((a,b)=>a+b,0),remainingNodes:allowed.filter(id=>save.levels[id]<C.upgrades[id].max).length,
   signatureLoadout:signatureSnapshot,evolutionActive:evolutionSnapshot,evolutionOwned:structuredClone(save.evolutionOwned),duration:g.duration,
   expansionExecuted:{...g.expansionExecuted},skillActivations:record.skillActivations,ecologyCounts:record.ecologyCounts,chain:g.bestChain,calibrationPhoton:g.calibrationPhoton,
   blank:record.emptyArenaDuration,tickP95ms:record.fixedStepP95ms,caps:record.capCounts,physics:record.physicsChecks,peaks:{shards:record.peakShards,waves:record.peakWaves,scheduled:record.peakScheduled}});
  // Experiment checkpoints retain the actual20 recent settlement summaries but
  // omit large per-event/render/bin arrays. Aggregate causal counters above are
  // measured before compaction. This never touches production storage or Game.
  for(const history of save.lastRuns)for(const field of ['causalLog','ecologyEvents','expansionEvents','skillEvents','rewardsBySource','bins','bins5','comboEvents','stageEvents','secondShardPeaks'])delete history[field];
  assert.equal(save.totalRuns,run);assert.ok(save.bank>=0&&save.catalystBalance>=0);
  if(run%10===0||run===spec.count)onCheckpoint({spec,save,rows});
 }
 return {spec,save,rows};
}
