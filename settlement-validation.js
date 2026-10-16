import{CONFIG as C}from'./config.js';import{contractTerms}from'./contracts.js';
import {validEliteSettlement} from './spawn-director.js';
const int=n=>Number.isSafeInteger(n)&&n>=0;
export function validMetaPending(p){
 if(!validEliteSettlement(p.elitePolicySnapshot,p.id))return false;
 if(p.relicAchievementDeltas&&(!Object.values(p.relicAchievementDeltas).every(int)||Object.keys(p.relicAchievementDeltas).some(k=>!Object.values(C.relics).some(r=>r.counter===k))))return false;
 const plan=p.contractPlan;if(plan){if(!Array.isArray(plan.changes)||plan.changes.length>3||!Array.isArray(plan.completed)||new Set(plan.changes.map(r=>r.id)).size!==plan.changes.length||!int(plan.photon)||!int(plan.catalyst))return false;let photon=0,catalyst=0;
  for(const r of plan.changes){if(!C.contracts[r.id]||!Number.isInteger(r.stage)||r.stage<1||r.stage>3||!int(r.progress)||!int(r.delta)||typeof r.done!=='boolean')return false;const terms=contractTerms(r.id,r.stage);if(r.maxCompletedStage!==(r.done?r.stage:r.stage-1)||r.progress>=(r.done?1:terms.target))return false;if(r.done){photon+=terms.photon;catalyst+=terms.catalyst;}}
  const paid=plan.changes.filter(r=>r.done);if(plan.completed.length!==paid.length||paid.some(r=>!plan.completed.some(c=>c.id===r.id&&c.stage===r.stage&&c.photon===contractTerms(r.id,r.stage).photon&&c.catalyst===contractTerms(r.id,r.stage).catalyst)))return false;
  if(photon!==plan.photon||catalyst!==plan.catalyst)return false;
 }
 const b=p.payoutBreakdown;if(b){if(!Object.values(b).every(int)||b.refineryPhoton+(b.calibrationPhoton||0)+b.contractPhoton+b.anomalyPhoton!==p.payout||b.baseCatalyst+b.contractCatalyst!==p.catalystPayout||b.contractPhoton!==(plan?.photon||0)||b.contractCatalyst!==(plan?.catalyst||0))return false;const lv=p.record?.skillExpansionEnabled?p.record.levels?.refineryCalibration||0:0;if(!Number.isInteger(lv)||lv<0||lv>2||(b.calibrationPhoton||0)!==Math.min(40,Math.floor(b.refineryPhoton*.03*lv+1e-9)))return false;const a=C.anomalies[p.anomalyId],expected=p.anomalySucceeded&&a?Math.min(C.meta.anomalyPhotonCap,Math.floor(b.refineryPhoton*a.rate)):0;if(b.anomalyPhoton!==expected)return false;}
 return true;
}
