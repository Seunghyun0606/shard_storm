import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../game.js';
import {CONFIG as C} from '../config.js';
import {directorInterval,directorDeath,directorDamage,eliteChoice,directorRecord,SUPPLY_PROFILES} from '../spawn-director.js';
import {tryElite} from '../elites.js';
import {attemptSummary} from '../codex-attempts.js';
import {codexDeath,codexContact,codexEvent} from '../codex.js';

const empty=opts=>{const g=new Game({sandbox:true,...opts});g.shapes=[];g.shards=[];g.waves=[];g.queue=[];return g;};
test('M12 scheduler: 1000 exhausted budget fixtures preserve every event and all physical time',()=>{
 for(let seed=0;seed<1000;seed++){
  const g=empty({seed});let n=0;const times=[];
  for(let i=1;i<=600;i++)g.scheduleEvent({kind:'effect',priority:1,scheduledTime:i/1000000,action:()=>{n++;times.push(g.simulationTime);}});
  const shard=g.emitShard(200,200,0,'triangle',g.newChain(),0);
  g.update(.001);
  assert.equal(n,600);assert.equal(g.queue.length,0);assert.equal(g.elapsed,.001);
  assert.equal(g.physicsDebt.discardedPhysicalSeconds,0);assert.equal(g.physicsDebt.budgetYields,1);assert.ok(g.physicsDebt.maxDebtSeconds>0);
  assert.ok(Math.abs(shard.distance-.7)<1e-9);assert.equal(g.physicsChecks.lateWaveContacts,0);assert.equal(g.runEarned,0);
  assert.ok(times.every((t,i)=>!i||t>times[i-1]));g.update(.001);assert.equal(n,600);
 }
});
test('M12 Codex: exact source attempts distinguish auxiliary kills, one-sector and Fuse timing',()=>{
 const g=empty({advancedEnabled:true,ecologyEnabled:true});
 const cause={source:'pentagon',small:false,originShapeId:25,chainId:g.newChain(),depth:0};
 for(let id=101;id<=103;id++)codexDeath(g,{id,type:'triangle'},cause,null);
 codexDeath(g,{id:104,type:'triangle'},{...cause,small:true},null);
 const row=attemptSummary(g).find(r=>r.id==='pentagon');assert.equal(row.actual,3);assert.equal(row.success,false);assert.match(row.reason,/Auxiliary kills 1/);
 const lens={source:'prismRefraction',originShapeId:30,sectorIndex:0,chainId:cause.chainId};codexContact(g,{id:120},lens,{id:1,cause:lens});
 assert.match(attemptSummary(g).find(r=>r.id==='prismLens').reason,/second sector/);
 codexContact(g,{id:120},{...lens,sectorIndex:1},{id:2,cause:lens});assert.match(attemptSummary(g).find(r=>r.id==='prismLens').reason,/same target/);
 codexContact(g,{id:121},{...lens,sectorIndex:1},{id:2,cause:lens});assert.equal(attemptSummary(g).find(r=>r.id==='prismLens').success,true);
 codexEvent(g,'fuseExploded',{id:130},cause);g.elapsed=1.1;codexEvent(g,'fuseExploded',{id:131},cause);assert.equal(attemptSummary(g).find(r=>r.id==='fuseBomb').success,false);
 g.elapsed=1.5;codexEvent(g,'fuseExploded',{id:132},cause);assert.equal(attemptSummary(g).find(r=>r.id==='fuseBomb').success,true);
});
test('M12 Codex attempts exclude debug and Echo; no speculation without real events',()=>{
 const g=empty({advancedEnabled:true,ecologyEnabled:true});assert.deepEqual(attemptSummary(g),[]);
 for(const flags of [{echo:true},{fixture:true}])codexDeath(g,{id:2,type:'triangle',...flags},{source:'pentagon',originShapeId:1,small:false},null);
 assert.deepEqual(attemptSummary(g),[]);
});
test('M12 scheduler: actual seed2 early static tangency terminates without skipped time',()=>{
 const levels=Object.fromEntries(Object.entries(C.upgrades).map(([id,u])=>[id,u.max]));
 const g=new Game({seed:2,levels,discoveryRank:4,ecologyEnabled:true,advancedEnabled:true,skillExpansionEnabled:true,sandbox:true});g.attack(480,335);
 while(g.elapsed<.5)g.update(C.step);
 assert.equal(g.physicsDebt.discardedPhysicalSeconds,0);assert.ok(g.physicsDebt.budgetYields>=1);assert.ok(g.totalDestroyed>=4);assert.ok(g.physicsChecks.maxProjectileContactError<.002);
});
test('M12 scheduler: deadline event excluded, predeadline event finishes once',()=>{
 const g=empty({duration:.01}),seen=[];
 for(const at of [.009,.01,.011])g.scheduleEvent({kind:'effect',priority:1,scheduledTime:at,action:()=>seen.push(at)});
 g.update(.01);assert.deepEqual(seen,[.009]);assert.equal(g.state,'RESULT');g.update(1);assert.deepEqual(seen,[.009]);
});
test('M12 corrected static contacts and debt are independent of FX and Reduced Motion',()=>{
 const levels=Object.fromEntries(Object.entries(C.upgrades).map(([id,u])=>[id,u.max])),results=[];
 for(const enabled of [true,false]){
  const g=new Game({seed:2,levels,discoveryRank:4,ecologyEnabled:true,advancedEnabled:true,skillExpansionEnabled:true,sandbox:true,duration:1,options:{combatFXEnabled:enabled,damageVFX:enabled,comboFeedback:enabled,reducedMotionEnabled:!enabled}});
  g.attack(480,335);while(g.state==='PLAYING')g.update(C.step);
  results.push({kills:g.totalDestroyed,raw:g.runEarned,catalyst:g.pendingCatalyst,codex:g.codexDelta,debt:g.physicsDebt.budgetYields,physics:g.physicsChecks});
 }assert.deepEqual(results[0],results[1]);
});
test('M12 supply: declarative 15/18/21/24/30 candidates vary interval only',()=>{
 assert.deepEqual(Object.values(SUPPLY_PROFILES).map(p=>p.rate),[15,18,21,24,30]);for(const p of Object.values(SUPPLY_PROFILES)){assert.equal(p.batch,3);assert.equal(p.batch/p.interval,p.rate);}
});
test('M12 supply: no early, Rank0 or idle escalation; sustained real destruction activates with hysteresis',()=>{
 const g=empty({discoveryRank:4,supplyProfile:'M12_elastic24'});
 const feed=at=>{g.elapsed=at;g.remaining=g.duration-at;g.director.recentDeaths=Array.from({length:50},(_,i)=>at-i*.06);directorDamage(g,1);return directorInterval(g,.2);};
 assert.equal(feed(2),.2);assert.equal(feed(3),.2);assert.equal(feed(4.9),.2);assert.equal(feed(5),.125);
 g.elapsed=7;assert.equal(directorInterval(g,.2),.2);assert.equal(g.director.transitions.at(-1).reason,'idle');
 assert.equal(feed(8),.2);assert.equal(feed(10),.2);assert.equal(feed(12),.125);
 const fresh=empty({discoveryRank:0,supplyProfile:'M12_elastic30'});fresh.elapsed=8;for(let i=0;i<60;i++)directorDeath(fresh,{echo:false});directorDamage(fresh,1);assert.equal(directorInterval(fresh,.2),.2);fresh.elapsed=11;assert.equal(directorInterval(fresh,.2),.2);
});
test('M12 supply: consecutive unsafe placements fall back and no extra budget from Echo',()=>{
 const g=empty({discoveryRank:4,supplyProfile:'M12_elastic30'});g.elapsed=8;g.director.high=true;g.director.failures=3;directorDamage(g,1);assert.equal(directorInterval(g,.2),.2);directorDeath(g,{echo:true});assert.equal(g.director.recentDeaths.length,0);
});
test('M12 unadopted supply and Elite choices cannot alter live user settings',()=>{
 assert.throws(()=>new Game({supplyProfile:'M12_elastic24'}),/sandbox/);assert.throws(()=>new Game({elitePolicy:'M12_run25'}),/sandbox/);assert.equal(new Game({elitePolicy:'M12_run20_pity6'}).director.policy,'M12_run20_pity6');
});
test('M12 Elite: 100 repeated calls sample one eligible Run once; force and introduction separate',()=>{
 const g=empty({elitePolicy:'M12_run20_pity6'});let calls=0;g.directorEliteRng=()=>{calls++;return .9;};
 for(let i=0;i<100;i++)assert.equal(eliteChoice(g,['bombReactor'],null,null),null);
 assert.equal(calls,1);assert.equal(directorRecord(g).elite.pityNext,1);
 const intro=empty({elitePolicy:'M12_run20_pity6',elitePity:5});assert.equal(eliteChoice(intro,['bombReactor'],'bombReactor',null),'bombReactor');assert.equal(directorRecord(intro).elite.pityNext,5);
 const fixture=empty({elitePolicy:'M12_run20_pity6'});eliteChoice(fixture,['bombReactor'],null,'bombReactor');assert.equal(fixture.director.elite.eligible,false);
});
test('M12 Elite: sixth missed eligible Run preserves guaranteed attempt on unsafe placement, success resets',()=>{
 const g=empty({elitePolicy:'M12_run20_pity6',elitePity:6});g.directorEliteRng=()=>.99;assert.equal(eliteChoice(g,['bombReactor'],null,null),'bombReactor');assert.equal(directorRecord(g).elite.pityNext,6);g.director.elite.naturalSpawned=true;assert.equal(directorRecord(g).elite.pityNext,0);
});
test('M12 Elite: real encounter placement and payout once, max1 per Run',()=>{
 const g=empty({advancedEnabled:true,ecologyEnabled:true,discoveryRank:4,insightUnlocked:Object.keys(C.shapes),elitePolicy:'M12_run20_pity6',elitePity:6});g.highestTier=4;g.eliteHistory=Object.fromEntries(['bombReactor','mirrorGravity','shieldConductor','phaseRepair','portalBeacon','ancientPrism'].map(id=>[id,{spawned:1}]));
 const parts=tryElite(g);assert.ok(parts?.length);assert.equal(g.director.elite.naturalSpawned,true);assert.equal(tryElite(g),null);
 const core=parts[0];core.vulnerableAt=0;g.enqueue(core,1000,{source:'direct',chainId:g.newChain(),depth:0});g.flush();assert.equal(g.eliteDelta[core.eliteId].kills,1);const balance=g.pendingCatalyst;g.flush();assert.equal(g.pendingCatalyst,balance);
});
