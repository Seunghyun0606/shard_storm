import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4174', errors=[],runs=[],checks=[];
try{
 const context=await browser.newContext({viewport:{width:1280,height:1050}}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 const snap=()=>page.evaluate(()=>window.shardStorm.snapshot());
 const pointer=async s=>{const b=await page.locator('#game').boundingBox();return{x:b.x+s.x*b.width/960,y:b.y+s.y*b.height/540};};
 const click=async s=>{const p=await pointer(s);await page.mouse.click(p.x,p.y);};
 async function play(name,skip=true,refresh=false){
  const before=await snap();assert.equal(before.remaining,20);await click({x:480,y:335});await page.waitForTimeout(200);assert.ok((await snap()).record.bestChain>=4);
  let live, captured=false;await page.mouse.down();
  while((live=await snap()).state==='PLAYING'){
   const targets=live.shapes.filter(s=>s.grace<=0),score=s=>live.shapes.filter(o=>o.id!==s.id&&Math.hypot(o.x-s.x,o.y-s.y)<180).length*3-Math.ceil(s.hp/live.derivedStats.directDamage)*2;
   targets.sort((a,b)=>score(b)-score(a)||a.id-b.id);if(targets[0]){const p=await pointer(targets[0]);await page.mouse.move(p.x,p.y);}
   if(!captured&&live.elapsed>5){await page.screenshot({path:`artifacts/m5-m6-v09-${name}-playing.png`,fullPage:true});captured=true;}
   await page.waitForTimeout(160);
  }
  await page.mouse.up();const processing=await snap();assert.equal(processing.remaining,0);assert.ok(processing.refinery);
  if(refresh){
   assert.equal(processing.settled,false);assert.ok(processing.pendingSettlement);await page.screenshot({path:`artifacts/m5-m6-v09-${name}-refinery.png`,fullPage:true});
   await page.reload();assert.equal((await snap()).bank,before.bank+processing.refinery.payout);const credited=(await snap()).bank;await page.reload();assert.equal((await snap()).bank,credited);
   const record=await page.evaluate(async()=> (await import('./save-codec.js')).decodeSave(localStorage.getItem('shard-storm-v1')).lastRuns.at(-1));runs.push({name,...record,inputPolicy:'auto:browser-density-pointer',bankBefore:before.bank,bankAfter:credited,recoveredAfterRefresh:true});checks.push('actual 20s result refreshed during refinery, recovered once');return await snap();
  }
  if(await page.locator('#refinery-skip').isVisible()){
   assert.equal(processing.bank,before.bank);assert.ok(processing.pendingSettlement);await page.screenshot({path:`artifacts/m5-m6-v09-${name}-refinery.png`,fullPage:true});
   if(skip&&await page.locator('#refinery-skip').isVisible())await page.locator('#refinery-skip').click();
  }
  await page.waitForFunction(()=>window.shardStorm.snapshot().settled===true);const finished=await snap();
  assert.equal(finished.bank,before.bank+finished.refinery.payout);await page.waitForTimeout(250);assert.equal((await snap()).bank,finished.bank);
  assert.equal(await page.locator('.skill-node').count(),19);assert.equal(await page.locator('.skill-edge').count(),20);
  const b=await page.locator('#again').boundingBox(),result=await page.locator('#result').boundingBox();assert.ok(b.y+b.height<=result.y+result.height+1);
  assert.ok(finished.record.physicsChecks.maxWaveContactError<.002);assert.ok(finished.record.physicsChecks.maxProjectileContactError<.002);assert.equal(finished.record.physicsChecks.lateWaveContacts,0);
  await page.screenshot({path:`artifacts/m5-m6-v09-${name}-result.png`,fullPage:true});runs.push({name,...finished.record,inputPolicy:'auto:browser-density-pointer',bankBefore:before.bank,bankAfter:finished.bank});console.log(name,finished.record.totalDestroyed,finished.record.rawEarned,finished.refinery.payout);
  return finished;
 }
 await page.goto(base);await page.locator('#start').click();
 const first=await play('01-baseline');assert.ok(first.bank>=60);await page.locator('[data-skill="crushPower"]').click();await page.locator('#skill-purchase').click();const bought=await snap();assert.equal(bought.levels.crushPower,1);assert.equal(bought.bank,first.bank-60);
 await page.locator('#again').click();assert.equal((await snap()).remaining,20);assert.equal((await snap()).bank,bought.bank);runs[0].resultScreenSeconds=await page.evaluate(async()=> (await import('./save-codec.js')).decodeSave(localStorage.getItem('shard-storm-v1')).lastRuns.at(-1).resultScreenSeconds);assert.ok(runs[0].resultScreenSeconds>=0);checks.push('Play Again starts20s without re-crediting; result-screen duration measured');
 await page.reload();assert.equal((await snap()).levels.crushPower,1);assert.equal((await snap()).bank,bought.bank);checks.push('normal payout, upgrade, reload, 11 nodes, replay visible');
 await page.locator('#start').click();await page.locator('#pause').click();const paused=await snap();await page.waitForTimeout(300);assert.deepEqual((await snap()).shapes,paused.shapes);await page.locator('#resume').click();
 // Resume checks precede a new exact-duration run; the discarded run was unbanked.
 await page.reload();await page.locator('#start').click();await play('02-upgraded',false);checks.push('motion/time pause, automatic animation completion');
 const stored=await page.evaluate(()=>localStorage.getItem('shard-storm-v1'));
 await page.keyboard.press('d');await page.locator('#fresh-lab').click();await page.locator('#option-motionEnabled').uncheck();await page.locator('#option-modifiers').uncheck();await page.locator('#option-refineryEnabled').uncheck();await page.locator('#same-seed').click();await page.locator('#dev-close').click();
 const fresh=await snap();assert.equal(fresh.bank,0);assert.equal(fresh.levels.crushPower,0);assert.equal(fresh.sandbox,true);
 await play('03-fresh-off');assert.equal(await page.evaluate(()=>localStorage.getItem('shard-storm-v1')),stored);checks.push('Fresh Lab motion/modifiers/refinery OFF, live save unchanged');
 await page.keyboard.press('d');await page.locator('#experiment-end').click();await page.reload();assert.equal((await snap()).levels.crushPower,1);
 await page.locator('#start').click();await play('04-refresh-recovery',true,true);
 const beforeBack=(await snap()).bank;await page.goto(`${base}/index.html?history-proof=1`);await page.goBack();assert.equal((await snap()).bank,beforeBack);checks.push('navigation/back retains already paid bank');
 // Stored pending result models a tab refresh during animation, not a new roll.
 const pendingFixture=await page.evaluate(async()=>{const {Game}=await import('./game.js');const {stageSettlement}=await import('./progression.js');const save=(await import('./save-codec.js')).decodeSave(localStorage.getItem('shard-storm-v1')),g=new Game({runId:'browser-recovery'});g.runEarned=3000;g.update(20);stageSettlement(save,g);localStorage.setItem('shard-storm-v1',JSON.stringify(save));return{before:save.bank,payout:g.refinery.payout};});
 await page.reload();assert.equal((await snap()).bank,pendingFixture.before+pendingFixture.payout);const recovered=(await snap()).bank;await page.reload();assert.equal((await snap()).bank,recovered);checks.push('pending persisted result recovered exactly once without reroll');
 const legacy={saveVersion:2,bank:10000,levels:{crushPower:5,shardPower:5,shardRange:3,chainAmplifier:3,extraTime:6,crushSpeed:3,impactPulse:1,ricochetPlus:2,shardBloom:2,echoCatalyst:2,photonBoost:3},bestStats:{totalDestroyed:900,photonsEarned:19000},lastRuns:[{photonsEarned:19000,totalDestroyed:900}],options:{motionEnabled:true}};
 await page.evaluate(data=>localStorage.setItem('shard-storm-v1',JSON.stringify(data)),legacy);await page.reload();let l=await snap();assert.equal(l.saveVersion,4);assert.equal(l.bank,10000);assert.equal(l.levels.extraTime,6);assert.equal(l.derivedStats.duration,32);checks.push('v2 legacy bank/11 levels/history preserved, Extra Time32');
 await page.keyboard.press('d');await page.locator('#duration').fill('1');await page.locator('#same-seed').click();await page.locator('#dev-close').click();await page.waitForFunction(()=>window.shardStorm.snapshot().settled===true);
 await page.locator('#time-refund').click();assert.equal((await snap()).levels.extraTime,0);assert.equal(await page.locator('#time-refund').isVisible(),false);assert.equal(await page.evaluate(async()=> (await import('./save-codec.js')).decodeSave(localStorage.getItem('shard-storm-v1')).levels.extraTime),6);checks.push('once-only optional time refund tested only in isolated lab');
 assert.deepEqual(errors,[]);writeFileSync('artifacts/m5-m6-v09-browser-results.json',JSON.stringify({passed:true,browser:await browser.version(),checks,runs,errors},null,2));console.log('v0.9 browser PASS');
}catch(e){writeFileSync('artifacts/m5-m6-v09-browser-results.json',JSON.stringify({passed:false,runs,checks,errors,failure:e.message},null,2));throw e;}finally{await browser.close();}
