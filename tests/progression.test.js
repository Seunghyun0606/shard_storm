import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG as C } from '../config.js';
import { LegacyGame as Game } from './helpers.js';
import { freshSave, loadSave, writeSave } from '../storage.js';
import { buyUpgrade, upgradeCost, settle, tierFor } from '../progression.js';
import { memoryStorage } from './helpers.js';
test('all tiers use cumulative thresholds and exact densities', () => {
  for (const [kills, tier] of [[0, 0], [11, 0], [12, 1], [29, 1], [30, 2], [55, 3], [90, 4], [140, 5]]) assert.equal(tierFor(kills, C.legacyTiers), tier);
});
test('PRD 13: settlement exactly once, no active-run rewards saved, upgrades persist', () => {
  const save = freshSave(), storage = memoryStorage(), g = new Game();
  assert.equal(settle(save, g), false);
  g.attack(480, 335); writeSave(storage, save); assert.equal(loadSave(storage).bank, 0);
  g.update(60); assert.equal(settle(save, g), true); assert.equal(settle(save, g), false); assert.equal(save.bank, g.runEarned);
  save.bank += 200; assert.equal(buyUpgrade(save, 'shardPower', 'RESULT'), true); writeSave(storage, save);
  const restored = loadSave(storage); assert.equal(restored.bank, save.bank); assert.equal(restored.levels.shardPower, 1); assert.equal(restored.lastRuns.length, 1);
});
test('PRD 15: purchase cost, level, MAX and insufficient funds/state restrictions', () => {
  const save = freshSave(); assert.equal(upgradeCost('crushPower', 0), 60); assert.equal(upgradeCost('crushPower', 1), 96);
  save.bank = 59; assert.equal(buyUpgrade(save, 'crushPower', 'RESULT'), false);
  save.bank = 60; assert.equal(buyUpgrade(save, 'crushPower', 'PLAYING'), false); assert.equal(buyUpgrade(save, 'crushPower', 'TITLE'), false);
  assert.equal(buyUpgrade(save, 'crushPower', 'RESULT'), true); assert.equal(save.bank, 0); assert.equal(save.levels.crushPower, 1);
  save.bank = 100000; for (let i = 0; i < 10; i++) buyUpgrade(save, 'crushPower', 'RESULT'); assert.equal(save.levels.crushPower, 5);
  const bank = save.bank; assert.equal(buyUpgrade(save, 'crushPower', 'RESULT'), false); assert.equal(save.bank, bank);
});
test('corrupt/out-of-range saves recover safely; unavailable storage never crashes', () => {
  for (const text of ['garbage', '{}', 'null', JSON.stringify({ ...freshSave(), bank: -1 }), JSON.stringify({ ...freshSave(), levels: { crushPower: 100 } })]) {
    const storage = memoryStorage(); storage.setItem(C.storageKey, text); assert.deepEqual(loadSave(storage), freshSave());
  }
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } }; assert.deepEqual(loadSave(blocked), freshSave()); assert.equal(writeSave(blocked, freshSave()), false);
});
test('run history is bounded to 20 and stores actual best records', () => {
  const save = freshSave(); for (let i = 0; i < 25; i++) { const g = new Game(); g.totalDestroyed = i; g.runEarned = i; g.update(60); settle(save, g); }
  assert.equal(save.lastRuns.length, 20); assert.equal(save.lastRuns[0].totalDestroyed, 5); assert.equal(save.bestStats.totalDestroyed, 24);
});
