import { CONFIG as C } from './config.js';
export const rankFor = kills => C.discovery.findLastIndex(r => kills >= r.threshold);
export function discoveryView(save) {
  const rank = rankFor(save.lifetimeDestroyed || 0), next = C.discovery[rank + 1];
  return { rank, next, destroyed: save.lifetimeDestroyed || 0, knownHistoryKills: save.knownHistoryKills || 0,
    progress: next ? Math.min(1, (save.lifetimeDestroyed || 0) / next.threshold) : 1 };
}
export function updateDiscovery(save) {
  const previous = save.discoveryRank || 0; save.discoveryRank = rankFor(save.lifetimeDestroyed || 0);
  save.milestoneWelcomeFlags ||= {};
  for (let r = previous + 1; r <= save.discoveryRank; r++) save.milestoneWelcomeFlags[r] = true;
  return save.discoveryRank - previous;
}
