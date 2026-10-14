import test from 'node:test';
import assert from 'node:assert/strict';
import { LegacyGame as Game } from './helpers.js';
import { CONFIG as C } from '../config.js';
import { getDerivedStats, skillDefinitions, skillState, validateSkillTree } from '../skill-tree.js';
import { createAppearance, ClickVFXPool } from '../visuals.js';
import { emptyLevels, buyUpgrade, settle } from '../progression.js';
import { loadSave, freshSave, writeSave } from '../storage.js';
import { emptyGame, cause, advance, memoryStorage } from './helpers.js';

test('v0.7 / 17: Square wave hits near then far at actual circular contact times', () => {
  const g = emptyGame(); const origin = { x: 400, y: 300 };
  const a = g.addShape('pentagon', 430, 300, 0, false, 0), b = g.addShape('pentagon', 480, 300, 0, false, 0);
  a.radius = b.radius = 16; const wave = g.area(origin, 90, 2, cause(g, 'square'), C.shapes.square.color);
  assert.equal(a.hp, 5); assert.equal(b.hp, 5);
  g.update(.020); assert.equal(a.hp, 5); assert.equal(b.hp, 5);
  g.update(.003); assert.equal(a.hp, 3); assert.equal(b.hp, 5);
  g.update(.074); assert.equal(b.hp, 5); g.update(.003); assert.equal(b.hp, 3);
  advance(g, .4); assert.equal(a.hp, 3); assert.equal(b.hp, 3); assert.equal(wave.hitIds.size, 2);
});
test('v0.7 / 18: Star target at 120px keeps HP until front touches its hit circle', () => {
  const g = emptyGame(), s = g.addShape('star', 520, 300, 0, false, 0); s.radius = 16;
  g.area({ x: 400, y: 300 }, 145, 5, cause(g, 'star'), C.shapes.star.color);
  const due = (120 - 16) / 720;
  g.update(due - .001); assert.equal(s.hp, 9); g.update(.002); assert.equal(s.hp, 4);
});
test('v0.7 / 19: native and inherited emissions wait exactly 0.03 simulation seconds', () => {
  const g = emptyGame(), s = g.addShape('square', 400, 300, 0, false, 0);
  g.enqueue(s, 4, cause(g, 'triangle')); g.flush(); assert.equal(g.shards.length, 0); assert.equal(g.waves.length, 0);
  g.update(.029); assert.equal(g.shards.length, 0); assert.equal(g.waves.length, 0);
  g.update(.001); assert.equal(g.shards.filter(s => s.source === 'inherited').length, 1); assert.equal(g.waves.length, 1);
});
test('v0.7 / 20: immediate hit/miss feedback is cosmetic; flash/recoil/debris are timed', () => {
  const g = emptyGame(), s = g.addShape('square', 400, 300, 0, false, 0), neighbour = g.addShape('triangle', 435, 300, 0, false, 0);
  g.attack(400, 300); assert.equal(s.hp, 1); assert.equal(neighbour.hp, 3); assert.equal(g.clickVFX.items[0].hit, true); assert.equal(s.flash, .055); assert.equal(s.recoil, .10);
  assert.ok(g.particles.length >= 2 && g.particles.length <= 4); assert.ok(g.particles.every(p => p.life === .15));
  const reward = g.runEarned; g.attack(100, 100); assert.equal(g.clickVFX.items.at(-1).hit, false); assert.equal(g.runEarned, reward);
  g.update(.056); assert.equal(s.flash, 0); g.update(.10); assert.equal(g.clickVFX.items.length, 0); assert.equal(g.particles.length, 0);
});
test('click feedback pool is bounded and reuses expired objects', () => {
  const p = new ClickVFXPool(); for (let i = 0; i < 500; i++) p.add(i, i, true);
  assert.equal(p.items.length, C.caps.clickRings); assert.ok(p.free.length <= 1); const old = p.items[0]; p.update(1); p.add(1, 1, false); assert.ok(p.items[0] === old || p.free.includes(old));
});
test('v0.7 / 21-22: same cosmetic seed reproduces geometry/material; Enhanced is mechanical', () => {
  for (const [type, count] of [['triangle', 3], ['square', 4], ['pentagon', 5], ['star', 10]]) {
    const a = createAppearance(type, 99), b = createAppearance(type, 99); assert.deepEqual(a, b); assert.equal(a.localVertices.length, count);
    assert.ok(a.baseRadius >= 13 && a.baseRadius <= 21); assert.ok(a.localVertices.every(v => Math.hypot(v.x, v.y) <= a.baseRadius + 1e-8));
    assert.notDeepEqual(a, createAppearance(type, 100));
    if (type === 'triangle') a.localVertices.forEach((v, i) => { assert.ok(Math.abs(v.x / Math.hypot(v.x, v.y) - Math.cos(i * Math.PI * 2 / 3)) < 1e-9); assert.ok(Math.abs(v.y / Math.hypot(v.x, v.y) - Math.sin(i * Math.PI * 2 / 3)) < 1e-9); });
    const g = emptyGame(), normal = g.addShape(type, 300, 300), enhanced = g.addShape(type, 600, 300, 0, true);
    assert.equal(enhanced.maxHP, normal.maxHP + 2); assert.equal(enhanced.enhanced, true); assert.ok(normal.radius >= 16);
  }
});
test('Visual Variety and Damage VFX toggles preserve gameplay RNG/HP/rewards/positions', () => {
  const reports = [];
  for (const visualVariety of [true, false]) {
    const g = new Game({ options: { visualVariety, damageVFX: visualVariety } }); g.attack(480, 335);
    for (let i = 0; i < 10; i++) { advance(g, .2); const s = g.alive.find(s => s.grace === 0); if (s) g.attack(s.x, s.y); }
    reports.push({ kills: g.totalDestroyed, photons: g.runEarned, shapes: g.alive.map(s => [s.type, s.x, s.y, s.hp, s.radius, s.appearance]), patterns: g.patternCounts });
  }
  assert.deepEqual(reports[0], reports[1]);
});
test('four pattern plans are deterministic, fulfil shape sizes and have safe spawn fallbacks', () => {
  const a = new Game({ seed: 88 }), b = new Game({ seed: 88 }); assert.deepEqual(a.createPatternPlan(), b.createPatternPlan());
  const kinds = new Set(); for (let i = 0; i < 200; i++) { const plan = a.createPatternPlan(); kinds.add(plan.kind); assert.ok(plan.points.length >= 1 && plan.points.length <= 6); }
  assert.deepEqual([...kinds].sort(), ['arc', 'bridge', 'burst_cluster', 'scattered']);
  for (let i = 0; i < 100; i++) { a.shapes = []; a.spawn(); }
  assert.ok(Object.values(a.patternCounts).reduce((a, b) => a + b, 0) > 0);
});
test('v0.7 / 23: all prerequisite edges, costs and locked nodes use the same definitions', () => {
  const save = freshSave(); save.bank = 10000;
  for (const key of ['crushSpeed', 'impactPulse', 'shardRange', 'ricochetPlus', 'shardBloom', 'echoCatalyst', 'photonBoost']) { assert.equal(skillState(key, save.levels, save.bank).unlocked, false); assert.equal(buyUpgrade(save, key, 'RESULT'), false); }
  buyUpgrade(save, 'crushPower', 'RESULT'); assert.ok(buyUpgrade(save, 'crushSpeed', 'RESULT')); assert.equal(buyUpgrade(save, 'impactPulse', 'RESULT'), false);
  buyUpgrade(save, 'crushPower', 'RESULT'); assert.ok(buyUpgrade(save, 'impactPulse', 'RESULT')); assert.equal(buyUpgrade(save, 'impactPulse', 'RESULT'), false);
  for (const [parent, child] of [['shardPower', 'shardRange'], ['shardRange', 'ricochetPlus'], ['shardPower', 'shardBloom'], ['chainAmplifier', 'echoCatalyst'], ['extraTime', 'photonBoost']]) {
    while (!skillState(child, save.levels, save.bank).unlocked) assert.ok(buyUpgrade(save, parent, 'RESULT')); assert.ok(buyUpgrade(save, child, 'RESULT'));
  }
  assert.equal(skillDefinitions.length, 19); assert.ok(skillDefinitions.every(n => n.implemented));
});
test('skill graph rejects duplicate, missing, cyclic and impossible prerequisite definitions', () => {
  assert.ok(validateSkillTree());
  assert.throws(() => validateSkillTree([{ id: 'a', maxLevel: 2, prerequisites: [{ id: 'missing', minLevel: 1 }] }]));
  assert.throws(() => validateSkillTree([{ id: 'a', maxLevel: 2, prerequisites: [{ id: 'b', minLevel: 1 }] }, { id: 'b', maxLevel: 2, prerequisites: [{ id: 'a', minLevel: 1 }] }]));
});
test('v0.7 / 24: legacy bank/5 levels/best/history/options survive migration; new skills are zero', () => {
  const old = { saveVersion: 1, bank: 789, levels: { crushPower: 2, shardPower: 0, shardRange: 1, chainAmplifier: 1, extraTime: 2 }, bestStats: { totalDestroyed: 120, bestChain: 14, photonsEarned: 900 }, lastRuns: [{ photonsEarned: 900, seed: 7 }], options: { inheritance: false, ricochet: false, damageVFX: true, sound: false } };
  const storage = memoryStorage(); storage.setItem(C.storageKey, JSON.stringify(old)); const migrated = loadSave(storage);
  assert.equal(migrated.saveVersion, 6); assert.equal(migrated.bank, old.bank); assert.deepEqual(migrated.bestStats, old.bestStats); assert.deepEqual(migrated.lastRuns, old.lastRuns);
  for (const [k, value] of Object.entries(old.levels)) assert.equal(migrated.levels[k], value);
  for (const k of ['crushSpeed', 'impactPulse', 'ricochetPlus', 'shardBloom', 'echoCatalyst', 'photonBoost']) assert.equal(migrated.levels[k], 0);
  assert.equal(getDerivedStats(migrated.levels).shardRange, 230); // Owned legacy skill still works before its new prerequisite is met.
  assert.equal(buyUpgrade(migrated, 'shardRange', 'RESULT'), false); assert.equal(migrated.options.inheritance, false); assert.equal(migrated.options.sequentialPropagation, true);
  writeSave(storage, migrated); assert.deepEqual(loadSave(storage), migrated);
});
test('v0.7 / 25: Impact Pulse only on successful hits, excludes original, shares chain and never inherits', () => {
  for (const impactPulse of [0, 1]) {
    const g = emptyGame({ levels: { ...emptyLevels(), impactPulse } }), primary = g.addShape('star', 400, 300, 0, false, 0), neighbour = g.addShape('triangle', 435, 300, 0, false, 0); neighbour.hp = 1;
    g.attack(400, 300); assert.equal(primary.hp, 6); assert.equal(neighbour.hp, 1); g.update(.04);
    assert.equal(primary.hp, 6); assert.equal(neighbour.destroyed, Boolean(impactPulse)); assert.equal(g.waves.filter(w => w.sourceKind === 'inherited').length, 0);
    if (impactPulse) { assert.equal(g.chains.get(1).kills, 1); assert.equal(g.cascadeKills, 1); }
    const waveCount = g.waves.length; g.attack(50, 100); assert.equal(g.waves.length, waveCount);
  }
});
test('v0.7 / 26: pending native birth and wave arrival are discarded at Game Over', () => {
  const g = emptyGame({ duration: .06 }); const s = g.addShape('star', 520, 300, 0, false, 0);
  g.area({ x: 400, y: 300 }, 145, 5, cause(g, 'star'), C.shapes.star.color);
  g.update(.04); const earned = g.runEarned, hp = s.hp; g.update(.03); assert.equal(g.state, 'RESULT'); assert.equal(s.hp, hp); assert.equal(g.runEarned, earned); assert.equal(g.queue.length, 0); assert.equal(g.waves.length, 0);
});
test('v0.7 / 27: overlapping equal-time waves pay HP and kill bonus once, stable last hit ownership', () => {
  const g = emptyGame(), target = g.addShape('triangle', 450, 300, 0, false, 0), first = cause(g, 'square'), last = cause(g, 'square');
  g.area({ x: 400, y: 300 }, 90, 2, first, '#fff'); g.area({ x: 400, y: 300 }, 90, 2, last, '#fff'); g.update(.09);
  assert.equal(g.totalDestroyed, 1); assert.equal(g.runEarned, 8); assert.equal(g.chains.get(first.chainId)?.kills || 0, 0); assert.equal(g.chains.get(last.chainId)?.kills || 0, 1);
});
test('scheduler orders time → priority → event ID and keeps pending Chain alive', () => {
  const g = emptyGame(), c = cause(g), order = [];
  for (const [time, priority, label] of [[.04, 1, 'later'], [.03, 1, 'second'], [.03, 0, 'first'], [.03, 1, 'third']]) g.scheduleEvent({ kind: 'effect', chainId: c.chainId, action: () => order.push(label), scheduledTime: time, priority });
  g.update(.02); assert.ok(g.chains.has(c.chainId)); assert.deepEqual(order, []); g.update(.03); assert.deepEqual(order, ['first', 'second', 'third', 'later']);
});
test('all six P1 derived effects have exact PRD values', () => {
  const s = getDerivedStats({ ...emptyLevels(), crushSpeed: 3, ricochetPlus: 2, shardBloom: 2, echoCatalyst: 2, photonBoost: 3, impactPulse: 1 });
  assert.equal(s.attackInterval, .14); assert.equal(s.bounces, 3); assert.equal(s.triangleCount, 5); assert.equal(s.pentagonCount, 4); assert.equal(s.inheritanceDamage, 3); assert.equal(s.bonusMultiplier, 1.3); assert.equal(s.impactEnabled, true);
});
test('Crush Speed changes actual hold cadence without losing fractional intervals', () => {
  for (const [crushSpeed, expected] of [[0, 18], [1, 18], [2, 21], [3, 24]]) {
    const g = emptyGame({ levels: { ...emptyLevels(), crushSpeed } }), s = g.addShape('star', 400, 300, 0, false, 0); s.hp = s.maxHP = 1000;
    g.attack(400, 300); g.held = true; g.pointer = { x: 400, y: 300 }; g.attackClock = g.stats.attackInterval;
    advance(g, 1); assert.equal(g.runEarned, expected);
  }
});
test('Shard Bloom creates real additional main shards and still only two children per Pentagon hit', () => {
  for (const type of ['triangle', 'pentagon']) {
    const g = emptyGame({ levels: { ...emptyLevels(), shardBloom: 2 } }), s = g.addShape(type, 400, 300, 0, false, 0);
    g.enqueue(s, 100, cause(g)); g.flush(); g.update(.03); assert.equal(g.shards.length, type === 'triangle' ? 5 : 4);
  }
});
test('Ricochet+ actually survives a second wall; small shards still never bounce', () => {
  for (const ricochetPlus of [0, 2]) {
    const g = emptyGame({ levels: { ...emptyLevels(), ricochetPlus } }), shard = g.emitShard(C.arena.right - 5, C.arena.bottom - 20, Math.PI / 4, 'triangle', g.newChain(), 1);
    g.moveShard(shard, .05);
    assert.equal(shard.dead, !ricochetPlus); if (ricochetPlus) { assert.ok(shard.vx < 0 && shard.vy < 0); assert.equal(shard.bounces, 1); }
    const small = g.emitShard(C.arena.right - 5, 300, 0, 'pentagon', g.newChain(), 1, true); g.moveShard(small, .05); assert.equal(small.bounces, 0); assert.equal(small.dead, true);
  }
});
test('Echo Catalyst scales needle and wave; Photon Boost scales bonus only, never HP payout', () => {
  const g = emptyGame({ levels: { ...emptyLevels(), photonBoost: 3, echoCatalyst: 2 } }), s = g.addShape('square', 400, 300, 0, false, 0);
  g.enqueue(s, 100, cause(g, 'triangle')); g.flush(); assert.equal(g.runEarned, 4 + Math.ceil(8 * 1.3)); g.update(.03); assert.equal(g.shards.find(s => s.source === 'inherited').damage, 3);
});
test('v0.7 / 28: 120-target overlapping burst cannot duplicate rewards or exceed caps', () => {
  const g = emptyGame(); const c = cause(g, 'star');
  for (let i = 0; i < 120; i++) g.addShape('triangle', 400 + Math.cos(i) * 80, 300 + Math.sin(i) * 80, 0, false, 0);
  for (let i = 0; i < 4; i++) g.area({ x: 400, y: 300 }, 145, 100, c, '#fff');
  g.update(.19); assert.equal(g.totalDestroyed, 120); assert.equal(g.runEarned, 120 * 8); assert.ok(g.shards.length <= 150); assert.ok(g.safetyCapsHit > 0); assert.ok(g.queue.length <= C.caps.scheduled);
  g.update(60); const save = freshSave(); settle(save, g); const bank = save.bank; settle(save, g); assert.equal(save.bank, bank);
});
test('visible catch-up skip drops past events instead of emitting late phantom attacks', () => {
  const g = emptyGame(), s = g.addShape('star', 500, 300, 0, false, 0), c = cause(g, 'star');
  g.area({ x: 400, y: 300 }, 145, 5, c, '#fff'); g.skipAhead(.3); g.update(.01);
  assert.equal(s.hp, 9); assert.equal(g.runEarned, 0); assert.equal(g.skippedEvents, 1); assert.equal(g.queue.length, 0);
  assert.equal(g.shards.length, 0); assert.ok(g.skippedSeconds >= .3);
  const future = emptyGame(), t = future.addShape('star', 520, 300, 0, false, 0); t.radius = 16;
  future.area({ x: 400, y: 300 }, 145, 5, cause(future, 'star'), '#fff'); future.skipAhead(.1); assert.equal(t.hp, 9); future.update(.05); assert.equal(t.hp, 4);
});
