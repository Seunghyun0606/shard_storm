import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../game.js';
import { CONFIG as C } from '../config.js';
import { poseAt, firstContact } from '../motion.js';
import { planRefinery } from '../refinery.js';
import { freshSave, loadSave, writeSave } from '../storage.js';
import { settle, stageSettlement, completeSettlement, durationFor, tierFor, refundLegacyTime } from '../progression.js';
import { memoryStorage, cause, advance } from './helpers.js';
import { simulate } from './simulation.js';
const empty = args => { const g = new Game(args); g.shapes = []; g.spawn = () => null; return g; };
const staticShape = (g, type, x, y, angle = 0) => { const s = g.addShape(type, x, y, angle, false, 0); s.motion.ampX = s.motion.ampY = s.motion.rotationRate = 0; return s; };

test('v0.9 duration: exact 20/22/32, one timer, no damage/spawn/Raw after zero', () => {
  for (const [extraTime, seconds] of [[0,20],[1,22],[6,32]]) {
    const g = new Game({ levels: { extraTime } }); assert.equal(g.duration, seconds); assert.equal(durationFor({ extraTime }), seconds);
    g.update(seconds); const raw = g.runEarned, shapes = g.shapes.length; assert.equal(g.state, 'RESULT'); assert.equal(g.elapsed, seconds);
    g.attack(480,335); g.spawn(); g.addShape('star',400,300); g.update(1); assert.equal(g.runEarned, raw); assert.equal(g.shapes.length, shapes);
  }
});
test('v0.9 tiers: thresholds/densities, live shapes preserved, new types prioritized', () => {
  assert.deepEqual(C.tiers.map(t => t.threshold), [0,15,45,100,200,400,750]); assert.deepEqual(C.tiers.map(t => t.target),[12,15,18,21,25,28,30]);
  for (const t of C.tiers) assert.ok(t.weights[0]+t.weights[1]>=.5);
  const g = empty(), s = staticShape(g,'square',200,300); g.totalDestroyed=45; g.unlock(); assert.deepEqual(g.pending,['pentagon','star']); assert.equal(s.destroyed,false); assert.equal(g.remaining,20); assert.equal(tierFor(100),3);
});
test('v0.9 tutorial: guided four kills with motion, including a late first click', () => {
  for (const seed of [31415,1,7,42,99]) for (const delay of [0,2]) { const g = new Game({seed}); advance(g,delay); const root=g.alive.find(s=>s.id===1); assert.equal(root.angle,C.tutorial.angle); g.attack(root.x,root.y); advance(g,.19); assert.ok(g.bestChain>=4); }
});
test('v0.9 motion: all profiles deterministic, bounded drift/speed/rotation, pause and toggles continuous', () => {
  const g = new Game(), profiles=new Set();
  for(let i=0;i<100;i++){ const s=g.addShape(i%2?'star':'triangle',400,300,0,false,0);profiles.add(s.motion.profile);for(const time of [0,1,3,10]){ const p=poseAt(s,time);assert.ok(Math.hypot(p.x-400,p.y-300)<=(s.type==='star'?4:6)+1e-9); } }
  assert.equal(profiles.size,4); g.update(.5); const before=g.alive.map(s=>[s.x,s.y,s.angle]); g.paused=true;g.update(1);assert.deepEqual(g.alive.map(s=>[s.x,s.y,s.angle]),before);g.paused=false;
  g.setMotionEnabled(false);g.update(.2);const frozen=g.alive.map(s=>[s.x,s.y,s.angle]);g.setMotionEnabled(true);g.updateMotion(g.elapsed);assert.deepEqual(g.alive.map(s=>[s.x,s.y,s.angle]),frozen);assert.ok(g.maxMotionSpeed<=16);
});
test('v0.9 motion: current center is clickable; death angle drives native shards', () => {
  const g=empty(),s=g.addShape('triangle',400,300,0,false,0);s.motion.profile='both';s.motion.rotationRate=.4;s.motion.ampX=2;s.motion.ampY=2;
  g.update(1);const angle=s.angle;assert.ok(Math.abs(angle-.4)<1e-9);assert.ok(g.attack(s.x,s.y));g.update(.03);
  assert.equal(g.shards.length,3);for(let i=0;i<3;i++)assert.ok(Math.abs(g.shards[i].angle-angle-i*Math.PI*2/3)<1e-8);
});
test('v0.9 motion: spawn anchors remain separated including worst drift margins', () => {
  const g=new Game({seed:42});g.totalDestroyed=200;g.unlock();advance(g,2);
  for(const s of g.alive){assert.ok(s.x>=C.arena.left+s.radius&&s.x<=C.arena.right-s.radius);assert.ok(s.y>=C.arena.top+s.radius&&s.y<=C.arena.bottom-s.radius);for(const t of g.alive)if(s!==t)assert.ok(Math.hypot(s.x-t.x,s.y-t.y)>=s.radius+t.radius+C.spawnGap-1e-6);}
});
test('v0.9 contact solver: analytical moving crossing, tangent, absent and grace endpoints', () => {
  const at=firstContact(t=>Math.abs(100-710*t)-10,0,.2,710);assert.ok(Math.abs(at-90/710)<1e-8);
  const tangent=firstContact(t=>Math.hypot(700*t-50,10)-10,0,.15,700);assert.ok(tangent!==null&&Math.abs(tangent-50/700)<.00001);
  assert.equal(firstContact(t=>10+t,0,1,16),null);assert.equal(firstContact(()=>-1,2,1,16),null);
});
test('v0.9 shard: swept moving-circle crossing uses actual future position, no tunneling', () => {
  const g=empty(),s=g.addShape('star',480,319.5,0,false,0);s.radius=16;s.motion.ampX=0;s.motion.ampY=3;s.motion.phaseY=Math.PI;s.motion.speedY=2;
  const c=cause(g,'triangle');g.emitShard(400,300,0,'triangle',c.chainId,1);g.update(.15);
  assert.equal(s.hp,6);assert.equal(g.projectileHits,1);assert.equal(g.runEarned,3);
});
test('v0.9 wave: no future fixed hits; contact verified at actual moving location once', () => {
  const g=empty(),s=g.addShape('star',520,300,0,false,0);s.radius=16;s.motion.ampX=2;s.motion.phaseX=0;s.motion.speedX=1;s.motion.ampY=0;
  const c=cause(g,'star'),wave=g.area({x:400,y:300},145,5,c,'#fff');assert.equal(g.queue.length,0);
  const due=firstContact(t=>Math.hypot(poseAt(s,t).x-400,0)-16-720*t,0,.3,736);
  g.update(due-.0001);assert.equal(s.hp,9);g.update(.0002);assert.equal(s.hp,4);assert.equal(wave.hitIds.size,1);advance(g,.2);assert.equal(s.hp,4);
});
test('v0.9 wave: late spawn behind front and protected front crossing never ghost-hit', () => {
  const g=empty(),c=cause(g,'star');const wave=g.area({x:400,y:300},145,5,c,'#fff');g.update(.1);
  const late=staticShape(g,'star',420,300);g.update(.05);assert.equal(late.hp,9);
  const protectedShape=g.addShape('star',520,300,0,false,.2);g.update(.3);assert.equal(protectedShape.hp,9);assert.equal(wave.hitIds.size,0);
});
test('v0.9 motion toggle: static future arrivals replaced, missed stall events discarded', () => {
  const g=empty({options:{motionEnabled:false}}),s=staticShape(g,'star',520,300);const w=g.area({x:400,y:300},145,5,cause(g,'star'),'#fff');assert.equal(g.queue.length,1);
  g.setMotionEnabled(true);assert.equal(w.dynamic,true);assert.equal(g.queue.length,0);g.skipAhead(.3);g.update(.01);assert.equal(s.hp,9);assert.equal(g.runEarned,0);assert.ok(g.skippedEvents>0);
});
test('v0.9 refinery: deterministic 10 tokens, exact weighted floor, OFF ×1', () => {
  const p=planRefinery({raw:2836,seed:42});assert.deepEqual(p,planRefinery({raw:2836,seed:42}));assert.equal(p.tokens.length,10);assert.equal(p.tokens.reduce((n,t)=>n+t.raw,0),2836);
  assert.equal(p.payout,Math.floor(p.tokens.reduce((n,t)=>n+t.raw*.06*t.multiplier,0)+1e-9));assert.equal(planRefinery({raw:2836,seed:42,enabled:false}).payout,170);
  assert.equal(planRefinery({raw:0,seed:42}).payout,0);assert.throws(()=>planRefinery({raw:-1,seed:1}));
});
test('v0.9 refinery: weighted slot distribution matches declared 15/35/30/15/5', () => {
  const counts=Array(5).fill(0);for(let seed=0;seed<5000;seed++)for(const token of planRefinery({raw:1000,seed}).tokens)counts[token.slot]++;
  for(let i=0;i<5;i++)assert.ok(Math.abs(counts[i]/50000-C.refinery.slots[i].weight/100)<.01);
});
test('v0.9 settlement: pending persisted before animation, reload recovery once, no reroll', () => {
  const save=freshSave(),storage=memoryStorage(),g=new Game({runId:'unique-run'});g.attack(480,335);assert.equal(settle(save,g),false);assert.equal(save.bank,0);g.update(20);
  assert.equal(stageSettlement(save,g),true);const payout=g.refinery.payout;assert.equal(save.bank,0);writeSave(storage,save);
  const restored=loadSave(storage);assert.equal(completeSettlement(restored),true);assert.equal(restored.bank,payout);writeSave(storage,restored);
  const again=loadSave(storage);assert.equal(completeSettlement(again),false);assert.equal(stageSettlement(again,g),false);assert.equal(settle(again,g),false);assert.equal(again.bank,payout);assert.equal(again.totalRuns,1);
});
test('v0.9 settlement: repeated completion/skip share plan; sandbox cannot credit or persist live', () => {
  const save=freshSave(),g=new Game();g.runEarned=3000;g.update(20);assert.equal(settle(save,g),true);const bank=save.bank;assert.equal(settle(save,g),false);assert.equal(completeSettlement(save),false);assert.equal(save.bank,bank);
  const lab=new Game({sandbox:true});lab.runEarned=3000;lab.update(20);assert.equal(stageSettlement(save,lab),false);assert.equal(settle(save,lab),false);
});
test('v0.9 save: v1/v2→v3 preserves bank/owned skills/history; no invented lifetime', () => {
  for(const version of [1,2]){const storage=memoryStorage(),old={...freshSave(),saveVersion:version,bank:12345,levels:{...freshSave().levels,extraTime:6,shardPower:2},lastRuns:[{photonsEarned:900,totalDestroyed:50}]};storage.setItem(C.storageKey,JSON.stringify(old));const saved=loadSave(storage);
    assert.equal(saved.bank,12345);assert.equal(saved.levels.extraTime,6);assert.equal(saved.saveVersion,5);assert.deepEqual(saved.lastRuns,old.lastRuns);assert.equal(saved.lifetimeDestroyed,0);assert.equal(saved.knownHistoryKills,50);assert.equal(saved.legacyExtraTimeLevel,6);assert.equal(saved.discoveryRank,0);
  }
});
test('v0.9 save: optional once-only legacy Extra Time refund, no other level/bank reset', () => {
  const s=freshSave();s.bank=100;s.levels.extraTime=2;s.levels.shardPower=1;s.legacyExtraTimeLevel=2;
  assert.equal(refundLegacyTime(s,'PLAYING'),0);assert.equal(refundLegacyTime(s,'RESULT'),312);assert.equal(s.bank,412);assert.equal(s.levels.extraTime,0);assert.equal(s.levels.shardPower,1);assert.equal(refundLegacyTime(s,'RESULT'),0);
});
test('v0.9 bins: five-second and retained ten-second sums match actual raw/kill/density', () => {
  const g=new Game();g.attack(480,335);while(g.state==='PLAYING')g.update(C.step);const r=g.record();assert.equal(r.bins5.length,4);assert.equal(r.bins.length,2);
  for(const bins of [r.bins5,r.bins]){assert.equal(bins.reduce((n,b)=>n+b.totalDestroyed,0),r.totalDestroyed);assert.equal(bins.reduce((n,b)=>n+b.earnedPhoton,0),r.rawEarned);assert.ok(Math.abs(bins.reduce((n,b)=>n+b.sampledSeconds,0)-20)<1e-6);}
});
test('v0.9 production: cosmetic/audio/refinery presentation do not change moving-world combat', () => {
  const a=simulate({duration:5,options:{motionEnabled:true,visualVariety:true,damageVFX:true,comboFeedback:true,sound:true}});
  const b=simulate({duration:5,options:{motionEnabled:true,visualVariety:false,damageVFX:false,comboFeedback:false,sound:false,refineryEnabled:false}});
  for(const k of ['totalDestroyed','cascadeKills','bestChain','rawEarned','projectileHits','waveContacts'])assert.equal(a[k],b[k]);
  assert.ok(a.physicsChecks.maxWaveContactError<.002);assert.ok(a.physicsChecks.maxProjectileContactError<.002);assert.equal(a.physicsChecks.lateWaveContacts,0);
});
test('v0.9 moving simultaneous waves preserve fatal ownership and single bonus', () => {
  const g=empty(),target=staticShape(g,'triangle',450,300),first=cause(g,'square'),last=cause(g,'square');
  g.area({x:400,y:300},90,2,first,'#fff');g.area({x:400,y:300},90,2,last,'#fff');g.update(.09);
  assert.equal(g.totalDestroyed,1);assert.equal(g.runEarned,8);assert.equal(g.chains.get(first.chainId)?.kills||0,0);assert.equal(g.chains.get(last.chainId)?.kills||0,1);
});
test('v0.9 deadline: events just before zero execute, exact endpoint and later events do not', () => {
  const g=empty({duration:.1}),a=staticShape(g,'square',200,300),b=staticShape(g,'square',500,300),c=cause(g);
  g.enqueue(a,4,c,.099);g.enqueue(b,4,c,.1);g.update(.1);assert.equal(a.destroyed,true);assert.equal(b.destroyed,false);assert.equal(g.runEarned,12);assert.equal(g.state,'RESULT');
});
test('v0.9 skip: excluded Impact target and targets outside final radius are not counted as missed hits', () => {
  const g=empty(),origin=staticShape(g,'star',400,300),outside=staticShape(g,'star',480,300);g.area(origin,42,1,cause(g,'impact'),'#fff',origin.id);g.skipAhead(.3);
  assert.equal(origin.hp,9);assert.equal(outside.hp,9);assert.equal(g.skippedEvents,0);
});
test('v0.9 terminal visible stall closes without replaying unobserved past damage', () => {
  const g=empty({duration:1}),s=staticShape(g,'star',520,300);g.area({x:400,y:300},145,5,cause(g,'star'),'#fff');g.skipAhead(2);
  assert.equal(g.state,'RESULT');assert.equal(s.hp,9);assert.equal(g.runEarned,0);assert.equal(g.skippedSeconds,1);
});
test('v0.9 controlled motion A/B reserves identical initial anchor geometry', () => {
  for(const seed of [31415,1,7,42,99]){
    const a=new Game({seed,options:{motionEnabled:true}}),b=new Game({seed,options:{motionEnabled:false}});
    assert.deepEqual(a.alive.map(s=>[s.id,s.type,s.anchorX,s.anchorY,s.radius]),b.alive.map(s=>[s.id,s.type,s.anchorX,s.anchorY,s.radius]));
  }
});
