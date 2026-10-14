import { CONFIG as C } from './config.js';
import { seededRNG } from './entities.js';

export function createMotion(shape, seed, now, tutorial = false) {
  const rng = seededRNG(seed ^ Math.imul(shape.id, 0x45d9f3b)), roll = rng();
  const profile = roll < .35 ? 'rotate' : roll < .60 ? 'drift' : roll < .90 ? 'both' : 'static';
  const star = shape.type === 'star', M = C.motion;
  const amplitude = (C.shapes[shape.type].drift ?? (star ? M.starDrift : M.maxDrift)) / (2 * Math.SQRT2);
  return { profile, anchorX: shape.x, anchorY: shape.y, spawnAngle: shape.angle, startAt: tutorial ? Infinity : now,
    ampX: ['drift', 'both'].includes(profile) ? amplitude : 0, ampY: ['drift', 'both'].includes(profile) ? amplitude : 0,
    phaseX: rng() * Math.PI * 2, phaseY: rng() * Math.PI * 2,
    speedX: Math.PI * 2 / (M.periodMin + rng() * (M.periodMax - M.periodMin)), speedY: Math.PI * 2 / (M.periodMin + rng() * (M.periodMax - M.periodMin)),
    rotationRate: ['rotate', 'both'].includes(profile) || shape.type==='ancient' ? (rng() < .5 ? -1 : 1) * ((star || shape.type==='ancient' ? M.starRotationMin : M.rotationMin) + rng() * ((star || shape.type==='ancient' ? M.starRotationMax : M.rotationMax) - (star || shape.type==='ancient' ? M.starRotationMin : M.rotationMin))) * Math.PI / 180 : 0 };
}
export function poseAt(shape, time) {
  const m = shape.motion; if (!m || !Number.isFinite(m.startAt)) return { x: shape.x, y: shape.y, angle: shape.angle };
  const t = Math.max(0, time - m.startAt);
  return { x: m.anchorX + m.ampX * (Math.sin(m.phaseX + m.speedX * t) - Math.sin(m.phaseX)), y: m.anchorY + m.ampY * (Math.sin(m.phaseY + m.speedY * t) - Math.sin(m.phaseY)), angle: m.spawnAngle + m.rotationRate * t };
}
// Conservative advancement uses a speed bound, so it cannot jump over a hit.
// The threshold bounds geometric error to 0.000001 px, not a screen-sized halo.
export function firstContact(gap, start, end, speedBound) {
  if (start > end + 1e-12) return null;
  let at = start;
  for (let i = 0; i < C.motion.contactIterations; i++) {
    const distance = gap(at);
    if (distance <= C.motion.contactTolerance) return at;
    const step = distance / speedBound;
    if (at + step > end + 1e-12) return null;
    if (at >= end) return null;
    at = Math.min(end, at + step);
  }
  // Extremely grazing contacts: interval bounds, earliest-first subdivision.
  const search = (a, b, depth) => {
    const mid = (a + b) / 2, value = gap(mid);
    if (value > speedBound * (b - a) / 2 + C.motion.contactTolerance) return null;
    if (b - a < 1e-9 || depth > 32) return value <= C.motion.contactTolerance ? mid : null;
    return search(a, mid, depth + 1) ?? search(mid, b, depth + 1);
  };
  return search(at, end, 0);
}
