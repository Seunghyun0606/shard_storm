// Targeted browser QA for the finished skill tree and real P1 combat effects.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } }), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:4173'); await page.evaluate(() => localStorage.clear()); await page.reload();
  const snapshot = () => page.evaluate(() => window.shardStorm.snapshot());
  await page.keyboard.press('d'); for (let i = 0; i < 5; i++) await page.locator('#grant').click();
  await page.locator('#duration').fill('1'); await page.locator('#same-seed').click(); await page.locator('#dev-close').click(); await page.locator('#result').waitFor({ state: 'visible' });
  for (const key of ['crushPower', 'crushPower', 'shardPower', 'shardPower', 'shardRange', 'chainAmplifier', 'extraTime', 'crushSpeed', 'impactPulse', 'ricochetPlus', 'shardBloom', 'echoCatalyst', 'photonBoost']) {
    await page.locator(`[data-skill="${key}"]`).click(); assert.ok(await page.locator('#skill-purchase').isEnabled()); await page.locator('#skill-purchase').click();
  }
  await page.locator('[data-skill="shardBloom"]').click();
  await page.screenshot({ path: 'artifacts/v07-08-skill-tree-lower.png', fullPage: true });
  await page.locator('#again').click(); assert.equal((await snapshot()).remaining, 65);
  await page.keyboard.press('d'); await page.locator('#spawn-tools').getByRole('button', { name: '+ star', exact: true }).click(); await page.locator('#dev-close').click(); await page.waitForTimeout(160);
  const before = await snapshot(), star = before.shapes.find(s => s.type === 'star'); assert.ok(star);
  const rect = await page.locator('#game').boundingBox();
  await page.mouse.click(rect.x + star.x * rect.width / 960, rect.y + star.y * rect.height / 540);
  const impact = await snapshot(); assert.equal(impact.shapes.find(s => s.id === star.id).hp, 4); assert.ok(impact.waves.some(w => w.source === 'impact'));
  assert.ok(Math.abs(impact.derivedStats.attackInterval - .18) < 1e-9); assert.equal(impact.derivedStats.bounces, 2); assert.equal(impact.derivedStats.triangleCount, 4); assert.equal(impact.derivedStats.inheritanceDamage, 2); assert.equal(impact.derivedStats.bonusMultiplier, 1.1);
  await page.waitForTimeout(35); await page.screenshot({ path: 'artifacts/v07-09-impact-pulse.png', fullPage: true });
  await page.locator('#pause').click(); const paused = await snapshot();
  await page.keyboard.press('d'); await page.locator('#option-visualVariety').uncheck(); await page.locator('#option-sequentialPropagation').uncheck(); await page.locator('#option-inheritance').uncheck(); await page.locator('#dev-close').click();
  const switched = await snapshot(); assert.deepEqual(switched.shapes, paused.shapes); assert.equal(switched.remaining, paused.remaining); assert.equal(switched.options.visualVariety, false);
  await page.locator('#resume').click(); await page.waitForTimeout(220);
  await page.mouse.click(rect.x + star.x * rect.width / 960, rect.y + star.y * rect.height / 540);
  assert.ok((await snapshot()).record.photonsEarned >= 53); // HP9 + ceil(Star bonus40 ×1.1), plus any real collateral damage.
  assert.deepEqual(errors, []);
  writeFileSync('artifacts/v07-visual-proof.json', JSON.stringify({ passed: true, actualStarHPAfterDirectHit: 4, actualImpactWavePresent: true, actualAppliedStats: impact.derivedStats, independentSwitchesPreservedPausedWorld: true, errors }, null, 2));
  console.log('P1 browser combat, lower tree, independent switches and current app runtime PASSED.');
} finally { await browser.close(); }
