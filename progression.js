import {modeSettlement,applyModeSettlement} from './modes.js';
import {worldSettlement,applyWorldSettlement} from './campaign/worlds.js';
import {codexSnapshot,validCodexSnapshot,applyCodex} from './codex.js';
import {eliteSettlement} from './spawn-director.js';
import { CONFIG as C } from './config.js';
import { getDerivedStats, skillCost, skillState } from './skill-tree.js';
import { ensureRefinery } from './refinery.js';
import { updateDiscovery } from './discovery.js';
import { blueprints,emptyAchievements } from './relics.js';
import { applyContracts } from './contracts.js';
import { validMetaPending } from './settlement-validation.js';
import { ECOLOGY_SHAPES } from './ecology-defs.js';
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
  if(run.modeContext?.kind==='draft'){if(save.lastSettlementId===run.runId||save.draftProgress?.challengeId!==run.modeContext.id||save.draftProgress?.round!==run.modeContext.round||save.draftProgress.waiting)return false;if(save.pendingSettlement)return save.pendingSettlement.id===run.runId;const record=run.record();save.pendingSettlement={id:run.runId,runId:run.runId,saveSchema:C.saveVersion,payout:0,catalystPayout:0,modeSnapshot:modeSettlement(run),record:{...record,photonsEarned:0,processedPhoton:0,photonPayout:0,refineryPayout:0,draftScoreOnly:true,bankBefore:save.bank,bankAfter:save.bank}};return true;}
  const plan = ensureRefinery(run); if (!plan || save.lastSettlementId === plan.id) return false;
  if (save.pendingSettlement && save.pendingSettlement.id !== plan.id) throw new Error('Unfinished settlement');
  const record=run.record(),deltas=Object.fromEntries(Object.keys(emptyAchievements()).map(k=>[k,run.metaEnabled===false?0:record.metaCounters?.[k]||0]));
  const meta=run.metaResult||record.metaResult,contractPlan=meta?.contracts||{changes:[],completed:[],photon:0,catalyst:0},anomaly=meta?.anomaly||{id:null,succeeded:false,photon:0},baseCatalyst=run.pendingCatalyst||record.pendingCatalyst||0,calibrationPhoton=run.calibrationPhoton||0,payout=plan.payout+calibrationPhoton+contractPlan.photon+anomaly.photon,catalystPayout=baseCatalyst+contractPlan.catalyst;
  if(![payout,catalystPayout,...Object.values(deltas)].every(n=>Number.isSafeInteger(n)&&n>=0))return false;
  save.pendingSettlement ||= { id: plan.id, runId: plan.id, saveSchema: C.saveVersion,modeSnapshot:modeSettlement(run),elitePolicySnapshot:eliteSettlement(run),worldSnapshot:worldSettlement(run),codexSnapshot:codexSnapshot(run),relicAchievementDeltas:deltas,contractPlan,contractsCompleted:contractPlan.completed,contractPhoton:contractPlan.photon,contractCatalyst:contractPlan.catalyst,anomalyId:anomaly.id,anomalySucceeded:anomaly.succeeded,anomalyPhoton:anomaly.photon,payoutBreakdown:{refineryPhoton:plan.payout,calibrationPhoton,contractPhoton:contractPlan.photon,anomalyPhoton:anomaly.photon,baseCatalyst,contractCatalyst:contractPlan.catalyst},payout,catalystPayout, rawBase:run.rawBase||0,rawOreBonus:run.rawOreBonus||0,skillRawBonus:run.rawSkillBonus||0,totalDestroyed:run.totalDestroyed||record.totalDestroyed,oreKills:run.oreKills||{}, milestoneProgress:run.discoveryRank||0,shapeUnlockEvents:run.welcomeConsumed||[],record: { ...record, photonsEarned:payout,processedPhoton:payout,photonPayout:payout,refineryPayout:plan.payout,payoutBreakdown:{refineryPhoton:plan.payout,calibrationPhoton,contractPhoton:contractPlan.photon,anomalyPhoton:anomaly.photon,baseCatalyst,contractCatalyst:contractPlan.catalyst},bankBefore:save.bank,bankAfter:save.bank+payout } };
  return true;
}
export function completeSettlement(save) {
  const pending = save.pendingSettlement; if (!pending) return false;
  if(!validMetaPending(pending)){save.pendingSettlement=null;return false;}
  if (save.lastSettlementId === pending.id) { save.pendingSettlement = null; return false; }
  if(![save.bank+pending.payout,(save.catalystBalance||0)+(pending.catalystPayout||0),(save.lifetimeDestroyed||0)+pending.record.totalDestroyed,(save.totalRuns||0)+1].every(Number.isSafeInteger)){save.pendingSettlement=null;return false;}
  if(pending.modeSnapshot?.context.kind==='draft'){const d=save.draftProgress,c=pending.modeSnapshot.context;if(!d||d.challengeId!==c.id||d.round!==c.round||d.waiting||JSON.stringify(d.chosen)!==JSON.stringify(c.perks))return false;applyModeSettlement(save,pending.modeSnapshot);save.lastSettlementId=pending.id;save.pendingSettlement=null;save.lastRuns=[...save.lastRuns,pending.record].slice(-C.historyLimit);return true;}
  save.bank += pending.payout; save.lastSettlementId = pending.id; save.pendingSettlement = null;
  save.totalRuns = (save.totalRuns || 0) + 1; save.lifetimeDestroyed = (save.lifetimeDestroyed || 0) + pending.record.totalDestroyed;
  save.catalystBalance = (save.catalystBalance || 0) + (pending.catalystPayout || 0);
  updateDiscovery(save);
  save.relicAchievements ||= emptyAchievements();for(const key of Object.keys(save.relicAchievements)){const delta=pending.relicAchievementDeltas?.[key]||0;if(Number.isSafeInteger(delta)&&delta>=0&&Number.isSafeInteger(save.relicAchievements[key]+delta))save.relicAchievements[key]+=delta;}
  save.relicBlueprintUnlocked=blueprints(save);
  if(validCodexSnapshot(pending.codexSnapshot,pending.id))applyCodex(save,pending.codexSnapshot);
  if(pending.elitePolicySnapshot)save.elitePity=pending.elitePolicySnapshot.next;applyWorldSettlement(save,pending.worldSnapshot);applyModeSettlement(save,pending.modeSnapshot);
  if(pending.contractPlan)applyContracts(save,pending.contractPlan);
  if(pending.anomalySucceeded)save.totalAnomalyWins=(save.totalAnomalyWins||0)+1;
  save.shapeIntroSeen ||= {};for(const id of pending.record.introConsumed||[])if(Object.hasOwn(ECOLOGY_SHAPES,id))save.shapeIntroSeen[id]=true;
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
