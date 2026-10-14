import { CONFIG as C } from './config.js';
import { segmentCircle } from './entities.js';
import { firstContact } from './motion.js';
export function makeShard(run, x, y, angle, source, chainId, depth, small = false, exclude = null) {
  const range = small ? C.smallShard.range : run.stats.shardRange;
  return { x, y, prevX: x, prevY: y, vx: Math.cos(angle) * C.shard.speed, vy: Math.sin(angle) * C.shard.speed, angle,
    damage: small ? (source === 'inherited' ? run.stats.inheritanceDamage : C.smallShard.damage) : source === 'triangle' ? run.stats.triangleDamage : run.stats.pentagonDamage,
    range, distance: 0, age: 0, life: small ? C.smallShard.life : Math.min(C.shard.maxLife, range / C.shard.speed + C.shard.lifePadding),
    bounces: small || !run.options.ricochet ? 0 : run.stats.bounces, source, sourceKind: source, chainId, depth, generation: depth, small, exclude, split: source === 'pentagon' && !small, dead: false };
}
// Preview the complete swept path including reflections, without changing state.
// The game chooses the earliest collision/event boundary before advancing time.
export function traceShard(run, shard, budget) {
  const A = C.arena, p = { x: shard.x, y: shard.y, vx: shard.vx, vy: shard.vy, angle: shard.angle, bounces: shard.bounces };
  let remaining = budget, travelled = 0, firstLeg = true, wallBounces=0;
  while (remaining > 1e-9 || firstLeg) {
    firstLeg = false;
    const ux = p.vx / C.shard.speed, uy = p.vy / C.shard.speed;
    const wallX = ux > 0 ? (A.right - p.x) / ux : ux < 0 ? (A.left - p.x) / ux : Infinity;
    const wallY = uy > 0 ? (A.bottom - p.y) / uy : uy < 0 ? (A.top - p.y) / uy : Infinity;
    const wall = Math.max(0, Math.min(wallX, wallY)), distance = Math.min(remaining, wall);
    const nx = p.x + ux * distance, ny = p.y + uy * distance;
    let hit = null, first = Infinity;
    for (const target of run.alive) {
      if (target.id === shard.exclude) continue;
      let t;
      if (run.options.motionEnabled && run.positionAt && (target.motion?.ampX || target.motion?.ampY)) {
        const start = run.elapsed + travelled / C.shard.speed, end = start + distance / C.shard.speed;
        const time = firstContact(time => { const pos = run.positionAt(target, time), d = (time - start) * C.shard.speed; return Math.hypot(p.x + ux * d - pos.x, p.y + uy * d - pos.y) - target.radius - C.shard.radius; }, Math.max(start, target.vulnerableAt || 0), end, C.shard.speed + C.motion.maxSpeed);
        t = time === null ? null : distance ? (time - start) * C.shard.speed / distance : 0;
      } else t = segmentCircle(p.x, p.y, nx, ny, target.x, target.y, target.radius + C.shard.radius);
      if (t !== null && t < first && (target.vulnerableAt || 0) <= run.elapsed + (travelled + distance * t) / C.shard.speed + 1e-9) { first = t; hit = target; }
    }
    if (hit) { p.x += ux * distance * first; p.y += uy * distance * first; return { ...p, distance: travelled + distance * first, hit, wallDead: false,wallBounces }; }
    p.x = nx; p.y = ny; travelled += distance; remaining -= distance;
    if (wall <= distance + 1e-9) {
      if (p.bounces <= 0 || !run.options.ricochet) return { ...p, distance: travelled, hit: null, wallDead: true,wallBounces };
      p.bounces--;wallBounces++;
      if (Math.abs(wallX - wall) < 1e-7) p.vx *= -1;
      if (Math.abs(wallY - wall) < 1e-7) p.vy *= -1;
      p.angle = Math.atan2(p.vy, p.vx);
    } else break;
  }
  return { ...p, distance: travelled, hit: null, wallDead: false,wallBounces };
}
