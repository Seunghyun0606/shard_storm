import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../game.js';
import {CONFIG as C} from '../config.js';
import {destructionStage} from '../destruction-stage.js';
import {responseLayout,RESPONSE_PATTERNS} from '../response-patterns.js';
import {responseSpawnSlot,finishResponses,destructionRecord} from '../response-director.js';
const max=Object.fromEntries(Object.entries(C.upgrades).map(([id,u])=>[id,u.max]));
const empty=opts=>{const g=new Game({sandbox:true,destructionEnabled:true,ecologyEnabled:true,advancedEnabled:true,levels:max,discoveryRank:4,...opts});g.shapes=[];g.shards=[];g.waves=[];g.queue=[];g.totalDestroyed=200;g.highestTier=4;return g;};
test('M13 exact four stages:14/15,39/40,74/75 and old100; frozen at start, separate from Run Tier',()=>{
 for(const[lv,id]of [[0,'shatter'],[14,'shatter'],[15,'cascade'],[39,'cascade'],[40,'overload'],[74,'overload'],[75,'storm'],[100,'storm']])assert.equal(destructionStage({level:lv}).id,id);
 const levels={...max},g=new Game({levels,destructionEnabled:true});levels.crushPower=0;assert.equal(g.destructionStage.id,'storm');assert.equal(g.highestTier,0);assert.ok(Object.isFrozen(g.destructionStage));assert.equal(Object.keys(C.upgrades).length,49);
});
for(const kind of Object.keys(RESPONSE_PATTERNS))test('M13 actual safe atomic layout: '+kind,()=>{
 const g=empty(),points=responseLayout(g,{kind});assert.equal(points.length,RESPONSE_PATTERNS[kind].count);
 for(const p of points){assert.ok(p.x>=C.arena.left+p.radius&&p.y>=C.arena.top+p.radius&&p.x<=C.arena.right-p.radius&&p.y<=C.arena.bottom-p.radius);for(const q of points)if(q!==p)assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=p.radius+q.radius+C.spawnGap+12-1e-9);}
 g.response.queue.push({id:'controlled',kind,count:points.length,chainId:1});const before=g.runEarned;
 for(let i=0;i<points.length;i++)assert.equal(responseSpawnSlot(g),true);
 assert.equal(g.response.spawned,points.length);assert.equal(g.alive.length,points.length);assert.equal(g.runEarned,before);assert.equal(g.response.regularBudget,points.length);assert.equal(g.response.credits,0);assert.equal(new Set(g.alive.map(s=>s.responseFormation)).size,1);
 assert.equal(g.response.events.filter(e=>e.kind==='activated'&&e.pattern===kind).length,1);
});
test('M13 actual sequential wave20 kills reserves10+20+Crown once and never gives immediate free resources',()=>{
 const g=empty();for(let i=0;i<20;i++){const s=g.addShape('triangle',100+(i%10)*80,180+Math.floor(i/10)*100,0,false,0);s.hp=1;s.clusterId=i<10?'A':'B';}
 const chainId=g.newChain();g.area({x:460,y:240},500,100,{source:'star',depth:1,chainId},'#fff');for(let i=0;i<100;i++)g.update(C.step);
 assert.equal(g.response.triggers,3);assert.equal(g.response.crown,true);assert.ok(g.response.spawned<=18);assert.equal(g.response.events.filter(e=>e.kind==='chainMilestone'&&e.threshold===10&&e.chainId===chainId).length,1);
 const row=destructionRecord(g).chains.find(c=>c.chainId===chainId);assert.ok(row.kills>=20);assert.ok(row.distance>500);assert.ok(row.clusters.includes('A')&&row.clusters.includes('B'));assert.ok(row.clusters.length>=2);assert.equal(g.physicsDebt.discardedPhysicalSeconds,0);
});
test('M13 independent chains do not merge; Echo/fixture cannot trigger response or spatial progress',()=>{
 const g=empty();for(let k=0;k<2;k++){const id=g.newChain();for(let i=0;i<6;i++){const s=g.addShape('triangle',100+i*70,180+k*100,0,false,0);g.enqueue(s,100,{source:'direct',depth:0,chainId:id});g.flush();}}
 assert.equal(g.response.triggers,0);assert.equal(destructionRecord(g).chains.length,2);
 const s=g.addShape('triangle',400,400,0,false,0,'normal',{fixture:true});g.enqueue(s,100,{source:'direct',depth:0,chainId:g.newChain()});g.flush();assert.equal(destructionRecord(g).chains.length,2);
});
test('M13 reservations cannot exceed3 triggers/18spawns; active formation blocks pending; deadline expires without damage',()=>{
 const g=empty();g.response.queue.push({id:'a',kind:'linkPocket',count:4,chainId:1});for(let i=0;i<4;i++)responseSpawnSlot(g);g.response.queue.push({id:'b',kind:'linkPocket',count:4,chainId:2});assert.equal(responseSpawnSlot(g),false);assert.equal(g.response.credits,0);
 const bank=g.runEarned;finishResponses(g);assert.equal(g.response.queue.length,0);assert.equal(g.response.expired,4);assert.equal(g.runEarned,bank);
 g.state='RESULT';assert.equal(g.addShape('triangle',300,300),null);
});
test('M13 Rank/Tier and disabled ecology preserved, all unsafe formations fall back to normal budget',()=>{
 const g=empty({discoveryRank:0,ecologyEnabled:false,advancedEnabled:false});g.highestTier=0;g.totalDestroyed=0;
 const p=responseLayout(g,{kind:'linkPocket'});assert.ok(p.every(s=>!C.shapes[s.type].special));
 for(let x=65;x<910;x+=45)for(let y=110;y<500;y+=45)g.addShape('triangle',x,y,0,false,0);assert.equal(responseLayout(g,{kind:'stormCrown'}),null);
});
