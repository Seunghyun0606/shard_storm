import { performance } from 'node:perf_hooks';
import { writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { Game } from '../game.js';
import { CONFIG as C } from '../config.js';
import { emptyLevels } from '../progression.js';
export function simulate({ seed = C.seed, levels = emptyLevels(), options = C.options } = {}) {
  const g = new Game({ seed, levels, options, duration: 60 }); let nextAttack = 0; const timings = [];
  g.attack(C.tutorial.x, C.tutorial.y); nextAttack = C.attackInterval;
  while (g.state === 'PLAYING') {
    const before = performance.now();
    if (g.elapsed >= nextAttack - 1e-9) {
      // Same deterministic policy for baseline and upgraded: damage efficiency, then density.
      const live = g.alive.filter(s => s.grace <= 1e-9);
      live.sort((a, b) => {
        const score = s => g.alive.filter(t => t.id !== s.id && Math.hypot(s.x - t.x, s.y - t.y) <= C.shard.range).length * 3 - Math.ceil(s.hp / (C.directDamage + levels.crushPower)) * 2;
        return score(b) - score(a) || a.id - b.id;
      });
      if (live[0]) g.attack(live[0].x, live[0].y); nextAttack += g.stats.attackInterval;
    }
    g.update(C.step); timings.push(performance.now() - before);
    assert.ok(g.shards.length <= C.caps.shards); assert.ok(g.shapes.length <= g.target);
    assert.ok(g.waves.length <= C.caps.waves); assert.ok(g.queue.length <= C.caps.scheduled);
    assert.equal(g.directKills + g.cascadeKills, g.totalDestroyed);
    assert.ok(g.chains.size < C.caps.shards + 2);
  }
  timings.sort((a, b) => a - b);
  return { ...g.record(), simulationStepP95ms: timings[Math.floor(timings.length * .95)], simulationStepMaxMs: timings.at(-1) };
}
const baseline = simulate();
const upgraded = simulate({ levels: { ...emptyLevels(), crushPower: 1, shardPower: 1 } });
const ab = [simulate({ options: { ...C.options, inheritance: false } }), simulate({ options: { ...C.options, ricochet: false } }), simulate({ options: { ...C.options, sequentialPropagation: false } }), simulate({ options: { ...C.options, visualVariety: false } })];
const repetitions = Array.from({ length: 12 }, (_, i) => simulate({ seed: i + 1, levels: i % 2 ? Object.fromEntries(Object.entries(C.upgrades).map(([k, u]) => [k, u.max])) : emptyLevels() }));
assert.ok(baseline.firstCascadeTime < 10);
assert.ok(upgraded.cascadeKills > baseline.cascadeKills, 'permanent upgrades must yield more cascade kills using the same 60s policy/seed');
assert.equal(ab[3].cascadeKills, baseline.cascadeKills); assert.equal(ab[3].photonsEarned, baseline.photonsEarned);
mkdirSync('artifacts', { recursive: true });
const output = { policy: 'deterministic density / HP efficiency, one direct attack every 0.20s, guided first click; all runs 60s', baseline, upgraded, ab, repetitions };
writeFileSync('artifacts/simulation-results.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify({ baseline, upgraded, ab, repeatedRuns: repetitions.length, repeatedSafetyCaps: repetitions.map(r => r.safetyCapsHit) }, null, 2));
