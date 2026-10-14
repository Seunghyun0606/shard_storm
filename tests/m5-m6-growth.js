import { CONFIG as C } from '../config.js';
import { simulate } from './simulation.js';
import { freshSave, writeSave } from '../storage.js';
import { settle, buyUpgrade } from '../progression.js';
import { skillDefinitions, skillState } from '../skill-tree.js';
import assert from 'node:assert/strict';
export const seeds=[31415,1,7,42,99],milestones=[1,3,5,10,20,30,50];
const priorities={Crusher:['crushPower','crushSpeed','impactPulse','precisionFracture','yieldStabilizer','rareSeparator'],Cascade:['shardPower','shardRange','shardBloom','ricochetPlus','fragmentRelay','kineticReach'],Reactor:['chainAmplifier','echoCatalyst','yieldStabilizer','rareSeparator','resonanceLayer','salvageScanner','catalystChannel']};
export function growthScenario({seed,strategy,profile='fresh',contentMode='M5_M6_ON',count=50,options={}}){
  const save={...freshSave(),sandbox:true},runs=[],ranksReachedAtRun={},firstRareFoundAtRun={},highTierShapesEncountered={},purchasedSkillIds=new Set();
  if(profile==='legacy_max'){save.bank=10000;for(const [k,u] of Object.entries(C.upgrades))if(!u.rank)save.levels[k]=u.max;save.knownHistoryKills=1000;}
  let spentPhoton=0,earnedPhoton=0;
  for(let index=1;index<=count;index++){
    const bankBefore=save.bank,levelsBefore={...save.levels},rankBefore=save.discoveryRank;
    const r=simulate({seed,levels:save.levels,duration:20+2*save.levels.extraTime,runId:`${contentMode}-${profile}-${strategy}-${seed}-${index}`,discoveryRank:save.discoveryRank,welcomeFlags:save.milestoneWelcomeFlags,contentMode,options:{...C.options,...options}});
    const g={state:'RESULT',ruleset:'v09',sandbox:true,runId:r.runId,runEarned:r.rawEarned,refinery:r.refinery,pendingCatalyst:r.pendingCatalyst,record:()=>r};
    assert.equal(settle(save,g),true);assert.equal(settle(save,g),false);earnedPhoton+=r.photonsEarned;
    for(let rank=rankBefore+1;rank<=save.discoveryRank;rank++)ranksReachedAtRun[rank]=index;
    for(const [k,n] of Object.entries(r.oreKills))if(k!=='common'&&n&&!firstRareFoundAtRun[k])firstRareFoundAtRun[k]=index;
    for(const [k,v] of Object.entries(r.typeStats))if(C.shapes[k].special&&v.spawnCount)highTierShapesEncountered[k]=(highTierShapesEncountered[k]||0)+v.spawnCount;
    const purchasedSkills=[];const upgradesAffordable=skillDefinitions.filter(n=>skillState(n.id,save.levels,save.bank,save).canBuy).map(n=>n.id);
    for(let j=0;j<100;j++){
      const keys=[...priorities[strategy],...Object.keys(C.upgrades)];
      const key=keys.find(k=>skillState(k,save.levels,Infinity,{...save,catalystBalance:Infinity}).canBuy);if(!key)break;
      const before=save.bank;if(!buyUpgrade(save,key,'RESULT'))break;spentPhoton+=before-save.bank;purchasedSkills.push(key);purchasedSkillIds.add(key);
    }
    const totalLevels=Object.values(save.levels).reduce((a,b)=>a+b,0),maxLevels=Object.values(C.upgrades).reduce((a,u)=>a+u.max,0);
    runs.push({index,runId:r.runId,seed,profile,inputPolicy:r.inputPolicy,ruleset:r.ruleset,contentMode,configuredDuration:r.durationSeconds,actualDuration:r.elapsed,runTier:r.highestTier,directKills:r.directKills,chainKills:r.cascadeKills,bestChain:r.bestChain,totalDestroyed:r.totalDestroyed,rawBase:r.rawBase,rawOreBonus:r.rawOreBonus,rawSkillBonus:r.rawSkillBonus,rawEarned:r.rawEarned,refineryPayout:r.photonsEarned,bankBefore,bankAfter:save.bank,catalystBalance:save.catalystBalance,catalystPayout:r.pendingCatalyst,rewardsBySource:r.rewardsBySource,skillLevels:{...save.levels},levelsBefore,purchasedSkills,upgradesAffordable,refineryMultiplier:r.refinery?.multiplier,fps:null,tickP95:r.simulationStepP95ms,capHits:r.capCounts,skippedEvents:r.skippedEvents,motionMisses:r.missedClicks,refinerySkip:null,totalRuns:save.totalRuns,lifetimeDestroyed:save.lifetimeDestroyed,discoveryRank:save.discoveryRank,knownHistoryKills:save.knownHistoryKills,spentPhoton,earnedPhoton,totalLevels,remainingLevels:maxLevels-totalLevels,oreKills:r.oreKills,typeStats:r.typeStats,skillActivations:r.skillActivations,physicsChecks:r.physicsChecks,patternCounts:r.patternCounts});
    assert.equal(save.totalRuns,index);assert.ok(save.bank>=0&&save.catalystBalance>=0);assert.ok(Math.abs(r.rawBase+r.rawOreBonus+r.rawSkillBonus-r.rawEarned)<1e-9);
  }
  assert.equal(writeSave({setItem(){throw Error('Live write forbidden');}},save),false);
  return{seed,strategy,profile,contentMode,ranksReachedAtRun,firstRareFoundAtRun,highTierShapesEncountered,purchasedSkillIds:[...purchasedSkillIds],unlocksSeen:[...new Set(runs.flatMap(r=>Object.keys(r.typeStats).filter(k=>r.typeStats[k].spawnCount)))],runs};
}
