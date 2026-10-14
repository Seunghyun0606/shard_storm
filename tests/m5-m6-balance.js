import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { seeds,milestones,growthScenario } from './m5-m6-growth.js';
import { simulate } from './simulation.js';
import { CONFIG as C } from '../config.js';
const growth=[],median=xs=>[...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)];
for(const contentMode of ['M5_ONLY','M5_M6_ON'])for(const strategy of ['Crusher','Cascade','Reactor'])for(const seed of seeds){growth.push(growthScenario({seed,strategy,contentMode}));console.log(`${contentMode} ${strategy} ${seed} 50 runs complete`);}
for(const seed of seeds)growth.push(growthScenario({seed,strategy:'Reactor',profile:'legacy_max',count:10}));
const toggles=[];
for(const options of [{},{motionEnabled:false},{refineryEnabled:false},{oreEnabled:false}])for(const seed of seeds)toggles.push({options,seed,...simulate({seed,discoveryRank:4,options:{...C.options,...options},duration:20})});
const repeat=growthScenario({seed:31415,strategy:'Crusher',count:3});const reference=growth.find(g=>g.seed===31415&&g.strategy==='Crusher'&&g.contentMode==='M5_M6_ON');assert.deepEqual(repeat.runs.map(r=>[r.rawEarned,r.refineryPayout,r.totalDestroyed,r.purchasedSkills]),reference.runs.slice(0,3).map(r=>[r.rawEarned,r.refineryPayout,r.totalDestroyed,r.purchasedSkills]));
const summary=[];
for(const mode of ['M5_ONLY','M5_M6_ON'])for(const strategy of ['Crusher','Cascade','Reactor']){
 const paths=growth.filter(g=>g.contentMode===mode&&g.strategy===strategy&&g.profile==='fresh');
 summary.push({mode,strategy,milestones:milestones.map(n=>({run:n,levels:median(paths.map(g=>g.runs[n-1].totalLevels)),bank:median(paths.map(g=>g.runs[n-1].bankAfter)),catalyst:median(paths.map(g=>g.runs[n-1].catalystBalance)),rank:median(paths.map(g=>g.runs[n-1].discoveryRank)),lifetime:median(paths.map(g=>g.runs[n-1].lifetimeDestroyed)),photon:median(paths.map(g=>g.runs[n-1].refineryPayout)),remaining:median(paths.map(g=>g.runs[n-1].remainingLevels))})),rankReached:Object.fromEntries([1,2,3,4].map(r=>[r,paths.map(g=>g.ranksReachedAtRun[r]??null)]))});
}
const warnings=growth.flatMap(g=>{const r=g.runs.at(-1);return[g.runs.some(r=>r.rawOreBonus/r.rawEarned>.15)?`${g.contentMode}/${g.strategy}/${g.seed}: ore share exceeds15%`:null,r.remainingLevels===0?`${g.strategy}/${g.seed}: all max`:null,r.index===50&&r.discoveryRank<4?`${g.strategy}/${g.seed}: Rank4 not reached`:null].filter(Boolean);});
writeFileSync('artifacts/m5-m6-balance.json',JSON.stringify({seeds,milestones,inputPolicy:'auto:density-hp-v1; actual world center, derived attack cadence; real run duration incl Extra Time',testMoney:'none for fresh; legacy fixture bank10000 and old11 max; all sandbox',humanEnjoyment:'not evaluated',simulationCount:1550+20+3,growth,summary,toggles,warnings},null,2));
writeFileSync('artifacts/m5-m6-balance-summary.txt',JSON.stringify({summary,warnings},null,2));console.log('M5 M6 balance PASS');
