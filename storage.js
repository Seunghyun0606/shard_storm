import { CONFIG as C } from './config.js';
import { emptyLevels } from './progression.js';
import { rankFor, updateDiscovery } from './discovery.js';
import { emptyAchievements, normalizeLoadout, blueprints } from './relics.js';
export function freshSave() { return { saveVersion: C.saveVersion, bank: 0, levels: emptyLevels(), bestStats: {}, lastRuns: [], options: { ...C.options }, catalystBalance: 0, discoveryRank: 0, lifetimeDestroyed: 0, knownHistoryKills: 0, totalRuns: 0, milestoneWelcomeFlags: {}, pendingSettlement: null, lastSettlementId: null, legacyExtraTimeLevel: 0, timeRespecUsed: false, relicOwned:[],relicEquipped:[],relicAchievements:emptyAchievements(),relicBlueprintUnlocked:[],contracts:{active:[],records:{}},contractMedals:[],anomalyOffer:null,anomalyOfferIndex:0,anomalySeed:null,selectedAnomaly:null,totalAnomalyWins:0 }; }
export function loadSave(storage) {
  const save = freshSave();
  try {
    const data = JSON.parse(storage.getItem(C.storageKey));
    if (!data || ![1, 2, 3, 4, 5].includes(data.saveVersion) || !Number.isSafeInteger(data.bank) || data.bank < 0) return save;
    const legacyKeys = ['crushPower', 'shardPower', 'shardRange', 'chainAmplifier', 'extraTime'];
    if (!data.levels || typeof data.levels !== 'object') return save;
    for (const [key, u] of Object.entries(C.upgrades)) {
      const value = (data.saveVersion < 4 && u.rank)||(data.saveVersion === 1 && !legacyKeys.includes(key)) ? 0 : data.levels[key] ?? (legacyKeys.includes(key) ? undefined : 0);
      if (!Number.isInteger(value) || value < 0 || value > u.max) continue;
      save.levels[key] = value;
    }
    save.bank = data.bank;
    for (const key of ['totalDestroyed', 'bestChain', 'photonsEarned']) if (Number.isSafeInteger(data.bestStats?.[key]) && data.bestStats[key] >= 0) save.bestStats[key] = data.bestStats[key];
    save.lastRuns = Array.isArray(data.lastRuns) ? data.lastRuns.filter(r => r && Number.isFinite(r.photonsEarned)).slice(-C.historyLimit) : [];
    if (data.saveVersion < 3) { save.knownHistoryKills = save.lastRuns.reduce((n,r) => n + (Number.isSafeInteger(r.totalDestroyed) && r.totalDestroyed > 0 ? r.totalDestroyed : 0), 0); save.legacyExtraTimeLevel = save.levels.extraTime; }
    else {
      for (const key of ['catalystBalance', 'discoveryRank', 'lifetimeDestroyed', 'knownHistoryKills', 'totalRuns', 'legacyExtraTimeLevel']) if (Number.isSafeInteger(data[key]) && data[key] >= 0) save[key] = data[key];
      save.timeRespecUsed = data.timeRespecUsed === true;
      if (typeof data.lastSettlementId === 'string') save.lastSettlementId = data.lastSettlementId;
      const pending = data.pendingSettlement;
      if (pending && typeof pending.id === 'string' && Number.isSafeInteger(pending.payout) && pending.payout >= 0 && pending.record?.runId === pending.id && Number.isSafeInteger(pending.record.totalDestroyed) && pending.record.totalDestroyed >= 0 && pending.record.processedPhoton === pending.payout && pending.record.photonsEarned === pending.payout && (pending.catalystPayout === undefined || (Number.isSafeInteger(pending.catalystPayout) && pending.catalystPayout >= 0))) save.pendingSettlement = pending;
    }
    if (data.saveVersion >= 4 && data.milestoneWelcomeFlags) for (let r=1;r<=4;r++) if (data.milestoneWelcomeFlags[r] === true) save.milestoneWelcomeFlags[r] = true;
    if (data.saveVersion < 4) { save.discoveryRank = 0; updateDiscovery(save); }
    else save.discoveryRank = rankFor(save.lifetimeDestroyed);
    if(data.saveVersion===5){
      save.relicOwned=[...new Set(Array.isArray(data.relicOwned)?data.relicOwned:[])].filter(id=>C.relics[id]);save.relicEquipped=normalizeLoadout(data.relicEquipped,save.relicOwned);
      for(const k of Object.keys(save.relicAchievements))if(Number.isSafeInteger(data.relicAchievements?.[k])&&data.relicAchievements[k]>=0)save.relicAchievements[k]=data.relicAchievements[k];
      save.relicBlueprintUnlocked=blueprints(save);
    }
    for (const key of Object.keys(C.options)) if (typeof data.options?.[key] === 'boolean') save.options[key] = data.options[key];
  } catch { /* Invalid or inaccessible storage starts with a safe empty save. */ }
  return save;
}
export function writeSave(storage, save) { if (save.sandbox) return false; try { storage.setItem(C.storageKey, JSON.stringify(save)); return true; } catch { return false; } }
