import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const runs=[],errors=[],base=process.env.QA_BASE_URL||'http://127.0.0.1:4174';
try {
 const context=await browser.newContext({viewport:{width:1560,height:1000},deviceScaleFactor:2}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const snapshot=()=>page.evaluate(()=>window.shardStorm.snapshot());
 const point=async shape=>{const b=await page.locator('#game').boundingBox();return {x:b.x+shape.x*b.width/960,y:b.y+shape.y*b.height/540};};
 for(const mode of ['Fresh','Signature3','DirectShard','ShockReactor','GravityDirect','OwnedInactive']) {
  await page.goto(base);
  await page.evaluate(async mode=>{
   const {freshSave}=await import('./storage.js'),{CONFIG:C}=await import('./config.js'),{EVOLUTION_FAMILIES:F}=await import('./expansion-defs.js');
   const s=freshSave();
   if(mode!=='Fresh'){
    s.bank=100000;s.catalystBalance=1000;s.lifetimeDestroyed=8000;s.discoveryRank=4;
    for(const[id,u]of Object.entries(C.upgrades))s.levels[id]=u.max;
    s.levels.extraTime=0;s.relicOwned=['ricochetCoil','reactorGovernor'];s.relicEquipped=[...s.relicOwned];
    for(const[family,d]of Object.entries(F))s.evolutionOwned[family]=Object.keys(d.forms);
    s.signatureLoadout=mode==='OwnedInactive'?[]:['piercingShard','ricochetBloom','delayedEcho'];
    s.evolutionActive=mode==='DirectShard'?[{family:'direct',form:'focusStrike'},{family:'shard',form:'piercing'}]:mode==='ShockReactor'?[{family:'shockwave',form:'wide'},{family:'reactor',form:'delayed'}]:mode==='GravityDirect'?[{family:'gravity',form:'orbit'},{family:'direct',form:'markDetonator'}]:[];
   }
   localStorage.setItem(C.storageKey,JSON.stringify(s));
  },mode);await page.reload();
  if(mode!=='Fresh')await page.locator('.edition').evaluate(e=>e.append(' · QA FIXTURE'));
  assert.equal((await snapshot()).saveVersion,7);
  if(mode==='Signature3') {
   await page.locator('#build-start summary').click();
   assert.equal(await page.locator('#build-start [data-signature]').count(),10);assert.equal(await page.locator('#build-start [data-evolution-family]').count(),5);
   await page.screenshot({path:'artifacts/m10-signature-evolution-title.png',fullPage:true});
  }
  if(mode==='DirectShard')await page.locator('#focus').click();
  const before=await snapshot();await page.locator('#start').click();const first=await point({x:480,y:335});await page.mouse.click(first.x,first.y);await page.mouse.down();let captured=false;
  while((await snapshot()).state==='PLAYING') {
   const live=await snapshot(),target=live.shapes.filter(s=>s.grace<=0).sort((a,b)=>a.hp-b.hp||a.id-b.id)[0];
   if(target){const p=await point(target);await page.mouse.move(p.x,p.y);}
   if(live.elapsed>9&&!captured){await page.screenshot({path:`artifacts/m10-${mode}-playing.png`,fullPage:true});captured=true;}
   await page.waitForTimeout(65);
  }
  await page.mouse.up();const pending=await snapshot();assert.equal(pending.record.runDurationActual,20);assert.ok(pending.record.signatureLoadout.length<=3&&pending.record.evolutionActive.length<=2);
  if(mode==='OwnedInactive')assert.deepEqual(pending.record.signatureLoadout,[]);
  if(mode==='ShockReactor') {
   await page.reload();assert.equal((await snapshot()).bank,before.bank+pending.pendingSettlement.payout);await page.reload();assert.equal((await snapshot()).bank,before.bank+pending.pendingSettlement.payout);
  } else {
   if(await page.locator('#refinery-skip').isVisible())await page.locator('#refinery-skip').click();
   await page.waitForFunction(()=>window.shardStorm.snapshot().settled);
   assert.equal((await snapshot()).bank,before.bank+pending.pendingSettlement.payout);
   assert.equal(await page.locator('.skill-node').count(),49);
   if(mode==='Fresh') {
    await page.locator('[data-skill="crushPower"]').click();
    if(await page.locator('#skill-purchase').isEnabled()) {const bank=(await snapshot()).bank;await page.locator('#skill-purchase').click();assert.equal((await snapshot()).levels.crushPower,1);assert.equal((await snapshot()).bank,bank-50);}
   }
   if(mode==='Signature3') {
    await page.locator('#skill-search').fill('Mirror Return');assert.equal(await page.locator('.skill-node:visible').count(),1);
    await page.screenshot({path:'artifacts/m10-skill-search.png',fullPage:true});await page.locator('#skill-search').fill('');
    await page.locator('[data-skill="prismaticCascade"]').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/m10-49-skill-tree.png',fullPage:true});
   }
   await page.setViewportSize({width:620,height:800});await page.locator('#again').scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/m10-${mode}-narrow-result.png`,fullPage:true});await page.locator('#again').click();assert.equal((await snapshot()).state,'PLAYING');
   await page.setViewportSize({width:1560,height:1000});
  }
  runs.push({mode,fixture:mode!=='Fresh',record:pending.record});
 }
 assert.deepEqual(errors,[]);writeFileSync('artifacts/m10-browser-results.json',JSON.stringify({passed:true,browser:await browser.version(),runs,errors,humanFun:'not measured; only Fresh is a natural zero-level profile; all other loadouts are labeled isolated QA fixtures'},null,2));
 console.log('M10 Chrome pointer QA PASS:6 actual20s Runs');
} catch(e) {
 writeFileSync('artifacts/m10-browser-results.json',JSON.stringify({passed:false,runs,errors,failure:e.stack},null,2));throw e;
} finally {await browser.close();}
