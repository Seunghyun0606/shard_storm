import {createRequire} from 'node:module';
import {writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4180',errors=[],runs=[];
const signature=()=>{const h=createHash('sha256');for(const file of readdirSync('.').filter(p=>p.endsWith('.js')).concat(['tests/m12-browser.mjs']).sort())h.update(file+'\0'+readFileSync(file,'utf8').replaceAll('\r\n','\n')+'\0');return h.digest('hex');},sourceSignature=signature();
try{
 for(const spec of [{width:620,dpr:1,rank:0,focus:false,reduce:false},{width:1280,dpr:1,rank:0,focus:true,reduce:true},{width:1920,dpr:2,rank:4,focus:false,reduce:false},{width:620,dpr:2,rank:4,focus:true,reduce:true},{width:1280,dpr:2,rank:4,focus:false,reduce:false},{width:1920,dpr:1,rank:4,focus:true,reduce:true}]){
  const context=await browser.newContext({viewport:{width:spec.width,height:1000},deviceScaleFactor:spec.dpr}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto(base);
  await page.evaluate(async spec=>{const{freshSave}=await import('./storage.js'),{encodeSave}=await import('./save-codec.js'),{CONFIG:C}=await import('./config.js');const s=freshSave();s.options.reducedMotionEnabled=spec.reduce;
   if(spec.rank){s.lifetimeDestroyed=8000;s.discoveryRank=4;s.bank=12345;s.catalystBalance=111;for(const[id,u]of Object.entries(C.upgrades))s.levels[id]=id==='extraTime'?0:u.max;}
   localStorage.setItem(C.storageKey,encodeSave(s));
  },spec);await page.reload();
  const snap=()=>page.evaluate(()=>window.shardStorm.snapshot()),before=await snap();
  if(spec.focus)await page.locator('#focus').click();
  if(spec.rank){await page.locator('#dev-toggle').click();await page.locator('#build-preset').selectOption('M12Max');await page.locator('#duration').fill('20');await page.locator('#supply-profile').selectOption('M12_elastic24');await page.locator('#elite-policy').selectOption('M12_run20_pity6');await page.locator('#experiment-start').click();await page.locator('#dev-close').click();}
  else await page.locator('#start').click();
  await page.locator('#game').scrollIntoViewIfNeeded();
  let q=await page.locator('#game').boundingBox();await page.mouse.click(q.x+q.width*.5,q.y+q.height*335/540);await page.mouse.down();let captured=false;const frameDeltas=[];let last=Date.now();
  while((await snap()).state==='PLAYING'){
   const s=await snap(),target=s.shapes.filter(t=>t.grace<=0).sort((a,b)=>a.hp-b.hp||a.id-b.id)[0];
   q=await page.locator('#game').boundingBox();if(target)await page.mouse.move(q.x+target.x*q.width/960,q.y+target.y*q.height/540);
   if(!s.held){await page.mouse.up();await page.mouse.down();}
   if(!captured&&s.elapsed>10){await page.screenshot({path:`artifacts/m12-pointer-${spec.width}-${spec.dpr}-${spec.rank}.png`,fullPage:true});captured=true;await page.mouse.up();await page.mouse.down();}
   const now=Date.now();frameDeltas.push(now-last);last=now;await page.waitForTimeout(55);
  }
  await page.mouse.up();const ended=await snap();assert.equal(ended.record.runDurationActual,20);assert.equal(ended.record.physicsDebt.discardedPhysicalSeconds,0);assert.equal(ended.record.physicsChecks.lateWaveContacts,0);assert.ok(ended.successfulClicks>5);
  if(ended.record.codexAttempts.length){await page.locator('#codex-result summary').click();assert.ok(await page.locator('#codex-result .codex-attempt').count()>0);await page.locator('#codex-result').scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/m12-codex-attempts-${spec.width}-${spec.dpr}.png`,fullPage:true});}
  if(spec.rank){assert.equal(ended.record.director.profile,'M12_elastic24');assert.equal(ended.sandbox,true);await page.reload();assert.equal((await snap()).bank,before.bank);assert.deepEqual((await snap()).levels,before.levels);}
  else{const expected=ended.pendingSettlement?.payout;await page.reload();const restored=await snap();assert.equal(restored.bank,before.bank+expected);await page.reload();assert.equal((await snap()).bank,restored.bank);}
  runs.push({spec,fixture:spec.rank===4,record:ended.record,observedPointerLoopP95ms:frameDeltas.sort((a,b)=>a-b)[Math.floor(frameDeltas.length*.95)]});await context.close();
 }
 assert.deepEqual(errors,[]);assert.equal(signature(),sourceSignature,'Source changed during browser QA');writeFileSync('artifacts/m12-browser-results.json',JSON.stringify({passed:true,sourceSignature,browser:await browser.version(),actual20sRuns:runs.length,runs,errors,humanFun:'Not measured: actual pointer auto-targeting; advanced saves are isolated fixtures.'},null,2));console.log('M12 Chrome pointer PASS:6 actual20s Runs');
}catch(e){writeFileSync('artifacts/m12-browser-results.json',JSON.stringify({passed:false,runs,errors,error:e.stack},null,2));throw e;}finally{await browser.close();}
