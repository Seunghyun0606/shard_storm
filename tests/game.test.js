import test from 'node:test';
import assert from 'node:assert/strict';
import { LegacyGame as Game } from './helpers.js';
import { CONFIG as C } from '../config.js';
import { logicalPoint } from '../entities.js';
import { emptyLevels } from '../progression.js';
import { emptyGame, advance, cause } from './helpers.js';

test('PRD 1: Square 4 → 1 → destroyed once; exact HP + bonus reward', () => {
  const g = emptyGame(); const s = g.addShape('square', 450, 300, 0, false, 0);
  g.attack(450, 300); assert.equal(s.hp, 1); assert.equal(g.runEarned, 3);
  g.attack(450, 300); assert.equal(s.destroyed, true); assert.equal(g.runEarned, 12); assert.equal(g.totalDestroyed, 1);
  g.attack(450, 300); assert.equal(g.runEarned, 12); assert.equal(g.totalDestroyed, 1);
});
test('PRD 9: guided first click reliably destroys at least 4 within 10 seconds, across seeds', () => {
  for (const seed of [1, 7, 31415, 9999, 0xffffffff]) {
    const g = new Game({ seed }); assert.equal(g.alive.length, 12);
    g.attack(C.tutorial.x, C.tutorial.y); advance(g, .19);
    assert.ok(g.totalDestroyed >= 4); assert.ok(g.bestChain >= 4); assert.ok(g.firstCascadeTime < 10);
  }
});
test('PRD 10: overkill only pays actual HP; basic totals and enhanced ceil bonus', () => {
  const g = emptyGame(); const s = g.addShape('triangle', 300, 300, 0, false, 0);
  g.enqueue(s, 100, cause(g)); g.flush(); assert.equal(g.runEarned, 8);
  const enhanced = g.addShape('triangle', 600, 300, 0, true, 0);
  g.enqueue(enhanced, 100, cause(g)); g.flush(); assert.equal(g.runEarned, 8 + 5 + 8);
});
test('PRD 6: a single area-chain crosses 12 and 30, queues Pentagon then Star', () => {
  const g = emptyGame();
  const root = g.addShape('star', 480, 300, 0, false, 0); root.hp = 3;
  for (let i = 0; i < 32; i++) { const a = i * Math.PI * 2 / 32; g.addShape('triangle', 480 + 100 * Math.cos(a), 300 + 100 * Math.sin(a), 0, false, 0); }
  g.attack(480, 300); assert.equal(g.totalDestroyed, 1); advance(g, .17); assert.equal(g.totalDestroyed, 33); assert.deepEqual(g.pending, ['pentagon', 'star']);
  advance(g, .2); assert.deepEqual(g.alive.slice(0, 2).map(s => s.type), ['pentagon', 'star']);
});
test('PRD 7: replenishment respects caps, spacing, bounds, and no Enhanced before 55', () => {
  const g = new Game({ seed: 83 });
  for (let i = 0; i < 10; i++) { for (const s of [...g.alive]) g.attack(s.x, s.y); advance(g, .6); }
  advance(g, 3);
  assert.equal(g.alive.length, g.target);
  for (const s of g.alive) {
    assert.ok(s.x >= C.arena.left + s.radius && s.x <= C.arena.right - s.radius);
    assert.ok(s.y >= C.arena.top + s.radius && s.y <= C.arena.bottom - s.radius);
    for (const t of g.alive) if (s !== t) assert.ok(Math.hypot(s.x - t.x, s.y - t.y) >= s.radius + t.radius + C.spawnGap - 1e-9);
  }
  const early = emptyGame(); early.totalDestroyed = 54;
  for (let i = 0; i < 150; i++) { early.shapes = []; assert.equal(early.spawn()?.enhanced, false); }
  early.totalDestroyed = 55; const enhanced = [];
  for (let i = 0; i < 100; i++) { early.shapes = []; enhanced.push(early.spawn().enhanced); }
  assert.ok(enhanced.some(Boolean));
});
test('spawn grace prevents immediate direct and area damage', () => {
  const g = emptyGame(); const s = g.addShape('triangle', 480, 300);
  assert.equal(g.attack(480, 300), false); g.enqueue(s, 100, cause(g)); g.flush(); assert.equal(s.hp, 3);
  advance(g, C.spawnGrace); g.attack(480, 300); assert.equal(s.destroyed, true);
});
test('PRD 11: exact run durations for Extra Time 0/1/2/6', () => {
  for (const [level, expected] of [[0, 60], [1, 65], [2, 70], [6, 90]]) assert.equal(new Game({ levels: { ...emptyLevels(), extraTime: level } }).remaining, expected);
});
test('PRD 12: no damage, spawn, attack, reward after zero; pause does not advance time', () => {
  const g = new Game({ duration: 1 }); g.paused = true; g.update(100); assert.equal(g.remaining, 1);
  g.paused = false; g.update(1); assert.equal(g.remaining, 0); assert.equal(g.state, 'RESULT');
  const count = g.shapes.length, earned = g.runEarned;
  g.attack(480, 335); g.spawn('star'); g.addShape('triangle', 400, 400); g.enqueue(g.shapes[0], 100, cause(g)); g.flush(); g.update(100);
  assert.equal(g.shapes.length, count); assert.equal(g.runEarned, earned); assert.equal(g.elapsed, 1);
  assert.equal(g.shards.length, 0); assert.equal(g.visuals.length, 0); assert.equal(g.particles.length, 0);
  g.emitShard(400, 300, 0, 'triangle', g.newChain(), 1); assert.equal(g.shards.length, 0);
});
test('fatal strike alone owns chain, direct and cascade stats sum correctly', () => {
  const g = emptyGame(); const s = g.addShape('square', 300, 300, 0, false, 0);
  const first = cause(g, 'triangle'), last = cause(g, 'square');
  g.enqueue(s, 3, first); g.enqueue(s, 2, last); g.enqueue(s, 100, first); g.flush();
  assert.equal(g.chains.get(first.chainId).kills, 0); assert.equal(g.chains.get(last.chainId).kills, 1);
  assert.equal(g.cascadeKills, 1); assert.equal(g.runEarned, 12);
});
test('PRD 16: logical pointer coordinates stay accurate after canvas resize', () => {
  for (const factor of [.5, 1, 1.3]) {
    const rect = { left: 87, top: 123, width: C.width * factor, height: C.height * factor };
    assert.deepEqual(logicalPoint(87 + 480 * factor, 123 + 335 * factor, rect), { x: 480, y: 335 });
  }
});
test('PRD 14: event/depth/shard limits block real work without fake rewards', () => {
  const g = emptyGame(); const s = g.addShape('star', 500, 300, 0, false, 0), c = cause(g);
  g.chains.get(c.chainId).events = C.caps.events; g.enqueue(s, 100, c); g.flush(); assert.equal(g.runEarned, 0);
  g.enqueue(s, 100, { ...cause(g), depth: C.caps.depth + 1 }); g.flush(); assert.equal(g.runEarned, 0);
  for (let i = 0; i < C.caps.shards + 1; i++) g.emitShard(100, 100, 0, 'triangle', c.chainId, 1);
  assert.equal(g.shards.length, C.caps.shards); assert.equal(g.safetyCapsHit, 3);
});
