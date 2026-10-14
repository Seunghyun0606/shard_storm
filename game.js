import { CONFIG as C } from './config.js';
import { TYPES, emptyLevels, durationFor, tierFor } from './progression.js';
import { seededRNG, createShape, pointSegmentDistance } from './entities.js';
import { makeShard, traceShard } from './effects.js';
import { getDerivedStats } from './skill-tree.js';
import { createAppearance, ClickVFXPool } from './visuals.js';
import { ComboFeedback } from './combo.js';
import { spawnSettings } from './experiments.js';
import { createMotion, poseAt, firstContact } from './motion.js';
import { ensureRefinery } from './refinery.js';
import { rollOre, oreChances, dropOre } from './ore.js';
import { normalizeLoadout,relicStats,siphonDamage,relicKill } from './relics.js';
import { emptyCounters,count,killMetrics,releaseWard } from './run-metrics.js';
import { specialType, linkWards, shieldDamage, cleanupWards, hexDeath, specialPlan, applyTether, healthStages, ancientDeath, skillKill, skillWaveContact } from './content.js';
let nextRunId = 1;

export class Game {
  constructor({ seed = C.seed, levels = emptyLevels(), options = C.options, duration, experiment = 'baseline', inputPolicy = 'human', sandbox = false, ruleset = 'v09', tierPreset = 'v09_short', runId, discoveryRank = 0, welcomeFlags = {}, contentMode = 'M5_M6_ON', oreEnabled = true,relicLoadout=[],relicEnabled=true,activeContracts=[],anomalyId=null,metaEnabled=true } = {}) {
    this.relicLoadout=Object.freeze(relicEnabled?normalizeLoadout(relicLoadout):[]);this.metaEnabled=metaEnabled;this.metaCounters=emptyCounters();this.causalLog=[];this.nextCausalEvent=0;this.relicActivations={};this.siphonCharges=[];this.siphonConsumed=0;this.anomalyId=anomalyId;
    this.discoveryRank = discoveryRank; this.contentMode = ruleset === 'legacy_v08' ? 'V09_ONLY' : contentMode; this.oreEnabled = oreEnabled && options.oreEnabled!==false && this.contentMode !== 'V09_ONLY'; this.welcomeFlags = {...welcomeFlags}; this.welcomeConsumed = [];
    this.specialRng=seededRNG(seed^0x47bfee);this.patternRng=seededRNG(seed^0x841ac);this.specialSpawns={};this.tetherPairs=0;this.tetherAttempts=0;this.stageEvents=[];
    this.skillActivations={};this.skillEvents=[];this.channelCounts=new Map();this.channelTargets=new Map();
    this.oreRng = seededRNG(seed ^ 0xaec791); this.oreSpawnCounts={common:0,prism:0,core:0,void:0}; this.oreKills={common:0,prism:0,core:0,void:0}; this.pendingCatalyst=0; this.rawBase=0; this.rawHP=0; this.rawNativeBonus=0; this.rawOreBonus=0; this.rawSkillBonus=0; this.rewardLog=[];
    this.ruleset = ruleset; this.tierPreset = ruleset === 'legacy_v08' ? 'legacy_tiers' : tierPreset; this.tiers = this.tierPreset === 'legacy_tiers' ? C.legacyTiers : C.tiers; this.runId = runId || `run-${seed}-${nextRunId++}`; this.refinery = null;
    this.seed = seed >>> 0; this.rng = seededRNG(this.seed); this.vfxRng = seededRNG(this.seed ^ 0xabcdef);
    this.levels = { ...emptyLevels(), ...levels }; this.stats = relicStats(getDerivedStats(this.levels),this.relicLoadout); this.options = { ...C.options, ...options }; this.initialOptions = { ...this.options }; this.optionChanges = [];
    if (ruleset === 'legacy_v08') this.stats.duration = 60 + 5 * (this.levels.extraTime || 0);
    this.duration = duration ?? this.stats.duration; this.elapsed = 0; this.remaining = this.duration;
    this.experiment = spawnSettings(experiment); this.inputPolicy = inputPolicy; this.sandbox = sandbox;
    this.bins = Array.from({ length: Math.ceil(this.duration / 10) }, (_, i) => ({ start: i * 10, end: Math.min(this.duration, (i + 1) * 10), totalDestroyed: 0, directKills: 0, cascadeKills: 0, earnedPhoton: 0, comboMilestones: { 5: 0, 10: 0, 20: 0 }, bestChain: 0, cascadeDurationTotalMs: 0, completedCascadeChains: 0, sampledSeconds: 0, samples: 0, aliveIntegral: 0, targetIntegral: 0, emptyArenaDuration: 0, spawnAttempts: 0, spawnSuccesses: 0, spawnFailures: 0, safetyCapsHit: 0, caps: {}, typeStats: {}, modifierStats: {}, hpDistribution: {}, enhancedSpawns: 0 }));
    this.bins5 = Array.from({ length: Math.ceil(this.duration / 5) }, (_, i) => ({ ...structuredClone(this.bins[0]), start: i * 5, end: Math.min(this.duration, (i + 1) * 5) }));
    this.emptyArenaDuration = 0; this.emptyEpisode = 0; this.emptyEpisodesOverHalfSecond = 0; this.maxEmptyEpisode = 0;
    this.capCounts = {}; this.capSources = {}; this.chargedCaps = 0; this.spawnAttempts = 0; this.spawnSuccesses = 0; this.spawnFailures = 0;
    this.hpDistribution = {}; this.enhancedSpawnCount = 0; this.secondShardPeaks = Array(Math.ceil(this.duration)).fill(0); this.peakWaves = 0; this.peakScheduled = 0;
    this.frameSamples = []; this.stepSamples = []; this.motionRunning = this.options.motionEnabled; this.motionPausedAt = this.motionRunning ? null : 0; this.motionProfiles = {}; this.missedClicks = 0; this.successfulClicks = 0; this.shardsEmitted = 0; this.projectileHits = 0; this.waveContacts = 0; this.maxMotionSpeed = 0;
    this.physicsChecks = { waveContactsChecked: 0, maxWaveContactError: 0, lateWaveContacts: 0, duplicateWaveRejected: 0, projectileContactsChecked: 0, maxProjectileContactError: 0 };
    this.motionMeasurements = { maxObservedSpeed: 0, maxObservedDisplacement: 0, rotationRateMinDeg: null, rotationRateMaxDeg: 0, driftingSpawnCount: 0, rotatingSpawnCount: 0 };
    this.state = 'PLAYING'; this.paused = false; this.settled = false; this.shapes = []; this.shards = []; this.waves = []; this.visuals = []; this.particles = []; this.clickVFX = new ClickVFXPool();
    this.queue = []; this.chains = new Map(); this.nextId = 1; this.nextChain = 1; this.spawnClock = 0; this.pending = [];
    this.totalDestroyed = 0; this.directKills = 0; this.cascadeKills = 0; this.bestChain = 0; this.currentChain = 0; this.runEarned = 0;
    this.highestTier = 0; this.unlockTimes = {}; this.safetyCapsHit = 0; this.peakShards = 0; this.firstCascadeTime = null;
    this.held = false; this.pointer = null; this.attackClock = 0; this.onEvent = null;
    this.nextEvent = 1; this.nextWave = 1; this.processingTime = null; this.cascadeDurations = []; this.variantCounts = {}; this.patternCounts = {}; this.patternPlan = null;
    this.skippedSeconds = 0; this.skippedEvents = 0;
    this.combo = new ComboFeedback(); this.comboMilestones = { 5: 0, 10: 0, 20: 0 }; this.comboEvents = []; this.timeToFirstChain5 = null;
    // Separate mechanical lottery keeps Modifiers OFF on the exact v0.7 RNG path.
    // One draw per spawn call, even OFF / Enhanced / failed placement; never reroll at cap.
    this.modifierRng = seededRNG(this.seed ^ 0x51a8c3);
    this.modifierStats = Object.fromEntries(['normal', 'cracked', 'charged'].map(k => [k, { spawnCount: 0, clickedFirstCount: 0, directHitCount: 0, directKillCount: 0, cascadeKillCount: 0 }]));
    this.typeStats = Object.fromEntries(Object.keys(C.shapes).map(k => [k, { spawnCount: 0, directHitCount: 0, directKillCount: 0, cascadeKillCount: 0 }]));
    this.chargedContribution = { damage: 0, kills: 0, photons: 0 };
    this.initializing = true; this.initialLayout(); this.initializing = false;
  }
  get alive() { return this.shapes.filter(s => !s.destroyed); }
  get target() { return this.tiers[tierFor(this.totalDestroyed, this.tiers)].target; }
  get simulationTime() { return this.processingTime ?? this.elapsed; }
  positionAt(s, time) { return this.options.motionEnabled ? poseAt(s, time) : { x: s.x, y: s.y, angle: s.angle }; }
  syncMotion() { if (this.motionRunning !== this.options.motionEnabled) this.setMotionEnabled(this.options.motionEnabled); }
  setMotionEnabled(value) {
    if (value === this.motionRunning) { this.options.motionEnabled = value; return; }
    if (!value) this.motionPausedAt = this.elapsed;
    else {
      for (const s of this.alive) if (Number.isFinite(s.motion.startAt)) s.motion.startAt += Math.max(0, this.elapsed - Math.max(this.motionPausedAt, s.motion.startAt));
      for (const wave of this.waves.filter(w => !w.dynamic)) {
        for (const event of this.queue.filter(e => e.wave === wave)) wave.registeredIds.delete(event.target.id);
        this.queue = this.queue.filter(e => e.wave !== wave); wave.dynamic = true;
        for (const s of this.alive) if (this.waveGap(wave, s, this.elapsed) < -C.motion.contactTolerance) wave.registeredIds.add(s.id);
      }
    }
    this.options.motionEnabled = value; this.motionRunning = value;
  }
  updateMotion(time) {
    if (!this.options.motionEnabled) return;
    for (const s of this.alive) {
      const pose = this.positionAt(s, time); s.prevX = s.x; s.prevY = s.y;
      Object.assign(s, pose);
      const m = s.motion; this.maxMotionSpeed = Math.max(this.maxMotionSpeed, Math.hypot(m.ampX * m.speedX, m.ampY * m.speedY));
      if (Number.isFinite(m.startAt) && time >= m.startAt) {
        const t = time - m.startAt;
        this.motionMeasurements.maxObservedSpeed = Math.max(this.motionMeasurements.maxObservedSpeed, Math.hypot(m.ampX * m.speedX * Math.cos(m.phaseX + m.speedX * t), m.ampY * m.speedY * Math.cos(m.phaseY + m.speedY * t)));
        this.motionMeasurements.maxObservedDisplacement = Math.max(this.motionMeasurements.maxObservedDisplacement, Math.hypot(s.x - m.anchorX, s.y - m.anchorY));
      }
    }
  }
  waveGap(wave, target, time) { const p = this.positionAt(target, time); return Math.hypot(p.x - wave.x, p.y - wave.y) - target.radius - Math.min(wave.maxRadius, Math.max(0, wave.speed * (time - wave.bornAt))); }
  dynamicWaveContacts(start, end) {
    const hits = [];
    for (const wave of this.waves.filter(w => w.dynamic)) {
      const last = Math.min(end, wave.bornAt + wave.maxRadius / wave.speed);
      if (start > last + 1e-12) continue;
      for (const target of this.alive) {
        if (target.id === wave.exclude || wave.registeredIds.has(target.id)) continue;
        const initial = this.waveGap(wave, target, start);
        // A newly spawned/toggled target behind an already passed front cannot hit.
        if (initial < -C.motion.contactTolerance && start > wave.bornAt + 1e-9) { wave.registeredIds.add(target.id); continue; }
        const time = firstContact(t => this.waveGap(wave, target, t), start, last, wave.speed + C.motion.maxSpeed);
        if (time !== null) hits.push({ wave, target, time });
      }
    }
    return hits.sort((a,b) => a.time - b.time || a.wave.id - b.wave.id || a.target.id - b.target.id);
  }
  initialLayout() {
    const t = C.tutorial;
    this.addShape('triangle', t.x, t.y, t.angle, false, 0);
    for (let i = 0; i < 3; i++) { const a = t.angle + i * Math.PI * 2 / 3; this.addShape('triangle', t.x + Math.cos(a) * t.distance, t.y + Math.sin(a) * t.distance, t.angle, false, 0); }
    const rays = Array.from({ length: 3 }, (_, i) => { const a = t.angle + i * Math.PI * 2 / 3; return [t.x, t.y, t.x + Math.cos(a) * C.shard.range, t.y + Math.sin(a) * C.shard.range]; });
    for (let i = 0; i < 8; i++) this.spawn(null, 0, rays);
  }
  addShape(type, x, y, angle = 0, enhanced = false, grace = C.spawnGrace, modifier = 'normal') {
    if (this.state !== 'PLAYING' || this.remaining <= 0) return null;
    if (modifier === 'charged' && this.alive.filter(s => s.modifier === 'charged').length >= C.modifiers.chargedCap) modifier = 'normal';
    const s = createShape(this.nextId++, type, x, y, angle, enhanced, grace, modifier);
    if(C.shapes[type].special){this.specialSpawns[type]=(this.specialSpawns[type]||0)+1;s.modifier='normal';s.enhanced=false;s.hp=s.maxHP=C.shapes[type].hp;s.bonus=C.shapes[type].bonus;}
    s.appearance = createAppearance(type, (this.seed ^ Math.imul(s.id, 0x9e3779b1)) >>> 0);
    const oreRoll=this.oreRng(); s.oreGrade=this.oreEnabled?rollOre(oreRoll,this.discoveryRank,this.levels.salvageScanner||0):'common';
    if(this.oreEnabled && this.welcomeFlags[1] && !this.initializing) { s.oreGrade='prism'; delete this.welcomeFlags[1];this.welcomeConsumed.push(1); }
    this.oreSpawnCounts[s.oreGrade]++;
    s.radius = Math.max(C.variety.minHitRadius, s.appearance.baseRadius); s.recoil = 0; s.vulnerableAt = this.elapsed + grace;
    this.variantCounts[s.appearance.material] = (this.variantCounts[s.appearance.material] || 0) + 1;
    s.motion = createMotion(s, this.seed, this.elapsed, this.initializing && s.id <= 4); s.anchorX = x; s.anchorY = y; s.prevX = x; s.prevY = y;
    if (s.motion.ampX || s.motion.ampY) this.motionMeasurements.driftingSpawnCount++;
    if (s.motion.rotationRate) { const degrees = Math.abs(s.motion.rotationRate) * 180 / Math.PI; this.motionMeasurements.rotatingSpawnCount++; this.motionMeasurements.rotationRateMinDeg = Math.min(this.motionMeasurements.rotationRateMinDeg ?? degrees, degrees); this.motionMeasurements.rotationRateMaxDeg = Math.max(this.motionMeasurements.rotationRateMaxDeg, degrees); }
    this.motionProfiles[s.motion.profile] = (this.motionProfiles[s.motion.profile] || 0) + 1; this.shapes.push(s);
    this.modifierStats[s.modifier].spawnCount++; this.typeStats[type].spawnCount++;
    this.hpDistribution[s.hp] = (this.hpDistribution[s.hp] || 0) + 1; this.enhancedSpawnCount += Number(s.enhanced);
    this.binMetric('typeStats', type, 'spawnCount'); this.binMetric('modifierStats', s.modifier, 'spawnCount');
    const bin = this.binAt(); bin.hpDistribution[s.hp] = (bin.hpDistribution[s.hp] || 0) + 1; bin.enhancedSpawns += Number(s.enhanced); const b5 = this.binAt5(); b5.hpDistribution[s.hp] = (b5.hpDistribution[s.hp] || 0) + 1; b5.enhancedSpawns += Number(s.enhanced);
    for (const wave of this.waves) this.registerWaveTarget(wave, s);
    if(this.contentMode==='M5_M6_ON')linkWards(this);
    return s;
  }
  spawn(forced = null, grace = C.spawnGrace, avoid = []) {
    if (this.state !== 'PLAYING' || this.remaining <= 0) return null;
    this.spawnAttempts++; this.binAt().spawnAttempts++; this.binAt5().spawnAttempts++;
    const tier = this.tiers[tierFor(this.totalDestroyed, this.tiers)]; let type = forced;
    if(C.shapes[type]?.special&&(this.alive.filter(s=>s.type===type).length>=C.shapes[type].cap||(this.specialSpawns[type]||0)>=(C.shapes[type].runCap||Infinity)))type=null;
    if(!type&&!this.initializing&&this.contentMode==='M5_M6_ON')type=specialType(this);
    if (!type) { let p = this.rng(); type = TYPES[TYPES.length - 1]; for (let i = 0; i < TYPES.length; i++) { p -= tier.weights[i]; if (p < 0) { type = TYPES[i]; break; } } }
    // Reserve identical motion-safe anchors in both v0.9 A/B modes. Only the
    // legacy ruleset retains v0.8 placement, avoiding a spacing confound.
    const enhanced = this.rng() < tier.enhanced, live = this.alive, A = C.arena;
    // Keep the original four-shape workload exact. Near a special body reserve
    // its real circle and each body's actual drift bound, including zero for
    // Ancient. A generic extra12px made the prescribed60px wave unreachable.
    const specialSpacing=C.shapes[type].special||live.some(s=>C.shapes[s.type].special);
    const margin=this.ruleset==='legacy_v08'?0:specialSpacing?(C.shapes[type].drift??C.motion.maxDrift):C.motion.maxDrift;
    const placementRadius=specialSpacing&&!C.shapes[type].special?Math.max(C.variety.minHitRadius,createAppearance(type,(this.seed^Math.imul(this.nextId,0x9e3779b1))>>>0).baseRadius):C.shapes[type].radius;
    const r=placementRadius+margin;
    const modifier = this.rollModifier(enhanced);
    const cluster = this.initializing ? this.rng() < this.experiment.clusterChance && live.length : false;
    const usePattern = !this.initializing && live.length && this.rng() < this.experiment.clusterChance;
    if (usePattern && (!this.patternPlan || this.patternPlan.index >= this.patternPlan.points.length)) { if(this.patternPlan?.pair?.length===1)this.patternPlan.pair[0].motion.startAt=this.elapsed;this.patternPlan = this.createPatternPlan(true); }
    const plan = usePattern ? this.patternPlan : null;
    let usedPattern = plan?.kind || 'scattered';
    for (let attempt = 0; attempt < C.spawnAttempts; attempt++) {
      let x, y;
      if (plan && attempt === 0) ({ x, y } = plan.points[plan.index]);
      else if ((cluster || (plan && plan.kind !== 'scattered')) && live.length && attempt < C.spawnAttempts / 2) { const parent = plan?.anchor || live[Math.floor(this.rng() * live.length)], a = this.rng() * Math.PI * 2, d = C.clusterMin + this.rng() * (C.clusterMax - C.clusterMin); x = parent.x + Math.cos(a) * d; y = parent.y + Math.sin(a) * d; }
      else { x = A.left + r + this.rng() * (A.right - A.left - 2 * r); y = A.top + r + this.rng() * (A.bottom - A.top - 2 * r); }
      if (x < A.left + r || x > A.right - r || y < A.top + r || y > A.bottom - r || live.some(s => Math.hypot((specialSpacing?s.anchorX:s.x) - x, (specialSpacing?s.anchorY:s.y) - y) < s.radius + r + C.spawnGap + (specialSpacing?(C.shapes[s.type].drift??C.motion.maxDrift):margin))) continue;
      if (avoid.some(ray => pointSegmentDistance(x, y, ...ray) < r + C.trajectoryMargin)) continue;
      if (this.shards.some(s => !s.dead && pointSegmentDistance(x, y, s.x, s.y, s.x + Math.cos(s.angle) * (s.range - s.distance), s.y + Math.sin(s.angle) * (s.range - s.distance)) < r + C.trajectoryMargin)) continue;
      if (plan) { plan.index++; if (attempt >= C.spawnAttempts / 2) usedPattern = 'scattered'; }
      if (!this.initializing) this.patternCounts[usedPattern] = (this.patternCounts[usedPattern] || 0) + 1;
      const shape = this.addShape(type, x, y, this.rng() * Math.PI * 2, enhanced, grace, modifier); shape.spawnPattern = usedPattern;
      applyTether(this,plan,shape,attempt);
      if(C.shapes[type].special&&this.welcomeFlags[C.shapes[type].rank]){const rank=C.shapes[type].rank;delete this.welcomeFlags[rank];this.welcomeConsumed.push(rank);}
      this.spawnSuccesses++; this.binAt().spawnSuccesses++; this.binAt5().spawnSuccesses++; return shape;
    }
    if(plan?.pair?.length===1)plan.pair[0].motion.startAt=this.elapsed;
    this.spawnFailures++; this.binAt().spawnFailures++; this.binAt5().spawnFailures++; return null;
  }
  rollModifier(enhanced = false) {
    const roll = this.modifierRng();
    if (!this.options.modifiers || enhanced) return 'normal';
    const chance = this.tierPreset === 'legacy_tiers' ? C.modifiers.chances.findLast(c => this.totalDestroyed >= c.threshold) : this.tiers[tierFor(this.totalDestroyed, this.tiers)];
    if (roll < chance.cracked) return 'cracked';
    if (roll < chance.cracked + chance.charged && this.alive.filter(s => s.modifier === 'charged').length < C.modifiers.chargedCap) return 'charged';
    return 'normal';
  }
  createPatternPlan(forceCluster = false) {
    const special=this.contentMode==='M5_M6_ON'&&specialPlan(this,forceCluster);if(special)return special;
    const live = this.alive, P = C.patterns, points = [], between = (a, b) => a + this.rng() * (b - a);
    let kind = 'scattered', anchor = null;
    if (live.length && (forceCluster || this.rng() < this.experiment.clusterChance)) {
      const roll = this.rng() * (P.clusterWeight + P.arcWeight + P.bridgeWeight);
      kind = roll < P.clusterWeight ? 'burst_cluster' : roll < P.clusterWeight + P.arcWeight ? 'arc' : 'bridge';
      const stars = live.filter(s => s.type === 'star'); anchor = stars.length && this.rng() < P.starAnchorChance ? stars[Math.floor(this.rng() * stars.length)] : live[Math.floor(this.rng() * live.length)];
    }
    const tier = tierFor(this.totalDestroyed, this.tiers), angle = this.rng() * Math.PI * 2;
    if (kind === 'burst_cluster') {
      const count = Math.min(5, 3 + Math.floor(this.rng() * 3) + (tier >= 3 ? 1 : 0));
      for (let i = 0; i < count; i++) { const a = angle + i * Math.PI * 2 / count, r = between(P.clusterMin, P.clusterMax); points.push({ x: anchor.x + Math.cos(a) * r, y: anchor.y + Math.sin(a) * r }); }
    } else if (kind === 'arc') {
      const count = Math.min(6, 4 + Math.floor(this.rng() * 3) + (tier >= 3 ? 1 : 0)), step = Math.PI / (count - 1);
      const r = Math.min(C.clusterMax, between(P.arcSpacingMin, P.arcSpacingMax) / (2 * Math.sin(step / 2)));
      for (let i = 0; i < count; i++) { const a = angle + i * step; points.push({ x: anchor.x + Math.cos(a) * r, y: anchor.y + Math.sin(a) * r }); }
    } else if (kind === 'bridge') {
      const others = live.filter(s => Math.hypot(s.x - anchor.x, s.y - anchor.y) > P.neighbourMax * 1.5 && Math.hypot(s.x - anchor.x, s.y - anchor.y) < P.neighbourMax * 3);
      const other = others.length ? others[Math.floor(this.rng() * others.length)] : { x: anchor.x + Math.cos(angle) * P.neighbourMax * 2, y: anchor.y + Math.sin(angle) * P.neighbourMax * 2 };
      const a = Math.atan2(other.y - anchor.y, other.x - anchor.x), side = P.neighbourMin;
      for (const origin of [anchor, other]) points.push({ x: origin.x - Math.sin(a) * side, y: origin.y + Math.cos(a) * side });
      for (const t of [1 / 3, 2 / 3]) points.push({ x: anchor.x + (other.x - anchor.x) * t, y: anchor.y + (other.y - anchor.y) * t });
      points.push({ x: other.x + Math.sin(a) * side, y: other.y - Math.cos(a) * side });
    } else {
      for (let i = 0, count = 1 + Math.floor(this.rng() * 3); i < count; i++) points.push({ x: between(C.arena.left + C.variety.radiusMax, C.arena.right - C.variety.radiusMax), y: between(C.arena.top + C.variety.radiusMax, C.arena.bottom - C.variety.radiusMax) });
    }
    return { kind, anchor, points, index: 0 };
  }
  newChain() { const id = this.nextChain++; this.chains.set(id, { kills: 0, events: 0, photons: 0, startedAt: this.simulationTime, lastKillAt: this.simulationTime, cascadeKills: 0, milestonesEmitted: new Set() }); return id; }
  trackCombo(chainId, position) {
    if (this.state !== 'PLAYING' || this.remaining <= 0) return;
    const chain = this.chains.get(chainId); if (!chain) return;
    let highest = null;
    for (const threshold of [5, 10, 20]) if (chain.kills >= threshold && !chain.milestonesEmitted.has(threshold)) {
      chain.milestonesEmitted.add(threshold); this.comboMilestones[threshold]++;
      this.binAt().comboMilestones[threshold]++; this.binAt5().comboMilestones[threshold]++;
      if (threshold === 5) this.timeToFirstChain5 ??= this.simulationTime;
      highest = { chainId, threshold, kills: chain.kills, at: this.simulationTime, x: position.x, y: position.y };
      if (this.comboEvents.length < 1024) this.comboEvents.push(highest);
    }
    if (highest && this.options.comboFeedback && this.combo.promote(highest)) this.onEvent?.(`combo${highest.threshold}`);
    if (this.options.comboFeedback && this.combo.visible(this.simulationTime)?.chainId === chainId) this.combo.main.kills = chain.kills;
    if (this.options.comboFeedback && chain.kills >= 2 && chain.kills <= 4 && this.visuals.filter(v => v.kind === 'popup').length < C.combo.popupCap)
      this.visual({ kind: 'popup', x: position.x, y: position.y, text: `×${chain.kills} CHAIN`, color: '#b8e9df', life: .35 });
  }
  attack(x, y) {
    if (this.state !== 'PLAYING' || this.paused || this.remaining <= 0) return false;
    const chainId = this.newChain(); let target = null, nearest = Infinity;
    for (const s of this.alive) { const d = Math.hypot(x - s.x, y - s.y); if (s.grace <= 1e-9 && d <= s.radius && d < nearest) { target = s; nearest = d; } }
    this.clickVFX.add(x, y, Boolean(target), this.elapsed);
    if (!target) { this.missedClicks++; return false; }
    this.successfulClicks++;
    if (target.id === 1 && !Number.isFinite(target.motion.startAt)) for (const guide of this.alive.filter(s => s.id <= 4)) guide.motion.startAt = this.elapsed + C.motion.tutorialHold;
    const m = this.modifierStats[target.modifier]; m.directHitCount++; this.typeStats[target.type].directHitCount++;
    this.binMetric('typeStats', target.type, 'directHitCount'); this.binMetric('modifierStats', target.modifier, 'directHitCount');
    if (!target.clickedFirst) { target.clickedFirst = true; m.clickedFirstCount++; this.binMetric('modifierStats', target.modifier, 'clickedFirstCount'); }
    target.recoil = C.visual.recoilLife; target.recoilUntil = this.elapsed + C.visual.recoilLife;
    this.debris(target, 2 + Math.floor(this.vfxRng() * 3), C.visual.clickDebrisLife, x, y);
    const cause = { chainId, source: 'direct', depth: 0, angle: 0 };
    const siphon=siphonDamage(this);if(siphon)cause.relicId='hexSiphon';this.enqueue(target, this.stats.directDamage+siphon, cause); this.flush();
    if (this.stats.impactEnabled) { this.area(target, this.stats.impactRadius, this.stats.impactDamage, { ...cause, source: 'impact', depth: 1 }, '#ffffff', target.id); this.flush(); }
    this.onEvent?.('click'); return true;
  }
  scheduleEvent(event) {
    if (this.state !== 'PLAYING' || this.remaining <= 0) return false;
    if (this.queue.length >= C.caps.scheduled) { this.cap('scheduled', event); return false; }
    event.eventId = this.nextEvent++; event.simulationTime = event.scheduledTime;
    const compare = (a, b) => a.scheduledTime - b.scheduledTime || a.priority - b.priority || a.eventId - b.eventId;
    let lo = 0, hi = this.queue.length;
    while (lo < hi) { const mid = (lo + hi) >>> 1; if (compare(this.queue[mid], event) <= 0) lo = mid + 1; else hi = mid; }
    this.queue.splice(lo, 0, event); this.peakScheduled = Math.max(this.peakScheduled, this.queue.length); return true;
  }
  scheduleEffect(action, cause, delay = C.propagation.delay) {
    if (cause.depth > C.caps.depth) { this.cap('depth', cause); return; }
    const extra=cause.triggeredBySkill||cause.relicId||['reactor','ancient','ward-release'].includes(cause.source),chain=this.chains.get(cause.chainId);
    if(extra&&chain?.events>=C.caps.events){this.cap('chainEvents',cause);return false;}
    const scheduled=this.scheduleEvent({ kind: 'effect', action, chainId: cause.chainId, sourceKind: cause.source, triggeredBySkill:cause.triggeredBySkill,chargedOrigin: cause.chargedOrigin, generation: cause.depth, scheduledTime: this.simulationTime + delay, priority: 1 });
    if(extra&&scheduled&&chain)chain.events++;return scheduled;
  }
  skillEffect(skill,action,cause,delay=C.propagation.delay){
    const tagged={...cause,triggeredBySkill:skill};const done=this.scheduleEffect(action,tagged,delay);
    if(done){this.skillActivations[skill]=(this.skillActivations[skill]||0)+1;this.skillEvents.push({at:this.simulationTime,scheduledAt:this.simulationTime+delay,damageSource:cause.source,chainId:cause.chainId,generationDepth:cause.depth,triggeredBySkill:skill});}return done;
  }
  enqueue(target, damage, cause, scheduledTime = this.simulationTime, wave = null) {
    if (this.state !== 'PLAYING' || target.destroyed || scheduledTime + 1e-9 < (target.vulnerableAt || 0) || this.remaining <= 0) return;
    const chain = this.chains.get(cause.chainId);
    if (!chain) return;
    if (cause.depth > C.caps.depth) { this.cap('depth', cause); return; }
    if (chain.events >= C.caps.events) { this.cap('chainEvents', cause); return; }
    if (this.scheduleEvent({ kind: 'damage', target, damage, cause, wave, chainId: cause.chainId, sourceKind: cause.source, generation: cause.depth, scheduledTime, priority: 0 })) chain.events++;
  }
  flush() {
    // One stable, game-time queue for damage, delayed native effects and splits.
    while (this.queue.length && this.queue[0].scheduledTime <= this.elapsed + 1e-9 && this.state === 'PLAYING') {
      const event = this.queue.shift(); this.processingTime = event.scheduledTime;
      if (event.kind === 'effect') { event.action(); continue; }
      const { target: s, damage, cause, wave } = event;
      if (wave) { if (wave.hitIds.has(s.id)) { this.physicsChecks.duplicateWaveRejected++; continue; } wave.hitIds.add(s.id); }
      if (s.destroyed || event.scheduledTime + 1e-9 < (s.vulnerableAt || 0) || this.remaining <= 0) continue;
      if (wave?.dynamic) { const gap = this.waveGap(wave, s, this.simulationTime); this.physicsChecks.waveContactsChecked++; this.physicsChecks.maxWaveContactError = Math.max(this.physicsChecks.maxWaveContactError, Math.max(0, gap)); if (this.simulationTime > wave.bornAt + 1e-9 && gap < -.002) this.physicsChecks.lateWaveContacts++; }
      if (wave) this.knockback(s, wave);
      if(cause.wardRelease){if(s.wardSourceId===cause.wardRelease)releaseWard(this,s,cause.wardOrigin,'wave');continue;}
      if(this.contentMode==='M5_M6_ON'&&wave)skillWaveContact(this,s,cause,wave);
      const previous=s.hp,actual = Math.min(s.hp, this.contentMode==='M5_M6_ON'?shieldDamage(this,s,damage,cause):damage), chain = this.chains.get(cause.chainId);
      s.hp -= actual; this.runEarned += actual; this.rawBase += actual; this.rawHP += actual; chain.photons += actual; s.flash = C.visual.flash; s.flashUntil = this.simulationTime + C.visual.flash;
      this.binAt().earnedPhoton += actual; this.binAt5().earnedPhoton += actual;
      if (cause.chargedOrigin) { this.chargedContribution.damage += actual; this.chargedContribution.photons += actual; }
      if (this.options.damageVFX && cause.source !== 'direct') this.debris(s, 3);
      if(this.contentMode==='M5_M6_ON')healthStages(this,s,previous,cause);
      if (s.hp > 0) continue;
      const bonus = Math.ceil(s.bonus * this.stats.bonusMultiplier * (s.modifier === 'charged' ? C.modifiers.chargedBonus : 1));
      s.destroyed = true; this.totalDestroyed++; this.runEarned += bonus; this.rawBase += bonus; this.rawNativeBonus += bonus; chain.photons += bonus; chain.kills++; chain.lastKillAt = this.simulationTime;
      killMetrics(this,s,cause,wave);relicKill(this,s,cause);
      dropOre(this,s,cause);
      if(s.type==='hex')hexDeath(this,s,cause);delete s.wardSourceId;
      ancientDeath(this,s,cause);
      if(this.contentMode==='M5_M6_ON')skillKill(this,s,cause);
      const bin = this.binAt(); bin.earnedPhoton += bonus; bin.totalDestroyed++; bin.bestChain = Math.max(bin.bestChain, chain.kills); bin[cause.source === 'direct' ? 'directKills' : 'cascadeKills']++;
      if (cause.source === 'direct') this.directKills++; else { this.cascadeKills++; chain.cascadeKills++; this.firstCascadeTime ??= this.simulationTime; }
      const b5 = this.binAt5(); b5.earnedPhoton += bonus; b5.totalDestroyed++; b5.bestChain = Math.max(b5.bestChain, chain.kills); b5[cause.source === 'direct' ? 'directKills' : 'cascadeKills']++;
      const killKey = cause.source === 'direct' ? 'directKillCount' : 'cascadeKillCount';
      this.modifierStats[s.modifier][killKey]++; this.typeStats[s.type][killKey]++;
      this.binMetric('typeStats', s.type, killKey); this.binMetric('modifierStats', s.modifier, killKey);
      if (cause.chargedOrigin) { this.chargedContribution.kills++; this.chargedContribution.photons += bonus; }
      this.currentChain = chain.kills; this.bestChain = Math.max(this.bestChain, chain.kills);
      this.trackCombo(cause.chainId, s);
      this.visual({ kind: 'death', x: s.x, y: s.y, shape: { ...s }, color: C.shapes[s.type].color, life: C.visual.deathLife });
      this.debris(s, s.type === 'star' ? C.visual.starParticles : 5);
      this.onEvent?.(s.type);
      this.unlock(); const child = { ...cause, depth: cause.depth + 1, chargedOrigin: Boolean(cause.chargedOrigin) || s.modifier === 'charged' }, inheritance = this.options.inheritance;
      this.scheduleEffect(() => {
        this.emitNative(s, child);
        if (inheritance && s.type === 'square' && cause.source === 'triangle') this.emitShard(s.x, s.y, cause.angle, 'inherited', cause.chainId, child.depth, true, null, child.chargedOrigin);
        if (inheritance && s.type === 'triangle' && cause.source === 'square') this.area(s, C.inheritance.radius, this.stats.inheritanceDamage, { ...child, source: 'inherited' }, '#ffffff');
      }, child);
    }
    this.processingTime = null;
  }
  unlock() {
    const tier = tierFor(this.totalDestroyed, this.tiers);
    for (let i = this.highestTier + 1; i <= tier; i++) {
      this.unlockTimes[this.tiers[i].threshold] = this.simulationTime;
      if (i === 1) { this.pending.push('pentagon'); this.unlockTimes.pentagon = this.elapsed; }
      if (i === 2) { this.pending.push('star'); this.unlockTimes.star = this.elapsed; }
    }
    this.highestTier = Math.max(this.highestTier, tier);
  }
  rewardExtra(amount, kind, shape, cause) {
    if(!amount)return;
    this.runEarned+=amount;this[kind==='ore'?'rawOreBonus':'rawSkillBonus']+=amount;this.binAt().earnedPhoton+=amount;this.binAt5().earnedPhoton+=amount;
    const chain=this.chains.get(cause.chainId);if(chain)chain.photons+=amount;
    this.rewardLog.push({at:this.simulationTime,shapeId:shape.id,chainId:cause.chainId,damageSource:cause.source,oreGrade:shape.oreGrade,kind,amount});
  }
  emitShard(x, y, angle, source, chainId, depth, small = false, exclude = null, chargedOrigin = false) {
    if (this.state !== 'PLAYING' || this.remaining <= 0) return;
    if (depth > C.caps.depth) { this.cap('depth', { source, chargedOrigin }); return; }
    if (this.shards.filter(s => !s.dead).length >= C.caps.shards) { this.cap('shards', { source, chargedOrigin }); return; }
    const shard = makeShard(this, x, y, angle, source, chainId, depth, small, exclude); shard.chargedOrigin = chargedOrigin; this.shards.push(shard); this.shardsEmitted++; this.peakShards = Math.max(this.peakShards, this.shards.filter(s => !s.dead).length); return shard;
  }
  emitNative(s, cause) {
    const charged = s.modifier === 'charged', origin = charged || Boolean(cause.chargedOrigin);
    const triangleCount = this.stats.triangleCount + Number(charged);
    if (s.type === 'triangle') for (let i = 0; i < triangleCount; i++) { const a = i < 3 ? i * Math.PI * 2 / 3 : Math.PI / 3 + (i - 3) * Math.PI * 2 / 3; this.emitMain(s,s.angle+a,cause,origin); }
    if (s.type === 'pentagon') {
      const count = this.stats.pentagonCount;
      const angles = Array.from({ length: count }, (_, i) => -C.shapes.pentagon.splitAngle + 2 * C.shapes.pentagon.splitAngle * i / (count - 1));
      if (charged) angles.push((angles[0] + angles[1]) / 2);
      for (const a of angles) this.emitMain(s,s.angle+a,cause,origin);
    }
    if (s.type === 'square' || s.type === 'star') {let radius=this.stats[`${s.type}Radius`] * (charged ? C.modifiers.chargedRadius : 1),damage=this.stats[`${s.type}Damage`],relicId;
      if(this.relicLoadout.includes('waveCondenser')){const r=C.relics.waveCondenser;radius=Math.round(radius*r.radiusMultiplier);damage+=r.damage;relicId='waveCondenser';}
      const wave=this.area(s,radius,damage,{...cause,source:s.type,chargedOrigin:origin,relicId},C.shapes[s.type].color);if(wave&&relicId)this.relicActivations[relicId]=(this.relicActivations[relicId]||0)+1;
    }
  }
  emitMain(s,angle,cause,origin){
    const shard=this.emitShard(s.x,s.y,angle,s.type,cause.chainId,cause.depth,false,null,origin);
    if(shard&&this.contentMode==='M5_M6_ON'&&this.levels.kineticReach&&this.options.motionEnabled&&s.motion?.rotationRate&&Number.isFinite(s.motion.startAt)&&s.motion.startAt<=this.simulationTime){shard.range+=30*this.levels.kineticReach;shard.life=shard.range/C.shard.speed+C.shard.lifePadding;this.skillActivations.kineticReach=(this.skillActivations.kineticReach||0)+1;}
    if(shard&&this.relicLoadout.includes('ricochetCoil')){const r=C.relics.ricochetCoil;shard.range=Math.max(r.minRange,shard.range-r.rangePenalty);shard.life=shard.range/C.shard.speed+C.shard.lifePadding;shard.relicId='ricochetCoil';this.relicActivations.ricochetCoil=(this.relicActivations.ricochetCoil||0)+1;}return shard;
  }
  emitAux(origin,angle,cause,source,damage,range){
    const shard=this.emitShard(origin.x,origin.y,angle,source,cause.chainId,cause.depth,true,origin.id);
    if(shard){Object.assign(shard,{damage,range,life:range/C.shard.speed+C.shard.lifePadding,triggeredBySkill:cause.triggeredBySkill||null,originShapeId:cause.originShapeId,damageSource:source,generationDepth:cause.depth});}return shard;
  }
  area(s, radius, damage, cause, color, exclude = null) {
    if (this.state !== 'PLAYING' || this.remaining <= 0) return;
    if (cause.depth > C.caps.depth) { this.cap('depth', cause); return; }
    if (this.options.sequentialPropagation) {
      if (this.waves.length >= C.caps.waves) { this.cap('waves', cause); return; }
      const wave = { id: this.nextWave++, x: s.x, y: s.y, radius: 0, maxRadius: radius, damage, speed: cause.source === 'star' ? C.propagation.starSpeed : C.propagation.squareSpeed, bornAt: this.simulationTime, age: 0, color, cause, chainId: cause.chainId, sourceKind: cause.source, generation: cause.depth, exclude, dynamic: this.options.motionEnabled, hitIds: new Set(), registeredIds: new Set() };
      this.waves.push(wave); this.peakWaves = Math.max(this.peakWaves, this.waves.length); for (const target of this.alive) this.registerWaveTarget(wave, target); return wave;
    }
    this.visual({ kind: 'ring', x: s.x, y: s.y, radius, color, life: C.visual.ringLife });
    for (const other of this.alive) if (other.id !== exclude && Math.hypot(other.x - s.x, other.y - s.y) - other.radius <= radius) {
      this.enqueue(other, damage, cause);
      this.knockback(other, s);
    }
  }
  registerWaveTarget(wave, target) {
    if (wave.dynamic) return;
    if (target.destroyed || target.id === wave.exclude || wave.registeredIds.has(target.id)) return;
    const contact = Math.max(0, Math.hypot(target.x - wave.x, target.y - wave.y) - target.radius);
    if (contact > wave.maxRadius || wave.bornAt + contact / wave.speed < this.simulationTime - 1e-9) return;
    wave.registeredIds.add(target.id);
    this.enqueue(target, wave.damage, wave.cause, wave.bornAt + contact / wave.speed, wave);
  }
  knockback(target, origin) { const a = Math.atan2(target.y - origin.y, target.x - origin.x); target.knockX = Math.cos(a) * C.visual.knockback; target.knockY = Math.sin(a) * C.visual.knockback; target.knockTime = C.visual.knockbackLife; }
  moveShard(s, dt) {
    const budget = Math.max(0, Math.min(C.shard.speed * dt, s.range - s.distance, C.shard.speed * (s.life - s.age)));
    s.prevX = s.x; s.prevY = s.y;
    const path = traceShard(this, s, budget);
    if(!s.small&&path.wallBounces)count(this,'mainShardWallBounces',path.wallBounces,{eventType:'shardWallBounce',chainId:s.chainId,sourceType:s.source,relicId:s.relicId});
    for (const key of ['x', 'y', 'vx', 'vy', 'angle', 'bounces']) s[key] = path[key];
    s.distance += path.distance; s.age += dt;
    if (path.hit) {
      s.dead = true; this.projectileHits++; const hitAt = this.elapsed + path.distance / C.shard.speed;
      const pos = this.positionAt(path.hit, hitAt); this.physicsChecks.projectileContactsChecked++; this.physicsChecks.maxProjectileContactError = Math.max(this.physicsChecks.maxProjectileContactError, Math.max(0, Math.hypot(s.x - pos.x, s.y - pos.y) - path.hit.radius - C.shard.radius));
      this.enqueue(path.hit, s.damage, s, hitAt);
      if (s.split) this.scheduleEvent({ kind: 'effect', chainId: s.chainId, sourceKind: s.source, generation: s.depth + 1, scheduledTime: hitAt, priority: 1, action: () => {
        for (const direction of [-1, 1]) this.emitShard(s.x, s.y, s.angle + direction * C.smallShard.splitAngle, 'pentagon', s.chainId, s.depth + 1, true, path.hit.id, s.chargedOrigin);
      } });
    }
    if (path.wallDead || s.distance >= s.range - 1e-7 || s.age >= s.life - 1e-7) s.dead = true;
  }
  update(dt) {
    if (this.state !== 'PLAYING' || this.paused || dt <= 0) return;
    // The endpoint frame never processes attacks, spawns or damage at/after zero.
    if (dt >= this.remaining - 1e-9) {
      // Legacy keeps its historical endpoint behavior for exact comparisons.
      // New runs process events strictly before the deadline, then close once.
      if (this.ruleset !== 'legacy_v08' && !this.suppressEndpointPhysics && this.remaining > 1e-8) this.update(this.remaining - 1e-8);
      this.sampleDensity(this.elapsed, this.remaining);
      this.elapsed = this.duration; this.remaining = 0; this.state = 'RESULT'; this.held = false;
      cleanupWards(this,true);
      if (this.ruleset !== 'legacy_v08') ensureRefinery(this);
      for (const chain of this.chains.values()) this.finishChain(chain);
      this.queue.length = 0; this.shards.length = 0; this.waves.length = 0; this.visuals.length = 0; this.particles.length = 0; this.clickVFX.clear(); this.chains.clear(); this.currentChain = 0;
      return;
    }
    this.syncMotion();
    const end = this.elapsed + dt;
    let iterations = 0;
    // Split a fixed tick at every scheduled event and earliest swept collision.
    // No projectile can absorb a target that an earlier event already destroyed.
    while (this.elapsed < end - 1e-9) {
      this.flush();
      if (++iterations > C.caps.tickIterations) { this.cap('tickIterations'); this.sampleDensity(this.elapsed, end - this.elapsed); this.elapsed = end; break; }
      let slice = Math.min(end - this.elapsed, this.queue.length ? Math.max(0, this.queue[0].scheduledTime - this.elapsed) : Infinity);
      for (const shard of this.shards) if (!shard.dead) {
        const budget = Math.max(0, Math.min(C.shard.speed * slice, shard.range - shard.distance, C.shard.speed * (shard.life - shard.age)));
        const path = traceShard(this, shard, budget); if (path.hit) slice = Math.min(slice, path.distance / C.shard.speed);
      }
      const contacts = this.dynamicWaveContacts(this.elapsed, this.elapsed + slice);
      for (const hit of contacts) slice = Math.min(slice, Math.max(0, hit.time - this.elapsed));
      this.sampleDensity(this.elapsed, slice);
      for (const shard of [...this.shards]) if (!shard.dead) this.moveShard(shard, slice);
      for (const hit of contacts) if (hit.time <= this.elapsed + slice + 1e-9) { hit.wave.registeredIds.add(hit.target.id); this.waveContacts++; this.enqueue(hit.target, hit.wave.damage, hit.wave.cause, hit.time, hit.wave); }
      this.elapsed += slice; this.updateMotion(this.elapsed); this.flush(); this.shards = this.shards.filter(s => !s.dead);
    }
    this.elapsed = end; this.updateMotion(this.elapsed); this.flush(); this.remaining = this.duration - this.elapsed;
    cleanupWards(this);
    for (const s of this.shapes) { s.grace = Math.max(0, s.vulnerableAt - this.elapsed); s.flash = Math.max(0, (s.flashUntil || 0) - this.elapsed); s.recoil = Math.max(0, (s.recoilUntil || 0) - this.elapsed); s.knockTime = Math.max(0, s.knockTime - dt); }
    this.attackClock -= dt;
    if (this.held && this.pointer && this.attackClock <= 1e-9) { this.attack(this.pointer.x, this.pointer.y); this.attackClock += this.stats.attackInterval; }
    this.shards = this.shards.filter(s => !s.dead); this.shapes = this.shapes.filter(s => !s.destroyed);
    for (const wave of this.waves) { wave.age = Math.max(0, this.elapsed - wave.bornAt); wave.radius = Math.min(wave.maxRadius, wave.age * wave.speed); }
    this.waves = this.waves.filter(w => w.age < w.maxRadius / w.speed + C.propagation.tailLife);
    this.clickVFX.update(dt, this.elapsed);
    this.spawnClock += dt;
    if (this.spawnClock >= this.experiment.spawnInterval - 1e-9) {
      // Epsilon-triggered clocks may be just below the interval: modulo would
      // leave almost a full interval and accidentally spawn again next tick.
      this.spawnClock = Math.max(0, this.spawnClock - this.experiment.spawnInterval);
      for (let i = 0; i < this.experiment.spawnBatch && this.alive.length < this.target; i++) {
        const shape = this.spawn(this.pending[0] || null); if (!shape) break; if (this.pending.length) this.pending.shift();
      }
    }
    for (const p of [...this.visuals, ...this.particles]) { const age = Math.max(0, this.elapsed - p.bornAt), delta = age - p.age; p.age = age; if (p.vx !== undefined) { p.x += p.vx * delta; p.y += p.vy * delta; } }
    this.visuals = this.visuals.filter(p => p.age < p.life); this.particles = this.particles.filter(p => p.age < p.life);
    // Discard chains with no live effect. IDs remain monotonically increasing.
    const active = new Set([...this.shards, ...this.waves, ...this.queue].map(s => s.chainId)); for (const [id, chain] of this.chains) if (!active.has(id)) { this.finishChain(chain); this.chains.delete(id); }
    this.currentChain = Math.max(0, ...Array.from(this.chains.values(), chain => chain.kills));
  }
  skipAhead(seconds) {
    if (this.state !== 'PLAYING' || this.paused || seconds <= 0) return;
    if (seconds >= this.remaining) { this.skippedSeconds += this.remaining; this.skippedEvents += this.queue.filter(e => e.scheduledTime < this.duration).length; this.suppressEndpointPhysics = true; this.update(seconds); this.suppressEndpointPhysics = false; return; }
    // A visible stall consumes run time without replaying invisible past hits.
    // Future wave arrivals remain valid; expired births and arrivals are dropped.
    const skippedFrom = this.elapsed;
    this.sampleDensity(this.elapsed, seconds); this.elapsed += seconds; this.remaining = this.duration - this.elapsed; this.skippedSeconds += seconds;
    this.syncMotion();
    for (const wave of this.waves.filter(w => w.dynamic)) for (const target of this.alive) if (target.id !== wave.exclude && !wave.registeredIds.has(target.id) && this.waveGap(wave, target, this.elapsed) < 0) {
      wave.registeredIds.add(target.id);
      const contact = firstContact(t => this.waveGap(wave, target, t), skippedFrom, Math.min(this.elapsed, wave.bornAt + wave.maxRadius / wave.speed), wave.speed + C.motion.maxSpeed);
      if (contact !== null && contact >= (target.vulnerableAt || 0)) this.skippedEvents++;
    }
    this.updateMotion(this.elapsed);
    cleanupWards(this);
    const pending = this.queue.filter(e => e.scheduledTime > this.elapsed);
    this.skippedEvents += this.queue.length - pending.length; this.queue = pending;
    for (const s of this.shards) {
      const budget = Math.max(0, Math.min(C.shard.speed * seconds, s.range - s.distance, C.shard.speed * (s.life - s.age)));
      const path = traceShard({ alive: [], options: this.options, elapsed: this.elapsed }, s, budget);
      for (const key of ['x', 'y', 'vx', 'vy', 'angle', 'bounces']) s[key] = path[key];
      s.distance += path.distance; s.age += seconds; s.dead = path.wallDead || s.age >= s.life || s.distance >= s.range;
    }
    this.shards = this.shards.filter(s => !s.dead);
    for (const w of this.waves) { w.age = this.elapsed - w.bornAt; w.radius = Math.min(w.maxRadius, w.age * w.speed); }
    this.waves = this.waves.filter(w => w.age < w.maxRadius / w.speed + C.propagation.tailLife);
    for (const s of this.shapes) { s.grace = Math.max(0, s.vulnerableAt - this.elapsed); s.flash = Math.max(0, (s.flashUntil || 0) - this.elapsed); s.recoil = Math.max(0, (s.recoilUntil || 0) - this.elapsed); s.knockTime = Math.max(0, s.knockTime - seconds); }
    for (const p of [...this.visuals, ...this.particles]) { const age = this.elapsed - p.bornAt, delta = age - p.age; p.age = age; if (p.vx !== undefined) { p.x += p.vx * delta; p.y += p.vy * delta; } }
    this.visuals = this.visuals.filter(v => v.age < v.life); this.particles = this.particles.filter(p => p.age < p.life); this.clickVFX.update(0, this.elapsed);
  }
  visual(v) { if (this.visuals.length < C.caps.visuals) this.visuals.push({ ...v, age: 0, bornAt: this.simulationTime }); }
  binAt(time = this.simulationTime) { return this.bins[Math.max(0, Math.min(this.bins.length - 1, Math.floor(time / 10)))]; }
  binAt5(time = this.simulationTime) { return this.bins5[Math.max(0, Math.min(this.bins5.length - 1, Math.floor(time / 5)))]; }
  binMetric(group, key, field) { for (const bin of [this.binAt(), this.binAt5()]) { const values = bin[group]; values[key] ||= {}; values[key][field] = (values[key][field] || 0) + 1; } }
  cap(kind, cause = {}) {
    this.safetyCapsHit++; this.capCounts[kind] = (this.capCounts[kind] || 0) + 1;
    const source = cause.source || cause.sourceKind || 'scheduler'; this.capSources[source] = (this.capSources[source] || 0) + 1;
    this.chargedCaps += Number(Boolean(cause.chargedOrigin || cause.cause?.chargedOrigin)); const bin = this.binAt(); bin.safetyCapsHit++; bin.caps[kind] = (bin.caps[kind] || 0) + 1; const b5 = this.binAt5(); b5.safetyCapsHit++; b5.caps[kind] = (b5.caps[kind] || 0) + 1;
  }
  sampleDensity(start, seconds) {
    if (seconds <= 0) return;
    const alive = this.alive.length, shards = this.shards.filter(s => !s.dead).length;
    if (!alive) { const prior = this.emptyEpisode; this.emptyEpisode += seconds; this.emptyArenaDuration += seconds; if (prior < .5 && this.emptyEpisode >= .5) this.emptyEpisodesOverHalfSecond++; this.maxEmptyEpisode = Math.max(this.maxEmptyEpisode, this.emptyEpisode); }
    else this.emptyEpisode = 0;
    const end = Math.min(this.duration, start + seconds);
    for (const size of [10, 5]) for (let at = start; at < end - 1e-9;) {
      const bin = size === 10 ? this.binAt(at) : this.binAt5(at), slice = Math.min(end, bin.end) - at;
      bin.sampledSeconds += slice; bin.samples++; bin.aliveIntegral += alive * slice; bin.targetIntegral += this.target * slice;
      if (!alive) bin.emptyArenaDuration += slice; at += slice;
    }
    for (let i = Math.floor(start); i < Math.ceil(end); i++) this.secondShardPeaks[i] = Math.max(this.secondShardPeaks[i] || 0, shards);
  }
  observeFrame(delta, stepMs) {
    if (this.state !== 'PLAYING' || this.paused) return;
    if (delta > 0 && this.frameSamples.length < 15000) this.frameSamples.push(Math.min(240, 1 / delta));
    if (Number.isFinite(stepMs) && this.stepSamples.length < 15000) this.stepSamples.push(stepMs);
  }
  finishChain(chain) {
    if (chain.cascadeKills > 0) { const ms = (chain.lastKillAt - chain.startedAt) * 1000; this.cascadeDurations.push(ms); const bin = this.binAt(chain.lastKillAt); bin.cascadeDurationTotalMs += ms; bin.completedCascadeChains++; const b5 = this.binAt5(chain.lastKillAt); b5.cascadeDurationTotalMs += ms; b5.completedCascadeChains++; }
  }
  debris(s, count, life = C.visual.debrisLife, x = s.x, y = s.y) {
    if (!this.options.damageVFX) return;
    for (let i = 0; i < count && this.particles.length < C.caps.particles; i++) { const a = this.vfxRng() * Math.PI * 2, speed = 40 + this.vfxRng() * 130; this.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, angle: a, color: C.shapes[s.type].color, age: 0, life, bornAt: this.simulationTime }); }
  }
  record() { const durations = [...this.cascadeDurations, ...Array.from(this.chains.values()).filter(c => c.cascadeKills).map(c => (c.lastKillAt - c.startedAt) * 1000)]; return { metaCounters:{...this.metaCounters},causalLog:[...this.causalLog],relicLoadout:[...this.relicLoadout],relicActivations:{...this.relicActivations},siphonUnused:this.siphonCharges.filter(t=>t>this.elapsed).length,siphonConsumed:this.siphonConsumed,metaVersion:C.meta.version,rawHP:this.rawHP,rawNativeBonus:this.rawNativeBonus,oreEnabled:this.oreEnabled,specialSpawns:{...this.specialSpawns},stageEvents:[...this.stageEvents],skillActivations:{...this.skillActivations},skillEvents:[...this.skillEvents],tetherPairs:this.tetherPairs,tetherAttempts:this.tetherAttempts, discoveryRankAtStart:this.discoveryRank,contentMode:this.contentMode,oreChances:oreChances(this.discoveryRank,this.levels.salvageScanner||0),oreSpawnCounts:{...this.oreSpawnCounts},oreKills:{...this.oreKills},pendingCatalyst:this.pendingCatalyst,rawBase:this.rawBase,rawOreBonus:this.rawOreBonus,rawSkillBonus:this.rawSkillBonus,rewardsBySource:[...this.rewardLog],welcomeConsumed:[...this.welcomeConsumed], motionMeasurements: { ...this.motionMeasurements }, refinerySkipped: this.refinerySkipped ?? null, resultWaitSeconds: this.resultWaitSeconds ?? null, physicsChecks: { ...this.physicsChecks }, ruleset: this.ruleset, tierPreset: this.tierPreset, runId: this.runId, runDurationConfigured: this.duration, runDurationActual: this.elapsed, rawEarned: this.runEarned, processedPhoton: this.refinery?.payout ?? null, photonPayout: this.refinery?.payout ?? null, refinery: this.refinery, motionEnabled: this.initialOptions.motionEnabled, motionProfiles: { ...this.motionProfiles }, missedClicks: this.missedClicks, movingHitAccuracy: this.successfulClicks / Math.max(1, this.successfulClicks + this.missedClicks), projectileHitRate: this.projectileHits / Math.max(1, this.shardsEmitted), projectileHits: this.projectileHits, waveContacts: this.waveContacts, maxMotionSpeed: this.maxMotionSpeed, bins5: this.ruleset === 'legacy_v08' ? [] : this.bins5.map(b => ({ ...structuredClone(b), rawEarned: b.earnedPhoton, averageAlive: b.sampledSeconds ? b.aliveIntegral / b.sampledSeconds : 0, averageTarget: b.sampledSeconds ? b.targetIntegral / b.sampledSeconds : 0 })), inputPolicy: this.inputPolicy, sandbox: this.sandbox, experiment: { ...this.experiment }, elapsed: this.elapsed, bins: this.bins.map(b => ({ ...structuredClone(b), averageAlive: b.sampledSeconds ? b.aliveIntegral / b.sampledSeconds : 0, averageTarget: b.sampledSeconds ? b.targetIntegral / b.sampledSeconds : 0, spawnSuccessRate: b.spawnAttempts ? b.spawnSuccesses / b.spawnAttempts : null, cascadeRatio: b.totalDestroyed ? b.cascadeKills / b.totalDestroyed : 0, avgCascadeDurationMs: b.completedCascadeChains ? b.cascadeDurationTotalMs / b.completedCascadeChains : 0 })), emptyArenaDuration: this.emptyArenaDuration, emptyEpisodesOverHalfSecond: this.emptyEpisodesOverHalfSecond, maxEmptyEpisode: this.maxEmptyEpisode, spawnAttempts: this.spawnAttempts, spawnSuccesses: this.spawnSuccesses, spawnFailures: this.spawnFailures, capCounts: { ...this.capCounts }, capSources: { ...this.capSources }, chargedCaps: this.chargedCaps, peakWaves: this.peakWaves, peakScheduled: this.peakScheduled, secondShardPeaks: [...this.secondShardPeaks], hpDistribution: { ...this.hpDistribution }, enhancedSpawnCount: this.enhancedSpawnCount, frameSampleCount: this.frameSamples.length, stepSampleCount: this.stepSamples.length, averageFPS: this.frameSamples.length ? this.frameSamples.reduce((a, b) => a + b, 0) / this.frameSamples.length : null, fixedStepP95ms: this.stepSamples.length ? [...this.stepSamples].sort((a,b) => a-b)[Math.floor(this.stepSamples.length * .95)] : null, modifiersEnabled: this.initialOptions.modifiers, modifierStats: Object.fromEntries(Object.entries(this.modifierStats).map(([k, v]) => [k, { ...v, selectionRate: v.spawnCount ? v.clickedFirstCount / v.spawnCount : 0 }])), typeStats: structuredClone(this.typeStats), chargedContribution: { ...this.chargedContribution }, modifierRngPolicy: "independent mechanical stream; one draw per spawn attempt including OFF and Enhanced", comboMilestones: { ...this.comboMilestones }, comboEvents: [...this.comboEvents], timeToFirstChain5: this.timeToFirstChain5, maxChain: this.bestChain, comboFeedbackEnabled: this.initialOptions.comboFeedback, durationSeconds: this.duration, seed: this.seed, levels: { ...this.levels }, totalDestroyed: this.totalDestroyed, directKills: this.directKills, cascadeKills: this.cascadeKills, bestChain: this.bestChain, photonsEarned: this.ruleset === 'legacy_v08' ? this.runEarned : this.refinery?.payout ?? 0, highestTier: this.highestTier, unlockTimes: { ...this.unlockTimes }, firstCascadeTime: this.firstCascadeTime, inheritanceEnabled: this.initialOptions.inheritance, ricochetEnabled: this.initialOptions.ricochet, sequentialPropagationEnabled: this.initialOptions.sequentialPropagation, visualVarietyEnabled: this.initialOptions.visualVariety, avgCascadeDurationMs: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0, variantCounts: { ...this.variantCounts }, patternCounts: { ...this.patternCounts }, optionChanges: [...this.optionChanges], safetyCapsHit: this.safetyCapsHit, skippedSeconds: this.skippedSeconds, skippedEvents: this.skippedEvents, peakShards: this.peakShards }; }
}
