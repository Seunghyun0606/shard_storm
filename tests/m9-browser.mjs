import{createRequire}from'node:module';import{writeFileSync}from'node:fs';import assert from'node:assert/strict';
const{chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],runs=[],base=process.env.QA_BASE_URL||'http://127.0.0.1:4174';
try{
 const context=await browser.newContext({viewport:{width:1560,height:1000},deviceScaleFactor:2}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const snap=()=>page.evaluate(()=>window.shardStorm.snapshot());
 const point=async s=>{const b=await page.locator('#game').boundingBox();return{x:b.x+s.x*b.width/960,y:b.y+s.y*b.height/540};};
 for(const rank of [0,1,2,3]){
  await page.goto(base);await page.evaluate(async rank=>{const{freshSave}=await import('./storage.js'),{CONFIG:C}=await import('./config.js');const s=freshSave();if(rank){s.lifetimeDestroyed=C.discovery[rank].threshold;s.discoveryRank=rank;s.bank=10000;s.catalystBalance=200;for(const[k,u]of Object.entries(C.upgrades))if(k!=='extraTime'&&(u.rank||0)<=rank)s.levels[k]=u.max;}localStorage.setItem(C.storageKey,JSON.stringify(s));},rank);await page.reload();
  if(rank)await page.locator('.edition').evaluate(el=>el.append(' · QA FIXTURE'));
  if(rank===2)await page.locator('#focus').click();const before=await snap();assert.equal(before.saveVersion,6);
  await page.locator('#start').click();const p=await point({x:480,y:335});await page.mouse.click(p.x,p.y);await page.mouse.down();const seen=new Set();let captured=false;
  while((await snap()).state==='PLAYING'){
   const live=await snap();for(const s of live.shapes)seen.add(s.type);const target=live.shapes.filter(s=>s.grace<=0).sort((a,b)=>Number(Boolean(b.secondaryTrait))-Number(Boolean(a.secondaryTrait))||a.hp-b.hp||a.id-b.id)[0];
   if(target){const p=await point(target);await page.mouse.move(p.x,p.y);}if(live.elapsed>9&&!captured){await page.screenshot({path:`artifacts/m9-rank${rank}-playing.png`,fullPage:true});captured=true;}
   await page.waitForTimeout(60);
  }
  await page.mouse.up();const pending=await snap();assert.equal(pending.record.ecologyEnabled,true);assert.equal(pending.record.echoRaw,0);
  if(rank===2){await page.reload();assert.equal((await snap()).bank,before.bank+pending.pendingSettlement.payout);const seenIntro=await page.evaluate(()=>JSON.parse(localStorage.getItem('shard-storm-v1')).shapeIntroSeen);for(const id of pending.record.introConsumed)assert.equal(seenIntro[id],true);await page.reload();assert.equal((await snap()).bank,before.bank+pending.pendingSettlement.payout);}
  else{if(await page.locator('#refinery-skip').isVisible())await page.locator('#refinery-skip').click();await page.waitForFunction(()=>window.shardStorm.snapshot().settled);assert.equal((await snap()).bank,before.bank+pending.pendingSettlement.payout);await page.setViewportSize({width:620,height:800});await page.locator('#again').scrollIntoViewIfNeeded();await page.screenshot({path:`artifacts/m9-rank${rank}-result.png`,fullPage:true});await page.locator('#again').click();assert.equal((await snap()).state,'PLAYING');await page.setViewportSize({width:1560,height:1000});}
  runs.push({rank,fixture:rank!==0,record:pending.record,seen:[...seen]});
 }
 // Isolated controllable combined fixture, still actual20s, native Canvas and real pointers.
 await page.goto(base);await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.waitForTimeout(60);
 await page.evaluate(async()=>{
  const{Game}=await import('./game.js'),{draw}=await import('./renderer.js'),{logicalPoint}=await import('./entities.js');document.querySelectorAll('.overlay').forEach(e=>e.hidden=true);document.querySelector('.edition').textContent='QA FIXTURE · ECOLOGY COMBINATION';
  const g=new Game({ecologyEnabled:true,discoveryRank:4,sandbox:true,options:{motionEnabled:false},levels:{crushPower:2}});g.shapes=[];g.queue=[];g.shards=[];
  const a=g.addShape('square',480,230,0,false,0),b=g.addShape('square',480,310,0,false,0);a.hp=b.hp=2;
  g.addShape('conductor',400,270,0,false,0);g.addShape('repairNode',570,270,0,false,0);g.addShape('fuseBomb',310,270,0,false,0);g.addShape('splitter',190,270,0,false,0);g.addShape('mirror',735,220,0,false,0);g.addShape('gravityWell',820,300,0,false,0);g.addShape('triangle',650,220,0,false,0);
  const canvas=document.querySelector('#game');let held=false,pointer=null,clock=0;
  canvas.addEventListener('pointerdown',e=>{pointer=logicalPoint(e.clientX,e.clientY,canvas.getBoundingClientRect());held=true;g.attack(pointer.x,pointer.y);clock=g.stats.attackInterval;});
  canvas.addEventListener('pointermove',e=>pointer=logicalPoint(e.clientX,e.clientY,canvas.getBoundingClientRect()));window.addEventListener('pointerup',()=>held=false);
  window.fixtureTimer=setInterval(()=>{if(g.state==='PLAYING'){clock-=1/60;if(held&&pointer&&clock<=0){g.attack(pointer.x,pointer.y);clock=g.stats.attackInterval;}g.update(1/60);}draw(canvas.getContext('2d'),g);},1000/60);window.m9Fixture=g;
 });
 await page.waitForTimeout(1100);await page.screenshot({path:'artifacts/m9-fixture-six-shapes.png',fullPage:true});
 for(const s of [{x:650,y:220},{x:190,y:270},{x:310,y:270},{x:400,y:270}]){const p=await point(s);await page.mouse.click(p.x,p.y);await page.waitForTimeout(130);}
 await page.mouse.down();while(await page.evaluate(()=>window.m9Fixture.state)==='PLAYING'){
  const target=await page.evaluate(()=>window.m9Fixture.alive.filter(s=>s.grace<=0).sort((a,b)=>a.hp-b.hp)[0]);if(target){const p=await point(target);await page.mouse.move(p.x,p.y);}await page.waitForTimeout(65);
 }
 await page.mouse.up();const fixture=await page.evaluate(()=>{clearInterval(window.fixtureTimer);return window.m9Fixture.record();});assert.equal(fixture.runDurationActual,20);assert.ok(fixture.ecologyCounts.repair>=2);assert.ok(fixture.ecologyCounts.fuseExploded>=1);runs.push({fixture:true,kind:'combined',record:fixture});
 assert.deepEqual(errors,[]);writeFileSync('artifacts/m9-browser-results.json',JSON.stringify({passed:true,browser:await browser.version(),runs,errors,humanFun:'not measured; Rank1..3 and controlled combination isolated fixtures, Rank0 natural'},null,2));console.log('M9 Chrome pointer QA PASS:5 actual20s runs');
}catch(e){writeFileSync('artifacts/m9-browser-results.json',JSON.stringify({passed:false,runs,errors,failure:e.stack},null,2));throw e;}finally{await browser.close();}
