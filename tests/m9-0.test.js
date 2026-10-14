import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatPresentation, spawnAlpha, resizeBacking } from '../presentation.js';
import { CONFIG as C } from '../config.js';
import { logicalPoint } from '../entities.js';
import { battle } from './m7-m8-simulation.js';
import { freshSave, loadSave } from '../storage.js';
import { Game } from '../game.js';
import { draw } from '../renderer.js';

test('M9.0 presentation caps, hit rate limit, shake cooldown and reduced motion', () => {
  const p = new CombatPresentation();
  p.emit({kind:'hit',at:0}, C.options); p.emit({kind:'hit',at:.1}, C.options);
  assert.equal(p.events.length,1); p.emit({kind:'combo',threshold:20,at:.12},C.options);
  assert.equal(p.events.at(-1).shake,2); p.emit({kind:'special',type:'ancient',at:.13},C.options);
  assert.equal(p.events.at(-1).shake,0);
  p.emit({kind:'combo',threshold:20,at:1},{...C.options,reducedMotionEnabled:true});
  assert.equal(p.events.at(-1).shake,0);
  for(let i=0;i<60;i++)p.emit({kind:'death',at:2+i*.01},C.options);
  assert.equal(p.events.length,32); p.prune(4); assert.equal(p.events.length,0);
});
test('M9.0 CSS/DPR backing resize leaves logical pointer unchanged, clamp DPR2', () => {
  const canvas={width:960,height:540,getBoundingClientRect:()=>({left:20,top:60,width:1440,height:810})};
  const b=resizeBacking(canvas,3);assert.equal(b.width,2880);assert.equal(b.height,1620);
  assert.deepEqual(logicalPoint(740,465,canvas.getBoundingClientRect()),{x:480,y:270});
  assert.equal(resizeBacking(canvas,1).width,1440);
  assert.equal(spawnAlpha(.15),.15);assert.equal(spawnAlpha(0),1);
});
test('M9.0 schema5 option merge preserves all previous assets and pending', () => {
  const s=freshSave();s.bank=421;s.levels.crushPower=2;s.catalystBalance=9;
  delete s.options.combatFXEnabled;delete s.options.screenShakeEnabled;delete s.options.reducedMotionEnabled;
  const loaded=loadSave({getItem:()=>JSON.stringify(s)});
  assert.equal(loaded.bank,421);assert.equal(loaded.levels.crushPower,2);assert.equal(loaded.catalystBalance,9);
  assert.equal(loaded.options.combatFXEnabled,true);assert.equal(loaded.options.screenShakeEnabled,true);assert.equal(loaded.options.reducedMotionEnabled,false);
});
test('M9.0 actual final kill arms one field clear, cooldown and no reset false positive',()=>{
  const g=new Game({options:{motionEnabled:false},sandbox:true});g.shapes=[];
  assert.equal(g.presentation.clearCount,0);
  const kill=()=>{const s=g.addShape('triangle',300,250,0,false,0);g.attack(s.x,s.y);};
  kill();assert.equal(g.presentation.clearCount,1);kill();assert.equal(g.presentation.clearCount,1);
  g.update(.4);g.shapes=[];g.elapsed=3.1;kill();assert.equal(g.presentation.clearCount,2);
  g.update(20);assert.equal(g.presentation.active(g.elapsed).length,0);
});
test('M9.0 renderer never places HUD/Combo text in the combat arena',()=>{
  const g=new Game({sandbox:true});g.shapes=[];const chain=g.newChain();g.chains.get(chain).kills=20;g.trackCombo(chain,{x:400,y:300});
  const text=[];const ctx=new Proxy({canvas:{width:1440,height:810,clientWidth:1440},fillText:(value,x,y)=>text.push({value,y})},{get:(o,k)=>k in o?o[k]:()=>{}});
  draw(ctx,g);assert.ok(text.some(t=>t.value.includes('SHARD STORM')));assert.ok(text.every(t=>t.y<C.arena.top));
});
test('M9.0 five seeds FX/shake/reduced motion never change actual combat or payouts',()=>{
  const fields=['totalDestroyed','directKills','cascadeKills','runEarned','pendingCatalyst','bestChain','metaResult','finalMetaCounters','physicsChecks'];
  for(const seed of [31415,1,7,42,99]){
    const args={seed,discoveryRank:4,duration:20,levels:Object.fromEntries(Object.entries(C.upgrades).map(([k,u])=>[k,u.max])),relicLoadout:['waveCondenser','reactorGovernor'],anomalyId:'unstableCore'};
    const baseline=battle(args);
    for(const options of [{combatFXEnabled:false},{screenShakeEnabled:false},{reducedMotionEnabled:true}]){
      const compared=battle({...args,options});for(const k of fields)assert.deepEqual(compared[k],baseline[k],`${seed} ${k}`);
    }
  }
});
