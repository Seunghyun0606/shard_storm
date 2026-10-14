import { writeFileSync } from 'node:fs';
import { CONFIG as C } from '../config.js';
import { simulate } from './simulation.js';
import { freshSave } from '../storage.js';
import { settle, buyUpgrade } from '../progression.js';
import { nextPurchase } from '../economy.js';
const seeds=[31415,1,7,42,99], growth=[];
for(const profile of ['fresh','legacy_max']) for(const strategy of ['Crusher','Cascade','Reactor']) for(const seed of seeds){
  const save={...freshSave(),sandbox:true}; if(profile==='legacy_max'){save.bank=10000; for(const [k,u] of Object.entries(C.upgrades))save.levels[k]=u.max;}
  const runs=[];let purchases=0;
  for(let index=1;index<=50;index++){
    const bankBefore=save.bank,r=simulate({seed,levels:save.levels,duration:20+2*save.levels.extraTime,runId:`before-${profile}-${strategy}-${seed}-${index}`});
    settle(save,{state:'RESULT',ruleset:'v09',sandbox:true,runId:r.runId,runEarned:r.rawEarned,refinery:r.refinery,record:()=>r});
    const bought=[];for(let j=0;j<100;j++){const key=nextPurchase(save.levels,strategy);if(!key||!buyUpgrade(save,key,'RESULT'))break;bought.push(key);purchases++;}
    runs.push({index,bankBefore,bankAfter:save.bank,purchases:bought,totalPurchases:purchases,levels:{...save.levels},kills:r.totalDestroyed,raw:r.rawEarned,photon:r.photonsEarned,duration:r.durationSeconds,tickP95:r.simulationStepP95ms,caps:r.capCounts});
  }
  growth.push({profile,strategy,seed,runs});console.log(`${profile} ${strategy} ${seed} complete`);
}
writeFileSync('artifacts/m5-m6-before.json',JSON.stringify({baseCommit:'f90d7de',seeds,inputPolicy:'auto:density-hp-v1',growth},null,2));
