import {WORLDS,canWorld,canBoss,surveyText} from './worlds.js';
export function renderWorlds(root,save,{state,select,boss,ending}){
 const panel=document.createElement('details');panel.className='world-panel';const summary=document.createElement('summary');summary.textContent=`WORLDS · ${WORLDS[save.worldSelected].name}${save.campaignComplete?' · CAMPAIGN CLEARED':''}`;panel.append(summary);
 const enabled=['TITLE','RESULT'].includes(state)&&!save.pendingSettlement;
 for(const[id,w]of Object.entries(WORLDS)){
  const row=document.createElement('div');row.className='world-row';const choose=document.createElement('button');choose.textContent=`${id.toUpperCase()} · ${w.name}${save.worldBossHistory[id].clears?' ✓':''}`;choose.disabled=!enabled||!canWorld(save,id);choose.setAttribute('aria-pressed',String(id===save.worldSelected));choose.onclick=()=>select(id);row.append(choose);
  const info=document.createElement('small');info.textContent=canWorld(save,id)?`${surveyText(save,id)} · Boss Rank${w.bossRank}${save.worldBossHistory[id].lastFailure?' · Last: '+save.worldBossHistory[id].lastFailure:''}`:`Requires previous World clear + Rank${w.rank}`;row.append(info);panel.append(row);
 }
 const challenge=document.createElement('button');challenge.className='boss-start';challenge.textContent=`BOSS CHALLENGE · ${WORLDS[save.worldSelected].boss}`;challenge.disabled=!enabled||!canBoss(save,save.worldSelected);challenge.onclick=boss;panel.append(challenge);
 const detail=document.createElement('p');detail.textContent=WORLDS[save.worldSelected].survey.join(' / ')+' · Normal PLAY remains a20s Run. Boss progress is confirmed after Refinery.';panel.append(detail);
 if(save.campaignComplete){const replay=document.createElement('button');replay.textContent='REPLAY ENDING';replay.onclick=ending;panel.append(replay);}
 root.replaceChildren(panel);
}
