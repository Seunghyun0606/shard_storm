import { CONFIG as C } from './config.js';
import { emptyLevels } from './progression.js';
export function freshSave() { return { saveVersion: C.saveVersion, bank: 0, levels: emptyLevels(), bestStats: {}, lastRuns: [], options: { ...C.options } }; }
export function loadSave(storage) {
  const save = freshSave();
  try {
    const data = JSON.parse(storage.getItem(C.storageKey));
    if (!data || ![1, C.saveVersion].includes(data.saveVersion) || !Number.isSafeInteger(data.bank) || data.bank < 0) return save;
    const legacyKeys = ['crushPower', 'shardPower', 'shardRange', 'chainAmplifier', 'extraTime'];
    if (!data.levels || typeof data.levels !== 'object') return save;
    for (const [key, u] of Object.entries(C.upgrades)) {
      const value = data.saveVersion === 1 && !legacyKeys.includes(key) ? 0 : data.levels[key] ?? (legacyKeys.includes(key) ? undefined : 0);
      if (!Number.isInteger(value) || value < 0 || value > u.max) return freshSave();
      save.levels[key] = value;
    }
    save.bank = data.bank;
    for (const key of ['totalDestroyed', 'bestChain', 'photonsEarned']) if (Number.isSafeInteger(data.bestStats?.[key]) && data.bestStats[key] >= 0) save.bestStats[key] = data.bestStats[key];
    save.lastRuns = Array.isArray(data.lastRuns) ? data.lastRuns.filter(r => r && Number.isFinite(r.photonsEarned)).slice(-C.historyLimit) : [];
    for (const key of Object.keys(C.options)) if (typeof data.options?.[key] === 'boolean') save.options[key] = data.options[key];
  } catch { /* Invalid or inaccessible storage starts with a safe empty save. */ }
  return save;
}
export function writeSave(storage, save) { try { storage.setItem(C.storageKey, JSON.stringify(save)); return true; } catch { return false; } }
