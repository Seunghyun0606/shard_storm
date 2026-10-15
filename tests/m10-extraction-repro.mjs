// Isolated diagnostic for the PRD conflict, using the real pointer attack method.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Game} from '../game.js';
import {CONFIG as C} from '../config.js';
const g=new Game({discoveryRank:4,sandbox:true,oreEnabled:false,levels:{crushPower:5},options:{motionEnabled:false}});
g.shapes=[];g.shards=[];g.queue=[];g.spawnClock=-Infinity;
g.addShape('square',400,270,0,false,0);
for(let i=0;i<9;i++){const a=i*Math.PI*2/9;const s=g.addShape('triangle',400+70*Math.cos(a),270+70*Math.sin(a),0,false,0);s.hp=1;}
assert.equal(g.attack(400,270),true);
for(let i=0;i<12;i++)g.update(C.step);
const prior=[...g.chains.entries()].find(([,chain])=>chain.rewardedKills>=10);assert.ok(prior);
const hex=g.addShape('hex',800,270,0,false,0);assert.equal(g.attack(hex.x,hex.y),true);assert.equal(hex.destroyed,true);
const death=g.causalLog.find(e=>e.targetShapeId===hex.id&&e.eventType==='directKills');
assert.ok(death);assert.notEqual(death.chainId,prior[0]);assert.equal(g.chains.get(death.chainId).rewardedKills,1);
const result={reproduced:true,fixture:true,priorChainId:prior[0],priorNormalKills:prior[1].rewardedKills,directHexChainId:death.chainId,directHexChainNormalKills:g.chains.get(death.chainId).rewardedKills,
 rule:'Game.attack always calls newChain before enqueueing and flushing the direct final hit; old Chain10 belongs to a different click. No production rule or save changed.',
 decisionRequired:'PRD Catalyst Extraction requires same Chain>=10 at a direct Hex/Reactor final hit. Choose deferred qualification of the direct-origin Chain, or explicitly change the direct-final-hit condition. Do not merge unrelated Chains.'};
writeFileSync('artifacts/m10-extraction-rule-conflict.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
