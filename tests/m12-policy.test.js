import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../game.js';
import {CONFIG as C} from '../config.js';
import {freshSave,loadSave,writeSave} from '../storage.js';
import {stageSettlement,completeSettlement} from '../progression.js';
import {eliteChoice,LIVE_ELITE_POLICY} from '../spawn-director.js';
import {encodeSave} from '../save-codec.js';
import {attemptSummary} from '../codex-attempts.js';
import {codexDeath} from '../codex.js';
const memory=()=>{let raw=null;return {getItem:()=>raw,setItem:(k,v)=>{assert.equal(k,'shard-storm-v1');raw=v;}};};
test('M12 approved A: schema9 preserves schema1..8 assets, records and initializes pity without retrocredit',()=>{
 for(let version=1;version<=8;version++){
  const s=freshSave();s.saveVersion=version;s.bank=123;s.catalystBalance=45;s.elitePity=6;s.levels.extraTime=3;s.lastRuns=Array.from({length:20},(_,i)=>({runId:'old-'+i,photonsEarned:i,detail:{unchanged:['all','events',i]}}));
  const mem=memory();mem.setItem(C.storageKey,JSON.stringify(s));const a=loadSave(mem);assert.equal(a.saveVersion,9);assert.equal(a.elitePity,0);assert.equal(a.bank,123);assert.equal(a.levels.extraTime,3);assert.deepEqual(a.lastRuns,s.lastRuns);if(version>=3)assert.equal(a.catalystBalance,45);
  assert.equal(writeSave(mem,a),true);const b=loadSave(mem);assert.equal(b.elitePity,0);assert.deepEqual(b.lastRuns,a.lastRuns);
 }
});
test('M12 approved A: pending payout and pity snapshot recover once over two reloads',()=>{
 const s=freshSave();s.elitePity=5;s.bank=100;const mem=memory();
 const g=new Game({runId:'pity-six',elitePolicy:LIVE_ELITE_POLICY,elitePity:5,duration:.01});g.directorEliteRng=()=>.99;eliteChoice(g,['bombReactor'],null,null);g.update(.01);
 assert.equal(stageSettlement(s,g),true);assert.equal(s.elitePity,5);assert.equal(s.pendingSettlement.elitePolicySnapshot.next,6);writeSave(mem,s);
 let a=loadSave(mem);assert.equal(completeSettlement(a),true);assert.equal(a.elitePity,6);assert.equal(a.totalRuns,1);writeSave(mem,a);a=loadSave(mem);assert.equal(completeSettlement(a),false);assert.equal(a.elitePity,6);assert.equal(a.totalRuns,1);
 assert.equal(writeSave(mem,a),true);assert.equal(loadSave(mem).elitePity,6);
});
test('M12 approved A: ineligible/intro preserve pity; actual natural spawn resets; bad snapshot rejected',()=>{
 for(const kind of ['ineligible','intro','natural']){
  const s=freshSave();s.elitePity=6;const g=new Game({elitePolicy:LIVE_ELITE_POLICY,elitePity:6,duration:.01});
  if(kind==='intro')eliteChoice(g,['bombReactor'],'bombReactor',null);
  if(kind==='natural'){eliteChoice(g,['bombReactor'],null,null);g.director.elite.naturalSpawned=true;}
  g.update(.01);stageSettlement(s,g);assert.equal(completeSettlement(s),true);assert.equal(s.elitePity,kind==='natural'?0:6);
 }
 const s=freshSave(),g=new Game({elitePolicy:LIVE_ELITE_POLICY,duration:.01});g.update(.01);stageSettlement(s,g);s.pendingSettlement.elitePolicySnapshot.next=6;
 const mem=memory();mem.setItem(C.storageKey,encodeSave(s));assert.equal(loadSave(mem).pendingSettlement,null);assert.equal(completeSettlement(s),false);assert.equal(s.totalRuns,0);
});
test('M12 zero-progress Codex attempts only arise from actual origin death or executed sector',()=>{
 const g=new Game({sandbox:true,ecologyEnabled:true,advancedEnabled:true});g.codexAttempts.pentagon.clear();codexDeath(g,{id:500,type:'pentagon'},{source:'direct',chainId:g.newChain()},null);
 g.advancedEvents.push({kind:'lensSector',sourceId:600,chainId:2,waveId:1,sectorIndex:0});const rows=attemptSummary(g);assert.equal(rows.find(r=>r.id==='pentagon').actual,0);assert.equal(rows.find(r=>r.id==='prismLens').actual,0);assert.deepEqual(attemptSummary(g),rows);
});
