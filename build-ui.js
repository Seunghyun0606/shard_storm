import {RESEARCH} from './modes.js';
import {EXPANSION_SKILLS,SIGNATURE_IDS,EVOLUTION_FAMILIES,BUILD_PRESETS} from './expansion-defs.js';
import {evolutionState} from './builds.js';
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function renderBuilds(container,save,{state,signature,craft,activate,preset}) {
 const open=container.querySelector('details')?.open||false;
 const panel=el('details');panel.className='meta-section';panel.open=open;
 const research=save.researchActive||[],researchSignature=research.filter(id=>RESEARCH[id]?.family==='signature').length,researchEvolution=research.length-researchSignature;
 const signatures=save.signatureLoadout||[],evolutions=save.evolutionActive||[],locked=!['TITLE','RESULT'].includes(state)||Boolean(save.pendingSettlement);
 panel.append(el('summary',`BUILD · Signature ${signatures.length}+R${researchSignature}/3 · Evolution ${evolutions.length}+R${researchEvolution}/2`));
 panel.append(el('p',`ACTIVE: ${signatures.map(id=>EXPANSION_SKILLS[id].name).join(' / ')||'Signature 없음'} · ${evolutions.map(r=>`${r.family}: ${r.form}`).join(' / ')||'Evolution 없음'}`));
 const presets=el('div');presets.className='build-presets';
 for(const name of Object.keys(BUILD_PRESETS)){const button=el('button',name);button.disabled=locked;button.dataset.buildPreset=name;button.onclick=()=>preset(name);presets.append(button);}
 panel.append(presets,el('small','프리셋은 보유한 선택지만 활성화합니다. 미보유 자동 구매 없음. Run 시작 후 구성 고정.'));
 const signatureGrid=el('div');signatureGrid.className='meta-grid';
 for(const id of SIGNATURE_IDS) {
  const definition=EXPANSION_SKILLS[id],owned=save.levels[id]===1,active=signatures.includes(id),card=el('article');
  card.className=`meta-card signature-card ${active?'active':''}`;card.dataset.signature=id;
  card.append(el('strong',`${definition.name} · ${active?'ACTIVE':owned?'OWNED · INACTIVE':'LOCKED'}`),el('small',definition.subtitle));
  const button=el('button',active?'해제':owned?'활성화':'스킬 트리에서 구매');button.dataset.signatureAction=id;button.disabled=locked||!owned||(!active&&signatures.length+researchSignature>=3);button.onclick=()=>signature(id);card.append(button);signatureGrid.append(card);
 }
 panel.append(el('h3','SIGNATURE · 동시3'),signatureGrid,el('h3','EVOLUTION · 동시2계열 · 계열당1형태'));
 const evolutionGrid=el('div');evolutionGrid.className='meta-grid';
 for(const [family,d]of Object.entries(EVOLUTION_FAMILIES)) {
  const card=el('article');card.className='meta-card';card.dataset.evolutionFamily=family;
  const active=evolutions.find(r=>r.family===family)?.form,researchForm=research.find(id=>RESEARCH[id]?.family===family);
  card.append(el('strong',`${d.name} · ${active||researchForm||'NONE'}`),el('small',`Rank${d.rank} · ${d.prerequisite.id} Lv.${d.prerequisite.minLevel}${researchForm?' · Research를 먼저 해제하세요':''}`));
  const none=el('button','NONE · 해제');none.disabled=locked||!active;none.onclick=()=>activate(family,null);card.append(none);
  for(const [form,description]of Object.entries(d.forms)) {
   const info=evolutionState(save,family,form),row=el('div');row.className='evolution-form';row.dataset.form=form;
   row.append(el('strong',`${form}${active===form?' · ACTIVE':info.owned?' · OWNED · INACTIVE':''}`),el('small',description));
   const button=el('button',info.owned?(active===form?'ACTIVE':'활성화'):`제작 ${info.photon} ◈ + ${info.catalyst} Catalyst`);
   button.disabled=locked||(info.owned?(Boolean(researchForm)||active===form||(!active&&evolutions.length+researchEvolution>=2)):(state!=='RESULT'||!info.canCraft));
   button.dataset.evolutionAction=info.owned?'activate':'craft';button.onclick=()=>info.owned?activate(family,form):craft(family,form);row.append(button);card.append(row);
  }
  evolutionGrid.append(card);
 }
 panel.append(evolutionGrid);container.replaceChildren(panel);
}
