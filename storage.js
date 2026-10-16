import {encodeSave,decodeSave} from './save-codec.js';
import {normalizeCodex,codexInsights,CODEX_IDS} from './codex.js';
import {ELITES,ADVANCED_SHAPES} from './advanced-defs.js';
import { CONFIG as C } from './config.js';
import { emptyLevels } from './progression.js';
import { rankFor, updateDiscovery } from './discovery.js';
import { emptyAchievements, normalizeLoadout, blueprints } from './relics.js';
import { normalizeContracts } from './contracts.js';
import { validMetaPending } from './settlement-validation.js';
import { ECOLOGY_SHAPES } from './ecology-defs.js';
import {normalizeSignatures,normalizeEvolutionOwned,normalizeEvolutionActive} from './builds.js';
export function freshSave() { return { elitePity:0,shapeCodex:normalizeCodex(),codexPinnedIds:[],insightUnlocked:[],eliteHistory:{},advancedIntroFlags:{},signatureLoadout:[],evolutionOwned:normalizeEvolutionOwned({}),evolutionActive:[],shapeIntroSeen:{}, saveVersion: C.saveVersion, bank: 0, levels: emptyLevels(), bestStats: {}, lastRuns: [], options: { ...C.options }, catalystBalance: 0, discoveryRank: 0, lifetimeDestroyed: 0, knownHistoryKills: 0, totalRuns: 0, milestoneWelcomeFlags: {}, pendingSettlement: null, lastSettlementId: null, legacyExtraTimeLevel: 0, timeRespecUsed: false, relicOwned:[],relicEquipped:[],relicAchievements:emptyAchievements(),relicBlueprintUnlocked:[],contracts:{active:[],records:{}},contractMedals:[],anomalyOffer:null,anomalyOfferIndex:0,anomalySeed:null,selectedAnomaly:null,totalAnomalyWins:0 }; }
export function loadSave(storage) {
  const save = freshSave();let raw=null;const preserve=message=>{Object.defineProperty(save,'storageRecovery',{value:{raw,message},enumerable:false});return save;};
  try {
    raw=storage.getItem(C.storageKey);const data=decodeSave(raw);
    if(!data)return save;
    if(!Number.isInteger(data.saveVersion)||data.saveVersion<1||data.saveVersion>C.saveVersion||!Number.isSafeInteger(data.bank)||data.bank<0)return preserve('Unsupported or invalid save header');
    const legacyKeys = ['crushPower', 'shardPower', 'shardRange', 'chainAmplifier', 'extraTime'];
    if (!data.levels || typeof data.levels !== 'object') return preserve('Invalid save levels');
    for (const [key, u] of Object.entries(C.upgrades)) {
      const value = (data.saveVersion < 7 && u.introduced===10)||(data.saveVersion < 4 && u.rank)||(data.saveVersion === 1 && !legacyKeys.includes(key)) ? 0 : data.levels[key] ?? (legacyKeys.includes(key) ? undefined : 0);
      if (!Number.isInteger(value) || value < 0 || value > u.max) continue;
      save.levels[key] = value;
    }
    save.bank = data.bank;
    if(data.saveVersion>=9&&Number.isInteger(data.elitePity)&&data.elitePity>=0&&data.elitePity<=6)save.elitePity=data.elitePity;
    for (const key of ['totalDestroyed', 'bestChain', 'photonsEarned']) if (Number.isSafeInteger(data.bestStats?.[key]) && data.bestStats[key] >= 0) save.bestStats[key] = data.bestStats[key];
    save.lastRuns = Array.isArray(data.lastRuns) ? data.lastRuns.filter(r => r && Number.isFinite(r.photonsEarned)).slice(-C.historyLimit) : [];
    if (data.saveVersion < 3) { save.knownHistoryKills = save.lastRuns.reduce((n,r) => n + (Number.isSafeInteger(r.totalDestroyed) && r.totalDestroyed > 0 ? r.totalDestroyed : 0), 0); save.legacyExtraTimeLevel = save.levels.extraTime; }
    else {
      for (const key of ['catalystBalance', 'discoveryRank', 'lifetimeDestroyed', 'knownHistoryKills', 'totalRuns', 'legacyExtraTimeLevel']) if (Number.isSafeInteger(data[key]) && data[key] >= 0) save[key] = data[key];
      save.timeRespecUsed = data.timeRespecUsed === true;
      if (typeof data.lastSettlementId === 'string') save.lastSettlementId = data.lastSettlementId;
      const pending = data.pendingSettlement;
      if (pending && typeof pending.id === 'string' && Number.isSafeInteger(pending.payout) && pending.payout >= 0 && pending.record?.runId === pending.id && Number.isSafeInteger(pending.record.totalDestroyed) && pending.record.totalDestroyed >= 0 && pending.record.processedPhoton === pending.payout && pending.record.photonsEarned === pending.payout && (pending.catalystPayout === undefined || (Number.isSafeInteger(pending.catalystPayout) && pending.catalystPayout >= 0))&&validMetaPending(pending)) save.pendingSettlement = pending;
    }
    if (data.saveVersion >= 4 && data.milestoneWelcomeFlags) for (let r=1;r<=4;r++) if (data.milestoneWelcomeFlags[r] === true) save.milestoneWelcomeFlags[r] = true;
    if (data.saveVersion < 4) { save.discoveryRank = 0; updateDiscovery(save); }
    else save.discoveryRank = rankFor(save.lifetimeDestroyed);
    if(data.saveVersion>=5){
      save.relicOwned=[...new Set(Array.isArray(data.relicOwned)?data.relicOwned:[])].filter(id=>Object.hasOwn(C.relics,id));save.relicEquipped=normalizeLoadout(data.relicEquipped,save.relicOwned);
      for(const k of Object.keys(save.relicAchievements))if(Number.isSafeInteger(data.relicAchievements?.[k])&&data.relicAchievements[k]>=0)save.relicAchievements[k]=data.relicAchievements[k];
      save.relicBlueprintUnlocked=blueprints(save);
      save.contracts=normalizeContracts(data.contracts);save.contracts.active=save.contracts.active.filter(id=>Object.hasOwn(C.contracts,id));save.contractMedals=Object.keys(C.contracts).filter(id=>save.contracts.records[id]?.maxCompletedStage===3);
      if(typeof data.anomalySeed==='string'&&data.anomalySeed.length<=150)save.anomalySeed=data.anomalySeed;
      for(const k of ['anomalyOfferIndex','totalAnomalyWins'])if(Number.isSafeInteger(data[k])&&data[k]>=0)save[k]=data[k];
      const offer=data.anomalyOffer;if(offer&&typeof offer.offerId==='string'&&typeof offer.seedKey==='string'&&offer.eligibilityRank===save.discoveryRank&&Array.isArray(offer.offeredIds)&&offer.offeredIds.length<=3&&new Set(offer.offeredIds).size===offer.offeredIds.length&&offer.offeredIds.every(id=>C.anomalies[id]?.rank<=save.discoveryRank))save.anomalyOffer=offer;
      save.selectedAnomaly=save.anomalyOffer?.offeredIds.includes(data.selectedAnomaly)?data.selectedAnomaly:null;
    }
    if(data.saveVersion>=8){
      save.shapeCodex=normalizeCodex(data.shapeCodex);save.insightUnlocked=codexInsights(save.shapeCodex);
      save.codexPinnedIds=[...new Set(Array.isArray(data.codexPinnedIds)?data.codexPinnedIds:[])].filter(id=>CODEX_IDS.includes(id)).slice(0,2);
      for(const id of Object.keys(ADVANCED_SHAPES))if(data.advancedIntroFlags?.[id]===true)save.advancedIntroFlags[id]=true;
      for(const id of Object.keys(ELITES)){const row=data.eliteHistory?.[id];if(row)save.eliteHistory[id]=Object.fromEntries(['attempts','spawned','kills'].map(k=>[k,Number.isSafeInteger(row[k])&&row[k]>=0?Math.min(row[k],1e9):0]));}
    }
    if(data.saveVersion>=7){save.signatureLoadout=normalizeSignatures(data.signatureLoadout,save.levels);save.evolutionOwned=normalizeEvolutionOwned(data.evolutionOwned);save.evolutionActive=normalizeEvolutionActive(data.evolutionActive,save.evolutionOwned);}
    for (const key of Object.keys(C.options)) if (typeof data.options?.[key] === 'boolean') save.options[key] = data.options[key];
    for(const id of Object.keys(ECOLOGY_SHAPES))if(data.shapeIntroSeen?.[id]===true)save.shapeIntroSeen[id]=true;
  } catch(error) {if(typeof raw==='string'&&raw.length)preserve(error.message);}
  return save;
}
export function writeSave(storage, save) { if (save.sandbox||save.storageRecovery) return false; try { storage.setItem(C.storageKey, encodeSave(save)); return true; } catch { return false; } }
