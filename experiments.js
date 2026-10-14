import { CONFIG as C } from './config.js';

export const spawnPresets = {
  baseline: { spawnInterval: .20, spawnBatch: 3, clusterChance: .60 },
  spread: { spawnInterval: .20, spawnBatch: 3, clusterChance: .45 },
  fast: { spawnInterval: .15, spawnBatch: 3, clusterChance: .60 },
  fast_spread: { spawnInterval: .15, spawnBatch: 3, clusterChance: .45 },
  m9_adaptive: { spawnInterval: .20, spawnBatch: 3, clusterChance: .60, adaptive: true }
};
export function spawnSettings(value = 'baseline') {
  const settings = typeof value === 'string' ? spawnPresets[value] : value;
  if (!settings) throw new Error('Unknown spawn preset');
  const result = { spawnInterval: C.spawnInterval, spawnBatch: C.spawnBatch, clusterChance: C.clusterChance, ...settings };
  if (!Number.isFinite(result.spawnInterval) || result.spawnInterval < .05 || result.spawnInterval > 1 || !Number.isInteger(result.spawnBatch) || result.spawnBatch < 1 || result.spawnBatch > 6 || !Number.isFinite(result.clusterChance) || result.clusterChance < 0 || result.clusterChance > 1) throw new Error('Invalid spawn experiment');
  return result;
}
