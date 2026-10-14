import { CONFIG as C } from './config.js';
import { Game } from './game.js';
import { draw } from './renderer.js';
import { resizeBacking } from './presentation.js';
import { logicalPoint } from './entities.js';
import { TYPES, buyUpgrade, settle, stageSettlement, completeSettlement, refundLegacyTime } from './progression.js';
import { loadSave, writeSave, freshSave } from './storage.js';
import { renderSkillTree, getDerivedStats, skillState } from './skill-tree.js';
import { drawRefinery } from './refinery.js';
import { EconomySandbox, buildPresets } from './economy.js';
import { emptyLevels } from './progression.js';
import { discoveryView } from './discovery.js';
import { craftRelic,equipRelic,blueprints,relicStats } from './relics.js';
import { renderRelics } from './relic-ui.js';
import {renderContracts,renderAnomalies,resultMetaText}from'./meta-ui.js';
import {acceptContract,abandonContract,snapshotContracts}from'./contracts.js';
import {ensureOffer,selectAnomaly,consumeOffer}from'./anomalies.js';
const $ = id => document.getElementById(id), canvas = $('game'), ctx = canvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const resizeCanvas = () => resizeBacking(canvas, window.devicePixelRatio);
new ResizeObserver(resizeCanvas).observe(canvas);
window.addEventListener('resize', resizeCanvas);
window.addEventListener('pageshow', resizeCanvas);
document.addEventListener('visibilitychange', resizeCanvas);
let focusMode = false;
$('focus').onclick = () => { focusMode = !focusMode; document.body.classList.toggle('focus-mode', focusMode); $('focus').textContent = focusMode ? 'EXIT FOCUS' : 'FOCUS'; $('focus').setAttribute('aria-pressed',String(focusMode)); resizeCanvas(); };
let storage; try { storage = window.localStorage; } catch { storage = { getItem() { return null; }, setItem() { throw new Error('Unavailable'); } }; }
let save = loadSave(storage), game = null, last = null, accumulator = 0, fps = 60, manualPause = false, previousBest = {}, audio = null, selectedSkill = 'crushPower', lastSoundAt = -Infinity, voices = 0;
let liveSave = save; let sandboxSession = null;
let refineryStartedAt = null, resultEnteredAt = null, rankBannerShownId = null;
if (completeSettlement(save)) $('notice').textContent = '이전 Run의 확정된 Refinery 보상을 복구했습니다. 재추첨하지 않습니다.';
function persist() { if (sandboxSession) return; if (!writeSave(storage, save)) $('notice').textContent = '브라우저 저장을 사용할 수 없습니다. 현재 세션에서는 플레이와 강화가 유지됩니다.'; }
function enterSandbox() {
  if (game?.state === 'RESULT' && !game.settled) finishRefinery();
  if (!sandboxSession) { sandboxSession = new EconomySandbox(liveSave, $('economy-preset').value); save = sandboxSession.save; }
  sandboxSession.preset = $('economy-preset').value;
  if (game) game.sandbox = true;
  $('sandbox-status').textContent = 'SANDBOX · 재화 / 구매 / 기록은 저장하지 않습니다.';
  $('notice').textContent = '실험 세션입니다. 실험 종료 시 기존 세이브로 돌아갑니다.';
}
function tone(type) {
  if (!save.options.sound || voices >= 8) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
    const combo = type.startsWith('combo'); if (!combo && audio.currentTime - lastSoundAt < .03) return;
    lastSoundAt = audio.currentTime;
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = type === 'combo20' ? 'sine' : combo ? 'sawtooth' : 'triangle';
    const frequency = { click: 760, triangle: 620, square: 210, pentagon: 430, star: 900, hex:160,reactor:300,ancient:90,combo5: 520, combo10: 330, combo20: 110 }[type] || 430;
    const life = combo ? .24 : .14; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency / 2, audio.currentTime + life * .7);
    gain.gain.setValueAtTime(combo ? .04 : .025, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + life);
    oscillator.connect(gain).connect(audio.destination); voices++; oscillator.onended = () => { voices--; oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(); oscillator.stop(audio.currentTime + life);
  } catch { /* Audio is optional. */ }
}
function start(seed = C.seed, duration) {
  if (game?.state === 'RESULT' && !game.settled) finishRefinery();
  if (resultEnteredAt !== null && save.lastRuns.at(-1)?.runId === game?.runId) { save.lastRuns.at(-1).resultScreenSeconds = (performance.now() - resultEnteredAt) / 1000; persist(); }
  const offer=ensureOffer(save);previousBest = { ...save.bestStats }; game = new Game({ ecologyEnabled:true,introSeen:save.shapeIntroSeen,seed, duration, runId: crypto.randomUUID(), levels: save.levels,relicLoadout:save.relicEquipped,activeContracts:snapshotContracts(save),anomalyId:save.selectedAnomaly, options: save.options,discoveryRank:save.discoveryRank,welcomeFlags:save.milestoneWelcomeFlags,oreEnabled:save.options.oreEnabled,sandbox: Boolean(sandboxSession), tierPreset: sandboxSession ? $('tier-preset').value : 'v09_short', experiment: sandboxSession ? $('spawn-preset').value : 'baseline' }); game.offerId=offer.offerId;consumeOffer(save);persist();game.onEvent = tone;renderMeta();
  refineryStartedAt = null; resultEnteredAt = null; $('rank-banner').hidden=true;rankBannerShownId=null;
  manualPause = false; accumulator = 0; last = null;
  $('title').hidden = true; $('result').hidden = true; $('paused').hidden = true; $('pause').hidden = false; $('pause').textContent = '일시정지';
  if (save.options.sound) tone('triangle');
}
function result() {
  stageSettlement(save, game); persist(); refineryStartedAt = performance.now(); resultEnteredAt = refineryStartedAt;
  $('result').classList.add('processing'); $('refinery-canvas').hidden = false; $('refinery-skip').hidden = false;
  $('result').hidden = false; $('pause').hidden = true; $('paused').hidden = true;
  const values = [['완전 파괴', game.totalDestroyed], ['직접 / 연쇄', `${game.directKills} / ${game.cascadeKills}`], ['최고 연쇄', game.bestChain], ['최고 밀도', game.tiers[game.highestTier].target], ['RAW SHARDS', `+${game.runEarned}`]];
  $('stats').replaceChildren(...values.map(([label, value]) => { const el = document.createElement('div'); el.className = 'stat'; const small = document.createElement('small'); small.textContent = label; const strong = document.createElement('strong'); strong.textContent = value; el.append(small, strong); return el; }));
  $('comparison').textContent = `이전 최고 파괴 ${previousBest.totalDestroyed || 0} → 이번 ${game.totalDestroyed} (${game.totalDestroyed - (previousBest.totalDestroyed || 0) >= 0 ? '+' : ''}${game.totalDestroyed - (previousBest.totalDestroyed || 0)}) · 이전 최고 연쇄 ${previousBest.bestChain || 0} · 이번 Run ${game.duration.toFixed(0)}초`;
  renderUpgrades();
  $('refinery-summary').textContent = resultMetaText(game);
  if (!game.refinery.enabled) finishRefinery();
}
function finishRefinery(skipped = false) {
  if (!game || game.state !== 'RESULT' || game.settled) return;
  if (refineryStartedAt === null) result();
  if (game.settled) return;
  if (!sandboxSession) {
    const stored = loadSave(storage);
    if (stored.lastSettlementId === game.runId || stored.lastRuns.some(r => r.runId === game.runId)) { save = stored; liveSave = save; game.settled = true; $('result').classList.remove('processing'); $('refinery-canvas').hidden = true; $('refinery-skip').hidden = true; renderUpgrades(); return; }
  }
  game.refinerySkipped = skipped; game.resultWaitSeconds = (performance.now() - refineryStartedAt) / 1000;
  if (save.pendingSettlement) { save.pendingSettlement.record.refinerySkipped = skipped; save.pendingSettlement.record.resultWaitSeconds = game.resultWaitSeconds; }
  const priorBlueprints=blueprints(save);settle(save, game);ensureOffer(save); persist();const newBlueprints=blueprints(save).filter(id=>!priorBlueprints.includes(id)); if((save.discoveryRank>game.discoveryRank||newBlueprints.length)&&rankBannerShownId!==game.runId){rankBannerShownId=game.runId;$('rank-banner').textContent=`DISCOVERED · RANK ${save.discoveryRank}${newBlueprints.length?` · 설계도 ${newBlueprints.map(id=>C.relics[id].name).join(', ')}`:''} · 다음 Run부터 적용`;$('rank-banner').hidden=false;} $('result').classList.remove('processing'); $('refinery-canvas').hidden = true; $('refinery-skip').hidden = true; renderUpgrades();
}
function renderUpgrades() {
  renderMeta();
  const discovery = discoveryView(save);
  $('discovery').textContent = `Discovery Rank ${discovery.rank} — ${discovery.destroyed.toLocaleString()}${discovery.next ? ` / ${discovery.next.threshold.toLocaleString()}` : ' · MAX RANK'} destroyed · Catalyst ${save.catalystBalance || 0}`;
  $('discovery-progress').value = discovery.progress;
  $('next-unlocks').textContent = discovery.next ? `다음 목표: ${discovery.next.unlock}` : 'Rank4 콘텐츠 해금 · 스킬과 희귀 도형 기록을 이어가세요';
  $('content-goal').textContent=save.discoveryRank>=2?`현재 해금: ${Object.entries(C.shapes).filter(([,v])=>v.special&&v.rank<=save.discoveryRank).map(([k,v])=>`${k.toUpperCase()} · Run ${C.tiers[v.tier].threshold}킬부터`).join(' / ')}`:'Prism 8% · Core/Catalyst Rank2부터 · 희귀 원석은 중앙 기호로 표시'; const stats = relicStats(getDerivedStats(save.levels),save.relicEquipped); $('bank').textContent = save.bank.toLocaleString(); $('next-run').textContent = `NEXT RUN ${stats.duration}초 · 피해 ${stats.directDamage} · 반복 ${stats.attackInterval.toFixed(2)}초`;
  renderSkillTree($('upgrades'), $('skill-info'), save, selectedSkill, key => { selectedSkill = key; renderUpgrades(); }, key => { if (!game?.settled) return; if (sandboxSession ? sandboxSession.buy(key, game?.state) : buyUpgrade(save, key, game?.state)) { persist(); renderUpgrades(); } }, (key, levels, bank) => { const state = sandboxSession ? sandboxSession.state(key, levels, bank) : skillState(key, levels, bank,save); return { ...state, canBuy: Boolean(game?.settled) && state.canBuy }; });
  $('time-note').textContent = save.legacyExtraTimeLevel && !save.timeRespecUsed ? `60~90초 → 20~32초. Extra Time은 Lv당 +2초이며 보유 Lv.${save.levels.extraTime}은 유지됩니다.` : `확인 가능한 과거 기록 ${save.knownHistoryKills || 0}킬 · 새 누적 파괴와 별도 보존`;
  $('time-refund').hidden = !save.legacyExtraTimeLevel || save.timeRespecUsed; $('time-refund').disabled = !game?.settled;
}
function renderMeta(){const state=game?.state||'TITLE';for(const suffix of ['start','result']){
 renderRelics($(`relic-${suffix}`),save,{state,craft:key=>{if(game?.settled&&craftRelic(save,key,state)){persist();renderUpgrades();}},equip:(key,slot)=>{if(equipRelic(save,key,slot,state)){persist();renderUpgrades();}}});
 renderContracts($(`contracts-${suffix}`),save,{state,accept:id=>{if(acceptContract(save,id,state)){persist();renderMeta();}},abandon:id=>{if(abandonContract(save,id,state)){persist();renderMeta();}}});
 renderAnomalies($(`anomaly-${suffix}`),save,{state,select:id=>{if(selectAnomaly(save,id,state)){persist();renderMeta();}}});
}}
function setOption(key, value) {
  if (key === 'refineryEnabled'||key==='oreEnabled') enterSandbox();
  save.options[key] = value;
  if (game) { if (key === 'motionEnabled') game.setMotionEnabled(value); else {game.options[key] = value;if(key==='oreEnabled')game.oreEnabled=value&&game.contentMode!=='V09_ONLY';} if (game.state === 'PLAYING') game.optionChanges.push({ at: Number(game.elapsed.toFixed(3)), key, value }); }
  persist(); syncOptions();
}
function syncOptions() { for (const key of Object.keys(C.options)) $(`option-${key}`).checked = save.options[key]; $('sound').textContent = save.options.sound ? 'SOUND ON' : 'SOUND OFF'; }
for (const [key, label] of Object.entries({ secondaryTraitsEnabled:'Secondary Traits',combatFXEnabled:'Combat FX · 전투 강조',screenShakeEnabled:'Screen Shake · 미세 흔들림',reducedMotionEnabled:'Reduced Motion · 움직임 줄이기',oreEnabled:'Ore · 희귀 원석 (실험)',motionEnabled: 'Motion · 회전 / 드리프트', refineryEnabled: 'Refinery · 슬롯 가공 (실험)', modifiers: 'Modifiers · 파손 / 충전', modifierVisuals: 'Modifier Marks · 변종 표식', comboFeedback: 'Combo Feedback · 연쇄 강조', sequentialPropagation: 'Sequential Propagation · 순차 전파', visualVariety: 'Visual Variety · 도형 다양성', inheritance: 'Inheritance · 효과 계승', ricochet: 'Ricochet · 벽 반사', damageVFX: 'Damage VFX · 손상 조각', sound: 'Sound · 합성 사운드' })) { const el = document.createElement('label'), input = document.createElement('input'); input.type = 'checkbox'; input.id = `option-${key}`; input.onchange = () => setOption(key, input.checked); el.append(input, document.createTextNode(label)); $('options').append(el); }
syncOptions();
renderMeta();
persist(); // schema1..4 → schema5; pending recovery and persisted deterministic offers.
$('seed').value = C.seed; $('duration').min = C.dev.minDuration; $('duration').max = C.dev.maxDuration; $('grant').textContent = `테스트 Photon +${C.dev.grant}`;
$('start').onclick = () => start(); $('again').onclick = () => start(); $('sound').onclick = () => setOption('sound', !save.options.sound);
$('refinery-skip').onclick = () => finishRefinery(true);
$('time-refund').onclick = () => { if (game?.settled && refundLegacyTime(save, 'RESULT')) { persist(); renderUpgrades(); } };
$('fresh-lab').onclick = () => { if (game?.state === 'RESULT' && !game.settled) finishRefinery(); sandboxSession = new EconomySandbox(freshSave()); save = sandboxSession.save; syncOptions(); $('sandbox-status').textContent = 'FRESH LAB · 새 계정 / 저장하지 않음'; $('notice').textContent = 'Fresh Lab: 실제 재화·보유 스킬은 그대로 유지됩니다.'; $('tier-preset').value = 'v09_short'; $('duration').value = ''; start(Number($('seed').value) >>> 0); };
const toggleDev = () => { $('dev').hidden = !$('dev').hidden; }; $('dev-toggle').onclick = toggleDev; $('dev-close').onclick = toggleDev;
document.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'd' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) toggleDev(); });
function pause(value) { manualPause = value; if (game?.state === 'PLAYING') { game.paused = value || document.hidden; game.held = false; $('paused').hidden = !game.paused; $('pause').textContent = value ? '계속 플레이' : '일시정지'; } last = null; accumulator = 0; }
$('pause').onclick = () => pause(!manualPause); $('resume').onclick = () => pause(false);
document.addEventListener('visibilitychange', () => pause(manualPause));
window.addEventListener('pageshow', event => {
  if (!event.persisted || sandboxSession) return;
  save = loadSave(storage); liveSave = save; completeSettlement(save); persist();
  if (game?.state === 'RESULT') { game.settled = true; $('result').classList.remove('processing'); $('refinery-canvas').hidden = true; $('refinery-skip').hidden = true; renderUpgrades(); }else renderMeta();
});
function release() { if (game) game.held = false; }
canvas.addEventListener('pointerdown', e => { if (e.button !== 0 || game?.state !== 'PLAYING' || game.paused) return; const p = logicalPoint(e.clientX, e.clientY, canvas.getBoundingClientRect()); game.pointer = p; game.held = true; if (game.attackClock <= 1e-9) { game.attack(p.x, p.y); game.attackClock = game.stats.attackInterval; } e.preventDefault(); });
canvas.addEventListener('pointermove', e => { if (game) game.pointer = logicalPoint(e.clientX, e.clientY, canvas.getBoundingClientRect()); });
canvas.addEventListener('pointerleave', release); canvas.addEventListener('pointercancel', release); window.addEventListener('pointerup', release); window.addEventListener('blur', release);
$('same-seed').onclick = () => { enterSandbox(); const value = $('duration').value; start(Number($('seed').value) >>> 0, value ? Math.max(C.dev.minDuration, Math.min(C.dev.maxDuration, Number(value))) : undefined); };
$('experiment-start').onclick = () => { enterSandbox(); save.levels = { ...emptyLevels(), ...buildPresets[$('build-preset').value] }; const value = $('duration').value; start(Number($('seed').value) >>> 0, value ? Math.max(1, Math.min(90, Number(value))) : undefined); };
$('experiment-end').onclick = () => { sandboxSession = null; save = liveSave; game = null; manualPause = false; $('title').hidden = false; $('result').hidden = true; $('paused').hidden = true; $('pause').hidden = true; $('sandbox-status').textContent = 'LIVE SAVE · 기본 가격 / 생성'; $('notice').textContent = '실험을 종료했습니다. 기존 재화와 강화가 유지됩니다.'; syncOptions();renderMeta();persist(); };
for (const type of Object.keys(C.shapes)) { const button = document.createElement('button'); button.textContent = `+ ${type}`; button.onclick = () => { if (game?.state === 'PLAYING' && !game.paused) { enterSandbox(); game.spawn(type); } }; $('spawn-tools').append(button); }
$('grant').onclick = () => { enterSandbox(); save.bank += C.dev.grant; if (game?.state === 'RESULT') renderUpgrades(); };
$('economy-preset').onchange = () => { if (sandboxSession) { sandboxSession.preset = $('economy-preset').value; if (game?.state === 'RESULT') renderUpgrades(); } };
$('reset').onclick = () => { if (confirm('영구 강화, 광자, 플레이 기록을 모두 초기화할까요?')) { save = freshSave(); if (sandboxSession) { save.sandbox = true; sandboxSession.save = save; } else liveSave = save; persist(); syncOptions(); game = null; $('title').hidden = false; $('result').hidden = true; $('paused').hidden = true; $('pause').hidden = true; renderMeta(); persist(); } };
$('copy').onclick = async () => { const data = JSON.stringify({ current: game?.record() || null, lastRuns: save.lastRuns }, null, 2); try { await navigator.clipboard.writeText(data); $('notice').textContent = 'Run JSON을 복사했습니다.'; } catch { $('notice').textContent = '클립보드 접근이 제한되어 JSON 파일로 저장합니다.'; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = 'shard-storm-runs.json'; a.click(); URL.revokeObjectURL(a.href); } };
$('export-save').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(liveSave, null, 2)], { type: 'application/json' })); a.download = `shard-storm-save-v${C.saveVersion}.json`; a.click(); URL.revokeObjectURL(a.href); };
function frame(now) {
  if (last !== null) {
    const delta = Math.max(0, (now - last) / 1000); if (delta > 0 && delta < 1) fps = fps * .95 + Math.min(240, 1 / delta) * .05;
    if (game?.state === 'PLAYING' && !game.paused) {
      accumulator += delta; let count = 0;
      while (accumulator >= C.step && count < C.maxCatchUp && game.state === 'PLAYING') { const before = performance.now(); game.update(C.step); game.observeFrame(0, performance.now() - before); accumulator -= C.step; count++; }
      game.observeFrame(delta);
      if (accumulator >= C.step && game.state === 'PLAYING') {
        // Under a long visible stall, skip physics backlog but consume real elapsed time.
        const skip = accumulator - accumulator % C.step;
        game.skipAhead(skip);
        accumulator %= C.step;
      }
    }
  }
  last = now;
  if (game?.state === 'RESULT' && refineryStartedAt === null) result();
  if (game?.state === 'RESULT' && !game.settled) { const progress = Math.min(1, (now - refineryStartedAt) / (C.refinery.animationSeconds * 1000)); drawRefinery($('refinery-canvas'), game.refinery, progress); if (progress >= 1) finishRefinery(); }
  draw(ctx, game, fps, reducedMotion.matches);
  if (!$('dev').hidden) $('debug-stats').textContent = game ? `TIME ${game.remaining.toFixed(2)} / ${game.duration}\nKILLS ${game.totalDestroyed} (D ${game.directKills} / C ${game.cascadeKills})\nCHAIN ${game.currentChain} / BEST ${game.bestChain}\nRAW +${game.runEarned} / BANK ${save.bank}\nTIER ${game.highestTier} / SHAPES ${game.alive.length}/${game.target}\nSHARDS ${game.shards.length} / PEAK ${game.peakShards}\nWAVES ${game.waves.length} / SCHEDULED ${game.queue.length}\nFPS ${fps.toFixed(1)} / CAPS ${game.safetyCapsHit}\nSEED ${game.seed}\nFIRST CASCADE ${game.firstCascadeTime?.toFixed(3) ?? '—'}\nCOMBO ${JSON.stringify(game.comboMilestones)}\nEMPTY ${game.emptyArenaDuration.toFixed(3)}s / FAIL ${game.spawnFailures}\nCAP TYPES ${JSON.stringify(game.capCounts)}\nMODIFIERS ${game.alive.filter(s => s.modifier === 'charged').length} charged\nPRESET ${game.experiment.spawnInterval}s / cluster ${game.experiment.clusterChance}` : `BANK ${save.bank}\nREADY / FPS ${fps.toFixed(1)}`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only snapshot for browser QA; gameplay still runs through real pointer input.
window.shardStorm = { snapshot: () => ({ state: game?.state || 'TITLE', paused: game?.paused || false, remaining: game?.remaining, elapsed: game?.elapsed, fps, record: game?.record(), combo: game?.options.comboFeedback ? game?.combo.visible(game.elapsed) : null, audioVoices: voices, shapes: game?.alive.map(s => ({ id: s.id, type: s.type,echo:s.echo,secondaryTrait:s.secondaryTrait,oreGrade:s.oreGrade,wardSourceId:s.wardSourceId,shieldBroken:s.shieldBroken,channelUntil:s.channelUntil,angle: s.angle, anchorX: s.anchorX, anchorY: s.anchorY, motionProfile: s.motion.profile, modifier: s.modifier, maxHP: s.maxHP, x: s.x, y: s.y, hp: s.hp, grace: s.grace, enhanced: s.enhanced, radius: s.radius, material: s.appearance.material, pattern: s.appearance.pattern })) || [], waves: game?.waves.map(w => ({ radius: w.radius, maxRadius: w.maxRadius, source: w.sourceKind })) || [], scheduled: game?.queue.length || 0, clickRings: game?.clickVFX.items.length || 0, bank: save.bank, levels: { ...save.levels }, derivedStats: relicStats(getDerivedStats(save.levels),save.relicEquipped), options: { ...save.options }, saveVersion: save.saveVersion,shapeIntroSeen:{...save.shapeIntroSeen},contracts:structuredClone(save.contracts),contractMedals:[...save.contractMedals],anomalyOffer:structuredClone(save.anomalyOffer),selectedAnomaly:save.selectedAnomaly,anomalyOfferIndex:save.anomalyOfferIndex,totalAnomalyWins:save.totalAnomalyWins, relicOwned:[...save.relicOwned],relicEquipped:[...save.relicEquipped],relicAchievements:{...save.relicAchievements},relicBlueprintUnlocked:[...save.relicBlueprintUnlocked],sandbox: Boolean(sandboxSession), sandboxEconomy: sandboxSession?.preset, refinery: game?.refinery, pendingSettlement: save.pendingSettlement, totalRuns: save.totalRuns, lifetimeDestroyed: save.lifetimeDestroyed,discoveryRank:save.discoveryRank,catalystBalance:save.catalystBalance,milestoneWelcomeFlags:save.milestoneWelcomeFlags,settled: game?.settled }) };
