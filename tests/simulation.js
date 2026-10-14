import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { Game } from '../game.js';
import { CONFIG as C } from '../config.js';
import { emptyLevels } from '../progression.js';
import { experimentCost } from '../economy.js';

export function chooseTarget(g) {
  const live = g.alive.filter(s => s.grace <= 1e-9), all = g.alive;
  const score = s => all.filter(t => t.id !== s.id && Math.hypot(s.x - t.x, s.y - t.y) <= C.shard.range).length * 3 - Math.ceil(s.hp / g.stats.directDamage) * 2;
  return live.map(s => ({ s, score: score(s) })).sort((a, b) => b.score - a.score || a.s.id - b.s.id)[0]?.s;
}
export function simulate({ seed = C.seed, levels = emptyLevels(), options = C.options, duration = C.duration, experiment = 'baseline', ruleset = 'v09', tierPreset = 'v09_short', runId = `simulation-${seed}`,discoveryRank=0,welcomeFlags={},contentMode='M5_M6_ON',oreEnabled=true } = {}) {
  const g = new Game({ seed, levels, options, duration, experiment, ruleset, tierPreset, runId,discoveryRank,welcomeFlags,contentMode,oreEnabled, inputPolicy: 'auto:density-hp-v1', sandbox: true });
  let nextAttack = C.attackInterval; const timings = [], earningThresholdTimes = {};
  const thresholds = Object.fromEntries(Object.keys(C.upgrades).map(k => [k, Object.fromEntries(['baseline', 'cost_x3', 'cost_x6'].map(p => [p, experimentCost(k, g.levels[k], p)]))]));
  g.attack(C.tutorial.x, C.tutorial.y);
  while (g.state === 'PLAYING') {
    const before = performance.now();
    if (g.elapsed >= nextAttack - 1e-9) { const s = chooseTarget(g); if (s) g.attack(s.x, s.y); nextAttack += g.stats.attackInterval; }
    g.update(C.step); timings.push(performance.now() - before);
    for (const [key, presets] of Object.entries(thresholds)) for (const [preset, cost] of Object.entries(presets)) {
      const id = `${key}:${preset}`; if (g.runEarned >= cost && earningThresholdTimes[id] === undefined) earningThresholdTimes[id] = g.elapsed;
    }
    assert.ok(g.shards.length <= C.caps.shards); assert.ok(g.shapes.length <= g.target);
    assert.ok(g.waves.length <= C.caps.waves); assert.ok(g.queue.length <= C.caps.scheduled);
    assert.equal(g.directKills + g.cascadeKills, g.totalDestroyed); assert.ok(g.chains.size < C.caps.shards + 2);
    assert.ok(g.alive.filter(s => s.modifier === 'charged').length <= C.modifiers.chargedCap);
  }
  const r = g.record();
  assert.ok(r.physicsChecks.maxWaveContactError < .002); assert.ok(r.physicsChecks.maxProjectileContactError < .002); assert.equal(r.physicsChecks.lateWaveContacts, 0);
  for (const [field, total] of [['totalDestroyed', r.totalDestroyed], ['directKills', r.directKills], ['cascadeKills', r.cascadeKills], ['earnedPhoton', r.rawEarned], ['safetyCapsHit', r.safetyCapsHit]]) assert.equal(r.bins.reduce((sum, b) => sum + b[field], 0), total);
  assert.ok(Math.abs(r.bins.reduce((sum, b) => sum + b.sampledSeconds, 0) - duration) < 1e-6);
  timings.sort((a, b) => a - b);
  return { ...r, earningThresholdTimes, purchasingAllowedAt: 'RESULT only; threshold time is earning capacity, not an in-run purchase', simulationSampleCount: timings.length, simulationStepP95ms: timings[Math.floor(timings.length * .95)], simulationStepMaxMs: timings.at(-1) };
}
