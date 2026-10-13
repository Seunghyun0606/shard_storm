import { CONFIG as C } from './config.js';
import { Game } from './game.js';
import { draw } from './renderer.js';
import { logicalPoint } from './entities.js';
import { TYPES, buyUpgrade, settle } from './progression.js';
import { loadSave, writeSave, freshSave } from './storage.js';
import { renderSkillTree, getDerivedStats } from './skill-tree.js';
import { EconomySandbox, buildPresets } from './economy.js';
import { emptyLevels } from './progression.js';
const $ = id => document.getElementById(id), canvas = $('game'), ctx = canvas.getContext('2d');
let storage; try { storage = window.localStorage; } catch { storage = { getItem() { return null; }, setItem() { throw new Error('Unavailable'); } }; }
let save = loadSave(storage), game = null, last = null, accumulator = 0, fps = 60, manualPause = false, previousBest = {}, audio = null, selectedSkill = 'crushPower', lastSoundAt = -Infinity, voices = 0;
let liveSave = save; let sandboxSession = null;
function persist() { if (sandboxSession) return; if (!writeSave(storage, save)) $('notice').textContent = '브라우저 저장을 사용할 수 없습니다. 현재 세션에서는 플레이와 강화가 유지됩니다.'; }
function enterSandbox() {
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
    const frequency = { click: 760, triangle: 620, square: 210, pentagon: 430, star: 900, combo5: 520, combo10: 330, combo20: 110 }[type];
    const life = combo ? .24 : .14; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency / 2, audio.currentTime + life * .7);
    gain.gain.setValueAtTime(combo ? .04 : .025, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + life);
    oscillator.connect(gain).connect(audio.destination); voices++; oscillator.onended = () => { voices--; oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(); oscillator.stop(audio.currentTime + life);
  } catch { /* Audio is optional. */ }
}
function start(seed = C.seed, duration) {
  previousBest = { ...save.bestStats }; game = new Game({ seed, duration, levels: save.levels, options: save.options, sandbox: Boolean(sandboxSession), experiment: sandboxSession ? $('spawn-preset').value : 'baseline' }); game.onEvent = tone;
  manualPause = false; accumulator = 0; last = null;
  $('title').hidden = true; $('result').hidden = true; $('paused').hidden = true; $('pause').hidden = false; $('pause').textContent = '일시정지';
  if (save.options.sound) tone('triangle');
}
function result() {
  settle(save, game); persist(); $('result').hidden = false; $('pause').hidden = true; $('paused').hidden = true;
  const values = [['완전 파괴', game.totalDestroyed], ['직접 / 연쇄', `${game.directKills} / ${game.cascadeKills}`], ['최고 연쇄', game.bestChain], ['최고 밀도', C.tiers[game.highestTier].target], ['획득 PHOTON', `+${game.runEarned}`]];
  $('stats').replaceChildren(...values.map(([label, value]) => { const el = document.createElement('div'); el.className = 'stat'; const small = document.createElement('small'); small.textContent = label; const strong = document.createElement('strong'); strong.textContent = value; el.append(small, strong); return el; }));
  $('comparison').textContent = `이전 최고 파괴 ${previousBest.totalDestroyed || 0} → 이번 ${game.totalDestroyed} (${game.totalDestroyed - (previousBest.totalDestroyed || 0) >= 0 ? '+' : ''}${game.totalDestroyed - (previousBest.totalDestroyed || 0)}) · 이전 최고 연쇄 ${previousBest.bestChain || 0} · 이번 Run ${game.duration.toFixed(0)}초`;
  renderUpgrades();
}
function renderUpgrades() {
  const stats = getDerivedStats(save.levels); $('bank').textContent = save.bank.toLocaleString(); $('next-run').textContent = `NEXT RUN ${stats.duration}초 · 피해 ${stats.directDamage} · 반복 ${stats.attackInterval.toFixed(2)}초`;
  renderSkillTree($('upgrades'), $('skill-info'), save, selectedSkill, key => { selectedSkill = key; renderUpgrades(); }, key => { if (sandboxSession ? sandboxSession.buy(key, game?.state) : buyUpgrade(save, key, game?.state)) { persist(); renderUpgrades(); } }, sandboxSession?.state);
}
function setOption(key, value) {
  save.options[key] = value;
  if (game) { game.options[key] = value; if (game.state === 'PLAYING') game.optionChanges.push({ at: Number(game.elapsed.toFixed(3)), key, value }); }
  persist(); syncOptions();
}
function syncOptions() { for (const key of Object.keys(C.options)) $(`option-${key}`).checked = save.options[key]; $('sound').textContent = save.options.sound ? 'SOUND ON' : 'SOUND OFF'; }
for (const [key, label] of Object.entries({ modifiers: 'Modifiers · 파손 / 충전', modifierVisuals: 'Modifier Marks · 변종 표식', comboFeedback: 'Combo Feedback · 연쇄 강조', sequentialPropagation: 'Sequential Propagation · 순차 전파', visualVariety: 'Visual Variety · 도형 다양성', inheritance: 'Inheritance · 효과 계승', ricochet: 'Ricochet · 벽 반사', damageVFX: 'Damage VFX · 손상 조각', sound: 'Sound · 합성 사운드' })) { const el = document.createElement('label'), input = document.createElement('input'); input.type = 'checkbox'; input.id = `option-${key}`; input.onchange = () => setOption(key, input.checked); el.append(input, document.createTextNode(label)); $('options').append(el); }
syncOptions();
persist(); // Save version 1 → 2 migration without touching bank or old levels.
$('seed').value = C.seed; $('duration').min = C.dev.minDuration; $('duration').max = C.dev.maxDuration; $('grant').textContent = `테스트 Photon +${C.dev.grant}`;
$('start').onclick = () => start(); $('again').onclick = () => start(); $('sound').onclick = () => setOption('sound', !save.options.sound);
const toggleDev = () => { $('dev').hidden = !$('dev').hidden; }; $('dev-toggle').onclick = toggleDev; $('dev-close').onclick = toggleDev;
document.addEventListener('keydown', e => { if (e.key.toLowerCase() === 'd' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) toggleDev(); });
function pause(value) { manualPause = value; if (game?.state === 'PLAYING') { game.paused = value || document.hidden; game.held = false; $('paused').hidden = !game.paused; $('pause').textContent = value ? '계속 플레이' : '일시정지'; } last = null; accumulator = 0; }
$('pause').onclick = () => pause(!manualPause); $('resume').onclick = () => pause(false);
document.addEventListener('visibilitychange', () => pause(manualPause));
function release() { if (game) game.held = false; }
canvas.addEventListener('pointerdown', e => { if (e.button !== 0 || game?.state !== 'PLAYING' || game.paused) return; const p = logicalPoint(e.clientX, e.clientY, canvas.getBoundingClientRect()); game.pointer = p; game.held = true; if (game.attackClock <= 1e-9) { game.attack(p.x, p.y); game.attackClock = game.stats.attackInterval; } e.preventDefault(); });
canvas.addEventListener('pointermove', e => { if (game) game.pointer = logicalPoint(e.clientX, e.clientY, canvas.getBoundingClientRect()); });
canvas.addEventListener('pointerleave', release); canvas.addEventListener('pointercancel', release); window.addEventListener('pointerup', release); window.addEventListener('blur', release);
$('same-seed').onclick = () => { enterSandbox(); const value = $('duration').value; start(Number($('seed').value) >>> 0, value ? Math.max(C.dev.minDuration, Math.min(C.dev.maxDuration, Number(value))) : undefined); };
$('experiment-start').onclick = () => { enterSandbox(); save.levels = { ...emptyLevels(), ...buildPresets[$('build-preset').value] }; const value = $('duration').value; start(Number($('seed').value) >>> 0, value ? Math.max(1, Math.min(90, Number(value))) : undefined); };
$('experiment-end').onclick = () => { sandboxSession = null; save = liveSave; game = null; manualPause = false; $('title').hidden = false; $('result').hidden = true; $('paused').hidden = true; $('pause').hidden = true; $('sandbox-status').textContent = 'LIVE SAVE · 기본 가격 / 생성'; $('notice').textContent = '실험을 종료했습니다. 기존 재화와 강화가 유지됩니다.'; syncOptions(); };
for (const type of TYPES) { const button = document.createElement('button'); button.textContent = `+ ${type}`; button.onclick = () => { if (game?.state === 'PLAYING' && !game.paused) { enterSandbox(); game.spawn(type); } }; $('spawn-tools').append(button); }
$('grant').onclick = () => { enterSandbox(); save.bank += C.dev.grant; if (game?.state === 'RESULT') renderUpgrades(); };
$('economy-preset').onchange = () => { if (sandboxSession) { sandboxSession.preset = $('economy-preset').value; if (game?.state === 'RESULT') renderUpgrades(); } };
$('reset').onclick = () => { if (confirm('영구 강화, 광자, 플레이 기록을 모두 초기화할까요?')) { save = freshSave(); if (sandboxSession) { save.sandbox = true; sandboxSession.save = save; } else liveSave = save; persist(); syncOptions(); game = null; $('title').hidden = false; $('result').hidden = true; $('paused').hidden = true; $('pause').hidden = true; } };
$('copy').onclick = async () => { const data = JSON.stringify({ current: game?.record() || null, lastRuns: save.lastRuns }, null, 2); try { await navigator.clipboard.writeText(data); $('notice').textContent = 'Run JSON을 복사했습니다.'; } catch { $('notice').textContent = '클립보드 접근이 제한되어 JSON 파일로 저장합니다.'; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = 'shard-storm-runs.json'; a.click(); URL.revokeObjectURL(a.href); } };
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
  if (game?.state === 'RESULT' && !game.settled) result();
  draw(ctx, game, fps);
  if (!$('dev').hidden) $('debug-stats').textContent = game ? `TIME ${game.remaining.toFixed(2)} / ${game.duration}\nKILLS ${game.totalDestroyed} (D ${game.directKills} / C ${game.cascadeKills})\nCHAIN ${game.currentChain} / BEST ${game.bestChain}\nPHOTON +${game.runEarned} / BANK ${save.bank}\nTIER ${game.highestTier} / SHAPES ${game.alive.length}/${game.target}\nSHARDS ${game.shards.length} / PEAK ${game.peakShards}\nWAVES ${game.waves.length} / SCHEDULED ${game.queue.length}\nFPS ${fps.toFixed(1)} / CAPS ${game.safetyCapsHit}\nSEED ${game.seed}\nFIRST CASCADE ${game.firstCascadeTime?.toFixed(3) ?? '—'}\nCOMBO ${JSON.stringify(game.comboMilestones)}\nEMPTY ${game.emptyArenaDuration.toFixed(3)}s / FAIL ${game.spawnFailures}\nCAP TYPES ${JSON.stringify(game.capCounts)}\nMODIFIERS ${game.alive.filter(s => s.modifier === 'charged').length} charged\nPRESET ${game.experiment.spawnInterval}s / cluster ${game.experiment.clusterChance}` : `BANK ${save.bank}\nREADY / FPS ${fps.toFixed(1)}`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only snapshot for browser QA; gameplay still runs through real pointer input.
window.shardStorm = { snapshot: () => ({ state: game?.state || 'TITLE', paused: game?.paused || false, remaining: game?.remaining, elapsed: game?.elapsed, fps, record: game?.record(), combo: game?.options.comboFeedback ? game?.combo.visible(game.elapsed) : null, audioVoices: voices, shapes: game?.alive.map(s => ({ id: s.id, type: s.type, modifier: s.modifier, maxHP: s.maxHP, x: s.x, y: s.y, hp: s.hp, grace: s.grace, enhanced: s.enhanced, radius: s.radius, material: s.appearance.material, pattern: s.appearance.pattern })) || [], waves: game?.waves.map(w => ({ radius: w.radius, maxRadius: w.maxRadius, source: w.sourceKind })) || [], scheduled: game?.queue.length || 0, clickRings: game?.clickVFX.items.length || 0, bank: save.bank, levels: { ...save.levels }, derivedStats: getDerivedStats(save.levels), options: { ...save.options }, saveVersion: save.saveVersion, sandbox: Boolean(sandboxSession), sandboxEconomy: sandboxSession?.preset, settled: game?.settled }) };
