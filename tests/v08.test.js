import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../config.js';
import { Game } from '../game.js';
import { emptyGame, cause, advance } from './helpers.js';
import { emptyLevels } from '../progression.js';
import { createShape } from '../entities.js';
import { spawnSettings } from '../experiments.js';
import { EconomySandbox, experimentCost, buildPresets, nodeComparisons } from '../economy.js';
import { freshSave, loadSave, writeSave } from '../storage.js';
import { buyUpgrade, settle, durationFor } from '../progression.js';
import { memoryStorage } from './helpers.js';

test('v0.8 combo: 4→11 records 5/10 once, presents highest, then 20 once', () => {
  const g = emptyGame(), id = g.newChain(), chain = g.chains.get(id);
  chain.kills = 4; g.trackCombo(id, { x: 100, y: 100 }); assert.equal(g.combo.main, null);
  chain.kills = 11; g.trackCombo(id, { x: 100, y: 100 }); g.trackCombo(id, { x: 100, y: 100 });
  assert.deepEqual(g.comboMilestones, { 5: 1, 10: 1, 20: 0 }); assert.equal(g.combo.main.threshold, 10);
  chain.kills = 20; g.trackCombo(id, { x: 100, y: 100 }); assert.equal(g.combo.main.threshold, 20);
  g.state = 'RESULT'; chain.kills = 30; g.trackCombo(id, {}); assert.equal(g.comboEvents.length, 3);
});
test('v0.8 economy: price ×3/×6 rounds base × multiplier before growth; live prices unchanged', () => {
  const save = freshSave(); save.bank = 1000;
  for (const [preset, cost] of [['baseline', 60], ['cost_x3', 180], ['cost_x6', 360]]) {
    const lab = new EconomySandbox(save, preset); assert.equal(lab.state('crushPower').cost, cost);
    assert.equal(lab.buy('crushSpeed', 'RESULT'), false); assert.equal(lab.buy('crushPower', 'PLAYING'), false);
    assert.equal(lab.buy('crushPower', 'RESULT'), true); assert.equal(lab.save.bank, 1000 - cost);
    assert.equal(lab.state('crushSpeed').unlocked, true);
    assert.equal(experimentCost('crushPower', 2, preset), Math.ceil(60 * (cost / 60) * 1.6 ** 2));
  }
  assert.equal(save.bank, 1000); assert.equal(save.levels.crushPower, 0); assert.ok(buyUpgrade(save, 'crushPower', 'RESULT')); assert.equal(save.bank, 940);
});
test('v0.8 economy: sandbox cannot write live storage or settle into live save; once within sandbox', () => {
  const source = freshSave(), storage = memoryStorage(); source.bank = 123; source.levels.shardPower = 1; writeSave(storage, source);
  const old = storage.getItem(C.storageKey), lab = new EconomySandbox(source, 'cost_x3');
  lab.save.bank += 10000; assert.equal(writeSave(storage, lab.save), false); assert.equal(storage.getItem(C.storageKey), old);
  const g = new Game({ sandbox: true, duration: 1 }); g.runEarned = 50; g.update(1);
  assert.equal(settle(source, g), false); assert.equal(source.bank, 123);
  assert.equal(settle(lab.save, g), true); const bank = lab.save.bank; assert.equal(settle(lab.save, g), false); assert.equal(lab.save.bank, bank);
  assert.deepEqual(loadSave(storage), source);
});
test('v0.8 economy: sandbox purchases enforce balance/MAX and support presets without mutating source', () => {
  const source = freshSave(); source.bank = 360;
  const lab = new EconomySandbox(source, 'cost_x6'); assert.ok(lab.buy('crushPower', 'RESULT')); assert.equal(lab.save.bank, 0); assert.equal(lab.buy('crushPower', 'RESULT'), false);
  lab.save.bank = 100000; while (lab.buy('crushPower', 'RESULT')) { /* buy to max */ }
  assert.equal(lab.save.levels.crushPower, 5); assert.equal(lab.buy('crushPower', 'RESULT'), false); assert.equal(lab.buy('missing', 'RESULT'), false); assert.equal(source.levels.crushPower, 0); assert.equal(source.bank, 360);
});
test('v0.8 economy: existing v2 history and owned levels preserved; new fields optional', () => {
  const source = freshSave(), storage = memoryStorage(); source.bank = 789; source.levels.shardBloom = 2; source.lastRuns = [{ seed: 42, photonsEarned: 200 }];
  delete source.options.comboFeedback; delete source.options.modifiers; writeSave(storage, source);
  const loaded = loadSave(storage); assert.equal(loaded.saveVersion, 2); assert.equal(loaded.bank, 789); assert.equal(loaded.levels.shardBloom, 2); assert.deepEqual(loaded.lastRuns, source.lastRuns); assert.equal(loaded.options.modifiers, true);
});
test('v0.8 economy: every build and per-node experiment meets prerequisites; Extra Time isolated', () => {
  for (const levels of Object.values(buildPresets)) for (const node of C.skillDefinitions) if (levels[node.id]) for (const p of node.prerequisites) assert.ok(levels[p.id] >= p.minLevel);
  const comparisons = nodeComparisons(); assert.equal(comparisons.length, 11);
  for (const n of comparisons) for (const p of C.skillDefinitions.find(d => d.id === n.key).prerequisites) assert.ok(n.before[p.id] >= p.minLevel);
  for (const [level, duration] of [[0, 60], [1, 65], [6, 90]]) { assert.equal(durationFor({ extraTime: level }), duration); const g = new Game({ levels: { extraTime: level }, duration: 60 }); assert.equal(g.duration, 60); assert.equal(g.levels.extraTime, level); }
});
test('v0.8 diagnostics: exact 10-second event boundary, bin sums and Extra Time bins', () => {
  const g = emptyGame({ duration: 65 }); g.elapsed = 10; g.remaining = 55;
  const s = g.addShape('triangle', 400, 300, 0, false, 0); g.attack(s.x, s.y);
  assert.equal(g.bins[0].totalDestroyed, 0); assert.equal(g.bins[1].totalDestroyed, 1); assert.equal(g.bins[1].earnedPhoton, 8);
  assert.equal(g.bins.length, 7); assert.equal(g.bins.at(-1).end, 65);
  g.elapsed = 9.9; g.sampleDensity(9.9, .2); assert.ok(Math.abs(g.bins[0].sampledSeconds - .1) < 1e-8); assert.ok(Math.abs(g.bins[1].sampledSeconds - .1) < 1e-8);
});
test('v0.8 diagnostics: empty episodes across bins, pause excluded, failures counted', () => {
  const g = emptyGame(); g.sampleDensity(9.7, .3); g.sampleDensity(10, .3);
  assert.ok(Math.abs(g.emptyArenaDuration - .6) < 1e-8); assert.equal(g.emptyEpisodesOverHalfSecond, 1);
  g.paused = true; g.update(1); assert.equal(g.emptyArenaDuration, .6); g.paused = false;
  g.addShape('star', 480, 300, 0, false, 0); g.sampleDensity(11, .1); assert.equal(g.emptyEpisode, 0);
  g.shapes[0].radius = 10000; assert.equal(g.spawn(), null); assert.equal(g.spawnFailures, 1); assert.equal(g.binAt().spawnFailures, 1);
});
test('v0.8 diagnostics: typed caps, sources and peak bounds distinguish clipped work', () => {
  const g = emptyGame(), c = cause(g, 'star', C.caps.depth + 1);
  g.area({ x: 400, y: 300 }, 100, 5, { ...c, chargedOrigin: true }, '#fff');
  assert.equal(g.capCounts.depth, 1); assert.equal(g.capSources.star, 1); assert.equal(g.chargedCaps, 1);
  for (let i = 0; i < C.caps.shards + 1; i++) g.emitShard(400, 300, 0, 'triangle', c.chainId, 1);
  assert.equal(g.capCounts.shards, 1); assert.equal(g.peakShards, C.caps.shards);
  assert.equal(Object.values(g.capCounts).reduce((a,b) => a+b, 0), g.safetyCapsHit);
});
test('v0.8 diagnostics: experiment settings isolated and invalid values rejected', () => {
  const g = new Game({ experiment: 'fast_spread' }); assert.equal(g.experiment.spawnInterval, .15); assert.equal(g.experiment.clusterChance, .45);
  assert.equal(C.spawnInterval, .2); assert.equal(C.clusterChance, .6);
  assert.throws(() => spawnSettings('missing')); assert.throws(() => spawnSettings({ spawnInterval: 0 })); assert.throws(() => spawnSettings({ clusterChance: NaN }));
  g.options.modifiers = false; const r = g.record(); assert.equal(r.inputPolicy, 'human'); assert.equal(r.experiment.spawnBatch, 3);
});
test('v0.8 diagnostics: epsilon near spawn interval never triggers duplicate next-tick refill', () => {
  for (const preset of ['baseline', 'fast']) {
    const g = emptyGame({ duration: 11, experiment: preset }); let attempts = 0;
    g.spawn = () => { attempts++; return null; };
    for (let i = 0; i < 600; i++) g.update(C.step);
    assert.equal(attempts, Math.floor((10 + 1e-9) / g.experiment.spawnInterval));
    assert.ok(g.spawnClock < g.experiment.spawnInterval);
  }
});
test('v0.8 diagnostics: type/modifier bin counters sum to real attacks and kills; terminal stall recorded', () => {
  const g = emptyGame({ duration: 11 }), s = g.addShape('square', 400, 300, 0, false, 0, 'cracked');
  g.attack(s.x, s.y); assert.equal(g.bins[0].typeStats.square.directHitCount, 1); assert.equal(g.bins[0].modifierStats.cracked.directKillCount, 1);
  assert.equal(g.bins[0].hpDistribution[2], 1); const earned = g.runEarned; g.skipAhead(20);
  assert.equal(g.state, 'RESULT'); assert.equal(g.runEarned, earned); assert.equal(g.skippedSeconds, 11); assert.equal(g.skippedEvents, 1);
  const record = g.record(); assert.equal(record.bins.reduce((s,b) => s + b.earnedPhoton, 0), earned);
  assert.ok(Math.abs(record.bins.reduce((s,b) => s + b.sampledSeconds, 0) - 11) < 1e-8);
});
test('v0.8 cracked: Star HP9→5, no payment for prior damage, normal native effect', () => {
  const g = emptyGame(), s = g.addShape('star', 450, 300, 0, false, 0, 'cracked');
  assert.equal(s.maxHP, 9); assert.equal(s.hp, 5); assert.equal(g.runEarned, 0);
  g.attack(s.x, s.y); assert.equal(s.hp, 2); assert.equal(g.runEarned, 3);
  g.attack(s.x, s.y); assert.equal(g.runEarned, 5 + 40); g.update(.03);
  assert.equal(g.waves[0].maxRadius, 145); assert.equal(g.modifierStats.cracked.clickedFirstCount, 1);
  assert.equal(g.modifierStats.cracked.directHitCount, 2); assert.equal(g.modifierStats.cracked.directKillCount, 1);
});
test('v0.8 charged: all native counts/radii compose with skills; inherit is unamplified', () => {
  for (const bloom of [0, 2]) for (const type of ['triangle', 'pentagon', 'square', 'star']) {
    const g = emptyGame({ levels: { shardBloom: bloom, chainAmplifier: bloom, echoCatalyst: 1 } });
    const s = g.addShape(type, 400, 300, 0, false, 0, 'charged');
    g.enqueue(s, 100, cause(g, type === 'square' ? 'triangle' : 'direct')); g.flush(); g.update(.03);
    if (type === 'triangle' || type === 'pentagon') {
      const shards = g.shards.filter(s => !s.small); assert.equal(shards.length, (type === 'triangle' ? 4 : 3) + bloom);
      assert.equal(new Set(shards.map(s => s.angle.toFixed(8))).size, shards.length);
    } else { assert.equal(g.waves[0].maxRadius, (C.shapes[type].areaRadius + bloom * 15) * 1.25); assert.equal(g.waves[0].damage, C.shapes[type].areaDamage + bloom); }
    if (type === 'square') assert.equal(g.shards.find(s => s.source === 'inherited').damage, 2);
  }
});
test('v0.8 charged: bonus ×1.2 and Photon Boost compose once for direct and cascade', () => {
  for (const source of ['direct', 'triangle']) {
    const g = emptyGame({ levels: { photonBoost: 3 } }), s = g.addShape('square', 400, 300, 0, false, 0, 'charged'), c = cause(g, source);
    g.enqueue(s, 100, c); g.enqueue(s, 100, c); g.flush();
    assert.equal(g.runEarned, 4 + Math.ceil(8 * 1.3 * 1.2)); assert.equal(g.totalDestroyed, 1);
  }
});
test('v0.8 modifiers: Enhanced exclusivity, simultaneous charged cap, no reroll', () => {
  for (const modifier of ['cracked', 'charged']) { const s = createShape(1, 'star', 100, 200, 0, true, 0, modifier); assert.equal(s.modifier, 'normal'); assert.equal(s.hp, 11); }
  const g = emptyGame(); for (let i = 0; i < 3; i++) g.addShape('triangle', 200 + i * 100, 300, 0, false, 0, 'charged');
  assert.equal(g.alive.filter(s => s.modifier === 'charged').length, 2); assert.equal(g.alive[2].modifier, 'normal');
  g.totalDestroyed = 90; g.modifierRng = () => .15; assert.equal(g.rollModifier(), 'normal');
});
test('v0.8 modifiers: exact threshold probabilities and OFF draw policy; existing shapes immutable', () => {
  const g = emptyGame(), s = g.addShape('star', 400, 300, 0, false, 0);
  for (const [kills, cracked, charged] of [[0, 0, 0], [11, 0, 0], [12, .1, 0], [29, .1, 0], [30, .1, .05], [54, .1, .05], [55, .12, .08], [90, .12, .08], [140, .12, .08]]) {
    g.totalDestroyed = kills; g.modifierRng = () => cracked / 2; assert.equal(g.rollModifier(), cracked ? 'cracked' : 'normal');
    g.modifierRng = () => cracked + charged / 2; assert.equal(g.rollModifier(), charged ? 'charged' : 'normal');
    g.modifierRng = () => cracked + charged + .001; assert.equal(g.rollModifier(), 'normal');
  }
  assert.equal(s.modifier, 'normal'); let draws = 0; g.modifierRng = () => { draws++; return .01; };
  g.rollModifier(true); g.options.modifiers = false; g.rollModifier(); assert.equal(draws, 2); assert.equal(g.rollModifier(), 'normal');
});
test('v0.8 cosmetic modifier marks/VFX/sound/combo never change mechanical results', () => {
  const results = [];
  for (const enabled of [false, true]) {
    const g = new Game({ options: { modifierVisuals: enabled, visualVariety: enabled, damageVFX: enabled, comboFeedback: enabled, sound: enabled } });
    g.attack(480, 335);
    for (let i = 0; i < 50; i++) { advance(g, .2); const s = g.alive.find(s => s.grace === 0); if (s) g.attack(s.x, s.y); }
    results.push([g.totalDestroyed, g.runEarned, g.modifierStats, g.alive.map(s => [s.id, s.modifier, s.hp, s.x, s.y])]);
  }
  assert.deepEqual(...results);
});
test('v0.8 charged contribution: actual native wave damage/kills attributed separately', () => {
  const g = emptyGame(), s = g.addShape('square', 400, 300, 0, false, 0, 'charged');
  const target = g.addShape('triangle', 485, 300, 0, false, 0, 'cracked');
  g.enqueue(s, 4, cause(g)); g.flush(); g.update(.16);
  assert.equal(target.destroyed, true); assert.equal(g.chargedContribution.damage, 2); assert.equal(g.chargedContribution.kills, 1); assert.equal(g.chargedContribution.photons, 7);
});
test('v0.8 combo: independent six-kill chains never combine, accents throttled and bounded', () => {
  const g = emptyGame();
  for (let i = 0; i < 40; i++) { const id = g.newChain(); g.chains.get(id).kills = 6; g.trackCombo(id, { x: 100, y: 100 }); }
  assert.deepEqual(g.comboMilestones, { 5: 40, 10: 0, 20: 0 }); assert.equal(g.combo.main.kills, 6);
  assert.equal(g.combo.visible(.5), null); assert.ok(g.visuals.length <= C.combo.popupCap);
});
test('v0.8 combo: higher independent milestone always replaces text within accent cooldown', () => {
  const g = emptyGame(), a = g.newChain(), b = g.newChain(); g.chains.get(a).kills = 5; g.trackCombo(a, { x: 100, y: 200 });
  g.elapsed = .1; g.chains.get(b).kills = 10; g.trackCombo(b, { x: 200, y: 300 });
  assert.equal(g.combo.main.threshold, 10); assert.equal(g.combo.main.chainId, b); assert.equal(g.combo.main.accent, false);
  g.chains.get(b).kills = 12; g.trackCombo(b, { x: 200, y: 300 }); assert.equal(g.combo.main.kills, 12);
});
test('v0.8 combo: actual causal kills emit milestones; feedback/sound are gameplay-neutral', () => {
  const run = options => {
    const g = emptyGame({ options }); const c = cause(g, 'square');
    for (let i = 0; i < 21; i++) g.enqueue(g.addShape('triangle', 100 + i * 25, 200, 0, false, 0), 3, c);
    g.flush(); return g;
  };
  const on = run({ comboFeedback: true, sound: true }), off = run({ comboFeedback: false, sound: false });
  assert.equal(on.totalDestroyed, 21); assert.deepEqual(on.comboMilestones, { 5: 1, 10: 1, 20: 1 });
  for (const k of ['runEarned', 'totalDestroyed', 'cascadeKills', 'bestChain']) assert.equal(on[k], off[k]);
  assert.equal(off.combo.main, null);
});
