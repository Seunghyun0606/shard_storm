import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { simulate as runLegacy } from './simulation.js';
const simulate = (args = {}) => runLegacy({ ...args, ruleset: 'legacy_v08', duration: args.duration ?? 60, options: { ...args.options, motionEnabled: false } });
import { CONFIG as C } from '../config.js';
import { emptyLevels, settle } from '../progression.js';
import { freshSave } from '../storage.js';
import { EconomySandbox, buildPresets, buildCost, affordableNodes, nextPurchase, nodeComparisons, economyPresets } from '../economy.js';

const seeds = [31415, 1, 7, 42, 99], cache = new Map();
const run = args => { const key = JSON.stringify(args); if (!cache.has(key)) cache.set(key, simulate(args)); return cache.get(key); };
const median = values => [...values].sort((a,b) => a-b)[Math.floor(values.length / 2)];
const range = values => [Math.min(...values), Math.max(...values)];
function summary(runs) {
  const density = r => r.bins.reduce((s,b) => s + b.aliveIntegral, 0) / r.durationSeconds;
  return { runs: runs.length, destroyedMedian: median(runs.map(r => r.totalDestroyed)), destroyedRange: range(runs.map(r => r.totalDestroyed)), photonMedian: median(runs.map(r => r.photonsEarned)), photonRange: range(runs.map(r => r.photonsEarned)), cascadeRatioMedian: median(runs.map(r => r.cascadeKills / Math.max(1, r.totalDestroyed))), bestChainMedian: median(runs.map(r => r.bestChain)), densityMedian: median(runs.map(density)), emptySecondsMedian: median(runs.map(r => r.emptyArenaDuration)), emptyEpisodesOverHalfSecond: runs.reduce((s,r) => s + r.emptyEpisodesOverHalfSecond, 0), spawnFailures: runs.reduce((s,r) => s + r.spawnFailures, 0), capsMedian: median(runs.map(r => r.safetyCapsHit)), capRange: range(runs.map(r => r.safetyCapsHit)), stepP95MedianMs: median(runs.map(r => r.simulationStepP95ms)), photonPerSecondMedian: median(runs.map(r => r.photonsEarned / r.durationSeconds)) };
}
const scenarios = [{ name: 'vanilla', modifiers: false, experiment: 'baseline' }, ...['baseline', 'spread', 'fast', 'fast_spread'].map(experiment => ({ name: `modifiers_${experiment}`, modifiers: true, experiment }))];
const difficulty = [];
for (const scenario of scenarios) for (const build of ['Baseline', 'Upgraded']) {
  const runs = seeds.map(seed => run({ seed, levels: { ...emptyLevels(), ...buildPresets[build] }, options: { ...C.options, modifiers: scenario.modifiers }, experiment: scenario.experiment, duration: 60 }));
  difficulty.push({ scenario: scenario.name, build, summary: summary(runs), runs });
}
console.log('Difficulty: 50 controlled runs complete.');
const builds = Object.entries(buildPresets).map(([build, levels]) => {
  const fixed = seeds.map(seed => run({ seed, levels: { ...emptyLevels(), ...levels }, duration: 60 }));
  const actualDuration = 60 + 5 * (levels.extraTime || 0);
  const actual = actualDuration === 60 ? fixed : seeds.map(seed => run({ seed, levels: { ...emptyLevels(), ...levels }, duration: actualDuration }));
  return { build, levels, cost: Object.fromEntries(Object.keys(economyPresets).map(p => [p, buildCost(levels, p)])), fixed60: summary(fixed), actualDuration, actual: summary(actual), actualNormalizedPhoton60: median(actual.map(r => r.photonsEarned * 60 / r.durationSeconds)), fixedRuns: fixed, actualRuns: actual };
});
const nodes = nodeComparisons().map(n => {
  const before = seeds.map(seed => run({ seed, levels: n.before, duration: 60 })), after = seeds.map(seed => run({ seed, levels: n.after, duration: 60 }));
  const stats = r => ({ seed: r.seed, totalDestroyed: r.totalDestroyed, cascadeKills: r.cascadeKills, bestChain: r.bestChain, photonsEarned: r.photonsEarned, caps: r.safetyCapsHit });
  const earningCapacity = Object.keys(economyPresets).map(p => ({ preset: p, thresholdTimeMedian: median(before.map(r => r.earningThresholdTimes[`${n.key}:${p}`] ?? Infinity)), purchaseAt: 'end of first run with prerequisites already owned', affordableAfterFirstRun: before.filter(r => r.photonsEarned >= n.costs[p]).length }));
  return { ...n, before: summary(before), after: summary(after), beforeLevels: n.before, afterLevels: n.after, seedPairs: before.map((r,i) => ({ before: stats(r), after: stats(after[i]) })), earningCapacity };
});
console.log('Build, utility and all 11 node comparisons complete.');
const growth = [];
for (const strategy of ['Crusher', 'Cascade', 'Reactor']) for (const preset of Object.keys(economyPresets)) for (const seed of seeds) {
  const source = freshSave(), sandbox = new EconomySandbox(source, preset), runs = []; let purchases = 0;
  for (let index = 1; index <= 5; index++) {
    const r = run({ seed, levels: { ...sandbox.save.levels }, duration: 60 + 5 * sandbox.save.levels.extraTime });
    const availableBeforePurchases = affordableNodes(sandbox.save.levels, sandbox.save.bank + r.photonsEarned, preset);
    const reward = { state: 'RESULT', ruleset: 'legacy_v08', sandbox: true, settled: false, record: () => r }; assert.equal(settle(sandbox.save, reward), true); assert.equal(settle(sandbox.save, reward), false);
    const buys = [];
    for (let i = 0; i < 100; i++) { const key = nextPurchase(sandbox.save.levels, strategy); if (!key || !sandbox.buy(key, 'RESULT')) break; buys.push(key); purchases++; }
    runs.push({ run: index, duration: r.durationSeconds, photons: r.photonsEarned, kills: r.totalDestroyed, bestChain: r.bestChain, caps: r.safetyCapsHit, affordableNodeCount: availableBeforePurchases.length, purchases: buys, totalPurchases: purchases, levels: { ...sandbox.save.levels }, bank: sandbox.save.bank });
  }
  assert.deepEqual(source, freshSave()); growth.push({ strategy, preset, seed, runs });
}
const growthSummary = [];
for (const strategy of ['Crusher', 'Cascade', 'Reactor']) for (const preset of Object.keys(economyPresets)) {
  const group = growth.filter(r => r.strategy === strategy && r.preset === preset);
  growthSummary.push({ strategy, preset, runs: [1, 3, 5].map(index => ({ run: index, purchaseCountMedian: median(group.map(g => g.runs[index - 1].totalPurchases)), firstRunAffordableNodesMedian: median(group.map(g => g.runs[0].affordableNodeCount)), capsMedian: median(group.map(g => g.runs[index - 1].caps)), bankMedian: median(group.map(g => g.runs[index - 1].bank)) })) });
}
// Repeat the same no-purchase run to distinguish RNG/learning from skill effects.
const repeat = simulate({ seed: 31415, options: { ...C.options, modifiers: false } });
const reference = difficulty.find(d => d.scenario === 'vanilla' && d.build === 'Baseline').runs[0];
assert.equal(repeat.totalDestroyed, reference.totalDestroyed); assert.equal(repeat.photonsEarned, reference.photonsEarned);
assert.equal(reference.experiment.spawnInterval, .20); assert.equal(reference.modifiersEnabled, false);
const output = { inputPolicy: 'auto:density-hp-v1; derived cadence; guided first input; deterministic same-seed comparisons', interpretation: 'diagnostics only, not human enjoyment; price presets never promoted to live settings', seeds, uniqueSimulations: cache.size + 1, difficulty, builds, nodes, growth, growthSummary, noPurchaseRepeat: { kills: repeat.totalDestroyed, photons: repeat.photonsEarned, matched: true } };
writeFileSync('artifacts/v09-v08-balance-regression.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify({ uniqueSimulations: output.uniqueSimulations, difficulty: difficulty.map(d => ({ scenario: d.scenario, build: d.build, ...d.summary })), builds: builds.map(b => ({ build: b.build, cost: b.cost, fixed60: b.fixed60, actualDuration: b.actualDuration, actual: b.actual, actualNormalizedPhoton60: b.actualNormalizedPhoton60 })), growthSummary }, null, 2));
