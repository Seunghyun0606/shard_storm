import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../config.js';
import { rankFor } from '../discovery.js';
import { freshSave, loadSave, writeSave } from '../storage.js';
import { stageSettlement, completeSettlement } from '../progression.js';
import { Game } from '../game.js';
import { buyUpgrade } from '../progression.js';
import { skillDefinitions, skillState, skillCost } from '../skill-tree.js';
import { planRefinery } from '../refinery.js';
import { memoryStorage } from './helpers.js';
import { rollOre, oreChances } from '../ore.js';
test('M5 ore independent spawn/HP/placement, unlocked probability boundaries and once-only drops',()=>{
  assert.equal(rollOre(0,0), 'common');assert.equal(rollOre(.019999,2),'core');assert.equal(rollOre(.02,2),'prism');assert.equal(rollOre(.1,2),'common');assert.equal(rollOre(.004999,4),'void');assert.deepEqual(oreChances(0,2),{prism:0,core:0,void:0});
  const a=new Game({seed:7,discoveryRank:4}),b=new Game({seed:7,discoveryRank:4,oreEnabled:false});
  assert.deepEqual(a.alive.map(s=>[s.type,s.x,s.y,s.hp,s.modifier]),b.alive.map(s=>[s.type,s.x,s.y,s.hp,s.modifier]));
  for(const source of ['direct','triangle','square']){const g=new Game({discoveryRank:2,options:{motionEnabled:false}});g.shapes=[];const s=g.addShape('square',300,300,0,false,0);s.oreGrade='core';const c={source,chainId:g.newChain(),depth:0};g.enqueue(s,99,c);g.flush();assert.equal(g.rawOreBonus,60);assert.equal(g.pendingCatalyst,1);g.enqueue(s,99,c);g.flush();assert.equal(g.pendingCatalyst,1);g.update(20);const save=freshSave();stageSettlement(save,g);assert.equal(save.catalystBalance,0);completeSettlement(save);assert.equal(save.catalystBalance,1);completeSettlement(save);assert.equal(save.catalystBalance,1);}
});
test('M5 rank exact boundaries, staged rewards advance once only after completion',()=>{
  for(const [k,r] of [[0,0],[299,0],[300,1],[1199,1],[1200,2],[3499,2],[3500,3],[7999,3],[8000,4]])assert.equal(rankFor(k),r);
  const save=freshSave(),g=new Game({runId:'rank-proof'});save.lifetimeDestroyed=299;g.totalDestroyed=1;g.update(20);
  stageSettlement(save,g);assert.equal(save.discoveryRank,0);assert.equal(save.lifetimeDestroyed,299);
  completeSettlement(save);assert.equal(save.discoveryRank,1);assert.equal(save.milestoneWelcomeFlags[1],true);assert.equal(completeSettlement(save),false);assert.equal(save.lifetimeDestroyed,300);
});
test('M5 schema1/2/3/4 preserve valid bank, levels, history and exact lifetime; sandbox cannot write',()=>{
  for(const version of [1,2,3,4]){const mem=memoryStorage(),old={...freshSave(),saveVersion:version,bank:999,levels:{...freshSave().levels,extraTime:6},lifetimeDestroyed:1570,totalRuns:9,lastRuns:[{totalDestroyed:60,photonsEarned:10}]};mem.setItem(C.storageKey,JSON.stringify(old));const s=loadSave(mem);assert.equal(s.saveVersion,4);assert.equal(s.bank,999);assert.equal(s.levels.extraTime,6);assert.deepEqual(s.lastRuns,old.lastRuns);assert.equal(s.lifetimeDestroyed,version<3?0:1570);assert.equal(s.discoveryRank,version<3?0:2);assert.equal(writeSave(mem,{...s,sandbox:true}),false);}
});
test('M5 eight skill purchases require rank, all prerequisites and both currencies atomically',()=>{
  for(const node of skillDefinitions.filter(n=>n.rank)){
    const s=freshSave();s.bank=10000;s.catalystBalance=100;s.discoveryRank=node.rank;for(const p of node.prerequisites)s.levels[p.id]=p.minLevel;
    const before=structuredClone(s);s.discoveryRank--;assert.equal(buyUpgrade(s,node.id,'RESULT'),false);s.discoveryRank++;
    if(node.catalyst[0]){s.catalystBalance=0;assert.equal(buyUpgrade(s,node.id,'RESULT'),false);assert.equal(s.bank,before.bank);s.catalystBalance=100;}
    assert.equal(buyUpgrade(s,node.id,'PLAYING'),false);assert.equal(buyUpgrade(s,node.id,'RESULT'),true);assert.equal(s.bank,10000-node.baseCost);assert.equal(s.catalystBalance,100-node.catalyst[0]);
    while(s.levels[node.id]<node.max)assert.equal(buyUpgrade(s,node.id,'RESULT'),true);assert.equal(buyUpgrade(s,node.id,'RESULT'),false);
  }
});
test('M5 Yield retains original slot RNG and applies level snapshot without reroll or OFF bonuses',()=>{
  for(const seed of [31415,1,7,42,99])for(const lv of [0,1,2]){
    const a=planRefinery({raw:10000,seed}),b=planRefinery({raw:10000,seed,yieldLevel:lv});assert.deepEqual(a.tokens.map(t=>t.slot),b.tokens.map(t=>t.slot));
    for(const t of b.tokens)assert.equal(t.multiplier,lv>=1&&t.originalMultiplier===.8?1:lv>=2&&t.originalMultiplier===1?1.1:t.originalMultiplier);
    assert.equal(b.payout,Math.floor(b.tokens.reduce((v,t)=>v+t.raw*.06*t.multiplier,0)+1e-9));assert.equal(planRefinery({raw:10000,seed,yieldLevel:lv,enabled:false}).payout,600);
  }
});
