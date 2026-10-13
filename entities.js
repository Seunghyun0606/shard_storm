import { CONFIG as C } from './config.js';
export function seededRNG(seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function createShape(id, type, x, y, angle, enhanced = false, grace = C.spawnGrace, modifier = 'normal') {
  const s = C.shapes[type], hp = s.hp + (enhanced ? C.enhancedHP : 0);
  if (enhanced || !['normal', 'cracked', 'charged'].includes(modifier)) modifier = 'normal';
  return { id, type, modifier, clickedFirst: false, x, y, angle, radius: s.radius, hp: modifier === 'cracked' ? Math.max(1, Math.ceil(hp * C.modifiers.crackedHP)) : hp, maxHP: hp, bonus: enhanced ? Math.ceil(s.bonus * C.enhancedReward) : s.bonus, enhanced, grace, destroyed: false, flash: 0, knockX: 0, knockY: 0, knockTime: 0 };
}
export function segmentCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1, dy = y2 - y1, ox = x1 - cx, oy = y1 - cy;
  const a = dx * dx + dy * dy, c = ox * ox + oy * oy - radius * radius;
  if (c <= 0) return 0;
  if (!a) return null;
  const b = 2 * (ox * dx + oy * dy), disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  return t >= -1e-9 && t <= 1 + 1e-9 ? Math.max(0, Math.min(1, t)) : null;
}
export function pointSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
}
export function logicalPoint(clientX, clientY, rect) { return { x: (clientX - rect.left) * C.width / rect.width, y: (clientY - rect.top) * C.height / rect.height }; }
