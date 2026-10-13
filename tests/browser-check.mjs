// QA-only dependency: install Playwright outside the app, then set PLAYWRIGHT_MODULE.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--disable-background-timer-throttling'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
const errors = [], checks = [], runs = [];
page.on('pageerror', error => errors.push(error.message)); page.on('console', msg => { if (msg.type() === 'error') errors.push({ message: msg.text(), location: msg.location() }); });
page.on('requestfailed', request => errors.push({ url: request.url(), failure: request.failure() }));
mkdirSync('artifacts', { recursive: true });
const snapshot = () => page.evaluate(() => window.shardStorm.snapshot());
async function screenshot(name) { await page.screenshot({ path: `artifacts/v07-${name}.png`, fullPage: true }); }
async function selectSkill(key) { await page.locator(`[data-skill="${key}"]`).click(); return page.locator('#skill-purchase'); }
async function purchaseSkill(key) { const buy = await selectSkill(key); assert.equal(await buy.isEnabled(), true, `${key} must be purchasable`); await buy.click(); }
async function at(x, y) { const b = await page.locator('#game').boundingBox(); return { x: b.x + x * b.width / 960, y: b.y + y * b.height / 540 }; }
async function clickWorld(x, y) { const p = await at(x, y); await page.mouse.click(p.x, p.y); }
async function play(name) {
  await clickWorld(480, 335); await page.waitForTimeout(180);
  let s = await snapshot(); assert.ok(s.record.bestChain >= 4); assert.ok(s.record.firstCascadeTime < 10);
  const guided = { firstCascadeTime: s.record.firstCascadeTime, guidedDestroyed: s.record.totalDestroyed };
  const fps = []; let captured = false, seen = new Set();
  let p = await at(480, 335); await page.mouse.move(p.x, p.y); await page.mouse.down();
  while ((s = await snapshot()).state === 'PLAYING') {
    fps.push({ elapsed: s.elapsed, fps: s.fps });
    s.shapes.forEach(shape => seen.add(shape.type));
    const targets = s.shapes.filter(t => t.grace <= 0);
    targets.sort((a, b) => {
      const score = t => s.shapes.filter(o => o.id !== t.id && Math.hypot(o.x - t.x, o.y - t.y) <= 180).length * 3 - Math.ceil(t.hp / (3 + s.levels.crushPower)) * 2;
      return score(b) - score(a) || a.id - b.id;
    });
    if (targets[0]) { p = await at(targets[0].x, targets[0].y); await page.mouse.move(p.x, p.y); }
    if (!captured && s.elapsed > 12) { await screenshot(`${name}-playing`); captured = true; }
    await page.waitForTimeout(185);
  }
  await page.mouse.up(); await page.locator('#result').waitFor({ state: 'visible' });
  s = await snapshot(); assert.equal(s.remaining, 0); assert.equal(s.settled, true); assert.equal(s.record.durationSeconds, 60);
  assert.equal(s.record.directKills + s.record.cascadeKills, s.record.totalDestroyed);
  const bank = s.bank; await page.waitForTimeout(500); assert.equal((await snapshot()).bank, bank);
  await screenshot(`${name}-result`);
  const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
  const report = { name, ...s.record, ...guided, wallFPSMean: mean(fps.map(f => f.fps)), first10SecondsFPS: mean(fps.filter(f => f.elapsed < 10).map(f => f.fps)), last10SecondsFPS: mean(fps.filter(f => f.elapsed > 50).map(f => f.fps)), shapeTypesSeen: [...seen], bank };
  runs.push(report); console.log(JSON.stringify(report)); return s;
}
try {
  await page.goto('http://127.0.0.1:4173');
  const legacy = { saveVersion: 1, bank: 321, levels: { crushPower: 2, shardPower: 0, shardRange: 1, chainAmplifier: 1, extraTime: 2 }, bestStats: { totalDestroyed: 120, bestChain: 14, photonsEarned: 900 }, lastRuns: [{ photonsEarned: 900, seed: 7 }], options: { inheritance: false, ricochet: true, damageVFX: true, sound: false } };
  await page.evaluate(data => localStorage.setItem('shard-storm-v1', JSON.stringify(data)), legacy); await page.reload();
  let migrated = await snapshot(); assert.equal(migrated.saveVersion, 2); assert.equal(migrated.bank, 321); assert.equal(migrated.levels.shardRange, 1); assert.equal(migrated.levels.impactPulse, 0); assert.equal(migrated.options.inheritance, false); assert.equal(migrated.derivedStats.shardRange, 230);
  const migratedRaw = await page.evaluate(() => JSON.parse(localStorage.getItem('shard-storm-v1'))); assert.deepEqual(migratedRaw.bestStats, legacy.bestStats); assert.deepEqual(migratedRaw.lastRuns, legacy.lastRuns); checks.push('legacy v0.6 save migrated and persisted with bank / five levels / best / history');
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await screenshot('01-title'); assert.equal((await snapshot()).state, 'TITLE');
  await page.locator('#start').click(); await clickWorld(480, 335); await page.waitForTimeout(190);
  assert.ok((await snapshot()).record.bestChain >= 4);
  await page.locator('#pause').click(); const pausedTime = (await snapshot()).remaining; await page.waitForTimeout(600); assert.equal((await snapshot()).remaining, pausedTime); await page.locator('#resume').click(); checks.push('manual pause / resume');
  // Reloading discards unbanked rewards and returns to the title.
  await page.reload(); assert.equal((await snapshot()).bank, 0); checks.push('unsettled reload gives no bank rewards');
  // Check resized real pointer input before starting the three timed runs.
  await page.setViewportSize({ width: 900, height: 850 }); await page.locator('#start').click(); await clickWorld(480, 335); await page.waitForTimeout(190); assert.ok((await snapshot()).record.bestChain >= 4); checks.push('resized canvas pointer mapping');
  await page.reload(); await page.setViewportSize({ width: 1280, height: 950 }); await page.locator('#start').click();
  const base = await play('02-baseline');
  assert.equal(await page.locator('[data-skill]').count(), 11); assert.equal(await page.locator('.skill-edge').count(), 11);
  const locked = await selectSkill('impactPulse'); assert.equal(await locked.isEnabled(), false); assert.ok((await page.locator('#skill-info').textContent()).includes('Crush Power Lv.2')); checks.push('11 real nodes / 11 SVG edges / locked prerequisites');
  for (const key of ['crushPower', 'shardPower']) await purchaseSkill(key);
  const upgraded = await snapshot(); assert.equal(upgraded.levels.crushPower, 1); assert.equal(upgraded.levels.shardPower, 1); assert.equal(upgraded.bank, base.bank - 150); await screenshot('03-purchased-upgrades');
  await page.reload(); const restored = await snapshot(); assert.equal(restored.bank, upgraded.bank); assert.deepEqual(restored.levels, upgraded.levels); checks.push('real upgrade purchases / bank deductions / persistence');
  await page.locator('#start').click(); const second = await play('04-upgraded');
  assert.ok(second.record.cascadeKills > base.record.cascadeKills, 'upgraded 60s run should produce more cascades'); checks.push('upgraded 60s run increases cascade kills');
  await page.keyboard.press('d'); await page.locator('#option-sequentialPropagation').uncheck(); await page.locator('#option-visualVariety').uncheck(); await page.locator('#option-inheritance').uncheck(); await screenshot('05-developer-panel');
  await page.locator('#dev-close').click(); await page.locator('#again').click(); const third = await play('06-ab-disabled');
  assert.equal(third.record.inheritanceEnabled, false); assert.equal(third.record.sequentialPropagationEnabled, false); assert.equal(third.record.visualVarietyEnabled, false); checks.push('Play Again / independent propagation-variety-inheritance A-B switches');
  // Purchase/MAX/affordability DOM states using explicit developer grant, separate from runs.
  await page.keyboard.press('d'); for (let i = 0; i < 5; i++) await page.locator('#grant').click(); await page.locator('#dev-close').click();
  const crush = await selectSkill('crushPower'); while (await crush.isEnabled()) await crush.click(); assert.equal(await crush.textContent(), 'MAX'); assert.equal(await crush.isEnabled(), false); checks.push('MAX button disabled');
  for (const key of ['crushSpeed', 'impactPulse', 'shardRange', 'ricochetPlus']) await purchaseSkill(key);
  await purchaseSkill('shardPower'); await purchaseSkill('shardBloom'); await purchaseSkill('chainAmplifier'); await purchaseSkill('echoCatalyst'); await purchaseSkill('extraTime'); await purchaseSkill('photonBoost');
  assert.equal((await snapshot()).levels.photonBoost, 1); checks.push('all six P1 skills purchased through real prerequisite paths');
  await screenshot('07-p1-skill-tree');
  const replay = await page.locator('#again').boundingBox(), resultBounds = await page.locator('#result').boundingBox(); assert.ok(replay.y + replay.height <= resultBounds.y + resultBounds.height + 1); checks.push('graph-only scrolling keeps replay in result bounds');
  const exact = await snapshot(); const raw = await page.evaluate(() => JSON.parse(localStorage.getItem('shard-storm-v1'))); raw.bank = 0;
  await page.evaluate(data => localStorage.setItem('shard-storm-v1', JSON.stringify(data)), raw); await page.reload();
  await page.keyboard.press('d'); await page.locator('#duration').fill('1'); await page.locator('#same-seed').click(); await page.locator('#dev-close').click();
  await page.locator('#result').waitFor({ state: 'visible' }); assert.equal(await (await selectSkill('shardPower')).isEnabled(), false); checks.push('insufficient bank button disabled');
  // Real tab visibility: foregrounding another browser page must pause game time.
  await page.keyboard.press('d'); await page.locator('#duration').fill('60'); await page.locator('#same-seed').click(); await page.locator('#dev-close').click();
  const other = await browser.newPage(); await other.goto('about:blank'); await other.bringToFront(); await page.waitForTimeout(200);
  const hidden = await page.evaluate(() => document.hidden);
  if (hidden) { const before = (await snapshot()).remaining; await page.waitForTimeout(500); assert.equal((await snapshot()).remaining, before); checks.push('real hidden tab pause'); }
  else checks.push('hidden tab not reproducible in headless Chromium; engine pause verified separately');
  await other.close(); await page.bringToFront();
  assert.deepEqual(errors, []); checks.push('zero console / page errors');
  writeFileSync('artifacts/browser-results.json', JSON.stringify({ browser: await browser.version(), checks, runs, errors, finalLevels: exact.levels }, null, 2));
  console.log('BROWSER CHECKS PASSED', checks);
} catch (error) {
  writeFileSync('artifacts/browser-results.json', JSON.stringify({ browser: await browser.version(), checks, runs, errors, failure: error.message }, null, 2));
  throw error;
} finally { await browser.close(); }
