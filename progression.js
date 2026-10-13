import { CONFIG as C } from './config.js';
import { getDerivedStats, skillCost, skillState } from './skill-tree.js';
export const TYPES = Object.keys(C.shapes);
export const emptyLevels = () => Object.fromEntries(Object.keys(C.upgrades).map(k => [k, 0]));
export function tierFor(kills) { let tier = 0; C.tiers.forEach((t, i) => { if (kills >= t.threshold) tier = i; }); return tier; }
export function upgradeCost(key, level) { return skillCost(key, level); }
export function durationFor(levels) { return getDerivedStats(levels).duration; }
export function buyUpgrade(save, key, state) {
  const u = C.upgrades[key];
  if (state !== 'RESULT' || !u || !skillState(key, save.levels, save.bank).canBuy) return false;
  const cost = upgradeCost(key, save.levels[key]);
  if (save.bank < cost) return false;
  save.bank -= cost; save.levels[key]++; return true;
}
export function settle(save, run) {
  if (run.state !== 'RESULT' || run.settled || (run.sandbox && !save.sandbox)) return false;
  run.settled = true;
  const record = run.record();
  save.bank += record.photonsEarned;
  save.lastRuns = [...save.lastRuns, record].slice(-C.historyLimit);
  for (const key of ['totalDestroyed', 'bestChain', 'photonsEarned']) save.bestStats[key] = Math.max(save.bestStats[key] || 0, record[key]);
  return true;
}
