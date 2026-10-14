import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const errors=[],layouts=[],runs=[],base=process.env.QA_BASE_URL||'http://127.0.0.1:4174';
try{
  for(const dpr of [1,2]){
    const context=await browser.newContext({deviceScaleFactor:dpr}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(base);
    for(const [width,height] of [[360,800],[620,800],[1024,768],[1280,720],[1920,1080],[2560,1440]]){
      await page.setViewportSize({width,height});
      for(const focus of [false,true]){
        if(await page.locator('#focus').getAttribute('aria-pressed')!==String(focus))await page.locator('#focus').click();
        await page.waitForTimeout(60);
        const layout=await page.locator('#game').evaluate(c=>{const r=c.getBoundingClientRect();return{cssWidth:r.width,cssHeight:r.height,backWidth:c.width,backHeight:c.height,right:r.right,left:r.left};});
        assert.ok(layout.right<=width+1&&layout.left>=0);assert.ok(Math.abs(layout.backWidth-layout.cssWidth*dpr)<=1);
        await page.locator('#start').scrollIntoViewIfNeeded();assert.ok(await page.locator('#start').isVisible());
        layouts.push({width,height,dpr,focus,...layout});
      }
    }
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:2}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const snap=()=>page.evaluate(()=>window.shardStorm.snapshot());
  async function point(s){const b=await page.locator('#game').boundingBox();return{x:b.x+s.x*b.width/960,y:b.y+s.y*b.height/540};}
  for(const kind of ['fresh','rank4','fx-off','reduced']){
    await page.goto(base);
    await page.evaluate(async kind=>{const {freshSave}=await import('./storage.js'),{CONFIG:C}=await import('./config.js');const s=freshSave();
      if(kind!=='fresh'){s.discoveryRank=4;s.lifetimeDestroyed=8000;s.bank=10000;s.catalystBalance=200;for(const[k,u]of Object.entries(C.upgrades))if(k!=='extraTime')s.levels[k]=u.max;}
      if(kind==='fx-off')s.options.combatFXEnabled=false;if(kind==='reduced')s.options.reducedMotionEnabled=true;
      localStorage.setItem(C.storageKey,JSON.stringify(s));},kind);
    await page.reload();if(kind!=='fresh')await page.locator('.edition').evaluate(el=>el.append(' · QA FIXTURE'));
    if(kind==='rank4')await page.locator('#focus').click();
    const before=await snap();await page.locator('#start').click();
    const first=await point({x:480,y:335});await page.mouse.click(first.x,first.y);await page.waitForTimeout(30);
    assert.ok((await snap()).record.directKills>=1,'real scaled pointer hits tutorial');
    await page.mouse.down();let screenshot=false,resized=false,paused=false;
    while((await snap()).state==='PLAYING'){
      const s=await snap(),target=s.shapes.filter(t=>t.grace<=0).sort((a,b)=>a.hp-b.hp||a.id-b.id)[0];
      if(target){const p=await point(target);await page.mouse.move(p.x,p.y);}
      if(s.elapsed>4&&!paused){await page.mouse.up();await page.locator('#pause').click();const t=(await snap()).elapsed;await page.waitForTimeout(120);assert.equal((await snap()).elapsed,t);await page.locator('#resume').click();await page.mouse.down();paused=true;}
      if(s.elapsed>7&&!resized){await page.setViewportSize({width:620,height:800});resized=true;}
      if(s.elapsed>9&&!screenshot){await page.screenshot({path:`artifacts/m9-0-${kind}-playing.png`,fullPage:true});screenshot=true;await page.setViewportSize({width:1920,height:1080});}
      await page.waitForTimeout(60);
    }
    await page.mouse.up();const pending=await snap();assert.equal(pending.record.runDurationActual,20);
    if(kind==='rank4'){await page.reload();assert.equal((await snap()).bank,before.bank+pending.pendingSettlement.payout);await page.reload();assert.equal((await snap()).bank,before.bank+pending.pendingSettlement.payout);}
    else{if(await page.locator('#refinery-skip').isVisible())await page.locator('#refinery-skip').click();await page.waitForFunction(()=>window.shardStorm.snapshot().settled);assert.equal((await snap()).bank,before.bank+pending.pendingSettlement.payout);
      await page.setViewportSize({width:620,height:800});await page.locator('#again').scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/m9-0-${kind}-result.png`,fullPage:true});await page.locator('#again').click();assert.equal((await snap()).state,'PLAYING');}
    runs.push({kind,fixture:kind!=='fresh',record:pending.record});await page.setViewportSize({width:1920,height:1080});
  }
  // Controlled combat fixture: actual pointer input, no economy or live profile.
  await page.goto(base);
  // Let the already scheduled app frame finish, then isolate the fixture renderer.
  await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.waitForTimeout(60);
  await page.evaluate(async()=>{
    const {Game}=await import('./game.js'),{draw}=await import('./renderer.js'),{logicalPoint}=await import('./entities.js');
    document.querySelectorAll('.overlay').forEach(el=>el.hidden=true);document.querySelector('.edition').textContent='QA FIXTURE · FIELD CLEAR';
    const canvas=document.querySelector('#game'),g=new Game({sandbox:true,options:{motionEnabled:false}});g.shapes=[];
    for(let i=0;i<20;i++)g.addShape('triangle',180+(i%5)*130,160+Math.floor(i/5)*100,0,false,0);
    const chain=g.newChain();g.chains.get(chain).kills=19;const handler=e=>{const p=logicalPoint(e.clientX,e.clientY,canvas.getBoundingClientRect()),s=g.alive.find(s=>Math.hypot(s.x-p.x,s.y-p.y)<=s.radius);if(s){g.enqueue(s,3,{source:'direct',chainId:chain,depth:0});g.flush();draw(canvas.getContext('2d'),g);}};
    canvas.addEventListener('pointerdown',handler);window.m9Fixture=g;
  });
  for(let i=0;i<20;i++){const p=await point({x:180+(i%5)*130,y:160+Math.floor(i/5)*100});await page.mouse.click(p.x,p.y);}
  assert.equal(await page.evaluate(()=>window.m9Fixture.presentation.clearCount),1);
  await page.screenshot({path:'artifacts/m9-0-fixture-chain-field-clear.png',fullPage:true});
  assert.deepEqual(errors,[]);writeFileSync('artifacts/m9-0-browser-results.json',JSON.stringify({passed:true,browser:await browser.version(),layouts,runs,errors,fixtures:'Rank4 and controlled Chain20/FieldClear are isolated QA fixtures. Human feel not measured.'},null,2));
  console.log('M9.0 browser PASS:24 layouts,4 actual20s pointer runs,Chain/FieldClear fixture');
}catch(e){writeFileSync('artifacts/m9-0-browser-results.json',JSON.stringify({passed:false,layouts,runs,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
