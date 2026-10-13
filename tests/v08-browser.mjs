// Isolated QA contexts only. Synthetic render fixtures are labelled separately.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4174';
const phase = Number(process.env.QA_PHASE || 1);
const errors = [], proof = { phase, inputPolicy: 'auto / real browser pointer', fixtures: [] };
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  await page.goto(base);
  assert.ok((await page.locator('#options').textContent()).includes('파손 / 충전'));
  assert.ok((await page.locator('#spawn-preset').textContent()).includes('군집'));
  await page.locator('#start').click();
  const snapshot = () => page.evaluate(() => window.shardStorm.snapshot());
  const clickAt = async s => { const r = await page.locator('#game').boundingBox(); await page.mouse.click(r.x + s.x * r.width / 960, r.y + s.y * r.height / 540); };
  await clickAt({ x: 480, y: 335 }); await page.waitForTimeout(350);
  assert.ok((await snapshot()).record.totalDestroyed >= 4);
  let captured = false; const seenModifiers = new Set();
  for (let i = 0; i < 65; i++) {
    const s = await snapshot(), live = s.shapes.filter(t => t.grace <= 0);
    for (const t of s.shapes) if (t.modifier) seenModifiers.add(t.modifier);
    live.sort((a, b) => {
      const score = t => live.filter(o => Math.hypot(o.x - t.x, o.y - t.y) < 180).length * 3 - Math.ceil(t.hp / s.derivedStats.directDamage) * 2;
      return score(b) - score(a) || a.id - b.id;
    });
    if (live[0]) await clickAt(live[0]);
    const after = await snapshot();
    if (after.combo && !captured) { await page.screenshot({ path: 'artifacts/v08-combo-live.png', fullPage: true }); captured = true; }
    await page.waitForTimeout(200);
  }
  proof.liveComboCaptured = captured; proof.live = await snapshot(); assert.ok(proof.live.record.comboMilestones[5] > 0);
  await page.keyboard.press('d'); await page.locator('#option-comboFeedback').uncheck(); assert.equal((await snapshot()).combo, null);
  await page.locator('#option-comboFeedback').check(); await page.locator('#option-sound').check(); await page.locator('#dev-close').click();
  await clickAt((await snapshot()).shapes.find(s => s.grace <= 0)); assert.ok((await snapshot()).audioVoices <= 8);
  if (phase >= 2) {
    assert.ok(seenModifiers.has('cracked')); assert.ok(seenModifiers.has('charged')); proof.seenModifiers = [...seenModifiers];
    await page.locator('#pause').click(); const paused = await snapshot();
    await page.keyboard.press('d'); await page.locator('#option-modifierVisuals').uncheck(); await page.locator('#option-visualVariety').uncheck();
    const switched = await snapshot(); assert.deepEqual(switched.shapes, paused.shapes); assert.equal(switched.remaining, paused.remaining);
    await page.locator('#option-modifierVisuals').check(); await page.locator('#option-visualVariety').check();
    await page.screenshot({ path: 'artifacts/v08-developer-lab.png', fullPage: true });
    const storedBefore = await page.evaluate(() => localStorage.getItem('shard-storm-v1'));
    await page.locator('#economy-preset').selectOption('cost_x3'); await page.locator('#spawn-preset').selectOption('fast_spread');
    await page.locator('#build-preset').selectOption('Crusher'); await page.locator('#duration').fill('1');
    await page.locator('#experiment-start').click();
    const experiment = await snapshot(); assert.equal(experiment.sandbox, true); assert.equal(experiment.record.experiment.spawnInterval, .15); assert.equal(experiment.record.experiment.clusterChance, .45); assert.equal(experiment.levels.crushPower, 2);
    await page.locator('#grant').click(); await page.locator('#dev-close').click(); await page.locator('#result').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.skill-node').count(), 11); assert.equal(await page.locator('.skill-edge').count(), 11);
    await page.locator('[data-skill="crushPower"]').click(); assert.ok((await page.locator('#skill-purchase').textContent()).includes('461'));
    await page.locator('#skill-purchase').click(); assert.equal((await snapshot()).levels.crushPower, 3);
    await page.screenshot({ path: 'artifacts/v08-sandbox-result.png', fullPage: true });
    assert.equal(await page.evaluate(() => localStorage.getItem('shard-storm-v1')), storedBefore);
    await page.keyboard.press('d'); await page.locator('#experiment-end').click();
    assert.equal((await snapshot()).sandbox, false); assert.equal((await snapshot()).levels.crushPower, 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('shard-storm-v1')), storedBefore);
    await page.reload(); assert.equal((await snapshot()).levels.crushPower, 0);
    proof.experimentIsolation = true; proof.sandboxCostsAndPurchase = true;
  }
  // Deterministic display fixture, separate from the live run above.
  const fixture = await context.newPage(); fixture.on('pageerror', e => errors.push(e.message)); await fixture.goto(base);
  for (const threshold of [5, 10, 20]) {
    await fixture.evaluate(async threshold => {
      const { Game } = await import('./game.js'), { draw } = await import('./renderer.js');
      const g = new Game(); g.elapsed = 4; const id = g.newChain(); g.chains.get(id).kills = threshold; g.trackCombo(id, { x: 480, y: 280 });
      document.querySelectorAll('.overlay').forEach(e => e.hidden = true); draw(document.querySelector('canvas').getContext('2d'), g);
      document.querySelector('.edition').textContent = `QA FIXTURE / Chain ${threshold}`;
      // Freeze only this render fixture; it has no live Game in the app loop.
      const canvas = document.querySelector('canvas'), clone = canvas.cloneNode(); clone.getContext('2d').drawImage(canvas, 0, 0); canvas.replaceWith(clone);
    }, threshold);
    const path = `artifacts/v08-combo-${threshold}.png`; await fixture.screenshot({ path, fullPage: true }); proof.fixtures.push(path);
    await fixture.reload();
  }
  if (phase >= 2) for (const types of [['triangle', 'square'], ['pentagon', 'star']]) {
    const state = await fixture.evaluate(async types => {
      const { Game } = await import('./game.js'), { draw } = await import('./renderer.js');
      const g = new Game(); g.shapes = []; g.elapsed = 2; const states = [];
      for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
        const modifier = ['normal', 'cracked', 'charged', 'normal'][col], s = g.addShape(types[row], 180 + col * 200, 220 + row * 170, -.4, col === 3, 0, modifier); states.push({ type: s.type, modifier: s.modifier, hp: s.hp, maxHP: s.maxHP, enhanced: s.enhanced });
      }
      document.querySelectorAll('.overlay').forEach(e => e.hidden = true);
      const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d'); draw(ctx, g);
      ctx.fillStyle = '#c7dcdf'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
      for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) ctx.fillText(`${types[row].toUpperCase()} / ${['NORMAL', 'CRACKED', 'CHARGED', 'ENHANCED'][col]}`, 180 + col * 200, 270 + row * 170);
      document.querySelector('.edition').textContent = 'QA FIXTURE / Modifier marks';
      const clone = canvas.cloneNode(); clone.getContext('2d').drawImage(canvas, 0, 0); canvas.replaceWith(clone); return states;
    }, types);
    const path = `artifacts/v08-modifiers-${types[0]}.png`; await fixture.screenshot({ path, fullPage: true }); proof.fixtures.push(path); proof.modifierFixtureStates ||= []; proof.modifierFixtureStates.push(...state); await fixture.reload();
  }
  assert.deepEqual(errors, []); proof.errors = errors; proof.passed = true;
  writeFileSync(`artifacts/v08-browser-phase${phase}.json`, JSON.stringify(proof, null, 2));
  console.log(`v0.8 browser phase ${phase} PASS`);
} finally { await browser.close(); }
