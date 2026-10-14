import { CONFIG as C } from './config.js';
import { skillCost, skillState, skillDefinitions, getDerivedStats } from './skill-tree.js';
import { emptyLevels } from './progression.js';

export const economyPresets = { baseline: 1, cost_x3: 3, cost_x6: 6 };
export const buildPresets = {
  Baseline: {}, Upgraded: { crushPower: 1, shardPower: 1 },
  Crusher: { crushPower: 2, crushSpeed: 2, impactPulse: 1 },
  Cascade: { shardPower: 2, shardRange: 1, shardBloom: 1, ricochetPlus: 1 },
  Reactor: { chainAmplifier: 2, echoCatalyst: 1 },
  ExtraTime: { extraTime: 1 }, PhotonBoost: { extraTime: 1, photonBoost: 1 },
  UtilityMax: { extraTime: 6, photonBoost: 3 }
};
export function experimentCost(key, level, preset = 'baseline') {
  const multiplier = economyPresets[preset]; if (!multiplier) throw new Error('Unknown economy preset');
  return Math.ceil(C.upgrades[key].baseCost * multiplier * C.costGrowth ** level);
}
export function economyState(key, levels, bank, preset = 'baseline', progression = {}) {
  const state = skillState(key, levels, bank,progression), cost = experimentCost(key, state.level || 0, preset);
  return { ...state, cost, affordable: bank >= cost && state.catalystMet, canBuy: state.unlocked && !state.max && bank >= cost && state.catalystMet,
    state: state.state === 'affordable' || state.state === 'available' ? bank >= cost ? 'affordable' : 'available' : state.state };
}
// A deep copy with no storage handle. It cannot write the live user's save.
export class EconomySandbox {
  constructor(source, preset = 'baseline') { if (!economyPresets[preset]) throw new Error('Unknown economy preset'); this.preset = preset; this.save = { ...structuredClone(source), sandbox: true }; }
  state = (key, levels = this.save.levels, bank = this.save.bank) => economyState(key, levels, bank, this.preset,this.save);
  buy(key, state) {
    if (state !== 'RESULT' || !C.upgrades[key] || !this.state(key).canBuy || this.save.pendingSettlement) return false;
    this.save.bank -= experimentCost(key, this.save.levels[key], this.preset); this.save.catalystBalance-=this.state(key).catalystCost;this.save.levels[key]++; return true;
  }
}
export function buildCost(levels, preset = 'baseline') {
  return Object.entries(levels).reduce((sum, [key, level]) => sum + Array.from({ length: level }, (_, i) => experimentCost(key, i, preset)).reduce((a, b) => a + b, 0), 0);
}
export function affordableNodes(levels, bank, preset = 'baseline') { return skillDefinitions.filter(n => economyState(n.id, levels, bank, preset).canBuy).map(n => n.id); }
// Prerequisite-respecting next level for a defined growth strategy, then remaining branches.
export function nextPurchase(levels, strategy = 'Crusher') {
  const priorities = { Crusher: ['crushPower', 'crushSpeed', 'impactPulse'], Cascade: ['shardPower', 'shardRange', 'shardBloom', 'ricochetPlus'], Reactor: ['chainAmplifier', 'echoCatalyst'] };
  const keys = [...(priorities[strategy] || []), ...Object.keys(C.upgrades)];
  return keys.find(k => skillState(k, levels, Infinity).canBuy) || null;
}
export function nodeComparisons() {
  return skillDefinitions.map(node => {
    const before = emptyLevels(); for (const p of node.prerequisites) before[p.id] = p.minLevel;
    // Recursively fill prerequisite ancestors (e.g. Ricochet → Range → Power).
    let changed; do { changed = false; for (const n of skillDefinitions) if (before[n.id]) for (const p of n.prerequisites) if (before[p.id] < p.minLevel) { before[p.id] = p.minLevel; changed = true; } } while (changed);
    const after = { ...before, [node.id]: before[node.id] + 1 };
    return { key: node.id, before, after, costs: Object.fromEntries(Object.keys(economyPresets).map(p => [p, experimentCost(node.id, before[node.id], p)])), beforeStats: getDerivedStats(before), afterStats: getDerivedStats(after), liveCost: skillCost(node.id, before[node.id]) };
  });
}
