import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../config.js';
import { simulate } from './simulation.js';
import { freshSave, writeSave } from '../storage.js';
import { settle, buyUpgrade, emptyLevels } from '../progression.js';
import { buildPresets, nextPurchase, affordableNodes } from '../economy.js';

const seeds=[31415,1,7,42,99], median = xs => [...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)];
const scenarios=[
  {name:'v08_20',ruleset:'legacy_v08',options:{motionEnabled:false}},
  {name:'v09_static',options:{motionEnabled:false}},
  {name:'v09_motion',options:{motionEnabled:true}},
  {name:'v09_no_refinery',options:{motionEnabled:true,refineryEnabled:false}},
  {name:'v09_no_modifiers',options:{motionEnabled:true,modifiers:false}},
  {name:'v09_legacy_tiers',tierPreset:'legacy_tiers',options:{motionEnabled:false}}
];
const summary=runs=>({runs:runs.length,killsMedian:median(runs.map(r=>r.totalDestroyed)),killsRange:[Math.min(...runs.map(r=>r.totalDestroyed)),Math.max(...runs.map(r=>r.totalDestroyed))],rawMedian:median(runs.map(r=>r.rawEarned)),photonMedian:median(runs.map(r=>r.photonsEarned)),chainMedian:median(runs.map(r=>r.bestChain)),cascadeRatioMedian:median(runs.map(r=>r.cascadeKills/Math.max(1,r.totalDestroyed))),capsMedian:median(runs.map(r=>r.safetyCapsHit)),p95MedianMs:median(runs.map(r=>r.simulationStepP95ms)),maxEmpty:Math.max(...runs.map(r=>r.emptyArenaDuration)),projectileHitRateMedian:median(runs.map(r=>r.projectileHitRate))});
const comparisons=[];
for(const scenario of scenarios) for(const build of ['Baseline','Upgraded','Crusher','Cascade','Reactor']) {
  const runs=seeds.map(seed=>simulate({...scenario,seed,levels:{...emptyLevels(),...buildPresets[build]},duration:20}));
  comparisons.push({scenario:scenario.name,build,summary:summary(runs),runs});
}
const utilities=[];
for(const build of ['Baseline','ExtraTime','PhotonBoost','UtilityMax']){
  const levels={...emptyLevels(),...buildPresets[build]},fixed=seeds.map(seed=>simulate({seed,levels,duration:20})),duration=20+levels.extraTime*2;
  const actual=duration===20?fixed:seeds.map(seed=>simulate({seed,levels,duration}));utilities.push({build,duration,fixed20:summary(fixed),actual:summary(actual),normalizedPhoton20:median(actual.map(r=>r.photonsEarned*20/r.durationSeconds))});
}
console.log('20s mechanics and Utility comparisons complete.');
const growth=[];
for(const profile of ['fresh','legacy_max']) for(const strategy of ['Crusher','Cascade','Reactor']) for(const seed of seeds){
  const source=freshSave();if(profile==='legacy_max'){source.bank=10000;source.levels=Object.fromEntries(Object.entries(C.upgrades).map(([k,v])=>[k,v.max]));source.knownHistoryKills=1000;}
  const save={...structuredClone(source),sandbox:true},runs=[];let purchases=0;
  for(let index=1;index<=10;index++){
    const before=save.bank,r=simulate({seed,levels:{...save.levels},duration:20+save.levels.extraTime*2,runId:`${profile}-${strategy}-${seed}-${index}`});
    const run={state:'RESULT',ruleset:'v09',sandbox:true,settled:false,runId:r.runId,refinery:r.refinery,runEarned:r.rawEarned,record:()=>r};
    assert.equal(settle(save,run),true);assert.equal(settle(save,run),false);
    const available=affordableNodes(save.levels,save.bank),buys=[];
    for(let i=0;i<100;i++){const key=nextPurchase(save.levels,strategy);if(!key||!buyUpgrade(save,key,'RESULT'))break;buys.push(key);purchases++;}
    runs.push({index,duration:r.durationSeconds,raw:r.rawEarned,photon:r.photonsEarned,bankBefore:before,bankAfter:save.bank,purchases:buys,totalPurchases:purchases,affordableBeforeBuying:available.length,remainingLevels:35-Object.values(save.levels).reduce((a,b)=>a+b,0),levels:{...save.levels},kills:r.totalDestroyed,caps:r.safetyCapsHit});
  }
  assert.equal(source.bank,profile==='fresh'?0:10000);assert.equal(source.totalRuns,0);assert.equal(writeSave({setItem(){throw Error('must not write');}},save),false);
  growth.push({profile,strategy,seed,runs});
}
const growthSummary=[];
for(const profile of ['fresh','legacy_max']) for(const strategy of ['Crusher','Cascade','Reactor']){
  const group=growth.filter(g=>g.profile===profile&&g.strategy===strategy);growthSummary.push({profile,strategy,milestones:[1,3,5,10].map(index=>({run:index,purchasesMedian:median(group.map(g=>g.runs[index-1].totalPurchases)),remainingMedian:median(group.map(g=>g.runs[index-1].remainingLevels)),bankMedian:median(group.map(g=>g.runs[index-1].bankAfter))}))});
}
const repeat=simulate({seed:31415}),ref=comparisons.find(c=>c.scenario==='v09_motion'&&c.build==='Baseline').runs[0];assert.equal(repeat.rawEarned,ref.rawEarned);assert.equal(repeat.photonsEarned,ref.photonsEarned);
const output={seeds,inputPolicy:'auto:density-hp-v1; same score and derived cadence; aim at current world center',interpretation:'automatic diagnostic only; no human enjoyment or aim accuracy claim',comparisons,utilities,growth,growthSummary};
writeFileSync('artifacts/v09-balance-results.json',JSON.stringify(output,null,2));
console.log(JSON.stringify({comparisons:comparisons.map(c=>({scenario:c.scenario,build:c.build,...c.summary})),utilities,growthSummary},null,2));
