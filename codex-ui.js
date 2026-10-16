import {CONFIG as C} from './config.js';
import {CODEX_IDS,normalizeCodex,codexInsights} from './codex.js';
import {ELITES,TECHNIQUES,ADVANCED_SHAPES} from './advanced-defs.js';
export function toggleCodexPin(save,id,state){if(!['TITLE','RESULT'].includes(state)||!CODEX_IDS.includes(id))return false;save.codexPinnedIds||=[];if(save.codexPinnedIds.includes(id))save.codexPinnedIds=save.codexPinnedIds.filter(k=>k!==id);else if(save.codexPinnedIds.length<2)save.codexPinnedIds.push(id);else return false;return true;}
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const icons={triangle:'△',square:'□',pentagon:'⬠',star:'☆',hex:'⬡',reactor:'◉',ancient:'◎'};
const titles={triangle:'First Spark',square:'Wavewright',pentagon:'Branch Weaver',star:'Starcaller',hex:'Wardbreaker',reactor:'Core Tuner',ancient:'Ancient Echo',splitter:'Double Take',fuseBomb:'Fuse Conductor',conductor:'Live Wire',mirror:'Return Path',gravityWell:'Orbit Maker',repairNode:'Rest Stop',portalGate:'Gate Runner',parasiteLink:'Shared Fate',phaseCrystal:'Perfect Window',chainBeacon:'Chain Signal',shifter:'Leap Hunter',prismLens:'Prism Weaver'};
export function renderCodex(root,save,{state,pin}){
 if(!root)return;const open=root.firstElementChild?.open,tab=root.dataset.tab||'codex',codex=normalizeCodex(save.shapeCodex),insights=codexInsights(codex),details=node('details',undefined,'codex-panel');details.open=Boolean(open);
 details.append(node('summary',`CODEX ${Object.values(codex).filter(r=>r.stage>0).length}/19 | INSIGHT ${insights.length}/19 | PIN ${save.codexPinnedIds.length}/2`));
 const tabs=node('div',undefined,'codex-tabs');tabs.setAttribute('role','tablist');
 for(const id of ['codex','elites']){const button=node('button',id.toUpperCase());button.setAttribute('role','tab');button.setAttribute('aria-selected',String(tab===id));button.onclick=()=>{root.dataset.tab=id;renderCodex(root,save,{state,pin});root.firstElementChild.open=true;};tabs.append(button);}details.append(tabs);
 const grid=node('div',undefined,'codex-grid');grid.setAttribute('role','tabpanel');
 if(tab==='codex')for(const id of CODEX_IDS){
  const row=codex[id],d=C.shapes[id],card=node('article',undefined,'codex-card');card.dataset.codex=id;card.dataset.stage=String(row.stage);card.classList.toggle('undiscovered',row.stage===0);card.append(node('strong',`${row.stage?d.symbol||icons[id]:'?'} ${row.stage?d.name||id[0].toUpperCase()+id.slice(1):'Undiscovered'} | ${['-','I','II','III','IV'][row.stage]}`));
  if(row.stage>=2){const badge=node('span',`${d.symbol||icons[id]} BADGE`,'codex-badge');badge.setAttribute('aria-label',`${d.name||id} Stage II badge`);card.append(badge);}
  if(row.stage===4)card.append(node('span',titles[id],'codex-title'));
  card.append(node('small',`I:1 death | II:${id==='ancient'?5:30} deaths | III:technique1 | IV:${id==='ancient'?20:150} deaths + technique3`));
  card.append(node('span',`${row.kills} deaths | ${row.techniques} techniques${row.stage>=3?' | INSIGHT':''}${row.stage===4?' | MASTERED':''}`));
  card.append(node('p',TECHNIQUES[id]));
  const recent=save.pendingSettlement?.record||save.lastRuns.at(-1);
  for(const attempt of (recent?.codexAttempts||[]).filter(a=>a.id===id).slice(-2))card.append(node('small',`${attempt.success?'SUCCESS':'ATTEMPT'}: ${attempt.reason}`,'codex-attempt'));
  if(ADVANCED_SHAPES[id]){const descriptions={portalGate:'Main shards teleport once/pair. Destroy either gate to unlink.',parasiteLink:'Actual damage copies up to1 HP to2 links after .04s; copied hits never recurse.',phaseCrystal:'1.4s cycle: .9s vulnerable/.5s guarded. Guarded direct=0, shard/wave<=1.',chainBeacon:'Death in its own Chain10+ creates130px/2damage wave after .05s.',shifter:'Safe25-35px leap every1.3s; .2s warning. Aim at its new position.',prismLens:'Native Square/Star contact emits2 narrow120px sectors at +/-35deg. Actual main contact refracts at most70deg,2/Lens.'};card.append(node('small',`Rank${d.rank} / Run${C.tiers[d.tier].threshold} | HP${d.hp} | Raw${d.bonus} | ${descriptions[id]}`));}
  const button=node('button',save.codexPinnedIds.includes(id)?'UNPIN':'PIN');button.dataset.codexPin=id;button.disabled=!['TITLE','RESULT'].includes(state)||(!save.codexPinnedIds.includes(id)&&save.codexPinnedIds.length>=2);button.onclick=()=>pin(id);card.append(button);grid.append(card);
 }
 else for(const[id,d]of Object.entries(ELITES)){const row=save.eliteHistory[id]||{},card=node('article',undefined,'codex-card');card.dataset.elite=id;card.append(node('strong',d.name),node('p',`Rank${d.rank} + ${d.insight} unique insights + Run200 deaths. ${d.types.join(' + ')}`),node('small',`Primary HP x1.5 (ceil), native Raw+50, Catalyst+3 once. Max1 encounter/Run. ${save.discoveryRank>=d.rank&&insights.length>=d.insight?'UNLOCKED':'LOCKED'}`),node('span',`Attempts ${row.attempts||0} | Spawns ${row.spawned||0} | Primary kills ${row.kills||0}`));grid.append(card);}
 details.append(grid,node('small','Collection starts with M11. Earlier currency, skills and records are preserved; historical Codex counts are not invented. Techniques can be recorded early; stages unlock in order at settlement. No Photon/Catalyst reward from Codex.'));
 root.replaceChildren(details);
}
export function pinnedText(save,g){return (g?.codexPinnedIds||save.codexPinnedIds).slice(0,2).map(id=>{const row=(g?.codexAtStart||save.shapeCodex)[id]||{},delta=g?.codexDelta[id]||{};return `${C.shapes[id].name||id}: ${(row.kills||0)+(delta.kills||0)} deaths / ${(row.techniques||0)+(delta.techniques||0)} techniques${g&&!g.settled?' (pending)':''}`;}).join(' | ');}
