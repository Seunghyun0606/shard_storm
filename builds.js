import {SIGNATURE_IDS,EVOLUTION_FAMILIES as F,EVOLUTION_COSTS,BUILD_PRESETS} from './expansion-defs.js';

export function normalizeSignatures(ids,levels={}) {
 return [...new Set(Array.isArray(ids)?ids:[])].filter(id=>SIGNATURE_IDS.includes(id)&&levels[id]===1).slice(0,3);
}
export function normalizeEvolutionOwned(data) {
 return Object.fromEntries(Object.entries(F).map(([family,d])=>[family,[...new Set(Array.isArray(data?.[family])?data[family]:[])].filter(form=>Object.hasOwn(d.forms,form))]));
}
export function normalizeEvolutionActive(active,owned) {
 const out=[];
 for(const item of Array.isArray(active)?active:[]) {
  if(item&&Object.hasOwn(F,item.family)&&owned?.[item.family]?.includes(item.form)&&!out.some(r=>r.family===item.family))out.push({family:item.family,form:item.form});
  if(out.length===2)break;
 }
 return out;
}
const editable=(save,state)=>['TITLE','RESULT'].includes(state)&&!save.pendingSettlement;
export function toggleSignature(save,id,state) {
 if(!editable(save,state)||!SIGNATURE_IDS.includes(id)||save.levels[id]!==1)return false;
 const ids=normalizeSignatures(save.signatureLoadout,save.levels);
 if(ids.includes(id))save.signatureLoadout=ids.filter(k=>k!==id);
 else {if(ids.length>=3)return false;save.signatureLoadout=[...ids,id];}
 return true;
}
export function evolutionState(save,family,form) {
 const d=F[family],index=d?Object.keys(d.forms).indexOf(form):-1;
 if(index<0)return {canCraft:false};
 const cost=EVOLUTION_COSTS[index],owned=Boolean(save.evolutionOwned?.[family]?.includes(form));
 const unlocked=save.discoveryRank>=d.rank&&(save.levels[d.prerequisite.id]||0)>=d.prerequisite.minLevel;
 return {...cost,owned,unlocked,canCraft:!owned&&unlocked&&save.bank>=cost.photon&&save.catalystBalance>=cost.catalyst};
}
export function craftEvolution(save,family,form,state) {
 const info=evolutionState(save,family,form);
 if(state!=='RESULT'||save.pendingSettlement||!info.canCraft)return false;
 save.bank-=info.photon;save.catalystBalance-=info.catalyst;
 save.evolutionOwned=normalizeEvolutionOwned(save.evolutionOwned);save.evolutionOwned[family].push(form);
 return true; // Ownership never auto-activates a form.
}
export function activateEvolution(save,family,form,state) {
 if(!editable(save,state)||!Object.hasOwn(F,family))return false;
 const active=normalizeEvolutionActive(save.evolutionActive,save.evolutionOwned),other=active.filter(r=>r.family!==family);
 if(form===null){save.evolutionActive=other;return true;}
 if(!save.evolutionOwned?.[family]?.includes(form)||other.length>=2)return false;
 save.evolutionActive=[...other,{family,form}];return true;
}
export function applyBuildPreset(save,key,state) {
 const preset=BUILD_PRESETS[key];if(!preset||!editable(save,state))return false;
 save.signatureLoadout=normalizeSignatures(preset.signatures,save.levels);
 save.evolutionActive=normalizeEvolutionActive(preset.evolutions,save.evolutionOwned);
 return true;
}
