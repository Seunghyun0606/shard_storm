// PRD v0.7: gameplay values and experiment controls live here.
export const CONFIG = {
  width: 960, height: 540,
  arena: { left: 32, right: 928, top: 78, bottom: 512 },
  seed: 31415, duration: 60, directDamage: 3, attackInterval: .20,
  step: 1 / 60, maxCatchUp: 8, spawnInterval: .2, spawnBatch: 3,
  spawnGrace: .15, spawnAttempts: 80, spawnGap: 12, clusterChance: .6,
  clusterMin: 65, clusterMax: 125, trajectoryMargin: 15,
  shard: { speed: 700, range: 180, rangePerLevel: 50, maxLife: .5, lifePadding: .02, bounces: 1, radius: 3 },
  smallShard: { damage: 1, range: 90, life: .15, splitAngle: 35 * Math.PI / 180 },
  inheritance: { radius: 45, damage: 1 },
  propagation: { delay: .03, squareSpeed: 650, starSpeed: 720, tailLife: .06 },
  impact: { radius: 42, damage: 1 },
  crushSpeed: { perLevel: .02, minimum: .14 },
  photonBoostPerLevel: .10,
  variety: {
    radiusMin: 13, radiusMax: 21, minHitRadius: 16,
    triangle: { aspectMin: .85, aspectMax: 1.16, radialJitter: .10 },
    square: { aspectMin: .82, aspectMax: 1.18, vertexJitter: .08 },
    pentagon: { radialJitter: .11, angleJitter: Math.PI / 30 },
    star: { innerMin: .42, innerMax: .58, radialJitter: .07 },
    palettes: ['matte', 'bright', 'deep'], patterns: ['none', 'inset', 'split-line', 'center-core'],
    lightness: [39, 54, 24], saturation: 54, saturationJitter: 12, alphaMin: .32, alphaMax: .48
  },
  patterns: { clusterWeight: 35, arcWeight: 25, bridgeWeight: 20, clusterMin: 65, clusterMax: 110, arcSpacingMin: 50, arcSpacingMax: 90, neighbourMin: 65, neighbourMax: 115, starAnchorChance: .35 },
  amplifierRadius: 15, enhancedHP: 2, enhancedReward: 1.5,
  caps: { shards: 150, depth: 10, events: 400, particles: 240, visuals: 100, clickRings: 24, waves: 64, scheduled: 1024, tickIterations: 512 },
  visual: { flash: .055, debrisLife: .2, deathLife: .22, ringLife: .15, knockback: 18, knockbackLife: .18, guideLife: 3, starParticles: 10, clickLife: .12, clickStart: 8, clickEnd: 26, missLife: .07, missEnd: 12, recoilLife: .10, recoilScale: 1.08, clickDebrisLife: .15 },
  shapes: {
    triangle: { hp: 3, bonus: 5, radius: 22, color: '#6ADFEF', hue: 188, sides: 3, shardDamage: 3 },
    square: { hp: 4, bonus: 8, radius: 24, color: '#F4A6D2', hue: 326, sides: 4, areaRadius: 90, areaDamage: 2 },
    pentagon: { hp: 5, bonus: 12, radius: 25, color: '#C7ADFF', hue: 259, sides: 5, shardDamage: 3, splitAngle: Math.PI / 4 },
    star: { hp: 9, bonus: 40, radius: 29, color: '#FFD884', hue: 42, sides: 10, innerRatio: .47, areaRadius: 145, areaDamage: 5 }
  },
  tiers: [
    { threshold: 0, target: 12, weights: [.65, .35, 0, 0], enhanced: 0 },
    { threshold: 12, target: 16, weights: [.45, .35, .2, 0], enhanced: 0 },
    { threshold: 30, target: 20, weights: [.4, .3, .2, .1], enhanced: 0 },
    { threshold: 55, target: 24, weights: [.35, .3, .2, .15], enhanced: .2 },
    { threshold: 90, target: 28, weights: [.35, .3, .2, .15], enhanced: .2 },
    { threshold: 140, target: 32, weights: [.35, .3, .2, .15], enhanced: .3 }
  ],
  tutorial: { x: 480, y: 335, distance: 108, angle: -Math.PI / 2 },
  upgrades: {
    crushPower: { name: 'Crush Power', subtitle: '직접 공격력', baseCost: 60, max: 5, perLevel: 1 },
    shardPower: { name: 'Shard Power', subtitle: '주 파편 피해', baseCost: 90, max: 5, perLevel: 1 },
    shardRange: { name: 'Shard Range', subtitle: '파편 비행거리', baseCost: 70, max: 3 },
    chainAmplifier: { name: 'Chain Amplifier', subtitle: '충격파 · 폭발', baseCost: 130, max: 3, perLevel: 1 },
    extraTime: { name: 'Extra Time', subtitle: '플레이 시간', baseCost: 120, max: 6, perLevel: 5 },
    crushSpeed: { name: 'Crush Speed', subtitle: '홀드 공격 속도', baseCost: 150, max: 3 },
    impactPulse: { name: 'Impact Pulse', subtitle: '직접 타격 추가 파동', baseCost: 260, max: 1 },
    ricochetPlus: { name: 'Ricochet+', subtitle: '주 파편 반사 횟수', baseCost: 170, max: 2 },
    shardBloom: { name: 'Shard Bloom', subtitle: '고유 파편 추가', baseCost: 290, max: 2 },
    echoCatalyst: { name: 'Echo Catalyst', subtitle: '계승 피해 강화', baseCost: 240, max: 2 },
    photonBoost: { name: 'Photon Boost', subtitle: '파괴 보너스 강화', baseCost: 180, max: 3 }
  },
  // Positions and prerequisite edges are declarative. Existing balances stay above.
  skillDefinitions: [
    { id: 'crushPower', branch: 'destroy', position: { col: 0, row: 1 }, prerequisites: [] },
    { id: 'crushSpeed', branch: 'destroy', position: { col: 0, row: 2 }, prerequisites: [{ id: 'crushPower', minLevel: 1 }] },
    { id: 'impactPulse', branch: 'destroy', position: { col: 0, row: 3 }, prerequisites: [{ id: 'crushPower', minLevel: 2 }] },
    { id: 'shardPower', branch: 'cascade', position: { col: 1, row: 1 }, prerequisites: [] },
    { id: 'shardRange', branch: 'cascade', position: { col: 1, row: 2 }, prerequisites: [{ id: 'shardPower', minLevel: 1 }] },
    { id: 'ricochetPlus', branch: 'cascade', position: { col: 1, row: 3 }, prerequisites: [{ id: 'shardRange', minLevel: 1 }] },
    { id: 'shardBloom', branch: 'cascade', position: { col: 1, row: 4 }, prerequisites: [{ id: 'shardPower', minLevel: 2 }] },
    { id: 'chainAmplifier', branch: 'reaction', position: { col: 2, row: 1 }, prerequisites: [] },
    { id: 'echoCatalyst', branch: 'reaction', position: { col: 2, row: 2 }, prerequisites: [{ id: 'chainAmplifier', minLevel: 1 }] },
    { id: 'extraTime', branch: 'utility', position: { col: 3, row: 1 }, prerequisites: [] },
    { id: 'photonBoost', branch: 'utility', position: { col: 3, row: 2 }, prerequisites: [{ id: 'extraTime', minLevel: 1 }] }
  ],
  costGrowth: 1.6, saveVersion: 2, storageKey: 'shard-storm-v1', historyLimit: 20,
  dev: { grant: 1000, minDuration: 1, maxDuration: 90 },
  options: { inheritance: true, ricochet: true, sequentialPropagation: true, visualVariety: true, damageVFX: true, sound: false }
};
