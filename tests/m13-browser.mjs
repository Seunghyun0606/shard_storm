import {createRequire} from 'node:module';
import {writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),base=process.env.QA_BASE_URL||'http://127.0.0.1:4180',runs=[],errors=[];
const hash=()=>{const h=createHash('sha256');for(const p of readdirSync('.').filter(p=>p.endsWith('.js')).concat(['tests/m13-browser.mjs']).sort())h.update(p+'\0'+readFileSync(p,'utf8').replaceAll('\r\n','\n')+'\0');return h.digest('hex');},signature=hash();
try{
 for(const[width,dpr,rank,seed,focus,reduced]of [[620,1,0,31415,false,false],[1280,2,0,31415,true,true],[1920,2,4,31415,false,false],[620,2,4,2,true,true],[1280,1,4,42,false,false],[1920,1,4,99,true,true]]){
  const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:dpr}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto(base);
  if(rank){await page.evaluate(async()=>{const{freshSave}=await import('./storage.js'),{encodeSave}=await import('./save-codec.js'),{CONFIG:C}=await import('./config.js');const s=freshSave();s.bank=9876;s.lifetimeDestroyed=8000;s.discoveryRank=4;localStorage.setItem(C.storageKey,encodeSave(s));});await page.reload();}
  if(focus)await page.locator('#focus').click();
  if(rank){await page.locator('#dev-toggle').click();await page.locator('#build-preset').selectOption('M12Max');await page.locator('#duration').fill('20');await page.locator('#seed').fill(String(seed));if(reduced)await page.locator('#option-reducedMotionEnabled').check();await page.locator('#experiment-start').click();await page.locator('#dev-close').click();}
  else await page.locator('#start').click();
  const snap=(record=false)=>page.evaluate(record=>window.shardStorm.snapshot({record}),record),position=async s=>{const b=await page.locator('#game').boundingBox();return{x:b.x+s.x*b.width/960,y:b.y+s.y*b.height/540};};await page.locator('#game').scrollIntoViewIfNeeded();let p=await position({x:480,y:335});await page.mouse.click(p.x,p.y);await page.mouse.down();let capture=false;
  while((await snap()).state==='PLAYING'){
   const state=await snap(),live=state.shapes.filter(s=>s.grace<=0),score=s=>state.shapes.filter(t=>t.id!==s.id&&Math.hypot(t.x-s.x,t.y-s.y)<=180).length*3-Math.ceil(s.hp/state.derivedStats.directDamage)*2;
   const target=live.sort((a,b)=>score(b)-score(a)||a.id-b.id)[0];if(target){p=await position(target);await page.mouse.move(p.x,p.y);}if(!state.held){await page.mouse.up();await page.mouse.down();}
   if(!capture&&state.elapsed>10){await page.screenshot({path:`artifacts/m13-playing-${width}-${seed}.png`,fullPage:true});capture=true;await page.mouse.up();await page.mouse.down();}await page.waitForTimeout(55);
  }
  await page.mouse.up();const ended=await snap(true),r=ended.record;assert.equal(r.runDurationActual,20);assert.equal(r.physicsDebt.discardedPhysicalSeconds,0);assert.equal(r.physicsChecks.lateWaveContacts,0);assert.equal(r.destruction.stage.id,rank?'storm':'shatter');assert.ok(r.destruction.triggers<=3&&r.destruction.spawned<=18);assert.ok(ended.successfulClicks>10);
  await page.screenshot({path:`artifacts/m13-result-${width}-${seed}.png`,fullPage:true});if(rank){await page.reload();assert.equal((await snap()).bank,9876);}else{const payout=ended.pendingSettlement?.payout;await page.reload();assert.equal((await snap()).bank,payout);await page.reload();assert.equal((await snap()).bank,payout);}
  runs.push({width,dpr,rank,seed,focus,reduced,fixture:rank>0,record:r});await context.close();
 }
 assert.ok(runs.some(r=>r.record.destruction.spawned>0),'A real pointer Run must activate a response formation');assert.deepEqual(errors,[]);assert.equal(hash(),signature,'Source changed during QA');writeFileSync('artifacts/m13-browser-results.json',JSON.stringify({passed:true,signature,browser:await browser.version(),actual20sRuns:runs.length,runs,errors,humanFun:'Not assessed; natural Fresh2 and explicit advanced isolated4, actual mouse/density targeting'},null,2));console.log('M13 Chrome pointer PASS:6 actual20s Runs');
}catch(e){writeFileSync('artifacts/m13-browser-results.json',JSON.stringify({passed:false,runs,errors,error:e.stack},null,2));throw e;}finally{await browser.close();}
