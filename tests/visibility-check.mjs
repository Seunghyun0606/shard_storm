// The actual tab switch is not reproducible in headless Chrome. This checks the
// real app visibility handler using a simulated browser visibility property.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  const page = await browser.newPage(); await page.goto('http://127.0.0.1:4173'); await page.locator('#start').click();
  await page.waitForTimeout(100);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  const before = await page.evaluate(() => window.shardStorm.snapshot());
  assert.equal(before.paused, true); await page.waitForTimeout(700);
  const during = await page.evaluate(() => window.shardStorm.snapshot()); assert.equal(during.remaining, before.remaining);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  const resumed = await page.evaluate(() => window.shardStorm.snapshot()); assert.equal(resumed.paused, false); assert.equal(resumed.remaining, before.remaining);
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => window.shardStorm.snapshot()); assert.ok(before.remaining - after.remaining > .1 && before.remaining - after.remaining < .4);
  writeFileSync('artifacts/visibility-results.json', JSON.stringify({ passed: true, method: 'simulated document.hidden + real visibilitychange handler; not an actual tab switch', pausedForMs: 700, timeBefore: before.remaining, timeDuring: during.remaining, timeOnResume: resumed.remaining, timeAfter200ms: after.remaining }, null, 2));
  console.log('Visibility handler: pause, freeze, resume without time jump PASSED (simulated visibility).');
} finally { await browser.close(); }
