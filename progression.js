import { CONFIG as C } from './config.js';
import { getDerivedStats, skillCost, skillState } from './skill-tree.js';
import { ensureRefinery } from './refinery.js';
import { updateDiscovery } from './discovery.js';
export const TYPES = Object.keys(C.shapes).filter(k=>!C.shapes[k].special);
export const emptyLevels = () => Object.fromEntries(Object.keys(C.upgrades).map(k => [k, 0]));
export function tierFor(kills, tiers = C.tiers) { let tier = 0; tiers.forEach((t, i) => { if (kills >= t.threshold) tier = i; }); return tier; }
export function upgradeCost(key, level) { return skillCost(key, level); }
export function durationFor(levels) { return getDerivedStats(levels).duration; }
export function buyUpgrade(save, key, state) {
  const u = C.upgrades[key];
  if (state !== 'RESULT' || !u || !skillState(key, save.levels, save.bank,save).canBuy || save.pendingSettlement) return false;
  const cost = upgradeCost(key, save.levels[key]);
  if (save.bank < cost) return false;
  const catalystCost=u.catalyst?.[save.levels[key]]||0;
  save.bank -= cost; save.catalystBalance=(save.catalystBalance||0)-catalystCost; save.levels[key]++; return true;
}
export function settle(save, run) {
  if (run.state !== 'RESULT' || run.settled || (run.sandbox && !save.sandbox)) return false;
  if (run.ruleset !== 'legacy_v08') {
    stageSettlement(save, run);
    const done = completeSettlement(save); if (done) run.settled = true; return done;
  }
  run.settled = true;
  const record = run.record();
  save.bank += record.photonsEarned;
  save.lastRuns = [...save.lastRuns, record].slice(-C.historyLimit);
  for (const key of ['totalDestroyed', 'bestChain', 'photonsEarned']) save.bestStats[key] = Math.max(save.bestStats[key] || 0, record[key]);
  return true;
}
export function stageSettlement(save, run) {
  if (run.state !== 'RESULT' || run.settled || (run.sandbox && !save.sandbox)) return false;
  const plan = ensureRefinery(run); if (!plan || save.lastSettlementId === plan.id) return false;
  if (save.pendingSettlement && save.pendingSettlement.id !== plan.id) throw new Error('Unfinished settlement');
  save.pendingSettlement ||= { id: plan.id, runId: plan.id, saveSchema: C.saveVersion, payout: plan.payout, catalystPayout: run.pendingCatalyst || run.record().pendingCatalyst || 0, rawBase:run.rawBase||0,rawOreBonus:run.rawOreBonus||0,skillRawBonus:run.rawSkillBonus||0,totalDestroyed:run.totalDestroyed||run.record().totalDestroyed,oreKills:run.oreKills||{}, milestoneProgress:run.discoveryRank||0,shapeUnlockEvents:run.welcomeConsumed||[],record: { ...run.record(), photonsEarned: plan.payout, processedPhoton: plan.payout, bankBefore: save.bank, bankAfter: save.bank + plan.payout } };
  return true;
}
export function completeSettlement(save) {
  const pending = save.pendingSettlement; if (!pending) return false;
  if (save.lastSettlementId === pending.id) { save.pendingSettlement = null; return false; }
  if(![save.bank+pending.payout,(save.catalystBalance||0)+(pending.catalystPayout||0),(save.lifetimeDestroyed||0)+pending.record.totalDestroyed,(save.totalRuns||0)+1].every(Number.isSafeInteger)){save.pendingSettlement=null;return false;}
  save.bank += pending.payout; save.lastSettlementId = pending.id; save.pendingSettlement = null;
  save.totalRuns = (save.totalRuns || 0) + 1; save.lifetimeDestroyed = (save.lifetimeDestroyed || 0) + pending.record.totalDestroyed;
  save.catalystBalance = (save.catalystBalance || 0) + (pending.catalystPayout || 0);
  updateDiscovery(save);
  for (const rank of Array.isArray(pending.record.welcomeConsumed)?pending.record.welcomeConsumed:[]) delete save.milestoneWelcomeFlags[rank];
  save.lastRuns = [...save.lastRuns, pending.record].slice(-C.historyLimit);
  for (const key of ['totalDestroyed', 'bestChain', 'photonsEarned']) save.bestStats[key] = Math.max(save.bestStats[key] || 0, pending.record[key]);
  return true;
}
export function refundLegacyTime(save, state) {
  if (state !== 'RESULT' || save.timeRespecUsed || !save.legacyExtraTimeLevel || save.levels.extraTime < save.legacyExtraTimeLevel) return 0;
  const amount = Array.from({ length: save.legacyExtraTimeLevel }, (_, i) => upgradeCost('extraTime', i)).reduce((a,b) => a+b, 0);
  save.levels.extraTime -= save.legacyExtraTimeLevel; save.bank += amount; save.timeRespecUsed = true; return amount;
}
