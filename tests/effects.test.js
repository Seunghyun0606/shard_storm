import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../config.js';
import { emptyLevels } from '../progression.js';
import { segmentCircle } from '../entities.js';
import { emptyGame, advance, cause } from './helpers.js';

test('PRD 2: actual Triangle shard collision applies 3/4 damage with Shard Power 0/1', () => {
  for (const level of [0, 1]) {
    const g = emptyGame({ levels: { ...emptyLevels(), shardPower: level } });
    const t = g.addShape('triangle', 300, 300, 0, false, 0), s = g.addShape('square', 400, 300, 0, false, 0);
    g.attack(t.x, t.y); advance(g, .18);
    assert.equal(s.hp, level ? 0 : 1); assert.equal(s.destroyed, Boolean(level));
  }
});
test('PRD 3: Square shockwave damages three targets once, ring never reapplies damage', () => {
  const g = emptyGame(); const root = g.addShape('square', 480, 300, 0, false, 0); root.hp = 3;
  const targets = [[420, 300], [540, 300], [480, 360]].map(([x, y]) => g.addShape('pentagon', x, y, 0, false, 0));
  g.attack(480, 300); targets.forEach(s => assert.equal(s.hp, 5)); advance(g, .17); targets.forEach(s => assert.equal(s.hp, 3)); advance(g, .3); targets.forEach(s => assert.equal(s.hp, 3));
});
test('PRD 4: Pentagon impact produces exactly 2 small shards, excludes struck target, no resplit', () => {
  const g = emptyGame(); const target = g.addShape('star', 400, 300, 0, false, 0), id = g.newChain();
  const main = g.emitShard(300, 300, 0, 'pentagon', id, 1); g.update(.12);
  const children = g.shards.filter(s => s.small); assert.equal(children.length, 2); assert.equal(target.hp, 6);
  for (const s of children) { assert.equal(s.exclude, target.id); assert.equal(s.split, false); assert.equal(s.damage, 1); assert.equal(s.bounces, 0); }
  g.update(.12); assert.equal(target.hp, 6); assert.ok(g.shards.filter(s => s.small).length <= 2);
});
test('PRD 5: swept collision hits nearest target even across a large step', () => {
  assert.equal(segmentCircle(0, 0, 100, 0, 50, 0, 10), .4);
  const g = emptyGame(), near = g.addShape('square', 410, 300, 0, false, 0), far = g.addShape('square', 460, 300, 0, false, 0);
  const shard = g.emitShard(300, 300, 0, 'triangle', g.newChain(), 1); g.update(.25);
  assert.equal(near.hp, 1); assert.equal(far.hp, 4); assert.equal(shard.dead, true);
});
test('PRD 5: Ricochet ON/OFF, exact total path, dynamic lifetime and longer upgraded flight', () => {
  for (const ricochet of [false, true]) {
    const g = emptyGame({ options: { ricochet } }), s = g.emitShard(C.arena.right - 8, 200, 0, 'triangle', g.newChain(), 1);
    g.moveShard(s, .05);
    if (ricochet) { assert.ok(s.vx < 0); assert.equal(s.bounces, 0); assert.equal(s.distance, 35); assert.equal(s.dead, false); }
    else { assert.equal(s.distance, 8); assert.equal(s.dead, true); }
  }
  for (const level of [0, 1, 2, 3]) {
    const g = emptyGame({ levels: { ...emptyLevels(), shardRange: level } }), s = g.emitShard(100, 200, 0, 'triangle', g.newChain(), 1);
    for (let i = 0; i < 40 && !s.dead; i++) g.moveShard(s, C.step);
    assert.ok(Math.abs(s.distance - (180 + level * 50)) < 1e-7); assert.ok(s.age <= s.life + C.step);
    assert.equal(s.life, Math.min(.5, s.range / 700 + .02));
  }
});
test('corner reflection consumes one bounce and a reflected leg cannot tunnel', () => {
  const g = emptyGame(); const s = g.emitShard(C.arena.right - 10, C.arena.bottom - 10, Math.PI / 4, 'triangle', g.newChain(), 1); g.moveShard(s, .1);
  assert.ok(s.vx < 0 && s.vy < 0); assert.equal(s.bounces, 0); assert.equal(s.distance, 70);
});
test('PRD 8: Triangle native shard → Square grants one needle only when enabled', () => {
  for (const inheritance of [true, false]) {
    const g = emptyGame({ options: { inheritance } }), s = g.addShape('square', 300, 300, 0, false, 0);
    g.enqueue(s, 4, cause(g, 'triangle', 1, g.newChain(), .7)); g.flush(); g.update(.03);
    const inherited = g.shards.filter(s => s.source === 'inherited'); assert.equal(inherited.length, inheritance ? 1 : 0);
    if (inheritance) { assert.equal(inherited[0].angle, .7); assert.equal(inherited[0].damage, 1); }
  }
});
test('PRD 8: native Square → Triangle inheritance; auxiliary kill emits native effects but no re-inheritance', () => {
  const g = emptyGame(), tri = g.addShape('triangle', 400, 300, 0, false, 0);
  const square = g.addShape('square', 430, 330, 0, false, 0); square.hp = 1;
  g.enqueue(tri, 3, cause(g, 'square')); g.flush(); g.update(.1);
  assert.ok(tri.destroyed && square.destroyed);
  assert.equal(g.waves.length, 2); // One inherited, one Square native.
  assert.equal(g.shards.filter(s => s.source === 'inherited').length, 0);
  assert.equal(g.shards.filter(s => s.source === 'triangle').length, 3);
});
test('Star explosion and Chain Amplifier have distinct exact radius/damage', () => {
  const g = emptyGame({ levels: { ...emptyLevels(), chainAmplifier: 1 } });
  const star = g.addShape('star', 400, 300, 0, false, 0); star.hp = 3;
  const inside = g.addShape('star', 555, 300, 0, false, 0), outside = g.addShape('star', 590, 300, 0, false, 0);
  g.attack(400, 300); assert.equal(inside.hp, 9); advance(g, .24); assert.equal(inside.hp, 3); assert.equal(outside.hp, 9);
  assert.equal(g.waves.find(v => v.sourceKind === 'star').maxRadius, 160);
});
test('VFX toggles never change seeded simulation or rewards', () => {
  const records = [];
  for (const damageVFX of [true, false]) {
    const g = emptyGame({ options: { damageVFX } }); g.addShape('triangle', 300, 300, 0, false, 0); g.addShape('triangle', 400, 300, 0, false, 0);
    g.attack(300, 300); advance(g, 1); records.push({ ...g.record(), shapes: g.alive.map(s => [s.type, s.x, s.y, s.angle]) });
  }
  assert.deepEqual(records[0], records[1]);
});
