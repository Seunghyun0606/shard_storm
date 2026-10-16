import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../game.js';
import {CONFIG as C} from '../config.js';
import {freshSave,loadSave,writeSave} from '../storage.js';
import {settle,stageSettlement,completeSettlement} from '../progression.js';
import {canWorld,canBoss,normalizeCampaign,selectWorld,WORLDS} from '../campaign/worlds.js';
import {bossRecord} from '../campaign/bosses.js';
import {readyWorld,worldGame,playWorld} from './m14-helpers.js';
test('M14 World5/19shapes/49skills/schema10: legacy1..9 no invented clears or lost assets',()=>{
 assert.equal(Object.keys(WORLDS).length,5);assert.equal(Object.keys(C.shapes).length,19);assert.equal(Object.keys(C.upgrades).length,49);assert.equal(C.saveVersion,10);
 for(let version=1;version<=9;version++){const s=freshSave();s.saveVersion=version;s.bank=777;s.catalystBalance=88;s.levels.extraTime=3;s.lifetimeDestroyed=8000;s.elitePity=6;s.lastRuns=[{runId:'legacy',photonsEarned:100,full:{x:[1,2,3]}}];const a=loadSave({getItem:()=>JSON.stringify(s)});assert.equal(a.bank,777);assert.equal(a.levels.extraTime,3);assert.deepEqual(a.lastRuns,s.lastRuns);assert.equal(a.worldSelected,'w1');assert.equal(a.campaignComplete,false);assert.equal(a.worldBossHistory.w5.clears,0);assert.equal(a.elitePity,version>=9?6:0);}
});
test('M14 W2 normal Rank1 allowed but Hex Boss Rank2; selected world cannot change during play/pending',()=>{
 const s=readyWorld('w2',1);assert.equal(canWorld(s,'w2'),true);assert.equal(canBoss(s,'w2'),false);assert.throws(()=>worldGame(s,'w2'),/entry/);assert.ok(worldGame(s,'w2',{bossChallenge:false}));assert.equal(selectWorld(s,'w1','PLAYING'),false);s.pendingSettlement={id:'a'};assert.equal(selectWorld(s,'w1','RESULT'),false);assert.equal(canWorld(freshSave(),'w2'),false);
});
for(const id of Object.keys(WORLDS))test(`M14 ${id}: actual20s tactical destruction, native HP, safe pre-tier placement, settlement/reload once`,()=>{
 const s=readyWorld(id),g=playWorld(s,id);const b=bossRecord(g).boss;
 assert.equal(b.placed,true,b.failure||'layout');assert.equal(b.cleared,true,JSON.stringify(b));assert.ok(b.clearAt<20);assert.equal(g.elapsed,20);assert.equal(g.physicsDebt.discardedPhysicalSeconds,0);assert.equal(g.physicsChecks.lateWaveContacts,0);
 const parts=g.world.boss.parts;for(const a of parts){assert.equal(a.shape.maxHP,C.shapes[a.shape.type].hp);for(const c of parts)if(a!==c)assert.ok(Math.hypot(a.shape.anchorX-c.shape.anchorX,a.shape.anchorY-c.shape.anchorY)>=a.shape.radius+c.shape.radius+C.spawnGap);}
 assert.ok(!g.advancedIntroConsumed.includes('portalGate')||g.totalDestroyed>=45);assert.equal(s.worldBossHistory[id].clears,0);assert.equal(stageSettlement(s,g),true);assert.equal(s.worldBossHistory[id].clears,0);
 delete s.sandbox;let raw;const mem={getItem:()=>raw,setItem:(_,v)=>raw=v};writeSave(mem,s);let a=loadSave(mem);assert.equal(completeSettlement(a),true);assert.equal(a.worldBossHistory[id].clears,1);const bank=a.bank;writeSave(mem,a);a=loadSave(mem);assert.equal(completeSettlement(a),false);assert.equal(a.bank,bank);assert.equal(a.worldBossHistory[id].clears,1);if(id==='w5')assert.equal(a.campaignComplete,true);
});
test('M14 core cannot pay damage or die early; actual failure retains ordinary payout and no World clear',()=>{
 const s=readyWorld('w1',4,freshSave().levels),g=worldGame(s,'w1');while(g.elapsed<.7)g.update(C.step);const core=g.world.boss.parts.find(p=>p.role==='core').shape,before=g.runEarned;
 g.enqueue(core,999,{source:'direct',depth:0,chainId:g.newChain()});g.flush();assert.equal(core.hp,core.maxHP);assert.equal(g.runEarned,before);assert.equal(g.world.boss.open,false);
 const ordinary=g.alive.filter(s=>!s.bossPart).sort((a,b)=>Math.hypot(b.x-core.x,b.y-core.y)-Math.hypot(a.x-core.x,a.y-core.y))[0];g.attack(ordinary.x,ordinary.y);while(g.state==='PLAYING')g.update(C.step);assert.equal(g.world.boss.cleared,false);const payout=g.record().processedPhoton;assert.ok(g.runEarned>0);assert.equal(settle(s,g),true);assert.equal(s.worldBossHistory.w1.failures,1);assert.equal(s.worldBossHistory.w1.clears,0);assert.equal(s.bank,1000+payout);
});
test('M14 unsafe encounter commits no partial parts; ordinary Rank/Tier eligibility unchanged',()=>{
 const s=readyWorld('w5'),g=worldGame(s,'w5');for(let i=0;i<40;i++)g.addShape('triangle',100+i*10,200,0,false,0);while(g.elapsed<.6)g.update(C.step);assert.equal(g.world.boss.placed,false);assert.equal(g.world.boss.parts.length,0);assert.ok(g.world.boss.failure);assert.equal(g.shapes.some(s=>s.bossPart),false);assert.equal(g.highestTier,0);
});

test('M14 Citadel and Singularity gates reject out-of-order native events',()=>{
 for(const id of ['w2','w4']){const g=worldGame(readyWorld(id),id);while(g.elapsed<.7)g.update(C.step);const b=g.world.boss;
 if(id==='w2'){const relay=b.parts.find(p=>p.shape.type==='conductor').shape,hp=relay.hp;g.enqueue(relay,999,{source:'direct',depth:0,chainId:g.newChain()});g.flush();assert.equal(relay.hp,hp);assert.equal(b.latches.transmit,false);}
 else {const phase=b.parts.find(p=>p.shape.type==='phaseCrystal').shape;g.enqueue(phase,1,{source:'direct',depth:0,chainId:g.newChain()});g.flush();assert.equal(b.latches.phase,false);}
 assert.equal(b.open,false);assert.equal(b.cleared,false);
 }
});
test('M14 survey commits only explicitly selected World; old schema9 pending recovers no invented World evidence',()=>{
 const s=readyWorld('w3'),g=playWorld(s,'w3',{bossChallenge:false}),prior=structuredClone(s.worldSurveyProgress);assert.equal(stageSettlement(s,g),true);assert.deepEqual(s.worldSurveyProgress,prior);assert.equal(completeSettlement(s),true);assert.equal(s.worldSurveyProgress.w3.runs,prior.w3.runs+1);assert.deepEqual(s.worldSurveyProgress.w2,prior.w2);assert.equal(completeSettlement(s),false);
 const old=readyWorld('w1'),run=playWorld(old,'w1',{bossChallenge:false});stageSettlement(old,run);delete old.pendingSettlement.worldSnapshot;old.pendingSettlement.saveSchema=9;old.saveVersion=9;const loaded=loadSave({getItem:()=>JSON.stringify(old)});assert.equal(completeSettlement(loaded),true);assert.equal(loaded.worldSurveyProgress.w1.runs,0);assert.equal(loaded.worldBossHistory.w1.clears,0);
});
test('M14 Fresh Rank0 W1 survey is attainable through ordinary causal play',()=>{
 const s=freshSave();s.sandbox=true;for(let i=0;i<4&&!canBoss(s,'w1');i++){const g=playWorld(s,'w1',{bossChallenge:false,seed:31415+i});assert.equal(settle(s,g),true);}assert.equal(canBoss(s,'w1'),true);assert.equal(canWorld(s,'w2'),false);
});

test('M14 W1 empty build and W4 Rank3 can actually clear without Rank4 Ancient',()=>{
 for(const [id,rank] of [['w1',0],['w4',3]]){const s=readyWorld(id,rank,id==='w1'?freshSave().levels:undefined),g=playWorld(s,id);assert.equal(g.world.boss.cleared,true);if(rank===3)assert.equal(g.shapes.some(s=>s.type==='ancient'),false);}
});
