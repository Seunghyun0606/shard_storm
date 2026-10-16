import { CONFIG as C } from './config.js';

// Presentation state never calls physics, awards, RNG, or settlement methods.
export class CombatPresentation {
  constructor() { this.events = []; this.lastShake = -Infinity; this.lastHit = -Infinity; this.lastClear = -Infinity; this.clearCount = 0; }
  emit(event, options) {
    if (options.combatFXEnabled === false) return;
    const { kind, at } = event;
    if (kind === 'hit' && at - this.lastHit < .12 - 1e-9) return;
    if (kind === 'hit') this.lastHit = at;
    if (kind === 'fieldClear') {
      if (at - this.lastClear < 3 - 1e-9) return;
      this.lastClear = at; this.clearCount++;
    }
    const life = kind==='bossClear'?.9:kind==='bossPhase'?.24:kind==='stormResponse'?.22:kind==='guard'?.10:kind === 'fieldClear' ? .22 : kind === 'special' ? (event.type === 'ancient' ? .18 : .15) : kind === 'combo' ? ({5:.10,10:.12,20:.15}[event.threshold]) : kind === 'death' ? .15 : kind === 'hit' ? .10 : .07;
    let shake = kind==='bossClear'?2:kind==='bossPhase'?1:kind==='stormResponse'?1.5:kind === 'special' ? (event.type === 'ancient' ? 2 : 1.5) : kind === 'combo' ? (event.threshold === 20 ? 2 : event.threshold === 10 ? 1.5 : 0) : event.heavy ? 1 : 0;
    if (options.screenShakeEnabled === false || options.reducedMotionEnabled || at - this.lastShake < .25 - 1e-9) shake = 0;
    if (shake) this.lastShake = at;
    this.events.push({ ...event, life, shake });
    if (this.events.length > 32) this.events.shift();
  }
  active(time) { return this.events.filter(e => time >= e.at && time < e.at + e.life); }
  prune(time) { this.events = this.active(time); }
}

export function spawnAlpha(grace) { return .15 + .85 * Math.max(0, Math.min(1, 1 - grace / C.spawnGrace)); }
export function resizeBacking(canvas, dpr = 1) {
  const rect = canvas.getBoundingClientRect(), ratio = Math.min(2, Math.max(1, dpr || 1));
  const width = Math.max(1, Math.round(rect.width * ratio)), height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  return { width, height, scaleX: width / C.width, scaleY: height / C.height };
}
