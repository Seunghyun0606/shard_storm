import { CONFIG as C } from './config.js';
import { seededRNG } from './entities.js';
export function createAppearance(type, seed) {
  const rng = seededRNG(seed), cfg = C.shapes[type], V = C.variety;
  const between = (a, b) => a + rng() * (b - a), jitter = magnitude => between(-magnitude, magnitude);
  const baseRadius = cfg.special ? cfg.radius : between(V.radiusMin, V.radiusMax), paletteIndex = Math.floor(rng() * V.palettes.length);
  const material = V.palettes[paletteIndex], pattern = V.patterns[Math.floor(rng() * V.patterns.length)];
  const sat = V.saturation + jitter(V.saturationJitter), light = V.lightness[paletteIndex], alpha = between(V.alphaMin, V.alphaMax);
  const variation=V[type]||{};
  const aspect = variation.aspectMin === undefined ? [1, 1] : [between(variation.aspectMin, variation.aspectMax), between(variation.aspectMin, variation.aspectMax)];
  const inner = type === 'star' ? between(V.star.innerMin, V.star.innerMax) : 1;
  let vertices = Array.from({ length: cfg.sides }, (_, i) => {
    const a = i * Math.PI * 2 / cfg.sides + (type === 'pentagon' ? jitter(V.pentagon.angleJitter) : 0);
    const radius = (type === 'star' && i % 2 ? inner : 1) * (1 + jitter(variation.radialJitter || 0));
    let x = Math.cos(a) * radius * aspect[0], y = Math.sin(a) * radius * aspect[1];
    // Preserve Triangle's three 120° tip directions so its displayed tips and
    // native shard rays agree even with narrow/wide cosmetic silhouettes.
    if (type === 'triangle') { const radial = Math.hypot(x, y); x = Math.cos(a) * radial; y = Math.sin(a) * radial; }
    if (type === 'square') { x += jitter(V.square.vertexJitter); y += jitter(V.square.vertexJitter); }
    return { x, y };
  });
  const extent = Math.max(...vertices.map(v => Math.hypot(v.x, v.y)));
  vertices = vertices.map(v => ({ x: v.x * baseRadius / extent, y: v.y * baseRadius / extent }));
  const damageSeed = Math.floor(rng() * 0xffffffff), cracks = Array.from({ length: 3 }, () => ({ angle: rng() * Math.PI * 2, bend: jitter(.5), length: between(.55, .92) }));
  return { seed, baseRadius, localVertices: vertices, material, pattern, fill: `hsla(${cfg.hue}, ${sat}%, ${light}%, ${alpha})`, damageSeed, cracks, clippedCorners: [damageSeed % cfg.sides, (damageSeed + 1) % cfg.sides, (damageSeed + 2) % cfg.sides] };
}
export class ClickVFXPool {
  constructor() { this.items = []; this.free = []; }
  add(x, y, hit, bornAt = 0) {
    const v = this.free.pop() || {};
    Object.assign(v, { x, y, hit, bornAt, age: 0, life: hit ? C.visual.clickLife : C.visual.missLife });
    if (this.items.length >= C.caps.clickRings) this.free.push(this.items.shift());
    this.items.push(v);
  }
  update(dt, time) { for (const v of this.items) v.age = time === undefined ? v.age + dt : Math.max(0, time - v.bornAt); for (let i = this.items.length - 1; i >= 0; i--) if (this.items[i].age >= this.items[i].life) this.free.push(...this.items.splice(i, 1)); }
  clear() { this.free.push(...this.items); this.items.length = 0; }
}
