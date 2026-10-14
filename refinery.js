import { CONFIG as C } from './config.js';
import { seededRNG } from './entities.js';

export function planRefinery({ raw, seed, enabled = true, id = 'simulation', yieldLevel = 0 }) {
  if (!Number.isSafeInteger(raw) || raw < 0) throw new Error('Invalid Raw Shards');
  const rng = seededRNG(seed ^ 0x7ef1ae), count = C.refinery.tokens, share = Math.floor(raw / count);
  const tokens = Array.from({ length: count }, (_, i) => {
    let slot = 1;
    if (enabled) { let roll = rng() * C.refinery.slots.reduce((n, s) => n + s.weight, 0); slot = C.refinery.slots.findIndex(s => (roll -= s.weight) < 0); }
    const originalMultiplier=enabled ? C.refinery.slots[slot].multiplier : 1;
    const multiplier=enabled&&yieldLevel>=1&&originalMultiplier===.8?1:enabled&&yieldLevel>=2&&originalMultiplier===1?1.1:originalMultiplier;
    return { raw: i === count - 1 ? raw - share * (count - 1) : share, slot, originalMultiplier, multiplier };
  });
  const weighted = tokens.reduce((n, t) => n + t.raw * t.multiplier, 0);
  const payout = Math.floor(weighted * C.refinery.rate + 1e-9);
  return { id, raw, rate: C.refinery.rate, multiplier: raw ? weighted / raw : 1, payout, enabled, yieldLevel, tokens, confirmed: true };
}
export function ensureRefinery(run) {
  if (run.state !== 'RESULT') return null;
  run.refinery ||= planRefinery({ raw: run.runEarned, seed: run.seed ^ run.totalDestroyed, enabled: run.options.refineryEnabled, id: run.runId, yieldLevel: run.levels?.yieldStabilizer||0 });
  return run.refinery;
}
export function drawRefinery(canvas, plan, progress) {
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#0d1c23'; ctx.fillRect(0, 0, w, h);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 9; col++) { ctx.beginPath(); ctx.arc(25 + col * (w - 50) / 8 + (row % 2 ? 10 : 0), 20 + row * 23, 2, 0, Math.PI * 2); ctx.fillStyle = '#395d64'; ctx.fill(); }
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i === 4 ? '#FFD884' : '#6ADFEF'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; const original=C.refinery.slots[i].multiplier,effective=plan.enabled&&plan.yieldLevel>=1&&i===0?1:plan.enabled&&plan.yieldLevel>=2&&i===1?1.1:original;ctx.fillText(`×${original.toFixed(2)}${original!==effective?`→${effective.toFixed(2)}`:''}`, (i + .5) * w / 5, h - 8); }
  for (let i = 0; i < plan.tokens.length; i++) { const token = plan.tokens[i], t = Math.min(1, Math.max(0, progress * 1.35 - i * .035)), dest = (token.slot + .5) * w / 5;
    const x = w / 2 + (dest - w / 2) * t + Math.sin(t * Math.PI * 6 + i) * 12 * Math.sin(t * Math.PI), y = 8 + (h - 30) * t;
    ctx.fillStyle = '#d0fff4'; ctx.fillRect(x - 2, y - 2, 4, 4);
  }
}
